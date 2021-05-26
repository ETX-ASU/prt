import React, {Fragment, useState} from 'react';
import {Button, Col, Container, Row} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faChevronLeft, faChevronRight, faPlus, faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
library.add(faPlus, faEyeSlash, faChevronLeft, faChevronRight);


function WritersRubricViewer(props) {
  const {rubricCriteria, rubricRanks} = props;
  // Note: In instructor/edit mode, ALL criteria and ranks are shown even when they are marked to be hidden from students
  const shownCriteria = (props.isEditMode) ? deepCopy(rubricCriteria) : rubricCriteria.filter(c => c.isVisible).sort((a,b) => a.orderNum - b.orderNum);;
  const shownRanks = (props.isEditMode) ? deepCopy(rubricRanks) : rubricRanks.filter(r => r.isVisible).sort((a,b) => a.orderNum - b.orderNum);
  const [critIndex, setCritIndex] = useState(0);

  function onNextBtn() {
    (critIndex === shownCriteria.length-1) ? setCritIndex(0) : setCritIndex(critIndex+1);
  }

  function onPrevBtn() {
    (critIndex === 0) ? setCritIndex(shownCriteria.length-1) : setCritIndex(critIndex-1);
  }

  return (
    <Container className='rubric-viewer-panel m-0 p-0'>
      <Row className='criterion-nav m-0 p-2'>
        <Col className='p-0 m-0 mb-2 col-8'>
          <h3>{critIndex+1} of {shownCriteria.length}: {shownCriteria[critIndex].name}</h3>
        </Col>
        <Col className='p-0 m-0 mb-2 text-right'>
          <Button className='d-inline mr-1 btn-sm btn-primary' onClick={onPrevBtn}><FontAwesomeIcon icon={faChevronLeft} /></Button>
          <Button className='d-inline btn-sm btn-primary' onClick={onNextBtn}><FontAwesomeIcon icon={faChevronRight} /></Button>
        </Col>
      </Row>
      <Row className='criterion-content m-0 p-2'>
        <Col className='p-0 m-0'>
          {shownRanks.map((rank, rNum) =>
            <Fragment key={rNum}><h4 className={'criterion-name'}>{rank.name}: </h4>{shownCriteria[critIndex].rankSummaries[rNum]}</Fragment>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default WritersRubricViewer;