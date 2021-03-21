import React, {Fragment, useEffect, useState} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {
  createAssignment as createAssignmentMutation,
  createAssignment,
  updateAssignment
} from '../../graphql/mutations';
import {UI_SCREEN_MODES, MODAL_TYPES} from "../../app/constants";
import {editDupedAssignment, setActiveUiScreenMode} from "../../app/store/appReducer";
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
import {handleConnectToLMS} from "../../lmsConnection/RingLeader";
// import AssignmentsSelectionList from "../lmsLinkage/AssignmentsSelectionList";
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

  const [assignments, setAssignments] = useState([]);
  const [nonStrandedAssignments, setNonStrandedAssignments] = useState([]);
  const [strandedAssignments, setStrandedAssignments] = useState([]);
  const [isFetchingAssignments, setIsFetchingAssignments] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedDupeAssignment, setSelectedDupeAssignment] = useState(null);
  const [selectedTargetAssignment, setSelectedTargetAssignment] = useState(null);

  const [choice, setChoice] = useState('');

  useEffect(() => {
    fetchAssignmentList();
  }, []);


  async function fetchAssignmentList() {
    setIsFetchingAssignments(true);

    try {
      let nextTokenVal = null;
      let allAssignments = [];

      do {
        const assignmentQueryResults = await API.graphql(graphqlOperation(listAssignments,
          {
            filter: {ownerId: {eq: activeUser.id}},
            nextToken: nextTokenVal
          }));
        nextTokenVal = assignmentQueryResults.data.listAssignments.nextToken;
        allAssignments.push(...assignmentQueryResults.data.listAssignments.items);
      } while (nextTokenVal);

      if (window.isDevMode) console.log("------> assignmentIds: ", allAssignments.map(a => a.id));
      setAssignments(allAssignments);
      const stranded = allAssignments.filter(a => a.lineItemId === '');
      setStrandedAssignments(stranded);

      if (allAssignments.length) {
        const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id: allAssignments[0].id}));
        setSelectedDupeAssignment(assignmentQueryResults.data.getAssignment);
        const nonStrandeds = allAssignments.filter((a) => !!a.lineItemId);

        // TODO: when showing options for a target assignment, filter out any previous rounds. That is, only show original

        setNonStrandedAssignments(nonStrandeds);
        if (nonStrandeds.length) setSelectedTargetAssignment(nonStrandeds[0]);
      }

      setIsFetchingAssignments(false);
    } catch (error) {
      reportError(error, `We're sorry. There was an error while attempting to fetch the list of your existing assignments for duplication.`);
    }
  }

  function closeModalAndEditDuped(dupedAssignmentData) {
    setActiveModal(null);
    dispatch(editDupedAssignment(dupedAssignmentData));
  }

  async function handleDupeSelectionMade() {
    const selectedId = document.getElementById('dupeAssignmentSelector').value;
    const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id: selectedId}));
    setSelectedDupeAssignment(assignmentQueryResults.data.getAssignment);
  }

  async function handleTargetSelectionMade() {
    const selectedId = document.getElementById('targetAssignmentSelector').value;
    const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id: selectedId}));
    setSelectedTargetAssignment(assignmentQueryResults.data.getAssignment);
  }


  async function handleAddNewRound(e) {
    const details = getTargetDetails();
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.addNewRound));

