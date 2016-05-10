v3Lander.initSiteDefaultData(function() {

var messages = {};

    messages["notSupportedBrowser"] = "CoBrowse cannot be accepted because the client browser is not supported.";

    messages["agentEndCobrowseSession"] = "Agent ends cobrowse session.";

    messages["cobrowseInitializationFail"] = "Due to system limitations, CoBrowse failed to initialize.";

    messages["customerAcceptsSharedControl"] = "Customer accepts shared browser control.";

    messages["customerPerformanceTest"] = "Execution time of cobrowse performance test is";

    messages["cobrowseNotAccessMainWindow"] = "CoBrowse cannot be accepted because the main window is not accessable.";

    messages["cobrowseUnexpectedFail"] = "CoBrowse has been failed and closed unexpectedly.";

    messages["customerDeclinesCobrowse"] = "Customer declines cobrowse invitation.";

    messages["customerEndCobrowseSession"] = "Customer ends cobrowse session.";

    messages["cobrowseSuppressed"] = "CoBrowse has been suppressed on this page.";

    messages["customerDeclinesSharedControl"] = "Customer declines shared browser control.";

    messages["customerAcceptsCobrowse"] = "Customer accepts cobrowse invitation.";

    messages["cobrowseTestSuccess"] = "Cobrowse client performance test is finished successfully";

    messages["cobrowseTestFail"] = "Cobrowse client performance test has been failed";

var siteAgentGroups = {};

    siteAgentGroups["10004026"] = "BB-Chat";

    siteAgentGroups["10004386"] = "BB-Testing";

    siteAgentGroups["10004745"] = "BB-SocialMedia";

    siteAgentGroups["10004027"] = "BB-Call";

    siteAgentGroups["10004017"] = ";lakjsd";



            return {
                siteID:10003715,
                messages: messages,
                siteAgentGroups: siteAgentGroups,
                psHosturlList:"http://tc2.touchcommerce.com/inqChat.html,http://tc.inq.com/inqChat.html",
                productionFilter:"",
                vanityDomainName: "https://bestbrands.inq.com",
                chatRouterVanityDomain: "chatrouterv3.inq.com",
                clusterEnvironment:"",
                mediaServer: "http://mediav3.inq.com",
                cobrowseURL:"https://cobrowse.inq.com",
                xformsVanityDomain: "formsv3.inq.com",
                language:"en_US",
                persistenceMode:"Self-Detection",
                ciObfuscation:"0",
                JSLoggingDisabled:false,
                JSDebugMode:true,
                rechatinterval:1,
                enableCobrowse:true,
				enableHighlight:true,
                cookiePath:"/",
                rootDomain:"demo.touchcommerce.com",
                c2cToPersistent:false,
                hostedFileURL:"/inqChat.html,http://demo.touchcommerce.com/inqChat.html",
                fileTransferSize:"8",
                defaultAgentGroup:10004026,
                sameOriginReferrerFilterRegex:function(){return true},
                JSBusinessFunctions:function(){ return {
		"loadAddOns": 
                
              function loadAddOns() {
                window.inQ = window.inQ || {};
     
                if (inQ.initialized !== true) {
                  inQ.initialized = true;
                  inQ.addOns = {};
                  inQ.loadedAddOns = [];
                  inQ.requirejQuery = function() {inQ.jQueryRequired = true;};
                  inQ.loadScript = function(url) {
                    var regex = new RegExp(url, 'gi');
                    if (inQ.loadedAddOns.join().match(regex)) {return;}
                    inQ.loadedAddOns.push(url);
					if (url.endsWith(".js")) {
						document.body.appendChild(document.createElement('script')).src = url;
					} else {
						document.body.appendChild(document.createElement('link')).href = url;
					}
                  };
                  inQ.debugMode = location.href.match(/tcDebugMode=true/i) !== null;
                  inQ.console = function() {if (inQ.debugMode && window.console) window.console.debug(arguments);};
                  // inQ.loadScript('https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/safeJQuery.js');
                }
     
                for (var i = 0; i < arguments.length; i++) {inQ.loadScript(arguments[i]);}
              }
            
            ,
		"callAddOn": 
                
              function(addOnName) {
                var a = arguments;
                inQ.addOns[addOnName].call(null, a[1], a[2], a[3], a[4], a[5]);
              }
            
            ,
		"jsonStringify": 
                
              function(obj) { return JSON.stringify(obj); }
            
            ,
		"jsVideoClose": 
                
              function() {
              document.getElementById('inqChatStage').contentDocument.getElementById('video').getElementsByTagName('iframe')[0].contentWindow.postMessage('test','http://mediav3.inq.com');         }
            
            ,
		"jsMVideoClose": 
                
                function() {
                  document.getElementById('tcChat_video').getElementsByTagName('iframe')[0].contentWindow.postMessage('test', 'http://mediav3.inq.com');
                }
              
            ,
		"jsPostToSalesforce": 
                
            function(authParam) {
              var sfAuthUrl = "https://na1.salesforce.com/services/oauth2/token";
              var sfUrl = "https://na15.salesforce.com/services/data/v20.0/sobjects/Lead/";
              var access_token;
              $.ajax({
                    type: "POST",
                    url: sfAuthUrl,
                    data: (''.concat(authParam)).trim(),
                    success: function(data) {
                      console.log("Auth Success");
                      access_token = data.access_token;
                    }
                  });
              $('#mktoForm_4795').submit(function (evt) {
                evt.preventDefault();
                var formPage = $('#mktoForm_4795');
                var specialValues = 
                  ''.concat('Locations:',$('#Which_IBX_Market__c', formPage).val(),
                       ' || Services:',$('#Additional_Services__c', formPage).val(),
                       ' || Comments:',$('#Additional_Questions_Comments__c', formPage).val());
                var userData = {
                  FirstName: $('#FirstName', formPage).val(),
                  LastName: $('#LastName', formPage).val(),
                  Company: $('#Company', formPage).val(),
                  Phone: $('#Phone', formPage).val(),
                  Title: $('#Title', formPage).val(),
                  Email: $('#Email', formPage).val(),
                  Industry: $('#Industry', formPage).val(),
                  Country: $('#Country_Web_To_Lead2__c', formPage).val(),
                  State: $('#State', formPage).val(),
                  Description: specialValues
                };
                console.log("Sending Form Data");
                $.ajax({
                    type: "POST",
                    url: sfUrl,
                    headers: {
                    "Authorization": "Bearer " + access_token,
                    "Content-type": "application/json"
                    },
                    data: JSON.stringify(userData),
                    success: function(data) {
                    console.log("post success!");
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                    console.log(''.concat("jqXHR: ",jqXHR.status,
                                "|| textStatus: ",textStatus,
                                "|| errorThrown: ",jqXHR.responseText));
                    }
                });
                $('#modalForm').modal('hide')
              });}
            
            ,
		"log": 
                
              function(data) {
                window.inqLog = data;
                console.log('===== inqLog: ', data);
              }
            
            ,
		"getInqCustData": 
                
              function(chatID){
                if (typeof window.inqCustData !== 'undefined'){
                  window.inqCustData.chat_id = chatID;
                  return JSON.stringify(window.inqCustData);
                }
              }
            
            ,
		"getUrlParameterByName": 
                
              function(name, defaultValue) {
                name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"),
                  url = location.href.match('inqChat.html') ? window.opener.document.location.href : location.href,
                  results = regex.exec(url),
                  value = results ? decodeURIComponent(results[1].replace(/\+/g, " ")) : "";
                return value || defaultValue;
              }
            
            ,
		"createPostChatSurveyURL": 
                
            function(url, data) {
              console.log('createPostChatSurveyURL(): ', arguments);

              var params = [];

              for (var key in data) {
                if (typeof data[key] === 'function') continue;
                params.push(key + '=' + data[key]);
              }

              params = params.join('&');
              url += (url.indexOf('?') === -1) ? '?' : '&';
              url += params;

              return url;
            }
            
            ,
		"launchKeySurvey": 
                
            function(url){
              try { surveyWindow = window.parent.open(url, 'Post Chat Survey', 'width=635,height=650'); }
              catch (e) { surveyWindow = Inq.win.open(url, 'Post Chat Survey', 'width=635,height=650'); }

              var xLoc = surveyWindow.screenX != undefined ? surveyWindow.screenX : surveyWindow.screenLeft;

              surveyWindow.moveTo(xLoc,20);
              console.log('*** BestBrands | KeySurvey URL: ' + url );
            }
            
            ,
		"getAAforKeySurvey": 
                
            function(aa){
              var aaObj = JSON.parse(aa);
              var aaStr = '';
      
              for (var i in aaObj) {
                if (aaObj.hasOwnProperty(i)) {
                for (var j in aaObj[i]) {
                  if (aaObj[i].hasOwnProperty(j)) {
                    aaStr += ('&' + i + "=" + ((aaObj[i])[j]).replace(/\s+/g, ''));
                  }
                }
                }
              }
      
              return(aaStr);
            }
            
            }},
                surveySpecs:function(){return {
			
				11000055: {id:11000055, name:"BestBrands-Survey" ,x:200, y:100, w:650, h:630, altURL:"http://www.keysurvey.com/f/334239/1e19/?LQID=1&"},
				13000100: {id:13000100, name:"BB-Mobile-Survey" ,x:200, y:100, w:650, h:630, altURL:"http://www.keysurvey.com/f/708835/4ea5/?LQID=1&"}
}},
                mediaMgrData:function(){
                    return {
                        chatThemes:{
				15000384: {
					id:15000384,
					an:"Chris",
					fn:"BestBrands.zip",
					name:"BB",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				17000384: {
					id:17000384,
					an:"Chris",
					fn:"BestBrands_FBL.zip",
					name:"BB-FacebookLike",
					tbh:Number("61"),
					ciw:Number("225"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("300"),
					pw:Number("440")
				},
				18000389: {
					id:18000389,
					an:"Chris",
					fn:"BestBrands_EmbeddedC2Call.zip",
					name:"BB-EmbeddedC2Call",
					tbh:Number("61"),
					ciw:Number("225"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("305"),
					pw:Number("456")
				},
				18000392: {
					id:18000392,
					an:"Chris",
					fn:"BestBrands_C2Call.zip",
					name:"BB-C2Call",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("305"),
					pw:Number("456")
				},
				19000394: {
					id:19000394,
					an:"Rosemary",
					fn:"BestBrands_EMBDCallInChat.zip",
					name:"BB-EMBDCallInChat2",
					tbh:Number("61"),
					ciw:Number("170"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("305"),
					pw:Number("456")
				},
				19000395: {
					id:19000395,
					an:"Chris",
					fn:"BestBrands_AutoCall.zip",
					name:"BB-AutoCall",
					tbh:Number("61"),
					ciw:Number("170"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("305"),
					pw:Number("456")
				},
				20000399: {
					id:20000399,
					an:"Chris",
					fn:"BestBrands_Prechat.zip",
					name:"BB-Prechat",
					tbh:Number("61"),
					ciw:Number("137"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("310"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("310"),
					pw:Number("440")
				},
				21000399: {
					id:21000399,
					an:"Chris",
					fn:"BestBrands_Guide.zip",
					name:"BB-Guide",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("340"),
					pw:Number("440")
				},
				21000402: {
					id:21000402,
					an:"Chris",
					fn:"BestBrands_EmbeddedVideo.zip",
					name:"BB-EmbeddedVideo",
					tbh:Number("61"),
					ciw:Number("35"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("715"),
					dh:Number("440"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("715"),
					pw:Number("440")
				},
				22000401: {
					id:22000401,
					an:"Chris",
					fn:"BestBrands_CallWithChat.zip",
					name:"BB-CallWithChat",
					tbh:Number("61"),
					ciw:Number("170"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("305"),
					pw:Number("456")
				},
				22000402: {
					id:22000402,
					an:"Chris",
					fn:"BestBrands_TargetedOffer.zip",
					name:"BB-TargetedOffer",
					tbh:Number("61"),
					ciw:Number("170"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("300"),
					pw:Number("500")
				},
				23000410: {
					id:23000410,
					an:"BestBrands",
					fn:"BestBrands-TO-StandAlone.zip",
					name:"BB-TO-StandAlone",
					tbh:Number("0"),
					ciw:Number("507"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("506"),
					dh:Number("127"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("506"),
					pw:Number("127")
				},
				23000412: {
					id:23000412,
					an:"Chris",
					fn:"BestBrands-TO-WithChat.zip",
					name:"BB-TO-WithChat",
					tbh:Number("61"),
					ciw:Number("170"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("400"),
					pw:Number("500")
				},
				23000415: {
					id:23000415,
					an:"Chris",
					fn:"BestBrands_SA-Video_Comcast.zip",
					name:"BB-SA-Video-Comcast",
					tbh:Number("61"),
					ciw:Number("35"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("603"),
					dh:Number("376"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("376"),
					pw:Number("603")
				},
				23000416: {
					id:23000416,
					an:"Chris",
					fn:"BestBrands_AP-Video_Comcast.zip",
					name:"BB-AP-Video-Comcast",
					tbh:Number("61"),
					ciw:Number("135"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("499")
				},
				23000417: {
					id:23000417,
					an:"Chris",
					fn:"BestBrands_ComcastVideoWithChat.zip",
					name:"BB-ComcastVideoWithChat",
					tbh:Number("61"),
					ciw:Number("135"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("910"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("910"),
					pw:Number("270")
				},
				24000409: {
					id:24000409,
					an:"Chris",
					fn:"BestBrands_M.zip",
					name:"BB-M",
					tbh:Number("61"),
					ciw:Number("157"),
					cih:Number("61"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24000412: {
					id:24000412,
					an:"Chris",
					fn:"BestBrands_Phone.zip",
					name:"BB-Phone",
					tbh:Number("58"),
					ciw:Number("310"),
					cih:Number("58"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24000448: {
					id:24000448,
					an:"Chris",
					fn:"BestBrands-AP-Form.zip",
					name:"BB-Form",
					tbh:Number("61"),
					ciw:Number("155"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24000458: {
					id:24000458,
					an:"Chris",
					fn:"BB-SpecificAgent.zip",
					name:"BB-SpecificAgent",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24000510: {
					id:24000510,
					an:"Chris",
					fn:"BestBrands_CloudIQ.zip",
					name:"BB-CloudIQ",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("415"),
					dh:Number("215"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("215"),
					pw:Number("415")
				},
				24000511: {
					id:24000511,
					an:"Chris",
					fn:"BestBrands_Guide_TotalGym.zip",
					name:"BB-Guide-TotalGym",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("400"),
					pw:Number("440")
				},
				24000512: {
					id:24000512,
					an:"Chris",
					fn:"BestBrands_Guide_Proactiv.zip",
					name:"BB-Guide-Proactiv",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("400"),
					pw:Number("440")
				},
				24000516: {
					id:24000516,
					an:"Chris",
					fn:"BB-Comcast-HUGE.zip",
					name:"BB-Comcast-HUGE",
					tbh:Number("55"),
					ciw:Number("38"),
					cih:Number("0"),
					d:true,
					cn:"You",
					dw:Number("355"),
					dh:Number("424"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("424"),
					pw:Number("355")
				},
				24000575: {
					id:24000575,
					an:"Chris",
					fn:"BestBrands_SuperGuide.zip",
					name:"BB-SuperGuide",
					tbh:Number("61"),
					ciw:Number("200"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("530"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("530"),
					pw:Number("440")
				},
				24000622: {
					id:24000622,
					an:"Chris",
					fn:"BestBrands-AICI-Baynote.zip",
					name:"BB-AICI-Baynote",
					tbh:Number("61"),
					ciw:Number("195"),
					cih:Number("35"),
					d:false,
					cn:"You",
					dw:Number("440"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("440")
				},
				24000713: {
					id:24000713,
					an:"Chris",
					fn:"BestBrands-FB-Status.zip",
					name:"BB-FB-StatusUpdate",
					tbh:Number("61"),
					ciw:Number("195"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("420"),
					dh:Number("290"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("290"),
					pw:Number("420")
				},
				24000724: {
					id:24000724,
					an:"Chris",
					fn:"BestBrands_ProactiveC2C.zip",
					name:"BB-ProactiveC2Persistent",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("240"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("360"),
					pw:Number("600")
				},
				24000757: {
					id:24000757,
					an:"Chris",
					fn:"BestBrands_Phone_Guide.zip",
					name:"BB-Phone-Guide",
					tbh:Number("58"),
					ciw:Number("310"),
					cih:Number("58"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24000764: {
					id:24000764,
					an:"Chris",
					fn:"BB-ING-Offer-1.zip",
					name:"BB-ING-Offer-1",
					tbh:Number("0"),
					ciw:Number("538"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("533"),
					dh:Number("231"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("231"),
					pw:Number("533")
				},
				24000765: {
					id:24000765,
					an:"Chris",
					fn:"BB-ING-Offer-2.zip",
					name:"BB-ING-Offer-2",
					tbh:Number("0"),
					ciw:Number("464"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("533"),
					dh:Number("231"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("182"),
					pw:Number("464")
				},
				24000769: {
					id:24000769,
					an:"Chris",
					fn:"BB-ING-Guide.zip",
					name:"BB-ING-Guide",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("340"),
					pw:Number("440")
				},
				24000839: {
					id:24000839,
					an:"Chris",
					fn:"BB-NEW.zip",
					name:"BB-NEW",
					tbh:Number("53"),
					ciw:Number("65"),
					cih:Number("0"),
					d:true,
					cn:"You",
					dw:Number("355"),
					dh:Number("424"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("483"),
					pw:Number("356")
				},
				24000860: {
					id:24000860,
					an:"Chris",
					fn:"BestBrands_Phone_v3.zip",
					name:"BB-Phone-v3",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24000861: {
					id:24000861,
					an:"Chris",
					fn:"BestBrands_Phone_v4.zip",
					name:"BB-Phone-v4",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24000862: {
					id:24000862,
					an:"Jessica",
					fn:"TC_v2.zip",
					name:"BB-Phone-TC",
					tbh:Number("45"),
					ciw:Number("100"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24000863: {
					id:24000863,
					an:"Jessica",
					fn:"TC_v2a.zip",
					name:"BB-Phone-TC2",
					tbh:Number("45"),
					ciw:Number("100"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24000866: {
					id:24000866,
					an:"Jake",
					fn:"SP-CSS-Chat-Skin.zip",
					name:"SP-CSS-Chat-Skin",
					tbh:Number("0"),
					ciw:Number("0"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("400"),
					dh:Number("300"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24000937: {
					id:24000937,
					an:"Chris",
					fn:"BestBrands_Phone_v4_NUM.zip",
					name:"BB-Phone-v4-NUM",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24000953: {
					id:24000953,
					an:"Jake",
					fn:"MFS-v1.zip",
					name:"SP-MFS-v1",
					tbh:Number("0"),
					ciw:Number("0"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("420"),
					dh:Number("350"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24000960: {
					id:24000960,
					an:"Chris",
					fn:"BestBrands_Guide_C.zip",
					name:"BB-Guide-OrderStatus",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("340"),
					pw:Number("440")
				},
				24000961: {
					id:24000961,
					an:"Chris",
					fn:"BB-TO-HeadsetCharger.zip",
					name:"BB-TO-HeadsetCharger",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24000962: {
					id:24000962,
					an:"Chris",
					fn:"BB-TO-UnlimitedData.zip",
					name:"BB-TO-UnlimitedData",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24000970: {
					id:24000970,
					an:"Chris",
					fn:"BestBrands_SalesForce.zip",
					name:"BB-SalesForce",
					tbh:Number("61"),
					ciw:Number("140"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("300"),
					pw:Number("400")
				},
				24000977: {
					id:24000977,
					an:"Jake",
					fn:"BestBrands-SelfServe-Guide.zip",
					name:"BB-SP-SelfServe-Guide",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("350"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("300"),
					pw:Number("450")
				},
				24000978: {
					id:24000978,
					an:"Chris",
					fn:"BB-SA-VideoChat.zip",
					name:"BB-SA-VideoChat",
					tbh:Number("61"),
					ciw:Number("35"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("410"),
					dh:Number("350"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("350"),
					pw:Number("410")
				},
				24000986: {
					id:24000986,
					an:"Chris",
					fn:"BB-PostChatSurveyInCI.zip",
					name:"BB-PostChatSurveyInCI",
					tbh:Number("61"),
					ciw:Number("157"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("650"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("400"),
					pw:Number("650")
				},
				24001003: {
					id:24001003,
					an:"Jake",
					fn:"BestBrands-QuickReplies.zip",
					name:"BB-SP-QuickReplies",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001004: {
					id:24001004,
					an:"Jake",
					fn:"BestBrands-TargetedContentManager.zip",
					name:"BB-SP-TargetedContentManager",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001005: {
					id:24001005,
					an:"Jake",
					fn:"BB-SP-Mobile_Quick_Replies.zip",
					name:"BB-SP-Mobile_Quick_Replies",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24001020: {
					id:24001020,
					an:"Jake",
					fn:"BB-SP-Mobile_Quick_Replies_Inside_Input.zip",
					name:"BB-SP-Mobile_Quick_Replies_Inside_Input",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24001047: {
					id:24001047,
					an:"Chris",
					fn:"BB-Phone-TouchGuide.zip",
					name:"BB-Phone-TouchGuide",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001064: {
					id:24001064,
					an:"Chris",
					fn:"BB-Phone-TouchSurvey.zip",
					name:"BB-Phone-TouchSurvey",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001069: {
					id:24001069,
					an:"Chris",
					fn:"BB-ATT-Offer.zip",
					name:"BB-ATT-Offer",
					tbh:Number("61"),
					ciw:Number("170"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001070: {
					id:24001070,
					an:"Chris",
					fn:"BB-ATT-SA-Offer.zip",
					name:"BB-ATT-SA-Offer",
					tbh:Number("0"),
					ciw:Number("507"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("504"),
					dh:Number("123"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("123"),
					pw:Number("504")
				},
				24001071: {
					id:24001071,
					an:"Chris",
					fn:"BB-ATT-Video.zip",
					name:"BB-ATT-Video",
					tbh:Number("61"),
					ciw:Number("135"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("400"),
					pw:Number("500")
				},
				24001072: {
					id:24001072,
					an:"Chris",
					fn:"BB-ATT-SA-Video.zip",
					name:"BB-ATT-SA-Video",
					tbh:Number("61"),
					ciw:Number("50"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("700"),
					dh:Number("425"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("425"),
					pw:Number("700")
				},
				24001075: {
					id:24001075,
					an:"Chris",
					fn:"BB-ATT-VideoWithChat.zip",
					name:"BB-ATT-VideoWithChat",
					tbh:Number("61"),
					ciw:Number("135"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("910"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("910")
				},
				24001078: {
					id:24001078,
					an:"Chris",
					fn:"BB-Phone-PlanGuide.zip",
					name:"BB-P-PlanGuide",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001079: {
					id:24001079,
					an:"Chris",
					fn:"BB-P-Marketing-GS5-Offer.zip",
					name:"BB-P-Marketing-GS5-Offer",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001097: {
					id:24001097,
					an:"Chris",
					fn:"Comcast-Mobile_v1.zip",
					name:"BB-Comcast-TestSkin",
					tbh:Number("0"),
					ciw:Number("0"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001098: {
					id:24001098,
					an:"Jake",
					fn:"BestBrands-IntelligentDefer.zip",
					name:"BB-SP-IntelligentDefer",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001190: {
					id:24001190,
					an:"Jake",
					fn:"BB-SP-SelfServeGuide-140924.zip",
					name:"BB-SP-SelfServeGuide-140924",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001208: {
					id:24001208,
					an:"Chris",
					fn:"BestBrands_Phone_Prechat.zip",
					name:"BB-Phone-Prechat",
					tbh:Number("45"),
					ciw:Number("80"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001224: {
					id:24001224,
					an:"Jake",
					fn:"BB-SP-Dynamic-Pre-Chat-Survey-141006.zip",
					name:"BB-SP-Dynamic-Pre-Chat-Survey-141006",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:false,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001229: {
					id:24001229,
					an:"Chris",
					fn:"BofA.zip",
					name:"BB-BofA",
					tbh:Number("60"),
					ciw:Number("70"),
					cih:Number("0"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("300"),
					pw:Number("400")
				},
				24001232: {
					id:24001232,
					an:"Jake",
					fn:"BB-SP-Automaton_Preview.zip",
					name:"BB-SP-Automaton_Preview",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001243: {
					id:24001243,
					an:"Chris",
					fn:"BofA-SelfServeGuide.zip",
					name:"BB-SP-BofA-SelfServeGuide",
					tbh:Number("60"),
					ciw:Number("70"),
					cih:Number("0"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("300"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("300"),
					pw:Number("400")
				},
				24001244: {
					id:24001244,
					an:"Chris",
					fn:"BofA-C2Call.zip",
					name:"BB-BofA-C2Call",
					tbh:Number("60"),
					ciw:Number("70"),
					cih:Number("0"),
					d:true,
					cn:"You",
					dw:Number("350"),
					dh:Number("225"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("285"),
					pw:Number("350")
				},
				24001252: {
					id:24001252,
					an:"Jake",
					fn:"BB-SP-Pre_Chat_Form.zip",
					name:"BB-SP-Pre_Chat_Form",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("460"),
					pw:Number("590")
				},
				24001299: {
					id:24001299,
					an:"Jake",
					fn:"BB-SP-Hidden-CI.zip",
					name:"BB-SP-Hidden-CI",
					tbh:Number("0"),
					ciw:Number("0"),
					cih:Number("0"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001315: {
					id:24001315,
					an:"Jake",
					fn:"BB-SP-TC_Guide.zip",
					name:"BB-SP-TC_Guide",
					tbh:Number("50"),
					ciw:Number("165"),
					cih:Number("30"),
					d:true,
					cn:"You",
					dw:Number("380"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("1"),
					py:Number("0"),
					ph:Number("400"),
					pw:Number("400")
				},
				24001321: {
					id:24001321,
					an:"Chris",
					fn:"BB-Phone-TabletGuide.zip",
					name:"BB-Phone-TabletGuide",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001330: {
					id:24001330,
					an:"Chris",
					fn:"BB-EmbeddedChat.zip",
					name:"BB-EmbeddedChat",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("315"),
					pos:"ABSOLUTE",
					lx:Number("100"),
					ly:Number("280"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("500")
				},
				24001334: {
					id:24001334,
					an:"Jake",
					fn:"BB-SP-Automaton_Reporting_Test.zip",
					name:"BB-SP_Automaton_Reporting_Test",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("340"),
					pw:Number("440")
				},
				24001350: {
					id:24001350,
					an:"Chris",
					fn:"BB-EmbeddedPrechat.zip",
					name:"BB-EmbeddedPrechat",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("250"),
					pos:"ABSOLUTE",
					lx:Number("100"),
					ly:Number("280"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("500")
				},
				24001375: {
					id:24001375,
					an:"Jessica",
					fn:"ATT_v2b.zip",
					name:"ATT-test_skin",
					tbh:Number("50"),
					ciw:Number("150"),
					cih:Number("50"),
					d:true,
					cn:"Chris",
					dw:Number("395"),
					dh:Number("410"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001386: {
					id:24001386,
					an:"Rochelle",
					fn:"BBank.zip",
					name:"BBank-chat",
					tbh:Number("61"),
					ciw:Number("72"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("305"),
					pw:Number("456")
				},
				24001389: {
					id:24001389,
					an:"Lisa",
					fn:"BestBank_Phone_v4.zip",
					name:"BestBank_Phone_v4",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24001390: {
					id:24001390,
					an:"Jennifer",
					fn:"BBank-SelfServeGuide.zip",
					name:"BBank-SelfServeGuide",
					tbh:Number("61"),
					ciw:Number("72"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("340"),
					pw:Number("440")
				},
				24001392: {
					id:24001392,
					an:"Rachel",
					fn:"BBank-SA-VideoChat.zip",
					name:"BBank-SA-VideoChat",
					tbh:Number("61"),
					ciw:Number("35"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("410"),
					dh:Number("350"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("350"),
					pw:Number("410")
				},
				24001405: {
					id:24001405,
					an:"Agent",
					fn:"ATT-ACIF-Automaton-v2b.zip",
					name:"ATT-ACIF-Automaton-CATO",
					tbh:Number("53"),
					ciw:Number("100"),
					cih:Number("53"),
					d:true,
					cn:"Me",
					dw:Number("340"),
					dh:Number("350"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("450"),
					pw:Number("350")
				},
				24001415: {
					id:24001415,
					an:"Chris",
					fn:"BB-MockCalling.zip",
					name:"BB-MockCalling",
					tbh:Number("61"),
					ciw:Number("137"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("250"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("250"),
					pw:Number("320")
				},
				24001500: {
					id:24001500,
					an:"Jessica",
					fn:"24001500.zip",
					name:"testSkin",
					tbh:Number("100"),
					ciw:Number("160"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("200"),
					dh:Number("200"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001506: {
					id:24001506,
					an:"Chris",
					fn:"BB-Twilio-Call.zip",
					name:"BB-Twilio-Call",
					tbh:Number("61"),
					ciw:Number("50"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("450"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("450")
				},
				24001511: {
					id:24001511,
					an:"Chris",
					fn:"BB-SA-Video.zip",
					name:"BB-SA-Video",
					tbh:Number("61"),
					ciw:Number("35"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("603"),
					dh:Number("376"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("376"),
					pw:Number("603")
				},
				24001561: {
					id:24001561,
					an:"Jessica",
					fn:"24001561.zip",
					name:"Test3",
					tbh:Number("100"),
					ciw:Number("160"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001567: {
					id:24001567,
					an:"Chris",
					fn:"BB-AP-Prechat-SF.zip",
					name:"BB-AP-SalesForce",
					tbh:Number("61"),
					ciw:Number("137"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("335"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("335"),
					pw:Number("440")
				},
				24001576: {
					id:24001576,
					an:"Chris",
					fn:"TracfoneprechatGuide.zip",
					name:"TracfoneprechatGuide",
					tbh:Number("58"),
					ciw:Number("200"),
					cih:Number("20"),
					d:true,
					cn:"You",
					dw:Number("400"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("300"),
					pw:Number("500")
				},
				24001618: {
					id:24001618,
					an:"Jessica",
					fn:"24001618.zip",
					name:"izzyTest",
					tbh:Number("100"),
					ciw:Number("160"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001619: {
					id:24001619,
					an:"Jessica",
					fn:"24001619.zip",
					name:"izzyTest2",
					tbh:Number("100"),
					ciw:Number("160"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001624: {
					id:24001624,
					an:"Chris",
					fn:"BestBrands_Prechat_Routing.zip",
					name:"BB-Prechat-Routing",
					tbh:Number("61"),
					ciw:Number("137"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("310"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("310"),
					pw:Number("440")
				},
				24001644: {
					id:24001644,
					an:"Chris",
					fn:"Paymetric.zip",
					name:"BB-Paymetric",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001648: {
					id:24001648,
					an:"Jessica",
					fn:"24001648.zip",
					name:"izzyTest5",
					tbh:Number("100"),
					ciw:Number("160"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001674: {
					id:24001674,
					an:"Aaron",
					fn:"BB_Phone_test.zip",
					name:"BB_Phone_test",
					tbh:Number("45"),
					ciw:Number("310"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("500")
				},
				24001724: {
					id:24001724,
					an:"Jessica",
					fn:"BB-ATTVideo.zip",
					name:"BB-ATTVideo",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("320"),
					pos:"TOP_LEFT",
					lx:Number("25"),
					ly:Number("25"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("320"),
					pw:Number("499")
				},
				24001740: {
					id:24001740,
					an:"Chris",
					fn:"BB-Twilio-IVR.zip",
					name:"BB-Twilio-IVR",
					tbh:Number("61"),
					ciw:Number("50"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("450"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("450")
				},
				24001749: {
					id:24001749,
					an:"Jessica",
					fn:"BestBrands_v2.zip",
					name:"BestBrands_v2",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001763: {
					id:24001763,
					an:"Jessica",
					fn:"BestInsurance-Standard.zip",
					name:"BestInsurance-Standard",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001764: {
					id:24001764,
					an:"Jessica",
					fn:"BestInsurance_Mobile.zip",
					name:"BestInsurance-Mobile",
					tbh:Number("45"),
					ciw:Number("100"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001780: {
					id:24001780,
					an:"Agent",
					fn:"best-brands-dsktp-v1.zip",
					name:"BB-ACIF-Routing-Guide",
					tbh:Number("40"),
					ciw:Number("80"),
					cih:Number("30"),
					d:true,
					cn:"Me",
					dw:Number("300"),
					dh:Number("400"),
					pos:"BOTTOM_RIGHT",
					lx:Number("100"),
					ly:Number("100"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001789: {
					id:24001789,
					an:"none",
					fn:"BB-Common-Assets.zip",
					name:"BB-Common-Assets",
					tbh:Number("0"),
					ciw:Number("0"),
					cih:Number("0"),
					d:false,
					cn:"none",
					dw:Number("0"),
					dh:Number("0"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001793: {
					id:24001793,
					an:"Chris",
					fn:"BB-Twilio-IVR-voice.zip",
					name:"BB-Twilio-IVR-Voice",
					tbh:Number("61"),
					ciw:Number("50"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("450"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("450")
				},
				24001806: {
					id:24001806,
					an:"Chris",
					fn:"VirtualAgent.zip",
					name:"BB-Virtual-Agent",
					tbh:Number("61"),
					ciw:Number("185"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("499"),
					dh:Number("315"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("315"),
					pw:Number("499")
				},
				24001812: {
					id:24001812,
					an:"Chris",
					fn:"BestBrands_VA3.zip",
					name:"BB-VirtualAgent-Prechat",
					tbh:Number("61"),
					ciw:Number("140"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("300"),
					pw:Number("400")
				},
				24001827: {
					id:24001827,
					an:"Jessica",
					fn:"24001827.zip",
					name:"My Theme",
					tbh:Number("100"),
					ciw:Number("237"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001832: {
					id:24001832,
					an:"Chris",
					fn:"BB-Prechat-CATO.zip",
					name:"BB-Prechat-CATO",
					tbh:Number("61"),
					ciw:Number("137"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("310"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("310"),
					pw:Number("440")
				},
				24001833: {
					id:24001833,
					an:"Jessica",
					fn:"BestBrands_V2-Mobile.zip",
					name:"BestBrands_v2-Mobile",
					tbh:Number("45"),
					ciw:Number("100"),
					cih:Number("45"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001838: {
					id:24001838,
					an:"Re-Use",
					fn:"best-brands-dsktp-v1.zip",
					name:"Re-Use",
					tbh:Number("60"),
					ciw:Number("100"),
					cih:Number("30"),
					d:false,
					cn:"You",
					dw:Number("500"),
					dh:Number("400"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("400"),
					pw:Number("500")
				},
				24001840: {
					id:24001840,
					an:"Touch Assist",
					fn:"TouchAssist-Alt.zip",
					name:"TouchAssist-Alt",
					tbh:Number("53"),
					ciw:Number("65"),
					cih:Number("0"),
					d:true,
					cn:"You",
					dw:Number("355"),
					dh:Number("424"),
					pos:"BOTTOM_RIGHT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("483"),
					pw:Number("356")
				},
				24001858: {
					id:24001858,
					an:"Jessica",
					fn:"24001858.zip",
					name:"New Test",
					tbh:Number("100"),
					ciw:Number("215"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("300"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001859: {
					id:24001859,
					an:"Chris",
					fn:"BB_Guide_test.zip",
					name:"BB-Guide-test",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("340"),
					pw:Number("440")
				},
				24001860: {
					id:24001860,
					an:"Chris",
					fn:"BB_Guide_test_c.zip",
					name:"BB_Guide_test_c",
					tbh:Number("61"),
					ciw:Number("40"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("340"),
					pos:"CENTER",
					lx:Number(""),
					ly:Number(""),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("340"),
					pw:Number("440")
				},
				24001865: {
					id:24001865,
					an:"Chris",
					fn:"BB-Twilio-Call-Adam.zip",
					name:"BB-Twillio-Call-Adam",
					tbh:Number("61"),
					ciw:Number("50"),
					cih:Number("35"),
					d:true,
					cn:"You",
					dw:Number("450"),
					dh:Number("270"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("100"),
					py:Number("100"),
					ph:Number("270"),
					pw:Number("450")
				},
				24001900: {
					id:24001900,
					an:"Chris",
					fn:"tmo-mbl-v1.zip",
					name:"BB-TMobile-Phone",
					tbh:Number("40"),
					ciw:Number("319"),
					cih:Number("40"),
					d:false,
					cn:"You",
					dw:Number("0"),
					dh:Number("0"),
					pos:"TOP_LEFT",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001908: {
					id:24001908,
					an:"Agent",
					fn:"tmo-dsktp-v8alt.zip",
					name:"BB-TMobile-Animation-Demo",
					tbh:Number("50"),
					ciw:Number("100"),
					cih:Number("50"),
					d:true,
					cn:"Me",
					dw:Number("400"),
					dh:Number("570"),
					pos:"BOTTOM_RIGHT",
					lx:Number("100"),
					ly:Number("100"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				}
			},
                        chatSpecs:{
				18000871: {
					id:18000871,
					name:"BestBrands-C2C",
					oId:3202670, // opener id
					stId:10200147, // script tree id
					ctId:15000384,  // chat theme id
					ael:"The agent has exited the chat.",
					emSpId:2000008
				},
				23000878: {
					id:23000878,
					name:"BestBrands-C2Call",
					oId:3202670, // opener id
					stId:10200147, // script tree id
					ctId:18000392,  // chat theme id
					ael:null,
					emSpId:2000008
				},
				23000879: {
					id:23000879,
					name:"BestBrands-EmbeddedC2Call",
					oId:3202670, // opener id
					stId:10200147, // script tree id
					ctId:18000389,  // chat theme id
					ael:null,
					emSpId:2000008
				},
				29000931: {
					id:29000931,
					name:"BestBrands-DirexiPOC",
					oId:17204272, // opener id
					stId:10200147, // script tree id
					ctId:24000458,  // chat theme id
					ael:null, // agent exit line
					svySpId:11000055,
					emSpId:2000008
				},
				29001056: {
					id:29001056,
					name:"BestBrands-DockedC2C",
					oId:3202670, // opener id
					stId:10200147, // script tree id
					ctId:24000839,  // chat theme id
					ael:"Thank you for chatting with us today. The agent has left the chat. For future questions, please click on the chat button located on the bottom right hand of the screen.",
					emSpId:2000008
				},
				29001079: {
					id:29001079,
					name:"BB-Guide",
					oId:3202670, // opener id
					stId:10200147, // script tree id
					ctId:21000399,  // chat theme id
					ael:"The agent has exited the chat.", // agent exit line
					svySpId:11000055,
					emSpId:2000008
				},
				29001267: {
					id:29001267,
					name:"BBank-chat",
					oId:17230163, // opener id
					stId:10200147, // script tree id
					ctId:24001386,  // chat theme id
					ael:"The agent has exited the chat."
				},
				29001269: {
					id:29001269,
					name:"BestBank_Phone_v4",
					oId:17230163, // opener id
					stId:10200147, // script tree id
					ctId:24001389,  // chat theme id
					ael:"The Agent has left the chat.", // agent exit line
					svySpId:13000100,
					emSpId:2000008
				},
				29001270: {
					id:29001270,
					name:"BBank-SelfServeGuide",
					oId:17230163, // opener id
					stId:10200147, // script tree id
					ctId:24001390,  // chat theme id
					ael:null, // agent exit line
					svySpId:11000055,
					emSpId:2000008
				},
				29001271: {
					id:29001271,
					name:"BBank-SA-VideoChat",
					oId:17230163, // opener id
					stId:10200147, // script tree id
					ctId:24001392,  // chat theme id
					ael:null, // agent exit line
					svySpId:11000055,
					emSpId:2000008
				},
				29001414: {
					id:29001414,
					name:"BestBrands_v2",
					oId:3202670, // opener id
					stId:10200147, // script tree id
					ctId:24001749,  // chat theme id
					ael:null,
					emSpId:2000008
				}
			},
                        c2cSpecs:{
				19000531: {
					id:19000531,
					name:"BestBrands-C2C",
					igaa:false, 
					
					thId:17000411,
					chSpId:18000871,
					peId:"inqC2CImgContainer"
				},
				23000547: {
					id:23000547,
					name:"BestBrands-EmbeddedC2Call",
					igaa:false, 
					
					thId:21000430,
					chSpId:23000879,
					peId:"inqC2C2ImgContainer"
				},
				24000548: {
					id:24000548,
					name:"BestBrands-C2Call",
					igaa:false, 
					
					thId:22000431,
					chSpId:23000878,
					peId:"inqC2C4ImgContainer"
				},
				30000628: {
					id:30000628,
					name:"BB-C2C-Content",
					igaa:false, 
					
					thId:31000475,
					chSpId:18000871,
					peId:"contentImgContainer"
				},
				30000643: {
					id:30000643,
					name:"BB-UnityMedia",
					igaa:false, 
					
					thId:31000475,
					chSpId:18000871,
					peId:"touchcommerceChat"
				},
				30000661: {
					id:30000661,
					name:"BB-SP-Left-Anchored-C2C",
					igaa:true, 
					
					thId:33000560,
					chSpId:18000871,
					peId:"inq-SP-C2C-injected-left"
				},
				30000688: {
					id:30000688,
					name:"SP-Clear-C2C",
					igaa:true, 
					
					thId:33000589,
					chSpId:18000871,
					peId:"inq-SP-C2C-Clear"
				},
				30000853: {
					id:30000853,
					name:"BBank-C2C",
					igaa:false, 
					
					thId:33000772,
					chSpId:29001267,
					peId:"inqC2CImgContainer"
				},
				30000854: {
					id:30000854,
					name:"BBank-phone-C2C",
					igaa:true, 
					
					thId:33000772,
					chSpId:29001269,
					peId:"inqC2CImgContainer"
				},
				30000855: {
					id:30000855,
					name:"BBank-SelfServeGuide",
					igaa:true, 
					
					thId:33000773,
					chSpId:29001270,
					peId:"inqC2CImgContainer"
				},
				30000857: {
					id:30000857,
					name:"BBank-VideoChat",
					igaa:true, 
					
					thId:33000776,
					chSpId:29001271,
					peId:"inqC2CImgContainer"
				}
			},
                        c2cThemes:{
				17000411: {
					id:17000411,
					name:"BB-C2C",
					r:"BB-C2C-v5.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				21000430: {
					id:21000430,
					name:"BB-EmbeddedC2Call",
					r:"blank.gif",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				22000431: {
					id:22000431,
					name:"BB-C2Call",
					r:"BB_C2Call.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				31000468: {
					id:31000468,
					name:"BB-DOCKED-C2C",
					r:"BB_C2C_Docked.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				31000473: {
					id:31000473,
					name:"BB-NEW-CI",
					r:"BB-NEW-CI-C2C.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				31000475: {
					id:31000475,
					name:"BB-Modal-C2C",
					r:"BB-C2C-v2-Online.png",
					b:"BB-C2C-v2-Offline.png",
					ah:"BB-C2C-v2-Offline.png",
					d:"BB-C2C-v2-Offline.png",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000560: {
					id:33000560,
					name:"BB-SP-Left-Anchored-C2C",
					r:"BB-SP-C2C-Left-Anchored.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000584: {
					id:33000584,
					name:"SP-Dynamic-Tooltip",
					r:"SP-Dynamic-Tooltip.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000589: {
					id:33000589,
					name:"SP-Clear-C2C-Theme",
					r:"ready-clear.gif",
					b:"busy-clear.gif",
					ah:"after-hours-clear.gif",
					d:"disabled-clear.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000637: {
					id:33000637,
					name:"BB-PlanGuide",
					r:"plan_guide_icon.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000700: {
					id:33000700,
					name:"BB-BofA",
					r:"<span style=\"font-size: 14px; color: #36C; position: relative; top: 8px;\">Chat is available.</span>",
					b:"<span style=\"color: #000000; font-size: 14px; font-weight: normal; position: relative; top: 8px;\">Chat is currently unavailable.</font>",
					ah:"<span style=\"color: #000000; font-size: 14px; font-weight: normal; position: relative; top: 8px;\">Chat is currently unavailable.</font>",
					d:"<span style=\"color: #000000; font-size: 14px; font-weight: normal; position: relative; top: 8px;\">Chat is in progress.</font>",
                    ralt:null,
                    balt:null,
                    ahalt:null,
                    dalt:null,
					renderAsHTML:true
				},
				33000701: {
					id:33000701,
					name:"BB-BofA-Anchored",
					r:"c2c_icon.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:null,
                    balt:null,
                    ahalt:null,
                    dalt:null,
					renderAsHTML:false
				},
				33000702: {
					id:33000702,
					name:"BB-C2C-InContent",
					r:"BB-C2C-v6-Online.png",
					b:"BB-C2C-v6-Busy.png",
					ah:"BB-C2C-v6-AfterHours.png",
					d:"BB-C2C-v6-InProgress.png",
                    ralt:null,
                    balt:null,
                    ahalt:null,
                    dalt:null,
					renderAsHTML:false
				},
				33000710: {
					id:33000710,
					name:"BB-SP-BofA-Guide",
					r:"NeedHelp.png",
					b:"busy-clear.gif",
					ah:"after-hours-clear.gif",
					d:"disabled-clear.gif",
                    ralt:null,
                    balt:null,
                    ahalt:null,
                    dalt:null,
					renderAsHTML:false
				},
				33000713: {
					id:33000713,
					name:"BB-BofA-C2Call",
					r:"<span style=\"position: relative; top: 3px; font-size: 14px; color: #36C; margin-left: 40px;\">Call us</span>",
					b:"<span style=\"position: relative; top: 3px; color: #777; font-size: 14px; font-weight: normal; margin-left: 40px;\">Chat is currently unavailable.</font>",
					ah:"<span style=\"position: relative; top: 3px; color: #777; font-size: 14px; font-weight: normal; margin-left: 40px;\">Chat is currently unavailable.</font>",
					d:"<span style=\"position: relative; top: 3px; color: #777; font-size: 14px; font-weight: normal; margin-left: 40px;\">Call is in progress.</font>",
                    ralt:null,
                    balt:null,
                    ahalt:null,
                    dalt:null,
					renderAsHTML:true
				},
				33000772: {
					id:33000772,
					name:"BBank-Chat",
					r:"BBank-C2C.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Click to Chat Button",
                    balt:" All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:" Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000773: {
					id:33000773,
					name:"BBank-SelfServeGuide",
					r:"BBank-need-help-button.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Need help?",
                    balt:"",
                    ahalt:"",
                    dalt:"",
					renderAsHTML:false
				},
				33000776: {
					id:33000776,
					name:"BBank-VideoChat",
					r:"BBank-VChat_c2c.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Video Chat",
                    balt:"",
                    ahalt:"",
                    dalt:"",
					renderAsHTML:false
				},
				33000980: {
					id:33000980,
					name:"BB-Virtual-Agent",
					r:"BB-C2C-ChatNow.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"Chat Ready",
                    balt:"Chat Busy",
                    ahalt:"Chat After Hours",
                    dalt:"Chat Disabled",
					renderAsHTML:false
				},
				33000982: {
					id:33000982,
					name:"BB-Virtual-Agent-Guide",
					r:"BB-C2C-ChatHelp.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"",
                    balt:"",
                    ahalt:"",
                    dalt:"",
					renderAsHTML:false
				},
				33000983: {
					id:33000983,
					name:"BB-Virtual-Agent-ContactUS",
					r:"VA_ContactUS.png",
					b:"blank.gif",
					ah:"blank.gif",
					d:"blank.gif",
                    ralt:"",
                    balt:"",
                    ahalt:"",
                    dalt:"",
					renderAsHTML:false
				},
				33001025: {
					id:33001025,
					name:"BB-TMobile-C2C",
					r:"<style>\n#c2c-available {\n	z-index: 999999;\n	box-sizing:border-box;\n	cursor: pointer;\n	border: 0;\n	text-decoration: none;\n	text-align: left;\n	font-size: 12pt;\n	line-height: 20px;	\n	color: #ffffff;\n	background: rgba(226,0,116,.9);\n    transition: background-color .3s ease-out;\n	border-radius: 0 5px 5px 0;\n	padding: 0;\n	width: 42px;\n	height: 124px;\n	margin: 0px;\n  	box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.15);\n}\n	\n#c2c-available:hover, #c2c-available:focus {\n	background: rgba(226,0,116,1);\n}\n\n#chat-bubble {\n	margin: 0 0 0 11px;\n}\n\n</style>\n\n<button id=\"c2c-available\" href=\"#\" aria-label=\"Click to chat\" role=\"button\">\n\n<span id=\"chat-bubble\" alt=\"\" role=\"img\" aria-hidden=\"true\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"93.92\" viewBox=\"0 0 20 93.92\"><path d=\"M25.37,108.92H15.3v-1.38h8.8v-5h1.27v6.4Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,101.4H15.3V100H25.37v1.37Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,95.33L15.3,98.91V97.5l8.43-2.9L15.3,91.79V90.36L25.37,93.9v1.43Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,89.28H15.3V82.1h1.25v5.82h3V82.55h1.18v5.38h3.38V82h1.26v7.29Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M21.63,69.46V68.13a4.1,4.1,0,0,1,2.93,1.25,4.23,4.23,0,0,1,1.09,3,4.1,4.1,0,0,1-1.45,3.33,6.09,6.09,0,0,1-4,1.21,5.37,5.37,0,0,1-3.76-1.27A4.38,4.38,0,0,1,15,72.26a4.31,4.31,0,0,1,.88-2.8,3.45,3.45,0,0,1,2.41-1.26v1.34a2.39,2.39,0,0,0-1.53.91,3,3,0,0,0-.54,1.87,2.85,2.85,0,0,0,1.07,2.38,4.8,4.8,0,0,0,3,.84,4.65,4.65,0,0,0,3-.88,2.81,2.81,0,0,0,1.11-2.33,2.78,2.78,0,0,0-.77-2A2.89,2.89,0,0,0,21.63,69.46Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,66.52H15.3V65.15h4.14V59.93H15.3V58.55H25.37v1.38H20.65v5.22h4.72v1.37Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,57.51L15.3,53.77V52.26l10.07-3.75V50l-3,1.07v4l3,1.07v1.42ZM21.18,54.6V51.46L16.74,53Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,45.75H16.52v3.18H15.3V41.2h1.22v3.18h8.85v1.37Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M25.37,107.92H15.3v-1.38h8.8v-5h1.27v6.4Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M25.37,100.4H15.3V99H25.37v1.37Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M25.37,94.33L15.3,97.91V96.5l8.43-2.9L15.3,90.79V89.36L25.37,92.9v1.43Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M25.37,88.28H15.3V81.1h1.25v5.82h3V81.55h1.18v5.38h3.38V81h1.26v7.29Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M21.63,68.46V67.13a4.1,4.1,0,0,1,2.93,1.25,4.23,4.23,0,0,1,1.09,3,4.1,4.1,0,0,1-1.45,3.33,6.09,6.09,0,0,1-4,1.21,5.37,5.37,0,0,1-3.76-1.27A4.38,4.38,0,0,1,15,71.26a4.31,4.31,0,0,1,.88-2.8,3.45,3.45,0,0,1,2.41-1.26v1.34a2.39,2.39,0,0,0-1.53.91,3,3,0,0,0-.54,1.87,2.85,2.85,0,0,0,1.07,2.38,4.8,4.8,0,0,0,3,.84,4.65,4.65,0,0,0,3-.88,2.81,2.81,0,0,0,1.11-2.33,2.78,2.78,0,0,0-.77-2A2.89,2.89,0,0,0,21.63,68.46Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M25.37,65.52H15.3V64.15h4.14V58.93H15.3V57.55H25.37v1.38H20.65v5.22h4.72v1.37Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M25.37,56.51L15.3,52.77V51.26l10.07-3.75V49l-3,1.07v4l3,1.07v1.42ZM21.18,53.6V50.46L16.74,52Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M25.37,44.75H16.52v3.18H15.3V40.2h1.22v3.18h8.85v1.37Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/><path d=\"M21,16c-5.52,0-10,3.41-10,7.62a7.07,7.07,0,0,0,3.6,5.86,4.67,4.67,0,0,1-.68,3.4c-0.69,1.24,2.38-.16,4-2a12.87,12.87,0,0,0,3.11.38c5.52,0,10-3.41,10-7.62S26.51,16,21,16Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#aa2064\"/><path d=\"M21,15c-5.52,0-10,3.41-10,7.62a7.07,7.07,0,0,0,3.6,5.86,4.67,4.67,0,0,1-.68,3.4c-0.69,1.24,2.38-.16,4-2a12.87,12.87,0,0,0,3.11.38c5.52,0,10-3.41,10-7.62S26.51,15,21,15Z\" transform=\"translate(-10.98 -15)\" style=\"fill:#fff\"/></svg>\n</span>\n\n</button>",
					b:"<style>\n\n.blank {\n\n	background-color:transparent;\n\n	height: 0;\n\n	width: 0;\n\n	border: 0px !important;\n\n}\n\n</style>\n\n\n\n<button class=\"blank\" aria-label=\"Chat is offline” role=\"button\"></button>",
					ah:"<style>\n\n.blank {\n\n	background-color:transparent;\n\n	height: 0;\n\n	width: 0;\n\n	border: 0px !important;\n\n}\n\n</style>\n\n\n\n<button class=\"blank\" aria-label=\"Chat is offline” role=\"button\"></button>",
					d:"<style>\n\n.blank {\n\n	background-color:transparent;\n\n	height: 0;\n\n	width: 0;\n\n	border: 0px !important;\n\n}\n\n</style>\n\n\n\n<button class=\"blank\" aria-label=\"Chat is offline” role=\"button\"></button>",
                    ralt:null,
                    balt:null,
                    ahalt:null,
                    dalt:null,
					renderAsHTML:true
				}
			}
                    };
                },
				queueMessagingSpecs: {
				6: {
					name:"TouchSMS",
					aom:"Sorry, no agents are available at the moment, please wait.", // agent offline message
					aori:60, // agent offline repeat interval
					qms: [/* queue messaging sets */
						{
							ewt:-1, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"All of our agents are currently busy.  Please wait and an agent will be with you shortly", // message text
									dt:1, // display times
									ris:1 // repeat interval seconds
								}
							]
						},
						{
							ewt:120, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"We will connect you with an agent shortly", // message text
									dt:2, // display times
									ris:60 // repeat interval seconds
								}
							]
						}
					]
				}
			},
                xmlData:{
                    businessSchedules:function(){return {};},
                    dfvs:function(){return {
			
				"Cart": DFV.c("Cart", 
                    
          function (){
            var cartContents = "<br>";

            for (var i in cart) {
              if (cart.hasOwnProperty(i)) {
                if (i == "Item") {
                  for (var j in cart[i]) {
                    if (cart[i].hasOwnProperty(j)) {
                      cartContents += " - " + j + " ($" + cart.Item[j].price + ")<br>";
                    }
                  }
                } else {
                  cartContents += "<b>" + i + ":</b> " + cart[i] + "<br>";
                }
              }
            }
            return {datapass: cartContents};
          }
          
                , "${datapass}", false)
			};}
                },
                displayTYImage:true,
                c2cMgrData:function(){return {adaCompliant:true, adaAndroidC2cSupportDomains:null}},
                businessRuleActionLists:function() {return {}},
                ruleActionLists:function() {return {setAssistedStateActionList: function(rule, evt) {
					if ((!("0".equals(CHM.getChatID(), false))) && (exists(function(){ return PM.getVar("assistChatID",rule).getValue() ;}, false, true)) && (!(CHM.getChatID().equals(PM.getVar("assistChatID",rule).getValue(), false)))) {
	Inq.doRuleActionList("saveAssistedVariablesActionList", rule, evt);
                   
					PM.getVar("assistChatID", rule).setValue(CHM.getChatID());
						PM.getVar("assistDT", rule).setValue(new Date());
					if (exists(function(){ return evt.assistAgtOverride ;}, false, true)) {
	
					PM.getVar("assistAgt", rule).setValue((exists(evt.assistAgtOverride) ? evt.assistAgtOverride.toString() : ""));
					}   else {
	
					PM.getVar("assistAgt", rule).setValue(CHM.getAgentID());
					}
					PM.getVar("asstRuleID", rule).setValue((exists(CHM.getChat().getRuleId()) ? CHM.getChat().getRuleId().toString() : ""));
					PM.getVar("asstRuleName", rule).setValue((exists(CHM.getChat().getRuleName()) ? CHM.getChat().getRuleName().toString() : ""));
					if (!(PM.getVar("saleState",rule).getValue().equals(getConstant("SALE_STATE_CONVERTED", rule), false))) {
	
					PM.getVar("saleState", rule).setValue(getConstant("SALE_STATE_ASSISTED", rule));
					}  
					EVM.fireCustomEvent('Assisted', rule, evt,
						function() {
							return { businessUnitID: CHM.getBusinessUnitID(evt, rule) };
						}
					);
						ROM.send(
							resources["SET_ASSISTED_CONTROLLER"].url,
							{"criteria": prepareDataToSend(PM.getVar("assistedType",rule).getValue()),"chatID": prepareDataToSend(CHM.getChatID())},
                            false,
							false,
                            null,
                            null
                        );

					PM.getVar("assistedType", rule).setValue(getConstant("UNDEFINED_ASSISTED", rule));
					PM.getVar("incState", rule).setValue(getConstant("INC_STATE_ASSISTED", rule));
						ROM.send(
							resources["INC_EVENT_URL"].url,
							{"evt": prepareDataToSend(getConstant("INC_STATE_ASSISTED", rule)),"siteID": prepareDataToSend(getSiteID()),"pageID": prepareDataToSend(LDM.getPageID(0)),"customerID": prepareDataToSend(Inq.getCustID()),"incrementalityID": prepareDataToSend(getIncAssignmentID()),"sessionID": prepareDataToSend(getSessionID()),"brID": prepareDataToSend(CHM.getChat() ? CHM.getChat().getRuleId() : (evt.rule  ? evt.rule.id : rule.getID())),"chatID": prepareDataToSend(CHM.getChatID()),"businessUnitID": prepareDataToSend(CHM.getBusinessUnitID(evt, rule)),"targetAgentAttributes": prepareDataToSend(CHM.getChat().getAgentAttributesAsString()),"brAttributes": prepareDataToSend(CHM.getChat().getRuleAttributesAsString()),"type": prepareDataToSend(CHM.getConversionType())},
                            true,
							true,
                            10,
                            5000
                        );

					EVM.fireCustomEvent('SaleStateTransition', rule, evt,
						function() {
							return {};
						}
					);
					}  
        } ,
        saveAssistedVariablesActionList: function(rule, evt) {
					PM.getVar("oldAssistChatID", rule).setValue(PM.getVar("assistChatID",rule).getValue());
					PM.getVar("oldAssistDT", rule).setValue(PM.getVar("assistDT",rule).getValue());
					PM.getVar("oldAssistAgt", rule).setValue(PM.getVar("assistAgt",rule).getValue());
					PM.getVar("oldAsstRuleID", rule).setValue(PM.getVar("asstRuleID",rule).getValue());
					PM.getVar("oldAsstRuleName", rule).setValue(PM.getVar("asstRuleName",rule).getValue());
					PM.getVar("oldSaleState", rule).setValue(PM.getVar("saleState",rule).getValue());
					PM.getVar("oldIncState", rule).setValue(PM.getVar("incState",rule).getValue());
					PM.getVar("oldSaleID", rule).setValue(PM.getVar("saleID",rule).getValue());
					PM.getVar("oldSoldDT", rule).setValue(PM.getVar("soldDT",rule).getValue());
        } }},
                businessConstants:function() {return {    "C2C_HTML":"\n                \n            <div id=\"inqC2CButton\">\n              <style type=\"text/css\" scope>\n                #inqC2CButton {\n                  position: fixed;\n                  bottom: 0;\n                  width: 100%;\n                  height: 50px;\n                  cursor: pointer;\n                  z-index: 1000000;\n                  background: #2F2C2C;\n                  color: white;\n                  border-top: 8px solid #C5E900;\n                  box-shadow: 0 0 10px rgba(0,0,0,0.5);\n\n                }\n        \n                #inqC2CButton div {\n                  width: 970px;\n                  margin: 0 auto;\n                  font-size: 27px;\n                  text-align: center;\n                  padding: 6px;\n                  font-weight: bold;\n                  font-style: italic;           \n                }\n              </style>\n              <div>Got questions? Click here to chat!</div>\n            </div>\n            \n            ",
    "C2C_HTML_RIGHT_BOTTOM":"\n                \n            <div id=\"inqC2CButton\">\n              <style type=\"text/css\" scope>\n                #inqC2CButton {\n                  position: fixed;\n                  bottom: 0;\n                  right: 0;\n                  width: 220px;\n                  height: 60px;\n                  cursor: pointer;\n                  z-index: 1000000;\n                  background: #2F2C2C;\n                  color: white;\n                  border-top: 8px solid #C5E900;\n                  box-shadow: -5px -5px 10px rgba(0,0,0,0.5);\n                  font-size: 20px;\n                  padding: 10px 20px;\n                  text-align: center;\n                  font-weight: bold;\n                }\n              </style>\n              <span>Got questions?<br/>Click here to chat!</span>\n            </div>\n          \n            ",
    "SF_AUTH_DATA":"grant_type=password&client_id=3MVG9A2kN3Bn17huinyIcjocgllETd3i.k7BExlDZyw95FbuJsxVxtqExxBfosX.dN7ZjI8sGDyJ8vLeHWbyC&client_secret=5950714329960940210&username=jdizon%40touchcommerce.com&password=Touch224TuNWDumeAdEvyX2QTCVC9JV3T"
}},
                businessCustomEvents:function() {return [
		new CustomEvent({
			name: "XframeLoaded",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "passFormInfoToAgent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launchSurvey",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launchPostChatSurveyInCI",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "onShowChatC2C",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "specificAgent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launchC2CPersistent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launch-BB-ING-Guide",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "mouseOver-mouseLeaveDetected",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "mouseOver-mouseEnterDetected",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "mouseOver-launchRule",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "hideRightNowChat",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launchFAQGuide",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "setGuidePath",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "evtWindowScroll",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "newTranscriptMessage",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "displayEmbeddedGuide",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "displayEmbeddedVideo",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "maximizeSkin",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "loadAutomatonPreview",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "CheckAgentAvailabilityWithCallback",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "cobrowse-specific-agent",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "specific_agent_found",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "specific_agent_group_found",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "videoClose",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "mVideoClose",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "visitor-attribute-datapass",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "loadVendor",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "loadFallbackVendor",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launchLiveChat",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "launchVirtualChat",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "ShrinkRightFrame",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "ShrinkBottomFrame",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "VideoPlayerLoad",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "VideoPlayerClose",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "VideoPlayerChange",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "LoadVideo1",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "LoadVideo2",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		}),
		
		new CustomEvent({
			name: "timerStart",
			getEvtData: function(rule, evt) {
				return MixIns.mixAbsorber({}).absorb(evt);
			}
		})]},
                resources:function(){return {		"RESOLVE_IP_CONTROLLER": new WebResource("RESOLVE_IP_CONTROLLER", normalizeProtocol(urls.vanityURL + "/tagserver/address/resolveIpToHostName"), "rw", "GET"), 
		"SET_SALE_CONTROLLER": new WebResource("SET_SALE_CONTROLLER", normalizeProtocol(urls.vanityURL + "/tagserver/sale/setSale"), "rw", "GET"), 
		"SALE_LANDING_CONTROLLER": new WebResource("SALE_LANDING_CONTROLLER", normalizeProtocol(urls.vanityURL + "/tagserver/sale/saleLanding"), "rw", "GET"), 
		"INC_EVENT_URL": new WebResource("INC_EVENT_URL", normalizeProtocol(urls.vanityURL + "/tagserver/incrementality/onEvent"), "w", "GET"), 
		"JASPER_ETL": new WebResource("JASPER_ETL", normalizeProtocol(urls.logDataURL), "w", "GET"), 
		"SET_ASSISTED_CONTROLLER": new WebResource("SET_ASSISTED_CONTROLLER", normalizeProtocol(urls.vanityURL + "/tagserver/assisted/setAssisted.gif"), "rw", "GET"), 
		"IS_AGENT_IN_CHAT": new WebResource("IS_AGENT_IN_CHAT", normalizeProtocol(urls.vanityURL + "/tagserver/tracking/isAgentInChat.jsp"), "rw", "GET"), 
				"rVar": new JSResource("rVar",  "rw"), 
				"tmpVars": new JSResource("tmpVars",  "rw")
}},
                coBrowseConfigs:function(){
                    return {
                        cobrowseMaskingConfig: ([   
       {pageMarker: "BB-Payment", text: true,selector: "input[id|='ccNumber']",regex: new RegExp(".", "gi"),mask: "*"},
            {pageMarker: "BB-Payment", text: true,selector: "input[id|='ccSecurityCode']",regex: new RegExp(".", "gi"),mask: "*"},
            {pageMarker: "BB-Payment", text: true,selector: "input[id|='ccExpDate']",regex: new RegExp(".", "gi"),mask: "*"}
]),
                        isEmbeddedResource: function(url, markerID){
var isMarkerMatch = true;

if(!url.match(".+mediav3.inq.com.+")){
if(isMarkerMatch && (url.match(".+\.jpg") ||url.match(".+\.gif") ||url.match(".+\.png") ||url.match(".+\.css") )){
            return true;
        }}

    return false;
},
                        bannerText:'<div id=\"tcCob\" class=\"cob-banner cob-banner-bottom\" style=\"background-color: #ffbaba;\">\n\t<div id=\"agentNotConnected\" class=\"cob-agent-message\" style=\"display:none;\">You\'re no longer connected.</div>\n\t<div id=\"agentAssisted\" class=\"cob-agent-message\" style=\"top: 1px; color: #ff0000;\">You\'re being assisted.</div>\n\t<div class=\"cob-ui-buttons\" style=\"top: 5px; left: 8px;\">\n\t\t<a class=\"cob-button\" id=\"stop\" title=\"End Cobrowse\" onclick=\"(inqFrame.Inq.CBC).stop(); return false; \" href=\"\"><span class=\"cob-icon cob-stop-icon\"></span>End CoBrowse</a> | <a class=\"cob-button\" id=\"stop\" title=\"End Cobrowse & Chat\" onclick=\"(inqFrame.Inq.CBC).stop(); inqFrame.Inq.FlashPeer.ciActionBtnCloseChat(); return false; \" href=\"\">End Chat + Cobrowse</a>\n\t\t\n\t\t<a class=\"cob-button\" id=\"terms-conditions\" title=\"Terms and Conditions\" href=\"#\" onclick=\"window.open(\'//demo.touchcommerce.com/files/cobrowse/terms_and_conditions.html\',\'terms_conditions\',\'toolbar=no,location=no,menubar=no,status=no,scrollbars=no,resizable=1,height=300,width=500\');return false;\">\n\t\t\t<span class=\"cob-icon cob-terms-conditions-icon\"></span>Terms and Conditions\n\t\t</a>\n\t</div>\n</div>\n\n<div id=\"coTacClose\" class=\"cob-tac-Close\" onclick=\"(inqFrame.Inq.CBC).termsAndConditions(false); return false;\"></div>\n\n<style type=\"text/css\">\n\t<!--\n\t@import url(/files/cobrowse/banner.css);\n\t-->\n</style>'
                    }
                },
                vamAttributes:{programVisitorAttributes: {"vis_attr_incr_val":{"values":{},"mutuallyExclusive":true}
},businessVisitorAttributes: {"browserType":{"values":{"":true},"mutuallyExclusive":false}
, "vendorRoutingAttribute":{"values":{"":true},"mutuallyExclusive":false}
, "guidePath":{"values":{"":true},"mutuallyExclusive":true}
, "IsRepeatChatterVA":{"values":{"":true},"mutuallyExclusive":false}
} },
                businessVars:function() {return [
		{name:"checkoutErrorCount", defVal:0, rId:"session", shName:"erCnt", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"lastPageInteraction", defVal:new Date(), rId:"tmpVars", shName:"dLPI", type:"Date"},
		{name:"ACIF_PRE_CACHED", defVal:false, rId:"session", shName:"apch", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"Unique_Session_Visits_Counter", defVal:true, rId:"session", shName:"usvc", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"Exposure_Qualified_Session_Counter", defVal:true, rId:"session", shName:"eqsc", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"scriptTreeID", defVal:10200147, rId:"state", shName:"stid", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"chatThemeID_Original", defVal:15000384, rId:"state", shName:"ctido", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"isSurveyReqMet", defVal:false, rId:"session", shName:"srvyr", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"hasSurveyLaunched", defVal:false, rId:"session", shName:"srvyl", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"resumeChat", defVal:false, rId:"session", shName:"rsmc", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"automatonDataMap", defVal:[], rId:"session", shName:"dMap", type:"Map"},
		{name:"launchEnabled", defVal:false, rId:"session", shName:"LE", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"hashChatThemeID", defVal:null, rId:"tmpVars", shName:"hctid", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"hashChatSpecID", defVal:null, rId:"tmpVars", shName:"hcsid", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"CLEAR_C2C_SPEC", defVal:30000688, rId:"tmpVars", shName:"CLC2C", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"tooltipDisplayed", defVal:"NO", rId:"session", shName:"ttip", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"c2cAnimated", defVal:false, rId:"tmpVars", shName:"cAnim", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"bofa_c2c_theme", defVal:33000700, rId:"tmpVars", shName:"bofac", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"businessUnitID", defVal:null, rId:"session", shName:"buID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"agentGroupID", defVal:null, rId:"session", shName:"agID", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"target_agent_name", defVal:null, rId:"tmpVars", shName:"tagn", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"target_agent_group", defVal:null, rId:"tmpVars", shName:"tagp", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"IsRepeatChatter", defVal:false, rId:"state", shName:"RC", fnCast:function(o){ return Boolean(o);}, fnSer:function(b){ return !!b?1:0;}, type:"generic"},
		{name:"vendorRandInt", defVal:rand(1, 100, true) , rId:"state", shName:"vRint", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"vendorRoutingAttr", defVal:null, rId:"tmpVars", shName:"vAttr", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"},
		{name:"fallbackVendorAG", defVal:10004026, rId:"state", shName:"fbAG", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"chatSpecID-Default", defVal:29001414, rId:"state", shName:"csidd", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"chatThemeID-Default", defVal:24001749, rId:"state", shName:"ctidd", fnCast:function(o){ return parseFloat(o);}, type:"generic"},
		{name:"scriptTreeID-Default", defVal:12200580, rId:"state", shName:"stidd", fnCast:function(o){ return parseFloat(o);}, type:"generic"}];},
                timezoneID:'America/Los_Angeles',
                frameworkCanRun: function( deviceType, _3pcSupported, _1pcSupported, xdActive ){
                    
                    if ( _1pcSupported===false || (xdActive && !_3pcSupported) ) {
                        return false;
                    }
                    return true;
                },
                c2cPageElementIDs: function(){
                    return {
                        "19000531":"inqC2CImgContainer"
                        , 
                        "23000547":"inqC2C2ImgContainer"
                        , 
                        "24000548":"inqC2C4ImgContainer"
                        , 
                        "30000628":"contentImgContainer"
                        , 
                        "30000643":"touchcommerceChat"
                        , 
                        "30000661":"inq-SP-C2C-injected-left"
                        , 
                        "30000688":"inq-SP-C2C-Clear"
                        , 
                        "30000853":"inqC2CImgContainer"
                        , 
                        "30000854":"inqC2CImgContainer"
                        , 
                        "30000855":"inqC2CImgContainer"
                        , 
                        "30000857":"inqC2CImgContainer"
                        
                        
                    };
                },
                getDefaultBusinessUnitID: function (){
                    return 13000508;
                },
                v3framesrc: window.location.pathname,
                multiHost: true
            };
        }, function(programRulesData) {
            return 	{
                rules:programRulesData
                        .append(
                        [
			Rule.create({
				id: -Math.abs(-640992381),
				name:"PC_BBank-search",
				vars:[{name:"PC_BBank-search",defVal:null,rId:"session",shName:"_0000",fnCast:function(o){ return parseFloat(o);}, type:"generic"}],
				triggersFcn:function(rule) {return [{id:"onPageLanding"}]},
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BBank-search", true) : false));
				},
				actionFcn: function(rule, evt){
					PM.getVar("PC_BBank-search",rule).setValue(PM.getVar("PC_BBank-search",rule).getValue()+1);
				},
                active:true
			}), 
			Rule.create({
				id: -Math.abs(1627888716),
				name:"PC_BB-DirecTV-Modal",
				vars:[{name:"PC_BB-DirecTV-Modal",defVal:null,rId:"session",shName:"_0002",fnCast:function(o){ return parseFloat(o);}, type:"generic"}],
				triggersFcn:function(rule) {return [{id:"onPageLanding"}]},
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-DirecTV-Modal", true) : false));
				},
				actionFcn: function(rule, evt){
					PM.getVar("PC_BB-DirecTV-Modal",rule).setValue(PM.getVar("PC_BB-DirecTV-Modal",rule).getValue()+1);
				},
                active:true
			})
]
                ).append(
                        [
			BusinessRule.create({
				id: 20010,
				
				name:"TestRule",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Standard")) && (getConstant("fl", rule) < PM.getVar("cfl",rule).getValue()) && (PM.getVar("PC_BB-DirecTV-Modal", BRM.getRuleById(-Math.abs(1627888716))).getValue() >= 1.0));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871}
}).request();
				},
                active: false
			}), 
			Rule.create({
				id:14400,
				
				name:"BB-Virtual-Agent-Guide-SuppressC2C",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"launchLiveChat"}, {id:"on"+"launchVirtualChat"} ]},
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*#[T|t]ouch[A|a]ssist-guide") != null ? true : false) || (win.document.URL.match(".*support.html") != null ? true : false));
				},
				actionFcn: function(rule, evt){
					
					log("C2C Blocked");

					Inq.blockServices(["C2C"], 1000);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10465,
				
				name:"BB-Virtual-Agent-Guide-Contact-US",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*support.html") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000983}
, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001812}
}
,	igaa:true,peId:"inqC2CSupportImgContainer"
}; } , false);
				},
                active: true
			}), 
			Rule.create({
				id:2018,
				
				name:"Load Weinre Debugger",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#.*tcLoadWeinre") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					FM.callExternal(function(customerIpAddress, optionalIP) {var ip = optionalIP || customerIpAddress,script = 'http://' + ip + ':8080/target/target-script-min.js#anonymous';document.body.appendChild(document.createElement('script')).src = script;}, Inq.getCustIP(), (exists(FM.callExternal(FM.getFcn("getUrlParameterByName"), "tcLoadWeinre")) ? FM.callExternal(FM.getFcn("getUrlParameterByName"), "tcLoadWeinre").toString() : ""));
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2129,
				
				name:"test",
                ruleType:"POPUP",
				funnelLevel:5,
				businessUnitID:13000508,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				businessUnitId: 13000508,
				getRAtts: function (){return [{name: 'Device', value: encodeURIComponent("Desktop")}]},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Standard")) && (getConstant("fl", rule) < PM.getVar("cfl",rule).getValue()));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, chatTheme:{id:19000394}
}
}).request();
				},
                active: false
			}), 
			BusinessRule.create({
				id: 20005,
				
				name:"RR_test_copy1",
                ruleType:"POPUP",
				funnelLevel:5,
				businessUnitID:13000508,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:1000} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				agID:10004027,
				businessUnitId: 13000508,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Standard")) && (getConstant("fl", rule) < PM.getVar("cfl",rule).getValue()));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871}
}).request();
				},
                active: false
			}), 
			BusinessRule.create({
				id: 10234,
				
				name:"BBank-VideoChat",
                ruleType:"C2VIDEO",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)bbank-investments(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2VIDEO, function(rule){ return {id:30000857
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10233,
				
				name:"BBank-search",
                ruleType:"POPUP",
				funnelLevel:5,
				businessUnitID:13000508,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				agID:10004026,
				businessUnitId: 13000508,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (((LDM.getPageMarker() ? LDM.getPageMarker().equals("BBank-search", true) : false)) && (PM.getVar("PC_BBank-search", BRM.getRuleById(-Math.abs(-640992381))).getValue() >= 3.0));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:29001267}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10228,
				
				name:"BBank-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				businessUnitID:13000508,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				agID:10004026,
				businessUnitId: 13000508,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((!(win.document.URL.match("(.*)\/bestbank\/bbank-contact_us(.*)") != null ? true : false)) && (!(win.document.URL.match("(.*)\/bestbank\/bbank-investments(.*)") != null ? true : false)) && (win.document.URL.match("(.*)\/bestbank\/(.*)") != null ? true : false) && ((isDeviceType("Standard")) || (isDeviceType("Tablet"))));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000853,	igaa:false
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10229,
				
				name:"BBank-mobile-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				businessUnitID:13000508,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				agID:10004026,
				businessUnitId: 13000508,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match("(.*)\/bestbank\/bbank-mobile(.*)") != null ? true : false) && (isDeviceType("Phone")));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000854,	igaa:false
}; } , false);
				},
                active: true
			}), 
			Rule.create({
				id:1002,
				
				name:"BestBrands-Survey-Launch",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onBeforeChatClosed", serviceType:"ALL"} ]},
				conditionalFcn: function(rule,evt){
					return (!((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-TMobile-ContactUs-Phone", true) : false)));
				},
				actionFcn: function(rule, evt){
					
					log("Launching KeySurvey");
SVYM.showSurvey(11000055, rule, null,{"agentID":CHM.getAgentID()},null,"https://app.keysurvey.com/f/334239/9432/?LQID=1&", true);
				},
                active: true
			}), 
			Rule.create({
				id:1006,
				
				name:"loadAddOns",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					FM.callExternal(FM.getFcn("loadAddOns"), "https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/createScriptCommandsAPI.js", "https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/displayC2CTooltip.js", "https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/createHTMLButton.js", "https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/createScrollEventListener.js", "https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/br3-addons/insertStyles.js",
						"https://bestbrands.inq.com/tagserver/kms/css/googleapis-fonts.css",
"https://ajax.googleapis.com/ajax/libs/angularjs/1.2.7/angular.js",
"https://bestbrands.inq.com/tagserver/kms/css/jquery-ui.min.css",
"https://bestbrands.inq.com/tagserver/kms/js/adapter.js",
"https://bestbrands.inq.com/tagserver/kms/js/kurento-utils.js",
"https://bestbrands.inq.com/tagserver/kms/js/kurento-jsonrpc.js",
"https://bestbrands.inq.com/tagserver/kms/js/EventEmitter.js",
"https://bestbrands.inq.com/tagserver/kms/js/KurentoRoom.js",
"https://bestbrands.inq.com/tagserver/kms/angular/services/Participants.js",
"https://bestbrands.inq.com/tagserver/kms/js/jquery-2.1.1.min.js",
"https://bestbrands.inq.com/tagserver/kms/js/jquery-ui.min.js",
"https://bestbrands.inq.com/tagserver/kms/angular/angular-fullscreen.js",
"https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/velocity.js",
"https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/moment-with-locales.min.js",
"https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/js/lumx.js"
					)
				},
                active: true
			}), 
			Rule.create({
				id:407,
				
				name:"iOS-7-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onManualInvocation"} ]},
				conditionalFcn: function(rule,evt){
					return (false);
				},
				actionFcn: function(rule, evt){
					
					log("This rule should never fire.");

				},
                active: true
			}), 
			Rule.create({
				id:408,
				
				name:"iOS-8-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onManualInvocation"} ]},
				conditionalFcn: function(rule,evt){
					return (false);
				},
				actionFcn: function(rule, evt){
					
					log("This rule should never fire.");

				},
                active: true
			}), 
			Rule.create({
				id:409,
				
				name:"iOS-9-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onManualInvocation"} ]},
				conditionalFcn: function(rule,evt){
					return (false);
				},
				actionFcn: function(rule, evt){
					
					log("This rule should never fire.");

				},
                active: true
			}), 
			Rule.create({
				id:404,
				
				name:"ChromeOnIphoneSuppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onManualInvocation"} ]},
				conditionalFcn: function(rule,evt){
					return ((new Boolean(FM.callExternal(function(){var uaString = navigator.userAgent.toLowerCase();return (/crios/i.test(uaString) && /iphone/i.test(uaString));}))).valueOf());
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], 0);
				},
                active: true
			}), 
			Rule.create({
				id:400,
				
				name:"MobileSuppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((!(isServiceBlocked("ANY"))) && (isDeviceType("Unsupported")));
				},
				actionFcn: function(rule, evt){
					
					Inq.blockServices(["ALL"], -1);
					log("Chat is suppressed because this device is not supported.");

				},
                active: true
			}), 
			Rule.create({
				id:411,
				
				name:"Windows-Phone-Suppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onManualInvocation"} ]},
				conditionalFcn: function(rule,evt){
					return (false);
				},
				actionFcn: function(rule, evt){
					
					log("This rule should never fire.");

				},
                active: true
			}), 
			Rule.create({
				id:1003,
				
				name:"Global-onAgentAssigned",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("businessUnitID", rule).setValue((exists(CHM.getChat().getChatBusinessUnitID()) ? CHM.getChat().getChatBusinessUnitID().toString() : ""));
					PM.getVar("agentGroupID", rule).setValue((exists(CHM.getChat().getChatAgentGroupID()) ? CHM.getChat().getChatAgentGroupID().toString() : ""));
				},
                active: true
			}), 
			Rule.create({
				id:1004,
				
				name:"BB-Specific-Agent-Name-Finder",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"cobrowse-specific-agent"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("target_agent_name", rule).setValue((exists(FM.callExternal(
                                    
              function() {
                if(document.getElementById('txtAgentID') !== null) {
                  return document.getElementById('txtAgentID').value.trim();
                } else { 
                  return '';
                }
              }
              
                                )) ? FM.callExternal(
                                    
              function() {
                if(document.getElementById('txtAgentID') !== null) {
                  return document.getElementById('txtAgentID').value.trim();
                } else { 
                  return '';
                }
              }
              
                                ).toString() : ""));
					EVM.fireCustomEvent('specific_agent_found', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:1007,
				
				name:"BB-Specific-Agent-Group-URL-Finder",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match("(.*)agentGroup\=(.*)") != null ? true : false) && (!(win.document.URL.match("(.*)agentID\=(.*)") != null ? true : false)));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("target_agent_group", rule).setValue(parseFloat(FM.callExternal(
                                    
                      function() {
                        var queries = {};
                        var querystring = window.location.search.substr(1);
                        querystring = querystring.split("&");
            
                        for (var i=0;i<querystring.length; i++) {
                          var temparray = querystring[i].split("=");
                          queries[temparray[0]] = temparray[1];
                        }
          
                        if (queries.agentGroup !== undefined) {
                          return queries.agentGroup;
                        }
                      }
                    
                                )));
					EVM.fireCustomEvent('specific_agent_group_found', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:1008,
				
				name:"BB-Specific-Agent-URL-Name-Finder",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)agentID\=(.*)") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("target_agent_name", rule).setValue((exists(FM.callExternal(
                                    
                      function() {
                        var queries = {};
                        var querystring = window.location.search.substr(1);
                        querystring = querystring.split("&");
            
                        for (var i=0;i<querystring.length; i++) {
                          var temparray = querystring[i].split("=");
                          queries[temparray[0]] = temparray[1];
                        }
          
                        if (queries.agentID !== undefined) {
                          return queries.agentID;
                        }
                      }
                    
                                )) ? FM.callExternal(
                                    
                      function() {
                        var queries = {};
                        var querystring = window.location.search.substr(1);
                        querystring = querystring.split("&");
            
                        for (var i=0;i<querystring.length; i++) {
                          var temparray = querystring[i].split("=");
                          queries[temparray[0]] = temparray[1];
                        }
          
                        if (queries.agentID !== undefined) {
                          return queries.agentID;
                        }
                      }
                    
                                ).toString() : ""));
					EVM.fireCustomEvent('specific_agent_found', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:1025,
				
				name:"reIssueChatOn",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatLaunched", serviceType:"C2C"}, {id:"onChatLaunched", serviceType:"POPUP"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*dockedC2C.html.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("resumeChat", rule).setValue(true);
				},
                active: true
			}), 
			Rule.create({
				id:1026,
				
				name:"reIssueChatOff",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onCustomerMsg"} ]},
				conditionalFcn: function(rule,evt){
					return (PM.getVar("resumeChat",rule).getValue());
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("resumeChat", rule).setValue(false);
				},
                active: true
			}), 
			Rule.create({
				id:1027,
				
				name:"controlResumeC2CVisibility",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onC2CDisplayed"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if (PM.getVar("resumeChat",rule).getValue()) {
	processReceivedExternalDataThrows("\n                                    \n                    var resumeC2CSpec = top.document.getElementById(\"tcChat_resumeContainer\");\n                    if (resumeC2CSpec != null){ resumeC2CSpec.style.display = \"block\"; }\n                  \n                                ")
					}   else {
	processReceivedExternalDataThrows("\n                                \n                  var resumeC2CSpec = top.document.getElementById(\"tcChat_resumeContainer\");\n                  if (resumeC2CSpec != null){ resumeC2CSpec.style.display = \"none\"; }\n                \n                            ")
					}
				},
                active: true
			}), 
			Rule.create({
				id:2000,
				
				name:"BB-SP-Inject-Left-Anchored-Div",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#left-anchored-c2c") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                               \n               var div = top.document.createElement(\"DIV\");\n               div.innerHTML = '<div id=\"inq-SP-C2C-injected-left\" style=\"position: fixed; top: 40%;\"></div>';\n               top.document.body.appendChild(div.firstChild);\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:2001,
				
				name:"Set Guide Path Visitor Attributes",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"setGuidePath"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					VAM.add({"guidePath":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set((exists(evt.guidePath) ? evt.guidePath.toString() : ""), true))},"mutuallyExclusive":false}, -1);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1028,
				
				name:"BB-C2C-showResumeChatC2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"onShowChatC2C"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (PM.getVar("resumeChat",rule).getValue());
				},
				actionFcn: function(rule,evt){
					processReceivedExternalDataThrows("\n                        \n              if (null == top.document.getElementById(\"tcChat_resumeContainer\")){\n                try {\n                  var div = top.document.createElement(\"DIV\");\n                  div.innerHTML = '<div id=\"tcChat_resumeContainer\" style=\"position: fixed; bottom: 0\"></div>' ;\n                  top.document.body.appendChild(div.firstChild);\n                } catch (e) {}\n              }\n              \n                    ")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:31000468}
, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,	igaa:true,peId:"tcChat_resumeContainer"
}; } , false);
				},
                active: true
			}), 
			Rule.create({
				id:1029,
				
				name:"showResumeC2CAfterClose",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatClosed", serviceType:"C2C"}, {id:"onChatClosed", serviceType:"POPUP"} ]},
				conditionalFcn: function(rule,evt){
					return (PM.getVar("resumeChat",rule).getValue());
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('onShowChatC2C', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:1030,
				
				name:"showResumeC2COnPageLanding",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:1000} ]},
				conditionalFcn: function(rule,evt){
					return (PM.getVar("resumeChat",rule).getValue());
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('onShowChatC2C', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			Rule.create({
				id:1000,
				
				name:"Assigner - Script Group - Chat Theme",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Tablet")) || (isDeviceType("Phone")));
				},
				actionFcn: function(rule, evt){
					
					if (isDeviceType("Tablet")) {
	
					PM.getVar("scriptTreeID", rule).setValue(12200150);
					PM.getVar("chatThemeID_Original", rule).setValue(24000409);
					}  else  if (win.document.URL.match(".*/m/phonesV3.html.*") != null ? true : false) {
	
					PM.getVar("chatThemeID_Original", rule).setValue(24000860);
					}  else   if (win.document.URL.match(".*/m/phonesTC.html.*") != null ? true : false) {
	
					PM.getVar("chatThemeID_Original", rule).setValue(24000862);
					}  else   if (win.document.URL.match(".*/m/phonesTC2.html.*") != null ? true : false) {
	
					PM.getVar("chatThemeID_Original", rule).setValue(24000863);
					}     else {
	
					PM.getVar("chatThemeID_Original", rule).setValue(24000861);
					}
				},
                active: true
			}), 
			Rule.create({
				id:1001,
				
				name:"BestBrands-Survey-Requirements",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentMsg"}, {id:"onCustomerMsg"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return evt.agtMsgCnt ;}, false, true)) && (exists(function(){ return evt.custMsgCnt ;}, false, true)) && (parseFloat(evt.agtMsgCnt) >= 1) && (parseFloat(evt.custMsgCnt) >= 1) && (!(PM.getVar("isSurveyReqMet",rule).getValue())) && ((!((exists(CHM.getChat().getRuleName()) ? CHM.getChat().getRuleName().toString() : "").contains("BB-FinancialDashboard-C2C", false))) || (!((exists(CHM.getChat().getRuleName()) ? CHM.getChat().getRuleName().toString() : "").contains("BB-PostChatSurveyInCI", false)))));
				},
				actionFcn: function(rule, evt){
					
					log("Survey requirements met. (1:1)");

					PM.getVar("isSurveyReqMet", rule).setValue(true);
				},
                active: true
			}), 
			Rule.create({
				id:1005,
				
				name:"BB-inqC2CImgContainer-Positioner",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return safe("document.getElementById('inqC2CImgContainer')") ;}, false, true)) && (!(win.document.URL.match(".*financialDashboard.html.*") != null ? true : false)) && (!(win.document.URL.match(".*index_br\.html.*") != null ? true : false)));
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n              var divContainer1 = document.getElementById(\"inqC2CImgContainer\");\n  \n              if (divContainer1 !== \"undefined\"){\n                divContainer1.style.position = \"fixed\";\n                divContainer1.style.top = \"40%\";\n                divContainer1.style.right = \"-2px\";\n\n                divContainer1.onmouseover = function(){\n                  this.style.right = \"0px\";\n                };\n\n                divContainer1.onmouseout = function(){\n                  this.style.right = \"-2px\";\n                };\n              }\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:1009,
				
				name:"BB-Embedded-C2Call-Overlay",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onC2CDisplayed"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(function(){ return safe("document.getElementById('inqC2C2ImgContainer')") ;}, false, true)) && (!(win.document.URL.match("support.html") != null ? true : false)));
				},
				actionFcn: function(rule, evt){
					
					if (win.document.URL.match(".*noMM.html.*") != null ? true : false) {
	processReceivedExternalDataThrows("Inq.showClickToCallHtml(0,\"/x/embeddedC2Call-NoMM.html\");")
					}  else  if (win.document.URL.match(".*?c2call=intl.*") != null ? true : false) {
	processReceivedExternalDataThrows("Inq.showClickToCallHtml(0,\"/x/embeddedC2Call-intl.html\");")
					}  else   if (!(win.document.URL.match(".*funds.html.*") != null ? true : false)) {
	processReceivedExternalDataThrows("Inq.showClickToCallHtml(0,\"/x/embeddedC2Call-MM.html\");")
					}     else {
	processReceivedExternalDataThrows("Inq.showClickToCallHtml(0,\"/x/INGcall.html\");")
					}
				},
                active: true
			}), 
			Rule.create({
				id:1022,
				
				name:"Form Datapass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"passFormInfoToAgent"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Form Info": prepareDataToSend((exists(evt.formData) ? evt.formData.toString() : "")),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:1023,
				
				name:"Search Terms Datapass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-O-SearchResults", true) : false)) && (!(safe("searchTerms").equals("", false))));
				},
				actionFcn: function(rule, evt){
					
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Search Term": prepareDataToSend(safe("searchTerms")),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:1024,
				
				name:"Cart Datapass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"}, {id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return ((CHM.isServiceInProgress("ANY")) && ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-I-Cart", true) : false)));
				},
				actionFcn: function(rule, evt){
					
            ROM.sendDataToAgent(
                CHM.getAgentID(),
            {
            "Cart": window.parent.Inq.datapass ? window.parent.Inq.datapass : getDFV("Cart").toString(),
            agentID:CHM.getAgentID(),
            engagementID:CHM.getChatID(),
            passDFVId:false
            }
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:1031,
				
				name:"BB-AACheck",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*aaCheck.html.*") != null ? true : false) || (win.document.URL.match(".*unitymedia.*") != null ? true : false));
				},
				actionFcn: function(rule, evt){
					
						CallRemote.create({
							doCallbackActions: function(data){
								
					if ((win.document.URL.match(".*aaCheck.html.*") != null ? true : false) && ((exists(data.availability) ? data.availability.toString() : "").equals("true", false))) {
	processReceivedExternalDataThrows("agentsAvailable = true;document.getElementById(\"agentAvailability\").innerHTML = \"agentsAvailable = true\";")
					}  else  if ((win.document.URL.match(".*aaCheck.html.*") != null ? true : false) && (!((exists(data.availability) ? data.availability.toString() : "").equals("true", false)))) {
	processReceivedExternalDataThrows("agentsAvailable = false;document.getElementById(\"agentAvailability\").innerHTML = \"agentsAvailable = false\";")
					}  else   if ((win.document.URL.match(".*unitymedia.*") != null ? true : false) && ((exists(data.availability) ? data.availability.toString() : "").equals("true", false))) {
	processReceivedExternalDataThrows("$('#touchcommerceRN').css('display', 'none');")
					}    
							}
						}).callRemote(
							urls.agentsAvailabilityCheckURL,
							{"siteID": prepareDataToSend(getSiteID()),"buID": prepareDataToSend(13000508)}
						);
				},
                active: true
			}), 
			Rule.create({
				id:1037,
				
				name:"CRM AICI - Populate automatonDataMap",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatLaunched", serviceType:"ALL"} ]},
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*salesforce.html.*") != null ? true : false) || (win.document.URL.match(".*crmAICI.html.*") != null ? true : false));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("automatonDataMap", rule).setValue((exists(FM.callExternal(FM.getFcn("getInqCustData"), CHM.getChatID())) ? FM.callExternal(FM.getFcn("getInqCustData"), CHM.getChatID()).toString() : ""));
					log("*** automatonDataMap:"+(exists(PM.getVar("automatonDataMap",rule).getValue()) ? PM.getVar("automatonDataMap",rule).getValue().toString() : ""));

				},
                active: true
			}), 
			Rule.create({
				id:1051,
				
				name:"PreemptiveExit-JS",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*preemptiveChat.html.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n              try {\n                // Created for CMR-5837\n                //Detect Mouse Activity\n                //Works with IE8, IE9+, Firefox and Chrome\n             \n                var w = window,\n                  d = document,\n                  e = d.documentElement,\n                  g = d.getElementsByTagName('body')[0],\n                  y = w.innerHeight || e.clientHeight || g.clientHeight;\n             \n                g.onmouseleave = function(e){\n                e = e || window.event;\n                var pageY = e.pageY;\n                if (pageY === undefined)\n                  pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;\n               \n                if(pageY<=0)\n                  Inq.fireCustomEvent('mouseOver-mouseLeaveDetected');\n                }\n               \n                g.onmouseenter = function(){\n                  Inq.fireCustomEvent('mouseOver-mouseEnterDetected');\n                }\n              } catch (e) {}\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:1052,
				
				name:"mouseLeaveDetected",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"mouseOver-mouseLeaveDetected"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("launchEnabled", rule).setValue(true);
					EVM.fireCustomEvent('mouseOver-launchRule', rule, evt,
						function() {
							return {};
						}
					);
					log("mouseActivity: Mouse Leave Detected. Launching in three seconds.");

				},
                active: true
			}), 
			Rule.create({
				id:1053,
				
				name:"mouseEnterDetected",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"mouseOver-mouseEnterDetected"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("launchEnabled", rule).setValue(false);
					log("mouseActivity: Mouse Enter Detected. Rule launch disabled.");

				},
                active: true
			}), 
			BusinessRule.create({
				id: 1010,
				
				name:"BB-Embedded-C2Call",
                ruleType:"C2CALL",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((!(LDM.checkCG("BBank-content"))) && (!(win.document.URL.match(".*support.html") != null ? true : false)) && ((exists(function(){ return safe("document.getElementById('inqC2C2ImgContainer')") ;}, false, true)) || (exists(function(){ return safe("document.getElementById('tcINGEmbeddedCall')") ;}, false, true))));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2CALL, function(rule){ return {id:23000547, chatSpec:{id:23000879,stId:PM.getVar("scriptTreeID",rule).getValue()}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1015,
				
				name:"BB-C2Call",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*c2call.html.*") != null ? true : false) && (exists(function(){ return safe("document.getElementById('inqC2C4ImgContainer')") ;}, false, true)));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:24000548, chatSpec:{id:23000878, oId:-1,stId:PM.getVar("scriptTreeID",rule).getValue()}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1016,
				
				name:"BB-O-P-ProactiveCall",
                ruleType:"POPUP_CALL",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*proactiveCall.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP_CALL , chatSpec:{id:23000878, oId:-1,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1018,
				
				name:"BB-O-R-Marketing-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				priority: 5,
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'tooltipDisplayed', value: encodeURIComponent(PM.getVar("tooltipDisplayed",rule).getValue())}]},
				
				conditionalFcn: function(rule,evt){
					return (((win.document.URL.match(".*demo.*\/m\/.*") != null ? true : false) || (win.document.URL.match(".*demo.*\/lorem.*") != null ? true : false) || (win.document.URL.match(".*viewport\.html.*") != null ? true : false) || ((LDM.getPageMarker() ? LDM.getPageMarker().startsWith("BB", true) : false)) || (win.document.URL.match(".*crmAICI.html.*") != null ? true : false) || (win.document.URL.match(".*choose_tablets\.html.*") != null ? true : false) || (win.document.URL.match(".*tabletdetail_venue11_help.*") != null ? true : false)) && ((!(win.document.URL.match("(.*)\/bestbank\/(.*)") != null ? true : false)) && (!(win.document.URL.match(".*c2persistent.html.*") != null ? true : false)) && (!(win.document.URL.match(".*numericable-mobile.*") != null ? true : false)) && (!(win.document.URL.match(".*#c2cWithAACheckInterval") != null ? true : false)) && (!(win.document.URL.match(".*#plan-guide") != null ? true : false)) && (!(win.document.URL.match("(.*)touchcommerce\.com\/cart\.html(.*)") != null ? true : false)) && (!(win.document.URL.match(".*bofa.*") != null ? true : false)) && (!(win.document.URL.match(".*specific-agent.*") != null ? true : false)) && (!(win.document.URL.match(".*prechat\.html.*") != null ? true : false)) && (!(win.document.URL.match("(.*)\/m\/\#marketing-gs5-offer") != null ? true : false)) && (!(win.document.URL.match(".*#BBV2.*") != null ? true : false)) && (!(win.document.URL.match("(.*)win[1-5]") != null ? true : false))));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871, aspecData:{ "tGuardToken":(exists(CM._getCookie('TATS-SS-TokenID')) ? CM._getCookie('TATS-SS-TokenID').toString() : "")},stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,	igaa:true
}; } , false);
					VAM.add({"browserType":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set(getClientBrowserType(), true))},"mutuallyExclusive":false}, -1);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1019,
				
				name:"BB-TMobile-Smartphone",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-TMobile-ContactUs-Phone", true) : false)));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33001025}
, chatSpec:{id:18000871, oId:17252564,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001900}
}
,	igaa:true,peId:"tc-chat-container-anchored"
}; } , false);
					VAM.add({"browserType":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set(getClientBrowserType(), true))},"mutuallyExclusive":false}, -1);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1020,
				
				name:"BB-O-P-ProactiveChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				priority: 5,
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (((win.document.URL.match(".*proactiveChat.html.*") != null ? true : false) || ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-Untagged", true) : false))) && (!(win.document.URL.match(".*#BBV2.*") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1035,
				
				name:"BB-O-P-iPhone-PV2",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-O-Phone-iPhone4S", true) : false)) && (PM.getVar("PC_BB-O-Phone-iPhone4S", BRM.getRuleById(-Math.abs(-1429751710))).getValue() >= 2.0));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1040,
				
				name:"BB-O-Embedded-Guide",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"}, {id:"on"+"displayEmbeddedGuide"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'product', value: encodeURIComponent("guide")}, {name: 'solution_type', value: encodeURIComponent("product recommendation")}, {name: 'automaton', value: encodeURIComponent("13000118:BB-A")}]},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-O-ChoosePhone", true) : false));
				},
				actionFcn: function(rule,evt){
					
					var divId = "embeddedContent";
					var divEl = doc.getElementById(divId);
					if (isNullOrUndefined(divEl)) {
						log("Error: DIV with id \"" + "embeddedContent" + "\" not found.");
					} else {
                        var buID = 
                                            
                                            rule.getBusinessUnitID()
                                        ;
                        var urlData = FP.parseXFrameUrl("https://formsv3.inq.com/orbeon/inq/view?dtid=13000118");
                        var ldr = new XFormsLoader();
                        ldr.createXFrame(divEl, urlData.url, buID, "no", urlData.params, rule, {type: "br", id: rule.getID()}, {type: "div", id: divId});

                    }

				},
                active: true
			}), 
			BusinessRule.create({
				id: 1041,
				
				name:"BB-O-Embedded-Video",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"displayEmbeddedVideo"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-O-ChoosePhone", true) : false));
				},
				actionFcn: function(rule,evt){
					
					var divId = "embeddedContent";
					var divEl = doc.getElementById(divId);
					if (isNullOrUndefined(divEl)) {
						log("Error: DIV with id \"" + "embeddedContent" + "\" not found.");
					} else {
                        var buID = 
                                            
                                            rule.getBusinessUnitID()
                                        ;
                        var urlData = FP.parseXFrameUrl("https://formsv3.inq.com/orbeon/inq/view?dtid=18000320");
                        var ldr = new XFormsLoader();
                        ldr.createXFrame(divEl, urlData.url, buID, "no", urlData.params, rule, {type: "br", id: rule.getID()}, {type: "div", id: divId});

                    }

				},
                active: true
			}), 
			BusinessRule.create({
				id: 1050,
				
				name:"BB-O-P-FacebookLike",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*facebookLike.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:17000384}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1095,
				
				name:"BB-P-Prechat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*prechat\.html.*") != null ? true : false) && (!(win.document.URL.match(".*prechat\.html.*#reactive.*") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:20000399}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1096,
				
				name:"BB-R-Prechat",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*prechat\.html.*#reactive.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:20000399}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1100,
				
				name:"BB-P-Guide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*/guide.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:21000399}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1101,
				
				name:"BBank-Guide",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)\/bestbank\/bbank-contact_us(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000855,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1105,
				
				name:"BB-P-EmbeddedVideo",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:3000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*embeddedVideo.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:21000402}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1110,
				
				name:"BB-P-CallWithChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*callWithChat.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:22000401}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1130,
				
				name:"BB-P-ExitChat-Offer",
				funnelLevel:1,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*exitChat.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					Inq.EC.doInit(
						this,
						"Wait! A Best Brands agent would like to talk to you about receiving an extra 10% off of your order. Please click on \"stay on this page\" on the next window to stay on this page and chat with an agent.",
						null,
						"Please click on \"stay on this page\" to chat with an agent about receiving 10% off of your order.",
						true,
						null
					);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1140,
				
				name:"BB-P-ExitChat",
                ruleType:"POPUP",
				funnelLevel:1,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onBeforeExitConfirmation"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*exitChat.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:14202833,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1150,
				
				name:"BB-TO-StandAlone",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*TO-standAlone.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:23000410}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1160,
				
				name:"BB-TO-WithChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*TO-withChat.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:15202822,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:23000412}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1170,
				
				name:"BB-P-Standalone-Video-Comcast",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*standaloneVideo-Comcast.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:23000415}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1180,
				
				name:"BB-P-Agentpushed-Video-Comcast",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*agentpushedVideo-Comcast.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:23000416}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1190,
				
				name:"BB-P-ComcastVideoWithChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*comcastVideoWithChat.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:23000417}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1200,
				
				name:"BB-P-PhoneSkin",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*phone.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24000412}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1210,
				
				name:"BB-O-R-C2Persistent",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*c2persistent.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,	igaa:true
}; } , true);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1220,
				
				name:"BB-Pseudo-SearhTerms",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*searchString.*chat.*") != null ? true : false) || (win.document.URL.match(".*searchString.*Chat.*") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1230,
				
				name:"BB-AgentPushedForm",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:1000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*agentPushedForm.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000448}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1240,
				
				name:"BB-C2C-CheckAgentAvailability",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*checkAgentAvailability.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,	aaci:10000
,	aaciPollCount:50
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1250,
				
				name:"BB-Proactive-DockedC2C",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:1000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*dockedC2C.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1260,
				
				name:"BB-Proactive-CloudIQ",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*cloudIQ.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24000510}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1290,
				
				name:"BB-C2C-Comcast-HUGE",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*comcastHUGE.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:31000473}
, chatSpec:{id:18000871, chatTheme:{id:24000516}
}
,	igaa:true,peId:"inqC2C3ImgContainer"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1300,
				
				name:"BB-P-QRCode",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*qrcode.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17204685,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1310,
				
				name:"BB-P-KeySurvey-Redirect",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*keysurveyRedirect.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17204804,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1320,
				
				name:"BB-C2C-DirecTV-Modal",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-DirecTV-Modal", true) : false));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:31000475}
, chatSpec:{id:18000871, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,peId:"modalImgContainer"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1330,
				
				name:"BB-P-AutoAgentOpener",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*autoAgentOpener.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
, aaoId:17207393}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1340,
				
				name:"BB-SuperGuide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*superguide.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000575}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1360,
				
				name:"BB-AICI-Baynote",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*baynoteAICI.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000622}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1370,
				
				name:"BB-FB-StatusUpdate",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-I-OrderConfirmation", true) : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000713}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1380,
				
				name:"BB-ProactiveC2Persistent",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:1000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*proactiveC2Persistent.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17215268,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000724}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1390,
				
				name:"BB-AutoOpenerWithPersistentInvite",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*autoOpenerWithPersistentInvite.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17215342,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1400,
				
				name:"BB-Mobile-Guide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.checkCG("BBank-content")) && ((win.document.URL.match(".*/m/phones.html.*") != null ? true : false) || (win.document.URL.match(".*#mobile-guide") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24000757}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1410,
				
				name:"BB-FinancialDashboard-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*financialDashboard.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000628, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1420,
				
				name:"BB-ING-Offer-1",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:3000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*changeAddress.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000764}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1430,
				
				name:"BB-ING-Offer-2",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:3000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*fundTransfer.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000765}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:1440,
				
				name:"BB-ING-Guide-Launcher",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatClosed", serviceType:"ALL"} ]},
				conditionalFcn: function(rule,evt){
					return ((exists(CHM.getChat().getRuleName()) ? CHM.getChat().getRuleName().toString() : "").contains("BB-FinancialDashboard-C2C", false));
				},
				actionFcn: function(rule, evt){
					
					EVM.fireCustomEvent('launch-BB-ING-Guide', rule, evt,
						function() {
							return {};
						}
					);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1450,
				
				name:"BB-ING-Guide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"launch-BB-ING-Guide", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (!(LDM.checkCG("BBank-content")));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000769}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1451,
				
				name:"BB-PreemptiveExitChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"mouseOver-launchRule", delayInMS:3000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (PM.getVar("launchEnabled",rule).getValue());
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1452,
				
				name:"BB-C2C-UnityMedia",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*unitymedia.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000643, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}

}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1453,
				
				name:"BB-C2C-NEW-CI",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*newCI.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:31000473}
, chatSpec:{id:29001056, chatTheme:{id:24000839}
}
,	igaa:true,peId:"inqC2C3ImgContainer"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1454,
				
				name:"BB-Proactive-From_SMS",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 10.0;},
				getAAtts: function(){return []},
				agID:10004745,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match("(.*)demo\.touchcommerce\.com\/m\/smsChat\.html(.*)") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1455,
				
				name:"BB-SP-Simple-CSS-Chat-Skin-v1",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*css-skin=v1.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, ignHOP:true, chatTheme:{id:24000866}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1456,
				
				name:"BB-SP-MFS-v1",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*mfs=v1.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, ignHOP:true, chatTheme:{id:24000862}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1457,
				
				name:"BB-SP-Load_Chat_Theme",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#tc-chat.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("hashChatThemeID", rule).setValue(parseFloat(FM.callExternal(FM.getFcn("getUrlParameterByName"), "theme")));
					PM.getVar("hashChatSpecID", rule).setValue(parseFloat(FM.callExternal(FM.getFcn("getUrlParameterByName"), "spec", 18000871)));
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:PM.getVar("hashChatSpecID",rule).getValue(),igaa:true, ignHOP:true, chatTheme:{id:PM.getVar("hashChatThemeID",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1458,
				
				name:"BB-SP-Dynamic_Tooltip_HTML",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (((new Boolean(FM.callExternal(function() {try { return !! document.getElementById('inqC2CImgContainer').firstChild.onclick;} catch(e) {return false;}}))).valueOf()) && (win.document.URL.match(".*#dynamic-tooltip-html") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("tooltipDisplayed", rule).setValue("YES");processReceivedExternalDataThrows("var div = top.document.createElement(\"DIV\");div.innerHTML = '<div id=\"inq-SP-Tooltip\"></div>';top.document.body.appendChild(div.firstChild);")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(), chatSpec:{id:18000871}
,peId:"inq-SP-Tooltip"
}; } , false);FM.callExternal(FM.getFcn("callAddOn"), "displayC2CTooltip", MixIns.unmixMutatable(MixIns.mixMutatable().set("id", "inq-SP-Tooltip").set("c2cID", "inqC2CImgContainer").set("position", "left").set("html", "\n                                        \n                        <div>John is available to answer your questions!<br/>Just click on 'Live Chat'.</div>\n                        <style type=\"text/css\">\n                          #inq-SP-Tooltip {\n                            position: relative;\n                            background: green;\n                            border: 4px solid darkgreen;\n                            padding: 7px;\n                            z-index: 999;\n                            text-align: center;\n                            font-size: 16px;\n                            box-shadow: 0 0 5px 1px rgba(0,0,0,0.5);\n                            color: white;\n                            font-weight: bold;\n                            border-radius: 10px;\n                          }\n                          #inq-SP-Tooltip:after, #inq-SP-Tooltip:before {\n                            left: 100%;\n                            top: 50%;\n                            border: solid transparent;\n                            content: \" \";\n                            height: 0;\n                            width: 0;\n                            position: absolute;\n                            pointer-events: none;\n                          }\n\n                          #inq-SP-Tooltip:after {\n                            border-left-color: green;\n                            border-width: 16px;\n                            margin-top: -16px;\n                          }\n                          #inq-SP-Tooltip:before {\n                            border-left-color: darkgreen;\n                            border-width: 22px;\n                            margin-top: -22px;\n                          }\n                        </style>\n                      \n                                    ").set("width", 210).set("height", 92).set("offsetPx", 20).set("seconds", 10).set("fadeIn", 600).set("initialTopOffset", -50)));
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1459,
				
				name:"BB-SP-R-Left-Anchored-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'tooltipDisplayed', value: encodeURIComponent(PM.getVar("tooltipDisplayed",rule).getValue())}]},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#left-anchored-c2c.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000661
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1460,
				
				name:"BB-SP-Dynamic_Tooltip-Left",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'tooltipDisplayed', value: encodeURIComponent("YES")}]},
				
				conditionalFcn: function(rule,evt){
					return ((PM.getVar("tooltipDisplayed",rule).getValue().equals("NO", false)) && (win.document.URL.match(".*#left-anchored-c2c-dynamic-tooltip") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("tooltipDisplayed", rule).setValue("YES");processReceivedExternalDataThrows("var div = top.document.createElement(\"DIV\");div.innerHTML = '<div id=\"inq-SP-Tooltip\"></div>';top.document.body.appendChild(div.firstChild);")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(), chatSpec:{id:18000871}
,peId:"inq-SP-Tooltip"
}; } , false);FM.callExternal(FM.getFcn("callAddOn"), "insertStyles", "#inq-SP-Tooltip {padding: 7px;z-index: 999;background: rgb(7, 92, 0);background: linear-gradient(top, rgb(1, 160, 20), rgb(7, 92, 0));background: -webkit-linear-gradient(top, rgb(1, 160, 20), rgb(7, 92, 0));background: -moz-linear-gradient(top, rgb(1, 160, 20), rgb(7, 92, 0));background: -ms-linear-gradient(top, rgb(1, 160, 20), rgb(7, 92, 0));border: 3px solid black;text-align: center;font-size: 16px;box-shadow: 0 0 5px 1px rgba(0,0,0,0.5);color: white;font-weight: bold;}#inq-SP-Tooltip {position: absolute;border: 10px solid transparent;border-right-color: black;top: 30px;left: -23px;};", "inq-C2C-tooltip");FM.callExternal(FM.getFcn("callAddOn"), "displayC2CTooltip", MixIns.unmixMutatable(MixIns.mixMutatable().set("id", "inq-SP-Tooltip").set("c2cID", "inq-SP-C2C-injected-left").set("position", "right").set("html", "<div><span>John is available to answer your questions!<br/>Just click on 'Live Chat'.</span><span class=\"arrow\"></span></div>").set("width", 210).set("height", 92).set("offsetPx", 20).set("seconds", 10).set("fadeIn", 600).set("initialTopOffset", -50)));
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1461,
				
				name:"BB-Phones-V4-NUM",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*numericable-mobile.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24000937}
}

}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1462,
				
				name:"BB-TabletScript",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#tablet-script") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:12200150,igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2092,
				
				name:"ddasdasdasd",
                ruleType:"POPUP",
				funnelLevel:5,
				businessUnitID:13000508,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 1.0;},
				getAAtts: function(){return []},
				businessUnitId: 13000508,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Standard")) && (getConstant("fl", rule) < PM.getVar("cfl",rule).getValue()) && (LDM.getPageMarker(1).equals("BB-DirecTV-Modal", false)));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871}
}).request();
				},
                active: false
			}), 
			BusinessRule.create({
				id: 1463,
				
				name:"BB-C2C-WithAACheckInterval",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#c2c-with-aa-check-interval") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
,	aaci:10000
,	aaciPollCount:50
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1464,
				
				name:"BB-FAQ-Guide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"launchFAQGuide"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'product', value: encodeURIComponent("guide")}, {name: 'solution_type', value: encodeURIComponent("self-service")}, {name: 'automaton', value: encodeURIComponent("18000261:BB-C")}]},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24000960}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1465,
				
				name:"BB-TO-Jessica-HeadsetCharger",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'product', value: encodeURIComponent("content")}, {name: 'solution_type', value: encodeURIComponent("promo to redirect")}, {name: 'automaton', value: encodeURIComponent("17000125:BestBrands-TargetedOffer")}]},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*account_jessica.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000961}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1466,
				
				name:"BB-P-SalesForce",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#salesforce") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000970}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10466,
				
				name:"BB-Virtual-Agent-Guide",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#[T|t]ouch[A|a]ssist-guide") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000982}
, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001812}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10467,
				
				name:"BB-P-Virtual-Agent-Guide_live",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"launchLiveChat", delayInMS:1000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:15000384}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 10468,
				
				name:"BB-P-Virtual-Agent-Guide_virtual",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"launchVirtualChat", delayInMS:1000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, aId:"18000492",stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001806}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1467,
				
				name:"BB-SP-Dynamic_Tooltip_Image",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (((new Boolean(FM.callExternal(function() {try { return !! document.getElementById('inqC2CImgContainer').firstChild.onclick;} catch(e) {return false;}}))).valueOf()) && (win.document.URL.match(".*#dynamic-tooltip-image") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("tooltipDisplayed", rule).setValue("YES");processReceivedExternalDataThrows("var div = top.document.createElement(\"DIV\");div.innerHTML = '<div id=\"inq-SP-Tooltip\"></div>';top.document.body.appendChild(div.firstChild);")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(), chatSpec:{id:18000871}
,peId:"inq-SP-Tooltip"
}; } , false);FM.callExternal(FM.getFcn("callAddOn"), "displayC2CTooltip", MixIns.unmixMutatable(MixIns.mixMutatable().set("id", "inq-SP-Tooltip").set("c2cID", "inqC2CImgContainer").set("position", "left").set("image", "https://mediav3.inq.com/media/sites/10003715/images/SP-Dynamic-Tooltip.png").set("width", 210).set("height", 92).set("offsetPx", 20).set("seconds", 10).set("fadeIn", 600).set("initialTopOffset", -50)));
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1468,
				
				name:"BB-SP-P-SelfServe_Guide-T0",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'guide_id', value: encodeURIComponent("10")}, {name: 'guide_version_id', value: encodeURIComponent("15")}]},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)#self-serve-guide(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1, aspecData:{ "json":"{\"guide_id\":10,\"version_id\":15,\"rule\":\"BB-SP-P-SelfServe_Guide-T0\",\"jsonp\":false}"},igaa:true, ignHOP:true, chatTheme:{id:24000977}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2042,
				
				name:"BB-SP-P-SelfServeGuide-140924",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'guide_id', value: encodeURIComponent("10")}, {name: 'guide_version_id', value: encodeURIComponent("15")}]},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)?self-serve-guide-2(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1, aspecData:{ "guide_version_id":15},igaa:true, ignHOP:true, chatTheme:{id:24001190}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1469,
				
				name:"BB-VideoChat",
                ruleType:"C2VIDEO",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#video-chat") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2VIDEO, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24000978}
}

}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1470,
				
				name:"BB-PostChatSurvey-Launcher",
				funnelLevel:5,
				vars:[
		{name:"PostChatSurveyURL_1470", defVal:null, rId:"tmpVars", shName:"pcsu", fnCast:function(o){ return o?o.toString():o;}, fnSer:null, maxSize:null, type:"String"}],
				triggersFcn:function(rule) {return [{id:"on"+"launchPostChatSurveyInCI"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("PostChatSurveyURL", rule).setValue((exists(FM.callExternal(FM.getFcn("createPostChatSurveyURL"), "http://www.keysurvey.com/f/334239/1e19/?LQID=1", MixIns.unmixMutatable(MixIns.mixMutatable().set("agentID", PM.getVar("assistAgt",rule).getValue()).set("businessUnitID", CHM.getBusinessUnitID(evt, rule)).set("siteID", getSiteID()).set("chatID", CHM.getChatID()).set("custID", Inq.getCustID()).set("BRName", PM.getVar("asstRuleName",rule).getValue()).set("clientID", getSiteID()).set("sessionID", getSessionID()).set("incAssignmentID", getIncAssignmentID()).set("surveyContent", "")))) ? FM.callExternal(FM.getFcn("createPostChatSurveyURL"), "http://www.keysurvey.com/f/334239/1e19/?LQID=1", MixIns.unmixMutatable(MixIns.mixMutatable().set("agentID", PM.getVar("assistAgt",rule).getValue()).set("businessUnitID", CHM.getBusinessUnitID(evt, rule)).set("siteID", getSiteID()).set("chatID", CHM.getChatID()).set("custID", Inq.getCustID()).set("BRName", PM.getVar("asstRuleName",rule).getValue()).set("clientID", getSiteID()).set("sessionID", getSessionID()).set("incAssignmentID", getIncAssignmentID()).set("surveyContent", ""))).toString() : ""));
					if (CHM.isChatInProgress()) {
						FP.updateXFrameFromBizRule(
							"PostChatSurvey",
							PM.getVar("PostChatSurveyURL",rule).getValue(),
							rule.getBusinessUnitID()
						);
					}

					PM.getVar("hasSurveyLaunched", rule).setValue(true);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1471,
				
				name:"BB-PostChatSurveyInCI",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#post-chat-survey-in-ci") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000986}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2023,
				
				name:"BB-SP-R-Show_C2C_On_Scroll",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"evtWindowScroll"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					FM.callExternal(FM.getFcn("log"), evt);
				},
                active: true
			}), 
			Rule.create({
				id:2024,
				
				name:"BB-SP Load Injected Div",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\/sp.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("var div = top.document.createElement(\"DIV\");div.innerHTML = '<div id=\"inq-SP-C2C-injected-2\"></div>';top.document.body.appendChild(div.firstChild);")
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2027,
				
				name:"BB-SP-R-HTML_C2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\?q=html-c2c$") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(),	igaa:true,peId:"inq-SP-C2C-injected-2"
}; } , false);
				},
                active: true
			}), 
			Rule.create({
				id:2028,
				
				name:"Load HTML C2C",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onC2CDisplayed"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if ("BB-SP-R-HTML_C2C".equals((exists(evt.rule.name) ? evt.rule.name.toString() : ""), false)) {
	FM.callExternal(FM.getFcn("callAddOn"), "createHTMLButton", "inq-SP-C2C-injected-2", getConstant("C2C_HTML", rule));
					}  else  if ("BB-SP-R-HTML_C2C_Animated_Footer".equals((exists(evt.rule.name) ? evt.rule.name.toString() : ""), false)) {
	FM.callExternal(FM.getFcn("callAddOn"), "createHTMLButton", "inq-SP-C2C-injected-2", getConstant("C2C_HTML", rule), MixIns.unmixMutatable(MixIns.mixMutatable().set("initial", MixIns.unmixMutatable(MixIns.mixMutatable({"bottom": -50}))).set("final", MixIns.unmixMutatable(MixIns.mixMutatable({"bottom": 0}))).set("duration", 500).set("suppress", PM.getVar("c2cAnimated",rule).getValue())));
					PM.getVar("c2cAnimated", rule).setValue(true);
					}  else   if ("BB-SP-R-HTML_C2C_Animated_Right".equals((exists(evt.rule.name) ? evt.rule.name.toString() : ""), false)) {
	FM.callExternal(FM.getFcn("log"), evt);FM.callExternal(FM.getFcn("callAddOn"), "createHTMLButton", "inq-SP-C2C-injected-2", getConstant("C2C_HTML_RIGHT_BOTTOM", rule), MixIns.unmixMutatable(MixIns.mixMutatable().set("initial", MixIns.unmixMutatable(MixIns.mixMutatable({"right": -220}))).set("final", MixIns.unmixMutatable(MixIns.mixMutatable({"right": 0}))).set("suppress", PM.getVar("c2cAnimated",rule).getValue())));
					PM.getVar("c2cAnimated", rule).setValue(true);
					}    
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2029,
				
				name:"BB-SP-R-HTML_C2C_Animated_Footer",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"evtWindowScroll"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((!(PM.getVar("c2cAnimated",rule).getValue())) && (win.document.URL.match(".*\?q=html-c2c-animated-footer$") != null ? true : false) && (parseFloat(evt.scrollTop) >= 300));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(),	igaa:true,peId:"inq-SP-C2C-injected-2"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2030,
				
				name:"BB-SP-R-HTML_C2C_Animated_Right",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"evtWindowScroll"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((!(PM.getVar("c2cAnimated",rule).getValue())) && (win.document.URL.match(".*\?q=html-c2c-animated-right$") != null ? true : false) && (parseFloat(evt.scrollTop) >= 300));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(),	igaa:true,peId:"inq-SP-C2C-injected-2"
}; } , false);
				},
                active: true
			}), 
			Rule.create({
				id:2016,
				
				name:"Find Script Commands",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"newTranscriptMessage"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					FM.callExternal(FM.getFcn("callAddOn"), "findScriptCommands");
				},
                active: true
			}), 
			Rule.create({
				id:2017,
				
				name:"Reset Script Commands Listener",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatClosed", serviceType:"ALL"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					FM.callExternal(FM.getFcn("callAddOn"), "resetScriptCommandsListener");
				},
                active: true
			}), 
			Rule.create({
				id:2019,
				
				name:"Hide Quick Replies",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentMsg"}, {id:"onCustomerMsg"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					FM.callExternal(FM.getFcn("callAddOn"), "hideQuickReplies");
				},
                active: true
			}), 
			BusinessRule.create({
				id: 5021,
				
				name:"BB-SP-P-TapResponseSkin",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)\?(quick-replies|tap-response)(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:false, chatTheme:{id:24001003}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 5022,
				
				name:"BB-SP-P-TapResponseSkinLiveTesting",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				agID:10004386,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)\?(noAAquickreplies|noAAtapresponse)(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, ignHOP:true, chatTheme:{id:24001003}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2020,
				
				name:"BB-Phone-TouchGuide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#touch-guide") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001047}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2021,
				
				name:"BB-ATT-Offer",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#att-offer") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001069}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2022,
				
				name:"BB-ATT-SA-Offer",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'product', value: encodeURIComponent("content")}, {name: 'solution_type', value: encodeURIComponent("promo to redirect")}, {name: 'automaton', value: encodeURIComponent("18000288:BB-ATT-SA-Offer")}]},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#att-sa-offer") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001070}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2025,
				
				name:"BB-ATT-Video",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*#att-video") != null ? true : false) && (!(win.document.URL.match(".*#att-video-with-chat") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001071}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2026,
				
				name:"BB-ATT-SA-Video",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#att-sa-video") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001072}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2033,
				
				name:"BB-ATT-VideoWithChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#att-video-with-chat") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001075}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2034,
				
				name:"BB-P-PlanGuide",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'product', value: encodeURIComponent("guide + chat")}, {name: 'solution_type', value: encodeURIComponent("product recommendation")}, {name: 'automaton', value: encodeURIComponent("18000290:BB-P-PlanGuide")}]},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#plan-guide") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000637}
, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001078}
}

}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2035,
				
				name:"BB-P-Marketing-GS5-Offer",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match("(.*)\/m\/\#marketing-gs5-offer(.*)") != null ? true : false) && (isDeviceType("Phone")));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17204685,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001079}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2036,
				
				name:"BB-GS5-MinimizeChat",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*galaxys5.html.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("inqFrame.com.inq.flash.client.control.MinimizeManager.actionMinimize();")
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2039,
				
				name:"BB-Comcast-Test-Skin",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#comcast-test-skin") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001097}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2040,
				
				name:"BB-SP-P-IntelligentDefer",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\?q=intelligent-defer") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("automatonDataMap", rule).setValue((exists(FM.callExternal(FM.getFcn("jsonStringify"), MixIns.unmixMutatable(MixIns.mixMutatable().set("keywords", "no thanks, no thank you, just browsing, just looking, at this time, right now, fuck").set("forcedRouteTimer", 60).set("maxCharLength", 45)))) ? FM.callExternal(FM.getFcn("jsonStringify"), MixIns.unmixMutatable(MixIns.mixMutatable().set("keywords", "no thanks, no thank you, just browsing, just looking, at this time, right now, fuck").set("forcedRouteTimer", 60).set("maxCharLength", 45))).toString() : ""));
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, ignHOP:true, chatTheme:{id:24001098}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2041,
				
				name:"BB-SP-Unique_Session_Visits_Counter",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return 0.0;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'incr_exclude', value: encodeURIComponent("YES")}]},
				
				conditionalFcn: function(rule,evt){
					return (PM.getVar("Unique_Session_Visits_Counter",rule).getValue());
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("Unique_Session_Visits_Counter", rule).setValue(false);processReceivedExternalDataThrows("            var div = top.document.createElement(\"DIV\");div.innerHTML = '<div id=\"inq-SP-C2C-Unique_Session_Visits_Counter\" style=\"position: absolute; top: -9999px\"></div>';top.document.body.appendChild(div.firstChild);")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:PM.getVar("CLEAR_C2C_SPEC",rule).getValue(),	igaa:false,peId:"inq-SP-C2C-Unique_Session_Visits_Counter"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2044,
				
				name:"BB-Phone-Prechat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*#phone-prechat") != null ? true : false) || (win.document.URL.match(".*#mobile-prechat") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001208}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2045,
				
				name:"BB-Embedded-Video",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*choose_phones_vid\.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					var divId = "embeddedContentContainer";
					var divEl = doc.getElementById(divId);
					if (isNullOrUndefined(divEl)) {
						log("Error: DIV with id \"" + "embeddedContentContainer" + "\" not found.");
					} else {
                        var buID = 
                                            
                                            rule.getBusinessUnitID()
                                        ;
                        var urlData = FP.parseXFrameUrl("http://demo.touchcommerce.com/video_s5.html");
                        var ldr = new XFormsLoader();
                        ldr.createXFrame(divEl, urlData.url, buID, "no", urlData.params, rule, {type: "br", id: rule.getID()}, {type: "div", id: divId});

                    }

				},
                active: true
			}), 
			BusinessRule.create({
				id: 2046,
				
				name:"BB-SP-Dynamic-Pre-Chat-Survey",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\/cowboy-survey\.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001224}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2047,
				
				name:"Maximize Skin",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"maximizeSkin"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n              window.inqMaximizeSkin();\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:2049,
				
				name:"BofA-C2C-Theme",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\/bofa\/personal-info\.html.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("bofa_c2c_theme", rule).setValue(33000701);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2050,
				
				name:"BB-BofA-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\/bofa\/.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:PM.getVar("bofa_c2c_theme",rule).getValue()}
, chatSpec:{id:18000871, oId:17224920,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001229}
}
,	igaa:true,peId:"tcChat"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2055,
				
				name:"BB-C2C-WithinContent",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-I-Cart", true) : false));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:30000628, c2cTheme:{id:33000702}
, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}

}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2057,
				
				name:"BB-SP-Automaton_Preview",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match("automaton_id=\\d+.*") != null ? true : false) && (!(win.document.URL.match("persistent=true") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					PM.getVar("automatonDataMap", rule).setValue((exists(FM.callExternal(FM.getFcn("getUrlParameterByName"), "automatonDataMap")) ? FM.callExternal(FM.getFcn("getUrlParameterByName"), "automatonDataMap").toString() : ""));
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001232}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2058,
				
				name:"BB-SP-Load_Automaton_Preview",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"loadAutomatonPreview"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					if (CHM.isChatInProgress()) {
						FP.updateXFrameFromBizRule(
							"automaton",
							"/orbeon/inq/view?dtid="+(exists(FM.callExternal(FM.getFcn("getUrlParameterByName"), "automaton_id")) ? FM.callExternal(FM.getFcn("getUrlParameterByName"), "automaton_id").toString() : ""),
							rule.getBusinessUnitID()
						);
					}
processReceivedExternalDataThrows("\n                        \n            setTimeout(function() {\n              try {\n                var $ = jQuery,\n                  ciDoc = $('#inqChatStage')[0].contentDocument,\n                  xFrameDoc = $('#automaton iframe', ciDoc)[0].contentDocument,\n                  html = $('html', xFrameDoc).html(),\n                  clientID = html.match(/media\\/sites\\/(.+)\\/flash\\/.+/)[1],\n                  theme = html.match(/media\\/sites\\/.*\\/flash\\/([^\\/]+)\\/.+/)[1];\n            \n                console.debug('The automaton is linked to chat theme \"' + theme + '\" on client ID ' + clientID);\n              } catch(e) {\n                console.debug('Unable to determine linked chat theme for automaton.');\n              }\n            }, 4000);\n          \n                    ")
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2086,
				
				name:"BB-SP-R-Automaton_Preview_Persistent",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match("automaton_id=\\d+") != null ? true : false) && (win.document.URL.match("persistent=true") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001232}
}
,	igaa:true
}; } , true);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2059,
				
				name:"BB-SP-BankOfAmerica_Guide",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("demo\.touchcommerce\.com\/bofa\/cc_faq\.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					processReceivedExternalDataThrows("\n                               \n               var div = top.document.createElement(\"DIV\");\n               div.innerHTML = '<div id=\"inq-BofA-Guide-C2C\" style=\"position: fixed; top: 30%;right:0\"></div>';\n               top.document.body.appendChild(div.firstChild);\n            \n                    ")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000710}
, chatSpec:{id:18000871, aspecData:{ "guide_version_id":34,  "guide_id":23}, chatTheme:{id:24001243}
}
,	igaa:true,peId:"inq-BofA-Guide-C2C"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2060,
				
				name:"BB-BofA-Search-MoveMoney",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*bofa.*search_move_money\.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17224920,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001229}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2065,
				
				name:"BB-BofA-Search-MoveMoney-Datapass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*bofa.*search_move_money\.html.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
            ROM.sendDataToAgent(
                CHM.getAgentID(),
            MixIns.mixMutatable(MixIns.unmixMutatable(MixIns.mixMutatable().set("search_term_1", "savings transfer").set("search_term_2", "savings to checking").set("search_term_3", "move money"))).set("agentID",CHM.getAgentID()).set("engagementID",CHM.getChatID())
            
            );
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2070,
				
				name:"BB-BofA-C2C-Mobile",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*bofa.*mobile.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000701}
, chatSpec:{id:18000871, oId:17224920,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001229}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			Rule.create({
				id:2080,
				
				name:"BB-LinkGeneration-Datapass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return (((win.document.URL.match(".*source=.*") != null ? true : false) || (win.document.URL.match(".*agentGroupID=.*") != null ? true : false) || (win.document.URL.match(".*agentID=.*") != null ? true : false)) && (!(win.document.URL.match(".*launchCobrowse.*") != null ? true : false)));
				},
				actionFcn: function(rule, evt){
					
					log("*** DATAPASS ***");
processReceivedExternalDataThrows("\n                        \n          var url = document.URL;\n          var params = url.split(\"?\")[1].split(\"&\");\n          var urlParams = {\n            \"source\": \"\",\n            \"textField1\": \"\",\n            \"textField2\": \"\"\n          };\n\n          for (var i = 0; i < params.length; i++) {\n          \n            var key = params[i].split(\"=\")[0];\n            var value = params[i].split(\"=\")[1];\n            \n            if (typeof value !== \"undefined\") {\n            \n              value = value.replace(/[+]|%20/g, \" \");\n\n              if (key == \"source\") {\n                urlParams.source = value;\n              } else if (key == \"textField1\") {\n                urlParams.textField1 = value;\n              } else if (key == \"textField2\") {\n                urlParams.textField2 = value;\n              }\n            }\n          }\n        \n                    ")
            ROM.sendDataToAgent(
                CHM.getAgentID(),
            MixIns.mixMutatable(safe('urlParams')
).set("agentID",CHM.getAgentID()).set("engagementID",CHM.getChatID())
            
            );
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2085,
				
				name:"BB-BofA-C2Call",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*\/bofa\/.*call.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000713}
, chatSpec:{id:18000871, oId:17224920,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001244}
}
,	igaa:true,peId:"tcCall"
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2087,
				
				name:"BB-SP-R-Persistent_Pre_Chat_Form",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("persistent-pre-chat-form") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001252}
}
,	igaa:true
}; } , true);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2090,
				
				name:"BB-LaunchChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*embeddedChat.html.*") != null ? true : false) || (win.document.URL.match(".*launchChat\.html.*") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001330}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2095,
				
				name:"BB-LaunchPrechat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*launchPrechat\.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:20000399}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2096,
				
				name:"Check Agent Availability - with Callback",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"CheckAgentAvailabilityWithCallback"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
						CallRemote.create({
							doCallbackActions: function(data){
								FM.callExternal( function(callback, response) { callback(response); } , evt.callback, data);
							}
						}).callRemote(
							urls.agentsAvailabilityCheckURL,
							{"siteID": prepareDataToSend(getSiteID()),"buID": prepareDataToSend(evt.buID),"agentGroupId": prepareDataToSend(evt.agentGroupId),"agentAttributes": prepareDataToSend(evt.agentAttributes)}
						);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2097,
				
				name:"BB-SP-R-AG-TC_Product_Rec_Guide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return [{name: 'guide_id', value: encodeURIComponent("18")}, {name: 'guide_version_id', value: encodeURIComponent("25")}, {name: 'product', value: encodeURIComponent("guide + chat")}, {name: 'solution_type', value: encodeURIComponent("guide:product recommendation")}, {name: 'automaton', value: encodeURIComponent("18000325: TC-Solution_Recommendation_Guide_v3-141006")}]},
				
				conditionalFcn: function(rule,evt){
					return (((isDeviceType("Standard")) || (isDeviceType("Tablet"))) && (win.document.URL.match(".*tc-product-rec-guide.*") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1, aspecData:{ "guide_version_id":25},igaa:true, ignHOP:true, chatTheme:{id:24001315}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2100,
				
				name:"BB-EmbeddedPrechat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-EmbeddedPrechat", true) : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001350}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2105,
				
				name:"BB-DirectCobrowse-Datapass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*launchCobrowse.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Customer ID": prepareDataToSend(safe("customerID")),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2106,
				
				name:"BB-DirectCobrowse",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*launchCobrowse.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000962}
