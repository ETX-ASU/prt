
import ReactQuill from "react-quill";

let Inline = ReactQuill.Quill.import('blots/inline');

class ComTag extends Inline {
	static create(value) {
		let node = super.create();
		// Oddly, we must set an attribute to trigger the style update and use of the added class name
		node.setAttribute('style', 'color: inherit; data-id:"blah"');
		node.setAttribute('data-content', `TAG-${value.tagNum}`);
		node.setAttribute('src', `TAG-${value.tagNum}`);
		node.id = value.id;
		// node.setAttribute('src', `javascript: () => console.log("Hell yeah")`);
		// node.onClick = () => console.log("Hell yeah");
		// if (value?.url) node.setAttribute('src', `javascript: () => console.log("Hell yeah")`);
		return node;
	}

	static value(node) {
		return {
			alt: node.getAttribute('alt'),
			url: node.getAttribute('src')
		};
	}
}

ComTag.blotName = 'span';
ComTag.tagName = 'span';
ComTag.className = 'comtag';

export default ComTag;

