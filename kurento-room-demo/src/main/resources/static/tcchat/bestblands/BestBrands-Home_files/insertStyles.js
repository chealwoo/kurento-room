inQ.addOns.insertStyles = function(css, id) {
	var head = document.head || document.getElementsByTagName('head')[0],
		style = document.createElement('style'),
		styleEl = document.getElementById(id || '');

	if (styleEl) styleEl.parentNode.removeChild(styleEl);
		
	style.type = 'text/css';
	style.id = id;
	
	style.styleSheet
		? style.styleSheet.cssText = css
		: style.appendChild(document.createTextNode(css));

	head.appendChild(style);
};