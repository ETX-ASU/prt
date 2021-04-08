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
        allocations {
          assessorId
          homeworkId
          beganOnDate
          submittedOnDate
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
          sequenceIds
          minReviewsRequired
          minPeersBeforeAllocating
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
        }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
export const minHomeworkIdsBySubmittedDate = /* GraphQL */ `
  query MinHomeworkIdsBySubmittedDate(
    $assignmentId: ID
    $submittedOnDate: ModelIntKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelHomeworkFilterInput
    $limit: Int
    $nextToken: String
  ) {
    minHomeworkIdsBySubmittedDate(
      assignmentId: $assignmentId
      submittedOnDate: $submittedOnDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
    }
  }
`;
export const fullHomeworkByAsmntAndStudentId = /* GraphQL */ `
  query FullHomeworkByAsmntAndStudentId(
    $assignmentId: ID
    $studentOwnerId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelHomeworkFilterInput
    $limit: Int
    $nextToken: String
  ) {
    fullHomeworkByAsmntAndStudentId(
      assignmentId: $assignmentId
      studentOwnerId: $studentOwnerId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
    }
  }
`;
