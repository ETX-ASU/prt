import React from 'react';
import {useSelector} from "react-redux";

import {Col, Container, Row} from "react-bootstrap";
import {hasValidSession} from "../lmsConnection/RingLeader";
import LoadingIndicator from "../app/components/LoadingIndicator";
import aws_exports from '../aws-exports';

import './homeworks/homeworks.scss';
import WritingSessionDash from "./WritingSessionDash";
import ReviewSessionDash from "./ReviewSessionDash";


function StudentDashboard() {
	const assignment = useSelector(state => state.app.assignment);

	if (!assignment.id) return (
		<Container className='p-4 student-dashboard dashboard bg-white rounded h-100'>
			<Row className='m-0 p-0'>
				<Col className='rounded p-0'>
					<LoadingIndicator loadingMsg='LOADING STUDENT ASSIGNMENTS'/>
				</Col>
			</Row>
		</Container>
	);

	if (assignment.toolAssignmentData.sequenceIds.length%2) return (<ReviewSessionDash />);
	return (<WritingSessionDash />);
}

export default hasValidSession(aws_exports) ? StudentDashboard : null;

