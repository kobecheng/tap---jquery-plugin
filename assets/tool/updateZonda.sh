#!/bin/bash

# Get path
# --------
x=`echo $0 | grep "^/"`
pwdp=`pwd`
if test "${x}"; then                                                                                                                         
  dir=`dirname $0`
else
  dir=`dirname $pwdp/$0`
fi
cd $dir
# --------
# Get path

# Set Path
# --------
# @project_dir: root path of this project
cd ../
project_dir=`pwd`

cd $project_dir
cd vendor/Zonda/project-template/
zonda_project_template=`pwd`

# --------
# Set Path

# Copy the list to Zonda/project-template
# ---------------------------------------
# Template dir:
# dist/
# etc/
# src/
# test/
# tool/
# ui/
# Gruntfile.js: for test APP powered by Zonda
cd $project_dir
rm -rf $zonda_project_template/*

cp -r dist/ $zonda_project_template
cp -r etc/ $zonda_project_template
cp -r mobile-dist/ $zonda_project_template
cp -r src/ $zonda_project_template
cp -r test/ $zonda_project_template
cp -r tool/ $zonda_project_template
cp -r ui/ $zonda_project_template
cp -r Gruntfile.js $zonda_project_template

echo "Nice, Update Zonda Success ~"
echo "------------------------------------------------------------------------"
# ---------------------------------------
# Copy the list to Zonda/project-template
