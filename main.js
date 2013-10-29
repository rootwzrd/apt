var Import  = require('lib-import')
  .$$setPath(__dirname + '/lib')
  .$$setProperty({ base: process.cwd() });

exports.set = Import.$$setProperty;

exports.get = function (what) {
  return Import.$$properties[what];
};

function argumentsToArray () {
  var $args = [];

  for ( var i in arguments ) {
    if ( i.match(/^\d+$/) ) {
      $args.push(arguments[i]);
    }
  }

  return $args;
}

['json', 'help'].forEach(function (mod) {
  exports[mod] = function () {
    return Import.apply(null, [mod].concat(argumentsToArray.call(null, arguments)));
  };
});