import React, {Fragment, useRef, useState} from 'react';
import {API} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import {updateAssignment} from '../../graphql/mutations';
import {setActiveUiScreenMode, setAssignmentData} from "../../app/store/appReducer";
import {UI_SCREEN_MODES, MODAL_TYPES} from "../../app/constants";
import {Button, Col, Container, Row} from "react-bootstrap";
import "./assignments.scss";
import HeaderBar from "../../app/components/HeaderBar";
import RootPhaseSettings from "../../tool/RootPhaseSettings";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../../app/components/ConfirmationModal";
import {reportError} from "../../developer/DevUtils";
import BasicAssignmentSettings from "./BasicAssignmentSettings";
import ReviewPhaseSettings from "../../tool/ReviewPhaseSettings";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
import {handleConnectToLMS} from "../../lmsConnection/RingLeader";
import { IGNORE_LIMITED_EDITING } from '../../config';


function AssignmentEditor() {
  const dispatch = useDispatch();
  const urlAssignmentId = useSelector(state => state.app.assignmentId);
  const [formData, setFormData] = useState(useSelector(state => state.app.assignment));
  const isLimitedEditing = useSelector(state => Boolean(state.app.homeworks?.length));
  const [activeModal, setActiveModal] = useState(null);
  const isNewPhase = (!formData.lineItemId);
  const reminderCheckboxRef = useRef(null);


  async function handleCancelBtn(e) {
    if (!urlAssignmentId) {
      setActiveModal({type: MODAL_TYPES.cancelDupedAssignmentEditsWarning});
    } else {
      if (!formData.toolAssignmentData.sequenceIds?.length) {
        setActiveModal({
          type: MODAL_TYPES.cancelNewAssignmentEditsWarning,
          data: [formData.title]
        });
      } else {
        returnToViewAssignmentScreen(e);
      }
    }
  }

  async function handleUpdateBtn() {
    if (window.localStorage.getItem('newTabReminderSilenced')) {
      saveAssignment();
      return;
    }

    setActiveModal({ type:MODAL_TYPES.notificationBeforeSave });
  }

  async function saveAssignment() {
    // TODO: Bonus. Add mechanism to verify or perhaps create an undo mechanism, so maybe record previous state here before API call?
    if (!formData.title) return;

    const inputData = deepCopy(formData);
    delete inputData.createdAt;
    delete inputData.updatedAt;

    // Don't copy any rubric data to non-origin assignments
    if (inputData.toolAssignmentData.sequenceIds?.length) {
      inputData.toolAssignmentData.rubricCriteria = null;
      inputData.toolAssignmentData.rubricRanks = null;
    }

    try {
      if (window.isDevMode) inputData.lineItemId = (`FAKE-${uuid()}`);
      const result = API.graphql({query: updateAssignment, variables: {input: inputData}});
      if (isNewPhase) {
        if (window.isDevMode && result) {
          setActiveModal({type:MODAL_TYPES.confirmAssignmentSaved, id:urlAssignmentId});
        } else {
          await handleConnectToLMS(inputData);
          // If live, this will send user back to LMS and close this app.
        }
      }
    } catch (error) {
      reportError(error, `We're sorry. An error occurred while trying to ${isNewPhase ? 'complete the creation of your new assignment phase.': 'update the edits to your assignment.'} Please wait a moment and try again.`);
    }

    const isOrigin = (!formData.toolAssignmentData.sequenceIds.length);
    if (isOrigin) setActiveModal({
      type: MODAL_TYPES.cancelPhaseEditsWarning,
      data: [formData.title]
    });
    if (!isOrigin) setActiveModal({
      type: MODAL_TYPES.cancelNewAssignmentEditsWarning,
      data: [formData.title]
    });

    dispatch(setAssignmentData(formData));
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssignment));
  }

  function handleReminderClose() {
    if (reminderCheckboxRef.current?.checked) {
      window.localStorage.setItem('newTabReminderSilenced', true);
    }

    setActiveModal(null);
    saveAssignment();
  }

  function returnToNewOrDupeAssignmentScreen(e) {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.createOrDupeAssignment));
  }

  function returnToViewAssignmentScreen(e) {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssignment));
  }

  function handleReturnToLms() {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.returnToLmsScreen))
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.cancelDupedAssignmentEditsWarning:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title="Cancel Editing Assignment" buttons={[
            {name:'Cancel', variant: 'secondary', onClick:returnToNewOrDupeAssignmentScreen},
            {name:'Continue Editing', onClick: () => setActiveModal(null)},
          ]}>
            <p>Do you want to cancel editing this duplicated assignment or continue?</p>
            <p>Canceling will lose any edits you have made.</p>
          </ConfirmationModal>
        )
      case MODAL_TYPES.cancelNewAssignmentEditsWarning:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Cancel Editing Assignment'} buttons={[
            {name:'Cancel', variant: 'secondary', onClick:returnToViewAssignmentScreen},
            {name:'Continue Editing', onClick: () => setActiveModal(null)},
          ]}>
            <p>Do you want to cancel editing this assignment or continue?</p>
            <p>Canceling will lose any changes you may have made to your {activeModal.data[0]} assignment.</p>
          </ConfirmationModal>
        )
      case MODAL_TYPES.confirmAssignmentSaved:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Assignment Saved'} buttons={[
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
        );
      default:
        return;
    }
  }

  return (
    <Fragment>
      {activeModal && renderModal()}

      <HeaderBar title={`Edit: ${formData.title}`} >
        {!isNewPhase && <Button variant="secondary" onClick={handleCancelBtn} className='mr-2'>Cancel</Button>}
        <Button onClick={handleUpdateBtn}>{isNewPhase ? 'Complete Creation' : 'Update'}</Button>
      </HeaderBar>

      {isLimitedEditing &&
      <Row className='m-4 p-0 alert alert-warning' role='alert'>
        <Col className={'alert-block p-3 text-center'}>
          <FontAwesomeIcon icon={faExclamationTriangle} size='2x' inverse/>
        </Col>
        <Col className='col-10'>
          <p className='m-3'>Students have begun their assignment, therefore only some assignment options can be edited.</p>
        </Col>
      </Row>
      }

      <form>
        <Container className='m-0'>
          <BasicAssignmentSettings
            formData={formData}
            setFormData={setFormData}
            isLimitedEditing={isLimitedEditing && !IGNORE_LIMITED_EDITING}
          />

          {(formData.toolAssignmentData.sequenceIds.length === 0) && <RootPhaseSettings
            formData={formData}
            setFormData={setFormData}
            isLimitedEditing={isLimitedEditing && !IGNORE_LIMITED_EDITING} />}

          {(formData.toolAssignmentData.sequenceIds.length%2 === 1) && <ReviewPhaseSettings
            formData={formData}
            setFormData={setFormData}
            isLimitedEditing={isLimitedEditing && !IGNORE_LIMITED_EDITING} />}
        </Container>
      </form>
    </Fragment>
  )
}

export default AssignmentEditor;