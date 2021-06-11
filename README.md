# dump.js

inspect a object

```html
<script type=module>
import 'https://cdn.jsdelivr.net/gh/nuxodin/cleanup.js@1.1.0/mod.min.js';
import {dump} from './mod.js';

document.body.innerHTML = dump(window , {depth:2, order:0, inherited:false});
</script>
```
