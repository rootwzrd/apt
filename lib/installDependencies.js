var install = require('./install'),
  all = 0,
  installed = [];

var installDependency = function (dependency, version, dir ) {
  require('./install')(dependency + '@' + version, { cwd : dir })
    .set('message prefix', ['Installling dependency '.blue + dependency.bold.blue + ' v' + version.blue])
    .on('error', function (error) {
      this.emit('error', this.emit('message', { 'error': 'Could not install dependency' }, error).debug);
    }.bind(this))
    .on('done', function (module) {
      this.emit('message', { 'ok': 'Dependency installed' });
      installed.push(module);
      if ( installed.length === all ) {
        this.emit('done', installed);
      }
    }.bind(this));
};

var installDependencies = function (module) {
  var $dependencies = module.dependencies || {};
  
  if ( ! Object.keys($dependencies).length ) {
    this.emit('message', 'This module has no dependencies');
    return this.emit('done', []);
  }
  
  var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    moduleDir = module.cwd + '/' + module.path + '/' + module.name,
    dependencies = module.dependencies;

  if ( ! dependencies ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'No how-to install found this version' }).message));
  }

  all = Object.keys(dependencies).length;

  if ( ! module.path ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'Missing path' }).message));
  }

  fs.exists(module.cwd + '/' + module.path, function (exists) {
    if ( ! exists ) {
      return fs.mkdir(module.cwd + '/' + module.path, function (error) {
        if ( error ) {
          return this.emit('error', new Error(
            this.emit('message', { 'error': 'Could not create folder' }, module.cwd + '/' + module.path).message));
        }
        this.init();
      }.bind(this));
    }
    fs.exists(moduleDir,function ( exists ) {
      if ( ! exists ) {
        this.emit('message', 'Creating folder', moduleDir);
        return fs.mkdir(moduleDir, function (error) {
          if ( error ) {
            return this.emit('error',
              this.emit('message', { 'error': 'Could not create folder' }, {
                folder: moduleDir,
                error: error
              }).debug.error);
          }
          this.emit('message', { 'ok': 'Folder created' }, moduleDir);
          this.init();
        }.bind(this));
      }
      else {
        for ( var dependency in dependencies ) {
          installDependency.apply(this, [dependency, dependencies[dependency], moduleDir]);
        }
      }
    }.bind(this));
  }.bind(this));
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(installDependencies, [module]);
};