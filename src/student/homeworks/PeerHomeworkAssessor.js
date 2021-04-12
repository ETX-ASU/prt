import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import moment from "moment";
import {useDispatch, useSelector} from "react-redux";
import {ACTIVITY_PROGRESS, HOMEWORK_PROGRESS, MODAL_TYPES, UI_SCREEN_MODES} from "../../app/constants";
import {Button, Container, Row, Col} from 'react-bootstrap';
import {updateHomework as updateHomeworkMutation} from "../../graphql/mutations";
import {API} from "aws-amplify";
import {setActiveUiScreenMode} from "../../app/store/appReducer";
import HeaderBar from "../../app/components/HeaderBar";
import {reportError} from "../../developer/DevUtils";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faChevronLeft, faTimes} from '@fortawesome/free-solid-svg-icons'
import ConfirmationModal from "../../app/components/ConfirmationModal";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";
import {sendAutoGradeToLMS} from "../../lmsConnection/RingLeader";
import {calcAutoScore, calcMaxScoreForAssignment} from "../../tool/ToolUtils";
import DraftWriter from "../../tool/DraftWriter";
import ResizePanel from "react-resize-panel";

import IconBackArrow from "../../assets/icon-back-arrow.svg";
import RubricAssessorPanel from "../../instructor/assignments/RubricAssessorPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import RubricViewer from "../../instructor/assignments/RubricViewer";
import CommentsPanel from "./CommentsPanel";
import EditorToolbar, {formats, modules} from "../../tool/RteToolbar";
import ReactQuill, {Quill} from "react-quill";
import EmphBlot from "../../tool/ComTag";
import { v4 as uuid } from "uuid";

library.add(faCheck, faTimes);


const MIN_TOP_ZONE_PERCENT = 15;
const MAX_TOP_ZONE_PERCENT = 50;
const VERT_MARGIN_PX = 128;

/** This screen is shown to the student so they can "engage" with the homework assignment.
 * Any work they do or changes or interactions they make would be recorded and the updates
 * saved to the database as necessary. */
