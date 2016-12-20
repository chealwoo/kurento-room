package com.inq.webcall.monitor.roommonitor;

import com.inq.webcall.dao.WebRTCStatDao;
import com.inq.webcall.room.internal.InqParticipant;
import org.bson.Document;
import org.kurento.client.*;
import org.kurento.client.internal.server.ProtocolException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class WebCallEndpointMonitor {
    private final static Logger log = LoggerFactory.getLogger(WebCallEndpointMonitor.class);

    public static void crunchWebRtcEndpoint(InqParticipant inqParticipant, InqParticipant subscriber, WebRtcEndpoint webRtcEndPoint) {
        try {
            // Save room status
/*            Document documentRoom = new Document();
            documentRoom.put("room", inqParticipant.getRoom().getName());
            documentRoom.put("LocalSessionDescriptor", webRtcEndPoint.getLocalSessionDescriptor());
            documentRoom.put("timestamp", webRtcEndPoint.getLocalSessionDescriptor());
            WebRTCStatDao.getInstance().saveRoomStat(documentRoom);*/

            for (MediaType mediaType : MediaType.values()) {
                Document documentEndPoint = new Document();

                addRoomParticipantInfo(inqParticipant, documentEndPoint);
                addSubscriberInfo(subscriber, documentEndPoint);
                addRemoteWebRtcEndpointInfo(webRtcEndPoint, documentEndPoint);
                WebRTCStatDao.getInstance().saveWebRTCEndpoint(documentEndPoint);

                Map<String, Stats> stats = webRtcEndPoint.getStats(mediaType);
                log.trace("Room: '{}', User: '{}', Endpoint: '{}' Information", inqParticipant.getRoom().getName(), inqParticipant.getName(), webRtcEndPoint.getId());
                for (Stats s : stats.values()) {
                    Document document = new Document();
                    document.put("room", inqParticipant.getRoom().getName());
                    document.put("participant", inqParticipant.getName());
                    document.put("WebEndpointId", webRtcEndPoint.getId());
                    addStatsInfo(s, document);

                    switch (s.getType()) {
                        case inboundrtp:
                            RTCInboundRTPStreamStats inboudStats = (RTCInboundRTPStreamStats) s;
                            addRTCInboundRTPStreamStatsInfo(inboudStats, document);
                            break;

                        case outboundrtp:
                            RTCOutboundRTPStreamStats outboundStats = (RTCOutboundRTPStreamStats) s;
                            addRTCOutboundRTPStreamStatsInfo(outboundStats, document);
                            break;

                        default:
                            break;
                    }
                    WebRTCStatDao.getInstance().saveWebRTCEndpointStat(document);
                }
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

    public static void crunchWebRtcEndpoint(InqParticipant inqParticipant) {
        try {
            WebRtcEndpoint webRtcEndpoint = inqParticipant.getPublisher().getWebEndpoint();
            for (MediaType mediaType : MediaType.values()) {
                Document documentEndPoint = new Document();
                addRoomParticipantInfo(inqParticipant, documentEndPoint);
                addLocalWebRtcEndpointInfo(webRtcEndpoint, documentEndPoint);
                WebRTCStatDao.getInstance().saveWebRTCEndpoint(documentEndPoint);

                Map<String, Stats> stats = webRtcEndpoint.getStats(mediaType);
                log.trace("Room: '{}', User: '{}', Endpoint: '{}' Information", inqParticipant.getRoom().getName(), inqParticipant.getName(), webRtcEndpoint.getId());
                for (Stats s : stats.values()) {
                    Document document = new Document();
                    document.put("room", inqParticipant.getRoom().getName());
                    document.put("participant", inqParticipant.getName());
                    document.put("WebEndpointId", webRtcEndpoint.getId());
                    addStatsInfo(s, document);

                    switch (s.getType()) {
                        case inboundrtp:
                            RTCInboundRTPStreamStats inboudStats = (RTCInboundRTPStreamStats) s;
                            addRTCInboundRTPStreamStatsInfo(inboudStats, document);
                            break;

                        case outboundrtp:
                            RTCOutboundRTPStreamStats outboundStats = (RTCOutboundRTPStreamStats) s;
                            addRTCOutboundRTPStreamStatsInfo(outboundStats, document);
                            break;

                        default:
                            break;
                    }
                    try {
                        WebRTCStatDao.getInstance().saveWebRTCEndpointStat(document);
                    } catch (Throwable t) {
                        // The WebRtcEndpoint may have been released. This does not need to
                        // be a "severe" problem
                        // TODO log t just in case.
                        log.error("Error ", t);
                    }
                }
            }

        } catch (ProtocolException e) {

            log.error("Error ", e);
        } catch (Throwable t) {
            // The WebRtcEndpoint may have been released. This does not need to
            // be a "severe" problem
            // TODO log t just in case.
            log.warn("Error ", t);
        }
    }

    public static void addRoomParticipantInfo(InqParticipant inqParticipant, Document document) {
        document.put("room", inqParticipant.getRoom().getName());
        document.put("participant", inqParticipant.getName());
    }

    public static void addSubscriberInfo(InqParticipant subscriber, Document document) {
        document.put("subscriber", subscriber.getName());
    }

    public static void addLocalWebRtcEndpointInfo(WebRtcEndpoint webRtcEndpoint, Document document) {
        document.put("CreationTime", webRtcEndpoint.getCreationTime());
        document.put("Id", webRtcEndpoint.getId());
        document.put("MaxAudioRecvBandwidth", webRtcEndpoint.getMaxAudioRecvBandwidth());
        document.put("TurnUrl", webRtcEndpoint.getTurnUrl());
        document.put("StunServerAddress", webRtcEndpoint.getStunServerAddress());
    }

    public static void addRemoteWebRtcEndpointInfo(WebRtcEndpoint webRtcEndpoint, Document document) {
        document.put("CreationTime", webRtcEndpoint.getCreationTime());
        document.put("Id", webRtcEndpoint.getId());
        document.put("MaxAudioRecvBandwidth", webRtcEndpoint.getMaxAudioRecvBandwidth());
        document.put("TurnUrl", webRtcEndpoint.getTurnUrl());
        document.put("StunServerAddress", webRtcEndpoint.getStunServerAddress());
    }

    public static void addStatsInfo(Stats s, Document document) {
        document.put("stats-timestamp", s.getTimestamp());
        document.put("stats-type", s.getType().name());
        document.put("stats-id", s.getId());
    }

    public static void addRTCInboundRTPStreamStatsInfo(RTCInboundRTPStreamStats inboudStats, Document document) {
        document.put("Ssrc", inboudStats.getSsrc());
        document.put("Type", inboudStats.getType().name());
        document.put("BytesReceived", inboudStats.getBytesReceived());
        document.put("PacketsReceived", inboudStats.getPacketsReceived());
        document.put("PacketsLost", inboudStats.getPacketsLost());
        document.put("FractionLost", inboudStats.getFractionLost());
        document.put("Jitter", inboudStats.getJitter());
        document.put("PliCount", inboudStats.getPliCount());
        document.put("NackCount", inboudStats.getNackCount());
        document.put("FirCount", inboudStats.getFirCount());
        document.put("SliCount", inboudStats.getSliCount());
        document.put("Remb", inboudStats.getRemb());
    }

    public static void addRTCOutboundRTPStreamStatsInfo(RTCOutboundRTPStreamStats outboundStats, Document document) {
        document.put("Ssrc", outboundStats.getSsrc());
        document.put("Type", outboundStats.getType().name());
        document.put("RoundTripTime", outboundStats.getRoundTripTime());
        document.put("TargetBitrate", outboundStats.getTargetBitrate());
        document.put("BytesSent", outboundStats.getBytesSent());
        document.put("PacketsSent", outboundStats.getPacketsSent());
        document.put("PacketsLost", outboundStats.getPacketsLost());
        document.put("FractionLost", outboundStats.getFractionLost());
        document.put("PliCount", outboundStats.getPliCount());
        document.put("NackCount", outboundStats.getNackCount());
        document.put("SliCount", outboundStats.getSliCount());
        document.put("FirCount", outboundStats.getFirCount());
    }
}
