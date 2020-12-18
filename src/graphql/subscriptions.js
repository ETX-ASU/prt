/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateAssignment = /* GraphQL */ `
  subscription OnCreateAssignment {
    onCreateAssignment {
      id
      courseId
      ownerId
      title
      summary
      image
      isLinkedToLms
      lineItemId
      lockOnDate
      isLockedOnSubmission
      isUseAutoScore
      isUseAutoSubmit
      toolAssignmentData {
        quizQuestions {
          questionText
          answerOptions
          correctAnswerIndex
          progressPointsForCompleting
          gradePointsForCorrectAnswer
        }
      }
      createdAt
      updatedAt
    }
  }
`;
export const onUpdateAssignment = /* GraphQL */ `
  subscription OnUpdateAssignment {
    onUpdateAssignment {
      id
      courseId
      ownerId
      title
      summary
      image
      isLinkedToLms
      lineItemId
      lockOnDate
      isLockedOnSubmission
      isUseAutoScore
      isUseAutoSubmit
      toolAssignmentData {
        quizQuestions {
          questionText
          answerOptions
          correctAnswerIndex
          progressPointsForCompleting
          gradePointsForCorrectAnswer
        }
      }
      createdAt
      updatedAt
    }
  }
`;
export const onDeleteAssignment = /* GraphQL */ `
  subscription OnDeleteAssignment {
    onDeleteAssignment {
      id
      courseId
      ownerId
      title
      summary
      image
      isLinkedToLms
      lineItemId
      lockOnDate
      isLockedOnSubmission
      isUseAutoScore
      isUseAutoSubmit
      toolAssignmentData {
        quizQuestions {
          questionText
          answerOptions
          correctAnswerIndex
          progressPointsForCompleting
          gradePointsForCorrectAnswer
        }
      }
      createdAt
      updatedAt
    }
  }
`;
export const onCreateHomework = /* GraphQL */ `
  subscription OnCreateHomework {
    onCreateHomework {
      id
      assignmentId
      studentOwnerId
      beganOnDate
      submittedOnDate
      isLocked
      toolHomeworkData {
        quizAnswers
      }
      createdAt
      updatedAt
    }
  }
`;
export const onUpdateHomework = /* GraphQL */ `
  subscription OnUpdateHomework {
    onUpdateHomework {
      id
      assignmentId
      studentOwnerId
      beganOnDate
      submittedOnDate
      isLocked
      toolHomeworkData {
        quizAnswers
      }
      createdAt
      updatedAt
    }
  }
`;
export const onDeleteHomework = /* GraphQL */ `
  subscription OnDeleteHomework {
    onDeleteHomework {
      id
      assignmentId
      studentOwnerId
      beganOnDate
      submittedOnDate
      isLocked
      toolHomeworkData {
        quizAnswers
      }
      createdAt
      updatedAt
    }
  }
`;
