import aws_exports from '../lti-exports';


import {
  mockHasValidSession,
  mockGetUsers,
  mockGetAssignedStudents,
  mockGetUnassignedStudents,
  mockGetGrades,
  mockGetStudentGrade,
  mockInstructorSendGradeToLMS,
  mockAutoSendGradeToLMS,
  mockSubmitResourceSelection
} from "./MockRingLeader";
import {HOMEWORK_PROGRESS} from "../app/constants";


import {
  hasValidSessionAws as realHasValidSession,
  getUsersAws as realGetUsers,
  getUnassignedStudentsAws as realGetUnassignedStudents,
  getAssignedStudentsAws as realGetAssignedStudents,
  getGradesAws as realGetGrades,
  getGradeAws as realGetGrade,
  submitInstructorGradeAws as realInstructorSubmitGrade,
  submitGradeAws as realAutoSubmitGrade,
  submitResourceSelectionAws as realSubmitResourceSelection
} from '@asu-etx/rl-client-lib';
import {calcMaxScoreForAssignment} from "../tool/ToolUtils";
import {reportError} from "../developer/DevUtils";

// const realHasValidSession = () => {};
// const realGetUsers = () => {};
// const realGetUnassignedStudents = () => {};
// const realGetAssignedStudents = () => {};
// const realGetGrades = () => {};
// const realGetGrade = () => {};
// const realInstructorSubmitGrade = () => {};
// const realAutoSubmitGrade = () => {};
// const realSubmitResourceSelection = () => {};


/**
 *
 * This function connects the assignment to the LMS.
 *
 * PLEASE NOTE!!!!
 * Once this is called, the result received from the LMS is added to the DOM as a form
 * and this form is then submitted. Once received by the LMS, this application window
 * is CLOSED.
 *
 * @param assignment - data about the assignment we are connecting to the LMS
 * @returns {Promise<void>}
 */
export async function handleConnectToLMS(assignment) {
  const resourceDataForLms = {
    type: 'ltiResourceLink',
    label: assignment.title,
    url: '', // leave null
    resourceId: assignment.id,
    lineItem: {
      scoreMaximum: calcMaxScoreForAssignment(assignment),
      label: assignment.title,
      resourceId: assignment.id,
      tag: `TAG FOR ${assignment.title}`
    }
  }

  try {
    const linkToLmsResult = await createAssignmentInLms(resourceDataForLms);
    await document.body.insertAdjacentHTML('afterbegin', linkToLmsResult);
    if (window.isDevMode) return;
    document.getElementById("ltijs_submit").submit();
  } catch (error) {
    console.log(error);
    reportError(error, `Sorry. An error occurred while trying to connect and create this assignment within the LMS.`);
  }
}


export function hasValidSession(awsExports) {
  return (window.isDevMode) ? mockHasValidSession() : realHasValidSession(awsExports);
}

export function createAssignmentInLms(submitContentItem) {
  return (window.isDevMode) ? mockSubmitResourceSelection() : realSubmitResourceSelection(aws_exports, submitContentItem);
}


/**
 * Fetch students from the LMS that are in this course.
 * @param role - can be: null, "learner", "instructor"
 * @returns array of all members of the course of the given role type. No role type returns all members.
 *
 * User data will look as follows:
 *
 * class User {
    id: string | undefined; // "6281a0fe-bdba-44df-802d-27451ad14b60",
    status: string | undefined; // "Active",
    name: string | undefined; // "John Martin",
    givenName: string | undefined; // "John",
    familyName: string | undefined; // "Martin",
    email: string | undefined;// "jmartin@unicon.net",
    picture: string | undefined; // "https://canvas.instructure.com/images/messages/avatar-50.png",
    roles: [string] | undefined; // ["Learner"]
  }
 */
export function fetchUsers(courseId, role) {
  return (window.isDevMode) ? mockGetUsers(courseId, role) : realGetUsers(aws_exports, role);
}

