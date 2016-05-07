var phonecatApp = angular.module('phonecatApp', []);

phonecatApp.controller('PhoneListCtrl', function ($scope) {
	$scope.numOfServers = 3;
	$scope.srvDetail = "Kurento Servers";

	$scope.kmss = [
		{   'class': 'panel-primary',
			'id': 'KMS-01',
			'numOfCons': '5'},
		{   'class': 'panel-green',
			'id': 'KMS-02',
			'numOfCons': '7'},
		{   'class': 'panel-red',
			'id': 'KMS-03',
			'numOfCons': '10'}
	];

	$scope.phones = [
		{'name': 'Nexus S',
			'snippet': 'Fast just got faster with Nexus S.'},
		{'name': 'Motorola XOOM™ with Wi-Fi',
			'snippet': 'The Next, Next Generation tablet.'},
		{'name': 'MOTOROLA XOOM™',
			'snippet': 'The Next, Next Generation tablet.'}
	];
});
