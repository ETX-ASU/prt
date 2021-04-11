
import ReactQuill from "react-quill";
import ComTag from "./ComTag";


class ComBtn extends ComTag {
	static create({id, isActiveBtn}) {
		const node = super.create({id, isActiveBtn});
		// Oddly, we must set an attribute to trigger the style update and use of the added class name
		// node.setAttribute('style', `color: #404040; background: #FFD23D`);
		node.setAttribute('style', `color: #404040; background-color: ${(isActiveBtn) ? '#FFD23D' : '#FFFAD1'}`);
		// node.setAttribute('data-content', "######");
		node.id = id;
		return node;
	}

	static value() {
		return {
			alt: 'nope',
			url: "#",
		};
	}
}

ComBtn.blotName = 'comment-btn';
ComBtn.tagName = 'span';
ComBtn.className = 'comment-btn';

export default ComBtn;


