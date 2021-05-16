import {APP_NAMESPACE, SORT_BY, UI_SCREEN_MODES} from "../constants";

export const SET_SESSION_DATA = APP_NAMESPACE+'.SET_SESSION_DATA';
export const SET_ASSIGNMENT_DATA = APP_NAMESPACE+'.SET_ASSIGNMENT_DATA';
export const SET_DRAFTS_TO_BE_REVIEWED_BY_USER = APP_NAMESPACE+'.SET_DRAFTS_TO_BE_REVIEWED_BY_USER';
export const SET_DISPLAY_ORDER = APP_NAMESPACE+'.SET_DISPLAY_ORDER';
export const SET_CURRENTLY_REVIEWED_STUDENT_ID = APP_NAMESPACE+'.SET_CURRENTLY_REVIEWED_STUDENT_ID';
export const SET_GRADES_DATA = APP_NAMESPACE+'.SET_GRADES_DATA';
export const SET_ACTIVE_UI_SCREEN_MODE = APP_NAMESPACE+'.SET_ACTIVE_UI_SCREEN_MODE';
export const EDIT_DUPED_ASSIGNMENT = APP_NAMESPACE+'.EDIT_DUPED_ASSIGNMENT';
export const EDIT_ASSIGNMENT_PHASE = APP_NAMESPACE+'.EDIT_ASSIGNMENT_PHASE';
export const ADD_HOMEWORKS_DATA = APP_NAMESPACE+'.ADD_HOMEWORKS_DATA';
export const REPLACE_HOMEWORKS_DATA = APP_NAMESPACE+'.REPLACE_HOMEWORKS_DATA';
export const REPLACE_ALLOCATIONS_DATA = APP_NAMESPACE+'.REPLACE_ALLOCATIONS_DATA';
export const TOGGLE_HIDE_STUDENT_IDENTITY = 'grading-bar.TOGGLE_HIDE_STUDENT_IDENTITY';

export const SET_REVIEWS = 'SET_REVIEWS';
export const UPDATE_REVIEW = 'UPDATE_REVIEW';



export function setReviews(reviews) {
  return {
    type: SET_REVIEWS,
    reviews
  }
}

export function updateSingleReview(review) {
  return {
    type: UPDATE_REVIEW,
    review
  }
}

export function setSessionData(courseId, assignmentId, activeUser, members, lineItemId) {
  return {
    type: SET_SESSION_DATA,
    courseId,
    assignmentId,
    activeUser,
    members,
    lineItemId
  }
}

export function setAssignmentData(assignment) {
  return {
    type: SET_ASSIGNMENT_DATA,
    assignment
  }
}

export function editDupedAssignment(assignment) {
  return {
    type: EDIT_DUPED_ASSIGNMENT,
    assignment
  }
}

export function editAssignmentPhase(assignment) {
  return {
    type: EDIT_ASSIGNMENT_PHASE,
    assignment
  }
}

export function setDraftsToBeReviewedByUser(draftsToBeReviewedByUser) {
  return {
    type: SET_DRAFTS_TO_BE_REVIEWED_BY_USER,
    draftsToBeReviewedByUser
  }
}


export function setActiveUiScreenMode(activeUiScreenMode) {
  return {
    type: SET_ACTIVE_UI_SCREEN_MODE,
    activeUiScreenMode
  }
}

export function addHomeworksData(homeworks) {
  return {
    type: ADD_HOMEWORKS_DATA,
    homeworks
  }
}

export function replaceHomeworksData(homeworks) {
  return {
    type: REPLACE_HOMEWORKS_DATA,
    homeworks
  }
}


// TODO: Allocation Change 6
export function replaceAllocationsData(allocations) {
  return {
    type: REPLACE_ALLOCATIONS_DATA,
    allocations
  }
}

export function setGradesData(grades) {
  return {
    type: SET_GRADES_DATA,
    grades
  }
}

