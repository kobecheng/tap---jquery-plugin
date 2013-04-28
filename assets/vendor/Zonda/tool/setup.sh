#!/bin/bash
# 
# Initialize a new project form the "project-template"

x=`echo $0 | grep "^/"`
pwdp=`pwd`
if test "${x}"; then                                                                                                                         
  dir=`dirname $0`
else
  dir=`dirname $pwdp/$0`
fi
cd $dir
# go to the setup.sh dir

cd ../
zonda_dir=`pwd`
cd ../

echo "Create the assets dir for project."
mkdir assets
cd assets/
assets_dir=`pwd`

cp -r $zonda_dir/project-template/* $assets_dir
mv $zonda_dir/node_modules/ $assets_dir

mkdir vendor

echo "Copy Zonda to assets/vendor..."

mv $zonda_dir $assets_dir/vendor

cd $assets_dir

echo "Zonda project is ready now!"

ls -al

# Install Grunt CLI
npm uninstall -g grunt
npm install -g grunt-cli

bash tool/test.sh
