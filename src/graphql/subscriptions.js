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
      appVersion
      lineItemId
      lockOnDate
      isLockedOnSubmission
      isUseAutoScore
      isUseAutoSubmit
      toolAssignmentData {
        rubricRanks {
          name
          points
          isVisible
          orderNum
        }
        rubricCriteria {
          id
          orderNum
          isVisible
          name
          rankSummaries
          weight
        }
        sequenceIds
        minReviewsRequired
        minPeersBeforeAllocating
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
      appVersion
      lineItemId
      lockOnDate
      isLockedOnSubmission
      isUseAutoScore
      isUseAutoSubmit
      toolAssignmentData {
        rubricRanks {
          name
          points
          isVisible
          orderNum
        }
        rubricCriteria {
          id
          orderNum
          isVisible
          name
          rankSummaries
          weight
        }
        sequenceIds
        minReviewsRequired
        minPeersBeforeAllocating
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
      appVersion
      lineItemId
      lockOnDate
      isLockedOnSubmission
      isUseAutoScore
      isUseAutoSubmit
      toolAssignmentData {
        rubricRanks {
          name
          points
          isVisible
          orderNum
        }
        rubricCriteria {
          id
          orderNum
          isVisible
          name
          rankSummaries
          weight
        }
        sequenceIds
        minReviewsRequired
        minPeersBeforeAllocating
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
        draftContent
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
        draftContent
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
        draftContent
      }
      createdAt
      updatedAt
    }
  }
`;
export const onCreateReview = /* GraphQL */ `
  subscription OnCreateReview {
    onCreateReview {
      id
      assignmentId
      assessorId
      homeworkId
      beganOnDate
      submittedOnDate
      comments {
        id
        tagNum
        index
        length
        content
        commentRating
      }
      criterionRatings {
        criterionId
        ratingGiven
      }
      createdAt
      updatedAt
    }
  }
`;
export const onUpdateReview = /* GraphQL */ `
  subscription OnUpdateReview {
    onUpdateReview {
      id
      assignmentId
      assessorId
      homeworkId
      beganOnDate
      submittedOnDate
      comments {
        id
        tagNum
        index
        length
        content
        commentRating
      }
      criterionRatings {
        criterionId
        ratingGiven
      }
      createdAt
      updatedAt
    }
  }
`;
export const onDeleteReview = /* GraphQL */ `
  subscription OnDeleteReview {
    onDeleteReview {
      id
      assignmentId
      assessorId
      homeworkId
      beganOnDate
      submittedOnDate
      comments {
        id
        tagNum
        index
        length
        content
        commentRating
      }
      criterionRatings {
        criterionId
        ratingGiven
      }
      createdAt
      updatedAt
    }
  }
`;
