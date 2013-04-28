# updateVendor.coffee
#
# Build the vendors in Zonda
#
# Parameter:
# @name
# @version
# @app_root

colors = require "/usr/local/lib/node_modules/colors"
fs = require "fs"
path = require "path"
exec = require("child_process").exec

listVendor = require "./listVendor"

project_dir = path.resolve './', '../'

app_root = fs.readFileSync "#{project_dir}/tool/.app_root", "utf8"
server_root = fs.readFileSync "#{project_dir}/tool/.server_root", "utf8"

app_root = app_root.replace "\n", ""
server_root = server_root.replace "\n", ""

zonda_vendor_dir = "vendor/Zonda/vendor"

vendor_list = listVendor "#{project_dir}/#{zonda_vendor_dir}", zonda_vendor_dir

# build
# -----
# Use the SPM to build
build = ( path, name, version ) ->
  exec "cd #{path} && spm build -v && cp ./dist/#{name}.js ./", ( err, stdout ) ->
    if err isnt null
      console.log "ERROR".red.inverse + "build the " + "#{name}.#{version}".red.underline + " failed!"
      console.dir err
      return false

    console.log stdout
# -----
# build

# main
# ----
# To build every vendors
main = ( name, version ) ->
  module_dir = path.resolve "#{project_dir}/vendor/Zonda/vendor/#{name}/#{version}"

  console.log "Update the vendor: " + "#{name}/#{version}".green

  if fs.existsSync "#{module_dir}/package.json"
    spm_build_config = """
      {
        "name": "#{name}",
        "root": "#{app_root}/vendor/Zonda/vendor",
        "version": "#{version}",
        "output": {
          "#{name}.js": "."
        }
      }
    """

    fs.writeFileSync "#{project_dir}/vendor/Zonda/vendor/#{name}/#{version}/package.json", spm_build_config

    console.log "Generate the package.json for " + "#{name}.#{version}".green.underline + "\n"

    exec "cd #{module_dir} && spm build -v && cp ./dist/#{name}.js ./", ( err, stdout ) ->
      if err isnt null
        console.log "ERROR".red.inverse + "build the " + "#{name}.#{version}".red.underline + " failed!"
        return false

      console.log stdout

  else
    console.log "WAR".inverse.red + " vendor #{name}".underline + " has no " + "package.json".yellow
# END main

module.exports = ->

  # Build Zonda.Util
  # ----------------
  util_dir = "#{project_dir}/vendor/Zonda/util"

  fs.writeFileSync "#{project_dir}/vendor/Zonda/util/package.json", """
    {
      "name": "util",
      "root": "#{app_root}/vendor/Zonda",
      "output": {
        "util.js": "."
      }
    }
  """

  build util_dir, "util", "Zonda Util package"
  # ----------------
  # Build Zonda.Util

  for name of vendor_list.info
    main name, vendor_list.info[name]

# END module.exports

# For bash run
do module.exports
