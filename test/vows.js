#!/usr/bin/env node
var assert = require('assert'),
  vows = require('vows'),
  path = require('path'),
  main = require('../main'),
  json = require('../package.json'),
  async = require('async');

function printTitle (title) {
  console.log(('» ' + title).blue);
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
  'On getting JSON': function (callback) {
    printTitle('On getting JSON');
    main('lib/json')
      .on('error', callback)
      .on('done', function (done) {
        batch({
          'it should be an object': function () {
             assert.isObject(done);
          },
          
          'it should return the correct version': function () {
             assert.strictEqual(done['apt version'], json.version);
          },
          
          'it should return the correct base': function () {
            assert.strictEqual(done.base, main.$$properties.base);
          },
          
          'it should say wether there is a JSON file': function () {
            assert.isBoolean(done['has JSON']);
          },
          
          'it should have a dependencies list (even if empty)': function () {
            assert.isObject(done.dependencies);
          },
          
          'it should have a number of the dependencies': function () {
            assert.isNumber(done['number of dependencies']);
          },

          'it should have a path': function () {
            assert.isString(done.path);
          },

          'it should say wether the OS is present': function () {
            assert.isBoolean(done.OS);
          },

          'it should have no more than 6 properties': function () {
            assert.lengthOf(Object.keys(done), 7);
          }
        }, callback);
      });
  }
}, function (error, results) {
  if ( error ) {
    return printError(error.toString());
  }
  console.log();
  printSuccess('All tests passed!'.bold);
});