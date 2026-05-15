/* @ts-self-types="./mod.d.ts" */
/**
 * Render a detailed HTML representation of any JavaScript value.
 *
 * @param {unknown} obj
 * @param {{ depth?: number, enumerable?: boolean, symbols?: boolean, inherited?: boolean, order?: boolean, callGetters?: boolean, customRender?: ((value: unknown) => string | null | undefined) | false }} [options]
 * @returns {string}
 */
export function dump(
  obj,
  {
    depth = 6,
    enumerable = true,
    symbols = false,
    inherited = false,
    order = false,
    callGetters = false,
    customRender = false,
  } = {},
) {
  const style = "<style>" +
    "@scope (.nuxHtmlDump) {" +
    "   :scope {" +
    "      background:#f8f8f8;" +
    "      width:max-content;" +
    "      font-size:12px;" +
    "      color:black;" +
    "      padding:4px;" +
    "      border:1px solid;" +
    "   }" +
    "   table {" +
    "      border-collapse:collapse;" +
    "      display:inline-table;" +
    "      &:target { background:#ff0; }" +
    "   }" +
    "   td {" +
    "      vertical-align:top;" +
    "      padding:1px 4px;" +
    "      border:1px solid #0004;" +
    "   }" +
    "   number, bool { color:green; }" +
    "   string { color:#800; }" +
    "   null { color:#888; }" +
    "   function { color:#88f; }" +
    "   symbol { color:#f48; }" +
    "   accessor { color:#888; }" +
    "   :is(date, promise) { color:#1b8; }" +
    "   thead { font-weight:bold; }" +
    "}" +
    "</style>";

  const objects = new WeakMap();

  return `<div class=nuxHtmlDump>${style + valueToHtml(obj, 0)}</div>`;

  function valueToHtml(obj, level) {
    ++level;

    if (customRender) {
      const val = customRender(obj);
      if (val != null) return val;
    }
    switch (typeof obj) {
      case "string":  return `<string>"${encode(obj)}"</string>`;
      case "number":  return `<number>${encode(obj)}</number>`;
      case "boolean": return `<bool>${encode(obj)}</bool>`;
      case "symbol":  return `<symbol>${encode(obj.toString())}</symbol>`;
    }

    if (typeof obj === "function" && !isConstructor(obj)) {
      const asStr = obj.toString();
      const arrow = asStr[0] === "f" ||
          asStr.replace(/\s+/g, " ").startsWith("async function") ? "" : "arrow";
      const async = obj[Symbol.toStringTag] === "AsyncFunction" ? "async" : "";
      const generator = obj[Symbol.toStringTag] === "GeneratorFunction" ? "*" : "";
      return "<function>" +
        (async + " " + arrow + " " + generator + "function <b>").trim() +
        encode(obj.name) + "</b>(" + obj.length + ")</function>";
    }
    if (obj == null) return "<null>" + obj + "</null>";
    if (obj instanceof Date) return "<date>" + encode(Date.prototype.toString.call(obj)) + "</date>";
    if (obj instanceof Promise) return "<promise>[object Promise]</promise>";

    if (objects.has(obj)) return '<a href="#' + objects.get(obj) + '">(circular)</a>';

    // its an object / array
    if (level > depth) return "...";

    const id = ("x" + Math.random()).replace(".", "");
    try { objects.set(obj, id); }
    catch { return "? error ?"; }

    if (obj instanceof Map) obj = Object.fromEntries(obj);
    if (obj instanceof Set) obj = [...obj];

    const keys = propertiesOf(obj, { enumerable, inherited, symbols, order });

    const isArray = Array.isArray(obj) && obj !== Array.prototype;

    // table
    const cols = objectIsTable(obj);
    if (cols) {
      let str = '<table id="' + id + '">';
      str += "<thead>";
      str += "<tr>";
      str += "<td><small>" + (isArray ? "(items)" : "(index)") + "</small>";
      for (const col in cols) str += "<td>" + encode(col);
      str += "<tbody>";
      for (const [name, behavoir] of keys) {
        //if (isArray && name==='length') continue;
        const value = propertyValue(obj, name, behavoir);
        if (
          name === "length" && value.valueType === "value" &&
          typeof value.value === "number"
        ) continue;
        str += "<tr>";
        str += "<td>";
        str += encode(name) + propertyBadge(value) + (isArray ? " = { " : " : { ");
        for (const col in cols) {
          str += "<td>";
          const cell = value.valueType === "value"
            ? propertyValue(value.value, col) : { valueType: "none" };
          str += cell.valueType !== "none"
            ? propertyValueToHtml(cell, level) : "<null>(not set)</null>";
        }
      }
      return str += "</table>";
    }

    if (isArray) {
      return "[" + obj.map((item) => valueToHtml(item, level)).join(" , ") + "]";
    } else { // object
      let str = '<table id="' + id + '">';
      for (const [name, behavoir] of keys) {
        const value = propertyValue(obj, name, behavoir);
        str += "<tr>";
        str += "<td>" + encode(name);
        str += propertyBadge(value);
        if (behavoir.inherited) str += " <small title=inherited>👨‍👦</small>";
        if (!behavoir.enumerable) {
          str += ' <small title="non-enumerable">🚫</small>';
        }
        str += "<td>" + propertyValueToHtml(value, level);
      }
      return str += "</table>";
    }
  }

  function objectIsTable(obj) {
    const keys = {}; // cols
    let numProps = 0;
    for (const prop in obj) {
      try {
        const value = propertyValue(obj, prop, undefined, false);
        if (value.valueType !== "value") return;
        if (typeof value.value === "string") return;
        if (
          value.value == null ||
          (typeof value.value !== "object" && typeof value.value !== "function")
        ) return;
        ++numProps;
        for (const key in value.value) {
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
      if (keyNum < numProps / 2) return; // not minimum half the keys in sub obj
    }
    return keys;
  }

  function propertyValue(obj, key, behavoir, callAccessor = callGetters) {
    const descriptor = behavoir?.descriptor || propertyDescriptor(obj, key);
    if (!descriptor) return { valueType: "none" };
    if ("value" in descriptor) {
      return { valueType: "value", value: descriptor.value };
    }
    if (callAccessor && descriptor.get) {
      try {
        return {
          valueType: "value",
          value: descriptor.get.call(obj),
          getter: true,
          setter: Boolean(descriptor.set),
        };
      } catch (error) {
        return {
          valueType: "error",
          error,
          getter: true,
          setter: Boolean(descriptor.set),
        };
      }
    }
    return {
      valueType: "accessor",
      get: Boolean(descriptor.get),
      set: Boolean(descriptor.set),
    };
  }

  function propertyValueToHtml(value, level) {
    if (value.valueType === "accessor") {
      const parts = [];
      if (value.get) parts.push("Getter");
      if (value.set) parts.push("Setter");
      return "<accessor>[" + parts.join("/") + "]</accessor>";
    }
    if (value.valueType === "none") return "<null>(not set)</null>";
    if (value.valueType === "error") return "<accessor>[Thrown: " + encode(value.error) + "]</accessor>";
    return valueToHtml(value.value, level);
  }

  function propertyBadge(value) {
    const parts = [];
    if (value.getter || value.get) parts.push("get");
    if (value.setter || value.set) parts.push("set");
    if (parts.length) return ' <small title="accessor">(' + parts.join(",") + ")</small>";
    return "";
  }

  function propertyDescriptor(obj, key) {
    if (obj == null || (typeof obj !== "object" && typeof obj !== "function")) return;
    let proto = obj;
    while (proto) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (descriptor) return descriptor;
      proto = Object.getPrototypeOf(proto);
    }
  }
}

/**
 * @param {unknown} str
 * @returns {string}
 */
export function encode(str) { // TODO: does not escape " and '
  // check if str is a Symbol
  if (typeof str === "symbol") return "<symbol>" + encode(str.toString()) + "</symbol>";
  return (str + "").replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
    return "&#" + i.charCodeAt(0) + ";";
  });
}

