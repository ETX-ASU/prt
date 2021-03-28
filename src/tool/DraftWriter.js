import React from 'react';
import ReactQuill from "react-quill";
import {EMPTY_HOMEWORK} from "../app/constants";
import EditorToolbar, { modules, formats } from "./RteToolbar";
import "react-quill/dist/quill.snow.css";
import "./RteStyles.scss";



// TOOL-DEV: You will provide your own component to act as a UI allowing a student to engage with and view their homework
function DraftWriter(props) {
  const {isReadOnly, isShowCorrect, toolAssignmentData, toolHomeworkData, handleContentUpdated} = props;
  const {draftContent} = toolHomeworkData || EMPTY_HOMEWORK;
  // function styleForAnswer(qNum, selectedAnswerIndex) {
  //   const isSelected = (quizAnswers[qNum] === selectedAnswerIndex);
  //   if (!isSelected) return '';
  //   const isCorrect = quizQuestions[qNum].correctAnswerIndex === selectedAnswerIndex;
  //   return (!isShowCorrect) ? 'selected' : (isCorrect) ? 'selected correct-selection' : 'selected incorrect-selection';
  // }
  //
  // function isCorrectChoice(qNum, selectedAnswerIndex) {
  //   return (quizQuestions[qNum].correctAnswerIndex === selectedAnswerIndex);
  // }
  //
  // function handleOptSelected(qNum, optNum) {
  //   const updatedQuizAnswers = quizAnswers.slice();
  //   updatedQuizAnswers[qNum] = optNum;
  //   updateToolHomeworkData(Object.assign({}, {quizAnswers:updatedQuizAnswers}))
  // }

  // const handleChange = value => {
  //   console.log(`Change to: ${value}`, props)
  //   props.updateToolHomeworkData(Object.assign({}, toolHomeworkData, {draftContent:value}));
  // };

  return (
    <div className={`text-editor mt-4 ${(isReadOnly) ? 'no-bar' : ''}`}>
      <EditorToolbar />
      <ReactQuill
        theme="snow"
        readOnly={isReadOnly}
        value={draftContent}
        onChange={handleContentUpdated}
        placeholder={"Write something awesome..."}
        modules={modules}
        formats={formats}
      />
    </div>
  );

}

export default DraftWriter;