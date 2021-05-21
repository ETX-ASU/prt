import React from 'react';
import ReactQuill from "react-quill";
import {EMPTY_HOMEWORK} from "../app/constants";
import EditorToolbar, { modules, formats } from "./RteToolbar";
import "react-quill/dist/quill.snow.css";
import "./RteStyles.scss";
import WritersRubricViewer from "../instructor/assignments/WritersRubricViewer";



// TOOL-DEV: You will provide your own component to act as a UI allowing a student to engage with and view their homework
function DraftWriter(props) {
  const {isReadOnly, toolHomeworkData, toolbarHeight, assignment} = props;
  const handleContentUpdated = (isReadOnly) ? () => {} : props.handleContentUpdated;
  const {draftContent} = toolHomeworkData || EMPTY_HOMEWORK;

  return (
    // <div className={`h-100 d-flex flex-column text-editor ${(isReadOnly) ? 'no-bar' : ''}`}>
    //   <EditorToolbar />
    //   <ReactQuill
    //     id='quill-rte'
    //     theme="snow"
    //     readOnly={isReadOnly}
    //     value={draftContent}
    //     onChange={handleContentUpdated}
    //     placeholder={"Write something awesome..."}
    //     modules={modules}
    //     formats={formats}
    //     style={{height: (props.availableHeight - (toolbarHeight)) + 'px'}}
    //   />
    // </div>

    <div className={`d-flex flex-row h-auto w-100`}>
      <div className={`d-flex flex-column text-editor`} style={{width: '65%'}}>
        <EditorToolbar isReadOnly={isReadOnly}/>

        <ReactQuill
          id='quill-rte'
          theme="snow"
          readOnly={isReadOnly}
          defaultValue={draftContent}
          onChange={handleContentUpdated}
          placeholder={"Write something awesome..."}
          modules={modules}
          formats={formats}
          style={{height: `calc(100% - ${toolbarHeight}px)`}}
        />
      </div>
      <WritersRubricViewer
        className='h-auto'
        style={{width: '35%'}}
        rubricRanks={assignment.toolAssignmentData.rubricRanks}
        rubricCriteria={assignment.toolAssignmentData.rubricCriteria}
      />
    </div>

  );

}

export default DraftWriter;