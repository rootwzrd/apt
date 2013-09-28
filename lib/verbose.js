var verbosity = 0;

require('colors');

var verbose = function () {
  if ( ! verbosity ) {
    return;
  }
  var args = [];
  args.push('[apt]'.blue);
  for ( var i in arguments ) {
    args.push(arguments[i]);
  }
  console.error.apply(null, args);
};

verbose.setVerbosity = function ($verbosity) {
  if ( $verbosity === false ) {
    verbosity = 0;
  }
  if ( $verbosity === true ) {
    verbosity = 1;
  }
};

verbose.error = function () {
  if ( ! verbosity ) {
    return;
  }
  var args = [];
  args.push('[apt]'.red);
  for ( var i in arguments ) {
    args.push(arguments[i]);
  }
  console.error.apply(null, args);
};

verbose.ok = function () {
  if ( ! verbosity ) {
    return;
  }
  var args = [];
  args.push('[apt]'.green);
  for ( var i in arguments ) {
    args.push(arguments[i]);
  }
  console.error.apply(null, args);
};

verbose.warning = function () {
  if ( ! verbosity ) {
    return;
  }
  var args = [];
  args.push('[apt]'.yellow);
  for ( var i in arguments ) {
    args.push(arguments[i]);
  }
  console.error.apply(null, args);
};

module.exports = verbose;