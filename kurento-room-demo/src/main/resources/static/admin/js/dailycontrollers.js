var phonecatApp = angular.module('phonecatApp', []);

phonecatApp.controller('PhoneListCtrl', function ($scope, $http) {
	$scope.numOfServers = 3;
	$scope.srvDetail = "Kurento Servers";

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

	$('#dataTables-example').DataTable({
		responsive: true
	});

});
