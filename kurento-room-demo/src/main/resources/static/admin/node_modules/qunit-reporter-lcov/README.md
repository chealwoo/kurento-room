# lcov reporter for QUnit
[![Build Status](https://travis-ci.org/piranna/qunit-reporter-lcov.svg?branch=master)](https://travis-ci.org/piranna/qunit-reporter-lcov)
[![NPM version](https://badge.fury.io/js/qunit-reporter-lcov.svg)](http://badge.fury.io/js/qunit-reporter-lcov)
[![bitHound Score](https://www.bithound.io/github/piranna/qunit-reporter-lcov/badges/score.svg?)](https://www.bithound.io/github/piranna/qunit-reporter-lcov)

A QUnit plugin that produces lcov test reports (e.g. for integration into build
tools like Jenkins).

Based on
[qunit-report-jUnit](https://github.com/JamesMGreene/qunit-reporter-junit) &
[Nodeunit lcov reporter](https://github.com/caolan/nodeunit/blob/master/lib/reporters/lcov.js)

## Usage

Include the plugin script after QUnit itself, then implement the `lcovReport`
hook to do something with the lcov string (e.g. upload it to a server):

```js
QUnit.lcovReport = function(report) {
	console.log(report.lcov);
};
```

## Notes

If you're using Grunt, you should take a look
[grunt-contrib-qunit](https://github.com/gruntjs/grunt-contrib-qunit).
