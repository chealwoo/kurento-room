package com.inq.webcall.room.kms;

import org.kurento.client.KurentoClient;
import org.kurento.room.kms.Kms;

/**
 * Created by dlee on 9/15/2016.
 */
public class InqKms extends Kms{
    private InqLoadManager loadManager = new InqMaxWebRtcLoadManager(10000);

    public InqKms(KurentoClient client, String kmsUri) {
        super(client, kmsUri);
        super.setLoadManager(loadManager);
    }

    public void setLoadManager(InqLoadManager loadManager) {
        this.loadManager = loadManager;
        super.setLoadManager(loadManager);
    }

    public InqLoadManager getLoadManager() {
        return loadManager;
    }
}
