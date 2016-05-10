inQ.requirejQuery();

inQ.addOns.createHTMLButton = function(el_id, html, animationObj) {
	if ( ! (el_id && html) ) return;
	var el = document.getElementById(el_id),
		cssRegex = /<style .*type=.text\/css.*>([\s\S]*)<\/style>/g,
		cssMatch = cssRegex.exec(html);
	
	if (cssMatch) {
		var css = cssMatch[1],
			style = document.createElement('style');
		
		html = html.replace(cssRegex, '');
		
		style.type = 'text/css';		
		style.styleSheet
			? style.styleSheet.cssText = css
			: style.appendChild(document.createTextNode(css));
		
		document.getElementsByTagName('head')[0].appendChild(style);
	}
	
	el.style.display = 'none';
	
	(function checkReadyImageLoaded() {
		el.firstChild && el.firstChild.src.match(/.*ready-clear\.gif/)
			? loadHTML()
			: setTimeout(checkReadyImageLoaded, 10);
	})();
	
	function loadHTML() {
		var img = el.firstChild,
			builder = document.createElement('div'),
			button;
		
		img.style.display = 'none';
		builder.innerHTML = html.replace(/^\s+|\s+$/g, ''); // trim whitespace
		button = builder.firstChild;
		button.onclick = img.onclick;
		el.appendChild(button);
		el.style.display = '';
		
		if (typeof animationObj === 'object' && ! animationObj.suppress && JSON) {
			animationObj = JSON.parse(JSON.stringify(animationObj));
			inQ.jQuery(button).css(animationObj.initial).animate(animationObj.final, animationObj.duration || 400);
		}
	}
};