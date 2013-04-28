# listVendor.coffee
#
# Parameter:
# vendor_root_dir: the realpath of vendor dir
# relative_root_dir: the relativepath of vendor dir
#
# Return:
# list the vendor dir, return a object like this:

###

alias = {
  "jquery": "vendor/Zonda/vendor/jquery/1.9.1/jquery",
  "underscore": "vendor/Zonda/vendor/underscore/1.4.4/underscore"
}

###

fs = require "fs"

main = ( vendor_root_dir, relative_root_dir ) ->
  alias = {}
  dependencies = {}

  list = fs.readdirSync vendor_root_dir

  for vendor_name in list
    version_list = fs.readdirSync "#{vendor_root_dir}/#{vendor_name}"
    # just use the first version, the only one!
    alias[vendor_name] = "#{relative_root_dir}/#{vendor_name}/#{version_list[0]}/#{vendor_name}"
    dependencies[vendor_name] = "#{vendor_name}"

  alias.util = "vendor/Zonda/util/util"
  dependencies.util = "util"

  # remove SeaJS
  delete alias.sea
  delete dependencies.sea

  return {
    alias : alias
    dependencies : dependencies
  }

# END main

module.exports = main
