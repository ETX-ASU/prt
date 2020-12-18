import React, {Fragment, useEffect, useState} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import { v4 as uuid } from "uuid";

import {createAssignment, updateAssignment} from '../../graphql/mutations';
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
// import AssignmentsSelectionList from "../lmsLinkage/AssignmentsSelectionList";
library.add(faCopy, faPlus);


function AssignmentNewOrDupe() {
	const dispatch = useDispatch();
	const activeUser = useSelector(state => state.app.activeUser);
  const courseId = useSelector(state => state.app.courseId);

  const [assignments, setAssignments] = useState([]);
  const [strandedAssignments, setStrandedAssignments] = useState([]);
  const [isFetchingAssignments, setIsFetchingAssignments] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

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
          {filter:{ownerId:{eq:activeUser.id}},
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
        const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id:allAssignments[0].id}));
        setSelectedAssignment(assignmentQueryResults.data.getAssignment);
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

  async function handleSelectionMade() {
    const selectedId = document.getElementById('assignmentSelector').value;
    const assignmentQueryResults = await API.graphql(graphqlOperation(getAssignment, {id:selectedId}));
    setSelectedAssignment(assignmentQueryResults.data.getAssignment);
  }

  async function handleDupeAssignment(e) {
    try {
      const inputData = Object.assign({}, selectedAssignment, {
        title: (!selectedAssignment.lineItemId) ? selectedAssignment.title : `Copy of ${selectedAssignment.title}`,
        lineItemId:'',
        isLinkedToLms: false,
        id: (!selectedAssignment.lineItemId) ? selectedAssignment.id : uuid(),
        ownerId: activeUser.id,
        courseId,
        lockOnDate: 0
      });
      delete inputData.createdAt;
      delete inputData.updatedAt;

      let result;
      if (selectedAssignment.lineItemId) {
        result = await API.graphql({query: createAssignment, variables: {input: inputData}})
        setActiveModal({type:MODAL_TYPES.confirmAssignmentDuped, data:[selectedAssignment.title, result.data.createAssignment]});
      } else {
        result = await API.graphql({query: updateAssignment, variables: {input: inputData}});
        setActiveModal({type:MODAL_TYPES.confirmAssignmentRecovered, data:[selectedAssignment.title, result.data.updateAssignment]});
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
      case MODAL_TYPES.confirmAssignmentDuped:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Assignment Saved'}
            buttons={[{ name: 'Edit Duplicated Assignment', onClick: () => closeModalAndEditDuped(activeModal.data[1]) }]}>
            { (activeModal.data[0].lineItemId)
              ? <p>A new assignment called Copy of {activeModal.data[0]} has been saved! It is now accessible in your LMS.</p>
              : <p>You will now be taken to a screen so you can edit and customize your newly duplicated assignment.</p>
            }
          </ConfirmationModal>
        );
      case MODAL_TYPES.confirmAssignmentRecovered:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Assignment Saved'}
            buttons={[{ name: 'Edit Recovered Assignment', onClick: () => closeModalAndEditDuped(activeModal.data[1]) }]}>
            <p>Your assignment "{activeModal.data[0]}" has been recovered. You will now be taken to a screen so you can edit and customize this recovered assignment.</p>
          </ConfirmationModal>
        );
    }
  }

	return (
		<Fragment>
      {activeModal && renderModal()}
      <HeaderBar title='Create New Assignment - Proxy' canCancel={false} canSave={false} >
        <Button disabled className='mr-2'>Cancel</Button>
        <Button disabled>Update</Button>
      </HeaderBar>

      <Container className='m-2'>
        {isFetchingAssignments &&
          <Row>
            <LoadingIndicator className='p-4 text-center h-100 align-middle' isDarkSpinner={true} loadingMsg={'FETCHING DATA'} size={3} />
          </Row>
        }

        {!isFetchingAssignments &&
        <Fragment>
          <Row className={'mt-4 mb-4'}>
            <Col>Create a new assignment by selecting one of the following options:</Col>
          </Row>
          <Row className={'ml-2'}>
            <Col className={'col-6 splitter-right'}>
              <Container className={'pt-4 pl-4 pr-4 h-100'}>
                <Row>
                  <Col>
                    <h3 className={'mt-3 mb-2'}>Start a new assignment</h3>
                    <p>Staring a new assignment will provide you with a blank template to build from.</p>
                  </Col>
                </Row>
              </Container>
            </Col>

            <div className={'vertical-separator'}>
              <h3 className={'spacer-word'}>OR</h3>
            </div>

            <Col className={'col-6'}>
              <Container className={'pt-4 pl-4 pr-4'}>
                <Row>
                  <Col>
                    <h3 className={'mt-3 mb-2'}>Duplicate an assignment</h3>
                    <p>Choose an existing assignment, duplicate it, then customize it.</p>
                    <div className="form-group">
                      <select onChange={handleSelectionMade} className="form-control" id="assignmentSelector" disabled={!assignments.length} >
                        {assignments.map((a,i) =>
                          <option key={i} value={a.id}>{!a.lineItemId && '*'}{a.title}</option>
                        )}
                      </select>
                      {!assignments.length &&
                        <h4>*You must have at least 1 existing assignment before you can duplicate anything.</h4>
                      }
                    </div>
                    {!!strandedAssignments.length && <p>*Marked assignments were not properly created in the LMS, but can be recovered by selecting it here.</p>}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>

          <Row className={'ml-2'}>
            <Col className={'col-6 splitter-right'}>
              <Container className={'p-4 h-100'}>
                <Row className={'mt-auto'}>
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={handleCreateAssignment}>
                      <FontAwesomeIcon className='btn-icon' icon={faPlus} />
                      New Assignment
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col className={'col-6'}>
              <Container className={'p-4'}>
                <Row className={'mt-auto'}>
                  <Col className={'xbg-light text-center p-2'}>
                    <Button className='align-middle' onClick={handleDupeAssignment} disabled={!assignments.length}>
                      <FontAwesomeIcon className='btn-icon' icon={faCopy} />
                      {(!assignments.length || selectedAssignment?.lineItemId) ? 'Duplicate' : 'Recover'}
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