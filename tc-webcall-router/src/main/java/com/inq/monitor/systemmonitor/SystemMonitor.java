package com.inq.monitor.systemmonitor;

import java.io.*;
import java.util.*;
import java.text.*;
import java.lang.*;


import org.hyperic.sigar.*;

/**
 * http://stackoverflow.com/questions/12214114/how-to-include-sigar-api-in-java-project
 */
public class SystemMonitor {

    private static Sigar sigar = new Sigar();

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

        System.out.println("Actual total free system memory: "
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

        System.out.println("\n**************************************\n");
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

        System.out.print(mem.getUsedPercent() + "\t");
        System.out.print(cputimer.getCpuUsage() + "\t");
        System.out.print(filesystemusage.getUsePercent() + "\n");
    }

    public static void main(String[] args) throws Exception {

        getInformationsAboutMemory();
        getSystemStatistics();
        NetworkData.getMetricThread(sigar);
    }
}

