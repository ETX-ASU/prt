import React from "react";
import {Col, Row} from "react-bootstrap";
import styles from './ReviewPhaseSettings.module.scss';


function ReviewPhaseSettings(props) {
	const {formData, setFormData, formData:{toolAssignmentData}} = props;

	function updateAssignmentData(toolAssignmentData) {
		setFormData({...formData, toolAssignmentData});
	}

	return (
		<Row className={styles.row}>
			<Col className={styles.column}>
				<div className={'form-group'}>
					<label htmlFor='dataReviewsPerPeer'><h3>Number of Reviews Per Peer</h3></label>
					<div className='rank-name m-1'>
						<input id={'dataReviewsPerPeer'}
							style={{width: '60px'}}
							type='number'	min={1} max={5}
							onChange={e => updateAssignmentData({...toolAssignmentData, minReviewsRequired: e.target.value})}
							defaultValue={toolAssignmentData.minReviewsRequired}/>
					</div>
				</div>
				<div className={'form-group'}>
					<label htmlFor='dataReviewsPerPeer'><h3>Minimum Peer Submissions Before Allocating Reviews</h3></label>
					<div className='rank-name m-1'>
						<input id={'dataMinPeersBeforeAllocating'}
							type='number'	min={2} max={10}
							style={{width: '60px'}}
							onChange={e => updateAssignmentData({...toolAssignmentData, minPeersBeforeAllocating: e.target.value})}
							defaultValue={toolAssignmentData.minPeersBeforeAllocating}/>
					</div>
				</div>
			</Col>
		</Row>
	)
}

export default ReviewPhaseSettings;
