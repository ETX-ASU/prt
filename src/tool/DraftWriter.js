import React, {useEffect, useRef, useState} from 'react';
import ReactQuill from "react-quill";
import {EMPTY_HOMEWORK} from "../app/constants";
import EditorToolbar, { modules, formats } from "./RteToolbar";
import "react-quill/dist/quill.snow.css";
import "./RteStyles.scss";
import RubricViewer from "../instructor/assignments/RubricViewer";



// TOOL-DEV: You will provide your own component to act as a UI allowing a student to engage with and view their homework
function DraftWriter(props) {
  const {isReadOnly, isShowCorrect, toolAssignmentData, toolHomeworkData} = props;
  const handleContentUpdated = (isReadOnly) ? () => {} : props.handleContentUpdated;
  const {draftContent} = toolHomeworkData || EMPTY_HOMEWORK;
  const [barHeight, setBarHeight] = useState(66);

  useEffect(() => {
    const elem = document.getElementById('toolbar');
    console.log('toolbar height', elem.clientHeight);
    window.addEventListener('resize', handleResize);
    setBarHeight(elem.clientHeight+2);
  }, [])

  function handleResize(e) {
    const elem = document.getElementById('toolbar');
    console.log('height', elem.clientHeight);
    setBarHeight(elem.clientHeight+2);
  }

  return (
    <div className={`d-flex flex-column text-editor ${(isReadOnly) ? 'no-bar' : ''}`}>
      <EditorToolbar />
      <ReactQuill
        className='h-100'
        theme="snow"
        readOnly={isReadOnly}
        value={draftContent}
        onChange={handleContentUpdated}
        placeholder={"Write something awesome..."}
        modules={modules}
        formats={formats}
        // style={{height: `calc(100% - ${barHeight}px`}}
      />
    </div>
  );

}

export default DraftWriter;