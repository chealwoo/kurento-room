package com.inq.webcall.room.internal;

import com.inq.webcall.monitor.roommonitor.WebCallEndpointMonitor;

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
        WebCallEndpointMonitor.crunchWebRtcEndpoint(inqParticipant);
    }
}
