package com.inq.webcall.room.internal;

import com.inq.webcall.room.api.InqIKurentoClientSessionInfo;
import org.kurento.room.internal.DefaultKurentoClientSessionInfo;


public class InqKurentoClientSessionInfo extends DefaultKurentoClientSessionInfo implements InqIKurentoClientSessionInfo {

    private boolean isRoomCreated = false;
    private String participantName = "";
    private String authToken = "";
    private String siteId = "";
    private String kmsUri = "";

    public InqKurentoClientSessionInfo(String participantId, String roomName, String participantName) {
        super(participantId, roomName);
        setParticipantName(participantName);
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

    @Override
    public void setKmsUri(String kmsUri) {
        this.kmsUri = kmsUri;
    }

    @Override
    public String getKmsUri() {
        return kmsUri;
    }

    @Override
    public void setParticipantName(String participantName) {
        this.participantName = participantName;
    }

    @Override
    public String getParticipantName() {
        return participantName;
    }


}
