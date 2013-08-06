apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Abstract

For any module profiled in its database (The `lab`), apt can intelligently: 

 - find latest version
 - resolve a semantic version(ie, 0.1.x)
 - expose all versions
 - install different versions and/or different builds of the same version
 - update automatically
 - uninstall

# Module profile

Inspired by Travis YAML config, module profiles are stored as JSON objects in a MongoDB database (the `lab`). These profiles contain detailed info on the module, such as where to download it and how to install it.