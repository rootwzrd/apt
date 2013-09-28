var modules = [{
    name: null,
    version: null,
    cwd: process.cwd()
  }],
  $module = modules[0],
  AptJson,
  createAptJsonIfNotExist = function (module) {
    if ( ! AptJson.FileExists ) {
      return AptJson.init(function (error) {
        if ( error ) {
          return this.emit('error',
            this.emit('message', { 'error': 'Could not create apt.json' }, error).debug);
        }
        verifyIfModuleNotAlreadyInstalled.call(this, module);
      }.bind(this));
    }
    verifyIfModuleNotAlreadyInstalled.call(this, module);
  },
  verifyIfModuleNotAlreadyInstalled = function (module) {
    AptJson.get({ name: module.store.name }, function (error, modules) {
      if ( error ) {
        return this.emit('error',
          this.emit('message', { 'error': 'Could not read Apt.Json' }, error).debug);
      }
      if ( modules.length ) {
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'Module already installed' }).message));
      }
      installDependencies.call(this, module);
    }.bind(this));
  },
  installDependencies = function (module) {
    require('./installDependencies')(module)

      .set('message prefix', ['Installind dependencies for module '.blue + module.store.name.bold.blue])

      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'Could not install dependencies' }, error).debug);
      }.bind(this))

      .on('done', function (dependencies) {
        if ( dependencies.length ) {
          this.emit('message', { 'ok': 'dependencies installed' });
        }
        downloadTarball.call(this, module);
      }.bind(this));
  },
  downloadTarball = function (module) {
    require('./downloadTarball')(module)

      .set('message prefix', ['Downloading tarball for module '.blue + module.store.name.bold.blue])

      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'Could not download tarball' }, error).debug);
      }.bind(this))

      .on('done', function () {
        extractTarball.call(this, module);
      }.bind(this));
  },
  extractTarball = function (module) {
    require('./extractTarball')(module)

      .set('message prefix', ['Extracting tarball for module '.blue + module.store.name.bold.blue])

      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'Could not extract tarball' }, error).debug);
      }.bind(this))

      .on('done', function () {
        buildSource.call(this, module);
      }.bind(this));
  },
  buildSource = function (module) {
    require('./buildSource')(module)

      .set('message prefix', ['Building source for module '.blue + module.store.name.bold.blue])

      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'Could not build source' }, error).debug);
      }.bind(this))

      .on('done', function () {
        this.emit('message', { 'ok': 'Source built' });
        updateAptJson.call(this, module);
      }.bind(this));
  },
  updateAptJson = function (module) {
    AptJson.insert(module, function (error) {
      if ( error ) {
        return this.emit('error',
          this.emit('message', { 'error': 'Could not update Apt.Json' }, error).debug);
      }
      this.emit('done');
    }.bind(this));
  };

var install = function (module) {
  this.emit('message', 'Installing module', module);

  switch ( typeof module ) {
    case 'string':
      var id = module.split('@');
      $module.name = id[0];
      if ( id[1] ) {
        $module.version = id[1];
      }
      break;
  }

  this.emit('message', 'Installing module', $module);

  if ( ! $module.name ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'Missing module name', 'debug': $module }).message));
  }

  if ( ! $module.version ) {
    this.emit('message', 'No version requested -- will use latest');
  }

  /* Searching store */
  require('./search')($module)
    .set('message prefix', ['Searching store for '.blue + $module.name.bold.blue])

    .on('error', function (error) {
      this.emit('error', this.emit('message', { 'error': 'Store error' }, error).debug);
    })

    .on('done', function (storedModules) {
      if ( ! storedModules instanceof Array ) {
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'Store response error' }).message));
      }

      if ( ! storedModules.length ) {
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'No such module in store' }, $module).message));
      }

      var forEachModule = function (storedModule) {
        var thisModule = {
            store: storedModule,
            meta: $module
          },
          semver = require('./semver');
        
        /* Verifying if version supported **/
        if ( ! thisModule.meta.version ) {
          thisModule.meta.version = thisModule.store.latest;
        }
        
        this.emit('message', 'Version set to ' + thisModule.meta.version);

        thisModule.meta.semantic = new (require('./semver'))(thisModule.meta.version);
        
        if ( thisModule.meta.version !== thisModule.store.latest ) {
          if ( storedModules.indexOf(thisModule.meta.version) === -1 ) {
            return this.emit('error', new Error(
              this.emit('message', { 'error': 'Version not supported' }).message));
          }
        }
        
        AptJson = new (require('./AptJson'))(thisModule.meta.cwd);
        
        if ( ! AptJson.FileExists ) {
          this.emit('message', { 'warning': 'apt.json not found' });
          this.emit('message', 'Creating apt.json');
        }

        thisModule.meta.Json = AptJson.Json;

        createAptJsonIfNotExist.call(this, thisModule);
      };

      storedModules.forEach(forEachModule.bind(this));
    }.bind(this));
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(install, [module]);
};