/**
 * Fetch students that are enrolled in the given assignment.
 *
 * @param courseId - This course we want students for
 * @param assignmentId - The assignment we want find enrolled students for
 * @returns array of all members of the course of the given role type. No role type returns all members.
 *
 * NOTE: We must pass assignmentId because it is possible to enter into the app without a specific assignment id.
 *
 * class StudentUser {
    id: string | undefined; // "6281a0fe-bdba-44df-802d-27451ad14b60",
    status: string | undefined; // "Active",
    name: string | undefined; // "John Martin",
    givenName: string | undefined; // "John",
    familyName: string | undefined; // "Martin",
    email: string | undefined;// "jmartin@unicon.net",
    picture: string | undefined; // "https://canvas.instructure.com/images/messages/avatar-50.png"
  }
 */
export function fetchAssignedStudents(courseId, assignmentId) {
  return (window.isDevMode) ? mockGetAssignedStudents(courseId, assignmentId) : realGetAssignedStudents(aws_exports, courseId, assignmentId);
}

/**
 * Fetch students that are enrolled in the given assignment.
 *
 * @param courseId - This course we want students for
 * @param assignmentId - The assignment we want to find unenrolled students for
 * @returns array of all members of the course of the given role type. No role type returns all members.
 *
 * NOTE: We must pass assignmentId because it is possible to enter into the app without a specific assignment id.
 */
export function fetchUnassignedStudents(courseId, assignmentId) {
  return (window.isDevMode) ? mockGetUnassignedStudents(courseId, assignmentId) : realGetUnassignedStudents(aws_exports, courseId, assignmentId);
}


/**
 *
 * @param assignmentId
 * @param studentId
 * @returns A grade object for the student if they have been graded, otherwise null
 *
 * GradeObj {
    "studentId": "fa8fde11-43df-4328-9939-58b56309d20d",
    "scoreGiven": 71,
    "comment": "Instructor comment on the student performance"
   }
 *
 * NOTE: A grade only exists for homework that has been fully graded and sent to the LMS grade book.
 */
export async function fetchGradeForStudent(assignmentId, studentId) {
  let allGrades = (window.isDevMode) ? await mockGetGrades(assignmentId) : await realGetGrade(aws_exports, assignmentId, studentId);

  // TODO: We need a RL method that gets a single student id. (We don't want a student to be able to fetch ids of all students)
  // Temp solution until we have additional method.
  return allGrades.find(g => g.studentId === studentId);
}


/**
 *
 * @param assignmentId
 * @returns An array of grade objects, one for each homework that has been graded.
 *
 * GradeObj {
    "studentId": "fa8fde11-43df-4328-9939-58b56309d20d",
    "scoreGiven": 71,
    "comment": "Instructor comment on the student performance"
   }
 *
 * NOTE: A grade only exists for homework that has been fully graded and sent to the LMS grade book.
 */
export async function fetchAllGrades(assignmentId) {
  const grades = (window.isDevMode) ? await mockGetGrades(assignmentId) : await realGetGrades(aws_exports, assignmentId);
  // Because grades do not return gradingProgress when we fetch them... BUT... they only return
  // results for student's whom have been graded, we manually set gradingProgress to "fullyGraded"
  return grades.map(g => ({...g, gradingProgress:HOMEWORK_PROGRESS.fullyGraded}));
}


/**
 *
 * @param gradeData - object containing grade submission data, described below
 * @returns {Promise<unknown>}
 *
 * SubmitGradeObj {
 *   resourceId: "9551a0fe-802d-44df-802d-27451ad14cc3", (assignmentId)
 *   studentId: "fa8fde11-43df-4328-9939-58b56309d20d",
 *   scoreGiven: 100,
 *   comment: "Instructor comment on the student performance",
 *
 *   // TODO: how come we send progress values, but we can't/don't receive them?!
 *   activityProgress: "Completed", <-- optional and currently ignored
 *   gradingProgress: "FullyGraded" <-- optional and currently ignored
 * }
 */
export function sendInstructorGradeToLMS(gradeData) {
  if (window.isDevMode) return mockInstructorSendGradeToLMS(gradeData);

  delete gradeData.assignmentId;
  return realInstructorSubmitGrade(aws_exports, gradeData);
}



// Note: resourceId is NOT required in actual API, but is used by mock API
export function sendAutoGradeToLMS(gradeData) {
  if (window.isDevMode) return mockAutoSendGradeToLMS(gradeData);

  delete gradeData.assignmentId;
  console.warn('-----> passing this gradeData to API: ', gradeData);
  return realAutoSubmitGrade(aws_exports, gradeData);
}