import React, {Fragment, useEffect, useState, useRef} from 'react';
import {Tabs, Tab, Button, Col, Container, Row, Nav, NavItem, NavLink} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft, faChevronRight, faPlus, faTrash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
library.add(faPlus, faTrash, faChevronLeft, faChevronRight);


function CommentsPanel(props) {
  const {criteria, setActiveCommentId, onAddComment, onDeleteComment, activeCommentId, updateComment, comments} = props;
  const visCriteria = criteria.filter(c => c.isVisible);
  // const editor = (quillRef?.current?.editor) ? quillRef.current.editor : null;
  const commentTextArea = useRef(null);
  const [activeComment, setActiveComment] = useState(comments.find(c => c.id === activeCommentId));



  // console.log("active comment is now: ", activeComment?.content);


  // const [commentIndex, setCommentIndex] = useState(0);
  // const activeComment = comments.find(c => c.id === activeCommentId);
  const [commentText, setCommentText] = useState('');
  const [prevCommentsLength, setPrevCommentsLength] = useState(comments.length);

  useEffect(() => {
    if (!activeCommentId) return;
    const theComment = comments.find(c => c.id === activeCommentId);
    if (!theComment) return;
    setActiveComment(theComment);
    setCommentText(theComment.content);
  }, [activeCommentId, comments])


  useEffect(() => {
    setTimeout(() => {
      if (commentTextArea.current) commentTextArea.current.focus();
      console.log("FOCUS SET");
    }, 100)
    // commentTextArea.createTextRange();
    // commentTextArea.setSelectionRange(commentTextArea.selectionEnd, commentTextArea.selectionEnd);
    // console.log("LENGTH: ", commentTextArea?.current, comments.length, prevCommentsLength);
    // if (commentTextArea?.current && comments.length > prevCommentsLength) {
    //   commentTextArea.current.focus();
    //   console.log("FOCUS SET");
    //   setPrevCommentsLength(comments.length);
    // }
  }, [comments.length])


  function onNavBtn(isFwd) {
    if (comments.length <= 1) return;
    const tempComments = [...comments];
    tempComments.sort((a,b) => (a.index === b.index)
      ? a.tagNum - b.tagNum
      : a.index - b.index);
    const index = tempComments.findIndex(c => c.id === activeCommentId);
    if (isFwd) {
      (index === tempComments.length - 1)
        ? setActiveCommentId(tempComments[0].id)
        : setActiveCommentId(tempComments[index + 1].id);
    } else {
      (index === 0)
        ? setActiveCommentId(tempComments[tempComments.length-1].id)
        : setActiveCommentId(tempComments[index-1].id);
    }
  }

  function onChange(e) {
    setCommentText(e.target.value);
  }

  function onBlur(e) {
    console.log("Blur-- updating comment", commentText);
    updateComment({...activeComment, content:commentText})
    // setActiveComment(null);
  }

  return (
    <Container className='comments-panel m-0 p-0'>
      <Row className='criterion-nav m-0 p-2'>
        <Col className='p-0 m-0'>
          <div className='comment-buttons'>
            <Button className='align-middle' onClick={() => onDeleteComment(activeCommentId)}>
              <FontAwesomeIcon className='btn-icon' icon={faTrash}/>
            </Button>
          </div>
          {activeCommentId && activeComment && <h4>Note #{activeComment.tagName}</h4>}
          {!activeCommentId && <h4>Notes</h4>}
        </Col>
        <Col className='col-2 p-0 m-0 text-right'>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronLeft} onClick={() => onNavBtn(false)}/>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronRight} onClick={() => onNavBtn(true)}/>
        </Col>
      </Row>
      <Row className='criterion-content m-0 p-2'>
        <Col className='p-0 m-0'>
          {/*<select*/}
          {/*  defaultValue={visCriteria[0].id}*/}
          {/*  onChange={() => console.log('changed association')}*/}
          {/*  className="form-control"*/}
          {/*  id="criterion-selector">*/}
          {/*  {visCriteria.map(c =>*/}
          {/*    <option key={c.id} value={c.id}>{c.name}</option>*/}
          {/*  )}*/}
          {/*</select>*/}
          <Button className='text-area-overlay-btn position-absolute w-100 h-50 mt-2 bg-warning' style={{display: !activeCommentId ? 'block' : 'none'}} onClick={onAddComment} />
          <textarea
            ref={commentTextArea}
            className='mt-2 form-control h-50'
            onBlur={onBlur}
            onChange={onChange}
            placeholder={activeCommentId ? '' : `Select a region in the document and click the [+] button to add a note.
              \nUse the navigation arrows [<][>] to navigate through your comments, or just click on the comment directly in the document to view and make edits to them.
              \nTo delete a comment, select it and click the trash icon.`}
            disabled={!activeCommentId}
            value={commentText}/>

          {/*<Button className='position-absolute w-100 h-50 mt-2 bg-warning' onClick={testAdd} />*/}


          {/*{shownRanks.map((rank, rNum) =>*/}
          {/*  <p key={rNum}><strong>{rank.name}: </strong>{shownCriteria[critIndex].rankSummaries[rNum]}</p>*/}
          {/*)}*/}
        </Col>
      </Row>
    </Container>
  )
}

export default CommentsPanel;