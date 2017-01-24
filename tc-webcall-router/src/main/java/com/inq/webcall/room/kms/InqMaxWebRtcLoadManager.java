package com.inq.webcall.room.kms;

import org.kurento.room.kms.Kms;
import org.kurento.room.kms.MaxWebRtcLoadManager;

/**
 * isOn is added for failover
 * isBlocked is added so when it is true, no more room is assigned on linked kms and eventually can remove it from AP server.
 */
public class InqMaxWebRtcLoadManager extends MaxWebRtcLoadManager implements InqLoadManager {

    private boolean isOn = true;
    private boolean isBlocked = false;

    public InqMaxWebRtcLoadManager(int maxWebRtcPerKms) {
        super(maxWebRtcPerKms);
    }

    @Override
    public double calculateLoad(Kms kms) {
        if (!isOn) return 1;
        if (isBlocked) return 1;
        return super.calculateLoad(kms);
    }

    public void setOn(boolean isOn) {
        this.isOn = isOn;
    }

    public boolean isOn() {
        return this.isOn;
    }

    public boolean isBlocked() {
        return isBlocked;
    }

    public void setBlocked(boolean blocked) {
        isBlocked = blocked;
    }

    public double calculateRealLoad(Kms kms) {
        return super.calculateLoad(kms);
    }
}
