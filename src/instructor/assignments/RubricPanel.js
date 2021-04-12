import React, {Fragment, useEffect, useState} from 'react';
import {Tabs, Tab, Button, Col, Container, Row, Nav, NavItem, NavLink} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faCopy, faEye, faPlus, faTrash, faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
library.add(faPlus, faEyeSlash);

const MAX_NUM_CRITERIA = 10;
const MIN_NUM_ACTIVE_CRITERIA = 1;

function RubricPanel(props) {
  const {rubricCriteria, rubricRanks, isReviewerMode} = props;
  // Note: In instructor/edit mode, ALL criteria and ranks are shown even when they are marked to be hidden from students
  const shownCriteria = (props.isEditMode) ? deepCopy(rubricCriteria) : rubricCriteria.filter(c => c.isVisible).sort((a,b) => a.orderNum - b.orderNum);;
  const shownRanks = (props.isEditMode) ? deepCopy(rubricRanks) : rubricRanks.filter(r => r.isVisible).sort((a,b) => a.orderNum - b.orderNum);
  const [curTabId, setCurTabId] = useState(shownCriteria[0].id);


  function onToggleVisibility() {
    const curCrit = shownCriteria.find(c => c.id === curTabId);
    props.onCriterionPropChanged(curCrit, 'isVisible', !curCrit.isVisible);
  }

  function onCopy() {
    const alteredCriteria = deepCopy(shownCriteria);
    const index = alteredCriteria.findIndex(c => c.id === curTabId);
    const dupedCriterion = deepCopy(alteredCriteria[index]);
    dupedCriterion.id = uuid();
    dupedCriterion.name += ' Copy';
    alteredCriteria.splice(index+1, 0, dupedCriterion);
    props.onRubricCriteriaChanged(alteredCriteria);
    setCurTabId(dupedCriterion.id);
  }

  function onDelete() {
    const alteredCriteria = deepCopy(shownCriteria);
    const index = alteredCriteria.findIndex(c => c.id === curTabId);
    const nextId = (index) ? alteredCriteria[index-1].id : alteredCriteria[index+1].id;

    const replaceVisibility = (alteredCriteria[index].isVisible && shownCriteria.filter(c => c.isVisible).length <= MIN_NUM_ACTIVE_CRITERIA);
    alteredCriteria.splice(index, 1);

    if (replaceVisibility) alteredCriteria.find(c => !c.isVisible).isVisible = true;
    props.onRubricCriteriaChanged(alteredCriteria);
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
    return (crit.isVisible && totalVisible <= MIN_NUM_ACTIVE_CRITERIA);
  }

  function getWeightPercentage(crit) {
    if (!crit.isVisible) return 0;
    const trueShownCriteria = shownCriteria.filter(c => c.isVisible);
    return Math.round(100 * crit.weight/trueShownCriteria.reduce((acc, c) => acc + c.weight, 0));
  }

  return (
    <Fragment>
      <Row className='h-100 w-100 m-0'>
        <Tab.Container activeKey={curTabId} onSelect={(k) => setCurTabId(k)} id="criterion-tab" transition={false}>
          <Nav>
            {shownCriteria.map(crit =>
              <NavItem key={crit.id}>
                {crit.isVisible && <NavLink key={crit.id} eventKey={crit.id} className='hidden-criterion'><span className='tab-percent'>{getWeightPercentage(crit)}%</span> | {crit.name}</NavLink>}
                {!crit.isVisible && <NavLink key={crit.id} eventKey={crit.id}><FontAwesomeIcon className='tab-icon ml-1 mr-1' icon={faEyeSlash} /> | {crit.name}</NavLink>}
              </NavItem>)
            }
          </Nav>
          <Tab.Content className='h-100'>
            {shownCriteria.map(criterion =>
            <Tab.Pane key={criterion.id} eventKey={criterion.id} title={criterion.name}
              className={`${!criterion.isVisible ? 'h-100 hidden-criterion' : 'h-100'}`}>
              <Container className={`p-2 rubrics-panel ${!criterion.isVisible ? 'hidden-criterion' : ''}`} >

                {props.isEditMode &&
                <Row className={'p-0 m-0'}>
                  <div className='criterion-name-label'>Name</div>
                  <div className='criterion-name m-1'>
                    <input type='text' value={criterion.name} size={12}
                      onChange={(e) => props.onCriterionPropChanged(criterion, 'name', e.target.value)}/>
                  </div>
                  <div className='grade-weight-label'>Grade Weight</div>
                  <div className='grade-weight m-1'>
                    <input type='number' min={0} max={100} value={criterion.weight}
                      onChange={(e) => props.onCriterionPropChanged(criterion, 'weight', parseInt(e.target.value))}/>
                  </div>
                  <span className='vl'/>
                  <Button
                    disabled={isVisibilityToggleDisabled(criterion)}
                    className='text-center xbg-dark p-0 criterion-settings-btn'
                    onClick={onToggleVisibility}>
                    <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={(criterion.isVisible) ? faEye : faEyeSlash}/>
                  </Button>
                  <Button
                    disabled={shownCriteria.length >= MAX_NUM_CRITERIA}
                    className='text-center xbg-dark p-0 criterion-settings-btn'
                    onClick={onCopy}>
                    <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={faCopy}/>
                  </Button>
                  <Button
                    disabled={shownCriteria.length <= 1}
                    className='text-center xbg-dark p-0 criterion-settings-btn'
                    onClick={onDelete}>
                    <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={faTrash}/>
                  </Button>
                </Row>}

                <Row className='w-100 pt-1 m-0 ranks-row' >
                  {shownRanks.map((rank, rNum) =>
                      (rank.isVisible || props.isEditMode) &&
                      <Col key={rNum} className={`rank-col p-0 ${rNum === props.activeDraggedRankIndex ? 'dragged-rank-match' : ''}`}>
                        <div className={`rank-summary w-100 bg-white ${!rank.isVisible ? 'mark-as-hidden' : ''}`}>
                          <div className='hidden-marker'>
                            <FontAwesomeIcon className='hidden-indicator' icon={faEyeSlash} />
                          </div>
                          <div className='rank-title w-100 pt-2 pb-1 pl-2 pr-2'>{rank.name}</div>
                          {props.isEditMode &&
                            <textarea
                              className='rank-text pt-1 pb-2 pl-2 pr-2 d-inline-block'
                              value={criterion.rankSummaries[rNum]}
                              onChange={e => onSummaryChange(e, criterion, rNum)} />
                          }
                          {!props.isEditMode &&
                            <textarea
                              readOnly={true}
                              value={criterion.rankSummaries[rNum]}
                              className='rank-text pt-1 pb-2 pl-2 pr-2 d-inline-block' />
                          }
                        </div>
                      </Col>
                  )}
                </Row>
              </Container>
            </Tab.Pane>)
            }
          </Tab.Content>
        </Tab.Container>

        {props.isEditMode &&
        <Button disabled={props.isLimitedEditing || shownCriteria.length >= MAX_NUM_CRITERIA}
            className='add-criterion-btn rounded-circle xbg-dark p-0 m-0'
            style={{width:'24px', height:'24px'}}
            onClick={onAddCriterionBtn}>
          <FontAwesomeIcon className='btn-icon mr-0' icon={faPlus} />
        </Button>
        }

      </Row>
    </Fragment>
  )
}

export default RubricPanel;