package com.inq.webcall.dao;

import com.inq.webcall.WebCallApplication;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClient;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.Date;


public class WebRTCStatDao implements IWebRTCStatDao {

    private MongoClient mongo;
    private MongoDatabase db;
    private static WebRTCStatDao webRTCStatDao;

    public WebRTCStatDao() {
        this.mongo = new MongoClient(WebCallApplication.MONGOD_SERVER_URI, 27017);
        db = mongo.getDatabase(WebCallApplication.MONGOD_DB_NAME);
    }

    public static WebRTCStatDao getInstance() {
        if (webRTCStatDao == null) {
            webRTCStatDao = new WebRTCStatDao();
        }
        return webRTCStatDao;
    }

    @Override
    public void saveWebRTCStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection("roomlog");
        roomlog.insertOne(document);
    }

    public void findRoomWebRTCStat(String roomName){
        MongoCollection<Document> roomlog = db.getCollection("roomlog");

        BasicDBObject searchQuery = new BasicDBObject();
        searchQuery.put("room", roomName);

        FindIterable<Document> cursor = roomlog.find(searchQuery);

        for (Document d: cursor) {
            System.out.println(d);
        }
    }

    // just for testing
    public static void main(String[] args) {
        WebRTCStatDao.getInstance().findRoomWebRTCStat("test3");
    }
}
