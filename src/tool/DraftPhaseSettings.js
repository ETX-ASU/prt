import React from "react";
import {Col, Container, Row} from "react-bootstrap";


function DraftPhaseSettings(props) {
	const {formData, setFormData} = props;

	return (
		<Container className='mt-2 ml-2 mr-2 mb-4'>
			<Row className={'ml-2'}>
				<Col className={'col-12'}>
					<div className={'form-group'}>
						<label htmlFor='dataSummary'><h3>Draft Phase Specific Stuff<span className='aside'> - Optional</span></h3>
						</label>
						<textarea
							className={'form-control'}
							onChange={e => setFormData({...formData, 'summary': e.target.value})}
							defaultValue={formData.summary}/>
					</div>
				</Col>
			</Row>
		</Container>
	)
}

export default DraftPhaseSettings;