/*    try {
      const inputData = Object.assign({}, selectedTargetAssignment, {
        title: `${selectedTargetAssignment.title} - ${details.roundName}`,
        lineItemId: '',
        isLinkedToLms: false,
        id: uuid(),
        ownerId: activeUser.id,
        courseId,
        lockOnDate: 0,
        toolAssignmentData: {
          rubric: selectedTargetAssignment.toolAssignmentData.rubric,
          originId: selectedTargetAssignment.id,
          roundNum: details.roundNum + 1,
          minReviewsRequired: 3,
          minPeersBeforeAllocating: 6,
          allocations: []
        }
      });
      delete inputData.createdAt;
      delete inputData.updatedAt;

      // Temporarily disabled for development and testing
      const result = await API.graphql({query: createAssignmentMutation, variables: {input: inputData}});
      if (window.isDevMode && result) {
        setActiveModal({type:MODAL_TYPES.confirmAssignmentSaved, id:inputData.id});
      } else {
        await handleConnectToLMS(inputData);
      }
    } catch (error) {
      reportError(error, `We're sorry. There was a problem saving your new assignment round.`);
    }*/
  }


  async function handleDupeAssignment(e) {
    try {
      const inputData = Object.assign({}, selectedDupeAssignment, {
        title: (!selectedDupeAssignment.lineItemId) ? selectedDupeAssignment.title : `Copy of ${selectedDupeAssignment.title}`,
        lineItemId: '',
        isLinkedToLms: false,
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


  // async function handleAddAssignmentRound(e) {
  //   // const isReviewSession = !(selectedTargetAssignment.toolAssignmentData.roundNum % 2);
  //   dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.addNewRound));
  // }


  function handleCreateAssignment(e) {
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.createAssignment));
  }

  function handleReturnToLms() {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.returnToLmsScreen))
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.confirmAssignmentDuped:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Assignment Saved'}
                             buttons={[{
                               name: 'Edit Duplicated Assignment',
                               onClick: () => closeModalAndEditDuped(activeModal.data[1])
                             }]}>
            {(activeModal.data[0].lineItemId)
              ? <p>A new assignment called Copy of {activeModal.data[0]} has been saved! It is now accessible in your
                LMS.</p>
              : <p>You will now be taken to a screen so you can edit and customize your newly duplicated assignment.</p>
            }
          </ConfirmationModal>
        );
      case MODAL_TYPES.confirmAssignmentRecovered:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Assignment Saved'}
                             buttons={[{
                               name: 'Edit Recovered Assignment',
                               onClick: () => closeModalAndEditDuped(activeModal.data[1])
                             }]}>
            <p>Your assignment "{activeModal.data[0]}" has been recovered. You will now be taken to a screen so you can
              edit and customize this recovered assignment.</p>
          </ConfirmationModal>
        );
    }
  }

  function getTargetDetails() {
    let roundNamePrefix = ['1st', '2nd', '3rd', '4th', '5th'];
    let roundNum = selectedTargetAssignment.toolAssignmentData.roundNum || 0;
    let isNextRoundAReviewSession = (!(roundNum%2));
    let totalDraftRounds = Math.floor(roundNum/2) + 1;
    let totalReviewRounds = totalDraftRounds - 1 + (roundNum%2);
    let roundName = (isNextRoundAReviewSession) ? `Review of ${roundNamePrefix[totalReviewRounds]}` : `${roundNamePrefix[totalDraftRounds]} Draft`;
    return ({roundNum, roundName, isNextRoundAReviewSession, totalDraftRounds, totalReviewRounds})
  }

  function getNewRoundSummary() {
    let details = getTargetDetails();

    const draftRoundNames = ['1st', '1st and 2nd', '1st, 2nd, and 3rd', '1st, 2nd, 3rd, and 4th', '1st, 2nd, 3rd, 4th, and 5th'];
    const reviewRoundNames = ['1st', '1st and 2nd', '1st, 2nd, and 3rd', '1st, 2nd, 3rd, and 4th', '1st, 2nd, 3rd, 4th, and 5th'];

    if (details.roundNum === 0) return (<p>
      The {selectedTargetAssignment.title} assignment currently only has the initial 1st draft round. That means you can
      assign this new round as a peer review session of {selectedTargetAssignment.title}.
    </p>);
    if (details.roundNum > 1 && details.isNextRoundAReviewSession) return (<p>
      The {selectedTargetAssignment.title} assignment is currently linked to {draftRoundNames[details.totalDraftRounds]} round
      written drafts and {reviewRoundNames[details.totalReviewRounds]} review rounds. That means this target assignment's next
      round is a Peer Review Session of the previously created draft #{details.totalDraftRounds}.
    </p>);
    return (<p>
      The {selectedTargetAssignment.title} assignment is currently linked to {draftRoundNames[details.totalDraftRounds]} round
      written drafts and {reviewRoundNames[details.totalReviewRounds]} review rounds. That means this target assignment is ready
      for a draft #{details.totalDraftRounds+1} to be created.
    </p>);
  }

  // if (!isFetchingAssignments && !nonStrandedAssignments.length) return (
  //   <Fragment>
  //     <HeaderBar title='Create New Assignment - PRTv2' canCancel={false} canSave={false}>
  //       <Button disabled className='mr-2'>Cancel</Button>
  //     </HeaderBar>
  //
  //     <Container className='m-2'>
  //       <Row>
  //         <Col>
  //           <h4 className='mt-2'>You must have at least 1 existing assignment before you can create an additional draft or review
  //             session round.</h4>
  //         </Col>
  //       </Row>
  //     </Container>
  //   </Fragment>
  // )

  return (
    <Fragment>
      {activeModal && renderModal()}
      <HeaderBar title='Create New Assignment - PRTv2' canCancel={false} canSave={false}>
        {/*{!choice && <Button disabled className='mr-2'>Cancel</Button>}*/}
        {choice && <Button className='mr-2' onClick={() => setChoice('')}>Cancel</Button>}
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
          <Row>
            <Col>
              <h3 className={'mt-3 mb-2'}>Create new round</h3>
              <p>Select target assignment.</p>
              <div className="form-group">
                <select onChange={handleTargetSelectionMade} className="form-control" id="targetAssignmentSelector" disabled={!assignments.length}>
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
          <Row>
            <Col className={'col-12'}>
              <Container className={'p-4'}>
                <Row className={'mt-auto'}>
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={handleAddNewRound} disabled={!assignments.length}>
                      <FontAwesomeIcon className='btn-icon' icon={faCopy}/>
                      {!(selectedTargetAssignment.toolAssignmentData.roundNum % 2) ? 'Create Peer Review Session' : 'Create New Draft'}
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Fragment>
        }

        {!isFetchingAssignments && (choice === ASSIGNMENT_CHOICE.duplicate) &&
        <Fragment>
          <Row>
            <Col>
              <h3 className={'mt-3 mb-2'}>Duplicate an assignment</h3>
              <p>Choose an existing assignment, duplicate it, then customize it.</p>
              <div className="form-group">
                <select onChange={handleDupeSelectionMade} className="form-control" id="dupeAssignmentSelector"
                        disabled={!assignments.length}>
                  {assignments.map((a, i) =>
                    <option key={i} value={a.id}>{!a.lineItemId && '*'}{a.title}</option>
                  )}
                </select>
                {!assignments.length &&
                <h4>*You must have at least 1 existing assignment before you can duplicate anything.</h4>
                }
              </div>
              {!!strandedAssignments.length &&
              <p>*Marked assignments were not properly created in the LMS, but can be recovered by selecting it
                here.</p>}
            </Col>
          </Row>
          <Row>
            <Col className={'col-4'}>
              <Container className={'p-4'}>
                <Row className={'mt-auto'}>
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={handleDupeAssignment} disabled={!assignments.length}>
                      <FontAwesomeIcon className='btn-icon' icon={faCopy}/>
                      {(!assignments.length || selectedDupeAssignment?.lineItemId) ? 'Duplicate' : 'Recover'}
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Fragment>
        }

        {!isFetchingAssignments && (!choice) &&
        <Fragment>
          <Row className={'mt-4 mb-4'}>
            <Col>Create a new assignment by selecting one of the following options:</Col>
          </Row>
          <Row className={'ml-2'}>
            <Col className={'col-4 splitter-right'}>
              <Container className={'pt-4 pl-4 pr-4 h-100'}>
                <Row>
                  <Col>
                    <h3 className={'mt-3 mb-2'}>Start a new assignment from scratch</h3>
                    <p>This will create a new 1st draft writing assignment from scratch.</p>
                  </Col>
                </Row>
              </Container>
            </Col>

            <div className={'vertical-separator'}>
              <h3 className={'spacer-word'}>OR</h3>
            </div>

            <Col className={'col-4 splitter-right'}>
              <Container className={'pt-4 pl-4 pr-4 h-100'}>
                <Row>
                  <Col>
                    <h3 className={'mt-3 mb-2'}>Create new Draft Round or Peer Review Round</h3>
                    <p>This option allows you to select a previously created "target" assignment. Doing so allows you to
                      assign students the task of
                      writing a new draft of their previous work. OR, alternatively, you can create a peer review
                      session in which students review
                      the work of their peers and provide feedback to each other on that target assignment.</p>
                  </Col>
                </Row>
              </Container>
            </Col>

            <div className={'vertical-separator right-side'}>
              <h3 className={'spacer-word'}>OR</h3>
            </div>

            <Col className={'col-4'}>
              <Container className={'pt-4 pl-4 pr-4'}>
                <Row>
                  <Col>
                    <h3 className={'mt-3 mb-2'}>Duplicate or Recover an assignment</h3>
                    <p>Choose an existing assignment, duplicate it, then customize it. OR-- if you tried to create an
                      assignment and it wasn't properly
                      generated in your LMS, check here to recover potentially stranded assignments.</p>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>

          <Row className={'ml-2'}>
            <Col className={'col-4 splitter-right'}>
              <Container className={'p-4 h-100'}>
                <Row className={'mt-auto'}>
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={handleCreateAssignment}>
                      <FontAwesomeIcon className='btn-icon' icon={faPlus}/>
                      New Assignment
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Col>

            <Col className={'col-4 splitter-right'}>
              <Container className={'p-4 h-100'}>
                <Row className={'mt-auto'}>
                  {!!nonStrandedAssignments.length &&
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={() => setChoice(ASSIGNMENT_CHOICE.addRound)}>
                      <FontAwesomeIcon className='btn-icon' icon={faPlus}/>
                      New Draft or Peer Review
                    </Button>
                  </Col>}
                  {!nonStrandedAssignments.length &&
                  <Col>
                    <h4>You currently have no assignments. Additional draft rounds or peer review sessions can't be created
                    without an original assignment 1st draft to base them on.</h4>
                  </Col>
                  }

                </Row>
              </Container>
            </Col>

            <Col className={'col-4'}>
              <Container className={'p-4'}>
                <Row className={'mt-auto'}>
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={() => setChoice(ASSIGNMENT_CHOICE.duplicate)}
                            disabled={!assignments.length}>
                      <FontAwesomeIcon className='btn-icon' icon={faCopy}/>
                      Duplicate or Recover
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>

        </Fragment>
        }
      </Container>
    </Fragment>
  )
}

export default AssignmentNewOrDupe;