# test case base64
define ( require ) ->
  module "Base64"

  Util = require "util"

  Base64 = Util.base64

  CN = "悲剧就是将有价值的东西毁灭给人看。"
  syb = "~!@#$%^&*()_+`-=\\][{}|;\"',./<?>"

  CN_64 = ""
  syb_64 = ""

  test "API", ->
    ok Base64.encode
    ok Base64.decode

  test "Method", ->
    ok Base64.encode
    ok Base64.decode

    strictEqual typeof Base64.encode, "function"
    strictEqual typeof Base64.decode, "function"

  test "Test encode CN", ->
    CN_64 = Base64.encode CN
    ok CN_64

    syb_64 = Base64.encode syb
    ok syb_64

  test "Test encode syb", ->
    syb_64 = Base64.encode syb
    ok syb_64

  test "Test decode CN", ->
    res_CN = Base64.decode CN_64
    ok res_CN
    equal res_CN, CN

  test "Test decode syb", ->
    res_syb = Base64.decode syb_64
    ok res_syb
    equal res_syb, syb

# END define
