
import ReactQuill from "react-quill";

let Inline = ReactQuill.Quill.import('blots/inline');

class CommentTag extends Inline {
	static create({id, isActiveBtn}) {
		let node = super.create({id, isActiveBtn});
		// Oddly, we must set an attribute to trigger the style update and use of the added class name
		node.setAttribute('style', `background-color: #00000000`);
		// node.setAttribute('style', `color: inherit; background-color: ${(isActiveBtn) ? '#FFD23D' : '#FFFAD1'}`);
		node.id = id;
		return node;
	}
}

CommentTag.blotName = 'comment-tag';
CommentTag.tagName = 'span';
CommentTag.className = 'comment-tag';

export default CommentTag;


