# Util.dialog
#
# Base on Twitter Bootstrap Modal

define ( require, exports, module ) ->
  $ = require "bootstrap" # use Bootstrap
  _ = require "underscore"
  Mustache = require "mustache"

  tpl = require "./tpl/dialog.tpl"

  prefix = "zonda-util"

  dialog = (config) ->
    dialog.config = config

    if $("##{prefix}-dialog:visible")[0]
      return false

    dialog_html = Mustache.render tpl,
      title: config.title
      content: config.content
      
    $(document.body).append dialog_html

    if config.css
      $("##{prefix}-dialog").css config.css

    # make button
    _.each config.button, ( button_callback, button_name ) ->
      uid = _.uniqueId("#{prefix}-dialog-button-")

      $("##{prefix}-dialog .modal-footer").append """
        <button id="#{uid}" class="btn btn-success">
          #{button_name}
        </button>
      """

      $("##{uid}").click button_callback
    # END make button

    dialog.dom = $("##{prefix}-dialog")

    # destroy the dialog object
    $("##{prefix}-dialog").on "hide", ->
      delete $("##{prefix}-dialog").modal
      $("##{prefix}-dialog").remove()

    return dialog
  
  # END dialog define

  dialog.open = ->
    # set height of dialog
    $("##{prefix}-dialog .modal-body").css
      "max-height": window.innerHeight-141

    outerHeight = $("##{prefix}-dialog").outerHeight()

    # vertically center
    $("##{prefix}-dialog").css
      "margin-top": -outerHeight/2

    $("##{prefix}-dialog").modal
      show: true
      backdrop: dialog.config.backdrop

    return dialog
  # END dialog.open

  dialog.close = (delay) ->
    if delay
      setTimeout ->
        $("##{prefix}-dialog").modal "hide"
      , delay
    else
      $("##{prefix}-dialog").modal "hide"

    return dialog
  # END dialog.close

  module.exports = dialog
  
# END define
