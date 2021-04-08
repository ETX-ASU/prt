import React, {Fragment} from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import ToggleSwitch from "../../app/components/ToggleSwitch";


function BasicAssignmentSettings(props) {
	const {isLimitedEditing, formData, setFormData} = props;

	function toggleUseAutoScore() {
		setFormData({...formData, isUseAutoScore: !formData.isUseAutoScore, isUseAutoSubmit: false});
	}

	return (
		<Container className='mt-2 ml-2 mr-2 mb-4'>
			<Row className={'mt-4 mb-4'}>
				<Col><h2>Basic Assignment Details</h2></Col>
			</Row>

			<Row className={'ml-2'}>
				<Col className={'col-12'}>
					<div className={'form-group'}>
						<label htmlFor='dataTitle'><h3>Title</h3></label>
						<input id='dataTitle'
							className={'form-control'}
							onChange={e => setFormData({...formData, 'title': e.target.value})}
							defaultValue={formData.title}/>
					</div>
					<div className={'form-group'}>
						<label htmlFor='dataSummary'><h3>Summary<span className='aside'> - Optional</span></h3>
						</label>
						<textarea
							className={'form-control'}
							onChange={e => setFormData({...formData, 'summary': e.target.value})}
							defaultValue={formData.summary}/>
					</div>
				</Col>
			</Row>

			<Row className={'ml-2'}>
				<Col className='col-12'>
					<label><h3>Autoscore</h3></label>
					<div className="custom-control custom-switch d-inline-block" style={{top: `3px`}}>
						<ToggleSwitch id='dataUseAutoscore'
							small={true}
							value={formData.isUseAutoScore}
							handleToggle={toggleUseAutoScore}/>
					</div>
				</Col>
			</Row>

			{formData.isUseAutoScore &&
			<Row className={'ml-2'}>
				<Col>
					<p>
						<span className='mr-2'>
							<input type={'checkbox'}
								disabled={isLimitedEditing}
								onChange={e => setFormData({...formData, isUseAutoSubmit: e.target.checked})}
								checked={formData.isUseAutoSubmit}/>
						</span>
						Auto-submits this auto-score to your LMS as soon as the student submits their assignment.
					</p>
				</Col>
			</Row>
			}

		</Container>
	)
}

export default BasicAssignmentSettings;
