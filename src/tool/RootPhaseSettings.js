import React, {Fragment, useEffect, useRef, useState} from 'react';
import {Container, Row, Col, Button, Card} from 'react-bootstrap';
import { v4 as uuid } from "uuid";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faTrash, faPlus, faEye, faEllipsisV, faEyeSlash} from '@fortawesome/free-solid-svg-icons'
import RubricPanel from "../instructor/assignments/RubricPanel";
import {deepCopy} from "../app/utils/deepCopy";
library.add(faTrash, faPlus, faEllipsisV, faEyeSlash);


// toolAssignmentData.rubricCriteria[] => replaces toolAssignmentData.quizQuesions
const MIN_NUM_ACTIVE_RANKS = 2;

// TOOL-DEV: You will provide your own component to act as a UI for creating your tool's specific assignment data
function RootPhaseSettings(props) {
  const {setFormData, isLimitedEditing, formData, formData:{toolAssignmentData}} = props;

  const hasUpdatedAssignmentData = useRef(false);
  const {rubricRanks, rubricCriteria} = toolAssignmentData;
  const [activeDropZoneIndex, setActiveDropZoneIndex] = useState(-1);
  const [activeDraggedRankIndex, setActiveDraggedRankIndex] = useState(-1);
  const [orderedRanks, setOrderedRanks] = useState(rubricRanks.sort((a,b) => a.orderNum - b.orderNum));

  // Save a copy of the rubric upon initialization, otherwise drag-n-drop triggers re-render and data goes out of sync
  useEffect(() => {
    if (!hasUpdatedAssignmentData.current) {
      setFormData({...formData, toolAssignmentData: deepCopy(toolAssignmentData)});
      hasUpdatedAssignmentData.current = true;
    }
  }, [toolAssignmentData, formData, setFormData])

  useEffect(() => {
    setOrderedRanks(rubricRanks.sort((a,b) => a.orderNum - b.orderNum));
  }, [rubricRanks]);

  function updateToolAssignmentData(toolAssignmentData) {
    setFormData({...formData, toolAssignmentData});
  }

  function handleRankPropChanged(e, rankNum, propName) {
    const ranks = deepCopy(rubricRanks);
    ranks[rankNum][propName] = e.target.value;
    updateToolAssignmentData({...toolAssignmentData, rubricRanks:ranks});
  }

  function onCriterionPropChanged(criterion, propName, newValue) {
    const criteria = deepCopy(rubricCriteria);
    criteria.find(c => c.id === criterion.id)[propName] = newValue;
    updateToolAssignmentData({...toolAssignmentData, rubricCriteria:criteria});
  }

  function onRubricCriteriaChanged(propName, newValue) {
    updateToolAssignmentData({...toolAssignmentData, rubricCriteria:newValue});
  }

  function onAddCriterion() {
    const criteria = deepCopy(rubricCriteria);
    const id = uuid();
    criteria.push({
      id: id,
      name: `Criterion #${criteria.length + 1}`,
      weight: 1,
      rankSummaries: ['','','','',''],
      orderNum: criteria.length,
      isVisible: true
    });
    updateToolAssignmentData({...toolAssignmentData, rubricCriteria:criteria});
    return id;
  }

  function onToggleRankVisibility(index) {
    const ranks = deepCopy(rubricRanks);
    ranks[index].isVisible = !ranks[index].isVisible;
    updateToolAssignmentData({...toolAssignmentData, rubricRanks:ranks});
  }

  function onDropped(e) {
    const idx = e.dataTransfer.getData('rankIndex');
    let ranks = deepCopy(rubricRanks);
    setActiveDropZoneIndex(-1);
    setActiveDraggedRankIndex(-1);
    ranks[idx].orderNum = activeDropZoneIndex - 0.5;
    ranks.sort((a,b) => a.orderNum - b.orderNum);
    ranks = ranks.map((rank, i) => ({...rank, orderNum:i}));
    updateToolAssignmentData({...toolAssignmentData, rubricRanks:ranks});
  }

  function onDragStarted(e, rankIndex) {
    setActiveDraggedRankIndex(rankIndex);
    e.dataTransfer.setData('rankIndex', rankIndex);
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
              <input type='text'
                value={rank.name}
                onChange={(e) => handleRankPropChanged(e, index, 'name')}
                draggable={true}
                onDragStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            </div>
            <div className='rank-points m-1'>
              <input type='number' min={0} max={100}
                value={rank.points}
                onChange={(e) => handleRankPropChanged(e, index, 'points')}
                draggable={true}
                onDragStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            </div>
            <Button
              disabled={isRankVisToggleDisabled(rank)}
              className='d-inline-block text-center xbg-dark p-0 rank-visibility-btn'
              onClick={() => onToggleRankVisibility(index)}
              draggable={true}
              onDragStart={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
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

  function renderLimitedRanksPanel(rank, index) {
    return(
      <Fragment key={index}>
        <Card className='rank-card' draggable={false} defaultValue={index}>
          <div className='card-handle'>
            <FontAwesomeIcon icon={faEllipsisV} />
            <FontAwesomeIcon icon={faEllipsisV} />
          </div>
          <div className='card-content'>
            <div className='rank-name m-1'>
              <input type='text' disabled={true} defaultValue={rank.name} />
            </div>
            <div className='rank-points m-1'>
              <input disabled={true} type='number' min={0} max={100} defaultValue={rank.points} />
            </div>
            <Button disabled={true} className='d-inline-block text-center xbg-dark p-0 rank-visibility-btn' >
              <FontAwesomeIcon className='btn-icon ml-1 mr-1' icon={(rank.isVisible) ? faEye : faEyeSlash} />
            </Button>
          </div>
        </Card>
        <div className='drop-sliver' />
      </Fragment>
    )
  }


  return (
    <Fragment>
      <h3 className='mb-2'>Rubric Ranks</h3>
      <Row className='m-0 p-0'>
        <Col className='p-0'>
          <Container className={`ranks-panel${activeDraggedRankIndex >= 0 ? ' dragging-active' : ''}`}>
            <Row className={'p-0 m-0'}>
              {!isLimitedEditing &&
              <div key={`dropzone-0`}
                onDragOver={(e) => e.preventDefault()}
                className={`drop-sliver${activeDropZoneIndex === 0 ? ' active-drop-zone' : ''}`}
                onDragEnter={() => setActiveDropZoneIndex(0)}
                onDragLeave={() => setActiveDropZoneIndex(-1)}
                onDrop={onDropped} />
              }
              {isLimitedEditing &&
              <div className={`drop-sliver`} />
              }
              {orderedRanks.map((r, rankNum) => (isLimitedEditing) ? renderLimitedRanksPanel(r, rankNum) : renderRanksPanel(r, rankNum))}
            </Row>
          </Container>
        </Col>
      </Row>

      <h3 className='mt-2 mb-2'>Rubric Criteria</h3>
      <Row className='d-flex flex-column' style={{height: '400px'}}>
        {/*onMouseUp={onDragEnd}*/}
        {/*onMouseMove={onDrag}>*/}
        <Col className='top-zone w-100 mb-3' >

      {/*<Row className='m-0 p-0'>*/}
      {/*  <Col className='m-0 p-0'>*/}
          {!!rubricCriteria?.length &&
            <RubricPanel
              onRubricCriteriaChanged={onRubricCriteriaChanged}
              activeDraggedRankIndex={activeDraggedRankIndex}
              rubricRanks={rubricRanks}
              rubricCriteria={rubricCriteria}
              isEditMode={true}
              isLimitedEditing={isLimitedEditing}
              onAddCriterion={onAddCriterion}
              onCriterionPropChanged={onCriterionPropChanged}
            />
          }
        </Col>
      </Row>
      {/*  </Col>*/}
      {/*</Row>*/}
    </Fragment>
  )

}

export default RootPhaseSettings;
