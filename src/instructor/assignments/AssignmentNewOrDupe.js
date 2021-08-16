import React, {Fragment, useCallback, useEffect, useState} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {
  createAssignment,
  updateAssignment
} from '../../graphql/mutations';
import {UI_SCREEN_MODES, MODAL_TYPES, APP_VERSION} from "../../app/constants";
import {editAssignmentPhase, editDupedAssignment, setActiveUiScreenMode} from "../../app/store/appReducer";
import "./assignments.scss";

import {Container, Row, Button, Col} from "react-bootstrap";
import {getAssignment, listAssignments} from "../../graphql/queries";
import LoadingIndicator from "../../app/components/LoadingIndicator";
import HeaderBar from "../../app/components/HeaderBar";
import ConfirmationModal from "../../app/components/ConfirmationModal";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import { faPlus, faCopy } from '@fortawesome/free-solid-svg-icons'
import {reportError} from "../../developer/DevUtils";

import styles from "./AssignmentNewOrDupe.module.scss";

library.add(faCopy, faPlus);

const ASSIGNMENT_CHOICE = {
  fromScratch: "fromScratch",
  addRound: "addRound",
  duplicate: "duplicate"
}

function AssignmentNewOrDupe() {
  const dispatch = useDispatch();
  const activeUser = useSelector(state => state.app.activeUser);
  const courseId = useSelector(state => state.app.courseId);

  const [allAssignments, setAllAssignments] = useState([]);
  const [nonStrandedAssignments, setNonStrandedAssignments] = useState([]);
  const [strandedAssignments, setStrandedAssignments] = useState([]);
  const [isFetchingAssignments, setIsFetchingAssignments] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedDupeAssignment, setSelectedDupeAssignment] = useState(null);
  const [selectedRootAssignment, setSelectedRootAssignment] = useState(null);

  const [choice, setChoice] = useState('');

  const fetchAssignmentList = useCallback(async(activeUserId) => {
    setIsFetchingAssignments(true);

    try {
      let nextTokenVal = null;
      let allAssignments = [];

      do {
        const assignmentQueryResults = await API.graphql(graphqlOperation(listAssignments,
            {filter:{ownerId:{eq:activeUserId}}, nextToken:nextTokenVal}));
        nextTokenVal = assignmentQueryResults.data.listAssignments.nextToken;
        allAssignments.push(...assignmentQueryResults.data.listAssignments.items);
      } while (nextTokenVal);

      if (window.isDevMode) console.log("------> assignmentIds: ", allAssignments.map(a => a.id));
      setAllAssignments(allAssignments);
      const stranded = allAssignments.filter(a => a.lineItemId === '');
      setStrandedAssignments(stranded);
      // const counts = getOriginPhaseCounts(allAssignments);

      // TODO: An origin assignment with a subsequent phase assignment that is stranded can NOT have a new phase created
      // until that phase is deleted or recovered

      if (allAssignments.length) {
        const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id: allAssignments[0].id}));
        setSelectedDupeAssignment(assignmentQueryResults.data.getAssignment);
        const nonStrandeds = allAssignments.filter((a) => (!!a.lineItemId && !a.toolAssignmentData.sequenceIds.length));

        // TODO: when showing options for a target assignment, filter out any previous rounds. That is, only show root assignments

        setNonStrandedAssignments(nonStrandeds);
        if (nonStrandeds.length) setSelectedRootAssignment(nonStrandeds[0]);
      }

      setIsFetchingAssignments(false);
    } catch (error) {
      reportError(error, `We're sorry. There was an error while attempting to fetch the list of your existing assignments for duplication.`);
    }
  }, [])

  useEffect(() => {
    fetchAssignmentList(activeUser.id);
  }, [fetchAssignmentList, activeUser.id]);

  function getPhaseSequenceIds(all, originId) {
    const siblingAssignments = all.filter(a => a.toolAssignmentData.sequenceIds.length && a.toolAssignmentData.sequenceIds[0] === originId);
    siblingAssignments.sort((a,b) => b.toolAssignmentData.sequenceIds.length - a.toolAssignmentData.sequenceIds.length);
    if (!siblingAssignments.length) return [originId];
    return [...siblingAssignments[0].toolAssignmentData.sequenceIds, siblingAssignments[0].id];
  }

  function closeModalAndEditDuped(dupedAssignmentData) {
    setActiveModal(null);
    dispatch(editDupedAssignment(dupedAssignmentData));
  }

  function closeModalAndEditPhase(phaseAssignmentData) {
    setActiveModal(null);
    dispatch(editAssignmentPhase(phaseAssignmentData));
  }

  async function handleDupeSelectionMade() {
    const selectedId = document.getElementById('dupeAssignmentSelector').value;
    const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id: selectedId}));
    setSelectedDupeAssignment(assignmentQueryResults.data.getAssignment);
  }

  async function handleRootSelectionMade() {
    const selectedId = document.getElementById('targetAssignmentSelector').value;
    const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id: selectedId}));
    setSelectedRootAssignment(assignmentQueryResults.data.getAssignment);
  }

  async function handleAddAssignmentPhase(e) {
    // TODO: Look at handleSubmitBtn line 60 from AssignmentCreator.js -- we must hook it up to LMS upon creation
    const rootDetails = getRootAssignmentDetails();

    try {
      const inputData = Object.assign({}, selectedRootAssignment, {
        title: `${selectedRootAssignment.title} - ${rootDetails.roundName}`,
        lineItemId: '',
        appVersion: APP_VERSION,
        id: uuid(),
        ownerId: activeUser.id,
        courseId,
        lockOnDate: 0,
        toolAssignmentData: {
          sequenceIds: rootDetails.previousSequenceIds,
          minReviewsRequired: 3,
          minPeersBeforeAllocating: 6
        }
      });
      delete inputData.createdAt;
      delete inputData.updatedAt;

      // Temporarily disabled for development and testing
      const result = await API.graphql({query: createAssignment, variables: {input: inputData}})
      closeModalAndEditPhase(result.data.createAssignment);
      // setActiveModal({
      //   type:MODAL_TYPES.confirmNewAssignmentPhaseCreated,
      //   data: [selectedRootAssignment.title, result.data.createAssignment]
      // });
    } catch (error) {
      reportError(error, `We're sorry. There was a problem creating your ${selectedRootAssignment.title} assignment round.`);
    }
  }

  async function handleDupeAssignment(e) {
    try {
      const inputData = Object.assign({}, selectedDupeAssignment, {
        title: (!selectedDupeAssignment.lineItemId) ? selectedDupeAssignment.title : `Copy of ${selectedDupeAssignment.title}`,
        lineItemId: '',
        id: (!selectedDupeAssignment.lineItemId) ? selectedDupeAssignment.id : uuid(),
        ownerId: activeUser.id,
        courseId,
        lockOnDate: 0
      });
      delete inputData.createdAt;
      delete inputData.updatedAt;

      let result;
      if (selectedDupeAssignment.lineItemId) {
        result = await API.graphql({query: createAssignment, variables: {input: inputData}})
        setActiveModal({
          type: MODAL_TYPES.confirmAssignmentDuped,
          data: [selectedDupeAssignment.title, result.data.createAssignment]
        });
      } else {
        result = await API.graphql({query: updateAssignment, variables: {input: inputData}});
        setActiveModal({
          type: MODAL_TYPES.confirmAssignmentRecovered,
          data: [selectedDupeAssignment.title, result.data.updateAssignment]
        });
      }

    } catch (error) {
      reportError(error, `We're sorry. There was a problem duplicating and saving your new assignment.`);
    }
  }

  function handleCreateAssignment(e) {
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.createAssignment));
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.confirmNewAssignmentPhaseCreated:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Assignment Phase Saved'}
              buttons={[{name:'Edit New Assignment Phase', onClick:() => closeModalAndEditPhase(activeModal.data[1])}]}>
            {(activeModal.data[0].lineItemId)
              ? <p>Your {activeModal.data[0]} assignment has been saved and it is now accessible in your LMS.</p>
              : <p>You will now be taken to a screen so you can edit your {activeModal.data[0].title} assignment settings.</p>
            }
          </ConfirmationModal>
        );
      case MODAL_TYPES.confirmAssignmentDuped:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Assignment Saved'}
              buttons={[{name:'Edit Duplicated Assignment', onClick:() => closeModalAndEditDuped(activeModal.data[1])}]}>
            {(activeModal.data[0].lineItemId)
              ? <p>A new assignment called Copy of {activeModal.data[0]} has been saved! It is now accessible in your
                LMS.</p>
              : <p>You will now be taken to a screen so you can edit and customize your newly duplicated assignment.</p>
            }
          </ConfirmationModal>
        );
      case MODAL_TYPES.confirmAssignmentRecovered:
        return (
          <ConfirmationModal isStatic onHide={() => setActiveModal(null)} title={'Assignment Saved'}
              buttons={[{name:'Edit Recovered Assignment', onClick:() => closeModalAndEditDuped(activeModal.data[1])}]}>
            <p>Your assignment "{activeModal.data[0]}" has been recovered. You will now be taken to a screen so you can
              edit and customize this recovered assignment.</p>
          </ConfirmationModal>
        );
      default:
        return;
    }
  }

  function getRootAssignmentDetails() {
    const previousSequenceIds = getPhaseSequenceIds(allAssignments, selectedRootAssignment.id);
    let roundNamePrefix = ['1st', '2nd', '3rd', '4th', '5th'];
    let roundNum = previousSequenceIds.length - 1;
    let isNextRoundAReviewSession = (!(roundNum%2));
    let totalDraftRounds = Math.floor(roundNum/2) + 1;
    let totalReviewRounds = totalDraftRounds - 1 + (roundNum%2);
    let roundName = (isNextRoundAReviewSession) ? `${roundNamePrefix[totalDraftRounds - 1]} Draft Review` : `${roundNamePrefix[totalDraftRounds]} Draft`;
    return ({roundNum, roundName, previousSequenceIds, isNextRoundAReviewSession, totalDraftRounds, totalReviewRounds})
  }

  function getNewRoundSummary() {
    let details = getRootAssignmentDetails();

    const draftRoundNames = ['no', '1st', '1st and 2nd', '1st, 2nd, and 3rd', '1st, 2nd, 3rd, and 4th', '1st, 2nd, 3rd, 4th, and 5th'];
    const reviewRoundNames = ['no', '1st', '1st and 2nd', '1st, 2nd, and 3rd', '1st, 2nd, 3rd, and 4th', '1st, 2nd, 3rd, 4th, and 5th'];

    if (details.roundNum === 0) return (<p>
      The {selectedRootAssignment.title} assignment currently only has the initial 1st draft round. That means you can
      assign this new round as a peer review session of {selectedRootAssignment.title}.
    </p>);
    if (details.roundNum > 1 && details.isNextRoundAReviewSession) return (<p>
      The {selectedRootAssignment.title} assignment is currently linked to {draftRoundNames[details.totalDraftRounds]} round
      written drafts and {reviewRoundNames[details.totalReviewRounds]} review rounds. That means this target assignment's next
      round is a Peer Review Session of the previously created draft #{details.totalDraftRounds}.
    </p>);
    return (<p>
      The {selectedRootAssignment.title} assignment is currently linked to {draftRoundNames[details.totalDraftRounds]} drafts and
      a {reviewRoundNames[details.totalReviewRounds]} draft review session. That means this target assignment is ready
      for draft #{details.totalDraftRounds+1} to be created.
    </p>);
  }

  return (
    <Fragment>
      {activeModal && renderModal()}
      <HeaderBar withLogo title='Create New Assignment - PRTv2' canCancel={false} canSave={false}>
        {/*{!choice && <Button disabled className='mr-2'>Cancel</Button>}*/}
        {choice && <Button variant="secondary" className='mr-2' onClick={() => setChoice('')}>Cancel</Button>}
        {/*<Button disabled>Update</Button>*/}
      </HeaderBar>

      <Container className='m-2'>
        {isFetchingAssignments &&
        <Row>
          <LoadingIndicator className='p-4 text-center h-100 align-middle' isDarkSpinner={true} loadingMsg={'FETCHING DATA'} size={3}/>
        </Row>
        }

        {!isFetchingAssignments && (choice === ASSIGNMENT_CHOICE.addRound) &&
        <Fragment>
          <Row className={styles.optionRow}>
            <Col className={styles.column}>
              <h3 className={'mt-3 mb-2'}>Create new round</h3>
              <p>Select origin assignment.</p>
              <div className="form-group">
                <select onChange={handleRootSelectionMade} className="form-control" id="targetAssignmentSelector" disabled={!allAssignments.length}>
                  {nonStrandedAssignments.map((a, i) =>
                    <option key={i} value={a.id}>{a.title}</option>
                  )}
                </select>
                {!nonStrandedAssignments.length &&
                <h4 className='mt-2'>*You must have at least 1 existing assignment before you can create an additional draft or review
                  session round.</h4>
                }
                {getNewRoundSummary()}
              </div>
            </Col>
          </Row>
          <Row className={styles.actionsRow}>
            <Col className={styles.column}>
              <div className={styles.actions}>
                <Button className='align-middle' onClick={handleAddAssignmentPhase} disabled={!allAssignments.length}>
                  <FontAwesomeIcon className='btn-icon' icon={faCopy}/>
                  {(getRootAssignmentDetails().isNextRoundAReviewSession) ? 'Create Peer Review Session' : 'Create New Draft'}
                </Button>
              </div>
            </Col>
          </Row>
        </Fragment>
        }

        {!isFetchingAssignments && (choice === ASSIGNMENT_CHOICE.duplicate) &&
        <Fragment>
          <Row className={styles.optionRow}>
            <Col className={styles.column}>
              <h3 className={'mt-3 mb-2'}>Duplicate an assignment</h3>
              <p>Choose an existing assignment, duplicate it, then customize it.</p>
              <div className="form-group">
                <select onChange={handleDupeSelectionMade} className="form-control" id="dupeAssignmentSelector"
                        disabled={!allAssignments.length}>
                  {allAssignments.map((a, i) =>
                    <option key={i} value={a.id}>{!a.lineItemId && '*'}{a.title}</option>
                  )}
                </select>
                {!allAssignments.length &&
                <h4>*You must have at least 1 existing assignment before you can duplicate anything.</h4>
                }
              </div>
              {!!strandedAssignments.length &&
              <p>*Marked assignments were not properly created in the LMS, but can be recovered by selecting it
                here.</p>}
            </Col>
          </Row>
          <Row className={styles.actionsRow}>
            <Col className={styles.column}>
              <div className={styles.actions}>
                <Button className='align-middle' onClick={handleDupeAssignment} disabled={!allAssignments.length}>
                  <FontAwesomeIcon className='btn-icon' icon={faCopy}/>
                  {(!allAssignments.length || selectedDupeAssignment?.lineItemId) ? 'Duplicate' : 'Recover'}
                </Button>
              </div>
            </Col>
          </Row>
        </Fragment>
        }

        {!isFetchingAssignments && (!choice) &&
        <Fragment>
          <Row className={styles.row}>
            <Col>Create a new assignment by selecting one of the following options:</Col>
          </Row>
          <Row className={styles.optionRow}>
            <Col className={styles.column}>
              <div>
                <h3 className="mt-3 mb-2">Start a new assignment from scratch</h3>
                <p>This will create a new 1st draft writing assignment from scratch.</p>
              </div>
            </Col>

            <div className={styles.separator}>
              <span>OR</span>
            </div>

            <Col className={styles.column}>
              <div>
                <h3 className="mt-3 mb-2">Create new Draft Round or Peer Review Round</h3>
                <p>This option allows you to select a previously created "target" assignment. Doing so allows you to
                  assign students the task of
                  writing a new draft of their previous work. OR, alternatively, you can create a peer review
                  session in which students review
                  the work of their peers and provide feedback to each other on that target assignment.</p>
              </div>
            </Col>

            <div className={styles.separator}>
              <span>OR</span>
            </div>

            <Col className={styles.column}>
              <div>
                <h3 className="mt-3 mb-2">Duplicate or Recover an assignment</h3>
                  <p>Choose an existing assignment, duplicate it, then customize it. OR-- if you tried to create an
                    assignment and it wasn't properly
                    generated in your LMS, check here to recover potentially stranded assignments.</p>
              </div>
            </Col>
          </Row>

          <Row className={styles.actionsRow}>
            <Col className={styles.column}>
              <div className={styles.actions}>
                <Button className="align-middle" onClick={handleCreateAssignment}>
                  <FontAwesomeIcon className='btn-icon' icon={faPlus} />
                  New Assignment
                </Button>
              </div>
            </Col>

            <div className={styles.separator}></div>

            <Col className={styles.column}>
              <div className={styles.actions}>
                {!!nonStrandedAssignments.length && (
                  <Button className='align-middle' onClick={() => setChoice(ASSIGNMENT_CHOICE.addRound)}>
                    <FontAwesomeIcon className='btn-icon' icon={faPlus}/>
                    New Draft or Peer Review
                  </Button>
                )}
                {!nonStrandedAssignments.length &&
                  <h4>You currently have no assignments. Additional draft rounds or peer review sessions can't be created
                  without an original assignment 1st draft to base them on.</h4>
                }
              </div>
            </Col>

            <div className={styles.separator}></div>

            <Col className={styles.column}>
              <div className={styles.actions}>
                <Button className='align-middle' onClick={() => setChoice(ASSIGNMENT_CHOICE.duplicate)}
                  disabled={!allAssignments.length}
                >
                  <FontAwesomeIcon className='btn-icon' icon={faCopy}/>
                  Duplicate or Recover
                </Button>
              </div>
            </Col>
          </Row>
        </Fragment>
        }
      </Container>
    </Fragment>
  )
}

export default AssignmentNewOrDupe;