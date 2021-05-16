import React, {Fragment,  useEffect, useRef, useState} from 'react';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {Button, Row} from 'react-bootstrap';
import {API, graphqlOperation} from "aws-amplify";
import {setActiveUiScreenMode, setCurrentlyReviewedStudentId, updateSingleReview} from "../../app/store/appReducer";
import {reportError} from "../../developer/DevUtils";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faChevronLeft, faGripLines, faTimes} from '@fortawesome/free-solid-svg-icons'
import ConfirmationModal from "../../app/components/ConfirmationModal";
import {sendAutoGradeToLMS} from "../../lmsConnection/RingLeader";
import {calcAutoScore, calcMaxScoreForAssignment, getAvailableContentDims} from "../../tool/ToolUtils";

import RubricAssessorPanel from "../../instructor/assignments/RubricAssessorPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import CommentsPanel from "./CommentsPanel";
import EditorToolbar, {formats, modules} from "../../tool/RteToolbar";
import ReactQuill, {Quill} from "react-quill";
import { v4 as uuid } from "uuid";
import {updateAssignment as updateAssignmentMutation, updateReview} from "../../graphql/mutations";

const Delta = Quill.import("delta");

library.add(faCheck, faTimes, faGripLines);

const MAX_TOP_ZONE_PERCENT = 80;
const MIN_TOP_ZONE_PERCENT = 10;



