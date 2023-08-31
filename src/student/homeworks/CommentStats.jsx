import React, { useMemo } from 'react';
import { Row } from 'react-bootstrap';

/**
 * Gets comment count and average rating for review assessment
 * @param {App.Comment[]} comments
 * @returns {{numRatedComments: number; average: number}}
 */
function getAverageRating(comments) {
  const total = comments.reduce((acc, c) => {
    acc += c?.commentRating !== -1 ? c.commentRating + 1 : 0;
    return acc;
  }, 0);

  const numRatedComments = comments.reduce((acc, c) => {
    acc += c?.commentRating !== -1 ? 1 : 0;
    return acc;
  }, 0);

  const average = numRatedComments
    ? (Math.round(total / (0.05 * numRatedComments)) / 20).toFixed(2)
    : 'N/A';

  return { numRatedComments, average };
}

/**
 * @param {string} text
 * @returns number
 */
function getWordCount(text) {
  // eslint-disable-next-line no-control-regex
  let regexpBMPWord = /([\u0000-\u0019\u0021-\uFFFF])+/gu;
  return !text ? 0 : text.match(regexpBMPWord).length;
}

/**
 * Comment statistics for review assessment
 * @param {{comments: App.Comment[]}} props
 * @returns {React.ReactNode}
 */
export function CommentStats({ comments }) {
  const ratingStats = useMemo(() => getAverageRating(comments), [comments]);

  const wordCount = useMemo(
    () =>
      comments.reduce((acc, c) => {
        acc += getWordCount(c.content);
        return acc;
      }, 0),
    [comments],
  );

  const avgWordsPerComment = (wordCount / comments.length).toFixed(1);

  return (
    <>
      <Row className="criterion-nav m-0 p-2">
        <h3>Review Assessment Stats</h3>
      </Row>
      <div className="p-2 d-flex flex-column gap-1">
        <div>
          Comments: {comments.length} given. ({ratingStats.numRatedComments} rated.)
        </div>
        <div>Total comments word count: {wordCount}</div>
        <div>Average words per comment: {avgWordsPerComment}</div>
        <div>Average Comment Rating: {ratingStats.average}</div>
      </div>
    </>
  );
}
