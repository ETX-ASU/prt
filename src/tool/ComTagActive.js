import ReactQuill from "react-quill";

let Inline = ReactQuill.Quill.import('blots/inline');

class ComTagActive extends Inline {
	static create(value) {
		let node = super.create();
		node.setAttribute('class', 'activetag');
		return node;
	}
}

ComTagActive.blotName = 'activetag';
ComTagActive.tagName = 'div';

export default ComTagActive;


