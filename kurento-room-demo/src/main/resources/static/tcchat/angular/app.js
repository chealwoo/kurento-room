/*
 * @author Raquel Díaz González
 */

jQuery('body').append('<div id="kurento_room_app" ng-app="kurento_room"> <div ng-controller="callController"> <div class="join">     <div id="join-title">Kurento Room</div>     <div class="card" id="join" ng-show="joinShow">         <form role="form" ng-submit="register(room)" accept-charset="UTF-8">             <div class="card__content">                 <lx-text-field label="Username">                     <input type="text" id="name" ng-model="room.userName" required>                 </lx-text-field>                 <div class="grid">                     <div class="grid__col6">                         <lx-text-field label="Room">                             <input type="text" id="roomName" ng-model="room.roomName" required>                         </lx-text-field>                     </div>                     <div class="grid__col6">                         <lx-select ng-model="room.roomName" placeholder="Choose an existing room" choices="listRooms" floating-label>                             <lx-select-selected>                                 {{ $selected}}                             </lx-select-selected>                             <lx-select-choices>                                 {{ $choice}}                             </lx-select-choices>                         </lx-select>                     </div>                 </div>             </div>             <div class="card__actions">                 <div class="grid">                     <div class="grid__col6">                         <button class="btn btn--l btn--blue btn--raised" lx-ripple type="button" ng-click="clear()">Clear</button>                     </div>                     <div class="grid__col6">                         <button id="joinBtn" class="btn btn--l btn--green btn--raised" lx-ripple type="submit" >Join room!</button>                     </div>                 </div>                 <br>             </div>         </form>     </div> </div> <div id="room">     <div id="content" ng-show="roomShow">         <div id="main-video">             <!--big videos-->         </div>         <div id="logo">             <img src="img/kurento.png" />         </div>         <div id="room-name">{{roomName}}</div>         <div class="mb" align="right" style="margin: 1em; padding-bottom: 5px" id="buttonActions">             <!--eliminado class action de los botones para cambiar el css-->             <!--aumentado el tamaño de los iconos con css (room.css)-->             <button class="btn btn--xl btn--teal btn--fab mdi md-volume-up" lx-ripple ng-click="onOffVolume()" id="buttonVolume" title="Audio toggle"></button> <!--mute audio-->             <button class="btn btn--xl btn--grey btn--fab mdi md-videocam" lx-ripple ng-click="onOffVideocam()" id="buttonVideocam" title="Video toggle"></button> <!--mute video-->             <button class="btn btn--xl btn--blue-grey btn--fab mdi md-not-interested" lx-ripple ng-click="disconnectStream()" id="buttonDisconnect" title="Disconnect media stream"></button> <!--unpublish or unsubscribe media-->             <button class="btn btn--xl btn--deep-purple btn--fab mdi md-mood" lx-ripple ng-click="showHat()" id="hatButton" title="Hat toggle"></button> <!--hat-->             <button class="btn btn--xl btn--orange btn--fab mdi md-desktop-mac " lx-ripple ng-click="" title="Desktop sharing"></button> <!--compartir escritorio-->             <button class="btn btn--xl btn--red btn--fab mdi md-call-end " lx-ripple ng-click="leaveRoom()" id="buttonLeaveRoom" title="Leave room"></button> <!--colgar-->             <button class="btn btn--xl btn--green btn--fab mdi md-fullscreen" lx-ripple ng-click="goFullscreen()" title="Fullscreen"></button> <!--fullscreen-->             <button class="btn btn--xl btn--blue btn--fab mdi md-chat" lx-ripple ng-click="toggleChat()" title="Chat toggle"></button> <!--chat-->         </div>         <div id="participants">             <!--small videos-->         </div>     </div>     <!--CHAT-->     <div class="toggler" style="width: 20%;height: 100%;float: right" >         <div id="effect" style="display:none">             <!--head-->             <div>                 <strong>Chat</strong>                 <button class="btn btn--s btn--blue btn--icon mdi md-close" lx-ripple ng-click="toggleChat()" id="button"></button> <!--close-->             </div>             <div style="height: 30em;  overflow: scroll;">                 <ul class="list" >                     <!--chat messages with scroll-->                 </ul>             </div>             <!--message and button to send-->             <div>                 <form>                     <lx-text-field label="Message">                         <input id="inputMessage" type="text" ng-model="message">                     </lx-text-field>                     <button type="submit" class="btn btn--m btn--green btn--raised" lx-ripple ng-click="sendMessage()">Send</button>                 </form>             </div>         </div>     </div> </div> </div>     </div>');

//var kurento_room = angular.module('kurento_room', ['ngRoute', 'FBAngular', 'lumx']);

var kurento_room = angular.module('kurento_room');

