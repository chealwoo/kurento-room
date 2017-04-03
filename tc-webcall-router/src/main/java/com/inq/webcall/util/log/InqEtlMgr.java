package com.inq.webcall.util.log;

import org.apache.commons.lang3.math.NumberUtils;
import org.apache.log4j.Logger;

import java.util.Map;
import java.util.TreeMap;

/**
 * ETL Log on Application server side.
 * Main part should be done on the
 */
public class InqEtlMgr {

    protected static Logger etlLogger = Logger.getLogger("inq.jasperetl");

    public static void logWebCallRequested(String chatId, String participantId) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);
        etlMap.put(JasperEtlDAO.PARAM_CUSTOMER_ID, participantId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_CALL_REQUESTED, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logRoomCreated(String siteId, String chatId) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_SITE_ID, siteId);
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WEBCALL_ROOM_CREATED_EVENT, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    /**
     *  ETL log Publish Failed Event
     * @param chatId
     * @param participantId
     */
    public static void logPublishFail(String chatId, String participantId) {
        String event = InqEtlMgr.isCustomerId(participantId)
                ? JasperEtlDAO.EVENT_WBBCALL_CUSTOMER_CONNECT_FAIL
                : JasperEtlDAO.EVENT_WBBCALL_AGENT_CONNECT_FAIL;

        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);
        etlMap.put(JasperEtlDAO.PARAM_AGENT_NAME, participantId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, event, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    /**
     *  ETL log Published Event
     * @param chatId
     * @param participantId
     * @param sdpAnswer
     */
    public static void logPublished(String chatId, String participantId, String sdpAnswer) {
        String event = InqEtlMgr.isCustomerId(participantId)
                ? JasperEtlDAO.EVENT_WBBCALL_CUSTOMER_CONNECTED
                : JasperEtlDAO.EVENT_WBBCALL_AGENT_CONNECTED;

        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);
        etlMap.put(JasperEtlDAO.PARAM_AGENT_NAME, participantId);
        etlMap.put(JasperEtlDAO.PARAM_SDP_ANSWER, sdpAnswer);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, event, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logJoin(String chatId, String participantId) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);
        etlMap.put(JasperEtlDAO.PARAM_AGENT_NAME, participantId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WBBCALL_JOIN_ROOM, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logJoinFail(String chatId, String participantId) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);
        etlMap.put(JasperEtlDAO.PARAM_AGENT_NAME, participantId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WBBCALL_JOIN_ROOM_FAIL, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logLeave(String chatId, String participantId) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);
        etlMap.put(JasperEtlDAO.PARAM_AGENT_NAME, participantId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WBBCALL_LEAVE_ROOM, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logSubscribe(String chatId, String userName, String remoteName, String sdpAnswer) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_USER_ID, userName);
        etlMap.put(JasperEtlDAO.PARAM_REMOTE_USER_ID, remoteName);
        etlMap.put(JasperEtlDAO.PARAM_SDP_ANSWER, sdpAnswer);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WBBCALL_SUBSCRIBE, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logSubscribeFail(String chatId, String userName, String remoteName, String sdpOffer) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_USER_ID, userName);
        etlMap.put(JasperEtlDAO.PARAM_REMOTE_USER_ID, remoteName);
        etlMap.put(JasperEtlDAO.PARAM_SDP_OFFER, sdpOffer);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WBBCALL_SUBSCRIBE_FAIL, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logCloseRoom(String chatId) {
        Map<String, String> etlMap = new TreeMap<String, String>();
        etlMap.put(JasperEtlDAO.PARAM_CHAT_ID, chatId);

        logEtlRecord(JasperEtlDAO.DOMAIN_EVENT_CALL, JasperEtlDAO.EVENT_WBBCALL_CLOSE_ROOM, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }


    private static boolean isCustomerId(String id) {
        return NumberUtils.isNumber(id);
    }

    private static void logEtlRecord(String domain, String event, String attrs, long time) {
        etlLogger.info(String.format("%d-%s.%s?%s", time, domain, event, attrs));
    }

    private static String logStringFromMap(Map<String, String> attrs) {
        StringBuilder stringBuilder = new StringBuilder();
        for (Map.Entry<String, String> entry : attrs.entrySet()) {
            stringBuilder.append(entry.getKey()).append('=').append(entry.getValue()).append('&');
        }
        if (stringBuilder.length() > 0) {
            stringBuilder.deleteCharAt(stringBuilder.length() - 1);
        }
        return stringBuilder.toString();
    }
}
