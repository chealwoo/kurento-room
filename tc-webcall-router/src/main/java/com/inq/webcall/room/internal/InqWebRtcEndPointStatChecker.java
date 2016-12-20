package com.inq.webcall.room.internal;

import com.inq.webcall.monitor.roommonitor.WebCallEndpointMonitor;
import org.kurento.client.WebRtcEndpoint;

import java.util.TimerTask;


public class InqWebRtcEndPointStatChecker extends TimerTask {
    private InqParticipant inqParticipant = null;
    private InqParticipant subscriber = null;
    private WebRtcEndpoint webRtcEndPoint;

    public InqWebRtcEndPointStatChecker(InqParticipant inqParticipant, InqParticipant subscriber, WebRtcEndpoint webRtcEndPoint) {
        this.inqParticipant = inqParticipant;
        this.subscriber = subscriber;
        this.webRtcEndPoint = webRtcEndPoint;
    }

    public void run() {
        if (inqParticipant.isClosed()) {
            this.cancel();
        }
        WebCallEndpointMonitor.crunchWebRtcEndpoint(inqParticipant, subscriber, webRtcEndPoint);
    }
}
