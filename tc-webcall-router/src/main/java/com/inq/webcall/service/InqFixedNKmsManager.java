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

package com.inq.webcall.service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.inq.webcall.monitor.kmsmonitor.KmsMonitorService;
import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.InqRoomManager;
import com.inq.webcall.room.api.InqIKurentoClientSessionInfo;
import com.inq.webcall.room.api.InqKurentoClientProvider;
import com.inq.webcall.room.internal.InqRoom;
import com.inq.webcall.room.kms.InqKms;
import com.inq.webcall.room.kms.InqKmsManager;
import com.inq.webcall.room.kms.InqMaxWebRtcLoadManager;
import org.kurento.client.KurentoClient;
import org.kurento.client.KurentoConnectionListener;
import org.kurento.commons.exception.KurentoException;
import org.kurento.jsonrpc.Session;
import org.kurento.room.exception.RoomException;
import org.kurento.room.internal.DefaultKurentoClientSessionInfo;
import org.kurento.room.kms.Kms;
import org.kurento.room.kms.KmsManager;
import org.kurento.room.rpc.JsonRpcNotificationService;
import org.kurento.room.rpc.ParticipantSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * KMS manager for the room demo app.
 *
 * @author Radu Tom Vlad (rvlad@naevatec.com)
 * @since 6.0.0
 */
public class InqFixedNKmsManager extends InqKmsManager implements InqKurentoClientProvider {
    private static final Logger log = LoggerFactory.getLogger(InqFixedNKmsManager.class);

    private String authRegex;
    private static Pattern authPattern = null;
    private InqRoomManager inqRoomManager;

    private final ConcurrentMap<InqKms, ConcurrentMap<String, InqRoom>> kmsFailOverMap = new ConcurrentHashMap<>();


    // @Autowired
    private InqNotificationRoomManager roomManager;

    @Autowired
    private JsonRpcNotificationService notificationService;

