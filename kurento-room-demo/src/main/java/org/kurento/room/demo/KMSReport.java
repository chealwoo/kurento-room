package org.kurento.room.demo;

/**
 * Created by chealwoo on 5/14/2016.
 */
public class KMSReport {
    private String wsurl;
    private double load;
    private String sessionId;

    public KMSReport(String wsurl, double load, String sessionId) {
        this.wsurl = wsurl;
        this.load = load;
        this.sessionId = sessionId;
    }

    public String getWsurl() {
        return wsurl;
    }

    public double getLoad() {
        return load;
    }

    public String getSessionId() {
        return sessionId;
    }
}
