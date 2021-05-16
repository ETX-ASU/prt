import React, {Fragment, useEffect, useState} from 'react';
import {API} from 'aws-amplify';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {createAssignment as createAssignmentMutation} from '../../graphql/mutations';
import {MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import "./assignments.scss";

import {Button, Col, Container, Row} from "react-bootstrap";
import HeaderBar from "../../app/components/HeaderBar";
import ToggleSwitch from "../../app/components/ToggleSwitch";

import RootPhaseSettings from "../../tool/RootPhaseSettings";
import ConfirmationModal from "../../app/components/ConfirmationModal";
import {reportError} from "../../developer/DevUtils";
import {createAssignmentInLms, handleConnectToLMS} from "../../lmsConnection/RingLeader";
import {calcMaxScoreForAssignment, generateDefaultRubric} from "../../tool/ToolUtils";
import BasicAssignmentSettings from "./BasicAssignmentSettings";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";


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
  isLinkedToLms: false,
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


  async function handleSubmitBtn() {
    if (!formData.title) return;

    const assignmentId = uuid();
    const inputData = Object.assign({}, formData, {
      id: assignmentId,
      courseId: courseId,
      ownerId: activeUser.id,
      lockOnDate: (formData.isLockedOnDate) ? moment(formData.lockOnDate).valueOf() : 0
    });


    console.log("INPUT DATA: ", inputData);
    // Temporarily disabled for development and testing
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

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.cancelNewAssignmentEditsWarning:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Cancel Creation Warning'} buttons={[
            {name: 'Cancel', onClick: handleReturnToCreateOrDupe},
            {name: 'Continue Creating', onClick: () => setActiveModal(null)},
          ]}>
            <p>Do you want to cancel new assignment or continue editing?</p>
            <p>Canceling will not save your new assignment.</p>
          </ConfirmationModal>
        );
      case MODAL_TYPES.confirmAssignmentSaved:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Assignment Saved'} buttons={[
            {name: 'Continue', onClick: handleReturnToLms},
          ]}>
            <p>Assignment has been saved! In order to access it, use this assignmentId: {activeModal.id}</p>
          </ConfirmationModal>
        );
    }
  }


	return (
    <Fragment>
      {activeModal && renderModal()}
      <HeaderBar title='Create New Assignment - PRTv2'>
        <Button onClick={() => setActiveModal({type: MODAL_TYPES.cancelNewAssignmentEditsWarning})} className='mr-2'>Cancel</Button>
        <Button onClick={handleSubmitBtn}>Create</Button>
      </HeaderBar>

      <form>
        <Container className='m-0'>
          <BasicAssignmentSettings formData={formData} setFormData={setFormData} />
          <RootPhaseSettings formData={formData} setFormData={setFormData} />
          <Row className={'m-0 p-0 pt-2 position-relative'}>
            <div className={'right-side-buttons'}>
              <Button onClick={() => setActiveModal({type: MODAL_TYPES.cancelNewAssignmentEditsWarning})} className='mr-2'>Cancel</Button>
              <Button onClick={handleSubmitBtn}>Create</Button>
            </div>
          </Row>
        </Container>
      </form>

    </Fragment>
  )
}

export default AssignmentCreator;