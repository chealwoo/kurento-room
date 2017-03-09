package com.inq.webcall.dao;

import com.mongodb.BasicDBObject;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;


public class WebRTCStatDao implements IWebRTCStatDao {

    private MongoDatabase db;
    private static WebRTCStatDao webRTCStatDao;

    private WebRTCStatDao() {
        db = MongoDBService.getInstance().getDBInstance();
    }

    public static WebRTCStatDao getInstance() {
        if (webRTCStatDao == null) {
            webRTCStatDao = new WebRTCStatDao();
        }
        return webRTCStatDao;
    }

    public void saveWebRTCEndpoint(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_WEBRTCENDPOINT);
        roomlog.insertOne(document);
    }

    public void saveWebRTCEndpointStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_WEBRTCENDPOINT_STAT);
        roomlog.insertOne(document);
    }

    public void saveAppSrvSystemStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_APP_SRV_SYSTEM_STAT);
        roomlog.insertOne(document);
    }

    /**
     * This is from client side.
     *
     * @param str
     */
    public void saveWebRTCEndpointStat(String str) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_CLIENT_WEBRTCENDPOINT_STAT);
        Document document = new Document();
        document.put("Stats", str);
        roomlog.insertOne(document);
    }

    /**
     * Saves client log
     * @param chatId
     * @param logLines
     */
    public void saveClientLogLine(String chatId, String logLines) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_CLIENT_LOG_LINE);
        Document document = new Document();
        document.put("chatId", chatId);
        document.put("logLines", logLines);
        roomlog.insertOne(document);
    }

    public void findWebRTCEndpointStat(String roomName) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_WEBRTCENDPOINT_STAT);

        BasicDBObject searchQuery = new BasicDBObject();
        searchQuery.put("room", roomName);

        FindIterable<Document> cursor = roomlog.find(searchQuery);

        for (Document d : cursor) {
            System.out.println(d);
        }
    }

    public void findParticipantStat(String roomName) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_PARTICIPANT);

        BasicDBObject searchQuery = new BasicDBObject();
        searchQuery.put("room", roomName);

        FindIterable<Document> cursor = roomlog.find(searchQuery);

        for (Document d : cursor) {
            System.out.println(d);
        }
    }

    // just for testing
    public static void main(String[] args) {
        String room = "qroom1";
        WebRTCStatDao.getInstance().findParticipantStat(room);
        WebRTCStatDao.getInstance().findWebRTCEndpointStat(room);
    }
}
