import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useSelector} from "react-redux";
import {HOMEWORK_PROGRESS} from "../../app/constants";
import {Row, Col} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import PeerHomeworkAssessor from "../../student/homeworks/PeerHomeworkAssessor";
import {deepCopy} from "../../app/utils/deepCopy";


function InstructorDraftAssessor(props) {
  const {students, reviewedStudentId, assignment} = props;
  const rubricCriteria = assignment.toolAssignmentData.rubricCriteria;

  const [reviewedStudent, setReviewedStudent] = useState(students.find(s => s.id === reviewedStudentId));
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  const gradingBarRef = useRef(null);
  const submitBtnRef = useRef(null);
  const [gradingBarHeight, setGradingBarHeight] = useState(200);
  const [manualScore, setManualScore] = useState(0);

  const maxPosRatingPoints = Math.max(...assignment.toolAssignmentData.rubricRanks.map(r => r.points));
  // const [allocations, setAllocations] = useState(assignment.toolAssignmentData.allocations);

  useEffect(() => {
    window.addEventListener('resize', onWindowResized);
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [gradingBarRef])

  useEffect(() => {
    setReviewedStudent(students.find(s => s.id === reviewedStudentId));
    onWindowResized();
  }, [students, reviewedStudentId])

  function onWindowResized() {
    let height = gradingBarRef.current.getBoundingClientRect().height;
    setGradingBarHeight(height + 120);
  }

  function onAssessmentUpdated(studentHomework, updatedAllocations) {
    let updatedStudent = deepCopy(reviewedStudent);
    updatedStudent.homework.toolHomeworkData.commentsOnDraft = [...studentHomework.toolHomeworkData.commentsOnDraft];
    updatedStudent.homework.toolHomeworkData.criterionRatingsOnDraft = [...studentHomework.toolHomeworkData.criterionRatingsOnDraft];

    // if (updatedAllocations) setAllocations(updatedAllocations);
    setReviewedStudent(updatedStudent);
    props.onStudentUpdated(updatedStudent, updatedAllocations);
  }


  function onRatingChanges(instructorRatings) {
    let score = instructorRatings.reduce((acc, rating) => {
      let crit = rubricCriteria.find(c => c.id === rating.criterionId);
      const maxPosCritScore = crit.weight / rubricCriteria.reduce((acc, crit) => {
        acc += crit.weight;
        return acc;
      }, 0);
      let percOfCritPoints = assignment.toolAssignmentData.rubricRanks[rating.ratingGiven].points/maxPosRatingPoints;
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

  // TODO: we are passing allocations separate from assignment.toolAssignmentData.allocations.
/*
  This breaks DRY principle and I need to assess a fix. The advantage of this solution is that
  the assignment data is really only loaded at the start or after an assignment edit.
  Caching the allocations data means no need to refetch the data from DB on every little save
  because this acts as a kind of optimistic update. We update locally and don't care about what is on
  the server until an edit was made to the assignment itself or the app is reloaded.

  BUT HERE'S THE CATCH: As instructor, I'm assessing Student A which changes the homework.commentsOnDraft and .ratingsOnDraft
  and those changes are made to the DB. Each edit is saved each time I click off the notes area. Focus changes,
  student A's commentsOnDraft are changed.

  I'm doing this optimistically. Now what happens when I'm a student reviewing peer A. And another student is reviewing
  peer A at the SAME TIME. By NOT refetching, they both assume they have the most recent commentsOnDraft for peer A.

  I start making comments using Data Snapshot 1. Other student makes a few comments using Snapshot 1. I save 3 new comments,
  basically SnapShot 1 + My Additions, and I leave. Other student edits a comment and saves SnapShot 1 + Their Edit. It overwrites
  what I did.

  Before I can save, I must fetch homeworks to ensure I don't have this problem.

  This is not the case as an instructor because I am the ONLY allocated to make comments on a DRAFT writing assignment.
  As an instructor, I'm the only one who will be adding comments and ratings to a student homework during a DRAFT writing assignment,
  and on a REVIEW SESSION assignment, I will be using a different mechanism.

  This is also not an issue for allocations data because of the same reason.

  AS A STUDENT: Fetch allocations before save or submit.
  AS A STUDENT: Fetch assessedUserHomework before save or submit.
*/

	return (
	  <Fragment>
        <div ref={gradingBarRef}>
          <GradingBar
            submitBtnRef={submitBtnRef}
            manualScore={manualScore}
            refreshHandler={props.refreshGrades}
            assignment={assignment}
            reviewedStudent={reviewedStudent}
            allocations={props.allocations}
            isDraftAssignment={true}
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
              onRatingChanges={onRatingChanges}
              onAssessmentUpdated={onAssessmentUpdated}
              allocations={props.allocations}
            />
          </Col>
        </Row>
        }
    </Fragment>
	)
}

export default InstructorDraftAssessor;