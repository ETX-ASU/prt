## BUG FIXING

# Next steps.

1. When an "added phase" is created, we create it in the DB with new id and associated default data, then we take
   the instructor to the "edit assignment" page. (It's like the dupe process.) From there, the instructor makes changes
   and saves it.
      1. Both the Boiler's AssignmentCreator.js and AssignmentEditor.js incorporate the PhaseCreator.js which shows the UI
      for creating either a RootAssignment, ReviewSessionPhase, or DraftPhase. It holds the "MainSettings" editor which include
      the assignment Title, AutoScore & AutoScoreAutoSubmit settings.   
         1. RootAssignment has: RubricEditor & DraftEditor
         2. ReviewSessionPhase has: ReviewSettingsEditor
         3. DraftPhase has: DraftEditor

1. When teacher hits the "Create Peer Review Session" this should route them through the "Instructor Dashboard"
   to show them a "ReviewSessionCreator" screen OR "AdditionalDraftCreator" screen. (The AssignmentCreator screen
   is in fact the "RootAssignmentCreator" screen. That is where the rubric is created.)
   1. Convert the sub-fragment from `{!isFetchingAssignments && (choice === ASSIGNMENT_CHOICE.addRound) &&` into
      it's own component for creating the review session or additional draft.
      1. For review session we need: assignment title, auto-grading options, min reviews, 
         min reviews to wait for until allocating.
      1. For an additional draft... we just need title and auto-grading options.
2. When the draft or review is done being created, the process is identical to what is commented out
   in the AssignmentNewOrDupe `handleAddNewRound()` function. (This doesn't belong in new or dupe anymore)
   1. When created, it essentially hooks up to LMS and disconnects.
   2. Next time the instructor logs in, they should see the assignment EDITING screen
3. We need to get the AssignmentEditor.js working properly for Root Assignments AND their offspring
4. After that, students need to see a student dashboard that shows them:
   1. If allocating hasn't begun yet, it tells them to come back later, otherwise it shows the
      student an "Allocated Reviews" and "Reviews Received" list.
   1. Generate a few fake homeworks for testing
      
5. Rebuild allocation process as follows:
   1. Has active user student completed previous draft? NO - stop. YES - continue.
   1. Has active user been allocated to assess a homework that the user hasn't finished assessing? YES - stop. No - continue.
   1. Has the active user finished the required number of drafts?
         1. YES: If every student gave the minimum # of reviews, and not all essays _received_ 3 reviews (min), AND we
         are using extra credit reviews, ask this student if they would like to do an extra credit review. (If not - stop.)
            If the answer is NO, stop.
            If the answer is YES, then note this response for current browser session and continue.
   1. Generate a homework status object that knows how many times each homework has been reviewed and by whom.
      Make it referenced by homework id, using Sets to contain ids of peers that gave the reviews, like this:
      
      `{
         id1: [bob, ann, steve]
         id2: [mike, bob, janet]
         id3: [carl, ann]
      }`
   
   1. Remove any entries in which the active user already gave a review
   1. Of those that remain, what is the least number of reviews given to any single essay? Filter out any items
      that have more than this. Of those that remain, randomly select one of them as the new allocation. Make this
      change in the toolAssignmentData and immediately save this back to the database.
   1. Now RE-FETCH the toolAssignmentData to get the updated allocations and start over at step 1 above (5.i.)
         1. NOTE... if all goes well, user will be allocated someone new and we can see the active user has NOT submitted
         their assessment yet, so it stops the allocation process.
         2. IF there is a DB conflict (another user was simultaneously/just after assigned to essay X...) when the RE-FETCH
         returns this active user will still not have any allocated work to review and the process starts
         all over again until they get an open slot.
 
6. The active user can now click on either:
   1. An allocated review they need to give to a peer. Clicking this takes them into the "PeerReviewer" screen in "Assessor Assessing" mode.
   2. An allocated review they want to see feedback on. Clicking this takes them into the "PeerReviewer" screen in "Assessor Locked" mode.
   3. A review they received for their own essay. Click on this takes them to the "PeerReviewer" screen in "Author Feedback" mode.
   
7. I shall build the PeerReviewer screen in the above order... Assessor Editing mode first.
   1. The PeerReviewer gets the assignmentId, reviewerId, reviewerRole, reviewerMod as props. Role would be Instructor, Assessor, or Author.
      And mode would be "Assessing" or "Locked." (Assessing refers to the ability to modify and eventually submit an assessment.)
      Once the Assessment is submitted, the user can then only revisit in "Locked" mode.
   
8. "Author Feedback" mode is used so a user can see the reviews on their own essay. As the author in "feedback" mode, the
   user can rate the value of various comments given by each reviewer. At some point, the author must "commit" to the
   ratings they give. (The review session assignment isn't done until the student reviews X peers AND reads and assesses the comments
   they received from peers.) After that, the author can only enter in "Author Locked" mode.

  

1. Make the Rubric Panel expandable from the bottom
1. Hiding a criterion should remove it from the calculations
1. XTRA - Dropping the criterion will make it fade back to normal
1. XTRA - Tabs should be able to be dragged around to re-arrange the criterion order


## Current instructor flow:

1. From `AssignmentNewOrDupe.js` selects creates new assignment. That takes us to:
2. `AssignmentCreator.js` renders the ToolAssignmentData form from `RootPhaseSettings.js`
    1. On mount/first creation we need to call `generateDefaultRubric()` (step 3 above) to set
    the initial values for the rubric
3. That renders `RubricPanel.js` and that further renders each `CriterionViewerEditor.js` (used
   for both viewing and/or editing a criterion)
    1. The RubricPanel receives the rubric data and parses it
    
## Ranks Without IDs - How it Works

1. Ranks never change index order in the array. They only change orderNum. Example: [A,B,C,D,E] is 
is always the order in the array. And the initial order num would be A=0, B=1, C=2, D=3, E=4.
2. You could swap B and C by making orderNum B=2, and C=1.
3. When showing RankSummaries, 
   * summary[0] corresponds to A and is shown 1st.
   * summary[1] corresponds to B and is shown 3rd.
   * summary[2] corresponds to C and is shown 2nd.
    
rank[0] ALWAYS corresponds to rankSummary[0]
rank[1] ALWAYS corresponds to rankSummary[1] 
rank[2] ALWAYS corresponds to rankSummary[2]
rank[3] ALWAYS corresponds to rankSummary[3]
rank[4] ALWAYS corresponds to rankSummary[4]

So the index of the rank matches the index of the corresponding rank summary. Always.
The order these are shown depends on the rank's orderNum.
When a rank is selected, we treat it's index as it's id (and the key used by react). This allows us
to look up the points (rank[x].points) to score the reviewed peer with.

> __Because the array order matters, be careful! Do NOT save or update the rubric using the displayed
order of the ranks or rankSummaries!__

The Criteria array can be store the criterion in any order, because we use an id for each criterion. 
We sort the display order by criterion.orderNum before we display them.





-------

### Access / Credentials info!

Admin UI login is personal email for amplify!

1st assignment:
http://localhost:3000/assignment?userId=01&courseId=course-002&role=instructor&assignmentId=5e7772b5-25ce-4310-8e33-b4ba81a48aac
