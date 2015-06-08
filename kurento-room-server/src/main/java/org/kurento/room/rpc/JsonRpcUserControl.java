/*
 * (C) Copyright 2015 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */

package org.kurento.room.rpc;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

import org.kurento.jsonrpc.Session;
import org.kurento.jsonrpc.Transaction;
import org.kurento.jsonrpc.message.Request;
import org.kurento.room.RoomManager;
import org.kurento.room.api.pojo.ParticipantRequest;
import org.kurento.room.api.pojo.UserParticipant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.google.gson.JsonObject;

/**
 * Controls the user interactions by delegating her JSON-RPC requests to the
 * room API.
 * 
 * @author <a href="mailto:rvlad@naevatec.com">Radu Tom Vlad</a>
 */
public class JsonRpcUserControl {

	private static final Logger log = LoggerFactory
			.getLogger(JsonRpcUserControl.class);

	@Autowired
	protected RoomManager roomManager;

	public void joinRoom(Transaction transaction, Request<JsonObject> request,
			ParticipantRequest participantRequest) throws IOException,
			InterruptedException, ExecutionException {
		String roomName = request.getParams()
				.get(JsonRpcProtocolElements.JOIN_ROOM_ROOM_PARAM)
				.getAsString();
		String userName = request.getParams()
				.get(JsonRpcProtocolElements.JOIN_ROOM_USER_PARAM)
				.getAsString();

		ParticipantSession participantSession = getParticipantSession(transaction);
		participantSession.setParticipantName(userName);
		participantSession.setRoomName(roomName);

		roomManager.joinRoom(userName, roomName, participantRequest);
	}

	public void publishVideo(Transaction transaction,
			Request<JsonObject> request, ParticipantRequest participantRequest) {
		final String sdpOffer = request.getParams()
				.get(JsonRpcProtocolElements.PUBLISH_VIDEO_SDPOFFER_PARAM)
				.getAsString();

		roomManager.publishMedia(sdpOffer, participantRequest);
	}

	public void receiveVideoFrom(final Transaction transaction,
			final Request<JsonObject> request,
			ParticipantRequest participantRequest) {

		String senderName = request.getParams()
				.get(JsonRpcProtocolElements.RECEIVE_VIDEO_SENDER_PARAM)
				.getAsString();

		senderName = senderName.substring(0, senderName.indexOf("_"));

		final String sdpOffer = request.getParams()
				.get(JsonRpcProtocolElements.RECEIVE_VIDEO_SDPOFFER_PARAM)
				.getAsString();

		roomManager.receiveMedia(senderName, sdpOffer, participantRequest);
	}

	public void leaveRoom(Transaction transaction, Request<JsonObject> request,
			ParticipantRequest participantRequest) {
		boolean exists = false;
		String pid = participantRequest.getParticipantId();

		// trying with room info from session
		String roomName = null;
		if (transaction != null)
			roomName = getParticipantSession(transaction).getRoomName();
		if (roomName == null) {
			log.warn(
					"No room information found for participant with session Id {}. "
							+ "Will have to browse through all participants.",
							pid);
			for (String room : roomManager.getRooms()) {
				for (UserParticipant part : roomManager.getParticipants(room))
					if (part.getParticipantId().equals(pid)) {
						exists = true;
						break;
					}
				if (exists)
					break;
			}
		} else
			for (UserParticipant part : roomManager.getParticipants(roomName))
				if (part.getParticipantId().equals(
						participantRequest.getParticipantId())) {
					exists = true;
					break;
				}
		if (exists)
			roomManager.leaveRoom(participantRequest);
		else
			log.warn("Participant with session Id {} has already left", pid);
	}

	public void onIceCandidate(Transaction transaction,
			Request<JsonObject> request, ParticipantRequest participantRequest) {
		String endpointName = request.getParams()
				.get(JsonRpcProtocolElements.ON_ICE_EP_NAME_PARAM)
				.getAsString();
		String candidate = request.getParams()
				.get(JsonRpcProtocolElements.ON_ICE_CANDIDATE_PARAM)
				.getAsString();
		String sdpMid = request.getParams()
				.get(JsonRpcProtocolElements.ON_ICE_SDP_MID_PARAM)
				.getAsString();
		int sdpMLineIndex = request.getParams()
				.get(JsonRpcProtocolElements.ON_ICE_SDP_M_LINE_INDEX_PARAM)
				.getAsInt();

		roomManager.onIceCandidate(endpointName, candidate, sdpMLineIndex,
				sdpMid, participantRequest);
	}

	public void sendMessage(Transaction transaction,
			Request<JsonObject> request, ParticipantRequest participantRequest) {
		final String userName = request.getParams()
				.get(JsonRpcProtocolElements.SENDMESSAGE_USER_PARAM)
				.getAsString();
		final String roomName = request.getParams()
				.get(JsonRpcProtocolElements.SENDMESSAGE_ROOM_PARAM)
				.getAsString();
		final String message = request.getParams()
				.get(JsonRpcProtocolElements.SENDMESSAGE_MESSAGE_PARAM)
				.getAsString();

		log.debug("Message from {} in room {}: '{}'", userName, roomName,
				message);

		roomManager
		.sendMessage(message, userName, roomName, participantRequest);
	}

	public ParticipantSession getParticipantSession(Transaction transaction) {
		Session session = transaction.getSession();
		ParticipantSession participantSession = (ParticipantSession) session
				.getAttributes().get(ParticipantSession.SESSION_KEY);
		if (participantSession == null) {
			participantSession = new ParticipantSession();
			session.getAttributes().put(ParticipantSession.SESSION_KEY,
					participantSession);
		}
		return participantSession;
	}
}