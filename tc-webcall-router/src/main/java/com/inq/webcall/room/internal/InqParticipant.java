/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
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
package com.inq.webcall.room.internal;

import com.inq.webcall.WebCallApplication;
import com.inq.webcall.room.endpoint.InqPublisherEndpoint;
import com.inq.webcall.room.endpoint.InqSubscriberEndpoint;
import org.kurento.client.*;
import org.kurento.client.internal.server.KurentoServerException;
import org.kurento.repository.RepositoryClient;
import org.kurento.repository.RepositoryClientProvider;
import org.kurento.repository.service.pojo.RepositoryItemRecorder;
import org.kurento.room.api.MutedMediaType;
import org.kurento.room.endpoint.SdpType;
import org.kurento.room.endpoint.SubscriberEndpoint;
import org.kurento.room.exception.RoomException;
import org.kurento.room.exception.RoomException.Code;
import org.kurento.room.internal.Room;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * @author Ivan Gracia (izanmail@gmail.com)
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @author Radu Tom Vlad (rvlad@naevatec.com)
 * @since 1.0.0
 */
public class InqParticipant {

    private static final Logger log = LoggerFactory.getLogger(InqParticipant.class);

    // slightly larger timeout
    private static final int REPOSITORY_DISCONNECT_TIMEOUT = 5500;

    public static final String RECORDING_EXT = ".webm";
    public final static SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss-S");

    private boolean web = false;

    private String id;
    private String name;

    private final InqRoom room;

    @Autowired
    private RepositoryClient repositoryClient;
    private RepositoryItemRecorder repoItem;
    private RecorderEndpoint recorder;
    private HubPort hubPort;

    private final MediaPipeline pipeline;

    private InqPublisherEndpoint publisher;
    private CountDownLatch endPointLatch = new CountDownLatch(1);

    private final ConcurrentMap<String, InqSubscriberEndpoint> subscribers = new ConcurrentHashMap<>();

    private volatile boolean streaming = false;
    private volatile boolean closed;

    public InqParticipant(String id, String name, InqRoom room, MediaPipeline pipeline, boolean web) {
        this.web = web;
        this.id = id;
        this.name = name;
        this.pipeline = pipeline;
        this.room = room;

        createRecorder(pipeline);

        createHubPort();

        this.publisher = new InqPublisherEndpoint(web, this, name, pipeline);

       // publisher.getWebEndpoint().connect(hubPort);

      //  this.publisher.connect(recorder);

        for (InqParticipant other : room.getParticipants()) {
            if (!other.getName().equals(this.name)) {
                getNewOrExistingSubscriber(other.getName());
            }
        }
    }

    /**
     *
     * @param pipeline
     */
    private void createRecorder(MediaPipeline pipeline){

        try {
            if (repositoryClient == null) {
                log.info("PARTICIPANT [{}] repositoryClient is null and try to reinitate it.", name);
                repositoryClient = RepositoryClientProvider.create(WebCallApplication.REPOSITORY_SERVER_URI);
            }

            if (repositoryClient != null) {
                log.info("PARTICIPANT [{}] in room {} create repoItem with repositoryClient with repository", this.name, this.room.getName());
                try {
                    Map<String, String> metadata = new HashMap<>();
                    metadata.put("chatId", this.room.getName());
                    metadata.put("participant", this.name);
                    this.repoItem = repositoryClient.createRepositoryItem(metadata);
                } catch (Exception e) {
                    log.warn("Unable to create kurento repository items", e);
                }
            } else {
                log.info("PARTICIPANT [{}] in room {} create repoItem with repositoryClient in file", this.name, this.room.getName());
                String now = df.format(new Date());
                String filePath = WebCallApplication.REPOSITORY_SERVER_URI + "/" + now + RECORDING_EXT;
                this.repoItem = new RepositoryItemRecorder();
                this.repoItem.setId(now);
                this.repoItem.setUrl(filePath);
            }
            log.info("Media will be recorded {}by KMS: id={} , url={}",
                    (repositoryClient == null ? "locally " : ""), this.repoItem.getId(), this.repoItem.getUrl());

            this.recorder = new RecorderEndpoint.Builder(pipeline, this.repoItem.getUrl())
                    .withMediaProfile(MediaProfileSpecType.WEBM).build();
            log.info("recorder has been created for participant {}", this.name);
        } catch (Exception e) {
            log.error("Fail to create recorder of participant id={}; " + e.getMessage(), name, e);
        }
    }

