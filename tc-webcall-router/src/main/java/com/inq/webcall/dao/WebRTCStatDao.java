package com.inq.webcall.dao;

import com.google.gson.JsonArray;
import com.inq.webcall.monitor.systemmonitor.SystemMonitor;
import com.inq.webcall.monitor.systemmonitor.SystemMonitorChecker;
import com.inq.webcall.WebCallApplication;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClient;
import com.mongodb.ServerAddress;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.kurento.jsonrpc.JsonUtils;

import java.util.*;

import static org.kurento.commons.PropertiesManager.getPropertyJson;


public class WebRTCStatDao implements IWebRTCStatDao {

    private MongoClient mongo;
    private MongoDatabase db;
    private static WebRTCStatDao webRTCStatDao;

    private WebRTCStatDao() {
        JsonArray mongodUris = getPropertyJson(WebCallApplication.MONGOD_SERVER_URIS_PROPERTY,
                WebCallApplication.DEFAULT_MONGOD_SERVER_URIS, JsonArray.class);
        List<String> mongodUrisList = JsonUtils.toStringList(mongodUris);
        List<ServerAddress> mongoSrvAddrList = new LinkedList<>();

        for (String s : mongodUrisList) {
            String[] output = s.split(":");
            if (output.length == 2) {
                mongoSrvAddrList.add(new ServerAddress(output[0], Integer.valueOf(output[1])));
            } else {
                mongoSrvAddrList.add(new ServerAddress(output[0], 27017));
            }
        }

        this.mongo = new MongoClient(mongoSrvAddrList);

        db = mongo.getDatabase(WebCallApplication.MONGOD_DB_NAME);

        startWebRtcEndPointChecker();
    }

    public void startWebRtcEndPointChecker() {
        Timer time = new Timer(); // Instantiate Timer Object
        SystemMonitorChecker systemMonitorChecker = new SystemMonitorChecker(new SystemMonitor());
        time.schedule(systemMonitorChecker, 0, 5000); // Create Repetitively task for every 1 secs
    }


    public static WebRTCStatDao getInstance() {
        if (webRTCStatDao == null) {
            webRTCStatDao = new WebRTCStatDao();
        }
        return webRTCStatDao;
    }

    public void saveRoomStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_ROOM);
        roomlog.insertOne(document);
    }

    public void saveParticipantStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_PARTICIPANT);
        roomlog.insertOne(document);
    }

    public void saveWebRTCEndpoint(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_WEBRTCENDPOINT);
        roomlog.insertOne(document);
    }

    public void saveWebRTCEndpointStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_WEBRTCENDPOINT_STAT);
        roomlog.insertOne(document);
    }

    public void saveSystemStat(Document document) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_APPLICATION_SERVER_STAT);
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
