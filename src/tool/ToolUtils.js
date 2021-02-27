import {EMPTY_HOMEWORK, HOMEWORK_PROGRESS} from "../app/constants";


export function getHomeworkStatus(gradeData, homework) {
  const {gradingProgress} = gradeData;
  return (gradingProgress === HOMEWORK_PROGRESS.fullyGraded) ? HOMEWORK_PROGRESS.fullyGraded :
    (homework.submittedOnDate) ? HOMEWORK_PROGRESS.submitted :
      (homework.beganOnDate) ? HOMEWORK_PROGRESS.inProgress :
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
  if (assignment.roundNum % 2) return (homework.submittedOnDate) ? 100 : 0;

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
