import React, {useEffect, useState, useRef} from 'react';
import {useDispatch, useSelector} from "react-redux";
import "./GradingBar.scss";
import {Container, Col, Row, Button} from 'react-bootstrap';
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, STATUS_TEXT} from "../../../app/constants";
import {setCurrentlyReviewedStudentId} from "../../../app/store/appReducer";
import {sendInstructorGradeToLMS} from "../../../lmsConnection/RingLeader";

import {library} from "@fortawesome/fontawesome-svg-core";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowCircleLeft, faArrowCircleRight, faCheck} from "@fortawesome/free-solid-svg-icons";
import {calcMaxScoreForAssignment} from "../../../tool/ToolUtils";
import {reportError} from "../../../developer/DevUtils";

library.add(faArrowCircleLeft, faArrowCircleRight, faCheck);


function GradingBar(props) {
  const dispatch = useDispatch();
  const prevReviewedStudentId = useRef(null);
  const {assignment, reviewedStudent, manualScore} = props;

  const displayOrder = useSelector(state => state.app.displayOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreGiven, setScoreGiven] = useState(0);
  const [comment, setComment] = useState('');
  const [expand, setExpand] = React.useState(0)
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  useEffect(() => {
    setComment(reviewedStudent.comment || '');
    setScoreGiven((reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded)
      ? reviewedStudent.scoreGiven : manualScore
    );

    prevReviewedStudentId.current = reviewedStudent.id;
  }, [manualScore, reviewedStudent, reviewedStudent.id])


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
    setIsSubmitting(true);
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
    setExpand(1);
    setIsSubmitting(false);
    props.refreshHandler({scoreGiven});
    // setTimeout(() => navToNext(), 1000);
  }

  // This is not used with the peer review tool because instructor comments are available directly as notes to student work
  // function handleCommentUpdated(e) {
  //   setComment(e.target.value || '')
  // }

  function onScoreAdjusted(e) {
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
                <label htmlFor='autoScore' className='xtext-darkest'>Auto Score</label>
                <div className={'selected-score'} id={`yourScore`}>{`${manualScore}%`}</div>
              </div>

              {reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded &&
                <div className='ml-0 mr-4 d-inline-block align-top'>
                  <label htmlFor='autoScore' className='xtext-darkest'>Given Score</label>
                  <div className={'selected-score'} id={`yourScore`}>{`${reviewedStudent.scoreGiven}%`}</div>
                </div>
              }

              <div className='mr-4 mt-4 d-inline-block align-middle'>
                <div className='m-0 p-0 position-relative'>
                  <FontAwesomeIcon
                    size={'2x'}
                    className={'ml-0 mr-2 text-success saved-msg position-absolute'}
                    icon={faCheck}
                    data-activated={expand}
                    onAnimationEnd={() => {
                      setExpand(0);
                      if (reviewedStudent.homeworkStatus !== HOMEWORK_PROGRESS.fullyGraded) navToNext();
                    }}/>
                  {reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded &&
                    <FontAwesomeIcon size={'2x'} className={'ml-0 mr-2 position-absolute'} icon={faCheck}/>
                  }
                </div>
              </div>

              {reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded &&
                <div className='mr-1 pt-3 d-inline-block align-top float-right'>
                  <span className='ml-1 mr-0'>
                    <Button className='btn-med xbg-darkest' onClick={handleSubmitScore}>{isSubmitting ? 'Submitting...' : 'Update'}</Button>
                  </span>
                </div>
              }

              {reviewedStudent.homeworkStatus !== HOMEWORK_PROGRESS.fullyGraded &&
              <div className='mr-1 pt-3 d-inline-block align-top float-right'>
                <span className='ml-1 mr-0'>
                  <Button className='btn-med xbg-darkest' onClick={handleSubmitScore}>{isSubmitting ? 'Submitting...' : 'Submit & Next'}</Button>
                </span>
              </div>
              }

              <div className='mr-4 d-inline-block align-top float-right'>
                <label htmlFor='yourScore' className='xtext-darkest'>{(reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded ? 'Updated Score' : 'Score to Submit')}</label>
                <input id={`yourScore`}
                  type="number"
                  className='form-control'
                  min={0} max={100}
                  onChange={onScoreAdjusted}
                  value={scoreGiven}
                />
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