, aaoId:17212153}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2110,
				
				name:"BB-Tablets-T0",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*choose_tablets\.html") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000448}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2115,
				
				name:"BB-Phone-TabletGuide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match(".*#tablet-guide") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001321}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2120,
				
				name:"BB-P-Mobile-Video",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match(".*#mobile-video") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001079}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2122,
				
				name:"BB-SP-P-Automaton_Reporting_Test",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*automaton-reporting-test.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001334}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2144,
				
				name:"BB-SP-ACIF_Testing-Pre_Cacher",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onRuleSatisfied"} ]},
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*pre-cache.*") != null ? true : false) && (!(PM.getVar("ACIF_PRE_CACHED",rule).getValue())) && ("BB-SP-R-Consumer_Routing_Guide-xtestx".equals((exists(evt.rule.name) ? evt.rule.name.toString() : ""), false)));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("ACIF_PRE_CACHED", rule).setValue(true);FM.callExternal(
                            
                function(acifVersion, assetsPath, loaderVersion) {
                  var iframe = document.createElement('iframe');
                  iframe.name = encodeURIComponent(acifVersion + ',' + assetsPath + ',' + loaderVersion);
                  document.body.appendChild(iframe).src = 'https://mediav3.inq.com/media/sites/320/flash/SolutionsAssets/acif/acif-pre-cacher.html';
                  setTimeout(function() { iframe.parentNode.removeChild(iframe); }, 5000);
                }
              
                        , "2.10.0", "https://mediaeastv3.inq.com/media/sites/10004119/flash/ATT-Common-Assets/automaton-configs.js", "1.2");
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2125,
				
				name:"BB-SP-R-Consumer_Routing_Guide-xtestx",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*acif-test.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					processReceivedExternalDataThrows("\n                        \n  window.inqAcifEventsRegistry = [ { initialized: function() {\n    var msg = [];\n    var xframe = window.inqGuide.frame;\n    var now = new Date().getTime();\n    var totalTime = now - window.acif_c2c_clicked;\n\n    msg.push('AUTOMATON LOAD TIME STATS:');\n    msg.push('Total time (rule fired to automaton initialized): ' + totalTime + 'ms');\n    msg.push('  - Rule triggered to CI initialized: ' + (window.acif_xframe_loaded - window.acif_c2c_clicked) + 'ms');\n    msg.push('  - CI initialized to XForms loaded: ' + (xframe.acif_scxml_start - window.acif_xframe_loaded) + 'ms');\n    msg.push('  - XForms loaded to acif_loader.js loaded: ' + (xframe.acif_loader_start - xframe.acif_scxml_start) + 'ms');\n    msg.push('  - acif_loader.js loaded to acif.js loaded: ' + (xframe.acif_start - xframe.acif_loader_start) + 'ms');\n    msg.push('  - acif.js loaded to automaton initialized: ' + (now - xframe.acif_start) + 'ms');\n\n    jQuery('<pre id=\"acif-stats\">')\n      .text( msg.join('\\n') )\n      .css({\n        position: 'fixed',\n        bottom: '10px',\n        left: '10px',\n        width: '400px',\n        zIndex: 9999999,\n        background: '#FFD5D5',\n        padding: '10px',\n        border: '1px solid black',\n        color: 'black',\n        boxShadow: '0 0 5px black'\n      })\n      .on('dblclick', function() { this.remove(); } )\n      .attr('title', 'Double click to dismiss.')\n      .appendTo('body');\n  }} ];\n        \n                    ")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871, oId:-1, aspecData:{ "acif_id":72,  "name":"ATT Consumer Routing Mega Guide",  "type":"guide",  "sub_type":"routing",  "acif_version":"2.10.0"},igaa:true, ignHOP:true, chatTheme:{id:24001405}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2127,
				
				name:"BB-Specific-Agent",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"specific_agent_found"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getAgentName:function(){ return PM.getVar("target_agent_name",rule).getValue();},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*cobrowseAgent.html.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17226609,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24000962}
