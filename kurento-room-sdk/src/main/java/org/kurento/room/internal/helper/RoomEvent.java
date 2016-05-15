package org.kurento.room.internal.helper;

import java.time.LocalDateTime;

/**
 * Created by chealwoo on 5/14/2016.
 */
public class RoomEvent {
    private LocalDateTime startTimePoint;
    private LocalDateTime endTimePoint;
    private String roomId;
    private String agentId;
    private String kmsId;

    public RoomEvent(String roomId, String agentId, String kmsId) {
        startTimePoint = LocalDateTime.now();
        this.roomId = roomId;
        this.agentId = agentId;
        this.kmsId = kmsId;
    }

    public void closeRoomEvent(){
        endTimePoint = LocalDateTime.now();
    }

    public LocalDateTime getStartTimePoint() {
        return startTimePoint;
    }

    public LocalDateTime getEndTimePoint() {
        return endTimePoint;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getAgentId() {
        return agentId;
    }

    public String getKmsId() {
        return kmsId;
    }
}
