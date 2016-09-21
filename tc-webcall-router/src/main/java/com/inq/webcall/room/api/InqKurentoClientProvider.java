package com.inq.webcall.room.api;

import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.InqRoomManager;
import com.inq.webcall.room.internal.InqRoom;
import org.kurento.client.KurentoClient;
import org.kurento.room.api.KurentoClientProvider;
import org.kurento.room.internal.Room;

/**
 * Created by dlee on 9/15/2016.
 */
public interface InqKurentoClientProvider extends KurentoClientProvider {

    void addFailOver(InqIKurentoClientSessionInfo kcSessionInfo, InqRoom room);
    void removeFailOver(InqIKurentoClientSessionInfo kcSessionInfo, InqRoom room);
    void setRoomManager(InqNotificationRoomManager inqRoomManager) ;
}

