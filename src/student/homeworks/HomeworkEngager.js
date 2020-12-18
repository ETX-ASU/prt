import React, {Fragment, useState} from 'react';
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
import {faCheck, faTimes} from '@fortawesome/free-solid-svg-icons'
import ConfirmationModal from "../../app/components/ConfirmationModal";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";
import {sendAutoGradeToLMS} from "../../lmsConnection/RingLeader";
import {calcAutoScore, calcMaxScoreForAssignment} from "../../tool/ToolUtils";

library.add(faCheck, faTimes);



/** This screen is shown to the student so they can "engage" with the homework assignment.
 * Any work they do or changes or interactions they make would be recorded and the updates
 * saved to the database as necessary. */
function HomeworkEngager(props) {
	const dispatch = useDispatch();
	const {homework, assignment} = props;
	const activeUser = useSelector(state => state.app.activeUser);
	const [toolHomeworkData, setToolHomeworkData] = useState(Object.assign({}, homework.toolHomeworkData));
  const [activeModal, setActiveModal] = useState(null);


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

  function handleHomeworkDataChange(data) {
	  setToolHomeworkData(data);
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

	return (
		<Fragment>
      {activeModal && renderModal()}
      <HeaderBar title={assignment.title}>
        <Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>
      </HeaderBar>

			<form>
        <Container className='mt-2 ml-1 mr-2'>
          <Row className={'mt-4'}>
            <Col><p>{assignment.summary}</p></Col>
          </Row>
        </Container>

        <Container className='pb-5'>
          <QuizViewerAndEngager
            isReadOnly={false}
            isShowCorrect={false}
            toolAssignmentData={assignment.toolAssignmentData}
            toolHomeworkData={toolHomeworkData}
            updateToolHomeworkData={handleHomeworkDataChange}
            triggerAutoSave={autoSave} />
        </Container>

			</form>

      <Row>
        <Col className='text-right mr-4'>
          <Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>
        </Col>
      </Row>
		</Fragment>
	)
}

export default HomeworkEngager;