import React from 'react';
import classNames from "clsx";
import {Row, Col} from 'react-bootstrap';

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";
import styles from "./HeaderBar.module.scss";

library.add(faChevronLeft);

function HeaderBar(props) {
	return (
    <Row className={classNames(
      styles.header,
      props.withLogo && styles.withLogo, 
      props.smallTitle && styles.smallTitle
    )}>
      <Col className={'col-7'}>
        <h1>
          {props.onBackClick &&
            <FontAwesomeIcon className='btn-icon mr-2' icon={faChevronLeft} onClick={props.onBackClick}/>
          }
          {props.title}
        </h1>
      </Col>
      <Col className={'col-5 text-right'}>
        {props.children}
      </Col>
    </Row>
	)
}

export default HeaderBar;
