import React from 'react';
import {useDispatch, useSelector} from "react-redux";
import {setCurrentlyReviewedStudentId} from "../../app/store/appReducer";
import {HOMEWORK_PROGRESS, STATUS_TEXT} from "../../app/constants";

import {library} from "@fortawesome/fontawesome-svg-core";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faArrowCircleLeft,
  faArrowCircleRight,
  faCheck,
  faComment,
  faEdit,
  faPercent
} from "@fortawesome/free-solid-svg-icons";
library.add(faArrowCircleLeft, faArrowCircleRight);

function HomeworkListItem(props) {
  const dispatch = useDispatch();
  const isHideStudentIdentity = useSelector(state => state.app.isHideStudentIdentity);
	const student = props.student;

  const studentRefName = (isHideStudentIdentity) ? `Student #${student.randomOrderNum}` : student.name;

  function handleReviewHomework() {
    dispatch(setCurrentlyReviewedStudentId(student.id));
  }

  function handleShowComment(e) {
    e.stopPropagation();
    console.log(`Show comment: ${student.comment}`);
  }

	return (
    <tr onClick={handleReviewHomework} className={'review-link'}>
      <td>{studentRefName}</td>
      {props.isUseAutoScore &&
      <td className='text-center'>{(student.autoScore !== undefined) ? student.autoScore : '--'}</td>
      }
      <td className='text-center'>{(student.scoreGiven !== undefined) ? student.scoreGiven : '--'}</td>
      <td className='text-center'>{student.comment ? <FontAwesomeIcon icon={faComment} onClick={handleShowComment}/> : '--'}</td>
      <td className=''>{STATUS_TEXT[student.homeworkStatus]}
        <span className='float-right'>
          {student.homeworkStatus === HOMEWORK_PROGRESS.inProgress && <FontAwesomeIcon className='ml-2' icon={faPercent}/>}
          {student.homeworkStatus === HOMEWORK_PROGRESS.submitted && <FontAwesomeIcon className='ml-2' icon={faEdit}/>}
          {student.homeworkStatus === HOMEWORK_PROGRESS.fullyGraded && <FontAwesomeIcon className='ml-2' icon={faCheck}/>}
        </span>
      </td>
      <td className='text-right'>{student.percentCompleted}%</td>
    </tr>
	)
}

export default HomeworkListItem;
