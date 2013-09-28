var configureMakeInstall = function (module, then) {
	var fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    source = path.dirname(__dirname) + '/sources/' +
      module.store.name + '-' + module.meta.version,
    howToInstall = module.store.install,
    howToConfigureMakeInstall,
    args = [];

  function parse (str) {
    return str
      .replace(/\{\{install path\}\}/g, module.meta.cwd + '/' + module.meta.Json.Path +
        '/' + module.store.name);
  }

  for ( var semanticVersion in howToInstall ) {
    if ( module.meta.semantic.match(semanticVersion) ) {
      this.emit('message', 'Using how-to install for versions ' + semanticVersion);
      howToConfigureMakeInstall = howToInstall[semanticVersion].build['configure-make-install'];

      break;
    }
  }

  if ( ! howToConfigureMakeInstall ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'No how-to configure-make-install found this version' }).message));
  }

  for ( var option in howToConfigureMakeInstall.configure ) {
    args.push('--' + option + '=' + parse(howToConfigureMakeInstall.configure[option].default.apt));
  }

  this.emit('message', 'Configuring source', args);
  
  var configure = cp.spawn('./configure', args, {
    cwd: source
  });
  
  configure.on('error', function (error) {
    this.emit('error',
      this.emit('message', { 'error': 'Could not configure source' }, error).debug);
  }.bind(this));
  
  configure.on('close', function (code) {
    if ( code ) {
      return this.emit('error', new Error(
        this.emit('message', { 'error': 'Could not configure source' }, code).message));
    }

    this.emit('message', { 'ok': 'Configured' });
    
    var make = cp.spawn('make', [], {
      cwd: source
    });
    
    make.on('error', function (error) {
      this.emit('error',
        this.emit('message', { 'error': 'Could not make install files' }, error).debug);
    }.bind(this));
    
    make.on('close', function (code) {
      if ( code ) {
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'Could not make install files' }, code).message));
      }

      this.emit('message', { 'ok': 'Made' });

      var install = cp.spawn('make', ['install'], {
        cwd: source
      });

      install.on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'Could not install files' }, error).debug);
      }.bind(this));

      install.on('close', function (code) {
        this.emit('message', { 'ok': 'Installed' });

        var clean = cp.spawn('make', ['clean'], {
          cwd: source
        });

        clean.on('error', function (error) {
          this.emit('error',
            this.emit('message', { 'error': 'Could not clean files' }, error).debug);
        }.bind(this));

        clean.on('close', function (code) {
          this.emit('message', { 'ok': 'Source cleaned' });
          this.emit('done');
        }.bind(this));

        clean.stdout.on('data', function (data) {
          this.emit('message', data.toString());
        }.bind(this));

        clean.stderr.on('data', function (data) {
          this.emit('message', { 'warning': data.toString() });
        }.bind(this));
      }.bind(this));

      install.stdout.on('data', function (data) {
        this.emit('message', data.toString());
      }.bind(this));

      install.stderr.on('data', function (data) {
        this.emit('message', { 'warning': data.toString() });
      }.bind(this));
    }.bind(this));

    make.stdout.on('data', function (data) {
      this.emit('message', data.toString());
    }.bind(this));

    make.stderr.on('data', function (data) {
      this.emit('message', { 'warning': data.toString() });
    }.bind(this));
  }.bind(this));

  configure.stdout.on('data', function (data) {
    this.emit('message', data.toString());
  }.bind(this));

  configure.stderr.on('data', function (data) {
    this.emit('message', { 'warning': data.toString() });
  }.bind(this));
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(configureMakeInstall, [module]);
};