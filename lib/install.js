var modules = [{
    name: null,
    version: null,
    cwd: process.cwd()
  }],
  $module = modules[0],
  AptJson,
  $installed = [],
  all = 0,
  createAptJsonIfNotExist = function (module) {
    if ( ! AptJson.FileExists ) {
      this.emit('message', { 'warning': 'no apt.json' }, AptJson.File);
      this.emit('message', 'Creating apt.json', AptJson.File);
      return AptJson.init(function (error) {
        if ( error ) {
          return this.emit('error',
            this.emit('message', { 'error': 'Could not create apt.json' }, error).debug);
        }
        this.emit('message', { 'ok': 'apt.json created' });
        if ( ! module.path ) {
            module.path = AptJson.Path;
          }
        verifyIfModuleNotAlreadyInstalled.call(this, module);
      }.bind(this));
    }
    verifyIfModuleNotAlreadyInstalled.call(this, module);
  },
  verifyIfModuleNotAlreadyInstalled = function (module) {
    AptJson.get({ name: module.name }, function (error, modules) {
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

      .set('message prefix', ['Installind dependencies for module '.blue + module.name.bold.blue])

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

      .set('message prefix', ['Downloading tarball for module '.blue + module.name.bold.blue])

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

      .set('message prefix', ['Extracting tarball for module '.blue + module.name.bold.blue])

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

      .set('message prefix', ['Building source for module '.blue + module.name.bold.blue])

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
    AptJson.insert({ name: module.name, version: module.version }, function (error) {
      if ( error ) {
        return this.emit('error',
          this.emit('message', { 'error': 'Could not update Apt.Json' }, error).debug);
      }
      this.emit('message', { 'ok': 'Apt.Json updated' });
      installed.call(this, module);
    }.bind(this));
  },
  installed = function (module) {
    $installed.push(module);
    if ( $installed.length === all ) {
      this.emit('done', $installed);
    }
  };

var install = function (module, config) {
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

  if ( typeof config !== 'object' ) {
    config = {};
  }

  this.emit('message', 'Installing module', { module: $module, config: config });

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
            name: storedModule.name,
            version: $module.version,
            dependencies: {},
            cwd: config.cwd || $module.cwd,
            path: config.path,
            install: null
          };
        
        /* If no version declared, use latest */
        
        if ( ! thisModule.version ) {
          thisModule.version = storedModule.latest;
        }
        
        this.emit('message', 'Version set to ' + thisModule.version);

        /* Make sure version is supported */

        if ( storedModule.versions.indexOf(thisModule.version) === -1 ) {
          return this.emit('error', new Error(
            this.emit('message', { 'error': 'Version not suppored' }, thisModule.version).message));
        }

        /* Get semantic version module */

        var semver = new (require('./semver'))(thisModule.version);

        /* Find install how-to */

        for ( var semantic in storedModule.install ) {
          if ( semver.match(semantic) ) {
            thisModule.install = storedModule.install[semantic];
            break;
          }
        }

        if ( ! thisModule.install ) {
          return this.emit('error', new Error(
            this.emit('message', { 'error': 'How to install not found' },
              { candidates: Object.keys(storedModule.install) }).message));
        }

        /* Find dependencies */

        for ( semantic in storedModule.dependencies ) {
          if ( semver.match(semantic) ) {
            thisModule.dependencies = storedModule.dependencies[semantic];
            break;
          }
        }
        
        AptJson = new (require('./AptJson'))(thisModule.cwd);
        
        if ( AptJson.FileExists ) {
          if ( ! thisModule.path ) {
            thisModule.path = AptJson.Path;
          }
        }

        console.log(thisModule);

        createAptJsonIfNotExist.call(this, thisModule);
      };

      all = storedModules.length;

      storedModules.forEach(forEachModule.bind(this));
    }.bind(this));
};

module.exports = function () {
  var interface = require('./interface');
  return new interface(install, arguments);
};