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

import org.kurento.client.*;
import org.kurento.room.api.RoomHandler;
import org.kurento.room.exception.RoomException;
import org.kurento.room.exception.RoomException.Code;
import org.kurento.room.internal.Participant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Set;
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

    public InqRoom(String roomName, KurentoClient kurentoClient, RoomHandler roomHandler,
                   boolean destroyKurentoClient) {
        this.name = roomName;
        this.kurentoClient = kurentoClient;
        this.destroyKurentoClient = destroyKurentoClient;
        this.roomHandler = roomHandler;
        log.debug("New ROOM instance, named '{}'", roomName);
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

    public void join(String participantId, String userName, boolean webParticipant)
            throws RoomException {

        checkClosed();

        if (userName == null || userName.isEmpty()) {
            throw new RoomException(Code.GENERIC_ERROR_CODE, "Empty user name is not allowed");
        }
        for (InqParticipant p : participants.values()) {
            if (p.getName().equals(userName)) {
                throw new RoomException(Code.EXISTING_USER_IN_ROOM_ERROR_CODE, "User '" + userName
                        + "' already exists in room '" + name + "'");
            }
        }

        createPipeline();

        participants.put(participantId, new InqParticipant(participantId, userName, this, getPipeline(),
                webParticipant));

        log.info("ROOM {}: Added participant {}", name, userName);
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
            log.warn("Closing an already closed room '{}'", this.name);
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
                        pipelineLatch.countDown();
                        log.debug("ROOM {}: Created MediaPipeline", name);
                    }

                    @Override
                    public void onError(Throwable cause) throws Exception {
                        pipelineLatch.countDown();
                        log.error("ROOM {}: Failed to create MediaPipeline", name, cause);
                    }
                });
            } catch (Exception e) {
                log.error("Unable to create media pipeline for room '{}'", name, e);
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
}
