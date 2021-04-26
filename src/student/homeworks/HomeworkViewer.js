import React, {Fragment} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import "./homeworks.scss";
import HeaderBar from "../../app/components/HeaderBar";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";
import DraftWriter from "../../tool/DraftWriter";


function HomeworkViewer(props) {
	const {homework, assignment, availableHeight} = props;

	return (
		<div className='bottom-zone d-flex flex-row m-0 p-0' style={{height: `calc(${availableHeight}px - 6em)`}}>
      <DraftWriter
        isReadOnly={true}
        isShowCorrect={false}
				toolbarHeight={0}
        someFunc={() => console.log("i'm yo daddy")}
        assignment={assignment}
        toolHomeworkData={homework.toolHomeworkData} />
		</div>
	)
}

export default HomeworkViewer;