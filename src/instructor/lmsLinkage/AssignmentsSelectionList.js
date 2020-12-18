import React, {useState} from 'react';
import {API} from 'aws-amplify';
import LoadingIndicator from "../../app/components/LoadingIndicator";
import {Col, Container, Row, Button} from "react-bootstrap";
import AssignmentListItem from "./AssignmentListItem";
import {createAssignmentInLms} from "../../lmsConnection/RingLeader";
import {updateAssignment} from "../../graphql/mutations";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCopy} from "@fortawesome/free-solid-svg-icons";
import {reportError} from "../../developer/DevUtils";

function AssignmentsSelectionList(props) {
	const assignments = props.strandedAssignments;

  async function handleConnectToLMS() {
    const selectedId = document.getElementById('assignmentSelector').value;
    const assignment = assignments.find(a => a.id === selectedId);

    const resourceDataForLms = {
      type: 'ltiResourceLink',
      label: assignment.title,
      url: '', // leave null
      resourceId: assignment.id,
      lineItem: {
        scoreMaximum: 100,
        label: assignment.title,
        resourceId: assignment.id,
        tag: `TAG FOR ${assignment.title}`
      }
    }

    try {
      const linkToLmsResult = await createAssignmentInLms(resourceDataForLms);
      await document.body.insertAdjacentHTML('afterbegin', linkToLmsResult);
      document.getElementById("ltijs_submit").submit();
    } catch (error) {
      console.log(error);
      reportError(error, `Sorry. An error occurred while trying to connect and create this assignment within the LMS.`);
    }
  }

	return (
		<Container className="h-100">
      <Row>
        <Col className='w-auto xt-large xtext-dark font-weight-bold'>
          <h3 className={'mt-3 mb-2'}>You have a stray assignment.</h3>
          <p className={'mt-3 mb-2'}>It appears one or more previously created assignments have not been properly connected
            to your LMS. This happens sometimes when you start creating an assignment in this tool, but don't finish selecting it
            and saving the changes in the LMS assignment creation process.</p>
          <p>Would you like to use this stray assignment instead of creating a new one? If not, we will delete it before moving on.</p>

        </Col>
      </Row>
      <Row>
        <Col className="pr-4">
          {props.isFetchingAssignments &&
            <LoadingIndicator className='p-4 text-center h-100 align-middle' isDarkSpinner={true} loadingMsg={'FETCHING STUDENT HOMEWORK'} size={3} />
          }
          {!props.isFetchingAssignments && (assignments.length > 0) &&
            <div className="form-group">
              <select className="form-control" id="assignmentSelector">
                {assignments.map((a,i) =>
                  <option key={i} value={a.id}>{a.title}</option>
                )}
              </select>
            </div>
          }
          {!props.isFetchingAssignments && (assignments.length < 1) &&
            <p className='mt-4'>You have not created any assignments. You must first create an assignment.</p>
          }
        </Col>
      </Row>
      <Row>
        <Button className='align-middle' onClick={handleConnectToLMS}>
          Connect this Assignment to LMS
        </Button>
      </Row>
		</Container>
	)
}

export default AssignmentsSelectionList;