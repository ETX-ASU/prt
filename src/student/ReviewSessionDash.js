import React, {useEffect, useState, Fragment} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {
	HOMEWORK_PROGRESS,
	UI_SCREEN_MODES,
	EMPTY_HOMEWORK,
	ALLOCATION_MESSAGES
} from "../app/constants";
import {Button, Col, Container, Row} from "react-bootstrap";

import {
	fullHomeworkByAsmntAndStudentId,
	minHomeworkIdsBySubmittedDate,
	listFullHomeworks
} from "../graphql/customQueries";

import {createHomework, updateAssignment as updateAssignmentMutation} from "../graphql/mutations";
import {setActiveUiScreenMode, setDraftsToBeReviewedByUser} from "../app/store/appReducer";
import HomeworkEngager from "./homeworks/HomeworkEngager";
import {fetchGradeForStudent, hasValidSession} from "../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../tool/ToolUtils";
import moment from "moment";
import {reportError} from "../developer/DevUtils";

import './homeworks/homeworks.scss';
import PeerReviewsSummaryTable from "./homeworks/PeerReviewsSummaryTable";
import PeerHomeworkAssessor from "./homeworks/PeerHomeworkAssessor";


function ReviewSessionDash() {
	const dispatch = useDispatch();
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);
	const draftsToBeReviewedByUser = useSelector((state => state.app.draftsToBeReviewedByUser));
	const activeUser = useSelector(state => state.app.activeUser);
	const assignment = useSelector(state => state.app.assignment);

	const [homework, setHomework] = useState(null);
	const [allocationMsg, setAllocationMsg] = useState('');
	const [peerDraftIds, setPeerDraftIds] = useState(null);
	const [activelyReviewedPeerDraft, setActivelyReviewedPeerDraft] = useState(null);

	useEffect(() => {
		// This is a Review Session Assignment so we must allocate and/or fetch homeworks to be reviewed by this user
		let userAllocations = assignment.toolAssignmentData.allocations.filter(a => a.assessorId === activeUser.id);
		let currentAllocation = userAllocations.find(a => !a.submittedOnDate) || null;

		// !!! If this user does NOT have an active (assigned but not-submitted-yet) allocation, try to procure a new allocation for them
		if (!currentAllocation && !peerDraftIds) fetchPeerDraftIds();
		fetchAndSetDraftsToBeReviewedByUser(userAllocations);
	}, []);


	useEffect(() => {
		// If there is a msg about why no allocations are available now, return
		if (allocationMsg || !peerDraftIds) return;

		let userAllocations = assignment.toolAssignmentData.allocations.filter(a => a.assessorId === activeUser.id);

		// If this user has not completed their prev draft, they can NOT review. Notify them and exit.
		if (!peerDraftIds.find(h => h.studentOwnerId === activeUser.id)) {
			setAllocationMsg(ALLOCATION_MESSAGES.userDidNotSubmit);
			return;
		}

		// If not enough submissions are available, notify user and exit
		if (peerDraftIds.length < assignment.toolAssignmentData.minPeersBeforeAllocating) {
			setAllocationMsg(ALLOCATION_MESSAGES.notEnoughSubmissions);
			return;
		}

		const peerCompletedDraftIds = peerDraftIds.filter(h => h.studentOwnerId !== activeUser.id);
		const newAllocation = getNewAllocationForUser(peerCompletedDraftIds, userAllocations);
		if (!newAllocation) {
			setAllocationMsg(ALLOCATION_MESSAGES.noneAvailableForThisUser);
		} else {
			userAllocations = ([...userAllocations, newAllocation]);
			updateAllocations([...assignment.toolAssignmentData.allocations, newAllocation]);
		}

		fetchAndSetDraftsToBeReviewedByUser(userAllocations);
	}, [peerDraftIds, allocationMsg])


	async function updateAllocations(allocations) {
		const inputData = {...assignment, toolAssignmentData: {...assignment.toolAssignmentData, allocations}};
		delete inputData.createdAt;
		delete inputData.updatedAt;

		try {
			await API.graphql({query: updateAssignmentMutation, variables: {input: inputData}});
		} catch (error) {
			reportError(error, `We're sorry. An error occurred while trying to allocate a new peer assessment.`);
		}
	}

	function getNewAllocationForUser(peerCompletedDraftIds, userAllocations) {
		// 2. Map out how many times each of these HAVE been allocated
		// TODO: We may need to track if reviews have been completed to allow those with non-submitted reviews to get submissions?
		const {allocations} = assignment.toolAssignmentData;
		const userAllocatedDraftIds = new Set(userAllocations.map(a => a.homeworkId));
		let lowestTierCount = 10000; // 10,000 is arbitrary high number greater than size of any likely cohort
		let highestTierCount = 0;

		// Filter out drafts that have already been assessed by this user
		let lotteryDraftIds = peerCompletedDraftIds.filter(d => !userAllocatedDraftIds.has(d.id))
		lotteryDraftIds = lotteryDraftIds.map(d => {
			let allocationsForDraft = allocations.filter(a => a.homeworkId === d.id);
			lowestTierCount = Math.min(lowestTierCount, allocationsForDraft.length);
			highestTierCount = Math.max(highestTierCount, allocationsForDraft.length);
			return ({...d, assessments: allocationsForDraft.map(a => ({assessorId: a.assessorId, beganOnDate:a.beganOnDate, submittedOnDate:a.submittedOnDate}))});
		});

		let targetDraft = null;
		let tierCount = lowestTierCount;
		while (!targetDraft && lowestTierCount <= highestTierCount) {
			const tierOnlyLotteryDraftIds = lotteryDraftIds.filter(d => (d.assessments.length === lowestTierCount));

			// 4. Randomly select the one of the remaining and assign it to this user.
			if (tierOnlyLotteryDraftIds.length) {
				targetDraft = tierOnlyLotteryDraftIds[Math.floor(Math.random() * (tierOnlyLotteryDraftIds.length - 1))]
				return {assessorId: activeUser.id, homeworkId: targetDraft.id, beganOnDate: 0, submittedOnDate: 0};
			}
			tierCount++;
		}
	}

	async function fetchPeerDraftIds() {
		try {
			const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
			const prevPhaseAssignmentId = assignment.toolAssignmentData.sequenceIds[roundNum];

			let nextTokenVal = null;
			let completedPeerDraftIds = [];

			do {
				const homeworkQueryResults = await API.graphql({
					query: minHomeworkIdsBySubmittedDate,
					variables: {
						submittedOnDate: {gt: 0},
						assignmentId: prevPhaseAssignmentId,
						nextToken: nextTokenVal
					},
				});

				nextTokenVal = homeworkQueryResults.data.minHomeworkIdsBySubmittedDate.nextToken;
				completedPeerDraftIds.push(...homeworkQueryResults.data.minHomeworkIdsBySubmittedDate.items);
			} while (nextTokenVal);

			console.log('completedPeerDraftIds = ', completedPeerDraftIds);
			setPeerDraftIds(completedPeerDraftIds || []);
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetchAndSetPrevAssignmentDrafts.`);
		}
	}

	async function fetchAndSetDraftsToBeReviewedByUser(allocations) {
		// Get all of the allocated homeworks and sort them according to indexed order of the allocations list
		const filterIdsArr = allocations.map(a => ({id: {eq: a.homeworkId}}));

		try {
			let nextTokenVal = null;
			let allocatedHomeworks = [];

			do {
				const homeworkQueryResults = await API.graphql({
					query: listFullHomeworks,
					variables: {
						filter: {or: filterIdsArr},
						nextToken: nextTokenVal
					},
				});

				nextTokenVal = homeworkQueryResults.data.listHomeworks.nextToken;
				allocatedHomeworks.push(...homeworkQueryResults.data.listHomeworks.items);
			} while (nextTokenVal);

			console.log('allPrevDraftHomeworks IDS = ', allocatedHomeworks);
			dispatch(setDraftsToBeReviewedByUser(allocatedHomeworks));
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

	function onReviewPeerDraft(peerDraftId) {
		console.log("onReviewPeerDraft() called");
		setActivelyReviewedPeerDraft(draftsToBeReviewedByUser.find(d => d.id = peerDraftId));
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
							activeUser={activeUser}
							assignment={assignment}
							draftsToBeReviewedByUser={draftsToBeReviewedByUser}
							allocationMsg={allocationMsg}
							onReviewPeerDraft={onReviewPeerDraft}
						/>
					</Col>
				</Row>
			</Fragment>
			}

			{(activeUiScreenMode === UI_SCREEN_MODES.assessPeerHomework) &&
			<Row className={'m-0 p-0 pb-4 h-100'}>
				<Col className='rounded p-0'>
					<PeerHomeworkAssessor
						isEditMode={false}
						refreshHandler={fetchAndSetActiveUserCurrentHomework}
						assignment={assignment}
						homework={activelyReviewedPeerDraft}/>
				</Col>
			</Row>
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

