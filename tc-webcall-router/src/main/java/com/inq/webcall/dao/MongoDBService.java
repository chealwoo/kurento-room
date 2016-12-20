package com.inq.webcall.dao;

import com.google.gson.JsonArray;
import com.inq.webcall.WebCallApplication;
import com.inq.webcall.monitor.systemmonitor.SystemMonitor;
import com.inq.webcall.monitor.systemmonitor.SystemMonitorChecker;
import com.mongodb.MongoClient;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoDatabase;
import org.kurento.jsonrpc.JsonUtils;

import java.util.LinkedList;
import java.util.List;
import java.util.Timer;

import static org.kurento.commons.PropertiesManager.getPropertyJson;

public class MongoDBService implements IMongoDBService {

    private MongoClient mongo;
    private MongoDatabase db;
    private static MongoDBService mongoDBService;

    private MongoDBService() {
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

        // startWebRtcEndPointChecker();
    }

    public void startWebRtcEndPointChecker() {
        Timer time = new Timer(); // Instantiate Timer Object
        SystemMonitorChecker systemMonitorChecker = new SystemMonitorChecker(new SystemMonitor());
        time.schedule(systemMonitorChecker, 0, 1000); // Create Repetitively task for every 1 secs
    }

    public static MongoDBService getInstance() {
        if (mongoDBService == null) {
            mongoDBService = new MongoDBService();
        }
        return mongoDBService;
    }

    public MongoDatabase getDBInstance() {
        return getInstance().db;
    }
}
