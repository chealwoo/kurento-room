package com.inq.webcall.room.internal;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.inq.webcall.WebCallApplication;
import com.inq.webcall.dao.RoomErrorMdbService;
import com.inq.webcall.room.api.InqINotificationRoomHandler;
import org.kurento.client.IceCandidate;
import org.kurento.commons.exception.KurentoException;
import org.kurento.room.api.UserNotificationService;
import org.kurento.room.api.pojo.ParticipantRequest;
import org.kurento.room.api.pojo.UserParticipant;
import org.kurento.room.exception.RoomException;
import org.kurento.room.internal.ProtocolElements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;


public class InqNotificationRoomHandler implements InqINotificationRoomHandler {

    private final Logger log = LoggerFactory.getLogger(InqNotificationRoomHandler.class);

    private UserNotificationService notifService;

    public InqNotificationRoomHandler(UserNotificationService notifService) {
        this.notifService = notifService;
    }

    @Override
    public void onRoomClosed(String roomName, Set<UserParticipant> participants) {
        JsonObject notifParams = new JsonObject();
        notifParams.addProperty(ProtocolElements.ROOMCLOSED_ROOM_PARAM, roomName);
        for (UserParticipant participant : participants) {
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.ROOMCLOSED_METHOD, notifParams);
        }
    }


    @Override
    public void onParticipantJoined(ParticipantRequest request, String roomName, String newUserName,
                                    Set<UserParticipant> existingParticipants, RoomException error) {
        onParticipantJoined(request, roomName, newUserName, existingParticipants, null, error);
    }

    @Override
    public void onParticipantJoined(ParticipantRequest request, String roomName, String newUserName,
                                    Set<UserParticipant> existingParticipants, InqKurentoClientSessionInfo kcSessionInfo, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            RoomErrorMdbService.saveRoomError(roomName, newUserName, "onParticipantJoined", error);
            return;
        }
        JsonArray result = new JsonArray();

        // Adding new room notification
        if(kcSessionInfo != null) {
            JsonObject newRoom = new JsonObject();
            newRoom.addProperty(InqProtocolElements.CREATEROOM_KMS_URI_PARAM, kcSessionInfo.getKmsUri());
            result.add(newRoom);
        }

        for (UserParticipant participant : existingParticipants) {
            JsonObject participantJson = new JsonObject();
            participantJson
                    .addProperty(ProtocolElements.JOINROOM_PEERID_PARAM, participant.getUserName());
            if (participant.isStreaming()) {
                JsonObject stream = new JsonObject();
                stream.addProperty(ProtocolElements.JOINROOM_PEERSTREAMID_PARAM, "webcam");
                JsonArray streamsArray = new JsonArray();
                streamsArray.add(stream);
                participantJson.add(ProtocolElements.JOINROOM_PEERSTREAMS_PARAM, streamsArray);
            }
            result.add(participantJson);

            JsonObject notifParams = new JsonObject();
            notifParams.addProperty(ProtocolElements.PARTICIPANTJOINED_USER_PARAM, newUserName);
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.PARTICIPANTJOINED_METHOD, notifParams);
        }
        notifService.sendResponse(request, result);
    }

    // @Override
    public void onRoomCreated(ParticipantRequest request, String roomName, String newUserName,
                                    Set<UserParticipant> existingParticipants, InqKurentoClientSessionInfo kcSessionInfo, RoomException error) {
        String authToken = kcSessionInfo.getAuthToken();
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            RoomErrorMdbService.saveRoomError(roomName, newUserName, "onRoomCreated", error);
            return;
        }
        JsonArray result = new JsonArray();

        // Adding new room notification
        JsonObject newRoom = new JsonObject();
        newRoom.addProperty(ProtocolElements.CREATEROOM_APPID_PARAM, WebCallApplication.DEFAULT_APP_SERVER_URL);
        newRoom.addProperty(ProtocolElements.CREATEROOM_TOKEN_PARAM, authToken);
        newRoom.addProperty(InqProtocolElements.CREATEROOM_KMS_URI_PARAM, kcSessionInfo.getKmsUri());
        result.add(newRoom);

        for (UserParticipant participant : existingParticipants) {
            JsonObject participantJson = new JsonObject();
            participantJson
                    .addProperty(ProtocolElements.JOINROOM_PEERID_PARAM, participant.getUserName());
            if (participant.isStreaming()) {
                JsonObject stream = new JsonObject();
                stream.addProperty(ProtocolElements.JOINROOM_PEERSTREAMID_PARAM, "webcam");
                JsonArray streamsArray = new JsonArray();
                streamsArray.add(stream);
                participantJson.add(ProtocolElements.JOINROOM_PEERSTREAMS_PARAM, streamsArray);
            }
            result.add(participantJson);

            JsonObject notifParams = new JsonObject();
            notifParams.addProperty(ProtocolElements.PARTICIPANTJOINED_USER_PARAM, newUserName);
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.PARTICIPANTJOINED_METHOD, notifParams);
        }
        notifService.sendResponse(request, result);
    }

    @Override
    public void onParticipantLeft(ParticipantRequest request, String userName,
                                  Set<UserParticipant> remainingParticipants, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }

        JsonObject params = new JsonObject();
        params.addProperty(ProtocolElements.PARTICIPANTLEFT_NAME_PARAM, userName);
        for (UserParticipant participant : remainingParticipants) {
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.PARTICIPANTLEFT_METHOD, params);
        }

        notifService.sendResponse(request, new JsonObject());
        notifService.closeSession(request);
    }

    @Override
    public void onPublishMedia(ParticipantRequest request, String publisherName, String sdpAnswer,
                               Set<UserParticipant> participants, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }
        JsonObject result = new JsonObject();
        result.addProperty(ProtocolElements.PUBLISHVIDEO_SDPANSWER_PARAM, sdpAnswer);
        notifService.sendResponse(request, result);

        JsonObject params = new JsonObject();
        params.addProperty(ProtocolElements.PARTICIPANTPUBLISHED_USER_PARAM, publisherName);
        JsonObject stream = new JsonObject();
        stream.addProperty(ProtocolElements.PARTICIPANTPUBLISHED_STREAMID_PARAM, "webcam");
        JsonArray streamsArray = new JsonArray();
        streamsArray.add(stream);
        params.add(ProtocolElements.PARTICIPANTPUBLISHED_STREAMS_PARAM, streamsArray);

        for (UserParticipant participant : participants) {
            if (participant.getParticipantId().equals(request.getParticipantId())) {
                continue;
            } else {
                notifService.sendNotification(participant.getParticipantId(),
                        ProtocolElements.PARTICIPANTPUBLISHED_METHOD, params);
            }
        }
    }

    @Override
    public void onUnpublishMedia(ParticipantRequest request, String publisherName,
                                 Set<UserParticipant> participants, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }
        notifService.sendResponse(request, new JsonObject());

        JsonObject params = new JsonObject();
        params.addProperty(ProtocolElements.PARTICIPANTUNPUBLISHED_NAME_PARAM, publisherName);

        for (UserParticipant participant : participants) {
            if (participant.getParticipantId().equals(request.getParticipantId())) {
                continue;
            } else {
                notifService.sendNotification(participant.getParticipantId(),
                        ProtocolElements.PARTICIPANTUNPUBLISHED_METHOD, params);
            }
        }
    }

    @Override
    public void onSubscribe(ParticipantRequest request, String sdpAnswer, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }
        JsonObject result = new JsonObject();
        result.addProperty(ProtocolElements.RECEIVEVIDEO_SDPANSWER_PARAM, sdpAnswer);
        notifService.sendResponse(request, result);
    }

    @Override
    public void onUnsubscribe(ParticipantRequest request, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }
        notifService.sendResponse(request, new JsonObject());
    }

    @Override
    public void onSendMessage(ParticipantRequest request, String message, String userName,
                              String roomName, Set<UserParticipant> participants, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }
        notifService.sendResponse(request, new JsonObject());

        JsonObject params = new JsonObject();
        params.addProperty(ProtocolElements.PARTICIPANTSENDMESSAGE_ROOM_PARAM, roomName);
        params.addProperty(ProtocolElements.PARTICIPANTSENDMESSAGE_USER_PARAM, userName);
        params.addProperty(ProtocolElements.PARTICIPANTSENDMESSAGE_MESSAGE_PARAM, message);

        for (UserParticipant participant : participants) {
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.PARTICIPANTSENDMESSAGE_METHOD, params);
        }
    }

    @Override
    public void onRecvIceCandidate(ParticipantRequest request, RoomException error) {
        if (error != null) {
            notifService.sendErrorResponse(request, null, error);
            return;
        }

        notifService.sendResponse(request, new JsonObject());
    }

    @Override
    public void onParticipantLeft(String userName, Set<UserParticipant> remainingParticipants) {
        JsonObject params = new JsonObject();
        params.addProperty(ProtocolElements.PARTICIPANTLEFT_NAME_PARAM, userName);
        for (UserParticipant participant : remainingParticipants) {
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.PARTICIPANTLEFT_METHOD, params);
        }
    }

    @Override
    public void onParticipantEvicted(UserParticipant participant) {
        try {
            notifService.sendNotification(participant.getParticipantId(),
                    ProtocolElements.PARTICIPANTEVICTED_METHOD, new JsonObject());
        } catch (KurentoException e) {
            log.warn("Exception while participantEvicted event (participant may have disconnected alreay)\n" + e.getMessage());
        }
    }

    // ------------ EVENTS FROM ROOM HANDLER -----

    @Override
    public void onIceCandidate(String roomName, String participantId, String endpointName,
                               IceCandidate candidate) {
        JsonObject params = new JsonObject();
        params.addProperty(ProtocolElements.ICECANDIDATE_EPNAME_PARAM, endpointName);
        params.addProperty(ProtocolElements.ICECANDIDATE_SDPMLINEINDEX_PARAM,
                candidate.getSdpMLineIndex());
        params.addProperty(ProtocolElements.ICECANDIDATE_SDPMID_PARAM, candidate.getSdpMid());
        params.addProperty(ProtocolElements.ICECANDIDATE_CANDIDATE_PARAM, candidate.getCandidate());
        notifService.sendNotification(participantId, ProtocolElements.ICECANDIDATE_METHOD, params);
    }

    @Override
    public void onPipelineError(String roomName, Set<String> participantIds, String description) {
        log.warn("ROOM {}: Pipeline error encountered: {}", roomName, description);

        JsonObject notifParams = new JsonObject();
        notifParams.addProperty(ProtocolElements.MEDIAERROR_ERROR_PARAM, description);

        for (String pid : participantIds) {
//            notifService.sendNotification(pid, ProtocolElements.MEDIAERROR_METHOD, notifParams);
        }
    }

    @Override
    public void onMediaElementError(String roomName, String participantId, String description) {
        log.warn("ROOM {}: MediaElementError encountered: {}", roomName, description);

        JsonObject notifParams = new JsonObject();
        notifParams.addProperty(ProtocolElements.MEDIAERROR_ERROR_PARAM, description);
//        notifService.sendNotification(participantId, ProtocolElements.MEDIAERROR_METHOD, notifParams);
    }

}
