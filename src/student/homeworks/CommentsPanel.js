import React, {Fragment, useEffect, useState} from 'react';
import {Tabs, Tab, Button, Col, Container, Row, Nav, NavItem, NavLink} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft, faChevronRight, faPlus, faTrash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
library.add(faPlus, faTrash, faChevronLeft, faChevronRight);


function CommentsPanel(props) {
  const {assessorId, setActiveCommentId, onAddComment, activeCommentId, updateComment, comments} = props;
  // const editor = (quillRef?.current?.editor) ? quillRef.current.editor : null;
  const [activeComment, setActiveComment] = useState(comments.find(c => c.id === activeCommentId));



  // console.log("active comment is now: ", activeComment?.content);


  // const [commentIndex, setCommentIndex] = useState(0);
  // const activeComment = comments.find(c => c.id === activeCommentId);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!activeCommentId) return;
    const theComment = comments.find(c => c.id === activeCommentId);
    setActiveComment(theComment);
    setCommentText(theComment.content);
  }, [activeCommentId])


  function onNavBtn(isFwd) {
    if (comments.length <= 1) return;
    const tempComments = [...comments];
    tempComments.sort((a,b) => (a.location.index === b.location.index)
      ? a.tagNum - b.tagNum
      : a.location.index - b.location.index);
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


  function onDeleteComment() {
    console.log('delete comment');
  }


  function onChange(e) {
    setCommentText(e.target.value);
  }

  function onBlur(e) {
    console.log("Blur-- updating comment", commentText);
    updateComment({...activeComment, content:commentText})
  }

  return (
    <Container className='comments-panel m-0 p-0'>
      <Row className='criterion-nav m-0 p-2'>
        <Col className='p-0 m-0'>
          <div className='comment-buttons'>
            <Button className='align-middle' onClick={onAddComment}>
              <FontAwesomeIcon className='btn-icon' icon={faPlus}/>
            </Button>
            <Button className='align-middle' onClick={onDeleteComment}>
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
          {activeCommentId && activeComment &&
            <textarea
              className='mt-2 form-control'
              placeholder={`Add note #${activeComment.tagName} here`}
              onBlur={onBlur}
              onChange={onChange}
              value={commentText}/>
          }
          {!activeCommentId &&
            <textarea
              className='mt-2 form-control'
              placeholder={`Select a region in the document and click the [+] button to add a note. 
              \nUse the navigation arrows [<][>] to navigate through your comments, or just click on the comment directly in the document to view and make edits to them. 
              \nTo delete a comment, select it and click the trash icon.`}
              disabled={true}
            />
          }
          {/*{shownRanks.map((rank, rNum) =>*/}
          {/*  <p key={rNum}><strong>{rank.name}: </strong>{shownCriteria[critIndex].rankSummaries[rNum]}</p>*/}
          {/*)}*/}
        </Col>
      </Row>
    </Container>
  )
}

export default CommentsPanel;