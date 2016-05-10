inQ.addOns.createScrollEventListener = function() {
	function addEvent(elem, evnt, func) {
		if (elem.addEventListener) { // W3C DOM
			elem.addEventListener(evnt,func,false);
		} else if (elem.attachEvent) { // IE DOM
			elem.attachEvent('on' + evnt, func);
		} else {
			elem['on' + evnt] = func;
		}
	}
	
	var body = document.getElementsByTagName('body')[0],
		data = {
			scrollTop: 0,
			scrollLeft: 0,
			totalVerticalScrollDistance: 0,
			totalHorizontalScrollDistance: 0
		},
		timer;
	
	addEvent(window, 'scroll', function(event) {
		var target = event.target || event.srcElement;
		if (target && target !== document) return; //target not available in IE8
		clearTimeout(timer);
		timer = setTimeout(function() {
			var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || body.parentNode || body).scrollLeft,
				scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || body.parentNode || body).scrollTop,
				innerWidth = window.innerWidth || document.documentElement.clientWidth || body.clientWidth,
				innerHeight = window.innerHeight|| document.documentElement.clientHeight|| body.clientHeight;

			data = {
				innerWidth: innerWidth,
				innerHeight: innerHeight,
				scrollLeft: scrollLeft,
				scrollTop: scrollTop,
				isBelowFold: scrollTop - innerHeight > 0,
				totalVerticalScrollDistance: data.totalVerticalScrollDistance + Math.abs(scrollTop - data.scrollTop),
				totalHorizontalScrollDistance: data.totalHorizontalScrollDistance + Math.abs(scrollLeft - data.scrollLeft),
			};

			Inq.fireCustomEvent('evtWindowScroll', data);
		}, 100);
	});
};
inQ.addOns.createScrollEventListener();