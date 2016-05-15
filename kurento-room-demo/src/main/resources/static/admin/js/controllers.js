var phonecatApp = angular.module('KmsMonitorApp', []);

phonecatApp.controller('KmsListCtrl', function ($scope, $http) {
	$scope.numOfServers = 3;
	$scope.srvDetail = "Kurento Servers";

    var CLASS_GREEN = "panel-green";
    var CLASS_YELLOW = "panel-yellow";
    var CLASS_RED = "panel-red";

	$http.get("/getKmsReport").success(function (ajaxData) {
		var kmsObj = {};
		var kmsArray = [];
		var i;
		for(i = 0; i< ajaxData.length; i++){
		    kmsObj = {};

		    kmsObj.class = CLASS_RED;
		    if(ajaxData[i].load) {
		        kmsObj.numOfCons = ajaxData[i].load;
		        if((ajaxData[i].load * 1000) < 100) {
		            kmsObj.class = CLASS_GREEN;
		        } else if ((ajaxData[i].load * 1000) < 250) {
		            kmsObj.class = CLASS_YELLOW;
		        }
		    } else {
		        kmsObj.numOfCons = 1;
		    }

		    kmsObj.id = ajaxData[i].wsurl;

		    kmsArray.push(kmsObj);
		}

		$scope.kmss = kmsArray;

	}).error(function() {
		alert("an unexpected error occurred while getting call counter!")
	});


    /**
     *
     */
	$http.get("/getRoomReport").success(function (ajaxData) {
//	{"startTimePoint":{"monthValue":5,"year":2016,"hour":19,"minute":6,"second":32,"dayOfMonth":14,"dayOfWeek":"SATURDAY","dayOfYear":135,"month":"MAY","nano":108000000,"chronology":{"id":"ISO","calendarType":"iso8601"}},"endTimePoint":null,"roomId":"qroom","agentId":"l1","kmsId":"677f6cfa-e3b2-488d-b993-95dca79e72eb"}]
		$scope.rooms = ajaxData;

	}).error(function() {
		alert("an unexpected error occurred while getting call counter!")
	});



    $http.get("../testdata/callcount.js").success(function (ajaxdata) {
        Morris.Bar({
            element: "morris-bar-chart",
            data: ajaxdata,
            xkey: 'hr',
            ykeys: ["ac", "vc"],
            labels: ["Audio Call", "Video Call"],
            hideHover: "auto",
            resize: true
        });
    }).error(function() {
        alert("an unexpected error occurred while getting call counter!")
    });

});
