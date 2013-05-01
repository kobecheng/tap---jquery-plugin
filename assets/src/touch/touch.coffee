# Layout of this APP
# ------------------
# Require plugins
#
define ( require, exports, module ) ->
  $ = require "../plugins/tap"

  $ ->
    $("body").append """
      <a id="touch" href="http://g.cn" class="test">test</a>
    """

    endCallback = (event) ->
      alert 1

    $("#touch").tap endCallback
