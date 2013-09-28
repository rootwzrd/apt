var search = function (module) {
  this.emit('message', 'Searching store', module);
  if ( typeof module !== 'object' ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'Module must be declared as an object' }).message));
  }
  var store = require('../Store.json'),
    found = [];
  store.forEach(function (row) {
    if ( Object.keys(module).length ) {
      for ( var key in module ) {
        switch ( key ) {
          case 'name':
            if ( module[key] !== row[key] ) {
              return false;
            }
            break;
        }
      }
    }
    found.push(row);
  });
  this.emit('message', 'Found ' + found.length + ' candidate(s)');
  this.emit('done', found);
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(search, [module]);
};