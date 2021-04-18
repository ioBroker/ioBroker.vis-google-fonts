/**
 *
 *      ioBroker vis-google-fonts Adapter
 *
 *      Copyright 2015 bluefox<dogafox@gmail.com>
 *
 *      OFL License
 *
 */
/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var utils = require('@iobroker/adapter-core'); // Get common adapter utils
var adapter   = utils.Adapter('vis-google-fonts-test');
var writeFile = require(__dirname + '/lib/install.js');

adapter.on('ready', function () {
    checkFiles();
});

function upload(callback) {
    adapter.log.info('Upload ' + adapter.name + ' anew, while changes detected...');
    var file = utils.controllerDir + '/lib/setup.js';

    var child = require('child_process').spawn('node', [file, 'upload', adapter.name, 'widgets']);
    var count = 0;
    child.stdout.on('data', function (data) {
        count++;
        adapter.log.debug(data.toString().replace('\n', ''));
        if ((count % 100) === 0) adapter.log.info(count + ' files uploaded...');
    });
    child.stderr.on('data', function (data) {
        adapter.log.error(data.toString().replace('\n', ''));
    });
    child.on('exit', function (exitCode) {
        adapter.log.info('Uploaded.');
        callback(exitCode);
    });
}

// Update google-fonts.html
function checkFiles(callback) {
    writeFile(adapter, function (changed) {
        if (changed) {
            upload(function () {
                adapter.log.info('Changes in widgets/google-fonts.html detected => restart vis');
                adapter.getForeignObject('system.adapter.vis.0', function (err, obj) {
                    adapter.setForeignObject('system.adapter.vis.0', obj, function () {
                        adapter.stop();
                    });
                });
            });
        } else {
            adapter.stop();
        }
    });
}
