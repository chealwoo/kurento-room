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

package com.inq.webcall.room;

import com.inq.saml.TokenValidator;
import com.inq.webcall.WebCallApplication;
import com.inq.webcall.dao.RoomMdbService;
import com.inq.webcall.room.api.InqIKurentoClientSessionInfo;
import com.inq.webcall.room.api.InqKurentoClientProvider;
import com.inq.webcall.room.internal.InqParticipant;
import com.inq.webcall.room.internal.InqRoom;
import com.inq.webcall.util.log.InqEtlMgr;
import org.kurento.client.*;
import org.kurento.jsonrpc.JsonRpcException;
import org.kurento.room.api.KurentoClientProvider;
import org.kurento.room.api.MutedMediaType;
import org.kurento.room.api.RoomHandler;
import org.kurento.room.api.pojo.UserParticipant;
import org.kurento.room.endpoint.SdpType;
import org.kurento.room.exception.RoomException;
import org.kurento.room.exception.RoomException.Code;
import org.kurento.room.internal.helper.RoomEventManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PreDestroy;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * The Kurento room manager represents an SDK for any developer that wants to implement the Room
 * server-side application. They can build their application on top of the manager's Java API and
 * implement their desired business logic without having to consider room or media-specific details.
 * <p>
 * The application is in control of notifying any remote parties with the outcome of executing the
 * requested actions.
 *
 * @author <a href="mailto:rvlad@naevatec.com">Radu Tom Vlad</a>
 */
public class InqRoomManager {
    private final Logger log = LoggerFactory.getLogger(InqRoomManager.class);

    private RoomHandler roomHandler;
    private InqKurentoClientProvider kcProvider;

    private final ConcurrentMap<String, InqRoom> rooms = new ConcurrentHashMap<>();
    private final ConcurrentMap<KurentoClient, ConcurrentMap<String, InqRoom> > kmsRooms = new ConcurrentHashMap<>();

    private volatile boolean closed = false;

    private RoomEventManager roomEventManager;

    /**
     * Provides an instance of the room manager by setting a room handler and the
     * {@link KurentoClient} provider.
     *
     * @param roomHandler the room handler implementation
     * @param kcProvider  enables the manager to obtain Kurento Client instances
     */
    public InqRoomManager(RoomHandler roomHandler, InqKurentoClientProvider kcProvider) {
        super();
        this.roomHandler = roomHandler;
        this.kcProvider = kcProvider;
    }

    public InqRoomManager(RoomHandler roomHandler, InqKurentoClientProvider kcProvider, RoomEventManager roomEventManager) {
        super();
        this.roomHandler = roomHandler;
        this.kcProvider = kcProvider;
       // kcProvider.setInqRoomManager(this);
        this.roomEventManager = roomEventManager;
    }

    /**
     * Represents a client's request to join a room. The room must exist in order to perform the join.<br/>
     * <strong>Dev advice:</strong> Send notifications to the existing participants in the room to
     * inform about the new peer.
     *
     * @param userName       name or identifier of the user in the room. Will be used to identify her WebRTC media
     *                       peer (from the client-side).
     * @param roomName       name or identifier of the room
     * @param webParticipant if <strong>true</strong>, the internal media endpoints will use the trickle ICE
     *                       mechanism when establishing connections with external media peers (
     *                       {@link WebRtcEndpoint}); if <strong>false</strong>, the media endpoint will be a
     *                       {@link RtpEndpoint}, with no ICE implementation
     * @param kcSessionInfo  sessionInfo bean to be used to create the room in case it doesn't exist (if null, the
     *                       room will not be created)
     * @param participantId  identifier of the participant
     * @return set of existing peers of type {@link UserParticipant}, can be empty if first
     * @throws RoomException on error while joining (like the room is not found or is closing)
     */
    public Set<UserParticipant> joinRoom(String userName, String roomName, boolean dataChannels,
                                         boolean webParticipant, InqIKurentoClientSessionInfo kcSessionInfo,
                                         String participantId) throws RoomException {

        InqEtlMgr.logWebCallRequested(roomName, userName);

        InqRoom room = rooms.get(roomName);
        String authToken = kcSessionInfo.getAuthToken();
        if (room == null && kcSessionInfo != null
                && ( !WebCallApplication.SSO_AUTH_CHECK || TokenValidator.validateToken(userName, authToken) ) ) {
                      // if WebCallApplication.SSO_AUTH_CHECK is true, call validatieToken()
            createRoom(kcSessionInfo);
            KurentoClient kurentoClient = kcProvider.getKurentoClient(kcSessionInfo);
//            roomEventManager.createRoomEvent(roomName, userName, kurentoClient.getSessionId());
        }

        room = rooms.get(roomName);
        if (room == null) {
            log.warn("ERROR: Room '{}' is NULL when user {} try to join", userName, roomName);
            throw new RoomException(Code.ROOM_NOT_FOUND_ERROR_CODE, "Room '" + roomName
                    + "' was not found, must be created before '" + userName + "' can join");
        }

        if (room.isClosed()) {
            log.warn("ERROR: Room '{}' is closed when user {} try to join", userName, roomName);
            throw new RoomException(Code.ROOM_CLOSED_ERROR_CODE, "'" + userName
                    + "' is trying to join room '" + roomName + "' but it is closing");
        }

        kcProvider.addFailOver(kcSessionInfo, room);
        Set<UserParticipant> existingParticipants = getParticipants(roomName);
        // Auth Token may required to join room.
        if (!WebCallApplication.SSO_AUTH_CHECK || (TokenValidator.validateToken(userName, authToken) || authToken.equals(room.getAuthToken()))) {
            room.join(participantId, userName, dataChannels, webParticipant);
        } else {
            throw new RoomException(Code.ROOM_CLOSED_ERROR_CODE, "'" + userName
                    + "' is trying to join room '" + roomName + "' without valid token");
        }
        return existingParticipants;
    }

