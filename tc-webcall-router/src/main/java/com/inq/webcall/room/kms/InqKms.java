package com.inq.webcall.room.kms;

import org.kurento.client.KurentoClient;
import org.kurento.room.kms.Kms;

/**
 * InqKms extends Kms
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

    public boolean isBlocked() {
        return loadManager.isBlocked();
    }

    public void setBlocked(boolean isBlocked){
        loadManager.setBlocked(isBlocked);
    }

    public double getRealLoad() {
        return loadManager.calculateRealLoad(this);
    }
}
