# comboVendor.coffee
# ------------------
# combo all of the "$app_root/vendor/Zonda/vendor" to "$app_root/dist/vendor-combo.js"

fs = require "fs"
path = require "path"

colors = require "/usr/local/lib/node_modules/colors"

listVendor = require "./listVendor"

project_dir = path.resolve './', '../'

zonda_vendor_dir = "vendor/Zonda/vendor"

# the list of vendor/Zonda/vendor
vendor_list = listVendor "#{project_dir}/#{zonda_vendor_dir}", zonda_vendor_dir

# create the vendor-combo.js
fs.writeFileSync "#{project_dir}/dist/vendor-combo.js", ""

# the realpath of vendor-combo.js
combo = "#{project_dir}/dist/vendor-combo.js"

# read etc/spm_build_config.json to get the order of vendor
spm_build_config_info = fs.readFileSync "#{project_dir}/etc/spm_build_config.json", "utf8"
spm_build_config_info = JSON.parse spm_build_config_info

# combo vendor order by spm_build_config.json's dependencies
for name of spm_build_config_info.dependencies
  _vendor_content = fs.readFileSync "#{project_dir}/#{vendor_list.alias[name]}.js"
  fs.appendFileSync combo, _vendor_content

# END main
