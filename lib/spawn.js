module.exports = function spawn (cmd, args, options) {
  var errorTriggered = false,
    argsIsArray = Object.prototype.toString.call(args) === '[object Array]',
    self = this;

  if ( ! options && typeof args === 'object' && ! argsIsArray ) {
    options = args;
    args = [];
  }

  self.emit('message', 'Spawning', { command: cmd, args: args, options: options});

  var spawned = require('child_process').spawn(cmd, args, options);
  
  var spawnedOut = [],
    spawnedErr = [];

  self.out = {
    cmd: cmd,
    args: args,
    options: options,
    out: spawnedOut,
    err: spawnedErr,
    error: null,
    code: null
  };

  // self.on('error', function (error) {
  //   self.emit('message', { 'error': 'Spawning failed' },
  //     { 'error': error, 'spawn': self.out });
  // });
  
  spawned.on('error', function (error) {
    if ( ! errorTriggered ) {
      errorTriggered = true;
      self.out.error = error;
      self.emit('message', { 'error': 'Spawning failed' }, error);
      return self.emit('error', error);
    }
  });
  
  spawned.stdout.on('data', function (data) {
    var message = data.toString(), lines = message.split(/\n/);
    lines.forEach(function (line) {
      spawnedOut.push(line);
      self.emit('message', line);
    });
  });
  
  spawned.stderr.on('data', function (data) {
    var message = data.toString(), lines = message.split(/\n/);
    lines.forEach(function (line) {
      spawnedErr.push(line);
      self.emit('message', { 'warning': line });
    });
  });
  
  spawned.on('close', function (code) {
    if ( code ) {
      if ( ! errorTriggered ) {
        errorTriggered = true;
        self.out.error = new Error('Spawned failed for command ' + cmd);
        self.out.code = code;
        self.emit('message', { 'error': 'Spawning failed' }, self.out.error);
        return self.emit('error', new Error(spawnedOut[spawnedOut.length - 1]));
      }
    } else {
      self.emit('done', {
        cmd: cmd,
        args: args,
        options: options,
        out: spawnedOut,
        err: spawnedErr,
        code: code
      });
    }
  });
};