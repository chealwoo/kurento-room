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
import com.inq.webcall.dao.RoomMdbService;
import com.inq.webcall.util.log.InqEtlMgr;
import org.kurento.client.*;
import org.kurento.client.EventListener;
import org.kurento.repository.RepositoryClient;
import org.kurento.repository.RepositoryClientProvider;
import org.kurento.repository.service.pojo.RepositoryItemRecorder;
import org.kurento.room.api.RoomHandler;
import org.kurento.room.exception.RoomException;
import org.kurento.room.exception.RoomException.Code;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author Ivan Gracia (izanmail@gmail.com)
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @author Radu Tom Vlad (rvlad@naevatec.com)
 * @since 1.0.0
 */
public class InqRoom {
    public static final int ASYNC_LATCH_TIMEOUT = 30;

    private final static Logger log = LoggerFactory.getLogger(InqRoom.class);

    private final ConcurrentMap<String, InqParticipant> participants = new ConcurrentHashMap<>();
    private final String name;

    private MediaPipeline pipeline;
    private CountDownLatch pipelineLatch = new CountDownLatch(1);

    private KurentoClient kurentoClient;

    private RoomHandler roomHandler;

    private volatile boolean closed = false;

    private AtomicInteger activePublishers = new AtomicInteger(0);

    private Object pipelineCreateLock = new Object();
    private Object pipelineReleaseLock = new Object();
    private volatile boolean pipelineReleased = false;
    private boolean destroyKurentoClient;
    private String authToken = "";
    private String siteId = "";

    private Composite composite = null;
    private static final String RECORDING_EXT = ".webm";

    @Autowired
    private RepositoryClient repositoryClient;
    private RepositoryItemRecorder repoItem;
    private RecorderEndpoint recorder;
    private HubPort hubPort;

    public InqRoom(String roomName, KurentoClient kurentoClient, RoomHandler roomHandler,
                   boolean destroyKurentoClient, String siteId) {
        this.name = roomName;
        this.kurentoClient = kurentoClient;
        this.destroyKurentoClient = destroyKurentoClient;
        this.roomHandler = roomHandler;
        this.authToken = "" + System.currentTimeMillis() + roomName;
        this.siteId = siteId;
//        log.debug("ROOM {}: New ROOM instance created", roomName);
        InqEtlMgr.logRoomCreated(siteId, roomName);
    }

    public String getName() {
        return name;
    }