, aaoId:17226589}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2130,
				
				name:"BB-Specific-Agent-Group-URL",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"specific_agent_group_found"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getAgID:function(){return PM.getVar("target_agent_group",rule).getValue();},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match("(.*)account\.html\?(.*)agentGroup\=(.*)") != null ? true : false) && (!(win.document.URL.match("(.*)account\.html\?(.*)agentID\=(.*)") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24000962}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2131,
				
				name:"BB-Specific-Agent-URL",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"specific_agent_found"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getAgentName:function(){ return PM.getVar("target_agent_name",rule).getValue();},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)account\.html\?(.*)agentID\=(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24000962}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2132,
				
				name:"BB-P-MockCalling",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#mock-calling") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(), chatTheme:{id:24001415}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2135,
				
				name:"BB-P-Twilio-Call",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#twilio-call") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001506}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2134,
				
				name:"BB-P-Twilio-Call-Adam",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#twilio-adam") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001865}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2136,
				
				name:"BB-P-Twilio-IVR",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#twilio-ivr$") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001740}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2137,
				
				name:"BB-P-Twilio-IVR-Voice",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#twilio-ivr-voice$") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001793}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2150,
				
				name:"BB-P-Standalone-Video",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#standalone-video") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001511}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2155,
				
				name:"BB-AP-SalesForce",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:2000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#agent-pushed-salesforce") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001567}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1173,
				
				name:"BB-CloseVideo",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"videoClose"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					log("Firing VideoClose Rule with JS.");
