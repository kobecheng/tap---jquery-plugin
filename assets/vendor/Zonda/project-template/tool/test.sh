#!/bin/bash

# use npm test for Zonda

x=`echo $0 | grep "^/"`
pwdp=`pwd`
if test "${x}"; then                                                                                                                         
  dir=`dirname $0`
else
  dir=`dirname $pwdp/$0`
fi
cd $dir
# go to the this shell dir

# Generate env.js
node module/config.js

cd ../

grunt test
