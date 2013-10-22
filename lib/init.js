var fs = require('fs'),
  apt = require('../main'),
  self,
  debootsrap = false,
  include = ['wget', 'gcc', 'g++', 'build-essential', 'libbz2-dev', 'autoconf',
    'python-all', 'make', 'cmake', 'openssl', 'libssl-dev', 'ca-certificates'],
  arch = 'amd64',
  variant = 'minbase',
  distro = 'precise',
  archive = 'http://archive.ubuntu.com/ubuntu',
  initOS = [
    'mkdir /var/cache/aptjs',
    'mkdir /root/.aptjsrc',
    'echo -e "\n### aptjs' +
      '\nexport HOME="/root";' +
      '\nls 2>/dev/null -A /root/.aptjsrc || . /root/.aptjsrc/*;' +
      '\n###" >> /root/.bashrc'
  ];

module.exports = function init () {
  self = this;

  var AptJson = new(require('./AptJson'))();
  fs.exists(AptJson.Path, function (exists) {
    if ( exists ) {
      return self.emit('error', new Error('Directory already exists'));
    }
    self.emit('message', 'Creating directory ' + AptJson.Path);
    fs.mkdir(AptJson.Path, function (error) {
      if ( error ) {
        return self.emit('error', error);
      }
      apt.load('spawn', 'whereis', ['debootstrap'])
        .on('error', function (error) {
          return self.emit('error', error);
        })
        .on('done', function (spawn) {
          if ( spawn.out.length ) {
            if ( spawn.out[0].match(/^debootstrap:\s\//) ) {
              debootstrap = spawn.out[0].replace(/^debootstrap:\s+/, '').split(/\s+/)[0];
            }
          }
          if ( ! debootstrap ) {
            self.emit('message', 'Installing debootstrap');
          }
          apt.load('spawn', 'sudo', [
            'debootstrap',
            '--arch=' + arch,
            '--variant=' + variant,
            '--include=' + include.join(','),
            distro,
            AptJson.Path,
            archive])
            
            .on('message', function (message) {
              console.log(message);
            })
            
            .on('error', function (error) {
              self.emit('error', error);
            })
            
            .on('done', function (spawn) {
              apt.load('spawn', 'sudo', ['chroot', 'apt', '/bin/bash'])
                
                .on('error', function (error) {
                  self.emit('error', error);
                })

                .on('done', function () {

                });
            });
        });
    });
  });
};