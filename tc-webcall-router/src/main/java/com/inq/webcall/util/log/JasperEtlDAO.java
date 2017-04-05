package com.inq.webcall.util.log;

import org.apache.log4j.Logger;

/**
 *  Partial copy of package com.inq.etl.JasperEtlDAO and converted to an interface.
 *
 *  InqRoomJsonRpcHandler is signaling point and has the important methods.
 *
 *       case ProtocolElements.JOINROOM_METHOD :
 userControl.joinRoom(transaction, request, participantRequest);
 break;
 case ProtocolElements.PUBLISHVIDEO_METHOD :
 userControl.publishVideo(transaction, request, participantRequest);
 break;
 case ProtocolElements.UNPUBLISHVIDEO_METHOD :
 userControl.unpublishVideo(transaction, request, participantRequest);
 break;
 case ProtocolElements.RECEIVEVIDEO_METHOD :
 userControl.receiveVideoFrom(transaction, request, participantRequest);
 break;
 case ProtocolElements.UNSUBSCRIBEFROMVIDEO_METHOD :
 userControl.unsubscribeFromVideo(transaction, request, participantRequest);
 break;
 case ProtocolElements.ONICECANDIDATE_METHOD :
 userControl.onIceCandidate(transaction, request, participantRequest);
 break;
 case ProtocolElements.LEAVEROOM_METHOD :
 userControl.leaveRoom(transaction, request, participantRequest);
 break;
 case InqProtocolElements.CLOSEROOM_METHOD :
 userControl.closeRoom(transaction, request, participantRequest);
 break;
 case ProtocolElements.SENDMESSAGE_ROOM_METHOD :
 userControl.sendMessage(transaction, request, participantRequest);
 break;
 case ProtocolElements.CUSTOMREQUEST_METHOD :
 userControl.customRequest(transaction, request, participantRequest);
 break;
 */
public interface JasperEtlDAO {

    String WEBRTC_APP = "rtcapp";
    String DOMAIN_EVENT_CALL = "call";
    String WEBRTC_APP_JOINROOM_METHOD = "join";
    String WEBRTC_APP_PUBLISHVIDEO_METHOD = "publichVideo";
    String WEBRTC_APP_UNPUBLISHVIDEO_METHOD = "unpublichVideo";
    String WEBRTC_APP_RECEIVEVIDEO_METHOD = "receiveVideo";
    String WEBRTC_APP_UNSUBSCRIBEFROMVIDEO_METHOD = "unsubscribeFromVideo";
    String WEBRTC_APP_ONICECANDIDATE_METHOD = "onIceCandidate";
    String WEBRTC_APP_LEAVEROOM_METHOD = "leaveRoom";
    String WEBRTC_APP_CLOSEROOM_METHOD = "closed";
    String WEBRTC_APP_SENDMESSAGE_ROOM_METHOD = "sendMessage";
    String WEBRTC_APP_CUSTOMREQUEST_METHOD = "customerQuest";

    String EVENT_WEBCALL_ROOM_CREATED_EVENT = "roomCreated";
    String EVENT_JOIN_REQUESTED = "joinRequested";
    String EVENT_WBBCALL_JOIN_ROOM = "userJoinRoom";
    String EVENT_WBBCALL_JOIN_ROOM_FAIL = "userJoinRoomFail";
    String EVENT_WBBCALL_AGENT_CONNECTED = "agentPublished";
    String EVENT_WBBCALL_CUSTOMER_CONNECTED = "customerPublished";
    String EVENT_WBBCALL_AGENT_CONNECT_FAIL = "agentPublishFail";
    String EVENT_WBBCALL_CUSTOMER_CONNECT_FAIL = "customerPublishFail";
    String EVENT_WBBCALL_LEAVE_ROOM = "userLeaveRoom";
    String EVENT_WBBCALL_CLOSE_ROOM = "closeRoom";
    String EVENT_WBBCALL_SUBSCRIBE = "subscribe";
    String EVENT_WBBCALL_SUBSCRIBE_FAIL = "subscribeFail";

    String PARAM_CHAT_ID = "chatID";
    String PARAM_AGENT_NAME = "agentName";
    String PARAM_CUSTOMER_ID = "customerID";
    String PARAM_USER_ID = "userName";
    String PARAM_REMOTE_USER_ID = "remoteUserName";
    String PARAM_SDP_ANSWER = "sdpAnswer";
    String PARAM_SDP_OFFER = "sdpOffer";

