var fs = require('fs');

function getAllFonts(result, dir) {
    result = result || [];
    dir = dir || 'widgets/google-fonts/';

    var dirs = fs.readdirSync(__dirname + '/../' + dir);
    for (var d = 0; d < dirs.length; d++) {
        var stat = fs.statSync(__dirname + '/../' + dir + dirs[d]);
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
    var index   = fs.readFileSync(__dirname + '/../widgets/google-fonts.html').toString();
    var fonts = getAllFonts();

    var begin = '/* following text generated automatically -- START STYLE--*/';
    var end   = '/* following text generated automatically -- END STYLE--*/';
    var insert = '';
    var insertSample = '<html><head><style>\n';
    var insertSampleHtml = '';
    for (var f = 0; f < fonts.length; f++) {
        insert += '@font-face {\n\tfont-family: ' + fonts[f].name + ';\n\tsrc: url(' + fonts[f].path + ');\n}\n';
        insertSample += '@font-face {\n\tfont-family: ' + fonts[f].name + ';\n\tsrc: url(' +  fonts[f].path.substring('widgets/google-fonts/'.length) + ');\n}\n';
        insertSampleHtml += '<tr><td>' + fonts[f].name + '</td>' +
            '<td style="font-family: ' + fonts[f].name + '">The essence of the beautiful is unity in variety.</td>' +
            '<td style="font-family: ' + fonts[f].name + '">Фокс таксели травить налево!</td>' +
            '<td style="font-family: ' + fonts[f].name + '">Ää Öö Üü ß</td></tr>\n';
    }
    insertSample +='</style></head><body>\n<table>\n' + insertSampleHtml + '</table>\n</body></html>';
    var samples = '';
    if (fs.existsSync(__dirname + '/../widgets/google-fonts/index.html')) {
        samples = fs.readFileSync(__dirname + '/../widgets/google-fonts/index.html').toString();
    }

    if (samples != insertSample) {
        fs.writeFileSync(__dirname + '/../widgets/google-fonts/index.html', insertSample);
    }

    var pos = index.indexOf(begin);
    if (pos != -1) {
        var start = index.substring(0, pos + begin.length);
        pos = index.indexOf(end);
        if (pos != -1) {
            var _end = index.substring(pos);
            index    = start + '\n' + insert + '\n' + _end;

            begin = '/* following text generated automatically -- START LIST--*/';
            end   = '/* following text generated automatically -- END LIST--*/';
            insert = JSON.stringify(fonts.map(function (font) {
                return font.name;
            }), null, 4);

            pos = index.indexOf(begin);
            if (pos != -1) {
                start = index.substring(0, pos + begin.length);
                pos = index.indexOf(end);
                if (pos != -1) {
                    _end = index.substring(pos);
                    index = start + '\n' + insert + '\n' + _end;
                    if (adapter) {
                        adapter.readFile('vis', 'widgets/google-fonts.html', function (err, data) {
                            if (data && data != index) {
                                fs.writeFileSync(__dirname + '/../widgets/google-fonts.html', index);
                                adapter.writeFile('vis', 'widgets/google-fonts.html', index, function () {
                                    if (callback) callback(true);
                                });
                            } else {
                                if (callback) callback(false);
                            }
                        });
                    } else {
                        fs.writeFileSync(__dirname + '/../widgets/google-fonts.html', index);
                        if (callback) callback(true);
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
