(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function makeCanvas() {
  return document.createElement("canvas")
}

var scratchblocks = (window.scratchblocks = module.exports = require("./lib/")(
  window,
  makeCanvas
))

// add our CSS to the page
var style = scratchblocks.makeStyle()
document.head.appendChild(style)

},{"./lib/":6}],2:[function(require,module,exports){
module.exports = (function() {
  function assert(bool, message) {
    if (!bool) throw "Assertion failed! " + (message || "")
  }
  function isArray(o) {
    return o && o.constructor === Array
  }
  function extend(src, dest) {
    return Object.assign({}, dest, src)
  }

  // List of classes we're allowed to override.

  var overrideCategories = [
    "motion",
    "looks",
    "sound",
    "pen",
    "variables",
    "list",
    "events",
    "control",
    "sensing",
    "operators",
    "custom",
    "custom-arg",
    "extension",
    "newextension",
    "music",
    "video",
    "grey",
    "obsolete",
  ]
  var overrideShapes = ["hat", "cap", "stack", "boolean", "reporter", "ring"]

  // languages that should be displayed right to left
  var rtlLanguages = ["ar", "fa", "he"]

  // List of commands taken from Scratch
  var scratchCommands = require("./commands.js")

  var categoriesById = {
    0: "obsolete",
    1: "motion",
    2: "looks",
    3: "sound",
    4: "pen",
    5: "events",
    6: "control",
    7: "sensing",
    8: "operators",
    9: "variables",
    10: "custom",
    11: "parameter",
    12: "list",
    20: "extension",
    42: "grey",
  }

  var typeShapes = {
    " ": "stack",
    b: "boolean",
    c: "c-block",
    e: "if-block",
    f: "cap",
    h: "hat",
    r: "reporter",
    cf: "c-block cap",
    else: "celse",
    end: "cend",
    ring: "ring",
  }

  var inputPat = /(%[a-zA-Z](?:\.[a-zA-Z0-9]+)?)/
  var inputPatGlobal = new RegExp(inputPat.source, "g")
  var iconPat = /(@[a-zA-Z]+)/
  var splitPat = new RegExp(
    [inputPat.source, "|", iconPat.source, "| +"].join(""),
    "g"
  )

  var hexColorPat = /^#(?:[0-9a-fA-F]{3}){1,2}?$/

  function parseSpec(spec) {
    var parts = spec.split(splitPat).filter(x => !!x)
    return {
      spec: spec,
      parts: parts,
      inputs: parts.filter(function(p) {
        return inputPat.test(p)
      }),
      hash: hashSpec(spec),
    }
  }

  function hashSpec(spec) {
    return minifyHash(spec.replace(inputPatGlobal, " _ "))
  }

  function minifyHash(hash) {
    return hash
      .replace(/_/g, " _ ")
      .replace(/ +/g, " ")
      .replace(/[,%?:]/g, "")
      .replace(/ÃŸ/g, "ss")
      .replace(/Ã¤/g, "a")
      .replace(/Ã¶/g, "o")
      .replace(/Ã¼/g, "u")
      .replace(". . .", "...")
      .replace(/^â€¦$/, "...")
      .trim()
      .toLowerCase()
  }

  var blocksBySelector = {}
  var blocksBySpec = {}
  var allBlocks = scratchCommands.map(function(command) {
    var info = extend(parseSpec(command[0]), {
      shape: typeShapes[command[1]], // /[ bcefhr]|cf/
      category: categoriesById[command[2] % 100],
      selector: command[3],
      hasLoopArrow:
        ["doRepeat", "doUntil", "doForever"].indexOf(command[3]) > -1,
    })
    if (info.selector) {
      // nb. command order matters!
      // Scratch 1.4 blocks are listed last
      if (!blocksBySelector[info.selector])
        blocksBySelector[info.selector] = info
    }
    return (blocksBySpec[info.spec] = info)
  })

  var unicodeIcons = {
    "@greenFlag": "âš‘",
    "@turnRight": "â†»",
    "@turnLeft": "â†º",
    "@addInput": "â–¸",
    "@delInput": "â—‚",
  }

  var allLanguages = {}
  function loadLanguage(code, language) {
    var blocksByHash = (language.blocksByHash = {})

    Object.keys(language.commands).forEach(function(spec) {
      var nativeSpec = language.commands[spec]
      var block = blocksBySpec[spec]

      var nativeHash = hashSpec(nativeSpec)
      blocksByHash[nativeHash] = block

      // fallback image replacement, for languages without aliases
      var m = iconPat.exec(spec)
      if (m) {
        var image = m[0]
        var hash = nativeHash.replace(image, unicodeIcons[image])
        blocksByHash[hash] = block
      }
    })

    language.nativeAliases = {}
    Object.keys(language.aliases).forEach(function(alias) {
      var spec = language.aliases[alias]
      var block = blocksBySpec[spec]

      var aliasHash = hashSpec(alias)
      blocksByHash[aliasHash] = block

      language.nativeAliases[spec] = alias
    })

    language.nativeDropdowns = {}
    Object.keys(language.dropdowns).forEach(function(name) {
      var nativeName = language.dropdowns[name]
      language.nativeDropdowns[nativeName] = name
    })

    language.code = code
    allLanguages[code] = language
  }
  function loadLanguages(languages) {
    Object.keys(languages).forEach(function(code) {
      loadLanguage(code, languages[code])
    })
  }

  var english = {
    aliases: {
      "turn left %n degrees": "turn @turnLeft %n degrees",
      "turn ccw %n degrees": "turn @turnLeft %n degrees",
      "turn right %n degrees": "turn @turnRight %n degrees",
      "turn cw %n degrees": "turn @turnRight %n degrees",
      "when gf clicked": "when @greenFlag clicked",
      "when flag clicked": "when @greenFlag clicked",
      "when green flag clicked": "when @greenFlag clicked",
      "clear": "erase all",
    },

    define: ["define"],

    // For ignoring the lt sign in the "when distance < _" block
    ignorelt: ["when distance"],

    // Valid arguments to "of" dropdown, for resolving ambiguous situations
    math: [
      "abs",
      "floor",
      "ceiling",
      "sqrt",
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "ln",
      "log",
      "e ^",
      "10 ^",
    ],

    // For detecting the "stop" cap / stack block
    osis: ["other scripts in sprite", "other scripts in stage"],

    dropdowns: {},

    commands: {},
  }
  allBlocks.forEach(function(info) {
    english.commands[info.spec] = info.spec
  }),
    loadLanguages({
      en: english,
    })

  /*****************************************************************************/

  function disambig(selector1, selector2, test) {
    var func = function(info, children, lang) {
      return blocksBySelector[test(children, lang) ? selector1 : selector2]
    }
    blocksBySelector[selector1].specialCase = blocksBySelector[
      selector2
    ].specialCase = func
  }

  disambig("computeFunction:of:", "getAttribute:of:", function(children, lang) {
    // Operators if math function, otherwise sensing "attribute of" block
    var first = children[0]
    if (!first.isInput) return
    var name = first.value
    return lang.math.indexOf(name) > -1
  })

  disambig("lineCountOfList:", "stringLength:", function(children, lang) {
    // List block if dropdown, otherwise operators
    var last = children[children.length - 1]
    if (!last.isInput) return
    return last.shape === "dropdown"
  })

  disambig("penColor:", "setPenHueTo:", function(children, lang) {
    // Color block if color input, otherwise numeric
    var last = children[children.length - 1]
    // If variable, assume color input, since the RGBA hack is common.
    // TODO fix Scratch :P
    return (last.isInput && last.isColor) || last.isBlock
  })

  blocksBySelector["stopScripts"].specialCase = function(info, children, lang) {
    // Cap block unless argument is "other scripts in sprite"
    var last = children[children.length - 1]
    if (!last.isInput) return
    var value = last.value
    if (lang.osis.indexOf(value) > -1) {
      return extend(blocksBySelector["stopScripts"], {
        shape: "stack",
      })
    }
  }

  function lookupHash(hash, info, children, languages) {
    for (var i = 0; i < languages.length; i++) {
      var lang = languages[i]
      if (lang.blocksByHash.hasOwnProperty(hash)) {
        var block = lang.blocksByHash[hash]
        if (info.shape === "reporter" && block.shape !== "reporter") continue
        if (info.shape === "boolean" && block.shape !== "boolean") continue
        if (block.specialCase) {
          block = block.specialCase(info, children, lang) || block
        }
        return { type: block, lang: lang }
      }
    }
  }

  function lookupDropdown(name, languages) {
    for (var i = 0; i < languages.length; i++) {
      var lang = languages[i]
      if (lang.nativeDropdowns.hasOwnProperty(name)) {
        var nativeName = lang.nativeDropdowns[name]
        return nativeName
      }
    }
  }

  function applyOverrides(info, overrides) {
    for (var i = 0; i < overrides.length; i++) {
      var name = overrides[i]
      if (hexColorPat.test(name)) {
        info.color = name
        info.category = ""
        info.categoryIsDefault = false
      } else if (overrideCategories.indexOf(name) > -1) {
        info.category = name
        info.categoryIsDefault = false
      } else if (overrideShapes.indexOf(name) > -1) {
        info.shape = name
      } else if (name === "loop") {
        info.hasLoopArrow = true
      } else if (name === "+" || name === "-") {
        info.diff = name
      }
    }
  }

  function blockName(block) {
    var words = []
    for (var i = 0; i < block.children.length; i++) {
      var child = block.children[i]
      if (!child.isLabel) return
      words.push(child.value)
    }
    return words.join(" ")
  }

  return {
    loadLanguages,

    blockName,

    allLanguages,
    lookupDropdown,
    hexColorPat,
    minifyHash,
    lookupHash,
    applyOverrides,
    rtlLanguages,
    iconPat,
    hashSpec,

    blocksBySelector,
    parseSpec,
    inputPat,
    unicodeIcons,
    english,
  }
})()

},{"./commands.js":3}],3:[function(require,module,exports){
module.exports = [
  ["move %n steps", " ", 1, "forward:"],
  ["turn @turnRight %n degrees", " ", 1, "turnRight:"],
  ["turn @turnLeft %n degrees", " ", 1, "turnLeft:"],
  ["point in direction %d.direction", " ", 1, "heading:"],
  ["point towards %m.spriteOrMouse", " ", 1, "pointTowards:"],
  ["go to x:%n y:%n", " ", 1, "gotoX:y:"],
  ["go to %r.location", " ", 1, "gotoSpriteOrMouse:"],
  ["glide %n secs to x:%n y:%n", " ", 1, "glideSecs:toX:y:elapsed:from:"],
  ["change x by %n", " ", 1, "changeXposBy:"],
  ["set x to %n", " ", 1, "xpos:"],
  ["change y by %n", " ", 1, "changeYposBy:"],
  ["set y to %n", " ", 1, "ypos:"],
  ["set rotation style %m.rotationStyle", " ", 1, "setRotationStyle"],
  ["say %s for %n secs", " ", 2, "say:duration:elapsed:from:"],
  ["say %s", " ", 2, "say:"],
  ["think %s for %n secs", " ", 2, "think:duration:elapsed:from:"],
  ["think %s", " ", 2, "think:"],
  ["show", " ", 2, "show"],
  ["hide", " ", 2, "hide"],
  ["switch costume to %m.costume", " ", 2, "lookLike:"],
  ["next costume", " ", 2, "nextCostume"],
  ["next backdrop", " ", 102, "nextScene"],
  ["switch backdrop to %m.backdrop", " ", 2, "startScene"],
  ["switch backdrop to %m.backdrop and wait", " ", 102, "startSceneAndWait"],
  ["change %m.effect effect by %n", " ", 2, "changeGraphicEffect:by:"],
  ["set %m.effect effect to %n", " ", 2, "setGraphicEffect:to:"],
  ["clear graphic effects", " ", 2, "filterReset"],
  ["change size by %n", " ", 2, "changeSizeBy:"],
  ["set size to %n%", " ", 2, "setSizeTo:"],
  ["go to front", " ", 2, "comeToFront"],
  ["go back %n layers", " ", 2, "goBackByLayers:"],
  ["play sound %m.sound", " ", 3, "playSound:"],
  ["play sound %m.sound until done", " ", 3, "doPlaySoundAndWait"],
  ["stop all sounds", " ", 3, "stopAllSounds"],
  ["play drum %d.drum for %n beats", " ", 3, "playDrum"],
  ["rest for %n beats", " ", 3, "rest:elapsed:from:"],
  ["play note %d.note for %n beats", " ", 3, "noteOn:duration:elapsed:from:"],
  ["set instrument to %d.instrument", " ", 3, "instrument:"],
  ["change volume by %n", " ", 3, "changeVolumeBy:"],
  ["set volume to %n%", " ", 3, "setVolumeTo:"],
  ["change tempo by %n", " ", 3, "changeTempoBy:"],
  ["set tempo to %n bpm", " ", 3, "setTempoTo:"],
  ["change %m.audioEffect effect by %n", " ", 3, "changeAudioEffectBy:"],
  ["set %m.audioEffect effect to %n", " ", 3, "setAudioEffectTo:"],
  ["erase all", " ", 4, "clearPenTrails"],
  ["stamp", " ", 4, "stampCostume"],
  ["pen down", " ", 4, "putPenDown"],
  ["pen up", " ", 4, "putPenUp"],
  ["set pen color to %c", " ", 4, "penColor:"],
  ["change pen color by %n", " ", 4, "changePenHueBy:"],
  ["set pen color to %n", " ", 4, "setPenHueTo:"],
  ["change pen shade by %n", " ", 4, "changePenShadeBy:"],
  ["set pen shade to %n", " ", 4, "setPenShadeTo:"],
  ["change pen size by %n", " ", 4, "changePenSizeBy:"],
  ["set pen size to %n", " ", 4, "penSize:"],
  ["when @greenFlag clicked", "h", 5, "whenGreenFlag"],
  ["when %m.key key pressed", "h", 5, "whenKeyPressed"],
  ["when this sprite clicked", "h", 5, "whenClicked"],
  ["when backdrop switches to %m.backdrop", "h", 5, "whenSceneStarts"],
  ["when %m.triggerSensor > %n", "h", 5, "whenSensorGreaterThan"],
  ["when I receive %m.broadcast", "h", 5, "whenIReceive"],
  ["broadcast %m.broadcast", " ", 5, "broadcast:"],
  ["broadcast %m.broadcast and wait", " ", 5, "doBroadcastAndWait"],
  ["wait %n seconds", " ", 6, "wait:elapsed:from:"],
  ["repeat %n", "c", 6, "doRepeat"],
  ["forever", "cf", 6, "doForever"],
  ["if %b then", "c", 6, "doIf"],
  ["if %b then", "e", 6, "doIfElse"],
  ["wait until %b", " ", 6, "doWaitUntil"],
  ["repeat until %b", "c", 6, "doUntil"],
  ["stop %m.stop", "f", 6, "stopScripts"],
  ["when I start as a clone", "h", 6, "whenCloned"],
  ["create clone of %m.spriteOnly", " ", 6, "createCloneOf"],
  ["delete this clone", "f", 6, "deleteClone"],
  ["ask %s and wait", " ", 7, "doAsk"],
  ["turn video %m.videoState", " ", 7, "setVideoState"],
  ["set video transparency to %n%", " ", 7, "setVideoTransparency"],
  ["reset timer", " ", 7, "timerReset"],
  ["set %m.var to %s", " ", 9, "setVar:to:"],
  ["change %m.var by %n", " ", 9, "changeVar:by:"],
  ["show variable %m.var", " ", 9, "showVariable:"],
  ["hide variable %m.var", " ", 9, "hideVariable:"],
  ["add %s to %m.list", " ", 12, "append:toList:"],
  ["delete %d.listDeleteItem of %m.list", " ", 12, "deleteLine:ofList:"],
  ["delete all of %m.list", " ", 12, "deleteAll:ofList:"],
  ["if on edge, bounce", " ", 1, "bounceOffEdge"],
  ["insert %s at %d.listItem of %m.list", " ", 12, "insert:at:ofList:"],
  [
    "replace item %d.listItem of %m.list with %s",
    " ",
    12,
    "setLine:ofList:to:",
  ],
  ["show list %m.list", " ", 12, "showList:"],
  ["hide list %m.list", " ", 12, "hideList:"],

  ["x position", "r", 1, "xpos"],
  ["y position", "r", 1, "ypos"],
  ["direction", "r", 1, "heading"],
  ["costume #", "r", 2, "costumeIndex"],
  ["size", "r", 2, "scale"],
  ["backdrop name", "r", 102, "sceneName"],
  ["backdrop #", "r", 102, "backgroundIndex"],
  ["volume", "r", 3, "volume"],
  ["tempo", "r", 3, "tempo"],
  ["touching %m.touching?", "b", 7, "touching:"],
  ["touching color %c?", "b", 7, "touchingColor:"],
  ["color %c is touching %c?", "b", 7, "color:sees:"],
  ["distance to %m.spriteOrMouse", "r", 7, "distanceTo:"],
  ["answer", "r", 7, "answer"],
  ["key %m.key pressed?", "b", 7, "keyPressed:"],
  ["mouse down?", "b", 7, "mousePressed"],
  ["mouse x", "r", 7, "mouseX"],
  ["mouse y", "r", 7, "mouseY"],
  ["loudness", "r", 7, "soundLevel"],
  ["video %m.videoMotionType on %m.stageOrThis", "r", 7, "senseVideoMotion"],
  ["timer", "r", 7, "timer"],
  ["%m.attribute of %m.spriteOrStage", "r", 7, "getAttribute:of:"],
  ["current %m.timeAndDate", "r", 7, "timeAndDate"],
  ["days since 2000", "r", 7, "timestamp"],
  ["username", "r", 7, "getUserName"],
  ["%n + %n", "r", 8, "+"],
  ["%n - %n", "r", 8, "-"],
  ["%n * %n", "r", 8, "*"],
  ["%n / %n", "r", 8, "/"],
  ["pick random %n to %n", "r", 8, "randomFrom:to:"],
  ["%s < %s", "b", 8, "<"],
  ["%s = %s", "b", 8, "="],
  ["%s > %s", "b", 8, ">"],
  ["%b and %b", "b", 8, "&"],
  ["%b or %b", "b", 8, "|"],
  ["not %b", "b", 8, "not"],
  ["join %s %s", "r", 8, "concatenate:with:"],
  ["letter %n of %s", "r", 8, "letter:of:"],
  ["length of %s", "r", 8, "stringLength:"],
  ["%n mod %n", "r", 8, "%"],
  ["round %n", "r", 8, "rounded"],
  ["%m.mathOp of %n", "r", 8, "computeFunction:of:"],
  ["item %d.listItem of %m.list", "r", 12, "getLine:ofList:"],
  ["length of %m.list", "r", 12, "lineCountOfList:"],
  ["%m.list contains %s?", "b", 12, "list:contains:"],

  ["when %m.booleanSensor", "h", 20, ""],
  ["when %m.sensor %m.lessMore %n", "h", 20, ""],
  ["sensor %m.booleanSensor?", "b", 20, ""],
  ["%m.sensor sensor value", "r", 20, ""],

  ["turn %m.motor on for %n secs", " ", 20, ""],
  ["turn %m.motor on", " ", 20, ""],
  ["turn %m.motor off", " ", 20, ""],
  ["set %m.motor power to %n", " ", 20, ""],
  ["set %m.motor2 direction to %m.motorDirection", " ", 20, ""],
  ["when distance %m.lessMore %n", "h", 20, ""],
  ["when tilt %m.eNe %n", "h", 20, ""],
  ["distance", "r", 20, ""],
  ["tilt", "r", 20, ""],

  ["turn %m.motor on for %n seconds", " ", 20, ""],
  ["set light color to %n", " ", 20, ""],
  ["play note %n for %n seconds", " ", 20, ""],
  ["when tilted", "h", 20, ""],
  ["tilt %m.xxx", "r", 20, ""],

  ["else", "else", 6, ""],
  ["end", "end", 6, ""],
  [". . .", " ", 42, ""],

  ["%n @addInput", "ring", 42, ""],

  ["user id", "r", 0, ""],

  ["if %b", "c", 0, "doIf"],
  ["if %b", "e", 0, "doIfElse"],
  ["forever if %b", "cf", 0, "doForeverIf"],
  ["stop script", "f", 0, "doReturn"],
  ["stop all", "f", 0, "stopAll"],
  ["switch to costume %m.costume", " ", 0, "lookLike:"],
  ["next background", " ", 0, "nextScene"],
  ["switch to background %m.backdrop", " ", 0, "startScene"],
  ["background #", "r", 0, "backgroundIndex"],
  ["loud?", "b", 0, "isLoud"],
]

},{}],4:[function(require,module,exports){
/* for constucting SVGs */

function extend(src, dest) {
  return Object.assign({}, dest, src)
}
function assert(bool, message) {
  if (!bool) throw "Assertion failed! " + (message || "")
}

// set by SVG.init
var document
var xml

var directProps = {
  textContent: true,
}

var SVG = (module.exports = {
  init(window, makeCanvas) {
    document = window.document
    var DOMParser = window.DOMParser
    xml = new DOMParser().parseFromString("<xml></xml>", "application/xml")
    SVG.XMLSerializer = window.XMLSerializer

    SVG.makeCanvas = makeCanvas
  },

  cdata(content) {
    return xml.createCDATASection(content)
  },

  el(name, props) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", name)
    return SVG.setProps(el, props)
  },

  setProps(el, props) {
    for (var key in props) {
      var value = "" + props[key]
      if (directProps[key]) {
        el[key] = value
      } else if (/^xlink:/.test(key)) {
        el.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value)
      } else if (props[key] !== null && props.hasOwnProperty(key)) {
        el.setAttributeNS(null, key, value)
      }
    }
    return el
  },

  withChildren(el, children) {
    for (var i = 0; i < children.length; i++) {
      el.appendChild(children[i])
    }
    return el
  },

  group(children) {
    return SVG.withChildren(SVG.el("g"), children)
  },

  newSVG(width, height) {
    return SVG.el("svg", {
      version: "1.1",
      width: width,
      height: height,
    })
  },

  polygon(props) {
    return SVG.el(
      "polygon",
      extend(props, {
        points: props.points.join(" "),
      })
    )
  },

  path(props) {
    return SVG.el(
      "path",
      extend(props, {
        path: null,
        d: props.path.join(" "),
      })
    )
  },

  text(x, y, content, props) {
    var text = SVG.el(
      "text",
      extend(props, {
        x: x,
        y: y,
        textContent: content,
      })
    )
    return text
  },

  symbol(href) {
    return SVG.el("use", {
      "xlink:href": href,
    })
  },

  move(dx, dy, el) {
    SVG.setProps(el, {
      transform: ["translate(", dx, " ", dy, ")"].join(""),
    })
    return el
  },

  translatePath(dx, dy, path) {
    var isX = true
    var parts = path.split(" ")
    var out = []
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i]
      if (part === "A") {
        var j = i + 5
        out.push("A")
        while (i < j) {
          out.push(parts[++i])
        }
        continue
      } else if (/[A-Za-z]/.test(part)) {
        assert(isX)
      } else {
        part = +part
        part += isX ? dx : dy
        isX = !isX
      }
      out.push(part)
    }
    return out.join(" ")
  },

  /* shapes */

  rect(w, h, props) {
    return SVG.el(
      "rect",
      extend(props, {
        x: 0,
        y: 0,
        width: w,
        height: h,
      })
    )
  },

  ellipse(w, h, props) {
    return SVG.el(
      "ellipse",
      extend(props, {
        cx: w / 2,
        cy: h / 2,
        rx: w / 2,
        ry: h / 2,
      })
    )
  },

  arc(p1x, p1y, p2x, p2y, rx, ry) {
    var r = p2y - p1y
    return ["L", p1x, p1y, "A", rx, ry, 0, 0, 1, p2x, p2y].join(" ")
  },

  arcw(p1x, p1y, p2x, p2y, rx, ry) {
    var r = p2y - p1y
    return ["L", p1x, p1y, "A", rx, ry, 0, 0, 0, p2x, p2y].join(" ")
  },

  roundRect(w, h, props) {
    return SVG.rect(
      w,
      h,
      extend(props, {
        rx: 4,
        ry: 4,
      })
    )
  },

  pillRect(w, h, props) {
    var r = h / 2
    return SVG.rect(
      w,
      h,
      extend(props, {
        rx: r,
        ry: r,
      })
    )
  },

  pointedPath(w, h) {
    var r = h / 2
    return [
      "M",
      r,
      0,
      "L",
      w - r,
      0,
      w,
      r,
      "L",
      w,
      r,
      w - r,
      h,
      "L",
      r,
      h,
      0,
      r,
      "L",
      0,
      r,
      r,
      0,
      "Z",
    ]
  },

  pointedRect(w, h, props) {
    return SVG.path(
      extend(props, {
        path: SVG.pointedPath(w, h),
      })
    )
  },


  getTop(w) {
    return ["M", 0, 4,
      // "L", 1, 1,
      // "L", 4, 0,
      "Q", SVG.curve(0, 4, 4, 0, 0),
      ["L", 8, 0].join(" "),
      "c 2 0 3 1 4 2",
      "l 1.5 1.5",
      "c 1 1 2 2 4 2",
      "h 8",
      "c 2 0 3 -1 4 -2",
      "l 1.5 -1.5",
      "c 1 -1 2 -2 4 -2",
      "L", w - 4, 0,
      "Q", SVG.curve(w - 4, 0, w, 4, 0),
      "L", w, 4
    ].join(" ")
  },

  getRingTop(w) {
    return [
      "M",
      0,
      3,
      "L",
      3,
      0,
      "L",
      7,
      0,
      "L",
      10,
      3,
      "L",
      16,
      3,
      "L",
      19,
      0,
      "L",
      w - 3,
      0,
      "L",
      w,
      3,
    ].join(" ")
  },

  getRightAndBottom(w, y, hasNotch, inset) {
    if (typeof inset === "undefined") {
      inset = 0
    }
    //var arr = ["L", w, y - 3, "L", w - 3, y]
    var arr = ["L", w, y - 4, "Q", SVG.curve(w, y - 4, w - 4, y, 0)]
    if (hasNotch) {
      // arr = arr.concat([
      //   "L",
      //   inset + 30,
      //   y,
      //   "L",
      //   inset + 24,
      //   y + 5,
      //   "L",
      //   inset + 14,
      //   y + 5,
      //   "L",
      //   inset + 8,
      //   y,
      // ])
      arr = arr.concat([
        ["L", inset + 35, y].join(" "),
        "c -2 0 -3 1 -4 2",
        "l -1.5 1.5",
        "c -1 1 -2 2 -4 2",
        "h -8",
        "c -2 0 -3 -1 -4 -2",
        "l -1.5 -1.5",
        "c -1 -1 -2 -2 -4 -2",
      ])
    }
    if (inset === 0) {
      arr.push("L", inset + 4, y)
      arr.push("a 4 4 0 0 1 -4 -4")
    } else {
      arr.push("L", inset + 4, y)
      arr.push("a 4 4 0 0 0 -4 4")
    }
    return arr.join(" ")
  },

  getArm(w, armTop) {
    return [
      "L", 10, armTop - 4,
      "a -4 -4 0 0 0 4 4",
      "L", w - 4, armTop,
      "a 4 4 0 0 1 4 4"
    ].join(" ")
  },
  
  

  stackRect(w, h, props) {
    return SVG.path(
      extend(props, {
        path: [SVG.getTop(w), SVG.getRightAndBottom(w, h, true, 0), "Z"],
      })
    )
  },

  capPath(w, h) {
    return [SVG.getTop(w), SVG.getRightAndBottom(w, h, false, 0), "Z"]
  },

  ringCapPath(w, h) {
    return [SVG.getRingTop(w), SVG.getRightAndBottom(w, h, false, 0), "Z"]
  },

  capRect(w, h, props) {
    return SVG.path(
      extend(props, {
        path: SVG.capPath(w, h),
      })
    )
  },

  hatRect(w, h, props) {
    return SVG.path(extend(props, {
      path: [
        "M", 0, 12,
        SVG.arc(0, 10, 65, 10, 65, 85),
        "L", w-4, 10,
        "Q", SVG.curve(w - 4, 10, w, 10 + 4, 0),
        SVG.getRightAndBottom(w, h, true),
        "Z",
      ],
    }));
  },

  curve(p1x, p1y, p2x, p2y, roundness) {
    var roundness = roundness || 0.42
    var midX = (p1x + p2x) / 2.0
    var midY = (p1y + p2y) / 2.0
    var cx = Math.round(midX + roundness * (p2y - p1y))
    var cy = Math.round(midY - roundness * (p2x - p1x))
    return [cx, cy, p2x, p2y].join(" ")
  },

  procHatBase(w, h, archRoundness, props) {
    // TODO use arc()
    // var archRoundness = Math.min(0.2, 35 / w); //used in scratchblocks2
    return SVG.path(extend(props, {
      path: [
        "M", 0, h-3,
        "L", 0, 10,
        "Q", SVG.curve(0, 10, 15, -5, 0),
        "L", w-15, -5,
        "Q", SVG.curve(w-15, -5, w, 10, 0),
        SVG.getRightAndBottom(w, h, true),
      ],
    }));
  },

  procHatCap(w, h, archRoundness) {
    // TODO use arc()
    // TODO this doesn't look quite right
    return SVG.path({
      path: [
        "M",
        -1,
        13,
        "Q",
        SVG.curve(-1, 13, w + 1, 13, archRoundness),
        "Q",
        SVG.curve(w + 1, 13, w, 16, 0.6),
        "Q",
        SVG.curve(w, 16, 0, 16, -archRoundness),
        "Q",
        SVG.curve(0, 16, -1, 13, 0.6),
        "Z",
      ],
      class: "sb-define-hat-cap",
    })
  },

  procHatRect(w, h, props) {
    var q = 52
    var y = h - q

    var archRoundness = Math.min(0.2, 35 / w)

    return SVG.move(
      0,
      y,
      SVG.group([
        SVG.procHatBase(w, q, archRoundness, props),
        //SVG.procHatCap(w, q, archRoundness),
      ])
    )
  },

  mouthRect(w, h, isFinal, lines, props) {
    var y = lines[0].height
    var p = [SVG.getTop(w), SVG.getRightAndBottom(w, y, true, 10)]
    for (var i = 1; i < lines.length; i += 2) {
      var isLast = i + 2 === lines.length

      y += lines[i].height - 3
      p.push(SVG.getArm(w, y))

      var hasNotch = !(isLast && isFinal)
      var inset = isLast ? 0 : 10
      y += lines[i + 1].height + 3
      p.push(SVG.getRightAndBottom(w, y, hasNotch, inset))
    }
    p.push("Z")
    return SVG.path(
      extend(props, {
        path: p,
      })
    )
  },

  ringRect(w, h, cy, cw, ch, shape, props) {
    var r = 8
    var func =
      shape === "reporter"
        ? SVG.roundRect
        : shape === "boolean"
          ? SVG.pointedPath
          : cw < 40 ? SVG.ringCapPath : SVG.capPath
    return SVG.rect(
      w,
      h,
      extend(props, {
        rx: 4,
        ry: 4,
      })
    )
  },

  commentRect(w, h, props) {
    var r = 6
    return SVG.path(
      extend(props, {
        class: "sb-comment",
        path: [
          "M",
          r,
          0,
          SVG.arc(w - r, 0, w, r, r, r),
          SVG.arc(w, h - r, w - r, h, r, r),
          SVG.arc(r, h, 0, h - r, r, r),
          SVG.arc(0, r, r, 0, r, r),
          "Z",
        ],
      })
    )
  },

  commentLine(width, props) {
    return SVG.move(
      -width,
      9,
      SVG.rect(
        width,
        2,
        extend(props, {
          class: "sb-comment-line",
        })
      )
    )
  },

  strikethroughLine(w, props) {
    return SVG.path(
      extend(props, {
        path: ["M", 0, 0, "L", w, 0],
        class: "sb-diff sb-diff-del",
      })
    )
  },
})

},{}],5:[function(require,module,exports){
module.exports = (function() {
  function extend(src, dest) {
    return Object.assign({}, dest, src)
  }

  var SVG = require("./draw.js")

  var Filter = function(id, props) {
    this.el = SVG.el(
      "filter",
      extend(props, {
        id: id,
        x0: "-50%",
        y0: "-50%",
        width: "200%",
        height: "200%",
      })
    )
    this.highestId = 0
  }
  Filter.prototype.fe = function(name, props, children) {
    var shortName = name.toLowerCase().replace(/gaussian|osite/, "")
    var id = [shortName, "-", ++this.highestId].join("")
    this.el.appendChild(
      SVG.withChildren(
        SVG.el(
          "fe" + name,
          extend(props, {
            result: id,
          })
        ),
        children || []
      )
    )
    return id
  }
  Filter.prototype.comp = function(op, in1, in2, props) {
    return this.fe(
      "Composite",
      extend(props, {
        operator: op,
        in: in1,
        in2: in2,
      })
    )
  }
  Filter.prototype.subtract = function(in1, in2) {
    return this.comp("arithmetic", in1, in2, { k2: +1, k3: -1 })
  }
  Filter.prototype.offset = function(dx, dy, in1) {
    return this.fe("Offset", {
      in: in1,
      dx: dx,
      dy: dy,
    })
  }
  Filter.prototype.flood = function(color, opacity, in1) {
    return this.fe("Flood", {
      in: in1,
      "flood-color": color,
      "flood-opacity": opacity,
    })
  }
  Filter.prototype.blur = function(dev, in1) {
    return this.fe("GaussianBlur", {
      in: in1,
      stdDeviation: [dev, dev].join(" "),
    })
  }
  Filter.prototype.colorMatrix = function(in1, values) {
    return this.fe("ColorMatrix", {
      in: in1,
      type: "matrix",
      values: values.join(" "),
    })
  }
  Filter.prototype.merge = function(children) {
    this.fe(
      "Merge",
      {},
      children.map(function(name) {
        return SVG.el("feMergeNode", {
          in: name,
        })
      })
    )
  }

  return Filter
})()

},{"./draw.js":4}],6:[function(require,module,exports){
/*
 * scratchblocks
 * http://scratchblocks.github.io/
 *
 * Copyright 2013-2016, Tim Radvan
 * @license MIT
 * http://opensource.org/licenses/MIT
 */
;(function(mod) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod
  } else {
    var makeCanvas = function() {
      return document.createElement("canvas")
    }
    var scratchblocks = (window.scratchblocks = mod(window, makeCanvas))

    // add our CSS to the page
    document.head.appendChild(scratchblocks.makeStyle())
  }
})(function(window, makeCanvas) {
  "use strict"

  var document = window.document

  /* utils */

  function extend(src, dest) {
    return Object.assign({}, dest, src)
  }

  /*****************************************************************************/

  var { allLanguages, loadLanguages } = require("./blocks.js")

  var parse = require("./syntax.js").parse

  var style = require("./style.js")

  /*****************************************************************************/

  var {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,
  } = require("./model.js")

  /*****************************************************************************/

  var SVG = require("./draw.js")
  SVG.init(window, makeCanvas)

  Label.measuring = (function() {
    var canvas = SVG.makeCanvas()
    return canvas.getContext("2d")
  })()

  /*****************************************************************************/

  function render(doc, cb) {
    return doc.render(cb)
  }

  /*** Render ***/

  // read code from a DOM element
  function readCode(el, options) {
    var options = extend(
      {
        inline: false,
      },
      options
    )

    var html = el.innerHTML.replace(/<br>\s?|\n|\r\n|\r/gi, "\n")
    var pre = document.createElement("pre")
    pre.innerHTML = html
    var code = pre.textContent
    if (options.inline) {
      code = code.replace("\n", "")
    }
    return code
  }

  // insert 'svg' into 'el', with appropriate wrapper elements
  function replace(el, svg, scripts, options) {
    if (options.inline) {
      var container = document.createElement("span")
      var cls = "scratchblocks scratchblocks-inline"
      if (scripts[0] && !scripts[0].isEmpty) {
        cls += " scratchblocks-inline-" + scripts[0].blocks[0].shape
      }
      container.className = cls
      container.style.display = "inline-block"
      container.style.verticalAlign = "middle"
    } else {
      var container = document.createElement("div")
      container.className = "scratchblocks"
    }
    container.appendChild(svg)

    el.innerHTML = ""
    el.appendChild(container)
  }

  /* Render all matching elements in page to shiny scratch blocks.
   * Accepts a CSS selector as an argument.
   *
   *  scratchblocks.renderMatching("pre.blocks");
   *
   * Like the old 'scratchblocks2.parse().
   */
  var renderMatching = function(selector, options) {
    var selector = selector || "pre.blocks"
    var options = extend(
      {
        inline: false,
        languages: ["en"],

        read: readCode, // function(el, options) => code
        parse: parse, // function(code, options) => doc
        render: render, // function(doc, cb) => svg
        replace: replace, // function(el, svg, doc, options)
      },
      options
    )

    // find elements
    var results = [].slice.apply(document.querySelectorAll(selector))
    results.forEach(function(el) {
      var code = options.read(el, options)

      var doc = options.parse(code, options)

      options.render(doc, function(svg) {
        options.replace(el, svg, doc, options)
      })
    })
  }

  /* Parse scratchblocks code and return XML string.
   *
   * Convenience function for Node, really.
   */
  var renderSVGString = function(code, options) {
    var doc = parse(code, options)

    // WARN: Document.render() may become async again in future :-(
    doc.render(function() {})

    return doc.exportSVGString()
  }

  return {
    allLanguages: allLanguages, // read-only
    loadLanguages: loadLanguages,

    fromJSON: Document.fromJSON,
    toJSON: function(doc) {
      return doc.toJSON()
    },
    stringify: function(doc) {
      return doc.stringify()
    },

    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,

    read: readCode,
    parse: parse,
    // render: render, // REMOVED since doc.render(cb) makes much more sense
    replace: replace,
    renderMatching: renderMatching,

    renderSVGString: renderSVGString,
    makeStyle: style.makeStyle,
  }
})

},{"./blocks.js":2,"./draw.js":4,"./model.js":7,"./style.js":8,"./syntax.js":9}],7:[function(require,module,exports){
module.exports = (function() {
  function assert(bool, message) {
    if (!bool) throw "Assertion failed! " + (message || "")
  }
  function isArray(o) {
    return o && o.constructor === Array
  }
  function extend(src, dest) {
    return Object.assign({}, dest, src)
  }

  function indent(text) {
    return text
      .split("\n")
      .map(function(line) {
        return "  " + line
      })
      .join("\n")
  }

  function maybeNumber(v) {
    v = "" + v
    var n = parseInt(v)
    if (!isNaN(n)) {
      return n
    }
    var f = parseFloat(v)
    if (!isNaN(f)) {
      return f
    }
    return v
  }

  var SVG = require("./draw.js")

  var {
    defaultFontFamily,
    makeStyle,
    makeIcons,
    darkRect,
    bevelFilter,
    darkFilter,
    desaturateFilter,
  } = require("./style.js")

  var {
    blocksBySelector,
    parseSpec,
    inputPat,
    iconPat,
    rtlLanguages,
    unicodeIcons,
    english,
    blockName,
  } = require("./blocks.js")

  /* Label */

  var Label = function(value, cls) {
    this.value = value
    this.cls = cls || ""
    this.el = null
    this.height = 11
    this.metrics = null
    this.x = 0
  }
  Label.prototype.isLabel = true

  Label.prototype.stringify = function() {
    if (this.value === "<" || this.value === ">") return this.value
    return this.value.replace(/([<>[\](){}])/g, "\\$1")
  }

  Label.prototype.draw = function() {
    return this.el
  }

  Object.defineProperty(Label.prototype, "width", {
    get: function() {
      return this.metrics.width
    },
  })

  Label.metricsCache = {}
  Label.toMeasure = []

  Label.prototype.measure = function() {
    var value = this.value
    var cls = this.cls
    this.el = SVG.text(0, 10, value, {
      class: "sb-label " + cls,
    })

    var cache = Label.metricsCache[cls]
    if (!cache) {
      cache = Label.metricsCache[cls] = Object.create(null)
    }

    if (Object.hasOwnProperty.call(cache, value)) {
      this.metrics = cache[value]
    } else {
      var font = /sb-comment-label/.test(this.cls)
        ? "normal 11px 'Helvetica Neue', Helvetica, sans-serif"
        : /sb-literal/.test(this.cls)
          ? "normal 11px " + defaultFontFamily
          : "bold 11px " + defaultFontFamily
      this.metrics = cache[value] = Label.measure(value, font)
      // TODO: word-spacing? (fortunately it seems to have no effect!)
    }
  }
  //Text box scaling
  Label.measure = function(value, font) {
    var context = Label.measuring
    context.font = font
    var textMetrics = context.measureText(value)
    var width = (textMetrics.width) | -0.75
    return { width: width }
  }

  /* Icon */

  var Icon = function(name) {
    this.name = name
    this.isArrow = name === "loopArrow"

    var info = Icon.icons[name]
    assert(info, "no info for icon " + name)
    Object.assign(this, info)
  }
  
  Icon.prototype.isIcon = true

  Icon.prototype.stringify = function() {
    return unicodeIcons["@" + this.name] || ""
  }

  Icon.icons = {
    greenFlag: { width: 12, height: 5, dy: -8 },
    turnLeft: { width: 15, height: 12, dy: +1 },
    turnRight: { width: 15, height: 12, dy: +1 },
    loopArrow: { width: 14, height: 11 },
    addInput: { width: 4, height: 8 },
    delInput: { width: 4, height: 8 },
    musicBlock: { width: 26, height: 26 },
    penBlock: { width: 26, height: 26, dy: 2 },
    videoBlock: { width: 26, height: 26, dy: 6.5 },
    line: { width: 0, height: 26 },
    normal: { width: -4, height: 20 },
  }
  
  Icon.prototype.draw = function() {
    if (this.name == "normal") {
      return SVG.el("line", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 20,
      })
    } else if (this.name == "line"){
      return SVG.el("line", {
        class: "sb-outline",
        "stroke-linecap": "round",
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 26,
      })
    } else {
      return SVG.symbol("#" + this.name, {
        width: this.width,
        height: this.height,
      })
    }
  }
  

  /* Input */

  var Input = function(shape, value, menu) {
    this.shape = shape
    this.value = value
    this.menu = menu || null

    this.isRound = shape === "number" || shape === "number-dropdown" || shape === "round-dropdown" || shape === "string"
    this.isBoolean = shape === "boolean"
    this.isStack = shape === "stack"
    this.isInset =
      shape === "boolean" || shape === "stack" || shape === "reporter"
    this.isColor = shape === "color"
    this.hasArrow = shape === "dropdown" || shape === "number-dropdown" || shape === "round-dropdown"
    this.isDarker =
      shape === "boolean" || shape === "stack" || shape === "dropdown" || shape === "round-dropdown"
    this.isSquare =
      shape === "dropdown"

    this.hasLabel = !(this.isColor || this.isInset)
    this.label = this.hasLabel
      ? new Label(value, ["sb-literal-" + this.shape])
      : null
    this.x = 0
  }
  Input.prototype.isInput = true

  Input.fromJSON = function(lang, value, part) {
    var shape = {
      b: "boolean",
      n: "number",
      s: "string",
      d: "number-dropdown",
      m: "dropdown",
      c: "color",
      r: "round-dropdown",
    }[part[1]]

    if (shape === "color") {
      if (!value && value !== 0)
        value = parseInt(Math.random() * 256 * 256 * 256)
      value = +value
      if (value < 0) value = 0xffffffff + value + 1
      var hex = value.toString(16)
      hex = hex.slice(Math.max(0, hex.length - 6)) // last 6 characters
      while (hex.length < 6) hex = "0" + hex
      if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        hex = hex[0] + hex[2] + hex[4]
      }
      value = "#" + hex
    } else if (shape === "dropdown") {
      value =
        {
          _mouse_: "mouse-pointer",
          _myself_: "myself",
          _stage_: "Stage",
          _edge_: "edge",
          _random_: "random position",
        }[value] || value
      var menu = value
      value = lang.dropdowns[value] || value
    } else if (shape === "number-dropdown") {
      value = lang.dropdowns[value] || value
    } else if (shape === "round-dropdown") {
      value = lang.dropdowns[value] || value
    }

    return new Input(shape, "" + value, menu)
  }

  Input.prototype.toJSON = function() {
    if (this.isColor) {
      assert(this.value[0] === "#")
      var h = this.value.slice(1)
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
      return parseInt(h, 16)
      // TODO signed int?
    }
    if (this.hasArrow) {
      var value = this.menu || this.value
      if (this.shape === "dropdown") {
        value =
          {
            "mouse-pointer": "_mouse_",
            myself: "_myself",
            Stage: "_stage_",
            edge: "_edge_",
            "random position": "_random_",
          }[value] || value
      }
      if (this.isRound) {
        value = maybeNumber(value)
      }
      return value
    }
    return this.isBoolean
      ? false
      : this.isRound ? maybeNumber(this.value) : this.value
  }

  Input.prototype.stringify = function() {
    if (this.isColor) {
      assert(this.value[0] === "#")
      return "[" + this.value + "]"
    }
    var text = (this.value ? "" + this.value : "")
      .replace(/ v$/, " \\v")
      .replace(/([\]\\])/g, "\\$1")
    if (this.hasArrow) text += " v"
    return this.isRound
      ? "(" + text + ")"
      : this.isSquare
        ? "[" + text + "]"
        : this.isBoolean ? "<>" : this.isStack ? "{}" : text
  }

  Input.prototype.translate = function(lang) {
    if (this.hasArrow) {
      var value = this.menu || this.value
      this.value = lang.dropdowns[value] || value
      this.label = new Label(this.value, ["sb-literal-" + this.shape])
    }
  }

  Input.prototype.measure = function() {
    if (this.hasLabel) this.label.measure()
  }

  Input.shapes = {
    string: SVG.pillRect,
    number: SVG.pillRect,
    "number-dropdown": SVG.pillRect,
    "round-dropdown": SVG.pillRect,
    color: SVG.pillRect,
    dropdown: SVG.roundRect,

    boolean: SVG.pointedRect,
    stack: SVG.stackRect,
    reporter: SVG.roundRect,
  }

  Input.prototype.draw = function(parent) {
    if (this.hasLabel) {
      var label = this.label.draw()
      var w = Math.max(
        25,
        this.label.width +
          (this.shape === "string" || this.shape === "number-dropdown" || this.shape === "reporter" ? 20 : 20)
      )
    } else {
      var w = this.isInset ? 30 : this.isColor ? 25 : null
    }
    if (this.hasArrow) w += 8
    if (this.shape === "round-dropdown") w += 6
    this.width = w

    var h = (this.height = this.isRound || this.isColor ? 20 : 20)

    var el = Input.shapes[this.shape](w, h)
    if (this.isColor) {
      SVG.setProps(el, {
        fill: this.value,
      })
    } else if (this.isDarker) {
      el = darkRect(w, h, parent.info.category, el)
      if (parent.info.color) {
        SVG.setProps(el, {
          fill: parent.info.color,
        })
      }
    }

    var result = SVG.group([
      SVG.setProps(el, {
        class: ["sb-input", "sb-input-" + this.shape].join(" "),
      }),
    ])
    if (this.hasLabel) {
      var x = this.isRound ? 10 : 6
      result.appendChild(SVG.move(x, 4, label))
    }
    if (this.hasArrow) {
      var y = this.shape === "dropdown" ? 4 : 4
      if (this.shape === "number-dropdown") {
        result.appendChild(SVG.move(w - 16, 8, SVG.symbol("#blackDropdownArrow", {})))
      } else {
        result.appendChild(SVG.move(w - 16, 8, SVG.symbol("#whiteDropdownArrow", {})))
      }
      
    }
    return result
  }

  /* Block */

  var Block = function(info, children, comment) {
    assert(info)
    this.info = info
    this.children = children
    this.comment = comment || null
    this.diff = null

    var shape = this.info.shape
    this.isHat = shape === "hat" || shape === "define-hat"
    this.hasPuzzle = shape === "stack" || shape === "hat"
    this.isFinal = /cap/.test(shape)
    this.isCommand = shape === "stack" || shape === "cap" || /block/.test(shape)
    this.isOutline = shape === "outline"
    this.isReporter = shape === "reporter"
    this.isBoolean = shape === "boolean"

    this.isRing = shape === "ring"
    this.hasScript = /block/.test(shape)
    this.isElse = shape === "celse"
    this.isEnd = shape === "cend"

    this.x = 0
    this.width = null
    this.height = null
    this.firstLine = null
    this.innerWidth = null
    
    switch (this.info.category) {
      default:
        this.children.unshift(new Icon("normal"))
        break
      case "music":
        this.children.unshift(new Icon("line"))
        this.children.unshift(new Icon("musicBlock"))
        this.info.category = "newextension"
        break
      case "pen":
        this.children.unshift(new Icon("line"))
        this.children.unshift(new Icon("penBlock"))
        //this.info.category = "newextension"
        break
      case "video":
        this.children.unshift(new Icon("line"))
        this.children.unshift(new Icon("videoBlock"))
        this.info.category = "newextension"
        break
    }
  }
  Block.prototype.isBlock = true

  Block.fromJSON = function(lang, array, part) {
    var args = array.slice()
    var selector = args.shift()
    if (selector === "procDef") {
      var spec = args[0]
      var inputNames = args[1].slice()
      // var defaultValues = args[2];
      // var isAtomic = args[3]; // TODO

      var info = parseSpec(spec)
      var children = info.parts.map(function(part) {
        if (inputPat.test(part)) {
          var label = new Label(inputNames.shift())
          return new Block(
            {
              shape: part[1] === "b" ? "boolean" : "reporter",
              category: "custom-arg",
            },
            [label]
          )
        } else {
          return new Label(part)
        }
      })
      var outline = new Block(
        {
          shape: "outline",
        },
        children
      )

      var children = [new Label(lang.define[0]), outline]
      return new Block(
        {
          shape: "define-hat",
          category: "custom",
          selector: "procDef",
          call: spec,
          names: args[1],
          language: lang,
        },
        children
      )
    } else if (selector === "call") {
      var spec = args.shift()
      var info = extend(parseSpec(spec), {
        category: "custom",
        shape: "stack",
        selector: "call",
        call: spec,
        language: lang,
      })
      var parts = info.parts
    } else if (
      selector === "readVariable" ||
      selector === "contentsOfList:" ||
      selector === "getParam"
    ) {
      var shape =
        selector === "getParam" && args.pop() === "b" ? "boolean" : "reporter"
      var info = {
        selector: selector,
        shape: shape,
        category: {
          readVariable: "variables",
          "contentsOfList:": "list",
          getParam: "custom-arg",
        }[selector],
        language: lang,
      }
      return new Block(info, [new Label(args[0])])
    } else {
      var info = extend(blocksBySelector[selector], {
        language: lang,
      })
      assert(info, "unknown selector: " + selector)
      var spec = lang.commands[info.spec] || spec
      var parts = spec ? parseSpec(spec).parts : info.parts
    }
    var children = parts.map(function(part) {
      if (inputPat.test(part)) {
        var arg = args.shift()
        return (isArray(arg) ? Block : Input).fromJSON(lang, arg, part)
      } else if (iconPat.test(part)) {
        return new Icon(part.slice(1))
      } else {
        return new Label(part.trim())
      }
    })
    args.forEach(function(list, index) {
      list = list || []
      assert(isArray(list))
      children.push(new Script(list.map(Block.fromJSON.bind(null, lang))))
      if (selector === "doIfElse" && index === 0) {
        children.push(new Label(lang.commands["else"]))
      }
    })
    // TODO loop arrows
    return new Block(info, children)
  }

  Block.prototype.toJSON = function() {
    var selector = this.info.selector
    var args = []

    if (selector === "procDef") {
      var inputNames = this.info.names
      var spec = this.info.call
      var info = parseSpec(spec)
      var defaultValues = info.inputs.map(function(input) {
        return input === "%n" ? 1 : input === "%b" ? false : ""
      })
      var isAtomic = false // TODO 'define-atomic' ??
      return ["procDef", spec, inputNames, defaultValues, isAtomic]
    }

    if (
      selector === "readVariable" ||
      selector === "contentsOfList:" ||
      selector === "getParam"
    ) {
      args.push(blockName(this))
      if (selector === "getParam")
        args.push(this.isBoolean === "boolean" ? "b" : "r")
    } else {
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i]
        if (child.isInput || child.isBlock || child.isScript) {
          args.push(child.toJSON())
        }
      }

      if (selector === "call") {
        return ["call", this.info.call].concat(args)
      }
    }
    if (!selector) throw "unknown block: " + this.info.hash
    return [selector].concat(args)
  }

  Block.prototype.stringify = function(extras) {
    var firstInput = null
    var checkAlias = false
    var text = this.children
      .map(function(child) {
        if (child.isIcon) checkAlias = true
        if (!firstInput && !(child.isLabel || child.isIcon)) firstInput = child
        return child.isScript
          ? "\n" + indent(child.stringify()) + "\n"
          : child.stringify().trim() + " "
      })
      .join("")
      .trim()

    var lang = this.info.language
    if (checkAlias && lang && this.info.selector) {
      var type = blocksBySelector[this.info.selector]
      var spec = type.spec
      var alias = lang.nativeAliases[type.spec]
      if (alias) {
        // TODO make translate() not in-place, and use that
        if (inputPat.test(alias) && firstInput) {
          alias = alias.replace(inputPat, firstInput.stringify())
        }
        return alias
      }
    }

    var overrides = extras || ""
    if (
      (this.info.shape === "reporter" && this.isReporter) ||
      (this.info.category === "custom-arg" &&
        (this.isReporter || this.isBoolean)) ||
      (this.info.category === "custom" && this.info.shape === "stack")
    ) {
      if (overrides) overrides += " "
      overrides += this.info.category
    }
    if (overrides) {
      text += " :: " + overrides
    }
    return this.hasScript
      ? text + "\nend"
      : this.info.shape === "reporter"
        ? "(" + text + ")"
        : this.info.shape === "boolean" ? "<" + text + ">" : text
  }

  Block.prototype.translate = function(lang, isShallow) {
    var selector = this.info.selector
    if (!selector) return
    if (selector === "procDef") {
      assert(this.children[0].isLabel)
      this.children[0] = new Label(lang.define[0] || english.define[0])
    }
    var block = blocksBySelector[selector]
    if (!block) return
    var nativeSpec = lang.commands[block.spec]
    if (!nativeSpec) return
    var nativeInfo = parseSpec(nativeSpec)
    var args = this.children.filter(function(child) {
      return !child.isLabel && !child.isIcon
    })
    if (!isShallow)
      args.forEach(function(child) {
        child.translate(lang)
      })
    this.children = nativeInfo.parts
      .map(function(part) {
        var part = part.trim()
        if (!part) return
        return inputPat.test(part)
          ? args.shift()
          : iconPat.test(part) ? new Icon(part.slice(1)) : new Label(part)
      })
      .filter(x => !!x)
    args.forEach(
      function(arg) {
        this.children.push(arg)
      }.bind(this)
    )
    this.info.language = lang
    this.info.isRTL = rtlLanguages.indexOf(lang.code) > -1
  }

  Block.prototype.measure = function() {
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i]
      if (child.measure) child.measure()
    }
    if (this.comment) this.comment.measure()
  }

  Block.shapes = {
    stack: SVG.stackRect,
    "c-block": SVG.stackRect,
    "if-block": SVG.stackRect,
    celse: SVG.stackRect,
    cend: SVG.stackRect,

    cap: SVG.capRect,
    reporter: SVG.pillRect,
    boolean: SVG.pointedRect,
    hat: SVG.hatRect,
    "define-hat": SVG.procHatRect,
    ring: SVG.ringRect,
  }

  Block.prototype.drawSelf = function(w, h, lines) {
    // mouths
    if (lines.length > 1) {
      return SVG.mouthRect(w, h, this.isFinal, lines, {
        class: ["sb-" + this.info.category, "sb-bevel"].join(" "),
      })
    }

    // outlines
    if (this.info.shape === "outline") {
      return SVG.setProps(SVG.stackRect(w, h), {
        class: "sb-outline",
      })
    }

    // rings
    if (this.isRing) {
      var child = this.children[0]
      if (child && (child.isInput || child.isBlock || child.isScript)) {
        var shape = child.isScript
          ? "stack"
          : child.isInput ? child.shape : child.info.shape
        return SVG.ringRect(w, h, child.y, child.width, child.height, shape, {
          class: ["sb-" + this.info.category, "sb-bevel"].join(" "),
        })
      }
    }

    var func = Block.shapes[this.info.shape]
    assert(func, "no shape func: " + this.info.shape)
    return func(w, h, {
      class: ["sb-" + this.info.category, "sb-bevel"].join(" "),
    })
  }

  Block.prototype.minDistance = function(child) {
    if (this.isBoolean) {
      return child.isReporter
        ? (4 + child.height / 4) | 0
        : child.isLabel
          ? (5 + child.height / 2) | 0
          : child.isBoolean || child.shape === "boolean"
            ? 5
            : (2 + child.height / 2) | 0
    }
    if (this.isReporter) {
      return (child.isInput && child.isRound) ||
        ((child.isReporter || child.isBoolean) && !child.hasScript)
        ? 2
        : child.isLabel
          ? (2 + child.height / 2) | 0
          : (-2 + child.height / 2) | 0
    }
    return 0
  }

  Block.padding = {
    hat: [18, 6, 5],
    "define-hat": [20, 8, 10],
    reporter: [5, 3, 3],
    boolean: [5, 3, 3],
    cap: [11, 6, 6],
    "c-block": [8, 6, 5],
    "if-block": [8, 6, 5],
    ring: [10, 4, 10],
    null: [8, 6, 5],
  }

  Block.prototype.draw = function() {
    var isDefine = this.info.shape === "define-hat"
    var children = this.children

    var padding = Block.padding[this.info.shape] || Block.padding[null]
    var pt = padding[0],
      px = padding[1],
      pb = padding[2]

    var y = 0
    var Line = function(y) {
      this.y = y
      this.width = 0
      this.height = y ? 18 : 16
      this.children = []
    }

    var innerWidth = 0
    var scriptWidth = 0
    var line = new Line(y)
    function pushLine(isLast) {
      if (lines.length === 0) {
        line.height += pt + pb
      } else {
        line.height += isLast ? 0 : +2
        line.y -= 1
      }
      y += line.height
      lines.push(line)
    }

    if (this.info.isRTL) {
      var start = 0
      var flip = function() {
        children = children
          .slice(0, start)
          .concat(children.slice(start, i).reverse())
          .concat(children.slice(i))
      }.bind(this)
      for (var i = 0; i < children.length; i++) {
        if (children[i].isScript) {
          flip()
          start = i + 1
        }
      }
      if (start < i) {
        flip()
      }
    }

    var lines = [] //look at this
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      child.el = child.draw(this)

      if (child.isScript && this.isCommand) {
        this.hasScript = true
        pushLine()
        child.y = y
        lines.push(child)
        scriptWidth = Math.max(scriptWidth, Math.max(1, child.width))  //look at this area
        child.height = Math.max(12, child.height) + 3
        y += child.height
        line = new Line(y)
      } else if (child.isArrow) {
        line.children.push(child)
      } else {
        var cmw = i > 0 ? 32 : 0 // 27
        var md = this.isCommand ? 0 : this.minDistance(child)
        var mw = this.isCommand
          ? child.isBlock || child.isInput ? cmw : 0
          : md
        if (mw && !lines.length && line.width < mw - px) {
          line.width = mw - px
        }
        child.x = line.width
        line.width += child.width
        innerWidth = Math.max(innerWidth, line.width + Math.max(0, md - px))
        //line.width += 1 //4
        if (!child.isLabel) { //text vs reporter padding
          line.width += 5
          line.height = Math.max(line.height, child.height)
        } else {
          line.width += 5
        }
        line.children.push(child)
      }
    }
    pushLine(true)

    innerWidth = Math.max(
      innerWidth + px * 2,
      this.isHat || this.hasScript
        ? 70
        : this.isCommand || this.isOutline || this.isRing ? 45 : 20
    )
    
    this.height = y
    this.width = scriptWidth
      ? Math.max(innerWidth, 10 + scriptWidth)
      : innerWidth
    if (isDefine) {
      var p = Math.min(26, (3.5 + 0.13 * innerWidth) | 0) - 10
      this.height += p
      pt += 2 * p
    }
    
    this.firstLine = lines[0]
    this.innerWidth = innerWidth

    var objects = []

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]
      if (line.isScript) {
        objects.push(SVG.move(10, line.y, line.el))
        continue
      }

      var h = line.height

      for (var j = 0; j < line.children.length; j++) {
        var child = line.children[j]
        if (child.isArrow) {
          objects.push(SVG.move(innerWidth - 10, this.height - 3, child.el))
          continue
        }

        var y = pt + (h - child.height - pt - pb) / 2 - 1
        if (isDefine && child.isLabel) {
          y += 0
        } else if (child.isIcon) {
          y += child.dy | 0
        }
        if (this.isRing) {
          child.y = (line.y + y) | 0
          if (child.isInset) {
            continue
          }
        }
        if (this.isStack) {
          continue
        }
        objects.push(SVG.move(px + child.x, (line.y + y) | 0, child.el))

        if (child.diff === "+") {
          var ellipse = SVG.insEllipse(child.width, child.height)
          objects.push(SVG.move(px + child.x, (line.y + y) | 0, ellipse))
        }
      }
    }

    var el = this.drawSelf(innerWidth, this.height, lines)
    objects.splice(0, 0, el)
    if (this.info.color) {
      SVG.setProps(el, {
        fill: this.info.color,
      })
    }

    return SVG.group(objects)
  }

  /* Comment */

  var Comment = function(value, hasBlock) {
    this.label = new Label(value, ["sb-comment-label"])
    this.width = null
    this.hasBlock = hasBlock
  }
  Comment.prototype.isComment = true
  Comment.lineLength = 16
  Comment.prototype.height = 25

  Comment.prototype.stringify = function() {
    return "// " + this.label.value
  }

  Comment.prototype.measure = function() {
    this.label.measure()
  }

  Comment.prototype.draw = function() {
    var labelEl = this.label.draw()

    this.width = this.label.width + 16
    return SVG.group([
      SVG.commentLine(this.hasBlock ? Comment.lineLength : 0, 6),
      SVG.commentRect(this.width, this.height, {
        class: "sb-comment",
      }),
      SVG.move(8, 6, labelEl),
    ])
  }

  /* Glow */

  var Glow = function(child) {
    assert(child)
    this.child = child
    if (child.isBlock) {
      this.shape = child.info.shape
      this.info = child.info
    } else {
      this.shape = "stack"
    }

    this.width = null
    this.height = null
    this.y = 0
  }
  Glow.prototype.isGlow = true

  Glow.prototype.stringify = function() {
    if (this.child.isBlock) {
      return this.child.stringify("+")
    } else {
      var lines = this.child.stringify().split("\n")
      return lines.map(line => "+ " + line).join("\n")
    }
  }

  Glow.prototype.translate = function(lang) {
    this.child.translate(lang)
  }

  Glow.prototype.measure = function() {
    this.child.measure()
  }

  Glow.prototype.drawSelf = function() {
    var c = this.child
    var el
    var w = this.width
    var h = this.height - 1
    if (c.isScript) {
      if (!c.isEmpty && c.blocks[0].isHat) {
        el = SVG.hatRect(w, h)
      } else if (c.isFinal) {
        el = SVG.capRect(w, h)
      } else {
        el = SVG.stackRect(w, h)
      }
    } else {
      var el = c.drawSelf(w, h, [])
    }
    return SVG.setProps(el, {
      class: "sb-diff sb-diff-ins",
    })
  }
  // TODO how can we always raise Glows above their parents?

  Glow.prototype.draw = function() {
    var c = this.child
    var el = c.isScript ? c.draw(true) : c.draw()

    this.width = c.width
    this.height = (c.isBlock && c.firstLine.height) || c.height

    // encircle
    return SVG.group([el, this.drawSelf()])
  }

  /* Script */

  var Script = function(blocks) {
    this.blocks = blocks
    this.isEmpty = !blocks.length
    this.isFinal = !this.isEmpty && blocks[blocks.length - 1].isFinal
    this.y = 0
  }
  Script.prototype.isScript = true

  Script.fromJSON = function(lang, blocks) {
    // x = array[0], y = array[1];
    return new Script(blocks.map(Block.fromJSON.bind(null, lang)))
  }

  Script.prototype.toJSON = function() {
    if (this.blocks[0] && this.blocks[0].isComment) return
    return this.blocks.map(function(block) {
      return block.toJSON()
    })
  }

  Script.prototype.stringify = function() {
    return this.blocks
      .map(function(block) {
        var line = block.stringify()
        if (block.comment) line += " " + block.comment.stringify()
        return line
      })
      .join("\n")
  }

  Script.prototype.translate = function(lang) {
    this.blocks.forEach(function(block) {
      block.translate(lang)
    })
  }

  Script.prototype.measure = function() {
    for (var i = 0; i < this.blocks.length; i++) {
      this.blocks[i].measure()
    }
  }

  Script.prototype.draw = function(inside) {
    var children = []
    var y = 0
    this.width = 0
    for (var i = 0; i < this.blocks.length; i++) {
      var block = this.blocks[i]
      var x = inside ? 0 : 2
      var child = block.draw()
      children.push(SVG.move(x, y, child))
      this.width = Math.max(this.width, block.width)

      var diff = block.diff
      if (diff === "-") {
        var dw = block.width
        var dh = block.firstLine.height || block.height
        children.push(SVG.move(x, y + dh / 2 + 1, SVG.strikethroughLine(dw)))
        this.width = Math.max(this.width, block.width)
      }

      y += block.height

      var comment = block.comment
      if (comment) {
        var line = block.firstLine
        var cx = block.innerWidth + 2 + Comment.lineLength
        var cy = y - block.height + line.height / 2
        var el = comment.draw()
        children.push(SVG.move(cx, cy - comment.height / 2, el))
        this.width = Math.max(this.width, cx + comment.width)
      }
    }
    this.height = y
    if (!inside && !this.isFinal) {
      this.height += 8
    }
    if (!inside && block.isGlow) {
      this.height += 2 // TODO unbreak this
    }
    return SVG.group(children)
  }

  /* Document */

  var Document = function(scripts) {
    this.scripts = scripts

    this.width = null
    this.height = null
    this.el = null
    this.defs = null
  }

  Document.fromJSON = function(scriptable, lang) {
    var lang = lang || english
    var scripts = scriptable.scripts.map(function(array) {
      var script = Script.fromJSON(lang, array[2])
      script.x = array[0]
      script.y = array[1]
      return script
    })
    // TODO scriptable.scriptComments
    return new Document(scripts)
  }

  Document.prototype.toJSON = function() {
    var jsonScripts = this.scripts
      .map(function(script) {
        var jsonBlocks = script.toJSON()
        if (!jsonBlocks) return
        return [10, script.y + 10, jsonBlocks]
      })
      .filter(x => !!x)
    return {
      scripts: jsonScripts,
      // scriptComments: [], // TODO
    }
  }

  Document.prototype.stringify = function() {
    return this.scripts
      .map(function(script) {
        return script.stringify()
      })
      .join("\n\n")
  }

  Document.prototype.translate = function(lang) {
    this.scripts.forEach(function(script) {
      script.translate(lang)
    })
  }

  Document.prototype.measure = function() {
    this.scripts.forEach(function(script) {
      script.measure()
    })
  }

  Document.prototype.render = function(cb) {
    // measure strings
    this.measure()

    // TODO: separate layout + render steps.
    // render each script
    var width = 0
    var height = 0
    var elements = []
    for (var i = 0; i < this.scripts.length; i++) {
      var script = this.scripts[i]
      if (height) height += 10
      script.y = height
      elements.push(SVG.move(0, height, script.draw()))
      height += script.height
      width = Math.max(width, script.width + 4)
    }
    this.width = width
    this.height = height

    // return SVG
    var svg = SVG.newSVG(width, height)
    svg.appendChild(
      (this.defs = SVG.withChildren(
        SVG.el("defs"),
        [
          bevelFilter("bevelFilter", false),
          bevelFilter("inputBevelFilter", true),
          darkFilter("inputDarkFilter"),
          desaturateFilter("desaturateFilter"),
        ].concat(makeIcons())
      ))
    )

    svg.appendChild(SVG.group(elements))
    this.el = svg

    // nb: async API only for backwards/forwards compatibility reasons.
    // despite appearances, it runs synchronously
    cb(svg)
  }

  /* Export SVG image as XML string */
  Document.prototype.exportSVGString = function() {
    assert(this.el, "call draw() first")

    var style = makeStyle()
    this.defs.appendChild(style)
    var xml = new SVG.XMLSerializer().serializeToString(this.el)
    this.defs.removeChild(style)
    return xml
  }

  /* Export SVG image as data URI */
  Document.prototype.exportSVG = function() {
    var xml = this.exportSVGString()
    return "data:image/svg+xml;utf8," + xml.replace(/[#]/g, encodeURIComponent)
  }

  Document.prototype.exportPNG = function(cb) {
    var canvas = SVG.makeCanvas()
    canvas.width = this.width
    canvas.height = this.height
    var context = canvas.getContext("2d")

    var image = new Image()
    image.src = this.exportSVG()
    image.onload = function() {
      context.drawImage(image, 0, 0)

      if (URL && URL.createObjectURL && Blob && canvas.toBlob) {
        var blob = canvas.toBlob(function(blob) {
          cb(URL.createObjectURL(blob))
        }, "image/png")
      } else {
        cb(canvas.toDataURL("image/png"))
      }
    }
  }

  return {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Glow,
    Script,
    Document,
  }
})()

},{"./blocks.js":2,"./draw.js":4,"./style.js":8}],8:[function(require,module,exports){
var SVG = require("./draw.js")
var Filter = require("./filter.js")

var Style = (module.exports = {
  cssContent: `
    .sb-label {
      font-family: "Helvetica Neue", Helvetica, sans-serif;
      font-weight: normal;
      fill: #fff;
      font-size: 11px;
      word-spacing: 0px;
      opacity: 1;
    }

    .sb-obsolete { fill: #ED4242; }
    .sb-motion { fill: #4C97FF; }
    .sb-looks { fill: #9966FF; }
    .sb-sound { fill: #CF63CF; }
    .sb-pen { fill: #0fBD8C;  }
    .sb-events { fill: #FFBF00; }
    .sb-control { fill: #FFAB19; }
    .sb-sensing { fill: #5CB1D6; }
    .sb-operators { fill: #59C059; }
    .sb-variables { fill: #FF8C1A; }
    .sb-list { fill: #FF661A }
    .sb-custom { fill: #FF6680; }
    .sb-custom-arg { fill: #FF6680; }
    .sb-extension { fill: #4b4a60; }
    .sb-newextension { fill: #0fbd8c; }
    .sb-grey { fill: #969696; }

    .sb-bevel {
      filter2: url(#bevelFilter);
      stroke: #000;
      stroke-opacity: 0.15;
      stroke-alignment: inner;
    }
    .sb-input-round-dropdown,
    .sb-input-boolean {
      filter: url(#inputDarkFilter);
    }
    .sb-input {
      filter2: url(#inputBevelFilter);
      stroke: #000;
      stroke-opacity: 0.15;
      stroke-alignment: inner;
    }
    .sb-input-number,
    .sb-input-string,
    .sb-input-number-dropdown {
      fill: #fff;
    }
    .sb-literal-number,
    .sb-literal-string,
    .sb-literal-number-dropdown,
    .sb-literal-dropdown {
      font-weight: normal;
      font-size: 11px;
      word-spacing: 0;
    }
    .sb-literal-number,
    .sb-literal-string,
    .sb-literal-number-dropdown {
      fill: #444;
    }

    .sb-darker {
      filter2: url(#inputDarkFilter);
      stroke: #000;
      stroke-opacity: 0.1;
      stroke-alignment: inner;
    }
    .sb-desaturate {
      filter: url(#desaturateFilter);
    }

    .sb-outline {
      stroke: #000;
      stroke-opacity: 0.1;
      stroke-width: 1;
      fill: #FF4D6A;
    }

    .sb-define-hat-cap {
      stroke: #632d99;
      stroke-width: 1;
      fill: #8e2ec2;
    }

    .sb-comment {
      fill: #E4DB8C;
      stroke: #000;
      stroke-opacity: 0.2;
      stroke-width: 1;
    }
    .sb-comment-line {
      fill: #000;
      opacity: 0.2;
    }
    .sb-comment-label {
      font-family: "Helvetica Neue", Helvetica, sans-serif;
      font-weight: normal;
      fill: #000;
      font-size: 11px;
      word-spacing: 0px;
      opacity: 1;
    }

    .sb-diff {
      fill: none;
      stroke: #000;
    }
    .sb-diff-ins {
      stroke-width: 2px;
    }
    .sb-diff-del {
      stroke-width: 3px;
    }
  `.replace(/[ \n]+/, " "),

  makeIcons() {
    return [
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4-1 1v18.8c0 .5.5 1 1 1h.1c.5 0 1-.5 1-1v-6.4c1-.7 2.1-1.2 3.4-1.3 1.2 0 2.4.4 3.4 1.2 2.9 2.3 7 2.3 9.8 0 .3-.2.4-.5.4-.9V4.7c0-.5-.3-.9-.8-1zm-.3 10.2C18 16 14.4 16 11.9 14c-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2l.1.1-.1 9.2z",
            fill: "#45993d",
          }),
          SVG.el("path", {
            d:
              "M20.6 4.8l-.1 9.1v.1c-2.5 2-6.1 2-8.6 0-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2c0 .1.1.1.1.2z",
            fill: "#4cbf56",
          }),
        ]),
        {
          id: "greenFlag",
          transform: "scale(0.65) translate(-3 4)", // TODO
        }
      ),
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z",
            fill: "#3d79cc",
          }),
          SVG.el("path", {
            d:
              "M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z",
            fill: "#fff",
          }),
        ]),
        {
          id: "turnRight",
          transform: "scale(0.65) translate(-2 -5)", // TODO
        }
      ),
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z",
            fill: "#3d79cc",
          }),
          SVG.el("path", {
            d:
              "M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z",
            fill: "#fff",
          }),
        ]),
        {
          id: "turnLeft",
          transform: "scale(0.65) translate(-2 -5)", // TODO
        }
      ),
      SVG.el("path", {
        d: "M0 0L4 4L0 8Z",
        fill: "#111",
        id: "addInput",
      }),
      SVG.el("path", {
        d: "M4 0L4 8L0 4Z",
        fill: "#111",
        id: "delInput",
      }),
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z",
            fill: "#cf8b17",
          }),
          SVG.el("path", {
            d:
              "M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z",
            fill: "#fff",
          }),
        ]),
        {
          id: "loopArrow",
          transform: "scale(0.65) translate(-15 -25)", // TODO
        }
      ),
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z",
            fill: "#231f20",
            opacity: ".1",
          }),
          SVG.el("path", {
            d:
              "M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z",
            fill: "#fff",
          }),
        ]),
        {
          id: "whiteDropdownArrow",
          transform: "scale(0.65)",
        }
      ),
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z",
            fill: "#231f20",
            opacity: ".1",
          }),
          SVG.el("path", {
            d:
              "M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z",
            fill: "#111",
          }),
        ]),
        {
          id: "blackDropdownArrow",
          transform: "scale(0.65)",
        }
      ),
      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z",
            stroke: "#000",
            "stroke-opacity": ".1",
          }),
          SVG.el("path", {
            d:
              "M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z",
            fill: "#FFF",
          }),
        ]),
        {
          id: "musicBlock",
          fill: "none",
          transform: "scale(0.65)"
        }
      ),

      SVG.setProps(
        SVG.group([
          SVG.el("path", {
            d:
              "M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012",
            fill: "#FFF",
          }),
          SVG.el("path", {
            d:
              "M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546",
          }),
          SVG.el("path", {
            d:
              "M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102",
            fill: "#4C97FF",
          }),
          SVG.el("path", {
            d:
              "M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856",
            fill: "#575E75",
            opacity: ".15",
          }),
          SVG.el("path", {
            d: "M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z",
            fill: "#575E75",
          }),
        ]),
        {
          id: "penBlock",
          stroke: "#575E75",
          fill: "none",
          "stroke-linejoin": "round",
          transform: "scale(0.65)"
        }
      ),

      SVG.setProps(
        SVG.group([
          SVG.el("circle", {
            opacity: 0.25,
            cx: 32,
            cy: 16,
            r: 4.5,
          }),
          SVG.el("circle", {
            opacity: 0.5,
            cx: 32,
            cy: 12,
            r: 4.5,
          }),
          SVG.el("circle", {
            opacity: 0.75,
            cx: 32,
            cy: 8,
            r: 4.5,
          }),
          SVG.el("circle", {
            cx: 32,
            cy: 4,
            r: 4.5,
          }),
          SVG.el("path", {
            d:
              "M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z",
            fill: "#4D4D4D",
            "stroke-linejoin": "round",
          }),
        ]),
        {
          id: "videoBlock",
          stroke: "#000",
          fill: "#FFF",
          "stroke-opacity": 0.15,
          transform: "scale(0.65)"
        }
      ),
    ]
  },

  makeStyle() {
    var style = SVG.el("style")
    style.appendChild(SVG.cdata(Style.cssContent))
    return style
  },

  bevelFilter(id, inset) {
    var f = new Filter(id)

    var alpha = "SourceAlpha"
    var s = inset ? -1 : 1
    var blur = f.blur(1, alpha)

    f.merge([
      "SourceGraphic",
      f.comp(
        "in",
        f.flood("#fff", 0.15),
        f.subtract(alpha, f.offset(+s, +s, blur))
      ),
      f.comp(
        "in",
        f.flood("#0f0", 0.7),
        f.subtract(alpha, f.offset(-s, -s, blur))
      ),
    ])

    return f.el
  },

  darkFilter(id) {
    var f = new Filter(id)

    f.merge([
      "SourceGraphic",
      f.comp("in", f.flood("#000", 0.2), "SourceAlpha"),
    ])

    return f.el
  },

  desaturateFilter(id) {
    var f = new Filter(id)

    var q = 0.333
    var s = 0.333
    f.colorMatrix("SourceGraphic", [
      q,
      s,
      s,
      0,
      0,
      s,
      q,
      s,
      0,
      0,
      s,
      s,
      q,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ])

    return f.el
  },

  darkRect(w, h, category, el) {
    return SVG.setProps(
      SVG.group([
        SVG.setProps(el, {
          class: ["sb-" + category, "sb-darker"].join(" "),
        }),
      ]),
      { width: w, height: h }
    )
  },

  defaultFontFamily: "'Helvetica Neue', Helvetica, sans-serif",
})

},{"./draw.js":4,"./filter.js":5}],9:[function(require,module,exports){
module.exports = (function() {
  function extend(src, dest) {
    return Object.assign({}, dest, src)
  }
  function isArray(o) {
    return o && o.constructor === Array
  }
  function assert(bool, message) {
    if (!bool) throw "Assertion failed! " + (message || "")
  }

  var {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Glow,
    Script,
    Document,
  } = require("./model.js")

  var {
    allLanguages,
    lookupDropdown,
    hexColorPat,
    minifyHash,
    lookupHash,
    hashSpec,
    applyOverrides,
    rtlLanguages,
    iconPat,
    blockName,
  } = require("./blocks.js")

  function paintBlock(info, children, languages) {
    var overrides = []
    if (isArray(children[children.length - 1])) {
      overrides = children.pop()
    }

    // build hash
    var words = []
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      if (child.isLabel) {
        words.push(child.value)
      } else if (child.isIcon) {
        words.push("@" + child.name)
      } else {
        words.push("_")
      }
    }
    var hash = (info.hash = minifyHash(words.join(" ")))

    // paint
    var o = lookupHash(hash, info, children, languages)
    if (o) {
      var lang = o.lang
      var type = o.type
      info.language = lang
      info.isRTL = rtlLanguages.indexOf(lang.code) > -1

      if (
        type.shape === "ring"
          ? info.shape === "reporter"
          : info.shape === "stack"
      ) {
        info.shape = type.shape
      }
      info.category = type.category
      info.categoryIsDefault = false
      if (type.selector) info.selector = type.selector // for toJSON
      info.hasLoopArrow = type.hasLoopArrow

      // ellipsis block
      if (type.spec === ". . .") {
        children = [new Label(". . .")]
      }
    }

    // overrides
    applyOverrides(info, overrides)

    // loop arrows
    if (info.hasLoopArrow) {
      children.push(new Icon("loopArrow"))
    }

    var block = new Block(info, children)

    // image replacement
    if (type && iconPat.test(type.spec)) {
      block.translate(lang, true)
    }

    // diffs
    if (info.diff === "+") {
      return new Glow(block)
    } else {
      block.diff = info.diff
    }
    return block
  }

  function parseLines(code, languages) {
    var tok = code[0]
    var index = 0
    function next() {
      tok = code[++index]
    }
    function peek() {
      return code[index + 1]
    }
    function peekNonWs() {
      for (var i = index + 1; i < code.length; i++) {
        if (code[i] !== " ") return code[i]
      }
    }
    var sawNL

    var define = []
    languages.map(function(lang) {
      define = define.concat(lang.define)
    })
    // NB. we assume 'define' is a single word in every language
    function isDefine(word) {
      return define.indexOf(word) > -1
    }

    function makeBlock(shape, children) {
      var hasInputs = !!children.filter(function(x) {
        return !x.isLabel
      }).length
      var info = {
        shape: shape,
        category:
          shape === "define-hat"
            ? "custom"
            : shape === "reporter" && !hasInputs ? "variables" : "obsolete",
        categoryIsDefault: true,
        hasLoopArrow: false,
      }
      return paintBlock(info, children, languages)
    }

    function makeMenu(shape, value) {
      var menu = lookupDropdown(value, languages) || value
      return new Input(shape, value, menu)
    }

    function pParts(end) {
      var children = []
      var label
      while (tok && tok !== "\n") {
        if (tok === "<" || (tok === ">" && end === ">")) {
          var last = children[children.length - 1]
          var c = peekNonWs()
          if (
            last &&
            !last.isLabel &&
            (c === "[" || c === "(" || c === "<" || c === "{")
          ) {
            label = null
            children.push(new Label(tok))
            next()
            continue
          }
        }
        if (tok === end) break
        if (tok === "/" && peek() === "/" && !end) break

        switch (tok) {
          case "[":
            label = null
            children.push(pString())
            break
          case "(":
            label = null
            children.push(pReporter())
            break
          case "<":
            label = null
            children.push(pPredicate())
            break
          case "{":
            label = null
            children.push(pEmbedded())
            break
          case " ":
          case "\t":
            next()
            if (label && isDefine(label.value)) {
              // define hat
              children.push(pOutline())
              return children
            }
            label = null
            break
          case "â—‚":
          case "â–¸":
            children.push(pIcon())
            label = null
            break
          case "@":
            next()
            var name = ""
            while (tok && /[a-zA-Z]/.test(tok)) {
              name += tok
              next()
            }
            if (name === "cloud") {
              children.push(new Label("â˜"))
            } else {
              children.push(
                Icon.icons.hasOwnProperty(name)
                  ? new Icon(name)
                  : new Label("@" + name)
              )
            }
            label = null
            break
          case "\\":
            next() // escape character
          // fall-thru
          case ":":
            if (tok === ":" && peek() === ":") {
              children.push(pOverrides(end))
              return children
            } // fall-thru
          default:
            if (!label) children.push((label = new Label("")))
            label.value += tok
            next()
        }
      }
      return children
    }

    function pString() {
      next() // '['
      var s = ""
      var escapeV = false
      while (tok && tok !== "]" && tok !== "\n") {
        if (tok === "\\") {
          next()
          if (tok === "v") escapeV = true
          if (!tok) break
        } else {
          escapeV = false
        }
        s += tok
        next()
      }
      if (tok === "]") next()
      if (hexColorPat.test(s)) {
        return new Input("color", s)
      }
      return !escapeV && / v$/.test(s)
        ? makeMenu("dropdown", s.slice(0, s.length - 2))
        : new Input("string", s)
    }

    function pBlock(end) {
      var children = pParts(end)
      if (tok && tok === "\n") {
        sawNL = true
        next()
      }
      if (children.length === 0) return

      // define hats
      var first = children[0]
      if (first && first.isLabel && isDefine(first.value)) {
        if (children.length < 2) {
          children.push(makeBlock("outline", []))
        }
        return makeBlock("define-hat", children)
      }

      // standalone reporters
      if (children.length === 1) {
        var child = children[0]
        if (
          child.isBlock &&
          (child.isReporter || child.isBoolean || child.isRing)
        ) {
          return child
        }
      }

      return makeBlock("stack", children)
    }

    function pReporter() {
      next() // '('

      // empty number-dropdown
      if (tok === " ") {
        next()
        if (tok === "vv" && peek() === ")") {
          next()
          next()
          return new Input("number-dropdown", "")
        }
        if (tok === "v" && peek() === ")") {
          next()
          next()
          return new Input("round-dropdown", "")
        }
      }

      var children = pParts(")")
      if (tok && tok === ")") next()

      // empty numbers
      if (children.length === 0) {
        return new Input("number", "")
      }

      // number
      if (children.length === 1 && children[0].isLabel) {
        var value = children[0].value
        if (/^[0-9e.-]*$/.test(value)) {
          return new Input("number", value)
        }
      }

      // number-dropdown
      for (var i = 0; i < children.length; i++) {
        if (!children[i].isLabel) {
          break
        }
      }
      if (i === children.length) {
        var last = children[i - 1]
        if (i > 1 && last.value === "vv") {
          children.pop()
          var value = children
            .map(function(l) {
              return l.value
            })
            .join(" ")
          return makeMenu("number-dropdown", value)
        }
        if (i > 1 && last.value === "v") {
          children.pop()
          var value = children
            .map(function(l) {
              return l.value
            })
            .join(" ")
          return makeMenu("round-dropdown", value)
        }
      }

      var block = makeBlock("reporter", children)

      // rings
      if (block.info.shape === "ring") {
        var first = block.children[0]
        if (
          first &&
          first.isInput &&
          first.shape === "number" &&
          first.value === ""
        ) {
          block.children[0] = new Input("reporter")
        } else if (
          (first && first.isScript && first.isEmpty) ||
          (first && first.isBlock && !first.children.length)
        ) {
          block.children[0] = new Input("stack")
        }
      }

      return block
    }

    function pPredicate() {
      next() // '<'
      var children = pParts(">")
      if (tok && tok === ">") next()
      if (children.length === 0) {
        return new Input("boolean")
      }
      return makeBlock("boolean", children)
    }

    function pEmbedded() {
      next() // '{'

      sawNL = false
      var f = function() {
        while (tok && tok !== "}") {
          var block = pBlock("}")
          if (block) return block
        }
      }
      var scripts = parseScripts(f)
      var blocks = []
      scripts.forEach(function(script) {
        blocks = blocks.concat(script.blocks)
      })

      if (tok === "}") next()
      if (!sawNL) {
        assert(blocks.length <= 1)
        return blocks.length ? blocks[0] : makeBlock("stack", [])
      }
      return new Script(blocks)
    }

    function pIcon() {
      var c = tok
      next()
      switch (c) {
        case "â–¸":
          return new Icon("addInput")
        case "â—‚":
          return new Icon("delInput")
      }
    }

    function pOverrides(end) {
      next()
      next()
      var overrides = []
      var override = ""
      while (tok && tok !== "\n" && tok !== end) {
        if (tok === " ") {
          if (override) {
            overrides.push(override)
            override = ""
          }
        } else if (tok === "/" && peek() === "/") {
          break
        } else {
          override += tok
        }
        next()
      }
      if (override) overrides.push(override)
      return overrides
    }

    function pComment(end) {
      next()
      next()
      var comment = ""
      while (tok && tok !== "\n" && tok !== end) {
        comment += tok
        next()
      }
      if (tok && tok === "\n") next()
      return new Comment(comment, true)
    }

    function pOutline() {
      var children = []
      function parseArg(kind, end) {
        label = null
        next()
        var parts = pParts(end)
        if (tok === end) next()
        children.push(
          paintBlock(
            {
              shape: kind === "boolean" ? "boolean" : "reporter",
              argument: kind,
              category: "custom-arg",
            },
            parts,
            languages
          )
        )
      }
      var label
      while (tok && tok !== "\n") {
        if (tok === "/" && peek() === "/") {
          break
        }
        switch (tok) {
          case "(":
            parseArg("number", ")")
            break
          case "[":
            parseArg("string", "]")
            break
          case "<":
            parseArg("boolean", ">")
            break
          case " ":
            next()
            label = null
            break
          case "\\":
            next()
          // fall-thru
          case ":":
            if (tok === ":" && peek() === ":") {
              children.push(pOverrides())
              break
            } // fall-thru
          default:
            if (!label) children.push((label = new Label("")))
            label.value += tok
            next()
        }
      }
      return makeBlock("outline", children)
    }

    function pLine() {
      var diff
      if (tok === "+" || tok === "-") {
        diff = tok
        next()
      }
      var block = pBlock()
      if (tok === "/" && peek() === "/") {
        var comment = pComment()
        comment.hasBlock = block && block.children.length
        if (!comment.hasBlock) {
          return comment
        }
        block.comment = comment
      }
      if (block) block.diff = diff
      return block
    }

    return function() {
      if (!tok) return undefined
      var line = pLine()
      return line || "NL"
    }
  }

  /* * */

  function parseScripts(getLine) {
    var line = getLine()
    function next() {
      line = getLine()
    }

    function pFile() {
      while (line === "NL") next()
      var scripts = []
      while (line) {
        var blocks = []
        while (line && line !== "NL") {
          var b = pLine()
          var isGlow = b.diff === "+"
          if (isGlow) {
            b.diff = null
          }

          if (b.isElse || b.isEnd) {
            b = new Block(
              extend(b.info, {
                shape: "stack",
              }),
              b.children
            )
          }

          if (isGlow) {
            var last = blocks[blocks.length - 1]
            var children = []
            if (last && last.isGlow) {
              blocks.pop()
              var children = last.child.isScript
                ? last.child.blocks
                : [last.child]
            }
            children.push(b)
            blocks.push(new Glow(new Script(children)))
          } else if (b.isHat) {
            if (blocks.length) scripts.push(new Script(blocks))
            blocks = [b]
          } else if (b.isFinal) {
            blocks.push(b)
            break
          } else if (b.isCommand) {
            blocks.push(b)
          } else {
            // reporter or predicate
            if (blocks.length) scripts.push(new Script(blocks))
            scripts.push(new Script([b]))
            blocks = []
            break
          }
        }
        if (blocks.length) scripts.push(new Script(blocks))
        while (line === "NL") next()
      }
      return scripts
    }

    function pLine() {
      var b = line
      next()

      if (b.hasScript) {
        while (true) {
          var blocks = pMouth()
          b.children.push(new Script(blocks))
          if (line && line.isElse) {
            for (var i = 0; i < line.children.length; i++) {
              b.children.push(line.children[i])
            }
            next()
            continue
          }
          if (line && line.isEnd) {
            next()
          }
          break
        }
      }
      return b
    }

    function pMouth() {
      var blocks = []
      while (line) {
        if (line === "NL") {
          next()
          continue
        }
        if (!line.isCommand) {
          return blocks
        }

        var b = pLine()
        var isGlow = b.diff === "+"
        if (isGlow) {
          b.diff = null
        }

        if (isGlow) {
          var last = blocks[blocks.length - 1]
          var children = []
          if (last && last.isGlow) {
            blocks.pop()
            var children = last.child.isScript
              ? last.child.blocks
              : [last.child]
          }
          children.push(b)
          blocks.push(new Glow(new Script(children)))
        } else {
          blocks.push(b)
        }
      }
      return blocks
    }

    return pFile()
  }

  /* * */

  function eachBlock(x, cb) {
    if (x.isScript) {
      x.blocks.forEach(function(block) {
        eachBlock(block, cb)
      })
    } else if (x.isBlock) {
      cb(x)
      x.children.forEach(function(child) {
        eachBlock(child, cb)
      })
    } else if (x.isGlow) {
      eachBlock(x.child, cb)
    }
  }

  var listBlocks = {
    "append:toList:": 1,
    "deleteLine:ofList:": 1,
    "insert:at:ofList:": 2,
    "setLine:ofList:to:": 1,
    "showList:": 0,
    "hideList:": 0,
  }

  function recogniseStuff(scripts) {
    var customBlocksByHash = {}
    var listNames = {}

    scripts.forEach(function(script) {
      var customArgs = {}

      eachBlock(script, function(block) {
        // custom blocks
        if (block.info.shape === "define-hat") {
          var outline = block.children[1]
          if (!outline) return

          var names = []
          var parts = []
          for (var i = 0; i < outline.children.length; i++) {
            var child = outline.children[i]
            if (child.isLabel) {
              parts.push(child.value)
            } else if (child.isBlock) {
              if (!child.info.argument) return
              parts.push(
                {
                  number: "%n",
                  string: "%s",
                  boolean: "%b",
                }[child.info.argument]
              )

              var name = blockName(child)
              names.push(name)
              customArgs[name] = true
            }
          }
          var spec = parts.join(" ")
          var hash = hashSpec(spec)
          var info = (customBlocksByHash[hash] = {
            spec: spec,
            names: names,
          })
          block.info.selector = "procDef"
          block.info.call = info.spec
          block.info.names = info.names
          block.info.category = "custom"

          // fix up if/else selectors
        } else if (block.info.selector === "doIfElse") {
          var last2 = block.children[block.children.length - 2]
          block.info.selector =
            last2 && last2.isLabel && last2.value === "else"
              ? "doIfElse"
              : "doIf"

          // custom arguments
        } else if (
          block.info.categoryIsDefault &&
          (block.isReporter || block.isBoolean)
        ) {
          var name = blockName(block)
          if (customArgs[name]) {
            block.info.category = "custom-arg"
            block.info.categoryIsDefault = false
            block.info.selector = "getParam"
          }

          // list names
        } else if (listBlocks.hasOwnProperty(block.info.selector)) {
          var argIndex = listBlocks[block.info.selector]
          var inputs = block.children.filter(function(child) {
            return !child.isLabel
          })
          var input = inputs[argIndex]
          if (input && input.isInput) {
            listNames[input.value] = true
          }
        }
      })
    })

    scripts.forEach(function(script) {
      eachBlock(script, function(block) {
        // custom blocks
        if (
          block.info.categoryIsDefault &&
          block.info.category === "obsolete"
        ) {
          var info = customBlocksByHash[block.info.hash]
          if (info) {
            block.info.selector = "call"
            block.info.call = info.spec
            block.info.names = info.names
            block.info.category = "custom"
          }

          // list reporters
        } else if (block.isReporter) {
          var name = blockName(block)
          if (!name) return
          if (
            block.info.category === "variables" &&
            listNames[name] &&
            block.info.categoryIsDefault
          ) {
            block.info.category = "list"
            block.info.categoryIsDefault = false
          }
          if (block.info.category === "list") {
            block.info.selector = "contentsOfList:"
          } else if (block.info.category === "variables") {
            block.info.selector = "readVariable"
          }
        }
      })
    })
  }

  function parse(code, options) {
    var options = extend(
      {
        inline: false,
        languages: ["en"],
      },
      options
    )

    code = code.replace(/&lt;/g, "<")
    code = code.replace(/&gt;/g, ">")
    if (options.inline) {
      code = code.replace(/\n/g, " ")
    }

    var languages = options.languages.map(function(code) {
      return allLanguages[code]
    })

    /* * */

    var f = parseLines(code, languages)
    var scripts = parseScripts(f)
    recogniseStuff(scripts)
    return new Document(scripts)
  }

  return {
    parse: parse,
  }
})()

},{"./blocks.js":2,"./model.js":7}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJmdW5jdGlvbiBtYWtlQ2FudmFzKCkge1xuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxufVxuXG52YXIgc2NyYXRjaGJsb2NrcyA9ICh3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vbGliL1wiKShcbiAgd2luZG93LFxuICBtYWtlQ2FudmFzXG4pKVxuXG4vLyBhZGQgb3VyIENTUyB0byB0aGUgcGFnZVxudmFyIHN0eWxlID0gc2NyYXRjaGJsb2Nrcy5tYWtlU3R5bGUoKVxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIC8vIExpc3Qgb2YgY2xhc3NlcyB3ZSdyZSBhbGxvd2VkIHRvIG92ZXJyaWRlLlxuXG4gIHZhciBvdmVycmlkZUNhdGVnb3JpZXMgPSBbXG4gICAgXCJtb3Rpb25cIixcbiAgICBcImxvb2tzXCIsXG4gICAgXCJzb3VuZFwiLFxuICAgIFwicGVuXCIsXG4gICAgXCJ2YXJpYWJsZXNcIixcbiAgICBcImxpc3RcIixcbiAgICBcImV2ZW50c1wiLFxuICAgIFwiY29udHJvbFwiLFxuICAgIFwic2Vuc2luZ1wiLFxuICAgIFwib3BlcmF0b3JzXCIsXG4gICAgXCJjdXN0b21cIixcbiAgICBcImN1c3RvbS1hcmdcIixcbiAgICBcImV4dGVuc2lvblwiLFxuICAgIFwibmV3ZXh0ZW5zaW9uXCIsXG4gICAgXCJtdXNpY1wiLFxuICAgIFwidmlkZW9cIixcbiAgICBcImdyZXlcIixcbiAgICBcIm9ic29sZXRlXCIsXG4gIF1cbiAgdmFyIG92ZXJyaWRlU2hhcGVzID0gW1wiaGF0XCIsIFwiY2FwXCIsIFwic3RhY2tcIiwgXCJib29sZWFuXCIsIFwicmVwb3J0ZXJcIiwgXCJyaW5nXCJdXG5cbiAgLy8gbGFuZ3VhZ2VzIHRoYXQgc2hvdWxkIGJlIGRpc3BsYXllZCByaWdodCB0byBsZWZ0XG4gIHZhciBydGxMYW5ndWFnZXMgPSBbXCJhclwiLCBcImZhXCIsIFwiaGVcIl1cblxuICAvLyBMaXN0IG9mIGNvbW1hbmRzIHRha2VuIGZyb20gU2NyYXRjaFxuICB2YXIgc2NyYXRjaENvbW1hbmRzID0gcmVxdWlyZShcIi4vY29tbWFuZHMuanNcIilcblxuICB2YXIgY2F0ZWdvcmllc0J5SWQgPSB7XG4gICAgMDogXCJvYnNvbGV0ZVwiLFxuICAgIDE6IFwibW90aW9uXCIsXG4gICAgMjogXCJsb29rc1wiLFxuICAgIDM6IFwic291bmRcIixcbiAgICA0OiBcInBlblwiLFxuICAgIDU6IFwiZXZlbnRzXCIsXG4gICAgNjogXCJjb250cm9sXCIsXG4gICAgNzogXCJzZW5zaW5nXCIsXG4gICAgODogXCJvcGVyYXRvcnNcIixcbiAgICA5OiBcInZhcmlhYmxlc1wiLFxuICAgIDEwOiBcImN1c3RvbVwiLFxuICAgIDExOiBcInBhcmFtZXRlclwiLFxuICAgIDEyOiBcImxpc3RcIixcbiAgICAyMDogXCJleHRlbnNpb25cIixcbiAgICA0MjogXCJncmV5XCIsXG4gIH1cblxuICB2YXIgdHlwZVNoYXBlcyA9IHtcbiAgICBcIiBcIjogXCJzdGFja1wiLFxuICAgIGI6IFwiYm9vbGVhblwiLFxuICAgIGM6IFwiYy1ibG9ja1wiLFxuICAgIGU6IFwiaWYtYmxvY2tcIixcbiAgICBmOiBcImNhcFwiLFxuICAgIGg6IFwiaGF0XCIsXG4gICAgcjogXCJyZXBvcnRlclwiLFxuICAgIGNmOiBcImMtYmxvY2sgY2FwXCIsXG4gICAgZWxzZTogXCJjZWxzZVwiLFxuICAgIGVuZDogXCJjZW5kXCIsXG4gICAgcmluZzogXCJyaW5nXCIsXG4gIH1cblxuICB2YXIgaW5wdXRQYXQgPSAvKCVbYS16QS1aXSg/OlxcLlthLXpBLVowLTldKyk/KS9cbiAgdmFyIGlucHV0UGF0R2xvYmFsID0gbmV3IFJlZ0V4cChpbnB1dFBhdC5zb3VyY2UsIFwiZ1wiKVxuICB2YXIgaWNvblBhdCA9IC8oQFthLXpBLVpdKykvXG4gIHZhciBzcGxpdFBhdCA9IG5ldyBSZWdFeHAoXG4gICAgW2lucHV0UGF0LnNvdXJjZSwgXCJ8XCIsIGljb25QYXQuc291cmNlLCBcInwgK1wiXS5qb2luKFwiXCIpLFxuICAgIFwiZ1wiXG4gIClcblxuICB2YXIgaGV4Q29sb3JQYXQgPSAvXiMoPzpbMC05YS1mQS1GXXszfSl7MSwyfT8kL1xuXG4gIGZ1bmN0aW9uIHBhcnNlU3BlYyhzcGVjKSB7XG4gICAgdmFyIHBhcnRzID0gc3BlYy5zcGxpdChzcGxpdFBhdCkuZmlsdGVyKHggPT4gISF4KVxuICAgIHJldHVybiB7XG4gICAgICBzcGVjOiBzcGVjLFxuICAgICAgcGFydHM6IHBhcnRzLFxuICAgICAgaW5wdXRzOiBwYXJ0cy5maWx0ZXIoZnVuY3Rpb24ocCkge1xuICAgICAgICByZXR1cm4gaW5wdXRQYXQudGVzdChwKVxuICAgICAgfSksXG4gICAgICBoYXNoOiBoYXNoU3BlYyhzcGVjKSxcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoU3BlYyhzcGVjKSB7XG4gICAgcmV0dXJuIG1pbmlmeUhhc2goc3BlYy5yZXBsYWNlKGlucHV0UGF0R2xvYmFsLCBcIiBfIFwiKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG1pbmlmeUhhc2goaGFzaCkge1xuICAgIHJldHVybiBoYXNoXG4gICAgICAucmVwbGFjZSgvXy9nLCBcIiBfIFwiKVxuICAgICAgLnJlcGxhY2UoLyArL2csIFwiIFwiKVxuICAgICAgLnJlcGxhY2UoL1ssJT86XS9nLCBcIlwiKVxuICAgICAgLnJlcGxhY2UoL8OfL2csIFwic3NcIilcbiAgICAgIC5yZXBsYWNlKC/DpC9nLCBcImFcIilcbiAgICAgIC5yZXBsYWNlKC/Dti9nLCBcIm9cIilcbiAgICAgIC5yZXBsYWNlKC/DvC9nLCBcInVcIilcbiAgICAgIC5yZXBsYWNlKFwiLiAuIC5cIiwgXCIuLi5cIilcbiAgICAgIC5yZXBsYWNlKC9e4oCmJC8sIFwiLi4uXCIpXG4gICAgICAudHJpbSgpXG4gICAgICAudG9Mb3dlckNhc2UoKVxuICB9XG5cbiAgdmFyIGJsb2Nrc0J5U2VsZWN0b3IgPSB7fVxuICB2YXIgYmxvY2tzQnlTcGVjID0ge31cbiAgdmFyIGFsbEJsb2NrcyA9IHNjcmF0Y2hDb21tYW5kcy5tYXAoZnVuY3Rpb24oY29tbWFuZCkge1xuICAgIHZhciBpbmZvID0gZXh0ZW5kKHBhcnNlU3BlYyhjb21tYW5kWzBdKSwge1xuICAgICAgc2hhcGU6IHR5cGVTaGFwZXNbY29tbWFuZFsxXV0sIC8vIC9bIGJjZWZocl18Y2YvXG4gICAgICBjYXRlZ29yeTogY2F0ZWdvcmllc0J5SWRbY29tbWFuZFsyXSAlIDEwMF0sXG4gICAgICBzZWxlY3RvcjogY29tbWFuZFszXSxcbiAgICAgIGhhc0xvb3BBcnJvdzpcbiAgICAgICAgW1wiZG9SZXBlYXRcIiwgXCJkb1VudGlsXCIsIFwiZG9Gb3JldmVyXCJdLmluZGV4T2YoY29tbWFuZFszXSkgPiAtMSxcbiAgICB9KVxuICAgIGlmIChpbmZvLnNlbGVjdG9yKSB7XG4gICAgICAvLyBuYi4gY29tbWFuZCBvcmRlciBtYXR0ZXJzIVxuICAgICAgLy8gU2NyYXRjaCAxLjQgYmxvY2tzIGFyZSBsaXN0ZWQgbGFzdFxuICAgICAgaWYgKCFibG9ja3NCeVNlbGVjdG9yW2luZm8uc2VsZWN0b3JdKVxuICAgICAgICBibG9ja3NCeVNlbGVjdG9yW2luZm8uc2VsZWN0b3JdID0gaW5mb1xuICAgIH1cbiAgICByZXR1cm4gKGJsb2Nrc0J5U3BlY1tpbmZvLnNwZWNdID0gaW5mbylcbiAgfSlcblxuICB2YXIgdW5pY29kZUljb25zID0ge1xuICAgIFwiQGdyZWVuRmxhZ1wiOiBcIuKakVwiLFxuICAgIFwiQHR1cm5SaWdodFwiOiBcIuKGu1wiLFxuICAgIFwiQHR1cm5MZWZ0XCI6IFwi4oa6XCIsXG4gICAgXCJAYWRkSW5wdXRcIjogXCLilrhcIixcbiAgICBcIkBkZWxJbnB1dFwiOiBcIuKXglwiLFxuICB9XG5cbiAgdmFyIGFsbExhbmd1YWdlcyA9IHt9XG4gIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZShjb2RlLCBsYW5ndWFnZSkge1xuICAgIHZhciBibG9ja3NCeUhhc2ggPSAobGFuZ3VhZ2UuYmxvY2tzQnlIYXNoID0ge30pXG5cbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZS5jb21tYW5kcykuZm9yRWFjaChmdW5jdGlvbihzcGVjKSB7XG4gICAgICB2YXIgbmF0aXZlU3BlYyA9IGxhbmd1YWdlLmNvbW1hbmRzW3NwZWNdXG4gICAgICB2YXIgYmxvY2sgPSBibG9ja3NCeVNwZWNbc3BlY11cblxuICAgICAgdmFyIG5hdGl2ZUhhc2ggPSBoYXNoU3BlYyhuYXRpdmVTcGVjKVxuICAgICAgYmxvY2tzQnlIYXNoW25hdGl2ZUhhc2hdID0gYmxvY2tcblxuICAgICAgLy8gZmFsbGJhY2sgaW1hZ2UgcmVwbGFjZW1lbnQsIGZvciBsYW5ndWFnZXMgd2l0aG91dCBhbGlhc2VzXG4gICAgICB2YXIgbSA9IGljb25QYXQuZXhlYyhzcGVjKVxuICAgICAgaWYgKG0pIHtcbiAgICAgICAgdmFyIGltYWdlID0gbVswXVxuICAgICAgICB2YXIgaGFzaCA9IG5hdGl2ZUhhc2gucmVwbGFjZShpbWFnZSwgdW5pY29kZUljb25zW2ltYWdlXSlcbiAgICAgICAgYmxvY2tzQnlIYXNoW2hhc2hdID0gYmxvY2tcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgbGFuZ3VhZ2UubmF0aXZlQWxpYXNlcyA9IHt9XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuYWxpYXNlcykuZm9yRWFjaChmdW5jdGlvbihhbGlhcykge1xuICAgICAgdmFyIHNwZWMgPSBsYW5ndWFnZS5hbGlhc2VzW2FsaWFzXVxuICAgICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTcGVjW3NwZWNdXG5cbiAgICAgIHZhciBhbGlhc0hhc2ggPSBoYXNoU3BlYyhhbGlhcylcbiAgICAgIGJsb2Nrc0J5SGFzaFthbGlhc0hhc2hdID0gYmxvY2tcblxuICAgICAgbGFuZ3VhZ2UubmF0aXZlQWxpYXNlc1tzcGVjXSA9IGFsaWFzXG4gICAgfSlcblxuICAgIGxhbmd1YWdlLm5hdGl2ZURyb3Bkb3ducyA9IHt9XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuZHJvcGRvd25zKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBuYXRpdmVOYW1lID0gbGFuZ3VhZ2UuZHJvcGRvd25zW25hbWVdXG4gICAgICBsYW5ndWFnZS5uYXRpdmVEcm9wZG93bnNbbmF0aXZlTmFtZV0gPSBuYW1lXG4gICAgfSlcblxuICAgIGxhbmd1YWdlLmNvZGUgPSBjb2RlXG4gICAgYWxsTGFuZ3VhZ2VzW2NvZGVdID0gbGFuZ3VhZ2VcbiAgfVxuICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzKGxhbmd1YWdlcykge1xuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlcykuZm9yRWFjaChmdW5jdGlvbihjb2RlKSB7XG4gICAgICBsb2FkTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2VzW2NvZGVdKVxuICAgIH0pXG4gIH1cblxuICB2YXIgZW5nbGlzaCA9IHtcbiAgICBhbGlhc2VzOiB7XG4gICAgICBcInR1cm4gbGVmdCAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ0dXJuIGNjdyAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ0dXJuIHJpZ2h0ICVuIGRlZ3JlZXNcIjogXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ0dXJuIGN3ICVuIGRlZ3JlZXNcIjogXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ3aGVuIGdmIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgICAgXCJ3aGVuIGZsYWcgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgICBcIndoZW4gZ3JlZW4gZmxhZyBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICAgIFwiY2xlYXJcIjogXCJlcmFzZSBhbGxcIixcbiAgICB9LFxuXG4gICAgZGVmaW5lOiBbXCJkZWZpbmVcIl0sXG5cbiAgICAvLyBGb3IgaWdub3JpbmcgdGhlIGx0IHNpZ24gaW4gdGhlIFwid2hlbiBkaXN0YW5jZSA8IF9cIiBibG9ja1xuICAgIGlnbm9yZWx0OiBbXCJ3aGVuIGRpc3RhbmNlXCJdLFxuXG4gICAgLy8gVmFsaWQgYXJndW1lbnRzIHRvIFwib2ZcIiBkcm9wZG93biwgZm9yIHJlc29sdmluZyBhbWJpZ3VvdXMgc2l0dWF0aW9uc1xuICAgIG1hdGg6IFtcbiAgICAgIFwiYWJzXCIsXG4gICAgICBcImZsb29yXCIsXG4gICAgICBcImNlaWxpbmdcIixcbiAgICAgIFwic3FydFwiLFxuICAgICAgXCJzaW5cIixcbiAgICAgIFwiY29zXCIsXG4gICAgICBcInRhblwiLFxuICAgICAgXCJhc2luXCIsXG4gICAgICBcImFjb3NcIixcbiAgICAgIFwiYXRhblwiLFxuICAgICAgXCJsblwiLFxuICAgICAgXCJsb2dcIixcbiAgICAgIFwiZSBeXCIsXG4gICAgICBcIjEwIF5cIixcbiAgICBdLFxuXG4gICAgLy8gRm9yIGRldGVjdGluZyB0aGUgXCJzdG9wXCIgY2FwIC8gc3RhY2sgYmxvY2tcbiAgICBvc2lzOiBbXCJvdGhlciBzY3JpcHRzIGluIHNwcml0ZVwiLCBcIm90aGVyIHNjcmlwdHMgaW4gc3RhZ2VcIl0sXG5cbiAgICBkcm9wZG93bnM6IHt9LFxuXG4gICAgY29tbWFuZHM6IHt9LFxuICB9XG4gIGFsbEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGluZm8pIHtcbiAgICBlbmdsaXNoLmNvbW1hbmRzW2luZm8uc3BlY10gPSBpbmZvLnNwZWNcbiAgfSksXG4gICAgbG9hZExhbmd1YWdlcyh7XG4gICAgICBlbjogZW5nbGlzaCxcbiAgICB9KVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICBmdW5jdGlvbiBkaXNhbWJpZyhzZWxlY3RvcjEsIHNlbGVjdG9yMiwgdGVzdCkge1xuICAgIHZhciBmdW5jID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAgIHJldHVybiBibG9ja3NCeVNlbGVjdG9yW3Rlc3QoY2hpbGRyZW4sIGxhbmcpID8gc2VsZWN0b3IxIDogc2VsZWN0b3IyXVxuICAgIH1cbiAgICBibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yMV0uc3BlY2lhbENhc2UgPSBibG9ja3NCeVNlbGVjdG9yW1xuICAgICAgc2VsZWN0b3IyXG4gICAgXS5zcGVjaWFsQ2FzZSA9IGZ1bmNcbiAgfVxuXG4gIGRpc2FtYmlnKFwiY29tcHV0ZUZ1bmN0aW9uOm9mOlwiLCBcImdldEF0dHJpYnV0ZTpvZjpcIiwgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBPcGVyYXRvcnMgaWYgbWF0aCBmdW5jdGlvbiwgb3RoZXJ3aXNlIHNlbnNpbmcgXCJhdHRyaWJ1dGUgb2ZcIiBibG9ja1xuICAgIHZhciBmaXJzdCA9IGNoaWxkcmVuWzBdXG4gICAgaWYgKCFmaXJzdC5pc0lucHV0KSByZXR1cm5cbiAgICB2YXIgbmFtZSA9IGZpcnN0LnZhbHVlXG4gICAgcmV0dXJuIGxhbmcubWF0aC5pbmRleE9mKG5hbWUpID4gLTFcbiAgfSlcblxuICBkaXNhbWJpZyhcImxpbmVDb3VudE9mTGlzdDpcIiwgXCJzdHJpbmdMZW5ndGg6XCIsIGZ1bmN0aW9uKGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gTGlzdCBibG9jayBpZiBkcm9wZG93biwgb3RoZXJ3aXNlIG9wZXJhdG9yc1xuICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICBpZiAoIWxhc3QuaXNJbnB1dCkgcmV0dXJuXG4gICAgcmV0dXJuIGxhc3Quc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuICB9KVxuXG4gIGRpc2FtYmlnKFwicGVuQ29sb3I6XCIsIFwic2V0UGVuSHVlVG86XCIsIGZ1bmN0aW9uKGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gQ29sb3IgYmxvY2sgaWYgY29sb3IgaW5wdXQsIG90aGVyd2lzZSBudW1lcmljXG4gICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgIC8vIElmIHZhcmlhYmxlLCBhc3N1bWUgY29sb3IgaW5wdXQsIHNpbmNlIHRoZSBSR0JBIGhhY2sgaXMgY29tbW9uLlxuICAgIC8vIFRPRE8gZml4IFNjcmF0Y2ggOlBcbiAgICByZXR1cm4gKGxhc3QuaXNJbnB1dCAmJiBsYXN0LmlzQ29sb3IpIHx8IGxhc3QuaXNCbG9ja1xuICB9KVxuXG4gIGJsb2Nrc0J5U2VsZWN0b3JbXCJzdG9wU2NyaXB0c1wiXS5zcGVjaWFsQ2FzZSA9IGZ1bmN0aW9uKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gQ2FwIGJsb2NrIHVubGVzcyBhcmd1bWVudCBpcyBcIm90aGVyIHNjcmlwdHMgaW4gc3ByaXRlXCJcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgaWYgKCFsYXN0LmlzSW5wdXQpIHJldHVyblxuICAgIHZhciB2YWx1ZSA9IGxhc3QudmFsdWVcbiAgICBpZiAobGFuZy5vc2lzLmluZGV4T2YodmFsdWUpID4gLTEpIHtcbiAgICAgIHJldHVybiBleHRlbmQoYmxvY2tzQnlTZWxlY3RvcltcInN0b3BTY3JpcHRzXCJdLCB7XG4gICAgICAgIHNoYXBlOiBcInN0YWNrXCIsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvb2t1cEhhc2goaGFzaCwgaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGFuZyA9IGxhbmd1YWdlc1tpXVxuICAgICAgaWYgKGxhbmcuYmxvY2tzQnlIYXNoLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgIHZhciBibG9jayA9IGxhbmcuYmxvY2tzQnlIYXNoW2hhc2hdXG4gICAgICAgIGlmIChpbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCIgJiYgYmxvY2suc2hhcGUgIT09IFwicmVwb3J0ZXJcIikgY29udGludWVcbiAgICAgICAgaWYgKGluZm8uc2hhcGUgPT09IFwiYm9vbGVhblwiICYmIGJsb2NrLnNoYXBlICE9PSBcImJvb2xlYW5cIikgY29udGludWVcbiAgICAgICAgaWYgKGJsb2NrLnNwZWNpYWxDYXNlKSB7XG4gICAgICAgICAgYmxvY2sgPSBibG9jay5zcGVjaWFsQ2FzZShpbmZvLCBjaGlsZHJlbiwgbGFuZykgfHwgYmxvY2tcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBibG9jaywgbGFuZzogbGFuZyB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9va3VwRHJvcGRvd24obmFtZSwgbGFuZ3VhZ2VzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYW5ndWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsYW5nID0gbGFuZ3VhZ2VzW2ldXG4gICAgICBpZiAobGFuZy5uYXRpdmVEcm9wZG93bnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgdmFyIG5hdGl2ZU5hbWUgPSBsYW5nLm5hdGl2ZURyb3Bkb3duc1tuYW1lXVxuICAgICAgICByZXR1cm4gbmF0aXZlTmFtZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5T3ZlcnJpZGVzKGluZm8sIG92ZXJyaWRlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbmFtZSA9IG92ZXJyaWRlc1tpXVxuICAgICAgaWYgKGhleENvbG9yUGF0LnRlc3QobmFtZSkpIHtcbiAgICAgICAgaW5mby5jb2xvciA9IG5hbWVcbiAgICAgICAgaW5mby5jYXRlZ29yeSA9IFwiXCJcbiAgICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlQ2F0ZWdvcmllcy5pbmRleE9mKG5hbWUpID4gLTEpIHtcbiAgICAgICAgaW5mby5jYXRlZ29yeSA9IG5hbWVcbiAgICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlU2hhcGVzLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgICBpbmZvLnNoYXBlID0gbmFtZVxuICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcImxvb3BcIikge1xuICAgICAgICBpbmZvLmhhc0xvb3BBcnJvdyA9IHRydWVcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCIrXCIgfHwgbmFtZSA9PT0gXCItXCIpIHtcbiAgICAgICAgaW5mby5kaWZmID0gbmFtZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJsb2NrTmFtZShibG9jaykge1xuICAgIHZhciB3b3JkcyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9jay5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gYmxvY2suY2hpbGRyZW5baV1cbiAgICAgIGlmICghY2hpbGQuaXNMYWJlbCkgcmV0dXJuXG4gICAgICB3b3Jkcy5wdXNoKGNoaWxkLnZhbHVlKVxuICAgIH1cbiAgICByZXR1cm4gd29yZHMuam9pbihcIiBcIilcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbG9hZExhbmd1YWdlcyxcblxuICAgIGJsb2NrTmFtZSxcblxuICAgIGFsbExhbmd1YWdlcyxcbiAgICBsb29rdXBEcm9wZG93bixcbiAgICBoZXhDb2xvclBhdCxcbiAgICBtaW5pZnlIYXNoLFxuICAgIGxvb2t1cEhhc2gsXG4gICAgYXBwbHlPdmVycmlkZXMsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIGljb25QYXQsXG4gICAgaGFzaFNwZWMsXG5cbiAgICBibG9ja3NCeVNlbGVjdG9yLFxuICAgIHBhcnNlU3BlYyxcbiAgICBpbnB1dFBhdCxcbiAgICB1bmljb2RlSWNvbnMsXG4gICAgZW5nbGlzaCxcbiAgfVxufSkoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIFtcIm1vdmUgJW4gc3RlcHNcIiwgXCIgXCIsIDEsIFwiZm9yd2FyZDpcIl0sXG4gIFtcInR1cm4gQHR1cm5SaWdodCAlbiBkZWdyZWVzXCIsIFwiIFwiLCAxLCBcInR1cm5SaWdodDpcIl0sXG4gIFtcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIiwgXCIgXCIsIDEsIFwidHVybkxlZnQ6XCJdLFxuICBbXCJwb2ludCBpbiBkaXJlY3Rpb24gJWQuZGlyZWN0aW9uXCIsIFwiIFwiLCAxLCBcImhlYWRpbmc6XCJdLFxuICBbXCJwb2ludCB0b3dhcmRzICVtLnNwcml0ZU9yTW91c2VcIiwgXCIgXCIsIDEsIFwicG9pbnRUb3dhcmRzOlwiXSxcbiAgW1wiZ28gdG8geDolbiB5OiVuXCIsIFwiIFwiLCAxLCBcImdvdG9YOnk6XCJdLFxuICBbXCJnbyB0byAlci5sb2NhdGlvblwiLCBcIiBcIiwgMSwgXCJnb3RvU3ByaXRlT3JNb3VzZTpcIl0sXG4gIFtcImdsaWRlICVuIHNlY3MgdG8geDolbiB5OiVuXCIsIFwiIFwiLCAxLCBcImdsaWRlU2Vjczp0b1g6eTplbGFwc2VkOmZyb206XCJdLFxuICBbXCJjaGFuZ2UgeCBieSAlblwiLCBcIiBcIiwgMSwgXCJjaGFuZ2VYcG9zQnk6XCJdLFxuICBbXCJzZXQgeCB0byAlblwiLCBcIiBcIiwgMSwgXCJ4cG9zOlwiXSxcbiAgW1wiY2hhbmdlIHkgYnkgJW5cIiwgXCIgXCIsIDEsIFwiY2hhbmdlWXBvc0J5OlwiXSxcbiAgW1wic2V0IHkgdG8gJW5cIiwgXCIgXCIsIDEsIFwieXBvczpcIl0sXG4gIFtcInNldCByb3RhdGlvbiBzdHlsZSAlbS5yb3RhdGlvblN0eWxlXCIsIFwiIFwiLCAxLCBcInNldFJvdGF0aW9uU3R5bGVcIl0sXG4gIFtcInNheSAlcyBmb3IgJW4gc2Vjc1wiLCBcIiBcIiwgMiwgXCJzYXk6ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wic2F5ICVzXCIsIFwiIFwiLCAyLCBcInNheTpcIl0sXG4gIFtcInRoaW5rICVzIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyLCBcInRoaW5rOmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInRoaW5rICVzXCIsIFwiIFwiLCAyLCBcInRoaW5rOlwiXSxcbiAgW1wic2hvd1wiLCBcIiBcIiwgMiwgXCJzaG93XCJdLFxuICBbXCJoaWRlXCIsIFwiIFwiLCAyLCBcImhpZGVcIl0sXG4gIFtcInN3aXRjaCBjb3N0dW1lIHRvICVtLmNvc3R1bWVcIiwgXCIgXCIsIDIsIFwibG9va0xpa2U6XCJdLFxuICBbXCJuZXh0IGNvc3R1bWVcIiwgXCIgXCIsIDIsIFwibmV4dENvc3R1bWVcIl0sXG4gIFtcIm5leHQgYmFja2Ryb3BcIiwgXCIgXCIsIDEwMiwgXCJuZXh0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCBiYWNrZHJvcCB0byAlbS5iYWNrZHJvcFwiLCBcIiBcIiwgMiwgXCJzdGFydFNjZW5lXCJdLFxuICBbXCJzd2l0Y2ggYmFja2Ryb3AgdG8gJW0uYmFja2Ryb3AgYW5kIHdhaXRcIiwgXCIgXCIsIDEwMiwgXCJzdGFydFNjZW5lQW5kV2FpdFwiXSxcbiAgW1wiY2hhbmdlICVtLmVmZmVjdCBlZmZlY3QgYnkgJW5cIiwgXCIgXCIsIDIsIFwiY2hhbmdlR3JhcGhpY0VmZmVjdDpieTpcIl0sXG4gIFtcInNldCAlbS5lZmZlY3QgZWZmZWN0IHRvICVuXCIsIFwiIFwiLCAyLCBcInNldEdyYXBoaWNFZmZlY3Q6dG86XCJdLFxuICBbXCJjbGVhciBncmFwaGljIGVmZmVjdHNcIiwgXCIgXCIsIDIsIFwiZmlsdGVyUmVzZXRcIl0sXG4gIFtcImNoYW5nZSBzaXplIGJ5ICVuXCIsIFwiIFwiLCAyLCBcImNoYW5nZVNpemVCeTpcIl0sXG4gIFtcInNldCBzaXplIHRvICVuJVwiLCBcIiBcIiwgMiwgXCJzZXRTaXplVG86XCJdLFxuICBbXCJnbyB0byBmcm9udFwiLCBcIiBcIiwgMiwgXCJjb21lVG9Gcm9udFwiXSxcbiAgW1wiZ28gYmFjayAlbiBsYXllcnNcIiwgXCIgXCIsIDIsIFwiZ29CYWNrQnlMYXllcnM6XCJdLFxuICBbXCJwbGF5IHNvdW5kICVtLnNvdW5kXCIsIFwiIFwiLCAzLCBcInBsYXlTb3VuZDpcIl0sXG4gIFtcInBsYXkgc291bmQgJW0uc291bmQgdW50aWwgZG9uZVwiLCBcIiBcIiwgMywgXCJkb1BsYXlTb3VuZEFuZFdhaXRcIl0sXG4gIFtcInN0b3AgYWxsIHNvdW5kc1wiLCBcIiBcIiwgMywgXCJzdG9wQWxsU291bmRzXCJdLFxuICBbXCJwbGF5IGRydW0gJWQuZHJ1bSBmb3IgJW4gYmVhdHNcIiwgXCIgXCIsIDMsIFwicGxheURydW1cIl0sXG4gIFtcInJlc3QgZm9yICVuIGJlYXRzXCIsIFwiIFwiLCAzLCBcInJlc3Q6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wicGxheSBub3RlICVkLm5vdGUgZm9yICVuIGJlYXRzXCIsIFwiIFwiLCAzLCBcIm5vdGVPbjpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJzZXQgaW5zdHJ1bWVudCB0byAlZC5pbnN0cnVtZW50XCIsIFwiIFwiLCAzLCBcImluc3RydW1lbnQ6XCJdLFxuICBbXCJjaGFuZ2Ugdm9sdW1lIGJ5ICVuXCIsIFwiIFwiLCAzLCBcImNoYW5nZVZvbHVtZUJ5OlwiXSxcbiAgW1wic2V0IHZvbHVtZSB0byAlbiVcIiwgXCIgXCIsIDMsIFwic2V0Vm9sdW1lVG86XCJdLFxuICBbXCJjaGFuZ2UgdGVtcG8gYnkgJW5cIiwgXCIgXCIsIDMsIFwiY2hhbmdlVGVtcG9CeTpcIl0sXG4gIFtcInNldCB0ZW1wbyB0byAlbiBicG1cIiwgXCIgXCIsIDMsIFwic2V0VGVtcG9UbzpcIl0sXG4gIFtcImNoYW5nZSAlbS5hdWRpb0VmZmVjdCBlZmZlY3QgYnkgJW5cIiwgXCIgXCIsIDMsIFwiY2hhbmdlQXVkaW9FZmZlY3RCeTpcIl0sXG4gIFtcInNldCAlbS5hdWRpb0VmZmVjdCBlZmZlY3QgdG8gJW5cIiwgXCIgXCIsIDMsIFwic2V0QXVkaW9FZmZlY3RUbzpcIl0sXG4gIFtcImVyYXNlIGFsbFwiLCBcIiBcIiwgNCwgXCJjbGVhclBlblRyYWlsc1wiXSxcbiAgW1wic3RhbXBcIiwgXCIgXCIsIDQsIFwic3RhbXBDb3N0dW1lXCJdLFxuICBbXCJwZW4gZG93blwiLCBcIiBcIiwgNCwgXCJwdXRQZW5Eb3duXCJdLFxuICBbXCJwZW4gdXBcIiwgXCIgXCIsIDQsIFwicHV0UGVuVXBcIl0sXG4gIFtcInNldCBwZW4gY29sb3IgdG8gJWNcIiwgXCIgXCIsIDQsIFwicGVuQ29sb3I6XCJdLFxuICBbXCJjaGFuZ2UgcGVuIGNvbG9yIGJ5ICVuXCIsIFwiIFwiLCA0LCBcImNoYW5nZVBlbkh1ZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBjb2xvciB0byAlblwiLCBcIiBcIiwgNCwgXCJzZXRQZW5IdWVUbzpcIl0sXG4gIFtcImNoYW5nZSBwZW4gc2hhZGUgYnkgJW5cIiwgXCIgXCIsIDQsIFwiY2hhbmdlUGVuU2hhZGVCeTpcIl0sXG4gIFtcInNldCBwZW4gc2hhZGUgdG8gJW5cIiwgXCIgXCIsIDQsIFwic2V0UGVuU2hhZGVUbzpcIl0sXG4gIFtcImNoYW5nZSBwZW4gc2l6ZSBieSAlblwiLCBcIiBcIiwgNCwgXCJjaGFuZ2VQZW5TaXplQnk6XCJdLFxuICBbXCJzZXQgcGVuIHNpemUgdG8gJW5cIiwgXCIgXCIsIDQsIFwicGVuU2l6ZTpcIl0sXG4gIFtcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsIFwiaFwiLCA1LCBcIndoZW5HcmVlbkZsYWdcIl0sXG4gIFtcIndoZW4gJW0ua2V5IGtleSBwcmVzc2VkXCIsIFwiaFwiLCA1LCBcIndoZW5LZXlQcmVzc2VkXCJdLFxuICBbXCJ3aGVuIHRoaXMgc3ByaXRlIGNsaWNrZWRcIiwgXCJoXCIsIDUsIFwid2hlbkNsaWNrZWRcIl0sXG4gIFtcIndoZW4gYmFja2Ryb3Agc3dpdGNoZXMgdG8gJW0uYmFja2Ryb3BcIiwgXCJoXCIsIDUsIFwid2hlblNjZW5lU3RhcnRzXCJdLFxuICBbXCJ3aGVuICVtLnRyaWdnZXJTZW5zb3IgPiAlblwiLCBcImhcIiwgNSwgXCJ3aGVuU2Vuc29yR3JlYXRlclRoYW5cIl0sXG4gIFtcIndoZW4gSSByZWNlaXZlICVtLmJyb2FkY2FzdFwiLCBcImhcIiwgNSwgXCJ3aGVuSVJlY2VpdmVcIl0sXG4gIFtcImJyb2FkY2FzdCAlbS5icm9hZGNhc3RcIiwgXCIgXCIsIDUsIFwiYnJvYWRjYXN0OlwiXSxcbiAgW1wiYnJvYWRjYXN0ICVtLmJyb2FkY2FzdCBhbmQgd2FpdFwiLCBcIiBcIiwgNSwgXCJkb0Jyb2FkY2FzdEFuZFdhaXRcIl0sXG4gIFtcIndhaXQgJW4gc2Vjb25kc1wiLCBcIiBcIiwgNiwgXCJ3YWl0OmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInJlcGVhdCAlblwiLCBcImNcIiwgNiwgXCJkb1JlcGVhdFwiXSxcbiAgW1wiZm9yZXZlclwiLCBcImNmXCIsIDYsIFwiZG9Gb3JldmVyXCJdLFxuICBbXCJpZiAlYiB0aGVuXCIsIFwiY1wiLCA2LCBcImRvSWZcIl0sXG4gIFtcImlmICViIHRoZW5cIiwgXCJlXCIsIDYsIFwiZG9JZkVsc2VcIl0sXG4gIFtcIndhaXQgdW50aWwgJWJcIiwgXCIgXCIsIDYsIFwiZG9XYWl0VW50aWxcIl0sXG4gIFtcInJlcGVhdCB1bnRpbCAlYlwiLCBcImNcIiwgNiwgXCJkb1VudGlsXCJdLFxuICBbXCJzdG9wICVtLnN0b3BcIiwgXCJmXCIsIDYsIFwic3RvcFNjcmlwdHNcIl0sXG4gIFtcIndoZW4gSSBzdGFydCBhcyBhIGNsb25lXCIsIFwiaFwiLCA2LCBcIndoZW5DbG9uZWRcIl0sXG4gIFtcImNyZWF0ZSBjbG9uZSBvZiAlbS5zcHJpdGVPbmx5XCIsIFwiIFwiLCA2LCBcImNyZWF0ZUNsb25lT2ZcIl0sXG4gIFtcImRlbGV0ZSB0aGlzIGNsb25lXCIsIFwiZlwiLCA2LCBcImRlbGV0ZUNsb25lXCJdLFxuICBbXCJhc2sgJXMgYW5kIHdhaXRcIiwgXCIgXCIsIDcsIFwiZG9Bc2tcIl0sXG4gIFtcInR1cm4gdmlkZW8gJW0udmlkZW9TdGF0ZVwiLCBcIiBcIiwgNywgXCJzZXRWaWRlb1N0YXRlXCJdLFxuICBbXCJzZXQgdmlkZW8gdHJhbnNwYXJlbmN5IHRvICVuJVwiLCBcIiBcIiwgNywgXCJzZXRWaWRlb1RyYW5zcGFyZW5jeVwiXSxcbiAgW1wicmVzZXQgdGltZXJcIiwgXCIgXCIsIDcsIFwidGltZXJSZXNldFwiXSxcbiAgW1wic2V0ICVtLnZhciB0byAlc1wiLCBcIiBcIiwgOSwgXCJzZXRWYXI6dG86XCJdLFxuICBbXCJjaGFuZ2UgJW0udmFyIGJ5ICVuXCIsIFwiIFwiLCA5LCBcImNoYW5nZVZhcjpieTpcIl0sXG4gIFtcInNob3cgdmFyaWFibGUgJW0udmFyXCIsIFwiIFwiLCA5LCBcInNob3dWYXJpYWJsZTpcIl0sXG4gIFtcImhpZGUgdmFyaWFibGUgJW0udmFyXCIsIFwiIFwiLCA5LCBcImhpZGVWYXJpYWJsZTpcIl0sXG4gIFtcImFkZCAlcyB0byAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJhcHBlbmQ6dG9MaXN0OlwiXSxcbiAgW1wiZGVsZXRlICVkLmxpc3REZWxldGVJdGVtIG9mICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImRlbGV0ZUxpbmU6b2ZMaXN0OlwiXSxcbiAgW1wiZGVsZXRlIGFsbCBvZiAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJkZWxldGVBbGw6b2ZMaXN0OlwiXSxcbiAgW1wiaWYgb24gZWRnZSwgYm91bmNlXCIsIFwiIFwiLCAxLCBcImJvdW5jZU9mZkVkZ2VcIl0sXG4gIFtcImluc2VydCAlcyBhdCAlZC5saXN0SXRlbSBvZiAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJpbnNlcnQ6YXQ6b2ZMaXN0OlwiXSxcbiAgW1xuICAgIFwicmVwbGFjZSBpdGVtICVkLmxpc3RJdGVtIG9mICVtLmxpc3Qgd2l0aCAlc1wiLFxuICAgIFwiIFwiLFxuICAgIDEyLFxuICAgIFwic2V0TGluZTpvZkxpc3Q6dG86XCIsXG4gIF0sXG4gIFtcInNob3cgbGlzdCAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJzaG93TGlzdDpcIl0sXG4gIFtcImhpZGUgbGlzdCAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJoaWRlTGlzdDpcIl0sXG5cbiAgW1wieCBwb3NpdGlvblwiLCBcInJcIiwgMSwgXCJ4cG9zXCJdLFxuICBbXCJ5IHBvc2l0aW9uXCIsIFwiclwiLCAxLCBcInlwb3NcIl0sXG4gIFtcImRpcmVjdGlvblwiLCBcInJcIiwgMSwgXCJoZWFkaW5nXCJdLFxuICBbXCJjb3N0dW1lICNcIiwgXCJyXCIsIDIsIFwiY29zdHVtZUluZGV4XCJdLFxuICBbXCJzaXplXCIsIFwiclwiLCAyLCBcInNjYWxlXCJdLFxuICBbXCJiYWNrZHJvcCBuYW1lXCIsIFwiclwiLCAxMDIsIFwic2NlbmVOYW1lXCJdLFxuICBbXCJiYWNrZHJvcCAjXCIsIFwiclwiLCAxMDIsIFwiYmFja2dyb3VuZEluZGV4XCJdLFxuICBbXCJ2b2x1bWVcIiwgXCJyXCIsIDMsIFwidm9sdW1lXCJdLFxuICBbXCJ0ZW1wb1wiLCBcInJcIiwgMywgXCJ0ZW1wb1wiXSxcbiAgW1widG91Y2hpbmcgJW0udG91Y2hpbmc/XCIsIFwiYlwiLCA3LCBcInRvdWNoaW5nOlwiXSxcbiAgW1widG91Y2hpbmcgY29sb3IgJWM/XCIsIFwiYlwiLCA3LCBcInRvdWNoaW5nQ29sb3I6XCJdLFxuICBbXCJjb2xvciAlYyBpcyB0b3VjaGluZyAlYz9cIiwgXCJiXCIsIDcsIFwiY29sb3I6c2VlczpcIl0sXG4gIFtcImRpc3RhbmNlIHRvICVtLnNwcml0ZU9yTW91c2VcIiwgXCJyXCIsIDcsIFwiZGlzdGFuY2VUbzpcIl0sXG4gIFtcImFuc3dlclwiLCBcInJcIiwgNywgXCJhbnN3ZXJcIl0sXG4gIFtcImtleSAlbS5rZXkgcHJlc3NlZD9cIiwgXCJiXCIsIDcsIFwia2V5UHJlc3NlZDpcIl0sXG4gIFtcIm1vdXNlIGRvd24/XCIsIFwiYlwiLCA3LCBcIm1vdXNlUHJlc3NlZFwiXSxcbiAgW1wibW91c2UgeFwiLCBcInJcIiwgNywgXCJtb3VzZVhcIl0sXG4gIFtcIm1vdXNlIHlcIiwgXCJyXCIsIDcsIFwibW91c2VZXCJdLFxuICBbXCJsb3VkbmVzc1wiLCBcInJcIiwgNywgXCJzb3VuZExldmVsXCJdLFxuICBbXCJ2aWRlbyAlbS52aWRlb01vdGlvblR5cGUgb24gJW0uc3RhZ2VPclRoaXNcIiwgXCJyXCIsIDcsIFwic2Vuc2VWaWRlb01vdGlvblwiXSxcbiAgW1widGltZXJcIiwgXCJyXCIsIDcsIFwidGltZXJcIl0sXG4gIFtcIiVtLmF0dHJpYnV0ZSBvZiAlbS5zcHJpdGVPclN0YWdlXCIsIFwiclwiLCA3LCBcImdldEF0dHJpYnV0ZTpvZjpcIl0sXG4gIFtcImN1cnJlbnQgJW0udGltZUFuZERhdGVcIiwgXCJyXCIsIDcsIFwidGltZUFuZERhdGVcIl0sXG4gIFtcImRheXMgc2luY2UgMjAwMFwiLCBcInJcIiwgNywgXCJ0aW1lc3RhbXBcIl0sXG4gIFtcInVzZXJuYW1lXCIsIFwiclwiLCA3LCBcImdldFVzZXJOYW1lXCJdLFxuICBbXCIlbiArICVuXCIsIFwiclwiLCA4LCBcIitcIl0sXG4gIFtcIiVuIC0gJW5cIiwgXCJyXCIsIDgsIFwiLVwiXSxcbiAgW1wiJW4gKiAlblwiLCBcInJcIiwgOCwgXCIqXCJdLFxuICBbXCIlbiAvICVuXCIsIFwiclwiLCA4LCBcIi9cIl0sXG4gIFtcInBpY2sgcmFuZG9tICVuIHRvICVuXCIsIFwiclwiLCA4LCBcInJhbmRvbUZyb206dG86XCJdLFxuICBbXCIlcyA8ICVzXCIsIFwiYlwiLCA4LCBcIjxcIl0sXG4gIFtcIiVzID0gJXNcIiwgXCJiXCIsIDgsIFwiPVwiXSxcbiAgW1wiJXMgPiAlc1wiLCBcImJcIiwgOCwgXCI+XCJdLFxuICBbXCIlYiBhbmQgJWJcIiwgXCJiXCIsIDgsIFwiJlwiXSxcbiAgW1wiJWIgb3IgJWJcIiwgXCJiXCIsIDgsIFwifFwiXSxcbiAgW1wibm90ICViXCIsIFwiYlwiLCA4LCBcIm5vdFwiXSxcbiAgW1wiam9pbiAlcyAlc1wiLCBcInJcIiwgOCwgXCJjb25jYXRlbmF0ZTp3aXRoOlwiXSxcbiAgW1wibGV0dGVyICVuIG9mICVzXCIsIFwiclwiLCA4LCBcImxldHRlcjpvZjpcIl0sXG4gIFtcImxlbmd0aCBvZiAlc1wiLCBcInJcIiwgOCwgXCJzdHJpbmdMZW5ndGg6XCJdLFxuICBbXCIlbiBtb2QgJW5cIiwgXCJyXCIsIDgsIFwiJVwiXSxcbiAgW1wicm91bmQgJW5cIiwgXCJyXCIsIDgsIFwicm91bmRlZFwiXSxcbiAgW1wiJW0ubWF0aE9wIG9mICVuXCIsIFwiclwiLCA4LCBcImNvbXB1dGVGdW5jdGlvbjpvZjpcIl0sXG4gIFtcIml0ZW0gJWQubGlzdEl0ZW0gb2YgJW0ubGlzdFwiLCBcInJcIiwgMTIsIFwiZ2V0TGluZTpvZkxpc3Q6XCJdLFxuICBbXCJsZW5ndGggb2YgJW0ubGlzdFwiLCBcInJcIiwgMTIsIFwibGluZUNvdW50T2ZMaXN0OlwiXSxcbiAgW1wiJW0ubGlzdCBjb250YWlucyAlcz9cIiwgXCJiXCIsIDEyLCBcImxpc3Q6Y29udGFpbnM6XCJdLFxuXG4gIFtcIndoZW4gJW0uYm9vbGVhblNlbnNvclwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJ3aGVuICVtLnNlbnNvciAlbS5sZXNzTW9yZSAlblwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJzZW5zb3IgJW0uYm9vbGVhblNlbnNvcj9cIiwgXCJiXCIsIDIwLCBcIlwiXSxcbiAgW1wiJW0uc2Vuc29yIHNlbnNvciB2YWx1ZVwiLCBcInJcIiwgMjAsIFwiXCJdLFxuXG4gIFtcInR1cm4gJW0ubW90b3Igb24gZm9yICVuIHNlY3NcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1widHVybiAlbS5tb3RvciBvblwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ0dXJuICVtLm1vdG9yIG9mZlwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJzZXQgJW0ubW90b3IgcG93ZXIgdG8gJW5cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wic2V0ICVtLm1vdG9yMiBkaXJlY3Rpb24gdG8gJW0ubW90b3JEaXJlY3Rpb25cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiBkaXN0YW5jZSAlbS5sZXNzTW9yZSAlblwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJ3aGVuIHRpbHQgJW0uZU5lICVuXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcImRpc3RhbmNlXCIsIFwiclwiLCAyMCwgXCJcIl0sXG4gIFtcInRpbHRcIiwgXCJyXCIsIDIwLCBcIlwiXSxcblxuICBbXCJ0dXJuICVtLm1vdG9yIG9uIGZvciAlbiBzZWNvbmRzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInNldCBsaWdodCBjb2xvciB0byAlblwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJwbGF5IG5vdGUgJW4gZm9yICVuIHNlY29uZHNcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiB0aWx0ZWRcIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1widGlsdCAlbS54eHhcIiwgXCJyXCIsIDIwLCBcIlwiXSxcblxuICBbXCJlbHNlXCIsIFwiZWxzZVwiLCA2LCBcIlwiXSxcbiAgW1wiZW5kXCIsIFwiZW5kXCIsIDYsIFwiXCJdLFxuICBbXCIuIC4gLlwiLCBcIiBcIiwgNDIsIFwiXCJdLFxuXG4gIFtcIiVuIEBhZGRJbnB1dFwiLCBcInJpbmdcIiwgNDIsIFwiXCJdLFxuXG4gIFtcInVzZXIgaWRcIiwgXCJyXCIsIDAsIFwiXCJdLFxuXG4gIFtcImlmICViXCIsIFwiY1wiLCAwLCBcImRvSWZcIl0sXG4gIFtcImlmICViXCIsIFwiZVwiLCAwLCBcImRvSWZFbHNlXCJdLFxuICBbXCJmb3JldmVyIGlmICViXCIsIFwiY2ZcIiwgMCwgXCJkb0ZvcmV2ZXJJZlwiXSxcbiAgW1wic3RvcCBzY3JpcHRcIiwgXCJmXCIsIDAsIFwiZG9SZXR1cm5cIl0sXG4gIFtcInN0b3AgYWxsXCIsIFwiZlwiLCAwLCBcInN0b3BBbGxcIl0sXG4gIFtcInN3aXRjaCB0byBjb3N0dW1lICVtLmNvc3R1bWVcIiwgXCIgXCIsIDAsIFwibG9va0xpa2U6XCJdLFxuICBbXCJuZXh0IGJhY2tncm91bmRcIiwgXCIgXCIsIDAsIFwibmV4dFNjZW5lXCJdLFxuICBbXCJzd2l0Y2ggdG8gYmFja2dyb3VuZCAlbS5iYWNrZHJvcFwiLCBcIiBcIiwgMCwgXCJzdGFydFNjZW5lXCJdLFxuICBbXCJiYWNrZ3JvdW5kICNcIiwgXCJyXCIsIDAsIFwiYmFja2dyb3VuZEluZGV4XCJdLFxuICBbXCJsb3VkP1wiLCBcImJcIiwgMCwgXCJpc0xvdWRcIl0sXG5dXG4iLCIvKiBmb3IgY29uc3R1Y3RpbmcgU1ZHcyAqL1xuXG5mdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG59XG5mdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxufVxuXG4vLyBzZXQgYnkgU1ZHLmluaXRcbnZhciBkb2N1bWVudFxudmFyIHhtbFxuXG52YXIgZGlyZWN0UHJvcHMgPSB7XG4gIHRleHRDb250ZW50OiB0cnVlLFxufVxuXG52YXIgU1ZHID0gKG1vZHVsZS5leHBvcnRzID0ge1xuICBpbml0KHdpbmRvdywgbWFrZUNhbnZhcykge1xuICAgIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG4gICAgdmFyIERPTVBhcnNlciA9IHdpbmRvdy5ET01QYXJzZXJcbiAgICB4bWwgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKFwiPHhtbD48L3htbD5cIiwgXCJhcHBsaWNhdGlvbi94bWxcIilcbiAgICBTVkcuWE1MU2VyaWFsaXplciA9IHdpbmRvdy5YTUxTZXJpYWxpemVyXG5cbiAgICBTVkcubWFrZUNhbnZhcyA9IG1ha2VDYW52YXNcbiAgfSxcblxuICBjZGF0YShjb250ZW50KSB7XG4gICAgcmV0dXJuIHhtbC5jcmVhdGVDREFUQVNlY3Rpb24oY29udGVudClcbiAgfSxcblxuICBlbChuYW1lLCBwcm9wcykge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIG5hbWUpXG4gICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhlbCwgcHJvcHMpXG4gIH0sXG5cbiAgc2V0UHJvcHMoZWwsIHByb3BzKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHByb3BzKSB7XG4gICAgICB2YXIgdmFsdWUgPSBcIlwiICsgcHJvcHNba2V5XVxuICAgICAgaWYgKGRpcmVjdFByb3BzW2tleV0pIHtcbiAgICAgICAgZWxba2V5XSA9IHZhbHVlXG4gICAgICB9IGVsc2UgaWYgKC9eeGxpbms6Ly50ZXN0KGtleSkpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsIGtleS5zbGljZSg2KSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHByb3BzW2tleV0gIT09IG51bGwgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhudWxsLCBrZXksIHZhbHVlKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWxcbiAgfSxcblxuICB3aXRoQ2hpbGRyZW4oZWwsIGNoaWxkcmVuKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgZWwuYXBwZW5kQ2hpbGQoY2hpbGRyZW5baV0pXG4gICAgfVxuICAgIHJldHVybiBlbFxuICB9LFxuXG4gIGdyb3VwKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIFNWRy53aXRoQ2hpbGRyZW4oU1ZHLmVsKFwiZ1wiKSwgY2hpbGRyZW4pXG4gIH0sXG5cbiAgbmV3U1ZHKHdpZHRoLCBoZWlnaHQpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFwic3ZnXCIsIHtcbiAgICAgIHZlcnNpb246IFwiMS4xXCIsXG4gICAgICB3aWR0aDogd2lkdGgsXG4gICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICB9KVxuICB9LFxuXG4gIHBvbHlnb24ocHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFxuICAgICAgXCJwb2x5Z29uXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcG9pbnRzOiBwcm9wcy5wb2ludHMuam9pbihcIiBcIiksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBwYXRoKHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicGF0aFwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IG51bGwsXG4gICAgICAgIGQ6IHByb3BzLnBhdGguam9pbihcIiBcIiksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICB0ZXh0KHgsIHksIGNvbnRlbnQsIHByb3BzKSB7XG4gICAgdmFyIHRleHQgPSBTVkcuZWwoXG4gICAgICBcInRleHRcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICB4OiB4LFxuICAgICAgICB5OiB5LFxuICAgICAgICB0ZXh0Q29udGVudDogY29udGVudCxcbiAgICAgIH0pXG4gICAgKVxuICAgIHJldHVybiB0ZXh0XG4gIH0sXG5cbiAgc3ltYm9sKGhyZWYpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFwidXNlXCIsIHtcbiAgICAgIFwieGxpbms6aHJlZlwiOiBocmVmLFxuICAgIH0pXG4gIH0sXG5cbiAgbW92ZShkeCwgZHksIGVsKSB7XG4gICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICB0cmFuc2Zvcm06IFtcInRyYW5zbGF0ZShcIiwgZHgsIFwiIFwiLCBkeSwgXCIpXCJdLmpvaW4oXCJcIiksXG4gICAgfSlcbiAgICByZXR1cm4gZWxcbiAgfSxcblxuICB0cmFuc2xhdGVQYXRoKGR4LCBkeSwgcGF0aCkge1xuICAgIHZhciBpc1ggPSB0cnVlXG4gICAgdmFyIHBhcnRzID0gcGF0aC5zcGxpdChcIiBcIilcbiAgICB2YXIgb3V0ID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcGFydCA9IHBhcnRzW2ldXG4gICAgICBpZiAocGFydCA9PT0gXCJBXCIpIHtcbiAgICAgICAgdmFyIGogPSBpICsgNVxuICAgICAgICBvdXQucHVzaChcIkFcIilcbiAgICAgICAgd2hpbGUgKGkgPCBqKSB7XG4gICAgICAgICAgb3V0LnB1c2gocGFydHNbKytpXSlcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZVxuICAgICAgfSBlbHNlIGlmICgvW0EtWmEtel0vLnRlc3QocGFydCkpIHtcbiAgICAgICAgYXNzZXJ0KGlzWClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnQgPSArcGFydFxuICAgICAgICBwYXJ0ICs9IGlzWCA/IGR4IDogZHlcbiAgICAgICAgaXNYID0gIWlzWFxuICAgICAgfVxuICAgICAgb3V0LnB1c2gocGFydClcbiAgICB9XG4gICAgcmV0dXJuIG91dC5qb2luKFwiIFwiKVxuICB9LFxuXG4gIC8qIHNoYXBlcyAqL1xuXG4gIHJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFxuICAgICAgXCJyZWN0XCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMCxcbiAgICAgICAgd2lkdGg6IHcsXG4gICAgICAgIGhlaWdodDogaCxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGVsbGlwc2UodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFxuICAgICAgXCJlbGxpcHNlXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgY3g6IHcgLyAyLFxuICAgICAgICBjeTogaCAvIDIsXG4gICAgICAgIHJ4OiB3IC8gMixcbiAgICAgICAgcnk6IGggLyAyLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgYXJjKHAxeCwgcDF5LCBwMngsIHAyeSwgcngsIHJ5KSB7XG4gICAgdmFyIHIgPSBwMnkgLSBwMXlcbiAgICByZXR1cm4gW1wiTFwiLCBwMXgsIHAxeSwgXCJBXCIsIHJ4LCByeSwgMCwgMCwgMSwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgYXJjdyhwMXgsIHAxeSwgcDJ4LCBwMnksIHJ4LCByeSkge1xuICAgIHZhciByID0gcDJ5IC0gcDF5XG4gICAgcmV0dXJuIFtcIkxcIiwgcDF4LCBwMXksIFwiQVwiLCByeCwgcnksIDAsIDAsIDAsIHAyeCwgcDJ5XS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIHJvdW5kUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucmVjdChcbiAgICAgIHcsXG4gICAgICBoLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHJ4OiA0LFxuICAgICAgICByeTogNCxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHBpbGxSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHIgPSBoIC8gMlxuICAgIHJldHVybiBTVkcucmVjdChcbiAgICAgIHcsXG4gICAgICBoLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHJ4OiByLFxuICAgICAgICByeTogcixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHBvaW50ZWRQYXRoKHcsIGgpIHtcbiAgICB2YXIgciA9IGggLyAyXG4gICAgcmV0dXJuIFtcbiAgICAgIFwiTVwiLFxuICAgICAgcixcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIHcgLSByLFxuICAgICAgMCxcbiAgICAgIHcsXG4gICAgICByLFxuICAgICAgXCJMXCIsXG4gICAgICB3LFxuICAgICAgcixcbiAgICAgIHcgLSByLFxuICAgICAgaCxcbiAgICAgIFwiTFwiLFxuICAgICAgcixcbiAgICAgIGgsXG4gICAgICAwLFxuICAgICAgcixcbiAgICAgIFwiTFwiLFxuICAgICAgMCxcbiAgICAgIHIsXG4gICAgICByLFxuICAgICAgMCxcbiAgICAgIFwiWlwiLFxuICAgIF1cbiAgfSxcblxuICBwb2ludGVkUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBTVkcucG9pbnRlZFBhdGgodywgaCksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuXG4gIGdldFRvcCh3KSB7XG4gICAgcmV0dXJuIFtcIk1cIiwgMCwgNCxcbiAgICAgIC8vIFwiTFwiLCAxLCAxLFxuICAgICAgLy8gXCJMXCIsIDQsIDAsXG4gICAgICBcIlFcIiwgU1ZHLmN1cnZlKDAsIDQsIDQsIDAsIDApLFxuICAgICAgW1wiTFwiLCA4LCAwXS5qb2luKFwiIFwiKSxcbiAgICAgIFwiYyAyIDAgMyAxIDQgMlwiLFxuICAgICAgXCJsIDEuNSAxLjVcIixcbiAgICAgIFwiYyAxIDEgMiAyIDQgMlwiLFxuICAgICAgXCJoIDhcIixcbiAgICAgIFwiYyAyIDAgMyAtMSA0IC0yXCIsXG4gICAgICBcImwgMS41IC0xLjVcIixcbiAgICAgIFwiYyAxIC0xIDIgLTIgNCAtMlwiLFxuICAgICAgXCJMXCIsIHcgLSA0LCAwLFxuICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3IC0gNCwgMCwgdywgNCwgMCksXG4gICAgICBcIkxcIiwgdywgNFxuICAgIF0uam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRSaW5nVG9wKHcpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICAwLFxuICAgICAgMyxcbiAgICAgIFwiTFwiLFxuICAgICAgMyxcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIDcsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICAxMCxcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDE2LFxuICAgICAgMyxcbiAgICAgIFwiTFwiLFxuICAgICAgMTksXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gMyxcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIHcsXG4gICAgICAzLFxuICAgIF0uam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRSaWdodEFuZEJvdHRvbSh3LCB5LCBoYXNOb3RjaCwgaW5zZXQpIHtcbiAgICBpZiAodHlwZW9mIGluc2V0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnNldCA9IDBcbiAgICB9XG4gICAgLy92YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gMywgXCJMXCIsIHcgLSAzLCB5XVxuICAgIHZhciBhcnIgPSBbXCJMXCIsIHcsIHkgLSA0LCBcIlFcIiwgU1ZHLmN1cnZlKHcsIHkgLSA0LCB3IC0gNCwgeSwgMCldXG4gICAgaWYgKGhhc05vdGNoKSB7XG4gICAgICAvLyBhcnIgPSBhcnIuY29uY2F0KFtcbiAgICAgIC8vICAgXCJMXCIsXG4gICAgICAvLyAgIGluc2V0ICsgMzAsXG4gICAgICAvLyAgIHksXG4gICAgICAvLyAgIFwiTFwiLFxuICAgICAgLy8gICBpbnNldCArIDI0LFxuICAgICAgLy8gICB5ICsgNSxcbiAgICAgIC8vICAgXCJMXCIsXG4gICAgICAvLyAgIGluc2V0ICsgMTQsXG4gICAgICAvLyAgIHkgKyA1LFxuICAgICAgLy8gICBcIkxcIixcbiAgICAgIC8vICAgaW5zZXQgKyA4LFxuICAgICAgLy8gICB5LFxuICAgICAgLy8gXSlcbiAgICAgIGFyciA9IGFyci5jb25jYXQoW1xuICAgICAgICBbXCJMXCIsIGluc2V0ICsgMzUsIHldLmpvaW4oXCIgXCIpLFxuICAgICAgICBcImMgLTIgMCAtMyAxIC00IDJcIixcbiAgICAgICAgXCJsIC0xLjUgMS41XCIsXG4gICAgICAgIFwiYyAtMSAxIC0yIDIgLTQgMlwiLFxuICAgICAgICBcImggLThcIixcbiAgICAgICAgXCJjIC0yIDAgLTMgLTEgLTQgLTJcIixcbiAgICAgICAgXCJsIC0xLjUgLTEuNVwiLFxuICAgICAgICBcImMgLTEgLTEgLTIgLTIgLTQgLTJcIixcbiAgICAgIF0pXG4gICAgfVxuICAgIGlmIChpbnNldCA9PT0gMCkge1xuICAgICAgYXJyLnB1c2goXCJMXCIsIGluc2V0ICsgNCwgeSlcbiAgICAgIGFyci5wdXNoKFwiYSA0IDQgMCAwIDEgLTQgLTRcIilcbiAgICB9IGVsc2Uge1xuICAgICAgYXJyLnB1c2goXCJMXCIsIGluc2V0ICsgNCwgeSlcbiAgICAgIGFyci5wdXNoKFwiYSA0IDQgMCAwIDAgLTQgNFwiKVxuICAgIH1cbiAgICByZXR1cm4gYXJyLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0QXJtKHcsIGFybVRvcCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIkxcIiwgMTAsIGFybVRvcCAtIDQsXG4gICAgICBcImEgLTQgLTQgMCAwIDAgNCA0XCIsXG4gICAgICBcIkxcIiwgdyAtIDQsIGFybVRvcCxcbiAgICAgIFwiYSA0IDQgMCAwIDEgNCA0XCJcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG4gIFxuICBcblxuICBzdGFja1JlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogW1NWRy5nZXRUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCB0cnVlLCAwKSwgXCJaXCJdLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgY2FwUGF0aCh3LCBoKSB7XG4gICAgcmV0dXJuIFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgZmFsc2UsIDApLCBcIlpcIl1cbiAgfSxcblxuICByaW5nQ2FwUGF0aCh3LCBoKSB7XG4gICAgcmV0dXJuIFtTVkcuZ2V0UmluZ1RvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIGZhbHNlLCAwKSwgXCJaXCJdXG4gIH0sXG5cbiAgY2FwUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBTVkcuY2FwUGF0aCh3LCBoKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGhhdFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLCAwLCAxMixcbiAgICAgICAgU1ZHLmFyYygwLCAxMCwgNjUsIDEwLCA2NSwgODUpLFxuICAgICAgICBcIkxcIiwgdy00LCAxMCxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3IC0gNCwgMTAsIHcsIDEwICsgNCwgMCksXG4gICAgICAgIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCB0cnVlKSxcbiAgICAgICAgXCJaXCIsXG4gICAgICBdLFxuICAgIH0pKTtcbiAgfSxcblxuICBjdXJ2ZShwMXgsIHAxeSwgcDJ4LCBwMnksIHJvdW5kbmVzcykge1xuICAgIHZhciByb3VuZG5lc3MgPSByb3VuZG5lc3MgfHwgMC40MlxuICAgIHZhciBtaWRYID0gKHAxeCArIHAyeCkgLyAyLjBcbiAgICB2YXIgbWlkWSA9IChwMXkgKyBwMnkpIC8gMi4wXG4gICAgdmFyIGN4ID0gTWF0aC5yb3VuZChtaWRYICsgcm91bmRuZXNzICogKHAyeSAtIHAxeSkpXG4gICAgdmFyIGN5ID0gTWF0aC5yb3VuZChtaWRZIC0gcm91bmRuZXNzICogKHAyeCAtIHAxeCkpXG4gICAgcmV0dXJuIFtjeCwgY3ksIHAyeCwgcDJ5XS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIHByb2NIYXRCYXNlKHcsIGgsIGFyY2hSb3VuZG5lc3MsIHByb3BzKSB7XG4gICAgLy8gVE9ETyB1c2UgYXJjKClcbiAgICAvLyB2YXIgYXJjaFJvdW5kbmVzcyA9IE1hdGgubWluKDAuMiwgMzUgLyB3KTsgLy91c2VkIGluIHNjcmF0Y2hibG9ja3MyXG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIiwgMCwgaC0zLFxuICAgICAgICBcIkxcIiwgMCwgMTAsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUoMCwgMTAsIDE1LCAtNSwgMCksXG4gICAgICAgIFwiTFwiLCB3LTE1LCAtNSxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3LTE1LCAtNSwgdywgMTAsIDApLFxuICAgICAgICBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSksXG4gICAgICBdLFxuICAgIH0pKTtcbiAgfSxcblxuICBwcm9jSGF0Q2FwKHcsIGgsIGFyY2hSb3VuZG5lc3MpIHtcbiAgICAvLyBUT0RPIHVzZSBhcmMoKVxuICAgIC8vIFRPRE8gdGhpcyBkb2Vzbid0IGxvb2sgcXVpdGUgcmlnaHRcbiAgICByZXR1cm4gU1ZHLnBhdGgoe1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIixcbiAgICAgICAgLTEsXG4gICAgICAgIDEzLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKC0xLCAxMywgdyArIDEsIDEzLCBhcmNoUm91bmRuZXNzKSxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSh3ICsgMSwgMTMsIHcsIDE2LCAwLjYpLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKHcsIDE2LCAwLCAxNiwgLWFyY2hSb3VuZG5lc3MpLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKDAsIDE2LCAtMSwgMTMsIDAuNiksXG4gICAgICAgIFwiWlwiLFxuICAgICAgXSxcbiAgICAgIGNsYXNzOiBcInNiLWRlZmluZS1oYXQtY2FwXCIsXG4gICAgfSlcbiAgfSxcblxuICBwcm9jSGF0UmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHZhciBxID0gNTJcbiAgICB2YXIgeSA9IGggLSBxXG5cbiAgICB2YXIgYXJjaFJvdW5kbmVzcyA9IE1hdGgubWluKDAuMiwgMzUgLyB3KVxuXG4gICAgcmV0dXJuIFNWRy5tb3ZlKFxuICAgICAgMCxcbiAgICAgIHksXG4gICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICBTVkcucHJvY0hhdEJhc2UodywgcSwgYXJjaFJvdW5kbmVzcywgcHJvcHMpLFxuICAgICAgICAvL1NWRy5wcm9jSGF0Q2FwKHcsIHEsIGFyY2hSb3VuZG5lc3MpLFxuICAgICAgXSlcbiAgICApXG4gIH0sXG5cbiAgbW91dGhSZWN0KHcsIGgsIGlzRmluYWwsIGxpbmVzLCBwcm9wcykge1xuICAgIHZhciB5ID0gbGluZXNbMF0uaGVpZ2h0XG4gICAgdmFyIHAgPSBbU1ZHLmdldFRvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIHksIHRydWUsIDEwKV1cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxpbmVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgaXNMYXN0ID0gaSArIDIgPT09IGxpbmVzLmxlbmd0aFxuXG4gICAgICB5ICs9IGxpbmVzW2ldLmhlaWdodCAtIDNcbiAgICAgIHAucHVzaChTVkcuZ2V0QXJtKHcsIHkpKVxuXG4gICAgICB2YXIgaGFzTm90Y2ggPSAhKGlzTGFzdCAmJiBpc0ZpbmFsKVxuICAgICAgdmFyIGluc2V0ID0gaXNMYXN0ID8gMCA6IDEwXG4gICAgICB5ICs9IGxpbmVzW2kgKyAxXS5oZWlnaHQgKyAzXG4gICAgICBwLnB1c2goU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIHksIGhhc05vdGNoLCBpbnNldCkpXG4gICAgfVxuICAgIHAucHVzaChcIlpcIilcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogcCxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHJpbmdSZWN0KHcsIGgsIGN5LCBjdywgY2gsIHNoYXBlLCBwcm9wcykge1xuICAgIHZhciByID0gOFxuICAgIHZhciBmdW5jID1cbiAgICAgIHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgPyBTVkcucm91bmRSZWN0XG4gICAgICAgIDogc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgICAgICAgPyBTVkcucG9pbnRlZFBhdGhcbiAgICAgICAgICA6IGN3IDwgNDAgPyBTVkcucmluZ0NhcFBhdGggOiBTVkcuY2FwUGF0aFxuICAgIHJldHVybiBTVkcucmVjdChcbiAgICAgIHcsXG4gICAgICBoLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHJ4OiA0LFxuICAgICAgICByeTogNCxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNvbW1lbnRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHIgPSA2XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGNsYXNzOiBcInNiLWNvbW1lbnRcIixcbiAgICAgICAgcGF0aDogW1xuICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgIHIsXG4gICAgICAgICAgMCxcbiAgICAgICAgICBTVkcuYXJjKHcgLSByLCAwLCB3LCByLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjKHcsIGggLSByLCB3IC0gciwgaCwgciwgciksXG4gICAgICAgICAgU1ZHLmFyYyhyLCBoLCAwLCBoIC0gciwgciwgciksXG4gICAgICAgICAgU1ZHLmFyYygwLCByLCByLCAwLCByLCByKSxcbiAgICAgICAgICBcIlpcIixcbiAgICAgICAgXSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNvbW1lbnRMaW5lKHdpZHRoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcubW92ZShcbiAgICAgIC13aWR0aCxcbiAgICAgIDksXG4gICAgICBTVkcucmVjdChcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIDIsXG4gICAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICAgIGNsYXNzOiBcInNiLWNvbW1lbnQtbGluZVwiLFxuICAgICAgICB9KVxuICAgICAgKVxuICAgIClcbiAgfSxcblxuICBzdHJpa2V0aHJvdWdoTGluZSh3LCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBbXCJNXCIsIDAsIDAsIFwiTFwiLCB3LCAwXSxcbiAgICAgICAgY2xhc3M6IFwic2ItZGlmZiBzYi1kaWZmLWRlbFwiLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoXCIuL2RyYXcuanNcIilcblxuICB2YXIgRmlsdGVyID0gZnVuY3Rpb24oaWQsIHByb3BzKSB7XG4gICAgdGhpcy5lbCA9IFNWRy5lbChcbiAgICAgIFwiZmlsdGVyXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICB4MDogXCItNTAlXCIsXG4gICAgICAgIHkwOiBcIi01MCVcIixcbiAgICAgICAgd2lkdGg6IFwiMjAwJVwiLFxuICAgICAgICBoZWlnaHQ6IFwiMjAwJVwiLFxuICAgICAgfSlcbiAgICApXG4gICAgdGhpcy5oaWdoZXN0SWQgPSAwXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5mZSA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIHZhciBzaG9ydE5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvZ2F1c3NpYW58b3NpdGUvLCBcIlwiKVxuICAgIHZhciBpZCA9IFtzaG9ydE5hbWUsIFwiLVwiLCArK3RoaXMuaGlnaGVzdElkXS5qb2luKFwiXCIpXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZChcbiAgICAgIFNWRy53aXRoQ2hpbGRyZW4oXG4gICAgICAgIFNWRy5lbChcbiAgICAgICAgICBcImZlXCIgKyBuYW1lLFxuICAgICAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICAgICAgcmVzdWx0OiBpZCxcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgICBjaGlsZHJlbiB8fCBbXVxuICAgICAgKVxuICAgIClcbiAgICByZXR1cm4gaWRcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmNvbXAgPSBmdW5jdGlvbihvcCwgaW4xLCBpbjIsIHByb3BzKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXG4gICAgICBcIkNvbXBvc2l0ZVwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIG9wZXJhdG9yOiBvcCxcbiAgICAgICAgaW46IGluMSxcbiAgICAgICAgaW4yOiBpbjIsXG4gICAgICB9KVxuICAgIClcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24oaW4xLCBpbjIpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wKFwiYXJpdGhtZXRpY1wiLCBpbjEsIGluMiwgeyBrMjogKzEsIGszOiAtMSB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUub2Zmc2V0ID0gZnVuY3Rpb24oZHgsIGR5LCBpbjEpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIk9mZnNldFwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgZHg6IGR4LFxuICAgICAgZHk6IGR5LFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5mbG9vZCA9IGZ1bmN0aW9uKGNvbG9yLCBvcGFjaXR5LCBpbjEpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIkZsb29kXCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICBcImZsb29kLWNvbG9yXCI6IGNvbG9yLFxuICAgICAgXCJmbG9vZC1vcGFjaXR5XCI6IG9wYWNpdHksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmJsdXIgPSBmdW5jdGlvbihkZXYsIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKFwiR2F1c3NpYW5CbHVyXCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICBzdGREZXZpYXRpb246IFtkZXYsIGRldl0uam9pbihcIiBcIiksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmNvbG9yTWF0cml4ID0gZnVuY3Rpb24oaW4xLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIkNvbG9yTWF0cml4XCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICB0eXBlOiBcIm1hdHJpeFwiLFxuICAgICAgdmFsdWVzOiB2YWx1ZXMuam9pbihcIiBcIiksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24oY2hpbGRyZW4pIHtcbiAgICB0aGlzLmZlKFxuICAgICAgXCJNZXJnZVwiLFxuICAgICAge30sXG4gICAgICBjaGlsZHJlbi5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gU1ZHLmVsKFwiZmVNZXJnZU5vZGVcIiwge1xuICAgICAgICAgIGluOiBuYW1lLFxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICApXG4gIH1cblxuICByZXR1cm4gRmlsdGVyXG59KSgpXG4iLCIvKlxuICogc2NyYXRjaGJsb2Nrc1xuICogaHR0cDovL3NjcmF0Y2hibG9ja3MuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTYsIFRpbSBSYWR2YW5cbiAqIEBsaWNlbnNlIE1JVFxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICovXG47KGZ1bmN0aW9uKG1vZCkge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gbW9kXG4gIH0gZWxzZSB7XG4gICAgdmFyIG1ha2VDYW52YXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG4gICAgfVxuICAgIHZhciBzY3JhdGNoYmxvY2tzID0gKHdpbmRvdy5zY3JhdGNoYmxvY2tzID0gbW9kKHdpbmRvdywgbWFrZUNhbnZhcykpXG5cbiAgICAvLyBhZGQgb3VyIENTUyB0byB0aGUgcGFnZVxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyYXRjaGJsb2Nrcy5tYWtlU3R5bGUoKSlcbiAgfVxufSkoZnVuY3Rpb24od2luZG93LCBtYWtlQ2FudmFzKSB7XG4gIFwidXNlIHN0cmljdFwiXG5cbiAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG5cbiAgLyogdXRpbHMgKi9cblxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIgeyBhbGxMYW5ndWFnZXMsIGxvYWRMYW5ndWFnZXMgfSA9IHJlcXVpcmUoXCIuL2Jsb2Nrcy5qc1wiKVxuXG4gIHZhciBwYXJzZSA9IHJlcXVpcmUoXCIuL3N5bnRheC5qc1wiKS5wYXJzZVxuXG4gIHZhciBzdHlsZSA9IHJlcXVpcmUoXCIuL3N0eWxlLmpzXCIpXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcbiAgfSA9IHJlcXVpcmUoXCIuL21vZGVsLmpzXCIpXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG4gIFNWRy5pbml0KHdpbmRvdywgbWFrZUNhbnZhcylcblxuICBMYWJlbC5tZWFzdXJpbmcgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IFNWRy5tYWtlQ2FudmFzKClcbiAgICByZXR1cm4gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuICB9KSgpXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIGZ1bmN0aW9uIHJlbmRlcihkb2MsIGNiKSB7XG4gICAgcmV0dXJuIGRvYy5yZW5kZXIoY2IpXG4gIH1cblxuICAvKioqIFJlbmRlciAqKiovXG5cbiAgLy8gcmVhZCBjb2RlIGZyb20gYSBET00gZWxlbWVudFxuICBmdW5jdGlvbiByZWFkQ29kZShlbCwgb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICB2YXIgaHRtbCA9IGVsLmlubmVySFRNTC5yZXBsYWNlKC88YnI+XFxzP3xcXG58XFxyXFxufFxcci9naSwgXCJcXG5cIilcbiAgICB2YXIgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKVxuICAgIHByZS5pbm5lckhUTUwgPSBodG1sXG4gICAgdmFyIGNvZGUgPSBwcmUudGV4dENvbnRlbnRcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoXCJcXG5cIiwgXCJcIilcbiAgICB9XG4gICAgcmV0dXJuIGNvZGVcbiAgfVxuXG4gIC8vIGluc2VydCAnc3ZnJyBpbnRvICdlbCcsIHdpdGggYXBwcm9wcmlhdGUgd3JhcHBlciBlbGVtZW50c1xuICBmdW5jdGlvbiByZXBsYWNlKGVsLCBzdmcsIHNjcmlwdHMsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKVxuICAgICAgdmFyIGNscyA9IFwic2NyYXRjaGJsb2NrcyBzY3JhdGNoYmxvY2tzLWlubGluZVwiXG4gICAgICBpZiAoc2NyaXB0c1swXSAmJiAhc2NyaXB0c1swXS5pc0VtcHR5KSB7XG4gICAgICAgIGNscyArPSBcIiBzY3JhdGNoYmxvY2tzLWlubGluZS1cIiArIHNjcmlwdHNbMF0uYmxvY2tzWzBdLnNoYXBlXG4gICAgICB9XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gY2xzXG4gICAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCJcbiAgICAgIGNvbnRhaW5lci5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIlxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IFwic2NyYXRjaGJsb2Nrc1wiXG4gICAgfVxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzdmcpXG5cbiAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgZWwuYXBwZW5kQ2hpbGQoY29udGFpbmVyKVxuICB9XG5cbiAgLyogUmVuZGVyIGFsbCBtYXRjaGluZyBlbGVtZW50cyBpbiBwYWdlIHRvIHNoaW55IHNjcmF0Y2ggYmxvY2tzLlxuICAgKiBBY2NlcHRzIGEgQ1NTIHNlbGVjdG9yIGFzIGFuIGFyZ3VtZW50LlxuICAgKlxuICAgKiAgc2NyYXRjaGJsb2Nrcy5yZW5kZXJNYXRjaGluZyhcInByZS5ibG9ja3NcIik7XG4gICAqXG4gICAqIExpa2UgdGhlIG9sZCAnc2NyYXRjaGJsb2NrczIucGFyc2UoKS5cbiAgICovXG4gIHZhciByZW5kZXJNYXRjaGluZyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBvcHRpb25zKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgXCJwcmUuYmxvY2tzXCJcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJlblwiXSxcblxuICAgICAgICByZWFkOiByZWFkQ29kZSwgLy8gZnVuY3Rpb24oZWwsIG9wdGlvbnMpID0+IGNvZGVcbiAgICAgICAgcGFyc2U6IHBhcnNlLCAvLyBmdW5jdGlvbihjb2RlLCBvcHRpb25zKSA9PiBkb2NcbiAgICAgICAgcmVuZGVyOiByZW5kZXIsIC8vIGZ1bmN0aW9uKGRvYywgY2IpID0+IHN2Z1xuICAgICAgICByZXBsYWNlOiByZXBsYWNlLCAvLyBmdW5jdGlvbihlbCwgc3ZnLCBkb2MsIG9wdGlvbnMpXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIC8vIGZpbmQgZWxlbWVudHNcbiAgICB2YXIgcmVzdWx0cyA9IFtdLnNsaWNlLmFwcGx5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgdmFyIGNvZGUgPSBvcHRpb25zLnJlYWQoZWwsIG9wdGlvbnMpXG5cbiAgICAgIHZhciBkb2MgPSBvcHRpb25zLnBhcnNlKGNvZGUsIG9wdGlvbnMpXG5cbiAgICAgIG9wdGlvbnMucmVuZGVyKGRvYywgZnVuY3Rpb24oc3ZnKSB7XG4gICAgICAgIG9wdGlvbnMucmVwbGFjZShlbCwgc3ZnLCBkb2MsIG9wdGlvbnMpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKiBQYXJzZSBzY3JhdGNoYmxvY2tzIGNvZGUgYW5kIHJldHVybiBYTUwgc3RyaW5nLlxuICAgKlxuICAgKiBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgTm9kZSwgcmVhbGx5LlxuICAgKi9cbiAgdmFyIHJlbmRlclNWR1N0cmluZyA9IGZ1bmN0aW9uKGNvZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZG9jID0gcGFyc2UoY29kZSwgb3B0aW9ucylcblxuICAgIC8vIFdBUk46IERvY3VtZW50LnJlbmRlcigpIG1heSBiZWNvbWUgYXN5bmMgYWdhaW4gaW4gZnV0dXJlIDotKFxuICAgIGRvYy5yZW5kZXIoZnVuY3Rpb24oKSB7fSlcblxuICAgIHJldHVybiBkb2MuZXhwb3J0U1ZHU3RyaW5nKClcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWxsTGFuZ3VhZ2VzOiBhbGxMYW5ndWFnZXMsIC8vIHJlYWQtb25seVxuICAgIGxvYWRMYW5ndWFnZXM6IGxvYWRMYW5ndWFnZXMsXG5cbiAgICBmcm9tSlNPTjogRG9jdW1lbnQuZnJvbUpTT04sXG4gICAgdG9KU09OOiBmdW5jdGlvbihkb2MpIHtcbiAgICAgIHJldHVybiBkb2MudG9KU09OKClcbiAgICB9LFxuICAgIHN0cmluZ2lmeTogZnVuY3Rpb24oZG9jKSB7XG4gICAgICByZXR1cm4gZG9jLnN0cmluZ2lmeSgpXG4gICAgfSxcblxuICAgIExhYmVsLFxuICAgIEljb24sXG4gICAgSW5wdXQsXG4gICAgQmxvY2ssXG4gICAgQ29tbWVudCxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG5cbiAgICByZWFkOiByZWFkQ29kZSxcbiAgICBwYXJzZTogcGFyc2UsXG4gICAgLy8gcmVuZGVyOiByZW5kZXIsIC8vIFJFTU9WRUQgc2luY2UgZG9jLnJlbmRlcihjYikgbWFrZXMgbXVjaCBtb3JlIHNlbnNlXG4gICAgcmVwbGFjZTogcmVwbGFjZSxcbiAgICByZW5kZXJNYXRjaGluZzogcmVuZGVyTWF0Y2hpbmcsXG5cbiAgICByZW5kZXJTVkdTdHJpbmc6IHJlbmRlclNWR1N0cmluZyxcbiAgICBtYWtlU3R5bGU6IHN0eWxlLm1ha2VTdHlsZSxcbiAgfVxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIGZ1bmN0aW9uIGluZGVudCh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgIHJldHVybiBcIiAgXCIgKyBsaW5lXG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcXG5cIilcbiAgfVxuXG4gIGZ1bmN0aW9uIG1heWJlTnVtYmVyKHYpIHtcbiAgICB2ID0gXCJcIiArIHZcbiAgICB2YXIgbiA9IHBhcnNlSW50KHYpXG4gICAgaWYgKCFpc05hTihuKSkge1xuICAgICAgcmV0dXJuIG5cbiAgICB9XG4gICAgdmFyIGYgPSBwYXJzZUZsb2F0KHYpXG4gICAgaWYgKCFpc05hTihmKSkge1xuICAgICAgcmV0dXJuIGZcbiAgICB9XG4gICAgcmV0dXJuIHZcbiAgfVxuXG4gIHZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG5cbiAgdmFyIHtcbiAgICBkZWZhdWx0Rm9udEZhbWlseSxcbiAgICBtYWtlU3R5bGUsXG4gICAgbWFrZUljb25zLFxuICAgIGRhcmtSZWN0LFxuICAgIGJldmVsRmlsdGVyLFxuICAgIGRhcmtGaWx0ZXIsXG4gICAgZGVzYXR1cmF0ZUZpbHRlcixcbiAgfSA9IHJlcXVpcmUoXCIuL3N0eWxlLmpzXCIpXG5cbiAgdmFyIHtcbiAgICBibG9ja3NCeVNlbGVjdG9yLFxuICAgIHBhcnNlU3BlYyxcbiAgICBpbnB1dFBhdCxcbiAgICBpY29uUGF0LFxuICAgIHJ0bExhbmd1YWdlcyxcbiAgICB1bmljb2RlSWNvbnMsXG4gICAgZW5nbGlzaCxcbiAgICBibG9ja05hbWUsXG4gIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICAvKiBMYWJlbCAqL1xuXG4gIHZhciBMYWJlbCA9IGZ1bmN0aW9uKHZhbHVlLCBjbHMpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmNscyA9IGNscyB8fCBcIlwiXG4gICAgdGhpcy5lbCA9IG51bGxcbiAgICB0aGlzLmhlaWdodCA9IDExXG4gICAgdGhpcy5tZXRyaWNzID0gbnVsbFxuICAgIHRoaXMueCA9IDBcbiAgfVxuICBMYWJlbC5wcm90b3R5cGUuaXNMYWJlbCA9IHRydWVcblxuICBMYWJlbC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMudmFsdWUgPT09IFwiPFwiIHx8IHRoaXMudmFsdWUgPT09IFwiPlwiKSByZXR1cm4gdGhpcy52YWx1ZVxuICAgIHJldHVybiB0aGlzLnZhbHVlLnJlcGxhY2UoLyhbPD5bXFxdKCl7fV0pL2csIFwiXFxcXCQxXCIpXG4gIH1cblxuICBMYWJlbC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVsXG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTGFiZWwucHJvdG90eXBlLCBcIndpZHRoXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWV0cmljcy53aWR0aFxuICAgIH0sXG4gIH0pXG5cbiAgTGFiZWwubWV0cmljc0NhY2hlID0ge31cbiAgTGFiZWwudG9NZWFzdXJlID0gW11cblxuICBMYWJlbC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWVcbiAgICB2YXIgY2xzID0gdGhpcy5jbHNcbiAgICB0aGlzLmVsID0gU1ZHLnRleHQoMCwgMTAsIHZhbHVlLCB7XG4gICAgICBjbGFzczogXCJzYi1sYWJlbCBcIiArIGNscyxcbiAgICB9KVxuXG4gICAgdmFyIGNhY2hlID0gTGFiZWwubWV0cmljc0NhY2hlW2Nsc11cbiAgICBpZiAoIWNhY2hlKSB7XG4gICAgICBjYWNoZSA9IExhYmVsLm1ldHJpY3NDYWNoZVtjbHNdID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgIH1cblxuICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChjYWNoZSwgdmFsdWUpKSB7XG4gICAgICB0aGlzLm1ldHJpY3MgPSBjYWNoZVt2YWx1ZV1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGZvbnQgPSAvc2ItY29tbWVudC1sYWJlbC8udGVzdCh0aGlzLmNscylcbiAgICAgICAgPyBcIm5vcm1hbCAxMXB4ICdIZWx2ZXRpY2EgTmV1ZScsIEhlbHZldGljYSwgc2Fucy1zZXJpZlwiXG4gICAgICAgIDogL3NiLWxpdGVyYWwvLnRlc3QodGhpcy5jbHMpXG4gICAgICAgICAgPyBcIm5vcm1hbCAxMXB4IFwiICsgZGVmYXVsdEZvbnRGYW1pbHlcbiAgICAgICAgICA6IFwiYm9sZCAxMXB4IFwiICsgZGVmYXVsdEZvbnRGYW1pbHlcbiAgICAgIHRoaXMubWV0cmljcyA9IGNhY2hlW3ZhbHVlXSA9IExhYmVsLm1lYXN1cmUodmFsdWUsIGZvbnQpXG4gICAgICAvLyBUT0RPOiB3b3JkLXNwYWNpbmc/IChmb3J0dW5hdGVseSBpdCBzZWVtcyB0byBoYXZlIG5vIGVmZmVjdCEpXG4gICAgfVxuICB9XG4gIC8vVGV4dCBib3ggc2NhbGluZ1xuICBMYWJlbC5tZWFzdXJlID0gZnVuY3Rpb24odmFsdWUsIGZvbnQpIHtcbiAgICB2YXIgY29udGV4dCA9IExhYmVsLm1lYXN1cmluZ1xuICAgIGNvbnRleHQuZm9udCA9IGZvbnRcbiAgICB2YXIgdGV4dE1ldHJpY3MgPSBjb250ZXh0Lm1lYXN1cmVUZXh0KHZhbHVlKVxuICAgIHZhciB3aWR0aCA9ICh0ZXh0TWV0cmljcy53aWR0aCkgfCAtMC43NVxuICAgIHJldHVybiB7IHdpZHRoOiB3aWR0aCB9XG4gIH1cblxuICAvKiBJY29uICovXG5cbiAgdmFyIEljb24gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaXNBcnJvdyA9IG5hbWUgPT09IFwibG9vcEFycm93XCJcblxuICAgIHZhciBpbmZvID0gSWNvbi5pY29uc1tuYW1lXVxuICAgIGFzc2VydChpbmZvLCBcIm5vIGluZm8gZm9yIGljb24gXCIgKyBuYW1lKVxuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5mbylcbiAgfVxuICBcbiAgSWNvbi5wcm90b3R5cGUuaXNJY29uID0gdHJ1ZVxuXG4gIEljb24ucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB1bmljb2RlSWNvbnNbXCJAXCIgKyB0aGlzLm5hbWVdIHx8IFwiXCJcbiAgfVxuXG4gIEljb24uaWNvbnMgPSB7XG4gICAgZ3JlZW5GbGFnOiB7IHdpZHRoOiAxMiwgaGVpZ2h0OiA1LCBkeTogLTggfSxcbiAgICB0dXJuTGVmdDogeyB3aWR0aDogMTUsIGhlaWdodDogMTIsIGR5OiArMSB9LFxuICAgIHR1cm5SaWdodDogeyB3aWR0aDogMTUsIGhlaWdodDogMTIsIGR5OiArMSB9LFxuICAgIGxvb3BBcnJvdzogeyB3aWR0aDogMTQsIGhlaWdodDogMTEgfSxcbiAgICBhZGRJbnB1dDogeyB3aWR0aDogNCwgaGVpZ2h0OiA4IH0sXG4gICAgZGVsSW5wdXQ6IHsgd2lkdGg6IDQsIGhlaWdodDogOCB9LFxuICAgIG11c2ljQmxvY2s6IHsgd2lkdGg6IDI2LCBoZWlnaHQ6IDI2IH0sXG4gICAgcGVuQmxvY2s6IHsgd2lkdGg6IDI2LCBoZWlnaHQ6IDI2LCBkeTogMiB9LFxuICAgIHZpZGVvQmxvY2s6IHsgd2lkdGg6IDI2LCBoZWlnaHQ6IDI2LCBkeTogNi41IH0sXG4gICAgbGluZTogeyB3aWR0aDogMCwgaGVpZ2h0OiAyNiB9LFxuICAgIG5vcm1hbDogeyB3aWR0aDogLTQsIGhlaWdodDogMjAgfSxcbiAgfVxuICBcbiAgSWNvbi5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLm5hbWUgPT0gXCJub3JtYWxcIikge1xuICAgICAgcmV0dXJuIFNWRy5lbChcImxpbmVcIiwge1xuICAgICAgICB4MTogMCxcbiAgICAgICAgeTE6IDAsXG4gICAgICAgIHgyOiAwLFxuICAgICAgICB5MjogMjAsXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAodGhpcy5uYW1lID09IFwibGluZVwiKXtcbiAgICAgIHJldHVybiBTVkcuZWwoXCJsaW5lXCIsIHtcbiAgICAgICAgY2xhc3M6IFwic2Itb3V0bGluZVwiLFxuICAgICAgICBcInN0cm9rZS1saW5lY2FwXCI6IFwicm91bmRcIixcbiAgICAgICAgeDE6IDAsXG4gICAgICAgIHkxOiAwLFxuICAgICAgICB4MjogMCxcbiAgICAgICAgeTI6IDI2LFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFNWRy5zeW1ib2woXCIjXCIgKyB0aGlzLm5hbWUsIHtcbiAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuICBcblxuICAvKiBJbnB1dCAqL1xuXG4gIHZhciBJbnB1dCA9IGZ1bmN0aW9uKHNoYXBlLCB2YWx1ZSwgbWVudSkge1xuICAgIHRoaXMuc2hhcGUgPSBzaGFwZVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMubWVudSA9IG1lbnUgfHwgbnVsbFxuXG4gICAgdGhpcy5pc1JvdW5kID0gc2hhcGUgPT09IFwibnVtYmVyXCIgfHwgc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwicm91bmQtZHJvcGRvd25cIiB8fCBzaGFwZSA9PT0gXCJzdHJpbmdcIlxuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgdGhpcy5pc1N0YWNrID0gc2hhcGUgPT09IFwic3RhY2tcIlxuICAgIHRoaXMuaXNJbnNldCA9XG4gICAgICBzaGFwZSA9PT0gXCJib29sZWFuXCIgfHwgc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgdGhpcy5pc0NvbG9yID0gc2hhcGUgPT09IFwiY29sb3JcIlxuICAgIHRoaXMuaGFzQXJyb3cgPSBzaGFwZSA9PT0gXCJkcm9wZG93blwiIHx8IHNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiIHx8IHNoYXBlID09PSBcInJvdW5kLWRyb3Bkb3duXCJcbiAgICB0aGlzLmlzRGFya2VyID1cbiAgICAgIHNoYXBlID09PSBcImJvb2xlYW5cIiB8fCBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwicm91bmQtZHJvcGRvd25cIlxuICAgIHRoaXMuaXNTcXVhcmUgPVxuICAgICAgc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuXG4gICAgdGhpcy5oYXNMYWJlbCA9ICEodGhpcy5pc0NvbG9yIHx8IHRoaXMuaXNJbnNldClcbiAgICB0aGlzLmxhYmVsID0gdGhpcy5oYXNMYWJlbFxuICAgICAgPyBuZXcgTGFiZWwodmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICAgIDogbnVsbFxuICAgIHRoaXMueCA9IDBcbiAgfVxuICBJbnB1dC5wcm90b3R5cGUuaXNJbnB1dCA9IHRydWVcblxuICBJbnB1dC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIHZhbHVlLCBwYXJ0KSB7XG4gICAgdmFyIHNoYXBlID0ge1xuICAgICAgYjogXCJib29sZWFuXCIsXG4gICAgICBuOiBcIm51bWJlclwiLFxuICAgICAgczogXCJzdHJpbmdcIixcbiAgICAgIGQ6IFwibnVtYmVyLWRyb3Bkb3duXCIsXG4gICAgICBtOiBcImRyb3Bkb3duXCIsXG4gICAgICBjOiBcImNvbG9yXCIsXG4gICAgICByOiBcInJvdW5kLWRyb3Bkb3duXCIsXG4gICAgfVtwYXJ0WzFdXVxuXG4gICAgaWYgKHNoYXBlID09PSBcImNvbG9yXCIpIHtcbiAgICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApXG4gICAgICAgIHZhbHVlID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDI1NiAqIDI1NiAqIDI1NilcbiAgICAgIHZhbHVlID0gK3ZhbHVlXG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgICAgIHZhciBoZXggPSB2YWx1ZS50b1N0cmluZygxNilcbiAgICAgIGhleCA9IGhleC5zbGljZShNYXRoLm1heCgwLCBoZXgubGVuZ3RoIC0gNikpIC8vIGxhc3QgNiBjaGFyYWN0ZXJzXG4gICAgICB3aGlsZSAoaGV4Lmxlbmd0aCA8IDYpIGhleCA9IFwiMFwiICsgaGV4XG4gICAgICBpZiAoaGV4WzBdID09PSBoZXhbMV0gJiYgaGV4WzJdID09PSBoZXhbM10gJiYgaGV4WzRdID09PSBoZXhbNV0pIHtcbiAgICAgICAgaGV4ID0gaGV4WzBdICsgaGV4WzJdICsgaGV4WzRdXG4gICAgICB9XG4gICAgICB2YWx1ZSA9IFwiI1wiICsgaGV4XG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICB2YWx1ZSA9XG4gICAgICAgIHtcbiAgICAgICAgICBfbW91c2VfOiBcIm1vdXNlLXBvaW50ZXJcIixcbiAgICAgICAgICBfbXlzZWxmXzogXCJteXNlbGZcIixcbiAgICAgICAgICBfc3RhZ2VfOiBcIlN0YWdlXCIsXG4gICAgICAgICAgX2VkZ2VfOiBcImVkZ2VcIixcbiAgICAgICAgICBfcmFuZG9tXzogXCJyYW5kb20gcG9zaXRpb25cIixcbiAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIHZhciBtZW51ID0gdmFsdWVcbiAgICAgIHZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIikge1xuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSBcInJvdW5kLWRyb3Bkb3duXCIpIHtcbiAgICAgIHZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJbnB1dChzaGFwZSwgXCJcIiArIHZhbHVlLCBtZW51KVxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzQ29sb3IpIHtcbiAgICAgIGFzc2VydCh0aGlzLnZhbHVlWzBdID09PSBcIiNcIilcbiAgICAgIHZhciBoID0gdGhpcy52YWx1ZS5zbGljZSgxKVxuICAgICAgaWYgKGgubGVuZ3RoID09PSAzKSBoID0gaFswXSArIGhbMF0gKyBoWzFdICsgaFsxXSArIGhbMl0gKyBoWzJdXG4gICAgICByZXR1cm4gcGFyc2VJbnQoaCwgMTYpXG4gICAgICAvLyBUT0RPIHNpZ25lZCBpbnQ/XG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLm1lbnUgfHwgdGhpcy52YWx1ZVxuICAgICAgaWYgKHRoaXMuc2hhcGUgPT09IFwiZHJvcGRvd25cIikge1xuICAgICAgICB2YWx1ZSA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJtb3VzZS1wb2ludGVyXCI6IFwiX21vdXNlX1wiLFxuICAgICAgICAgICAgbXlzZWxmOiBcIl9teXNlbGZcIixcbiAgICAgICAgICAgIFN0YWdlOiBcIl9zdGFnZV9cIixcbiAgICAgICAgICAgIGVkZ2U6IFwiX2VkZ2VfXCIsXG4gICAgICAgICAgICBcInJhbmRvbSBwb3NpdGlvblwiOiBcIl9yYW5kb21fXCIsXG4gICAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzUm91bmQpIHtcbiAgICAgICAgdmFsdWUgPSBtYXliZU51bWJlcih2YWx1ZSlcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pc0Jvb2xlYW5cbiAgICAgID8gZmFsc2VcbiAgICAgIDogdGhpcy5pc1JvdW5kID8gbWF5YmVOdW1iZXIodGhpcy52YWx1ZSkgOiB0aGlzLnZhbHVlXG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgYXNzZXJ0KHRoaXMudmFsdWVbMF0gPT09IFwiI1wiKVxuICAgICAgcmV0dXJuIFwiW1wiICsgdGhpcy52YWx1ZSArIFwiXVwiXG4gICAgfVxuICAgIHZhciB0ZXh0ID0gKHRoaXMudmFsdWUgPyBcIlwiICsgdGhpcy52YWx1ZSA6IFwiXCIpXG4gICAgICAucmVwbGFjZSgvIHYkLywgXCIgXFxcXHZcIilcbiAgICAgIC5yZXBsYWNlKC8oW1xcXVxcXFxdKS9nLCBcIlxcXFwkMVwiKVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB0ZXh0ICs9IFwiIHZcIlxuICAgIHJldHVybiB0aGlzLmlzUm91bmRcbiAgICAgID8gXCIoXCIgKyB0ZXh0ICsgXCIpXCJcbiAgICAgIDogdGhpcy5pc1NxdWFyZVxuICAgICAgICA/IFwiW1wiICsgdGV4dCArIFwiXVwiXG4gICAgICAgIDogdGhpcy5pc0Jvb2xlYW4gPyBcIjw+XCIgOiB0aGlzLmlzU3RhY2sgPyBcInt9XCIgOiB0ZXh0XG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIGlmICh0aGlzLmhhc0Fycm93KSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLm1lbnUgfHwgdGhpcy52YWx1ZVxuICAgICAgdGhpcy52YWx1ZSA9IGxhbmcuZHJvcGRvd25zW3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgdGhpcy5sYWJlbCA9IG5ldyBMYWJlbCh0aGlzLnZhbHVlLCBbXCJzYi1saXRlcmFsLVwiICsgdGhpcy5zaGFwZV0pXG4gICAgfVxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMYWJlbCkgdGhpcy5sYWJlbC5tZWFzdXJlKClcbiAgfVxuXG4gIElucHV0LnNoYXBlcyA9IHtcbiAgICBzdHJpbmc6IFNWRy5waWxsUmVjdCxcbiAgICBudW1iZXI6IFNWRy5waWxsUmVjdCxcbiAgICBcIm51bWJlci1kcm9wZG93blwiOiBTVkcucGlsbFJlY3QsXG4gICAgXCJyb3VuZC1kcm9wZG93blwiOiBTVkcucGlsbFJlY3QsXG4gICAgY29sb3I6IFNWRy5waWxsUmVjdCxcbiAgICBkcm9wZG93bjogU1ZHLnJvdW5kUmVjdCxcblxuICAgIGJvb2xlYW46IFNWRy5wb2ludGVkUmVjdCxcbiAgICBzdGFjazogU1ZHLnN0YWNrUmVjdCxcbiAgICByZXBvcnRlcjogU1ZHLnJvdW5kUmVjdCxcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHtcbiAgICAgIHZhciBsYWJlbCA9IHRoaXMubGFiZWwuZHJhdygpXG4gICAgICB2YXIgdyA9IE1hdGgubWF4KFxuICAgICAgICAyNSxcbiAgICAgICAgdGhpcy5sYWJlbC53aWR0aCArXG4gICAgICAgICAgKHRoaXMuc2hhcGUgPT09IFwic3RyaW5nXCIgfHwgdGhpcy5zaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIiB8fCB0aGlzLnNoYXBlID09PSBcInJlcG9ydGVyXCIgPyAyMCA6IDIwKVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdyA9IHRoaXMuaXNJbnNldCA/IDMwIDogdGhpcy5pc0NvbG9yID8gMjUgOiBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB3ICs9IDhcbiAgICBpZiAodGhpcy5zaGFwZSA9PT0gXCJyb3VuZC1kcm9wZG93blwiKSB3ICs9IDZcbiAgICB0aGlzLndpZHRoID0gd1xuXG4gICAgdmFyIGggPSAodGhpcy5oZWlnaHQgPSB0aGlzLmlzUm91bmQgfHwgdGhpcy5pc0NvbG9yID8gMjAgOiAyMClcblxuICAgIHZhciBlbCA9IElucHV0LnNoYXBlc1t0aGlzLnNoYXBlXSh3LCBoKVxuICAgIGlmICh0aGlzLmlzQ29sb3IpIHtcbiAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICBmaWxsOiB0aGlzLnZhbHVlLFxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNEYXJrZXIpIHtcbiAgICAgIGVsID0gZGFya1JlY3QodywgaCwgcGFyZW50LmluZm8uY2F0ZWdvcnksIGVsKVxuICAgICAgaWYgKHBhcmVudC5pbmZvLmNvbG9yKSB7XG4gICAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICAgIGZpbGw6IHBhcmVudC5pbmZvLmNvbG9yLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGNsYXNzOiBbXCJzYi1pbnB1dFwiLCBcInNiLWlucHV0LVwiICsgdGhpcy5zaGFwZV0uam9pbihcIiBcIiksXG4gICAgICB9KSxcbiAgICBdKVxuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB7XG4gICAgICB2YXIgeCA9IHRoaXMuaXNSb3VuZCA/IDEwIDogNlxuICAgICAgcmVzdWx0LmFwcGVuZENoaWxkKFNWRy5tb3ZlKHgsIDQsIGxhYmVsKSlcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB5ID0gdGhpcy5zaGFwZSA9PT0gXCJkcm9wZG93blwiID8gNCA6IDRcbiAgICAgIGlmICh0aGlzLnNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiKSB7XG4gICAgICAgIHJlc3VsdC5hcHBlbmRDaGlsZChTVkcubW92ZSh3IC0gMTYsIDgsIFNWRy5zeW1ib2woXCIjYmxhY2tEcm9wZG93bkFycm93XCIsIHt9KSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQuYXBwZW5kQ2hpbGQoU1ZHLm1vdmUodyAtIDE2LCA4LCBTVkcuc3ltYm9sKFwiI3doaXRlRHJvcGRvd25BcnJvd1wiLCB7fSkpKVxuICAgICAgfVxuICAgICAgXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qIEJsb2NrICovXG5cbiAgdmFyIEJsb2NrID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGNvbW1lbnQpIHtcbiAgICBhc3NlcnQoaW5mbylcbiAgICB0aGlzLmluZm8gPSBpbmZvXG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgdGhpcy5jb21tZW50ID0gY29tbWVudCB8fCBudWxsXG4gICAgdGhpcy5kaWZmID0gbnVsbFxuXG4gICAgdmFyIHNoYXBlID0gdGhpcy5pbmZvLnNoYXBlXG4gICAgdGhpcy5pc0hhdCA9IHNoYXBlID09PSBcImhhdFwiIHx8IHNoYXBlID09PSBcImRlZmluZS1oYXRcIlxuICAgIHRoaXMuaGFzUHV6emxlID0gc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJoYXRcIlxuICAgIHRoaXMuaXNGaW5hbCA9IC9jYXAvLnRlc3Qoc2hhcGUpXG4gICAgdGhpcy5pc0NvbW1hbmQgPSBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImNhcFwiIHx8IC9ibG9jay8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzT3V0bGluZSA9IHNoYXBlID09PSBcIm91dGxpbmVcIlxuICAgIHRoaXMuaXNSZXBvcnRlciA9IHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICB0aGlzLmlzQm9vbGVhbiA9IHNoYXBlID09PSBcImJvb2xlYW5cIlxuXG4gICAgdGhpcy5pc1JpbmcgPSBzaGFwZSA9PT0gXCJyaW5nXCJcbiAgICB0aGlzLmhhc1NjcmlwdCA9IC9ibG9jay8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzRWxzZSA9IHNoYXBlID09PSBcImNlbHNlXCJcbiAgICB0aGlzLmlzRW5kID0gc2hhcGUgPT09IFwiY2VuZFwiXG5cbiAgICB0aGlzLnggPSAwXG4gICAgdGhpcy53aWR0aCA9IG51bGxcbiAgICB0aGlzLmhlaWdodCA9IG51bGxcbiAgICB0aGlzLmZpcnN0TGluZSA9IG51bGxcbiAgICB0aGlzLmlubmVyV2lkdGggPSBudWxsXG4gICAgXG4gICAgc3dpdGNoICh0aGlzLmluZm8uY2F0ZWdvcnkpIHtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuY2hpbGRyZW4udW5zaGlmdChuZXcgSWNvbihcIm5vcm1hbFwiKSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgXCJtdXNpY1wiOlxuICAgICAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQobmV3IEljb24oXCJsaW5lXCIpKVxuICAgICAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQobmV3IEljb24oXCJtdXNpY0Jsb2NrXCIpKVxuICAgICAgICB0aGlzLmluZm8uY2F0ZWdvcnkgPSBcIm5ld2V4dGVuc2lvblwiXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIFwicGVuXCI6XG4gICAgICAgIHRoaXMuY2hpbGRyZW4udW5zaGlmdChuZXcgSWNvbihcImxpbmVcIikpXG4gICAgICAgIHRoaXMuY2hpbGRyZW4udW5zaGlmdChuZXcgSWNvbihcInBlbkJsb2NrXCIpKVxuICAgICAgICAvL3RoaXMuaW5mby5jYXRlZ29yeSA9IFwibmV3ZXh0ZW5zaW9uXCJcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgXCJ2aWRlb1wiOlxuICAgICAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQobmV3IEljb24oXCJsaW5lXCIpKVxuICAgICAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQobmV3IEljb24oXCJ2aWRlb0Jsb2NrXCIpKVxuICAgICAgICB0aGlzLmluZm8uY2F0ZWdvcnkgPSBcIm5ld2V4dGVuc2lvblwiXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIEJsb2NrLnByb3RvdHlwZS5pc0Jsb2NrID0gdHJ1ZVxuXG4gIEJsb2NrLmZyb21KU09OID0gZnVuY3Rpb24obGFuZywgYXJyYXksIHBhcnQpIHtcbiAgICB2YXIgYXJncyA9IGFycmF5LnNsaWNlKClcbiAgICB2YXIgc2VsZWN0b3IgPSBhcmdzLnNoaWZ0KClcbiAgICBpZiAoc2VsZWN0b3IgPT09IFwicHJvY0RlZlwiKSB7XG4gICAgICB2YXIgc3BlYyA9IGFyZ3NbMF1cbiAgICAgIHZhciBpbnB1dE5hbWVzID0gYXJnc1sxXS5zbGljZSgpXG4gICAgICAvLyB2YXIgZGVmYXVsdFZhbHVlcyA9IGFyZ3NbMl07XG4gICAgICAvLyB2YXIgaXNBdG9taWMgPSBhcmdzWzNdOyAvLyBUT0RPXG5cbiAgICAgIHZhciBpbmZvID0gcGFyc2VTcGVjKHNwZWMpXG4gICAgICB2YXIgY2hpbGRyZW4gPSBpbmZvLnBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgIGlmIChpbnB1dFBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgICAgdmFyIGxhYmVsID0gbmV3IExhYmVsKGlucHV0TmFtZXMuc2hpZnQoKSlcbiAgICAgICAgICByZXR1cm4gbmV3IEJsb2NrKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzaGFwZTogcGFydFsxXSA9PT0gXCJiXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIixcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tLWFyZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFtsYWJlbF1cbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBMYWJlbChwYXJ0KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdmFyIG91dGxpbmUgPSBuZXcgQmxvY2soXG4gICAgICAgIHtcbiAgICAgICAgICBzaGFwZTogXCJvdXRsaW5lXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG5cbiAgICAgIHZhciBjaGlsZHJlbiA9IFtuZXcgTGFiZWwobGFuZy5kZWZpbmVbMF0pLCBvdXRsaW5lXVxuICAgICAgcmV0dXJuIG5ldyBCbG9jayhcbiAgICAgICAge1xuICAgICAgICAgIHNoYXBlOiBcImRlZmluZS1oYXRcIixcbiAgICAgICAgICBjYXRlZ29yeTogXCJjdXN0b21cIixcbiAgICAgICAgICBzZWxlY3RvcjogXCJwcm9jRGVmXCIsXG4gICAgICAgICAgY2FsbDogc3BlYyxcbiAgICAgICAgICBuYW1lczogYXJnc1sxXSxcbiAgICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHNlbGVjdG9yID09PSBcImNhbGxcIikge1xuICAgICAgdmFyIHNwZWMgPSBhcmdzLnNoaWZ0KClcbiAgICAgIHZhciBpbmZvID0gZXh0ZW5kKHBhcnNlU3BlYyhzcGVjKSwge1xuICAgICAgICBjYXRlZ29yeTogXCJjdXN0b21cIixcbiAgICAgICAgc2hhcGU6IFwic3RhY2tcIixcbiAgICAgICAgc2VsZWN0b3I6IFwiY2FsbFwiLFxuICAgICAgICBjYWxsOiBzcGVjLFxuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH0pXG4gICAgICB2YXIgcGFydHMgPSBpbmZvLnBhcnRzXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHNlbGVjdG9yID09PSBcInJlYWRWYXJpYWJsZVwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJjb250ZW50c09mTGlzdDpcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIlxuICAgICkge1xuICAgICAgdmFyIHNoYXBlID1cbiAgICAgICAgc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIiAmJiBhcmdzLnBvcCgpID09PSBcImJcIiA/IFwiYm9vbGVhblwiIDogXCJyZXBvcnRlclwiXG4gICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgICAgICBzaGFwZTogc2hhcGUsXG4gICAgICAgIGNhdGVnb3J5OiB7XG4gICAgICAgICAgcmVhZFZhcmlhYmxlOiBcInZhcmlhYmxlc1wiLFxuICAgICAgICAgIFwiY29udGVudHNPZkxpc3Q6XCI6IFwibGlzdFwiLFxuICAgICAgICAgIGdldFBhcmFtOiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgfVtzZWxlY3Rvcl0sXG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBCbG9jayhpbmZvLCBbbmV3IExhYmVsKGFyZ3NbMF0pXSlcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGluZm8gPSBleHRlbmQoYmxvY2tzQnlTZWxlY3RvcltzZWxlY3Rvcl0sIHtcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICB9KVxuICAgICAgYXNzZXJ0KGluZm8sIFwidW5rbm93biBzZWxlY3RvcjogXCIgKyBzZWxlY3RvcilcbiAgICAgIHZhciBzcGVjID0gbGFuZy5jb21tYW5kc1tpbmZvLnNwZWNdIHx8IHNwZWNcbiAgICAgIHZhciBwYXJ0cyA9IHNwZWMgPyBwYXJzZVNwZWMoc3BlYykucGFydHMgOiBpbmZvLnBhcnRzXG4gICAgfVxuICAgIHZhciBjaGlsZHJlbiA9IHBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICBpZiAoaW5wdXRQYXQudGVzdChwYXJ0KSkge1xuICAgICAgICB2YXIgYXJnID0gYXJncy5zaGlmdCgpXG4gICAgICAgIHJldHVybiAoaXNBcnJheShhcmcpID8gQmxvY2sgOiBJbnB1dCkuZnJvbUpTT04obGFuZywgYXJnLCBwYXJ0KVxuICAgICAgfSBlbHNlIGlmIChpY29uUGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJY29uKHBhcnQuc2xpY2UoMSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IExhYmVsKHBhcnQudHJpbSgpKVxuICAgICAgfVxuICAgIH0pXG4gICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3QsIGluZGV4KSB7XG4gICAgICBsaXN0ID0gbGlzdCB8fCBbXVxuICAgICAgYXNzZXJ0KGlzQXJyYXkobGlzdCkpXG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBTY3JpcHQobGlzdC5tYXAoQmxvY2suZnJvbUpTT04uYmluZChudWxsLCBsYW5nKSkpKVxuICAgICAgaWYgKHNlbGVjdG9yID09PSBcImRvSWZFbHNlXCIgJiYgaW5kZXggPT09IDApIHtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwobGFuZy5jb21tYW5kc1tcImVsc2VcIl0pKVxuICAgICAgfVxuICAgIH0pXG4gICAgLy8gVE9ETyBsb29wIGFycm93c1xuICAgIHJldHVybiBuZXcgQmxvY2soaW5mbywgY2hpbGRyZW4pXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gdGhpcy5pbmZvLnNlbGVjdG9yXG4gICAgdmFyIGFyZ3MgPSBbXVxuXG4gICAgaWYgKHNlbGVjdG9yID09PSBcInByb2NEZWZcIikge1xuICAgICAgdmFyIGlucHV0TmFtZXMgPSB0aGlzLmluZm8ubmFtZXNcbiAgICAgIHZhciBzcGVjID0gdGhpcy5pbmZvLmNhbGxcbiAgICAgIHZhciBpbmZvID0gcGFyc2VTcGVjKHNwZWMpXG4gICAgICB2YXIgZGVmYXVsdFZhbHVlcyA9IGluZm8uaW5wdXRzLm1hcChmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgPT09IFwiJW5cIiA/IDEgOiBpbnB1dCA9PT0gXCIlYlwiID8gZmFsc2UgOiBcIlwiXG4gICAgICB9KVxuICAgICAgdmFyIGlzQXRvbWljID0gZmFsc2UgLy8gVE9ETyAnZGVmaW5lLWF0b21pYycgPz9cbiAgICAgIHJldHVybiBbXCJwcm9jRGVmXCIsIHNwZWMsIGlucHV0TmFtZXMsIGRlZmF1bHRWYWx1ZXMsIGlzQXRvbWljXVxuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHNlbGVjdG9yID09PSBcInJlYWRWYXJpYWJsZVwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJjb250ZW50c09mTGlzdDpcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIlxuICAgICkge1xuICAgICAgYXJncy5wdXNoKGJsb2NrTmFtZSh0aGlzKSlcbiAgICAgIGlmIChzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiKVxuICAgICAgICBhcmdzLnB1c2godGhpcy5pc0Jvb2xlYW4gPT09IFwiYm9vbGVhblwiID8gXCJiXCIgOiBcInJcIilcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV1cbiAgICAgICAgaWYgKGNoaWxkLmlzSW5wdXQgfHwgY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc1NjcmlwdCkge1xuICAgICAgICAgIGFyZ3MucHVzaChjaGlsZC50b0pTT04oKSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0b3IgPT09IFwiY2FsbFwiKSB7XG4gICAgICAgIHJldHVybiBbXCJjYWxsXCIsIHRoaXMuaW5mby5jYWxsXS5jb25jYXQoYXJncylcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzZWxlY3RvcikgdGhyb3cgXCJ1bmtub3duIGJsb2NrOiBcIiArIHRoaXMuaW5mby5oYXNoXG4gICAgcmV0dXJuIFtzZWxlY3Rvcl0uY29uY2F0KGFyZ3MpXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oZXh0cmFzKSB7XG4gICAgdmFyIGZpcnN0SW5wdXQgPSBudWxsXG4gICAgdmFyIGNoZWNrQWxpYXMgPSBmYWxzZVxuICAgIHZhciB0ZXh0ID0gdGhpcy5jaGlsZHJlblxuICAgICAgLm1hcChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICBpZiAoY2hpbGQuaXNJY29uKSBjaGVja0FsaWFzID0gdHJ1ZVxuICAgICAgICBpZiAoIWZpcnN0SW5wdXQgJiYgIShjaGlsZC5pc0xhYmVsIHx8IGNoaWxkLmlzSWNvbikpIGZpcnN0SW5wdXQgPSBjaGlsZFxuICAgICAgICByZXR1cm4gY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICA/IFwiXFxuXCIgKyBpbmRlbnQoY2hpbGQuc3RyaW5naWZ5KCkpICsgXCJcXG5cIlxuICAgICAgICAgIDogY2hpbGQuc3RyaW5naWZ5KCkudHJpbSgpICsgXCIgXCJcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKVxuICAgICAgLnRyaW0oKVxuXG4gICAgdmFyIGxhbmcgPSB0aGlzLmluZm8ubGFuZ3VhZ2VcbiAgICBpZiAoY2hlY2tBbGlhcyAmJiBsYW5nICYmIHRoaXMuaW5mby5zZWxlY3Rvcikge1xuICAgICAgdmFyIHR5cGUgPSBibG9ja3NCeVNlbGVjdG9yW3RoaXMuaW5mby5zZWxlY3Rvcl1cbiAgICAgIHZhciBzcGVjID0gdHlwZS5zcGVjXG4gICAgICB2YXIgYWxpYXMgPSBsYW5nLm5hdGl2ZUFsaWFzZXNbdHlwZS5zcGVjXVxuICAgICAgaWYgKGFsaWFzKSB7XG4gICAgICAgIC8vIFRPRE8gbWFrZSB0cmFuc2xhdGUoKSBub3QgaW4tcGxhY2UsIGFuZCB1c2UgdGhhdFxuICAgICAgICBpZiAoaW5wdXRQYXQudGVzdChhbGlhcykgJiYgZmlyc3RJbnB1dCkge1xuICAgICAgICAgIGFsaWFzID0gYWxpYXMucmVwbGFjZShpbnB1dFBhdCwgZmlyc3RJbnB1dC5zdHJpbmdpZnkoKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxpYXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb3ZlcnJpZGVzID0gZXh0cmFzIHx8IFwiXCJcbiAgICBpZiAoXG4gICAgICAodGhpcy5pbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCIgJiYgdGhpcy5pc1JlcG9ydGVyKSB8fFxuICAgICAgKHRoaXMuaW5mby5jYXRlZ29yeSA9PT0gXCJjdXN0b20tYXJnXCIgJiZcbiAgICAgICAgKHRoaXMuaXNSZXBvcnRlciB8fCB0aGlzLmlzQm9vbGVhbikpIHx8XG4gICAgICAodGhpcy5pbmZvLmNhdGVnb3J5ID09PSBcImN1c3RvbVwiICYmIHRoaXMuaW5mby5zaGFwZSA9PT0gXCJzdGFja1wiKVxuICAgICkge1xuICAgICAgaWYgKG92ZXJyaWRlcykgb3ZlcnJpZGVzICs9IFwiIFwiXG4gICAgICBvdmVycmlkZXMgKz0gdGhpcy5pbmZvLmNhdGVnb3J5XG4gICAgfVxuICAgIGlmIChvdmVycmlkZXMpIHtcbiAgICAgIHRleHQgKz0gXCIgOjogXCIgKyBvdmVycmlkZXNcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaGFzU2NyaXB0XG4gICAgICA/IHRleHQgKyBcIlxcbmVuZFwiXG4gICAgICA6IHRoaXMuaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgICAgID8gXCIoXCIgKyB0ZXh0ICsgXCIpXCJcbiAgICAgICAgOiB0aGlzLmluZm8uc2hhcGUgPT09IFwiYm9vbGVhblwiID8gXCI8XCIgKyB0ZXh0ICsgXCI+XCIgOiB0ZXh0XG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZywgaXNTaGFsbG93KSB7XG4gICAgdmFyIHNlbGVjdG9yID0gdGhpcy5pbmZvLnNlbGVjdG9yXG4gICAgaWYgKCFzZWxlY3RvcikgcmV0dXJuXG4gICAgaWYgKHNlbGVjdG9yID09PSBcInByb2NEZWZcIikge1xuICAgICAgYXNzZXJ0KHRoaXMuY2hpbGRyZW5bMF0uaXNMYWJlbClcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0gPSBuZXcgTGFiZWwobGFuZy5kZWZpbmVbMF0gfHwgZW5nbGlzaC5kZWZpbmVbMF0pXG4gICAgfVxuICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3JdXG4gICAgaWYgKCFibG9jaykgcmV0dXJuXG4gICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5nLmNvbW1hbmRzW2Jsb2NrLnNwZWNdXG4gICAgaWYgKCFuYXRpdmVTcGVjKSByZXR1cm5cbiAgICB2YXIgbmF0aXZlSW5mbyA9IHBhcnNlU3BlYyhuYXRpdmVTcGVjKVxuICAgIHZhciBhcmdzID0gdGhpcy5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbCAmJiAhY2hpbGQuaXNJY29uXG4gICAgfSlcbiAgICBpZiAoIWlzU2hhbGxvdylcbiAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICBjaGlsZC50cmFuc2xhdGUobGFuZylcbiAgICAgIH0pXG4gICAgdGhpcy5jaGlsZHJlbiA9IG5hdGl2ZUluZm8ucGFydHNcbiAgICAgIC5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgICB2YXIgcGFydCA9IHBhcnQudHJpbSgpXG4gICAgICAgIGlmICghcGFydCkgcmV0dXJuXG4gICAgICAgIHJldHVybiBpbnB1dFBhdC50ZXN0KHBhcnQpXG4gICAgICAgICAgPyBhcmdzLnNoaWZ0KClcbiAgICAgICAgICA6IGljb25QYXQudGVzdChwYXJ0KSA/IG5ldyBJY29uKHBhcnQuc2xpY2UoMSkpIDogbmV3IExhYmVsKHBhcnQpXG4gICAgICB9KVxuICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICBhcmdzLmZvckVhY2goXG4gICAgICBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGFyZylcbiAgICAgIH0uYmluZCh0aGlzKVxuICAgIClcbiAgICB0aGlzLmluZm8ubGFuZ3VhZ2UgPSBsYW5nXG4gICAgdGhpcy5pbmZvLmlzUlRMID0gcnRsTGFuZ3VhZ2VzLmluZGV4T2YobGFuZy5jb2RlKSA+IC0xXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXVxuICAgICAgaWYgKGNoaWxkLm1lYXN1cmUpIGNoaWxkLm1lYXN1cmUoKVxuICAgIH1cbiAgICBpZiAodGhpcy5jb21tZW50KSB0aGlzLmNvbW1lbnQubWVhc3VyZSgpXG4gIH1cblxuICBCbG9jay5zaGFwZXMgPSB7XG4gICAgc3RhY2s6IFNWRy5zdGFja1JlY3QsXG4gICAgXCJjLWJsb2NrXCI6IFNWRy5zdGFja1JlY3QsXG4gICAgXCJpZi1ibG9ja1wiOiBTVkcuc3RhY2tSZWN0LFxuICAgIGNlbHNlOiBTVkcuc3RhY2tSZWN0LFxuICAgIGNlbmQ6IFNWRy5zdGFja1JlY3QsXG5cbiAgICBjYXA6IFNWRy5jYXBSZWN0LFxuICAgIHJlcG9ydGVyOiBTVkcucGlsbFJlY3QsXG4gICAgYm9vbGVhbjogU1ZHLnBvaW50ZWRSZWN0LFxuICAgIGhhdDogU1ZHLmhhdFJlY3QsXG4gICAgXCJkZWZpbmUtaGF0XCI6IFNWRy5wcm9jSGF0UmVjdCxcbiAgICByaW5nOiBTVkcucmluZ1JlY3QsXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbih3LCBoLCBsaW5lcykge1xuICAgIC8vIG1vdXRoc1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gU1ZHLm1vdXRoUmVjdCh3LCBoLCB0aGlzLmlzRmluYWwsIGxpbmVzLCB7XG4gICAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gb3V0bGluZXNcbiAgICBpZiAodGhpcy5pbmZvLnNoYXBlID09PSBcIm91dGxpbmVcIikge1xuICAgICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhTVkcuc3RhY2tSZWN0KHcsIGgpLCB7XG4gICAgICAgIGNsYXNzOiBcInNiLW91dGxpbmVcIixcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gcmluZ3NcbiAgICBpZiAodGhpcy5pc1JpbmcpIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5bMF1cbiAgICAgIGlmIChjaGlsZCAmJiAoY2hpbGQuaXNJbnB1dCB8fCBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzU2NyaXB0KSkge1xuICAgICAgICB2YXIgc2hhcGUgPSBjaGlsZC5pc1NjcmlwdFxuICAgICAgICAgID8gXCJzdGFja1wiXG4gICAgICAgICAgOiBjaGlsZC5pc0lucHV0ID8gY2hpbGQuc2hhcGUgOiBjaGlsZC5pbmZvLnNoYXBlXG4gICAgICAgIHJldHVybiBTVkcucmluZ1JlY3QodywgaCwgY2hpbGQueSwgY2hpbGQud2lkdGgsIGNoaWxkLmhlaWdodCwgc2hhcGUsIHtcbiAgICAgICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZ1bmMgPSBCbG9jay5zaGFwZXNbdGhpcy5pbmZvLnNoYXBlXVxuICAgIGFzc2VydChmdW5jLCBcIm5vIHNoYXBlIGZ1bmM6IFwiICsgdGhpcy5pbmZvLnNoYXBlKVxuICAgIHJldHVybiBmdW5jKHcsIGgsIHtcbiAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLm1pbkRpc3RhbmNlID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBpZiAodGhpcy5pc0Jvb2xlYW4pIHtcbiAgICAgIHJldHVybiBjaGlsZC5pc1JlcG9ydGVyXG4gICAgICAgID8gKDQgKyBjaGlsZC5oZWlnaHQgLyA0KSB8IDBcbiAgICAgICAgOiBjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgPyAoNSArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgICAgICAgIDogY2hpbGQuaXNCb29sZWFuIHx8IGNoaWxkLnNoYXBlID09PSBcImJvb2xlYW5cIlxuICAgICAgICAgICAgPyA1XG4gICAgICAgICAgICA6ICgyICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgfVxuICAgIGlmICh0aGlzLmlzUmVwb3J0ZXIpIHtcbiAgICAgIHJldHVybiAoY2hpbGQuaXNJbnB1dCAmJiBjaGlsZC5pc1JvdW5kKSB8fFxuICAgICAgICAoKGNoaWxkLmlzUmVwb3J0ZXIgfHwgY2hpbGQuaXNCb29sZWFuKSAmJiAhY2hpbGQuaGFzU2NyaXB0KVxuICAgICAgICA/IDJcbiAgICAgICAgOiBjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgPyAoMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgICAgICAgIDogKC0yICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgfVxuICAgIHJldHVybiAwXG4gIH1cblxuICBCbG9jay5wYWRkaW5nID0ge1xuICAgIGhhdDogWzE4LCA2LCA1XSxcbiAgICBcImRlZmluZS1oYXRcIjogWzIwLCA4LCAxMF0sXG4gICAgcmVwb3J0ZXI6IFs1LCAzLCAzXSxcbiAgICBib29sZWFuOiBbNSwgMywgM10sXG4gICAgY2FwOiBbMTEsIDYsIDZdLFxuICAgIFwiYy1ibG9ja1wiOiBbOCwgNiwgNV0sXG4gICAgXCJpZi1ibG9ja1wiOiBbOCwgNiwgNV0sXG4gICAgcmluZzogWzEwLCA0LCAxMF0sXG4gICAgbnVsbDogWzgsIDYsIDVdLFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNEZWZpbmUgPSB0aGlzLmluZm8uc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlblxuXG4gICAgdmFyIHBhZGRpbmcgPSBCbG9jay5wYWRkaW5nW3RoaXMuaW5mby5zaGFwZV0gfHwgQmxvY2sucGFkZGluZ1tudWxsXVxuICAgIHZhciBwdCA9IHBhZGRpbmdbMF0sXG4gICAgICBweCA9IHBhZGRpbmdbMV0sXG4gICAgICBwYiA9IHBhZGRpbmdbMl1cblxuICAgIHZhciB5ID0gMFxuICAgIHZhciBMaW5lID0gZnVuY3Rpb24oeSkge1xuICAgICAgdGhpcy55ID0geVxuICAgICAgdGhpcy53aWR0aCA9IDBcbiAgICAgIHRoaXMuaGVpZ2h0ID0geSA/IDE4IDogMTZcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIH1cblxuICAgIHZhciBpbm5lcldpZHRoID0gMFxuICAgIHZhciBzY3JpcHRXaWR0aCA9IDBcbiAgICB2YXIgbGluZSA9IG5ldyBMaW5lKHkpXG4gICAgZnVuY3Rpb24gcHVzaExpbmUoaXNMYXN0KSB7XG4gICAgICBpZiAobGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IHB0ICsgcGJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IGlzTGFzdCA/IDAgOiArMlxuICAgICAgICBsaW5lLnkgLT0gMVxuICAgICAgfVxuICAgICAgeSArPSBsaW5lLmhlaWdodFxuICAgICAgbGluZXMucHVzaChsaW5lKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZm8uaXNSVEwpIHtcbiAgICAgIHZhciBzdGFydCA9IDBcbiAgICAgIHZhciBmbGlwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW5cbiAgICAgICAgICAuc2xpY2UoMCwgc3RhcnQpXG4gICAgICAgICAgLmNvbmNhdChjaGlsZHJlbi5zbGljZShzdGFydCwgaSkucmV2ZXJzZSgpKVxuICAgICAgICAgIC5jb25jYXQoY2hpbGRyZW4uc2xpY2UoaSkpXG4gICAgICB9LmJpbmQodGhpcylcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuW2ldLmlzU2NyaXB0KSB7XG4gICAgICAgICAgZmxpcCgpXG4gICAgICAgICAgc3RhcnQgPSBpICsgMVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhcnQgPCBpKSB7XG4gICAgICAgIGZsaXAoKVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaW5lcyA9IFtdIC8vbG9vayBhdCB0aGlzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgIGNoaWxkLmVsID0gY2hpbGQuZHJhdyh0aGlzKVxuXG4gICAgICBpZiAoY2hpbGQuaXNTY3JpcHQgJiYgdGhpcy5pc0NvbW1hbmQpIHtcbiAgICAgICAgdGhpcy5oYXNTY3JpcHQgPSB0cnVlXG4gICAgICAgIHB1c2hMaW5lKClcbiAgICAgICAgY2hpbGQueSA9IHlcbiAgICAgICAgbGluZXMucHVzaChjaGlsZClcbiAgICAgICAgc2NyaXB0V2lkdGggPSBNYXRoLm1heChzY3JpcHRXaWR0aCwgTWF0aC5tYXgoMSwgY2hpbGQud2lkdGgpKSAgLy9sb29rIGF0IHRoaXMgYXJlYVxuICAgICAgICBjaGlsZC5oZWlnaHQgPSBNYXRoLm1heCgxMiwgY2hpbGQuaGVpZ2h0KSArIDNcbiAgICAgICAgeSArPSBjaGlsZC5oZWlnaHRcbiAgICAgICAgbGluZSA9IG5ldyBMaW5lKHkpXG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzQXJyb3cpIHtcbiAgICAgICAgbGluZS5jaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNtdyA9IGkgPiAwID8gMzIgOiAwIC8vIDI3XG4gICAgICAgIHZhciBtZCA9IHRoaXMuaXNDb21tYW5kID8gMCA6IHRoaXMubWluRGlzdGFuY2UoY2hpbGQpXG4gICAgICAgIHZhciBtdyA9IHRoaXMuaXNDb21tYW5kXG4gICAgICAgICAgPyBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzSW5wdXQgPyBjbXcgOiAwXG4gICAgICAgICAgOiBtZFxuICAgICAgICBpZiAobXcgJiYgIWxpbmVzLmxlbmd0aCAmJiBsaW5lLndpZHRoIDwgbXcgLSBweCkge1xuICAgICAgICAgIGxpbmUud2lkdGggPSBtdyAtIHB4XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGQueCA9IGxpbmUud2lkdGhcbiAgICAgICAgbGluZS53aWR0aCArPSBjaGlsZC53aWR0aFxuICAgICAgICBpbm5lcldpZHRoID0gTWF0aC5tYXgoaW5uZXJXaWR0aCwgbGluZS53aWR0aCArIE1hdGgubWF4KDAsIG1kIC0gcHgpKVxuICAgICAgICAvL2xpbmUud2lkdGggKz0gMSAvLzRcbiAgICAgICAgaWYgKCFjaGlsZC5pc0xhYmVsKSB7IC8vdGV4dCB2cyByZXBvcnRlciBwYWRkaW5nXG4gICAgICAgICAgbGluZS53aWR0aCArPSA1XG4gICAgICAgICAgbGluZS5oZWlnaHQgPSBNYXRoLm1heChsaW5lLmhlaWdodCwgY2hpbGQuaGVpZ2h0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmUud2lkdGggKz0gNVxuICAgICAgICB9XG4gICAgICAgIGxpbmUuY2hpbGRyZW4ucHVzaChjaGlsZClcbiAgICAgIH1cbiAgICB9XG4gICAgcHVzaExpbmUodHJ1ZSlcblxuICAgIGlubmVyV2lkdGggPSBNYXRoLm1heChcbiAgICAgIGlubmVyV2lkdGggKyBweCAqIDIsXG4gICAgICB0aGlzLmlzSGF0IHx8IHRoaXMuaGFzU2NyaXB0XG4gICAgICAgID8gNzBcbiAgICAgICAgOiB0aGlzLmlzQ29tbWFuZCB8fCB0aGlzLmlzT3V0bGluZSB8fCB0aGlzLmlzUmluZyA/IDQ1IDogMjBcbiAgICApXG4gICAgXG4gICAgdGhpcy5oZWlnaHQgPSB5XG4gICAgdGhpcy53aWR0aCA9IHNjcmlwdFdpZHRoXG4gICAgICA/IE1hdGgubWF4KGlubmVyV2lkdGgsIDEwICsgc2NyaXB0V2lkdGgpXG4gICAgICA6IGlubmVyV2lkdGhcbiAgICBpZiAoaXNEZWZpbmUpIHtcbiAgICAgIHZhciBwID0gTWF0aC5taW4oMjYsICgzLjUgKyAwLjEzICogaW5uZXJXaWR0aCkgfCAwKSAtIDEwXG4gICAgICB0aGlzLmhlaWdodCArPSBwXG4gICAgICBwdCArPSAyICogcFxuICAgIH1cbiAgICBcbiAgICB0aGlzLmZpcnN0TGluZSA9IGxpbmVzWzBdXG4gICAgdGhpcy5pbm5lcldpZHRoID0gaW5uZXJXaWR0aFxuXG4gICAgdmFyIG9iamVjdHMgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXVxuICAgICAgaWYgKGxpbmUuaXNTY3JpcHQpIHtcbiAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKDEwLCBsaW5lLnksIGxpbmUuZWwpKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgaCA9IGxpbmUuaGVpZ2h0XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGluZS5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBsaW5lLmNoaWxkcmVuW2pdXG4gICAgICAgIGlmIChjaGlsZC5pc0Fycm93KSB7XG4gICAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKGlubmVyV2lkdGggLSAxMCwgdGhpcy5oZWlnaHQgLSAzLCBjaGlsZC5lbCkpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB5ID0gcHQgKyAoaCAtIGNoaWxkLmhlaWdodCAtIHB0IC0gcGIpIC8gMiAtIDFcbiAgICAgICAgaWYgKGlzRGVmaW5lICYmIGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgICB5ICs9IDBcbiAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0ljb24pIHtcbiAgICAgICAgICB5ICs9IGNoaWxkLmR5IHwgMFxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzUmluZykge1xuICAgICAgICAgIGNoaWxkLnkgPSAobGluZS55ICsgeSkgfCAwXG4gICAgICAgICAgaWYgKGNoaWxkLmlzSW5zZXQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzU3RhY2spIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShweCArIGNoaWxkLngsIChsaW5lLnkgKyB5KSB8IDAsIGNoaWxkLmVsKSlcblxuICAgICAgICBpZiAoY2hpbGQuZGlmZiA9PT0gXCIrXCIpIHtcbiAgICAgICAgICB2YXIgZWxsaXBzZSA9IFNWRy5pbnNFbGxpcHNlKGNoaWxkLndpZHRoLCBjaGlsZC5oZWlnaHQpXG4gICAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKHB4ICsgY2hpbGQueCwgKGxpbmUueSArIHkpIHwgMCwgZWxsaXBzZSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZWwgPSB0aGlzLmRyYXdTZWxmKGlubmVyV2lkdGgsIHRoaXMuaGVpZ2h0LCBsaW5lcylcbiAgICBvYmplY3RzLnNwbGljZSgwLCAwLCBlbClcbiAgICBpZiAodGhpcy5pbmZvLmNvbG9yKSB7XG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgZmlsbDogdGhpcy5pbmZvLmNvbG9yLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gU1ZHLmdyb3VwKG9iamVjdHMpXG4gIH1cblxuICAvKiBDb21tZW50ICovXG5cbiAgdmFyIENvbW1lbnQgPSBmdW5jdGlvbih2YWx1ZSwgaGFzQmxvY2spIHtcbiAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHZhbHVlLCBbXCJzYi1jb21tZW50LWxhYmVsXCJdKVxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oYXNCbG9jayA9IGhhc0Jsb2NrXG4gIH1cbiAgQ29tbWVudC5wcm90b3R5cGUuaXNDb21tZW50ID0gdHJ1ZVxuICBDb21tZW50LmxpbmVMZW5ndGggPSAxNlxuICBDb21tZW50LnByb3RvdHlwZS5oZWlnaHQgPSAyNVxuXG4gIENvbW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIi8vIFwiICsgdGhpcy5sYWJlbC52YWx1ZVxuICB9XG5cbiAgQ29tbWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGFiZWwubWVhc3VyZSgpXG4gIH1cblxuICBDb21tZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhYmVsRWwgPSB0aGlzLmxhYmVsLmRyYXcoKVxuXG4gICAgdGhpcy53aWR0aCA9IHRoaXMubGFiZWwud2lkdGggKyAxNlxuICAgIHJldHVybiBTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLmNvbW1lbnRMaW5lKHRoaXMuaGFzQmxvY2sgPyBDb21tZW50LmxpbmVMZW5ndGggOiAwLCA2KSxcbiAgICAgIFNWRy5jb21tZW50UmVjdCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge1xuICAgICAgICBjbGFzczogXCJzYi1jb21tZW50XCIsXG4gICAgICB9KSxcbiAgICAgIFNWRy5tb3ZlKDgsIDYsIGxhYmVsRWwpLFxuICAgIF0pXG4gIH1cblxuICAvKiBHbG93ICovXG5cbiAgdmFyIEdsb3cgPSBmdW5jdGlvbihjaGlsZCkge1xuICAgIGFzc2VydChjaGlsZClcbiAgICB0aGlzLmNoaWxkID0gY2hpbGRcbiAgICBpZiAoY2hpbGQuaXNCbG9jaykge1xuICAgICAgdGhpcy5zaGFwZSA9IGNoaWxkLmluZm8uc2hhcGVcbiAgICAgIHRoaXMuaW5mbyA9IGNoaWxkLmluZm9cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFwZSA9IFwic3RhY2tcIlxuICAgIH1cblxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy55ID0gMFxuICB9XG4gIEdsb3cucHJvdG90eXBlLmlzR2xvdyA9IHRydWVcblxuICBHbG93LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jaGlsZC5pc0Jsb2NrKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZC5zdHJpbmdpZnkoXCIrXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsaW5lcyA9IHRoaXMuY2hpbGQuc3RyaW5naWZ5KCkuc3BsaXQoXCJcXG5cIilcbiAgICAgIHJldHVybiBsaW5lcy5tYXAobGluZSA9PiBcIisgXCIgKyBsaW5lKS5qb2luKFwiXFxuXCIpXG4gICAgfVxuICB9XG5cbiAgR2xvdy5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIHRoaXMuY2hpbGQudHJhbnNsYXRlKGxhbmcpXG4gIH1cblxuICBHbG93LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGlsZC5tZWFzdXJlKClcbiAgfVxuXG4gIEdsb3cucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNoaWxkXG4gICAgdmFyIGVsXG4gICAgdmFyIHcgPSB0aGlzLndpZHRoXG4gICAgdmFyIGggPSB0aGlzLmhlaWdodCAtIDFcbiAgICBpZiAoYy5pc1NjcmlwdCkge1xuICAgICAgaWYgKCFjLmlzRW1wdHkgJiYgYy5ibG9ja3NbMF0uaXNIYXQpIHtcbiAgICAgICAgZWwgPSBTVkcuaGF0UmVjdCh3LCBoKVxuICAgICAgfSBlbHNlIGlmIChjLmlzRmluYWwpIHtcbiAgICAgICAgZWwgPSBTVkcuY2FwUmVjdCh3LCBoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwgPSBTVkcuc3RhY2tSZWN0KHcsIGgpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBlbCA9IGMuZHJhd1NlbGYodywgaCwgW10pXG4gICAgfVxuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgIGNsYXNzOiBcInNiLWRpZmYgc2ItZGlmZi1pbnNcIixcbiAgICB9KVxuICB9XG4gIC8vIFRPRE8gaG93IGNhbiB3ZSBhbHdheXMgcmFpc2UgR2xvd3MgYWJvdmUgdGhlaXIgcGFyZW50cz9cblxuICBHbG93LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNoaWxkXG4gICAgdmFyIGVsID0gYy5pc1NjcmlwdCA/IGMuZHJhdyh0cnVlKSA6IGMuZHJhdygpXG5cbiAgICB0aGlzLndpZHRoID0gYy53aWR0aFxuICAgIHRoaXMuaGVpZ2h0ID0gKGMuaXNCbG9jayAmJiBjLmZpcnN0TGluZS5oZWlnaHQpIHx8IGMuaGVpZ2h0XG5cbiAgICAvLyBlbmNpcmNsZVxuICAgIHJldHVybiBTVkcuZ3JvdXAoW2VsLCB0aGlzLmRyYXdTZWxmKCldKVxuICB9XG5cbiAgLyogU2NyaXB0ICovXG5cbiAgdmFyIFNjcmlwdCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICAgIHRoaXMuYmxvY2tzID0gYmxvY2tzXG4gICAgdGhpcy5pc0VtcHR5ID0gIWJsb2Nrcy5sZW5ndGhcbiAgICB0aGlzLmlzRmluYWwgPSAhdGhpcy5pc0VtcHR5ICYmIGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0uaXNGaW5hbFxuICAgIHRoaXMueSA9IDBcbiAgfVxuICBTY3JpcHQucHJvdG90eXBlLmlzU2NyaXB0ID0gdHJ1ZVxuXG4gIFNjcmlwdC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIGJsb2Nrcykge1xuICAgIC8vIHggPSBhcnJheVswXSwgeSA9IGFycmF5WzFdO1xuICAgIHJldHVybiBuZXcgU2NyaXB0KGJsb2Nrcy5tYXAoQmxvY2suZnJvbUpTT04uYmluZChudWxsLCBsYW5nKSkpXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmJsb2Nrc1swXSAmJiB0aGlzLmJsb2Nrc1swXS5pc0NvbW1lbnQpIHJldHVyblxuICAgIHJldHVybiB0aGlzLmJsb2Nrcy5tYXAoZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgIHJldHVybiBibG9jay50b0pTT04oKVxuICAgIH0pXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmJsb2Nrc1xuICAgICAgLm1hcChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLnN0cmluZ2lmeSgpXG4gICAgICAgIGlmIChibG9jay5jb21tZW50KSBsaW5lICs9IFwiIFwiICsgYmxvY2suY29tbWVudC5zdHJpbmdpZnkoKVxuICAgICAgICByZXR1cm4gbGluZVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXCIpXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICBibG9jay50cmFuc2xhdGUobGFuZylcbiAgICB9KVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5ibG9ja3NbaV0ubWVhc3VyZSgpXG4gICAgfVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oaW5zaWRlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICB2YXIgeSA9IDBcbiAgICB0aGlzLndpZHRoID0gMFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ibG9ja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2ldXG4gICAgICB2YXIgeCA9IGluc2lkZSA/IDAgOiAyXG4gICAgICB2YXIgY2hpbGQgPSBibG9jay5kcmF3KClcbiAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoeCwgeSwgY2hpbGQpKVxuICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGJsb2NrLndpZHRoKVxuXG4gICAgICB2YXIgZGlmZiA9IGJsb2NrLmRpZmZcbiAgICAgIGlmIChkaWZmID09PSBcIi1cIikge1xuICAgICAgICB2YXIgZHcgPSBibG9jay53aWR0aFxuICAgICAgICB2YXIgZGggPSBibG9jay5maXJzdExpbmUuaGVpZ2h0IHx8IGJsb2NrLmhlaWdodFxuICAgICAgICBjaGlsZHJlbi5wdXNoKFNWRy5tb3ZlKHgsIHkgKyBkaCAvIDIgKyAxLCBTVkcuc3RyaWtldGhyb3VnaExpbmUoZHcpKSlcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGJsb2NrLndpZHRoKVxuICAgICAgfVxuXG4gICAgICB5ICs9IGJsb2NrLmhlaWdodFxuXG4gICAgICB2YXIgY29tbWVudCA9IGJsb2NrLmNvbW1lbnRcbiAgICAgIGlmIChjb21tZW50KSB7XG4gICAgICAgIHZhciBsaW5lID0gYmxvY2suZmlyc3RMaW5lXG4gICAgICAgIHZhciBjeCA9IGJsb2NrLmlubmVyV2lkdGggKyAyICsgQ29tbWVudC5saW5lTGVuZ3RoXG4gICAgICAgIHZhciBjeSA9IHkgLSBibG9jay5oZWlnaHQgKyBsaW5lLmhlaWdodCAvIDJcbiAgICAgICAgdmFyIGVsID0gY29tbWVudC5kcmF3KClcbiAgICAgICAgY2hpbGRyZW4ucHVzaChTVkcubW92ZShjeCwgY3kgLSBjb21tZW50LmhlaWdodCAvIDIsIGVsKSlcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGN4ICsgY29tbWVudC53aWR0aClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5oZWlnaHQgPSB5XG4gICAgaWYgKCFpbnNpZGUgJiYgIXRoaXMuaXNGaW5hbCkge1xuICAgICAgdGhpcy5oZWlnaHQgKz0gOFxuICAgIH1cbiAgICBpZiAoIWluc2lkZSAmJiBibG9jay5pc0dsb3cpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDIgLy8gVE9ETyB1bmJyZWFrIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIFNWRy5ncm91cChjaGlsZHJlbilcbiAgfVxuXG4gIC8qIERvY3VtZW50ICovXG5cbiAgdmFyIERvY3VtZW50ID0gZnVuY3Rpb24oc2NyaXB0cykge1xuICAgIHRoaXMuc2NyaXB0cyA9IHNjcmlwdHNcblxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy5lbCA9IG51bGxcbiAgICB0aGlzLmRlZnMgPSBudWxsXG4gIH1cblxuICBEb2N1bWVudC5mcm9tSlNPTiA9IGZ1bmN0aW9uKHNjcmlwdGFibGUsIGxhbmcpIHtcbiAgICB2YXIgbGFuZyA9IGxhbmcgfHwgZW5nbGlzaFxuICAgIHZhciBzY3JpcHRzID0gc2NyaXB0YWJsZS5zY3JpcHRzLm1hcChmdW5jdGlvbihhcnJheSkge1xuICAgICAgdmFyIHNjcmlwdCA9IFNjcmlwdC5mcm9tSlNPTihsYW5nLCBhcnJheVsyXSlcbiAgICAgIHNjcmlwdC54ID0gYXJyYXlbMF1cbiAgICAgIHNjcmlwdC55ID0gYXJyYXlbMV1cbiAgICAgIHJldHVybiBzY3JpcHRcbiAgICB9KVxuICAgIC8vIFRPRE8gc2NyaXB0YWJsZS5zY3JpcHRDb21tZW50c1xuICAgIHJldHVybiBuZXcgRG9jdW1lbnQoc2NyaXB0cylcbiAgfVxuXG4gIERvY3VtZW50LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIganNvblNjcmlwdHMgPSB0aGlzLnNjcmlwdHNcbiAgICAgIC5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIHZhciBqc29uQmxvY2tzID0gc2NyaXB0LnRvSlNPTigpXG4gICAgICAgIGlmICghanNvbkJsb2NrcykgcmV0dXJuXG4gICAgICAgIHJldHVybiBbMTAsIHNjcmlwdC55ICsgMTAsIGpzb25CbG9ja3NdXG4gICAgICB9KVxuICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICByZXR1cm4ge1xuICAgICAgc2NyaXB0czoganNvblNjcmlwdHMsXG4gICAgICAvLyBzY3JpcHRDb21tZW50czogW10sIC8vIFRPRE9cbiAgICB9XG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2NyaXB0c1xuICAgICAgLm1hcChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgcmV0dXJuIHNjcmlwdC5zdHJpbmdpZnkoKVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXFxuXCIpXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIHRoaXMuc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgc2NyaXB0LnRyYW5zbGF0ZShsYW5nKVxuICAgIH0pXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgc2NyaXB0Lm1lYXN1cmUoKVxuICAgIH0pXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY2IpIHtcbiAgICAvLyBtZWFzdXJlIHN0cmluZ3NcbiAgICB0aGlzLm1lYXN1cmUoKVxuXG4gICAgLy8gVE9ETzogc2VwYXJhdGUgbGF5b3V0ICsgcmVuZGVyIHN0ZXBzLlxuICAgIC8vIHJlbmRlciBlYWNoIHNjcmlwdFxuICAgIHZhciB3aWR0aCA9IDBcbiAgICB2YXIgaGVpZ2h0ID0gMFxuICAgIHZhciBlbGVtZW50cyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzY3JpcHQgPSB0aGlzLnNjcmlwdHNbaV1cbiAgICAgIGlmIChoZWlnaHQpIGhlaWdodCArPSAxMFxuICAgICAgc2NyaXB0LnkgPSBoZWlnaHRcbiAgICAgIGVsZW1lbnRzLnB1c2goU1ZHLm1vdmUoMCwgaGVpZ2h0LCBzY3JpcHQuZHJhdygpKSlcbiAgICAgIGhlaWdodCArPSBzY3JpcHQuaGVpZ2h0XG4gICAgICB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCBzY3JpcHQud2lkdGggKyA0KVxuICAgIH1cbiAgICB0aGlzLndpZHRoID0gd2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxuXG4gICAgLy8gcmV0dXJuIFNWR1xuICAgIHZhciBzdmcgPSBTVkcubmV3U1ZHKHdpZHRoLCBoZWlnaHQpXG4gICAgc3ZnLmFwcGVuZENoaWxkKFxuICAgICAgKHRoaXMuZGVmcyA9IFNWRy53aXRoQ2hpbGRyZW4oXG4gICAgICAgIFNWRy5lbChcImRlZnNcIiksXG4gICAgICAgIFtcbiAgICAgICAgICBiZXZlbEZpbHRlcihcImJldmVsRmlsdGVyXCIsIGZhbHNlKSxcbiAgICAgICAgICBiZXZlbEZpbHRlcihcImlucHV0QmV2ZWxGaWx0ZXJcIiwgdHJ1ZSksXG4gICAgICAgICAgZGFya0ZpbHRlcihcImlucHV0RGFya0ZpbHRlclwiKSxcbiAgICAgICAgICBkZXNhdHVyYXRlRmlsdGVyKFwiZGVzYXR1cmF0ZUZpbHRlclwiKSxcbiAgICAgICAgXS5jb25jYXQobWFrZUljb25zKCkpXG4gICAgICApKVxuICAgIClcblxuICAgIHN2Zy5hcHBlbmRDaGlsZChTVkcuZ3JvdXAoZWxlbWVudHMpKVxuICAgIHRoaXMuZWwgPSBzdmdcblxuICAgIC8vIG5iOiBhc3luYyBBUEkgb25seSBmb3IgYmFja3dhcmRzL2ZvcndhcmRzIGNvbXBhdGliaWxpdHkgcmVhc29ucy5cbiAgICAvLyBkZXNwaXRlIGFwcGVhcmFuY2VzLCBpdCBydW5zIHN5bmNocm9ub3VzbHlcbiAgICBjYihzdmcpXG4gIH1cblxuICAvKiBFeHBvcnQgU1ZHIGltYWdlIGFzIFhNTCBzdHJpbmcgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGFzc2VydCh0aGlzLmVsLCBcImNhbGwgZHJhdygpIGZpcnN0XCIpXG5cbiAgICB2YXIgc3R5bGUgPSBtYWtlU3R5bGUoKVxuICAgIHRoaXMuZGVmcy5hcHBlbmRDaGlsZChzdHlsZSlcbiAgICB2YXIgeG1sID0gbmV3IFNWRy5YTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcodGhpcy5lbClcbiAgICB0aGlzLmRlZnMucmVtb3ZlQ2hpbGQoc3R5bGUpXG4gICAgcmV0dXJuIHhtbFxuICB9XG5cbiAgLyogRXhwb3J0IFNWRyBpbWFnZSBhcyBkYXRhIFVSSSAqL1xuICBEb2N1bWVudC5wcm90b3R5cGUuZXhwb3J0U1ZHID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHhtbCA9IHRoaXMuZXhwb3J0U1ZHU3RyaW5nKClcbiAgICByZXR1cm4gXCJkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIiArIHhtbC5yZXBsYWNlKC9bI10vZywgZW5jb2RlVVJJQ29tcG9uZW50KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFBORyA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgdmFyIGNhbnZhcyA9IFNWRy5tYWtlQ2FudmFzKClcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLndpZHRoXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaGVpZ2h0XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG5cbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKVxuICAgIGltYWdlLnNyYyA9IHRoaXMuZXhwb3J0U1ZHKClcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwKVxuXG4gICAgICBpZiAoVVJMICYmIFVSTC5jcmVhdGVPYmplY3RVUkwgJiYgQmxvYiAmJiBjYW52YXMudG9CbG9iKSB7XG4gICAgICAgIHZhciBibG9iID0gY2FudmFzLnRvQmxvYihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgY2IoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSlcbiAgICAgICAgfSwgXCJpbWFnZS9wbmdcIilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNiKGNhbnZhcy50b0RhdGFVUkwoXCJpbWFnZS9wbmdcIikpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgR2xvdyxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH1cbn0pKClcbiIsInZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG52YXIgRmlsdGVyID0gcmVxdWlyZShcIi4vZmlsdGVyLmpzXCIpXG5cbnZhciBTdHlsZSA9IChtb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3NzQ29udGVudDogYFxuICAgIC5zYi1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgZmlsbDogI2ZmZjtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMHB4O1xuICAgICAgb3BhY2l0eTogMTtcbiAgICB9XG5cbiAgICAuc2Itb2Jzb2xldGUgeyBmaWxsOiAjRUQ0MjQyOyB9XG4gICAgLnNiLW1vdGlvbiB7IGZpbGw6ICM0Qzk3RkY7IH1cbiAgICAuc2ItbG9va3MgeyBmaWxsOiAjOTk2NkZGOyB9XG4gICAgLnNiLXNvdW5kIHsgZmlsbDogI0NGNjNDRjsgfVxuICAgIC5zYi1wZW4geyBmaWxsOiAjMGZCRDhDOyAgfVxuICAgIC5zYi1ldmVudHMgeyBmaWxsOiAjRkZCRjAwOyB9XG4gICAgLnNiLWNvbnRyb2wgeyBmaWxsOiAjRkZBQjE5OyB9XG4gICAgLnNiLXNlbnNpbmcgeyBmaWxsOiAjNUNCMUQ2OyB9XG4gICAgLnNiLW9wZXJhdG9ycyB7IGZpbGw6ICM1OUMwNTk7IH1cbiAgICAuc2ItdmFyaWFibGVzIHsgZmlsbDogI0ZGOEMxQTsgfVxuICAgIC5zYi1saXN0IHsgZmlsbDogI0ZGNjYxQSB9XG4gICAgLnNiLWN1c3RvbSB7IGZpbGw6ICNGRjY2ODA7IH1cbiAgICAuc2ItY3VzdG9tLWFyZyB7IGZpbGw6ICNGRjY2ODA7IH1cbiAgICAuc2ItZXh0ZW5zaW9uIHsgZmlsbDogIzRiNGE2MDsgfVxuICAgIC5zYi1uZXdleHRlbnNpb24geyBmaWxsOiAjMGZiZDhjOyB9XG4gICAgLnNiLWdyZXkgeyBmaWxsOiAjOTY5Njk2OyB9XG5cbiAgICAuc2ItYmV2ZWwge1xuICAgICAgZmlsdGVyMjogdXJsKCNiZXZlbEZpbHRlcik7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xNTtcbiAgICAgIHN0cm9rZS1hbGlnbm1lbnQ6IGlubmVyO1xuICAgIH1cbiAgICAuc2ItaW5wdXQtcm91bmQtZHJvcGRvd24sXG4gICAgLnNiLWlucHV0LWJvb2xlYW4ge1xuICAgICAgZmlsdGVyOiB1cmwoI2lucHV0RGFya0ZpbHRlcik7XG4gICAgfVxuICAgIC5zYi1pbnB1dCB7XG4gICAgICBmaWx0ZXIyOiB1cmwoI2lucHV0QmV2ZWxGaWx0ZXIpO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMTU7XG4gICAgICBzdHJva2UtYWxpZ25tZW50OiBpbm5lcjtcbiAgICB9XG4gICAgLnNiLWlucHV0LW51bWJlcixcbiAgICAuc2ItaW5wdXQtc3RyaW5nLFxuICAgIC5zYi1pbnB1dC1udW1iZXItZHJvcGRvd24ge1xuICAgICAgZmlsbDogI2ZmZjtcbiAgICB9XG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLFxuICAgIC5zYi1saXRlcmFsLXN0cmluZyxcbiAgICAuc2ItbGl0ZXJhbC1udW1iZXItZHJvcGRvd24sXG4gICAgLnNiLWxpdGVyYWwtZHJvcGRvd24ge1xuICAgICAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMDtcbiAgICB9XG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLFxuICAgIC5zYi1saXRlcmFsLXN0cmluZyxcbiAgICAuc2ItbGl0ZXJhbC1udW1iZXItZHJvcGRvd24ge1xuICAgICAgZmlsbDogIzQ0NDtcbiAgICB9XG5cbiAgICAuc2ItZGFya2VyIHtcbiAgICAgIGZpbHRlcjI6IHVybCgjaW5wdXREYXJrRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgICBzdHJva2UtYWxpZ25tZW50OiBpbm5lcjtcbiAgICB9XG4gICAgLnNiLWRlc2F0dXJhdGUge1xuICAgICAgZmlsdGVyOiB1cmwoI2Rlc2F0dXJhdGVGaWx0ZXIpO1xuICAgIH1cblxuICAgIC5zYi1vdXRsaW5lIHtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgICBmaWxsOiAjRkY0RDZBO1xuICAgIH1cblxuICAgIC5zYi1kZWZpbmUtaGF0LWNhcCB7XG4gICAgICBzdHJva2U6ICM2MzJkOTk7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgICBmaWxsOiAjOGUyZWMyO1xuICAgIH1cblxuICAgIC5zYi1jb21tZW50IHtcbiAgICAgIGZpbGw6ICNFNERCOEM7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4yO1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgIH1cbiAgICAuc2ItY29tbWVudC1saW5lIHtcbiAgICAgIGZpbGw6ICMwMDA7XG4gICAgICBvcGFjaXR5OiAwLjI7XG4gICAgfVxuICAgIC5zYi1jb21tZW50LWxhYmVsIHtcbiAgICAgIGZvbnQtZmFtaWx5OiBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgc2Fucy1zZXJpZjtcbiAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICBmaWxsOiAjMDAwO1xuICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgd29yZC1zcGFjaW5nOiAwcHg7XG4gICAgICBvcGFjaXR5OiAxO1xuICAgIH1cblxuICAgIC5zYi1kaWZmIHtcbiAgICAgIGZpbGw6IG5vbmU7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgfVxuICAgIC5zYi1kaWZmLWlucyB7XG4gICAgICBzdHJva2Utd2lkdGg6IDJweDtcbiAgICB9XG4gICAgLnNiLWRpZmYtZGVsIHtcbiAgICAgIHN0cm9rZS13aWR0aDogM3B4O1xuICAgIH1cbiAgYC5yZXBsYWNlKC9bIFxcbl0rLywgXCIgXCIpLFxuXG4gIG1ha2VJY29ucygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjAuOCAzLjdjLS40LS4yLS45LS4xLTEuMi4yLTIgMS42LTQuOCAxLjYtNi44IDAtMi4zLTEuOS01LjYtMi4zLTguMy0xdi0uNGMwLS42LS41LTEtMS0xcy0xIC40LTEgMXYxOC44YzAgLjUuNSAxIDEgMWguMWMuNSAwIDEtLjUgMS0xdi02LjRjMS0uNyAyLjEtMS4yIDMuNC0xLjMgMS4yIDAgMi40LjQgMy40IDEuMiAyLjkgMi4zIDcgMi4zIDkuOCAwIC4zLS4yLjQtLjUuNC0uOVY0LjdjMC0uNS0uMy0uOS0uOC0xem0tLjMgMTAuMkMxOCAxNiAxNC40IDE2IDExLjkgMTRjLTEuMS0uOS0yLjUtMS40LTQtMS40LTEuMi4xLTIuMy41LTMuNCAxLjFWNGMyLjUtMS40IDUuNS0xLjEgNy43LjYgMi40IDEuOSA1LjcgMS45IDguMSAwaC4ybC4xLjEtLjEgOS4yelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjNDU5OTNkXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMC42IDQuOGwtLjEgOS4xdi4xYy0yLjUgMi02LjEgMi04LjYgMC0xLjEtLjktMi41LTEuNC00LTEuNC0xLjIuMS0yLjMuNS0zLjQgMS4xVjRjMi41LTEuNCA1LjUtMS4xIDcuNy42IDIuNCAxLjkgNS43IDEuOSA4LjEgMGguMmMwIC4xLjEuMS4xLjJ6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiM0Y2JmNTZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJncmVlbkZsYWdcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSkgdHJhbnNsYXRlKC0zIDQpXCIsIC8vIFRPRE9cbiAgICAgICAgfVxuICAgICAgKSxcbiAgICAgIFNWRy5zZXRQcm9wcyhcbiAgICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIyLjY4IDEyLjJhMS42IDEuNiAwIDAgMS0xLjI3LjYzaC03LjY5YTEuNTkgMS41OSAwIDAgMS0xLjE2LTIuNThsMS4xMi0xLjQxYTQuODIgNC44MiAwIDAgMC0zLjE0LS43NyA0LjMxIDQuMzEgMCAwIDAtMiAuOEE0LjI1IDQuMjUgMCAwIDAgNy4yIDEwLjZhNS4wNiA1LjA2IDAgMCAwIC41NCA0LjYyQTUuNTggNS41OCAwIDAgMCAxMiAxNy43NGEyLjI2IDIuMjYgMCAwIDEtLjE2IDQuNTJBMTAuMjUgMTAuMjUgMCAwIDEgMy43NCAxOGExMC4xNCAxMC4xNCAwIDAgMS0xLjQ5LTkuMjIgOS43IDkuNyAwIDAgMSAyLjgzLTQuMTRBOS45MiA5LjkyIDAgMCAxIDkuNjYgMi41YTEwLjY2IDEwLjY2IDAgMCAxIDcuNzIgMS42OGwxLjA4LTEuMzVhMS41NyAxLjU3IDAgMCAxIDEuMjQtLjYgMS42IDEuNiAwIDAgMSAxLjU0IDEuMjFsMS43IDcuMzdhMS41NyAxLjU3IDAgMCAxLS4yNiAxLjM5elwiLFxuICAgICAgICAgICAgZmlsbDogXCIjM2Q3OWNjXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMS4zOCAxMS44M2gtNy42MWEuNTkuNTkgMCAwIDEtLjQzLTFsMS43NS0yLjE5YTUuOSA1LjkgMCAwIDAtNC43LTEuNTggNS4wNyA1LjA3IDAgMCAwLTQuMTEgMy4xN0E2IDYgMCAwIDAgNyAxNS43N2E2LjUxIDYuNTEgMCAwIDAgNSAyLjkyIDEuMzEgMS4zMSAwIDAgMS0uMDggMi42MiA5LjMgOS4zIDAgMCAxLTcuMzUtMy44MiA5LjE2IDkuMTYgMCAwIDEtMS40LTguMzdBOC41MSA4LjUxIDAgMCAxIDUuNzEgNS40YTguNzYgOC43NiAwIDAgMSA0LjExLTEuOTIgOS43MSA5LjcxIDAgMCAxIDcuNzUgMi4wN2wxLjY3LTIuMWEuNTkuNTkgMCAwIDEgMSAuMjFMMjIgMTEuMDhhLjU5LjU5IDAgMCAxLS42Mi43NXpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcInR1cm5SaWdodFwiLFxuICAgICAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgwLjY1KSB0cmFuc2xhdGUoLTIgLTUpXCIsIC8vIFRPRE9cbiAgICAgICAgfVxuICAgICAgKSxcbiAgICAgIFNWRy5zZXRQcm9wcyhcbiAgICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIwLjM0IDE4LjIxYTEwLjI0IDEwLjI0IDAgMCAxLTguMSA0LjIyIDIuMjYgMi4yNiAwIDAgMS0uMTYtNC41MiA1LjU4IDUuNTggMCAwIDAgNC4yNS0yLjUzIDUuMDYgNS4wNiAwIDAgMCAuNTQtNC42MkE0LjI1IDQuMjUgMCAwIDAgMTUuNTUgOWE0LjMxIDQuMzEgMCAwIDAtMi0uOCA0LjgyIDQuODIgMCAwIDAtMy4xNS44bDEuMTIgMS40MUExLjU5IDEuNTkgMCAwIDEgMTAuMzYgMTNIMi42N2ExLjU2IDEuNTYgMCAwIDEtMS4yNi0uNjNBMS41NCAxLjU0IDAgMCAxIDEuMTMgMTFsMS43Mi03LjQzQTEuNTkgMS41OSAwIDAgMSA0LjM4IDIuNGExLjU3IDEuNTcgMCAwIDEgMS4yNC42TDYuNyA0LjM1YTEwLjY2IDEwLjY2IDAgMCAxIDcuNzItMS42OEE5Ljg4IDkuODggMCAwIDEgMTkgNC44MSA5LjYxIDkuNjEgMCAwIDEgMjEuODMgOWExMC4wOCAxMC4wOCAwIDAgMS0xLjQ5IDkuMjF6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMzZDc5Y2NcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTE5LjU2IDE3LjY1YTkuMjkgOS4yOSAwIDAgMS03LjM1IDMuODMgMS4zMSAxLjMxIDAgMCAxLS4wOC0yLjYyIDYuNTMgNi41MyAwIDAgMCA1LTIuOTIgNi4wNSA2LjA1IDAgMCAwIC42Ny01LjUxIDUuMzIgNS4zMiAwIDAgMC0xLjY0LTIuMTYgNS4yMSA1LjIxIDAgMCAwLTIuNDgtMUE1Ljg2IDUuODYgMCAwIDAgOSA4Ljg0TDEwLjc0IDExYS41OS41OSAwIDAgMS0uNDMgMUgyLjdhLjYuNiAwIDAgMS0uNi0uNzVsMS43MS03LjQyYS41OS41OSAwIDAgMSAxLS4yMWwxLjY3IDIuMWE5LjcxIDkuNzEgMCAwIDEgNy43NS0yLjA3IDguODQgOC44NCAwIDAgMSA0LjEyIDEuOTIgOC42OCA4LjY4IDAgMCAxIDIuNTQgMy43MiA5LjE0IDkuMTQgMCAwIDEtMS4zMyA4LjM2elwiLFxuICAgICAgICAgICAgZmlsbDogXCIjZmZmXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwidHVybkxlZnRcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSkgdHJhbnNsYXRlKC0yIC01KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgZDogXCJNMCAwTDQgNEwwIDhaXCIsXG4gICAgICAgIGZpbGw6IFwiIzExMVwiLFxuICAgICAgICBpZDogXCJhZGRJbnB1dFwiLFxuICAgICAgfSksXG4gICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgZDogXCJNNCAwTDQgOEwwIDRaXCIsXG4gICAgICAgIGZpbGw6IFwiIzExMVwiLFxuICAgICAgICBpZDogXCJkZWxJbnB1dFwiLFxuICAgICAgfSksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMy4zIDExYy0uMy42LS45IDEtMS41IDFoLTEuNmMtLjEgMS4zLS41IDIuNS0xLjEgMy42LS45IDEuNy0yLjMgMy4yLTQuMSA0LjEtMS43LjktMy42IDEuMi01LjUuOS0xLjgtLjMtMy41LTEuMS00LjktMi4zLS43LS43LS43LTEuOSAwLTIuNi42LS42IDEuNi0uNyAyLjMtLjJIN2MuOS42IDEuOS45IDIuOS45czEuOS0uMyAyLjctLjljMS4xLS44IDEuOC0yLjEgMS44LTMuNWgtMS41Yy0uOSAwLTEuNy0uNy0xLjctMS43IDAtLjQuMi0uOS41LTEuMmw0LjQtNC40Yy43LS42IDEuNy0uNiAyLjQgMEwyMyA5LjJjLjUuNS42IDEuMi4zIDEuOHpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2NmOGIxN1wiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjEuOCAxMWgtMi42YzAgMS41LS4zIDIuOS0xIDQuMi0uOCAxLjYtMi4xIDIuOC0zLjcgMy42LTEuNS44LTMuMyAxLjEtNC45LjgtMS42LS4yLTMuMi0xLTQuNC0yLjEtLjQtLjMtLjQtLjktLjEtMS4yLjMtLjQuOS0uNCAxLjItLjEgMSAuNyAyLjIgMS4xIDMuNCAxLjFzMi4zLS4zIDMuMy0xYy45LS42IDEuNi0xLjUgMi0yLjYuMy0uOS40LTEuOC4yLTIuOGgtMi40Yy0uNCAwLS43LS4zLS43LS43IDAtLjIuMS0uMy4yLS40bDQuNC00LjRjLjMtLjMuNy0uMy45IDBMMjIgOS44Yy4zLjMuNC42LjMuOXMtLjMuMy0uNS4zelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjZmZmXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwibG9vcEFycm93XCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpIHRyYW5zbGF0ZSgtMTUgLTI1KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0xMi43MSAyLjQ0QTIuNDEgMi40MSAwIDAgMSAxMiA0LjE2TDguMDggOC4wOGEyLjQ1IDIuNDUgMCAwIDEtMy40NSAwTC43MiA0LjE2QTIuNDIgMi40MiAwIDAgMSAwIDIuNDQgMi40OCAyLjQ4IDAgMCAxIC43MS43MUMxIC40NyAxLjQzIDAgNi4zNiAwczUuMzkuNDYgNS42NC43MWEyLjQ0IDIuNDQgMCAwIDEgLjcxIDEuNzN6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMyMzFmMjBcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiLjFcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTYuMzYgNy43OWExLjQzIDEuNDMgMCAwIDEtMS0uNDJMMS40MiAzLjQ1YTEuNDQgMS40NCAwIDAgMSAwLTJjLjU2LS41NiA5LjMxLS41NiA5Ljg3IDBhMS40NCAxLjQ0IDAgMCAxIDAgMkw3LjM3IDcuMzdhMS40MyAxLjQzIDAgMCAxLTEuMDEuNDJ6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJ3aGl0ZURyb3Bkb3duQXJyb3dcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIixcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICAgIFNWRy5zZXRQcm9wcyhcbiAgICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTEyLjcxIDIuNDRBMi40MSAyLjQxIDAgMCAxIDEyIDQuMTZMOC4wOCA4LjA4YTIuNDUgMi40NSAwIDAgMS0zLjQ1IDBMLjcyIDQuMTZBMi40MiAyLjQyIDAgMCAxIDAgMi40NCAyLjQ4IDIuNDggMCAwIDEgLjcxLjcxQzEgLjQ3IDEuNDMgMCA2LjM2IDBzNS4zOS40NiA1LjY0LjcxYTIuNDQgMi40NCAwIDAgMSAuNzEgMS43M3pcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzIzMWYyMFwiLFxuICAgICAgICAgICAgb3BhY2l0eTogXCIuMVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNNi4zNiA3Ljc5YTEuNDMgMS40MyAwIDAgMS0xLS40MkwxLjQyIDMuNDVhMS40NCAxLjQ0IDAgMCAxIDAtMmMuNTYtLjU2IDkuMzEtLjU2IDkuODcgMGExLjQ0IDEuNDQgMCAwIDEgMCAyTDcuMzcgNy4zN2ExLjQzIDEuNDMgMCAwIDEtMS4wMS40MnpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzExMVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcImJsYWNrRHJvcGRvd25BcnJvd1wiLFxuICAgICAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgwLjY1KVwiLFxuICAgICAgICB9XG4gICAgICApLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjguNDU2IDIxLjY3NWMtLjAwOS0uMzEyLS4wODctLjgyNS0uMjU2LTEuNzAyLS4wOTYtLjQ5NS0uNjEyLTMuMDIyLS43NTMtMy43My0uMzk1LTEuOTgtLjc2LTMuOTItMS4xNDItNi4xMTMtLjczMi00LjIyMy0uNjkzLTYuMDUuMzQ0LTYuNTI3LjUwMi0uMjMgMS4wNi0uMDgxIDEuODQyLjM1LjQxMy4yMjcgMi4xODEgMS4zNjUgMi4wNyAxLjI5NiAxLjk5MyAxLjI0MyAzLjQ2MyAxLjc3NSA0LjkyOCAxLjU0OSAxLjUyNy0uMjM3IDIuNTA1LS4wNiAyLjg3Ny42MTguMzQ4LjYzNS4wMTUgMS40MTYtLjcyOSAyLjE4LTEuNDczIDEuNTE2LTMuOTc2IDIuNTE0LTUuODQ5IDIuMDIzLS44MjItLjIxOC0xLjIzOC0uNDY0LTIuMzgtMS4yNjZhOS43MzcgOS43MzcgMCAwIDAtLjA5NS0uMDY2Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMy4yOTQgMS4zMzYgMi4wNzkgOS4xODcgMi42MzcgMTEuNjc0bC4wMDIuMDEyYy41MjkgMi42MzctMS44NzIgNC43MjQtNS4yMzUgNC43MjQtMy4yOSAwLTYuMzYzLTEuOTg4LTYuODYyLTQuNTI4LS41My0yLjY0IDEuODczLTQuNzM0IDUuMjMzLTQuNzM0YTguNDExIDguNDExIDAgMCAxIDIuNjUuNDM3ek0xMS40NiAyNy42NjZjLS4wMS0uMzE5LS4wOTEtLjg0LS4yNjYtMS43MzgtLjA5LS40Ni0uNTk1LTIuOTM3LS43NTMtMy43MjctLjM5LTEuOTYtLjc1Mi0zLjg5Mi0xLjEzMS02LjA3LS43MzItNC4yMjQtLjY5Mi02LjA1Mi4zNDQtNi41MjcuNTAyLS4yMyAxLjA2LS4wODIgMS44NDEuMzQ5LjQxNC4yMjggMi4xODEgMS4zNjUgMi4wNyAxLjI5NiAxLjk5MiAxLjI0MyAzLjQ2MSAxLjc3NSA0LjkyNSAxLjU0OSAxLjUyNS0uMjQgMi41MDQtLjA2NCAyLjg3Ni42MTQuMzQ4LjYzNS4wMTUgMS40MTUtLjcyOCAyLjE4LTEuNDc0IDEuNTE3LTMuOTc3IDIuNTEzLTUuODQ3IDIuMDE3LS44MjItLjIxOC0xLjIzNy0uNDYzLTIuMzgtMS4yNjZhOS43MjkgOS43MjkgMCAwIDAtLjA5NC0uMDY1Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMi4yOTQgMS4zMzcgMi4wNzggOS4xOSAyLjYzNiAxMS42NzVsLjAwMy4wMTNjLjUxNyAyLjYzOC0xLjg4NCA0LjczMi01LjIzNCA0LjczMi0zLjI4NiAwLTYuMzU5LTEuOTkzLTYuODctNC41NC0uNTE4LTIuNjM5IDEuODg1LTQuNzMgNS4yNDItNC43My45MDQgMCAxLjgwMi4xNSAyLjY1LjQzNnpcIixcbiAgICAgICAgICAgIHN0cm9rZTogXCIjMDAwXCIsXG4gICAgICAgICAgICBcInN0cm9rZS1vcGFjaXR5XCI6IFwiLjFcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTMyLjE4IDI1Ljg3NEMzMi42MzYgMjguMTU3IDMwLjUxMiAzMCAyNy40MzMgMzBjLTMuMDcgMC01LjkyMy0xLjg0My02LjM3Mi00LjEyNi0uNDU4LTIuMjg1IDEuNjY1LTQuMTM2IDQuNzQzLTQuMTM2LjY0NyAwIDEuMjgzLjA4NCAxLjg5LjIzNGE3IDcgMCAwIDEgLjkzOC4zMDJjLjg3LS4wMi0uMTA0LTIuMjk0LTEuODM1LTEyLjIyOS0yLjEzNC0xMi4zMDMgMy4wNi0xLjg3IDguNzY4LTIuNzUzIDUuNzA4LS44ODUuMDc2IDQuODItMy42NSAzLjg0NC0zLjcyNC0uOTg3LTQuNjUtNy4xNTMuMjYzIDE0LjczOHptLTE2Ljk5OCA1Ljk5QzE1LjYzIDM0LjE0OCAxMy41MDcgMzYgMTAuNDM5IDM2Yy0zLjA2OCAwLTUuOTItMS44NTItNi4zNzktNC4xMzYtLjQ0OC0yLjI4NCAxLjY3NC00LjEzNSA0Ljc1MS00LjEzNSAxLjAwMiAwIDEuOTc0LjE5NyAyLjg1NC41NDQuODIyLS4wNTUtLjE1LTIuMzc3LTEuODYyLTEyLjIyOC0yLjEzMy0xMi4zMDMgMy4wNTktMS44NyA4Ljc2NC0yLjc1MyA1LjcwNi0uODk0LjA3NiA0LjgyMS0zLjY0OCAzLjgzNC0zLjcyMy0uOTg3LTQuNjQ4LTcuMTUyLjI2MyAxNC43Mzh6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNGRkZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJtdXNpY0Jsb2NrXCIsXG4gICAgICAgICAgZmlsbDogXCJub25lXCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpXCJcbiAgICAgICAgfVxuICAgICAgKSxcblxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNOC43NTMgMzQuNjAybC00LjI1MSAxLjc3OSAxLjc4NC00LjIzNmMxLjIxOC0yLjg5MiAyLjkwNy01LjQyMyA1LjAzLTcuNTM4TDMxLjA2NiA0LjkzYy44NDYtLjg0MiAyLjY1LS40MSA0LjAzMi45NjcgMS4zOCAxLjM3NSAxLjgxNiAzLjE3My45NyA0LjAxNUwxNi4zMTggMjkuNTljLTIuMTIzIDIuMTE2LTQuNjY0IDMuNzk5LTcuNTY1IDUuMDEyXCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNGRkZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTI5LjQxIDYuMTExcy00LjQ1LTIuMzc5LTguMjAyIDUuNzcxYy0xLjczNCAzLjc2Ni00LjM1IDEuNTQ2LTQuMzUgMS41NDZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTM2LjQyIDguODI1YzAgLjQ2My0uMTQuODczLS40MzIgMS4xNjRsLTkuMzM1IDkuMzAxYy4yODItLjI5LjQxLS42NjguNDEtMS4xMiAwLS44NzQtLjUwNy0xLjk2My0xLjQwNi0yLjg2OC0xLjM2Mi0xLjM1OC0zLjE0Ny0xLjgtNC4wMDItLjk5TDMwLjk5IDUuMDFjLjg0NC0uODQgMi42NS0uNDEgNC4wMzUuOTYuODk4LjkwNCAxLjM5NiAxLjk4MiAxLjM5NiAyLjg1NU0xMC41MTUgMzMuNzc0YTIzLjc0IDIzLjc0IDAgMCAxLTEuNzY0LjgzTDQuNSAzNi4zODJsMS43ODYtNC4yMzVjLjI1OC0uNjA0LjUyOS0xLjE4Ni44MzMtMS43NTcuNjkuMTgzIDEuNDQ5LjYyNSAyLjEwOSAxLjI4Mi42NTkuNjU4IDEuMTAyIDEuNDEyIDEuMjg3IDIuMTAyXCIsXG4gICAgICAgICAgICBmaWxsOiBcIiM0Qzk3RkZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTM2LjQ5OCA4Ljc0OGMwIC40NjQtLjE0MS44NzQtLjQzMyAxLjE2NWwtMTkuNzQyIDE5LjY4Yy0yLjEzMSAyLjExMS00LjY3MyAzLjc5My03LjU3MiA1LjAxTDQuNSAzNi4zODFsLjk3NC0yLjMxNyAxLjkyNS0uODA4YzIuODk5LTEuMjE4IDUuNDQxLTIuODk5IDcuNTcyLTUuMDFsMTkuNzQyLTE5LjY4Yy4yOTItLjI5Mi40MzItLjcwMi40MzItMS4xNjUgMC0uNjQ3LS4yNy0xLjQtLjc3OS0yLjEyMy4yNDkuMTcyLjQ5OC4zNzcuNzM2LjYxNC44OTguOTA1IDEuMzk2IDEuOTgzIDEuMzk2IDIuODU2XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiM1NzVFNzVcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiLjE1XCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOiBcIk0xOC40NSAxMi44MzFhLjkwNC45MDQgMCAxIDEtMS44MDcgMCAuOTA0LjkwNCAwIDAgMSAxLjgwNyAwelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjNTc1RTc1XCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwicGVuQmxvY2tcIixcbiAgICAgICAgICBzdHJva2U6IFwiIzU3NUU3NVwiLFxuICAgICAgICAgIGZpbGw6IFwibm9uZVwiLFxuICAgICAgICAgIFwic3Ryb2tlLWxpbmVqb2luXCI6IFwicm91bmRcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIlxuICAgICAgICB9XG4gICAgICApLFxuXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwiY2lyY2xlXCIsIHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuMjUsXG4gICAgICAgICAgICBjeDogMzIsXG4gICAgICAgICAgICBjeTogMTYsXG4gICAgICAgICAgICByOiA0LjUsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwiY2lyY2xlXCIsIHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuNSxcbiAgICAgICAgICAgIGN4OiAzMixcbiAgICAgICAgICAgIGN5OiAxMixcbiAgICAgICAgICAgIHI6IDQuNSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJjaXJjbGVcIiwge1xuICAgICAgICAgICAgb3BhY2l0eTogMC43NSxcbiAgICAgICAgICAgIGN4OiAzMixcbiAgICAgICAgICAgIGN5OiA4LFxuICAgICAgICAgICAgcjogNC41LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcImNpcmNsZVwiLCB7XG4gICAgICAgICAgICBjeDogMzIsXG4gICAgICAgICAgICBjeTogNCxcbiAgICAgICAgICAgIHI6IDQuNSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIyLjY3MiA0LjQybC02LjE3MiA0VjYuMWMwLTIuMDEtMS41NjMtMy42LTMuNS0zLjZINC4xQzIuMDc2IDIuNS41IDQuMDc2LjUgNi4xVjE0YzAgMS45MjcgMS41ODQgMy41MTIgMy42IDMuNkgxM2MxLjkwMiAwIDMuNS0xLjY1MyAzLjUtMy42di0yLjI4M2w2LjI1NyAzLjc1NC4wOTcuMDc1Yy4wMi4wMi4wOTguMDU0LjE0Ni4wNTQuMjY3IDAgLjUtLjIxNy41LS41VjQuOGMwIC4wMzctLjA1Ni0uMDk0LS4xMjktLjI0My0uMTQ1LS4yNDItLjQzLS4yOTktLjctLjEzN3pcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzRENEQ0RFwiLFxuICAgICAgICAgICAgXCJzdHJva2UtbGluZWpvaW5cIjogXCJyb3VuZFwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcInZpZGVvQmxvY2tcIixcbiAgICAgICAgICBzdHJva2U6IFwiIzAwMFwiLFxuICAgICAgICAgIGZpbGw6IFwiI0ZGRlwiLFxuICAgICAgICAgIFwic3Ryb2tlLW9wYWNpdHlcIjogMC4xNSxcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIlxuICAgICAgICB9XG4gICAgICApLFxuICAgIF1cbiAgfSxcblxuICBtYWtlU3R5bGUoKSB7XG4gICAgdmFyIHN0eWxlID0gU1ZHLmVsKFwic3R5bGVcIilcbiAgICBzdHlsZS5hcHBlbmRDaGlsZChTVkcuY2RhdGEoU3R5bGUuY3NzQ29udGVudCkpXG4gICAgcmV0dXJuIHN0eWxlXG4gIH0sXG5cbiAgYmV2ZWxGaWx0ZXIoaWQsIGluc2V0KSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKVxuXG4gICAgdmFyIGFscGhhID0gXCJTb3VyY2VBbHBoYVwiXG4gICAgdmFyIHMgPSBpbnNldCA/IC0xIDogMVxuICAgIHZhciBibHVyID0gZi5ibHVyKDEsIGFscGhhKVxuXG4gICAgZi5tZXJnZShbXG4gICAgICBcIlNvdXJjZUdyYXBoaWNcIixcbiAgICAgIGYuY29tcChcbiAgICAgICAgXCJpblwiLFxuICAgICAgICBmLmZsb29kKFwiI2ZmZlwiLCAwLjE1KSxcbiAgICAgICAgZi5zdWJ0cmFjdChhbHBoYSwgZi5vZmZzZXQoK3MsICtzLCBibHVyKSlcbiAgICAgICksXG4gICAgICBmLmNvbXAoXG4gICAgICAgIFwiaW5cIixcbiAgICAgICAgZi5mbG9vZChcIiMwZjBcIiwgMC43KSxcbiAgICAgICAgZi5zdWJ0cmFjdChhbHBoYSwgZi5vZmZzZXQoLXMsIC1zLCBibHVyKSlcbiAgICAgICksXG4gICAgXSlcblxuICAgIHJldHVybiBmLmVsXG4gIH0sXG5cbiAgZGFya0ZpbHRlcihpZCkge1xuICAgIHZhciBmID0gbmV3IEZpbHRlcihpZClcblxuICAgIGYubWVyZ2UoW1xuICAgICAgXCJTb3VyY2VHcmFwaGljXCIsXG4gICAgICBmLmNvbXAoXCJpblwiLCBmLmZsb29kKFwiIzAwMFwiLCAwLjIpLCBcIlNvdXJjZUFscGhhXCIpLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRlc2F0dXJhdGVGaWx0ZXIoaWQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpXG5cbiAgICB2YXIgcSA9IDAuMzMzXG4gICAgdmFyIHMgPSAwLjMzM1xuICAgIGYuY29sb3JNYXRyaXgoXCJTb3VyY2VHcmFwaGljXCIsIFtcbiAgICAgIHEsXG4gICAgICBzLFxuICAgICAgcyxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgcyxcbiAgICAgIHEsXG4gICAgICBzLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICBzLFxuICAgICAgcyxcbiAgICAgIHEsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDEsXG4gICAgICAwLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRhcmtSZWN0KHcsIGgsIGNhdGVnb3J5LCBlbCkge1xuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoXG4gICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgICBjbGFzczogW1wic2ItXCIgKyBjYXRlZ29yeSwgXCJzYi1kYXJrZXJcIl0uam9pbihcIiBcIiksXG4gICAgICAgIH0pLFxuICAgICAgXSksXG4gICAgICB7IHdpZHRoOiB3LCBoZWlnaHQ6IGggfVxuICAgIClcbiAgfSxcblxuICBkZWZhdWx0Rm9udEZhbWlseTogXCInSGVsdmV0aWNhIE5ldWUnLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWZcIixcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cblxuICB2YXIge1xuICAgIExhYmVsLFxuICAgIEljb24sXG4gICAgSW5wdXQsXG4gICAgQmxvY2ssXG4gICAgQ29tbWVudCxcbiAgICBHbG93LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcbiAgfSA9IHJlcXVpcmUoXCIuL21vZGVsLmpzXCIpXG5cbiAgdmFyIHtcbiAgICBhbGxMYW5ndWFnZXMsXG4gICAgbG9va3VwRHJvcGRvd24sXG4gICAgaGV4Q29sb3JQYXQsXG4gICAgbWluaWZ5SGFzaCxcbiAgICBsb29rdXBIYXNoLFxuICAgIGhhc2hTcGVjLFxuICAgIGFwcGx5T3ZlcnJpZGVzLFxuICAgIHJ0bExhbmd1YWdlcyxcbiAgICBpY29uUGF0LFxuICAgIGJsb2NrTmFtZSxcbiAgfSA9IHJlcXVpcmUoXCIuL2Jsb2Nrcy5qc1wiKVxuXG4gIGZ1bmN0aW9uIHBhaW50QmxvY2soaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcykge1xuICAgIHZhciBvdmVycmlkZXMgPSBbXVxuICAgIGlmIChpc0FycmF5KGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdKSkge1xuICAgICAgb3ZlcnJpZGVzID0gY2hpbGRyZW4ucG9wKClcbiAgICB9XG5cbiAgICAvLyBidWlsZCBoYXNoXG4gICAgdmFyIHdvcmRzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgaWYgKGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgd29yZHMucHVzaChjaGlsZC52YWx1ZSlcbiAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNJY29uKSB7XG4gICAgICAgIHdvcmRzLnB1c2goXCJAXCIgKyBjaGlsZC5uYW1lKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd29yZHMucHVzaChcIl9cIilcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGhhc2ggPSAoaW5mby5oYXNoID0gbWluaWZ5SGFzaCh3b3Jkcy5qb2luKFwiIFwiKSkpXG5cbiAgICAvLyBwYWludFxuICAgIHZhciBvID0gbG9va3VwSGFzaChoYXNoLCBpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKVxuICAgIGlmIChvKSB7XG4gICAgICB2YXIgbGFuZyA9IG8ubGFuZ1xuICAgICAgdmFyIHR5cGUgPSBvLnR5cGVcbiAgICAgIGluZm8ubGFuZ3VhZ2UgPSBsYW5nXG4gICAgICBpbmZvLmlzUlRMID0gcnRsTGFuZ3VhZ2VzLmluZGV4T2YobGFuZy5jb2RlKSA+IC0xXG5cbiAgICAgIGlmIChcbiAgICAgICAgdHlwZS5zaGFwZSA9PT0gXCJyaW5nXCJcbiAgICAgICAgICA/IGluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgICAgICAgIDogaW5mby5zaGFwZSA9PT0gXCJzdGFja1wiXG4gICAgICApIHtcbiAgICAgICAgaW5mby5zaGFwZSA9IHR5cGUuc2hhcGVcbiAgICAgIH1cbiAgICAgIGluZm8uY2F0ZWdvcnkgPSB0eXBlLmNhdGVnb3J5XG4gICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgIGlmICh0eXBlLnNlbGVjdG9yKSBpbmZvLnNlbGVjdG9yID0gdHlwZS5zZWxlY3RvciAvLyBmb3IgdG9KU09OXG4gICAgICBpbmZvLmhhc0xvb3BBcnJvdyA9IHR5cGUuaGFzTG9vcEFycm93XG5cbiAgICAgIC8vIGVsbGlwc2lzIGJsb2NrXG4gICAgICBpZiAodHlwZS5zcGVjID09PSBcIi4gLiAuXCIpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBbbmV3IExhYmVsKFwiLiAuIC5cIildXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gb3ZlcnJpZGVzXG4gICAgYXBwbHlPdmVycmlkZXMoaW5mbywgb3ZlcnJpZGVzKVxuXG4gICAgLy8gbG9vcCBhcnJvd3NcbiAgICBpZiAoaW5mby5oYXNMb29wQXJyb3cpIHtcbiAgICAgIGNoaWxkcmVuLnB1c2gobmV3IEljb24oXCJsb29wQXJyb3dcIikpXG4gICAgfVxuXG4gICAgdmFyIGJsb2NrID0gbmV3IEJsb2NrKGluZm8sIGNoaWxkcmVuKVxuXG4gICAgLy8gaW1hZ2UgcmVwbGFjZW1lbnRcbiAgICBpZiAodHlwZSAmJiBpY29uUGF0LnRlc3QodHlwZS5zcGVjKSkge1xuICAgICAgYmxvY2sudHJhbnNsYXRlKGxhbmcsIHRydWUpXG4gICAgfVxuXG4gICAgLy8gZGlmZnNcbiAgICBpZiAoaW5mby5kaWZmID09PSBcIitcIikge1xuICAgICAgcmV0dXJuIG5ldyBHbG93KGJsb2NrKVxuICAgIH0gZWxzZSB7XG4gICAgICBibG9jay5kaWZmID0gaW5mby5kaWZmXG4gICAgfVxuICAgIHJldHVybiBibG9ja1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VMaW5lcyhjb2RlLCBsYW5ndWFnZXMpIHtcbiAgICB2YXIgdG9rID0gY29kZVswXVxuICAgIHZhciBpbmRleCA9IDBcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgdG9rID0gY29kZVsrK2luZGV4XVxuICAgIH1cbiAgICBmdW5jdGlvbiBwZWVrKCkge1xuICAgICAgcmV0dXJuIGNvZGVbaW5kZXggKyAxXVxuICAgIH1cbiAgICBmdW5jdGlvbiBwZWVrTm9uV3MoKSB7XG4gICAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxOyBpIDwgY29kZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY29kZVtpXSAhPT0gXCIgXCIpIHJldHVybiBjb2RlW2ldXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzYXdOTFxuXG4gICAgdmFyIGRlZmluZSA9IFtdXG4gICAgbGFuZ3VhZ2VzLm1hcChmdW5jdGlvbihsYW5nKSB7XG4gICAgICBkZWZpbmUgPSBkZWZpbmUuY29uY2F0KGxhbmcuZGVmaW5lKVxuICAgIH0pXG4gICAgLy8gTkIuIHdlIGFzc3VtZSAnZGVmaW5lJyBpcyBhIHNpbmdsZSB3b3JkIGluIGV2ZXJ5IGxhbmd1YWdlXG4gICAgZnVuY3Rpb24gaXNEZWZpbmUod29yZCkge1xuICAgICAgcmV0dXJuIGRlZmluZS5pbmRleE9mKHdvcmQpID4gLTFcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQmxvY2soc2hhcGUsIGNoaWxkcmVuKSB7XG4gICAgICB2YXIgaGFzSW5wdXRzID0gISFjaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gIXguaXNMYWJlbFxuICAgICAgfSkubGVuZ3RoXG4gICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgc2hhcGU6IHNoYXBlLFxuICAgICAgICBjYXRlZ29yeTpcbiAgICAgICAgICBzaGFwZSA9PT0gXCJkZWZpbmUtaGF0XCJcbiAgICAgICAgICAgID8gXCJjdXN0b21cIlxuICAgICAgICAgICAgOiBzaGFwZSA9PT0gXCJyZXBvcnRlclwiICYmICFoYXNJbnB1dHMgPyBcInZhcmlhYmxlc1wiIDogXCJvYnNvbGV0ZVwiLFxuICAgICAgICBjYXRlZ29yeUlzRGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgaGFzTG9vcEFycm93OiBmYWxzZSxcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYWludEJsb2NrKGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZU1lbnUoc2hhcGUsIHZhbHVlKSB7XG4gICAgICB2YXIgbWVudSA9IGxvb2t1cERyb3Bkb3duKHZhbHVlLCBsYW5ndWFnZXMpIHx8IHZhbHVlXG4gICAgICByZXR1cm4gbmV3IElucHV0KHNoYXBlLCB2YWx1ZSwgbWVudSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwUGFydHMoZW5kKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgdmFyIGxhYmVsXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIjxcIiB8fCAodG9rID09PSBcIj5cIiAmJiBlbmQgPT09IFwiPlwiKSkge1xuICAgICAgICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgICAgICB2YXIgYyA9IHBlZWtOb25XcygpXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbGFzdCAmJlxuICAgICAgICAgICAgIWxhc3QuaXNMYWJlbCAmJlxuICAgICAgICAgICAgKGMgPT09IFwiW1wiIHx8IGMgPT09IFwiKFwiIHx8IGMgPT09IFwiPFwiIHx8IGMgPT09IFwie1wiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbCh0b2spKVxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rID09PSBlbmQpIGJyZWFrXG4gICAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIgJiYgIWVuZCkgYnJlYWtcblxuICAgICAgICBzd2l0Y2ggKHRvaykge1xuICAgICAgICAgIGNhc2UgXCJbXCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocFN0cmluZygpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiKFwiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBSZXBvcnRlcigpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBQcmVkaWNhdGUoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIntcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwRW1iZWRkZWQoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgICBjYXNlIFwiXFx0XCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGlmIChsYWJlbCAmJiBpc0RlZmluZShsYWJlbC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgLy8gZGVmaW5lIGhhdFxuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdXRsaW5lKCkpXG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCLil4JcIjpcbiAgICAgICAgICBjYXNlIFwi4pa4XCI6XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBJY29uKCkpXG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIkBcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgdmFyIG5hbWUgPSBcIlwiXG4gICAgICAgICAgICB3aGlsZSAodG9rICYmIC9bYS16QS1aXS8udGVzdCh0b2spKSB7XG4gICAgICAgICAgICAgIG5hbWUgKz0gdG9rXG4gICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwiY2xvdWRcIikge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbChcIuKYgVwiKSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgICAgICAgSWNvbi5pY29ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuICAgICAgICAgICAgICAgICAgPyBuZXcgSWNvbihuYW1lKVxuICAgICAgICAgICAgICAgICAgOiBuZXcgTGFiZWwoXCJAXCIgKyBuYW1lKVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICAgICAgIG5leHQoKSAvLyBlc2NhcGUgY2hhcmFjdGVyXG4gICAgICAgICAgLy8gZmFsbC10aHJ1XG4gICAgICAgICAgY2FzZSBcIjpcIjpcbiAgICAgICAgICAgIGlmICh0b2sgPT09IFwiOlwiICYmIHBlZWsoKSA9PT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3ZlcnJpZGVzKGVuZCkpXG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlblxuICAgICAgICAgICAgfSAvLyBmYWxsLXRocnVcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCFsYWJlbCkgY2hpbGRyZW4ucHVzaCgobGFiZWwgPSBuZXcgTGFiZWwoXCJcIikpKVxuICAgICAgICAgICAgbGFiZWwudmFsdWUgKz0gdG9rXG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFN0cmluZygpIHtcbiAgICAgIG5leHQoKSAvLyAnWydcbiAgICAgIHZhciBzID0gXCJcIlxuICAgICAgdmFyIGVzY2FwZVYgPSBmYWxzZVxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXVwiICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIlxcXFxcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIGlmICh0b2sgPT09IFwidlwiKSBlc2NhcGVWID0gdHJ1ZVxuICAgICAgICAgIGlmICghdG9rKSBicmVha1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVzY2FwZVYgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIHMgKz0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKHRvayA9PT0gXCJdXCIpIG5leHQoKVxuICAgICAgaWYgKGhleENvbG9yUGF0LnRlc3QocykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcImNvbG9yXCIsIHMpXG4gICAgICB9XG4gICAgICByZXR1cm4gIWVzY2FwZVYgJiYgLyB2JC8udGVzdChzKVxuICAgICAgICA/IG1ha2VNZW51KFwiZHJvcGRvd25cIiwgcy5zbGljZSgwLCBzLmxlbmd0aCAtIDIpKVxuICAgICAgICA6IG5ldyBJbnB1dChcInN0cmluZ1wiLCBzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBCbG9jayhlbmQpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhlbmQpXG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCJcXG5cIikge1xuICAgICAgICBzYXdOTCA9IHRydWVcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgLy8gZGVmaW5lIGhhdHNcbiAgICAgIHZhciBmaXJzdCA9IGNoaWxkcmVuWzBdXG4gICAgICBpZiAoZmlyc3QgJiYgZmlyc3QuaXNMYWJlbCAmJiBpc0RlZmluZShmaXJzdC52YWx1ZSkpIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKG1ha2VCbG9jayhcIm91dGxpbmVcIiwgW10pKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWtlQmxvY2soXCJkZWZpbmUtaGF0XCIsIGNoaWxkcmVuKVxuICAgICAgfVxuXG4gICAgICAvLyBzdGFuZGFsb25lIHJlcG9ydGVyc1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlblswXVxuICAgICAgICBpZiAoXG4gICAgICAgICAgY2hpbGQuaXNCbG9jayAmJlxuICAgICAgICAgIChjaGlsZC5pc1JlcG9ydGVyIHx8IGNoaWxkLmlzQm9vbGVhbiB8fCBjaGlsZC5pc1JpbmcpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBjaGlsZFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYWtlQmxvY2soXCJzdGFja1wiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwUmVwb3J0ZXIoKSB7XG4gICAgICBuZXh0KCkgLy8gJygnXG5cbiAgICAgIC8vIGVtcHR5IG51bWJlci1kcm9wZG93blxuICAgICAgaWYgKHRvayA9PT0gXCIgXCIpIHtcbiAgICAgICAgbmV4dCgpXG4gICAgICAgIGlmICh0b2sgPT09IFwidnZcIiAmJiBwZWVrKCkgPT09IFwiKVwiKSB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcIm51bWJlci1kcm9wZG93blwiLCBcIlwiKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0b2sgPT09IFwidlwiICYmIHBlZWsoKSA9PT0gXCIpXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICByZXR1cm4gbmV3IElucHV0KFwicm91bmQtZHJvcGRvd25cIiwgXCJcIilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoXCIpXCIpXG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCIpXCIpIG5leHQoKVxuXG4gICAgICAvLyBlbXB0eSBudW1iZXJzXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJudW1iZXJcIiwgXCJcIilcbiAgICAgIH1cblxuICAgICAgLy8gbnVtYmVyXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIGNoaWxkcmVuWzBdLmlzTGFiZWwpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gY2hpbGRyZW5bMF0udmFsdWVcbiAgICAgICAgaWYgKC9eWzAtOWUuLV0qJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IElucHV0KFwibnVtYmVyXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIG51bWJlci1kcm9wZG93blxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWNoaWxkcmVuW2ldLmlzTGFiZWwpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaSA9PT0gY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHZhciBsYXN0ID0gY2hpbGRyZW5baSAtIDFdXG4gICAgICAgIGlmIChpID4gMSAmJiBsYXN0LnZhbHVlID09PSBcInZ2XCIpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wb3AoKVxuICAgICAgICAgIHZhciB2YWx1ZSA9IGNoaWxkcmVuXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uKGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGwudmFsdWVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbihcIiBcIilcbiAgICAgICAgICByZXR1cm4gbWFrZU1lbnUoXCJudW1iZXItZHJvcGRvd25cIiwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgPiAxICYmIGxhc3QudmFsdWUgPT09IFwidlwiKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucG9wKClcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjaGlsZHJlblxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbihsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBsLnZhbHVlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oXCIgXCIpXG4gICAgICAgICAgcmV0dXJuIG1ha2VNZW51KFwicm91bmQtZHJvcGRvd25cIiwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGJsb2NrID0gbWFrZUJsb2NrKFwicmVwb3J0ZXJcIiwgY2hpbGRyZW4pXG5cbiAgICAgIC8vIHJpbmdzXG4gICAgICBpZiAoYmxvY2suaW5mby5zaGFwZSA9PT0gXCJyaW5nXCIpIHtcbiAgICAgICAgdmFyIGZpcnN0ID0gYmxvY2suY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGZpcnN0ICYmXG4gICAgICAgICAgZmlyc3QuaXNJbnB1dCAmJlxuICAgICAgICAgIGZpcnN0LnNoYXBlID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgZmlyc3QudmFsdWUgPT09IFwiXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgYmxvY2suY2hpbGRyZW5bMF0gPSBuZXcgSW5wdXQoXCJyZXBvcnRlclwiKVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIChmaXJzdCAmJiBmaXJzdC5pc1NjcmlwdCAmJiBmaXJzdC5pc0VtcHR5KSB8fFxuICAgICAgICAgIChmaXJzdCAmJiBmaXJzdC5pc0Jsb2NrICYmICFmaXJzdC5jaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgICkge1xuICAgICAgICAgIGJsb2NrLmNoaWxkcmVuWzBdID0gbmV3IElucHV0KFwic3RhY2tcIilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYmxvY2tcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwUHJlZGljYXRlKCkge1xuICAgICAgbmV4dCgpIC8vICc8J1xuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKFwiPlwiKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiPlwiKSBuZXh0KClcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcImJvb2xlYW5cIilcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlQmxvY2soXCJib29sZWFuXCIsIGNoaWxkcmVuKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBFbWJlZGRlZCgpIHtcbiAgICAgIG5leHQoKSAvLyAneydcblxuICAgICAgc2F3TkwgPSBmYWxzZVxuICAgICAgdmFyIGYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwifVwiKSB7XG4gICAgICAgICAgdmFyIGJsb2NrID0gcEJsb2NrKFwifVwiKVxuICAgICAgICAgIGlmIChibG9jaykgcmV0dXJuIGJsb2NrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpXG4gICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgIHNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgYmxvY2tzID0gYmxvY2tzLmNvbmNhdChzY3JpcHQuYmxvY2tzKVxuICAgICAgfSlcblxuICAgICAgaWYgKHRvayA9PT0gXCJ9XCIpIG5leHQoKVxuICAgICAgaWYgKCFzYXdOTCkge1xuICAgICAgICBhc3NlcnQoYmxvY2tzLmxlbmd0aCA8PSAxKVxuICAgICAgICByZXR1cm4gYmxvY2tzLmxlbmd0aCA/IGJsb2Nrc1swXSA6IG1ha2VCbG9jayhcInN0YWNrXCIsIFtdKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTY3JpcHQoYmxvY2tzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBJY29uKCkge1xuICAgICAgdmFyIGMgPSB0b2tcbiAgICAgIG5leHQoKVxuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgXCLilrhcIjpcbiAgICAgICAgICByZXR1cm4gbmV3IEljb24oXCJhZGRJbnB1dFwiKVxuICAgICAgICBjYXNlIFwi4peCXCI6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJY29uKFwiZGVsSW5wdXRcIilcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwT3ZlcnJpZGVzKGVuZCkge1xuICAgICAgbmV4dCgpXG4gICAgICBuZXh0KClcbiAgICAgIHZhciBvdmVycmlkZXMgPSBbXVxuICAgICAgdmFyIG92ZXJyaWRlID0gXCJcIlxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIgJiYgdG9rICE9PSBlbmQpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCIgXCIpIHtcbiAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlcy5wdXNoKG92ZXJyaWRlKVxuICAgICAgICAgICAgb3ZlcnJpZGUgPSBcIlwiXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRvayA9PT0gXCIvXCIgJiYgcGVlaygpID09PSBcIi9cIikge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3ZlcnJpZGUgKz0gdG9rXG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAob3ZlcnJpZGUpIG92ZXJyaWRlcy5wdXNoKG92ZXJyaWRlKVxuICAgICAgcmV0dXJuIG92ZXJyaWRlc1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBDb21tZW50KGVuZCkge1xuICAgICAgbmV4dCgpXG4gICAgICBuZXh0KClcbiAgICAgIHZhciBjb21tZW50ID0gXCJcIlxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIgJiYgdG9rICE9PSBlbmQpIHtcbiAgICAgICAgY29tbWVudCArPSB0b2tcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCJcXG5cIikgbmV4dCgpXG4gICAgICByZXR1cm4gbmV3IENvbW1lbnQoY29tbWVudCwgdHJ1ZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwT3V0bGluZSgpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgICBmdW5jdGlvbiBwYXJzZUFyZyhraW5kLCBlbmQpIHtcbiAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgIG5leHQoKVxuICAgICAgICB2YXIgcGFydHMgPSBwUGFydHMoZW5kKVxuICAgICAgICBpZiAodG9rID09PSBlbmQpIG5leHQoKVxuICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgIHBhaW50QmxvY2soXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNoYXBlOiBraW5kID09PSBcImJvb2xlYW5cIiA/IFwiYm9vbGVhblwiIDogXCJyZXBvcnRlclwiLFxuICAgICAgICAgICAgICBhcmd1bWVudDoga2luZCxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tLWFyZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhcnRzLFxuICAgICAgICAgICAgbGFuZ3VhZ2VzXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICB9XG4gICAgICB2YXIgbGFiZWxcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAodG9rKSB7XG4gICAgICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgICAgIHBhcnNlQXJnKFwibnVtYmVyXCIsIFwiKVwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiW1wiOlxuICAgICAgICAgICAgcGFyc2VBcmcoXCJzdHJpbmdcIiwgXCJdXCIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICBwYXJzZUFyZyhcImJvb2xlYW5cIiwgXCI+XCIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCIgXCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiXFxcXFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgLy8gZmFsbC10aHJ1XG4gICAgICAgICAgY2FzZSBcIjpcIjpcbiAgICAgICAgICAgIGlmICh0b2sgPT09IFwiOlwiICYmIHBlZWsoKSA9PT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3ZlcnJpZGVzKCkpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IC8vIGZhbGwtdGhydVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAoIWxhYmVsKSBjaGlsZHJlbi5wdXNoKChsYWJlbCA9IG5ldyBMYWJlbChcIlwiKSkpXG4gICAgICAgICAgICBsYWJlbC52YWx1ZSArPSB0b2tcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwib3V0bGluZVwiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTGluZSgpIHtcbiAgICAgIHZhciBkaWZmXG4gICAgICBpZiAodG9rID09PSBcIitcIiB8fCB0b2sgPT09IFwiLVwiKSB7XG4gICAgICAgIGRpZmYgPSB0b2tcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICB2YXIgYmxvY2sgPSBwQmxvY2soKVxuICAgICAgaWYgKHRvayA9PT0gXCIvXCIgJiYgcGVlaygpID09PSBcIi9cIikge1xuICAgICAgICB2YXIgY29tbWVudCA9IHBDb21tZW50KClcbiAgICAgICAgY29tbWVudC5oYXNCbG9jayA9IGJsb2NrICYmIGJsb2NrLmNoaWxkcmVuLmxlbmd0aFxuICAgICAgICBpZiAoIWNvbW1lbnQuaGFzQmxvY2spIHtcbiAgICAgICAgICByZXR1cm4gY29tbWVudFxuICAgICAgICB9XG4gICAgICAgIGJsb2NrLmNvbW1lbnQgPSBjb21tZW50XG4gICAgICB9XG4gICAgICBpZiAoYmxvY2spIGJsb2NrLmRpZmYgPSBkaWZmXG4gICAgICByZXR1cm4gYmxvY2tcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRvaykgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgdmFyIGxpbmUgPSBwTGluZSgpXG4gICAgICByZXR1cm4gbGluZSB8fCBcIk5MXCJcbiAgICB9XG4gIH1cblxuICAvKiAqICovXG5cbiAgZnVuY3Rpb24gcGFyc2VTY3JpcHRzKGdldExpbmUpIHtcbiAgICB2YXIgbGluZSA9IGdldExpbmUoKVxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICBsaW5lID0gZ2V0TGluZSgpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcEZpbGUoKSB7XG4gICAgICB3aGlsZSAobGluZSA9PT0gXCJOTFwiKSBuZXh0KClcbiAgICAgIHZhciBzY3JpcHRzID0gW11cbiAgICAgIHdoaWxlIChsaW5lKSB7XG4gICAgICAgIHZhciBibG9ja3MgPSBbXVxuICAgICAgICB3aGlsZSAobGluZSAmJiBsaW5lICE9PSBcIk5MXCIpIHtcbiAgICAgICAgICB2YXIgYiA9IHBMaW5lKClcbiAgICAgICAgICB2YXIgaXNHbG93ID0gYi5kaWZmID09PSBcIitcIlxuICAgICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICAgIGIuZGlmZiA9IG51bGxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYi5pc0Vsc2UgfHwgYi5pc0VuZCkge1xuICAgICAgICAgICAgYiA9IG5ldyBCbG9jayhcbiAgICAgICAgICAgICAgZXh0ZW5kKGIuaW5mbywge1xuICAgICAgICAgICAgICAgIHNoYXBlOiBcInN0YWNrXCIsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBiLmNoaWxkcmVuXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgICAgICAgaWYgKGxhc3QgJiYgbGFzdC5pc0dsb3cpIHtcbiAgICAgICAgICAgICAgYmxvY2tzLnBvcCgpXG4gICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGxhc3QuY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICAgICAgICA/IGxhc3QuY2hpbGQuYmxvY2tzXG4gICAgICAgICAgICAgICAgOiBbbGFzdC5jaGlsZF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goYilcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKG5ldyBHbG93KG5ldyBTY3JpcHQoY2hpbGRyZW4pKSlcbiAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNIYXQpIHtcbiAgICAgICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgICAgYmxvY2tzID0gW2JdXG4gICAgICAgICAgfSBlbHNlIGlmIChiLmlzRmluYWwpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0NvbW1hbmQpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHJlcG9ydGVyIG9yIHByZWRpY2F0ZVxuICAgICAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGgpIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpXG4gICAgICAgICAgICBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChbYl0pKVxuICAgICAgICAgICAgYmxvY2tzID0gW11cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICB3aGlsZSAobGluZSA9PT0gXCJOTFwiKSBuZXh0KClcbiAgICAgIH1cbiAgICAgIHJldHVybiBzY3JpcHRzXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcExpbmUoKSB7XG4gICAgICB2YXIgYiA9IGxpbmVcbiAgICAgIG5leHQoKVxuXG4gICAgICBpZiAoYi5oYXNTY3JpcHQpIHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICB2YXIgYmxvY2tzID0gcE1vdXRoKClcbiAgICAgICAgICBiLmNoaWxkcmVuLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgIGlmIChsaW5lICYmIGxpbmUuaXNFbHNlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgYi5jaGlsZHJlbi5wdXNoKGxpbmUuY2hpbGRyZW5baV0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsaW5lICYmIGxpbmUuaXNFbmQpIHtcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYlxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBNb3V0aCgpIHtcbiAgICAgIHZhciBibG9ja3MgPSBbXVxuICAgICAgd2hpbGUgKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUgPT09IFwiTkxcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsaW5lLmlzQ29tbWFuZCkge1xuICAgICAgICAgIHJldHVybiBibG9ja3NcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiID0gcExpbmUoKVxuICAgICAgICB2YXIgaXNHbG93ID0gYi5kaWZmID09PSBcIitcIlxuICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgYi5kaWZmID0gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgIHZhciBsYXN0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXVxuICAgICAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgICAgICAgaWYgKGxhc3QgJiYgbGFzdC5pc0dsb3cpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wb3AoKVxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gbGFzdC5jaGlsZC5pc1NjcmlwdFxuICAgICAgICAgICAgICA/IGxhc3QuY2hpbGQuYmxvY2tzXG4gICAgICAgICAgICAgIDogW2xhc3QuY2hpbGRdXG4gICAgICAgICAgfVxuICAgICAgICAgIGNoaWxkcmVuLnB1c2goYilcbiAgICAgICAgICBibG9ja3MucHVzaChuZXcgR2xvdyhuZXcgU2NyaXB0KGNoaWxkcmVuKSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmxvY2tzLnB1c2goYilcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJsb2Nrc1xuICAgIH1cblxuICAgIHJldHVybiBwRmlsZSgpXG4gIH1cblxuICAvKiAqICovXG5cbiAgZnVuY3Rpb24gZWFjaEJsb2NrKHgsIGNiKSB7XG4gICAgaWYgKHguaXNTY3JpcHQpIHtcbiAgICAgIHguYmxvY2tzLmZvckVhY2goZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgZWFjaEJsb2NrKGJsb2NrLCBjYilcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh4LmlzQmxvY2spIHtcbiAgICAgIGNiKHgpXG4gICAgICB4LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgZWFjaEJsb2NrKGNoaWxkLCBjYilcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh4LmlzR2xvdykge1xuICAgICAgZWFjaEJsb2NrKHguY2hpbGQsIGNiKVxuICAgIH1cbiAgfVxuXG4gIHZhciBsaXN0QmxvY2tzID0ge1xuICAgIFwiYXBwZW5kOnRvTGlzdDpcIjogMSxcbiAgICBcImRlbGV0ZUxpbmU6b2ZMaXN0OlwiOiAxLFxuICAgIFwiaW5zZXJ0OmF0Om9mTGlzdDpcIjogMixcbiAgICBcInNldExpbmU6b2ZMaXN0OnRvOlwiOiAxLFxuICAgIFwic2hvd0xpc3Q6XCI6IDAsXG4gICAgXCJoaWRlTGlzdDpcIjogMCxcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY29nbmlzZVN0dWZmKHNjcmlwdHMpIHtcbiAgICB2YXIgY3VzdG9tQmxvY2tzQnlIYXNoID0ge31cbiAgICB2YXIgbGlzdE5hbWVzID0ge31cblxuICAgIHNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHZhciBjdXN0b21BcmdzID0ge31cblxuICAgICAgZWFjaEJsb2NrKHNjcmlwdCwgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgLy8gY3VzdG9tIGJsb2Nrc1xuICAgICAgICBpZiAoYmxvY2suaW5mby5zaGFwZSA9PT0gXCJkZWZpbmUtaGF0XCIpIHtcbiAgICAgICAgICB2YXIgb3V0bGluZSA9IGJsb2NrLmNoaWxkcmVuWzFdXG4gICAgICAgICAgaWYgKCFvdXRsaW5lKSByZXR1cm5cblxuICAgICAgICAgIHZhciBuYW1lcyA9IFtdXG4gICAgICAgICAgdmFyIHBhcnRzID0gW11cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG91dGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG91dGxpbmUuY2hpbGRyZW5baV1cbiAgICAgICAgICAgIGlmIChjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzQmxvY2spIHtcbiAgICAgICAgICAgICAgaWYgKCFjaGlsZC5pbmZvLmFyZ3VtZW50KSByZXR1cm5cbiAgICAgICAgICAgICAgcGFydHMucHVzaChcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBudW1iZXI6IFwiJW5cIixcbiAgICAgICAgICAgICAgICAgIHN0cmluZzogXCIlc1wiLFxuICAgICAgICAgICAgICAgICAgYm9vbGVhbjogXCIlYlwiLFxuICAgICAgICAgICAgICAgIH1bY2hpbGQuaW5mby5hcmd1bWVudF1cbiAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGNoaWxkKVxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKG5hbWUpXG4gICAgICAgICAgICAgIGN1c3RvbUFyZ3NbbmFtZV0gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzcGVjID0gcGFydHMuam9pbihcIiBcIilcbiAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hTcGVjKHNwZWMpXG4gICAgICAgICAgdmFyIGluZm8gPSAoY3VzdG9tQmxvY2tzQnlIYXNoW2hhc2hdID0ge1xuICAgICAgICAgICAgc3BlYzogc3BlYyxcbiAgICAgICAgICAgIG5hbWVzOiBuYW1lcyxcbiAgICAgICAgICB9KVxuICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcInByb2NEZWZcIlxuICAgICAgICAgIGJsb2NrLmluZm8uY2FsbCA9IGluZm8uc3BlY1xuICAgICAgICAgIGJsb2NrLmluZm8ubmFtZXMgPSBpbmZvLm5hbWVzXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwiY3VzdG9tXCJcblxuICAgICAgICAgIC8vIGZpeCB1cCBpZi9lbHNlIHNlbGVjdG9yc1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmluZm8uc2VsZWN0b3IgPT09IFwiZG9JZkVsc2VcIikge1xuICAgICAgICAgIHZhciBsYXN0MiA9IGJsb2NrLmNoaWxkcmVuW2Jsb2NrLmNoaWxkcmVuLmxlbmd0aCAtIDJdXG4gICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9XG4gICAgICAgICAgICBsYXN0MiAmJiBsYXN0Mi5pc0xhYmVsICYmIGxhc3QyLnZhbHVlID09PSBcImVsc2VcIlxuICAgICAgICAgICAgICA/IFwiZG9JZkVsc2VcIlxuICAgICAgICAgICAgICA6IFwiZG9JZlwiXG5cbiAgICAgICAgICAvLyBjdXN0b20gYXJndW1lbnRzXG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCAmJlxuICAgICAgICAgIChibG9jay5pc1JlcG9ydGVyIHx8IGJsb2NrLmlzQm9vbGVhbilcbiAgICAgICAgKSB7XG4gICAgICAgICAgdmFyIG5hbWUgPSBibG9ja05hbWUoYmxvY2spXG4gICAgICAgICAgaWYgKGN1c3RvbUFyZ3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImN1c3RvbS1hcmdcIlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJnZXRQYXJhbVwiXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gbGlzdCBuYW1lc1xuICAgICAgICB9IGVsc2UgaWYgKGxpc3RCbG9ja3MuaGFzT3duUHJvcGVydHkoYmxvY2suaW5mby5zZWxlY3RvcikpIHtcbiAgICAgICAgICB2YXIgYXJnSW5kZXggPSBsaXN0QmxvY2tzW2Jsb2NrLmluZm8uc2VsZWN0b3JdXG4gICAgICAgICAgdmFyIGlucHV0cyA9IGJsb2NrLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgcmV0dXJuICFjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB2YXIgaW5wdXQgPSBpbnB1dHNbYXJnSW5kZXhdXG4gICAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LmlzSW5wdXQpIHtcbiAgICAgICAgICAgIGxpc3ROYW1lc1tpbnB1dC52YWx1ZV0gPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICBlYWNoQmxvY2soc2NyaXB0LCBmdW5jdGlvbihibG9jaykge1xuICAgICAgICAvLyBjdXN0b20gYmxvY2tzXG4gICAgICAgIGlmIChcbiAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ICYmXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJvYnNvbGV0ZVwiXG4gICAgICAgICkge1xuICAgICAgICAgIHZhciBpbmZvID0gY3VzdG9tQmxvY2tzQnlIYXNoW2Jsb2NrLmluZm8uaGFzaF1cbiAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwiY2FsbFwiXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhbGwgPSBpbmZvLnNwZWNcbiAgICAgICAgICAgIGJsb2NrLmluZm8ubmFtZXMgPSBpbmZvLm5hbWVzXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJjdXN0b21cIlxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGxpc3QgcmVwb3J0ZXJzXG4gICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaXNSZXBvcnRlcikge1xuICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGJsb2NrKVxuICAgICAgICAgIGlmICghbmFtZSkgcmV0dXJuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJ2YXJpYWJsZXNcIiAmJlxuICAgICAgICAgICAgbGlzdE5hbWVzW25hbWVdICYmXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJsaXN0XCJcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJsaXN0XCIpIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcImNvbnRlbnRzT2ZMaXN0OlwiXG4gICAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLmNhdGVnb3J5ID09PSBcInZhcmlhYmxlc1wiKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJyZWFkVmFyaWFibGVcIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2UoY29kZSwgb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICBsYW5ndWFnZXM6IFtcImVuXCJdLFxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoLyZndDsvZywgXCI+XCIpXG4gICAgaWYgKG9wdGlvbnMuaW5saW5lKSB7XG4gICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXG4vZywgXCIgXCIpXG4gICAgfVxuXG4gICAgdmFyIGxhbmd1YWdlcyA9IG9wdGlvbnMubGFuZ3VhZ2VzLm1hcChmdW5jdGlvbihjb2RlKSB7XG4gICAgICByZXR1cm4gYWxsTGFuZ3VhZ2VzW2NvZGVdXG4gICAgfSlcblxuICAgIC8qICogKi9cblxuICAgIHZhciBmID0gcGFyc2VMaW5lcyhjb2RlLCBsYW5ndWFnZXMpXG4gICAgdmFyIHNjcmlwdHMgPSBwYXJzZVNjcmlwdHMoZilcbiAgICByZWNvZ25pc2VTdHVmZihzY3JpcHRzKVxuICAgIHJldHVybiBuZXcgRG9jdW1lbnQoc2NyaXB0cylcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGFyc2U6IHBhcnNlLFxuICB9XG59KSgpXG4iXX0=
