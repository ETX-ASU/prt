import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useSelector} from "react-redux";
import {HOMEWORK_PROGRESS} from "../../app/constants";
import {Container, Row, Col} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import HomeworkViewer from "../../student/homeworks/HomeworkViewer";
import HomeworkEngager from "../../student/homeworks/HomeworkEngager";
import {getAvailableContentDims} from "../../tool/ToolUtils";
import RubricAssessorPanel from "./RubricAssessorPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGripLines} from "@fortawesome/free-solid-svg-icons";
import EditorToolbar, {formats, modules} from "../../tool/RteToolbar";
import ReactQuill from "react-quill";
import CommentsPanel from "../../student/homeworks/CommentsPanel";
import PeerHomeworkAssessor from "../../student/homeworks/PeerHomeworkAssessor";


function InstructorDraftAssessor(props) {
  const {students, reviewedStudentId, assignment, availableHeight} = props;

  const [reviewedStudent, setReviewedStudent] = useState(students.find(s => s.id === reviewedStudentId));
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  const gradingBarRef = useRef(null);
  const [gradingBarHeight, setGradingBarHeight] = useState(300);

  useEffect(() => {
    window.addEventListener('resize', onWindowResized);
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [])

  useEffect(() => {
    setReviewedStudent(students.find(s => s.id === reviewedStudentId))
  }, [students, reviewedStudentId])

  function onWindowResized() {
    let height = gradingBarRef.current.getBoundingClientRect().height;
    setGradingBarHeight(height);
  }


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

  function hasStudentDoneWork() {
    return (reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.submitted ||
      reviewedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded);
  }

	return (
	  <Fragment>
        <div ref={gradingBarRef}>
          <GradingBar refreshHandler={props.refreshGrades} assignment={assignment} reviewedStudent={reviewedStudent}/>
        </div>

        {!hasStudentDoneWork() &&
        <Row className='mt-5 mb-5'>
          <Col className='w-auto xt-large xtext-dark font-weight-bold'>{getStatusMsg()}</Col>
        </Row>
        }

        {hasStudentDoneWork() &&
        <Row className={'m-0 p-0 h-100'}>
          <Col className='rounded p-0'>
            <PeerHomeworkAssessor
              // isEditMode={false}
              // refreshHandler={fetchAndSetActiveUserCurrentHomework}
              // assignment={assignment}
              // homework={activelyReviewedPeerDraft}

              availableHeight={availableHeight - gradingBarHeight}
              isInstructorAssessment={true}
              isEditMode={false}
              assignment={assignment}
              homework={reviewedStudent.homework} />
          </Col>
        </Row>
        }

        {/*  <HomeworkViewer*/}
        {/*    availableHeight={availableHeight - gradingBarHeight}*/}
        {/*    isReadOnly={true}*/}
        {/*    assignment={assignment}*/}
        {/*    homework={reviewedStudent.homework} />*/}
        {/*}*/}


    </Fragment>
	)
}

export default InstructorDraftAssessor;