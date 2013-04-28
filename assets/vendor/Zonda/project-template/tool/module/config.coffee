# config.coffee
# -------------
# Generate the etc/env.js, for configure the SeaJS

fs = require "fs"
path = require "path"

listVendor = require "./listVendor"

project_dir = path.resolve './', '../'

app_root = fs.readFileSync "#{project_dir}/tool/.app_root", "utf8"

app_root = app_root.replace "\n", ""

zonda_vendor_dir = "vendor/Zonda/vendor"

vendor_list = listVendor "#{project_dir}/#{zonda_vendor_dir}", zonda_vendor_dir

alias = JSON.stringify vendor_list.alias
dependencies = JSON.stringify vendor_list.dependencies

env = """
  seajs.config({
    base: "#{app_root}",
    charset: "utf-8",
    alias: #{alias}
  });
"""

fs.writeFileSync "#{project_dir}/etc/env.js", env

spm_build_config = """
{
    "name": "dist",
    "root": "#{app_root}",
    "dependencies": #{dependencies},
    "output": {
        "app.js" : "."
    }
}
"""

fs.writeFileSync "#{project_dir}/etc/spm_build_config.json", spm_build_config

less_path_config = """
// Path of ROOT
@root: "#{app_root}";

// Path of images
@img: "#{app_root}/ui/images";

// Path of FontAwesome Font
@FontAwesomePath: "#{app_root}/vendor/Zonda/ui/less/Font-Awesome/font";
"""

fs.writeFileSync "#{project_dir}/etc/less_path_config.less", less_path_config
