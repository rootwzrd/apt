module.exports = function configureMakeInstall (module, then) {
	var fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    source = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    howTo = module.install.build['configure-make-install'],
    args = [],
    options = { cwd: source },
    self = this,
    apt = require('../main');

  function parse (str) {
    return str
      .replace(/\{\{install path\}\}/g, module.cwd + '/' + module.path +
        '/' + module.name);
  }

  function emitError (error) {
    self.emit('error', error);
  }

  function clean () {
    apt.load('spawn', 'make', ['clean'], { cwd: source })

      .on('error', emitError)

      .on('done', function () {
        self.emit('done');
      });
  }

  function install () {
    apt.load('spawn', 'make', ['install'], { cwd: source })

      .on('error', emitError)

      .on('done', clean);
  }

  function make () {
    self.emit('message', { 'minor': 'make' }, source);

    apt.load('spawn', 'make', [], { cwd: source })

      .on('error', emitError)

      .on('done', install);
  }

  function configure () {
    self.emit('message', { 'minor': 'configure' }, {
      args: args,
      cwd: source
    });
    apt.load('spawn', './configure', args, { cwd: source })
      
      .on('error', emitError)
      
      .on('done', make);
  }

  for ( var option in howTo.configure ) {
    if ( ! option.match(/^\$/) ) {
      args.push(parse(howTo.configure[option].default.apt));
    }
  }

  self.emit('message', { 'minor': 'Building source' }, args);

  self.emit('message', { 'minor': 'Is there something to do before building source?' });

  if ( howTo.configure.$before ) {
    self.emit('message', { 'minor': 'Yes, there is a before' });

    apt.load('spawn', howTo.configure.$before, { cwd: source })
      
      .on('error', emitError)

      .on('done', configure);
  }

  else {
    self.emit('message', { 'minor': 'nothing to do before building source' });
    configure();
  }
};