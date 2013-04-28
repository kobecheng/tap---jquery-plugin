# lessCompiler.coffee
#
# compile less to css when files changed

colors = require "/usr/local/lib/node_modules/colors"

console.log "\nLess Compiler Start!".bold.underline + "\n"

fs = require 'fs'
exec = require('child_process').exec
path = require 'path'

recursivePath = require "./recursivePath"

# command of Less
lessc_command = "lessc -x"

# path config
project_dir = path.resolve './', '../'
output_dir = "dist"
input_dir = "ui/less"
main_file = "config.less"

# compile
# invoke lessc to compile
compile = (file, callback)->
  command = "#{lessc_command} #{file} > #{project_dir}/dist/dist-dev.css"

  exec command, encoding: "", callback
# END compiler

# main
# compiler
main = ( file_name, file_path ) ->

  if not /\.less$/.test file_name
    return false

  console.log "Compiling...".yellow.bold.inverse
  console.log "file name: ".green + file_name
  console.log "file path: ".green + "#{file_path}/#{file_name}\n"

  base_name = path.basename file_name, ".less"

  # at first, try to compile main file
  compile "#{project_dir}/#{input_dir}/#{main_file}", ( err, stdout, stderr ) ->

    if err isnt null
      console.log "ERROR".red
      console.log "#{err}"
      
      ###
      if file_name isnt main_file
        # then try to compile the file changed
        compile "#{file_path}/#{file_name}", ( err, stdout, stderr ) ->
          if err isnt null
            console.log "ERR".magenta.inverse
            console.log "File: #{file_path}/#{file_name}".underline
            console.log "Fail to compile!".red.inverse
      ###
      
    else
      console.log "Success!".green.inverse

# END main
main main_file, "#{project_dir}/#{input_dir}"

# watch the input_dir
recursivePath "#{project_dir}/#{input_dir}", ( type, path_cell ) ->
  if type is "dir"
    fs.watch path_cell.realpath, ( event, name ) ->
      if event is "change"
        main name, path_cell.realpath
, 10

fs.watch "#{project_dir}/#{input_dir}", ( event, name ) ->
  if event is "change"
    main name, "#{project_dir}/#{input_dir}"
