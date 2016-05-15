package org.kurento.room.rest;

import java.util.List;
import java.util.Set;

import org.kurento.room.NotificationRoomManager;
import org.kurento.room.internal.helper.RoomEvent;
import org.kurento.room.internal.helper.RoomEventManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author Raquel Díaz González
 */
@RestController
public class RoomController {

  @Autowired
  private NotificationRoomManager roomManager;

  private RoomEventManager roomEventManager;

  @RequestMapping("/getAllRooms")
  public Set<String> getAllRooms() {
    return roomManager.getRooms();
  }


  @RequestMapping("/getRoomReport")
  public List<RoomEvent> getRoomReport() {
    return roomManager.getRoomEventManager().getRoomHistory();
  }
}
