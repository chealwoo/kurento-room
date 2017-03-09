package com.inq.webcall.dao;

/**
 * Created by dlee on 12/19/2016.
 */
public interface IMongoDBService {

    String TBL_ROOM = "Room";
    String TBL_ROOM_ERROR = "RoomError";

    String TBL_PARTICIPANT = "ParticipantStat";
    String TBL_WEBRTCENDPOINT = "WebRTCEndpoint";
    String TBL_WEBRTCENDPOINT_STAT = "WebRTCEndpointStat";

    String TBL_APP_SRV_SYSTEM_STAT =  "AppSrvSystemStat";
    String TBL_KMS_STAT =  "KmsStat";

    String TBL_CLIENT_WEBRTCENDPOINT_STAT  = "WebRTCEndpointStatClient";
    // formatted
    String TBL_CLIENT_WEBRTCENDPOINT_STAT_FORMATTED  = "WebRTCEndpointStatClientFormatted";
    String TBL_CLIENT_LOG_LINE  = "ClientLogLine";
}