    String DOMAIN_AGENT = "agent";
    String DOMAIN_ENGAGEMENT = "engagement";
    String DOMAIN_CHAT = "chat";
    String EVENT_AGENT_STATUS_CHANGED = "statusChanged";
    String EVENT_REQUESTED = "requested";
    String EVENT_ENDED = "ended";
    String EVENT_TRANSFER_REQUESTED = "transferRequested";
    String EVENT_CONFERENCE_REQUESTED = "conferenceRequested";
    String EVENT_QUEUE_ABANDONED = "abandoned";
    String EVENT_QUEUE_REMOVED = "removed";
    String EVENT_AGENT_CHATLINE_SENT = "agentChatlineSent";
    String EVENT_CUSTOMER_CHATLINE_SENT = "customerChatlineSent";
    String EVENT_SCRIPTLINE_SENT = "scriptlineSent";
    String EVENT_AGENT_AUTO_OPENER_SCRIPT_SENT = "agentAutoOpenerScriptSent";
    String EVENT_PUSH_LINK_SENT = "pushLinkSent";
    String EVENT_OPENER_DISPLAYED = "openerDisplayed";
    String EVENT_QUEUE_WAIT_DISPLAYED = "queueWaitDisplayed";
    String EVENT_CUSTOMER_EXITED = "customerExited";
    String EVENT_AGENT_EXITED = "agentExited";
    String EVENT_OWNERSHIP_CHANGE_REQUESTED = "ownershipChangeRequested";
    String EVENT_OWNERSHIP_CHANGE_ACCEPTED = "ownershipChangeAccepted";
    String EVENT_OWNERSHIP_CHANGE_REFUSED = "ownershipChangeRefused";
    String EVENT_STATUS_DISPLAYED = "statusDisplayed";
    String EVENT_SCREENER_JOINED = "screenerJoined";
    String EVENT_SUGGESTION_SENT = "suggestionSent";
    String EVENT_SUGGESTION_OFFERED = "suggestionOffered";
    String EVENT_CLICKSTREAM = "clickstream";
    String EVENT_ILLEGAL_WORD_USED = "illegalWordUsed";
    String EVENT_DISPOSITION_STARTED = "dispositionStarted";
    String EVENT_CUSTOMER_CHATLINE_UPDATED = "customerChatlineMasked";
    String EVENT_FILE_UPLOADED = "fileUploaded";
    String EVENT_WBBCALL_REQUESTED = "callRequested";
    String EVENT_WBBCALL_AGENT_DIALED = "dialed";
    String EVENT_WBBCALL_CLIENT_CONNECTED = "connected";
    String EVENT_WBBCALL_ENDED = "completed";
    String EVENT_WBBCALL_ERROR = "failed";
    String EVENT_WBBCALL_ABANDONED = "abandoned";
    String EVENT_WBBCALL_DENIED = "denied";
    String EVENT_WBBCALL_QUEUED = "queued";

    String EVENT_COBROWSE_STARTED = "cobrowseStarted";
    String EVENT_COBROWSE_DECLINED = "cobrowseDeclined";
    String EVENT_COBROWSE_SHARED_STARTED = "cobrowseSharedControlStarted";
    String EVENT_COBROWSE_SHARED_DECLINED = "cobrowseSharedControlDeclined";
    String EVENT_COBROWSE_CUSTOMER_ENDED = "customerEndedCobrowse";
    String EVENT_COBROWSE_AGENT_ENDED = "agentEndedCobrowse";
    String EVENT_COBROWSE_AGENT_SENT_INVITE_TEST = "agentSentCobrowseTest";
    String EVENT_COBROWSE_AGENT_SENT_INVITE = "agentSentCobrowseInvite";
    String EVENT_COBROWSE_AGENT_SENT_SHARED_INVITE = "agentSentSharedControlInvite";

    String EVENT_CONTENT_SENT_TO_AGENT = "contentSentToAgent";
    String EVENT_CONTENT_SENT_TO_CUSTOMER = "contentSentToCustomer";
    String EVENT_CUSTOMER_RESPONDED = "customerResponded";

    String EVENT_AGENT_LOST_CONNECTION = "agentLostConnection";
    String EVENT_AGENT_RESTORE_CONNECTION = "agentRestoreConnection";
    String EVENT_AGENT_ENTER_CHAT = "agentEnterChat";
    String EVENT_CUSTOMER_LOST_CONNECTION = "customerLostConnection";
    String EVENT_CUSTOMER_RESTORE_CONNECTION = "customerRestoreConnection";


    String EVENT_AGENT_OUTCOME = "automatonAgentOutcome";
    String EVENT_CLIENT_OUTCOME = "automatonClientOutcome";
    String EVENT_AUTOMATON_MESSAGE = "automatonMessage";

    String PARAM_STATUS = "status";
    String PARAM_SUB_STATUS = "substatus";
    String PARAM_BUSINESS_UNIT_ID = "businessUnitID";
    String PARAM_BUSINESS_UNITS = "businessUnits";
    String PARAM_AGENT_GROUP_ID = "agentGroupID";
    String PARAM_AGENT_GROUPS = "agentGroups";
    String PARAM_MAX_CHATS = "maxChats";
    String PARAM_CURRENT_CHAT_UTILIZATION = "currentChatUtilization";
    String PARAM_AVAILABLE_AGENT_ATTRIBUTES = "availableAgentAttributes";
    String PARAM_AGENT_ATTRIBUTES = "agentAttributes";
    String PARAM_VISITOR_ATTRIBUTES = "visitorAttributes";

