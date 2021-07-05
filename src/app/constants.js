import {EMPTY_TOOL_HOMEWORK_DATA} from '../tool/constants'

export const APP_VERSION = '1.4.14';
export const APP_NAMESPACE = 'QUIZ_APP'; // Change this to name of tool


export const MODAL_TYPES = {
  confirmNewAssignmentPhaseCreated: "confirmNewAssignmentPhaseCreated",
  confirmAssignmentDuped: "confirmAssignmentDuped",
  confirmAssignmentRoundCreated: "confirmAssignmentRoundCreated",
  confirmAssignmentRecovered: "confirmAssignmentRecovered",
  cancelNewAssignmentEditsWarning: "cancelNewAssignmentEditsWarning",
  cancelPhaseEditsWarning: "cancelPhaseEditsWarning",
  cancelDupedAssignmentEditsWarning: "cancelDupedAssignmentEditsWarning",
  confirmAssignmentSaved: "confirmAssignmentSaved",
  confirmHomeworkSubmitted: "confirmHomeworkSubmitted",
  warningBeforeHomeworkSubmission: "warningBeforeHomeworkSubmission",
  warningInvalidSubmission: "warningInvalidSubmission",
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
  showStudentDashboard: 'UI_SCREEN_MODES.studentDashboard',
  createOrDupeAssignment: 'UI_SCREEN_MODES.createOrDupeAssignment',
  createAssignment: 'UI_SCREEN_MODES.createAssignment',
  dupeAssignment: 'UI_SCREEN_MODES.dupeAssignment',
  createNewAssignmentPhase: 'UI_SCREEN_MODES.createNewAssignmentPhase',
  viewAssignment: 'UI_SCREEN_MODES.viewAssignment',
  editAssignment: 'UI_SCREEN_MODES.editAssignment',
  reviewHomework: 'UI_SCREEN_MODES.reviewHomework',
  assessPeerHomework: 'UI_SCREEN_MODES.assessPeerHomework',
  viewAssessedHomework: 'UI_SCREEN_MODES.viewAssessedHomework',
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

export const EMPTY_REVIEW = {
  id: '',
  assignmentId: '',
  assessorId: '',
  homeworkId: '',
  beganOnDate: 0,
  submittedOnDate: 0,
  comments: [],
  criterionRatings: []
};



export const ALLOCATION_MESSAGES = {
  notEnoughSubmissions: `Not enough peers have submitted their work for reviews to begin being assigned yet. Please come back soon and check again regularly.`,
  userDidNotSubmit: `You cannot review peers until you have completed and submitted a draft of your own. Complete the previous draft creation assignment first, then come back to participate in this peer review session assignment.`,

}


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

export const DRAFT_BTN_LABELS = {
  FullyGraded: 'View Submission',
  Submitted: 'View Submission',
  InProgress: 'Continue Draft',
  NotBegun: 'Begin Draft',
};

export const PEER_REVIEW_BTN_LABELS = {
  Feedback: 'See Feedback',
  Submitted: 'See Assessment',
  InProgress: 'Continue Review',
  NotBegun: 'Begin Review',
};