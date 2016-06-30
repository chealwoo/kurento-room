package com.inq.webcall.util.log;

import org.apache.log4j.Logger;

/**
 * Partial copy of package com.inq.etl.JasperEtlDAO
 *  Modify pom to import commons-etl as dependency.
 */
public class JasperEtlDAO {
    protected Logger logger = Logger.getLogger(getClass());
    protected Logger etlLogger = Logger.getLogger("inq.jasperetl");


    public static final String DOMAIN_AGENT = "agent";
    public static final String DOMAIN_AUTOMATON = "automaton";
    public static final String DOMAIN_ENGAGEMENT = "engagement";
    public static final String DOMAIN_CHAT = "chat";
    public static final String DOMAIN_QUEUE = "queue";
    public static final String EVENT_AGENT_LOGGEDIN = "loggedIn";
    public static final String EVENT_AGENT_LOGGEDOUT = "loggedOut";
    public static final String EVENT_AGENT_STATUS_CHANGED = "statusChanged";
    public static final String EVENT_REQUESTED = "requested";
    public static final String EVENT_ENDED = "ended";
    public static final String EVENT_TRANSFER_REQUESTED = "transferRequested";
    public static final String EVENT_CONFERENCE_REQUESTED = "conferenceRequested";
    public static final String EVENT_QUEUE_ABANDONED = "abandoned";
    public static final String EVENT_QUEUE_REMOVED = "removed";
    public static final String EVENT_AGENT_CHATLINE_SENT = "agentChatlineSent";
    public static final String EVENT_CUSTOMER_CHATLINE_SENT = "customerChatlineSent";
    public static final String EVENT_SCRIPTLINE_SENT = "scriptlineSent";
    public static final String EVENT_AGENT_AUTO_OPENER_SCRIPT_SENT = "agentAutoOpenerScriptSent";
    public static final String EVENT_PUSH_LINK_SENT = "pushLinkSent";
    public static final String EVENT_OPENER_DISPLAYED = "openerDisplayed";
    public static final String EVENT_QUEUE_WAIT_DISPLAYED = "queueWaitDisplayed";
    public static final String EVENT_CUSTOMER_EXITED = "customerExited";
    public static final String EVENT_AGENT_EXITED = "agentExited";
    public static final String EVENT_OWNERSHIP_CHANGE_REQUESTED = "ownershipChangeRequested";
    public static final String EVENT_OWNERSHIP_CHANGE_ACCEPTED = "ownershipChangeAccepted";
    public static final String EVENT_OWNERSHIP_CHANGE_REFUSED = "ownershipChangeRefused";
    public static final String EVENT_STATUS_DISPLAYED = "statusDisplayed";
    public static final String EVENT_SCREENER_JOINED = "screenerJoined";
    public static final String EVENT_SUGGESTION_SENT = "suggestionSent";
    public static final String EVENT_SUGGESTION_OFFERED = "suggestionOffered";
    public static final String EVENT_CLICKSTREAM = "clickstream";
    public static final String EVENT_ILLEGAL_WORD_USED = "illegalWordUsed";
    public static final String EVENT_DISPOSITION_STARTED = "dispositionStarted";
    public static final String EVENT_CUSTOMER_CHATLINE_UPDATED = "customerChatlineMasked";
    public static final String EVENT_CALL_REQUESTED = "callRequested";
    public static final String EVENT_FILE_UPLOADED = "fileUploaded";

    public static final String EVENT_COBROWSE_STARTED = "cobrowseStarted";
    public static final String EVENT_COBROWSE_DECLINED = "cobrowseDeclined";
    public static final String EVENT_COBROWSE_SHARED_STARTED = "cobrowseSharedControlStarted";
    public static final String EVENT_COBROWSE_SHARED_DECLINED = "cobrowseSharedControlDeclined";
    public static final String EVENT_COBROWSE_CUSTOMER_ENDED = "customerEndedCobrowse";
    public static final String EVENT_COBROWSE_AGENT_ENDED = "agentEndedCobrowse";
    public static final String EVENT_COBROWSE_AGENT_SENT_INVITE_TEST = "agentSentCobrowseTest";
    public static final String EVENT_COBROWSE_AGENT_SENT_INVITE = "agentSentCobrowseInvite";
    public static final String EVENT_COBROWSE_AGENT_SENT_SHARED_INVITE = "agentSentSharedControlInvite";