    String PARAM_AUTOMATON_TYPE = "automatonType";
    String PARAM_AUTOMATON_ID = "automatonID";
    String PARAM_AUTOMATON_ATTR = "automatonAttributes";
    String PARAM_AUTOMATON_NODE_ATTR = "automatonNodeAttributes";
    String PARAM_AUTOMATON_AUTOMATON_ID = "automaton.automatonID";
    String PARAM_AUTOMATON_DECISIONTREE_NODE_ID = "automaton.decisiontree.nodeID";
    String PARAM_AUTOMATON_OUTCOME = "automaton.outcome";
    String PARAM_AUTOMATON_OUTCOME_TYPE = "automaton.outcomeType";
    String PARAM_CONVERSION_TYPE = "type";
    String PARAM_CUSTOM_CONVERSIVE_SUGGESTION_CONTENT = "custom.conversive.suggestionContent";
    String PARAM_CUSTOM_CONVERSIVE_SUGGESTIONT_ID = "custom.conversive.suggestiontID";
    String PARAM_CUSTOM_CONVERSIVE_CONFIDENCE_VALUE = "custom.conversive.confidenceValue";
    String PARAM_CUSTOM_CONVERSIVE_AGENT_EDITED = "custom.conversive.agent_edited";
    String PARAM_CUSTOM_SCRIPTTREE_ID = "custom.scripttree.id";
    String PARAM_CUSTOM_CONVERSIVE_AUTO = "custom.conversive.auto";

    String PARAM_CUSTOM_DECISIONTREE_VIEW = "custom.decisiontree.view";

    String PARAM_AGENT_ID = "agentID";
    String PARAM_AGENT_ALIAS = "agentAlias";
    String PARAM_AGENT_TYPE = "agentType";
    String PARAM_AGENT_TYPE_VIRTUAL = "virtual";
    String PARAM_AGENT_TYPE_LIVE = "live";
    String PARAM_FROM_AGENT_ID = "fromAgentID";
    String PARAM_FROM_AGENT_TYPE = "fromAgentType";
    String PARAM_TO_AGENT_TYPE = "toAgentType";
    String PARAM_NEW_AGENT_ID = "newAgentID";
    String PARAM_NEW_AGENT_ALIAS = "newAgentAlias";
    String PARAM_ADDED_AGENT_ID = "addedAgentID";
    String PARAM_ADDED_AGENT_ALIAS = "addedAgentAlias";
    String PARAM_SERVICE_LEVEL_QUALIFIED = "serviceLevelQualified";
    String PARAM_CALL_NEEDED = "callNeeded";
    String PARAM_RESULT = "result";
    String PARAM_SITE_ID = "siteID";
    String PARAM_LANGUAGE = "language";
    String PARAM_REASON = "reason";
    String PARAM_BUSINESS_RULE_ID = "businessRuleID";
    String PARAM_QUEUE_PRIORITY = "queuePriority";
    String PARAM_UNIQUE_CUSTOMER_ID = "uniqCustomerId";
    String PARAM_SESSION_ID = "sessionID";
    String PARAM_INC_ASSIGNMENT_ID = "incAssignmentID";
    String PARAM_FORCED = "forced";
    String PARAM_TARGET_BUSINESS_UNIT_ID = "targetBusinessUnitID";
    String PARAM_TARGET_AGENT_GROUP_ID = "targetAgentGroupID";
    String PARAM_TARGET_AGENT_ID = "targetAgentID";
    String PARAM_TARGET_AGENT_ATTRIBUTES = "targetAgentAttributes";
    String PARAM_BR_ATTRIBUTES = "brAttributes";
    String PARAM_RESOURCE_NEEDED = "resourceNeeded";
    String PARAM_RESOURCE_NEEDED_AUTOMATON = "automaton";
    String PARAM_RESOURCE_NEEDED_AGENT = "agent";
    String PARAM_ENTER_TYPE = "enterType";
    String PARAM_AUTO_TRANSFER = "autotransfer";
    String PARAM_QUEUE_THRESHOLD = "qt";
    /** shows that agent COULD modify a script before sending (pressed SHIFT KEY) */
    String PARAM_EDITED_SCRIPT = "edited_script";
    /** shows that agent sent custom script */
    String PARAM_CUSTOM_SCRIPT = "custom_script";
    /** shows that agent edited script manually before sending */
    String PARAM_EDITED_MANUAL = "edited_manual";

