// Generated by CoffeeScript 1.6.2
/*

alias = {
  "jquery": "vendor/Zonda/vendor/jquery/1.9.1/jquery",
  "underscore": "vendor/Zonda/vendor/underscore/1.4.4/underscore"
}
*/

var app_root, fs, main, path, project_dir;

fs = require("fs");

path = require("path");

project_dir = path.resolve('./', '../');

app_root = fs.readFileSync("" + project_dir + "/tool/.app_root", "utf8");

app_root = app_root.replace("\n", "");

main = function(vendor_root_dir, relative_root_dir) {
  var alias, dependencies, info, list, vendor_name, version_list, _i, _len;

  console.log("------------------------------------------------------------------------");
  console.log("Update Vendors");
  console.log("------------------------------------------------------------------------");
  alias = {};
  dependencies = {};
  info = {};
  list = fs.readdirSync(vendor_root_dir);
  for (_i = 0, _len = list.length; _i < _len; _i++) {
    vendor_name = list[_i];
    version_list = fs.readdirSync("" + vendor_root_dir + "/" + vendor_name);
    alias[vendor_name] = "" + relative_root_dir + "/" + vendor_name + "/" + version_list[0] + "/" + vendor_name;
    dependencies[vendor_name] = "" + vendor_name;
    info[vendor_name] = "" + version_list[0];
  }
  alias.util = "vendor/Zonda/util/util";
  dependencies.util = "util";
  delete alias.sea;
  delete dependencies.sea;
  delete info.sea;
  console.log("------------------------------------------------------------------------");
  console.log("Update Vendors Success!");
  console.log("------------------------------------------------------------------------");
  return {
    alias: alias,
    dependencies: dependencies,
    info: info
  };
};

module.exports = main;