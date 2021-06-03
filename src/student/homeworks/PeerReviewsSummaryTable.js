import React from "react";
import {PEER_REVIEW_BTN_LABELS} from "../../app/constants";
import PeerReviewSummaryRow from "./PeerReviewSummaryRow";
import LoadingIndicator from "../../app/components/LoadingIndicator";


// TODO: Allocation Change 15
function PeerReviewsSummaryTable(props) {
	const {reviewsByUser, draftsToBeReviewedByUser, roundNum, allocationMsg, onReviewPeerDraft} = props;

	if (allocationMsg) return (<div className={'m-3'}>{allocationMsg}</div>);
	if (!draftsToBeReviewedByUser) return (<LoadingIndicator loadingMsg={'LOADING PEER REVIEW DRAFT ASSIGNMENTS'} size={3} />);

	const draftName = ['1st', '2nd', '3rd', '4th', '5th'][roundNum] + ' Draft';

	let enhancedDraftsToBeReviewed = draftsToBeReviewedByUser.map((d,i) => {
		const review = reviewsByUser.find(r => r.homeworkId === d.id);
		let btnLabel = (review.submittedOnDate) ? PEER_REVIEW_BTN_LABELS.Submitted :
			(review.beganOnDate) ? PEER_REVIEW_BTN_LABELS.InProgress : PEER_REVIEW_BTN_LABELS.NotBegun;

		const total = review.comments.reduce((acc, c) => {
			acc += (c?.commentRating !== -1) ? c.commentRating + 1 : 0;
			return acc;
		}, 0);

		const numRatedComments = review.comments.reduce((acc, c) => {
			acc += (c?.commentRating !== -1) ? 1 : 0;
			return acc;
		}, 0);

		let ratingMsg = (!review.submittedOnDate)
			? `assessment not submitted`
			: `${numRatedComments} of ${review.comments.length} comments rated.`;
		let average = total/(.05 * numRatedComments);
		if (numRatedComments) ratingMsg += ` (${(Math.round(average)/20).toFixed(2)} Avg.)`;
		return ({
			key: d.id,
			versionName: draftName,
			feedbackRating: ratingMsg,
			btnLabel,
			review
		})
	});

	enhancedDraftsToBeReviewed.sort((a,b) => b.review.submittedOnDate - a.review.submittedOnDate);


	return (
		<table className="table student-assignment-reviews">
			<thead className='border-top-0'>
			<tr className='review-table-row'>
				<th scope="col" className='border-top-0'/>
				<th scope="col" className='border-top-0'>Version</th>
				<th scope="col" className='border-top-0 text-left'>Title</th>
				<th scope="col" className='border-top-0'>Feedback on Comments</th>
				<th scope="col" className='border-top-0'/>
			</tr>
			</thead>
			<tbody>
			{enhancedDraftsToBeReviewed.map((draftData, rNum) => (
				<PeerReviewSummaryRow key={draftData.key} draftData={draftData} rowNum={rNum} onReviewPeerDraft={onReviewPeerDraft}/>
			))}
			</tbody>
		</table>
	)
}

export default PeerReviewsSummaryTable;