#!/bin/bash

# Config Version
# --------------
# @app_root: position of the "assets" in server
# @mobile_root: for the "file://" in PhoneGap or AppCan
# @app_version: version of this APP
# @framework_version: version of framework
# @sea_version: version of SeaJS

app_root=/assets
mobile_root=/android_asset/www

app_version=dev
framework_version=dev

sea_version=2.0.0

# --------------
# Config Version

# Render the index.html
# ---------------------
# For Web APP and Hybrid APP
# TODO
# ---------------------
# Render the index.html

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
# @seajs_dir: SeaJS path with its version
# @dist_dir: build output dir
cd ../
project_dir=`pwd`

cd vendor/Zonda/vendor/sea/$sea_version/
seajs_dir=`pwd`

cd $project_dir
cd dist/
dist_dir=`pwd`

cd $project_dir
cd mobile-dist/
mobile_dist_dir=`pwd`
# --------
# Set Path

# Function cacheConfig
# --------------------
# Output the config to file for Nodejs
function cacheConfig () {
  cd $project_dir/tool

  echo $app_root > .app_root

  echo $app_version > .app_version
  echo $framework_version > .framework_version
}
# --------------------
# Function cacheConfig

# Function frameMaker
# -------------------
# Initialize The Framework for Build
# Make framework.js and env.js
function frameMaker () {
  cacheConfig;

  cd $project_dir/tool
  # make alias, plugins of SeaJs config, and package.json for SPM
  node module/config.js

  # build the framework-dev.js
  # Cat list. !DO NOT change the file order!!

  cd $seajs_dir
  cat sea-debug.js \
      plugin-text.js \
      plugin-debug.js \
      plugin-shim.js \
      plugin-warning.js \
      $project_dir/etc/env.js \
      > $dist_dir/framework-dev.js

  echo "Framework ready..."
  echo "------------------------------------------------------------------------"

  echo "Compiling New dist-$app_version.css..."
  echo "------------------------------------------------------------------------"
  lessc -x $project_dir/ui/less/config.less > $project_dir/dist/dist-dev.css

}
# -------------------
# Function frameMaker

case $1 in
  # Status::DEV
  # -----------
  # change project's status to "dev"
  dev)
  # Initialize framework.js
  frameMaker;

  # build the dist-dev.js
  # just load the app.js
  echo "seajs.use(\"$app_root/src/app\");" > $dist_dir/app-dev.js

  echo "Zonda in 'DEV' status Now."
  echo "------------------------------------------------------------------------"

  ;;
  # -----------
  # Status::DEV

  # Status::PROD
  # ------------
  # change project's status to "prod"
  prod)
  # Initialize framework.js
  frameMaker;

  cd $project_dir/tool

  # combo vendor file
  node module/comboVendor.js

  cd $project_dir

  # cat the vendor-combo.js to framework-{{framework_version}}.js
  cat $dist_dir/vendor-combo.js >> $dist_dir/framework-$framework_version.js

  # use spm
  spm --build-config=./etc/spm_build_config.json --skip=coffee -v build

  # rename the app.js to be app-{{app_version}}.js
  mv $dist_dir/app.js $dist_dir/app-$app_version.js

  # add SeaJS bootstrap
  echo "seajs.use(\"$app_root/dist/app\");" >> $dist_dir/app-$app_version.js

  echo "Zonda in 'PROD' status Now."
  echo "------------------------------------------------------------------------"

  ;;
  # ------------
  # Status::PROD

  # Status::Mobile
  # --------------
  # Build the Hybrid APP for PhoneGap or AppCan
  mobile)
  # Change $app_root to $mobile_root
  app_root=$mobile_root

  # Clear dir
  rm -rf $mobile_dist_dir/*

  # Initialize framework.js
  frameMaker;

  cd $project_dir/tool

  # combo vendor file
  node module/comboVendor.js

  cd $project_dir

  # Copy the dist/ files to $mobile_dist_dir
  cp $dist_dir/* $mobile_dist_dir/

  # cat the vendor-combo.js to framework-{{framework_version}}.js
  cat $mobile_dist_dir/vendor-combo.js >> $mobile_dist_dir/framework-$framework_version.js

  # use spm
  spm --build-config=./etc/spm_build_config.json --skip=coffee --to $mobile_dist_dir -v build

  # rename the app.js to be app-{{app_version}}.js
  mv $mobile_dist_dir/app.js $mobile_dist_dir/app-$app_version.js
  rm $mobile_dist_dir/app-debug.js $mobile_dist_dir/vendor-combo.js

  # add SeaJS bootstrap
  echo "seajs.use(\"$mobile_root/dist/app\");" >> $mobile_dist_dir/app-$app_version.js

  # Make the dir for Mobile
  cd $mobile_dist_dir/

  mkdir dist
  mv $mobile_dist_dir/* $mobile_dist_dir/dist/

  mkdir ui
  cp -r $project_dir/ui/images $mobile_dist_dir/ui

  cd $mobile_dist_dir
  mkdir vendor
  cd vendor/
  mkdir Zonda
  cd Zonda/
  mkdir ui
  cd ui/
  mkdir less
  cd less/
  mkdir Font-Awesome
  cd Font-Awesome/
  mkdir font
  cd font/

  cp $project_dir/vendor/Zonda/ui/less/Font-Awesome/font/* ./

  echo "PhoneGap/AppCan Version is ready Now, all in $mobile_root"
  echo "------------------------------------------------------------------------"

  # Back to "DEV" status
  cd $project_dir
  bash tool/build.sh dev

  ;;
  # --------------
  # Status::Mobile

  # Help::CLEAR
  # -----------
  clear)
  rm -rf ~/.spm \
    $project_dir/tool/.app_root \
    $project_dir/tool/.app_version \
    $project_dir/tool/.framework_version

  echo "Clear the Cache of Zonda and SPM ~"
  echo "------------------------------------------------------------------------"
  ;;
  # -----------
  # Help::CLEAR

  *)
  ;;
esac
