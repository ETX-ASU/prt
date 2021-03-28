import React from "react";
import {Col, Container, Row} from "react-bootstrap";


function ReviewPhaseSettings(props) {
	const {formData, setFormData, formData:{toolAssignmentData}} = props;

	function updateAssignmentData(toolAssignmentData) {
		setFormData({...formData, toolAssignmentData});
	}

	return (
		<Container className='mt-2 ml-2 mr-2 mb-4'>
			<Row className={'ml-2'}>
				<Col className={'col-12'}>
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
								type='number'	min={2} max={20}
								style={{width: '60px'}}
								onChange={e => updateAssignmentData({...toolAssignmentData, minPeersBeforeAllocating: e.target.value})}
								defaultValue={toolAssignmentData.minPeersBeforeAllocating}/>
						</div>
					</div>
				</Col>
			</Row>
		</Container>
	)
}

export default ReviewPhaseSettings;
