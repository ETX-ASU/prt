import React, {Fragment} from "react";
import {Col, Row} from "react-bootstrap";
import styles from "./BasicAssignmentSettings.module.scss";

function BasicAssignmentSettings(props) {
	const {isLimitedEditing, formData, setFormData} = props;

	return (
		<Fragment>
			<Row className={styles.row}>
				<Col className={styles.column}>
					<h2>Assignment Details</h2>
				</Col>
			</Row>

			<Row className={styles.row}>
				<Col className={styles.column}>
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

		</Fragment>
	)
}

export default BasicAssignmentSettings;
