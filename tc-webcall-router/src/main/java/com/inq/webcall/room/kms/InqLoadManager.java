package com.inq.webcall.room.kms;

import org.kurento.room.kms.Kms;
import org.kurento.room.kms.LoadManager;

/**
 * Created by dlee on 9/15/2016.
 */
public interface InqLoadManager extends LoadManager{

    void setOn(boolean isOn);

    boolean isOn();

    boolean isBlocked();

    void setBlocked(boolean isBlocked);

    double calculateRealLoad(Kms kms);
}
