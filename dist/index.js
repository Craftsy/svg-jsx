#!/usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _svgToReact = require('./svg-to-react');

var _svgToReact2 = _interopRequireDefault(_svgToReact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fileExists(filepath) {
    try {
        var stats = _fs2.default.statSync(filepath);
        return stats.isFile();
    } catch (e) {
        return false;
    }
}

var argv = require('yargs').usage('Usage: $0 <input file> <ouput file>').demand(2).help('h').alias('h', 'help').argv;

var _argv$_ = _slicedToArray(argv._, 2);

var inputFilename = _argv$_[0];
var outputFilename = _argv$_[1];

// Ensure input file exists

if (!fileExists(inputFilename)) {
    process.exit(9);
}

var inputSource = _fs2.default.readFileSync(inputFilename).toString().replace(/\<style[\s\S]*?\<\/style\>/gi, '') // remove style tags
;

_svgToReact2.default.convertFileSource(inputSource, function (err, output) {
    var componentSource = '/*eslint-disable*/\n' + output;
    _fs2.default.writeFileSync(outputFilename, componentSource);
});