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

public class RoomMonitor {
    private final static Logger log = LoggerFactory.getLogger(RoomMonitor.class);

    public static void crunchWebRtcEndpoint(InqParticipant inqParticipant, InqParticipant subscriber, WebRtcEndpoint webRtcEndPoint) {
        try {
            for (MediaType mediaType : MediaType.values()) {
                Document document = new Document();
                addRoomParticipantInfo(inqParticipant, document);
                addSubscriberInfo(subscriber, document);

                addRemoteWebRtcEndpointInfo(webRtcEndPoint, document);
                Map<String, Stats> stats = webRtcEndPoint.getStats(mediaType);
                log.debug("Room: '{}', User: '{}', Endpoint: '{}' Information", inqParticipant.getRoom().getName(), inqParticipant.getName(), webRtcEndPoint.getId());
                for (Stats s : stats.values()) {
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
                Document document = new Document();
                addRoomParticipantInfo(inqParticipant, document);
                addLocalWebRtcEndpointInfo(webRtcEndpoint, document);
                Map<String, Stats> stats = webRtcEndpoint.getStats(mediaType);
                log.debug("Room: '{}', User: '{}', Endpoint: '{}' Information", inqParticipant.getRoom().getName(), inqParticipant.getName(), webRtcEndpoint.getId());
                for (Stats s : stats.values()) {
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

    public static void addRoomParticipantInfo(InqParticipant inqParticipant, Document document) {
        document.put("room", inqParticipant.getRoom().getName());
        document.put("participant", inqParticipant.getName());
        document.put("location", "Server");
    }
    public static void addSubscriberInfo(InqParticipant subscriber, Document document) {
        document.put("subscriber", subscriber.getName());
    }

    public static void addLocalWebRtcEndpointInfo(WebRtcEndpoint webRtcEndpoint, Document document) {
        document.put("CreationTime", webRtcEndpoint.getCreationTime());
        document.put("Id", webRtcEndpoint.getId());
        document.put("LocalSessionDescriptor", webRtcEndpoint.getLocalSessionDescriptor());
        document.put("MaxAudioRecvBandwidth", webRtcEndpoint.getMaxAudioRecvBandwidth());
//        document.put("MaxOutputBitrate", webRtcEndpoint.getMaxOutputBitrate());
        document.put("TurnUrl", webRtcEndpoint.getTurnUrl());
        document.put("StunServerAddress", webRtcEndpoint.getStunServerAddress());
    }
    public static void addRemoteWebRtcEndpointInfo(WebRtcEndpoint webRtcEndpoint, Document document) {
        document.put("CreationTime", webRtcEndpoint.getCreationTime());
        document.put("Id", webRtcEndpoint.getId());
        document.put("RemoteSessionDescriptor", webRtcEndpoint.getRemoteSessionDescriptor());
        document.put("MaxAudioRecvBandwidth", webRtcEndpoint.getMaxAudioRecvBandwidth());
//        document.put("MaxOutputBitrate", webRtcEndpoint.getMaxOutputBitrate());
        document.put("TurnUrl", webRtcEndpoint.getTurnUrl());
        document.put("StunServerAddress", webRtcEndpoint.getStunServerAddress());
    }

    public static void addStatsInfo(Stats s, Document document) {
        document.put("stats-timestamp", s.getTimestamp());
        document.put("stats-type", s.getType().name());
        document.put("stats-id", s.getId());
    }

    public static void addRTCInboundRTPStreamStatsInfo(RTCInboundRTPStreamStats inboudStats, Document document) {
        document.put("inboudStats-Ssrc", inboudStats.getSsrc());
        document.put("inboudStats-Jitter", inboudStats.getJitter());
        document.put("inboudStats-FractionLost", inboudStats.getFractionLost());
        document.put("inboudStats-BytesReceived", inboudStats.getBytesReceived());
        document.put("inboudStats-PliCount", inboudStats.getPliCount());
        document.put("inboudStats-NackCount", inboudStats.getPacketsReceived());
        document.put("inboudStats-PacketsLost", inboudStats.getPacketsLost());
        document.put("inboudStats-NackCount", inboudStats.getNackCount());
    }

    public static void addRTCOutboundRTPStreamStatsInfo(RTCOutboundRTPStreamStats outboundStats, Document document) {
        document.put("outboundStats-Ssrc", outboundStats.getSsrc());
        document.put("outboundStats-RoundTripTime", outboundStats.getRoundTripTime());
        document.put("outboundStats-TargetBitrate", outboundStats.getTargetBitrate());
        document.put("outboundStats-BytesSent", outboundStats.getBytesSent());
        document.put("outboundStats-PliCount", outboundStats.getPliCount());
        document.put("outboundStats-NackCount", outboundStats.getNackCount());
    }
}
