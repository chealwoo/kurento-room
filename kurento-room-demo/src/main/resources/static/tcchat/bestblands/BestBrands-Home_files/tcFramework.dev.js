/* Timestamp in ISO 8601 format (YYYY-MM-DD): Fri May 06 20:13:22 GMT-08:00 2016 */




var Inq = (function(siteFcnStr, rulesEngineDataStr, loadedMbuRuleDataFuns) {

    eval(siteFcnStr); //establishes siteFcn
    var site = initSiteData();

	var JSLoggingDisabled = site.JSLoggingDisabled;

    var dataReady = false;
    var custID = null;
    var persistentCustomerID = null;
    var custIP = null;
    var win = self.parent;
    var doc = win.document;
    var domObserver;
    var initRule = {};

	var KEY_ENGAGEMENT_ID_STRING = "engagementID";
	var KEY_CUSTOMER_ID_STRING = "customerID";

	resetObserver();
    /**
 * DOM polyfills
 * {@link https://github.com/inexorabletash/polyfill Is used the polyfills from this repo on gihub}
 */
/**
 * Document.querySelectorAll method
 * http://ajaxian.com/archives/creating-a-queryselector-for-ie-that-runs-at-native-speed
 * Needed for: IE7-
 */
if (!document.querySelectorAll) {
	document.querySelectorAll = function(selectors) {
		var style = document.createElement('style'), elements = [], element;
		document.documentElement.firstChild.appendChild(style);
		document._qsa = [];

		style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
		window.scrollBy(0, 0);
		style.parentNode.removeChild(style);

		while (document._qsa.length) {
			element = document._qsa.shift();
			element.style.removeAttribute('x-qsa');
			elements.push(element);
		}
		document._qsa = null;
		return elements;
	};
}

/**
 * Document.querySelector method
 * Needed for: IE7-
 */
if (!document.querySelector) {
	document.querySelector = function(selectors) {
		var elements = document.querySelectorAll(selectors);
		return (elements.length) ? elements[0] : null;
	};
}

    	/**
	 * Logs provided string to browser console.
	 * Regards JSLoggingDisabled switch set in Admin.
	 * @param {string} s string to log
	 * @param {string?} severity Logging level, one of "log", "error", "warn", "info", "debug", "trace"
	 */
	function log(s, severity) {
		if (!JSLoggingDisabled) {
			if (typeof console != "undefined") {
				if (typeof severity != "string") severity = "log";
				if (console[severity]) { // if not defined, fallback to console.log()
					// Note, the Chrome browser requires "this" to be the "window.console" object.
					// This requirement is fulfilled since this function is global.
					console[severity](s);
				} else if (console.log) {
					console.log(severity.toUpperCase() + ": " + s);
				}
			}
		}
	}

	function isC2PActive(siteC2P){
		if(isNullOrUndefined(siteC2P)){
			throw new Error("siteC2P parameter missing");
		}
		var chatData = CHM.getChatData().getChatData();
		if (!!chatData && !isNullOrUndefined(chatData['c2cToPersistent'])) {
			return chatData['c2cToPersistent'];
		}
		return siteC2P;
	}


	function fireCustomEvent(eventName, data, rule) {
		try {
			EVM.fireCustomEvent(eventName, rule, data);
		} catch (err) {
			logErrorToTagServer("External custom event(" + eventName + ") fire failure (siteID=" + siteID + "): " + err);
		}
	}

	/**
	 * Sends error message to TS. Regards JSLoggingDisabled switch set in Admin.
	 * @param errMsg message to be logged in TS log as an error.
	 */
	function logErrorToTagServer(errMsg) {
		logMessageToTagServer(errMsg, LOG_LEVELS.ERROR);
	}

	/**
	 * Sends message to TS. Regards JSLoggingDisabled switch set in Admin.
	 * @param msg message to be logged in TS log as an error.
	 * @param logLevel log level type
	 */
	function logMessageToTagServer(msg, logLevel) {
		if (isLog4TcSupported === true) {
			switch(logLevel) {
				case "FATAL": tclog.fatal(msg); break;
				case "ERROR": tclog.error(msg); break;
				case "WARN": tclog.warn(msg); break;
				case "INFO": tclog.info(msg); break;
				case "DEBUG": tclog.debug(msg); break;
			}
		} else {
			log(msg, logLevel);
			if (!JSLoggingDisabled) {
				ROM.post(urls.logJsPostURL, {level: logLevel, line: msg});
			}
		}
	}

	/**
	 * Log level string constants
	 * @type {FATAL: string, ERROR: string, WARN: string, INFO: string, DEBUG: string}
	 */
	var LOG_LEVELS = {
		FATAL : "FATAL",
		ERROR : "ERROR",
		WARN : "WARN",
		INFO : "INFO",
		DEBUG : "DEBUG"
	};

	/**
	 * Log level number constants
	 * @type {FATAL: number, ERROR: number, WARN: number, INFO: number, DEBUG: number}
	 */
	var JS_LOG_LEVELS = {
		FATAL : 5,
		ERROR : 4,
		WARN : 3,
		INFO : 2,
		DEBUG : 1
	};

	/**
	 * This method is to check weather or not the value passed is valid log level
	 *
	 * @param {string} value - Log level value.
	 * @return {Boolean}
	 */
	function isValidLogLevel(value) {
		for (var logLevel in LOG_LEVELS)
			if (LOG_LEVELS[logLevel] == value) return true;
		return false;
	}

	/**
	 * This function is to send log data to server based on the Log Level defined in the Rules.
	 *
	 * At Program Rules level by default the JS_LOG_LEVEL is set to "ERROR".
	 * We can override it at Business Rules level if we want to change the log level for a site
	 * to debug an issue specific to that site. For anything JSLogging should be enabled in portal.
	 *
	 * JS_LOG_LEVEL defined in the rules is specific to weather or not we need to post the message to the server.
	 *
	 * @param {string} msg
	 * @param {string} [msgLogLevel= LOG_LEVELS.INFO] msgLogLevel requested for the message, if not defined default to LOG_LEVELS.INFO
	 * @param {string} [svrLogLevel=msgLogLevel] if defined, will write msg to server at a different log level than locally written
	 */
	function sendMessageToTagServer(msg,msgLogLevel,svrLogLevel) {
		log(msg);

		if (!JSLoggingDisabled) {

			// if message log level is not passed or is not a valid log level, default to INFO.
			if (isNullOrUndefined(msgLogLevel) || !isValidLogLevel(msgLogLevel)) {
				msgLogLevel = LOG_LEVELS.INFO;
			}

			// if server log level is not passed, or is not valid log level, apply the message log level defined.
			if (isNullOrUndefined(svrLogLevel) || !isValidLogLevel(svrLogLevel)) {
				svrLogLevel=msgLogLevel;
			}

			//if the log level defined in the message is >= log level defined in the Rules, Post the message.
			if (JS_LOG_LEVELS[msgLogLevel] >= JS_LOG_LEVELS[getConstant("JS_LOG_LEVEL")]) {
				ROM.post(urls.loggingURL, {level: svrLogLevel, line: msg});
			}
		}
	}

	/**
	 * Logs a rule action error. An error may occur at evaluation of rule condition or execution of rule actions.
	 * Sends error details to TS.
	 * Regards JSLoggingDisabled switch set in Admin.
	 * @param e error to report
	 * @param rule error to report
	 * @param {string} [msg] message to send and display. Prepended to message
	 */
	function logActionErr(e, rule, msg) {
		if (!JSLoggingDisabled) {
			var errMsg = catchFormatter(e);
			var errStr = "Error in " + rule + (isNullOrUndefined(msg)?".":(" msg="+msg));
			log(errStr + " ChatID = " + CHM.getChatID() + ". CustomerID = " + getCustID());
			logErrorToTagServer(errStr + " \n" + errMsg);
		}
	}

	/**
	 *  toJsString - Stringifies the given string value.
	 *     1) All special escape characters are escaped with back slash
	 *     2) If the optional quote is given, then it is put at beginning and end of string
	 *   called as: toJsString(foo, "'");
	 *   or: toJsString(foo, '"');
	 *   or: toJsString(foo);
	 *   where foo is a string to be stringified (escaped and made into a JS String).
	 * @param val, value to be escaped
	 * @param quote, optional character (or string) to be used as a quote
	 */
	function toJsString(val, quote) {
		var value = val;
		value = value.split("\\").join("\\\\");
		value = value.split("\"").join("\\\"");
		value = value.split("\'").join("\\\'");
		value = value.split("\n").join("\\n");
		value = value.split("\r").join("\\r");
		value = value.split("\t").join("\\t");
		if (quote)
			value = quote + value + quote;
		return value;
	}

	function isPersistentWindow() {
		try {
			return window.parent.name == "_inqPersistentChat";
		} catch (err) {
			return false;
		}
	}

	function rand(low, high, roundToNearestIntegerFlag) {
		if (high < low) {
			throw ("Incorrect bounds for random generator: low = " + low + ", high = " + high);
		}
		var delta = high - low;
		var res = (!!roundToNearestIntegerFlag)?(Math.floor(Math.random()*(delta+1))+low):(Math.random() * delta + low);
		return res;
	}

	function typeOf(value) {
		var s = typeof value;
		if (s === 'object') {
			if (value) {
				if (typeof value.length === 'number' &&
					!(value.propertyIsEnumerable('length')) &&
					typeof value.splice === 'function') {
					s = 'array';
				}
			} else {
				s = 'null';
			}
		}
		return s;
	}

	/**
	 * Obtains a list of dom elements by class name they sport. Given a node, it will iterate
	 * through all children of that node and collecting those sporting the given class name.
	 * @param classname {string} The name of the class to seek.
	 * @param node The node on which to start the search. If undefined or null, the document
	 * body is chosen for the resolved window context is chosen by default.
	 * @param winCtxt The document window in which to search.
	 * If undefined or null, the globally defined "win" context is chosen by default.
	 * @return {Array} array of dom elements found. May be empty, never null.
	 */
	function getElementsByClassName(classname, node, winCtxt) {
		if(!node){
			winCtxt = !!winCtxt?winCtxt:win;
			node = winCtxt.document.getElementsByTagName("body")[0];
		}
		var a;
		if (node.getElementsByClassName) {
			a = node.getElementsByClassName(classname);
		} else {
			// Fallback for old browsers like IE8
			a = [];
			var re = new RegExp('\\b' + classname + '\\b');
			var els = node.getElementsByTagName("*");
			for (var i = 0, j = els.length; i < j; i++) {
				if (re.test(els[i].className)) {
					a.push(els[i]);
				}
			}
		}
		return a;
	}

	/**
	 * Determines if an expression or an expression wrapped in a function evaluates safely
	 * to null or undefined.
	 * @param o the function or expression to be evaluated. Function must wrap
	 * and return the expression to be evaluated.
	 * @param dfltOnError {boolean} value to be returned if the expression evaluation results
	 * in an error.
	 * @param logOnError {boolean} if true, will log on evaluation error
	 * @return {boolean} true if function expression evaluates to anything other
	 * than null or undefined. Returns false if safely evaluates to null or undefined. If error
	 * in evaluation, returns dfltOnError.
	 */
	function exists(o, dfltOnError, logOnError) {
		try {
			var val = o;
			if (typeof o == "function") {
				val = o();
			}
			return ((typeof val != "undefined") && (val != null));
		} catch (err) {
			if (!!logOnError) {
				logActionErr(err, rule, "JS eval error on expression " + o.toString());
			}
			return dfltOnError;
		}
	}

	/**
	 * Returns true if passed parameter is null or undefined.
	 * @param {object} val any object or variable
	 * @return {boolean} true if passed parameter is null or undefined
	 */
	function isNullOrUndefined(val) {
		return val == null || typeof(val) == "undefined";
	}

	/**
	 * Check if current browser is IE
	 * @return {boolean} true if IE
	 */
	function isIE() {
		return window.navigator.appName == "Microsoft Internet Explorer" || window.navigator.userAgent.indexOf("Trident") >= 0;
	}

	/**
	 * Check if current browser is FF
	 * @return {boolean} true if FF
	 */
	function isFF() {
		return window.navigator.userAgent.indexOf("Firefox") >= 0;
	}

	/**
	 * Check if current OS is iOS
	 * @return {boolean} true if OS is iOS
	 */
	function isIOS() {
		return /(iPad|iPhone|iPod)/g.test( window.navigator.userAgent );
	}

	/**
	 * Check if current OS is iOS 9
	 * @return {boolean} true if OS is iOS
	 */
	function isIOS9() {
		return /(iPad|iPhone|iPod).*OS 9/i.test( window.navigator.userAgent );
	}

	/**
	 * Check if current browser is Opera
	 * @return {boolean} true if Opera
	 */
	function isOpera() {
		return window.navigator.userAgent.indexOf("Opera") >= 0;
	}

	/**
	 * Check if current browser is Chrome
	 * @return {boolean} true if Chrome
	 */
	function isChrome() {
		return (window.navigator.userAgent.indexOf("Chrome") >= 0 || window.navigator.userAgent.indexOf("CriOS") >= 0)
				&& (!isEdge()); // navigator.userAgent for Edge have "Chrome" inside the value
	}

	/**
	 * Check if current browser is Safari.
	 * @return {boolean} true if Safari.
	 */
	function isSafari() {
		return window.navigator.userAgent.indexOf("Safari") >= 0
				&& (!isChrome()) && (!isEdge()); // navigator.userAgent for Chrome and Edge have "Safari" inside the value
	}

	/**
	 * Check if current browser is Edge.
	 * @return {boolean} true if Edge.
	 */
	function isEdge() {
		return window.navigator.userAgent.indexOf("Edge") >= 0;
	}

	/**
	 * Returns abbreviated browser type IJSF is currently running in: one of CHROME, OPERA, SAFARI, IE, FF, EDGE.
	 * @return {string} browser type. If browser is not supported no value is returned.
	 */
	function getClientBrowserType() {
		if (isIE()) {
			return "IE";
		} else if(isEdge()) {
			return "EDGE";
		} else if(isFF()) {
			return "FF";
		} else if(isChrome()) {
			return "CHROME";
		} else if(isOpera()) {
			return "OPERA";
		} else if(isSafari()) {
			return "SAFARI";
		} else {
			return "OTHER";
		}
	}


	/**
	 * Returns array includes browser name and version
	 * original solution found http://stackoverflow.com/questions/5916900/detect-version-of-browser
	 * @return {string[]} Browser name and version in array, for example ["Firefox","16.0"]
	 */
	function getBrowserTypeAndVersion() {
		var nvg = window.navigator.appName;
		var userAgt = window.navigator.userAgent;
		var temp;
		var matches = userAgt.match(/android(?!.*chrome)/i);
		if (matches && (temp = userAgt.match(/version\/([\.\d]+)/i)) != null) {
			matches = ["Android Browser", temp[1]];
		} else {
			matches = userAgt.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
			if (matches && (temp = userAgt.match(/version\/([\.\d]+)/i)) != null) {
				matches[2] = temp[1];
			}
			//check for Edge
			if(userAgt.indexOf("Chrome") >= 0 && (temp = userAgt.match(/(edge)\/?\s*(\.?\d+(\.\d+)*)/i))) {
				matches[1] = temp[1];
				matches[2] = temp[2];
			}
			matches = matches ? [matches[1], matches[2]] : [nvg, window.navigator.appVersion, '-?'];
		}
		return matches;
	}

	/**
	 * Returns client browser version
	 * @return {string} Returns browser version as string. for example "16.0"
	 */
	function getClientBrowserVersion(){
		var browserTypeAndVersion = getBrowserTypeAndVersion();
		var ua = window.navigator.userAgent;
		if(ua.indexOf("Trident") >= 0) {
			var matches= ua.match(/(trident)\/?\s*(\.?\d+(\.\d+)*)/i);
			var tridentVersion = new Number(matches[2]);
			if (tridentVersion >= 4) {
				return (tridentVersion + 4) + ".0";
			}
		}
		return browserTypeAndVersion[1];
	}

	// Takes 2 strings "2.3.4.5" and "2.5" and returns less, equal and greater than 0
	// depending which one is bigger.
	// Taken from http://stackoverflow.com/questions/2802993/compare-browser-versions-via-javascript/9116381
	function compareVersions(a, b) {
		var v1 = a.split('.');
		var v2 = b.split('.');
		for(var i = 0; i < Math.min(v1.length, v2.length); i++) {
			var res = v1[i] - v2[i];
			if (res != 0)
				return res;
		}
		return 0;
	}

	/**
	 * Returns client operating system type
	 * @return {string} Returns OS type as string.
	 */
	function getOSType() {
		var os = "Unknown";
		var platform = window.navigator.platform;
		var ua = window.navigator.userAgent;

		if (/Android/.test(ua)) {
			os = "Android";
		} else if (/iPhone/.test(ua) || /iPad/.test(ua) || /iPod/.test(ua)) {
			os = "iOS";
		} else if (/Win/.test(platform)) {
			os = "Windows";
		} else if (/Linux/.test(platform)) {
			os = "Linux";
		} else if (/Mac/.test(platform)) {
			os = "Mac OS";
		}

		return os;
	}

	/**
	 * Returns browser major version.
	 * Note: Now used only to determine cookie limits and thus supports only IE browsers as only IE has different
	 * limits in different versions IJSF supports.
	 * @return {number} browser major version or 0 if unable to detect.
	 */
	function getBrowserMajorVer(compatibilityOnly) {
		var ver = 0;
		if (isIE()) {
			var ua = window.navigator.userAgent;
			var tridentInd = ua.indexOf("Trident");
			//IE8 and older
			if (tridentInd >= 0) {
				ver = parseInt(ua.substring(tridentInd + 8)) + 4;
			} else {
				//old IE
				var ind = ua.indexOf("MSIE ");
				ver = parseInt(ua.substring(ind + 5));
			}
			if (compatibilityOnly) {
				if (document.documentMode && document.documentMode < ver) {
					ver = document.documentMode;
				}
			}
		}
		return ver;
	}

	/* As documented on Confluence: http://dev.inq.com/confluence/display/dev/Cookie+size+limits */
	var COOKIE_SIZE_LIMITS = {
		"IE8": 5118,
		"IE9": 5118,
		"IE10" : 5118,
		"IE11" : 5118,
		"FF": 4097,
		"SAFARI": 4093,
		"CHROME": 4095
	};

	/* As documented on Confluence: http://dev.inq.com/confluence/display/dev/Cookie+size+limits */
	var COOKIE_TOTAL_SIZE_LIMITS = {
		"IE8": 10236,
		"IE9": 10236,
		"IE10" : 10236,
		"IE11" : 10236,
		"FF": 614550,
		"SAFARI": 4093,
		"SAFARI_NEW": 8186,
		"CHROME": 732280
	};

	/**
	 * Returns cookie size limit for current browser.
	 * @return {number} cookie size limit for current browser or 0 if limit is not defined for current browser.
	 */
	function getCookieSizeLimit() {
		var browserType = getClientBrowserType();
		var limit = COOKIE_SIZE_LIMITS[browserType];
		if (isNullOrUndefined(limit)) {
			limit = COOKIE_SIZE_LIMITS[browserType + getBrowserMajorVer()];
		}
		return limit;
	}

	/**
	 * Returns total cookie size limit (per domain) for current browser.
	 * @return {number} total cookie size limit (per domain) for current browser.
	 */
	function getCookieTotalSizeLimit() {
		var browserType = getClientBrowserType();
		var limit = COOKIE_TOTAL_SIZE_LIMITS[browserType];
		if (isNullOrUndefined(limit)) {
			limit = COOKIE_TOTAL_SIZE_LIMITS[browserType + getBrowserMajorVer()];
		}
		if (isSafari() && getBrowserMajorVer() > 6) {
			limit = COOKIE_TOTAL_SIZE_LIMITS["SAFARI_NEW"];
		}
		return limit;
	}

	function getStackTrace(err) {
		try {
			var callstack = [];
			if (arguments && arguments.callee && arguments.callee.caller) {
				var fnctn = arguments.callee.caller.caller;
				while (fnctn) {
					if (callstack.length > 32)
						break;
					var fn = ""+fnctn.toString();
					var fnameIx = fn.indexOf("function ")+9;
					var fnameEnd = fn.indexOf('(', fnameIx);
					var fname = fn.substring(fnameIx, fnameEnd) || 'anonymous function';
					var args = "";
					if (fnctn.arguments.length) {
						for (var ix=0; ix < fnctn.arguments.length; ix++) {
							var arg = fnctn.arguments[ix];
							args += ((args.length!=0)?",":"")+formatArgument(arg);
						}
					}
					callstack.push(fname+"("+args+")");
					fnctn = fnctn.caller;
				}
				return "stack trace:\n\t\t" + callstack.join("\n\t\t");
			}
			return "";
		} catch (e) {
			return "";
		}
	}

	/**
	 * Logging is ambiguous on the TS without chatID, custID, siteID etc.
	 * This function makes log message meaningful by adding context variables to the message.
	 * @param {string} msg message string to be supplemented with context data
	 * @return {string} message string supplemented with context data such as customer id etc
	 */
	function prepareLoggingContext(msg) {
		var result = msg;
		if (!result) result = "";
		var o = {};
		try {o["chatID"] = "" + CHM.getChatID();}catch(e){}
		try {o["custID"] = Inq.custID;}catch(e){}
		try {o["custIP"] = Inq.custIP;}catch(e){}
		try {o["siteID"] = Inq.siteID;}catch(e){}
		try {o["pageID"] = LDM.getPageID();}catch(e){}
		for (var itm in o) {
			try {
				result += itm + ": " + ("" + o[itm]) + "; ";
			} catch (e) {
				result += itm + ": " + formatArgument(o[itm]) + "; ";
			}
		}
		return result;
	}

	function catchFormatter(err) {
		try {
			var desc = "\t";
			if (err && err.message) {
				desc += err.message + ". ";
			} else {
				desc += "Throw while processing. ";
			}
			desc += prepareLoggingContext();
			desc += "\n\t" + getStackTrace(err);
			return encodeURIComponent(desc);
		} catch (e) {
			return "";
		}
	}

	function parseUrl (str) {
		var m = str.match(/^(https?):\/\/([^\/:]+)(:?(\d*))/);
		var host = m[2];
		var domain = (host.indexOf('.') >= 0		// Sanity check.
			&& host.split('.').length >= 3)			// One dot domain name (e.g. tc.com) will be used as is
			? host.split('.').slice(1).join('.')	// Strip the host name.
			: host;									// Default.
		return {
			origin: m[1] + "://" + m[2],
			href: str,
			protocol: m[1],
			domain: domain,
			host: host,
			port: (m[4] ? m[4] : 80)
		};
	}

	function safe(id, dflt, sendErrorToTagServer) {
		if (id) {
			try {
				var o = win.eval(id);
				if (isNullOrUndefined(o)) {
					return o;
				} else if (typeOf(o) == "array") {
					return Array.clone(o);
				} else if (o.getTime) { // Date marker check
					if (!o.equals) { // a check to make sure that not yet mixed in
						MixIns.prepare(o).mixIn(DateMixIn);
					}
				} else if (o.toExponential) { // Number marker check
					if (!o.inRange) { // a check to make sure that not yet mixed in
						MixIns.prepare(o).mixIn(NumberMixIn);
					}
				}

				return o;
			} catch (err) {
				if (sendErrorToTagServer) {
					logErrorToTagServer(err);
				}
			}
		}
		return dflt;
	}

	function processReceivedExternalDataThrows(id, dflt) {
		return safe(id, dflt, true);
	}

	/**
	 * Returns true if supplied object is an empty object i.e. {}.
	 */
	function isEmptyObject(obj){
		for(var i in obj) { return false;}
		return true;
	}

	function normalizeProtocol(url) {
		var URL_REGEXP_IS_CONTAINS_PROTOCOL = new RegExp("^[0-9A-z\\.\\+\\-]*:|^//");
		if (url == null || url.length == 0) {
			return url;
		} else if (url.match(URL_REGEXP_IS_CONTAINS_PROTOCOL)) {
			return url.replace(/^HTTPS?:/i, win.location.protocol);
		} else {
			return win.location.protocol + "//" + url;
		}
	}

	/**
	 * Modifies protocol of url from HTTP to HTTPS
	 * @param {string} httpURL which has to be processed
	 * @return {string} url will be returned with HTTPS protocol
	 */
	function secureHTTP(httpURL) {
		return httpURL.replace(/^http:/i, "https:");
	}

	/**
	 * Returns object as key,value;key,value sequence
	 * @param {Object} obj JSON object to process
	 * @param {boolean=} encodingRequired flag to use URL encoding for data
	 * @return {string} string of appropriate format
	 */
	function objectAsLogString(obj, encodingRequired) {
		if (!obj) {
			return null;
		}
		var string = "";
		for (var a in obj) {
			if (!isNullOrUndefined(obj[a]) && obj[a] !== "") {
				var encodedPair = encodingRequired ? encodeURIComponent(a) + "," + encodeURIComponent(obj[a]) : a + "," + obj[a];
				string += !!string ? ";" + encodedPair : encodedPair;
			}
		}
		return string;

	}

	/** productionFilter
	 * Filters the hosted file list for production and non production.
	 *
	 * RTDEV-8345
	 *	First Party Cookie Solution Does Not Work on Non-Public Domains
	 *	Make the filter a list of filters that can test independent internal sites called "silos"
	 * TODO: split these regular expressions into separate database entries, do not like comma deliminated
	 *
	 * @param {string} hostedFileList
	 * @param {string} _productionFilter
	 * @return {string}
	 */
	function productionFilter(hostedFileList, _productionFilter){
		if (_productionFilter) {
			var filters = _productionFilter.split(","); /* The filter is now a list of filters delimited by commas */

			var listItems = hostedFileList.split(",");
			var filteredListItems = [];
			var regexProduction = new RegExp(filters[0], "i");	/* The first filter is for production URLs */
			var production = regexProduction.test(inqFrame.parent.location.href);//inqFrame.parent.location.href.match(regexProduction);

			if (production) {
				for (var i = 0; i < listItems.length; i++) {
					var item = listItems[i];
					if (regexProduction.test(item)) {
						filteredListItems.push(item);
					}
				}
				return filteredListItems.join(",");
			} else if (filters.length > 1) { /* The production filter failed so we will check for each group (silo) */
				/* The filter code below is the similar as the filter code above, for production
				 * The difference is that we filter production and silo urls into the list
				 */

				/* Added "Walled Garden" support where the sites in the garden can coexist but the production references would be filtered out
				 * So ... if prefixed with a minus sign we realise that this is a walled garden and we leave out production list
				 */
				var /** @type {boolean} */ walledGarden;
				var /** @type {string} */ filter;
				for (i = 1; i < filters.length; i++) {
					filter = filters[i];
					walledGarden = filter.indexOf("-") == 0;
					var regexSilo = new RegExp((walledGarden)?filter.substr(1):filter, "i");
					var silo = regexSilo.test(inqFrame.parent.location.href);
					if (silo) {
						for (i = 0; i < listItems.length; i++) {
							var item = listItems[i];
							if (regexSilo.test(item) || (!walledGarden && regexProduction.test(item))) {
								filteredListItems.push(item);
							}
						}
						return filteredListItems.join(",");
					}
				}
			}
		}
		return hostedFileList;
	}

	/**
	 * Public function
	 * Attaches the listener of event on the target element.
	 *
	 * Usage: attachListener(window, "load", Inq.start);
	 *
	 * @param {DOMElement|Window} target
	 * @param {string} type
	 * @param {function} listener
	 * @param {boolean} useCapture
	 */
	function attachListener(target, type, listener, useCapture) {
		if (!useCapture) {
			// Prior to Firefox 6, the browser would throw an error
			// if the useCapture parameter was not explicitly false.
			useCapture = false;
		}
		if (target.addEventListener) {
			target.addEventListener(type, listener, useCapture);
		} else if (target.attachEvent) {
			target.attachEvent("on" + type, listener);
		}
	}

	/**
	 * Public function
	 * Removes the event listener previously registered with attachListener()
	 *
	 * Usage: detachListener(window, "load", Inq.start);
	 *
	 * @param {DOMElement|Window} target
	 * @param {string} type
	 * @param {function} listener
	 * @param {boolean} useCapture
	 */
	function detachListener(target, type, listener, useCapture) {
		if (!useCapture) {
			// Prior to Firefox 6, the browser would throw an error
			// if the useCapture parameter was not explicitly false.
			useCapture = false;
		}
		if (target.removeEventListener) {
			target.removeEventListener(type, listener, useCapture);
		} else if (target.attachEvent) {
			target.detachEvent("on" + type, listener);
		}
	}

    /* RTDEV-128. CL 20119. ChatRouter domain is stored in database but we should store full URL. Because of discrepancies between configuration and
     *  inq_new databases we can't update DB values. To get full CR url it decided to add HTTPS protocol to vanity domain value.
     */
    var urls = {
        siteHostedFileURL : productionFilter(site.psHosturlList || "",site.productionFilter),
        baseURL: normalizeProtocol(site.vanityDomainName+"/tagserver"),
        vanityURL: normalizeProtocol(site.vanityDomainName),
        chatRouterVanityDomain: normalizeProtocol("https://"+site.chatRouterVanityDomain),
		pageUnloadURL: "https://" + site.chatRouterVanityDomain + "/chatrouter/chat/pageUnload",
        initFrameworkURL: normalizeProtocol(site.vanityDomainName+"/tagserver/init/initFramework"),
        getSiteTzOffsetURL: normalizeProtocol(site.vanityDomainName+"/tagserver/init/getSiteTzOffset"),
        cookieGetURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/cookie/getServerCookie"),
        cookieSetURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/cookie/setDelta"),
        cookieClearAllURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/cookie/clearAllServerCookies"),
        cookieClearOneURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/cookie/clearOneServerCookie"),
        requestC2CImageURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/launch/requestC2CImage"),
        requestChatLaunchURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/launch/requestChatLaunch"),
        agentsAvailabilityCheckURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/launch/agentAvailability"),
        loggingURL:  normalizeProtocol(site.vanityDomainName+"/tagserver/logging/logline"),
        logDataURL: normalizeProtocol(site.vanityDomainName+"/tagserver/logging/logdata"),
        logJsURL: normalizeProtocol("https://"+site.clusterEnvironment+"tslogging.touchcommerce.com/tagserver/logging/log4js"),
        logJsPostURL: normalizeProtocol(site.vanityDomainName+"/tagserver/logging/log4js"),
        mediaRootURL:  normalizeProtocol(site.mediaServer),
        mediaBaseURL:  normalizeProtocol(site.mediaServer+"/media"),
        mediaSiteURL:  normalizeProtocol(site.mediaServer+"/media/sites/"+site.siteID),
        skinURL:  normalizeProtocol(site.vanityDomainName+"/chatskins/sites/"+site.siteID+"/flash/"),
        cobrowseURL:  normalizeProtocol(site.cobrowseURL),
        xFormsDomain: normalizeProtocol(site.xformsVanityDomain)
    };

/**
 * Get message by key based on language settings.
 * @param {string} a message key
 * @return {string} message
 */
function getLocalizedMessage(key) {
    var result = site.messages[key];
    if (!result) {
        result = "no translation for the key [" + key + "]";
    }
    return result;
}

/**
 * XMLHttpRequest Facade -
 *		Creates a consistent XMLHttpRequest that works cross-domain across all supported browsers.
 * @see http://www.w3.org/TR/cors/
 * @see http://www.w3.org/TR/XMLHttpRequest/
 * @see http://blogs.msdn.com/b/ie/archive/2012/02/09/cors-for-xhr-in-ie10.aspx
 * @see http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
 * @author fpinn@touchcommerce.com
 */
(function() {
	// Note: resetGlobalVars() relies that we check type of global variables,
	// DO NOT USE ["XMLHttpRequestFacade" in window] to check for custom window properties.
	if (typeof window.XMLHttpRequestFacade != "undefined")
		return ;

	if (typeof window.XMLHttpRequestOriginal != "undefined")
		return;

	if (!!window["XMLHttpRequest"]) {
        if ("FACADE" in window.XMLHttpRequest) {
            // We are heavily broken if we got here as this means that window.XMLHttpRequestFacade
            // and window.XMLHttpRequestOriginal are not present but XMLHttpRequest is overwritten
            if ("console" in window) console.error("XF: ERROR: Inconsistent xform window state detected");
        } else {
            window.XMLHttpRequestOriginal = XMLHttpRequest;
        }
    }
	/** XMLHttpRequestLegacy implementation
	 *	Uses an IFRAME to be a proxy for requesting AJAX calls to our servers
	 *	Each server can have it's own IFRAME source.  The IFRAME source is mapped as follows:
	 *		XMLHttpRequestLegacy.serverMap["server.domain.name]="//server.inq.com/path/xhrProxy.html";
	 *	For the ORBEON server it is:
	 *	 	window.XMLHttpRequestLegacy.serverMap["forms.inq.com"]="//forms.inq.com/xhr/xhrProxy.html";
	 */
	window.XMLHttpRequestLegacy = function(){
		/* Public Properties */
		this.onabort = null;
		this.onerror = null;
		this.onload = null;
		this.onloadend = null;
		this.onloadstart = null;
		this.onprogress = null;
		this.onreadystatechange = null;
		this.readyState = 0;
		this.response = "";
		this.responseText = "";
		this.responseType = "";
		this.responseXML = null;
		this.status = 0;
		this.timeout = 0;
		this.withCredentials = false;
		this.statusText = 0;
		/* Private properties */
		this._impl=null;
		this._requestHeaders=[];
		this._responseHeaders=[];
		this._methodString="GET";
		this._methodUrl="";
		this._asyncFlag=true;
		this._userString="";
		this._userPassword="";
		this._id="";
		
		/** _toJsString - Private function that makes a string into javascript string, insert escape characters
         * @param val the string to make into a javascript string
		 * @return - string representation of the input string with special characters escaped with a reverse slash and contained in quotes
         */
        this._toJsString=function(val) {
			if (val==null) return null;
        	var value = val;
        	value = value.split("\\").join("\\\\");
        	value = value.split("\"").join("\\\"");
        	value = value.split("'").join("\\'");
        	value = value.split("\n").join("\\n");
        	value = value.split("\r").join("\\r");
        	value = value.split("\t").join("\\t");
        	value = "\"" + value + "\"";
        	return value;
        };
		
		/** _jsonString - private function to make the XMLHttpRequest into a JSON.
		 * This function is used to transfer the request to the Iframe/proxy.  The Iframe/proxy then
		 *   reconstitutes the request for it's use.
		 * @return - string representation of the XMLHttpRequest to be analysed by the IFRAME/proxy.
		 */
		this._jsonString=function(){
			var ix;
			var json = "{";
			/* Add the request headers */
			json += "requestHeaders:[";
			for (ix=0; ix<this._requestHeaders.length; ix++){
				if (ix>0) json += ",";
				json += "[" + this._requestHeaders[ix][0] + ","
				       + this._requestHeaders[ix][1] + "]";
			}
			json += "]";
			json += ",methodString:"+this._toJsString(this._methodString);
			json += ",methodUrl:"+this._toJsString(this._methodUrl);
			json += ",asyncFlag:"+this._asyncFlag;
			json += ",userString:"+this._toJsString(this._userString);
			json += ",userPassword:"+this._toJsString(this._userPassword);
			json += ",timeout:"+this.timeout;
			json += ",withCredentials:"+this.withCredentials;
			json += ",data:"+this._toJsString(this._data);
			json += ",_id:"+this._toJsString(this._id);
			json += ",_callBack:"+this._toJsString(self.location.href.split("?")[0]);
			json += ",onabort:"+(this.onabort!=null);
			json += ",onerror:"+(this.onerror!=null);
			json += ",onload:"+(this.onload!=null);
			json += ",onloadend:"+(this.onloadend!=null);
			json += ",onloadstart:"+(this.onloadstart!=null);
			json += ",onprogress:"+(this.onprogress!=null);
			json += ",onreadystatechange:"+(this.onreadystatechange!=null);
			json += "}";
			return json;
		};
		
		this.getAllResponseHeaders = function(){
			var ix, headers = "";
			for (ix=0; ix < this._responseHeaders.length;ix++){
				if (ix!=0) headers += '\r';
				headers += this._responseHeaders[ix][0] + ": " + this._responseHeaders[ix][1];
			}
		};
		
		this.getResponseHeader = function(key){
			var ix;
			for (ix=0; ix < this._responseHeaders.length;ix++){
				if (key == this._responseHeaders[ix][0]) {
					return this._responseHeaders[ix][1];
				}
			}
			return null;
		};
		
		/** abort - aborts the current AJAX call
		 *
		 */
		 this.abort = function(){
			 XMLHttpRequestLegacy._RemoveIframe(this._id);
		 };
		
		/** setRequestHeader delegate - sets the request header for ajax call,
		 *		put's request into the private _requestHeader array to be processed by the Iframe/proxy
		 * @param headerString - the name of the Header to be set (the key)
		 * @param valueString - the value of the header.
		 * @return nothing
		 */
		this.setRequestHeader = function(headerString, valueString){
			this._requestHeaders.push([this._toJsString(headerString), this._toJsString(""+valueString)]);
		};
		
		/** setOnLoad delegate - sets the handler for the onload function
		 *  @param handler - function to handle the "load" event
		 */
		this.setOnLoad=function(handler){
			this.onload = handler;
		};
		
		/** setOnError - sets the handler for the onload function
		 *  @param handler - function to handle the "error" event
		 */
		this.setOnError=function(handler){
			this.onerror = handler;
		};
		
		/** open delegate -
		 * @param methodString - the method to perform, ie GET, POST, HEAD
		 * @param methodUrl - the URL to be accessed
		 * @param asyncFlag - (optional) true signifies asynchronous.  Default true
		 * @param userString - (optional) user name for authentication
		 * @param userPassword - (optional) user password for authentication
		 */
		this.open = function(methodString, methodUrl, asyncFlag, userString, userPassword){
			if (asyncFlag==null) asyncFlag = true;
			this._methodString = methodString;
			this._methodUrl = methodUrl;
			this._asyncFlag = asyncFlag;
			this._userString = userString;
			this._userPassword = userPassword;
		};
		
		this.overrideMimeType = function(mimeString){
			this.debug("override: " + mimeString);
			if ("overrideMimeType" in this._impl)
				return this._impl.overrideMimeType(mimeString);
		};
		
		/** send - send data to the server
		 * If data is to be sent cross domain, then use the iframe/proxy
		 * If not, then use the _sendInDomain method to create a "vanilla" xmlHttpRequest instance and perform the send
		 * @param  data to be sent, or null
		 */
		this.send = function(data){
			this._data = (data)?data:null;
			/* Test for cross domain request */
			if (this._isCrossDomain()) {
				var id = "XHR"+Math.floor(Math.random()*1000001);
				/* Ensure that the request is unique by checking the ID in the document
				 * If it is unique, null will be returned
				 */
				while (null != document.getElementById(id)){
					id = "XHR"+Math.floor(Math.random()*1000001);
				}
				this._id = id;
				var jsonString = this._jsonString();
				var frameSrc = '"' + this._getProto() + window.XMLHttpRequestLegacy.getFrameSource(this._getDomain()) + '"' ;
				var divTemp = document.createElement("DIV");
				divTemp.innerHTML  = "<IFRAME "
							+ "ID=" + id + " "
							+ "STYLE=\"overflow: hidden; position: absolute; display: block; border: none; top:0px;left:0px;width: 1px; height: 1px;\" "
							+ "NAME=\"" + encodeURIComponent(jsonString) + "\" "
							+ "SRC=" + frameSrc + ">\n</IFRAME>";
				var iframe = divTemp.firstChild;
				iframe["_xmlRequest"] = this;
				document.body.appendChild(iframe);
			}
			else {
				this._sendInDomain();
			}
		};
		
		/** _sendInDomain private function - creates
		 *
		 */
		this._sendInDomain=function(){
			/* Establish the xhr item to perform the "vanilla" XHR */
			if (this._impl) this._impl = null;
			if (typeof window.XMLHttpRequestOriginal != "undefined")
				this._impl = new XMLHttpRequestOriginal();
			if (this._impl==null && "ActiveXObject" in window)
				try { this._impl = new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch(e){ /* Not an error, no need to report */ }
			if (this._impl==null && "ActiveXObject" in window)
 				try { this._impl = new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch(e){ /* Not an error, no need to report */ }
			if (this._impl==null && "ActiveXObject" in window)
 				try { this._impl = new ActiveXObject("Msxml2.XMLHTTP"); } catch(e){ /* Not an error, no need to report */ }
			if (this._impl == null) return;
			
			try {
				this._impl.open(this._methodString, this._methodUrl, this._asyncFlag, this._userString, this._userPassword);
				/* Apply event handlers */
				this._impl.onabort		= (this.onabort!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onabort");}):null;
				this._impl.onerror		= (this.onerror!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onerror");}):null;
				this._impl.onload 		= (this.onload!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onload");}):null;
				this._impl.onloadend 	= (this.onloadend!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onloadend");}):null;
				this._impl.onloadstart 	= (this.onloadstart!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onloadstart");}):null;
				this._impl.onprogress 	= (this.onprogress!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onprogress");}):null;
				this._impl.onreadystatechange 	= (this.onreadystatechange!=null)? XMLHttpRequestLegacy._MethodClosure(this,function(){return this._fireEvent("onreadystatechange");}):null;
				/* Apply properties to the _xdr instance */
				this._impl.timeout = this.timeout;
				/* Apply the headers */
				for (var ix=0; ix<this._requestHeaders.length; ix++){
					this._impl.setRequestHeader(this._requestHeaders[ix][0],this._requestHeaders[ix][1]);
				}
				if (null==this._data)
					this._impl.send();
				else
					this._impl.send(this._data);
			} catch (e){
				this.error("XHR send error",e);
			}
		};
		
		
		this._onRemoteEvent=function(remoteObject) {
			/* Apply remote data back to this implementation */
			var b = false;
			var eventName = remoteObject._eventName;
			/* There is a posibility that the ready-states come out of order */
			try {
				if (eventName == "onreadystatechange" && this.readyState > remoteObject.readyState) {
			//		alert("onreadystatechange out of order");
					return;
				}
			} catch(e){this.error("Event error in onRemoteEvent",e);}
			this.readyState = remoteObject.readyState;
			this.response = remoteObject.responseText;
			this.responseText = remoteObject.responseText;
			this.responseType = remoteObject.responseType;
			try {this.status = remoteObject.status;} catch(X){ /* no error report, status may not be available */ }
			try {this.statusText = remoteObject.statusText;} catch(X){/* no error report, status may not be available */}
			try {
				var func = this[eventName];
				if (func!=null) {
					b = this[eventName]();
				}
			}catch(e){this.error("Event error, could not fire " + eventName, e);}
			
			/* If we are finished with the IFRAME, then we get the onerror or onload event
			 * so, remove the iframe when complete (give it a second to be safe).
			 */
			switch(eventName){
				case "onload": case "onerror": case "onabort": {
					setTimeout("XMLHttpRequestLegacy._RemoveIframe(" + this._toJsString(this._id) +  ");", 1000);
				}
			}
			
			return true;
		};
		
		this._fireEvent=function(eventHandlerName,event) {
			var b = false;
			var func=null;
			this.readyState = this._impl.readyState;
			this.response = this._impl.response;
			try {this.responseText = this._impl.responseText;} catch(X){ /* Not an error, no need to report */ }
			try {this.responseBody = this._impl.responseBody;} catch(X){ /* Not an error, no need to report */ }
			this.responseType = this._impl.responseType;
			try {this.responseXML = this._impl.responseXML;} catch(X){ /* Not an error, no need to report */ }
			try {this.status = this._impl.status;} catch(X){ /* Not an error, no need to report */ }
			try {this.statusText = this._impl.statusText;} catch(X){ /* Not an error, no need to report */ }
			try {
				func = this[eventHandlerName];
				if (func!=null)
					b = this[eventHandlerName]();
			} catch(e) {
                this.error("Event error, could not fire " + eventHandlerName, e);
            }
			return b;
		};
		
		/** _isCrossDomain - private function that returns a boolean that states whether-or-not we are going cross domain
		 * @return - boolean, true - we are cross domain, false - we are NOT cross domain
		 */
		this._isCrossDomain=function(){
			return window.location.host != this._getDomain();
		};
		
		this._getDomain=function(){
			var rx = new RegExp('((http://|https://|//|/|#){0,1}[^"]*)', 'i');
			var parts = rx.exec(this._methodUrl);
			var url = "";
			switch(parts[2]) {
				case "http://":case "https://":case "//":{
					url = parts[1];
					} break;
				case "#":
				case "/":
				default: {
					return window.location.host;
					}break;
			}
			parts = url.split("/"); /* proto://domain/path */
			return  parts[2];
		};
		this._getProto=function(){
			var rx = new RegExp('((http://|https://|//|/|#){0,1}[^"]*)', 'i');
			var parts = rx.exec(this._methodUrl);
			var proto = window.location.protocol;
			switch(parts[2]) {
				case "http://":case "https://":{
					proto = parts[2].slice( 0, -2 );
					} break;
				default: {
					proto = window.location.protocol;
					}break;
			}
			return  proto;
		};
	};
	
	/** static private - method closure
	 *
	 */
	XMLHttpRequestLegacy._MethodClosure=function(obj, method) {
		var _method = method;
		var _obj = obj;
		var _func = function() {
			return _method.apply(_obj, arguments);
		};
		_func.scope = _obj;
		_func.method = _method;
		return _func;
	};
	
	/** static public - removes the IFRAME/Proxy from the document when XHL is complete
	 *  @param iframeId string containing the ID of the iframe to be removed
	 */
	XMLHttpRequestLegacy._RemoveIframe=function(iframeId){
		try {
			var iframe = document.getElementById(iframeId) ;
			if (iframe){
				var par = iframe.parentNode;
				if (par) {
					par.removeChild(iframe);
				}
			}
		} catch (e){this.error("Garbage Collection error in XMLHttpRequestLegacy._RemoveIframe", e);}
	};

	/** static public, accepts the return data from the IFRAME xhr
	 * @param jsonString of type string - the JSON string of the data for the XHR
	 */
	XMLHttpRequestLegacy.Return=function(jsonString){
		var xfrObj = eval("(" + jsonString + ")");
		var id = xfrObj._id;
		var iframe = document.getElementById(id);
		if (iframe) {
			var xhr = iframe["_xmlRequest"];
			if (xhr)
				(xhr._subclass._impl)._onRemoteEvent(xfrObj);
		}
	};
	
	/** XMLHttpRequestFacade constructor - replaces the XHLHttpRequest to perform cross domain on all supported browsers
	 *
	 */
	window.XMLHttpRequestFacade = function() {
		/* establish the correct implementation for ajax transport */
		this._impl = XMLHttpRequestFacade._factory();	/* This is the implementation factory that gets the correct impl */
		this._impl._subclass = this;					/* Have the implementation have reference to this */
		this.log = function(s){ if ("console" in window) console.log("XHRF: " + s); };
		this.error = function(s,ex){ if ("console" in window) console.log("XHRF: " + s, ex); };
		this.debug = function(s,ex){ if ("console" in window && this._debug) console.log("XHRF: " + s, ex); };
		this.onabort = null;
		this.onerror = null;
		this.onload = null;
		this.onloadend = null;
		this.onloadstart = null;
		this.onprogress = null;
		this.onreadystatechange = null;
		this._debug = false;
		this.readyState = 0;
		this.response = "";
		this.responseText = "";
		this.responseBody = "";
		this.responseType = "";
		this.responseXML = null;
		this.status = 0;
		this.statusText = 0;
		
		/** onabort
		 *
		 */
		this._impl.onabort = function(event){
		//	this._subclass.log("onabort");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onabort){
				this._subclass.onabort(event);
			}
		};
		
		this._impl.setOnError(function(event){
		//	this._subclass.log("onerror");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onerror){
				this._subclass.onerror(event);
			}
		});
		
		this._impl.setOnLoad(function(event){
		//	this._subclass.log("onload");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onload){
				this._subclass.onload(event);
			}
		});
		
		this._impl.onloadend = function(event){
			
		//	this._subclass.log("onloadend");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onloadend){
				this._subclass.onloadend(event);
			}
		};
		
		this._impl.onloadstart = function(event){
		//	this._subclass.log("onloadstart");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onloadstart){
				this._subclass.onloadstart(event);
			}
		};
		
		this._impl.onprogress = function(event){
		//	this._subclass.log("onprogress");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onprogress){
				this._subclass.onprogress(event);
			}
		};
		
		this._impl.onreadystatechange = function(event){
		//	this._subclass.log("onreadystatechange");
			(this._subclass)._syncupFromImpl();
			if (null != this._subclass.onreadystatechange){
			//	this._subclass.log("onreadystatechange: " + this.readyState);
				this._subclass.onreadystatechange(event);
			}
		};

		this.addEventListener = function(type, listener, useCapture){
			this.debug("addEventListener: " + type);
			if (!useCapture)useCapture=false;
			if ("addEventListener" in this._impl)
				this._impl.addEventListener(type, listener, useCapture);
		};
		
		this.removeEventListener = function(type, listener){
			if ("removeEventListener" in this._impl)
				this._impl.removeEventListener(type, listener, useCapture);
		};
		
		/** abort delegate - ask impl to abort the xhr
		 * @return nothing
		 */
		this.abort = function() {
			if ("abort" in this._impl){
				this._impl.abort();
			} else {
				this.error("abort: Not implemented");
			}
		};
		
		this.getAllResponseHeaders = function () {
			if ("getAllResponseHeaders" in this._impl)
				return this._impl.getAllResponseHeaders();
		};
		
		this.getResponseHeader = function(headerString) {
			if ("getResponseHeader" in this._impl)
				return this._impl.getResponseHeader(headerString);
		};
		
		/**
		 * open delegate - assigns destination URL and method to send request
		 *	This open is subclassed to:
		 *		1) allow default server and protocol, if not supplied in URL
		 *		2) allow the JSESSION-ID to be injected into the URL for correct session tracking
		 *			This is needed to preserve java sessions when 3rd party cookies are not enabled
		 *			Cookieless sessions are achieved by appending a string of the format ";jsessionid=sessionIdentifier" to the end of a URL and before the query.
		 * @see http://stackoverflow.com/questions/436752/supporting-sessions-without-cookies-in-tomcat
		 * @see https://developers.google.com/search-appliance/documentation/50/admin/URL_patterns
		 * @param methodString - the method to perform, ie GET, POST, HEAD
		 * @param methodUrl - the URL to be accessed
		 * @param asyncFlag - (optional) true signifies asynchronous.  Default true
		 * @param userString - (optional) user name for authentication
		 * @param userPassword - (optional) user password for authentication
		 */
		this.open = function(methodString, methodUrl, asyncFlag, userString, userPassword){
			if (asyncFlag==null) asyncFlag = true;
		
			/* fix up the URL */
			var domain = this.constructor.defaultServerDomain;		/* From the constructor function get the default domain */
			var proto  = this.constructor.defaultServerProtocol;	/* From the constructor function get the default protocol */
			if (domain==null) domain = "";
			if (proto==null) proto = "";

			if (proto.length > 0){									/* Add the colon if exists */
				if (proto.indexOf(":")==-1) proto += ":";
			}
			
			var rx = new RegExp('((http://|https://|//|/|#){0,1}[^"]*)', 'i');
			var parts = rx.exec(methodUrl);
			var url = "";
			
			/* Fix the URL, put in default protocol and domain if not specified */
			switch(parts[2]) {
				case "http://":case "https://":case "#":{
					url = parts[1];
					} break;
				case "//":{
					url = proto + parts[1];
					}break;
				case "/":{
					url = proto + "//" + domain + parts[1];
					}break;
				default:{
					url = path + "/" + parts[1];
					}break;
			}
			methodUrl = url ;
			
			/* Now put the session id in the URL for Resin to pick up */
			var jsessionid  = this.constructor.jsessionid;
			if (jsessionid!=null && jsessionid.length > 0) {
				parts = methodUrl.split("?");
				parts[0] += ";jsessionid=" + jsessionid;
				methodUrl = parts.join("?");
			}
			
			if (arguments.length < 4){
				this._impl.open(methodString, methodUrl, asyncFlag);
			} else if (arguments.length < 5) {
				this._impl.open(methodString, methodUrl, asyncFlag, userString);
			} else {
				this._impl.open(methodString, methodUrl, asyncFlag, userString, userPassword);
			}
		};
		
		/**
		 * overrideMimeType delegate - ask impl to perform the overrideMimeType
		 * @param mimeString - string containing new mime type
		 */
		this.overrideMimeType = function(mimeString){
			this.debug("override: " + mimeString);
			if ("overrideMimeType" in this._impl)
				return this._impl.overrideMimeType(mimeString);
		};
		
		/** send delegate - ask implementation to send data
		 * @param data to be sent or null
		 */
		this.send = function(data){
			this.debug("send");
			if ("send" in this._impl){
				if (!!data) {
					return this._impl.send(data);
				} else {
					return this._impl.send();
				}
			}
		};
		
		/** setRequestHeader delegate - ask (if implemented) the implementation (impl) to set the request header
		 * @param headerString - string that specifies the header name
		 * @param valueString - string that specifies the value to which the headerName is to be set
		 * @return nothing
		 */
		this.setRequestHeader = function(headerString, valueString){
			this.debug("setRequestHeader: " + headerString + ": " + valueString);
			try {
				if ("setRequestHeader" in this._impl)
					return this._impl.setRequestHeader(headerString, valueString);
			} catch (e){ this.error("setRequestHeader: Error", e); }
		};
		
		/**
		 * private function that makes sure that the impl data is set to the facade
		 */
		this._syncupFromImpl=function() {
			this.debug("sync readyState");
			this.readyState = this._impl.readyState;
			this.response = this._impl.response;
			this.responseText = this._impl.responseText;
			try {this.responseBody = this._impl.responseBody;} catch(X){ /* No error here, no need to report */ }
			this.responseType = this._impl.responseType;
			try {this.responseXML = this._impl.responseXML;} catch(X){ /* No error here, there may not be a responseXML */ }
			try {this.status = this._impl.status;} catch(X){ /* No error here, there may not be a status */ }
			try {this.statusText = this._impl.statusText;} catch(X){ /* No error here, there may not be a statusText */ }
		};
		return this;
	};
		/**
		 * private static function _factory
		 * produces implementations for
		 * CORS (Cross Origin Resource Sharing) for HTML5 and IE10 (not IE8-9)
		 * XDomainRequest for (IE8-9)
		 * and legacy support for non-HTML5 browsers.
		 */
		XMLHttpRequestFacade._factory = function() {
			if (typeof window.XMLHttpRequestOriginal != "undefined") {
				var impl = new XMLHttpRequestOriginal();
				if ("withCredentials" in impl){
					impl.setOnLoad=function(handler){
						this.onload = handler;
					};
					impl.setOnError=function(handler){
						this.onerror = handler;
					};
				}
				/**
				 * XDomainRequest - is an IE8 and IE9 implementation of cross origin resource sharing
				 * It allows for AJAX calls across domains
				 * ALERT: the XDomainRequest does not work in the following situations:
				 *		*	When the client page is HTTP and the request is HTTPS
				 *		*	When the browser is IE8 and the customer is in private browsing mode.
				 *		For this reason it is being commented out for this release and the code will
				 *	 	fall through and use the legacy "iframe-proxy" approach.
				 * @see http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
				 */
				/* Obviate the use of XDomainRequest due to error in IE8, see above alert
				else if ("XDomainRequest" in window) {
					impl = new XDomainRequest();
					impl.onreadystatechange = null;
					impl.status = 0;
					impl.readyState = XMLHttpRequestFacade.UNSENT;
					impl.statusText = "";
					impl.response = "";
					impl.setOnLoad=function(handler){
						this._onload = handler;
					};
					impl.setOnError=function(handler){
						this._onerror = handler;
					};
					impl.onload = function() {
						var imp = this;
						if (imp.onreadystatechange != null) {
							imp.status = 200;
							imp.readyState = XMLHttpRequestFacade.DONE;
							imp.statusText = "success";
							imp.response = imp.responseText ;
							imp.onreadystatechange(event);
						}
					};
					impl.onerror = impl.ontimeout = function() {
						var imp = this;
						if (imp.onreadystatechange != null) {
							imp.status = 400;
							imp.readyState = XMLHttpRequestFacade.DONE;
							imp.statusText = "failed";
							imp.response = imp.responseText ;
							imp.onreadystatechange(event);
						}
					};
					impl.setRequestHeader=function(headerName, headerValue){};
				}
					// Obviate the use of XDomainRequest due to error in IE8, see above alert (END)
				*/
				else {
					impl = new XMLHttpRequestLegacy();
				}
			} else {
				impl = new XMLHttpRequestLegacy();
			}
			return impl;
		};
	/* Constructor name */
	try {
		window.XMLHttpRequestFacade.name = "XMLHttpRequest";
	} catch(e) {
		/* This is not an error but a quirk in FF */
	}
	window.XMLHttpRequestFacade.DONE = 4;
	window.XMLHttpRequestFacade.LOADING = 3;
	window.XMLHttpRequestFacade.HEADERS_RECEIVED = 2;
	window.XMLHttpRequestFacade.OPENED = 1;
	window.XMLHttpRequestFacade.UNSENT = 0;
	window.XMLHttpRequestFacade.defaultServerDomain = null;
	window.XMLHttpRequestFacade.defaultServerProtocol = "";
	window.XMLHttpRequestFacade.jsessionid = "";
	window.XMLHttpRequestFacade.FACADE = true;  // Flag used to detect whether XMLHttpRequest is our facade or original request
	window.XMLHttpRequestLegacy.serverMap = {};
	window.XMLHttpRequestLegacy.serverMap["forms.inq.com"]="//forms.inq.com/xhr/xhrProxy.html";
	window.XMLHttpRequestLegacy.serverMap["formsv3.inq.com"]="//formsv3.inq.com/xhr/xhrProxy.html";
	window.XMLHttpRequestLegacy.DEFAULT_SERVER = "/xhr/xhrProxy.html";
	/**  getFrameSource - look up the correct iframe proxy given the domain
	  *    if the domain is not in the table use the default domain path concatinated to the domain
	  *  @param domain the domain of the destination server
	  *  @returns the proxy-iframe source for the server
	  */
	window.XMLHttpRequestLegacy.getFrameSource = function(domain){
		var frameSrc = window.XMLHttpRequestLegacy.serverMap[domain];
		if (frameSrc == null) {
			frameSrc = "//" + domain + window.XMLHttpRequestLegacy.DEFAULT_SERVER;
		}
		return frameSrc;
	};
	
	/* Override XMLHttpRequest with facade */
	window.XMLHttpRequest = window.XMLHttpRequestFacade;
})();
/**
 *   A wrapper object of log4javascript serves what IJSF needs for console and remote logging.
 */

/* Used to indicate ajax is enabled, For now no ajax, no log4javascript */
var isLog4TcSupported = true;
var log4tc = (function () {

	/**
	 * Copyright 2013 Tim Down.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/**
	 * log4javascript
	 *
	 * log4javascript is a logging framework for JavaScript based on log4j
	 * for Java. This file contains all core log4javascript code and is the only
	 * file required to use log4javascript, unless you require support for
	 * document.domain, in which case you will also need console.html, which must be
	 * stored in the same directory as the main log4javascript.js file.
	 *
	 * Author: Tim Down <tim@log4javascript.org>
	 * Version: 1.4.6
	 * Edition: log4javascript_production
	 * Build date: 19 March 2013
	 * Website: http://log4javascript.org
	 */

	/* -------------------------------------------------------------------------- */
// Array-related stuff

// Next three methods are solely for IE5, which is missing them
	if (!Array.prototype.push) {
		Array.prototype.push = function () {
			for (var i = 0, len = arguments.length; i < len; i++) {
				this[this.length] = arguments[i];
			}
			return this.length;
		};
	}

	if (!Array.prototype.shift) {
		Array.prototype.shift = function () {
			if (this.length > 0) {
				var firstItem = this[0];
				for (var i = 0, len = this.length - 1; i < len; i++) {
					this[i] = this[i + 1];
				}
				this.length = this.length - 1;
				return firstItem;
			}
		};
	}

	if (!Array.prototype.splice) {
		Array.prototype.splice = function (startIndex, deleteCount) {
			var itemsAfterDeleted = this.slice(startIndex + deleteCount);
			var itemsDeleted = this.slice(startIndex, startIndex + deleteCount);
			this.length = startIndex;
			// Copy the arguments into a proper Array object
			var argumentsArray = [];
			for (var i = 0, len = arguments.length; i < len; i++) {
				argumentsArray[i] = arguments[i];
			}
			var itemsToAppend = (argumentsArray.length > 2) ?
				itemsAfterDeleted = argumentsArray.slice(2).concat(itemsAfterDeleted) : itemsAfterDeleted;
			for (i = 0, len = itemsToAppend.length; i < len; i++) {
				this.push(itemsToAppend[i]);
			}
			return itemsDeleted;
		};
	}

	/* -------------------------------------------------------------------------- */

	var log4javascript = (function () {

		function isUndefined(obj) {
			return typeof obj == "undefined";
		}

		/* ---------------------------------------------------------------------- */
		// Custom event support

		function EventSupport() {
		}

		EventSupport.prototype = {
			eventTypes: [],
			eventListeners: {},
			setEventTypes: function (eventTypesParam) {
				if (eventTypesParam instanceof Array) {
					this.eventTypes = eventTypesParam;
					this.eventListeners = {};
					for (var i = 0, len = this.eventTypes.length; i < len; i++) {
						this.eventListeners[this.eventTypes[i]] = [];
					}
				} else {
					handleError("log4javascript.EventSupport [" + this + "]: setEventTypes: eventTypes parameter must be an Array");
				}
			},

			addEventListener: function (eventType, listener) {
				if (typeof listener == "function") {
					if (!array_contains(this.eventTypes, eventType)) {
						handleError("log4javascript.EventSupport [" + this + "]: addEventListener: no event called '" + eventType + "'");
					}
					this.eventListeners[eventType].push(listener);
				} else {
					handleError("log4javascript.EventSupport [" + this + "]: addEventListener: listener must be a function");
				}
			},

			removeEventListener: function (eventType, listener) {
				if (typeof listener == "function") {
					if (!array_contains(this.eventTypes, eventType)) {
						handleError("log4javascript.EventSupport [" + this + "]: removeEventListener: no event called '" + eventType + "'");
					}
					array_remove(this.eventListeners[eventType], listener);
				} else {
					handleError("log4javascript.EventSupport [" + this + "]: removeEventListener: listener must be a function");
				}
			},

			dispatchEvent: function (eventType, eventArgs) {
				if (array_contains(this.eventTypes, eventType)) {
					var listeners = this.eventListeners[eventType];
					for (var i = 0, len = listeners.length; i < len; i++) {
						listeners[i](this, eventType, eventArgs);
					}
				} else {
					handleError("log4javascript.EventSupport [" + this + "]: dispatchEvent: no event called '" + eventType + "'");
				}
			}
		};

		/* -------------------------------------------------------------------------- */

		var applicationStartDate = new Date();
		var uniqueId = "log4javascript_" + applicationStartDate.getTime() + "_" +
			Math.floor(Math.random() * 100000000);
		var emptyFunction = function () {
		};
		var newLine = "\r\n";
		var pageLoaded = false;

		// Create main log4javascript object; this will be assigned public properties
		function Log4JavaScript() {
		}

		Log4JavaScript.prototype = new EventSupport();

		log4javascript = new Log4JavaScript();
		log4javascript.version = "1.4.6";
		log4javascript.edition = "log4javascript_production";

		/* -------------------------------------------------------------------------- */
		// Utility functions

		function toStr(obj) {
			if (obj && obj.toString) {
				return obj.toString();
			} else {
				return String(obj);
			}
		}

		function getExceptionMessage(ex) {
			if (ex.message) {
				return ex.message;
			} else if (ex.description) {
				return ex.description;
			} else {
				return toStr(ex);
			}
		}

		// Gets the portion of the URL after the last slash
		function getUrlFileName(url) {
			var lastSlashIndex = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
			return url.substr(lastSlashIndex + 1);
		}

		// Returns a nicely formatted representation of an error
		function getExceptionStringRep(ex) {
			if (ex) {
				var exStr = "Exception: " + getExceptionMessage(ex);
				try {
					if (ex.lineNumber) {
						exStr += " on line number " + ex.lineNumber;
					}
					if (ex.fileName) {
						exStr += " in file " + getUrlFileName(ex.fileName);
					}
				} catch (localEx) {
					logLog.warn("Unable to obtain file and line information for error");
				}
				if (showStackTraces && ex.stack) {
					exStr += newLine + "Stack trace:" + newLine + ex.stack;
				}
				return exStr;
			}
			return null;
		}

		function bool(obj) {
			return Boolean(obj);
		}

		function trim(str) {
			return str.replace(/^\s+/, "").replace(/\s+$/, "");
		}

		function splitIntoLines(text) {
			// Ensure all line breaks are \n only
			var text2 = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
			return text2.split("\n");
		}

		var urlEncode = (typeof window.encodeURIComponent != "undefined") ?
			function (str) {
				return encodeURIComponent(str);
			} :
			function (str) {
				return escape(str).replace(/\+/g, "%2B").replace(/"/g, "%22").replace(/'/g, "%27").replace(/\//g, "%2F").replace(/=/g, "%3D");
			};

		var urlDecode = (typeof window.decodeURIComponent != "undefined") ?
			function (str) {
				return decodeURIComponent(str);
			} :
			function (str) {
				return unescape(str).replace(/%2B/g, "+").replace(/%22/g, "\"").replace(/%27/g, "'").replace(/%2F/g, "/").replace(/%3D/g, "=");
			};

		function array_remove(arr, val) {
			var index = -1;
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i] === val) {
					index = i;
					break;
				}
			}
			if (index >= 0) {
				arr.splice(index, 1);
				return true;
			} else {
				return false;
			}
		}

		function array_contains(arr, val) {
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i] == val) {
					return true;
				}
			}
			return false;
		}

		function extractBooleanFromParam(param, defaultValue) {
			if (isUndefined(param)) {
				return defaultValue;
			} else {
				return bool(param);
			}
		}

		function extractStringFromParam(param, defaultValue) {
			if (isUndefined(param)) {
				return defaultValue;
			} else {
				return String(param);
			}
		}

		function extractIntFromParam(param, defaultValue) {
			if (isUndefined(param)) {
				return defaultValue;
			} else {
				try {
					var value = parseInt(param, 10);
					return isNaN(value) ? defaultValue : value;
				} catch (ex) {
					logLog.warn("Invalid int param " + param, ex);
					return defaultValue;
				}
			}
		}

		function extractFunctionFromParam(param, defaultValue) {
			if (typeof param == "function") {
				return param;
			} else {
				return defaultValue;
			}
		}

		function isError(err) {
			return (err instanceof Error);
		}

		if (!Function.prototype.apply) {
			Function.prototype.apply = function (obj, args) {
				var methodName = "__apply__";
				if (typeof obj[methodName] != "undefined") {
					methodName += String(Math.random()).substr(2);
				}
				obj[methodName] = this;

				var argsStrings = [];
				for (var i = 0, len = args.length; i < len; i++) {
					argsStrings[i] = "args[" + i + "]";
				}
				var script = "obj." + methodName + "(" + argsStrings.join(",") + ")";
				var returnValue = eval(script);
				delete obj[methodName];
				return returnValue;
			};
		}

		if (!Function.prototype.call) {
			Function.prototype.call = function (obj) {
				var args = [];
				for (var i = 1, len = arguments.length; i < len; i++) {
					args[i - 1] = arguments[i];
				}
				return this.apply(obj, args);
			};
		}

		function getListenersPropertyName(eventName) {
			return "__log4javascript_listeners__" + eventName;
		}

		function addEvent(node, eventName, listener, useCapture, win) {
			win = win ? win : window;
			if (node.addEventListener) {
				node.addEventListener(eventName, listener, useCapture);
			} else if (node.attachEvent) {
				node.attachEvent("on" + eventName, listener);
			} else {
				var propertyName = getListenersPropertyName(eventName);
				if (!node[propertyName]) {
					node[propertyName] = [];
					// Set event handler
					node["on" + eventName] = function (evt) {
						evt = getEvent(evt, win);
						var listenersPropertyName = getListenersPropertyName(eventName);

						// Clone the array of listeners to leave the original untouched
						var listeners = this[listenersPropertyName].concat([]);
						var currentListener;

						// Call each listener in turn
						while ((currentListener = listeners.shift())) {
							currentListener.call(this, evt);
						}
					};
				}
				node[propertyName].push(listener);
			}
		}

		function removeEvent(node, eventName, listener, useCapture) {
			if (node.removeEventListener) {
				node.removeEventListener(eventName, listener, useCapture);
			} else if (node.detachEvent) {
				node.detachEvent("on" + eventName, listener);
			} else {
				var propertyName = getListenersPropertyName(eventName);
				if (node[propertyName]) {
					array_remove(node[propertyName], listener);
				}
			}
		}

		function getEvent(evt, win) {
			win = win ? win : window;
			return evt ? evt : win.event;
		}

		function stopEventPropagation(evt) {
			if (evt.stopPropagation) {
				evt.stopPropagation();
			} else if (typeof evt.cancelBubble != "undefined") {
				evt.cancelBubble = true;
			}
			evt.returnValue = false;
		}

		/* ---------------------------------------------------------------------- */
		// Simple logging for log4javascript itself

		var logLog = {
			quietMode: false,

			debugMessages: [],

			setQuietMode: function (quietMode) {
				this.quietMode = bool(quietMode);
			},

			numberOfErrors: 0,

			alertAllErrors: false,

			setAlertAllErrors: function (alertAllErrors) {
				this.alertAllErrors = alertAllErrors;
			},

			debug: function (message) {
				this.debugMessages.push(message);
			},

			displayDebug: function () {
				alert(this.debugMessages.join(newLine));
			},

			warn: function (message, exception) {
			},

			error: function (message, exception) {
				/* TODO DL - Cannot Alert to user for log failure
				 if (++this.numberOfErrors == 1 || this.alertAllErrors) {
				 if (!this.quietMode) {
				 var alertMessage = "log4javascript error: " + message;
				 if (exception) {
				 alertMessage += newLine + newLine + "Original error: " + getExceptionStringRep(exception);
				 }
				 alert(alertMessage);
				 }
				 }
				 */
			}
		};
		log4javascript.logLog = logLog;

		log4javascript.setEventTypes(["load", "error"]);

		function handleError(message, exception) {
			logLog.error(message, exception);
			log4javascript.dispatchEvent("error", { "message": message, "exception": exception });
		}

		log4javascript.handleError = handleError;

		/* ---------------------------------------------------------------------- */

		var enabled = !((typeof log4javascript_disabled != "undefined") &&
			log4javascript_disabled);

		log4javascript.setEnabled = function (enable) {
			enabled = bool(enable);
		};

		log4javascript.isEnabled = function () {
			return enabled;
		};

		var useTimeStampsInMilliseconds = true;

		log4javascript.setTimeStampsInMilliseconds = function (timeStampsInMilliseconds) {
			useTimeStampsInMilliseconds = bool(timeStampsInMilliseconds);
		};

		log4javascript.isTimeStampsInMilliseconds = function () {
			return useTimeStampsInMilliseconds;
		};


		// This evaluates the given expression in the current scope, thus allowing
		// scripts to access private variables. Particularly useful for testing
		log4javascript.evalInScope = function (expr) {
			return eval(expr);
		};

		var showStackTraces = false;

		log4javascript.setShowStackTraces = function (show) {
			showStackTraces = bool(show);
		};

		/* ---------------------------------------------------------------------- */
		// Levels

		var Level = function (level, name) {
			this.level = level;
			this.name = name;
		};

		Level.prototype = {
			toString: function () {
				return this.name;
			},
			equals: function (level) {
				return this.level == level.level;
			},
			isGreaterOrEqual: function (level) {
				return this.level >= level.level;
			}
		};

		Level.ALL = new Level(Number.MIN_VALUE, "ALL");
		Level.TRACE = new Level(10000, "TRACE");
		Level.DEBUG = new Level(20000, "DEBUG");
		Level.INFO = new Level(30000, "INFO");
		Level.WARN = new Level(40000, "WARN");
		Level.ERROR = new Level(50000, "ERROR");
		Level.FATAL = new Level(60000, "FATAL");
		Level.OFF = new Level(Number.MAX_VALUE, "OFF");

		log4javascript.Level = Level;

		/* ---------------------------------------------------------------------- */
		// Timers

		function Timer(name, level) {
			this.name = name;
			this.level = isUndefined(level) ? Level.INFO : level;
			this.start = new Date();
		}

		Timer.prototype.getElapsedTime = function () {
			return new Date().getTime() - this.start.getTime();
		};

		/* ---------------------------------------------------------------------- */
		// Loggers

		var anonymousLoggerName = "[anonymous]";
		var defaultLoggerName = "[default]";
		var nullLoggerName = "[null]";
		var rootLoggerName = "root";

		function Logger(name) {
			this.name = name;
			this.parent = null;
			this.children = [];

			var appenders = [];
			var loggerLevel = null;
			var isRoot = (this.name === rootLoggerName);
			var isNull = (this.name === nullLoggerName);

			var appenderCache = null;
			var appenderCacheInvalidated = false;

			this.addChild = function (childLogger) {
				this.children.push(childLogger);
				childLogger.parent = this;
				childLogger.invalidateAppenderCache();
			};

			// Additivity
			var additive = true;
			this.getAdditivity = function () {
				return additive;
			};

			this.setAdditivity = function (additivity) {
				var valueChanged = (additive != additivity);
				additive = additivity;
				if (valueChanged) {
					this.invalidateAppenderCache();
				}
			};

			// Create methods that use the appenders variable in this scope
			this.addAppender = function (appender) {
				if (isNull) {
					handleError("Logger.addAppender: you may not add an appender to the null logger");
				} else {
					if (appender instanceof log4javascript.Appender) {
						if (!array_contains(appenders, appender)) {
							appenders.push(appender);
							appender.setAddedToLogger(this);
							this.invalidateAppenderCache();
						}
					} else {
						handleError("Logger.addAppender: appender supplied ('" +
							toStr(appender) + "') is not a subclass of Appender");
					}
				}
			};

			this.removeAppender = function (appender) {
				array_remove(appenders, appender);
				appender.setRemovedFromLogger(this);
				this.invalidateAppenderCache();
			};

			this.removeAllAppenders = function () {
				var appenderCount = appenders.length;
				if (appenderCount > 0) {
					for (var i = 0; i < appenderCount; i++) {
						appenders[i].setRemovedFromLogger(this);
					}
					appenders.length = 0;
					this.invalidateAppenderCache();
				}
			};

			this.getEffectiveAppenders = function () {
				if (appenderCache === null || appenderCacheInvalidated) {
					// Build appender cache
					var parentEffectiveAppenders = (isRoot || !this.getAdditivity()) ?
						[] : this.parent.getEffectiveAppenders();
					appenderCache = parentEffectiveAppenders.concat(appenders);
					appenderCacheInvalidated = false;
				}
				return appenderCache;
			};

			this.invalidateAppenderCache = function () {
				appenderCacheInvalidated = true;
				for (var i = 0, len = this.children.length; i < len; i++) {
					this.children[i].invalidateAppenderCache();
				}
			};

			this.log = function (level, params) {
				if (enabled && level.isGreaterOrEqual(this.getEffectiveLevel())) {
					// Check whether last param is an exception
					var exception;
					var finalParamIndex = params.length - 1;
					var lastParam = params[finalParamIndex];
					if (params.length > 1 && isError(lastParam)) {
						exception = lastParam;
						finalParamIndex--;
					}

					// Construct genuine array for the params
					var messages = [];
					for (var i = 0; i <= finalParamIndex; i++) {
						messages[i] = params[i];
					}

					var loggingEvent = new LoggingEvent(
						this, new Date(), level, messages, exception);

					this.callAppenders(loggingEvent);
				}
			};

			this.callAppenders = function (loggingEvent) {
				var effectiveAppenders = this.getEffectiveAppenders();
				for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
					effectiveAppenders[i].doAppend(loggingEvent);
				}
			};

			this.setLevel = function (level) {
				// Having a level of null on the root logger would be very bad.
				if (isRoot && level === null) {
					handleError("Logger.setLevel: you cannot set the level of the root logger to null");
				} else if (level instanceof Level) {
					loggerLevel = level;
				} else {
					handleError("Logger.setLevel: level supplied to logger " +
						this.name + " is not an instance of log4javascript.Level");
				}
			};

			this.getLevel = function () {
				return loggerLevel;
			};

			this.getEffectiveLevel = function () {
				for (var logger = this; logger !== null; logger = logger.parent) {
					var level = logger.getLevel();
					if (level !== null) {
						return level;
					}
				}
			};

			this.group = function (name, initiallyExpanded) {
				if (enabled) {
					var effectiveAppenders = this.getEffectiveAppenders();
					for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
						effectiveAppenders[i].group(name, initiallyExpanded);
					}
				}
			};

			this.groupEnd = function () {
				if (enabled) {
					var effectiveAppenders = this.getEffectiveAppenders();
					for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
						effectiveAppenders[i].groupEnd();
					}
				}
			};

			var timers = {};

			this.time = function (name, level) {
				if (enabled) {
					if (isUndefined(name)) {
						handleError("Logger.time: a name for the timer must be supplied");
					} else if (level && !(level instanceof Level)) {
						handleError("Logger.time: level supplied to timer " +
							name + " is not an instance of log4javascript.Level");
					} else {
						timers[name] = new Timer(name, level);
					}
				}
			};

			this.timeEnd = function (name) {
				if (enabled) {
					if (isUndefined(name)) {
						handleError("Logger.timeEnd: a name for the timer must be supplied");
					} else if (timers[name]) {
						var timer = timers[name];
						var milliseconds = timer.getElapsedTime();
						this.log(timer.level, ["Timer " + toStr(name) + " completed in " + milliseconds + "ms"]);
						delete timers[name];
					} else {
						logLog.warn("Logger.timeEnd: no timer found with name " + name);
					}
				}
			};

			this.assert = function (expr) {
				if (enabled && !expr) {
					var args = [];
					for (var i = 1, len = arguments.length; i < len; i++) {
						args.push(arguments[i]);
					}
					args = (args.length > 0) ? args : ["Assertion Failure"];
					args.push(newLine);
					args.push(expr);
					this.log(Level.ERROR, args);
				}
			};

			this.toString = function () {
				return "Logger[" + this.name + "]";
			};
		}

		Logger.prototype = {
			trace: function () {
				this.log(Level.TRACE, arguments);
			},

			debug: function () {
				this.log(Level.DEBUG, arguments);
			},

			info: function () {
				this.log(Level.INFO, arguments);
			},

			warn: function () {
				this.log(Level.WARN, arguments);
			},

			error: function () {
				this.log(Level.ERROR, arguments);
			},

			fatal: function () {
				this.log(Level.FATAL, arguments);
			},

			isEnabledFor: function (level) {
				return level.isGreaterOrEqual(this.getEffectiveLevel());
			},

			isTraceEnabled: function () {
				return this.isEnabledFor(Level.TRACE);
			},

			isDebugEnabled: function () {
				return this.isEnabledFor(Level.DEBUG);
			},

			isInfoEnabled: function () {
				return this.isEnabledFor(Level.INFO);
			},

			isWarnEnabled: function () {
				return this.isEnabledFor(Level.WARN);
			},

			isErrorEnabled: function () {
				return this.isEnabledFor(Level.ERROR);
			},

			isFatalEnabled: function () {
				return this.isEnabledFor(Level.FATAL);
			}
		};

		Logger.prototype.trace.isEntryPoint = true;
		Logger.prototype.debug.isEntryPoint = true;
		Logger.prototype.info.isEntryPoint = true;
		Logger.prototype.warn.isEntryPoint = true;
		Logger.prototype.error.isEntryPoint = true;
		Logger.prototype.fatal.isEntryPoint = true;

		/* ---------------------------------------------------------------------- */
		// Logger access methods

		// Hashtable of loggers keyed by logger name
		var loggers = {};
		var loggerNames = [];

		var ROOT_LOGGER_DEFAULT_LEVEL = Level.DEBUG;
		var rootLogger = new Logger(rootLoggerName);
		rootLogger.setLevel(ROOT_LOGGER_DEFAULT_LEVEL);

		log4javascript.getRootLogger = function () {
			return rootLogger;
		};

		log4javascript.getLogger = function (loggerName) {
			// Use default logger if loggerName is not specified or invalid
			if (!(typeof loggerName == "string")) {
				loggerName = anonymousLoggerName;
				logLog.warn("log4javascript.getLogger: non-string logger name " +
					toStr(loggerName) + " supplied, returning anonymous logger");
			}

			// Do not allow retrieval of the root logger by name
			if (loggerName == rootLoggerName) {
				handleError("log4javascript.getLogger: root logger may not be obtained by name");
			}

			// Create the logger for this name if it doesn't already exist
			if (!loggers[loggerName]) {
				var logger = new Logger(loggerName);
				loggers[loggerName] = logger;
				loggerNames.push(loggerName);

				// Set up parent logger, if it doesn't exist
				var lastDotIndex = loggerName.lastIndexOf(".");
				var parentLogger;
				if (lastDotIndex > -1) {
					var parentLoggerName = loggerName.substring(0, lastDotIndex);
					parentLogger = log4javascript.getLogger(parentLoggerName); // Recursively sets up grandparents etc.
				} else {
					parentLogger = rootLogger;
				}
				parentLogger.addChild(logger);
			}
			return loggers[loggerName];
		};

		var defaultLogger = null;
		log4javascript.getDefaultLogger = function () {
			if (!defaultLogger) {
				defaultLogger = log4javascript.getLogger(defaultLoggerName);
				var a = new log4javascript.PopUpAppender();
				defaultLogger.addAppender(a);
			}
			return defaultLogger;
		};

		var nullLogger = null;
		log4javascript.getNullLogger = function () {
			if (!nullLogger) {
				nullLogger = new Logger(nullLoggerName);
				nullLogger.setLevel(Level.OFF);
			}
			return nullLogger;
		};

		// Destroys all loggers
		log4javascript.resetConfiguration = function () {
			rootLogger.setLevel(ROOT_LOGGER_DEFAULT_LEVEL);
			loggers = {};
		};

		/* ---------------------------------------------------------------------- */
		// Logging events

		var LoggingEvent = function (logger, timeStamp, level, messages, exception) {
			this.logger = logger;
			this.timeStamp = timeStamp;
			this.timeStampInMilliseconds = timeStamp.getTime();
			this.timeStampInSeconds = Math.floor(this.timeStampInMilliseconds / 1000);
			this.milliseconds = this.timeStamp.getMilliseconds();
			this.level = level;
			this.messages = messages;
			this.exception = exception;
		};

		LoggingEvent.prototype = {
			getThrowableStrRep: function () {
				return this.exception ?
					getExceptionStringRep(this.exception) : "";
			},
			getCombinedMessages: function () {
				return (this.messages.length == 1) ? this.messages[0] :
					this.messages.join(newLine);
			},
			toString: function () {
				return "LoggingEvent[" + this.level + "]";
			}
		};

		log4javascript.LoggingEvent = LoggingEvent;

		/* ---------------------------------------------------------------------- */
		// Layout prototype

		var Layout = function () {
		};

		Layout.prototype = {
			defaults: {
				loggerKey: "logger",
				timeStampKey: "timestamp",
				millisecondsKey: "milliseconds",
				levelKey: "level",
				messageKey: "message",
				exceptionKey: "exception",
				urlKey: "url"
			},
			loggerKey: "logger",
			timeStampKey: "timestamp",
			millisecondsKey: "milliseconds",
			levelKey: "level",
			messageKey: "message",
			exceptionKey: "exception",
			urlKey: "url",
			batchHeader: "",
			batchFooter: "",
			batchSeparator: "",
			returnsPostData: false,
			overrideTimeStampsSetting: false,
			useTimeStampsInMilliseconds: null,

			format: function () {
				handleError("Layout.format: layout supplied has no format() method");
			},

			ignoresThrowable: function () {
				handleError("Layout.ignoresThrowable: layout supplied has no ignoresThrowable() method");
			},

			getContentType: function () {
				return "text/plain";
			},

			allowBatching: function () {
				return true;
			},

			setTimeStampsInMilliseconds: function (timeStampsInMilliseconds) {
				this.overrideTimeStampsSetting = true;
				this.useTimeStampsInMilliseconds = bool(timeStampsInMilliseconds);
			},

			isTimeStampsInMilliseconds: function () {
				return this.overrideTimeStampsSetting ?
					this.useTimeStampsInMilliseconds : useTimeStampsInMilliseconds;
			},

			getTimeStampValue: function (loggingEvent) {
				return this.isTimeStampsInMilliseconds() ?
					loggingEvent.timeStampInMilliseconds : loggingEvent.timeStampInSeconds;
			},

			getDataValues: function (loggingEvent, combineMessages) {
				var dataValues = [
					[this.loggerKey, loggingEvent.logger.name],
					[this.timeStampKey, this.getTimeStampValue(loggingEvent)],
					[this.levelKey, loggingEvent.level.name],
					[this.urlKey, window.location.href],
					[this.messageKey, combineMessages ? loggingEvent.getCombinedMessages() : loggingEvent.messages]
				];
				if (!this.isTimeStampsInMilliseconds()) {
					dataValues.push([this.millisecondsKey, loggingEvent.milliseconds]);
				}
				if (loggingEvent.exception) {
					dataValues.push([this.exceptionKey, getExceptionStringRep(loggingEvent.exception)]);
				}
				if (this.hasCustomFields()) {
					for (var i = 0, len = this.customFields.length; i < len; i++) {
						var val = this.customFields[i].value;

						// Check if the value is a function. If so, execute it, passing it the
						// current layout and the logging event
						if (typeof val === "function") {
							val = val(this, loggingEvent);
						}
						dataValues.push([this.customFields[i].name, val]);
					}
				}
				return dataValues;
			},

			setKeys: function (loggerKey, timeStampKey, levelKey, messageKey, exceptionKey, urlKey, millisecondsKey) {
				this.loggerKey = extractStringFromParam(loggerKey, this.defaults.loggerKey);
				this.timeStampKey = extractStringFromParam(timeStampKey, this.defaults.timeStampKey);
				this.levelKey = extractStringFromParam(levelKey, this.defaults.levelKey);
				this.messageKey = extractStringFromParam(messageKey, this.defaults.messageKey);
				this.exceptionKey = extractStringFromParam(exceptionKey, this.defaults.exceptionKey);
				this.urlKey = extractStringFromParam(urlKey, this.defaults.urlKey);
				this.millisecondsKey = extractStringFromParam(millisecondsKey, this.defaults.millisecondsKey);
			},

			setCustomField: function (name, value) {
				var fieldUpdated = false;
				for (var i = 0, len = this.customFields.length; i < len; i++) {
					if (this.customFields[i].name === name) {
						this.customFields[i].value = value;
						fieldUpdated = true;
					}
				}
				if (!fieldUpdated) {
					this.customFields.push({"name": name, "value": value});
				}
			},

			hasCustomFields: function () {
				return (this.customFields.length > 0);
			},

			toString: function () {
				handleError("Layout.toString: all layouts must override this method");
			}
		};

		log4javascript.Layout = Layout;

		/* ---------------------------------------------------------------------- */
		// Appender prototype

		var Appender = function () {
		};

		Appender.prototype = new EventSupport();

		Appender.prototype.layout = new PatternLayout();
		Appender.prototype.threshold = Level.ALL;
		Appender.prototype.loggers = [];

		// Performs threshold checks before delegating actual logging to the
		// subclass's specific append method.
		Appender.prototype.doAppend = function (loggingEvent) {
			if (enabled && loggingEvent.level.level >= this.threshold.level) {
				this.append(loggingEvent);
			}
		};

		Appender.prototype.append = function (loggingEvent) {
		};

		Appender.prototype.setLayout = function (layout) {
			if (layout instanceof Layout) {
				this.layout = layout;
			} else {
				handleError("Appender.setLayout: layout supplied to " +
					this.toString() + " is not a subclass of Layout");
			}
		};

		Appender.prototype.getLayout = function () {
			return this.layout;
		};

		Appender.prototype.setThreshold = function (threshold) {
			if (threshold instanceof Level) {
				this.threshold = threshold;
			} else {
				handleError("Appender.setThreshold: threshold supplied to " +
					this.toString() + " is not a subclass of Level");
			}
		};

		Appender.prototype.getThreshold = function () {
			return this.threshold;
		};

		Appender.prototype.setAddedToLogger = function (logger) {
			this.loggers.push(logger);
		};

		Appender.prototype.setRemovedFromLogger = function (logger) {
			array_remove(this.loggers, logger);
		};

		Appender.prototype.group = emptyFunction;
		Appender.prototype.groupEnd = emptyFunction;

		Appender.prototype.toString = function () {
			handleError("Appender.toString: all appenders must override this method");
		};

		log4javascript.Appender = Appender;

		/* ---------------------------------------------------------------------- */
		// SimpleLayout

		function SimpleLayout() {
			this.customFields = [];
		}

		SimpleLayout.prototype = new Layout();

		SimpleLayout.prototype.format = function (loggingEvent) {
			return loggingEvent.level.name + " - " + loggingEvent.getCombinedMessages();
		};

		SimpleLayout.prototype.ignoresThrowable = function () {
			return true;
		};

		SimpleLayout.prototype.toString = function () {
			return "SimpleLayout";
		};

		log4javascript.SimpleLayout = SimpleLayout;
		/* ----------------------------------------------------------------------- */
		// NullLayout

		function NullLayout() {
			this.customFields = [];
		}

		NullLayout.prototype = new Layout();

		NullLayout.prototype.format = function (loggingEvent) {
			return loggingEvent.messages;
		};

		NullLayout.prototype.ignoresThrowable = function () {
			return true;
		};

		NullLayout.prototype.toString = function () {
			return "NullLayout";
		};

		log4javascript.NullLayout = NullLayout;
		/* ---------------------------------------------------------------------- */
		// XmlLayout

		function XmlLayout(combineMessages) {
			this.combineMessages = extractBooleanFromParam(combineMessages, true);
			this.customFields = [];
		}

		XmlLayout.prototype = new Layout();

		XmlLayout.prototype.isCombinedMessages = function () {
			return this.combineMessages;
		};

		XmlLayout.prototype.getContentType = function () {
			return "text/xml";
		};

		XmlLayout.prototype.escapeCdata = function (str) {
			return str.replace(/\]\]>/, "]]>]]&gt;<![CDATA[");
		};

		XmlLayout.prototype.format = function (loggingEvent) {
			var layout = this;
			var i, len;

			function formatMessage(message) {
				message = (typeof message === "string") ? message : toStr(message);
				return "<log4javascript:message><![CDATA[" +
					layout.escapeCdata(message) + "]]></log4javascript:message>";
			}

			var str = "<log4javascript:event logger=\"" + loggingEvent.logger.name +
				"\" timestamp=\"" + this.getTimeStampValue(loggingEvent) + "\"";
			if (!this.isTimeStampsInMilliseconds()) {
				str += " milliseconds=\"" + loggingEvent.milliseconds + "\"";
			}
			str += " level=\"" + loggingEvent.level.name + "\">" + newLine;
			if (this.combineMessages) {
				str += formatMessage(loggingEvent.getCombinedMessages());
			} else {
				str += "<log4javascript:messages>" + newLine;
				for (i = 0, len = loggingEvent.messages.length; i < len; i++) {
					str += formatMessage(loggingEvent.messages[i]) + newLine;
				}
				str += "</log4javascript:messages>" + newLine;
			}
			if (this.hasCustomFields()) {
				for (i = 0, len = this.customFields.length; i < len; i++) {
					str += "<log4javascript:customfield name=\"" +
						this.customFields[i].name + "\"><![CDATA[" +
						this.customFields[i].value.toString() +
						"]]></log4javascript:customfield>" + newLine;
				}
			}
			if (loggingEvent.exception) {
				str += "<log4javascript:exception><![CDATA[" +
					getExceptionStringRep(loggingEvent.exception) +
					"]]></log4javascript:exception>" + newLine;
			}
			str += "</log4javascript:event>" + newLine + newLine;
			return str;
		};

		XmlLayout.prototype.ignoresThrowable = function () {
			return false;
		};

		XmlLayout.prototype.toString = function () {
			return "XmlLayout";
		};

		log4javascript.XmlLayout = XmlLayout;
		/* ---------------------------------------------------------------------- */
		// JsonLayout related

		function escapeNewLines(str) {
			return str.replace(/\r\n|\r|\n/g, "\\r\\n");
		}

		function JsonLayout(readable, combineMessages) {
			this.readable = extractBooleanFromParam(readable, false);
			this.combineMessages = extractBooleanFromParam(combineMessages, true);
			this.batchHeader = this.readable ? "[" + newLine : "[";
			this.batchFooter = this.readable ? "]" + newLine : "]";
			this.batchSeparator = this.readable ? "," + newLine : ",";
			this.setKeys();
			this.colon = this.readable ? ": " : ":";
			this.tab = this.readable ? "\t" : "";
			this.lineBreak = this.readable ? newLine : "";
			this.customFields = [];
		}

		/* ---------------------------------------------------------------------- */
		// JsonLayout

		JsonLayout.prototype = new Layout();

		JsonLayout.prototype.isReadable = function () {
			return this.readable;
		};

		JsonLayout.prototype.isCombinedMessages = function () {
			return this.combineMessages;
		};

		JsonLayout.prototype.format = function (loggingEvent) {
			var layout = this;
			var dataValues = this.getDataValues(loggingEvent, this.combineMessages);
			var str = "{" + this.lineBreak;
			var i, len;

			function formatValue(val, prefix, expand) {
				// Check the type of the data value to decide whether quotation marks
				// or expansion are required
				var formattedValue;
				var valType = typeof val;
				if (val instanceof Date) {
					formattedValue = String(val.getTime());
				} else if (expand && (val instanceof Array)) {
					formattedValue = "[" + layout.lineBreak;
					for (var i = 0, len = val.length; i < len; i++) {
						var childPrefix = prefix + layout.tab;
						formattedValue += childPrefix + formatValue(val[i], childPrefix, false);
						if (i < val.length - 1) {
							formattedValue += ",";
						}
						formattedValue += layout.lineBreak;
					}
					formattedValue += prefix + "]";
				} else if (valType !== "number" && valType !== "boolean") {
					formattedValue = "\"" + escapeNewLines(toStr(val).replace(/\"/g, "\\\"")) + "\"";
				} else {
					formattedValue = val;
				}
				return formattedValue;
			}

			for (i = 0, len = dataValues.length - 1; i <= len; i++) {
				str += this.tab + "\"" + dataValues[i][0] + "\"" + this.colon + formatValue(dataValues[i][1], this.tab, true);
				if (i < len) {
					str += ",";
				}
				str += this.lineBreak;
			}

			str += "}" + this.lineBreak;
			return str;
		};

		JsonLayout.prototype.ignoresThrowable = function () {
			return false;
		};

		JsonLayout.prototype.toString = function () {
			return "JsonLayout";
		};

		JsonLayout.prototype.getContentType = function () {
			return "application/json";
		};

		log4javascript.JsonLayout = JsonLayout;
		/* ---------------------------------------------------------------------- */
		// HttpPostDataLayout

		function HttpPostDataLayout() {
			this.setKeys();
			this.customFields = [];
			this.returnsPostData = true;
		}

		HttpPostDataLayout.prototype = new Layout();

		// Disable batching
		HttpPostDataLayout.prototype.allowBatching = function () {
			return false;
		};

		HttpPostDataLayout.prototype.format = function (loggingEvent) {
			var dataValues = this.getDataValues(loggingEvent);
			var queryBits = [];
			for (var i = 0, len = dataValues.length; i < len; i++) {
				var val = (dataValues[i][1] instanceof Date) ?
					String(dataValues[i][1].getTime()) : dataValues[i][1];
				queryBits.push(urlEncode(dataValues[i][0]) + "=" + urlEncode(val));
			}
			return queryBits.join("&");
		};

		HttpPostDataLayout.prototype.ignoresThrowable = function (loggingEvent) {
			return false;
		};

		HttpPostDataLayout.prototype.toString = function () {
			return "HttpPostDataLayout";
		};

		log4javascript.HttpPostDataLayout = HttpPostDataLayout;
		/* ---------------------------------------------------------------------- */
		// formatObjectExpansion

		function formatObjectExpansion(obj, depth, indentation) {
			var objectsExpanded = [];

			function doFormat(obj, depth, indentation) {
				var i, j, len, childDepth, childIndentation, childLines, expansion,
					childExpansion;

				if (!indentation) {
					indentation = "";
				}

				function formatString(text) {
					var lines = splitIntoLines(text);
					for (var j = 1, jLen = lines.length; j < jLen; j++) {
						lines[j] = indentation + lines[j];
					}
					return lines.join(newLine);
				}

				if (obj === null) {
					return "null";
				} else if (typeof obj == "undefined") {
					return "undefined";
				} else if (typeof obj == "string") {
					return formatString(obj);
				} else if (typeof obj == "object" && array_contains(objectsExpanded, obj)) {
					try {
						expansion = toStr(obj);
					} catch (ex) {
						expansion = "Error formatting property. Details: " + getExceptionStringRep(ex);
					}
					return expansion + " [already expanded]";
				} else if ((obj instanceof Array) && depth > 0) {
					objectsExpanded.push(obj);
					expansion = "[" + newLine;
					childDepth = depth - 1;
					childIndentation = indentation + "  ";
					childLines = [];
					for (i = 0, len = obj.length; i < len; i++) {
						try {
							childExpansion = doFormat(obj[i], childDepth, childIndentation);
							childLines.push(childIndentation + childExpansion);
						} catch (ex) {
							childLines.push(childIndentation + "Error formatting array member. Details: " +
								getExceptionStringRep(ex) + "");
						}
					}
					expansion += childLines.join("," + newLine) + newLine + indentation + "]";
					return expansion;
				} else if (Object.prototype.toString.call(obj) == "[object Date]") {
					return obj.toString();
				} else if (typeof obj == "object" && depth > 0) {
					objectsExpanded.push(obj);
					expansion = "{" + newLine;
					childDepth = depth - 1;
					childIndentation = indentation + "  ";
					childLines = [];
					for (i in obj) {
						try {
							childExpansion = doFormat(obj[i], childDepth, childIndentation);
							childLines.push(childIndentation + i + ": " + childExpansion);
						} catch (ex) {
							childLines.push(childIndentation + i + ": Error formatting property. Details: " +
								getExceptionStringRep(ex));
						}
					}
					expansion += childLines.join("," + newLine) + newLine + indentation + "}";
					return expansion;
				} else {
					return formatString(toStr(obj));
				}
			}

			return doFormat(obj, depth, indentation);
		}

		/* ---------------------------------------------------------------------- */
		// Date-related stuff

		var SimpleDateFormat;

		(function () {
			var regex = /('[^']*')|(G+|y+|M+|w+|W+|D+|d+|F+|E+|a+|H+|k+|K+|h+|m+|s+|S+|Z+)|([a-zA-Z]+)|([^a-zA-Z']+)/;
			var monthNames = ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"];
			var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			var TEXT2 = 0, TEXT3 = 1, NUMBER = 2, YEAR = 3, MONTH = 4, TIMEZONE = 5;
			var types = {
				G: TEXT2,
				y: YEAR,
				M: MONTH,
				w: NUMBER,
				W: NUMBER,
				D: NUMBER,
				d: NUMBER,
				F: NUMBER,
				E: TEXT3,
				a: TEXT2,
				H: NUMBER,
				k: NUMBER,
				K: NUMBER,
				h: NUMBER,
				m: NUMBER,
				s: NUMBER,
				S: NUMBER,
				Z: TIMEZONE
			};
			var ONE_DAY = 24 * 60 * 60 * 1000;
			var ONE_WEEK = 7 * ONE_DAY;
			var DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;

			var newDateAtMidnight = function (year, month, day) {
				var d = new Date(year, month, day, 0, 0, 0);
				d.setMilliseconds(0);
				return d;
			};

			Date.prototype.getDifference = function (date) {
				return this.getTime() - date.getTime();
			};

			Date.prototype.isBefore = function (d) {
				return this.getTime() < d.getTime();
			};

			Date.prototype.getUTCTime = function () {
				return Date.UTC(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(),
					this.getSeconds(), this.getMilliseconds());
			};

			Date.prototype.getTimeSince = function (d) {
				return this.getUTCTime() - d.getUTCTime();
			};

			Date.prototype.getPreviousSunday = function () {
				// Using midday avoids any possibility of DST messing things up
				var midday = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 12, 0, 0);
				var previousSunday = new Date(midday.getTime() - this.getDay() * ONE_DAY);
				return newDateAtMidnight(previousSunday.getFullYear(), previousSunday.getMonth(),
					previousSunday.getDate());
			};

			Date.prototype.getWeekInYear = function (minimalDaysInFirstWeek) {
				if (isUndefined(this.minimalDaysInFirstWeek)) {
					minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
				}
				var previousSunday = this.getPreviousSunday();
				var startOfYear = newDateAtMidnight(this.getFullYear(), 0, 1);
				var numberOfSundays = previousSunday.isBefore(startOfYear) ?
					0 : 1 + Math.floor(previousSunday.getTimeSince(startOfYear) / ONE_WEEK);
				var numberOfDaysInFirstWeek = 7 - startOfYear.getDay();
				var weekInYear = numberOfSundays;
				if (numberOfDaysInFirstWeek < minimalDaysInFirstWeek) {
					weekInYear--;
				}
				return weekInYear;
			};

			Date.prototype.getWeekInMonth = function (minimalDaysInFirstWeek) {
				if (isUndefined(this.minimalDaysInFirstWeek)) {
					minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
				}
				var previousSunday = this.getPreviousSunday();
				var startOfMonth = newDateAtMidnight(this.getFullYear(), this.getMonth(), 1);
				var numberOfSundays = previousSunday.isBefore(startOfMonth) ?
					0 : 1 + Math.floor(previousSunday.getTimeSince(startOfMonth) / ONE_WEEK);
				var numberOfDaysInFirstWeek = 7 - startOfMonth.getDay();
				var weekInMonth = numberOfSundays;
				if (numberOfDaysInFirstWeek >= minimalDaysInFirstWeek) {
					weekInMonth++;
				}
				return weekInMonth;
			};

			Date.prototype.getDayInYear = function () {
				var startOfYear = newDateAtMidnight(this.getFullYear(), 0, 1);
				return 1 + Math.floor(this.getTimeSince(startOfYear) / ONE_DAY);
			};

			/* ------------------------------------------------------------------ */

			SimpleDateFormat = function (formatString) {
				this.formatString = formatString;
			};

			/**
			 * Sets the minimum number of days in a week in order for that week to
			 * be considered as belonging to a particular month or year
			 */
			SimpleDateFormat.prototype.setMinimalDaysInFirstWeek = function (days) {
				this.minimalDaysInFirstWeek = days;
			};

			SimpleDateFormat.prototype.getMinimalDaysInFirstWeek = function () {
				return isUndefined(this.minimalDaysInFirstWeek) ?
					DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK : this.minimalDaysInFirstWeek;
			};

			var padWithZeroes = function (str, len) {
				while (str.length < len) {
					str = "0" + str;
				}
				return str;
			};

			var formatText = function (data, numberOfLetters, minLength) {
				return (numberOfLetters >= 4) ? data : data.substr(0, Math.max(minLength, numberOfLetters));
			};

			var formatNumber = function (data, numberOfLetters) {
				var dataString = "" + data;
				// Pad with 0s as necessary
				return padWithZeroes(dataString, numberOfLetters);
			};

			SimpleDateFormat.prototype.format = function (date) {
				var formattedString = "";
				var result;
				var searchString = this.formatString;
				while ((result = regex.exec(searchString))) {
					var quotedString = result[1];
					var patternLetters = result[2];
					var otherLetters = result[3];
					var otherCharacters = result[4];

					// If the pattern matched is quoted string, output the text between the quotes
					if (quotedString) {
						if (quotedString == "''") {
							formattedString += "'";
						} else {
							formattedString += quotedString.substring(1, quotedString.length - 1);
						}
					} else if (otherLetters) {
						// Swallow non-pattern letters by doing nothing here
					} else if (otherCharacters) {
						// Simply output other characters
						formattedString += otherCharacters;
					} else if (patternLetters) {
						// Replace pattern letters
						var patternLetter = patternLetters.charAt(0);
						var numberOfLetters = patternLetters.length;
						var rawData = "";
						switch (patternLetter) {
							case "G":
								rawData = "AD";
								break;
							case "y":
								rawData = date.getFullYear();
								break;
							case "M":
								rawData = date.getMonth();
								break;
							case "w":
								rawData = date.getWeekInYear(this.getMinimalDaysInFirstWeek());
								break;
							case "W":
								rawData = date.getWeekInMonth(this.getMinimalDaysInFirstWeek());
								break;
							case "D":
								rawData = date.getDayInYear();
								break;
							case "d":
								rawData = date.getDate();
								break;
							case "F":
								rawData = 1 + Math.floor((date.getDate() - 1) / 7);
								break;
							case "E":
								rawData = dayNames[date.getDay()];
								break;
							case "a":
								rawData = (date.getHours() >= 12) ? "PM" : "AM";
								break;
							case "H":
								rawData = date.getHours();
								break;
							case "k":
								rawData = date.getHours() || 24;
								break;
							case "K":
								rawData = date.getHours() % 12;
								break;
							case "h":
								rawData = (date.getHours() % 12) || 12;
								break;
							case "m":
								rawData = date.getMinutes();
								break;
							case "s":
								rawData = date.getSeconds();
								break;
							case "S":
								rawData = date.getMilliseconds();
								break;
							case "Z":
								rawData = date.getTimezoneOffset(); // This returns the number of minutes since GMT was this time.
								break;
						}
						// Format the raw data depending on the type
						switch (types[patternLetter]) {
							case TEXT2:
								formattedString += formatText(rawData, numberOfLetters, 2);
								break;
							case TEXT3:
								formattedString += formatText(rawData, numberOfLetters, 3);
								break;
							case NUMBER:
								formattedString += formatNumber(rawData, numberOfLetters);
								break;
							case YEAR:
								if (numberOfLetters <= 3) {
									// Output a 2-digit year
									var dataString = "" + rawData;
									formattedString += dataString.substr(2, 2);
								} else {
									formattedString += formatNumber(rawData, numberOfLetters);
								}
								break;
							case MONTH:
								if (numberOfLetters >= 3) {
									formattedString += formatText(monthNames[rawData], numberOfLetters, numberOfLetters);
								} else {
									// NB. Months returned by getMonth are zero-based
									formattedString += formatNumber(rawData + 1, numberOfLetters);
								}
								break;
							case TIMEZONE:
								var isPositive = (rawData > 0);
								// The following line looks like a mistake but isn't
								// because of the way getTimezoneOffset measures.
								var prefix = isPositive ? "-" : "+";
								var absData = Math.abs(rawData);

								// Hours
								var hours = "" + Math.floor(absData / 60);
								hours = padWithZeroes(hours, 2);
								// Minutes
								var minutes = "" + (absData % 60);
								minutes = padWithZeroes(minutes, 2);

								formattedString += prefix + hours + minutes;
								break;
						}
					}
					searchString = searchString.substr(result.index + result[0].length);
				}
				return formattedString;
			};
		})();

		log4javascript.SimpleDateFormat = SimpleDateFormat;

		/* ---------------------------------------------------------------------- */
		// PatternLayout

		function PatternLayout(pattern) {
			if (pattern) {
				this.pattern = pattern;
			} else {
				this.pattern = PatternLayout.DEFAULT_CONVERSION_PATTERN;
			}
			this.customFields = [];
		}

		PatternLayout.TTCC_CONVERSION_PATTERN = "%r %p %c - %m%n";
		PatternLayout.DEFAULT_CONVERSION_PATTERN = "%m%n";
		PatternLayout.ISO8601_DATEFORMAT = "yyyy-MM-dd HH:mm:ss,SSS";
		PatternLayout.DATETIME_DATEFORMAT = "dd MMM yyyy HH:mm:ss,SSS";
		PatternLayout.ABSOLUTETIME_DATEFORMAT = "HH:mm:ss,SSS";

		PatternLayout.prototype = new Layout();

		PatternLayout.prototype.format = function (loggingEvent) {
			var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([acdfmMnpr%])(\{([^\}]+)\})?|([^%]+)/;
			var formattedString = "";
			var result;
			var searchString = this.pattern;

			// Cannot use regex global flag since it doesn't work with exec in IE5
			while ((result = regex.exec(searchString))) {
				var matchedString = result[0];
				var padding = result[1];
				var truncation = result[2];
				var conversionCharacter = result[3];
				var specifier = result[5];
				var text = result[6];

				// Check if the pattern matched was just normal text
				if (text) {
					formattedString += "" + text;
				} else {
					// Create a raw replacement string based on the conversion
					// character and specifier
					var replacement = "";
					switch (conversionCharacter) {
						case "a": // Array of messages
						case "m": // Message
							var depth = 0;
							if (specifier) {
								depth = parseInt(specifier, 10);
								if (isNaN(depth)) {
									handleError("PatternLayout.format: invalid specifier '" +
										specifier + "' for conversion character '" + conversionCharacter +
										"' - should be a number");
									depth = 0;
								}
							}
							var messages = (conversionCharacter === "a") ? loggingEvent.messages[0] : loggingEvent.messages;
							for (var i = 0, len = messages.length; i < len; i++) {
								if (i > 0 && (replacement.charAt(replacement.length - 1) !== " ")) {
									replacement += " ";
								}
								if (depth === 0) {
									replacement += messages[i];
								} else {
									replacement += formatObjectExpansion(messages[i], depth);
								}
							}
							break;
						case "c": // Logger name
							var loggerName = loggingEvent.logger.name;
							if (specifier) {
								var precision = parseInt(specifier, 10);
								var loggerNameBits = loggingEvent.logger.name.split(".");
								if (precision >= loggerNameBits.length) {
									replacement = loggerName;
								} else {
									replacement = loggerNameBits.slice(loggerNameBits.length - precision).join(".");
								}
							} else {
								replacement = loggerName;
							}
							break;
						case "d": // Date
							var dateFormat = PatternLayout.ISO8601_DATEFORMAT;
							if (specifier) {
								dateFormat = specifier;
								// Pick up special cases
								if (dateFormat == "ISO8601") {
									dateFormat = PatternLayout.ISO8601_DATEFORMAT;
								} else if (dateFormat == "ABSOLUTE") {
									dateFormat = PatternLayout.ABSOLUTETIME_DATEFORMAT;
								} else if (dateFormat == "DATE") {
									dateFormat = PatternLayout.DATETIME_DATEFORMAT;
								}
							}
							// Format the date
							replacement = (new SimpleDateFormat(dateFormat)).format(loggingEvent.timeStamp);
							break;
						case "f": // Custom field
							if (this.hasCustomFields()) {
								var fieldIndex = 0;
								if (specifier) {
									fieldIndex = parseInt(specifier, 10);
									if (isNaN(fieldIndex)) {
										handleError("PatternLayout.format: invalid specifier '" +
											specifier + "' for conversion character 'f' - should be a number");
									} else if (fieldIndex === 0) {
										handleError("PatternLayout.format: invalid specifier '" +
											specifier + "' for conversion character 'f' - must be greater than zero");
									} else if (fieldIndex > this.customFields.length) {
										handleError("PatternLayout.format: invalid specifier '" +
											specifier + "' for conversion character 'f' - there aren't that many custom fields");
									} else {
										fieldIndex = fieldIndex - 1;
									}
								}
								var val = this.customFields[fieldIndex].value;
								if (typeof val == "function") {
									val = val(this, loggingEvent);
								}
								replacement = val;
							}
							break;
						case "n": // New line
							replacement = newLine;
							break;
						case "p": // Level
							replacement = loggingEvent.level.name;
							break;
						case "r": // Milliseconds since log4javascript startup
							replacement = "" + loggingEvent.timeStamp.getDifference(applicationStartDate);
							break;
						case "%": // Literal % sign
							replacement = "%";
							break;
						default:
							replacement = matchedString;
							break;
					}
					// Format the replacement according to any padding or
					// truncation specified
					var l;

					// First, truncation
					if (truncation) {
						l = parseInt(truncation.substr(1), 10);
						var strLen = replacement.length;
						if (l < strLen) {
							replacement = replacement.substring(strLen - l, strLen);
						}
					}
					// Next, padding
					if (padding) {
						if (padding.charAt(0) == "-") {
							l = parseInt(padding.substr(1), 10);
							// Right pad with spaces
							while (replacement.length < l) {
								replacement += " ";
							}
						} else {
							l = parseInt(padding, 10);
							// Left pad with spaces
							while (replacement.length < l) {
								replacement = " " + replacement;
							}
						}
					}
					formattedString += replacement;
				}
				searchString = searchString.substr(result.index + result[0].length);
			}
			return formattedString;
		};

		PatternLayout.prototype.ignoresThrowable = function () {
			return true;
		};

		PatternLayout.prototype.toString = function () {
			return "PatternLayout";
		};

		log4javascript.PatternLayout = PatternLayout;

		/* ---------------------------------------------------------------------- */
		// BrowserConsoleAppender (only works in Opera and Safari and Firefox with
		// Firebug extension)

		function BrowserConsoleAppender() {
		}

		BrowserConsoleAppender.prototype = new log4javascript.Appender();
		BrowserConsoleAppender.prototype.layout = new NullLayout();
		BrowserConsoleAppender.prototype.threshold = Level.DEBUG;

		BrowserConsoleAppender.prototype.append = function (loggingEvent) {
			var appender = this;

			var getFormattedMessage = function () {
				var layout = appender.getLayout();
				var formattedMessage = layout.format(loggingEvent);
				if (layout.ignoresThrowable() && loggingEvent.exception) {
					formattedMessage += loggingEvent.getThrowableStrRep();
				}
				return formattedMessage;
			};

			if ((typeof opera != "undefined") && opera.postError) { // Opera
				opera.postError(getFormattedMessage());
			} else if (window.console && window.console.log) { // Safari and Firebug
				var formattedMesage = getFormattedMessage()[0];
				/* TODO DL take care of the array */
				// Log to Firebug using its logging methods or revert to the console.log
				// method in Safari
				if (window.console.debug && Level.DEBUG.isGreaterOrEqual(loggingEvent.level)) {
					window.console.debug(formattedMesage);
				} else if (window.console.info && Level.INFO.equals(loggingEvent.level)) {
					window.console.info(formattedMesage);
				} else if (window.console.warn && Level.WARN.equals(loggingEvent.level)) {
					window.console.warn(formattedMesage);
				} else if (window.console.error && loggingEvent.level.isGreaterOrEqual(Level.ERROR)) {
					window.console.error(formattedMesage);
				} else {
					window.console.log(formattedMesage);
				}
			}
		};

		BrowserConsoleAppender.prototype.group = function (name) {
			if (window.console && window.console.group) {
				window.console.group(name);
			}
		};

		BrowserConsoleAppender.prototype.groupEnd = function () {
			if (window.console && window.console.groupEnd) {
				window.console.groupEnd();
			}
		};

		BrowserConsoleAppender.prototype.toString = function () {
			return "BrowserConsoleAppender";
		};

		log4javascript.BrowserConsoleAppender = BrowserConsoleAppender;
		/* ---------------------------------------------------------------------- */
		// AjaxAppender related

		var xmlHttpFactories = [
			function () {
				return new XMLHttpRequest();
			},
			function () {
				return new ActiveXObject("Msxml2.XMLHTTP");
			},
			function () {
				return new ActiveXObject("Microsoft.XMLHTTP");
			}
		];

		var getXmlHttp = function (errorHandler) {
			// This is only run the first time; the value of getXmlHttp gets
			// replaced with the factory that succeeds on the first run
			var xmlHttp = null, factory;
			for (var i = 0, len = xmlHttpFactories.length; i < len; i++) {
				factory = xmlHttpFactories[i];
				try {
					xmlHttp = factory();
					getXmlHttp = factory;
					return xmlHttp;
				} catch (e) {
				}
			}

			/* TODO DL  when there is no xmlhttp we will use jsonp or postToServer */

			// If we're here, all factories have failed, so throw an error
			if (errorHandler) {
				errorHandler();
			} else {
				handleError("getXmlHttp: unable to obtain XMLHttpRequest object");
			}
		};

		function isHttpRequestSuccessful(xmlHttp) {
			return isUndefined(xmlHttp.status) || xmlHttp.status === 0 ||
				(xmlHttp.status >= 200 && xmlHttp.status < 300) ||
				xmlHttp.status == 1223 /* Fix for IE */;
		}


		/* ---------------------------------------------------------------------- */
		// AjaxAppender

		function AjaxAppender(url) {
			var appender = this;
			var isSupported = true;
			if (!url) {
				handleError("AjaxAppender: URL must be specified in constructor");
				isSupported = false;
				isLog4TcSupported = false;
			}

			var timed = this.defaults.timed;
			var waitForResponse = this.defaults.waitForResponse;
			var batchSize = this.defaults.batchSize;
			var timerInterval = this.defaults.timerInterval;
			var requestSuccessCallback = this.defaults.requestSuccessCallback;
			var failCallback = this.defaults.failCallback;
			var postVarName = this.defaults.postVarName;
			var sendAllOnUnload = this.defaults.sendAllOnUnload;
			var contentType = this.defaults.contentType;
			var sessionId = null;

			var queuedLoggingEvents = [];
			var queuedRequests = [];
			var headers = [];
			var sending = false;
			var initialized = false;

			// Configuration methods. The function scope is used to prevent
			// direct alteration to the appender configuration properties.
			function checkCanConfigure(configOptionName) {
				if (initialized) {
					handleError("AjaxAppender: configuration option '" +
						configOptionName +
						"' may not be set after the appender has been initialized");
					return false;
				}
				return true;
			}

			this.getSessionId = function () {
				return sessionId;
			};
			this.setSessionId = function (sessionIdParam) {
				sessionId = extractStringFromParam(sessionIdParam, null);
				this.layout.setCustomField("sessionid", sessionId);
			};

			this.setLayout = function (layoutParam) {
				if (checkCanConfigure("layout")) {
					this.layout = layoutParam;
					// Set the session id as a custom field on the layout, if not already present
					if (sessionId !== null) {
						this.setSessionId(sessionId);
					}
				}
			};

			this.isTimed = function () {
				return timed;
			};
			this.setTimed = function (timedParam) {
				if (checkCanConfigure("timed")) {
					timed = bool(timedParam);
				}
			};

			this.getTimerInterval = function () {
				return timerInterval;
			};
			this.setTimerInterval = function (timerIntervalParam) {
				if (checkCanConfigure("timerInterval")) {
					timerInterval = extractIntFromParam(timerIntervalParam, timerInterval);
				}
			};

			this.isWaitForResponse = function () {
				return waitForResponse;
			};
			this.setWaitForResponse = function (waitForResponseParam) {
				if (checkCanConfigure("waitForResponse")) {
					waitForResponse = bool(waitForResponseParam);
				}
			};

			this.getBatchSize = function () {
				return batchSize;
			};
			this.setBatchSize = function (batchSizeParam) {
				if (checkCanConfigure("batchSize")) {
					batchSize = extractIntFromParam(batchSizeParam, batchSize);
				}
			};

			this.isSendAllOnUnload = function () {
				return sendAllOnUnload;
			};
			this.setSendAllOnUnload = function (sendAllOnUnloadParam) {
				if (checkCanConfigure("sendAllOnUnload")) {
					sendAllOnUnload = extractBooleanFromParam(sendAllOnUnloadParam, sendAllOnUnload);
				}
			};

			this.setRequestSuccessCallback = function (requestSuccessCallbackParam) {
				requestSuccessCallback = extractFunctionFromParam(requestSuccessCallbackParam, requestSuccessCallback);
			};

			this.setFailCallback = function (failCallbackParam) {
				failCallback = extractFunctionFromParam(failCallbackParam, failCallback);
			};

			this.getPostVarName = function () {
				return postVarName;
			};
			this.setPostVarName = function (postVarNameParam) {
				if (checkCanConfigure("postVarName")) {
					postVarName = extractStringFromParam(postVarNameParam, postVarName);
				}
			};

			this.getHeaders = function () {
				return headers;
			};
			this.addHeader = function (name, value) {
				if (name.toLowerCase() == "content-type") {
					contentType = value;
				} else {
					headers.push({ name: name, value: value });
				}
			};

			// Internal functions
			function sendAll() {
				if (isSupported && enabled) {
					sending = true;
					var currentRequestBatch;
					if (waitForResponse) {
						// Send the first request then use this function as the callback once
						// the response comes back
						if (queuedRequests.length > 0) {
							currentRequestBatch = queuedRequests.shift();
							sendRequest(preparePostData(currentRequestBatch), sendAll);
						} else {
							sending = false;
							if (timed) {
								scheduleSending();
							}
						}
					} else {
						// Rattle off all the requests without waiting to see the response
						while ((currentRequestBatch = queuedRequests.shift())) {
							sendRequest(preparePostData(currentRequestBatch));
						}
						sending = false;
						if (timed) {
							scheduleSending();
						}
					}
				}
			}

			this.sendAll = sendAll;

			// Called when the window unloads. At this point we're past caring about
			// waiting for responses or timers or incomplete batches - everything
			// must go, now
			function sendAllRemaining() {
				var sendingAnything = false;
				if (isSupported && enabled) {
					// Create requests for everything left over, batched as normal
					var actualBatchSize = appender.getLayout().allowBatching() ? batchSize : 1;
					var currentLoggingEvent;
					var batchedLoggingEvents = [];
					while ((currentLoggingEvent = queuedLoggingEvents.shift())) {
						batchedLoggingEvents.push(currentLoggingEvent);
						if (queuedLoggingEvents.length >= actualBatchSize) {
							// Queue this batch of log entries
							queuedRequests.push(batchedLoggingEvents);
							batchedLoggingEvents = [];
						}
					}
					// If there's a partially completed batch, add it
					if (batchedLoggingEvents.length > 0) {
						queuedRequests.push(batchedLoggingEvents);
					}
					sendingAnything = (queuedRequests.length > 0);
					waitForResponse = false;
					timed = false;
					sendAll();
				}
				return sendingAnything;
			}

			this.sendAllRemaining = sendAllRemaining;

			function preparePostData(batchedLoggingEvents) {
				// Format the logging events
				var formattedMessages = [];
				var currentLoggingEvent;
				var postData = "";
				while ((currentLoggingEvent = batchedLoggingEvents.shift())) {
					var currentFormattedMessage = appender.getLayout().format(currentLoggingEvent);
					if (appender.getLayout().ignoresThrowable()) {
						currentFormattedMessage += currentLoggingEvent.getThrowableStrRep();
					}
					formattedMessages.push(currentFormattedMessage);
				}
				// Create the post data string
				if (batchedLoggingEvents.length == 1) {
					postData = formattedMessages.join("");
				} else {
					postData = appender.getLayout().batchHeader +
						formattedMessages.join(appender.getLayout().batchSeparator) +
						appender.getLayout().batchFooter;
				}
				if (contentType == appender.defaults.contentType) {
					postData = appender.getLayout().returnsPostData ? postData :
						urlEncode(postVarName) + "=" + urlEncode(postData);
					// Add the layout name to the post data
					if (postData.length > 0) {
						postData += "&";
					}
					postData += "layout=" + urlEncode(appender.getLayout().toString());
				}
				return postData;
			}

			function scheduleSending() {
				window.setTimeout(sendAll, timerInterval);
			}

			function xmlHttpErrorHandler() {
				var msg = "AjaxAppender: could not create XMLHttpRequest object. AjaxAppender disabled";
				handleError(msg);
				isSupported = false;
				isLog4TcSupported = false;
				if (failCallback) {
					failCallback(msg);
				}
			}

			function sendRequest(postData, successCallback) {
				try {
					var xmlHttp = getXmlHttp(xmlHttpErrorHandler);
					if (isSupported) {
						if (xmlHttp.overrideMimeType) {
							xmlHttp.overrideMimeType(appender.getLayout().getContentType());
						}
						xmlHttp.onreadystatechange = function () {
							if (xmlHttp.readyState == 4) {
								if (isHttpRequestSuccessful(xmlHttp)) {
									if (requestSuccessCallback) {
										requestSuccessCallback(xmlHttp);
									}
									if (successCallback) {
										successCallback(xmlHttp);
									}
								} else {
									var msg = "AjaxAppender.append: XMLHttpRequest request to URL " +
										url + " returned status code " + xmlHttp.status;
									handleError(msg);
									if (failCallback) {
										failCallback(msg);
									}
								}
								xmlHttp.onreadystatechange = emptyFunction;
								xmlHttp = null;
							}
						};
						xmlHttp.open("POST", url, true);
						try {
							for (var i = 0, header; header = headers[i++];) {
								xmlHttp.setRequestHeader(header.name, header.value);
							}
							xmlHttp.setRequestHeader("Content-Type", contentType);
						} catch (headerEx) {
							var msg = "AjaxAppender.append: your browser's XMLHttpRequest implementation" +
								" does not support setRequestHeader, therefore cannot post data. AjaxAppender disabled";
							handleError(msg);
							isSupported = false;
							isLog4TcSupported = false;
							if (failCallback) {
								failCallback(msg);
							}
							return;
						}
						xmlHttp.send(postData);
					}
				} catch (ex) {

					var errMsg = "AjaxAppender.append: error sending log message to " + url;
					handleError(errMsg, ex);
					isSupported = false;
					isLog4TcSupported = false;
					if (failCallback) {
						failCallback(errMsg + ". Details: " + getExceptionStringRep(ex));
					}
				}
			}

			this.append = function (loggingEvent) {
				if (isSupported) {
					if (!initialized) {
						init();
					}
					queuedLoggingEvents.push(loggingEvent);
					var actualBatchSize = this.getLayout().allowBatching() ? batchSize : 1;

					if (queuedLoggingEvents.length >= actualBatchSize) {
						var currentLoggingEvent;
						var batchedLoggingEvents = [];
						while ((currentLoggingEvent = queuedLoggingEvents.shift())) {
							batchedLoggingEvents.push(currentLoggingEvent);
						}
						// Queue this batch of log entries
						queuedRequests.push(batchedLoggingEvents);

						// If using a timer, the queue of requests will be processed by the
						// timer function, so nothing needs to be done here.
						if (!timed && (!waitForResponse || (waitForResponse && !sending))) {
							sendAll();
						}
					}
				}
			};

			function init() {
				initialized = true;
				// Add unload event to send outstanding messages
				if (sendAllOnUnload) {
					var oldBeforeUnload = window.onbeforeunload;
					window.onbeforeunload = function () {
						if (oldBeforeUnload) {
							oldBeforeUnload();
						}
						if (sendAllRemaining()) {
							return "Sending log messages";
						}
					};
				}
				// Start timer
				if (timed) {
					scheduleSending();
				}
			}
		}

		AjaxAppender.prototype = new Appender();

		AjaxAppender.prototype.defaults = {
			waitForResponse: false,
			timed: false,
			timerInterval: 1000,
			batchSize: 1,
			sendAllOnUnload: false,
			requestSuccessCallback: null,
			failCallback: null,
			postVarName: "data",
			contentType: "application/x-www-form-urlencoded"
		};

		AjaxAppender.prototype.layout = new HttpPostDataLayout();

		AjaxAppender.prototype.toString = function () {
			return "AjaxAppender";
		};

		log4javascript.AjaxAppender = AjaxAppender;

		/* ---------------------------------------------------------------------- */
		// Main load

		log4javascript.setDocumentReady = function () {
			pageLoaded = true;
			log4javascript.dispatchEvent("load", {});
		};

		if (window.addEventListener) {
			window.addEventListener("load", log4javascript.setDocumentReady, false);
		} else if (window.attachEvent) {
			window.attachEvent("onload", log4javascript.setDocumentReady);
		} else {
			var oldOnload = window.onload;
			if (typeof window.onload != "function") {
				window.onload = log4javascript.setDocumentReady;
			} else {
				window.onload = function (evt) {
					if (oldOnload) {
						oldOnload(evt);
					}
					log4javascript.setDocumentReady();
				};
			}
		}

		// Ensure that the log4javascript object is available in the window. This
		// is necessary for log4javascript to be available in IE if loaded using
		// Dojo's module system
		// window.log4javascript = log4javascript;

		return log4javascript;
	})();

	// Local Variables
	var ajaxAppenders = [];
	var consoleAppenders = [];
	var tcLogs = [];

	/**
	 * Return Level object from matching string.
	 * @param strLevel
	 * @returns {*}
	 */
	function toLevel(strLevel) {
		switch (strLevel) {
			case "ALL":
				return log4javascript.Level.ALL;
			case "TRACE":
				return log4javascript.Level.TRACE;
			case "DEBUG":
				return log4javascript.Level.DEBUG;
			case "INFO":
				return log4javascript.Level.INFO;
			case "WARN":
				return log4javascript.Level.WARN;
			case "ERROR":
				return log4javascript.Level.ERROR;
			case "FATAL":
				return log4javascript.Level.FATAL;
			case "OFF":
				return log4javascript.Level.OFF;
			default:
				return log4javascript.Level.ERROR;
		}
	}

	/**
	 * Convenient private accessor to the global "urls" var
	 * @param defaultURL URL to use in case global val of "urls" is not defined.
	 * @returns {*|{logJsURL: *}} urls object in LandingFramework.jsp
	 */
	function getUrls(defaultURL){
		return urls || {logJsURL:defaultURL};
	}

	return {
		/**
		 * Add logger if one doesn't exist by its name in the tcLogs array.
		 *
		 * @param loggerName
		 * @param ajaxAppenderThreshold
		 * @param consoleAppenderThreshold
		 * @returns {*}
		 */
		getLogger: function (loggerName, ajaxAppenderThreshold, consoleAppenderThreshold) {
			if (tcLogs[loggerName] != null) {
				return log4javascript.getLogger(loggerName);
			} else {
				var jslog = log4javascript.getLogger(loggerName);

				/* Create ajax appender */
				var _urls = getUrls("https://tslogging.touchcommerce.com/tagserver/logging/log4js");
				var ajaxAppender = new log4javascript.AjaxAppender(_urls.logJsURL);
				ajaxAppender.setWaitForResponse(true);
				ajaxAppender.setLayout(new log4javascript.JsonLayout());
				//ajaxAppender.setRequestSuccessCallback(function() {});
				if (ajaxAppenderThreshold) {
					ajaxAppender.setThreshold(toLevel(ajaxAppenderThreshold));
				}
				ajaxAppenders[loggerName] = ajaxAppender;
				jslog.addAppender(ajaxAppender);

				/* Create console appender */
				var browserConsoleAppender = new log4javascript.BrowserConsoleAppender();
				consoleAppenders[loggerName] = browserConsoleAppender;
				if (consoleAppenderThreshold) {
					browserConsoleAppender.setThreshold(toLevel(consoleAppenderThreshold));
				}
				jslog.addAppender(browserConsoleAppender);
				tcLogs[loggerName] = jslog;

				/* if isLog4TcSupported is true, check if ajax is possible by sending one message 
				   log should never be called in test where no tagserver is there and isQunitTest is 
				   for that. */
				if (isLog4TcSupported === true && typeof isQunitTest === "undefined") {
					jslog.debug("tclog has been initiated.");
				}
				/* if isLog4TcSupported is false, turn off ajax appender */
				if (isLog4TcSupported === false) {
					ajaxAppender.setThreshold(log4javascript.Level.OFF);
				}
				/* Console log is disabled */
				if (JSLoggingDisabled) {
					browserConsoleAppender.setThreshold(log4javascript.Level.OFF);
				}

				return jslog;
			}
		},

		/**
		 * Wrapper of logger.setLevel()
		 * @param logger
		 * @param strLevel
		 */
		setLoggerLevel: function (logger, strLevel) {
			logger.setLevel(toLevel(strLevel));
		},

		/**
		 * Set all loggers' level
		 * @param strLevel
		 */
		setAllLoggerLevel: function (strLevel) {
			var i;
			for (i = 0; i < tcLogs.length; i++) {
				tcLogs[i].setLevel(toLevel(strLevel));
			}
		},

		/**
		 * Change ajax appender threshold
		 * @param loggerName
		 * @param strlevel
		 */
		setAjaxAppenderThreshold: function (loggerName, strLevel) {
			if (ajaxAppenders[loggerName]) {
				ajaxAppenders[loggerName].setThreshold(toLevel(strLevel));
			}
		},

		/**
		 * set all ajaxAppender's Threshold to the given level
		 * @param strLevel
		 */
		setAlltAjaxAppenderThreshold: function (strLevel) {
			var i;
			for (i = 0; i < ajaxAppenders.length; i++) {
				ajaxAppenders[i].setThreshold(toLevel(strLevel));
			}
		},

		/**
		 * Change consoleAppender threshold
		 * @param loggerName
		 * @param strlevel
		 */
		setConsoleAppenderThreshold: function (loggerName, strLevel) {
			if (consoleAppenders[loggerName]) {
				consoleAppenders[loggerName].setThreshold(toLevel(strLevel));
			}
		},

		/**
		 * set all consoleAppender's Threshold to the given level
		 * @param strLevel
		 */
		setAllConsoleAppenderThreshold: function (strLevel) {
			var i;
			for (i = 0; i < consoleAppenders.length; i++) {
				consoleAppenders[i].setThreshold(toLevel(strLevel));
			}
		}

	}

	/**
	 * Send message to logging server this
	 *
	 * NOTE TODO That any log4tcjs call to in ROM.post > ... > postToServer call will ends up with infinite loop.
	 *
	 * @param msg message to be logged in TS log as an error.
	 * @param logLevel log level type
	 */
	function sendWithPostToServer(msg) {
		if (ROM) {
			ROM.post(urls.logJsPostURL, msg);
		}
	}

})();

// init log4tcjs.
var tclog = log4tc.getLogger("IJSF");


	/* Moves the current date objects time forward or backward by number of provided MS. Function returns the rolled Date object. */
	Date.prototype.roll = function(rollTimeInMS) {
		/* RU */
		this.setTime(this.getTime() + rollTimeInMS);
		return this;
	};

	/* Returns time diff between instance and given Date object in MS. Returns negative value if future date is passed in. */
	Date.prototype.diff = function(otherDate) {
		/* RU */
		return otherDate ? this.getTime() - otherDate.getTime() : 0;
	};

	/* Returns true if this object represents point in time earlier than specified Date object. */
	Date.prototype.before = function(otherDate) {
		/* RU */
		return otherDate ? this.getTime() < otherDate.getTime() : 0;
	};

	/* Returns true if this object represents point in time later than specified Date object. */
	Date.prototype.after = function(otherDate) {
		/* RU */
		return otherDate ? this.getTime() > otherDate.getTime() : 0;
	};

	/* Returns true if this object and specified Date object represent the same point in time. */
	Date.prototype.equals = function(otherDate) {
		/* RU */
		if(otherDate)
			return this.getTime() == otherDate.getTime();
		return false;
	};

	/* MixIn for mixing in additional Date functionality. See usage in LandingFramework.jsp, function safe().  */
	var DateMixIn = (function() {
		return {
			equals: Date.prototype.equals,
			roll: Date.prototype.roll,
			diff: Date.prototype.diff,
			before: Date.prototype.before,
			after: Date.prototype.after
		};
	})();


	Array.prototype.contains = function(item, equalsFcn){
		/* RU */
		for(var idx=0; idx<this.length; idx++){
			if((equalsFcn && equalsFcn(this[idx], item)) || (!isNullOrUndefined(item) && item.equals && item.equals(this[idx])) || this[idx]==item){
				return true;
			}
		}
		return false;
	};

	/**
	 * Returns true if this array contains all elements of array supplied in parameter, otherwise return false.
	 * @param _arr array containing elements to check for presence in this array.
	 * @return true if this array contains all elements of array supplied in parameter, otherwise false.
	 */
	Array.prototype.containsAll = function(_arr){
		for(var idx=0; idx<_arr.length; idx++){
			if(!this.contains(_arr[idx])){
				return false;
			}
		}
		return true;
	};

	/**
	 * Returns true if this array is empty, otherwise return false.
	 * @return true if this array is empty, otherwise false.
	 */
	Array.prototype.isEmpty = function(){
		if(this.length){
			return false;
		}
		return true;
	};

	/**
	 * Appends (to back of array) items in a second array in the same order.
	 * @return altered instance of the modified array
	 */
	Array.prototype.append = function(a) {
		if(!!a && !!a.length){
			for(var i=0; i<a.length; i++) {
				this.push(a[i]);
			}
		}
		return this;
	};

	/**
	 * Prepends (to front of array) items in a second array in the same order.
	 * @return altered instance of the modified array
	 */
	Array.prototype.prepend = function(a) {
		for(var i=0; i<a.length; i++) {
			this.unshift(a[a.length-1-i]);
		}
		return this;
	};

	/**
	 * Returns the index of the first occurrence of the specified element
	 * in this list, or -1 if this list does not contain the element (IE8 support).
	 * Remark: Current implementation works more quick than original. It's very critical for Firefox (see investigation in RTDEV-4236)
	 *
	 * @param el element to find in this array
	 * @return index of supplied element in this array
	 */
	Array.prototype.indexOf = function(el) {
		var ind = -1;
		for(var i = 0; i < this.length; i++) {
			if (this[i] == el) {
				ind = i;
				break;
			}
		}
		return ind;
	};

	/**
	 * Truncates an array (lopping off last array.length - len from end of array) to size specified
	 * @return {Array} altered instance of the modified array
	 */
	Array.prototype.constrain = function(len){
		if(len && len>0 && this.length>len){
			this.length = len;
		}
		return this;
	};
	/**
	 * Static that clones a given array to a new instance of an array with the same elements in the same order.
	 * @return {Array} new (copied) instance of the given array. NOT A DEEP CLONE.
	 */
	Array.clone = function(_arr){
		if(_arr){
			var rv = [];
			if(typeOf(_arr)=='array'){
				for(var idx=0; idx<_arr.length; idx++){
					rv[idx]=_arr[idx];
				}
				return rv;
			}
		}
		return _arr;
	};

	Array.prototype._assertNumType = function(){
		if (this.length>0 && typeof this[0] != 'number')
			throw "OperationNotSupported: can't sum on a non-numerical list";
	};

	/* Calculates and returns sum of numeric elements of array. Nonnumeric elements are skipped.
	 * @return sum of numeric elements of array.
	 * @throws error "OperationNotSupported" if array contains nonnumeric elements.
	 */
	Array.prototype.sum = function() {
		this._assertNumType();
		if (!this.length) {
			return 0;
		} else {
			return this[0] + this.slice(1).sum();
		}
	};

	/* Returns standard deviation of array elements.
	 * @return standard deviation of array elements.
	 */
	Array.prototype.std_dev = function() {
		this._assertNumType();
		var sum = this.sum();
		var mean = sum / this.length;
		for(var i = 0, variance = 0; i < this.length; i++) {
			variance += Math.pow(this[i] - mean, 2);
		}
		variance = variance / this.length;
	    return Math.sqrt(variance);
	};

	/* Returns average of array elements.
	 * @return average of array elements.
	 * @throws error "OperationNotSupported" if array contains nonnumeric elements.
	 */
	Array.prototype.average = function(){
		this._assertNumType();
		var sum = 0;
		for(var i=0; i<this.length; i++){
			sum += this[i];
		}
		return sum/this.length;
	};

	/* Returns array size.
	 * @return array size.
	 */
	Array.prototype.size = function() {
		return this.length;
	};

	/**
	 * boolean visitor iterator that takes an object and an objects comparator fcn to test against a given result
	 * @return true if all comparisons equal the desired result. False if any one fails.
	 */
	Array.prototype._visit = function(o, bFcn, bool){
		for(var i=0; i<this.length; i++){
			if(bFcn(this[i], o)!=bool)
				return false;
		}
		return true;
	};

	// VISITOR function definitions FOR DATE-TYPED ARRAYS...
	Array.prototype.after = function(d){
		return this._visit(
				d,
				function(d1,d2){
					return d1.after(d2);
				},
				true
				);
	};
	Array.prototype.before = function(d){
		return this._visit(
				d,
				function(d1,d2){
					return d1.before(d2);
				},
				true);
	};

    Array.prototype.remove = function(index) {
        if (index < 0 || index > this.length) {
            return;
        }
        for (var i = index ; i +1 < this.length; i++) {
            this[i] = this[i+1];
        }
        this.length = this.length -1;
    };

    /**
     * Returns Array of keys (Map`).
     * @return Array of keys.
     */
    Array.prototype.keys = function () {
        var out = new Array();
        for(var index = 0; index < this.length; index ++) {
            var entry = this[index];
            out.push(entry.key);
        }
        return out;
    };

    /**
     * Returns Array of values (from map).
     * @return Array of values.
     */
    Array.prototype.values = function () {
        var out = new Array();
        for(var index = 0; index < this.length; index ++) {
            var entry = this[index];
            out.push(entry.value);
        }
        return out;
    };

    /**
     * Returns Map.Entry
     * @param key key of entry
     * @return Map.Entry if there is key in map, otherwise null.
     */
    Array.prototype.findEntry = function (key) {
        for(var index = 0; index < this.length; index ++) {
            if (this[index].key == key) {
                return this[index];
            }
        }
        return null;
    };

    /**
     * Returns value for key (Map)
     * @param key key of entry
     * @return value if there is key in map, otherwise null.
     */
    Array.prototype.get = function (key) {
        var entry = this.findEntry(key);
        if (entry) {
            return entry.value;
        }
        return null;
    };

    /**
     * Create(if there is no entry)/Rewrite (if there is entry) Map.Entry
     * @param key key of map entry
     * @param value value of map entry
     * @param findEntry if true, then try to find entry in map
     */
    Array.prototype.set = function (key, value, findEntry) {
        var entry = null;
        if (typeof(findEntry) == 'undefined'  || findEntry == true) {
            entry = this.findEntry(key);
        }
        if (entry) {
            entry.value = value;
        }
        else {
            entry = {key: key, value : value};
            this.push(entry);
        }
    };

    /**
     * Remove Map.Entry for key
     * @param key key of map entry
     */
    Array.prototype.unset = function (key) {
        for(var index = 0; index < this.length; index ++) {
            if (this[index].key == key) {
                this.remove(index);
                break;
            }
        }
    };

    /**
     * Clear Array
     */
    Array.prototype.clear = function () {
        this.length = 0;
    };

    /**
     * Execute function for each Map.Entry
     * @param fnc function to which will executed for each map entry
     * function's parameters: key, value
     * @return Array with 'fnc returns' if there is function, otherwise null
     */
    Array.prototype.collect = function (fnc) {
        if (typeof fnc != "function") {
            return null;
        }
        var out = [];
        for(var index = 0; index < this.length; index ++) {
            var entry = this[index];
	        if(entry.key && entry.value) {
		        out.push(fnc(entry.key, entry.value));
	        }
	        else{
		        out.push(fnc(entry));
	        }
        }
        return out;
    };

    /**
     * Execute function for each Map.Entry
     * @param fnc function which will executed for each map entry
     * (function's parameters : key, value, map)
     */
    Array.prototype.each = function (fnc) {
        if (typeof fnc != "function") {
            return;
        }
        for(var index = 0; index < this.length; index ++) {
            var entry = this[index];
            fnc(entry.key, entry.value, this);
        }
    };

    if (!Array.prototype.forEach) {
        /**
         * Executes a provided function once per array element (IE8 support).
         * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
         * @return callback Function to execute for each element
         * @return thisArg Object to use as this when executing callback
         */
        Array.prototype.forEach = function (callback, thisArg) {
            for (var i = 0, n = this.length; i < n; i++) {
                if (i in this) {
                    callback.call(thisArg, this[i], i, this);
                }
            }
        };
    }

    Array.prepareMapToSerialize = function(map) {
        var out = {};
        for(var i = 0; i < map.length; i++){
            var element = map[i];
            out[element.key]  = element.value;
        }
        return out;
    };

	/* Performs range check for this Number object value. Range bounds are inclusive.
	 * @return true if this Number object value is within bounds.
	 * @throws If upper range bound is less than lower range bound.
	 */
	Number.prototype.inRange = function(low, high) {
		if (high < low) throw ("Incorrect range bounds: low = " + low + ", high = " + high);
		if ((this >= low) && (this <= high)) return true;
		else return false;

	};

	/* MixIn for mixing in additional Number functionality. See usage in LandingFramework.jsp, function safe().  */
	var NumberMixIn = (function() {
		return {inRange: Number.prototype.inRange};
	})();


	/* Returns true if current String object contains searchString as a substring.
	 * Remark: the implementation is different as in other browser - additional parameter "isRegexp" (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2Fcontains)
	 *
	 * @param searchString a substring to search for.
	 * @param bIgnoreCase ignore case flag; if set to true, search is done ignoring character case.
	 * @param isRegexp true if searchString must be treated as RegExp pattern
	 * @return true if substring was found.
	 */
	String.prototype.contains = function(searchString, bIgnoreCase, isRegexp) {
        if(isNullOrUndefined(searchString)) {
            return false;
        }
		if (!isRegexp) {
			var str1;
			var str2;
			if (bIgnoreCase) {
				str1 = this.toLowerCase();
				str2 = searchString.toLowerCase();
			} else {
				str1 = this;
				str2 = searchString;
			}
			var ind = str1.indexOf(str2);
			return (ind != -1);
		} else {
			var reFlags = "";
			if (bIgnoreCase) reFlags = "i";
			var re = new RegExp(searchString, reFlags);
			return re.test(this);
		}
	};

	/* Returns true if current String object starts with value specified in searchString parameter.
	 * Remark: the implementation is different as in other browser - additional parameter "isRegexp" (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2FstartsWith)
	 *
	 * @param searchString a string to search for.
	 * @param bIgnoreCase ignore case flag; if set to true, search is done ignoring character case.
	 * @param isRegexp true if searchString must be treated as RegExp pattern
	 * @return true if current string starts with @searchString.
	 */
	String.prototype.startsWith = function(searchString, bIgnoreCase, isRegexp) {
        if(isNullOrUndefined(searchString)) {
            return false;
        }
        if (!isRegexp) {
			var str1;
			var str2;
			if (bIgnoreCase) {
				str1 = this.toLowerCase();
				str2 = searchString.toLowerCase();
			} else {
				str1 = this;
				str2 = searchString;
			}
			var ind = str1.indexOf(str2);
			return (ind == 0);
		} else {
			var reFlags = "";
			if (bIgnoreCase) reFlags = "i";
			if (searchString.charAt(0) != "^") searchString = "^" + searchString;
			var re = new RegExp(searchString, reFlags);
			return re.test(this);
		}
	};

	/* Returns true if current String object ends with value specified in searchString parameter.
	 * Remark: the implementation is different as in other browser - additional parameter "isRegexp" (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2FendsWith)
	 *
	 * @param searchString a string to search for.
	 * @param bIgnoreCase ignore case flag; if set to true, search is done ignoring character case.
	 * @param isRegexp true if searchString must be treated as RegExp pattern
	 * @return true if current string ends with @searchString.
	 */
	String.prototype.endsWith = function(searchString, bIgnoreCase, isRegexp) {
        if(isNullOrUndefined(searchString)) {
            return false;
        }
        if (!isRegexp) {
			var str1;
			var str2;
			if (bIgnoreCase) {
				str1 = this.toLowerCase();
				str2 = searchString.toLowerCase();
			} else {
				str1 = this;
				str2 = searchString;
			}
			var ind = str1.lastIndexOf(str2);
			return ((ind != -1) && (ind == (str1.length - str2.length)));
		} else {
			var reFlags = "";
			if (bIgnoreCase) reFlags = "i";
			if (searchString.charAt(searchString.length - 1) != "$") searchString = searchString + "$";
			var re = new RegExp(searchString, reFlags);
			return re.test(this);
		}
	};

	/* Returns true if current String object is equal to the specified searchString parameter.
	 * @param searchString a string to compare with.
	 * @param bIgnoreCase ignore case flag; if set to true, comparison is done ignoring character case.
	 * @param isRegexp true if searchString must be treated as RegExp pattern
	 * @return true if current string is equal to @searchString.
	 */
	String.prototype.equals = function(searchString, bIgnoreCase, isRegexp) {
		if(isNullOrUndefined(searchString)) {
            return false;
        }
        if (!isRegexp) {
			var str1;
			var str2;
			if (bIgnoreCase) {
				str1 = this.toLowerCase();
				str2 = searchString.toLowerCase();
			} else {
				str1 = this;
				str2 = searchString;
			}
			return (str1 == str2);
		} else {
			var reFlags = "";
			if (bIgnoreCase) reFlags = "i";
			if (searchString.charAt(0) != "^") searchString = "^" + searchString;
			if (searchString.charAt(searchString.length - 1) != "$") searchString = searchString + "$";
			var re = new RegExp(searchString, reFlags);
			return re.test(this);
		}
	};

	if (!String.prototype.trim) {
		/**
		 * Delete start and end spaces in the string (IE8 support).
		 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2FTrim
		 *
		 * @return {String} resulted string
		 */
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, "");
		}
	}
	/**
	 * Provides access to internal data without reference linkage.
	 * @interface
	 */
	function DataExporter(){}
	/**
	 * Provides data snapshot of the implementing instance.
	 * @return {Object} a data object that contains no linkage to the internals of the instance
	 * (shallow copy only if needed). To protect internal references from exposure, it is highly recommended
	 * that clones of internal data be returned instead of actual references.
	 * @see MixIns.clonize
	 */
	DataExporter.prototype.getData = function(){};
    	/**
	 * MixIns defines reusable interfaces with default implementations that
	 * can be added to a target object at runtime.
	 * @namespace Holds functionality related to Mix-ins.
	 */
	var MixIns = (function(){
		/** @inner */
		function _throwNoImpl(){
			throw (""+this.getID()+": "+arguments.callee.name+" requires override.");
		}

        function wrapWithTryCatch(code) {
            // window.console is used because Inq.log() is not available in XFormExternsions
            return "try{" + code + "}catch(e){if(window.console)window.console.error('ERROR:' + e.message);};\n";
        }

		/**
		 * Document Absorber class here
		 * @name Absorber
		 * @class
		 */
		var Absorber =
		/**
		 * This is an API that can be mixed into other objects
		 * @lends Absorber#
		 */
		{
			/**
			 * Absorbs the contents of the argument object into self
			 * @param {Object} absorbee object to absorb fields from
			 * @param {boolean} [agregateFlag] Optional flag, if true, then nested 1st level objects are augmented, not overwritten.
			 * @returns this for chaining convenience
			 */
			absorb: function(absorbee, agregateFlag) {
				if(absorbee){
					for(var name in absorbee) {
						if ((typeOf(this[name]) == 'object') && (typeOf(absorbee[name]) == 'object') && agregateFlag) {
							MixIns.mixAbsorber(this[name]);
							this[name].absorb(absorbee[name]);
						} else {
							this[name]=absorbee[name];
						}
					}
				}
				return this;
			}
		};

		/**
		 * Add the RemoteCaller interface to a target object.
		 * The target object will gain the following methods:
		 * onRemoteCallback, callRemote, getRID
		 * @class
		 * @name RemoteCaller
		 */
		var RemoteCaller =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends RemoteCaller#
			 */
		{
				/**
				 * callback on a remote call
				 */
				onRemoteCallback: _throwNoImpl,
				/**
				 * calls out a round trip message to a remote server via a url
				 * @param {string} url properly formatted base url to communicate
				 * @param {object} data name-value pairs to be sent to the server
				 */
				callRemote: function(url, data){
					ROM.doRemoteCall(url, data, this);
				},
				send: function(url, data) {
					ROM.send(url, data);
				}
		};

		/**
		 * Support for resource interface
		 * @class
		 * @name Resource
		 */
		var Resource =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends Resource#
			 */
		{
				/**
				 * "super" type constructor. REQUIRED on construction.
				 * @param {string} id The resource id
				 */
				_resource: function(id){
					this._rsrcID = id;
				},
				/**
				 * Writes name-value pairs to resource. If value is undefined, name-value pair is deleted from resource.
				 * @param {string} name name part to be saved
				 * @param {object} value value to be saved with the name.
				 * 	If undefined, name-value pair is deleted from resource.
				 */
				write: _throwNoImpl,
				/**
				 * Reads an object from the resource.
				 * @param {string} name name of the object to be retrieved from resource
				 */
				read: _throwNoImpl,
				/**
				 * helper method to serialize values.
				 * @param {object} o object to be serialized
				 * @return {string} string value of the object
				 * @public
				 */
				_serialize: _throwNoImpl,
				/**
				 * helper method to de-serialize strings to objects.
				 * @param {string} o string to be deserialized
				 * @return {object} object or null if either not deserialzable or not found
				 * @public
				 * @throws {string} error on de-serialization
				 */
				_deserialize: _throwNoImpl,
				/**
				 * obtains the resource id for the resource
				 */
				getResourceID: function(){
					return this._rsrcID;
				}
		};

		/**
		 * Support for DataReadyListener interface
		 * @class
		 * @name DataReadyListener
		 * @see PersistenceMgr
		 */
		var DataReadyListener =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends DataReadyListener#
			 */
		{
			/**
			 * Invoked when a data ready evt is fired
			 */
				onDataReady: _throwNoImpl
		};


		/**
		 * Support for Persistable interface
		 * @class
		 * @name Persistable
		 * @see PersistenceMgr
		 */
		var Persistable =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends Persistable#
			 */
		{
				/**
				 * obtains the persistable's id
				 * @return {string} string id
				 */
				getPersistentID: _throwNoImpl,
				/**
				 * loads the persistable's data from serialzed repository to memory
				 */
				load: _throwNoImpl,
				/**
				 * saves the persistables memory data to data repository
				 */
				save: _throwNoImpl,
				/**
				 * invoked as data ready listener
				 * @borrows DataReadyListener#onDataReady ad #onDataReady
				 */
				onDataReady: _throwNoImpl
		};

		/**
		 * Document FrameworkModule class here
		 * @name FrameworkModule
		 * @class
		 */
		var FrameworkModule =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends FrameworkModule#
			 */
		{
				_frameworkModule: function(id){
					this._id = id;
				},
				getID: function(){ return this._id;},
				/**
				 * initialized a module. Contract: internal init only. No linkage.
				 */
				init: _throwNoImpl,
				/**
				 * starts a module.
				 */
				start: _throwNoImpl,
				/**
				 * resets a module completely.
				 */
				reset: _throwNoImpl
		};

		/**
		 * Document Observable class here
		 * @name Observable
		 * @class
		 */
		var Observable = (function(){
			var retval =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends Observable#
			 */
			{
				/**
					* adds an array of listeners to the class
					*/
				addListeners: function(_arr){
					for(var idx=0; idx < _arr.length; idx++){
						this.addListener(_arr[idx]);
					}
				},

				/**
				 * Must be invoked with constructor
					* @public
					*/
				_observable: function(){
					this._listeners = [];
					this.observable=true;
				},

				/**
					* clears all listeners in the class
					*/
				clearListeners: function(){
					this._listeners=[];
				},
				/**
					* generic event firing method for use by any Observable mixin
					* @public
					*/
				_fireEvt: function(vfcn, evt){
					for(var idx=0; idx < this._listeners.length; idx++){
						var listener = this._listeners[idx];
						vfcn(listener, evt);
						if (typeof listener.onAnyEvent == "function") {
							listener.onAnyEvent(evt);
						}
					}
				},
				/**
					* adds a listener
					*/
				addListener: function(l){
					if(l && (this.isListener(l) || l.onAnyEvent)){
						this._listeners.push(l);
					}
				},
				/**
					* Determines if a given object is an acceptable listener for this class.
					* Overriding this method is required.
					* @throws {String} if the method is invoked without override
					*/
			isListener: _throwNoImpl
			};
			return retval;
		})();


		/**
		 * Document JSON MixIn here
		 * @constructor
		 * @class JSON
		 * @name JSON
		 * @field
		 */
		var JSON = (function(){
			function f(n){
				return n<10?'0'+n:n;
			}
			if(typeof Date.prototype.toJSON!=='function'){
				/** @ignore */
				Date.prototype.toJSON=function(key){
					return this.getTime();
				};
				/** @ignore */
				String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON =
					function(key){
						return this.valueOf();
					};
			}
			var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapeable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;
			function quote(string){
				escapeable.lastIndex=0;
				return escapeable.test(string)?'"'+string.replace(escapeable,function(a){var c=meta[a];if(typeof c==='string'){return c;}return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';
			}
			function str(key,holder){
				var i,k,v,length,mind=gap,partial,value=holder[key];
				if(value&&typeof value==='object'&&typeof value.toJSON==='function'){
					value=value.toJSON(key);
				}
				if(typeof rep==='function'){
					value=rep.call(holder,key,value);
				}
				switch(typeof value){
				case'string':return quote(value);
				case'number':return isFinite(value)?String(value):'null';
                case'boolean':case'null':return String(value);
				case'object':
					if(!value){
						return'null';
					}
					gap+=indent;
					partial=[];
					if(typeof value.length==='number'&&!value.propertyIsEnumerable('length')){
						length=value.length;
						for(i=0;i < length;i+=1){
							partial[i]=str(i,value)||'null';
						}
						v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';
						gap=mind;return v;
					}
					if(rep&&typeof rep==='object'){
						length=rep.length;
						for(i=0;i < length;i+=1){
							k=rep[i];
							if(typeof k==='string'){
								v=str(k,value);
								if(v){
									partial.push(k+(gap?': ':':')+v);
								}
							}
						}
					}else{
						for(k in value){
							if (k != "") {
								try {
									if(Object.hasOwnProperty.call(value,k)){
										v=str(k,value);
										if(v){
											partial.push(k+(gap?': ':':')+v);
										}
									}
								} catch (e) {
									var eMsg = 'Exception at Object.hasOwnProperty.call(' + value + ', ' + k + ') ';
									eMsg += catchFormatter(e) + ' in JSON.str(' + key + ', ' + holder + ')';
									ROM.post(urls.loggingURL, {level:'WARN', line: (eMsg)});
								}
							}
						}
					}
					v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';
					gap=mind;
					return v;
				}
			}

			function clone(object){			
				return parse(stringify(object));
			}
			
			function stringify(value,replacer,space){
				if(typeof value=="undefined" || value==null) {
					return null;
				}
				var i;
				gap='';
				indent='';
				if(typeof space==='number'){
					for(i=0;i < space;i+=1){
						indent+=' ';
					}
				}else if(typeof space==='string'){
					indent=space;
				}
				rep=replacer;
				if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){
					throw new Error('JSON.stringify');
				}
				return str('',{'':value});
			}

			function parse(text,reviver){
				if(!text) return null;
				var j;
				function walk(holder,key){
					var k,v,value=holder[key];
					if(value&&typeof value==='object'){
						for(k in value){
							if(Object.hasOwnProperty.call(value,k)){
								v=walk(value,k);
								if(v!==undefined){
									value[k]=v;
								}else{
									delete value[k];
								}
							}
						}
					}
					return reviver.call(holder,key,value);
				}
				cx.lastIndex=0;
				if(cx.test(text)){
					text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});
				}
				//if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/(?:[\w-])+|"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){
					try {
						j=eval('('+text+')');
					} catch(e) {
						e.message = "Error while parsing JSON: " + e.message + ". Input JSON: " + text;
						throw e;
					}
					return typeof reviver==='function'?walk({'':j},''):j;
				//}
				//throw new SyntaxError('JSON.parse');
			}

			var retval =
			/**
			 * This is an API that can be mixed into other objects
			 * @lends JSON#
			 */
			{
				
				/**
				 * converts a given Object into a new object instance
				 * @function
				 * @param object, object to be cloned
				 * @return new object
				 * @throws {Error} When JS object is not "stringifiable"
				 */
				clone: clone,
									
				/**
				 *  converts a given object to JSON string
				 *  @function
				 *  @param value val
				 *  @param replacer replacer
				 *  @param space space
				 *  @throws {SyntaxError} When invalid JSON string is parsed
				 */
				stringify: stringify,
				/**
				 * converts a given JSON string to an object
				 * @function
				 * @param text text to be parsed into an object. Must be valid JSON string to succeed
				 * @param reviver
				 * @throws {Error} When JS object is not "stringifiable"
				 */
				parse: parse
			};
			return retval;
		})();

		/**
		 * This mixin is for objects that need to be able to clone themself.
		 * @name Cloneable
		 * @class Cloneable
		 */
		var Cloneable = (function(){
			var retval =
			/**
			* This is an API that can be mixed into other objects
			* @lends Cloneable#
			*/
			{

				/**
				* Returns clone of the object.
				* Overriding this method is required.
				* @throws {String} if the method is invoked without override
				*/
				clone: function(){
					return JSON.parse(JSON.stringify(this));
				}
			};

			return retval;
		})();

		var mixIn = function(mixable){
			if(mixable){
				for(var name in mixable){
					if(!this[name]) {
						if(this.prototype) {
							this.prototype[name]=mixable[name];
						} else {
							this[name] = mixable[name];
						}
					}
				}
			}
			return this;
		};

		function prepare(_class){
			if(_class){
				_class.mixIn = mixIn;
			}
			return _class;
		}

		function mixAbsorber(o){
			if(!o){
				o= {};
			}
			o.absorb = Absorber.absorb;
			return o;
		}

		function clonize(o){
			if(!!o && typeOf(o)=="object"){
				o.clone = function(){
					return JSON.parse(JSON.stringify(this));
				}
			}
			return o;
		}

		/**
		 * Settable allows set chaining.
		 * @param {Object} the object instance to be made into a "settable".
		 * If null or undefined, a new object settable will be created and returned. If
		 * non-object is passed it will not be mixed (ignored).
		 * Ex. var o = MixIns.mixSettable().set("a",123).set(2, "foo");
		 */
		function mixSettable(o){
			if(isNullOrUndefined(o)){
				o = {};
			}
			if(!!o && typeOf(o)=="object"){
				/**
				 * sets a name value to this object.
				 * @param n {any} assigns the given value to the name.
				 * Will not assign if null or undefined.
				 * @param v {any} Value for the given name to be assigned to the object
				 * @returns this object always.
				 */
				o.set = function(n,v){
					if(!!n || n===0 || n === ""){
						this[n]=v;
					}else{
						log("Settable: Unable to set n,v=("+n+","+v+") on "+this.toString()+". \n"+getStackTrace(new Error()));
					}
					return this;
				};
			}
			return o;
		}
		/**
		 * Removable allows remove chaining.
		 * @param {Object} the object instance to be made into a "settable".
		 * If null or undefined, a new object settable will be created and returned. If
		 * non-object is passed it will not be mixed (ignored).
		 * Ex. var o = MixIns.mixSettable().set("a",123).set(2, "foo");
		 */
		function mixRemovable(o){
			if(isNullOrUndefined(o)){
				o = {};
			}
			if(!!o && typeOf(o)=="object"){
				/**
				 * Removes a named value from this object.
				 * @param n {any} assigns the given value to the name.
				 * Will not assign if null or undefined.
				 * @returns this object always.
				 */
				o.remove = function(n){
					if(!!n || n===0 || n === ""){
						delete this[n];
					}
					return this;
				};
			}
			return o;
		}
		/**
		 * Renamable allows remove chaining.
		 * @param {Object} the object instance to be made into a "settable".
		 * If null or undefined, a new object settable will be created and returned. If
		 * non-object is passed it will not be mixed (ignored).
		 * Ex. var o = MixIns.mixSettable().set("a",123).set(2, "foo");
		 */
		function mixRenamable(o){
			if(isNullOrUndefined(o)){
				o = {};
			}
			if(!!o && typeOf(o)=="object"){
				/**
				 * Renames a named value in this object.
				 * @param n {any} assigns the given value to the name.
				 * Will not assign if null or undefined.
				 * @returns this object always.
				 */
				o.rename = function(on,nn){
					if((!!on || on===0 || on === "") && (!!nn || nn===0 || nn === "")){
						var v = this[on];
						if(!!v || v===0){
							delete this[on];
						}
						this[nn]=v;
					}
					return this;
				};
			}
			return o;
		}
		function unmixMutatable(o){
			delete o.rename;
			delete o.remove;
			delete o.set;
			return o;
		}
		
		function mixMutatable(o){
			o = mixRemovable(o);
			o = mixSettable(o);
			o = mixRenamable(o);
			return o;
		}

		return {
			prepare: prepare,
			Observable: Observable,
			JSON: JSON,
			mixMutatable: mixMutatable,
			unmixMutatable:unmixMutatable,
			mixAbsorber: mixAbsorber,
			Absorber: Absorber,
			Resource: Resource,
			Persistable: Persistable,
			FrameworkModule:FrameworkModule,
			RemoteCaller:RemoteCaller,
			clonize: clonize,
			Cloneable:Cloneable,
            wrapWithTryCatch:wrapWithTryCatch
		};
	})();
	


    var businessConstants = site.businessConstants();
	var constants = MixIns.mixAbsorber();
	constants.absorb({    "CUST_IP_HOST_RESOLUTION_ACTIVE":false,
    "ASSISTED_AGENT_CHAT_COUNT":2.0,
    "ASSISTED_CUSTOMER_CHAT_COUNT":2.0,
    "DEBUG":true,
    "SALE_EXPIRATION":2592000000,
    "SALE_STATE_CONVERTED":"converted",
    "SALE_STATE_ASSISTED":"assisted",
    "SALE_STATE_UNSOLD":"unsold",
    "SESSION_EXPIRE_TIME":1800000,
    "INC_GROUP_CONTROL":"CONTROL",
    "INC_GROUP_CHAT":"CHAT",
    "INC_STATE_ELIGIBLE":"ELIGIBLE",
    "INC_STATE_TARGETED":"TARGETED",
    "INC_STATE_EXPOSURE_QUALIFIED":"EXPOSURE_QUALIFIED",
    "INC_STATE_EXPOSED":"EXPOSED",
    "INC_STATE_ENGAGED":"ENGAGED",
    "INC_STATE_INTERACTED":"INTERACTED",
    "INC_STATE_ASSISTED":"ASSISTED",
    "INC_STATE_CONVERTED":"CONVERTED",
    "INC_GROUP_DURATION":2592000000,
    "INC_CONTROL_PERCENT":1.0,
    "MESSAGE_COUNT_ASSISTED":1.0,
    "PERSISTENT_ASSISTED":6.0,
    "UNDEFINED_ASSISTED":3.0,
    "MAX_LONG":9.223372036854776E18,
    "REMOVE_QUERY_STRING_FROM_TRACKING_URL":false,
    "RECHAT_INTERVAL":86400000,
    "JS_LOG_LEVEL":"ERROR"
});

	// If any constant in business part has the same name as a constant from program part,
	// the constant from program part will be overridden by this absorb.
	// Validity of such override is checked by corresponding constraints in br30.xsd
	constants.absorb(businessConstants);

/**
 * We store all created iframes here to re-use
 * @type {Object}
 */
LoadMgr.frameStorage = {};
/**
 * Store all known postToServer.html
 * @type {Object}
 */
LoadMgr.p2sStorage = {};

/**
 * This keeps context containing needed details about request/response
 */
LoadMgr.contexts = {};
LoadMgr.currFrameId = 0;
LoadMgr.ieVersion = getBrowserMajorVer(true);

LoadMgr.init = false;

/**
 * This manager is responsible for doing cross-domain requests via iframe-proxy
 * @constructor
 */
function LoadMgr() {
    if (!LoadMgr.init) LoadMgr.init = LoadMgr._init();
}

LoadMgr._init = function () {
    if (window["postMessage"] == null) return;

    if (window.addEventListener)
        window.addEventListener("message", LoadMgr.handleSuccess, false);
    else if (window["attachEvent"])
        window.attachEvent("onmessage", LoadMgr.handleSuccess);
    else
        window.onmessage = LoadMgr.handleSuccess;

    // init all known postToServer.htm paths
    LoadMgr.putItemToP2sStorage(urls.vanityURL, "/tagserver/postToServer.htm");
    LoadMgr.putItemToP2sStorage(urls.mediaRootURL, "/tagserver/postToServer.htm");
    LoadMgr.putItemToP2sStorage(urls.chatRouterVanityDomain, "/chatrouter/postToServer/postToServer.htm");
    //RTDEV-6247 for localstorage in Safari, it always need to usd https protocol.
    LoadMgr.putItemToP2sStorage(urls.cobrowseURL, "/cobrowse/postToServer.htm", "https");

    return true;
};

LoadMgr.handleIESuccess = function (data) {
    var event = {};
    event.data = data;
    LoadMgr.handleSuccess(event);
};

LoadMgr.putItemToP2sStorage = function(url, p2pPath, protocol) {
    var parsedUrl = parseUrl(url);
    LoadMgr.p2sStorage[parsedUrl.host] = parsedUrl.host + p2pPath;
    if (protocol) {
        LoadMgr.p2sStorage[parsedUrl.host].protocol = protocol;
    }
};

/**
 * Handles messages coming from iframe-proxy, it prepares context and calls corresponding callback function
 * @private
 * @param {Object} event
 * @return {Boolean}
 */
LoadMgr.handleSuccess = function (event) {
    if (!event.data) return false;

    var data;
    if (typeof(event.data) == "string") {
        // for old browser versions
        data = LoadMgr.convertStrToArray(event.data);
    } else {
        data = event.data;
    }

    if (data && data.length > 1 && data[0]) {
        var id = data[0];
        var context = LoadMgr.getContext(id);

        if (context) {
            context.origin = event.origin;
            var cmd = data[1];
            context.id = id;
            if (data.length > 2) {
                context.responseStatus = data[2];
                context.responseHeaderCacheControl = data[3];
                context.contentType = data[4];

                if (context.contentType.indexOf("application/json") > -1) {
                    try {
                        context.data = MixIns.JSON.parse(cmd);
                    } catch (e) {
                        logErrorToTagServer("LoadMgr.handleSuccess: " + e.message +
                            ". [" + (CHM.getChatID() ? "chatID=" + CHM.getChatID() : "customerID=" + Inq.getCustID()) +
                            ", siteID=" + Inq.getSiteID() + "]");
                    }
                } else if (context.contentType.indexOf("image") > -1) {
                    // when this case happens then it's our logger, which uses image content type for old 'script-tag' usage
                    LoadMgr.unregisterContext(id);
                    return false;

                } else {
                    context.data = cmd;
                }
            } else {
                context.data = cmd;
                // it's command, should be executable
                context.eval = true;
            }

            if (context.callbackFun) {
                context.callbackFun.call(undefined, context);
            }

            LoadMgr.unregisterContext(id);
        } else {
            log("Warning! Could not find context for ID " + id);
        }
    }

    return false;
};

LoadMgr.registerContext = function (id, context) {
    LoadMgr.contexts[id] = context;
};

LoadMgr.unregisterContext = function (id) {
    delete LoadMgr.contexts[id];
};

LoadMgr.getContext = function (id) {
    return LoadMgr.contexts[id];
};

LoadMgr.convertStrToArray = function (str) {
    var arr = str.split("||");
    for (var i = 0; i < arr.length; i++) {
        arr[i] = decodeURIComponent(arr[i]);
    }
    return arr;
};

/**
 * postRequestToIframeProxy - use an iframe-proxy to do some work
 * details:
 *    An IFRAME with source from domain of the vanity domain performs work specified by the request parameter.
 * @param {string} url    server path to postToServer.html
 * @param {Array} request       the command and data for the proxy-iframe to run the format is command||data1||data2...||datan
 * @param {string} id            the unique ID of request
 * @param {Object} context      object for events
 */
LoadMgr.prototype.postRequestToIframeProxy = function (url, request, id, context) {
    try {
        if (id && context) LoadMgr.registerContext(id, context);

        var parsedUrl = parseUrl(url);
        var host = parsedUrl.host;
        var p2pPath = LoadMgr.p2sStorage[host];
        var protocol = p2pPath && p2pPath.protocol ? p2pPath.protocol : parsedUrl.protocol;

        var key = protocol + "://" + host;
        var frameItem = LoadMgr.frameStorage[key];
        if (!frameItem) {
            var iframe = document.createElement("iframe");
            iframe.id = "post_box_" + (++LoadMgr.currFrameId);
            iframe.name = "_none"; // default, some browsers like Safari set name to ID value if it's empty
            iframe.src = p2pPath ? (protocol + "://" + p2pPath) : url;
            iframe.style.cssText = "overflow: hidden; display: none; border: none; top:0px;left:0px;width: 1px; height: 1px;";

            // store this iframe for future re-usage
            frameItem = {frame:iframe, loaded:false, reqQueue:[], name:""};
            LoadMgr.frameStorage[key] = frameItem;

            var that = this;

            var iframCallback = function () {
                // send all waiting requests from queue
                that.sendRequest(frameItem);
                frameItem.loaded = true;
            };

            if (window.addEventListener) {
                iframe.addEventListener("load", iframCallback, false);
            } else if (iframe.attachEvent) {
                iframe.attachEvent('onload', iframCallback);
            } else {
                iframe.onload = iframCallback;
            }

            document.getElementsByTagName("body")[0].appendChild(iframe);
        }

		// store the request in queue
		frameItem.reqQueue.push(request);
        if (frameItem.loaded) {
            this.sendRequest(frameItem);
        }
    } catch (e) {
        if (window.console) window.console.error(e.message, e);
        logErrorToTagServer("LoadMgr.postRequestToIframeProxy: " + e.message +
            ". [" + (CHM.getChatID() ? "chatID=" + CHM.getChatID() : "customerID=" + Inq.getCustID()) + ", siteID=" + Inq.getSiteID() + "]");
    }
};

/**
 * TODO remove this method after retiring IE7
 * Updates iframe name
 * @param {String} id
 * @param {String} url
 */
LoadMgr.prototype.updateFrameName = function (id, url) {
    var parsedUrl = parseUrl(url);
    var host = parsedUrl.host;
    var p2pPath = LoadMgr.p2sStorage[host];
    var protocol = p2pPath && p2pPath.protocol ? p2pPath.protocol : parsedUrl.protocol;
    var key = protocol + "://" + host;

    var frameItem = LoadMgr.frameStorage[key];
    if (frameItem) {
        var iframe = frameItem.frame;
        var name = frameItem.name;
        if (name.length > 0) {
            var cmnds = name.split("&&");
            var rem_indx = -1;
            for (var i = 0; i < cmnds.length; i++) {
                var cmd_id = cmnds[i].split("||")[1];
                if (cmd_id == id) {
                    rem_indx = i;
                    break;
                }
            }
            // remove found element and form new name based on it
            var new_name = cmnds.splice(rem_indx, 0).join("&&");
            frameItem.name = new_name;
        }
    }
};

/**
 * Sends requests storing in queue via iframe-proxy. Here it uses two approaches:
 * 1) HEML5 browsers. It simply sends request via postMessage
 * 2) Non-HTML5 browsers. This page communicates with iframe-proxy via its name which listened each time after some period.
 * @private
 * @param {Object} frameItem
 */
LoadMgr.prototype.sendRequest = function (frameItem) {
    var iframe = frameItem.frame;
    try { /* Let's find out if postMessage is available */
        var postMessageSupported = window["postMessage"] != null;
        if (postMessageSupported) {
            /* Now we need the window for the IFRAME so we can post a message to it */
            var win = iframe.contentWindow;
            // send all waiting requests from queue
            for (var i = 0; i < frameItem.reqQueue.length; i++) {
                /* If the window is accessible then post the message, otherwise fall through and make a new IFRAME */
                if (win != null) {
                    if (LoadMgr.ieVersion > 0 && LoadMgr.ieVersion <= 9 && (typeof frameItem.reqQueue[i]) != "string") {
                        // we still need this workaround coz ie < 10 converts first arg to string
                        win.postMessage(frameItem.reqQueue[i].join("||"), "*");
                    } else {
                        win.postMessage(frameItem.reqQueue[i], "*");
                    }
                }
            }

        } else {
            var names = frameItem.name;
            for (var i = 0; i < frameItem.reqQueue.length; i++) {
                if (names.length > 0) {
                    names += "&&" + frameItem.reqQueue[i].join("||");
                } else {
                    names = frameItem.reqQueue[i].join("||");
                }
            }

            // fix for ie7
            window.frames[iframe.id].name = names;
            frameItem.name = names;
        }

        frameItem.reqQueue.clear();
    } catch (e) {
        if (window.console) window.console.error(e.message, e);
        logErrorToTagServer("LoadMgr.sendRequest: " + e.message +
            ". [" + (CHM.getChatID() ? "chatID=" + CHM.getChatID() : "customerID=" + Inq.getCustID()) + ", siteID=" + Inq.getSiteID() + "]");
    }
};


	/**
	 * Media Manager
	 * @class MediaMgr
	 * @constructor
	 * @name MediaMgr
	 * @param {Object} data containing the database chat themes and spec and c2c themes and specs.
	 * @borrows Absorber#absorb as #absorb
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @see Absorber
	 * @see FrameworkModule
	 */
	function MediaMgr(data) {
		this._frameworkModule("mm");
		this.absorb(data);
		// make all data clonable
		for(var n1 in data){
			for(var n2 in data[n1]){
				MixIns.clonize(data[n1][n2]);				
			}
		}
	}
	MixIns.prepare(MediaMgr).mixIn(MixIns.Absorber).mixIn(MixIns.FrameworkModule);
	MediaMgr.prototype.start = MediaMgr.prototype.reset = MediaMgr.prototype.init = function(){};
	/**
	 * Retrieves the C2C spec for a given id.
	 * @param id Number The id of the c2c spec to be retrieved. null safe.
	 * @param subtree Boolean will return the whole C2CSpec/Theme with the Chat spec/theme as subtree if true. Only the c2cSpec if false or undefined.
	 * @return Object The c2cSpec for the given id. Never null.
	 * @throws Error if no spec is found for the given id.
	 */
	MediaMgr.prototype.getC2CSpec = function(id, subtree) {
		var val = this["c2cSpecs"][id];
		if(isNullOrUndefined(val)){
			throw ("MediaMgr-> no c2c spec for id="+id);
		}
		val = MixIns.mixAbsorber(val.clone());
		if(!!subtree)
			val.absorb({c2cTheme:this.getC2CTheme(val['thId']), chatSpec:this.getChatSpec(val['chSpId'], subtree)});
		return val;
	};
	/**
	 * Retrieves the C2C theme for a given id.
	 * @param id Number The id of the c2c theme to be retrieved. null safe.
	 * @return Object A clone of the c2c theme for the given id. Never null.
	 * @throws Error if no theme is found for the given id.
	 */
	MediaMgr.prototype.getC2CTheme = function(id) {
		var val = this['c2cThemes'][id];
		if(isNullOrUndefined(val)){
			throw ("MediaMgr-> no c2c theme for id="+id);
		}
		return MixIns.mixAbsorber(val.clone());
	};
	
	/**
	 * Retrieves the chat spec for a given id.
	 * @param id Number The id of the chat spec to be retrieved. null safe.
	 * @return Object A clone of the chat spec for the given id. Never null.
	 * @throws Error if no spec is found for the given id.
	 */
	MediaMgr.prototype.getChatSpec = function(id, subtree) {
		var val = this["chatSpecs"][id];
		if(isNullOrUndefined(val)){
			throw ("MediaMgr-> no chat spec for id="+id);
		}
		val = MixIns.mixAbsorber(val.clone());
		if(!!subtree)
			val.absorb({chatTheme:this.getChatTheme(val['ctId'])});
		return val;
	};
	/**
	 * Retrieves the chat theme for a given id.
	 * @param id Number The id of the chat theme to be retrieved. null safe.
	 * @return Object A clone of the chat theme for the given id. Never null.
	 * @throws Error if no theme is found for the given id.
	 */
	MediaMgr.prototype.getChatTheme = function(id) {
		var val = this['chatThemes'][id];
		if(isNullOrUndefined(val)){
			throw ("MediaMgr-> no chat theme for id="+id);
		}
		return MixIns.mixAbsorber(val.clone());
	};
	
	/**
	 * Merges an xml c2c theme into a DB version of the c2c theme.
	 * @param the xml c2c theme to merge into the db version. Uses the c2c theme id to get the db data
	 * @returns a complete c2c theme instance with data from the c2cTheme param mixed into it
	 */
	MediaMgr.prototype.mergeC2CTheme = function(c2cTheme) {
		var val = !!c2cTheme.id ? this.getC2CTheme(c2cTheme.id) : this.getC2CThemeByName(c2cTheme.name);
		if(!!val){
			return val.absorb(c2cTheme);
		}
		log("MediaMgr Error: c2cTheme not found for xml theme id="+c2cTheme.id);
		return null;
	};

	/**
	 * Merges an xml chat theme into a DB version of the chat theme.
	 * @param the xml chat theme to merge into the db version. Uses the chat theme id to get the db data
	 * @returns a complete chat theme instance with data from the chatTheme param mix into it
	 */
	MediaMgr.prototype.mergeChatTheme = function(chatTheme) {
		var val = !!chatTheme.id ? this.getChatTheme(chatTheme.id) : this.getChatThemeByName(chatTheme.name); // db value
		if(!!val){
			for(var n in chatTheme){
				val[n] = chatTheme[n];
			}
			return val;
		}
		log("MediaMgr Error: chatTheme not found for xml theme id="+c2cTheme.id);
		return null;
	};

	/**
	 * Merges an xml chat spec into a DB version of the chat spec.
	 * @param the xml chat spec to merge into the db version. Uses the chat spec id to get the db data
	 * @returns a complete chat spec instance with data from the chatSpec param mixed into it. Includes
	 * merged child chat theme in return value
	 */
	MediaMgr.prototype.mergeChatSpec = function(chatSpec) {
		var val = !!chatSpec.id ? this.getChatSpec(chatSpec.id, true) : this.getChatSpecByName(chatSpec.name, true); // gets whole subtree
		if(!!val){
			if(!!chatSpec.chatTheme){
				val['chatTheme'] = this.mergeChatTheme(chatSpec.chatTheme);
			}
			for(var n in chatSpec){
				if(n=='chatTheme')
					continue; // skip chat theme... we already have them
				val[n] = chatSpec[n];
			}
			return val;
		}
		log("MediaMgr Error: chatTheme not found for xml theme id="+c2cTheme.id);
		return null;
	};
	
	/**
	 * Merges the DB c2c spec with an xml override model. Designed to safely grab DB
	 * data and selectively override with an xml data model.
	 * @param c2cSpec Object The c2c spec from xml. Guaranteed to have an ID defined. null safe.
	 * @param excludeChatData Boolean If true, return a model with no chat data models defined. If false
	 * or undefined, return the whole subtree.
	 * @return Object A clone of the chat theme for the given id. Never null.
	 * @throws Error if no spec is found for the given xml spec id.
	 */
	MediaMgr.prototype.mergeC2CSpec = function(c2cSpec, excludeChatData) {
		if(!isNullOrUndefined(c2cSpec)){
			// grab the xml version and mix it in with the database version...
			var val = !!c2cSpec.id ? this.getC2CSpec(c2cSpec.id, true) : this.getC2CSpecByName(c2cSpec.name, true); // pure DB version with subtree.
			if(!!excludeChatData){
				delete val.chatSpec;
			}
			if(!!c2cSpec.c2cTheme){
				val['c2cTheme'] = this.mergeC2CTheme(c2cSpec.c2cTheme);
			}
			if(!!c2cSpec.chatSpec && !excludeChatData){
				val['chatSpec'] = this.mergeChatSpec(c2cSpec.chatSpec);
			}
			for(var n in c2cSpec){
				if(n=='c2cTheme' || n=='chatSpec')
					continue; // skip c2c theme and chat spec... we already have them
				val[n] = c2cSpec[n];
			}
			return val;
		}
		else{
			log("MediaMgr Error: bad c2cSpec passed. Check XML rule actions. ref="+c2cSpec)
		}
		return null;				
	};

    MediaMgr.prototype.getModelIdByName = function(modelName, instanceName){
        var result = null;
        for(var instance in this[modelName]){
            if(this[modelName][instance].name == instanceName){
                result = instance;
                break;
            }
        }
        if(!result){
            throw ("No media for name= "  + instanceName + " found in list of " + modelName);
        }
        return result;
    };

    MediaMgr.prototype.getChatThemeByName = function(name){
        var id = this.getModelIdByName('chatThemes', name);
        return this.getChatTheme(id);
    };

    MediaMgr.prototype.getChatSpecByName = function(name, subtree){
        var id = this.getModelIdByName('chatSpecs', name);
        return this.getChatSpec(id, subtree)
    };

    MediaMgr.prototype.getC2CThemeByName = function(name){
        var id = this.getModelIdByName('c2cThemes', name);
        return this.getC2CTheme(id);
    };

    MediaMgr.prototype.getC2CSpecByName = function(name, subtree){
        var id = this.getModelIdByName('c2cSpecs', name);
        return this.getC2CSpec(id, subtree);
    };

	/**
	 * Construct a URI instance
	 * @constructor
	 * @class
	 * @param {String} uri
	 * @requires MixIns.Absorber 
	 */
	function URI(uri){
		/* RU */
		this._uri=uri;
		this.parseURI();
	}
	MixIns.prepare(URI).mixIn(MixIns.Absorber);
	
	URI.partNames = ["source","protocol","authority","domain","port","path","dirPath","fileName","query","anchor"];
	/**
	 * parses a URI into component parts
	 * @static
	 * @param {string} _uri uri to be decomposed
	 * @return {Object} object that represents the "decomposed" URI. parts include: 
	 * source, protocol, authority, domain, port, path, dirPath, fileName, query, anchor
	 */
	URI.parseURI=function(_uri){
		/* RU */
		var obj = {qMap:{}};
	    var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(_uri);
	    for(var i = 0; i < URI.partNames.length; i++){obj[URI.partNames[i]] = (uriParts[i] ? uriParts[i] : "");}
	    if(obj.dirPath.length > 0){obj.dirPath = obj.dirPath.replace(/\/?$/, "/");}
	    if(obj.query){
			var p = obj.query.split("&");
			for (var i = 0; i < p.length; ++i){
				var kvp = p[i].split("=");
				obj.qMap[kvp[0]] = (kvp.length>1)?unescape(kvp[1]):"";
			}
	    }
	    if(obj.domain){
	    	obj.rootDomain=obj.domain;
	    	var arr = obj.domain.split('.');
	    	if(arr.length>2){
	    		for(var idx = 0;idx < arr.length-2;idx++) arr.shift();
	    		obj.rootDomain=arr.join('.');
	    	}
	    }
	    return obj;
	};
	/**
	 * parses the URI of the instance and saves the data internally
	 */
	URI.prototype.parseURI=function(){
		this.absorb(URI.parseURI(this._uri));
	};
	
	/**
	 * gets the query value of the query name string given.
	 * @param {string} q the name of the query param to be retrieved
	 * @return {string} the value of the query param. null if not existent.
	 */
	URI.prototype.getQ=function(q){
		/* RU */
		var v = this.qMap[q];
		return (typeof v=="undefined"||v==null)?null:v;
	};
	/**
	 * Manages all named functions and provides a framework to invoke
	 * functions in the customer window context
	 * @param {Object} namedFcns
	 * @returns {FcnMgr}
	 */
	function FcnMgr(namedFcns){
		this.fcns = namedFcns;
	}
	FcnMgr.idx = 0;

	/**
	 * gets a named frunction from the registered function lib.
	 * @param {String|Function} fcnOrFcnName The name of the function to retrieve. If a function is passed, then that function is returned.
	 * @throws if fcnOrFcnName param is null or undefined, if the fcn is not found, or the fcnOrFcnName
	 * is of a type other than string or function
	 */
	FcnMgr.prototype.getFcn = function(fcnOrFcnName){
		if(!fcnOrFcnName)
			throw "function name is null or undefined";
		switch(typeof fcnOrFcnName){
		case "string":
		case "function":
			break; // the above are the only types allowed
		default:
			throw "illegal parameter type: "+(typeof fcnOrFcnName);
		}
		var fcn = (typeof fcnOrFcnName=="string")?this.fcns[fcnOrFcnName]:fcnOrFcnName;
		if(!fcn)
			throw "function is null or undefined";
		return fcn;
	}

	/**
	 * Publishes the given function (or named function from the registered lib)
	 * to the parent window and then invokes the function with the given arguments
	 * in the parent window returning the result when complete. May throw certain exceptions.
     * if v3Lander is undefined then return with null from the method
	 * @param fcnOrFcnName {String|Function} Either the name of the function to be invoked or the function itself.
	 * @see FcnMgr#getFcn() for errors thrown
	 * @throws if the function invocation throws an error
	 */
	FcnMgr.prototype.callExternal = function(fcnOrFcnName){
        //RTDEV-867. Issue 'win.v3Lander is undefined' is suitable for Firefox 11 and higher.
        if(!window.self.parent.v3Lander){
            logErrorToTagServer("window.self.parent.v3Lander is undefined, callExternal returns null");
            return null;
        }
		var fcn = this.getFcn(fcnOrFcnName);
		var name = this.publish(fcn);
		var args = this._normArgs(arguments);
		var retval = null;
		try{
            retval = window.self.parent.v3Lander.FMProxy.getFcn(name).apply(window.self.parent, args);
		}catch(err){
			throw "function eval failed. err="+err.toString();
		}
		this.unpublish(name);
		return retval;
	};

	/**
	 * Removes the first argument from the list of arguments provided. We
	 * do this because the remaining args are presumably for the target function
	 * The first arg (0 arg) is the name of the function to be invoked and should not
	 * be passed to that function as an argument.
	 */
	FcnMgr.prototype._normArgs = function(argumnts){
		var args = [];
		if(argumnts.length>1){
			for(var idx=1; idx<argumnts.length; idx++){
				args[idx-1] = argumnts[idx];
			}
		}
		return args;
	};

	/**
	 * @param fcnOrFcnName {String|Function}
	 * @see FcnMgr#getFcn() for errors thrown
	 * @throws if the function invocation throws an error
	 */
	FcnMgr.prototype.exec = function(fcnOrFcnName){
		var fcn = this.getFcn(fcnOrFcnName);
		try{
			return fcn.apply(self,  this._normArgs(arguments));
		}catch(err){
			throw "function eval failed. err="+err.toString();
		}
	};
	/**
	 * publishes a given function
	 */
	FcnMgr.prototype.publish = function(fcn, name){
		var name = !!name?name:'fcn_'+FcnMgr.idx++;
        window.self.parent.v3Lander.FMProxy.addFcn(name, fcn.toString());
		return name;
	};

	/**
	 * Deletes a named function from the parent peer.
	 */
	FcnMgr.prototype.unpublish = function(name){
        window.self.parent.v3Lander.FMProxy.removeFcn(name);
	};
// When debugging CookieMgr for IE6 and IE7, there is a way to make modern browsers behave like like IE7:
// setup window object as if window.postMessage HTML5 API is unavailable:
// Append "window.postMessage=null;" to JS files (but NOT "delete window.postMessage" - it restores native implementation).

		/**
		 * CookieMgr is responsible for saving and reading name-value pairs to/from a named cookie.
		 *
		 * @constructor
		 * @param {string} id is the identifier for this object
		 * @param {boolean} xd specifies whether this site uses cross-domain cookies
		 * @author joconner
		 * @borrows RemoteCaller#onRemoteCallback as #onRemoteCallback
		 * @borrows RemoteCaller#callRemote as #callRemote
		 * @borrows FrameworkModule#init as #init
		 * @borrows FrameworkModule#start as #start
		 * @borrows FrameworkModule#reset as #reset
		 * @see RemoteCaller
		 * @see FrameworkModule
		 * @see #getInstance(xd)
		 */
		function CookieMgr(id, xd) {
			this._frameworkModule(id);
			this.xd = xd;
			this.cookies = {}; // used in cross-domain mode
			this.JSON = MixIns.JSON;
			this.version = 3;
			this.initMessagingComplete = false; /*used to ensure initialization happens only once */
			this.set3rdPartyCookieBusy = false;
	        this.set3rdPartyCookieQueue = [];
	        this.overflowLogged = false; // flag used to avoid TS log flood (log overflow once per landing)
	        this.cleanupFailLogged = false; // flag used to avoid TS log flood (log cleanup failure once per landing)
			this.trdPartyCookieCnt = 0;     // 3rd party cookie counter (for vital).
			this.isLSused = false;          // True if localStorage is used.
			this.cntHandlerTried = 0;       // how many times checked 3rd party cookie commited handler function.
		}
		MixIns.prepare(CookieMgr).mixIn(MixIns.FrameworkModule).mixIn(MixIns.RemoteCaller);
		CookieMgr.CM = null;
        var PERSISTENT_COOKIE_ALLOWED = "pc";

		/**
		 * Retrieve the singleton instance of CookieMgr. The first call to this method
		 * will determine whether cross-domain is supported. Subsequent calls will
		 * ignore the xd param.
		 * @param xd a boolean flag for cross-domain mode; true if cross-domain, false otherwise;
		 * @return the CookieMgr instance
		 */
		CookieMgr.getInstance = function(xd) {
			if(CookieMgr.CM == null) {
				CookieMgr.CM = new CookieMgr("CM", xd);
			}
			return CookieMgr.CM;
		};

		CookieMgr.prototype.init = function(){
			if (this.initialized) return;
			this.initialized = true;
			log(this.getID()+" initialized.");
			this.initMessagingComplete = this.initMessaging();
		};

		CookieMgr.prototype.start = function() {
			if (this.started) return;
			this.started=true;
		};

		/**
		 * Obtains a reference to the CookieMgr "peer" in the main window if in persistent window.
		 * @returns null if not persistent win OR the broser's same origin policy prohibits communication.
		 * Otherwise it returns a ref to the CM in the main window.
		 */
		CookieMgr.prototype.getPeer = function(){
			return (isSameOrigin() && isPersistentWindow())?window.parent.opener.inqFrame.Inq.CM : null;
		};

		/**
		 * Method that updates the name-value pair in a given cookie cache. This will only be set in memory
		 * and, when in persistent window, also updates the cookie cache of the main window (same origin permitting).
		 * If value is undefined, name-value pair is deleted from cache.
		 * @param {String} cName The cookie name for the n-v pair
		 * @param {String} name Name of the value to be set in the cookie cache.
		 * @param {Object} value the value to be set for the given name in the cookie cache.
		 * 	If undefined, name-value pair is deleted from cookie.
		 * @param {boolean} isJSON optional flag that tells the method how to treat the value.
		 * If undefined, null or false, the value will be treated as a std pass-thru object. If true
		 * then the value will be treated as a JSON string to be parsed before processing.
		 */
        CookieMgr.prototype.addValueToCookieCache = function(cName, name, value, isJSON, update){
            if (value != undefined) {
                value = !!isJSON?MixIns.JSON.parse(decodeURIComponent(value)):value;
            }
            if(!update) {
                if(isPersistentWindow()) {
                    try{
                        var cmPeer = this.getPeer();
                        if(!!cmPeer) {
                            if(cmPeer.persistentWindow != win) {
                                cmPeer.persistentWindow = win;
                            }
                            if (value != undefined) {
                                cmPeer.addValueToCookieCache(cName, name, encodeURIComponent(MixIns.JSON.stringify(value)), true,true);
                            } else {
                                cmPeer.addValueToCookieCache(cName, name,null,null,true);
                            }
                        }
                    }catch(err) {
                        log("Error propagating value to main window from Cookie manager.");
                    }
                }
                else {
                    try {
                        var persistentWindow = this.persistentWindow;

                        if (!!persistentWindow) {
                            var cmPersistent = persistentWindow.inqFrame.Inq.CM;
                            if (!!cmPersistent) {
                                if (value != undefined) {
                                    cmPersistent.addValueToCookieCache(cName, name, encodeURIComponent(MixIns.JSON.stringify(value)), true, true);
                                } else {
                                    cmPersistent.addValueToCookieCache(cName, name, null, null, true);
                                }
                            }
                        }
                    } catch (err) {
                        log("Error propagating value to persistent");
                    }
                }

            }
            if (value == undefined) {
                if (this.cookies[cName]) {
                    delete this.cookies[cName][name];
                }
            } else {
                if (!this.cookies[cName]) {
                    this.cookies[cName] = {};
                }
                if(typeof value == 'object'){
                    try{
                        value = MixIns.JSON.parse(MixIns.JSON.stringify(value));
                    } catch(e){
                        log("Cookie value is malformed JSON : " + e);
                    }

                }
                this.cookies[cName][name] = value;
            }
        };

        /**
		 * Write a name-value pair to a cookie.
		 * If value is undefined, name-value pair is deleted from cookie.
		 * @param {CookieResource} cRes
		 * @param {String} name of a key or variable
		 * @param {Object} value of the key or variable. If undefined, name-value pair is deleted from cookie.
		 */
		CookieMgr.prototype.write = function(cRes, name, value) {
			var cObj = null;
			var cVal = null;
			var cName = cRes.getName();
			var cookieError = null;

			// PERSISTENT_COOKIE_ALLOWED resource is used to test if persistent cookie are allowed, it is excluded here to avoid recursion.
			// undefined value means cookie size won't be increased, thus no need to do overflow prediction
			// there is no need to compare Cookie size if localStorage is used
            if (cName != PERSISTENT_COOKIE_ALLOWED && value != undefined && !this.isLSused) {

				var predictedResult;
	            try{
		            predictedResult = this.predictOverflow(cRes, name, value);
	            }catch(err) {
		            if (err.constructor === CookieDomainSizeError || err.constructor === CookieSizeError) {
			            cookieError = err;
			            log(cookieError.toString()); // log the result to console
			            predictedResult = cookieError.getData().result; // record the overage
		            }
	            }
	            // if we are overflowing the cookie domain space, we need to cull cookies
	            // (and not the one we are writing to if we can help it)
				if (!!cookieError && predictedResult != 0) {
					var overflowObject = {_domain: "error", evt: "cookieoverflow", params: {custID: Inq.getCustID(), siteID: getSiteID(), resource: cName, varId: name, size: JSON.stringify(value).length, sessionId: getSessionID(), incAssignmentID: getIncAssignmentID(), incGroup: getIncGroupID()}};
					var msg = "Cookie overflow!";
					if(cookieError.constructor == CookieDomainSizeError) {
						var pruneSuccessful = this.pruneCookieOnOverflow(predictedResult, cRes.getPurgePriority());
						msg += " New cookie overflows domain limit";
						if (pruneSuccessful) {
							log("ERROR: variable named '" + name + "' (size=" + value.length + ") write aborted and cookie (name=" + cName + ") overflowed and dropped. Variable: {" + name + ":\"" + value + "\"");
						}
						overflowObject["pruneSuccess"] = pruneSuccessful;
					}
					else if(cookieError.constructor === CookieSizeError){
						// at this point we are overflowing a single cookie and can't write any more data to it
						// The only thing we CAN do is to ignore the write and log the problem. Cookie is abused.
						msg += " cookie is packed to limit. Data dropped.";
						log("WARNING: Cookie overflowed when writing variable. varId="+name+", cookieName="+cName+", varSize="+value.length+", attemptedValue="+value);
					}
					if(!this.overflowLogged) {
						overflowObject["Log2ETL"] = true;
						overflowObject["params"]["msg"] = msg;
						this.send(urls.loggingURL, {line: JSON.stringify(overflowObject)});
						this.overflowLogged = true;
					}
					if(cookieError.constructor===CookieSizeError){
						return; // Prevent write when exceeding cookie size
					}
				}
			}

			/* Only update the xd (cross domain) cookie if it has changed,
			 * The cookies are saved one request after another,
			 * Writing unchanged values just causes over queueing of the requests
			 * We check to see if the object has been modified by comparing the "stringify'ed" objects
			 * If the json string has any "out of order" values, we get a false difference and the cookie goes out, no problem.
			 */
			if(this.xd) {
				var oldValue = this.JSON.stringify(this.cookies[cName]);				/* get the cookie value before adding new stuff */
				this.addValueToCookieCache(cName, name, value);	/* add the new stuff to the cookie object */
				if( cRes.getResourceID() == "vital" ) { 		/* If this is vital, then update the version */
					this.cookies[cName]["v"] = this.version;
					this.cookies[cName]["vcnt"] = this.trdPartyCookieCnt++ ;
                    this.cookies[cName]["vtime"] = (new Date).getTime() ;
				}
				var newValue = this.JSON.stringify(this.cookies[cName]);
                /*
                 * In case we are overriding the incrementalityID value, write that error to server logs.
                 */
                try {
                    if (cRes.getResourceID() == "vital" && !isNullOrUndefined(oldValue) && oldValue.indexOf("_iID") != -1 ) {
                        if (isNullOrUndefined(newValue) || newValue.indexOf("_iID") == -1) {
                            ROM.send(urls.loggingURL, {level:'ERROR', line: ("overriding the incrAssignmentID for siteID="+Inq.getSiteID()+" customerID="+Inq.getCustID()+"oldValue="+oldValue+"newValue ="+newValue)});
                        }
                    }
                } catch(e){
                    log("Error:overriding the valid incrAssignmentID for siteID"+Inq.getSiteID()+" customerID="+Inq.getCustID());
                }

                /* We are overriding the test for unchanged cookie because of
                     *  Jira Ticket: http://jira.touchcommerce.com/browse/MAINT27-563
                     *  Which will be addressed in the following release cycle.
                     */
                if (true || oldValue != newValue){			/* only request the cookie to be set if it has been changed */
					this.set3rdPartyCookie("SCBR3_PM", siteID, cName, this.cookies[cName], !cRes.getPath() ? null : cRes.getPath(), cRes.getLifetime());
				}
			} else {
				var c = this._getCookie(cName);
				if(c == null) {
					cObj = {};
				} else {
					try {
						cObj = this.JSON.parse(c);
					} catch(e) {
						cObj = {};
					}
				}
				/* If (c) above is a null string and it as json parsed, we are left with cObj being null
				   So we will check to make sure cObj is at least a {} */
				if (cObj == null) cObj = {} ;
				if (value == undefined) {
					delete cObj[name];
				} else {
					cObj[name] = value;
				}
				if( cRes.getResourceID() == "vital" ) {
					cObj["v"] = this.version;
				}
				cVal = this.JSON.stringify(cObj);
				this._setCookie(cRes, cVal);
			}
		};

		CookieMgr.prototype.logErrorToTS = function (msg) {
			log("ERROR: " + msg);
			if (!this.cleanupFailLogged) { // log cleanup failure to TS once per landing
				msg = prepareLoggingContext(msg);
				logMessageToTagServer(msg, LOG_LEVELS.ERROR);
				this.cleanupFailLogged = true;
			}
		};

		/**
		 * Read a value from a cookie
		 * @param {CookieResource} cRes defines the cookie name and its properties
		 * @param {String} name is the name/key associated with the value
		 * @return the value associated with the name, which will need to be cast inside
		 * a variable to determine true type
		 * @type Object
		 */
		CookieMgr.prototype.read = function(cRes, name) {
			var cVal = null;
			var cName = cRes.getName();
			if (this.xd) {
				try {
					if (!isNullOrUndefined(this.cookies[cName])) {
//                                        if (!(typeof(this.cookies[cName])=="undefined" || this.cookies[cName]==null)) {

						cVal = this.cookies[cName][name];
					}
				} catch(e) {
					// return default null value because
					// either the cookie or the name/value
					// have not yet been written
					log(e);
				}
			} else {
				var c=this._getCookie(cName);
				var cObj = null;
				try {
					if (c) {
						cObj = this.JSON.parse(c);
						if(cObj != null) {
							// retrieve name-value
							cVal = cObj[name];
						}
					}
				} catch(e) {
					log(e);
				}
			}
			return cVal;


		};

		/**
		 * Clear a cookie from the document. If in xd mode, this
		 * method clears the 3rd party cookie. Clearing a cookie
		 * means that its name-value pairs are removed.
		 * @param {String} cResId id of the cookie resource to clear.
		 */
		CookieMgr.prototype.clear = function(cResId) {
			var cRes = resources[cResId];
			if (this.xd) {
				var cName = cRes.getName();
				delete this.cookies[cName];
				// clear cookie in browser
				this.set3rdPartyCookie("SCBR3_PM", siteID, cName, "", null, -1*86400000);//set date in past to expire the cookie
				// Log the clearing of the cookie in server log
				this.send(urls.loggingURL, {level:"info", line: ("clear cookie "+cName+", siteID="+siteID+", pageID="+LDM.getPageID()+", custID="+Inq.getCustID())});
			} else {
				this.expireCookie(cResId); // make browser delete this cookie
			}
		};

        /**
         * Dump all cookie values. For xd mode only
		 * Ask the IFrame-Proxy to dump the cookie value to the TagServer's log
		 * Please see: in postToServer.htm function doCommands command "DUMP"
		 * @return none
		 */
		CookieMgr.prototype.dump = function() {
			if (this.xd) {
                var boxID = "box" + Math.floor(Math.random()*1000011);
                var port = (inqFrame.location.port!="")?":"+inqFrame.location.port:"";
                var parentURL = inqFrame.location.protocol + "//"  +  inqFrame.location.hostname + port + inqFrame.location.pathname ;
                var postCookieRequest = ["DUMP", boxID, "", parentURL, encodeURIComponent(secureHTTP(urls.loggingURL))];
                this.postRequestToIframeProxy(postCookieRequest, boxID);
			}
		};

		/**
		 * CookieSizeError
		 * @param cName {string} cookie name
		 * @param size {number} current size of the target 0cookie
		 * @param delta {number} size of the value to be added to the target cookie
		 * @param limit {number} cookie domain limit for the browser
		 * @param result {number} amount over limit
		 * @constructor
		 */
		function CookieSizeError(cName, size, delta, limit, result){
			this.getData = function(){return {cookieName: cName, oldSize:size, delta:delta, limit:limit, result:result};};
			this.toString = function(){return "CookieSizeError: Cookie size violated, proposed size="+(size + delta)+", limit="+limit+", result="+result;};
		}
		/**
		 * CookieDomainSizeError
		 * @param cName {string} cookie name
		 * @param size {number} current size of the target 0cookie
		 * @param delta {number} size of the value to be added to the target cookie
		 * @param limit {number} cookie domain limit for the browser
		 * @param result {number} amount over limit
 		 * @constructor
		 */
		function CookieDomainSizeError(cName, size, delta, limit, result){
			this.getData = function(){return {cookieName: cName, oldSize:size, delta:delta, limit:limit, result:result};};
			this.toString = function(){return "CookieDomainSizeError: Cookie domain size violated, proposed size="+(size + delta)+", limit="+limit+", result="+result;};
		}

		/**
		 * This function has the same parameters as write() and is used by write() to check if limits will be exceeded
		 * prior to actually updating cookies.
		 * @param {CookieResource} cRes defines the cookie name and its properties
		 * @param {String} name of a key or variable
		 * @param {Object} value of the key or variable
		 * @return 0 if limits are not expected to be exceeded, overflow byte count otherwise
		 */
		CookieMgr.prototype.predictOverflow = function(cRes, name, value) {
			// calculate size of new name-value pair
			var newObj = {};
			newObj[name] = value;
			var newObjSize = encodeURIComponent(this.JSON.stringify(newObj)).length;

			// calculate size of current name-value pair
			var oldObjSize = 0;
			var cName = cRes.getName();
			var cObj = {};
			if (this.xd) {
				if (this.cookies[cName]) {
					cObj = this.cookies[cName];
				}
			} else {
				var c = this._getCookie(cName);
				if(c) {
					try {
						cObj = this.JSON.parse(c);
					} catch(e) {
						// in this unlikely case we will rely on write() function to handle the error
					}
				}
			}
			if (!isNullOrUndefined(cObj[name])) {
				oldObjSize = encodeURIComponent(this.JSON.stringify(cObj[name])).length;
			}

			// negative delta means cookie size will be decreased as result of write
			var predictedDelta = newObjSize - oldObjSize;
			if (predictedDelta > 0) {
				var cResSize = this.getCookieSize(cRes); // get current cookie size
				var cookieLimit = getCookieSizeLimit();
				if (cookieLimit && (cResSize + predictedDelta > cookieLimit)) {
					throw new CookieSizeError(cName,cResSize, predictedDelta, cookieLimit, cResSize + predictedDelta - cookieLimit);
				} else {
					var totalSize = this.getCookieSize(); // get total cookies size for domain
					var cookieTotalLimit = getCookieTotalSizeLimit();
					if (cookieTotalLimit && (totalSize + predictedDelta > cookieTotalLimit)) {
						throw new CookieDomainSizeError(cName, totalSize, predictedDelta, cookieTotalLimit, totalSize + predictedDelta - cookieTotalLimit);
					}
				}
			}
			return 0;
		};

		/**
		 * Returns size the cookie corresponding to the specified CookieResource occupies.
		 * If CookieResource is not specified, total size of cookies in current domain is returned (used for browsers
		 * that set limits for total size of cookies for a domain).
		 * It is a helper method used in cookie overflow detection and cleanup.
		 * @param {CookieResource} cRes defines the cookie name and its properties
		 * @return {number} size of the specified cookie
		 */
		CookieMgr.prototype.getCookieSize = function(cRes) {
			var size = 0;
			if (!cRes) {
				if (this.xd) {
					// Calculation of total cookie size for XD mode makes assumption that only cookies created by
					// IJSF cookie resources reside in vanity domain. W/o this assumption cookie size would
					// have to be requested from IFrame proxy
					for (var res in resources) {
						if (resources[res].constructor === CookieResource) {
							size += this.getCookieSize(resources[res]);
						}
					}
				} else {
					size = document.cookie.length;
				}
			} else {
				var cName = cRes.getName();
				var cVal;
				if (this.xd) {
					cVal = this.JSON.stringify(this.cookies[cName]);
				} else {
					cVal = this._getCookie(cName);
				}
				if (cVal) size = cName.length + 1 + encodeURIComponent(cVal).length;
			}
			return size;
		};

		/**
		 * Performs cleanup of cookies according to RTDEV-6927 guidelines:
		 * Cookies need to be limited for XD and nonXD modes. Core cookies, especially the inqVital cookie, should be
		 * protected at all times. The other cookies should be cleared in the following order and context.
		 * Two categories of cookie space violations apply here:
		 * 1. Cookie domain limit is exceeded
		 * For Domain limit violations, we need to drop cookies in presiding order until enough space is freed to allow
		 * the current cookie write. If enough space is not harvested to allow the write, we log the situation and drop
		 * the write. The following rules apply...
		 *      1a. Non-core cookies should be dropped in order of priority.
		 *      1b. inqState cookie should be cleared first if data exceeds 4k limit on IE6/7 or safari
		 *      1c. inqSession cookie should be cleared 2nd if data exceeds 4k limit on IE6/7 or safari
		 *      1d. inqVital cookie should never be cleared...if we cannot write to the cookie without exceeding the 4k limit,
		 * 	then we should abort the write and log the issue once to the tagserver.
		 * 	For #1c, if a chat is in progress...then we should abort the write rather then purge the session cookie and
		 * 	thus the chat
		 * 2. "per cookie" limit is exceeded.
		 * For "Per Cookie" violations, we drop the write and report the condition to our servers. Core cookies should
		 * not be dropped.
		 * @param {number} byteCountToFree parameter specifying how many bytes must be freed
		 * @param {number} currentCookiePriority parameter specifying the priority of the cookie that is overflowing
		 * @return {boolean} true if required space was freed, false otherwise. If false is returned, write to cookie must be
		 * aborted.
		 */
		CookieMgr.prototype.pruneCookieOnOverflow = function(byteCountToFree, currentCookiePriority) {
			var cookiesToPrune = [];
			var bytesFreed = 0;

			currentCookiePriority = (isNullOrUndefined(currentCookiePriority)?0:currentCookiePriority);
			var _resources = Object.keys(resources).map(function(k){return resources[k];}).filter(function(a){return !isNullOrUndefined(a) && a.constructor===CookieResource && (a.getPurgePriority() > currentCookiePriority); });
			_resources.sort(CookieResource.COOKIE_RESOURCE_PURGE_PRIORITY_SORT_FCN);

			for(var idx=0; idx<_resources.length; idx++){
				var resource = _resources[idx];
				// found an expendable resource
				log("************* "+resource.getResourceID()+" will be cleared.");
				// tally up the cookie bytes to be freed... continue if we don't have enough.
				bytesFreed += this.getCookieSize(resource);
				cookiesToPrune.push(resource); // axe the cookie
				if (bytesFreed >= byteCountToFree) {
					break; // stop chopping resources if we've freed enough space
				}
			}
			if(bytesFreed < byteCountToFree && currentCookiePriority==0) { // only scavenge our core cookies if/when we have freed others first.
				var stateRes = resources["state"]; // chop the state cookie
				bytesFreed +=  this.getCookieSize(stateRes);
				if (bytesFreed >= byteCountToFree) {
					cookiesToPrune.push(stateRes); // we have enough... stop chopping
				} else if (!CHM.isChatInProgress()) {
					// apparently we still need to cut, kill the
					// session cookie only if we are not in a chat
					var sesRes = resources["session"];
					bytesFreed += this.getCookieSize(sesRes);
					if (bytesFreed >= byteCountToFree) {
						cookiesToPrune.push(stateRes);
						cookiesToPrune.push(sesRes);
					}
				}
			}

			// prune what we can
			if (cookiesToPrune.length > 0) {
				// Log clearing of cookies in browser console and TS log
				var cookieNames = cookiesToPrune.collect(function(cres){ return cres.getName();});
				var msg = "Cookie overflow! Trying to clear following cookie(s): " + cookieNames.join(',') + ". ";
				log("ERROR: " + msg);
				if (!this.overflowLogged) { // log overflow to TS once per landing
					msg = prepareLoggingContext(msg);
					this.send(urls.loggingURL, {level:'ERROR', line: msg});
					this.overflowLogged = true;
				}

				for (var i = 0; i < cookiesToPrune.length; i++) {
					this.clear(cookiesToPrune[i].getResourceID());
				}
			}
			return bytesFreed >= byteCountToFree; // we report if we were successful in pruning everything requested
		};

		/**
		 * Set a cookie value. This is a very low-level API that sets an entire cookie in the document. This
		 * is a <b>private</b> method.
		 * @param {CookieResource} cRes
		 * @param {String} cVal
		 * @param {String} cLifetime optional parameter, specifies cookie lifetime in ms; valid values integer >= 0.
		 *
		 */
		CookieMgr.prototype._setCookie = function(cRes, cVal, cLifetime) {

			var name = cRes.getName();
			var lifetime = cRes.getLifetime();
			if (!!cLifetime) lifetime = cLifetime;
			var path = cRes.getPath();
			var domain = cRes.getDomain();
			var secure = cRes.getSecure();

			//set time, it's in milliseconds
			var now = new Date();
			var expires_date = new Date( now.getTime() + lifetime );

			var update = null;
			// pc cookie is used to test weather the browser accepts persistent cookies or not.
			//To make the check the pc cookie has to be a persistent cookie.
			if ((name == PERSISTENT_COOKIE_ALLOWED || this.isPersistentCookiesAllowed()) && lifetime>0){
				update = name + "=" + encodeURIComponent(cVal) +
				";expires=" + expires_date.toGMTString() +
				( ( path ) ? ";path=" + path : "" ) +
				( ( domain ) ? ";domain=" + domain : "" ) +
				( ( secure ) ? ";secure" : "" );
			}
			else {
				// If the browser does not accepts persistent cookies - make all cookies as session cookies
				update = name + "=" + encodeURIComponent(cVal) +
				( ( path ) ? ";path=" + path : "" ) +
				( ( domain ) ? ";domain=" + domain : "" ) +
				( ( secure ) ? ";secure" : "" );
			}

			document.cookie = update ;

		};

		/**
		 * Retrieve an entire cookie.
		 * This is a <b>private</b> method. Access available for easy testing.
		 * @param {String} cName CookieName
		 * @param {String} cName
		 * @return the value of a cookie, null if the cookie does not exist
		 * @type String
		 */
		CookieMgr.prototype._getCookie = function(cName, data) {
			var cookies = this._getCookies(data);
			if(!!cookies && !!cookies[cName]){
				return cookies[cName];
			}
			return null;
		};

		/**
		 * Gets all cookies as name-value pairs in an object map (<String,String>).
		 * This is a <b>private</b> method. Access available for easy testing.
		 * @param {String} data optional data parameter that represents a
		 * cookie string to be parsed
		 * @return the value of a cookie, null if the cookie does not exist
		 * @type String
		 */
		CookieMgr.prototype._getCookies = function(data) {
			// first split this cookie up into sub-cookie pairs
			// note: document.cookie only returns name=value, not the other components
			var a_all_cookies =  (isNullOrUndefined(data)) ? document.cookie.split( COOKIE_DELIMITER ) : data.split( COOKIE_DELIMITER );
			var retval = null;

			a_all_cookies.forEach( function(cookie) {
				// now we'll split apart each name=value pair
                var delim_index = cookie.indexOf('=');

				// and trim left/right whitespace while we're at it
				var cookie_name = (delim_index > 0 ? cookie.substring(0, delim_index) : cookie).replace(/^\s+|\s+$/g, '');

                var cookie_value = '';

				// if the extracted name matches passed check_name
			    // we need to handle case where cookie has no value but exists (no = sign, that is):
				if (delim_index > 0 && delim_index < cookie.length - 1) {
                    cookie_value = decodeURIComponent( cookie.substring(delim_index + 1).replace(/^\s+|\s+$/g, '') );
                }
				if(retval==null)
					retval = {};
					// note that in cases where cookie is initialized but no value, null is returned
				retval[cookie_name] = cookie_value;
			});
			return retval;
		};


		CookieMgr.prototype._clearCookie = function(cRes) {
			var clearVal = this.JSON.stringify({});
			this._setCookie(cRes, clearVal);
		};

		/**
		 * @param data contains a JSON object contain whole cookie values
		 * {"inqState": {...}, "inqVital": {"INQ": {...}, ...}, "inqSession": {...}}
		 */
		CookieMgr.prototype.setXDCookies = function(cookieData) {
			this.cookies = cookieData;
			if ( cookieData && cookieData.pc && cookieData.pc == 2 ) {
				this.isLSused = true;
			}
		};

		/**
		  *	Establish the listener for 3rd party cookie queue becoming empty
		  */
		CookieMgr.prototype.onThirdPartyCookieQueueEmpty = null ;

		/**
		  *	Establish a collection of handlers for 3rd party cookie queue becoming empty
		  */
		CookieMgr.prototype.onThirdPartyCookieQueueEmptyHandlers = [] ;

		/**
		  *	Handlers can added into 3rd party cookie queue. - only one handler to keep system simple.
		  */
		CookieMgr.prototype.on3rdPartyCookieCommittedHandler = null;

		/**
		  *	Test for third party cookie queue empty and idle (no cookie saving is in progress)
		  */
		CookieMgr.prototype.isThirdPartyCookieQueueEmpty = function(){
			return (0==this.set3rdPartyCookieQueue.length) && !this.set3rdPartyCookieBusy;
		};

		 /**
	        * set3rdPartyCookie - sets third-party cookie via an iframe-proxy
	        * details:
	        *    An IFRAME with source from domain of the vanity domain performs the cookie setting on behalf of this domain.
	        *    Inq.CM.set3rdPartyCookie asks the IFRAME to set the cookie on our behalf.
		    *
		    *    Use call of Inq.FlashPeer.set3rdPartyCookieFromQueue() instead of direct call of Inq.CM.set3rdPartyCookie(...)
	        *
		    * @param   {String} cmd - command
	        * @param   {Number} site - site id
		    * @param   {String} name - cookie name
		    * @param   {Object} delta - cookie value
		    * @param   {String} path - cookie path
		    * @param   {Number} expiry - lifetime in milliseconds
            *
	        * @author  fpinn@TouchCommerce.com
	        * @see set3rdPartyCookieFromQueue
	        * @see HTML file postToServer.js which performs the cookie setting via command "SCBR3_PM" (Set Cookie BR3)
	        */

		CookieMgr.prototype.set3rdPartyCookie = function(cmd, site, name, delta, path, expiry){
		        // Current origin:            http://www.touchcommerce.com
                // Target origin for cookies: http://home.inq.com (for example)

	            //this.initMessagingComplete = this.initMessaging();
	            if (!path) path="/";
	            if (!expiry) expiry="";
	            if(isNullOrUndefined(cmd) || isNullOrUndefined(site) || isNullOrUndefined(name)) return;

	            var boxID = "box" + Math.floor(Math.random()*1000011);
	            var port = (inqFrame.location.port!="")?":"+inqFrame.location.port:"";
	            var parentURL = inqFrame.location.protocol + "//"  +  inqFrame.location.hostname + port + inqFrame.location.pathname ;
	            var sDelta = encodeURIComponent(""+this.JSON.stringify(delta));

	            var postCookie = [cmd, boxID, site, parentURL, name, sDelta, path, expiry];

	            /* Put the cookie message on the queue if queue is empty
	               If queue is not empty find if the cookie (by name) is in the queue and replace it
	               The new cookie trumps the old cookie, it is it's replacement
	               If the cookie name is not in the queue then put cookie at tail of queue
	               BTW: The count for the queue will never exceed the number of cookie names
                  */
				if (0==this.set3rdPartyCookieQueue.length)
					this.set3rdPartyCookieQueue.push({name: name, postCookie: postCookie});
				else {
					/* Look for a match, check the cookie name against the name in the queue object */
					var i = 0;
					for (i = 0; i < this.set3rdPartyCookieQueue.length; i++) {
						if (this.set3rdPartyCookieQueue[i].name==name) {
							this.set3rdPartyCookieQueue[i].postCookie = postCookie ;
							break ;
						}
					}
					/* If the queue length is equal to the index from the for-loop, then we did not find a match */
					if (i==this.set3rdPartyCookieQueue.length) {
						this.set3rdPartyCookieQueue.push({name: name, postCookie: postCookie});
					}
				}

	            /* If we are busy, leave the message queued and return */
	            if (this.set3rdPartyCookieBusy) return ;

	             /* Set busy flag */
	            this.set3rdPartyCookieBusy=true;

				/* Call the function to write 3rdPartyCookie in queue */
				this.set3rdPartyCookieFromQueue();
		};

	        /**
	          * set3rdPartyCookieQueue - sets queued third-party cookie via an iframe-proxy
	          *                          if no queued third-party cookie, then set set3rdPartyCookieBusy to false
	          * called by the Iframe-Proxy postToServer.htm after cookie has been set.
	          *
	          * details:
			  *    An IFRAME with source from domain of the vanity domain performs the cookie setting on behalf of this domain.
			  *    Inq.CM.set3rdPartyCookie asks the IFRAME to set the cookie on our behalf.
			  *
			  *    Use call of Inq.FlashPeer.set3rdPartyCookieFromQueue() instead of direct call of Inq.CM.set3rdPartyCookie(...)
              *
	          *  1) get cookie request from queue
	          *  2) if cookie request is NOT avalable THEN set busy flag to false
	          *  3) ELSE create boxID and put it in the cookie request then post the request to the IFrame-Proxy
	          *
	          * @param	void
	          * @author  fpinn@TouchCommerce.com
	          * @see set3rdPartyCookie
	          * @see HTML file postToServer.js which performs the cookie setting via command "SCBR3_PM" (Set Cookie BR3)
	          */

	          CookieMgr.prototype.set3rdPartyCookieFromQueue = function(){
	              var cookieQItem = null ;
	              cookieQItem = this.set3rdPartyCookieQueue.shift();
	              if (!isNullOrUndefined(cookieQItem)) {
	                  this.postRequestToIframeProxy(cookieQItem.postCookie, cookieQItem.postCookie[1]); /* issue request */
	              } else {												/* We only get here if we have an empty cookie queue */
	                  this.set3rdPartyCookieBusy=false;
					  if (this.onThirdPartyCookieQueueEmpty != null){	/* Check to see that we have a listener for an empty queue */
						this.onThirdPartyCookieQueueEmpty ();			/* fire the listener */
					  }
				  }
              };


			/** This calls supplied function once the cookies have been committed.
			  *
			  * @param handler - handler to be called when committed
			  */
			CookieMgr.prototype.whenCookiesCommitted=function(handler){
				if (this.xd) {
					if (this.isThirdPartyCookieQueueEmpty())
						handler(); /* Queue is empty, do the handler */
					else {
						/* We have a queue, so setup listener for cookie queue empty */
						/* Register the handler  */
						this.onThirdPartyCookieQueueEmptyHandlers.push(handler);
						this.onThirdPartyCookieQueueEmpty = function() { 	/* This is the listener for cookie queue empty */					/* get cookie manager */
					 		(CM).whenCookiesFireHandlers();
						};
						/* Check queue again, just in case the cookie came in before the handler was established */
						if (this.isThirdPartyCookieQueueEmpty()) {
							this.whenCookiesFireHandlers();
                        }
                    }
                }
				else { /* Not xd mode, do the handler */
					 handler();
				}
			};

			 /*
			  * This function will add a handler into set3rdPartyCookieQueue to obey sequence.
			  *
			  *
			  * @param handler - handler to be called when committed
			  */
			CookieMgr.prototype.setWhen3rdPartyCookieCommittedHandler=function( handler ){
				if ( this.xd ) {
					try {
						var boxID = "box" + Math.floor(Math.random()*1000011);
						var port = (inqFrame.location.port!="")?":"+inqFrame.location.port:"";
						var parentURL = inqFrame.location.protocol + "//"  +  inqFrame.location.hostname + port + inqFrame.location.pathname ;
						var postCookieRequest = ["COMMITPOINT", boxID, siteID, parentURL, encodeURIComponent(urls.loggingURL)];

						if ( handler ) {
							this.on3rdPartyCookieCommittedHandler = { "vcnt": this.cookies["inqVital"]['vcnt'] , "callback" : handler } ;
						}

						this.set3rdPartyCookieQueue.push({name: "inqCallBack" + Math.floor(Math.random()*1000011), postCookie: postCookieRequest});

						if ( !this.set3rdPartyCookieBusy ) {
							this.set3rdPartyCookieBusy=true;
							this.set3rdPartyCookieFromQueue();
						}
					} catch (e) {
						log("exception in setWhen3rdPartyCookieCommittedHandler(): " + e.message, "error");
					}
				} else {
					return false;
				}

			};

			/**
			  * Executes handler from queue in sequence and continue the queue.
			  *
			  * @param handler - handler to be called when committed
			  */
			CookieMgr.prototype.when3rdPartyCookieCommitted=function( vcnt ){

				if ( null != this.on3rdPartyCookieCommittedHandler ) {
					try {
						if ( !this.isLSused || this.cntHandlerTried >= 120 || (typeof vcnt !== "undefined" && this.on3rdPartyCookieCommittedHandler["vcnt"] <= vcnt) )
						{
							this.on3rdPartyCookieCommittedHandler["callback"]();
							this.on3rdPartyCookieCommittedHandler = null;
							this.cntHandlerTried = 0;
							this.set3rdPartyCookieFromQueue();
						} else {
							this.cntHandlerTried += 1;
							this.set3rdPartyCookieBusy = false;
							this.setWhen3rdPartyCookieCommittedHandler( );
						}
					} catch (e) {
						log("exception in CookieMgr.prototype.when3rdPartyCookieCommitted: " + e.message, "error");
					}
				} else {
					this.set3rdPartyCookieFromQueue();
				}

			};

			/**
             * This calls all supplied functions once the cookies have been committed.
			 */
			CookieMgr.prototype.whenCookiesFireHandlers=function(){
                log("CookieMgr.whenCookiesFireHandlers() entered: got " + this.onThirdPartyCookieQueueEmptyHandlers.length + " handler(s).");
				this.onThirdPartyCookieQueueEmpty = null;		/* remove the listener */
				while (this.onThirdPartyCookieQueueEmptyHandlers.length>0){
					var handlerRoutine = this.onThirdPartyCookieQueueEmptyHandlers.shift(); /* remove handler from top of list */
					if (handlerRoutine){
						try {
                            handlerRoutine(); /* perform the handler */
                        } catch (e) {
                            log("exception in whenCookiesFireHandlers(): " + e.message, "error");
                        }
					}
				}
			};

	        /**
	         * postRequestToIframe - create new iframe-proxy to do some work
	         * Put the request (the command and data) in the NAME field of the new iframe
	         * details:
	         *    An IFRAME with source from domain of the vanity domain performs work specified by the request parameter.
	         *
			 * @param url - alternative path (XD mode)
	         * @param request - the command and data for the proxy-iframe to run as array
			 * @param id - iframe id (box id)
			 * @param context - callback function
	         * @author  fpinn@TouchCommerce.com
	         * @see HTML file postToServer.htm which performs the cookie setting via command in request
			 * @see authorize (cbc.js)
	         * @see checkAuthorized (cbc.js)
	         */

            CookieMgr.prototype.postRequestToIframe = function (url, request, id, context) {
                // On 1pc persistent solution, hosted file of the domain should be continuously used.
                if (xdAutoSelect && CookieMgr.xdPsHelper.enabled) { // it's a first party cookie
                    LoadM.postRequestToIframeProxy(CookieMgr.xdPsHelper.hostFileURLUse + "?POST2SERVER", request, id, context);
                } else {
                    LoadM.postRequestToIframeProxy(url, request, id, context);
                }
            };

			/**
			 * Defines callback function for postRequestToIframe.
			 *
			 * @param request - the command and data for the proxy-iframe to run as array
			 * @param id - iframe id (box id)
			 * @param callback - callback function
			 */
			CookieMgr.prototype.postRequestToIframeProxy = function (request, id, callback) {
                var context = {};
                context["callbackFun"] = callback || CookieMgr.loadComplete;
				this.postRequestToIframe(this.getIFrameBaseURL(), request, id, context);
            };

			/**
			 *  Return iFrame base URL
			 *  Store it in this._iFrameBaseURL, change protocol to HTTPS if browser thpe is Safari and not Chrome.
			 *
			 */
			CookieMgr.prototype.getIFrameBaseURL = function() {

                if (typeof this._iFrameBaseURL == 'undefined') {
					this._iFrameBaseURL = Inq.urls.baseURL.split("/",3).join("/") ;
                    this._iFrameBaseURL = secureHTTP( this._iFrameBaseURL );
                }

                return  this._iFrameBaseURL;
			};

	      /**
	        * loadComplete forwards the context to onMessage handler with the correct this context.
	        * When this handler is invoked, "this" is pointing to the window, not the SvrCom context
	        * We correct that by calling the non-static onMessage via the SvrCom object.
	        *
	        *  @param	event - The event thingy
	        *  @author Fred A. Pinn <fpinn@TouchCommerce.com>
	        */

	      CookieMgr.loadComplete = function(context){
	            return CM.onMessage(context);
	        };


	      /**
	        * Receives the response from the iframe-proxy window
	        *
	        * The data is seperated by "||"
	        *  item 0: unique id of the iframe-proxy
	        *  item 1: commands to be executed
	        *
	        *  The command is executed (via eval)
	        *
	        *  As an extra precaution,
	        *  we make sure that we only process commands from our iframe-proxies by checking the origin
	        *
	        *  @author Fred A. Pinn <fpinn@TouchCommerce.com>
	        *  @return	false ;
	        */
          CookieMgr.prototype.onMessage = function(context){
              //  CookieMgr.xdPsHelper.isInFirstCookieProcess is true when 1pc ps solution is on
              //  and checking all the domains.
              if( CookieMgr.xdPsHelper.isInFirstCookieProcess ) {
                  CookieMgr.xdPsHelper.processSavedXdCookie(context, context, this);
              } else {
                  CookieMgr.processMessage(context);
                  return false;
              }
          };

          CookieMgr.processMessage = function(context) {
                try {
                    if (context.eval) {
                        // for backward compatibility with old commands
                        window.eval(context.data);
                    } else {
                        ROM.onRemoteCallback(context.id, context.data);
                    }
                } catch(fault){
                    ROM.post(urls.loggingURL, {level:'ERROR', line: ('CookieMgr.processMessage>> '+catchFormatter(fault))});
                }
            };

            /**
             *
             *  1pc ps sloution: 1st party cookie - persistent solution
             *
             *  Background: Safari on iOS 7 does not provide appropriate localStorage implementation
             *  and changes are lost once you move page to page.
             *  To overcome, CookieMgr.xdPsHelper object uses 1pc ps solution
             *
             *  Requirements
             *  inqVital.vtime cookie value in number type.
             *  site.hostedfileURL must be List of fully qualified URL
             *  site.cookie policy.
             *
             */
            CookieMgr.xdPsHelper = {};
            CookieMgr.xdPsHelper.hostFileURLUse = "";
            CookieMgr.xdPsHelper.enabled = false;
            CookieMgr.xdPsHelper.isInFirstCookieProcess = false;
            CookieMgr.xdPsHelper.cntDomainsWithData = 0;
			/**
			 CookieMgr.xdPsHelper.errorCode
			 used to save error code.

			 Detail
			 ------------------------------------
			 0 = "No Error";
			 1 = "CookieMgr.xdPsHelper.requestSavedXdCookies() is called with wrong arguments";
			 2 = "Not able to find host file for the current domain, CookieMgr.xdPsHelper.hostFileURLUse is not defined";
			 */
			CookieMgr.xdPsHelper.errorCode = 0;


			/**
             *  isIos7
             *  Return True if the device is iphone or ipad and browser is Safari.
             *
             */
            CookieMgr.xdPsHelper.isIos7 = function( uagent ) {
                return /(iPad|iPhone).*OS 7/i.test( uagent ) ;
            };

            /**
             *  Return true if 1pc is enabled.
             *  Writes simple random number to cookie to check and delete it on success.
             *
             * @return {*}
             */
            CookieMgr.xdPsHelper.is1pcEnabled = function( ) {
                var result = false;
                if (typeof CookieMgr.xdPsHelper.isUse1pcXdSolution.pc1Enabled == 'undefined') {
                    var value = Math.floor(Math.random()*101);
                    var expiry = (new Date( (new Date()).getTime() + (366*24*3600*1000) )).toGMTString();
                    document.cookie = "pctest=" + value + "; path=/; expires="+expiry+";" ;
                    CookieMgr.xdPsHelper.isUse1pcXdSolution.pc1Enabled = (document.cookie.indexOf("pctest=" + value) != -1) ? true : false;
                }
                return (CookieMgr.xdPsHelper.isUse1pcXdSolution.pc1Enabled);
            };

            /**
             *  isUse1pcXdSolution ()
             *  Return true if 1pc ps solution can be used on
             *	We also test for uiWebview so we can support Vodafone App
             */
            CookieMgr.xdPsHelper.isUse1pcXdSolution = function( ) {
                // To test iOS 7       > CookieMgr.xdPsHelper.isIos7( navigator.userAgent )
                // To test safari      > isSafari()
                // To test 1pc enabled > CookieMgr.xdPsHelper.is1pcEnabled()
				var uiWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
				var androidWebview = /Android.*?(wv|Version\/[.0-9]+).*?Mobile/i.test(navigator.userAgent);
				/* We want to use this solution for uiWebview instances as well.
				 * The uiWebView is the safari PROCESSING_INSTRUCTION_NODE
				 */
                return (uiWebView || androidWebview || isSafari())
                    && CookieMgr.xdPsHelper.is1pcEnabled()
                    ;
            };

            /**
             *   An Array to hold domains and data.
             *   It also has functions to check if URL is valid and no duplication is found.
             */
            CookieMgr.xdPsHelper.domains2Check = [];
            CookieMgr.xdPsHelper.domains2Check.pushHostedFileUrl = function( hostedUrl ) {
                var ob = parseUrl( hostedUrl );
                if ( ob != null && !this.contains ( ob, function ( a, b ) { return a.host == b.host; } ) ) {
                    this.push( ob );
                    CookieMgr.xdPsHelper.hostDomainCnt += 1;
                    return ob;
                }
                return false;
            };

            CookieMgr.xdPsHelper.domains2Check.assignDataByOrigin = function( origin, data) {
                for (var i = 0; i < this.length; i++ ) {
                    if ( this[i].origin === origin ) {
                        this[i].data = data;
                        CookieMgr.xdPsHelper.cntDomainsWithData += 1;
                    }
                }
                return null;
            };

            /**
             *  findLastCookieData()
             *  returns the latest data among all sub-domain cookies.
             *
             */
            CookieMgr.xdPsHelper.domains2Check.findEntryWithLatestCookie = function( ) {
                var data = "";
                var date = null;
                var latestDate = null;
                var theobj = null;

                for (var i = 0; i < this.length; i++ ) {
                    date = getDateFromData( this[i].data.data );
                    if ( date != null )	{
                        if ( latestDate == null ) {
                            theobj = this[i];
                            latestDate = date;
                        } else if ( date > latestDate ) {
                            theobj = this[i];
                            latestDAte = date;
                        }
                    }
                }

                if ( theobj == null ){
                    for (var j = 0; j < this.length; j++ ) {
                        if ( this[j].domain == (inqFrame.location.domain ? inqFrame.location.domain : parseUrl( inqFrame.location.href ).domain ) )	{
                            theobj = this[j];
                        }
                    }
                }

                if ( theobj != null ){
                    return theobj;
                } else {
                    return null;
                }

                /**
                 *  getDateFromData(data)
                 *  Return time from inqVital.vtime which should be last updated time of inqVital.
                 */
                function getDateFromData(data) {
                    var date = null;
                    var dateStr = unescape(decodeURIComponent(data));
                    var dateReg = /vtime:([0-9]*)/i;
                    if ( dateReg.test(dateStr) ){
                        date = dateReg.exec(dateStr)[1];
                    }
                    return date;
                }
            };

            /**
             *  requestSavedXdCookie:
             *  Examines all domains to the given site and find the latest cookie created.
             *
             *  Back ground info:
             *  Safari on iOS 7 does not provide access to 3pc localStorage correctly.
             *  3pc localStorage created on one main domain(parent) will lost on another main domain.
             *
             *  To work around this issue:
             *  Safari considers a sub-domain as 1pc cookie and a cookie from other doamin is always readable.
             *  Sub-domain 1pc cookie is used to persist variables and chat continues on a site page in a different domain
             *
             *  Note FF does not support sub-domain 1pc cooke.
             */
            CookieMgr.xdPsHelper.requestSavedXdCookies = function() {
                // enter finding first cookie process to get the latest cookie.
                CookieMgr.referer = window.parent.document.referrer;

                // Right now all domains are checked regardless document.referrer value
                //	if ( isNullOrUndefined( CookieMgr.referer ) || CookieMgr.referer == "" ) {

	            if ( true ) {
		            // checking all domains for the site including same domain
                    // then compare timestamp to get latest cookie entries.
                    // then call main function.
	                if ( !populateDomains2Check() ) return;
                } else {
                    CookieMgr.xdPsHelper.domains2Check.pushHostedFileUrl( CookieMgr.referer );
                }

                CookieMgr.xdPsHelper.isInFirstCookieProcess = true;
                for (var i = 0; i < CookieMgr.xdPsHelper.domains2Check.length; i++ ) {
                    callFirstPostRequestToIframeProxy(CookieMgr.xdPsHelper.domains2Check[i].href);
                }

                // Create box id and submit xd cookie process request.
                function callFirstPostRequestToIframeProxy(hostedURL) {
                    var boxID = "box" + Math.floor(Math.random()*1000011);
                    var port = (inqFrame.location.port!="")?":"+inqFrame.location.port:"";
                    var parentURL = inqFrame.location.protocol + "//"  +  inqFrame.location.hostname + port + inqFrame.location.pathname ;
                    var postCookieRequest = ["GCBR3", boxID, null, parentURL, "no action"];
                    submitPsProcessRequest(postCookieRequest, boxID, hostedURL);

                    /**
                     *  submitPsProcessRequest - create new iframe-proxy to get sub-domain Cookies
                     *  local version of postRequestToIframeProxy
                     */
                    function submitPsProcessRequest(request, frameId, baseUrl) {
                        /*
                         *  This will call the hosted file which will load postToServer.js file.
                         */
                        var frameSrc = baseUrl + "?POST2SERVER";
                        var context = {};
                        context["callbackFun"] = CookieMgr.loadComplete;
                        LoadM.postRequestToIframeProxy(frameSrc, request, request[1], context);
                    }
                }

                /**
                 *  Populates hostedUrls and CookieMgr.xdPsHelper.domains2Check
                 *  hosted file URLs are used as is without Protocol change since
                 *  some clients do not provide https protocol or vise versa.
                 */
                function populateDomains2Check() {
	                var result = false;
                    // sample: var hostedUrls = [ "http://www.touchcommerce.com/TouchCommercetop.html", "https://tc.inq.com/TouchCommercetop.html" ];
                    var hostedUrls = (typeof urls.siteHostedFileURL === "string") ? urls.siteHostedFileURL.split(",") : [];
	                if(hostedUrls.length > 1 || hostedUrls[0].trim() != "")  {
	                    for (var j = 0; j < hostedUrls.length; j++ ) {
	                        if ( CookieMgr.xdPsHelper.domains2Check.pushHostedFileUrl( hostedUrls[j].trim() ) ) {
		                        // log - hostedUrls[j] has been added into CookieMgr.xdPsHelper.domains2Check[]
	                        } else {
		                        // log - hostedUrls[j] is NOT added into CookieMgr.xdPsHelper.domains2Check[]
		                        // because hostedUrls[j] may be a duplicated hosted file in a same domain
	                        }
	                    }

	                    // Once populated find hosted file url for the current page.
	                    for (var i = 0; i < CookieMgr.xdPsHelper.domains2Check.length; i++ ) {
	                        if ( CookieMgr.xdPsHelper.domains2Check[i].domain == (inqFrame.location.domain ? inqFrame.location.domain : parseUrl( inqFrame.location.href ).domain ) )	{
	                            CookieMgr.xdPsHelper.hostFileURLUse = CookieMgr.xdPsHelper.domains2Check[i].href;
		                        result = true;
	                        }
	                    }
	                }

	                if (isNullOrUndefined(CookieMgr.xdPsHelper.hostFileURLUse) || CookieMgr.xdPsHelper.hostFileURLUse == "") {
		                CookieMgr.xdPsHelper.errorCode = 2;
		                result = false;
	                }
	                return result;
                }
            };


            CookieMgr.xdPsHelper.processSavedXdCookie = function(ev, data, that) {

                CookieMgr.xdPsHelper.domains2Check.assignDataByOrigin(ev.origin, data);
                var theob;

                // When we have cookies from all domains of a site, select latest data and start chat process.
                if ( CookieMgr.xdPsHelper.cntDomainsWithData >= CookieMgr.xdPsHelper.domains2Check.length )	{
                    theob = CookieMgr.xdPsHelper.domains2Check.findEntryWithLatestCookie();
                    CookieMgr.xdPsHelper.isInFirstCookieProcess = false;
                    CookieMgr.processMessage(theob.data);
                }
            };

            /**
             *  firstRequestCookie: Check if 1pc ps solution can be used (mush for iOS 7)
             *  then initiate the process,
             *  or try to use conventional localStorage ps solution.
             */
            CookieMgr.firstRequestCookie = function(){
                if ( CookieMgr.xdPsHelper.isUse1pcXdSolution() ) {
                    // Use 1pc persistent XD solution.
                    CookieMgr.xdPsHelper.enabled = true;
                    CookieMgr.xdPsHelper.requestSavedXdCookies();
                } else {
                    CM.requestCookie();
                }
            };

	      /**
	        * requestCookie: get the cookie datas from the third party cookies
	        * Ask an iframe-proxy to get the cookie settings
	        * An IFRAME with source from domain of the vanity domain performs the cookie retrieval on behalf of this domain.
	        *
	        * @param param - param used as a prefix for the cookie names
		    * @param callback - callback function
	        * @see HTML file postToServer.htm which performs the cookie retrieval via command "GCBR3" (Get Cookie BR3)
	        *
	        */
	        CookieMgr.prototype.requestCookie = function(param, callback) {
				param = param || "";
	            var boxID = "box" + Math.floor(Math.random()*1000011);
	            var port = (inqFrame.location.port!="")?":"+inqFrame.location.port:"";
	            var parentURL = inqFrame.location.protocol + "//"  +  inqFrame.location.hostname + port + inqFrame.location.pathname ;
	            var postCookieRequest = ["GCBR3", boxID, param, parentURL, "no action"];
	            this.postRequestToIframeProxy(postCookieRequest, boxID, callback);
	        };

			/**
			 * updateCACookie
			 * Updates chatActive value of ChatMgr instance from cookie.
			 * @param callbackFunc {function} (Required)
			 */
			CookieMgr.prototype.updateCACookie = function(callbackFunc){
				var param = "inqCA_"+ Inq.siteID;
				var callback = function(context) {
					var cObj = MixIns.JSON.parse(context.data);
					CM.cookies.inqCA = cObj[param];
                    callbackFunc();
                };
				this.requestCookie(param, callback);
			};

	       /**
	        * initMessaging: creates the re-usable iframe-proxies.
	        * a) Check to ensure that this initialization happens only once.
	        * b) Ensure that postMessage is available for our use
	        * c) Establish message handler for receiving posted messages
	        * d) Create a bunch of iframe-proxies for our use.
	        *
	        *  @param	action - The target path for the application receiving the post data
	        *  @param  data   - the object containing the data to be passed to the application
	        *  @param  _win   - The window to perform the post.
	        *  @author Fred A. Pinn <fpinn@TouchCommerce.com>
	        *  @return	{boolean} true ;
	        */

	        CookieMgr.prototype.initMessaging = function(){
	            if (this.initMessagingComplete) return true;
				/* Publish the proxy error routine
				 * BTW: This is how GWT does it,
				 * this way we do not have to put it in FlashPeer,
				 */
	            Inq["proxyError"] = this.proxyError;
				return true;
	        };

		/**
		 * Function proxyError - Logs the stack trace into the tag server log
		 * The stack trace is sent to the tagserver via POST not GET
		 *  this is necessary do to the size of the trace.
		 * Please see new ROM.send command
		 * @param errorText - the text describing the error
		 * @return nothing
		 */
		CookieMgr.prototype.proxyError = function(errorText) {
            ROM.post(urls.loggingURL, {level:"ERROR", line: encodeURIComponent(errorText)});
        };

		CookieMgr.prototype.onRemoteCallback = function(data) {
			this.setXDCookies(data);
		};

		/**
		 * Expires cookie stored by a resource with specified id which makes browser delete this cookie.
		 * @param cookieResourceId id of cookie resource to expire
		 */
		CookieMgr.prototype.expireCookie = function(cookieResourceId) {
			log("EXPIRING COOKIE \"" + cookieResourceId + "\"");
			var cRes = resources[cookieResourceId];
			this._setCookie(cRes, "", -1);
		};

		/**
		 * isPersistentCookiesAllowed is to know weather the browser accepts persistent cookies or not
		 *
		 * In some browsers users can select the option of not accepting persistent cookies.
		 * This function helps to cross check if the browser accepts persistent cookies or not.
		 *
		 */
		CookieMgr.prototype.isPersistentCookiesAllowed = function() {
			if (isNullOrUndefined(this.isPersistentCookiesEnabled)) {
				var pcVar = new Variable(PERSISTENT_COOKIE_ALLOWED, {}, resources[PERSISTENT_COOKIE_ALLOWED]);
				pcVar.setValue({});
				var enabled = !!this.read(resources[PERSISTENT_COOKIE_ALLOWED], PERSISTENT_COOKIE_ALLOWED);

				if (enabled)
					CM.expireCookie(PERSISTENT_COOKIE_ALLOWED);

				this.isPersistentCookiesEnabled = enabled;
			}
			return this.isPersistentCookiesEnabled;
		};

		CookieMgr.isSessionCookiesEnabled = null;
		/**
		 * Return true if session cookie is enabled in browser.
		 * Note This test does not tell persistent cookie status.
		 *
		 */
		CookieMgr.isSessionCookiesAllowed = function() {
			if (CookieMgr.isSessionCookiesEnabled == null) {

				var c_value = Math.floor(Math.random()*1001), c_name = 'sPc';

				CookieMgr.isSessionCookiesEnabled = false;
				document.cookie=c_name + "=" + c_value;

			    if ((document.cookie.indexOf(c_name) != -1) && (document.cookie.indexOf(c_value) != -1)) {
		    		CookieMgr.isSessionCookiesEnabled = true;
		    		document.cookie=c_name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			    }
			}
			return CookieMgr.isSessionCookiesEnabled;
		};

        var COOKIE_DELIMITER = ';';


	/**
	 * Instantiates a cookie resource for a single named cookie.
	 * @class CookieResource represents a single, named cookie for a specific domain.
	 * @param {String} id the unique identifier for the resource
	 * @param {String} name the cookie name
	 * @param {String} path the path is typically '/' but can be a more specific resource location in the domain if needed
	 * @param {Number} lifetime the number of ms which this cookie resource should remain available.
	 * 			A null/undefined lifetime creates a cookie that lives only during the browser session
	 * @param {String} domain the host domain is interested in these cookies
	 * @param {boolean=} secure a boolean true or false
	 * @param {number=} overflowPriority number between 0 and 9 (inclusive) indicating the overflow expiration priority
	 * in case any cookie space is overflowed. Lower numbers indicate higher value cookies. High numbered resources will
	 * be expired first.
	 * @constructor
	 * @class CookieResource
	 */
	function CookieResource(id, name, path, lifetime, domain, secure, overflowPriority, cm ) {
		this._resource(id);
		this._observable();
		/*
		 * Provides the name of this particular cookie, not
		 * any specific variable or name/value pair value.
		 */
		this.getName 	 = function(){ return name; 	};
		this.getPath 	 = function(){ return path; 	};
		this.getLifetime = function(){ return lifetime; };
		this.getDomain	 = function(){ return domain;	};
		this.isSecure	 = function(){ return secure;   };
		this.getSecure   = function(){ return this.isSecure(); };
		this.getPurgePriority = function(){ return overflowPriority; };
		this.cm = cm;
	}
	MixIns.prepare(CookieResource).mixIn(MixIns.Resource).mixIn(MixIns.JSON).mixIn(MixIns.Observable);

	/**
	 * Comparison function to sort CookieResources by purge priority order.
	 * @param {CookieResource} a
	 * @param {CookieResource} b
	 * @returns {number} 0 if equal, negative if a>b, positive if a<b. Will sort from largest purge priority to least.
	 */
	CookieResource.COOKIE_RESOURCE_PURGE_PRIORITY_SORT_FCN = function(a,b){
		return b.getPurgePriority() - a.getPurgePriority();
	};

	CookieResource.prototype.setCookieMgr = function(cm) {
		this.cm = cm;
	};
	
	CookieResource.prototype.isListener = function(l) {
		 return !!(l && (l.onResourceReset && typeof l.onResourceReset == "function")); 
    };

    CookieResource.prototype.fireResourceResetEvent = function() {
        function f(l, evt) {
            try {
                if (!!l.onResourceReset) {
                    l.onResourceReset(evt);
                }
            } catch(e) {
                log("Error firing event ResourceReset on " + l.toString() + ":" + e);
            }
        }
		var event = {customerID: Inq.getCustID()};

        this._fireEvt(f, event);
    };

    /*
	 * Add a name-value pair to the cookie if the pair's
	 * name doesn't exist, otherwise update the name with
	 * the new value.
	 *
	 * Being a Resource, this object must implement this
	 * method.
	 */
	CookieResource.prototype.write = function(name, value) {
		if (this.cm) {
			this.cm.write(this, name, value);
		}
	};
	
	/*
	 * 
	 * Being a Resource, this object must implement this 
	 * method.
	 */
	CookieResource.prototype.read = function(name) {
		var value = this.cm.read(this, name); // expecting an obj
		return value;
	};
	
	
	/*
	 * 
	 * Being a Resource, this object must implement this 
	 * method.
	 */
	
	CookieResource.prototype._serialize = function(value) {
		return this.stringify(value);
	};
	
	CookieResource.prototype._unserialize = function(value) {
		return this.parse(value);
	};
	
	/**
	 * Being a Resource, this object must implement this 
	 * method. 
	 * @see Resource
	 */
	CookieResource.prototype.getResourceID = function() {
		// this property has been added to the object by the Resource mixin during construction
		return this._rsrcID; 
	};


	/**
	 * Instantiates a web resource for a single url.
	 * @class WebResource Allows access to data as RPC (Remote Procedure Call) paradigm
	 * @param {String} id the unique identifier for the resource
	 * @param {String} url destination url for resource
	 * @constructor
	 */
	function WebResource(id, url, permissions, method ) {
		this._resource(id);
        this.url = url;
		this.permissions = permissions;
		this.method = method;
	}
	MixIns.prepare(WebResource).mixIn(MixIns.Resource).mixIn(MixIns.JSON).mixIn(MixIns.RemoteCaller);
	
	/**
	 * Being a Resource, this object must implement this 
	 * method. Stubbed.
	 */
	WebResource.prototype.write = function(name, value) {};
	
	/**
	 * Being a Resource, this object must implement this 
	 * method. Stubbed.
	 */
	WebResource.prototype.read = function(name) {};
	
	/**
	 * 
	 * Being a Resource, this object must implement this 
	 * method.
	 */
	WebResource.prototype._serialize = function(value) {
		return value;
	};
	
	WebResource.prototype._unserialize = function(value) {
		return value;
	};

	/**
	 * store js variables
	 * @class JSResource Allows to store js variables
	 * @param {String} id the unique identifier for the resource
	 * @constructor
	 */
	function JSResource(id, permissions) {
		this._resource(id);
        this.data = [];
	}
	MixIns.prepare(JSResource).mixIn(MixIns.Resource);

	/*
	 * Add a name-value pair to the cookie if the pair's
	 * name doesn't exist, otherwise update the name with
	 * the new value.
	 *
	 * Being a Resource, this object must implement this
	 * method.
	 */
	JSResource.prototype.write = function(name, value) {
        this.data[name] = value;
	};

	/*
	 *
	 * Being a Resource, this object must implement this
	 * method.
	 */
	JSResource.prototype.read = function(name) {
        try {
            return this.data[name];
        }
        catch(e) {
            
        }
        return null;
	};

	/*
	 *
	 * Being a Resource, this object must implement this
	 * method.
	 */
	JSResource.prototype._serialize = function(value) {
		return value;
	};

	JSResource.prototype._unserialize = function(value) {
		return value;
	};
	/**
	 * Create an instance of Variable
	 *
	 * @constructor
	 * @param {string} name the name of this variable
	 * @param {object} dfltValue the initial value of this variable
	 * @param {Resource} resource the Resource that will be the repository for this variable
	 * @param {string=} shortName short name of a variable instance, used for persistence.
	 * @param {function=} fnCast a function to cast this variable to a specific type
     * @param {function=} fnSer a function to serialize variable
	 * @requires Resource
	 *
	 */
	function Variable(name, dfltValue, resource, shortName, fnCast, fnSer) {
		this.name = name;
		this.resource = resource;
		this.dfltValue = dfltValue;
		this.shortName = shortName;

		if (typeof fnCast == "function") {
			this._cast = fnCast;
		}

		if (typeof fnSer == "function"){
			this._serialize = fnSer;
		}
       
		if (!isNullOrUndefined(resource) && resource.observable)	{
			resource.addListener(this);
		}
				
	}

	MixIns.prepare(Variable).mixIn(MixIns.Absorber);

	/**
	 * Factory that produces instances of Variable based on data specs.
	 * @param data {Object} data object that specifies type of Variable to produce
	 * @returns {*}
	 * @throws Error if data does not sport a proper type.
	 * @static
	 */
    Variable.getInstanceFromData = function(data) {
        var getResource = function(id) {
            return id ? resources[id] : null;
        };

        switch (data.type) {
            case "generic":
                return new Variable(data.name, data.defVal, getResource(data.rId), data.shName, data.fnCast, data.fnSer);
            case "String":
                return new StringVariable(data.name, data.defVal, getResource(data.rId), data.shName, data.fnCast, data.fnSer, data.maxSize);
            case "Date":
                return new DateVar(data.name, data.defVal, getResource(data.rId), data.shName);
            case "List":
                return new ListVariable(data.name, data.defVal, getResource(data.rId), data.shName, data.maxEntr);
            case "DateList":
                return new DateListVar(data.name, data.defVal, getResource(data.rId), data.shName, data.maxEntr);
            case "Map":
                return new MapVariable(data.name, data.defVal, getResource(data.rId), data.shName, data.maxEntr);
        }
        throw ("ERROR: Cannot instantiate variable for data: name=" + data.name + ", type=" + data.type);
    };

	/**
	 * Converts a data array to an array of proper variable types.
	 * @param datArray {Array} array of variable data that is to be used to produce Variables through factory.
	 * @returns {Array} Array of variables produced from datArray
	 * @throws when one of the data array elements does not sport a type or an incorrect/unsupported Variable type
	 * @see Variable.getInstanceFromData
	 * @static
	 */
	Variable.getInstancesFromData = function(datArray) {
		var retArr=[];
		for(var i=0; i<datArray.length; i++){
			retArr[i] = Variable.getInstanceFromData(datArray[i]);
		}
		return retArr;
	};

	/**
	 * Reset the variable instance.
	 * @param evt
	 */
	Variable.prototype.onResourceReset = function(evt){
	    this.init();
	};

	/**
	 * Retrieve the name of a variable instance
	 * @return the name of the variable
	 * @type string
	 */
	Variable.prototype.getName = function(){
		return this.name;
	};

	/**
	 * Retrieve the optional short name of a variable instance, used for persistence.
	 * @return the short name of the variable
	 * @type string
	 */
	Variable.prototype.getShortName = function(){
		return this.shortName;
	};

	/**
	 * Returns name of variable instance used to persist variable - short name if available, otherwise usual (long) name.
	 * @return the short name of the variable
	 * @type string
	 */
	Variable.prototype.getPersistentName = function(){
		if (isNullOrUndefined(this.getShortName())) {
			return this.getName();
		} else {
			return this.getShortName();
		}
	};

	/**
	 * Retrieve the resource of a variable instance
	 * @return the resource of the variable
	 * @type Resource
	 */
	Variable.prototype.getResource = function(){
		return this.resource;
	};


	/**
	 * Resets the var value to default value provided at construction.
	 */
	Variable.prototype.reset = function(){
		this.setValue(this.dfltValue);
	};
	/**
	 * initializes the value of the variable from the resource when resource is ready.
	 */
	Variable.prototype.init = function(){
		if(this.getValue()==null) {
			this.setValue(this.dfltValue);
		}
	};
	/**
	 * Default cast for this variable instance
	 * @param {Object} v the variable to cast
	 * @return the casted value
	 */
	Variable.prototype._cast = function(v) {
		return v;
	};

	/**
	 * Default serialize method for this variable instance
	 * @param {Object} v the variable to cast
	 * @return the casted value
	 */
	Variable.prototype._serialize = function(v) {
		return v;
	};

	/**
	 * Retrieve the value of this variable
	 * @return the variable's value using the casting function if available, null if name doesn't exist
	 * @type Object
	 */
	Variable.prototype.getValue = function() {
		var r = this.getResource();
		var val = null;

		// if a "short name" exists and a value is stored under the long (original) name, replace long name with short
		if(!!this.getShortName() && (this.getShortName()!=this.getName())){ // if short and long names are same, don't bother
			var valByName = r.read(this.getName());
			var valByPerName = r.read(this.getShortName());				
			if(!isNullOrUndefined(valByName)) {
				// we shouldn't store under long name if short name is available
				// deleting long name by supplying undefined value parameter to write invocation
				r.write(this.getName());

				// if some value stored under short name then it is newer than value under long name
				// otherwise store removed value under short name
				if(!valByPerName && !(valByPerName===0)) {
					r.write(this.getShortName(), valByName);
					valByPerName = valByName;
				}
			}
			val = valByPerName;
		}
		else {
			val = this.getResource().read(this.getPersistentName());
		}

		return (isNullOrUndefined(val))?null:this._cast(val);
	};


	/**
	 * Set the variable to a new value
	 * @param {Object} newValue the new value of this variable
	 * @return the new value of this variable
	 * @type Object
	 */
	Variable.prototype.setValue = function(newValue) {
		this.getResource().write(this.getPersistentName(), this._serialize(newValue));
		return newValue;
	};

	function ListVariable(name, dfltValue, resource, shortName, maxEntries) {
		this.name = name;
		this.dfltValue = dfltValue;
		this.resource = resource;
		this.shortName = shortName;
		if(!!maxEntries) {
			this.maxEntries = maxEntries;
		}
	}
	ListVariable.prototype = new Variable();
	ListVariable.prototype.constructor = ListVariable;
    
	ListVariable.prototype.append = function(arrayParam){
		var arr = this.getValue();
		arr.append(arrayParam);
		arr.constrain(this.maxEntries);
		this.setValue(arr);
	};

	ListVariable.prototype.prepend = function(arrayParam){
		var arr = this.getValue();
		arr.prepend(arrayParam);
		arr.constrain(this.maxEntries);
		this.setValue(arr);
	};

	/**
	 * Date Variable class extending generic Variable with specific and predefined serialize and cast(deserialize) methods.
	 */
	function DateVar(name, dfltValue, resource, shortName) {
		this.name=name;
		this.dfltValue = dfltValue;
		this.resource = resource;
		this.shortName = shortName;
	}

	DateVar.prototype = new Variable();
	DateVar.prototype.constructor = DateVar;
	DateVar.prototype._serialize = function(o){
		return (o && o.constructor===Date)?Math.floor(o.getTime()):o;
	};
	DateVar.prototype._cast = function(o){   
		return (typeOf(o)=="number")?new Date(o):o;
	};

	/**
	 * Date List Variable class extending generic ListVariable with date specific serialize and cast(deserialize) methods.
	 */
	function DateListVar(name, dfltValue, resource, shortName, maxEntries) {
		this.name = name;
		this.dfltValue = dfltValue;
		this.resource = resource;
		this.shortName = shortName;
		if(!!maxEntries) {
			this.maxEntries = maxEntries;
		}
	}
	DateListVar.prototype = new ListVariable();
	DateListVar.prototype._serializeElement = DateVar.prototype._serialize;
	DateListVar.prototype._castElement = DateVar.prototype._cast;

    /**
     * Map variable class extending generic ListVariable with map specific methods.
     * @param {string} name
     * @param {string} dfltValue
     * @param {Resource} resource the Resource that will be the repository for this variable
     * @param {string=} shortName short name of a variable instance, used for persistence.
     * @param {number=} maxEntries number of maximum entries to be added to map
     */
    function MapVariable(name, dfltValue, resource, shortName, maxEntries) {
        this.name = name;
        this.dfltValue  = dfltValue;
        this.resource = resource;
		this.shortName = shortName;
        this.maxEntries = maxEntries;
	}

    MapVariable.prototype = new Variable();
    MapVariable.prototype.constructor = MapVariable;

    MapVariable.prototype.set = function(key, value) {
        var map = this.getValue();
	    if(typeof map != "object") {
		    map = [];
	    }

	    if(this.maxEntries) {
		    if(this.maxEntries > Object.keys(map).length) {
			    map.set(key, value);
			    this.setValue(map);
		    } else {
			    log("Can't add new entry to a map variable " + this.getPersistentName() + " , max entries number is " + this.maxEntries);
		    }
	    } else {
		    map.set(key, value);
		    this.setValue(map);
	    }
    };

    MapVariable.prototype.unset = function(key) {
        var map = this.getValue();
        map.unset(key);
        this.setValue(map);
    };
    MapVariable.prototype.clear = function() {
        var map = this.getValue();
        map.clear();
        this.setValue(map);
    };
    MapVariable.prototype.each = function(fnc) {
        var map = this.getValue();
        map.each(fnc);
        this.setValue(map);
    };

    /**
     * Create an instance of StringVariable
     *
     * @constructor
     * @param {string} name the name of this variable
     * @param {object} dfltValue the initial value of this variable
     * @param {Resource} resource the Resource that will be the repository for this variable
     * @param {string=} shortName short name of a variable instance, used for persistence.
     * @param {function=} fnCast a function to cast this variable to a specific type
     * @param {function=} fnSer a function to serialize variable
     * @param {number=} maxSize maximum number of chars in value
     * @requires Resource
     *
     */
    function StringVariable(name, dfltValue, resource, shortName, fnCast, fnSer, maxSize){
        this.name = name;
        this.resource = resource;
        this.dfltValue = dfltValue;
        this.shortName = shortName;
        this.maxSize = maxSize;

        if (typeof fnCast == "function") {
            this._cast = fnCast;
        }

        if (typeof fnSer == "function"){
            this._serialize = fnSer;
        }

        if (!isNullOrUndefined(resource) && resource.observable)	{
            resource.addListener(this);
        }
    }

    StringVariable.prototype = new Variable();
    StringVariable.prototype.constructor = StringVariable;

    StringVariable.prototype.setValue = function(newValue) {
        if(!isNullOrUndefined(newValue) && typeof newValue != "string"){
            log("StringVariable.setValue: format of data to set is wrong, it will not be set, data = " + newValue);
            return newValue;
        } else if(newValue && this.maxSize && this.maxSize < newValue.length){
            log(this.getPersistentName() + " cannot write value bigger that max size of " + this.maxSize + " and will be truncated");
            newValue = newValue.substring(0, this.maxSize);
        }

        this.getResource().write(this.getPersistentName(), this._serialize(newValue));
        return newValue;
    };
	/**
	 * PersistenceMgr in charge of all variables and manages resources as well.
	 * @class Persistence Manager. Charged with maintaining persistence access for all 
	 * framework managers including cookie based persistence.
	 * @constructor
	 * @param {String} id Unique framework id
	 * @param {Object} xd true if cross-domain active, else false
	 * @borrows Observable#addListeners as #addListeners
	 * @borrows Observable#clearListeners as #clearListeners
	 * @borrows Observable#_fireEvt as #_fireEvt
	 * @borrows Observable#addListener as #addListener
	 * @borrows Observable#isListener as #isListener
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @borrows JSON#stringify as #stringify
	 * @borrows JSON#parse as #parse
	 */
	function PersistenceMgr(id, xd){
		this._frameworkModule(id);
		this.xd = xd;
		this._observable();
		this._vartable = {};
		this.CM = CookieMgr.getInstance(this.xd);
		
		/**
		 * Obtains a ref to a variable (for an optional given rule)
		 * @param {String} varName Name of the variable to seek.
		 * @param {String} [ruleName] Optional rule name to which the variable sought belongs.
		 */
		this.getVar = function(varName, rule){
			var rv = this._vartable[varName+(rule?("_"+rule.getID()):"")];
			if(!rv) {
				rv = this._vartable[varName];
			}
			return !!rv?rv:null;
		};
		
		/**
		 * Adds an array of variables for a given rule name
		 * @param {Array} varArr array of variables to manage
		 * @param {String} [ruleName] the optional rule name to which the variables belong.
		 */
		this.addVars = function(varArr){
			for(var i=0; i<varArr.length; i++){
				this.addVar(varArr[i]);
			}
		};
		/**
		 * Adds a variables for a given rule name
		 * @param {Variable} varArr object of type {@link Variable} to manage
		 * @param {String} [ruleName] the optional rule name to which the variable belongs.
		 * If undefined or null, only the rule name will be used to index the var.
		 */
		this.addVar = function(v){
			this._vartable[v.getName()] = v;
		};
		
		/**
		 * fires data calls for PersistenceMgr
		 * @memberOf PersistenceMgr.prototype
		 * @override
		 */
		this.fireDataReady= function(){
			for(var idx=0; idx<this._listeners.length; idx++){
				try {
					this._listeners[idx].onDataReady({});
				} catch(e) {
					log(e);
					// continue alerting listeners
				}
			}
		};
		
		/**
		 * 
		 */
		this.isListener = function(l){
			return (l && l.onDataReady)?true:false;
		};
		
		/** 
		 * initializes PersistenceMgr
		 */
		this.init = function(){
			if (this.initialized) return;
			this.initialized=true;
			for(var aVar in this._vartable) {
				this._vartable[aVar].init();
			}
			log(this.getID()+" initialized.");
		};
						
		/** 
		 * resets resource
		 * @param {String} resourceID  
		 */
		this.reset = function(resourceID){
			if (!isNullOrUndefined(resourceID))	{
				this.CM.clear(resourceID);
				var resource = resources[resourceID];
				if (!isNullOrUndefined(resource))	{
					resource.fireResourceResetEvent();
					log("resource reset for resourceID : "+resourceID);
				}	
			}
		};	
		
		/** 
		 * startup call for PersistenceMgr
		 */
		this.start = function() {
			if (this.started) return;
			this.started=true;
		};

		this.getCookieMgr = function() {
			return this.CM;
		};

		/**
		 * Return the cross-domain status of this object
		 * @return {boolean} true if this object has been configured for cross-domain support,
		 * false otherwise
		 */
		this.isCrossDomain = function() {
			return this.xd;
		};
	}
	
	/**
	 * Static field instance of the singleton PersistenceMgr
	 */
	PersistenceMgr.PM = null;
	
	/**
	 * Create an instance of the PersistenceMgr. This singleton creation
	 * pattern should ALWAYS be used by other objects instead of creating
	 * a PM with its constructor.
	 * @param {boolean} xd true if site is configured for cross-domain, false otherwise
	 * @return a singleton instance of PersistenceMgr
	 */
	PersistenceMgr.getInstance = function(xd) {
		if (PersistenceMgr.PM == null) {
			PersistenceMgr.PM = new PersistenceMgr("PM", xd);
		}
		return PersistenceMgr.PM;
	};
		

	MixIns.prepare(PersistenceMgr).mixIn(MixIns.Observable).mixIn(MixIns.FrameworkModule);
	PersistenceMgr.mixIn(MixIns.JSON).mixIn(MixIns.Absorber);

	/**
	 * takes a js object of n-v pairs and serializes them to a URL type params string.
	 * @param {Object} d Data in n-v pair format. For example: {dat1:"value1",num:3424}
	 * @param {boolean} avoidRand  flag if it true than we don't add "_rand" param
	 */
	function toParamString(d, avoidRand){
		var rv = "";
		if(!d) return rv;
		var separator  = "";
		if (!avoidRand) {
			rv = "_rand=" + encodeURIComponent(randStr());
			separator = "&";
		}
		for(var idx in d){
			if(typeof d[idx]!="function" && d[idx]!=null){
				rv += (separator + idx + "=" + encodeURIComponent(d[idx]));
				separator = "&";
			}
		}
		return rv;
	}

	function randStr() {
		return (Math.round(Math.random()*1000000000000)).toString(36);
	}

	/**
	 * Channel
	 * A communications "get" channel to our server. Sends data to a URL destination with
	 * error checking. Will attempt to resend 3 times.
	 * @param {function} onComplete Callback when message is sent. May optionally support an event
	 * @param {function} onError Callback when message is fail. May optionally support an event.
	 * object of form {state:"SUCCESS"|"ERROR", evt:<imageEvent>}
	 * @constructor
	 * @class Channel
	 */
	function Channel(onComplete, onError){
		if (typeof onComplete == "function") {
			this.onComplete = onComplete;
		}
		if (typeof onError == "function") {
			this.onError = onError;
		}
		this.resendCount = 0;
		this.img = this._newImage();
	}

	Channel.prototype.getCallback = function(){
		return this.onComplete;
	};

	Channel.prototype.getResendCount = function(){
		return this.resendCount;
	};

	Channel.prototype.getUrl = function(){
		return this.url;
	};

	/**
	 * gets the url of the channels img source
	 * @return {string} url of the Image object src url
	 */
	Channel.prototype.getSrcUrl = function(){
		return this.img.src;
	};

	/**
	 * Factory to produce a correctly configured image for channel instances.
	 * @return {Image} customized image instance that will report errors and successes dutifully
	 * @private
	 */
	Channel.prototype._newImage = function(){
		var img = new Image();
		img.channel = this;
		img.onload = function(evt){
			this.channel.done(evt);
		};
		img.onerror = function(e){
			this.channel.fail(e);
		};
		return img;
	};

	/**
	 * resends data on error condition from "send" method
	 * @param {object} err Error object
	 * @private
	 * @see Channel#send
	 */
	Channel.prototype._resend = function(err){
        var maxResend = this.maxResendTimes ? this.maxResendTimes : 3;
		if(!!this.resendOnError && ++this.resendCount<maxResend){
			this.img = this._newImage();
			if(!!this.data){
				this.data["resendCount"] = this.resendCount;
			}
            if(this.timeout) {
                var _this = this;
                setTimeout(function() { _this.send(_this.url, _this.data, _this.noCacheBust, _this.resendOnError, _this.maxResendTimes, _this.timeout);}, _this.timeout);
            } else {
                this.send(this.url, this.data, this.noCacheBust, this.resendOnError, this.maxResendTimes, this.timeout);
            }
		}else{
			if (typeof this.onComplete == "function") {
				var errObj =  {
					state:"ERROR",
					url:this.getFullUrl(), //TODO: URL will be contain a new "_rand" parameter thus log-line will be different from original URL with error
					attempts: this.resendCount
				};
				if(err && err["type"]) {
					errObj.evt = {type:err["type"]};
				}
				this.onComplete(errObj);
			}
		}
		logErrorToTagServer("Send Error: Could not send data to service. retry count="+this.resendCount+",url="+this.getFullUrl()+(this.resendCount>2?", Failed!":""));
	};

	/**
	 * Returns the full URL, including data payload and cachebust random number.
	 * @return {String} Full url with data and cachebust
	 */
	Channel.prototype.getFullUrl = function(){
		return this.url + (!!this.data?("?" + this.toParamString(this.data, this.noCacheBust)):"");
	};

	/**
	 * Send data to a given URL, optional cache-busting. No callback provided here.
	 * @public
	 * @param {string} url Full url with no data or "?" char. Must be a valid url with protocol:[port], domain, and path
	 * @param {object} data map of name-value pairs to send attached to the given url
	 * @param {boolean} noCacheBust true for now _rand var attached to bust cache
	 * @param {boolean} resendOnError if true, will retransmit on error condition. If undefined,
     * @param {Number} [maxResendTimes]  override max request times (default is 50, set in XSD).
     * @param {Number} [timeout]  provide timeout to send request after interval (default is null, requests will be sent one by one immediately)
     * null, or false then will only attempt to send once.
	 */
	Channel.prototype.send = function(url, data, noCacheBust, resendOnError, maxResendTimes, timeout){
		this.url = url;
		this.data = data;
		this.noCacheBust = noCacheBust;
		this.resendOnError = resendOnError;
        this.maxResendTimes = maxResendTimes;
        this.timeout = timeout;
		this.img.src = this.getFullUrl(); // triggers http request
	};
	Channel.prototype.toParamString = toParamString;
	Channel.prototype.rand = randStr;

	/**
	 * Handler of successful response
	 * @param {object} evt
	 */
	Channel.prototype.done = function(evt) {
		if (typeof this.onComplete == "function") {
			this.onComplete({
				state: "SUCCESS",
				evt: evt,
				url: this.url
			});
		}
	};

	/**
	 * Handler of failing
	 * @param {object} err
	 */
	Channel.prototype.fail = function(err) {
		if (typeof this.onError == "function") {
			this.onError({
				state:"ERROR",
				err: err
			});
		} else {
			this._resend(err);
		}
	};

	/**
	 * Conducts all remote operations. Singleton class.
	 * @class RemoteOpsMgr (ROM). All remote operations (chat launch requests etc) are called through
	 * this class.
	 * @constructor
	 * @param data initial data for the ROM
	 * @borrows Absorber#absorb as #absorb
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @see RemoteCaller
	 */
	function RemoteOpsMgr(id, data) {
		this._frameworkModule(id);
		/** queue for all waiting remote ops */
		this.waitingQ = {};
		this.ch = [];
		this.i = 0;
        this.pIdx = 0;
		this.ridx = 0;
        this.isIE = isIE();
		this.absorb(data);
        this.lastSendTime = new Date();
		this.requestTimestamp = 0;
        this.postTime = [];
        this.sendCount = 0;
        this.sleep = function(mlSec) {
            var date = new Date();
            var curDate = null;
            do {
                curDate = new Date();
            } while(curDate-date < mlSec);
        };
        this.checkSendTime = function () {
            var curTime = new Date();
            // check time of last n send
            if (curTime - this.lastSendTime > 1000) {
                // more than 1sec - lets work
                this.sendCount = 0;
                this.lastSendTime = curTime;
                return;
            }
            // check: is there 'free' img
            if (this.sendCount < this.ch.length - 1) {
                this.sendCount ++;
                this.lastSendTime = curTime;
                return;
            }
            // wait 55 mlsec for each img
            this.sleep(this.ch.length * 55);
            this.sendCount = 0;
            this.lastSendTime = new Date();
        };
        /**
         * Detects overflow of the IE url GET request length limit.
         * add all needed data, and check size of all data
         * @param {String} url The base protocol/server/port combo to be used to construct the URL
         * @param {Object} data the name-value pairs to be placed on the URL as parameters.
         * @return true if request length > limit.
         */
        this.isOversizeRemoteCall = function (url, data) {
            this.prepareDataToSend(data, null);
            return this.isOversizeCall(url, data);
        };
        /**
         * Detects overflow of the IE url GET request length limit.
         * @param {String} url The base protocol/server/port combo to be used to construct the URL
         * @param {Object} data the name-value pairs to be placed on the URL as parameters.
		 * @link http://support.microsoft.com/kb/208427
         */
		this.isOversizeCall = function(url, data){
			var pstr = this.toParamString(data);
			pstr = ((pstr && pstr.length>0)?"?":"") + pstr;
			var reqURL = url+pstr;
			return (this.isIE && reqURL.length>2048);
		};


		/**
		 * Sends data to a server (no callback)
		 * If this is going to the vanity domain and it is an "oversized call" we will "POST" the data via the IFrame/Proxy
		 *    this avoids the problem of length restrictions in "GET" methodology
		 * @param {String} url target URL without parameters
		 * @param {Object} data the name-value pairs to be placed on the URL as parameters
         * @param {boolean} [logOnError] set to true to log data to server on error
		 * @param {boolean} [resendOnError]  set to true if retries are wanted. null or undefined will not resend.
         * @param {Number} [maxResendTimes]  override max request times (default is 50, set in XSD).
         * @param {Number} [timeout]  provide timeout to send request after interval (default is null, requests will be sent one by one immediately)
		 * ONLY WORKS FOR GET REQUESTS
		 */
		this.send = function(url, data, logOnError, resendOnError, maxResendTimes, timeout){
            var baseVanity = urls.vanityURL;
            var isVanity = url.indexOf(baseVanity) == 0;
            var hasLogdata = url.indexOf("/logdata") != -1;
            // RTDEV-1238: "codeVersion" parameter is used for investigation only and contains a time of inqChatLaunch***.js and tcFramework***.js generation as number.
            //             The parameter is defined in inqChatLaunch***.js in v3Lander object (see code of inqChatLaunch.jsp) and is added as URL parameter for tcFramework***.js and InqFramework.js.
            if (isVanity && hasLogdata && (data) && (v3Lander)) {
                data["codeVersion"] = v3Lander.codeVersion;
            }
            if (isVanity && this.isOversizeCall(url, data)) return this.post(url, data, data.rid);

			try {
                this.checkSendTime();
                if (this.isOversizeCall(url, data)) {
                    this.postToServer(url, data);
                    return;
                }

				var rom = this;
				var _logOnError = logOnError;
				var channel = new Channel(function(evt){
						if(evt.state=="ERROR" && !!_logOnError){
							logMessageToTagServer("Channel send failed: siteID="+Inq.getSiteID()+",customerID="+
								Inq.getCustID()+",url="+this.getFullUrl(), LOG_LEVELS.ERROR);
						}
						rom.ch.remove(channel);
				});
				channel.send(url, data, null, resendOnError, maxResendTimes, timeout);
				this.ch.push(channel);
			} catch (e){
				logErrorToTagServer("SvrCom.sendToServer ERROR:" + e);
                var errMsg = 'RemoteOpsMgr.send >>Exception making an HTTP Request. URL '+ url + catchFormatter(e);
                this.post(urls.loggingURL, {level:'ERROR', line:errMsg});
			}
		};
		/** 
		 * posts data to a server (no callback)
		 *
		 * If we are uiWebview, do not do post.  Under uiWebview, focus is stolen upon attachment of an IFRAME.
		 * .. So this steels focus from the text input in iOS applications using uiWebview
		 * .. This change is made for the VodaFone application.
		 */
		this.post = function(url, data, id){
			try {
                id = id ? id : "vanity" + Math.floor(Math.random()*1000001);
                var pstr = (typeof data == "string") ? data : this.toParamString(data);
                var port = (inqFrame.location.port != "") ? ":" + inqFrame.location.port : "";
                var parentURL = inqFrame.location.protocol + "//" + inqFrame.location.hostname + port + inqFrame.location.pathname;
                var postCookieRequest = ["POSTBR30", id, "", parentURL, encodeURIComponent(url + "?" + pstr)];
                (CM).postRequestToIframeProxy(postCookieRequest, id);
            } catch (e){
                logErrorToTagServer("SvrCom.sendToServer ERROR:" + e);
			}
		};
        
        this.postToServer = function(action, data) {
            if (isNullOrUndefined(data) || isNullOrUndefined(action)) {
                return;
            }
            var doc_ = document;
            var div = doc_.getElementById("inqPostBox");
            if (!div) {
                div = Inq.createFloatingDiv("inqPostBox", 0, 0, 1, 1);
                div.style.display = "";
                div.style.opacity = "0";
            }

            var idx = this.pIdx % 10;
            this.pIdx ++;
            var iframe = doc_.getElementById("box" + idx);
            if (iframe) {
                if (!isNullOrUndefined(this.postTime[idx])) {
                    var curTime = new Date().getTime();
                    var waitTime = 40;
                    if (curTime - this.postTime[idx] < waitTime) {
                        this.sleep(waitTime);
                    }
                }
                div.removeChild(iframe);
            }
            else {
                iframe = Inq.createHiddenIFrame("box" + idx, 0, 0, 1, 1);
            }
            iframe.style.overflow = "hidden";
            iframe.style.display = "";
	        iframe.width=1;
			iframe.height=1;
            iframe.src = "javascript://";
            iframe.style.border = "none";
            div.appendChild(iframe);
            var doc = null;
            if (iframe.contentDocument) {
                doc = iframe.contentDocument;
            } else if (iframe.contentWindow) {
                doc = iframe.contentWindow.document;
            } else if (iframe.document) {
                    doc = iframe.document;
            }
            if (doc != null) {
                doc.open();
                doc.write('<form name="aform' + idx + '" id="aform' + idx + '" action="' + action + '" method="POST">');
                for (var name in data) {
                    if (typeof data[name] == "function") continue;
                    doc.write('<textarea name="' + name + '">' + data[name] + '</textarea><br>');
                }
                doc.write('</form><br>');
                doc.close();
                doc.getElementById("aform" + idx).submit();
                this.postTime[idx] = new Date().getTime();
            }
        };

        /**
         * Sends data to specified agent
         * @param agentID {string} agentID to check if it exists
         * @param data {Object} data to be sent to agent
         */
        this.sendDataToAgent = function (agentID, data){
            if(agentID) {
                this.post(urls.baseURL+"/tracking/agent", data);
            }
        };

		this.sendCobrowseMessage = function (engagementID, agentID, customerId, cobrowseEvent, cobrowseMessageText){
			this.post(urls.baseURL+"/tracking/cobrowse", {
				engagementID: engagementID,
				agentID: agentID,
				customerId: customerId,
				cobrowseEvent: cobrowseEvent,
				cobrowseMessageText: cobrowseMessageText
			});
		};

        /**
		 * composes a url from data
		 * @param {String} url Url part of the URL to be assembled.
		 * @param {Object} data Map of name-value pairs to be "ampersand" appended to the given url
		 * @param {boolean} avoidRand shows wether we should do not add "_rand"
		 * @TODO RhinoUnit Tests
		 */
		this.composeURL = function (url, data, avoidRand){
			var p = this.toParamString(data, avoidRand);
			var idx = url.indexOf('?');
			if(p.length>0){
				if(idx < 0){
					p = "?" + p;
				}
				else if(idx < (url.length-1)){
					p = '&' + p;
				}
				return url + p;
			}
			return url;
		};
        /**
         * Add needed data
         * @param data data to send
         * @param caller - caller, if caller = null, then check mode
         */
		this.prepareDataToSend = function(data, caller) {
            if (isNullOrUndefined(caller)) {
                data.rid = "r1234567890";
            }
            else {
                data.rid = this._queueCaller(caller);
            }

        };
		/**
		 * Sends data to remote destination url with callback.
		 * data payload
		 * If this is going to the vanity domain we will "POST" the data via the IFrame/Proxy
		 *    this avoids the problem of length restrictions in "GET" methodology
		 */
		this.doRemoteCall= function(url, data, caller){
			var _win=inqFrame;
            this.prepareDataToSend(data, caller);
			var pstr = this.toParamString(data);
			var baseVanity = urls.vanityURL;

            if (url.indexOf(baseVanity) == 0) {
                this.post(url, pstr, data.rid);
            }
            else {
                /* We should never get here, unless we are doing a remote call to a url that is NOT our vanity domain
                 * This is always an error and should never happen
                 */
                var fault = new Error("remote call to non-vanity domain");
                ROM.post(urls.loggingURL, {level:'ERROR', line:('VANITY DOMAIN ERROR: ' + catchFormatter(fault))});
            }
        };
		/**
		 * Generates a new remote id string (sequentially) so unique callbacks may be made
		 * to the calling RemoteCaller.
		 */
		this.newRID= function(){
			return "r"+(this.ridx++);
		};
		this._queueCaller= function(caller){
			var rid = this.newRID();
			if(caller && caller.onRemoteCallback){
				this.waitingQ[rid]=caller;
			} else {
				throw "caller null or not an instance of RemoteCaller";
			}
			return rid;
		};
		this._dequeueCaller= function(rid){
			var c = this.waitingQ[rid];
			if(c){
				delete this.waitingQ[rid];
				return c;
			}
			return null;
		};
		/** 
		 * Universal callback for all remote ops. Used by the remote server to "call back" the
		 * calling RemoteCaller object.
		 */
		this.onRemoteCallback= function(rid, data){
			if(rid){
				var caller = this._dequeueCaller(rid);
				if(caller!=null){
					try{
						caller.onRemoteCallback(data);
					}
					catch(err){
						logErrorToTagServer(err);
					}
				}
			}
		};
		this.init = function() {
			if (this.initialized) {return;}
			this.initialized = true;
		};
		
		this.start = function() {
			if (this.started) {return;}
			this.started = true;
		};
			
	}
	MixIns.prepare(RemoteOpsMgr).mixIn(MixIns.Absorber).mixIn(MixIns.FrameworkModule);
	RemoteOpsMgr.prototype.toParamString = function(d, avoidRand){
		return RemoteOpsMgr.toParamString(d,avoidRand);
	};

	RemoteOpsMgr.prototype.rand = randStr;


	RemoteOpsMgr.toParamString = toParamString;

	RemoteOpsMgr.prototype.getTimestamp = function() {
		var timestamp = (new Date()).getTime();
		if (this.requestTimestamp < timestamp) {
			this.requestTimestamp = timestamp;
		} else {
			this.requestTimestamp++;
		}
		return this.requestTimestamp;
	};

	/**
	 * This function attempts to send data to a web server prior to the unloading of the document.
	 *
	 * Format of request:
	 * - Method: POST
	 * - Content-Type: "text/plain;charset=UTF-8"
	 *
	 * @see [MDN Navigator.sendBeacon()]{@link https://developer.mozilla.org/ru/docs/Web/API/Navigator/sendBeacon}
	 * navigator.sendBeacon - is experimental API (as of Oct 2015, is supported in Firefox and Google Chrome)
	 *
	 * @deprecated according to RTDEV-10625
	 *
	 * This function/method was used for sending of beacon
	 * and according to RTDEV-10625 this function is not used
	 * because the sending of beacon mechanism was moved to the postToServer iframe
	 * to avoid limitations of CORS in IE9- and for synchronous requests.
	 * @see postToServer.js/util.js function sendBeacon()
	 *
	 * @param {string} url
	 */
	RemoteOpsMgr.prototype.sendBeacon = function(url) {
		url += "&timestamp=" + this.getTimestamp();
		if (navigator.sendBeacon) {
			// navigator.sendBeacon - experimental API (currently - Sep 2015 - supported in Firefox and Google Chrome)
			// POST request
			navigator.sendBeacon(url);
		} else {
			var ieVersion = getBrowserMajorVer(true);
			if (window.XMLHttpRequest && (ieVersion == 0 || ieVersion >= 10)) {
				var xhr = new XMLHttpRequest();
				// It is important to send a synchronous request,
				// otherwise the window will close and the request will not be sent sometimes.
				xhr.open("GET", url, false);
				xhr.send("");
			} else {
				// This is a workaround for old IE.
				var onError = function(){}; // used empty function to override default handler of error
				var channel = new Channel(null, onError);
				channel.send(url);
			}
		}
	};
	/**
	 * CustomEvent class
	 * @class Represents a custom event definition
	 * @constructor
	 * @borrows Absorber#absorb as #absorb
	 * @borrows Cloneable#clone as #clone
	 * @see Absorber
	 * @param {Object} cEvtData custom event data definition
	 * Incoming data defined as follows:
	 * {name:"Converted", getEvtData: function(){ return {products:PM.getCookie("productsCookie")};}, aliases:[{name:"onSoldEvent", getEvtData: function(){return {"products":Inq.safe("inqSalesProducts")};}}]}
	 */
	function CustomEvent(cEvtData){
		this.absorb(cEvtData);
	}

	/**
	 * Checks any given object to see if any of it's methods 
	 * are supported listeners of this custom event.
	 * @returns {boolean} True if the given object sports listener 
	 * methods of the custom event or any of its aliases. False otherwise.
	 */
	CustomEvent.prototype.supportsListener = function(l){
		if(l){
			var lFcn = l["on"+this.name];
			if(lFcn && typeof lFcn=="function"){
				return true;
			}
			if (this.aliases && this.aliases.length) {
				for(var idx=0; idx<this.aliases.length; idx++){
					lFcn = l[this.aliases[idx].name];
					if(lFcn && typeof lFcn=="function"){
						return true;
					}
				}
			}
		}
		return false;
	};

	/**
	 * Invokes all methods supported by the CustomEvent on a given object with proper data.
	 * @param {object} rule the rule that fired the custom event
	 * @param {object} evt event object that triggered the rule firing this custom event.
	 * It is a source of contextual data that may be used to compose custom event data.
	 */
	CustomEvent.prototype.getData = function(rule, evt){

		// getEvtData method is expected in every CustomEvent object instance
		// The method itself is not available from object prototype, it is generated when business rules are rendered
		var data = this.getEvtData(rule, evt);

		// evtDataSupplement object is optional and is added if rule firing this custom event decides
		// to provide additional data
		if (this.evtDataSupplement) {
			MixIns.mixAbsorber(data);
			data.absorb(this.evtDataSupplement);
		}
		return data;
	}

	/**
	 * Invokes all methods supported by the CustomEvent on a given object with proper data.
	 * @param {object} l Observer object on which to invoke the methods for the customer event
	 * @param {object} rule the rule that fired the custom event
	 */
	CustomEvent.prototype.invoke = function(l, rule, evt){
		if(this.supportsListener(l)){
			var lFcn = l["on"+this.name];
			if(lFcn && typeof lFcn=="function"){
				l["on"+this.name](this.getData(rule, evt));
			}
			if(this.aliases){
				for(var idx=0; idx<this.aliases.length; idx++){
					var aliasEvt = this.aliases[idx];
					lFcn = l[aliasEvt.name];
					if(lFcn && typeof lFcn=="function"){
						try {
							var s =MixIns.JSON.stringify(aliasEvt.getEvtData(rule, evt)); 
							var sName = MixIns.JSON.stringify(aliasEvt.name);
							/* l is a local variable and not known to the eval function [on all browsers]
							 * So we must define a label for it temporarily in the client page and
							 * ... run it as belonging to the parent
							 * This then will run in the client window                              							 
							 */
							var label4l = "_inq_el_" +  (Math.round(Math.random()*982451653)).toString(36) ;
							win[label4l] = l ;	/* Publish (l) in the client window so it can be accessed in web-kit browsers and IE */							
							var code = "(parent)."+label4l+"[" + sName + "]("+s+")"; /* Note: parent is in parenthesis so "this" will point to it ! */
							eval(code); // invoke the alias methods too on the listener with alias data definitions.
							try {win[label4l] = null ; delete win[label4l];} catch(e){}	/* Unpublish (l) in the client window*/						
						}catch(err){
							err["within"] = "CustomEvent.invoke";		/* Specify where the problem is for the trace information */
							var sErr = catchFormatter(err) ;			/* Have catchFormater format the stack trace for log and for sending to the tagserver host */
							log("Error while calling the client side listeners"+decodeURIComponent(sErr));
							logMessageToTagServer("Failure in CustomEvent invoke "+sErr, LOG_LEVELS.INFO);
						}	
					}
				}
			}
		}		
	};

	/**
	 * Returns string representation of this object.
	 */
	CustomEvent.prototype.toString = function(){
		return "CustomEvent " + this.name;
	};

	MixIns.prepare(CustomEvent).mixIn(MixIns.Absorber).mixIn(MixIns.Cloneable);

	/**
	 * Returns copy of this object.
	 */
	CustomEvent.prototype.clone = function(){
		return new CustomEvent(this);
	};

	
	/**
	 * Singleton class that routes all observers to their respective observables. 
	 * Mitigates linkage amongst framework managers through delegation.
	 * @class Event Manager is a singleton class that routes all observers to their respective observables
	 * @constructor
	 * @borrows Absorber#absorb as #absorb
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @see Absorber
	 * @see FrameworkModule
	 */
	function EvtMgr(id){
		this._frameworkModule(id);
		this._observable(); // contract with MixIn.Observable
		this.initialized = false;
		this.observables = [];
		this.cEvts={};

		this.init = function(){
			if(!this.initialized){
				this.initialized=true;
			}
		};
		
		/**
		 * Appends an array of observables to the internal array of managed observables.
		 * @param {Object} ol Object whose children MAY be {@link Observable} instances to be appended.
		 * This method will test for observables and manage them when found.
		 * @see Observable
		 */
		this.addObservables = function(o){
			if(o){
				for(var idx in o){
					// avoid a recursive addListeners call later by not placing EVM into its own observables list
					if(o[idx].observable && o[idx] != this){
						this.observables.push(o[idx]);
					}
				}
			}
		};
		
		this.start = function() { 
			if(this.started) { return;}
			this.started = true;
		};
		
		
		/**
		 * Routes an array of observers to their correct respective {@link Observable}
		 * @param {Array} list An array of observers to be routed.
		 */
		this.addListeners = function(list){
			if(list && list.length){
				for(var i=0; i < list.length; i++){
					this.addListener(list[i]);
				}
			}
		};
		
		/** 
		 * Determines if a given object is an acceptable listener for this class.
		 * Overrides MixIn.Observable.isListener method.
		 * @see MixIn.Observable.isListener
		 */
		this.isListener = function (l){
			// Iterate over all custom events and look for
			for(var cEvtName in this.cEvts){
				var cEvt = this.cEvts[cEvtName];
				if(cEvt.supportsListener(l)) {
					return true;
				}
			}
			return false;
		};
	}

	/**
	 * Adds definition of custom event to the registry of custom events.
	 * @param {Object} customEvt object of CustomEvent class
	 */
	EvtMgr.prototype.addCustomEvent = function (customEvt) {
		if(customEvt && !this.cEvts[customEvt.name]){
			this.cEvts[customEvt.name] = customEvt;
		}
	};

	/**
	 * Adds all custom events from provided array.
	 * @param {Array} array of CustomEvent objects
	 */
	EvtMgr.prototype.addCustomEvents = function (customEvtsArr) {
		if(customEvtsArr) {
			for(var idx=0; idx < customEvtsArr.length; idx++){
				this.addCustomEvent(customEvtsArr[idx]);
			}
		}
	};

    EvtMgr.prototype.getCustomEvent = function (name) {
        return this.cEvts[name];
    };
	/**
	 * Removes definition of custom event from the registry of custom events.
	 * @param {Object} customEvt object of CustomEvent class
	 */
	EvtMgr.prototype.removeCustomEvent = function (customEvt) {
		if(customEvt)
			delete this.cEvts[customEvt.name];
	};

	/**
	 * Custom event fire action.
	 * @param eventName name of the custom event to fire
	 * @param rule the rule object that fires this event
	 * @param evt Event object that triggered the rule firing this custom event.
	 * It is a source of contextual data that may be used to compose custom event data.
	 * Optional but used a lot for service lifecycle events.
	 * @param evtDataSupplementFcn optional function generating additional data supplied at the time of custom event firing.
	 * These data are used to supplement/override data defined in the custom event definition.
	 * Does not apply to data in aliases.
	 * Function may be specified as a function object or as string representation of function.
	 * @param context {boolean} optional. Only in force when in persistent window. If defined and the event is fired in the persistent window 
	 * context, then the evtmgr will attempt to delegate the call to the main window's framework so that externally registered listeners
	 * may be notified.  If null, false or undefined, then the call is made normally (in current javascript context).
	 * @throws UnsupportedEventError when the event mgr is told to throw a CEvt it can't find.
	 */
	EvtMgr.prototype.fireCustomEvent = function (eventName, rule, evt, evtDataSupplementFcn, context) {
		if(!!context && CHM.isPersistentWindow()){
			try{
				parent.opener.Inq.fireCustomEvent(eventName, evt, rule);
			}catch(err){
				log("failed to fire custom event \""+eventName+"\" from persistent window: "+err);
			}
		}else{
			var cEvt = this.cEvts[eventName];
			if(cEvt){
				if (evtDataSupplementFcn) {
					cEvt = cEvt.clone(); // cloning the object not to modify event definition
					if (typeof evtDataSupplementFcn === 'function') {
						cEvt["evtDataSupplement"] = evtDataSupplementFcn(rule, evt);
					} else {
						cEvt["evtDataSupplement"] = eval("(" + evtDataSupplementFcn + ")()");
					}
				}
				this._fireEvt(
					function(l, evt) {
						if (l){
							cEvt.invoke(l, rule, evt); // using closures to invoke here
						}
					},
					evt
				);
				return;
			}
			throw ("UnsupportedEventError: " + eventName);
		}
	};
	
	EvtMgr.prototype.fireManualInvocationEvent = function(rule) {
		BRM.fireManualInvocationEvent(rule);
	};
	
	MixIns.prepare(EvtMgr).mixIn(MixIns.FrameworkModule).mixIn(MixIns.Observable);	

	/**
	 * Links a given observer to its correct observable.
	 * @param {Object} l Observer (listener) to be connected. If no {@link Observable} supports
	 * the listener, then no connection is made.
	 */
	EvtMgr.prototype.addListener = function(l){
		if(l){
			for(var i=0; i<this.observables.length; i++){
				this.observables[i].addListener(l);
			}
			if(this.isListener(l)){
				this._listeners.push(l);
			}
		}
	};

	/**
	 * Returns string representation of this object.
	 */
	EvtMgr.prototype.toString = function(){
		return "EvtMgr(\"" + this._id + "\")";
	};


	/**
	 * Landing Manager handles all page landing history and
	 * history questions including landing zones or content groups.
	 * @class Landing Manager class that handles all page landing history and
	 * history questions including landing zones or content groups.
	 * @implements {DataExporter}
	 * @param {String} id Manager unique id
	 * @param {Object} data Static data defined by TC BR30 xml.
	 */
	function LandingMgr(id, data){
		this._frameworkModule(id);
		this._observable();
		this.initialized = false;
		this.page = null;
        this.quickCGIndex = {};
        var cgIndex = 0;
        this.reinitialized = false;
		this.absorb(data);
        for (var cgId in this.contentGroups) {
	        this.contentGroups[cgId] = CG.c(this.contentGroups[cgId]);
            this.quickCGIndex[cgId] = cgIndex++;
        }
	}
	MixIns.prepare(LandingMgr).mixIn(MixIns.FrameworkModule).mixIn(MixIns.Absorber).mixIn(MixIns.Observable).mixIn(MixIns.Persistable);

	/**
	 * @inheritDoc
	 */
	LandingMgr.prototype.getData = function(){
		return MixIns.clonize({
			pageMarker: this.getPageMarker(),
			pageID: this.getPageID(),
			pageURL: this.getCurrentPageURL(),
			landingHistory: this.getLandingHistory()
		}).clone();
	};

	/**
	 * initializes the landing manager once instantiated. Resolves the url to a mapped page from the pages provided in
	 * data (seeded by constructor). Initializes persistence variables when invoked.
	 * @param {Boolean} [doReinit] set to true if it is desired to reinitialize the state of the landing manager to simulate a
	 * new page landing.
	 * @see MixIns.FrameworkModule
	 * @see reinitChat()
	 */
	LandingMgr.prototype.init = function(doReinit) {
		if(!!doReinit) {
			this.page=null;
			this.reinitialized = true;
		}
		if(!this.initialized){
			this.stateVar = new Variable(this.getID(),{lh:[]}, resources["state"]);
			this.stateVar.init();
			this.load();
		}
		this.initialized = true;
		if(this.page==null){
            var orID = Inq.overridePageID;
            if (orID > 0) {
                this.page = (this.pages[orID] ? this.pages[orID] : null);
            }
            else if (v3Lander.isRplMode){
                this.page = win.v3Lander.getPage();
            }
			else{
				this._resolvePage();
            }
		}
		this.pageFound = (this.page != null);
	};

	/**
	 * Internal use only. Resolves page for non-bup mode.
	 * @private
	 */
	LandingMgr.prototype._resolvePage = function(){
		var pages = this.pages;
		var pageURL = win.document.URL.toString();
		for(var i in pages) {
			var re = pages[i].re;
			// Hack Alert: "prepend directives" ex. (?i) in javascript are not supported but they
			// may exist in these regexps... consequently we need to strip them off and raise the
			// "case insensitive" flag as a javascript flag.
			var caseInsensitive = false;
			if (re.indexOf("(?i)") === 0) {
				re = re.substr(4);
				caseInsensitive = true;
			}
			var r = new RegExp(re, caseInsensitive ? "i" : undefined);
			var mat = r.exec(pageURL); // we need a precise match... the RegExp.test() method won't cut it.
			if (!!mat && mat[0] == pageURL) { // the regexp "consumed" the WHOLE URL... this is an exact match.
				this.page = pages[i];
				break;
			}
		}
	};

	/**
	 * Obtains the page url for the current page. If in persistent window, will return the url of the main context parent URL.
	 * @return {String} site main page url. Null if any error occurs. Should never throw error.
	 */
	LandingMgr.prototype.getCurrentPageURL = function(){
		try{
			return CHM.isPersistentWindow()?top.opener.document.URL:win.document.URL;
		}catch(e){
			return win.document.URL;
		}
	};

	/**
	 * Obtains a page marker for a given page history idx.
	 * @param {number} idx Index of the page history queue. 0 is current page.
	 * May be null or undefined. Will return current page marker if undefined. If it is a persistent window then
     * return value from origin
	 * @return {String} page marker for the given page idx."unmarked page" if page not found.Should never throw error.
	 */
	LandingMgr.prototype.getPageMarker = function(idx) {
        var p = null;
        if(CHM.isPersistentWindow()) {
            try {
                p = window.parent.opener.inqFrame.Inq.LDM.getPage(idx);
            } catch(err) {
                logMessageToTagServer("Can't get opener page marker data for ChatID = " + CHM.getChatID() + ". CustomerID = " + getCustID(), LOG_LEVELS.WARN);
            }
        }
        if(!p) {
            p =  this.getPage(idx);
        }
        return p?p.mID:"unmarked page";
	};
	/**
	 * Obtains a page id for a given page history idx.
	 * @param {number} idx Index of the page history queue. 0 is current page.
	 * May be null or undefined. Will return current page id if undefined. If it is a persistent window then
     * return value from origin
	 * @return {Number} page id for the given page history idx. -1 if page not found. Should never throw error.
	 */
	LandingMgr.prototype.getPageID = function(idx) {
        var p = null;
        if(CHM.isPersistentWindow()) {
            try {
                p = window.parent.opener.inqFrame.Inq.LDM.getPage(idx);
            } catch(err) {
                logMessageToTagServer("Can't get opener page id data for ChatID = " + CHM.getChatID() + ". CustomerID = " + getCustID(), LOG_LEVELS.WARN);
            }
        }
        if(!p) {
            p =  this.getPage(idx);
        }
        return p?p.id:-1;
	};
	/**
	 * Obtains a page marker for a given landing history queue index.
	 * @param {Number} idx Index of the page history queue. 0 is current page.
	 * May be null or undefined. Will return current page (idx = 0) if undefined or null.
	 * @return {Object} Page object consisting of id, mID and regex. Null if not found or queue is empty.
	 * Should not throw errors on any input.
	 */
	LandingMgr.prototype.getPage = function(idx) {
		try{
			var page = this.lh[idx?idx:0];
			if(page){
				var tempPage = this.pages[page.id];
				if(!isNullOrUndefined(tempPage)){
					return tempPage;
				}else{
					return {id:0, mID:"unmarked page", re:"(.*)"};
				}
			}
		}catch(err){}
		return null;
	};

	/**
	 * Obtains a page marker for a given page id.
	 * @param id Page id.
	 * @returns {String} Page marker. "unmarked page" if no corresponding marker for the page id.
	 */
	LandingMgr.prototype.getPageMarkerById = function (id) {
		var page = this.pages[id];
		if (page) {
			return page.mID;
		} else {
			return "unmarked page";
		}
	};

	/**
	 * Manages the landing history queue on every page landing.
	 * Prepends the current page id to the front of the queue and truncates
	 * old values to max queue size.
	 */
	LandingMgr.prototype.onPageLanding = function() {
		var pageid;

		/* array indexes of corresponded CG */
		var cgIdsArray;
		if (this.pageFound) {
			pageid = this.page.id;
		} else {
			// MAINT23-225 Click to chat will not launch if page ID is not defined, or if URL doesn't match a URL defined in Right Touch.
			pageid = -1;
		}

		/**
		 * use content groups that resolved at tagserver if isRplMode and loaded
		 * (see also {@link #applyPage} and {@link LaunchController.java#resolvePage})
		 */
		if (v3Lander.isRplMode && win.v3Lander.getContentGroupIDs()) {
			cgIdsArray = this.getCorrespondedCGIndexes(win.v3Lander.getContentGroupIDs());
		} else {
			cgIdsArray = this.findCorrespondedCG(pageid);
		}

        this.lh.unshift({id: pageid, cg: cgIdsArray});
		if(this.lh.length > this.qsize){
			this.lh.length = this.qsize > 0 ? this.qsize : 1;
		}
		this.save();
	};
	LandingMgr.prototype.load = function() {
		this.absorb(this.stateVar.getValue());
	};
	LandingMgr.prototype.save = function() {
		this.stateVar.setValue({lh: this.lh});
	};

	/**
	 * Obtains an array of marker id strings in the landing order.
	 * @return {Array} array of marker strings for the landing history.
	 * Never null. May be empty.
	 */
	LandingMgr.prototype.getLandingHistory = function(){
		var retval = [];
		for(var idx=0;idx<this.lh.length;idx++){
			retval[idx] = this.getPageMarker(idx);
		}
		return retval;
	};

	LandingMgr.prototype.start = function() {
		this.fireOnPageLandingEvent(this.page);
	};
	LandingMgr.prototype.pageCheck = function(pageID) {
		if (isNullOrUndefined(this.page)) {
			return false;
		} else {
			return this.page.id==pageID;
		}	
	};
	LandingMgr.prototype.reset = function() {};

	LandingMgr.prototype.fireOnPageLandingEvent = function(dat) {
		function onPageLanding(l, evt) {
			try {
				if (l.onPageLanding) {
					l.onPageLanding(evt);
				}	
			} catch(e) {
				log(e);
			}
		}

		this._fireEvt(onPageLanding, {page:this.page, data:dat, reinitialized:this.reinitialized});
	};

	LandingMgr.prototype.isListener = function(l) {
		return (l && l.onPageLanding);
	};

	LandingMgr.prototype.getPersistentID = function() {
		return this.getID();
	};

	LandingMgr.prototype.onDataReady = function() {
		log("LandingMgr#onDataReady");
	};
    /**
     * find CG which contains pgId
     * @param pgId
     */
    LandingMgr.prototype.findCorrespondedCG = function (pgId) {
        var out = [];
        var url = this.getCurrentPageURL();
        var index = 0;
        for (var cgId in this.contentGroups) {
            var cg = this.contentGroups[cgId];
            if (cg.contains(pgId, url, this.contentGroups)) {
                /* save index of passed CG */
                out[out.length] = index;
            }
            index ++;
        }
        return out;
    };

	/**
	 * get indexes of CG that described by content group ids
	 * @param cgIDs content group ids for current page
	 */
	LandingMgr.prototype.getCorrespondedCGIndexes = function (cgIDs) {
		var out = [];
		for (var i = 0; i < cgIDs.length; i++) {
			out.push(this.quickCGIndex[cgIDs[i]]);
		}
		return out;
	};

	LandingMgr.prototype.checkCG = function(cgID, optPgIdx) {
		var page = this.lh[optPgIdx&&optPgIdx<this.lh.length ? optPgIdx : 0];
		var cgIndex = this.quickCGIndex[cgID];
        if (isNullOrUndefined(cgIndex) || isNullOrUndefined(page)) {
            return false;
        }
        var passedCG = page.cg;
        for (var index = 0; index < passedCG.length; index ++) {
	        if (passedCG[index] == cgIndex) {
                return true;
            }
        }
        return false;
	};

    /**
     * Returns business units associated which content groups which contain current page id
     * @return {Array} array with business units set for content groups
     */
    LandingMgr.prototype.getCGBusinessUnits = function () {
        var result = [];
        for (var cg in this.contentGroups) {

            var buIDs = null;
            if (this.contentGroups[cg].contains(this.getPageID(), this.getCurrentPageURL(), this.contentGroups)) {
                buIDs = this.contentGroups[cg].getBusinessUnits();
                if (buIDs) {
                    for (var i = 0; i < buIDs.length; i++) {
                        result.push(buIDs[i]);
                    }
                }
            }
        }
        return result;
    };





     /**
	 * Business Rules Manager
	 * @class BRMgr
	 * @constructor
	 * @name BRMgr
	 * @param {Object} data containing field "rules" with rules and business rules and field globalRAtts with
	 *  global rule attributes.
	 * @implements {DataExporter}
	 * @borrows Absorber#absorb as #absorb
	 * @borrows Observable#addListeners as #addListeners
	 * @borrows Observable#clearListeners as #clearListeners
	 * @borrows Observable#_fireEvt as #_fireEvt
	 * @borrows Observable#addListener as #addListener
	 * @borrows Observable#isListener as #isListener
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @see Observable
	 * @see Absorber
	 * @see FrameworkModule
	 */
	function BRMgr(id, data) {
		 this._frameworkModule(id);
		 this._observable();
		 // Begin variables for RTDEV-12271.
		 this._counter = 0;  // Keep track of the number of mutation events occurred in one second.
		 this._isSuspending = false;
		 this._maxAllowedEventsPerSeconds = 5;
		 this._delayInMS = 50;  // polling timer dalay in milli-seconds.
		 this._lastDomMutationTime = 0;
		 this._oneSecond = 1000;  // 1000 milli-seconds.
		 this._domRules = [];
		 // End variables for RTDEV-12271
		 
        // MAINT24-159: rule overriding support: <override-rule> defined in business section overrides
        // <overridable-rule> with the same id defined in program section.
        // Note that validation of section where appropriate rules were declared and
        // matching of their ids is performed by XSD constaints, see br30.xsd for documentation.
        var rulesIndexes = {};
		var _brMgr = this;
		function onDomMutation(mutations){
			// RTDEV-12271 - The following logic was added to work around the AT&T performance issue.
			// The problem was caused by over 400 mutation Dom events were generated when the user
			// clicked the "Channel Add-ons" button on the AT&T pages.  As the result, the page was really
			// slow and caused the FireFox browser to show script too slow dialog.
			if (_brMgr._isSuspending) {
				return;
			}
			var curTime = new Date();
			if (_brMgr._lastDomMutationTime === 0) {
				_brMgr._lastDomMutationTime = curTime;
			}
			var diffTime = curTime - _brMgr._lastDomMutationTime;
			_brMgr._counter++;
			if (diffTime < _brMgr._oneSecond) {
				if (_brMgr._counter > _brMgr._maxAllowedEventsPerSeconds) {
					_brMgr._suspend();
					return;  // skip this event.
				}
			} else {  // reset the counter and lastDomMutation time.
				_brMgr._counter = 0;
				_brMgr._lastDomMutationTime = curTime;
			}
			_brMgr.onDomMutation(mutations);
		}
		if(!!window.MutationObserver){
			domObserver = new MutationObserver(onDomMutation);
			domObserver.observe(doc.body, {childList: true, subtree: true, attributes: true});
			doc.body.setAttribute('data-inq-observer', '1');
		}
        if(data && data.rules){
            for(var i = 0; i < data.rules.length; i++) {
                var r = data.rules[i];
				// RTDEV-12271 - hasDomTrigger property was set from base_rule.jsp and business_rule.jsp and the value was obtained
				// from RenderRule.java
				if (r.hasDomTrigger) {
					this._domRules.push(r);
				}
                var id = r.getID();
                var overridableRuleInd = rulesIndexes[id];
                if (overridableRuleInd == undefined) {
                	rulesIndexes[id] = i;	
                } else {
                    // The overridden rule is totally eclipsed by the overriding rule
                	data.rules[overridableRuleInd] = r;
                    data.rules.splice(i, 1);
                    i--;
                }
            }
        }
        // End of rule overriding support

		this.absorb(data); /* Absorbing data including data.rules*/
		this._varTable = {};
		this._rulesById = {};
        this._ruleIds = [];
		this._bActionable = true; // used for incrementality control
		if(data && data.rules){
			for(var i = 0; i < data.rules.length; i++) {
				var r = data.rules[i];
				this._varTable[r.getID()] = r.getVars();
				this._rulesById[r.getID()] = r;
				this._ruleIds[i] = r.getID();
			}
		}

		/**
		 * globalRAtts object comes with constructor parameter "data" and has following format:
		 * globalRAtts: {
		 *	 atts: [{name: 'name', value: 'value'}, ...],
		 *	 brIds: [1, 2, ...] or exclude: [1, 2, ...]
		 * }
		 * If neither brIds nor exclude are specified, that means all rules receive specified attributes.
		 */
		this.addGlobalRuleAttributes = function() {
			var ruleIdsToProcess = [];
			if (this.globalRAtts.brIds) {
				ruleIdsToProcess.append(this.globalRAtts.brIds);
			} else {
				if (this.globalRAtts.exclude) {
					for (var i = 0; i < this._ruleIds.length; i++) {
						var rId = this._ruleIds[i];
						if (!this.globalRAtts.exclude.contains(rId)) {
							ruleIdsToProcess.push(rId);
						}
					}
				} else {
					ruleIdsToProcess.append(this._ruleIds);
				}
			}


			for (var i = 0; i < ruleIdsToProcess.length; i++) {
				var rId = ruleIdsToProcess[i];
				var r = this.getRuleById(rId);
				if (r && r.addRuleAttributes) { // business rule objects must have this method
					r.addRuleAttributes(this.globalRAtts.atts);
				}
			}
		};

		if (this.globalRAtts) { // using absorbed object
			this.addGlobalRuleAttributes();
		}

		/**
		 * Obtains the complete set of rules in execution order.
		 */
		this.getRules = function() {
			return this.rules;
		};

		/**
		 * @TODO compete these methods
		 */
		this.start = function(){
			if (this.started) {
				return;
			}
			this.started = true;
		};
		this.init = function(reinitialize){
            if (this.initialized && !reinitialize) { return;}
            for(var i=0; i<this.getRules().length; i++){
                this.getRules()[i].init();
            }
            this.initialized = true;
            log(this.getID() + " initialized.");
		};
		this.load = function(){};
		this.save = function(){};
		this.onDataReady = function(){};

		/**
		 * Resets the rules in the manager for the PAGE ONLY.
		 * @TODO RHINOUNIT
		 */
		this.reset = function(){
			for(var i=0; i<this.rules.length; i++){
				this.rules[i].reset();
			}
		};

		 /**
		  * This function will be called when the number of mutation events exceeds the maximum allowed events
		  * during a pre-defined period. This function will set the "_isSuspending" variable to true and setup the
		  * timeout timer to reset the variables.
		  * @returns {number} the timerID that will be to clear the timeout.
		  * @private
		  */
		 this._suspend = function() {
			 _brMgr._isSuspending = true;
			 // Setup timer to reset the variables.
			 return window.setTimeout(function(){
				 _brMgr._counter = 0;
				 _brMgr._isSuspending = false;
				 _brMgr._lastMutationEventTime = new Date();
			 }, _brMgr._delayInMS);
		 };
	}
	MixIns.prepare(BRMgr).mixIn(MixIns.Persistable).mixIn(MixIns.Absorber).mixIn(MixIns.FrameworkModule);
	BRMgr.mixIn(MixIns.Observable);

	/**
	 * @inheritDocs
	 * @returns {Object} data object containing the following:
	 *  qBRs {BusinessRule[]},
	 *  rules {Rule|BusinessRule}[]
	 *  @see BRMgr#getQualifiedBusinessRules
	 *  @see BRMgr#getRules
	 */
	BRMgr.prototype.getData = function(){
		return {
			qBRs: this.getQualifiedBusinessRules(),
			rules: this.getRules()
		};
	};

	/**
	 * RTDEV-8091
	 * Reset el["tcRuleIDs"] which was set on initialize chat.
	 * see  Rule#_processDomTrigger
	 */
	BRMgr.prototype.resetForReinit = function() {
		for (var i = 0; i < this.rules.length; i++) {
			var triggers = this.rules[i].triggersFcn(this.rules[i]);
			for (var j = 0; j < triggers.length; j++) {
				var trig = triggers[j];
				var elArray = [];
				var el;
				if (trig.domElementID) {
					el = doc.getElementById(trig.domElementID);
					if (!!el) elArray[0] = el;
				} else if (trig.domElements) {
					for (var idx = 0; idx < trig.domElements.length; idx++) {
						elArray.append(trig.domElements[idx]);
					}
				}
				for (var k = 0; k < elArray.length; k++) {
					el = elArray[k];
					if (!isNullOrUndefined(el)) {
						el["tcRuleIDs"] = null;
					}
				}
			}
		}
	};

	/**
	 * obtains the persistable's id
	 * @return {string} string id
	 * @see FrameworkModule#getID
	 */
	BRMgr.prototype.getPersistentID = function() {
		return this.getID();
	};

	/**
	 * Obtains a list of rules for the page that may be targeted.
	 * @param {Boolean} [noShallowCopy] Set to true if a list of actual rule objects (not clones) are desired. Undefined
	 * or false will return a pure data clone of each rule that matches.
	 * @return {Array} array of rules that may target the page. Funnel levels ignored.
	 * @externalAPI Used by Implementation call and exposed through CustomerAPI.js
	 */
	BRMgr.prototype.getQualifiedBusinessRules = function(noShallowCopy){
		var sc = !noShallowCopy;
		return this._collect(function(rule){
			if(rule.isBR() && rule.areConditionalsMet()){
				return sc?MixIns.clonize(rule).clone():rule;
			}
		});
	};

	/**
	 * Listener interface for DOM mutation observations. BRMgr will notify all rules of the collective mutations
	 * to the DOM trees so they may reattach their listeners if a particular element is added.
	 * @param {MutationRecord[]} mutations An array of mutation records.
	 */
	BRMgr.prototype.onDomMutation = function (mutations){
		var nodesAdded = mutations.some(function(mutation) {
			return (mutation.addedNodes.length>0);
		}, this); // use BRMgr instance as "this" in the callback.
		var attrChanged = mutations.some(function(mutation) {
			return ((!!mutation.attributeName)? mutation.attributeName.length>0:false);
		}, this);
		if (nodesAdded || attrChanged) {
			this.refreshDomRules();
		}
	};

	/**
	 * Ensures that the rules that are listening for DOM events re-attach their listeners.
	 * Usually in response to DomMutationObserver triggers.
	 */
	BRMgr.prototype.refreshDomRules = function(){
		// RTDEV-12271 - Only reattach triggers for Dom rules.
		this._domRules.forEach(function(rule){
			rule.reattachDomTriggers();
		});
	};

	/**
	 * Iterates on every rule the mgr instance maintains and passes it to the parameter function.
	 * @param fcn {Function} Function whose contract must take 2 params:
	 *      1. rule
	 *      2. index of the rule in the rule array (like a priority)
	 * and returns the rule if "accepted" by the param passed function or null/undefined if not.
	 * @return {Array} array of rules that were vetted by the passed function.
	 * @throws {Error} When fcn param is null, undefined or not a function
	 * @private
	 */
	BRMgr.prototype._collect = function(fcn){
		var retcol = [];
		if(isNullOrUndefined(fcn) || typeOf(fcn)!="function"){
			throw new Error("Illegal Argument: expected a function, got "+(typeof fcn));
		}
		for(var i=0; i<this.rules.length; i++){
			var rule = this.rules[i];
			var val = fcn(rule, i);
			if(!isNullOrUndefined(val)){
				retcol[retcol.length]=val;
			}
		}
		return retcol;
	};

	/**
	 * Gets all variables categorized by rule id.
	 * @return {Object} series of arrays of vars mapped to rule ids.
	 * Each id maps to one array of vars.
	 * @TODO RHINOUNIT
	 */
	BRMgr.prototype.getRuleVarTable = function() {
		return this._varTable;
	};

	BRMgr.prototype.getRuleByName = function(ruleName) {
		var rule = null;
		// TODO: find way to find using a faster algorithm, consider sorting upon insertion of
		// rule?
		for (var i = 0; i < this.rules.length; i++) {
			if (this.rules[i].getName() === ruleName) {
				rule = this.rules[i];
				break;
			}
		}
		return rule;
	};

	BRMgr.prototype.getRuleById = function(ruleId) {
		return this._rulesById[ruleId];
	};

	BRMgr.prototype.setActionable = function(bActionable) {
		this._bActionable = bActionable;
	};

	BRMgr.prototype.isControlGroup = function() {
		return !this._bActionable;
	};

	BRMgr.prototype.fireManualInvocationEvent = function(rule) {
		var evt = {};
		if (!isNullOrUndefined(rule) && rule.onManualInvocation) {
			rule.onManualInvocation(evt);
		}
	};

	BRMgr.prototype.fireRuleSatisfiedEvent = function(rule) {
		var event = {rule: rule};

		function f(l, evt) {
			try {
				if (l.onRuleSatisfied) {
					l.onRuleSatisfied(evt);
				}
			} catch(e) {
				log("Error firing event onRuleSatisfied on " + l.toString() + ": \n" + e);
			}
		}

		this._fireEvt(f, event);
	};

	BRMgr.prototype.fireServiceInvitationEvent = function(rule, serviceType) {
		var event = {rule: rule, serviceType: serviceType };

		function f(l, evt) {
			try {
				if (l.onServiceInvitation) {
					l.onServiceInvitation(evt);
				}
			} catch(e) {
				log("Error firing event onServiceInvitation on " + l.toString() + ": \n" + e);
			}
		}

		this._fireEvt(f, event);
	};

	BRMgr.prototype.fireServiceEngagedEvent = function(eventData) {
		var outRule = null;
		try {
			outRule = this.getRuleById(eventData.brID)
		}
		catch (e) {
			log("error " + e)
		}
		if (isNullOrUndefined(outRule)) {
			outRule = {id: eventData.brID};
		}

		var event = {rule: outRule};

		function f(l, evt) {
			try {
				if (l.onServiceEngaged) {
					l.onServiceEngaged(evt);
				}
			} catch(e) {
				log("Error firing event onServiceEngaged on " + l.toString() + ": \n" + e);
			}
		}

		this._fireEvt(f, event);
	};

	BRMgr.prototype.fireServiceInteractedEvent = function(eventData) {
		var event = {rule: {id: eventData.brID}};

		function f(l, evt) {
			try {
				if (l.onServiceInteracted) {
					l.onServiceInteracted(evt);
				}
			} catch(e) {
				log("Error firing event onServiceInteracted on " + l.toString() + ": \n" + e);
			}
		}

		this._fireEvt(f, event);
	};

	BRMgr.prototype.fireServiceMissedEvent = function(rule, serviceType) {
		var event = {rule: rule, serviceType: serviceType};

		function f(l, evt) {
			try {
				if (l.onServiceMissed) {
					l.onServiceMissed(evt);
				}
			} catch(e) {
				log("Error firing event onServiceMissed on " + l.toString() + ": \n" + e);
			}
		}

		this._fireEvt(f, event);
	};

	BRMgr.prototype.fireExposureQualifiedEvent = function(eventData) {
		var event = eventData;
		function f(l, evt) {
			try {
				if (l.onExposureQualified) {
					l.onExposureQualified(evt);
				}
			} catch(e) {
				log("Error firing event onExposureQualified on " + l.toString() + ": \n" + e);
			}
		}

		this._fireEvt(f, event);
	};

	BRMgr.prototype.isListener = function(l) {
		var bListener = false;
		// add other "native" event handler methods here as needed
		if (l && (l.onRuleSatisfied || l.onServiceInvitation ||
				  l.onServiceEngaged || l.onServiceInteracted ||
				  l.onServiceMissed || l.onExposureQualified)) {
			bListener = true;
		}
		return bListener;
	};

    /**
     * Logs message on callback from TagServer with exposure result of request of C2C/Proactive
     * @param exposureData {Object} Json data received from TagServer
     * @param chatType {String} Type of service (C2C or proactive)
     */
    BRMgr.prototype.logExposureResult = function(exposureData, chatType) {
        var isReactive = !!(chatType == CHM.CHAT_TYPES.C2C);
        var agID = exposureData.agID ? ", agID=" + exposureData.agID : "";
        var msgData = "siteID=" + exposureData.siteID + ", custID=" + exposureData.customerID + ", pageID=" + exposureData.pageID + ", brID=" + exposureData.brID + agID + ", buID=" + exposureData.buID;
        if (exposureData.result == this.EXPOSURE_QUALIFIED_RESULT.OUT_HOP) {
            isReactive ? log("Callback: MISSED OPP: Outside of business hours for C2C " + msgData) :
                log("No Proactive Launch: Out of hours " + msgData);
        } else if (exposureData.result == this.EXPOSURE_QUALIFIED_RESULT.NO_AVAILABILITY) {
            log("No agents available " + msgData);
        } else if (exposureData.result == this.EXPOSURE_QUALIFIED_RESULT.WILL_OFFER) {
            log("Agents available " + msgData);
        }
    }

	BRMgr.prototype.EXPOSURE_QUALIFIED_RESULT = {
		OUT_HOP: "out_hop",
		NO_AVAILABILITY: "no_availability",
		EXISTING_OFFER: "existing_offer",
		WILL_OFFER: "will_offer"
	};


	/**
	 * Trigger representing a listener function name id.
	 * @constructor
	 * @param {String} id The id of the event trigger function.
	 * @param {Number} [delayInMS] The optional delayInMS of the event trigger.
	 */
	function Trigger(id, delayInMS){
		this.id = id;
		this.delayInMS = delayInMS?delayInMS:null;
	}

	/**
	 * Rule class representing all rule types
	 * @class Represents a rule.
	 * @constructor
	 * @borrows Absorber#absorb as #absorb
	 * @see Absorber
	 * @param {String} name The rule's name
	 * @param {Array} vars array of the rules {@link Variable} objects @see Variable
	 * @param {Array} triggers an array of {@link Trigger} objects
	 * @param {Function} conditionalFcn function that returns true or false based on a series of internal tests.
	 * @param {Function} actionFcn function that, when invoked, will execute the rules actions.
	 */
	function Rule(data){
		this.constants = {};
		this.absorbFields(data);
	}

	/**
	 * This function sets fields of the Rule object according to parameters passed to constructor.
	 * This code is placed to a separate function to be reused from both Rule and BusinessRule constructors.
	 */
	Rule.prototype.absorbFields = function(data) {
		this.triggerMet=false;
		this.absorb(data);
		this.vtable = {};
		if(data && data.vars){
			for(var i=0; i<data.vars.length; i++){
				this.vars[i] = Variable.getInstanceFromData(data.vars[i]);
				this.vtable[this.vars[i].getName()]=this.vars[i];
			}
		}

		/* invokes the rules actions directly. */
		this.doActions = this.actionFcn;
	};

	MixIns.prepare(Rule).mixIn(MixIns.JSON).mixIn(MixIns.Absorber);

	Rule.create = function(data){
		return new Rule(data);
	};

	Rule.prototype.getID = function(){
		return this.id;
	};
	Rule._delayedRules = {};
	Rule._timers = [];
	Rule._TIDX = 0;

	/**
	 * Sets the timeout in the current window to delay Rule execution.
	 */
	Rule._setTimeout = function(rule, delayInMS){
		var tidx = Rule._TIDX++;
		Rule._delayedRules[tidx] = rule;
		this.tidx = tidx;
		return window.setTimeout(function(){
				Inq.Rule._timerCallback(tidx);
			}, delayInMS);
	};

	/**
	 * static callback for all rules to invoke with their unique timer index.
	 * @param {number} tidx index of the rule whose timer callback is to be invoked.
	 * @see Rule#sleep
	 */
	Rule._timerCallback = function(tidx){
		Rule._popDelayedRule(tidx).timerCallback();
	};
	/**
	 * Pops a delayed rule off the waiting queue
	 * @param {number} tidx index of the rule to be popped of the queue.
	 * @returns {Rule} delayed rule with that idx. null if none found.
	 * @see Rule#sleep
	 */
	Rule._popDelayedRule = function(tidx){
		var rule = Rule._delayedRules[tidx];
		delete Rule._delayedRules[tidx];
		return (rule?rule:null);
	};

	/**
	 * Delays execution of the rule for a specified period of time.
	 * @param {Number} delayInMS amount of time to delay the execution of the rule.
	 */
	Rule.prototype.sleep = function(delayInMS){
		this.tid = Rule._setTimeout(this, delayInMS);
	};
	/**
	 * Resets the rule completely.
	 */
	Rule.prototype.reset = function(){
		Rule._popDelayedRule(this.tidx);
	};

	Rule.prototype.fireRule = function(evt, delayInMS){
		this.evt = evt;
		this.triggerMet = true;
		if(delayInMS>0) {
			this.sleep(delayInMS);
		} else{
			this.execute(evt);
		}
	};
	/**
	 * Getter method for the rule name.
	 * @returns {string} The rule's name.
	 */
	Rule.prototype.getName = function(){ return this.name; };
	/**
	 * method that connects the rules triggers to the framework.
	 * @see EvtMgr#addListener
	 */
	Rule.prototype.init = function(data){
		if(!this.triggersFcn) {
			log("ERROR: Rule+("+this.id+")["+this.name+"] was set without triggers. Rule will not execute.");
			return; // a rule without triggers is a cause for return
		} else if (typeOf(this.triggersFcn) == 'function') {
			// Since V4CHAT-99 triggers are rendered as functions to allow their initialization after Rule creation
			// thus enabling usage of constants and variables defined in the rule to initialize trigger delay.
			this.triggers = this.triggersFcn(this);
		}

		for(var idx=0; idx<this.triggers.length; idx++){
			var trig = this.triggers[idx];
			if(trig.domElementID || trig.domElements){
				initRule[this.getID()] = true;
				this._processDomTrigger(trig, true);
			}
			else if (trig.serviceType) {
				this._processSvcTrigger(trig);
			}
			else {
				this._processStdTrigger(trig);
			}
		}
	};

	/**
	 * Reattaches DOM triggers to maintain persistent listeners for our DOM-triggered rules.
	 * @public
	 */
	Rule.prototype.reattachDomTriggers = function(){
		var triggers = this.triggersFcn(this);
		triggers.forEach(function(trig){
			this._processDomTrigger(trig, false);
		}, this);
	};

	/**
	 * Attaches a standard trigger listener to the rule.
	 * @param {Trigger} trig Trigger instance containing listener spec.
	 * {@link Trigger}
	 */
	Rule.prototype._processStdTrigger = function(trig){
		var atrig = trig;  // do not remove... this is a subtle "closure" issue (js can't "close" on function parameters)
		this[trig.id] = function(evt) {
			this.fireRule(evt, atrig.delayInMS);  // closure on atrig var above
		};
	};

	/**
	 * Attaches a DOM trigger listener to the rule.
	 * @param {Object} trig Trigger instance containing the DOM listener spec instance.
	 * @param {boolean} init true, if business rules initialization.
	 */
    Rule.prototype._processDomTrigger = function(trig, init){
        var elArray = [];
        if (trig.domElementID) {
            var el = doc.getElementById(trig.domElementID);
            if (!!el) elArray[0] = el;
        } else if (trig.domElements) {
            for(var idx=0; idx < trig.domElements.length; idx++){
                elArray.append(trig.domElements[idx]);
            }
        }

        if(elArray.length > 0) {
            var r = this;
            // Listeners should be attached to elements only after the initialization of business rule
            if (initRule[this.getID()]) {
                for (var i = 0; i < elArray.length; i++) {
                    var el = elArray[i];
                    if (!isNullOrUndefined(el)) {
                        if (isNullOrUndefined(el["tcRuleIDs"])) el["tcRuleIDs"] = [];
                        var ruleIDs = el["tcRuleIDs"];
                        if (init || (!ruleIDs.contains(this.getID()))) {
                            //onMouseOver triggering consist with two parts because it should be fired if mouse was over the element for an interval
                            if(trig.id == "mousehover"){
                                attachListener(
                                    el,
                                    "mouseover",
                                    function (evt) {
                                        var hoverTime = trig.hoverTime ? trig.hoverTime : 15000;
                                        r.startHover = window.setTimeout('inqFrame.Inq.BRM.getRuleById(' + r.getID() + ').fireRule(' + MixIns.JSON.stringify(evt) + ',' + trig.delayInMS + ')', hoverTime);
                                    }
                                );
                                attachListener(
                                    el,
                                    "mouseout",
                                    function (evt) {
                                        window.clearTimeout(r.startHover);

                                    }
                                );

                            } else {
                                attachListener(
                                    el,
                                    trig.id,
                                    function (evt) {
                                        r.fireRule(evt, trig.delayInMS);
                                    }
                                );
                            }
                            el["tcRuleIDs"].push(this.id);
                        }
                    }
                }
            }
        }
    };
	Rule.prototype.log = function(msg,e){
		log("Rule #"+this.id+"("+this.name+"): "+msg+(e?"-> error="+e:""));
	};

	/**
	 * Attaches a Service trigger listener to the rule.
	 * @param {Object} trig Trigger instance containing the service listener spec instance.
	 */
	Rule.prototype._processSvcTrigger = function(trig){
		var svcTypes = this[trig.id + "_ServiceTypes"];
		var trigServiceType = trig.serviceType;
		if (isNullOrUndefined(svcTypes)) {
			svcTypes = this[trig.id + "_ServiceTypes"] = [trigServiceType];
			this[trig.id] = function(evt) {
				var evtServiceType = evt.chatType;
				if (svcTypes.contains(evtServiceType) || svcTypes.contains("ALL")) {
					this.fireRule(evt, trig.delayInMS);
				}
			};

		} else {
			if (!svcTypes.contains(trigServiceType) && !svcTypes.contains("ALL")) {
				svcTypes.push(trigServiceType);
			}
		}

	};

	/**
	 * Determine whether this rule will execute within its valid date range.
	 * @return true if current time is within the rule's dates of operation, false otherwise
	 */
	Rule.prototype.isWithinDateRange = function() {
		var inRange = true;
		if(!!this.dates) {
			var now = new Date();
			var start = !!this.dates.start ? this.dates.start : new Date(0);
			var end = !!this.dates.end ? this.dates.end : new Date(now.getTime() + 1);
			inRange = now.after(start) && now.before(end);
		}
		return inRange;
	};

	/**
	 * @returns {boolean} true if event criteria and conditions for the rule are fulfilled, false otherwise.
	 */
	Rule.prototype.areConditionalsMet = function(){
			return (this.conditionalFcn(this,this.evt) && this.triggerMet && this.isWithinDateRange());
	};

	Rule.prototype.timerCallback = function(){
		this.execute();
	};

	Rule.prototype.getConstant = function(cID){
		if(isNullOrUndefined(this.constants[cID])){
			return constants[cID];
		}
		return this.constants[cID];
	};

	/**
	 * executes the actions if conditions are met.
	 */
	Rule.prototype.execute = function(){
		try {
		if(this.active && this.areConditionalsMet()){
			this.doActions(this, this.evt);
		}
		} catch(e) {
			logActionErr(e, this);
		}
	};

	Rule.prototype.assertTrue = function(bfcn, testName, failmsg){
		var msg = "ASSERT: "+this.getName()+" - "+ testName + ": ";
		try{
			var b = bfcn();
			msg += b?"PASSED":("FAILED. "+failmsg);
			if(!b){
				msg = "*** "+msg;
			}
		}catch(err){
			msg += ("FAULT: "+err);
		}
		ROM.send(urls.loggingURL, {level:"info", line: msg});
		log(msg);
	};

	/**
	 * executes the actions if conditions are met.
	 */
	Rule.prototype.getVars = function(){
		return this.vars;
	};

	/**
	 * Returns string representation of this object.
	 */
	Rule.prototype.toString = function(){
		return "Rule " + this.getID() + " \"" + this.name + "\"";
	};

	/**
	 * Determines if a rule is a BusinessRule type or not.
	 * @return {Boolean} always false for Rule type.
	 */
	Rule.prototype.isBR = function(){
		return false;
	};

		/**
	 * Business Rule subclass of rule. Launches chats in addition to
	 * the other business Rule class allows.
	 * @class Represents a business rule.
	 * @extends {Rule}
	 * @borrows {Absorber} as #absorb
	 * @constructor
	 * @param {number} id Business rule id.
	 * @param {String} name name of the rule
	 * @param {number} qt queuing threshold
	 * @param {Array} vars array of {@link Variable} for this rule.
	 * @param {Function} triggersFcn function that returns an array of {@link Trigger} objects
	 * @param {Function} conditionalFcn function for the rule conditional
	 * @param {Function} actionFcn Function that contains all a rules actions ready for invocation.
	 * @param {number} businessUnitID optional business unit id value overriding default value
	 * @param {Array} [agtAtts] optional array of name-value pairs for the rule's agent attributes
	 * @param {Array} [ruleAtts] optional array of name-value pairs for the rule's attributes
	 * @param {Date} [startDate] staring date-time for which this rule is valid
	 * @param {Date} [endDate]  ending date-time for which this rule is valid.
	 * @requires Rule
	 */
	function BusinessRule(data){
		this.constants = {};

		this.absorbFields(data);
		if(!!this.ignoreFunnelLevel){
			this.constants["ifl"] = true;
			/* If the "cfl" conditions are present in the rule, this nullifies them. */
			this.constants["fl"] = Number.NEGATIVE_INFINITY;
		}
		// Per MAINT24-151 specifying funnel-level attribute in business rule is equivalent to
		// declaring rule constant "fl". One caveat is that if the fl is already delcared as a
		// constant in the rule, it will override the funnel-level attribute in the xml
		else if (!isNullOrUndefined(this.funnelLevel)) {
			if(isNullOrUndefined(this.constants["fl"]))
				this.constants["fl"] = this.funnelLevel;
		}
	}

	BusinessRule.prototype = new Rule();
	BusinessRule.prototype.constructor = BusinessRule;
	BusinessRule.create =function(data){
		return new BusinessRule(data);
	};

    MixIns.prepare(BusinessRule).mixIn(MixIns.Observable).mixIn(MixIns.RemoteCaller);

	/**
	 * Determines if a rule is a BR.
	 * @override
	 * @return {Boolean} always true for BRs
	 */
	BusinessRule.prototype.isBR = function(){ return true; };
	BusinessRule.prototype.execute = function(){
		try {
			if(this.active && this.areConditionalsMet()){
                if(!!this.ruleType && (getBlockedServicesList().contains(this.ruleType) || ((this.ruleType == CHM.CHAT_TYPES.POPUP || this.ruleType == CHM.CHAT_TYPES.POPUP_CALL) && this.constants["fl"] > PM.getVar("cfl").getValue()))) {
                    return;
                }
				BRM.fireRuleSatisfiedEvent(this);
				var incr_exclude = this.getRuleAttributeValue("incr_exclude")=="yes" ;
				if(!BRM.isControlGroup() || incr_exclude) {
					this.doActions(this, this.evt);
			    } else {
                    var dataMap = {
                        buID: this.getBusinessUnitID(),
                        siteID: Inq.getSiteID(),
                        brID: this.getID(),
                        agentAttributes: MixIns.JSON.stringify(this.getAgentAttributes())
                    };
                    this.callRemote(Inq.urls.agentsAvailabilityCheckURL, dataMap);
				}
			}
		} catch(e) {
			logActionErr(e, this);
		}
	};

    /**
     * Used to fire exposureQualified event for control group users
     */
    BusinessRule.prototype.onRemoteCallback = function(jsonData){
        var result = null;
        if(jsonData.inHOP === "true") {
            if(jsonData.availability === "true") {
                result = BRM.EXPOSURE_QUALIFIED_RESULT.WILL_OFFER;
            } else {
                result = BRM.EXPOSURE_QUALIFIED_RESULT.NO_AVAILABILITY;
            }
        } else {
            result = BRM.EXPOSURE_QUALIFIED_RESULT.OUT_HOP;
        }
        try{
            var exposureData = {
                siteID: Inq.getSiteID(),
                customerID: Inq.getCustID(),
                incrementalityID: getIncAssignmentID(),
                sessionID: getSessionID(),
                brID: this.id,
                group: PM.getVar("incGroup").getValue(),
                businessUnitID: this.getBusinessUnitID(),
                result: result,
                rule: this
            };
            BRM.fireExposureQualifiedEvent(exposureData);
        } catch(e){
            logErrorToTagServer("Error onRemoteCallback for control group customer : " + e);
        }
    };

	/**
	 * Returns string representation of this object.
	 */
	BusinessRule.prototype.toString = function(){
		return "BusinessRule " + this.getID() + " \"" + this.name + "\"";
	};

	/**
	 * Returns business unit id of this business rule if it was defined in the rule xml.
	 * If not defined, return default value.
	 */
	Rule.prototype.getBusinessUnitID = function(){
		var buID;
        if(!isNullOrUndefined(this.businessUnitID)) {
			buID = this.businessUnitID; // use the rule's bu id
		}
		else {
            buID = getDefaultBusinessUnitID(); // last resort
        }
		log("Rule#getBusinessUnitId(ruleid="+this.getID()+"): business-unit-id="+buID);
		return buID;
	};

	/**
	 * Compares 2 supplied attributes for equality of names. Returns true if names equal, values are NOT compared.
	 * 	Attributes have following format: {name: 'attribute name', value: 'attribute value'}.
	 * @param attr1 1st attribute to compare
	 * @param attr2 2nd attribute to compare
	 */
	BusinessRule.prototype.attrNamesEqual = function(attr1, attr2) {
		return (attr1 && attr2 && attr1.name && attr2.name && (attr1.name == attr2.name));
	};

	BusinessRule.prototype.getAgentAttributes = function() {
		return this.getAAtts();
	};

	BusinessRule.prototype.setAgentAttributes = function(attribs) {
		this.aAtts = attribs;
	};

	/**
	 * Returns true if array of agent attributes already contain attribute with the same name as of provided attribute.
	 * @param attribute in format {name: 'attribute name', value: 'attribute value'}
	 */
	BusinessRule.prototype.containsAgentAttribute = function(attribute) {
		return this.getAAtts().contains(attribute, BusinessRule.prototype.attrNamesEqual);
	};

	/**
	 * Adds rule attribute to the array of agent attributes. If attribute already exists, its value is updated.
	 * @param attribute in format {name: 'attribute name', value: 'attribute value'}
	 */
	BusinessRule.prototype.addAgentAttribute = function(attribute) {
		var attsArray = this.getAAtts();
		var isRemove = attribute.value == '';
		if (isRemove) {
			this.removeAgentAttribute(attribute);
			return;
		}
		if (!this.containsAgentAttribute(attribute)) {
			attsArray.append([attribute]);
		} else {
			for(var idx=0; idx < attsArray.length; idx++) {
				if(this.attrNamesEqual(attsArray[idx], attribute)) {
					attsArray[idx].value = attribute.value;
				}
			}
		}
	};

	BusinessRule.prototype.removeAgentAttribute = function(attribute) {
		var attsArray = this.getAAtts();
		if (this.containsAgentAttribute(attribute)) {
			for(var idx=0; idx < attsArray.length; idx++) {
				if(this.attrNamesEqual(attsArray[idx], attribute)) {
					attsArray.remove(idx);
					break;
				}
			}
		}
	};

	/**
	 * Adds provided attributes to the array of agent attributes. If an attribute already exists, its value is updated.
	 * @param array of attribute objects having format {name: 'attribute name', value: 'attribute value'}
	 */
	BusinessRule.prototype.addAgentAttributes = function(attributes) {
		for(var idx=0; idx < attributes.length; idx++) {
			this.addAgentAttribute(attributes[idx]);
		}
	};

    BusinessRule.convertToAttributeString = function(data) {
        if (isNullOrUndefined(data)) {
            return null;
        }

        var out = "";
        for (var index = 0; index < data.length; index++)  {
            if (index > 0) {
                out += ";";
            }
            // Attributes should be already encoded when they passed to c2c\chat requests, they use another methods.
            // See methods: BusinessRule.prototype.getAgentAttributes and BusinessRule.prototype.getAgentAttributesAsString , both(!) of them should return encoded values.
            out += data[index].name  + "," + data[index].value;
        }
        return out;
    }

	/**
	 * Get agent's attributes as string for log like: attrName,attrValue;attrName,attrValue
	 */
	BusinessRule.prototype.getAgentAttributesAsString = function() {
		if (!this.getAgentAttributes) {
			log("Only BusinessRule can have agent attributes.");
			return null;
		}
        return BusinessRule.convertToAttributeString(this.getAgentAttributes());
	};

	/**
	 * Get rule attributes as string for log like: attrName,attrValue;attrName,attrValue
	 */
	BusinessRule.prototype.getRuleAttributesAsString = function() {
		if (!this.getRuleAttributes) {
			log("Only BusinessRule can have rule attributes.");
			return null;
		}
        return BusinessRule.convertToAttributeString(this.getRuleAttributes());
	};

	BusinessRule.prototype.getRuleAttributes = function() {
		return this.getRAtts();
	};

	BusinessRule.prototype.setRuleAttributes = function(attribs) {
		this.rAtts = attribs;
	};

    /**
	 * Returns array of rule attributes in format: [{name: attr1, value: val1},{name: attr2, value: val2s}]
	 * to support global rule attributes functionality
	 */
    BusinessRule.prototype.getRuleAttributesAsArray = function() {
        return this.rAtts;
    };

	/**
	 * Returns the value of the given rule attribute
	 * @return {string} value for the given rule attribute, null if none found or attribute does not exist.
	 */
	BusinessRule.prototype.getRuleAttributeValue = function(attName) {
		var rAtt = this.getRuleAttribute(attName);
		return (!!rAtt && !!rAtt.value) ? rAtt.value : null;
	};

	/**
	 * Returns true if array of rule attributes already contain attribute with the same name as of provided attribute.
	 * @param attribute in format {name: 'attribute name', value: 'attribute value'}
	 */
	BusinessRule.prototype.containsRuleAttribute = function(attribute) {
		return this.getRuleAttributesAsArray().contains(attribute, BusinessRule.prototype.attrNamesEqual);
	};

	/**
	 * Returns the name,value pair that matches the current rule attribute name
	 * @param {string} attName
	 * @return {object} attribute object with name and value. Null if no attribute matches the name.
	 */
	BusinessRule.prototype.getRuleAttribute = function(attName) {
		var rAtts = this.getRuleAttributes();
		for(var ix=0;ix<rAtts.length;ix++){
			if(rAtts[ix].name==attName){
				return rAtts[ix];
			}
		}
		return null;
	};

	/**
	 * Adds rule attribute to the array of rule attributes. If attribute already exists, its value is updated.
	 * @param attribute in format {name: 'attribute name', value: 'attribute value'}
	 */
	BusinessRule.prototype.addRuleAttribute = function(attribute) {
        if(!this.rAtts) this.rAtts = [];
        var attsArray = this.getRuleAttributesAsArray();
		if (!this.containsRuleAttribute(attribute)) {
			attsArray.append([attribute]);
		} else {
			for(var idx=0; idx < attsArray.length; idx++) {
				if(this.attrNamesEqual(attsArray[idx], attribute)) {
					attsArray[idx].value = attribute.value;
				}
			}
		}
	};

	/**
	 * Adds provided attributes to the array of rule attributes. If an attribute already exists, its value is updated.
	 * @param array of attribute objects having format {name: 'attribute name', value: 'attribute value'}
	 */
	BusinessRule.prototype.addRuleAttributes = function(attributes) {
		for(var idx=0; idx < attributes.length; idx++) {
			this.addRuleAttribute(attributes[idx]);
		}
	};

	BusinessRule.prototype.getPriority = function() {
        return this.priority;
	};

	BusinessRule.prototype.getStartDate = function() {
		var start = null;
		if (this.dates && this.dates.start) {
			start = this.dates.start;
		}
		return start;
	};

	BusinessRule.prototype.getEndDate = function() {
		var end = null;
		if (this.dates && this.dates.end) {
			end = this.dates.end;
		}
		return end;
	};

	/**
	 * Returns language of this business rule if it was defined in the rule xml.
	 * If not defined, returns site default language.
	 */
	BusinessRule.prototype.getLanguage = function(){
		var language;
		if(!isNullOrUndefined(this._getLanguage)){ 
			try{
				language = this._getLanguage(this);
			}catch(e){
				language = getDefaultLanguage( );
				log("Error while getting language from the given Rule: \n" + e + "\n");
			}
		} else {
			language = getDefaultLanguage( );
		}
		return language;
	};

	/**
	 * returns current business rule agent group ID, if it is passed as a JS variable then it is rendered as
     * getAgID function, otherwise as property agID
     * returns default agent group id if there is no override in business rule
     * returns undefined if agent group settings lvl is not used for this site.
	 */
	BusinessRule.prototype.getAgentGroupID = function() {
		var agentGroupID;
        if(!!this.getAgID){
            agentGroupID = this.getAgID();
        } else if(!!this.agID) {
            agentGroupID = this.agID;
        } else {
            agentGroupID = !!getDefaultAgentGroupId() ? getDefaultAgentGroupId() : undefined;
        }
        return agentGroupID;
	};

	/**
	 * returns name of agent specified in business rule in agent profile
	 * returns undefined if agent not specified in business rule
	 */
	BusinessRule.prototype.getUniqueAgentName = function () {
		if (!!this.getAgentName && !!this.getAgentName()) {
			return this.getAgentName();
		}
		return undefined;
	};

    /**
     * return rule's funnel level value
     * default value is 5
     */
    BusinessRule.prototype.getFunnelLevel = function() {
        return this.funnelLevel;
    };
	


/**
 * @description converting the schedule class to a module which return singleTone object which produces schedule object
 * @module Schedule
 * @return {Object}
 */
var Schedule = (function() {

	/**
	 * Create an instance of Schedule object.
	 *
	 * @constructor
	 * @param {String} id identifier of this schedule
	 * @param {Date} periodStart optional date-time value to start this schedule.
	 *    If not specified schedule considered to be started.
	 * @param {Date} periodEnd optional date-time value to end this schedule.
	 *    If not specified schedule will continue forever.
	 * @param {Date} startTime optional value denoting time of the day when this schedule becomes active.
	 * @param {Date} endTime optional value denoting time of the day when this schedule becomes inactive.
	 * @param {Array} days weekly schedule as array of integers from 0 to 6 where 0 denotes Sunday, 6 - Saturday.
	 *    If not specified or empty then all week days are allowed.
	 */

	/**  4new This JSDoc is for the new Schedule
	 * @param {String} id        - identifier of this schedule
	 * @param {Date} periodStart - Start date-time (UTC) of a schedule.
	 *                              If null, schedule considered to be started.
	 * @param {Date} periodEnd   - End date-time (UTC) of a schedule.
	 *                             If null, schedule never finishes.
	 * @param {number} startTime - start time of day in sec.
	 * @param {number} endTime   - end time of day in sec.
	 * @param {Array} days       - weekly schedule as array of integers from 0 to 6
	 *                             where 0 denotes Sunday, 6 - Saturday.
	 *                              If null or undefined, all week days are allowed.
	 * @param {number} timezone  - Indicator of schedule version; new version has it.
	 *                                Timezone in string.
	 *
	 * Javascript Date-Time rules
	 * . Javascript only know local time zone and UTC timezone.
	 * . In human readable time, the rule is; local time + offset = UTC time
	 * . getTime always retuns in UTC
	 */
	function Schedule(id, periodStart, periodEnd, startTime, endTime, days, timezone) {
		this.id = id;
		this.periodStart = periodStart;		// 4new because javascript doesn't know timezone.
		this.periodEnd = periodEnd;
		this.startTime = startTime;			// 4new this should be start hour + tzOffset
		this.endTime = endTime;
		this.days = days;

		this.isScheduleMet = function () { return false; };
		if (typeof timezone == 'undefined') {
			this.isScheduleMet = isScheduleMetCur;
		}
		else {
			this.timezone = timezone;           // 4new because javascript doesn't know timezone.
			scheduleTZs[this.timezone] = 0;
			this.isScheduleMet = isScheduleMetNew;
		}


		/**
		 * Checks if this schedule is met at the specified point in time.
		 * @param {Date} dt point in time to check against this schedule.
		 *    This parameter must be client side time and will be normalized to server time by adding client time lag.
		 * @param {String} clientTimeLag optional parameter - the lag in ms between browser and server time.
		 *  Negative value e.g. -1000ms means browser clock is fast e.g. 10:00:01 compared to server clock 10:00:00.
		 * @param siteTzOfstMillis site timezone offset in miillis, e.g. -480 * 60 * 1000 for PST (GMT-0800).
		 * This value is used to determine current day of week for weekly schedules.
		 * @returns true is this schedule is met at the specified point in time.
		 *
		 * Note that this function is called by isSchMet() function only which always sends siteTzOfstMillis value.
		 * The siteTzOfstMillis value is server's timezone offset which is ajax queried and saved at client.
		 */
		function isScheduleMetCur(dt, clientTimeLag, siteTzOfstMillis) {
			var result = true;

			// removing client time lag - comparing all dates as if they were synchronized using server clock
			if (clientTimeLag) dt.roll(clientTimeLag);

			if (this.periodStart) result = dt.after(this.periodStart) || dt.equals(this.periodStart);
			if (result && this.periodEnd) result = dt.before(this.periodEnd) || dt.equals(this.periodEnd);
			if (result && this.days && !this.days.isEmpty()) {
				// Note that Date.prototype.getTimezoneOffset() returns negative value for positive offset TZ,
				// e.g. -120 for GMT+02:00
				if (!siteTzOfstMillis) siteTzOfstMillis = 0;
				var dtToGetSiteDay = new Date(dt.getTime() + dt.getTimezoneOffset() * 60000 - siteTzOfstMillis);
				var currentDayAtSite = dtToGetSiteDay.getDay();
				result = this.days.contains(currentDayAtSite);
			}

			if (result && (this.startTime || this.endTime)) {

				var DAY_MILLISEC = 24 * 60 * 60 * 1000;
				var msSinceBOD, dtSrvTime = dt.getTime();

				/* Define missing arguments */
				if (!siteTzOfstMillis) {
					siteTzOfstMillis = 0;
				}

				if (!this.startTime) {
					this.startTime = new Date(siteTzOfstMillis);
				}

				if (!this.endTime) {
					this.endTime = new Date(this.startTime.getTime() + DAY_MILLISEC - siteTzOfstMillis);
				}

				/* Remove days from 1970/1/1 and Get hours only. */
				msSinceBOD = dtSrvTime % DAY_MILLISEC;

				/* In UTC time, if endTime is on the following day  */
				if (this.endTime.getTime() > DAY_MILLISEC) {
					/* And the time is between 00:00 to endTime in the next day.  */
					if (msSinceBOD <= (this.endTime.getTime() - DAY_MILLISEC)) {
						msSinceBOD += DAY_MILLISEC;
					}
				}

				if (this.startTime) result = msSinceBOD >= this.startTime.getTime();
				if (result && this.endTime) result = msSinceBOD <= this.endTime.getTime();
			}
			return result;
		}

		/**
		 *    New isScheduleMet function used with schedule.timezone.
		 *
		 */
		function isScheduleMetNew(dt, clientTimeLag) {
			var result = true;

			// removing client time lag - comparing all dates as if they were synchronized using server clock
			if (clientTimeLag) dt.roll(clientTimeLag);

			// Check if the time is in period given
			// The period start/end are in UTC and the checkPeriod will use UTC to compare its period.
			result = Schedule.checkPeriod(dt, this);

			// Check Day
			if (result) {
				// Check if day is given.
				if (this.days && !this.days.isEmpty()) {
					result = Schedule.checkDays(dt, this);
				}
			}

			// Check Time
			if (result) {
				result = Schedule.checkTime(dt, this);
			}

			return result;
		}
	}

	// Member functions.
	/*
	 * Reset schedule date to correct time based on localtime.
	 * 
	 */
	Schedule.prototype.setScheduleDate = function (dt) {
		this.scheduleDate = new Date(dt.getTime());
		this.scheduleDate.roll(Schedule.getOffsetDiff(this.tzOffset, Schedule.getTimezoneOffsetMilli(dt)));
	}


	/*
	 * Return true when schedule has period start and/or end and dt is in given period.
	 */
	Schedule.checkPeriod = function (dat, schedule) {
		var result = true;

		if (schedule.periodStart && typeof schedule.periodStart.getTime == "function") result =
																					   dat.after(schedule.periodStart) || dat.equals(schedule.periodStart);
		if (result && schedule.periodEnd && typeof schedule.periodEnd.getTime == "function") result =
																							 dat.before(schedule.periodEnd) || dat.equals(schedule.periodEnd);

		return result;
	}

	/*
	 * Return true when given date's day is in schedule's day
	 */
	Schedule.checkDays = function (dat, schedule) {
		var result = true;

		// Apply timezone offset
		schedule.setScheduleDate(dat);

		if (schedule.days) {
			var scheduleDateLocalDay = schedule.scheduleDate.getDay();
			result = schedule.days.contains(scheduleDateLocalDay);
		}

		return result;
	}

	/*
	 *  Return true when given date value is in schedule's time range.
	 */
	Schedule.checkTime = function (dat, schedule) {
		var result = true;

		// Apply timezone offset
		schedule.setScheduleDate(dat);

		var scheduleTimeInSec = schedule.scheduleDate.getHours() * 60 * 60 + schedule.scheduleDate.getMinutes() * 60 + schedule.scheduleDate.getSeconds();
		schedule.scheduleTimeInMilSec = scheduleTimeInSec * 1000;

		// Check if time is given time.
		// this startTime is start time of day in seconds
		if (result && schedule.startTime) {
			result = schedule.scheduleTimeInMilSec >= schedule.startTime;
		}

		if (result && schedule.endTime) {
			result = schedule.scheduleTimeInMilSec <= schedule.endTime;
		}
		return result;
	}

	/*
	 *  Return timezone offset in milliseconds.
	 *
	 *  Note: since javascript getTimezoneOffset() function returns difference between UTC and local time. 
	 *  *** which means that the offset is positive if the local timezone is behind UTC and negative if it is ahead.
	 *  *** which means its sign opposit than standard and java notation.
	 *  *** hence this function returns offset with opposit sign.
	 *
	 * @parameter dt  - javascript date object
	 */
	Schedule.getTimezoneOffsetMilli = function (dt) {
		return -dt.getTimezoneOffset() * 60 * 1000;
	}

	/*
	 *  Return the difference of schedule timezone and local (javascript) timezone offset
	 *
	 *  Case 1: schedule +1, client -8 -> + 9
	 *  Case 2: schedule +1, client 0  -> + 1
	 *  Case 3: schedule -1, client -8 -> + 7
	 *  Case 4: schedule -1, client 3 -> -4
	 */
	Schedule.getOffsetDiff = function (offsetSchedule, offsetLocal) {
		return offsetSchedule - offsetLocal;
	}

	return {
		/**
		 * createSchedule function produces Schedule Object
		 * @public
		 * @link Schedule#createSchedule
		 * @param id
		 * @param periodStart
		 * @param periodEnd
		 * @param startTime
		 * @param endTime
		 * @param days
		 * @param timezone
		 * @return {Schedule}
		 */
		createSchedule: function (id, periodStart, periodEnd, startTime, endTime, days, timezone)
		{
			return new Schedule(id, periodStart, periodEnd, startTime, endTime, days, timezone);
		},
		/**
		 *  @public
		 *  @borrows Schedule.checkPeriod as checkPeriod
		 */
		checkPeriod:Schedule.checkPeriod,
		/**
		 *  @public
		 *  @borrows Schedule.checkDays as checkDays
		 */
		checkDays:Schedule.checkDays,
		/**
		 *  @public
		 *  @borrows Schedule.checkTime as checkTime
		 */
		checkTime:Schedule.checkTime,
		/**
		 *  @public
		 *  @borrows Schedule.getTimezoneOffsetMilli as getTimezoneOffsetMilli
		 */
		getTimezoneOffsetMilli:Schedule.getTimezoneOffsetMilli,
		/**
		 *  @public
		 *  @borrows Schedule.getOffsetDiff as getOffsetDiff
		 */
		getOffsetDiff:Schedule.getOffsetDiff

	}




}())
		/**
		 * Represents a C2C image in the DOM
		 * @name C2C
		 * @class
		 * @constructor
		 * @borrows Absorber#absorb as #absorb
		 * @borrows RemoteCaller#onRemoteCallback as #onRemoteCallback
		 * @borrows RemoteCaller#callRemote as #callRemote
		 */
		function C2C(mgr, rule, chatType, specDataFcn, c2p, adaCompliant, adaAndroidC2cSupportDomains){
			this._mgr = mgr;
			this._rule = rule;
			this.chatType = chatType;
			this.c2cSpec = MM.mergeC2CSpec(specDataFcn(rule)); // get the c2cSpec WITHOUT chat data
			this.specDataFcn = specDataFcn;
			this.adaCompliant = adaCompliant;
			this.adaAndroidC2cSupportDomains = adaAndroidC2cSupportDomains;
			EVM.addListener(this);
			this.idx = C2C.IDX++;
			this.clicked = false;
			this.c2p = c2p;
            this.pollCount = 0;
            this.pollTime = 0;
			this.oldState = null;
			this.newState = null;
		}
		MixIns.prepare(C2C).mixIn(MixIns.Absorber).mixIn(MixIns.RemoteCaller);
		C2C.IDX=0;
		C2C.c2CPageElementIDs =[];
		C2C.prototype.getIdx = function(){
			return this.idx;
		};

		/**
		 * obtains an instance of the base xml chat spec for the c2c.
		 * @throws if rule is undefined for the c2c
		 */
		C2C.prototype.getXmlChatSpec=function(){
			if(isNullOrUndefined(this._rule)){
				throw "C2C not ready: rule is undefined";
			}
			var xmlC2cSpec = this.specDataFcn(this._rule);
			if(!!xmlC2cSpec.chatSpec){
				return xmlC2cSpec.chatSpec; // return only the chat spec override portion if it exists.
			}
			// no overrides at the chatSpec level and below... create an xml chatSpec from scratch
			var c2cSpec = MM.mergeC2CSpec(xmlC2cSpec);
			return {id: c2cSpec.chatSpec.id}; //only the chatSpec
		};

		/**
		 * Remote callback from c2c display request. Expects JSON object as callback data for display.
		 */
		C2C.prototype.onRemoteCallback = function(dat){
			/*
			 RTDEV-10619; When chat is closed and requestC2C is sent to tagserver
			  response has an attribute called redisplayed: true.
			  If so, it will be used to set the focus back to C2C button.
			 */
			var setFocus = false;
            if(!!dat.c2cRedisplayed){
                BRM.fireRuleSatisfiedEvent(this.getRule());
				if(dat.c2cRedisplayed && dat.c2cRedisplayed == true) setFocus = true;
            }
			var exposureData = {
				siteID: Inq.getSiteID(),
				pageID: isNullOrUndefined(LDM.getPageID()) ? -1 : LDM.getPageID(),   
				customerID: Inq.getCustID(),
				incrementalityID: getIncAssignmentID(),
				sessionID: getSessionID(),
				brID: this._rule.getID(),
				group: PM.getVar("incGroup").getValue(),
				buID: this._rule.getBusinessUnitID(),
				agID: this._rule.getAgentGroupID(),
				channelID: this._rule.getBusinessUnitID(),
				result: dat.result,
				rule: this._rule
			};
            if(!this.repolled || (this.repolled && dat.result != this.result)){
                BRM.fireExposureQualifiedEvent(exposureData);
                BRM.logExposureResult(exposureData, CHM.CHAT_TYPES.C2C);
            } else {
                this.skipExposed = true;
            }
			this.absorb(dat);
			this.show(setFocus);
			if(this.optDataPass && !this.optDataPassListening){
				EVM.addListener({source:this, onAgentAssigned: this.optDataPass});
				this.optDataPassListening = true;
			}
			if(this.serviceMissedEvent) {
				BRM.fireServiceMissedEvent(this._rule, CHM.CHAT_TYPES.C2C);
			}
			this._mgr.nextRequest(this);
		};
		/**
		 * Forces a busy agent icon display.
		 * TODO: unit testing
		 */
		C2C.prototype.showAgentsBusyIcon = function(){
			this.showImg(this.busyURL);
		};

		/**
		 * Displays icon.
		 * @param {string} name - name of property (html or image)
		 * @param {boolean} clickable - true: client can click, false:  client can't click
		 */
		C2C.prototype.showIcon = function (name, clickable) {
			if (this.c2cSpec.c2cTheme.renderAsHTML) {
				this.showTextButton(name, clickable);
			} else {
				this.showImg(name, clickable);
			}
		};

		/**
		 * Shows a given HTML and displays it as optionally "clickable".
		 *
		 * @param {string} html is html as Textual Links for C2C Button
		 * @param {boolean} clickable - true: client can click on html, false:  client can't click on html
		 */
		C2C.prototype.showTextButton = function (html, clickable) {
			var div = this.getDiv();
			// @see com.inq.flash.client.chatskins.SkinControl.buildModalWindow
			var tabObjects = ["img", "a", "li", "input", "div", "select", "button"];
			var eventName = isIOS() ? "ontouchstart" : ( (isIE() && getBrowserMajorVer() <= 7) ? 'onmouseup' : 'onclick' ) ;
			var onclicktxt = clickable ? (eventName + '=\"inqFrame.Inq.C2CM.requestChat(' + this.idx + '); return false;\" onmouseover=\"this.style.cursor=\'pointer\'\" tabindex="0"') : '';
			div.innerHTML = '<div ' + onclicktxt + '>' + this.c2cSpec.c2cTheme[html] + '</div>';

			// Remove tab order from div if HTML contains an element in tab order by default
			if( div.firstChild != null ) {
				for (var i=0; i<tabObjects.length; i++) {
					if (isTagInElement(div.firstChild, tabObjects[i]) === true) {
						div.firstChild.removeAttribute('tabindex');
						break;
					}
				}
			}

			function isTagInElement(element, tag) {
				return (element && element.getElementsByTagName && element.getElementsByTagName(tag).length > 0);
			}
		};

		/**
		 * Shows a given image and displays it as optionally "clickable".
		 *
		 * @param img        - String, image property (filed) name. one of 'd', 'b', 'ah', or 'r'.
		 *                     Also check C2CMgr.prototype.IMAGETYPES
		 * @param clickable
		 */
		C2C.prototype.showImg = function(img, clickable){
			var div = this.getDiv(), func = null;
			/* If we are using inner iframes, then the div layer will be "decorated" with a function called "setSource" */
			try {func = div["setSource"];}catch(e){func=null};	/* Obtain possible function from inner IFRAME */
			var c2cModel = MM.getC2CSpec(this.c2cSpec.id);

			/* All image alt text's property names are; image property name + 'alt'.
			*          Defined at c2c-theme-model.jsp */
			var altText = this.c2cSpec.c2cTheme[img + 'alt'];
			if(typeof altText === 'undefined' || altText == null || altText === "") {
				altText = this.c2cSpec.altText ? this.c2cSpec.altText : ( c2cModel.altText ? c2cModel.altText : "Click To Chat");
			}
			// INVEST-545: under specific condition, the 'onclick' event is not fired in IE6 and IE7.
			var eventName = isIOS() ? "ontouchstart" : ((isIE() && getBrowserMajorVer() <= 7) ? 'onmouseup' : 'onclick' );
			/* If we are using an inner iframe, then func has the function, otherwise it is null
			 So ... if func is defined (not null or undefined) we want to reference the click event via "top." window */
			var onclicktxt = clickable ? (eventName + '=\"'+'inqFrame.Inq.C2CM.requestChat(' + this.idx + '); return false;\" onmouseover=\"this.style.cursor=\'pointer\'\" alt=\"' + altText + '\" tabindex="0"'): 'alt=\"' + altText + '\"';

			//In Firefox, By default if we don't mention the alt text information for input type image,  it displays 'Submit Query' text.
			//In MAINT25-111 to overcome this issue, i have added the alt attribute to type image tag.
			if (!!func) {										/* If the inner IFRAME has established the function, then use it to set image src */
				var domain = div["iframeDomain"];

				onclicktxt = 'top.top.inqFrame.Inq.C2CM.requestChat(' + this.idx + '); return false;';
				var mapAttributes = {};
				mapAttributes["style"] = "border-style: none; border-width: 0px;" ;
				mapAttributes["alt"] = altText ;
				mapAttributes["tabindex"] = "0" ;
				if (clickable){
					mapAttributes["style"] = "border-style: none; border-width: 0px; cursor: pointer;" ;
					mapAttributes["onclick"] = onclicktxt ;
				}

				mapAttributes["src"] = urls.mediaSiteURL + '/images/' + this.c2cSpec.c2cTheme[img];
				mapAttributes["role"] = "button";
				func(mapAttributes, domain);
			}
			else if((this.c2p || this.adaCompliant) && clickable){
				div.innerHTML='<input type="image" role="button" src=\"'+ urls.mediaSiteURL + '/images/' + this.c2cSpec.c2cTheme[img] + '\"' + onclicktxt + (this.adaCompliant?' style="cursor:default" ':'')+'/>';
				if(C2C.DummyC2CBtn.checkCondition(this.adaCompliant, this.adaAndroidC2cSupportDomains)) {
					if(C2C.talkBackDummyC2CBtnAdded == null) {
						C2C.DummyC2CBtn.add(div);
					}
					C2C.DummyC2CBtn.show(div);
				}
				/* RTDEV-11235
				 * VoiceOver(VO) on iOS9 doesn't detect dynamic element automatically and need little help
				 * VO behavior can be studied to improve the code
				 */
				if (this.adaCompliant && isIOS9()) {
					window.setTimeout(function () {
						var active = window.parent.document.activeElement;
						div.firstChild.focus(); // Let VO know that C2C is on a page.
						active.focus();
					}, 500);
				}
			}
			else{
				div.innerHTML='<img src=\"'+ urls.mediaSiteURL + '/images/' + this.c2cSpec.c2cTheme[img] + '\"' + onclicktxt + ' style="cursor:default" '+(CHM && CHM.chat && CHM.chat._isVisible?'aria-hidden="true" tabindex="-1"':'')+'/>';
				if(C2C.talkBackDummyC2CBtnAdded == true) {
					C2C.DummyC2CBtn.hide(div);
				}
			}
		};

		/** showClickToCallHtml - displays the click to call page in the c2c spot
		 *  This called by a rule and only by a rule
		 *
		 *  It's purpose is to replace the C2C image with a web url, mostly for a C2C that can:
		 *  1) show area to put in phone number
		 *  2) have button to push for placing the call request
		 *  JIRA: MAINT24-170
		 *
		 * @param urlHtml is the url path to the html
		 * @return - nothing
		 * TODO: unit testing
		 */
		C2C.prototype.showClickToCallHtml = function(urlHtml){
			var div = this.getDiv();
			var target =  urls.mediaSiteURL + '/images/' + this.c2cSpec.c2cTheme["r"] ;
			if (div!=null && target == div.firstChild["src"]){
				var frameSource = window.location.protocol + "//" +
								window.location.host +  ((window.location.port=="")?"":":"+window.location.port) +
								inqFrame.Inq.v3framesrc ;

				/** Publish showCallButton, this is analogous to GWT publishing (that's where I got the idea
				 *  We need to make the showCallButton accessible after obfuscation, so we publish it in the FlashPeer area
				 */
				if (inqFrame.Inq.FlashPeer["showCallButton"]==null) {
				inqFrame.Inq.FlashPeer.showCallButton = function(indx, source, left, top, number, show, giveFocus, title){
						(inqFrame.Inq.C2CM).showCallButton(indx, source, left, top, number, show, giveFocus, title);
				};
				}

				/** Pass data to the IFRAME as if this were XFORM */
				var iframeName = encodeURIComponent('{id: "'+ this.idx + '", clientHtml: "'+ frameSource + '"}');
				div.innerHTML=
						'<iframe width="100%" height="100%" ' +
						'name="'+iframeName+'" ' +
						'border="0" ' +
						'allowTransparency="true" ' +						
						'frameborder="0" scrolling="no" ' +
						'src="'+urlHtml+'" ' +
						'></iframe><input type="image" style="display: none;"></input>';
			}
		};

		/** Display the call button, from the IFRAME
		 *  The artwork is placed in exactly the same place as in the iframe
		 *  just placed over it in the client page.
		 *
		 * @param source - the url to the button image
		 * @param left - the left offset of the button
		 * @param top - the top offset for the button
		 * @param phone - The supplied phone number
		 * @param showButton - boolean, true: show button, false: hide button
		 * @param giveFocus - force focus to the button
		 * @param title - (optional) title (tooltip) for the mouse over
		 * @return nothing
		 * TODO: unit testing
		 */
		C2C.prototype.showCallButton = function(source, left, top, number, showButton, giveFocus, title) {
			var callBtnId = "tcCallButton";

			/* Set default values */
			if (giveFocus==null) giveFocus = true ;
			if (title==null) title = "Call "+number ;
			if (giveFocus==null) giveFocus = false ;
			if (showButton==null) showButton = true ;

			var div = this.getDiv();
			div.style.position = "relative";
			var form = document.createElement("form");

			/**
			 * Test for existance of the input immage, it is there, put in by showClickToCallHtml above
			 */
			var inputImage = null;
			var haveBtn = true ;
			if (inputImage==null&showButton==false) return ;
			var inputImages = div.getElementsByTagName("INPUT");
			if (inputImages!=null && inputImages.length > 0)
				inputImage = inputImages[0];
			var whenClicked = '(inqFrame.Inq.C2CM).requestChat(' + this.idx + ','+number+'); return false;';

			/* set up the call btn and place it in the same place it was in the iframe */
			inputImage.id = callBtnId;
			inputImage.src = source ;
			inputImage.idx = this.idx ;
			inputImage.fone = number ;
			inputImage.title = title ;
			inputImage.style.cssText = "display: "+((showButton)?"":"none")+";position: absolute; left: "+left+"px; top: "+top+"px;";
			inputImage.onClick = inputImage.onclick = function(){
				var indx = this.idx ;
				var fon  = this.fone;
				(inqFrame.Inq.C2CM).requestChat(indx,fon);
				return false;
				};
			if (giveFocus && showButton)  {
				if (inputImage["focus"]!=null) {
					try { inputImage.focus(); } catch (e){}
				}
			}

		};

		C2C.prototype.setClicked = function(isClicked) {
			this.clicked = isClicked;
		};

		C2C.prototype.isClicked = function() {
			return this.clicked;
		};

		/**
		 * gets a ref to the DOM instance that acts as a "view" for the this c2c instance model.
		 */
		C2C.prototype.forceGetDiv = function () {
			// if the rule contains the c2c page element ID details, we will give it the first preference
			// otherwise grab it from the c2c specs.
			if(!isNullOrUndefined(this.c2cSpec.div)){
				return this.c2cSpec.div;
			}
			this.pageElementID =  !!this.c2cSpec.peId ?  this.c2cSpec.peId : C2C.c2CPageElementIDs[this.id];
			var divId = this.pageElementID;
			return win.document.getElementById(divId);
		};

		/**
		 * Determines if a div is occupied or not.
		 * @return {Boolean} true if the div exists and is occupied, false if the div is either null or not occupied.
		 */
		C2C.prototype.isDivOccupied = function(){
			var adiv = this.forceGetDiv();
			if(!adiv){
				return false; // div is not occupied if it does not exist
			}
			return (!!adiv.occupied);
		};

		/**
		 * @return - div if it not occupied or rule the same.
		 */
		C2C.prototype.getDiv = function(){
			var div = this.forceGetDiv();
			div = (!!div && (!div.occupied || div.ruleID==this._rule.getID()))?div:null;
			try{
				if(div != null && typeof this.c2cSpec.chatSpec.lang != "undefined") {
					div.setAttribute("lang", this.c2cSpec.chatSpec.lang);
				}
			} catch (err) { /* All DOM operation should be in try catch block */ }
			return div;
		};

		/**
		 * Clears the DOM DIV's contents completely via innerHTML
		 */
		C2C.prototype.clear = function(){
			var div = this.getDiv();
			if (div) {
				div.occupied = false;
				div.innerHTML="";
			}
		};
		/**
		 * Clears and resets the invoked C2C object completely; allowing it to be occupied by another target.
		 * TODO: unit testing
		 */
		C2C.prototype.reset = function(){
            this.stopC2CAgentCheckTimer();
			this.clear();
		};
		/**
		 * Displays a given image and optionally sets it's absolute style.
		 * Fires an event that a C2C was displayed.
		 * @param {boolean} setFocus     - when this is true, C2C button will get focus.
		 */
		C2C.prototype.show = function(setFocus){
			var div = this.getDiv();
			if(!!this.c2cSpec.abs){
				div.style.position="absolute";
				div.style.top=this.c2cSpec.abs.y;
				div.style.left=this.c2cSpec.abs.x;
			}
			var image = this.image;
			if (CHM.isChatInProgress()) {
				this.launchable = false;
				image = this._mgr.IMAGETYPES.disabled;
			}

			if(!!div){
				div.occupied = true;
				div.ruleID = this._rule.getID();
				div.idx=this.idx;
				this.showIcon(image, this.launchable);
				if(this.newState) {
					this.oldState = this.newState;
				}
				this.newState = C2CM.STATES[image];
				if(this.newState != this.oldState) {
					C2CM.fireC2CStateChanged({oldState:this.oldState, newState:this.newState, c2c:this, rule:this._rule, data:this.data});
				}
				// fire the c2c displayed and service invitation events only when the c2c is displayed on the client page
				if (this.launchable && !this.skipExposed) {
					C2CM.fireC2CDisplayed({c2c:this, rule:this._rule, data:this.data});
					BRM.fireServiceInvitationEvent(this._rule, CHM.CHAT_TYPES.C2C);
				}
                this.skipExposed = false;
				/* RTDEV-11370
						setFocus is true when C2C is shown after a chat is closed
						 lastusedC2CId is defined in memory then the same C2C should gets focus
						 or first C2C gets focus.
						 In case if lastUsedC2CId is null then give priority to btnC2C than html c2c, providedly site has btnC2C
				 */
				if (setFocus === true && ((!C2CMgr.lastusedC2CId && C2CMgr.c2cBtnId==null && div.idx === 0) || (!C2CMgr.lastusedC2CId && C2CMgr.c2cBtnId!=null && C2CMgr.c2cBtnId == div.idx)
										  || (C2CMgr.lastusedC2CId && C2CMgr.lastusedC2CId === div.id))) {
					window.setTimeout(function () {
						var c2cDiv = win.document.getElementById(div.id);
						if (c2cDiv && c2cDiv.firstChild) {
							if(c2cDiv.firstChild.getAttribute('tabindex') !== null) {
								c2cDiv.firstChild.focus();
							} else if (c2cDiv.firstChild.firstChild) {
								if(c2cDiv.firstChild.firstChild.getAttribute('tabindex') === null) {
									c2cDiv.firstChild.firstChild.setAttribute('tabindex', 0);
								}
								c2cDiv.firstChild.firstChild.focus();
							}
						}
						C2CMgr.lastusedC2CId = null;
					}, 300);
				} else if(this.launchable && !this.c2cSpec.c2cTheme.renderAsHTML) {
					C2CMgr.c2cBtnId = this.idx;
				}
			}
			// start timer to do periodic checks of agent availability if poll count does not exceed the value from BR xml (by default - 50)
            this.pollCount++;
            if(this.pollCount < this.c2cSpec.aaciPollCount) {
                this.runC2CAgentCheckTimer();
            }
		};

        /**
         * Forces disabled icon display.
         */
        C2C.prototype.showDisabledIcon = function() {
            this.launchable = false;
	        if(this.getDiv()) {
		        this.showIcon(this._mgr.IMAGETYPES.disabled, this.launchable);
	        }
        };

        /**
		 * Listener for chat launch event. The C2C is supposed to become unclickable when
		 * in a chat state so the C2C nullifies its link when chat is launched.
		 * TODO: unit testing
		 */
		C2C.prototype.onChatLaunched = function(evt){
			this.showDisabled(evt);
		};

		/**
		 * showDisabled
		 * Changes state of C2C icon and fired corresponding event
		 * @param {object} evt
		 */
		C2C.prototype.showDisabled = function(evt) {
			this.stopC2CAgentCheckTimer();
			this.oldState = this.newState;
			this.newState = C2CM.STATES.d;
			this.launchable = false;
			C2CM.fireC2CStateChanged({oldState:this.oldState, newState:this.newState, c2c:this, rule:this._rule, data:this.data});
			if (this.getDiv()) {
				this.showIcon(this._mgr.IMAGETYPES.disabled, this.launchable);
			}
		};
		/**
		 * Listener for chat closed event. The C2C is supposed to become "available" again when
		 * not in a chat state so the C2C reinstates its link when chat is closed.
		 * TODO: unit testing
		 */
		C2C.prototype.onChatClosed = function(evt){
			this.absorb(this.specDataFcn());
			this.clear();
			if(evt.evtType===Inq.CHM.EVTS.CLOSED){
                this.C2CRedisplayed = true;
				this.request();
			}
            this.C2CRedisplayed = null;
			this.setClicked(false);
		};

		C2C.prototype.request = function() {
			if(C2CM.isBlocked(this.getChatType())) {
				this.reset();
				return;
			}
			var rule = this.getRule();
			var data = {
				siteID: siteID,
				brID: rule.getID(),
				brn: rule.getName(),
				pageID: LDM.getPageID(),
				chatType: this.chatType,
				priority: rule.getPriority(),
                qt:rule.getQueueThreshold(),
				buID: rule.getBusinessUnitID(),
                custID: Inq.getCustID(),
                agID: rule.getAgentGroupID()
			};
			if (isNullOrUndefined(data.pageID)) {
				data.pageID = -1;
			}
			if (!isNullOrUndefined(this.c2cSpec.igaa)) {
				data.igaa = this.c2cSpec.igaa; // agent availability override
			}
			if (!isNullOrUndefined(this._rule.getRuleAttributes())) {
				data.rAtts = this._rule.getRuleAttributes();
			}
			if (!isNullOrUndefined(this._rule.getAgentAttributes())) {
				data.aAtts =this._rule.getAgentAttributes();
			}
			if (!!this.c2cSpec.chatSpec && !isNullOrUndefined(this.c2cSpec.chatSpec.ignHOP)) {
				data.ignHOP = this.c2cSpec.chatSpec.ignHOP;
			}
			// MAINT24-208 BR30: do not present further C2Call invitations until the agent closes the call
			if (CHM.isCallServiceType(this.chatType) && CHM.getLastCallID()) {
				data.lastCallId = CHM.getLastCallID();
			}

            if(!!this.C2CRedisplayed){
                data.c2cRedisplayed = this.C2CRedisplayed;
            }
			var sData = MixIns.JSON.stringify(data);
			this.callRemote(urls.requestC2CImageURL, {d: sData, xd:Inq.xd});
		};

		C2C.prototype.getID = function() {
			return this.id;
		};

		C2C.prototype.getC2cTheme = function() {
			return this.c2cSpec.c2cTheme;
		};

		C2C.prototype.getChatSpec = function() {
			return this.c2cSpec.chatSpec;
		};

		C2C.prototype.hasAbsolutePosition = function() {
			return !!this.c2cSpec.abs;
		};

		C2C.prototype.getPosition = function() {
			return this.c2cSpec.position;
		};

		C2C.prototype.getRule = function() {
			return this._rule;
		};

		C2C.prototype.getChatType = function() {
			return this.chatType;
		};

		/**
		 * Starts a timer that would check agent availability and update C2C image accordingly.
         * If current polling time is greater than max poll time from business rules then timer will not start
		 * In fact when time intervall passes timer invokes usual C2C request sequence:
		 * request()->onRemoteCallback()->show()->runC2CAgentCheckTimer()
		 */
		C2C.prototype.runC2CAgentCheckTimer = function() {
            var maxPollTime = Number.MAX_VALUE;
            if(this.c2cSpec.aaciMaxTime) {
                maxPollTime = this.c2cSpec.aaciMaxTime;
            }
            this.pollTime += this.c2cSpec.aaci;

			if (!this.c2cSpec.igaa && this.c2cSpec.aaci &&
				(this.c2cSpec.aaci > 0 ) && (this.pollTime < maxPollTime)) {
                this.repolled = true;
				this.timeout_id = window.setTimeout("Inq.C2CM.getC2C(" + this.getIdx() + ").request()",
					this.c2cSpec.aaci);
			}
		};

		/**
		 * Stops check agent availability timer.
		 * TODO: unit testing
		 */
		C2C.prototype.stopC2CAgentCheckTimer = function() {
		    if (this.timeout_id) window.clearTimeout(this.timeout_id);
            this.repolled = false;
		};


		/**
		 * sets page element container IDs of all c2c specs available for the site.
		 */
		C2C.setC2CPageElementIDs = function(pageElementIDs){
			C2C.c2CPageElementIDs =  pageElementIDs;
		};

		/* Android 5.2, TalkBack doesn't support fixed position when page is scrolled down.
		 To work around, a dummy restore button is added at the bottom of the page and operated as
		 Restore button.
		 */
		C2C.talkBackDummyC2CBtn = null;
		C2C.talkBackDummyC2CBtnAdded = null;

		C2C.DummyC2CBtn = {
			checkCondition: function (adaCompliant, adaAndroidC2cSupportDomains) {
				var result = false;

				try {
					// Accessibility Enabled check || adaAndroidC2cSupportDomains is empty
					if (adaCompliant != true || typeof adaAndroidC2cSupportDomains == "undefined" || adaAndroidC2cSupportDomains.length == 0) {
						return;
					}

					// Android check
					if (window.navigator.userAgent.toLowerCase().indexOf("android") > -1) {
						// Domain check
						var adaAndroidC2cSupportDomainsArr = adaAndroidC2cSupportDomains.split(',');
						for (var i = 0; i < adaAndroidC2cSupportDomainsArr.length && result == false; i++) {
							if (parseUrl(inqFrame.location.href).host.toLowerCase() == adaAndroidC2cSupportDomainsArr[i].trim().toLowerCase()) {
								result = true;
								break;
							}
						}
					}
				}
				catch (err) { /* return false */ }

				return result;
			},
			add: function(divC2C) {
				try {
					C2C.talkBackDummyC2CBtn = divC2C.cloneNode(true);

					var divC2CImg = divC2C.getElementsByTagName('input')[0];
					divC2CImg.setAttribute('tabindex', '-1');
					divC2CImg.setAttribute("aria-hidden", "true");

					C2C.talkBackDummyC2CBtn.id = C2C.talkBackDummyC2CBtn.id + '_talkback';
					C2C.talkBackDummyC2CBtn.style.width = "100%";

					var btnDummyHome;
					var footers = top.document.getElementsByTagName('footer');
					if (footers.length > 0) {
						btnDummyHome = footers[0];
					}
					else {
						btnDummyHome = top.document.body;
					}

					btnDummyHome.appendChild(C2C.talkBackDummyC2CBtn);
					C2C.talkBackDummyC2CBtnAdded = true;
				} catch (err) {
					/* DOM exception and Cannot use support dummy Restore button. */
				}
			},
			show: function(divC2C) {
				if(C2C.talkBackDummyC2CBtn != null) {
					try {
						C2C.talkBackDummyC2CBtn.style.display = "block";
						var btnC2CImg = divC2C.getElementsByTagName('input')[0];
						btnC2CImg.setAttribute('tabindex', '-1');
						btnC2CImg.setAttribute("aria-hidden", "true");
					}
					catch (err) { /* DOM exception */ }
				}
			},
			hide: function(divC2C) {
				if(C2C.talkBackDummyC2CBtn != null) {
					try {
						C2C.talkBackDummyC2CBtn.style.display = "none";
						var btnC2CImg = divC2C.getElementsByTagName('input')[0];
						btnC2CImg.setAttribute('tabindex', '0');
						btnC2CImg.removeAttribute("aria-hidden");
					}
					catch (err) { /* DOM exception */ }
				}
			},
			remove: function(divC2C) {
				if (C2C.talkBackDummyC2CBtn != null) {
					try {
						var btnC2CImg = divC2C.getElementsByTagName('input')[0];
						btnC2CImg.setAttribute('tabindex', '0');
						btnC2CImg.removeAttribute("aria-hidden");
						C2C.talkBackDummyC2CBtn.parentNode.removeChild(C2C.talkBackDummyC2CBtn);
						C2C.talkBackDummyC2CBtn = null;
						C2C.talkBackDummyC2CBtnAdded = null;
					}
					catch (err) { /* DOM exception */ }
				}
			}
		};

	/**
	 * Chat manager for framework.
	 * @class Singleton chat manager for framework
	 * @constructor
	 * @implements {DataExporter}
	 * @param {String} id The unique framework id for the ChatMgr.
	 * @param data hard data required for construction configuration.
	 * 		currently, this includes the following:
	 * 		* thankYouShown -- image
			* thankYouEnabled -- image
			* displayTYImage -- image
			* c2CToPersistent -- c2c persistent flag
	 *
	 * @borrows Absorber#absorb as #absorb
	 * @borrows Observable#addListeners as #addListeners
	 * @borrows Observable#clearListeners as #clearListeners
	 * @borrows Observable#_fireEvt as #_fireEvt
	 * @borrows Observable#addListener as #addListener
	 * @borrows Observable#isListener as #isListener
	 * @borrows RemoteCaller#onRemoteCallback as #onRemoteCallback
	 * @borrows RemoteCaller#callRemote as #callRemote
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @borrows Persistable#load as #load
	 * @borrows Persistable#save as #save
	 * @borrows Persistable#getPersistentID as #getPersistentID
	 * @borrows Persistable#onDataReady as #onDataReady
	 * @see RemoteCaller
	 * @see Observable
	 * @see Absorber
	 * @see FrameworkModule
	 * @see Persistable
	 */
	function ChatMgr(id, data) {
		this._className="ChatMgr";
		this._frameworkModule(id);
		this._observable();
		this.pmor = false;
		this.absorb(data);
		this.popoutWindow = null;
		this.persisentWindow = null;		/* The actual window for the persistent chat instance */
		this.chat = null;
		this._init = false ;
		this.chatRequestQ = [];
		this.requestInProgress = false;
		this.hasEngaged = false;
		this.dataLoaded = false;
		this.evtIdx = 0;
		this.lpt = 0;
		this.earlyPopout = null; // Window of the soon-to-be pop-out chat
		this.lastChat = {}; // last chat data (chat of any type including call types)
		this.lastCallId = 0; // MAINT24-208: id of last call
		this._flashvarFcns = [];
		this._closeRetries = 0;								// Used in
		this.retryTimeout = null;
	}

	ChatMgr.CHM = null;
	ChatMgr.persistentTarget = "_inqPersistentChat";

	ChatMgr.prototype.getInstance = ChatMgr.getInstance = function(data) {
		if (isNullOrUndefined(ChatMgr.CHM)) {
			ChatMgr.CHM = new ChatMgr("CHM", data);
		}
		return ChatMgr.CHM;
	};

	/**
	 * @inheritDoc
	 */
	ChatMgr.prototype.getData = function(){
		if(this.isChatInProgress()){
			return MixIns.clonize(this.getChat().getChatData()).clone();
		}
		return null;
	};
	/**
	 *  StopClosingChatFromPersistent
	 *
	 *  See ChatMgr.prototype.closeChatFromPersistent
	 *
	 *   @param - none
	 */
	ChatMgr.prototype.StopClosingChatFromPersistent = function() {
		var instance = ChatMgr.getInstance();
		if (instance.retryTimeout != null) {
			window.clearTimeout(instance.retryTimeout);
			instance.retryTimeout = null;
		}
	};

	MixIns.prepare(ChatMgr).mixIn(MixIns.FrameworkModule).mixIn(MixIns.Observable).mixIn(MixIns.Absorber).mixIn(MixIns.Persistable).mixIn(MixIns.RemoteCaller);
	ChatMgr.prototype.log = function(msg){
		log("CHM: "+msg);
	};
	/**
	 * Logs exposure qualified for all remaining chat requests in queue.
	 */
	ChatMgr.prototype.drainRequestQ = function(){
		for(var i = 0; i< this.chatRequestQ.length; i++){
			var reqDat = this.chatRequestQ[i];
			var exposureData = {
				siteID: Inq.getSiteID(),
				customerID: Inq.getCustID(),
				incrementalityID: getIncAssignmentID(),
				sessionID: getSessionID(),
				brID: reqDat.rule.id,
				group: PM.getVar("incGroup").getValue(),
				businessUnitID: reqDat.rule.getBusinessUnitID(),
				result: "existing_offer",
				rule: reqDat.rule
			};
			BRM.fireExposureQualifiedEvent(exposureData);
		}
		this.chatRequestQ = []; // clear the chat queue
	};

	/**
	 * Request a new chat from the chat mgr
	 * @param rule a rule object containing a rule id and name
	 * @param chatType see ChatMgr.CHAT_TYPES for valid types
	 * @param xmlSpec {Object} this spec may be partially formed, at minimum containing only a specification id.
	 * 		the amount of information contained in a xmlSpec at this point is determined
	 * 		by the business rule that requested this chat. Missing spec data will be filled in
	 * 		by the media mgr if it is not specified in the business rule.
	 * 	item "p" was added to the data object to stop unintended caching of persistent chat
	 * 	... into a latter pop-up chat.
	 * @param phoneNumber (optional) is the phone number for which to automatically perform a click the call.
     * @param chatInProgressHandler {function} callback in case for chat in progress.
	 */
	ChatMgr.prototype.request = function(rule, chatType, xmlSpec, phoneNumber, c2cPersistent, chatInProgressHandler){
		var dat;
		if(!rule && this.chatRequestQ.length>0){
			dat = this.chatRequestQ.shift();
			rule = dat.rule;
			chatType = dat.chatType;
			xmlSpec = dat.xmlSpec;
			phoneNumber = dat.phoneNumber;
            c2cPersistent = dat.c2cPersistent;
            chatInProgressHandler = dat.chatInProgressHandler;
			this.log("De-queued data for "+rule);
		}
		if(this.isChatInProgress()){
			this.log("Chat already in progress... rule chat request ignored. rule="+rule.toString());
            dat = !!dat ? dat : {rule: rule};
			this.chatRequestQ.push(dat); // put it back on the queue for log flush and then reset queue
			this.drainRequestQ();
			this.requestInProgress = false;
            chatInProgressHandler();
			return; // chat is already in progress
		}
		if(this.requestInProgress){ // a chat has already been requested... queue up
			this.chatRequestQ.push({
                rule: rule,
                chatType: chatType,
                xmlSpec: xmlSpec,
                phoneNumber: phoneNumber,
                c2cPersistent: c2cPersistent,
                chatInProgressHandler: chatInProgressHandler
            });
			this.log("CHAT REQUEST ALREADY IN PROGRESS... waiting "+rule.toString());
			return; // request is already in progress... queue up and wait for reply
		}
		this.requestInProgress = true;
		this.log("Requesting chat for rule: "+rule.toString());
		/* Please note: it is important for ChatMgr.prototype.onPageLanding to clear the chat upon detection of off-site timeout
		 * Otherwise the code will fail below:
		 */
        var c2cToPersistent = c2cPersistent ? c2cPersistent : isC2cPersistent();
		// create a new data structure for the chat, we will persist the chat
		// data to cookies once we have a chatID from the tagserver (after the request).
		this.chatData = {
			ruleID: rule.getID(),
			chatType: chatType,
			xmlSpec: xmlSpec,
			pn: phoneNumber,
			pC: false,
			ci: {},
			aMsgCnt:0,
			cMsgCnt:0,
            c2cToPersistent: c2cToPersistent,
                        buID: -1
        };

		if(this.isBlocked(chatType)) { return; }
		this.rule = rule;
		if(!!phoneNumber)
			this.rule["phoneNumber"]=phoneNumber;
		this.xmlSpec = xmlSpec;
		var incGroup = PM.getVar("incGroup").getValue();
		this.chatType = chatType;
		var data = {
			p: (ChatMgr.persistentTarget == window.parent.name),	/* p (for persistent) was added to avoid caching problem */
			xd: PM.isCrossDomain(),
			siteID: siteID,
			pageID: LDM.getPageID(),
			custID: Inq.getCustID(),
			chatSpec:MM.mergeChatSpec(xmlSpec),
			chatType: chatType,
			pmor: this.pmor,
			rule: {
				id: rule.getID(),
				name: rule.getName(),
				priority: rule.getPriority(),
                qt:rule.getQueueThreshold(),
				aAtts: rule.getAgentAttributes(),
				ruleAttributes: rule.getRuleAttributes(),
				phoneNumber: phoneNumber,
				buID: rule.getBusinessUnitID(),
                agID: rule.getAgentGroupID()
			},
			incAssignmentID: getIncAssignmentID(),
			sessionID: getSessionID(),
			incGroup: incGroup
		};

		// MAINT24-208 BR30: do not present further C2Call invitations until the agent closes the call
		if (this.isCallServiceType(chatType) && this.getLastCallID()) {
			data.lastCallId = this.getLastCallID();
		}

		this.fireChatRequested(this, data);
		var sData = MixIns.JSON.stringify(data);
		try{
			this.callRemote(urls.requestChatLaunchURL, {d: sData});
		}catch(e){}
	};

	ChatMgr.prototype.init = function(){
		if (this._init) { return;}
		this.vitalVar = new Variable(this.getID(), {}, resources["vital"]);
		this.stateVar = new Variable(this.getID(), {}, resources["state"]);
		this.sessionVar = new Variable(this.getID(), {}, resources["session"]);
		this._init = true ;
		return this;
	};

	/**
	 * @returns - url for the chat router 
	 */
	ChatMgr.prototype.getChatRouterURL=function(){
		return urls.chatRouterVanityDomain ;	
	};

/**
   *  Ask the Chat Router for information via Code injection
   *  @param url - relative URL for the receiving java application
   *  @param dataJSON - the data in JSON format
   *  @param bust - flag signifying that cache busting is wanted
   */
	ChatMgr.prototype.ask=function(url, dataJSON, bust) {
		var rand =  (Math.round(Math.random()*1000000000123)).toString(36);
		var	crHost = this.getChatRouterURL() + url + "?";
		for (name in dataJSON) {
			crHost += ((crHost.indexOf("?")==-1) ? "?" : "&") + name + "=" + dataJSON[name] ;
	}
	if (bust) crHost += "&z="+rand ;
		var s = window.document.createElement("sc"+"ript");
		s.setAttribute("type", "text/javascript");
		s.setAttribute("language", "JavaScript");
		s.setAttribute("src", crHost);
		window.document.getElementsByTagName("body")[0].appendChild(s);
	};

	ChatMgr.prototype.getPersistentID = function(){};
	/**
	 * The onDataReady method is invoked by the PersistenceMgr when all cookie state is available.
	 * The ChatMgr may load its state at this point.
	 * ...Moved the "dataLoaded" setting to follow the test.
	 * TODO: unit test
	 */
	ChatMgr.prototype.onDataReady = function(){
        if(this.dataLoaded) {
            return;
        }
        this.dataLoaded = true;
        this.init();
        this.load();
        if(this.isPersistentWindow()){
            this.setPersistentChatSetting(true);
        }

        this.resetStateAfterPersistentChat();
        if (this.isPersistentWindow()) {
            var o = getOpener();
            try {o.setTimeout(o.inqFrame.Inq.ChatMgr.StopClosingChatFromPersistent, 1);
            }
            catch(e){
                log(e + " StopClosingChatFromPersistent");
            }
        }

    };

	/** ChatMgr.prototype.whenPersistent - fired when the chat-manager detects whether-or-not there is
	   *    a persistent chat.
	   *
	   *  This code allows the persistent chat to "follow" the same protocol and domain as the hosted client page
	   *  When the client page changes, and the protocol/host is different for the persistent chat, then we
	   *  	reissue the "open" request to change the persistent page.
	   *	This does not work in Chrome, and we are OK with that :)
	   *
	   *  @param isPersistent - boolean true/false
	   *  @param protoDomain - String containing the protocol and domain of the persistent chat
	   *  @param transferURL - new URL for the persistent frame
	   *  @param needNewOpener - opener needs to be reestablished
	   */
	ChatMgr.prototype.whenPersistent = function (isPersistent,protoDomain, transferURL, needNewOpener) {
		if (isPersistent) {
			var myProtoDomain = window.location.protocol + "//" + window.location.hostname ;
			if (myProtoDomain != protoDomain) {
				if(Inq.multiHost){
					/* If we have multiple hosts, then fix the pathname to be correct for this new domain */
					var myHash = transferURL.split("#"); 	// make an array of all elements separated by hash
					myHash.shift(); 						// remove protocol://domain/path
					/* Please note: window.location.pathname is the URL of the hosted file for this domain
					 * so just add the hash information on the end and we are good-to-go
					 */
					transferURL = myProtoDomain + window.location.pathname + "#" + myHash.join("#");
				}
				this.againPopoutChat(transferURL,true) ;
			}
			if (needNewOpener && (myProtoDomain == protoDomain)){
				this.againPopoutChat(transferURL,false) ;
			}
		} else {
			var instance = inqFrame.Inq.ChatMgr.getInstance();
			instance.setPersistentChatSetting(false)
		}
	};

	ChatMgr.prototype.isPersistentChatMaybeActive=function(){
		return this.getPersistentChatSetting();
	};

	/**
	 * The onRemoteCallback method is called after the ChatMgr has made a successful
	 * "requestChatLaunch" call to the remote launch controller. This callback
	 * method will contain all necessary data to actually display/launch a chat.
	 * @param chatData is a JSON object that can contains the following:
	 * 	chatID
	 * 	siteID
	 * 	pmor
	 * 	chatType
	 * 	chatSpec
	 *  custID
	 *  rule
	 *  persistentChat
	 *  relaunch
	 *  err
	 *  dbg
	 */
	ChatMgr.prototype.onRemoteCallback = function(chatData){
		this.requestInProgress = false;
		try {
			this.log("Request callback for rule: "+this.rule.toString());
			/* Sanity Check */
			if (this.isPersistentWindow()){
				if (!this.chat.pC){
					var fault = new Error("chatData incorrect");
					fault.name = "Launch Error";
					fault.funcName = "onRemoteCallback";
					logMessageToTagServer("Failure to Launch: "+catchFormatter(fault), LOG_LEVELS.INFO );
				}
			}

			var incGroup = PM.getVar("incGroup").getValue();
			this.pmor = chatData.pmor;
			if(this.chatType == this.CHAT_TYPES.POPUP || this.chatType == this.CHAT_TYPES.POPUP_CALL){
				var exposureData = {
					siteID: Inq.getSiteID(),
					customerID: Inq.getCustID(),
					incrementalityID: getIncAssignmentID(),
					sessionID: getSessionID(),
					brID: this.rule.id,
                    buID: this.rule.getBusinessUnitID(),
                    agID: this.rule.getAgentGroupID(),
                    pageID: isNullOrUndefined(LDM.getPageID()) ? -1 : LDM.getPageID(),
                    group: incGroup,
					businessUnitID: this.rule.getBusinessUnitID(),
					result: chatData.result,
					rule: this.rule
				};
				BRM.fireExposureQualifiedEvent(exposureData);
                BRM.logExposureResult(exposureData, this.chatType);
			}
			// if we have no chat id, then no chat should be launched
			// return immediately without creating a chat.
			if(isNullOrUndefined(chatData.chatID)) {
				if(chatData.serviceMissedEvent) {
					BRM.fireServiceMissedEvent(this.rule, this.chatData.chatType);
				}
				this.save();
				return;
			}
			this.chatData['id'] = chatData.chatID;
            this.chatData['v3TO'] = chatData.v3TO;
			this.chatData['qt'] = chatData.qt;
			this.chat = Chat.unmarshal(this.chatData).load();
			var launchTime = new Date();
			if (this.isImagePosition) {
                this.getChatData().getChatSpec().chatTheme.pos = "CENTER";
                this.getChatData().getChatSpec().chatTheme.lx = 0;
                this.getChatData().getChatSpec().chatTheme.ly = 0;
            }

			this.lastChat = {
				id: this.getChatID(),  // chat id
				chatType: this.chat.getChatType(), // chat type
				timestamp : launchTime,
				businessUnitID: this.rule.getBusinessUnitID(),
				brID: this.rule.id,
				agentGroupID: this.rule.getAgentGroupID()
			};

			// MAINT24-208 BR30: do not present further C2Call invitations until the agent closes the call
			if (this.isCallServiceType(this.getChatType())) {
				this.lastCallId = this.getChatID();
			}

			if(this.getChatType() == this.CHAT_TYPES.POPUP){
				this.lpt = new Date().getTime();
			}
            if(getInitialDFV()){
                window.parent.Inq.datapass = getInitialDFV().toString();
            }
            // MAINT27-278 (Create 'engagement.windowDisplayed' event): inHOP value here is used only
			// for windowDisplayed event and don't have to be persisted as part of chat data this.chat.cd
			this.chat.inHOP = chatData.inHOP;
            this.setDisconnectFlag(0);
			this.launchChat(this.chat);
			if(this.getChatType() == this.CHAT_TYPES.MONITOR) {
				this.closeChat();
			}
			this.save();

			// MAINT25-129: chatID=0 in 'conversionFunnel.engaged'
			// Moved firing this event from C2CMgr here to be sure chatid is already available
			if (this.getChatType() == this.CHAT_TYPES.C2C || this.getChatType() == this.CHAT_TYPES.C2CALL) {
				BRM.fireServiceEngagedEvent({brID: this.rule.id});
			}
		} catch(e) {
			logMessageToTagServer("Failure to Launch: "+catchFormatter(e), LOG_LEVELS.INFO);
			log("Error parsing Chat Data: \n" + e + "\n" + chatData);
			if (this.earlyPopout) {
				try {
					this.earlyPopout.close();
				}catch(e){}
			}
		}
		finally{
			if(this.chatRequestQ.length>0){ // send next request
				this.request();
			}
		}
	};
	ChatMgr.prototype.resetStateAfterPersistentChat = function() {
		if (!this.isPersistentChat()) {
			return;
		}
		if (!this.isPersistentChatInProgress()) {
			this.chat.close();
			delete this.chat;
			this.save();
		}
	};

    /**
     * Sets number cookie to mark if chat was closed by disconnect(1) or normal way(0)
     * @param {Number} value, boolean value as 1 or 0
     */
    ChatMgr.prototype.setDisconnectFlag = function(value) {
        var disconnectVar = PM.getVar("disconnect");
        if(!disconnectVar) {
            disconnectVar = new Variable("disconnect", 0, resources["state"], "_dcnt", function(o){ return parseFloat(o);});
            disconnectVar.init();
            disconnectVar.setValue(value);
            PM.addVar(disconnectVar);
        } else {
            disconnectVar.setValue(value);
        }
        if(value == 1) {
	        var msg = prepareLoggingContext("Chat was closed by timeout.");
	        ROM.post(urls.loggingURL, {level:LOG_LEVELS.INFO, line: msg});
	        log(msg, LOG_LEVELS.INFO);
        }
    };


    /**
	 * The onPageLanding event is generated by the LandingMgr. It signifies that the browser
	 * document has changed because a new page has loaded. The chat manager must re-animate
	 * any existing chat at this point.
	 */
	ChatMgr.prototype.onPageLanding = function(evt) {
		try {
		if(!!evt.reinitialized && this.isChatInProgress())
			return;
		if(this.getPersistentChatSetting()){
			this.setPersistentWindowActive(true);
			var o = getOpener(); // Have the client window register the persistent window as active
			if (o) {
				try {
					o.setTimeout("inqFrame.Inq.FlashPeer.setPersistentWindowActive(true);", 1);
				} catch (e) {}
			}
		}

		if (!this.isPersistentChat()){
			if (this.isV3Continue()){
				var now  = (new Date()).getTime();
				var chatInterfaceData = this.getChatInterfaceData();
				var then = chatInterfaceData.lt;
				var initialTimeOut = chatInterfaceData.it;
				var chatWindowAppeared = chatInterfaceData.cwa;
				var isEngaged = chatInterfaceData.isEngaged;
				/* For XD mode we can store time of unload only in inqLT
				for the same reason we keep inqCA */
				if (CM.xd) {
					// Should be number because we have sum of two numbers otherwise it will concatenate values as strings.
					var unloadTime = Number(CM.cookies["inqLT"]);
					if (unloadTime && then && unloadTime > then) {
						then = unloadTime;
					}
				}
				then = (then) ? (then + (1000 * this.getChat().getChatData().v3TO)) : null;
				if ((then != null && then < now) || (!isEngaged && (now - chatWindowAppeared) > initialTimeOut * 1000)){
                    this.setDisconnectFlag(1);
                    this.setChatInterfaceData({});
					/**
					 * If we have timed-out, we must clear the Chat Interface data and the chat
					 * this.chat MUST be reset to null or  ChatMgr.prototype.request will fail
					 * ChatMgr.prototype.request tests for chat being null, if it is not, it returns
					 * ... and the request will not continue.
					 */
					this.chat = null ;
					this.save();
				}
				else if (!this.isV3Active() && !this.isPersistentChatActive()){
					if( v3Lander.isBupMode && isNullOrUndefined(this.getChat().getRule())) {
						// Chat lost it's rule data so we may have wandered off our BU for this chat and BR.
						// we need to call in the rules for that BU before continuing
						v3Lander.loadMbuDataForBU(
							this.getChat().getChatData().buID,
							function(ruleDataFcn){
								eval("var dataFcn = "+ruleDataFcn.toString());
								var ruleData = dataFcn();
								CHM.continueChatting(ruleData);
							}
						);
					}
					else{
						this.continueChatting();
					}
				} else if(getOSType() === "iOS" || getOSType() === "Android") {
					/** This is handle situations where unload event is not fired on ios/Android when user closes the window from multiple window screen.It should be safe to continue chatting
					 if isV3Active is true ie 1.Only downside with this approach is when the same page is opened in another tab,Chat Launches because of this code. **/
					this.continueChatting();
				}
			}



			/** OK if:
			 *      we are NOT persistent
			 *      we are NOT a continuation
			 *      we have a chat object
			 * Then: we need to delete it because:
			 *      if we are not a continuation and we just landed here, how can we have a chat!
			 * So it is left over from a chat on a previous page like from a chat that has a thank-you image
			 * ... and we transitioned to this page WITHOUT closing the thank-you!
			 *
			 *  JIRA Ticket https://dev.inq.com/jira/browse/MAINT24-254
			 *  Description:  C2C available image becomes unclickable when the customer refreshes or goes to another page without closing TY image
			 */
			else if (this.chat!=null && !this.isV3Active()){
				this.chat.close();
				delete this.chat;
				this.save();
                log("Ended chat was closed");
			} else{
                if(this.chat!=null) {
                    log("There is chat interface opened in other tabs, no c2c available or proactive will be displayed ");
                }
            }
		} else {
			/* Test for persistent chat, if persistent then we are active */
			this.testForPersistentChat();
		}
		} catch (e){
			logMessageToTagServer("CHM failure on onPageLanding: "+catchFormatter(e), LOG_LEVELS.ERROR);
		}
	};

	ChatMgr.prototype.start = function(){
		if(this.started) {return;}
		this.started = true;
	};

ChatMgr.prototype.getOpenerChatFrame=function(){
	try {
		if(this.isPersistentWindow() && Inq.isSameOrigin()){
			return Inq.parent.opener.inqFrame;
		}
	} catch (err){
		logMessageToTagServer("Failure to Launch: "+catchFormatter(err), LOG_LEVELS.INFO);
	}
	return null;
};

ChatMgr.prototype.persistentRefresh =  null;  //cookie data for refreshing persistent chat

	/**
   *   Sets data needed to refresh the persistent chat
   */
ChatMgr.prototype.setPersistentRefresh=function(refreshData) {
	var ptrn="tcRefresh=";
	document.cookie = ptrn+refreshData+";";
	this.persistentRefresh = refreshData	;
};

/**
   *  getPersistentRefresh
   *  checks cookie to see if persistent is being refreshed
   */
ChatMgr.prototype.getPersistentRefresh=function() {
			var refresh = null ;
			if (!Inq.CHM.isPersistentWindow()) return null;
			if (Inq.CHM.persistentRefresh!=null) return Inq.CHM.persistentRefresh ;
			var _opener = null ;
			try {_opener = Inq.CHM.getOpenerChatFrame() ;} catch (e){ _opener = null;}
			/* Add guard condition for a closed opener, this can cause a throw if client window has been closed */
			if (_opener && !_opener.closed &&  opener.Inq.CHM["persistentRefresh"]!=null){
				return _opener.Inq.CHM.persistentRefresh;
				}
			if (document.cookie.length < 1) return refresh ;

			var ptrn="tcRefresh=";
			var cookies = document.cookie.split(";");
			/* look for the cookie for tcRefresh */
			for (var ix=0; ix < cookies.length; ix++){
				var ck = cookies[ix] ;
				while (ck.substr(0,1)==" ") ck = ck.substr(1);
				if (ck.indexOf(ptrn)==0) {
					ck = unescape(ck.substr(ptrn.length)) ;
					refresh = Inq.CHM.persistentRefresh = (ck.length>0)?ck:null ;
					return (refresh) ;
				}
			}
			return refresh ;
		};


	/**
	 * The load method is used internally by the ChatMgr to load its persistent state. This method
	 * should not typically be called by external objects and should be private to the
	 * ChatMgr.
	 */
	ChatMgr.prototype.load = function(){
		function fixBlockedServicesData() {
			var blocked = {};
			var sessionServices = sessionData["blocked"];
			if(!!sessionServices) {
				for(var service in sessionServices) {
					blocked[service] = sessionServices[service];
				}
			}
			var stateServices = stateData["blocked"];
			if(!!stateServices) {
				for(var service in stateServices) {
					blocked[service] = stateServices[service];
				}
			}
			return blocked;
		}

		this.absorb(this.vitalVar.getValue());
		this.absorb(this.stateVar.getValue());
		this.absorb(this.sessionVar.getValue()); // reconstitute a chat if it exists
		this.chat = Chat.unmarshal().load();
		if(!!this.chat){
			// this saves us a LOT of space on the cookie...
			// we only save the xml "override" objects in the cookie.
			this.rule = this.chat.getRule();
		}
		// fix blocked services
		if (!!this.blocked) {
			var stateData = this.stateVar.getValue();
			var sessionData = this.sessionVar.getValue();
			this.blocked = fixBlockedServicesData();
		}
		if (this.getLastChat() && this.getLastChat().svyPrms) {
			MixIns.mixAbsorber(this.getLastChat().svyPrms);
		}
		return this;
	};

	/**
	 * The save method is used internally by the ChatMgr to save its persistent state. This method
	 * should not typically be called by external objects and should be private to the
	 * ChatMgr.
	 */
	ChatMgr.prototype.save = function(){
		function prepareBlockedServicesData(services) {
			for(var service in services) {
				if(services[service] == 0) {
					if(!sessionData.blocked) {
						sessionData.blocked = {};
					}
					sessionData.blocked[service]=services[service];
				} else if(services[service] == -2){
					// no persistence... page level blocking
				} else {
					if(!stateData.blocked) {
						stateData.blocked={};
					}
					stateData.blocked[service] = services[service];
				}
			}
		}
		var sessionData = {pmor: this.pmor, cb: this.cb};
		if(this.chat != null) {
			this.chat.save();
			/* Lets get the ruleID and ruleName from their getters in the chat router
			Getting them from the rule can be risky in IE because if the client has been closed,
			then the rules object can cause a fault.
			@see http://dev.inq.com/jira/browse/MAINT22-213
			*/
			sessionData.chat =  {
				id: this.getChatID(),
				ruleID: this.rule ? this.rule.getID() : this.chat.getRuleId(),
				aid: this.chat.getAgentID(), // agentID is necessary "dynamic" data. Not part of any spec or theme
				pC: this.chat.isPersistent()
			};
		}
		var vitalData = {
			lpt: this.lpt,
			lastChat: this.lastChat,
			lastCallId: this.lastCallId
		};
		var stateData = {};
		if(!!this.blocked) {
			prepareBlockedServicesData(this.blocked);
		}
		try {this.vitalVar.setValue(vitalData);} catch(e){log("ChatMgr.save sessionData: "+e,e);}
		try {this.stateVar.setValue(stateData);} catch(e){log("ChatMgr.save sessionData: "+e,e);}
		try {this.sessionVar.setValue(sessionData);} catch(e){log("ChatMgr.save sessionData: "+e,e);}
	};

	/**
	 * Determine whether a potential listener should be added to this object's list of
	 * event listeners. To be a ChatMgr listener, a listener should implement at least one of the following
	 * methods:
	 * 		onChatRequested
	 * 		onChatLaunched
	 * 		onChatClosed
	 *      onChatEngagedEvent
	 * 		onPersistentPush
	 * 		onAgentMsg
	 * 		onCustomerMsg
	 */
	ChatMgr.prototype.isListener = function(l){
		if(l && (l.onChatRequested || l.onChatLaunched || l.onChatShown || l.onChatClosed || l.onPersistentPush || l.onAgentMsg || l.onCustomerMsg || l.onAgentAssigned || l.onChatEngagedEvent || l.onChatEvent || l.onBeforeChatClosed))
			return true;
		return false;
	};

	ChatMgr.prototype.cloneChatInterfaceData = function(srcobj){
		if(srcobj == null || typeof(srcobj) != 'object')
			return srcobj;
		var newobj = new srcobj.constructor();
		for(var key in srcobj)
			newobj[key] = this.cloneChatInterfaceData(srcobj[key]);
		return newobj;
	};

	ChatMgr.prototype.getChatInterfaceData = function(){
		return !!this.chat?this.chat.getCiData():{};
	};

	ChatMgr.prototype.setChatInterfaceData = function(data){
		if (!this.chat)
			return;
		this.chat.setCiData(data);
	};
	/**
	 * API: Opens an empty persistent chat to be propagated at chat launch.
	 *   	When a customer clicks .
	 * 		Fires a chat close event on invocation if thank you has not yet been shown.
	 * 		If thankyou has been shown,
	 * 			then the invocation will hide the chat and reset the state of the chat manager for re-chat.
	 * @param cT - contains the chat theme that has the window metrics as follows:
	 * 	cT.px		- offset in the x axis (across) in pixels to put the persistent chat.
	 * 	cT.py		- offset in the y axis (down) in pixels to put the persistent chat..
	 * 	cT.pw		- width in pixels of the persistent chat.
	 * 	cT.ph		- height in pixels of the persistent chat
	 * @return void
	 * @see launch in InqC2CMgr
	 */
	ChatMgr.prototype.earlyPopoutChat = function(cT){
		var winTest = null ;
		var url="", target = ChatMgr.persistentTarget;
		var tools = "toolbar=no,location=no,menubar=no,status=no,scrollbars=no" +
					",top=" + cT.py +
					",left=" + cT.px +
					",width=" + cT.pw +
					",height=" + cT.ph +
					",resizable=1" ;
		try {
			winTest = top.open(url, target, tools);		
		} catch (e1) {
			winTest = null;
		}

		/* On iPad open() opens a new tab and move focus to the new tab
		 * As the result the opener can not execute callback.
		 */
		try	{
			if ( null != winTest && getOSType() === "iOS" && window.focus )	{
				top.focus();
			}
		} catch (e2) { }

		this.earlyPopout = winTest ; // Window of the soon-to-be pop-out chat
	};
	/**
	 *  engagePersistentChat
	 *  ask persistent chat (via the chat router) whether-or-not it is active
	 *  supply the following information to the chat-router (CR)
	 *  chatID, so CR knows which persistent chat to query
	 *  pd,     protocol and domain of the current client instance
	 *  xfr,    URL where the persistent chat should transfer
	 *
	 *  @param xfr - URL where the persistent chat should transfer
	 *
	 *  called from Inq.CHM.
	 */
ChatMgr.prototype.engagePersistentChat = function (xfr) {
	var chatID = this.getChatID();
	var myProtoDomain = window.location.protocol + "//" + window.location.hostname ;
	try {
	this.ask("/chatrouter/chat/isPersistentActive",{"engagementID": chatID, pd: myProtoDomain, xfr: (xfr)?xfr:false, "customerID": Inq.getCustID()}, true) ;
	} catch (e) {
	log("ChatMgr.proto.engagePersistentChat: 524: ERROR"+e,e);
	}
	return ;
};

	/**
	 *  CloseChatFromPersistent
	 *   This is fired from the persistent windows use of a timer and
	 *   "this" may not be pointing to the chat manager instance.
	 *   get the instance and fire the non static "closeChatFromPersistent"
	 *
	 *   @param - chatID
	 */
	ChatMgr.prototype.CloseChatFromPersistent = function() {
		ChatMgr.getInstance().closeChatFromPersistent();
	};

	/**
	 *   __againGetPersistentWindow - private function to get the current persistent window
	 *
	 *
	 *   @param none
	 *   @return persistent window or null
	 *   @see  ChatMgr.prototype.againPopoutChat
	 *	 @author fpinn@TouchCommerce.com
	 *		Notes: *Different Origin is when the pop-out window's protocol or domain do not match the client window (this window)
	 *				this causes a fault to be thrown when one accesses from client to persistent window.
	 */
	ChatMgr.prototype.__againGetPersistentWindow=function (){

		var winTest = null ;
		/* Special tools string to test if window is available
			The top and left are not in the visible area, so this should fail for non-existent target
			The width and height are zero, so this should fail for non-existent targets
		 */
		var tools = "toolbar=no,location=no,menubar=no,status=no,scrollbars=no" +
					",top="+ "-500" +
					",left=" + "-500" +
					",width="+"0" +
					",height="+"0" +
					"";
		/* Open the window with a blank url to get the window object for the persistent chat
		 * This should return the window by the target specification (argument #2)
		 * Then test for valid window.
		 */
		try {
			winTest = win.open("", ChatMgr.persistentTarget, tools);
			if (winTest != null){
				var loc = "err";	/* Default value of err for case of different origins (see note above)*/
				try {loc=winTest.location.href;}catch(e){loc="err";} /* If this window is different origin then use default value */
				/* If the location is "about:blank" then:
				 *   we have a blank document and not the persistent chat
				 *   we must close the blank document
				 */
				if ("about:blank" ==  loc){
					winTest.close() ; winTest = null ;
				}else if (loc!="err"&&loc!=undefined){
					/* We do not do this if there are different origins (see note above)
					 * It will fail, so if loc=="err" or undefined then we know we have different origins
					 */

					/* If we have no document or body, then we close the window, it is not a valid persistent chat
					 * If the document body is empty, we again are not a valid persistent chat
					 */
					if (!!winTest.document && !!winTest.document.body){
						if ("" == winTest.document.body.innerHTML) {
							winTest.close() ;	/* Empty body, not persistent chat */
							winTest = null ;
						}
					}
					else {
						winTest.close() ; winTest = null ; /* No body or document, not valid persistent chat */
					}
				}
				if (winTest == top || winTest == self) /* if winTest is the same as this window(self) then not a valid persistent chat */
					return null ; /* IMPORTANT: do not close in this case, because we may close the client (self) */
			}
		} catch(e){};
		return winTest ;
	};
	/**
	 *   againPopoutChat - popout the chat into an existing popup window
	 *   This is used to:
	 *   1) Move the chat to a new domain
	 *   2) or to reestablish the opener link
	 *
	 *   @param transferURL - new URL to transfer to
	 *   @param differentDomains - boolean, the domains do not match
	 *
	 *   dependent on Inq.v3framesrc - from LandingFramework.jsp
	 *   references: 	  setPersistentRefresh
	 */
ChatMgr.prototype.againPopoutChat=function (transferURL, differentDomains) {
			var persistentFocus = true ;
			var winTest = null ;

			var url, target ;
			var port = (window.parent.document.location.port=="")?"":(":"+window.parent.document.location.port);
			url = (Inq.v3framesrc.indexOf("/")==0)
				? window.parent.document.location.protocol + "//" + window.parent.document.location.hostname + port + Inq.v3framesrc
				: Inq.v3framesrc ;
			var ix = transferURL.indexOf("#");
			var extra = "" ;
			if (ix>=0) {
				url = transferURL.substr(0,ix) ;
				extra = transferURL.substr(ix+1);
				this.setPersistentRefresh(extra) ;
			} else {url = transferURL;}

			target = ChatMgr.persistentTarget;
			var tools = "toolbar=no,location=no,menubar=no,status=no,scrollbars=no" +
					",top="+ "-500" +
					",left=" + "-500" +
					",width="+"0" +
					",height="+"0" +
					"";
			/* Get the current persistent chat window
			 * We know we have the persistent chat window because we would not be here if it didn't exist
			 * If we fail to get the persistent chat window, then do not relocate it because it will result
			 * 	in an additional persistent window to pop up :(
			 * This is due to an error in FireFox 3.6.12
			 */
			winTest = this.__againGetPersistentWindow();
			if (winTest != null) try {
				try { winTest = window.parent.open(url, target, tools); }
				catch (e) {	winTest = Inq.win.open(url, target, tools); }

				if( ! winTest ){
					log("pop up blocker");
				}

				if ("" != url){
					if (winTest == top)
						winTest = null;
				} else {
					throw new Error("ChatMgr.prototype.againPopoutChat: ERROR: popup url is empty");
				}
			} catch (e) {
				log("throw: "+e);
				winTest = null;
			}

			this.persisentWindow = winTest ;
			if (winTest){
				if (winTest.focus)
					try {winTest.focus();}catch(e){}
				return true ;
			}
			else
				return false;
	};

	/**
	 * getPersisgtentChatSetting
	 * get persistent variable value for "pc" (peristent chat)
	 * @default - true if in persistent chat window, false if not in persistent chat window
	 * @return - boolean true if pc is set to true, false if set to not true
	 */
ChatMgr.prototype.getPersistentChatSetting=function() {
	var pc ;
	var pcVar = Inq.PM.getVar("pc");
	if  (pcVar == null) {
		pcVar = (new Variable("pc", (pc=""+(ChatMgr.persistentTarget == window.parent.name)), resources["session"]));	//Inq.SaveMgr.setSessionParam("pc", "true");
		pcVar.init();
		pcVar.getValue();
		Inq.PM.addVar(pcVar);
	}
	try {pc = pcVar.getValue();}
	catch(e){
	log("ChatMgr.getPersistentChatSetting ERROR:"+e,e) ;
	}
	return (pc=="true");
};

	/**
	 * setPersistentChatSetting
	 * set persistent variable value for "pc" (peristent chat)
	 * @param  - boolean or string value for persistent chat active
	 */
ChatMgr.prototype.setPersistentChatSetting=function(pc) {
	pc = ""+pc; /* Stringafy the boolean */
	var pcVar = Inq.PM.getVar("pc");
	if  (pcVar == null) {
		pcVar = (new Variable("pc", pc, resources["session"]));	//Inq.SaveMgr.setSessionParam("pc", "true");
		pcVar.init();
		pcVar.setValue(pc);
		Inq.PM.addVar(pcVar);
		return ;
	}
	pcVar.setValue(pc);
};

	ChatMgr.prototype.setPersistentWindowActive = function(status){
		try {
			if (status==null)
				return;
		if (ChatMgr.persistentTarget == win.name && Inq.isSameOrigin()) {
			if( !!this.chat )
					this.chat.pC = status ;
			this.save();
			var o = (win.opener && win.opener.inqFrame)
					? win.opener.inqFrame
					: ((window.opener) ? window.opener : null) ;
			o.setTimeout('Inq.CHM.setPersistentWindowActive('+status+')', 0);
		}
			else if(!isNullOrUndefined(this.chat) && this.chat.pC != status) {
				this.chat.pC = status ;
		}
		} catch(e){
			logMessageToTagServer("Failure on setPersistentWindowActive: "+catchFormatter(e), LOG_LEVELS.INFO);
		}
	};

	ChatMgr.prototype.isPersistentWindowActive = function(){
		return (null!=this.getPersistentWindow()) ;
	};

	/**
	 *   If the cookie says it is active, beleive it, because the cookie has been corrected at page landing
	 */
	ChatMgr.prototype.isPersistentChatActive = function(){
		return this.isPersistentChatMaybeActive();
	};

	ChatMgr.prototype.isPersistentChatInProgress = function(){
		return this.isPersistentChatActive();
	};

	ChatMgr.prototype.isPersistentChat = function() {
		if (this.chat && this.chat.pC) {
			return true;
		}
		else {
			return false;
		}
	};


	ChatMgr.prototype.getPersistentWindow = function(){
		var winTest = null ;
		var strWidth ;
		var strHeight = 300 ;
		var sLeft = 0 ;
		var sTop  = 0 ;
		strWidth  = 0 ;
		if (ChatMgr.persistentTarget == win.name) return true ;
		var toolsForTest = "toolbar=no,location=no,menubar=no,status=no,scrollbars=no" +
				",top="+ "-500" +
				",left=" + "-500" +
				",width="+"0" +
				",height="+"0" +
				"";
		try {
			if (this.popoutWindow != null &&
				this.popoutWindow != false &&
				this.popoutWindow != true &&
				typeof(this.popoutWindow) == "object") {
				if (this.popoutWindow.closed) {
						this.popoutWindow = null ;
						return null ;
				}
			}
			if (this.chat.popoutWindow == false)
				return null ;

			/* If we have the window of the soon-to-be pop-out chat (earlyPopout) ...
			 * Then we don't have an active popout chat, yet
			 */
			if (this.earlyPopout)
				return null ;

			winTest = win.open("", ChatMgr.persistentTarget, toolsForTest) ;
			if (winTest != null){
				if ("about:blank" ==  winTest.location.href){
					winTest.close() ; winTest = null ;
				}else{
					if (winTest.document && winTest.document.body){
						if ("" == winTest.document.body.innerHTML) {
							winTest.close() ;
							winTest = null ;
						}
					}
					else {
						winTest.close() ; winTest = null ;
					}
				}
				if (winTest == top || winTest == self)
					winTest = null ;
			}
			this.popoutWindow = winTest ;
		}
		catch (e) {
			winTest = null; // there used to be a string called "something" here.
			//winTest should be returning null or else the non popup chat will show in the check for a persistent window.
		}
		return (winTest) ;
	};

	/**
	 * testForPersistentChat - establish whether-or-not persistent chat is active
	 * if not in persistent window (in client window) and the PM says that we are in persistent
	 * then ask the chat-router to determine whether persistent is active.
	 * otherwise see if any other chat is active
	 */
	ChatMgr.prototype.testForPersistentChat = function() {
		if (this.isPersistentWindow()) {
			this.testForContinueChatting();
			var isPersistentInitialization = false;
			if(FP.isInitializationRequired() == true) {
				isPersistentInitialization = true;
				FP.resetInitializationFlag();
			}
			if(isPersistentInitialization) {
				this.chat.transitionMessage(this.PERSISTENT.PERSISTENT_COMPLETE);
			}
		} else if (this.isPersistentChatMaybeActive()) {
			this.engagePersistentChat(false);
		}
	};

	ChatMgr.prototype.testForContinueChatting = function(){
		/* We need to continue, we should do it in persistent window */
		if (this.isV3Continue()) {
			this.continueChatting();
		} else {
			/* If we are here, then we have a click to persistent chat
			 * We must make sure that we have a chat constructed so we can
			 * continue chatting */
			var o = getOpener();
			var c = (o.Inq.CHM.chat == null) ? Inq.CHM.chat : o.Inq.CHM.chat ;
			if (c==null) {
				var fault = new Error("Missing Chat Object");
				fault.name = "Persistent Fault:";
				fault.func = "testForContinueChatting";
				logMessageToTagServer("Failure to Launch: "+catchFormatter(fault), LOG_LEVELS.INFO);
				window.parent.close();
			} else {
			/* NOTICE:
			 * We know that cd of the Chat object is clonable
			 *   but we CANNOT use cd.clone() !!!
			 *   Why? Because the cd is in the client space and therefor the clone is in client space
			 *   This results in a new cd that is in client space, we MUST have it in persistent window space,
			 *     So we will call JSON.clone to perform this in OUR pesistent window space to avoid memory problems.
			 */
				var cd = MixIns.JSON.clone(c.cd); // Use new function, clone instead of the clonized function in cd, this is because if the clonized function is used, the memory is still in client window
				this.chat = Chat.unmarshal(cd).load();
				this.chat.show();
			}
		}
	};

	ChatMgr.prototype.continueChatting = function (optRuleData) {
		if(!isNullOrUndefined(optRuleData)){
			for(var idx=0; idx<optRuleData.rules.length; idx++){
				var rule = optRuleData.rules[idx];
				if( rule.getID() == this.getLastChat().brID ){
					this.getChat().rule = rule;
					break;
				}
			}
			if(isNullOrUndefined(this.getChat().getRule())){
				logErrorToTagServer("Rule for BU not found. Chat lost.");
				throw "Rule for BU not found. Chat lost.";
			}
		}
		this.chat.chatMgr = this;
		this.chat.show();
	};
	ChatMgr.prototype.sendExitChat = function(chatID){
		try {
			var	crHost = this.getChatRouterURL();
			var exitChat = crHost + "/chatrouter/chat/exitChat" ;
            //Inq.SvrCom.sendToServer(exitChat, {"chat.id": chatID});
            //TODO: move this parameter later to common constant for CI/IJSF modules
            ROM.send( exitChat, {"engagementID": chatID, "customerID": Inq.getCustID()});
		} catch (e){}
	};

	/**
	 * Pass data to the chat Agent as a name/value pair, to appear in the Agent Interface.
	 * This data will NOT appear in the transcript visible to the customer.
	 *
	 * @param name Should be free of spaces for best formatting in AI.
	 * @param value The value to display to the chat Agent.
	 */
	ChatMgr.prototype.passNamedDataToAgent = function(name, value) {
		var data = MixIns.unmixMutatable(MixIns.mixMutatable(MixIns.mixAbsorber(MixIns.mixMutatable()).absorb(safe('inqData'))).set("agentID",this.getAgentID()).set("engagementID",this.getChatID()).set(name, value));
		ROM.sendDataToAgent(this.getAgentID(), data);
	};

	/**
	 * API: Closes the persistent chat in progress on behalf of the persistent chat.
	 *   	Throws an error if a chat is not in progress.
	 * 		Fires a chat close event on invocation if thank you has not yet been shown.
	 * 		If thankyou has been shown,
	 * 			then the invocation will hide the chat and reset the state of the chat manager for re-chat.
	 * @return void
	 * @throws Error if chat is not in progress.
	 * @see this.closeChat below
	 */
	ChatMgr.prototype.closeChatFromPersistent = function() {
		try {
			// Mobile devices are problematic here.  For some reason
			// inqFrame never gets properly "closed."  So for those
			// devices we're going to put a limit on how long we're
			// willing to wait before moving on.
			if (!this.isMobile() || this._closeRetries++ < 20) { // 20tries * 50ms-timeout = 1000 == 1 second
				//Sometimes STT team get exception only in IE while accessing "pw.closed" after closing Persistent window.
				//Error is: "An outgoing call cannot be made since the application is dispatching an input-synchronous call"
				var pw = inqFrame["persistentChatWindow"]; // Set in ChatMgr.closePersistent()
				if (pw!=null && !pw.closed){
					this.retryTimeout = window.setTimeout('inqFrame.Inq.FlashPeer.CloseChatFromPersistent()', 50);
					return;
				}
				else {
					this.retryTimeout = null;
				}
			}
			else {
				this._closeRetries = 0;
			}
		}
		catch(e) {
			log("Error in ChatMgr.closeChatFromPersistent: " + e);
		}

		if (this.chat) {
			this.chat.persistentChat = false;
		}

        if (CM.persistentWindow) {
            CM.persistentWindow = null;
        }
        if(window.parent.Inq.datapass){
            window.parent.Inq.datapass = null;
        }
		this.setPersistentChatSetting(false);
		try { this._postSurveyListener(); }
		catch(e){}

		this.setChatInterfaceData({});	// clear the v3 data in main window

		/* try closing the chat */
        this.sendExitChat(this.getChatID());
		this.fireChatClosed();
		if (this.chat) {
			this.chat.close();
		}
		this.setPersistentWindowActive(false);
		delete this.chat;
		this.save();
	};

	ChatMgr.prototype.getSurveyData = function(){
		return this.getChatData()!=null?this.getChatData().survey:null;
	};

	ChatMgr.prototype.setSurveyData = function(sdat){
		this.getChatData().survey=sdat;
	};

	/**
	 * Set parameters (auxiliary to survey spec) that will be passed to survey manager on survey launch.
	 * This method does not erase previously set parameters rather adds them.
	 * Parameters are stored in lastChat object in Chat manager and persisted to inqVital thus available
	 * even after chat is closed.
	 * Note: Chat manager recreates lastChat object when new chat starts.
	 * @param params object with parameters for survey.
	 */
	ChatMgr.prototype.setSurveyAuxParams = function(params){
		if (this.getLastChat()) {
			var svyPrms = this.getLastChat().svyPrms;
			if (!svyPrms) {
				svyPrms = this.getLastChat().svyPrms = MixIns.mixAbsorber({});
			}
			svyPrms.absorb(params);
			this.save();
		} else {
			log("Warning: setting survey params failed - last chat data object doesn't exist.");
		}
	};

	/**
	 * Returns survey parameters (auxiliary to survey spec).
	 */
	ChatMgr.prototype.getSurveyAuxParams = function(){
		if (this.getLastChat()) {
			return this.getLastChat().svyPrms;
		} else {
			return null;
		}
	};

	/**
	 * Sets clickstream sent flag.
	 * Flag is stored in lastChat object in Chat manager and persisted to inqVital thus available
	 * even after chat is closed.
	 */
	ChatMgr.prototype.setClickStreamSent = function(isSent){
		if (this.getLastChat()) {
			this.getLastChat().clkstr = isSent;
			this.save();
		} else {
			log("Warning: setting ClickStreamSent flag failed - last chat data object doesn't exist.");
		}
	};

	/**
	 * Returns clickstream sent flag.
	 */
	ChatMgr.prototype.isClickStreamSent = function (){
		if (this.getLastChat()) {
			return this.getLastChat().clkstr;
		} else {
			return null;
		}
	};

	ChatMgr.prototype._postSurveyListener = function(){
		var sdat = this.getSurveyData();
		if(sdat){
			if(this.surveyRegistered) return;
			this.surveyRegistered=true;
			/* ToDo We have to wait for incrementality Mangager and SurveyMgr to be implemented
			Inq.EVM.addListener({

				onChatClosed: function(evt){
					if(Inq.IM.isAssisted()){
						Inq.SurveyMgr.launchSurvey(sdat);
					}
				}
			});
			*/
		}
	};

	ChatMgr.prototype.closePersistent = function(){
		var chatID = this.getChatID() ;
		if (!Inq.isSameOrigin()) {
			this.sendExitChat(chatID);
			this._postSurveyListener();
		}
		else {
			try{
				var o = getOpener();
				o.inqFrame["persistentChatWindow"]=window.parent;
				inqFrame.Inq.MSG.closePersistent(o);
			}
			catch(err){
				this.sendExitChat(chatID);
			}
		}
	};


	/**
	 * API: Quiesses the popup chat on behalf of the persistent chat
	 */
	ChatMgr.prototype.inactivateChat = function(){
		if (this.chat==null) return ;
		this.chat.setVisible(false);
		FP.closeChatInterface();
	};

	/**
	 * API: Closes the current chat in progress. Throws an error if a chat is not in progress.
	 * Fires a chat close event on invocation if thank you has not yet been shown. If thankyou
	 * has been shown, then the invocation will hide the chat and reset the state of the chat manager
	 * for re-chat.
	 */
	ChatMgr.prototype.closeChat = function(){
		/** TRICK CODE ALERT
		 * When we are closing as a persistent chat, we do NOT have much time.
		 * The window is rapidly being destroyed.
		 * For this reason we must attach a timer event to the opener window
		 *    and have it perform the close on behalf of this window.
		 */
		if(this.isPersistentWindow()){
			this.closePersistent() ;
		}
		else
		{
			if(!this.chat) {
				return;
			}
			this._postSurveyListener();
			if (!this.persistentChat){
				this.fireChatClosed();
			}
			this.chat.close();
			this.chat=null;
			this.save();
		}
        if(window.parent.Inq.datapass){
            window.parent.Inq.datapass = null;
        }
	};

	/**
	 *  This function is called when customer closed the chat on ios.
	 */
	ChatMgr.prototype.closeChatMonitor = function() {
		this.chat.closeChatMonitor();
	};

	/**
	 * PRIVATE: Assertion to assure that a chat is in or not in progress. Used to protect against
	 * invocation of chat methods against inconsistent chat states.
	 * @param _inProgress true to ensure that a chat is in progress (throws if isn't), false to
	 *   ensure chat is not in progress (throws if chat is in progress)
	 * @return void
	 * @throws Error Depending on param.
	 */
	ChatMgr.prototype._assertChatInProgress = function(_inProgress){
		if(this.chat==null){
			if(_inProgress)
				throw Error("Chat "+(_inProgress?"not ":"")+"in progress");
		}
		else if(this.chat.isVisible()||this.isPersistentChatInProgress()){
			if(!_inProgress)
				throw Error("Chat "+(_inProgress?"not ":"")+"in progress");
		}
	};
	ChatMgr.prototype.setOpacity = function(opac){
		if(this.chat) this.chat.setOpacity(opac);
	};
	ChatMgr.prototype.showPersistentButton = function(x,y,w,h){
		this.chat.pb.setPosition(x,y,w,h);
		this.chat.pb.setVisible(true);
	};
	ChatMgr.prototype.showTextInput = function(bShow,y,x,w,h){
		var o, offsetY ;
		offsetY = this.chat.chatSpec.chatTheme.tbh;
		o = win.document.getElementById("inqInput4Chat") ;
		if (o) {
			o.style.display = (bShow) ? "" : "none" ;
			o.style.top     = (y+offsetY) + "px";
			o.style.left    = x + "px";
			o.style.width   = w + "px";
			o.style.height  = h + "px";
		}
	};
	ChatMgr.prototype.hidePersistentButton = function(){
		this.chat.pb.setVisible(false);
	};
	ChatMgr.prototype.setPersistentButtonDebugActive = function(active){
		this.chat.pb.setDebugActive(active);
	};

	/*
	 * PRIVATE: Resets the internal state of the chat and clears chat detritus from DOM.
	 * @return void
	 * @throws Error if chat is not in progress.
	 * @see InqChatMgr.closeChat
	 */
	ChatMgr.prototype._resetChat = function(){
		this._assertChatInProgress(true);
		win.document.body.removeChild(this.chat.container);
		this.chat.close();
		this.chat = null;
		this.thankYouShown = !this.displayTYImage;
		this.setChatInterfaceData({});
		this.save();
	};

	/**
	 * API: Sets the currently initialized chat visible/hidden.
	 * @param {boolean} _vis true to set the chat visible in the DOM, false to hide. Uses style.display.
	 * @throws Error if chat is not initialized.
	 */
	ChatMgr.prototype.setChatVisible = function(_vis){
		this.chat.setVisible(_vis);
	};

	/**
	 * Launches an initialized chat and fires a launch event for subscribed listeners.
	 * @param chat The source Chat instance. A Chat instance contains rule,chatSpec, and
	 * 	flashvar data.
	 * @param _evtData Object containing custom data to include in the inq launch event.
	 * @return void
	 * @throws Error if chat is already in progress.
	 *
	 **/
	ChatMgr.prototype.launchChat = function(chat){
		try {
			var refresh = this.getPersistentRefresh();
			this._assertChatInProgress(false);
			if (this.chat != chat) {
				this.chat = chat;
			}
			if (!(this.getChatType() == this.CHAT_TYPES.MONITOR)) {
				this._postSurveyListener();
				this.chat.show();
			}
			this.fireChatLaunched(this.chat.getChatData());

				// chat launch must result in conversionFunnel.exposed event only for proactive chat
				if(this.getChatType() == ChatMgr.CHM.CHAT_TYPES.POPUP || this.getChatType() == ChatMgr.CHM.CHAT_TYPES.POPUP_CALL) {
					BRM.fireServiceInvitationEvent(this.chat.getRule(), this.getChatType());
			}
		}catch (e){
			logMessageToTagServer("Failure to Launch: "+catchFormatter(e), LOG_LEVELS.INFO);
		}
	};

	ChatMgr.prototype.getAgentID = function(){
		return (this.chat) ? this.chat.getAgentID() : null;
	};
	ChatMgr.prototype.getAgentName = function() {
		return (this.chat) ? this.chat.getAgentName() : null;
	};

	/**
	 * Returns the first value of the specific agent attribute if it there's
	 * and empty string if there is no specific attribute or there is no chat.
	 * For example:
	 *   If string of attributes is "attr=foo,attr=bar",
	 *   then only "foo" will be returned.
	 * @param {string} attrName - name of the agent attribute
	 * @returns {string} - value of the agent attribute
	 */
	ChatMgr.prototype.getAgentAttributeValue = function(attrName) {
		return this.chat ? this.chat.getAgentAttributeValue(attrName) : "";
	};

	/**
	 * Adds each of the first values of agent attributes from specific list.
	 * The list with names of agent attribute is specified through the Business Rules engine
	 * as the "eventAgentAttributeList" variable.
	 * @param {object} evt
	 */
	ChatMgr.prototype.addAgentAttributesToEvent = function(evt) {
		/** @type {Variable} */
		var attrList = PM.getVar("eventAgentAttributeList");
		if (attrList) {
			/** @type {Array} */
			var list = attrList.getValue().split(",");
			for (var i = 0, name; i < list.length; i++) {
				name = list[i].trim();
				if (name != "") {
					evt[name] = this.getAgentAttributeValue(name);
				}
			}
		}
	};

	ChatMgr.prototype.getCustomerName = function() {
		return (this.chat) ? this.chat.getCustomerName() : null;
	};

	ChatMgr.prototype.isPersistentWindow = function(){
		return isPersistentWindow();
	};

	ChatMgr.prototype.getChat = function() {
		return this.chat ? this.chat : null;
	};

    ChatMgr.prototype.getBusinessUnitID = function(evt, rule) {
		return this.chat && this.chat.getChatData() && this.chat.getChatData().buID && (parseInt(this.chat.getChatData().buID) > 0) ? this.chat.getChatData().buID : (this.chat && this.chat.getBusinessUnitID() ? this.chat.getBusinessUnitID() : (evt.rule && evt.rule.getBusinessUnitID ? evt.rule.getBusinessUnitID() : (this.lastChat && this.lastChat.businessUnitID ? this.lastChat.businessUnitID : rule.getBusinessUnitID())));
    };

	ChatMgr.prototype.getLastChat = function() {
		return this.lastChat ? this.lastChat: null;
	};

	/**
	 * Provide the current email spec id of an active chat
	 * @return a non-negative id if a chat is in progress, otherwise 0
	 */
	ChatMgr.prototype.getEmailSpecId = function() {
		var emailSpecId = 0;
		var chat = this.getChat();
		if (!!chat) {
			emailSpecId = chat.chatSpec.emSpId;
		}
		return emailSpecId;
	};

	ChatMgr.prototype.getChatID = function(){
		var id = "0";
		if(!!this.chat) {
			try {
				id = this.chat.getChatID();
			} catch(e) {}
		}
		return id;
	};

	ChatMgr.prototype.getLastChatID = function() {
		var id = "0";
		if (!!this.lastChat && !!this.lastChat.id) {
			id = this.lastChat.id;
		}
		return id;
	};

	/**
	 * MAINT24-207: Chat manager remembers id of last call to check agent availability for the next call and
	 * suppress call invitation if agent hasn't closed previous call window in AI.
	 * @return id of last call; if there was no call, 0 will be returned.
	 */
	ChatMgr.prototype.getLastCallID = function() {
		return this.lastCallId;
	};

	ChatMgr.prototype.getChatType = function(){
		return this.chat ? this.chat.getChatType() : null;
	};

	ChatMgr.prototype.getLastChatType = function(){
		return this.lastChat ? this.lastChat.chatType : null;
	};

	/**
	 * Block a specific service/chat type for a period of time
	 * @param serviceType only valid type at this time is "POPUP" and "POPUP_CALL"
	 * @param period duration of blocked service in milliseconds
	 */
	ChatMgr.prototype.blockService = function(serviceType, period) {
		if(serviceType != ChatMgr.CHM.CHAT_TYPES.POPUP &&
				serviceType != ChatMgr.CHM.CHAT_TYPES.POPUP_CALL) {return;}
		if (isNullOrUndefined(this.blocked)) {
			this.blocked = {};
		}
		// block the service if it hasn't already been blocked or block duration has been expired
		if (isNullOrUndefined(this.blocked[serviceType]) || (!isNullOrUndefined(this.blocked[serviceType]) && this.blocked[serviceType] < (new Date).getTime())) {
			if (period > 0)  {
				var now = new Date();
				period += now.getTime();
			}
			this.blocked[serviceType] = period;
			this.save();
		}
	};

	ChatMgr.prototype.unblockService = function(serviceType) {
		if(serviceType != ChatMgr.CHM.CHAT_TYPES.POPUP &&
				serviceType != ChatMgr.CHM.CHAT_TYPES.POPUP_CALL) { return;}
		if (!isNullOrUndefined(this.blocked) && !isNullOrUndefined(this.blocked[serviceType])) {
			delete this.blocked[serviceType];
		}
		this.save();
	};

	ChatMgr.prototype.setCobrowseFlag = function(flag) {
		var val = (flag)?1:0;
		if (this.cb != val) {
			this.cb = val;
			this.save();
		}
	};
	
	ChatMgr.prototype.getCobrowseFlag = function(){
		return (!!this.cb)?true:false;
	};

	ChatMgr.prototype.isBlocked = function(serviceType) {
		var blockedValue = false;
		if (!isNullOrUndefined(this.blocked) && !isNullOrUndefined(this.blocked[serviceType])) {
			var now = new Date();
			var toDate = this.blocked[serviceType];
			if (toDate <= 0) { // 0 - session, -1 forever
				blockedValue = true;
			}
			else {
				blockedValue = toDate >= now.getTime();
			}
		}
		return blockedValue;
	};

	ChatMgr.prototype.isAnyBlocked = function() {
		if (isNullOrUndefined(this.blocked)) {
			return false;
		}
		for (var prop in this.blocked) {
			return true;
		}
		return false;
	};

	/*
	 * API: Provides the date/time of the latest proactive chat launched.
	 * @return Date object representing last proactive launch datetime. Null if now proactive ever launched.
	 * @throws Error if chat is not initialized.
	 */
	ChatMgr.prototype.isProactiveExpired = function(){
		if(!this.lpt) return false;
		var expireTime = new Date(this.lpt).getTime()+Inq.rechatInterval * 24 * 60 * 60 * 1000;
		var now = new Date().getTime();
		return now > expireTime;
	};

    ChatMgr.prototype.isMobile = function() {
        var deviceType = getDeviceType();
        return (deviceType === 'Phone' || deviceType === 'Tablet');
    }

	ChatMgr.prototype.popOutChat = function(transition){
		if( !this.isPersistentChatActive())
			this._firePersistentPushEvt({});
		/**
		 * For cross domain mode (CM.xd==true) we want to make sure
		 *   that cookies are set before we pop out the chat.
		 * To do this we must:
		 *  1) Pop out an empty chat window (no persistent chat, just empty) we must do this because of pop-out blockers
		 *  2) We must send out the transition message
		 *  3) We must, upon commiting the cookies
		 *     a) set the popout window to the early popout window
		 *     b) transfer the href of the early popout window to the frame source making the early popout a persistent window.
		 *     c) set persistent chat flag to true
		 *     d) set early popout to null, because it is the pop out window now.
		 *
		 */
		if (CM.xd) {
			if (transition) {
				this.chat.transitionMessage(this.PERSISTENT.PERSISTENT);
			}
			CM.dump();					/* dump the cookie contents */
			if (null==this.earlyPopout || this.earlyPopout.closed) {
				this.earlyPopoutChat(this.chat.chatSpec.chatTheme);
			}
			CM.setWhen3rdPartyCookieCommittedHandler(function(){
					(inqFrame.Inq.CHM).relocateToHostedPage(5);	/* relocate to hosted page with a retry of 5 times */
			});
			return true;
		} else {
			if (this.isMobile()) {
				inqFrame.Inq.FlashPeer.closePopupChat();
			}
			return this.chat.popOutChat(transition);
		}
	};
	/** relocateToHostedPage - relocates the empty early-popout window to the hosted file to become a persistent chat
	 * if this failes, it will retry until the retry count is zero
	 * @param retryCnt - the number of retries allowed
	 * @return nothing
	 * @see ChatMgr.prototype.popOutChat
	 */
	ChatMgr.prototype.relocateToHostedPage = function(retryCnt){
		try {
			this.popoutWindow = this.earlyPopout;				/* set the popout window to the early popout window */
			this.popoutWindow.location.href = Inq.v3framesrc;	/* make the early popout window a popout window by setting its location to the hosted file */
			this.chat.persistentChat = true ;					/* set persistent to true */
			window.Inq.isPersistentInitialization = true;
			if ( getOSType() === "iOS" && this.popoutWindow.focus )	{
				try	{
					this.popoutWindow.focus();
				} catch ( errFocus ) { }
			} 
			this.earlyPopout = null;							/* earlyPopout, your work is done here, thank-you for your service */
		} catch (err) {
			/* Add extra information to the Error object (err) to give more detailed information */
			err["this"] = this ;														/* Display "this" */
			err["popoutWindow"] = (this.popoutWindow)?this.popoutWindow:"undefined";	/* Display the popoutWindow object */
			err["earlyPopout"] = (this.earlyPopout)?this.earlyPopout:"undefined";		/* Display the earlyPopout window object */
			err["popoutWindow_location"] = (this.popoutWindow.location)?this.popoutWindow.location:"undefined"; /* Display the window location */
			if (retryCnt==0) 																/* If count is zero, then all retries are exhausted */
				err["PersistentFailure"] = "Persistent Popout failed, all retries exhausted"; /* Add that info to error object as well */
			/* Post the error information with trace to the tag server */
			logMessageToTagServer("Failure to relocateToHostedPage("+retryCnt+"): "+catchFormatter(err), LOG_LEVELS.INFO);

			if (retryCnt > 0) {
				inqFrame.Inq.FlashPeer["__relocateToHostedPage"] = function(retryCnt){(inqFrame.Inq.CHM).relocateToHostedPage(retryCnt);};
				inqFrame.setTimeout('inqFrame.Inq.FlashPeer.__relocateToHostedPage('+(--retryCnt)+');',50);
			}
			else { /* We have exhausted all retries, so we must close the popout window */
				/* Depending where the failure was, the popout window may be (earlyPopout) or (popoutWindow), try closing both */
				var wins=[this.earlyPopout, this.popoutWindow]; /* possible pointers to the popout window */
				while (wins.length) {
					w = wins.shift()							/* get window */
					if (w) {									/* if window is not null, then close it */
						try {
							if (!w.closed)						/* if not closed then close it */
								w.close();						/* close */
						} catch(e){}
					}
				}
				this.earlyPopout = this.popoutWindow = null;	/* clean up the pointers */
			}
		}
	};

	ChatMgr.prototype.reset = function(){
	};
	ChatMgr.prototype.sendMsg = function(_msgData,_src){
		ROM.send(Inq.urls.sendToAgentURL, {chatID:_msgData.chatID,msg:escape(_msgData.msg)});
	};

	/**
	 * API: Asks the flash movie to close the connection and request a soft kill.
	 *      This results with the agent interface being notified of the close and
	 *      the thank-you page being shown.
	 * @see closeChat
	 * @deprecated
	 */
	ChatMgr.prototype.closeConnection = function(){
	};
	ChatMgr.prototype.toString = function(){
		return "ChatMgr: "+MixIns.JSON.stringify(this);
	};
	ChatMgr.prototype._addListener = function(_l,_lArr){
		if(!_l.id)
			_l.id = Math.random();
		_lArr.push(_l);
	};
	ChatMgr.prototype.hasAlreadyChatted = function(chatData){
		if(!this.lastChat) return false;
		var lastChatTimeMS = new Date(this.lastChat.time).getTime();

		var nowMS = (new Date()).getTime();
		var reChatTimeMS = lastChatTimeMS + Inq.rechatInterval*(24*60*60*1000);
		return (reChatTimeMS>=nowMS);
	};
	ChatMgr.prototype.clearAllChatListeners = function(){ this._listeners=[]; };

	/**
     * Sets agent data to chat
	 * @param aid agent ID string
     * @param noSave boolean flag to show if chat data should be saved
     * @param cobrowseEnabled boolean flag to show if CoBrowse is enabled
     * @param eventData JSON string includes agents' first name, last name and site attributes
     * @param buID business unit for chat
     * @param agID agent group id of chat owner
     * @return void
	 */
	ChatMgr.prototype.assignAgent = function(aid, noSave, cobrowseEnabled, eventData, buID, agID){
		log("Agent Assigned: ChatMgr.assignAgent("+aid+")");
		try{
            var agentAttrs;
			if (typeof(eventData) == "object") {
				agentAttrs = eventData["agtAttrs"];
			}
			this.chat.setAgentConfig(aid, buID, agID, agentAttrs);
			if(!noSave){
				this.save();
			}

			/* We fire AgentAssigned in both windows but behaviour in opener and persistent windows is different
			 * See rules 621 and 624 in ProgramRules, for c2call and c2c to persistent chat we handle onAgentAssigned
			 * event to fire "assisted" event in rule 624. And in opener window these chat types are excluded for
			 * "assisted" firing  in rule 621.
			 */
			this.fireAgentAssigned(aid, cobrowseEnabled, eventData, buID, agID);
			if(this.isPersistentWindow() && Inq.isSameOrigin()) {
				if (typeof(eventData) == "object") {
					eventData = MixIns.JSON.stringify(eventData);
				}
                var delayedCommand = 'inqFrame.Inq.CHM.assignAgent("' + aid + '", true,' + cobrowseEnabled + ','
                    + eventData + ',' + buID + ',' + agID + ')';
				win.opener.inqFrame.setTimeout(delayedCommand, 50);
			}
		}catch(er){
			log("FAILED ATTEMPT TO SET AGENT ID FROM FLASH: "+er);
		}
	};

    /**
     * Returns agent group name by ID.
     * @param agID the agent group id.
     * @returns the agent group name if successful or undefined otherwise.
     */
    ChatMgr.prototype.getAgentGroupNameByID = function(agID) {
        // Returns undefined instead of empty string if agID is not available.
        var agName = undefined;
        if (!isNullOrUndefined(agID) && site.siteAgentGroups.hasOwnProperty(agID)) {
            agName = site.siteAgentGroups[agID];
        }
        return agName;
    }

	ChatMgr.prototype.isV3Continue = function(){
		var ciData = this.getChatInterfaceData();
        return ciData ? ciData.c == 1 : false;
	};

	/** isV3Active - returns whether-or-not V3 chat is active on another page
	  *		so, if we go from page to page, we want it to be "inactive" when the page closes
	  *		we only want to know if there is a "visible" chat somewhere else,
	  *		NOT if we have an active chat session.
	  * 
	  * @return {boolean} true if active, false if not
	  * @see  this.testForContinueChatting
	  */
	ChatMgr.prototype.isV3Active = function(){
		if (CM.xd){
			try {
				var activeFlag = CM.cookies["inqCA"];		/* Get the active flag (called "inqCA") */
				var activeCount;
				if (activeFlag==null)						/* if it does not exist, then return false */
					return false ;							/* It does NOT exist */
				if (isNaN(activeCount = parseInt(activeFlag))){	/* Get the numeric value of the flag */
					return false;
				}
			
				if (activeCount <= 0) return false;			/* If the value is less than 1, return false */
					return true;							/* If the count is greater than 1, return true */
			} catch (e) {
				log("Error detecting isV3Active:" + e);				
				return false ;
			}
		} else {
			var ciData = this.getChatInterfaceData();
			if(!!ciData) {
				return (ciData.a==true);
			}
			return false;
		}
	};

	ChatMgr.prototype.isChatInProgress = function() {
        if (this.isV3Active())
            return true;
		if (this.isPersistentChat()) {
			if (this.isPersistentChatInProgress()) {
				return true;
			}
			else {
				this.resetStateAfterPersistentChat();
				return false;
			}
		}
		else {
			return this.isV3Continue() || this.isInlineChatInProgress();
		}
	};
	ChatMgr.prototype.isInlineChatInProgress = function(){
		return (!!this.chat && this.chat.isVisible());
	};

	ChatMgr.prototype.isThankYouEnabled = function(){
		return this.thankYouEnabled;
	};

	ChatMgr.prototype.getChatData = function(){
		return this.getChat();
	};

	ChatMgr.prototype.onChatLaunched = function(evt){
		//If only Session Cookies are allowed for IE browser, writing the information to the TagServer Logs.
		// Both in XD and Non-XD mode.
		if (!CM.isPersistentCookiesAllowed() && isIE()) {
			var sesOnlyCookieMsg = "Only Session Cookies are allowed for this chatID. "+this.getChatID();
			if (!JSLoggingDisabled) {
				log(""+sesOnlyCookieMsg);
				logMessageToTagServer(sesOnlyCookieMsg, LOG_LEVELS.INFO);
			}
		}
	};

	ChatMgr.prototype._fireChatEvt = function(evt){
		this._fireEvt(
			function(l,evt){if(l.onChatEvent) l.onChatEvent(evt);},
			evt
		);
	};

	ChatMgr.prototype.fireAgentMsgEvent = function() {
		if (isNullOrUndefined(this.chat)) { return; }
		this.chat.bumpAgtMsgCount();
		var event = {
			customerID: Inq.getCustID(),
			chatID: this.getChatID(),
			custMsgCnt:this.chat.getCustMsgCnt(),
			agtMsgCnt:this.chat.getAgentMsgCnt()
		};
		this._fireEvt(
				function(l, event){
					try {
						if(typeof l.onAgentMsg=="function") l.onAgentMsg(event);
						if(typeof l.onChatEvent=="function") l.onChatEvent(event);
					} catch(e) {
						log("Error firing event onAgentMsg on " + l.toString() + ": \n" + e);
					}
				},
				event
			);
		if(!this.isPersistentWindow() || !isIE()) // This is to fix IE8 quirk in XD Mode
			this.chat.save();
	};

	ChatMgr.prototype.fireCustomerMsgEvent = function(evt) {
		if (isNullOrUndefined(this.chat)) { return; }
		this.chat.bumpCustMsgCount();
		var event = MixIns.mixAbsorber({
			customerID: Inq.getCustID(),
			chatID: this.getChatID(),
			custMsgCnt:this.chat.getCustMsgCnt(),
			agtMsgCnt:this.chat.getAgentMsgCnt(),
			textLine: evt.textLine.substring(0, 50)
		});
		this._fireEvt(
				function(l, event){
					try {
						if(typeof l.onCustomerMsg=="function") l.onCustomerMsg(event);
						if(typeof l.onChatEvent=="function") l.onChatEvent(event);
					} catch(e) {
						log("Error firing event onCustomerMsg on " + l.toString() + ": \n" + e);
					}
				},
				event
			);
		if(!this.isPersistentWindow() || !isIE()) // This is to fix IE8 quirk in XD Mode
			this.chat.save();
	};

	/**
	 * ChatMgr fires this event when a chat has been requested. Chat requests
	 * typically originate from business rule actions.
	 * @param evtData contains the following data:
	 * 		siteID,
			pageID,
			chatSpec,
			chatType,
			rule
	 */
	ChatMgr.prototype.fireChatRequested = function(src, evtData) {
		var evt = MixIns.mixAbsorber({});
		evt.absorb(evtData);
		evt.id = this.evtIdx++;
		evt.evtType = this.EVTS.REQUESTED;
		evt.timestamp = new Date();
		evt.src = src;
		this._fireEvt(
			function(l, evt) {
				if (typeof l.onChatRequested == "function") l.onChatRequested(evt);
			},
			evt
		);
	};

	/**
	 * Invoked when chat is launched...
	 *
	 */
	ChatMgr.prototype.fireChatLaunched = function(chatData){
		if (chatData==null) chatData = this.chat.getChatData() ;
		var evt = MixIns.mixAbsorber({id:this.evtIdx++, evtType:this.EVTS.LAUNCHED, src:this, chatID:chatData.id});
		evt.absorb(chatData).absorb({"customerID": Inq.getCustID(), rule:this.rule});
        if (this.chat) evt.inHOP = this.chat.inHOP;

		var custEvt = MixIns.mixAbsorber({customerID: Inq.getCustID(), chatID: chatData.id, evtType:this.EVTS.LAUNCHED, chatType: this.getChatType(), bizRuleName: this.rule.getName()});

		var buID = null;
		var agID = null;
		if (evt["buID"]) {
			buID = evt["buID"];
			delete evt["buID"];
		}
		if (evt["agID"]) {
			agID = evt["agID"];
			delete evt["agID"];
		}
		if (! (buID && agID) || parseInt(buID) <= 0 || parseInt(agID) <= 0) {
			var rule = BRM.getRuleById(chatData.ruleID) ? BRM.getRuleById(chatData.ruleID) : this.rule;
			if (rule) {
				buID = buID && parseInt(buID) > 0 ? buID : rule.getBusinessUnitID();
				agID = agID && parseInt(agID) > 0 ? agID : rule.getAgentGroupID();
			}
		}

		if (agID && parseInt(agID) > 0) {
			custEvt.absorb({agentGroupID: agID});
			evt.absorb({agentGroupID: agID});
		}
		if (buID && parseInt(buID) > 0) {
			custEvt.absorb({businessUnitID: buID});
			evt.absorb({businessUnitID: buID});
		}

		this._fireEvt(
			function(l, evt){
				var event = isNullOrUndefined(l.custApi) ? evt : custEvt;
				try {
					if(typeof l.onChatLaunched=="function") l.onChatLaunched(event);
					if(typeof l.onChatEvent=="function") l.onChatEvent(event);
				} catch(e) {
					log("Error firing event onChatLaunched on " + l.toString() + ": \n" + e);
				}
			},
			evt
		);

		if (window.parent.name==ChatMgr.persistentTarget) {
			var o = getOpener();
			if (o || Inq.isSameOrigin()) {
				o.setTimeout('Inq.CHM.fireChatLaunched(null)',0);
			}
		}
	};
	/**
	 * Invoked when chat is shown (after skin loaded)
	 */
	ChatMgr.prototype.fireChatShown = function(chatData){
		if (chatData==null) chatData = this.chat.getChatData() ;
		var evt = MixIns.mixAbsorber({id:this.evtIdx++, evtType:this.EVTS.SHOWN, src:this, chatID:chatData.id});
		evt.absorb(chatData).absorb({"customerID": Inq.getCustID(), rule:this.rule});
		if (this.chat) evt.inHOP = this.chat.inHOP;
		this._fireEvt(
			function(l, evt){
				try {
					if(typeof l.onChatShown=="function") l.onChatShown(evt);
					if(typeof l.onChatEvent=="function") l.onChatEvent(evt);
				} catch(e) {
					log("Error firing event onChatShown on " + l.toString() + ": \n" + e);
				}
			},
			evt
		);
	};

    ChatMgr.prototype.fireBeforeChatClosed = function(){
        try{
            var chatData = this.chat.getChatData();
            var evt = MixIns.mixAbsorber({id:this.evtIdx++, chatID: chatData.id, evtType:this.EVTS.BEFORE_CLOSED, timestamp:new Date(), rule:this.rule, src: this});
            evt.absorb(chatData).absorb({"customerID": Inq.getCustID(), "agentID":this.getAgentID()});

            this._fireEvt(                        /* NOTICE: This cauased a fault due to id not being defined */
                function(l, evt){
                    try {
                        if(typeof l.onBeforeChatClosed=="function") l.onBeforeChatClosed(evt);
                        if(typeof l.onChatEvent=="function") l.onChatEvent(evt);
                    } catch(e) {
                        log("Error firing event onBeforeChatClosed on " + l.toString() + ": \n" + e);
                    }
                },
                evt);
        } catch(e){
            logMessageToTagServer("Failure to fireBeforeChatClosed: "+catchFormatter(e), LOG_LEVELS.INFO);
        }
    };

	ChatMgr.prototype.fireChatClosed = function(chatData){
	    try {
		    if (chatData==null) chatData = this.chat.getChatData();
		    this.hasEngaged=false;
		    var evt = MixIns.mixAbsorber({id:this.evtIdx++, chatID: chatData.id, evtType:this.EVTS.CLOSED, timestamp:new Date(), rule:this.rule, src: this});
		    evt.absorb(chatData).absorb({"customerID": Inq.getCustID(), "agentID":this.getAgentID()});

			var custEvt = MixIns.mixAbsorber({customerID: Inq.getCustID(), chatID: chatData.id, evtType:this.EVTS.LAUNCHED, chatType: this.getChatType(), bizRuleName: this.rule.getName()});

			var buID = null;
			var agID = null;
			if (evt["buID"]) {
				buID = evt["buID"];
				delete evt["buID"];
			}
			if (evt["agID"]) {
				agID = evt["agID"];
				delete evt["agID"];
			}
			if (! (buID && agID) || parseInt(buID) <= 0 || parseInt(agID) <= 0) {
				var rule = BRM.getRuleById(chatData.ruleID) ? BRM.getRuleById(chatData.ruleID) : this.rule;
				if (rule) {
					buID = buID && parseInt(buID) > 0 ? buID : rule.getBusinessUnitID();
					agID = agID && parseInt(agID) > 0 ? agID : rule.getAgentGroupID();
				}
			}
			
			if (agID && parseInt(agID) > 0) {
				custEvt.absorb({agentGroupID: agID});
				evt.absorb({agentGroupID: agID});
			}
			if (buID && parseInt(buID) > 0) {
				custEvt.absorb({businessUnitID: buID});
				evt.absorb({businessUnitID: buID});
			}

		    var custEvt = {customerID: Inq.getCustID(), chatID: chatData.id, agentID: this.getAgentID(), bizRuleName: this.rule.getName(),
                businessUnitID: buID, agentGroupID: agID};
		    this._fireEvt(                        /* NOTICE: This cauased a fault due to id not being defined */
			    function(l, evt){
				    var event = isNullOrUndefined(l.custApi) ? evt : custEvt;
				    try {
					    if(typeof l.onChatClosed=="function") l.onChatClosed(event);
					    if(typeof l.onChatEvent=="function") l.onChatEvent(event);
				    } catch(e) {
					    log("Error firing event onChatClosed on " + l.toString() + ": \n" + e);
				    }
			    },
				evt);
		} catch(e){
            logMessageToTagServer("Failure to fireChatClosed: "+catchFormatter(e), LOG_LEVELS.INFO);
		}
	};
	ChatMgr.prototype.fireChatEngaged = function(_src){
		if(this.hasEngaged){return;}
		this.hasEngaged=true;
		var evt = MixIns.mixAbsorber({
				evtType:this.EVTS.ENGAGED,
				timestamp:new Date(),
				src:_src,
				chat: this.getChatData(),
				bizRuleName: this.rule.getName()
		});
		var chatData = this.getChatData();
		evt.absorb(chatData).absorb({"chatID":this.getChatID(), "chatType":this.getChatType(), "customerID": Inq.getCustID(), "agentID":this.getAgentID()});

		var custEvt = MixIns.mixAbsorber({customerID: Inq.getCustID(), chatID: chatData.id, evtType:this.EVTS.LAUNCHED, chatType: this.getChatType(), bizRuleName: this.rule.getName()});

		var buID = null;
		var agID = null;
		if (evt["buID"]) {
			buID = evt["buID"];
			delete evt["buID"];
		}
		if (evt["agID"]) {
			agID = evt["agID"];
			delete evt["agID"];
		}
		if (! (buID && agID) || parseInt(buID) <= 0 || parseInt(agID) <= 0) {
			var rule = BRM.getRuleById(chatData.ruleID) ? BRM.getRuleById(chatData.ruleID) : this.rule;
			if (rule) {
				buID = buID && parseInt(buID) > 0 ? buID : rule.getBusinessUnitID();
				agID = agID && parseInt(agID) > 0 ? agID : rule.getAgentGroupID();
			}
		}

		if (agID && parseInt(agID) > 0) {
			custEvt.absorb({agentGroupID: agID});
			evt.absorb({agentGroupID: agID});
		}
		if (buID && parseInt(buID) > 0) {
			custEvt.absorb({businessUnitID: buID});
			evt.absorb({businessUnitID: buID});
		}

		this._fireEvt(
			function(l, evt){
				if(typeof l.onChatEngagedEvent=="function") l.onChatEngagedEvent(evt);
				if(typeof l.onChatEvent=="function") l.onChatEvent(evt);
			},
			evt
		);
	};

	ChatMgr.prototype.firePersistentChatClosed = function(_src){
		this.fireChatClosed(undefined,_src);
	};

	ChatMgr.prototype.firePersistentChatLanding = function(){
		this._firePersistentLandingEvt(this.getChatData());
	};

	ChatMgr.prototype.firePersistentPush = function(){
		this._fireChatEvt({id:++this.evtIdx, chatType:this.chat.getChatType(), evtType:this.EVTS.PERSISTENT_PUSH, chat:this.getChatData(), timestamp:new Date()});
	};

	ChatMgr.prototype.firePendingEvents = function(){
		if(this.isPersistentChat() || this.isV3Continue()){
			this.firePersistentChatLanding();
		}
	};
	ChatMgr.prototype._firePersistentPushEvt = function(evt){
        var chatData = null;
        var inh = null;
        if (this.chat){
            inh = this.chat.inHOP;
            chatData = this.chat.getChatData() ;
        }
		evt = MixIns.mixAbsorber({id:this.evtIdx++, evtType:this.EVTS.PERSISTENT_PUSH, src:this, chatID:(chatData ? chatData.id : null), inHOP: inh});
        evt.absorb(chatData).absorb({"customerID": Inq.getCustID(), rule:this.rule});

		this._fireEvt(function(l, _evt){if(l.onPersistentPush) l.onPersistentPush(_evt);}, evt);
	};
	ChatMgr.prototype._firePersistentLandingEvt = function(evt){
		this._fireEvt(function(l, _evt){if(l.onPersistentChatLanding) l.onPersistentChatLanding(_evt);}, evt);
	};

	/**
	 * @param _agtID text agentID
	 * @param _cobrowseEnabled boolean cobrowseEnabled.
	 * @param eventData JSON (string or object) with agent's first, last name, agent alias, requested attribute.
     * @param buID business unit of assigned agent
     * @param [agID] (optional) agent group of assigned agent
	 */
	ChatMgr.prototype.fireAgentAssigned = function(_agtID, _cobrowseEnabled, eventData, buID, agID){
		try {
			this.evtIdx++;
			var evt = MixIns.mixAbsorber({
				id: this.evtIdx,
				agentID: _agtID,
				cobrowseEnabled: !!_cobrowseEnabled,
				ruleID: this.chat.getRule().getID(),
				chatID: this.getChatID(),
				timestamp: new Date(),
				businessUnitID: buID
			});

			if (agID) {
				evt.agentGroupID = agID;
			}

			this.addAgentAttributesToEvent(evt);

			if (typeof(eventData) == "object") {
				evt.absorb(eventData);
			} else if (typeof(eventData) == "string") {
				evt.absorb(MixIns.JSON.parse(eventData));
			}
			this._fireEvt(
				function (l, evt) {
					if (l && typeof l.onAgentAssigned == "function") {
						l.onAgentAssigned(evt);
					}
				},
				evt
			);
		} catch (e) {
			logMessageToTagServer("Failure to fireAgentAssigned: " + catchFormatter(e), LOG_LEVELS.INFO);
		}
	};

	/**
	 * Returns true if specified chat type is supported, false otherwise.
	 * @param chatType service type to check support for. See valid values in CHAT_TYPES.
	 * @return true if specified chat type is supported, false otherwise.
	 */
	ChatMgr.prototype.isServiceSupported = function(chatType) {
		return !!this.CHAT_TYPES[chatType];
	};

	/**
	 * Returns true if specified chat type represents a call service.
	 * @param chatType service type to check.
	 * @return true for call types.
	 */
	ChatMgr.prototype.isCallServiceType = function(chatType) {
		return (this.CHAT_TYPES.C2CALL == chatType || this.CHAT_TYPES.POPUP_CALL == chatType);
	};

	/**
	 * Returns true if specified chat type represents a call service.
	 * @param chatType service type to check.
	 * @return "call" for call chat (click2call and proactive call), "chat" for normal chats. If there is no chat returns "null"
	 */
	ChatMgr.prototype.getConversionType = function() {
        if (!!this.chat) {
            return this.isCallServiceType(this.getChatType()) ? "call" : "chat";
        } else {
            return null;
        }
	};

	/**
	 * Method checks and returns "in progress" status for specified service type.
	 * @param chatType see CHAT_TYPES
	 * @return true if service of specified type is in progress
	 * @throws error "ServiceTypeNotRecognized" if provided service type is not recognized.
	 */
	ChatMgr.prototype.isServiceInProgress = function(chatType) {
		var inProgress = false;
		if(!!this.chat){
			var thisChatType = this.chat.getChatType();
		if (chatType == "ANY") {
			return !isNullOrUndefined(thisChatType);
		}
		if (!this.isServiceSupported(chatType)) {
			throw "ServiceTypeNotRecognized - not supported chat type provided: '" + chatType + "'";
		}

		if(!isNullOrUndefined(chatType)) {
			if(this.isPersistentWindow() && chatType==this.CHAT_TYPES.PERSISTENT){
				inProgress = true;
			}
			else{
				inProgress = (chatType == thisChatType);
			}
		}
		}
		return inProgress;
	};

	/**
	 * Registers flash var functions in this manager.
	 * Flash vars are not sent to controller among other parameters when chat launch is requested.
	 * On callback from server flash vars are appended to other parameters and passed on to Haxe code through
	 * FlashPeer.js
	 * @param fcn function that returns flash vars
	 */
	ChatMgr.prototype.registerFlashvarFcn = function(fcn) {
		this._flashvarFcns.push(fcn);
	};

	ChatMgr.prototype.getCobrowseBannerText = function(){
		return !!this.chat ? this.chat.getCobrowseBannerText() : "";
	};

	ChatMgr.prototype.endCobrowseSessionFromBanner = function(){
		try{
			var parentRef = window.parent;

			if( ! this.isChatInProgress() ){
				parentRef = this.getPersistentWindow();
			}
			parentRef.inqFrame.Application.application.customerEndsCobrowse();
		}catch( e ){
			log("We have a cobrowse error"+e);
		}
	};

	/**
	 * Builds and returns flash vars object from all flash vars functions registered in this manager.
	 * @return flash vars object
	 */
	ChatMgr.prototype.getFlashVarData = function() {
		var retval = null;
		if(this._flashvarFcns.length > 0){
			retval = MixIns.mixAbsorber({});
			for(var idx = 0; idx < this._flashvarFcns.length; idx++){
				retval.absorb(this._flashvarFcns[idx]());
			}
		}
		return retval;
	}

	/**
	 * Defines and returns agent group ID
	 * @param evt event object
	 * @param agentAssignedStage boolean variable, indicates if agent is assigned, passed from the agent-group-id.jsp
	 * @return agent group ID
	 */
	ChatMgr.prototype.getAgentGroupID = function(evt, agentAssignedStage) {
		var agentGroupID;
		if (agentAssignedStage) {
			agentGroupID = this.getChat() && this.getChat().getChatData() && this.getChat().getChatAgentGroupID() ? this.getChat().getChatAgentGroupID() : undefined;
		} else {
			agentGroupID = this.getChat() && this.getChat().getChatData() && this.getChat().getChatAgentGroupID() ? this.getChat().getChatAgentGroupID() 
			: (this.getChat() && this.getChat().getAgentGroupID() ? this.getChat().getAgentGroupID() : (evt.rule && evt.rule.getAgentGroupID() ? evt.rule.getAgentGroupID() : (this.getLastChat() && this.getLastChat().agentGroupID ? this.getLastChat().agentGroupID : undefined)));
		}
		return agentGroupID;
	}

	/**
	 * Turns on the beacon flag on postToServer iframe in the corresponding domain.
	 * It is needed to be able to send beacon to the server when corresponding window will be unloaded.
	 *
	 * @see Chat#setCABeacon
	 *
	 * @param {string} action - the action for setting the state of the beacon
	 * @param {object} data - interface for additional data (optionally)
	 */
	ChatMgr.prototype.setCABeacon = function(action, data) {
		if (this.chat) {
			this.chat.setCABeacon(action, data);
		}
	};

	/**
	 * Returns Queue Threshold parameter of Rule (AG/BU if not overridden in rule)
	 * @return {Number} qt, undefined if not set.
	 */
	ChatMgr.prototype.getQueueThreshold = function() {
		return this.getChat() ? this.getChat().getChatData().qt : null;
	}

	/**
	 * Returns the Queue Messaging SpecId for the opened chat.
	 *
	 * @returns {?number}
	 */
	ChatMgr.prototype.getQueueMessagingSpecId = function() {
		if (this.chat && this.chat.chatSpec) {
			return this.chat.chatSpec["qmspec"];
		}
	};

	ChatMgr.prototype.EVTS = {LAUNCHED:"LAUNCHED",PERSISTENT_PUSH:"PERSISTENT_PUSH",CLOSED:"CLOSED",REQUESTED:"REQUESTED",SHOWN:"SHOWN", ENGAGED:"ENGAGED", BEFORE_CLOSED: "BEFORE_CLOSED"};
	ChatMgr.prototype.PERSISTENT = {PERSISTENT:"persistent",PERSISTENT_COMPLETE:"persistent.complete"};

	/**
	 * Manager for C2C and C2Call
	 * @class Manager for C2C and C2Call
	 * @constructor
	 * @param data
	 * @borrows Absorber#absorb as #absorb
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @borrows Persistable#load as #load
	 * @borrows Persistable#save as #save
	 * @borrows Persistable#getPersistentID as #getPersistentID
	 * @borrows Persistable#onDataReady as #onDataReady
	 * @see Absorber
	 * @see Persistable
	 * @see FrameworkModule
	 */
	function C2CMgr(id, data){
		this._observable();
		this._frameworkModule(id);
		this.absorb(data);
		this._c2cList = [];
		this.stateVar = null;
		this.sessionVar = null;
		this.requestInProgress = false;
	}

	MixIns.prepare(C2CMgr).mixIn(MixIns.Absorber).mixIn(MixIns.FrameworkModule).mixIn(MixIns.Persistable).mixIn(MixIns.Observable);

	/**
	 * obtains a unique id amongst all Persistable types. This instance returns the FrameworkModule id.
	 */
	C2CMgr.prototype.getPersistentID = function(){ return this.getID(); };
	/**
	 * initializes the mgr and readies it's internal state for start. Module
	 * should be ready to start once initialized.
	 */
	C2CMgr.prototype.init = C2CMgr.prototype.start = function(){
	};

	/**
	 * Reset all C2C each managed by C2CMgr).
	 */
	C2CMgr.prototype.reset = function () {
		for (var i = 0; i < this._c2cList.length; i++) {
			if (typeof this._c2cList[i] !== "undefined") {
				this._c2cList[i].reset();
				this._c2cList[i].onChatClosed = null;
				delete this._c2cList[i];
			}
		}
	};

	C2CMgr.prototype.load = function(){
		function fixBlockedServicesData() {
			var blocked = {};
			var sessionServices = sessionData["blocked"];
			if(!!sessionServices) {
				for(var service in sessionServices) {
					blocked[service] = sessionServices[service];
				}
			}
			var stateServices = stateData["blocked"];
			if(!!stateServices) {
				for(var service in stateServices) {
					blocked[service] = stateServices[service];
				}
			}
			return blocked;
		}

		this.stateVar = new Variable(this.getID(), {}, resources["state"]);
		this.sessionVar = new Variable(this.getID(), {}, resources["session"]);
		var stateData = this.stateVar.getValue();
		this.absorb(stateData);
		var sessionData = this.sessionVar.getValue();
		this.absorb(sessionData);
        // fix blocked services
        if (!!this.blocked) {
        	this.blocked = fixBlockedServicesData();
        }
	};

	C2CMgr.prototype.save = function(){
		function prepareBlockedServicesData(services) {
			for(var service in services) {
				if(services[service] == 0) {
					if(!sessionData.blocked) {
						sessionData.blocked = {};
					}
					sessionData.blocked[service]=services[service];
				} else if(services[service] == -2){
					// no persistence... page level blocking
				} else {
					if(!stateData.blocked) {
						stateData.blocked={};
					}
					stateData.blocked[service] = services[service];
				}
			}
		}

		var stateData = {};
		var sessionData = {};

		if(!!this.blocked) {
			prepareBlockedServicesData(this.blocked);
		}
		this.stateVar.setValue(stateData);
		this.sessionVar.setValue(sessionData);
	};

	C2CMgr.prototype.onDataReady = function(){ 
		this.load();
	};

	C2CMgr.prototype.blockService = function(serviceType, period) {
		if(serviceType != ChatMgr.CHM.CHAT_TYPES.C2C && 
				serviceType != ChatMgr.CHM.CHAT_TYPES.C2CALL) {return;}
		if (isNullOrUndefined(this.blocked)) {
			this.blocked = {};
		}
		// block the service if it hasn't already been blocked or block duration has been expired
		if (isNullOrUndefined(this.blocked[serviceType]) || (!isNullOrUndefined(this.blocked[serviceType]) && this.blocked[serviceType] < (new Date).getTime())) {
			if (period > 0) {
				var now = new Date();
				period += now.getTime();
			}
			this.blocked[serviceType] = period;
			this.save();
		}
	};

	C2CMgr.prototype.unblockService = function(serviceType) {
		if(serviceType != ChatMgr.CHM.CHAT_TYPES.C2C && 
				serviceType != ChatMgr.CHM.CHAT_TYPES.C2CALL) {return;}
		if (!isNullOrUndefined(this.blocked) && !isNullOrUndefined(this.blocked[serviceType])) {
			delete this.blocked[serviceType];
		}
		this.save();
	};

	C2CMgr.prototype.isBlocked = function(serviceType) {
		var blockedValue = false;
		if (!isNullOrUndefined(this.blocked) && !isNullOrUndefined(this.blocked[serviceType])) {
			var now = new Date();
            var toDate = this.blocked[serviceType];
            if (toDate <= 0) { // 0 - session, -1 forever
                blockedValue = true;
            }
            else {
                blockedValue = toDate >= now.getTime();
            }
		}
		return blockedValue;
	};

    C2CMgr.prototype.isAnyBlocked = function() {
        if (isNullOrUndefined(this.blocked)) {
            return false;
        }
        for (var prop in this.blocked) {
            return true;
        }
        return false;
    };

	C2CMgr.prototype.requestChat = function(idx, callThisNumber){
		var c2c = this.getC2C(idx);
        if (!c2c) {
            log("can't find c2c " +  idx);
            return;
        }

		if ((c2c.c2p && c2c.getChatType() != ChatMgr.CHM.CHAT_TYPES.C2CALL) || (callThisNumber!=null&&(!c2c.isClicked()))) {
			CHM.earlyPopoutChat(c2c.c2cSpec.chatSpec.chatTheme) ;
		}
		if(!c2c.isClicked()){	
			this.fireC2CClicked(c2c);
            var self = this;
            CM.updateCACookie(function() {
                CHM.request(c2c.getRule(), c2c.getChatType(), c2c.getXmlChatSpec(), callThisNumber || null, c2c.c2p, function() {
                    self.showDisabledIcon();
                });
            });
			c2c.setClicked(true);
			C2CMgr.lastusedC2CId = c2c.pageElementID;
			C2CMgr.c2cBtnId = null;
		}
		else{
			log("Ignored C2C double click");
		}
	};

    /**
     * showDisabledIcon
     * Forces disabled icon display for each C2C instances.
     */
    C2CMgr.prototype.showDisabledIcon = function() {
        for (var i = 0; i < this._c2cList.length; i++) {
            if (typeof this._c2cList[i] !== "undefined") {
                this.getC2C(i).showDisabledIcon();
            }
        }
    };

	C2CMgr.prototype.getC2C = function(idx) {
		return this._c2cList[idx];
	};

	C2CMgr.prototype.request = function(rule, chatType, dataFcn, clickToPersistent) {
		if(this.isBlocked(chatType)) { return; }
		var c2c = new C2C(this, rule, chatType, dataFcn, clickToPersistent ? clickToPersistent : isC2cPersistent(),this.adaCompliant, this.adaAndroidC2cSupportDomains);
		if (c2c.getDiv()) {
			this._c2cList[c2c.getIdx()] = c2c;
			if (!this.requestInProgress) { // if we are not in progress, start request
				this.requestInProgress = true;
				c2c.request();
			}
			log('C2CMgr request: {ruleName: \"' + rule.getName() + '\"}');
		} else {
			C2C.IDX--;
			if (c2c.isDivOccupied()) {
				var exposureData = {
					siteID: Inq.getSiteID(),
					customerID: Inq.getCustID(),
					incrementalityID: getIncAssignmentID(),
					sessionID: getSessionID(),
					brID: rule.id,
					group: PM.getVar("incGroup").getValue(),
					businessUnitID: rule.getBusinessUnitID(),
					result: "existing_offer",
					rule: rule
				};
				BRM.fireExposureQualifiedEvent(exposureData);
				log("C2C div already occupied: " + rule.getName());
			} else {
				log("C2C div not found for " + rule.getName());
			}
		}
	};

	C2CMgr.prototype.nextRequest = function(completedC2C){
		log("C2C request complete for "+completedC2C.getRule().getName());
		this.requestInProgress = false;
		var nextIdx = completedC2C.getIdx()+1; // get the next one
		var nextC2C = this._c2cList[nextIdx];
		if(!!nextC2C){ // if there is a next one, then request it
			log("Issuing next C2C request for "+nextC2C.getRule().getName());
			this.requestInProgress = true; // request back in progress
			nextC2C.request();
		}
	};

    C2CMgr.prototype.showCallButton = function(indx, source, left, top, number, show, giveFocus, title){
        var c2c = this.getC2C(indx) ;
        if (c2c!=null)
            c2c.showCallButton(source, left, top, number, show, giveFocus, title) ;
    };

	/**
	 * Determine whether a potential listener should be added to this object's list of
	 * event listeners. To be a C2CMgr listener, a listener should implement at least
	 * one of the following methods:
	 * 	onC2CDisplayed
	 * 	onC2CClicked
	 *
	 * @param l listener object to check
	 */
	C2CMgr.prototype.isListener = function(l){
		return !!(l && (l.onC2CDisplayed || l.onC2CClicked || l.onC2CStateChanged));
	};

	C2CMgr.prototype.onChatClosed = function() {
		this.clicked = false;
	};

	C2CMgr.prototype.fireC2CStateChanged = function(data) {
		var evt = {c2c:data.c2c, oldState:data.oldState, newState:data.newState, rule: data.rule, serviceType: CHM.CHAT_TYPES.C2C, customerID: Inq.getCustID(), data: data.data, bizRuleName: data.rule ? data.rule.getName() : null};
		function f(l, evt) {
			try {
				if (!!l.onC2CStateChanged) {
					l.onC2CStateChanged(evt);
				}
			} catch(e) {
				log("Error firing event fireC2CStateChanged on "+ l.toString()+":"+e);
			}
		}
		this._fireEvt(f, evt);
	};

	C2CMgr.prototype.fireC2CDisplayed = function(data) {
	   	var evt = MixIns.mixAbsorber({c2c:data.c2c, rule: data.rule, serviceType: CHM.CHAT_TYPES.C2C, customerID: Inq.getCustID(), data: data.data, bizRuleName: data.rule ? data.rule.getName() : null});
		var buID = data.rule ? data.rule.getBusinessUnitID() : null;
		var agID = data.rule ? data.rule.getAgentGroupID() : null;
		if (agID && parseInt(agID) > 0) {
			evt.absorb({agentGroupID: agID});
		}
		if (buID && parseInt(buID) > 0) {
			evt.absorb({businessUnitID: buID});
		}
    	function f(l, evt) {
    		try {
    			if (!!l.onC2CDisplayed) {
    				l.onC2CDisplayed(evt);
    			}
    		} catch(e) {
    			log("Error firing event C2CDisplayed on "+ l.toString()+":"+e);
    		}
    	}
    	this._fireEvt(f, evt);
	};

	C2CMgr.prototype.fireC2CClicked = function(c2c) {
	   	var evt = MixIns.mixAbsorber({c2c:c2c, rule: c2c.getRule(), serviceType: CHM.CHAT_TYPES.C2C, customerID: Inq.getCustID(), bizRuleName: c2c.getRule() ? c2c.getRule().getName() : null});
		var buID = c2c.getRule() ? c2c.getRule().getBusinessUnitID() : null;
		var agID = c2c.getRule() ? c2c.getRule().getAgentGroupID() : null;
		if (agID && parseInt(agID) > 0) {
			evt.absorb({agentGroupID: agID});
		}
		if (buID && parseInt(buID) > 0) {
			evt.absorb({businessUnitID: buID});
		}
    	function f(l, evt) {
    		try {
    			if (!!l.onC2CClicked) {
    				l.onC2CClicked(evt);
    			}
    		} catch(e) {
    			log("Error firing event C2CClicked on "+ l.toString()+":"+e);
    		}
    	}
    	this._fireEvt(f, evt);
	};

	C2CMgr.prototype.IMAGETYPES = {disabled: "d", busy: "b", afterHours: "ah", ready: "r"};
	C2CMgr.prototype.STATES = {"d" : "chatactive", "b": "busy", "ah": "outofhours", "r": "ready"};
	C2CMgr.c2cBtnId = null;
	/**
	 * A Chat object represents an active, ongoing chat. It contains a fully formed chatspec with
	 * its appropriate theme.
	 * @param chatData -- contains the following items
	 * 	id
	 * 	rule
	 * 	chatType
	 * 	chatSpec
	 * 	chatMgr
	 *  persistentChat
	 * @borrows Absorber#absorb as #absorb
	 */
	function Chat(chatData){
		this.sesVar = new Variable("chat", {}, resources["session"]);
		this._className="Chat";
		this._stage = window.parent.document.getElementById("inqChatStage");
		this.intervalId = 0;
		this._isVisible = false;
		this.dragHandleID = "inqTitleBar";
		this.cd = MixIns.clonize(chatData);
		this.rule = null;
		this.agID = null;
        this.agName = null;
		this.BEACON_DATA = "DATA";
	}
	MixIns.prepare(Chat).mixIn(MixIns.Absorber);

	/**
	 * sets survey data into the chat data persistence.
	 * @param sdat Object the data for the survey.
	 */
	Chat.prototype.setSurvey = function(sdat){
		if(!!sdat && sdat.id>0){
			this.cd.sid = sdat.id;
			this.save();
		}else{
			log("chat.setSurvey(): Survey data set failed. sdat undefined or invalid sid"+sdat);
		}
	};

	/**
	 * Method that validates instantiation data and initializes internal objects using the that data.
	 * If not data was provided, an attempt to grab data from persistence is made. If no data is found
	 * in persistence, then null value is returned.
	 * @returns fully initialized chat instance if chat data is found and validates. null if neither chat data
	 * nor persistence data is obtained.
	 * @throws Error if validation of data fails.
	 * mpk: Unit tested
	 */
	Chat.prototype.load = function(){
		var cd = this.cd;
		if(isNullOrUndefined(cd)){
			cd = MixIns.clonize(this.sesVar.getValue());
			if(isNullOrUndefined(cd)){
				return null;
			}
		}
		if(!isNullOrUndefined(cd)){
			cd.aMsgCnt = (isNullOrUndefined(cd.aMsgCnt))?0:cd.aMsgCnt;
			cd.cMsgCnt = (isNullOrUndefined(cd.cMsgCnt))?0:cd.cMsgCnt;
			if (isNullOrUndefined(cd.launchPageId)) {
				cd.launchPageId = LDM.getPageID();
			}
		}
		Chat.validate(cd); // throws here if invalid
		this.cd = cd;
		this.chatSpec = MM.mergeChatSpec(cd.xmlSpec); // reconstitute the chatSpec object
		this.rule = BRM.getRuleById(cd.ruleID); //look up rule object
		return this;
	};

	Chat.prototype.getCiData = function(){
		return !!this.cd?this.cd.ci:{};
	};

	Chat.prototype.setCiData = function(dat, doNotSave){
		if(this.cd){
			this.cd.ci = dat;
			if(!doNotSave)
				this.save();
		}
	};

	/**
	 * Unified factory method for Chat class. Creates and initializes a new chat instance.
	 * @param chatData Object Optional param that contains all the initializing data for the chat.
	 * If null or undefined, an "unprimed" chat instance will be returned that can be loaded from persistence via the load method.
	 * @return Chat A primed but uninitialized chat instance representing an ongoing or new chat.
	 * @see load instance method
	 */
	Chat.unmarshal = function(chatData){
		return new Chat(chatData);
	};
	Chat.prototype.bumpAgtMsgCount=function(){
		if(!!this.cd)
			this.cd.aMsgCnt += 1;
	};
	Chat.prototype.bumpCustMsgCount=function(){
		if(!!this.cd)
			this.cd.cMsgCnt += 1;
	};
	Chat.prototype.getCustMsgCnt=function(){
		if(!!this.cd)
			return this.cd.cMsgCnt;
		return 0;
	};
	/**
	 * Gets the chat data as a clone. Clone used because external manipulation of the
	 * chat's actual internal data can kill the chat.
	 */
	Chat.prototype.getChatData=function(){
		try{
			// this has the potential to throw "Error: attempt to run compile-and-go script on a cleared scope"
			// See MAINT27-250 for details.
			// TODO: find out why this throws when closing persistent window
			return !!this.cd?this.cd.clone():null;
		}catch(err){
			MixIns.clonize(this.cd); // reattach the clone() method with local scope.
			return this.cd.clone(); // try again
		}
	};
	Chat.prototype.getAgentMsgCnt=function(){
		if(!!this.cd)
			return this.cd.aMsgCnt;
		return 0;
	};
	Chat.prototype.save=function(){
		this.sesVar.setValue(this.cd);
	};
	Chat.prototype.getCustID = function(){
		return Inq.custID;
	};

	Chat.prototype.getChatID = function(){
		if(!!this.cd)
			return this.cd.id;
		return null;
	};

	Chat.prototype.getChatType = function() {return this.cd.chatType;};

	/**
	 *  Returns c2c to persistent flag, it can be overridden in <show-c2c*> tags
	 */
	Chat.prototype.isC2cToPersistent = function() {return this.cd.c2cToPersistent;};

	/**
	 *  Return language specified in the rule or default language
	 */
	Chat.prototype.getLanguage = function() {
		var language;
		try {
			language = this.getRule().getLanguage();
		} catch (e) {
			log("Error while getting language from Rule: \n" + e + "\n");
		}

		/* Double checking since Business rule can have language as an empty string */
		if (!language) {
			language = getDefaultLanguage();
		}

		return language;
	};

	Chat.prototype.onLocalCallback = function(){
		try {
			this.show();
		} catch(e) {
			log("Error in above code: \n" + e + "\n" + data);
		}
	};

	Chat.prototype.getRule = function() {
		return this.rule;
	};

	/**
	 * getRuleId getter for rule id,
	 * saved in the chat context,
	 * if not there, then get it from the rule
	 * The rule can get stale.
	 * On IE in pop-out mode (persistent) the rule can become unusable when:
	 * 1) the client window (parent.opener) is closed
	 * At creation of the persistent window we know that we have a client window
	 * So we get the ruleId and ruleName at that time
	 * @return the textual rule id
	 * @see constructor for chat (function Chat)
	 * @see getRuleName
	 * @see http://dev.inq.com/jira/browse/MAINT22-213
	 */
	Chat.prototype.getRuleId = function() {
		var ruleID = this.rule.getID();
		return !!ruleID?ruleID:"";
	};

	/**
	 * getRuleName getter for rule id,
	 * saved in the chat context,
	 * if not there, then get it from the rule
	 * The rule can get stale.
	 * On IE in pop-out mode (persistent) the rule can become unusable when:
	 * 1) the client window (parent.opener) is closed
	 * At creation of the persistent window we know that we have a client window
	 * So we get the ruleId and ruleName at that time
	 * @return the textual rule name
	 * @see constructor for chat (function Chat)
	 * @see getRuleId
	 * @see http://dev.inq.com/jira/browse/MAINT22-213
	 */
	Chat.prototype.getRuleName = function() {
		return this.rule.getName();
	};

	/** monitorChatActive
	 *  Sets the active flag (inqCA) to "1" or "2".
	 *  When window will be unloaded, the active flag will be turned off
	 *		The non XD chat keeps a flag in the cookie for active chat
	 *		The XD chat can set the cookie flag but cannot unset it before the parent window was closed.
	 *		Therefore we use a workaround to do this in XD mode
	 *			we have an IFRAME set the cookie on, when we launch a chat
	 *			when the client frame closes, we set the cookie off via the "unload" event.
	 *		The cookie manager is used to perform "postRequestToIframeProxy" to send request to IFRAME,
	 *			the IFRAME's source is postToServer.htm and it performs the function "CHATACTIVE"
	 *				the CHATACTIVE:
	 *				1) Sets up flag in the cookie inqCA (for inq Chat Active)
	 *				2) Sets up to catch the event "unload"
	 *				3) Upon unload the cookie inqCA sets flag "0" (chat inactive)
	 */
	Chat.prototype.monitorChatActive = function(){
		if (!(CM.xd)) return;										/* If we are not XD mode, then we don't have to monitor */

		/* The command is "CHATACTIVE", we give the site id, so it can be suffixed to the cookie name */
		CM.cookies["inqCA"] = 1;
		var request = [
			"CHATACTIVE",
			"CHATACTIVE",
			Inq.siteID,
			isPersistentWindow(),
			this.getChatData().v3TO
		];
		CM.postRequestToIframeProxy(request);	/* We tell the CookieManager to post the request to the IFRAME, get'r done */
	};

	/** closeChatMonitor
	 * Sets the active flag to "0" via the "unload" event.
	 *	When the active flag is zero, it is considered "off".
	 * Sends to IFRAME request to make the CA flag set to inactive.
	 *
	 * @see  this.monitorChatActive
	 * @see  this.close
	 * @see  postToServer.htm command "CHATACTIVE"
	 */
	Chat.prototype.closeChatMonitor = function(){
		if (!(CM.xd)) return;									/* If we are not XD mode, then we don't have to monitor */

		CM.cookies["inqCA"] = 0;
		var request = [
			"CHATACTIVE",
			"CHATDEACTIVATE",
			Inq.siteID,
			isPersistentWindow(),
			this.getChatData().v3TO
		];
		CM.postRequestToIframeProxy(request);
	};

	/**
	 * Turns on the beacon flag on postToServer iframe in the corresponding domain.
	 * It is needed to be able to send beacon to the server when corresponding window will be unloaded.
	 *
	 * @param {string} action - the action for setting the state of the beacon:
	 *              "ACTIVATE" - to activate sending of beacon;
	 *              "DEACTIVATE" - to deactivate sending of beacon;
	 *              "DATA" - to update data value for beacon.
	 * @param {object} data - interface for additional data (optionally)
	 */
	Chat.prototype.setCABeacon = function(action, data) {
		var url = secureHTTP(Inq.urls.pageUnloadURL);
		var beaconData = {};
		beaconData[KEY_ENGAGEMENT_ID_STRING] = this.getChatID();
		beaconData[KEY_CUSTOMER_ID_STRING] = this.getCustID();
		if (action == this.BEACON_DATA && data) {
			for (var key in data) {
				beaconData[key] = data[key];
			}
		}
		var beaconRequest = [
			"BEACON",
			action,
			MixIns.JSON.stringify(beaconData),
			url,
			this.getChatID()
		];
		LoadM.postRequestToIframeProxy(url, beaconRequest);
	};

	Chat.prototype.show = function() {
		var type = this.getChatType();
		if (this.chatSpec!=null &&
			((type==CHM.CHAT_TYPES.C2C) || (type==CHM.CHAT_TYPES.PERSISTENT)) && this.isC2cToPersistent()) {

			/*
			 * By checking for getPersistentWindow only when we already have v3C2cPersistent
			 * set to true we save a pop up appearing and disappearing. Better user
			 */
			if( ! CHM.getPersistentWindow() ){
				CHM.popOutChat(true);
				return;
			}
		}
		this.preloadChat();
		/* If we are XD mode, establish the ActiveChat monitor */
		this.monitorChatActive();							/* We test for XD mode in the method */
		this.setVisible(true);
		FP.startChatInterface();
	};

	Chat.prototype.close = function() {
		this.setVisible(false);
		this.closeChatMonitor();						/* If we are XD mode, have the Chat Active monitor decrement the active cookie */
		FP.closeChatInterface();
		this.closed=true;
		this.sesVar.setValue(null);
		this.endCobrowseSession();
	};

	Chat.prototype.isClosed = function() {
		return !!(this.closed);
	};

	Chat.prototype.isVisible = function() {
		return this._isVisible;
	};

	Chat.prototype.setVisible = function(vis) {
		this._isVisible = vis;
		// FIXME: This code is bad and should be removed.  The call to
		// FlashPeer.setVisible below does all the same stuff, but
		// does it nicely through the correct interfaces.  HOWEVER,
		// we're under the gun to get this revision out, and the unit
		// tests are complaining.  So I'm leaving this here to make
		// the unit tests happy, and I'll refactor the TESTS later and
		// remove this.
		var _corner = window.parent.document.getElementById("inqDivResizeCorner");
		var _title = window.parent.document.getElementById("inqTitleBar");
		var _stage = window.parent.document.getElementById("inqChatStage");
		_stage.style.display = (vis)?"":"none";
		if(_corner)_corner.style.display = (vis)?"":"none";
		if(_title)_title.style.display = (vis)?"":"none";
	};

	Chat.prototype.getDragHandle = function(){
		return this.dragHandleID;
	};

	Chat.prototype.setDragHandle = function(handleElementID){
		this.dragHandleID=handleElementID;
	};

	Chat.prototype.setResizable = function(){
		if(this._stage==null)
			this._stage = window.parent.document.getElementById("inqChatStage");
		var resizeHandleElem = window.parent.document.getElementById("inqDivResizeCorner");
		if(typeof Inq.Resize != "undefined" && resizeHandleElem) {
			Inq.Resize.__init(resizeHandleElem, this._stage);
		}
	};

	Chat.prototype.setDragable = function(){
		if(this._stage==null)
			this._stage = window.parent.document.getElementById("inqChatStage");
		var dragHandleElem = window.parent.document.getElementById("inqTitleBar");

		try {
			if(typeof Inq.Drag != "undefined" && dragHandleElem)
				Inq.Drag.__init(dragHandleElem, this._stage);
		} catch (e){}
	};

	/**
	 * Sends the transition message to Tagserver and ChatRouter that chat moves to persistent window.
	 * @param persistentState {string} shows the beginning and the completion of the moving to persistent mode.
	 */
	Chat.prototype.transitionMessage = function(persistentState) {
		var params = {agentID: CHM.getAgentID(), chatID: CHM.getChatID(), transitioning: persistentState};
		ROM.send(urls.baseURL + "/tracking/persistentMsg", params, false, true, 20, 5000);
		if (persistentState.equals(CHM.PERSISTENT.PERSISTENT_COMPLETE) && this.getCiData().isEngaged) {
			ROM.send(CHM.getChatRouterURL() + "/chatrouter/chat/persistentComplete", {"engagementID": CHM.getChatID()});
		}
	};

	Chat.prototype.popOutChat = function(transition, top, left, bottom, right){
		if (transition)
			this.transitionMessage(Inq.CHM.PERSISTENT.PERSISTENT);
		CHM.setPersistentChatSetting("true");

		var persistentFocus = true;
		var winTest = null;
		var sHeight = 300;
		var sWidth  = 400;
		var sLeft   = 40;
		var sTop  	= 20;
		var cdata	= this.chatSpec;
		if (cdata && cdata.chatTheme){
			sHeight = cdata.chatTheme.ph;
			sWidth  = cdata.chatTheme.pw;
			sLeft   = cdata.chatTheme.px;
			sTop	= cdata.chatTheme.py;
		}

		var url, target;

		url = Inq.v3framesrc;
		target = "_inqPersistentChat";
		winTest = CHM.earlyPopout;
		/* Window of the soon-to-be pop-out chat*/
		if (winTest != null && winTest.closed==false) {
			CHM.earlyPopout = null;
			winTest.location = url;
		}
		else {
			CHM.earlyPopout = null;
			var tools = "toolbar=no,location=no,menubar=no,status=no,scrollbars=no" +
						",top=" + sTop +
						",left=" + sLeft +
						",width=" + sWidth +
						",height=" + sHeight +
						",resizable=1";
			try {
				winTest = window.parent.top.open(url, target, tools);
				if( ! winTest ){
					CHM.sendMsg( { chatID:this.getChatID(), msg:MixIns.JSON.stringify( {PopupBlocker : "<b>Persistent Chat Push: FAILED</b>" } ) } );
				}
				if ("" != url){
					if (winTest == top)
						winTest = null;
				}
				else{
					var newdoc = null;
					if (winTest) {
						try {newdoc = winTest["document"];} catch(e) {}
						if (newdoc==null)
							try {newdoc = winTest.document;} catch(e){}
				}
				if (newdoc) {
					var scriptz = document.getElementsByTagName("SC"+"RIPT");
					var scrp = null;
					for (ix=0;ix < scriptz.length;ix++){
						if (scriptz[ix].src.indexOf("/inqChatLaunch")>=0) {
							scr = '<script type="text/javascript" src="'+scriptz[ix].src+'"/></script>';
							break;
						}
					}
					if (scrp)
						newdoc.write(scrp);
					else
						newdoc.close();
					}
				}
				cdata.pC = null!=winTest;
			} catch (e) {
				winTest = null;
			}
		}
		CHM.popoutWindow = winTest;
		if (winTest){
			if (winTest.focus && !CHM.isMobile()) {
				try {
					 winTest.focus();
				}
				catch(e) {}
			}
			cdata.pC = true;
			return true;
		}
		else
			return false;
	};

	Chat.prototype.toString = function(){
		var val = 'Chat: ';
		for(var n in this){
			val += ""+n+"="+this[n]+",";
		}
		return val;
	};

	Chat.prototype.getFlashVars = function(){
		var sesVar = PM.getVar("sesID");
		var incVar = PM.getVar("incID");
		var launchPageId = this.getChatData().launchPageId;
		var launchPageMarker = LDM.getPageMarkerById(launchPageId);
		// Introduced by AUTOMATION-122 "Update the engagement.requested event to include the visitorAttributes field":
		// A sample value with two VAs where 1st one is multivalued would be:
		// 'Noteworthy+Content+Groups=Solutions,Advantage,Sales;Readiness+Indicator=Almost+ready'
		var visitorAttributes = encodeURIComponent(VAM.getCopyAsArray(true).join(';'));

		var flashvars = 'continued='+ (CHM.isV3Continue()?'1':'0')+
						'&sessionID=' + (sesVar?sesVar.getValue():123456) +
						'&incAssignmentID='+ (incVar?incVar.getValue():123456) +
						'&businessUnitID='+ this.getBusinessUnitID() +
						'&chatID=' + this.getChatID() +
						'&customerID=' + this.getCustID() +
						'&agentName=' + encodeURIComponent(this.getAgentName()) +
                        '&overrideAgentAlias=' + this.getOverrideAgentAlias() +
						'&scriptID=' + this.getScriptID() +
						'&agentExitLine=' + encodeURIComponent(this.getAgentExitLine()) +
						'&siteID=' + Inq.siteID +
						'&userName=' + encodeURIComponent(this.getCustomerName()) +
						'&agent'+
						'&newFramework=1'+
						'&title=foo'+
						'&chatTitle=' +  this.rule.name +
						'&crHost='+CHM.getChatRouterURL()+
						'&submitURL='+CHM.getChatRouterURL()+
						'&tagServerBaseURL='+ Inq.urls.vanityURL +
						'&commTypes=http'+
						'&brID=' + this.rule.id +
						'&agentAttributes='+ encodeURIComponent(this.getAgentAttributesAsString()) +
						'&ruleAttributes='+ encodeURIComponent(this.getRuleAttributesAsString()) +
						'&deviceType=' + getDeviceType() +
						'&browserType=' + getClientBrowserType() +
						'&browserVersion=' + getClientBrowserVersion() +
						'&operatingSystemType=' + getOSType() +
						'&visitorAttributes=' + visitorAttributes +
						'&launchType=' + this.getChatType() +
						'&language=' + this.getLanguage() +
						'&launchPageMarker=' + launchPageMarker +
						'&launchPageId=' + launchPageId +
						'&qt=' + CHM.getQueueThreshold();

		if (this.rule["phoneNumber"]!=null)
			flashvars += '&clickToPhone=' + this.rule.phoneNumber;

		if (this.pC || CHM.isPersistentWindow() ) flashvars += "&PersistentFrame=1";

		var automatonId = this.getAutomatonId();
		if (!isNullOrUndefined(automatonId)) {
			flashvars += '&automatonId=' + automatonId;
			var automatonFields = this.getAutomatonFields();
			if (!isNullOrUndefined(automatonFields)) {
				flashvars += '&automatonFields=' + encodeURIComponent(JSON.stringify(automatonFields));
			}
		}

		var automatonSpecData = this.getAutomatonSpecData();
		if (!isNullOrUndefined(automatonSpecData)) {
			flashvars += '&automatonSpecData=' + encodeURIComponent(MixIns.JSON.stringify(automatonSpecData));
		}

        if(this.getOpenerName()) {
            flashvars += '&openerName=' + this.getOpenerName();
        } else {
            flashvars += '&openerID=' + this.getOpenerID();
        }

		var agID = this.getAgentGroupID();
		if(!isNullOrUndefined(agID)){
			flashvars += '&agID=' + agID;
            var agName = CHM.getAgentGroupNameByID(agID);
            // Although it may not happen, agName can be undefined if agID is not in siteAgentGroups map.
            if (!isNullOrUndefined(agName)) {
                flashvars += '&agName=' + agName;
            }
		}

		var uniqueAgentName = this.getUniqueAgentName();
		if(!isNullOrUndefined(uniqueAgentName)){
			flashvars += '&uniqueAgentName=' + uniqueAgentName;
		}

		var agentAutoOpenerId = this.getAgentAutoOpenerId();
		if (!isNullOrUndefined(agentAutoOpenerId)) {
			flashvars += '&agentAutoOpenerId=' + agentAutoOpenerId;
		}

		var flashvarFcnsData = decodeURIComponent(Inq.ROM.toParamString(CHM.getFlashVarData()));
		if (flashvarFcnsData && flashvarFcnsData.length > 0) {
			flashvars += "&" + flashvarFcnsData;
		}
		flashvars = this._fixFlashVars(flashvars);

		return flashvars;
	};

	/**
	 * Proxy call to BusinessRule.prototype.getAgentAttributesAsString().
	 */
	Chat.prototype.getAgentAttributesAsString = function () {
		try {
			return this.getRule().getAgentAttributesAsString();
		}
		catch(e) {
			log("Error getAgentAttributes " + e);
		}
			return null;
	};

	/**
	 * Proxy call to BusinessRule.prototype.getRuleAttributesAsString().
	 */
	Chat.prototype.getRuleAttributesAsString = function () {
		try {
			return this.getRule().getRuleAttributesAsString();
		}
		catch(e) {
			log("Error getting rule attributes " + e);
		}
		return null;
	};

	Chat.prototype.getSkin = function(){
		/** change "zip" to "mxml"
		*/
		return Inq.urls.skinURL + this.chatSpec.chatTheme.fn.replace(/\.(mxml|zip)$/, "") + ".mxml";
	};

	Chat.prototype.getImagePath = function(){
		return Inq.urls.mediaSiteURL + "/flash/";
	};

	/**
	 * Preloads the chat haxe framework
	 */
	Chat.prototype.preloadChat = function(){
		var src;
		var scrpt =  document.createElement("SC"+"RIPT");
		scrpt.type = "text/javascript";
		scrpt.language = "javascript";
		scrpt.setAttribute("language", "javascript");
		scrpt.setAttribute("type", "text/javascript");
		scrpt.charset="utf-8";

		src =  Inq.urls.mediaRootURL+"/flash/InqFramework";
		switch (getCiObfuscationLevel()){
			case 1: src +=  "-w"; break;
			case 2: src += "-s"; break;
			case 3: src += (isJsLoggingActive()) ? "-a" : "-qa"; break;
			case 0: default: break;
		}

		src += ".js?codeVersion=" + ((v3Lander)?encodeURIComponent(v3Lander.codeVersion):"undefined");
		scrpt.src = src;
		scrpt.id = "inqChatJs";

		window.document.getElementsByTagName("body")[0].appendChild(scrpt);
        if(!window.parent.Inq.datapass && isPersistentWindow()){
            window.parent.Inq.datapass = window.parent.opener.Inq.datapass;
        }
	};

	/**
	 * private _fixFlashVars,
	 * if clickstream data is missing in the flashvars, insert it
	 * if the useragent data is missing in the flashvars, insert it
	 */
	Chat.prototype._fixFlashVars = function(fv){
		if( undefined == fv )
			return "";
		if( fv.indexOf("&clickStream=")>=0 )
			return fv;
		var extraFlashVars = "";
		var clickStreamData = null;
		try{
			/*If this is a persistent window, get the click stream data from the opener*/
			var obj = (CHM.isPersistentWindow())?window.parent.opener.inqFrame.Inq.FlashPeer.getAgentData():FP.getAgentData();

			clickStreamData = unescape(Inq.ROM.toParamString(obj,true));
		} catch (e) {
			log(e);
		}
		if (clickStreamData!=null && clickStreamData!="")
			extraFlashVars += "&clickStream="+escape(clickStreamData);
		if (navigator.userAgent)
			extraFlashVars += "&userAgent="+escape(navigator.userAgent);
		return (fv+extraFlashVars);

	};

	Chat.prototype.isPersistent = function() {
		return this.pC;
	};

	Chat.prototype.getBusinessUnitID = function() {
		var businessUnitID;
		try {
			businessUnitID = this.getRule().getBusinessUnitID();
		} catch (e) {
			log("Error getting chat business unit id: \n" + e + "\n");
		}
		if (isNullOrUndefined(businessUnitID)) {
			businessUnitID = getDefaultBusinessUnitID();
		}
		return businessUnitID;
	};

	Chat.prototype.getAgentGroupID = function() {
		return this.rule == null ? null : this.rule.getAgentGroupID();
	};

    /**
     * Returns agent name to be routed from business rule agent profile
     * @return agent name string or null if it is not provided in rule
     */
	Chat.prototype.getUniqueAgentName = function() {
		return this.rule == null ? null : this.rule.getUniqueAgentName();
	};

	Chat.prototype.getAgentName = function() {
		var agentName = "";
		try {
			agentName = this.chatSpec.chatTheme.an;
            if(!agentName) {
                agentName = MM.getChatTheme(this.chatSpec.chatTheme.id).an;
            }
		} catch (e) {}
		return agentName;
	};

    Chat.prototype.getOverrideAgentAlias = function() {
        var result = false;
        if(this.chatSpec && this.chatSpec.chatTheme && !isNullOrUndefined(this.chatSpec.chatTheme.oaa)){
            result = this.chatSpec.chatTheme.oaa;
        }
        return result;
    };

	Chat.prototype.getAgentID = function() {
		return isNullOrUndefined(this.cd.aid)?"":this.cd.aid;
	};

	Chat.prototype.setAgentConfig = function(aid, buID, agID, agentAttrs){
        var agName = CHM.getAgentGroupNameByID(agID);
		this.cd.aid = isNullOrUndefined(aid)?"":aid;
		this.cd.buID = buID;
        this.cd.agID = agID;
        this.cd.agName = agName;
		this.cd.agtAttrs = this.agentAttributesStringToMap(agentAttrs);
        CHM.getLastChat().businessUnitID = buID;
		CHM.getLastChat().agentGroupID = agID;
        CHM.getLastChat().agentGroupName = agName;
		CHM.getLastChat().agentID = aid;
	};

	/**
	 * Converts agent attributes row string to an object
	 * @param attrs is string of attributes (attr1=va1,attr2=val2)
	 * @return object like {attr1:[value1,value2], attr2:[value1,value2]}
	 */
	Chat.prototype.agentAttributesStringToMap = function(attrs){
		function split2(str, sep) {
			var index = str.indexOf(sep);
			if (index < 0) {
				return [str, ""];
			} else {
				return [str.substring(0, index), str.substring(index + sep.length)];
			}
		}
		var map = {};
		var delimiter = '=';
		if(!!attrs) {
			var attrsArray = attrs.split(',');
			for(var i = 0; i < attrsArray.length; i++) {
				var nameValue = split2(attrsArray[i], delimiter);
				if(!map[nameValue[0]]) {
					map[nameValue[0]] = [];
				}
				map[nameValue[0]].push(nameValue[1]);
			}
		}
		return map;
	};

	/**
	 * Function to test if agent has specified attribute's value
	 * @param name string name of attribute
	 * @param testValue attribute's value
	 * @return {boolean} result of checking
	 */
	Chat.prototype.testAgentAttributesValue = function(name, testValue){
		var agentAttrs = this.cd.agtAttrs;
		var values = agentAttrs[name];
		if(values){
			for(var i = 0; i < values.length; i++){
				if(values[i] == testValue) {
					return true;
				}
			}
		}
		return false;
	};

	Chat.prototype.getChatBusinessUnitID = function() {
		return isNullOrUndefined(this.cd.buID) ? -1 : this.cd.buID;
	};


	Chat.prototype.getChatAgentGroupID = function() {
		return isNullOrUndefined(this.cd.agID) ? null : this.cd.agID;
	};

    Chat.prototype.getChatAgentGroupName = function() {
        return isNullOrUndefined(this.cd.agName) ? null : this.cd.agName;
    };

	Chat.prototype.getScriptID = function() {
		var id = 0;
		try {
			id = this.chatSpec.stId;
		} catch (e) { }
		return id;
	};

	Chat.prototype.getAgentExitLine = function() {
		var line = "";
		try {
			line = this.chatSpec.ael;
		} catch(e) {}
		return line;
	};

	Chat.prototype.getOpenerID = function() {
		var opener = 0;
		try {
			opener = this.chatSpec.oId;
		} catch(e) {}
		return opener;
	};

    Chat.prototype.getOpenerName = function() {
        return !!this.chatSpec && !!this.chatSpec.oName ? this.chatSpec.oName : null;
    };

	Chat.prototype.getAgentAutoOpenerId = function() {
		return !!this.chatSpec && !!this.chatSpec.aaoId ? this.chatSpec.aaoId : null;
	};

	Chat.prototype.getCustomerName = function() {
		var name = "";
		try {
			name = this.chatSpec.chatTheme.cn;
            if(!name) {
                name = MM.getChatTheme(this.chatSpec.chatTheme.id).cn;
            }
		} catch(e) {}
		return name;
	};

	Chat.prototype.getChatSpec = function() {
		var spec = null;
		try {
			spec = this.chatSpec;
		} catch (e) {}
		return spec;
	};

	Chat.prototype.getAutomatonId = function() {
		try {
			if (!isNullOrUndefined(this.chatSpec.aId)) {
				return this.chatSpec.aId;
			} else if (!isNullOrUndefined(this.chatSpec.aSpecId)) {
				return this.chatSpec.aSpecId;
			}
		} catch (e) {}
		return null;
	};

	Chat.prototype.getAutomatonFields = function() {
		var result = null;
		if(this.chatSpec && this.chatSpec.aFields) {
			result = this.chatSpec.aFields;
		}
		return result;
	};

	Chat.prototype.getAutomatonSpecData = function() {
		try {
			if (!isNullOrUndefined(this.chatSpec.aspecData)) {
				return this.chatSpec.aspecData;
			}
		} catch(e) {}
		return null;
	};

	Chat.prototype.endCobrowseSession = function(){
		if (Inq["CBC"])	Inq.CBC.stop();
	};

	Chat.prototype.getCobrowseBannerText = function(){
		if (Inq["CBC"])
			return Inq.CBC.getCobrowseBannerText();
		return "";
	};

	/**
	 * Returns the first value of the specific agent attribute if it there's
	 * and empty string if there is no.
	 * For example:
	 *   If string of attributes is "attr=foo,attr=bar",
	 *   then only "foo" will be returned.
	 * @param {string} attrName - name of the agent attribute
	 * @returns {string} - value of the agent attribute
	 */
	Chat.prototype.getAgentAttributeValue = function(attrName) {
		/** @type {object} */
		var agentAttributes = this.cd.agtAttrs;
		if (typeof attrName == "string" || attrName.length != 0 || agentAttributes[attrName]) {
			return agentAttributes[attrName][0];
		} else {
			return "";
		}
	};

	Chat.validate = function(data){
		var inou = isNullOrUndefined;
		var cerr = "Chat.constructor Err: ";
		if(inou(data))
			throw (cerr+"chatData empty");
		if(!data.chatType)
			throw (cerr+"chat type missing");
		if(!data.xmlSpec)
			throw (cerr+"chat xml data missing");
		if(!data.ruleID)
			throw (cerr+"ruleID missing");
		if(!data.id)
			throw (cerr+"chatID missing");
		if(inou(data.pC))
			throw (cerr+"persistent chat boolean missing");
		if(inou(data.aMsgCnt) || data.aMsgCnt<0 || inou(data.cMsgCnt) || data.cMsgCnt<0){
			throw (cerr+"agt/cust msg cnt not properly initialized");
		}
		if(inou(data.ci)){
			throw (cerr+"ci data missing");
		}
//		TODO: see what the life cycle is like on the cI data structure.
//		if(isNullOrUndefined(data.cI))
//			throw cerr+"persistent v3 chat data missing";
	};

function FlashPeer(id, data){
	/*
	 * API: Closes the popup chat on behalf of the persistent chat
	 */
	function isV3C2CPersistent(){
		return !!v3C2cPersistent;
	}

	function closePopupChat(){
		CHM.inactivateChat() ;
	}

	function closePopupChatFromPersistent(){
		var opener = window.parent.opener;
		if (opener != null &&
			typeof opener.inqFrame != "undefined" &&
			typeof opener.inqFrame.Inq != "undefined" &&
			typeof opener.inqFrame.inqFrame.Inq.FlashPeer != "undefined" &&
			typeof opener.inqFrame.Inq.FlashPeer.closePopupChat != "undefined") {
				opener.inqFrame.Inq.FlashPeer.closePopupChat();
		} else {
			log("Could not close popup chat");
		}
	}

	function isAutoFixPrechatSurvey() {
		var autoFix	= getConstant("AUTO_FIX_PRECHAT_SURVAY", null);
		if (autoFix === undefined) autoFix = true; // default to true;
		return autoFix;
	}

    function setData( data ){
		FlashPeer.data = data;
	}

	/**
	 * Proxy call to EVM.fireCustomEvent.
	 * Introduced for MAINT23-155 Implement Support to Fire Custom Events from the Client Interface in BR3.0.
	 * Also used by PR-16 Send Baynote Event when recommendation link clicked.
	 * @see EVM.fireCustomEvent
	 */
    function fireCustomEvent(eventName, rule, evt, evtDataSupplementFcn) {
		if (typeof evtDataSupplementFcn === 'string' && evtDataSupplementFcn.indexOf('function(') == -1) {
			evtDataSupplementFcn = "function() { return " + evtDataSupplementFcn + "}";
		}
		EVM.fireCustomEvent(eventName, rule, evt, evtDataSupplementFcn);
    }

    /**
	 * Fires custom events with data instance and data object support. This is a more complete execution of the above method.
	 * @param eventName {String} The name of the custom event to be invoked.
	 * @param jsonData {String} Optional jsonized data string. Will be parsed into an object and passed to the EVM.
	 * @param dataFcn {String} Optional stringified function to be JSON parsed and executed by the event manager to produce event data.
	 */
	function fireCustomEvt(eventName, jsonData, dataFcn){
		var evt = null;
		if(typeof jsonData == "string"){
			evt = MixIns.JSON.parse(jsonData);
		}
		if (typeof dataFcn === 'string' && dataFcn.indexOf('function(') == -1) {
			dataFcn = "function() { return " + dataFcn + ";}";
		}
		EVM.fireCustomEvent(eventName, null, evt, dataFcn);
	}

	/**
	*API: Sets the memory based cookie (for XD)
	*used by Haxe code
	*HTML file postToServer.htm calls back to this routine.
	*/
	function set3rdPartyCookieFromQueue(){
	  var obj = CM ;
	  obj.set3rdPartyCookieFromQueue();
	}
	/**
	 * Method: closeChat()- Closes the chat and resets chat state in the chat manager.
	 * @param _doSoftKill true if we want to hide the chat from view of chat is desired.
	 * @see InqChatMgr.closeChat
	 * @see InqChatMgr.softKill
	 */
	function closeChat(_doSoftKill){
		Inq.log("closeChat("+_doSoftKill+")");
		if(_doSoftKill){
			CHM.softKill(this,null,"Flash closed");
		} else{
			CHM.closeChat(this,null,"Flash closed");
		}
	}

	/**
     * Set parameters (auxiliary to survey spec) that will be passed to survey manager on survey launch.
     * This method does not erase previously set parameters rather adds them.
     * Parameters are stored in lastChat object in Chat manager and persisted to inqVital thus available
     * even after chat is closed.
     * Note: Chat manager recreates lastChat object when new chat starts.
     * @param surveyParams object with parameters for survey.
     * @see ChatMgr.setSurveyParams
     */
	function setSurveyAuxParams(surveyParams){
		  CHM.setSurveyAuxParams(surveyParams);
	}

    /**
     * Returns survey parameters (auxiliary to survey spec).
     * @see ChatMgr.getSurveyParams
     */
	function getSurveyAuxParams(){
		  return CHM.getSurveyAuxParams();
	}

    /**
     * Sets clickstream sent flag.
     * Flag is stored in lastChat object in Chat manager and persisted to inqVital thus available
     * even after chat is closed.
     * @see ChatMgr.isClickStreamSent
     */
	function setClickStreamSent(isSent){
		  CHM.setClickStreamSent(isSent);
	}

    /**
     * Returns clickstream sent flag.
     * @see ChatMgr.isClickStreamSent
     */
	function isClickStreamSent(){
		  return CHM.isClickStreamSent();
	}

	function agentSurveyCall(specID){
		  SVYM.showSurvey(specID, "", CHM.getSurveyAuxParams());
	}



	/**
	 *	Position and size the text input SWF instance
	 *	This is for internationalization
	 *		This instance of the flash gets the text and sends it to the main popup
	 *		This instance MUST be wmode=window
	 */
	function showTextInput(bShow,y,x,w,h){
		CHM.showTextInput(bShow,y,x,w,h);
	}

	/**
	 *	Position and size the the persistent button
	 *	@param x left position in pixels
	 *	@param y top position in pixels
	 *	@param w width in pixels
	 *	@param h width in pixels
	 *	@deprecated
	 */
	function showPersistentButton(x,y,w,h){
	/*
		log("showPersistentButton()");
		CHM.showPersistentButton(x,y,w,h);
	*/
	}

    /**
     * Sets disconnect cookie to 1
     */
    function setDisconnectFlag(){
        CHM.setDisconnectFlag(1);
    }

	/** setPersistentButtonDebugActive
	 *	@param active Show the persistent window overlay with a green halo
	 */
	function setPersistentButtonDebugActive(active){
		log("setPersistentButtonDebugActive()");
		CHM.setPersistentButtonDebugActive(active);
	}

	/** hidePersistentButton
	 *	@param active Show the persistent window overlay with a green halo
	 */
	function hidePersistentButton(){
		log("hidePersistentButton()");
		CHM.hidePersistentButton();
	}

	/** showThankyou
	 *	Show the thankyou layer
	 */
	function showThankyou(){
		log("showThankyou()");
		try {
			CHM.closeChat(this,null,"Flash thankyou.");
			return true;
		}
		catch (e) {
			log(e);
		}
		return false ;
	}
	/*
	 * @TODO Ready the chat client to pass chat ID to close operation
	 */
	/**
	 *	hideFramesetChat
	 *	hide the chat
	 */
	function hideFramesetChat(){
		CHM.closeChat();
	}

    /**
     * postRequestToIframeProxy
     * Make a request via iframe-proxy
     *
     * @param {string} serverPath server path
     * @param {array} request request
     * @param {string} id the unique iframe ID
     * @param {Object} context context
     */
    function postRequestToIframeProxy(serverPath, request, id, context){
        LoadM.postRequestToIframeProxy(serverPath, request, id, context);
    }

    /**
     * updateFrameName
     * updates iframe-proxy name
     *
     * @param {string} id unique iframe ID to update
     * @param {string} key the key to fetch iframe from storage
     */
    function updateFrameName(id, key){
        LoadM.updateFrameName(id, key);
    }

    /** setChatBanished
	 *	@param none
	 */
	function setChatBanished(){
		/* TODO: setChatBanished is incomplete
		PM.addVar( new NVPair("banished", true) );*/
	}

	/**
	 *	setAgentConfig
	 *	@param _agentID text agentID (supplied by chat client)
	 *	@param cobrowseEnabled boolean cobrowseEnabled
	 *	@param eventDataStr (opional) text JSON with agent's first & last name
     *  @param buID Agent business Unit ID
     *  @param agID agent group ID
	 */
	function setAgentConfig(_agentID, cobrowseEnabled, eventDataStr, buID, agID){
		CHM.assignAgent(_agentID, false, cobrowseEnabled, eventDataStr, buID, agID);
	}

    /**
     * registerWDMClient add new client to WatchDogManager for health check
     * @param clientID          string for identification of client
     * @param checkInterval     check interval in msec
     * @param isAliveCallback   callback function for health check (@see WDMClient.hx for prototype)
     * @param resetStateCallback callback function for reset client if not alive (@see WDMClient.hx)
     * @return void
     */
    function registerWDMClient(clientID, checkInterval, isAliveCallback, resetStateCallback) {
        WDM.registerClient(clientID, checkInterval, isAliveCallback, resetStateCallback);
    }

    /**
     * unregisterWDMClient remove client from WatchDogManager
     * @param clientID          string for identification of client
     * @return void
     */
    function unregisterWDMClient(clientID) {
        WDM.unregisterClient(clientID);
    }
	/**
	 * Description: Provides data to the flash for passing on to the agent
	 * on chat launch.
	 */
	function getAgentData(){
		var params = MixIns.mixAbsorber({});
		try {
			if (typeof self.inqAgentData != "undefined"){
				params.absorb(self.inqAgentData);
			}
			if(!isNullOrUndefined(self.inqData)){
				if(self.inqData instanceof Array){
					//handle arrays through numerical iterator and convert to data
					for(var i = 0; i < self.inqData.length; i++){
						params["data"+i] = self.inqData[i];
					}
				}
				else if (self.inqData instanceof Object){
					params.absorb(self.inqData);
				}
			}
			params["markerHistory"]=LDM.getLandingHistory().join(", ");
			var launchPageId = CHM.getChatData().getChatData().launchPageId;
			params["launchPageMarker"] = LDM.getPageMarkerById(launchPageId);
		} catch (e){}
		return params;
	}

	/**
	 *	onEngaged
	 *	@param event
	 */
	function onEngaged(event) {
		Inq.CHM.fireChatEngaged(event);
		BRM.fireServiceEngagedEvent(event);
	}

	/**
	 *	Fire handler of skin loaded and chat shown
	 *	@param event
	 */
	function onChatShown(event) {
		CHM.fireChatShown(null);
	}

    /**
     * Fire event before chat window will be closed
     */
    function onBeforeChatClosed(){
        CHM.fireBeforeChatClosed();
    }

	/**
	 *	onInteracted
	 *	@param event
	 */
	function onInteracted(event) {
		BRM.fireServiceInteractedEvent(event);
	}

	/**
	 *	onCustomerMsg
	 *	@param event
	 */
	function onCustomerMsg(eventData) {
		CHM.fireCustomerMsgEvent(eventData);
	}

	/**
	 *	onAgentMsg
	 *	@param event
	 */
	function onAgentMsg() {
		CHM.fireAgentMsgEvent();
	}

	function onAssisted() {
		// exists only for backward compatibility with previous chat client
	}

	/** This calls  doPushToFrameset once the cookies have been committed.
	  * If non xd mode or no cookies on queue, perform doPushToFrameset
	  * If xd mode and cookies on the queue, perform doPushToFrameset upon cookie completion
	  *
	  * Jira Ticket: https://dev.inq.com/jira/browse/PR-101
	  * On IE8 the _sUrl and _sTarget becomes out of scope in the handler,
	  * So since we are dependent on these values, we embed them in the handler code:
	  * We:
	  *  1) Build a function calling the "doPushToFrameset function and embed the parameters in the function
	  *  2) Pass the dynamically created function to the cookie method "whenCookiesCommitted"
	  *  3) We make doPushToFrameset function visible
	  *
	  * @param _sUrl - the url to go to.
	  * @param _sTarget - the target window
	  * @param _fromClick - means that this request is coming from a mouse click and can avoid popup blockers
	  */
	function PushToFrameset(_sUrl, _sTarget, _fromClick) {
		/* If we expect to open a window, and the "fromClick" specifier is true
		 * Then check the target to see if it goes to a different window (_parent, _self, _top go to this window)
		 * Then check to see if the cookie setting queue is empty, if not pre-popout the window as blank
		 *   When the cookies are committed, they will propagate this window with correct url
		 */
		if (_fromClick && (_sTarget != "_self") && (_sTarget != "_top") && (_sTarget != "_parent")){	/* is this a different window or tab? */
			if (!(CM).isThirdPartyCookieQueueEmpty()) { /* Are we waiting for cookies */
				var winTarget = null ;
				var tools = "left=0,top=0,toolbar=1,location=1,menubar=1,status=1,scrollbars=1";
				winTarget = window.parent.top.open("about:blank", _sTarget, tools);
				if (null == winTarget) {
					winTarget = window.parent.top.open("about:blank", _sTarget);
				}
			}
		}


		CM.whenCookiesCommitted (new Function("inqFrame.Inq.FlashPeer.doPushToFrameset(" + toJsString(_sUrl,'"') + "," + toJsString(_sTarget,'"') + ");"));
	}

	/** This is the original PushToFrameset
	  * It does not wait for cookies to be set.
	  * Please see new PushToFrameset above.
	  *
	  * @param _sUrl - the url to go to.
	  & @param _sTarget - the target window
	  */
	function doPushToFrameset(_sUrl, _sTarget){
		try {
			if ("_inqPersistentChat" == top.name){
				if ("_self" == _sTarget){
					 getOpener().top.document.location.href = _sUrl;
				}else{
					var winTarget = null ;
					var tools = "left=0,top=0,toolbar=1,location=1,menubar=1,status=1,scrollbars=1";
					winTarget = window.parent.top.open(_sUrl, _sTarget, tools);
					if (null == winTarget) {
						winTarget = window.parent.top.open(_sUrl, _sTarget);
					}
				}
			}else{
				if ("_self" == _sTarget){
					window.parent.top.document.location.href = _sUrl;
				}else{
					var winTarget = null ;
					winTarget = window.parent.top.open(_sUrl, _sTarget, "top=0;left=0");
					if (null == winTarget) {
						winTarget = window.parent.top.open(_sUrl, _sTarget);
					}
				}
			}
		}catch (e) {}
	}

	/*
	 * Description: Determines if the loading browser has flash installed
	 *   or not.
	 */
	function browserHasFlash(){
		var flash_version;
		if(navigator.plugins && typeof navigator.plugins["Shockwave Flash"] == "object"){
			var desc = navigator.plugins["Shockwave Flash"].description;
			if(desc){
				var versionStr = desc.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				var major = parseInt(versionStr.replace(/^(.*)\..*$/, "$1"));
				var build = parseInt(versionStr.replace(/^.*r(.*)$/, "$1"));
				flash_version = parseFloat(major + "." + build);
			}
		}else if(window.ActiveXObject){
			try{
				var flashObj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				var desc = flashObj.GetVariable("$version");
				if(desc){
					var versionArr = desc.replace(/^\S+\s+(.*)$/, "$1").split(",");
					var major = parseInt(versionArr[0]);
					var build = parseInt(versionArr[2]);
					flash_version = parseFloat(major + "." + build);
				}
			}catch(e){}
		}

		if(typeof flash_version != "undefined"){
			return (flash_version >= Inq.requiredFlashVersion);
		}

		return false;
	}

	function ForceFocus(){
		try {
			/* following code is to create an object of type flash in order to allow activation of flash */
			try{
				document.createElement("object").setAttribute("type", "application/x-shockwave-flash");
			}catch(er){}
			var clnt = self.document.getElementById("client");
			var nclnt = self.document.getElementById("notclient");
			if (clnt){
				self.focus();
				clnt.focus();
				if (nclnt) {
					nclnt.focus();
				}
			}
		}catch(e){}
	}

	function requestTranscript( _emailAddress, customerName ) {
		var url = urls.vanityURL + "/tagserver/transcriptrequest/logTranscriptRequest";
        var _chatID = CHM.getChatID();
        var _emailSpecID = CHM.getEmailSpecId();
		var _customerName = ( customerName ? customerName : CHM.getCustomerName() );
		var _siteID = Inq.getSiteID();
		var map = {chatID:_chatID, emailAddress: _emailAddress, emailSpecID: _emailSpecID, customerName: _customerName, siteID: _siteID};
		fireCustomEvent("ChatTranscriptEmailedToCustomer",CHM.getChatData().rule, map);
		ROM.send( url, map );
	}

	function captureEmailAddress( _emailAddress ) {
        var map = {custID:Inq.getCustID(), chatID: CHM.getChatID(), emailAddress:_emailAddress};
		ROM.send(urls.vanityURL + "/tagserver/emailrequest/logEmailAddressCapture", map);
	}

	function startLaunches(isActive){
		if (!isActive) {
			Inq.CHM.continueChatting() ;
		}
	}

	/*
	 * setDragable
	 *  Description: Enables the dragging of the popup chat
	 */
	function setDragable(){
		if (Inq.CHM.chat != null)
			Inq.CHM.chat.setDragable() ;
	}

	/*
	 * setResizable
	 *  Description: Enables the resizability of the popup chat
	 */
	function setResizable(){
		if (Inq.CHM.chat != null)
			Inq.CHM.chat.setResizable() ;
	}

	/*
	 * setV3Data
	 *  Description: sets persistent (session) client data for V3 chat
	 *  @param dictionary object containing data to be set.
	 */
	function setV3Data(dictionary) {
		Inq.CHM.setChatInterfaceData(dictionary) ;
	}

	/*
	 * getV3Data
	 *  Description: retrieves persistent (session) client data for V3 chat client
	 *  @returns  object containing data to be set.
	 */
	function getV3Data() {
		return CHM.getChatInterfaceData() ;
	}

	/*
	 * popOutChat
	 *  Description: starts the pop-out (persistent) chat client
	 *  @returns  true/false on success
	 */
	function popOutChat(b, resizable) {
		return  Inq.CHM.popOutChat(b, resizable) ;
	}

	/*
	 * getBaseURL
	 *  Retrieves the base URL for the tagserver using the vanity name
	 *  Example: "clientsname.inq.com/tagserver",
	 *  @param none
	 *  @returns  String containing the base URL for the tagserver using the vanity name
	 */
	function getBaseURL() {
		return  window.Inq.urls.baseURL ;
	}

	/*
	 * getMediaBaseURL
	 *  Retrieves the base URL for the media server
	 *  Example: "media.inq.com/media",
	 *  @param none
	 *  @returns  String containing the base URL for the media server
	 */
	function getMediaBaseURL() {
		return  window.Inq.urls.mediaBaseURL ;
	}

	/**
	 *  Retrieves the xforms vanity domain
	 *  Example: "xformsv3.inq.com",
	 *  @returns  String containing the xforms vanity domain.
	 */
	function getXFormsDomain() {
		return  window.Inq.urls.xFormsDomain;
	}

    /**
     * getVanityUrl
     *  Retrieves the vanity URL
     *  Example: "http://tagserverv3.inq.com",
     *  @param none
     *  @returns  String containing the vanity URL
     */
    function getVanityUrl() {
        return window.Inq.urls.vanityURL;
    }

    /**
     * getChatRouterVanityUrl
     *  Retrieves the chat router vanity domain
     *  Example: "http://chatrouterv3.inq.com",
     *  @param none
     *  @returns  String containing the chat router vanity domain
     */
    function getChatRouterVanityUrl() {
        return window.Inq.urls.chatRouterVanityDomain;
    }

    /*
      * getTitleBarHeight
      *  Retrieves the height of the dragable area for V3 chat
      *  @returns  number specifiing the height of the draggable area
      */
	function getTitleBarHeight() {
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.tbh;
		} catch(e){}
		return 50 ;
	}


	/*
	 * getPopupCloserWidth
	 *  Retrieves the distance from right-hand portion of the draggable area
	 *  		 and the right-hand portion of the client area.
	 *  This is used to make room for the closer button and other buttons as well.
	 *  @returns  a number specifiing the distance between the right edge of the client skin and the right edge of the dragging area.
	 */
	function getPopupCloserWidth() {
	//	Inq.CHM.chat.chatSpec.chatTheme
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.ciw;
		} catch(e){}
		return 50 ;
	}

	/**
	 * getLocalizedMessage
	 * Returns localized text message by key.
	 */
	function getLocalizedMessage(key) {
		return Inq.getLocalizedMessage(key);
	}

	/**
	 *
	 * getSkinLocation
	 *  Retrieves the position specifier for where to position the client skin
	 *	@returns string specifiing the initial position of the skin
	 *	Posible values are:
	 *   "UPPER CENTER"  "UPPER_CENTER"  "TOP_CENTER"
	 *   "UPPER_RIGHT", "TOP_RIGHT"
	 *   "UPPER_LEFT", "TOP_LEFT"
	 *   "CENTER_LEFT"
	 *   "CENTER_RIGHT"
	 *   "LOWER_LEFT", "BOTTOM_LEFT"
	 *   "LOWER_CENTER", "BOTTOM_CENTER"
	 *   "LOWER_RIGHT", "BOTTOM_RIGHT"
	 *   "POP_UNDER_CENTER"
	 *   "ABSOLUTE"
	 *   "RELATIVE"
	 *   "CENTER"
	 *
	 */
	function getSkinLocation() { //chatData.chat.flash.location
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.pos;
		} catch(e){}
		return "UPPER_LEFT";
	}

	/*
	 * getSkinHeight
	 *  Retrieves the height of the skin below the dragable area
	 *  @returns  number specifiing the height of the skin below the dragable area
	 */
	function getSkinHeight() {
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.dh;
		} catch(e){}
		return 300 ;
	}

	/*
	 * getSkinHeight
	 *  Retrieves the width of the skin
	 *  @returns  number specifiing the width of the skin
	 */
	function getSkinWidth() {
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.dw;
		} catch(e){}
		return 400 ;
	}

	/*
	 * getSkinLeft
	 *  Retrieves the distance from the left edge of for chat skin
	 *  @returns  number specifiing the distance from the left edge of for chat skin
	 */
	function getSkinLeft() {
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.lx;
		} catch(e){}
		return 0 ;
	}

	/*
	 * getSkinTop
	 *  Retrieves the distance from the top edge of for chat skin
	 *  @returns  number specifiing the distance from the top edge of for chat skin
	 */
	function getSkinTop() {
		try {
			return Inq.CHM.chat.chatSpec.chatTheme.ly;
		} catch(e){}
		return 0 ;
	}

	/*
	 * getFlashVars
	 *  Retrieves the flash variables (as we used in v2)
	 *  @returns  the flash variables
	 */
	function getFlashVars() {
		try {
			return Inq.CHM.chat.getFlashVars();
		} catch(e) {
            log("Error obtaining flashvars from Chat object: " + e);
        }
		return "" ;
	}

	/*
	 * getSkin
	 *  Retrieves the URL for the skin mxml file
	 *  @returns  URL for the skin mxml file
	 */
	function getSkin() {
		try {
			return Inq.CHM.chat.getSkin() ;
		} catch(e){}
		return "TouchCommerce.mxml" ;
	}

	function getImagePath() {
		return Inq.CHM.chat.getImagePath();
	}

	function setSessionParam(key, val) { // try { Inq.SaveMgr.setSessionParam("persistentChat", "true"); } catch (e:Error) { }
	//	untyped window.Inq.FlashPeer.setSessionParam(key,val) ;
	}

	function closePersistent() { // Inq.ChatMgr.closePersistent();
		window.Inq.CHM.closePersistent() ;
	}

	function isThankYouEnabled(){ // var tY:Bool = untyped Inq.ChatMgr.isThankYouEnabled() ;
		return window.Inq.CHM.thankYouEnabled ;
	}

	function blockService(blockDetails) {
		var serviceType = "ALL"; // by default block all types of service
		var period = -1; // by default block forever; ToDo: declare constants for block periods
		if(!isNullOrUndefined(blockDetails)) {

			// ToDo: subject for review: for some reason URL part of chat.pushpage command comes
			// wrapped in parenthesis. Unwrapping here if parenthesis present.
			if ((blockDetails.charAt(0) == '(') && (blockDetails.charAt(blockDetails.length-1) == ')')) {
				blockDetails = blockDetails.substr(1, blockDetails.length - 2);
			}

			var blockParams = MixIns.JSON.parse(blockDetails);
			serviceType = blockParams.serviceType;
			period = blockParams.period;
		}
		window.Inq.blockService(serviceType, period);
	}

    function wasSaleAction() {
        return window.Inq.wasSaleAction();
    }

	/**
	 * Set the visibility of Application.
	 * @param visible Boolean indicating whether the Application should be visible.
	 */
	function setVisible(visible) {
		try {
			var app = window["Application"];
			if (app && app.application && app.application.setVisible) {
				app.application.setVisible(visible);
			}
		}
		catch (e) {
			log(e);
		}
	}


    /**
     * Send chat.automaton_response msg
     * @param eventName event name
     * @param data parameters from chat.automaton_request msg
     */
    function sendDTEvent(eventName, data) {
        try {
            var app = window["Application"] ;
            if (app && app.application && app.application.sendDTEvent) {
                // call HAX to send msg
                app.application.sendDTEvent(eventName, data);
            }
        }
        catch (e) {
            log(e);
        }
    }

	function _executeCustomCommand(params) {
		executeCustomCommand(params);
	}

	function whenPersistent (isPersistent,protoDomain, transferURL, needNewOpener) {
		var inst = ChatMgr.getInstance();
		inst.whenPersistent(isPersistent,protoDomain, transferURL, needNewOpener);
	}

	function registerPersistentWindow(){
		try {
			var opener = window.parent.opener.inqFrame;
			opener.Inq.CHM.persisentWindow = window.parent;
			return true;
		} catch(e){}
		return false;
	}

	function isPersistentChat(){
		return CHM.isPersistentChat();
	}

	function isPersistentWindow(){
		return CHM.isPersistentWindow();
	}

	function setPersistentWindowActive(state){
		var inst = ChatMgr.getInstance();
		inst.setPersistentWindowActive(state);
	}

	function CloseChatFromPersistent() {
		log("@@@CloseChatFromPersistent");
		window.inqFrame.Inq.CHM.CloseChatFromPersistent();
	}
	
	/**
	 * bind - safe binding of the method and object.
	 *		This saves the the object and the handler in a anonymous object (json)
	 *		The json has a function that recombinds the object and method by the
	 *		use of the browsers "apply" method.
	 * @param handler - the method that is to be made safe via a closure
	 */
	function bind(handler) {
		var handlerContext = {obj: this, method: handler, safeFunc: function(){
			var closure = arguments.callee.closure;
			return closure.method.apply(closure.obj, arguments);
			}};
		handlerContext.safeFunc.closure = handlerContext
		return handlerContext.safeFunc;
	}

    /**
     * Get Cobrowse module.
     * @return cobrowse module
     */
    function getCBC() {
        var cbc = null;
        if (CHM.isPersistentWindow()) {
            // Get CBC module of main window if the main window is accessible (not reloaded in current moment)
            // otherwise CBC module of persistent window is used (e.g. for cobrowse acceptation). See RTDEV-2059
            var opener = window.parent.opener;
	        try {
		        if (opener) {
			        if ((opener.inqFrame) && (opener.inqFrame.Inq) && (opener.inqFrame.Inq["CBC"])) {
				        cbc = opener.inqFrame.Inq["CBC"];
			        } else {
				        logInfo("opener.inqFrame.Inq['CBC'] is not accessible");
			        }
		        } else {
			        logInfo("No window opener");
		        }
	        } catch (error) {
		        // opener is not null but when you access SECURITY exception can occur.
	        }
        }
        // it's used for div mode or when the main window is reloading (no access to CBC module of the main window)
        if (!cbc) {
            if (window.Inq) {
                if (window.Inq["CBC"]) {
                    cbc = window.Inq["CBC"];
                } else {
                    throw new Error("CBC module is not defined");
                }
            } else {
	            // TODO on persistent window window.Inq[CBC] is not set. fix it.
	            if (window.inqFrame && window.inqFrame.Inq && window.inqFrame.Inq.CBC){
		            cbc = window.inqFrame.Inq.CBC;
	            } else {
		            throw new Error("Inq object is not defined");
	            }
            }
        }
        return cbc;
    }

	/**
	 * 	Call CI mothod to send message to CoBrowse server and accepts new CoBrowse session
	 */
	function acceptCobrowseInvitation(startPerformanceTest) {
        inqFrame.com.inq.flash.client.chatskins.CoBrowseMgr.acceptCobInv();
	}

    /**
     * acceptCobrowseInvitationSafe - performs the following:
     * 	 -  gets the CBC and performs the accept
     * @param startPerformanceTest flag to start performance test is true
     */
    function acceptCobrowseInvitationSafe(startPerformanceTest){
        try {
            getCBC().accept(startPerformanceTest);
        } catch (e) {
            logError("CBC ERROR: ", e);
        }
    }

	/**
	 * 	acceptCobrowseInvitation - performs the following:
	 * 	 -  gets the CBC and performs the acceptShare
	 */
	function acceptCobrowseShareControl(startPerformanceTest) {
		try {
			getCBC().acceptShare(startPerformanceTest);
		} catch (e) {
			logError("CBC ERROR: ", e);
		}
	}

	function endCobrowseSession(){
		try {
			getCBC().stopQuiet();
		} catch (e) {
            logError("CBC ERROR: ", e);
		}
	}

    // reserverved for future
	function acceptCobAndShare(startPerformanceTest){
		try {
			getCBC().accept(startPerformanceTest);
		} catch (e) {
            logError("CBC ERROR: ", e);
		}
	}

	function isCobrowseEngaged(){
		try {
			if (site.enableCobrowse) {
				return getCBC().isCobrowseEngaged();
			}
		} catch (e) {
            logError("CBC ERROR: ", e);
		}
		return false;
	}

	function isSharedControl(){
		try {
			if (site.enableCobrowse) {
				return getCBC().isSharedControl();
			}
		} catch (e) {
            logError("CBC ERROR: ", e);
		}
		return false;
	}

    /**
     * Log message in tagserver log.
     * @param message logged message
     * @private
     */
    function logInfo(message) {
        ROM.send(urls.loggingURL, {level:'INFO', line: message + " [chatID=" + CHM.getChatID() + "]"});
    }

    /**
     * Log run-time error in tagserver log.
     * Remark: error details are save in tagserver log, but don't show to the user in the console.
     * @param messagePrefix prefix of logged message
     * @param e run-time error
     * @private
     */
    function logError(messagePrefix, e) {
        log(messagePrefix + e.message);

        var errorDetails = "";
        if (logError.caller != null) {
            errorDetails += "  at " + logError.caller.toString().split("{")[0];
        }
        if (e.stack != null) {
            errorDetails += "  Stack: " + e.stack;
        }
        ROM.send(urls.loggingURL, {level:'ERROR', line: messagePrefix + e.message + " [chatID=" + CHM.getChatID() +
            ", siteID=" + Inq.getSiteID() + "] " + errorDetails});
    }

    /** sendText
	 * @param - none
	 * Please see RTDEV-5404
	 */
	function sendText() {
		this.ciSendText(null);
	}
	
	/** ciSendText
	 * @param - none
	 * This gets overriden in the CI via com.inq.flash.client.control.FlashPeer.setCiFunction
	 * Please see RTDEV-5404
	 */
	function ciSendText() {
		throw("sendText is not defined");
	}

	function ciAcceptCobInv(){
		throw("ciAcceptCobInv is not defined");
	}

	function ciActionBtnCloseChat(){
		throw("ciActionBtnCloseChat is not defined");
	}

	function ciActionBtnCloseThankyou(){
		throw("ciActionBtnCloseThankyou is not defined");
	}

	function ciDeclineCobInv(){
        throw("ciDeclineCobInv is not defined");
    }

    function ciAcceptCobShareInv(){
        throw("ciAcceptCobShareInv is not defined");
    }

    function ciDeclineCobShareInv(){
        throw("ciDeclineCobShareInv is not defined");
    }

    function ciAcceptCobAndShareInv(){
        throw("ciAcceptCobAndShareInv is not defined");
    }

    function ciAcceptVideoInv(){
        throw("ciAcceptVideoInv is not defined");
    }

    function ciDeclineVideoInv(){
        throw("ciDeclineVideoInv is not defined");
    }

    function ciStopVideo(){
        throw("ciStopVideo is not defined");
    }

    function setCiFunction(fName, fBody) {
		if ( /^ci/.test(fName) ) {
			this[fName] = fBody;
		} else {
			throw("Error: CI framework function name must start with ci");
		}    
	}

    /**
     * ciHideLayer
     *
     * Hides the specified layer.
     * Please make sure that window.inqFrame.com.inq.flash.client.control.XFrameWorker.hideLayer is
     * published in XFrameWorker.js class in CI.
     * @param {String} layerID - the layer to hide.
     */
    function ciHideLayer(layerID) {
        log('ciHideLayer: ' + layerID);
        try {
            var hideLayer = window.inqFrame.com.inq.flash.client.control.XFrameWorker.hideLayer;
            if (!isNullOrUndefined(hideLayer)) {
                hideLayer(layerID);
            }
        } catch (e) {
            log('ciHideLayer: hideLayer function was not published in CI: ' + e.message);
        }
    }

    /**
     * ciShowLayer
     *
     * Shows the specified layer.
     * Please make sure that window.inqFrame.com.inq.flash.client.control.XFrameWorker.showLayer is
     * published in XFrameWorker.js class in CI.
     * @param {String} layerID the layer to show.
     * @return {void}
     */
    function ciShowLayer(layerID) {
        log('ciShowLayer: ' + layerID);
        try {
            var showLayer = window.inqFrame.com.inq.flash.client.control.XFrameWorker.showLayer;
            if (!isNullOrUndefined(showLayer)) {
                showLayer(layerID);
            }
        } catch (e) {
            log('ciShowLayer: showLayer function was not published in CI: ' + e.message);
        }
    }

    /**
     * ciGrowLayer
     *
     * Expands the specified layer.
     * Please make sure that window.inqFrame.com.inq.flash.client.control.XFrameWorker.grow is
     * published in XFrameWorker.js class in CI.
     * @param {String} layerID the layer to expand.
     * @return {void}
     */
    function ciGrowLayer(layerID) {
        log('ciGrowLayer: ' + layerID);
        try {
            var growLayer = window.inqFrame.com.inq.flash.client.control.XFrameWorker.grow;
            if (!isNullOrUndefined(growLayer)) {
                growLayer(layerID);
            }
        } catch (e) {
            log('ciGrowLayer: grow function was not published in CI: ' + e.message);
        }
    }

    /**
     * ciShrinkLayer
     *
     * Collapses the specified layer.
     * Please make sure that window.inqFrame.com.inq.flash.client.control.XFrameWorker.shrink is
     * published in XFrameWorker.js class in CI.
     * @param {String} layerID - the layer to collapse.
     * @return {void}
     */
    function ciShrinkLayer(layerID) {
        log('ciShrinkLayer: ' + layerID);
        try {
            var shrinkLayer = window.inqFrame.com.inq.flash.client.control.XFrameWorker.shrink;
            if (!isNullOrUndefined(shrinkLayer)) {
                shrinkLayer(layerID);
            }
        } catch (e) {
            log('ciShrinkLayer: shrink function was not published in CI: ' + e.message);
        }
    }

    /**
     * ciMinimize
     *
     * Minimizes the Chat Interface.
     * Please make sure that window.inqFrame.com.inq.flash.client.control.MinimizeManager.actionMinimize is
     * published in XFrameWorker.js class in CI.
     * @return {void}
     */
    function ciMinimize() {
        log('ciMinimize');
        try {
            var minimize = window.inqFrame.com.inq.flash.client.control.MinimizeManager.actionMinimize;
            if (!isNullOrUndefined(minimize)) {
                minimize();
            }
        } catch (e) {
            log('ciMinimize: actionMinimize function was not published in CI: ' + e.message);
        }
    }

    /**
     * ciRestore
     *
     * Restores the Chat Interface.
     * Please make sure that window.inqFrame.com.inq.flash.client.control.MinimizeManager.actionRestore is
     * published in XFrameWorker.js class in CI.
     * @return {void}
     */
    function ciRestore() {
        log('ciRestore');
        try {
            var restore = window.inqFrame.com.inq.flash.client.control.MinimizeManager.actionRestore;
            if (!isNullOrUndefined(restore)) {
                restore();
            }
        } catch (e) {
            log('ciRestore: actionRestore function was not published in CI: ' + e.message);
        }
    }

	function isLoggingDisabled(){
		return JSLoggingDisabled;
	}


    function setCobrowseBannerText(bannerText){
		try {
			var cbc = getCBC();
			if (!!cbc) {
				return cbc.setCobrowseBannerText(bannerText);
			}
		} catch (e) {
			log("CBC ERROR:" + e.message);
		}
		return true;
    }

	/**
	 * Creates new IFrame for XForm
	 * @param div container div where iframe is created
	 * @param url URL where div will be submitted later
	 * @param channelID channel Id if update is required
	 * @param scrolling optional, controlling scrolbars for IFrame, default value is "no"
	 * @return newly created iframe
	 */
	function createXFrame(div, url, businessUnitID, scrolling, data, initiator, location){
		var ldr = new XFormsLoader();
		return ldr.createXFrame(div, url, businessUnitID, scrolling, data, null, initiator, location);
        }

        function getClientPageURL() {
            return win.location.href;
        }

	/**
	 * Sets source of XFrame in CI if CI and XFrame are active, otherwise does nothing.
	 * @param layerID id of div to update
	 * @param url new source for layer
	 * @param businessUnitID optional business unit id parameter
	 */
	function updateXFrameFromBizRule(layerID, url, businessUnitID) {
		try {
			var app = window["Application"] ;
			if (app && app.application && app.application.updateXFrameFromBizRule) {
				app.application.updateXFrameFromBizRule(layerID, url, businessUnitID);
            } else {
                log("ERROR: update-xframe failed for layer [" + layerID + "]: app.application is not initialized");
			}
		}
		catch (e) {
			log(e);
		}
	}


	/**
	 * Set source of XFrame and set visible
	 */
	function showAutomaton(layerId, url, businessUnitId, initiator) {
		try {
			var app = window["Application"] ;
			if (app && app.application && app.application.showAutomaton) {
				app.application.showAutomaton(layerId, url, businessUnitId, initiator);//TODO use new parameters
            } else {
                log("ERROR: showAutomaton failed for layer [" + layerId + "]: app.application is not initialized");
			}
		} catch (e) {
			log(e);
		}
	}

	/**
	 * Returns opener's persistent chat window initialization flag.
	 * @return true is a persistent window is initialization for the first time.
	 */
	function isInitializationRequired() {
		var o = getOpener();
		if(o && o.Inq.isPersistentInitialization) {
			return o.Inq.isPersistentInitialization;
		}
		return false;
    }

    /**
     * Once persistent chat window initialization, the flag should be set to false.
     */
    function resetInitializationFlag() {
		var o = getOpener();
		if(o && o.Inq.isPersistentInitialization) {
			o.Inq.isPersistentInitialization = false;
		}
    }

    var URL_REGEXP_IS_FORM = /(^.*)(forms(v3)?\.inq\.com)/;

	/**
	 * Parse XFrame url into js object {url:...;, params:{...}}
	 * XFrame should contain relative url, without protocol and domain f.e. source="/orbeon/inq/view?dtid=14"
	 * @param url url to parse
	 */
	function parseXFrameUrl(url) {
		var pattern = new RegExp(URL_REGEXP_IS_FORM);
		// Replace if exists hardcoded xforms domain in mxml (mx:XFrame) with
		// xform vanity domain from DB, OR concat relative url with vanity domain,
        // otherwise don't change URL
        if (url.search(URL_REGEXP_IS_FORM) >=0) {
            url = url.replace(URL_REGEXP_IS_FORM, getXFormsDomain());
        } else if (url.charAt(0) == '/' && url.charAt(1) != '/') {
            url = getXFormsDomain() + url
        }
		var res = url.split('?');
		var params = {};
		if (res[1] != null) {
			var oldParams = res[1].split('&');
			for (var i=0; i< oldParams.length; i++) {
				var nameValue = oldParams[i].split('=');
				params[nameValue[0]] = nameValue[1];
			}
		}
		return {url: res[0], params: params};
	}

    function getPageID() {
        return Inq.LDM.getPageID();
    }

	/**
	 * Identifies this as a portal implementation of Client Interface
	 * @param none
	 * @return true/false if portal implementation
	 */
	function isPortal() {
		return true;
	}

    /**
	 * delegate that gets the Business Unit ID that replaces the channel id
	 * @param none
	 * @return string containing the BusinessUnitID
	 */
	function getBusinessUnitID() {
		return (CHM.getChat()) ? CHM.getChat().getBusinessUnitID() : getDefaultBusinessUnitID() ;
	}

	/**
	 * delegate that gets the customer id
	 * @param none
	 * @return string containing the customer id
	 */
	function getCustID(){
		return Inq.getCustID();
	}

	/**
	 * delegate that gets the session id
	 * @param none
	 * @return string containing the session id
	 */
	function getSesID(){
		return getSessionID();
	}

	/**
	 * delegate that gets the assignment id
	 * @param none
	 * @return string containing the assignment id
	 */
	function getIncAsID(){
		return getIncAssignmentID();
	}

	/**
	 * delegate that gets the page marker id
	 * @param none
	 * @return string containing the page marker id
	 */
	function getPageMarker(){
		return LDM.getPageMarker();
	}

	/**
	 * delegate that gets the automaton data map
	 * @param none
	 * @return automaton data map
	 */
	function getAutomatonDataMap(){
		var automatonDataMap = PM.getVar("automatonDataMap");
		return ((automatonDataMap) ? automatonDataMap.getValue() : "");
	}

	/**
	 * Get the persistent customer id (external, non-Touch Commerce customerID)
	 * @return {string} persistent customer id that set by BR 'set-persistent-customer-id'
	 */
	function getPersistentCustomerID(){
        return objectAsLogString(getPersistCustID(), true);
	}

	/**
	 * delegate that gets the business rule id
	 * @param none
	 * @return business rule id
	 */
	function getBrID(){
		return CHM.getChat().getRule().getID();
	}

	/**
	 * delegate that gets the business rule name
	 * @param none
	 * @return business rule name
	 */
	function getBrName(){
		return CHM.getChat().getRule().getName();
	}

	/**
	 * delegate that gets the agent id
	 * @param none
	 * @return agent id
	 */
	function getAgentID(){
		return CHM.getAgentID();
	}

    /**
     * This calls supplied function once the cookies have been committed.
     * @param handler {String|Function} function to be executed
     */
    function onCookiesCommitted(handler) {
        var closure = (typeof handler == "string") ? new Function(handler) : handler;
        CM.whenCookiesCommitted(closure);
    }

    /**
     * This calls supplied function once the cookies have been committed.
     * @param handler {String|Function} function to be executed
     */
    function when3rdPartyCookieCommitted( vcnt ) {
        CM.when3rdPartyCookieCommitted( vcnt );
    }

    /**
     * Returns deviceType based on the Inq.getDeviceType() private function.
     *
     */
    function _getDeviceType() {
        var deviceType = "Other";
        try {
            deviceType = getDeviceType();
        } catch (e) {
            log("Error in getDeviceType: " + e);
        }
        return deviceType;
    }

    /**
     * Close persistent window if it open. This function calls when user click to close button
     * before persisnt chat load.
     */
    function closePersistentWindowIfOpen() {
        if(!isNullOrUndefined(CHM.earlyPopout)) {
    		CHM.earlyPopout.close();
    	}
    	if(!isNullOrUndefined(CHM.popoutWindow)) {
    		CHM.popoutWindow.close();
    	}
    }

    function getBuRuleAgentGroupID(brID) {
        return BRM.getRuleById(brID).getAgentGroupID();
    }

	/**
	 * startChatInterface - starts the CI
	 * if the application has not been loaded before, 
	 * then: set launchWhenReady=true and let the loading js start it up
	 * else: it is a restart, ask main to start it up.
	 */
	function startChatInterface() {		
		window.launchWhenReady=true;		
	}
	
	
	/**
	 * closeChatInterface
	 * Please make sure that Application.application.close is published in CI
	 *
	 */	
	function closeChatInterface() {
		var app = window["Application"] ;
		if (app&&app.application&&app.application.close) {
			try {app.application.close();}
			catch (e){
				Inq.log("Could not close ChatInterface: " + e) ;
			}
		}		
	}

	/**
	 * getBrowserTypeAndVersion
	 *
	 *  returns result of getBrowserTypeAndVersion() utility function
	 *  @see getClientBrowserVersion()
	 *  @return String Array of 0. browser name, 1. browser version
	 */
	function _getBrowserTypeAndVersion() {
		return getBrowserTypeAndVersion();
	}

	/**
	 * _getBrowserMajorVer
	 *
	 * This is interface to invoke utility function "getBrowserMajorVer()" from CI
	 * @see getBrowserMajorVer()
	 * @param {boolean} compatibility - flag for determine version in compatibility mode
	 * @return {number} browser major version or 0 if unable to detect
	 */
	function _getBrowserMajorVer(compatibility) {
		return getBrowserMajorVer(compatibility);
	}

	/**
	 * Run function from Application.js to restart timer to close not started chat with parameters from previously timer parameters
	 */
	function restartTimer() {
		var app = window["Application"];
		var errMessage = "Could not restart timer to close not started chat: ";
		if (app && app.application && app.application.restartTimer) {
			try {
				app.application.restartTimer();
			}
			catch (e){
				Inq.log(errMessage + e);
			}
		} else {
			Inq.log(errMessage + "app.application.restartTimer is not initialized");
		}
	}

	/**
	 * ciActionBtnCloseChat
	 * proxy function to the com.inq.flash.client.chatskins.SkinControl.actionBtnCloseChat
	 * To call; inqFrame.Inq.FlashPeer.ciActionBtnCloseChat()
	 *
	 * Note:
	 * com.inq.flash.client.chatskins.SkinControl.actionBtnCloseChat is set to ciActionBtnCloseChat
	 *            in com.inq.flash.client.chatskins.SkinControl._init 
	 */	
    function ciActionBtnCloseChat(){
        throw("ciActionBtnCloseChat is not defined");
    }

	function fileTransferSize() {
		return fileUploadSize;
	}

	function fileTransferServerUrl(){
		return "";
	}

	/**
	 * Turns on the beacon flag on postToServer iframe in the corresponding domain.
	 * It is needed to be able to send beacon to the server when corresponding window will be unloaded.
	 *
	 * @see Chat#setCABeacon
	 *
	 * @param {string} action - the action for setting the state of the beacon
	 * @param {object} data - interface for additional data (optionally)
	 */
	function setCABeacon(action, data) {
		CHM.setCABeacon(action, data);
	}

	function closeChatMonitor() {
		CHM.closeChatMonitor();
	}

	/**
	 * Returns the Queue Messaging Spec for the opened chat or null.
	 * @returns {?Object}
	 */
	function getQueueMessagingSpec() {
		/** @type {string} */
		var QUEUE_MESSAGING_SPECS = "queueMessagingSpecs";
		/** @type {?number} */
		var qmspec = CHM.getQueueMessagingSpecId();
		if (!isNullOrUndefined(site[QUEUE_MESSAGING_SPECS]) && !isNullOrUndefined(qmspec)) {
			return site[QUEUE_MESSAGING_SPECS][qmspec];
		} else {
			return null;
		}
	}

	return {
		startChatInterface:startChatInterface,
		closeChatInterface:closeChatInterface,
		getBrID: getBrID,
		getBrName: getBrName,
		getAutomatonDataMap: getAutomatonDataMap,
		getPageMarker: getPageMarker,
		getIncAssignmentID: getIncAsID,
		getSessionID: getSesID,
		getCustID: getCustID,
		getAgentID: getAgentID,
		isPortal:isPortal,
        setCobBan: setCobrowseBannerText,
		acceptCobAndShare : acceptCobAndShare,
		isCobEngaged : isCobrowseEngaged,
		isCobShared : isSharedControl,
		isAutoFixPrechatSurvey:isAutoFixPrechatSurvey,
		acceptCob : acceptCobrowseInvitation,
        acceptCobSafe : acceptCobrowseInvitationSafe,
		acceptCobShare : acceptCobrowseShareControl,
		endCob : endCobrowseSession,
        registerWDMClient: registerWDMClient,
        unregisterWDMClient: unregisterWDMClient,
		isV3C2CPersistent: isV3C2CPersistent,
		closePopupChat : closePopupChat,
		setData : setData,
		closeChat : closeChat,
		showTextInput : showTextInput,
		showPersistentButton : showPersistentButton,
		setPersistentButtonDebugActive : setPersistentButtonDebugActive,
		hidePersistentButton : hidePersistentButton,
		showThankyou : showThankyou,
		hideFramesetChat : hideFramesetChat,
        postRequestToIframeProxy : postRequestToIframeProxy,
        updateFrameName : updateFrameName,
		setChatBanished : setChatBanished,
		setAgentConfig : setAgentConfig,
		getAgentData : getAgentData,
		onEngaged : onEngaged,
		onChatShown : onChatShown,
        onBeforeChatClosed: onBeforeChatClosed,
		onInteracted : onInteracted,
		onCustomerMsg : onCustomerMsg,
		onAgentMsg : onAgentMsg,
		onAssisted : onAssisted,
		PushToFrameset : PushToFrameset,
		doPushToFrameset: doPushToFrameset,
		browserHasFlash : browserHasFlash,
		ForceFocus : ForceFocus,
		requestTranscript : requestTranscript,
		captureEmailAddress: captureEmailAddress,
		startLaunches : startLaunches,
		setDragable: setDragable,
		setResizable: setResizable,
		setV3Data: setV3Data,
		set3rdPartyCookieFromQueue: set3rdPartyCookieFromQueue,
		getV3Data: getV3Data,
		popOutChat: popOutChat,
		getBaseURL: getBaseURL,
		getMediaBaseURL: getMediaBaseURL,
		getTitleBarHeight: getTitleBarHeight,
		getPersistentCustomerID: getPersistentCustomerID,
		getPopupCloserWidth: getPopupCloserWidth,
		getSkinLocation: getSkinLocation,
		getSkinHeight: getSkinHeight,
		getSkinWidth: getSkinWidth,
		getSkinLeft: getSkinLeft,
		getSkinTop: getSkinTop,
		getFlashVars: getFlashVars,
		getSkin: getSkin,
		getImagePath: getImagePath,
		setSessionParam: setSessionParam,
		closePersistent: closePersistent,
		isThankYouEnabled: isThankYouEnabled,
		blockTheService: blockService,
		whenIsPersistent: whenPersistent,
		registerPersistentWindow: registerPersistentWindow,
		setPersistentWindowActive: setPersistentWindowActive,
		isPersistentChat: isPersistentChat,
		isPersistentWindow: isPersistentWindow,
		setVisible: setVisible,
		CloseChatFromPersistent: CloseChatFromPersistent,
		executeCustomCommand: _executeCustomCommand,
		wasSaleAction: wasSaleAction,
		sendDTEvent: sendDTEvent,
		agentSurveyCall: agentSurveyCall,
		setSurveyAuxParams: setSurveyAuxParams,
		getSurveyAuxParams: getSurveyAuxParams,
		isClickStreamSent: isClickStreamSent,
		setClickStreamSent: setClickStreamSent,
		fireCustomEvent: fireCustomEvent,
		isLoggingDisabled: isLoggingDisabled,
		createXFrame: createXFrame,
        formsLoader: XFormsLoader,
		getClientPageURL: getClientPageURL,
		updateXFrameFromBizRule: updateXFrameFromBizRule,
		showAutomaton: showAutomaton,
		parseXFrameUrl: parseXFrameUrl,
		fireCustomEvt:fireCustomEvt,
        onCookiesCommitted: onCookiesCommitted,
		when3rdPartyCookieCommitted: when3rdPartyCookieCommitted,
		isInitializationRequired: isInitializationRequired,
		resetInitializationFlag: resetInitializationFlag,
		getBusinessUnitID: getBusinessUnitID,
		getPageID: getPageID,
        getVanityUrl: getVanityUrl,
        getChatRouterVanityUrl: getChatRouterVanityUrl,
        getXFormsDomain: getXFormsDomain,
        getDeviceType: _getDeviceType,
        closePersistentWindowIfOpen: closePersistentWindowIfOpen,
        getBuRuleAgentGroupID: getBuRuleAgentGroupID,
		ciActionBtnCloseChat: ciActionBtnCloseChat,
		ciActionBtnCloseThankyou: ciActionBtnCloseThankyou,
		ciAcceptCobInv: ciAcceptCobInv,
		ciDeclineCobInv: ciDeclineCobInv,
        ciAcceptCobShareInv: ciAcceptCobShareInv,
        ciDeclineCobShareInv: ciDeclineCobShareInv,
        ciAcceptCobAndShareInv: ciAcceptCobAndShareInv,
        ciAcceptVideoInv: ciAcceptVideoInv,
        ciDeclineVideoInv: ciDeclineVideoInv,
        ciStopVideo: ciStopVideo,
		closePopupChatFromPersistent: closePopupChatFromPersistent,
        setCiFunction: setCiFunction,
		ciSendText: ciSendText,
		sendText: sendText,
		getLocalizedMessage: getLocalizedMessage,
		getBrowserTypeAndVersion: _getBrowserTypeAndVersion,
		getBrowserMajorVer: _getBrowserMajorVer,
		restartTimer: restartTimer,
		setCABeacon: setCABeacon,
		closeChatMonitor:closeChatMonitor,
		logError: logError,
		logInfo: logInfo,
		getQueueMessagingSpec: getQueueMessagingSpec,
        ciHideLayer: ciHideLayer,
        ciShowLayer: ciShowLayer,
        ciGrowLayer: ciGrowLayer,
        ciShrinkLayer: ciShrinkLayer,
        ciMinimize: ciMinimize,
        ciRestore: ciRestore,
		// *************
		//   IMPORTANT
		// *************
		// Add a new methods ABOVE of this comment
		// to see who is the author of the each latest update
		setDisconnectFlag: setDisconnectFlag,
		fileTransferSize:fileTransferSize,
		fileTransferServerUrl:fileTransferServerUrl
	}
}

	/**
	 * Drag/Resize Manager
	 * @class
	 */

function Resize() {
	this.obj = null,
	this.win = window.parent,
	this.doc = window.parent.document;
	this.width = 0,
	this.height = 0,
	this.__init = function(o, oRoot, minX, maxX, minY, maxY, bSwapHorzRef, bSwapVertRef, fXMapper, fYMapper, _win){
		if(typeof o == "undefined" || o==null){
			return;
		}
		Inq.Resize.win = (null == _win) ? this.win : _win ;	/*<% // Allow dragging on any window, however default to client window %>*/
		Inq.Resize.doc = Inq.Resize.win.document ;

		o.box = this.doc.getElementById("inqResizeBox");		
		doc =  window.parent.document ;
		o.onmousedown	= Inq.Resize.__start;

		o.hmode			= bSwapHorzRef ? false : true ;
		o.vmode			= bSwapVertRef ? false : true ;

		o.root = ((oRoot) && (oRoot != null)) ? oRoot : o ;
		
		/*<% // get the width and height from the root %>*/
		Inq.Resize.width = o.root.clientWidth ;
		Inq.Resize.height= o.root.clientHeight ;

		if (o.hmode  && isNaN(parseInt(o.root.style.left  ))) o.root.style.left   = "0px";
		if (o.vmode  && isNaN(parseInt(o.root.style.top   ))) o.root.style.top    = "0px";
		if (!o.hmode && isNaN(parseInt(o.root.style.right ))) o.root.style.right  = "0px";
		if (!o.vmode && isNaN(parseInt(o.root.style.bottom))) o.root.style.bottom = "0px";

		o.minX	= typeof minX != 'undefined' ? minX : null;
		o.minY	= typeof minY != 'undefined' ? minY : null;
		o.maxX	= typeof maxX != 'undefined' ? maxX : null;
		o.maxY	= typeof maxY != 'undefined' ? maxY : null;
		o.xMapper = fXMapper ? fXMapper : null;
		o.yMapper = fYMapper ? fYMapper : null;

		o.root.onDragStart	= new Function();
		o.root.onDragEnd	= new Function();
		o.root.onDrag		= new Function();
	};

	this.__start = function(e){
		var o = Inq.Resize.obj = this;
		e = Inq.Resize.fixE(e);
		var y = parseInt(o.vmode ? o.root.style.top  : o.root.style.bottom);
		var x = parseInt(o.hmode ? o.root.style.left : o.root.style.right );
		
		o.root.onDragStart(x, y);
		if (o.box != null)
		{
			o.box.style.top   = o.root.style.top ;
			o.box.style.left  = o.root.style.left;
			o.box.style.width = o.root.style.width ;
			o.box.style.height = o.root.style.height ;
			o.box.style.border = "thin dotted rgb(32,32,32)" ;
			o.box.style.display = "" ;
			o.style.top = (parseInt(o.root.style.top)+parseInt(o.root.style.height)-16)+"px";
			o.style.left= (parseInt(o.root.style.left)+parseInt(o.root.style.width)-16)+"px";
		}

		o.lastMouseX	= e.clientX;
		o.lastMouseY	= e.clientY;

		if (o.hmode) {
			if (o.minX != null)	o.minMouseX	= e.clientX - x + o.minX;
			if (o.maxX != null)	o.maxMouseX	= o.minMouseX + o.maxX - o.minX;
		} else {
			if (o.minX != null) o.maxMouseX = -o.minX + e.clientX + x;
			if (o.maxX != null) o.minMouseX = -o.maxX + e.clientX + x;
		}

		if (o.vmode) {
			if (o.minY != null)	o.minMouseY	= e.clientY - y + o.minY;
			if (o.maxY != null)	o.maxMouseY	= o.minMouseY + o.maxY - o.minY;
		} else {
			if (o.minY != null) o.maxMouseY = -o.minY + e.clientY + y;
			if (o.maxY != null) o.minMouseY = -o.maxY + e.clientY + y;
		}

		Inq.Resize.doc.onmousemove	= Inq.Resize.resize;
		Inq.Resize.doc.onmouseup	= Inq.Resize.end;

		var newWidth = parseInt(Inq.Resize.obj.style.left) + 16 ;
		var newHeight = parseInt(Inq.Resize.obj.style.top) + 16 ;
		var oDiv = Inq.Resize.doc.getElementById("inqTitleBar") ;
		newWidth = newWidth - 24 ;
		oDiv.style.width = newWidth + "px" ;
		


		return false;
	};

	this.resize = function(e){
		e = Inq.Resize.fixE(e);
		var o = Inq.Resize.obj;

		var ey	= e.clientY;
		var ex	= e.clientX;
		var y = parseInt(o.vmode ? o.root.style.top  : o.root.style.bottom);
		var x = parseInt(o.hmode ? o.root.style.left : o.root.style.right );
		var nx, ny;

		if (o.minX != null) ex = o.hmode ? Math.max(ex, o.minMouseX) : Math.min(ex, o.maxMouseX);
		if (o.maxX != null) ex = o.hmode ? Math.min(ex, o.maxMouseX) : Math.max(ex, o.minMouseX);
		if (o.minY != null) ey = o.vmode ? Math.max(ey, o.minMouseY) : Math.min(ey, o.maxMouseY);
		if (o.maxY != null) ey = o.vmode ? Math.min(ey, o.maxMouseY) : Math.max(ey, o.minMouseY);

		nx = x + ((ex - o.lastMouseX) * (o.hmode ? 1 : -1));
		ny = y + ((ey - o.lastMouseY) * (o.vmode ? 1 : -1));

		if (o.xMapper)		nx = o.xMapper(y);
		else if (o.yMapper)	ny = o.yMapper(x);

		nx = ex - o.lastMouseX ;
		ny = ey - o.lastMouseY ;
		var _top = parseInt(Inq.Resize.obj.style["top"]) ;
		var _left = parseInt(Inq.Resize.obj.style["left"]) ;
		Inq.Resize.obj.style["left"] = (_left+nx) + "px";
		Inq.Resize.obj.style["top"] = (_top+ny) + "px";
		
		Inq.Resize.obj.style[o.hmode ? "left" : "right"] = (nx + _left) + "px";
		Inq.Resize.obj.style[o.vmode ? "top" : "bottom"] = ny + _top + "px";

		Inq.Resize.obj.lastMouseX	= ex;
		Inq.Resize.obj.lastMouseY	= ey;

		Inq.Resize.obj.root.onDrag(nx, ny);
	
		/*<%-- If we have a resizing box resize it --%>*/
		if (Inq.Resize.obj.box)
		{
			var height = ny + _top - parseInt(Inq.Resize.obj.box.style.top)+16;
			var width  = nx + _left - parseInt(Inq.Resize.obj.box.style.left)+16;
			if (width >= 16 && height >= 16){			
				Inq.Resize.obj.box.style.width = width + "px";
				Inq.Resize.obj.box.style.height = height + "px";
			}		
 		}		
		return false;
	};

	this.end = function(){
		Inq.Resize.doc.onmousemove = null;
		Inq.Resize.doc.onmouseup   = null;
		
		var newWidth = parseInt(Inq.Resize.obj.style.left) - parseInt(Inq.Resize.obj.root.style.left) + 16 ;
		var newHeight = parseInt(Inq.Resize.obj.style.top) - parseInt(Inq.Resize.obj.root.style.top) + 16 ;
		  		
		if (Inq.Resize.obj.box)	{
			Inq.Resize.obj.box.style.display = "none" ;
		}
		

		Inq.Resize.obj.root.onDragEnd(	parseInt(Inq.Resize.obj.root.style[Inq.Resize.obj.hmode ? "left" : "right"]),
										parseInt(Inq.Resize.obj.root.style[Inq.Resize.obj.vmode ? "top" : "bottom"]));
		if (newWidth < 16 || newHeight < 16){
			newWidth = parseInt(Inq.Resize.obj.root.style.width);
			newHeight = parseInt(Inq.Resize.obj.root.style.height);			
		}
		Application.ResizeStage(newWidth,newHeight);
		Inq.Resize.obj = null;
	};

	this.fixE = function(e){
		if (typeof e == 'undefined') 
		{
			e = Inq.Resize.win.event;
		}
		if (typeof e.layerX == 'undefined') e.layerX = e.offsetX;
		if (typeof e.layerY == 'undefined') e.layerY = e.offsetY;
		return e;
	}
}

function Drag() {
	this.obj = null,
	this.win = window.parent,
	this.doc = window.parent.document;
	

	this.__init = function(o, oRoot, minX, maxX, minY, maxY, bSwapHorzRef, bSwapVertRef, fXMapper, fYMapper, _win){
		Inq.Drag.win = (null == _win) ? this.win : _win ;	/*<% // Allow dragging on any window, however default to client window %>*/
		Inq.Drag.doc = Inq.Drag.win.document ;
		if(typeof o == "undefined" || o==null){
            return;
        }
        o.onmousedown	= Inq.Drag.__start;

		o.hmode			= bSwapHorzRef ? false : true ;
		o.vmode			= bSwapVertRef ? false : true ;

		o.root = oRoot && oRoot != null ? oRoot : o ;

		if (o.hmode  && isNaN(parseInt(o.root.style.left  ))) o.root.style.left   = "0px";
		if (o.vmode  && isNaN(parseInt(o.root.style.top   ))) o.root.style.top    = "0px";
		if (!o.hmode && isNaN(parseInt(o.root.style.right ))) o.root.style.right  = "0px";
		if (!o.vmode && isNaN(parseInt(o.root.style.bottom))) o.root.style.bottom = "0px";

		o.minX	= typeof minX != 'undefined' ? minX : null;
		o.minY	= typeof minY != 'undefined' ? minY : null;
		o.maxX	= typeof maxX != 'undefined' ? maxX : null;
		o.maxY	= typeof maxY != 'undefined' ? maxY : null;

		o.xMapper = fXMapper ? fXMapper : null;
		o.yMapper = fYMapper ? fYMapper : null;
		o.corner = this.doc.getElementById("inqDivResizeCorner");

		o.root.onDragStart	= new Function();
		o.root.onDragEnd	= new Function();
		o.root.onDrag		= new Function();
	};
	
	this.__start = function(e){
		var o = Inq.Drag.obj = this;
		e = Inq.Drag.fixE(e);
		var y = parseInt(o.vmode ? o.root.style.top  : o.root.style.bottom);
		var x = parseInt(o.hmode ? o.root.style.left : o.root.style.right );
		o.root.onDragStart(x, y);
		if (o.corner) o.corner.style.display="none";

		o.lastMouseX	= e.clientX;
		o.lastMouseY	= e.clientY;

		if (o.hmode) {
			if (o.minX != null)	o.minMouseX	= e.clientX - x + o.minX;
			if (o.maxX != null)	o.maxMouseX	= o.minMouseX + o.maxX - o.minX;
		} else {
			if (o.minX != null) o.maxMouseX = -o.minX + e.clientX + x;
			if (o.maxX != null) o.minMouseX = -o.maxX + e.clientX + x;
		}

		if (o.vmode) {
			if (o.minY != null)	o.minMouseY	= e.clientY - y + o.minY;
			if (o.maxY != null)	o.maxMouseY	= o.minMouseY + o.maxY - o.minY;
		} else {
			if (o.minY != null) o.maxMouseY = -o.minY + e.clientY + y;
			if (o.maxY != null) o.minMouseY = -o.maxY + e.clientY + y;
		}

		Inq.Drag.doc.onmousemove	= Inq.Drag.drag;
		Inq.Drag.doc.onmouseup		= Inq.Drag.end;

		return false;
	};
	
	this.drag = function(e) {
		e = Inq.Drag.fixE(e);
		var o = Inq.Drag.obj;

		var ey	= e.clientY;
		var ex	= e.clientX;
		var y = parseInt(o.vmode ? o.root.style.top  : o.root.style.bottom);
		var x = parseInt(o.hmode ? o.root.style.left : o.root.style.right );
		var nx, ny;

		if (o.minX != null) ex = o.hmode ? Math.max(ex, o.minMouseX) : Math.min(ex, o.maxMouseX);
		if (o.maxX != null) ex = o.hmode ? Math.min(ex, o.maxMouseX) : Math.max(ex, o.minMouseX);
		if (o.minY != null) ey = o.vmode ? Math.max(ey, o.minMouseY) : Math.min(ey, o.maxMouseY);
		if (o.maxY != null) ey = o.vmode ? Math.min(ey, o.maxMouseY) : Math.max(ey, o.minMouseY);

		nx = x + ((ex - o.lastMouseX) * (o.hmode ? 1 : -1));
		ny = y + ((ey - o.lastMouseY) * (o.vmode ? 1 : -1));

		if (o.xMapper)
			nx = o.xMapper(y);
		else if (o.yMapper)
			ny = o.yMapper(x);

		Inq.Drag.obj.style[o.hmode ? "left" : "right"] = nx + "px";
		Inq.Drag.obj.style[o.vmode ? "top" : "bottom"] = ny + "px";
		Inq.Drag.obj.root.style[o.hmode ? "left" : "right"] = nx + "px";
		Inq.Drag.obj.root.style[o.vmode ? "top" : "bottom"] = ny + "px";
		Inq.Drag.obj.lastMouseX	= ex;
		Inq.Drag.obj.lastMouseY	= ey;

		Inq.Drag.obj.root.onDrag(nx, ny);
		return false;
	};
	
	this.end = function() {
		Inq.Drag.doc.onmousemove = null;
		Inq.Drag.doc.onmouseup   = null;
		var newLeft = parseInt(Inq.Drag.obj.root.style["left"]);
		var newTop  = parseInt(Inq.Drag.obj.root.style["top"]);						
		Inq.Drag.obj.root.onDragEnd(parseInt(Inq.Drag.obj.root.style[Inq.Drag.obj.hmode ? "left" : "right"]),
									parseInt(Inq.Drag.obj.root.style[Inq.Drag.obj.vmode ? "top" : "bottom"]));
		Inq.Drag.obj = null;
		if (Application)
			Application.MoveStage(newLeft,newTop);			
	};
	
	this.fixE = function(e)	{
		if (typeof e == 'undefined') e = Inq.Drag.win.event;
		if (typeof e.layerX == 'undefined') e.layerX = e.offsetX;
		if (typeof e.layerY == 'undefined') e.layerY = e.offsetY;
		return e;
	};
}

	function SurveyMgr(surveyDataMap){
		var surveyURL = urls.baseURL + "/survey/genericSurvey.do";
		this._observable();
		this.defaultWindowSpec = "statusbar=0, scrollbars=1, resizable=1, toolbar=0, menubar=0, copyhistory=0";
		this.poppedWindows = {};
		function getAltSurveyURL(data, rule){
			try{
				var brName = BRM.getRuleById(CHM.getLastChat().brID).getName();
			}catch(err){brName = "NO BR Name Available";}
			return ROM.composeURL(data.altURL, {
					chatID: CHM.getChatID(),
					agentID: CHM.getAgentID(),
					clientID: siteID,
					BRName: brName,
					custID: Inq.getCustID(),
					businessUnitID: data.businessUnitID,
					sessionID: data.sessionID,
					stage: data.stage,
					incAssignmentID: data.incAssignmentID,
					siteID: data.siteID,
					surveyContent: data.surveyContent
					});
		}
		function composeURL(url, data){
			return ROM.composeURL(url, data);
		}

		this.getSurveySpec = function(specID){
			if(isNullOrUndefined(specID)){
				throw new Error("Survey spec is null or undefined.");
			}
			return surveyDataMap[specID];
		};

		/**
		 * Pops out a window with given window specs, window name, URI resource info and url param data.
		 * @param webResourceID {String} The ID of the web resource to use as content for the window to display. Required.
		 * If null or undefined, will return with no action. (log error)
		 * @param winName {String} the name of the window to use in creating or referring. Required. If null or undefined,
		 * no action will be taken and an error will be logged to console.
		 * @param data {Object} Optional param for the placement of data onto the URL as parameters.
		 * @param winSpecData {String} Optional string param that may contain name-value pairs that specify the
		 * size/location etc of the window. @see http://www.w3schools.com/jsref/met_win_open.asp under "specs" for complete
		 * of supported specs here.
		 */
		this.popwindow = function(webResourceID, winName, data, winSpecDataStr){
			var webResource = resources[webResourceID];

			if(!!webResource){
				if(!!winName){
					if(webResource.method=="POST"){
						try {
							var lwin = this.poppedWindows[winName] = win.open("", winName, winSpecDataStr);
							var div = lwin.document.createElement("div");
							var formName = "TCSurveyWin"+(SurveyMgr.IDX++);
							var formStr = "<form id='"+formName+"' name='"+formName+"' action='"+webResource.url+"' method='POST' target='"+winName+"'>\n";
							for(var name in data){
								if(typeof data[name]=="function") continue;
								formStr += ("\t<input type='hidden' id='"+name+"' name='"+name+"' value='"+data[name]+"'>\n");
							}
							formStr += "</form>";
							div.style.cssText="position:absolute;top:0px;left:0px;width:1px;height:1px;";
							div.innerHTML = formStr;
							lwin.document.body.appendChild(div);
							div.firstChild.submit();
						} catch (e) {
							log(e);
						}
						lwin.document.removeChild(div);
					}else{
						this.poppedWindows[winName] = win.open(
							ROM.composeURL(webResource.url, data),
							winName,
							!!winSpecDataStr?winSpecDataStr:this.defaultWindowSpec
						);
					}
				}
				else{
					log("Popout Window Error: winName is required but not provided.");
				}
			}else{
				log("Popout Window Error: Web resource not found for popout window for resource ID = "+webResourceID);
			}
		};

		/**
		 * Fetches the surveyID from the altURL for a given survey spec and it's id.
		 * @param {Number} surveySpecID surveySpecID from which to parse the altURL to get the surveyID
		 * @param {String} [overrideURL] if provided, this is used to parse out the surveyID
		 * @returns {Number} surveyID of the named surveySpecID, Will return the surveySpecID if the override or alt url is not parsable.
		 */
		this.getKeySurveyIdFromSurveySpecAltUrl = function(surveySpecID, overrideURL){
			var url = overrideURL;
			var spec = this.getSurveySpec(surveySpecID);
			if(!url && spec && spec.altURL){
				url = spec.altURL;
			}
			// we parse the surveyID from the url... assuming it's keysurvey format like the following:
			// https://app.keysurvey.com/f/1025822/bec1/?LQID=1&
			if(url){
				var found = url.substring(url.indexOf("/f/")+3,url.lastIndexOf("/")).split("/");
				if(found && found.length) {
					return found[0];
				}
			}
			return surveySpec.id; // just return the survey spec ID
		};

		/**
		 * Shows the survey for a given specID, rule and allows for selective overrides.
		 * @param surveySpecID
		 * @param rule
		 * @param brSurveySpecOverride
		 * @param preSurveyDataPass
		 * @param windowFeatures override
		 * @param [surveyUrlOverride] surveyURL override
		 * @param surveyReporting
		 */
		this.showSurvey = function(surveySpecID, rule, brSurveySpecOverride, preSurveyDataPass, windowFeatures, surveyUrlOverride, surveyReporting){
            var windowSpec = windowFeatures ? ("," + windowFeatures + ",") : ', statusbar=0, menubar=0, scrollbars=1, resizable=1, toolbar=0, copyhistory=0,';
			var data = surveyDataMap[surveySpecID];
            if(surveyUrlOverride) {
                windowURL = surveyUrlOverride;
            }

			if(data){
                MixIns.mixAbsorber(data);
                if(brSurveySpecOverride) {
                    data.absorb(brSurveySpecOverride); // overwrite DB values with rules values
                }
                if(surveyUrlOverride) {
                    surveyURL = surveyUrlOverride;
                }
				try {
					var lastChat = CHM.getLastChat();
					if(surveyReporting) {
						surveyUrlOverride = surveyUrlOverride?surveyUrlOverride:this.getSurveySpec(surveySpecID).altURL;
						// For survey reporting, we want to post default data into the survey request.
						// survey reporting will supplement the data to be posted into the survey
						// window by the business rule tag.
						var surveyID = this.getKeySurveyIdFromSurveySpecAltUrl(surveySpecID, surveyURL);
						var automatonID = "SAT_"+surveyID;
						var surveyName = this.getSurveySpec(surveySpecID) ? this.getSurveySpec(surveySpecID).name : automatonID;
						var automatonStartedData = {
							_domain: "automaton",
							evt: "started",
							automatonID: automatonID,
							automatonStartedBy: ("BR," + (CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule ? evt.rule.id : rule.getID()).toString())),
							automatonName: surveyName,
							startedIn: "div",
							automatonType: "satisfactionSurvey",
							businessUnitID: CHM.getBusinessUnitID(),
							chatID: lastChat.id,
							customerID: Inq.getCustID(),
							incAssignmentID: getIncAssignmentID(),
							sessionID: getSessionID(),
							siteID: getSiteID(),
							pageID: LDM.getPageID(),
							businessRuleID: lastChat.brID,
							deviceType: getDeviceType(),
							operatingSystemType: getOSType(),
							browserType: getClientBrowserType(),
							browserVersion: getClientBrowserVersion(),
							agentID: lastChat.agentID ? lastChat.agentID : ""
						};
						ROM.send(urls.logDataURL, automatonStartedData); // post the automaton.started event

						// Now for the form data...
						var formDataAddition = {
							chatID: lastChat.id,
							customerID: Inq.getCustID(),
							agentID: CHM.getAgentID(),
							incAssignmentID: getIncAssignmentID(),
							sessionID: getSessionID(),
							visitorAttributes: VAM.getCopyAsArray(false).join(";"),
							automatonAttributes: "",
							siteID: getSiteID(),
							pageID: LDM.getPageID(),
							businessUnitID: CHM.getBusinessUnitID(),
							businessRuleID: lastChat.brID
						};
						if(preSurveyDataPass){
							MixIns.mixAbsorber(preSurveyDataPass).absorb(formDataAddition);
						}
						else{
							preSurveyDataPass = formDataAddition;
						}
					}
					var logData = null;
					if (!!lastChat) {
						logData = {
								_domain: "chat",
								evt: "surveyPresented",
								siteID: Inq.getSiteID(),
								businessUnitID: rule.getBusinessUnitID(),
								chatID: lastChat.id,
								customerID: Inq.getCustID(),
								sessionID: getSessionID(),
								incAssignmentID: getIncAssignmentID(),
								stage: "post-chat",
								surveyID: surveySpecID
						};
                        if (lastChat.svyPrms) {
                            MixIns.mixAbsorber(logData);
                            logData.absorb(lastChat.svyPrms);
                        }
						ROM.send(urls.logDataURL, logData);
						data["customerID"] = logData.customerID;
						data["businessUnitID"] = logData.businessUnitID;
						data["sessionID"] = logData.sessionID;
						data["stage"] = logData.stage;
						data["incAssignmentID"] = logData.incAssignmentID;
						data["siteID"] = logData.siteID;
						data["surveyContent"] = "";
                        data["ClientID"] = logData.siteID;
                        data["chatID"] = logData.chatID;
                        data["override"] = 1;
                        data["custID"] = data.customerID;

                        if (lastChat.svyPrms) {
                            MixIns.mixAbsorber(data);
                            data.absorb(lastChat.svyPrms);
                        }
					}
					if (preSurveyDataPass) {
						if (!surveyUrlOverride) {
							log("Can't submit survey with POST because URL is not provided");
							return;
						}
						var w = 635; //default
						var h = 650;
						var x = data.x ? data.x : 0;
						var y = data.y ? data.y : 0;

						if (data && !isNullOrUndefined(data.w)) {
							w = data.w;
						}
						if (data && !isNullOrUndefined(data.h)) {
							h = data.h;
						}
						try {
							this.surveyWindow = window.parent.open(prepareURLForPostRequest(surveyUrlOverride), "", windowFeatures ? windowFeatures : ("left=" + x + ",top=" + y + ",width=" + w + ",height=" + h + ",scrollbars=yes,resizable=yes"));
						} catch (e) {
							log("Can't launch survey window :" + e);
						}

						if (typeof this.surveyWindow !== "undefined" && this.surveyWindow != null) {


							if (preSurveyDataPass) {
								/* Do the POST request */
								surveyURL = prepareURLForPostRequest(surveyUrlOverride);
								var survForm = this.surveyWindow.document.createElement("form");
								survForm.name = "surveyForm";
								survForm.id = "inqSurveyForm";
								survForm.action = surveyUrlOverride;
								survForm.method = "POST";
								survForm.style.display = "none";

								for (var k in preSurveyDataPass) {
									if (typeof preSurveyDataPass[k] === "function"
										|| typeof preSurveyDataPass[k] === "object"
										|| k == "height"
										|| k == "width") {
										continue;
									}
									if (k == "agentAttr") {
										getAAforKeySurvey(preSurveyDataPass[k], this.surveyWindow)
									} else {
										addInput(k, preSurveyDataPass[k], this.surveyWindow);
									}
								}

								if (!this.surveyWindow.document.body) {
									/* Workaround for IE8 (compatibility mode and quirks mode) */
									setTimeout(function () {
										this.surveyWindow.document.body.appendChild(survForm);
										survForm.submit();
									}, 1);
								} else {
									this.surveyWindow.document.body.appendChild(survForm);
									survForm.submit();
								}
							}
							log("Survey URL: " + surveyURL);
						}
					} else {
						var windowURL = surveyUrlOverride?surveyUrlOverride: (data.altURL.length > 0) ? getAltSurveyURL(data, rule) : ROM.composeURL(surveyURL, data)
						this.surveyWindow = win.open(
							windowURL,
							'SurveyWindow',
							('top=' + (data.y ? data.y : 0) + ', left=' + (data.x ? data.x : 0) + windowSpec + ' width=' + (data.w ? data.w : 0) + ', height=' + (data.h ? data.h : 0))
						);
					}
				} catch (e) {
					log(e);
				}
			}
			else{
				log("Survey Error: no survey spec found. surveySpecID="+surveySpecID);
			}

			function addInput(name, value, sWin) {
				var input = sWin.document.createElement("input");
				input.type = "hidden";
				input.name = name;
				input.value = value;
				survForm.appendChild(input);
			}

			function getAAforKeySurvey(aa,sWin) {
				var aaObj = MixIns.JSON.parse(aa);
				for (var i in aaObj) {
					if (aaObj.hasOwnProperty(i)) {
						for (var j in aaObj[i]) {
							if (aaObj[i].hasOwnProperty(j)) {
								addInput(i, ((aaObj[i])[j]).replace(/\s+/g, ''),sWin);
							}
						}
					}
				}
			}

			function prepareURLForPostRequest(url) {
				/* Since we have a prepared url for GET request we need to prepare it for POST */
				return url
					.replace(/\?[^\/]*$/, "") // First replacing removes all parameters which there are in the url string.
					.replace("keysurvey.com", "keysurvey.com/votingmodule/s180"); // Second replacing corrects the url for POST request to KyeSurvey provider.
			}
		};
	}
	MixIns.prepare(SurveyMgr).mixIn(MixIns.Observable).mixIn(MixIns.Absorber);
	SurveyMgr.IDX = 0;
	SurveyMgr.prototype.isListener = function(l){
		return (!!l && (l.onSurveyLaunchEvent || l.fireSurveySubmitted));
	};

	SurveyMgr.prototype.fireSurveyLaunched = function(chatdata, _src){
		var evt = MixIns.mixAbsorber({id:++this.evtIdx, evtType:this.TYPES.SLAUNCHED, timestamp:new Date(), src:_src});
		evt.absorb({chatID:chatdata.chatID, ruleID:chatdata.ruleID, customerID:mockCustID});
		var buID = chatdata["buID"] ? chatdata["buID"] : null;
		var agID = chatdata["agID"] ? chatdata["agID"] : null;
		if (!(agID && buID) || parseInt(buID) <= 0 || parseInt(agID) <= 0) {
			var rule = BRM.getRuleById(chatdata.ruleID);
			if (rule) {
				buID = buID && parseInt(buID) > 0 ? buID : rule.getBusinessUnitID();
				agID = agID && parseInt(agID) > 0 ? agID : rule.getAgentGroupID();
			}
		}
		if (agID && parseInt(agID) > 0) {
			evt.absorb({agentGroupID: agID});
		}
		if (buID && parseInt(buID) > 0) {
			evt.absorb({businessUnitID: buID});
		}
		this._fireEvt(
			function(l, evt){
				if(typeof l.onSurveyLaunchEvent=="function") l.onSurveyLaunchEvent(evt);
			},
			evt
		);
	};
	SurveyMgr.prototype.fireSurveySubmitted = function(chatdata, _src){
		// Not used right now
//		var evt = MixIns.mixAbsorber({evtType:SurveyMgr.TYPES.SSUBMIT, timestamp:new Date(), src:_src});
//		evt.absorb(chatdata);
//		this._fireEvt(
//			function(l, evt){
//				if(typeof l.onSurveySubmitEvent=="function")
//					l.onSurveySubmitEvent(evt);
//			},
//			evt
//		);
	};
	SurveyMgr.prototype.TYPES = SurveyMgr.TYPES = {SLAUNCHED:"SLAUNCHED", SSUBMIT:"SSUBMIT"};

	/**
	 * The API object will consolidate our customers external use of our framework into a unified API
	 * All customer access should eventually be through this access object.
	 * @param pageID
	 * @param dat
	 * @see LandingMgr#init
	 */
	function reinitChat(pageID, dat){
		try {
			Inq.overridePageID = undefined;
			win.inqSiteID = undefined;
			var data = ((dat && dat.constructor == String) ? MixIns.JSON.parse(dat) : dat);
			if (!CHM.isPersistentWindow()) {
                // stop all cobrowse event handlers
                if (Inq.CBC) {
                    Inq.CBC.reset();
                }
				/* If we are passing in data, we want to set it globally so data pass rules may pick it up */
				if (data) {
					if (data['pass']) {
						win.inqData = data['pass']; //BR30 uses "pass" as data pass reference...
					}
					else if (data['data']) {
						win.inqData = data['data']; //BR20 uses "data" as data pass reference.
					}
				}
				if (data && data.sale) {
					var s = data.sale;
					var w = win;
					w.inqSalesProducts = s.products;
					w.inqSalesPrices = s.prices;
					w.inqSalesQuantities = s.quantities;
					w.inqTestOrder = s.test;
					w.inqClientOrderNum = s.ordernum;
					w.inqClientTimeStamp = s.timestamp;
					w.inqCustomerName = s.customerName;
					w.inqOtherInfo = s.otherInfo;
				}
				if (CHM.isChatInProgress()) {
					/* if a chat is in progress, reinitializing is very touchy as chats are stateful.
					 The best thing to do is to replay page landing events after resetting the page
					 to the "new" pageID */
					if (pageID && pageID > 0) {
						Inq.overridePageID = pageID;
					}
					C2CM.reset();
					LDM.init(true);
					BRM.reset();
					BRM.resetForReinit();
					BRM.init(true);
					BRM.start();
					LDM.start();
				} else {
					if (pageID && pageID > 0) {
						win.inqSiteID = pageID;
					}
					C2CM.reset();
					CHM.reset();
					BRM.resetForReinit();
					resetObserver();
					DM.reset();
					win.v3Lander.reload();
				}
			}
		}catch(e){
			logErrorToTagServer("Error on reinitChat call. site="+siteID+",custID="+custID+",page="+LDM.getPageID()+",error="+e.message);
		}
	}

	function resetObserver() {
		//if the tcFramework was reloaded we have to disable monitoring mutations for previous tcFramework
		if (doc.body.getAttribute('data-inq-observer') == '1') {
			win.Inq.observer.disconnect();
			doc.body.setAttribute('data-inq-observer', '0');
		}
	}

	function launchChatNowByPageID(ruleID){
		// find chat rule in BR object
		var rule = BRM.getRuleById(ruleID);
		if(rule != null) {
			EVM.fireManualInvocationEvent(rule);
		}
	}

	function launchChatNow(ruleName){
		// find chat rule in BR object
		var rule = BRM.getRuleByName(ruleName);
		if(rule != null) {
			EVM.fireManualInvocationEvent(rule);
		}
	}

	function setChatSuppressedForSession() {
		Inq.blockService("ALL", 0); // -1 forever, 0 session, >0 other duration
	}

	function blockChat( scope ){
		switch( scope ){
			case "page":
				break;
			case "session":
				Inq.blockService("ALL", 0); // -1 forever, 0 session, >0 other duration
				break;
			default:
				break;
		}
	}

	function getSaleID(){
		var saleID = -1;
		try {
			var saleIdVar = PM.getVar("saleID");
			if (!!saleIdVar) {
				var sid = saleIdVar.getValue();
				saleID = isNullOrUndefined(sid) ? -1 : sid;
			}
		}catch(err){
			saleID = -1;
		}
		return saleID;
	}

	function getChatID(){
		var chatID = -1;
		try{
			if( !!CHM.getChatID() )
				chatID = CHM.getChatID();
		}catch(err){
			chatID = -1;
		}
		return chatID;
	}

	function showClickToCallHtml(index, html){
		C2CM.getC2C(index).showClickToCallHtml(html);
	}

	/**
	 * Returns data from the data managers for the IJSF.
	 * @public
	 * @return {dict} map of data objects keyed by object ID
	 * @see exposeCustomerApi
	 */
	function getData(){
		return getMgrData(mgrList);
	}

	/**
	 * provides API data to external caller. Helper
	 * @private
	 * @param list {Array} Array of objects that possibly support the DataExporter interface.
	 * @see getData
	 * @return {dict} map of data objects keyed by object ID
	 */
	function getMgrData(list){
		var retval = {};
		for(var idx=0; idx<list.length; idx++){
			var mgr = list[idx];
			if( !!mgr.getData && typeof mgr.getData == "function"){
				retval[mgr.getID()] = mgr.getData(); // get standard data
			}
		}
		return retval;
	}

	/**
	 * For publishing API with the publish-js-api-function action tag
	 * @param apiString an identifier to be added as a function to customer page.
	 * @param varid name of variable to be returned in API function
	 * @param ruleID specify id of rule
	 * @param _win specify window object if null win.parent will be as default
	 * An example of such an identifier is "InqSaleMgr.getSaleID". This API would have to be invoked as
	 * InqSaleMgr.getSaleID() in a customer page.
	 * If apiString is not a composite identifier (no point separators) and customer page already possesses such object,
	 * it will be overwritten. If apiString is a composite identifier and customer page already possesses such object,
	 * this object will be supplemented. This is done to enable publishing several objects w/o overwriting previously published ones.
	 */
	function publishAPI(apiString, varid, ruleID, _win) {
		if (!apiString) {
			return false;
		}
		var osa = apiString.split(".");
		var fcn = function () {
			return getVar(varid, ruleID);
		};
		if (!_win) {
			_win = win;
		}
		var obj = _win ? _win : window.parent;
		for (var idx = 0; idx < osa.length; idx++) {
			if (idx == osa.length - 1) {
				// a leaf object with the same name will be ovewritten
				if (!!obj) {
					obj[osa[idx]] = fcn;
				} else {
					log("Cannot publish API " + apiString + " because object is null of undefined");
				}
			} else if (isNullOrUndefined(obj[osa[idx]])) {
				// if non-leaf object already exists, we will add to it
				obj[osa[idx]] = {};
			}
			obj = obj[osa[idx]];
		}
		return true;
	}

	/**
	 * Publishes public API calls for Inq. Ideally this would be the only place to publish such functions but
	 * LandingFramework.jsp breaks encapsulation many times over.
	 */
	function exposeCustomerApi() {
		var win = window.parent;
		if(isNullOrUndefined(win.Inq)) {
			win.Inq = {};
			win.Inq.SaleMgr= {};
		}
		win.Inq.launchChatNowByPageID = launchChatNowByPageID;
		win.Inq.launchChatNow         = launchChatNow;
		win.Inq.setChatSupressedForSession  = setChatSuppressedForSession;
		win.Inq.setChatSuppressedForSession = setChatSuppressedForSession;
		win.Inq.blockChat  = blockChat;
		win.Inq.reinitChat = reinitChat;
		win.Inq.reinit     = reinitChat;
		win.Inq.SaleMgr = {getSaleID: getSaleID, getChatID: getChatID};
		win.Inq.showClickToCallHtml = showClickToCallHtml;
		win.Inq.fireCustomEvent = fireCustomEvent;
		win.Inq.getData = getData;
		win.Inq.observer = domObserver;
	}


function CG(includeIds, includeCGIds, includeURLFunction, excludeIds, excludeCGIds, excludeURLFunction, businessUnits) {
    /* lookup table... fast lookup */
    var _lut = {};
    var _includeIds = includeIds ? includeIds : [];
    var _includeCGIds = includeCGIds ? includeCGIds : [];
    var _includeURLFunction = includeURLFunction;


    var _excludeIds =  excludeIds ? excludeIds : [];
    var _excludeIdQuick = {};
    var _excludeURLFunction = excludeURLFunction;
    var _excludeCGIds =  excludeCGIds ? excludeCGIds : [];
    this.length = _includeIds.length;

    for (var idx = 0; idx < _includeIds.length; idx++) {
        _lut[_includeIds[idx]] = _includeIds[idx]; /* populate lookup table */
    }

    for (var i = 0; i < _excludeIds.length; i++) {
        _excludeIdQuick[_excludeIds[i]] = _excludeIds[i]; /* populate lookup table */
    }

    var buIDs = businessUnits;
    /**
     * check: is current CG contain (pgId + url)
     * @param pgID page id
     * @param url page url
     * @param contentGroups array of cg (to check include/ exclude CG ids)
     * @return true if current CG contains (pgId + url)
     */
   this.contains = function(pgID, url, contentGroups) {
        /* check excluded ids */
        if (typeof _excludeIdQuick[pgID]=='number') {
            return false;
        }

        /* check excluded groups */
        if (this.isInCGList(_excludeCGIds, pgID, url, contentGroups)) {
            return false;
        }

        /* check excluded URLs */
        if (url && _excludeURLFunction && _excludeURLFunction(url)) {
            return false;
        }

        /* check included ids */
        if (typeof _lut[pgID]=='number') { /* fast lookup O(log n) for JS hashes (instead of iterating through list) */
            return true;
        }
        /* check included group ids */
        if (this.isInCGList(_includeCGIds, pgID, url, contentGroups)) {
            return true;
        }
        /* check included url; */
        return url && _includeURLFunction && _includeURLFunction(url);
    };

    /**
     * check is cgList contain  (pgID, url)
     * @param cgList list of CG
     * @param pgID page id
     * @param url page url
     * @param contentGroups all CG
     * @return true if (pgId + url) are in cgList 
     */
    this.isInCGList = function(cgList, pgID, url, contentGroups) {
        for (var i = 0; i < cgList.length; i ++) {
            var cg = contentGroups[cgList[i]];
            if (!cg) {
                continue;
            }
            if (cg.contains(pgID, url, contentGroups)) {
                return true;
            }
        }
        return false;

    };

    this.getBusinessUnits = function(){
        return buIDs ? buIDs : null;
    };
}

/**
 * factory for CG object
 * @static
 * @param d {Array} representing the constructor for CG
 * @returns {CG}
 */
CG.c = function(d){
	return new CG(d[0],d[1],d[2],d[3],d[4],d[5],d[6]);
};

	function CallRemote(callback){
		this.absorb(callback);
	}
	MixIns.prepare(CallRemote).mixIn(MixIns.Absorber).mixIn(MixIns.RemoteCaller).mixIn(MixIns.JSON);
	CallRemote.create = function(callback){
		return new CallRemote(callback);
	};
	CallRemote.prototype.onRemoteCallback = function(dstr){
		var data = typeof dstr == "string" ? this.parse(dstr) : dstr;
		this.doCallbackActions(data);
	}
	/**
	 * Class is a wrapper for the launching of services and data pass as an encapsulation.
	 * @class 
	 * @param d data consisting of {
	 * @param {Object} rule rule for the launch context.
	 * @param {String} serviceType service string identifier
	 * @param {function} onAgentAssigned optional agent
	 */
	function ServiceLauncher(d){
		this.absorb(d);
		this.data = d; // we keep this around to use as an anonymous listener if needed
	}
	MixIns.prepare(ServiceLauncher).mixIn(MixIns.Absorber);
	/**
	 * Factory method.
	 */
	ServiceLauncher.c = function(data){
		return new ServiceLauncher(data);
	};
	/**
	 * Method that kick starts the service launch via chat manager.
	 */
	ServiceLauncher.prototype.request = function(){
		if(this.data.onAgentAssigned)
			EVM.addListener(this.data); // use as anonymous listener to send data as necessary

        if(this.flashvarFcn) {
            CHM.registerFlashvarFcn(this.flashvarFcn);
        }

		// INVEST-346 "All Clients are recieining Agent 0 again on Agent Conversion report for sales"
		// show-conversive may specify agent that should be attributed for sale
		if (this.data.agtid) this.chatSpec.aid = this.data.agtid;

		var self = this;
        CM.updateCACookie(function() {
            CHM.request(self.rule, self.chatType, self.chatSpec, "", null, function() {
                C2CM.showDisabledIcon();
            });
        });
	};
	

	function DFV(i, f, v, initial){
		this.id = i;
		this.f = f;
		this.v = v;
        this.initial = initial;
	}
	DFV.c = function(i,f,v, initial){
		return new DFV(i,f,v, initial);
	};
	
	DFV.prototype.toString = function(dflt){
		var o = dflt;
		try{
			var o = safe("("+this.f.toString()+")()",{});
		}catch(err){
			log("DFV ["+this.id+"] execution failed:" + err);
		}
		var template = this.v;
		for(var name in o){
			var s = o[name];
			template = template.replace("${"+name+"}", s);
		}
		return template;
	};
/**
 * ...
 * @author fpinn@touchcommerce.com
 */

window.XFormsLoader = function(){
	/**
	 * The prefix "_$" used to indicate that this fields need parse as JSON object
	 * Use constant names same as in Java code
	 */
	var INITIATOR = "_$initiator";
	var LOCATION = "_$location";
	var PERSISTENT_CUSTOMER_ID = "_persistCustId";

	var _JSON = MixIns.JSON;

	/**
	 * Convert object to string in JSON format
	 */
	function stringify(obj) {
		return _JSON.stringify(obj);
	}

	/**
	 * Logs to console. If Inq.log is available, use it to honor our javascript logging settings.
	 * Otherwise, log directly to console.
	 * @param text text to log
	 */
	function log(text){
		if (Inq && Inq.log) {
			Inq.log("XF: " + text);
		} else if (window.console) {
			window.console.log("XF: " + text);
		}
	}

	/**
	 * Convenience method to log errors.
	 * @param e error to log
	 * @returns fn function for convenient logging of extra values
	 */
	function logError(e){
		log("Error: " + e.message);
		if (e.origin) {
			log("   at " + e.origin);
		} else if (logError.caller != null) {
			log("   at " + logError.caller.toString().split("{")[0]);
		}
		return function(value) {
			log("   trace:[" + value + "]")
		};
	}

	var XFormsLoader = function(){
		var headerData = {};
		this._xhr;
		this._dtid;
		this._source;
		this._xframe;
		this.index = XFormsLoader.instances.length ;
		XFormsLoader.instances.push(this);		/* Save this instance in array to ensure scoping and to ensure that instance is not removed by Garbage Collector before we are finished */

		/**
		 * Build query string for request from the headerData structure
		 * as additional URL parameters (should be appended to URL with at least one parameter in its query string).
		 *
		 * @param data headerData sctucture
		 * @returns query string
		 */
		function getQuery(data) {
			var query = "";
			try {
				for (var key in data) {
					query += "&" + key + "=" + encodeURIComponent(data[key]);
				}
			} catch (e) {
				logError(e);
			}
			return query;
		}

		/**
		 * Create first URL parameter for Loadbalancer use
		 * (we use the same parameter as in RTDEV-8734).
		 *
		 * @returns {string} load balancer sticky parameter
		 */
		function getLBStickyAsFirstParameter() {
			return "?customerID=" + Inq.getCustID();
		}

		/**
		 * Creates new IFrame for XForm
		 * @param div container div where iframe is created
		 * @param url URL where div will be submitted later
		 * @param businessUnitID channel Id if update is required
		 * @param scrolling optional, controlling scrolbars for IFrame, default value is "no"
		 * @return newly created iframe
		 */
		this.createXFrame = function(div, url, businessUnitID, scrolling, data, overrideRule, initiator, location) {
			var chat = CHM.getChat();
			var rule = overrideRule ? overrideRule : (chat ? chat.getRule() : null);

			headerData = {
				// url is required for post to know where to go
				url: url,
				siteID: Inq.getSiteID(),

				// data required for xFormExtensions to operate properly
				workerPath: "window.com.inq.flash.client.control.XFrameWorker",
				clientHtml: getHostedFileUrl(),

				// data for xforms
				_chatID: CHM.getChatID() ? CHM.getChatID() : "",
				_agentID: (CHM.getAgentID()) ? CHM.getAgentID() : "",
				_businessUnitID: (businessUnitID) ? businessUnitID : ((CHM.getChat()) ? CHM.getChat().getBusinessUnitID() : FP.getBusinessUnitID()),
				_siteID: Inq.getSiteID(),
				_customerID: Inq.getCustID(),
				_sessionID: FP.getSessionID(),
				_incAssignmentID: FP.getIncAssignmentID(),
				_clientPageURL: FP.getClientPageURL(),
				_pageMarker: LDM.getPageMarker(),
				_pageID: LDM.getPageID(),
				_language: rule ? rule.getLanguage() : Inq.getDefaultLanguage(),
				_visitorAttributes: VAM.getCopyAsArray(true).join(";"),
				_brAttributes: rule ? rule.getRuleAttributesAsString() : "",
				_browserType: getClientBrowserType(),
				_browserVersion : getClientBrowserVersion(),
				_operatingSystemType : getOSType(),
				_deviceType : getDeviceType(),
				_qt: CHM.getQueueThreshold() ? CHM.getQueueThreshold() : ""
			};

			if (chat && chat.getAutomatonSpecData()) {
				try {
					headerData._automatonDataMap = stringify(chat.getAutomatonSpecData());
				} catch (e) {
					logError(e)("automatonDataMap is malformed for rule " + rule.getID() + " siteID=" + Inq.getSiteID() + " customerID=" + Inq.getCustID());
				}
			} else {
				var automatonDataMap = PM.getVar("automatonDataMap");
				if (automatonDataMap) {
					var value = automatonDataMap.getValue();
					if (value) {
						headerData._automatonDataMap = value;
					}
				}
			}

			var brId = "";

			if (rule) {
				headerData._brName = rule.getName();
				headerData._brId = brId = rule.getID();
			}

			headerData[INITIATOR] = stringify(initiator ? initiator : {type: "br", id: brId});
			headerData[LOCATION] = location ? stringify(location) : "";

			var agID = getAgentGroupId(location, rule, chat);
			if (agID) {
				headerData._agentGroupID = agID;
			}

			var persistentCustomerID = FP.getPersistentCustomerID();
			if (persistentCustomerID) {
				headerData[PERSISTENT_CUSTOMER_ID] = persistentCustomerID;
			}

			for (var field in data) {
				if (!headerData[field]) { // do not populate if we have never value
					headerData[field] = data[field];
				}
			}

			var nameIFrame = encodeURIComponent(MixIns.JSON.stringify(headerData));
			if (!scrolling) scrolling = "no";
			div.innerHTML = '<IFRAME width="100%" height="100%" class="inqChatFoo" frameborder="0" scrolling="' + scrolling + '" ' +
				'name="' + nameIFrame + '" ></IFRAME>';

			this._xframe = div.getElementsByTagName("IFRAME")[0];
			this._xframe.headerData = headerData;

			if (url) {
				this._source = url;
				this._dtid = data.dtid;

				this.loadForm(url);
			}
			return this._xframe;
		};

		/**
		 * Get agent group id
		 * if automaton start in div then get agent group id from BR that show automaton.
		 * if automaton start in chat:
		 *   if agent assigned then get agent group id of current agent
		 *   if agent don't assigned then get agent group id of current chat (initial set by BR)

		 * @param location where start automaton
		 * @param rule rule that start automaton
		 * @param chat chat in that context start automaton
		 * @returns {string} agent group id or null
		 */
		function getAgentGroupId(location, rule, chat) {
			if (chat && location && location.type == "chat") {
				var chatAgID = chat.getChatAgentGroupID();
				if (chatAgID) {
					return chatAgID;
				} else {
					return chat.getAgentGroupID();
				}
			} else {
				return rule ? rule.getAgentGroupID() : null;
			}
		}

		/**
		 * Start xform loading.
		 * Automaton request pushed to queue and start request of JSESSIONID, after get JSESSIONID we send request to automaton.
		 * While we wait for JSESSIONID response we can have some also requests, they will be put to queue and will send after get JSESSIONID.
		 *
		 * @param automatonRequestUrl url to XForms server
		 */
		this.loadForm = function(automatonRequestUrl) {
			XFormsLoader.requestQueue.push(this);

			if (!XFormsLoader.isGetSessionIdInProgress) {	/* if jsessionid loading is not in progress then start it */
				XFormsLoader.getJavaSessionId(automatonRequestUrl, 1);
			}
		};

		/**
		 * Get URL to request JSESSIONID.
		 */
		XFormsLoader.getSessionIdUrl = function (automatonRequestUrl) {
			/* break the URL into parts, so we can extract the protocol and domain */
			var parts = automatonRequestUrl.split("/");
			/* Index for the protocol is 0, format is protocol://domain/... */
			var protocol = parts[0];
			/* Index for the domain is 2, format is protocol://domain/... */
			var domain = parts[2];
			/* the /jsid/getSession controller returns the java session id */
			return  protocol + "//" + domain + "/" + parts[3] + "/jsid/getSessionId" + getLBStickyAsFirstParameter();
		};

		/**
		 * Asks server for JSESSIONID, if we have one, it validates the id
		 *		Upon completion the JSESSIONID is persisted if in IJSF
		 *		Then the xform is loaded.
		 * @param automatonRequestUrl automaton servlet URL (needed to determine JSESSIONID servert URL)
		 * @param attemptNumber number of attempt to get JSESSIONID
		 * @return nothing
		 * @see obtainedSessionId
		 */
		XFormsLoader.getJavaSessionId = function (automatonRequestUrl, attemptNumber) {
			try {
				if (window.top == window.parent && window == window.top.inqFrame) {		/* Ensure that we are in the IJSF */
					var sessionId = XFormsLoader.initJsid();
					XMLHttpRequestFacade.jsessionid = (!!sessionId) ? sessionId : null;
					var xhr = new XMLHttpRequestFacade();
					var urlGetSessionId = XFormsLoader.getSessionIdUrl(automatonRequestUrl);
					xhr.open("GET", urlGetSessionId, true);		/* register the URL for retrieving the java session id */
					xhr.onreadystatechange  = function() {		/* register handler for retrieving the response from the server */
						if (xhr.readyState == XMLHttpRequestFacade.DONE) {		/* Check to see if we are completed */
							/* Check response code */
							if (xhr.status == 200) {
								/* process the java session id */
								XFormsLoader.obtainedSessionId(xhr.response);

								/* clear progress flag */
								XFormsLoader.isGetSessionIdInProgress = false;
							} else if (xhr.status == 404) {
								/* A 404 return code indicates that the request completed successfully,
								 * but that the server doesn't recognize the getSessionId endpoint.
								 * This happens when the form we're trying to load is NOT hosted on the
								 * XForms server. (As for the Paymetric integration, see RTDEV-8041.)
								 *
								 * This is a quick, TEMPORARY fix to keep us on schedule until a
								 * better solution can be developed.
								 */
								logErrorToTagServer(
									"XFormsLoader.getJavaSessionId: Can't get JSESSIONID. " +
									"attempts=[" + attemptNumber + "] status=[" + xhr.status + "] response=[" + xhr.response + "]"
								);
								XFormsLoader.isGetSessionIdInProgress = false;
								XFormsLoader.continueLoadingForms();
							} else if (xhr.status == 0 && attemptNumber < XFormsLoader.MAX_ATTEMPTS_COUNT) {
								/* network issue, retry get JSESSIONID and continue automaton loading after 1sec */
								/* (the flag isGetSessionIdInProgress don't reset) */
								setTimeout(
									function () {
										XFormsLoader.getJavaSessionId(automatonRequestUrl, attemptNumber + 1);
									},
									1000
								);
							} else {
								/* bad response code or a retry attempts have been exhausted */
								/* we don't have reason to continue automaton loading */
								/* clear progress flag */
								XFormsLoader.isGetSessionIdInProgress = false;

								/* log response code to TS */
								logErrorToTagServer(
									"XFormsLoader.getJavaSessionId: Can't get JSESSIONID. " +
									"attempts=[" + attemptNumber + "] status=[" + xhr.status + "] response=[" + xhr.response + "]"
								);
							}
							xhr.onreadystatechange = null;						/* Turn off the checking of ready state change */
							xhr = null;
						}
					};
					XFormsLoader.isGetSessionIdInProgress = true;				/* set progress flag */
					xhr.send();
				} else {
					/* We are not in the IJSF, we are in the XFORMS frame, so we already have the JSID in the XMLHttpRequest.jsessionid */
					XFormsLoader.continueLoadingForms();
				}
			} catch (e) {
				logError(e)("getJavaSessionId");
			}
		};

		/**
		 * Handles server response with session id. Persists JSESSIONID in IJSF and loads xform.
		 * This method is published because of the way loader calls it.
		 * @see getJavaSessionId - the caller
		 * @see loadForm - loads the form after we have the java session id
		 */
		XFormsLoader.obtainedSessionId = function (jSessionId) {
			if (jSessionId.length > 0) { /* If we have a session id, then we must register it and persist it */
				/* Register the jsid, Tell the extended XHR that we have a session id for it to use */
				XMLHttpRequestFacade.jsessionid = jSessionId;
				XFormsLoader.persistJsid(jSessionId); /* Persist the id */
			}
			XFormsLoader.continueLoadingForms(); /* Load the form */
		};

		/**
		 * Send all requests from queue to continue forms loading
		 */
		XFormsLoader.continueLoadingForms = function () {
			for (var i = 0; i < XFormsLoader.requestQueue.length; i++) {
				XFormsLoader.requestQueue[i].continueLoadingForm();
			}
			XFormsLoader.requestQueue = [];
		};

		/**
		 * continueLoadingForm: private
		 * load form via AJAX request
		 *		The form is read via AJAX and written into the document
		 *		Once the page is read, it is applied to the document via obtainedSourceHtml
		 * @return url with query string
		 * @see obtainedSourceHtml
		 */
		this.continueLoadingForm = function() {
			this._xhr = new XMLHttpRequestFacade();

			var XFormsLoaderInst = this;
			this._xhr.onreadystatechange = function() {		/* When the AJAX call changes state, analyse it */
				var xhr = this;								/* Get the AJAX structure (xhr) */
				if (xhr.readyState == XMLHttpRequestFacade.DONE) {	/* Check to see if we are completed */
					XFormsLoaderInst.obtainedSourceHtml(xhr.response);
					XFormsLoaderInst = null;
				}
			};
			var url = this._source + getLBStickyAsFirstParameter() + getQuery(headerData);
			this._xframe["href"] = url;			/* Add the full url with query string so that the Xform Iframe can retrieve it */
			this._xhr.open("GET", url, true);	/* Tell xhr the name of the url to retrieve */
			this._xhr.send();					/* And send it to the server */
			return false ;
		};

		/** fixDocumentRewriteBug - Fixes WebKit's peculiarity - it does not reset global variables when re-writing document.
		 *  Also fixes problem in IE, where when the document is rewritten, the domain is restored.
		 *  With sub-domains this becomes a problem because the xform cannot communicate with the IJSF or the CI (same origin policy)
		 *  To fix this we inject a document.domain setting in a script tag into the new document and this fixes the domain.
		 * @param html - string containing HTML to be modified and counterIncrement
		 * @param win - the xform iframe's content window
		 * @return corrected html string
		 */
		function fixDocumentRewriteBug(html, win) {
			/* The DOCUMENT_REWRITE_BUG global variable is necessary for detection of the WebKit's peculiarity. */
			try {
				win.DOCUMENT_REWRITE_BUG = true;
			} catch(e){
				logActionErr(e, this);
			}
			html = html.replace('</head>', '<script type="text/javascript">if (typeof DOCUMENT_REWRITE_BUG != "undefined") {top.inqFrame.Inq.FlashPeer.formsLoader.resetGlobalVars(window);}</script></head>');
			if(window.location.host != document.domain)
				html = html.replace(/(<\s*body\b[^>]*>)/gi, '\n$1\n<script type="text/javascript">try{document.domain=\"'+document.domain+'";}catch(er){};</script>\n');
			return html;
		}
		/** The above function fixDocumentRewriteBug is a function in scope to this object only and is not accessible to the unit tests
		 * We add the following to make this function accessible from the instance.
		 * BTW: this function was made as a function in the scope, so when onsubmit is caught in an anonymous function, we can access it, it would be in scope.
		 */
		this.fixDocumentRewriteBug = fixDocumentRewriteBug;	/* Make fixDocumentRewriteBug accessible via the object (needed for unit testing only */

		/** obtainedSourceHtml - We arrive here when we have the HTML received from the ORBEON forms server
		 *  The data is received via a XHR (XML Http Request) as a forms request and we put it into our blank document
		 *  The blank document is actually the client hosted file.
		 *		This is necessary in IE if we want to have an HTTPS request,
		 *		If we try using "://" or "about:blank" we get an awful message about mixing http/https
		 *
		 *  Once the file is loaded, it is safe to write the HTML.
		 */
		this.obtainedSourceHtml = function(response) {
			this._html = normalizeHtml(response, this._source);
			this._xframe["XFormsLoader"] = this;
			if (!this._xframe.src) {
				this._xframe.onload = function() {
					var ifrm = this;					/* Get the IFRAME */
					var inst =  ifrm["XFormsLoader"];	/* Get this instance of XFrame.hx */
					inst.writeObtainedHtml();
				};
				/* As we know by now, onload does not work in IE6 and IE7, we must check the status change*/
				this._xframe.onreadystatechange = function() {
					var ifrm = this;			/* Get the IFRAME */
					if (ifrm.readyState == "complete" || ifrm.readyState == "loaded") {
						var inst =  ifrm["XFormsLoader"];	/* Get this instance of XFrame.hx */
						inst.writeObtainedHtml();
					}
				};

				this._xframe.src = (window.location.href).split("?")[0]+"?BLNK";
			} else {
				this.writeObtainedHtml();
			}
		};

		/** writeObtainedHtml -
		 *	1)	Stop listeners,
		 *	2)	Get document
		 *	3)	Write the form
		 * @return nothing
		 * @see obtainedSourceHtml - caller
		 */
		this.writeObtainedHtml = function() {
			/* Reset the handlers */
			this._xframe.onreadystatechange = null;
			/* Stop listening to state change, we have what we want */
			this._xframe.onload = null;
			/* Don't need onload either */
			this._html = fixDocumentRewriteBug(this._html, this._xframe.contentWindow);
			if (this._xframe.contentDocument) {
				writeForm(this._xframe.contentDocument, this._html);
			} else if (this._xframe.contentWindow) {
				writeForm(this._xframe.contentWindow.document, this._html);
			} else {
				logError({origin: "writeObtainedHtml", message: "Target document not found"});
			}
		};

		/**
		 * Writes the form into the document
		 * @param doc to write
		 * @see writeObtainedHtml
		 */
		function writeForm(doc, html){
			doc.open();
			doc.write(html);
			doc.close();

			/* Now all our work is complete, we may destroy this instance */
			XFormsLoader.instances[this.index] = null;			/* Remove reference to this instance, Garbage Collector will remove */
			// TODO this is likely to cause problems as index of the following items is not updated
			XFormsLoader.instances.splice(this.index, 1);		/* remove item from array via splice */
		}

		/**
		 * Converts all urls into absolute form. This is necessary because we are NOT in the same domain as the document
		 * We are actually in the domain of the host client
		 * TODO in cbc.js we already have a similar convertToAbsoluteUrl and that one is covered with tests!
		 *
		 * @param html - string containing html
		 * @param source url for the html
		 * @return fixed html string
		 */
		function normalizeHtml(html, source) {
			var srcParts = source.split("/");
			var proto = srcParts[0];
			var domain = srcParts[2];
			srcParts.pop();
			var path = srcParts.join("/");

			var x  = new RegExp('(href|src|action)=\"((inq://|http://|https://|//|/|#){0,1}[^\"]*)\"', 'gi');
			var matches = html.match(x);
			/* The array elements for the above regular expression is as follows
			 * match item 0 -  the string in it's entirety
			 * match item 1 -  the ATTRIBUTE name, obtained from the pattern above (href|src|action)
			 * match item 2 -  this is the URL, obtained from the pattern ((javascript:|http://|https://|//|/){0,1}[^\"]*)
			 * match item 3 -  the PROTOCOL from the url, obtained from the pattern (javascript:|http://|https://|//|/)
			 * So the regexp has three match points as follows:
			 * (ATTRIBUTE)=((PROTOCOL)URL)
			 * Item 1 is the ATTRIBUTE
			 * Item 2 is the entire URL including the PROTOCOL
			 * Item 3 is the PROTOCOL only
			 */
			if (matches != null) {
				for (var ix=0; ix<matches.length;ix++) {
					try {
						var fix = matches[ix];
						x  = new RegExp('(href|src|action)=\"((inq://|javascript:|http://|https://|//|/|#){0,1}([a-zA-Z0-9._-]+)([^\"]*)\")','gi');
						var parts = x.exec(fix);
						if (parts != null) {
							var url;
							switch((parts[3]).toLowerCase()) {								// check match item #3, the PROTOCOL
								case "inq://":
									if (parts.length > 4) {
										switch(parts[4]) {
											case "agentsAvailabilityCheckURL":	url = Inq.urls.agentsAvailabilityCheckURL; break;
											case "baseURL":						url = Inq.urls.baseURL; break;
											case "chatRouterVanityDomain":		url = Inq.urls.chatRouterVanityDomain; break;
											case "pageUnloadURL":				url = Inq.urls.pageUnloadURL; break;
											case "cobrowseURL": 				url = Inq.urls.cobrowseURL; break;
											case "cookieClearAllURL":			url = Inq.urls.cookieClearAllURL; break;
											case "cookieClearOneURL":			url = Inq.urls.cookieClearOneURL; break;
											case "cookieGetURL":				url = Inq.urls.cookieGetURL; break;
											case "cookieSetURL":				url = Inq.urls.cookieSetURL; break;
											case "getSiteTzOffsetURL":			url = Inq.urls.getSiteTzOffsetURL; break;
											case "initFrameworkURL":			url = Inq.urls.initFrameworkURL; break;
											case "logDataURL":					url = Inq.urls.logDataURL; break;
											case "logJsPostURL":				url = Inq.urls.logJsPostURL; break;
											case "loggingURL":					url = Inq.urls.loggingURL; break;
											case "mediaBaseURL":				url = Inq.urls.mediaBaseURL; break;
											case "mediaRootURL":				url = Inq.urls.mediaRootURL; break;
											case "mediaSiteURL":				url = Inq.urls.mediaSiteURL; break;
											case "requestC2CImageURL":			url = Inq.urls.requestC2CImageURL; break;
											case "requestChatLaunchURL":		url = Inq.urls.requestChatLaunchURL; break;
											case "siteHostedFileURL":			url = Inq.urls.siteHostedFileURL; break;
											case "skinURL":						url = Inq.urls.skinURL; break;
											case "vanityURL":					url = Inq.urls.vanityURL; break;
											case "xFormsDomain":				/* url = Inq.urls.xFormsDomain; break; fall through */
											default:							url = Inq.urls.xFormsDomain; break
										}
										url += parts[5];
									};
									break;
								case "http://":
								case "https://":
								case "javascript:":
								case "#": url = parts[2]; break;							// The protocol is defined, set url to the entire URL (match item #2)
								case "//": url = proto + parts[2]; break;					// There is no protocol, add the protocol to the URL (match item #2)
								case "/": url = proto + "//" + domain + parts[2];break;		// There is no protocol or domain, add it to the URL (match item #2)
								default: url = path + "/" + parts[2]; break;
							}
							url = parts[1]+'=\"' + url + '\"';
							if (url != fix){
								html = html.replace(fix, url);
							}
						}
					}
					catch (e) {
						/* continue */
					}
				}
			}
			return html;
		}

		this.fixFormSubmit = function(xwin, headerData) {

			function collectFormData(form) {
				var data = [];
				for (var i = 0; i < form.length; i++) {
					var child = form[i];
					if (child.nodeName == "INPUT" || child.nodeName == "BUTTON") {
						if (child.name) {
							data.push(encodeURIComponent(child.name) + "=" + encodeURIComponent(child.value));
						}
					}
				}
				return data.join("&");
			}

			/**
			 * This function is bound to a form and this = form
			 */
			function overrideSubmit() {
				var method = this.method.toUpperCase();
				var url = (headerData.srcurl) ? headerData.srcurl + "&cbust=" + Math.floor(Math.random() * 1000011) : this.action;
				var data = collectFormData(this);
				var callback = function() { // Call a function when the state changes.
					if (this.readyState == XMLHttpRequestFacade.DONE && this.status == 200) {
						this.onreadystatechange = null;
						var html = normalizeHtml(this.responseText, url);
						html = fixDocumentRewriteBug(html, xwin);
						writeForm(xwin.document, html);
					}
				};

				var xdr = new XMLHttpRequestFacade();

				if (method == "POST") {
					xdr.open(method, url, true);
					// Send the proper header information along with the request
					xdr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					// TODO fix error messages for unsafe headers in chrome
					xdr.setRequestHeader("Content-Length", data.length);
					xdr.setRequestHeader("Connection", "keep-alive");
					xdr.onreadystatechange = callback;
					xdr.send(data);
				} else {
					xdr.open(method, url += "?" + data, true);
					xdr.onreadystatechange = callback;
					xdr.send();
				}
				return true;
			}

			var forms = xwin.document.getElementsByTagName("FORM");
			for (var i = 0; i < forms.length; i++) {
				forms[i].submit = overrideSubmit;
			}
		};

	};

	/**
	 * Static stuff
	 */
	XFormsLoader.instances = [];
	XFormsLoader.JSESSIONID = "ji";
	XFormsLoader.requestQueue = [];
	XFormsLoader.isGetSessionIdInProgress = false;			// used to make only one request of JSESSIONID in one time
	XFormsLoader.MAX_ATTEMPTS_COUNT = 3;

	/**
	 * Deletes global variables from a window scope.
	 * Necessary to overcome WebKit's peculiarity - it does not reset global variables when re-writing document. Other browsers do it.
	 */
	XFormsLoader.resetGlobalVars = function (win) {
		"use strict"; // in case we use "delete" operator here, it works differently in strict mode (throws an exception instead of returning "false")

		/** Returns window without custom properties. */
		function getCleanWindow(ijsfWin) {
			var cleanIFrame = ijsfWin.document.getElementById("cleanIFrame");
			if (!cleanIFrame) {
				cleanIFrame = ijsfWin.Inq.createHiddenIFrame("cleanIFrame");
				ijsfWin.document.body.appendChild(cleanIFrame);
			}
			var win = cleanIFrame.contentWindow;
			if (typeof win == "undefined" || win == null) {
				logError({message: "Failed to get clean window object"});
			}
			return win;
		}

		log("Resetting global variables to overcome WebKit's peculiarity");
		var cleanWindow = getCleanWindow(window);

		// Restore original XMLHttpRequest instance to avoid clobbering when reinitializing facade after cleanup
		if (win.XMLHttpRequestOriginal) {
			win.XMLHttpRequest = win.XMLHttpRequestOriginal;
			win.XMLHttpRequestOriginal = undefined;
		}

		for (var property in win) {
			if (win.hasOwnProperty(property) && typeof cleanWindow[property] == "undefined") { // is it a custom window property?
				try {
					// We set custom window's properties to undefined and
					// ensure that our code use [typeof window.foo != "undefined"] instead of  ["foo" in window] syntax,
					// because "delete window[property]" works only for specific window's properties.
					// For example, it cannot delete YAHOO variable, which prevents xformsPageLoadedServer() from running in Chrome 20 & 21.
					// Here is the article describing how "delete" operator works: http://perfectionkills.com/understanding-delete/
					win[property] = undefined;
				} catch (ex) {
					log("WARN: cannot delete global variable '" + property + "'");
				}
			}
		}
		if (typeof YAHOO != 'undefined') {
			logError({message: "Failed to delete the YAHOO global variable."});
		}
	};

	/**
	 * Get JSESSIONID from session cookies or create empty variable.
	 *
	 * @returns JSESSIONID or empty.
	 */
	XFormsLoader.initJsid = function () {
		var jsidVar = PM.getVar(XFormsLoader.JSESSIONID);
		if (!jsidVar) {
			jsidVar = (new Variable(XFormsLoader.JSESSIONID, "", resources["session"]));
			jsidVar.init();
			jsidVar.getValue();
			PM.addVar(jsidVar);
		}
		return jsidVar.getValue();
	};

	/**
	 * Persist JSESSIONID to session cookies.
	 *
	 * @param jsid JSESSIONID to persist
	 */
	XFormsLoader.persistJsid = function (jsid) {
		PM.getVar(XFormsLoader.JSESSIONID).setValue(jsid);
	};

	return XFormsLoader;

}();

	/**
	 * Cobrowse manager for framework.
	 * @class
	 * @constructor
	 * @borrows FrameworkModule#init as #init
	 * @see FrameworkModule
	 */
	function CobrowseMgr(id, config, cobrowseBannerText){
		this.cobrowseBannerText = cobrowseBannerText;
		this._frameworkModule(id);
        this._config = config;
	}
	
	MixIns.prepare(CobrowseMgr).mixIn(MixIns.FrameworkModule);
	
	/**
	 *  load - private function that loads the jQuery and the CBC (Co-Browse Client) javascript files
	 *		At completion of both loads then:
	 *		1) we initialize the cobrowse client
	 *		2) we set the cobrowse flag, stating that we are now using cobrowse
	 *		3) we then fire the optional handler (that was passed as an argument
	 * @param handler - function to be called after loading and initialization
	 */
	CobrowseMgr.prototype.load = function(handler) {
		if (CobrowseMgr.isSupported()) {
			var maskingConfig = this._config.cobrowseMaskingConfig;
			var isEmbeddedResource = this._config.isEmbeddedResource;
			var cobrowseBannerText = this.cobrowseBannerText;

			loadScript(urls.mediaRootURL, "/flash/jquery-1.11.1.js",  "/flash/jquery-1.11.1.min.js", function(greeting) {
				loadScript(urls.vanityURL, "/tagserver/cbc.js",  "/tagserver/cbc-min.js", function(greeting) {
					try {
						if (window["cobrowse"]) {
							window.cobrowse.initialize(maskingConfig, isEmbeddedResource, isIE(), cobrowseBannerText, CHM.isPersistentWindow());
						}
						CHM.setCobrowseFlag(true);
					} catch (e) {
						log("Cobrowse Initialization failed: " + e);
					}
					try {
						if (handler) {handler();}
					} catch (e) {
						log("Cobrowse load on demand failed: " + e);
					}
				}, handler);
			}, handler);
		}
	};
	
	/**
	 *  init - public function that that loads the cobrowse client system, if and only if:
	 *		1) we have enabled cobrowse on prior page visit
	 *		2) we have cobrowse enabled for this site
	 */
	CobrowseMgr.prototype.init = function() {
	/* In the near future, we will load the cobrowse code base on demand,
	 * At that time we will check to see if we have cobrowsed at init time as such
		if (CHM.getCobrowseFlag()){
			this.load();
		}
	 */
		this.load();
	};

	/**
	 *  runOnDemand - public function that that loads the cobrowse client system, if and only if it has not been loaded before
	 *		Its purpose is to load on demain.
	 *		When we accept any cobrowse invitation, we call this function
	 *	@see FlashPeer
	 *	@param handler - the method to be called on sucessful load and initialization of the cobrowse code base
	 */
	CobrowseMgr.prototype.runOnDemand = function(handler) {
		if (typeof (window.cobrowse) != "undefined"){
			handler();
		}
		else {
			this.load(handler);
		}
	};
		
    /**
        CobrowseMgr.isSupported
        return true if cobrowse is supported.
     */
    CobrowseMgr.isSupported = function() {
        var _isSupported = false;

        if ("Standard" === getDeviceType()) {
            _isSupported = true;
        }

        return _isSupported;
    };

	CobrowseMgr.prototype.start = function(){
		//place holder not used (defined by FrameworkModule).
	};
	
	CobrowseMgr.prototype.reset = function(){
		//place holder not used (defined by FrameworkModule).
    };
	

function AutomatonDT() {
}

    /**
     * add automaton's fields to data model
     * @param div automaton's div
     * @param dataToSend data model
     * @return names of selected checkboxes;
     */
    AutomatonDT.prototype.addDTEventFields = function (div, dataToSend) {
        var children = div.getElementsByTagName('input');
        var selectedCheckboxNames = [];
        for (var i = 0; i < children.length; i++) {
            var elem = children[i];
            if (elem.type == "checkbox") {
                dataToSend[elem.name] = "" + elem.checked;
                if (elem.checked) {
                    // save name of selected checkbox
                    selectedCheckboxNames[selectedCheckboxNames.length] = elem.name;
                }
            }
            else {
                dataToSend[elem.name] = "" + elem.value;
            }
        }
        return selectedCheckboxNames;
    };

    /**
    * Get answer text of clicked element (<a> or button)
    * @param button clicked element
    * @param div automaton's div
    */
    AutomatonDT.prototype.getAnswerText = function(button, div) {
        if (isNullOrUndefined(button)) {
            return null;
        }
        /* If we have an anchore, then get the innerHTML as the answer text
         * button.text does not exist for the link <A> on IE
         * innerHTML does on all targetted browsers.
         */                   
        if (button.nodeName == "A") {     
            return button.innerHTML;
        }
        if (!isNullOrUndefined(button.text)) {        
            return button.text;
        }

        if (!isNullOrUndefined(button.type)) {
            // button <input type='button'/>
            if (button.type == 'button') {
                // build answer like:
                // Submit ('Qwerty keyboard' 'email client' selected)
                // where:
                // Submit - button's name
                // 'Qwerty keyboard' 'email client' names of checked checkboxes
                var out = '';
                var children = div.getElementsByTagName('input');
                for (var i = 0; i < children.length; i++) {
                    var elem = children[i];
                    if (elem.type == "checkbox") {
                        if (elem.checked) {
                            if (out.length > 0) {
                                out +=" ";
                            }
                            out += "'" + elem.value + "'";
                        }
                    }
                }
                if (out.length == 0) {
                    out = "Nothing";
                }
                return  button.name + ' (' + out + ' selected)';
            }
        }
        return null;
    };
    /**
     * Send chat.automaton_response msg
     * @param eventName event name
     * @param button component with called this fuction
     * @param data parameters from chat.automaton_request msg
     */
    AutomatonDT.prototype.sendDTEvent = function (eventName, button, data) {
        try {
            /* define automaton's div */
            var div = document.getElementById(data.divId);

            var dataToSend = null;
            /* define automaton's data model */
            try {
                dataToSend = data.model;
            }
            catch (e) {
                log("sendDTEvent can't read data model " + e);
            }
            if (isNullOrUndefined(dataToSend)) {
                dataToSend = {};
            }
            /* read data only from parent component */
            var dataNode = button.parentNode;
            var selectedCheckboxNames = this.addDTEventFields(dataNode, dataToSend);

            // save element's name, it will be bold
            if (button) {
                data.selectedLinkName = button.name;
            }
            data.selectedCheckboxNames = selectedCheckboxNames;

            data.model = MixIns.JSON.stringify(dataToSend);

            var answerText = this.getAnswerText(button, div);
            if (answerText) {   
                data.answerText = answerText;
            }

            FP.sendDTEvent(eventName, data);
        }
        catch(e) {
            log("sendDTEvent error " + e);
        }
        return false;
    };

        /**
         * Singleton class that allows our exit chat to challenge customers before leaving a web page.
         * @class ExitConfirm is a singleton class that allows our exit chat to challenge customers before leaving a web page.
         */
        function ExitConfirm() {
            this._observable(); // contract with MixIn.Observable
            this.secondAttempt = false;
            this.enabled = false;
            this.masterEnabled = true;
            this.resetPromptTimer = '';
            this.USIdone = false;
            this.initialized = false;
            this._rule = null;
        }

        MixIns.prepare(ExitConfirm).mixIn(MixIns.Observable).mixIn(MixIns.RemoteCaller);

        ExitConfirm.prototype.isListener = function(l){
            return !!(l && ((l.onCancelExit && typeof l.onCancelExit == "function") ||
                (l.onBeforeExitConfirmation && typeof l.onBeforeExitConfirmation == "function")));
        };

        ExitConfirm.prototype.fireCancelExitEvent = function() {
            function f(l, evt) {
                try {
                    if (!!l.onCancelExit) {
                        l.onCancelExit(evt);
                    }
                } catch(e) {
                    log("Error firing event CancelExit on " + l.toString() + ":" + e);
                }
            }
			var event = {rule: this._rule};
            this._fireEvt(f, event);
        };

        ExitConfirm.prototype.onChatLaunched = function(evt) {
            this.setEnabled(false);
        };

        ExitConfirm.prototype.onChatClosed = function(evt) {
            this.setEnabled(true);
        };

        ExitConfirm.prototype.fireBeforeExitConfirmationEvent = function() {
            function f(l, evt) {
                try {
                    if (!!l.onBeforeExitConfirmation) {
                        l.onBeforeExitConfirmation(evt);
                    }
                } catch(e) {
                    log("Error firing event BeforeExitConfirmation on " + l.toString() + ":" + e);
                }
            }
			var event = {rule: this._rule};
            this._fireEvt(f, event);
        };

        ExitConfirm.prototype.tempDisable = function() {
            if (Inq.EC.isEnabled()) {
                Inq.EC.setEnabled(false);
                log('Exit Chat temporarily disabled');

                /* disable any existing timer */
                if(Inq.EC.resetPromptTimer != ''){
                    win.clearTimeout(Inq.EC.resetPromptTimer);
                }

                /* insert a timer to re-enable our exit chat after half a second if we are still on this page */
                Inq.EC.resetPromptTimer = win.setTimeout(Inq.EC.reEnable, 3000);
            }
        };

        ExitConfirm.prototype.disableExitChat = function() {
            Inq.EC.masterEnabled = false;
            return true;
        };

        ExitConfirm.prototype.reEnable = function() {
            if(!Inq.EC.USIdone) {
                Inq.EC.setEnabled(true);
            }
            Inq.EC.resetPromptTimer = '';
            log("re-enabled alert");
        };

        ExitConfirm.prototype.doActions = function(evt){
            /* IE only calls this when the user hits "cancel" in the onbeforeunload handler confirm dialog.
                FF will invoke this function regardless of user choice so we defer our ultimate actions
                for another second. The loaded race condition is that "if user proceeds to leave, the second wait
                is more than enough time to unload the document thus denying our timed invocation". If user cancels
                then our 1 sec wait is short enough to invoke our code (cancel was chosen). Either way... we wait 1 more second to
                weigh the race condition almost exclusively in favor of the "unload" when "ok" is confirmed to leave the page. */
            setTimeout(
                function(){
                    inqFrame.Inq.EC.fireCancelExitEvent();
                }
                , 1000
            );
        };

        ExitConfirm.prototype.doInit = function(rule, aTxt, image, cTxt, automatedAgent, businessUnitID,
                                                checkAgentAvailabilityInterval) {

            if (isServiceBlocked("POPUP")) {return;}
			this._rule = rule;

            var showImage = (image != null) && (isSafari() || isChrome());
            var imageWidth = 0;
            var imageHeight = 0;
            var imageElement;
            if (showImage) {
                imageElement = document.createElement("img");
                imageElement.src = urls.mediaSiteURL + '/images/' + image;
                imageElement.id = "ExitConfirmImage";
                imageElement.style.cssText = "position:absolute;top:0px;left:0px;"
                document.body.appendChild(imageElement); 
            }                

            /*
                automatedAgent should be true of false but when omitted it NOT be null or undef.
                if null or undef then it should be true so that an automated script acts as an agent
            */
            this._businessUnitID = businessUnitID;
            this._automatedAgent = ( !!automatedAgent === automatedAgent ? automatedAgent : !automatedAgent ) ;
            if(this._automatedAgent) {
                this.reEnable();
            } else {
                this.dataMap = {
                	buID: this._businessUnitID,
                    siteID: Inq.siteID,
                    brID: rule.id,
                    agentAttributes: rule.getAgentAttributes(),
                    ruleAttributes: rule.getRuleAttributes(),
                    agID: rule.getAgentGroupID()
                };

                if (checkAgentAvailabilityInterval) {
                    this.runAgentCheckTimer(checkAgentAvailabilityInterval);
                } else {
                    this.callRemote(Inq.urls.agentsAvailabilityCheckURL, this.dataMap);
                }
            }
            addListener(win.document.documentElement, "mousedown", this.tempDisable);
            addListener(win.document.documentElement, "click", this.tempDisable);
            addListener(win.document.documentElement, "keypress", this.tempDisable);
            addListener(win.document.documentElement, "submit", this.disableExitChat);
            win.v3Lander.prepareBeforeUnload(aTxt, cTxt, this.doActions, showImage, imageElement);

            if(this.initialized)
                throw "Single Use Exception. Exit Confirmation may only be used once per page for rules. Check for redundant rules of this type.";
            this.rule = rule;
            this.initialized = true;

            function addListener(element, eventName, handler) {
                if (element.addEventListener) {
                    // on target element maybe there is handler which stopped the bubbling of event: event.stopPropagation()
                    // in this case our handler will be not fired, therefore useCapture = true.
                    element.addEventListener(eventName, handler, true);
                } else if (iframe.attachEvent) {
                    element.attachEvent("on" + eventName, handler);
                }
            }
        };

        /**
         * Callback for agent availability check.
         * @param data JSON object with boolean field "AA" (shorthand for Agents Available).
         * 	"AA" is true if agents are available (HOP are checked as well) or availability check is off, false otherwise.
         */
        ExitConfirm.prototype.onRemoteCallback = function(jsonData){
            if (!isNullOrUndefined(jsonData) && !isNullOrUndefined(jsonData.availability) && !isNullOrUndefined(jsonData.inHOP)) {
                Inq.EC.setEnabled(jsonData.availability === "true" && jsonData.inHOP === "true");
            }
        };

        ExitConfirm.prototype.update = function(evt) {
            this.USIdone = true;
            /* disable any existing timer */
            if(this.resetPromptTimer != '') {
                clearTimeout(this.resetPromptTimer);
            }

            /* Suppress exit dialogs if a chat is in progress or we have already chatted with lower or
            	the same funnel level. */
            var ruleFL = this._rule.getConstant("fl", rule);
            if(Inq.ChatMgr.isChatInProgress() || (ruleFL && ruleFL >= PM.getVar("cfl").getValue())) {
                this.setEnabled(false);
            }

            return((this.masterEnabled == true) && (this.enabled == true));
        };

        ExitConfirm.prototype.isEnabled = function() {
            return this.enabled;
        };

        ExitConfirm.prototype.setEnabled = function(b) {
            this.enabled = b;
        };

        /** Starts a timer that would check agent availability and enable or disable EC. */
        ExitConfirm.prototype.runAgentCheckTimer = function(interval) {
            Inq.EC.callRemote(Inq.urls.agentsAvailabilityCheckURL, Inq.EC.dataMap);
            var launchString = "Inq.EC.runAgentCheckTimer(" + interval + ")";
            setTimeout(launchString, interval);
        };

		/**
		 * Returns true if ExitConfirm was initialized.
		 */
		ExitConfirm.prototype.isInitialized = function() {
			return this.initialized;
		};
	/**
	 * @class ExitHook allows setting general purpose page exit hook firing onBeforeUnload event when user
	 * inteds to leave the page. Any rule may subscribe to this event to perform its actions on page exit.
	 */
	function ExitHook() {
		this._observable(); // contract with MixIn.Observable
		this.initialized = false;
		this._rule = null;
	}

	MixIns.prepare(ExitHook).mixIn(MixIns.Observable);

	ExitHook.prototype.isListener = function(l) {
		return !!(l && (l.onBeforeUnload && typeof l.onBeforeUnload == "function"));
	};

	ExitHook.prototype.fireBeforeUnloadEvent = function() {
		function f(l, evt) {
			try {
				if (!!l.onBeforeUnload) {
					l.onBeforeUnload(evt);
				}
			} catch(e) {
				log("Error firing event BeforeUnload on " + l.toString() + ":" + e);
			}
		}

		var event = {rule: this._rule};
		this._fireEvt(f, event);
	};

	ExitHook.prototype.doInit = function(rule) {
		this._rule = rule;
		win.v3Lander.prepareBeforeUnloadForEH();
		this.initialized = true;
	};

	/**
	 * Returns true if ExitHook was initialized.
	 */
	ExitHook.prototype.isInitialized = function() {
		return this.initialized;
	};

	/**
	 * Initialize a global handler of beforeUnload event
	 *
	 * @deprecated according to RTDEV-10625
	 *
	 * This function/method was used for sending of beacon
	 * and according to RTDEV-10625 this function is not used
	 * because the sending of beacon mechanism was moved to the postToServer iframe
	 * to avoid limitations of CORS in IE9- and for synchronous requests.
	 * @see postToServer.js beaconUnloadController
	 */
	ExitHook.prototype.init = function() {
		if (Inq.FlashPeer.getIsSkinLocal && Inq.FlashPeer.getIsSkinLocal()) {
			//don't add listener to send beacon for CI preview
		} else {

			/**
			 * @see:http://jira.touchcommerce.com/browse/RTDEV-10626
			 * @description: unload and onbeforeunload event is not firing anymore in ios9
			 */
			if(/(iPad|iPhone).*OS 9/i.test( navigator.userAgent )) {
				attachListener(window, "pagehide", Inq.FlashPeer.sendBeacon);
			} else {
				attachListener(window, "beforeunload", Inq.FlashPeer.sendBeacon);
			}

		}
	};
/**
	 * Visitor Attributes Manager
	 * @class
	 * @constructor
	 * @name VAMgr
	 * @param {Object} id.
	 * @param {Object} data containing the programm and business visitor attributes.
	 * @borrows Absorber#absorb as #absorb
	 * @borrows FrameworkModule#init as #init
	 * @borrows FrameworkModule#start as #start
	 * @borrows FrameworkModule#reset as #reset
	 * @see Absorber
	 * @see FrameworkModule
	 */
function VAMgr(id, data){
	this._frameworkModule(id);
	this.absorb(data); /* Includes all instantiated visitor attributes */
	this._varTable = {};
	this._bActionable = true; // used for incrementality control
	this.currentVisitorAttributes = {};
	this.banned = {};
	this.hashed = {};
	this.storedValues = new MapVariable("VA",new Array(),resources.state);
	this.allowDynamic = true;
	this.crc32map = {};

	/*
     * We need this function to store in cookies only hash codes of banned Visitor Attributes.
     * Reasons of this minimization are limitation on cookie size 4K and fact that
     * we send cookies in each request.
     * F.E.: VA.crc32("Noteworthy Content Groups") is y85vk4
     * P.S.: Since with a 32 bit hash value there are only about 4 billion possible hashes,
     * then if you throw enough strings in, then you will eventually find two that have the same hash value.
     * The probability that any two strings will have the same hash value is 1:4,294,967,296 (about 1 in four billion).
     * With a larger number of strings, the probability rises. Checking collisions on 300,000 unique string called from some random dump
     * of a dictionary gives about seven collisions.
     * @param {String} str String for which we calculate CRC32
     * @return string with CRC32 hash code
     * @type String
     */
	this.crc32 = function( str ) {
		if (!this.crc32map[str]) {
			var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
			var crc = -1;
			var x = 0;
			var y = 0;
			for (var i = 0, iTop = str.length; i < iTop; i++) {
				y = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
				x = "0x" + table.substr( y * 9, 8 );
				crc = ( crc >>> 8 ) ^ x;
			}
			crc = crc ^ (-1);
			if (crc < 0)
			{
				crc = 0xFFFFFFFF + crc + 1;
			}
			this.crc32map[str] = "a" + ((crc).toString(36));
		}
		return this.crc32map[str];
	};

	this.test = function(visitorAttributes) {
		var result = false;
		for (var a in visitorAttributes) {
			if (this.currentVisitorAttributes[a]) {
				result = true;
				if (visitorAttributes[a].values) {
					if (this.currentVisitorAttributes[a].values) {
						for (var valueChecking in visitorAttributes[a].values) {
							if (!this.currentVisitorAttributes[a].values[valueChecking]) {
								return false;
							}
						}
					} else {
						result = false;
					}
				}
			}
		}
		return result;
	};

	this.checkBanDuration = function(attributeName) {
		var attr;
		var expiry;
		if ((attr = this.businessVisitorAttributes[attributeName]) || (attr = this.programVisitorAttributes[attributeName])) {
			var b = this.banned[this.crc32(attributeName)];
			if (b) {
				var currentTime = new Date().getTime();
				expiry = parseInt(b.d,36)*1000;
				if (!isNullOrUndefined(b.d) && (expiry > 0) && (expiry < currentTime)) {
					delete this.banned[this.crc32(attributeName)];
					attr.banAll = false;
				} else {
					for (var bannedValue in b) {
						if (bannedValue != 'd') {
							expiry = parseInt(b[bannedValue].d,36)*1000;
							if ((expiry > 0) && (expiry < currentTime)) {
								delete b[bannedValue];
							}
						}
					}
				}
			}
		}
	};

	/*
     * We add visitorAttributes to currentVisitorAttributes if attribute name and value exist in PVA or BVA
     * and are not banned. For attributes with mutuallyExclusive = true we should have only one value.
     * For allowDynamic mode we can have values not mentioned in PVA or BVA.
     * So the way we store visitor attributes depends on allowDynamic flag, e.g.
     * {"j1rid2":["1kwdjcl"],"y85vk4":[]} for allowDynamic = false and
     * {"j1rid2":["ANY VALUE"],"y85vk4":[]} for allowDynamic = true.
     * We cannot minimize dynamic values by hash because we don't have them in PVA or BVA.
     * @see #save
     * @param {Object} visitorAttributes associative array
     * @return void
     */
	this.add = function(visitorAttributes) {
		for (var a in visitorAttributes) {
			if(typeof visitorAttributes[a]=="function") continue;
			var attr;
			var val = null;
			if ((attr = this.businessVisitorAttributes[a]) || (attr = this.programVisitorAttributes[a])) {
				this.checkBanDuration(a);
				if (!attr.banAll) {

					for (var valueAdding in visitorAttributes[a].values) {
						if(typeof visitorAttributes[a].values[valueAdding]=="function") 
							continue;
						if (((attr.values[valueAdding] && !this.allowDynamic) || this.allowDynamic) &&
								!(this.banned[this.crc32(a)] &&  this.banned[this.crc32(a)][this.crc32(valueAdding)])) {

							if (!this.currentVisitorAttributes[a] || attr.mutuallyExclusive) {
								this.currentVisitorAttributes[a] = {};
								this.hashed[this.crc32(a)] = [];
								this.currentVisitorAttributes[a].values = {};
							}
							this.currentVisitorAttributes[a].values[valueAdding] = true;

							if (this.allowDynamic) {
								val = valueAdding;
							} else {
								val = this.crc32(valueAdding);

							}

							// repeated addition protection
							if (!this.hashed[this.crc32(a)].contains(val)) {
								this.hashed[this.crc32(a)].append([val]);
							}
						}
					}
				}
			}
			if(!!val)
				this.logData("visitorAttributeAdded",a,this.getAttributeValues(a,visitorAttributes));
		}
		this.save();
	};

	this.remove = function(visitorAttributes, fromRemoveAll) {
        var removedAttrs = new Array();
		for (var a in visitorAttributes) {
			if(typeof visitorAttributes[a]=="function" || this.isMutuallyExclusiveAttribute(a)) continue;
			if (this.currentVisitorAttributes[a]) {
				var hasNoValues = true;
				for (var valueRemoving in visitorAttributes[a].values) {
					if(typeof visitorAttributes[a].values[valueRemoving]=="function")
						continue;
					hasNoValues = false;
					removedAttrs.push(valueRemoving);
					if(this.currentVisitorAttributes[a].values[valueRemoving]) {
						delete this.currentVisitorAttributes[a].values[valueRemoving];
						var ind;
						if (this.allowDynamic) {
							ind = this.hashed[this.crc32(a)].indexOf(valueRemoving);
						} else {
							ind = this.hashed[this.crc32(a)].indexOf(this.crc32(valueRemoving));
						}
						this.hashed[this.crc32(a)].remove(ind);
                        if(Object.keys(this.currentVisitorAttributes[a].values).length == 0) {
                            delete this.currentVisitorAttributes[a];
                            delete this.hashed[this.crc32(a)];
                        }
					}
				}
				if (hasNoValues || fromRemoveAll) {
                    removedAttrs = this.getAttributeValues(a,this.currentVisitorAttributes);
					delete this.currentVisitorAttributes[a];
					delete this.hashed[this.crc32(a)];
				}
			}
			this.logData("visitorAttributeRemoved",a,removedAttrs);
		}
		this.save();
	};

	this.removeAll = function() {
		this.remove(this.currentVisitorAttributes, true);
	};

	/*
     * We store banned attributes as associative arrays of names and values hashes.
     * For each name and value we also store banning duration.
     * -1 means forever, others digits means time in seconds since midnight 1 January 1970 in 36 base number.
     * F.E.: {"j1rid2":{"d":-1,"1kwdjcl":{"d":-1}},"y85vk4":{"d":n6yt}}
     * @see #crc32
     * @param {Object} visitorAttributes associative array
     * @param {long} duration of banning action
     * @return void
     */
	this.ban = function(visitorAttributes, duration) {
		var sendlog = false;
		if (duration > 0) {
			duration = Math.ceil((new Date().getTime() + duration)/1000).toString(36);
		}
		for (var a in visitorAttributes) {
			if(typeof visitorAttributes[a]=="function" || this.isMutuallyExclusiveAttribute(a)) continue;
			var attr;
			var crc = this.crc32(a);
			if ((attr = this.businessVisitorAttributes[a]) || (attr = this.programVisitorAttributes[a])) {
				var banAll = true;
				if (visitorAttributes[a].values) {
					for (var valueBanning in visitorAttributes[a].values) {
						if(typeof visitorAttributes[a].values[valueBanning]=="function") 
							continue;
						banAll = false;
						if (this.allowDynamic || attr.values[valueBanning]) {
							if (this.currentVisitorAttributes[a] && this.currentVisitorAttributes[a].values && this.currentVisitorAttributes[a].values[valueBanning]) {
								delete this.currentVisitorAttributes[a].values[valueBanning];
								if (this.allowDynamic) {
									delete this.hashed[this.crc32(a)][valueBanning];
								} else {
									delete this.hashed[this.crc32(a)][this.crc32(valueBanning)];
								}
							}
							
							if(!this.banned[crc]) {
								this.banned[crc] = {};
							}
							// if any one attribute is not already banned then log it
							sendlog = true; 
							this.banned[crc][this.crc32(valueBanning)] = {
								"d":duration
							};
						}
					}
				}
				if (banAll) {
					sendlog = true;
					attr.banAll = true;
					delete this.currentVisitorAttributes[a];
					delete this.hashed[this.crc32(a)];
					this.banned[this.crc32(a)] = {
						"d":duration
					};
				}
			}
			if(sendlog)
				this.logData("visitorAttributeBanned",a,this.getAttributeValues(a,visitorAttributes));
		}
		this.save();
	};

	/*
     * We delete unbanned attributes from associative arrays of names and values hashes.
     * @see #ban
     * @param {Object} visitorAttributes associative array
     * @return void
     */
	this.unban = function(visitorAttributes) {
		for (var a in visitorAttributes) {
			if(typeof visitorAttributes[a]=="function" || this.isMutuallyExclusiveAttribute(a)) continue;
			var attr;
			if ((attr = this.businessVisitorAttributes[a]) || (attr = this.programVisitorAttributes[a])) {
				var unbanAll = true;
				if (visitorAttributes[a].values && this.banned[this.crc32(a)]) {
					for (var valueBanning in visitorAttributes[a].values) {
						if(typeof visitorAttributes[a].values[valueBanning]=="function") 
							continue;
						delete this.banned[this.crc32(a)][this.crc32(valueBanning)];
						unbanAll = false;
					}
				}
                if (!unbanAll) {
                    unbanAll = true; 
                    for (var bannedValue in this.banned[this.crc32(a)]) {
                        if (bannedValue != "d") {
                            unbanAll = false; 
                            break;
                        }
                    }
                }
				if (unbanAll) {
					attr.banAll = false;
					delete this.banned[this.crc32(a)];
				}
			}
			this.logData("visitorAttributeUnbanned",a,this.getAttributeValues(a,visitorAttributes));
		}
		this.save();
	};

	this.initBanned = function(visitorAttributes) {
		for(var a in visitorAttributes) {
			var attr = visitorAttributes[a];
			var crc = this.crc32(a);
			if(this.banned[crc]) {
				var banAll = true;
				for(var tmp in this.banned[crc]) {
					if (tmp != "d") {
						banAll = false;
						break;
					}
				}
				if (banAll) {
					attr.banAll = true;
				}
			}
		}
	};

	this.initHashed = function(visitorAttributes) {
		for(var a in visitorAttributes) {
			var attr = visitorAttributes[a];
			var crc = this.crc32(a);
			if(this.hashed[crc]) {
				this.currentVisitorAttributes[a] = {};
				this.currentVisitorAttributes[a].values = {};
				if (this.hashed[crc].length) {
					if (this.allowDynamic) {
						for(var i = 0; i < this.hashed[crc].length; i++) {
							valueAdding = this.hashed[crc][i];
							this.currentVisitorAttributes[a].values[valueAdding] = true;
						}
					} else {
						for (var valueAdding in attr.values) {
							if (this.hashed[crc][this.crc32(valueAdding)]) {
								this.currentVisitorAttributes[a].values[valueAdding] = true;
							}
						}
					}
				}
			}
		}
	};

	this.init = function() {
	};

	/*
     * We using this function to get attribute values from some source.
     * It is needed for logging and in 'each' function.
     * @param {String} a Visitor Attribute name
     * @param {Object=} source Visitor Attributes
     * @return Array
     * @return Array with Visitor Attribute  values from source
     * @type Array
     */
	this.getAttributeValues = function(a , source) {
		var values = [];
		if (source == null) {
			source = this.currentVisitorAttributes;
		}
		if (source[a]) {
			for(var value in source[a].values)  {
				values[values.length] = value;
			}
		}
		return values;
	};

	/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * @return Object with functions 'keys','values','each','clear,'set','get'
     * @type Object
     */
	this.getCopyAsMap = function(){
		var copy ={
			currentVisitorAttributes : this.currentVisitorAttributes,
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing keys method.
     */
			keys : function() {
				var keys = [];
				for(var a in this.currentVisitorAttributes) {
					keys[keys.length] = a;
				}
				return keys;
			},
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing values method.
     */
			values : function() {
				var values = [];
				for(var a in this.currentVisitorAttributes) {
					values[values.length] = this.get(a);
				}
				return values;
			},
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing each method.
     */
			each : function(func) {
				if (typeof func == "function") {
					for(var a in this.currentVisitorAttributes) {
						func(a,this.get(a),this);
					}
				}
			},
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing clear method.
     */
			clear : function() {
			},
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing set method.
     */
			set : function() {
			},
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing get method.
     */
			get : function(key) {
				var values = [];
				var cVatt = this.currentVisitorAttributes[key];
				if(!!cVatt && !!cVatt.values){
					for(var value in cVatt.values)  {
						values[values.length] = value;
					}
				}
				return values;
			},
			/*
     * We need this function to render current-visitor-attributes as ancecstor of abstract-map tag.
     * So, we implementing unset method.
     */
			unset : function() {
			}
		};
		return copy;
	};

	this.start = function() {
	};

	this.reset = function() {
	};

	this.load = function() {
		if(this.storedValues.getValue() == null) {
			this.storedValues.init();
		} else {
			this.banned = this.storedValues.getValue().get("ban");
			if(this.banned) {
					this.initBanned(this.businessVisitorAttributes);
					this.initBanned(this.programVisitorAttributes);
			} else {
				this.banned = {};
			}
			this.hashed = this.storedValues.getValue().get("hash");
			if(this.hashed) {
				this.initHashed(this.businessVisitorAttributes);
				this.initHashed(this.programVisitorAttributes);
			} else {
				this.hashed = {};
			}
		}
	};

	this.save = function() {
		this.storedValues.set("hash",this.hashed);
		this.storedValues.set("ban",this.banned);
	};

	this.onDataReady = function() {
		this.load();
	};

	this.getPersistentId = function() {
		return this.getID();
	};

	/**
     * Returns copy of VAs as array "name=value(s)" pairs.
     * For multivalued VAs values are separated by commas.
     * Every name and value(s) of returned array may optionally be URL encoded, this may be usefull if returned value
     * will further be passed as part of URL.
     * @param {boolean=} urlEncodingRequired if true, return value will be URL encoded.
     */
	this.getCopyAsArray = function(urlEncodingRequired) {
		var tmp = new Array();
		for(var attribute in this.currentVisitorAttributes) {
            var values = this.getAttributeValues(attribute);
            var keyValues = new Array(values.length);
            var attr = urlEncodingRequired ? encodeURIComponent(attribute) : attribute;
            for(var i = 0; i < values.length; i++) {
                var val = urlEncodingRequired ? encodeURIComponent(values[i]) : values[i];
                keyValues[i] = attr + ',' + val;
            }
			tmp[tmp.length] = keyValues.length > 0 ? keyValues.join(';') : (attr + ",");
		}
		return tmp;
	};

	this.logData = function(event,attribute,values) {
        var encodedValues = new Array(values.length);
		if(values.length > 0) {
			for(var i = 0; i < values.length; i++) {
				encodedValues[i] = encodeURIComponent(attribute) + "," + encodeURIComponent(values[i]);
			}
		} else {
			encodedValues.push(encodeURIComponent(attribute) + ",");
		}
		ROM.send(urls.logDataURL,{
			_domain:"customer",
			evt:event,
			siteID: Inq.siteID,
			incAssignmentID: getIncAssignmentID(),
			sessionID: getSessionID(),
			customerID:Inq.getCustID(),
			atts:encodedValues.join(";"),
			currentAtts:(this.getCopyAsArray(true).join(";"))
		});
	};

	this.testBanned = function(visitorAttribute) {
		var result = false;
		for (var a in visitorAttribute) {
			this.checkBanDuration(a);
			var attr = visitorAttribute[a];
			var crc = this.crc32(a);
			if(this.banned[crc]) {
				var banAll = true;
				for(var tmp in this.banned[crc]) {
					if (tmp != "d") {
						banAll = false;
						break;
					}
				}
				if (banAll) {
					result = true;
				} else {
					for (var valueBanning in attr.values) {
						if (this.banned[crc][this.crc32(valueBanning)]) {
							result = true;
							break;
						}
					}
				}
			}
		}
		return result;
	};

	this.toString=function(){
		return !!this.getCopyAsArray()?this.getCopyAsArray().toString():"";
	};

    this.isMutuallyExclusiveAttribute = function(attr){
        return attr == "mutuallyExclusive";
    };
};

MixIns.prepare(VAMgr).mixIn(MixIns.Persistable).mixIn(MixIns.FrameworkModule).mixIn(MixIns.Absorber);

	/**
	 * MessageMgr handles passing instructions between windows.  It
	 * abstracts us away from browser quirks and lets us set timeouts
	 * and have code evaluated in the desired window.
	 * 
	 * Create a new MessageMgr, and registers it as a listener for window
	 * messages.  Prevents bugs resulting from inconsistent state.
	 * HOWEVER, please note that
	 */
	function MessageMgr(w) {
		var self = this;
		this.window = (w) ? w : window;
		this.messageEnabled = this.enablePostMessage();
		if (this.messageEnabled) {
			try {
				this.window.addEventListener("message", function(message) {
					self.onMessage(message);
				});
			} catch (e) {
				log(e);
			}
		}
	}

    MessageMgr.prototype.enablePostMessage = function() {
		var deviceType = getDeviceType();
		return (deviceType === 'Phone' || deviceType === 'Tablet');
	}

    /**
	 * Eventually, this will be a list of available 'commands'
	 * that can be used with the MessageManager.
	 */
    MessageMgr.CMD_CLOSE_PERSISTENT = "CLOSE_PERSISTENT";

	/**
	 * Receives incoming messages and dispatches to setTimeout.  This
	 * method is registered as a callback in MessageMgr's constructor.
	 *
	 * @param message - Incoming window-level message
	 */
	MessageMgr.prototype.onMessage = function(message) {
		if (this.isSecure(message)) {
			// We're tunneling Message objects through the window's messages.
			// So, we need to pull out the json-ized messsage and turn it back
			// into a proper JS object.95
			switch (message.data) {	// the command is in the 'data' property of the incoming message.
			case MessageMgr.CMD_CLOSE_PERSISTENT:
				this.window.setTimeout("inqFrame.Inq.FlashPeer.CloseChatFromPersistent()", 0); // Spawn a new thread and exit.
				break;
			}
		}
		return true;
	}


    /**
	 * Security check to make sure that the messages we receive are 
	 * not malicious.
	 *
	 * @param message - message object from window
	 * @return - a Boolean indicating whether the message is secure.
	 */
    MessageMgr.prototype.isSecure = function(message) {
		var locs = this.getAuthorizedOrigins();
		var origin = this.parseUrl(message.origin);
		for (var i = 0; i < locs.length; i++) {
			var loc = this.parseUrl(locs[i]);
			if (loc.port == origin.port && loc.domain == origin.domain) {
				return true;
			}
		}

		return false;
	}

    /**
	 * Utility function to parse the protocol, domain, and port
	 * from a String URL.
	 */
    MessageMgr.prototype.parseUrl = function(string) {
		var m = string.match(/^(https?):\/\/([^\/:]+)(:?(\d*))/);
		var host = m[2];
		var domain = (host.indexOf('.') >= 0)	 // Sanity check.
			? host.split('.').slice(1).join('.') // Strip the host name.
			: host;								 // Default.
		return {
			protocol: m[1],
			domain: domain,
			port: (m[4] ? m[4] : 80)
		};
	}

    /**
	 * @return an array of Locaation objects with protocols, hosts,
	 * and ports of safe message origins.
	 */
    MessageMgr.prototype.getAuthorizedOrigins = function() {
		var locs = [];
		locs.push(this.window.location.href);
		locs.push(this.window.document.location.href);

		if (this.window.parent && (this.window.parent !== this.window)) {
			locs.push(this.window.parent.location.href);
			locs.push(this.window.parent.document.location.href);
		}

		if (this.window.opener) {
			locs.push(this.window.opener.location.href);
			locs.push(this.window.opener.document.location.href);
		}

		return locs;
	}
		
	/**
	 * Tell the target window that the persistent chat has closed.
	 *
	 * @param win - the window that should be told to close the persistent chat.
	 * @param targetHost (optional) - the expected host of the target window.
	 */
	MessageMgr.prototype.closePersistent = function(win, targetHost) {
		this.send(win, MessageMgr.CMD_CLOSE_PERSISTENT, targetHost);
	}
	

	/**
	 * Handles the actual packing and sending of the message, as well
	 * as outgoing security and data integrity checks. Abstracts other
	 * functions away from browser-specific considerations.
	 *
	 * @param win - the window to send the message to.
	 * @param command - the command to send.
	 * @param targetHost - the expected host of the target window.
	 */
    MessageMgr.prototype.send = function(win, command, targetHost) {
		if (!win) throw "Illegal argument: null 'win'";
		if (!command) throw "Illegal argument: null 'command'";
		var t = targetHost || "*"; // FIXME: Should this be required?
		if (this.messageEnabled) {		   
			win.postMessage(command, t);
		}
		else {
			win.Inq.MSG.onMessage({data: command, origin: this.window.location.href}) ;
		}
	}
	
function WatchDogMgr(){
    this.clients = [];
    this._className="WatchDogMgr";
}

/**
 * registerClient add new client to WatchDogManager for health check
 * @param clientID          string for identification of client
 * @param checkInterval     check interval in msec
 * @param isAliveCallback   callback function for health check (@see WDMClient.hx for prototype)
 * @param resetStateCallback callback function for reset client if not alive (@see WDMClient.hx)
 * @return void
 */
WatchDogMgr.prototype.registerClient = function(clientID, checkInterval, isAliveCallback, resetStateCallback) {
    this.unregisterClient(clientID);

    var client = new Object();
    client.id = clientID;
    client.checkInterval = checkInterval;
    client.isAlive = isAliveCallback;
    client.resetState = resetStateCallback;
    var me = this;
    client.timer = window.setInterval(function() {
        me.onProcessClient(client);
    }, checkInterval);

    this.clients.push(client);
}

/**
 * unregisterClient remove client from WatchDogManager
 * @param clientID          string for identification of client
 * @return void
 */
WatchDogMgr.prototype.unregisterClient = function (clientID) {
    for (var i = 0; i < this.clients.length; i++) {
         if (this.clients[i].id == clientID) {
             window.clearInterval(this.clients[i].timer);
             this.clients.splice(i, 1);
             return;
         }
    }
}

/**
 * onProcessClient calling from interval timer for check client health
 * @param client for check
 * @return void
 */
WatchDogMgr.prototype.onProcessClient = function(client) {
    try {
        if (client.isAlive) {
            if (!client.isAlive() && client.resetState) {
                Inq.FlashPeer.logInfo("Client " + client.id + " is not alive. Try to reset state");
                client.resetState();
            }
        }
    } catch (e) {
        Inq.FlashPeer.logError("Error WatchDogMgr.onProcessClient " + e);
    }
}

/**
 * Static field instance of the singleton WatchDogMgr
 */
WatchDogMgr.WDM = null;

/**
 * Create an instance of the WatchDogMgr. This singleton creation
 * pattern should ALWAYS be used by other objects instead of creating
 * a PM with its constructor.
 * @return a singleton instance of PersistenceMgr
 */
WatchDogMgr.getInstance = function() {
    if (WatchDogMgr.WDM == null) {
        WatchDogMgr.WDM = new WatchDogMgr();
    }
    return WatchDogMgr.WDM;
};


	/**
	 * Destination monitor - this is a service to monitor the actions on the page
	 * such as click on the anchor and refreshing page by pressing the button "F5".
	 * This is needed to monitor the navigation of customer to other page
	 * from current page by scanning the attribute "href" on the anchor.
	 */
	function DestinationMonitor() {
		this.KEY_F5 = 116;
		this.initialized = false;
		this.target = null;
	}

	/**
	 * Initialization of monitor. Starts the tracking of actions.
	 * Adding a listeners only on the parent window,
	 * because the opening of the link without target="_blank" attribute in the chat window
	 * leads to the reloading of the chat frame.
	 *
	 * We can't use listener for "click" event
	 * because according to specification "UI Events (formerly DOM Level 3 Events)":
	 *      C.1.1 Activation event order
	 *          If the DOMActivate event is supported by the user agent,
	 *          then the events MUST be dispatched in a set order relative to each other:
	 *          (with only pertinent events listed):
	 *              1. click
	 *              2. DOMActivate - default action, if supported by the user agent; synthesized; isTrusted="true"
	 *              3. All other default actions, including the activation behavior
	 *          If the focused element is activated by a key event,
	 *          then the following shows the typical sequence of events (with only pertinent events listed):
	 *              1. keydown - MUST be a key which can activate the element, such as the 'Enter' or ' ' key,
	 *                           or the element is not activated
	 *              2. click - default action; synthesized; isTrusted="true"
	 *              3. DOMActivate - default action, if supported by the user agent; synthesized; isTrusted="true"
	 *              4. All other default actions, including the activation behavior
	 *
	 * This description means that in our case (when DOMActivate this is unloading page)
	 * "onbeforeunload" event is invoked immidiately after click,
	 * and "onmessage" event is invoked after "onbeforeunload".
	 *
	 * Therefore we should use workaround to track other events which can leads to navigation on other URL, for example
	 * for "click" we have a following default action {@link http://www.w3.org/TR/DOM-Level-3-Events/#event-types-list}:
	 *      - for targets with an associated activation behavior, executes the activation behavior;
	 *      - for focusable targets, gives the element focus.
	 *
	 * Thus we can use "focusin" event to track the URL of the focused anchor.
	 * A page can be navigated to this URL.
	 * IMPORTANT:
	 *      Unfortunately, we can NOT be sure that the page has navigated to this URL and was not restarted
	 *      or the user is not returned back to the previous page.
	 * Also we can use "focusout" event to track the loss of focus from the anchor.
	 *
	 * But we can't use events "focus" and "blur" because these events is not bubbles,
	 * to add only one listener on the top wrapper element - document.
	 *
	 * Also we try to track keyboard events to catch a pressing of the F5 button that leads to the refresh of the page,
	 * but this hack works not in all browsers.
	 */
	DestinationMonitor.prototype.init = function() {
		if (isPersistentWindow()) {
			// is not needed to track actions in the persistent chat window
			return;
		}

		attachListener(doc, "keydown", this._keydownHandler, false);

		/* "focusin" event, but not supported in Firefox, therefore is used "focus" event with capture,
		 * but in IE8- there is no capture stage, but there is "focusin" event,
		 * therefore we use other way of listening in FF
		 */
		if (isFF()) {
			attachListener(doc, "focus", this._focusinMonitor, true);
		} else {
			attachListener(doc, "focusin", this._focusinMonitor, false);
		}

		/* "focusout" event, but not supported in Firefox, therefore is used "blur" event with capture,
		 * but in IE8- there is no capture stage, but there is "focusout" event,
		 * therefore we use other way of listening in FF
		 */
		if (isFF()) {
			attachListener(doc, "blur", this._focusoutMonitor, true);
		} else {
			attachListener(doc, "focusout", this._focusoutMonitor, false);
		}

		if (isSafari()) {
			/* Safari do not set the focus on clicked anchor element.
			 * @see RTDEV-11292
			 * @see WebKit Bug 26856 - AnchorElement, ButtonElement, InputButton and Document should fire focus event when it is clicked.
			 * @see Chromium Issue 388666: Focus anchor (A) elements on mousedown - Fixed, but only on Chromium branch.
			 *
			 * Therefore we should use workaround through listener on "mousedown".
			 */
			attachListener(doc, "mousedown", this._focusinMonitor, false);
		}

		this.initialized = true;
	};

	/**
	 * A function removes all listeners of the instance of DestinationMonitor.
	 */
	DestinationMonitor.prototype.reset = function() {
		if (this.initialized) {
			detachListener(doc, "keydown", this._keydownHandler, false);
			detachListener(doc, "focus", this._focusinMonitor, true);
			detachListener(doc, "focusin", this._focusinMonitor, false);
			detachListener(doc, "blur", this._focusoutMonitor, true);
			detachListener(doc, "focusout", this._focusoutMonitor, false);
			detachListener(doc, "mousedown", this._focusinMonitor, false); // It maybe in Safari
			this.initialized = false;
		}
	};

	/**
	 * Filters the target element and saves its destination URL.
	 * @see this.saveDestinationURL
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype.addTarget = function(e) {
		e = e || window.event;
		var target = this.filterTarget(e);
		if (target) {
			this.target = target;
			this.saveDestinationURL(target.href);
		}
	};

	/**
	 * Filters the target element and if its destination URL had been saved,
	 * then clears the value of destination URL in the object of beacon.
	 * @see this.clearDestinationURL
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype.removeTarget = function(e) {
		e = e || window.event;
		var target = this.filterTarget(e);
		if (target && this.target == target) {
			this.target = null;
			this.clearDestinationURL();
		}
	};

	/**
	 * Filter of the target element to get only anchor element (tag "A").
	 * Because we want to track only navigation through clicking on the anchor.
	 * Also checks that anchor has not empty attribute "href"
	 * and its attribute "target" is not equal "_blank".
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype.filterTarget = function(e) {
		var target = e.target || e.srcElement;
		if (target.tagName
			&& "A" == target.tagName.toUpperCase()
			&& target.href
			&& target.getAttribute("target") != "_blank") {
			return target;
		} else {
			return null;
		}
	};

	/**
	 * This is a service handler of "keydown" event.
	 * A function is used to attach the context of the instance of DestinationMonitor to the listener,
	 * because context is lost when listener is attached.
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype._keydownHandler = function(e) {
		if (DM) {
			DM.keydownHandler.apply(DM, arguments);
		}
	};

	/**
	 * This is a handler of "keydown" event.
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype.keydownHandler = function(e) {
		e = e || window.event;
		if (this.KEY_F5 == e.keyCode && !isSafari()) {
			/* Unfortunately this workaround works only in FF and Chrome, and not works in IE11.
			 * It means that in new versions of these browsers this behavior can be changed.
			 * In Safari in OSX and iOS the pressing on F5 not refreshes the page by default.
			 */
			this.clearDestinationURL();
		}
	};

	/**
	 * This is a service handler of "focusin" event.
	 * A function is used to attach the context of the instance of DestinationMonitor to the listener,
	 * because context is lost when listener is attached.
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype._focusinMonitor = function(e) {
		if (DM) {
			DM.focusinMonitor.apply(DM, arguments);
		}
	};

	/**
	 * This is a handler of "focusin" event.
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype.focusinMonitor = function(e) {
		this.addTarget(e);
	};

	/**
	 * This is a service handler of "focusout" event.
	 * A function is used to attach the context of the instance of DestinationMonitor to the listener,
	 * because context is lost when listener is attached.
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype._focusoutMonitor = function(e) {
		if (DM) {
			DM.focusoutMonitor.apply(DM, arguments);
		}
	};

	/**
	 * This is a handler of "focusout" event.
	 *
	 * @param {object} e - event object
	 */
	DestinationMonitor.prototype.focusoutMonitor = function(e) {
		this.removeTarget(e);
	};

	/**
	 * Save the value of destination URL in the object of beacon ("chat active beacon" in postToServer).
	 *
	 * @param {string} url
	 */
	DestinationMonitor.prototype.saveDestinationURL = function(url) {
		var chat = CHM.getChat();
		// In this case we expect that persistent chat should not depend on whether or not the opener window is closed
		if (chat && !CHM.isPersistentChat()) {
			CHM.setCABeacon(CHM.getChat().BEACON_DATA, {
				lastDestinationUrl: url
			});
		}
	};

	/**
	 * Clear the value of destination URL in the object of beacon.
	 * @see this.saveDestinationURL
	 */
	DestinationMonitor.prototype.clearDestinationURL = function() {
		this.saveDestinationURL("");
	};


	/**
	 * Public function
	 * API: Private function that returns the client window's IFRAME that launched the pop-out chat
	 * @param none
	 * @return window - the client window's IFRAME that launched the pop-out chat
	 */
	function getOpener(){ /* private function */
		var opener = null;
		if (isPersistentWindow()) {
			try {
				opener = (window.parent.opener && window.parent.opener.inqFrame)
						? window.parent.opener.inqFrame
						: ((window.opener) ? window.opener : null);
			} catch (e) {
				log("Error getting opener: " + e.message);
			}
		}
		return opener;
	}

    /**
     * frameworkCanRun- filter framework that selectively stops the IJSF from running
     * @param deviceType {string}: See http://stash.touchcommerce.com/projects/RT/repos/rt/browse/br30/src/test/resources/ProgramRules.xml#1687 for definitions
     * @param _3pcSupported {boolean}: set to true if the third party cookies are supported in the code context, false if 3pc is disabled.
     * @param _1pcSupported {boolean}: set to true if the first party cookies are supported in the code context, false if cookies are disabled.
     * @param xdActive {boolean}: set to true if xdMode is set, false if cookies are disabled.
     */
    var frameworkCanRun = site.frameworkCanRun;

	/**
	 * Public function
	 *  toJsString - Stringifies the given string value.
	 *     1) All special escape characters are escaped with back slash
	 *     2) If the optional quote is given, then it is put at beginning and end of string
	 *   called as:  toJsString(foo, "'");
	 *   or: toJsString(foo, '"');
	 *   or: toJsString(foo);
	 * 		Where foo is a string to be stringified (escaped and made into a JS String).
	 * @param val, value to be escaped
	 * @param quote, optional character (or string) to be used as a quote
	 */
	function toJsString(val, quote)	{
		var value = val ;
		value = value.split("\\").join("\\\\") ;
		value = value.split("\"").join("\\\"") ;
		value = value.split("\'").join("\\\'") ;
		value = value.split("\n").join("\\n") ;
		value = value.split("\r").join("\\r") ;
		value = value.split("\t").join("\\t") ;
		if (quote)
			value = quote + value + quote ;
		return value ;
	}

	/**
	 * Public function
	 *  formatArgument - Formats the argument into a somewhat readable format
	 * @param arg, is the object to be rendered readable
	 * @return string with the argument or argument description
	 */
	function formatArgument(arg) {
		try {
			var type = "[unknown]";
			try {type = (typeof(arg) == "object")?((arg["constructor"]!=null)?arg.constructor.toString():""+arg):("("+typeof(arg)+")");}
			catch (e){type=""+arg;}
			if (type.indexOf("function")!=-1){
				type = type.split("\n").join(" ").replace(/^\s*function (\w+)\s*\(\)[^\n]*/g , "[object $1]" );
			}
			if (type=="(boolean)" || type=="[object Boolean]") type = (arg)?"true":"false";
			if (type=="(string)" || type=="[object String]") type = toJsString(arg,"\"");
			if (type=="(number)") type = ""+arg;
			if (type=="(array)" || type=="[object Array]") {
			type = "";
			for (var ix=0; ix<arg.length;ix++) {
					type += ((type.length!=0)?",":"")+formatArgument(arg[ix]);
					if (type.length > 128) break;
			}
			if (type.length > 128)
					type = type.substr(0,128-3)+"...";
			return "["+type+"]";
			}
			return type;
		} catch(e){
			return "[argument]";
		}
	}

	function isSameOrigin() {
		try {
	        if(isPersistentWindow()){
	            if(window.parent.opener.Inq){ /**/
                    return true; /*note: in Chrome there is no exception is thrown and it always returns true, added additional check*/
                }else{
                    return false;
                }
            }
		}catch(err){
			return false;
		}
	}

	function getID() {
		return this._id;
	}

	function getCustID() {
		if (isNullOrUndefined(this.custID)) {
			// <customer-id/> is abstract-string thus returning string value here
			return "";
		} else {
			return this.custID;
		}
	}

    /**
     * @private
     * @returns {Object} current value of peristent customer id. Stored in session cookie.
     */
	function getPersistCustID() {
		return persistentCustomerID;
	}

    /**
     * @private
     * @param {Object} persistCustID value to set the peristent customer id. Automatically triggers a save to cookies (session).
     */
	function setPersistCustID(persistCustID) {
		persistentCustomerID = persistCustID;
		Inq.save(); /*@TODO: privatize the save function */
	}

	function getCustIP() {
		return this.custIP;
	}

	var siteID = site.siteID;

	function getSiteID() {
		return siteID;
	}

    var fileUploadSize = site.fileTransferSize;

	
	function getDefaultLanguage() {
		return site.language;
	}

    function getCiObfuscationLevel(){
        return parseInt(site.ciObfuscation);
    }

    function isJsDebugActive(){
        return site.JSDebugMode;
    }

    function isJsLoggingActive(){
        return !site.JSLoggingDisabled;
    }

    function getDefaultAgentGroupId(){
        return site.defaultAgentGroup;
    }

	function getSessionID() {
		var sesVar = PM.getVar("sesID");
		return sesVar ? sesVar.getValue() : "";
	}

    function getIncAssignmentID() {
        var incAssignmentID = PM.getVar("incID");
        return incAssignmentID ? incAssignmentID.getValue() : "";
    }

    function getIncGroupID() {
        var inqGroupID = PM.getVar("incGroup");
        return inqGroupID ? inqGroupID.getValue() : "";
    }

    
    var getDefaultBusinessUnitID = site.getDefaultBusinessUnitID;

    /**
     *   TC has only 4 fixed devicetypes;
     *      Unsupported, Tablet, Phone, Standard
     *      Standard is default device type.
     */
    var deviceType = "Standard";

    
    function setDeviceType(newDeviceType) {
        deviceType = newDeviceType;
    }

	
	function getDeviceType() {
        return deviceType;
    }

    
	function isDeviceType(type) {
		return type == getDeviceType();
	}

	
	var clntLag;

	
	function getClientTimeLag(){
		return clntLag;
	}

	
	var siteTzID = site.timezoneID;

	
	var siteTzOffset;

	
	var scheduleTZs = {};

	
	function getSiteTZOffset() {
		return siteTzOffset;
	}

	
	function isTZRequestRequired() {
		if ((!isEmptyObject(businessSchedules) || !isEmptyObject(programSchedules)) && isNullOrUndefined(siteTzOffset))
			return true;
		else return false;
	}

	
	function isSchMet(scheduleId) {
		if (schedules[scheduleId]) {
			schedules[scheduleId].tzOffset = scheduleTZs[schedules[scheduleId].timezone];
		} 
		return (schedules[scheduleId] && schedules[scheduleId].isScheduleMet(
				new Date(), getClientTimeLag(), getSiteTZOffset()));
	}

	function processCustomerApiRegistry() {
		Inq.overridePageID = (!!win.inqSiteID) ? win.inqSiteID : -1;
		var registry = isNullOrUndefined(window.parent.InqRegistry) ? {} : window.parent.InqRegistry;

		// add all customer listeners
		var listeners = [];
		if(!isNullOrUndefined(registry.chatListeners)) {
			listeners.append(registry.chatListeners);
		}
		if(!isNullOrUndefined(registry.saleListeners)) {
			listeners.append(registry.saleListeners);
		}
		if(!isNullOrUndefined(registry.incrementalityListeners)) {
			listeners.append(registry.incrementalityListeners);
		}
		if(!isNullOrUndefined(registry.listeners)) {
			listeners.append(registry.listeners);
		}

		// add a flag to each listener so that Observables can limit what they send
		for(var x=0; x< listeners.length; x++) {
			listeners[x].custApi = true;
		}
		EVM.addListeners(listeners);

		// block services at customer request
		if(!isNullOrUndefined(registry.disableChat) && registry.disableChat == true) {
			blockService(CHM.CHAT_TYPES.POPUP, 0);
		}
		if(!isNullOrUndefined(registry.disableC2C) && registry.disableC2C == true) {
			blockService(CHM.CHAT_TYPES.C2C, 0);
		}
	}


	function initMgrs(mgrList) {
		PM.addVars(programVars);
		PM.addVars(businessVars);
		var table = BRM.getRuleVarTable();
		for(var ruleID in table){
			if( !!table[ruleID] ){
				PM.addVars(table[ruleID]);
			}
		}

		// call init on all mgrs
		for (var m in mgrList) {
			try {
				if(mgrList[m].init){
					mgrList[m].init();
				}
			} catch(e) {
				log(e);
				// just continue looping through all objects that have init methods
			}
		}
	}

	function startMgrs(mgrList) {
		// now start them all up
		for (var m in mgrList) {
			try {
				if (mgrList[m].start) {
					mgrList[m].start();
				}
			} catch(e) {
				log(e);
			}
		}
	}

	/**
	 * Iterate through the list of Mgr components within the Inq object,
	 * calling their start() methods. The start() method gives every component
	 * an opportunity to generate any events that are necessary
	 */
	function start() {
		if (!this.isFrameworkReady()) { return; } // start will be called later by a callback
		if(this.started) { return; }
		this.started = true;

		EVM.addObservables(mgrList);
		EVM.addObservables([EC]);
		EVM.addObservables([EH]);
		EVM.addListeners(mgrList);
		EVM.addListeners([EC]);
		EVM.addCustomEvents([
		new CustomEvent({
			name: "NewSession",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ sessionID: getSessionID() ,  loyalty: PM.getVar("loyalty",rule).getValue() ,  timestamp: new Date() }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "SaleLanding",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ products: (exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null)) ,  quantities: (exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null)) ,  prices: (exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null)) ,  productTypes: (exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null)) ,  products2: (exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : (exists(function(){ return window.parent.inqSalesProducts2 ;}, false, true)  ? window.parent.inqSalesProducts2 : null)) ,  quantities2: (exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : (exists(function(){ return window.parent.inqSalesQuantities2 ;}, false, true)  ? window.parent.inqSalesQuantities2 : null)) ,  prices2: (exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : (exists(function(){ return window.parent.inqSalesPrices2 ;}, false, true)  ? window.parent.inqSalesPrices2 : null)) ,  productTypes2: (exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : (exists(function(){ return window.parent.inqSalesProductTypes2 ;}, false, true)  ? window.parent.inqSalesProductTypes2 : null)) ,  orderType: (exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null)) ,  lc: PM.getVar("saleLC",rule).getValue() ,  customerID: Inq.getCustID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) }).absorb(evt);
			},
			aliases:[
				{
					name: "onSaleEvent",
					getEvtData: function(rule, evt) {
						return { products: (exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null)) ,  quantities: (exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null)) ,  prices: (exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null)) ,  productTypes: (exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null)) ,  total: 	FM.callExternal("saleValue")
 ,  products2: (exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : (exists(function(){ return window.parent.inqSalesProducts2 ;}, false, true)  ? window.parent.inqSalesProducts2 : null)) ,  quantities2: (exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : (exists(function(){ return window.parent.inqSalesQuantities2 ;}, false, true)  ? window.parent.inqSalesQuantities2 : null)) ,  prices2: (exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : (exists(function(){ return window.parent.inqSalesPrices2 ;}, false, true)  ? window.parent.inqSalesPrices2 : null)) ,  productTypes2: (exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : (exists(function(){ return window.parent.inqSalesProductTypes2 ;}, false, true)  ? window.parent.inqSalesProductTypes2 : null)) ,  orderType: (exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null)) ,  lc: PM.getVar("saleLC",rule).getValue() ,  customerID: Inq.getCustID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) };
					}
				}
			]
		}),
		
		new CustomEvent({
			name: "Assisted",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ agentID: CHM.getAgentID() ,  chatID: CHM.getChatID() ,  customerID: Inq.getCustID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) }).absorb(evt);
			},
			aliases:[
				{
					name: "onSaleQualifiedEvent",
					getEvtData: function(rule, evt) {
						return { agentID: PM.getVar("assistAgt",rule).getValue() ,  chatID: PM.getVar("assistChatID",rule).getValue() ,  customerID: Inq.getCustID() ,  bizRuleName: PM.getVar("asstRuleName",rule).getValue() ,  chatType: CHM.getChatType() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) };
					}
				}
			]
		}),
		
		new CustomEvent({
			name: "Converted",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ saleID: PM.getVar("saleID",rule).getValue() ,  agentID: PM.getVar("assistAgt",rule).getValue() ,  chatID: PM.getVar("assistChatID",rule).getValue() ,  customerID: Inq.getCustID() ,  products: (exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null)) ,  quantities: (exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null)) ,  prices: (exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null)) ,  productTypes: (exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null)) ,  products2: (exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : (exists(function(){ return window.parent.inqSalesProducts2 ;}, false, true)  ? window.parent.inqSalesProducts2 : null)) ,  quantities2: (exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : (exists(function(){ return window.parent.inqSalesQuantities2 ;}, false, true)  ? window.parent.inqSalesQuantities2 : null)) ,  prices2: (exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : (exists(function(){ return window.parent.inqSalesPrices2 ;}, false, true)  ? window.parent.inqSalesPrices2 : null)) ,  productTypes2: (exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : (exists(function(){ return window.parent.inqSalesProductTypes2 ;}, false, true)  ? window.parent.inqSalesProductTypes2 : null)) ,  orderType: (exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null)) ,  lc: PM.getVar("saleLC",rule).getValue() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) }).absorb(evt);
			},
			aliases:[
				{
					name: "onSoldEvent",
					getEvtData: function(rule, evt) {
						return { saleID: PM.getVar("saleID",rule).getValue() ,  agentID: PM.getVar("assistAgt",rule).getValue() ,  chatID: PM.getVar("assistChatID",rule).getValue() ,  customerID: Inq.getCustID() ,  chatType: CHM.getChatType() ,  products: (exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null)) ,  quantities: (exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null)) ,  prices: (exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null)) ,  productTypes: (exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null)) ,  products2: (exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : (exists(function(){ return window.parent.inqSalesProducts2 ;}, false, true)  ? window.parent.inqSalesProducts2 : null)) ,  quantities2: (exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : (exists(function(){ return window.parent.inqSalesQuantities2 ;}, false, true)  ? window.parent.inqSalesQuantities2 : null)) ,  prices2: (exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : (exists(function(){ return window.parent.inqSalesPrices2 ;}, false, true)  ? window.parent.inqSalesPrices2 : null)) ,  productTypes2: (exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : (exists(function(){ return window.parent.inqSalesProductTypes2 ;}, false, true)  ? window.parent.inqSalesProductTypes2 : null)) ,  orderType: (exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null)) ,  lc: PM.getVar("saleLC",rule).getValue() ,  bizRuleName: PM.getVar("asstRuleName",rule).getValue() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) };
					}
				}
			]
		}),
		
		new CustomEvent({
			name: "CustomerHostDomainResolved",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ hostName: PM.getVar("custHost",rule).getValue() ,  ip: Inq.getCustIP() }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "SaleStateTransition",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ chatID: CHM.getChatID() ,  customerID: Inq.getCustID() ,  oldAssistChatID: PM.getVar("oldAssistChatID",rule).getValue() ,  oldAssistDT: PM.getVar("oldAssistDT",rule).getValue() ,  oldAssistAgt: PM.getVar("oldAssistAgt",rule).getValue() ,  oldAsstRuleID: PM.getVar("oldAsstRuleID",rule).getValue() ,  oldAsstRuleName: PM.getVar("oldAsstRuleName",rule).getValue() ,  oldSaleState: PM.getVar("oldSaleState",rule).getValue() ,  oldIncState: PM.getVar("oldIncState",rule).getValue() ,  oldSaleID: PM.getVar("oldSaleID",rule).getValue() ,  oldSoldDT: PM.getVar("oldSoldDT",rule).getValue() ,  assistChatID: PM.getVar("assistChatID",rule).getValue() ,  assistDT: PM.getVar("assistDT",rule).getValue() ,  assistAgt: PM.getVar("assistAgt",rule).getValue() ,  asstRuleID: PM.getVar("asstRuleID",rule).getValue() ,  asstRuleName: PM.getVar("asstRuleName",rule).getValue() ,  saleState: PM.getVar("saleState",rule).getValue() ,  incState: PM.getVar("incState",rule).getValue() ,  saleID: PM.getVar("saleID",rule).getValue() ,  soldDT: PM.getVar("soldDT",rule).getValue() }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "EligibleEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  group: PM.getVar("incGroup",rule).getValue() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) }).absorb(evt);
			},
			aliases:[
				{
					name: "onGroupAssignment",
					getEvtData: function(rule, evt) {
						return { customerID: Inq.getCustID() ,  group: PM.getVar("incGroup",rule).getValue() };
					}
				}
			]
		}),
		
		new CustomEvent({
			name: "TargetedEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  group: PM.getVar("incGroup",rule).getValue() ,  brID: CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID()) ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) }).absorb(evt);
			},
			aliases:[
				{
					name: "onTargeted",
					getEvtData: function(rule, evt) {
						return { customerID: Inq.getCustID() ,  group: PM.getVar("incGroup",rule).getValue() ,  bizRuleName: rule.evt.rule.name ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) };
					}
				}
			]
		}),
		
		new CustomEvent({
			name: "ExposedEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  brID: CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID()) ,  chatID: CHM.getChatID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "EngagedEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  brID: CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID()) ,  chatID: CHM.getChatID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "InteractedEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  brID: CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID()) ,  chatID: CHM.getChatID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  type: CHM.getConversionType() }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "AssistedEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  brID: CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID()) ,  chatID: CHM.getChatID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  type: CHM.getConversionType() }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "ConvertedEvent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  pageID: LDM.getPageID(0) ,  customerID: Inq.getCustID() ,  incrementalityID: getIncAssignmentID() ,  sessionID: getSessionID() ,  group: PM.getVar("incGroup",rule).getValue() ,  products: (exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : null) ,  quantities: (exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : null) ,  prices: (exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : null) ,  productTypes: (exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : null) ,  products2: (exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : null) ,  quantities2: (exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : null) ,  prices2: (exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : null) ,  productTypes2: (exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : null) ,  orderType: (exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : null) ,  orderID: (exists(function(){ return safe("inqClientOrderNum") ;}, false, true)  ? safe("inqClientOrderNum") : null) ,  clientTimestamp: (exists(function(){ return safe("inqClientTimeStamp") ;}, false, true)  ? safe("inqClientTimeStamp") : null) ,  testOrder: (exists(function(){ return safe("inqTestOrder") ;}, false, true)  ? safe("inqTestOrder") : null) ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  total: 	FM.callExternal("saleValue")
 ,  agentGroupID: CHM.getAgentGroupID(evt, false) }).absorb(evt);
			},
			aliases:[
				{
					name: "onConversion",
					getEvtData: function(rule, evt) {
						return { customerID: Inq.getCustID() ,  group: PM.getVar("incGroup",rule).getValue() ,  bizRuleName: PM.getVar("asstRuleName",rule).getValue() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) };
					}
				}
			]
		}),
		
		new CustomEvent({
			name: "SurveyLaunched",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ siteID: getSiteID() ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  agentGroupID: CHM.getAgentGroupID(evt, false) }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "PreChatSurveyComplete",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "IncStateFunnelTransition",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ newState: "to be set by firing rule" }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "IframeC2C",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({ c2cIFrameDomainName: getConstant("C2C_IFRAME_DOMAIN_NAME", rule) ,  queryData: "{}" }).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "ChatMinimized",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "ChatRestored",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "ChatTranscriptEmailedToCustomer",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		})]);
		EVM.addCustomEvents(businessCustomEvents);
		PM.fireDataReady(); // this must happen before the init/start calls on mgrs
		processCustomerApiRegistry();
		initMgrs(mgrList);

		// This call must be done after initialization of BRMgr to make sure rules triggers are already initialized.
		EVM.addListeners(BRM.getRules());

		startMgrs(mgrList);
	}

	function onDataReady(data) {
		if (this.dataReady) {return;}
		this.dataReady = true;


        this.load();
	}

	function load() {
		var vitalVar = new Variable(this.getID(), {}, resources["vital"]);
		var vitalData = vitalVar.getValue();
		if(vitalData) {
			if (vitalData.clntLag) {
				clntLag = vitalData.clntLag;
				delete vitalData.clntLag;
			}
			this.absorb(vitalData);
		}
        var persistDataVar = new Variable("pcID", {}, resources["session"]);
        var persistCustID = persistDataVar.getValue();
        if(persistCustID){
            setPersistCustID(persistCustID);
        }
		var siteTzOffsetVar = new Variable("siteTzOffset", null, resources["session"], "tzOf");
		siteTzOffset = siteTzOffsetVar.getValue();
	}

	function save() {
		var vitalVar = new Variable(this.getID(), {}, resources["vital"]);
        var persistDataVar = new Variable("pcID", {}, resources["session"]);
		var vitalData = {
			custID: this.getCustID(),
			custIP: this.getCustIP()
		};
		if (getClientTimeLag()) {
			vitalData.clntLag = getClientTimeLag();
		}
        var persistCustID = getPersistCustID();
		if (persistCustID) {
            persistDataVar.setValue(persistCustID);
		}
		vitalVar.setValue(vitalData);

		if (!isNullOrUndefined(siteTzOffset)) {
			var siteTzOffsetVar = new Variable("siteTzOffset", 0, resources["session"], "tzOf");
			siteTzOffsetVar.setValue(siteTzOffset);
		}
	}

	function isDataReady() {
		return this.dataReady;
	}

	function setFrameworkData(data) {
		if (!isNullOrUndefined(data["siteTzOffset"])) {
			siteTzOffset = data["siteTzOffset"];
			delete data["siteTzOffset"];
		}

		if (!isNullOrUndefined(data["scheduleTZs"])) {
			scheduleTZs = data["scheduleTZs"];
			delete data["scheduleTZs"];
		}
		
		this.absorb(data);

		
		if (data.serverTime) {
			clntLag = data.serverTime - (new Date()).getTime();

			
			if (Math.abs(clntLag) < 1000) clntLag = undefined;
		}

		this.save();
	}

	function getDFV(dfvID){
		return dfvs[dfvID];
	}

    function getInitialDFV(){
        var result = null;
        for(name in dfvs) {
            var dfv = dfvs[name];
            if(dfv.initial){
                result = dfv;
            }
        }
        return result;
    }

	function isThirdPartyCookiesEnabled(){
		return this.thirdPartyCookiesEnabled;
	}


	function isFrameworkReady() {
		var isReady = true;

		// do we have a valid customerID?
		var id = this.getCustID();
		if (isNullOrUndefined(id) || id == "" || id == "0") { isReady = false; }
		// check other criteria here
		// set isReady to false if a criteria isn't met
		return isReady;
	}

	/**
	 * Block a chat/call service for a specific duration
	 * @param serviceType one of ChatMgr.CHAT_TYPES
	 *  POPUP, POPUP_CALL, C2C, C2CALL
	 * @param duration period in ms or -1 for "forever", 0 for "visit" or "session"
	 */
	function blockService(serviceType, duration) {
		switch(serviceType) {
		case CHM.CHAT_TYPES.POPUP:
		case CHM.CHAT_TYPES.POPUP_CALL:
			CHM.blockService(serviceType, duration);
			break;
		case CHM.CHAT_TYPES.C2C:
		case CHM.CHAT_TYPES.C2CALL:
			C2CM.blockService(serviceType, duration);
			break;
		case "ALL":
			CHM.blockService(CHM.CHAT_TYPES.POPUP, duration);
			CHM.blockService(CHM.CHAT_TYPES.POPUP_CALL, duration);
			C2CM.blockService(CHM.CHAT_TYPES.C2C, duration);
			C2CM.blockService(CHM.CHAT_TYPES.C2CALL, duration);
			break;
		default:
			break;
		}
	}

	function blockServices(services, duration) {
		for(var service in services){
			blockService(services[service], duration);
		}
	}

	var rule = null;
	function getConstant(constantID, rule){
		if(rule){
			return rule.getConstant(constantID);
		}
		return constants[constantID];
	}

	function unblockServices(services) {
		for(var service in services){
			unblockService(services[service]);
		}
	}

	function unblockService(serviceType) {
		switch(serviceType) {
		case CHM.CHAT_TYPES.POPUP:
		case CHM.CHAT_TYPES.POPUP_CALL:
			CHM.unblockService(serviceType);
			break;
		case CHM.CHAT_TYPES.C2C:
		case CHM.CHAT_TYPES.C2CALL:
			C2CM.unblockService(serviceType);
			break;
		case "ALL":
			CHM.unblockService(CHM.CHAT_TYPES.POPUP);
			CHM.unblockService(CHM.CHAT_TYPES.POPUP_CALL);
			C2CM.unblockService(CHM.CHAT_TYPES.C2C);
			C2CM.unblockService(CHM.CHAT_TYPES.C2CALL);
			break;
		default:
			break;
		}
	}
	function doBusinessRuleActionList(actionId, rule, evt) {
		var action = BusinessRuleActionLists[actionId];
		if (!isNullOrUndefined(action)) {
			action(rule, evt);
		}
		else {
			log("Can't find BusinessRule Action List " + actionId);
		}
	}
	function doRuleActionList(actionId, rule, evt) {
		var action = RuleActionLists[actionId];
		if (!isNullOrUndefined(action)) {
			action(rule, evt);
		}
		else {
			log("Can't find Rule Action List " + actionId);
		}
	}
	function isServiceBlocked(serviceType) {
		switch(serviceType) {
			case CHM.CHAT_TYPES.POPUP:
			case CHM.CHAT_TYPES.POPUP_CALL:
				return CHM.isBlocked(serviceType);
			case CHM.CHAT_TYPES.C2C:
			case CHM.CHAT_TYPES.C2CALL:
				return C2CM.isBlocked(serviceType);
			case "ANY":
				return CHM.isAnyBlocked() || C2CM.isAnyBlocked();
			default:
				return false;
		}
	}

    function getBlockedServicesList(){
        var result = [];
        if(inqFrame.Inq.C2CM.isBlocked(inqFrame.Inq.CHM.CHAT_TYPES.C2CALL)){
            result.push(inqFrame.Inq.CHM.CHAT_TYPES.C2CALL);
        }
        if(inqFrame.Inq.C2CM.isBlocked(inqFrame.Inq.CHM.CHAT_TYPES.C2C)){
            result.push(inqFrame.Inq.CHM.CHAT_TYPES.C2C);
        }
        if(inqFrame.Inq.CHM.isBlocked(inqFrame.Inq.CHM.CHAT_TYPES.POPUP)){
            result.push(inqFrame.Inq.CHM.CHAT_TYPES.POPUP);
        }
        if(inqFrame.Inq.CHM.isBlocked(inqFrame.Inq.CHM.CHAT_TYPES.POPUP_CALL)){
            result.push(inqFrame.Inq.CHM.CHAT_TYPES.POPUP_CALL);
        }
        return result;
    }

	function createFloatingDiv (_id, _x, _y, _w, _h){
		try{
			var obj=document.createElement('div');
			obj.style.position = "absolute";
			obj.style.width = _w?_w:0;
			obj.style.height = _h?_h:0;
			obj.style.left = _x?_x+"px":0;
			obj.style.top = _y?_y+"px":0;
			obj.style.zIndex = 99;
			obj.style.display = "none";
			obj.style.padding = 0;
			obj.style.margin = 0;
			obj.id = _id;
			document.getElementsByTagName("body")[0].appendChild(obj);
		} catch (E){
			this.debug("Could not create div element.");
		}
		return document.getElementById(_id);
	}

	function createHiddenIFrame(_id, _x, _y, _w, _h) {
		try {
			var obj = document.createElement('iframe');
			obj.style.position = "absolute";
			obj.style.width = _w ? _w : 0;
			obj.style.height = _h ? _h : 0;
			obj.style.left = _x ? _x + "px" : 0;
			obj.style.top = _y ? _y + "px" : 0;
			obj.style.zIndex = 99;
			obj.style.display = "none";
			obj.style.padding = 0;
			obj.style.margin = 0;
			obj.id = _id;
			obj.name = _id;
			return obj;
		} catch (E) {
			this.debug("Could not create div element.");
		}
		return null;
	}

	function wasSaleAction() {
		try {
			var par = PM.getVar("saleState", null).getValue();
			var con = getConstant("SALE_STATE_CONVERTED",null);
			return par == con;
		}
		catch (e) {

		}
	return false;
	}
	function  executeCustomCommand(params) {
		if(!isNullOrUndefined(params)) {
			try {
				// replace '({' to '{' , '})' to '}'
				params = params.replace(/\({/g, "{").replace(/}\)/g, "}");

				var inParams = MixIns.JSON.parse(params);
				var cmdType = inParams.cmdType;
				var cmdParam = inParams.cmdParam;
				switch (cmdType) {
					case 'block-service':
						blockService(cmdParam.serviceType, cmdParam.period);
						break;
					default:
						log("Unknown command " + cmdType + ", parameters : " + cmdParam);
				}
			}
			catch(ex) {
				log("Error execute command " + params + ", " + ex);
			}
		}
	}


	function initXD(){
		CM.init();
		CM.requestCookie(); //see callback at IFrameProxyCallback()
	}

	/**
	 * This method parses XD mode cookie data <name-string> map to <name-object> map
	 * while stripping off the trailing _<siteid> from the names of each cookie object.
	 */
	function parseCookieData(data){
        var retval = {};

        // Build list of Cookie names
        var cookieRes = [];
        for (var res in resources){
            try {
                if(typeof resources[res]['getName'] === 'function') {
                    cookieRes.push(resources[res].getName());
                }
            }catch (err01){
                // move on to the next resource
                // no recovery or log needed.
            }
        }

        for(var name in data){
            var cval = data[name];
            if(!!cval){
                var cname = name.replace(/_\d+$/, "");
                if (cname == "JSESSIONID" || cname === "inqCA" || cname === "inqLT") {
                    retval[cname] = cval;
                } else if ( cookieRes.contains(cname, function(oa, ob) { return oa === ob; } ) ) {
                    // parse cookie value if only it is defined in resources.
                    try{
                        retval[cname] = MixIns.JSON.parse(cval);
                    } catch(e) {
                        // log error and continue looping to parse all other cookies
                        var errMsg = "Error[parseCookieData] while parsing cookie: Cookie name=" + cname
                                        + ",value=" + cval + ", customerID=" + getCustID() + ", siteID=" + getSiteID()
                                        + "error message=" + e.message
                                ;
                        log(errMsg);
                        logErrorToTagServer(errMsg);
                    }
                }
            }
        }
        return retval;
	}

    var _3pcSupported = true;
	/**
	 * A callback from our initialization controller.
	 * This is invoked twice in XD mode as we need to:
	 *   1) call once to check if 3P Cookies are supported on the browser AND if so
	 *   2) get the customerID and ip address
	 * In NonXD mode we make only one call to our controller: to get the custID and browserIP.
	 * @param {Object} JSON object
	 */
	function onRemoteCallback(initData) {
		var _xd = (this.xd && (CM).cookies["pc"]!="2" && !CookieMgr.xdPsHelper.enabled );

        if (!!initData['devicetype']) {
            setDeviceType(initData['devicetype']);
        }
		
		if(!!initData["retry"]){
			var inqData = {};
			inqData[this.getID()] = {
				xd: _xd,
				siteID: this.getSiteID(),
				custID: this.getCustID(),
				retried:true,
				scheduleTZs: scheduleTZs 
			};

			// When "from scratch" IJSF init is performed, site timezone offset is requested as part of init request
			if (isTZRequestRequired()) inqData[this.getID()].tzID = siteTzID;

			var strData = MixIns.JSON.stringify(inqData);
			this.callRemote(urls.initFrameworkURL, {rid:this.getID(), d: strData });
			return;
		}
		else if( !!initData["3pcNotSupported"]){
			log("Third party cookies not supported.");
            _3pcSupported = false;
		}
        if(!frameworkCanRun(getDeviceType(), _3pcSupported, true, _xd)){
            if(document.cookie.indexOf("_inqNR=0")<0){ // only log once
                ROM.send(urls.loggingURL, {level:'INFO', line: "Framework load aborted: siteID="+siteID+",3pc="+_3pcSupported+",deviceType="+getDeviceType()+",userAgent="+navigator.userAgent});
                document.cookie="_inqNR=0"; //remember our decision here to keep us from re-logging this event (at least for the session)
            }
            return; //abort forever
        }

        var inqID = this.getID();
		if (initData[inqID]) {
			this.setFrameworkData(initData[inqID]);
		} else if (!isNullOrUndefined(initData["siteTzOffset"])) {
			log("Received site timezone offset from server: " + initData["siteTzOffset"] + "ms");
			this.setFrameworkData(initData);
		}
		PM.fireDataReady();
		this.start();
	}


	/**
	 * A callback from our 3PC IFrame proxy "get cookie" routine.
	 * In XD mode only, this is called (back) on every page landing before framework modules
	 * are initialized (to get cookies before without getting them from the server).
	 * @param {String} data Aggregate cookie string (like "document.cookie" from the 3P domain)
	 */
	function IFrameProxyCallback(data){
		data = decodeURIComponent(data);

		//In XD mode in IE, if the peristent cookies are allowed, we will get the 'pc' cookie data to
		//IFrameProxyCallback function. If the data is empty that means only session cookies are allowed.
		if (data != ""){
			CM.isPersistentCookiesEnabled = true;
		} else {
			CM.isPersistentCookiesEnabled = false;
		}

		data = parseCookieData(CM._getCookies(data));
		CM.setXDCookies(data);
		this.onDataReady();
        if (resources['vital']) { log("Sync Sale Status: " + resources['vital'].read('_ss')); }

		var inqID = this.getID();
		var inqData = {};
		inqData[inqID] = {
			xd: this.xd,
			siteID: this.getSiteID(),
			custID: this.getCustID(),
			scheduleTZs: scheduleTZs,
            useragent: window.navigator.userAgent
		};

		// When "from scratch" IJSF init is performed, site timezone offset is requested as part of init request
		if (isTZRequestRequired()) inqData[inqID].tzID = siteTzID;

		var strData = MixIns.JSON.stringify(inqData);
		this.callRemote(urls.initFrameworkURL, {rid:this.getID(), d: strData });
	}

    function init() {
		if(this.initialized) { return;};
		var inqData = {};
		var inqID = this.getID();
		PM.addListener(this);
		exposeCustomerApi();
		DM.init();
        // Detects Safari on iOS 7 for 1pc persistent solution.
        if(xdAutoSelect) {
			CM.init();
            CookieMgr.firstRequestCookie(); /* see callback at IFrameProxyCallback() */
        } else if(this.xd) {
			initXD();
		} else {
			if ( CookieMgr.isSessionCookiesAllowed() ){
				this.load();
				if(!this.isFrameworkReady()) {
					inqData[inqID] = {
						xd: this.xd,
						siteID: this.getSiteID(),
						custID: this.getCustID(),
						scheduleTZs: scheduleTZs 
					};
	
					// When "from scratch" IJSF init is performed, site timezone offset is requested as part of init request
					if (isTZRequestRequired()) inqData[inqID].tzID = siteTzID;
	
					var strData = MixIns.JSON.stringify(inqData);
	
					this.callRemote(urls.initFrameworkURL, {rid:this.getID(), d: strData });
				} else if (isTZRequestRequired()) {
					log("Requesting site timezone offset");
					this.callRemote(urls.getSiteTzOffsetURL, {tzID: siteTzID});
				} else {
					PM.fireDataReady();
					this.start();
				}
			}
		}
	}

	function prepareDataToSend(data) {
		if (!data) {
			return data;
		}
		if (typeOf(data) =="array") {
			try {
				if (data.length > 0) {
					var elem = data[0];
					if (elem.key) {
						// map
						var out = Array.prepareMapToSerialize(data);
						return MixIns.JSON.stringify(out)
					}

				}
				return MixIns.JSON.stringify(data)
			}
			catch(e) {
				logErrorToTagServer(e);
			}
		}
		return data;
	}
	
	function main() {
		
		if(site.sameOriginReferrerFilterRegex()){
			try {
				
				var elm = top.document.getElementById("doesNotExist");
			} catch(e) {
				return;
			}
		}
		MixIns.prepare(this).mixIn(MixIns.Observable).mixIn(MixIns.FrameworkModule);
		this.mixIn(MixIns.Persistable).mixIn(MixIns.Absorber).mixIn(MixIns.RemoteCaller);
		this._frameworkModule("INQ");
		this._observable();
		this.init();
		// this.start is called by the onDataReady method
	}
	var c2cPageElementIDs = site.c2cPageElementIDs();
	C2C.setC2CPageElementIDs(c2cPageElementIDs);
	

    // it is XD if site's persistence Mode is Xd or Self-Detection
    var PM = PersistenceMgr.getInstance( site.persistenceMode != 'non-XD' );
	var CM = PM.getCookieMgr();
	var C2CM = new C2CMgr("C2CM",site.c2cMgrData());

	var EVM = new EvtMgr("EVM");

	var ROM = new RemoteOpsMgr("ROM", {
		
	});

    var LDM = new LandingMgr("LDM", v3Lander.landingData); // data now resides client-side
	var BusinessRuleActionLists = site.businessRuleActionLists();


	var RuleActionLists = site.ruleActionLists();

    var functionRulesObj = {
		"saleValue": 
				function(){
					try{
					var ps = inqSalesPrices;
					var qs = inqSalesQuantities;
					if(ps.length == qs.length){
						if(qs.length>0){
							var sum = 0;
							for(var i=0; i < qs.length; i++){
								sum += (parseFloat(qs[i]) * parseFloat(ps[i]));
							}
							return sum;
						}
					}
					}catch(er){}
					return null;
				}
			};
    var businessFuncRulesObj = site.JSBusinessFunctions();
    if(businessFuncRulesObj) {
        var prop,hasOwnProp = {}.hasOwnProperty;
        for(prop in businessFuncRulesObj){
            if(hasOwnProp.call(businessFuncRulesObj,prop))
                functionRulesObj[prop] = businessFuncRulesObj[prop];
        }
    }
	var FM = new FcnMgr(functionRulesObj);

    var dfvs = site.xmlData.dfvs();
    var core_resource_ids=["pc","state","vital","session"];
	var resources = site.resources();
	resources["pc"] = new CookieResource("pc", "pc", site.cookiePath,  24 * 3600 * 1000, site.rootDomain, false, 0, CM);
	resources["state"] = new CookieResource("state", "inqState", site.cookiePath,  365 * 24 * 3600 * 1000, site.rootDomain, false, 0, CM);
	resources["vital"] = new CookieResource("vital", "inqVital", site.cookiePath,  365 * 24 * 3600 * 1000, site.rootDomain, false, 0, CM);
	resources["session"] = new CookieResource("session", "inqSession", site.cookiePath,  365 * 24 * 3600 * 1000, site.rootDomain, false, 0, CM);

	var schedules = MixIns.mixAbsorber();
    var programSchedules = {};
    var businessSchedules = site.xmlData.businessSchedules();

	schedules.absorb(programSchedules);
	schedules.absorb(businessSchedules);

    var LoadM = new LoadMgr();

	var MM = new MediaMgr(site.mediaMgrData());
    var programRulesData = [
			Rule.create({
				id:5,
				
				name:"Sale Setter Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onManualInvocation"} ]},
				conditionalFcn: function(rule,evt){
					return (false);
				},
				actionFcn: function(rule, evt){
					
					log("Won't happen");

				},
                active: true
			}), 
			Rule.create({
				id:600,
				
				name:"Sale Page Triggering Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (((exists(function(){ return safe("inqSalesProducts") ;}, false, true)) && (exists(function(){ return safe("inqSalesQuantities") ;}, false, true))) || ((exists(function(){ return window.parent.inqSalesProducts ;}, false, true)) && (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true))));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("saleLC", rule).setValue((PM.getVar("saleLC",rule).getValue()  + 1));
					EVM.fireCustomEvent('SaleLanding', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:10,
				
				name:"Incrementality Attribute Setter Stub Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (!(VAM.test({"vis_attr_incr_val":{"values":{},"mutuallyExclusive":false}
})));
				},
				actionFcn: function(rule, evt){
					
					VAM.add({"vis_attr_incr_val":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set("", true))},"mutuallyExclusive":false});
				},
                active: true
			}), 
			Rule.create({
				id:400,
				
				name:"MobileSuppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Unsupported")) || (isDeviceType("Phone")) || (isDeviceType("Tablet")));
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:404,
				
				name:"ChromeOnIphoneSuppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((new Boolean(FM.callExternal(
								function(){
									var uaString = navigator.userAgent.toLowerCase();
									return (/crios/i.test(uaString) && /iphone/i.test(uaString));
								}
							))).valueOf());
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:405,
				
				name:"iOS6orLessSuppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((new Boolean(FM.callExternal(
                                function(){
                                    var uaString = navigator.userAgent;
                                    return ( /(iPhone|iPod|iPad)/i.test(uaString) && /OS [1-6](.*) like Mac OS X/i.test(uaString) );
                                }
				                ))).valueOf());
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:407,
				
				name:"iOS-7-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((new Boolean(safe("/iPad.*OS 7/i.test(navigator.userAgent)"))).valueOf());
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:408,
				
				name:"iOS-8-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((new Boolean(safe("/OS 8_/i.test(navigator.userAgent)"))).valueOf());
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:409,
				
				name:"iOS-9-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (false);
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:411,
				
				name:"WindowsPhone-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((new Boolean(safe("/Windows Phone/i.test(navigator.userAgent)"))).valueOf());
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:500,
				
				name:"Session Manager- Reset Session Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"}, {id:"onCustomerMsg"}, {id:"onAgentMsg"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if (PM.getVar("loyalty",rule).getValue() == 0) {
	
					PM.getVar("loyalty", rule).setValue(1.0);
					PM.getVar("sesID", rule).setValue(Inq.getCustID()+(exists(PM.getVar("loyalty",rule).getValue()) ? PM.getVar("loyalty",rule).getValue().toString() : ""));
						PM.getVar("fst", rule).setValue(new Date());
						PM.getVar("lst", rule).setValue(PM.getVar("fst",rule).getValue());
					EVM.fireCustomEvent('NewSession', rule, evt,
						function() {
							return {};
						}
					);
					}  else  if (((!(exists(function(){ return PM.getVar("ltt",rule).getValue() ;}, false, true))) && (!(PM.getVar("loyalty",rule).getValue() == 0))) || ((exists(function(){ return PM.getVar("ltt",rule).getValue() ;}, false, true)) && (new Date().after(PM.getVar("ltt",rule).getValue().roll(getConstant("SESSION_EXPIRE_TIME", rule)))))) {
	
					PM.getVar("loyalty", rule).setValue((PM.getVar("loyalty",rule).getValue()  + 1));


PM.reset("session");


				
				
					PM.getVar("sesID", rule).setValue(Inq.getCustID()+(exists(PM.getVar("loyalty",rule).getValue()) ? PM.getVar("loyalty",rule).getValue().toString() : ""));
						PM.getVar("lst", rule).setValue(new Date());
					EVM.fireCustomEvent('NewSession', rule, evt,
						function() {
							return {};
						}
					);
					}    
						PM.getVar("ltt", rule).setValue(new Date());
						PM.getVar("incStart", rule).setValue(new Date());
				},
                active: true
			}), 
			Rule.create({
				id:550,
				
				name:"Chat Count Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatLaunched", serviceType:"C2C"}, {id:"onChatLaunched", serviceType:"C2CALL"}, {id:"onChatLaunched", serviceType:"POPUP"}, {id:"onChatLaunched", serviceType:"POPUP_CALL"}, {id:"onChatLaunched", serviceType:"PERSISTENT"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("chatCnt", rule).setValue((PM.getVar("chatCnt",rule).getValue()  + 1));
				},
                active: true
			}), 
			Rule.create({
				id:551,
				
				name:"Sale Qualification Count Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"Assisted"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("salesQualificationCount", rule).setValue((PM.getVar("salesQualificationCount",rule).getValue()  + 1));
				},
                active: true
			}), 
			Rule.create({
				id:553,
				
				name:"DEPRECATED Clientside listeners backward compatibility Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					publishAPI("InqSaleMgr.getSaleID", "assistChatID");

				},
                active: true
			}), 
			Rule.create({
				id:555,
				
				name:"Referring Search Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"NewSession"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("rd", rule).setValue(URI.parseURI(doc.referrer).domain);
					if ((URI.parseURI(doc.referrer).domain.endsWith("google.com", true)) || (URI.parseURI(doc.referrer).domain.endsWith("ask.com", true)) || (URI.parseURI(doc.referrer).domain.endsWith("aol.com", true)) || (URI.parseURI(doc.referrer).domain.endsWith("bing.com", true)) || (URI.parseURI(doc.referrer).domain.endsWith("google.fr", true)) || (URI.parseURI(doc.referrer).domain.endsWith("google.de", true)) || (URI.parseURI(doc.referrer).domain.endsWith("google.co.uk", true)) || (URI.parseURI(doc.referrer).domain.endsWith("aol.fr", true)) || (URI.parseURI(doc.referrer).domain.endsWith("aol.de", true)) || (URI.parseURI(doc.referrer).domain.endsWith("aol.co.uk", true))) {
	
					PM.getVar("sest", rule).setValue(URI.parseURI(doc.referrer).qMap["q"]);
					}  else  if (URI.parseURI(doc.referrer).domain.endsWith("yahoo.com", true)) {
	
					PM.getVar("sest", rule).setValue(URI.parseURI(doc.referrer).qMap["p"]);
					}     else {
	
					PM.getVar("sest", rule).setValue("");
					}
				},
                active: true
			}), 
			Rule.create({
				id:605,
				
				name:"Sale Reset Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"}, {id:"on"+"SaleLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((!(CHM.isPersistentWindow())) && (!(PM.getVar("saleState",rule).getValue().equals(getConstant("SALE_STATE_UNSOLD", rule), false))) && (((exists(function(){ return PM.getVar("assistDT",rule).getValue() ;}, false, true)) && (new Date().after(PM.getVar("assistDT",rule).getValue().roll(getConstant("SALE_EXPIRATION", rule))))) || ((exists(function(){ return PM.getVar("soldDT",rule).getValue() ;}, false, true)) && (new Date(86400000).before(PM.getVar("soldDT",rule).getValue())) && (new Date().after(PM.getVar("soldDT",rule).getValue().roll(getConstant("SALE_EXPIRATION", rule)))))));
				},
				actionFcn: function(rule, evt){
					Inq.doRuleActionList("saveAssistedVariablesActionList", rule, evt);
                   
					PM.getVar("saleState", rule).setValue(getConstant("SALE_STATE_UNSOLD", rule));
						PM.getVar("assistDT", rule).setValue(new Date(0));
						PM.getVar("soldDT", rule).setValue(new Date(0));
					PM.getVar("assistAgt", rule).setValue("");
					PM.getVar("assistChatID", rule).setValue("-1");
					EVM.fireCustomEvent('SaleStateTransition', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:830,
				
				name:"ETLv2 Converted Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"SaleLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("incState", rule).setValue(getConstant("INC_STATE_CONVERTED", rule));
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_CONVERTED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"group": prepareDataToSend(PM.getVar("incGroup",rule).getValue()),"products": prepareDataToSend((exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null))),"quantities": prepareDataToSend((exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null))),"prices": prepareDataToSend((exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null))),"productTypes": prepareDataToSend((exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null))),"products2": prepareDataToSend((exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : (exists(function(){ return window.parent.inqSalesProducts2 ;}, false, true)  ? window.parent.inqSalesProducts2 : null))),"quantities2": prepareDataToSend((exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : (exists(function(){ return window.parent.inqSalesQuantities2 ;}, false, true)  ? window.parent.inqSalesQuantities2 : null))),"prices2": prepareDataToSend((exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : (exists(function(){ return window.parent.inqSalesPrices2 ;}, false, true)  ? window.parent.inqSalesPrices2 : null))),"productTypes2": prepareDataToSend((exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : (exists(function(){ return window.parent.inqSalesProductTypes2 ;}, false, true)  ? window.parent.inqSalesProductTypes2 : null))),"orderType": prepareDataToSend((exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null))),"customerName": prepareDataToSend((exists(function(){ return safe("inqCustomerName") ;}, false, true)  ? safe("inqCustomerName") : (exists(function(){ return window.parent.inqCustomerName ;}, false, true)  ? window.parent.inqCustomerName : null))),"orderID": prepareDataToSend((exists(function(){ return safe("inqClientOrderNum") ;}, false, true)  ? safe("inqClientOrderNum") : (exists(function(){ return window.parent.inqClientOrderNum ;}, false, true)  ? window.parent.inqClientOrderNum : null))),"testOrder": prepareDataToSend((exists(function(){ return safe("inqTestOrder") ;}, false, true)  ? safe("inqTestOrder") : (exists(function(){ return window.parent.inqTestOrder ;}, false, true)  ? window.parent.inqTestOrder : null))),"otherInfo": prepareDataToSend((exists(function(){ return safe("inqOtherInfo") ;}, false, true)  ? safe("inqOtherInfo") : (exists(function(){ return window.parent.inqOtherInfo ;}, false, true)  ? window.parent.inqOtherInfo : null))),"clientTimestamp": prepareDataToSend((exists(function(){ return safe("inqClientTimeStamp") ;}, false, true)  ? safe("inqClientTimeStamp") : (exists(function(){ return window.parent.inqClientTimeStamp ;}, false, true)  ? window.parent.inqClientTimeStamp : null))),"businessUnitID": prepareDataToSend((exists(function(){ return CHM.getLastChat() ;}, false, true)  ? CHM.getLastChat().businessUnitID : CHM.getBusinessUnitID(evt, rule))),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : ""))},
                            true,
							true,
                            null,
                            null
                        );

					EVM.fireCustomEvent('ConvertedEvent', rule, evt,
						function() {
							return { businessUnitID: (exists(function(){ return CHM.getLastChat() ;}, false, true)  ? CHM.getLastChat().businessUnitID : CHM.getBusinessUnitID(evt, rule)) };
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:610,
				
				name:"Sale Page Landing Data Pass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"SaleLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
						ROM.send(
							resources["SALE_LANDING_CONTROLLER"].url,
							{"siteID": prepareDataToSend(getSiteID()),"agentID": prepareDataToSend(CHM.getAgentID()),"chatID": prepareDataToSend(PM.getVar("assistChatID",rule).getValue()),"customerID": prepareDataToSend(Inq.getCustID()),"pageID": prepareDataToSend(LDM.getPageID()),"buID": prepareDataToSend((exists(function(){ return CHM.getLastChat() ;}, false, true)  ? CHM.getLastChat().businessUnitID : CHM.getBusinessUnitID(evt, rule))),"incAssignmentID": prepareDataToSend((exists(function(){ return getIncAssignmentID() ;}, false, true)  ? getIncAssignmentID() : null)),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, false)),"orderType": prepareDataToSend((exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null))),"incGroup": prepareDataToSend((exists(function(){ return PM.getVar("incGroup",rule).getValue() ;}, false, true)  ? PM.getVar("incGroup",rule).getValue() : null)),"sessionID": prepareDataToSend((exists(function(){ return getSessionID() ;}, false, true)  ? getSessionID() : null)),"vAtts": prepareDataToSend((exists(function(){ return VAM.getCopyAsArray(false).join(";") ;}, false, true)  ? VAM.getCopyAsArray(true).join(";") : null)),"products": prepareDataToSend((exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null))),"quantities": prepareDataToSend((exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null))),"prices": prepareDataToSend((exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null))),"productTypes": prepareDataToSend((exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null))),"products2": prepareDataToSend((exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : null)),"quantities2": prepareDataToSend((exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : null)),"prices2": prepareDataToSend((exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : null)),"productTypes2": prepareDataToSend((exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : null)),"orderType": prepareDataToSend((exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null))),"customerName": prepareDataToSend((exists(function(){ return safe("inqCustomerName") ;}, false, true)  ? safe("inqCustomerName") : (exists(function(){ return window.parent.inqCustomerName ;}, false, true)  ? window.parent.inqCustomerName : null))),"clientOrderNum": prepareDataToSend((exists(function(){ return safe("inqClientOrderNum") ;}, false, true)  ? safe("inqClientOrderNum") : (exists(function(){ return window.parent.inqClientOrderNum ;}, false, true)  ? window.parent.inqClientOrderNum : null))),"testOrder": prepareDataToSend((exists(function(){ return safe("inqTestOrder") ;}, false, true)  ? safe("inqTestOrder") : (exists(function(){ return window.parent.inqTestOrder ;}, false, true)  ? window.parent.inqTestOrder : null))),"otherInfo": prepareDataToSend((exists(function(){ return safe("inqOtherInfo") ;}, false, true)  ? safe("inqOtherInfo") : (exists(function(){ return window.parent.inqOtherInfo ;}, false, true)  ? window.parent.inqOtherInfo : null))),"clientTimestamp": prepareDataToSend((exists(function(){ return safe("inqClientTimeStamp") ;}, false, true)  ? safe("inqClientTimeStamp") : (exists(function(){ return window.parent.inqClientTimeStamp ;}, false, true)  ? window.parent.inqClientTimeStamp : null)))},
                            true,
							false,
                            null,
                            null
                        );

					PM.getVar("saleValue", rule).setValue(parseFloat(	FM.callExternal("saleValue")
));					log("***************** SALE LANDING *****************"); 

				},
                active: true
			}), 
			Rule.create({
				id:620,
				
				name:"Fire AssistedEvent Rule - by Message Count",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentMsg"}, {id:"onCustomerMsg"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return evt.agtMsgCnt ;}, false, true)) && (exists(function(){ return evt.custMsgCnt ;}, false, true)) && (parseFloat(evt.agtMsgCnt) >= getConstant("ASSISTED_AGENT_CHAT_COUNT", rule)) && (parseFloat(evt.custMsgCnt) >= getConstant("ASSISTED_CUSTOMER_CHAT_COUNT", rule)));
				},
				actionFcn: function(rule, evt){
					
					log("******** ASSISTED by message exchange **********");

					PM.getVar("assistedType", rule).setValue(getConstant("MESSAGE_COUNT_ASSISTED", rule));
					EVM.fireCustomEvent('AssistedEvent', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:621,
				
				name:"Fire AssistedEvent Rule - by Persistent Push",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPersistentPush"} ]},
				conditionalFcn: function(rule,evt){
					return (!((CHM.isServiceInProgress("C2CALL")) || (CHM.isServiceInProgress("POPUP_CALL")) || ((CHM.isServiceInProgress("C2C")) && (isC2PActive(false)))));
				},
				actionFcn: function(rule, evt){
					
					log("******** ASSISTED by Persistent Push **********");

					PM.getVar("assistedType", rule).setValue(getConstant("PERSISTENT_ASSISTED", rule));
					EVM.fireCustomEvent('AssistedEvent', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:622,
				
				name:"Assisted Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"AssistedEvent"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					Inq.doRuleActionList("setAssistedStateActionList", rule, evt);
                   
				},
                active: true
			}), 
			Rule.create({
				id:624,
				
				name:"Send Assisted Event on Agent Assigned",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return ((CHM.isPersistentWindow()) && ((CHM.isServiceInProgress("C2CALL")) || (CHM.isServiceInProgress("POPUP_CALL")) || ((CHM.isServiceInProgress("C2C")) && (isC2PActive(false)))));
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('AssistedEvent', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:625,
				
				name:"Sale Conversion Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"SaleLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (!(PM.getVar("saleState",rule).getValue().equals(getConstant("SALE_STATE_UNSOLD", rule), false)));
				},
				actionFcn: function(rule, evt){
					
						CallRemote.create({
							doCallbackActions: function(data){
								
					if ((new Boolean(data.success)).valueOf()) {
	Inq.doRuleActionList("saveAssistedVariablesActionList", rule, evt);
                   
					PM.getVar("saleState", rule).setValue(getConstant("SALE_STATE_CONVERTED", rule));
					PM.getVar("saleID", rule).setValue((exists(data.saleID) ? data.saleID.toString() : ""));
						PM.getVar("soldDT", rule).setValue(new Date());
					EVM.fireCustomEvent('SaleStateTransition', rule, evt,
						function() {
							return {};
						}
					);
					EVM.fireCustomEvent('Converted', rule, evt,
						function() {
							return {};
						}
					);
					}  
							}
						}).callRemote(
							resources["SET_SALE_CONTROLLER"].url,
							{"agentID": prepareDataToSend(PM.getVar("assistAgt",rule).getValue()),"chatID": prepareDataToSend(PM.getVar("assistChatID",rule).getValue()),"customerID": prepareDataToSend(Inq.getCustID()),"products": prepareDataToSend((exists(function(){ return safe("inqSalesProducts") ;}, false, true)  ? safe("inqSalesProducts") : (exists(function(){ return window.parent.inqSalesProducts ;}, false, true)  ? window.parent.inqSalesProducts : null))),"quantities": prepareDataToSend((exists(function(){ return safe("inqSalesQuantities") ;}, false, true)  ? safe("inqSalesQuantities") : (exists(function(){ return window.parent.inqSalesQuantities ;}, false, true)  ? window.parent.inqSalesQuantities : null))),"prices": prepareDataToSend((exists(function(){ return safe("inqSalesPrices") ;}, false, true)  ? safe("inqSalesPrices") : (exists(function(){ return window.parent.inqSalesPrices ;}, false, true)  ? window.parent.inqSalesPrices : null))),"productTypes": prepareDataToSend((exists(function(){ return safe("inqSalesProductTypes") ;}, false, true)  ? safe("inqSalesProductTypes") : (exists(function(){ return window.parent.inqSalesProductTypes ;}, false, true)  ? window.parent.inqSalesProductTypes : null))),"products2": prepareDataToSend((exists(function(){ return safe("inqSalesProducts2") ;}, false, true)  ? safe("inqSalesProducts2") : (exists(function(){ return window.parent.inqSalesProducts2 ;}, false, true)  ? window.parent.inqSalesProducts2 : null))),"quantities2": prepareDataToSend((exists(function(){ return safe("inqSalesQuantities2") ;}, false, true)  ? safe("inqSalesQuantities2") : (exists(function(){ return window.parent.inqSalesQuantities2 ;}, false, true)  ? window.parent.inqSalesQuantities2 : null))),"prices2": prepareDataToSend((exists(function(){ return safe("inqSalesPrices2") ;}, false, true)  ? safe("inqSalesPrices2") : (exists(function(){ return window.parent.inqSalesPrices2 ;}, false, true)  ? window.parent.inqSalesPrices2 : null))),"productTypes2": prepareDataToSend((exists(function(){ return safe("inqSalesProductTypes2") ;}, false, true)  ? safe("inqSalesProductTypes2") : (exists(function(){ return window.parent.inqSalesProductTypes2 ;}, false, true)  ? window.parent.inqSalesProductTypes2 : null))),"orderType": prepareDataToSend((exists(function(){ return safe("inqOrderType") ;}, false, true)  ? safe("inqOrderType") : (exists(function(){ return window.parent.inqOrderType ;}, false, true)  ? window.parent.inqOrderType : null))),"customerName": prepareDataToSend((exists(function(){ return safe("inqCustomerName") ;}, false, true)  ? safe("inqCustomerName") : (exists(function(){ return window.parent.inqCustomerName ;}, false, true)  ? window.parent.inqCustomerName : null))),"clientOrderNum": prepareDataToSend((exists(function(){ return safe("inqClientOrderNum") ;}, false, true)  ? safe("inqClientOrderNum") : (exists(function(){ return window.parent.inqClientOrderNum ;}, false, true)  ? window.parent.inqClientOrderNum : null))),"testOrder": prepareDataToSend((exists(function(){ return safe("inqTestOrder") ;}, false, true)  ? safe("inqTestOrder") : (exists(function(){ return window.parent.inqTestOrder ;}, false, true)  ? window.parent.inqTestOrder : null))),"otherInfo": prepareDataToSend((exists(function(){ return safe("inqOtherInfo") ;}, false, true)  ? safe("inqOtherInfo") : (exists(function(){ return window.parent.inqOtherInfo ;}, false, true)  ? window.parent.inqOtherInfo : null))),"clientTimestamp": prepareDataToSend((exists(function(){ return safe("inqClientTimeStamp") ;}, false, true)  ? safe("inqClientTimeStamp") : (exists(function(){ return window.parent.inqClientTimeStamp ;}, false, true)  ? window.parent.inqClientTimeStamp : null))),"siteID": prepareDataToSend(getSiteID())}
						);
				},
                active: true
			}), 
			Rule.create({
				id:635,
				
				name:"Save Last n Sales",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"Converted"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
						PM.getVar("nSalesID", rule).prepend([PM.getVar("saleID",rule).getValue()]);
						
				},
                active: true
			}), 
			Rule.create({
				id:700,
				
				name:"Page Landing Data Pass",
				vars:[
		{name:"url_700", defVal:null, rId:"tmpVars", shName:"url", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:200, type:"String"}],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((CHM.isServiceInProgress("ANY")) && (!("_inqPersistentChat".equals(top.name, false))));
				},
				actionFcn: function(rule, evt){
					
					if (getConstant("REMOVE_QUERY_STRING_FROM_TRACKING_URL", rule)) {
	
					PM.getVar("url", rule).setValue(LDM.getCurrentPageURL().replace(/\?.*/g, ""));
					}   else {
	
					PM.getVar("url", rule).setValue(LDM.getCurrentPageURL());
					}
            ROM.sendDataToAgent(
                CHM.getAgentID(),
            MixIns.mixMutatable(MixIns.mixAbsorber(MixIns.unmixMutatable(MixIns.mixMutatable().set("URL", PM.getVar("url",rule).getValue()).set("markerID", LDM.getPageMarker()))).absorb(safe('inqData')
)).set("agentID",CHM.getAgentID()).set("engagementID",CHM.getChatID())
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:710,
				
				name:"Agent Assigned Tracking",
				vars:[
		{name:"url_710", defVal:null, rId:"tmpVars", shName:"url", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:200, type:"String"}],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return ((CHM.isServiceInProgress("ANY")) && (!("_inqPersistentChat".equals(top.name, false))));
				},
				actionFcn: function(rule, evt){
					
					if (getConstant("REMOVE_QUERY_STRING_FROM_TRACKING_URL", rule)) {
	
					PM.getVar("url", rule).setValue(LDM.getCurrentPageURL().replace(/\?.*/g, ""));
					}   else {
	
					PM.getVar("url", rule).setValue(LDM.getCurrentPageURL());
					}
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "URL": prepareDataToSend(PM.getVar("url",rule).getValue()),"markerID": prepareDataToSend(LDM.getPageMarker()),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:799,
				
				name:"Reset incGroup",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"NewSession"} ]},
				conditionalFcn: function(rule,evt){
					return ((!(exists(function(){ return PM.getVar("incStart",rule).getValue() ;}, false, true))) || (new Date().after(PM.getVar("incStart",rule).getValue().roll(getConstant("INC_GROUP_DURATION", rule)))));
				},
				actionFcn: function(rule, evt){
					
						PM.getVar("incStart", rule).setValue(new Date());
					PM.getVar("incID", rule).setValue(getSessionID());
					if ((!(PM.getVar("incExempt",rule).getValue())) && (rand(1, 100, true)  <= getConstant("INC_CONTROL_PERCENT", rule))) {
	
					PM.getVar("incGroup", rule).setValue(getConstant("INC_GROUP_CONTROL", rule));
					}   else {
	
					PM.getVar("incGroup", rule).setValue(getConstant("INC_GROUP_CHAT", rule));
					}
					PM.getVar("incState", rule).setValue(getConstant("INC_STATE_ELIGIBLE", rule));
				},
                active: true
			}), 
			Rule.create({
				id:800,
				
				name:"Eligible Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"NewSession"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('EligibleEvent', rule, evt,
						function() {
							return {};
						}
					);
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_ELIGIBLE", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"group": prepareDataToSend(PM.getVar("incGroup",rule).getValue()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"browserType": prepareDataToSend(getClientBrowserType()),"browserVersion": prepareDataToSend(getClientBrowserVersion()),"operatingSystemType": prepareDataToSend(getOSType()),"deviceType": prepareDataToSend(getDeviceType()),"codeVersion": prepareDataToSend(v3Lander.codeVersion),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : ""))},
                            true,
							false,
                            null,
                            null
                        );

				},
                active: true
			}), 
			Rule.create({
				id:802,
				
				name:"Set BRMgr Actionable Flag",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return PM.getVar("incGroup",rule).getValue() ;}, false, true)) && (getConstant("INC_GROUP_CONTROL", rule).equals(PM.getVar("incGroup",rule).getValue(), true)));
				},
				actionFcn: function(rule, evt){
					BRM.setActionable(false);
				},
                active: true
			}), 
			Rule.create({
				id:805,
				
				name:"Targeted Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onRuleSatisfied"} ]},
				conditionalFcn: function(rule,evt){
					return (!(CHM.isServiceInProgress("ANY")));
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('TargetedEvent', rule, evt,
						function() {
							return { brID: evt.rule.id ,  businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_TARGETED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"group": prepareDataToSend(PM.getVar("incGroup",rule).getValue()),"brID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString())),"funnelLevel": prepareDataToSend(evt.rule.getFunnelLevel()),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : "")),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, false)),"queueThreshold": prepareDataToSend(evt.rule.getQueueThreshold())},
                            true,
							false,
                            null,
                            null
                        );

				},
                active: true
			}), 
			Rule.create({
				id:807,
				
				name:"Exposure Qualified Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onExposureQualified"} ]},
				conditionalFcn: function(rule,evt){
					return (!(CHM.isServiceInProgress("ANY")));
				},
				actionFcn: function(rule, evt){
					
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_EXPOSURE_QUALIFIED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID()),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"group": prepareDataToSend(PM.getVar("incGroup",rule).getValue()),"brID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"result": prepareDataToSend(evt.result),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString())),"funnelLevel": prepareDataToSend(evt.rule.getFunnelLevel()),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : "")),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, false)),"queueThreshold": prepareDataToSend(evt.rule.getQueueThreshold())},
                            true,
							false,
                            null,
                            null
                        );

				},
                active: true
			}), 
			Rule.create({
				id:810,
				
				name:"Exposed Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onServiceInvitation"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('ExposedEvent', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_EXPOSED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"brID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"chatID": prepareDataToSend(CHM.getChatID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, false)),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString())),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : "")),"queueThreshold": prepareDataToSend(evt.rule.getQueueThreshold())},
                            true,
							false,
                            null,
                            null
                        );

				},
                active: true
			}), 
			Rule.create({
				id:811,
				
				name:"engagement.windowDisplayed rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatLaunched", serviceType:"C2C"}, {id:"onChatLaunched", serviceType:"C2CALL"}, {id:"onChatLaunched", serviceType:"POPUP"}, {id:"onChatLaunched", serviceType:"POPUP_CALL"}, {id:"onChatLaunched", serviceType:"PERSISTENT"}, {id:"onChatLaunched", serviceType:"CONVERSIVE"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
						ROM.send(
							resources["JASPER_ETL"].url,
							{"_domain": prepareDataToSend("engagement"),"evt": prepareDataToSend("windowDisplayed"),"customerID": prepareDataToSend(Inq.getCustID()),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"sessionID": prepareDataToSend(getSessionID()),"incAssignmentID": prepareDataToSend(getIncAssignmentID()),"businessRuleID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"chatID": prepareDataToSend(CHM.getChatID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, false)),"inHOP": prepareDataToSend(evt.inHOP),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString())),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : "")),"qt": prepareDataToSend(CHM.getQueueThreshold())},
                            false,
							false,
                            null,
                            null
                        );

				},
                active: true
			}), 
			Rule.create({
				id:812,
				
				name:"engagement.persistentWindowDisplayed rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatLaunched", serviceType:"PERSISTENT"}, {id:"onPersistentPush"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
						ROM.send(
							resources["JASPER_ETL"].url,
							{"_domain": prepareDataToSend("engagement"),"evt": prepareDataToSend("persistentWindowDisplayed"),"customerID": prepareDataToSend(Inq.getCustID()),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"sessionID": prepareDataToSend(getSessionID()),"incAssignmentID": prepareDataToSend(getIncAssignmentID()),"businessRuleID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"chatID": prepareDataToSend(CHM.getChatID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"inHOP": prepareDataToSend(evt.inHOP),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString()))},
                            false,
							true,
                            20,
                            5000
                        );

				},
                active: true
			}), 
			Rule.create({
				id:814,
				
				name:"ServiceEngaged Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onServiceEngaged"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('EngagedEvent', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) ,  rule: evt.rule };
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:813,
				
				name:"Move Inc State Through Funnel Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"IncStateFunnelTransition"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if (parseFloat(PM.getVar("incStatesMap",rule).getValue().get(PM.getVar("incState",rule).getValue())) < parseFloat(PM.getVar("incStatesMap",rule).getValue().get(evt.newState))) {
	
					PM.getVar("incState", rule).setValue((exists(evt.newState) ? evt.newState.toString() : ""));
					}  
				},
                active: true
			}), 
			Rule.create({
				id:815,
				
				name:"Engaged Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"EngagedEvent"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if (!(CHM.getChatID().equals(PM.getVar("engagedChatID",rule).getValue(), false))) {
	
					PM.getVar("engagedChatID", rule).setValue(CHM.getChatID());
					EVM.fireCustomEvent('IncStateFunnelTransition', rule, evt,
						function() {
							return { newState: getConstant("INC_STATE_ENGAGED", rule) };
						}
					);
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_ENGAGED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"brID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"chatID": prepareDataToSend(CHM.getChatID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, false)),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString())),"visitorAttributes": prepareDataToSend((exists(VAM.getCopyAsArray(true).join(";")) ? VAM.getCopyAsArray(true).join(";").toString() : "")),"queueThreshold": prepareDataToSend(evt.rule.getQueueThreshold())},
                            true,
							false,
                            null,
                            null
                        );

					}  
				},
                active: true
			}), 
			Rule.create({
				id:820,
				
				name:"Fire Interacted Event Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onServiceInteracted"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('InteractedEvent', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:821,
				
				name:"Interacted Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"InteractedEvent"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if (!(CHM.getChatID().equals(PM.getVar("interactedChatID",rule).getValue(), false))) {
	
					PM.getVar("interactedChatID", rule).setValue(CHM.getChatID());
					EVM.fireCustomEvent('IncStateFunnelTransition', rule, evt,
						function() {
							return { newState: getConstant("INC_STATE_INTERACTED", rule) };
						}
					);
					PM.getVar("incExempt", rule).setValue(true);
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_INTERACTED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"brID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"chatID": prepareDataToSend(CHM.getChatID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"agentGroupID": prepareDataToSend(CHM.getAgentGroupID(evt, true)),"targetAgentAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getAgentAttributesAsString() : (evt.rule  ? evt.rule.getAgentAttributesAsString() : rule.getAgentAttributesAsString())),"brAttributes": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleAttributesAsString() : (evt.rule  ? evt.rule.getRuleAttributesAsString() : rule.getRuleAttributesAsString())),"type": prepareDataToSend(CHM.getConversionType())},
                            true,
							false,
                            null,
                            null
                        );

					}  
				},
                active: true
			}), 
			Rule.create({
				id:850,
				
				name:"Set Service Missed Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onServiceMissed"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(evt.serviceType) ? evt.serviceType.toString() : "").equals("POPUP", false));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("svcMissed", rule).setValue(parseFloat(evt.rule.id));
				},
                active: true
			}), 
			Rule.create({
				id:855,
				
				name:"Clear Service Missed Rule and update lco",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onServiceInvitation"} ]},
				conditionalFcn: function(rule,evt){
					return ("POPUP".equals((exists(evt.serviceType) ? evt.serviceType.toString() : ""), false));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("svcMissed", rule).setValue(-1);
						PM.getVar("lco", rule).setValue(new Date());
				},
                active: true
			}), 
			Rule.create({
				id:900,
				
				name:"Frequency Metric Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"NewSession"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if ((exists(function(){ return PM.getVar("loyalty",rule).getValue() ;}, false, true)) && (exists(function(){ return PM.getVar("lst",rule).getValue() ;}, false, true)) && (exists(function(){ return PM.getVar("fst",rule).getValue() ;}, false, true)) && (PM.getVar("loyalty",rule).getValue() > 1)) {
	
					PM.getVar("freq", rule).setValue((Math.round(PM.getVar("lst",rule).getValue().diff(PM.getVar("fst",rule).getValue())/(1000))  / (PM.getVar("loyalty",rule).getValue()  - 1)));
					}   else {
	
					PM.getVar("freq", rule).setValue(0);
					}
				},
                active: true
			}), 
			Rule.create({
				id:910,
				
				name:"Last n Session Time Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"NewSession"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if ((exists(function(){ return PM.getVar("lst",rule).getValue() ;}, false, true)) && (exists(function(){ return PM.getVar("nSesT",rule).getValue() ;}, false, true))) {
	
						PM.getVar("nSesT", rule).prepend([PM.getVar("lst",rule).getValue()]);
						
					}  
				},
                active: true
			}), 
			Rule.create({
				id:920,
				
				name:"Session Time Reset",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"NewSession"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("sesT", rule).setValue(0);
				},
                active: true
			}), 
			Rule.create({
				id:930,
				
				name:"Session and Site Time Update",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentMsg"}, {id:"onCustomerMsg"}, {id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("siteT", rule).setValue((PM.getVar("siteT",rule).getValue()  + (parseFloat(Math.round(PM.getVar("ltt",rule).getValue().diff(PM.getVar("lst",rule).getValue())/(1000)))  - PM.getVar("sesT",rule).getValue())));
					PM.getVar("sesT", rule).setValue(parseFloat(Math.round(PM.getVar("ltt",rule).getValue().diff(PM.getVar("lst",rule).getValue())/(1000))));
				},
                active: true
			}), 
			Rule.create({
				id:945,
				
				name:"resetFunnelLevel",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return PM.getVar("lco",rule).getValue() ;}, false, true)) && (new Date().after(PM.getVar("lco",rule).getValue().roll(getConstant("RECHAT_INTERVAL", rule)))));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("cfl", rule).setValue(getConstant("MAX_LONG", rule));
				},
                active: true
			}), 
			Rule.create({
				id:950,
				
				name:"CurrentFunnelLevelUpdater Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatLaunched", serviceType:"ALL"} ]},
				conditionalFcn: function(rule,evt){
					return ((!(exists(function(){ return evt.rule.getConstant('ifl') ;}, false, true))) && (exists(function(){ return evt.rule.getConstant('fl') ;}, false, true)) && (PM.getVar("cfl",rule).getValue() > parseFloat(evt.rule.getConstant('fl'))));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("cfl", rule).setValue(parseFloat(evt.rule.getConstant('fl')));
				},
                active: true
			}), 
			Rule.create({
				id:960,
				
				name:"Call Closed Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatClosed", serviceType:"POPUP_CALL"}, {id:"onChatClosed", serviceType:"C2CALL"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("continueTrackingAfterCallClose", rule).setValue(true);
					PM.getVar("lastCallId", rule).setValue(CHM.getChatID());
					PM.getVar("lastCallAgentId", rule).setValue(CHM.getAgentID());
				},
                active: true
			}), 
			Rule.create({
				id:970,
				
				name:"Continue Tracking After Call Close Rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (PM.getVar("continueTrackingAfterCallClose",rule).getValue());
				},
				actionFcn: function(rule, evt){
					
						CallRemote.create({
							doCallbackActions: function(data){
								
					if ((new Boolean(data.agentInChat)).valueOf()) {
	
            ROM.sendDataToAgent(
                PM.getVar("lastCallAgentId",rule).getValue(),
                {
                "URL": prepareDataToSend(LDM.getCurrentPageURL()),"markerID": prepareDataToSend(LDM.getPageMarker()),
                agentID:PM.getVar("lastCallAgentId",rule).getValue(),
                engagementID:PM.getVar("lastCallId",rule).getValue()
}
            
            );
					}   else {
	
					PM.getVar("continueTrackingAfterCallClose", rule).setValue(false);
					}
							}
						}).callRemote(
							resources["IS_AGENT_IN_CHAT"].url,
							{"chatID": prepareDataToSend(PM.getVar("lastCallId",rule).getValue())}
						);
				},
                active: true
			}), 
			Rule.create({
				id:986,
				
				name:"Update Assigned Agent On Transfer",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return PM.getVar("incState",rule).getValue() ;}, false, true)) && (PM.getVar("incState",rule).getValue().equals(getConstant("INC_STATE_ASSISTED", rule), false)));
				},
				actionFcn: function(rule, evt){
					
					if (exists(function(){ return CHM.getAgentID() ;}, false, true)) {
	
					PM.getVar("assistAgt", rule).setValue(CHM.getAgentID());
					}  
				},
                active: true
			}), 
			Rule.create({
				id:990,
				
				name:"sale state transition listener rule",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"SaleStateTransition"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
						ROM.send(
							resources["JASPER_ETL"].url,
							MixIns.unmixMutatable(MixIns.mixMutatable().set("_domain", "sale").set("evt", "state-change").set("customerID", Inq.getCustID()).set("siteID", getSiteID()).set("pageID", LDM.getPageID()).set("oldSaleState", evt.oldSaleState).set("saleState", PM.getVar("saleState",rule).getValue()).set("sessionID", getSessionID()).set("assistChatID", PM.getVar("assistChatID",rule).getValue()).set("chatID", CHM.getChatID()).set("oldAssistAgt", evt.oldAssistAgt).set("assistAgt", evt.assistAgt)),
                            false,
							true,
                            20,
                            5000
                        );

				},
                active: true
			})
];

	eval(rulesEngineDataStr);
	var reDat = initRulesData(programRulesData);

    // initialize all loaded mbu rules if any
    for (var i = 0; i < loadedMbuRuleDataFuns.length; i++) {
        eval("var initMbuRules = " + loadedMbuRuleDataFuns[i]);
        reDat.rules = reDat.rules.append(initMbuRules().rules);
    }

    if (loadedMbuRuleDataFuns.length > 0) {
        // sort rules by its indexes
        reDat.rules.sort(function(a,b) {
            if (isNullOrUndefined(a.ruleIndex) || isNullOrUndefined(b.ruleIndex)) return 0;
            if (a.ruleIndex > b.ruleIndex) return 1;
            if (a.ruleIndex < b.ruleIndex) return -1;
            return 0;
        });
    }

	var BRM = new BRMgr("BRM", reDat);

	var MSG = new MessageMgr();

	var CHM = ChatMgr.getInstance({
		thankYouShown: site.displayTYImage,
		thankYouEnabled:site.displayTYImage,
		displayTYImage: site.displayTYImage,
		CHAT_TYPES: {C2C:"C2C", C2CALL: "C2CALL", C2VIDEO: "C2VIDEO", POPUP:"POPUP", POPUP_CALL: "POPUP_CALL", PERSISTENT:"PERSISTENT", MONITOR:"MONITOR", CONVERSIVE:"CONVERSIVE"}
	});

	var SVYM = new SurveyMgr(
    	site.surveySpecs()
	);

	var FP = new FlashPeer("FP", {}) ;

    var CBM = null;
    if(site.enableCobrowse == true){
        var CMBConfigs = site.coBrowseConfigs();
        CBM = new CobrowseMgr("CBM", {
            cobrowseMaskingConfig:CMBConfigs.cobrowseMaskingConfig, isEmbeddedResource:CMBConfigs.isEmbeddedResource
        }, CMBConfigs.bannerText);
    }

    var WDM = WatchDogMgr.getInstance();

	/* ExitConfirm is not a manager, but acts the same way as managers when it concerns event handling. */
	var EC = new ExitConfirm();

	var EH = new ExitHook();

	var DM = new DestinationMonitor();

	
	var DT = new AutomatonDT();

    var programVars = Variable.getInstancesFromData([
		{name:"loyalty", defVal:0, rId:"state", shName:"_loy", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"sesID", defVal:null, rId:"session", shName:"_ssID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"ltt", defVal:null, rId:"session", shName:"ltt", type:"Date"},
		{name:"lco", defVal:null, rId:"state", shName:"lco", type:"Date"},
		{name:"fst", defVal:null, rId:"state", shName:"fst", type:"Date"},
		{name:"lst", defVal:null, rId:"state", shName:"lst", type:"Date"},
		{name:"freq", defVal:null, rId:"state", shName:"_f", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"sesT", defVal:null, rId:"session", shName:"_sT", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"nSesT", defVal:[], rId:"state", shName:"_ssQ", maxEntr:5, type:"DateList"},
		{name:"siteT", defVal:null, rId:"state", shName:"_sesT", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"saleValue", defVal:null, rId:"state", shName:"_slV", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"nSalesID", defVal:[], rId:"state", shName:"_slq", type:"List"},
		{name:"chatCnt", defVal:0.0, rId:"state", shName:"_cct", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"salesQualificationCount", defVal:0.0, rId:"state", shName:"_sqc", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"soldDT", defVal:null, rId:"vital", shName:"_sdt", type:"Date"},
		{name:"oldSoldDT", defVal:null, rId:"tmpVars", shName:"_osQ", type:"Date"},
		{name:"assistAgt", defVal:null, rId:"vital", shName:"_aa", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"oldAssistAgt", defVal:null, rId:"tmpVars", shName:"_oaa", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"assistDT", defVal:null, rId:"vital", shName:"_adt", type:"Date"},
		{name:"oldAssistDT", defVal:null, rId:"tmpVars", shName:"_oadt", type:"Date"},
		{name:"assistChatID", defVal:"-1", rId:"vital", shName:"_acid", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"engagedChatID", defVal:null, rId:"session", shName:"_ecID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"interactedChatID", defVal:null, rId:"session", shName:"_icID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"oldAssistChatID", defVal:null, rId:"tmpVars", shName:"_oaci", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"asstRuleID", defVal:null, rId:"vital", shName:"_arid", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"oldAsstRuleID", defVal:null, rId:"tmpVars", shName:"_oari", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"asstRuleName", defVal:null, rId:"vital", shName:"_arn", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:60, type:"String"},
		{name:"oldAsstRuleName", defVal:null, rId:"tmpVars", shName:"_oarn", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:60, type:"String"},
		{name:"saleLC", defVal:0.0, rId:"state", shName:"_slc", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"saleState", defVal:getConstant("SALE_STATE_UNSOLD", rule), rId:"vital", shName:"_ss", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"oldSaleState", defVal:null, rId:"tmpVars", shName:"_oss", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"saleID", defVal:null, rId:"vital", shName:"_sID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"oldSaleID", defVal:null, rId:"tmpVars", shName:"_osID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"incStart", defVal:null, rId:"vital", shName:"_is", type:"Date"},
		{name:"incGroup", defVal:null, rId:"vital", shName:"_ig", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"incID", defVal:null, rId:"vital", shName:"_iID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"incState", defVal:null, rId:"state", shName:"_ist", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"oldIncState", defVal:null, rId:"tmpVars", shName:"_ois", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"incExempt", defVal:null, rId:"state", shName:"_iex", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"svcMissed", defVal:-1, rId:"session", shName:"_svMs", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"custHost", defVal:null, rId:"state", shName:"_ch", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"rd", defVal:null, rId:"session", shName:"rd", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"sest", defVal:null, rId:"session", shName:"sest", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"assistedType", defVal:getConstant("UNDEFINED_ASSISTED", rule), rId:"session", shName:"_aTyp", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"cfl", defVal:getConstant("MAX_LONG", rule), rId:"state", shName:"cfl", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"continueTrackingAfterCallClose", defVal:false, rId:"session", shName:"cTACC", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"lastCallId", defVal:"0", rId:"session", shName:"lcId", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"lastCallAgentId", defVal:null, rId:"session", shName:"lcaId", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:30, type:"String"},
		{name:"incStatesMap", defVal:[{key:getConstant("INC_STATE_ELIGIBLE", rule), value:10} ,{key:getConstant("INC_STATE_TARGETED", rule), value:20} ,{key:getConstant("INC_STATE_EXPOSURE_QUALIFIED", rule), value:30} ,{key:getConstant("INC_STATE_EXPOSED", rule), value:40} ,{key:getConstant("INC_STATE_ENGAGED", rule), value:50} ,{key:getConstant("INC_STATE_INTERACTED", rule), value:60} ,{key:getConstant("INC_STATE_ASSISTED", rule), value:70} ,{key:getConstant("INC_STATE_CONVERTED", rule), value:80} ], rId:"tmpVars", shName:"_ismp", maxEntr:8, type:"Map"}]);

    var businessVars = Variable.getInstancesFromData(site.businessVars());

    var businessCustomEvents = site.businessCustomEvents();
    var VAM = new VAMgr("VAM",site.vamAttributes);
	var mgrList = [
		// one string for each one new manager to see the latest update
		PM, CM, ROM, BRM, LDM, C2CM, CHM, VAM, MM, SVYM
	];
    if(CBM){
        mgrList.push(CBM);
    }

	var rechatInterval = parseInt(site.rechatinterval);/* */
    var v3framesrc = site.v3framesrc;
    var v3C2cPersistent = site.c2cToPersistent;
    var xd = ( site.persistenceMode != 'non-XD' );
    var xdAutoSelect = ( site.persistenceMode == 'Self-Detection' );
	var initialized = false;
	var started = false;
	var multiHost = site.multiHost;

	function getVar(varname, ruleID, optDflt){
		return PM.getVar(varname, BRM.getRuleById(ruleID)).getValue();
	}

	/**
	 * Returns address of hosted file e.g. http://touchcommerce.com/TouchCommercetop.html
	 * Used as a location for proxy IFrames and other purposes.
	 * Please note: window.location.hostname is the host's name without the port number,
	 *              not window.location.host.  Please see the correct methodology of building the path from
	 *              cookie manager ChatMgr.prototype.againPopoutChat
	 */
	function getHostedFileUrl() {
		return window.location.protocol + "//" + window.location.hostname +
			((window.location.port=="")?"":":"+window.location.port) + v3framesrc;
	}

    /**
    * Returns "click to persistent" flag value
    */
    function isC2cPersistent(){
        return v3C2cPersistent;
    }

	/**
	 * Loads javascript from server.
	 * @param server server to use
	 * @param urlClean url to use when obfuscation is disabled
	 * @param urlObfuscated url to use when obfuscation is enabled
	 * @param initFunction function to call once script is loaded
	 */
	function loadScript(server, urlClean, urlObfuscated, initFunction, parameters) {
		var srctag = document.createElement("SC"+"RIPT");
		srctag.src = normalizeProtocol(server) + (site.JSDebugMode ? urlClean : urlObfuscated);
		srctag.type = "text/javascript";
		srctag.charset = "utf-8";
		srctag.language = "javascript";
		srctag._parameters = parameters;
		srctag._function = initFunction;
		srctag.onload = function () {
			this.onreadystatechange = null;	/* We can have a ready state change for both complete and loaded, and we only want one call to the initFunction */
			this.onload = null;
			this._function(this._parameters);
		};
		srctag.onreadystatechange = function() {// workaround for IE only
			if (this.readyState == 'complete' || this.readyState == 'loaded') {
				this.onreadystatechange = null;	/* We can have a ready state change for both complete and loaded, and we only want one call to the initFunction */
				this.onload = null;
				this._function(this._parameters);
			}
		};
		document.body.appendChild(srctag);
	}


	return {
		xd: xd,
		siteID: siteID,
		custID: custID,
		custIP: custIP,
		main: main,
		onDataReady: onDataReady,
		onRemoteCallback: onRemoteCallback,
		isFrameworkReady: isFrameworkReady,
		isDataReady: isDataReady,
		init: init,
		initXD: initXD,
		IFrameProxyCallback: IFrameProxyCallback,
		isThirdPartyCookiesEnabled: isThirdPartyCookiesEnabled,
		start: start,
		setFrameworkData: setFrameworkData,
		save: save,
		load: load,
		getID: getID,
		getCustID: getCustID,
		getCustIP: getCustIP,
		getSiteID: getSiteID,
       	blockService: blockService,
		unblockService: unblockService,
		blockServices: blockServices,
		unblockServices: unblockServices,
		isServiceBlocked: isServiceBlocked,
		Drag: new Drag(),
		Resize: new Resize(),
		Rule:Rule,
		log: log,
        getLocalizedMessage: getLocalizedMessage,
		v3C2cPersistent: v3C2cPersistent,
		v3framesrc: v3framesrc,
		multiHost: multiHost,
		rechatInterval: rechatInterval,
		isSameOrigin: isSameOrigin,
		doBusinessRuleActionList: doBusinessRuleActionList,
		doRuleActionList: doRuleActionList,
		createHiddenIFrame: createHiddenIFrame,
		createFloatingDiv: createFloatingDiv,
		wasSaleAction: wasSaleAction,
		JSON: MixIns.JSON,
		cobrowseEnableHighlight: site.enableHighlight,

		urls: (urls),
		EVM: EVM,		 				// Event Mgr
		CM: CM,          				// Cookie mgr
        LoadM: LoadM,                   // Load mgr
		PM: PM,			 				// Persistence Mgr
		ROM: ROM,       				// Remote Operation Mgr
		BRM: BRM,						// Business Rules Mgr
		LDM: LDM,						// Landing Mgr
		C2CM: C2CM,						// Click2Chat Mgr
		CHM: CHM, ChatMgr: CHM,			// Chat Mgr
		CBM: CBM,				        // Co-Browse Manager
		reinitChat: reinitChat,  		// CUSTOMER API
		launchChatNow: launchChatNow,	// CUSTOMER API
		launchChatNowByPageID: launchChatNowByPageID,	// CUSTOMER API
		setChatSuppressedForSession: setChatSuppressedForSession, // CUSTOMER API
		FlashPeer: FP,   				// Flash Peer
		MSG: MSG,						// Message Manager
        WDM: WDM,                       // WatchDogManager
		DT: DT,							// AutomatonDT
		EC: EC,							// ExitConfirm object
		EH: EH   			            // ExitHook object
	};
})(v3Lander.inqSiteDataFun, v3Lander.inqRulesEngineFun, v3Lander.loadedMbuRuleDataFuns);

Inq.main();
/* Fri May 06 20:13:42 GMT-08:00 2016 */
