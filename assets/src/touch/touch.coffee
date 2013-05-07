# Layout of this APP
# ------------------
# body append
#
# Require tap---jquery plugins
#
define ( require, exports, module ) ->
  $ = require "../plugins/tap"

  $ ->
    $("body").append """
      <a id="touch" href="http://g.cn" class="test">test</a>
    """
    # define tap-jquery plugin 's endcallback'
    endcall = ->
      alert 'end'

    # 模块调用
    $('#touch').tap endcall

