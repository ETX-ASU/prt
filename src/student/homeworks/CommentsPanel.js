import React, {useEffect, useState, useRef} from 'react';
import {Button, Col, Container, Row} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft, faChevronRight, faPlus, faTrash, faStar} from "@fortawesome/free-solid-svg-icons";
library.add(faPlus, faTrash, faChevronLeft, faChevronRight, faStar);


function CommentsPanel(props) {
  const {setActiveCommentId, onAddComment, onDeleteComment, onCommentsEdited, onCommentRated, activeCommentId, updateComment, comments,
    isReadOnly, isAbleToRateComments} = props;
  // const visCriteria = criteria.filter(c => c.isVisible);

  const commentTextArea = useRef(null);
  const [activeComment, setActiveComment] = useState(comments.find(c => c.id === activeCommentId));
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!activeCommentId) return;
    const theComment = comments.find(c => c.id === activeCommentId);
    if (!theComment) return;
    setActiveComment(theComment);
    setCommentText(theComment.content);
  }, [activeCommentId, comments])


  useEffect(() => {
    if (!activeCommentId) return;
    setTimeout(() => {
      if (commentTextArea.current && activeCommentId) commentTextArea.current.focus();
    }, 100)
  }, [comments.length, activeCommentId])


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
    if (!isReadOnly) {
      onCommentsEdited();
      setCommentText(e.target.value);
    }
  }

  function onBlur(e) {
    if (!isReadOnly) updateComment({...activeComment, content:commentText})
  }

  function onStarSelected(starNum) {
    const altComment = {...activeComment, commentRating:starNum};
    setActiveComment(altComment);
    onCommentRated(altComment);
  }

  const showPlus = !!props.showPlusButton && !activeCommentId && !isReadOnly;
  const placeholderText = (isReadOnly) ? `Select highlight to see comment notes.` : `Select a range of text to create a comment.`;

  return (
    <Container className='comments-panel m-0 p-0'>
      <Row className='criterion-nav m-0 p-2'>
        <Col className='p-0 m-0'>
          <div className='comment-buttons'>
            {!isReadOnly &&
            <Button className='align-middle' onClick={() => onDeleteComment(activeCommentId)}>
              <FontAwesomeIcon className='btn-icon' icon={faTrash}/>
            </Button>
            }
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
          {showPlus &&
            <Button className='text-area-overlay-btn position-absolute w-100 h-50 mt-2 bg-success' onClick={onAddComment}>
              <FontAwesomeIcon className='btn-icon' size="10x" icon={faPlus}/>
            </Button>
          }
          {/*<Button className='text-area-overlay-btn position-absolute w-100 h-50 mt-2 bg-warning' style={{display: !activeCommentId ? 'block' : 'none'}} onClick={onAddComment} />*/}
          <textarea
            ref={commentTextArea}
            // readOnly={isReadOnly}
            className={`mt-2 form-control h-50${isReadOnly ? ' read-only-mode' : ''}`}
            onBlur={onBlur}
            onChange={onChange}
            placeholder={(showPlus || activeCommentId) ? '' : placeholderText}
            disabled={!activeCommentId || isReadOnly}
            value={commentText}/>

          {/*<Button className='position-absolute w-100 h-50 mt-2 bg-warning' onClick={testAdd} />*/}
          {isAbleToRateComments && activeComment &&
          <div>
            <p className='rating-prompt text-right pt-2 float-right'><span className='mr-2'>How helpful was this feedback?</span>
              {[5,4,3,2,1].map(starNum =>
                <a key={starNum} className={`d-inline star${(activeComment.commentRating >= starNum) ? ' active' : ''}`} onClick={() => onStarSelected(starNum)}>
                  <FontAwesomeIcon className='btn-icon' size="1x" icon={faStar}/>
                </a>
              )}
            </p>
          </div>}

          {/*{shownRanks.map((rank, rNum) =>*/}
          {/*  <p key={rNum}><strong>{rank.name}: </strong>{shownCriteria[critIndex].rankSummaries[rNum]}</p>*/}
          {/*)}*/}
        </Col>
      </Row>
    </Container>
  )
}

export default CommentsPanel;