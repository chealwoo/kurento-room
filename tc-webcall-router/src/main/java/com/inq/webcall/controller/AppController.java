package com.inq.webcall.controller;

import com.inq.webcall.room.InqNotificationRoomManager;
import org.kurento.commons.PropertiesManager;
import com.inq.webcall.service.FixedNKmsManager;
import com.inq.webcall.service.KMSReport;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Created by dlee on 6/28/2016.
 */
@RestController
public class AppController {

    private static final Logger log = LoggerFactory.getLogger(AppController.class);

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
    private InqNotificationRoomManager roomManager;

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
    public Set<KMSReport> report() {
        List<KmsManager.KmsLoad> kmsloads = new ArrayList<>();
        if(kmsManager instanceof FixedNKmsManager) {
            kmsloads = ((FixedNKmsManager) kmsManager).getKmsLoads();
        }

        Set<KMSReport> kmsSet = new HashSet<>();

        for (KmsManager.KmsLoad kl: kmsloads) {
            kmsSet.add(new KMSReport(kl.getKms().getUri(), kl.getKms().getLoad(), kl.getKms().getKurentoClient().getSessionId()));
        }
        return kmsSet;
    }
}