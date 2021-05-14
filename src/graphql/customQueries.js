

export const fullHomeworkByAsmntAndStudentId = /* GraphQL */ `
  query FullHomeworkByAsgnByStudentId(
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
					criterionRatingsOnDraft {
						criterionId
						reviewerId
						ratingGiven
					}
					commentsOnDraft {
						id
						reviewerId
						tagNum
						content
						commentRating
						criterionNum
						index
						length
					}
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
        studentOwnerId
        submittedOnDate
      }
      nextToken
    }
  }
`;


export const listFullHomeworks = /* GraphQL */ `
  query ListFullHomeworks(
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
					criterionRatingsOnDraft {
						criterionId
						reviewerId
						ratingGiven
					}
					commentsOnDraft {
						id
						reviewerId
						tagNum
						content
						commentRating
						criterionNum
						index
						length
					}
				}
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;



export const getHomeworkReviewData = /* GraphQL */ `
  query GetHomework($id: ID!) {
    getHomework(id: $id) {
      toolHomeworkData {
        commentsOnDraft {
          id
          reviewerId
          tagNum
          index
          length
          content
          commentRating
          criterionNum
        }
        criterionRatingsOnDraft {
          reviewerId
          criterionId
          ratingGiven
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const updateHomeworkReviewData = /* GraphQL */ `
  mutation UpdateHomework(
    $input: UpdateHomeworkInput!
    $condition: ModelHomeworkConditionInput
  ) {
    updateHomework(input: $input, condition: $condition) {
      id
      toolHomeworkData {
        commentsOnDraft {
          id
          reviewerId
          tagNum
          index
          length
          content
          commentRating
          criterionNum
        }
        criterionRatingsOnDraft {
          reviewerId
          criterionId
          ratingGiven
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const getAssignmentAllocations = /* GraphQL */ `
  query GetAssignment($id: ID!) {
    getAssignment(id: $id) {
      toolAssignmentData {
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

export const updateAssignmentAllocations = /* GraphQL */ `
  mutation UpdateAssignment(
    $input: UpdateAssignmentInput!
    $condition: ModelAssignmentConditionInput
  ) {
    updateAssignment(input: $input, condition: $condition) {
      id
      toolAssignmentData {
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