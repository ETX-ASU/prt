import React, {useEffect, useState, Fragment, useCallback} from 'react';
import {API} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";
import IconEssay from "../assets/icon-essay.svg";

import {
	HOMEWORK_PROGRESS,
	UI_SCREEN_MODES,
	EMPTY_HOMEWORK,
	ALLOCATION_MESSAGES, EMPTY_REVIEW
} from "../app/constants";
import {Col, Container, Row, Button} from "react-bootstrap";

import {
	fullHomeworkByAsmntAndStudentId,
	minHomeworkIdsBySubmittedDate,
} from "../graphql/customQueries";
import {
	listHomeworks,
	reviewsByAsmntId,
} from "../graphql/queries";

import {createHomework, createReview, updateHomework} from "../graphql/mutations";
import {
	setActiveUiScreenMode, setActiveUsersReviewedDraft, setDraftsToBeReviewedByUser, setHomeworkStubs, setReviews,
} from "../app/store/appReducer";

import {fetchGradeForStudent} from "../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../tool/ToolUtils";
import moment from "moment";
import {reportError} from "../developer/DevUtils";

import './homeworks/homeworks.scss';
import HomeworkAssessor from "./homeworks/HomeworkAssessor";
import PeerReviewsSummaryTable from "./homeworks/PeerReviewsSummaryTable";
import AssessedHomeworkViewer from "./homeworks/AssessedHomeworkViewer";


