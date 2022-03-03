/**
 *
 *      ioBroker vis-google-fonts Adapter
 *
 *      Copyright 2015-2022 bluefox<dogafox@gmail.com>
 *
 *      OFL License
 *
 */
/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils       = require('@iobroker/adapter-core'); // Get common adapter utils
const writeFile   = require('./lib/install.js');
const adapterName = require('./package.json').name.split('.').pop();

let adapter;

function startAdapter(options) {
    options = options || {};

    Object.assign(options, {
        name: adapterName,
        ready: () => checkFiles()
    });

    adapter = new utils.Adapter(options);

    return adapter;
}

function upload(callback) {
    adapter.log.info(`Upload ${adapter.name} anew, while changes detected...`);
    const file = utils.controllerDir + '/lib/setup.js';

    const child = require('child_process').spawn('node', [file, 'upload', adapter.name, 'widgets']);
    let count = 0;

    child.stdout.on('data', data => {
        count++;
        adapter.log.debug(data.toString().replace('\n', ''));
        if ((count % 100) === 0) {
            adapter.log.info(count + ' files uploaded...');
        }
    });

    child.stderr.on('data', data =>
        adapter.log.error(data.toString().replace('\n', '')));

    child.on('exit', exitCode => {
        adapter.log.info('Uploaded.');
        callback(exitCode);
    });
}

// Update google-fonts.html
function checkFiles() {
    writeFile(adapter, changed => {
        if (changed) {
            upload(async () => {
                adapter.log.info('Changes in widgets/google-fonts.html detected => restart vis');
                const obj = await adapter.getForeignObjectAsync('system.adapter.vis.0');
                await adapter.getForeignObjectAsync('system.adapter.vis.0', obj);
                adapter.stop();
            });
        } else {
            adapter.stop();
        }
    });
}

// If started as allInOne mode => return function to create instance
// @ts-ignore
if (module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
