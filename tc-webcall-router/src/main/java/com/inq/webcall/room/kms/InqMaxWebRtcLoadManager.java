package com.inq.webcall.room.kms;

import org.kurento.room.kms.Kms;
import org.kurento.room.kms.MaxWebRtcLoadManager;

/**
 * Created by dlee on 9/15/2016.
 */
public class InqMaxWebRtcLoadManager extends MaxWebRtcLoadManager implements InqLoadManager{

    private boolean isOn = true;

    public InqMaxWebRtcLoadManager(int maxWebRtcPerKms) {
        super(maxWebRtcPerKms);
    }

    @Override
    public double calculateLoad(Kms kms) {
        if( !isOn ) return 1;
        return super.calculateLoad(kms);
    }

    @Override
    public void setOn(boolean isOn) {
        this.isOn = isOn;
    }
}
