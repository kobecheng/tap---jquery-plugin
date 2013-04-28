# recursivePath.coffee
#
# Recursive the path, return dirname or filename
#
# dir: root path of recursion
# callback: invoke the callback when finded a dir/file, and the callback will the name of dir/file
# depth: depth of recursion

fs = require "fs"
path = require "path"

main = ( dir, callback, depth ) ->
  if depth <= 0
    false

  list = []

  if dir.realpath isnt undefined
    list = fs.readdirSync dir.realpath
  else
    list = fs.readdirSync dir

  # delete vim tmp file
  tmp_list = []

  for cell in list
    if /.~$/.test cell
      continue
    if /.swp$/.test cell
      continue
    if /.swo$/.test cell
      continue

    tmp_list.push cell

  list = tmp_list

  try
    # recursion
    for cell in list

      cell =
        realpath : fs.realpathSync "#{dir}/#{cell}"
        name : cell

      if fs.statSync( cell.realpath ).isFile()
        callback 'file', cell, depth
      else
        main cell.realpath, callback, depth-1
        callback 'dir', cell, depth

  catch err
    console.dir err

module.exports = main
