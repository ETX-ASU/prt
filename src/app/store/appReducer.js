import {APP_NAMESPACE, SORT_BY, UI_SCREEN_MODES} from "../constants";

export const SET_SESSION_DATA = APP_NAMESPACE+'.SET_SESSION_DATA';
export const SET_ASSIGNMENT_DATA = APP_NAMESPACE+'.SET_ASSIGNMENT_DATA';
export const SET_DRAFTS_TO_BE_REVIEWED_BY_USER = APP_NAMESPACE+'.SET_DRAFTS_TO_BE_REVIEWED_BY_USER';
export const SET_ACTIVE_USERS_REVIEWED_DRAFT = APP_NAMESPACE+'.SET_ACTIVE_USERS_REVIEWED_DRAFT';
export const SET_DISPLAY_ORDER = APP_NAMESPACE+'.SET_DISPLAY_ORDER';
export const SET_CURRENTLY_REVIEWED_STUDENT_ID = APP_NAMESPACE+'.SET_CURRENTLY_REVIEWED_STUDENT_ID';
export const SET_GRADES_DATA = APP_NAMESPACE+'.SET_GRADES_DATA';
export const SET_ACTIVE_UI_SCREEN_MODE = APP_NAMESPACE+'.SET_ACTIVE_UI_SCREEN_MODE';
export const EDIT_DUPED_ASSIGNMENT = APP_NAMESPACE+'.EDIT_DUPED_ASSIGNMENT';
export const EDIT_ASSIGNMENT_PHASE = APP_NAMESPACE+'.EDIT_ASSIGNMENT_PHASE';
export const ADD_HOMEWORKS_DATA = APP_NAMESPACE+'.ADD_HOMEWORKS_DATA';
export const ADD_DRAFT_HOMEWORKS = APP_NAMESPACE+'.ADD_DRAFT_HOMEWORKS';
export const REPLACE_HOMEWORKS_DATA = APP_NAMESPACE+'.REPLACE_HOMEWORKS_DATA';
export const TOGGLE_HIDE_STUDENT_IDENTITY = 'grading-bar.TOGGLE_HIDE_STUDENT_IDENTITY';

export const SET_HOMEWORK_STUBS = 'SET_HOMEWORK_STUBS';
export const SET_REVIEWS = 'SET_REVIEWS';
export const SET_INSTRUCTOR_REVIEWS = 'SET_INSTRUCTOR_REVIEWS';
export const UPDATE_REVIEW = 'UPDATE_REVIEW';
export const SET_ACTIVE_COMMENT_ID = 'SET_ACTIVE_COMMENT_ID';
export const SET_TOP_ZONE_PERCENT = 'SET_TOP_ZONE_PERCENT';



export function setActiveCommentId(id) {
  return {
    type: SET_ACTIVE_COMMENT_ID,
    id
  }
}
export function setReviews(reviews) {
  return {
    type: SET_REVIEWS,
    reviews
  }
}
export function setInstructorReviews(reviews) {
  return {
    type: SET_INSTRUCTOR_REVIEWS,
    reviews
  }
}

export function addDraftHomeworks(draftHomeworks) {
  return {
    type: ADD_DRAFT_HOMEWORKS,
    draftHomeworks
  }
}

