import React from "react";
import {PEER_REVIEW_BTN_LABELS} from "../../app/constants";
import PeerReviewSummaryRow from "./PeerReviewSummaryRow";
import LoadingIndicator from "../../app/components/LoadingIndicator";


function PeerReviewsSummaryTable(props) {
	const {draftsToBeReviewedByUser, activeUser, assignment, allocationMsg, onReviewPeerDraft} = props;
	const allocations = assignment.toolAssignmentData.allocations;

	if (!draftsToBeReviewedByUser && !assignment) return (<LoadingIndicator loadingMsg={'LOADING PEER REVIEW DRAFT ASSIGNMENTS'} size={3} />);
	if (allocationMsg) return (<div className={'m-3'}>{allocationMsg}</div>);

	const roundNum = assignment.toolAssignmentData.sequenceIds.length - 1;
	const draftName = ['1st', '2nd', '3rd', '4th', '5th'][roundNum] + ' Draft';

	let enhancedDraftsToBeReviewed = draftsToBeReviewedByUser.map((d,i) => {
		const allocation = allocations.find(a => a.assessorId === activeUser.id && a.homeworkId === d.id);
		let btnLabel = (allocation.submittedOnDate) ? PEER_REVIEW_BTN_LABELS.Submitted :
			(allocation.beganOnDate) ? PEER_REVIEW_BTN_LABELS.InProgress : PEER_REVIEW_BTN_LABELS.NotBegun;

		return ({
			key: d.id,
			versionName: draftName,
			feedbackRating: 'not available',
			btnLabel,
			allocation
		})
	});

	enhancedDraftsToBeReviewed.sort((a,b) => a.allocation.submittedOnDate - b.allocation.submittedOnDate);


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