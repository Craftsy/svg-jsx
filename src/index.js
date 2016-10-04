#!/usr/bin/env node
import fs from 'fs';
import svgToReact from './svg-to-react';

function fileExists(filepath) {
    try {
        const stats = fs.statSync(filepath);
        return stats.isFile();
    } catch (e) {
        return false;
    }
}

const argv = require('yargs')
    .usage('Usage: $0 <input file> <ouput file> [--prop className] [--prop otherAttribute]')
    .demand(2)
    .help('h')
    .alias('h', 'help')
    .argv;

const [inputFilename, outputFilename] = argv._;
let props = argv.prop;
if (props != null && !Array.isArray(props)) {
    props = [props];
}

// Ensure input file exists
if (!fileExists(inputFilename)) {
    process.exit(9);
}

const inputSource = fs.readFileSync(inputFilename).toString()
    .replace(/\<style[\s\S]*?\<\/style\>/gi, '') // remove style tags
    ;

svgToReact.convertFileSource(
    inputSource,
    (err, output) => {
        const componentSource = '/*eslint-disable*/\n' + output;
        fs.writeFileSync(outputFilename, componentSource);
    },
    {customProperties: props}
);
