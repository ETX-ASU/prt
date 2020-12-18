import React, {Fragment, useEffect, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, MODAL_TYPES, ROLE_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import LoadingIndicator from "../../app/components/LoadingIndicator";
import {
  setActiveUiScreenMode,
  setGradesData,
  addHomeworksData,
  setCurrentlyReviewedStudentId,
  toggleHideStudentIdentity
} from "../../app/store/appReducer";
import {Button, Container, Row, Col} from 'react-bootstrap';
import {API, graphqlOperation} from "aws-amplify";
import {listHomeworks} from "../../graphql/queries";
import HomeworkReview from "./HomeworkReview";
import HomeworkListing from "./HomeworkListing";
import {fetchAllGrades, sendInstructorGradeToLMS} from "../../lmsConnection/RingLeader";
import HeaderBar from "../../app/components/HeaderBar";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faEdit, faPen, faChevronLeft, faCheck} from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../../app/components/ConfirmationModal";
import {shuffle} from "../../app/utils/shuffle";
import {
  calcAutoScore, calcMaxScoreForAssignment,
  calcPercentCompleted,
  getHomeworkStatus,
  getNewToolHomeworkDataForAssignment
} from "../../tool/ToolUtils";
import {reportError} from "../../developer/DevUtils";
library.add(faEdit, faPen, faChevronLeft);


const SUBMISSION_MODAL_OPTS = {
  all: 'all',
  submittedOnly: 'submittedOnly'
}

