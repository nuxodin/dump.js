# 🔍 dump.js

inspect a object

- handles cyclic references
- recognises and displays similar objects in tabular form

# Ussage

```html
<script type=module>
  
import {dump} from 'https://cdn.jsdelivr.net/gh/nuxodin/dump.js@x/mod.min.js';

document.body.innerHTML = dump(String, {depth:3, order:0, inherited:true});
  
</script>
```

# Result
![Bildschirmfoto am 2021-06-11 um 03 12 30](https://user-images.githubusercontent.com/16326/121616284-e73be500-ca62-11eb-8346-c309fb5e14f4.png)



## Arguments

**depth:** number, how deep do you like to inspect the object?  
**order:** bool, alphabetical order of properties  
**inherited:** bool, show inherited properties  
**customRender:** a function that takes the current object and returns a string to show  
