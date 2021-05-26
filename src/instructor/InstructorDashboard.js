import React from 'react';
import {useSelector} from "react-redux";
import {UI_SCREEN_MODES} from "../app/constants";
import AssignmentViewer from "./assignments/AssignmentViewer";
import AssignmentCreator from "./assignments/AssignmentCreator";
import AssignmentNewOrDupe from "./assignments/AssignmentNewOrDupe";
import AssignmentEditor from "./assignments/AssignmentEditor";
import {Col, Container, Row} from "react-bootstrap";
import {hasValidSession} from "../lmsConnection/RingLeader";
import aws_exports from '../aws-exports';


function InstructorDashboard() {
  const assignmentId = useSelector(state => state.app.assignmentId);
	const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);

  return (
		<Container className='p-4 instructor-dashboard dashboard bg-white rounded h-100'>
			<Row className='m-0 p-0'>
				<Col className='rounded p-0'>
          {(activeUiScreenMode === UI_SCREEN_MODES.returnToLmsScreen) &&
            <div>
              <h3>Your assignment has been created and registered!</h3>
              <p>But you're not done yet. You must first close this window</p>
            </div>
          }
					{(activeUiScreenMode === UI_SCREEN_MODES.viewAssignment) &&
					<AssignmentViewer />
					}
					{(activeUiScreenMode === UI_SCREEN_MODES.editAssignment || activeUiScreenMode === UI_SCREEN_MODES.dupeAssignment) &&
					<AssignmentEditor />
					}
					{(activeUiScreenMode === UI_SCREEN_MODES.createOrDupeAssignment) && !assignmentId &&
					<AssignmentNewOrDupe />
					}
					{(activeUiScreenMode === UI_SCREEN_MODES.createAssignment) &&
					<AssignmentCreator />
					}
				</Col>
			</Row>
		</Container>
	);
}
export default hasValidSession(aws_exports) ? InstructorDashboard :  null;