function ReviewSessionDash() {
	const dispatch = useDispatch();
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);
	const activeUser = useSelector(state => state.app.activeUser);
	const assignment = useSelector(state => state.app.assignment);
	const allReviews = useSelector(state => state.app.reviews);
	const allHomeworkStubs = useSelector(state => state.app.homeworkStubs);
	const reviewsByUser = useSelector(state => state.app.reviewsByUser)
	const submittedReviewsForUser = useSelector(state => state.app.submittedReviewsForUser)
	const activeUsersReviewedDraftStub = useSelector(state => state.app.activeUsersReviewedDraftStub)
	const activeUsersReviewedDraft = useSelector(state => state.app.activeUsersReviewedDraft)
	const draftsToBeReviewedByUser = useSelector(state => state.app.draftsToBeReviewedByUser)

	const [allocationMsg, setAllocationMsg] = useState('');
	const [reviewSessionHomework, setReviewSessionHomework] = useState(null);
	const [activelyReviewedPeerDraft, setActivelyReviewedPeerDraft] = useState(null);
	const [engagedPeerReviewId, setEngagedPeerReviewId] = useState(null);
	const [showInstructionsAlert, setShowInstructionsAlert] = useState(false);

	const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
	const draftAssignmentId = assignment.toolAssignmentData.sequenceIds[roundNum];


	const fetchAndSetActiveUserReviewSessionHomework = useCallback(async () => {
		try {
			const fetchHomeworkResult = await API.graphql({
				query: fullHomeworkByAsmntAndStudentId,
				variables: {
					studentOwnerId: {eq: activeUser.id},
					assignmentId: assignment.id
				},
			});

			if (!fetchHomeworkResult.data.fullHomeworkByAsmntAndStudentId.items?.length) {
				const freshHomework = Object.assign({}, EMPTY_HOMEWORK, {
					id: uuid(),
					beganOnDate: 0,
					studentOwnerId: activeUser.id,
					assignmentId: assignment.id
				});
				const resultHomework = await API.graphql({query: createHomework, variables: {input: freshHomework}});

				await setReviewSessionHomework({
					...resultHomework.data.createHomework,
					scoreGiven: 0,
					homeworkStatus: HOMEWORK_PROGRESS.notBegun,
					comment: ''
				})
			} else {
				const theHomework = fetchHomeworkResult.data.fullHomeworkByAsmntAndStudentId.items[0];
				let scoreData = await fetchGradeForStudent(assignment.id, activeUser.id);
				if (!scoreData) scoreData = {scoreGiven: 0, gradingProgress: HOMEWORK_PROGRESS.notBegun, comment: ''};

				theHomework.homeworkStatus = getHomeworkStatus(scoreData, theHomework);
				await setReviewSessionHomework(theHomework);
			}
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetch your current assignment. Please wait a moment and try again.`);
		}
	}, [activeUser.id, assignment.id]);

	const getNextDraftIdToReview = useCallback((activeUserId, allHomeworkStubs, allReviews) => {
		// Map out how many times each of these HAVE been allocated
		// TODO: We may need to track if reviews have been completed to allow those with non-submitted reviews to get submissions?
		const reviewsByUserAsHomeworkIds = new Set(allReviews.filter(r => r.assessorId === activeUserId).map(r => r.homeworkId));
		let lowestTierCount = 10000; // 10,000 is arbitrary high number greater than size of any likely cohort
		let highestTierCount = 0;

		// Filter out drafts that have already been assessed by this user
		let peerStubs = allHomeworkStubs.filter(hs => hs.studentOwnerId !== activeUserId);
		let lotteryStubs = peerStubs.filter(ps => !reviewsByUserAsHomeworkIds.has(ps.id));

		lotteryStubs = lotteryStubs.map(ls => {
			let totalReviewsForDraft = allReviews.filter(r => r.homeworkId === ls.id).length;
			lowestTierCount = Math.min(lowestTierCount, totalReviewsForDraft);
			highestTierCount = Math.max(highestTierCount, totalReviewsForDraft);
			return ({...ls, totalReviewsForDraft});
		});

		const tierFilter = (stub) => stub.totalReviewsForDraft === lowestTierCount;
		let targetStub = null;
		let tierCount = lowestTierCount;
		let tierOnlyLotteryStubs = [];
		while (!targetStub && tierCount <= highestTierCount) {
			tierOnlyLotteryStubs = lotteryStubs.filter(tierFilter);
			// tierOnlyLotteryStubs = lotteryStubs.filter(ls => (ls.totalReviewsForDraft === lowestTierCount));

			// Randomly select the one of the remaining and assign it to this user.
			if (tierOnlyLotteryStubs.length) {
				targetStub = tierOnlyLotteryStubs[Math.floor(Math.random() * (tierOnlyLotteryStubs.length - 1))]
				return targetStub.id;
			}
			tierCount++;
		}

		return null;
	}, []);

	useEffect(() => {
		fetchAndSetActiveUserReviewSessionHomework();
	}, [fetchAndSetActiveUserReviewSessionHomework])

	useEffect(() => {
		const fetchAndSetHomeworkStubs = async () => {
			let nextTokenVal = null;
			let stubs = [];

			try {
				do {
					const stubResults = await API.graphql({
						query: minHomeworkIdsBySubmittedDate,
						variables: {
							submittedOnDate: {gt: 0},
							assignmentId: draftAssignmentId,
							nextToken: nextTokenVal
						},
					});

					nextTokenVal = stubResults.data.minHomeworkIdsBySubmittedDate.nextToken;
					stubs.push(...stubResults.data.minHomeworkIdsBySubmittedDate.items);
				} while (nextTokenVal);

				dispatch(setHomeworkStubs(stubs));
				// hasLoadedStubs.current = true
			} catch (error) {
				reportError(error, `We're sorry. There was an error while attempting to fetch homework stubs.`);
			}
		};

		const fetchAndSetAllReviews = async () => {
			let nextTokenVal = null;
			let theReviews = [];

			try {
				do {
					const result = await API.graphql({
						query: reviewsByAsmntId,
						variables: {
							assignmentId: assignment.id
						},
						nextToken: nextTokenVal
					});

					nextTokenVal = result.data.reviewsByAsmntId.nextToken;
					theReviews.push(...result.data.reviewsByAsmntId.items);
				} while (nextTokenVal);

				await dispatch(setReviews([...theReviews]));
			} catch (error) {
				reportError(error, `We're sorry. There was an error while attempting to fetch all peer review records.`);
			}
		}

		const createAndSaveNewReviewToDB = async (homeworkId, activeUserId, allReviews) => {
			const freshReview = Object.assign({}, EMPTY_REVIEW, {
				id: uuid(),
				beganOnDate: 0,
				homeworkId,
				assessorId: activeUserId,
				assignmentId: assignment.id
			});

			await API.graphql({query: createReview, variables: {input: freshReview}});
			await dispatch(setReviews([...allReviews, freshReview]));
			return freshReview;
		}


		if (!allReviews && !allHomeworkStubs) {
			// 1. Fetch ids of all completed homework from the previous draft-writing assignment and all reviews created for them
			fetchAndSetHomeworkStubs();
			fetchAndSetAllReviews();
		} else if (allReviews && allHomeworkStubs) {

			// 2. Once all homeworkStubs and allReviews are in redux store, we look for active review this student is working on
			let theActiveReview = reviewsByUser?.find(a => !a.submittedOnDate);
			if (theActiveReview) return;

			// 2A. If user didn't complete previous homework, they are not allowed to review
			if (!activeUsersReviewedDraftStub?.submittedOnDate) {
				setAllocationMsg(ALLOCATION_MESSAGES.userDidNotSubmit);
				return;
			}

			// 2B. If not enough submissions are available, notify user and exit
			if (!allHomeworkStubs?.length || allHomeworkStubs.length < assignment.toolAssignmentData.minPeersBeforeAllocating) {
				setAllocationMsg(ALLOCATION_MESSAGES.notEnoughSubmissions);
				return;
			}

			if (!theActiveReview && (!reviewsByUser || reviewsByUser?.length < assignment.toolAssignmentData.minReviewsRequired)) {
				// 3. The user has no active review and needs to be assigned one
				let targetDraftId = getNextDraftIdToReview(activeUser.id, allHomeworkStubs, allReviews);

				if (!targetDraftId) {
					setAllocationMsg(ALLOCATION_MESSAGES.noneAvailableForThisUser);
					return;
				}

				// 4. Create the new review. Save it to DB. Add it to redux store (no need to re-fetch)
				createAndSaveNewReviewToDB(targetDraftId, activeUser.id, allReviews);
			}
		}
		// TODO: re-examine these dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allReviews, allHomeworkStubs])

	useEffect(() => {
		// 5. Once loadedDrafts are ready, we now must load in the associated homeworks that this student user has reviewed or has yet to review
		const fetchAndSetDraftsToBeReviewedByUser = async () => {
			// Get all of the allocated homeworks and sort them according to indexed order of the allocations list
			const relatedHomeworkIds = (activeUsersReviewedDraftStub) ? [...reviewsByUser.map(r => r.homeworkId), activeUsersReviewedDraftStub.id] : [...reviewsByUser.map(r => r.homeworkId)];
			const filterIdsArr = relatedHomeworkIds.map(a => ({id: {eq: a}}));

			if (!relatedHomeworkIds?.length) {
				setAllocationMsg(ALLOCATION_MESSAGES.userDidNotSubmit);
				return;
			}

			try {
				let nextTokenVal = null;
				let allRelatedHomeworks = [];

				do {
					const homeworkQueryResults = await API.graphql({
						query: listHomeworks,
						variables: {
							filter: {or: filterIdsArr},
							nextToken: nextTokenVal
						},
					});

					nextTokenVal = homeworkQueryResults.data.listHomeworks.nextToken;
					allRelatedHomeworks.push(...homeworkQueryResults.data.listHomeworks.items);
				} while (nextTokenVal);

				await dispatch(setDraftsToBeReviewedByUser(allRelatedHomeworks.filter(h => h.studentOwnerId !== activeUser.id)));
				await dispatch(setActiveUsersReviewedDraft(allRelatedHomeworks.find(h => h.studentOwnerId === activeUser.id)));
			} catch (error) {
				reportError(error, `We're sorry. There was an error while attempting to fetchAndSetDraftsToBeReviewedByUser.`);
			}
		}

		if (reviewsByUser && (!draftsToBeReviewedByUser || reviewsByUser?.length > draftsToBeReviewedByUser.length)) fetchAndSetDraftsToBeReviewedByUser();

		// TODO: re-examine these dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reviewsByUser, allHomeworkStubs])


	async function updateReviewSessionHomeworkProgress() {
		try {
			const freshHomework = Object.assign({}, reviewSessionHomework);
			delete freshHomework.createdAt;
			delete freshHomework.updatedAt;
			delete freshHomework.scoreGiven;
			delete freshHomework.homeworkStatus;
			delete freshHomework.comment;

			if (!reviewSessionHomework.beganOnDate) {
				freshHomework.beganOnDate = moment().valueOf();
			}
			await API.graphql({query: updateHomework, variables: {input: freshHomework}});
			await setReviewSessionHomework(Object.assign({}, freshHomework, {
				homeworkStatus: HOMEWORK_PROGRESS.inProgress,
				scoreGiven: reviewSessionHomework.scoreGiven,
				comment: reviewSessionHomework.comment
			}));
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to update review session homework status. Please wait a moment and try again.`);
		}
	}

	async function submitReviewSessionHomework() {
		try {
			const freshHomework = Object.assign({}, reviewSessionHomework, {submittedOnDate: moment().valueOf()});
			delete freshHomework.createdAt;
			delete freshHomework.updatedAt;
			delete freshHomework.homeworkStatus;
			await API.graphql({query: updateHomework, variables: {input: freshHomework}});
			freshHomework.homeworkStatus = HOMEWORK_PROGRESS.submitted;
			await setReviewSessionHomework(freshHomework);
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to update review session homework status. Please wait a moment and try again.`);
		}
	}


	// Why aren't we using "submittedReviewsForUser"
	function onSeeReviewsByPeers() {
		const revId = submittedReviewsForUser[0].id;
		setEngagedPeerReviewId(revId);
		dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssessedHomework));
	}

	function onShowReview(reviewId) {
		setEngagedPeerReviewId(reviewId);
		dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssessedHomework));
	}

	function onReviewPeerDraft(peerDraftId) {
		const theActiveReview = allReviews.find(r => r.homeworkId === peerDraftId && r.assessorId === activeUser.id);
		setActivelyReviewedPeerDraft(draftsToBeReviewedByUser.find(d => d.id === theActiveReview.homeworkId));
		setEngagedPeerReviewId(theActiveReview.id);
		setShowInstructionsAlert(theActiveReview.criterionRatings.length === 0);
		dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.assessPeerHomework));
	}

	return (
		<Container className='p-4 student-dashboard dashboard bg-white rounded h-100'>
			{activeUiScreenMode === UI_SCREEN_MODES.viewAssignment &&
			<Fragment>
				<Row className='m-0 p-0'>
					<Col className='rounded p-0'>
						<h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
						<p id='assignmentDescription' className='mt-0'>{assignment.summary}</p>
					</Col>
				</Row>
				<Row className='m-0 mb-3 p-0'>
					<Col className='m-0 p-0 col-12'>
						<h3>Reviews Received</h3>
					</Col>
				</Row>
				<Row className='panel-box p-2 m-0 mb-5 justify-content-center'>
					<Col className='p-0 col-12'>
						<table className="table student-assignment-drafts">
							<thead className='border-top-0'>
							<tr className='draft-table-row'>
								<th scope="col" className='border-top-0'/>
								<th scope="col" className='border-top-0'>Version</th>
								<th scope="col" className='border-top-0'>Title</th>
								<th scope="col" className='border-top-0'>Received</th>
								<th scope="col" className='border-top-0'/>
							</tr>
							</thead>
							<tbody>
							<tr className='draft-table-row'>
								<td className='border-top-0'><img src={IconEssay} alt={''} className='inline-essay-icon'/></td>
								<td className='border-top-0'>{['1st', '2nd', '3rd', '4th', '5th'][roundNum] + ' Draft'}</td>
								<td className='border-top-0'>Reviews of Your Work</td>
								<td className='border-top-0'>{(!submittedReviewsForUser) ? 0 : submittedReviewsForUser.length}</td>
								<td className='border-top-0 text-right'>
									<Button className="btn badge-pill essay-btn btn-outline-secondary" onClick={onSeeReviewsByPeers}>See
										Reviews Received</Button>
								</td>
							</tr>
							</tbody>
						</table>
					</Col>
				</Row>


				<Row className='m-0 mb-3 p-0'>
					<Col className='m-0 p-0 col-12'>
						<h3>Reviews To Give</h3>
					</Col>
				</Row>
				<Row className='panel-box p-2 m-0 mb-5 justify-content-center'>
					<Col className='m-0 p-0 col-12'>
						<PeerReviewsSummaryTable
							roundNum={roundNum}
							reviewsByUser={reviewsByUser}
							draftsToBeReviewedByUser={draftsToBeReviewedByUser}
							allocationMsg={allocationMsg}
							onReviewPeerDraft={onReviewPeerDraft}
						/>
					</Col>
				</Row>


				<Row className='m-0 mb-3 p-0'>
					<Col className='m-0 p-0 col-9'>
						{draftsToBeReviewedByUser?.length &&
						<Fragment>
							{reviewSessionHomework?.homeworkStatus === HOMEWORK_PROGRESS.notBegun &&
							<p>Begin reviewing your peer's work. When you have completed and submitted
								the {assignment.toolAssignmentData.minReviewsRequired} required
								peer reviews you will be able to submit your assessment assignment for grading.</p>
							}
							{reviewSessionHomework?.homeworkStatus === HOMEWORK_PROGRESS.inProgress &&
							(allReviews.filter(a => a.assessorId === activeUser.id).length < assignment.toolAssignmentData.minReviewsRequired) &&
							<p>You have completed {allReviews.filter(a => a.assessorId === activeUser.id).length - 1} of
								the {assignment.toolAssignmentData.minReviewsRequired} required peer reviews.
								You must complete and submit all {assignment.toolAssignmentData.minReviewsRequired} reviews before you
								will be able to submit your assessment assignment for grading.</p>
							}
							{reviewSessionHomework?.homeworkStatus === HOMEWORK_PROGRESS.inProgress &&
							(allReviews.filter(a => a.assessorId === activeUser.id).length >= assignment.toolAssignmentData.minReviewsRequired) &&
							<p>You have completed and submitted all of the required reviews! If you have no more changes to make,
								click the submit button
								to submit your assessment assignment for grading.</p>
							}
							{(reviewSessionHomework?.homeworkStatus === HOMEWORK_PROGRESS.submitted || reviewSessionHomework?.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded) &&
							(allReviews.filter(a => a.assessorId === activeUser.id).length >= assignment.toolAssignmentData.minReviewsRequired) &&
							<p>You have completed all of the required reviews and submitted your assessment assignment for
								grading.</p>
							}
						</Fragment>
						}
					</Col>
					<Col className='m-0 p-0 col-3 text-right'>
						{(!reviewSessionHomework || reviewSessionHomework?.homeworkStatus === HOMEWORK_PROGRESS.inProgress) &&
						<Button className="btn badge-pill essay-btn btn-outline-secondary"
							disabled={!reviewsByUser || (reviewsByUser?.length < assignment.toolAssignmentData.minReviewsRequired)}
							onClick={submitReviewSessionHomework}>Submit Assignment</Button>
						}
					</Col>
				</Row>

			</Fragment>
			}

			{(activeUiScreenMode === UI_SCREEN_MODES.assessPeerHomework) &&
			<Row className={'m-0 p-0 h-100'}>
				<Col className='rounded p-0'>
					<HomeworkAssessor
						onSubmit={() => updateReviewSessionHomeworkProgress()}
						isInstructorAssessment={false}
						key={activelyReviewedPeerDraft.id}
						assignment={assignment}
						excessHeight={showInstructionsAlert ? 76 : 42}
						homework={activelyReviewedPeerDraft}
						review={allReviews.find(r => r.id === engagedPeerReviewId)}
						// onReviewUpdated={onReviewUpdated}
					/>
				</Col>
			</Row>
			}

			{(activeUiScreenMode === UI_SCREEN_MODES.viewAssessedHomework) &&
			<Row className={'m-0 m-0'}>
				<Col className='rounded p-0'>
					<AssessedHomeworkViewer
						isInstructorAssessment={false}
						key={engagedPeerReviewId}
						assignment={assignment}
						excessHeight={32}
						reviewsForUser={submittedReviewsForUser}
						homework={activeUsersReviewedDraft}
						engagedPeerReviewId={engagedPeerReviewId}
						onShowReview={onShowReview}
					/>
				</Col>
			</Row>
			}

		</Container>
	);
}

export default ReviewSessionDash;

