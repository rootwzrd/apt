exports.load = function load (module) {
  var importer = require('./lib/' + module),
    sys = require('sys'),
    events = require('events');
  
  for ( var args = [], i = 1; i < arguments.length; i ++ ) {
    args.push(arguments[i]);
  }

  function Asynchronous () {
    process.nextTick(function () {
      importer.apply(this, args);
    }.bind(this));
  }

  sys.inherits(Asynchronous, events.EventEmitter);

  return new Asynchronous();
};

exports.message = function onMessage (message, debug) {
  var args = [];
  if ( typeof message === 'string' ) {
    args.push(message);
  }
  if ( typeof message ===  'object' ) {
    if ( typeof message.error === 'string' ) {
      args.push(message.error.red);
    }
    else if ( typeof message.ok === 'string' ) {
      args.push(message.ok.green);
    }
    else if ( typeof message.minor === 'string' ) {
      args.push(message.minor.grey);
    }
    else if ( typeof message.warning === 'string' ) {
      args.push(message.warning.yellow);
    }
    else {
      args.push(message.minor.magenta);
    }
  }
  if ( Object.keys(arguments).indexOf('1') > -1 ) {
    args.push(JSON.stringify(debug, null, 2).grey);
  }
  console.error.apply(null, args);
};

exports.replay = function (message, debug) {
  self.emit('message', message, debug);
};