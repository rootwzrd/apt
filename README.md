apt
======

Low-dependency manager

# Abstract

With `apt`, you can do stuff

`apt-get` meets `npm`! For every dependencies of a project `npm` does not take care of (`mongodb`, `curl`, etc.) -- and that you would have usually to install globally on a machine (provided you are sudo!). `apt` builds the sources in a given folder inside your project, so you don't need to be root. The file `local.json` behaves as a `package.json` with npm - you can install dependencies declared in this file by running `apt install`. `apt` can be invoked inside a node script through `require` or be invoked directly from the terminal if you installed it globally.

# Install

	npm install -g git+https://github.com/co2-git/apt.git

# Features

 - Semantic versioning supported

# Example

    # View available modules
    apt.search(); # terminal> apt search

    # Install a module
    apt.install('mysql'); # terminal> apt install mysql

    # View installed modules
    apt.view(); # terminal> apt view