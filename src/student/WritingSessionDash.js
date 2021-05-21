import React, {useEffect, useState, Fragment} from 'react';
import {API} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {
	HOMEWORK_PROGRESS,
	UI_SCREEN_MODES,
	EMPTY_HOMEWORK,
	STATUS_TEXT,
	DRAFT_BTN_LABELS
} from "../app/constants";
import {Button, Col, Container, Row} from "react-bootstrap";
import {fullHomeworkByAsmntAndStudentId} from "../graphql/customQueries";

import {createHomework} from "../graphql/mutations";
import {setActiveUiScreenMode} from "../app/store/appReducer";
import HomeworkEngager from "./homeworks/HomeworkEngager";
import {fetchGradeForStudent, hasValidSession} from "../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../tool/ToolUtils";
import LoadingIndicator from "../app/components/LoadingIndicator";
import aws_exports from '../aws-exports';
import moment from "moment";
import {reportError} from "../developer/DevUtils";

import './homeworks/homeworks.scss';
import IconEssay from "../assets/icon-essay.svg";


function WritingSessionDash() {
	const dispatch = useDispatch();
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);
	const activeUser = useSelector(state => state.app.activeUser);
	const assignment = useSelector(state => state.app.assignment);

	const [homework, setHomework] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// NOTE: We need information about userAssessmentDrafts and userPreviousDrafts
	// 1) any current OR previous draft 'essay' (homework) written by THIS ACTIVE USER (student)
	// 2) any CURRENT draft 'essay' (homework) that is allocated to be reviewed by THIS ACTIVE USER (student)
	// If this assignment is a Writing Session, we need #1.
	// If this assignment is a Review Session, we need #2.
	useEffect(() => {
		if (!assignment.id && !homework?.id) return;
		if (assignment.id && !homework?.id) {fetchAndSetActiveUserCurrentHomework();} else {setIsLoading(false);}
	}, [assignment, homework]);


	async function fetchAndSetActiveUserCurrentHomework(isSilent = false) {
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

				if (!isSilent) dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.showStudentDashboard));
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


	return (
		<Container className='p-4 student-dashboard dashboard bg-white rounded h-100 position-relative'>

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
			<HomeworkEngager isReadOnly={true} refreshHandler={fetchAndSetActiveUserCurrentHomework} assignment={assignment} homework={homework}/>
			}

			{!isLoading && (activeUiScreenMode === UI_SCREEN_MODES.editHomework) &&
			<HomeworkEngager isReadOnly={false} refreshHandler={fetchAndSetActiveUserCurrentHomework} assignment={assignment} homework={homework}/>
			}
		</Container>
	);
}

export default hasValidSession(aws_exports) ? WritingSessionDash : null;

