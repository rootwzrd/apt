var search = function (item, then) {
  var store = require('../store.json'),
    found = [];
  store.forEach(function (row) {
    if ( row.name === item.name ) {
      found.push(row);
    }
  });
  then(null, found);
};

module.exports = search;