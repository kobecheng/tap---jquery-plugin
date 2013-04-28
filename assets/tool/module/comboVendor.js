// Generated by CoffeeScript 1.6.1
var colors, combo, fs, listVendor, name, path, project_dir, spm_build_config_info, vendor_list, zonda_vendor_dir, _vendor_content;

fs = require("fs");

path = require("path");

colors = require("/usr/local/lib/node_modules/colors");

listVendor = require("./listVendor");

project_dir = path.resolve('./', '../');

zonda_vendor_dir = "vendor/Zonda/vendor";

vendor_list = listVendor("" + project_dir + "/" + zonda_vendor_dir, zonda_vendor_dir);

fs.writeFileSync("" + project_dir + "/dist/vendor-combo.js", "");

combo = "" + project_dir + "/dist/vendor-combo.js";

spm_build_config_info = fs.readFileSync("" + project_dir + "/etc/spm_build_config.json", "utf8");

spm_build_config_info = JSON.parse(spm_build_config_info);

for (name in spm_build_config_info.dependencies) {
  _vendor_content = fs.readFileSync("" + project_dir + "/" + vendor_list.alias[name] + ".js");
  fs.appendFileSync(combo, _vendor_content);
}
