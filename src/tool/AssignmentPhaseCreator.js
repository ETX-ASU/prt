import React, {Fragment, useEffect, useState} from 'react';
import {Container, Row, Col, Button, Card} from 'react-bootstrap';
import { v4 as uuid } from "uuid";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faTrash, faPlus, faEye, faCopy, faEllipsisV, faEyeSlash} from '@fortawesome/free-solid-svg-icons'
import RubricPanel from "../instructor/assignments/RubricPanel";
import {deepCopy} from "../app/utils/deepCopy";
import {PHASE_TYPES} from "./constants";
library.add(faTrash, faPlus, faEllipsisV, faEyeSlash);


// toolAssignmentData.rubric.criteria[] => replaces toolAssignmentData.quizQuesions
const MIN_NUM_ACTIVE_RANKS = 2;

// TOOL-DEV: You will provide your own component to act as a UI for creating your tool's specific assignment data
function AssignmentPhaseCreator(props) {
  const {updateToolAssignmentData, toolAssignmentData, isLimitedEditing} = props;
  const {rubric} = toolAssignmentData;
  const phaseType = (toolAssignmentData.roundNum%2) ? PHASE_TYPES.draft : PHASE_TYPES.reviewSession;

  const [activeDropZoneIndex, setActiveDropZoneIndex] = useState(-1);
  const [activeDraggedRankIndex, setActiveDraggedRankIndex] = useState(-1);
  const [orderedRanks, setOrderedRanks] = useState(rubric.ranks.sort((a,b) => a.orderNum - b.orderNum));

  const critsCopy = deepCopy(rubric.criteria);
  console.log("origCrits", rubric.criteria);
  console.log("critsCopy", critsCopy);

  // Save a copy of the rubric upon initialization, otherwise drag-n-drop triggers re-render and data goes out of sync
  useEffect(() => {
    updateToolAssignmentData(deepCopy(toolAssignmentData));
  }, [])

  useEffect(() => {
    setOrderedRanks(rubric.ranks.sort((a,b) => a.orderNum - b.orderNum));
  }, [rubric.ranks]);

  function handleRankPropChanged(e, rankNum, propName) {
    const ranks = deepCopy(rubric.ranks);
    ranks[rankNum][propName] = e.target.value;
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, ranks}});
  }

  function onCriterionPropChanged(criterion, propName, newValue) {
    const criteria = deepCopy(rubric.criteria);
    criteria.find(c => c.id === criterion.id)[propName] = newValue;
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, criteria}});
  }

  function onRubricChanged(newValue) {
    updateToolAssignmentData({...toolAssignmentData, rubric:newValue});
  }

  function onAddCriterion() {
    const criteria = deepCopy(rubric.criteria);
    const id = uuid();
    criteria.push({
      id: id,
      name: `Criterion #${criteria.length + 1}`,
      weight: 1,
      rankSummaries: ['','','','',''],
      orderNum: criteria.length,
      isVisible: true
    });
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, criteria}});
    return id;
  }

  function onToggleRankVisibility(index) {
    console.log("rank visibility toggled");
    const ranks = deepCopy(rubric.ranks);
    ranks[index].isVisible = !ranks[index].isVisible;
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, ranks}});
  }

  function onDropped(e) {
    const idx = e.dataTransfer.getData('rankIndex');
    let ranks = deepCopy(rubric.ranks);
    console.log(`dropped rank ${ranks[idx].name} onto zone ${activeDropZoneIndex}`);
    setActiveDropZoneIndex(-1);
    setActiveDraggedRankIndex(-1);
    ranks[idx].orderNum = activeDropZoneIndex - 0.5;
    ranks.sort((a,b) => a.orderNum - b.orderNum);
    ranks = ranks.map((rank, i) => ({...rank, orderNum:i}));
    updateToolAssignmentData({...toolAssignmentData, rubric:{...rubric, ranks}});
  }

  function onDragStarted(e, rankIndex) {
    setActiveDraggedRankIndex(rankIndex);
    e.dataTransfer.setData('rankIndex', rankIndex);
    console.log(`started dragging rank ${rubric.ranks[rankIndex].name}`);
  }

  function isRankVisToggleDisabled(rank) {
    const totalVisible = orderedRanks.filter(c => c.isVisible).length;
    return (rank.isVisible && totalVisible <= MIN_NUM_ACTIVE_RANKS);
  }

  function renderRanksPanel(rank, index) {
    return(
      <Fragment key={index}>
        <Card className='rank-card' draggable={true} value={index}
              onDragStart={(e) => onDragStarted(e, index)}
              onDragEnd={() => setActiveDraggedRankIndex(-1)}>
          <div className='card-handle'>
            <FontAwesomeIcon icon={faEllipsisV} />
            <FontAwesomeIcon icon={faEllipsisV} />
          </div>
          <div className='card-content'>
              <div className='rank-name m-1'>
                <input type='text' value={rank.name} onChange={(e) => handleRankPropChanged(e, index, 'name')} />
              </div>
              <div className='rank-points m-1'>
                <input type='number' min={0} max={100} value={rank.points} onChange={(e) => handleRankPropChanged(e, index, 'points')} />
              </div>
              <Button
                  disabled={isRankVisToggleDisabled(rank)}
                  className='d-inline-block text-center xbg-dark p-0 rank-visibility-btn'
                  onClick={() => onToggleRankVisibility(index)} >
                <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={(rank.isVisible) ? faEye : faEyeSlash} />
              </Button>
          </div>
        </Card>
        <div className={`drop-sliver${activeDropZoneIndex === index+1 ? ' active-drop-zone' : ''}`}
             onDragOver={(e) => e.preventDefault()}
             onDragEnter={() => setActiveDropZoneIndex(index+1)}
             onDragLeave={() => setActiveDropZoneIndex(-1)}
             onDrop={onDropped} />
      </Fragment>
    )
  }

  return (
    <Container className='m-0'>
      <h3 className='mb-2'>Rubric Ranks</h3>
      <Row className='m-0 p-0'>
        <Col className='p-0'>
          <Container className={`ranks-panel${activeDraggedRankIndex >= 0 ? ' dragging-active' : ''}`}>
            <Row className={'p-0 m-0'}>
              <div key={`dropzone-0`}
                onDragOver={(e) => e.preventDefault()}
                className={`drop-sliver${activeDropZoneIndex === 0 ? ' active-drop-zone' : ''}`}
                onDragEnter={() => setActiveDropZoneIndex(0)}
                onDragLeave={() => setActiveDropZoneIndex(-1)}
                onDrop={onDropped} />
              {orderedRanks.map((r, rankNum) => renderRanksPanel(r, rankNum))}
            </Row>
          </Container>
        </Col>
      </Row>

      <h3 className='mt-2 mb-2'>Rubric Criteria</h3>
      <Row className='m-0'>
        <Col>
          {!!rubric.criteria.length &&
            <RubricPanel
                onRubricChanged={onRubricChanged}
                activeDraggedRankIndex={activeDraggedRankIndex}
                rubric={rubric}
                isEditMode={true}
                isLimitedEditing={isLimitedEditing}
                onAddCriterion={onAddCriterion}
                onCriterionPropChanged={onCriterionPropChanged}
            />
          }
        </Col>
      </Row>
    </Container>
  )

}

export default AssignmentPhaseCreator;
