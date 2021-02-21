import React, {Fragment, useEffect, useState} from 'react';
import {Container, Row, Col, Button} from 'react-bootstrap';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
library.add(faTrash, faPlus);


// toolAssignmentData.rubric.criteria[] => replaces toolAssignmentData.quizQuesions


// TOOL-DEV: You will provide your own component to act as a UI for creating your tool's specific assignment data
function DraftSessionCreator(props) {
  const {isUseAutoScore, updateToolAssignmentData, toolAssignmentData, isLimitedEditing} = props;
  const rubric = toolAssignmentData.rubric;


  function handleRankChange(e) {
  }

  function handleAddRank(e) {
  }

  function handleDeleteRank(e) {
  }


  function handleAddCriterionButton(e) {
    const criteria = rubric.criteria.slice();
    criteria.push({
      name: `Criterion #${criteria.length+1}`,
      weight: 0,
      rankSummaries: rubric.rankNames.map(() => '')
    });
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, criteria}});
  }

  function handleNameChange(e, cNum, propName) {
    const criteria = rubric.criteria.slice();
    criteria[cNum][propName] =  e.target.value;
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, criteria}});
  }

  function handleRankSummariesChange(e, cNum, index) {
    const criteria = rubric.criteria.slice();
    const summaries = criteria[cNum].rankSummaries.slice();
    summaries[index] = e.target.value;
    if ((!e.target.value) && (index-1 <= criteria.length)) summaries.splice(index, 1);

    criteria[cNum].rankSummaries = summaries;
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, criteria}});
  }


  function renderRankForm(rankName, rNum) {
    return(
      <Row key={rNum} className='m-2 form-inline align-items-center'>
        <Col>
          <div className='input-group'>
            <label className='ml-2 mr-2' htmlFor={`rank${rNum}-name`}><h3 className='subtext'>{rNum+1})</h3></label>
            <input id={`rank${rNum}-name`}
                   type='text'
                   disabled={isLimitedEditing}
                   className={'form-control'}
                   onChange={e => handleRankChange(e, rNum, 'rankName')}
                   placeholder={``}
                   defaultValue={rankName} />
          </div>
        </Col>
      </Row>
    )
  }

  function renderCriteriaForm(cNum) {
    const criterionData = rubric.criteria[cNum];
    return (
      <Fragment key={cNum}>
        <Container className='mt-4'>
          <Row className='m-2 border-bottom'>
            <Col>
              <div className='input-group w-100 pb-3'>
                <label htmlFor={`crit${cNum}-name`} className='mr-0' style={{width:'calc(100% - 108px'}}>
                  <h3>Criterion #{cNum+1} Name</h3>
                  <input id={`crit${cNum}-name`}
                         disabled={isLimitedEditing}
                         className={'form-control'}
                         onChange={e => handleNameChange(e, cNum, 'name')}
                         placeholder={`Provide text for Question #${cNum+1}`}
                         defaultValue={criterionData.name} />
                </label>
              </div>
            </Col>
          </Row>

          <Row className='m-2'>
            <Col className={'col-12'}>
              <div className={'form-group'}>
                <label><h3>Rank Descriptions</h3></label>
              </div>
            </Col>
          </Row>

          {/*TODO: use something besides index for the key*/}
          {criterionData.rankSummaries.map((summary, index) =>
            <Row key={index} className='m-2 form-inline align-items-center'>
              <Col>
                <div className='input-group'>
                  <label className='ml-2 mr-2' htmlFor={`data-crit${cNum}-a${index}`}><h3 className='subtext'>{index+1})</h3></label>
                  <input type='text' className='form-control' id={`data-crit${cNum}-a${index}`}
                         onChange={e => handleRankSummariesChange(e, cNum, index)} value={summary}
                         placeholder={`Description of ${criterionData.name} qualities that should be scored as ${rubric.rankNames[index]}`}/>
                </div>
              </Col>
            </Row>
          )}

        </Container>
      </Fragment>
    )
  }

	return (
    <Container>
      <h2 className='mb-3'>Rubric</h2>


      {rubric.rankNames.map((rankName, rNum) => renderRankForm(rankName, rNum))}

      <Row className='mt-3 mb-5'>
        <Col className='text-center'>
          <h3 className={'subtext'}>
            <Button disabled={isLimitedEditing} className='align-middle rounded-circle xbg-dark p-0 m-2' style={{width:'40px', height:'40px'}} onClick={handleAddRank}>
              <FontAwesomeIcon className='btn-icon mr-0' icon={faPlus} />
            </Button>
            Add another ranking
          </h3>
        </Col>
      </Row>

      {rubric.criteria.map((criterion, cNum) => renderCriteriaForm(cNum))}

      <Row className='mt-3 mb-5'>
        <Col className='text-center'>
          <h3 className={'subtext'}>
            <Button disabled={isLimitedEditing} className='align-middle rounded-circle xbg-dark p-0 m-2' style={{width:'40px', height:'40px'}} onClick={handleAddCriterionButton}>
              <FontAwesomeIcon className='btn-icon mr-0' icon={faPlus} />
            </Button>
            Add another criterion
          </h3>
        </Col>
      </Row>
    </Container>
	)
}

export default DraftSessionCreator;
