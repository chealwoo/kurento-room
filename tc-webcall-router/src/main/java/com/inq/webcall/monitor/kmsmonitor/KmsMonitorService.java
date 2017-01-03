package com.inq.webcall.monitor.kmsmonitor;

import com.inq.webcall.dao.IMongoDBService;
import com.inq.webcall.dao.MongoDBService;
import com.inq.webcall.room.InqNotificationRoomManager;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;

public class KmsMonitorService {

    @Autowired
    private InqNotificationRoomManager roomManager;

    private String kmsUri;
    private KmsMonitor kmsMonitor;
    private MongoDatabase db;

    public KmsMonitorService(String kmsUri) {
        this.kmsUri = kmsUri;
        kmsMonitor = new KmsMonitor(kmsUri);
        db = MongoDBService.getInstance().getDBInstance();
    }

    public void saveKmsStat() throws InterruptedException {

        Document documentKms = new Document();

        documentKms.put("kmsId", kmsUri);
        documentKms.put("timeStamp", System.currentTimeMillis());

        KmsStats kmsStats = kmsMonitor.updateStats();
        documentKms.put("NumPipelines", kmsStats.getNumPipelines());
        documentKms.put("NumElements", kmsStats.getNumElements());
        documentKms.put("NumWebRtcEndpoints", kmsStats.getNumWebRtcEndpoints());
        documentKms.put("NumRooms", (roomManager != null) ? roomManager.getRoomCnt(): "unknown");

        documentKms.put("InboundByteCount", kmsStats.getWebRtcStats().getInbound().getByteCount());
        documentKms.put("InboundPacketLostCount", kmsStats.getWebRtcStats().getInbound().getPacketLostCount());
        documentKms.put("InboundFractionLost", kmsStats.getWebRtcStats().getInbound().getFractionLost());
        documentKms.put("InboundDeltaNacks", kmsStats.getWebRtcStats().getInbound().getDeltaNacks());
        documentKms.put("InboundDeltaPlis", kmsStats.getWebRtcStats().getInbound().getDeltaPlis());
        documentKms.put("InboundJitter", kmsStats.getWebRtcStats().getInbound().getJitter());
        
        documentKms.put("OutboundByteCount", kmsStats.getWebRtcStats().getOutbound().getByteCount());
        documentKms.put("OutboundTargetBitrate", kmsStats.getWebRtcStats().getOutbound().getTargetBitrate());
        documentKms.put("OutboundRtt", kmsStats.getWebRtcStats().getOutbound().getRtt());
        documentKms.put("OutboundDeltaNacks", kmsStats.getWebRtcStats().getOutbound().getDeltaNacks());
        documentKms.put("OutboundDeltaPlisr", kmsStats.getWebRtcStats().getOutbound().getDeltaPlis());

        MongoCollection<Document> kmsStatLog = db.getCollection(IMongoDBService.TBL_KMS_STAT);
        kmsStatLog.insertOne(documentKms);
    }
}
