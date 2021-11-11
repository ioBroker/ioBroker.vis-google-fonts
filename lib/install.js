const fs = require('fs');

const DIR_NAME = 'google-fonts';

function getAllFonts(result, dir) {
    result = result || [];
    dir = dir || `widgets/${DIR_NAME}/`;

    const dirs = fs.readdirSync(`${__dirname}/../${dir}`);
    for (let d = 0; d < dirs.length; d++) {
        const stat = fs.statSync(`${__dirname}/../${dir}${dirs[d]}`);
        if (stat.isDirectory()) {
            getAllFonts(result, dir + dirs[d] + '/');
        } else {
            if (dirs[d].match(/\.ttf$/)) {
                result.push({name: dirs[d].substring(0, dirs[d].length - 4), path: dir + dirs[d]});
            }
        }
    }
    return result;
}

function writeFile(adapter, callback) {
    let index   = fs.readFileSync(`${__dirname}/../widgets/${DIR_NAME}.html`).toString();
    const fonts = getAllFonts();

    let begin = '/* following text generated automatically -- START STYLE--*/';
    let end   = '/* following text generated automatically -- END STYLE--*/';
    let insert = '';
    let insertSample = '<html><head><style>\n';
    let insertSampleHtml = '';
    for (let f = 0; f < fonts.length; f++) {
        insert += '@font-face {\n\tfont-family: ' + fonts[f].name + ';\n\tsrc: url(' + fonts[f].path + ');\n}\n';
        insertSample += '@font-face {\n\tfont-family: ' + fonts[f].name + ';\n\tsrc: url(' +  fonts[f].path.substring(`widgets/${DIR_NAME}/`.length) + ');\n}\n';
        insertSampleHtml += '<tr><td>' + fonts[f].name + '</td>' +
            '<td style="font-family: ' + fonts[f].name + '">The essence of the beautiful is unity in variety.</td>' +
            '<td style="font-family: ' + fonts[f].name + '">Фокс таксели травить налево!</td>' +
            '<td style="font-family: ' + fonts[f].name + '">Ää Öö Üü ß</td></tr>\n';
    }
    insertSample +='</style></head><body>\n<table>\n' + insertSampleHtml + '</table>\n</body></html>';
    let samples = '';
    if (fs.existsSync(`${__dirname}/../widgets/${DIR_NAME}/index.html`)) {
        samples = fs.readFileSync(`${__dirname}/../widgets/${DIR_NAME}/index.html`).toString();
    }

    if (samples !== insertSample) {
        fs.writeFileSync(`${__dirname}/../widgets/${DIR_NAME}/index.html`, insertSample);
    }

    let pos = index.indexOf(begin);
    if (pos !== -1) {
        let start = index.substring(0, pos + begin.length);
        pos = index.indexOf(end);
        if (pos !== -1) {
            let _end = index.substring(pos);
            index    = start + '\n' + insert + '\n' + _end;

            begin = '/* following text generated automatically -- START LIST--*/';
            end   = '/* following text generated automatically -- END LIST--*/';
            insert = JSON.stringify(fonts.map(function (font) {
                return font.name;
            }), null, 4);

            pos = index.indexOf(begin);
            if (pos !== -1) {
                start = index.substring(0, pos + begin.length);
                pos = index.indexOf(end);
                if (pos !== -1) {
                    _end = index.substring(pos);
                    index = start + '\n' + insert + '\n' + _end;
                    if (adapter) {
                        adapter.readFile('vis', `widgets/${DIR_NAME}.html`, (err, data) => {
                            if (data && data !== index) {
                                fs.writeFileSync(`${__dirname}/../widgets/${DIR_NAME}.html`, index);
                                adapter.writeFile('vis', `widgets/${DIR_NAME}.html`, index, () =>
                                    callback && callback(true));
                            } else {
                                callback && callback(false);
                            }
                        });
                    } else {
                        fs.writeFileSync(`${__dirname}/../widgets/${DIR_NAME}.html`, index);
                        callback && callback(true);
                    }
                }
            }
        } else if (callback) {
            callback(false);
        }
    } else if (callback) {
        callback(false);
    }
}

if (typeof module !== 'undefined' && module.parent) {
    module.exports = writeFile;
} else {
    writeFile();
}
