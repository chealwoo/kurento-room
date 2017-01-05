package com.inq.webcall.dao;

import com.mongodb.client.MongoCollection;
import org.bson.Document;
import org.kurento.room.exception.RoomException;


public class RoomErrorDao {

    public static void saveRoomError(String roomId, String participantName, String event, RoomException error) {
        MongoCollection<Document> roomlog = MongoDBService.getInstance().getDBInstance().getCollection(IMongoDBService.TBL_ROOM_ERROR);
        Document document = new Document();

        document.put("room", roomId);
        document.put("participantName", event);
        document.put("event", participantName);
        document.put("timestamp", System.currentTimeMillis());
        document.put("errorCode", error.getCodeValue());
        document.put("errorMsg", error.getMessage());
/*
      String dataVal = data != null ? data.toString() : null;
      t.sendError(error.getCodeValue(), error.getMessage(), dataVal);
 */

        roomlog.insertOne(document);
    }

}
