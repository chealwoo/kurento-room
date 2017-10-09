package com.inq.webcall;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.inq.webcall.room.InqNotificationRoomManager;
import com.inq.webcall.room.InqRoomJsonRpcHandler;
import com.inq.webcall.room.api.InqKurentoClientProvider;
import com.inq.webcall.room.kms.InqKmsManager;
import com.inq.webcall.room.rpc.InqJsonRpcUserControl;
import com.inq.webcall.service.InqFixedNKmsManager;
import org.kurento.commons.ConfigFileManager;
import org.kurento.commons.PropertiesManager;
import org.kurento.jsonrpc.JsonUtils;
import org.kurento.jsonrpc.server.JsonRpcHandlerRegistry;
import org.kurento.repository.RepositoryClient;
import org.kurento.repository.RepositoryClientProvider;
import org.kurento.room.KurentoRoomServerApp;
import org.kurento.room.rpc.JsonRpcUserControl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.context.annotation.Bean;

import java.io.File;
import java.util.List;

import static org.kurento.commons.PropertiesManager.getPropertyJson;

/**
 * TouchCommerce Kurento Room Application.
 *
 * This is Spring Boot application class.
 * Application Configuration is read here.
 * Default Beans are created here.
 *
 * All User Request are handled by InqRoomJsonRpcHandler. - Debug starts there.
 */
@SpringBootApplication(exclude = {MongoAutoConfiguration.class, MongoDataAutoConfiguration.class})
public class WebCallApplication  extends KurentoRoomServerApp {

    private static final Logger log = LoggerFactory.getLogger(WebCallApplication.class);

    public final static String KROOMDEMO_CFG_FILENAME = "tc-webcall-router.conf.json";

    private static JsonObject DEFAULT_HAT_COORDS = new JsonObject();

    static {
        ConfigFileManager.loadConfigFile(KROOMDEMO_CFG_FILENAME);
        DEFAULT_HAT_COORDS.addProperty("offsetXPercent", -0.35F);
        DEFAULT_HAT_COORDS.addProperty("offsetYPercent", -1.2F);
        DEFAULT_HAT_COORDS.addProperty("widthPercent", 1.6F);
        DEFAULT_HAT_COORDS.addProperty("heightPercent", 1.6F);
    }

    private static final String IMG_FOLDER = "img/";

    public static final String DEFAULT_APP_SERVER_URL = PropertiesManager.getProperty("app.uri",
            "https://localhost:8443");

    public static final Integer DEMO_KMS_NODE_LIMIT = PropertiesManager.getProperty("demo.kmsLimit", 1000);
    private final String DEMO_AUTH_REGEX = PropertiesManager.getProperty("demo.authRegex");
    private final String DEMO_HAT_URL = PropertiesManager.getProperty("demo.hatUrl",
            "mario-wings.png");

    private final JsonObject DEMO_HAT_COORDS = PropertiesManager.getPropertyJson("demo.hatCoords",
            DEFAULT_HAT_COORDS.toString(), JsonObject.class);

    private static final String DEFAULT_REPOSITORY_SERVER_URI = "http://localhost:7676";
    public static final String REPOSITORY_SERVER_URI = PropertiesManager.getProperty("repository.uri",
            DEFAULT_REPOSITORY_SERVER_URI);

    // Mongodb configuration
    public static final String MONGOD_SERVER_URIS_PROPERTY = "mongodb.uris";
    public static final String DEFAULT_MONGOD_SERVER_URIS = "[ \"mongod.inq.com\" ]";
    public static final String DEFAULT_MONGOD_DB_NAME = "kmslog";
    public static final String MONGOD_DB_NAME = PropertiesManager.getProperty("mongodb.dbname",
            DEFAULT_MONGOD_DB_NAME);

    // Using individual Recording
    private static final boolean DEFAULT_PARTICIPANT_RECORDER_SWITCH = false;
    public static final boolean PARTICIPANT_RECORDER_SWITCH = PropertiesManager.getProperty("repository.participant_record",
            DEFAULT_PARTICIPANT_RECORDER_SWITCH);

    // Start using SAML SSO
    private static final boolean DEFAULT_SSO_AUTH_CHECK = true;
    public static final boolean SSO_AUTH_CHECK = PropertiesManager.getProperty("security.ssoAuthCheck",
            DEFAULT_SSO_AUTH_CHECK);

    public static final String SAML_TOKEN_PATH = PropertiesManager.getProperty("security.certificationPath",
            File.separator + "keys" + File.separator + "saml.crt");

    @Override
    public InqKmsManager kmsManager() {
        JsonArray kmsUris = getPropertyJson(KurentoRoomServerApp.KMSS_URIS_PROPERTY,
                KurentoRoomServerApp.KMSS_URIS_DEFAULT, JsonArray.class);
        List<String> kmsWsUris = JsonUtils.toStringList(kmsUris);

        log.info("Configuring Kurento Room Server to use the following kmss: " + kmsWsUris);

        InqFixedNKmsManager fixedKmsManager = new InqFixedNKmsManager(kmsWsUris, DEMO_KMS_NODE_LIMIT);
        fixedKmsManager.setAuthRegex(DEMO_AUTH_REGEX);
        log.debug("Authorization regex for new rooms: {}", DEMO_AUTH_REGEX);
        return fixedKmsManager;
    }

    @Override
    public JsonRpcUserControl userControl() {
        InqJsonRpcUserControl uc = new InqJsonRpcUserControl(inqRoomManager());
        String appServerUrl = System.getProperty("app.server.url", DEFAULT_APP_SERVER_URL);
        String hatUrl;
        if (appServerUrl.endsWith("/")) {
            hatUrl = appServerUrl + IMG_FOLDER + DEMO_HAT_URL;
        } else {
            hatUrl = appServerUrl + "/" + IMG_FOLDER + DEMO_HAT_URL;
        }
        uc.setHatUrl(hatUrl);
        uc.setHatCoords(DEMO_HAT_COORDS);
        return uc;
    }

    @Bean
    @ConditionalOnMissingBean
    public RepositoryClient repositoryServiceProvider() {
        log.debug("REPOSITORY_SERVER_URI {}", REPOSITORY_SERVER_URI);
        RepositoryClient repositoryClient =
         REPOSITORY_SERVER_URI.startsWith("file://") ? null
                : RepositoryClientProvider.create(REPOSITORY_SERVER_URI);
        if(repositoryClient == null) {
            log.warn("repositoryClient is null with {}", REPOSITORY_SERVER_URI);
        }
        return repositoryClient;
    }

    @Bean
    @ConditionalOnMissingBean
    public InqNotificationRoomManager inqRoomManager() {
        return new InqNotificationRoomManager(notificationService(), (InqKurentoClientProvider) kmsManager());
    }

    @Bean
    @ConditionalOnMissingBean
    public InqRoomJsonRpcHandler inqRoomHandler() {
        return new InqRoomJsonRpcHandler((InqJsonRpcUserControl) userControl(), notificationService());
    }

    @Override
    public void registerJsonRpcHandlers(JsonRpcHandlerRegistry registry) {
        registry.addHandler(inqRoomHandler().withPingWatchdog(true), "/room");
    }

    public static void main(String[] args) throws Exception {
        log.info("Using /dev/urandom for secure random generation");
        System.setProperty("java.security.egd", "file:/dev/./urandom");
        SpringApplication.run(WebCallApplication.class, args);
    }
}