export function setDisplayOrder(displayOrder) {
  return {
    type: SET_DISPLAY_ORDER,
    displayOrder
  }
}

export function setCurrentlyReviewedStudentId(currentlyReviewedStudentId) {
  return {
    type: SET_CURRENTLY_REVIEWED_STUDENT_ID,
    currentlyReviewedStudentId
  }
}

export function toggleHideStudentIdentity(isHideStudentIdentity) {
  return {
    type: TOGGLE_HIDE_STUDENT_IDENTITY,
    isHideStudentIdentity
  }
}


const defaultState = {
  courseId: '',
  assignmentId: '',
  activeUser: {
    id: '',
    givenName: '',
    familyName: '',
    email: '',
    activeRole: '',
    roles: []
  },
  reviews: [],
  assignment: {},
  members: [],
  homeworks: [],
  draftsToBeReviewedByUser: [],
  grades: [],
  currentlyReviewedStudentId: '',
  activeUiScreenMode: '',
  displayOrder: [],
  isHideStudentIdentity: true
}


function appReducer(currentState = defaultState, action) {
  switch (action.type) {
    case SET_REVIEWS:
      return Object.assign({}, currentState, {reviews: action.reviews});

    case UPDATE_REVIEW:
      const rIndex = currentState.reviews.findIndex(r => r.id === action.review.id);
      const altReviews = [...currentState.reviews];
      if (rIndex >= 0) { altReviews.splice(rIndex, 1, action.review); }
      else { altReviews.push(action.review); }
      return Object.assign({}, currentState, {reviews: altReviews});

    case SET_ACTIVE_UI_SCREEN_MODE:
      return Object.assign({}, currentState, {activeUiScreenMode: action.activeUiScreenMode});

    case SET_GRADES_DATA:
      return Object.assign({}, currentState, {grades: action.grades});

    case ADD_HOMEWORKS_DATA:
      return Object.assign({}, currentState, {homeworks:[...currentState.homeworks, ...action.homeworks]});

    case REPLACE_HOMEWORKS_DATA:
      return Object.assign({}, currentState, {homeworks: action.homeworks});

    case SET_DRAFTS_TO_BE_REVIEWED_BY_USER:
      return Object.assign({}, currentState, {draftsToBeReviewedByUser: action.draftsToBeReviewedByUser});

    case SET_SESSION_DATA:
      return Object.assign({}, currentState, {
        activeUser:action.activeUser,
        assignmentId:action.assignmentId,
        courseId:action.courseId,
        members:action.members
      });

    case EDIT_DUPED_ASSIGNMENT:
      return Object.assign({}, currentState, {assignment: action.assignment, activeUiScreenMode: UI_SCREEN_MODES.dupeAssignment})

    case EDIT_ASSIGNMENT_PHASE:
      return Object.assign({}, currentState, {assignment: action.assignment, activeUiScreenMode: UI_SCREEN_MODES.editAssignment})

    case SET_CURRENTLY_REVIEWED_STUDENT_ID:
      return Object.assign({}, currentState, {currentlyReviewedStudentId: action.currentlyReviewedStudentId});

    case SET_ASSIGNMENT_DATA:
      return Object.assign({}, currentState, {assignment: action.assignment});


    // TODO: Allocation Change 7
    case REPLACE_ALLOCATIONS_DATA:
      return Object.assign({}, currentState, {assignment: {...currentState.assignment, toolAssignmentData: {...currentState.assignment.toolAssignmentData, allocations: action.allocations}}});

    case SET_DISPLAY_ORDER:
      return Object.assign({}, currentState, {displayOrder: action.displayOrder});

    case TOGGLE_HIDE_STUDENT_IDENTITY:
      return Object.assign(currentState, {isHideStudentIdentity: action.isHideStudentIdentity, sortGradingBy: SORT_BY.random});

    default:
      return currentState;
  }
}

export default appReducer;