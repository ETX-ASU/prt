import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {Button, Container, Row, Col} from 'react-bootstrap';
import {updateHomework as updateHomeworkMutation} from "../../graphql/mutations";
import {API} from "aws-amplify";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import HeaderBar from "../../app/components/HeaderBar";
import {reportError} from "../../developer/DevUtils";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faChevronLeft, faTimes, faGripLines} from '@fortawesome/free-solid-svg-icons'
import ConfirmationModal from "../../app/components/ConfirmationModal";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";
import {sendAutoGradeToLMS} from "../../lmsConnection/RingLeader";
import {calcAutoScore, calcMaxScoreForAssignment, sizerFunc} from "../../tool/ToolUtils";
import DraftWriter from "../../tool/DraftWriter";
import ResizePanel from "react-resize-panel";

import IconBackArrow from "../../assets/icon-back-arrow.svg";
import RubricPanel from "../../instructor/assignments/RubricPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

library.add(faCheck, faTimes, faGripLines);



/** This screen is shown to the student so they can "engage" with the homework assignment.
 * Any work they do or changes or interactions they make would be recorded and the updates
 * saved to the database as necessary. */
function xHomeworkReviewer(props) {
	const dispatch = useDispatch();
	const {homework, assignment} = props;
	const activeUser = useSelector(state => state.app.activeUser);
	const [toolHomeworkData, setToolHomeworkData] = useState(Object.assign({}, homework.toolHomeworkData));
  const [activeModal, setActiveModal] = useState(null);

  // const handle = useRef(null);
  // const topZone = useRef(null);
  // const [dragState, setDragState] = useState({isDragging:false, originY:-1, h:200});


  // const [topZoneHeight, setTopZoneHeight] = useState(200);

  const headerZoneRef = useRef(null);
  const footerZoneRef = useRef(null);

  const [availableHeight, setAvailableHeight] = useState(300);
  const [availableWidth, setAvailableWidth] = useState(500);
  const [topPerc, setTopPerc] = useState(0.25);


  useEffect(sizerFunc({headerZoneRef, extraHeight: 106}, setAvailableWidth, setAvailableHeight), [])

	async function submitHomeworkForReview() {
    setActiveModal(null);

    try {
      const inputData = Object.assign({}, homework, {
        toolHomeworkData,
        beganOnDate: (homework.beganOnDate) ? homework.beganOnDate : moment().valueOf(),
        submittedOnDate: (homework.submittedOnDate) ? homework.submittedOnDate : moment().valueOf()
      });
      delete inputData.createdAt;
      delete inputData.updatedAt;
      delete inputData.activityProgress;
      delete inputData.homeworkStatus;
      delete inputData.gradingProgress;
      delete inputData.scoreGiven;
      delete inputData.scoreMaximum;
      delete inputData.comment;

      const result = await API.graphql({query: updateHomeworkMutation, variables: {input: inputData}});
      if (result) {
        if (assignment.isUseAutoSubmit) await calcAndSendScore(inputData);
        await setActiveModal({type: MODAL_TYPES.confirmHomeworkSubmitted})
      } else {
        reportError('', `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
      }
    } catch (error) {
      reportError(error, `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
    }
  }

  async function calcAndSendScore(homework) {
    try {
      const scoreDataObj = {
        assignmentId: assignment.id,
        studentId: activeUser.id,
        scoreGiven: await calcAutoScore(assignment, homework),
        scoreMaximum: await calcMaxScoreForAssignment(assignment),
        comment: '',
        activityProgress: ACTIVITY_PROGRESS.Completed,
        gradingProgress: HOMEWORK_PROGRESS.fullyGraded
      };

      console.warn('-----> about to send scoreDataObj: ', scoreDataObj);
      await sendAutoGradeToLMS(scoreDataObj);
    } catch(error) {
      reportError(error, `We're sorry. There was a problem posting your grade`);
    }
  }

  async function closeModalAndReview() {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.reviewHomework));
    await props.refreshHandler();
  }

  const handleHomeworkDataChange = (value) => {
	  console.log("-------- updateToolHomeworkData");
	  setToolHomeworkData(Object.assign({}, toolHomeworkData, {draftContent:value}));
  }

  function autoSave() {
	  // TODO: Bonus. Add in method to handle automatically saving student work
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.warningBeforeHomeworkSubmission:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Are you sure?'} buttons={[
            {name:'Cancel', onClick: () => setActiveModal(null)},
            {name:'Submit', onClick:submitHomeworkForReview},
          ]}>
            <p>Once submitted, you cannot go back to make additional edits to your assignment.</p>
          </ConfirmationModal>
        )
      case MODAL_TYPES.confirmHomeworkSubmitted:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Submitted!'} buttons={[
            {name:'Review', onClick:closeModalAndReview},
          ]}>
            <p>You can now review your submitted assignment.</p>
          </ConfirmationModal>
        )
    }
  }

  function handleCancelButton() {
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.showStudentDashboard));
  }


  // function startDrag(e) {
	//   setDragState({isDragging:true, originY:e.pageY})
  // }
  //
  // function stopDrag(e) {
	//   setDragState({isDragging:false, originY:-1})
  // }

	return (
		<Fragment>
      {activeModal && renderModal()}
      <Row ref={headerZoneRef} className={'m-0 p-0 pb-2'}>
        <Col className='col-9 p-0'>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronLeft} onClick={handleCancelButton}/>
          <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
        </Col>
        <Col className={'col-3 text-right pr-0'}>
          {/*<Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>*/}
        </Col>
      </Row>

			<form>
        <div className='top-zone position-relative w-100 mt-0 mb-3'
          style={{height: Math.round(availableHeight * topPerc)+'px'}} >
          <RubricPanel
            rubricRanks={assignment.toolAssignmentData.rubricRanks}
            rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
            isEditMode={false}
            isLimitedEditing={false}
          />
        </div>
        <div className='handle position-relative text-center p-1'>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faGripLines} />
        </div>
        <div className='bottom-zone position-relative d-flex flex-row'
          style={{height: Math.round(availableHeight * (1-topPerc))+'px'}} >
          <DraftWriter
            isReadOnly={false}
            isShowCorrect={false}
            toolAssignmentData={assignment.toolAssignmentData}
            toolHomeworkData={toolHomeworkData}
            handleContentUpdated={handleHomeworkDataChange}
            triggerAutoSave={autoSave} />
        </div>

        {/*<Container className='mt-2 ml-1 mr-2'>*/}
        {/*  <ResizePanel direction="s">*/}
        {/*    <RubricPanel*/}
        {/*      rubricRanks={assignment.toolAssignmentData.rubricRanks}*/}
        {/*      rubricCriteria={assignment.toolAssignmentData.rubricCriteria}*/}
        {/*      isEditMode={false}*/}
        {/*      isLimitedEditing={false}*/}
        {/*    />*/}
        {/*  </ResizePanel>*/}
        {/*  <DraftWriter*/}
        {/*    isReadOnly={false}*/}
        {/*    isShowCorrect={false}*/}
        {/*    toolAssignmentData={assignment.toolAssignmentData}*/}
        {/*    toolHomeworkData={toolHomeworkData}*/}
        {/*    handleContentUpdated={handleHomeworkDataChange}*/}
        {/*    triggerAutoSave={autoSave} />*/}
        {/*</Container>*/}

        {/*<Container className='pb-5'>*/}
        {/*  <DraftWriter*/}
        {/*    isReadOnly={false}*/}
        {/*    isShowCorrect={false}*/}
        {/*    toolAssignmentData={assignment.toolAssignmentData}*/}
        {/*    toolHomeworkData={toolHomeworkData}*/}
        {/*    handleContentUpdated={handleHomeworkDataChange}*/}
        {/*    triggerAutoSave={autoSave} />*/}
        {/*</Container>*/}
			</form>
		</Fragment>
	)
}

export default xHomeworkReviewer;