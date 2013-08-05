apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Road map

apt follows semantic versioning, where `major` represents an incompatible API change, `minor` an implementation, and `patch` a bug fix. Still conformly to semantic versioning, we use tags. Tags reflect the workflow of a feature from incubation to delivery. Tags are:

- dev
- test
- stable

**Note:** stable tag is omitted for readibility.

# Version 0 - Alpha

Following semantic versioning once again, 0 and 1 have different semantics : they do not stand for an incompatible API change - instead, they stand for alpha(0) and beta(1). Alpha versions are *not* meant to be used in production.

## 0.1 - search

View modules from the Lab

## 0.2 - latest
Return latest stable version of a module

## 0.3 - versions
Return all versions of a module

## 0.4 - version
Resolve a semantic version (ie, 1.2.x) to its matching release version

## 0.5 - install
Install a module from the lab to the station

## 0.6 - uninstall
Uninstall a module from station

## 0.7 - update
Update a module in station
