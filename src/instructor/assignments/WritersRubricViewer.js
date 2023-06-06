import React, {Fragment, useState} from 'react';
import {Button, Col, Container, Row} from "react-bootstrap";
import {Tooltip} from "react-tippy";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faInfoCircle} from "@fortawesome/free-solid-svg-icons/faInfoCircle";
import {faChevronLeft, faChevronRight, faPlus, faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import 'react-tippy/dist/tippy.css'

library.add(faPlus, faEyeSlash, faChevronLeft, faChevronRight);

const RUBRIC_INFO_COPY = 'Use this rubric for your draft submission. This rubric will also be used for your peers to review your work and for you to review theirs. Make sure to check out all criteria pages.';

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
      <Row className='criterion-nav m-0 pt-2 px-2 text-center align-items-center'>
        <h3 className='w-100'>
          Rubric{' '}
          <Tooltip title={RUBRIC_INFO_COPY} arrow position="left">
            <FontAwesomeIcon icon={faInfoCircle} />
          </Tooltip>
        </h3>
      </Row>
      <Row className='criterion-nav m-0 px-2 pb-2 align-items-center'>
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
            <Fragment key={rNum}><h4 className='criterion-name'>{rank.name}: </h4>{shownCriteria[critIndex].rankSummaries[rNum]}</Fragment>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default WritersRubricViewer;
