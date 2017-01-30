package com.inq.webcall.room.internal;

import com.inq.webcall.room.api.InqIKurentoClientSessionInfo;
import org.kurento.room.internal.DefaultKurentoClientSessionInfo;


public class InqKurentoClientSessionInfo extends DefaultKurentoClientSessionInfo implements InqIKurentoClientSessionInfo {

    private boolean isRoomCreated = false;
    private String authToken = "";
    private String siteId = "";

    public InqKurentoClientSessionInfo(String participantId, String roomName, String siteId) {
        super(participantId, roomName);
        setSiteId(siteId);
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

    @Override
    public String getSiteId() {
        return siteId;
    }

    @Override
    public void setSiteId(String siteId) {
        this.siteId = siteId;
    }
}
