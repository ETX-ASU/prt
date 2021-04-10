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
import RubricPanel from "../../instructor/assignments/RubricPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import RubricViewer from "../../instructor/assignments/RubricViewer";
import CommentsPanel from "./CommentsPanel";
import EditorToolbar, {formats, modules} from "../../tool/RteToolbar";
import ReactQuill, {Quill} from "react-quill";
import EmphBlot from "../../tool/ComTag";
import { v4 as uuid } from "uuid";

library.add(faCheck, faTimes);



/** This screen is shown to the student so they can "engage" with the homework assignment.
 * Any work they do or changes or interactions they make would be recorded and the updates
 * saved to the database as necessary. */
function PeerHomeworkAssessor(props) {
	const dispatch = useDispatch();
	const {homework, assignment} = props;
	const activeUser = useSelector(state => state.app.activeUser);
	const [toolHomeworkData, setToolHomeworkData] = useState(Object.assign({}, homework.toolHomeworkData));
  const [activeModal, setActiveModal] = useState(null);
  const handle = useRef(null);
  const topZone = useRef(null);
  const reactQuillRef = useRef(null);
  const [dragState, setDragState] = useState({isDragging:false, originY:-1, h:200});
  const [topZoneHeight, setTopZoneHeight] = useState(200);
  const [topZonePercent, setTopZonePercent] = useState(45);
  const [comments, setComments] = useState([]);
  const [activeCommentIndex, setActiveCommentIndex] = useState(-1);
  const [combinedDraftAndCommentsContent, setCombinedDraftAndCommentsContent] = useState(toolHomeworkData.draftContent);
  // const [quillRef, setQuillRef] = useState(null);



  useEffect(() => {
    // Loop through all comments
    const editor = reactQuillRef.current.editor;
    const origSelection = editor.getSelection();
    let wasUpdated = false;
    comments.forEach(c => {
      const cFormat = editor.getFormat(c.location.index, c.location.length);
      if (cFormat.color === 'inherit') return;
      editor.setSelection(c.location.index, c.location.length);
      editor.format('span', {id:c.id, tagNum:c.tagNum});
      wasUpdated = true;
      // editor.format('link', () => console.log("Howdy, Bob"));
      // document.getElementById(c.id).onClick = () => console.log(`You clicked ${c.id}`);
    })

    // if (wasUpdated) {
    //   editor.off("selection-change", onSelectionChanged);
    //   editor.on("selection-change", onSelectionChanged);
    // }
      // If comment has NOT been tagged, select it's region in the essay and tag it now.

      // If comment has been set as active, mark it as active and unmark the previous tag



  }, [comments]);

  // useEffect(() => {
  //   const editor = reactQuillRef.current.editor;
  //   editor.on('selection-change', onSelectionChanged)
  // }, [])


  const onSelectionChanged = (range, source, olEditor) => {
    const editor = reactQuillRef?.current?.editor;
    if (!editor) return;
    if (source !== 'user' || !range || range.length > 0) return;
    const leaf = editor.getLeaf(range.index);
    if (leaf[0].parent.domNode.className !== 'comtag') return;
    // console.log("leaf", leaf[0]);
    const commentId = (leaf[0].parent.domNode.id);
    console.log(`Clicked on leaf id #${commentId}`, comments.length);
  }

  // function handleClickFormat() {
  //   console.log('adding comment');
  //   let range = reactQuillRef.current.editor.getSelection();
  //   if (range) {
  //     reactQuillRef.current.editor.format('span', true);
  //   }
  // }


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

  function handleResizing(e) {
    if (!dragState.isDragging) {
      if (dragState.originY === -1 && e.buttons === 1) {
        setDragState({isDragging:true, originY:e.pageY, h:topZone.current.clientHeight});
      }
      return;
    }

    // Stop the drag if no button is down
	  if (dragState.isDragging && e.buttons !== 1) {
	    setDragState({isDragging: false, originY:-1, h:dragState.h});
	    return;
    }

    const yDelta = e.pageY - dragState.originY;
    const h = dragState.h+yDelta; //Math.max(Math.min(topZoneHeight+yDelta, 600), 200);
    setTopZoneHeight(h);
  }


  function onAddComment() {
	  const editor = reactQuillRef.current.editor;

	  // Look through all current comments.
    let sel = editor.getSelection();
    const isWholeDocument = !sel;
    const selStart = isWholeDocument ? 0 : sel.index;
    const selEnd = isWholeDocument ? 1 : selStart + sel.length;

    const isAvailable = comments.every(c => ((selStart > c.location.index + c.location.length) || (selEnd < c.location.index)));

    const comCount = comments.length;
    if (!isWholeDocument && !isAvailable) {
      console.log("Comment NOT added because selection overlaps and existing comment area.");
    } else {
      // Otherwise, we can add this comment to the pile.
      setComments([...comments, {
        id: uuid(),
        reviewerId: activeUser.id,
        tagNum: comCount,
        content: 'Add your notes here',
        location: {
          isWholeDocument: isWholeDocument,
          index: sel.index,
          length: sel.length,
          x: 0,
          y: 0
        },
        commentRating: -1,
        criterionNum: -1,
        isDrawn: false,
        isActive: false
      }]);

      setActiveCommentIndex(comCount)
    }

    // let format = editor.getFormat();
    // if(format.custom) {
    //   editor.format('custom', '');
    // } else {
    //   editor.format('custom', 'comment-dot');
    // }
  }

/*  useEffect(() => {
    const elem = document.getElementById('toolbar');
    console.log('toolbar height', elem.clientHeight);
    window.addEventListener('resize', handleResize);
    setBarHeight(elem.clientHeight+2);
  }, [])

  function handleResize(e) {
    const elem = document.getElementById('toolbar');
    console.log('height', elem.clientHeight);
    setBarHeight(elem.clientHeight+2);
  }*/




	return (
		<Fragment>
      {activeModal && renderModal()}
      <Row className={'m-0 p-0 pb-2'}>
        <Col className='col-9 p-0'>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronLeft} onClick={handleCancelButton}/>
          <h2 id='assignmentTitle' className="inline-header">{assignment.title}</h2>
        </Col>
        <Col className={'col-3 text-right'}>
          <Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>
        </Col>
      </Row>

			<form className='d-flex flex-column h-100'>
        <div ref={topZone} className='top-zone w-100 mt-3 mb-3' style={{'flexBasis':topZonePercent+'%'}} >
          <RubricPanel
            rubricRanks={assignment.toolAssignmentData.rubricRanks}
            rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
            isEditMode={false}
            isLimitedEditing={false}
          />
        </div>
        <div ref={handle} className='handle text-center p-2' onMouseMove={handleResizing} >
          ===
        </div>
        <div className='bottom-zone d-flex flex-row'>
          <div className={`d-flex flex-column text-editor no-bar`}>
            <EditorToolbar />
            <ReactQuill
              ref={reactQuillRef}
              className='h-100'
              theme="snow"
              readOnly={false}
              defaultValue={combinedDraftAndCommentsContent}
              onChange={() => {}}
              onChangeSelection={onSelectionChanged}
              placeholder={"Write something awesome..."}
              modules={modules}
              formats={formats}
              // style={{height: `calc(100% - ${barHeight}px`}}
            />
          </div>
          <CommentsPanel
            style={{'height': 100 - topZonePercent+'vh'}}
            className='h-auto'
            assessorId={activeUser.id}
            toolAssignmentData={assignment.toolAssignmentData}
            toolHomeworkData={toolHomeworkData}
            onAddComment={onAddComment}
          />
        </div>
			</form>



      <Row>
        <Col className='text-right mr-4'>
          <Button onClick={() => setActiveModal({type:MODAL_TYPES.warningBeforeHomeworkSubmission})}>Submit</Button>
        </Col>
      </Row>
		</Fragment>
	)
}

export default PeerHomeworkAssessor;