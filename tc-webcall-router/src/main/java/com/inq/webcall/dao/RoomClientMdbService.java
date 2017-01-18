package com.inq.webcall.dao;

import com.inq.webcall.monitor.roommonitor.WebCallEndpointMonitor;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.concurrent.ExecutionException;

public class RoomClientMdbService {

    private static MongoDatabase db = MongoDBService.getInstance().getDBInstance();

    private final static Logger log = LoggerFactory.getLogger(WebCallEndpointMonitor.class);

    /**
     * This is from client side.
     *
     * @param str
     */
    public void saveWebRTCEndpointStat(String str) {
        MongoCollection<Document> roomlog = db.getCollection(IMongoDBService.TBL_CLIENT_WEBRTCENDPOINT_STAT_FORMATTED);
        try {
            Document document = getStaticFromClientStatString(str);
            roomlog.insertOne(document);
        }catch (Exception e) {
            log.error("Fail to save str", e);
        }
    }

    public static Document getStaticFromClientStatString(String clientStatStr) {
        JSONParser parser = new JSONParser();

        Object obj = null;
        try {
            obj = parser.parse(clientStatStr);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        JSONObject jsonObject = (JSONObject) obj;


        Document newDoc = new Document();
        Set<String> keySet = jsonObject.keySet();
        String newKey = "";
        for (String oldKey : keySet) {
            String oldValue = (String) jsonObject.get(oldKey);

            if (oldKey.equals("stats-id")) {
                String ssrcId = oldValue.substring(5);
                String ssrcType = ssrcId.substring(ssrcId.length() - 4);
                newDoc.put("ssrcType", ssrcType);
            } else {
                if (!oldKey.equals("_id")) {
                    if (oldKey.startsWith("outboundStats-")) {
                        newKey = oldKey.substring("outboundStats-".length());
                    } else if (oldKey.startsWith("inboudStats-")) {
                        newKey = oldKey.substring("inboudStats-".length());
                    } else {
                        newKey = oldKey;
                    }
                    newDoc.put(newKey, oldValue);
                }
            }
        }

        newDoc.put("location", "client");
        return newDoc;
    }
}
