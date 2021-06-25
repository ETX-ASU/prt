import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {EMPTY_REVIEW, HOMEWORK_PROGRESS} from "../../app/constants";
import {Row, Col} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import HomeworkAssessor from "../../student/homeworks/HomeworkAssessor";
import {API} from "aws-amplify";
import {reportError} from "../../developer/DevUtils";
import {reviewsByHmwkAndAssessorId} from "../../graphql/queries";
import {v4 as uuid} from "uuid";
import moment from "moment";
import {createReview} from "../../graphql/mutations";
import {updateSingleReview} from "../../app/store/appReducer";


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
  const [gradingBarHeight, setGradingBarHeight] = useState(200);
  const [manualScore, setManualScore] = useState(0);
  const [triggerSubmit, setTriggerSubmit] = useState(false);

  const maxPosRatingPoints = Math.max(...assignment.toolAssignmentData.rubricRanks.map(r => r.points));


  useEffect(() => {
    window.addEventListener('resize', onWindowResized);
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [gradingBarRef])

  useEffect(() => {
    console.log(` >>> InstructorDraftAssessor: [ reviewsByActiveUser | reviewedStudentId]`)

    if (!students.length) return;
    if (!reviewedStudentId) {
      setReviewOfStudent(null);
      return;
    }

    console.log(`#instructorReviews = ${reviewsByActiveUser?.length}, reviewedStudent = ${reviewedStudentId}`)


    let theStudent = students.find(s => s.id === reviewedStudentId);
    let theReview = reviewsByActiveUser?.find(r => r.assessorId === activeUser.id && r.homeworkId === theStudent.homework.id);
    if (!theReview && theStudent.homework.id) {
      fetchReviewAndSetReviewedStudent(theStudent);
    } else {
      setReviewOfStudent(theReview);
      setReviewedStudent(theStudent);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewsByActiveUser, reviewedStudentId])





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
        const altReviewsByUser = (reviewsByActiveUser) ? [...reviewsByActiveUser] : [];
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

  function refreshHandler() {
    console.log('InstructorDraftAssessor.refreshHandler() called');
    setTriggerSubmit(true);
    props.refreshGrades();
  }

  function clearTrigger() {
    setTriggerSubmit(false);
  }

	return (
	  <Fragment>
        <div ref={gradingBarRef}>
          <GradingBar
            manualScore={manualScore}
            refreshHandler={refreshHandler}
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
            <HomeworkAssessor
              triggerSubmit={triggerSubmit}
              clearTrigger={clearTrigger}

              key={reviewedStudent.id}
              excessHeight={gradingBarHeight}
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