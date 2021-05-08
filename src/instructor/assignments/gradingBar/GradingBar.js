import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import "./GradingBar.scss";
import {Container, Col, Row, Button} from 'react-bootstrap';
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, STATUS_TEXT} from "../../../app/constants";
import {setCurrentlyReviewedStudentId} from "../../../app/store/appReducer";
import {sendInstructorGradeToLMS} from "../../../lmsConnection/RingLeader";

import {library} from "@fortawesome/fontawesome-svg-core";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowCircleLeft, faArrowCircleRight, faCaretUp, faCheck} from "@fortawesome/free-solid-svg-icons";
import {calcMaxScoreForAssignment} from "../../../tool/ToolUtils";
import {reportError} from "../../../developer/DevUtils";

library.add(faArrowCircleLeft, faArrowCircleRight, faCheck);


function GradingBar(props) {
  const dispatch = useDispatch();
  const {assignment, reviewedStudent} = props;

  const displayOrder = useSelector(state => state.app.displayOrder);
  const [scoreGiven, setScoreGiven] = useState(calcShownScore(reviewedStudent));
  // const [homeworkStatus, setHomeworkStatus] = useState(reviewedStudent.homeworkStatus);
  const [comment, setComment] = useState('');
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  useEffect(() => {
    setComment(reviewedStudent.comment || '');
    setScoreGiven(calcShownScore(reviewedStudent));
  }, [props.manualScore, reviewedStudent.scoreGiven, reviewedStudent.id, reviewedStudent.comment, reviewedStudent.homeworkStatus])


  function calcShownScore({homeworkStatus, scoreGiven, autoScore}) {
    if (homeworkStatus === HOMEWORK_PROGRESS.fullyGraded) return scoreGiven;
    return (autoScore) ? autoScore : props.manualScore;
  }

  const navToPrev = () => {
    let curStudentIndex = displayOrder.indexOf(reviewedStudent.id);
    let navToStudentIndex = (curStudentIndex - 1 < 0) ? displayOrder.length - 1 : curStudentIndex - 1;
    dispatch(setCurrentlyReviewedStudentId(displayOrder[navToStudentIndex]));
  }

  const navToNext = () => {
    let curStudentIndex = displayOrder.indexOf(reviewedStudent.id);
    let navToStudentIndex = (curStudentIndex + 1 >= displayOrder.length) ? 0 : curStudentIndex + 1;
    dispatch(setCurrentlyReviewedStudentId(displayOrder[navToStudentIndex]));
  }

  async function handleSubmitScore() {
    console.log("SUBMIT BTN WAS PUSHED!");

    // const scoreDataObj = {
    //   assignmentId: assignment.id,
    //   studentId: reviewedStudent.id,
    //   scoreGiven: scoreGiven,
    //   scoreMaximum: calcMaxScoreForAssignment(assignment),
    //   comment: comment,
    //   activityProgress: ACTIVITY_PROGRESS[reviewedStudent.homeworkStatus],
    //   gradingProgress: HOMEWORK_PROGRESS.fullyGraded
    // };
    //
    // const lmsResult = await sendInstructorGradeToLMS(scoreDataObj);
    // if (!lmsResult) reportError('', `We're sorry. We encountered an error while posting the grade for this student's work.`);
    // props.refreshHandler();
  }

  function handleCommentUpdated(e) {
    setComment(e.target.value || '')
  }

  function onScoreAdjusted(e) {
    console.log(`score adjusted from ${e.target.value}`, scoreGiven, props.manualScore);
    setScoreGiven(parseInt(e.target.value));
  }

  return (
    <Container id={'instructor-grading-bar'} className='p-0 m-0 mt-2 mb-2 login-bar bg-white rounded xt-med xtext-med'>
      <Row className='p-0 m-0'>
        <div className='d-inline-block p-0 m-0 my-auto' style={{'maxWidth':'40px'}}>
          <FontAwesomeIcon size='2x' icon={faArrowCircleLeft} onClick={navToPrev} className='grade-bar-nav-btn' />
        </div>

        <Col className='p-0 m-0'>
            <Row className='p-0 m-0'>
              <Col className='col-3' style={{'width':'calc(100% - 100px)'}}>
                <h2>{(isHideStudentIdentity) ? `Student #${reviewedStudent.randomOrderNum}` : reviewedStudent.name}</h2>
                <span className='aside'><h3 className='subtext d-inline-block'>{reviewedStudent.percentCompleted}% Complete</h3>
                  <br/>
                  {STATUS_TEXT[reviewedStudent.homeworkStatus]}
                </span>
              </Col>
              <Col className='col-9 pt-1 pb-2 xbg-light'>
                <div className='ml-0 mr-4 d-inline-block align-top'>
                  <label htmlFor='autoScore' className='xtext-darkest'>Selected Score</label>
                  <div className={'selected-score'} id={`yourScore`}>{`${props.manualScore} of 100`}</div>
                  {/*<div id={`yourScore`}>{`${reviewedStudent.autoScore} of ${calcMaxScoreForAssignment(assignment)}`}</div>*/}
                </div>
                <div className='mr-4 d-inline-block align-top'>
                  <label htmlFor='yourScore' className='xtext-darkest'>Given Score</label>
                  <input id={`yourScore`}
                         type="number"
                         className='form-control'
                         min={0} max={100}
                         onChange={onScoreAdjusted}
                         value={scoreGiven}
                  />
                </div>

                {reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded &&
                <div className='mr-2 mt-4 d-inline-block align-top'>
                  <FontAwesomeIcon className={'ml-2 mr-2'} icon={faCheck} />
                </div>
                }
                <div className='mr-1 pt-3 d-inline-block align-middle float-right'>
                  <span className='ml-1 mr-0'>
                    <Button
                      ref={props.submitBtnRef}
                      className='btn-med xbg-darkest'
                      disabled={reviewedStudent.progress === HOMEWORK_PROGRESS.fullyGraded}
                      onClick={handleSubmitScore}>{(reviewedStudent.scoreGiven !== undefined) ? `Update` : `Submit`}</Button>
                  </span>
                </div>
              </Col>

            </Row>
        </Col>

        <div className='d-inline-block p-0 m-0 text-right my-auto' style={{'maxWidth':'40px'}}>
          <FontAwesomeIcon size='2x' icon={faArrowCircleRight} onClick={navToNext} className='grade-bar-nav-btn' />
        </div>
      </Row>

      {/*<Row>*/}
      {/*  <Col className='col-12'>*/}
      {/*    <textarea className='mt-2 form-control' placeholder='Leave feedback' onChange={handleCommentUpdated} value={comment}/>*/}
      {/*  </Col>*/}
      {/*</Row>*/}

    </Container>
  )
}

export default GradingBar;


