import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {EMPTY_HOMEWORK, EMPTY_REVIEW, HOMEWORK_PROGRESS, UI_SCREEN_MODES} from "../../app/constants";
import {Row, Col} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import PeerHomeworkAssessor from "../../student/homeworks/PeerHomeworkAssessor";
import {deepCopy} from "../../app/utils/deepCopy";
import {API, graphqlOperation} from "aws-amplify";
import {fullHomeworkByAsmntAndStudentId, listFullHomeworks} from "../../graphql/customQueries";
import {reportError} from "../../developer/DevUtils";
import {reviewsByHmwkAndAssessorId} from "../../graphql/queries";
import {v4 as uuid} from "uuid";
import moment from "moment";
import {createHomework, createReview} from "../../graphql/mutations";
import {setActiveUiScreenMode, setReviews, updateSingleReview} from "../../app/store/appReducer";
import {fetchGradeForStudent} from "../../lmsConnection/RingLeader";
import {getHomeworkStatus} from "../../tool/ToolUtils";


function InstructorDraftAssessor(props) {
  const dispatch = useDispatch();
  const {students, reviewedStudentId, assignment} = props;
  const rubricCriteria = assignment.toolAssignmentData.rubricCriteria;

  const activeUser = useSelector(state => state.app.activeUser);
  const reviewsByActiveUser = useSelector(state => state.app.reviews);
  const [reviewedStudent, setReviewedStudent] = useState(students.find(s => s.id === reviewedStudentId));
  const [reviewOfStudent, setReviewOfStudent] = useState(null);

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
    if (!students.length) return;
    if (!reviewedStudentId) {
      setReviewOfStudent(null);
      return;
    }

    console.log(`#students = ${students.length}, #instructorReviews = ${reviewsByActiveUser.length}, reviewedStudent = ${reviewedStudentId}`)


    let theStudent = students.find(s => s.id === reviewedStudentId);
    let theReview = reviewsByActiveUser.find(r => r.assessorId === activeUser.id && r.homeworkId === theStudent.homework.id);
    if (!theReview && theStudent.homework.id) {
      fetchReviewAndSetReviewedStudent(theStudent);
    } else {
      setReviewOfStudent(theReview);
      setReviewedStudent(theStudent);
    }

  }, [students, reviewsByActiveUser, reviewedStudentId])




  async function fetchReviewAndSetReviewedStudent(theStudent) {
    try {
      const fetchReviewsResult = await API.graphql({
        query: reviewsByHmwkAndAssessorId,
        variables: {
          assessorId: {eq: activeUser.id},
          homeworkId: theStudent.homework.id
        },
      });

      if (!fetchReviewsResult.data.reviewsByHmwkAndAssessorId.items?.length) {
        console.warn("NO instructor's review exists for this student. Attempting to create.")
        const freshReview = Object.assign({}, EMPTY_REVIEW, {
          id: uuid(),
          beganOnDate: moment().valueOf(),
          homeworkId: theStudent.homework.id,
          assessorId: activeUser.id,
          assignmentId: assignment.id
        });
        await API.graphql({query: createReview, variables: {input: freshReview}});
        await dispatch(updateSingleReview(freshReview));
      } else {
        const theReview = fetchReviewsResult.data.reviewsByHmwkAndAssessorId.items[0];
        const altReviewsByUser = [...reviewsByActiveUser];
        const rIndex = altReviewsByUser.findIndex(r => r.id === theReview.id);
        delete theReview.createdAt;
        delete theReview.updatedAt;
        if (rIndex >= 0) { altReviewsByUser.splice(rIndex, 1, theReview); } else { altReviewsByUser.push(theReview) }
        await dispatch(updateSingleReview(theReview));
      }

      setReviewedStudent(theStudent);
    } catch (error) {
      reportError(error, `We're sorry. There was an error while attempting to fetch your review of the current student. Please wait a moment and try again.`);
    }

  }

  function onWindowResized() {
    let height = gradingBarRef.current.getBoundingClientRect().height;
    setGradingBarHeight(height + 120);
  }



  // function onReviewUpdated(studentHomework, updatedAllocations) {
    // let updatedStudent = deepCopy(reviewedStudent);
    // updatedStudent.homework.toolHomeworkData.commentsOnDraft = [...studentHomework.toolHomeworkData.commentsOnDraft];
    // updatedStudent.homework.toolHomeworkData.criterionRatingsOnDraft = [...studentHomework.toolHomeworkData.criterionRatingsOnDraft];
    //
    // // if (updatedAllocations) setAllocations(updatedAllocations);
    // setReviewedStudent(updatedStudent);
    // props.onStudentUpdated(updatedStudent, updatedAllocations);
  // }


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


  // TODO: Allocation Change 11 & 12
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

        {hasStudentDoneWork() && reviewOfStudent &&
        <Row className={'m-0 p-0 h-100'}>
          <Col className='rounded p-0'>
            <PeerHomeworkAssessor
              // refreshHandler={fetchAndSetActiveUserCurrentHomework}
              key={reviewedStudent.id}
              excessHeight={gradingBarHeight}
              submitBtnRef={submitBtnRef}
              isInstructorAssessment={true}
              assignment={assignment}
              homework={reviewedStudent.homework}
              onRatingChanges={onRatingChanges}
              // onReviewUpdated={onReviewUpdated}
              review={reviewOfStudent}
            />
          </Col>
        </Row>
        }
    </Fragment>
	)
}

export default InstructorDraftAssessor;