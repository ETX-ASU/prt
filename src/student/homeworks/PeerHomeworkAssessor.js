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
import ReactQuill from "react-quill";
import { v4 as uuid } from "uuid";

library.add(faCheck, faTimes, faGripLines);

const MAX_TOP_ZONE_PERCENT = 80;
const MIN_TOP_ZONE_PERCENT = 10;


function PeerHomeworkAssessor(props) {
	const dispatch = useDispatch();
	const {homework, assignment, isInstructorAssessment} = props;
	const activeUser = useSelector(state => state.app.activeUser);
	const [toolHomeworkData, setToolHomeworkData] = useState(Object.assign({}, homework.toolHomeworkData));
  const [activeModal, setActiveModal] = useState(null);

  const dragBarRef = useRef(null);
  const headerZoneRef = useRef(null);
  const footerZoneRef = useRef(null);
  const reactQuillRef = useRef(null);

  const [availableHeight, setAvailableHeight] = useState(2000);
  const [topZonePercent, setTopZonePercent] = useState(20);

  const [comments, setComments] = useState([]);
  const [activeCommentId, _setActiveCommentId] = useState('');
  const [prevCommentId, setPrevCommentId] = useState('');

  const setActiveCommentId = (id) => {
    setPrevCommentId(activeCommentId);
    _setActiveCommentId(id);
  }


  useEffect(() => {
    const tagsElem = document.getElementById('comments-layer-wrapper');
    reactQuillRef.current.editor.addContainer(tagsElem);

    const toolbarElem = document.querySelector('.ql-tooltip.ql-hidden');
    const buttonsLayer = tagsElem.querySelector('.comment-buttons-layer');
    const editorElem = document.querySelector('.ql-editor');

    onWindowResized();

    rehydrateComments(toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId === activeUser.id));


    window.addEventListener('resize', onWindowResized);

    // TODO: remove event listener!
    editorElem.addEventListener('scroll', () => buttonsLayer.style.top = toolbarElem.style['margin-top']);

    return () => {
      window.removeEventListener('resize', onWindowResized);
    }
  }, [])

  useEffect(() => {
    const editor = reactQuillRef.current.editor;
    let activeComment = null;
    comments.forEach(c => {
      const startPt = c.index;
      editor.setSelection(startPt, c.length);
      editor.format('comment-tag', {id: c.id, isActiveBtn: (c.id === activeCommentId)});
      if (c.id === activeCommentId) activeComment = c;
    })

    if (prevCommentId !== activeCommentId && activeComment) {
      editor.setSelection(activeComment.index + activeComment.length - 1, 0, 'user');
    } else {
      editor.setSelection(null);
    }
  }, [comments.length, activeCommentId]);

  function onWindowResized() {
    // console.log("Running resize handler")
    if (isInstructorAssessment) {
      if (isInstructorAssessment) setAvailableHeight(props.availableHeight);
    } else {
      const {width, height} = getAvailableContentDims(headerZoneRef, footerZoneRef, props.extraHeight);
      setAvailableHeight(height - 48);
      rehydrateComments(comments);
    }
  }

  // handle changes to selection if actual highlighted content is clicked
  function onSelectionChanged(range, source) {
    const editor = reactQuillRef?.current?.editor;
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


  // Handle updates, additions to comments and rank selections
  function onUpdateComment(comment) {
    let altComments = [...comments];
    let index = altComments.findIndex(c => c.id === comment.id)
    altComments[index] = comment;
    setComments(altComments);
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

    setComments(updatedComments);
  }

  function onDeleteComment(commentId) {
    // setActiveCommentId('');
    const updatedComments = [...comments];
    const cIndex = updatedComments.findIndex(c => c.id === commentId);
    const c = updatedComments[cIndex];

    reactQuillRef.current.editor.removeFormat(c.index, c.length);
    reactQuillRef.current.editor.format('comment-tag', {id: c.id, isActiveBtn: (c.id === activeCommentId)});

    updatedComments.splice(cIndex, 1);

    // After or instead of rehydrate, save changes
    rehydrateComments(updatedComments);
  }

  function onAddComment(e, orig) {
    let bounds, newComment, isAvailable;
    const comCount = comments.length + 1;
    const editor = reactQuillRef.current.editor;

    if (orig) {
      bounds = editor.getBounds(orig.index, orig.length);
      newComment = {...orig,
        x: bounds.left + bounds.width,
        y: bounds.top + editor.scrollingContainer.scrollTop,
        tagName: (orig.tagNum < 10) ? "0" + orig.tagNum : "" + orig.tagNum
      }
    } else {
      let sel = editor.getSelection();
      const selEnd = sel.index + sel.length;
      bounds = editor.getBounds(sel.index, sel.length);
      isAvailable = comments.every(c => ((sel.index > c.index + c.length) || (selEnd < c.index)));

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
        commentRating: -1,
        criterionNum: -1
      }
      setActiveCommentId(newComment.id);

    }

    setComments([...comments, newComment]);
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
    setToolHomeworkData({...toolHomeworkData, criterionRatingsOnDraft:ratings})
  }



  async function saveAssessment() {
    const nonUserComments = toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId !== activeUser.id);
    const userComments = comments.map(c => ({
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
        submittedOnDate: (homework.submittedOnDate) ? homework.submittedOnDate : moment().valueOf()
      });
      delete inputData.createdAt;
      delete inputData.updatedAt;

      delete inputData.activityProgress;
      delete inputData.homeworkStatus;
      delete inputData.gradingProgress;
      delete inputData.scoreGiven;
      delete inputData.scoreMaximum;
      delete inputData.comment;

      const result = await API.graphql({query: updateHomeworkMutation, variables: {input: inputData}});
      if (result) {
        if (assignment.isUseAutoSubmit) await calcAndSendScore(inputData);
        await setActiveModal({type: MODAL_TYPES.confirmHomeworkSubmitted})
      } else {
        reportError('', `We're sorry. There was a problem submitting your homework for review. Please wait a moment and try again.`);
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
            {name:'Submit', onClick:saveAssessment},
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
                {comments.map(c =>
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
              // className='h-100'
              theme="snow"
              readOnly={true}
              defaultValue={toolHomeworkData.draftContent}
              onChange={() => {}}
              onChangeSelection={onSelectionChanged}
              placeholder={"Write something awesome..."}
              modules={modules}
              formats={formats}
              // style={{height: `calc(100% - ${barHeight}px`}}
            />
          </div>
          <CommentsPanel
            className='h-auto'
            assessorId={activeUser.id}
            criteria={assignment.toolAssignmentData.rubricCriteria}
            toolHomeworkData={toolHomeworkData}
            activeCommentId={activeCommentId}
            comments={comments}
            setActiveCommentId={setActiveCommentId}
            updateComment={onUpdateComment}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
			</div>

      {!isInstructorAssessment &&
      <div ref={footerZoneRef} className='m-0 p-0 pt-2 text-right'>
        <Button className='d-inline mr-2 ql-align-right btn-sm' onClick={saveAssessment}>Save Changes</Button>
        <Button className='d-inline ql-align-right btn-sm' onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit Assessment</Button>
      </div>
      }
		</Fragment>
	)
}

export default PeerHomeworkAssessor;