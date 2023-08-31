import React, { useEffect, useState } from 'react';
import { Button, Container, Row } from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronLeft, faChevronRight, faPlus, faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import { CommentStats } from './CommentStats';
import { CommentRating } from './CommentRating';

library.add(faPlus, faTrash, faChevronLeft, faChevronRight, faStar);

/**
 * Comment panel component
 * @param {{
 *    activeCommentId?: string;
 *    comments: App.Comment[];
 *    generalCommentId: string;
 *    isAbleToRateComments: boolean;
 *    isAbleToSeeRatings: boolean;
 *    isAssessmentOfReview: boolean;
 *    isReadOnly: boolean;
 *    newCommentRange: {index: number; length: number};
 *    onChangeCommentId(id: string): void;
 *    onAddComment(isGeneral: boolean): void;
 *    onChange(newComments: Comment[]): void;
 * }} props
 * @returns {ReactElement}
 */
export function CommentsPanel({
  activeCommentId,
  comments,
  generalCommentId,
  isAbleToRateComments,
  isAbleToSeeRatings,
  isAssessmentOfReview,
  isReadOnly,
  newCommentRange,
  onAddComment,
  onChange,
  onChangeCommentId,
}) {
  const [generalComment, setGeneralComment] = useState(comments.find((c) => c.id === generalCommentId));
  const [notes, setNotes] = useState(comments.filter((c) => c.id !== generalCommentId));
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);

  const updateNoteIndex = () => {
    setActiveNoteIndex(comments.filter((c) => c.id !== generalCommentId).findIndex((c) => c.id === activeCommentId));
  };

  useEffect(() => {
    setGeneralComment(comments.find((c) => c.id === generalCommentId));

    const newNotes = comments.filter((c) => c.id !== generalCommentId);
    setNotes(newNotes);
    // eslint-disable-next-line
  }, [comments]);

  useEffect(() => {
    updateNoteIndex();
    // eslint-disable-next-line
  }, [activeCommentId]);

  useEffect(() => {
    setActiveNoteIndex(-1);
    // eslint-disable-next-line
  }, [newCommentRange]);

  const handleGeneralCommentChange = (ev) => {
    setGeneralComment({ ...generalComment, content: ev.currentTarget.value });
  };

  const handleNoteChange = (ev) => {
    const newNotes = notes.slice();
    newNotes[activeNoteIndex].content = ev.currentTarget.value;

    setNotes(newNotes);
  };

  const handleNavClick = (offset) => () => {
    onChangeCommentId(notes[activeNoteIndex + offset]?.id);
  };

  const handleStartGeneralCommentClick = (ev) => {
    ev.preventDefault();
    onAddComment(true);
  };

  const handleNewCommentClick = (ev) => {
    ev.preventDefault();
    onAddComment();
  };

  const handleBlur = () => {
    onChange([generalComment, ...notes].filter(Boolean));
  };

  const handleDeleteNote = () => {
    const newNotes = notes.filter((_, i) => i !== activeNoteIndex);
    setActiveNoteIndex(-1);
    setNotes(newNotes);
    onChange([generalComment, ...newNotes].filter(Boolean));
  };

  const handleDeleteGeneralNote = () => {
    const newNotes = comments.filter((c) => c.id !== generalCommentId);
    onChange(newNotes);
    setNotes(newNotes);
  };

  const handleCommentRated = (commentId) => (newRating) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    comment.commentRating = newRating;
    onChange(comments);
  };

  const activeNote = activeNoteIndex !== -1 ? notes[activeNoteIndex] : null;

  return (
    <Container className="comments-panel m-0 p-0 d-flex flex-column">
      {isAssessmentOfReview && <CommentStats comments={comments} />}
      <Row className="criterion-nav m-0 p-2 d-flex align-items-center">
        <Button className="m-0 py-0 px-3" disabled={!generalComment || isReadOnly} onClick={handleDeleteGeneralNote}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
        <h3 className="d-inline flex-grow-1">General comment</h3>
      </Row>
      <div className="flex-grow-1 h-100 p-2">
        {generalComment ? (
          <textarea
            disabled={isReadOnly}
            className={`h-100 form-control${isReadOnly ? ' read-only-mode' : ''}`}
            value={generalComment ? generalComment.content : ''}
            onBlur={handleBlur}
            onChange={handleGeneralCommentChange}
          />
        ) : (
          <div className="d-flex h-100 align-items-center justify-content-center">
            <span>
              Click{' '}
              <a href="/" onClick={handleStartGeneralCommentClick}>
                here
              </a>{' '}
              to add a general comment.
            </span>
          </div>
        )}
      </div>
      {Boolean(generalComment) && (isAbleToRateComments || isAbleToSeeRatings) && (
        <CommentRating
          disabled={!isAbleToRateComments}
          rating={generalComment.commentRating}
          onChange={handleCommentRated(generalCommentId)}
        />
      )}
      <Row className="criterion-nav m-0 p-2 d-flex align-items-center gap-2">
        <Button className="m-0 py-0 px-3" disabled={!activeNote || isReadOnly} onClick={handleDeleteNote}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
        <h3 className="d-inline flex-grow-1">{activeNote ? 'Notes' : `Note #${activeNoteIndex + 1}`}</h3>
        <div>
          <Button className="m-0 mr-1 py-0 px-3" disabled={activeNoteIndex < 1} onClick={handleNavClick(-1)}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </Button>
          <Button className="m-0 py-0 px-3" disabled={activeNoteIndex >= notes.length - 1} onClick={handleNavClick(1)}>
            <FontAwesomeIcon icon={faChevronRight} />
          </Button>
        </div>
      </Row>
      <div className="flex-grow-1 h-100 p-2 d-flex align-items-center justify-content-center">
        {activeNote ? (
          <textarea
            disabled={isReadOnly}
            className={`h-100 form-control${isReadOnly ? ' read-only-mode' : ''}`}
            onBlur={handleBlur}
            value={activeNote?.content || ''}
            onChange={handleNoteChange}
          />
        ) : (
          <div className="d-flex h-100 align-items-center justify-content-center">
            {newCommentRange?.length && !isReadOnly ? (
              <span>
                Click{' '}
                <a href="/" onClick={handleNewCommentClick}>
                  here
                </a>{' '}
                to comment on selected fragment.
              </span>
            ) : (
              <span>
                {isReadOnly ? `Select highlight to see comment notes.` : `Select a range of text to create a comment.`}
              </span>
            )}
          </div>
        )}
      </div>
      {Boolean(activeNote) && (isAbleToRateComments || isAbleToSeeRatings) && (
        <CommentRating
          disabled={!isAbleToRateComments}
          rating={activeNote.commentRating}
          onChange={handleCommentRated(activeNote.id)}
        />
      )}
    </Container>
  );
}

