import React from 'react';
import {Container, Row, Col} from 'react-bootstrap';


function AssignmentListItem(props) {
	const assignment = props.assignment;

	return (
		<li className={`list-group-item review-link ${props.selected ? 'bg-warning' : ''}`} onClick={() => props.clickHandler(props.rowNum-1)}>
      <Container>
        <Row>
          <Col className='col-4 bg'>{assignment.title}</Col>
        </Row>
      </Container>
    </li>
	)
}

export default AssignmentListItem;
