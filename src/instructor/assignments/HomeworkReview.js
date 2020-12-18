import React, {Fragment, useEffect, useState} from 'react';
import {useSelector} from "react-redux";
import {HOMEWORK_PROGRESS} from "../../app/constants";
import {Container, Row, Col} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";


function HomeworkReview(props) {
  const {students, reviewedStudentId, assignment} = props;

  const [reviewedStudent, setReviewedStudent] = useState(students.find(s => s.id === reviewedStudentId));
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);


  useEffect(() => {
    setReviewedStudent(students.find(s => s.id === reviewedStudentId))
  }, [students, reviewedStudentId])


  function getStatusMsg() {
    const studentRefName = getStudentRefName();
    if(reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded && !reviewedStudent?.homework?.toolHomeworkData?.quizAnswers?.length) {
      return `${studentRefName} did no work, but you have already given them a grade anyway.`;
    }

    switch(reviewedStudent.homeworkStatus) {
      case(HOMEWORK_PROGRESS.notBegun): return `${studentRefName} has not started their work yet.`;
      case(HOMEWORK_PROGRESS.inProgress): return`${studentRefName} completed A PORTION of their homework, but never submitted it.`;
      case(HOMEWORK_PROGRESS.submitted): return`${studentRefName}'s homework is ready for grading.`;
      case(HOMEWORK_PROGRESS.fullyGraded): return`You have already graded ${studentRefName}'s homework`;
      default: return `no progress information for ${studentRefName}`;
    }
  }

  function getStudentRefName() {
    const {randomOrderNum} =  reviewedStudent;
    return (isHideStudentIdentity) ? `Student #${randomOrderNum}` : reviewedStudent.name;
  }

  function isShowWork() {
    return (reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.submitted ||
      reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded);
  }

	return (
	  <Fragment>
      <Container className="homework-viewer">
        <GradingBar refreshHandler={props.refreshGrades} assignment={assignment} reviewedStudent={reviewedStudent}/>

        <Row className='p-0'>
          <Col className='w-auto xt-large xtext-dark font-weight-bold xbg-light'>{getStudentRefName()}</Col>
        </Row>

        {!isHideStudentIdentity &&
        <Row className='mt-5 mb-5 p-0'>
          <Col className='p-0'>
            <label>Student:</label>
            <p className='summary-data xt-med ml-3 mb-2'>{getStudentRefName()}</p>
          </Col>
          <Col className='no-gutters'>
            <label>Email:</label>
            <p className='summary-data xt-med ml-3 mb-2'>{reviewedStudent.email}</p>
          </Col>
          <Col className='no-gutters'>
            <label>Progress:</label>
            <p className='summary-data xt-med ml-3 mb-2'>{reviewedStudent.homeworkStatus}</p>
          </Col>
        </Row>
        }

        {isShowWork() &&
          <QuizViewerAndEngager
            isReadOnly={true}
            isShowCorrect={true}
            toolAssignmentData={assignment.toolAssignmentData}
            toolHomeworkData={reviewedStudent.homework.toolHomeworkData} />
        }

        {!isShowWork() &&
        <Row className='mt-5 mb-5'>
          <Col className='w-auto xt-large xtext-dark font-weight-bold'>{getStatusMsg()}</Col>
        </Row>
        }

      </Container>
    </Fragment>
	)
}

export default HomeworkReview;