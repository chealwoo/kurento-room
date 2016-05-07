/**
 * lcov reporter for QUnit v1.0.0
 *
 * https://github.com/piranna/qunit-reporter-lcov
 *
 * Copyright 2015 Jesús Leganés Combarro "piranna" <piranna@gmail.com
 * Released under the MIT license.
 *
 * Based on qunit-reporter-junit & nodeunit lcov reporter
 */
(function() {

	'use strict';

	// Gets called when a report is generated.
	QUnit.lcovReport = function(/* data */) {
		// Override me!
	};


	QUnit.done(function() {
		var lcov = '';

		var cov = (typeof global !== 'undefined' ? global : window)._$jscoverage || {};

		Object.keys(cov).forEach(function (filename) {
			var data = cov[filename];
			lcov += reportFile(filename, data);
		});

		// Invoke the user-defined callback
		QUnit.lcovReport({
			cov: cov,
			lcov: lcov
		});
	});

	function reportFile(filename, data) {
		var result = '';

		result += 'SF:' + filename + '\n';

		data.source.forEach(function(line, num) {
			// increase the line number, as JS arrays are zero-based
			num++;

			if (data[num] !== undefined) {
				result += 'DA:' + num + ',' + data[num] + '\n';
			}
		});

		result += 'end_of_record\n';

		return result;
	}

})();
