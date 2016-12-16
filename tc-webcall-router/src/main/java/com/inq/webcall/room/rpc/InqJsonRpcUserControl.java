/*
 * (C) Copyright 2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.inq.webcall.room.rpc;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

import com.inq.monitor.systemmonitor.SystemMonitor;
import com.inq.saml.TokenValidator;
import com.inq.webcall.WebCallApplication;
import com.inq.webcall.room.InqNotificationRoomManager;
import org.kurento.client.FaceOverlayFilter;
import org.kurento.client.MediaElement;
import org.kurento.jsonrpc.Transaction;
import org.kurento.jsonrpc.message.Request;
import org.kurento.room.NotificationRoomManager;
import org.kurento.room.api.pojo.ParticipantRequest;
import org.kurento.room.api.pojo.UserParticipant;
import org.kurento.room.internal.ProtocolElements;
import org.kurento.room.rpc.JsonRpcUserControl;
import org.kurento.room.rpc.ParticipantSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.JsonObject;

/**
 * User control that applies a face overlay filter when publishing video.
 *
 * @author Radu Tom Vlad (rvlad@naevatec.com)
 */
public class InqJsonRpcUserControl extends JsonRpcUserControl {

    private static final String SESSION_ATTRIBUTE_HAT_FILTER = "hatFilter";

    private static final String CUSTOM_REQUEST_HAT_PARAM = "hat";

    private static final Logger log = LoggerFactory.getLogger(InqJsonRpcUserControl.class);

    private String hatUrl;

    private float offsetXPercent;
    private float offsetYPercent;
    private float widthPercent;
    private float heightPercent;
    private InqNotificationRoomManager roomManager;

    public InqJsonRpcUserControl(InqNotificationRoomManager roomManager) {
        super(roomManager);
        this.roomManager = roomManager;

        // TODO
        SystemMonitor.roomManager = roomManager;
    }

    public void joinRoom(Transaction transaction, Request<JsonObject> request,
                         ParticipantRequest participantRequest) throws IOException, InterruptedException,
            ExecutionException {
        String roomName = getStringParam(request, ProtocolElements.JOINROOM_ROOM_PARAM);
        String userName = getStringParam(request, ProtocolElements.JOINROOM_USER_PARAM);

        boolean dataChannels = false;
        if (request.getParams().has(ProtocolElements.JOINROOM_DATACHANNELS_PARAM)) {
            dataChannels = request.getParams().get(ProtocolElements.JOINROOM_DATACHANNELS_PARAM)
                    .getAsBoolean();
        }

        String authToken = "";
        try {
            authToken = getStringParam(request, ProtocolElements.JOINROOM_TOKEN_PARAM);
        } catch (RuntimeException e) {
            if (!e.getMessage().contains("Request element")) {
                throw e;
            }
        }

        ParticipantSession participantSession = getParticipantSession(transaction);
        participantSession.setParticipantName(userName);
        participantSession.setRoomName(roomName);
        participantSession.setDataChannels(dataChannels);

        roomManager.joinRoom(userName, roomName, dataChannels, true, participantRequest, authToken);
    }

    /**
     * RTDEV-15263 close a room with request from customer, need to have room token.
     *
     * @param transaction
     * @param request
     * @param participantRequest
     */
    public void closeRoom(Transaction transaction, Request<JsonObject> request,
                          ParticipantRequest participantRequest) {
        boolean exists = false;
        String pid = participantRequest.getParticipantId();
        // trying with room info from session
        String roomName = null;
        if (transaction != null) {
            roomName = getParticipantSession(transaction).getRoomName();
        }

        String authToken = "";
        try {
            authToken = getStringParam(request, ProtocolElements.JOINROOM_TOKEN_PARAM);
        } catch (RuntimeException e) {
            if (!e.getMessage().contains("Request element")) {
                throw e;
            }
        }

        if (roomName == null) { // null when afterConnectionClosed
            log.warn("No room information found for participant with session Id {}. "
                    + "Using the admin method to evict the user.", pid);
            leaveRoomAfterConnClosed(pid);
        } else {
            // sanity check, don't call leaveRoom unless the id checks out
            for (UserParticipant part : roomManager.getParticipants(roomName)) {
                if (part.getParticipantId().equals(participantRequest.getParticipantId())) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                log.debug("Participant with sessionId {} is leaving room {}", pid, roomName);
                roomManager.leaveRoom(participantRequest);
                log.info("Participant with sessionId {} has left room {}", pid, roomName);
            } else {
                log.warn("Participant with session Id {} not found in room {}. "
                        + "Using the admin method to evict the user.", pid, roomName);
                leaveRoomAfterConnClosed(pid);
            }

            if (!WebCallApplication.SSO_AUTH_CHECK || roomManager.checkRoomToken(roomName, authToken)) {
                if (roomName != null) { // null when afterConnectionClosed
                    log.info("Participant with sessionId {} has request to close room {}", pid, roomName);
                    roomManager.closeRoom(roomName);
                }
            } else {
                log.warn("Participant with sessionId {} has request to close room {} But No room information found with the room name {}"
                        + " or Authentication has failed. Hence using the admin method to evict the user.", pid, roomName);
            }
        }
    }

