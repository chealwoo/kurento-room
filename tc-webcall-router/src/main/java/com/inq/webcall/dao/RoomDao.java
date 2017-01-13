package com.inq.webcall.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.kurento.room.exception.RoomException;

public class RoomDao {

    private static MongoDatabase db = MongoDBService.getInstance().getDBInstance();

    private static void saveRoomEvent(Document document, String roomName, String partyName) {
        document.put("participantName", partyName);

        saveRoomEvent(document, roomName);
    }

    private static void saveRoomEvent(Document document, String roomName) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_ROOM);
        document.put("room", roomName);
        document.put("timestamp", System.currentTimeMillis());

        roomlog.insertOne(document);
    }

    /*
 * @see InqRoomManager.publishMedia
 * @see InqRoomManager.subscribe
 */

    public static void saveParticipantPublishSuccess(String roomName, String partyName, String sdp) {
        Document document = new Document();
        document.put("sdp", sdp);
        document.put("eventType", RoomEventTypeEnum.SUBSCRIBED);
        saveRoomEvent(document, roomName, partyName);
    }

    public static void saveParticipantPublishFailure(String roomName, String partyName, String method, RoomException err) {
        RoomErrorDao.saveRoomError(roomName, partyName, method, err);
    }

    public static void saveParticipantSubscribeSuccess(String roomName, String partyName, String sdp, String pubName) {
        Document document = new Document();
        document.put("sdp", sdp);
        document.put("publisherName", pubName);
        document.put("eventType", RoomEventTypeEnum.SUBSCRIBED);
        saveRoomEvent(document, roomName, partyName);
    }

    public static void saveRoomCreatedEvent(String roomName){
        Document document = new Document();
        document.put("eventType", RoomEventTypeEnum.CREATED);
        saveRoomEvent(document, roomName);
    }

    public static void saveRoomClosedEvent(String roomName){
        Document document = new Document();
        document.put("eventType", RoomEventTypeEnum.CLOSED);
        saveRoomEvent(document, roomName);
    }

    public static void saveParticipantJoinEvent(String roomName, String partyName){
        Document document = new Document();
        document.put("eventType", RoomEventTypeEnum.PARTY_JOIN);
        saveRoomEvent(document, roomName, partyName);
    }

    public static void saveParticipantLeaveEvent(String roomName, String partyName){
        Document document = new Document();
        document.put("eventType", RoomEventTypeEnum.PARTY_LEAVE);
        saveRoomEvent(document, roomName, partyName);
    }


}
