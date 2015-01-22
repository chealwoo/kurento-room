// Room --------------------------------

function Room(kurento, options) {

	var that = this;

	that.name = options.room;

	var ee = new EventEmitter();
	var streams = {};
	var participants = {};
	var connected = false;
	var localParticipant;
	var subscribeToStreams = options.subscribeToStreams || true;

	this.getLocalParticipant = function(){
		return localParticipant;
	}

	this.addEventListener = function(eventName, listener) {
		ee.addListener(eventName, listener);
	}

	this.emitEvent = function(eventName, eventsArray) {
		ee.emitEvent(eventName, eventsArray);
	}

	this.connect = function() {

		kurento.sendRequest('joinRoom', {
			user : options.user,
			room : options.room
		}, function(error, response) {
			if (error) {
				console.error(error);
			} else {

				connected = true;

				var exParticipants = response.value;

				var roomEvent = {
					participants : [],
					streams : []
				}

				var length = exParticipants.length;
				for (var i = 0; i < length; i++) {

					var participant = new Participant(kurento, false, that,
							exParticipants[i]);

					participants[participant.getID()] = participant;

					roomEvent.participants.push(participant);

					var streams = participant.getStreams();
					for (var key in streams) {
						roomEvent.streams.push(streams[key]);
						if(subscribeToStreams){
							streams[key].subscribe();
						}
					}
				}

				ee.emitEvent('room-connected', [ roomEvent ]);
			}
		});
	}


	this.subscribe = function(stream) {
		stream.subscribe();
	}

	this.onParticipantJoined = function(msg) {

		var participant = new Participant(kurento, false, that, msg);

		participants[participant.getID()] = participant;

		ee.emitEvent('participant-joined', [ {
			participant : participant
		} ]);

		var streams = participant.getStreams();
		for ( var key in streams) {

			ee.emitEvent('stream-added', [ {
				stream : streams[key]
			} ]);

			if(subscribeToStreams){
				streams[key].subscribe();
			}
		}
	}

	this.onParticipantLeft = function(msg) {

		var participant = participants[msg.name];

		if (participant !== undefined) {
			delete participants[msg.name];

			ee.emitEvent('participant-left', [ {
				participant : participant
			} ]);

			var streams = participant.getStreams();
			for ( var key in streams) {
				ee.emitEvent('stream-removed', [ {
					stream : streams[key]
				} ]);
			}

			participant.dispose();
		} else {
			console
					.error("Participant " + msg.name
							+ " unknown. Participants: "
							+ JSON.stringify(participants));
		}
	}

	this.leave = function() {

		if (connected) {
			kurento.sendRequest('leaveRoom', function(error, response) {
				if (error) {
					console.error(error);
				} else {
					connected = false;
				}
			});
		}

		for ( var key in participants) {
			participants[key].dispose();
		}
	}

	this.getStreams = function() {
		return streams;
	}

	localParticipant = new Participant(kurento, true, that, {id:options.user});
	participants[options.user] = localParticipant;
}

// Participant --------------------------------

function Participant(kurento, local, room, options) {

	var that = this;
	var id = options.id;

	var streams = {};

	if (options.streams) {
		for (var i = 0; i < options.streams.length; i++) {

			var stream = new Stream(kurento, false, room, {
				id : options.streams[i].id,
				participant : that
			});

			addStream(stream);
		}
	}

	that.setId = function(newId){
		id = newId;
	}

	function addStream(stream) {
		streams[stream.getID()] = stream;
	}

	that.addStream = addStream;

	that.getStreams = function() {
		return streams;
	}

	that.dispose = function() {
		for ( var key in streams) {
			streams[key].dispose();
		}
	}

	that.getID = function() {
		return id;
	}
}

// Stream --------------------------------

/*
 * options: name: XXX data: true (Maybe this is based on webrtc) audio: true,
 * video: true, url: "file:///..." > Player screen: true > Desktop (implicit
 * video:true, audio:false) audio: true, video: true > Webcam
 *
 * stream.hasAudio(); stream.hasVideo(); stream.hasData();
 */
