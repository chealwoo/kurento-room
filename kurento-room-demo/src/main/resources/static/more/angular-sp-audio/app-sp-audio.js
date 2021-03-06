var kurento_room = angular.module('kurento_room', ['FBAngular', 'lumx']);

kurento_room.controller('callController', function ($scope, $window, ServiceParticipant, ServiceRoom, Fullscreen, LxNotificationService ) {

	$scope.showRoom = false;
	$scope.register = function (room) {

		if (false && !room)
			ServiceParticipant.showError($window, LxNotificationService, {
				error: {
					message:"Username and room fields are both required"
				}
			});

		$scope.userName = room.userName; // room.userName;
		$scope.roomName = room.roomName; // room.roomName;

		var wsUri = 'wss://' + location.host + '/room';

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
				video : false,
				recvVideo: false,
				videoEnabled:false
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
							video: false,
							recvVideo:false,
							videoEnabled:false,
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
		$scope.showRoom = true;
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

		// maybe show survey?
		//jQuery('#inqChatStage', top.window.document).show();
//		top.inQ.chatInfo.afterCallBack();
	}

	//chat
	$scope.message;

	$scope.sendMessage = function () {
		console.log("Sending message", $scope.message);
		var kurento = ServiceRoom.getKurento();
		kurento.sendMessage($scope.roomName, $scope.userName, $scope.message);
		$scope.message = "";
	};

//	$scope.register();
//});

//});

});


kurento_room.factory('ServiceParticipant', function () {
	return new Participants();
});


kurento_room.service('ServiceRoom', function () {

	var kurento;
	var roomName;
	var userName;
	var localStream;

	this.getKurento = function () {
		return kurento;
	};

	this.getRoomName = function () {
		return roomName;
	};

	this.setKurento = function (value) {
		kurento = value;
	};

	this.setRoomName = function (value) {
		roomName = value;
	};

	this.getLocalStream = function () {
		return localStream;
	};

	this.setLocalStream = function (value) {
		localStream = value;
	};

	this.getUserName = function () {
		return userName;
	};

	this.setUserName = function (value) {
		userName = value;
	};
});


 /*
angular.element(document).ready(function() {
	angular.bootstrap(document, ['kurento_room']);
});
   */