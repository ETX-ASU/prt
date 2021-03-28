import React, {useEffect, useState, Fragment} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {HOMEWORK_PROGRESS, UI_SCREEN_MODES, EMPTY_HOMEWORK} from "../app/constants";
import {Button, Col, Container, Row} from "react-bootstrap";
import {listHomeworks} from "../graphql/queries";
import {createHomework} from "../graphql/mutations";
import {setActiveUiScreenMode} from "../app/store/appReducer";
import HomeworkViewer from "./homeworks/HomeworkViewer";
import HomeworkEngager from "./homeworks/HomeworkEngager";
import {fetchGradeForStudent, hasValidSession} from "../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../tool/ToolUtils";
import LoadingIndicator from "../app/components/LoadingIndicator";
import aws_exports from '../aws-exports';
import moment from "moment";
import {reportError} from "../developer/DevUtils";

import './homeworks/homeworks.scss';

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faFileWord} from '@fortawesome/free-solid-svg-icons'
library.add(faFileWord)

function StudentDashboard() {
	const dispatch = useDispatch();
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);
	const activeUser = useSelector(state => state.app.activeUser);
	const assignment = useSelector(state => state.app.assignment);
	const [homework, setHomework] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
	  if (assignment.id && homework?.id) {
      setIsLoading(false);
    } else if (assignment.id) {
      fetchAndSetHomework();
    }
	}, [assignment, homework]);


	async function fetchAndSetHomework() {
		try {
			const fetchHomeworkResult = await API.graphql(graphqlOperation(listHomeworks, {filter: {"studentOwnerId":{eq:activeUser.id}, "assignmentId":{eq:assignment.id}}}));
			if (!fetchHomeworkResult.data.listHomeworks.items?.length) {
        console.warn("NO homework exists for this student. Attempting to create.")
			  const freshHomework = Object.assign({}, EMPTY_HOMEWORK, {
			    id: uuid(),
          beganOnDate: moment().valueOf(),
          studentOwnerId: activeUser.id,
          assignmentId: assignment.id
			  });
        const resultHomework = await API.graphql({query: createHomework, variables: {input: freshHomework}});
        console.warn("Successful in creating homework for this student");

        await setHomework({...resultHomework.data.createHomework, scoreGiven:0, homeworkStatus:HOMEWORK_PROGRESS.notBegun, comment:'' })
        dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.editHomework));
      } else {
			  const theHomework = fetchHomeworkResult.data.listHomeworks.items[0];
        let scoreData = await fetchGradeForStudent(assignment.id, activeUser.id);
        if (!scoreData) scoreData = {scoreGiven:0, gradingProgress: HOMEWORK_PROGRESS.notBegun, comment:'' };

        theHomework.homeworkStatus = getHomeworkStatus(scoreData, theHomework);
        await setHomework(theHomework);

        const uiMode = (theHomework.submittedOnDate) ? UI_SCREEN_MODES.reviewHomework : UI_SCREEN_MODES.editHomework;
        dispatch(setActiveUiScreenMode(uiMode));
        setIsLoading(false);
      }
		} catch (error) {
      reportError(error, `We're sorry. There was an error while attempting to fetch your current assignment. Please wait a moment and try again.`);
		}
	}

	function handleEditButton() {
		console.log("handleEditButton() called")
	}

	return (
    <Container className='p-5 student-dashboard dashboard bg-white rounded h-100'>

			{isLoading &&
			<Row className={'mb-0 pb-5'}>
				<Col className='rounded p-0'>
					<LoadingIndicator loadingMsg='LOADING STUDENT ASSIGNMENTS'/>
				</Col>
			</Row>
			}

			{!isLoading &&
				<Fragment>
					<Row className='mb-4'>
						<Col>
							<h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
							<p id='assignmentDescription' className='mt-0'>{assignment.description}</p>
						</Col>
					</Row>
					<Row className='pb-3'>
						<Col className='col-12'>
							<h3>Write or Upload Your Draft</h3>
						</Col>
					</Row>
					<Row className='panel-box p-2 m-0 mb-5 justify-content-center'>
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
									<td className='border-top-0'><FontAwesomeIcon className='btn-icon' icon={faFileWord}/></td>
									<td className='border-top-0'>{homework.toolHomeworkData.title}</td>
									<td className='border-top-0'>{moment(assignment.lockOnDate).format('MMM-DD-YY')}</td>
									<td className='border-top-0'>none</td> {/* reviewsCount */}
									<td className='border-top-0'>none</td> {/* status */}
									<td className='border-top-0'>
										<Button outline className="btn badge-pill essay-btn" onClick={handleEditButton}>Edit Essay</Button>
										{/*<Button disabled={!isEnabled} id="cancel-btn" outline value={btnLabel} className="btn badge-pill essay-btn" onClick={this.handleEditButton}>{btnLabel}</Button>*/}
									</td>
								</tr>
							</tbody>
						</table>
					</Row>

					<Row className='mb-3'>
						<Col className='col-12'>
							<h3>Give Reviews to Peers</h3>
						</Col>
					</Row>
					<Row className='panel-box p-2 m-0 mb-5 justify-content-center'>
						<p>Peer reviews go here</p>
					</Row>
				</Fragment>
			}


      {/*<Row className={'m-0 pb-5'}>*/}
      {/*  <Col className='rounded p-0'>*/}
      {/*    {isLoading && <LoadingIndicator loadingMsg='LOADING STUDENT ASSIGNMENTS'/>}*/}

			{/*		{!isLoading && (activeUiScreenMode === UI_SCREEN_MODES.reviewHomework) &&*/}
			{/*		<HomeworkViewer refreshHandler={fetchAndSetHomework} assignment={assignment} homework={homework} />*/}
			{/*		}*/}
			{/*		{!isLoading && (activeUiScreenMode === UI_SCREEN_MODES.editHomework) &&*/}
			{/*		<HomeworkEngager refreshHandler={fetchAndSetHomework} assignment={assignment} homework={homework} />*/}
			{/*		}*/}
			{/*	</Col>*/}
			{/*</Row>*/}
		</Container>
	);
}

export default hasValidSession(aws_exports) ? StudentDashboard : null;

