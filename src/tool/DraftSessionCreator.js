import React, {Fragment, useEffect} from 'react';
import {Container, Row, Col, Button} from 'react-bootstrap';
import { v4 as uuid } from "uuid";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
library.add(faTrash, faPlus);


// toolAssignmentData.rubric.criteria[] => replaces toolAssignmentData.quizQuesions


// TOOL-DEV: You will provide your own component to act as a UI for creating your tool's specific assignment data
function DraftSessionCreator(props) {
  const {updateToolAssignmentData, toolAssignmentData, isLimitedEditing} = props;
  const rubric = toolAssignmentData.rubric;

  useEffect(() => {
    if (!rubric.criteria.length) handleAddCriterion();
  }, [rubric.criteria.length])


  function handleRankChange(e, rankNum, propName) {
    const ranks = rubric.ranks.slice();
    ranks[rankNum][propName] = e.target.value;
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, ranks}});
  }

  function handleAddRank() {
    const ranks = rubric.ranks.concat([{name:`Quality Rank #${rubric.ranks.length+1}`, points:0}]);
    const criteria = rubric.criteria.map( c => ({
      id: uuid(),
      name: c.name,
      weight: c.weight,
      rankSummaries: c.rankSummaries.concat([''])
    }));
    updateToolAssignmentData({...toolAssignmentData, rubric:{ranks, criteria}});
  }

  function handleDeleteRank(rankNum) {
    const ranks = rubric.ranks.slice();
    ranks.splice(rankNum, 1);
    const criteria = rubric.criteria.map( c => {
      let rankSummaries = c.rankSummaries.slice();
      rankSummaries.splice(rankNum, 1);
      return {
        name: c.name,
        weight: c.weight,
        rankSummaries
      }
    });

    updateToolAssignmentData({...toolAssignmentData, rubric:{ranks, criteria}});
  }

  function handleAddCriterion() {
    const criteria = rubric.criteria.slice();
    criteria.push({
      id: uuid(),
      name: '',
      weight: 0,
      rankSummaries: rubric.ranks.map(() => '')
    });
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, criteria}});
  }

  function handleDeleteCriterion(criteriaNum) {
    const criteria = rubric.criteria.slice();
    criteria.splice(criteriaNum, 1);
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


  function renderRankForm(rankNum) {
    return(
      <Row key={rubric.ranks[rankNum].id} className='m-2 form-inline align-items-center'>
        <Col>
          <div className='input-group'>
            <label className='ml-2 mr-2' htmlFor={`rank${rankNum}-name`}><h3 className='subtext'>{rankNum+1})</h3></label>
            <input id={`rank${rankNum}-name`}
                   type='text'
                   disabled={isLimitedEditing}
                   className={'form-control'}
                   onChange={e => handleRankChange(e, rankNum,'name')}
                   placeholder={``}
                   defaultValue={rubric.ranks[rankNum].name} />
            <div className='input-group-append'>
              <div className='input-group-text form-control'>
                <input className="form-check-inline" type="number"
                       disabled={isLimitedEditing}
                       onChange={e => handleRankChange(e, rankNum, 'points')}
                       defaultValue={rubric.ranks[rankNum].points}
                       min={0} max={1000} />
                pts
              </div>
            </div>
            <Button className='ml-2 btn xbg-dark'
                    disabled={isLimitedEditing}
                    onClick={() => handleDeleteRank(rankNum)}>
              <FontAwesomeIcon className='btn-icon mr-0' icon={faTrash} />
            </Button>
          </div>
        </Col>
      </Row>
    )
  }

  function renderCriteriaForm(criteriaNum) {
    const criterionData = rubric.criteria[criteriaNum];

    return (
      <Fragment key={criterionData.id}>
        <Container className='mt-4'>
          <Row className='m-2'>
            <Col>
              <div className='input-group pb-3 mt-4'>
                <label htmlFor={`crit${criteriaNum}-name`} style={{width: 'calc(100% - 108px'}}/>
                <h3>Criterion #{criteriaNum+1} Name</h3>
                <input id={`crit${criteriaNum}-name`}
                       disabled={isLimitedEditing}
                       className={'form-control ml-2'}
                       onChange={e => handleNameChange(e, criteriaNum, 'name')}
                       placeholder={`Criterion #${criteriaNum+1}`}
                       defaultValue={criterionData.name} />
                <div className='input-group-append'>
                  <Button className='ml-2 btn xbg-dark'
                          disabled={isLimitedEditing}
                          onClick={() => handleDeleteCriterion(criteriaNum)}>
                    <FontAwesomeIcon className='btn-icon mr-0' icon={faTrash} />
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          <Row className='m-2'>
            <Col className={'col-3'}/>
            <Col className={'col-9'}>
              <div className={'form-group'}>
                <h4 className='pl-2 w-100 mb-1'>Describe what makes this criterion qualify as:</h4>
              </div>
            </Col>
          </Row>

          {/*TODO: use something besides index for the key*/}
          {criterionData.rankSummaries.map((summary, rankNum) =>
            <Row key={rubric.ranks[rankNum].id} className='m-2 form-inline align-items-center'>
              <Col>
                <div className='input-group text-right'>
                  <label className='ml-2 mr-2 w-25 text-right' htmlFor={`data-crit${criteriaNum}-a${rankNum}`}><h3 className='subtext w-100'>{rubric.ranks[rankNum].name}: </h3></label>
                  <input type='text' className='form-control' id={`data-crit${criteriaNum}-a${rankNum}`}
                         onChange={e => handleRankSummariesChange(e, criteriaNum, rankNum)} value={summary}
                         placeholder={`Description of ${criterionData.name} qualities that should be scored as ${rubric.ranks[rankNum].name}`}/>
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


      {rubric.ranks.map((r, rankNum) => renderRankForm(rankNum))}

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
            <Button disabled={isLimitedEditing} className='align-middle rounded-circle xbg-dark p-0 m-2' style={{width:'40px', height:'40px'}} onClick={handleAddCriterion}>
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
