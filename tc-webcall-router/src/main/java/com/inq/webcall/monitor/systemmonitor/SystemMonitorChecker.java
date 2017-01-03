package com.inq.webcall.monitor.systemmonitor;

import java.util.TimerTask;

public class SystemMonitorChecker extends TimerTask {
    private SystemMonitor systemMonitor = null;

    public SystemMonitorChecker(SystemMonitor systemMonitor) {
        this.systemMonitor = systemMonitor;
    }

    public void run() {
        systemMonitor.saveSystem();
    }
}