function PeerHomeworkAssessor(props) {
  const {homework, assignment, isInstructorAssessment, submitBtnRef, onReviewUpdated, onRatingChanges, review} = props;
  const {toolHomeworkData} = homework;

  const dragBarRef = useRef(null);
  const headerZoneRef = useRef(null);
  const footerZoneRef = useRef(null);
  const reactQuillRef = useRef(null);

  const dispatch = useDispatch();
	const activeUser = useSelector(state => state.app.activeUser);

  const [userComments, setUserComments] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [availableHeight, setAvailableHeight] = useState(2000);
  const [topZonePercent, setTopZonePercent] = useState(20);
  const [prevCommentId, setPrevCommentId] = useState('');
  const [showPlusButton, setShowPlusButton] = useState(false);
  const [activeCommentId, _setActiveCommentId] = useState('');

  const [origContent, setOrigContent] = useState(null);

  const setActiveCommentId = (id) => {
    setPrevCommentId(activeCommentId || '');
    _setActiveCommentId(id);
  }



  useEffect(() => {
    const tagsElem = document.getElementById('comments-layer-wrapper');
    reactQuillRef.current.editor.addContainer(tagsElem);

    const editorElem = document.querySelector('.ql-editor');
    window.addEventListener('resize', onWindowResized);
    editorElem.addEventListener('scroll', onEditorScrolled);

    setOrigContent(reactQuillRef.current.editor.getContents(0));
    setUserComments(getInitializedUserComments(review.comments));

    if (submitBtnRef.current) submitBtnRef.current.onclick = onSubmit;
    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
      editorElem.removeEventListener('scroll', onEditorScrolled);
    }
  }, [])

  useEffect(() => {
    onWindowResized();
  }, [props.excessHeight])

  useEffect(() => {
    if (activeCommentId === prevCommentId) return;

    if (prevCommentId) {
      const prevElems = document.querySelectorAll(`span[data-id='${prevCommentId}']`);
      prevElems.forEach(elem => elem.style.backgroundColor = null);
    }

    if (activeCommentId) {
      const activeElems = document.querySelectorAll(`span[data-id='${activeCommentId}']`);
      activeElems.forEach(elem => elem.style.backgroundColor = '#FFD23D');
    }
  }, [activeCommentId])


  function onSubmit() {
    console.log("SUBMIT PUSHED, YO!!!!!!!!!!!!!!!!!!!!!!!")
    saveUpdatesToServer(review, true);
  }

  function getInitializedUserComments(comments) {
    const editor = reactQuillRef.current.editor;
    const origSelection = editor.getSelection();

    console.log("--- getInitializedUserComments() polling origContents");
    const altUserComments = comments.map((c,i) => {
      const bounds = editor.getBounds(c.index, c.length);
      const theComment = {
        ...c,
        tagName: (i+1 < 10) ? "0" + (i+1) : "" + (i+1),
        x: bounds.left + bounds.width,
        y: bounds.top + editor.scrollingContainer.scrollTop,
        origContent: editor.getContents(c.index, c.length),
      }
      editor.formatText(c.index, c.length, 'comment-tag', {id: c.id}, 'silent');
      return theComment;
    })

    if (origSelection) editor.setSelection(origSelection);
    return(altUserComments)
  }


  function onWindowResized() {
    // console.log(`props.excessHeight = ${props.excessHeight}`);
    const {width, height} = getAvailableContentDims(headerZoneRef, footerZoneRef, props.excessHeight);
    setAvailableHeight(height - 48);
  }

  function onEditorScrolled() {
    const tagsElem = document.getElementById('comments-layer-wrapper');
    const toolbarElem = document.querySelector('.ql-tooltip.ql-hidden');
    const buttonsLayer = tagsElem.querySelector('.comment-buttons-layer');
    buttonsLayer.style.top = toolbarElem.style['margin-top'];
  }

  function onSelectionChanged(range, source) {
    const editor = reactQuillRef?.current?.editor;
    if (!editor || source !== 'user' || !range) return;

    let sel = range.index;
    let comment = userComments.find(c => {
      let start = c.index, end = c.index + c.length;
      return ((sel > start) && (sel < end));
    });
    let commentId = (comment) ? comment.id : '';
    if (comment && range.length && range.index + range.length > comment.index + comment.length) {
      commentId = '';
      setShowPlusButton(false);
    } else {
      setShowPlusButton(!commentId && range.length);
    }
    setActiveCommentId(commentId);
  }


  function onAddComment(e) {
    let bounds, newComment, isAvailable;
    const editor = reactQuillRef.current.editor;

    let sel = editor.getSelection();
    const selEnd = sel?.index + sel?.length;
    if (!sel || !sel.length) {
      // TODO: Notify user of not being a range
      console.log("Comment NOT added because selection is not a RANGE.");
      return;
    }
    bounds = editor.getBounds(sel.index, sel.length);
    isAvailable = userComments.every(c => ((sel.index > c.index + c.length) || (selEnd < c.index)));

    if (!isAvailable) {
      // TODO: Notify user of overlapping comment selection
      console.log("Comment NOT added because selection overlaps an existing comment area.");
      return;
    }

    const comCount = userComments.length + 1;
    const maxTagNum = (userComments.length) ? Math.max(...userComments.map(c => c.tagNum)) : 0;

    newComment = {
      id: uuid(),
      tagNum: maxTagNum + 1,
      tagName: (comCount < 10) ? "0" + comCount : "" + comCount,
      content: '',
      index: sel.index,
      length: sel.length,
      x: bounds.left + bounds.width,
      y: bounds.top + editor.scrollingContainer.scrollTop,
      origContent: editor.getContents(sel.index, sel.length),
      commentRating: -1
    }
    console.log("--- onAddComment():", newComment.origContent);

    editor.formatText(sel.index, sel.length, 'comment-tag', {id: newComment.id}, 'api');
    let altComments = [...userComments, newComment].sort((a,b) => a.index - b.index).map((c, i) => ({...c, tagName: (i+1 < 10) ? "0" + (i+1) : "" + (i+1)}));
    setUserComments(altComments);

    saveUpdatesToServer({...review, comments:altComments})
    // TODO: This is why the id isn't getting set. Not sure why.
    setActiveCommentId(newComment.id);
  }

  function onDeleteComment(commentId, isOnlyStyleDelete) {
    if (!commentId) return;

    const editor = reactQuillRef.current.editor;

    let altComments = [...userComments];
    const cIndex = altComments.findIndex(c => c.id === commentId);
    if (cIndex < 0) {
      if (!isOnlyStyleDelete) console.error("comment not found!");
      return;
    }

    altComments.splice(cIndex, 1);
    altComments = altComments.map((c, i) => ({...c, tagNum:i+1, tagName: (i+1 < 10) ? "0" + (i+1) : "" + (i+1)}));
    setUserComments(altComments);

    setActiveCommentId('');
    editor.setContents(origContent);
    setUserComments(getInitializedUserComments(altComments));

    saveUpdatesToServer({...review, comments:altComments})
  }

  function onUpdateComment(comment) {
    let altComments = [...userComments];
    let index = altComments.findIndex(c => c.id === comment.id);

    if (!userComments[index] || userComments[index].content !== comment.content) {
      altComments[index] = comment;
      setUserComments(altComments);
      saveUpdatesToServer({...review, comments:altComments})
    }
  }

  function onRankSelected(selectedCriterion, rNum) {
    const ratings = [...review.criterionRatings];
    let ratingIndex = ratings.findIndex(r => r.criterionId === selectedCriterion.id);
    if (ratingIndex >= 0) {
      const oldRating = ratings[ratingIndex];
      oldRating.ratingGiven = rNum;
      ratings.splice(ratingIndex, 1, oldRating)
    } else {
      const rating = {
        ratingGiven: rNum,
        criterionId: selectedCriterion.id
      }
      ratings.push(rating);
    }

    const altReview = {...review, criterionRatings: ratings};
    saveUpdatesToServer(altReview)
    onRatingChanges(ratings);
  }




  async function saveUpdatesToServer(data, isSubmit = false) {

    // console.log(`saveUpdatesToServer`, data, moment.valueOf());
    if (!data.beganOnDate) data.beganOnDate = moment().valueOf();
    if (isSubmit) data.submittedOnDate = moment().valueOf();

    const inputData = {...data};
    delete inputData.createdAt;
    delete inputData.updatedAt;

    inputData.comments = inputData.comments.map(c => ({
      id: c.id,
      tagNum: c.tagNum,
      content: c.content,
      index: c.index,
      length: c.length,
      commentRating: c.commentRating
    }));

    try {
      // console.log(`using input data: `, inputData);
      const result = await API.graphql({query: updateReview, variables: {input: inputData}});
      dispatch(updateSingleReview(data))

      console.log("saveRatingUpdatesToServer()", result)
    } catch (error) {
      reportError(error, `We're sorry. An error occurred while trying to save your assessment changes. Please wait a moment and try again.`);
    }
  }


  // async function saveOrSubmitAssessment(updatedToolHomeworkData, isSubmit) {
  //   try {
  //     const updatedHomeworkData = Object.assign({}, homework, {toolHomeworkData: updatedToolHomeworkData});
  //     const inputData = Object.assign({}, {id: homework.id, toolHomeworkData: updatedToolHomeworkData});
  //     const result = await API.graphql({query: updateHomeworkReviewData, variables: {input: inputData}});
  //
  //     // We must also update the toolAssignmentData to capture the data about if/when an assessment was submitted for this homework
  //     let isAllocationsUpdated = false, assignmentResult;
  //     let a = props.allocations.findIndex(a => a.assessorId === activeUser.id && a.homeworkId === homework.id);
  //     let allocation = props.allocations[a];
  //     if (!allocation) {
  //       isAllocationsUpdated = true;
  //       allocation = {
  //         assessorId: activeUser.id,
  //         homeworkId: homework.id,
  //         beganOnDate: moment().valueOf(),
  //         submittedOnDate: (isSubmit) ? moment().valueOf() : 0,
  //       };
  //     } else if (isSubmit) {
  //       isAllocationsUpdated = true;
  //       allocation.submittedOnDate = moment().valueOf();
  //     }
  //
  //     let allocationsNow = [allocation];
  //     if (isAllocationsUpdated) {
  //       const allocationResults = await API.graphql(graphqlOperation(getAssignmentAllocations, {id:assignment.id}));
  //       allocationsNow = [...allocationResults.data.getAssignment.toolAssignmentData.allocations];
  //       let oldIndex = allocationsNow.findIndex(a => a.assessorId === activeUser.id && a.homeworkId === homework.id);
  //       if (oldIndex >= 0) {
  //         allocationsNow.splice(oldIndex, 1, allocation);
  //       } else {
  //         allocationsNow.push(allocation);
  //       }
  //
  //       const assignmentInputData = Object.assign({}, {id: assignment.id, toolAssignmentData: {allocations: allocationsNow}});
  //       console.log('updating allocations', allocationsNow);
  //       assignmentResult = await API.graphql({query: updateAssignmentAllocations, variables: {input: assignmentInputData}});
  //     }
  //
  //     if (isSubmit) {
  //       if (result && (!isAllocationsUpdated || (isAllocationsUpdated && assignmentResult))) {
  //         if (assignment.isUseAutoSubmit) await calcAndSendScore(inputData);
  //         onReviewUpdated(updatedHomeworkData, isAllocationsUpdated ? allocationsNow : null);
  //         await setActiveModal({type: MODAL_TYPES.confirmHomeworkSubmitted})
  //       } else {
  //         reportError('', `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
  //       }
  //     } else {
  //       if (result && (!isAllocationsUpdated || (isAllocationsUpdated && assignmentResult))) {
  //         onReviewUpdated(updatedHomeworkData, isAllocationsUpdated ? allocationsNow : null);
  //       } else {
  //         console.error("problem saving the assessment");
  //       }
  //     }
  //   } catch (error) {
  //     reportError(error, `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
  //   }
  // }

  async function calcAndSendScore(homework) {
    try {
      const scoreDataObj = {
        assignmentId: assignment.id,
        studentId: activeUser.id,
        scoreGiven: await calcAutoScore(assignment, homework),
        scoreMaximum: await calcMaxScoreForAssignment(assignment),
        comment: '',
        activityProgress: ACTIVITY_PROGRESS.Completed,
        gradingProgress: HOMEWORK_PROGRESS.fullyGraded
      };

      console.warn('-----> about to send scoreDataObj: ', scoreDataObj);
      await sendAutoGradeToLMS(scoreDataObj);
    } catch(error) {
      reportError(error, `We're sorry. There was a problem posting your grade`);
    }
  }

  async function closeModalAndReview() {
    setActiveModal(null);
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.reviewHomework));
    await props.refreshHandler();
  }


  function autoSave() {
	  // TODO: Bonus. Add in method to handle automatically saving student work
  }

  function renderModal() {
    switch (activeModal.type) {
      case MODAL_TYPES.warningBeforeHomeworkSubmission:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Are you sure?'} buttons={[
            {name:'Cancel', onClick: () => setActiveModal(null)},
            // {name:'Submit', onClick:submitAssessment},
            {name:'Submit', onClick:() => saveUpdatesToServer(review, true)},
          ]}>
            <p>Once submitted, you cannot go back to make additional edits to your assignment.</p>
          </ConfirmationModal>
        )
      case MODAL_TYPES.confirmHomeworkSubmitted:
        return (
          <ConfirmationModal onHide={() => setActiveModal(null)} title={'Submitted!'} buttons={[
            {name:'Review', onClick:closeModalAndReview},
          ]}>
            <p>You can now review your submitted assignment.</p>
          </ConfirmationModal>
        )
    }
  }

  function onCancelButton() {
    dispatch(setCurrentlyReviewedStudentId(''));
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssignment));
  }

  function onDragResizeBegun(e) {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    const dragStartY = (e.clientY)
    const origTopZonePerc = topZonePercent;

    function onMouseMove(e) {
      let curY = e.clientY;
      let pixelDeltaY = curY - dragStartY;
      let percentDeltaY = pixelDeltaY/availableHeight * 100;
      let btnHeightPerc = 22/availableHeight * 100;

      let newPerc = origTopZonePerc + percentDeltaY;
      let nextTopPerc = Math.min(newPerc, MAX_TOP_ZONE_PERCENT-btnHeightPerc);
      nextTopPerc = Math.max(nextTopPerc, MIN_TOP_ZONE_PERCENT+btnHeightPerc);
      setTopZonePercent(nextTopPerc);
    }

    function onMouseUp(){
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  }

	return (
		<Fragment>
      {activeModal && renderModal()}
      {!isInstructorAssessment &&
      <Row ref={headerZoneRef} className={'m-0 p-0 pb-2'}>
        <Button className='d-inline mr-2 btn-sm' onClick={onCancelButton}><FontAwesomeIcon
          icon={faChevronLeft}/></Button>
        <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
      </Row>
      }

			<div className='assessor-wrapper d-flex flex-column' style={{height: `calc(${availableHeight}px)`}}>
        <div className='top-zone w-100 m-0 p-0' style={{height: topZonePercent+'%'}}>
          <RubricAssessorPanel
            isReadOnly={!!review.submittedOnDate}
            isShowCriteriaPercents={isInstructorAssessment}
            rubricRanks={assignment.toolAssignmentData.rubricRanks}
            rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
            ratings={review.criterionRatings}
            onRankSelected={onRankSelected}
          />
        </div>

        <div ref={dragBarRef} className='drag-bar' onMouseDown={onDragResizeBegun} style={{top: `calc(${topZonePercent}% - 22px)`}}>
          <div className='drag-knob'><FontAwesomeIcon className={'fa-xs'} icon={faGripLines} /></div>
        </div>

        <div className='bottom-zone d-flex flex-row m-0 p-0' style={{height: `calc(${availableHeight - (availableHeight * topZonePercent/100)}px)`}}>
          <div className={`d-flex flex-column text-editor no-bar`}>
            <EditorToolbar />
            <div id='comments-layer-wrapper'>
              <div className='comment-buttons-layer'>
                {userComments.map(c =>
                  <div key={c.id}
                    onClick={() => setActiveCommentId(c.id)}
                    className={`comment-btn${(c.id === activeCommentId) ? ' selected' : ''}`}
                    style={{top: (c.y - 14)+'px', left: (c.x - 8)+'px'}}>
                    {c.tagName}
                  </div>
                )}
              </div>
            </div>
            <ReactQuill
              ref={reactQuillRef}
              theme="snow"
              readOnly={true}
              defaultValue={toolHomeworkData.draftContent}
              onChange={() => {}}
              onChangeSelection={onSelectionChanged}
              placeholder={"Write something awesome..."}
              modules={modules}
              formats={formats}
            />
          </div>
          <CommentsPanel
            isReadOnly={!!review.submittedOnDate}
            className='h-auto'
            showPlusButton={showPlusButton}
            assessorId={activeUser.id}
            criteria={assignment.toolAssignmentData.rubricCriteria}
            activeCommentId={activeCommentId}
            comments={userComments}
            setActiveCommentId={setActiveCommentId}
            updateComment={onUpdateComment}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
			</div>

      {!isInstructorAssessment &&
      <div ref={footerZoneRef} className='m-0 p-0 pt-2 text-right'>
        <Button className='d-inline mr-2 ql-align-right btn-sm' onClick={() => saveUpdatesToServer(review)}>Save Changes</Button>
        <Button className='d-inline ql-align-right btn-sm' onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit Assessment</Button>
      </div>
      }

		</Fragment>
	)
}

export default PeerHomeworkAssessor;