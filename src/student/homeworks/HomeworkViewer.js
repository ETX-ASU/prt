import React, {Fragment} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import "./homeworks.scss";
import HeaderBar from "../../app/components/HeaderBar";
import QuizViewerAndEngager from "../../tool/QuizViewerAndEngager";
import DraftWriter from "../../tool/DraftWriter";


function HomeworkViewer(props) {
	const {homework, assignment} = props;

	return (
    <Container className='pb-5'>
      <DraftWriter
        isReadOnly={true}
        isShowCorrect={false}
        someFunc={() => console.log("i'm yo daddy")}
        toolAssignmentData={assignment.toolAssignmentData}
        toolHomeworkData={homework.toolHomeworkData} />
    </Container>
	)
}

export default HomeworkViewer;