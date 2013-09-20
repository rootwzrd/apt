var Local = require('../local.json');

exports.get = function (module, then) {
  var got = [];
  Local.forEach(function (mod) {
    for ( var key in module ) {
      if ( module[key] !== mod[key] ) {
        break;
      }
    }
    got.push(mod);
  });
  then(null, got);
};

exports.insert = function (module, then) {
  Local.push(module);
  require('fs').writeFile(__dirname + '/../local.json', JSON.stringify(Local, null, 2), then);
};