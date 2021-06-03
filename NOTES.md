# OVERVIEW OF NEXT STEPS

http://localhost:3000/assignment?userId=11&courseId=course-002&role=learner&assignmentId=5a8cd647-00dc-40f5-b307-3a0436c16a6e

7. Add in ability to provide 1-5 star feedback
7. Show x of y feedback rating for assessments given
7. Remove/hide/disable save buttons for homework assessor once it has been submitted

8. "See Reviews Received" button should be disabled if NO reviews were received yet
8. "Reviews Received" panel should show loading wheel until "Reviews to Give" have finished loading 
8. On the ReviewSessionDash, check for review session "homework" completion and a "submit" button for entire homework.
   Right now, student can submit assessments of peer work. Student must also rate the comments they received. Once that 
   is done, they can hit the "submit" button. Before that, they can see a message indicating what is left to do before
   this review session is considered complete.
8. After submitting review of peer, buttons go away and then I think the dot placements can get out of sync sometimes 
   (test with an image)
   
8. Add feature: when student is writing draft 2 or greater, give them ability to see reviews from peers
8. Add feature: mechanism to scroll/shrink criterion tabs when screen is too narrow
9. Create UI for instructor to grade a peer review session!




Root 1st draft assignment - sequenceIds = []
1st draft review - sequenceIds = [1stDraftId]
2nd draft        - sequenceIds = [1stDraftId, 1stDraftReviewId]
2nd draft review - sequenceIds = [1stDraftId, 1stDraftReviewId, 2ndDraftId]

I'm puzzled about how my own darn code works, which is not great. The line item id does not seem to exist on anything
except the original assignment. AHHHHHHHHHHH: this is only true of locally created, DEV mode assignments! This might be fixed now
on DEV assignments.

The assignmentId gets the reviewAssignment and uses it's sequenceIds to find previous assignment. If there is none, then
it is the ROOT. If there is a previous and the count of preceding assignments is odd, then the previous was a draft and this
assignment is a review.




When do I pull assessments data?
1. As an instructor for a draft assignment:
   1. When load student homework for reviewing I look for the assessment in redux store `state.assessements`
   2. If it isn't in there, I create one from scratch, save to redux, and continue.
   3. After I saving or submitting assessment, I save it to DB and redux.
   4. I'm the only one who will change that DB table entry so no fear of conflicts.
2. As an instructor for a review session assignment:
   1. When I load in a student's homework for reviewing, I look in redux store for all their assessments
   2. If none exist, I pull from DB. 
      1. If none in DB, I add entry in redux store to indicate I've pulled DB for this student
      2. Otherwise I save that to redux store
      3. NOT sure how I track my own assessment of a review session, but could probably fit in here
3. As a student reviewing a peer:
   1. When I load my dashboard I pull DB for all my assessments related to this assignment id
   2. These get saved to redux store
   3. If I make any edits or submit, etc., I save to DB and redux store
   4. No conflicts as I am the only one to write to my own assessments.
      1. A peer cannot give feedback on my comments until I submit, at which time I can no
         longer make edits myself.
      2. An instructor can look at an assessment but never change it directly.
4. As a student looking at my own paper:
   1. When I load my dashboard I pull DB for all SUBMITTED comments related to my homework
   








### NEED TO CONSIDER REFETCH FOR ASSESSING PEERS
This breaks DRY principle and I need to assess a fix. The advantage of this solution is that
the assignment data is really only loaded at the start or after an assignment edit.
Caching the allocations data means no need to refetch the data from DB on every little save
because this acts as a kind of optimistic update. We update locally and don't care about what is on
the server until an edit was made to the assignment itself or the app is reloaded.

BUT HERE'S THE CATCH: As instructor, I'm assessing Student A which changes the homework.commentsOnDraft and .ratingsOnDraft
and those changes are made to the DB. Each edit is saved each time I click off the notes area. Focus changes,
student A's commentsOnDraft are changed.

I'm doing this optimistically. Now what happens when I'm a student reviewing peer A. And another student is reviewing
peer A at the SAME TIME. By NOT refetching, they both assume they have the most recent commentsOnDraft for peer A.

I start making comments using Data Snapshot 1. Other student makes a few comments using Snapshot 1. I save 3 new comments,
basically SnapShot 1 + My Additions, and I leave. Other student edits a comment and saves SnapShot 1 + Their Edit. It overwrites
what I did.

Before I can save, I must fetch homeworks to ensure I don't have this problem.

This is not the case as an instructor because I am the ONLY allocated to make comments on a DRAFT writing assignment.
As an instructor, I'm the only one who will be adding comments and ratings to a student homework during a DRAFT writing assignment,
and on a REVIEW SESSION assignment, I will be using a different mechanism.

This is also not an issue for allocations data because of the same reason.

AS A STUDENT: Fetch allocations before save or submit.
AS A STUDENT: Fetch assessedUserHomework before save or submit.