    /**
     * Represents a client's notification that she's leaving the room. Will also close the room if
     * there're no more peers.<br/>
     * <strong>Dev advice:</strong> Send notifications to the other participants in the room to inform
     * about the one that's just left.
     *
     * @param participantId identifier of the participant
     * @return set of remaining peers of type {@link UserParticipant}, if empty this method has closed
     * the room
     * @throws RoomException on error leaving the room
     */
    public Set<UserParticipant> leaveRoom(String participantId) throws RoomException {
        log.debug("Request [LEAVE_ROOM] ({})", participantId);
        InqParticipant participant = getParticipant(participantId);
        InqRoom room = participant.getRoom();
        String roomName = room.getName();
        InqEtlMgr.logLeave(roomName, participant.getName());
        if (room.isClosed()) {
            log.warn("'{}' is trying to leave from room '{}' but it is closing", participant.getName(),
                    roomName);
            throw new RoomException(Code.ROOM_CLOSED_ERROR_CODE, "'" + participant.getName()
                    + "' is trying to leave from room '" + roomName + "' but it is closing");
        }
        room.leave(participantId);
        Set<UserParticipant> remainingParticipants = null;
        try {
            remainingParticipants = getParticipants(roomName);
        } catch (RoomException e) {
            log.debug("Possible collision when closing the room '{}' (not found)");
            remainingParticipants = Collections.emptySet();
        }
        if (remainingParticipants.isEmpty()) {
            log.debug("No more participants in room '{}', removing it and closing it", roomName);
            room.close();
            kmsRooms.get(room.getKurentoClient()).remove(roomName);
            rooms.remove(roomName);

            roomEventManager.closeRoomEvent(roomName);
            log.warn("Room '{}' removed and closed", roomName);
        }
        return remainingParticipants;
    }

    /**
     * Represents a client's request to start streaming her local media to anyone inside the room. The
     * media elements should have been created using the same pipeline as the publisher's. The
     * streaming media endpoint situated on the server can be connected to itself thus realizing what
     * is known as a loopback connection. The loopback is performed after applying all additional
     * media elements specified as parameters (in the same order as they appear in the params list).
     * <p>
     * <br/>
     * <strong>Dev advice:</strong> Send notifications to the existing participants in the room to
     * inform about the new stream that has been published. Answer to the peer's request by sending it
     * the SDP response (answer or updated offer) generated by the WebRTC endpoint on the server.
     *
     * @param participantId          identifier of the participant
     * @param isOffer                if true, the sdp is an offer from remote, otherwise is the answer to the offer
     *                               generated previously by the server endpoint
     * @param sdp                    SDP String <strong>offer</strong> or <strong>answer</strong>, that's been generated by
     *                               the client's WebRTC peer
     * @param loopbackAlternativeSrc instead of connecting the endpoint to itself, use this {@link MediaElement} as source
     * @param loopbackConnectionType the connection type for the loopback; if null, will stream both audio and video media
     * @param doLoopback             loopback flag
     * @param mediaElements          variable array of media elements (filters, recorders, etc.) that are connected between
     *                               the source WebRTC endpoint and the subscriber endpoints
     * @return the SDP response generated by the WebRTC endpoint on the server (answer to the client's
     * offer or the updated offer previously generated by the server endpoint)
     * @throws RoomException on error
     */
    public String publishMedia(String participantId, boolean isOffer, String sdp,
                               MediaElement loopbackAlternativeSrc, MediaType loopbackConnectionType, boolean doLoopback,
                               MediaElement... mediaElements) throws RoomException {
        SdpType sdpType = isOffer ? SdpType.OFFER : SdpType.ANSWER;
        InqParticipant participant = getParticipant(participantId);
        String participantName = participant.getName();
        InqRoom room = participant.getRoom();

        log.debug("Request [PUBLISH_MEDIA] isOffer={} sdp={} "
                        + "loopbackAltSrc={} lpbkConnType={} doLoopback={} mediaElements={} ({}:{})", isOffer, sdp,
                loopbackAlternativeSrc == null, loopbackConnectionType, doLoopback, mediaElements,
                room.getName(), participantId);

        participant.createPublishingEndpoint();

        for (MediaElement elem : mediaElements) {
            participant.getPublisher().apply(elem);
        }

        String sdpResponse = participant.publishToRoom(sdpType, sdp, doLoopback,
                loopbackAlternativeSrc, loopbackConnectionType);

        if (sdpResponse == null) {
            RoomException roomException = new RoomException(Code.MEDIA_SDP_ERROR_CODE,
                    "Error generating SDP response for publishing user " + participantName);
            RoomMdbService.saveParticipantPublishFailure(room.getName(), participantName, this.getClass().getName() + ".publishMedia()", roomException);
            throw roomException;
        }

        room.newPublisher(participant);

        RoomMdbService.saveParticipantPublishSuccess(room.getName(), participantName, sdpResponse);

        return sdpResponse;
    }

