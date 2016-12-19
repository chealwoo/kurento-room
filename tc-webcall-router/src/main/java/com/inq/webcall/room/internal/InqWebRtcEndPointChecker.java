package com.inq.webcall.room.internal;

import com.inq.webcall.monitor.roommonitor.RoomMonitor;

import java.util.TimerTask;


public class InqWebRtcEndPointChecker extends TimerTask {
    private InqParticipant inqParticipant = null;

    public InqWebRtcEndPointChecker(InqParticipant inqParticipant) {
        this.inqParticipant = inqParticipant;
    }

    public void run() {
        if (inqParticipant.isClosed()) {
            this.cancel();
        }
        RoomMonitor.crunchWebRtcEndpoint(inqParticipant);
    }
}
