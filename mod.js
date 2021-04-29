
export function dump(obj, maxLevel=5) {
    const style =
    '<style>' +
    '.nuxHtmlDump{' +
    '   background:#f8f8f8;' +
    '   width:max-content;' +
    '   font-size:12px;' +
    '   color:black;' +
    '   padding:4px;' +
    '   border:1px solid;' +
    '}' +
    '.nuxHtmlDump table {' +
    '   border-collapse:collapse;' +
    '   display:inline-table;' +
    '}' +
    '.nuxHtmlDump table:target {' +
    '   background:#ff0;' +
    '}' +
    '.nuxHtmlDump td {' +
    '   vertical-align:top;' +
    '   padding:1px 4px;' +
    '   border:1px solid #0004;' +
    '}' +
    '.nuxHtmlDump number , .nuxHtmlDump bool { color:green; }' +
    '.nuxHtmlDump string { color:#800; }' +
    '.nuxHtmlDump null { color:#888; }' +
    '.nuxHtmlDump function { color:#88f; }' +
    '.nuxHtmlDump symbol { color:#f48; }' +
    '.nuxHtmlDump thead {' +
    '   font-weight:bold;' +
    '}' +
    '</style>';

    const objects = new WeakMap();

    return '<div class=nuxHtmlDump>' + style + valueToHtml(obj, 0) + '</div>';



    function valueToHtml(obj, level) {
        ++level;
        if (level > maxLevel) return '...';
        switch (typeof obj) {
            case 'string': return '<string>"'+obj+'"<string>';
            case 'number': return '<number>'+obj+'<number>';
            case 'boolean': return '<bool>'+obj+'<bool>';
            case 'function': return '<function>function '+obj.name+'<function>';
            case 'symbol': return '<symbol>'+obj.toString()+'<symbol>';
            default:
                if (obj === null || obj === undefined) return '<null>'+obj+'<null>';
                if (obj instanceof Date) return '<date>'+obj+'<date>';
                if (Array.isArray(obj)) {
                    return '[' + obj.map(item => valueToHtml(item, level)).join(' , ') + ']';
                }

                if (objects.has(obj)) {
                    return '<a href="#'+objects.get(obj)+'">(circular)</a>';
                }

                const id = ('x'+Math.random()).replace('.','');
                try {
                    objects.set(obj, id);
                } catch {
                    return '? error ?';
                }

                // table
                var cols = objectIsTable(obj);
                if (cols) {
                    let str = '<table id="'+id+'">';
                    str += '<thead>';
                    str += '<tr>';
                    str += '<td> ';
                    for (let col in cols) {
                        str += '<td>'+ encode(col);
                    }
                    str += '<tbody>';
                    for (let [name, value] of Object.entries(obj)) {
                        str += '<tr>';
                        str += '<td>'+ encode(name);
                        for (let col in cols) {
                            str += '<td>'+ valueToHtml(value[col], level);
                        }
                    }
                    return str += '</table>';
                }

                // object
                let str = '<table id="'+id+'">';
                for (let [name, value] of Object.entries(obj)) {
                    str += '<tr>';
                    str += '<td>'+encode(name);
                    str += '<td>'+valueToHtml(value, level);
                }
                return str += '</table>';
        }
    }

    function objectIsTable(obj) {
        const keys = {}; // cols
        let numProps = 0;;
        for (let prop in obj) {
            ++numProps;
            for (let key in obj[prop]) {
                if (keys[key] === undefined) keys[key] = 0;
                keys[key]++;
            }
        }
        if (numProps < 3) return; // just two rows
        if (Object.values(keys).length < 2) return; // not enough cols
        for (let keyNum of Object.values(keys)) {
            if (keyNum < numProps/2) { // not minimum half the keys in sub obj
                return;
            }
        }
        return keys;
    }
}

function encode(str){ // ttodo: does not escape " and '
    return (str+'').replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#'+i.charCodeAt(0)+';';
    });
}