function isConstructor(f) {
  if (typeof f !== "function") return false;
  if (f.prototype === undefined) return false;
  if (Reflect.ownKeys(f.prototype).length < 2) return false;
  // try {
  //     Reflect.construct(String, [], f);
  // } catch {
  //     return false;
  // }
  return true;
}

function propertiesOf(obj, { enumerable, symbols, inherited, order }) {
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

  Reflect.ownKeys(obj).forEach((k) => {
    if (!symbols && typeof k === "symbol") return;
    const descriptor = Object.getOwnPropertyDescriptor(obj, k);
    const isEnumerable = descriptor?.enumerable ?? false;
    if (!enumerable && !isEnumerable) return;
    keys.set(k, {
      own: true,
      enumerable: isEnumerable,
      descriptor,
    });
  });
  if (inherited) {
    const proto = Object.getPrototypeOf(obj);
    if (
      proto && proto !== Object.prototype && proto !== Function.prototype &&
      proto !== Array.prototype
    ) {
      const inheritedKeys = propertiesOf(proto, {
        enumerable,
        symbols,
        inherited,
        order,
      });
      for (const [k, v] of inheritedKeys) {
        if (k === "constructor") continue;
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

/**
 * @param {unknown} obj
 * @returns {string | undefined}
 */
export function domRender(obj) {
  let isElement = false;
  let isText = false;
  try {
    isElement = obj instanceof window.Element && obj.tagName;
    isText = obj instanceof window.Text;
  } catch {}
  if (isElement) return encode(obj.outerHTML).substring(0, 70).trim() + "...";
  if (isText) return encode(obj.textContent).substring(0, 60).trim() + "... [TextNode]";
}
