
import ReactQuill from "react-quill";

let Inline = ReactQuill.Quill.import('blots/inline');

class ComTag extends Inline {
	static create({id, isActiveBtn}) {
		let node = super.create({id, isActiveBtn});
		// Oddly, we must set an attribute to trigger the style update and use of the added class name
		node.setAttribute('style', `color: inherit; background-color: ${(isActiveBtn) ? '#FFD23D' : '#FFFAD1'}`);
		// node.setAttribute('style', `color: inherit`);
		// node.setAttribute('src', 'nothing')
		node.id = id;
		return node;
	}

	static value(node) {
		return {
			alt: node.getAttribute('alt'),
			url: node.getAttribute('src')
		};
	}
}

ComTag.blotName = 'comment-tag';
ComTag.tagName = 'span';
ComTag.className = 'comment-tag';

export default ComTag;


