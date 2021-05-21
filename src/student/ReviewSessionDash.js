import React, {useEffect, useState, useRef, Fragment} from 'react';
import {API} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {
	HOMEWORK_PROGRESS,
	UI_SCREEN_MODES,
	EMPTY_HOMEWORK,
	ALLOCATION_MESSAGES, EMPTY_REVIEW
} from "../app/constants";
import {Col, Container, Row} from "react-bootstrap";

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
import PeerHomeworkAssessor from "./homeworks/PeerHomeworkAssessor";
import PeerReviewsSummaryTable from "./homeworks/PeerReviewsSummaryTable";



// TODO: Allocation Changes 20-30
function ReviewSessionDash() {
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
	const [draftsToBeReviewedByUser, setDraftsToBeReviewedByUser] = useState([]);
	const [reviewsByUser, setReviewsByUser] = useState([]);

	const [homework, setHomework] = useState(null);

	const hasLoadedReviews = useRef(false);
	const hasLoadedStubs = useRef(false);
	const hasLoadedDrafts = useRef(false);
	const isDoingRefresh = useRef(false);

	// const [peerDraftIds, setPeerDraftIds] = useState(null);
	const [activelyReviewedPeerDraft, setActivelyReviewedPeerDraft] = useState(null);
	const [engagedPeerReviewId, setEngagedPeerReviewId] = useState(null);


	// const [reviewsForUser, setReviewsForUser] = useState([]);


	const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
	const draftAssignmentId = assignment.toolAssignmentData.sequenceIds[roundNum];



	async function fetchAndSetHomeworkStubs() {
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
	}

	async function fetchAndSetAllReviews() {
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
	}

	useEffect(() => {
		if (!hasLoadedReviews.current && !hasLoadedStubs.current) {

			// 1. Fetch ids of all completed homework from the previous draft-writing assignment and all reviews created for them
			fetchAndSetHomeworkStubs();
			fetchAndSetAllReviews();
		}
		else if (hasLoadedReviews.current && hasLoadedStubs.current || isDoingRefresh.current) {
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
				let targetDraftId = nextDraftIdToReview();

				if (!targetDraftId) {
					setAllocationMsg(ALLOCATION_MESSAGES.noneAvailableForThisUser);
					return;
				}

				// 4. Create the new review. Save it to DB. Add it to redux store (no need to re-fetch)
				let freshReview = createAndSaveNewReviewToDB(targetDraftId);
				theUserReviews = [...theUserReviews, freshReview];
			}

			setReviewsByUser(theUserReviews);
		}
	}, [hasLoadedReviews.current, hasLoadedStubs.current, isDoingRefresh.current]);


	useEffect(() => {
		// 5. Once we have a list of reviewsByUser, we now must load in the associated homeworks that this
		// student user has reviewed or has yet to review
		if (hasLoadedDrafts.current || allocationMsg || !reviewsByUser?.length) return;

		fetchAndSetDraftsToBeReviewedByUser();
	}, [reviewsByUser, allocationMsg])


	useEffect(() => {
		let theUserReviews = allReviews.filter(a => a.assessorId === activeUser.id);
		setReviewsByUser(theUserReviews);
		if (theUserReviews.every(r => r.submittedOnDate)) isDoingRefresh.current = true;
	}, [allReviews])


	async function createAndSaveNewReviewToDB(homeworkId) {
		console.warn("createAndSaveNewReviewToDB for this student.")
		const freshReview = Object.assign({}, EMPTY_REVIEW, {
			id: uuid(),
			beganOnDate: moment().valueOf(),
			homeworkId,
			assessorId: activeUser.id,
			assignmentId: draftAssignmentId
		});

		await API.graphql({query: createReview, variables: {input: freshReview}});
		await dispatch(setReviews([...allReviews, freshReview]));
		return freshReview;
	}


	function nextDraftIdToReview() {
		// Map out how many times each of these HAVE been allocated
		// TODO: We may need to track if reviews have been completed to allow those with non-submitted reviews to get submissions?

		const reviewsByUserAsHomeworkIds = new Set(reviewsByUser.map(r => r.homeworkId));
		let lowestTierCount = 10000; // 10,000 is arbitrary high number greater than size of any likely cohort
		let highestTierCount = 0;

		// Filter out drafts that have already been assessed by this user
		let peerStubs = allHomeworkStubs.filter(hs => hs.studentOwnerId !== activeUser.id);
		let lotteryStubs = peerStubs.filter(ps => !reviewsByUserAsHomeworkIds.has(ps.id));

		lotteryStubs = lotteryStubs.map(ls => {
			let totalReviewsForDraft = allReviews.filter(r => r.homeworkId === ls.id).length;
			lowestTierCount = Math.min(lowestTierCount, totalReviewsForDraft);
			highestTierCount = Math.max(highestTierCount, totalReviewsForDraft);
			return ({...ls, totalReviewsForDraft});
		});

		let targetStub = null;
		let tierCount = lowestTierCount;
		while (!targetStub && tierCount <= highestTierCount) {
			const tierOnlyLotteryStubs = lotteryStubs.filter(ls => (ls.totalReviewsForDraft === lowestTierCount));

			// Randomly select the one of the remaining and assign it to this user.
			if (tierOnlyLotteryStubs.length) {
				targetStub = tierOnlyLotteryStubs[Math.floor(Math.random() * (tierOnlyLotteryStubs.length - 1))]
				return targetStub.id;
			}
			tierCount++;
		}

		return null;
	}





	async function fetchAndSetDraftsToBeReviewedByUser() {
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
			hasLoadedReviews.current = true;
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetchAndSetDraftsToBeReviewedByUser.`);
		}
	}


	async function fetchAndSetActiveUserCurrentHomework() {
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
					beganOnDate: moment().valueOf(),
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
	}

	function handleEditButton() {
		console.log("handleEditButton() called")
		const uiMode = (homework.submittedOnDate) ? UI_SCREEN_MODES.reviewHomework : UI_SCREEN_MODES.editHomework;
		dispatch(setActiveUiScreenMode(uiMode));
	}

	function handleReviewButton() {
		console.log("handleReviewButton() called")
		// const uiMode = (homework.submittedOnDate) ? UI_SCREEN_MODES.reviewHomework : UI_SCREEN_MODES.editHomework;
		// dispatch(setActiveUiScreenMode(uiMode));
	}

	// function onReviewUpdated(reviewData) {
	// 	let altReviewsByUser = [...reviewsByUser];
	// 	let i = altReviewsByUser.findIndex(r => r.id = engagedPeerReviewId);
	// 	altReviewsByUser.splice(i, 1, reviewData);
	// 	setReviewsByUser(altReviewsByUser);
	// }

	function onReviewPeerDraft(peerDraftId) {
		console.log("onReviewPeerDraft() called");
		const theActiveReview = reviewsByUser.find(r => r.homeworkId = peerDraftId);
		setActivelyReviewedPeerDraft(draftsToBeReviewedByUser.find(d => d.id = theActiveReview.homeworkId));
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
						{/*<table className="table student-assignment-drafts">*/}
						{/*	<thead className='border-top-0'>*/}
						{/*	<tr className='draft-table-row'>*/}
						{/*		<th scope="col" className='border-top-0'/>*/}
						{/*		<th scope="col" className='border-top-0'>Version</th>*/}
						{/*		<th scope="col" className='border-top-0'>Due Date</th>*/}
						{/*		<th scope="col" className='border-top-0'>Reviews</th>*/}
						{/*		<th scope="col" className='border-top-0'>Progress</th>*/}
						{/*		<th scope="col" className='border-top-0'/>*/}
						{/*	</tr>*/}
						{/*	</thead>*/}
						{/*	<tbody>*/}
						{/*	<tr className='draft-table-row'>*/}
						{/*		<td className='border-top-0'><img src={IconEssay} alt={''} className='inline-essay-icon'/></td>*/}
						{/*		<td className='border-top-0'>{homework.toolHomeworkData.title}</td>*/}
						{/*		<td className='border-top-0'>{moment(assignment.lockOnDate).format('MMM-DD-YY')}</td>*/}
						{/*		<td className='border-top-0'>none</td>*/}
						{/*		<td className='border-top-0'>{STATUS_TEXT[homework.homeworkStatus]}</td>*/}
						{/*		<td className='border-top-0'>*/}
						{/*			/!*<Button className="btn badge-pill essay-btn btn-outline-secondary" onClick={handleEditButton}>Edit Essay</Button>*!/*/}
						{/*			<Button value={DRAFT_BTN_LABELS[homework.homeworkStatus]}*/}
						{/*				className="btn badge-pill essay-btn btn-outline-secondary"*/}
						{/*				onClick={handleEditButton}>{DRAFT_BTN_LABELS[homework.homeworkStatus]}</Button>*/}
						{/*		</td>*/}
						{/*	</tr>*/}
						{/*	</tbody>*/}
						{/*</table>*/}
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
					<PeerHomeworkAssessor
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

			{/*{(activeUiScreenMode === UI_SCREEN_MODES.reviewHomework) &&*/}
			{/*<Row className={'m-0 m-0 pb-5'}>*/}
			{/*	<Col className='rounded p-0'>*/}
			{/*		<HomeworkReviewer*/}
			{/*			isEditMode={false}*/}
			{/*			refreshHandler={fetchAndSetActiveUserCurrentHomework}*/}
			{/*			assignment={assignment}*/}
			{/*			homework={activelyReviewedPeerDraft}/>*/}
			{/*	</Col>*/}
			{/*</Row>*/}
			{/*}*/}

			{(activeUiScreenMode === UI_SCREEN_MODES.editHomework) &&
			<HomeworkEngager refreshHandler={fetchAndSetActiveUserCurrentHomework} assignment={assignment} homework={homework}/>
			}
		</Container>
	);
}

export default ReviewSessionDash;

