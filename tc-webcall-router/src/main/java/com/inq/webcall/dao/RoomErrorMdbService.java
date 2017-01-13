package com.inq.webcall.dao;

import com.mongodb.client.MongoCollection;
import org.bson.Document;
import org.kurento.client.internal.server.KurentoServerException;
import org.kurento.room.exception.RoomException;


public class RoomErrorMdbService {

    public static void saveRoomError(String roomId, String participantName, String method, RoomException error) {
        Document document = new Document();

        document.put("method", method);
        document.put("errorCode", error.getCodeValue());
        document.put("errorMsg", error.getMessage());

        saveRoomError(roomId, participantName, document);
    }

    public static void saveRoomError(String roomId, String participantName, String method, KurentoServerException error) {
        Document document = new Document();

        document.put("method", method);
        document.put("errorCode", error.getCode());
        document.put("errorMsg", error.getMessage());

        saveRoomError(roomId, participantName, document);
    }

    public static void saveRoomError(String roomId, String participantName, String method, String errorMsg) {
        Document document = new Document();

        document.put("method", method);
        document.put("errorMsg", errorMsg);

        saveRoomError(roomId, participantName, document);
    }

    public static void saveRoomError(String roomId, String participantName, Document document) {
        MongoCollection<Document> roomlog = MongoDBService.getInstance().getDBInstance().getCollection(IMongoDBService.TBL_ROOM);

        document.put("room", roomId);
        document.put("participantName", participantName);
        document.put("event", RoomEventTypeEnum.ERROR.toString());
        document.put("timestamp", System.currentTimeMillis());

        roomlog.insertOne(document);
    }
}
