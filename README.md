apt
======

## Very, very Alpha!

`apt-get` meets `npm`! For every dependencies of a project `npm` does not take care of (mongodb, curl, python, etc.) and that you would have usually to install globally on a machine provided you are sudo. apt builds the sources in a given folder inside your project so you don't need to be root. The file `local.json` behaves as a `package.json` with npm - you can install dependencies declared in this file by running `apt install`.

# Example

    # View available modules
    apt.search(); # terminal> apt search

    # Install a module
    apt.install('mysql'); # terminal> apt install mysql

    # View installed modules
    apt.view(); # terminal> apt view