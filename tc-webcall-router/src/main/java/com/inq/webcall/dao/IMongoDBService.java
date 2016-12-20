package com.inq.webcall.dao;

/**
 * Created by dlee on 12/19/2016.
 */
public interface IMongoDBService {

    String TBL_ROOM = "Room";
    String TBL_PARTICIPANT = "ParticipantStat";
    String TBL_WEBRTCENDPOINT = "WebRTCEndpoint";
    String TBL_WEBRTCENDPOINT_STAT = "WebRTCEndpointStat";

    String TBL_SYSTEM_STAT =  "SystemStat";
    String TBL_KMS_STAT =  "KmsStat";

    String TBL_CLIENT_WEBRTCENDPOINT_STAT  = "WebRTCEndpointStatClient";
}
