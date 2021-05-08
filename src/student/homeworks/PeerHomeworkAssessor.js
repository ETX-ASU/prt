import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {Button, Container, Row, Col} from 'react-bootstrap';
import {updateHomework as updateHomeworkMutation} from "../../graphql/mutations";
import {API} from "aws-amplify";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
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
const Delta = Quill.import("delta");

// import Highlight from '../../tool/Highlight';

library.add(faCheck, faTimes, faGripLines);

const MAX_TOP_ZONE_PERCENT = 80;
const MIN_TOP_ZONE_PERCENT = 10;


function PeerHomeworkAssessor(props) {
  const {homework, assignment, isInstructorAssessment, defaultActiveCommentId, onAssessmentUpdated} = props;
  const {toolHomeworkData} = homework;
  const dispatch = useDispatch();
	const activeUser = useSelector(state => state.app.activeUser);

  const [nonUserComments, setNonUserComments] = useState(toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId !== activeUser.id));
  const [userComments, setUserComments] = useState(toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId === activeUser.id));
  const [activeModal, setActiveModal] = useState(null);

  const dragBarRef = useRef(null);
  const headerZoneRef = useRef(null);
  const footerZoneRef = useRef(null);
  const reactQuillRef = useRef(null);

  const [availableHeight, setAvailableHeight] = useState(2000);
  const [topZonePercent, setTopZonePercent] = useState(20);
  const [activeCommentId, _setActiveCommentId] = useState(defaultActiveCommentId || '');
  const [prevCommentId, setPrevCommentId] = useState(defaultActiveCommentId || '');
  const [origComment, setOrigComment] = useState();

  const setActiveCommentId = (id) => {
    setPrevCommentId(activeCommentId);
    _setActiveCommentId(id);
  }



  useEffect(() => {
    console.log("++++++++++++ REBUILDING PeerHomeworkAssessor")
    const tagsElem = document.getElementById('comments-layer-wrapper');
    reactQuillRef.current.editor.addContainer(tagsElem);

    const toolbarElem = document.querySelector('.ql-tooltip.ql-hidden');
    const buttonsLayer = tagsElem.querySelector('.comment-buttons-layer');
    const editorElem = document.querySelector('.ql-editor');

    onWindowResized();
    // rehydrateComments(userComments);

    window.addEventListener('resize', onWindowResized);

    // TODO: remove event listener!
    editorElem.addEventListener('scroll', () => buttonsLayer.style.top = toolbarElem.style['margin-top']);

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [])


  useEffect(() => {
    console.log("============================ toolHomeworkData CHANGED!")
    setNonUserComments(toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId !== activeUser.id));
    setUserComments(toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId === activeUser.id));

    onAddComment(null, {index:10, length:5});
    // setActiveCommentId(defaultActiveCommentId);

    // const editor = reactQuillRef.current.editor;
    // let origText = editor.getContents(10, 5);

    // setOrigComment(origText);
    // editor.setSelection(10, 5);

    // editor.updateContents(new Delta().retain(10).delete(5));
    // editor.updateContents(new Delta().retain(10).retain(5, {attribute: {'color': 'yellow'}}));

    // reactQuillRef.current.updateContents(new Delta().retain(10).retain(5, {bold: true}));

  }, [toolHomeworkData])

  useEffect(() => {
    onWindowResized();
  }, [props.excessHeight])

  // useEffect(() => {
  //   const editor = reactQuillRef.current.editor;
  //   let activeComment = null;
  //   console.log("+++++++++++++ setting comment-tags");
  //   userComments.forEach(c => {
  //     // const startPt = c.index;
  //     // editor.setSelection(startPt, c.length);
  //     // editor.format((activeCommentId) ? 'comtag-active' : 'comtag');
  //     editor.formatText(c.index, c.length, 'comtag');
  //     if (c.id === activeCommentId) activeComment = c;
  //   })
  //
  //   if (prevCommentId !== activeCommentId && activeComment) {
  //     editor.setSelection(activeComment.index + activeComment.length - 1, 0, 'user');
  //   } else {
  //     editor.setSelection(null);
  //   }
  // }, [userComments, activeCommentId]);


  function onWindowResized() {
    console.log(`props.excessHeight = ${props.excessHeight}`);
    // if (isInstructorAssessment) {
    //   if (isInstructorAssessment) setAvailableHeight(props.availableHeight);
    // } else {
      const {width, height} = getAvailableContentDims(headerZoneRef, footerZoneRef, props.excessHeight);
      // setAvailableHeight((props.excessHeight) ? height - 48 - props.excessHeight : height - 48);
      setAvailableHeight(height - 48);
      rehydrateComments(userComments);
    // }
  }

  // handle changes to selection if actual highlighted content is clicked
  function onSelectionChanged(range, source) {
    const editor = reactQuillRef?.current?.editor;
    // console.log("onSelectionChanged", source, range?.length);
    if (!editor || source !== 'user' || !range || range.length > 0) return;

    const commentId = getIdOfLeaf(editor, range.index);
    setActiveCommentId(commentId);
  }

  function getIdOfLeaf(editor, index) {
    const leaf = editor.getLeaf(index);
    const className = leaf[0].parent.domNode.className;
    if (className !== 'comment-btn' && className !== 'comment-tag') return;

    return leaf[0].parent.domNode.id || '';
  }



  function rehydrateComments(comments) {
    const editor = reactQuillRef.current.editor;

    const updatedComments = comments.map(c => {
      let bounds = editor.getBounds(c.index, c.length);
      return ({...c,
        x: bounds.left + bounds.width,
        y: bounds.top + editor.scrollingContainer.scrollTop,
        tagName: (c.tagNum < 10) ? "0" + c.tagNum : "" + c.tagNum
      })
    })

    // props.onAssessmentCommentChanges(updatedComments);
  }

  // Handle updates, additions to comments and rank selections
  function onUpdateComment(comment, removeFocus) {
    let altComments = [...userComments];
    let index = altComments.findIndex(c => c.id === comment.id)
    altComments[index] = comment;

    // rehydrateComments(altComments);
    setUserComments(altComments);
    if (removeFocus) setActiveCommentId(null);
  }


  function onDeleteComment(commentId) {
    if (!commentId) return;
    const editor = reactQuillRef.current.editor;

    const altComments = [...userComments];
    const cIndex = altComments.findIndex(c => c.id === commentId);
    if (cIndex < 0) {
      console.error("comment not found!");
      return;
    }
    const targetComment = altComments[cIndex];

    let myDelta = {ops: [{retain: 10}, {delete:5}, ...targetComment.origContent.ops]};
    editor.updateContents(new Delta(myDelta));

    altComments.splice(cIndex, 1);
    setUserComments(altComments);
    setActiveCommentId(null);

    // After or instead of rehydrate, save changes
    // rehydrateComments(updatedComments);
  }

  function onAddComment(e, selection) {
    let bounds, newComment, isAvailable;
    const comCount = userComments.length + 1;
    const editor = reactQuillRef.current.editor;

    let sel = selection ? selection : editor.getSelection();
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

    newComment = {
      id: uuid(),
      reviewerId: activeUser.id,
      tagNum: comCount,
      tagName: (comCount < 10) ? "0" + comCount : "" + comCount,
      content: '',
      index: sel.index,
      length: sel.length,
      x: bounds.left + bounds.width,
      y: bounds.top + editor.scrollingContainer.scrollTop,
      origContent: editor.getContents(sel.index, sel.length),
      commentRating: -1,
      criterionNum: -1
    }

    editor.formatText(sel.index, sel.length, 'comment-tag', {id: newComment.id, isActiveBtn: false}, 'api');
    setUserComments([...userComments, newComment]);
    if (!selection) setActiveCommentId(newComment.id);

    // onAssessmentUpdated({...toolHomeworkData, commentsOnDraft: [...nonUserComments, ...userComments, newComment]}, newComment.id);
  }

  function onRankSelected(crit, rNum) {
    const ratings = [...toolHomeworkData.criterionRatingsOnDraft];
    let ratingIndex = ratings.findIndex(r => r.criterionId === crit.id);
    if (ratingIndex >= 0) {
      const oldRating = ratings[ratingIndex];
      oldRating.ratingGiven = rNum;
      ratings.splice(ratingIndex, 1, oldRating)
    } else {
      const rating = {
        reviewerId: activeUser.id,
        ratingGiven: rNum,
        criterionId: crit.id
      }
      ratings.push(rating);
    }

    onAssessmentUpdated({...toolHomeworkData, commentsOnDraft: [...nonUserComments, ...userComments]}, activeCommentId)
  }

  function onEditorBlur(e) {
    // May need to use this to capture last selection before editor loses focus and a the addComment btn is triggered
    // console.log("Editor Blurred", e)
  }

  async function saveOrSubmitAssessment(isSubmit = false) {
    const userComments = userComments.map(c => ({
      id: c.id,
      reviewerId: activeUser.id,
      tagNum: c.tagNum,
      content: c.content,
      index: c.index,
      length: c.length,
      commentRating: c.commentRating,
      criterionNum: c.criterionNum
    }));

    try {
      const inputData = Object.assign({}, homework, {
        toolHomeworkData: {...toolHomeworkData, commentsOnDraft: [...nonUserComments, ...userComments]},
        beganOnDate: (homework.beganOnDate) ? homework.beganOnDate : moment().valueOf(),
        submittedOnDate: (homework.submittedOnDate) ? homework.submittedOnDate : (isSubmit) ? moment().valueOf() : 0
      });
      const updatedHomeworkData = Object.assign({}, inputData);
      delete inputData.createdAt;
      delete inputData.updatedAt;

      delete inputData.activityProgress;
      delete inputData.homeworkStatus;
      delete inputData.gradingProgress;
      delete inputData.scoreGiven;
      delete inputData.scoreMaximum;
      delete inputData.comment;

      const result = await API.graphql({query: updateHomeworkMutation, variables: {input: inputData}});
      if (isSubmit) {
        if (result) {
          if (assignment.isUseAutoSubmit) await calcAndSendScore(inputData);
          await setActiveModal({type: MODAL_TYPES.confirmHomeworkSubmitted})
        } else {
          reportError('', `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
        }
      } else {
        if (!result) {
          console.error("problem saving the assessment");
        } else {
          console.log("SAVED assessment");
          if (props.onAssessmentUpdated) props.onAssessmentUpdated(updatedHomeworkData, activeCommentId);
        }
      }
    } catch (error) {
      reportError(error, `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
    }
  }

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
            {name:'Submit', onClick:() => saveOrSubmitAssessment(true)},
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
            isShowCriteriaPercents={isInstructorAssessment}
            rubricRanks={assignment.toolAssignmentData.rubricRanks}
            rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
            ratings={toolHomeworkData.criterionRatingsOnDraft}
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
              onBlur={onEditorBlur}
            />
          </div>
          <CommentsPanel
            key={activeCommentId}
            className='h-auto'
            assessorId={activeUser.id}
            criteria={assignment.toolAssignmentData.rubricCriteria}
            toolHomeworkData={toolHomeworkData}
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
        <Button className='d-inline mr-2 ql-align-right btn-sm' onClick={saveOrSubmitAssessment}>Save Changes</Button>
        <Button className='d-inline ql-align-right btn-sm' onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit Assessment</Button>
      </div>
      }

		</Fragment>
	)
}

export default PeerHomeworkAssessor;