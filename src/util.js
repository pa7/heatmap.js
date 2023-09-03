

let Util = {
  merge: function() {
    let merged = {};
    let argsLen = arguments.length;
    for (let i = 0; i < argsLen; i++) {
      let obj = arguments[i]
      for (let key in obj) {
        merged[key] = obj[key];
      }
    }
    return merged;
  }
};
