package com.inq.monitor.roommonitor;

import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.internal.InqParticipant;
import org.kurento.client.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * Created by dlee on 10/25/2016.
 */
public class RoomMonitor {
    private final static Logger log = LoggerFactory.getLogger(RoomMonitor.class);

    public static void crunchWebRtcEndpoint(InqParticipant inqParticipant) {
        try {
            WebRtcEndpoint webRtcEndpoint = inqParticipant.getPublisher().getWebEndpoint();
            Map<String, Stats> stats = webRtcEndpoint.getStats();
            log.debug("Room: '{}', User: '{}', Endpoint: '{}' Information", inqParticipant.getRoom().getName(), inqParticipant.getName(), webRtcEndpoint.getId());
            for (Stats s : stats.values()) {
                log.info("Status has been changed Id:{}, Timestamp:{}, Type:{}", s.getId(), s.getTimestamp(), s.getType());
                switch (s.getType()) {
                    case inboundrtp:
                        RTCInboundRTPStreamStats inboudStats = (RTCInboundRTPStreamStats) s;
                        log.debug("Jitter: {}", inboudStats.getJitter());
                        log.debug("FractionLost: {}", inboudStats.getFractionLost());
                        log.debug("BytesReceived: {}", inboudStats.getBytesReceived());
                        log.debug("PliCount: {}", inboudStats.getPliCount());
                        log.debug("PacketsLost: {}", inboudStats.getPacketsLost());
                        log.debug("NackCount: {}", inboudStats.getNackCount());
                        break;

                    case outboundrtp:
                        RTCOutboundRTPStreamStats outboundStats = (RTCOutboundRTPStreamStats) s;
                        log.debug("RoundTripTime: {}", outboundStats.getRoundTripTime());
                        log.debug("TargetBitrate: {}", outboundStats.getTargetBitrate());
                        log.debug("BytesSent: {}", outboundStats.getBytesSent());
                        log.debug("PliCount: {}", outboundStats.getPliCount());
                        log.debug("NackCount: {}", outboundStats.getNackCount());
                        break;

                    default:
                        break;
                }
            }
        } catch (Throwable t) {
            // The WebRtcEndpoint may have been released. This does not need to
            // be a "severe" problem
            // TODO log t just in case.
            log.error("Error ", t);
        }
    }
}
