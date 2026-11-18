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

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const writeFile = require('./lib/install.js');
const adapterName = require('./package.json').name.split('.').pop();
const path = require('node:path');

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
    const file = path.join(utils.controllerDir, 'iobroker.js');

    const child = require('node:child_process').spawn('node', [file, 'upload', adapter.name, 'widgets']);
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
                adapter.log.info('Changes in widgets/google-fonts.html detected => restart vis/vis-2');
                try {
                    for (const name of ['vis', 'vis-2']) {
                        const instances = await adapter.getObjectViewAsync('system', 'instance', {
                            startkey: `system.adapter.${name}.`,
                            endkey: `system.adapter.${name}.香`,
                        });
                        for (const row of instances.rows) {
                            if (row.value && row.value.common && row.value.common.enabled) {
                                // rewrite the object to trigger the restart of the instance
                                await adapter.extendForeignObjectAsync(row.id, {});
                            }
                        }
                    }
                } catch (e) {
                    adapter.log.error(`Cannot restart vis/vis-2: ${e}`);
                }
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
