var configureMakeInstall = function (module, then) {
	var fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    spawn = require('./spawn'),
    source = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    howTo = module.install.build['configure-make-install'],
    args = [],
    options = { cwd: source };

  function parse (str) {
    return str
      .replace(/\{\{install path\}\}/g, module.cwd + '/' + module.path +
        '/' + module.name);
  }

  for ( var option in howTo.configure ) {
    if ( ! option.match(/^\$/) ) {
      args.push(parse(howTo.configure[option].default.apt));
    }
  }

  this.emit('message', 'Configuring source', args);

  this.routine = function () {
    spawn('./configure', args, { cwd: source })
      
      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'Could not configure source' }, error).debug);
      }.bind(this))
      
      .on('done', function () {
        this.emit('message', { 'ok': 'Configured' });

        spawn('make', [], { cwd: source })

          .on('error', function (error) {
            this.emit('error',
              this.emit('message', { 'error': 'Could not make source' }, error).debug);
          }.bind(this))

          .on('done', function () {
            spawn('make', ['install'], { cwd: source })

              .on('error', function (error) {
                this.emit('error',
                  this.emit('message', { 'error': 'Could not install source' }, error).debug);
              }.bind(this))

              .on('done', function () {
                spawn('make', ['clean'], { cwd: source })

                  .on('error', function (error) {
                    this.emit('error',
                      this.emit('message', { 'error': 'Could not clean source' }, error).debug);
                  }.bind(this))

                  .on('done', function () {
                    this.emit('done');
                  }.bind(this));
              }.bind(this));
          }.bind(this));
      }.bind(this));
  };

  if ( howTo.configure.$before ) {
    spawn(howTo.configure.$before, { cwd: source })
      
      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'befoore configure failed' }, error).debug);
      }.bind(this))

      .on('done', function () {
        this.routine();
      }.bind(this));
  }

  else {
    this.routine();
  }
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(configureMakeInstall, [module]);
};