    /**
     * Same as
     * {@link #publishMedia(String, boolean, String, MediaElement, MediaType, boolean, MediaElement...)}
     * where the sdp String is an offer generated by the remote peer, the published stream will be
     * used for loopback (if required) and no specific type of loopback connection.
     *
     */
    public String publishMedia(String participantId, String sdp, boolean doLoopback,
                               MediaElement... mediaElements) throws RoomException {
        return publishMedia(participantId, true, sdp, null, null, doLoopback, mediaElements);
    }

    /**
     * Same as
     * {@link #publishMedia(String, boolean, String, MediaElement, MediaType, boolean, MediaElement...)}
     * , using as loopback the published stream and no specific type of loopback connection.
     *
     */
    public String publishMedia(String participantId, boolean isOffer, String sdp, boolean doLoopback,
                               MediaElement... mediaElements) throws RoomException {
        return publishMedia(participantId, isOffer, sdp, null, null, doLoopback, mediaElements);
    }

    /**
     * Represents a client's request to initiate the media connection from the server-side (generate
     * the SDP offer and send it back to the client) and must be followed by processing the SDP answer
     * from the client in order to establish the streaming.
     *
     * @param participantId identifier of the participant
     * @return the SDP offer generated by the WebRTC endpoint on the server
     * @throws RoomException on error
     * @see #publishMedia(String, String, boolean, MediaElement...)
     */
    public String generatePublishOffer(String participantId) throws RoomException {
        log.debug("Request [GET_PUBLISH_SDP_OFFER] ({})", participantId);

        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        InqRoom room = participant.getRoom();

        participant.createPublishingEndpoint();

        String sdpOffer = participant.preparePublishConnection();
        if (sdpOffer == null) {
            throw new RoomException(Code.MEDIA_SDP_ERROR_CODE,
                    "Error generating SDP offer for publishing user " + name);
        }

        room.newPublisher(participant);
        return sdpOffer;
    }

