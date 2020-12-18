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
  }, [reviewedStudent.scoreGiven, reviewedStudent.id, reviewedStudent.comment, reviewedStudent.homeworkStatus])

  function calcShownScore({homeworkStatus, scoreGiven, autoScore}) {
    if (homeworkStatus === HOMEWORK_PROGRESS.fullyGraded) return scoreGiven;
    return (autoScore) ? autoScore : 0;
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
    const scoreDataObj = {
      assignmentId: assignment.id,
      studentId: reviewedStudent.id,
      scoreGiven: scoreGiven,
      scoreMaximum: calcMaxScoreForAssignment(assignment),
      comment: comment,
      activityProgress: ACTIVITY_PROGRESS[reviewedStudent.homeworkStatus],
      gradingProgress: HOMEWORK_PROGRESS.fullyGraded
    };

    const lmsResult = await sendInstructorGradeToLMS(scoreDataObj);
    if (!lmsResult) reportError('', `We're sorry. We encountered an error while posting the grade for this student's work.`);
    props.refreshHandler();
  }

  function handleCommentUpdated(e) {
    setComment(e.target.value || '')
  }

  return (
    <Container className='p-0 m-0 mt-4 mb-4 login-bar bg-white rounded xt-med xtext-med align-middle'>
      <Row>
        <Col className='align-middle' style={{'maxWidth':'40px'}}>
          <FontAwesomeIcon size='2x' icon={faArrowCircleLeft} onClick={navToPrev} className='grade-bar-nav-btn' />
        </Col>

        <Col className=''>
          <Container>
            <Row>
              <Col className='col-4' style={{'width':'calc(100% - 100px)'}}>
                <h2>{(isHideStudentIdentity) ? `Student #${reviewedStudent.randomOrderNum}` : reviewedStudent.name}</h2>
                <span className='aside'><h3 className='subtext d-inline-block'>{reviewedStudent.percentCompleted}% Complete | </h3>
                  {STATUS_TEXT[reviewedStudent.homeworkStatus]}</span>
              </Col>
              <Col className='col-8 pt-1 pb-2 xbg-light'>
                <div className='ml-0 mr-4 d-inline-block align-top'>
                  <label htmlFor='autoScore' className='xtext-darkest'>Auto Score</label>
                  <div id={`yourScore`}>{`${reviewedStudent.autoScore} of ${calcMaxScoreForAssignment(assignment)}`}</div>
                </div>
                <div className='mr-4 d-inline-block align-top'>
                  <label htmlFor='yourScore' className='xtext-darkest'>Given Score</label>
                  <input id={`yourScore`}
                         type="number"
                         className='form-control'
                         min={0} max={100}
                         onChange={(e) => setScoreGiven(parseInt(e.target.value))} value={scoreGiven}
                  />
                </div>

                {reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded &&
                <div className='mr-2 mt-4 d-inline-block align-top'>
                  <FontAwesomeIcon className={'ml-2 mr-2'} icon={faCheck} />
                </div>
                }
                <div className='mr-1 pt-3 d-inline-block align-middle float-right'>
                  <span className='ml-1 mr-0'>
                    <Button className='btn-med xbg-darkest'
                      disabled={reviewedStudent.progress === HOMEWORK_PROGRESS.fullyGraded}
                      onClick={handleSubmitScore}>{(reviewedStudent.scoreGiven !== undefined) ? `Update` : `Submit`}</Button>
                  </span>
                </div>
              </Col>

            </Row>
          </Container>
        </Col>

        <Col className='align-middle text-right' style={{'maxWidth':'40px'}}>
          <FontAwesomeIcon size='2x' icon={faArrowCircleRight} onClick={navToNext} className='grade-bar-nav-btn' />
        </Col>
      </Row>

      <Row>
        <Col className='col-12'>
          <textarea className='mt-2 form-control' placeholder='Leave feedback' onChange={handleCommentUpdated} value={comment}/>
        </Col>
      </Row>

    </Container>
  )
}

export default GradingBar;


