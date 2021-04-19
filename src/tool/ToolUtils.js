import {APP_TOP_PADDING, EMPTY_HOMEWORK, HOMEWORK_PROGRESS} from "../app/constants";
import {EMPTY_CRITERION, EMPTY_RUBRIC} from "./constants";
import {v4 as uuid} from "uuid";
import {useEffect} from "react";



// export function sizerFunc(zoneRefs, widthSetter, heightSetter, toolBarHeightSetter) {
//   return () => {
//
//     function onWindowResized() {
//       const {width, height} = getAvailableContentDims(zoneRefs.headerZoneRef, zoneRefs.footerZoneRef, zoneRefs.rteToolbar)
//       if (heightSetter) heightSetter(height - (zoneRefs.extraHeight || 0));
//       if (widthSetter) widthSetter(width - (zoneRefs.extraWidth || 0));
//     }
//     window.addEventListener('resize', onWindowResized);
//     onWindowResized();
//
//     return () => {
//       window.removeEventListener('resize', onWindowResized);
//     }
//   }
// }


export function getAvailableContentDims(headerElem, footerElem, extra) {
    let excluded = 0;
    if (headerElem) excluded += headerElem.current.getBoundingClientRect().bottom;
    if (headerElem && headerElem.current.style.marginBottom) excluded += parseInt(headerElem.current.style.marginBottom);
    if (footerElem) excluded += footerElem.current.getBoundingClientRect().height;
    if (footerElem && footerElem.current.style.marginBottom) excluded += parseInt(footerElem.current.style.marginTop);

    const appElem = document.querySelector('#app-container');
    const appBounds = appElem.getBoundingClientRect();
    excluded += appBounds.top;
    if (extra) excluded += extra;
    return ({
      height: appBounds.height - excluded,
      width: appBounds.width
    });
}

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

  defaultRubric.criteria[0] = Object.assign({}, EMPTY_CRITERION, {id:uuid(), orderNum:0, name:'Idea / Content'});
  defaultRubric.criteria[0].rankSummaries = [
    "Focus on the topic is clear and well defined.\n\n" +
    "Rich sense of detail creates a vivid, authentic picture of both environment and action, showing knowledge and insight.\n\n" +
    "Fresh approach holds reader’s attention.",

    "Focus on topic is clear.\n\n" +
    "Sufficient detail creates a picture showing some knowledge and insight.\n\n" +
    "Fresh approach adds something to reader’s understanding.",

    "Focus on topic is somewhat defined.\n\n" +
    "Underdeveloped details show little knowledge and are too general to create a picture.\n\n" +
    "Fresh approach attempted, but lacks supporting details.\n",

    "Focus on topic is not clearly defined.\n\n" +
    "Limited, or disconnected details show virtually no understanding of the subject.\n\n" +
    "Approach is common.",

    "No focus\n\n" +
    "Not able to identify any idea coherent or topic."
  ]

  defaultRubric.criteria[1] = Object.assign({}, EMPTY_CRITERION, {id:uuid(), orderNum:1, name:'Organization'});
  defaultRubric.criteria[1].rankSummaries =  [
    "Memorable introduction and conclusion are clearly linked (may be explicit or implicit connection) and establish focus.\n\n" +
    "Sequencing of details is effective and logical.\n\n" +
    "Transitions effectively tie the ideas of the paper together",

    "Effective introduction and conclusion are clearly linked (may be explicit or implicit connection) and establish focus.\n\n" +
    "Sequencing of details is logical.\n\n" +
    "Transitions attempt to tie the ideas of the paper together",

    "Introduction and conclusion attempt to establish focus.\n\n" +
    "Sequencing of details is limited.\n\n" +
    "Transitions are limited.",

    "Introduction /conclusion may be absent or lack focus.\n\n" +
    "Sequencing of details is not clear.\n\n" +
    "Transitions are not evident.",

    "Lacks any sequence-- sudden changes in past, present, future reference to events in such a way the reader is left confused."
  ]

  defaultRubric.criteria[2] = Object.assign({}, EMPTY_CRITERION, {id:uuid(), orderNum:2, name:'Voice'});
  defaultRubric.criteria[2].rankSummaries =  [
    "The writer’s personality is expressed; confidence and feeling are apparent.\n\n" +
    "Individual, powerful commitment to the topic is obvious.\n\n" +
    "Connection to audience and purpose is excellent.\n\n" +
    "Writing evokes strong emotion",

    "Writer’s personality is undefined; writing is cautious.\n\n" +
    "Commitment to topic is limited.\n\n" +
    "Connection to audience and purpose is limited.\n\n" +
    "Writing evokes limited emotion in the reader.",

    "Writer’s personality pokes through; confidence and feeling fade in and out.\n\n" +
    "A commitment to the topic is apparent.\n\n" +
    "Connection to audience and purpose is appropriate.\n\n" +
    "The writing evokes some emotion in the reader.",

    "Writer’s personality is not evident.\n\n" +
    "Commitment to topic is lacking.\n\n" +
    "Connection to audience and purpose is lacking.\n\n" +
    "Writing evokes minimal emotion in the reader.",

    "Plagiarism.\n\n" +
    "Leaves the reader utterly unengaged and wondering regretfully about the minutes or hours lost reading it."
  ]

  return defaultRubric;
}