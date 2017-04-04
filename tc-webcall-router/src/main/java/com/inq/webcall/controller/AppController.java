package com.inq.webcall.controller;

import com.inq.webcall.WebCallApplication;
import com.inq.webcall.dao.WebRTCStatDao;
import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.kms.InqKmsManager;
import org.kurento.commons.PropertiesManager;
import com.inq.webcall.service.InqFixedNKmsManager;
import com.inq.webcall.service.KMSReport;
import org.kurento.commons.exception.KurentoException;
import org.kurento.room.exception.RoomException;
import org.kurento.room.kms.KmsManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.inq.webcall.WebCallApplication.DEMO_KMS_NODE_LIMIT;

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
    private InqKmsManager kmsManager;

    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public class ResourceNotFoundException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public ResourceNotFoundException(String msg) {
            super(msg);
        }
    }

    /**
     * Returns
     * @return
     */
    @RequestMapping("/getappid")
    public String getAppId() {
        return  "{ appurl : '" + WebCallApplication.DEFAULT_APP_SERVER_URL + "'}";
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

    @RequestMapping("/admin/currentRooms")
    public Set<String> currentRooms() {
        return roomManager.getRooms();
    }

    @RequestMapping("/admin/getKmsReport")
    public Set<KMSReport> report() {
        List<InqKmsManager.KmsLoad> kmsloads = new ArrayList<>();
        if(kmsManager instanceof InqFixedNKmsManager) {
            kmsloads = ((InqFixedNKmsManager) kmsManager).getKmsLoads();
        }

        Set<KMSReport> kmsSet = new HashSet<>();

        for (InqKmsManager.KmsLoad kl: kmsloads) {
            kmsSet.add(new KMSReport(kl.getKms().getUri(), kl.getKms().getLoad(), kl.getKms().getKurentoClient().getSessionId()));
        }
        return kmsSet;
    }

    /**
     * block a KMS (uri) so no more room is assigned on blocked KMS
     * @param uri
     * @return
     */
    @RequestMapping("/admin/blockKms")
    public boolean blockKms(@RequestParam("uri") String uri)  {
        if(kmsManager instanceof InqFixedNKmsManager) {
            return ((InqFixedNKmsManager) kmsManager).blockKms(uri);
        }
        return false;
    }

    /**
     * remove a KMS (uri) from KMS Manager
     * @param uri   - KMS Uri
     * @return boolean - remove result
     */
    @RequestMapping("/admin/removeKms")
    public boolean removeKms(@RequestParam("uri") String uri,
                             @RequestParam(value="force", required = false, defaultValue = "false") boolean force)  {
        if(kmsManager != null && kmsManager instanceof InqFixedNKmsManager) {
            return ((InqFixedNKmsManager) kmsManager).removeKms(uri, force);
        }
        return false;
    }

    /**
     * add a new KMS (uri) into KMS Manager
     * @param uri
     * @return
     */
    @RequestMapping("/admin/addKms")
    public boolean addKms(@RequestParam("uri") String uri)  {
        if(kmsManager instanceof InqFixedNKmsManager) {
            try {
                ((InqFixedNKmsManager) kmsManager).addKms(uri, DEMO_KMS_NODE_LIMIT);
                return true;
            } catch (KurentoException e) {
                // sTODO You may want to print out message.
                e.printStackTrace();
            }
        }
        return false;
    }

    @CrossOrigin(origins = "*", methods = RequestMethod.POST)
    @RequestMapping("/submitStats")
    public void submitStatus(@RequestParam("stats") String stats) {
        log.trace("Stats has received for : stats: {}" , stats);
        // Save it to Mongodb
        WebRTCStatDao.getInstance().saveWebRTCEndpointStat(stats);
    }

    @CrossOrigin(origins = "*", methods = RequestMethod.POST)
    @RequestMapping("/submitStats")
    public void submitStatus(@RequestParam("chatId") String chatId, @RequestParam("stats") String stats) {
        log.trace("Stats has received for : stats: {}" , stats);
        // Save it to Mongodb
        WebRTCStatDao.getInstance().saveWebRTCEndpointStat(chatId, stats);
    }

    @CrossOrigin(origins = "*", methods = RequestMethod.POST)
    @RequestMapping("/addClientLog")
    public void addClientLog(@RequestParam("chatId") String chatId, @RequestParam("logLines") String logLines) {
        log.trace("log lines has received for : chatId: {}" , chatId);
        // Save it to Mongodb
        WebRTCStatDao.getInstance().saveClientLogLine(chatId, logLines);
    }
}