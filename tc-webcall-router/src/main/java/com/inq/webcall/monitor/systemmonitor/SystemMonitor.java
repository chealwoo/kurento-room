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
 * http://stackoverflow.com/questions/12214114/how-to-include-sigar-api-in-java-project
 */
@Service
public class SystemMonitor {

    private static final Logger log = LoggerFactory.getLogger(SystemMonitor.class);

    //    @Autowired
    public static InqNotificationRoomManager roomManager;

    private static Sigar sigar = new Sigar();

    public SystemMonitor() {
    }

    public static void getInformationsAboutMemory() {
        System.out.println("**************************************");
        System.out.println("*** Informations about the Memory: ***");
        System.out.println("**************************************\n");

        Mem mem = null;
        try {
            mem = sigar.getMem();
        } catch (SigarException se) {
            se.printStackTrace();
        }

        String memTotal = "" + mem.getFree() / 1024 / 1024;
        String memUsed = "" + mem.getUsed() / 1024 / 1024;

        System.out.print(String.format("%s\t%s", memTotal, memUsed));

/*        System.out.println("Actual total free system memory: "
                + mem.getActualFree() / 1024 / 1024 + " MB");
        System.out.println("Actual total used system memory: "
                + mem.getActualUsed() / 1024 / 1024 + " MB");
        System.out.println("Total free system memory ......: " + mem.getFree()
                / 1024 / 1024 + " MB");
        System.out.println("System Random Access Memory....: " + mem.getRam()
                + " MB");
        System.out.println("Total system memory............: " + mem.getTotal()
                / 1024 / 1024 + " MB");
        System.out.println("Total used system memory.......: " + mem.getUsed()
                / 1024 / 1024 + " MB");

        System.out.println("\n**************************************\n");*/
    }

    /*
    http://stackoverflow.com/questions/28039533/how-to-find-total-cpu-utilisation-in-java-using-sigar
     */
    public static void getSystemStatistics() {
        Mem mem = null;
        CpuTimer cputimer = null;
        FileSystemUsage filesystemusage = null;
        try {
            mem = sigar.getMem();
            cputimer = new CpuTimer(sigar);
            filesystemusage = sigar.getFileSystemUsage("C:");
        } catch (SigarException se) {
            se.printStackTrace();
        }

        String memTotal = "" + mem.getFree() / 1024 / 1024;
        String memUsed = "" + mem.getUsed() / 1024 / 1024;

//        System.out.print(String.format( "%s\t%s", memTotal, memUsed));

        System.out.print(cputimer.getCpuUsage() + "\t");
        System.out.print(mem.getUsedPercent() + "\t");
        System.out.print(filesystemusage.getUsePercent() + "\n");
    }

    public static void getSystemStatistics(Document document) {
        Mem mem = null;
        CpuTimer cputimer = null;
        FileSystemUsage filesystemusage = null;
        try {
            mem = sigar.getMem();
            cputimer = new CpuTimer(sigar);
            filesystemusage = sigar.getFileSystemUsage("C:");
        } catch (SigarException se) {
            se.printStackTrace();
        }

        String memTotal = "" + mem.getFree() / 1024 / 1024;
        String memUsed = "" + mem.getUsed() / 1024 / 1024;

//        System.out.print(String.format( "%s\t%s", memTotal, memUsed));
        document.put("cpuUsage", cputimer.getCpuUsage());
        document.put("memUsage", mem.getUsedPercent());
        System.out.print(cputimer.getCpuUsage() + "\t");
        System.out.print(mem.getUsedPercent() + "\t");
        System.out.print(filesystemusage.getUsePercent() + "\n");
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

    public static void main(String[] args) throws Exception {

        // getInformationsAboutMemory();
        getSystemStatistics();
//        NetworkData.getMetricThread(sigar);
    }
}

