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
      "say %s for %n secs": "say %s for %n seconds",
      "think %s for %n secs": "say %s for %n seconds",
      "wait %n secs": "wait %n seconds",
      "turn %m.motor on for %n secs": "turn %m.motor on for %n seconds"
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

  roundedPath(w, h) {
    var r = h / 2
    return [
      "M",
      r,
      0,
      SVG.arc(w - r, 0, w - r, h, r, r),
      SVG.arc(r, h, r, 0, r, r),
      "Z",
    ]
  },
  
  roundedPath2(w, h) {
    var r = (h / 2)
    return [
      "M",
      r,
      0,
      SVG.arc(w - r, 0, w - r, h, r, r),
      SVG.arc(r, h, r, 0, r, r),
      "Z",
    ]
  },

  roundedRect(w, h, props) {
    return SVG.path(
      extend(props, {
        path: SVG.roundedPath(w, h),
      })
    )
  },
  
  roundedRect2(w, h, props) {
    return SVG.path(
      extend(props, {
        path: SVG.roundedPath2(w, h),
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
      "L", 15, armTop - 4,
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
        SVG.arc(0, 10, 60, 10, 60, 80),
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
    var p = [SVG.getTop(w), SVG.getRightAndBottom(w, y, true, 15)]
    for (var i = 1; i < lines.length; i += 2) {
      var isLast = i + 2 === lines.length

      y += lines[i].height - 3
      p.push(SVG.getArm(w, y))

      var hasNotch = !(isLast && isFinal)
      var inset = isLast ? 0 : 15
      y += lines[i + 1].height + 3
      p.push(SVG.getRightAndBottom(w, y, hasNotch, inset))
      p.push("Z")
    }
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
        ? SVG.roundedPath
        : shape === "boolean"
          ? SVG.pointedPath
          : cw < 40 ? SVG.ringCapPath : SVG.capPath
    return SVG.path(
      extend(props, {
        path: [
          "M",
          r,
          0,
          SVG.arcw(r, 0, 0, r, r, r),
          SVG.arcw(0, h - r, r, h, r, r),
          SVG.arcw(w - r, h, w, h - r, r, r),
          SVG.arcw(w, r, w - r, 0, r, r),
          "Z",
          SVG.translatePath(4, cy || 4, func(cw, ch).join(" ")),
        ],
        "fill-rule": "even-odd",
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
    this.height = 12
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
        ? "normal 12px 'Helvetica Neue', Helvetica, sans-serif"
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
    var width = (textMetrics.width + 0.5) | 0
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
    greenFlag: { width: 5, height: 5, dy: -8, dx: +0 }, ///working on this
    turnLeft: { width: 15, height: 12, dy: +1 },
    turnRight: { width: 15, height: 12, dy: +1 },
    loopArrow: { width: 14, height: 11 },
    addInput: { width: 4, height: 8 },
    delInput: { width: 4, height: 8 },
  }
  Icon.prototype.draw = function() {
    return SVG.symbol("#" + this.name, {
      width: this.width,
      height: this.height,
    })
  }

  /* Input */

  var Input = function(shape, value, menu) {
    this.shape = shape
    this.value = value
    this.menu = menu || null

    this.isRound = shape === "number" || shape === "number-dropdown"
    this.isBoolean = shape === "boolean"
    this.isStack = shape === "stack"
    this.isInset =
      shape === "boolean" || shape === "stack" || shape === "reporter"
    this.isColor = shape === "color"
    this.hasArrow = shape === "dropdown" || shape === "number-dropdown" || shape === "round-dropdown"
    this.isDarker =
      shape === "boolean" || shape === "stack" || shape === "dropdown"
    this.isSquare =
      shape === "string" || shape === "color" || shape === "dropdown"

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
    string: SVG.roundedRect2,
    number: SVG.roundedRect2,
    "number-dropdown": SVG.roundedRect2,
    color: SVG.roundedRect2,
    dropdown: SVG.rect,

    boolean: SVG.pointedRect,
    stack: SVG.stackRect,
    reporter: SVG.roundedRect,
  }

  Input.prototype.draw = function(parent) {
    if (this.hasLabel) {
      var label = this.label.draw()
      var w = Math.max(
        14,
        this.label.width +
          (this.shape === "string" || this.shape === "number-dropdown" ? 6 : 9)
      )
    } else {
      var w = this.isInset ? 30 : this.isColor ? 13 : null
    }
    if (this.hasArrow) w += 10
    this.width = w

    var h = (this.height = this.isRound || this.isColor ? 13 : 14)

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
      var x = this.isRound ? 5 : 4
      result.appendChild(SVG.move(x, 0, label))
    }
    if (this.hasArrow) {
      var y = this.shape === "dropdown" ? 5 : 4
      result.appendChild(
        SVG.move(
          w - 10,
          y,
          SVG.polygon({
            points: [7, 0, 3.5, 4, 0, 0],
            fill: "#FFF",
            opacity: "0.6",
          })
        )
      )
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
    reporter: SVG.roundedRect,
    boolean: SVG.pointedRect,
    hat: SVG.hatRect,
    "define-hat": SVG.procHatRect,
    ring: SVG.roundedRect,
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
        ? 0
        : child.isLabel
          ? (2 + child.height / 2) | 0
          : (-2 + child.height / 2) | 0
    }
    return 0
  }

  Block.padding = {
    hat: [20, 6, 8],
    "define-hat": [20, 8, 10],
    reporter: [5, 3, 2],
    boolean: [5, 2, 2],
    cap: [11, 6, 6],
    "c-block": [8, 6, 5],
    "if-block": [8, 6, 5],
    ring: [10, 4, 10],
    null: [11, 6, 6],
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
      this.height = y ? 13 : 16
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

    var lines = []
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      child.el = child.draw(this)

      if (child.isScript && this.isCommand) {
        this.hasScript = true
        pushLine()
        child.y = y
        lines.push(child)
        scriptWidth = Math.max(scriptWidth, Math.max(1, child.width))
        child.height = Math.max(12, child.height) + 3
        y += child.height
        line = new Line(y)
      } else if (child.isArrow) {
        line.children.push(child)
      } else {
        var cmw = i > 0 ? 30 : 0 // 27
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
        line.width += 4
        if (!child.isLabel) {
          line.height = Math.max(line.height, child.height)
        }
        line.children.push(child)
      }
    }
    pushLine(true)

    innerWidth = Math.max(
      innerWidth + px * 2,
      this.isHat || this.hasScript
        ? 83
        : this.isCommand || this.isOutline || this.isRing ? 39 : 20
    )
    this.height = y
    this.width = scriptWidth
      ? Math.max(innerWidth, 15 + scriptWidth)
      : innerWidth
    if (isDefine) {
      var p = Math.min(26, (3.5 + 0.13 * innerWidth) | 0) - 18
      this.height += p
      pt += 2 * p
    }
    this.firstLine = lines[0]
    this.innerWidth = innerWidth

    var objects = []

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]
      if (line.isScript) {
        objects.push(SVG.move(15, line.y, line.el))
        continue
      }

      var h = line.height

      for (var j = 0; j < line.children.length; j++) {
        var child = line.children[j]
        if (child.isArrow) {
          objects.push(SVG.move(innerWidth - 15, this.height - 3, child.el))
          continue
        }

        var y = pt + (h - child.height - pt - pb) / 2 - 1
        if (isDefine && child.isLabel) {
          y += 3
        } else if (child.isIcon) {
          y += child.dy | 0
        }
        if (this.isRing) {
          child.y = (line.y + y) | 0
          if (child.isInset) {
            continue
          }
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
  Comment.lineLength = 12
  Comment.prototype.height = 20

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
      SVG.move(8, 4, labelEl),
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
      this.height += 3
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
      opacity: 0.9;
    }

    .sb-obsolete { fill: #d42828; }
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
    .sb-grey { fill: #969696; }

    .sb-bevel {
      filter2: url(#bevelFilter);
      stroke: #000;
      stroke-opacity: 0.15;
      stroke-alignment: inner;
    }
    .sb-literal-round-dropdown,
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
      fill: #000;
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
      fill: #ffffa5;
      stroke: #d0d1d2;
      stroke-width: 1;
    }
    .sb-comment-line {
      fill: #ffff80;
    }
    .sb-comment-label {
      font-family: Helevetica, Arial, DejaVu Sans, sans-serif;
      font-weight: bold;
      fill: #5c5d5f;
      word-spacing: 0;
      font-size: 12px;
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
          transform: "scale(0.65) translate(-12 4)", // TODO
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
          transform: "scale(0.65) translate(-8 -5)", // TODO
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
          transform: "scale(0.65) translate(-5 -5)", // TODO
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
          transform: "scale(0.65) translate(-5 -20)", // TODO
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
        f.flood("#000", 0.7),
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

  defaultFontFamily: "Lucida Grande, Verdana, Arial, DejaVu Sans, sans-serif",
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
        if (tok === "v" && peek() === ")") {
          next()
          next()
          return new Input("number-dropdown", "")
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
        if (i > 1 && last.value === "v") {
          children.pop()
          var value = children
            .map(function(l) {
              return l.value
            })
            .join(" ")
          return makeMenu("number-dropdown", value)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5aEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImZ1bmN0aW9uIG1ha2VDYW52YXMoKSB7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG59XG5cbnZhciBzY3JhdGNoYmxvY2tzID0gKHdpbmRvdy5zY3JhdGNoYmxvY2tzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvXCIpKFxuICB3aW5kb3csXG4gIG1ha2VDYW52YXNcbikpXG5cbi8vIGFkZCBvdXIgQ1NTIHRvIHRoZSBwYWdlXG52YXIgc3R5bGUgPSBzY3JhdGNoYmxvY2tzLm1ha2VTdHlsZSgpXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbiAgfVxuICBmdW5jdGlvbiBpc0FycmF5KG8pIHtcbiAgICByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheVxuICB9XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgLy8gTGlzdCBvZiBjbGFzc2VzIHdlJ3JlIGFsbG93ZWQgdG8gb3ZlcnJpZGUuXG5cbiAgdmFyIG92ZXJyaWRlQ2F0ZWdvcmllcyA9IFtcbiAgICBcIm1vdGlvblwiLFxuICAgIFwibG9va3NcIixcbiAgICBcInNvdW5kXCIsXG4gICAgXCJwZW5cIixcbiAgICBcInZhcmlhYmxlc1wiLFxuICAgIFwibGlzdFwiLFxuICAgIFwiZXZlbnRzXCIsXG4gICAgXCJjb250cm9sXCIsXG4gICAgXCJzZW5zaW5nXCIsXG4gICAgXCJvcGVyYXRvcnNcIixcbiAgICBcImN1c3RvbVwiLFxuICAgIFwiY3VzdG9tLWFyZ1wiLFxuICAgIFwiZXh0ZW5zaW9uXCIsXG4gICAgXCJncmV5XCIsXG4gICAgXCJvYnNvbGV0ZVwiLFxuICBdXG4gIHZhciBvdmVycmlkZVNoYXBlcyA9IFtcImhhdFwiLCBcImNhcFwiLCBcInN0YWNrXCIsIFwiYm9vbGVhblwiLCBcInJlcG9ydGVyXCIsIFwicmluZ1wiXVxuXG4gIC8vIGxhbmd1YWdlcyB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgcmlnaHQgdG8gbGVmdFxuICB2YXIgcnRsTGFuZ3VhZ2VzID0gW1wiYXJcIiwgXCJmYVwiLCBcImhlXCJdXG5cbiAgLy8gTGlzdCBvZiBjb21tYW5kcyB0YWtlbiBmcm9tIFNjcmF0Y2hcbiAgdmFyIHNjcmF0Y2hDb21tYW5kcyA9IHJlcXVpcmUoXCIuL2NvbW1hbmRzLmpzXCIpXG5cbiAgdmFyIGNhdGVnb3JpZXNCeUlkID0ge1xuICAgIDA6IFwib2Jzb2xldGVcIixcbiAgICAxOiBcIm1vdGlvblwiLFxuICAgIDI6IFwibG9va3NcIixcbiAgICAzOiBcInNvdW5kXCIsXG4gICAgNDogXCJwZW5cIixcbiAgICA1OiBcImV2ZW50c1wiLFxuICAgIDY6IFwiY29udHJvbFwiLFxuICAgIDc6IFwic2Vuc2luZ1wiLFxuICAgIDg6IFwib3BlcmF0b3JzXCIsXG4gICAgOTogXCJ2YXJpYWJsZXNcIixcbiAgICAxMDogXCJjdXN0b21cIixcbiAgICAxMTogXCJwYXJhbWV0ZXJcIixcbiAgICAxMjogXCJsaXN0XCIsXG4gICAgMjA6IFwiZXh0ZW5zaW9uXCIsXG4gICAgNDI6IFwiZ3JleVwiLFxuICB9XG5cbiAgdmFyIHR5cGVTaGFwZXMgPSB7XG4gICAgXCIgXCI6IFwic3RhY2tcIixcbiAgICBiOiBcImJvb2xlYW5cIixcbiAgICBjOiBcImMtYmxvY2tcIixcbiAgICBlOiBcImlmLWJsb2NrXCIsXG4gICAgZjogXCJjYXBcIixcbiAgICBoOiBcImhhdFwiLFxuICAgIHI6IFwicmVwb3J0ZXJcIixcbiAgICBjZjogXCJjLWJsb2NrIGNhcFwiLFxuICAgIGVsc2U6IFwiY2Vsc2VcIixcbiAgICBlbmQ6IFwiY2VuZFwiLFxuICAgIHJpbmc6IFwicmluZ1wiLFxuICB9XG5cbiAgdmFyIGlucHV0UGF0ID0gLyglW2EtekEtWl0oPzpcXC5bYS16QS1aMC05XSspPykvXG4gIHZhciBpbnB1dFBhdEdsb2JhbCA9IG5ldyBSZWdFeHAoaW5wdXRQYXQuc291cmNlLCBcImdcIilcbiAgdmFyIGljb25QYXQgPSAvKEBbYS16QS1aXSspL1xuICB2YXIgc3BsaXRQYXQgPSBuZXcgUmVnRXhwKFxuICAgIFtpbnB1dFBhdC5zb3VyY2UsIFwifFwiLCBpY29uUGF0LnNvdXJjZSwgXCJ8ICtcIl0uam9pbihcIlwiKSxcbiAgICBcImdcIlxuICApXG5cbiAgdmFyIGhleENvbG9yUGF0ID0gL14jKD86WzAtOWEtZkEtRl17M30pezEsMn0/JC9cblxuICBmdW5jdGlvbiBwYXJzZVNwZWMoc3BlYykge1xuICAgIHZhciBwYXJ0cyA9IHNwZWMuc3BsaXQoc3BsaXRQYXQpLmZpbHRlcih4ID0+ICEheClcbiAgICByZXR1cm4ge1xuICAgICAgc3BlYzogc3BlYyxcbiAgICAgIHBhcnRzOiBwYXJ0cyxcbiAgICAgIGlucHV0czogcGFydHMuZmlsdGVyKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0UGF0LnRlc3QocClcbiAgICAgIH0pLFxuICAgICAgaGFzaDogaGFzaFNwZWMoc3BlYyksXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFzaFNwZWMoc3BlYykge1xuICAgIHJldHVybiBtaW5pZnlIYXNoKHNwZWMucmVwbGFjZShpbnB1dFBhdEdsb2JhbCwgXCIgXyBcIikpXG4gIH1cblxuICBmdW5jdGlvbiBtaW5pZnlIYXNoKGhhc2gpIHtcbiAgICByZXR1cm4gaGFzaFxuICAgICAgLnJlcGxhY2UoL18vZywgXCIgXyBcIilcbiAgICAgIC5yZXBsYWNlKC8gKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9bLCU/Ol0vZywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC/Dny9nLCBcInNzXCIpXG4gICAgICAucmVwbGFjZSgvw6QvZywgXCJhXCIpXG4gICAgICAucmVwbGFjZSgvw7YvZywgXCJvXCIpXG4gICAgICAucmVwbGFjZSgvw7wvZywgXCJ1XCIpXG4gICAgICAucmVwbGFjZShcIi4gLiAuXCIsIFwiLi4uXCIpXG4gICAgICAucmVwbGFjZSgvXuKApiQvLCBcIi4uLlwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIHZhciBibG9ja3NCeVNlbGVjdG9yID0ge31cbiAgdmFyIGJsb2Nrc0J5U3BlYyA9IHt9XG4gIHZhciBhbGxCbG9ja3MgPSBzY3JhdGNoQ29tbWFuZHMubWFwKGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICB2YXIgaW5mbyA9IGV4dGVuZChwYXJzZVNwZWMoY29tbWFuZFswXSksIHtcbiAgICAgIHNoYXBlOiB0eXBlU2hhcGVzW2NvbW1hbmRbMV1dLCAvLyAvWyBiY2VmaHJdfGNmL1xuICAgICAgY2F0ZWdvcnk6IGNhdGVnb3JpZXNCeUlkW2NvbW1hbmRbMl0gJSAxMDBdLFxuICAgICAgc2VsZWN0b3I6IGNvbW1hbmRbM10sXG4gICAgICBoYXNMb29wQXJyb3c6XG4gICAgICAgIFtcImRvUmVwZWF0XCIsIFwiZG9VbnRpbFwiLCBcImRvRm9yZXZlclwiXS5pbmRleE9mKGNvbW1hbmRbM10pID4gLTEsXG4gICAgfSlcbiAgICBpZiAoaW5mby5zZWxlY3Rvcikge1xuICAgICAgLy8gbmIuIGNvbW1hbmQgb3JkZXIgbWF0dGVycyFcbiAgICAgIC8vIFNjcmF0Y2ggMS40IGJsb2NrcyBhcmUgbGlzdGVkIGxhc3RcbiAgICAgIGlmICghYmxvY2tzQnlTZWxlY3RvcltpbmZvLnNlbGVjdG9yXSlcbiAgICAgICAgYmxvY2tzQnlTZWxlY3RvcltpbmZvLnNlbGVjdG9yXSA9IGluZm9cbiAgICB9XG4gICAgcmV0dXJuIChibG9ja3NCeVNwZWNbaW5mby5zcGVjXSA9IGluZm8pXG4gIH0pXG5cbiAgdmFyIHVuaWNvZGVJY29ucyA9IHtcbiAgICBcIkBncmVlbkZsYWdcIjogXCLimpFcIixcbiAgICBcIkB0dXJuUmlnaHRcIjogXCLihrtcIixcbiAgICBcIkB0dXJuTGVmdFwiOiBcIuKGulwiLFxuICAgIFwiQGFkZElucHV0XCI6IFwi4pa4XCIsXG4gICAgXCJAZGVsSW5wdXRcIjogXCLil4JcIixcbiAgfVxuXG4gIHZhciBhbGxMYW5ndWFnZXMgPSB7fVxuICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2UpIHtcbiAgICB2YXIgYmxvY2tzQnlIYXNoID0gKGxhbmd1YWdlLmJsb2Nrc0J5SGFzaCA9IHt9KVxuXG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuY29tbWFuZHMpLmZvckVhY2goZnVuY3Rpb24oc3BlYykge1xuICAgICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5ndWFnZS5jb21tYW5kc1tzcGVjXVxuICAgICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTcGVjW3NwZWNdXG5cbiAgICAgIHZhciBuYXRpdmVIYXNoID0gaGFzaFNwZWMobmF0aXZlU3BlYylcbiAgICAgIGJsb2Nrc0J5SGFzaFtuYXRpdmVIYXNoXSA9IGJsb2NrXG5cbiAgICAgIC8vIGZhbGxiYWNrIGltYWdlIHJlcGxhY2VtZW50LCBmb3IgbGFuZ3VhZ2VzIHdpdGhvdXQgYWxpYXNlc1xuICAgICAgdmFyIG0gPSBpY29uUGF0LmV4ZWMoc3BlYylcbiAgICAgIGlmIChtKSB7XG4gICAgICAgIHZhciBpbWFnZSA9IG1bMF1cbiAgICAgICAgdmFyIGhhc2ggPSBuYXRpdmVIYXNoLnJlcGxhY2UoaW1hZ2UsIHVuaWNvZGVJY29uc1tpbWFnZV0pXG4gICAgICAgIGJsb2Nrc0J5SGFzaFtoYXNoXSA9IGJsb2NrXG4gICAgICB9XG4gICAgfSlcblxuICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXMgPSB7fVxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmFsaWFzZXMpLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpIHtcbiAgICAgIHZhciBzcGVjID0gbGFuZ3VhZ2UuYWxpYXNlc1thbGlhc11cbiAgICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U3BlY1tzcGVjXVxuXG4gICAgICB2YXIgYWxpYXNIYXNoID0gaGFzaFNwZWMoYWxpYXMpXG4gICAgICBibG9ja3NCeUhhc2hbYWxpYXNIYXNoXSA9IGJsb2NrXG5cbiAgICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXNbc3BlY10gPSBhbGlhc1xuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5uYXRpdmVEcm9wZG93bnMgPSB7fVxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmRyb3Bkb3ducykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgbmF0aXZlTmFtZSA9IGxhbmd1YWdlLmRyb3Bkb3duc1tuYW1lXVxuICAgICAgbGFuZ3VhZ2UubmF0aXZlRHJvcGRvd25zW25hdGl2ZU5hbWVdID0gbmFtZVxuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5jb2RlID0gY29kZVxuICAgIGFsbExhbmd1YWdlc1tjb2RlXSA9IGxhbmd1YWdlXG4gIH1cbiAgZnVuY3Rpb24gbG9hZExhbmd1YWdlcyhsYW5ndWFnZXMpIHtcbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZXMpLmZvckVhY2goZnVuY3Rpb24oY29kZSkge1xuICAgICAgbG9hZExhbmd1YWdlKGNvZGUsIGxhbmd1YWdlc1tjb2RlXSlcbiAgICB9KVxuICB9XG5cbiAgdmFyIGVuZ2xpc2ggPSB7XG4gICAgYWxpYXNlczoge1xuICAgICAgXCJ0dXJuIGxlZnQgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjY3cgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiByaWdodCAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjdyAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwid2hlbiBnZiBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICAgIFwid2hlbiBmbGFnIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgICAgXCJ3aGVuIGdyZWVuIGZsYWcgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgICBcImNsZWFyXCI6IFwiZXJhc2UgYWxsXCIsXG4gICAgICBcInNheSAlcyBmb3IgJW4gc2Vjc1wiOiBcInNheSAlcyBmb3IgJW4gc2Vjb25kc1wiLFxuICAgICAgXCJ0aGluayAlcyBmb3IgJW4gc2Vjc1wiOiBcInNheSAlcyBmb3IgJW4gc2Vjb25kc1wiLFxuICAgICAgXCJ3YWl0ICVuIHNlY3NcIjogXCJ3YWl0ICVuIHNlY29uZHNcIixcbiAgICAgIFwidHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjc1wiOiBcInR1cm4gJW0ubW90b3Igb24gZm9yICVuIHNlY29uZHNcIlxuICAgIH0sXG5cbiAgICBkZWZpbmU6IFtcImRlZmluZVwiXSxcblxuICAgIC8vIEZvciBpZ25vcmluZyB0aGUgbHQgc2lnbiBpbiB0aGUgXCJ3aGVuIGRpc3RhbmNlIDwgX1wiIGJsb2NrXG4gICAgaWdub3JlbHQ6IFtcIndoZW4gZGlzdGFuY2VcIl0sXG5cbiAgICAvLyBWYWxpZCBhcmd1bWVudHMgdG8gXCJvZlwiIGRyb3Bkb3duLCBmb3IgcmVzb2x2aW5nIGFtYmlndW91cyBzaXR1YXRpb25zXG4gICAgbWF0aDogW1xuICAgICAgXCJhYnNcIixcbiAgICAgIFwiZmxvb3JcIixcbiAgICAgIFwiY2VpbGluZ1wiLFxuICAgICAgXCJzcXJ0XCIsXG4gICAgICBcInNpblwiLFxuICAgICAgXCJjb3NcIixcbiAgICAgIFwidGFuXCIsXG4gICAgICBcImFzaW5cIixcbiAgICAgIFwiYWNvc1wiLFxuICAgICAgXCJhdGFuXCIsXG4gICAgICBcImxuXCIsXG4gICAgICBcImxvZ1wiLFxuICAgICAgXCJlIF5cIixcbiAgICAgIFwiMTAgXlwiLFxuICAgIF0sXG5cbiAgICAvLyBGb3IgZGV0ZWN0aW5nIHRoZSBcInN0b3BcIiBjYXAgLyBzdGFjayBibG9ja1xuICAgIG9zaXM6IFtcIm90aGVyIHNjcmlwdHMgaW4gc3ByaXRlXCIsIFwib3RoZXIgc2NyaXB0cyBpbiBzdGFnZVwiXSxcblxuICAgIGRyb3Bkb3duczoge30sXG5cbiAgICBjb21tYW5kczoge30sXG4gIH1cbiAgYWxsQmxvY2tzLmZvckVhY2goZnVuY3Rpb24oaW5mbykge1xuICAgIGVuZ2xpc2guY29tbWFuZHNbaW5mby5zcGVjXSA9IGluZm8uc3BlY1xuICB9KSxcbiAgICBsb2FkTGFuZ3VhZ2VzKHtcbiAgICAgIGVuOiBlbmdsaXNoLFxuICAgIH0pXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIGZ1bmN0aW9uIGRpc2FtYmlnKHNlbGVjdG9yMSwgc2VsZWN0b3IyLCB0ZXN0KSB7XG4gICAgdmFyIGZ1bmMgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgbGFuZykge1xuICAgICAgcmV0dXJuIGJsb2Nrc0J5U2VsZWN0b3JbdGVzdChjaGlsZHJlbiwgbGFuZykgPyBzZWxlY3RvcjEgOiBzZWxlY3RvcjJdXG4gICAgfVxuICAgIGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3IxXS5zcGVjaWFsQ2FzZSA9IGJsb2Nrc0J5U2VsZWN0b3JbXG4gICAgICBzZWxlY3RvcjJcbiAgICBdLnNwZWNpYWxDYXNlID0gZnVuY1xuICB9XG5cbiAgZGlzYW1iaWcoXCJjb21wdXRlRnVuY3Rpb246b2Y6XCIsIFwiZ2V0QXR0cmlidXRlOm9mOlwiLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIE9wZXJhdG9ycyBpZiBtYXRoIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2Vuc2luZyBcImF0dHJpYnV0ZSBvZlwiIGJsb2NrXG4gICAgdmFyIGZpcnN0ID0gY2hpbGRyZW5bMF1cbiAgICBpZiAoIWZpcnN0LmlzSW5wdXQpIHJldHVyblxuICAgIHZhciBuYW1lID0gZmlyc3QudmFsdWVcbiAgICByZXR1cm4gbGFuZy5tYXRoLmluZGV4T2YobmFtZSkgPiAtMVxuICB9KVxuXG4gIGRpc2FtYmlnKFwibGluZUNvdW50T2ZMaXN0OlwiLCBcInN0cmluZ0xlbmd0aDpcIiwgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBMaXN0IGJsb2NrIGlmIGRyb3Bkb3duLCBvdGhlcndpc2Ugb3BlcmF0b3JzXG4gICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgIGlmICghbGFzdC5pc0lucHV0KSByZXR1cm5cbiAgICByZXR1cm4gbGFzdC5zaGFwZSA9PT0gXCJkcm9wZG93blwiXG4gIH0pXG5cbiAgZGlzYW1iaWcoXCJwZW5Db2xvcjpcIiwgXCJzZXRQZW5IdWVUbzpcIiwgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBDb2xvciBibG9jayBpZiBjb2xvciBpbnB1dCwgb3RoZXJ3aXNlIG51bWVyaWNcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgLy8gSWYgdmFyaWFibGUsIGFzc3VtZSBjb2xvciBpbnB1dCwgc2luY2UgdGhlIFJHQkEgaGFjayBpcyBjb21tb24uXG4gICAgLy8gVE9ETyBmaXggU2NyYXRjaCA6UFxuICAgIHJldHVybiAobGFzdC5pc0lucHV0ICYmIGxhc3QuaXNDb2xvcikgfHwgbGFzdC5pc0Jsb2NrXG4gIH0pXG5cbiAgYmxvY2tzQnlTZWxlY3RvcltcInN0b3BTY3JpcHRzXCJdLnNwZWNpYWxDYXNlID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBDYXAgYmxvY2sgdW5sZXNzIGFyZ3VtZW50IGlzIFwib3RoZXIgc2NyaXB0cyBpbiBzcHJpdGVcIlxuICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICBpZiAoIWxhc3QuaXNJbnB1dCkgcmV0dXJuXG4gICAgdmFyIHZhbHVlID0gbGFzdC52YWx1ZVxuICAgIGlmIChsYW5nLm9zaXMuaW5kZXhPZih2YWx1ZSkgPiAtMSkge1xuICAgICAgcmV0dXJuIGV4dGVuZChibG9ja3NCeVNlbGVjdG9yW1wic3RvcFNjcmlwdHNcIl0sIHtcbiAgICAgICAgc2hhcGU6IFwic3RhY2tcIixcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9va3VwSGFzaChoYXNoLCBpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYW5ndWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsYW5nID0gbGFuZ3VhZ2VzW2ldXG4gICAgICBpZiAobGFuZy5ibG9ja3NCeUhhc2guaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgdmFyIGJsb2NrID0gbGFuZy5ibG9ja3NCeUhhc2hbaGFzaF1cbiAgICAgICAgaWYgKGluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiBibG9jay5zaGFwZSAhPT0gXCJyZXBvcnRlclwiKSBjb250aW51ZVxuICAgICAgICBpZiAoaW5mby5zaGFwZSA9PT0gXCJib29sZWFuXCIgJiYgYmxvY2suc2hhcGUgIT09IFwiYm9vbGVhblwiKSBjb250aW51ZVxuICAgICAgICBpZiAoYmxvY2suc3BlY2lhbENhc2UpIHtcbiAgICAgICAgICBibG9jayA9IGJsb2NrLnNwZWNpYWxDYXNlKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB8fCBibG9ja1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IGJsb2NrLCBsYW5nOiBsYW5nIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBEcm9wZG93bihuYW1lLCBsYW5ndWFnZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxhbmcgPSBsYW5ndWFnZXNbaV1cbiAgICAgIGlmIChsYW5nLm5hdGl2ZURyb3Bkb3ducy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICB2YXIgbmF0aXZlTmFtZSA9IGxhbmcubmF0aXZlRHJvcGRvd25zW25hbWVdXG4gICAgICAgIHJldHVybiBuYXRpdmVOYW1lXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlPdmVycmlkZXMoaW5mbywgb3ZlcnJpZGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdmVycmlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuYW1lID0gb3ZlcnJpZGVzW2ldXG4gICAgICBpZiAoaGV4Q29sb3JQYXQudGVzdChuYW1lKSkge1xuICAgICAgICBpbmZvLmNvbG9yID0gbmFtZVxuICAgICAgICBpbmZvLmNhdGVnb3J5ID0gXCJcIlxuICAgICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAob3ZlcnJpZGVDYXRlZ29yaWVzLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgICBpbmZvLmNhdGVnb3J5ID0gbmFtZVxuICAgICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAob3ZlcnJpZGVTaGFwZXMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIGluZm8uc2hhcGUgPSBuYW1lXG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwibG9vcFwiKSB7XG4gICAgICAgIGluZm8uaGFzTG9vcEFycm93ID0gdHJ1ZVxuICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcIitcIiB8fCBuYW1lID09PSBcIi1cIikge1xuICAgICAgICBpbmZvLmRpZmYgPSBuYW1lXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYmxvY2tOYW1lKGJsb2NrKSB7XG4gICAgdmFyIHdvcmRzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJsb2NrLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBibG9jay5jaGlsZHJlbltpXVxuICAgICAgaWYgKCFjaGlsZC5pc0xhYmVsKSByZXR1cm5cbiAgICAgIHdvcmRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB3b3Jkcy5qb2luKFwiIFwiKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsb2FkTGFuZ3VhZ2VzLFxuXG4gICAgYmxvY2tOYW1lLFxuXG4gICAgYWxsTGFuZ3VhZ2VzLFxuICAgIGxvb2t1cERyb3Bkb3duLFxuICAgIGhleENvbG9yUGF0LFxuICAgIG1pbmlmeUhhc2gsXG4gICAgbG9va3VwSGFzaCxcbiAgICBhcHBseU92ZXJyaWRlcyxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgaWNvblBhdCxcbiAgICBoYXNoU3BlYyxcblxuICAgIGJsb2Nrc0J5U2VsZWN0b3IsXG4gICAgcGFyc2VTcGVjLFxuICAgIGlucHV0UGF0LFxuICAgIHVuaWNvZGVJY29ucyxcbiAgICBlbmdsaXNoLFxuICB9XG59KSgpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgW1wibW92ZSAlbiBzdGVwc1wiLCBcIiBcIiwgMSwgXCJmb3J3YXJkOlwiXSxcbiAgW1widHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIiwgXCIgXCIsIDEsIFwidHVyblJpZ2h0OlwiXSxcbiAgW1widHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLCBcIiBcIiwgMSwgXCJ0dXJuTGVmdDpcIl0sXG4gIFtcInBvaW50IGluIGRpcmVjdGlvbiAlZC5kaXJlY3Rpb25cIiwgXCIgXCIsIDEsIFwiaGVhZGluZzpcIl0sXG4gIFtcInBvaW50IHRvd2FyZHMgJW0uc3ByaXRlT3JNb3VzZVwiLCBcIiBcIiwgMSwgXCJwb2ludFRvd2FyZHM6XCJdLFxuICBbXCJnbyB0byB4OiVuIHk6JW5cIiwgXCIgXCIsIDEsIFwiZ290b1g6eTpcIl0sXG4gIFtcImdvIHRvICVyLmxvY2F0aW9uXCIsIFwiIFwiLCAxLCBcImdvdG9TcHJpdGVPck1vdXNlOlwiXSxcbiAgW1wiZ2xpZGUgJW4gc2VjcyB0byB4OiVuIHk6JW5cIiwgXCIgXCIsIDEsIFwiZ2xpZGVTZWNzOnRvWDp5OmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcImNoYW5nZSB4IGJ5ICVuXCIsIFwiIFwiLCAxLCBcImNoYW5nZVhwb3NCeTpcIl0sXG4gIFtcInNldCB4IHRvICVuXCIsIFwiIFwiLCAxLCBcInhwb3M6XCJdLFxuICBbXCJjaGFuZ2UgeSBieSAlblwiLCBcIiBcIiwgMSwgXCJjaGFuZ2VZcG9zQnk6XCJdLFxuICBbXCJzZXQgeSB0byAlblwiLCBcIiBcIiwgMSwgXCJ5cG9zOlwiXSxcbiAgW1wic2V0IHJvdGF0aW9uIHN0eWxlICVtLnJvdGF0aW9uU3R5bGVcIiwgXCIgXCIsIDEsIFwic2V0Um90YXRpb25TdHlsZVwiXSxcbiAgW1wic2F5ICVzIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyLCBcInNheTpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJzYXkgJXNcIiwgXCIgXCIsIDIsIFwic2F5OlwiXSxcbiAgW1widGhpbmsgJXMgZm9yICVuIHNlY3NcIiwgXCIgXCIsIDIsIFwidGhpbms6ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1widGhpbmsgJXNcIiwgXCIgXCIsIDIsIFwidGhpbms6XCJdLFxuICBbXCJzaG93XCIsIFwiIFwiLCAyLCBcInNob3dcIl0sXG4gIFtcImhpZGVcIiwgXCIgXCIsIDIsIFwiaGlkZVwiXSxcbiAgW1wic3dpdGNoIGNvc3R1bWUgdG8gJW0uY29zdHVtZVwiLCBcIiBcIiwgMiwgXCJsb29rTGlrZTpcIl0sXG4gIFtcIm5leHQgY29zdHVtZVwiLCBcIiBcIiwgMiwgXCJuZXh0Q29zdHVtZVwiXSxcbiAgW1wibmV4dCBiYWNrZHJvcFwiLCBcIiBcIiwgMTAyLCBcIm5leHRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIGJhY2tkcm9wIHRvICVtLmJhY2tkcm9wXCIsIFwiIFwiLCAyLCBcInN0YXJ0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCBiYWNrZHJvcCB0byAlbS5iYWNrZHJvcCBhbmQgd2FpdFwiLCBcIiBcIiwgMTAyLCBcInN0YXJ0U2NlbmVBbmRXYWl0XCJdLFxuICBbXCJjaGFuZ2UgJW0uZWZmZWN0IGVmZmVjdCBieSAlblwiLCBcIiBcIiwgMiwgXCJjaGFuZ2VHcmFwaGljRWZmZWN0OmJ5OlwiXSxcbiAgW1wic2V0ICVtLmVmZmVjdCBlZmZlY3QgdG8gJW5cIiwgXCIgXCIsIDIsIFwic2V0R3JhcGhpY0VmZmVjdDp0bzpcIl0sXG4gIFtcImNsZWFyIGdyYXBoaWMgZWZmZWN0c1wiLCBcIiBcIiwgMiwgXCJmaWx0ZXJSZXNldFwiXSxcbiAgW1wiY2hhbmdlIHNpemUgYnkgJW5cIiwgXCIgXCIsIDIsIFwiY2hhbmdlU2l6ZUJ5OlwiXSxcbiAgW1wic2V0IHNpemUgdG8gJW4lXCIsIFwiIFwiLCAyLCBcInNldFNpemVUbzpcIl0sXG4gIFtcImdvIHRvIGZyb250XCIsIFwiIFwiLCAyLCBcImNvbWVUb0Zyb250XCJdLFxuICBbXCJnbyBiYWNrICVuIGxheWVyc1wiLCBcIiBcIiwgMiwgXCJnb0JhY2tCeUxheWVyczpcIl0sXG4gIFtcInBsYXkgc291bmQgJW0uc291bmRcIiwgXCIgXCIsIDMsIFwicGxheVNvdW5kOlwiXSxcbiAgW1wicGxheSBzb3VuZCAlbS5zb3VuZCB1bnRpbCBkb25lXCIsIFwiIFwiLCAzLCBcImRvUGxheVNvdW5kQW5kV2FpdFwiXSxcbiAgW1wic3RvcCBhbGwgc291bmRzXCIsIFwiIFwiLCAzLCBcInN0b3BBbGxTb3VuZHNcIl0sXG4gIFtcInBsYXkgZHJ1bSAlZC5kcnVtIGZvciAlbiBiZWF0c1wiLCBcIiBcIiwgMywgXCJwbGF5RHJ1bVwiXSxcbiAgW1wicmVzdCBmb3IgJW4gYmVhdHNcIiwgXCIgXCIsIDMsIFwicmVzdDplbGFwc2VkOmZyb206XCJdLFxuICBbXCJwbGF5IG5vdGUgJWQubm90ZSBmb3IgJW4gYmVhdHNcIiwgXCIgXCIsIDMsIFwibm90ZU9uOmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInNldCBpbnN0cnVtZW50IHRvICVkLmluc3RydW1lbnRcIiwgXCIgXCIsIDMsIFwiaW5zdHJ1bWVudDpcIl0sXG4gIFtcImNoYW5nZSB2b2x1bWUgYnkgJW5cIiwgXCIgXCIsIDMsIFwiY2hhbmdlVm9sdW1lQnk6XCJdLFxuICBbXCJzZXQgdm9sdW1lIHRvICVuJVwiLCBcIiBcIiwgMywgXCJzZXRWb2x1bWVUbzpcIl0sXG4gIFtcImNoYW5nZSB0ZW1wbyBieSAlblwiLCBcIiBcIiwgMywgXCJjaGFuZ2VUZW1wb0J5OlwiXSxcbiAgW1wic2V0IHRlbXBvIHRvICVuIGJwbVwiLCBcIiBcIiwgMywgXCJzZXRUZW1wb1RvOlwiXSxcbiAgW1wiY2hhbmdlICVtLmF1ZGlvRWZmZWN0IGVmZmVjdCBieSAlblwiLCBcIiBcIiwgMywgXCJjaGFuZ2VBdWRpb0VmZmVjdEJ5OlwiXSxcbiAgW1wic2V0ICVtLmF1ZGlvRWZmZWN0IGVmZmVjdCB0byAlblwiLCBcIiBcIiwgMywgXCJzZXRBdWRpb0VmZmVjdFRvOlwiXSxcbiAgW1wiZXJhc2UgYWxsXCIsIFwiIFwiLCA0LCBcImNsZWFyUGVuVHJhaWxzXCJdLFxuICBbXCJzdGFtcFwiLCBcIiBcIiwgNCwgXCJzdGFtcENvc3R1bWVcIl0sXG4gIFtcInBlbiBkb3duXCIsIFwiIFwiLCA0LCBcInB1dFBlbkRvd25cIl0sXG4gIFtcInBlbiB1cFwiLCBcIiBcIiwgNCwgXCJwdXRQZW5VcFwiXSxcbiAgW1wic2V0IHBlbiBjb2xvciB0byAlY1wiLCBcIiBcIiwgNCwgXCJwZW5Db2xvcjpcIl0sXG4gIFtcImNoYW5nZSBwZW4gY29sb3IgYnkgJW5cIiwgXCIgXCIsIDQsIFwiY2hhbmdlUGVuSHVlQnk6XCJdLFxuICBbXCJzZXQgcGVuIGNvbG9yIHRvICVuXCIsIFwiIFwiLCA0LCBcInNldFBlbkh1ZVRvOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBzaGFkZSBieSAlblwiLCBcIiBcIiwgNCwgXCJjaGFuZ2VQZW5TaGFkZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaGFkZSB0byAlblwiLCBcIiBcIiwgNCwgXCJzZXRQZW5TaGFkZVRvOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBzaXplIGJ5ICVuXCIsIFwiIFwiLCA0LCBcImNoYW5nZVBlblNpemVCeTpcIl0sXG4gIFtcInNldCBwZW4gc2l6ZSB0byAlblwiLCBcIiBcIiwgNCwgXCJwZW5TaXplOlwiXSxcbiAgW1wid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIiwgXCJoXCIsIDUsIFwid2hlbkdyZWVuRmxhZ1wiXSxcbiAgW1wid2hlbiAlbS5rZXkga2V5IHByZXNzZWRcIiwgXCJoXCIsIDUsIFwid2hlbktleVByZXNzZWRcIl0sXG4gIFtcIndoZW4gdGhpcyBzcHJpdGUgY2xpY2tlZFwiLCBcImhcIiwgNSwgXCJ3aGVuQ2xpY2tlZFwiXSxcbiAgW1wid2hlbiBiYWNrZHJvcCBzd2l0Y2hlcyB0byAlbS5iYWNrZHJvcFwiLCBcImhcIiwgNSwgXCJ3aGVuU2NlbmVTdGFydHNcIl0sXG4gIFtcIndoZW4gJW0udHJpZ2dlclNlbnNvciA+ICVuXCIsIFwiaFwiLCA1LCBcIndoZW5TZW5zb3JHcmVhdGVyVGhhblwiXSxcbiAgW1wid2hlbiBJIHJlY2VpdmUgJW0uYnJvYWRjYXN0XCIsIFwiaFwiLCA1LCBcIndoZW5JUmVjZWl2ZVwiXSxcbiAgW1wiYnJvYWRjYXN0ICVtLmJyb2FkY2FzdFwiLCBcIiBcIiwgNSwgXCJicm9hZGNhc3Q6XCJdLFxuICBbXCJicm9hZGNhc3QgJW0uYnJvYWRjYXN0IGFuZCB3YWl0XCIsIFwiIFwiLCA1LCBcImRvQnJvYWRjYXN0QW5kV2FpdFwiXSxcbiAgW1wid2FpdCAlbiBzZWNvbmRzXCIsIFwiIFwiLCA2LCBcIndhaXQ6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wicmVwZWF0ICVuXCIsIFwiY1wiLCA2LCBcImRvUmVwZWF0XCJdLFxuICBbXCJmb3JldmVyXCIsIFwiY2ZcIiwgNiwgXCJkb0ZvcmV2ZXJcIl0sXG4gIFtcImlmICViIHRoZW5cIiwgXCJjXCIsIDYsIFwiZG9JZlwiXSxcbiAgW1wiaWYgJWIgdGhlblwiLCBcImVcIiwgNiwgXCJkb0lmRWxzZVwiXSxcbiAgW1wid2FpdCB1bnRpbCAlYlwiLCBcIiBcIiwgNiwgXCJkb1dhaXRVbnRpbFwiXSxcbiAgW1wicmVwZWF0IHVudGlsICViXCIsIFwiY1wiLCA2LCBcImRvVW50aWxcIl0sXG4gIFtcInN0b3AgJW0uc3RvcFwiLCBcImZcIiwgNiwgXCJzdG9wU2NyaXB0c1wiXSxcbiAgW1wid2hlbiBJIHN0YXJ0IGFzIGEgY2xvbmVcIiwgXCJoXCIsIDYsIFwid2hlbkNsb25lZFwiXSxcbiAgW1wiY3JlYXRlIGNsb25lIG9mICVtLnNwcml0ZU9ubHlcIiwgXCIgXCIsIDYsIFwiY3JlYXRlQ2xvbmVPZlwiXSxcbiAgW1wiZGVsZXRlIHRoaXMgY2xvbmVcIiwgXCJmXCIsIDYsIFwiZGVsZXRlQ2xvbmVcIl0sXG4gIFtcImFzayAlcyBhbmQgd2FpdFwiLCBcIiBcIiwgNywgXCJkb0Fza1wiXSxcbiAgW1widHVybiB2aWRlbyAlbS52aWRlb1N0YXRlXCIsIFwiIFwiLCA3LCBcInNldFZpZGVvU3RhdGVcIl0sXG4gIFtcInNldCB2aWRlbyB0cmFuc3BhcmVuY3kgdG8gJW4lXCIsIFwiIFwiLCA3LCBcInNldFZpZGVvVHJhbnNwYXJlbmN5XCJdLFxuICBbXCJyZXNldCB0aW1lclwiLCBcIiBcIiwgNywgXCJ0aW1lclJlc2V0XCJdLFxuICBbXCJzZXQgJW0udmFyIHRvICVzXCIsIFwiIFwiLCA5LCBcInNldFZhcjp0bzpcIl0sXG4gIFtcImNoYW5nZSAlbS52YXIgYnkgJW5cIiwgXCIgXCIsIDksIFwiY2hhbmdlVmFyOmJ5OlwiXSxcbiAgW1wic2hvdyB2YXJpYWJsZSAlbS52YXJcIiwgXCIgXCIsIDksIFwic2hvd1ZhcmlhYmxlOlwiXSxcbiAgW1wiaGlkZSB2YXJpYWJsZSAlbS52YXJcIiwgXCIgXCIsIDksIFwiaGlkZVZhcmlhYmxlOlwiXSxcbiAgW1wiYWRkICVzIHRvICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImFwcGVuZDp0b0xpc3Q6XCJdLFxuICBbXCJkZWxldGUgJWQubGlzdERlbGV0ZUl0ZW0gb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiZGVsZXRlTGluZTpvZkxpc3Q6XCJdLFxuICBbXCJkZWxldGUgYWxsIG9mICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImRlbGV0ZUFsbDpvZkxpc3Q6XCJdLFxuICBbXCJpZiBvbiBlZGdlLCBib3VuY2VcIiwgXCIgXCIsIDEsIFwiYm91bmNlT2ZmRWRnZVwiXSxcbiAgW1wiaW5zZXJ0ICVzIGF0ICVkLmxpc3RJdGVtIG9mICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImluc2VydDphdDpvZkxpc3Q6XCJdLFxuICBbXG4gICAgXCJyZXBsYWNlIGl0ZW0gJWQubGlzdEl0ZW0gb2YgJW0ubGlzdCB3aXRoICVzXCIsXG4gICAgXCIgXCIsXG4gICAgMTIsXG4gICAgXCJzZXRMaW5lOm9mTGlzdDp0bzpcIixcbiAgXSxcbiAgW1wic2hvdyBsaXN0ICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcInNob3dMaXN0OlwiXSxcbiAgW1wiaGlkZSBsaXN0ICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImhpZGVMaXN0OlwiXSxcblxuICBbXCJ4IHBvc2l0aW9uXCIsIFwiclwiLCAxLCBcInhwb3NcIl0sXG4gIFtcInkgcG9zaXRpb25cIiwgXCJyXCIsIDEsIFwieXBvc1wiXSxcbiAgW1wiZGlyZWN0aW9uXCIsIFwiclwiLCAxLCBcImhlYWRpbmdcIl0sXG4gIFtcImNvc3R1bWUgI1wiLCBcInJcIiwgMiwgXCJjb3N0dW1lSW5kZXhcIl0sXG4gIFtcInNpemVcIiwgXCJyXCIsIDIsIFwic2NhbGVcIl0sXG4gIFtcImJhY2tkcm9wIG5hbWVcIiwgXCJyXCIsIDEwMiwgXCJzY2VuZU5hbWVcIl0sXG4gIFtcImJhY2tkcm9wICNcIiwgXCJyXCIsIDEwMiwgXCJiYWNrZ3JvdW5kSW5kZXhcIl0sXG4gIFtcInZvbHVtZVwiLCBcInJcIiwgMywgXCJ2b2x1bWVcIl0sXG4gIFtcInRlbXBvXCIsIFwiclwiLCAzLCBcInRlbXBvXCJdLFxuICBbXCJ0b3VjaGluZyAlbS50b3VjaGluZz9cIiwgXCJiXCIsIDcsIFwidG91Y2hpbmc6XCJdLFxuICBbXCJ0b3VjaGluZyBjb2xvciAlYz9cIiwgXCJiXCIsIDcsIFwidG91Y2hpbmdDb2xvcjpcIl0sXG4gIFtcImNvbG9yICVjIGlzIHRvdWNoaW5nICVjP1wiLCBcImJcIiwgNywgXCJjb2xvcjpzZWVzOlwiXSxcbiAgW1wiZGlzdGFuY2UgdG8gJW0uc3ByaXRlT3JNb3VzZVwiLCBcInJcIiwgNywgXCJkaXN0YW5jZVRvOlwiXSxcbiAgW1wiYW5zd2VyXCIsIFwiclwiLCA3LCBcImFuc3dlclwiXSxcbiAgW1wia2V5ICVtLmtleSBwcmVzc2VkP1wiLCBcImJcIiwgNywgXCJrZXlQcmVzc2VkOlwiXSxcbiAgW1wibW91c2UgZG93bj9cIiwgXCJiXCIsIDcsIFwibW91c2VQcmVzc2VkXCJdLFxuICBbXCJtb3VzZSB4XCIsIFwiclwiLCA3LCBcIm1vdXNlWFwiXSxcbiAgW1wibW91c2UgeVwiLCBcInJcIiwgNywgXCJtb3VzZVlcIl0sXG4gIFtcImxvdWRuZXNzXCIsIFwiclwiLCA3LCBcInNvdW5kTGV2ZWxcIl0sXG4gIFtcInZpZGVvICVtLnZpZGVvTW90aW9uVHlwZSBvbiAlbS5zdGFnZU9yVGhpc1wiLCBcInJcIiwgNywgXCJzZW5zZVZpZGVvTW90aW9uXCJdLFxuICBbXCJ0aW1lclwiLCBcInJcIiwgNywgXCJ0aW1lclwiXSxcbiAgW1wiJW0uYXR0cmlidXRlIG9mICVtLnNwcml0ZU9yU3RhZ2VcIiwgXCJyXCIsIDcsIFwiZ2V0QXR0cmlidXRlOm9mOlwiXSxcbiAgW1wiY3VycmVudCAlbS50aW1lQW5kRGF0ZVwiLCBcInJcIiwgNywgXCJ0aW1lQW5kRGF0ZVwiXSxcbiAgW1wiZGF5cyBzaW5jZSAyMDAwXCIsIFwiclwiLCA3LCBcInRpbWVzdGFtcFwiXSxcbiAgW1widXNlcm5hbWVcIiwgXCJyXCIsIDcsIFwiZ2V0VXNlck5hbWVcIl0sXG4gIFtcIiVuICsgJW5cIiwgXCJyXCIsIDgsIFwiK1wiXSxcbiAgW1wiJW4gLSAlblwiLCBcInJcIiwgOCwgXCItXCJdLFxuICBbXCIlbiAqICVuXCIsIFwiclwiLCA4LCBcIipcIl0sXG4gIFtcIiVuIC8gJW5cIiwgXCJyXCIsIDgsIFwiL1wiXSxcbiAgW1wicGljayByYW5kb20gJW4gdG8gJW5cIiwgXCJyXCIsIDgsIFwicmFuZG9tRnJvbTp0bzpcIl0sXG4gIFtcIiVzIDwgJXNcIiwgXCJiXCIsIDgsIFwiPFwiXSxcbiAgW1wiJXMgPSAlc1wiLCBcImJcIiwgOCwgXCI9XCJdLFxuICBbXCIlcyA+ICVzXCIsIFwiYlwiLCA4LCBcIj5cIl0sXG4gIFtcIiViIGFuZCAlYlwiLCBcImJcIiwgOCwgXCImXCJdLFxuICBbXCIlYiBvciAlYlwiLCBcImJcIiwgOCwgXCJ8XCJdLFxuICBbXCJub3QgJWJcIiwgXCJiXCIsIDgsIFwibm90XCJdLFxuICBbXCJqb2luICVzICVzXCIsIFwiclwiLCA4LCBcImNvbmNhdGVuYXRlOndpdGg6XCJdLFxuICBbXCJsZXR0ZXIgJW4gb2YgJXNcIiwgXCJyXCIsIDgsIFwibGV0dGVyOm9mOlwiXSxcbiAgW1wibGVuZ3RoIG9mICVzXCIsIFwiclwiLCA4LCBcInN0cmluZ0xlbmd0aDpcIl0sXG4gIFtcIiVuIG1vZCAlblwiLCBcInJcIiwgOCwgXCIlXCJdLFxuICBbXCJyb3VuZCAlblwiLCBcInJcIiwgOCwgXCJyb3VuZGVkXCJdLFxuICBbXCIlbS5tYXRoT3Agb2YgJW5cIiwgXCJyXCIsIDgsIFwiY29tcHV0ZUZ1bmN0aW9uOm9mOlwiXSxcbiAgW1wiaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0XCIsIFwiclwiLCAxMiwgXCJnZXRMaW5lOm9mTGlzdDpcIl0sXG4gIFtcImxlbmd0aCBvZiAlbS5saXN0XCIsIFwiclwiLCAxMiwgXCJsaW5lQ291bnRPZkxpc3Q6XCJdLFxuICBbXCIlbS5saXN0IGNvbnRhaW5zICVzP1wiLCBcImJcIiwgMTIsIFwibGlzdDpjb250YWluczpcIl0sXG5cbiAgW1wid2hlbiAlbS5ib29sZWFuU2Vuc29yXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gJW0uc2Vuc29yICVtLmxlc3NNb3JlICVuXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcInNlbnNvciAlbS5ib29sZWFuU2Vuc29yP1wiLCBcImJcIiwgMjAsIFwiXCJdLFxuICBbXCIlbS5zZW5zb3Igc2Vuc29yIHZhbHVlXCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1widHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ0dXJuICVtLm1vdG9yIG9uXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInR1cm4gJW0ubW90b3Igb2ZmXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInNldCAlbS5tb3RvciBwb3dlciB0byAlblwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJzZXQgJW0ubW90b3IyIGRpcmVjdGlvbiB0byAlbS5tb3RvckRpcmVjdGlvblwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ3aGVuIGRpc3RhbmNlICVtLmxlc3NNb3JlICVuXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gdGlsdCAlbS5lTmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wiZGlzdGFuY2VcIiwgXCJyXCIsIDIwLCBcIlwiXSxcbiAgW1widGlsdFwiLCBcInJcIiwgMjAsIFwiXCJdLFxuXG4gIFtcInR1cm4gJW0ubW90b3Igb24gZm9yICVuIHNlY29uZHNcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wic2V0IGxpZ2h0IGNvbG9yIHRvICVuXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInBsYXkgbm90ZSAlbiBmb3IgJW4gc2Vjb25kc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ3aGVuIHRpbHRlZFwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJ0aWx0ICVtLnh4eFwiLCBcInJcIiwgMjAsIFwiXCJdLFxuXG4gIFtcImVsc2VcIiwgXCJlbHNlXCIsIDYsIFwiXCJdLFxuICBbXCJlbmRcIiwgXCJlbmRcIiwgNiwgXCJcIl0sXG4gIFtcIi4gLiAuXCIsIFwiIFwiLCA0MiwgXCJcIl0sXG5cbiAgW1wiJW4gQGFkZElucHV0XCIsIFwicmluZ1wiLCA0MiwgXCJcIl0sXG5cbiAgW1widXNlciBpZFwiLCBcInJcIiwgMCwgXCJcIl0sXG5cbiAgW1wiaWYgJWJcIiwgXCJjXCIsIDAsIFwiZG9JZlwiXSxcbiAgW1wiaWYgJWJcIiwgXCJlXCIsIDAsIFwiZG9JZkVsc2VcIl0sXG4gIFtcImZvcmV2ZXIgaWYgJWJcIiwgXCJjZlwiLCAwLCBcImRvRm9yZXZlcklmXCJdLFxuICBbXCJzdG9wIHNjcmlwdFwiLCBcImZcIiwgMCwgXCJkb1JldHVyblwiXSxcbiAgW1wic3RvcCBhbGxcIiwgXCJmXCIsIDAsIFwic3RvcEFsbFwiXSxcbiAgW1wic3dpdGNoIHRvIGNvc3R1bWUgJW0uY29zdHVtZVwiLCBcIiBcIiwgMCwgXCJsb29rTGlrZTpcIl0sXG4gIFtcIm5leHQgYmFja2dyb3VuZFwiLCBcIiBcIiwgMCwgXCJuZXh0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCB0byBiYWNrZ3JvdW5kICVtLmJhY2tkcm9wXCIsIFwiIFwiLCAwLCBcInN0YXJ0U2NlbmVcIl0sXG4gIFtcImJhY2tncm91bmQgI1wiLCBcInJcIiwgMCwgXCJiYWNrZ3JvdW5kSW5kZXhcIl0sXG4gIFtcImxvdWQ/XCIsIFwiYlwiLCAwLCBcImlzTG91ZFwiXSxcbl1cbiIsIi8qIGZvciBjb25zdHVjdGluZyBTVkdzICovXG5cbmZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbn1cbmZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG59XG5cbi8vIHNldCBieSBTVkcuaW5pdFxudmFyIGRvY3VtZW50XG52YXIgeG1sXG5cbnZhciBkaXJlY3RQcm9wcyA9IHtcbiAgdGV4dENvbnRlbnQ6IHRydWUsXG59XG5cbnZhciBTVkcgPSAobW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluaXQod2luZG93LCBtYWtlQ2FudmFzKSB7XG4gICAgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnRcbiAgICB2YXIgRE9NUGFyc2VyID0gd2luZG93LkRPTVBhcnNlclxuICAgIHhtbCA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoXCI8eG1sPjwveG1sPlwiLCBcImFwcGxpY2F0aW9uL3htbFwiKVxuICAgIFNWRy5YTUxTZXJpYWxpemVyID0gd2luZG93LlhNTFNlcmlhbGl6ZXJcblxuICAgIFNWRy5tYWtlQ2FudmFzID0gbWFrZUNhbnZhc1xuICB9LFxuXG4gIGNkYXRhKGNvbnRlbnQpIHtcbiAgICByZXR1cm4geG1sLmNyZWF0ZUNEQVRBU2VjdGlvbihjb250ZW50KVxuICB9LFxuXG4gIGVsKG5hbWUsIHByb3BzKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgbmFtZSlcbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKGVsLCBwcm9wcylcbiAgfSxcblxuICBzZXRQcm9wcyhlbCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICAgIHZhciB2YWx1ZSA9IFwiXCIgKyBwcm9wc1trZXldXG4gICAgICBpZiAoZGlyZWN0UHJvcHNba2V5XSkge1xuICAgICAgICBlbFtrZXldID0gdmFsdWVcbiAgICAgIH0gZWxzZSBpZiAoL154bGluazovLnRlc3Qoa2V5KSkge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwga2V5LnNsaWNlKDYpLCB2YWx1ZSlcbiAgICAgIH0gZWxzZSBpZiAocHJvcHNba2V5XSAhPT0gbnVsbCAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKG51bGwsIGtleSwgdmFsdWUpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbFxuICB9LFxuXG4gIHdpdGhDaGlsZHJlbihlbCwgY2hpbGRyZW4pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlbC5hcHBlbmRDaGlsZChjaGlsZHJlbltpXSlcbiAgICB9XG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgZ3JvdXAoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gU1ZHLndpdGhDaGlsZHJlbihTVkcuZWwoXCJnXCIpLCBjaGlsZHJlbilcbiAgfSxcblxuICBuZXdTVkcod2lkdGgsIGhlaWdodCkge1xuICAgIHJldHVybiBTVkcuZWwoXCJzdmdcIiwge1xuICAgICAgdmVyc2lvbjogXCIxLjFcIixcbiAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgIH0pXG4gIH0sXG5cbiAgcG9seWdvbihwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInBvbHlnb25cIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwb2ludHM6IHByb3BzLnBvaW50cy5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHBhdGgocHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFxuICAgICAgXCJwYXRoXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogbnVsbCxcbiAgICAgICAgZDogcHJvcHMucGF0aC5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHRleHQoeCwgeSwgY29udGVudCwgcHJvcHMpIHtcbiAgICB2YXIgdGV4dCA9IFNWRy5lbChcbiAgICAgIFwidGV4dFwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHg6IHgsXG4gICAgICAgIHk6IHksXG4gICAgICAgIHRleHRDb250ZW50OiBjb250ZW50LFxuICAgICAgfSlcbiAgICApXG4gICAgcmV0dXJuIHRleHRcbiAgfSxcblxuICBzeW1ib2woaHJlZikge1xuICAgIHJldHVybiBTVkcuZWwoXCJ1c2VcIiwge1xuICAgICAgXCJ4bGluazpocmVmXCI6IGhyZWYsXG4gICAgfSlcbiAgfSxcblxuICBtb3ZlKGR4LCBkeSwgZWwpIHtcbiAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgIHRyYW5zZm9ybTogW1widHJhbnNsYXRlKFwiLCBkeCwgXCIgXCIsIGR5LCBcIilcIl0uam9pbihcIlwiKSxcbiAgICB9KVxuICAgIHJldHVybiBlbFxuICB9LFxuXG4gIHRyYW5zbGF0ZVBhdGgoZHgsIGR5LCBwYXRoKSB7XG4gICAgdmFyIGlzWCA9IHRydWVcbiAgICB2YXIgcGFydHMgPSBwYXRoLnNwbGl0KFwiIFwiKVxuICAgIHZhciBvdXQgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwYXJ0ID0gcGFydHNbaV1cbiAgICAgIGlmIChwYXJ0ID09PSBcIkFcIikge1xuICAgICAgICB2YXIgaiA9IGkgKyA1XG4gICAgICAgIG91dC5wdXNoKFwiQVwiKVxuICAgICAgICB3aGlsZSAoaSA8IGopIHtcbiAgICAgICAgICBvdXQucHVzaChwYXJ0c1srK2ldKVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9IGVsc2UgaWYgKC9bQS1aYS16XS8udGVzdChwYXJ0KSkge1xuICAgICAgICBhc3NlcnQoaXNYKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFydCA9ICtwYXJ0XG4gICAgICAgIHBhcnQgKz0gaXNYID8gZHggOiBkeVxuICAgICAgICBpc1ggPSAhaXNYXG4gICAgICB9XG4gICAgICBvdXQucHVzaChwYXJ0KVxuICAgIH1cbiAgICByZXR1cm4gb3V0LmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgLyogc2hhcGVzICovXG5cbiAgcmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInJlY3RcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwLFxuICAgICAgICB3aWR0aDogdyxcbiAgICAgICAgaGVpZ2h0OiBoLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgZWxsaXBzZSh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcImVsbGlwc2VcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBjeDogdyAvIDIsXG4gICAgICAgIGN5OiBoIC8gMixcbiAgICAgICAgcng6IHcgLyAyLFxuICAgICAgICByeTogaCAvIDIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBhcmMocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeVxuICAgIHJldHVybiBbXCJMXCIsIHAxeCwgcDF5LCBcIkFcIiwgcngsIHJ5LCAwLCAwLCAxLCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICBhcmN3KHAxeCwgcDF5LCBwMngsIHAyeSwgcngsIHJ5KSB7XG4gICAgdmFyIHIgPSBwMnkgLSBwMXlcbiAgICByZXR1cm4gW1wiTFwiLCBwMXgsIHAxeSwgXCJBXCIsIHJ4LCByeSwgMCwgMCwgMCwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgcm91bmRlZFBhdGgodywgaCkge1xuICAgIHZhciByID0gaCAvIDJcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICByLFxuICAgICAgMCxcbiAgICAgIFNWRy5hcmModyAtIHIsIDAsIHcgLSByLCBoLCByLCByKSxcbiAgICAgIFNWRy5hcmMociwgaCwgciwgMCwgciwgciksXG4gICAgICBcIlpcIixcbiAgICBdXG4gIH0sXG4gIFxuICByb3VuZGVkUGF0aDIodywgaCkge1xuICAgIHZhciByID0gKGggLyAyKVxuICAgIHJldHVybiBbXG4gICAgICBcIk1cIixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgU1ZHLmFyYyh3IC0gciwgMCwgdyAtIHIsIGgsIHIsIHIpLFxuICAgICAgU1ZHLmFyYyhyLCBoLCByLCAwLCByLCByKSxcbiAgICAgIFwiWlwiLFxuICAgIF1cbiAgfSxcblxuICByb3VuZGVkUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBTVkcucm91bmRlZFBhdGgodywgaCksXG4gICAgICB9KVxuICAgIClcbiAgfSxcbiAgXG4gIHJvdW5kZWRSZWN0Mih3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBTVkcucm91bmRlZFBhdGgyKHcsIGgpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcG9pbnRlZFBhdGgodywgaCkge1xuICAgIHZhciByID0gaCAvIDJcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICByLFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgdyAtIHIsXG4gICAgICAwLFxuICAgICAgdyxcbiAgICAgIHIsXG4gICAgICBcIkxcIixcbiAgICAgIHcsXG4gICAgICByLFxuICAgICAgdyAtIHIsXG4gICAgICBoLFxuICAgICAgXCJMXCIsXG4gICAgICByLFxuICAgICAgaCxcbiAgICAgIDAsXG4gICAgICByLFxuICAgICAgXCJMXCIsXG4gICAgICAwLFxuICAgICAgcixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgXCJaXCIsXG4gICAgXVxuICB9LFxuXG4gIHBvaW50ZWRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFNWRy5wb2ludGVkUGF0aCh3LCBoKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGdldFRvcCh3KSB7XG4gICAgcmV0dXJuIFtcIk1cIiwgMCwgNCxcbiAgICAgIC8vIFwiTFwiLCAxLCAxLFxuICAgICAgLy8gXCJMXCIsIDQsIDAsXG4gICAgICBcIlFcIiwgU1ZHLmN1cnZlKDAsIDQsIDQsIDAsIDApLFxuICAgICAgW1wiTFwiLCA4LCAwXS5qb2luKFwiIFwiKSxcbiAgICAgIFwiYyAyIDAgMyAxIDQgMlwiLFxuICAgICAgXCJsIDEuNSAxLjVcIixcbiAgICAgIFwiYyAxIDEgMiAyIDQgMlwiLFxuICAgICAgXCJoIDhcIixcbiAgICAgIFwiYyAyIDAgMyAtMSA0IC0yXCIsXG4gICAgICBcImwgMS41IC0xLjVcIixcbiAgICAgIFwiYyAxIC0xIDIgLTIgNCAtMlwiLFxuICAgICAgXCJMXCIsIHcgLSA0LCAwLFxuICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3IC0gNCwgMCwgdywgNCwgMCksXG4gICAgICBcIkxcIiwgdywgNFxuICAgIF0uam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRSaW5nVG9wKHcpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICAwLFxuICAgICAgMyxcbiAgICAgIFwiTFwiLFxuICAgICAgMyxcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIDcsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICAxMCxcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDE2LFxuICAgICAgMyxcbiAgICAgIFwiTFwiLFxuICAgICAgMTksXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gMyxcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIHcsXG4gICAgICAzLFxuICAgIF0uam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRSaWdodEFuZEJvdHRvbSh3LCB5LCBoYXNOb3RjaCwgaW5zZXQpIHtcbiAgICBpZiAodHlwZW9mIGluc2V0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnNldCA9IDBcbiAgICB9XG4gICAgLy92YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gMywgXCJMXCIsIHcgLSAzLCB5XVxuICAgIHZhciBhcnIgPSBbXCJMXCIsIHcsIHkgLSA0LCBcIlFcIiwgU1ZHLmN1cnZlKHcsIHkgLSA0LCB3IC0gNCwgeSwgMCldXG4gICAgaWYgKGhhc05vdGNoKSB7XG4gICAgICAvLyBhcnIgPSBhcnIuY29uY2F0KFtcbiAgICAgIC8vICAgXCJMXCIsXG4gICAgICAvLyAgIGluc2V0ICsgMzAsXG4gICAgICAvLyAgIHksXG4gICAgICAvLyAgIFwiTFwiLFxuICAgICAgLy8gICBpbnNldCArIDI0LFxuICAgICAgLy8gICB5ICsgNSxcbiAgICAgIC8vICAgXCJMXCIsXG4gICAgICAvLyAgIGluc2V0ICsgMTQsXG4gICAgICAvLyAgIHkgKyA1LFxuICAgICAgLy8gICBcIkxcIixcbiAgICAgIC8vICAgaW5zZXQgKyA4LFxuICAgICAgLy8gICB5LFxuICAgICAgLy8gXSlcbiAgICAgIGFyciA9IGFyci5jb25jYXQoW1xuICAgICAgICBbXCJMXCIsIGluc2V0ICsgMzUsIHldLmpvaW4oXCIgXCIpLFxuICAgICAgICBcImMgLTIgMCAtMyAxIC00IDJcIixcbiAgICAgICAgXCJsIC0xLjUgMS41XCIsXG4gICAgICAgIFwiYyAtMSAxIC0yIDIgLTQgMlwiLFxuICAgICAgICBcImggLThcIixcbiAgICAgICAgXCJjIC0yIDAgLTMgLTEgLTQgLTJcIixcbiAgICAgICAgXCJsIC0xLjUgLTEuNVwiLFxuICAgICAgICBcImMgLTEgLTEgLTIgLTIgLTQgLTJcIixcbiAgICAgIF0pXG4gICAgfVxuICAgIGlmIChpbnNldCA9PT0gMCkge1xuICAgICAgYXJyLnB1c2goXCJMXCIsIGluc2V0ICsgNCwgeSlcbiAgICAgIGFyci5wdXNoKFwiYSA0IDQgMCAwIDEgLTQgLTRcIilcbiAgICB9IGVsc2Uge1xuICAgICAgYXJyLnB1c2goXCJMXCIsIGluc2V0ICsgNCwgeSlcbiAgICAgIGFyci5wdXNoKFwiYSA0IDQgMCAwIDAgLTQgNFwiKVxuICAgIH1cbiAgICByZXR1cm4gYXJyLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0QXJtKHcsIGFybVRvcCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIkxcIiwgMTUsIGFybVRvcCAtIDQsXG4gICAgICBcImEgLTQgLTQgMCAwIDAgNCA0XCIsXG4gICAgICBcIkxcIiwgdyAtIDQsIGFybVRvcCxcbiAgICAgIFwiYSA0IDQgMCAwIDEgNCA0XCJcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG4gIFxuICBcblxuICBzdGFja1JlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogW1NWRy5nZXRUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCB0cnVlLCAwKSwgXCJaXCJdLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgY2FwUGF0aCh3LCBoKSB7XG4gICAgcmV0dXJuIFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgZmFsc2UsIDApLCBcIlpcIl1cbiAgfSxcblxuICByaW5nQ2FwUGF0aCh3LCBoKSB7XG4gICAgcmV0dXJuIFtTVkcuZ2V0UmluZ1RvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIGZhbHNlLCAwKSwgXCJaXCJdXG4gIH0sXG5cbiAgY2FwUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBTVkcuY2FwUGF0aCh3LCBoKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGhhdFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLCAwLCAxMixcbiAgICAgICAgU1ZHLmFyYygwLCAxMCwgNjAsIDEwLCA2MCwgODApLFxuICAgICAgICBcIkxcIiwgdy00LCAxMCxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3IC0gNCwgMTAsIHcsIDEwICsgNCwgMCksXG4gICAgICAgIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCB0cnVlKSxcbiAgICAgICAgXCJaXCIsXG4gICAgICBdLFxuICAgIH0pKTtcbiAgfSxcblxuICBjdXJ2ZShwMXgsIHAxeSwgcDJ4LCBwMnksIHJvdW5kbmVzcykge1xuICAgIHZhciByb3VuZG5lc3MgPSByb3VuZG5lc3MgfHwgMC40MlxuICAgIHZhciBtaWRYID0gKHAxeCArIHAyeCkgLyAyLjBcbiAgICB2YXIgbWlkWSA9IChwMXkgKyBwMnkpIC8gMi4wXG4gICAgdmFyIGN4ID0gTWF0aC5yb3VuZChtaWRYICsgcm91bmRuZXNzICogKHAyeSAtIHAxeSkpXG4gICAgdmFyIGN5ID0gTWF0aC5yb3VuZChtaWRZIC0gcm91bmRuZXNzICogKHAyeCAtIHAxeCkpXG4gICAgcmV0dXJuIFtjeCwgY3ksIHAyeCwgcDJ5XS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIHByb2NIYXRCYXNlKHcsIGgsIGFyY2hSb3VuZG5lc3MsIHByb3BzKSB7XG4gICAgLy8gVE9ETyB1c2UgYXJjKClcbiAgICAvLyB2YXIgYXJjaFJvdW5kbmVzcyA9IE1hdGgubWluKDAuMiwgMzUgLyB3KTsgLy91c2VkIGluIHNjcmF0Y2hibG9ja3MyXG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIiwgMCwgaC0zLFxuICAgICAgICBcIkxcIiwgMCwgMTAsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUoMCwgMTAsIDE1LCAtNSwgMCksXG4gICAgICAgIFwiTFwiLCB3LTE1LCAtNSxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3LTE1LCAtNSwgdywgMTAsIDApLFxuICAgICAgICBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSksXG4gICAgICBdLFxuICAgIH0pKTtcbiAgfSxcblxuICBwcm9jSGF0Q2FwKHcsIGgsIGFyY2hSb3VuZG5lc3MpIHtcbiAgICAvLyBUT0RPIHVzZSBhcmMoKVxuICAgIC8vIFRPRE8gdGhpcyBkb2Vzbid0IGxvb2sgcXVpdGUgcmlnaHRcbiAgICByZXR1cm4gU1ZHLnBhdGgoe1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIixcbiAgICAgICAgLTEsXG4gICAgICAgIDEzLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKC0xLCAxMywgdyArIDEsIDEzLCBhcmNoUm91bmRuZXNzKSxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSh3ICsgMSwgMTMsIHcsIDE2LCAwLjYpLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKHcsIDE2LCAwLCAxNiwgLWFyY2hSb3VuZG5lc3MpLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKDAsIDE2LCAtMSwgMTMsIDAuNiksXG4gICAgICAgIFwiWlwiLFxuICAgICAgXSxcbiAgICAgIGNsYXNzOiBcInNiLWRlZmluZS1oYXQtY2FwXCIsXG4gICAgfSlcbiAgfSxcblxuICBwcm9jSGF0UmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHZhciBxID0gNTJcbiAgICB2YXIgeSA9IGggLSBxXG5cbiAgICB2YXIgYXJjaFJvdW5kbmVzcyA9IE1hdGgubWluKDAuMiwgMzUgLyB3KVxuXG4gICAgcmV0dXJuIFNWRy5tb3ZlKFxuICAgICAgMCxcbiAgICAgIHksXG4gICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICBTVkcucHJvY0hhdEJhc2UodywgcSwgYXJjaFJvdW5kbmVzcywgcHJvcHMpLFxuICAgICAgICAvL1NWRy5wcm9jSGF0Q2FwKHcsIHEsIGFyY2hSb3VuZG5lc3MpLFxuICAgICAgXSlcbiAgICApXG4gIH0sXG5cbiAgbW91dGhSZWN0KHcsIGgsIGlzRmluYWwsIGxpbmVzLCBwcm9wcykge1xuICAgIHZhciB5ID0gbGluZXNbMF0uaGVpZ2h0XG4gICAgdmFyIHAgPSBbU1ZHLmdldFRvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIHksIHRydWUsIDE1KV1cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxpbmVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgaXNMYXN0ID0gaSArIDIgPT09IGxpbmVzLmxlbmd0aFxuXG4gICAgICB5ICs9IGxpbmVzW2ldLmhlaWdodCAtIDNcbiAgICAgIHAucHVzaChTVkcuZ2V0QXJtKHcsIHkpKVxuXG4gICAgICB2YXIgaGFzTm90Y2ggPSAhKGlzTGFzdCAmJiBpc0ZpbmFsKVxuICAgICAgdmFyIGluc2V0ID0gaXNMYXN0ID8gMCA6IDE1XG4gICAgICB5ICs9IGxpbmVzW2kgKyAxXS5oZWlnaHQgKyAzXG4gICAgICBwLnB1c2goU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIHksIGhhc05vdGNoLCBpbnNldCkpXG4gICAgICBwLnB1c2goXCJaXCIpXG4gICAgfVxuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBwLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcmluZ1JlY3QodywgaCwgY3ksIGN3LCBjaCwgc2hhcGUsIHByb3BzKSB7XG4gICAgdmFyIHIgPSA4XG4gICAgdmFyIGZ1bmMgPVxuICAgICAgc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgICAgICA/IFNWRy5yb3VuZGVkUGF0aFxuICAgICAgICA6IHNoYXBlID09PSBcImJvb2xlYW5cIlxuICAgICAgICAgID8gU1ZHLnBvaW50ZWRQYXRoXG4gICAgICAgICAgOiBjdyA8IDQwID8gU1ZHLnJpbmdDYXBQYXRoIDogU1ZHLmNhcFBhdGhcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogW1xuICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgIHIsXG4gICAgICAgICAgMCxcbiAgICAgICAgICBTVkcuYXJjdyhyLCAwLCAwLCByLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjdygwLCBoIC0gciwgciwgaCwgciwgciksXG4gICAgICAgICAgU1ZHLmFyY3codyAtIHIsIGgsIHcsIGggLSByLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjdyh3LCByLCB3IC0gciwgMCwgciwgciksXG4gICAgICAgICAgXCJaXCIsXG4gICAgICAgICAgU1ZHLnRyYW5zbGF0ZVBhdGgoNCwgY3kgfHwgNCwgZnVuYyhjdywgY2gpLmpvaW4oXCIgXCIpKSxcbiAgICAgICAgXSxcbiAgICAgICAgXCJmaWxsLXJ1bGVcIjogXCJldmVuLW9kZFwiLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgY29tbWVudFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICB2YXIgciA9IDZcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudFwiLFxuICAgICAgICBwYXRoOiBbXG4gICAgICAgICAgXCJNXCIsXG4gICAgICAgICAgcixcbiAgICAgICAgICAwLFxuICAgICAgICAgIFNWRy5hcmModyAtIHIsIDAsIHcsIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmModywgaCAtIHIsIHcgLSByLCBoLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjKHIsIGgsIDAsIGggLSByLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjKDAsIHIsIHIsIDAsIHIsIHIpLFxuICAgICAgICAgIFwiWlwiLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgY29tbWVudExpbmUod2lkdGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5tb3ZlKFxuICAgICAgLXdpZHRoLFxuICAgICAgOSxcbiAgICAgIFNWRy5yZWN0KFxuICAgICAgICB3aWR0aCxcbiAgICAgICAgMixcbiAgICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudC1saW5lXCIsXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgKVxuICB9LFxuXG4gIHN0cmlrZXRocm91Z2hMaW5lKHcsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFtcIk1cIiwgMCwgMCwgXCJMXCIsIHcsIDBdLFxuICAgICAgICBjbGFzczogXCJzYi1kaWZmIHNiLWRpZmYtZGVsXCIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICB2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxuXG4gIHZhciBGaWx0ZXIgPSBmdW5jdGlvbihpZCwgcHJvcHMpIHtcbiAgICB0aGlzLmVsID0gU1ZHLmVsKFxuICAgICAgXCJmaWx0ZXJcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBpZDogaWQsXG4gICAgICAgIHgwOiBcIi01MCVcIixcbiAgICAgICAgeTA6IFwiLTUwJVwiLFxuICAgICAgICB3aWR0aDogXCIyMDAlXCIsXG4gICAgICAgIGhlaWdodDogXCIyMDAlXCIsXG4gICAgICB9KVxuICAgIClcbiAgICB0aGlzLmhpZ2hlc3RJZCA9IDBcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmZlID0gZnVuY3Rpb24obmFtZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgdmFyIHNob3J0TmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9nYXVzc2lhbnxvc2l0ZS8sIFwiXCIpXG4gICAgdmFyIGlkID0gW3Nob3J0TmFtZSwgXCItXCIsICsrdGhpcy5oaWdoZXN0SWRdLmpvaW4oXCJcIilcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKFxuICAgICAgU1ZHLndpdGhDaGlsZHJlbihcbiAgICAgICAgU1ZHLmVsKFxuICAgICAgICAgIFwiZmVcIiArIG5hbWUsXG4gICAgICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgICAgICByZXN1bHQ6IGlkLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICAgIGNoaWxkcmVuIHx8IFtdXG4gICAgICApXG4gICAgKVxuICAgIHJldHVybiBpZFxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuY29tcCA9IGZ1bmN0aW9uKG9wLCBpbjEsIGluMiwgcHJvcHMpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcbiAgICAgIFwiQ29tcG9zaXRlXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgb3BlcmF0b3I6IG9wLFxuICAgICAgICBpbjogaW4xLFxuICAgICAgICBpbjI6IGluMixcbiAgICAgIH0pXG4gICAgKVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbihpbjEsIGluMikge1xuICAgIHJldHVybiB0aGlzLmNvbXAoXCJhcml0aG1ldGljXCIsIGluMSwgaW4yLCB7IGsyOiArMSwgazM6IC0xIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbihkeCwgZHksIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKFwiT2Zmc2V0XCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICBkeDogZHgsXG4gICAgICBkeTogZHksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmZsb29kID0gZnVuY3Rpb24oY29sb3IsIG9wYWNpdHksIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKFwiRmxvb2RcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIFwiZmxvb2QtY29sb3JcIjogY29sb3IsXG4gICAgICBcImZsb29kLW9wYWNpdHlcIjogb3BhY2l0eSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuYmx1ciA9IGZ1bmN0aW9uKGRldiwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJHYXVzc2lhbkJsdXJcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIHN0ZERldmlhdGlvbjogW2RldiwgZGV2XS5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuY29sb3JNYXRyaXggPSBmdW5jdGlvbihpbjEsIHZhbHVlcykge1xuICAgIHJldHVybiB0aGlzLmZlKFwiQ29sb3JNYXRyaXhcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIHR5cGU6IFwibWF0cml4XCIsXG4gICAgICB2YWx1ZXM6IHZhbHVlcy5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbihjaGlsZHJlbikge1xuICAgIHRoaXMuZmUoXG4gICAgICBcIk1lcmdlXCIsXG4gICAgICB7fSxcbiAgICAgIGNoaWxkcmVuLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBTVkcuZWwoXCJmZU1lcmdlTm9kZVwiLCB7XG4gICAgICAgICAgaW46IG5hbWUsXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIClcbiAgfVxuXG4gIHJldHVybiBGaWx0ZXJcbn0pKClcbiIsIi8qXG4gKiBzY3JhdGNoYmxvY2tzXG4gKiBodHRwOi8vc2NyYXRjaGJsb2Nrcy5naXRodWIuaW8vXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNiwgVGltIFJhZHZhblxuICogQGxpY2Vuc2UgTUlUXG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKi9cbjsoZnVuY3Rpb24obW9kKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb2RcbiAgfSBlbHNlIHtcbiAgICB2YXIgbWFrZUNhbnZhcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbiAgICB9XG4gICAgdmFyIHNjcmF0Y2hibG9ja3MgPSAod2luZG93LnNjcmF0Y2hibG9ja3MgPSBtb2Qod2luZG93LCBtYWtlQ2FudmFzKSlcblxuICAgIC8vIGFkZCBvdXIgQ1NTIHRvIHRoZSBwYWdlXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JhdGNoYmxvY2tzLm1ha2VTdHlsZSgpKVxuICB9XG59KShmdW5jdGlvbih3aW5kb3csIG1ha2VDYW52YXMpIHtcbiAgXCJ1c2Ugc3RyaWN0XCJcblxuICB2YXIgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnRcblxuICAvKiB1dGlscyAqL1xuXG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciB7IGFsbExhbmd1YWdlcywgbG9hZExhbmd1YWdlcyB9ID0gcmVxdWlyZShcIi4vYmxvY2tzLmpzXCIpXG5cbiAgdmFyIHBhcnNlID0gcmVxdWlyZShcIi4vc3ludGF4LmpzXCIpLnBhcnNlXG5cbiAgdmFyIHN0eWxlID0gcmVxdWlyZShcIi4vc3R5bGUuanNcIilcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9ID0gcmVxdWlyZShcIi4vbW9kZWwuanNcIilcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoXCIuL2RyYXcuanNcIilcbiAgU1ZHLmluaXQod2luZG93LCBtYWtlQ2FudmFzKVxuXG4gIExhYmVsLm1lYXN1cmluZyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gU1ZHLm1ha2VDYW52YXMoKVxuICAgIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG4gIH0pKClcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgZnVuY3Rpb24gcmVuZGVyKGRvYywgY2IpIHtcbiAgICByZXR1cm4gZG9jLnJlbmRlcihjYilcbiAgfVxuXG4gIC8qKiogUmVuZGVyICoqKi9cblxuICAvLyByZWFkIGNvZGUgZnJvbSBhIERPTSBlbGVtZW50XG4gIGZ1bmN0aW9uIHJlYWRDb2RlKGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoXG4gICAgICB7XG4gICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIHZhciBodG1sID0gZWwuaW5uZXJIVE1MLnJlcGxhY2UoLzxicj5cXHM/fFxcbnxcXHJcXG58XFxyL2dpLCBcIlxcblwiKVxuICAgIHZhciBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpXG4gICAgcHJlLmlubmVySFRNTCA9IGh0bWxcbiAgICB2YXIgY29kZSA9IHByZS50ZXh0Q29udGVudFxuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcIlxcblwiLCBcIlwiKVxuICAgIH1cbiAgICByZXR1cm4gY29kZVxuICB9XG5cbiAgLy8gaW5zZXJ0ICdzdmcnIGludG8gJ2VsJywgd2l0aCBhcHByb3ByaWF0ZSB3cmFwcGVyIGVsZW1lbnRzXG4gIGZ1bmN0aW9uIHJlcGxhY2UoZWwsIHN2Zywgc2NyaXB0cywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpXG4gICAgICB2YXIgY2xzID0gXCJzY3JhdGNoYmxvY2tzIHNjcmF0Y2hibG9ja3MtaW5saW5lXCJcbiAgICAgIGlmIChzY3JpcHRzWzBdICYmICFzY3JpcHRzWzBdLmlzRW1wdHkpIHtcbiAgICAgICAgY2xzICs9IFwiIHNjcmF0Y2hibG9ja3MtaW5saW5lLVwiICsgc2NyaXB0c1swXS5ibG9ja3NbMF0uc2hhcGVcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSBjbHNcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIlxuICAgICAgY29udGFpbmVyLnN0eWxlLnZlcnRpY2FsQWxpZ24gPSBcIm1pZGRsZVwiXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJzY3JhdGNoYmxvY2tzXCJcbiAgICB9XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHN2ZylcblxuICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICBlbC5hcHBlbmRDaGlsZChjb250YWluZXIpXG4gIH1cblxuICAvKiBSZW5kZXIgYWxsIG1hdGNoaW5nIGVsZW1lbnRzIGluIHBhZ2UgdG8gc2hpbnkgc2NyYXRjaCBibG9ja3MuXG4gICAqIEFjY2VwdHMgYSBDU1Mgc2VsZWN0b3IgYXMgYW4gYXJndW1lbnQuXG4gICAqXG4gICAqICBzY3JhdGNoYmxvY2tzLnJlbmRlck1hdGNoaW5nKFwicHJlLmJsb2Nrc1wiKTtcbiAgICpcbiAgICogTGlrZSB0aGUgb2xkICdzY3JhdGNoYmxvY2tzMi5wYXJzZSgpLlxuICAgKi9cbiAgdmFyIHJlbmRlck1hdGNoaW5nID0gZnVuY3Rpb24oc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBcInByZS5ibG9ja3NcIlxuICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICBsYW5ndWFnZXM6IFtcImVuXCJdLFxuXG4gICAgICAgIHJlYWQ6IHJlYWRDb2RlLCAvLyBmdW5jdGlvbihlbCwgb3B0aW9ucykgPT4gY29kZVxuICAgICAgICBwYXJzZTogcGFyc2UsIC8vIGZ1bmN0aW9uKGNvZGUsIG9wdGlvbnMpID0+IGRvY1xuICAgICAgICByZW5kZXI6IHJlbmRlciwgLy8gZnVuY3Rpb24oZG9jLCBjYikgPT4gc3ZnXG4gICAgICAgIHJlcGxhY2U6IHJlcGxhY2UsIC8vIGZ1bmN0aW9uKGVsLCBzdmcsIGRvYywgb3B0aW9ucylcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgLy8gZmluZCBlbGVtZW50c1xuICAgIHZhciByZXN1bHRzID0gW10uc2xpY2UuYXBwbHkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpXG4gICAgcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICB2YXIgY29kZSA9IG9wdGlvbnMucmVhZChlbCwgb3B0aW9ucylcblxuICAgICAgdmFyIGRvYyA9IG9wdGlvbnMucGFyc2UoY29kZSwgb3B0aW9ucylcblxuICAgICAgb3B0aW9ucy5yZW5kZXIoZG9jLCBmdW5jdGlvbihzdmcpIHtcbiAgICAgICAgb3B0aW9ucy5yZXBsYWNlKGVsLCBzdmcsIGRvYywgb3B0aW9ucylcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qIFBhcnNlIHNjcmF0Y2hibG9ja3MgY29kZSBhbmQgcmV0dXJuIFhNTCBzdHJpbmcuXG4gICAqXG4gICAqIENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBOb2RlLCByZWFsbHkuXG4gICAqL1xuICB2YXIgcmVuZGVyU1ZHU3RyaW5nID0gZnVuY3Rpb24oY29kZSwgb3B0aW9ucykge1xuICAgIHZhciBkb2MgPSBwYXJzZShjb2RlLCBvcHRpb25zKVxuXG4gICAgLy8gV0FSTjogRG9jdW1lbnQucmVuZGVyKCkgbWF5IGJlY29tZSBhc3luYyBhZ2FpbiBpbiBmdXR1cmUgOi0oXG4gICAgZG9jLnJlbmRlcihmdW5jdGlvbigpIHt9KVxuXG4gICAgcmV0dXJuIGRvYy5leHBvcnRTVkdTdHJpbmcoKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhbGxMYW5ndWFnZXM6IGFsbExhbmd1YWdlcywgLy8gcmVhZC1vbmx5XG4gICAgbG9hZExhbmd1YWdlczogbG9hZExhbmd1YWdlcyxcblxuICAgIGZyb21KU09OOiBEb2N1bWVudC5mcm9tSlNPTixcbiAgICB0b0pTT046IGZ1bmN0aW9uKGRvYykge1xuICAgICAgcmV0dXJuIGRvYy50b0pTT04oKVxuICAgIH0sXG4gICAgc3RyaW5naWZ5OiBmdW5jdGlvbihkb2MpIHtcbiAgICAgIHJldHVybiBkb2Muc3RyaW5naWZ5KClcbiAgICB9LFxuXG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcblxuICAgIHJlYWQ6IHJlYWRDb2RlLFxuICAgIHBhcnNlOiBwYXJzZSxcbiAgICAvLyByZW5kZXI6IHJlbmRlciwgLy8gUkVNT1ZFRCBzaW5jZSBkb2MucmVuZGVyKGNiKSBtYWtlcyBtdWNoIG1vcmUgc2Vuc2VcbiAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgIHJlbmRlck1hdGNoaW5nOiByZW5kZXJNYXRjaGluZyxcblxuICAgIHJlbmRlclNWR1N0cmluZzogcmVuZGVyU1ZHU3RyaW5nLFxuICAgIG1ha2VTdHlsZTogc3R5bGUubWFrZVN0eWxlLFxuICB9XG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbiAgfVxuICBmdW5jdGlvbiBpc0FycmF5KG8pIHtcbiAgICByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheVxuICB9XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgZnVuY3Rpb24gaW5kZW50KHRleHQpIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFwiICBcIiArIGxpbmVcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblwiKVxuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVOdW1iZXIodikge1xuICAgIHYgPSBcIlwiICsgdlxuICAgIHZhciBuID0gcGFyc2VJbnQodilcbiAgICBpZiAoIWlzTmFOKG4pKSB7XG4gICAgICByZXR1cm4gblxuICAgIH1cbiAgICB2YXIgZiA9IHBhcnNlRmxvYXQodilcbiAgICBpZiAoIWlzTmFOKGYpKSB7XG4gICAgICByZXR1cm4gZlxuICAgIH1cbiAgICByZXR1cm4gdlxuICB9XG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoXCIuL2RyYXcuanNcIilcblxuICB2YXIge1xuICAgIGRlZmF1bHRGb250RmFtaWx5LFxuICAgIG1ha2VTdHlsZSxcbiAgICBtYWtlSWNvbnMsXG4gICAgZGFya1JlY3QsXG4gICAgYmV2ZWxGaWx0ZXIsXG4gICAgZGFya0ZpbHRlcixcbiAgICBkZXNhdHVyYXRlRmlsdGVyLFxuICB9ID0gcmVxdWlyZShcIi4vc3R5bGUuanNcIilcblxuICB2YXIge1xuICAgIGJsb2Nrc0J5U2VsZWN0b3IsXG4gICAgcGFyc2VTcGVjLFxuICAgIGlucHV0UGF0LFxuICAgIGljb25QYXQsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIHVuaWNvZGVJY29ucyxcbiAgICBlbmdsaXNoLFxuICAgIGJsb2NrTmFtZSxcbiAgfSA9IHJlcXVpcmUoXCIuL2Jsb2Nrcy5qc1wiKVxuXG4gIC8qIExhYmVsICovXG5cbiAgdmFyIExhYmVsID0gZnVuY3Rpb24odmFsdWUsIGNscykge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuY2xzID0gY2xzIHx8IFwiXCJcbiAgICB0aGlzLmVsID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gMTJcbiAgICB0aGlzLm1ldHJpY3MgPSBudWxsXG4gICAgdGhpcy54ID0gMFxuICB9XG4gIExhYmVsLnByb3RvdHlwZS5pc0xhYmVsID0gdHJ1ZVxuXG4gIExhYmVsLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gXCI8XCIgfHwgdGhpcy52YWx1ZSA9PT0gXCI+XCIpIHJldHVybiB0aGlzLnZhbHVlXG4gICAgcmV0dXJuIHRoaXMudmFsdWUucmVwbGFjZSgvKFs8PltcXF0oKXt9XSkvZywgXCJcXFxcJDFcIilcbiAgfVxuXG4gIExhYmVsLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxcbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMYWJlbC5wcm90b3R5cGUsIFwid2lkdGhcIiwge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXRyaWNzLndpZHRoXG4gICAgfSxcbiAgfSlcblxuICBMYWJlbC5tZXRyaWNzQ2FjaGUgPSB7fVxuICBMYWJlbC50b01lYXN1cmUgPSBbXVxuXG4gIExhYmVsLnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZVxuICAgIHZhciBjbHMgPSB0aGlzLmNsc1xuICAgIHRoaXMuZWwgPSBTVkcudGV4dCgwLCAxMCwgdmFsdWUsIHtcbiAgICAgIGNsYXNzOiBcInNiLWxhYmVsIFwiICsgY2xzLFxuICAgIH0pXG5cbiAgICB2YXIgY2FjaGUgPSBMYWJlbC5tZXRyaWNzQ2FjaGVbY2xzXVxuICAgIGlmICghY2FjaGUpIHtcbiAgICAgIGNhY2hlID0gTGFiZWwubWV0cmljc0NhY2hlW2Nsc10gPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNhY2hlLCB2YWx1ZSkpIHtcbiAgICAgIHRoaXMubWV0cmljcyA9IGNhY2hlW3ZhbHVlXVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZm9udCA9IC9zYi1jb21tZW50LWxhYmVsLy50ZXN0KHRoaXMuY2xzKVxuICAgICAgICA/IFwibm9ybWFsIDEycHggJ0hlbHZldGljYSBOZXVlJywgSGVsdmV0aWNhLCBzYW5zLXNlcmlmXCJcbiAgICAgICAgOiAvc2ItbGl0ZXJhbC8udGVzdCh0aGlzLmNscylcbiAgICAgICAgICA/IFwibm9ybWFsIDExcHggXCIgKyBkZWZhdWx0Rm9udEZhbWlseVxuICAgICAgICAgIDogXCJib2xkIDExcHggXCIgKyBkZWZhdWx0Rm9udEZhbWlseVxuICAgICAgdGhpcy5tZXRyaWNzID0gY2FjaGVbdmFsdWVdID0gTGFiZWwubWVhc3VyZSh2YWx1ZSwgZm9udClcbiAgICAgIC8vIFRPRE86IHdvcmQtc3BhY2luZz8gKGZvcnR1bmF0ZWx5IGl0IHNlZW1zIHRvIGhhdmUgbm8gZWZmZWN0ISlcbiAgICB9XG4gIH1cbiAgLy9UZXh0IGJveCBzY2FsaW5nXG4gIExhYmVsLm1lYXN1cmUgPSBmdW5jdGlvbih2YWx1ZSwgZm9udCkge1xuICAgIHZhciBjb250ZXh0ID0gTGFiZWwubWVhc3VyaW5nXG4gICAgY29udGV4dC5mb250ID0gZm9udFxuICAgIHZhciB0ZXh0TWV0cmljcyA9IGNvbnRleHQubWVhc3VyZVRleHQodmFsdWUpXG4gICAgdmFyIHdpZHRoID0gKHRleHRNZXRyaWNzLndpZHRoICsgMC41KSB8IDBcbiAgICByZXR1cm4geyB3aWR0aDogd2lkdGggfVxuICB9XG5cbiAgLyogSWNvbiAqL1xuXG4gIHZhciBJY29uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmlzQXJyb3cgPSBuYW1lID09PSBcImxvb3BBcnJvd1wiXG5cbiAgICB2YXIgaW5mbyA9IEljb24uaWNvbnNbbmFtZV1cbiAgICBhc3NlcnQoaW5mbywgXCJubyBpbmZvIGZvciBpY29uIFwiICsgbmFtZSlcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluZm8pXG4gIH1cbiAgSWNvbi5wcm90b3R5cGUuaXNJY29uID0gdHJ1ZVxuXG4gIEljb24ucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB1bmljb2RlSWNvbnNbXCJAXCIgKyB0aGlzLm5hbWVdIHx8IFwiXCJcbiAgfVxuXG4gIEljb24uaWNvbnMgPSB7XG4gICAgZ3JlZW5GbGFnOiB7IHdpZHRoOiA1LCBoZWlnaHQ6IDUsIGR5OiAtOCwgZHg6ICswIH0sIC8vL3dvcmtpbmcgb24gdGhpc1xuICAgIHR1cm5MZWZ0OiB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMiwgZHk6ICsxIH0sXG4gICAgdHVyblJpZ2h0OiB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMiwgZHk6ICsxIH0sXG4gICAgbG9vcEFycm93OiB7IHdpZHRoOiAxNCwgaGVpZ2h0OiAxMSB9LFxuICAgIGFkZElucHV0OiB7IHdpZHRoOiA0LCBoZWlnaHQ6IDggfSxcbiAgICBkZWxJbnB1dDogeyB3aWR0aDogNCwgaGVpZ2h0OiA4IH0sXG4gIH1cbiAgSWNvbi5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBTVkcuc3ltYm9sKFwiI1wiICsgdGhpcy5uYW1lLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgfSlcbiAgfVxuXG4gIC8qIElucHV0ICovXG5cbiAgdmFyIElucHV0ID0gZnVuY3Rpb24oc2hhcGUsIHZhbHVlLCBtZW51KSB7XG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5tZW51ID0gbWVudSB8fCBudWxsXG5cbiAgICB0aGlzLmlzUm91bmQgPSBzaGFwZSA9PT0gXCJudW1iZXJcIiB8fCBzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIlxuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgdGhpcy5pc1N0YWNrID0gc2hhcGUgPT09IFwic3RhY2tcIlxuICAgIHRoaXMuaXNJbnNldCA9XG4gICAgICBzaGFwZSA9PT0gXCJib29sZWFuXCIgfHwgc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgdGhpcy5pc0NvbG9yID0gc2hhcGUgPT09IFwiY29sb3JcIlxuICAgIHRoaXMuaGFzQXJyb3cgPSBzaGFwZSA9PT0gXCJkcm9wZG93blwiIHx8IHNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiIHx8IHNoYXBlID09PSBcInJvdW5kLWRyb3Bkb3duXCJcbiAgICB0aGlzLmlzRGFya2VyID1cbiAgICAgIHNoYXBlID09PSBcImJvb2xlYW5cIiB8fCBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImRyb3Bkb3duXCJcbiAgICB0aGlzLmlzU3F1YXJlID1cbiAgICAgIHNoYXBlID09PSBcInN0cmluZ1wiIHx8IHNoYXBlID09PSBcImNvbG9yXCIgfHwgc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuXG4gICAgdGhpcy5oYXNMYWJlbCA9ICEodGhpcy5pc0NvbG9yIHx8IHRoaXMuaXNJbnNldClcbiAgICB0aGlzLmxhYmVsID0gdGhpcy5oYXNMYWJlbFxuICAgICAgPyBuZXcgTGFiZWwodmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICAgIDogbnVsbFxuICAgIHRoaXMueCA9IDBcbiAgfVxuICBJbnB1dC5wcm90b3R5cGUuaXNJbnB1dCA9IHRydWVcblxuICBJbnB1dC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIHZhbHVlLCBwYXJ0KSB7XG4gICAgdmFyIHNoYXBlID0ge1xuICAgICAgYjogXCJib29sZWFuXCIsXG4gICAgICBuOiBcIm51bWJlclwiLFxuICAgICAgczogXCJzdHJpbmdcIixcbiAgICAgIGQ6IFwibnVtYmVyLWRyb3Bkb3duXCIsXG4gICAgICBtOiBcImRyb3Bkb3duXCIsXG4gICAgICBjOiBcImNvbG9yXCIsXG4gICAgICByOiBcInJvdW5kLWRyb3Bkb3duXCIsXG4gICAgfVtwYXJ0WzFdXVxuXG4gICAgaWYgKHNoYXBlID09PSBcImNvbG9yXCIpIHtcbiAgICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApXG4gICAgICAgIHZhbHVlID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDI1NiAqIDI1NiAqIDI1NilcbiAgICAgIHZhbHVlID0gK3ZhbHVlXG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgICAgIHZhciBoZXggPSB2YWx1ZS50b1N0cmluZygxNilcbiAgICAgIGhleCA9IGhleC5zbGljZShNYXRoLm1heCgwLCBoZXgubGVuZ3RoIC0gNikpIC8vIGxhc3QgNiBjaGFyYWN0ZXJzXG4gICAgICB3aGlsZSAoaGV4Lmxlbmd0aCA8IDYpIGhleCA9IFwiMFwiICsgaGV4XG4gICAgICBpZiAoaGV4WzBdID09PSBoZXhbMV0gJiYgaGV4WzJdID09PSBoZXhbM10gJiYgaGV4WzRdID09PSBoZXhbNV0pIHtcbiAgICAgICAgaGV4ID0gaGV4WzBdICsgaGV4WzJdICsgaGV4WzRdXG4gICAgICB9XG4gICAgICB2YWx1ZSA9IFwiI1wiICsgaGV4XG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICB2YWx1ZSA9XG4gICAgICAgIHtcbiAgICAgICAgICBfbW91c2VfOiBcIm1vdXNlLXBvaW50ZXJcIixcbiAgICAgICAgICBfbXlzZWxmXzogXCJteXNlbGZcIixcbiAgICAgICAgICBfc3RhZ2VfOiBcIlN0YWdlXCIsXG4gICAgICAgICAgX2VkZ2VfOiBcImVkZ2VcIixcbiAgICAgICAgICBfcmFuZG9tXzogXCJyYW5kb20gcG9zaXRpb25cIixcbiAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIHZhciBtZW51ID0gdmFsdWVcbiAgICAgIHZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIikge1xuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IElucHV0KHNoYXBlLCBcIlwiICsgdmFsdWUsIG1lbnUpXG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgYXNzZXJ0KHRoaXMudmFsdWVbMF0gPT09IFwiI1wiKVxuICAgICAgdmFyIGggPSB0aGlzLnZhbHVlLnNsaWNlKDEpXG4gICAgICBpZiAoaC5sZW5ndGggPT09IDMpIGggPSBoWzBdICsgaFswXSArIGhbMV0gKyBoWzFdICsgaFsyXSArIGhbMl1cbiAgICAgIHJldHVybiBwYXJzZUludChoLCAxNilcbiAgICAgIC8vIFRPRE8gc2lnbmVkIGludD9cbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlXG4gICAgICBpZiAodGhpcy5zaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICAgIHZhbHVlID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm1vdXNlLXBvaW50ZXJcIjogXCJfbW91c2VfXCIsXG4gICAgICAgICAgICBteXNlbGY6IFwiX215c2VsZlwiLFxuICAgICAgICAgICAgU3RhZ2U6IFwiX3N0YWdlX1wiLFxuICAgICAgICAgICAgZWRnZTogXCJfZWRnZV9cIixcbiAgICAgICAgICAgIFwicmFuZG9tIHBvc2l0aW9uXCI6IFwiX3JhbmRvbV9cIixcbiAgICAgICAgICB9W3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNSb3VuZCkge1xuICAgICAgICB2YWx1ZSA9IG1heWJlTnVtYmVyKHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlzQm9vbGVhblxuICAgICAgPyBmYWxzZVxuICAgICAgOiB0aGlzLmlzUm91bmQgPyBtYXliZU51bWJlcih0aGlzLnZhbHVlKSA6IHRoaXMudmFsdWVcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc0NvbG9yKSB7XG4gICAgICBhc3NlcnQodGhpcy52YWx1ZVswXSA9PT0gXCIjXCIpXG4gICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLnZhbHVlICsgXCJdXCJcbiAgICB9XG4gICAgdmFyIHRleHQgPSAodGhpcy52YWx1ZSA/IFwiXCIgKyB0aGlzLnZhbHVlIDogXCJcIilcbiAgICAgIC5yZXBsYWNlKC8gdiQvLCBcIiBcXFxcdlwiKVxuICAgICAgLnJlcGxhY2UoLyhbXFxdXFxcXF0pL2csIFwiXFxcXCQxXCIpXG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHRleHQgKz0gXCIgdlwiXG4gICAgcmV0dXJuIHRoaXMuaXNSb3VuZFxuICAgICAgPyBcIihcIiArIHRleHQgKyBcIilcIlxuICAgICAgOiB0aGlzLmlzU3F1YXJlXG4gICAgICAgID8gXCJbXCIgKyB0ZXh0ICsgXCJdXCJcbiAgICAgICAgOiB0aGlzLmlzQm9vbGVhbiA/IFwiPD5cIiA6IHRoaXMuaXNTdGFjayA/IFwie31cIiA6IHRleHRcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlXG4gICAgICB0aGlzLnZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHRoaXMudmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICB9XG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB0aGlzLmxhYmVsLm1lYXN1cmUoKVxuICB9XG5cbiAgSW5wdXQuc2hhcGVzID0ge1xuICAgIHN0cmluZzogU1ZHLnJvdW5kZWRSZWN0MixcbiAgICBudW1iZXI6IFNWRy5yb3VuZGVkUmVjdDIsXG4gICAgXCJudW1iZXItZHJvcGRvd25cIjogU1ZHLnJvdW5kZWRSZWN0MixcbiAgICBjb2xvcjogU1ZHLnJvdW5kZWRSZWN0MixcbiAgICBkcm9wZG93bjogU1ZHLnJlY3QsXG5cbiAgICBib29sZWFuOiBTVkcucG9pbnRlZFJlY3QsXG4gICAgc3RhY2s6IFNWRy5zdGFja1JlY3QsXG4gICAgcmVwb3J0ZXI6IFNWRy5yb3VuZGVkUmVjdCxcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHtcbiAgICAgIHZhciBsYWJlbCA9IHRoaXMubGFiZWwuZHJhdygpXG4gICAgICB2YXIgdyA9IE1hdGgubWF4KFxuICAgICAgICAxNCxcbiAgICAgICAgdGhpcy5sYWJlbC53aWR0aCArXG4gICAgICAgICAgKHRoaXMuc2hhcGUgPT09IFwic3RyaW5nXCIgfHwgdGhpcy5zaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIiA/IDYgOiA5KVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdyA9IHRoaXMuaXNJbnNldCA/IDMwIDogdGhpcy5pc0NvbG9yID8gMTMgOiBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB3ICs9IDEwXG4gICAgdGhpcy53aWR0aCA9IHdcblxuICAgIHZhciBoID0gKHRoaXMuaGVpZ2h0ID0gdGhpcy5pc1JvdW5kIHx8IHRoaXMuaXNDb2xvciA/IDEzIDogMTQpXG5cbiAgICB2YXIgZWwgPSBJbnB1dC5zaGFwZXNbdGhpcy5zaGFwZV0odywgaClcbiAgICBpZiAodGhpcy5pc0NvbG9yKSB7XG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgZmlsbDogdGhpcy52YWx1ZSxcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh0aGlzLmlzRGFya2VyKSB7XG4gICAgICBlbCA9IGRhcmtSZWN0KHcsIGgsIHBhcmVudC5pbmZvLmNhdGVnb3J5LCBlbClcbiAgICAgIGlmIChwYXJlbnQuaW5mby5jb2xvcikge1xuICAgICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgICBmaWxsOiBwYXJlbnQuaW5mby5jb2xvcixcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gU1ZHLmdyb3VwKFtcbiAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICBjbGFzczogW1wic2ItaW5wdXRcIiwgXCJzYi1pbnB1dC1cIiArIHRoaXMuc2hhcGVdLmpvaW4oXCIgXCIpLFxuICAgICAgfSksXG4gICAgXSlcbiAgICBpZiAodGhpcy5oYXNMYWJlbCkge1xuICAgICAgdmFyIHggPSB0aGlzLmlzUm91bmQgPyA1IDogNFxuICAgICAgcmVzdWx0LmFwcGVuZENoaWxkKFNWRy5tb3ZlKHgsIDAsIGxhYmVsKSlcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB5ID0gdGhpcy5zaGFwZSA9PT0gXCJkcm9wZG93blwiID8gNSA6IDRcbiAgICAgIHJlc3VsdC5hcHBlbmRDaGlsZChcbiAgICAgICAgU1ZHLm1vdmUoXG4gICAgICAgICAgdyAtIDEwLFxuICAgICAgICAgIHksXG4gICAgICAgICAgU1ZHLnBvbHlnb24oe1xuICAgICAgICAgICAgcG9pbnRzOiBbNywgMCwgMy41LCA0LCAwLCAwXSxcbiAgICAgICAgICAgIGZpbGw6IFwiI0ZGRlwiLFxuICAgICAgICAgICAgb3BhY2l0eTogXCIwLjZcIixcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qIEJsb2NrICovXG5cbiAgdmFyIEJsb2NrID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGNvbW1lbnQpIHtcbiAgICBhc3NlcnQoaW5mbylcbiAgICB0aGlzLmluZm8gPSBpbmZvXG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgdGhpcy5jb21tZW50ID0gY29tbWVudCB8fCBudWxsXG4gICAgdGhpcy5kaWZmID0gbnVsbFxuXG4gICAgdmFyIHNoYXBlID0gdGhpcy5pbmZvLnNoYXBlXG4gICAgdGhpcy5pc0hhdCA9IHNoYXBlID09PSBcImhhdFwiIHx8IHNoYXBlID09PSBcImRlZmluZS1oYXRcIlxuICAgIHRoaXMuaGFzUHV6emxlID0gc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJoYXRcIlxuICAgIHRoaXMuaXNGaW5hbCA9IC9jYXAvLnRlc3Qoc2hhcGUpXG4gICAgdGhpcy5pc0NvbW1hbmQgPSBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImNhcFwiIHx8IC9ibG9jay8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzT3V0bGluZSA9IHNoYXBlID09PSBcIm91dGxpbmVcIlxuICAgIHRoaXMuaXNSZXBvcnRlciA9IHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICB0aGlzLmlzQm9vbGVhbiA9IHNoYXBlID09PSBcImJvb2xlYW5cIlxuXG4gICAgdGhpcy5pc1JpbmcgPSBzaGFwZSA9PT0gXCJyaW5nXCJcbiAgICB0aGlzLmhhc1NjcmlwdCA9IC9ibG9jay8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzRWxzZSA9IHNoYXBlID09PSBcImNlbHNlXCJcbiAgICB0aGlzLmlzRW5kID0gc2hhcGUgPT09IFwiY2VuZFwiXG5cbiAgICB0aGlzLnggPSAwXG4gICAgdGhpcy53aWR0aCA9IG51bGxcbiAgICB0aGlzLmhlaWdodCA9IG51bGxcbiAgICB0aGlzLmZpcnN0TGluZSA9IG51bGxcbiAgICB0aGlzLmlubmVyV2lkdGggPSBudWxsXG4gIH1cbiAgQmxvY2sucHJvdG90eXBlLmlzQmxvY2sgPSB0cnVlXG5cbiAgQmxvY2suZnJvbUpTT04gPSBmdW5jdGlvbihsYW5nLCBhcnJheSwgcGFydCkge1xuICAgIHZhciBhcmdzID0gYXJyYXkuc2xpY2UoKVxuICAgIHZhciBzZWxlY3RvciA9IGFyZ3Muc2hpZnQoKVxuICAgIGlmIChzZWxlY3RvciA9PT0gXCJwcm9jRGVmXCIpIHtcbiAgICAgIHZhciBzcGVjID0gYXJnc1swXVxuICAgICAgdmFyIGlucHV0TmFtZXMgPSBhcmdzWzFdLnNsaWNlKClcbiAgICAgIC8vIHZhciBkZWZhdWx0VmFsdWVzID0gYXJnc1syXTtcbiAgICAgIC8vIHZhciBpc0F0b21pYyA9IGFyZ3NbM107IC8vIFRPRE9cblxuICAgICAgdmFyIGluZm8gPSBwYXJzZVNwZWMoc3BlYylcbiAgICAgIHZhciBjaGlsZHJlbiA9IGluZm8ucGFydHMubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgaWYgKGlucHV0UGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgICB2YXIgbGFiZWwgPSBuZXcgTGFiZWwoaW5wdXROYW1lcy5zaGlmdCgpKVxuICAgICAgICAgIHJldHVybiBuZXcgQmxvY2soXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNoYXBlOiBwYXJ0WzFdID09PSBcImJcIiA/IFwiYm9vbGVhblwiIDogXCJyZXBvcnRlclwiLFxuICAgICAgICAgICAgICBjYXRlZ29yeTogXCJjdXN0b20tYXJnXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgW2xhYmVsXVxuICAgICAgICAgIClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IExhYmVsKHBhcnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB2YXIgb3V0bGluZSA9IG5ldyBCbG9jayhcbiAgICAgICAge1xuICAgICAgICAgIHNoYXBlOiBcIm91dGxpbmVcIixcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcblxuICAgICAgdmFyIGNoaWxkcmVuID0gW25ldyBMYWJlbChsYW5nLmRlZmluZVswXSksIG91dGxpbmVdXG4gICAgICByZXR1cm4gbmV3IEJsb2NrKFxuICAgICAgICB7XG4gICAgICAgICAgc2hhcGU6IFwiZGVmaW5lLWhhdFwiLFxuICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbVwiLFxuICAgICAgICAgIHNlbGVjdG9yOiBcInByb2NEZWZcIixcbiAgICAgICAgICBjYWxsOiBzcGVjLFxuICAgICAgICAgIG5hbWVzOiBhcmdzWzFdLFxuICAgICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoc2VsZWN0b3IgPT09IFwiY2FsbFwiKSB7XG4gICAgICB2YXIgc3BlYyA9IGFyZ3Muc2hpZnQoKVxuICAgICAgdmFyIGluZm8gPSBleHRlbmQocGFyc2VTcGVjKHNwZWMpLCB7XG4gICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbVwiLFxuICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgICBzZWxlY3RvcjogXCJjYWxsXCIsXG4gICAgICAgIGNhbGw6IHNwZWMsXG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfSlcbiAgICAgIHZhciBwYXJ0cyA9IGluZm8ucGFydHNcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgc2VsZWN0b3IgPT09IFwicmVhZFZhcmlhYmxlXCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImNvbnRlbnRzT2ZMaXN0OlwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiXG4gICAgKSB7XG4gICAgICB2YXIgc2hhcGUgPVxuICAgICAgICBzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiICYmIGFyZ3MucG9wKCkgPT09IFwiYlwiID8gXCJib29sZWFuXCIgOiBcInJlcG9ydGVyXCJcbiAgICAgIHZhciBpbmZvID0ge1xuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgIHNoYXBlOiBzaGFwZSxcbiAgICAgICAgY2F0ZWdvcnk6IHtcbiAgICAgICAgICByZWFkVmFyaWFibGU6IFwidmFyaWFibGVzXCIsXG4gICAgICAgICAgXCJjb250ZW50c09mTGlzdDpcIjogXCJsaXN0XCIsXG4gICAgICAgICAgZ2V0UGFyYW06IFwiY3VzdG9tLWFyZ1wiLFxuICAgICAgICB9W3NlbGVjdG9yXSxcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IEJsb2NrKGluZm8sIFtuZXcgTGFiZWwoYXJnc1swXSldKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaW5mbyA9IGV4dGVuZChibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yXSwge1xuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH0pXG4gICAgICBhc3NlcnQoaW5mbywgXCJ1bmtub3duIHNlbGVjdG9yOiBcIiArIHNlbGVjdG9yKVxuICAgICAgdmFyIHNwZWMgPSBsYW5nLmNvbW1hbmRzW2luZm8uc3BlY10gfHwgc3BlY1xuICAgICAgdmFyIHBhcnRzID0gc3BlYyA/IHBhcnNlU3BlYyhzcGVjKS5wYXJ0cyA6IGluZm8ucGFydHNcbiAgICB9XG4gICAgdmFyIGNoaWxkcmVuID0gcGFydHMubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgIGlmIChpbnB1dFBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmdzLnNoaWZ0KClcbiAgICAgICAgcmV0dXJuIChpc0FycmF5KGFyZykgPyBCbG9jayA6IElucHV0KS5mcm9tSlNPTihsYW5nLCBhcmcsIHBhcnQpXG4gICAgICB9IGVsc2UgaWYgKGljb25QYXQudGVzdChwYXJ0KSkge1xuICAgICAgICByZXR1cm4gbmV3IEljb24ocGFydC5zbGljZSgxKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTGFiZWwocGFydC50cmltKCkpXG4gICAgICB9XG4gICAgfSlcbiAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24obGlzdCwgaW5kZXgpIHtcbiAgICAgIGxpc3QgPSBsaXN0IHx8IFtdXG4gICAgICBhc3NlcnQoaXNBcnJheShsaXN0KSlcbiAgICAgIGNoaWxkcmVuLnB1c2gobmV3IFNjcmlwdChsaXN0Lm1hcChCbG9jay5mcm9tSlNPTi5iaW5kKG51bGwsIGxhbmcpKSkpXG4gICAgICBpZiAoc2VsZWN0b3IgPT09IFwiZG9JZkVsc2VcIiAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbChsYW5nLmNvbW1hbmRzW1wiZWxzZVwiXSkpXG4gICAgICB9XG4gICAgfSlcbiAgICAvLyBUT0RPIGxvb3AgYXJyb3dzXG4gICAgcmV0dXJuIG5ldyBCbG9jayhpbmZvLCBjaGlsZHJlbilcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLmluZm8uc2VsZWN0b3JcbiAgICB2YXIgYXJncyA9IFtdXG5cbiAgICBpZiAoc2VsZWN0b3IgPT09IFwicHJvY0RlZlwiKSB7XG4gICAgICB2YXIgaW5wdXROYW1lcyA9IHRoaXMuaW5mby5uYW1lc1xuICAgICAgdmFyIHNwZWMgPSB0aGlzLmluZm8uY2FsbFxuICAgICAgdmFyIGluZm8gPSBwYXJzZVNwZWMoc3BlYylcbiAgICAgIHZhciBkZWZhdWx0VmFsdWVzID0gaW5mby5pbnB1dHMubWFwKGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dCA9PT0gXCIlblwiID8gMSA6IGlucHV0ID09PSBcIiViXCIgPyBmYWxzZSA6IFwiXCJcbiAgICAgIH0pXG4gICAgICB2YXIgaXNBdG9taWMgPSBmYWxzZSAvLyBUT0RPICdkZWZpbmUtYXRvbWljJyA/P1xuICAgICAgcmV0dXJuIFtcInByb2NEZWZcIiwgc3BlYywgaW5wdXROYW1lcywgZGVmYXVsdFZhbHVlcywgaXNBdG9taWNdXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgc2VsZWN0b3IgPT09IFwicmVhZFZhcmlhYmxlXCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImNvbnRlbnRzT2ZMaXN0OlwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiXG4gICAgKSB7XG4gICAgICBhcmdzLnB1c2goYmxvY2tOYW1lKHRoaXMpKVxuICAgICAgaWYgKHNlbGVjdG9yID09PSBcImdldFBhcmFtXCIpXG4gICAgICAgIGFyZ3MucHVzaCh0aGlzLmlzQm9vbGVhbiA9PT0gXCJib29sZWFuXCIgPyBcImJcIiA6IFwiclwiKVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXVxuICAgICAgICBpZiAoY2hpbGQuaXNJbnB1dCB8fCBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzU2NyaXB0KSB7XG4gICAgICAgICAgYXJncy5wdXNoKGNoaWxkLnRvSlNPTigpKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvciA9PT0gXCJjYWxsXCIpIHtcbiAgICAgICAgcmV0dXJuIFtcImNhbGxcIiwgdGhpcy5pbmZvLmNhbGxdLmNvbmNhdChhcmdzKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNlbGVjdG9yKSB0aHJvdyBcInVua25vd24gYmxvY2s6IFwiICsgdGhpcy5pbmZvLmhhc2hcbiAgICByZXR1cm4gW3NlbGVjdG9yXS5jb25jYXQoYXJncylcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbihleHRyYXMpIHtcbiAgICB2YXIgZmlyc3RJbnB1dCA9IG51bGxcbiAgICB2YXIgY2hlY2tBbGlhcyA9IGZhbHNlXG4gICAgdmFyIHRleHQgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZC5pc0ljb24pIGNoZWNrQWxpYXMgPSB0cnVlXG4gICAgICAgIGlmICghZmlyc3RJbnB1dCAmJiAhKGNoaWxkLmlzTGFiZWwgfHwgY2hpbGQuaXNJY29uKSkgZmlyc3RJbnB1dCA9IGNoaWxkXG4gICAgICAgIHJldHVybiBjaGlsZC5pc1NjcmlwdFxuICAgICAgICAgID8gXCJcXG5cIiArIGluZGVudChjaGlsZC5zdHJpbmdpZnkoKSkgKyBcIlxcblwiXG4gICAgICAgICAgOiBjaGlsZC5zdHJpbmdpZnkoKS50cmltKCkgKyBcIiBcIlxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXCIpXG4gICAgICAudHJpbSgpXG5cbiAgICB2YXIgbGFuZyA9IHRoaXMuaW5mby5sYW5ndWFnZVxuICAgIGlmIChjaGVja0FsaWFzICYmIGxhbmcgJiYgdGhpcy5pbmZvLnNlbGVjdG9yKSB7XG4gICAgICB2YXIgdHlwZSA9IGJsb2Nrc0J5U2VsZWN0b3JbdGhpcy5pbmZvLnNlbGVjdG9yXVxuICAgICAgdmFyIHNwZWMgPSB0eXBlLnNwZWNcbiAgICAgIHZhciBhbGlhcyA9IGxhbmcubmF0aXZlQWxpYXNlc1t0eXBlLnNwZWNdXG4gICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgLy8gVE9ETyBtYWtlIHRyYW5zbGF0ZSgpIG5vdCBpbi1wbGFjZSwgYW5kIHVzZSB0aGF0XG4gICAgICAgIGlmIChpbnB1dFBhdC50ZXN0KGFsaWFzKSAmJiBmaXJzdElucHV0KSB7XG4gICAgICAgICAgYWxpYXMgPSBhbGlhcy5yZXBsYWNlKGlucHV0UGF0LCBmaXJzdElucHV0LnN0cmluZ2lmeSgpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGlhc1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBvdmVycmlkZXMgPSBleHRyYXMgfHwgXCJcIlxuICAgIGlmIChcbiAgICAgICh0aGlzLmluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiB0aGlzLmlzUmVwb3J0ZXIpIHx8XG4gICAgICAodGhpcy5pbmZvLmNhdGVnb3J5ID09PSBcImN1c3RvbS1hcmdcIiAmJlxuICAgICAgICAodGhpcy5pc1JlcG9ydGVyIHx8IHRoaXMuaXNCb29sZWFuKSkgfHxcbiAgICAgICh0aGlzLmluZm8uY2F0ZWdvcnkgPT09IFwiY3VzdG9tXCIgJiYgdGhpcy5pbmZvLnNoYXBlID09PSBcInN0YWNrXCIpXG4gICAgKSB7XG4gICAgICBpZiAob3ZlcnJpZGVzKSBvdmVycmlkZXMgKz0gXCIgXCJcbiAgICAgIG92ZXJyaWRlcyArPSB0aGlzLmluZm8uY2F0ZWdvcnlcbiAgICB9XG4gICAgaWYgKG92ZXJyaWRlcykge1xuICAgICAgdGV4dCArPSBcIiA6OiBcIiArIG92ZXJyaWRlc1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5oYXNTY3JpcHRcbiAgICAgID8gdGV4dCArIFwiXFxuZW5kXCJcbiAgICAgIDogdGhpcy5pbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgPyBcIihcIiArIHRleHQgKyBcIilcIlxuICAgICAgICA6IHRoaXMuaW5mby5zaGFwZSA9PT0gXCJib29sZWFuXCIgPyBcIjxcIiArIHRleHQgKyBcIj5cIiA6IHRleHRcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nLCBpc1NoYWxsb3cpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLmluZm8uc2VsZWN0b3JcbiAgICBpZiAoIXNlbGVjdG9yKSByZXR1cm5cbiAgICBpZiAoc2VsZWN0b3IgPT09IFwicHJvY0RlZlwiKSB7XG4gICAgICBhc3NlcnQodGhpcy5jaGlsZHJlblswXS5pc0xhYmVsKVxuICAgICAgdGhpcy5jaGlsZHJlblswXSA9IG5ldyBMYWJlbChsYW5nLmRlZmluZVswXSB8fCBlbmdsaXNoLmRlZmluZVswXSlcbiAgICB9XG4gICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTZWxlY3RvcltzZWxlY3Rvcl1cbiAgICBpZiAoIWJsb2NrKSByZXR1cm5cbiAgICB2YXIgbmF0aXZlU3BlYyA9IGxhbmcuY29tbWFuZHNbYmxvY2suc3BlY11cbiAgICBpZiAoIW5hdGl2ZVNwZWMpIHJldHVyblxuICAgIHZhciBuYXRpdmVJbmZvID0gcGFyc2VTcGVjKG5hdGl2ZVNwZWMpXG4gICAgdmFyIGFyZ3MgPSB0aGlzLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbihjaGlsZCkge1xuICAgICAgcmV0dXJuICFjaGlsZC5pc0xhYmVsICYmICFjaGlsZC5pc0ljb25cbiAgICB9KVxuICAgIGlmICghaXNTaGFsbG93KVxuICAgICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGNoaWxkLnRyYW5zbGF0ZShsYW5nKVxuICAgICAgfSlcbiAgICB0aGlzLmNoaWxkcmVuID0gbmF0aXZlSW5mby5wYXJ0c1xuICAgICAgLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgIHZhciBwYXJ0ID0gcGFydC50cmltKClcbiAgICAgICAgaWYgKCFwYXJ0KSByZXR1cm5cbiAgICAgICAgcmV0dXJuIGlucHV0UGF0LnRlc3QocGFydClcbiAgICAgICAgICA/IGFyZ3Muc2hpZnQoKVxuICAgICAgICAgIDogaWNvblBhdC50ZXN0KHBhcnQpID8gbmV3IEljb24ocGFydC5zbGljZSgxKSkgOiBuZXcgTGFiZWwocGFydClcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgIGFyZ3MuZm9yRWFjaChcbiAgICAgIGZ1bmN0aW9uKGFyZykge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goYXJnKVxuICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKVxuICAgIHRoaXMuaW5mby5sYW5ndWFnZSA9IGxhbmdcbiAgICB0aGlzLmluZm8uaXNSVEwgPSBydGxMYW5ndWFnZXMuaW5kZXhPZihsYW5nLmNvZGUpID4gLTFcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldXG4gICAgICBpZiAoY2hpbGQubWVhc3VyZSkgY2hpbGQubWVhc3VyZSgpXG4gICAgfVxuICAgIGlmICh0aGlzLmNvbW1lbnQpIHRoaXMuY29tbWVudC5tZWFzdXJlKClcbiAgfVxuXG4gIEJsb2NrLnNoYXBlcyA9IHtcbiAgICBzdGFjazogU1ZHLnN0YWNrUmVjdCxcbiAgICBcImMtYmxvY2tcIjogU1ZHLnN0YWNrUmVjdCxcbiAgICBcImlmLWJsb2NrXCI6IFNWRy5zdGFja1JlY3QsXG4gICAgY2Vsc2U6IFNWRy5zdGFja1JlY3QsXG4gICAgY2VuZDogU1ZHLnN0YWNrUmVjdCxcblxuICAgIGNhcDogU1ZHLmNhcFJlY3QsXG4gICAgcmVwb3J0ZXI6IFNWRy5yb3VuZGVkUmVjdCxcbiAgICBib29sZWFuOiBTVkcucG9pbnRlZFJlY3QsXG4gICAgaGF0OiBTVkcuaGF0UmVjdCxcbiAgICBcImRlZmluZS1oYXRcIjogU1ZHLnByb2NIYXRSZWN0LFxuICAgIHJpbmc6IFNWRy5yb3VuZGVkUmVjdCxcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uKHcsIGgsIGxpbmVzKSB7XG4gICAgLy8gbW91dGhzXG4gICAgaWYgKGxpbmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiBTVkcubW91dGhSZWN0KHcsIGgsIHRoaXMuaXNGaW5hbCwgbGluZXMsIHtcbiAgICAgICAgY2xhc3M6IFtcInNiLVwiICsgdGhpcy5pbmZvLmNhdGVnb3J5LCBcInNiLWJldmVsXCJdLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBvdXRsaW5lc1xuICAgIGlmICh0aGlzLmluZm8uc2hhcGUgPT09IFwib3V0bGluZVwiKSB7XG4gICAgICByZXR1cm4gU1ZHLnNldFByb3BzKFNWRy5zdGFja1JlY3QodywgaCksIHtcbiAgICAgICAgY2xhc3M6IFwic2Itb3V0bGluZVwiLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyByaW5nc1xuICAgIGlmICh0aGlzLmlzUmluZykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlblswXVxuICAgICAgaWYgKGNoaWxkICYmIChjaGlsZC5pc0lucHV0IHx8IGNoaWxkLmlzQmxvY2sgfHwgY2hpbGQuaXNTY3JpcHQpKSB7XG4gICAgICAgIHZhciBzaGFwZSA9IGNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgPyBcInN0YWNrXCJcbiAgICAgICAgICA6IGNoaWxkLmlzSW5wdXQgPyBjaGlsZC5zaGFwZSA6IGNoaWxkLmluZm8uc2hhcGVcbiAgICAgICAgcmV0dXJuIFNWRy5yaW5nUmVjdCh3LCBoLCBjaGlsZC55LCBjaGlsZC53aWR0aCwgY2hpbGQuaGVpZ2h0LCBzaGFwZSwge1xuICAgICAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZnVuYyA9IEJsb2NrLnNoYXBlc1t0aGlzLmluZm8uc2hhcGVdXG4gICAgYXNzZXJ0KGZ1bmMsIFwibm8gc2hhcGUgZnVuYzogXCIgKyB0aGlzLmluZm8uc2hhcGUpXG4gICAgcmV0dXJuIGZ1bmModywgaCwge1xuICAgICAgY2xhc3M6IFtcInNiLVwiICsgdGhpcy5pbmZvLmNhdGVnb3J5LCBcInNiLWJldmVsXCJdLmpvaW4oXCIgXCIpLFxuICAgIH0pXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUubWluRGlzdGFuY2UgPSBmdW5jdGlvbihjaGlsZCkge1xuICAgIGlmICh0aGlzLmlzQm9vbGVhbikge1xuICAgICAgcmV0dXJuIGNoaWxkLmlzUmVwb3J0ZXJcbiAgICAgICAgPyAoNCArIGNoaWxkLmhlaWdodCAvIDQpIHwgMFxuICAgICAgICA6IGNoaWxkLmlzTGFiZWxcbiAgICAgICAgICA/ICg1ICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgICAgICAgOiBjaGlsZC5pc0Jvb2xlYW4gfHwgY2hpbGQuc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgICAgICAgICA/IDVcbiAgICAgICAgICAgIDogKDIgKyBjaGlsZC5oZWlnaHQgLyAyKSB8IDBcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNSZXBvcnRlcikge1xuICAgICAgcmV0dXJuIChjaGlsZC5pc0lucHV0ICYmIGNoaWxkLmlzUm91bmQpIHx8XG4gICAgICAgICgoY2hpbGQuaXNSZXBvcnRlciB8fCBjaGlsZC5pc0Jvb2xlYW4pICYmICFjaGlsZC5oYXNTY3JpcHQpXG4gICAgICAgID8gMFxuICAgICAgICA6IGNoaWxkLmlzTGFiZWxcbiAgICAgICAgICA/ICgyICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgICAgICAgOiAoLTIgKyBjaGlsZC5oZWlnaHQgLyAyKSB8IDBcbiAgICB9XG4gICAgcmV0dXJuIDBcbiAgfVxuXG4gIEJsb2NrLnBhZGRpbmcgPSB7XG4gICAgaGF0OiBbMjAsIDYsIDhdLFxuICAgIFwiZGVmaW5lLWhhdFwiOiBbMjAsIDgsIDEwXSxcbiAgICByZXBvcnRlcjogWzUsIDMsIDJdLFxuICAgIGJvb2xlYW46IFs1LCAyLCAyXSxcbiAgICBjYXA6IFsxMSwgNiwgNl0sXG4gICAgXCJjLWJsb2NrXCI6IFs4LCA2LCA1XSxcbiAgICBcImlmLWJsb2NrXCI6IFs4LCA2LCA1XSxcbiAgICByaW5nOiBbMTAsIDQsIDEwXSxcbiAgICBudWxsOiBbMTEsIDYsIDZdLFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNEZWZpbmUgPSB0aGlzLmluZm8uc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlblxuXG4gICAgdmFyIHBhZGRpbmcgPSBCbG9jay5wYWRkaW5nW3RoaXMuaW5mby5zaGFwZV0gfHwgQmxvY2sucGFkZGluZ1tudWxsXVxuICAgIHZhciBwdCA9IHBhZGRpbmdbMF0sXG4gICAgICBweCA9IHBhZGRpbmdbMV0sXG4gICAgICBwYiA9IHBhZGRpbmdbMl1cblxuICAgIHZhciB5ID0gMFxuICAgIHZhciBMaW5lID0gZnVuY3Rpb24oeSkge1xuICAgICAgdGhpcy55ID0geVxuICAgICAgdGhpcy53aWR0aCA9IDBcbiAgICAgIHRoaXMuaGVpZ2h0ID0geSA/IDEzIDogMTZcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIH1cblxuICAgIHZhciBpbm5lcldpZHRoID0gMFxuICAgIHZhciBzY3JpcHRXaWR0aCA9IDBcbiAgICB2YXIgbGluZSA9IG5ldyBMaW5lKHkpXG4gICAgZnVuY3Rpb24gcHVzaExpbmUoaXNMYXN0KSB7XG4gICAgICBpZiAobGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IHB0ICsgcGJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IGlzTGFzdCA/IDAgOiArMlxuICAgICAgICBsaW5lLnkgLT0gMVxuICAgICAgfVxuICAgICAgeSArPSBsaW5lLmhlaWdodFxuICAgICAgbGluZXMucHVzaChsaW5lKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZm8uaXNSVEwpIHtcbiAgICAgIHZhciBzdGFydCA9IDBcbiAgICAgIHZhciBmbGlwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW5cbiAgICAgICAgICAuc2xpY2UoMCwgc3RhcnQpXG4gICAgICAgICAgLmNvbmNhdChjaGlsZHJlbi5zbGljZShzdGFydCwgaSkucmV2ZXJzZSgpKVxuICAgICAgICAgIC5jb25jYXQoY2hpbGRyZW4uc2xpY2UoaSkpXG4gICAgICB9LmJpbmQodGhpcylcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuW2ldLmlzU2NyaXB0KSB7XG4gICAgICAgICAgZmxpcCgpXG4gICAgICAgICAgc3RhcnQgPSBpICsgMVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhcnQgPCBpKSB7XG4gICAgICAgIGZsaXAoKVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaW5lcyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgIGNoaWxkLmVsID0gY2hpbGQuZHJhdyh0aGlzKVxuXG4gICAgICBpZiAoY2hpbGQuaXNTY3JpcHQgJiYgdGhpcy5pc0NvbW1hbmQpIHtcbiAgICAgICAgdGhpcy5oYXNTY3JpcHQgPSB0cnVlXG4gICAgICAgIHB1c2hMaW5lKClcbiAgICAgICAgY2hpbGQueSA9IHlcbiAgICAgICAgbGluZXMucHVzaChjaGlsZClcbiAgICAgICAgc2NyaXB0V2lkdGggPSBNYXRoLm1heChzY3JpcHRXaWR0aCwgTWF0aC5tYXgoMSwgY2hpbGQud2lkdGgpKVxuICAgICAgICBjaGlsZC5oZWlnaHQgPSBNYXRoLm1heCgxMiwgY2hpbGQuaGVpZ2h0KSArIDNcbiAgICAgICAgeSArPSBjaGlsZC5oZWlnaHRcbiAgICAgICAgbGluZSA9IG5ldyBMaW5lKHkpXG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzQXJyb3cpIHtcbiAgICAgICAgbGluZS5jaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNtdyA9IGkgPiAwID8gMzAgOiAwIC8vIDI3XG4gICAgICAgIHZhciBtZCA9IHRoaXMuaXNDb21tYW5kID8gMCA6IHRoaXMubWluRGlzdGFuY2UoY2hpbGQpXG4gICAgICAgIHZhciBtdyA9IHRoaXMuaXNDb21tYW5kXG4gICAgICAgICAgPyBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzSW5wdXQgPyBjbXcgOiAwXG4gICAgICAgICAgOiBtZFxuICAgICAgICBpZiAobXcgJiYgIWxpbmVzLmxlbmd0aCAmJiBsaW5lLndpZHRoIDwgbXcgLSBweCkge1xuICAgICAgICAgIGxpbmUud2lkdGggPSBtdyAtIHB4XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGQueCA9IGxpbmUud2lkdGhcbiAgICAgICAgbGluZS53aWR0aCArPSBjaGlsZC53aWR0aFxuICAgICAgICBpbm5lcldpZHRoID0gTWF0aC5tYXgoaW5uZXJXaWR0aCwgbGluZS53aWR0aCArIE1hdGgubWF4KDAsIG1kIC0gcHgpKVxuICAgICAgICBsaW5lLndpZHRoICs9IDRcbiAgICAgICAgaWYgKCFjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgbGluZS5oZWlnaHQgPSBNYXRoLm1heChsaW5lLmhlaWdodCwgY2hpbGQuaGVpZ2h0KVxuICAgICAgICB9XG4gICAgICAgIGxpbmUuY2hpbGRyZW4ucHVzaChjaGlsZClcbiAgICAgIH1cbiAgICB9XG4gICAgcHVzaExpbmUodHJ1ZSlcblxuICAgIGlubmVyV2lkdGggPSBNYXRoLm1heChcbiAgICAgIGlubmVyV2lkdGggKyBweCAqIDIsXG4gICAgICB0aGlzLmlzSGF0IHx8IHRoaXMuaGFzU2NyaXB0XG4gICAgICAgID8gODNcbiAgICAgICAgOiB0aGlzLmlzQ29tbWFuZCB8fCB0aGlzLmlzT3V0bGluZSB8fCB0aGlzLmlzUmluZyA/IDM5IDogMjBcbiAgICApXG4gICAgdGhpcy5oZWlnaHQgPSB5XG4gICAgdGhpcy53aWR0aCA9IHNjcmlwdFdpZHRoXG4gICAgICA/IE1hdGgubWF4KGlubmVyV2lkdGgsIDE1ICsgc2NyaXB0V2lkdGgpXG4gICAgICA6IGlubmVyV2lkdGhcbiAgICBpZiAoaXNEZWZpbmUpIHtcbiAgICAgIHZhciBwID0gTWF0aC5taW4oMjYsICgzLjUgKyAwLjEzICogaW5uZXJXaWR0aCkgfCAwKSAtIDE4XG4gICAgICB0aGlzLmhlaWdodCArPSBwXG4gICAgICBwdCArPSAyICogcFxuICAgIH1cbiAgICB0aGlzLmZpcnN0TGluZSA9IGxpbmVzWzBdXG4gICAgdGhpcy5pbm5lcldpZHRoID0gaW5uZXJXaWR0aFxuXG4gICAgdmFyIG9iamVjdHMgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXVxuICAgICAgaWYgKGxpbmUuaXNTY3JpcHQpIHtcbiAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKDE1LCBsaW5lLnksIGxpbmUuZWwpKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgaCA9IGxpbmUuaGVpZ2h0XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGluZS5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBsaW5lLmNoaWxkcmVuW2pdXG4gICAgICAgIGlmIChjaGlsZC5pc0Fycm93KSB7XG4gICAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKGlubmVyV2lkdGggLSAxNSwgdGhpcy5oZWlnaHQgLSAzLCBjaGlsZC5lbCkpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB5ID0gcHQgKyAoaCAtIGNoaWxkLmhlaWdodCAtIHB0IC0gcGIpIC8gMiAtIDFcbiAgICAgICAgaWYgKGlzRGVmaW5lICYmIGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgICB5ICs9IDNcbiAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0ljb24pIHtcbiAgICAgICAgICB5ICs9IGNoaWxkLmR5IHwgMFxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzUmluZykge1xuICAgICAgICAgIGNoaWxkLnkgPSAobGluZS55ICsgeSkgfCAwXG4gICAgICAgICAgaWYgKGNoaWxkLmlzSW5zZXQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShweCArIGNoaWxkLngsIChsaW5lLnkgKyB5KSB8IDAsIGNoaWxkLmVsKSlcblxuICAgICAgICBpZiAoY2hpbGQuZGlmZiA9PT0gXCIrXCIpIHtcbiAgICAgICAgICB2YXIgZWxsaXBzZSA9IFNWRy5pbnNFbGxpcHNlKGNoaWxkLndpZHRoLCBjaGlsZC5oZWlnaHQpXG4gICAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKHB4ICsgY2hpbGQueCwgKGxpbmUueSArIHkpIHwgMCwgZWxsaXBzZSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZWwgPSB0aGlzLmRyYXdTZWxmKGlubmVyV2lkdGgsIHRoaXMuaGVpZ2h0LCBsaW5lcylcbiAgICBvYmplY3RzLnNwbGljZSgwLCAwLCBlbClcbiAgICBpZiAodGhpcy5pbmZvLmNvbG9yKSB7XG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgZmlsbDogdGhpcy5pbmZvLmNvbG9yLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gU1ZHLmdyb3VwKG9iamVjdHMpXG4gIH1cblxuICAvKiBDb21tZW50ICovXG5cbiAgdmFyIENvbW1lbnQgPSBmdW5jdGlvbih2YWx1ZSwgaGFzQmxvY2spIHtcbiAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHZhbHVlLCBbXCJzYi1jb21tZW50LWxhYmVsXCJdKVxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oYXNCbG9jayA9IGhhc0Jsb2NrXG4gIH1cbiAgQ29tbWVudC5wcm90b3R5cGUuaXNDb21tZW50ID0gdHJ1ZVxuICBDb21tZW50LmxpbmVMZW5ndGggPSAxMlxuICBDb21tZW50LnByb3RvdHlwZS5oZWlnaHQgPSAyMFxuXG4gIENvbW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIi8vIFwiICsgdGhpcy5sYWJlbC52YWx1ZVxuICB9XG5cbiAgQ29tbWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGFiZWwubWVhc3VyZSgpXG4gIH1cblxuICBDb21tZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhYmVsRWwgPSB0aGlzLmxhYmVsLmRyYXcoKVxuXG4gICAgdGhpcy53aWR0aCA9IHRoaXMubGFiZWwud2lkdGggKyAxNlxuICAgIHJldHVybiBTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLmNvbW1lbnRMaW5lKHRoaXMuaGFzQmxvY2sgPyBDb21tZW50LmxpbmVMZW5ndGggOiAwLCA2KSxcbiAgICAgIFNWRy5jb21tZW50UmVjdCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge1xuICAgICAgICBjbGFzczogXCJzYi1jb21tZW50XCIsXG4gICAgICB9KSxcbiAgICAgIFNWRy5tb3ZlKDgsIDQsIGxhYmVsRWwpLFxuICAgIF0pXG4gIH1cblxuICAvKiBHbG93ICovXG5cbiAgdmFyIEdsb3cgPSBmdW5jdGlvbihjaGlsZCkge1xuICAgIGFzc2VydChjaGlsZClcbiAgICB0aGlzLmNoaWxkID0gY2hpbGRcbiAgICBpZiAoY2hpbGQuaXNCbG9jaykge1xuICAgICAgdGhpcy5zaGFwZSA9IGNoaWxkLmluZm8uc2hhcGVcbiAgICAgIHRoaXMuaW5mbyA9IGNoaWxkLmluZm9cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFwZSA9IFwic3RhY2tcIlxuICAgIH1cblxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy55ID0gMFxuICB9XG4gIEdsb3cucHJvdG90eXBlLmlzR2xvdyA9IHRydWVcblxuICBHbG93LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jaGlsZC5pc0Jsb2NrKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZC5zdHJpbmdpZnkoXCIrXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsaW5lcyA9IHRoaXMuY2hpbGQuc3RyaW5naWZ5KCkuc3BsaXQoXCJcXG5cIilcbiAgICAgIHJldHVybiBsaW5lcy5tYXAobGluZSA9PiBcIisgXCIgKyBsaW5lKS5qb2luKFwiXFxuXCIpXG4gICAgfVxuICB9XG5cbiAgR2xvdy5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIHRoaXMuY2hpbGQudHJhbnNsYXRlKGxhbmcpXG4gIH1cblxuICBHbG93LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGlsZC5tZWFzdXJlKClcbiAgfVxuXG4gIEdsb3cucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNoaWxkXG4gICAgdmFyIGVsXG4gICAgdmFyIHcgPSB0aGlzLndpZHRoXG4gICAgdmFyIGggPSB0aGlzLmhlaWdodCAtIDFcbiAgICBpZiAoYy5pc1NjcmlwdCkge1xuICAgICAgaWYgKCFjLmlzRW1wdHkgJiYgYy5ibG9ja3NbMF0uaXNIYXQpIHtcbiAgICAgICAgZWwgPSBTVkcuaGF0UmVjdCh3LCBoKVxuICAgICAgfSBlbHNlIGlmIChjLmlzRmluYWwpIHtcbiAgICAgICAgZWwgPSBTVkcuY2FwUmVjdCh3LCBoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwgPSBTVkcuc3RhY2tSZWN0KHcsIGgpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBlbCA9IGMuZHJhd1NlbGYodywgaCwgW10pXG4gICAgfVxuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgIGNsYXNzOiBcInNiLWRpZmYgc2ItZGlmZi1pbnNcIixcbiAgICB9KVxuICB9XG4gIC8vIFRPRE8gaG93IGNhbiB3ZSBhbHdheXMgcmFpc2UgR2xvd3MgYWJvdmUgdGhlaXIgcGFyZW50cz9cblxuICBHbG93LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNoaWxkXG4gICAgdmFyIGVsID0gYy5pc1NjcmlwdCA/IGMuZHJhdyh0cnVlKSA6IGMuZHJhdygpXG5cbiAgICB0aGlzLndpZHRoID0gYy53aWR0aFxuICAgIHRoaXMuaGVpZ2h0ID0gKGMuaXNCbG9jayAmJiBjLmZpcnN0TGluZS5oZWlnaHQpIHx8IGMuaGVpZ2h0XG5cbiAgICAvLyBlbmNpcmNsZVxuICAgIHJldHVybiBTVkcuZ3JvdXAoW2VsLCB0aGlzLmRyYXdTZWxmKCldKVxuICB9XG5cbiAgLyogU2NyaXB0ICovXG5cbiAgdmFyIFNjcmlwdCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICAgIHRoaXMuYmxvY2tzID0gYmxvY2tzXG4gICAgdGhpcy5pc0VtcHR5ID0gIWJsb2Nrcy5sZW5ndGhcbiAgICB0aGlzLmlzRmluYWwgPSAhdGhpcy5pc0VtcHR5ICYmIGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0uaXNGaW5hbFxuICAgIHRoaXMueSA9IDBcbiAgfVxuICBTY3JpcHQucHJvdG90eXBlLmlzU2NyaXB0ID0gdHJ1ZVxuXG4gIFNjcmlwdC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIGJsb2Nrcykge1xuICAgIC8vIHggPSBhcnJheVswXSwgeSA9IGFycmF5WzFdO1xuICAgIHJldHVybiBuZXcgU2NyaXB0KGJsb2Nrcy5tYXAoQmxvY2suZnJvbUpTT04uYmluZChudWxsLCBsYW5nKSkpXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmJsb2Nrc1swXSAmJiB0aGlzLmJsb2Nrc1swXS5pc0NvbW1lbnQpIHJldHVyblxuICAgIHJldHVybiB0aGlzLmJsb2Nrcy5tYXAoZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgIHJldHVybiBibG9jay50b0pTT04oKVxuICAgIH0pXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmJsb2Nrc1xuICAgICAgLm1hcChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLnN0cmluZ2lmeSgpXG4gICAgICAgIGlmIChibG9jay5jb21tZW50KSBsaW5lICs9IFwiIFwiICsgYmxvY2suY29tbWVudC5zdHJpbmdpZnkoKVxuICAgICAgICByZXR1cm4gbGluZVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXCIpXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICBibG9jay50cmFuc2xhdGUobGFuZylcbiAgICB9KVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5ibG9ja3NbaV0ubWVhc3VyZSgpXG4gICAgfVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oaW5zaWRlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICB2YXIgeSA9IDBcbiAgICB0aGlzLndpZHRoID0gMFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ibG9ja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2ldXG4gICAgICB2YXIgeCA9IGluc2lkZSA/IDAgOiAyXG4gICAgICB2YXIgY2hpbGQgPSBibG9jay5kcmF3KClcbiAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoeCwgeSwgY2hpbGQpKVxuICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGJsb2NrLndpZHRoKVxuXG4gICAgICB2YXIgZGlmZiA9IGJsb2NrLmRpZmZcbiAgICAgIGlmIChkaWZmID09PSBcIi1cIikge1xuICAgICAgICB2YXIgZHcgPSBibG9jay53aWR0aFxuICAgICAgICB2YXIgZGggPSBibG9jay5maXJzdExpbmUuaGVpZ2h0IHx8IGJsb2NrLmhlaWdodFxuICAgICAgICBjaGlsZHJlbi5wdXNoKFNWRy5tb3ZlKHgsIHkgKyBkaCAvIDIgKyAxLCBTVkcuc3RyaWtldGhyb3VnaExpbmUoZHcpKSlcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGJsb2NrLndpZHRoKVxuICAgICAgfVxuXG4gICAgICB5ICs9IGJsb2NrLmhlaWdodFxuXG4gICAgICB2YXIgY29tbWVudCA9IGJsb2NrLmNvbW1lbnRcbiAgICAgIGlmIChjb21tZW50KSB7XG4gICAgICAgIHZhciBsaW5lID0gYmxvY2suZmlyc3RMaW5lXG4gICAgICAgIHZhciBjeCA9IGJsb2NrLmlubmVyV2lkdGggKyAyICsgQ29tbWVudC5saW5lTGVuZ3RoXG4gICAgICAgIHZhciBjeSA9IHkgLSBibG9jay5oZWlnaHQgKyBsaW5lLmhlaWdodCAvIDJcbiAgICAgICAgdmFyIGVsID0gY29tbWVudC5kcmF3KClcbiAgICAgICAgY2hpbGRyZW4ucHVzaChTVkcubW92ZShjeCwgY3kgLSBjb21tZW50LmhlaWdodCAvIDIsIGVsKSlcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGN4ICsgY29tbWVudC53aWR0aClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5oZWlnaHQgPSB5XG4gICAgaWYgKCFpbnNpZGUgJiYgIXRoaXMuaXNGaW5hbCkge1xuICAgICAgdGhpcy5oZWlnaHQgKz0gM1xuICAgIH1cbiAgICBpZiAoIWluc2lkZSAmJiBibG9jay5pc0dsb3cpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDIgLy8gVE9ETyB1bmJyZWFrIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIFNWRy5ncm91cChjaGlsZHJlbilcbiAgfVxuXG4gIC8qIERvY3VtZW50ICovXG5cbiAgdmFyIERvY3VtZW50ID0gZnVuY3Rpb24oc2NyaXB0cykge1xuICAgIHRoaXMuc2NyaXB0cyA9IHNjcmlwdHNcblxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy5lbCA9IG51bGxcbiAgICB0aGlzLmRlZnMgPSBudWxsXG4gIH1cblxuICBEb2N1bWVudC5mcm9tSlNPTiA9IGZ1bmN0aW9uKHNjcmlwdGFibGUsIGxhbmcpIHtcbiAgICB2YXIgbGFuZyA9IGxhbmcgfHwgZW5nbGlzaFxuICAgIHZhciBzY3JpcHRzID0gc2NyaXB0YWJsZS5zY3JpcHRzLm1hcChmdW5jdGlvbihhcnJheSkge1xuICAgICAgdmFyIHNjcmlwdCA9IFNjcmlwdC5mcm9tSlNPTihsYW5nLCBhcnJheVsyXSlcbiAgICAgIHNjcmlwdC54ID0gYXJyYXlbMF1cbiAgICAgIHNjcmlwdC55ID0gYXJyYXlbMV1cbiAgICAgIHJldHVybiBzY3JpcHRcbiAgICB9KVxuICAgIC8vIFRPRE8gc2NyaXB0YWJsZS5zY3JpcHRDb21tZW50c1xuICAgIHJldHVybiBuZXcgRG9jdW1lbnQoc2NyaXB0cylcbiAgfVxuXG4gIERvY3VtZW50LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIganNvblNjcmlwdHMgPSB0aGlzLnNjcmlwdHNcbiAgICAgIC5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIHZhciBqc29uQmxvY2tzID0gc2NyaXB0LnRvSlNPTigpXG4gICAgICAgIGlmICghanNvbkJsb2NrcykgcmV0dXJuXG4gICAgICAgIHJldHVybiBbMTAsIHNjcmlwdC55ICsgMTAsIGpzb25CbG9ja3NdXG4gICAgICB9KVxuICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICByZXR1cm4ge1xuICAgICAgc2NyaXB0czoganNvblNjcmlwdHMsXG4gICAgICAvLyBzY3JpcHRDb21tZW50czogW10sIC8vIFRPRE9cbiAgICB9XG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2NyaXB0c1xuICAgICAgLm1hcChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgcmV0dXJuIHNjcmlwdC5zdHJpbmdpZnkoKVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXFxuXCIpXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIHRoaXMuc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgc2NyaXB0LnRyYW5zbGF0ZShsYW5nKVxuICAgIH0pXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgc2NyaXB0Lm1lYXN1cmUoKVxuICAgIH0pXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY2IpIHtcbiAgICAvLyBtZWFzdXJlIHN0cmluZ3NcbiAgICB0aGlzLm1lYXN1cmUoKVxuXG4gICAgLy8gVE9ETzogc2VwYXJhdGUgbGF5b3V0ICsgcmVuZGVyIHN0ZXBzLlxuICAgIC8vIHJlbmRlciBlYWNoIHNjcmlwdFxuICAgIHZhciB3aWR0aCA9IDBcbiAgICB2YXIgaGVpZ2h0ID0gMFxuICAgIHZhciBlbGVtZW50cyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzY3JpcHQgPSB0aGlzLnNjcmlwdHNbaV1cbiAgICAgIGlmIChoZWlnaHQpIGhlaWdodCArPSAxMFxuICAgICAgc2NyaXB0LnkgPSBoZWlnaHRcbiAgICAgIGVsZW1lbnRzLnB1c2goU1ZHLm1vdmUoMCwgaGVpZ2h0LCBzY3JpcHQuZHJhdygpKSlcbiAgICAgIGhlaWdodCArPSBzY3JpcHQuaGVpZ2h0XG4gICAgICB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCBzY3JpcHQud2lkdGggKyA0KVxuICAgIH1cbiAgICB0aGlzLndpZHRoID0gd2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxuXG4gICAgLy8gcmV0dXJuIFNWR1xuICAgIHZhciBzdmcgPSBTVkcubmV3U1ZHKHdpZHRoLCBoZWlnaHQpXG4gICAgc3ZnLmFwcGVuZENoaWxkKFxuICAgICAgKHRoaXMuZGVmcyA9IFNWRy53aXRoQ2hpbGRyZW4oXG4gICAgICAgIFNWRy5lbChcImRlZnNcIiksXG4gICAgICAgIFtcbiAgICAgICAgICBiZXZlbEZpbHRlcihcImJldmVsRmlsdGVyXCIsIGZhbHNlKSxcbiAgICAgICAgICBiZXZlbEZpbHRlcihcImlucHV0QmV2ZWxGaWx0ZXJcIiwgdHJ1ZSksXG4gICAgICAgICAgZGFya0ZpbHRlcihcImlucHV0RGFya0ZpbHRlclwiKSxcbiAgICAgICAgICBkZXNhdHVyYXRlRmlsdGVyKFwiZGVzYXR1cmF0ZUZpbHRlclwiKSxcbiAgICAgICAgXS5jb25jYXQobWFrZUljb25zKCkpXG4gICAgICApKVxuICAgIClcblxuICAgIHN2Zy5hcHBlbmRDaGlsZChTVkcuZ3JvdXAoZWxlbWVudHMpKVxuICAgIHRoaXMuZWwgPSBzdmdcblxuICAgIC8vIG5iOiBhc3luYyBBUEkgb25seSBmb3IgYmFja3dhcmRzL2ZvcndhcmRzIGNvbXBhdGliaWxpdHkgcmVhc29ucy5cbiAgICAvLyBkZXNwaXRlIGFwcGVhcmFuY2VzLCBpdCBydW5zIHN5bmNocm9ub3VzbHlcbiAgICBjYihzdmcpXG4gIH1cblxuICAvKiBFeHBvcnQgU1ZHIGltYWdlIGFzIFhNTCBzdHJpbmcgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGFzc2VydCh0aGlzLmVsLCBcImNhbGwgZHJhdygpIGZpcnN0XCIpXG5cbiAgICB2YXIgc3R5bGUgPSBtYWtlU3R5bGUoKVxuICAgIHRoaXMuZGVmcy5hcHBlbmRDaGlsZChzdHlsZSlcbiAgICB2YXIgeG1sID0gbmV3IFNWRy5YTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcodGhpcy5lbClcbiAgICB0aGlzLmRlZnMucmVtb3ZlQ2hpbGQoc3R5bGUpXG4gICAgcmV0dXJuIHhtbFxuICB9XG5cbiAgLyogRXhwb3J0IFNWRyBpbWFnZSBhcyBkYXRhIFVSSSAqL1xuICBEb2N1bWVudC5wcm90b3R5cGUuZXhwb3J0U1ZHID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHhtbCA9IHRoaXMuZXhwb3J0U1ZHU3RyaW5nKClcbiAgICByZXR1cm4gXCJkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIiArIHhtbC5yZXBsYWNlKC9bI10vZywgZW5jb2RlVVJJQ29tcG9uZW50KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFBORyA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgdmFyIGNhbnZhcyA9IFNWRy5tYWtlQ2FudmFzKClcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLndpZHRoXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaGVpZ2h0XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG5cbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKVxuICAgIGltYWdlLnNyYyA9IHRoaXMuZXhwb3J0U1ZHKClcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwKVxuXG4gICAgICBpZiAoVVJMICYmIFVSTC5jcmVhdGVPYmplY3RVUkwgJiYgQmxvYiAmJiBjYW52YXMudG9CbG9iKSB7XG4gICAgICAgIHZhciBibG9iID0gY2FudmFzLnRvQmxvYihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgY2IoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSlcbiAgICAgICAgfSwgXCJpbWFnZS9wbmdcIilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNiKGNhbnZhcy50b0RhdGFVUkwoXCJpbWFnZS9wbmdcIikpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgR2xvdyxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH1cbn0pKClcbiIsInZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG52YXIgRmlsdGVyID0gcmVxdWlyZShcIi4vZmlsdGVyLmpzXCIpXG5cbnZhciBTdHlsZSA9IChtb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3NzQ29udGVudDogYFxuICAgIC5zYi1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgZmlsbDogI2ZmZjtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMHB4O1xuICAgICAgb3BhY2l0eTogMC45O1xuICAgIH1cblxuICAgIC5zYi1vYnNvbGV0ZSB7IGZpbGw6ICNkNDI4Mjg7IH1cbiAgICAuc2ItbW90aW9uIHsgZmlsbDogIzRDOTdGRjsgfVxuICAgIC5zYi1sb29rcyB7IGZpbGw6ICM5OTY2RkY7IH1cbiAgICAuc2Itc291bmQgeyBmaWxsOiAjQ0Y2M0NGOyB9XG4gICAgLnNiLXBlbiB7IGZpbGw6ICMwZkJEOEM7ICB9XG4gICAgLnNiLWV2ZW50cyB7IGZpbGw6ICNGRkJGMDA7IH1cbiAgICAuc2ItY29udHJvbCB7IGZpbGw6ICNGRkFCMTk7IH1cbiAgICAuc2Itc2Vuc2luZyB7IGZpbGw6ICM1Q0IxRDY7IH1cbiAgICAuc2Itb3BlcmF0b3JzIHsgZmlsbDogIzU5QzA1OTsgfVxuICAgIC5zYi12YXJpYWJsZXMgeyBmaWxsOiAjRkY4QzFBOyB9XG4gICAgLnNiLWxpc3QgeyBmaWxsOiAjRkY2NjFBIH1cbiAgICAuc2ItY3VzdG9tIHsgZmlsbDogI0ZGNjY4MDsgfVxuICAgIC5zYi1jdXN0b20tYXJnIHsgZmlsbDogI0ZGNjY4MDsgfVxuICAgIC5zYi1leHRlbnNpb24geyBmaWxsOiAjNGI0YTYwOyB9XG4gICAgLnNiLWdyZXkgeyBmaWxsOiAjOTY5Njk2OyB9XG5cbiAgICAuc2ItYmV2ZWwge1xuICAgICAgZmlsdGVyMjogdXJsKCNiZXZlbEZpbHRlcik7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xNTtcbiAgICAgIHN0cm9rZS1hbGlnbm1lbnQ6IGlubmVyO1xuICAgIH1cbiAgICAuc2ItbGl0ZXJhbC1yb3VuZC1kcm9wZG93bixcbiAgICAuc2ItaW5wdXQtYm9vbGVhbiB7XG4gICAgICBmaWx0ZXI6IHVybCgjaW5wdXREYXJrRmlsdGVyKTtcbiAgICB9XG4gICAgLnNiLWlucHV0IHtcbiAgICAgIGZpbHRlcjI6IHVybCgjaW5wdXRCZXZlbEZpbHRlcik7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xNTtcbiAgICAgIHN0cm9rZS1hbGlnbm1lbnQ6IGlubmVyO1xuICAgIH1cbiAgICAuc2ItaW5wdXQtbnVtYmVyLFxuICAgIC5zYi1pbnB1dC1zdHJpbmcsXG4gICAgLnNiLWlucHV0LW51bWJlci1kcm9wZG93biB7XG4gICAgICBmaWxsOiAjZmZmO1xuICAgIH1cbiAgICAuc2ItbGl0ZXJhbC1udW1iZXIsXG4gICAgLnNiLWxpdGVyYWwtc3RyaW5nLFxuICAgIC5zYi1saXRlcmFsLW51bWJlci1kcm9wZG93bixcbiAgICAuc2ItbGl0ZXJhbC1kcm9wZG93biB7XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgd29yZC1zcGFjaW5nOiAwO1xuICAgIH1cbiAgICAuc2ItbGl0ZXJhbC1udW1iZXIsXG4gICAgLnNiLWxpdGVyYWwtc3RyaW5nLFxuICAgIC5zYi1saXRlcmFsLW51bWJlci1kcm9wZG93biB7XG4gICAgICBmaWxsOiAjMDAwO1xuICAgIH1cblxuICAgIC5zYi1kYXJrZXIge1xuICAgICAgZmlsdGVyMjogdXJsKCNpbnB1dERhcmtGaWx0ZXIpO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMTtcbiAgICAgIHN0cm9rZS1hbGlnbm1lbnQ6IGlubmVyO1xuICAgIH1cbiAgICAuc2ItZGVzYXR1cmF0ZSB7XG4gICAgICBmaWx0ZXI6IHVybCgjZGVzYXR1cmF0ZUZpbHRlcik7XG4gICAgfVxuXG4gICAgLnNiLW91dGxpbmUge1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMTtcbiAgICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICAgIGZpbGw6ICNGRjRENkE7XG4gICAgfVxuXG4gICAgLnNiLWRlZmluZS1oYXQtY2FwIHtcbiAgICAgIHN0cm9rZTogIzYzMmQ5OTtcbiAgICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICAgIGZpbGw6ICM4ZTJlYzI7XG4gICAgfVxuXG4gICAgLnNiLWNvbW1lbnQge1xuICAgICAgZmlsbDogI2ZmZmZhNTtcbiAgICAgIHN0cm9rZTogI2QwZDFkMjtcbiAgICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICB9XG4gICAgLnNiLWNvbW1lbnQtbGluZSB7XG4gICAgICBmaWxsOiAjZmZmZjgwO1xuICAgIH1cbiAgICAuc2ItY29tbWVudC1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogSGVsZXZldGljYSwgQXJpYWwsIERlamFWdSBTYW5zLCBzYW5zLXNlcmlmO1xuICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICBmaWxsOiAjNWM1ZDVmO1xuICAgICAgd29yZC1zcGFjaW5nOiAwO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIH1cblxuICAgIC5zYi1kaWZmIHtcbiAgICAgIGZpbGw6IG5vbmU7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgfVxuICAgIC5zYi1kaWZmLWlucyB7XG4gICAgICBzdHJva2Utd2lkdGg6IDJweDtcbiAgICB9XG4gICAgLnNiLWRpZmYtZGVsIHtcbiAgICAgIHN0cm9rZS13aWR0aDogM3B4O1xuICAgIH1cbiAgYC5yZXBsYWNlKC9bIFxcbl0rLywgXCIgXCIpLFxuXG4gIG1ha2VJY29ucygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjAuOCAzLjdjLS40LS4yLS45LS4xLTEuMi4yLTIgMS42LTQuOCAxLjYtNi44IDAtMi4zLTEuOS01LjYtMi4zLTguMy0xdi0uNGMwLS42LS41LTEtMS0xcy0xIC40LTEgMXYxOC44YzAgLjUuNSAxIDEgMWguMWMuNSAwIDEtLjUgMS0xdi02LjRjMS0uNyAyLjEtMS4yIDMuNC0xLjMgMS4yIDAgMi40LjQgMy40IDEuMiAyLjkgMi4zIDcgMi4zIDkuOCAwIC4zLS4yLjQtLjUuNC0uOVY0LjdjMC0uNS0uMy0uOS0uOC0xem0tLjMgMTAuMkMxOCAxNiAxNC40IDE2IDExLjkgMTRjLTEuMS0uOS0yLjUtMS40LTQtMS40LTEuMi4xLTIuMy41LTMuNCAxLjFWNGMyLjUtMS40IDUuNS0xLjEgNy43LjYgMi40IDEuOSA1LjcgMS45IDguMSAwaC4ybC4xLjEtLjEgOS4yelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjNDU5OTNkXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMC42IDQuOGwtLjEgOS4xdi4xYy0yLjUgMi02LjEgMi04LjYgMC0xLjEtLjktMi41LTEuNC00LTEuNC0xLjIuMS0yLjMuNS0zLjQgMS4xVjRjMi41LTEuNCA1LjUtMS4xIDcuNy42IDIuNCAxLjkgNS43IDEuOSA4LjEgMGguMmMwIC4xLjEuMS4xLjJ6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiM0Y2JmNTZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJncmVlbkZsYWdcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSkgdHJhbnNsYXRlKC0xMiA0KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMi42OCAxMi4yYTEuNiAxLjYgMCAwIDEtMS4yNy42M2gtNy42OWExLjU5IDEuNTkgMCAwIDEtMS4xNi0yLjU4bDEuMTItMS40MWE0LjgyIDQuODIgMCAwIDAtMy4xNC0uNzcgNC4zMSA0LjMxIDAgMCAwLTIgLjhBNC4yNSA0LjI1IDAgMCAwIDcuMiAxMC42YTUuMDYgNS4wNiAwIDAgMCAuNTQgNC42MkE1LjU4IDUuNTggMCAwIDAgMTIgMTcuNzRhMi4yNiAyLjI2IDAgMCAxLS4xNiA0LjUyQTEwLjI1IDEwLjI1IDAgMCAxIDMuNzQgMThhMTAuMTQgMTAuMTQgMCAwIDEtMS40OS05LjIyIDkuNyA5LjcgMCAwIDEgMi44My00LjE0QTkuOTIgOS45MiAwIDAgMSA5LjY2IDIuNWExMC42NiAxMC42NiAwIDAgMSA3LjcyIDEuNjhsMS4wOC0xLjM1YTEuNTcgMS41NyAwIDAgMSAxLjI0LS42IDEuNiAxLjYgMCAwIDEgMS41NCAxLjIxbDEuNyA3LjM3YTEuNTcgMS41NyAwIDAgMS0uMjYgMS4zOXpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzNkNzljY1wiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjEuMzggMTEuODNoLTcuNjFhLjU5LjU5IDAgMCAxLS40My0xbDEuNzUtMi4xOWE1LjkgNS45IDAgMCAwLTQuNy0xLjU4IDUuMDcgNS4wNyAwIDAgMC00LjExIDMuMTdBNiA2IDAgMCAwIDcgMTUuNzdhNi41MSA2LjUxIDAgMCAwIDUgMi45MiAxLjMxIDEuMzEgMCAwIDEtLjA4IDIuNjIgOS4zIDkuMyAwIDAgMS03LjM1LTMuODIgOS4xNiA5LjE2IDAgMCAxLTEuNC04LjM3QTguNTEgOC41MSAwIDAgMSA1LjcxIDUuNGE4Ljc2IDguNzYgMCAwIDEgNC4xMS0xLjkyIDkuNzEgOS43MSAwIDAgMSA3Ljc1IDIuMDdsMS42Ny0yLjFhLjU5LjU5IDAgMCAxIDEgLjIxTDIyIDExLjA4YS41OS41OSAwIDAgMS0uNjIuNzV6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJ0dXJuUmlnaHRcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSkgdHJhbnNsYXRlKC04IC01KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMC4zNCAxOC4yMWExMC4yNCAxMC4yNCAwIDAgMS04LjEgNC4yMiAyLjI2IDIuMjYgMCAwIDEtLjE2LTQuNTIgNS41OCA1LjU4IDAgMCAwIDQuMjUtMi41MyA1LjA2IDUuMDYgMCAwIDAgLjU0LTQuNjJBNC4yNSA0LjI1IDAgMCAwIDE1LjU1IDlhNC4zMSA0LjMxIDAgMCAwLTItLjggNC44MiA0LjgyIDAgMCAwLTMuMTUuOGwxLjEyIDEuNDFBMS41OSAxLjU5IDAgMCAxIDEwLjM2IDEzSDIuNjdhMS41NiAxLjU2IDAgMCAxLTEuMjYtLjYzQTEuNTQgMS41NCAwIDAgMSAxLjEzIDExbDEuNzItNy40M0ExLjU5IDEuNTkgMCAwIDEgNC4zOCAyLjRhMS41NyAxLjU3IDAgMCAxIDEuMjQuNkw2LjcgNC4zNWExMC42NiAxMC42NiAwIDAgMSA3LjcyLTEuNjhBOS44OCA5Ljg4IDAgMCAxIDE5IDQuODEgOS42MSA5LjYxIDAgMCAxIDIxLjgzIDlhMTAuMDggMTAuMDggMCAwIDEtMS40OSA5LjIxelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjM2Q3OWNjXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0xOS41NiAxNy42NWE5LjI5IDkuMjkgMCAwIDEtNy4zNSAzLjgzIDEuMzEgMS4zMSAwIDAgMS0uMDgtMi42MiA2LjUzIDYuNTMgMCAwIDAgNS0yLjkyIDYuMDUgNi4wNSAwIDAgMCAuNjctNS41MSA1LjMyIDUuMzIgMCAwIDAtMS42NC0yLjE2IDUuMjEgNS4yMSAwIDAgMC0yLjQ4LTFBNS44NiA1Ljg2IDAgMCAwIDkgOC44NEwxMC43NCAxMWEuNTkuNTkgMCAwIDEtLjQzIDFIMi43YS42LjYgMCAwIDEtLjYtLjc1bDEuNzEtNy40MmEuNTkuNTkgMCAwIDEgMS0uMjFsMS42NyAyLjFhOS43MSA5LjcxIDAgMCAxIDcuNzUtMi4wNyA4Ljg0IDguODQgMCAwIDEgNC4xMiAxLjkyIDguNjggOC42OCAwIDAgMSAyLjU0IDMuNzIgOS4xNCA5LjE0IDAgMCAxLTEuMzMgOC4zNnpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcInR1cm5MZWZ0XCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpIHRyYW5zbGF0ZSgtNSAtNSlcIiwgLy8gVE9ET1xuICAgICAgICB9XG4gICAgICApLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTAgMEw0IDRMMCA4WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiYWRkSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTQgMEw0IDhMMCA0WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiZGVsSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjMuMyAxMWMtLjMuNi0uOSAxLTEuNSAxaC0xLjZjLS4xIDEuMy0uNSAyLjUtMS4xIDMuNi0uOSAxLjctMi4zIDMuMi00LjEgNC4xLTEuNy45LTMuNiAxLjItNS41LjktMS44LS4zLTMuNS0xLjEtNC45LTIuMy0uNy0uNy0uNy0xLjkgMC0yLjYuNi0uNiAxLjYtLjcgMi4zLS4ySDdjLjkuNiAxLjkuOSAyLjkuOXMxLjktLjMgMi43LS45YzEuMS0uOCAxLjgtMi4xIDEuOC0zLjVoLTEuNWMtLjkgMC0xLjctLjctMS43LTEuNyAwLS40LjItLjkuNS0xLjJsNC40LTQuNGMuNy0uNiAxLjctLjYgMi40IDBMMjMgOS4yYy41LjUuNiAxLjIuMyAxLjh6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNjZjhiMTdcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIxLjggMTFoLTIuNmMwIDEuNS0uMyAyLjktMSA0LjItLjggMS42LTIuMSAyLjgtMy43IDMuNi0xLjUuOC0zLjMgMS4xLTQuOS44LTEuNi0uMi0zLjItMS00LjQtMi4xLS40LS4zLS40LS45LS4xLTEuMi4zLS40LjktLjQgMS4yLS4xIDEgLjcgMi4yIDEuMSAzLjQgMS4xczIuMy0uMyAzLjMtMWMuOS0uNiAxLjYtMS41IDItMi42LjMtLjkuNC0xLjguMi0yLjhoLTIuNGMtLjQgMC0uNy0uMy0uNy0uNyAwLS4yLjEtLjMuMi0uNGw0LjQtNC40Yy4zLS4zLjctLjMuOSAwTDIyIDkuOGMuMy4zLjQuNi4zLjlzLS4zLjMtLjUuM3pcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcImxvb3BBcnJvd1wiLFxuICAgICAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgwLjY1KSB0cmFuc2xhdGUoLTUgLTIwKVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgXVxuICB9LFxuXG4gIG1ha2VTdHlsZSgpIHtcbiAgICB2YXIgc3R5bGUgPSBTVkcuZWwoXCJzdHlsZVwiKVxuICAgIHN0eWxlLmFwcGVuZENoaWxkKFNWRy5jZGF0YShTdHlsZS5jc3NDb250ZW50KSlcbiAgICByZXR1cm4gc3R5bGVcbiAgfSxcblxuICBiZXZlbEZpbHRlcihpZCwgaW5zZXQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpXG5cbiAgICB2YXIgYWxwaGEgPSBcIlNvdXJjZUFscGhhXCJcbiAgICB2YXIgcyA9IGluc2V0ID8gLTEgOiAxXG4gICAgdmFyIGJsdXIgPSBmLmJsdXIoMSwgYWxwaGEpXG5cbiAgICBmLm1lcmdlKFtcbiAgICAgIFwiU291cmNlR3JhcGhpY1wiLFxuICAgICAgZi5jb21wKFxuICAgICAgICBcImluXCIsXG4gICAgICAgIGYuZmxvb2QoXCIjZmZmXCIsIDAuMTUpLFxuICAgICAgICBmLnN1YnRyYWN0KGFscGhhLCBmLm9mZnNldCgrcywgK3MsIGJsdXIpKVxuICAgICAgKSxcbiAgICAgIGYuY29tcChcbiAgICAgICAgXCJpblwiLFxuICAgICAgICBmLmZsb29kKFwiIzAwMFwiLCAwLjcpLFxuICAgICAgICBmLnN1YnRyYWN0KGFscGhhLCBmLm9mZnNldCgtcywgLXMsIGJsdXIpKVxuICAgICAgKSxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkYXJrRmlsdGVyKGlkKSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKVxuXG4gICAgZi5tZXJnZShbXG4gICAgICBcIlNvdXJjZUdyYXBoaWNcIixcbiAgICAgIGYuY29tcChcImluXCIsIGYuZmxvb2QoXCIjMDAwXCIsIDAuMiksIFwiU291cmNlQWxwaGFcIiksXG4gICAgXSlcblxuICAgIHJldHVybiBmLmVsXG4gIH0sXG5cbiAgZGVzYXR1cmF0ZUZpbHRlcihpZCkge1xuICAgIHZhciBmID0gbmV3IEZpbHRlcihpZClcblxuICAgIHZhciBxID0gMC4zMzNcbiAgICB2YXIgcyA9IDAuMzMzXG4gICAgZi5jb2xvck1hdHJpeChcIlNvdXJjZUdyYXBoaWNcIiwgW1xuICAgICAgcSxcbiAgICAgIHMsXG4gICAgICBzLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICBzLFxuICAgICAgcSxcbiAgICAgIHMsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHMsXG4gICAgICBzLFxuICAgICAgcSxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMSxcbiAgICAgIDAsXG4gICAgXSlcblxuICAgIHJldHVybiBmLmVsXG4gIH0sXG5cbiAgZGFya1JlY3QodywgaCwgY2F0ZWdvcnksIGVsKSB7XG4gICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhcbiAgICAgIFNWRy5ncm91cChbXG4gICAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICAgIGNsYXNzOiBbXCJzYi1cIiArIGNhdGVnb3J5LCBcInNiLWRhcmtlclwiXS5qb2luKFwiIFwiKSxcbiAgICAgICAgfSksXG4gICAgICBdKSxcbiAgICAgIHsgd2lkdGg6IHcsIGhlaWdodDogaCB9XG4gICAgKVxuICB9LFxuXG4gIGRlZmF1bHRGb250RmFtaWx5OiBcIkx1Y2lkYSBHcmFuZGUsIFZlcmRhbmEsIEFyaWFsLCBEZWphVnUgU2Fucywgc2Fucy1zZXJpZlwiLFxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuICBmdW5jdGlvbiBpc0FycmF5KG8pIHtcbiAgICByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheVxuICB9XG4gIGZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbiAgfVxuXG4gIHZhciB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIEdsb3csXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9ID0gcmVxdWlyZShcIi4vbW9kZWwuanNcIilcblxuICB2YXIge1xuICAgIGFsbExhbmd1YWdlcyxcbiAgICBsb29rdXBEcm9wZG93bixcbiAgICBoZXhDb2xvclBhdCxcbiAgICBtaW5pZnlIYXNoLFxuICAgIGxvb2t1cEhhc2gsXG4gICAgaGFzaFNwZWMsXG4gICAgYXBwbHlPdmVycmlkZXMsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIGljb25QYXQsXG4gICAgYmxvY2tOYW1lLFxuICB9ID0gcmVxdWlyZShcIi4vYmxvY2tzLmpzXCIpXG5cbiAgZnVuY3Rpb24gcGFpbnRCbG9jayhpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKSB7XG4gICAgdmFyIG92ZXJyaWRlcyA9IFtdXG4gICAgaWYgKGlzQXJyYXkoY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV0pKSB7XG4gICAgICBvdmVycmlkZXMgPSBjaGlsZHJlbi5wb3AoKVxuICAgIH1cblxuICAgIC8vIGJ1aWxkIGhhc2hcbiAgICB2YXIgd29yZHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICBpZiAoY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICB3b3Jkcy5wdXNoKGNoaWxkLnZhbHVlKVxuICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0ljb24pIHtcbiAgICAgICAgd29yZHMucHVzaChcIkBcIiArIGNoaWxkLm5hbWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3b3Jkcy5wdXNoKFwiX1wiKVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgaGFzaCA9IChpbmZvLmhhc2ggPSBtaW5pZnlIYXNoKHdvcmRzLmpvaW4oXCIgXCIpKSlcblxuICAgIC8vIHBhaW50XG4gICAgdmFyIG8gPSBsb29rdXBIYXNoKGhhc2gsIGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpXG4gICAgaWYgKG8pIHtcbiAgICAgIHZhciBsYW5nID0gby5sYW5nXG4gICAgICB2YXIgdHlwZSA9IG8udHlwZVxuICAgICAgaW5mby5sYW5ndWFnZSA9IGxhbmdcbiAgICAgIGluZm8uaXNSVEwgPSBydGxMYW5ndWFnZXMuaW5kZXhPZihsYW5nLmNvZGUpID4gLTFcblxuICAgICAgaWYgKFxuICAgICAgICB0eXBlLnNoYXBlID09PSBcInJpbmdcIlxuICAgICAgICAgID8gaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgICAgICAgOiBpbmZvLnNoYXBlID09PSBcInN0YWNrXCJcbiAgICAgICkge1xuICAgICAgICBpbmZvLnNoYXBlID0gdHlwZS5zaGFwZVxuICAgICAgfVxuICAgICAgaW5mby5jYXRlZ29yeSA9IHR5cGUuY2F0ZWdvcnlcbiAgICAgIGluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgaWYgKHR5cGUuc2VsZWN0b3IpIGluZm8uc2VsZWN0b3IgPSB0eXBlLnNlbGVjdG9yIC8vIGZvciB0b0pTT05cbiAgICAgIGluZm8uaGFzTG9vcEFycm93ID0gdHlwZS5oYXNMb29wQXJyb3dcblxuICAgICAgLy8gZWxsaXBzaXMgYmxvY2tcbiAgICAgIGlmICh0eXBlLnNwZWMgPT09IFwiLiAuIC5cIikge1xuICAgICAgICBjaGlsZHJlbiA9IFtuZXcgTGFiZWwoXCIuIC4gLlwiKV1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBvdmVycmlkZXNcbiAgICBhcHBseU92ZXJyaWRlcyhpbmZvLCBvdmVycmlkZXMpXG5cbiAgICAvLyBsb29wIGFycm93c1xuICAgIGlmIChpbmZvLmhhc0xvb3BBcnJvdykge1xuICAgICAgY2hpbGRyZW4ucHVzaChuZXcgSWNvbihcImxvb3BBcnJvd1wiKSlcbiAgICB9XG5cbiAgICB2YXIgYmxvY2sgPSBuZXcgQmxvY2soaW5mbywgY2hpbGRyZW4pXG5cbiAgICAvLyBpbWFnZSByZXBsYWNlbWVudFxuICAgIGlmICh0eXBlICYmIGljb25QYXQudGVzdCh0eXBlLnNwZWMpKSB7XG4gICAgICBibG9jay50cmFuc2xhdGUobGFuZywgdHJ1ZSlcbiAgICB9XG5cbiAgICAvLyBkaWZmc1xuICAgIGlmIChpbmZvLmRpZmYgPT09IFwiK1wiKSB7XG4gICAgICByZXR1cm4gbmV3IEdsb3coYmxvY2spXG4gICAgfSBlbHNlIHtcbiAgICAgIGJsb2NrLmRpZmYgPSBpbmZvLmRpZmZcbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUxpbmVzKGNvZGUsIGxhbmd1YWdlcykge1xuICAgIHZhciB0b2sgPSBjb2RlWzBdXG4gICAgdmFyIGluZGV4ID0gMFxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICB0b2sgPSBjb2RlWysraW5kZXhdXG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZWsoKSB7XG4gICAgICByZXR1cm4gY29kZVtpbmRleCArIDFdXG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZWtOb25XcygpIHtcbiAgICAgIGZvciAodmFyIGkgPSBpbmRleCArIDE7IGkgPCBjb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjb2RlW2ldICE9PSBcIiBcIikgcmV0dXJuIGNvZGVbaV1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNhd05MXG5cbiAgICB2YXIgZGVmaW5lID0gW11cbiAgICBsYW5ndWFnZXMubWFwKGZ1bmN0aW9uKGxhbmcpIHtcbiAgICAgIGRlZmluZSA9IGRlZmluZS5jb25jYXQobGFuZy5kZWZpbmUpXG4gICAgfSlcbiAgICAvLyBOQi4gd2UgYXNzdW1lICdkZWZpbmUnIGlzIGEgc2luZ2xlIHdvcmQgaW4gZXZlcnkgbGFuZ3VhZ2VcbiAgICBmdW5jdGlvbiBpc0RlZmluZSh3b3JkKSB7XG4gICAgICByZXR1cm4gZGVmaW5lLmluZGV4T2Yod29yZCkgPiAtMVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VCbG9jayhzaGFwZSwgY2hpbGRyZW4pIHtcbiAgICAgIHZhciBoYXNJbnB1dHMgPSAhIWNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAheC5pc0xhYmVsXG4gICAgICB9KS5sZW5ndGhcbiAgICAgIHZhciBpbmZvID0ge1xuICAgICAgICBzaGFwZTogc2hhcGUsXG4gICAgICAgIGNhdGVnb3J5OlxuICAgICAgICAgIHNoYXBlID09PSBcImRlZmluZS1oYXRcIlxuICAgICAgICAgICAgPyBcImN1c3RvbVwiXG4gICAgICAgICAgICA6IHNoYXBlID09PSBcInJlcG9ydGVyXCIgJiYgIWhhc0lucHV0cyA/IFwidmFyaWFibGVzXCIgOiBcIm9ic29sZXRlXCIsXG4gICAgICAgIGNhdGVnb3J5SXNEZWZhdWx0OiB0cnVlLFxuICAgICAgICBoYXNMb29wQXJyb3c6IGZhbHNlLFxuICAgICAgfVxuICAgICAgcmV0dXJuIHBhaW50QmxvY2soaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlTWVudShzaGFwZSwgdmFsdWUpIHtcbiAgICAgIHZhciBtZW51ID0gbG9va3VwRHJvcGRvd24odmFsdWUsIGxhbmd1YWdlcykgfHwgdmFsdWVcbiAgICAgIHJldHVybiBuZXcgSW5wdXQoc2hhcGUsIHZhbHVlLCBtZW51KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBQYXJ0cyhlbmQpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgICB2YXIgbGFiZWxcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiPFwiIHx8ICh0b2sgPT09IFwiPlwiICYmIGVuZCA9PT0gXCI+XCIpKSB7XG4gICAgICAgICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgICAgICAgIHZhciBjID0gcGVla05vbldzKClcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBsYXN0ICYmXG4gICAgICAgICAgICAhbGFzdC5pc0xhYmVsICYmXG4gICAgICAgICAgICAoYyA9PT0gXCJbXCIgfHwgYyA9PT0gXCIoXCIgfHwgYyA9PT0gXCI8XCIgfHwgYyA9PT0gXCJ7XCIpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gobmV3IExhYmVsKHRvaykpXG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0b2sgPT09IGVuZCkgYnJlYWtcbiAgICAgICAgaWYgKHRvayA9PT0gXCIvXCIgJiYgcGVlaygpID09PSBcIi9cIiAmJiAhZW5kKSBicmVha1xuXG4gICAgICAgIHN3aXRjaCAodG9rKSB7XG4gICAgICAgICAgY2FzZSBcIltcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwU3RyaW5nKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocFJlcG9ydGVyKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocFByZWRpY2F0ZSgpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwie1wiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBFbWJlZGRlZCgpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiIFwiOlxuICAgICAgICAgIGNhc2UgXCJcXHRcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgaWYgKGxhYmVsICYmIGlzRGVmaW5lKGxhYmVsLnZhbHVlKSkge1xuICAgICAgICAgICAgICAvLyBkZWZpbmUgaGF0XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE91dGxpbmUoKSlcbiAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIuKXglwiOlxuICAgICAgICAgIGNhc2UgXCLilrhcIjpcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocEljb24oKSlcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiQFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICB2YXIgbmFtZSA9IFwiXCJcbiAgICAgICAgICAgIHdoaWxlICh0b2sgJiYgL1thLXpBLVpdLy50ZXN0KHRvaykpIHtcbiAgICAgICAgICAgICAgbmFtZSArPSB0b2tcbiAgICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJjbG91ZFwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gobmV3IExhYmVsKFwi4piBXCIpKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICAgICAgICBJY29uLmljb25zLmhhc093blByb3BlcnR5KG5hbWUpXG4gICAgICAgICAgICAgICAgICA/IG5ldyBJY29uKG5hbWUpXG4gICAgICAgICAgICAgICAgICA6IG5ldyBMYWJlbChcIkBcIiArIG5hbWUpXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiXFxcXFwiOlxuICAgICAgICAgICAgbmV4dCgpIC8vIGVzY2FwZSBjaGFyYWN0ZXJcbiAgICAgICAgICAvLyBmYWxsLXRocnVcbiAgICAgICAgICBjYXNlIFwiOlwiOlxuICAgICAgICAgICAgaWYgKHRvayA9PT0gXCI6XCIgJiYgcGVlaygpID09PSBcIjpcIikge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdmVycmlkZXMoZW5kKSlcbiAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgICAgICAgICB9IC8vIGZhbGwtdGhydVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAoIWxhYmVsKSBjaGlsZHJlbi5wdXNoKChsYWJlbCA9IG5ldyBMYWJlbChcIlwiKSkpXG4gICAgICAgICAgICBsYWJlbC52YWx1ZSArPSB0b2tcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwU3RyaW5nKCkge1xuICAgICAgbmV4dCgpIC8vICdbJ1xuICAgICAgdmFyIHMgPSBcIlwiXG4gICAgICB2YXIgZXNjYXBlViA9IGZhbHNlXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJdXCIgJiYgdG9rICE9PSBcIlxcblwiKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgaWYgKHRvayA9PT0gXCJ2XCIpIGVzY2FwZVYgPSB0cnVlXG4gICAgICAgICAgaWYgKCF0b2spIGJyZWFrXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXNjYXBlViA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgcyArPSB0b2tcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAodG9rID09PSBcIl1cIikgbmV4dCgpXG4gICAgICBpZiAoaGV4Q29sb3JQYXQudGVzdChzKSkge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0KFwiY29sb3JcIiwgcylcbiAgICAgIH1cbiAgICAgIHJldHVybiAhZXNjYXBlViAmJiAvIHYkLy50ZXN0KHMpXG4gICAgICAgID8gbWFrZU1lbnUoXCJkcm9wZG93blwiLCBzLnNsaWNlKDAsIHMubGVuZ3RoIC0gMikpXG4gICAgICAgIDogbmV3IElucHV0KFwic3RyaW5nXCIsIHMpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcEJsb2NrKGVuZCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKGVuZClcbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSBcIlxcblwiKSB7XG4gICAgICAgIHNhd05MID0gdHJ1ZVxuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICAvLyBkZWZpbmUgaGF0c1xuICAgICAgdmFyIGZpcnN0ID0gY2hpbGRyZW5bMF1cbiAgICAgIGlmIChmaXJzdCAmJiBmaXJzdC5pc0xhYmVsICYmIGlzRGVmaW5lKGZpcnN0LnZhbHVlKSkge1xuICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoIDwgMikge1xuICAgICAgICAgIGNoaWxkcmVuLnB1c2gobWFrZUJsb2NrKFwib3V0bGluZVwiLCBbXSkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1ha2VCbG9jayhcImRlZmluZS1oYXRcIiwgY2hpbGRyZW4pXG4gICAgICB9XG5cbiAgICAgIC8vIHN0YW5kYWxvbmUgcmVwb3J0ZXJzXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuWzBdXG4gICAgICAgIGlmIChcbiAgICAgICAgICBjaGlsZC5pc0Jsb2NrICYmXG4gICAgICAgICAgKGNoaWxkLmlzUmVwb3J0ZXIgfHwgY2hpbGQuaXNCb29sZWFuIHx8IGNoaWxkLmlzUmluZylcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1ha2VCbG9jayhcInN0YWNrXCIsIGNoaWxkcmVuKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBSZXBvcnRlcigpIHtcbiAgICAgIG5leHQoKSAvLyAnKCdcblxuICAgICAgLy8gZW1wdHkgbnVtYmVyLWRyb3Bkb3duXG4gICAgICBpZiAodG9rID09PSBcIiBcIikge1xuICAgICAgICBuZXh0KClcbiAgICAgICAgaWYgKHRvayA9PT0gXCJ2XCIgJiYgcGVlaygpID09PSBcIilcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJudW1iZXItZHJvcGRvd25cIiwgXCJcIilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoXCIpXCIpXG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCIpXCIpIG5leHQoKVxuXG4gICAgICAvLyBlbXB0eSBudW1iZXJzXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJudW1iZXJcIiwgXCJcIilcbiAgICAgIH1cblxuICAgICAgLy8gbnVtYmVyXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIGNoaWxkcmVuWzBdLmlzTGFiZWwpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gY2hpbGRyZW5bMF0udmFsdWVcbiAgICAgICAgaWYgKC9eWzAtOWUuLV0qJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IElucHV0KFwibnVtYmVyXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIG51bWJlci1kcm9wZG93blxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWNoaWxkcmVuW2ldLmlzTGFiZWwpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaSA9PT0gY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHZhciBsYXN0ID0gY2hpbGRyZW5baSAtIDFdXG4gICAgICAgIGlmIChpID4gMSAmJiBsYXN0LnZhbHVlID09PSBcInZcIikge1xuICAgICAgICAgIGNoaWxkcmVuLnBvcCgpXG4gICAgICAgICAgdmFyIHZhbHVlID0gY2hpbGRyZW5cbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24obCkge1xuICAgICAgICAgICAgICByZXR1cm4gbC52YWx1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKFwiIFwiKVxuICAgICAgICAgIHJldHVybiBtYWtlTWVudShcIm51bWJlci1kcm9wZG93blwiLCB2YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgYmxvY2sgPSBtYWtlQmxvY2soXCJyZXBvcnRlclwiLCBjaGlsZHJlbilcblxuICAgICAgLy8gcmluZ3NcbiAgICAgIGlmIChibG9jay5pbmZvLnNoYXBlID09PSBcInJpbmdcIikge1xuICAgICAgICB2YXIgZmlyc3QgPSBibG9jay5jaGlsZHJlblswXVxuICAgICAgICBpZiAoXG4gICAgICAgICAgZmlyc3QgJiZcbiAgICAgICAgICBmaXJzdC5pc0lucHV0ICYmXG4gICAgICAgICAgZmlyc3Quc2hhcGUgPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICBmaXJzdC52YWx1ZSA9PT0gXCJcIlxuICAgICAgICApIHtcbiAgICAgICAgICBibG9jay5jaGlsZHJlblswXSA9IG5ldyBJbnB1dChcInJlcG9ydGVyXCIpXG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKGZpcnN0ICYmIGZpcnN0LmlzU2NyaXB0ICYmIGZpcnN0LmlzRW1wdHkpIHx8XG4gICAgICAgICAgKGZpcnN0ICYmIGZpcnN0LmlzQmxvY2sgJiYgIWZpcnN0LmNoaWxkcmVuLmxlbmd0aClcbiAgICAgICAgKSB7XG4gICAgICAgICAgYmxvY2suY2hpbGRyZW5bMF0gPSBuZXcgSW5wdXQoXCJzdGFja1wiKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBibG9ja1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBQcmVkaWNhdGUoKSB7XG4gICAgICBuZXh0KCkgLy8gJzwnXG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoXCI+XCIpXG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCI+XCIpIG5leHQoKVxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0KFwiYm9vbGVhblwiKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VCbG9jayhcImJvb2xlYW5cIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcEVtYmVkZGVkKCkge1xuICAgICAgbmV4dCgpIC8vICd7J1xuXG4gICAgICBzYXdOTCA9IGZhbHNlXG4gICAgICB2YXIgZiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJ9XCIpIHtcbiAgICAgICAgICB2YXIgYmxvY2sgPSBwQmxvY2soXCJ9XCIpXG4gICAgICAgICAgaWYgKGJsb2NrKSByZXR1cm4gYmxvY2tcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIHNjcmlwdHMgPSBwYXJzZVNjcmlwdHMoZilcbiAgICAgIHZhciBibG9ja3MgPSBbXVxuICAgICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgICBibG9ja3MgPSBibG9ja3MuY29uY2F0KHNjcmlwdC5ibG9ja3MpXG4gICAgICB9KVxuXG4gICAgICBpZiAodG9rID09PSBcIn1cIikgbmV4dCgpXG4gICAgICBpZiAoIXNhd05MKSB7XG4gICAgICAgIGFzc2VydChibG9ja3MubGVuZ3RoIDw9IDEpXG4gICAgICAgIHJldHVybiBibG9ja3MubGVuZ3RoID8gYmxvY2tzWzBdIDogbWFrZUJsb2NrKFwic3RhY2tcIiwgW10pXG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNjcmlwdChibG9ja3MpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcEljb24oKSB7XG4gICAgICB2YXIgYyA9IHRva1xuICAgICAgbmV4dCgpXG4gICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICAgY2FzZSBcIuKWuFwiOlxuICAgICAgICAgIHJldHVybiBuZXcgSWNvbihcImFkZElucHV0XCIpXG4gICAgICAgIGNhc2UgXCLil4JcIjpcbiAgICAgICAgICByZXR1cm4gbmV3IEljb24oXCJkZWxJbnB1dFwiKVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBPdmVycmlkZXMoZW5kKSB7XG4gICAgICBuZXh0KClcbiAgICAgIG5leHQoKVxuICAgICAgdmFyIG92ZXJyaWRlcyA9IFtdXG4gICAgICB2YXIgb3ZlcnJpZGUgPSBcIlwiXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIiAmJiB0b2sgIT09IGVuZCkge1xuICAgICAgICBpZiAodG9rID09PSBcIiBcIikge1xuICAgICAgICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVzLnB1c2gob3ZlcnJpZGUpXG4gICAgICAgICAgICBvdmVycmlkZSA9IFwiXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdmVycmlkZSArPSB0b2tcbiAgICAgICAgfVxuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIGlmIChvdmVycmlkZSkgb3ZlcnJpZGVzLnB1c2gob3ZlcnJpZGUpXG4gICAgICByZXR1cm4gb3ZlcnJpZGVzXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcENvbW1lbnQoZW5kKSB7XG4gICAgICBuZXh0KClcbiAgICAgIG5leHQoKVxuICAgICAgdmFyIGNvbW1lbnQgPSBcIlwiXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIiAmJiB0b2sgIT09IGVuZCkge1xuICAgICAgICBjb21tZW50ICs9IHRva1xuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSBcIlxcblwiKSBuZXh0KClcbiAgICAgIHJldHVybiBuZXcgQ29tbWVudChjb21tZW50LCB0cnVlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBPdXRsaW5lKCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgIGZ1bmN0aW9uIHBhcnNlQXJnKGtpbmQsIGVuZCkge1xuICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgbmV4dCgpXG4gICAgICAgIHZhciBwYXJ0cyA9IHBQYXJ0cyhlbmQpXG4gICAgICAgIGlmICh0b2sgPT09IGVuZCkgbmV4dCgpXG4gICAgICAgIGNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgcGFpbnRCbG9jayhcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc2hhcGU6IGtpbmQgPT09IFwiYm9vbGVhblwiID8gXCJib29sZWFuXCIgOiBcInJlcG9ydGVyXCIsXG4gICAgICAgICAgICAgIGFyZ3VtZW50OiBraW5kLFxuICAgICAgICAgICAgICBjYXRlZ29yeTogXCJjdXN0b20tYXJnXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGFydHMsXG4gICAgICAgICAgICBsYW5ndWFnZXNcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIHZhciBsYWJlbFxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCIvXCIgJiYgcGVlaygpID09PSBcIi9cIikge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoICh0b2spIHtcbiAgICAgICAgICBjYXNlIFwiKFwiOlxuICAgICAgICAgICAgcGFyc2VBcmcoXCJudW1iZXJcIiwgXCIpXCIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJbXCI6XG4gICAgICAgICAgICBwYXJzZUFyZyhcInN0cmluZ1wiLCBcIl1cIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIHBhcnNlQXJnKFwiYm9vbGVhblwiLCBcIj5cIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAvLyBmYWxsLXRocnVcbiAgICAgICAgICBjYXNlIFwiOlwiOlxuICAgICAgICAgICAgaWYgKHRvayA9PT0gXCI6XCIgJiYgcGVlaygpID09PSBcIjpcIikge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdmVycmlkZXMoKSlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH0gLy8gZmFsbC10aHJ1XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICghbGFiZWwpIGNoaWxkcmVuLnB1c2goKGxhYmVsID0gbmV3IExhYmVsKFwiXCIpKSlcbiAgICAgICAgICAgIGxhYmVsLnZhbHVlICs9IHRva1xuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlQmxvY2soXCJvdXRsaW5lXCIsIGNoaWxkcmVuKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBMaW5lKCkge1xuICAgICAgdmFyIGRpZmZcbiAgICAgIGlmICh0b2sgPT09IFwiK1wiIHx8IHRvayA9PT0gXCItXCIpIHtcbiAgICAgICAgZGlmZiA9IHRva1xuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIHZhciBibG9jayA9IHBCbG9jaygpXG4gICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiKSB7XG4gICAgICAgIHZhciBjb21tZW50ID0gcENvbW1lbnQoKVxuICAgICAgICBjb21tZW50Lmhhc0Jsb2NrID0gYmxvY2sgJiYgYmxvY2suY2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIGlmICghY29tbWVudC5oYXNCbG9jaykge1xuICAgICAgICAgIHJldHVybiBjb21tZW50XG4gICAgICAgIH1cbiAgICAgICAgYmxvY2suY29tbWVudCA9IGNvbW1lbnRcbiAgICAgIH1cbiAgICAgIGlmIChibG9jaykgYmxvY2suZGlmZiA9IGRpZmZcbiAgICAgIHJldHVybiBibG9ja1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdG9rKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgICB2YXIgbGluZSA9IHBMaW5lKClcbiAgICAgIHJldHVybiBsaW5lIHx8IFwiTkxcIlxuICAgIH1cbiAgfVxuXG4gIC8qICogKi9cblxuICBmdW5jdGlvbiBwYXJzZVNjcmlwdHMoZ2V0TGluZSkge1xuICAgIHZhciBsaW5lID0gZ2V0TGluZSgpXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIGxpbmUgPSBnZXRMaW5lKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwRmlsZSgpIHtcbiAgICAgIHdoaWxlIChsaW5lID09PSBcIk5MXCIpIG5leHQoKVxuICAgICAgdmFyIHNjcmlwdHMgPSBbXVxuICAgICAgd2hpbGUgKGxpbmUpIHtcbiAgICAgICAgdmFyIGJsb2NrcyA9IFtdXG4gICAgICAgIHdoaWxlIChsaW5lICYmIGxpbmUgIT09IFwiTkxcIikge1xuICAgICAgICAgIHZhciBiID0gcExpbmUoKVxuICAgICAgICAgIHZhciBpc0dsb3cgPSBiLmRpZmYgPT09IFwiK1wiXG4gICAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgICAgYi5kaWZmID0gbnVsbFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChiLmlzRWxzZSB8fCBiLmlzRW5kKSB7XG4gICAgICAgICAgICBiID0gbmV3IEJsb2NrKFxuICAgICAgICAgICAgICBleHRlbmQoYi5pbmZvLCB7XG4gICAgICAgICAgICAgICAgc2hhcGU6IFwic3RhY2tcIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGIuY2hpbGRyZW5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgICAgICAgICBpZiAobGFzdCAmJiBsYXN0LmlzR2xvdykge1xuICAgICAgICAgICAgICBibG9ja3MucG9wKClcbiAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gbGFzdC5jaGlsZC5pc1NjcmlwdFxuICAgICAgICAgICAgICAgID8gbGFzdC5jaGlsZC5ibG9ja3NcbiAgICAgICAgICAgICAgICA6IFtsYXN0LmNoaWxkXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChiKVxuICAgICAgICAgICAgYmxvY2tzLnB1c2gobmV3IEdsb3cobmV3IFNjcmlwdChjaGlsZHJlbikpKVxuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0hhdCkge1xuICAgICAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGgpIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpXG4gICAgICAgICAgICBibG9ja3MgPSBbYl1cbiAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNGaW5hbCkge1xuICAgICAgICAgICAgYmxvY2tzLnB1c2goYilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfSBlbHNlIGlmIChiLmlzQ29tbWFuZCkge1xuICAgICAgICAgICAgYmxvY2tzLnB1c2goYilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcmVwb3J0ZXIgb3IgcHJlZGljYXRlXG4gICAgICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICAgIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KFtiXSkpXG4gICAgICAgICAgICBibG9ja3MgPSBbXVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGgpIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpXG4gICAgICAgIHdoaWxlIChsaW5lID09PSBcIk5MXCIpIG5leHQoKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNjcmlwdHNcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTGluZSgpIHtcbiAgICAgIHZhciBiID0gbGluZVxuICAgICAgbmV4dCgpXG5cbiAgICAgIGlmIChiLmhhc1NjcmlwdCkge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHZhciBibG9ja3MgPSBwTW91dGgoKVxuICAgICAgICAgIGIuY2hpbGRyZW4ucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpXG4gICAgICAgICAgaWYgKGxpbmUgJiYgbGluZS5pc0Vsc2UpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBiLmNoaWxkcmVuLnB1c2gobGluZS5jaGlsZHJlbltpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGxpbmUgJiYgbGluZS5pc0VuZCkge1xuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBiXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE1vdXRoKCkge1xuICAgICAgdmFyIGJsb2NrcyA9IFtdXG4gICAgICB3aGlsZSAobGluZSkge1xuICAgICAgICBpZiAobGluZSA9PT0gXCJOTFwiKSB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWxpbmUuaXNDb21tYW5kKSB7XG4gICAgICAgICAgcmV0dXJuIGJsb2Nrc1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGIgPSBwTGluZSgpXG4gICAgICAgIHZhciBpc0dsb3cgPSBiLmRpZmYgPT09IFwiK1wiXG4gICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICBiLmRpZmYgPSBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgdmFyIGxhc3QgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgICAgICBpZiAobGFzdCAmJiBsYXN0LmlzR2xvdykge1xuICAgICAgICAgICAgYmxvY2tzLnBvcCgpXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBsYXN0LmNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgICAgID8gbGFzdC5jaGlsZC5ibG9ja3NcbiAgICAgICAgICAgICAgOiBbbGFzdC5jaGlsZF1cbiAgICAgICAgICB9XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaChiKVxuICAgICAgICAgIGJsb2Nrcy5wdXNoKG5ldyBHbG93KG5ldyBTY3JpcHQoY2hpbGRyZW4pKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYmxvY2tzXG4gICAgfVxuXG4gICAgcmV0dXJuIHBGaWxlKClcbiAgfVxuXG4gIC8qICogKi9cblxuICBmdW5jdGlvbiBlYWNoQmxvY2soeCwgY2IpIHtcbiAgICBpZiAoeC5pc1NjcmlwdCkge1xuICAgICAgeC5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgICBlYWNoQmxvY2soYmxvY2ssIGNiKVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHguaXNCbG9jaykge1xuICAgICAgY2IoeClcbiAgICAgIHguY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICBlYWNoQmxvY2soY2hpbGQsIGNiKVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHguaXNHbG93KSB7XG4gICAgICBlYWNoQmxvY2soeC5jaGlsZCwgY2IpXG4gICAgfVxuICB9XG5cbiAgdmFyIGxpc3RCbG9ja3MgPSB7XG4gICAgXCJhcHBlbmQ6dG9MaXN0OlwiOiAxLFxuICAgIFwiZGVsZXRlTGluZTpvZkxpc3Q6XCI6IDEsXG4gICAgXCJpbnNlcnQ6YXQ6b2ZMaXN0OlwiOiAyLFxuICAgIFwic2V0TGluZTpvZkxpc3Q6dG86XCI6IDEsXG4gICAgXCJzaG93TGlzdDpcIjogMCxcbiAgICBcImhpZGVMaXN0OlwiOiAwLFxuICB9XG5cbiAgZnVuY3Rpb24gcmVjb2duaXNlU3R1ZmYoc2NyaXB0cykge1xuICAgIHZhciBjdXN0b21CbG9ja3NCeUhhc2ggPSB7fVxuICAgIHZhciBsaXN0TmFtZXMgPSB7fVxuXG4gICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgdmFyIGN1c3RvbUFyZ3MgPSB7fVxuXG4gICAgICBlYWNoQmxvY2soc2NyaXB0LCBmdW5jdGlvbihibG9jaykge1xuICAgICAgICAvLyBjdXN0b20gYmxvY2tzXG4gICAgICAgIGlmIChibG9jay5pbmZvLnNoYXBlID09PSBcImRlZmluZS1oYXRcIikge1xuICAgICAgICAgIHZhciBvdXRsaW5lID0gYmxvY2suY2hpbGRyZW5bMV1cbiAgICAgICAgICBpZiAoIW91dGxpbmUpIHJldHVyblxuXG4gICAgICAgICAgdmFyIG5hbWVzID0gW11cbiAgICAgICAgICB2YXIgcGFydHMgPSBbXVxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3V0bGluZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gb3V0bGluZS5jaGlsZHJlbltpXVxuICAgICAgICAgICAgaWYgKGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgICAgICAgcGFydHMucHVzaChjaGlsZC52YWx1ZSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNCbG9jaykge1xuICAgICAgICAgICAgICBpZiAoIWNoaWxkLmluZm8uYXJndW1lbnQpIHJldHVyblxuICAgICAgICAgICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIG51bWJlcjogXCIlblwiLFxuICAgICAgICAgICAgICAgICAgc3RyaW5nOiBcIiVzXCIsXG4gICAgICAgICAgICAgICAgICBib29sZWFuOiBcIiViXCIsXG4gICAgICAgICAgICAgICAgfVtjaGlsZC5pbmZvLmFyZ3VtZW50XVxuICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgdmFyIG5hbWUgPSBibG9ja05hbWUoY2hpbGQpXG4gICAgICAgICAgICAgIG5hbWVzLnB1c2gobmFtZSlcbiAgICAgICAgICAgICAgY3VzdG9tQXJnc1tuYW1lXSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHNwZWMgPSBwYXJ0cy5qb2luKFwiIFwiKVxuICAgICAgICAgIHZhciBoYXNoID0gaGFzaFNwZWMoc3BlYylcbiAgICAgICAgICB2YXIgaW5mbyA9IChjdXN0b21CbG9ja3NCeUhhc2hbaGFzaF0gPSB7XG4gICAgICAgICAgICBzcGVjOiBzcGVjLFxuICAgICAgICAgICAgbmFtZXM6IG5hbWVzLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwicHJvY0RlZlwiXG4gICAgICAgICAgYmxvY2suaW5mby5jYWxsID0gaW5mby5zcGVjXG4gICAgICAgICAgYmxvY2suaW5mby5uYW1lcyA9IGluZm8ubmFtZXNcbiAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJjdXN0b21cIlxuXG4gICAgICAgICAgLy8gZml4IHVwIGlmL2Vsc2Ugc2VsZWN0b3JzXG4gICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaW5mby5zZWxlY3RvciA9PT0gXCJkb0lmRWxzZVwiKSB7XG4gICAgICAgICAgdmFyIGxhc3QyID0gYmxvY2suY2hpbGRyZW5bYmxvY2suY2hpbGRyZW4ubGVuZ3RoIC0gMl1cbiAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID1cbiAgICAgICAgICAgIGxhc3QyICYmIGxhc3QyLmlzTGFiZWwgJiYgbGFzdDIudmFsdWUgPT09IFwiZWxzZVwiXG4gICAgICAgICAgICAgID8gXCJkb0lmRWxzZVwiXG4gICAgICAgICAgICAgIDogXCJkb0lmXCJcblxuICAgICAgICAgIC8vIGN1c3RvbSBhcmd1bWVudHNcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ICYmXG4gICAgICAgICAgKGJsb2NrLmlzUmVwb3J0ZXIgfHwgYmxvY2suaXNCb29sZWFuKVxuICAgICAgICApIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShibG9jaylcbiAgICAgICAgICBpZiAoY3VzdG9tQXJnc1tuYW1lXSkge1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwiY3VzdG9tLWFyZ1wiXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcImdldFBhcmFtXCJcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBsaXN0IG5hbWVzXG4gICAgICAgIH0gZWxzZSBpZiAobGlzdEJsb2Nrcy5oYXNPd25Qcm9wZXJ0eShibG9jay5pbmZvLnNlbGVjdG9yKSkge1xuICAgICAgICAgIHZhciBhcmdJbmRleCA9IGxpc3RCbG9ja3NbYmxvY2suaW5mby5zZWxlY3Rvcl1cbiAgICAgICAgICB2YXIgaW5wdXRzID0gYmxvY2suY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICByZXR1cm4gIWNoaWxkLmlzTGFiZWxcbiAgICAgICAgICB9KVxuICAgICAgICAgIHZhciBpbnB1dCA9IGlucHV0c1thcmdJbmRleF1cbiAgICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQuaXNJbnB1dCkge1xuICAgICAgICAgICAgbGlzdE5hbWVzW2lucHV0LnZhbHVlXSA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIGVhY2hCbG9jayhzY3JpcHQsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIC8vIGN1c3RvbSBibG9ja3NcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgJiZcbiAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID09PSBcIm9ic29sZXRlXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgdmFyIGluZm8gPSBjdXN0b21CbG9ja3NCeUhhc2hbYmxvY2suaW5mby5oYXNoXVxuICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJjYWxsXCJcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2FsbCA9IGluZm8uc3BlY1xuICAgICAgICAgICAgYmxvY2suaW5mby5uYW1lcyA9IGluZm8ubmFtZXNcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImN1c3RvbVwiXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gbGlzdCByZXBvcnRlcnNcbiAgICAgICAgfSBlbHNlIGlmIChibG9jay5pc1JlcG9ydGVyKSB7XG4gICAgICAgICAgdmFyIG5hbWUgPSBibG9ja05hbWUoYmxvY2spXG4gICAgICAgICAgaWYgKCFuYW1lKSByZXR1cm5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID09PSBcInZhcmlhYmxlc1wiICYmXG4gICAgICAgICAgICBsaXN0TmFtZXNbbmFtZV0gJiZcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImxpc3RcIlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChibG9jay5pbmZvLmNhdGVnb3J5ID09PSBcImxpc3RcIikge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwiY29udGVudHNPZkxpc3Q6XCJcbiAgICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwidmFyaWFibGVzXCIpIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcInJlYWRWYXJpYWJsZVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZShjb2RlLCBvcHRpb25zKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoXG4gICAgICB7XG4gICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICAgIGxhbmd1YWdlczogW1wiZW5cIl0sXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoLyZsdDsvZywgXCI8XCIpXG4gICAgY29kZSA9IGNvZGUucmVwbGFjZSgvJmd0Oy9nLCBcIj5cIilcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcbi9nLCBcIiBcIilcbiAgICB9XG5cbiAgICB2YXIgbGFuZ3VhZ2VzID0gb3B0aW9ucy5sYW5ndWFnZXMubWFwKGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgIHJldHVybiBhbGxMYW5ndWFnZXNbY29kZV1cbiAgICB9KVxuXG4gICAgLyogKiAqL1xuXG4gICAgdmFyIGYgPSBwYXJzZUxpbmVzKGNvZGUsIGxhbmd1YWdlcylcbiAgICB2YXIgc2NyaXB0cyA9IHBhcnNlU2NyaXB0cyhmKVxuICAgIHJlY29nbmlzZVN0dWZmKHNjcmlwdHMpXG4gICAgcmV0dXJuIG5ldyBEb2N1bWVudChzY3JpcHRzKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwYXJzZTogcGFyc2UsXG4gIH1cbn0pKClcbiJdfQ==
