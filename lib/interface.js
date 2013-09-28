var interface = function (callback, options) {
  process.nextTick(function () {
    callback.apply(this, options);
  }.bind(this));
};

interface.prototype.on = function(event, trigger) {
  if ( typeof this.events !== 'object' ) {
    this.events = {};
  }
  switch ( event ) {
    case 'error':
      if ( ! this.events.error || ! this.events.error instanceof Array ) {
        this.events.error = [];
      }
      this.events.error.push(trigger);
      break;
    case 'done':
      if ( ! this.events.done || ! this.events.done instanceof Array ) {
        this.events.done = [];
      }
      this.events.done.push(trigger);
      if ( this.emissions && this.emissions.done && this.emissions.done instanceof Array ) {
        this.emissions.done.forEach(function (emit) {
          trigger(emit.bind(this));
        }.bind(this));
      }
      break;
  }
  return this;
};

interface.prototype.emit = function(event, emit) {
  if ( typeof this.events !== 'object' ) {
    this.events = {};
  }
  switch ( event ) {
    case 'error':
      if ( ! this.events.error ) {
        this.events.error = [];
      }
      this.events.error.forEach(function (trigger) {
        trigger.call(this, emit);
      }.bind(this));
      break;
    case 'done':
      if ( ! this.events.done ) {
        this.events.done = [];
      }
      this.events.done.forEach(function (trigger) {
        trigger.call(this, emit);
      }.bind(this));
      break;
    case 'message':
      return this.message(emit, arguments['2'] || undefined);
  }
};

interface.prototype.message = function(message, debug) {
  var level, log, color;
  if ( typeof message === 'string' ) {
    level = 'notice';
    log = message;
  }
  if ( typeof message === 'object' ) {
    level = Object.keys(message)[0];
    log = message[level];
  }
  switch ( level ) {
    default:
      color = 'white';
      break;
    case 'error':
      color = 'red';
      break;
    case 'ok':
      color = 'green';
      break;
    case 'warning':
      color = 'yellow';
      break;
  }
  var args = [];
  if ( this.prefix instanceof Array ) {
    args = args.concat(this.prefix);
  }
  args.push(log[color].italic);
  if ( debug ) {
    args.push(JSON.stringify(debug, null, 2).grey);
  }
  console.error.apply(null, args);
  return {
    message: log,
    debug: debug || {},
    level: level
  };
};

interface.prototype.set = function(key, value) {
  switch ( key ) {
    case 'message prefix':
      if ( value instanceof Array ) {
        this.prefix = value;
      }
      break;
  }
  return this;
};

module.exports = function (module, options) {
  return new interface(module, options);
};