function PeerHomeworkAssessor(props) {
	const dispatch = useDispatch();
	const {homework, assignment} = props;
	const activeUser = useSelector(state => state.app.activeUser);
	const [toolHomeworkData, setToolHomeworkData] = useState(Object.assign({}, homework.toolHomeworkData));
  const [activeModal, setActiveModal] = useState(null);

  const headerZoneRef = useRef(null);
  const footerZoneRef = useRef(null);
  const wrapperRef = useRef(null);
  const topZone = useRef(null);
  const reactQuillRef = useRef(null);

  const [availHeightPx, setAvailHeightPx] = useState(1000);
  const [topZonePercent, setTopZonePercent] = useState(20);
  const [bottomZonePercent, setBottomZonePercent] = useState(80);

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

    let remainingHeight = document.documentElement.clientHeight
      - headerZoneRef.current.offsetHeight
      - footerZoneRef.current.offsetHeight
      - VERT_MARGIN_PX;

    setAvailHeightPx(remainingHeight);

    window.addEventListener('resize', onWindowResized);
    editorElem.addEventListener('scroll', () => buttonsLayer.style.top = toolbarElem.style['margin-top']);
  }, [])


  useEffect(() => {
    const editor = reactQuillRef.current.editor;
    let activeComment = null;
    comments.forEach(c => {
      const startPt = c.location.index;
      editor.setSelection(startPt, c.location.length);
      editor.format('comment-tag', {id: c.id, isActiveBtn: (c.id === activeCommentId)});
      if (c.id === activeCommentId) activeComment = c;
    })

    if (prevCommentId !== activeCommentId && activeComment) {
      editor.setSelection(activeComment.location.index + activeComment.location.length - 1, 0, 'user');
    } else {
      editor.setSelection(null);
    }
  }, [comments.length, activeCommentId]);


  function onWindowResized(e) {
    let remainingHeight = document.documentElement.clientHeight
      - headerZoneRef.current.offsetHeight
      - footerZoneRef.current.offsetHeight
      - VERT_MARGIN_PX;
    setAvailHeightPx(remainingHeight);
  }

  function downSizeRubric(e) {
    const SHIFT = 5;

    if (topZonePercent-SHIFT < MIN_TOP_ZONE_PERCENT) {
      setTopZonePercent(MIN_TOP_ZONE_PERCENT);
      setBottomZonePercent(100 - MIN_TOP_ZONE_PERCENT);
    } else {
      setTopZonePercent(topZonePercent - SHIFT);
      setBottomZonePercent(bottomZonePercent + SHIFT);
    }

  }

  function upSizeRubric(e) {
    const SHIFT = 5;

    if (topZonePercent+SHIFT > MAX_TOP_ZONE_PERCENT) {
      setTopZonePercent(MAX_TOP_ZONE_PERCENT);
      setBottomZonePercent(100 - MAX_TOP_ZONE_PERCENT);
    } else {
      setTopZonePercent(topZonePercent + SHIFT);
      setBottomZonePercent(bottomZonePercent - SHIFT);
    }

  }


  function getIdOfLeaf(editor, index) {
    const leaf = editor.getLeaf(index);
    const className = leaf[0].parent.domNode.className;
    if (className !== 'comment-btn' && className !== 'comment-tag') return;

    return leaf[0].parent.domNode.id || '';
  }

  // changes selection if actual highlighted content is clicked
  const onSelectionChanged = (range, source) => {
    const editor = reactQuillRef?.current?.editor;
    if (!editor || source !== 'user' || !range || range.length > 0) return;

    const commentId = getIdOfLeaf(editor, range.index);
    setActiveCommentId(commentId);
  }

	async function submitHomeworkForReview() {
    setActiveModal(null);

    try {
      const inputData = Object.assign({}, homework, {
        toolHomeworkData,
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
            {name:'Submit', onClick:submitHomeworkForReview},
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

  function handleCancelButton() {
    dispatch(setActiveUiScreenMode(UI_SCREEN_MODES.viewAssignment));
  }



  function onUpdateComment(comment) {
    let altComments = [...comments];
    let index = altComments.findIndex(c => c.id === comment.id)
    altComments[index] = comment;
    setComments(altComments);
  }


  function onAddComment() {
	  const editor = reactQuillRef.current.editor;

	  // Look through all current comments.
    let sel = editor.getSelection();
    let bounds = editor.getBounds(sel.index, sel.length);

    const isWholeDocument = !sel;
    const selStart = isWholeDocument ? 0 : sel.index;
    const selEnd = isWholeDocument ? 1 : selStart + sel.length;

    const isAvailable = comments.every(c => ((selStart > c.location.index + c.location.length) || (selEnd < c.location.index)));

    const comCount = comments.length + 1;
    if (!isWholeDocument && !isAvailable) {
      console.log("Comment NOT added because selection overlaps an existing comment area.");
    } else {
      const id = uuid();
      const newComment = {
        id: id,
        reviewerId: activeUser.id,
        tagNum: comCount,
        tagName: (comCount < 10) ? "0" + comCount : "" + comCount,
        content: '',
        location: {
          isWholeDocument: isWholeDocument,
          index: sel.index,
          length: sel.length,
          x: bounds.left + bounds.width,
          y: bounds.top + editor.scrollingContainer.scrollTop
        },
        commentRating: -1,
        criterionNum: -1,
        isDrawn: false,
        isActive: false
      };

      setActiveCommentId(id);
      setComments([...comments, newComment]);
    }
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


	return (
		<Fragment>
      {activeModal && renderModal()}
      <Row ref={headerZoneRef} className={'m-0 p-0 pb-2'}>
        <Col className='col-9 p-0'>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronLeft} onClick={handleCancelButton}/>
          <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
        </Col>
        <Col className={'col-3 text-right'}>
          <span onClick={downSizeRubric}>[-]</span>
          <span onClick={upSizeRubric}>[+]</span>
          <Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>
        </Col>
      </Row>

			<div ref={wrapperRef}
        className='assessor-wrapper d-flex flex-column' style={{height: availHeightPx+'px'}}>
        {/*onMouseUp={onDragEnd}*/}
        {/*onMouseMove={onDrag}>*/}
        <div ref={topZone} className='top-zone w-100 mt-3 mb-3' style={{height: topZonePercent+'%'}}>
          <RubricAssessorPanel
            rubricRanks={assignment.toolAssignmentData.rubricRanks}
            rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
            ratings={toolHomeworkData.criterionRatingsOnDraft}
            onRankSelected={onRankSelected}
          />
        </div>
        {/*<div ref={dragBarRef}*/}
        {/*  style={{top: (topZonePercent + 53)+'px'}}*/}
        {/*  className='drag-bar text-center p-2'*/}
        {/*  onMouseDown={onDragStart} >*/}
        {/*  <div className='drag-bar-line' />*/}
        {/*  <div className='drag-bar-knob' />*/}
        {/*</div>*/}
        <div className='bottom-zone d-flex flex-row mt-3' style={{height: bottomZonePercent+'%'}} >
          <div className={`d-flex flex-column text-editor no-bar`}>
            <EditorToolbar />
            <div id='comments-layer-wrapper'>
              <div className='comment-buttons-layer'>
                {comments.map(c =>
                  <div key={c.id}
                    onClick={() => setActiveCommentId(c.id)}
                    className={`comment-btn${(c.id === activeCommentId) ? ' selected' : ''}`}
                    style={{top: (c.location.y - 14)+'px', left: (c.location.x - 8)+'px'}}>
                    {c.tagName}
                  </div>
                )}
              </div>
            </div>
            <ReactQuill
              ref={reactQuillRef}
              // className='h-100'
              theme="snow"
              readOnly={false}
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
            toolAssignmentData={assignment.toolAssignmentData}
            toolHomeworkData={toolHomeworkData}
            activeCommentId={activeCommentId}
            comments={comments}
            setActiveCommentId={setActiveCommentId}
            updateComment={onUpdateComment}
            onAddComment={onAddComment}
          />
          {/*<div ref={tagsLayerRef} >*/}
          {/*  <div className='badge-danger'>HOWDY!</div>*/}
          {/*</div>*/}

        </div>
			</div>



      <Row ref={footerZoneRef} className='mt-2' >
        <Col className='text-right mr-4'>
          <Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>
        </Col>
      </Row>
		</Fragment>
	)
}

export default PeerHomeworkAssessor;