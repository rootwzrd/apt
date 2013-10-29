#!/usr/bin/env node
var assert = require('assert'),
  vows = require('vows'),
  path = require('path'),
  apt = require('../main'),
  json = require('../package.json'),
  async = require('async'),
  cp = require('child_process');

function printTitle (title) {
  console.log();
  console.log(('» ' + title).blue);
  console.log();
}

function printError (error) {
  console.log(('✗ ' + error).red);
}

function printTest (test) {
  console.log('- ' + test);
}

function printSuccess (success) {
  console.log(('✓ ' + success).green);
}

function batch (b, c) {
  try {
    for ( var i in b ) {
      b[i]();
      printSuccess(i);
    }
    c();
  }
  catch (e) {
    printError(i);
    c(e);
  }
}

async.series({
  'On getting JSON via script': function (callback) {
    printTitle('On getting JSON via script');
    apt.json()
      .on('error', callback)
      .on('done', function (done) {
        batch({
          'it should be an object': function () {
             assert.isObject(done);
          },
          
          'it should have info about apt': function () {
            assert.isObject   (done.apt);
            assert.isString   (done.apt.version);
          },
          
          'it should return the correct base': function () {
            assert.strictEqual(done.base, apt.get('base'));
          },
          
          'it should say wether there is a JSON file': function () {
            assert.isBoolean(done.json);
          }
        }, callback);
      });
  },

  'On getting JSON via CLI': function (callback) {
    printTitle('On getting JSON via CLI');
    var spawn = cp.spawn(path.join(path.dirname(__dirname), 'bin/apt.js'));
    spawn.on('error', callback);
    spawn.out = [];
    spawn.err = [];
    spawn.stdout.on('data', function (data) {
      spawn.out.push(data.toString());
    });
    spawn.stderr.on('data', function (data) {
      spawn.err.push(data.toString());
    });
    spawn.on('close', function (code) {
      batch({
        'it should be a zero status': function () {
          assert.isZero(code);
        },

        'it should return a JSON object': function () {
          assert.isObject(JSON.parse(spawn.out));
        },

        'it should have info about apt': function () {
          assert.isObject   (JSON.parse(spawn.out).apt);
          assert.isString   (JSON.parse(spawn.out).apt.version);
        },
        
        'it should return the correct base': function () {
          assert.strictEqual(JSON.parse(spawn.out).base, apt.get('base'));
        },
        
        'it should say wether there is a JSON file': function () {
          assert.isBoolean(JSON.parse(spawn.out).json);
        }
      }, callback);
    });
  },

  'On getting help via script': function (callback) {
    printTitle('On getting help via script');
    apt.help()
      .on('error', callback)
      .on('done', function (done) {
        batch({
          'it should be an object': function () {
             assert.isObject(done);
          }
        }, callback);
      });
  },

  'On getting help via CLI': function (callback) {
    printTitle('On getting help via CLI');
    var spawn = cp.spawn(path.join(path.dirname(__dirname), 'bin/apt.js'), ['help']);
    spawn.on('error', callback);
    spawn.out = [];
    spawn.err = [];
    spawn.stdout.on('data', function (data) {
      spawn.out.push(data.toString());
    });
    spawn.stderr.on('data', function (data) {
      spawn.err.push(data.toString());
    });
    spawn.on('close', function (code) {
      batch({
        'it should be a zero status': function () {
          assert.isZero(code);
        },

        'it should return a JSON object': function () {
          assert.isObject(JSON.parse(spawn.out));
        }
      }, callback);
    });
  },
}, function (error, results) {
  if ( error ) {
    return printError(error.toString());
  }
  console.log();
  printSuccess('All tests passed!'.bold);
});