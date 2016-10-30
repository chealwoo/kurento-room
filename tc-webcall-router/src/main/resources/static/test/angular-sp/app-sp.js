/**
 * 
 * @param name
 * @returns {*}
 */
$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (results==null){
		return null;
	}
	else{
		return results[1] || 0;
	}
};

/**
 * @type {module}
 */
var webRtcPeer;
var pipeline;
var webRtcEndpoint;
var videoOn = ($.urlParam('vOn') === 'true');
var arrOutStats = [];
var arrInStats = [];

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

		$scope.roomName = room.roomName; // room.userName;
		$scope.userName = room.userName; // room.userName;

		var wsUri = 'wss://' + location.host + '/room';

		var wsUri2 = 'wss://172.26.111.99:8443/room';

		//show loopback stream from server
		var displayPublished = false;
		//also show local stream when display my remote
		var mirrorLocal = false;

		var kurento = KurentoRoom(wsUri, function (error, kurento) {
			if (error)
				return console.log(error);

			room = kurento.Room({
				room: $scope.roomName,
				user: $scope.userName
			});

			var myOption = videoOn === true ? {
				mandatory : {
					maxWidth : 320,
					maxFrameRate : 15,
					minFrameRate : 10
				} } : false;
			
			var localStream = kurento.Stream(room, {
				audio: true,
				video : myOption,
				recvVideo: videoOn,
				videoEnabled:videoOn
			});


			localStream.addEventListener("access-accepted", function () {
				room.addEventListener("room-connected", function (roomEvent) {
					var streams = roomEvent.streams;
					if (displayPublished ) {
						localStream.subscribeToMyRemote();
					}
					localStream.publish();
					ServiceRoom.setLocalStream(localStream.getWebRtcPeer());
					// -- Added for statstic
					webRtcPeer = localStream.getWebRtcPeer();
					console.log("MediaState is CONNECTED ... printing stats...");
					activateStatsTimeout();
					for (var i = 0; i < streams.length; i++) {
						ServiceParticipant.addParticipant(streams[i]);
						webRtcEndpoint = streams[i].getWebRtcPeer();
						activateStatsTimeout();					// -- Added for statstic
						console.log("MediaState is CONNECTED ... printing stats...");
					}
				});

				room.addEventListener("stream-published", function (streamEvent) {
					ServiceParticipant.addLocalParticipant(localStream);
					if (mirrorLocal && localStream.displayMyRemote()) {
						var localVideo = kurento.Stream(room, {
							// video: true,
							video: videoOn,
							id: "localStream"
						});
						localVideo.mirrorLocalStream(localStream.getWrStream());

						ServiceParticipant.addLocalMirror(localVideo);
					}
				});

				room.addEventListener("stream-added", function (streamEvent) {
					webRtcEndpoint = streamEvent.stream.getWebRtcPeer();
					activateStatsTimeout();					// -- Added for statstic
					console.log("MediaState is CONNECTED ... printing stats...");
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
					window.clearTimeout(activateStatsTimeoutScheduleID);
				});

				room.addEventListener("error-media", function (msg) {
					ServiceParticipant.alertMediaError($window, LxNotificationService, msg.error, function (answer) {
						console.warn("Leave room because of error: " + answer);
						if (answer) {
							kurento.close(true);
						}
					});
					window.clearTimeout(activateStatsTimeoutScheduleID);
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
					window.clearTimeout(activateStatsTimeoutScheduleID);
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
		window.clearTimeout(activateStatsTimeoutScheduleID);
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

	$scope.register({roomName:$.urlParam('roomName'), userName:$.urlParam('userName')});

	$('#userName').text($.urlParam('userName'));
	$('#roomName').text($.urlParam('roomName'));


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

var activateStatsTimeoutScheduleID;
function activateStatsTimeout() {
	activateStatsTimeoutScheduleID = setTimeout(function() {
	//	if (!webRtcPeer || !pipeline) return;
		printStats();
		activateStatsTimeout();
	}, 10000);
}

function sendStatus(stats) {
	$.post('https://' + location.hostname + ':8443/submitStats',
		{ 'room':$.urlParam('roomName'), 'user': $.urlParam('userName'), 'stats': JSON.stringify(stats) }).done(function( data ) {
	//	alert( "Data Loaded: " + data );
	});
}

/**
 *
 */
function printSDP() {
	var aa = webRtcPeer.getRemoteSessionDescriptor().sdp.split('\n');
	var bb = [];
	var sdpInfoStr = "";
	$.each(aa, function(index, data) {
		var tmp = data.split('=');
		var name = tmp[0];
		var value = tmp[1];
		var idx;
		if(name === 'a') {
			idx = value.indexOf(':');
			name = value.substring(0, idx);
			value = value.substring(idx + 1, value.length);
		}
		bb.push({ 'name': name, 'value': value });
		if(name === 'group'
			|| name === 'rtcp'
			|| name === 'rtpmap'
		) {
			sdpInfoStr += name + ':'  + value + ', ';
		}
	});

	$('#sdp').text(sdpInfoStr );
}

/**
 *
 */
function printStats() {

	printSDP();

	getBrowserOutgoingVideoStats(webRtcPeer, function(error, stats) {
		if (error) return console.log("Warning: could not gather browser outgoing stats: " + error);

		arrOutStats.push(stats);
	sendStatus(stats);
		document.getElementById('browserOutgoingSsrc').innerHTML = stats.ssrc;
		document.getElementById('browserBytesSent').innerHTML = stats.bytesSent;
		document.getElementById('browserPacketsSent').innerHTML = stats.packetsSent;
		document.getElementById('browserPliReceived').innerHTML = stats.pliCount;
		document.getElementById('browserFirReceived').innerHTML = stats.firCount;
		document.getElementById('browserNackReceived').innerHTML = stats.nackCount;
		document.getElementById('browserRtt').innerHTML = stats.roundTripTime;
		document.getElementById('browserOutboundPacketsLost').innerHTML = stats.packetsLost;
	});

	// getMediaElementStats(webRtcEndpoint, 'inboundrtp', 'VIDEO', function(error, stats) {
	// 	if (error) return console.log("Warning: could not gather webRtcEndpoing input stats: " + error);
    //
	// 	document.getElementById('kmsIncomingSsrc').innerHTML = stats.ssrc;
	// 	document.getElementById('kmsBytesReceived').innerHTML = stats.bytesReceived;
	// 	document.getElementById('kmsPacketsReceived').innerHTML = stats.packetsReceived;
	// 	document.getElementById('kmsPliSent').innerHTML = stats.pliCount;
	// 	document.getElementById('kmsFirSent').innerHTML = stats.firCount;
	// 	document.getElementById('kmsNackSent').innerHTML = stats.nackCount;
	// 	document.getElementById('kmsJitter').innerHTML = stats.jitter;
	// 	document.getElementById('kmsPacketsLost').innerHTML = stats.packetsLost;
	// 	document.getElementById('kmsFractionLost').innerHTML = stats.fractionLost;
	// 	document.getElementById('kmsRembSend').innerHTML = stats.remb;
	// });

	getBrowserIncomingVideoStats(webRtcEndpoint, function(error, stats) {
		if (error) return console.log("Warning: could not gather stats: " + error);

		arrInStats.push(stats);
	sendStatus(stats);
		document.getElementById('browserIncomingSsrc').innerHTML = stats.ssrc;
		document.getElementById('browserBytesReceived').innerHTML = stats.bytesReceived;
		document.getElementById('browserPacketsReceived').innerHTML = stats.packetsReceived;
		document.getElementById('browserPliSent').innerHTML = stats.pliCount;
		document.getElementById('browserFirSent').innerHTML = stats.firCount;
		document.getElementById('browserNackSent').innerHTML = stats.nackCount;
		document.getElementById('browserJitter').innerHTML = stats.jitter;
		document.getElementById('browserIncomingPacketLost').innerHTML = stats.packetLost;
	});

	// getMediaElementStats(webRtcEndpoint, 'outboundrtp', 'VIDEO', function(error, stats){
	// 	if (error) return console.log("Warning: could not gather webRtcEndpoing input stats: " + error);
    //
	// 	document.getElementById('kmsOutogingSsrc').innerHTML = stats.ssrc;
	// 	document.getElementById('kmsBytesSent').innerHTML = stats.bytesSent;
	// 	document.getElementById('kmsPacketsSent').innerHTML = stats.packetsSent;
	// 	document.getElementById('kmsPliReceived').innerHTML = stats.pliCount;
	// 	document.getElementById('kmsFirReceived').innerHTML = stats.firCount;
	// 	document.getElementById('kmsNackReceived').innerHTML = stats.nackCount;
	// 	document.getElementById('kmsRtt').innerHTML = stats.roundTripTime;
	// 	document.getElementById('kmsRembReceived').innerHTML = stats.remb;
	// });

	// getMediaElementStats(webRtcEndpoint, 'endpoint', 'VIDEO', function(error, stats){
	// 	if(error) return console.log("Warning: could not gather webRtcEndpoint endpoint stats: " + error);
	// 	document.getElementById('e2eLatency').innerHTML = stats.videoE2ELatency / 1000000 + " seconds";
	// });
}


function getBrowserOutgoingVideoStats(webRtcPeer, callback) {
	if (!webRtcPeer) return callback("Cannot get stats from null webRtcPeer");
	var peerConnection = webRtcPeer.peerConnection;
	if (!peerConnection) return callback("Cannot get stats from null peerConnection");
	var localVideoStream = peerConnection.getLocalStreams()[0];
	if (!localVideoStream) return callback("Non existent local stream: cannot read stats")
	var localVideoTrack = localVideoStream.getVideoTracks()[0];
	if (!localVideoTrack) {
		localVideoTrack = localVideoStream.getAudioTracks()[0];
		if (!localVideoTrack) {
			return callback("Non existent local track: cannot read stats");
		}
	}

	peerConnection.getStats(function(stats) {
		var results = stats.result();
		for (var i = 0; i < results.length; i++) {
			var res = results[i];
			if (res.type != 'ssrc') continue;

			//Publish it to be compliant with W3C stats draft
			var retVal = {
				timeStamp: res.timestamp,
				//StreamStats below
				associateStatsId: res.id,
				codecId: "--",
				firCount: res.stat('googFirsReceived'),
				isRemote: false,
				mediaTrackId: res.stat('googTrackId'),
				nackCount: res.stat('googNacksReceived'),
				pliCount: res.stat('googPlisReceived'),
				sliCount: 0,
				ssrc: res.stat('ssrc'),
				transportId: res.stat('transportId'),
				//Specific outbound below
				bytesSent: res.stat('bytesSent'),
				packetsSent: res.stat('packetsSent'),
				roundTripTime: res.stat('googRtt'),
				packetsLost: res.stat('packetsLost'),
				targetBitrate: "??",
				remb: "??"
			}
			return callback(null, retVal);
		}
		return callback("Error: could not find ssrc type on track stats", null);
	}, localVideoTrack);
}

function getBrowserIncomingVideoStats(webRtcPeer, callback) {
	if (!webRtcPeer) return callback("Cannot get stats from null webRtcPeer");
	var peerConnection = webRtcPeer.peerConnection;
	if (!peerConnection) return callback("Cannot get stats from null peerConnection");
	var remoteVideoStream = peerConnection.getRemoteStreams()[0];
	if (!remoteVideoStream) return callback("Non existent remote stream: cannot read stats")
	var remoteVideoTrack = remoteVideoStream.getVideoTracks()[0];
	if (!remoteVideoTrack) {
		remoteVideoTrack = remoteVideoStream.getAudioTracks()[0];
		if (!remoteVideoTrack) {
			return callback("Non existent remote track: cannot read stats");
		}
	}

	peerConnection.getStats(function(stats) {
		var results = stats.result();
		for (var i = 0; i < results.length; i++) {
			var res = results[i];
			if (res.type != 'ssrc') continue;

			//Publish it to be compliant with W3C stats draft
			var retVal = {
				timeStamp: res.timestamp,
				//StreamStats below
				associateStatsId: res.id,
				codecId: "--",
				firCount: res.stat('googFirsSent'),
				isRemote: true,
				mediaTrackId: res.stat('googTrackId'),
				nackCount: res.stat('googNacksSent'),
				pliCount: res.stat('googPlisSent'),
				sliCount: 0,
				ssrc: res.stat('ssrc'),
				transportId: res.stat('transportId'),
				//Specific outbound below
				bytesReceived: res.stat('bytesReceived'),
				packetsReceived: res.stat('packetsReceived'),
				jitter: res.stat('googJitterBufferMs'),
				packetLost: res.stat('packetsLost'),
				remb: "??"
			}
			return callback(null, retVal);
		}
		return callback("Error: could not find ssrc type on track stats", null);
	}, remoteVideoTrack);
}

/*
 Parameters:

 mediaElement: valid reference of a media element.

 statsType: one of
 inboundrtp
 outboundrtp
 datachannel
 element
 endpoint

 mediaType: one of
 AUDIO
 VIDEO
 */
function getMediaElementStats(mediaElement, statsType, mediaType, callback){
	if (!mediaElement) return callback('Cannot get stats from null Media Element');
	if(!statsType) return callback('Cannot get stats with undefined statsType')
	if(!mediaType) mediaType = 'VIDEO'; //By default, video
	mediaElement.getStats(mediaType, function(error, statsMap){
		if(error) return callback(error);
		for(var key in statsMap){
			if(!statsMap.hasOwnProperty(key)) continue; //do not dig in prototypes properties

			stats = statsMap[key];
			if(stats.type != statsType) continue; //look for the type we want

			return callback(null, stats)
		}
		return callback('Cound not find ' +
			statsType + ':' + mediaType +
			' stats in element ' + mediaElement.id);
	});
}

//Aux function used for printing stats associated to a track.
function listStats(peerConnection, webRtcEndpoint) {
	var localVideoTrack = peerConnection.getLocalStreams()[0].getVideoTracks()[0];
	var remoteVideoTrack = peerConnection.getRemoteStreams()[0].getVideoTracks()[0];

	peerConnection.getStats(function(stats) {
		var results = stats.result();

		for (var i = 0; i < results.length; i++) {
			console.log("Iterating i=" + i);
			var res = results[i];
			console.log("res.type=" + res.type);
			var names = res.names();

			for (var j = 0; j < names.length; j++) {
				var name = names[j];
				var stat = res.stat(name);
				console.log("For name " + name + " stat is " + stat);
			}
		}
	}, remoteVideoTrack);
}
