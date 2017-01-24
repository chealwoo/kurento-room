package com.inq.webcall.controller;

import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.kms.InqKmsManager;
import org.kurento.commons.PropertiesManager;
import org.kurento.room.kms.KmsManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
public class LttController {

    private static final Logger log = LoggerFactory.getLogger(LttController.class);

    public final static String LTT_ROOM_NAME_PREFIX = PropertiesManager.getProperty(
            "ltt.room.prefix", "ltt01room");
    public final static String LTT_USER_NAME_PREFIX = PropertiesManager.getProperty(
            "ltt.user.prefix", "lttuser");
    private static int roomNum = 0;
    private static int userNum = 0;

    private static ClientConfig config;

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
     * e.g. https://localhost:8443/startlttchat
     *
     * @param response
     * @throws IOException
     */
    @CrossOrigin(origins = "*")
    @RequestMapping("/startlttchat")
    public void startlttchat(HttpServletResponse response) throws IOException {
        if(userNum >= 2) {
            roomNum++;
            userNum = 0;
        }

        String roomName = LTT_ROOM_NAME_PREFIX + roomNum;
        String userName = LTT_ROOM_NAME_PREFIX + roomNum + "_" + userNum++;

        log.trace("Start ltt test for room {}, user {}", roomName, userName);
        response.sendRedirect("/webcallindex.html?roomname=" + roomName + "&username=" + userName);
    }

    @CrossOrigin(origins = "*")
    @RequestMapping("/getAllRoomCnt")
    public int getAllRooms() {
        return roomManager.getRoomCnt();
    }
}