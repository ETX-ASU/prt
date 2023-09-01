import React, {Fragment, useRef, useState} from 'react';
import {API} from 'aws-amplify';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {createAssignment as createAssignmentMutation} from '../../graphql/mutations';
import {APP_VERSION, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import {Button, Container, Row} from "react-bootstrap";

import HeaderBar from "../../app/components/HeaderBar";
import RootPhaseSettings from "../../tool/RootPhaseSettings";
import ConfirmationModal from "../../app/components/ConfirmationModal";
import {reportError} from "../../developer/DevUtils";
import {handleConnectToLMS} from "../../lmsConnection/RingLeader";
import {generateDefaultRubric} from "../../tool/ToolUtils";
import BasicAssignmentSettings from "./BasicAssignmentSettings";
import "./assignments.scss";


const tempRanks = [
  {id:uuid(), name:'Excellent', points:10},
  {id:uuid(), name:'Good', points:7},
  {id:uuid(), name:'Fair', points:3},
  {id:uuid(), name:'Poor', points:0}
];

const emptyAssignment = {
  id: uuid(),
  ownerId: '',
  title: '',
  summary: '',
  image: '',
  lineItemId: '',
  isLockedOnSubmission: true,
  lockOnDate: 0,
  isUseAutoScore: false,
  isUseAutoSubmit: false,

  toolAssignmentData: {
    rubricRanks: tempRanks,
    rubricCriteria: [],
    sequenceIds: [],
    minReviewsRequired: 3,
    minPeersBeforeAllocating: 6
  }
};

function AssignmentCreator() {
  const dispatch = useDispatch();
  const activeUser = useSelector(state => state.app.activeUser);
  const courseId = useSelector(state => state.app.courseId);
  const defaultToolAssignmentData = {...emptyAssignment.toolAssignmentData, rubricCriteria: generateDefaultRubric().criteria, rubricRanks:generateDefaultRubric().ranks}
  const [formData, setFormData] = useState({...emptyAssignment, toolAssignmentData:defaultToolAssignmentData});
  const [activeModal, setActiveModal] = useState(null);
  const reminderCheckboxRef = useRef(null);


  async function handleSubmitBtn() {
    if (window.localStorage.getItem('newTabReminderSilenced')) {
      saveAssignment();
      return;
    }

    setActiveModal({ type:MODAL_TYPES.notificationBeforeSave });
  }
  
  async function saveAssignment() {
    if (!formData.title) return;
  
    const assignmentId = uuid();
    const inputData = Object.assign({}, formData, {
      id: assignmentId,
      appVersion: APP_VERSION,
      courseId: courseId,
      ownerId: activeUser.id,
      lockOnDate: (formData.isLockedOnDate) ? moment(formData.lockOnDate).valueOf() : 0
    });
  
  
    try {
      if (window.isDevMode) inputData.lineItemId = (`FAKE-${uuid()}`);
      const result = await API.graphql({query: createAssignmentMutation, variables: {input: inputData}});
      if (window.isDevMode && result) {
        setActiveModal({type:MODAL_TYPES.confirmAssignmentSaved, id:assignmentId});
      } else {
        await handleConnectToLMS(inputData);
      }
    } catch (error) {
      reportError(error, `We're sorry. There was a problem saving your new assignment.`);
    }
  }

  function handleReturnToCreateOrDupe() {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.createOrDupeAssignment))
  }

  function handleReturnToLms() {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.returnToLmsScreen))
  }

  function handleReminderClose() {
    if (reminderCheckboxRef.current?.checked) {
      window.localStorage.setItem('newTabReminderSilenced', true);
    }

    setActiveModal(null);
    saveAssignment();
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.cancelNewAssignmentEditsWarning:
        return (
          <ConfirmationModal
            isStatic
            onHide={() => setActiveModal(null)}
            title="Cancel New Assignment"
            buttons={[
              {name: 'Cancel new assignment', variant: 'secondary', onClick: handleReturnToCreateOrDupe},
              {name: 'Continue Creating', onClick: () => setActiveModal(null)},
            ]}
          >
            <p>Do you want to cancel new assignment or continue editing?</p>
            <p>Canceling will not save your new assignment.</p>
          </ConfirmationModal>
        );
      case MODAL_TYPES.confirmAssignmentSaved:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title="Assignment Saved" buttons={[
            {name: 'Continue', onClick: handleReturnToLms},
          ]}>
            <p>Assignment has been saved! In order to access it, use this assignmentId: {activeModal.id}</p>
          </ConfirmationModal>
        );
      case MODAL_TYPES.notificationBeforeSave:
        return (
          <ConfirmationModal 
            isStatic
            title="Important"
            buttons={[{ name: 'Got it', onClick: handleReminderClose }]}
          >
            <p>In your LMS, we strongly recommend for you to set this Tool to open in a new tab for a better viewing experience. For example, Canvas has a checkbox labeled “open in a new tab” that you can check.</p>
            <div className="d-flex align-items-center gap-2">
              <input type="checkbox" id="newTabReminder" ref={reminderCheckboxRef} />
              <label htmlFor="newTabReminder">
                Do not show this message again
              </label>
            </div>
          </ConfirmationModal>
        )
      default:
        return;
    }
  }


	return (
    <Fragment>
      {activeModal && renderModal()}
      <HeaderBar withLogo title='Create New Assignment'>
        <Button variant="secondary" onClick={() => setActiveModal({type: MODAL_TYPES.cancelNewAssignmentEditsWarning})} className='mr-2'>Cancel</Button>
        <Button disabled={!formData.title} onClick={handleSubmitBtn}>Create</Button>
      </HeaderBar>

      <form>
        <Container className='m-0'>
          <BasicAssignmentSettings formData={formData} setFormData={setFormData} />
          <RootPhaseSettings formData={formData} setFormData={setFormData} />
          <Row className={'m-0 p-0 pt-2 position-relative'}>
            <div className={'right-side-buttons'}>
              <Button variant="secondary" onClick={() => setActiveModal({type: MODAL_TYPES.cancelNewAssignmentEditsWarning})} className='mr-2'>Cancel</Button>
              <Button onClick={handleSubmitBtn}>Create</Button>
            </div>
          </Row>
        </Container>
      </form>

    </Fragment>
  )
}

export default AssignmentCreator;