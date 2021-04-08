import React, {useEffect, useState, Fragment} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {
	HOMEWORK_PROGRESS,
	UI_SCREEN_MODES,
	EMPTY_HOMEWORK,
	STATUS_TEXT,
	DRAFT_BTN_LABELS,
	ACTIVITY_PROGRESS, ALLOCATION_MESSAGES
} from "../app/constants";
import {Button, Col, Container, Row} from "react-bootstrap";
import {
	getHomework,
	listHomeworks
} from "../graphql/queries";
import {fullHomeworkByAsmntAndStudentId, minHomeworkIdsBySubmittedDate} from "../graphql/customQueries";

import {createHomework, updateAssignment as updateAssignmentMutation} from "../graphql/mutations";
import {setActiveUiScreenMode, setDraftsToBeReviewedByUser} from "../app/store/appReducer";
import HomeworkEngager from "./homeworks/HomeworkEngager";
import {fetchGradeForStudent, hasValidSession} from "../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../tool/ToolUtils";
import LoadingIndicator from "../app/components/LoadingIndicator";
import aws_exports from '../aws-exports';
import moment from "moment";
import {reportError} from "../developer/DevUtils";

import './homeworks/homeworks.scss';
import IconEssay from "../assets/icon-essay.svg";
import HomeworkReviewer from "./homeworks/HomeworkReviewer";

// import PeerReviewsSummaryTable from "./homeworks/PeerReviewsSummaryTable";


