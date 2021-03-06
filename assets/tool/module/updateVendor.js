// Generated by CoffeeScript 1.6.2
var app_root, build, colors, exec, fs, listVendor, main, path, project_dir, server_root, vendor_list, zonda_vendor_dir;

colors = require("/usr/local/lib/node_modules/colors");

fs = require("fs");

path = require("path");

exec = require("child_process").exec;

listVendor = require("./listVendor");

project_dir = path.resolve('./', '../');

app_root = fs.readFileSync("" + project_dir + "/tool/.app_root", "utf8");

server_root = fs.readFileSync("" + project_dir + "/tool/.server_root", "utf8");

app_root = app_root.replace("\n", "");

server_root = server_root.replace("\n", "");

zonda_vendor_dir = "vendor/Zonda/vendor";

vendor_list = listVendor("" + project_dir + "/" + zonda_vendor_dir, zonda_vendor_dir);

build = function(path, name, version) {
  return exec("cd " + path + " && spm build -v && cp ./dist/" + name + ".js ./", function(err, stdout) {
    if (err !== null) {
      console.log("ERROR".red.inverse + "build the " + ("" + name + "." + version).red.underline + " failed!");
      console.dir(err);
      return false;
    }
    return console.log(stdout);
  });
};

main = function(name, version) {
  var module_dir, spm_build_config;

  module_dir = path.resolve("" + project_dir + "/vendor/Zonda/vendor/" + name + "/" + version);
  console.log("Update the vendor: " + ("" + name + "/" + version).green);
  if (fs.existsSync("" + module_dir + "/package.json")) {
    spm_build_config = "{\n  \"name\": \"" + name + "\",\n  \"root\": \"" + app_root + "/vendor/Zonda/vendor\",\n  \"version\": \"" + version + "\",\n  \"output\": {\n    \"" + name + ".js\": \".\"\n  }\n}";
    fs.writeFileSync("" + project_dir + "/vendor/Zonda/vendor/" + name + "/" + version + "/package.json", spm_build_config);
    console.log("Generate the package.json for " + ("" + name + "." + version).green.underline + "\n");
    return exec("cd " + module_dir + " && spm build -v && cp ./dist/" + name + ".js ./", function(err, stdout) {
      if (err !== null) {
        console.log("ERROR".red.inverse + "build the " + ("" + name + "." + version).red.underline + " failed!");
        return false;
      }
      return console.log(stdout);
    });
  } else {
    return console.log("WAR".inverse.red + (" vendor " + name).underline + " has no " + "package.json".yellow);
  }
};

module.exports = function() {
  var name, util_dir, _results;

  util_dir = "" + project_dir + "/vendor/Zonda/util";
  fs.writeFileSync("" + project_dir + "/vendor/Zonda/util/package.json", "{\n  \"name\": \"util\",\n  \"root\": \"" + app_root + "/vendor/Zonda\",\n  \"output\": {\n    \"util.js\": \".\"\n  }\n}");
  build(util_dir, "util", "Zonda Util package");
  _results = [];
  for (name in vendor_list.info) {
    _results.push(main(name, vendor_list.info[name]));
  }
  return _results;
};

module.exports();
