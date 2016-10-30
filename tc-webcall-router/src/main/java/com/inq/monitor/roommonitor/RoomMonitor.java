package com.inq.monitor.roommonitor;

import com.inq.webcall.dao.WebRTCStatDao;
import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.internal.InqParticipant;
import org.bson.Document;
import org.kurento.client.*;
import org.kurento.client.internal.server.ProtocolException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.Map;

/**
 * Created by dlee on 10/25/2016.
 */
public class RoomMonitor {
    private final static Logger log = LoggerFactory.getLogger(RoomMonitor.class);

    public static void crunchWebRtcEndpoint(InqParticipant inqParticipant) {
        try {
            WebRtcEndpoint webRtcEndpoint = inqParticipant.getPublisher().getWebEndpoint();
            MediaType mediaType = MediaType.VIDEO;
            Map<String, Stats> stats = webRtcEndpoint.getStats(mediaType);
            log.debug("Room: '{}', User: '{}', Endpoint: '{}' Information", inqParticipant.getRoom().getName(), inqParticipant.getName(), webRtcEndpoint.getId());
            for (Stats s : stats.values()) {
                Document document = new Document();
                document.put("room", inqParticipant.getRoom().getName());
                document.put("participant", inqParticipant.getName());
                document.put("state-Id", s.getId());
                document.put("state-timeStame", s.getTimestamp());
                document.put("state-type", s.getType().name());

                switch (s.getType()) {
                    case inboundrtp:
                        RTCInboundRTPStreamStats inboudStats = (RTCInboundRTPStreamStats) s;
                        document.put("state-Jitter", inboudStats.getJitter());
                        document.put("state-FractionLost", inboudStats.getFractionLost());
                        document.put("state-BytesReceived", inboudStats.getBytesReceived());
                        document.put("state-PliCount", inboudStats.getPliCount());
                        document.put("state-PacketsLost", inboudStats.getPacketsLost());
                        document.put("state-NackCount", inboudStats.getNackCount());
                        break;

                    case outboundrtp:
                        RTCOutboundRTPStreamStats outboundStats = (RTCOutboundRTPStreamStats) s;
                        document.put("state-RoundTripTime", outboundStats.getRoundTripTime());
                        document.put("state-TargetBitrate", outboundStats.getTargetBitrate());
                        document.put("state-BytesSent", outboundStats.getBytesSent());
                        document.put("state-PliCount", outboundStats.getPliCount());
                        document.put("state-NackCount", outboundStats.getNackCount());
                        break;

                    default:
                        break;
                }
                WebRTCStatDao.getInstance().saveWebRTCStat(document);
            }
        } catch (ProtocolException e) {

            log.error("Error ", e);
        } catch (Throwable t) {
            // The WebRtcEndpoint may have been released. This does not need to
            // be a "severe" problem
            // TODO log t just in case.
            log.error("Error ", t);
        }

    }
}
