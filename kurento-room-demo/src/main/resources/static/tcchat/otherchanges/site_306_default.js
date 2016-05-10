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

    siteAgentGroups["10004091"] = "Frontier-Ecomm";



            return {
                siteID:306,
                messages: messages,
                siteAgentGroups: siteAgentGroups,
                psHosturlList:"http://tc.touchcommerce.com/inqChat.html",
                productionFilter:"",
                vanityDomainName: "https://homev3.inq.com",
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
                rootDomain:"touchcommerce.com",
                c2cToPersistent:false,
                hostedFileURL:"/TouchCommercetop.html",
                fileTransferSize:"5",
                defaultAgentGroup:0,
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
			
				2: {id:2, name:"test" ,x:0, y:0, w:30, h:30, altURL:"http://www.keysurvey.com/survey/267053/e7f8/?LQID=1&&surveyID=267053"}
}},
                mediaMgrData:function(){
                    return {
                        chatThemes:{
				2: {
					id:2,
					an:"TouchCommerce",
					fn:"TouchCommerce-icons_V1.zip",
					name:"Chat Theme-A",
					tbh:Number("55"),
					ciw:Number("30"),
					cih:Number("30"),
					d:true,
					cn:"You",
					dw:Number("440"),
					dh:Number("245"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("350"),
					pw:Number("420")
				},
				42: {
					id:42,
					an:"Jessica",
					fn:"",
					name:"Call Theme",
					tbh:Number("55"),
					ciw:Number("30"),
					cih:Number("30"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("245"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"TRANSPARENT",
					px:Number("0"),
					py:Number("0"),
					ph:Number("300"),
					pw:Number("500")
				},
				1000: {
					id:1000,
					an:"Jessica",
					fn:"Classic.mxml",
					name:"Classic",
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
				1005: {
					id:1005,
					an:"Jessica",
					fn:"modern.mxml",
					name:"modern",
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
				24001504: {
					id:24001504,
					an:"Jessica",
					fn:"24001504.zip",
					name:"test",
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
				24001569: {
					id:24001569,
					an:"Jessica",
					fn:"24001569.zip",
					name:"asdfasdf",
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
				24001570: {
					id:24001570,
					an:"Jessica",
					fn:"24001570.zip",
					name:"23453452345",
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
				24001594: {
					id:24001594,
					an:"not used",
					fn:"StraightTalk-Common-Assets.zip",
					name:"Tracfone_CommonAssets",
					tbh:Number("0"),
					ciw:Number("0"),
					cih:Number("0"),
					d:false,
					cn:"non",
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
				24001605: {
					id:24001605,
					an:"Jessica",
					fn:"24001605.zip",
					name:"test-orange",
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
				24001606: {
					id:24001606,
					an:"Jessica",
					fn:"24001606.zip",
					name:"test-orange2",
					tbh:Number("100"),
					ciw:Number("160"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("550"),
					dh:Number("450"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001608: {
					id:24001608,
					an:"Jessica",
					fn:"24001608.zip",
					name:"hhkjhkjhkj",
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
				24001609: {
					id:24001609,
					an:"Jessica",
					fn:"24001609.zip",
					name:"dsafdsfasdfqwq4353q45qrefasfd",
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
				24001649: {
					id:24001649,
					an:"Jessica",
					fn:"24001649.zip",
					name:"howard",
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
				24001650: {
					id:24001650,
					an:"Jessica",
					fn:"24001650.zip",
					name:"modern",
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
				24001738: {
					id:24001738,
					an:"Jessica",
					fn:"24001738.zip",
					name:"testk",
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
				24001802: {
					id:24001802,
					an:"Jessica",
					fn:"24001802.zip",
					name:"test29",
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
				24001803: {
					id:24001803,
					an:"Jessica",
					fn:"24001803.zip",
					name:"test30",
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
				24001824: {
					id:24001824,
					an:"Jessica",
					fn:"24001824.zip",
					name:"sdcds",
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
				24001825: {
					id:24001825,
					an:"Jessica",
					fn:"24001825.zip",
					name:"dfcdc",
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
				24001830: {
					id:24001830,
					an:"Jessica",
					fn:"24001830.zip",
					name:"ttt",
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
				24001831: {
					id:24001831,
					an:"Jessica",
					fn:"24001831.zip",
					name:"ttt",
					tbh:Number("100"),
					ciw:Number("237"),
					cih:Number("60"),
					d:true,
					cn:"You",
					dw:Number("500"),
					dh:Number("320"),
					pos:"CENTER",
					lx:Number("0"),
					ly:Number("0"),
					wm:"NONE",
					px:Number("0"),
					py:Number("0"),
					ph:Number("0"),
					pw:Number("0")
				},
				24001901: {
					id:24001901,
					an:"Jessica",
					fn:"24001901.zip",
					name:"sas",
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
				}
			},
                        chatSpecs:{
				2: {
					id:2,
					name:"Chat Spec-A",
					oId:200146, // opener id
					stId:200023, // script tree id
					ctId:2,  // chat theme id
					ael:"", // agent exit line
					svySpId:2
				},
				170: {
					id:170,
					name:"TC_click2call",
					oId:200467, // opener id
					stId:200023, // script tree id
					ctId:42,  // chat theme id
					ael:""
				},
				25000885: {
					id:25000885,
					name:"TestChatSpec-1",
					oId:202862, // opener id
					stId:200023, // script tree id
					ctId:42,  // chat theme id
					ael:null, // agent exit line
					svySpId:2,
					emSpId:2000006
				}
			},
                        c2cSpecs:{
				2: {
					id:2,
					name:"C2C Spec-A",
					igaa:false, 
					
					thId:2,
					chSpId:2,
					peId:"inqC2CImgContainer"
				},
				84: {
					id:84,
					name:"TC_click2call",
					igaa:false, 
					
					thId:2,
					chSpId:170,
					peId:"inqC2CImgContainer"
				},
				30000946: {
					id:30000946,
					name:"C2C Spec Care",
					igaa:true, 
					
					thId:33000853,
					chSpId:2,
					peId:"inqC2CImgContainer"
				}
			},
                        c2cThemes:{
				2: {
					id:2,
					name:"C2C Theme-A",
					r:"TC_C2C_Available.gif",
					b:"TC_C2C_Available_disabled.gif",
					ah:"TC_C2C_Available_disabled.gif",
					d:"TC_C2C_Available_disabled.gif",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				32000478: {
					id:32000478,
					name:"injectblank",
					r:"blank.png",
					b:"blank.png",
					ah:"blank.png",
					d:"blank.png",
                    ralt:"Click to Chat Button",
                    balt:"All agents are busy, try chat again in few minutes",
                    ahalt:"Chat is offered during business hours",
                    dalt:"Chat Service is currently disabled",
					renderAsHTML:false
				},
				33000853: {
					id:33000853,
					name:"C2C Care",
					r:"c2c_RM_UnityMediaCare.png",
					b:"blank.png",
					ah:"blank.png",
					d:"blank.png",
                    ralt:"",
                    balt:"",
                    ahalt:"",
                    dalt:"",
					renderAsHTML:false
				}
			}
                    };
                },
				queueMessagingSpecs: {
				1: {
					name:"test1",
					aom:"offline", // agent offline message
					aori:2, // agent offline repeat interval
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
						}
					]
				},
				2: {
					name:"testagent",
					aom:"wfe", // agent offline message
					aori:99, // agent offline repeat interval
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
							ewt:200, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"jnjb", // message text
									dt:1, // display times
									ris:10 // repeat interval seconds
								}
							]
						}
					]
				},
				3: {
					name:"kqms1",
					aom:"offline", // agent offline message
					aori:2, // agent offline repeat interval
					qms: [/* queue messaging sets */
						{
							ewt:600, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"message1", // message text
									dt:2, // display times
									ris:2 // repeat interval seconds
								}
							]
						},
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
						}
					]
				},
				4: {
					name:"Test",
					aom:"Test2", // agent offline message
					aori:4, // agent offline repeat interval
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
							ewt:4, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"Hello", // message text
									dt:2, // display times
									ris:2 // repeat interval seconds
								}
							]
						}
					]
				},
				7: {
					name:"testing",
					aom:"Sorry will be back", // agent offline message
					aori:10, // agent offline repeat interval
					qms: [/* queue messaging sets */
						{
							ewt:100, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"Hi there", // message text
									dt:1, // display times
									ris:100 // repeat interval seconds
								}
							]
						},
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
						}
					]
				},
				8: {
					name:"agentdefault",
					aom:"Sorry will be back in 5", // agent offline message
					aori:10, // agent offline repeat interval
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
						}
					]
				},
				9: {
					name:"agent",
					aom:"sorry", // agent offline message
					aori:11, // agent offline repeat interval
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
						}
					]
				},
				10: {
					name:"testagent2",
					aom:"hi", // agent offline message
					aori:10, // agent offline repeat interval
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
							ewt:2, // EWT remaining in seconds
							qm: [/* queue messages */
								{
									mo:1, // message order
									mt:"hi", // message text
									dt:10, // display times
									ris:100 // repeat interval seconds
								},
								{
									mo:2, // message order
									mt:"hi", // message text
									dt:789, // display times
									ris:1 // repeat interval seconds
								}
							]
						}
					]
				}
			},
                xmlData:{
                    businessSchedules:function(){return {};},
                    dfvs:function(){return {};}
                },
                displayTYImage:false,
                c2cMgrData:function(){return {adaCompliant:false, adaAndroidC2cSupportDomains:null}},
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
                businessConstants:function() {return {}},
                businessCustomEvents:function() {return []},
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
       
]),
                        isEmbeddedResource: function(url, markerID){
var isMarkerMatch = true;

    return false;
},
                        bannerText:''
                    }
                },
                vamAttributes:{programVisitorAttributes: {"vis_attr_incr_val":{"values":{},"mutuallyExclusive":true}
},businessVisitorAttributes: {} },
                businessVars:function() {return [];},
                timezoneID:'America/Los_Angeles',
                frameworkCanRun: function( deviceType, _3pcSupported, _1pcSupported, xdActive ){
                    
                    if ( _1pcSupported===false || (xdActive && !_3pcSupported) ) {
                        return false;
                    }
                    return true;
                },
                c2cPageElementIDs: function(){
                    return {
                        "2":"inqC2CImgContainer"
                        , 
                        "84":"inqC2CImgContainer"
                        , 
                        "30000946":"inqC2CImgContainer"
                        
                        
                    };
                },
                getDefaultBusinessUnitID: function (){
                    return 22;
                },
                v3framesrc: "/TouchCommercetop.html",
                multiHost: false
            };
        }, function(programRulesData) {
            return 	{
                rules:programRulesData
                        .append(
                        []
                ).append(
                        [
			Rule.create({
				id:400,
				
				name:"MobileSuppression",
				vars:[],
                triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule, evt){
					
					log("Overriding Mobile Suppression");

				},
                active: true
			}), 
			BusinessRule.create({
				id: 1,
				
				name:"Click2Chat Rule 1",
                ruleType:"C2C",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding"} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return (true);
				},
				actionFcn: function(rule,evt){
					
					C2CM.request(rule, CHM.CHAT_TYPES.C2C, function(rule){ return {id:2
}; } , false);
				},
                active: true
			}), 
			BusinessRule.create({
				id: 2,
				
				name:"TC Solutions 5 Second Proactive Rule",
                ruleType:"POPUP",
				funnelLevel:5,
				vars:[],
				triggersFcn:function(rule) {return [{id:"onPageLanding", delayInMS:5000} ]},
                getQueueThreshold:function(){return ;},
				getAAtts: function(){return []},
				getRAtts: function (){return []},
				
				conditionalFcn: function(rule,evt){
					return ((LDM.getPageMarker() ? LDM.getPageMarker().startsWith("TC_SOL_", true) : false));
				},
				actionFcn: function(rule,evt){
					
					ServiceLauncher.c({rule:rule, chatType:CHM.CHAT_TYPES.POPUP , chatSpec:{id:2}
}).request();
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
//						"https://bestbrands.inq.com/tagserver/kms/css/googleapis-fonts.css",
 "https://ajax.googleapis.com/ajax/libs/angularjs/1.2.7/angular.js",
//"https://bestbrands.inq.com/tagserver/kms/js/angular.min.js",
// "https://bestbrands.inq.com/tagserver/kms/css/jquery-ui.min.css",
"https://bestbrands.inq.com/tagserver/kms/js/adapter.js",
"https://bestbrands.inq.com/tagserver/kms/js/kurento-utils.js",
"https://bestbrands.inq.com/tagserver/kms/js/kurento-jsonrpc.js",
"https://bestbrands.inq.com/tagserver/kms/js/EventEmitter.js",
"https://bestbrands.inq.com/tagserver/kms/js/KurentoRoom.js",
"https://bestbrands.inq.com/tagserver/kms/angular/services/Participants.js",
"https://bestbrands.inq.com/tagserver/kms/js/jquery-2.1.1.min.js",
"https://bestbrands.inq.com/tagserver/kms/js/jquery-ui.min.js"
// "https://bestbrands.inq.com/tagserver/kms/angular/angular-fullscreen.js",
//"https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/velocity.js",
//"https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/moment-with-locales.min.js",
//"https://bestbrands.inq.com/tagserver/kms/angular/lumX/dist/js/lumx.js"
					)
				},
                active: true
			})
]
                )
            };
        },
        {/*landingData*/
            pages: {
			
				200167: {id:200167, mID:"TC_Home", re:"(.*)\/inQdevsite\/index\.php(.*)|(.*)http:\/\/www\.touchcommerce\.com\/", sup:false}
,
				200170: {id:200170, mID:"TC_SOL_Solutions", re:"(.*)\/Solutions\/", sup:false}
,
				200171: {id:200171, mID:"TC_SOL_Sales", re:"(.*)\/Sales\.php", sup:false}
,
				200172: {id:200172, mID:"TC_SOL_Care", re:"(.*)\/Care\.php", sup:false}
,
				200173: {id:200173, mID:"TC_SOL_Marketing", re:"(.*)\/Marketing\.php", sup:false}
,
				200174: {id:200174, mID:"TC_ADV_Advantage", re:"(.*)\/Advantage\/", sup:false}
,
				200175: {id:200175, mID:"TC_ADV_Point_Comparison", re:"(.*)\/COMP\.php", sup:false}
,
				200176: {id:200176, mID:"TC_ADV_Pay_for_Performance", re:"(.*)\/PFP\.php", sup:false}
,
				200178: {id:200178, mID:"TC_ADV_Profiting_and_Targeting", re:"(.*)\/RTPT\.php", sup:false}
,
				200179: {id:200179, mID:"TC_ADV_Program_Information", re:"(.*)\/OGO\.php", sup:false}
,
				200180: {id:200180, mID:"TC_ADV_Expert_Agents", re:"(.*)\/Advantage\/EA\.php", sup:false}
,
				200181: {id:200181, mID:"TC_IND_Industries", re:"(.*)\/Industries\/", sup:false}
,
				200182: {id:200182, mID:"TC_IND_Telecommunications", re:"(.*)\/TELECOMMUNICATIONS\.php", sup:false}
,
				200183: {id:200183, mID:"TC_IND_Financial_Services", re:"(.*)\/FS\.php", sup:false}
,
				200184: {id:200184, mID:"TC_IND_Retail", re:"(.*)\/Retail\.php", sup:false}
,
				200185: {id:200185, mID:"TC_IND_Careers", re:"(.*)\/Careers\/", sup:false}
,
				200187: {id:200187, mID:"TC_CS_Customer_Success", re:"(.*)\/Customer(.*)Success\/", sup:false}
,
				200188: {id:200188, mID:"TC_CS_Video_ATT", re:"(.*)\/att\.php", sup:false}
,
				200190: {id:200190, mID:"TC_CS_Video_Vonage_Canada", re:"(.*)\/vonage\.php", sup:false}
,
				200191: {id:200191, mID:"TC_CS_Video_Forrester", re:"(.*)\/forrester\.php", sup:false}
,
				200192: {id:200192, mID:"TC_NEWS_News", re:"(.*)\/News\/", sup:false}
,
				200200: {id:200200, mID:"TC_NEWS_News_1", re:"(.*)\/1\.php", sup:false}
,
				200201: {id:200201, mID:"TC_NEWS_News_2", re:"(.*)\/2\.php", sup:false}
,
				200202: {id:200202, mID:"TC_NEWS_News_3", re:"(.*)\/3\.php", sup:false}
,
				200204: {id:200204, mID:"TC_NEWS_News_4", re:"(.*)\/4\.php", sup:false}
,
				200205: {id:200205, mID:"TC_NEWS_News_5", re:"(.*)\/5\.php", sup:false}
,
				200206: {id:200206, mID:"TC_NEWS_News_6", re:"(.*)\/6\.php", sup:false}
,
				200208: {id:200208, mID:"TC_NEWS_News_7", re:"(.*)\/7\.php", sup:false}
,
				200209: {id:200209, mID:"TC_NEWS_News_8", re:"(.*)\/8\.php", sup:false}
,
				200210: {id:200210, mID:"TC_NEWS_News_9", re:"(.*)\/9\.php", sup:false}
,
				200211: {id:200211, mID:"TC_About", re:"(.*)\/About\/index\.php(.*)|(.*)\/About\/", sup:false}
,
				200213: {id:200213, mID:"TC_Mission", re:"(.*)\/Mission\.php", sup:false}
,
				200214: {id:200214, mID:"TC_Management", re:"(.*)\/Management\.php", sup:false}
,
				200215: {id:200215, mID:"TC_Board", re:"(.*)\/About\/BOD\.php", sup:false}
,
				200216: {id:200216, mID:"TC_Contact", re:"(.*)\/Contact(.*)", sup:false}
,
				200230: {id:200230, mID:"TC_NEWS_News_10", re:"(.*)\/10\.php", sup:false}
,
				200231: {id:200231, mID:"TC_NEWS_News_11", re:"(.*)\/11\.php", sup:false}
,
				200236: {id:200236, mID:"TC-Persistent", re:"(.*)\/TouchCommercetop\.html", sup:false}
,
				35206159: {id:35206159, mID:"TC-ContactUs_Confirmation", re:"", sup:false}
,
				36208616: {id:36208616, mID:"SOL-Test", re:"(.*)amendsonline-(dl|ch|pr).caci-im.net/((motor|home)/|(motor|home))", sup:true}
,
				36217067: {id:36217067, mID:"BE-GE-BBCR-I_Current-Bills", re:"((.*)business.bell(.*)/bills_payments/currentbills)|((.*)(business|entreprise).bell(.*)/bills_payments/(courant)(.*))", sup:false}
,
				36217068: {id:36217068, mID:"BE-GE-BBCR-I_Past-Bills", re:"(?i)((.*)business.bell(.*)/bills_payments/bills/pastbills)|((.*)(business|entreprise).bell(.*)/bills_payments/factures/passees)", sup:false}
,
				36217069: {id:36217069, mID:"BE-GE-BBCR-I_Schedule-Payments", re:"(?i)((.*)business.bell(.*)/bills_payments/payments/upcomingpayments)|((.*)(business|entreprise).bell(.*)/bills_payments/paiements/a_venir)", sup:false}
,
				36217070: {id:36217070, mID:"BE-GE-BBCR-I_Payment-History", re:"(?i)((.*)business.bell(.*)/bills_payments/payments/paymenthistory)|((.*)(business|entreprise).bell(.*)/bills_payments/paiements/historique)", sup:false}
,
				36219600: {id:36219600, mID:"BE-FR-BCSH-O-TV-Buy-Flow(5)/Proc--dachat-etape-5", re:"DO NOT MATCH", sup:false}
,
				36308541: {id:36308541, mID:"TC-InnovateSummit", re:"(.*)touchcommerce.com\/about-us\/tis2016eu(.*)", sup:false}

},
            qsize: 10,
            contentGroups: {}
        }
);