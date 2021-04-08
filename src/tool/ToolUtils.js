import {EMPTY_HOMEWORK, HOMEWORK_PROGRESS} from "../app/constants";
import {EMPTY_CRITERION, EMPTY_RUBRIC} from "./constants";
import {v4 as uuid} from "uuid";


export function getHomeworkStatus(gradeData, homework) {
  const {gradingProgress} = gradeData;
  return (gradingProgress === HOMEWORK_PROGRESS.fullyGraded) ? HOMEWORK_PROGRESS.fullyGraded :
    (homework.submittedOnDate) ? HOMEWORK_PROGRESS.submitted :
      (homework.createdAt !== homework.updatedAt) ? HOMEWORK_PROGRESS.inProgress :
        HOMEWORK_PROGRESS.notBegun;
}


export function calcMaxScoreForAssignment(assignment) {
  // TOOL-DEV: Use your own code here to receive toolAssignmentData and use it to return the maximum possible score for this assignment
  // return assignment.toolAssignmentData.quizQuestions.reduce((acc, q) => acc + q.gradePointsForCorrectAnswer, 0);
  // TODO: For now, we'll hard-wire all assignments as worth 0-100pts so it is treated as a percentage
  return 100;
}

export function getNewToolHomeworkDataForAssignment(assignment) {
  // TOOL-DEV: Use your own code here to receive toolAssignmentData and use it create a new "blank" instance of the assignment
  // (This is the student's homework before the student has done any work on it.)
  return Object.assign({}, EMPTY_HOMEWORK);
}

export function calcPercentCompleted(assignment, homework) {
  // TOOL-DEV: Create a method to calculate and return a percentage of the work a student completed on their homework)
  // This should be returned as a number between 0 and 100
  if (!homework?.id || !homework?.beganOnDate) return 0;

  // TODO: If this is a draft/writing round then return 0 if it hasn't been submitted yet, and 100 if it has. Eventually, this might be based on word count.
  const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
  if (roundNum % 2) return (homework.submittedOnDate) ? 100 : 0;

  // This is an even round, which means it is a review/assessment round. These are based on how many peers this student has reviewed vs how many they must review.
  // TODO: We need to write calculation to determine completion of this. For now, it's 50%.
  return 50;
}

export function calcAutoScore(assignment, homework) {
  // TOOL-DEV: Given the assignment data and a student's current homework data, provide a method to return the grade a  student
  // should receive for their work. The should not go below 0, and should never exceed the value returned by calcMaxScoreForAssignment()
  if (!homework?.id || !homework?.beganOnDate) return 0;
  // return assignment.toolAssignmentData.quizQuestions.reduce((acc, q, i) => {
  //   let points = (homework.toolHomeworkData.quizAnswers[i] === q.correctAnswerIndex) ? q.gradePointsForCorrectAnswer : 0;
  //   return acc + points;
  // }, 0)

  // TODO: Need to write routine to autograde critiques and/or writing sessions
  return 0;
}


export function generateDefaultRubric() {
  let defaultRubric = Object.assign({}, EMPTY_RUBRIC);
  defaultRubric.criteria[0] = Object.assign({}, EMPTY_CRITERION, {id:uuid(), orderNum:0, name:'Tasty'});
  defaultRubric.criteria[0].rankSummaries = ['I ate my own fingers just to get more of the flavor', 'Induces compulsive eating.', "I would eat this.", "I wouldn't eat this if I had a choice.", "I'd drink dumpster juice before eating that again. \n" +
  "\n" +
  "And now I'm going to throw a lot of text into this description in order to see how it handles the scrolling. In fact. I'm going to copy an paste this thing to kingdom come now that I think about it.\n" +
  "\n" +
  "I mean, heck. Why not? Just git er done, right?"]
  defaultRubric.criteria[1] = Object.assign({}, EMPTY_CRITERION, {id:uuid(), orderNum:1, name:'Sticky'});
  defaultRubric.criteria[1].rankSummaries =  ["It's like eating a rodent glue trap", "Good substitute for Elmer's", "Makes a nice mess", "More oily than sticky", "Petrolium Jelly is sticks better than this."]
  defaultRubric.criteria[2] = Object.assign({}, EMPTY_CRITERION, {id:uuid(), orderNum:2, name:'Filling'});
  defaultRubric.criteria[2].rankSummaries =  ["Filling like a neutron star", "I can't walk after eating it", "Filling like a bag of rocks", "Barely noticed I ate it", "Filling only if you're a cockroach and you had a snack just a few minutes ago."]
  return defaultRubric;
}