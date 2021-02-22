/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getAssignment = /* GraphQL */ `
  query GetAssignment($id: ID!) {
    getAssignment(id: $id) {
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
        originId
        roundNum
        allocations {
          assessorId
          homeworkId
        }
      }
      createdAt
      updatedAt
    }
  }
`;
export const listAssignments = /* GraphQL */ `
  query ListAssignments(
    $filter: ModelAssignmentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAssignments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
          originId
          roundNum
        }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
export const getHomework = /* GraphQL */ `
  query GetHomework($id: ID!) {
    getHomework(id: $id) {
      id
      assignmentId
      studentOwnerId
      beganOnDate
      submittedOnDate
      isLocked
      toolHomeworkData {
        draftContent
        commentsOnDraft {
          id
          reviewerId
          tagNum
          content
          commentRating
          criterionNum
        }
        criterionRatingsOnDraft {
          id
          reviewerId
          ratingGiven
          criterionNum
        }
        allocatedHomeworkIds
      }
      createdAt
      updatedAt
    }
  }
`;
export const listHomeworks = /* GraphQL */ `
  query ListHomeworks(
    $filter: ModelHomeworkFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHomeworks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        assignmentId
        studentOwnerId
        beganOnDate
        submittedOnDate
        isLocked
        toolHomeworkData {
          draftContent
          allocatedHomeworkIds
        }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
