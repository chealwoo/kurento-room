package com.inq.webcall.room;

import com.inq.webcall.dao.RoomErrorMdbService;
import com.inq.webcall.monitor.systemmonitor.SystemMonitor;
import com.inq.webcall.room.api.InqKurentoClientProvider;
import com.inq.webcall.room.internal.InqKurentoClientSessionInfo;
import com.inq.webcall.room.internal.InqNotificationRoomHandler;
import com.inq.webcall.util.log.InqEtlMgr;
import org.kurento.client.MediaElement;
import org.kurento.client.MediaPipeline;
import org.kurento.client.MediaType;
import org.kurento.room.NotificationRoomManager;

import org.kurento.room.api.*;
import org.kurento.room.api.pojo.ParticipantRequest;
import org.kurento.room.api.pojo.UserParticipant;
import org.kurento.room.exception.RoomException;
import org.kurento.room.internal.DefaultKurentoClientSessionInfo;
import org.kurento.room.internal.helper.RoomEventManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PreDestroy;
import java.util.Set;


public class InqNotificationRoomManager extends NotificationRoomManager{
    private final Logger log = LoggerFactory.getLogger(InqNotificationRoomManager.class);

    private InqNotificationRoomHandler notificationRoomHandler;
    private InqRoomManager internalManager;
    private RoomEventManager roomEventManager;

    public InqNotificationRoomManager(UserNotificationService notificationService, InqKurentoClientProvider kcProvider) {
        super(notificationService, (KurentoClientProvider) kcProvider);
        this.notificationRoomHandler = new InqNotificationRoomHandler(notificationService);
        this.roomEventManager = new RoomEventManager();
        this.internalManager = new InqRoomManager(notificationRoomHandler, kcProvider, roomEventManager);
        kcProvider.setRoomManager(this);

        // TODO
        SystemMonitor.roomManager = this;
    }

    // ----------------- CLIENT-ORIGINATED REQUESTS ------------

    /**
     * Calls {@link InqRoomManager joinRoom}
     * with a {@link DefaultKurentoClientSessionInfo} bean as implementation of the
     * {@link KurentoClientSessionInfo}.
     *
     * @param participantRequest
     *          instance of {@link ParticipantRequest} POJO containing the participant's id and a
     *          request id (optional identifier of the request at the communications level, included
     *          when responding back to the client)
     *
     * @see InqRoomManager joinRoom
     */
    public void joinRoom(String userName, String roomName, boolean dataChannels, boolean webParticipant,
                         ParticipantRequest participantRequest, InqKurentoClientSessionInfo kcSessionInfo) {
        Set<UserParticipant> existingParticipants = null;

        log.debug("Participant '{}/{}' joinRoom request", roomName, userName);

        try {
            existingParticipants = internalManager.joinRoom(userName, roomName, dataChannels, webParticipant,
                    kcSessionInfo, participantRequest.getParticipantId());
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error joining/creating room {}", userName, roomName, e);
            notificationRoomHandler.onParticipantJoined(participantRequest, roomName, userName, null, e);
        }

        if (existingParticipants != null) {
            if(kcSessionInfo.isRoomCreated()) {
                notificationRoomHandler.onRoomCreated(participantRequest, roomName, userName,
                        existingParticipants, kcSessionInfo, null);
            } else {
                notificationRoomHandler.onParticipantJoined(participantRequest, roomName, userName,
                        existingParticipants, kcSessionInfo, null);
            }
        }
    }

    /**
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     *
     * @see InqRoomManager#leaveRoom(String)
     */
    public void leaveRoom(ParticipantRequest request) {
        String pid = request.getParticipantId();
        Set<UserParticipant> remainingParticipants = null;
        String roomName = null;
        String userName = null;
        try {
            roomName = internalManager.getRoomName(pid);
            userName = internalManager.getParticipantName(pid);
            remainingParticipants = internalManager.leaveRoom(pid);
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error leaving room {}", userName, roomName, e);
            notificationRoomHandler.onParticipantLeft(request, null, null, e);
        }
        if (remainingParticipants != null) {
            notificationRoomHandler.onParticipantLeft(request, userName, remainingParticipants, null);
        }
    }

