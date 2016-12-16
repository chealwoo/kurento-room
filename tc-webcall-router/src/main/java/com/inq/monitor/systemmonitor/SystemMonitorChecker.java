package com.inq.monitor.systemmonitor;

import com.inq.monitor.roommonitor.RoomMonitor;
import com.inq.webcall.room.internal.InqParticipant;

import java.util.TimerTask;

/**
 * Created by dlee on 12/16/2016.
 */
public class SystemMonitorChecker extends TimerTask {
    private SystemMonitor systemMonitor = null;

    public SystemMonitorChecker(SystemMonitor systemMonitor) {
        this.systemMonitor = systemMonitor;
    }

    public void run() {
        systemMonitor.saveSystem();
    }
}