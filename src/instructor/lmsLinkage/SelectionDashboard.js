import React, {useEffect, useRef, useState} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {Col, Container, Row} from "react-bootstrap";
import {listAssignments} from "../../graphql/queries";
import AssignmentsSelectionList from "./AssignmentsSelectionList";
import {useLocation} from "react-router-dom";
import {hasValidSession} from "../../lmsConnection/RingLeader";
import aws_exports from '../../aws-exports';
import {reportError} from "../../developer/DevUtils";


function SelectionDashboard() {
	const hasFetchedAllData = useRef(false);
  const params = new URLSearchParams(useLocation().search);
  const userId = params.get('userId');
  const courseId = params.get('courseId');
  const [assignments, setAssignments] = useState([]);


	useEffect(() => {
		if (hasFetchedAllData.current) return;

		async function fetchAssignmentList() {
			console.log("attempting to fetchAssignmentList()");

			try {
				let nextTokenVal = null;
				let allAssignments = [];

				do {
					const assignmentQueryResults = await API.graphql(graphqlOperation(listAssignments,
						{filter:{ownerId:{eq:userId}, courseId:{eq:courseId}, lineItemId:{eq:''}},
							// {filter:{ownerId:{eq:userId}},
							nextToken: nextTokenVal
						}));
					nextTokenVal = assignmentQueryResults.data.listAssignments.nextToken;
					allAssignments.push(...assignmentQueryResults.data.listAssignments.items);
				} while (nextTokenVal);

				setAssignments(allAssignments);
				hasFetchedAllData.current = true;
			} catch (error) {
				reportError(error, `We're sorry. There was an error while attempting to fetch the list of your existing assignments.`);
			}
		}

		fetchAssignmentList();
	}, [courseId, userId]);




	return (
		<Container className='student-dashboard dashboard bg-white rounded h-100 m-4 p-4'>
			<Row>
				<Col className='rounded'>
					<AssignmentsSelectionList isFetchingAssignments={!hasFetchedAllData.current} assignments={assignments} />
				</Col>
			</Row>
		</Container>
	);
}

export default hasValidSession(aws_exports) ?  SelectionDashboard : null;
