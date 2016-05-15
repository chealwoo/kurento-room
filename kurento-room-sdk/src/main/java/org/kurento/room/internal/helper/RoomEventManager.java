package org.kurento.room.internal.helper;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Created by chealwoo on 5/14/2016.
 */
public class RoomEventManager {
    private Map<String, RoomEvent> roomEventMap = new HashMap<>();
    private List<RoomEvent> savedRoomEventList = new LinkedList<>();

    public void createRoomEvent(String roomId, String agentId, String kmsId) {
        RoomEvent roomEvent = new RoomEvent(roomId, agentId, kmsId);
        roomEventMap.put(roomId, roomEvent);
    }

    public void closeRoomEvent(String roomId) {
        RoomEvent roomEvent = roomEventMap.get(roomId);
        roomEvent.closeRoomEvent();
        roomEventMap.remove(roomId);
        savedRoomEventList.add(roomEvent);
    }

    public List<RoomEvent> getRoomHistory() {
        List<RoomEvent> roomHistory = new LinkedList<>();

        roomHistory.addAll(savedRoomEventList);

        roomHistory.addAll(roomEventMap.values());

        return roomHistory;
    }
}
