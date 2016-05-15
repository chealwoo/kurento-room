package org.kurento.room.demo;

import org.kurento.commons.PropertiesManager;
import org.kurento.room.NotificationRoomManager;
import org.kurento.room.exception.RoomException;
import org.kurento.room.kms.KmsManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class DemoController {

  private static final Logger log = LoggerFactory.getLogger(DemoController.class);

  private final static boolean DEMO_LOOPBACK_REMOTE = PropertiesManager.getProperty(
      "demo.loopback.remote", false);
  private final static boolean DEMO_LOOPBACK_AND_LOCAL = PropertiesManager.getProperty(
      "demo.loopback.andLocal", false);

  private static ClientConfig config;

  static {
    config = new ClientConfig();
    config.setLoopbackRemote(DEMO_LOOPBACK_REMOTE);
    config.setLoopbackAndLocal(DEMO_LOOPBACK_AND_LOCAL);
    log.info("Set client config: {}", config);
  }

  @Autowired
  private NotificationRoomManager roomManager;

  @Autowired
  private KmsManager kmsManager;

  @ResponseStatus(value = HttpStatus.NOT_FOUND)
  public class ResourceNotFoundException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String msg) {
      super(msg);
    }
  }

  @RequestMapping("/close")
  public void closeRoom(@RequestParam("room") String room) {
    log.warn("Trying to close the room '{}'", room);
    if (!roomManager.getRooms().contains(room)) {
      log.warn("Unable to close room '{}', not found.", room);
      throw new ResourceNotFoundException("Room '" + room + "' not found");
    }
    try {
      roomManager.closeRoom(room);
    } catch (RoomException e) {
      log.warn("Error closing room {}", room, e);
      throw new ResourceNotFoundException(e.getMessage());
    }
  }

  @RequestMapping("/getClientConfig")
  public ClientConfig clientConfig() {
    log.debug("Sending client config {}", config);
    return config;
  }


  @RequestMapping("/getKmsReport")
  public String report() {
    List<KmsManager.KmsLoad> kmsloads = new ArrayList<>();
    if(kmsManager instanceof FixedNKmsManager) {
      kmsloads = ((FixedNKmsManager) kmsManager).getKmsLoads();
    }

    StringBuffer result = new StringBuffer("-- KMS Status Report --");
    for (KmsManager.KmsLoad kl: kmsloads) {
      result.append(kl.getKms().getUri()).append("       ").append(kl.getLoad()).append("\n");
    }
    return result.toString();
  }
}
