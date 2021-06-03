import React, {useEffect, useState, useRef, Fragment, useCallback} from 'react';
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

import {createHomework, createReview} from "../graphql/mutations";
import {
	setActiveUiScreenMode, setHomeworkStubs, setReviews,
} from "../app/store/appReducer";
import HomeworkEngager from "./homeworks/HomeworkEngager";
import {fetchGradeForStudent} from "../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../tool/ToolUtils";
import moment from "moment";
import {reportError} from "../developer/DevUtils";

import './homeworks/homeworks.scss';
import HomeworkAssessor from "./homeworks/HomeworkAssessor";
import PeerReviewsSummaryTable from "./homeworks/PeerReviewsSummaryTable";
import AssessedHomeworkViewer from "./homeworks/AssessedHomeworkViewer";


function ReviewSessionDash() {
	// const dispatch = useCallback(useDispatch, []);
	const dispatch = useDispatch();
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);

	// const draftsToBeReviewedByUser = useSelector((state => state.app.draftsToBeReviewedByUser));
	// const reviewedStudentId = useSelector(state => state.app.currentlyReviewedStudentId);

	const activeUser = useSelector(state => state.app.activeUser);
	const assignment = useSelector(state => state.app.assignment);
	const allReviews = useSelector(state => state.app.reviews);
	const allHomeworkStubs = useSelector(state => state.app.homeworkStubs);

	const [allocationMsg, setAllocationMsg] = useState('');

	const [usersDraft, setUsersDraft] = useState(null);
	const [draftsToBeReviewedByUser, setDraftsToBeReviewedByUser] = useState();
	const [reviewsByUser, setReviewsByUser] = useState([]);
	const [reviewsForUser, setReviewsForUser] = useState([]);

	const [homework, setHomework] = useState(null);

	const hasLoadedReviews = useRef(false);
	const hasLoadedStubs = useRef(false);
	const hasLoadedDrafts = useRef(false);
	const isDoingRefresh = useRef(false);

	const [activelyReviewedPeerDraft, setActivelyReviewedPeerDraft] = useState(null);
	const [engagedPeerReviewId, setEngagedPeerReviewId] = useState(null);
	const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
	const draftAssignmentId = assignment.toolAssignmentData.sequenceIds[roundNum];


	const createAndSaveNewReviewToDB = useCallback(async (homeworkId, activeUserId, allReviews) => {
		console.warn("createAndSaveNewReviewToDB for this student.")
		const freshReview = Object.assign({}, EMPTY_REVIEW, {
			id: uuid(),
			beganOnDate: 0, //moment().valueOf(),
			homeworkId,
			assessorId: activeUserId,
			assignmentId: draftAssignmentId
		});

		await API.graphql({query: createReview, variables: {input: freshReview}});
		await dispatch(setReviews([...allReviews, freshReview]));
		return freshReview;
	}, [dispatch, draftAssignmentId]);

	const fetchAndSetHomeworkStubs = useCallback(async () => {
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
			hasLoadedStubs.current = true;
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetch homework stubs.`);
		}
	}, [dispatch, draftAssignmentId]);

	const fetchAndSetAllReviews = useCallback(async () => {
		let nextTokenVal = null;
		let theReviews = [];

		try {
			do {
				const result = await API.graphql({
					query: reviewsByAsmntId,
					variables: {
						assignmentId: draftAssignmentId
					},
					nextToken: nextTokenVal
				});

				nextTokenVal = result.data.reviewsByAsmntId.nextToken;
				theReviews.push(...result.data.reviewsByAsmntId.items);
			} while (nextTokenVal);

			dispatch(setReviews([...theReviews]));
			hasLoadedReviews.current = true;
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetch all peer review records.`);
		}
	}, [dispatch, draftAssignmentId]);

	const fetchAndSetDraftsToBeReviewedByUser = useCallback(async () => {
		// Get all of the allocated homeworks and sort them according to indexed order of the allocations list
		const relatedHomeworkIds = [...reviewsByUser.map(r => r.homeworkId), allHomeworkStubs.find(hs => hs.studentOwnerId === activeUser.id).id];
		const filterIdsArr = relatedHomeworkIds.map(a => ({id: {eq: a}}));

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

			setUsersDraft(allRelatedHomeworks.find(h => h.studentOwnerId === activeUser.id));
			setDraftsToBeReviewedByUser(allRelatedHomeworks.filter(h => h.studentOwnerId !== activeUser.id));
			hasLoadedDrafts.current = true;
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetchAndSetDraftsToBeReviewedByUser.`);
		}
	}, [activeUser.id, allHomeworkStubs, reviewsByUser])

	const fetchAndSetActiveUserCurrentHomework = useCallback(async () => {
		try {
			const fetchHomeworkResult = await API.graphql({
				query: fullHomeworkByAsmntAndStudentId,
				variables: {
					studentOwnerId: {eq: activeUser.id},
					assignmentId: assignment.id
				},
			});

			if (!fetchHomeworkResult.data.fullHomeworkByAsmntAndStudentId.items?.length) {
				console.warn("NO homework exists for this student. Attempting to create.")
				const freshHomework = Object.assign({}, EMPTY_HOMEWORK, {
					id: uuid(),
					beganOnDate: 0, //moment().valueOf(),
					studentOwnerId: activeUser.id,
					assignmentId: assignment.id
				});
				const resultHomework = await API.graphql({query: createHomework, variables: {input: freshHomework}});
				console.warn("Successful in creating homework for this student");

				await setHomework({
					...resultHomework.data.createHomework,
					scoreGiven: 0,
					homeworkStatus: HOMEWORK_PROGRESS.notBegun,
					comment: ''
				})
				dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.showStudentDashboard));
			} else {
				const theHomework = fetchHomeworkResult.data.fullHomeworkByAsmntAndStudentId.items[0];
				let scoreData = await fetchGradeForStudent(assignment.id, activeUser.id);
				if (!scoreData) scoreData = {scoreGiven: 0, gradingProgress: HOMEWORK_PROGRESS.notBegun, comment: ''};

				theHomework.homeworkStatus = getHomeworkStatus(scoreData, theHomework);
				await setHomework(theHomework);

				dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.showStudentDashboard));
			}
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetch your current assignment. Please wait a moment and try again.`);
		}
	}, [dispatch, activeUser.id, assignment.id]);

	const nextDraftIdToReview = useCallback((activeUserId, allHomeworkStubs, allReviews, reviewsByUser) => {
		// Map out how many times each of these HAVE been allocated
		// TODO: We may need to track if reviews have been completed to allow those with non-submitted reviews to get submissions?

		const reviewsByUserAsHomeworkIds = new Set(reviewsByUser.map(r => r.homeworkId));
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
		if (!hasLoadedReviews.current && !hasLoadedStubs.current) {
			// 1. Fetch ids of all completed homework from the previous draft-writing assignment and all reviews created for them
			fetchAndSetHomeworkStubs();
			fetchAndSetAllReviews();
		} else if ((hasLoadedReviews.current && hasLoadedStubs.current) || (isDoingRefresh.current)) {
			// 2. Once all homeworkStubs and allReviews are in redux store, we look for active review this student is working on
			isDoingRefresh.current = false;
			let theUserReviews = allReviews.filter(a => a.assessorId === activeUser.id);
			let theActiveReview = theUserReviews.find(a => !a.submittedOnDate);

			// 2A. If user didn't complete previous homework, they are not allowed to review
			const userDraft = allHomeworkStubs.find(hs => hs.studentOwnerId === activeUser.id);
			if (!userDraft || !userDraft.submittedOnDate) {
				setAllocationMsg(ALLOCATION_MESSAGES.userDidNotSubmit);
				return;
			}

			// 2B. If not enough submissions are available, notify user and exit
			if (allHomeworkStubs.length < assignment.toolAssignmentData.minPeersBeforeAllocating) {
				setAllocationMsg(ALLOCATION_MESSAGES.notEnoughSubmissions);
				return;
			}

			if (!theActiveReview && theUserReviews.length < assignment.toolAssignmentData.minReviewsRequired) {
				// 3. The user has no active review and needs to be assigned one
				let targetDraftId = nextDraftIdToReview(activeUser.id, allHomeworkStubs, allReviews, theUserReviews);

				if (!targetDraftId) {
					setAllocationMsg(ALLOCATION_MESSAGES.noneAvailableForThisUser);
					return;
				}

				// 4. Create the new review. Save it to DB. Add it to redux store (no need to re-fetch)
				let freshReview = createAndSaveNewReviewToDB(targetDraftId, activeUser.id, allReviews);
				theUserReviews = [...theUserReviews, freshReview];
			}

			// TODO: ************************************************
			// The problem is `theUserReviews` is a PROMISE
			console.log("Step 1-4: theUserReviews", theUserReviews);
			setReviewsByUser(theUserReviews);
			const tempReviewsForUser = allReviews.filter(r => r.homeworkId === userDraft.id && r.submittedOnDate);
			tempReviewsForUser.sort((a, b) => (b.assessorId === assignment.ownerId) ? 1 : (a.submittedOnDate - b.submittedOnDate));
			setReviewsForUser(tempReviewsForUser);
		}
	}, [activeUser.id, allHomeworkStubs, allReviews, assignment, createAndSaveNewReviewToDB, fetchAndSetAllReviews, fetchAndSetHomeworkStubs, nextDraftIdToReview]);


	useEffect(() => {
		// 5. Once we have a list of reviewsByUser, we now must load in the associated homeworks that this
		// student user has reviewed or has yet to review
		if (hasLoadedDrafts.current || allocationMsg || !reviewsByUser?.length) return;

		fetchAndSetDraftsToBeReviewedByUser();
	}, [reviewsByUser, allocationMsg, fetchAndSetDraftsToBeReviewedByUser])


	/*
	* Check hasLoadedReviews && hasLoadedStubs. If they are BOTH FALSE (aren't loaded), load them now.
	* Once both are loaded successfully, set this them to TRUE. These should never need to be loaded again.
	*
	*
	*
	* */

	function onSeeReviewsByPeers() {
		console.log("onSeeReviewsByPeers() called");
		setEngagedPeerReviewId(reviewsForUser[0].id);
		dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssessedHomework));
	}

	function onShowReview(reviewId) {
		setEngagedPeerReviewId(reviewId);
		dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssessedHomework));
	}

	//
	// function handleReviewButton() {
	// 	console.log("handleReviewButton() called")
	// 	// const uiMode = (homework.submittedOnDate) ? UI_SCREEN_MODES.reviewHomework : UI_SCREEN_MODES.editHomework;
	// 	// dispatch(setActiveUiScreenMode(uiMode));
	// }

	// function onReviewUpdated(reviewData) {
	// 	let altReviewsByUser = [...reviewsByUser];
	// 	let i = altReviewsByUser.findIndex(r => r.id = engagedPeerReviewId);
	// 	altReviewsByUser.splice(i, 1, reviewData);
	// 	setReviewsByUser(altReviewsByUser);
	// }

	function onReviewPeerDraft(peerDraftId) {
		const theActiveReview = reviewsByUser.find(r => r.homeworkId === peerDraftId);
		setActivelyReviewedPeerDraft(draftsToBeReviewedByUser.find(d => d.id === theActiveReview.homeworkId));
		setEngagedPeerReviewId(theActiveReview.id);
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
								<td className='border-top-0'>{reviewsForUser.length}</td>
								<td className='border-top-0'>
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
			</Fragment>
			}

			{(activeUiScreenMode === UI_SCREEN_MODES.assessPeerHomework) &&
			<Row className={'m-0 p-0 h-100'}>
				<Col className='rounded p-0'>
					<HomeworkAssessor
						isInstructorAssessment={false}
						key={activelyReviewedPeerDraft.id}
						assignment={assignment}
						excessHeight={0}
						homework={activelyReviewedPeerDraft}
						review={reviewsByUser.find(r => r.id === engagedPeerReviewId)}
						// onReviewUpdated={onReviewUpdated}
					/>
				</Col>
			</Row>

				// old
				// <Row className={'m-0 p-0 h-100'}>
				// 	<Col className='rounded p-0'>
				// 		<PeerHomeworkAssessor
				// 			isEditMode={false}
				// 			refreshHandler={fetchAndSetActiveUserCurrentHomework}
				// 			assignment={assignment}
				// 			homework={activelyReviewedPeerDraft}/>
				// 	</Col>
				// </Row>
			}

			{(activeUiScreenMode === UI_SCREEN_MODES.viewAssessedHomework) &&
			<Row className={'m-0 m-0 pb-5'}>
				<Col className='rounded p-0'>
					<AssessedHomeworkViewer
						isInstructorAssessment={false}
						key={engagedPeerReviewId}
						assignment={assignment}
						excessHeight={0}
						reviewsForUser={reviewsForUser}
						homework={usersDraft}
						engagedPeerReviewId={engagedPeerReviewId}
						onShowReview={onShowReview}
					/>
					{/*<HomeworkReviewer*/}
					{/*	isEditMode={false}*/}
					{/*	refreshHandler={fetchAndSetActiveUserCurrentHomework}*/}
					{/*	assignment={assignment}*/}
					{/*	homework={activelyReviewedPeerDraft}/>*/}
				</Col>
			</Row>
			}

			{(activeUiScreenMode === UI_SCREEN_MODES.editHomework) &&
			<HomeworkEngager refreshHandler={fetchAndSetActiveUserCurrentHomework} assignment={assignment}
				homework={homework}/>
			}
		</Container>
	);
}

export default ReviewSessionDash;

