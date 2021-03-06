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
package com.inq.webcall.room;

import com.google.gson.JsonObject;
import com.inq.webcall.room.internal.InqProtocolElements;
import com.inq.webcall.room.rpc.InqJsonRpcUserControl;
import org.kurento.jsonrpc.DefaultJsonRpcHandler;
import org.kurento.jsonrpc.Session;
import org.kurento.jsonrpc.Transaction;
import org.kurento.jsonrpc.message.Request;
import org.kurento.room.api.pojo.ParticipantRequest;
import org.kurento.room.internal.ProtocolElements;
import org.kurento.room.rpc.JsonRpcNotificationService;
import org.kurento.room.rpc.JsonRpcUserControl;
import org.kurento.room.rpc.ParticipantSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Arrays;
import java.util.List;

/**
 * This replaces server's org.kurento.room.RoomJsonRpcHandler
 */
public class InqRoomJsonRpcHandler extends DefaultJsonRpcHandler<JsonObject> {

  private static final Logger log = LoggerFactory.getLogger(InqRoomJsonRpcHandler.class);

  private static final String HANDLER_THREAD_NAME = "handler";

  /* This class uses InqJsonRpcUserControl sub class */
  private InqJsonRpcUserControl userControl;

  private JsonRpcNotificationService notificationService;

  @Autowired
  public InqRoomJsonRpcHandler(InqJsonRpcUserControl userControl,
                               JsonRpcNotificationService notificationService) {
    this.userControl = userControl;
    this.notificationService = notificationService;
  }

  @Override
  public List<String> allowedOrigins() {
    return Arrays.asList("*");
  }

  @Override
  public final void handleRequest(Transaction transaction, Request<JsonObject> request)
      throws Exception {

    String sessionId = null;
    try {
      sessionId = transaction.getSession().getSessionId();
    } catch (Throwable e) {
      log.warn("Error getting session id from transaction {}", transaction, e);
      throw e;
    }

    updateThreadName(HANDLER_THREAD_NAME + "_" + sessionId);

    log.debug("Session #{} - request: {}", sessionId, request);

    notificationService.addTransaction(transaction, request);

    ParticipantRequest participantRequest = new ParticipantRequest(sessionId,
        Integer.toString(request.getId()));

    transaction.startAsync();

    switch (request.getMethod()) {
      case ProtocolElements.JOINROOM_METHOD :
        userControl.joinRoom(transaction, request, participantRequest);
        break;
      case ProtocolElements.PUBLISHVIDEO_METHOD :
        userControl.publishVideo(transaction, request, participantRequest);
        break;
      case ProtocolElements.UNPUBLISHVIDEO_METHOD :
        userControl.unpublishVideo(transaction, request, participantRequest);
        break;
      case ProtocolElements.RECEIVEVIDEO_METHOD :
        userControl.receiveVideoFrom(transaction, request, participantRequest);
        break;
      case ProtocolElements.UNSUBSCRIBEFROMVIDEO_METHOD :
        userControl.unsubscribeFromVideo(transaction, request, participantRequest);
        break;
      case ProtocolElements.ONICECANDIDATE_METHOD :
        userControl.onIceCandidate(transaction, request, participantRequest);
        break;
      case ProtocolElements.LEAVEROOM_METHOD :
        userControl.leaveRoom(transaction, request, participantRequest);
        break;
      case InqProtocolElements.CLOSEROOM_METHOD :
        userControl.closeRoom(transaction, request, participantRequest);
        break;
      case ProtocolElements.SENDMESSAGE_ROOM_METHOD :
        userControl.sendMessage(transaction, request, participantRequest);
        break;
      case ProtocolElements.CUSTOMREQUEST_METHOD :
        userControl.customRequest(transaction, request, participantRequest);
        break;
      default :
        log.error("Unrecognized request {}", request);
        break;
    }

    updateThreadName(HANDLER_THREAD_NAME);
  }

  @Override
  public final void afterConnectionClosed(Session session, String status) throws Exception {
    ParticipantSession ps = null;
    if (session.getAttributes().containsKey(ParticipantSession.SESSION_KEY)) {
      ps = (ParticipantSession) session.getAttributes().get(ParticipantSession.SESSION_KEY);
    }
    String sid = session.getSessionId();
    log.debug("CONN_CLOSED: sessionId={}, participant in session: {}", sid, ps);
    ParticipantRequest preq = new ParticipantRequest(sid, null);
    updateThreadName(sid + "|wsclosed");
    userControl.leaveRoom(null, null, preq);
    updateThreadName(HANDLER_THREAD_NAME);
  }

  @Override
  public void handleTransportError(Session session, Throwable exception) throws Exception {
    log.debug("Transport error for session id {}", session != null
        ? session.getSessionId()
            : "NULL_SESSION", exception);
  }

  private void updateThreadName(String name) {
    Thread.currentThread().setName("user:" + name);
  }
}
