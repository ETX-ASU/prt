
import ReactQuill from "react-quill";

let Inline = ReactQuill.Quill.import('blots/inline');

class NonTag extends Inline {
	static create(value) {
		let node = super.create();
		node.removeAttribute('style');
		return node;
	}
}

NonTag.blotName = 'nontag';
NonTag.tagName = 'span';

export default NonTag;