    /**
     *
     * @param webRtcEndpoint
     */
    public void connectRecorder(WebRtcEndpoint webRtcEndpoint) {
        try {
            log.info("Participant {} connect recorder {}", name, webRtcEndpoint.getName());
            webRtcEndpoint.connect(webRtcEndpoint);
            webRtcEndpoint.connect(this.recorder, new Continuation<Void>() {
                @Override
                public void onSuccess(Void result) throws Exception {
                    log.debug("EP {}: Elements have been connected (source {} -> sink {})", getPublisher().getEndpointName(),
                            webRtcEndpoint.getId(), recorder.getId());
                }

                @Override
                public void onError(Throwable cause) throws Exception {
                    log.warn("EP {}: Failed to connect media elements (source {} -> sink {})",
                            getPublisher().getEndpointName(),
                            webRtcEndpoint.getId(), recorder.getId(), cause);
                }
            });
        } catch (Exception e) {
            log.error("Fail to connect webRtcEndpoint to recorder in participant id={}; " + e.getMessage(), name, e);
        }
    }


    /**
     *
     * @param webRtcEndpoint
     */
    private boolean isRecording = false;
    public void startRecorder() {
        try {
            if(!isRecording) {
                log.info("Participant {} start recording recorder {}", name, recorder.getName());
                this.recorder.record();
                isRecording = true;
            } else {
                log.info("Participant {} already recording ", name);
            }
        } catch (Exception e) {
            log.error("Fail to connect webRtcEndpoint to recorder in participant id={}; " + e.getMessage(), name, e);
        }
    }

    public void stopRecorder(WebRtcEndpoint webRtcEndpoint) {
        try {
            if(isRecording) {
                log.info("Participant {} stop recording ", name);
                this.recorder.stop();
                isRecording = false;
            } else {
                log.info("Participant {} is not recording ", name);
            }
        } catch (Exception e) {
            log.error("Fail to connect webRtcEndpoint to recorder in participant id={}; " + e.getMessage(), name, e);
        }
    }

    /**
     *
     */
    private void createHubPort() {
        try {
            this.hubPort = new HubPort.Builder(room.getComposite()).build();
        } catch (Exception e) {
            log.error("Fail to create hubPort of participant id={} " + e.getMessage(), name, e);
        }
    }

    public void connectHubPort(WebRtcEndpoint webRtcEndpoint) {
        try {
            webRtcEndpoint.connect(this.hubPort);
        } catch (Exception e) {
            log.error("Fail to connect webRtcEndpoint.connect(hubPort) in participant id={} " + e.getMessage(), name, e);
        }
    }

