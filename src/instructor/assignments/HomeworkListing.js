import React, {Fragment, useEffect, useState} from 'react';
import {Button, Col, DropdownButton, Row, Dropdown} from "react-bootstrap";
import LoadingIndicator from "../../app/components/LoadingIndicator";
import HomeworkListItem from "./HomeworkListItem";
import {HOMEWORK_PROGRESS, SORT_BY} from "../../app/constants";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {
  faBackward,
  faForward,
  faCaretLeft,
  faCaretRight,
  faComment,
  faPercent, faEdit, faCheck, faCaretDown, faCaretUp
} from "@fortawesome/free-solid-svg-icons";
import {useDispatch, useSelector} from "react-redux";
import {setDisplayOrder} from "../../app/store/appReducer";


function HomeworkListing(props) {
  const dispatch = useDispatch();
  const [curPageNum, setCurPageNum] = useState(0);
  const [sortBy, setSortBy] = useState({type:SORT_BY.name, isAscending:true});
  const [pageBtns, setPageBtns] = useState([]);
  const [studentsPerPage, setStudentsPerPage] = useState(props.studentsPerPage);
  const [shownStudents, setShownStudents] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const activeUiScreenMode = useSelector(state => state.app.activeUiScreenMode);
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);

  useEffect(function reCalcPageCount(){
    setPageCount(Math.ceil(props.students.length/studentsPerPage));
  }, [props.students, studentsPerPage])

  useEffect(function rePaginateList() {
    console.log(`pageCount: ${pageCount}`);
    if (pageCount <= 5) {
      let newPageBtns = new Array(pageCount).fill(-1);
      setPageBtns(newPageBtns.map((b, i) => i));
    } else {
      const lowNum = Math.min(Math.max(curPageNum-2, 0), pageCount-5);
      let btnNums = new Array(5).fill(-1).map((b, i) => i + lowNum);
      setPageBtns(btnNums);
    }

    const topStudentIndex = curPageNum * studentsPerPage;
    const sortedStudents = getSortedStudents(props.students.slice(), sortBy.type, sortBy.isAscending);
    dispatch(setDisplayOrder(sortedStudents.map(s => s.id)));

    const shown = sortedStudents.filter((s, i) => i >= (topStudentIndex) && i < topStudentIndex + studentsPerPage)
    setShownStudents(shown);
  }, [props.students, pageCount, sortBy, curPageNum, isHideStudentIdentity, activeUiScreenMode])


  function getSortedStudents(items, type, direction) {
    let order;

    switch (type) {
      case SORT_BY.name:
        items.sort((a, b) => (isHideStudentIdentity) ? a.randomOrderNum - b.randomOrderNum : a.name.localeCompare(b.name));
        break;
      case SORT_BY.autoScore:
        items.sort((a, b) => a.autoScore - b.autoScore);
        break;
      case SORT_BY.score:
        items.sort((a, b) => {
          const aVal = isNaN(a.scoreGiven) ? -1 : a.scoreGiven;
          const bVal = isNaN(b.scoreGiven) ? -1 : b.scoreGiven;
          return aVal - bVal;
        });
        break;
      case SORT_BY.hasComment:
        items.sort((a, b) => {
          if (!!a.comment && !b.comment) return -1;
          if (!a.comment && !!b.comment) return 1;
          return (isHideStudentIdentity) ? a.randomOrderNum - b.randomOrderNum : a.name.localeCompare(b.name);
        });
        break;
      case HOMEWORK_PROGRESS.inProgress:
        order = [HOMEWORK_PROGRESS.fullyGraded, HOMEWORK_PROGRESS.submitted, HOMEWORK_PROGRESS.inProgress, HOMEWORK_PROGRESS.notBegun];
        items.sort((a, b) => {
          if (a.percentCompleted !== b.percentCompleted) return a.percentCompleted - b.percentCompleted;
          const aVal = order.indexOf(a.homeworkStatus);
          const bVal = order.indexOf(b.homeworkStatus);
          if (aVal !== bVal) return aVal - bVal;
          return (isHideStudentIdentity) ? a.randomOrderNum - b.randomOrderNum : a.name.localeCompare(b.name);
        });
        break;
      case HOMEWORK_PROGRESS.submitted:
        order = [HOMEWORK_PROGRESS.submitted, HOMEWORK_PROGRESS.inProgress, HOMEWORK_PROGRESS.notBegun, HOMEWORK_PROGRESS.fullyGraded];
        items.sort((a, b) => {
          const aVal = order.indexOf(a.homeworkStatus);
          const bVal = order.indexOf(b.homeworkStatus);
          if (aVal !== bVal) return aVal - bVal;
          if (a.percentCompleted !== b.percentCompleted) return a.percentCompleted - b.percentCompleted;
          return (isHideStudentIdentity) ? a.randomOrderNum - b.randomOrderNum : a.name.localeCompare(b.name);
        });
        break;
      case HOMEWORK_PROGRESS.fullyGraded:
        order = [HOMEWORK_PROGRESS.fullyGraded, HOMEWORK_PROGRESS.submitted, HOMEWORK_PROGRESS.inProgress, HOMEWORK_PROGRESS.notBegun];
        items.sort((a, b) => {
          const aVal = order.indexOf(a.homeworkStatus);
          const bVal = order.indexOf(b.homeworkStatus);
          if (aVal !== bVal) return aVal - bVal;
          if (a.percentCompleted !== b.percentCompleted) return a.percentCompleted - b.percentCompleted;
          return (isHideStudentIdentity) ? a.randomOrderNum - b.randomOrderNum : a.name.localeCompare(b.name);
        });
        break;
      default:
        items.sort((a, b) => (isHideStudentIdentity) ? a.randomOrderNum - b.randomOrderNum : a.name.localeCompare(b.name));
        break;
    }
    return (direction) ? items : items.reverse();
  }

  function toggleSortOn(type) {
    const sortDir = (type === sortBy.type) ? (!sortBy.isAscending) : true;
    setSortBy({type:type, isAscending:sortDir});
  }

  function toggleProgressSortType() {
    const order = [HOMEWORK_PROGRESS.inProgress, HOMEWORK_PROGRESS.submitted, HOMEWORK_PROGRESS.fullyGraded];
    if (!sortBy.isAscending) {
      let index = order.indexOf(sortBy.type) + 1;
      index = (index === 3) ? 0 : index;
      setSortBy({type:order[index], isAscending:false});
    }
    setSortBy({type:sortBy.type, isAscending:true});
  }

  function getHomeworksList() {
    return (
      shownStudents.map((student, rowNum) => <HomeworkListItem isUseAutoScore={props.isUseAutoScore} key={student.id} rowNum={rowNum+1} student={student} />)
    )
  }

  function handleStudentsPerPageSelected(e) {
    console.log(`SPP => ${e}`)
    setStudentsPerPage(parseInt(e));
  }


  return (
    <Fragment>
      <Row className='pt-2 pb-4'>
        <Col className='col-9'>
          {pageCount > 5 &&
          <Button className='page-nav-btn mr-1 xbg-dark text-white' onClick={() => setCurPageNum(Math.max(curPageNum-5, 0))}>
            <FontAwesomeIcon icon={faBackward}/>
          </Button>}
          <Button className='page-nav-btn mr-1 xbg-dark text-white' onClick={() => setCurPageNum(Math.max(curPageNum-1, 0))}>
            <FontAwesomeIcon icon={faCaretLeft}/>
          </Button>
          {pageBtns.map((b, i) => (
            <Button className={`page-btn mr-1 ${curPageNum === b ? 'selected' : ''}`} key={i} onClick={() => setCurPageNum(b)}>{b+1}</Button>
          ))}
          <Button className='page-nav-btn mr-1 xbg-dark text-white' onClick={() => setCurPageNum(Math.min(curPageNum+1, pageCount-1))}>
            <FontAwesomeIcon icon={faCaretRight}/>
          </Button>
          {pageCount > 5 &&
          <Button className='page-nav-btn mr-1 xbg-dark text-white' onClick={() => setCurPageNum(Math.min(curPageNum+5, pageCount-1))}>
            <FontAwesomeIcon icon={faForward}/>
          </Button>}
        </Col>
        <Col className='text-right mr-2'>
          <span>Per page
            <DropdownButton className='d-inline-block ml-2' title={studentsPerPage} onSelect={handleStudentsPerPageSelected}>
              <Dropdown.Item eventKey={10}>10</Dropdown.Item>
              <Dropdown.Item eventKey={15}>15</Dropdown.Item>
              <Dropdown.Item eventKey={20}>20</Dropdown.Item>
              <Dropdown.Item eventKey={30}>30</Dropdown.Item>
              <Dropdown.Item eventKey={50}>50</Dropdown.Item>
              <Dropdown.Item eventKey={100}>100</Dropdown.Item>
            </DropdownButton>
          </span>
        </Col>
      </Row>

      <Row>
        <Col className="pr-4">
          {props.isFetchingHomeworks &&
          <LoadingIndicator className='p-4 text-center h-100 align-middle' isDarkSpinner={true} loadingMsg={'FETCHING STUDENT HOMEWORK'} size={3} />
          }

          {(!props.isFetchingHomeworks && props.students.length > 0) &&
          (<table className="listing table table-hover">
            <thead>
              <tr>
                <th scope="col" className={`pb-1 pt-2 student-col ${sortBy.type === SORT_BY.name ? 'sort-col' : ''}`}>
                  <span onClick={() => toggleSortOn(SORT_BY.name)}>Student
                  </span>
                </th>
                {props.isUseAutoScore &&
                <th scope="col" className={`pb-1 pt-2 mini-col text-center ${sortBy.type === SORT_BY.autoScore ? 'sort-col' : ''}`}>
                  <span onClick={() => toggleSortOn(SORT_BY.autoScore)}>Auto
                  </span>
                </th>
                }
                <th scope="col" className={`pb-1 pt-2 mini-col text-center ${sortBy.type === SORT_BY.score ? 'sort-col' : ''}`}>
                  <span onClick={() => toggleSortOn(SORT_BY.score)}>Final
                  </span>
                </th>
                <th scope="col" className={`pb-1 pt-2 mini-col text-center ${sortBy.type === SORT_BY.hasComment ? 'sort-col' : ''}`}>
                  <span onClick={() => toggleSortOn(SORT_BY.hasComment)}>
                    <FontAwesomeIcon icon={faComment}/>
                  </span>
                </th>
                <th scope="col" className={`pb-1 pt-2 status-col ${sortBy.type === HOMEWORK_PROGRESS.inProgress ? 'sort-col' : ''}`} colSpan={2}>
                  <span onClick={toggleProgressSortType}>Progress</span>
                  <span className='float-right'>
                    <FontAwesomeIcon className='ml-2' icon={faPercent} onClick={() => toggleSortOn(HOMEWORK_PROGRESS.inProgress)} />
                    <FontAwesomeIcon className='ml-2' icon={faEdit} onClick={() => toggleSortOn(HOMEWORK_PROGRESS.submitted)} />
                    <FontAwesomeIcon className='ml-2' icon={faCheck} onClick={() => toggleSortOn(HOMEWORK_PROGRESS.fullyGraded)} />
                  </span>
                </th>
              </tr>
              <tr className='marker-row'>
                <th scope="col" className={`marker student-col ${sortBy.type === SORT_BY.name ? 'sort-col' : ''}`}>
                  {(sortBy.type === SORT_BY.name && !sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                  {(sortBy.type === SORT_BY.name && sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                </th>
                {props.isUseAutoScore &&
                <th scope="col" className={`marker ${sortBy.type === SORT_BY.autoScore ? 'sort-col' : ''}`}>
                  {(sortBy.type === SORT_BY.autoScore && !sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                  {(sortBy.type === SORT_BY.autoScore && sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                </th>
                }
                <th scope="col" className={`marker ${sortBy.type === SORT_BY.score ? 'sort-col' : ''}`}>
                  {(sortBy.type === SORT_BY.score && !sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                  {(sortBy.type === SORT_BY.score && sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                </th>
                <th scope="col" className={`marker ${sortBy.type === SORT_BY.hasComment ? 'sort-col' : ''}`}>
                  {(sortBy.type === SORT_BY.hasComment && !sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                  {(sortBy.type === SORT_BY.hasComment && sortBy.isAscending) && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                </th>
                <th scope="col" className={`marker status-col ${sortBy.type === HOMEWORK_PROGRESS.inProgress ? 'sort-col' : ''}`} colSpan={2}>
                  {(sortBy.type === HOMEWORK_PROGRESS.inProgress &&
                    <span style={{width: '60px'}}>
                      {!sortBy.isAscending && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                      {sortBy.isAscending && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                    </span>
                  )}
                  {(sortBy.type === HOMEWORK_PROGRESS.submitted &&
                    <span style={{width: '40px'}}>
                      {!sortBy.isAscending && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                      {sortBy.isAscending && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                    </span>
                  )}
                  {(sortBy.type === HOMEWORK_PROGRESS.fullyGraded &&
                    <span style={{width: '20px'}}>
                      {!sortBy.isAscending && <FontAwesomeIcon className={'ml-2'} icon={faCaretDown}/>}
                      {sortBy.isAscending && <FontAwesomeIcon className={'ml-2'} icon={faCaretUp}/>}
                    </span>
                  )}
                </th>
              </tr>
              </thead>
              <tbody>
              {getHomeworksList()}
              </tbody>
            </table>
          )}
          {!props.isFetchingHomeworks && (props.students.length < 1) &&
          <p className='mt-4'>No students have begun their homework for this assignment yet.</p>
          }
        </Col>
      </Row>
    </Fragment>
  )
}


library.add(faBackward, faForward, faCaretLeft, faCaretRight, faComment, faPercent, faEdit, faCheck, faCaretDown, faCaretUp);

export default HomeworkListing;
