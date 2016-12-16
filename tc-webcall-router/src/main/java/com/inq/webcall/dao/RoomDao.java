package com.inq.webcall.dao;

import org.bson.Document;

/**
 * Created by dlee on 10/28/2016.
 */
public class RoomDao {

    public static void saveRoomEventSDPAccepted(String roomName, String sdp, String type, String pName) {
        Document documentRoom = new Document();
        documentRoom.put("room", roomName);
        documentRoom.put("LocalSessionDescriptor", sdp);
        documentRoom.put("streamType", type);
        documentRoom.put("participantName", pName);
        documentRoom.put("timestamp", System.currentTimeMillis());
        WebRTCStatDao.getInstance().saveRoomStat(documentRoom);
    }

    public static void saveRoomEvent(String roomName, String event) {
        Document documentRoom = new Document();
        documentRoom.put("room", roomName);
        documentRoom.put("event", event);
        documentRoom.put("timestamp", System.currentTimeMillis());
        WebRTCStatDao.getInstance().saveRoomStat(documentRoom);
    }
}