    public void createPublishingEndpoint() {
        publisher.createEndpoint(endPointLatch);
        if (getPublisher().getEndpoint() == null) {
            throw new RoomException(Code.MEDIA_ENDPOINT_ERROR_CODE, "Unable to create publisher endpoint");
        }
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void shapePublisherMedia(MediaElement element, MediaType type) {
        if (type == null) {
            this.publisher.apply(element);
        } else {
            this.publisher.apply(element, type);
        }
    }

    public InqPublisherEndpoint getPublisher() {
        try {
            if (!endPointLatch.await(Room.ASYNC_LATCH_TIMEOUT, TimeUnit.SECONDS)) {
                throw new RoomException(Code.MEDIA_ENDPOINT_ERROR_CODE,
                        "Timeout reached while waiting for publisher endpoint to be ready");
            }
        } catch (InterruptedException e) {
            throw new RoomException(Code.MEDIA_ENDPOINT_ERROR_CODE,
                    "Interrupted while waiting for publisher endpoint to be ready: " + e.getMessage());
        }
        return this.publisher;
    }

    public InqRoom getRoom() {
        return this.room;
    }

    public MediaPipeline getPipeline() {
        return pipeline;
    }

    public RepositoryItemRecorder getRepoItem() {
        return repoItem;
    }

    public void setRepoItem(RepositoryItemRecorder repoItem) {
        this.repoItem = repoItem;
    }

    public boolean isClosed() {
        return closed;
    }

    public boolean isStreaming() {
        return streaming;
    }

    public boolean isSubscribed() {
        for (InqSubscriberEndpoint se : subscribers.values()) {
            if (se.isConnectedToPublisher()) {
                return true;
            }
        }
        return false;
    }

    public Set<String> getConnectedSubscribedEndpoints() {
        Set<String> subscribedToSet = new HashSet<String>();
        for (InqSubscriberEndpoint se : subscribers.values()) {
            if (se.isConnectedToPublisher()) {
                subscribedToSet.add(se.getEndpointName());
            }
        }
        return subscribedToSet;
    }

    public String preparePublishConnection() {
        log.info("USER {}: Request to publish video in room {} by "
                + "initiating connection from server", this.name, this.room.getName());

        String sdpOffer = this.getPublisher().preparePublishConnection();

        log.trace("USER {}: Publishing SdpOffer is {}", this.name, sdpOffer);
        log.info("USER {}: Generated Sdp offer for publishing in room {}", this.name,
                this.room.getName());
        return sdpOffer;
    }

    public String publishToRoom(SdpType sdpType, String sdpString, boolean doLoopback,
                                MediaElement loopbackAlternativeSrc, MediaType loopbackConnectionType) {
        log.info("USER {}: Request to publish video in room {} (sdp type {})", this.name,
                this.room.getName(), sdpType);
        log.trace("USER {}: Publishing Sdp ({}) is {}", this.name, sdpType, sdpString);

        String sdpResponse = this.getPublisher().publish(sdpType, sdpString, doLoopback,
                loopbackAlternativeSrc, loopbackConnectionType);
        this.streaming = true;

        log.trace("USER {}: Publishing Sdp ({}) is {}", this.name, sdpType, sdpResponse);
        log.info("USER {}: Is now publishing video in room {}", this.name, this.room.getName());

        return sdpResponse;
    }

    public void unpublishMedia() {
        log.debug("PARTICIPANT {}: unpublishing media stream from room {}", this.name,
                this.room.getName());
        releasePublisherEndpoint();
        this.publisher = new InqPublisherEndpoint(web, this, name, pipeline);
        log.debug("PARTICIPANT {}: released publisher endpoint and left it "
                + "initialized (ready for future streaming)", this.name);
    }

    public String receiveMediaFrom(InqParticipant sender, String sdpOffer) {
        final String senderName = sender.getName();

        log.info("USER {}: Request to receive media from {} in room {}", this.name, senderName,
                this.room.getName());
        log.trace("USER {}: SdpOffer for {} is {}", this.name, senderName, sdpOffer);

        if (senderName.equals(this.name)) {
            log.warn("PARTICIPANT {}: trying to configure loopback by subscribing", this.name);
            throw new RoomException(Code.USER_NOT_STREAMING_ERROR_CODE,
                    "Can loopback only when publishing media");
        }

        if (sender.getPublisher() == null) {
            log.warn("PARTICIPANT {}: Trying to connect to a user without " + "a publishing endpoint",
                    this.name);
            return null;
        }

        log.debug("PARTICIPANT {}: Creating a subscriber endpoint to user {}", this.name, senderName);

        InqSubscriberEndpoint subscriber = getNewOrExistingSubscriber(senderName);

        try {
            CountDownLatch subscriberLatch = new CountDownLatch(1);
            SdpEndpoint oldMediaEndpoint = subscriber.createEndpoint(subscriberLatch);
            try {
                if (!subscriberLatch.await(Room.ASYNC_LATCH_TIMEOUT, TimeUnit.SECONDS)) {
                    throw new RoomException(Code.MEDIA_ENDPOINT_ERROR_CODE,
                            "Timeout reached when creating subscriber endpoint");
                }
            } catch (InterruptedException e) {
                throw new RoomException(Code.MEDIA_ENDPOINT_ERROR_CODE,
                        "Interrupted when creating subscriber endpoint: " + e.getMessage());
            }
            if (oldMediaEndpoint != null) {
                log.warn("PARTICIPANT {}: Two threads are trying to create at "
                        + "the same time a subscriber endpoint for user {}", this.name, senderName);
                return null;
            }
            if (subscriber.getEndpoint() == null) {
                throw new RoomException(Code.MEDIA_ENDPOINT_ERROR_CODE,
                        "Unable to create subscriber endpoint");
            }
        } catch (RoomException e) {
            this.subscribers.remove(senderName);
            throw e;
        }

        log.debug("PARTICIPANT {}: Created subscriber endpoint for user {}", this.name, senderName);
        try {
            String sdpAnswer = subscriber.subscribe(sdpOffer, sender.getPublisher());
            log.trace("USER {}: Subscribing SdpAnswer is {}", this.name, sdpAnswer);
            log.info("USER {}: Is now receiving video from {} in room {}", this.name, senderName,
                    this.room.getName());
            return sdpAnswer;
        } catch (KurentoServerException e) {
            // TODO Check object status when KurentoClient sets this info in the
            // object
            if (e.getCode() == 40101) {
                log.warn("Publisher endpoint was already released when trying "
                        + "to connect a subscriber endpoint to it", e);
            } else {
                log.error("Exception connecting subscriber endpoint " + "to publisher endpoint", e);
            }
            this.subscribers.remove(senderName);
            releaseSubscriberEndpoint(senderName, subscriber);
        }
        return null;
    }

    public void cancelReceivingMedia(String senderName) {
        log.debug("PARTICIPANT {}: cancel receiving media from {}", this.name, senderName);
        InqSubscriberEndpoint subscriberEndpoint = subscribers.remove(senderName);
        if (subscriberEndpoint == null || subscriberEndpoint.getEndpoint() == null) {
            log.warn("PARTICIPANT {}: Trying to cancel receiving video from user {}. "
                    + "But there is no such subscriber endpoint.", this.name, senderName);
        } else {
            log.debug("PARTICIPANT {}: Cancel subscriber endpoint linked to user {}", this.name,
                    senderName);

            releaseSubscriberEndpoint(senderName, subscriberEndpoint);
        }
    }

    public void mutePublishedMedia(MutedMediaType muteType) {
        if (muteType == null) {
            throw new RoomException(Code.MEDIA_MUTE_ERROR_CODE, "Mute type cannot be null");
        }
        this.getPublisher().mute(muteType);
    }

    public void unmutePublishedMedia() {
        if (this.getPublisher().getMuteType() == null) {
            log.warn("PARTICIPANT {}: Trying to unmute published media. " + "But media is not muted.",
                    this.name);
        } else {
            this.getPublisher().unmute();
        }
    }

    public void muteSubscribedMedia(InqParticipant sender, MutedMediaType muteType) {
        if (muteType == null) {
            throw new RoomException(Code.MEDIA_MUTE_ERROR_CODE, "Mute type cannot be null");
        }
        String senderName = sender.getName();
        InqSubscriberEndpoint subscriberEndpoint = subscribers.get(senderName);
        if (subscriberEndpoint == null || subscriberEndpoint.getEndpoint() == null) {
            log.warn("PARTICIPANT {}: Trying to mute incoming media from user {}. "
                    + "But there is no such subscriber endpoint.", this.name, senderName);
        } else {
            log.debug("PARTICIPANT {}: Mute subscriber endpoint linked to user {}", this.name, senderName);
            subscriberEndpoint.mute(muteType);
        }
    }

    public void unmuteSubscribedMedia(InqParticipant sender) {
        String senderName = sender.getName();
        InqSubscriberEndpoint subscriberEndpoint = subscribers.get(senderName);
        if (subscriberEndpoint == null || subscriberEndpoint.getEndpoint() == null) {
            log.warn("PARTICIPANT {}: Trying to unmute incoming media from user {}. "
                    + "But there is no such subscriber endpoint.", this.name, senderName);
        } else {
            if (subscriberEndpoint.getMuteType() == null) {
                log.warn("PARTICIPANT {}: Trying to unmute incoming media from user {}. "
                        + "But media is not muted.", this.name, senderName);
            } else {
                log.debug("PARTICIPANT {}: Unmute subscriber endpoint linked to user {}", this.name,
                        senderName);
                subscriberEndpoint.unmute();
            }
        }
    }

    public void close() {
        log.debug("PARTICIPANT {}: Closing user", this.name);
        if (isClosed()) {
            log.warn("PARTICIPANT {}: Already closed", this.name);
            return;
        }
        this.closed = true;
        for (String remoteParticipantName : subscribers.keySet()) {
            InqSubscriberEndpoint subscriber = this.subscribers.get(remoteParticipantName);
            if (subscriber != null && subscriber.getEndpoint() != null) {
                releaseSubscriberEndpoint(remoteParticipantName, subscriber);
                log.debug("PARTICIPANT {}: Released subscriber endpoint to {}", this.name,
                        remoteParticipantName);
            } else {
                log.warn("PARTICIPANT {}: Trying to close subscriber endpoint to {}. "
                        + "But the endpoint was never instantiated.", this.name, remoteParticipantName);
            }
        }
        releasePublisherEndpoint();
    }

    /**
     * Returns a {@link SubscriberEndpoint} for the given username. The endpoint is created if not
     * found.
     *
     * @param remoteName name of another user
     * @return the endpoint instance
     */
    public InqSubscriberEndpoint getNewOrExistingSubscriber(String remoteName) {
        InqSubscriberEndpoint sendingEndpoint = new InqSubscriberEndpoint(web, this, remoteName, pipeline);
        InqSubscriberEndpoint existingSendingEndpoint = this.subscribers.putIfAbsent(remoteName,
                sendingEndpoint);
        if (existingSendingEndpoint != null) {
            sendingEndpoint = existingSendingEndpoint;
            log.trace("PARTICIPANT {}: Already exists a subscriber endpoint to user {}", this.name,
                    remoteName);
        } else {
            log.debug("PARTICIPANT {}: New subscriber endpoint to user {}", this.name, remoteName);
        }
        return sendingEndpoint;
    }

    public void addIceCandidate(String endpointName, IceCandidate iceCandidate) {
        if (this.name.equals(endpointName)) {
            this.publisher.addIceCandidate(iceCandidate);
        } else {
            this.getNewOrExistingSubscriber(endpointName).addIceCandidate(iceCandidate);
        }
    }

    public void sendIceCandidate(String endpointName, IceCandidate candidate) {
        room.sendIceCandidate(id, endpointName, candidate);
    }

    public void sendMediaError(ErrorEvent event) {
        String desc = event.getType() + ": " + event.getDescription() + "(errCode="
                + event.getErrorCode() + ")";
        log.warn("PARTICIPANT {}: Media error encountered: {}", name, desc);
        room.sendMediaError(id, desc);
    }

    private void releasePublisherEndpoint() {
        if (publisher != null && publisher.getEndpoint() != null) {
            this.streaming = false;
            publisher.unregisterErrorListeners();
            for (MediaElement el : publisher.getMediaElements()) {
                releaseElement(name, el);
            }
            releaseElement(name, publisher.getEndpoint());
            publisher = null;
        } else {
            log.warn("PARTICIPANT {}: Trying to release publisher endpoint but is null", name);
        }
    }

    private void releaseSubscriberEndpoint(String senderName, InqSubscriberEndpoint subscriber) {
        if (subscriber != null) {
            subscriber.unregisterErrorListeners();
            releaseElement(senderName, subscriber.getEndpoint());
        } else {
            log.warn("PARTICIPANT {}: Trying to release subscriber endpoint for '{}' but is null", name,
                    senderName);
        }
    }

    private void releaseElement(final String senderName, final MediaElement element) {
        final String eid = element.getId();
        try {
            element.release(new Continuation<Void>() {
                @Override
                public void onSuccess(Void result) throws Exception {
                    log.debug("PARTICIPANT {}: Released successfully media element #{} for {}",
                            InqParticipant.this.name, eid, senderName);
                }

                @Override
                public void onError(Throwable cause) throws Exception {
                    log.warn("PARTICIPANT {}: Could not release media element #{} for {}",
                            InqParticipant.this.name, eid, senderName, cause);
                }
            });
        } catch (Exception e) {
            log.error("PARTICIPANT {}: Error calling release on elem #{} for {}", name, eid, senderName,
                    e);
        }
    }

    @Override
    public String toString() {
        return "[User: " + name + "]";
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + (id == null ? 0 : id.hashCode());
        result = prime * result + (name == null ? 0 : name.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (!(obj instanceof InqParticipant)) {
            return false;
        }
        InqParticipant other = (InqParticipant) obj;
        if (id == null) {
            if (other.id != null) {
                return false;
            }
        } else if (!id.equals(other.id)) {
            return false;
        }
        if (name == null) {
            if (other.name != null) {
                return false;
            }
        } else if (!name.equals(other.name)) {
            return false;
        }
        return true;
    }

    public RecorderEndpoint getRecorder() {
        return recorder;
    }

    public HubPort getHubPort() {
        return hubPort;
    }
}