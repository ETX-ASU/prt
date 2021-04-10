import React, {Fragment, useEffect, useState} from 'react';
import {Tabs, Tab, Button, Col, Container, Row, Nav, NavItem, NavLink} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft, faChevronRight, faPlus, faTrash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
library.add(faPlus, faTrash, faChevronLeft, faChevronRight);


function CommentsPanel(props) {
  const {assessorId, toolHomeworkData, onAddComment} = props;
  // const editor = (quillRef?.current?.editor) ? quillRef.current.editor : null;
  const [assessorComments, setAssessorComments] = useState([]);
  const [commentIndex, setCommentIndex] = useState(0);

  useEffect(() => {
    if (assessorId) setAssessorComments(toolHomeworkData.commentsOnDraft.filter(c => c.reviewerId === assessorId));
  }, [])

  function onNextBtn() {
    (commentIndex === assessorComments.length-1) ? setCommentIndex(0) : setCommentIndex(commentIndex+1);
  }

  function onPrevBtn() {
    (commentIndex === 0) ? setCommentIndex(assessorComments.length-1) : setCommentIndex(commentIndex-1);
  }


  function onDeleteComment() {
    console.log('delete comment');
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
          <h3>Comment #{commentIndex}</h3>
        </Col>
        <Col className='p-0 m-0 text-right'>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronLeft} onClick={onPrevBtn}/>
          <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronRight} onClick={onNextBtn}/>
        </Col>
      </Row>
      <Row className='criterion-content m-0 p-2'>
        <Col className='p-0 m-0'>
          {/*{shownRanks.map((rank, rNum) =>*/}
          {/*  <p key={rNum}><strong>{rank.name}: </strong>{shownCriteria[critIndex].rankSummaries[rNum]}</p>*/}
          {/*)}*/}
        </Col>
      </Row>
    </Container>
  )
}

export default CommentsPanel;