export function setHomeworkStubs(homeworkStubs) {
  return {
    type: SET_HOMEWORK_STUBS,
    homeworkStubs
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

export function setActiveUsersReviewedDraft(activeUsersReviewedDraft) {
  return {
    type: SET_ACTIVE_USERS_REVIEWED_DRAFT,
    activeUsersReviewedDraft
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

export function setTopZonePercent(percent) {
  return {
    type: SET_TOP_ZONE_PERCENT,
    percent
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
  reviews: null,
  assignment: {},
  members: [],
  homeworks: [],
  homeworkStubs: null,
  draftsToBeReviewedByUser: null,
  grades: [],
  currentlyReviewedStudentId: '',
  activeUiScreenMode: '',
  displayOrder: [],
  isHideStudentIdentity: false,
  activeUsersReviewedDraftStub: null,
  reviewsByUser: null,
  submittedReviewsForUser: null,
  draftHomeworks: [],
  activeCommentId: '',
  topZonePercent: 20
}


function appReducer(currentState = defaultState, action) {
  let reviewsByUser, activeUsersReviewedDraftStub, submittedReviewsForUser;

  switch (action.type) {
    case SET_REVIEWS:
      reviewsByUser = action.reviews.filter(r => r.assessorId === currentState.activeUser.id);
      activeUsersReviewedDraftStub = (!currentState.homeworkStubs) ? null : currentState.homeworkStubs.find(hs => hs.studentOwnerId === currentState.activeUser.id);
      submittedReviewsForUser = (!activeUsersReviewedDraftStub) ? [] : action.reviews.filter(r => r.homeworkId === activeUsersReviewedDraftStub.id && r.submittedOnDate);
      return Object.assign({}, currentState, {reviews: action.reviews, reviewsByUser, submittedReviewsForUser, activeUsersReviewedDraftStub});

    case SET_HOMEWORK_STUBS:
      activeUsersReviewedDraftStub = action.homeworkStubs.find(hs => hs.studentOwnerId === currentState.activeUser.id);
      submittedReviewsForUser = (!currentState.reviews) ? currentState.submittedReviewsForUser : currentState.reviews.filter(r => r.homeworkId === activeUsersReviewedDraftStub.id && r.submittedOnDate);
      return Object.assign({}, currentState, {homeworkStubs: action.homeworkStubs, activeUsersReviewedDraftStub, submittedReviewsForUser});

    case UPDATE_REVIEW:
      const rIndex = currentState.reviews.findIndex(r => r.id === action.review.id);
      const altReviews = [...currentState.reviews];
      if (rIndex >= 0) { altReviews.splice(rIndex, 1, action.review); }
      else { altReviews.push(action.review); }
      reviewsByUser = altReviews.filter(r => r.assessorId === currentState.activeUser.id);

      activeUsersReviewedDraftStub = (!currentState.homeworkStubs) ? null : currentState.homeworkStubs.find(hs => hs.studentOwnerId === currentState.activeUser.id);
      submittedReviewsForUser = (!activeUsersReviewedDraftStub) ? [] : altReviews.filter(r => r.homeworkId === activeUsersReviewedDraftStub.id && r.submittedOnDate);
      return Object.assign({}, currentState, {reviews: altReviews, reviewsByUser, submittedReviewsForUser});

    case SET_ACTIVE_COMMENT_ID:
      return Object.assign({}, currentState, {activeCommentId: action.id});

    case SET_INSTRUCTOR_REVIEWS:
      return Object.assign({}, currentState, {instructorReviews: action.reviews});

    case SET_ACTIVE_UI_SCREEN_MODE:
      return Object.assign({}, currentState, {activeUiScreenMode: action.activeUiScreenMode});

    case SET_GRADES_DATA:
      return Object.assign({}, currentState, {grades: action.grades});

    case ADD_HOMEWORKS_DATA:
      return Object.assign({}, currentState, {homeworks:[...currentState.homeworks, ...action.homeworks]});

    case ADD_DRAFT_HOMEWORKS:
      return Object.assign({}, currentState, {draftHomeworks:[...currentState.draftHomeworks, ...action.draftHomeworks]});

    case REPLACE_HOMEWORKS_DATA:
      return Object.assign({}, currentState, {homeworks: action.homeworks});

    case SET_DRAFTS_TO_BE_REVIEWED_BY_USER:
      return Object.assign({}, currentState, {draftsToBeReviewedByUser: action.draftsToBeReviewedByUser});

    case SET_ACTIVE_USERS_REVIEWED_DRAFT:
      return Object.assign({}, currentState, {activeUsersReviewedDraft: action.activeUsersReviewedDraft});

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

    case SET_TOP_ZONE_PERCENT:
      return Object.assign({}, currentState, {topZonePercent: action.percent});

    case SET_DISPLAY_ORDER:
      return Object.assign({}, currentState, {displayOrder: action.displayOrder});

    case TOGGLE_HIDE_STUDENT_IDENTITY:
      return Object.assign(currentState, {isHideStudentIdentity: action.isHideStudentIdentity, sortGradingBy: SORT_BY.random});

    default:
      return currentState;
  }
}

export default appReducer;