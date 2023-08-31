import React, {Fragment, useEffect, useRef, useState} from 'react';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import { Storage } from "aws-amplify";
import { S3_BUCKET } from "../../config";

import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {Button, Row} from 'react-bootstrap';
import {updateHomework as updateHomeworkMutation} from "../../graphql/mutations";
import {API} from "aws-amplify";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import {reportError} from "../../developer/DevUtils";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faChevronLeft, faTimes} from '@fortawesome/free-solid-svg-icons'
import ConfirmationModal from "../../app/components/ConfirmationModal";
import {sendAutoGradeToLMS} from "../../lmsConnection/RingLeader";
import {
  calcAutoScore,
  calcMaxScoreForAssignment,
  getAvailableContentDims, useInterval
} from "../../tool/ToolUtils";
import DraftWriter from "../../tool/DraftWriter";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

library.add(faCheck, faTimes);

const AUTO_SAVE_INTERVAL = 12000; // Save every 120 seconds

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
  // const documentInputRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(300);
  const [toolbarHeight, setToolbarHeight] = useState(64);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChangedSinceLastSave, setHasChangedSinceLastSave] = useState(false);


  useEffect(() => {
    window.addEventListener('resize', onWindowResized);
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [])

  useInterval(autoSave, AUTO_SAVE_INTERVAL);

  function onWindowResized() {
    const {height} = getAvailableContentDims(headerZoneRef, footerZoneRef)
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
          if (!isAutoSave) props.refreshHandler(true);
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

  function handleHomeworkDataChange(value, delta, source) {
    if (source === 'user') {
      setToolHomeworkData(Object.assign({}, toolHomeworkData, {draftContent:value}));
      setHasChangedSinceLastSave(true);
    }
  }

  function autoSave() {
    if (hasChangedSinceLastSave && !activeModal) saveOrSubmitHomework(false, true);
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.warningBeforeHomeworkSubmission:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Are you sure?'} buttons={[
            {name:'Cancel', variant: 'secondary', onClick: () => setActiveModal(null)},
            {name:'Submit', onClick:saveOrSubmitHomework},
          ]}>
            <p>Once submitted, you cannot go back to make additional edits to your assignment.</p>
          </ConfirmationModal>
        )
      case MODAL_TYPES.confirmHomeworkSubmitted:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Submitted!'} buttons={[
            {name:'Review', onClick:closeModalAndReview},
          ]}>
            <p>You can now review your submitted assignment.</p>
            <p>If there is a peer review round, it will be on a following assignment. Returning to this assignment will only show you your submitted work.</p>
          </ConfirmationModal>
        )
      default:
        return;
    }
  }

  function onCancelButton() {
    props.refreshHandler(true);
    // TODO: Warn user if there are unsaved changes.
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.showStudentDashboard));
  }

  const handleDocumentPicked = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    console.log(ev.target.files[0]);
    setIsUploading(true);
    const { key } = await Storage.put(
      crypto.randomUUID() + '-' + file.name,
      file,
      { contentType: file.type, ACL: 'public-read' },
    );
    setToolHomeworkData(d => ({...d, documentUrl: `${S3_BUCKET}/${key}`}));
    setHasChangedSinceLastSave(true);
    setIsUploading(false);
  };
  
  const handleDocumentButtonClick = () => {
    if (toolHomeworkData.documentUrl) {
      setToolHomeworkData(d => ({...d, documentUrl: null}));
      setHasChangedSinceLastSave(true);
      return;
    }

    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', 'application/pdf');
    el.addEventListener('change', handleDocumentPicked);
    el.click();
  }

  return (
		<Fragment>
      {activeModal && renderModal()}
      <Row ref={headerZoneRef} className={'m-0 p-0 pb-2 position-relative align-items-center'}>
        <Button className='d-inline mr-2 btn-sm' onClick={onCancelButton}><FontAwesomeIcon icon={faChevronLeft}/></Button>
        {!props.isReadOnly && <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>}
        {props.isReadOnly && <h2 id='assignmentTitle' className="inline-header">{assignment.title} <span className="inline-header-sub">(Submitted)</span></h2>}
      </Row>
      <div className="my-1 font-italic small">{`Assignment prompt: ${assignment.summary}`}</div>
      <div className='bottom-zone d-flex flex-row flex-grow-1 m-0 p-0'>
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
      <Fragment>
        <div className={'left-side-buttons saved-status-ms'}>
          {(isSaving) ? "Saving..." : (hasChangedSinceLastSave) ? "Unsaved Changes" : "Up-to-date"}
        </div>
        <div ref={footerZoneRef} className='m-0 p-0 pt-2 text-right'>
          <Button
            className='d-inline mr-2 ql-align-right btn-sm'
            disabled={isUploading}
            onClick={handleDocumentButtonClick}
          >
              {
                isUploading
                  ? 'Uploading...'
                  : toolHomeworkData.documentUrl
                    ? 'Remove document'
                    : 'Upload PDF'
              }
          </Button>
          <Button className='d-inline mr-2 ql-align-right btn-sm' disabled={isSaving} onClick={() => saveOrSubmitHomework(false)}>{isSaving ? 'Saving...' : 'Save'}</Button>
          <Button className='d-inline ql-align-right btn-sm' onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit Assignment</Button>
        </div>
        {/* <input 
          style={{display:'none'}}
          type="file"
          ref={documentInputRef}
          accept="application/pdf"
          onChange={handleDocumentPicked}
        /> */}
      </Fragment>
      }

		</Fragment>
	)
}

export default HomeworkEngager;
