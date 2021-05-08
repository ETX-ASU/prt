import React, {Fragment, useEffect, useState} from 'react';
import {Tabs, Tab, Button, Col, Container, Row, Nav, NavItem, NavLink} from "react-bootstrap";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faCopy, faEye, faPlus, faTrash, faEyeSlash, faCheck} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../app/utils/deepCopy";
import {v4 as uuid} from "uuid";
library.add(faPlus, faEyeSlash, faCheck);

const MAX_NUM_CRITERIA = 10;
const MIN_NUM_ACTIVE_CRITERIA = 1;

function RubricAssessorPanel(props) {
  const {rubricCriteria, rubricRanks, ratings} = props;

  const shownCriteria = rubricCriteria.filter(c => c.isVisible).sort((a,b) => a.orderNum - b.orderNum);
  const shownRanks = rubricRanks.filter(r => r.isVisible).sort((a,b) => a.orderNum - b.orderNum);
  const [curTabId, setCurTabId] = useState(shownCriteria[0].id);


  function getRatingNum(curCrit) {
    const qualityScore = ratings.find(qs => qs.criterionId === curCrit.id);
    return (qualityScore) ? qualityScore.ratingGiven : -1;
  }

  function onRankSelected(rNum) {
    const curCrit = shownCriteria.find(c => c.id === curTabId);
    console.log(`Set ${curCrit.label} rank selection to ${rNum}`)

    props.onRankSelected(curCrit, rNum);
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
      <Row className='h-100 w-100 m-0 pb-3'>
        <Tab.Container activeKey={curTabId} onSelect={(k) => setCurTabId(k)} id="criterion-tab" transition={false}>
          <Nav>
            {shownCriteria.map(crit =>
              <NavItem key={crit.id}>
                {crit.isVisible &&
                  <NavLink key={crit.id} eventKey={crit.id} className='hidden-criterion'>
                    {props.isShowCriteriaPercents &&
                      <Fragment><span className='tab-percent'>{getWeightPercentage(crit)}%</span> | {crit.name}</Fragment>
                    }
                    {!props.isShowCriteriaPercents && <Fragment>{crit.name}</Fragment>}
                    {(getRatingNum(crit) > -1) && <FontAwesomeIcon className='tab-icon ml-1 mr-0' icon={faCheck} />}
                  </NavLink>
                }
              </NavItem>)
            }
          </Nav>
          <Tab.Content className='h-100'>
            {shownCriteria.map(criterion =>
            <Tab.Pane key={criterion.id} eventKey={criterion.id} title={criterion.name}
              className={`${!criterion.isVisible ? 'h-100 hidden-criterion' : 'h-100'}`}>
              <Container className={`p-2 rubrics-panel ${!criterion.isVisible ? 'hidden-criterion' : ''}`} >
                <Row className='w-100 pt-1 m-0 ranks-row' >
                  {shownRanks.map((rank, rNum) => (rank.isVisible) &&
                    <Col key={rNum} className={`rank-col p-0`} >
                      <div className={`rank-summary w-100 bg-white ${(getRatingNum(criterion) === rNum) ? 'mark-as-selected' : ''}`}>
                        <div className='selected-marker'>
                          <FontAwesomeIcon className='selected-indicator' icon={faCheck} />
                        </div>
                        <div className='rank-title w-100 pt-2 pb-1 pl-2 pr-2 rank-btn' onClick={() => onRankSelected(rNum)}>{rank.name}</div>
                          <textarea
                            readOnly={true}
                            value={criterion.rankSummaries[rNum]}
                            className='rank-text pt-1 pb-2 pl-2 pr-2 d-inline-block' />
                      </div>
                    </Col>
                  )}
                </Row>
              </Container>
            </Tab.Pane>)
            }
          </Tab.Content>
        </Tab.Container>

      </Row>
    </Fragment>
  )
}

export default RubricAssessorPanel;