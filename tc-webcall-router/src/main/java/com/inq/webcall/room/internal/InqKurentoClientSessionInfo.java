package com.inq.webcall.room.internal;

import com.inq.webcall.room.api.InqIKurentoClientSessionInfo;
import org.kurento.room.internal.DefaultKurentoClientSessionInfo;


public class InqKurentoClientSessionInfo extends DefaultKurentoClientSessionInfo implements InqIKurentoClientSessionInfo {

    private boolean isRoomCreated = false;
    private String authToken = "";

    public InqKurentoClientSessionInfo(String participantId, String roomName) {
        super(participantId, roomName);
    }

    @Override
    public void setRoomCreated(boolean roomCreated) {
        isRoomCreated = roomCreated;
    }

    @Override
    public boolean isRoomCreated() {
        return isRoomCreated;
    }

    @Override
    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    @Override
    public String getAuthToken() {
        return authToken;
    }
}