function AssignmentViewer(props) {
	const dispatch = useDispatch();
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);
  const reviewedStudentId = useSelector(state => state.app.currentlyReviewedStudentId);
  const assignment = useSelector(state => state.app.assignment);
  const homeworks = useSelector(state => state.app.homeworks);
  const members = useSelector(state => state.app.members);
  const grades = useSelector(state => state.app.grades);

  const [isLoadingHomeworks, setIsLoadingHomeworks] = useState(true);
  const [nextTokenVal, setNextTokenVal] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [students, setStudents] = useState([]);


  useEffect(() => {
    console.log('assignment changed')
    if (!assignment?.id) return;
    console.log('fetching scores etc')
    fetchScores();
    fetchBatchOfHomeworks('INIT');
  }, [assignment.id, assignment]);

  useEffect(() => {
    if (nextTokenVal) fetchBatchOfHomeworks(nextTokenVal);
  }, [nextTokenVal]);


  useEffect(() => {
    if (!assignment?.id || !members.length) return;
    let studentsOnly = members.filter(m => m.roles.indexOf(ROLE_TYPES.learner) > -1);
    let positions = shuffle(studentsOnly.map((h, i) => i+1));

    const enhancedDataStudents = studentsOnly.map(s => {
      let gradeDataForStudent = (grades) ? Object.assign({}, grades.find(g => g.studentId === s.id)) : null;
      if (!gradeDataForStudent) gradeDataForStudent = {scoreGiven:0, scoreMaximum:100, gradingProgress:HOMEWORK_PROGRESS.notBegun, comment:'' };

      let homeworkForStudent = homeworks.find(h => (h.studentOwnerId === s.id && h.assignmentId === assignment.id));
      if (!homeworkForStudent) homeworkForStudent = getNewToolHomeworkDataForAssignment(assignment);

      let percentCompleted = calcPercentCompleted(assignment, homeworkForStudent);
      let autoScore = calcAutoScore(assignment, homeworkForStudent);
      let homeworkStatus = getHomeworkStatus(gradeDataForStudent, homeworkForStudent);
      return Object.assign({}, s, {
        randomOrderNum: positions.shift(),
        scoreGiven: gradeDataForStudent.scoreGiven,
        scoreMaximum: gradeDataForStudent.scoreMaximum,
        comment: gradeDataForStudent.comment,
        percentCompleted,
        autoScore,
        homeworkStatus,
        homework: homeworkForStudent
      });
    });

    setStudents(enhancedDataStudents);
    console.log("ENHANCED STUDENTS[29] NOW: ", enhancedDataStudents[29]);
  }, [assignment, members, homeworks, grades, isHideStudentIdentity]);


  /**
   * AWS and DynamoDB limits listing query results to 20 results OR 1MB total, whichever comes first. Thus,
   * we query until we have all of the homework fetched for this assignment.
   *
   * This might get sluggish if we have a class with hundreds of students with large amounts of data fetched
   * in each homework record. If that is the case, the expensive portion of homework should not be fetched here
   * and instead only fetched when that individual homework is shown/reviewed by the instructor or student.
   *
   * @returns {Promise<void>}
   */
  async function fetchBatchOfHomeworks(token) {
    if (token === "INIT") token = null;

    API.graphql(graphqlOperation(listHomeworks, {
      filter: {assignmentId: {eq: assignment.id}},
      nextToken: token
    }))
    .then(handleHomeworksResult)
    .catch((error) =>
      reportError(error, `We're sorry. There was a problem fetching student work.`)
    );
  }

  function handleHomeworksResult(result) {
    let rawHomeworks = result.data.listHomeworks.items;

    if (isLoadingHomeworks) setIsLoadingHomeworks(false);

    dispatch(addHomeworksData(rawHomeworks));

    setNextTokenVal(result.data.listHomeworks.nextToken);
  }

  async function fetchScores() {
    try {
      // const scoreMaximum = calcMaxScoreForAssignment(assignment);
      let grades = await fetchAllGrades(assignment.id);
      grades = (grades) ? grades : [];
      grades = grades.map(g => {
        // This is an ugly work-around until I the back-end sends me the correct response.
        const scoreGiven = g.scoreGiven || g.resultScore || 0; // && g.resultMaximum) ? Math.round(scoreMaximum * (g.resultScore / g.resultMaximum)) : 0;
        return ({...g, scoreGiven});
      })
      await dispatch(setGradesData(grades));
      console.log('grades fetched and set', grades);
    } catch (error) {
      reportError(error, `We're sorry. There was an error fetching student grade data. Please wait a moment and try again.`);
    }
  }

	function handleEditBtn() {
		dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.editAssignment));
	}

	async function handleBatchSubmit() {
    setActiveModal({type:MODAL_TYPES.showWaitingForGrades});

    try {
      const radioElems = Array.from(document.getElementsByName('modalRadioOpts'));
      const isSubmittedOnly = radioElems.find(e => e.checked).value === SUBMISSION_MODAL_OPTS.submittedOnly;
      const qualifiedStudents = students.filter(s => s.homeworkStatus !== HOMEWORK_PROGRESS.fullyGraded && (!isSubmittedOnly || s.homeworkStatus === HOMEWORK_PROGRESS.submitted));

      await Promise.all(qualifiedStudents.map(s => handleSubmitScore(s, assignment)));

      console.log("done with all");
      await fetchScores();
    } catch(error) {
      reportError(error, "Sorry. There appears to have been an error when batch submitting grades. Please refresh and try again.");
    } finally {
      setActiveModal(null);
    }
	}

  function toggleHideAndRandomize(e) {
    dispatch(toggleHideStudentIdentity(!isHideStudentIdentity));
  }

  async function handleSubmitScore(student, assignment) {
    const scoreDataObj = {
      assignmentId: assignment.id,
      studentId: student.id,
      scoreGiven: student.autoScore || 0,
      scoreMaximum: calcMaxScoreForAssignment(assignment),
      comment: student.comment || '',
      activityProgress: ACTIVITY_PROGRESS[student.homeworkStatus],
      gradingProgress: HOMEWORK_PROGRESS.fullyGraded
    };

    await sendInstructorGradeToLMS(scoreDataObj);
  }


  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.showBatchSubmitOptions:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Batch Submit'} buttons={[
            {name: 'Cancel', onClick: () => setActiveModal(null)},
            {name: 'Submit', onClick: (e) => handleBatchSubmit(e)},
          ]}>
            <p>Submit auto-scores for...</p>
            <form id={'batchSubmitModalForm'} >
              <div className='ml-4'>
                <input type="radio" name={`modalRadioOpts`} value={SUBMISSION_MODAL_OPTS.all} />
                <label className='ml-2'>All students, including those who did not submit any work</label>
              </div>
              <div className='ml-4'>
                <input type="radio" name={`modalRadioOpts`} defaultChecked={true} value={SUBMISSION_MODAL_OPTS.submittedOnly} />
                <label className='ml-2'>Only students who submitted their work</label>
              </div>
            </form>
            <p className='mt-3'>Note: batch auto submission will <em>not</em> overwrite any scores you previously submitted.</p>
          </ConfirmationModal>
        );

      case MODAL_TYPES.showWaitingForGrades:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Batch Submit... processing'} buttons={[]}>
            <p>Processing Grades Submission.</p>
              <div className='ml-4'>
                <LoadingIndicator loadingMsg={'BATCH SUBMITTING GRADES...'} />
              </div>
            <p className='mt-3'>This make take a few moments.</p>
          </ConfirmationModal>
        );
    }
  }

	return (
    <Fragment>
      {activeModal && renderModal()}

      {(!reviewedStudentId) ?
        <HeaderBar title={`Overview: ${(assignment?.title) ? assignment.title : ''}`}>
          <Button onClick={handleEditBtn}>
            <FontAwesomeIcon className='btn-icon' icon={faPen}/>Edit
          </Button>
        </HeaderBar> :
        <HeaderBar onBackClick={() => dispatch(setCurrentlyReviewedStudentId(''))} title={assignment?.title}>
          <span className='mr-2'>
            <input type={'checkbox'} onChange={toggleHideAndRandomize} checked={isHideStudentIdentity}/>
            Hide identity & randomize
          </span>
        </HeaderBar>
      }

      <Container className="assignment-viewer">
        {props.loading &&
          <div className="nav-pane">
            <LoadingIndicator loadingMsg={'LOADING ASSIGNMENT DATA'} size={3} />
          </div>
        }
        {!reviewedStudentId &&
        <Fragment>
          <Row className='mt-2 mb-2 pt-2 pb-2'>
            <Col className='col-6'>
              <Button onClick={() => setActiveModal({type:MODAL_TYPES.showBatchSubmitOptions})}>
                <FontAwesomeIcon className='btn-icon' icon={faPen} />Batch Submit
              </Button>
            </Col>
            <Col className='text-right'>
              <span className='mr-2'>
                <input className='mr-2' type={'checkbox'} onChange={toggleHideAndRandomize} checked={isHideStudentIdentity}/>
                Hide identity & randomize
              </span>
            </Col>
          </Row>
          <Row className='mt-2 mb-5'>
            <Col>
              <h3>Summary</h3>
              <p className='summary-data xt-med'>{assignment.summary}</p>
            </Col>
            <Col className='col-3 text-right mr-2'>
              <h3>Autoscore</h3>
              <p className='summary-data xt-med float-right'>
                {assignment.isUseAutoScore && <FontAwesomeIcon className='mr-2' icon={faCheck} size='lg'/>}
                {(assignment.isUseAutoScore) ? 'Enabled' : 'Disabled'}
              </p>
            </Col>
          </Row>
          <HomeworkListing isUseAutoScore={assignment.isUseAutoScore} isFetchingHomeworks={isLoadingHomeworks} students={students} studentsPerPage={15}/>
        </Fragment>
        }

        {reviewedStudentId && (students?.length > 0) &&
          <HomeworkReview refreshGrades={fetchScores} assignment={assignment} students={students} reviewedStudentId={reviewedStudentId} />
        }
      </Container>
    </Fragment>
	)
}

export default AssignmentViewer;