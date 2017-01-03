package com.inq.webcall.monitor.systemmonitor;

import com.inq.webcall.controller.LttController;
import com.inq.webcall.dao.WebRTCStatDao;
import com.inq.webcall.room.InqNotificationRoomManager;
import org.bson.Document;
import org.hyperic.sigar.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 *
 * http://stackoverflow.com/questions/12214114/how-to-include-sigar-api-in-java-project
 * http://stackoverflow.com/questions/28039533/how-to-find-total-cpu-utilisation-in-java-using-sigar
 */
@Service
public class SystemMonitor {
    private static final Logger log = LoggerFactory.getLogger(SystemMonitor.class);

    //    @Autowired
    public static InqNotificationRoomManager roomManager;
    private static Sigar sigar = new Sigar();

    public SystemMonitor() {}

    public static void getSystemStatistics(Document document) {
        Mem mem = null;
        CpuTimer cputimer = null;
        try {
            mem = sigar.getMem();
            cputimer = new CpuTimer(sigar);
        } catch (SigarException se) {
            se.printStackTrace();
        }

        String memTotal = "" + mem.getFree() / 1024 / 1024;
        String memUsed = "" + mem.getUsed() / 1024 / 1024;

        if(log.isTraceEnabled()){
            log.trace(String.format( "%s\t%s", memTotal, memUsed));
        }
        document.put("cpuUsage", cputimer.getCpuUsage());
        document.put("memUsage", mem.getUsedPercent());
    }

    public void saveSystem() {
        Document document = new Document();

        document.put("lttName", LttController.LTT_ROOM_NAME_PREFIX);
        document.put("timestamp", System.currentTimeMillis());
        document.put("roomCnt", roomManager != null ? roomManager.getRoomCnt() : 0);
        getSystemStatistics(document);
        try {
            NetworkData.getMetricThread(sigar, document);
        } catch (SigarException e) {
            log.error("Error", e);
        } catch (InterruptedException e) {
            log.error("Error", e);
        }

        WebRTCStatDao.getInstance().saveAppSrvSystemStat(document);
    }
}