HomeworkAssessor:

1. It receives defaultActiveCommentId, and toolHomeworkData
2. When a comment is added, removed, updated... 
   2. use "onAssessmentUpdated()" to tell parent the new toolHomeworkData and activeCommentId
   3. Parent recreates the child with updated info using that to
      build out the comments, critRating selections, and activeComment
   4. If comments or critRatings do not match what it has from DB, 
      PARENT saves these changes to DB and refetches data for student
      

      



1. When instructor deletes a comment, that change should get saved optimistically(?) in redux such that the
   InstructorDraftAssessor gets updated with new comment and rebuilds the HomeworkAssessor.
2. Each change to a comment or rubric rank selection should trigger a save as well.
   1. onBlur() of the comment text area saves changes
   2. onAddComment saves changes (an empty "" comment)... focus is set to text area so any updates will get saved
      when it's focus is lost... so maybe onAddComment we don't save. 
      ONLY save on textAreaBlur if the comments do NOT match each other
   3. onDeleteComment saves changes
   



2. Grading of student essays... instructor should have basic grading capability
3. Assessing Students should be able to submit assessments (This is working I think)
   1. When reviewing your recent submission - get rid of submit button!!
   2. need to be able to delete a comment
   3. Actually SAVE the review data vs SUBMITTING it
4. Reviewed students should be able to VIEW the reviews they received from peers
5. Reviewed students should be able to provide feedback on peer assessment comments
6. Assessing students should be able to VIEW the feedback received on their assessment comments
7. In review session assignments, instructors should be able to see student assessments
8. In draft writing assignments, instructors should be able to see student draft and assess it like a peer

   
6. Make right-side panels toggle on/off display
7. Rubric tabs... what happens when too long
8. When you create a dupe of an existing assignment it takes you to AssignmentEditor the button
   to save your changes says "UPDATE" which is a bit confusing. Make is say "SAVE" or maybe "CONTINUE"?
9. Either make endless draft & review rounds possible, or warn instructor after they create 5th that no more are possible


3. Location dots should be set dynamically because resizing the screen width
   can change text wrapping and thus effect where the dot x value is. Instead,
   dot x/y values should be determined by the bounds of the highlighted text at the
   moment the dot is to be rendered onto the tags layer.
5. clicking the "add comment" button when nothing is selected should 
   not be possible by disabling the [+] add button when there is no range selected


=====

1. Create a 'getAvailableContentHeight' util function in tool/ToolUtils.js
   1. It looks for header and footer divs. Gets the doc height. And subtracts the header and footer heights.
   2. It also has the header/footer padding used throughout the app for the calc
   3. It returns this as availContentHeight
   
2. On pages that use the RTE and need to fill vh of the page:
   1. Add 'onMounted' useEffect(()=>{}, []) to add resize event listener for BOTH
      changes in page size (height) and dragSizerKnob location
   2. When page is resized
      1. clear any previous "handleResize" timer
      2. set NEW 500ms "handleResize" timer

3. After the handleResize timer goes off
   1. run the calculations to get the new availableContentHeight
   2. setAvailableContentHeight
   3. if this screen has 'dragSizer' control on it
      1. calculate current 
   
=====

For screens with adjustable height
   









1. place the drag bar row in normal flow, after the rubric row
2. And mouse down listener to the knob
   1. When down, start listening to mouse movement
      * Each time mouse moves, look at mouse deltaY in pixels.
      * if it is up and Rubric is at min allowed height, just set it for min. If down and max, same.
      * calculate new height of Rubric and set that height.
      * calculate remaining height minus the header and footer and use that for the Essay Area
   
      







## ALLOCATING PEER ASSESSMENTS

1. Student logs in. Student homework is pulled from DB for this student.
2. If it is a peer review session, we look at assignment.toolAssignmentData.allocations as follows:
   1. Look at assignment.toolAssignmentData.allocations 
   1. Does this student need a new allocation?
      * No? - great. Fetch the homeworks for the allocations they already DO have. Done.
      * Yes? - Get all of the homeworks for this assignment id that are submitted.
         - Map out how many times each of these HAVE been allocated
         - Filter out the disqualified
         - Randomly select the one of the remaining and assign it to this user.
         - Save this allocation change to the DB
   
FILTER OUT DISQUALIFIED

1. look at all homeworks and tier them by number of reviews they each got
2. look at the tier with the least reviews received (allocated to them)
   1. so if there are 4 essays, 3 of them have 1 review and 1 of them has 2, look at the 3 with just 1 review
3. if this user owns the essay OR was already allocated to one of these 3, filter them out
   3a. if no essays in this tier, look at the next tier up and repeat step 3
   3b. if there's still no essays left, the user must WAIT for more peers to finish
   
Otherwise, randomly select from the remaining (filtered) essays in the tier
   
   



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

