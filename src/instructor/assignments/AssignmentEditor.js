import React, {Fragment, useState} from 'react';
import {API} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import {updateAssignment as updateAssignmentMutation} from '../../graphql/mutations';
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
import {handleConnectToLMS} from "../../lmsConnection/RingLeader";
import { v4 as uuid } from "uuid";
import BasicAssignmentSettings from "./BasicAssignmentSettings";
import ReviewPhaseSettings from "../../tool/ReviewPhaseSettings";
import {deepCopy} from "../../app/utils/deepCopy";


function AssignmentEditor() {
  const dispatch = useDispatch();
  const urlAssignmentId = useSelector(state => state.app.assignmentId);
  const [formData, setFormData] = useState(useSelector(state => state.app.assignment));
  const isLimitedEditing = useSelector(state => Boolean(state.app.homeworks?.length));
  const [activeModal, setActiveModal] = useState(null);


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
      await API.graphql({query: updateAssignmentMutation, variables: {input: inputData}});
    } catch (error) {
      reportError(error, `We're sorry. An error occurred while trying to update the edits to your assignment. Please wait a moment and try again.`);
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

  function returnToNewOrDupeAssignmentScreen(e) {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.createOrDupeAssignment));
  }

  function returnToViewAssignmentScreen(e) {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssignment));
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.cancelDupedAssignmentEditsWarning:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Cancel Edits Warning'} buttons={[
            {name:'Cancel', onClick:returnToNewOrDupeAssignmentScreen},
            {name:'Continue Editing', onClick: () => setActiveModal(null)},
          ]}>
            <p>Do you want to cancel editing this duplicated assignment or continue?</p>
            <p>Canceling will lose any edits you have made.</p>
          </ConfirmationModal>
        )
      case MODAL_TYPES.cancelNewAssignmentEditsWarning:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Cancel Editing Assignment'} buttons={[
            {name:'Cancel', onClick:returnToViewAssignmentScreen},
            {name:'Continue Editing', onClick: () => setActiveModal(null)},
          ]}>
            <p>Do you want to cancel editing this assignment or continue?</p>
            <p>Canceling will loose any changes you may have made to your {activeModal.data[0]} assignment.</p>
          </ConfirmationModal>
        )
    }
  }

  return (
    <Fragment>
      {activeModal && renderModal()}

      <HeaderBar title={`Edit: ${formData.title}`} >
        <Button onClick={handleCancelBtn} className='mr-2'>Cancel</Button>
        <Button onClick={handleUpdateBtn}>Update</Button>
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
            isLimitedEditing={isLimitedEditing}
          />

          {(formData.toolAssignmentData.sequenceIds.length === 0) && <RootPhaseSettings
            formData={formData}
            setFormData={setFormData}
            isLimitedEditing={isLimitedEditing} />}

          {/*THERE ARE NO DRAFT PHASE SPECIFIC PROPERTIES, SO THIS ISN'T USED IN BASIC PRTv2*/}
          {/*{(formData.toolAssignmentData.sequenceIds.length%2 === 0) && <DraftPhaseSettings*/}
          {/*  formData={formData}*/}
          {/*  setFormData={setFormData}*/}
          {/*  isLimitedEditing={isLimitedEditing} />}*/}

          {(formData.toolAssignmentData.sequenceIds.length%2 === 1) && <ReviewPhaseSettings
            formData={formData}
            setFormData={setFormData}
            isLimitedEditing={isLimitedEditing} />}
        </Container>
      </form>
    </Fragment>
  )
}

export default AssignmentEditor;