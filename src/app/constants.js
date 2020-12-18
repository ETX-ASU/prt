import {EMPTY_TOOL_HOMEWORK_DATA} from '../tool/constants'

export const APP_NAMESPACE = 'QUIZ_APP'; // Change this to name of tool


export const MODAL_TYPES = {
  confirmAssignmentDuped: "confirmAssignmentDuped",
  confirmAssignmentRecovered: "confirmAssignmentRecovered",
  cancelNewAssignmentEditsWarning: "cancelNewAssignmentEditsWarning",
  cancelDupedAssignmentEditsWarning: "cancelDupedAssignmentEditsWarning",
  confirmAssignmentSaved: "confirmAssignmentSaved",
  confirmHomeworkSubmitted: "confirmHomeworkSubmitted",
  warningBeforeHomeworkSubmission: "warningBeforeHomeworkSubmission",
  showBatchSubmitOptions: "showBatchSubmitOptions",
  showWaitingForGrades: "showWaitingForGrades",
  chooseLinkOrDelete: "chooseLinkOrDelete"
}

export const SORT_BY = {
  name: 'name',
  random: 'random',
  score: 'score',
  autoScore: 'autoScore',
  id: 'id',
  completed: 'completed',
  hasComment: 'hasComment'
}

export const UI_SCREEN_MODES = {
  editHomework: 'UI_SCREEN_MODES.editHomework',
  createOrDupeAssignment: 'UI_SCREEN_MODES.createOrDupeAssignment',
  createAssignment: 'UI_SCREEN_MODES.createAssignment',
  dupeAssignment: 'UI_SCREEN_MODES.dupeAssignment',
  viewAssignment: 'UI_SCREEN_MODES.viewAssignment',
  editAssignment: 'UI_SCREEN_MODES.editAssignment',
  reviewHomework: 'UI_SCREEN_MODES.reviewHomework',
  devUtilityDashboard: 'UI_SCREEN_MODES.devUtilityDashboard',
  assignmentSelectorTool: 'UI_SCREEN_MODES.assignmentSelectorTool',
  returnToLmsScreen: 'UI_SCREEN_MODES.returnToLmsScreen'
}

export const EMPTY_HOMEWORK = {
  id: '',
  assignmentId: '',
  studentOwnerId: '',
  toolHomeworkData: EMPTY_TOOL_HOMEWORK_DATA,
  beganOnDate: 0,
  submittedOnDate: 0,
  isLocked: false
};



// NOTE: These constant names and values listed below MUST MATCH LTI constants
export const ROLE_TYPES = {
  instructor: 'instructor',
  learner: 'learner',
  dev: 'dev'
}

/*
'FullyGraded' - The grading process is completed; the score value, if any, represents the current Final Grade;
'Pending' – Final Grade is pending, but does not require manual intervention; if a Score value is present, it indicates the current value is partial and may be updated.
'PendingManual' – Final Grade is pending, and it does require human intervention; if a Score value is present, it indicates the current value is partial and may be updated during the manual grading.
'Failed' - The grading could not complete.
'NotReady' - There is no grading process occurring; for example, the student has not yet made any submission.
*/
export const HOMEWORK_PROGRESS = {
  notBegun: 'NotBegun',
  inProgress: 'InProgress',
  submitted: 'Submitted',
  fullyGraded: 'FullyGraded',
}

export const STATUS_TEXT = {
  NotBegun: 'Not Begun',
  InProgress: 'In Progress',
  Submitted: 'Ready to Grade',
  FullyGraded: 'Graded',
}

// activityProgress must be one of:
// Initialized, Started, InProgress, Submitted, Completed
export const ACTIVITY_PROGRESS = {
  NotBegun: 'Initialized',
  InProgress: 'InProgress',
  Submitted: 'Submitted',
  Completed: 'Completed',
}



