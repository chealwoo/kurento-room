package com.inq.webcall.room.api;

import org.kurento.client.KurentoClient;
import org.kurento.room.api.KurentoClientSessionInfo;

public interface InqIKurentoClientSessionInfo extends KurentoClientSessionInfo {
    /**
     * @return the room's name (or id) for whom a {@link KurentoClient} will be needed
     */
    public String getRoomName();

    void setRoomCreated(boolean isRoomCreated);
    boolean isRoomCreated();

    void setAuthToken(String authToken);
    String getAuthToken();

    void setSiteId(String siteId);
    String getSiteId();

    void setKmsUri(String kmsUri);
    String getKmsUri();

    void setParticipantName(String participantName);
    String getParticipantName();
}
