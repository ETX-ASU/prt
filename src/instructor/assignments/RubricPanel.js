import React, {Fragment, useEffect, useState} from 'react';
import {Tabs, Tab, Button, Col, Container, Row} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faCopy, faEye, faPlus, faTrash, faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
library.add(faPlus, faEyeSlash);

const MAX_NUM_CRITERIA = 10;

function RubricPanel(props) {
  const {rubric} = props;
  // Note: In instructor/edit mode, ALL criteria and ranks are shown even when they are marked to be hidden from students
  const shownCriteria = (props.isEditMode) ? deepCopy(rubric.criteria) : rubric.criteria.filter(c => c.isVisible).sort((a,b) => a.orderNum - b.orderNum);;
  const shownRanks = (props.isEditMode) ? deepCopy(rubric.ranks) : rubric.ranks.filter(r => r.isVisible).sort((a,b) => a.orderNum - b.orderNum);
  const [curTabId, setCurTabId] = useState(shownCriteria[0].id);

  function onToggleVisibility() {
    const curCrit = shownCriteria.find(c => c.id === curTabId);
    console.log(`criterion ${curCrit.name}`)
    props.onCriterionPropChanged(curCrit, 'isVisible', !curCrit.isVisible);
  }

  function onCopy() {
    console.log("copy");
    const alteredCriteria = deepCopy(shownCriteria);
    const index = alteredCriteria.findIndex(c => c.id === curTabId);
    const dupedCriterion = deepCopy(alteredCriteria[index]);
    dupedCriterion.id = uuid();
    dupedCriterion.name += ' Copy';
    alteredCriteria.splice(index+1, 0, dupedCriterion);
    props.onRubricChanged({...rubric, criteria:alteredCriteria});
    setCurTabId(dupedCriterion.id);
  }

  function onDelete(cNum) {
    const alteredCriteria = deepCopy(shownCriteria);
    const index = alteredCriteria.findIndex(c => c.id === curTabId);
    const nextId = (index) ? alteredCriteria[index-1].id : alteredCriteria[index+1].id;
    alteredCriteria.splice(index, 1);
    props.onRubricChanged({...rubric, criteria:alteredCriteria});
    setCurTabId(nextId);
  }

  function onSummaryChange(e, criterion, rNum) {
    const alteredSummaries = [...criterion.rankSummaries];
    alteredSummaries.splice(rNum, 1, e.target.value);
    props.onCriterionPropChanged(criterion, 'rankSummaries', alteredSummaries);
  }

  function onAddCriterionBtn() {
    const newCriterionId = props.onAddCriterion();
    setCurTabId(newCriterionId);
  }

  function isVisibilityToggleDisabled(crit) {
    const totalVisible = shownCriteria.filter(c => c.isVisible).length;
    console.log(`totalVisible`, totalVisible);
    return (crit.isVisible && totalVisible <= 1);
  }

  return (
    <Fragment>
      <Row>
        <Tabs activeKey={curTabId} onSelect={(k) => setCurTabId(k)} id="criterion-tab">
          {shownCriteria.map(criterion =>
            <Tab key={criterion.id} eventKey={criterion.id} title={criterion.name} >
              <Container className='xbg-light p-2 rubrics-panel'>
                <Row className={'p-0 m-0'}>
                  <div className='criterion-name-label'>Name</div>
                  <div className='criterion-name m-1'>
                    <input type='text' value={criterion.name} size={12}
                        onChange={(e) => props.onCriterionPropChanged(criterion, 'name', e.target.value)} />
                  </div>
                  <div className='grade-weight-label'>Grade Weight</div>
                  <div className='grade-weight m-1'>
                    <input type='number' min={0} max={100} value={criterion.weight} onChange={(e) => props.onCriterionPropChanged(criterion, 'weight', e.target.value)} />
                  </div>
                  <span className='vl' />
                  <Button
                      disabled={isVisibilityToggleDisabled(criterion)}
                      className='text-center xbg-dark p-0 criterion-settings-btn'
                      onClick={onToggleVisibility} >
                    <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={(criterion.isVisible) ? faEye : faEyeSlash} />
                  </Button>
                  <Button
                      disabled={shownCriteria.length >= MAX_NUM_CRITERIA}
                      className='text-center xbg-dark p-0 criterion-settings-btn'
                      onClick={onCopy} >
                    <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={faCopy} />
                  </Button>
                  <Button
                      disabled={shownCriteria.length <= 1}
                      className='text-center xbg-dark p-0 criterion-settings-btn'
                      onClick={onDelete} >
                    <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={faTrash} />
                  </Button>
                </Row>
                <Row className='w-100 pt-1 m-0 ranks-row' >
                  {shownRanks.map((rank, rNum) =>
                    (rank.isVisible) && <Col key={rNum} className='rank-col p-0'>
                      <div className='rank-summary w-100 bg-white'>
                        <div className='rank-title w-100 pt-2 pb-1 pl-2 pr-2'>{rank.name}</div>
                        <textarea
                            className='rank-text pt-1 pb-2 pl-2 pr-2 d-inline-block'
                            value={criterion.rankSummaries[rNum]}
                            onChange={e => onSummaryChange(e, criterion, rNum)} />
                      </div>
                    </Col>
                  )}
                </Row>
              </Container>
            </Tab>
          )}
        </Tabs>
        <Button disabled={props.isLimitedEditing || shownCriteria.length >= MAX_NUM_CRITERIA}
            className='add-criterion-btn rounded-circle xbg-dark p-0 m-0'
            style={{width:'24px', height:'24px'}}
            onClick={onAddCriterionBtn}>
          <FontAwesomeIcon className='btn-icon mr-0' icon={faPlus} />
        </Button>
      </Row>
    </Fragment>
  )
}

export default RubricPanel;