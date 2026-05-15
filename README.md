# 🔍 dump.js

Render a detailed HTML representation of any JavaScript value.

- handles cyclic references
- shows arrays, objects, maps, sets, dates, promises, functions and symbols
- recognises and displays similar objects in tabular form
- can include inherited, non-enumerable and symbol properties

# Usage

```html
<script type=module>
  
import {dump} from 'https://cdn.jsdelivr.net/gh/nuxodin/dump.js@x/mod.min.js';

document.body.innerHTML = dump(String, {depth:3, order:0, inherited:true});
  
</script>
```

# Result
![Bildschirmfoto am 2021-06-11 um 03 12 30](https://user-images.githubusercontent.com/16326/121616284-e73be500-ca62-11eb-8346-c309fb5e14f4.png)



## Arguments

`dump(value, options)` returns an HTML string.

**value:** any JavaScript value to render  
**options.depth:** maximum nesting depth, defaults to `6`  
**options.enumerable:** include enumerable properties, defaults to `true`  
**options.symbols:** include symbol properties, defaults to `false`  
**options.inherited:** include inherited properties, defaults to `false`  
**options.order:** sort properties alphabetically, defaults to `false`  
**options.callGetters:** call getters and render their returned value, defaults to `false`  
**options.customRender:** function that receives the current value and may return custom HTML  

```js
dump(obj, {
  depth: 3,
  enumerable: true,
  symbols: true,
  inherited: true,
  order: true,
  callGetters: false,
  customRender(value) {
    if (value instanceof HTMLElement) return value.outerHTML;
  },
});
```