    public static final String EVENT_CONTENT_SENT_TO_AGENT = "contentSentToAgent";
    public static final String EVENT_CONTENT_SENT_TO_CUSTOMER = "contentSentToCustomer";
    public static final String EVENT_CUSTOMER_RESPONDED = "customerResponded";

    public static final String EVENT_AGENT_LOST_CONNECTION = "agentLostConnection";
    public static final String EVENT_AGENT_RESTORE_CONNECTION = "agentRestoreConnection";
    public static final String EVENT_AGENT_ENTER_CHAT = "agentEnterChat";
    public static final String EVENT_CUSTOMER_LOST_CONNECTION = "customerLostConnection";
    public static final String EVENT_CUSTOMER_RESTORE_CONNECTION = "customerRestoreConnection";


    public static final String EVENT_AGENT_OUTCOME = "automatonAgentOutcome";
    public static final String EVENT_CLIENT_OUTCOME = "automatonClientOutcome";
    public static final String EVENT_AUTOMATON_MESSAGE = "automatonMessage";

    public static final String PARAM_STATUS = "status";
    public static final String PARAM_SUB_STATUS = "substatus";
    public static final String PARAM_BUSINESS_UNIT_ID = "businessUnitID";
    public static final String PARAM_BUSINESS_UNITS = "businessUnits";
    public static final String PARAM_AGENT_GROUP_ID = "agentGroupID";
    public static final String PARAM_AGENT_GROUPS = "agentGroups";
    public static final String PARAM_MAX_CHATS = "maxChats";
    public static final String PARAM_CURRENT_CHAT_UTILIZATION = "currentChatUtilization";
    public static final String PARAM_AVAILABLE_AGENT_ATTRIBUTES = "availableAgentAttributes";
    public static final String PARAM_AGENT_ATTRIBUTES = "agentAttributes";
    public static final String PARAM_VISITOR_ATTRIBUTES = "visitorAttributes";
    public static final String PARAM_CHAT_ID = "chatID";
    public static final String PARAM_AUTOMATON_TYPE = "automatonType";
    public static final String PARAM_AUTOMATON_ID = "automatonID";
    public static final String PARAM_AUTOMATON_ATTR = "automatonAttributes";
    public static final String PARAM_AUTOMATON_NODE_ATTR = "automatonNodeAttributes";
    public static final String PARAM_AUTOMATON_AUTOMATON_ID = "automaton.automatonID";
    public static final String PARAM_AUTOMATON_DECISIONTREE_NODE_ID = "automaton.decisiontree.nodeID";
    public static final String PARAM_AUTOMATON_OUTCOME = "automaton.outcome";
    public static final String PARAM_AUTOMATON_OUTCOME_TYPE = "automaton.outcomeType";
    public static final String PARAM_CONVERSION_TYPE = "type";
    public static final String PARAM_CUSTOM_CONVERSIVE_SUGGESTION_CONTENT = "custom.conversive.suggestionContent";
    public static final String PARAM_CUSTOM_CONVERSIVE_SUGGESTIONT_ID = "custom.conversive.suggestiontID";
    public static final String PARAM_CUSTOM_CONVERSIVE_CONFIDENCE_VALUE = "custom.conversive.confidenceValue";
    public static final String PARAM_CUSTOM_CONVERSIVE_AGENT_EDITED = "custom.conversive.agent_edited";
    public static final String PARAM_CUSTOM_SCRIPTTREE_ID = "custom.scripttree.id";
    public static final String PARAM_CUSTOM_CONVERSIVE_AUTO = "custom.conversive.auto";

    public static final String PARAM_CUSTOM_DECISIONTREE_VIEW = "custom.decisiontree.view";

