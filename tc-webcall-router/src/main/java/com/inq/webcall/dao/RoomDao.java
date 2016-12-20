package com.inq.webcall.dao;

import org.bson.Document;

public class RoomDao {



    /*
     *
     * @see InqRoomManager.publishMedia
     * @see InqRoomManager.subscribe
     */
    public static void saveRoomEventSDPAccepted(String roomName, String sdp, String type, String pName) {
        Document documentRoom = new Document();
        documentRoom.put("room", roomName);
        documentRoom.put("LocalSessionDescriptor", sdp);
        documentRoom.put("streamType", type);
        documentRoom.put("participantName", pName);
        documentRoom.put("timestamp", System.currentTimeMillis());
        WebRTCStatDao.getInstance().saveRoomStat(documentRoom);
    }

    /*
        @see InqRoomManager.createRoom
        @see InqRoomManager.closeRoom
     */
    public static void saveRoomEvent(String roomName, String event) {
        Document documentRoom = new Document();
        documentRoom.put("room", roomName);
        documentRoom.put("event", event);
        documentRoom.put("timestamp", System.currentTimeMillis());
        WebRTCStatDao.getInstance().saveRoomStat(documentRoom);
    }
}
