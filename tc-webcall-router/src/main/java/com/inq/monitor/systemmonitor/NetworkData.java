package com.inq.monitor.systemmonitor;

import org.hyperic.sigar.*;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * http://stackoverflow.com/questions/11034753/sigar-network-speed
 */
public class NetworkData {
    private static final Logger log = LoggerFactory.getLogger(SystemMonitor.class);

    static Map<String, Long> rxCurrentMap = new HashMap<String, Long>();
    static Map<String, List<Long>> rxChangeMap = new HashMap<String, List<Long>>();
    static Map<String, Long> txCurrentMap = new HashMap<String, Long>();
    static Map<String, List<Long>> txChangeMap = new HashMap<String, List<Long>>();

    private static Sigar sigar;

    /**
     * @throws InterruptedException
     * @throws SigarException
     */
    public NetworkData(Sigar s) throws SigarException, InterruptedException {
        sigar = s;
        getMetric(sigar);
        System.out.println(networkInfo());
        Thread.sleep(1000);
    }

    public static void main(String[] args) throws SigarException,
            InterruptedException {
        new NetworkData(new Sigar());
        NetworkData.newMetricThread();
    }

    public static String networkInfo() throws SigarException {
        String info = sigar.getNetInfo().toString();
        info += "\n" + sigar.getNetInterfaceConfig().toString();
        return info;
    }

    public static String getDefaultGateway() throws SigarException {
        return sigar.getNetInfo().getDefaultGateway();
    }

    public static void newMetricThread() throws SigarException, InterruptedException {
        while (true) {
            Long[] m = getMetric(sigar);
            long totalrx = m[0];
            long totaltx = m[1];
            System.out.print("totalrx(download): ");
            System.out.println("\t" + Sigar.formatSize(totalrx));
            System.out.print("totaltx(upload): ");
            System.out.println("\t" + Sigar.formatSize(totaltx));
            System.out.println("-----------------------------------");
            Thread.sleep(1000);
        }
    }

    public static void getMetricThread(Sigar sigar) throws SigarException, InterruptedException {
        Long[] m = getMetric(sigar);
        long totalrx = m[0];
        long totaltx = m[1];
         System.out.print("totalrx(download): ");
        System.out.print(Sigar.formatSize(totalrx) + "\t");
        System.out.print("totaltx(upload): ");
        System.out.print(Sigar.formatSize(totaltx) + "\t");
        System.out.println("-----------------------------------");
    }
    public static void getMetricThread(Sigar sigar, Document document) throws SigarException, InterruptedException {
        Long[] m = getMetric(sigar);
        long totalrx = m[0];
        long totaltx = m[1];
        document.put("netDownload",totalrx);
        document.put("netUpload",totaltx);
    }

    public static Long[] getMetric(Sigar sigar) throws SigarException {
        for (String ni : sigar.getNetInterfaceList()) {
            // System.out.println(ni);
            NetInterfaceStat netStat = sigar.getNetInterfaceStat(ni);
            NetInterfaceConfig ifConfig = sigar.getNetInterfaceConfig(ni);
            String hwaddr = null;
            if (!NetFlags.NULL_HWADDR.equals(ifConfig.getHwaddr())) {
                hwaddr = ifConfig.getHwaddr();
            }
            if (hwaddr != null) {
                long rxCurrenttmp = netStat.getRxBytes();
                saveChange(rxCurrentMap, rxChangeMap, hwaddr, rxCurrenttmp, ni);
                long txCurrenttmp = netStat.getTxBytes();
                saveChange(txCurrentMap, txChangeMap, hwaddr, txCurrenttmp, ni);
            }
        }
        long totalrx = getMetricData(rxChangeMap);
        long totaltx = getMetricData(txChangeMap);
        for (List<Long> l : rxChangeMap.values())
            l.clear();
        for (List<Long> l : txChangeMap.values())
            l.clear();
        return new Long[]{totalrx, totaltx};
    }

    private static long getMetricData(Map<String, List<Long>> rxChangeMap) {
        long total = 0;
        for (Entry<String, List<Long>> entry : rxChangeMap.entrySet()) {
            int average = 0;
            for (Long l : entry.getValue()) {
                average += l;
            }
            total += average / entry.getValue().size();
        }
        return total;
    }

    private static void saveChange(Map<String, Long> currentMap,
                                   Map<String, List<Long>> changeMap, String hwaddr, long current,
                                   String ni) {
        Long oldCurrent = currentMap.get(ni);
        if (oldCurrent != null) {
            List<Long> list = changeMap.get(hwaddr);
            if (list == null) {
                list = new LinkedList<Long>();
                changeMap.put(hwaddr, list);
            }
            list.add((current - oldCurrent));
        }
        currentMap.put(ni, current);
    }

}
