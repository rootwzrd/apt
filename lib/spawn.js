var spawn = function (cmd, args, options) {
  var errorTriggered = false,
    argsIsArray = Object.prototype.toString.call(args) === '[object Array]' ;

  if ( ! options && typeof args === 'object' && ! argsIsArray ) {
    options = args;
    args = [];
  }

  this.emit('message', 'Spawning', { command: cmd, args: args, options: options});

  var spawned = require('child_process').spawn(cmd, args, options);
  
  var spawnedOut = [],
    spawnedErr = [];

  this.out = {
    cmd: cmd,
    args: args,
    options: options,
    out: spawnedOut,
    err: spawnedErr,
    error: null,
    code: null
  };

  this.on('error', function (error) {
    this.emit('message', { 'error': 'Spawning failed' },
      { 'error': error, 'spawn': this.out });
  }.bind(this));
  
  spawned.on('error', function (error) {
    if ( ! errorTriggered ) {
      errorTriggered = true;
      this.out.error = error;
      return this.emit('error',
        this.emit('message', { 'error': 'Spawning failed' }, error).debug);
    }
  }.bind(this));
  
  spawned.stdout.on('data', function (data) {
    spawnedOut.push(data.toString());
  });
  
  spawned.stderr.on('data', function (data) {
    spawnedErr.push(data.toString());
  });
  
  spawned.on('close', function (code) {
    if ( code ) {
      if ( ! errorTriggered ) {
        errorTriggered = true;
        this.out.error = new Error('Spawned failed for command ' + cmd);
        this.out.code = code;
        return this.emit('error',
          this.emit('message', { 'error': 'Spawning failed' }, this.out.error).debug);
      }
    } else {
      this.emit('done', code);
    }
  }.bind(this));
};

module.exports = function () {
  var interface = require('./interface');
  return new interface(spawn, arguments);
};