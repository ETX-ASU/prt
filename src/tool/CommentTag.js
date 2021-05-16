
import ReactQuill from "react-quill";

let Inline = ReactQuill.Quill.import('blots/inline');

class CommentTag extends Inline {
	static create(data) {
		let node = super.create(data);

		// Oddly, we must set an attribute to trigger the style update and use of the added class name
		node.setAttribute('data-id', data.id);
		node.setAttribute('style', `color: inherit;`);
		return node;
	}
}

CommentTag.blotName = 'comment-tag';
CommentTag.tagName = 'span';
CommentTag.className = 'comment-tag';

export default CommentTag;