    /**
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     *
     * @see InqRoomManager#publishMedia(String, boolean, String, MediaElement, MediaType, boolean,
     *      MediaElement...)
     */
    public void publishMedia(ParticipantRequest request, boolean isOffer, String sdp,
                             MediaElement loopbackAlternativeSrc, MediaType loopbackConnectionType, boolean doLoopback,
                             MediaElement... mediaElements) {
        String pid = request.getParticipantId();
        String userName = null;
        Set<UserParticipant> participants = null;
        String sdpAnswer = null;
        String roomName = null;
        try {
            userName = internalManager.getParticipantName(pid);
            sdpAnswer = internalManager.publishMedia(request.getParticipantId(), isOffer, sdp,
                    loopbackAlternativeSrc, loopbackConnectionType, doLoopback, mediaElements);
            roomName = internalManager.getRoomName(pid);
            participants = internalManager.getParticipants(roomName);
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error publishing media", userName, e);
            notificationRoomHandler.onPublishMedia(request, null, null, null, e);
            RoomErrorMdbService.saveRoomError(internalManager.getRoomName(pid), userName, "onPublishMedia", e);
        }
        if (sdpAnswer != null) {
            log.debug("PARTICIPANT {} has published media in room {}", userName, roomName);
            // For now, the first participant is considered as an agent.
            if( internalManager.getRoom(pid).getParticipants().size() == 1) {
                InqEtlMgr.logAgentConnected(roomName, userName);
            }
            notificationRoomHandler.onPublishMedia(request, userName, sdpAnswer, participants, null);
        }
    }

    /**
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     *
     * @see InqRoomManager#publishMedia(String, String, boolean, MediaElement...)
     */
    public void publishMedia(ParticipantRequest request, String sdpOffer, boolean doLoopback,
                             MediaElement... mediaElements) {
        this.publishMedia(request, true, sdpOffer, null, null, doLoopback, mediaElements);
    }

    /**
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     *
     * @see InqRoomManager#unpublishMedia(String)
     */
    public void unpublishMedia(ParticipantRequest request) {
        String pid = request.getParticipantId();
        String userName = null;
        Set<UserParticipant> participants = null;
        boolean unpublished = false;
        try {
            userName = internalManager.getParticipantName(pid);
            internalManager.unpublishMedia(pid);
            unpublished = true;
            participants = internalManager.getParticipants(internalManager.getRoomName(pid));
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error unpublishing media", userName, e);
            notificationRoomHandler.onUnpublishMedia(request, null, null, e);
            RoomErrorMdbService.saveRoomError(internalManager.getRoomName(pid), userName, "unpublishMedia", e);
        }
        if (unpublished) {
            notificationRoomHandler.onUnpublishMedia(request, userName, participants, null);
        }
    }

    /**
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     *
     * @see InqRoomManager#subscribe(String, String, String)
     */
    public void subscribe(String remoteName, String sdpOffer, ParticipantRequest request) {
        String pid = request.getParticipantId();
        String userName = null;
        String sdpAnswer = null;
        try {
            userName = internalManager.getParticipantName(pid);
            sdpAnswer = internalManager.subscribe(remoteName, sdpOffer, pid);
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error subscribing to {}", userName, remoteName, e);
            notificationRoomHandler.onSubscribe(request, null, e);
        }
        if (sdpAnswer != null) {
            notificationRoomHandler.onSubscribe(request, sdpAnswer, null);
        }
    }

    /**
     * @see InqRoomManager#unsubscribe(String, String)
     *
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     */
    public void unsubscribe(String remoteName, ParticipantRequest request) {
        String pid = request.getParticipantId();
        String userName = null;
        boolean unsubscribed = false;
        try {
            userName = internalManager.getParticipantName(pid);
            internalManager.unsubscribe(remoteName, pid);
            unsubscribed = true;
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error unsubscribing from {}", userName, remoteName, e);
            notificationRoomHandler.onUnsubscribe(request, e);
        }
        if (unsubscribed) {
            notificationRoomHandler.onUnsubscribe(request, null);
        }
    }

