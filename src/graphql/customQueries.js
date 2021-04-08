
// export const assignmentHomeworkByStudentId
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
						id
						reviewerId
						ratingGiven
						criterionNum
					}
					commentsOnDraft {
						id
						reviewerId
						tagNum
						content
						commentRating
						criterionNum
						location {
							isWholeDocument
							startCharNum
							endCharNum
							x
							y
						}
					}
				}
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

// export const assignmentHomeworkIdsBySubmittedDate
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
						id
						reviewerId
						ratingGiven
						criterionNum
					}
					commentsOnDraft {
						id
						reviewerId
						tagNum
						content
						commentRating
						criterionNum
						location {
							isWholeDocument
							startCharNum
							endCharNum
							x
							y
						}
					}
				}
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
