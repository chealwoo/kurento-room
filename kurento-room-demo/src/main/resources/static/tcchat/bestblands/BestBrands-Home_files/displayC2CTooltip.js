inQ.requirejQuery();

/* v2.3, updated 7/16/2014
Creates a tooltip to draw attention to a C2C button.  Accepts an object with the following properties:
	- id: value of the id attribute to be created on the tooltip <div>
	- c2cID: value of the id attribute for the existing C2C <div> tag
	- html: the complete html of the button to be used for the tooltip
	- image: the URL of an image to load (can be used instead of providing html)
	- position: the position of the tooltip in relation to the C2C <div> tag (left, right, top, bottom)
	- width: width of the tooltip (in pixels)
	- height: height of the tooltip (in pixels)
	- offsetPx: distance between the tooltip and the C2C <div> tag
	- seconds: number of seconds before the tooltip fades out
	- fadeIn: number of milliseconds for the tooltip to fade in
	- initialTopOffset: distance (in pixels) between the initial top of the tooltip and the final top (after the tooltip has faded in)
*/

inQ.addOns.displayC2CTooltip = function(params) {
	setTimeout(function() {
		var $ = inQ.jQuery,
			$tooltip = $('#' + params.id),
			$img = $tooltip.find('img').hide(),
			onclick = $img.attr('onclick'),
			html = params.image ? '<img src="' + params.image + '" />' : params.html,
			$html = $('<div>').html(html).appendTo($tooltip),
			$c2c = $('#' + params.c2cID),
			c2cTop = $c2c.offset().top - $(window).scrollTop(),
			c2cLeft = $c2c.offset().left - $(window).scrollLeft(),
			fadeoutTimer = 0,
			destroy = function() {
				$tooltip.remove();
				clearTimeout(fadeoutTimer);
			},
			topPx, left;
		
		switch (params.position) {
			case 'left':
				left = c2cLeft - params.width - params.offsetPx;
				topPx = c2cTop + ($c2c.outerHeight() - params.height)/2;
				break;
			case 'right':
				left = c2cLeft + $c2c.outerWidth() + params.offsetPx;
				topPx = c2cTop + ($c2c.outerHeight() - params.height)/2;
				break;
			case 'top':
				left = c2cLeft + ($c2c.outerWidth() - params.width)/2;
				topPx = c2cTop - params.height - params.offsetPx;
				break;
			case 'bottom':
				left = c2cLeft + ($c2c.outerWidth() - params.width)/2;
				topPx = c2cTop + $c2c.outerHeight() + params.offsetPx;
				break;
		}
		
		$tooltip
			.click(destroy)
			.attr('onclick', onclick)
			.appendTo($('body'))
			.css({
				opacity: 0,
				position: 'fixed',
				zIndex: 999999,
				'box-sizing': 'border-box',
				'-webkit-box-sizing': 'border-box',
				'-moz-box-sizing': 'border-box',
				width: params.width,
				height: params.height,
				top: topPx + (params.initialTopOffset || 0),
				left: left + (params.initialLeftOffset || 0),
				cursor: 'pointer'
			});

			setTimeout(function() {
				$tooltip.animate({opacity: 1, top: topPx, left: left}, params.fadeIn);
				$c2c.find('img').click(destroy);
				
				fadeoutTimer = setTimeout(function() {
					$tooltip.fadeOut(destroy);
				}, params.seconds * 1000);
				
			}, params.image ? 1000 : 0);

			if (inQ.debugMode) {
				top.$tooltip = $tooltip;
				top.$c2c = $c2c;
			}
	}, 1000);
};