var semver = function (release) {
	this.release = release;
  var bits = release.split('.');
  this.major = bits[0];
  this.minor = bits[1];
  this.patch = bits[2];
};

semver.prototype.match = function(version) {
  var versionBits = version.split('.'),
    versionMajor = versionBits[0],
    versionMinor = versionBits[1],
    versionPatch = versionBits[2];

  if (  versionMajor === this.major ||
        versionMajor === 'x' || versionMajor === '*' ) {
    if (  versionMinor === this.minor ||
          versionMinor === 'x' || versionMinor === '*' ||
          ! versionMinor ) {
      if (  versionPatch === this.patch ||
            versionPatch === 'x' || versionPatch === '*' ||
            ! versionPatch ) {
        return true;
      }
    }
  }

  return false;
};

module.exports = function (release) {
  return new semver(release);
};