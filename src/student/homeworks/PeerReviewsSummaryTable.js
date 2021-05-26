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
			(review.beganOnDate && review.comments.length && review.criterionRatings.length)
				? PEER_REVIEW_BTN_LABELS.InProgress : PEER_REVIEW_BTN_LABELS.NotBegun;

		return ({
			key: d.id,
			versionName: draftName,
			feedbackRating: 'not available',
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
				<th scope="col" className='border-top-0'>Feedback</th>
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