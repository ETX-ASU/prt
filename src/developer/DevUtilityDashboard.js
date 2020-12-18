import React, {useState} from 'react';
import {API, graphqlOperation} from 'aws-amplify';
import {useDispatch, useSelector} from "react-redux";
import {Button, Col, Container, Row} from "react-bootstrap";
import moment from "moment";
import {testComments, createMockGrades, deleteMockGrades} from "../lmsConnection/MockRingLeader";
import {HOMEWORK_PROGRESS, ROLE_TYPES} from "../app/constants";
import { v4 as uuid } from "uuid";
import {shuffle} from "../app/utils/shuffle";
import {calcAutoScore} from "../tool/ToolUtils";
import {createHomework, deleteHomework} from "../graphql/mutations";
import {listHomeworks} from "../graphql/queries";
import {hasValidSession} from "../lmsConnection/RingLeader";
import aws_exports from "../aws-exports";
import {reportError} from "./DevUtils";

function DevUtilityDashboard() {
  const dispatch = useDispatch();
  const assignment = useSelector(state => state.app.assignment);
  const members = useSelector(state => state.app.members);

  const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);
  const [formData, setFormData] = useState({percentGraded:25, percentSubmitted:60, percentInProgress:10, percentNotBegun:5});


  async function handleSubmitButton() {
    if (!assignment.id) {
      alert("You have not provided an assignment id in the URL!");
      return;
    }

    const students = members.filter(s => s.roles.indexOf(ROLE_TYPES.learner > -1));
    const totalStudents = students.length;

    let {percentInProgress, percentSubmitted, percentNotBegun, percentGraded} = formData;
    const progressStats = shuffle([
      ...Array(Math.floor(totalStudents * percentNotBegun/100)).fill(HOMEWORK_PROGRESS.notBegun),
      ...Array(Math.floor(totalStudents * percentInProgress/100)).fill(HOMEWORK_PROGRESS.inProgress),
      ...Array(Math.floor(totalStudents * percentSubmitted/100)).fill(HOMEWORK_PROGRESS.submitted),
      ...Array(Math.floor(totalStudents * percentGraded/100)).fill(HOMEWORK_PROGRESS.fullyGraded)
    ]);

    const mockHomeworks = students.map((s, i) => {
      const progress = progressStats[i];
      let beganOnDate = 0;
      let submittedOnDate = (progress === HOMEWORK_PROGRESS.submitted || progress === HOMEWORK_PROGRESS.fullyGraded) ? moment().valueOf() : 0;
      let quizAnswers = Array(assignment.toolAssignmentData.quizQuestions.length).fill(-1);

      if (progress !== HOMEWORK_PROGRESS.notBegun) {
        beganOnDate = moment().valueOf();
        quizAnswers = assignment.toolAssignmentData.quizQuestions.map(q => rand(0, q.answerOptions.length));
        if (progress === HOMEWORK_PROGRESS.inProgress) {
          quizAnswers.pop();
          quizAnswers.push(-1); // partial result so always make last one not started.
        }
      }

      return ({
        id: uuid(),
        assignmentId: assignment.id,
        studentOwnerId: s.id.toString(),
        beganOnDate,
        toolHomeworkData: {
          quizAnswers
        },
        submittedOnDate,
        isLocked: false,
      })
    })

    const gradedHomeworks = mockHomeworks.filter((h,i) => progressStats[i] === HOMEWORK_PROGRESS.fullyGraded);
    const mockGrades = gradedHomeworks.map(h => {
      let scoreGiven = calcAutoScore(assignment, h);
      let comment = (!rand(0,3)) ? testComments[rand(0, testComments.length)] : '';
      let gradingProgress = HOMEWORK_PROGRESS.fullyGraded;
      return ({assignmentId:assignment.id, studentId:h.studentOwnerId, scoreGiven, gradingProgress, comment })
    })

    const dbHomeworks = mockHomeworks.filter(h => h.beganOnDate);
    console.log(`-----> dbHomeworks`, dbHomeworks);

    let results;
    try {
      results = await Promise.all(dbHomeworks.map(h => API.graphql({query: createHomework, variables: {input: h}})));
      createMockGrades(mockGrades);
      console.log(`-----> mockGrades`, mockGrades);

    } catch (error) {
      reportError(error, `Sorry. An error occurred.`);
    }
    console.log(`-----> results`, results);
  }

  async function handleDeleteHomeworks() {
    let results;
    try {
      const fetchHomeworkResult = await API.graphql(graphqlOperation(listHomeworks, {filter: {assignmentId: {eq:assignment.id}}}));
      if (!fetchHomeworkResult.data.listHomeworks.items.length) return;
      results = await Promise.all(fetchHomeworkResult.data.listHomeworks.items.map(h => API.graphql({query: deleteHomework, variables: {input: {id: h.id}}})));
      console.log(`homeworks deleted: `, results);
      deleteMockGrades(assignment.id);
      console.log('grades for homework deleted.');
    } catch (error) {
      reportError(error, `Sorry. An error occurred.`);
    }
  }


  function handlePercentChange(e, prop) {
    let data = Object.assign({}, formData);
    data[prop] = parseInt(e.target.value);
    let {percentNotBegun, percentInProgress, percentSubmitted, percentGraded} = data;
    let curTotal = percentNotBegun + percentInProgress + percentSubmitted + percentGraded;

    while (curTotal > 100 && percentNotBegun) { curTotal--; percentNotBegun--; }
    while (curTotal > 100 && percentInProgress) { curTotal--; percentInProgress--; }
    while (curTotal > 100 && percentSubmitted) { curTotal--; percentSubmitted--; }
    while (curTotal > 100 && percentGraded) { curTotal--; percentGraded--; }

    setFormData({percentNotBegun, percentInProgress, percentSubmitted, percentGraded});
  }


	return (
    <Container className='student-dashboard dashboard bg-white rounded h-100 m-4 p-4'>
      <form>

        <Row className='xbg-light'>
          <Col><h3>Generate Students & Homework</h3></Col>
          <Col><Button onClick={handleSubmitButton}>Generate</Button></Col>
        </Row>
        <Row>
          <Col>
            <div className="input-bar lumped-with-next">
              <label># Graded:</label>
              <input type="number" min={0} max={100} step={5} onChange={e => handlePercentChange(e, 'percentGraded')} value={formData.percentGraded}/>
            </div>
          </Col>
          <Col>
            <div className="input-bar lumped-with-next">
              <label># Submitted:</label>
              <input type="number" min={0} max={100} step={5} onChange={e => handlePercentChange(e, 'percentSubmitted')} value={formData.percentSubmitted}/>
            </div>
          </Col>
          <Col>
            <div className="input-bar lumped-with-next">
              <label># InProgress:</label>
              <input type="number" min={0} max={100} step={5} onChange={e => handlePercentChange(e, 'percentInProgress')} value={formData.percentInProgress}/>
            </div>
          </Col>
          <Col>
            <div className="input-bar lumped-with-next">
              <label># Not Begun:</label>
              <input type="number" min={0} max={100} step={5} onChange={e => handlePercentChange(e, 'percentNotBegun')} value={formData.percentNotBegun}/>
            </div>
          </Col>
        </Row>
        <Row className='pt-4 pl-2 pr-2'>
        </Row>

        <Row className='xbg-light'>
          <Col><h3>Clear Students & Homework</h3></Col>
          <Col><Button onClick={handleDeleteHomeworks}>Delete Homeworks</Button></Col>
        </Row>

      </form>
    </Container>
	);
}

export default hasValidSession(aws_exports) ? DevUtilityDashboard :  null;
