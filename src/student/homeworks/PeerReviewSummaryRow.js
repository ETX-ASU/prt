import React from "react";
import IconPencil from "../../assets/icon-edit.svg";
import {Button} from "react-bootstrap";

function PeerReviewSummaryRow(props) {

	function handleReviewButton(e) {
		e.preventDefault();
		props.onReviewPeerDraft(props.draftData.review.homeworkId);
	}

	const {btnLabel, versionName, feedbackRating} = props.draftData;
	const targetName = String.fromCharCode(65 + props.rowNum);

	return (
		<tr className='review-table-row'>
			<td className='border-top-0'><img src={IconPencil} alt={''} className='inline-essay-icon' /></td>
			<td className='border-top-0'>{versionName}</td>
			<td className='border-top-0 text-left'>{`Review of Peer ${targetName}'s ${versionName}`}</td>
			<td className='border-top-0'>{feedbackRating}</td>
			<td className='border-top-0'>
				<Button className="btn badge-pill essay-btn btn-outline-secondary" onClick={handleReviewButton}>
					{btnLabel}
				</Button>
			</td>
		</tr>
	)
}

export default PeerReviewSummaryRow;