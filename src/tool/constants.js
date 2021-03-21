
export const PHASE_TYPES = {
  draftWriting: 'draft',
  reviewSession: 'reviewSession'
}

export const EMPTY_TOOL_HOMEWORK_DATA = {
  draftContent: '',
  commentsOnDraft: [],
  criterionRatingsOnDraft: [],
  allocatedHomeworkIds: []
}

export const EMPTY_RANK = {
  name: '',
  points: 1,
  orderNum: 0,
  isVisible: true
}

export const EMPTY_CRITERION = {
  id: '',
  name: '',
  rankSummaries: ['','','','',''],
  weight: 1,
  orderNum: 0,
  isVisible: true
}

export const EMPTY_RUBRIC = {
  ranks: [
    {
      name: 'Excellent',
      points: 10,
      orderNum: 0,
      isVisible: true
    },
    {
      name: 'Very Good',
      points: 7,
      orderNum: 1,
      isVisible: true
    },
    {
      name: 'Good',
      points: 5,
      orderNum: 2,
      isVisible: true
    },
    {
      name: 'Fair',
      points: 3,
      orderNum: 3,
      isVisible: true
    },
    {
      name: 'Poor',
      points: 1,
      orderNum: 4,
      isVisible: true
    },
  ],
  criteria: []
};