    /**
     * Represents a client's request to stop publishing her media stream. All media elements on the
     * server-side connected to this peer will be disconnected and released. The peer is left ready
     * for publishing her media in the future.<br/>
     * <strong>Dev advice:</strong> Send notifications to the existing participants in the room to
     * inform that streaming from this endpoint has ended.
     *
     * @param participantId identifier of the participant
     * @throws RoomException on error
     */
    public void unpublishMedia(String participantId) throws RoomException {
        log.debug("Request [UNPUBLISH_MEDIA] ({})", participantId);
        InqParticipant participant = getParticipant(participantId);
        if (!participant.isStreaming()) {
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "Participant '"
                    + participant.getName() + "' is not streaming media");
        }
        InqRoom room = participant.getRoom();
        participant.unpublishMedia();
        room.cancelPublisher(participant);
    }

    /**
     * Represents a client's request to receive media from room participants that published their
     * media. Will have the same result when a publisher requests its own media stream.<br/>
     * <strong>Dev advice:</strong> Answer to the peer's request by sending it the SDP answer
     * generated by the the receiving WebRTC endpoint on the server.
     *
     * @param remoteName    identification of the remote stream which is effectively the peer's name (participant)
     * @param sdpOffer      SDP offer String generated by the client's WebRTC peer
     * @param participantId identifier of the participant
     * @return the SDP answer generated by the receiving WebRTC endpoint on the server
     * @throws RoomException on error
     */
    public String subscribe(String remoteName, String sdpOffer, String participantId)
            throws RoomException {
        log.debug("Request [SUBSCRIBE] remoteParticipant={} sdpOffer={} ({})", remoteName, sdpOffer,
                participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();

        InqRoom room = participant.getRoom();

        InqParticipant senderParticipant = room.getParticipantByName(remoteName);
        if (senderParticipant == null) {
            log.warn("PARTICIPANT {}: Requesting to recv media from user {} "
                    + "in room {} but user could not be found", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "User '" + remoteName
                    + " not found in room '" + room.getName() + "'");
        }
        if (!senderParticipant.isStreaming()) {
            log.warn("PARTICIPANT {}: Requesting to recv media from user {} "
                    + "in room {} but user is not streaming media", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "User '" + remoteName
                    + " not streaming media in room '" + room.getName() + "'");
        }

        String sdpAnswer = participant.receiveMediaFrom(senderParticipant, sdpOffer);

        if (sdpAnswer == null) {
            throw new RoomException(Code.MEDIA_SDP_ERROR_CODE,
                    "Unable to generate SDP answer when subscribing '" + name + "' to '" + remoteName + "'");
        }
        return sdpAnswer;
    }

    /**
     * Represents a client's request to stop receiving media from the remote peer.
     *
     * @param remoteName    identification of the remote stream which is effectively the peer's name (participant)
     * @param participantId identifier of the participant
     * @throws RoomException on error
     */
    public void unsubscribe(String remoteName, String participantId) throws RoomException {
        log.debug("Request [UNSUBSCRIBE] remoteParticipant={} ({})", remoteName, participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        InqRoom room = participant.getRoom();
        InqParticipant senderParticipant = room.getParticipantByName(remoteName);
        if (senderParticipant == null) {
            log.warn("PARTICIPANT {}: Requesting to unsubscribe from user {} "
                    + "in room {} but user could not be found", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "User " + remoteName
                    + " not found in room " + room.getName());
        }
        participant.cancelReceivingMedia(remoteName);
    }

    /**
     * Request that carries info about an ICE candidate gathered on the client side. This information
     * is required to implement the trickle ICE mechanism. Should be triggered or called whenever an
     * icecandidate event is created by a RTCPeerConnection.
     *
     * @param endpointName  the name of the peer whose ICE candidate was gathered
     * @param candidate     the candidate attribute information
     * @param sdpMLineIndex the index (starting at zero) of the m-line in the SDP this candidate is associated
     *                      with
     * @param sdpMid        media stream identification, "audio" or "video", for the m-line this candidate is
     *                      associated with
     * @param participantId identifier of the participant
     * @throws RoomException on error
     */
    public void onIceCandidate(String endpointName, String candidate, int sdpMLineIndex,
                               String sdpMid, String participantId) throws RoomException {
        log.debug(
                "Request [ICE_CANDIDATE] endpoint={} candidate={} " + "sdpMLineIdx={} sdpMid={} ({})",
                endpointName, candidate, sdpMLineIndex, sdpMid, participantId);
        InqParticipant participant = getParticipant(participantId);
        participant.addIceCandidate(endpointName, new IceCandidate(candidate, sdpMid, sdpMLineIndex));
    }

    /**
     * Applies a media element (filter, recorder, mixer, etc.) to media that is currently streaming or
     * that might get streamed sometime in the future. The element should have been created using the
     * same pipeline as the publisher's.
     *
     * @param participantId identifier of the owner of the stream
     * @param element       media element to be added
     * @throws RoomException in case the participant doesn't exist, has been closed or on error when applying the
     *                       filter
     */
    public void addMediaElement(String participantId, MediaElement element) throws RoomException {
        addMediaElement(participantId, element, null);
    }

    /**
     * Applies a media element (filter, recorder, mixer, etc.) to media that is currently streaming or
     * that might get streamed sometime in the future. The element should have been created using the
     * same pipeline as the publisher's. The media connection can be of any type, that is audio,
     * video, data or any (when the parameter is null).
     *
     * @param participantId identifier of the owner of the stream
     * @param element       media element to be added
     * @param type          the connection type (null is accepted, has the same result as calling
     *                      {@link #addMediaElement(String, MediaElement)})
     * @throws RoomException in case the participant doesn't exist, has been closed or on error when applying the
     *                       filter
     */
    public void addMediaElement(String participantId, MediaElement element, MediaType type)
            throws RoomException {
        log.debug("Add media element {} (connection type: {}) to participant {}", element.getId(),
                type, participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        if (participant.isClosed()) {
            throw new RoomException(Code.USER_CLOSED_ERROR_CODE, "Participant '" + name
                    + "' has been closed");
        }
        participant.shapePublisherMedia(element, type);
    }

    /**
     * Disconnects and removes media element (filter, recorder, etc.) from a media stream.
     *
     * @param participantId identifier of the participant
     * @param element       media element to be removed
     * @throws RoomException in case the participant doesn't exist, has been closed or on error when removing the
     *                       filter
     */
    public void removeMediaElement(String participantId, MediaElement element) throws RoomException {
        log.debug("Remove media element {} from participant {}", element.getId(), participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        if (participant.isClosed()) {
            throw new RoomException(Code.USER_CLOSED_ERROR_CODE, "Participant '" + name
                    + "' has been closed");
        }
        participant.getPublisher().revert(element);
    }

    /**
     * Mutes the streamed media of this publisher in a selective manner.
     *
     * @param muteType      which leg should be disconnected (audio, video or both)
     * @param participantId identifier of the participant
     * @throws RoomException in case the participant doesn't exist, has been closed, is not publishing or on error
     *                       when performing the mute operation
     */
    public void mutePublishedMedia(MutedMediaType muteType, String participantId)
            throws RoomException {
        log.debug("Request [MUTE_PUBLISHED] muteType={} ({})", muteType, participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        if (participant.isClosed()) {
            throw new RoomException(Code.USER_CLOSED_ERROR_CODE, "Participant '" + name
                    + "' has been closed");
        }
        if (!participant.isStreaming()) {
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "Participant '" + name
                    + "' is not streaming media");
        }
        participant.mutePublishedMedia(muteType);
    }

    /**
     * Reverts the effects of the mute operation.
     *
     * @param participantId identifier of the participant
     * @throws RoomException in case the participant doesn't exist, has been closed, is not publishing or on error
     *                       when reverting the mute operation
     */
    public void unmutePublishedMedia(String participantId) throws RoomException {
        log.debug("Request [UNMUTE_PUBLISHED] muteType={} ({})", participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        if (participant.isClosed()) {
            throw new RoomException(Code.USER_CLOSED_ERROR_CODE, "Participant '" + name
                    + "' has been closed");
        }
        if (!participant.isStreaming()) {
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "Participant '" + name
                    + "' is not streaming media");
        }
        participant.unmutePublishedMedia();
    }

    /**
     * Mutes the incoming media stream from the remote publisher in a selective manner.
     *
     * @param remoteName    identification of the remote stream which is effectively the peer's name (participant)
     * @param muteType      which leg should be disconnected (audio, video or both)
     * @param participantId identifier of the participant
     * @throws RoomException in case the participant doesn't exist, has been closed, is not publishing or on error
     *                       when performing the mute operation
     */
    public void muteSubscribedMedia(String remoteName, MutedMediaType muteType, String participantId)
            throws RoomException {
        log.debug("Request [MUTE_SUBSCRIBED] remoteParticipant={} muteType={} ({})", remoteName,
                muteType, participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        InqRoom room = participant.getRoom();
        InqParticipant senderParticipant = room.getParticipantByName(remoteName);
        if (senderParticipant == null) {
            log.warn("PARTICIPANT {}: Requesting to mute streaming from {} "
                    + "in room {} but user could not be found", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "User " + remoteName
                    + " not found in room " + room.getName());
        }
        if (!senderParticipant.isStreaming()) {
            log.warn("PARTICIPANT {}: Requesting to mute streaming from {} "
                    + "in room {} but user is not streaming media", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "User '" + remoteName
                    + " not streaming media in room '" + room.getName() + "'");
        }
        participant.muteSubscribedMedia(senderParticipant, muteType);
    }

    /**
     * Reverts any previous mute operation.
     *
     * @param remoteName    identification of the remote stream which is effectively the peer's name (participant)
     * @param participantId identifier of the participant
     * @throws RoomException in case the participant doesn't exist, has been closed or on error when reverting the
     *                       mute operation
     */
    public void unmuteSubscribedMedia(String remoteName, String participantId) throws RoomException {
        log.debug("Request [UNMUTE_SUBSCRIBED] remoteParticipant={} ({})", remoteName, participantId);
        InqParticipant participant = getParticipant(participantId);
        String name = participant.getName();
        InqRoom room = participant.getRoom();
        InqParticipant senderParticipant = room.getParticipantByName(remoteName);
        if (senderParticipant == null) {
            log.warn("PARTICIPANT {}: Requesting to unmute streaming from {} "
                    + "in room {} but user could not be found", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "User " + remoteName
                    + " not found in room " + room.getName());
        }
        if (!senderParticipant.isStreaming()) {
            log.warn("PARTICIPANT {}: Requesting to unmute streaming from {} "
                    + "in room {} but user is not streaming media", name, remoteName, room.getName());
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "User '" + remoteName
                    + " not streaming media in room '" + room.getName() + "'");
        }
        participant.unmuteSubscribedMedia(senderParticipant);
    }

    // ----------------- ADMIN (DIRECT or SERVER-SIDE) REQUESTS ------------

    /**
     * Closes all resources. This method has been annotated with the @PreDestroy directive
     * (javax.annotation package) so that it will be automatically called when the RoomManager
     * instance is container-managed. <br/>
     * <strong>Dev advice:</strong> Send notifications to all participants to inform that their room
     * has been forcibly closed.
     *
     * @see InqRoomManager#closeRoom(String)
     */
    @PreDestroy
    public void close() {
        closed = true;
        log.info("Closing all rooms");
        for (String roomName : rooms.keySet()) {
            try {
                closeRoom(roomName);
            } catch (Exception e) {
                log.warn("Error closing room '{}'", roomName, e);
            }
        }
    }

    /**
     * @return true after {@link #close()} has been called
     */
    public boolean isClosed() {
        return closed;
    }

    /**
     * Returns all currently active (opened) rooms.
     *
     * @return set of the rooms' identifiers (names)
     */
    public Set<String> getRooms() {
        return new HashSet<String>(rooms.keySet());
    }

    /**
     * Returns all the participants inside a room.
     *
     * @param roomName name or identifier of the room
     * @return set of {@link UserParticipant} POJOS (an instance contains the participant's identifier
     * and her user name)
     * @throws RoomException in case the room doesn't exist
     */
    public Set<UserParticipant> getParticipants(String roomName) throws RoomException {
        InqRoom room = rooms.get(roomName);
        if (room == null) {
            throw new RoomException(Code.ROOM_NOT_FOUND_ERROR_CODE, "Room '" + roomName + "' not found");
        }
        Collection<InqParticipant> participants = room.getParticipants();
        Set<UserParticipant> userParts = new HashSet<UserParticipant>();
        for (InqParticipant p : participants) {
            if (!p.isClosed()) {
                userParts.add(new UserParticipant(p.getId(), p.getName(), p.isStreaming()));
            }
        }
        return userParts;
    }

    /**
     * Returns all the publishers (participants streaming their media) inside a room.
     *
     * @param roomName name or identifier of the room
     * @return set of {@link UserParticipant} POJOS representing the existing publishers
     * @throws RoomException in case the room doesn't exist
     */
    public Set<UserParticipant> getPublishers(String roomName) throws RoomException {
        InqRoom r = rooms.get(roomName);
        if (r == null) {
            throw new RoomException(Code.ROOM_NOT_FOUND_ERROR_CODE, "Room '" + roomName + "' not found");
        }
        Collection<InqParticipant> participants = r.getParticipants();
        Set<UserParticipant> userParts = new HashSet<UserParticipant>();
        for (InqParticipant p : participants) {
            if (!p.isClosed() && p.isStreaming()) {
                userParts.add(new UserParticipant(p.getId(), p.getName(), true));
            }
        }
        return userParts;
    }

    /**
     * Returns all the subscribers (participants subscribed to a least one stream of another user)
     * inside a room. A publisher which subscribes to its own stream (loopback) and will not be
     * included in the returned values unless it requests explicitly a connection to another user's
     * stream.
     *
     * @param roomName name or identifier of the room
     * @return set of {@link UserParticipant} POJOS representing the existing subscribers
     * @throws RoomException in case the room doesn't exist
     */
    public Set<UserParticipant> getSubscribers(String roomName) throws RoomException {
        InqRoom r = rooms.get(roomName);
        if (r == null) {
            throw new RoomException(Code.ROOM_NOT_FOUND_ERROR_CODE, "Room '" + roomName + "' not found");
        }
        Collection<InqParticipant> participants = r.getParticipants();
        Set<UserParticipant> userParts = new HashSet<UserParticipant>();
        for (InqParticipant p : participants) {
            if (!p.isClosed() && p.isSubscribed()) {
                userParts.add(new UserParticipant(p.getId(), p.getName(), p.isStreaming()));
            }
        }
        return userParts;
    }

    /**
     * Returns the peer's publishers (participants from which the peer is receiving media). The own
     * stream doesn't count.
     *
     * @param participantId identifier of the participant
     * @return set of {@link UserParticipant} POJOS representing the publishers this participant is
     * currently subscribed to
     * @throws RoomException in case the participant doesn't exist
     */
    public Set<UserParticipant> getPeerPublishers(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        if (participant == null) {
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "No participant with id '"
                    + participantId + "' was found");
        }
        Set<String> subscribedEndpoints = participant.getConnectedSubscribedEndpoints();
        InqRoom room = participant.getRoom();
        Set<UserParticipant> userParts = new HashSet<UserParticipant>();
        for (String epName : subscribedEndpoints) {
            InqParticipant p = room.getParticipantByName(epName);
            userParts.add(new UserParticipant(p.getId(), p.getName()));
        }
        return userParts;
    }

    /**
     * Returns the peer's subscribers (participants towards the peer is streaming media). The own
     * stream doesn't count.
     *
     * @param participantId identifier of the participant
     * @return set of {@link UserParticipant} POJOS representing the participants subscribed to this
     * peer
     * @throws RoomException in case the participant doesn't exist
     */
    public Set<UserParticipant> getPeerSubscribers(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        if (participant == null) {
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "No participant with id '"
                    + participantId + "' was found");
        }
        if (!participant.isStreaming()) {
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE, "Participant with id '"
                    + participantId + "' is not a publisher yet");
        }
        Set<UserParticipant> userParts = new HashSet<UserParticipant>();
        InqRoom room = participant.getRoom();
        String endpointName = participant.getName();
        for (InqParticipant p : room.getParticipants()) {
            if (p.equals(participant)) {
                continue;
            }
            Set<String> subscribedEndpoints = p.getConnectedSubscribedEndpoints();
            if (subscribedEndpoints.contains(endpointName)) {
                userParts.add(new UserParticipant(p.getId(), p.getName()));
            }
        }
        return userParts;
    }

    /**
     * Checks if a participant is currently streaming media.
     *
     * @param participantId identifier of the participant
     * @return true if the participant is streaming media, false otherwise
     * @throws RoomException in case the participant doesn't exist or has been closed
     */
    public boolean isPublisherStreaming(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        if (participant == null) {
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "No participant with id '"
                    + participantId + "' was found");
        }
        if (participant.isClosed()) {
            throw new RoomException(Code.USER_CLOSED_ERROR_CODE, "Participant '" + participant.getName()
                    + "' has been closed");
        }
        return participant.isStreaming();
    }

    /**
     * Creates a room if it doesn't already exist. The room's name will be indicated by the session
     * info bean.
     *
     * @param kcSessionInfo bean that will be passed to the {@link KurentoClientProvider} in order to obtain the
     *                      {@link KurentoClient} that will be used by the room
     * @throws RoomException in case of error while creating the room
     */
    public void createRoom(InqIKurentoClientSessionInfo kcSessionInfo) throws RoomException {
        String roomName = kcSessionInfo.getRoomName();
        InqRoom room = rooms.get(kcSessionInfo);
        if (room != null) {
            throw new RoomException(Code.ROOM_CANNOT_BE_CREATED_ERROR_CODE, "Room '" + roomName
                    + "' already exists");
        }
        // TODO: Need to save kms info to be used
        KurentoClient kurentoClient = kcProvider.getKurentoClient(kcSessionInfo);
        String siteId = kcSessionInfo.getSiteId();

        room = new InqRoom(roomName, kurentoClient, roomHandler, kcProvider.destroyWhenUnused(), siteId);

        InqRoom oldRoom = rooms.putIfAbsent(roomName, room);
        if (oldRoom != null) {
            log.warn("Room '{}' has just been created by another thread", roomName);
            return;
            // throw new RoomException(
            // Code.ROOM_CANNOT_BE_CREATED_ERROR_CODE,
            // "Room '"
            // + roomName
            // + "' already exists (has just been created by another thread)");
        }

        ConcurrentMap roomsTmp = kmsRooms.get(room.getKurentoClient());
        if (null == roomsTmp) {
            roomsTmp = new ConcurrentHashMap<>();
            kmsRooms.put(room.getKurentoClient(), roomsTmp);
        }
        roomsTmp.put(room.getName(), room);

        String kcName = "[NAME NOT AVAILABLE]";
        if (kurentoClient.getServerManager() != null) {
            kcName = kurentoClient.getServerManager().getName();
        }

        // flag indicate a room is created and will be used to fire event to client.
        kcSessionInfo.setRoomCreated(true);
        kcSessionInfo.setAuthToken(room.getAuthToken());

        RoomMdbService.saveRoomCreatedEvent(room.getName());
        log.warn("Room '{}' is created by '{}'.", roomName, kcName);
    }

    /**
     * Closes an existing room by releasing all resources that were allocated for the room. Once
     * closed, the room can be reopened (will be empty and it will use another Media Pipeline).
     * Existing participants will be evicted. <br/>
     * <strong>Dev advice:</strong> The room event handler should send notifications to the existing
     * participants in the room to inform that the room was forcibly closed.
     *
     * @param roomName name or identifier of the room
     * @return set of {@link UserParticipant} POJOS representing the room's participants
     * @throws RoomException in case the room doesn't exist or has been already closed
     */
    public Set<UserParticipant> closeRoom(String roomName) throws RoomException {
        InqRoom room = rooms.get(roomName);
        if (room == null) {
            throw new RoomException(Code.ROOM_NOT_FOUND_ERROR_CODE, "Room '" + roomName + "' not found");
        }
        if (room.isClosed()) {
            throw new RoomException(Code.ROOM_CLOSED_ERROR_CODE, "Room '" + roomName + "' already closed");
        }
        Set<UserParticipant> participants = getParticipants(roomName);
        // copy the ids as they will be removed from the map
        Set<String> pids = new HashSet<String>(room.getParticipantIds());
        for (String pid : pids) {
            try {
                room.leave(pid);
            } catch (RoomException e) {
                log.warn("Error evicting participant with id '{}' from room '{}'", pid, roomName, e);
            } catch (JsonRpcException e) {
                log.warn("Error evicting participant with id '{}' from room '{}' KMS may not connected", pid, roomName, e);
            }
        }
        try {
            room.close();
            RoomMdbService.saveRoomClosedEvent(roomName);
        } catch (JsonRpcException e) {
            log.error("Exception closing room {}", roomName, e);
        }
        rooms.remove(roomName);

        roomEventManager.closeRoomEvent(roomName);

        log.warn("Room '{}' removed and closed", roomName);
        return participants;
    }

    /**
     * Closes an existing room by releasing all resources that were allocated for the room. Once
     * closed, the room can be reopened (will be empty and it will use another Media Pipeline).
     * Existing participants will be evicted. <br/>
     * <strong>Dev advice:</strong> The room event handler should send notifications to the existing
     * participants in the room to inform that the room was forcibly closed.
     *
     * @param roomName name or identifier of the room
     * @throws RoomException in case the room doesn't exist or has been already closed
     */
    public void closeRoomWithMediaError(String roomName) throws RoomException {
        InqRoom room = rooms.get(roomName);
        if (room == null) {
            throw new RoomException(Code.ROOM_NOT_FOUND_ERROR_CODE, "Room '" + roomName + "' not found");
        }
        if (room.isClosed()) {
            throw new RoomException(Code.ROOM_CLOSED_ERROR_CODE, "Room '" + roomName + "' already closed");
        }

        // copy the ids as they will be removed from the map
        Set<String> pids = new HashSet<String>(room.getParticipantIds());
        for (String pid : pids) {
            try {
                room.leave(pid);
            } catch (RoomException e) {
                log.warn("Error evicting participant with id '{}' from room '{}'", pid, roomName, e);
            } catch (JsonRpcException e) {
                log.warn("Error evicting participant with id '{}' from room '{}' KMS may not connected", pid, roomName, e);
            }
        }
        try {
            room.close();
        } catch (JsonRpcException e) {
            log.error("Exception closing room {}", roomName, e);
        }
        rooms.remove(roomName);

        roomEventManager.closeRoomEvent(roomName);

        log.debug("Room '{}' removed and closed because of KMS Media error", roomName);
    }

    /**
     * Returns the media pipeline used by the participant.
     *
     * @param participantId identifier of the participant
     * @return the Media Pipeline object
     * @throws RoomException in case the participant doesn't exist
     */
    public MediaPipeline getPipeline(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        if (participant == null) {
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "No participant with id '"
                    + participantId + "' was found");
        }
        return participant.getPipeline();
    }

    /**
     * Finds the room's name of a given participant.
     *
     * @param participantId identifier of the participant
     * @return the name of the room
     * @throws RoomException in case the participant doesn't exist
     */
    public String getRoomName(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        return participant.getRoom().getName();
    }
    /**
     * Finds the room's name of a given participant.
     *
     * @param participantId identifier of the participant
     * @return the name of the room
     * @throws RoomException in case the participant doesn't exist
     */
    public InqRoom getRoom(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        return participant.getRoom();
    }

    /**
     * Finds the participant's username.
     *
     * @param participantId identifier of the InqParticipant
     * @return the participant's name
     * @throws RoomException in case the participant doesn't exist
     */
    public String getParticipantName(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        return participant.getName();
    }

    /**
     * Searches for the participant using her identifier and returns the corresponding
     * {@link UserParticipant} POJO.
     *
     * @param participantId identifier of the participant
     * @return {@link UserParticipant} POJO containing the participant's name and identifier
     * @throws RoomException in case the participant doesn't exist
     */
    public UserParticipant getParticipantInfo(String participantId) throws RoomException {
        InqParticipant participant = getParticipant(participantId);
        return new UserParticipant(participantId, participant.getName());
    }

    // ------------------ HELPERS ------------------------------------------

    private InqParticipant getParticipant(String pid) throws RoomException {
        for (InqRoom r : rooms.values()) {
            if (!r.isClosed()) {
                if (r.getParticipantIds().contains(pid) && r.getParticipant(pid) != null) {
                    return r.getParticipant(pid);
                }
            }
        }
        throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "No participant with id '" + pid
                + "' was found");
    }

    public void closeKmsRooms(KurentoClient kms) {

    }

    public String getRoomAuthToken(String roomName) {
        InqRoom room = rooms.get(roomName);
        if (null != room) {
            return room.getAuthToken();
        } else {
            return null;
        }
    }
}
