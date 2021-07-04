import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {HOMEWORK_PROGRESS} from "../../app/constants";
import {Row, Col, Button} from 'react-bootstrap';
import "../../student/homeworks/homeworks.scss";
import GradingBar from "./gradingBar/GradingBar";
import AssessedHomeworkViewer from "../../student/homeworks/AssessedHomeworkViewer";
import {API, graphqlOperation} from "aws-amplify";
import {listHomeworks} from "../../graphql/queries";
import {reportError} from "../../developer/DevUtils";
import {addDraftHomeworks} from "../../app/store/appReducer";
// import HomeworkAssessor from "../../student/homeworks/HomeworkAssessor";
// import {API} from "aws-amplify";
// import {reportError} from "../../developer/DevUtils";
// import {reviewsByHmwkAndAssessorId} from "../../graphql/queries";
// import {v4 as uuid} from "uuid";
// import moment from "moment";
// import {createReview} from "../../graphql/mutations";
// import {updateSingleReview} from "../../app/store/appReducer";

/*
* The "gradedStudent" is the one the instructor is grading. This student has evaluated/assessed several peers.
* The "assessedStudent" and "assessedHomework" is the draft that the gradedStudent evaluated. It is the draft we are looking at.
* The
*
* */
function InstructorPeerReviewAssessor(props) {
  const dispatch = useDispatch();
  const {students, assignment} = props;

  const gradingBarRef = useRef(null);

  const gradedStudentId = useSelector(state => state.app.currentlyReviewedStudentId);
  const allReviews = useSelector(state => state.app.reviews);
  const draftHomeworks = useSelector(state => state.app.draftHomeworks);
  // const manualScore = useSelector(state => state.app.manualScore);
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  const [gradedStudent, setGradedStudent] = useState(students.find(s => s.id === gradedStudentId));
  const [reviewsByStudent, setReviewsByStudent] = useState(null);
  const [activeReview, setActiveReview] = useState(null);
  const [associatedReviewDraftsLoaded, setAssociatedReviewDraftsLoaded] = useState(false);

  const [gradingBarHeight, setGradingBarHeight] = useState(200);
  const [manualScore, setManualScore] = useState(0);
  const [triggerSubmit, setTriggerSubmit] = useState(false);



  useEffect(() => {
    setActiveReview(null);
    if (!students.length) return;
    let theStudent = students.find(s => s.id === gradedStudentId);
    setGradedStudent(theStudent);
    let revs = allReviews.filter(r => r.assessorId === gradedStudentId);
    setReviewsByStudent(revs)
  }, [gradedStudentId])

  useEffect(() => {
    window.addEventListener('resize', onWindowResized);
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [gradingBarRef])

  useEffect(() => {
    setAssociatedReviewDraftsLoaded(false);
    if (!reviewsByStudent?.length) return;

    const fetchDraftHomeworks = async(missingDraftIds) => {
      const filterIdsArr = missingDraftIds.map(mdid => ({id: {eq: mdid}}));
      let nextTokenVal = null;
      let additionalDraftHomeworks = [];

      try {
        do {
          const result = await API.graphql(graphqlOperation(listHomeworks, {
            filter: {or: filterIdsArr},
            nextToken: nextTokenVal
          }));

          nextTokenVal = result.data.listHomeworks.nextToken;
          additionalDraftHomeworks.push(...result.data.listHomeworks.items);
        } while (nextTokenVal);

        await dispatch(addDraftHomeworks(additionalDraftHomeworks));
        await setAssociatedReviewDraftsLoaded(true);
        setActiveReview(reviewsByStudent[0]);
      } catch (error) {
        reportError(error, `We're sorry. There was an error while attempting to fetch all of this student's assessments of his/her peer's work.`);
      }
    }

    let missingDraftIds = reviewsByStudent.map(r => r.homeworkId);
    missingDraftIds = missingDraftIds.filter(id => draftHomeworks.findIndex(dh => dh.id === id) === -1);
    if (missingDraftIds.length) {
      fetchDraftHomeworks(missingDraftIds)
    } else {
      setAssociatedReviewDraftsLoaded(true);
      setActiveReview(reviewsByStudent[0]);
    };
  }, [reviewsByStudent])




  // useEffect(() => {
  //   console.log(` >>> InstructorPeerReviewAssessor: [ reviewsByInstructor | gradedStudentId]`)
  //
  //   if (!students.length) return;
  //   // if (!gradedStudentId) {
  //   //   setReviewOfStudent(null);
  //   //   return;
  //   // }
  //
  //   console.log(`#instructorReviews = ${reviewsByInstructor?.length}, gradedStudentId = ${gradedStudentId}`)
  //
  //
  //   let theStudent = students.find(s => s.id === gradedStudentId);
  //   // let theReview = reviewsByInstructor?.find(r => r.assessorId === activeUser.id && r.homeworkId === theStudent.homework.id);
  //   // if (!theReview && theStudent.homework.id) {
  //   //   fetchReviewAndSetReviewedStudent(theStudent);
  //   // } else {
  //   //   setReviewOfStudent(theReview);
  //     setGradedStudent(theStudent);
  //   // }
  //
  // }, [reviewsByInstructor, gradedStudentId])



  function onWindowResized() {
    let height = gradingBarRef.current.getBoundingClientRect().height;
    setGradingBarHeight(height + 120);
  }


  function getStatusMsg() {
    const studentRefName = getStudentRefName();
    if(gradedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded && !gradedStudent?.homework?.toolHomeworkData?.quizAnswers?.length) {
      return `${studentRefName} did no work, but you have already given them a grade anyway.`;
    }

    switch(gradedStudent.homeworkStatus) {
      case(HOMEWORK_PROGRESS.notBegun): return `${studentRefName} has not started their work yet.`;
      case(HOMEWORK_PROGRESS.inProgress): return`${studentRefName} completed A PORTION of their homework, but never submitted it.`;
      case(HOMEWORK_PROGRESS.submitted): return`${studentRefName}'s homework is ready for grading.`;
      case(HOMEWORK_PROGRESS.fullyGraded): return`You have already graded ${studentRefName}'s homework`;
      default: return `no progress information for ${studentRefName}`;
    }
  }

  function getStudentRefName() {
    const {randomOrderNum} =  gradedStudent;
    return (isHideStudentIdentity) ? `Student #${randomOrderNum}` : gradedStudent.name;
  }

  function hasStudentDoneWork() {
    return (gradedStudent.homeworkStatus === HOMEWORK_PROGRESS.submitted ||
      gradedStudent.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded);
  }

  function refreshHandler() {
    setTriggerSubmit(true);
    props.refreshGrades();
  }


  function onShowReview() {
    console.log('onShowReview() triggered');
  }


  function handleReviewSelected(rev) {
    console.log('handleReviewSelected() triggered', {rev});
    setActiveReview(rev)
  }

	return (
	  <Fragment>
        <div ref={gradingBarRef}>
          <GradingBar
            manualScore={gradedStudent.autoScore}
            refreshHandler={refreshHandler}
            assignment={assignment}
            reviewedStudent={gradedStudent}
          />
        </div>

        {(!hasStudentDoneWork() || draftHomeworks.length === 0) &&
        <Row className='mt-5 mb-5'>
          <Col className='w-auto xt-large xtext-dark font-weight-bold'>{getStatusMsg()}</Col>
        </Row>
        }

        {/*{hasStudentDoneWork() && reviewOfStudent &&*/}
        {hasStudentDoneWork() && reviewsByStudent &&
        <Row className={'m-0 p-0'}>
          <Col className='rounded p-0'>
            <p>{reviewsByStudent.length} of {assignment.toolAssignmentData.minReviewsRequired} reviews completed ({gradedStudent.percentCompleted}%):
              {reviewsByStudent.map((r, i) =>
                <Button key={r.id} variant={'link'} onClick={() => handleReviewSelected(r)}>
                  review #{i}
                </Button>
              )}
            </p>

            {/*<HomeworkAssessor*/}
            {/*  triggerSubmit={triggerSubmit}*/}
            {/*  clearTrigger={clearTrigger}*/}

            {/*  key={gradedStudent.id}*/}
            {/*  excessHeight={gradingBarHeight}*/}
            {/*  isInstructorAssessment={true}*/}
            {/*  assignment={assignment}*/}
            {/*  homework={gradedStudent.homework}*/}
            {/*  onRatingChanges={onRatingChanges}*/}
            {/*  // onReviewUpdated={onReviewUpdated}*/}
            {/*  review={reviewOfStudent}*/}
            {/*/>*/}
          </Col>
        </Row>
        }

        {hasStudentDoneWork() && activeReview && associatedReviewDraftsLoaded && (!!draftHomeworks?.length) &&
        <Row className={'m-0 m-0 pb-2'}>
          <Col className='rounded p-0'>
            <AssessedHomeworkViewer
              isInstructorAssessment={true}
              isAssessmentOfReview={true}
              key={activeReview.id}
              assignment={assignment}
              excessHeight={gradingBarHeight + 36}
              reviewsForUser={[activeReview]}
              homework={draftHomeworks.find(h => h.id === activeReview.homeworkId)}
              engagedPeerReviewId={activeReview.id}
              onShowReview={onShowReview}
            />
          </Col>
        </Row>
      }
    </Fragment>
	)
}

export default InstructorPeerReviewAssessor;