function Stream(kurento, local, room, options) {

	var that = this;

	that.room = room;

	var ee = new EventEmitter();
	var sdpOffer;
	var wrStream;
	var wp;
	var id;
	if(options.id){
		id = options.id;
	} else {
		id = "webcam";
	}

	var videoElements = [];
	var elements = [];
	var participant = options.participant;

	this.addEventListener = function(eventName, listener) {
		ee.addListener(eventName, listener);
	}

	this.playOnlyVideo = function(element) {

		var video = document.createElement('video');

		if (typeof element === "string") {
			document.getElementById(element).appendChild(video);
		} else {
			element.appendChild(video);
		}

		video.id = 'native-video-' + that.getGlobalID();
		video.autoplay = true;
		video.controls = false;
		if (wrStream) {
			video.src = URL.createObjectURL(wrStream);
		}

		videoElements.push(video);

		if (local) {
			video.setAttribute("muted", "muted");
		}
	}

	this.play = function(elementId) {

		var container = document.createElement('div');
		container.className = "participant";
		container.id = that.getGlobalID();
		document.getElementById(elementId).appendChild(container);

		elements.push(container);

		var name = document.createElement('div');
		container.appendChild(name);
		name.appendChild(document.createTextNode(that.getGlobalID()));
		name.id = "name-" + that.getGlobalID();
		name.className = "name";

		that.playOnlyVideo(container);

	}

	this.getID = function() {
		return id;
	}

	this.getGlobalID = function() {
		if (participant) {
			return participant.getID() + "_" + id;
		} else {
			return id + "_webcam";
		}
	}

	this.init = function() {

		participant.addStream(that);

		var constraints = {
			audio : true,
			video : {
				mandatory : {
					maxWidth : 640,
					maxFrameRate : 15,
					minFrameRate : 15
				}
			}
		};

		getUserMedia(constraints, function(userStream) {
			wrStream = userStream;
			ee.emitEvent('access-accepted', null);
		}, function(error) {
			console.error(JSON.stringify(error));
		});
	}

	function initWebRtcPeer(sdpOfferCallback) {

		var startVideoCallback = function(sdpOfferParam) {
			sdpOffer = sdpOfferParam;
			kurento.sendRequest("receiveVideoFrom", {
				sender : that.getGlobalID(),
				sdpOffer : sdpOffer
			}, function(error, response) {
				if (error) {
					console.error(JSON.stringify(error));
				} else {
					that.processSdpAnswer(response.sdpAnswer);
				}
			});
		}

		var onerror = function(error) {
			console.error(error);
		}

		var mode = local ? "send" : "recv";

		wp = new kurentoUtils.WebRtcPeer(mode, null, null, startVideoCallback,
				onerror, null, null);

		wp.stream = wrStream;
		wp.start();

		console.log(name + " waiting for SDP offer");
	}

	this.publish = function() {

		// FIXME: Throw error when stream is not local

		initWebRtcPeer();

		// FIXME: Now we have coupled connecting to a room and adding a
		// stream to this room. But in the new API, there are two steps.
		// This is the second step. For now, it do nothing.

	}

	this.subscribe = function() {

		// FIXME: In the current implementation all participants are subscribed
		// automatically to all other participants. We use this method only to
		// negotiate SDP

		// Refactor this to avoid code duplication
		initWebRtcPeer();
	}

	this.processSdpAnswer = function(sdpAnswer) {

		var answer = new RTCSessionDescription({
			type : 'answer',
			sdp : sdpAnswer,
		});

		console.log('SDP answer received, setting remote description');

		wp.pc.setRemoteDescription(answer, function() {
			if (!local) {
				// FIXME: This avoid to subscribe to your own stream remotely.
				// Fix this
				wrStream = wp.pc.getRemoteStreams()[0];

				for (i = 0; i < videoElements.length; i++) {
					videoElements[i].src = URL.createObjectURL(wrStream);
				}

				that.room.emitEvent('stream-subscribed', [ {
					stream : that
				} ]);
			}
		}, function(error) {
			console.error(JSON.stringify(error))
		});
	}

	this.dispose = function() {

		function disposeElement(element) {
			if (element && element.parentNode) {
				element.parentNode.removeChild(element);
			}
		}

		for (i = 0; i < elements.length; i++) {
			disposeElement(elements[i]);
		}

		for (i = 0; i < videoElements.length; i++) {
			disposeElement(videoElements[i]);
		}

		if (wp.pc && wp.pc.signalingState != 'closed')
			wp.pc.close();

		if (wrStream) {
			wrStream.getAudioTracks().forEach(function(track) {
				track.stop && track.stop()
			})
			wrStream.getVideoTracks().forEach(function(track) {
				track.stop && track.stop()
			})
		}

		console.log("Stream " + id + " disposed");
	}
}

// KurentoRoom --------------------------------

function KurentoRoom(wsUri, callback) {

	if (!(this instanceof KurentoRoom))
		return new KurentoRoom(wsUri, callback);

	// Enable and disable iceServers from code
	kurentoUtils.WebRtcPeer.prototype.server.iceServers = [];

	var that = this;

	var userName;

	var ws = new WebSocket(wsUri);

	ws.onopen = function() {
		callback(null, that);
	}

	ws.onerror = function(evt) {
		callback(evt.data);
	}

	ws.onclose = function() {
		console.log("Connection Closed");
	}

	var options = {
		request_timeout : 50000
	};
	var rpc = new RpcBuilder(RpcBuilder.packers.JsonRPC, options, ws, function(
			request) {
		console.info('Received request: ' + JSON.stringify(request));

		switch (request.method) {
		case 'participantJoined':
			onParticipantJoined(request.params);
			break;
		case 'participantLeft':
			onParticipantLeft(request.params);
			break;
		default:
			console.error('Unrecognized request: ' + JSON.stringify(request));
		}
		;
	});

	function onParticipantJoined(msg) {
		if (room !== undefined) {
			room.onParticipantJoined(msg);
		}
	}

	function onParticipantLeft(msg) {
		if (room !== undefined) {
			room.onParticipantLeft(msg);
		}
	}

	this.sendRequest = function(method, params, callback) {
		rpc.encode(method, params, callback);
		console.log('Sent request: { method:"' + method + "', params: "
				+ JSON.stringify(params) + " }");
	}

	this.close = function() {
		if (room !== undefined) {
			room.leave();
		}
		ws.close();
	}

	this.Stream = function(room, options) {
		options.participant = room.getLocalParticipant();
		return new Stream(that, true, room, options);
	}

	this.Room = function(options) {
		// FIXME Support more than one room
		room = new Room(that, options);
		// FIXME Include name in stream, not in room
		usarName = options.userName;
		return room;
	}
}