    String PARAM_PRIORITIZED = "prioritized";
    String PARAM_TRANSFER_NOTES = "transferNotes";
    String PARAM_TYPE = "type";
    String PARAM_TO = "to";
    String PARAM_TEXT = "text";
    String PARAM_SCRIPT_TREE_ID = "scriptTreeID";
    String PARAM_OWNER = "owner";
    String PARAM_DISPOSITION = "disposition";
    String PARAM_ESCALATED = "escalated";
    String PARAM_ESCALATED_TEXT = "escalatedText";
    String PARAM_SCREENING = "screening";
    String PARAM_NOTES = "notes";
    String PARAM_SHOWED_TO_CUSTOMER = "showedToCustomer";
    String PARAM_CONFIDENCE_VALUE = "confidenceValue";
    String PARAM_SUGGESTION_ID = "suggestionID";
    String PARAM_ILLEGAL_WORD = "illegalWord";
    String PARAM_AUTO = "auto";
    String PARAM_INITIAL = "initial";
    String PARAM_DATAPASS = "datapass";
    String PARAM_HISTORIC_PAGE_MARKERS = "historicPageMarkers";
    String PARAM_PAGE_MARKER = "pageMarker";
    String PARAM_PAGE_URL = "pageURL";
    String PARAM_PAGE_ID = "pageID";
    String PARAM_BROWSER_TYPE = "browserType";
    String PARAM_BROWSER_VERSION = "browserVersion";
    String PARAM_DEVICE_TYPE = "deviceType";
    String PARAM_LAUNCH_TYPE = "launchType";
    String PARAM_OPERATING_SYSTEM_TYPE = "operatingSystemType";
    String PARAM_REFERRING_URL = "referringURL";
    String PARAM_SYSTEM_INFO = "systemInfo";
    String PARAM_CUSTOM_DECISIONTREE_NODE_ID = "custom.decisiontree.nodeID";
    String PARAM_CUSTOM_DECISIONTREE_QUESTIONS = "custom.decisiontree.questions";
    String PARAM_CUSTOM_DECISIONTREE_ANSWERS = "custom.decisiontree.answers";
    String PARAM_CUSTOM_DECISIONTREE_ANSWER_TYPES = "custom.decisiontree.answerTypes";
    String PARAM_CUSTOM_DECISIONTREE_ANSWERS_NUMERIC = "custom.decisiontree.answersNumeric";
    String PARAM_CUSTOM_DECISIONTREE_QUESTION_IDS = "custom.decisiontree.questionIDs";
    String PARAM_CUSTOM_DECISIONTREE_ANSWER_IDS = "custom.decisiontree.answerIDs";
    String PARAM_UNIQUE_NODE_ID = "unique_node_id";
    String PARAM_QUESTIONS_IDS = "unique_question_ids";
    String PARAM_ANSWERS_IDS = "unique_answer_ids";
    String PARAM_CUSTOM_BAYNOTE_RECOMMENDATIONS = "custom.baynote.recommendations";
    String PARAM_CUSTOM_BAYNOTE_CLICKED = "custom.baynote.clicked";
    String PARAM_CUSTOM_BAYNOTE_DEFAULT = "custom.baynote.default";
    String PARAM_OUTCOME = "outcome";
    String PARAM_ORIGINAL_TEXT = "originalText";
    String PARAM_MASKED_TEXT = "maskedText";
    String PARAM_ENCODED = "encoded";
    String PARAM_START_TIME = "startTime";
    String PARAM_AR_EVENT_SEND_TIME = "ar_event_send_time";
    String PARAM_SENT_TO = "sentTo";

    String PARAM_VALUE_ONE = "1";
    String PARAM_VALUE_ZERO = "0";
    //String PARAM_VALUE_NA = "na";
    //String PARAM_VALUE_FALSE = "false";
    //String PARAM_VALUE_TRUE = "true";
    byte[] DATA_TRUE = "true".getBytes();

    String PARAM_VALUE_ASSIGNED = "assigned";
    String PARAM_VALUE_ACCEPTED = "accepted";
    String PARAM_VALUE_QUEUED = "queued";
    String PARAM_VALUE_REFUSED = "refused";
    String PARAM_VALUE_NEW = "new";
    String PARAM_VALUE_SUBSEQUENT = "subsequent";
    String PARAM_VALUE_TRANSFER = "transfer";
    String PARAM_VALUE_CONFERENCE = "conference";
    String PARAM_VALUE_BAD_REQUEST = "bad_request";
    String PARAM_VALUE_NO_AGENTS = "no_agents";
    String PARAM_VALUE_TIMEOUT = "timeout";
    String PARAM_VALUE_REASSIGN = "reassign";
    byte COMMA = (byte)',';
    byte SEMI = (byte)';';


    String PARAM_CALL_RESULT = "result";
    String PARAM_CALL_ENDED_BY_CUSTOMER = "customerEndedCall";
}