/*
function CommentsPanel(props) {
  const {isAssessmentOfReview, setActiveCommentId, onAddComment, onDeleteComment, onCommentsEdited, onCommentRated,
    activeCommentId, updateComment, comments,
    isReadOnly, isAbleToRateComments, isAbleToSeeRatings, generalCommentId} = props;

  const commentTextArea = useRef(null);
  const [activeComment, setActiveComment] = useState(comments.find(c => c.id === activeCommentId));
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!activeCommentId) {
      setCommentText('');
      return;
    }
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
  }, [activeCommentId])


  function onNavBtn(isFwd) {
    if (comments.length < 1) return;
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
    if (!isReadOnly) {
      updateComment({...activeComment, content:commentText})
    }
  }

  function onStarSelected(starNum) {
    const altComment = {...activeComment, commentRating:starNum};
    setActiveComment(altComment);
    onCommentRated(altComment);
  }

  function getWordCount(text) {
    // eslint-disable-next-line no-control-regex
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
    <Container className='comments-panel m-0 p-0 d-flex flex-column'>
      <Row className='criterion-nav m-0 p-2 d-flex'>
        <div className={`flex-grow-1 p-0 m-0${isReadOnly ? ' pt-1' : ''}`}>
          {!isReadOnly &&
          <div className='comment-buttons'>
            <Button className='align-middle m-0 mr-2' onClick={() => onDeleteComment(generalCommentId)}>
              <FontAwesomeIcon className='btn-icon' icon={faTrash}/>
            </Button>
          </div>
          }
          <h3 className='align-middle d-inline'>General comment</h3>
        </div>
      </Row>
      <Row className='criterion-content m-0 p-2'>
        <Col className='p-0 m-0'>
          <textarea
            className={`mt-2 form-control h-50${isReadOnly ? ' read-only-mode' : ''}`}
            onBlur={onBlur}
            onChange={onChange}
            placeholder={(showPlus || activeCommentId) ? '' : placeholderText}
            disabled={!activeCommentId || isReadOnly}
            value={commentText}
          />
        </Col>
      </Row>
      <Row className='criterion-nav m-0 p-2 d-flex'>
        <div className={`flex-grow-1 p-0 m-0${isReadOnly ? ' pt-1' : ''}`}>
          {!isReadOnly &&
          <div className='comment-buttons'>
            <Button className='align-middle m-0 mr-2' disabled={!activeCommentId} onClick={() => onDeleteComment(activeCommentId)}>
              <FontAwesomeIcon className='btn-icon' icon={faTrash}/>
            </Button>
          </div>
          }
          {activeCommentId && <h3 className='align-middle d-inline'>{activeCommentId === generalCommentId ? 'General comment' : `Note #${activeComment?.tagName}`}</h3>}
          {!activeCommentId && <h3 className='align-middle d-inline'>Notes</h3>}
        </div>
        <div className='p-0 m-0 text-right align-middle'>
          <Button className='d-inline mr-1 btn-sm btn-primary' onClick={() => onNavBtn(false)}><FontAwesomeIcon icon={faChevronLeft} /></Button>
          <Button className='d-inline btn-sm btn-primary' onClick={() => onNavBtn(true)}><FontAwesomeIcon icon={faChevronRight} /></Button>
        </div>
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
          <textarea
            ref={commentTextArea}
            className={`mt-2 form-control h-50${isReadOnly ? ' read-only-mode' : ''}`}
            onBlur={onBlur}
            onChange={onChange}
            placeholder={(showPlus || activeCommentId) ? '' : placeholderText}
            disabled={!activeCommentId || isReadOnly}
            value={commentText}/>

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
        </Col>
      </Row>
    </Container>
  )
}

export default CommentsPanel;
*/
