var install = require('./install'),
  all = 0,
  installed = [],
  apt = require('../main'),
  self;

var installDependency = function (dependency, version, dir ) {
  apt.load('install', dependency + '@' + version, { cwd : dir })
    .set('message prefix', ['Installling dependency '.blue + dependency.bold.blue + ' v' + version.blue])
    .on('error', function (error) {
      self.emit('error', self.emit('message', { 'error': 'Could not install dependency' }, error).debug);
    }.bind(this))
    .on('done', function (module) {
      self.emit('message', { 'ok': 'Dependency installed' });
      installed.push(module);
      if ( installed.length === all ) {
        self.emit('done', installed);
      }
    }.bind(this));
};

module.exports = function installDependencies (module) {
  self = this;

  var $dependencies = module.dependencies || {};
  
  if ( ! Object.keys($dependencies).length ) {
    self.emit('message', { 'minor': 'This module has no dependencies' });
    return self.emit('done', []);
  }
  
  var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    moduleDir = module.cwd + '/' + module.path + '/' + module.name,
    dependencies = module.dependencies;

  if ( ! dependencies ) {
    return self.emit('error', new Error(
      self.emit('message', { 'error': 'No how-to install found this version' }).message));
  }

  all = Object.keys(dependencies).length;

  if ( ! module.path ) {
    return self.emit('error', new Error(
      self.emit('message', { 'error': 'Missing path' }).message));
  }

  fs.exists(module.cwd + '/' + module.path, function (exists) {
    if ( ! exists ) {
      return fs.mkdir(module.cwd + '/' + module.path, function (error) {
        if ( error ) {
          return self.emit('error', new Error(
            self.emit('message', { 'error': 'Could not create folder' }, module.cwd + '/' + module.path).message));
        }
        self.init();
      });
    }
    fs.exists(moduleDir,function ( exists ) {
      if ( ! exists ) {
        self.emit('message', 'Creating folder', moduleDir);
        return fs.mkdir(moduleDir, function (error) {
          if ( error ) {
            return self.emit('error',
              self.emit('message', { 'error': 'Could not create folder' }, {
                folder: moduleDir,
                error: error
              }).debug.error);
          }
          self.emit('message', { 'ok': 'Folder created' }, moduleDir);
          self.init();
        });
      }
      else {
        for ( var dependency in dependencies ) {
          installDependency.apply(this, [dependency, dependencies[dependency], moduleDir]);
        }
      }
    });
  });
};