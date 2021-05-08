import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useSelector} from "react-redux";
import {EMPTY_HOMEWORK, HOMEWORK_PROGRESS, UI_SCREEN_MODES} from "../../app/constants";
import {Container, Row, Col} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import HomeworkViewer from "../../student/homeworks/HomeworkViewer";
import HomeworkEngager from "../../student/homeworks/HomeworkEngager";
import {getAvailableContentDims, getHomeworkStatus} from "../../tool/ToolUtils";
import RubricAssessorPanel from "./RubricAssessorPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGripLines} from "@fortawesome/free-solid-svg-icons";
import EditorToolbar, {formats, modules} from "../../tool/RteToolbar";
import ReactQuill from "react-quill";
import CommentsPanel from "../../student/homeworks/CommentsPanel";
import PeerHomeworkAssessor from "../../student/homeworks/PeerHomeworkAssessor";
import {API} from "aws-amplify";
import {fullHomeworkByAsmntAndStudentId} from "../../graphql/customQueries";
import {v4 as uuid} from "uuid";
import moment from "moment";
import {createHomework} from "../../graphql/mutations";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import {fetchGradeForStudent} from "../../lmsConnection/RingLeader";
import {reportError} from "../../developer/DevUtils";


function InstructorDraftAssessor(props) {
  const {students, reviewedStudentId, assignment, availableHeight} = props;
  const rubricCriteria = assignment.toolAssignmentData.rubricCriteria;

  const [reviewedStudent, setReviewedStudent] = useState(students.find(s => s.id === reviewedStudentId));
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  const activeUser = useSelector(state => state.app.activeUser);
  const gradingBarRef = useRef(null);
  const submitBtnRef = useRef(null);
  const [gradingBarHeight, setGradingBarHeight] = useState(200);
  const [manualScore, setManualScore] = useState(0);
  const [activeCommentId, setActiveCommentId] = useState('');

  const maxPosRatingPoints = Math.max(...assignment.toolAssignmentData.rubricRanks.map(r => r.points));


  useEffect(() => {
    window.addEventListener('resize', onWindowResized);
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [gradingBarRef])

  useEffect(() => {
    let targetStudent = students.find(s => s.id === reviewedStudentId);
    setReviewedStudent(targetStudent);
    onWindowResized();
  }, [students, reviewedStudentId])

  function onWindowResized() {
    let height = gradingBarRef.current.getBoundingClientRect().height;
    setGradingBarHeight(height + 120);
  }

  function onAssessmentUpdated(data, curCommentId) {
    let updatedStudent = Object.assign({}, reviewedStudent, {homework: {...reviewedStudent.homework, toolHomeworkData: data}})
    setReviewedStudent(updatedStudent);
    setActiveCommentId(curCommentId);
    console.log(`=======> reviewedStudentUpdated()`)
  }


  function onAssessmentChanges(data) {
    console.log(`=======> onAssessmentChanges()`)
    let instructorRatings = data.criterionRatingsOnDraft.filter(r => r.reviewerId === activeUser.id);

    let score = instructorRatings.reduce((acc, rating) => {
      let crit = rubricCriteria.find(c => c.id === rating.criterionId);
      const maxPosCritScore = crit.weight / rubricCriteria.reduce((acc, crit) => {
        acc += crit.weight;
        return acc;
      }, 0);
      let percOfCritPoints = assignment.toolAssignmentData.rubricRanks[rating.ratingGiven].points/maxPosRatingPoints;
      // let maxPercForCriterion = 100 * crit.weight/percOfCritPoints;
      acc += (maxPosCritScore * percOfCritPoints * 100);
      return acc;
    }, 0)

    if (score !== manualScore) setManualScore(Math.round(score));
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
          <GradingBar
            submitBtnRef={submitBtnRef}
            manualScore={manualScore}
            refreshHandler={props.refreshGrades}
            assignment={assignment}
            reviewedStudent={reviewedStudent}
          />
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
              // refreshHandler={fetchAndSetActiveUserCurrentHomework}
              key={reviewedStudent.id}
              excessHeight={gradingBarHeight}
              submitBtnRef={submitBtnRef}
              isInstructorAssessment={true}
              isEditMode={false}
              assignment={assignment}
              homework={reviewedStudent.homework}
              defaultActiveCommentId={activeCommentId}
              onAssessmentUpdated={onAssessmentUpdated}
            />
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