    /**
     * @see InqRoomManager#onIceCandidate(String, String, int, String, String)
     */
    public void onIceCandidate(String endpointName, String candidate, int sdpMLineIndex,
                               String sdpMid, ParticipantRequest request) {
        String pid = request.getParticipantId();
        String userName = null;
        try {
            userName = internalManager.getParticipantName(pid);
            internalManager.onIceCandidate(endpointName, candidate, sdpMLineIndex, sdpMid,
                    request.getParticipantId());
            notificationRoomHandler.onRecvIceCandidate(request, null);
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error receiving ICE " + "candidate (epName={}, candidate={})",
                    userName, endpointName, candidate, e);
            notificationRoomHandler.onRecvIceCandidate(request, e);
        }
    }

    /**
     * Used by clients to send written messages to all other participants in the room.<br/>
     * <strong>Side effects:</strong> The room event handler should acknowledge the client's request
     * by sending an empty message. Should also send notifications to the all participants in the room
     * with the message and its sender.
     *
     * @param message
     *          message contents
     * @param userName
     *          name or identifier of the user in the room
     * @param roomName
     *          room's name
     * @param request
     *          instance of {@link ParticipantRequest} POJO
     */
    public void sendMessage(String message, String userName, String roomName,
                            ParticipantRequest request) {
        log.debug("Request [SEND_MESSAGE] message={} ({})", message, request);
        try {
            if (!internalManager.getParticipantName(request.getParticipantId()).equals(userName)) {
                throw new RoomException(RoomException.Code.USER_NOT_FOUND_ERROR_CODE, "Provided username '" + userName
                        + "' differs from the participant's name");
            }
            if (!internalManager.getRoomName(request.getParticipantId()).equals(roomName)) {
                throw new RoomException(RoomException.Code.ROOM_NOT_FOUND_ERROR_CODE, "Provided room name '" + roomName
                        + "' differs from the participant's room");
            }
            notificationRoomHandler.onSendMessage(request, message, userName, roomName,
                    internalManager.getParticipants(roomName), null);
        } catch (RoomException e) {
            log.warn("PARTICIPANT {}: Error sending message", userName, e);
            notificationRoomHandler.onSendMessage(request, null, null, null, null, e);
        }
    }

    // ----------------- APPLICATION-ORIGINATED REQUESTS ------------
    /**
     * @see InqRoomManager#close()
     */
    @PreDestroy
    public void close() {
        if (!internalManager.isClosed()) {
            internalManager.close();
        }
    }

    /**
     * @see InqRoomManager#getRooms()
     */
    public Set<String> getRooms() {
        return internalManager.getRooms();
    }

    /**
     *
     */
    public int getRoomCnt() {
        return internalManager.getRooms().size();
    }

    /**
     * @see InqRoomManager#getParticipants(String)
     */
    public Set<UserParticipant> getParticipants(String roomName) throws RoomException {
        return internalManager.getParticipants(roomName);
    }

    /**
     * @see InqRoomManager#getPublishers(String)
     */
    public Set<UserParticipant> getPublishers(String roomName) throws RoomException {
        return internalManager.getPublishers(roomName);
    }

    /**
     * @see InqRoomManager#getSubscribers(String)
     */
    public Set<UserParticipant> getSubscribers(String roomName) throws RoomException {
        return internalManager.getSubscribers(roomName);
    }

    /**
     * @see InqRoomManager#getPeerPublishers(String)
     */
    public Set<UserParticipant> getPeerPublishers(String participantId) throws RoomException {
        return internalManager.getPeerPublishers(participantId);
    }

    /**
     * @see InqRoomManager#getPeerSubscribers(String)
     */
    public Set<UserParticipant> getPeerSubscribers(String participantId) throws RoomException {
        return internalManager.getPeerSubscribers(participantId);
    }

    /**
     * @see InqRoomManager#getPipeline(String)
     */
    public MediaPipeline getPipeline(String participantId) throws RoomException {
        return internalManager.getPipeline(participantId);
    }

    /**
     * Application-originated request to remove a participant from the room. <br/>
     * <strong>Side effects:</strong> The room event handler should notify the user that she has been
     * evicted. Should also send notifications to all other participants about the one that's just
     * been evicted.
     *
     * @see InqRoomManager#leaveRoom(String)
     */
    public void evictParticipant(String participantId) throws RoomException {
        UserParticipant participant = internalManager.getParticipantInfo(participantId);
        Set<UserParticipant> remainingParticipants = internalManager.leaveRoom(participantId);
        notificationRoomHandler.onParticipantLeft(participant.getUserName(), remainingParticipants);
        notificationRoomHandler.onParticipantEvicted(participant);
    }

    /**
     * @see InqRoomManager#closeRoom(String)
     */
    public void closeRoom(String roomName) throws RoomException {
        Set<UserParticipant> participants = internalManager.closeRoom(roomName);
        notificationRoomHandler.onRoomClosed(roomName, participants);
    }
    /**
     * @see InqRoomManager#closeRoomWithMediaError(String)
     */
    public void closeRoomWithMediaError(String roomName) throws RoomException {
        Set<UserParticipant> participants = internalManager.getParticipants(roomName);
        try {
            for(UserParticipant p : participants) {
                notificationRoomHandler.onMediaElementError(roomName, p.getParticipantId(), "Mediaserver closed ");
            }
            internalManager.closeRoomWithMediaError(roomName);
        } catch (Exception e) {
            log.error("Exception closing room {}", roomName, e);
        }
    }

    /**
     * @see InqRoomManager#generatePublishOffer(String)
     */
    public String generatePublishOffer(String participantId) throws RoomException {
        return internalManager.generatePublishOffer(participantId);
    }

    /**
     * @see InqRoomManager#addMediaElement(String, MediaElement)
     */
    public void addMediaElement(String participantId, MediaElement element) throws RoomException {
        internalManager.addMediaElement(participantId, element);
    }

    /**
     * @see InqRoomManager#addMediaElement(String, MediaElement, MediaType)
     */
    public void addMediaElement(String participantId, MediaElement element, MediaType type)
            throws RoomException {
        internalManager.addMediaElement(participantId, element, type);
    }

    /**
     * @see InqRoomManager#removeMediaElement(String, MediaElement)
     */
    public void removeMediaElement(String participantId, MediaElement element) throws RoomException {
        internalManager.removeMediaElement(participantId, element);
    }

    /**
     * @see InqRoomManager#mutePublishedMedia(MutedMediaType, String)
     */
    public void mutePublishedMedia(MutedMediaType muteType, String participantId)
            throws RoomException {
        internalManager.mutePublishedMedia(muteType, participantId);
    }

    /**
     * @see InqRoomManager#unmutePublishedMedia(String)
     */
    public void unmutePublishedMedia(String participantId) throws RoomException {
        internalManager.unmutePublishedMedia(participantId);
    }

    /**
     * @see InqRoomManager#muteSubscribedMedia(String, MutedMediaType, String)
     */
    public void muteSubscribedMedia(String remoteName, MutedMediaType muteType, String participantId)
            throws RoomException {
        internalManager.muteSubscribedMedia(remoteName, muteType, participantId);
    }

    /**
     * @see InqRoomManager#unmuteSubscribedMedia(String, String)
     */
    public void unmuteSubscribedMedia(String remoteName, String participantId) throws RoomException {
        internalManager.unmuteSubscribedMedia(remoteName, participantId);
    }

    public InqRoomManager getInqRoomManager() {
        return internalManager;
    }

    public boolean checkRoomToken(String roomName, String authToken) {
        if(null != authToken && null != roomName) {
            return authToken.equals(internalManager.getRoomAuthToken(roomName));
        } else {
            return false;
        }
    }
}