    public static final String PARAM_AGENT_ID = "agentID";
    public static final String PARAM_AGENT_ALIAS = "agentAlias";
    public static final String PARAM_AGENT_TYPE = "agentType";
    public static final String PARAM_AGENT_TYPE_VIRTUAL = "virtual";
    public static final String PARAM_AGENT_TYPE_LIVE = "live";
    public static final String PARAM_FROM_AGENT_ID = "fromAgentID";
    public static final String PARAM_FROM_AGENT_TYPE = "fromAgentType";
    public static final String PARAM_TO_AGENT_TYPE = "toAgentType";
    public static final String PARAM_NEW_AGENT_ID = "newAgentID";
    public static final String PARAM_NEW_AGENT_ALIAS = "newAgentAlias";
    public static final String PARAM_ADDED_AGENT_ID = "addedAgentID";
    public static final String PARAM_ADDED_AGENT_ALIAS = "addedAgentAlias";
    public static final String PARAM_SERVICE_LEVEL_QUALIFIED = "serviceLevelQualified";
    public static final String PARAM_CALL_NEEDED = "callNeeded";
    public static final String PARAM_RESULT = "result";
    public static final String PARAM_SITE_ID = "siteID";
    public static final String PARAM_LANGUAGE = "language";
    public static final String PARAM_REASON = "reason";
    public static final String PARAM_BUSINESS_RULE_ID = "businessRuleID";
    public static final String PARAM_QUEUE_PRIORITY = "queuePriority";
    public static final String PARAM_CUSTOMER_ID = "customerID";
    public static final String PARAM_UNIQUE_CUSTOMER_ID = "uniqCustomerId";
    public static final String PARAM_SESSION_ID = "sessionID";
    public static final String PARAM_INC_ASSIGNMENT_ID = "incAssignmentID";
    public static final String PARAM_FORCED = "forced";
    public static final String PARAM_TARGET_BUSINESS_UNIT_ID = "targetBusinessUnitID";
    public static final String PARAM_TARGET_AGENT_GROUP_ID = "targetAgentGroupID";
    public static final String PARAM_TARGET_AGENT_ID = "targetAgentID";
    public static final String PARAM_TARGET_AGENT_ATTRIBUTES = "targetAgentAttributes";
    public static final String PARAM_BR_ATTRIBUTES = "brAttributes";
    public static final String PARAM_RESOURCE_NEEDED = "resourceNeeded";
    public static final String PARAM_RESOURCE_NEEDED_AUTOMATON = "automaton";
    public static final String PARAM_RESOURCE_NEEDED_AGENT = "agent";
    public static final String PARAM_ENTER_TYPE = "enterType";
    public static final String PARAM_AUTO_TRANSFER = "autotransfer";
    public static final String PARAM_QUEUE_THRESHOLD = "qt";
    /** shows that agent COULD modify a script before sending (pressed SHIFT KEY) */
    public static final String PARAM_EDITED_SCRIPT = "edited_script";
    /** shows that agent sent custom script */
    public static final String PARAM_CUSTOM_SCRIPT = "custom_script";
    /** shows that agent edited script manually before sending */
    public static final String PARAM_EDITED_MANUAL = "edited_manual";

