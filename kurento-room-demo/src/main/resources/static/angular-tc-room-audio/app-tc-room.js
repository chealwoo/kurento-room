/*
 * @author Raquel Díaz González
 */

loadAddOns();
//inQ.loadScript("./js/angular.min.js");
//jQuery('#inqChatStage', top.window.document).hide();

jQuery(function() {

	jQuery('body').append('<div id="kurento_room_app"> <div ng-controller="callController"> <div id="room" ng-show="showRoom">     <div id="content">         <div id="main-video">             <!--big videos-->         </div> <!--         <div id="logo">             <img src="img/kurento.png" />         </div>                 <div id="room-name">{{roomName}}</div> -->         <div class="mb" align="right" style="margin: 1em; padding-bottom: 5px" id="buttonActions">             <!--eliminado class action de los botones para cambiar el css-->             <!--aumentado el tamaño de los iconos con css (room.css)-->             <button class="btn btn--l btn--teal btn--fab mdi md-volume-up" lx-ripple ng-click="onOffVolume()" id="buttonVolume" title="Audio toggle"></button> <!--mute audio-->             <button class="btn btn--l btn--grey btn--fab mdi md-videocam" lx-ripple ng-click="onOffVideocam()" id="buttonVideocam" title="Video toggle"></button> <!--mute video-->             <button class="btn btn--l btn--blue-grey btn--fab mdi md-not-interested" lx-ripple ng-click="disconnectStream()" id="buttonDisconnect" title="Disconnect media stream"></button> <!--unpublish or unsubscribe media-->            <!-- <button class="btn btn--xl btn--deep-purple btn--fab mdi md-mood" lx-ripple ng-click="showHat()" id="hatButton" title="Hat toggle"></button> hat-->             <button class="btn btn--l btn--orange btn--fab mdi md-desktop-mac " lx-ripple onclick="top.inQ.chatInfo.acceptCob();" title="Desktop sharing" id="cobstart" style="display:none;"></button> <!--compartir escritorio-->             <button class="btn btn--l btn--red btn--fab mdi md-call-end " lx-ripple ng-click="leaveRoom()" id="buttonLeaveRoom" title="Leave room"  style="display:none;"></button> <!--colgar-->             <button class="btn btn--l btn--green btn--fab mdi md-fullscreen" lx-ripple ng-click="goFullscreen()" title="Fullscreen"></button> <!--fullscreen-->           <!--  <button class="btn btn--xl btn--blue btn--fab mdi md-chat" lx-ripple ng-click="toggleChat()" title="Chat toggle"></button> chat-->         </div>         <div id="participants">             <!--small videos-->         </div>     </div>     <!--CHAT-->     <div class="toggler" style="width: 20%;height: 100%;float: right" >         <div id="effect" style="display:none">             <!--head-->             <div>                 <strong>Chat</strong>                 <button class="btn btn--s btn--blue btn--icon mdi md-close" lx-ripple ng-click="toggleChat()" id="button"></button> <!--close-->             </div>             <div style="height: 30em;  overflow: scroll;">                 <ul class="list" >                     <!--chat messages with scroll-->                 </ul>             </div>             <!--message and button to send-->             <div>                 <form>                     <lx-text-field label="Message">                         <input id="inputMessage" type="text" ng-model="message">                     </lx-text-field>                     <button type="submit" class="btn btn--m btn--green btn--raised" lx-ripple ng-click="sendMessage()">Send</button>                 </form>             </div>         </div>     </div> </div> <div class="join" ng-hide="showRoom">     <div id="join-title">Kurento Room</div>     <div class="card" id="join">         <form role="form" ng-submit="register(room)" accept-charset="UTF-8">             <div class="card__content">                 <lx-text-field label="Username">                     <input type="text" id="name" ng-model="room.userName" required>                 </lx-text-field>                 <div class="grid">                     <div class="grid__col6">                         <lx-text-field label="Room">                             <input type="text" id="roomName" ng-model="room.roomName" required>                         </lx-text-field>                     </div>                     <div class="grid__col6">                         <lx-select ng-model="room.roomName" placeholder="Choose an existing room" choices="listRooms" floating-label>                             <lx-select-selected>                                 {{ $selected}}                             </lx-select-selected>                             <lx-select-choices>                                 {{ $choice}}                             </lx-select-choices>                         </lx-select>                     </div>                 </div>             </div>             <div class="card__actions">                 <div class="grid">                     <div class="grid__col6">                         <button class="btn btn--l btn--blue btn--raised" lx-ripple type="button" ng-click="clear()">Clear</button>                     </div>                     <div class="grid__col6">                         <button id="joinBtn" class="btn btn--l btn--green btn--raised" lx-ripple type="submit" >Join room!</button>                     </div>                 </div>                 <br>             </div>         </form>     </div> </div> </div></div>');

	var resourcePath = "https://172.26.111.82:8443/";

	jQuery('#kurento_room_app').ready(function(){
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'angular/lumX/material-design-iconic-font/css/material-design-iconic-font.min.css" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'css/googleapis-fonts.css" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'css/jquery-ui.min.css" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'css/room.css" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'angular/lumX/dist/css/lumx.css" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'angular/lumX/dist/_bourbon.scss" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'angular/lumX/dist/_neat.scss" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'angular/lumX/dist/scss/core/_core.scss" >').appendTo("head");
		jQuery('<link rel="stylesheet" type="text/css" href="' + resourcePath + 'angular/lumX/dist/scss/main/_lumx.scss" >').appendTo("head");

		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/css/googleapis-fonts.css" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/css/jquery-ui.min.css" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/css/room.css" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/css/lumx.css" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/_bourbon.scss" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/angular/lumX/material-design-iconic-font/css/material-design-iconic-font.min.css" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/_neat.scss" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/scss/core/_core.scss" >').appendTo("head");
		//jQuery('<link rel="stylesheet" type="text/css" href="https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/scss/main/_lumx.scss" >').appendTo("head");


		inQ.loadScript(resourcePath + "angular-tc-room/app-tc-room-action.js");

		if (top.inQ)
		{
			top.inQ.showCobBtn = function() {
				jQuery('#cobstart', top.document).show();
			};
		}

	});


});



function loadAddOns() {
	window.inQ = window.inQ || {};

	if (inQ.initialized !== true) {
		inQ.initialized = true;
		inQ.addOns = {};
		inQ.loadedAddOns = [];
		inQ.requirejQuery = function() {inQ.jQueryRequired = true;};
		inQ.loadScript = function(url) {
			var regex = new RegExp(url, 'gi');
			if (inQ.loadedAddOns.join().match(regex)) {return;}
			inQ.loadedAddOns.push(url);
			if (url.endsWith(".js")) {
				document.body.appendChild(document.createElement('script')).src = url;
			} else {
				document.head.appendChild(document.createElement('link')).href = url;
			}
		};
		inQ.debugMode = location.href.match(/tcDebugMode=true/i) !== null;
		inQ.console = function() {if (inQ.debugMode && window.console) window.console.debug(arguments);};
		inQ.loadScript('https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/safeJQuery.js');
	}

	for (var i = 0; i < arguments.length; i++) {inQ.loadScript(arguments[i]);}
}