    public void setHatUrl(String hatUrl) {
        this.hatUrl = hatUrl;
//    log.info("Hat URL: {}", hatUrl);
    }

    public void setHatCoords(JsonObject hatCoords) {
        if (hatCoords.get("offsetXPercent") != null) {
            offsetXPercent = hatCoords.get("offsetXPercent").getAsFloat();
        }
        if (hatCoords.get("offsetYPercent") != null) {
            offsetYPercent = hatCoords.get("offsetYPercent").getAsFloat();
        }
        if (hatCoords.get("widthPercent") != null) {
            widthPercent = hatCoords.get("widthPercent").getAsFloat();
        }
        if (hatCoords.get("heightPercent") != null) {
            heightPercent = hatCoords.get("heightPercent").getAsFloat();
        }
//    log.info("Hat coords:\n\toffsetXPercent = {}\n\toffsetYPercent = {}"
//        + "\n\twidthPercent = {}\n\theightPercent = {}", offsetXPercent, offsetYPercent,
//        widthPercent, heightPercent);
    }

    @Override
    public void customRequest(Transaction transaction, Request<JsonObject> request,
                              ParticipantRequest participantRequest) {
        try {
            if (request.getParams() == null || request.getParams().get(CUSTOM_REQUEST_HAT_PARAM) == null) {
                throw new RuntimeException("Request element '" + CUSTOM_REQUEST_HAT_PARAM + "' is missing");
            }
            boolean hatOn = request.getParams().get(CUSTOM_REQUEST_HAT_PARAM).getAsBoolean();
            String pid = participantRequest.getParticipantId();
            if (hatOn) {
                if (transaction.getSession().getAttributes().containsKey(SESSION_ATTRIBUTE_HAT_FILTER)) {
                    throw new RuntimeException("Hat filter already on");
                }
                log.info("Applying face overlay filter to session {}", pid);
                FaceOverlayFilter faceOverlayFilter = new FaceOverlayFilter.Builder(
                        ((InqNotificationRoomManager) roomManager).getPipeline(pid)).build();
                faceOverlayFilter.setOverlayedImage(this.hatUrl, this.offsetXPercent, this.offsetYPercent,
                        this.widthPercent, this.heightPercent);
                ((InqNotificationRoomManager) roomManager).addMediaElement(pid, faceOverlayFilter);
                transaction.getSession().getAttributes()
                        .put(SESSION_ATTRIBUTE_HAT_FILTER, faceOverlayFilter);
            } else {
                if (!transaction.getSession().getAttributes().containsKey(SESSION_ATTRIBUTE_HAT_FILTER)) {
                    throw new RuntimeException("This user has no hat filter yet");
                }
                log.info("Removing face overlay filter from session {}", pid);
                ((InqNotificationRoomManager) roomManager).removeMediaElement(pid, (MediaElement) transaction.getSession().getAttributes()
                        .get(SESSION_ATTRIBUTE_HAT_FILTER));
                transaction.getSession().getAttributes().remove(SESSION_ATTRIBUTE_HAT_FILTER);
            }
            transaction.sendResponse(new JsonObject());
        } catch (Exception e) {
            log.error("Unable to handle custom request", e);
            try {
                transaction.sendError(e);
            } catch (IOException e1) {
                log.warn("Unable to send error response", e1);
            }
        }
    }
}
