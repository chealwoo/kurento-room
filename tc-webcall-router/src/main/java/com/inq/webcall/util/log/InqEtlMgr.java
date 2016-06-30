package com.inq.webcall.util.log;

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

        logEtlRecord(JasperEtlDAO.DOMAIN_CHAT, JasperEtlDAO.EVENT_CALL_REQUESTED, logStringFromMap(etlMap)
                , System.currentTimeMillis());
    }

    public static void logEtlRecord(String domain, String event, String attrs, long time) {
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
