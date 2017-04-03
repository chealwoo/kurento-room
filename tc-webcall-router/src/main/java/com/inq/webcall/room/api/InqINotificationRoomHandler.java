package com.inq.webcall.room.api;

import com.inq.webcall.room.internal.InqKurentoClientSessionInfo;
import org.kurento.room.NotificationRoomManager;
import org.kurento.room.api.NotificationRoomHandler;
import org.kurento.room.api.pojo.ParticipantRequest;
import org.kurento.room.api.pojo.UserParticipant;
import org.kurento.room.exception.RoomException;

import java.util.Set;

public interface InqINotificationRoomHandler extends NotificationRoomHandler {

    /**
     * Called as a result of
     * {@link InqNotificationRoomManager#joinRoom(String, String, boolean, boolean, ParticipantRequest, String)} . The new
     * participant should be responded with all the available information: the existing peers and, for
     * any publishers, their stream names. The current peers should receive a notification of the join
     * event.
     *
     * @param request              instance of {@link ParticipantRequest} POJO to identify the user and the request
     * @param roomName             the room's name
     * @param newUserName          the new user
     * @param existingParticipants instances of {@link UserParticipant} POJO representing the already existing peers
     * @param error                instance of {@link RoomException} POJO, includes a code and error message. If not
     *                             null, then the join was unsuccessful and the user should be responded accordingly.
     */
    void onRoomCreated(ParticipantRequest request, String roomName, String newUserName,
                       Set<UserParticipant> existingParticipants, InqKurentoClientSessionInfo kcSessionInfo, RoomException error);

    void onParticipantJoined(ParticipantRequest request, String roomName, String newUserName,
                             Set<UserParticipant> existingParticipants, InqKurentoClientSessionInfo kcSessionInfo, RoomException error);

}
