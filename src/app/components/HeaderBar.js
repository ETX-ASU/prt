import React from 'react';
import {Row, Col, Button} from 'react-bootstrap';

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";
library.add(faChevronLeft);


function HeaderBar(props) {
	return (
    <Row className={'screen-header-bar xbg-light p-0 pt-2 pb-2 m-0'}>
      <Col className={'col-7'}>
        <h1>
          {props.onBackClick &&
						<Button className='d-inline mr-2 btn-sm' onClick={props.onBackClick}><FontAwesomeIcon icon={faChevronLeft}/></Button>
          }
          {props.title}
        </h1>
      </Col>
      <Col className={'col-5 text-right my-auto'}>
        {props.children}
      </Col>
    </Row>
	)
}

export default HeaderBar;
