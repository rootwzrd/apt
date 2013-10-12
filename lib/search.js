module.exports = function search (module) {
  var apt = require('../main'),
    self = this;

  self.emit('message', 'Searching store', module);
  
  if ( typeof module !== 'object' ) {
    return self.emit('error', new Error(
      self.emit('message', { 'error': 'Module must be declared as an object' }).message));
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
  
  self.emit('message', { 'ok': 'Found ' + found.length + ' candidate(s)' });
  self.emit('done', found);
};