function StudentDashboard() {
	const dispatch = useDispatch();
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);
	const allocatedDraftsForReview = useSelector((state => state.app.allocatedDraftsForReview));
	const activeUser = useSelector(state => state.app.activeUser);
	const assignment = useSelector(state => state.app.assignment);

	const [homework, setHomework] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [allocationMsg, setAllocationMsg] = useState('');

	// NOTE: We need information about userAssessmentDrafts and userPreviousDrafts
	// 1) any current OR previous draft 'essay' (homework) written by THIS ACTIVE USER (student)
	// 2) any CURRENT draft 'essay' (homework) that is allocated to be reviewed by THIS ACTIVE USER (student)
	// If this assignment is a Writing Session, we need #1.
	// If this assignment is a Review Session, we need #2.
	useEffect(() => {
		if (!assignment.id && !homework?.id) return;
		if (assignment.id && !homework?.id) {
			fetchAndSetActiveUserCurrentHomework();
			return;
		}

		setIsLoading(false);

		// If this is a Review Session Assignment, allocate and fetch homeworks reviewed by this user as needed
		if (assignment.id && assignment.toolAssignmentData.sequenceIds.length%2) {
			let userAllocations = assignment.toolAssignmentData.allocations.filter(a => a.assessorId === activeUser.id);
			let currentAllocation = userAllocations.find(a => !a.submittedOnDate) || null;
			let updatedAllocations = [...userAllocations];

			// !!! If this user does NOT have an active (assigned but not-submitted-yet) allocation, try to procure a new allocation for them
			if (!currentAllocation) {
				const allCompletedDraftIds = getReviewablePeerHomeworkIds();

				// If this user has not completed their prev draft, they can NOT review. Notify them and exit.
				if (!allCompletedDraftIds.find(h => h.studentOwnerId === activeUser.id)) {
					setAllocationMsg(ALLOCATION_MESSAGES.userDidNotSubmit);
				}
				// If not enough submissions are available, notify user and exit
				else if (allCompletedDraftIds.length < assignment.toolAssignmentData.minPeersBeforeAllocating) {
					setAllocationMsg(ALLOCATION_MESSAGES.notEnoughSubmissions);
					return;
				}

				else {
					const peerCompletedDraftIds = allCompletedDraftIds.filter(h => h.studentOwnerId !== activeUser.id);
					const newAllocation = getNewAllocationForUser(peerCompletedDraftIds);
					if (!newAllocation) {
						setAllocationMsg(ALLOCATION_MESSAGES.noneAvailableForThisUser);
					} else {
						updatedAllocations = ([...userAllocations, newAllocation]);
					}
				}
			}

			fetchAndSetDraftsToBeReviewedByUser(updatedAllocations);
		}

		// Else if this is a Writing Session Assignment, we need to fetch any previous drafts this user wrote
		else {
			// TODO: Fetch previous drafts by this user
		}
	}, [assignment, homework]);



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
			return ({...d, assessments: allocationsForDraft.map(a => ({assessorId: a.assessorId, status: a.status}))});
		});

		let targetDraft = null;
		let tierCount = lowestTierCount;
		while (!targetDraft && lowestTierCount <= highestTierCount) {
			const tierOnlyLotteryDraftIds = lotteryDraftIds.filter(d => (d.assessments.length === lowestTierCount));

			// 4. Randomly select the one of the remaining and assign it to this user.
			if (tierOnlyLotteryDraftIds.length) {
				targetDraft = tierOnlyLotteryDraftIds[Math.floor(Math.random() * (tierOnlyLotteryDraftIds.length - 1))]
				return {assessorId: activeUser.id, homeworkId: targetDraft.id, status: ACTIVITY_PROGRESS.NotBegun};
			}
			tierCount++;
		}
	}

	async function getReviewablePeerHomeworkIds() {
		try {
			const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
			const prevPhaseAssignmentId = assignment.toolAssignmentData.sequenceIds[roundNum];

			let nextTokenVal = null;
			let allPrevDraftHomeworks = [];

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
				allPrevDraftHomeworks.push(...homeworkQueryResults.data.minHomeworkIdsBySubmittedDate.items);
			} while (nextTokenVal);

			console.log('getReviewablePeerHomeworkIds IDs = ', allPrevDraftHomeworks);
			return (getReviewablePeerHomeworkIds)
		} catch (error) {
			reportError(error, `We're sorry. There was an error while attempting to fetchAndSetPrevAssignmentDrafts.`);
		}
	}

	async function fetchAndSetDraftsToBeReviewedByUser(allocations) {
		// Get all of the allocated homeworks,
		// sort them according to order in the allocations list,
		// and store them in redux store using setDraftsToBeReviewedByUser()
		const filterIdsArr = allocations.map(a => ({id: {eq: a.homeworkId}}));
		// filter: {or: [{id: {eq: "0dacafbf-b48d-487e-ba67-29a0888d62de"}}, {id: {eq: "a67ae1a6-48b4-4ab2-8bd4-d9c7be6717c9"}}]}
		// filter: {or: filterIdsArr}
		try {
			let nextTokenVal = null;
			let allocatedHomeworks = [];

			do {
				const homeworkQueryResults = await API.graphql({
					query: listHomeworks,
					variables: {
						filter: {or: filterIdsArr},
						nextToken: nextTokenVal
					},
				});

				nextTokenVal = homeworkQueryResults.data.listHomeworks.nextToken;
				allocatedHomeworks.push(...homeworkQueryResults.data.listHomeworks.items);
			} while (nextTokenVal);

			console.log('allPrevDraftHomeworks IDS = ', allocatedHomeworks);
			setDraftsToBeReviewedByUser(allocatedHomeworks);
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
				setIsLoading(false);
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


	return (
		<Container className='p-4 student-dashboard dashboard bg-white rounded h-100'>

			{isLoading &&
			<Row className='m-0 p-0'>
				<Col className='rounded p-0'>
					<LoadingIndicator loadingMsg='LOADING STUDENT ASSIGNMENTS'/>
				</Col>
			</Row>
			}

			{!isLoading && activeUiScreenMode === UI_SCREEN_MODES.showStudentDashboard &&
			<Fragment>
				<Row className='m-0 p-0'>
					<Col className='rounded p-0'>
						<h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
						<p id='assignmentDescription' className='mt-0'>{assignment.summary}</p>
					</Col>
				</Row>
				<Row className='m-0 mb-3 p-0'>
					<Col className='m-0 p-0 col-12'>
						<h3>Write or Upload Your Draft</h3>
					</Col>
				</Row>
				<Row className='panel-box p-2 m-0 mb-5 justify-content-center'>
					<Col className='p-0 col-12'>
						<table className="table student-assignment-drafts">
							<thead className='border-top-0'>
							<tr className='draft-table-row'>
								<th scope="col" className='border-top-0'/>
								<th scope="col" className='border-top-0'>Version</th>
								<th scope="col" className='border-top-0'>Due Date</th>
								<th scope="col" className='border-top-0'>Reviews</th>
								<th scope="col" className='border-top-0'>Progress</th>
								<th scope="col" className='border-top-0'/>
							</tr>
							</thead>
							<tbody>
							<tr className='draft-table-row'>
								<td className='border-top-0'><img src={IconEssay} alt={''} className='inline-essay-icon'/></td>
								<td className='border-top-0'>{homework.toolHomeworkData.title}</td>
								<td className='border-top-0'>{moment(assignment.lockOnDate).format('MMM-DD-YY')}</td>
								<td className='border-top-0'>none</td>
								<td className='border-top-0'>{STATUS_TEXT[homework.homeworkStatus]}</td>
								<td className='border-top-0'>
									{/*<Button className="btn badge-pill essay-btn btn-outline-secondary" onClick={handleEditButton}>Edit Essay</Button>*/}
									<Button value={DRAFT_BTN_LABELS[homework.homeworkStatus]}
										className="btn badge-pill essay-btn btn-outline-secondary"
										onClick={handleEditButton}>{DRAFT_BTN_LABELS[homework.homeworkStatus]}</Button>
								</td>
							</tr>
							</tbody>
						</table>
					</Col>
				</Row>
			</Fragment>
			}

			{!isLoading && (activeUiScreenMode === UI_SCREEN_MODES.reviewHomework) &&
			<Row className={'m-0 m-0 pb-5'}>
				<Col className='rounded p-0'>
					<HomeworkReviewer refreshHandler={fetchAndSetActiveUserCurrentHomework} assignment={assignment} homework={homework}/>
				</Col>
			</Row>
			}

			{!isLoading && (activeUiScreenMode === UI_SCREEN_MODES.editHomework) &&
			<HomeworkEngager refreshHandler={fetchAndSetActiveUserCurrentHomework} assignment={assignment} homework={homework}/>
			}
		</Container>
	);
}

export default hasValidSession(aws_exports) ? StudentDashboard : null;

