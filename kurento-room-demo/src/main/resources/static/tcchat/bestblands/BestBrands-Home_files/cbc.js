window.cobrowse = function($) {
  var CMD_CURRENT_WINDOW = "CW";
  var CMD_SUPPRESS = "SUPPRESS";
  var CMD_HEAD = "HEAD";
  var CMD_BODYPART = "BODYPART";
  var CMD_UPDATE = "UPD";
  var CMD_MOUSE_POSITION = "MP";
  var CMD_RESOURCE = "resource";
  var CMD_CHECK_EMBEDDED_RESOURCES = "checkEmbeddedResources";
  var PS_CBC_AUTH = "cbcAuth";
  var PS_CBC_CHECK = "cbcCheck";
  var DEFAULT_AUTH_MODE = {auth:0};
  var isCanvasSupported = !!window.HTMLCanvasElement;
  var REPOSITORY_DIRECTORY = "cbs/resource";
  var cntAlertToAgent = 0;
  var MAX_ALERT_SENT = 2;
  var CSS_CLASS_HIGHLIGHT_TEXT = "cbHighlightText";
  var CSS_CLASS_HIGHLIGHT_INPUTS = "cbHilightElement";
  var CSS_CLASS_HIGHLIGHT_SELECT = "cbHilightSelect";
  var SUPPORTED_HIGHLIGHT_COLORS = ["00ff00", "00ffff", "ff00ff", "ffbbbb", "bbffbb", "bbbbff", "bbffff", "ffbbff", "ffffbb", "ffffff"];
  function generateHighlightCssAI() {
    var result = "";
    for (var i = 0;i < SUPPORTED_HIGHLIGHT_COLORS.length;i++) {
      result += ".cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " input, .cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " button, .cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " textarea {background-color: #" + SUPPORTED_HIGHLIGHT_COLORS[i] + " !important;}";
      result += ".cbHilightSelect" + SUPPORTED_HIGHLIGHT_COLORS[i] + " {background-color: #" + SUPPORTED_HIGHLIGHT_COLORS[i] + " !important;}";
      result += ".cbHilightSelect" + SUPPORTED_HIGHLIGHT_COLORS[i] + " select {opacity: 0.7; }";
    }
    return result;
  }
  var cssHighlightStyleAI = generateHighlightCssAI();
  function generateHighlightCssCI() {
    var result = "";
    for (var i = 0;i < SUPPORTED_HIGHLIGHT_COLORS.length;i++) {
      result += ".cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " input, .cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " button, .cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " select, .cbHilightElement" + SUPPORTED_HIGHLIGHT_COLORS[i] + " textarea {background-color: #" + SUPPORTED_HIGHLIGHT_COLORS[i] + " !important;}";
      result += ".cbHilightSelect" + SUPPORTED_HIGHLIGHT_COLORS[i] + " select {background-color: #" + SUPPORTED_HIGHLIGHT_COLORS[i] + " !important;}";
    }
    return result;
  }
  var cssHighlightStyleCI = generateHighlightCssCI();
  $.extend({valHooks:{input:{get:function(elem) {
    if (elem.type == "submit" || elem.type == "reset") {
      var ret = elem.getAttributeNode("value");
      return ret ? ret.nodeValue : "";
    } else {
      return undefined;
    }
  }}}});
  function isEmbeddedResource(absoluteUrl) {
    return _isSameOrigin(absoluteUrl) && cobrowse.isEmbeddedResource(absoluteUrl, getPageMarker());
  }
  function generateHashCode(str) {
    if (!str) {
      return 0;
    }
    if (Array.prototype.reduce) {
      return str.split("").reduce(function(a, b) {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
    }
    var hash = 0;
    if (str.length === 0) {
      return hash;
    }
    for (var i = 0;i < str.length;i++) {
      var character = str.charCodeAt(i);
      hash = (hash << 5) - hash + character;
      hash = hash & hash;
    }
    return hash;
  }
  function isSuppressed() {
    return Inq.LDM.page ? Inq.LDM.page.sup : false;
  }
  function getAuthModeFromJson(json, boxID) {
    if (json == null) {
      return DEFAULT_AUTH_MODE;
    } else {
      var mode = parseJson(json, DEFAULT_AUTH_MODE);
      if (mode == null || !mode.auth) {
        mode = DEFAULT_AUTH_MODE;
      }
      if (mode.auth != 0 && !(mode.auth & cobrowse.ACCEPTED)) {
        if (boxID == PS_CBC_AUTH) {
          notifyAgentUponFailure("Cobrowse enable failed, error code [" + boxID + "]");
        }
      }
      return mode;
    }
  }
  function removeCobEndButton() {
    var cobMgr = getCoBrowseMgr();
    if (cobMgr != null) {
      if (cobrowse.isPersistentWindow && document.getElementById(cobMgr.cobEndButtonID) != null) {
        document.getElementById(cobMgr.cobEndButtonID).parentNode.remove();
        clearInterval(authCheckTimer);
      }
    }
  }
  function supportResponseBodyUtils() {
    var scriptId = "vbScript";
    var IEBinaryToArray_ByteStr_Script = "Function IEBinaryToArray_ByteStr(Binary)\r\n" + "    IEBinaryToArray_ByteStr = CStr(Binary)\r\n" + "End Function\r\n" + "Function IEBinaryToArray_ByteStr_Last(Binary)\r\n" + "    Dim lastIndex\r\n" + "    lastIndex = LenB(Binary)\r\n" + "    if lastIndex mod 2 Then\r\n" + "        IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\r\n" + "    Else\r\n" + "        IEBinaryToArray_ByteStr_Last = " + '""' + "\r\n" + "    End If\r\n" + 
    "End Function\r\n";
    if (!document.getElementById(scriptId)) {
      var vbScript = document.createElement("script");
      vbScript.setAttribute("id", scriptId);
      vbScript.setAttribute("type", "text/vbscript");
      vbScript.text = IEBinaryToArray_ByteStr_Script;
      document.getElementsByTagName("head")[0].appendChild(vbScript);
    }
  }
  function getIEByteArray_ByteStr(ieByteArray) {
    var byteMapping = {};
    for (var i = 0;i < 256;i++) {
      for (var j = 0;j < 256;j++) {
        byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j);
      }
    }
    var rawBytes = IEBinaryToArray_ByteStr(ieByteArray);
    var lastChr = IEBinaryToArray_ByteStr_Last(ieByteArray);
    return rawBytes.replace(/[\s\S]/g, function(match) {
      return byteMapping[match];
    }) + lastChr;
  }
  function base64Encode(input) {
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    while (i < input.length) {
      chr1 = input.charCodeAt(i++) & 255;
      chr2 = input.charCodeAt(i++) & 255;
      chr3 = input.charCodeAt(i++) & 255;
      enc1 = chr1 >> 2;
      enc2 = (chr1 & 3) << 4 | chr2 >> 4;
      enc3 = (chr2 & 15) << 2 | chr3 >> 6;
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else {
        if (isNaN(chr3)) {
          enc4 = 64;
        }
      }
      output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
    }
    return output;
  }
  var CSS_REGEXP = /\.css$/gi;
  function isEmbeddedResourceCss(url) {
    return url.match(CSS_REGEXP);
  }
  function getEmbeddedImageUsingXMLHTTPRequest(url) {
    var imageUrl = url;
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          try {
            var data = cobrowse.isIE ? getIEByteArray_ByteStr(this.responseBody) : this.responseText;
            var base64Code = base64Encode(data);
            putEmbeddedResource(imageUrl, base64Code);
          } catch (e) {
            logError("Error(sendEmbeddedImageUsingXMLHTTPRequest) while calling xhr.onreadystatechange: with" + imageUrl, e);
            putEmbeddedResource(imageUrl, "");
          }
        } else {
          log("Cannot load image [" + imageUrl + "]");
          putEmbeddedResource(imageUrl, "");
        }
        this.onreadystatechange = null;
        xhr = null;
      }
    };
    xhr.send(null);
  }
  function getEmbeddedImageUsingCanvas(url) {
    var imageUrl = url;
    var image = new Image;
    image.onload = function() {
      try {
        var base64Code = getImageBase64DataUsingCanvas(this);
        base64Code = base64Code.substring(base64Code.indexOf(",") + 1);
        putEmbeddedResource(imageUrl, base64Code);
      } catch (e) {
        logError("Error(sendEmbeddedImageUsingCanvas) in image.onload: with" + imageUrl, e)("onload in sendEmbeddedImageUsingCanvas: " + imageUrl);
        putEmbeddedResource(imageUrl, "");
      }
    };
    image.onerror = function() {
      log("Cannot load image [" + imageUrl + "]");
      putEmbeddedResource(imageUrl, "");
    };
    image.src = url;
  }
  function getImageBase64DataXML(svgNode) {
    var svgXml = (new XMLSerializer).serializeToString(svgNode);
    var image = new Image;
    image.src = "data:image/svg+xml;base64," + btoa(svgXml);
    return image;
  }
  function getImageBase64DataUsingCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    var context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return canvas.toDataURL();
  }
  function getMediaType(styleSheet) {
    try {
      return styleSheet.media.mediaText;
    } catch (e) {
      return "";
    }
  }
  function isValidMediaType(styleSheet) {
    var media = getMediaType(styleSheet);
    if (!media || (media == "" || (media.indexOf("all") != -1 || (media.indexOf("screen") != -1 || media.indexOf("projection") != -1)))) {
      return true;
    }
    return false;
  }
  function getEmbeddedCssUsingStyleSheets(url) {
    for (var i = 0;i < parent.document.styleSheets.length;i++) {
      var styleSheet = parent.document.styleSheets[i];
      if (styleSheet.href && (_convertToAbsoluteUrl(styleSheet.href) == url && isValidMediaType(styleSheet))) {
        var data = getStyleSheetContent(styleSheet);
        var base64Data = base64Encode(data);
        putEmbeddedResource(url, base64Data);
      }
    }
  }
  function sendEmbeddedResourceToCobrowseServer(origUrl, base64Code, hash) {
    var url = getEmbeddedResourceURL(origUrl);
    sendToCBS(CMD_RESOURCE, base64Code, "action=" + CMD_RESOURCE + "&url=" + encodeURIComponent(url) + "&originalurl=" + encodeURIComponent(origUrl) + "&hash=" + encodeURIComponent(hash));
  }
  function getFullEmbeddedResourceURL(url) {
    return Inq.urls.cobrowseURL + "/cobrowse" + getEmbeddedResourceURL(url);
  }
  var URL_REGEXP_DELETE_DOMAIN = /http[s]?:\/\/[\w-.:]+\/(.*)/;
  var URL_REGEXP_DIRUP = /\/[\w%-]+\/\.\.\//g;
  function deleteUpDireSection(url) {
    var path = url;
    while (path.match(URL_REGEXP_DIRUP)) {
      path = path.replace(URL_REGEXP_DIRUP, "/");
    }
    return path;
  }
  function getEmbeddedResourceURL(url) {
    var path = "/" + url.match(URL_REGEXP_DELETE_DOMAIN)[1];
    path = deleteUpDireSection(path);
    return "/" + REPOSITORY_DIRECTORY + path + (path.indexOf("?") == -1 ? "?" : "&") + "engagementID=" + getChatID();
  }
  var resources = {};
  var STATE_NEW = 0;
  var STATE_CHECKED = 1;
  var STATE_SENT = 2;
  function addEmbeddedResource(absoluteUrl) {
    var correctedUrl = deleteUpDireSection(absoluteUrl);
    if (!resources[correctedUrl]) {
      resources[correctedUrl] = {state:STATE_NEW, correctedUrl:getEmbeddedResourceURL(correctedUrl), hash:null, data:null};
      getResource(correctedUrl);
    }
  }
  function putEmbeddedResource(url, data) {
    if (!resources[url]) {
      resources[url] = {state:STATE_CHECKED, correctedUrl:getEmbeddedResourceURL(url)};
      logInfo("Info(putEmbeddedResource): Add unknown resource [" + url + "].");
    }
    resources[url].data = data;
    resources[url].hash = generateHashCode(data);
  }
  function createExecuteAttrProcessor(inlineAttr) {
    return function(node, tagfilter, attrProcessor) {
      var overrides = tagfilter.attributes ? tagfilter.attributes : {};
      for (var i = 0;i < node.attributes.length;i++) {
        var attr = node.attributes[i];
        if (attr.specified) {
          var attrName = attr.name.toLowerCase();
          if (overrides[attrName] === undefined) {
            attrProcessor(node, attrName, attr.value);
          }
        }
      }
      for (var a in overrides) {
        var value = overrides[a](node);
        if (value != null) {
          inlineAttr(a, value);
        }
      }
      var $this = $(node);
      var val = $this.val();
      if (val) {
        val = val.toString();
        if (val) {
          inlineAttr("value", htmlFilter.content($this, val));
        }
      }
    };
  }
  function createDefaultAttributeProcessor(inlineAttr, attrFilter) {
    return function(obj, name, value) {
      var attrProcessor = attrFilter[name];
      if (attrProcessor) {
        attrProcessor(obj, name, value);
      } else {
        if (value != null) {
          inlineAttr(name, value);
        }
      }
    };
  }
  $.fn.generateHtml = function() {
    function drop() {
    }
    function bk(str) {
      return function() {
        return str;
      };
    }
    function normalizeDimension(value) {
      if (jQuery.isNumeric(value)) {
        return value + "px";
      }
      return value;
    }
    var ATTR_FILTERS = {onblur:drop, onchange:drop, onclick:drop, ondblclick:drop, onfocus:drop, onkeydown:drop, onkeypress:drop, onkeyup:drop, onload:drop, onmousedown:drop, onmousemove:drop, onmouseout:drop, onmouseover:drop, onmouseup:drop, onreset:drop, onselect:drop, onsubmit:drop, onunload:drop, sizcache:drop, sizset:drop, tealeaf:drop, container:drop, advisorfilter:drop, filter:drop, value:drop, style:function(obj, name, value) {
      try {
        inlineAttr(name, fixLinkDataInStyle(obj.style.cssText.toLowerCase()));
      } catch (e) {
        logError("Error (style processing)", e);
      }
    }, src:function(obj, name, value) {
      var url = _convertToAbsoluteUrl(value);
      if (obj.tagName && (obj.tagName.toLowerCase() == "img" && (value.indexOf("data:image") == -1 && isEmbeddedResource(url)))) {
        try {
          inlineAttr(name, getFullEmbeddedResourceURL(url));
          addEmbeddedResource(url, obj);
        } catch (e) {
          log("Cannot embed the image " + value);
          inlineAttr(name, url);
        }
      } else {
        inlineAttr(name, url);
      }
    }, href:function(obj, name, value) {
      inlineAttr("onclick", "window.whenClicked(this); return false;");
      inlineAttr(name, _convertToAbsoluteUrl(value));
    }, background:function(obj, name, value) {
      inlineAttr(name, _convertToAbsoluteUrl(value));
    }};
    var defaultAttributeProcessor = createDefaultAttributeProcessor(inlineAttr, ATTR_FILTERS);
    var DEFAULT_TAG_FILTER = {attrProcessor:defaultAttributeProcessor};
    var blockRegex = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i;
    function isBlockTag(tagName) {
      return blockRegex.test(tagName);
    }
    function getComputedStyleValue(node, prop) {
      try {
        if (parent.window.getComputedStyle) {
          return parent.window.getComputedStyle(node).getPropertyValue(prop);
        }
      } catch (e) {
        logError("Error(getComputedStyleValue): ", e);
      }
      return "auto";
    }
    function getFakeTag(blockElement) {
      return{tag:blockElement ? "div" : "span", processTagBody:drop, attrProcessor:drop};
    }
    function generateStyle(obj, backgroundImage, tag) {
      var styleStr = "";
      if (tag == "span") {
        styleStr += "display:inline-block;";
      }
      if (backgroundImage) {
        styleStr += "background:url(" + backgroundImage + ") no-repeat center white;";
      }
      var height = obj.height;
      if (!height) {
        height = getComputedStyleValue(obj, "height");
      }
      if (height) {
        styleStr += "height:" + normalizeDimension(height) + ";";
      }
      var width = obj.width;
      if (!width) {
        width = getComputedStyleValue(obj, "width");
      }
      if (width) {
        styleStr += "width:" + normalizeDimension(width) + ";";
      }
      return styleStr;
    }
    var EMBED_TAG_FILTER = getFakeTag(false);
    EMBED_TAG_FILTER.attributes = {style:function(node) {
      return generateStyle(node, getServerPath() + "flash_logo.png", EMBED_TAG_FILTER.tag);
    }};
    var HIDDEN_BLOCK_TAG_FILTER = getFakeTag(true);
    HIDDEN_BLOCK_TAG_FILTER.attributes = {style:function(node) {
      return generateStyle(node, null, HIDDEN_BLOCK_TAG_FILTER.tag);
    }};
    var HIDDEN_INLINE_TAG_FILTER = getFakeTag(false);
    HIDDEN_INLINE_TAG_FILTER.attributes = {style:function(node) {
      return generateStyle(node, null, HIDDEN_INLINE_TAG_FILTER.tag);
    }};
    var SVG_TAG_FILTER = getFakeTag(false);
    SVG_TAG_FILTER.attributes = {style:function(node) {
      try {
        var image = getImageBase64DataXML(node);
        return generateStyle(image, getImageBase64DataUsingCanvas(image), SVG_TAG_FILTER.tag);
      } catch (e) {
        logError("Error(SVG_TAG_FILTER.attributes = { style: function(node) })", e);
        return generateStyle(node, null, SVG_TAG_FILTER.tag);
      }
    }};
    var CANVAS_TAG_FILTER = getFakeTag(false);
    CANVAS_TAG_FILTER.attributes = {style:function(node) {
      try {
        var image = node.toDataURL();
        return generateStyle(node, image, CANVAS_TAG_FILTER.tag);
      } catch (e) {
        logError("Error(CANVAS_TAG_FILTER.attributes = { style: function(node) })", e);
        return generateStyle(node, null, CANVAS_TAG_FILTER.tag);
      }
    }};
    var TAG_FILTERS = {div:{filter:function(obj) {
      return obj.id != DIV_ID_COBROWSE_BANNER;
    }}, area:{allowEmpty:true}, base:{allowEmpty:true}, basefont:{allowEmpty:true}, br:{allowEmpty:true}, col:{allowEmpty:true}, frame:{allowEmpty:true}, hr:{allowEmpty:true}, img:{allowEmpty:true, attributes:{style:function(obj) {
      var styleStr = "";
      ["height", "width"].forEach(function(attribute) {
        if (!obj.getAttribute(attribute) && (!obj.style[attribute] && obj[attribute])) {
          styleStr += attribute + ":" + obj[attribute] + "px;";
        }
      });
      return styleStr + obj.style.cssText;
    }}}, isindex:{allowEmpty:true}, link:{allowEmpty:true}, meta:{allowEmpty:true}, param:{allowEmpty:true}, keygen:{allowEmpty:true}, menuitem:{allowEmpty:true}, source:{allowEmpty:true}, track:{allowEmpty:true}, wbr:{allowEmpty:true}, object:EMBED_TAG_FILTER, embed:EMBED_TAG_FILTER, svg:SVG_TAG_FILTER, canvas:CANVAS_TAG_FILTER, iframe:{attributes:{src:bk(""), "class":function(obj) {
      return obj.id == "inqChatStage" ? "chatWindow" : obj["class"];
    }, "style":function(obj) {
      if (obj.id == "inqChatStage" && Inq.CHM.isPersistentChatActive()) {
        return "display: none !important; visibility: hidden;";
      }
      return obj["style"] && obj.style.cssText ? obj.style.cssText : null;
    }}}, form:{attributes:{action:bk("return false;"), onsubmit:bk("return false;"), target:bk("_this")}}, input:{allowEmpty:true, attributes:{checked:function(obj) {
      if (obj.checked) {
        inlineAttr("checked", "checked");
      }
    }}}, select:{processTagBody:function(obj) {
      if (obj.options.length > 0 && obj.selectedIndex != -1) {
        var option = obj.options[obj.selectedIndex];
        data.push("<option>", htmlFilter.content($(obj), option.text), "</option>");
      }
    }}, textarea:{processTagBody:function(obj) {
      data.push(htmlFilter.content($(obj), obj.value));
    }}, style:drop, script:drop, noscript:drop};
    var data = [];
    function inlineAttr(name, value) {
      data.push(" ", name, '="', value.replace ? value.replace(/"/gi, '\\"').replace(/&/gi, "&amp;").replace(/>/gi, "&gt;") : value, '"');
    }
    var executeAttrProcessor = createExecuteAttrProcessor(inlineAttr);
    function processor() {
      if (this.nodeType == 1) {
        var tag = this.tagName.toLowerCase();
        var tagfilter;
        if (htmlFilter.isHiddenNode && htmlFilter.isHiddenNode($(this))) {
          if (isBlockTag(tag)) {
            tagfilter = HIDDEN_BLOCK_TAG_FILTER;
          } else {
            tagfilter = HIDDEN_INLINE_TAG_FILTER;
          }
        } else {
          tagfilter = TAG_FILTERS[tag];
          if (!tagfilter) {
            tagfilter = DEFAULT_TAG_FILTER;
          }
        }
        if (tagfilter !== drop && (!tagfilter.filter || tagfilter.filter(this))) {
          data.push("<", tagfilter.tag ? tagfilter.tag : tag);
          executeAttrProcessor(this, tagfilter, tagfilter.attrProcessor ? tagfilter.attrProcessor : defaultAttributeProcessor);
          if (tagfilter.allowEmpty) {
            data.push("/>");
          } else {
            data.push(">");
            if (tagfilter.processTagBody) {
              tagfilter.processTagBody(this);
            } else {
              $(this.childNodes).generateHtmlInternal(processor);
            }
            data.push("</", tagfilter.tag ? tagfilter.tag : tag, ">");
          }
        }
      } else {
        if (this.nodeType == 3 && htmlFilter.contentNode) {
          data.push(htmlFilter.contentNode(this));
        }
      }
    }
    this.generateHtmlInternal(processor);
    return data;
  };
  $.fn.generateHtmlInternal = function(processor) {
    this.each(processor);
  };
  var BODY_SIZE_LIMIT = 16E3;
  var TIMERINTERVAL_PAGE_UPDATE = 2500;
  var TIMERINTERVAL_AUTH_CHECK = 5E3;
  var COOKIE_COBROWSE = "cobrowse";
  var COOKIE_EXPIRATION = 60 * 60;
  var DIV_ID_COBROWSE_BANNER = "tcCobrowseBannerDiv";
  var DIV_ID_TERMS_AND_CONDITIONS = "tcCbTermsAndConditions";
  var DIV_ID_TERMS_CLOSE = "tcCbTermsAndConditionsClose";
  var activeWindow = true;
  var isAcceptedPage = false;
  var pageUpdateTimer = null;
  var authCheckTimer = null;
  var lastMouse = {X:-1, Y:-1};
  var mouse = {X:-1, Y:-1};
  var modified = false;
  var authorized = null;
  var bodyLength = -1;
  var postQueue = [];
  var sequence = 1;
  var client_csq = 0;
  var lastBodySentArray = [];
  var scrollInfo = {width:0, height:0, left:0, top:0, brwsrHeight:0, brwsrWidth:0};
  var htmlFilter = {};
  var cmdRequest;
  function getJsonpUrl() {
    return Inq.urls.cobrowseURL + "/cobrowse/logging/logjavascript";
  }
  function log(text, send2server) {
    if (window["Inq"] != null && window.Inq["log"] != null) {
      Inq.log("CBC: " + text);
    }
    if (send2server === true) {
      sendByJsonP(getJsonpUrl(), text, "INFO");
    }
  }
  function logInfo(message) {
    log(message, true);
  }
  function logError(message, e) {
    var errorDetails = message;
    if (logError.caller != null) {
      errorDetails += ",at:" + logError.caller.toString().split("{")[0];
    }
    if (e && e.message) {
      errorDetails += ",\nDetail:" + e.message;
      if (e.stack != null) {
        errorDetails += ",\nStack Trace:" + e.stack;
      }
    }
    log(errorDetails);
    sendByJsonP(getJsonpUrl(), errorDetails, "ERROR");
    return function(value) {
      log("   Trace value:[" + value + "]");
    };
  }
  function sendByJsonP(url, data, level) {
    var jpMsg = "cob.clientError?cid=" + getChatID() + "&wid=" + cobrowse.windowId + "&message=" + data;
    var d = new Date;
    var jpData = {"logger":"Cobrowse", "timestamp":d.getTime(), "level":level, "url":window.location.href, "message":jpMsg, layout:"JsonLayout"};
    $.ajax({type:"GET", url:url, contentType:"application/json", dataType:"jsonp", data:jpData});
  }
  function notifyAgentUponFailure(message) {
    try {
      if (cntAlertToAgent < MAX_ALERT_SENT) {
        cntAlertToAgent++;
        getCoBrowseMgr().sendMessageQuietly(message);
      }
    } catch (e) {
      logError("Error(notifyAgentUponFailure) message=" + message, e);
    }
  }
  function getCheckSum(value) {
    var sum = 305419896;
    try {
      for (var i = 0;i < value.length;i++) {
        sum += value.charCodeAt(i) * i;
      }
    } catch (e) {
      return-1;
    }
    return sum;
  }
  function parseJson(json, defaultValue) {
    try {
      return Inq.CM.JSON.parse(json);
    } catch (e) {
      logError("Error(parseJson) json=" + json, e)("json:" + json);
      return defaultValue;
    }
  }
  function getFlashMovieObject(movieName) {
    if (window.document[movieName] != null) {
      return window.document[movieName];
    }
    if (!cobrowse.isIE) {
      if (document.embeds && document.embeds[movieName]) {
        return document.embeds[movieName];
      } else {
        return document.getElementById(movieName);
      }
    } else {
      return document.getElementById(movieName);
    }
  }
  function saveInputs(inputs, valueFunction) {
    var storage = [];
    for (var ix = 0;ix < inputs.length;ix++) {
      var input = inputs[ix];
      storage.push({input:input, value:valueFunction(input, ix)});
    }
    return storage;
  }
  function initStorage(inputType) {
    inputType.storage = saveInputs(inputType.getElements(), inputType.getValue);
  }
  var banner = function() {
    var divs = false;
    function createBannerDiv() {
      var div = parent.document.createElement("DIV");
      div.id = DIV_ID_COBROWSE_BANNER;
      div.style.display = "block";
      div.innerHTML = cobrowse.bannerHtml;
      var head = parent.document.getElementsByTagName("HEAD")[0];
      if (head) {
        var links = div.getElementsByTagName("LINK");
        for (var i = 0;i < links.length;i++) {
          var link = document.createElement("LINK");
          link.type = "text/css";
          link.rel = "stylesheet";
          link.href = links[i].href;
          head.appendChild(link);
          links[i].parentNode.removeChild(links[i]);
        }
        var styles = div.getElementsByTagName("STYLE");
        for (var i = 0;i < styles.length;i++) {
          var style = document.createElement("STYLE");
          style.type = "text/css";
          head.appendChild(style);
          if (style.styleSheet) {
            style.styleSheet.cssText = styles[i].innerHTML + cssHighlightStyleCI;
          } else {
            style.innerHTML = styles[i].innerHTML + cssHighlightStyleCI;
          }
          styles[i].parentNode.removeChild(styles[i]);
        }
      }
      parent.document.body.appendChild(div);
      return{banner:parent.document.getElementById(DIV_ID_COBROWSE_BANNER), terms:parent.document.getElementById(DIV_ID_TERMS_AND_CONDITIONS), termsClose:parent.document.getElementById(DIV_ID_TERMS_CLOSE)};
    }
    function toggle(div, visible) {
      if (div) {
        var theDisplay = div.style.display;
        if (visible === true) {
          if (theDisplay !== "block") {
            div.style.display = "block";
          }
        } else {
          if (theDisplay !== "none") {
            div.style.display = "none";
          }
        }
      }
    }
    function supportSuppressedLabel() {
      var agentAssisted = parent.document.getElementById("agentAssisted");
      var agentAssistedSuppressed = parent.document.getElementById("agentAssistedSuppressed");
      if (agentAssisted && agentAssistedSuppressed) {
        if (isSuppressed()) {
          agentAssisted.style.display = "none";
          agentAssistedSuppressed.style.display = "block";
        } else {
          agentAssisted.style.display = "block";
          agentAssistedSuppressed.style.display = "none";
        }
      }
    }
    return{termsAndConditions:function(visible) {
      if (divs.terms) {
        toggle(divs.terms, visible);
      }
      if (divs.termsClose) {
        toggle(divs.termsClose, visible);
      }
    }, hide:function() {
      toggle(divs.banner, false);
      this.termsAndConditions(false);
    }, show:function() {
      if (divs) {
        toggle(divs.banner, true);
      } else {
        divs = createBannerDiv();
        toggle(divs.banner, true);
      }
      supportSuppressedLabel();
    }, setCobrowseBannerText:function(bannerText) {
      if (divs && (divs.banner && bannerText)) {
        divs.banner.innerHTML = bannerText;
      }
    }};
  }();
  var inputTypes = {input:{getValue:function(input) {
    switch(input.type.toUpperCase()) {
      case "TEXT":
        return input.value;
      case "CHECKBOX":
      ;
      case "RADIO":
        return "" + input.checked;
      default:
        return null;
    }
  }, getElements:function() {
    return parent.document.getElementsByTagName("INPUT");
  }, cmd:"INP", getCmdData:function(ix, value, input) {
    return{IX:ix, VALU:htmlFilter.content($(input), value)};
  }}, select:{getValue:function(element) {
    return element.options.length > 0 && element.selectedIndex != -1 ? htmlFilter.content($(element), element.options[element.selectedIndex].text) : "";
  }, getElements:function() {
    return parent.document.getElementsByTagName("SELECT");
  }, cmd:"SEL", getCmdData:function(ix, value) {
    return{IX:ix, OPTION:value};
  }}, textArea:{getValue:function(element) {
    return element.value;
  }, getElements:function() {
    return parent.document.getElementsByTagName("TEXTAREA");
  }, cmd:"TA", getCmdData:function(ix, value, input) {
    return{IX:ix, TEXT:htmlFilter.content($(input), value)};
  }}, swf:{getValue:function(element) {
    var movie = getFlashMovieObject(element.name);
    if (movie == null) {
      movie = element;
    }
    try {
      return movie.TGetProperty("/", 4);
    } catch (e) {
      logError("Error(inputTypes.swf.getValue)", e)("inputTypes.swf -> movie.TGetProperty");
    }
    return 0;
  }, getElements:function() {
    var objects = parent.document.getElementsByTagName("OBJECT");
    var swfs = [];
    for (var i = 0;i < objects.length;i++) {
      var obj = objects[i];
      var codebase = null == obj.codeBase ? "" : obj.codeBase.toLowerCase();
      var guid = null == obj.classid ? "" : obj.classid.toLowerCase();
      if (codebase.indexOf("http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab") == 0 || guid == "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000") {
        if (obj.id == "") {
          obj.id = "movie_" + swfs.length;
        }
        if (obj.name == "") {
          obj.name = obj.id;
        }
        if (obj.name != obj.id) {
          obj.id = obj.name;
        }
        swfs.push(obj);
      }
    }
    return swfs;
  }, cmd:"SWF", getCmdData:function(ix, value) {
    return{IX:ix, FRAME:value};
  }}};
  function forAllInputTypes(fn) {
    for (var p in inputTypes) {
      if (inputTypes.hasOwnProperty(p)) {
        fn(inputTypes[p]);
      }
    }
  }
  function requestAICommand() {
    var url = getServerPath() + "cbs/command.js?" + ajaxParams() + "&CSQ=" + client_csq;
    var settings = {dataType:"script", timeout:6E4};
    cmdRequest = $.ajax(url, settings).fail(function() {
      cmdRequest = null;
    });
  }
  function sendCommandCheckEmbeddedResources() {
    var data = [];
    for (var url in resources) {
      if (resources[url].state == STATE_NEW && resources[url].hash != null) {
        data.push(url + "," + resources[url].correctedUrl + "," + resources[url].hash);
        resources[url].state = STATE_CHECKED;
      }
    }
    if (data.length > 0) {
      sendToCBS(CMD_CHECK_EMBEDDED_RESOURCES, data.join(";"), "action=" + CMD_CHECK_EMBEDDED_RESOURCES);
    }
  }
  function sendToCBS(command, data, params, boxID) {
    if (authorized) {
      var url = getServerPath() + "cbs/cobrowse" + "?SEQ=n&APG=" + isAcceptedPage + "&" + ajaxParams() + (params ? "&" + params : "");
      boxID = typeof boxID != "undefined" ? boxID : getBoxId("cbcPost");
      try {
        var queueItem = {command:command, request:["COBROWSE", boxID, Inq.getSiteID(), getInqFrameUrl(), url, data], boxID:boxID};
        postQueue.push(queueItem);
        postQueueItem(false);
      } catch (e) {
        log("Error: " + e.message);
      }
    }
  }
  var uniqBoxNum = 1;
  function getBoxId(prefix) {
    return(prefix ? "" + prefix : "") + uniqBoxNum++;
  }
  var waitingAnswer = false;
  var lastCommandTime = 0;
  function postQueueItem(flag) {
    if (waitingAnswer && flag) {
      waitingAnswer = false;
    }
    if (!waitingAnswer && postQueue.length == 0) {
      lastCommandTime = -1;
    }
    if (!waitingAnswer && postQueue.length > 0) {
      waitingAnswer = true;
      var item = postQueue.shift();
      item.request[4] = item.request[4].replace("?SEQ=n&", "?SEQ=" + sequence++ + "&");
      var currentCommand = item.command;
      if (currentCommand == CMD_HEAD || currentCommand == CMD_BODYPART) {
        if (lastCommandTime != -1) {
          item.request[4] += "&deltaTime=" + (now() - lastCommandTime);
        }
        if (item.request[4].indexOf("&action=") == -1) {
          item.request[4] += "&action=" + currentCommand;
        }
      }
      Inq.FlashPeer.postRequestToIframeProxy(getServerPath(), item.request, item.request[1], getCallbackContext());
      lastCommandTime = now();
    }
  }
  function loadComplete(context) {
    if (context) {
      if (context.eval) {
        eval(context.data);
      }
    }
  }
  function ajaxParams() {
    return "engagementID=" + getChatID() + "&WID=" + cobrowse.windowId;
  }
  function xmlElement(elementName, elementBody) {
    return "<" + elementName + ">" + elementBody + "</" + elementName + ">";
  }
  function sendCommand(command, data, boxID) {
    var dataStrings = [];
    for (var p in data) {
      if (data.hasOwnProperty(p)) {
        dataStrings.push(xmlElement(p, data[p]));
      }
    }
    sendToCBS(command, xmlElement(command, dataStrings.join("")), null, boxID);
  }
  function xmlCdata(elementBody) {
    return "<![CDATA[" + elementBody + "]]\x3e";
  }
  function getFromDocumentElementOrBody(name) {
    return parent.document["documentElement"] != null && !!parent.document.documentElement[name] ? parent.document.documentElement[name] : parent.document.body[name];
  }
  function addScrollData(data) {
    data.BRWSR_HEIGHT = scrollInfo.brwsrHeight;
    data.BRWSR_WIDTH = scrollInfo.brwsrWidth;
    data.SCRLL_HEIGHT = scrollInfo.height;
    data.SCRLL_WIDTH = scrollInfo.width;
    data.SCRLL_LEFT = scrollInfo.left;
    data.SCRLL_TOP = scrollInfo.top;
    return data;
  }
  function addHostedLocation(data) {
    data.LOC = parent.location.href;
    return data;
  }
  function getServerPath() {
    var cobURL = Inq.urls.cobrowseURL;
    if (cobURL.indexOf("https") == -1) {
      cobURL = cobURL.replace("http", "https");
    }
    return cobURL + "/cobrowse/";
  }
  function getCookiePath() {
    return Inq.CM.getIFrameBaseURL();
  }
  function watchMouse(ev) {
    var e = ev ? ev : event;
    mouse.X = e["pageX"] != null ? e.pageX : getFromDocumentElementOrBody("scrollLeft") + e.clientX;
    mouse.Y = e["pageY"] != null ? e.pageY : getFromDocumentElementOrBody("scrollTop") + e.clientY;
    return true;
  }
  function mouseChanged() {
    if (mouse.X != lastMouse.X || mouse.Y != lastMouse.Y) {
      lastMouse.X = mouse.X;
      lastMouse.Y = mouse.Y;
      return lastMouse;
    }
    return false;
  }
  function checkForInputChanges(inputType) {
    var storage = inputType.storage;
    if (storage) {
      for (var ix = 0;ix < storage.length;ix++) {
        var item = storage[ix];
        var value = inputType.getValue(item.input, ix);
        if (item.value != value) {
          sendCommand(inputType.cmd, inputType.getCmdData(ix, value, item.input));
          item.value = value;
        }
      }
    } else {
      var e = new Error(" storage is undefined (inputType.cmd=" + inputType.cmd + ")");
      logError("Error (checkForInputChanges)", e);
    }
  }
  function getScrollingPosition() {
    var position = [0, 0];
    if (typeof parent.window.pageYOffset != "undefined") {
      position = [parent.window.pageXOffset, parent.window.pageYOffset];
    } else {
      if (typeof parent.document.documentElement.scrollTop != "undefined" && parent.document.documentElement.scrollTop > 0) {
        position = [parent.document.documentElement.scrollLeft, parent.document.documentElement.scrollTop];
      } else {
        if (typeof parent.document.body.scrollTop != "undefined") {
          position = [parent.document.body.scrollLeft, parent.document.body.scrollTop];
        }
      }
    }
    return position;
  }
  function updateScrollChanges() {
    var changed = false;
    var scrollPosition = getScrollingPosition();
    var scrollInfoUpdate = {width:getFromDocumentElementOrBody("clientWidth"), height:getFromDocumentElementOrBody("clientHeight"), left:scrollPosition[0], top:scrollPosition[1], brwsrHeight:getFromDocumentElementOrBody("scrollHeight"), brwsrWidth:getFromDocumentElementOrBody("scrollWidth")};
    if (scrollInfo.height != scrollInfoUpdate.height || (scrollInfo.width != scrollInfoUpdate.width || (scrollInfo.left != scrollInfoUpdate.left || (scrollInfo.top != scrollInfoUpdate.top || (scrollInfo.brwsrHeight != scrollInfoUpdate.brwsrHeight || scrollInfo.brwsrWidth != scrollInfoUpdate.brwsrWidth))))) {
      scrollInfo = scrollInfoUpdate;
      changed = true;
    }
    return changed;
  }
  function windowHasFocus() {
    return window.parent.document.hasFocus();
  }
  function getChatID() {
    if (window["Inq"] != null && Inq.CHM) {
      return Inq.CHM.getChatID();
    } else {
      log("chat manager [Inq.CHM] is not initialized");
    }
    return 0;
  }
  function isValidChatID() {
    return getChatID() != 0;
  }
  function whenActiveWindow() {
    if (isValidChatID()) {
      clearPageUpdateTimer();
      if (activeWindow || windowHasFocus()) {
        if (isSuppressed()) {
          sendCommand(CMD_SUPPRESS, {}, CMD_SUPPRESS);
        } else {
          sendCommand(CMD_CURRENT_WINDOW, {}, CMD_CURRENT_WINDOW);
        }
      }
      setPageUpdateTimer();
    }
  }
  function getHTML() {
    try {
      lastBodySentArray = [];
      if (isValidChatID()) {
        if (isSuppressed()) {
          cobrowseSuppressedPage();
        } else {
          sendHead();
          sendBody();
        }
      }
      return true;
    } catch (e) {
      logError("Error(getHTML)", e)("getHTML");
      cbcFailHandler(Inq.getLocalizedMessage("cobrowseUnexpectedFail"));
    }
    return false;
  }
  function getInqFrameUrl() {
    return getDomain(inqFrame.location) + inqFrame.location.pathname;
  }
  function clearPageUpdateTimer() {
    try {
      if (pageUpdateTimer != null) {
        window.clearTimeout(pageUpdateTimer);
      }
      pageUpdateTimer = null;
    } catch (e) {
      logError("Error(clearPageUpdateTimer)", e);
    }
  }
  function setPageUpdateTimer() {
    if (pageUpdateTimer == null) {
      pageUpdateTimer = window.setTimeout(checkForUpdates, TIMERINTERVAL_PAGE_UPDATE);
    }
  }
  function setAuthMode(mode) {
    if (mode.auth) {
      var wasNotAuthorized = !authorized;
      authorized = mode;
      if (cobrowse.isPersistentWindow) {
        clearPageUpdateTimer();
      } else {
        if (wasNotAuthorized) {
          whenActiveWindow();
          getHTML();
          banner.show();
          var cobMgr = getCoBrowseMgr();
          if (cobMgr != null) {
            if (!(cobrowse.isPersistentWindow && cobrowse.isIE)) {
              try {
                cobMgr.focusCobEndBtn();
              } catch (errDom) {
              }
            }
          }
          clearPageUpdateTimer();
          setPageUpdateTimer();
        }
      }
    } else {
      authorized = null;
      banner.hide();
      removeCobEndButton();
      clearPageUpdateTimer();
    }
    return authorized;
  }
  function getCallbackContext() {
    var context = {};
    context["callbackFun"] = loadComplete;
    return context;
  }
  function checkAuthorized() {
    if (isValidChatID()) {
      var data = ["CBCHECK", PS_CBC_CHECK, Inq.getSiteID(), getInqFrameUrl(), COOKIE_COBROWSE];
      Inq.CM.postRequestToIframe(getCookiePath(), data, PS_CBC_CHECK, getCallbackContext());
      sendCommandCheckEmbeddedResources();
    }
  }
  function getItemById(id) {
    var parts = id.split(":");
    if (parts.length == 1) {
      return parent.document.getElementById(id);
    } else {
      if (parts[1] == "text") {
        return textNode(parent.document.getElementById(parts[0]), parseInt(parts[2]));
      } else {
        var el = parent.document.getElementsByTagName(parts[1])[parseInt(parts[2])];
        if (parts.length < 5) {
          return el;
        } else {
          if (parts[3] == "text") {
            return textNode(el, parseInt(parts[4]));
          } else {
            throw new Error("Element with id=[" + id + "] not found");
          }
        }
      }
    }
  }
  function textNode(el, textIndex) {
    for (var ix = 0, n = 0;ix < el.childNodes.length;ix++) {
      if (el.childNodes[ix].nodeName == "#text") {
        if (n == textIndex) {
          return el.childNodes[ix];
        } else {
          n++;
        }
      }
    }
    throw new Error("Number of text nodes in this element less than predetermined index " + textIndex);
  }
  function getDomain(location) {
    return location.protocol + "//" + location.host;
  }
  function _isSameOrigin(absoluteUrl) {
    try {
      return isSameOrigin(absoluteUrl);
    } catch (e) {
      logError("Error(_isSameOrigin): ", e);
      return true;
    }
  }
  function isSameOrigin(absoluteUrl) {
    if (typeof absoluteUrl != "string") {
      return false;
    }
    return absoluteUrl.indexOf(parent.window.location.protocol + "//") == 0 && absoluteUrl.indexOf("//" + parent.window.location.host) != -1;
  }
  var URL_REGEXP_IS_ABSOLUTE = new RegExp("^[0-9A-z\\.\\+\\-]*:|^//");
  var URL_REGEXP_CHECK_HTTP_PROTOCOL = new RegExp("^https?");
  var URL_REGEXP_GRAB_TO_RIGHTMOST_SLASH = new RegExp(".*/");
  function _convertToAbsoluteUrl(url) {
    try {
      return convertToAbsoluteUrl(url);
    } catch (e) {
      logError("Error(_convertToAbsoluteUrl): ", e);
      return url;
    }
  }
  function convertToAbsoluteUrl(url) {
    var parentLocation = parent.window.location;
    var parentDomain = getDomain(parentLocation);
    var parentPath = parentLocation.pathname;
    if (url == null || url.length == 0) {
      return parentDomain + parentPath;
    } else {
      url = url.trim();
      if (url.match(URL_REGEXP_IS_ABSOLUTE)) {
        if (url.charAt(0) == "/" && url.charAt(1) == "/") {
          return parentLocation.protocol + url;
        } else {
          return url;
        }
      } else {
        var firstChar = url.charAt(0);
        if (firstChar == "/") {
          return parentDomain + url;
        } else {
          if (firstChar == "#" || (firstChar == "?" || firstChar == ";")) {
            return parentDomain + parentPath + url;
          } else {
            return parentDomain + parentPath.match(URL_REGEXP_GRAB_TO_RIGHTMOST_SLASH) + url;
          }
        }
      }
    }
  }
  var URL_REGEXP_SIMPLE = new RegExp("url", "i");
  var URL_REGEXP_REPLACE = /(^.*)(url)(\()([^(]*)(\).*)($)/gi;
  function fixLinkDataInStyle(data) {
    if (data.match(URL_REGEXP_SIMPLE)) {
      var line;
      var lines = data.split("\n");
      var lix;
      for (lix = 0;lix < lines.length;lix++) {
        line = lines[lix];
        while (line.match(URL_REGEXP_REPLACE)) {
          var url = line.replace(URL_REGEXP_REPLACE, "$4");
          if (url.indexOf('"') == 0 || url.indexOf("'") == 0) {
            url = url.substr(1, url.length - 2);
          }
          if (url.charAt(url.length - 1) == "\r") {
            url = url.substr(0, url.length - 1);
          }
          url = _convertToAbsoluteUrl(url);
          if (isEmbeddedResource(url)) {
            addEmbeddedResource(url);
            url = getFullEmbeddedResourceURL(url);
          }
          line = line.replace(URL_REGEXP_REPLACE, "$1u_r_l$3" + url + "$5$6");
          lines[lix] = line;
        }
      }
      data = lines.join("\n").split("u_r_l").join("url");
    }
    return data;
  }
  function getDocType() {
    function constructDocType(name, publicId, systemId) {
      return "<!DOCTYPE " + name + ' PUBLIC "' + publicId + '" "' + systemId + '">';
    }
    try {
      var docType = window.parent.document.body.parentNode.previousSibling;
      if (docType) {
        if (String(docType.constructor).indexOf("DocumentType") != -1) {
          return constructDocType(docType.name.toLowerCase(), docType.publicId, docType.systemId);
        } else {
          if (docType.nodeValue.indexOf("DOCTYPE") == 0) {
            return "<!" + docType.nodeValue + ">";
          }
        }
      }
      return constructDocType("html", "-//W3C//DTD XHTML 1.0 Transitional//EN", "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd");
    } catch (e) {
      logError("Error(getDocType): ", e);
    }
    return "";
  }
  function getCss() {
    var cssLink = "";
    var cssText = "";
    try {
      for (var i = 0;i < parent.document.styleSheets.length;i++) {
        try {
          var styleSheet = parent.document.styleSheets[i];
          if (isValidMediaType(styleSheet)) {
            if (styleSheet.href) {
              var url = _convertToAbsoluteUrl(styleSheet.href);
              if (URL_REGEXP_CHECK_HTTP_PROTOCOL.test(url)) {
                if (isEmbeddedResource(url)) {
                  cssLink += "<link type='text/css' rel='stylesheet' href='" + getFullEmbeddedResourceURL(url) + "' />\n";
                  addEmbeddedResource(url);
                  getStyleSheetContent(styleSheet);
                } else {
                  cssLink += "<link type='text/css' rel='stylesheet' href='" + url + "' />\n";
                }
              } else {
                log("StyleSheet index " + i + " has incorrect URL and can't be used, HREF: " + url);
              }
            } else {
              cssText += getStyleSheetContent(styleSheet);
            }
          }
        } catch (e) {
          logError("Error(getCss/block error of unaccessible property):", e);
        }
      }
      cssText = "\n<style type='text/css'>\n\x3c!--\n" + cssText + cssHighlightStyleAI + "\n--\x3e\n</style>\n";
    } catch (e) {
      logError("Error(getCss):", e);
    }
    return cssLink + cssText;
  }
  function testGetHTML() {
    var result = false;
    try {
      sendHead(true);
      sendBody(true);
      result = true;
    } catch (e) {
      logError("Error while testing getHTML()", e);
    }
    return result;
  }
  function sendHead(isTest) {
    try {
      updateScrollChanges();
      var data = addScrollData(addHostedLocation({DT:xmlCdata(getDocType()), HEADDATA:xmlCdata(getCss())}));
      if (!isTest) {
        sendCommand(CMD_HEAD, data, CMD_HEAD);
      }
    } catch (e) {
      logError("Error(sendHead): head sending" + (isTest ? " while performance testing" : ""), e);
    }
  }
  function getStyleSheetContent(styleSheet) {
    var cssContent = "";
    var rules = styleSheet.cssRules || styleSheet.rules;
    if (rules != null) {
      for (var j = 0;j < rules.length;j++) {
        try {
          if (rules[j].type != 7) {
            if (rules[j].cssText) {
              cssContent += fixLinkDataInStyle(rules[j].cssText);
            }
          }
        } catch (e) {
          logError("Error(getStyleSheetContent): undefined or something else", e);
        }
      }
    }
    return cssContent;
  }
  function sendBody(isTest) {
    updateScrollChanges();
    var bodyHtmlArray = $(parent.document.body).generateHtml();
    sendCommandCheckEmbeddedResources();
    var data = {};
    var i = 0;
    for (var bodyRest = bodyHtmlArray.join("");bodyRest.length > 0;) {
      data.BODYDATA = xmlCdata(bodyRest.substr(0, BODY_SIZE_LIMIT));
      bodyRest = bodyRest.substr(BODY_SIZE_LIMIT);
      data.MORE = bodyRest.length;
      if (!isTest) {
        sendCommand(CMD_BODYPART, data, CMD_BODYPART + i++);
      }
    }
    lastBodySentArray = bodyHtmlArray;
    forAllInputTypes(initStorage);
  }
  function findDifferenceFromEnd(oldArray, newArray) {
    var ixOld = oldArray.length;
    var ixNew = newArray.length;
    var commonLength = 0;
    var commonString;
    for (;ixNew >= 0 && ixOld >= 0;ixNew--, ixOld--) {
      if (oldArray[ixOld] != (commonString = newArray[ixNew])) {
        break;
      }
      if (commonString != null) {
        commonLength += commonString.length;
      }
    }
    return{"ixNew":ixNew, "ixOld":ixOld, "ln":commonLength};
  }
  function findDifferenceFromStart(oldArray, newArray, limit) {
    var commonLength = 0;
    var commonString;
    var i = 0;
    for (;i < limit;i++) {
      if (oldArray[i] != (commonString = newArray[i])) {
        break;
      }
      if (commonString != null) {
        commonLength += commonString.length;
      }
    }
    return{"ix":i, "ln":commonLength};
  }
  function sendUpdate() {
    var newBodyArray = $(parent.document.body).generateHtml();
    var end = findDifferenceFromEnd(lastBodySentArray, newBodyArray);
    var start = findDifferenceFromStart(lastBodySentArray, newBodyArray, end.ixOld < end.ixNew ? end.ixOld : end.ixNew);
    var update = newBodyArray.slice(start.ix, end.ixNew + 1).join("");
    sendCommandCheckEmbeddedResources();
    lastBodySentArray = newBodyArray;
    updateScrollChanges();
    sendCommand(CMD_UPDATE, addScrollData({UPDATE:xmlCdata(update), IB:start.ln, IE:end.ln}));
  }
  var KEY_COBROWSE_EVENT_TYPE_CLIENT_COBROWSE_END = "49";
  var KEY_COBROWSE_EVENT_TYPE_CLIENT_PERFORMANCE_TEST = "53";
  var KEY_COBROWSE_EVENT_TYPE_CLIENT_COBROWSE_SUPPRESSED = "55";
  function cobrowseSuppressedPage() {
    var cobrowseManager = getCoBrowseMgr();
    var result = false;
    if (cobrowseManager) {
      try {
        result = cobrowseManager.cobrowseSuppressedPage();
      } catch (e) {
        logError("Error (cobrowseSuppressedPage)", e);
      }
    }
    if (!cobrowseManager || !result) {
      sendCobrowseMessage(KEY_COBROWSE_EVENT_TYPE_CLIENT_COBROWSE_SUPPRESSED, Inq.getLocalizedMessage("cobrowseSuppressed"));
    }
  }
  function cbcFailHandler(cbcFailMessage) {
    var cobrowseManager = getCoBrowseMgr();
    var result = false;
    if (cobrowseManager) {
      try {
        result = cobrowseManager.cobrowseFailHandler(cbcFailMessage);
      } catch (e) {
        logError("Error (cbcFailHandler)" + cbcFailMessage, e);
      }
    }
    if (!cobrowseManager || !result) {
      sendCobrowseMessage(KEY_COBROWSE_EVENT_TYPE_CLIENT_COBROWSE_END, cbcFailMessage);
    }
  }
  function performanceTest(silent) {
    var performance = null;
    try {
      performance = calculateCobrowsePerformance();
      var cobrowseManager = getCoBrowseMgr();
      if (cobrowseManager) {
        try {
          cobrowseManager.performanceTest(performance);
        } catch (err) {
          logError("Error (performanceTest: send results)", err);
        }
      } else {
        if (!silent) {
          sendCobrowseMessage(KEY_COBROWSE_EVENT_TYPE_CLIENT_PERFORMANCE_TEST, Inq.getLocalizedMessage("customerPerformanceTest") + execTime + "ms");
        }
      }
    } catch (e) {
      logError("Error (performanceTest: calculateCobrowsePerformance)", e);
      if (!silent) {
        cbcFailHandler(Inq.getLocalizedMessage("cobrowseInitializationFail"));
      }
    }
    return performance;
  }
  function getCoBrowseMgr() {
    try {
      if (Inq.CM && (Inq.CM.persistentWindow && (Inq.CM.persistentWindow.inqFrame && Inq.CM.persistentWindow.inqFrame.com))) {
        return Inq.CM.persistentWindow.inqFrame.com.inq.flash.client.chatskins.CoBrowseMgr;
      }
      if (inqFrame.com) {
        return inqFrame.com.inq.flash.client.chatskins.CoBrowseMgr;
      }
    } catch (e) {
    }
    return null;
  }
  var ciProxy = function() {
    return{agentEndsCob:function() {
      try {
        getCoBrowseMgr().agentEndsCob();
      } catch (e) {
        logError("Error(ciProxy.agentEndsCob)", e);
      }
    }, sendCobrowseEnded:function() {
      var cobrowseManager = getCoBrowseMgr();
      if (cobrowseManager) {
        try {
          cobrowseManager.sendCobrowseEnded();
        } catch (e) {
          logError("Error(ciProxy.sendCobrowseEnded)", e);
        }
      } else {
        sendCobrowseMessage(KEY_COBROWSE_EVENT_TYPE_CLIENT_COBROWSE_END, Inq.getLocalizedMessage("customerEndCobrowseSession"));
      }
    }};
  }();
  function sendCobrowseMessage(cobrowseEvent, messageText) {
    try {
      Inq.ROM.sendCobrowseMessage(Inq.CHM.getChatID(), Inq.CHM.getAgentID(), Inq.getCustID(), cobrowseEvent, messageText);
    } catch (e) {
      logError("Error (sendCobrowseMessage): cobrowseEvent = " + cobrowseEvent + " message = " + messageText, e);
    }
  }
  function authorize(auth) {
    var authObj = {"auth":auth};
    var authJson = Inq.CM.JSON.stringify(authObj);
    var expiry = auth ? "" : (new Date((new Date).getTime() + COOKIE_EXPIRATION * 1E3)).toGMTString();
    var data = ["CBAUTH", PS_CBC_AUTH, Inq.getSiteID(), getInqFrameUrl(), COOKIE_COBROWSE, authJson, "/cobrowse", expiry];
    Inq.CM.postRequestToIframe(getCookiePath(), data, PS_CBC_AUTH, getCallbackContext());
  }
  function terminateCobrowse(callback) {
    if (authorized) {
      postQueue = [];
      clearPageUpdateTimer();
      resources = {};
      if (!this.isPersistentWindow) {
        banner.hide();
      }
      authorize(cobrowse.NOT_SHARED);
      if (callback) {
        callback();
      }
      authorized = null;
    }
  }
  function filterPageRules(rules, pageMarker) {
    var maskingRules = [];
    var maskingTextRules = [];
    var maskingHiddenRules = [];
    for (var i = 0;i < rules.size();i++) {
      var rule = rules[i];
      if (isRuleForPage(rule) && isValidJQSelector(rule.selector)) {
        if (rule.hidden) {
          maskingHiddenRules.push(rule);
        } else {
          maskingRules.push(rule);
          if (rule.text) {
            maskingTextRules.push(rule);
          }
        }
      }
    }
    return{maskingRules:maskingRules, maskingTextRules:maskingTextRules, maskingHiddenRules:maskingHiddenRules};
  }
  function isRuleForPage(rule) {
    if (!rule.pageMarker && (!rule.urlRegex && (!rule.markerRegex && (!rule.pageId && !rule.contentGroupId)))) {
      return true;
    }
    var result = false;
    if (rule.pageMarker && rule.pageMarker == getPageMarker() || (rule.urlRegex && window.parent.document.URL.match(rule.urlRegex) || (rule.pageId && Inq.LDM.pageCheck(rule.pageId) || (rule.markerRegex && getPageMarker().match(rule.markerRegex) || rule.contentGroupId && Inq.LDM.checkCG(rule.contentGroupId))))) {
      result = true;
    }
    return result;
  }
  function isValidJQSelector(selector) {
    if (selector == "*") {
      return true;
    } else {
      try {
        $("<p>").find(selector);
        return true;
      } catch (e) {
        logError('Invalid selector in BR and it was ignored (filtered), selector: "' + selector + '"', e);
        return false;
      }
    }
  }
  function createContent(pageRules) {
    return function($element, unmaskedValue) {
      var value = unmaskedValue;
      if (value.replace) {
        forAllMatchingRules(pageRules, $element, function(rule) {
          value = value.replace(rule.regex, rule.mask);
        });
      }
      return value;
    };
  }
  function createDetect(pageRules) {
    return function($element, unmaskedValue) {
      var matches = [];
      if (unmaskedValue.replace) {
        forAllMatchingRules(pageRules, $element, function(rule) {
          var offset = 0;
          var value = unmaskedValue;
          var from;
          while ((from = value.search(rule.regex)) > -1) {
            var match = value.match(rule.regex)[0];
            var to = from + match.length;
            matches.push({start:from, end:to});
            offset += to;
            value = value.substr(to);
          }
        });
      }
      return matches;
    };
  }
  function createHideNodeFilter(pageRules) {
    return function($element) {
      for (var i = 0;i < pageRules.length;i++) {
        if ($element.is(pageRules[i].selector)) {
          return true;
        }
      }
      return false;
    };
  }
  function createIsHiddenNode(supportHiddenMask, hideFilter) {
    if (supportHiddenMask) {
      return function(node) {
        return hideFilter(node);
      };
    } else {
      return function(node) {
        return false;
      };
    }
  }
  function createContentNode(supportPrivateMask, contentFilter) {
    if (supportPrivateMask) {
      return function(node) {
        var $parent = $(node.parentNode);
        return contentFilter($parent.hasClass(CSS_CLASS_HIGHLIGHT_TEXT) ? $(node.parentNode.parentNode) : $parent, node.nodeValue);
      };
    } else {
      return function(node) {
        return node.nodeValue;
      };
    }
  }
  function forAllMatchingRules(rules, $element, fn) {
    for (var i = 0;i < rules.length;i++) {
      var rule = rules[i];
      if ($element.is(rule.selector)) {
        fn(rule);
      }
    }
  }
  var chatWindowLeft = null;
  var chatWindowTop = null;
  function detectChatWindowPositionChange() {
    var chatWindowObj = parent.document.getElementById("inqChatStage");
    if (chatWindowObj != null) {
      if (chatWindowLeft != null && (chatWindowTop != null && (chatWindowLeft != chatWindowObj.style.left || chatWindowTop != chatWindowObj.style.top))) {
        modified = true;
      }
      chatWindowLeft = chatWindowObj.style.left;
      chatWindowTop = chatWindowObj.style.top;
    }
  }
  function checkForUpdates() {
    try {
      clearPageUpdateTimer();
      if (cobrowse.isPersistentWindow) {
        return;
      }
      if (authorized && isValidChatID()) {
        if (!lastBodySentArray.isEmpty() && !isSuppressed()) {
          forAllInputTypes(checkForInputChanges);
          if (updateScrollChanges()) {
            sendCommand(CMD_UPDATE, addScrollData({UPDATE:"", IB:0, IE:0}));
          }
          if (mouseChanged()) {
            sendCommand(CMD_MOUSE_POSITION, lastMouse);
          }
        }
        detectChatWindowPositionChange();
        if ((modified || parent.document.body.innerHTML.length != bodyLength) && !isSuppressed()) {
          modified = false;
          if (lastBodySentArray.isEmpty()) {
            sendHead();
            sendBody();
          } else {
            sendUpdate();
          }
          bodyLength = parent.document.body.innerHTML.length;
        } else {
          checkAuthorized();
        }
        if (!cmdRequest) {
          requestAICommand();
        }
      }
      setPageUpdateTimer();
    } catch (e) {
      logError("Error(checkForUpdates)", e);
    }
  }
  function fixOffset(areas, offset, fn) {
    for (var i in areas) {
      var area = areas[i];
      if (area.start < offset && offset < area.end) {
        offset = fn(area);
      }
    }
    return offset;
  }
  function fixOffsetUp(areas, offset) {
    var areasSorted = areas.sort(function(a, b) {
      return a.start - b.start;
    });
    return fixOffset(areasSorted, offset, function(mask) {
      return mask.end;
    });
  }
  function fixOffsetDown(areas, offset) {
    var areasSorted = areas.sort(function(a, b) {
      return b.end - a.end;
    });
    return fixOffset(areasSorted, offset, function(mask) {
      return mask.start;
    });
  }
  function unwrap(obj) {
    var parent = obj.parentNode;
    if ($(parent).hasClass(CSS_CLASS_HIGHLIGHT_TEXT)) {
      $(obj).unwrap();
      return;
    }
    for (var i = 0;i < SUPPORTED_HIGHLIGHT_COLORS.length;i++) {
      if ($(parent).hasClass(CSS_CLASS_HIGHLIGHT_INPUTS + SUPPORTED_HIGHLIGHT_COLORS[i])) {
        $(obj).unwrap();
        return;
      }
      if ($(parent).hasClass(CSS_CLASS_HIGHLIGHT_SELECT + SUPPORTED_HIGHLIGHT_COLORS[i])) {
        $(obj).unwrap();
        return;
      }
    }
  }
  function wrapText(clazz, color, text) {
    return "<span class='" + clazz + "'" + (color ? " style='display: inline !important; background-color: " + color + "'>" : ">") + text + "</span>";
  }
  function wrapInputs(clazz, text) {
    return "<span class='" + clazz + "' style='display: inline-block !important;'>" + text + "</span>";
  }
  function decimalToHex(d, padding) {
    var hex = d.toString(16);
    padding = typeof padding === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
      hex = "0" + hex;
    }
    return hex;
  }
  function colorToHex(color) {
    if (!color || color.substr(0, 1) === "#") {
      return color;
    }
    var digits = /(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
    if (digits == null) {
      digits = /(.*?)rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+\.\d+)\)/.exec(color);
    }
    if (digits == null) {
      return color;
    }
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    return "#" + decimalToHex(red, 2) + decimalToHex(green, 2) + decimalToHex(blue, 2);
  }
  function highlightElement(color) {
    try {
      if (!color) {
        throw new Error(" color parameter is invalid for [" + color + "]");
      }
      var parent = this.parentNode;
      var nodeName = this.nodeName;
      if (parent == null) {
        throw new Error(" Parent is null for " + nodeName);
      } else {
        if (nodeName == "#text" && /[^ \t\n\r]/.test(this.textContent)) {
          if ($(parent).hasClass(CSS_CLASS_HIGHLIGHT_TEXT) && colorToHex(parent.style.backgroundColor) == color.toLowerCase()) {
            log("Node already highlighted by specified color [" + color + "]");
          } else {
            if ($(parent).hasClass(CSS_CLASS_HIGHLIGHT_TEXT) && parent.childNodes.length == 1) {
              unwrap(this);
            }
            $(this).wrap(wrapText(CSS_CLASS_HIGHLIGHT_TEXT, color, ""));
          }
        } else {
          if (nodeName == "SELECT") {
            unwrap(this);
            $(this).wrap(wrapInputs(CSS_CLASS_HIGHLIGHT_SELECT + color.replace("#", ""), ""));
          } else {
            if (nodeName == "BUTTON" || (nodeName == "INPUT" || nodeName == "TEXTAREA")) {
              unwrap(this);
              $(this).wrap(wrapInputs(CSS_CLASS_HIGHLIGHT_INPUTS + color.replace("#", ""), ""));
            } else {
              if (nodeName != "#comment" && (nodeName != "IFRAME" && (nodeName != "STYLE" && (nodeName != "SCRIPT" && nodeName != "NOSCRIPT")))) {
                $(this).contents().each(highlightElement, [color]);
              }
            }
          }
        }
      }
    } catch (e) {
      logError("Error (highlightElement)", e);
    }
  }
  function stripEnd(node, offset) {
    try {
      if (node.nodeValue == null) {
        return;
      }
      if (offset != -1) {
        var text = node.nodeValue;
        var maskAreas = htmlFilter.detect($(node.parentNode), text);
        var end = fixOffsetUp(maskAreas, offset);
        if (end < text.length) {
          $(node).after(text.substring(end));
          node.nodeValue = text.substring(0, end);
        }
      }
    } catch (e) {
      logError("Error(stripEnd)", e);
    }
  }
  function stripStart(node, offset) {
    try {
      if (node.nodeValue == null) {
        return;
      }
      var text = node.nodeValue;
      var maskAreas = htmlFilter.detect($(node.parentNode), text);
      var start = fixOffsetDown(maskAreas, offset);
      if (start > 0) {
        $(node).before(text.substring(0, start));
        node.nodeValue = text.substring(start);
      }
    } catch (e) {
      logError("Error(stripStart)", e);
    }
  }
  function traverse(e1, e2, fn) {
    var commonParent = $(e1).closest($(e2).parents()).get(0);
    var current = e1;
    while (current.parentNode != commonParent) {
      if (current.nextSibling) {
        current = current.nextSibling;
        fn(current);
      } else {
        current = current.parentNode;
      }
    }
    var p2 = $(e2).parentsUntil(commonParent).get();
    p2.unshift(e2);
    var to = p2.pop();
    if (current != to) {
      current = current.nextSibling;
    }
    while (current != e2) {
      if (current && current != to) {
        fn(current);
        current = current.nextSibling;
      } else {
        current = to.firstChild;
        to = p2.pop();
      }
    }
  }
  function highlightText(elStart, indexStart, elEnd, indexEnd, color) {
    stripEnd(elEnd, indexEnd);
    stripStart(elStart, indexStart);
    var elements = [elStart, elEnd];
    traverse(elStart, elEnd, function(element) {
      elements.push(element);
    });
    $(elements).each(highlightElement, [color]);
  }
  function getPageMarker() {
    return Inq.LDM.page ? Inq.LDM.page.mID : null;
  }
  function uploadResources(urls) {
    for (var j = 0;j < urls.length;j++) {
      uploadResource(urls[j]);
    }
  }
  function uploadResource(url) {
    var resource = resources[url];
    if (resource) {
      if (resource.state == STATE_CHECKED && resource.data) {
        resource.state = STATE_SENT;
        sendEmbeddedResourceToCobrowseServer(url, resource.data, resource.hash);
      }
    } else {
      logInfo("Info(uploadResource): Try upload unknown resource [" + url + "], but requested from the server.");
      resource = {state:STATE_CHECKED, correctedUrl:getEmbeddedResourceURL(url), data:null, hash:null};
      resources[url] = resource;
      getResource(url);
    }
  }
  function getResource(url) {
    try {
      if (isEmbeddedResourceCss(url)) {
        getEmbeddedCssUsingStyleSheets(url);
      } else {
        if (isCanvasSupported) {
          getEmbeddedImageUsingCanvas(url);
        } else {
          getEmbeddedImageUsingXMLHTTPRequest(url);
        }
      }
    } catch (e) {
      logError("Error(getResource) Uploading [" + url + "] failed", e);
    }
  }
  function executeCommand(command) {
    try {
      eval("cobrowse.cbCommands." + command);
    } catch (e) {
      logError("Error(cobrowse.cbCommands:executeCommand)", e)("executeCommand");
    }
  }
  function createTag(tag, attributes, content) {
    var tag = document.createElement("div");
    for (var attribute in attributes) {
      tag.setAttribute(attribute, attributes[attribute]);
    }
    if (content) {
      tag.appendChild(document.createTextNode(content));
    }
    return tag;
  }
  function buildFakeDomTree() {
    var root = createTag("p", {});
    for (var i = 0;i < 10;i++) {
      var tag = createTag("div", {id:"div" + i}, "abcdefg");
      for (var j = 0;j < 10;j++) {
        root.appendChild(createTag("span", {id:"span" + j}, "bbbbbb"));
      }
      root.appendChild(tag);
    }
    return root;
  }
  function now() {
    return(new Date).getTime();
  }
  function calculateCobrowsePerformance() {
    var startTime = now();
    var bodyHtmlArray = $(buildFakeDomTree()).generateHtml();
    return now() - startTime;
  }
  var eventBindingsToUnbind = [];
  function bindEx($element, eventType, handler) {
    if (typeof eventType === "string") {
      eventBindingsToUnbind.push({$element:$element, eventType:eventType, handler:handler});
      $.fn.bind.call($element, eventType, handler);
    } else {
      var events = eventType;
      for (var event in events) {
        bindEx($element, event, events[event]);
      }
    }
  }
  function reset() {
    eventBindingsToUnbind.forEach(function(binding) {
      $.fn.unbind.call(binding.$element, binding.eventType, binding.handler);
    });
  }
  return{getCobrowseBannerText:function() {
    return this.bannerHtml;
  }, setCobrowseBannerText:function(bannerHtml) {
    this.bannerHtml = bannerHtml;
    if (banner) {
      banner.setCobrowseBannerText(bannerHtml);
    }
  }, isCobrowseEngaged:function() {
    return!!authorized;
  }, isSharedControl:function() {
    return authorized && authorized.auth & cobrowse.SHARED_CONTROL;
  }, stop:function() {
    terminateCobrowse(ciProxy.sendCobrowseEnded);
    var cobMgr = getCoBrowseMgr();
    if (cobMgr != null) {
      cobMgr.setFocusOnChatInputField();
    }
  }, stopQuiet:function() {
    terminateCobrowse();
  }, endCobrowse:function() {
    terminateCobrowse(ciProxy.agentEndsCob);
  }, reset:reset, termsAndConditions:banner.termsAndConditions, performanceTest:testGetHTML, accept:function(flagCheckPerformance) {
    if (flagCheckPerformance) {
      performanceTest();
    }
    try {
      isAcceptedPage = true;
      authorize(cobrowse.ACCEPTED);
    } catch (e) {
      logError("Error(accept)", e);
      cbcFailHandler(Inq.getLocalizedMessage("cobrowseInitializationFail"));
      throw e;
    }
  }, acceptShare:function(flagCheckPerformance) {
    if (flagCheckPerformance) {
      performanceTest();
    }
    try {
      isAcceptedPage = true;
      authorize(cobrowse.ACCEPTED | cobrowse.SHARED_CONTROL);
    } catch (e) {
      logError("Error(acceptShare)", e);
      cbcFailHandler(Inq.getLocalizedMessage("cobrowseInitializationFail"));
      throw e;
    }
  }, callBackAuthorized:function(json, boxID) {
    setAuthMode(getAuthModeFromJson(json, boxID));
  }, callBackProxyError:function(cmd, boxID, errorStr) {
    if (isValidChatID()) {
      if (boxID == CMD_CURRENT_WINDOW || (boxID == CMD_HEAD || boxID.indexOf(CMD_BODYPART) == 0)) {
        notifyAgentUponFailure("Cobrowse data transfer failed, error code [" + boxID + "]");
      } else {
        if (boxID == PS_CBC_AUTH) {
          notifyAgentUponFailure("Cobrowse enable failed, error code [" + boxID + "]");
        }
      }
      log(errorStr);
    }
  }, requestAICommand:function() {
    if (authorized) {
      requestAICommand();
    } else {
      cmdRequest = null;
    }
  }, runCommand:function(command, csq) {
    if (command && csq > client_csq) {
      client_csq = csq;
      executeCommand(command);
    }
  }, runServerCommand:function(command) {
    if (command) {
      executeCommand(command);
    }
  }, ackReceived:function(json, boxId) {
    try {
      postQueueItem(true);
    } catch (e) {
      logError("Error(ackReceived)", e)(json);
      waitingAnswer = false;
    }
  }, getHTML:function() {
    return getHTML();
  }, highlightInputField:function(inputId, color) {
    $(getItemById(inputId)).each(highlightElement, [color]);
    modified = true;
  }, unhighlight:function() {
    $("." + CSS_CLASS_HIGHLIGHT_TEXT, window.parent.document).each(function(index) {
      $(this).contents().unwrap();
    });
    for (var i = 0;i < SUPPORTED_HIGHLIGHT_COLORS.length;i++) {
      $("." + CSS_CLASS_HIGHLIGHT_INPUTS + SUPPORTED_HIGHLIGHT_COLORS[i], window.parent.document).each(function(index) {
        $(this).contents().unwrap();
      });
      $("." + CSS_CLASS_HIGHLIGHT_SELECT + SUPPORTED_HIGHLIGHT_COLORS[i], window.parent.document).each(function(index) {
        $(this).contents().unwrap();
      });
    }
    modified = true;
  }, doElementClick:function(elementId) {
    if (elementId == "removeButtonTrue") {
      parent.$("#consentModal").find("#removeButtonTrue").click();
    } else {
      if (elementId == "removeButtonFalse") {
        parent.$("#consentModal").find("#removeButtonFalse").click();
      } else {
        getItemById(elementId).click();
      }
    }
  }, setFocusInputField:function(inputId) {
    parent.window.focus();
    $(getItemById(inputId)).select();
  }, pushLink:function(url, target) {
    if (target == null || target == "") {
      target = "_self";
    }
    window.setTimeout('Inq.FlashPeer.PushToFrameset("' + url + '", "' + target + '");', 1E3);
  }, scrollTo:function(x, y) {
    window.parent.scrollTo(x, y);
  }, sendEmbeddedResources:uploadResources, highlightText:function(startId, indexStart, endId, indexEnd, color) {
    highlightText(getItemById(startId), indexStart, getItemById(endId), indexEnd, color);
    modified = true;
  }, initialize:function(maskingConfig, isEmbeddedResource, isIE, cobrowseBannerText, isPersistentWindow) {
    Inq.CBC = this;
    this.isIE = isIE;
    this.isPersistentWindow = isPersistentWindow;
    if (isPersistentWindow) {
      htmlFilter.contentNode = createContentNode(false, function() {
      });
      htmlFilter.isHiddenNode = createIsHiddenNode(false, function() {
      });
      return;
    }
    this.isEmbeddedResource = isEmbeddedResource;
    this.bannerHtml = cobrowseBannerText;
    try {
      if (isIE) {
        supportResponseBodyUtils();
      }
      cobrowse.cbCommands = {Cobrowse:{getHTML:cobrowse.getHTML, highlightInputField:cobrowse.highlightInputField, unhighlight:cobrowse.unhighlight, doElementClick:cobrowse.doElementClick, setFocusInputField:cobrowse.setFocusInputField, endCobrowse:cobrowse.endCobrowse, pushLink:cobrowse.pushLink, highlightText:cobrowse.highlightText, scrollTo:cobrowse.scrollTo, sendEmbeddedResources:cobrowse.sendEmbeddedResources}};
      function whenChange() {
        modified = true;
      }
      bindEx($(window.parent.document.body), {DOMSubtreeModified:whenChange, DOMNodeInserted:whenChange, DOMNodeRemoved:whenChange, DOMCharacterDataModified:whenChange, DOMAttrModified:whenChange});
      bindEx($(window.parent.document), "mousemove", watchMouse);
      bindEx($(window.parent), {mousemove:watchMouse, focus:function(event) {
        activeWindow = true;
        if (!authorized) {
          checkAuthorized();
        } else {
          whenActiveWindow();
        }
      }, blur:function(event) {
        activeWindow = false;
      }});
      var rules = filterPageRules(maskingConfig, getPageMarker());
      htmlFilter.content = createContent(rules.maskingRules);
      htmlFilter.detect = createDetect(rules.maskingRules);
      htmlFilter.contentTextFilter = createContent(rules.maskingTextRules);
      htmlFilter.contentNode = createContentNode(rules.maskingTextRules.length > 0, htmlFilter.contentTextFilter);
      htmlFilter.hideNodeFilter = createHideNodeFilter(rules.maskingHiddenRules);
      htmlFilter.isHiddenNode = createIsHiddenNode(rules.maskingHiddenRules.length > 0, htmlFilter.hideNodeFilter);
      if (Inq.CHM.isChatInProgress()) {
        checkAuthorized();
      } else {
        authorize(cobrowse.NOT_SHARED);
      }
      if (Inq.CHM.isPersistentChatActive() && !Inq.CM.persistentWindow) {
        authCheckTimer = setInterval(checkAuthorized, TIMERINTERVAL_AUTH_CHECK);
      }
      log("Cobrowse initialization complete");
    } catch (e) {
      logError("Error(initialize)", e);
      throw e;
    }
  }, windowId:Math.round(Math.random() * 314156791), SHARED_CONTROL:2, ACCEPTED:1, NOT_SHARED:0, showBanner:banner.show, testHooks:{fixOffsetUp:fixOffsetUp, fixOffsetDown:fixOffsetDown, DEFAULT_AUTH_MODE:DEFAULT_AUTH_MODE, getAuthModeFromJson:getAuthModeFromJson, convertToAbsoluteUrl:convertToAbsoluteUrl, createExecuteAttrProcessor:createExecuteAttrProcessor, createDefaultAttributeProcessor:createDefaultAttributeProcessor, createContent:createContent, createDetect:createDetect, getEmbeddedResourceURL:getEmbeddedResourceURL, 
  getDomain:getDomain, isSameOrigin:isSameOrigin, URL_REGEXP_CHECK_HTTP_PROTOCOL:URL_REGEXP_CHECK_HTTP_PROTOCOL}};
}(jQuery);