kurento_room.controller('callController', function ($scope, $window, ServiceParticipant, ServiceRoom, Fullscreen, LxNotificationService) {
    
    $scope.register = function (room) {
    	
    	if (!room)
    		ServiceParticipant.showError($window, LxNotificationService, {
    			error: {
    				message:"Username and room fields are both required"
    			}
    		});
    	
        $scope.userName = room.userName;
        $scope.roomName = room.roomName;

        var wsUri = 'wss://127.0.0.1:8443/room';

        //show loopback stream from server
        var displayPublished = false;
        //also show local stream when display my remote
        var mirrorLocal = false;
        
        var kurento = KurentoRoom(wsUri, function (error, kurento) {

            if (error)
                return console.log(error);

            //TODO token should be generated by the server or a 3rd-party component  
            //kurento.setRpcParams({token : "securityToken"});

            room = kurento.Room({
                room: $scope.roomName,
                user: $scope.userName
            });

            var localStream = kurento.Stream(room, {
                audio: true,
                video: true,
                data: true
            });

            localStream.addEventListener("access-accepted", function () {
                room.addEventListener("room-connected", function (roomEvent) {
                	var streams = roomEvent.streams;
                	if (displayPublished ) {
                		localStream.subscribeToMyRemote();
                	}
                	localStream.publish();
                    ServiceRoom.setLocalStream(localStream.getWebRtcPeer());
                    for (var i = 0; i < streams.length; i++) {
                        ServiceParticipant.addParticipant(streams[i]);
                    }
                });

                room.addEventListener("stream-published", function (streamEvent) {
                	 ServiceParticipant.addLocalParticipant(localStream);
                	 if (mirrorLocal && localStream.displayMyRemote()) {
                		 var localVideo = kurento.Stream(room, {
                             video: true,
                             id: "localStream"
                         });
                		 localVideo.mirrorLocalStream(localStream.getWrStream());
                		 ServiceParticipant.addLocalMirror(localVideo);
                	 }
                });
                
                room.addEventListener("stream-added", function (streamEvent) {
                    ServiceParticipant.addParticipant(streamEvent.stream);
                });

                room.addEventListener("stream-removed", function (streamEvent) {
                    ServiceParticipant.removeParticipantByStream(streamEvent.stream);
                });

                room.addEventListener("newMessage", function (msg) {
                    ServiceParticipant.showMessage(msg.room, msg.user, msg.message);
                });

                room.addEventListener("error-room", function (error) {
                    ServiceParticipant.showError($window, LxNotificationService, error);
                });

                room.addEventListener("error-media", function (msg) {
                    ServiceParticipant.alertMediaError($window, LxNotificationService, msg.error, function (answer) {
                    	console.warn("Leave room because of error: " + answer);
                    	if (answer) {
                    		kurento.close(true);
                    	}
                    });
                });
                
                room.addEventListener("room-closed", function (msg) {
                	if (msg.room !== $scope.roomName) {
                		console.error("Closed room name doesn't match this room's name", 
                				msg.room, $scope.roomName);
                	} else {
                		kurento.close(true);
                		ServiceParticipant.forceClose($window, LxNotificationService, 'Room '
                			+ msg.room + ' has been forcibly closed from server');
                	}
                });
                
                room.connect();
            });

            localStream.addEventListener("access-denied", function () {
            	ServiceParticipant.showError($window, LxNotificationService, {
            		error : {
            			message : "Access not granted to camera and microphone"
            				}
            	});
            });
            localStream.init();
        });

        //save kurento & roomName & userName in service
        ServiceRoom.setKurento(kurento);
        ServiceRoom.setRoomName($scope.roomName);
        ServiceRoom.setUserName($scope.userName);

        //redirect to call
        // $window.location.href = '#/call';
		$scope.joinShow = false;
		$scope.roomShow = true;
    };
    $scope.clear = function () {
        $scope.room = "";
        $scope.userName = "";
        $scope.roomName = "";
    };
	$scope.joinShow = true;





    $scope.participants = ServiceParticipant.getParticipants();
    $scope.kurento = ServiceRoom.getKurento();

    $scope.leaveRoom = function () {

        ServiceRoom.getKurento().close();

        ServiceParticipant.removeParticipants();

        //redirect to login
        //$window.location.href = '#/login';
    };

    window.onbeforeunload = function () {
    	//not necessary if not connected
    	if (ServiceParticipant.isConnected()) {
    		ServiceRoom.getKurento().close();
    	}
    };


    $scope.goFullscreen = function () {

        if (Fullscreen.isEnabled())
            Fullscreen.cancel();
        else
            Fullscreen.all();

    };

    $scope.onOffVolume = function () {
        var localStream = ServiceRoom.getLocalStream();
        var element = document.getElementById("buttonVolume");
        if (element.classList.contains("md-volume-off")) { //on
            element.classList.remove("md-volume-off");
            element.classList.add("md-volume-up");
            localStream.audioEnabled = true;
        } else { //off
            element.classList.remove("md-volume-up");
            element.classList.add("md-volume-off");
            localStream.audioEnabled = false;

        }
    };

    $scope.onOffVideocam = function () {
        var localStream = ServiceRoom.getLocalStream();
        var element = document.getElementById("buttonVideocam");
        if (element.classList.contains("md-videocam-off")) {//on
            element.classList.remove("md-videocam-off");
            element.classList.add("md-videocam");
            localStream.videoEnabled = true;
        } else {//off
            element.classList.remove("md-videocam");
            element.classList.add("md-videocam-off");
            localStream.videoEnabled = false;
        }
    };

    $scope.disconnectStream = function() {
    	var localStream = ServiceRoom.getLocalStream();
    	var participant = ServiceParticipant.getMainParticipant();
    	if (!localStream || !participant) {
    		LxNotificationService.alert('Error!', "Not connected yet", 'Ok', function(answer) {
            });
    		return false;
    	}
    	ServiceParticipant.disconnectParticipant(participant);
    	ServiceRoom.getKurento().disconnectParticipant(participant.getStream());
    }
    
    //chat
    $scope.message;

    $scope.sendMessage = function () {
        console.log("Sending message", $scope.message);
        var kurento = ServiceRoom.getKurento();
        kurento.sendMessage($scope.roomName, $scope.userName, $scope.message);
        $scope.message = "";
    };

});