FM.callExternal(FM.getFcn("jsVideoClose"));
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1174,
				
				name:"BB-CloseMobileVideo",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"mVideoClose"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					log("Firing mVideoClose Rule with JS.");
FM.callExternal(FM.getFcn("jsMVideoClose"));
				},
                active: true
			}), 
			Rule.create({
				id:1175,
				
				name:"Post to Salesforce",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*clientformSalesforce.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
					log("Firing JS to grab data.");
FM.callExternal(FM.getFcn("jsPostToSalesforce"), getConstant("SF_AUTH_DATA", rule));
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1176,
				
				name:"BB-Proactive-Socket-Test",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:1000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)#socket-test") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001572}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2160,
				hasDomTrigger:true,
				name:"BB-ProactiveChat-OnMouseOver",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"mouseover", domElements:[[doc.getElementById("emailUsLink")]]} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-O-Homepage", true) : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2003,
				
				name:"Global-onRepeatChatter",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().equals("BB-O-Homepage", true) : false));
				},
				actionFcn: function(rule, evt){
					
					VAM.add({"IsRepeatChatterVA":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set((exists(PM.getVar("IsRepeatChatter",rule).getValue()) ? PM.getVar("IsRepeatChatter",rule).getValue().toString() : ""), true))},"mutuallyExclusive":false}, -1);
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Is-Repeat-Chatter": prepareDataToSend((exists(PM.getVar("IsRepeatChatter",rule).getValue()) ? PM.getVar("IsRepeatChatter",rule).getValue().toString() : "")),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
					PM.getVar("IsRepeatChatter", rule).setValue(true);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2165,
				
				name:"BB-Prechat-Routing",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				priority: 5,
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)account\.html\#prechat") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001624}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2005,
				
				name:"Global-onVADataPass",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onAgentAssigned"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*visitorAttributeDatapass.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
					log("Firing visitor-attribute-datapass.");

					VAM.add({"PageSampleData":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set((exists(FM.callExternal(function() {return document.getElementById('txtPageData').innerHTML;})) ? FM.callExternal(function() {return document.getElementById('txtPageData').innerHTML;}).toString() : ""), true))},"mutuallyExclusive":false, "UserSampleData":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set((exists(FM.callExternal(function() {return document.getElementById('txtUserData').value;})) ? FM.callExternal(function() {return document.getElementById('txtUserData').value;}).toString() : ""), true))},"mutuallyExclusive":false}, -1);
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "User-Datapass": prepareDataToSend((exists(FM.callExternal(function() {return document.getElementById('txtUserData').value;})) ? FM.callExternal(function() {return document.getElementById('txtUserData').value;}).toString() : "")),"Page-Datapass": prepareDataToSend((exists(FM.callExternal(function() {return document.getElementById('txtPageData').innerHTML;})) ? FM.callExternal(function() {return document.getElementById('txtPageData').innerHTML;}).toString() : "")),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1192,
				
				name:"BB-VA-Datapass",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"visitor-attribute-datapass"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					log("Firing visitor-attribute-datapass BR.");

					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1193,
				
				name:"BB-Paymetric",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#Paymetric*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					log("Firing Paymetric Chat.");

					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001644}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:1194,
				
				name:"BB-Paymetric-frameClose",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onCustomerMsg"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#Paymetric*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n                var transcripts = inqFrame.com.inq.flash.client.chatskins.SkinControl.cw.arrayTranscripts;\n                if(transcripts[transcripts.length - 1].Msg.indexOf(\"Payment Token:\") > -1){ inqFrame.com.inq.flash.client.control.XFrameWorker.shrink(\"paymetricFrame\"); }\n              \n                    ")
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1195,
				
				name:"BB-Routing-Attribute-Plans",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return [{name: 'Skill', value: encodeURIComponent("Plans")}]},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)#routing-plans(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:false}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1196,
				
				name:"BB-Routing-Attribute-Fraud",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return [{name: 'Skill', value: encodeURIComponent("Fraud")}]},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)#routing-fraud(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:false}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1197,
				
				name:"BB-Routing-Attribute-Toronto",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return [{name: 'location', value: encodeURIComponent("Toronto")}]},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)#routing-toronto(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:false}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 1198,
				
				name:"BB-Routing-Attribute-PF-Combo",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return [{name: 'Skill', value: encodeURIComponent("Plans")}, {name: 'Skill', value: encodeURIComponent("Fraud")}]},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)#routing-pf(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:false}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2200,
				
				name:"BB-ATT-Global-Video",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#ATT-Global-Video*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001724}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2205,
				
				name:"BB-Invitation-Twitter",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				priority: 1,
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*m/proactiveChat.html\?source=twitter.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:17243485,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID_Original",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:10010,
				
				name:"Shrink-Right-Frame",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"ShrinkRightFrame"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n              if(inqFrame.frameElement.contentDocument.getElementById('rightFrame').style.display == 'block'){\n                inqFrame.com.inq.flash.client.control.XFrameWorker.shrink('rightFrame');\n              }\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:10011,
				
				name:"Shrink-Bottom-Frame",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"ShrinkBottomFrame"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n              if(inqFrame.frameElement.contentDocument.getElementById('bottomFrame').style.display == 'block'){\n                inqFrame.com.inq.flash.client.control.XFrameWorker.shrink('bottomFrame');\n              }\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:10015,
				
				name:"Video-Player-Load",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"VideoPlayerLoad"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if ((new Boolean(FM.callExternal(
                                        function(){return typeof inqFrame.frameElement.contentWindow.YT != 'undefined' || typeof YT != 'undefined'; } 
                                    ))).valueOf()) {
	processReceivedExternalDataThrows("\n                                     \n                    ytplyr = (typeof YT != 'undefined') ? YT.get(\"tcChat_ytplayer\") : inqFrame.frameElement.contentWindow.YT.get(\"tcChat_ytplayer\");\n                    if(typeof YT != 'undefined'){ //Resize if mobile\n                      tcmchat = document.getElementById(\"tcChat_chat\");\n                      ytplyr.setSize(tcmchat.offsetWidth, tcmchat.offsetHeight - 100);\n                    }\n                    ytplyr.playVideo();\n                  \n                                ")
					}  
				},
                active: true
			}), 
			Rule.create({
				id:10020,
				
				name:"Video-Player-Close",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"VideoPlayerClose"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if ((new Boolean(FM.callExternal(
                                        function(){return typeof inqFrame.frameElement.contentWindow.YT != 'undefined' || typeof YT != 'undefined'; } 
                                    ))).valueOf()) {
	processReceivedExternalDataThrows("\n                                     \n                    ytplyr = (typeof YT != 'undefined') ? YT.get(\"tcChat_ytplayer\") : inqFrame.frameElement.contentWindow.YT.get(\"tcChat_ytplayer\");\n                    ytplyr.pauseVideo();\n                    \n                    if(inqFrame.frameElement.contentDocument.getElementById('videoFrame').style.display == 'block'){\n                      inqFrame.com.inq.flash.client.control.XFrameWorker.hideLayer('videoFrame');\n                    }\n                    \n                  \n                                ")
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Video_Closed": prepareDataToSend("Video frame closed."),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
					}  
				},
                active: true
			}), 
			Rule.create({
				id:10025,
				
				name:"Video-Player-Change",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"VideoPlayerChange"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Video_Change": prepareDataToSend("Video player change: "+(exists(FM.callExternal(
                                            
                        function(){
                          var vp = (typeof YT != 'undefined') ? YT.get("tcChat_ytplayer") : inqFrame.frameElement.contentWindow.YT.get("tcChat_ytplayer"), str;
                          switch(vp.getPlayerState()){
                            case -1: return "Player unstarted";
                            case 0: return "Video has ended.";
                            case 1: str = "Playing video"; break;
                            case 2: str = "Paused video "; break;
                            case 3: str = "Player buffering"; break;
                          }
                          return str + " at " + vp.getCurrentTime() + " seconds";
                        }
                      
                                        )) ? FM.callExternal(
                                            
                        function(){
                          var vp = (typeof YT != 'undefined') ? YT.get("tcChat_ytplayer") : inqFrame.frameElement.contentWindow.YT.get("tcChat_ytplayer"), str;
                          switch(vp.getPlayerState()){
                            case -1: return "Player unstarted";
                            case 0: return "Video has ended.";
                            case 1: str = "Playing video"; break;
                            case 2: str = "Paused video "; break;
                            case 3: str = "Player buffering"; break;
                          }
                          return str + " at " + vp.getCurrentTime() + " seconds";
                        }
                      
                                        ).toString() : "")),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:10030,
				
				name:"LoadVideo1",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"LoadVideo1"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                         \n              inqFrame.frameElement.contentWindow.YT.get(\"tcChat_ytplayer\").loadVideoById(\"m9xXAlEaB5Y\"); \n              if(inqFrame.frameElement.contentDocument.getElementById(\"videoFrame\").style.display == \"none\"){\n                inqFrame.com.inq.flash.client.control.XFrameWorker.grow(\"videoFrame\");\n              }\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:10031,
				
				name:"LoadVideo2",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"LoadVideo2"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                         \n              inqFrame.frameElement.contentWindow.YT.get(\"tcChat_ytplayer\").loadVideoById(\"2tNfxfZoH1o\");\n              if(inqFrame.frameElement.contentDocument.getElementById(\"videoFrame\").style.display == \"none\"){\n                inqFrame.com.inq.flash.client.control.XFrameWorker.grow(\"videoFrame\");\n              }\n            \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:10035,
				
				name:"BBV2-Load-Mobile-Theme",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*#BBV2.*") != null ? true : false) && ((isDeviceType("Tablet")) || (isDeviceType("Phone"))));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("chatThemeID-Default", rule).setValue(24001833);
				},
                active: true
			}), 
			Rule.create({
				id:10040,
				
				name:"Load-Marketo-Prechat",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onChatShown"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*marketo.*") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n            inqFrame.com.inq.flash.client.control.XFrameWorker.showLayer('marketo');\n          \n                    ")
				},
                active: true
			}), 
			BusinessRule.create({
				id: 20000,
				
				name:"BBV2-O-R-Marketing-C2C",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#BBV2.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:PM.getVar("chatSpecID-Default",rule).getValue(),stId:PM.getVar("scriptTreeID-Default",rule).getValue(), chatTheme:{id:PM.getVar("chatThemeID-Default",rule).getValue()}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 20001,
				
				name:"BBV2-O-P-ProactiveChat",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*proactiveChat.html.*#BBV2.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:PM.getVar("chatSpecID-Default",rule).getValue(),stId:PM.getVar("scriptTreeID-Default",rule).getValue(),igaa:true, chatTheme:{id:PM.getVar("chatThemeID-Default",rule).getValue()}
}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:3000,
				
				name:"Load-BI-Mobile",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (((isDeviceType("Tablet")) || (isDeviceType("Phone"))) && (win.document.URL.match(".*bestinsurance.*") != null ? true : false));
				},
				actionFcn: function(rule, evt){
					
					PM.getVar("chatThemeID-Default", rule).setValue(24001764);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 3001,
				
				name:"BestInsurance",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*bestinsurance.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:PM.getVar("chatSpecID-Default",rule).getValue(), oId:17243587,igaa:true, chatTheme:{id:PM.getVar("chatThemeID-Default",rule).getValue()}
}
}).request();
            ROM.sendDataToAgent(
                CHM.getAgentID(),
                {
                "Customer_Channel": prepareDataToSend("Twitter"),"Comments": prepareDataToSend("Help @bestinsurance! There are way too many options for coverage plans!"),
                agentID:CHM.getAgentID(),
                engagementID:CHM.getChatID()
}
            
            );
				},
                active: true
			}), 
			Rule.create({
				id:10039,
				
				name:"Service-Allocation-Select",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#service-allocation") != null ? true : false);
				},
				actionFcn: function(rule, evt){
					
					if ((PM.getVar("vendorRandInt",rule).getValue() >= 1) && (PM.getVar("vendorRandInt",rule).getValue() <= 30)) {
	
					PM.getVar("vendorRoutingAttr", rule).setValue("VendorA");
					}  else  if ((PM.getVar("vendorRandInt",rule).getValue() >= 31) && (PM.getVar("vendorRandInt",rule).getValue() <= 100)) {
	
					PM.getVar("vendorRoutingAttr", rule).setValue("VendorB");
					}    
					log("Service Allocation Vendor:"+PM.getVar("vendorRoutingAttr",rule).getValue()+" at "+(exists(PM.getVar("vendorRandInt",rule).getValue()) ? PM.getVar("vendorRandInt",rule).getValue().toString() : ""));

					log("Service Allocation Check Availability:: "+"[{name:\"VendorName\",value:\""+PM.getVar("vendorRoutingAttr",rule).getValue()+"\"}]");

						CallRemote.create({
							doCallbackActions: function(data){
								
					if (((exists(data.inHOP) ? data.inHOP.toString() : "").equals("true", false)) && ((exists(data.status) ? data.status.toString() : "").equals("online", true)) && ((exists(data.availability) ? data.availability.toString() : "").equals("true", false))) {
	
					log("Service Allocation Availability Check: AVAILABLE - "+PM.getVar("vendorRoutingAttr",rule).getValue());

					EVM.fireCustomEvent('loadVendor', rule, evt,
						function() {
							return {};
						}
					);
					}   else {
	
					log("Service Allocation Availability Check: NOT AVAILABLE - "+PM.getVar("vendorRoutingAttr",rule).getValue());

					EVM.fireCustomEvent('loadFallbackVendor', rule, evt,
						function() {
							return {};
						}
					);
					}
							}
						}).callRemote(
							urls.agentsAvailabilityCheckURL,
							{"siteID": prepareDataToSend(10003715),"buID": prepareDataToSend(13000508),"agID": prepareDataToSend(10004026),"agentAttributes": prepareDataToSend("[{name:\"VendorName\",value:\""+PM.getVar("vendorRoutingAttr",rule).getValue()+"\"}]")}
						);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2139,
				
				name:"BB-Service-Allocations-Vendor",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"loadVendor"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return [{name: 'VendorName', value: encodeURIComponent(PM.getVar("vendorRoutingAttr",rule).getValue())}]},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					log("Service Allocation Event Fired: Selected Vendor");

					VAM.add({"vendorRoutingAttribute":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set(PM.getVar("vendorRoutingAttr",rule).getValue(), true))},"mutuallyExclusive":false}, -1);
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2140,
				
				name:"BB-Service-Allocations-Fallback",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"on"+"loadFallbackVendor"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getAgID:function(){return PM.getVar("fallbackVendorAG",rule).getValue();},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					log("Service Allocation Event Fired: Fallback Vendor");

					VAM.add({"vendorRoutingAttribute":{"values":MixIns.unmixMutatable(MixIns.mixMutatable().set(PM.getVar("vendorRoutingAttr",rule).getValue(), true))},"mutuallyExclusive":false}, -1);
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871}
}).request();
				},
                active: true
			}), 
			Rule.create({
				id:2142,
				
				name:"BB-SP-onXFrameLoaded",
				vars:[],
                triggersFcn:function(rule) {return [{id:"on"+"XframeLoaded"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					processReceivedExternalDataThrows("\n                        \n        window.acif_xframe_loaded = new Date().getTime();\n      \n                    ")
				},
                active: true
			}), 
			Rule.create({
				id:2143,
				
				name:"BB-SP-ACIF_Testing-C2C_Clicked",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onC2CClicked"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					if ("BB-SP-R-Consumer_Routing_Guide-xtestx".equals((exists(evt.rule.name) ? evt.rule.name.toString() : ""), false)) {
	processReceivedExternalDataThrows("\n                                    \n            window.acif_c2c_clicked = new Date().getTime();\n          \n                                ")
					}  
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2192,
				
				name:"BB-virtual-agent",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((win.document.URL.match(".*#[T|t]ouch[A|a]ssist") != null ? true : false) && (!(win.document.URL.match(".*#[T|t]ouch[A|a]ssist-guide") != null ? true : false)));
				},
				actionFcn: function(rule,evt){
					
					log("Virtual Agent Firing.");

					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, c2cTheme:{id:33000980}
, chatSpec:{id:18000871, aId:"18000492", chatTheme:{id:24001806}
}
,	igaa:true
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2193,
				
				name:"BB-virtual-agent-proactive",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*#[T|t]ouch[A|a]ssist-proactive") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					log("Virtual Agent Firing.");

					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, aId:"18000492", chatTheme:{id:24001806}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2145,
				
				name:"BB-SP-P-Routing_Guide",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)?routing-guide(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1, aspecData:{ "acif_id":183,  "name":"Demo Routing Guide",  "sub_type":"routing",  "acif_version":"2.10.0"},igaa:true, ignHOP:true, chatTheme:{id:24001780}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2146,
				
				name:"BB-SP-P-Prechat_Survey",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)?prechat-survey(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1, aspecData:{ "acif_id":182,  "name":"Demo Pre-Chat Survey",  "sub_type":"prechat-survey",  "acif_version":"2.10.0"},igaa:true, ignHOP:true, chatTheme:{id:24001780}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2147,
				
				name:"BB-P-ShowReactive-AG_Test",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				agID:10004386,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match("(.*)win1(.*)") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871, chatTheme:{id:24001079}
}

}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2148,
				
				name:"BB-P-ShowProactive-AG_Test",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				agID:10004386,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match("(.*)win2(.*)") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, chatTheme:{id:24001079}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2149,
				
				name:"BB-P-TouchGuide-DTSP-AG_Test",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				agID:10004386,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match("(.*)win3(.*)") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:24001047}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2151,
				
				name:"BB-P-Prechat-DTSP-AG_Test",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				agID:10004386,
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match("(.*)win4(.*)") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871,igaa:true, chatTheme:{id:24001208}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2152,
				
				name:"BB-P-ACIF-Prechat-DTSP-AG_Test",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((isDeviceType("Phone")) && (win.document.URL.match("(.*)win5(.*)") != null ? true : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:18000871, oId:-1, aspecData:{ "acif_id":182,  "name":"Demo Pre-Chat Survey",  "sub_type":"prechat-survey",  "acif_version":"2.10.0"},igaa:true, ignHOP:true, chatTheme:{id:24001780}
}
}).request();
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2222,
				
				name:"guide-test",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match(".*guide-test.*") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					processReceivedExternalDataThrows("\n                        \n              console.log('[Timer] Rule started launching: ', Date.now());\n            \n                    ")
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:19000531, chatSpec:{id:18000871,stId:PM.getVar("scriptTreeID",rule).getValue(),igaa:true, chatTheme:{id:21000399}
}

}; } , false);processReceivedExternalDataThrows("\n                        \n              console.log('[Timer] Rule finished launching: ', Date.now());\n            \n                    ")
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2223,
				
				name:"TMO-Animation_Demo-xTESTx",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (win.document.URL.match("(.*)?tmo-demo(.*)") != null ? true : false);
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:29001414, oId:-1, aspecData:{ "acif_id":2001,  "name":"T-Mobile Animation Demo",  "sub_type":"prechat",  "acif_version":"2.12.4"},igaa:true, ignHOP:true, chatTheme:{id:24001908}
}
}).request();
				},
                active: true
			})
]
                )
            };
        },
        {/*landingData*/
            pages: {
			
				21205228: {id:21205228, mID:"BB-O-Homepage", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/index.html(.*)|(.*)demo(.*)\.(touchcommerce|inq)\.com\/|(.*)demo(.*)\.(touchcommerce|inq)\.com", sup:false}
,
				21205229: {id:21205229, mID:"BB-O-Shop", re:"(.*)demo(.*)\/shop\.html(.*)", sup:false}
,
				21205230: {id:21205230, mID:"BB-O-ChoosePhone", re:"(.*)demo(.*)\/choose_phones\.html(.*)", sup:false}
,
				21205231: {id:21205231, mID:"BB-O-Phone-Atrix2", re:"(.*)demo(.*)\/phonedetail_atrix2\.html(.*)", sup:false}
,
				21205232: {id:21205232, mID:"BB-O-Phone-SharpFXPlus", re:"(.*)demo(.*)\/phonedetail_fx\.html(.*)", sup:false}
,
				21205233: {id:21205233, mID:"BB-O-Phone-Galaxy", re:"(.*)demo(.*)\/phonedetail_galaxy\.html(.*)", sup:false}
,
				21205234: {id:21205234, mID:"BB-O-Phone-GU295", re:"(.*)demo(.*)\/phonedetail_gu295\.html(.*)", sup:false}
,
				21205235: {id:21205235, mID:"BB-O-Phone-iPhone4S", re:"(.*)demo(.*)\/phonedetail_iphone4s\.html(.*)", sup:false}
,
				21205236: {id:21205236, mID:"BB-O-Phone-Lumina900", re:"(.*)demo(.*)\/phonedetail_lumina\.html(.*)", sup:false}
,
				21205237: {id:21205237, mID:"BB-O-ChoosePlan", re:"(.*)demo(.*)\/choose_plan\.html(.*)", sup:false}
,
				21205238: {id:21205238, mID:"BB-O-ChooseAccessories", re:"(.*)demo(.*)\/choose_accessories\.html(.*)", sup:false}
,
				21205239: {id:21205239, mID:"BB-I-ReviewOrder", re:"(.*)demo(.*)\/shop_buy\.html(.*)", sup:false}
,
				21205240: {id:21205240, mID:"SpecialOffers-BB-O", re:"(.*)demo(.*)\/offers\.html(.*)", sup:false}
,
				21205241: {id:21205241, mID:"BB-O-Support", re:"(.*)demo(.*)\/support\.html(.*)", sup:false}
,
				21205242: {id:21205242, mID:"BB-O-SearchResults", re:"(.*)demo(.*)\/support_results\.html(.*)", sup:false}
,
				21205243: {id:21205243, mID:"BB-O-MyAccount", re:"(.*)demo(.*)\/account\.html(.*)", sup:false}
,
				21205244: {id:21205244, mID:"BB-O-MyAccount-Create", re:"(.*)demo(.*)\/account_create\.html(.*)", sup:false}
,
				21205245: {id:21205245, mID:"BB-O-MyAccount-CreationSuccessful", re:"(.*)demo(.*)\/account_success\.html(.*)", sup:false}
,
				21205246: {id:21205246, mID:"BB-O-MyAccount-EnrollBillPay", re:"(.*)demo(.*)\/account_enroll\.html(.*)", sup:false}
,
				21205247: {id:21205247, mID:"BB-O-MyAccount-EnrollmentSuccessful", re:"(.*)demo(.*)\/enroll_thanks\.html(.*)", sup:false}
,
				21205248: {id:21205248, mID:"BB-I-Cart", re:"(.*)demo(.*)\/cart\.html(.*)", sup:false}
,
				21205249: {id:21205249, mID:"BB-I-OrderConfirmation", re:"(.*)demo(.*)\/shop_thanks\.html(.*)", sup:false}
,
				23205341: {id:23205341, mID:"BB-I-Cart-iPhoneOnly", re:"(.*)demo(.*)\/cart_iphone\.html(.*)", sup:false}
,
				35206134: {id:35206134, mID:"BB-DirecTV-Modal", re:"(.*)modal.html(.*)", sup:false}
,
				36206813: {id:36206813, mID:"BB-Payment", re:"(.*)demo(.*)payment.html(.*)", sup:false}
,
				36207112: {id:36207112, mID:"BB-Test", re:"(.*)demo(.*)test\.html(.*)", sup:false}
,
				36207655: {id:36207655, mID:"BB-SP-O-SolutionsPlanning_Demos", re:".*com\/sp.*", sup:true}
,
				36208082: {id:36208082, mID:"BB-NewCI-Page", re:"(.*)newCI(.*)", sup:true}
,
				36216353: {id:36216353, mID:"BBank-home", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-home\.html(.*)", sup:false}
,
				36216354: {id:36216354, mID:"BBank-banking", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-banking\.html(.*)", sup:false}
,
				36216355: {id:36216355, mID:"BBank-cc", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-credit_cards\.html(.*)", sup:false}
,
				36216356: {id:36216356, mID:"BBank-loans", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-loans\.html(.*)", sup:false}
,
				36216357: {id:36216357, mID:"BBank-small_business", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-small_business\.html(.*)", sup:false}
,
				36216358: {id:36216358, mID:"BBank-investments", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-investments\.html(.*)", sup:false}
,
				36216359: {id:36216359, mID:"BBank-contact", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-contact_us\.html(.*)", sup:false}
,
				36216410: {id:36216410, mID:"BBank-Mobile-signin", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-mobile1\.html(.*)", sup:false}
,
				36216411: {id:36216411, mID:"BBank-Mobile-password", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-mobile2\.html(.*)", sup:false}
,
				36216412: {id:36216412, mID:"BBank-Mobile-accounts", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-mobile3\.html(.*)", sup:false}
,
				36216413: {id:36216413, mID:"BBank-Mobile-deposit", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-mobile4\.html(.*)", sup:false}
,
				36216434: {id:36216434, mID:"BBank-search", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/search\.html(.*)", sup:false}
,
				36216435: {id:36216435, mID:"BBank-travel", re:"(.*)demo(.*)\.(touchcommerce|inq)\.com\/bestbank\/bbank-travel_notice\.html(.*)", sup:false}
,
				36216479: {id:36216479, mID:"BB-EmbeddedPrechat", re:".*embeddedPrechat\.html.*", sup:false}
,
				36219481: {id:36219481, mID:"BB-Untagged", re:"", sup:false}
,
				36342883: {id:36342883, mID:"BB-MobilePage", re:".*demo.*\/m\/.*", sup:false}
,
				36503886: {id:36503886, mID:"BB-TMobile-ContactUs-Phone", re:".*tmobile\.html.*", sup:false}

},
            qsize: 10,
            contentGroups: {
			"TestContentGroup": [[36207112], [], function isIncludedURL(url) {return false }, [], [], function isExcludedURL(url) {return false }],
			"BBank-content": [[36216353, 36216354, 36216357, 36216358], [], function isIncludedURL(url) {return false }, [], [], function isExcludedURL(url) {return false }],
			"SH-Test": [[], [], function isIncludedURL(url) {return false || url.contains("puckhog.ca", false, true) }, [], [], function isExcludedURL(url) {return false }]}
        }
);