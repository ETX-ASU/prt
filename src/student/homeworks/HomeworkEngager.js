import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import {ACTIVITY_PROGRESS, APP_TOP_PADDING, HOMEWORK_PROGRESS, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {Button, Container, Row, Col} from 'react-bootstrap';
import {updateHomework as updateHomeworkMutation} from "../../graphql/mutations";
import {API} from "aws-amplify";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import HeaderBar from "../../app/components/HeaderBar";
import {reportError} from "../../developer/DevUtils";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faChevronLeft, faTimes} from '@fortawesome/free-solid-svg-icons'
import ConfirmationModal from "../../app/components/ConfirmationModal";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";
import {sendAutoGradeToLMS} from "../../lmsConnection/RingLeader";
import {
  calcAutoScore,
  calcMaxScoreForAssignment,
  getAvailableContentDims, useInterval
} from "../../tool/ToolUtils";
import DraftWriter from "../../tool/DraftWriter";
import ResizePanel from "react-resize-panel";

import IconBackArrow from "../../assets/icon-back-arrow.svg";
import RubricPanel from "../../instructor/assignments/RubricPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import ReactQuill from "react-quill";
import WritersRubricViewer from "../../instructor/assignments/WritersRubricViewer";
import userEvent from "@testing-library/user-event";

library.add(faCheck, faTimes);

const AUTO_SAVE_INTERVAL = 90000; // Save every 90 seconds

/** This screen is shown to the student so they can "engage" with the homework assignment.
 * Any work they do or changes or interactions they make would be recorded and the updates
 * saved to the database as necessary. */
function HomeworkEngager(props) {
	const dispatch = useDispatch();
	const {homework, assignment} = props;
	const activeUser = useSelector(state => state.app.activeUser);
	const [toolHomeworkData, setToolHomeworkData] = useState(Object.assign({}, homework.toolHomeworkData));
  const [activeModal, setActiveModal] = useState(null);

  const headerZoneRef = useRef(null);
  const footerZoneRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(300);
  const [toolbarHeight, setToolbarHeight] = useState(64);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChangedSinceLastSave, setHasChangedSinceLastSave] = useState(false);
  const [time, setTime] = React.useState(0);


  useEffect(() => {
    window.addEventListener('resize', onWindowResized);

    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [])


  useInterval(autoSave, AUTO_SAVE_INTERVAL);

  function onWindowResized() {
    const {width, height} = getAvailableContentDims(headerZoneRef, footerZoneRef)
    const barHeight = document.querySelector('#toolbar').getBoundingClientRect().height;

    setToolbarHeight(barHeight);
    setAvailableHeight(height);
  }


  async function saveOrSubmitHomework(isForSubmit = false, isAutoSave = false) {
    setActiveModal(null);
    setIsSaving(true);

    try {
      const inputData = Object.assign({}, homework, {
        toolHomeworkData,
        beganOnDate: (homework.beganOnDate) ? homework.beganOnDate : moment().valueOf(),
        submittedOnDate: (homework.submittedOnDate) ? homework.submittedOnDate : isForSubmit ? moment().valueOf() : 0
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
        setHasChangedSinceLastSave(false);
        if (isForSubmit) {
          await setActiveModal({type: MODAL_TYPES.confirmHomeworkSubmitted})
        } else {
          props.refreshHandler(true);
        }
      } else {
        reportError('', `We're sorry. There was a problem ${isForSubmit ? 'submitting your homework for review.' : 'saving your work.'} Please wait a moment and try again.`);
      }
    } catch (error) {
      reportError(error, `We're sorry. There was a problem ${isForSubmit ? 'submitting your homework for review.' : 'saving your work.'} Please wait a moment and try again.`);
    } finally {
      setIsSaving(false);
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

  function handleHomeworkDataChange(value) {
    setHasChangedSinceLastSave(true);
    setToolHomeworkData(Object.assign({}, toolHomeworkData, {draftContent:value}));
  }

  function autoSave() {
    console.log("AUTO-SAVING -------------------- ", hasChangedSinceLastSave)
    if (hasChangedSinceLastSave) saveOrSubmitHomework(false, true);
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.warningBeforeHomeworkSubmission:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Are you sure?'} buttons={[
            {name:'Cancel', onClick: () => setActiveModal(null)},
            {name:'Submit', onClick:saveOrSubmitHomework},
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

  function onCancelButton() {
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.showStudentDashboard));
  }



  // const savedStateMsg  = (isSaving) ? "Saving..." : (hasChangedSinceLastSave) ? "Unsaved Changes" : "Up-to-date";
	return (
		<Fragment>
      {activeModal && renderModal()}
      <Row ref={headerZoneRef} className={'m-0 p-0 pb-2 position-relative'}>
        <Button className='d-inline mr-2 btn-sm' onClick={onCancelButton}><FontAwesomeIcon icon={faChevronLeft}/></Button>
        {!props.isReadOnly && <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>}
        {props.isReadOnly && <h2 id='assignmentTitle' className="inline-header">{assignment.title} <span className="inline-header-sub">(Submitted)</span></h2>}

        {!props.isReadOnly &&
        <div className={'right-side-buttons saved-status-ms'}>
          {(isSaving) ? "Saving..." : (hasChangedSinceLastSave) ? "Unsaved Changes" : "Up-to-date"}
        </div>
        }
      </Row>

      <div className='bottom-zone d-flex flex-row m-0 p-0' style={{height: `calc(${availableHeight}px - 3em)`}}>
        <DraftWriter
          assignment={assignment}
          availableHeight={availableHeight}
          isReadOnly={props.isReadOnly}
          toolbarHeight={(props.isReadOnly) ? 0 : toolbarHeight}
          isShowCorrect={false}
          toolHomeworkData={toolHomeworkData}
          handleContentUpdated={handleHomeworkDataChange}
        />
      </div>

      {!props.isReadOnly &&
      <div ref={footerZoneRef} className='m-0 p-0 pt-2 text-right'>
        <Button className='d-inline mr-2 ql-align-right btn-sm' disabled={isSaving} onClick={() => saveOrSubmitHomework(false)}>{isSaving ? 'Saving...' : 'Save'}</Button>
        <Button className='d-inline ql-align-right btn-sm' onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit Assignment</Button>
      </div>
      }

		</Fragment>
	)
}

export default HomeworkEngager;