    public static final String PARAM_PRIORITIZED = "prioritized";
    public static final String PARAM_TRANSFER_NOTES = "transferNotes";
    public static final String PARAM_TYPE = "type";
    public static final String PARAM_TO = "to";
    public static final String PARAM_TEXT = "text";
    public static final String PARAM_SCRIPT_TREE_ID = "scriptTreeID";
    public static final String PARAM_OWNER = "owner";
    public static final String PARAM_DISPOSITION = "disposition";
    public static final String PARAM_ESCALATED = "escalated";
    public static final String PARAM_ESCALATED_TEXT = "escalatedText";
    public static final String PARAM_SCREENING = "screening";
    public static final String PARAM_NOTES = "notes";
    public static final String PARAM_SHOWED_TO_CUSTOMER = "showedToCustomer";
    public static final String PARAM_CONFIDENCE_VALUE = "confidenceValue";
    public static final String PARAM_SUGGESTION_ID = "suggestionID";
    public static final String PARAM_ILLEGAL_WORD = "illegalWord";
    public static final String PARAM_AUTO = "auto";
    public static final String PARAM_INITIAL = "initial";
    public static final String PARAM_DATAPASS = "datapass";
    public static final String PARAM_HISTORIC_PAGE_MARKERS = "historicPageMarkers";
    public static final String PARAM_PAGE_MARKER = "pageMarker";
    public static final String PARAM_PAGE_URL = "pageURL";
    public static final String PARAM_PAGE_ID = "pageID";
    public static final String PARAM_BROWSER_TYPE = "browserType";
    public static final String PARAM_BROWSER_VERSION = "browserVersion";
    public static final String PARAM_DEVICE_TYPE = "deviceType";
    public static final String PARAM_LAUNCH_TYPE = "launchType";
    public static final String PARAM_OPERATING_SYSTEM_TYPE = "operatingSystemType";
    public static final String PARAM_REFERRING_URL = "referringURL";
    public static final String PARAM_SYSTEM_INFO = "systemInfo";
    public static final String PARAM_CUSTOM_DECISIONTREE_NODE_ID = "custom.decisiontree.nodeID";
    public static final String PARAM_CUSTOM_DECISIONTREE_QUESTIONS = "custom.decisiontree.questions";
    public static final String PARAM_CUSTOM_DECISIONTREE_ANSWERS = "custom.decisiontree.answers";
    public static final String PARAM_CUSTOM_DECISIONTREE_ANSWER_TYPES = "custom.decisiontree.answerTypes";
    public static final String PARAM_CUSTOM_DECISIONTREE_ANSWERS_NUMERIC = "custom.decisiontree.answersNumeric";
    public static final String PARAM_CUSTOM_DECISIONTREE_QUESTION_IDS = "custom.decisiontree.questionIDs";
    public static final String PARAM_CUSTOM_DECISIONTREE_ANSWER_IDS = "custom.decisiontree.answerIDs";
    public static final String PARAM_UNIQUE_NODE_ID = "unique_node_id";
    public static final String PARAM_QUESTIONS_IDS = "unique_question_ids";
    public static final String PARAM_ANSWERS_IDS = "unique_answer_ids";
    public static final String PARAM_CUSTOM_BAYNOTE_RECOMMENDATIONS = "custom.baynote.recommendations";
    public static final String PARAM_CUSTOM_BAYNOTE_CLICKED = "custom.baynote.clicked";
    public static final String PARAM_CUSTOM_BAYNOTE_DEFAULT = "custom.baynote.default";
    public static final String PARAM_OUTCOME = "outcome";
    public static final String PARAM_ORIGINAL_TEXT = "originalText";
    public static final String PARAM_MASKED_TEXT = "maskedText";
    public static final String PARAM_ENCODED = "encoded";
    public static final String PARAM_START_TIME = "startTime";
    public static final String PARAM_AR_EVENT_SEND_TIME = "ar_event_send_time";
    public static final String PARAM_SENT_TO = "sentTo";

    public static final String PARAM_VALUE_ONE = "1";
    public static final String PARAM_VALUE_ZERO = "0";
    //public static final String PARAM_VALUE_NA = "na";
    //public static final String PARAM_VALUE_FALSE = "false";
    //public static final String PARAM_VALUE_TRUE = "true";
    public static final byte[] DATA_TRUE = "true".getBytes();

    public static final String PARAM_VALUE_ASSIGNED = "assigned";
    public static final String PARAM_VALUE_ACCEPTED = "accepted";
    public static final String PARAM_VALUE_QUEUED = "queued";
    public static final String PARAM_VALUE_REFUSED = "refused";
    public static final String PARAM_VALUE_NEW = "new";
    public static final String PARAM_VALUE_SUBSEQUENT = "subsequent";
    public static final String PARAM_VALUE_TRANSFER = "transfer";
    public static final String PARAM_VALUE_CONFERENCE = "conference";
    public static final String PARAM_VALUE_BAD_REQUEST = "bad_request";
    public static final String PARAM_VALUE_NO_AGENTS = "no_agents";
    public static final String PARAM_VALUE_TIMEOUT = "timeout";
    public static final String PARAM_VALUE_REASSIGN = "reassign";
    public static final byte COMMA = (byte)',';
    public static final byte SEMI = (byte)';';

    public static final String DOMAIN_EVENT_CALL = "call";

    public static final String PARAM_CALL_RESULT = "result";
    public static final String PARAM_CALL_ENDED_BY_CUSTOMER = "customerEndedCall";

    private static JasperEtlDAO instance;

    public static JasperEtlDAO getInstance() {
        if (instance == null)
            instance = new JasperEtlDAO();
        return instance;
    }
}

