
export function dump(obj, {depth=6, enumerable=true, symbols=false, inherited=false, order=false, customRender=false}={}) {
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
    '.nuxHtmlDump :is(date, promise) { color:#1b8; }' +
    '.nuxHtmlDump thead {' +
    '   font-weight:bold;' +
    '}' +
    '</style>';

    const objects = new WeakMap();

    return `<div class=nuxHtmlDump>${style+valueToHtml(obj, 0)}</div>`;

    function valueToHtml(obj, level) {
        ++level;

        if (customRender) {
            const val = customRender(obj);
            if (val != null) return val;
        }
        switch (typeof obj) {
            case 'string': return `<string>"${encode(obj)}"<string>`;
            case 'number': return `<number>${encode(obj)}<number>`;
            case 'boolean': return `<bool>${encode(obj)}<bool>`;
            case 'symbol': return `<symbol>${encode(obj.toString())}<symbol>`;
        }

        if (typeof obj === 'function' && !isConstructor(obj)) {
            const asStr = obj.toString();
            const arrow =  asStr[0]==='f' || asStr.replace(/\s+/g,' ').startsWith('async function') ? '' : 'arrow';
            const async = obj[Symbol.toStringTag] === 'AsyncFunction' ? 'async' : '';
            const generator = obj[Symbol.toStringTag] === 'GeneratorFunction' ? '*' : '';
            return '<function>'+(async+' '+arrow+' '+generator+'function <b>').trim()+encode(obj.name)+'</b>('+obj.length+')<function>';
        }
        if (obj == null) return '<null>'+obj+'<null>';
        if (obj instanceof Date) return '<date>'+obj+'<date>';
        if (obj instanceof Promise) return '<promise>'+obj+'<promise>';

        if (objects.has(obj)) return '<a href="#'+objects.get(obj)+'">(circular)</a>';

        // its an object / array
        if (level > depth) return '...';

        const id = ('x'+Math.random()).replace('.','');
        try { objects.set(obj, id); }
        catch { return '? error ?'; }

        if (obj instanceof Map) obj = Object.fromEntries(obj);
        if (obj instanceof Set) obj = [...obj];

        const keys = propertiesOf(obj, {enumerable, inherited, symbols, order});

        const isArray = Array.isArray(obj) && obj !== Array.prototype;

        // table
        const cols = objectIsTable(obj);
        if (cols) {
            let str = '<table id="'+id+'">';
            str += '<thead>';
            str += '<tr>';
            str += '<td><small>' + (isArray?'(items)':'(index)')+'</small>';
            for (const col in cols) {
                str += '<td>'+ encode(col);
            }
            str += '<tbody>';
            for (const [name,] of keys) {
                //if (isArray && name==='length') continue;
                const value = obj[name];
                if (name==='length' && typeof value === 'number') continue;
                str += '<tr>';
                str += '<td>';
                str += encode(name) + (isArray ? ' = { ' : ' : { ');
                for (const col in cols) {
                    str += '<td>'
                    str += (col in value) ? valueToHtml(value[col], level) : '<null>(not set)</null>';
                }
            }
            return str += '</table>';
        }

        if (isArray) {
            return '[' + obj.map(item => valueToHtml(item, level)).join(' , ') + ']';
        } else { // object
            let str = '<table id="'+id+'">';
            for (const [name, behavoir] of keys) {
                let value = null;
                try { value = obj[name]; }
                catch { value = '? error ?' }
                str += '<tr>';
                str += '<td>'+encode(name);
                if (behavoir.inherited) str += ' <small title=inherited>👨‍👦</small>';
                if (!behavoir.enumerable) str += ' <small title="non-enumerable">🚫</small>';
                str += '<td>'+valueToHtml(value, level);
            }
            return str += '</table>';
        }

    }

    function objectIsTable(obj) {
        const keys = {}; // cols
        let numProps = 0;
        for (const prop in obj) {
            try {
                if (typeof obj[prop] === 'string') return;
                ++numProps;
                for (const key in obj[prop]) {
                    if (keys[key] === undefined) keys[key] = 0;
                    keys[key]++;
                }
            } catch {
                //console.log(obj, e)
            }
        }
        if (numProps < 3) return; // just two rows
        if (Object.values(keys).length < 2) return; // not enough cols
        for (const keyNum of Object.values(keys)) {
            if (keyNum < numProps/2) return; // not minimum half the keys in sub obj
        }
        return keys;
    }
}

export function encode(str){ // TODO: does not escape " and '
    // check if str is a Symbol
    if (typeof str === 'symbol') return '<symbol>'+str.toString()+'<symbol>';
    return (str+'').replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#'+i.charCodeAt(0)+';';
    });
}

function isConstructor(f) {
    if (typeof f !== 'function') return false;
    if (f.prototype === undefined) return false;
    if (Reflect.ownKeys(f.prototype).length < 2) return false;
    // try {
    //     Reflect.construct(String, [], f);
    // } catch {
    //     return false;
    // }
    return true;
}


function propertiesOf(obj, {enumerable, symbols, inherited, order}) {
    let keys = new Map();

    if (obj instanceof Map) {
        for (const [k, _v] of obj) {
            keys.set(k, {
                own: true,
                enumerable: true,
            });
        }
        return keys;
    }

    Reflect.ownKeys(obj).forEach(k => {
        const isEnumerable = Object.prototype.propertyIsEnumerable.call(obj, k);
        if (!enumerable && !isEnumerable) return;
        keys.set(k, {
            own: true,
            enumerable: isEnumerable,
        });
    });
    if (inherited) {
        const proto = Object.getPrototypeOf(obj);
        if (proto && proto !== Object.prototype && proto !== Function.prototype && proto !== Array.prototype) {
            const inheritedKeys = propertiesOf(proto, {enumerable, symbols, inherited, order});
            for (const [k, v] of inheritedKeys) {
                if (k === 'constructor') continue;
                if (!keys.has(k)) {
                    v.inherited = true;
                    keys.set(k, v);
                }
            }
        }
    }
    if (order) {
        const nKeys = new Map();
        const tmp = Array.from(keys.keys()).sort();
        for (const k of tmp) nKeys.set(k, keys.get(k));
        keys = nKeys;
    }
    return keys;
}


export function domRender(obj){
    let isElement = false;
    let isText = false;
    try {
        isElement = obj instanceof window.Element && obj.tagName;
        isText = obj instanceof window.Text;
    } catch {}
    if (isElement) return encode(obj.outerHTML).substring(0, 70).trim()+"...";
    if (isText) return encode(obj.textContent).substring(0, 60).trim()+"... [TextNode]";
}

