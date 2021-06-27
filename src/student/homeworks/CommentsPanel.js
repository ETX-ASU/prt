import React, {useEffect, useState, useRef} from 'react';
import {Button, Col, Container, Row} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft, faChevronRight, faPlus, faTrash, faStar} from "@fortawesome/free-solid-svg-icons";
library.add(faPlus, faTrash, faChevronLeft, faChevronRight, faStar);


function CommentsPanel(props) {
  const {isAssessmentOfReview, setActiveCommentId, onAddComment, onDeleteComment, onCommentsEdited, onCommentRated, activeCommentId, updateComment, comments,
    isReadOnly, isAbleToRateComments, isAbleToSeeRatings} = props;
  // const visCriteria = criteria.filter(c => c.isVisible);

  const commentTextArea = useRef(null);
  const [activeComment, setActiveComment] = useState(comments.find(c => c.id === activeCommentId));
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!activeCommentId) {
      setCommentText('');
      return;
    }
    const theComment = comments.find(c => c.id === activeCommentId);
    setActiveComment(theComment);
    setCommentText(theComment.content);
  }, [activeCommentId, comments])


  useEffect(() => {
    if (!activeCommentId) return;
    setTimeout(() => {
      if (commentTextArea.current && activeCommentId) commentTextArea.current.focus();
    }, 100)
  }, [activeCommentId])


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

  function getWordCount(text) {
    let regexpBMPWord = /([\u0000-\u0019\u0021-\uFFFF])+/gu;
    return (!text) ? 0 : text.match(regexpBMPWord).length
  }

  function getAverageRating(comments) {
    const total = comments.reduce((acc, c) => {
      acc += (c?.commentRating !== -1) ? c.commentRating + 1 : 0;
      return acc;
    }, 0);

    const numRatedComments = comments.reduce((acc, c) => {
      acc += (c?.commentRating !== -1) ? 1 : 0;
      return acc;
    }, 0);

    let average = (numRatedComments) ? (Math.round(total/(.05 * numRatedComments))/20).toFixed(2) : 'N/A';
    return({numRatedComments, average});
  }

  const showPlus = !!props.showPlusButton && !activeCommentId && !isReadOnly;
  const placeholderText = (isReadOnly) ? `Select highlight to see comment notes.` : `Select a range of text to create a comment.`;
  const ratingStats = getAverageRating(comments);
  const wordCount = comments.reduce((acc, c) => {
    acc += getWordCount(c.content);
    return acc;
  }, 0);
  const avgWordsPerComment = (wordCount/comments.length).toFixed(1);

  return (
    <Container className='comments-panel m-0 p-0'>
      <Row className='criterion-nav m-0 p-2'>
        <Col className='p-0 m-0'>
          <div className='comment-buttons'>
            {!isReadOnly &&
            <Button className='align-middle' disabled={!activeCommentId} onClick={() => onDeleteComment(activeCommentId)}>
              <FontAwesomeIcon className='btn-icon' icon={faTrash}/>
            </Button>
            }
          </div>
          {activeCommentId && <h4>Note #{activeComment?.tagName}</h4>}
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
              <p className='text-white text-center'>click to add comment</p>
            </Button>
          }
          {isAssessmentOfReview &&
            <div>
              <h3>Review Assessment Stats:</h3>
              <p>Comments: {comments.length} given. ({ratingStats.numRatedComments} rated.)</p>
              <p>Total comments word count: {wordCount}</p>
              <p>Average words per comment: {avgWordsPerComment}</p>
              <p>Average Comment Rating: {ratingStats.average}</p>
            </div>
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
          {/*{!!activeCommentId && !isReadOnly &&*/}
          {/*  <Button className='bt-sm mt-2 bg-success'>Save</Button>*/}
          {/*}*/}
          {Boolean(isAbleToRateComments || isAbleToSeeRatings) && Boolean(activeComment) &&
          <div>
            <p className='rating-prompt text-right pt-2 float-right'><span className='mr-2'>How helpful was this feedback?</span>
              {isAbleToRateComments && [4,3,2,1,0].map(starNum =>
                <span key={starNum} className={`d-inline star${(activeComment.commentRating >= starNum) ? ' active' : ''}`} onClick={() => onStarSelected(starNum)}>
                  <FontAwesomeIcon className='btn-icon' size="1x" icon={faStar}/>
                </span>
              )}
              {!isAbleToRateComments && isAbleToSeeRatings && [4,3,2,1,0].map(starNum =>
                <span key={starNum} className={`d-inline locked star${(activeComment.commentRating >= starNum) ? ' active' : ''}`}>
                  <FontAwesomeIcon className='btn-icon' size="1x" icon={faStar}/>
                </span>
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