    public InqFixedNKmsManager(List<String> kmsWsUri) {
        for (String uri : kmsWsUri) {
            this.addKms(new InqKms(KurentoClient.create(uri, new KurentoConnectionListener() {
                private boolean connected = false;

                @Override
                public void reconnected(boolean arg0) {
                    this.connected = true;
                    runKmsMonitor();
                    log.debug("Kms uri={} has been reconnected", uri);
                }

                @Override
                public void disconnected() {
                    if (this.connected) {
                        this.connected = false;
                    }
                    log.debug("Kms uri={} has been disconnected", uri);
                }

                @Override
                public void connectionFailed() {
                    log.debug("Kms uri={} has been connectionFailed", uri);
                }

                @Override
                public void connected() {
                    this.connected = true;
                    runKmsMonitor();
                    log.debug("Kms uri={} has been connected", uri);
                }

                // run KMS server monitor
                private void runKmsMonitor() {
                    ExecutorService executor = Executors.newSingleThreadExecutor();
                    executor.submit(() -> {
                        KmsMonitorService kmsMonitorService = new KmsMonitorService(uri);
                        try {
                            while (this.connected) {
                                kmsMonitorService.saveKmsStat();
                                Thread.sleep(10000);
                            }
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    });
                }
            }), uri));
        }
    }

    /**
     * Ref
     * Adding listener - https://groups.google.com/forum/#!topic/kurento/4Fhj-0E5ITk
     *
     * @param kmsWsUri
     * @param kmsLoadLimit
     */
    public InqFixedNKmsManager(List<String> kmsWsUri, int kmsLoadLimit) {
        for (String uri : kmsWsUri) {
            try {
                addKms(uri, kmsLoadLimit);
            } catch (org.kurento.commons.exception.KurentoException e) {
                log.error("Fail to create KMS instance of " + uri, e);
            }
        }
        if (this.getKmssSortedByLoad().size() <= 0) {
            throw new org.kurento.commons.exception.KurentoException("No KMS Server has been connected");
        }
    }

    /**
     * Ref
     * Adding listener - https://groups.google.com/forum/#!topic/kurento/4Fhj-0E5ITk
     *
     * @param uri
     * @param kmsLoadLimit
     */
    public void addKms(String uri, int kmsLoadLimit) throws KurentoException {
        InqKms kms = getKms(uri);
        if(kms != null) throw new KurentoException(uri + " is already in kms manager");

        kms = new InqKms(KurentoClient.create(uri, new KurentoConnectionListener() {
            private boolean connected = false;

            @Override
            public void reconnected(boolean arg0) {
                for (InqKms k : InqFixedNKmsManager.this.kmsFailOverMap.keySet()) {
                    if (k.getUri().equals(uri)) {
                        k.getLoadManager().setOn(true);
                        log.debug("Kms uri={} has been reconnected", uri);
                    }
                }
                this.connected = true;
                runKmsMonitor();
            }

            @Override
            public void disconnected() {
                InqKms kms = null;
                for (InqKms k : InqFixedNKmsManager.this.kmsFailOverMap.keySet()) {
                    if (k.getUri().equals(uri)) {
                        kms = k;
                        break;
                    }
                }
                if (null != kms) {
                    log.warn("Kms uri={} has been disconnected", uri);
                    kms.getLoadManager().setOn(false);
                    ConcurrentMap<String, InqRoom> roomMap = InqFixedNKmsManager.this.kmsFailOverMap.get(kms);
                    InqFixedNKmsManager.this.kmsFailOverMap.put(kms, new ConcurrentHashMap<>());
                    Set<String> names = roomMap.keySet();
                    int i = 0;
                    for (String name : names) {
                        try {
                            log.info("KMS Disconnected; Removing room '{}' during failover {} / {}", name, i++, names.size());
                            roomMap.remove(name);
                            roomManager.closeRoomWithMediaError(name);
                        } catch (Exception e) {
                            log.error("Error while removing room '{}' during failover", name, e);
                        }
                    }
                    log.debug("Kms uri={} has been disconnected and cleaned up", uri);
                }
            }

            @Override
            public void connectionFailed() {
                log.debug("Kms uri={} has been connection Failed", uri);
            }

            @Override
            public void connected() {
                this.connected = true;
                runKmsMonitor();
                log.debug("Kms uri={} has been connected", uri);
            }

            // run KMS server monitor
            private void runKmsMonitor() {
                ExecutorService executor = Executors.newSingleThreadExecutor();
                executor.submit(() -> {
                    KmsMonitorService kmsMonitorService = new KmsMonitorService(uri);
                    try {
                        while (this.connected) {
                            kmsMonitorService.saveKmsStat();
                            Thread.sleep(3000);
                        }
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            }
        }), uri);

        kms.setLoadManager(new InqMaxWebRtcLoadManager(kmsLoadLimit));
        this.kmsFailOverMap.put(kms, new ConcurrentHashMap<>());
        this.addKms(kms);
        log.info("kms {} has been added into kmss", kms.getUri());
    }

    public synchronized void setAuthRegex(String regex) {
        this.authRegex = regex != null ? regex.trim() : null;
        if (authRegex != null && !authRegex.isEmpty()) {
            authPattern = Pattern.compile(authRegex, Pattern.UNICODE_CASE | Pattern.CASE_INSENSITIVE);
        }
    }

    public boolean blockKms(String uri) {
        InqKms kms = getKms(uri);
        if(kms != null) {
            kms.setBlocked(true);
        }
        return kms.isBlocked();
    }

//    @Override
//    public synchronized InqKms getKms(DefaultKurentoClientSessionInfo sessionInfo) {
    /*
        CHECK ME: Doesn't look like this code is used. check it when system is stable.
     */
    public synchronized InqKms getKms(InqIKurentoClientSessionInfo sessionInfo) {
        String userName = null;
        String participantId = ((DefaultKurentoClientSessionInfo) sessionInfo).getParticipantId();
        Session session = notificationService.getSession(participantId);
        if (session != null) {
            Object sessionValue = session.getAttributes().get(ParticipantSession.SESSION_KEY);
            if (sessionValue != null) {
                ParticipantSession participantSession = (ParticipantSession) sessionValue;
                userName = participantSession.getParticipantName();
            }
        }
        if (userName == null) {
            log.warn("Unable to find user name in session {}", participantId);
            throw new RoomException(RoomException.Code.ROOM_CANNOT_BE_CREATED_ERROR_CODE,
                    "Not enough information");
        }
        if (!canCreateRoom(userName)) {
            throw new RoomException(RoomException.Code.ROOM_CANNOT_BE_CREATED_ERROR_CODE,
                    "User cannot create a new room");
        }
        InqKms kms = (InqKms) getLessLoadedKms();

        if (!kms.allowMoreElements()) {
            log.debug("Was trying Kms which has no resources left: less loaded KMS, uri={}", kms.getUri());
            throw new RoomException(RoomException.Code.ROOM_CANNOT_BE_CREATED_ERROR_CODE,
                    "No resources left to create new room");
        }

        sessionInfo.setKmsUri(kms.getUri());
        log.debug("Participant '{}/{}' Offering Kms: less loaded KMS, uri={}", sessionInfo.getRoomName(),((DefaultKurentoClientSessionInfo) sessionInfo).getParticipantId(), kms.getUri());
        return kms;
    }

    private boolean isUserHQ(String userName) {
        return userName.toLowerCase().startsWith("special");
    }

    private boolean canCreateRoom(String userName) {
        if (authPattern == null) {
            return true;
        }
        Matcher m = authPattern.matcher(userName);
        return m.matches();
    }

    @Override
    public void addFailOver(InqIKurentoClientSessionInfo kcSessionInfo, InqRoom room) {
        InqKms kms = getKms((DefaultKurentoClientSessionInfo) kcSessionInfo);
        this.kmsFailOverMap.get(kms).put(room.getName(), room);
    }

    @Override
    public void removeFailOver(InqIKurentoClientSessionInfo kcSessionInfo, InqRoom room) {
        InqKms kms = getKms((DefaultKurentoClientSessionInfo) kcSessionInfo);
        this.kmsFailOverMap.get(kms).remove(room.getName());
    }

  /*
  public void setInqRoomManager(InqRoomManager inqRoomManager) {
    this.inqRoomManager = inqRoomManager;
  }
  */

    public void setRoomManager(InqNotificationRoomManager roomManager) {
        this.roomManager = roomManager;
    }
}