    public MediaPipeline getPipeline() {
        try {
            pipelineLatch.await(InqRoom.ASYNC_LATCH_TIMEOUT, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return this.pipeline;
    }

    public void join(String participantId, String userName, boolean dataChannels, boolean webParticipant)
            throws RoomException {

        log.debug("ROOM {}: joinRoom request step 4; user name:{}, isWeb:{}, participantId:{}, isClosed:{})",
                this.name, userName, webParticipant, participantId, this.closed);

        checkClosed();

        if (userName == null || userName.isEmpty()) {
            throw new RoomException(Code.GENERIC_ERROR_CODE, String.format("Room(%s) Empty user name is not allowed", name));
        }

        for (InqParticipant p : participants.values()) {
            if (p.getName().equals(userName)) {
                // TC change for recovery.
                log.warn("User '{}' already exists in room '{}'", userName, name);
                p.close();
                break;
//                throw new RoomException(Code.EXISTING_USER_IN_ROOM_ERROR_CODE, "User '" + userName
//                        + "' already exists in room '" + name + "'");
            }
        }

        createPipeline();

        participants.put(participantId, new InqParticipant(participantId, userName, this, getPipeline(),
               dataChannels, webParticipant));

        log.info("ROOM {}: participant {} is added.", name, userName);

    }

    /**
     *
     * @param pipeline
     */
    private void createRecorder(MediaPipeline pipeline){

        if(this.recorder == null) {
            try {
                if (repositoryClient == null) {
                    log.info("ROOM {}: repositoryClient is null and try to reinitate it.", name);
                    repositoryClient = RepositoryClientProvider.create(WebCallApplication.REPOSITORY_SERVER_URI);
                }

                if (repositoryClient != null) {
                    log.info("ROOM {}: create repoItem with repositoryClient", name);
                    try {
                        Map<String, String> metadata = new HashMap<>();
                        metadata.put("siteId", siteId);
                        metadata.put("chatId", name);
//                        metadata.put("participant", name);
                        this.repoItem = repositoryClient.createRepositoryItem(metadata);
                    } catch (Exception e) {
                        log.warn("ROOM {}: Unable to create kurento repository items", e);
                    }
                } else {
                    log.info("ROOM {}: create repoItem as file.", this.name);
                    String now = InqParticipant.df.format(new Date());
                    String filePath = WebCallApplication.REPOSITORY_SERVER_URI + "/" + now + RECORDING_EXT;
                    this.repoItem = new RepositoryItemRecorder();
                    this.repoItem.setId(now);
                    this.repoItem.setUrl(filePath);
                }
                log.info("ROOM {}: Media will be recorded {}by KMS: id={} , url={}",
                        (repositoryClient == null ? "locally " : ""), this.name, this.repoItem.getId(), this.repoItem.getUrl());

                this.recorder = new RecorderEndpoint.Builder(pipeline, this.repoItem.getUrl())
                        .withMediaProfile(MediaProfileSpecType.WEBM).build();
                log.info("ROOM {}: recorder has been created", this.name);
            } catch (Exception e) {
                log.error("ROOM {}: Fail to create recorder: " + e.getMessage(), name, e);
            }
        }
    }

    /*
    NOTE that adding recorder can cause the following error
    2016-10-30 19:54:31,461 WARN  [AbstractJsonRpcClientWebSocket-reqResEventExec-e2-t39] com.inq.webcall.room.internal.InqRoom (onEvent(413)) - ROOM test1: Pipeline error encountered: UNEXPECTED_PIPELINE_ERROR: failed to transfer data: Couldn't connect to server -> gstcurlbasesink.c(401): gst_curl_base_sink_render (): /GstPipeline:pipeline41/GstCurlHttpSink:curlhttpsink27(errCode=10)
     */
//    private boolean isRecording = true;
    private boolean isRecording = false;
    public void startRecorder() {
        try {
            if(!isRecording) {
                createRecorder(pipeline);
                log.info("ROOM {}: Room composite Media will be recorded {} by KMS: id={} , url={}", name,
                        (repositoryClient == null ? "locally " : ""), this.repoItem.getId(), this.repoItem.getUrl());

                hubPort = new HubPort.Builder(composite).build();
                hubPort.connect(recorder, new Continuation<Void>() {
                    @Override
                    public void onSuccess(Void result) throws Exception {
                        recorder.record();
                        log.info("ROOM {}: Composite start recording recorder {}", name, recorder.getName());
                        isRecording = true;
                        log.debug("ROOM {}: EP {}: Elements have been connected (source {} -> sink {})",
                                name, hubPort.getId(), recorder.getId());
                    }

                    @Override
                    public void onError(Throwable cause) throws Exception {
                        log.warn("ROOM {}: Composite Failed to connect media elements (source {} -> sink {})",
                                name, hubPort.getId(), recorder.getId(), cause);
                    }
                });

            } else {
                log.info("Room {} already recording ", name);
            }
        } catch (Exception e) {
            log.error("ROOM {}: Fail to connect webRtcEndpoint to recorder; " + e.getMessage(), name, e);
        }
    }

    public void stopRecorder(){
        if(this.recorder != null) {
            this.recorder.stop();
        }
    }

    public void newPublisher(InqParticipant participant) {
        registerPublisher();

        // pre-load endpoints to recv video from the new publisher
        for (InqParticipant participant1 : participants.values()) {
            if (participant.equals(participant1)) {
                continue;
            }
            participant1.getNewOrExistingSubscriber(participant.getName());
        }

        log.debug("ROOM {}: Virtually subscribed other participants {} to new publisher {}", name,
                participants.values(), participant.getName());
    }

    public void cancelPublisher(InqParticipant participant) {
        deregisterPublisher();

        // cancel recv video from this publisher
        for (InqParticipant subscriber : participants.values()) {
            if (participant.equals(subscriber)) {
                continue;
            }
            subscriber.cancelReceivingMedia(participant.getName());
        }

        log.debug("ROOM {}: Unsubscribed other participants {} from the publisher {}", name,
                participants.values(), participant.getName());

    }

    public void leave(String participantId) throws RoomException {

        checkClosed();

        InqParticipant participant = participants.get(participantId);
        if (participant == null) {
            throw new RoomException(Code.USER_NOT_FOUND_ERROR_CODE, "User #" + participantId
                    + " not found in room '" + name + "'");
        }
        log.info("PARTICIPANT {}: Leaving room {}", participant.getName(), this.name);
        if (participant.isStreaming()) {
            this.deregisterPublisher();
        }
        this.removeParticipant(participant);
        participant.close();
        RoomMdbService.saveParticipantLeaveEvent(name, participant.getName());
    }

    public Collection<InqParticipant> getParticipants() {

        checkClosed();

        return participants.values();
    }

    public Set<String> getParticipantIds() {

        checkClosed();

        return participants.keySet();
    }

    public InqParticipant getParticipant(String participantId) {

        checkClosed();

        return participants.get(participantId);
    }

    public InqParticipant getParticipantByName(String userName) {

        checkClosed();

        for (InqParticipant p : participants.values()) {
            if (p.getName().equals(userName)) {
                return p;
            }
        }

        return null;
    }

    public void close() {
        if (!closed) {

            InqEtlMgr.logCloseRoom(getName());

            for (InqParticipant user : participants.values()) {
                user.close();
            }

            participants.clear();

            closePipeline();

            log.debug("Room {} closed", this.name);

            if (destroyKurentoClient) {
                kurentoClient.destroy();
            }

            this.closed = true;
        } else {
            log.warn("ROOM {}: Closing an already closed room", this.name);
        }
    }

    public void sendIceCandidate(String participantId, String endpointName, IceCandidate candidate) {
        this.roomHandler.onIceCandidate(name, participantId, endpointName, candidate);
    }

    public void sendMediaError(String participantId, String description) {
        this.roomHandler.onMediaElementError(name, participantId, description);
    }

    public boolean isClosed() {
        return closed;
    }

    private void checkClosed() {
        if (closed) {
            throw new RoomException(Code.ROOM_CLOSED_ERROR_CODE, "The room '" + name + "' is closed");
        }
    }

    private void removeParticipant(InqParticipant participant) {

        checkClosed();

        participants.remove(participant.getId());

        log.debug("ROOM {}: Cancel receiving media from user '{}' for other users", this.name,
                participant.getName());
        for (InqParticipant other : participants.values()) {
            other.cancelReceivingMedia(participant.getName());
        }
    }

    public int getActivePublishers() {
        return activePublishers.get();
    }

    public void registerPublisher() {
        this.activePublishers.incrementAndGet();
    }

    public void deregisterPublisher() {
        this.activePublishers.decrementAndGet();
    }

    private void createPipeline() {
        synchronized (pipelineCreateLock) {
            if (pipeline != null) {
                return;
            }
            log.info("ROOM {}: Creating MediaPipeline", name);
            try {
                kurentoClient.createMediaPipeline(new Continuation<MediaPipeline>() {
                    @Override
                    public void onSuccess(MediaPipeline result) throws Exception {
                        pipeline = result;
                        // CL If you want to have status on
                        // pipeline.setLatencyStats(true);

                        pipelineLatch.countDown();
                        log.debug("ROOM {}: Created MediaPipeline", name);

                        composite = new Composite.Builder(pipeline).build();
                        log.debug("ROOM {}: Created composite {}", name, composite.getName());
                    }

                    @Override
                    public void onError(Throwable cause) throws Exception {
                        pipelineLatch.countDown();
                        log.error("ROOM {}: Failed to create MediaPipeline", name, cause);
                    }
                });
            } catch (Exception e) {
                // TODO CL KMS might down, need to start fail over.
                log.error("ROOM {}: Unable to create media pipeline. Check Media Server is running", name, e);
                pipelineLatch.countDown();
            }
            if (getPipeline() == null) {
                throw new RoomException(Code.ROOM_CANNOT_BE_CREATED_ERROR_CODE,
                        "Unable to create media pipeline for room '" + name + "'");
            }

            pipeline.addErrorListener(new EventListener<ErrorEvent>() {
                @Override
                public void onEvent(ErrorEvent event) {
                    String desc = event.getType() + ": " + event.getDescription() + "(errCode="
                            + event.getErrorCode() + ")";
                    log.warn("ROOM {}: Pipeline error encountered: {}", name, desc);

                    roomHandler.onPipelineError(name, getParticipantIds(), desc);
                }
            });
        }
    }

    private void closePipeline() {
        synchronized (pipelineReleaseLock) {
            if (pipeline == null || pipelineReleased) {
                return;
            }
            getPipeline().release(new Continuation<Void>() {

                @Override
                public void onSuccess(Void result) throws Exception {
                    log.debug("ROOM {}: Released Pipeline", InqRoom.this.name);
                    pipelineReleased = true;
                }

                @Override
                public void onError(Throwable cause) throws Exception {
                    log.warn("ROOM {}: Could not successfully release Pipeline", InqRoom.this.name, cause);
                    pipelineReleased = true;
                }
            });
        }
    }

    public Composite getComposite() {
        return composite;
    }

    public String getAuthToken() {
        return authToken;
    }

    public KurentoClient getKurentoClient() {
        return kurentoClient;
    }

    public String getSiteId() {
        return siteId;
    }
}
