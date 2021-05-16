
import Parchment from 'parchment';

let Highlight = new Parchment.Attributor.Style('align', 'text-align', {
	whitelist: ['right', 'center', 'justify']   // Having no value implies left align
});

Parchment.register(Highlight);

let node = document.createElement('div');
Highlight.add(node, 'right');
console.log(node.outerHTML);



//
// ComTag.blotName = 'comment-tag';
// ComTag.tagName = 'span';
// // ComTag.className = 'comment-tag';
//
// export default ComTag;


