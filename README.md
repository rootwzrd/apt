apt
======

Low-dependency manager

# Abstract

With `apt`, you can manage your project's low-dependencies (using `apt-get` otherwise) in an embedded OS maintained via a JSON file.

# Advantages

apt installs a light Linux distribution (103MB, Ubuntu 12.04) in the project directory. This eases the development - by being able to ship a standard OS you make sure everybody is working with the same dependencies and installed exactly the same way.

apt does not use apt-get to retrieve dependencies. Instead this is done with NodeJS and a JSON file serves as the database. Dependencies are installed in /opt and are maintained in the JSON file (which is outside the embedded system).


# Install

	npm install -g git+https://github.com/co2-git/apt.git

# Features

# Example

    apt install # will install dependencies declared in Json
    apt install mysql@5.5.x # will install MySQL and automatically update it until 5.6
    apt init # create the embedded OS
    apt run mysql # Run MySQL
    apt start mysql # Start MySQL
    app running # Running services
    apt login # Login to embedded OS