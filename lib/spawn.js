var spawn = function (cmd, options, then) {
  var errorTriggered = false;
  var spawned = require('child_process')
    .spawn(cmd, options);
  var spawnedOut = [],
    spawnedErr = [];
  spawned.on('error', function (error) {
    if ( ! errorTriggered ) {
      errorTriggered = true;
      then(error, {
        cmd: cmd,
        options: options,
        out: spawnedOut,
        err: spawnedErr
      });
    }
  });
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
        return then(new Error('Spawned failed for command ' + cmd), {
          cmd: cmd,
          options: options,
          out: spawnedOut,
          err: spawnedErr,
          code: code
        });
      }
    } else {
      then(null, {
        cmd: cmd,
        options: options,
        code: code
      });
    }
  });
};

module.exports = spawn;