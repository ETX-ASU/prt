import React, {Fragment, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {UI_SCREEN_MODES} from "../../app/constants";
import {Button, Row, Col} from 'react-bootstrap';
import {setActiveUiScreenMode, setCurrentlyReviewedStudentId, updateSingleReview} from "../../app/store/appReducer";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faChevronLeft, faChevronRight, faGripLines, faTimes} from '@fortawesome/free-solid-svg-icons'
import {getAvailableContentDims} from "../../tool/ToolUtils";

import RubricAssessorPanel from "../../instructor/assignments/RubricAssessorPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import CommentsPanel from "./CommentsPanel";
import EditorToolbar, {formats, modules} from "../../tool/RteToolbar";
import ReactQuill from "react-quill";
import {API} from "aws-amplify";
import {updateReview} from "../../graphql/mutations";
import {reportError} from "../../developer/DevUtils";

library.add(faCheck, faTimes, faGripLines, faChevronLeft, faChevronRight);

const MAX_TOP_ZONE_PERCENT = 80;
const MIN_TOP_ZONE_PIXELS = 70;
const MIN_RESIZE_INTERVAL = 200;


function AssessedHomeworkViewer(props) {
  const {
    homework,
    assignment,
    isInstructorAssessment,
    reviewsForUser,
    engagedPeerReviewId,
    excessHeight,
    onShowReview
  } = props;
  const {toolHomeworkData} = homework;

  const dispatch = useDispatch();

  const review = reviewsForUser.find(r => r.id === engagedPeerReviewId);
  const baseNameChar = (reviewsForUser[0].assessorId === assignment.ownerId) ? 64 : 65;
  const reviewLinks = reviewsForUser.map((r, i) => {
    const linkName = (r.assessorId === assignment.ownerId) ? "Instructor" : "Peer " + String.fromCharCode(baseNameChar + i);
    return {isActive: r.id === engagedPeerReviewId, linkName, reviewId: r.id};
  })

  const activeUser = useSelector(state => state.app.activeUser);
  const headerZoneRef = useRef(null);
  const reactQuillRef = useRef(null);
  const throttleCallbackRef = useRef();

  const [userComments, setUserComments] = useState([]);
  const [availableHeight, setAvailableHeight] = useState(2000);
  const [topZonePercent, setTopZonePercent] = useState(20);
  const [prevCommentId, setPrevCommentId] = useState('');
  const [activeCommentId, _setActiveCommentId] = useState('');

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

    setUserComments(getInitializedUserComments(review.comments));

    onWindowResized();

    return () => {
      window.removeEventListener('resize', onWindowResized);
      editorElem.removeEventListener('scroll', onEditorScrolled);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    onWindowResized();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excessHeight])

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCommentId])


  function getInitializedUserComments(comments) {
    const editor = reactQuillRef.current.editor;
    const origSelection = editor.getSelection();

    // console.log("--- getInitializedUserComments() polling origContents");
    const altUserComments = comments.map((c, i) => {
      const bounds = editor.getBounds(c.index, c.length);
      const theComment = {
        ...c,
        tagName: (i + 1 < 10) ? "0" + (i + 1) : "" + (i + 1),
        x: bounds.left + bounds.width,
        y: bounds.top + editor.scrollingContainer.scrollTop,
        origContent: editor.getContents(c.index, c.length),
      }
      editor.formatText(c.index, c.length, 'comment-tag', {id: c.id}, 'silent');
      return theComment;
    })

    if (origSelection) editor.setSelection(origSelection);
    return (altUserComments)
  }


  function onWindowResized() {
    if (throttleCallbackRef.current) window.clearTimeout(throttleCallbackRef.current);
    setUserComments([]);
    const {height} = getAvailableContentDims(headerZoneRef, null, excessHeight);
    setAvailableHeight(height - 48);

    throttleCallbackRef.current = window.setTimeout(() => {
      console.log("resetting comments");
      setUserComments(getInitializedUserComments(review.comments));
    }, MIN_RESIZE_INTERVAL);
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
    if (comment && range.length && range.index + range.length > comment.index + comment.length) commentId = '';
    setActiveCommentId(commentId);
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
      let percentDeltaY = pixelDeltaY / availableHeight * 100;
      // let btnHeightPerc = 22/availableHeight * 100;
      let btnHeightPerc = 48 / availableHeight * 100;

      let newPerc = origTopZonePerc + percentDeltaY;
      let nextTopPerc = Math.min(newPerc, MAX_TOP_ZONE_PERCENT - btnHeightPerc);

      let minTopPercent = MIN_TOP_ZONE_PIXELS / availableHeight * 100
      nextTopPerc = Math.max(nextTopPerc, minTopPercent + btnHeightPerc);
      setTopZonePercent(nextTopPerc);
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  }


  function onCommentRated(comment) {
    const i = review.comments.findIndex(c => c.id === comment.id);
    const altComments = [...review.comments];
    altComments[i] = comment;
    const altReview = {...review, comments: altComments};
    console.log(`onCommentRated: `, comment);
    // dispatch(updateSingleReview(altReview));
    saveUpdatesToServer(altReview);
  }

  async function saveUpdatesToServer(data) {
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
      await API.graphql({query: updateReview, variables: {input: inputData}});
      dispatch(updateSingleReview(data));
    } catch (error) {
      reportError(error, `We're sorry. An error occurred while trying to save the rating you gave to the assessment comments. Please wait a moment and try again.`);
    }
  }


  return (
    <Fragment>
      {!isInstructorAssessment &&
      <Row ref={headerZoneRef} className={'m-0 p-0 pb-2'}>
        <Col className='p-0'>
          <Button className='d-inline mr-2 btn-sm' onClick={onCancelButton}><FontAwesomeIcon
            icon={faChevronLeft}/></Button>
          <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
        </Col>
        <Col className='text-right p-0 col-4'>
          <h3 className='d-inline btn-sm'>REVIEWS:</h3>
          <div className="btn-group d-inline reviewer-links">
            {reviewLinks.map(link =>
              <Button key={link.reviewId} variant={"link"} className={`btn-link ${link.isActive ? ' active' : ''}`}
                onClick={() => onShowReview(link.reviewId)}>{link.linkName}</Button>
            )}
          </div>
        </Col>
      </Row>
      }

      <div className='assessor-wrapper d-flex flex-column' style={{height: `calc(${availableHeight}px)`}}>
        <div className='top-zone w-100 m-0 p-0' style={{height: `calc(${(availableHeight * topZonePercent / 100)}px)`}}>
          <RubricAssessorPanel
            isReadOnly={!!review.submittedOnDate}
            isInstructorAssessment={isInstructorAssessment}
            rubricRanks={assignment.toolAssignmentData.rubricRanks}
            rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
            review={review}
          />
        </div>

        <div className='drag-bar' onMouseDown={onDragResizeBegun} style={{top: `calc(${topZonePercent}% - 22px)`}}>
          <div className='drag-knob'><FontAwesomeIcon className={'fa-xs'} icon={faGripLines}/></div>
        </div>

        <div className='bottom-zone d-flex flex-row m-0 p-0'
          style={{height: `calc(${availableHeight - (availableHeight * topZonePercent / 100)}px)`}}>
          <div className={`d-flex flex-column text-editor no-bar`}>
            <EditorToolbar/>
            <div id='comments-layer-wrapper'>
              <div className='comment-buttons-layer'>
                {userComments.map(c =>
                  <div key={c.id}
                    onClick={() => setActiveCommentId(c.id)}
                    className={`comment-btn${(c.id === activeCommentId) ? ' selected' : ''}`}
                    style={{top: (c.y - 14) + 'px', left: (c.x - 8) + 'px'}}>
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
            isReadOnly={true}
            isAssessmentOfReview={props.isAssessmentOfReview}
            className='h-auto'
            showPlusButton={false}
            assessorId={review.assessorId}
            criteria={assignment.toolAssignmentData.rubricCriteria}
            activeCommentId={activeCommentId}
            comments={review.comments}
            setActiveCommentId={setActiveCommentId}
            isAbleToRateComments={(activeUser.id !== review.assessorId && !isInstructorAssessment)}
            isAbleToSeeRatings={(activeUser.id === assignment.ownerId || (activeUser.id === review.assessorId && review.submittedOnDate))}
            onCommentRated={onCommentRated}
          />
        </div>
      </div>
    </Fragment>
  )
}

export default AssessedHomeworkViewer;