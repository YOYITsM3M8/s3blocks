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
    "oldextension",
    "music",
    "video",
    "microbit",
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
        "M 0 12",
        "c 14,-15 52,-15 66,0",
        ["L", w - 4, 12].join(" "),
        "a 4 4 0 0 1 4 4",
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
    music: { width: 26, height: 26 },
    pen: { width: 26, height: 26, dy: 2 },
    video: { width: 26, height: 26, dy: 6.5 },
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
        if (this.isCommand) {
          this.children.unshift(new Icon("normal"))
        }
        break
      case "music":
        this.children.unshift(new Icon("line"))
        this.children.unshift(new Icon("music"))
        this.info.category = "extension"
        break
      case "pen":
        this.children.unshift(new Icon("line"))
        this.children.unshift(new Icon("pen"))
        //this.info.category = "extension"
        break
      case "video":
        this.children.unshift(new Icon("line"))
        this.children.unshift(new Icon("video"))
        this.info.category = "extension"
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
    hat: [21, 6, 7],
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
      var p = Math.min(26, (3.5 + 0.13 * innerWidth) | 0) - 15
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
    .sb-oldextension { fill: #4b4a60; }
    .sb-extension { fill: #0fbd8c; }
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
          id: "music",
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
          id: "pen",
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
          id: "video",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbnRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJmdW5jdGlvbiBtYWtlQ2FudmFzKCkge1xuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxufVxuXG52YXIgc2NyYXRjaGJsb2NrcyA9ICh3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vbGliL1wiKShcbiAgd2luZG93LFxuICBtYWtlQ2FudmFzXG4pKVxuXG4vLyBhZGQgb3VyIENTUyB0byB0aGUgcGFnZVxudmFyIHN0eWxlID0gc2NyYXRjaGJsb2Nrcy5tYWtlU3R5bGUoKVxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIC8vIExpc3Qgb2YgY2xhc3NlcyB3ZSdyZSBhbGxvd2VkIHRvIG92ZXJyaWRlLlxuXG4gIHZhciBvdmVycmlkZUNhdGVnb3JpZXMgPSBbXG4gICAgXCJtb3Rpb25cIixcbiAgICBcImxvb2tzXCIsXG4gICAgXCJzb3VuZFwiLFxuICAgIFwicGVuXCIsXG4gICAgXCJ2YXJpYWJsZXNcIixcbiAgICBcImxpc3RcIixcbiAgICBcImV2ZW50c1wiLFxuICAgIFwiY29udHJvbFwiLFxuICAgIFwic2Vuc2luZ1wiLFxuICAgIFwib3BlcmF0b3JzXCIsXG4gICAgXCJjdXN0b21cIixcbiAgICBcImN1c3RvbS1hcmdcIixcbiAgICBcImV4dGVuc2lvblwiLFxuICAgIFwib2xkZXh0ZW5zaW9uXCIsXG4gICAgXCJtdXNpY1wiLFxuICAgIFwidmlkZW9cIixcbiAgICBcIm1pY3JvYml0XCIsXG4gICAgXCJncmV5XCIsXG4gICAgXCJvYnNvbGV0ZVwiLFxuICBdXG4gIHZhciBvdmVycmlkZVNoYXBlcyA9IFtcImhhdFwiLCBcImNhcFwiLCBcInN0YWNrXCIsIFwiYm9vbGVhblwiLCBcInJlcG9ydGVyXCIsIFwicmluZ1wiXVxuXG4gIC8vIGxhbmd1YWdlcyB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgcmlnaHQgdG8gbGVmdFxuICB2YXIgcnRsTGFuZ3VhZ2VzID0gW1wiYXJcIiwgXCJmYVwiLCBcImhlXCJdXG5cbiAgLy8gTGlzdCBvZiBjb21tYW5kcyB0YWtlbiBmcm9tIFNjcmF0Y2hcbiAgdmFyIHNjcmF0Y2hDb21tYW5kcyA9IHJlcXVpcmUoXCIuL2NvbW1hbmRzLmpzXCIpXG5cbiAgdmFyIGNhdGVnb3JpZXNCeUlkID0ge1xuICAgIDA6IFwib2Jzb2xldGVcIixcbiAgICAxOiBcIm1vdGlvblwiLFxuICAgIDI6IFwibG9va3NcIixcbiAgICAzOiBcInNvdW5kXCIsXG4gICAgNDogXCJwZW5cIixcbiAgICA1OiBcImV2ZW50c1wiLFxuICAgIDY6IFwiY29udHJvbFwiLFxuICAgIDc6IFwic2Vuc2luZ1wiLFxuICAgIDg6IFwib3BlcmF0b3JzXCIsXG4gICAgOTogXCJ2YXJpYWJsZXNcIixcbiAgICAxMDogXCJjdXN0b21cIixcbiAgICAxMTogXCJwYXJhbWV0ZXJcIixcbiAgICAxMjogXCJsaXN0XCIsXG4gICAgMjA6IFwiZXh0ZW5zaW9uXCIsXG4gICAgNDI6IFwiZ3JleVwiLFxuICB9XG5cbiAgdmFyIHR5cGVTaGFwZXMgPSB7XG4gICAgXCIgXCI6IFwic3RhY2tcIixcbiAgICBiOiBcImJvb2xlYW5cIixcbiAgICBjOiBcImMtYmxvY2tcIixcbiAgICBlOiBcImlmLWJsb2NrXCIsXG4gICAgZjogXCJjYXBcIixcbiAgICBoOiBcImhhdFwiLFxuICAgIHI6IFwicmVwb3J0ZXJcIixcbiAgICBjZjogXCJjLWJsb2NrIGNhcFwiLFxuICAgIGVsc2U6IFwiY2Vsc2VcIixcbiAgICBlbmQ6IFwiY2VuZFwiLFxuICAgIHJpbmc6IFwicmluZ1wiLFxuICB9XG5cbiAgdmFyIGlucHV0UGF0ID0gLyglW2EtekEtWl0oPzpcXC5bYS16QS1aMC05XSspPykvXG4gIHZhciBpbnB1dFBhdEdsb2JhbCA9IG5ldyBSZWdFeHAoaW5wdXRQYXQuc291cmNlLCBcImdcIilcbiAgdmFyIGljb25QYXQgPSAvKEBbYS16QS1aXSspL1xuICB2YXIgc3BsaXRQYXQgPSBuZXcgUmVnRXhwKFxuICAgIFtpbnB1dFBhdC5zb3VyY2UsIFwifFwiLCBpY29uUGF0LnNvdXJjZSwgXCJ8ICtcIl0uam9pbihcIlwiKSxcbiAgICBcImdcIlxuICApXG5cbiAgdmFyIGhleENvbG9yUGF0ID0gL14jKD86WzAtOWEtZkEtRl17M30pezEsMn0/JC9cblxuICBmdW5jdGlvbiBwYXJzZVNwZWMoc3BlYykge1xuICAgIHZhciBwYXJ0cyA9IHNwZWMuc3BsaXQoc3BsaXRQYXQpLmZpbHRlcih4ID0+ICEheClcbiAgICByZXR1cm4ge1xuICAgICAgc3BlYzogc3BlYyxcbiAgICAgIHBhcnRzOiBwYXJ0cyxcbiAgICAgIGlucHV0czogcGFydHMuZmlsdGVyKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0UGF0LnRlc3QocClcbiAgICAgIH0pLFxuICAgICAgaGFzaDogaGFzaFNwZWMoc3BlYyksXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFzaFNwZWMoc3BlYykge1xuICAgIHJldHVybiBtaW5pZnlIYXNoKHNwZWMucmVwbGFjZShpbnB1dFBhdEdsb2JhbCwgXCIgXyBcIikpXG4gIH1cblxuICBmdW5jdGlvbiBtaW5pZnlIYXNoKGhhc2gpIHtcbiAgICByZXR1cm4gaGFzaFxuICAgICAgLnJlcGxhY2UoL18vZywgXCIgXyBcIilcbiAgICAgIC5yZXBsYWNlKC8gKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9bLCU/Ol0vZywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC/Dny9nLCBcInNzXCIpXG4gICAgICAucmVwbGFjZSgvw6QvZywgXCJhXCIpXG4gICAgICAucmVwbGFjZSgvw7YvZywgXCJvXCIpXG4gICAgICAucmVwbGFjZSgvw7wvZywgXCJ1XCIpXG4gICAgICAucmVwbGFjZShcIi4gLiAuXCIsIFwiLi4uXCIpXG4gICAgICAucmVwbGFjZSgvXuKApiQvLCBcIi4uLlwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIHZhciBibG9ja3NCeVNlbGVjdG9yID0ge31cbiAgdmFyIGJsb2Nrc0J5U3BlYyA9IHt9XG4gIHZhciBhbGxCbG9ja3MgPSBzY3JhdGNoQ29tbWFuZHMubWFwKGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICB2YXIgaW5mbyA9IGV4dGVuZChwYXJzZVNwZWMoY29tbWFuZFswXSksIHtcbiAgICAgIHNoYXBlOiB0eXBlU2hhcGVzW2NvbW1hbmRbMV1dLCAvLyAvWyBiY2VmaHJdfGNmL1xuICAgICAgY2F0ZWdvcnk6IGNhdGVnb3JpZXNCeUlkW2NvbW1hbmRbMl0gJSAxMDBdLFxuICAgICAgc2VsZWN0b3I6IGNvbW1hbmRbM10sXG4gICAgICBoYXNMb29wQXJyb3c6XG4gICAgICAgIFtcImRvUmVwZWF0XCIsIFwiZG9VbnRpbFwiLCBcImRvRm9yZXZlclwiXS5pbmRleE9mKGNvbW1hbmRbM10pID4gLTEsXG4gICAgfSlcbiAgICBpZiAoaW5mby5zZWxlY3Rvcikge1xuICAgICAgLy8gbmIuIGNvbW1hbmQgb3JkZXIgbWF0dGVycyFcbiAgICAgIC8vIFNjcmF0Y2ggMS40IGJsb2NrcyBhcmUgbGlzdGVkIGxhc3RcbiAgICAgIGlmICghYmxvY2tzQnlTZWxlY3RvcltpbmZvLnNlbGVjdG9yXSlcbiAgICAgICAgYmxvY2tzQnlTZWxlY3RvcltpbmZvLnNlbGVjdG9yXSA9IGluZm9cbiAgICB9XG4gICAgcmV0dXJuIChibG9ja3NCeVNwZWNbaW5mby5zcGVjXSA9IGluZm8pXG4gIH0pXG5cbiAgdmFyIHVuaWNvZGVJY29ucyA9IHtcbiAgICBcIkBncmVlbkZsYWdcIjogXCLimpFcIixcbiAgICBcIkB0dXJuUmlnaHRcIjogXCLihrtcIixcbiAgICBcIkB0dXJuTGVmdFwiOiBcIuKGulwiLFxuICAgIFwiQGFkZElucHV0XCI6IFwi4pa4XCIsXG4gICAgXCJAZGVsSW5wdXRcIjogXCLil4JcIixcbiAgfVxuXG4gIHZhciBhbGxMYW5ndWFnZXMgPSB7fVxuICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2UpIHtcbiAgICB2YXIgYmxvY2tzQnlIYXNoID0gKGxhbmd1YWdlLmJsb2Nrc0J5SGFzaCA9IHt9KVxuXG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuY29tbWFuZHMpLmZvckVhY2goZnVuY3Rpb24oc3BlYykge1xuICAgICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5ndWFnZS5jb21tYW5kc1tzcGVjXVxuICAgICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTcGVjW3NwZWNdXG5cbiAgICAgIHZhciBuYXRpdmVIYXNoID0gaGFzaFNwZWMobmF0aXZlU3BlYylcbiAgICAgIGJsb2Nrc0J5SGFzaFtuYXRpdmVIYXNoXSA9IGJsb2NrXG5cbiAgICAgIC8vIGZhbGxiYWNrIGltYWdlIHJlcGxhY2VtZW50LCBmb3IgbGFuZ3VhZ2VzIHdpdGhvdXQgYWxpYXNlc1xuICAgICAgdmFyIG0gPSBpY29uUGF0LmV4ZWMoc3BlYylcbiAgICAgIGlmIChtKSB7XG4gICAgICAgIHZhciBpbWFnZSA9IG1bMF1cbiAgICAgICAgdmFyIGhhc2ggPSBuYXRpdmVIYXNoLnJlcGxhY2UoaW1hZ2UsIHVuaWNvZGVJY29uc1tpbWFnZV0pXG4gICAgICAgIGJsb2Nrc0J5SGFzaFtoYXNoXSA9IGJsb2NrXG4gICAgICB9XG4gICAgfSlcblxuICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXMgPSB7fVxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmFsaWFzZXMpLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpIHtcbiAgICAgIHZhciBzcGVjID0gbGFuZ3VhZ2UuYWxpYXNlc1thbGlhc11cbiAgICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U3BlY1tzcGVjXVxuXG4gICAgICB2YXIgYWxpYXNIYXNoID0gaGFzaFNwZWMoYWxpYXMpXG4gICAgICBibG9ja3NCeUhhc2hbYWxpYXNIYXNoXSA9IGJsb2NrXG5cbiAgICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXNbc3BlY10gPSBhbGlhc1xuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5uYXRpdmVEcm9wZG93bnMgPSB7fVxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmRyb3Bkb3ducykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgbmF0aXZlTmFtZSA9IGxhbmd1YWdlLmRyb3Bkb3duc1tuYW1lXVxuICAgICAgbGFuZ3VhZ2UubmF0aXZlRHJvcGRvd25zW25hdGl2ZU5hbWVdID0gbmFtZVxuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5jb2RlID0gY29kZVxuICAgIGFsbExhbmd1YWdlc1tjb2RlXSA9IGxhbmd1YWdlXG4gIH1cbiAgZnVuY3Rpb24gbG9hZExhbmd1YWdlcyhsYW5ndWFnZXMpIHtcbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZXMpLmZvckVhY2goZnVuY3Rpb24oY29kZSkge1xuICAgICAgbG9hZExhbmd1YWdlKGNvZGUsIGxhbmd1YWdlc1tjb2RlXSlcbiAgICB9KVxuICB9XG5cbiAgdmFyIGVuZ2xpc2ggPSB7XG4gICAgYWxpYXNlczoge1xuICAgICAgXCJ0dXJuIGxlZnQgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjY3cgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiByaWdodCAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjdyAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwid2hlbiBnZiBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICAgIFwid2hlbiBmbGFnIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgICAgXCJ3aGVuIGdyZWVuIGZsYWcgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgICBcImNsZWFyXCI6IFwiZXJhc2UgYWxsXCIsXG4gICAgfSxcblxuICAgIGRlZmluZTogW1wiZGVmaW5lXCJdLFxuXG4gICAgLy8gRm9yIGlnbm9yaW5nIHRoZSBsdCBzaWduIGluIHRoZSBcIndoZW4gZGlzdGFuY2UgPCBfXCIgYmxvY2tcbiAgICBpZ25vcmVsdDogW1wid2hlbiBkaXN0YW5jZVwiXSxcblxuICAgIC8vIFZhbGlkIGFyZ3VtZW50cyB0byBcIm9mXCIgZHJvcGRvd24sIGZvciByZXNvbHZpbmcgYW1iaWd1b3VzIHNpdHVhdGlvbnNcbiAgICBtYXRoOiBbXG4gICAgICBcImFic1wiLFxuICAgICAgXCJmbG9vclwiLFxuICAgICAgXCJjZWlsaW5nXCIsXG4gICAgICBcInNxcnRcIixcbiAgICAgIFwic2luXCIsXG4gICAgICBcImNvc1wiLFxuICAgICAgXCJ0YW5cIixcbiAgICAgIFwiYXNpblwiLFxuICAgICAgXCJhY29zXCIsXG4gICAgICBcImF0YW5cIixcbiAgICAgIFwibG5cIixcbiAgICAgIFwibG9nXCIsXG4gICAgICBcImUgXlwiLFxuICAgICAgXCIxMCBeXCIsXG4gICAgXSxcblxuICAgIC8vIEZvciBkZXRlY3RpbmcgdGhlIFwic3RvcFwiIGNhcCAvIHN0YWNrIGJsb2NrXG4gICAgb3NpczogW1wib3RoZXIgc2NyaXB0cyBpbiBzcHJpdGVcIiwgXCJvdGhlciBzY3JpcHRzIGluIHN0YWdlXCJdLFxuXG4gICAgZHJvcGRvd25zOiB7fSxcblxuICAgIGNvbW1hbmRzOiB7fSxcbiAgfVxuICBhbGxCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpbmZvKSB7XG4gICAgZW5nbGlzaC5jb21tYW5kc1tpbmZvLnNwZWNdID0gaW5mby5zcGVjXG4gIH0pLFxuICAgIGxvYWRMYW5ndWFnZXMoe1xuICAgICAgZW46IGVuZ2xpc2gsXG4gICAgfSlcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgZnVuY3Rpb24gZGlzYW1iaWcoc2VsZWN0b3IxLCBzZWxlY3RvcjIsIHRlc3QpIHtcbiAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgICByZXR1cm4gYmxvY2tzQnlTZWxlY3Rvclt0ZXN0KGNoaWxkcmVuLCBsYW5nKSA/IHNlbGVjdG9yMSA6IHNlbGVjdG9yMl1cbiAgICB9XG4gICAgYmxvY2tzQnlTZWxlY3RvcltzZWxlY3RvcjFdLnNwZWNpYWxDYXNlID0gYmxvY2tzQnlTZWxlY3RvcltcbiAgICAgIHNlbGVjdG9yMlxuICAgIF0uc3BlY2lhbENhc2UgPSBmdW5jXG4gIH1cblxuICBkaXNhbWJpZyhcImNvbXB1dGVGdW5jdGlvbjpvZjpcIiwgXCJnZXRBdHRyaWJ1dGU6b2Y6XCIsIGZ1bmN0aW9uKGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gT3BlcmF0b3JzIGlmIG1hdGggZnVuY3Rpb24sIG90aGVyd2lzZSBzZW5zaW5nIFwiYXR0cmlidXRlIG9mXCIgYmxvY2tcbiAgICB2YXIgZmlyc3QgPSBjaGlsZHJlblswXVxuICAgIGlmICghZmlyc3QuaXNJbnB1dCkgcmV0dXJuXG4gICAgdmFyIG5hbWUgPSBmaXJzdC52YWx1ZVxuICAgIHJldHVybiBsYW5nLm1hdGguaW5kZXhPZihuYW1lKSA+IC0xXG4gIH0pXG5cbiAgZGlzYW1iaWcoXCJsaW5lQ291bnRPZkxpc3Q6XCIsIFwic3RyaW5nTGVuZ3RoOlwiLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIExpc3QgYmxvY2sgaWYgZHJvcGRvd24sIG90aGVyd2lzZSBvcGVyYXRvcnNcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgaWYgKCFsYXN0LmlzSW5wdXQpIHJldHVyblxuICAgIHJldHVybiBsYXN0LnNoYXBlID09PSBcImRyb3Bkb3duXCJcbiAgfSlcblxuICBkaXNhbWJpZyhcInBlbkNvbG9yOlwiLCBcInNldFBlbkh1ZVRvOlwiLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIENvbG9yIGJsb2NrIGlmIGNvbG9yIGlucHV0LCBvdGhlcndpc2UgbnVtZXJpY1xuICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAvLyBJZiB2YXJpYWJsZSwgYXNzdW1lIGNvbG9yIGlucHV0LCBzaW5jZSB0aGUgUkdCQSBoYWNrIGlzIGNvbW1vbi5cbiAgICAvLyBUT0RPIGZpeCBTY3JhdGNoIDpQXG4gICAgcmV0dXJuIChsYXN0LmlzSW5wdXQgJiYgbGFzdC5pc0NvbG9yKSB8fCBsYXN0LmlzQmxvY2tcbiAgfSlcblxuICBibG9ja3NCeVNlbGVjdG9yW1wic3RvcFNjcmlwdHNcIl0uc3BlY2lhbENhc2UgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIENhcCBibG9jayB1bmxlc3MgYXJndW1lbnQgaXMgXCJvdGhlciBzY3JpcHRzIGluIHNwcml0ZVwiXG4gICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgIGlmICghbGFzdC5pc0lucHV0KSByZXR1cm5cbiAgICB2YXIgdmFsdWUgPSBsYXN0LnZhbHVlXG4gICAgaWYgKGxhbmcub3Npcy5pbmRleE9mKHZhbHVlKSA+IC0xKSB7XG4gICAgICByZXR1cm4gZXh0ZW5kKGJsb2Nrc0J5U2VsZWN0b3JbXCJzdG9wU2NyaXB0c1wiXSwge1xuICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBIYXNoKGhhc2gsIGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxhbmcgPSBsYW5ndWFnZXNbaV1cbiAgICAgIGlmIChsYW5nLmJsb2Nrc0J5SGFzaC5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICB2YXIgYmxvY2sgPSBsYW5nLmJsb2Nrc0J5SGFzaFtoYXNoXVxuICAgICAgICBpZiAoaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiICYmIGJsb2NrLnNoYXBlICE9PSBcInJlcG9ydGVyXCIpIGNvbnRpbnVlXG4gICAgICAgIGlmIChpbmZvLnNoYXBlID09PSBcImJvb2xlYW5cIiAmJiBibG9jay5zaGFwZSAhPT0gXCJib29sZWFuXCIpIGNvbnRpbnVlXG4gICAgICAgIGlmIChibG9jay5zcGVjaWFsQ2FzZSkge1xuICAgICAgICAgIGJsb2NrID0gYmxvY2suc3BlY2lhbENhc2UoaW5mbywgY2hpbGRyZW4sIGxhbmcpIHx8IGJsb2NrXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogYmxvY2ssIGxhbmc6IGxhbmcgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvb2t1cERyb3Bkb3duKG5hbWUsIGxhbmd1YWdlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGFuZyA9IGxhbmd1YWdlc1tpXVxuICAgICAgaWYgKGxhbmcubmF0aXZlRHJvcGRvd25zLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIHZhciBuYXRpdmVOYW1lID0gbGFuZy5uYXRpdmVEcm9wZG93bnNbbmFtZV1cbiAgICAgICAgcmV0dXJuIG5hdGl2ZU5hbWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseU92ZXJyaWRlcyhpbmZvLCBvdmVycmlkZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG92ZXJyaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG5hbWUgPSBvdmVycmlkZXNbaV1cbiAgICAgIGlmIChoZXhDb2xvclBhdC50ZXN0KG5hbWUpKSB7XG4gICAgICAgIGluZm8uY29sb3IgPSBuYW1lXG4gICAgICAgIGluZm8uY2F0ZWdvcnkgPSBcIlwiXG4gICAgICAgIGluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgfSBlbHNlIGlmIChvdmVycmlkZUNhdGVnb3JpZXMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIGluZm8uY2F0ZWdvcnkgPSBuYW1lXG4gICAgICAgIGluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgfSBlbHNlIGlmIChvdmVycmlkZVNoYXBlcy5pbmRleE9mKG5hbWUpID4gLTEpIHtcbiAgICAgICAgaW5mby5zaGFwZSA9IG5hbWVcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJsb29wXCIpIHtcbiAgICAgICAgaW5mby5oYXNMb29wQXJyb3cgPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiK1wiIHx8IG5hbWUgPT09IFwiLVwiKSB7XG4gICAgICAgIGluZm8uZGlmZiA9IG5hbWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBibG9ja05hbWUoYmxvY2spIHtcbiAgICB2YXIgd29yZHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmxvY2suY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGJsb2NrLmNoaWxkcmVuW2ldXG4gICAgICBpZiAoIWNoaWxkLmlzTGFiZWwpIHJldHVyblxuICAgICAgd29yZHMucHVzaChjaGlsZC52YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oXCIgXCIpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGxvYWRMYW5ndWFnZXMsXG5cbiAgICBibG9ja05hbWUsXG5cbiAgICBhbGxMYW5ndWFnZXMsXG4gICAgbG9va3VwRHJvcGRvd24sXG4gICAgaGV4Q29sb3JQYXQsXG4gICAgbWluaWZ5SGFzaCxcbiAgICBsb29rdXBIYXNoLFxuICAgIGFwcGx5T3ZlcnJpZGVzLFxuICAgIHJ0bExhbmd1YWdlcyxcbiAgICBpY29uUGF0LFxuICAgIGhhc2hTcGVjLFxuXG4gICAgYmxvY2tzQnlTZWxlY3RvcixcbiAgICBwYXJzZVNwZWMsXG4gICAgaW5wdXRQYXQsXG4gICAgdW5pY29kZUljb25zLFxuICAgIGVuZ2xpc2gsXG4gIH1cbn0pKClcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICBbXCJtb3ZlICVuIHN0ZXBzXCIsIFwiIFwiLCAxLCBcImZvcndhcmQ6XCJdLFxuICBbXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLCBcIiBcIiwgMSwgXCJ0dXJuUmlnaHQ6XCJdLFxuICBbXCJ0dXJuIEB0dXJuTGVmdCAlbiBkZWdyZWVzXCIsIFwiIFwiLCAxLCBcInR1cm5MZWZ0OlwiXSxcbiAgW1wicG9pbnQgaW4gZGlyZWN0aW9uICVkLmRpcmVjdGlvblwiLCBcIiBcIiwgMSwgXCJoZWFkaW5nOlwiXSxcbiAgW1wicG9pbnQgdG93YXJkcyAlbS5zcHJpdGVPck1vdXNlXCIsIFwiIFwiLCAxLCBcInBvaW50VG93YXJkczpcIl0sXG4gIFtcImdvIHRvIHg6JW4geTolblwiLCBcIiBcIiwgMSwgXCJnb3RvWDp5OlwiXSxcbiAgW1wiZ28gdG8gJXIubG9jYXRpb25cIiwgXCIgXCIsIDEsIFwiZ290b1Nwcml0ZU9yTW91c2U6XCJdLFxuICBbXCJnbGlkZSAlbiBzZWNzIHRvIHg6JW4geTolblwiLCBcIiBcIiwgMSwgXCJnbGlkZVNlY3M6dG9YOnk6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wiY2hhbmdlIHggYnkgJW5cIiwgXCIgXCIsIDEsIFwiY2hhbmdlWHBvc0J5OlwiXSxcbiAgW1wic2V0IHggdG8gJW5cIiwgXCIgXCIsIDEsIFwieHBvczpcIl0sXG4gIFtcImNoYW5nZSB5IGJ5ICVuXCIsIFwiIFwiLCAxLCBcImNoYW5nZVlwb3NCeTpcIl0sXG4gIFtcInNldCB5IHRvICVuXCIsIFwiIFwiLCAxLCBcInlwb3M6XCJdLFxuICBbXCJzZXQgcm90YXRpb24gc3R5bGUgJW0ucm90YXRpb25TdHlsZVwiLCBcIiBcIiwgMSwgXCJzZXRSb3RhdGlvblN0eWxlXCJdLFxuICBbXCJzYXkgJXMgZm9yICVuIHNlY3NcIiwgXCIgXCIsIDIsIFwic2F5OmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInNheSAlc1wiLCBcIiBcIiwgMiwgXCJzYXk6XCJdLFxuICBbXCJ0aGluayAlcyBmb3IgJW4gc2Vjc1wiLCBcIiBcIiwgMiwgXCJ0aGluazpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJ0aGluayAlc1wiLCBcIiBcIiwgMiwgXCJ0aGluazpcIl0sXG4gIFtcInNob3dcIiwgXCIgXCIsIDIsIFwic2hvd1wiXSxcbiAgW1wiaGlkZVwiLCBcIiBcIiwgMiwgXCJoaWRlXCJdLFxuICBbXCJzd2l0Y2ggY29zdHVtZSB0byAlbS5jb3N0dW1lXCIsIFwiIFwiLCAyLCBcImxvb2tMaWtlOlwiXSxcbiAgW1wibmV4dCBjb3N0dW1lXCIsIFwiIFwiLCAyLCBcIm5leHRDb3N0dW1lXCJdLFxuICBbXCJuZXh0IGJhY2tkcm9wXCIsIFwiIFwiLCAxMDIsIFwibmV4dFNjZW5lXCJdLFxuICBbXCJzd2l0Y2ggYmFja2Ryb3AgdG8gJW0uYmFja2Ryb3BcIiwgXCIgXCIsIDIsIFwic3RhcnRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIGJhY2tkcm9wIHRvICVtLmJhY2tkcm9wIGFuZCB3YWl0XCIsIFwiIFwiLCAxMDIsIFwic3RhcnRTY2VuZUFuZFdhaXRcIl0sXG4gIFtcImNoYW5nZSAlbS5lZmZlY3QgZWZmZWN0IGJ5ICVuXCIsIFwiIFwiLCAyLCBcImNoYW5nZUdyYXBoaWNFZmZlY3Q6Ynk6XCJdLFxuICBbXCJzZXQgJW0uZWZmZWN0IGVmZmVjdCB0byAlblwiLCBcIiBcIiwgMiwgXCJzZXRHcmFwaGljRWZmZWN0OnRvOlwiXSxcbiAgW1wiY2xlYXIgZ3JhcGhpYyBlZmZlY3RzXCIsIFwiIFwiLCAyLCBcImZpbHRlclJlc2V0XCJdLFxuICBbXCJjaGFuZ2Ugc2l6ZSBieSAlblwiLCBcIiBcIiwgMiwgXCJjaGFuZ2VTaXplQnk6XCJdLFxuICBbXCJzZXQgc2l6ZSB0byAlbiVcIiwgXCIgXCIsIDIsIFwic2V0U2l6ZVRvOlwiXSxcbiAgW1wiZ28gdG8gZnJvbnRcIiwgXCIgXCIsIDIsIFwiY29tZVRvRnJvbnRcIl0sXG4gIFtcImdvIGJhY2sgJW4gbGF5ZXJzXCIsIFwiIFwiLCAyLCBcImdvQmFja0J5TGF5ZXJzOlwiXSxcbiAgW1wicGxheSBzb3VuZCAlbS5zb3VuZFwiLCBcIiBcIiwgMywgXCJwbGF5U291bmQ6XCJdLFxuICBbXCJwbGF5IHNvdW5kICVtLnNvdW5kIHVudGlsIGRvbmVcIiwgXCIgXCIsIDMsIFwiZG9QbGF5U291bmRBbmRXYWl0XCJdLFxuICBbXCJzdG9wIGFsbCBzb3VuZHNcIiwgXCIgXCIsIDMsIFwic3RvcEFsbFNvdW5kc1wiXSxcbiAgW1wicGxheSBkcnVtICVkLmRydW0gZm9yICVuIGJlYXRzXCIsIFwiIFwiLCAzLCBcInBsYXlEcnVtXCJdLFxuICBbXCJyZXN0IGZvciAlbiBiZWF0c1wiLCBcIiBcIiwgMywgXCJyZXN0OmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInBsYXkgbm90ZSAlZC5ub3RlIGZvciAlbiBiZWF0c1wiLCBcIiBcIiwgMywgXCJub3RlT246ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wic2V0IGluc3RydW1lbnQgdG8gJWQuaW5zdHJ1bWVudFwiLCBcIiBcIiwgMywgXCJpbnN0cnVtZW50OlwiXSxcbiAgW1wiY2hhbmdlIHZvbHVtZSBieSAlblwiLCBcIiBcIiwgMywgXCJjaGFuZ2VWb2x1bWVCeTpcIl0sXG4gIFtcInNldCB2b2x1bWUgdG8gJW4lXCIsIFwiIFwiLCAzLCBcInNldFZvbHVtZVRvOlwiXSxcbiAgW1wiY2hhbmdlIHRlbXBvIGJ5ICVuXCIsIFwiIFwiLCAzLCBcImNoYW5nZVRlbXBvQnk6XCJdLFxuICBbXCJzZXQgdGVtcG8gdG8gJW4gYnBtXCIsIFwiIFwiLCAzLCBcInNldFRlbXBvVG86XCJdLFxuICBbXCJjaGFuZ2UgJW0uYXVkaW9FZmZlY3QgZWZmZWN0IGJ5ICVuXCIsIFwiIFwiLCAzLCBcImNoYW5nZUF1ZGlvRWZmZWN0Qnk6XCJdLFxuICBbXCJzZXQgJW0uYXVkaW9FZmZlY3QgZWZmZWN0IHRvICVuXCIsIFwiIFwiLCAzLCBcInNldEF1ZGlvRWZmZWN0VG86XCJdLFxuICBbXCJlcmFzZSBhbGxcIiwgXCIgXCIsIDQsIFwiY2xlYXJQZW5UcmFpbHNcIl0sXG4gIFtcInN0YW1wXCIsIFwiIFwiLCA0LCBcInN0YW1wQ29zdHVtZVwiXSxcbiAgW1wicGVuIGRvd25cIiwgXCIgXCIsIDQsIFwicHV0UGVuRG93blwiXSxcbiAgW1wicGVuIHVwXCIsIFwiIFwiLCA0LCBcInB1dFBlblVwXCJdLFxuICBbXCJzZXQgcGVuIGNvbG9yIHRvICVjXCIsIFwiIFwiLCA0LCBcInBlbkNvbG9yOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBjb2xvciBieSAlblwiLCBcIiBcIiwgNCwgXCJjaGFuZ2VQZW5IdWVCeTpcIl0sXG4gIFtcInNldCBwZW4gY29sb3IgdG8gJW5cIiwgXCIgXCIsIDQsIFwic2V0UGVuSHVlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNoYWRlIGJ5ICVuXCIsIFwiIFwiLCA0LCBcImNoYW5nZVBlblNoYWRlQnk6XCJdLFxuICBbXCJzZXQgcGVuIHNoYWRlIHRvICVuXCIsIFwiIFwiLCA0LCBcInNldFBlblNoYWRlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNpemUgYnkgJW5cIiwgXCIgXCIsIDQsIFwiY2hhbmdlUGVuU2l6ZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaXplIHRvICVuXCIsIFwiIFwiLCA0LCBcInBlblNpemU6XCJdLFxuICBbXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLCBcImhcIiwgNSwgXCJ3aGVuR3JlZW5GbGFnXCJdLFxuICBbXCJ3aGVuICVtLmtleSBrZXkgcHJlc3NlZFwiLCBcImhcIiwgNSwgXCJ3aGVuS2V5UHJlc3NlZFwiXSxcbiAgW1wid2hlbiB0aGlzIHNwcml0ZSBjbGlja2VkXCIsIFwiaFwiLCA1LCBcIndoZW5DbGlja2VkXCJdLFxuICBbXCJ3aGVuIGJhY2tkcm9wIHN3aXRjaGVzIHRvICVtLmJhY2tkcm9wXCIsIFwiaFwiLCA1LCBcIndoZW5TY2VuZVN0YXJ0c1wiXSxcbiAgW1wid2hlbiAlbS50cmlnZ2VyU2Vuc29yID4gJW5cIiwgXCJoXCIsIDUsIFwid2hlblNlbnNvckdyZWF0ZXJUaGFuXCJdLFxuICBbXCJ3aGVuIEkgcmVjZWl2ZSAlbS5icm9hZGNhc3RcIiwgXCJoXCIsIDUsIFwid2hlbklSZWNlaXZlXCJdLFxuICBbXCJicm9hZGNhc3QgJW0uYnJvYWRjYXN0XCIsIFwiIFwiLCA1LCBcImJyb2FkY2FzdDpcIl0sXG4gIFtcImJyb2FkY2FzdCAlbS5icm9hZGNhc3QgYW5kIHdhaXRcIiwgXCIgXCIsIDUsIFwiZG9Ccm9hZGNhc3RBbmRXYWl0XCJdLFxuICBbXCJ3YWl0ICVuIHNlY29uZHNcIiwgXCIgXCIsIDYsIFwid2FpdDplbGFwc2VkOmZyb206XCJdLFxuICBbXCJyZXBlYXQgJW5cIiwgXCJjXCIsIDYsIFwiZG9SZXBlYXRcIl0sXG4gIFtcImZvcmV2ZXJcIiwgXCJjZlwiLCA2LCBcImRvRm9yZXZlclwiXSxcbiAgW1wiaWYgJWIgdGhlblwiLCBcImNcIiwgNiwgXCJkb0lmXCJdLFxuICBbXCJpZiAlYiB0aGVuXCIsIFwiZVwiLCA2LCBcImRvSWZFbHNlXCJdLFxuICBbXCJ3YWl0IHVudGlsICViXCIsIFwiIFwiLCA2LCBcImRvV2FpdFVudGlsXCJdLFxuICBbXCJyZXBlYXQgdW50aWwgJWJcIiwgXCJjXCIsIDYsIFwiZG9VbnRpbFwiXSxcbiAgW1wic3RvcCAlbS5zdG9wXCIsIFwiZlwiLCA2LCBcInN0b3BTY3JpcHRzXCJdLFxuICBbXCJ3aGVuIEkgc3RhcnQgYXMgYSBjbG9uZVwiLCBcImhcIiwgNiwgXCJ3aGVuQ2xvbmVkXCJdLFxuICBbXCJjcmVhdGUgY2xvbmUgb2YgJW0uc3ByaXRlT25seVwiLCBcIiBcIiwgNiwgXCJjcmVhdGVDbG9uZU9mXCJdLFxuICBbXCJkZWxldGUgdGhpcyBjbG9uZVwiLCBcImZcIiwgNiwgXCJkZWxldGVDbG9uZVwiXSxcbiAgW1wiYXNrICVzIGFuZCB3YWl0XCIsIFwiIFwiLCA3LCBcImRvQXNrXCJdLFxuICBbXCJ0dXJuIHZpZGVvICVtLnZpZGVvU3RhdGVcIiwgXCIgXCIsIDcsIFwic2V0VmlkZW9TdGF0ZVwiXSxcbiAgW1wic2V0IHZpZGVvIHRyYW5zcGFyZW5jeSB0byAlbiVcIiwgXCIgXCIsIDcsIFwic2V0VmlkZW9UcmFuc3BhcmVuY3lcIl0sXG4gIFtcInJlc2V0IHRpbWVyXCIsIFwiIFwiLCA3LCBcInRpbWVyUmVzZXRcIl0sXG4gIFtcInNldCAlbS52YXIgdG8gJXNcIiwgXCIgXCIsIDksIFwic2V0VmFyOnRvOlwiXSxcbiAgW1wiY2hhbmdlICVtLnZhciBieSAlblwiLCBcIiBcIiwgOSwgXCJjaGFuZ2VWYXI6Ynk6XCJdLFxuICBbXCJzaG93IHZhcmlhYmxlICVtLnZhclwiLCBcIiBcIiwgOSwgXCJzaG93VmFyaWFibGU6XCJdLFxuICBbXCJoaWRlIHZhcmlhYmxlICVtLnZhclwiLCBcIiBcIiwgOSwgXCJoaWRlVmFyaWFibGU6XCJdLFxuICBbXCJhZGQgJXMgdG8gJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiYXBwZW5kOnRvTGlzdDpcIl0sXG4gIFtcImRlbGV0ZSAlZC5saXN0RGVsZXRlSXRlbSBvZiAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJkZWxldGVMaW5lOm9mTGlzdDpcIl0sXG4gIFtcImRlbGV0ZSBhbGwgb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiZGVsZXRlQWxsOm9mTGlzdDpcIl0sXG4gIFtcImlmIG9uIGVkZ2UsIGJvdW5jZVwiLCBcIiBcIiwgMSwgXCJib3VuY2VPZmZFZGdlXCJdLFxuICBbXCJpbnNlcnQgJXMgYXQgJWQubGlzdEl0ZW0gb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiaW5zZXJ0OmF0Om9mTGlzdDpcIl0sXG4gIFtcbiAgICBcInJlcGxhY2UgaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0IHdpdGggJXNcIixcbiAgICBcIiBcIixcbiAgICAxMixcbiAgICBcInNldExpbmU6b2ZMaXN0OnRvOlwiLFxuICBdLFxuICBbXCJzaG93IGxpc3QgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwic2hvd0xpc3Q6XCJdLFxuICBbXCJoaWRlIGxpc3QgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiaGlkZUxpc3Q6XCJdLFxuXG4gIFtcInggcG9zaXRpb25cIiwgXCJyXCIsIDEsIFwieHBvc1wiXSxcbiAgW1wieSBwb3NpdGlvblwiLCBcInJcIiwgMSwgXCJ5cG9zXCJdLFxuICBbXCJkaXJlY3Rpb25cIiwgXCJyXCIsIDEsIFwiaGVhZGluZ1wiXSxcbiAgW1wiY29zdHVtZSAjXCIsIFwiclwiLCAyLCBcImNvc3R1bWVJbmRleFwiXSxcbiAgW1wic2l6ZVwiLCBcInJcIiwgMiwgXCJzY2FsZVwiXSxcbiAgW1wiYmFja2Ryb3AgbmFtZVwiLCBcInJcIiwgMTAyLCBcInNjZW5lTmFtZVwiXSxcbiAgW1wiYmFja2Ryb3AgI1wiLCBcInJcIiwgMTAyLCBcImJhY2tncm91bmRJbmRleFwiXSxcbiAgW1widm9sdW1lXCIsIFwiclwiLCAzLCBcInZvbHVtZVwiXSxcbiAgW1widGVtcG9cIiwgXCJyXCIsIDMsIFwidGVtcG9cIl0sXG4gIFtcInRvdWNoaW5nICVtLnRvdWNoaW5nP1wiLCBcImJcIiwgNywgXCJ0b3VjaGluZzpcIl0sXG4gIFtcInRvdWNoaW5nIGNvbG9yICVjP1wiLCBcImJcIiwgNywgXCJ0b3VjaGluZ0NvbG9yOlwiXSxcbiAgW1wiY29sb3IgJWMgaXMgdG91Y2hpbmcgJWM/XCIsIFwiYlwiLCA3LCBcImNvbG9yOnNlZXM6XCJdLFxuICBbXCJkaXN0YW5jZSB0byAlbS5zcHJpdGVPck1vdXNlXCIsIFwiclwiLCA3LCBcImRpc3RhbmNlVG86XCJdLFxuICBbXCJhbnN3ZXJcIiwgXCJyXCIsIDcsIFwiYW5zd2VyXCJdLFxuICBbXCJrZXkgJW0ua2V5IHByZXNzZWQ/XCIsIFwiYlwiLCA3LCBcImtleVByZXNzZWQ6XCJdLFxuICBbXCJtb3VzZSBkb3duP1wiLCBcImJcIiwgNywgXCJtb3VzZVByZXNzZWRcIl0sXG4gIFtcIm1vdXNlIHhcIiwgXCJyXCIsIDcsIFwibW91c2VYXCJdLFxuICBbXCJtb3VzZSB5XCIsIFwiclwiLCA3LCBcIm1vdXNlWVwiXSxcbiAgW1wibG91ZG5lc3NcIiwgXCJyXCIsIDcsIFwic291bmRMZXZlbFwiXSxcbiAgW1widmlkZW8gJW0udmlkZW9Nb3Rpb25UeXBlIG9uICVtLnN0YWdlT3JUaGlzXCIsIFwiclwiLCA3LCBcInNlbnNlVmlkZW9Nb3Rpb25cIl0sXG4gIFtcInRpbWVyXCIsIFwiclwiLCA3LCBcInRpbWVyXCJdLFxuICBbXCIlbS5hdHRyaWJ1dGUgb2YgJW0uc3ByaXRlT3JTdGFnZVwiLCBcInJcIiwgNywgXCJnZXRBdHRyaWJ1dGU6b2Y6XCJdLFxuICBbXCJjdXJyZW50ICVtLnRpbWVBbmREYXRlXCIsIFwiclwiLCA3LCBcInRpbWVBbmREYXRlXCJdLFxuICBbXCJkYXlzIHNpbmNlIDIwMDBcIiwgXCJyXCIsIDcsIFwidGltZXN0YW1wXCJdLFxuICBbXCJ1c2VybmFtZVwiLCBcInJcIiwgNywgXCJnZXRVc2VyTmFtZVwiXSxcbiAgW1wiJW4gKyAlblwiLCBcInJcIiwgOCwgXCIrXCJdLFxuICBbXCIlbiAtICVuXCIsIFwiclwiLCA4LCBcIi1cIl0sXG4gIFtcIiVuICogJW5cIiwgXCJyXCIsIDgsIFwiKlwiXSxcbiAgW1wiJW4gLyAlblwiLCBcInJcIiwgOCwgXCIvXCJdLFxuICBbXCJwaWNrIHJhbmRvbSAlbiB0byAlblwiLCBcInJcIiwgOCwgXCJyYW5kb21Gcm9tOnRvOlwiXSxcbiAgW1wiJXMgPCAlc1wiLCBcImJcIiwgOCwgXCI8XCJdLFxuICBbXCIlcyA9ICVzXCIsIFwiYlwiLCA4LCBcIj1cIl0sXG4gIFtcIiVzID4gJXNcIiwgXCJiXCIsIDgsIFwiPlwiXSxcbiAgW1wiJWIgYW5kICViXCIsIFwiYlwiLCA4LCBcIiZcIl0sXG4gIFtcIiViIG9yICViXCIsIFwiYlwiLCA4LCBcInxcIl0sXG4gIFtcIm5vdCAlYlwiLCBcImJcIiwgOCwgXCJub3RcIl0sXG4gIFtcImpvaW4gJXMgJXNcIiwgXCJyXCIsIDgsIFwiY29uY2F0ZW5hdGU6d2l0aDpcIl0sXG4gIFtcImxldHRlciAlbiBvZiAlc1wiLCBcInJcIiwgOCwgXCJsZXR0ZXI6b2Y6XCJdLFxuICBbXCJsZW5ndGggb2YgJXNcIiwgXCJyXCIsIDgsIFwic3RyaW5nTGVuZ3RoOlwiXSxcbiAgW1wiJW4gbW9kICVuXCIsIFwiclwiLCA4LCBcIiVcIl0sXG4gIFtcInJvdW5kICVuXCIsIFwiclwiLCA4LCBcInJvdW5kZWRcIl0sXG4gIFtcIiVtLm1hdGhPcCBvZiAlblwiLCBcInJcIiwgOCwgXCJjb21wdXRlRnVuY3Rpb246b2Y6XCJdLFxuICBbXCJpdGVtICVkLmxpc3RJdGVtIG9mICVtLmxpc3RcIiwgXCJyXCIsIDEyLCBcImdldExpbmU6b2ZMaXN0OlwiXSxcbiAgW1wibGVuZ3RoIG9mICVtLmxpc3RcIiwgXCJyXCIsIDEyLCBcImxpbmVDb3VudE9mTGlzdDpcIl0sXG4gIFtcIiVtLmxpc3QgY29udGFpbnMgJXM/XCIsIFwiYlwiLCAxMiwgXCJsaXN0OmNvbnRhaW5zOlwiXSxcblxuICBbXCJ3aGVuICVtLmJvb2xlYW5TZW5zb3JcIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiAlbS5zZW5zb3IgJW0ubGVzc01vcmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wic2Vuc29yICVtLmJvb2xlYW5TZW5zb3I/XCIsIFwiYlwiLCAyMCwgXCJcIl0sXG4gIFtcIiVtLnNlbnNvciBzZW5zb3IgdmFsdWVcIiwgXCJyXCIsIDIwLCBcIlwiXSxcblxuICBbXCJ0dXJuICVtLm1vdG9yIG9uIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInR1cm4gJW0ubW90b3Igb25cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1widHVybiAlbS5tb3RvciBvZmZcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wic2V0ICVtLm1vdG9yIHBvd2VyIHRvICVuXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInNldCAlbS5tb3RvcjIgZGlyZWN0aW9uIHRvICVtLm1vdG9yRGlyZWN0aW9uXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gZGlzdGFuY2UgJW0ubGVzc01vcmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiB0aWx0ICVtLmVOZSAlblwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJkaXN0YW5jZVwiLCBcInJcIiwgMjAsIFwiXCJdLFxuICBbXCJ0aWx0XCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1widHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjb25kc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJzZXQgbGlnaHQgY29sb3IgdG8gJW5cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wicGxheSBub3RlICVuIGZvciAlbiBzZWNvbmRzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gdGlsdGVkXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcInRpbHQgJW0ueHh4XCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1wiZWxzZVwiLCBcImVsc2VcIiwgNiwgXCJcIl0sXG4gIFtcImVuZFwiLCBcImVuZFwiLCA2LCBcIlwiXSxcbiAgW1wiLiAuIC5cIiwgXCIgXCIsIDQyLCBcIlwiXSxcblxuICBbXCIlbiBAYWRkSW5wdXRcIiwgXCJyaW5nXCIsIDQyLCBcIlwiXSxcblxuICBbXCJ1c2VyIGlkXCIsIFwiclwiLCAwLCBcIlwiXSxcblxuICBbXCJpZiAlYlwiLCBcImNcIiwgMCwgXCJkb0lmXCJdLFxuICBbXCJpZiAlYlwiLCBcImVcIiwgMCwgXCJkb0lmRWxzZVwiXSxcbiAgW1wiZm9yZXZlciBpZiAlYlwiLCBcImNmXCIsIDAsIFwiZG9Gb3JldmVySWZcIl0sXG4gIFtcInN0b3Agc2NyaXB0XCIsIFwiZlwiLCAwLCBcImRvUmV0dXJuXCJdLFxuICBbXCJzdG9wIGFsbFwiLCBcImZcIiwgMCwgXCJzdG9wQWxsXCJdLFxuICBbXCJzd2l0Y2ggdG8gY29zdHVtZSAlbS5jb3N0dW1lXCIsIFwiIFwiLCAwLCBcImxvb2tMaWtlOlwiXSxcbiAgW1wibmV4dCBiYWNrZ3JvdW5kXCIsIFwiIFwiLCAwLCBcIm5leHRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIHRvIGJhY2tncm91bmQgJW0uYmFja2Ryb3BcIiwgXCIgXCIsIDAsIFwic3RhcnRTY2VuZVwiXSxcbiAgW1wiYmFja2dyb3VuZCAjXCIsIFwiclwiLCAwLCBcImJhY2tncm91bmRJbmRleFwiXSxcbiAgW1wibG91ZD9cIiwgXCJiXCIsIDAsIFwiaXNMb3VkXCJdLFxuXVxuIiwiLyogZm9yIGNvbnN0dWN0aW5nIFNWR3MgKi9cblxuZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxufVxuZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbn1cblxuLy8gc2V0IGJ5IFNWRy5pbml0XG52YXIgZG9jdW1lbnRcbnZhciB4bWxcblxudmFyIGRpcmVjdFByb3BzID0ge1xuICB0ZXh0Q29udGVudDogdHJ1ZSxcbn1cblxudmFyIFNWRyA9IChtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdCh3aW5kb3csIG1ha2VDYW52YXMpIHtcbiAgICBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuICAgIHZhciBET01QYXJzZXIgPSB3aW5kb3cuRE9NUGFyc2VyXG4gICAgeG1sID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhcIjx4bWw+PC94bWw+XCIsIFwiYXBwbGljYXRpb24veG1sXCIpXG4gICAgU1ZHLlhNTFNlcmlhbGl6ZXIgPSB3aW5kb3cuWE1MU2VyaWFsaXplclxuXG4gICAgU1ZHLm1ha2VDYW52YXMgPSBtYWtlQ2FudmFzXG4gIH0sXG5cbiAgY2RhdGEoY29udGVudCkge1xuICAgIHJldHVybiB4bWwuY3JlYXRlQ0RBVEFTZWN0aW9uKGNvbnRlbnQpXG4gIH0sXG5cbiAgZWwobmFtZSwgcHJvcHMpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lKVxuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoZWwsIHByb3BzKVxuICB9LFxuXG4gIHNldFByb3BzKGVsLCBwcm9wcykge1xuICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgdmFyIHZhbHVlID0gXCJcIiArIHByb3BzW2tleV1cbiAgICAgIGlmIChkaXJlY3RQcm9wc1trZXldKSB7XG4gICAgICAgIGVsW2tleV0gPSB2YWx1ZVxuICAgICAgfSBlbHNlIGlmICgvXnhsaW5rOi8udGVzdChrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBrZXkuc2xpY2UoNiksIHZhbHVlKVxuICAgICAgfSBlbHNlIGlmIChwcm9wc1trZXldICE9PSBudWxsICYmIHByb3BzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMobnVsbCwga2V5LCB2YWx1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgd2l0aENoaWxkcmVuKGVsLCBjaGlsZHJlbikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkcmVuW2ldKVxuICAgIH1cbiAgICByZXR1cm4gZWxcbiAgfSxcblxuICBncm91cChjaGlsZHJlbikge1xuICAgIHJldHVybiBTVkcud2l0aENoaWxkcmVuKFNWRy5lbChcImdcIiksIGNoaWxkcmVuKVxuICB9LFxuXG4gIG5ld1NWRyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIFNWRy5lbChcInN2Z1wiLCB7XG4gICAgICB2ZXJzaW9uOiBcIjEuMVwiLFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgfSlcbiAgfSxcblxuICBwb2x5Z29uKHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicG9seWdvblwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBvaW50czogcHJvcHMucG9pbnRzLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcGF0aChwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInBhdGhcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBudWxsLFxuICAgICAgICBkOiBwcm9wcy5wYXRoLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgdGV4dCh4LCB5LCBjb250ZW50LCBwcm9wcykge1xuICAgIHZhciB0ZXh0ID0gU1ZHLmVsKFxuICAgICAgXCJ0ZXh0XCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgeDogeCxcbiAgICAgICAgeTogeSxcbiAgICAgICAgdGV4dENvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICB9KVxuICAgIClcbiAgICByZXR1cm4gdGV4dFxuICB9LFxuXG4gIHN5bWJvbChocmVmKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcInVzZVwiLCB7XG4gICAgICBcInhsaW5rOmhyZWZcIjogaHJlZixcbiAgICB9KVxuICB9LFxuXG4gIG1vdmUoZHgsIGR5LCBlbCkge1xuICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgdHJhbnNmb3JtOiBbXCJ0cmFuc2xhdGUoXCIsIGR4LCBcIiBcIiwgZHksIFwiKVwiXS5qb2luKFwiXCIpLFxuICAgIH0pXG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgdHJhbnNsYXRlUGF0aChkeCwgZHksIHBhdGgpIHtcbiAgICB2YXIgaXNYID0gdHJ1ZVxuICAgIHZhciBwYXJ0cyA9IHBhdGguc3BsaXQoXCIgXCIpXG4gICAgdmFyIG91dCA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpXVxuICAgICAgaWYgKHBhcnQgPT09IFwiQVwiKSB7XG4gICAgICAgIHZhciBqID0gaSArIDVcbiAgICAgICAgb3V0LnB1c2goXCJBXCIpXG4gICAgICAgIHdoaWxlIChpIDwgaikge1xuICAgICAgICAgIG91dC5wdXNoKHBhcnRzWysraV0pXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH0gZWxzZSBpZiAoL1tBLVphLXpdLy50ZXN0KHBhcnQpKSB7XG4gICAgICAgIGFzc2VydChpc1gpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0ID0gK3BhcnRcbiAgICAgICAgcGFydCArPSBpc1ggPyBkeCA6IGR5XG4gICAgICAgIGlzWCA9ICFpc1hcbiAgICAgIH1cbiAgICAgIG91dC5wdXNoKHBhcnQpXG4gICAgfVxuICAgIHJldHVybiBvdXQuam9pbihcIiBcIilcbiAgfSxcblxuICAvKiBzaGFwZXMgKi9cblxuICByZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicmVjdFwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHdpZHRoOiB3LFxuICAgICAgICBoZWlnaHQ6IGgsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBlbGxpcHNlKHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwiZWxsaXBzZVwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGN4OiB3IC8gMixcbiAgICAgICAgY3k6IGggLyAyLFxuICAgICAgICByeDogdyAvIDIsXG4gICAgICAgIHJ5OiBoIC8gMixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGFyYyhwMXgsIHAxeSwgcDJ4LCBwMnksIHJ4LCByeSkge1xuICAgIHZhciByID0gcDJ5IC0gcDF5XG4gICAgcmV0dXJuIFtcIkxcIiwgcDF4LCBwMXksIFwiQVwiLCByeCwgcnksIDAsIDAsIDEsIHAyeCwgcDJ5XS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIGFyY3cocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeVxuICAgIHJldHVybiBbXCJMXCIsIHAxeCwgcDF5LCBcIkFcIiwgcngsIHJ5LCAwLCAwLCAwLCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICByb3VuZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnJlY3QoXG4gICAgICB3LFxuICAgICAgaCxcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICByeDogNCxcbiAgICAgICAgcnk6IDQsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBwaWxsUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHZhciByID0gaCAvIDJcbiAgICByZXR1cm4gU1ZHLnJlY3QoXG4gICAgICB3LFxuICAgICAgaCxcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICByeDogcixcbiAgICAgICAgcnk6IHIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBwb2ludGVkUGF0aCh3LCBoKSB7XG4gICAgdmFyIHIgPSBoIC8gMlxuICAgIHJldHVybiBbXG4gICAgICBcIk1cIixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gcixcbiAgICAgIDAsXG4gICAgICB3LFxuICAgICAgcixcbiAgICAgIFwiTFwiLFxuICAgICAgdyxcbiAgICAgIHIsXG4gICAgICB3IC0gcixcbiAgICAgIGgsXG4gICAgICBcIkxcIixcbiAgICAgIHIsXG4gICAgICBoLFxuICAgICAgMCxcbiAgICAgIHIsXG4gICAgICBcIkxcIixcbiAgICAgIDAsXG4gICAgICByLFxuICAgICAgcixcbiAgICAgIDAsXG4gICAgICBcIlpcIixcbiAgICBdXG4gIH0sXG5cbiAgcG9pbnRlZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLnBvaW50ZWRQYXRoKHcsIGgpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cblxuICBnZXRUb3Aodykge1xuICAgIHJldHVybiBbXCJNXCIsIDAsIDQsXG4gICAgICAvLyBcIkxcIiwgMSwgMSxcbiAgICAgIC8vIFwiTFwiLCA0LCAwLFxuICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSgwLCA0LCA0LCAwLCAwKSxcbiAgICAgIFtcIkxcIiwgOCwgMF0uam9pbihcIiBcIiksXG4gICAgICBcImMgMiAwIDMgMSA0IDJcIixcbiAgICAgIFwibCAxLjUgMS41XCIsXG4gICAgICBcImMgMSAxIDIgMiA0IDJcIixcbiAgICAgIFwiaCA4XCIsXG4gICAgICBcImMgMiAwIDMgLTEgNCAtMlwiLFxuICAgICAgXCJsIDEuNSAtMS41XCIsXG4gICAgICBcImMgMSAtMSAyIC0yIDQgLTJcIixcbiAgICAgIFwiTFwiLCB3IC0gNCwgMCxcbiAgICAgIFwiUVwiLCBTVkcuY3VydmUodyAtIDQsIDAsIHcsIDQsIDApLFxuICAgICAgXCJMXCIsIHcsIDRcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0UmluZ1RvcCh3KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiTVwiLFxuICAgICAgMCxcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDMsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICA3LFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgMTAsXG4gICAgICAzLFxuICAgICAgXCJMXCIsXG4gICAgICAxNixcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDE5LFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgdyAtIDMsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3LFxuICAgICAgMyxcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgaGFzTm90Y2gsIGluc2V0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnNldCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zZXQgPSAwXG4gICAgfVxuICAgIC8vdmFyIGFyciA9IFtcIkxcIiwgdywgeSAtIDMsIFwiTFwiLCB3IC0gMywgeV1cbiAgICB2YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gNCwgXCJRXCIsIFNWRy5jdXJ2ZSh3LCB5IC0gNCwgdyAtIDQsIHksIDApXVxuICAgIGlmIChoYXNOb3RjaCkge1xuICAgICAgLy8gYXJyID0gYXJyLmNvbmNhdChbXG4gICAgICAvLyAgIFwiTFwiLFxuICAgICAgLy8gICBpbnNldCArIDMwLFxuICAgICAgLy8gICB5LFxuICAgICAgLy8gICBcIkxcIixcbiAgICAgIC8vICAgaW5zZXQgKyAyNCxcbiAgICAgIC8vICAgeSArIDUsXG4gICAgICAvLyAgIFwiTFwiLFxuICAgICAgLy8gICBpbnNldCArIDE0LFxuICAgICAgLy8gICB5ICsgNSxcbiAgICAgIC8vICAgXCJMXCIsXG4gICAgICAvLyAgIGluc2V0ICsgOCxcbiAgICAgIC8vICAgeSxcbiAgICAgIC8vIF0pXG4gICAgICBhcnIgPSBhcnIuY29uY2F0KFtcbiAgICAgICAgW1wiTFwiLCBpbnNldCArIDM1LCB5XS5qb2luKFwiIFwiKSxcbiAgICAgICAgXCJjIC0yIDAgLTMgMSAtNCAyXCIsXG4gICAgICAgIFwibCAtMS41IDEuNVwiLFxuICAgICAgICBcImMgLTEgMSAtMiAyIC00IDJcIixcbiAgICAgICAgXCJoIC04XCIsXG4gICAgICAgIFwiYyAtMiAwIC0zIC0xIC00IC0yXCIsXG4gICAgICAgIFwibCAtMS41IC0xLjVcIixcbiAgICAgICAgXCJjIC0xIC0xIC0yIC0yIC00IC0yXCIsXG4gICAgICBdKVxuICAgIH1cbiAgICBpZiAoaW5zZXQgPT09IDApIHtcbiAgICAgIGFyci5wdXNoKFwiTFwiLCBpbnNldCArIDQsIHkpXG4gICAgICBhcnIucHVzaChcImEgNCA0IDAgMCAxIC00IC00XCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFyci5wdXNoKFwiTFwiLCBpbnNldCArIDQsIHkpXG4gICAgICBhcnIucHVzaChcImEgNCA0IDAgMCAwIC00IDRcIilcbiAgICB9XG4gICAgcmV0dXJuIGFyci5qb2luKFwiIFwiKVxuICB9LFxuXG4gIGdldEFybSh3LCBhcm1Ub3ApIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJMXCIsIDEwLCBhcm1Ub3AgLSA0LFxuICAgICAgXCJhIC00IC00IDAgMCAwIDQgNFwiLFxuICAgICAgXCJMXCIsIHcgLSA0LCBhcm1Ub3AsXG4gICAgICBcImEgNCA0IDAgMCAxIDQgNFwiXG4gICAgXS5qb2luKFwiIFwiKVxuICB9LFxuICBcbiAgXG5cbiAgc3RhY2tSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSwgMCksIFwiWlwiXSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbU1ZHLmdldFRvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIGZhbHNlLCAwKSwgXCJaXCJdXG4gIH0sXG5cbiAgcmluZ0NhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbU1ZHLmdldFJpbmdUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCBmYWxzZSwgMCksIFwiWlwiXVxuICB9LFxuXG4gIGNhcFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLmNhcFBhdGgodywgaCksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBoYXRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk0gMCAxMlwiLFxuICAgICAgICBcImMgMTQsLTE1IDUyLC0xNSA2NiwwXCIsXG4gICAgICAgIFtcIkxcIiwgdyAtIDQsIDEyXS5qb2luKFwiIFwiKSxcbiAgICAgICAgXCJhIDQgNCAwIDAgMSA0IDRcIixcbiAgICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUpLFxuICAgICAgICBcIlpcIixcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIGN1cnZlKHAxeCwgcDF5LCBwMngsIHAyeSwgcm91bmRuZXNzKSB7XG4gICAgdmFyIHJvdW5kbmVzcyA9IHJvdW5kbmVzcyB8fCAwLjQyXG4gICAgdmFyIG1pZFggPSAocDF4ICsgcDJ4KSAvIDIuMFxuICAgIHZhciBtaWRZID0gKHAxeSArIHAyeSkgLyAyLjBcbiAgICB2YXIgY3ggPSBNYXRoLnJvdW5kKG1pZFggKyByb3VuZG5lc3MgKiAocDJ5IC0gcDF5KSlcbiAgICB2YXIgY3kgPSBNYXRoLnJvdW5kKG1pZFkgLSByb3VuZG5lc3MgKiAocDJ4IC0gcDF4KSlcbiAgICByZXR1cm4gW2N4LCBjeSwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgcHJvY0hhdEJhc2UodywgaCwgYXJjaFJvdW5kbmVzcywgcHJvcHMpIHtcbiAgICAvLyBUT0RPIHVzZSBhcmMoKVxuICAgIC8vIHZhciBhcmNoUm91bmRuZXNzID0gTWF0aC5taW4oMC4yLCAzNSAvIHcpOyAvL3VzZWQgaW4gc2NyYXRjaGJsb2NrczJcbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLCAwLCBoLTMsXG4gICAgICAgIFwiTFwiLCAwLCAxMCxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSgwLCAxMCwgMTUsIC01LCAwKSxcbiAgICAgICAgXCJMXCIsIHctMTUsIC01LFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKHctMTUsIC01LCB3LCAxMCwgMCksXG4gICAgICAgIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCB0cnVlKSxcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIHByb2NIYXRDYXAodywgaCwgYXJjaFJvdW5kbmVzcykge1xuICAgIC8vIFRPRE8gdXNlIGFyYygpXG4gICAgLy8gVE9ETyB0aGlzIGRvZXNuJ3QgbG9vayBxdWl0ZSByaWdodFxuICAgIHJldHVybiBTVkcucGF0aCh7XG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLFxuICAgICAgICAtMSxcbiAgICAgICAgMTMsXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUoLTEsIDEzLCB3ICsgMSwgMTMsIGFyY2hSb3VuZG5lc3MpLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKHcgKyAxLCAxMywgdywgMTYsIDAuNiksXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUodywgMTYsIDAsIDE2LCAtYXJjaFJvdW5kbmVzcyksXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUoMCwgMTYsIC0xLCAxMywgMC42KSxcbiAgICAgICAgXCJaXCIsXG4gICAgICBdLFxuICAgICAgY2xhc3M6IFwic2ItZGVmaW5lLWhhdC1jYXBcIixcbiAgICB9KVxuICB9LFxuXG4gIHByb2NIYXRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHEgPSA1MlxuICAgIHZhciB5ID0gaCAtIHFcblxuICAgIHZhciBhcmNoUm91bmRuZXNzID0gTWF0aC5taW4oMC4yLCAzNSAvIHcpXG5cbiAgICByZXR1cm4gU1ZHLm1vdmUoXG4gICAgICAwLFxuICAgICAgeSxcbiAgICAgIFNWRy5ncm91cChbXG4gICAgICAgIFNWRy5wcm9jSGF0QmFzZSh3LCBxLCBhcmNoUm91bmRuZXNzLCBwcm9wcyksXG4gICAgICAgIC8vU1ZHLnByb2NIYXRDYXAodywgcSwgYXJjaFJvdW5kbmVzcyksXG4gICAgICBdKVxuICAgIClcbiAgfSxcblxuICBtb3V0aFJlY3QodywgaCwgaXNGaW5hbCwgbGluZXMsIHByb3BzKSB7XG4gICAgdmFyIHkgPSBsaW5lc1swXS5oZWlnaHRcbiAgICB2YXIgcCA9IFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgdHJ1ZSwgMTApXVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbGluZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHZhciBpc0xhc3QgPSBpICsgMiA9PT0gbGluZXMubGVuZ3RoXG5cbiAgICAgIHkgKz0gbGluZXNbaV0uaGVpZ2h0IC0gM1xuICAgICAgcC5wdXNoKFNWRy5nZXRBcm0odywgeSkpXG5cbiAgICAgIHZhciBoYXNOb3RjaCA9ICEoaXNMYXN0ICYmIGlzRmluYWwpXG4gICAgICB2YXIgaW5zZXQgPSBpc0xhc3QgPyAwIDogMTBcbiAgICAgIHkgKz0gbGluZXNbaSArIDFdLmhlaWdodCArIDNcbiAgICAgIHAucHVzaChTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgaGFzTm90Y2gsIGluc2V0KSlcbiAgICB9XG4gICAgcC5wdXNoKFwiWlwiKVxuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBwLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcmluZ1JlY3QodywgaCwgY3ksIGN3LCBjaCwgc2hhcGUsIHByb3BzKSB7XG4gICAgdmFyIHIgPSA4XG4gICAgdmFyIGZ1bmMgPVxuICAgICAgc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgICAgICA/IFNWRy5yb3VuZFJlY3RcbiAgICAgICAgOiBzaGFwZSA9PT0gXCJib29sZWFuXCJcbiAgICAgICAgICA/IFNWRy5wb2ludGVkUGF0aFxuICAgICAgICAgIDogY3cgPCA0MCA/IFNWRy5yaW5nQ2FwUGF0aCA6IFNWRy5jYXBQYXRoXG4gICAgcmV0dXJuIFNWRy5yZWN0KFxuICAgICAgdyxcbiAgICAgIGgsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcng6IDQsXG4gICAgICAgIHJ5OiA0LFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgY29tbWVudFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICB2YXIgciA9IDZcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudFwiLFxuICAgICAgICBwYXRoOiBbXG4gICAgICAgICAgXCJNXCIsXG4gICAgICAgICAgcixcbiAgICAgICAgICAwLFxuICAgICAgICAgIFNWRy5hcmModyAtIHIsIDAsIHcsIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmModywgaCAtIHIsIHcgLSByLCBoLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjKHIsIGgsIDAsIGggLSByLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjKDAsIHIsIHIsIDAsIHIsIHIpLFxuICAgICAgICAgIFwiWlwiLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgY29tbWVudExpbmUod2lkdGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5tb3ZlKFxuICAgICAgLXdpZHRoLFxuICAgICAgOSxcbiAgICAgIFNWRy5yZWN0KFxuICAgICAgICB3aWR0aCxcbiAgICAgICAgMixcbiAgICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudC1saW5lXCIsXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgKVxuICB9LFxuXG4gIHN0cmlrZXRocm91Z2hMaW5lKHcsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFtcIk1cIiwgMCwgMCwgXCJMXCIsIHcsIDBdLFxuICAgICAgICBjbGFzczogXCJzYi1kaWZmIHNiLWRpZmYtZGVsXCIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICB2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxuXG4gIHZhciBGaWx0ZXIgPSBmdW5jdGlvbihpZCwgcHJvcHMpIHtcbiAgICB0aGlzLmVsID0gU1ZHLmVsKFxuICAgICAgXCJmaWx0ZXJcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBpZDogaWQsXG4gICAgICAgIHgwOiBcIi01MCVcIixcbiAgICAgICAgeTA6IFwiLTUwJVwiLFxuICAgICAgICB3aWR0aDogXCIyMDAlXCIsXG4gICAgICAgIGhlaWdodDogXCIyMDAlXCIsXG4gICAgICB9KVxuICAgIClcbiAgICB0aGlzLmhpZ2hlc3RJZCA9IDBcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmZlID0gZnVuY3Rpb24obmFtZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgdmFyIHNob3J0TmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9nYXVzc2lhbnxvc2l0ZS8sIFwiXCIpXG4gICAgdmFyIGlkID0gW3Nob3J0TmFtZSwgXCItXCIsICsrdGhpcy5oaWdoZXN0SWRdLmpvaW4oXCJcIilcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKFxuICAgICAgU1ZHLndpdGhDaGlsZHJlbihcbiAgICAgICAgU1ZHLmVsKFxuICAgICAgICAgIFwiZmVcIiArIG5hbWUsXG4gICAgICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgICAgICByZXN1bHQ6IGlkLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICAgIGNoaWxkcmVuIHx8IFtdXG4gICAgICApXG4gICAgKVxuICAgIHJldHVybiBpZFxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuY29tcCA9IGZ1bmN0aW9uKG9wLCBpbjEsIGluMiwgcHJvcHMpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcbiAgICAgIFwiQ29tcG9zaXRlXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgb3BlcmF0b3I6IG9wLFxuICAgICAgICBpbjogaW4xLFxuICAgICAgICBpbjI6IGluMixcbiAgICAgIH0pXG4gICAgKVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbihpbjEsIGluMikge1xuICAgIHJldHVybiB0aGlzLmNvbXAoXCJhcml0aG1ldGljXCIsIGluMSwgaW4yLCB7IGsyOiArMSwgazM6IC0xIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbihkeCwgZHksIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKFwiT2Zmc2V0XCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICBkeDogZHgsXG4gICAgICBkeTogZHksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmZsb29kID0gZnVuY3Rpb24oY29sb3IsIG9wYWNpdHksIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKFwiRmxvb2RcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIFwiZmxvb2QtY29sb3JcIjogY29sb3IsXG4gICAgICBcImZsb29kLW9wYWNpdHlcIjogb3BhY2l0eSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuYmx1ciA9IGZ1bmN0aW9uKGRldiwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJHYXVzc2lhbkJsdXJcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIHN0ZERldmlhdGlvbjogW2RldiwgZGV2XS5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuY29sb3JNYXRyaXggPSBmdW5jdGlvbihpbjEsIHZhbHVlcykge1xuICAgIHJldHVybiB0aGlzLmZlKFwiQ29sb3JNYXRyaXhcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIHR5cGU6IFwibWF0cml4XCIsXG4gICAgICB2YWx1ZXM6IHZhbHVlcy5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbihjaGlsZHJlbikge1xuICAgIHRoaXMuZmUoXG4gICAgICBcIk1lcmdlXCIsXG4gICAgICB7fSxcbiAgICAgIGNoaWxkcmVuLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBTVkcuZWwoXCJmZU1lcmdlTm9kZVwiLCB7XG4gICAgICAgICAgaW46IG5hbWUsXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIClcbiAgfVxuXG4gIHJldHVybiBGaWx0ZXJcbn0pKClcbiIsIi8qXG4gKiBzY3JhdGNoYmxvY2tzXG4gKiBodHRwOi8vc2NyYXRjaGJsb2Nrcy5naXRodWIuaW8vXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNiwgVGltIFJhZHZhblxuICogQGxpY2Vuc2UgTUlUXG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKi9cbjsoZnVuY3Rpb24obW9kKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb2RcbiAgfSBlbHNlIHtcbiAgICB2YXIgbWFrZUNhbnZhcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbiAgICB9XG4gICAgdmFyIHNjcmF0Y2hibG9ja3MgPSAod2luZG93LnNjcmF0Y2hibG9ja3MgPSBtb2Qod2luZG93LCBtYWtlQ2FudmFzKSlcblxuICAgIC8vIGFkZCBvdXIgQ1NTIHRvIHRoZSBwYWdlXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JhdGNoYmxvY2tzLm1ha2VTdHlsZSgpKVxuICB9XG59KShmdW5jdGlvbih3aW5kb3csIG1ha2VDYW52YXMpIHtcbiAgXCJ1c2Ugc3RyaWN0XCJcblxuICB2YXIgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnRcblxuICAvKiB1dGlscyAqL1xuXG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciB7IGFsbExhbmd1YWdlcywgbG9hZExhbmd1YWdlcyB9ID0gcmVxdWlyZShcIi4vYmxvY2tzLmpzXCIpXG5cbiAgdmFyIHBhcnNlID0gcmVxdWlyZShcIi4vc3ludGF4LmpzXCIpLnBhcnNlXG5cbiAgdmFyIHN0eWxlID0gcmVxdWlyZShcIi4vc3R5bGUuanNcIilcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9ID0gcmVxdWlyZShcIi4vbW9kZWwuanNcIilcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoXCIuL2RyYXcuanNcIilcbiAgU1ZHLmluaXQod2luZG93LCBtYWtlQ2FudmFzKVxuXG4gIExhYmVsLm1lYXN1cmluZyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gU1ZHLm1ha2VDYW52YXMoKVxuICAgIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG4gIH0pKClcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgZnVuY3Rpb24gcmVuZGVyKGRvYywgY2IpIHtcbiAgICByZXR1cm4gZG9jLnJlbmRlcihjYilcbiAgfVxuXG4gIC8qKiogUmVuZGVyICoqKi9cblxuICAvLyByZWFkIGNvZGUgZnJvbSBhIERPTSBlbGVtZW50XG4gIGZ1bmN0aW9uIHJlYWRDb2RlKGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoXG4gICAgICB7XG4gICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIHZhciBodG1sID0gZWwuaW5uZXJIVE1MLnJlcGxhY2UoLzxicj5cXHM/fFxcbnxcXHJcXG58XFxyL2dpLCBcIlxcblwiKVxuICAgIHZhciBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpXG4gICAgcHJlLmlubmVySFRNTCA9IGh0bWxcbiAgICB2YXIgY29kZSA9IHByZS50ZXh0Q29udGVudFxuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcIlxcblwiLCBcIlwiKVxuICAgIH1cbiAgICByZXR1cm4gY29kZVxuICB9XG5cbiAgLy8gaW5zZXJ0ICdzdmcnIGludG8gJ2VsJywgd2l0aCBhcHByb3ByaWF0ZSB3cmFwcGVyIGVsZW1lbnRzXG4gIGZ1bmN0aW9uIHJlcGxhY2UoZWwsIHN2Zywgc2NyaXB0cywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpXG4gICAgICB2YXIgY2xzID0gXCJzY3JhdGNoYmxvY2tzIHNjcmF0Y2hibG9ja3MtaW5saW5lXCJcbiAgICAgIGlmIChzY3JpcHRzWzBdICYmICFzY3JpcHRzWzBdLmlzRW1wdHkpIHtcbiAgICAgICAgY2xzICs9IFwiIHNjcmF0Y2hibG9ja3MtaW5saW5lLVwiICsgc2NyaXB0c1swXS5ibG9ja3NbMF0uc2hhcGVcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSBjbHNcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIlxuICAgICAgY29udGFpbmVyLnN0eWxlLnZlcnRpY2FsQWxpZ24gPSBcIm1pZGRsZVwiXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJzY3JhdGNoYmxvY2tzXCJcbiAgICB9XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHN2ZylcblxuICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICBlbC5hcHBlbmRDaGlsZChjb250YWluZXIpXG4gIH1cblxuICAvKiBSZW5kZXIgYWxsIG1hdGNoaW5nIGVsZW1lbnRzIGluIHBhZ2UgdG8gc2hpbnkgc2NyYXRjaCBibG9ja3MuXG4gICAqIEFjY2VwdHMgYSBDU1Mgc2VsZWN0b3IgYXMgYW4gYXJndW1lbnQuXG4gICAqXG4gICAqICBzY3JhdGNoYmxvY2tzLnJlbmRlck1hdGNoaW5nKFwicHJlLmJsb2Nrc1wiKTtcbiAgICpcbiAgICogTGlrZSB0aGUgb2xkICdzY3JhdGNoYmxvY2tzMi5wYXJzZSgpLlxuICAgKi9cbiAgdmFyIHJlbmRlck1hdGNoaW5nID0gZnVuY3Rpb24oc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBcInByZS5ibG9ja3NcIlxuICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICBsYW5ndWFnZXM6IFtcImVuXCJdLFxuXG4gICAgICAgIHJlYWQ6IHJlYWRDb2RlLCAvLyBmdW5jdGlvbihlbCwgb3B0aW9ucykgPT4gY29kZVxuICAgICAgICBwYXJzZTogcGFyc2UsIC8vIGZ1bmN0aW9uKGNvZGUsIG9wdGlvbnMpID0+IGRvY1xuICAgICAgICByZW5kZXI6IHJlbmRlciwgLy8gZnVuY3Rpb24oZG9jLCBjYikgPT4gc3ZnXG4gICAgICAgIHJlcGxhY2U6IHJlcGxhY2UsIC8vIGZ1bmN0aW9uKGVsLCBzdmcsIGRvYywgb3B0aW9ucylcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgLy8gZmluZCBlbGVtZW50c1xuICAgIHZhciByZXN1bHRzID0gW10uc2xpY2UuYXBwbHkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpXG4gICAgcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICB2YXIgY29kZSA9IG9wdGlvbnMucmVhZChlbCwgb3B0aW9ucylcblxuICAgICAgdmFyIGRvYyA9IG9wdGlvbnMucGFyc2UoY29kZSwgb3B0aW9ucylcblxuICAgICAgb3B0aW9ucy5yZW5kZXIoZG9jLCBmdW5jdGlvbihzdmcpIHtcbiAgICAgICAgb3B0aW9ucy5yZXBsYWNlKGVsLCBzdmcsIGRvYywgb3B0aW9ucylcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qIFBhcnNlIHNjcmF0Y2hibG9ja3MgY29kZSBhbmQgcmV0dXJuIFhNTCBzdHJpbmcuXG4gICAqXG4gICAqIENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBOb2RlLCByZWFsbHkuXG4gICAqL1xuICB2YXIgcmVuZGVyU1ZHU3RyaW5nID0gZnVuY3Rpb24oY29kZSwgb3B0aW9ucykge1xuICAgIHZhciBkb2MgPSBwYXJzZShjb2RlLCBvcHRpb25zKVxuXG4gICAgLy8gV0FSTjogRG9jdW1lbnQucmVuZGVyKCkgbWF5IGJlY29tZSBhc3luYyBhZ2FpbiBpbiBmdXR1cmUgOi0oXG4gICAgZG9jLnJlbmRlcihmdW5jdGlvbigpIHt9KVxuXG4gICAgcmV0dXJuIGRvYy5leHBvcnRTVkdTdHJpbmcoKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhbGxMYW5ndWFnZXM6IGFsbExhbmd1YWdlcywgLy8gcmVhZC1vbmx5XG4gICAgbG9hZExhbmd1YWdlczogbG9hZExhbmd1YWdlcyxcblxuICAgIGZyb21KU09OOiBEb2N1bWVudC5mcm9tSlNPTixcbiAgICB0b0pTT046IGZ1bmN0aW9uKGRvYykge1xuICAgICAgcmV0dXJuIGRvYy50b0pTT04oKVxuICAgIH0sXG4gICAgc3RyaW5naWZ5OiBmdW5jdGlvbihkb2MpIHtcbiAgICAgIHJldHVybiBkb2Muc3RyaW5naWZ5KClcbiAgICB9LFxuXG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcblxuICAgIHJlYWQ6IHJlYWRDb2RlLFxuICAgIHBhcnNlOiBwYXJzZSxcbiAgICAvLyByZW5kZXI6IHJlbmRlciwgLy8gUkVNT1ZFRCBzaW5jZSBkb2MucmVuZGVyKGNiKSBtYWtlcyBtdWNoIG1vcmUgc2Vuc2VcbiAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgIHJlbmRlck1hdGNoaW5nOiByZW5kZXJNYXRjaGluZyxcblxuICAgIHJlbmRlclNWR1N0cmluZzogcmVuZGVyU1ZHU3RyaW5nLFxuICAgIG1ha2VTdHlsZTogc3R5bGUubWFrZVN0eWxlLFxuICB9XG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbiAgfVxuICBmdW5jdGlvbiBpc0FycmF5KG8pIHtcbiAgICByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheVxuICB9XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgZnVuY3Rpb24gaW5kZW50KHRleHQpIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFwiICBcIiArIGxpbmVcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblwiKVxuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVOdW1iZXIodikge1xuICAgIHYgPSBcIlwiICsgdlxuICAgIHZhciBuID0gcGFyc2VJbnQodilcbiAgICBpZiAoIWlzTmFOKG4pKSB7XG4gICAgICByZXR1cm4gblxuICAgIH1cbiAgICB2YXIgZiA9IHBhcnNlRmxvYXQodilcbiAgICBpZiAoIWlzTmFOKGYpKSB7XG4gICAgICByZXR1cm4gZlxuICAgIH1cbiAgICByZXR1cm4gdlxuICB9XG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoXCIuL2RyYXcuanNcIilcblxuICB2YXIge1xuICAgIGRlZmF1bHRGb250RmFtaWx5LFxuICAgIG1ha2VTdHlsZSxcbiAgICBtYWtlSWNvbnMsXG4gICAgZGFya1JlY3QsXG4gICAgYmV2ZWxGaWx0ZXIsXG4gICAgZGFya0ZpbHRlcixcbiAgICBkZXNhdHVyYXRlRmlsdGVyLFxuICB9ID0gcmVxdWlyZShcIi4vc3R5bGUuanNcIilcblxuICB2YXIge1xuICAgIGJsb2Nrc0J5U2VsZWN0b3IsXG4gICAgcGFyc2VTcGVjLFxuICAgIGlucHV0UGF0LFxuICAgIGljb25QYXQsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIHVuaWNvZGVJY29ucyxcbiAgICBlbmdsaXNoLFxuICAgIGJsb2NrTmFtZSxcbiAgfSA9IHJlcXVpcmUoXCIuL2Jsb2Nrcy5qc1wiKVxuXG4gIC8qIExhYmVsICovXG5cbiAgdmFyIExhYmVsID0gZnVuY3Rpb24odmFsdWUsIGNscykge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuY2xzID0gY2xzIHx8IFwiXCJcbiAgICB0aGlzLmVsID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gMTFcbiAgICB0aGlzLm1ldHJpY3MgPSBudWxsXG4gICAgdGhpcy54ID0gMFxuICB9XG4gIExhYmVsLnByb3RvdHlwZS5pc0xhYmVsID0gdHJ1ZVxuXG4gIExhYmVsLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gXCI8XCIgfHwgdGhpcy52YWx1ZSA9PT0gXCI+XCIpIHJldHVybiB0aGlzLnZhbHVlXG4gICAgcmV0dXJuIHRoaXMudmFsdWUucmVwbGFjZSgvKFs8PltcXF0oKXt9XSkvZywgXCJcXFxcJDFcIilcbiAgfVxuXG4gIExhYmVsLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxcbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMYWJlbC5wcm90b3R5cGUsIFwid2lkdGhcIiwge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXRyaWNzLndpZHRoXG4gICAgfSxcbiAgfSlcblxuICBMYWJlbC5tZXRyaWNzQ2FjaGUgPSB7fVxuICBMYWJlbC50b01lYXN1cmUgPSBbXVxuXG4gIExhYmVsLnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZVxuICAgIHZhciBjbHMgPSB0aGlzLmNsc1xuICAgIHRoaXMuZWwgPSBTVkcudGV4dCgwLCAxMCwgdmFsdWUsIHtcbiAgICAgIGNsYXNzOiBcInNiLWxhYmVsIFwiICsgY2xzLFxuICAgIH0pXG5cbiAgICB2YXIgY2FjaGUgPSBMYWJlbC5tZXRyaWNzQ2FjaGVbY2xzXVxuICAgIGlmICghY2FjaGUpIHtcbiAgICAgIGNhY2hlID0gTGFiZWwubWV0cmljc0NhY2hlW2Nsc10gPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNhY2hlLCB2YWx1ZSkpIHtcbiAgICAgIHRoaXMubWV0cmljcyA9IGNhY2hlW3ZhbHVlXVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZm9udCA9IC9zYi1jb21tZW50LWxhYmVsLy50ZXN0KHRoaXMuY2xzKVxuICAgICAgICA/IFwibm9ybWFsIDExcHggJ0hlbHZldGljYSBOZXVlJywgSGVsdmV0aWNhLCBzYW5zLXNlcmlmXCJcbiAgICAgICAgOiAvc2ItbGl0ZXJhbC8udGVzdCh0aGlzLmNscylcbiAgICAgICAgICA/IFwibm9ybWFsIDExcHggXCIgKyBkZWZhdWx0Rm9udEZhbWlseVxuICAgICAgICAgIDogXCJib2xkIDExcHggXCIgKyBkZWZhdWx0Rm9udEZhbWlseVxuICAgICAgdGhpcy5tZXRyaWNzID0gY2FjaGVbdmFsdWVdID0gTGFiZWwubWVhc3VyZSh2YWx1ZSwgZm9udClcbiAgICAgIC8vIFRPRE86IHdvcmQtc3BhY2luZz8gKGZvcnR1bmF0ZWx5IGl0IHNlZW1zIHRvIGhhdmUgbm8gZWZmZWN0ISlcbiAgICB9XG4gIH1cbiAgLy9UZXh0IGJveCBzY2FsaW5nXG4gIExhYmVsLm1lYXN1cmUgPSBmdW5jdGlvbih2YWx1ZSwgZm9udCkge1xuICAgIHZhciBjb250ZXh0ID0gTGFiZWwubWVhc3VyaW5nXG4gICAgY29udGV4dC5mb250ID0gZm9udFxuICAgIHZhciB0ZXh0TWV0cmljcyA9IGNvbnRleHQubWVhc3VyZVRleHQodmFsdWUpXG4gICAgdmFyIHdpZHRoID0gKHRleHRNZXRyaWNzLndpZHRoKSB8IC0wLjc1XG4gICAgcmV0dXJuIHsgd2lkdGg6IHdpZHRoIH1cbiAgfVxuXG4gIC8qIEljb24gKi9cblxuICB2YXIgSWNvbiA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy5pc0Fycm93ID0gbmFtZSA9PT0gXCJsb29wQXJyb3dcIlxuXG4gICAgdmFyIGluZm8gPSBJY29uLmljb25zW25hbWVdXG4gICAgYXNzZXJ0KGluZm8sIFwibm8gaW5mbyBmb3IgaWNvbiBcIiArIG5hbWUpXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBpbmZvKVxuICB9XG4gIFxuICBJY29uLnByb3RvdHlwZS5pc0ljb24gPSB0cnVlXG5cbiAgSWNvbi5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHVuaWNvZGVJY29uc1tcIkBcIiArIHRoaXMubmFtZV0gfHwgXCJcIlxuICB9XG5cbiAgSWNvbi5pY29ucyA9IHtcbiAgICBncmVlbkZsYWc6IHsgd2lkdGg6IDEyLCBoZWlnaHQ6IDUsIGR5OiAtOCB9LFxuICAgIHR1cm5MZWZ0OiB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMiwgZHk6ICsxIH0sXG4gICAgdHVyblJpZ2h0OiB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMiwgZHk6ICsxIH0sXG4gICAgbG9vcEFycm93OiB7IHdpZHRoOiAxNCwgaGVpZ2h0OiAxMSB9LFxuICAgIGFkZElucHV0OiB7IHdpZHRoOiA0LCBoZWlnaHQ6IDggfSxcbiAgICBkZWxJbnB1dDogeyB3aWR0aDogNCwgaGVpZ2h0OiA4IH0sXG4gICAgbXVzaWM6IHsgd2lkdGg6IDI2LCBoZWlnaHQ6IDI2IH0sXG4gICAgcGVuOiB7IHdpZHRoOiAyNiwgaGVpZ2h0OiAyNiwgZHk6IDIgfSxcbiAgICB2aWRlbzogeyB3aWR0aDogMjYsIGhlaWdodDogMjYsIGR5OiA2LjUgfSxcbiAgICBsaW5lOiB7IHdpZHRoOiAwLCBoZWlnaHQ6IDI2IH0sXG4gICAgbm9ybWFsOiB7IHdpZHRoOiAtNCwgaGVpZ2h0OiAyMCB9LFxuICB9XG4gIFxuICBJY29uLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMubmFtZSA9PSBcIm5vcm1hbFwiKSB7XG4gICAgICByZXR1cm4gU1ZHLmVsKFwibGluZVwiLCB7XG4gICAgICAgIHgxOiAwLFxuICAgICAgICB5MTogMCxcbiAgICAgICAgeDI6IDAsXG4gICAgICAgIHkyOiAyMCxcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh0aGlzLm5hbWUgPT0gXCJsaW5lXCIpe1xuICAgICAgcmV0dXJuIFNWRy5lbChcImxpbmVcIiwge1xuICAgICAgICBjbGFzczogXCJzYi1vdXRsaW5lXCIsXG4gICAgICAgIFwic3Ryb2tlLWxpbmVjYXBcIjogXCJyb3VuZFwiLFxuICAgICAgICB4MTogMCxcbiAgICAgICAgeTE6IDAsXG4gICAgICAgIHgyOiAwLFxuICAgICAgICB5MjogMjYsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gU1ZHLnN5bWJvbChcIiNcIiArIHRoaXMubmFtZSwge1xuICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIFxuXG4gIC8qIElucHV0ICovXG5cbiAgdmFyIElucHV0ID0gZnVuY3Rpb24oc2hhcGUsIHZhbHVlLCBtZW51KSB7XG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5tZW51ID0gbWVudSB8fCBudWxsXG5cbiAgICB0aGlzLmlzUm91bmQgPSBzaGFwZSA9PT0gXCJudW1iZXJcIiB8fCBzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIiB8fCBzaGFwZSA9PT0gXCJyb3VuZC1kcm9wZG93blwiIHx8IHNoYXBlID09PSBcInN0cmluZ1wiXG4gICAgdGhpcy5pc0Jvb2xlYW4gPSBzaGFwZSA9PT0gXCJib29sZWFuXCJcbiAgICB0aGlzLmlzU3RhY2sgPSBzaGFwZSA9PT0gXCJzdGFja1wiXG4gICAgdGhpcy5pc0luc2V0ID1cbiAgICAgIHNoYXBlID09PSBcImJvb2xlYW5cIiB8fCBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICB0aGlzLmlzQ29sb3IgPSBzaGFwZSA9PT0gXCJjb2xvclwiXG4gICAgdGhpcy5oYXNBcnJvdyA9IHNoYXBlID09PSBcImRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwicm91bmQtZHJvcGRvd25cIlxuICAgIHRoaXMuaXNEYXJrZXIgPVxuICAgICAgc2hhcGUgPT09IFwiYm9vbGVhblwiIHx8IHNoYXBlID09PSBcInN0YWNrXCIgfHwgc2hhcGUgPT09IFwiZHJvcGRvd25cIiB8fCBzaGFwZSA9PT0gXCJyb3VuZC1kcm9wZG93blwiXG4gICAgdGhpcy5pc1NxdWFyZSA9XG4gICAgICBzaGFwZSA9PT0gXCJkcm9wZG93blwiXG5cbiAgICB0aGlzLmhhc0xhYmVsID0gISh0aGlzLmlzQ29sb3IgfHwgdGhpcy5pc0luc2V0KVxuICAgIHRoaXMubGFiZWwgPSB0aGlzLmhhc0xhYmVsXG4gICAgICA/IG5ldyBMYWJlbCh2YWx1ZSwgW1wic2ItbGl0ZXJhbC1cIiArIHRoaXMuc2hhcGVdKVxuICAgICAgOiBudWxsXG4gICAgdGhpcy54ID0gMFxuICB9XG4gIElucHV0LnByb3RvdHlwZS5pc0lucHV0ID0gdHJ1ZVxuXG4gIElucHV0LmZyb21KU09OID0gZnVuY3Rpb24obGFuZywgdmFsdWUsIHBhcnQpIHtcbiAgICB2YXIgc2hhcGUgPSB7XG4gICAgICBiOiBcImJvb2xlYW5cIixcbiAgICAgIG46IFwibnVtYmVyXCIsXG4gICAgICBzOiBcInN0cmluZ1wiLFxuICAgICAgZDogXCJudW1iZXItZHJvcGRvd25cIixcbiAgICAgIG06IFwiZHJvcGRvd25cIixcbiAgICAgIGM6IFwiY29sb3JcIixcbiAgICAgIHI6IFwicm91bmQtZHJvcGRvd25cIixcbiAgICB9W3BhcnRbMV1dXG5cbiAgICBpZiAoc2hhcGUgPT09IFwiY29sb3JcIikge1xuICAgICAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMClcbiAgICAgICAgdmFsdWUgPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMjU2ICogMjU2ICogMjU2KVxuICAgICAgdmFsdWUgPSArdmFsdWVcbiAgICAgIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICAgICAgdmFyIGhleCA9IHZhbHVlLnRvU3RyaW5nKDE2KVxuICAgICAgaGV4ID0gaGV4LnNsaWNlKE1hdGgubWF4KDAsIGhleC5sZW5ndGggLSA2KSkgLy8gbGFzdCA2IGNoYXJhY3RlcnNcbiAgICAgIHdoaWxlIChoZXgubGVuZ3RoIDwgNikgaGV4ID0gXCIwXCIgKyBoZXhcbiAgICAgIGlmIChoZXhbMF0gPT09IGhleFsxXSAmJiBoZXhbMl0gPT09IGhleFszXSAmJiBoZXhbNF0gPT09IGhleFs1XSkge1xuICAgICAgICBoZXggPSBoZXhbMF0gKyBoZXhbMl0gKyBoZXhbNF1cbiAgICAgIH1cbiAgICAgIHZhbHVlID0gXCIjXCIgKyBoZXhcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSBcImRyb3Bkb3duXCIpIHtcbiAgICAgIHZhbHVlID1cbiAgICAgICAge1xuICAgICAgICAgIF9tb3VzZV86IFwibW91c2UtcG9pbnRlclwiLFxuICAgICAgICAgIF9teXNlbGZfOiBcIm15c2VsZlwiLFxuICAgICAgICAgIF9zdGFnZV86IFwiU3RhZ2VcIixcbiAgICAgICAgICBfZWRnZV86IFwiZWRnZVwiLFxuICAgICAgICAgIF9yYW5kb21fOiBcInJhbmRvbSBwb3NpdGlvblwiLFxuICAgICAgICB9W3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgdmFyIG1lbnUgPSB2YWx1ZVxuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiKSB7XG4gICAgICB2YWx1ZSA9IGxhbmcuZHJvcGRvd25zW3ZhbHVlXSB8fCB2YWx1ZVxuICAgIH0gZWxzZSBpZiAoc2hhcGUgPT09IFwicm91bmQtZHJvcGRvd25cIikge1xuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IElucHV0KHNoYXBlLCBcIlwiICsgdmFsdWUsIG1lbnUpXG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgYXNzZXJ0KHRoaXMudmFsdWVbMF0gPT09IFwiI1wiKVxuICAgICAgdmFyIGggPSB0aGlzLnZhbHVlLnNsaWNlKDEpXG4gICAgICBpZiAoaC5sZW5ndGggPT09IDMpIGggPSBoWzBdICsgaFswXSArIGhbMV0gKyBoWzFdICsgaFsyXSArIGhbMl1cbiAgICAgIHJldHVybiBwYXJzZUludChoLCAxNilcbiAgICAgIC8vIFRPRE8gc2lnbmVkIGludD9cbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlXG4gICAgICBpZiAodGhpcy5zaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICAgIHZhbHVlID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm1vdXNlLXBvaW50ZXJcIjogXCJfbW91c2VfXCIsXG4gICAgICAgICAgICBteXNlbGY6IFwiX215c2VsZlwiLFxuICAgICAgICAgICAgU3RhZ2U6IFwiX3N0YWdlX1wiLFxuICAgICAgICAgICAgZWRnZTogXCJfZWRnZV9cIixcbiAgICAgICAgICAgIFwicmFuZG9tIHBvc2l0aW9uXCI6IFwiX3JhbmRvbV9cIixcbiAgICAgICAgICB9W3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNSb3VuZCkge1xuICAgICAgICB2YWx1ZSA9IG1heWJlTnVtYmVyKHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlzQm9vbGVhblxuICAgICAgPyBmYWxzZVxuICAgICAgOiB0aGlzLmlzUm91bmQgPyBtYXliZU51bWJlcih0aGlzLnZhbHVlKSA6IHRoaXMudmFsdWVcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc0NvbG9yKSB7XG4gICAgICBhc3NlcnQodGhpcy52YWx1ZVswXSA9PT0gXCIjXCIpXG4gICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLnZhbHVlICsgXCJdXCJcbiAgICB9XG4gICAgdmFyIHRleHQgPSAodGhpcy52YWx1ZSA/IFwiXCIgKyB0aGlzLnZhbHVlIDogXCJcIilcbiAgICAgIC5yZXBsYWNlKC8gdiQvLCBcIiBcXFxcdlwiKVxuICAgICAgLnJlcGxhY2UoLyhbXFxdXFxcXF0pL2csIFwiXFxcXCQxXCIpXG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHRleHQgKz0gXCIgdlwiXG4gICAgcmV0dXJuIHRoaXMuaXNSb3VuZFxuICAgICAgPyBcIihcIiArIHRleHQgKyBcIilcIlxuICAgICAgOiB0aGlzLmlzU3F1YXJlXG4gICAgICAgID8gXCJbXCIgKyB0ZXh0ICsgXCJdXCJcbiAgICAgICAgOiB0aGlzLmlzQm9vbGVhbiA/IFwiPD5cIiA6IHRoaXMuaXNTdGFjayA/IFwie31cIiA6IHRleHRcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlXG4gICAgICB0aGlzLnZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHRoaXMudmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICB9XG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB0aGlzLmxhYmVsLm1lYXN1cmUoKVxuICB9XG5cbiAgSW5wdXQuc2hhcGVzID0ge1xuICAgIHN0cmluZzogU1ZHLnBpbGxSZWN0LFxuICAgIG51bWJlcjogU1ZHLnBpbGxSZWN0LFxuICAgIFwibnVtYmVyLWRyb3Bkb3duXCI6IFNWRy5waWxsUmVjdCxcbiAgICBcInJvdW5kLWRyb3Bkb3duXCI6IFNWRy5waWxsUmVjdCxcbiAgICBjb2xvcjogU1ZHLnBpbGxSZWN0LFxuICAgIGRyb3Bkb3duOiBTVkcucm91bmRSZWN0LFxuXG4gICAgYm9vbGVhbjogU1ZHLnBvaW50ZWRSZWN0LFxuICAgIHN0YWNrOiBTVkcuc3RhY2tSZWN0LFxuICAgIHJlcG9ydGVyOiBTVkcucm91bmRSZWN0LFxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICBpZiAodGhpcy5oYXNMYWJlbCkge1xuICAgICAgdmFyIGxhYmVsID0gdGhpcy5sYWJlbC5kcmF3KClcbiAgICAgIHZhciB3ID0gTWF0aC5tYXgoXG4gICAgICAgIDI1LFxuICAgICAgICB0aGlzLmxhYmVsLndpZHRoICtcbiAgICAgICAgICAodGhpcy5zaGFwZSA9PT0gXCJzdHJpbmdcIiB8fCB0aGlzLnNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiIHx8IHRoaXMuc2hhcGUgPT09IFwicmVwb3J0ZXJcIiA/IDIwIDogMjApXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3ID0gdGhpcy5pc0luc2V0ID8gMzAgOiB0aGlzLmlzQ29sb3IgPyAyNSA6IG51bGxcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHcgKz0gOFxuICAgIGlmICh0aGlzLnNoYXBlID09PSBcInJvdW5kLWRyb3Bkb3duXCIpIHcgKz0gNlxuICAgIHRoaXMud2lkdGggPSB3XG5cbiAgICB2YXIgaCA9ICh0aGlzLmhlaWdodCA9IHRoaXMuaXNSb3VuZCB8fCB0aGlzLmlzQ29sb3IgPyAyMCA6IDIwKVxuXG4gICAgdmFyIGVsID0gSW5wdXQuc2hhcGVzW3RoaXMuc2hhcGVdKHcsIGgpXG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGZpbGw6IHRoaXMudmFsdWUsXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAodGhpcy5pc0Rhcmtlcikge1xuICAgICAgZWwgPSBkYXJrUmVjdCh3LCBoLCBwYXJlbnQuaW5mby5jYXRlZ29yeSwgZWwpXG4gICAgICBpZiAocGFyZW50LmluZm8uY29sb3IpIHtcbiAgICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgICAgZmlsbDogcGFyZW50LmluZm8uY29sb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IFNWRy5ncm91cChbXG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgY2xhc3M6IFtcInNiLWlucHV0XCIsIFwic2ItaW5wdXQtXCIgKyB0aGlzLnNoYXBlXS5qb2luKFwiIFwiKSxcbiAgICAgIH0pLFxuICAgIF0pXG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHtcbiAgICAgIHZhciB4ID0gdGhpcy5pc1JvdW5kID8gMTAgOiA2XG4gICAgICByZXN1bHQuYXBwZW5kQ2hpbGQoU1ZHLm1vdmUoeCwgNCwgbGFiZWwpKVxuICAgIH1cbiAgICBpZiAodGhpcy5oYXNBcnJvdykge1xuICAgICAgdmFyIHkgPSB0aGlzLnNoYXBlID09PSBcImRyb3Bkb3duXCIgPyA0IDogNFxuICAgICAgaWYgKHRoaXMuc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCIpIHtcbiAgICAgICAgcmVzdWx0LmFwcGVuZENoaWxkKFNWRy5tb3ZlKHcgLSAxNiwgOCwgU1ZHLnN5bWJvbChcIiNibGFja0Ryb3Bkb3duQXJyb3dcIiwge30pKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5hcHBlbmRDaGlsZChTVkcubW92ZSh3IC0gMTYsIDgsIFNWRy5zeW1ib2woXCIjd2hpdGVEcm9wZG93bkFycm93XCIsIHt9KSkpXG4gICAgICB9XG4gICAgICBcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyogQmxvY2sgKi9cblxuICB2YXIgQmxvY2sgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgY29tbWVudCkge1xuICAgIGFzc2VydChpbmZvKVxuICAgIHRoaXMuaW5mbyA9IGluZm9cbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW5cbiAgICB0aGlzLmNvbW1lbnQgPSBjb21tZW50IHx8IG51bGxcbiAgICB0aGlzLmRpZmYgPSBudWxsXG5cbiAgICB2YXIgc2hhcGUgPSB0aGlzLmluZm8uc2hhcGVcbiAgICB0aGlzLmlzSGF0ID0gc2hhcGUgPT09IFwiaGF0XCIgfHwgc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgdGhpcy5oYXNQdXp6bGUgPSBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImhhdFwiXG4gICAgdGhpcy5pc0ZpbmFsID0gL2NhcC8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzQ29tbWFuZCA9IHNoYXBlID09PSBcInN0YWNrXCIgfHwgc2hhcGUgPT09IFwiY2FwXCIgfHwgL2Jsb2NrLy50ZXN0KHNoYXBlKVxuICAgIHRoaXMuaXNPdXRsaW5lID0gc2hhcGUgPT09IFwib3V0bGluZVwiXG4gICAgdGhpcy5pc1JlcG9ydGVyID0gc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09IFwiYm9vbGVhblwiXG5cbiAgICB0aGlzLmlzUmluZyA9IHNoYXBlID09PSBcInJpbmdcIlxuICAgIHRoaXMuaGFzU2NyaXB0ID0gL2Jsb2NrLy50ZXN0KHNoYXBlKVxuICAgIHRoaXMuaXNFbHNlID0gc2hhcGUgPT09IFwiY2Vsc2VcIlxuICAgIHRoaXMuaXNFbmQgPSBzaGFwZSA9PT0gXCJjZW5kXCJcblxuICAgIHRoaXMueCA9IDBcbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMuZmlyc3RMaW5lID0gbnVsbFxuICAgIHRoaXMuaW5uZXJXaWR0aCA9IG51bGxcbiAgICBcbiAgICBzd2l0Y2ggKHRoaXMuaW5mby5jYXRlZ29yeSkge1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHRoaXMuaXNDb21tYW5kKSB7XG4gICAgICAgICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KG5ldyBJY29uKFwibm9ybWFsXCIpKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIFwibXVzaWNcIjpcbiAgICAgICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KG5ldyBJY29uKFwibGluZVwiKSlcbiAgICAgICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KG5ldyBJY29uKFwibXVzaWNcIikpXG4gICAgICAgIHRoaXMuaW5mby5jYXRlZ29yeSA9IFwiZXh0ZW5zaW9uXCJcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgXCJwZW5cIjpcbiAgICAgICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KG5ldyBJY29uKFwibGluZVwiKSlcbiAgICAgICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KG5ldyBJY29uKFwicGVuXCIpKVxuICAgICAgICAvL3RoaXMuaW5mby5jYXRlZ29yeSA9IFwiZXh0ZW5zaW9uXCJcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgXCJ2aWRlb1wiOlxuICAgICAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQobmV3IEljb24oXCJsaW5lXCIpKVxuICAgICAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQobmV3IEljb24oXCJ2aWRlb1wiKSlcbiAgICAgICAgdGhpcy5pbmZvLmNhdGVnb3J5ID0gXCJleHRlbnNpb25cIlxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuICBCbG9jay5wcm90b3R5cGUuaXNCbG9jayA9IHRydWVcblxuICBCbG9jay5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIGFycmF5LCBwYXJ0KSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheS5zbGljZSgpXG4gICAgdmFyIHNlbGVjdG9yID0gYXJncy5zaGlmdCgpXG4gICAgaWYgKHNlbGVjdG9yID09PSBcInByb2NEZWZcIikge1xuICAgICAgdmFyIHNwZWMgPSBhcmdzWzBdXG4gICAgICB2YXIgaW5wdXROYW1lcyA9IGFyZ3NbMV0uc2xpY2UoKVxuICAgICAgLy8gdmFyIGRlZmF1bHRWYWx1ZXMgPSBhcmdzWzJdO1xuICAgICAgLy8gdmFyIGlzQXRvbWljID0gYXJnc1szXTsgLy8gVE9ET1xuXG4gICAgICB2YXIgaW5mbyA9IHBhcnNlU3BlYyhzcGVjKVxuICAgICAgdmFyIGNoaWxkcmVuID0gaW5mby5wYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgICBpZiAoaW5wdXRQYXQudGVzdChwYXJ0KSkge1xuICAgICAgICAgIHZhciBsYWJlbCA9IG5ldyBMYWJlbChpbnB1dE5hbWVzLnNoaWZ0KCkpXG4gICAgICAgICAgcmV0dXJuIG5ldyBCbG9jayhcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc2hhcGU6IHBhcnRbMV0gPT09IFwiYlwiID8gXCJib29sZWFuXCIgOiBcInJlcG9ydGVyXCIsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbbGFiZWxdXG4gICAgICAgICAgKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgTGFiZWwocGFydClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHZhciBvdXRsaW5lID0gbmV3IEJsb2NrKFxuICAgICAgICB7XG4gICAgICAgICAgc2hhcGU6IFwib3V0bGluZVwiLFxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuXG4gICAgICB2YXIgY2hpbGRyZW4gPSBbbmV3IExhYmVsKGxhbmcuZGVmaW5lWzBdKSwgb3V0bGluZV1cbiAgICAgIHJldHVybiBuZXcgQmxvY2soXG4gICAgICAgIHtcbiAgICAgICAgICBzaGFwZTogXCJkZWZpbmUtaGF0XCIsXG4gICAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tXCIsXG4gICAgICAgICAgc2VsZWN0b3I6IFwicHJvY0RlZlwiLFxuICAgICAgICAgIGNhbGw6IHNwZWMsXG4gICAgICAgICAgbmFtZXM6IGFyZ3NbMV0sXG4gICAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChzZWxlY3RvciA9PT0gXCJjYWxsXCIpIHtcbiAgICAgIHZhciBzcGVjID0gYXJncy5zaGlmdCgpXG4gICAgICB2YXIgaW5mbyA9IGV4dGVuZChwYXJzZVNwZWMoc3BlYyksIHtcbiAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tXCIsXG4gICAgICAgIHNoYXBlOiBcInN0YWNrXCIsXG4gICAgICAgIHNlbGVjdG9yOiBcImNhbGxcIixcbiAgICAgICAgY2FsbDogc3BlYyxcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICB9KVxuICAgICAgdmFyIHBhcnRzID0gaW5mby5wYXJ0c1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBzZWxlY3RvciA9PT0gXCJyZWFkVmFyaWFibGVcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiY29udGVudHNPZkxpc3Q6XCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImdldFBhcmFtXCJcbiAgICApIHtcbiAgICAgIHZhciBzaGFwZSA9XG4gICAgICAgIHNlbGVjdG9yID09PSBcImdldFBhcmFtXCIgJiYgYXJncy5wb3AoKSA9PT0gXCJiXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIlxuICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgICAgc2hhcGU6IHNoYXBlLFxuICAgICAgICBjYXRlZ29yeToge1xuICAgICAgICAgIHJlYWRWYXJpYWJsZTogXCJ2YXJpYWJsZXNcIixcbiAgICAgICAgICBcImNvbnRlbnRzT2ZMaXN0OlwiOiBcImxpc3RcIixcbiAgICAgICAgICBnZXRQYXJhbTogXCJjdXN0b20tYXJnXCIsXG4gICAgICAgIH1bc2VsZWN0b3JdLFxuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQmxvY2soaW5mbywgW25ldyBMYWJlbChhcmdzWzBdKV0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpbmZvID0gZXh0ZW5kKGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3JdLCB7XG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfSlcbiAgICAgIGFzc2VydChpbmZvLCBcInVua25vd24gc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpXG4gICAgICB2YXIgc3BlYyA9IGxhbmcuY29tbWFuZHNbaW5mby5zcGVjXSB8fCBzcGVjXG4gICAgICB2YXIgcGFydHMgPSBzcGVjID8gcGFyc2VTcGVjKHNwZWMpLnBhcnRzIDogaW5mby5wYXJ0c1xuICAgIH1cbiAgICB2YXIgY2hpbGRyZW4gPSBwYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgaWYgKGlucHV0UGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgdmFyIGFyZyA9IGFyZ3Muc2hpZnQoKVxuICAgICAgICByZXR1cm4gKGlzQXJyYXkoYXJnKSA/IEJsb2NrIDogSW5wdXQpLmZyb21KU09OKGxhbmcsIGFyZywgcGFydClcbiAgICAgIH0gZWxzZSBpZiAoaWNvblBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSWNvbihwYXJ0LnNsaWNlKDEpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYWJlbChwYXJ0LnRyaW0oKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihsaXN0LCBpbmRleCkge1xuICAgICAgbGlzdCA9IGxpc3QgfHwgW11cbiAgICAgIGFzc2VydChpc0FycmF5KGxpc3QpKVxuICAgICAgY2hpbGRyZW4ucHVzaChuZXcgU2NyaXB0KGxpc3QubWFwKEJsb2NrLmZyb21KU09OLmJpbmQobnVsbCwgbGFuZykpKSlcbiAgICAgIGlmIChzZWxlY3RvciA9PT0gXCJkb0lmRWxzZVwiICYmIGluZGV4ID09PSAwKSB7XG4gICAgICAgIGNoaWxkcmVuLnB1c2gobmV3IExhYmVsKGxhbmcuY29tbWFuZHNbXCJlbHNlXCJdKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIFRPRE8gbG9vcCBhcnJvd3NcbiAgICByZXR1cm4gbmV3IEJsb2NrKGluZm8sIGNoaWxkcmVuKVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuaW5mby5zZWxlY3RvclxuICAgIHZhciBhcmdzID0gW11cblxuICAgIGlmIChzZWxlY3RvciA9PT0gXCJwcm9jRGVmXCIpIHtcbiAgICAgIHZhciBpbnB1dE5hbWVzID0gdGhpcy5pbmZvLm5hbWVzXG4gICAgICB2YXIgc3BlYyA9IHRoaXMuaW5mby5jYWxsXG4gICAgICB2YXIgaW5mbyA9IHBhcnNlU3BlYyhzcGVjKVxuICAgICAgdmFyIGRlZmF1bHRWYWx1ZXMgPSBpbmZvLmlucHV0cy5tYXAoZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09PSBcIiVuXCIgPyAxIDogaW5wdXQgPT09IFwiJWJcIiA/IGZhbHNlIDogXCJcIlxuICAgICAgfSlcbiAgICAgIHZhciBpc0F0b21pYyA9IGZhbHNlIC8vIFRPRE8gJ2RlZmluZS1hdG9taWMnID8/XG4gICAgICByZXR1cm4gW1wicHJvY0RlZlwiLCBzcGVjLCBpbnB1dE5hbWVzLCBkZWZhdWx0VmFsdWVzLCBpc0F0b21pY11cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBzZWxlY3RvciA9PT0gXCJyZWFkVmFyaWFibGVcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiY29udGVudHNPZkxpc3Q6XCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImdldFBhcmFtXCJcbiAgICApIHtcbiAgICAgIGFyZ3MucHVzaChibG9ja05hbWUodGhpcykpXG4gICAgICBpZiAoc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIilcbiAgICAgICAgYXJncy5wdXNoKHRoaXMuaXNCb29sZWFuID09PSBcImJvb2xlYW5cIiA/IFwiYlwiIDogXCJyXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldXG4gICAgICAgIGlmIChjaGlsZC5pc0lucHV0IHx8IGNoaWxkLmlzQmxvY2sgfHwgY2hpbGQuaXNTY3JpcHQpIHtcbiAgICAgICAgICBhcmdzLnB1c2goY2hpbGQudG9KU09OKCkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdG9yID09PSBcImNhbGxcIikge1xuICAgICAgICByZXR1cm4gW1wiY2FsbFwiLCB0aGlzLmluZm8uY2FsbF0uY29uY2F0KGFyZ3MpXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghc2VsZWN0b3IpIHRocm93IFwidW5rbm93biBibG9jazogXCIgKyB0aGlzLmluZm8uaGFzaFxuICAgIHJldHVybiBbc2VsZWN0b3JdLmNvbmNhdChhcmdzKVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKGV4dHJhcykge1xuICAgIHZhciBmaXJzdElucHV0ID0gbnVsbFxuICAgIHZhciBjaGVja0FsaWFzID0gZmFsc2VcbiAgICB2YXIgdGV4dCA9IHRoaXMuY2hpbGRyZW5cbiAgICAgIC5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgaWYgKGNoaWxkLmlzSWNvbikgY2hlY2tBbGlhcyA9IHRydWVcbiAgICAgICAgaWYgKCFmaXJzdElucHV0ICYmICEoY2hpbGQuaXNMYWJlbCB8fCBjaGlsZC5pc0ljb24pKSBmaXJzdElucHV0ID0gY2hpbGRcbiAgICAgICAgcmV0dXJuIGNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgPyBcIlxcblwiICsgaW5kZW50KGNoaWxkLnN0cmluZ2lmeSgpKSArIFwiXFxuXCJcbiAgICAgICAgICA6IGNoaWxkLnN0cmluZ2lmeSgpLnRyaW0oKSArIFwiIFwiXG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIilcbiAgICAgIC50cmltKClcblxuICAgIHZhciBsYW5nID0gdGhpcy5pbmZvLmxhbmd1YWdlXG4gICAgaWYgKGNoZWNrQWxpYXMgJiYgbGFuZyAmJiB0aGlzLmluZm8uc2VsZWN0b3IpIHtcbiAgICAgIHZhciB0eXBlID0gYmxvY2tzQnlTZWxlY3Rvclt0aGlzLmluZm8uc2VsZWN0b3JdXG4gICAgICB2YXIgc3BlYyA9IHR5cGUuc3BlY1xuICAgICAgdmFyIGFsaWFzID0gbGFuZy5uYXRpdmVBbGlhc2VzW3R5cGUuc3BlY11cbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICAvLyBUT0RPIG1ha2UgdHJhbnNsYXRlKCkgbm90IGluLXBsYWNlLCBhbmQgdXNlIHRoYXRcbiAgICAgICAgaWYgKGlucHV0UGF0LnRlc3QoYWxpYXMpICYmIGZpcnN0SW5wdXQpIHtcbiAgICAgICAgICBhbGlhcyA9IGFsaWFzLnJlcGxhY2UoaW5wdXRQYXQsIGZpcnN0SW5wdXQuc3RyaW5naWZ5KCkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsaWFzXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG92ZXJyaWRlcyA9IGV4dHJhcyB8fCBcIlwiXG4gICAgaWYgKFxuICAgICAgKHRoaXMuaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiICYmIHRoaXMuaXNSZXBvcnRlcikgfHxcbiAgICAgICh0aGlzLmluZm8uY2F0ZWdvcnkgPT09IFwiY3VzdG9tLWFyZ1wiICYmXG4gICAgICAgICh0aGlzLmlzUmVwb3J0ZXIgfHwgdGhpcy5pc0Jvb2xlYW4pKSB8fFxuICAgICAgKHRoaXMuaW5mby5jYXRlZ29yeSA9PT0gXCJjdXN0b21cIiAmJiB0aGlzLmluZm8uc2hhcGUgPT09IFwic3RhY2tcIilcbiAgICApIHtcbiAgICAgIGlmIChvdmVycmlkZXMpIG92ZXJyaWRlcyArPSBcIiBcIlxuICAgICAgb3ZlcnJpZGVzICs9IHRoaXMuaW5mby5jYXRlZ29yeVxuICAgIH1cbiAgICBpZiAob3ZlcnJpZGVzKSB7XG4gICAgICB0ZXh0ICs9IFwiIDo6IFwiICsgb3ZlcnJpZGVzXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmhhc1NjcmlwdFxuICAgICAgPyB0ZXh0ICsgXCJcXG5lbmRcIlxuICAgICAgOiB0aGlzLmluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgICAgICA/IFwiKFwiICsgdGV4dCArIFwiKVwiXG4gICAgICAgIDogdGhpcy5pbmZvLnNoYXBlID09PSBcImJvb2xlYW5cIiA/IFwiPFwiICsgdGV4dCArIFwiPlwiIDogdGV4dFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcsIGlzU2hhbGxvdykge1xuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuaW5mby5zZWxlY3RvclxuICAgIGlmICghc2VsZWN0b3IpIHJldHVyblxuICAgIGlmIChzZWxlY3RvciA9PT0gXCJwcm9jRGVmXCIpIHtcbiAgICAgIGFzc2VydCh0aGlzLmNoaWxkcmVuWzBdLmlzTGFiZWwpXG4gICAgICB0aGlzLmNoaWxkcmVuWzBdID0gbmV3IExhYmVsKGxhbmcuZGVmaW5lWzBdIHx8IGVuZ2xpc2guZGVmaW5lWzBdKVxuICAgIH1cbiAgICB2YXIgYmxvY2sgPSBibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yXVxuICAgIGlmICghYmxvY2spIHJldHVyblxuICAgIHZhciBuYXRpdmVTcGVjID0gbGFuZy5jb21tYW5kc1tibG9jay5zcGVjXVxuICAgIGlmICghbmF0aXZlU3BlYykgcmV0dXJuXG4gICAgdmFyIG5hdGl2ZUluZm8gPSBwYXJzZVNwZWMobmF0aXZlU3BlYylcbiAgICB2YXIgYXJncyA9IHRoaXMuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICByZXR1cm4gIWNoaWxkLmlzTGFiZWwgJiYgIWNoaWxkLmlzSWNvblxuICAgIH0pXG4gICAgaWYgKCFpc1NoYWxsb3cpXG4gICAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgY2hpbGQudHJhbnNsYXRlKGxhbmcpXG4gICAgICB9KVxuICAgIHRoaXMuY2hpbGRyZW4gPSBuYXRpdmVJbmZvLnBhcnRzXG4gICAgICAubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgdmFyIHBhcnQgPSBwYXJ0LnRyaW0oKVxuICAgICAgICBpZiAoIXBhcnQpIHJldHVyblxuICAgICAgICByZXR1cm4gaW5wdXRQYXQudGVzdChwYXJ0KVxuICAgICAgICAgID8gYXJncy5zaGlmdCgpXG4gICAgICAgICAgOiBpY29uUGF0LnRlc3QocGFydCkgPyBuZXcgSWNvbihwYXJ0LnNsaWNlKDEpKSA6IG5ldyBMYWJlbChwYXJ0KVxuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgYXJncy5mb3JFYWNoKFxuICAgICAgZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgICB9LmJpbmQodGhpcylcbiAgICApXG4gICAgdGhpcy5pbmZvLmxhbmd1YWdlID0gbGFuZ1xuICAgIHRoaXMuaW5mby5pc1JUTCA9IHJ0bExhbmd1YWdlcy5pbmRleE9mKGxhbmcuY29kZSkgPiAtMVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV1cbiAgICAgIGlmIChjaGlsZC5tZWFzdXJlKSBjaGlsZC5tZWFzdXJlKClcbiAgICB9XG4gICAgaWYgKHRoaXMuY29tbWVudCkgdGhpcy5jb21tZW50Lm1lYXN1cmUoKVxuICB9XG5cbiAgQmxvY2suc2hhcGVzID0ge1xuICAgIHN0YWNrOiBTVkcuc3RhY2tSZWN0LFxuICAgIFwiYy1ibG9ja1wiOiBTVkcuc3RhY2tSZWN0LFxuICAgIFwiaWYtYmxvY2tcIjogU1ZHLnN0YWNrUmVjdCxcbiAgICBjZWxzZTogU1ZHLnN0YWNrUmVjdCxcbiAgICBjZW5kOiBTVkcuc3RhY2tSZWN0LFxuXG4gICAgY2FwOiBTVkcuY2FwUmVjdCxcbiAgICByZXBvcnRlcjogU1ZHLnBpbGxSZWN0LFxuICAgIGJvb2xlYW46IFNWRy5wb2ludGVkUmVjdCxcbiAgICBoYXQ6IFNWRy5oYXRSZWN0LFxuICAgIFwiZGVmaW5lLWhhdFwiOiBTVkcucHJvY0hhdFJlY3QsXG4gICAgcmluZzogU1ZHLnJpbmdSZWN0LFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24odywgaCwgbGluZXMpIHtcbiAgICAvLyBtb3V0aHNcbiAgICBpZiAobGluZXMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIFNWRy5tb3V0aFJlY3QodywgaCwgdGhpcy5pc0ZpbmFsLCBsaW5lcywge1xuICAgICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIG91dGxpbmVzXG4gICAgaWYgKHRoaXMuaW5mby5zaGFwZSA9PT0gXCJvdXRsaW5lXCIpIHtcbiAgICAgIHJldHVybiBTVkcuc2V0UHJvcHMoU1ZHLnN0YWNrUmVjdCh3LCBoKSwge1xuICAgICAgICBjbGFzczogXCJzYi1vdXRsaW5lXCIsXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIHJpbmdzXG4gICAgaWYgKHRoaXMuaXNSaW5nKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuWzBdXG4gICAgICBpZiAoY2hpbGQgJiYgKGNoaWxkLmlzSW5wdXQgfHwgY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc1NjcmlwdCkpIHtcbiAgICAgICAgdmFyIHNoYXBlID0gY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICA/IFwic3RhY2tcIlxuICAgICAgICAgIDogY2hpbGQuaXNJbnB1dCA/IGNoaWxkLnNoYXBlIDogY2hpbGQuaW5mby5zaGFwZVxuICAgICAgICByZXR1cm4gU1ZHLnJpbmdSZWN0KHcsIGgsIGNoaWxkLnksIGNoaWxkLndpZHRoLCBjaGlsZC5oZWlnaHQsIHNoYXBlLCB7XG4gICAgICAgICAgY2xhc3M6IFtcInNiLVwiICsgdGhpcy5pbmZvLmNhdGVnb3J5LCBcInNiLWJldmVsXCJdLmpvaW4oXCIgXCIpLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBmdW5jID0gQmxvY2suc2hhcGVzW3RoaXMuaW5mby5zaGFwZV1cbiAgICBhc3NlcnQoZnVuYywgXCJubyBzaGFwZSBmdW5jOiBcIiArIHRoaXMuaW5mby5zaGFwZSlcbiAgICByZXR1cm4gZnVuYyh3LCBoLCB7XG4gICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgfSlcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5taW5EaXN0YW5jZSA9IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKHRoaXMuaXNCb29sZWFuKSB7XG4gICAgICByZXR1cm4gY2hpbGQuaXNSZXBvcnRlclxuICAgICAgICA/ICg0ICsgY2hpbGQuaGVpZ2h0IC8gNCkgfCAwXG4gICAgICAgIDogY2hpbGQuaXNMYWJlbFxuICAgICAgICAgID8gKDUgKyBjaGlsZC5oZWlnaHQgLyAyKSB8IDBcbiAgICAgICAgICA6IGNoaWxkLmlzQm9vbGVhbiB8fCBjaGlsZC5zaGFwZSA9PT0gXCJib29sZWFuXCJcbiAgICAgICAgICAgID8gNVxuICAgICAgICAgICAgOiAoMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgIH1cbiAgICBpZiAodGhpcy5pc1JlcG9ydGVyKSB7XG4gICAgICByZXR1cm4gKGNoaWxkLmlzSW5wdXQgJiYgY2hpbGQuaXNSb3VuZCkgfHxcbiAgICAgICAgKChjaGlsZC5pc1JlcG9ydGVyIHx8IGNoaWxkLmlzQm9vbGVhbikgJiYgIWNoaWxkLmhhc1NjcmlwdClcbiAgICAgICAgPyAyXG4gICAgICAgIDogY2hpbGQuaXNMYWJlbFxuICAgICAgICAgID8gKDIgKyBjaGlsZC5oZWlnaHQgLyAyKSB8IDBcbiAgICAgICAgICA6ICgtMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgIH1cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgQmxvY2sucGFkZGluZyA9IHtcbiAgICBoYXQ6IFsyMSwgNiwgN10sXG4gICAgXCJkZWZpbmUtaGF0XCI6IFsyMCwgOCwgMTBdLFxuICAgIHJlcG9ydGVyOiBbNSwgMywgM10sXG4gICAgYm9vbGVhbjogWzUsIDMsIDNdLFxuICAgIGNhcDogWzExLCA2LCA2XSxcbiAgICBcImMtYmxvY2tcIjogWzgsIDYsIDVdLFxuICAgIFwiaWYtYmxvY2tcIjogWzgsIDYsIDVdLFxuICAgIHJpbmc6IFsxMCwgNCwgMTBdLFxuICAgIG51bGw6IFs4LCA2LCA1XSxcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzRGVmaW5lID0gdGhpcy5pbmZvLnNoYXBlID09PSBcImRlZmluZS1oYXRcIlxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW5cblxuICAgIHZhciBwYWRkaW5nID0gQmxvY2sucGFkZGluZ1t0aGlzLmluZm8uc2hhcGVdIHx8IEJsb2NrLnBhZGRpbmdbbnVsbF1cbiAgICB2YXIgcHQgPSBwYWRkaW5nWzBdLFxuICAgICAgcHggPSBwYWRkaW5nWzFdLFxuICAgICAgcGIgPSBwYWRkaW5nWzJdXG5cbiAgICB2YXIgeSA9IDBcbiAgICB2YXIgTGluZSA9IGZ1bmN0aW9uKHkpIHtcbiAgICAgIHRoaXMueSA9IHlcbiAgICAgIHRoaXMud2lkdGggPSAwXG4gICAgICB0aGlzLmhlaWdodCA9IHkgPyAxOCA6IDE2XG4gICAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB9XG5cbiAgICB2YXIgaW5uZXJXaWR0aCA9IDBcbiAgICB2YXIgc2NyaXB0V2lkdGggPSAwXG4gICAgdmFyIGxpbmUgPSBuZXcgTGluZSh5KVxuICAgIGZ1bmN0aW9uIHB1c2hMaW5lKGlzTGFzdCkge1xuICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsaW5lLmhlaWdodCArPSBwdCArIHBiXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaW5lLmhlaWdodCArPSBpc0xhc3QgPyAwIDogKzJcbiAgICAgICAgbGluZS55IC09IDFcbiAgICAgIH1cbiAgICAgIHkgKz0gbGluZS5oZWlnaHRcbiAgICAgIGxpbmVzLnB1c2gobGluZSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmZvLmlzUlRMKSB7XG4gICAgICB2YXIgc3RhcnQgPSAwXG4gICAgICB2YXIgZmxpcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgICAgICAgLnNsaWNlKDAsIHN0YXJ0KVxuICAgICAgICAgIC5jb25jYXQoY2hpbGRyZW4uc2xpY2Uoc3RhcnQsIGkpLnJldmVyc2UoKSlcbiAgICAgICAgICAuY29uY2F0KGNoaWxkcmVuLnNsaWNlKGkpKVxuICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjaGlsZHJlbltpXS5pc1NjcmlwdCkge1xuICAgICAgICAgIGZsaXAoKVxuICAgICAgICAgIHN0YXJ0ID0gaSArIDFcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHN0YXJ0IDwgaSkge1xuICAgICAgICBmbGlwKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGluZXMgPSBbXSAvL2xvb2sgYXQgdGhpc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICBjaGlsZC5lbCA9IGNoaWxkLmRyYXcodGhpcylcblxuICAgICAgaWYgKGNoaWxkLmlzU2NyaXB0ICYmIHRoaXMuaXNDb21tYW5kKSB7XG4gICAgICAgIHRoaXMuaGFzU2NyaXB0ID0gdHJ1ZVxuICAgICAgICBwdXNoTGluZSgpXG4gICAgICAgIGNoaWxkLnkgPSB5XG4gICAgICAgIGxpbmVzLnB1c2goY2hpbGQpXG4gICAgICAgIHNjcmlwdFdpZHRoID0gTWF0aC5tYXgoc2NyaXB0V2lkdGgsIE1hdGgubWF4KDEsIGNoaWxkLndpZHRoKSkgIC8vbG9vayBhdCB0aGlzIGFyZWFcbiAgICAgICAgY2hpbGQuaGVpZ2h0ID0gTWF0aC5tYXgoMTIsIGNoaWxkLmhlaWdodCkgKyAzXG4gICAgICAgIHkgKz0gY2hpbGQuaGVpZ2h0XG4gICAgICAgIGxpbmUgPSBuZXcgTGluZSh5KVxuICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0Fycm93KSB7XG4gICAgICAgIGxpbmUuY2hpbGRyZW4ucHVzaChjaGlsZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjbXcgPSBpID4gMCA/IDMyIDogMCAvLyAyN1xuICAgICAgICB2YXIgbWQgPSB0aGlzLmlzQ29tbWFuZCA/IDAgOiB0aGlzLm1pbkRpc3RhbmNlKGNoaWxkKVxuICAgICAgICB2YXIgbXcgPSB0aGlzLmlzQ29tbWFuZFxuICAgICAgICAgID8gY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc0lucHV0ID8gY213IDogMFxuICAgICAgICAgIDogbWRcbiAgICAgICAgaWYgKG13ICYmICFsaW5lcy5sZW5ndGggJiYgbGluZS53aWR0aCA8IG13IC0gcHgpIHtcbiAgICAgICAgICBsaW5lLndpZHRoID0gbXcgLSBweFxuICAgICAgICB9XG4gICAgICAgIGNoaWxkLnggPSBsaW5lLndpZHRoXG4gICAgICAgIGxpbmUud2lkdGggKz0gY2hpbGQud2lkdGhcbiAgICAgICAgaW5uZXJXaWR0aCA9IE1hdGgubWF4KGlubmVyV2lkdGgsIGxpbmUud2lkdGggKyBNYXRoLm1heCgwLCBtZCAtIHB4KSlcbiAgICAgICAgLy9saW5lLndpZHRoICs9IDEgLy80XG4gICAgICAgIGlmICghY2hpbGQuaXNMYWJlbCkgeyAvL3RleHQgdnMgcmVwb3J0ZXIgcGFkZGluZ1xuICAgICAgICAgIGxpbmUud2lkdGggKz0gNVxuICAgICAgICAgIGxpbmUuaGVpZ2h0ID0gTWF0aC5tYXgobGluZS5oZWlnaHQsIGNoaWxkLmhlaWdodClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5lLndpZHRoICs9IDVcbiAgICAgICAgfVxuICAgICAgICBsaW5lLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICB9XG4gICAgfVxuICAgIHB1c2hMaW5lKHRydWUpXG5cbiAgICBpbm5lcldpZHRoID0gTWF0aC5tYXgoXG4gICAgICBpbm5lcldpZHRoICsgcHggKiAyLFxuICAgICAgdGhpcy5pc0hhdCB8fCB0aGlzLmhhc1NjcmlwdFxuICAgICAgICA/IDcwXG4gICAgICAgIDogdGhpcy5pc0NvbW1hbmQgfHwgdGhpcy5pc091dGxpbmUgfHwgdGhpcy5pc1JpbmcgPyA0NSA6IDIwXG4gICAgKVxuICAgIFxuICAgIHRoaXMuaGVpZ2h0ID0geVxuICAgIHRoaXMud2lkdGggPSBzY3JpcHRXaWR0aFxuICAgICAgPyBNYXRoLm1heChpbm5lcldpZHRoLCAxMCArIHNjcmlwdFdpZHRoKVxuICAgICAgOiBpbm5lcldpZHRoXG4gICAgaWYgKGlzRGVmaW5lKSB7XG4gICAgICB2YXIgcCA9IE1hdGgubWluKDI2LCAoMy41ICsgMC4xMyAqIGlubmVyV2lkdGgpIHwgMCkgLSAxNVxuICAgICAgdGhpcy5oZWlnaHQgKz0gcFxuICAgICAgcHQgKz0gMiAqIHBcbiAgICB9XG4gICAgXG4gICAgdGhpcy5maXJzdExpbmUgPSBsaW5lc1swXVxuICAgIHRoaXMuaW5uZXJXaWR0aCA9IGlubmVyV2lkdGhcblxuICAgIHZhciBvYmplY3RzID0gW11cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaW5lID0gbGluZXNbaV1cbiAgICAgIGlmIChsaW5lLmlzU2NyaXB0KSB7XG4gICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZSgxMCwgbGluZS55LCBsaW5lLmVsKSlcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIGggPSBsaW5lLmhlaWdodFxuXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gbGluZS5jaGlsZHJlbltqXVxuICAgICAgICBpZiAoY2hpbGQuaXNBcnJvdykge1xuICAgICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShpbm5lcldpZHRoIC0gMTAsIHRoaXMuaGVpZ2h0IC0gMywgY2hpbGQuZWwpKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeSA9IHB0ICsgKGggLSBjaGlsZC5oZWlnaHQgLSBwdCAtIHBiKSAvIDIgLSAxXG4gICAgICAgIGlmIChpc0RlZmluZSAmJiBjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgeSArPSAwXG4gICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNJY29uKSB7XG4gICAgICAgICAgeSArPSBjaGlsZC5keSB8IDBcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc1JpbmcpIHtcbiAgICAgICAgICBjaGlsZC55ID0gKGxpbmUueSArIHkpIHwgMFxuICAgICAgICAgIGlmIChjaGlsZC5pc0luc2V0KSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc1N0YWNrKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUocHggKyBjaGlsZC54LCAobGluZS55ICsgeSkgfCAwLCBjaGlsZC5lbCkpXG5cbiAgICAgICAgaWYgKGNoaWxkLmRpZmYgPT09IFwiK1wiKSB7XG4gICAgICAgICAgdmFyIGVsbGlwc2UgPSBTVkcuaW5zRWxsaXBzZShjaGlsZC53aWR0aCwgY2hpbGQuaGVpZ2h0KVxuICAgICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShweCArIGNoaWxkLngsIChsaW5lLnkgKyB5KSB8IDAsIGVsbGlwc2UpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGVsID0gdGhpcy5kcmF3U2VsZihpbm5lcldpZHRoLCB0aGlzLmhlaWdodCwgbGluZXMpXG4gICAgb2JqZWN0cy5zcGxpY2UoMCwgMCwgZWwpXG4gICAgaWYgKHRoaXMuaW5mby5jb2xvcikge1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGZpbGw6IHRoaXMuaW5mby5jb2xvcixcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIFNWRy5ncm91cChvYmplY3RzKVxuICB9XG5cbiAgLyogQ29tbWVudCAqL1xuXG4gIHZhciBDb21tZW50ID0gZnVuY3Rpb24odmFsdWUsIGhhc0Jsb2NrKSB7XG4gICAgdGhpcy5sYWJlbCA9IG5ldyBMYWJlbCh2YWx1ZSwgW1wic2ItY29tbWVudC1sYWJlbFwiXSlcbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGFzQmxvY2sgPSBoYXNCbG9ja1xuICB9XG4gIENvbW1lbnQucHJvdG90eXBlLmlzQ29tbWVudCA9IHRydWVcbiAgQ29tbWVudC5saW5lTGVuZ3RoID0gMTZcbiAgQ29tbWVudC5wcm90b3R5cGUuaGVpZ2h0ID0gMjVcblxuICBDb21tZW50LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIvLyBcIiArIHRoaXMubGFiZWwudmFsdWVcbiAgfVxuXG4gIENvbW1lbnQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxhYmVsLm1lYXN1cmUoKVxuICB9XG5cbiAgQ29tbWVudC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYWJlbEVsID0gdGhpcy5sYWJlbC5kcmF3KClcblxuICAgIHRoaXMud2lkdGggPSB0aGlzLmxhYmVsLndpZHRoICsgMTZcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtcbiAgICAgIFNWRy5jb21tZW50TGluZSh0aGlzLmhhc0Jsb2NrID8gQ29tbWVudC5saW5lTGVuZ3RoIDogMCwgNiksXG4gICAgICBTVkcuY29tbWVudFJlY3QodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtcbiAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudFwiLFxuICAgICAgfSksXG4gICAgICBTVkcubW92ZSg4LCA2LCBsYWJlbEVsKSxcbiAgICBdKVxuICB9XG5cbiAgLyogR2xvdyAqL1xuXG4gIHZhciBHbG93ID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBhc3NlcnQoY2hpbGQpXG4gICAgdGhpcy5jaGlsZCA9IGNoaWxkXG4gICAgaWYgKGNoaWxkLmlzQmxvY2spIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBjaGlsZC5pbmZvLnNoYXBlXG4gICAgICB0aGlzLmluZm8gPSBjaGlsZC5pbmZvXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBcInN0YWNrXCJcbiAgICB9XG5cbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMueSA9IDBcbiAgfVxuICBHbG93LnByb3RvdHlwZS5pc0dsb3cgPSB0cnVlXG5cbiAgR2xvdy5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY2hpbGQuaXNCbG9jaykge1xuICAgICAgcmV0dXJuIHRoaXMuY2hpbGQuc3RyaW5naWZ5KFwiK1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGluZXMgPSB0aGlzLmNoaWxkLnN0cmluZ2lmeSgpLnNwbGl0KFwiXFxuXCIpXG4gICAgICByZXR1cm4gbGluZXMubWFwKGxpbmUgPT4gXCIrIFwiICsgbGluZSkuam9pbihcIlxcblwiKVxuICAgIH1cbiAgfVxuXG4gIEdsb3cucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLmNoaWxkLnRyYW5zbGF0ZShsYW5nKVxuICB9XG5cbiAgR2xvdy5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hpbGQubWVhc3VyZSgpXG4gIH1cblxuICBHbG93LnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjID0gdGhpcy5jaGlsZFxuICAgIHZhciBlbFxuICAgIHZhciB3ID0gdGhpcy53aWR0aFxuICAgIHZhciBoID0gdGhpcy5oZWlnaHQgLSAxXG4gICAgaWYgKGMuaXNTY3JpcHQpIHtcbiAgICAgIGlmICghYy5pc0VtcHR5ICYmIGMuYmxvY2tzWzBdLmlzSGF0KSB7XG4gICAgICAgIGVsID0gU1ZHLmhhdFJlY3QodywgaClcbiAgICAgIH0gZWxzZSBpZiAoYy5pc0ZpbmFsKSB7XG4gICAgICAgIGVsID0gU1ZHLmNhcFJlY3QodywgaClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsID0gU1ZHLnN0YWNrUmVjdCh3LCBoKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZWwgPSBjLmRyYXdTZWxmKHcsIGgsIFtdKVxuICAgIH1cbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICBjbGFzczogXCJzYi1kaWZmIHNiLWRpZmYtaW5zXCIsXG4gICAgfSlcbiAgfVxuICAvLyBUT0RPIGhvdyBjYW4gd2UgYWx3YXlzIHJhaXNlIEdsb3dzIGFib3ZlIHRoZWlyIHBhcmVudHM/XG5cbiAgR2xvdy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjID0gdGhpcy5jaGlsZFxuICAgIHZhciBlbCA9IGMuaXNTY3JpcHQgPyBjLmRyYXcodHJ1ZSkgOiBjLmRyYXcoKVxuXG4gICAgdGhpcy53aWR0aCA9IGMud2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IChjLmlzQmxvY2sgJiYgYy5maXJzdExpbmUuaGVpZ2h0KSB8fCBjLmhlaWdodFxuXG4gICAgLy8gZW5jaXJjbGVcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtlbCwgdGhpcy5kcmF3U2VsZigpXSlcbiAgfVxuXG4gIC8qIFNjcmlwdCAqL1xuXG4gIHZhciBTY3JpcHQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgICB0aGlzLmJsb2NrcyA9IGJsb2Nrc1xuICAgIHRoaXMuaXNFbXB0eSA9ICFibG9ja3MubGVuZ3RoXG4gICAgdGhpcy5pc0ZpbmFsID0gIXRoaXMuaXNFbXB0eSAmJiBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmlzRmluYWxcbiAgICB0aGlzLnkgPSAwXG4gIH1cbiAgU2NyaXB0LnByb3RvdHlwZS5pc1NjcmlwdCA9IHRydWVcblxuICBTY3JpcHQuZnJvbUpTT04gPSBmdW5jdGlvbihsYW5nLCBibG9ja3MpIHtcbiAgICAvLyB4ID0gYXJyYXlbMF0sIHkgPSBhcnJheVsxXTtcbiAgICByZXR1cm4gbmV3IFNjcmlwdChibG9ja3MubWFwKEJsb2NrLmZyb21KU09OLmJpbmQobnVsbCwgbGFuZykpKVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5ibG9ja3NbMF0gJiYgdGhpcy5ibG9ja3NbMF0uaXNDb21tZW50KSByZXR1cm5cbiAgICByZXR1cm4gdGhpcy5ibG9ja3MubWFwKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICByZXR1cm4gYmxvY2sudG9KU09OKClcbiAgICB9KVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5ibG9ja3NcbiAgICAgIC5tYXAoZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgdmFyIGxpbmUgPSBibG9jay5zdHJpbmdpZnkoKVxuICAgICAgICBpZiAoYmxvY2suY29tbWVudCkgbGluZSArPSBcIiBcIiArIGJsb2NrLmNvbW1lbnQuc3RyaW5naWZ5KClcbiAgICAgICAgcmV0dXJuIGxpbmVcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblwiKVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgdGhpcy5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgYmxvY2sudHJhbnNsYXRlKGxhbmcpXG4gICAgfSlcbiAgfVxuXG4gIFNjcmlwdC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ibG9ja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYmxvY2tzW2ldLm1lYXN1cmUoKVxuICAgIH1cbiAgfVxuXG4gIFNjcmlwdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGluc2lkZSkge1xuICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgdmFyIHkgPSAwXG4gICAgdGhpcy53aWR0aCA9IDBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYmxvY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpXVxuICAgICAgdmFyIHggPSBpbnNpZGUgPyAwIDogMlxuICAgICAgdmFyIGNoaWxkID0gYmxvY2suZHJhdygpXG4gICAgICBjaGlsZHJlbi5wdXNoKFNWRy5tb3ZlKHgsIHksIGNoaWxkKSlcbiAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBibG9jay53aWR0aClcblxuICAgICAgdmFyIGRpZmYgPSBibG9jay5kaWZmXG4gICAgICBpZiAoZGlmZiA9PT0gXCItXCIpIHtcbiAgICAgICAgdmFyIGR3ID0gYmxvY2sud2lkdGhcbiAgICAgICAgdmFyIGRoID0gYmxvY2suZmlyc3RMaW5lLmhlaWdodCB8fCBibG9jay5oZWlnaHRcbiAgICAgICAgY2hpbGRyZW4ucHVzaChTVkcubW92ZSh4LCB5ICsgZGggLyAyICsgMSwgU1ZHLnN0cmlrZXRocm91Z2hMaW5lKGR3KSkpXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBibG9jay53aWR0aClcbiAgICAgIH1cblxuICAgICAgeSArPSBibG9jay5oZWlnaHRcblxuICAgICAgdmFyIGNvbW1lbnQgPSBibG9jay5jb21tZW50XG4gICAgICBpZiAoY29tbWVudCkge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLmZpcnN0TGluZVxuICAgICAgICB2YXIgY3ggPSBibG9jay5pbm5lcldpZHRoICsgMiArIENvbW1lbnQubGluZUxlbmd0aFxuICAgICAgICB2YXIgY3kgPSB5IC0gYmxvY2suaGVpZ2h0ICsgbGluZS5oZWlnaHQgLyAyXG4gICAgICAgIHZhciBlbCA9IGNvbW1lbnQuZHJhdygpXG4gICAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoY3gsIGN5IC0gY29tbWVudC5oZWlnaHQgLyAyLCBlbCkpXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBjeCArIGNvbW1lbnQud2lkdGgpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaGVpZ2h0ID0geVxuICAgIGlmICghaW5zaWRlICYmICF0aGlzLmlzRmluYWwpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDhcbiAgICB9XG4gICAgaWYgKCFpbnNpZGUgJiYgYmxvY2suaXNHbG93KSB7XG4gICAgICB0aGlzLmhlaWdodCArPSAyIC8vIFRPRE8gdW5icmVhayB0aGlzXG4gICAgfVxuICAgIHJldHVybiBTVkcuZ3JvdXAoY2hpbGRyZW4pXG4gIH1cblxuICAvKiBEb2N1bWVudCAqL1xuXG4gIHZhciBEb2N1bWVudCA9IGZ1bmN0aW9uKHNjcmlwdHMpIHtcbiAgICB0aGlzLnNjcmlwdHMgPSBzY3JpcHRzXG5cbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMuZWwgPSBudWxsXG4gICAgdGhpcy5kZWZzID0gbnVsbFxuICB9XG5cbiAgRG9jdW1lbnQuZnJvbUpTT04gPSBmdW5jdGlvbihzY3JpcHRhYmxlLCBsYW5nKSB7XG4gICAgdmFyIGxhbmcgPSBsYW5nIHx8IGVuZ2xpc2hcbiAgICB2YXIgc2NyaXB0cyA9IHNjcmlwdGFibGUuc2NyaXB0cy5tYXAoZnVuY3Rpb24oYXJyYXkpIHtcbiAgICAgIHZhciBzY3JpcHQgPSBTY3JpcHQuZnJvbUpTT04obGFuZywgYXJyYXlbMl0pXG4gICAgICBzY3JpcHQueCA9IGFycmF5WzBdXG4gICAgICBzY3JpcHQueSA9IGFycmF5WzFdXG4gICAgICByZXR1cm4gc2NyaXB0XG4gICAgfSlcbiAgICAvLyBUT0RPIHNjcmlwdGFibGUuc2NyaXB0Q29tbWVudHNcbiAgICByZXR1cm4gbmV3IERvY3VtZW50KHNjcmlwdHMpXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGpzb25TY3JpcHRzID0gdGhpcy5zY3JpcHRzXG4gICAgICAubWFwKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgICB2YXIganNvbkJsb2NrcyA9IHNjcmlwdC50b0pTT04oKVxuICAgICAgICBpZiAoIWpzb25CbG9ja3MpIHJldHVyblxuICAgICAgICByZXR1cm4gWzEwLCBzY3JpcHQueSArIDEwLCBqc29uQmxvY2tzXVxuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgcmV0dXJuIHtcbiAgICAgIHNjcmlwdHM6IGpzb25TY3JpcHRzLFxuICAgICAgLy8gc2NyaXB0Q29tbWVudHM6IFtdLCAvLyBUT0RPXG4gICAgfVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNjcmlwdHNcbiAgICAgIC5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBzY3JpcHQuc3RyaW5naWZ5KClcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblxcblwiKVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLnNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHNjcmlwdC50cmFuc2xhdGUobGFuZylcbiAgICB9KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHNjcmlwdC5tZWFzdXJlKClcbiAgICB9KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgLy8gbWVhc3VyZSBzdHJpbmdzXG4gICAgdGhpcy5tZWFzdXJlKClcblxuICAgIC8vIFRPRE86IHNlcGFyYXRlIGxheW91dCArIHJlbmRlciBzdGVwcy5cbiAgICAvLyByZW5kZXIgZWFjaCBzY3JpcHRcbiAgICB2YXIgd2lkdGggPSAwXG4gICAgdmFyIGhlaWdodCA9IDBcbiAgICB2YXIgZWxlbWVudHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc2NyaXB0ID0gdGhpcy5zY3JpcHRzW2ldXG4gICAgICBpZiAoaGVpZ2h0KSBoZWlnaHQgKz0gMTBcbiAgICAgIHNjcmlwdC55ID0gaGVpZ2h0XG4gICAgICBlbGVtZW50cy5wdXNoKFNWRy5tb3ZlKDAsIGhlaWdodCwgc2NyaXB0LmRyYXcoKSkpXG4gICAgICBoZWlnaHQgKz0gc2NyaXB0LmhlaWdodFxuICAgICAgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgc2NyaXB0LndpZHRoICsgNClcbiAgICB9XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcblxuICAgIC8vIHJldHVybiBTVkdcbiAgICB2YXIgc3ZnID0gU1ZHLm5ld1NWRyh3aWR0aCwgaGVpZ2h0KVxuICAgIHN2Zy5hcHBlbmRDaGlsZChcbiAgICAgICh0aGlzLmRlZnMgPSBTVkcud2l0aENoaWxkcmVuKFxuICAgICAgICBTVkcuZWwoXCJkZWZzXCIpLFxuICAgICAgICBbXG4gICAgICAgICAgYmV2ZWxGaWx0ZXIoXCJiZXZlbEZpbHRlclwiLCBmYWxzZSksXG4gICAgICAgICAgYmV2ZWxGaWx0ZXIoXCJpbnB1dEJldmVsRmlsdGVyXCIsIHRydWUpLFxuICAgICAgICAgIGRhcmtGaWx0ZXIoXCJpbnB1dERhcmtGaWx0ZXJcIiksXG4gICAgICAgICAgZGVzYXR1cmF0ZUZpbHRlcihcImRlc2F0dXJhdGVGaWx0ZXJcIiksXG4gICAgICAgIF0uY29uY2F0KG1ha2VJY29ucygpKVxuICAgICAgKSlcbiAgICApXG5cbiAgICBzdmcuYXBwZW5kQ2hpbGQoU1ZHLmdyb3VwKGVsZW1lbnRzKSlcbiAgICB0aGlzLmVsID0gc3ZnXG5cbiAgICAvLyBuYjogYXN5bmMgQVBJIG9ubHkgZm9yIGJhY2t3YXJkcy9mb3J3YXJkcyBjb21wYXRpYmlsaXR5IHJlYXNvbnMuXG4gICAgLy8gZGVzcGl0ZSBhcHBlYXJhbmNlcywgaXQgcnVucyBzeW5jaHJvbm91c2x5XG4gICAgY2Ioc3ZnKVxuICB9XG5cbiAgLyogRXhwb3J0IFNWRyBpbWFnZSBhcyBYTUwgc3RyaW5nICovXG4gIERvY3VtZW50LnByb3RvdHlwZS5leHBvcnRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBhc3NlcnQodGhpcy5lbCwgXCJjYWxsIGRyYXcoKSBmaXJzdFwiKVxuXG4gICAgdmFyIHN0eWxlID0gbWFrZVN0eWxlKClcbiAgICB0aGlzLmRlZnMuYXBwZW5kQ2hpbGQoc3R5bGUpXG4gICAgdmFyIHhtbCA9IG5ldyBTVkcuWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMuZWwpXG4gICAgdGhpcy5kZWZzLnJlbW92ZUNoaWxkKHN0eWxlKVxuICAgIHJldHVybiB4bWxcbiAgfVxuXG4gIC8qIEV4cG9ydCBTVkcgaW1hZ2UgYXMgZGF0YSBVUkkgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWRyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB4bWwgPSB0aGlzLmV4cG9ydFNWR1N0cmluZygpXG4gICAgcmV0dXJuIFwiZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIgKyB4bWwucmVwbGFjZSgvWyNdL2csIGVuY29kZVVSSUNvbXBvbmVudClcbiAgfVxuXG4gIERvY3VtZW50LnByb3RvdHlwZS5leHBvcnRQTkcgPSBmdW5jdGlvbihjYikge1xuICAgIHZhciBjYW52YXMgPSBTVkcubWFrZUNhbnZhcygpXG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53aWR0aFxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodFxuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKClcbiAgICBpbWFnZS5zcmMgPSB0aGlzLmV4cG9ydFNWRygpXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMClcblxuICAgICAgaWYgKFVSTCAmJiBVUkwuY3JlYXRlT2JqZWN0VVJMICYmIEJsb2IgJiYgY2FudmFzLnRvQmxvYikge1xuICAgICAgICB2YXIgYmxvYiA9IGNhbnZhcy50b0Jsb2IoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICAgIGNiKFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpXG4gICAgICAgIH0sIFwiaW1hZ2UvcG5nXCIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYihjYW52YXMudG9EYXRhVVJMKFwiaW1hZ2UvcG5nXCIpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIEdsb3csXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9XG59KSgpXG4iLCJ2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxudmFyIEZpbHRlciA9IHJlcXVpcmUoXCIuL2ZpbHRlci5qc1wiKVxuXG52YXIgU3R5bGUgPSAobW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNzc0NvbnRlbnQ6IGBcbiAgICAuc2ItbGFiZWwge1xuICAgICAgZm9udC1mYW1pbHk6IFwiSGVsdmV0aWNhIE5ldWVcIiwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmO1xuICAgICAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICB3b3JkLXNwYWNpbmc6IDBweDtcbiAgICAgIG9wYWNpdHk6IDE7XG4gICAgfVxuXG4gICAgLnNiLW9ic29sZXRlIHsgZmlsbDogI0VENDI0MjsgfVxuICAgIC5zYi1tb3Rpb24geyBmaWxsOiAjNEM5N0ZGOyB9XG4gICAgLnNiLWxvb2tzIHsgZmlsbDogIzk5NjZGRjsgfVxuICAgIC5zYi1zb3VuZCB7IGZpbGw6ICNDRjYzQ0Y7IH1cbiAgICAuc2ItcGVuIHsgZmlsbDogIzBmQkQ4QzsgIH1cbiAgICAuc2ItZXZlbnRzIHsgZmlsbDogI0ZGQkYwMDsgfVxuICAgIC5zYi1jb250cm9sIHsgZmlsbDogI0ZGQUIxOTsgfVxuICAgIC5zYi1zZW5zaW5nIHsgZmlsbDogIzVDQjFENjsgfVxuICAgIC5zYi1vcGVyYXRvcnMgeyBmaWxsOiAjNTlDMDU5OyB9XG4gICAgLnNiLXZhcmlhYmxlcyB7IGZpbGw6ICNGRjhDMUE7IH1cbiAgICAuc2ItbGlzdCB7IGZpbGw6ICNGRjY2MUEgfVxuICAgIC5zYi1jdXN0b20geyBmaWxsOiAjRkY2NjgwOyB9XG4gICAgLnNiLWN1c3RvbS1hcmcgeyBmaWxsOiAjRkY2NjgwOyB9XG4gICAgLnNiLW9sZGV4dGVuc2lvbiB7IGZpbGw6ICM0YjRhNjA7IH1cbiAgICAuc2ItZXh0ZW5zaW9uIHsgZmlsbDogIzBmYmQ4YzsgfVxuICAgIC5zYi1ncmV5IHsgZmlsbDogIzk2OTY5NjsgfVxuXG4gICAgLnNiLWJldmVsIHtcbiAgICAgIGZpbHRlcjI6IHVybCgjYmV2ZWxGaWx0ZXIpO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMTU7XG4gICAgICBzdHJva2UtYWxpZ25tZW50OiBpbm5lcjtcbiAgICB9XG4gICAgLnNiLWlucHV0LXJvdW5kLWRyb3Bkb3duLFxuICAgIC5zYi1pbnB1dC1ib29sZWFuIHtcbiAgICAgIGZpbHRlcjogdXJsKCNpbnB1dERhcmtGaWx0ZXIpO1xuICAgIH1cbiAgICAuc2ItaW5wdXQge1xuICAgICAgZmlsdGVyMjogdXJsKCNpbnB1dEJldmVsRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE1O1xuICAgICAgc3Ryb2tlLWFsaWdubWVudDogaW5uZXI7XG4gICAgfVxuICAgIC5zYi1pbnB1dC1udW1iZXIsXG4gICAgLnNiLWlucHV0LXN0cmluZyxcbiAgICAuc2ItaW5wdXQtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duLFxuICAgIC5zYi1saXRlcmFsLWRyb3Bkb3duIHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICB3b3JkLXNwYWNpbmc6IDA7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICM0NDQ7XG4gICAgfVxuXG4gICAgLnNiLWRhcmtlciB7XG4gICAgICBmaWx0ZXIyOiB1cmwoI2lucHV0RGFya0ZpbHRlcik7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xO1xuICAgICAgc3Ryb2tlLWFsaWdubWVudDogaW5uZXI7XG4gICAgfVxuICAgIC5zYi1kZXNhdHVyYXRlIHtcbiAgICAgIGZpbHRlcjogdXJsKCNkZXNhdHVyYXRlRmlsdGVyKTtcbiAgICB9XG5cbiAgICAuc2Itb3V0bGluZSB7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xO1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgICAgZmlsbDogI0ZGNEQ2QTtcbiAgICB9XG5cbiAgICAuc2ItZGVmaW5lLWhhdC1jYXAge1xuICAgICAgc3Ryb2tlOiAjNjMyZDk5O1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgICAgZmlsbDogIzhlMmVjMjtcbiAgICB9XG5cbiAgICAuc2ItY29tbWVudCB7XG4gICAgICBmaWxsOiAjRTREQjhDO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMjtcbiAgICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICB9XG4gICAgLnNiLWNvbW1lbnQtbGluZSB7XG4gICAgICBmaWxsOiAjMDAwO1xuICAgICAgb3BhY2l0eTogMC4yO1xuICAgIH1cbiAgICAuc2ItY29tbWVudC1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgZmlsbDogIzAwMDtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMHB4O1xuICAgICAgb3BhY2l0eTogMTtcbiAgICB9XG5cbiAgICAuc2ItZGlmZiB7XG4gICAgICBmaWxsOiBub25lO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgIH1cbiAgICAuc2ItZGlmZi1pbnMge1xuICAgICAgc3Ryb2tlLXdpZHRoOiAycHg7XG4gICAgfVxuICAgIC5zYi1kaWZmLWRlbCB7XG4gICAgICBzdHJva2Utd2lkdGg6IDNweDtcbiAgICB9XG4gIGAucmVwbGFjZSgvWyBcXG5dKy8sIFwiIFwiKSxcblxuICBtYWtlSWNvbnMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFNWRy5zZXRQcm9wcyhcbiAgICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIwLjggMy43Yy0uNC0uMi0uOS0uMS0xLjIuMi0yIDEuNi00LjggMS42LTYuOCAwLTIuMy0xLjktNS42LTIuMy04LjMtMXYtLjRjMC0uNi0uNS0xLTEtMXMtMSAuNC0xIDF2MTguOGMwIC41LjUgMSAxIDFoLjFjLjUgMCAxLS41IDEtMXYtNi40YzEtLjcgMi4xLTEuMiAzLjQtMS4zIDEuMiAwIDIuNC40IDMuNCAxLjIgMi45IDIuMyA3IDIuMyA5LjggMCAuMy0uMi40LS41LjQtLjlWNC43YzAtLjUtLjMtLjktLjgtMXptLS4zIDEwLjJDMTggMTYgMTQuNCAxNiAxMS45IDE0Yy0xLjEtLjktMi41LTEuNC00LTEuNC0xLjIuMS0yLjMuNS0zLjQgMS4xVjRjMi41LTEuNCA1LjUtMS4xIDcuNy42IDIuNCAxLjkgNS43IDEuOSA4LjEgMGguMmwuMS4xLS4xIDkuMnpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzQ1OTkzZFwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjAuNiA0LjhsLS4xIDkuMXYuMWMtMi41IDItNi4xIDItOC42IDAtMS4xLS45LTIuNS0xLjQtNC0xLjQtMS4yLjEtMi4zLjUtMy40IDEuMVY0YzIuNS0xLjQgNS41LTEuMSA3LjcuNiAyLjQgMS45IDUuNyAxLjkgOC4xIDBoLjJjMCAuMS4xLjEuMS4yelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjNGNiZjU2XCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwiZ3JlZW5GbGFnXCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpIHRyYW5zbGF0ZSgtMyA0KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMi42OCAxMi4yYTEuNiAxLjYgMCAwIDEtMS4yNy42M2gtNy42OWExLjU5IDEuNTkgMCAwIDEtMS4xNi0yLjU4bDEuMTItMS40MWE0LjgyIDQuODIgMCAwIDAtMy4xNC0uNzcgNC4zMSA0LjMxIDAgMCAwLTIgLjhBNC4yNSA0LjI1IDAgMCAwIDcuMiAxMC42YTUuMDYgNS4wNiAwIDAgMCAuNTQgNC42MkE1LjU4IDUuNTggMCAwIDAgMTIgMTcuNzRhMi4yNiAyLjI2IDAgMCAxLS4xNiA0LjUyQTEwLjI1IDEwLjI1IDAgMCAxIDMuNzQgMThhMTAuMTQgMTAuMTQgMCAwIDEtMS40OS05LjIyIDkuNyA5LjcgMCAwIDEgMi44My00LjE0QTkuOTIgOS45MiAwIDAgMSA5LjY2IDIuNWExMC42NiAxMC42NiAwIDAgMSA3LjcyIDEuNjhsMS4wOC0xLjM1YTEuNTcgMS41NyAwIDAgMSAxLjI0LS42IDEuNiAxLjYgMCAwIDEgMS41NCAxLjIxbDEuNyA3LjM3YTEuNTcgMS41NyAwIDAgMS0uMjYgMS4zOXpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzNkNzljY1wiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjEuMzggMTEuODNoLTcuNjFhLjU5LjU5IDAgMCAxLS40My0xbDEuNzUtMi4xOWE1LjkgNS45IDAgMCAwLTQuNy0xLjU4IDUuMDcgNS4wNyAwIDAgMC00LjExIDMuMTdBNiA2IDAgMCAwIDcgMTUuNzdhNi41MSA2LjUxIDAgMCAwIDUgMi45MiAxLjMxIDEuMzEgMCAwIDEtLjA4IDIuNjIgOS4zIDkuMyAwIDAgMS03LjM1LTMuODIgOS4xNiA5LjE2IDAgMCAxLTEuNC04LjM3QTguNTEgOC41MSAwIDAgMSA1LjcxIDUuNGE4Ljc2IDguNzYgMCAwIDEgNC4xMS0xLjkyIDkuNzEgOS43MSAwIDAgMSA3Ljc1IDIuMDdsMS42Ny0yLjFhLjU5LjU5IDAgMCAxIDEgLjIxTDIyIDExLjA4YS41OS41OSAwIDAgMS0uNjIuNzV6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJ0dXJuUmlnaHRcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSkgdHJhbnNsYXRlKC0yIC01KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMC4zNCAxOC4yMWExMC4yNCAxMC4yNCAwIDAgMS04LjEgNC4yMiAyLjI2IDIuMjYgMCAwIDEtLjE2LTQuNTIgNS41OCA1LjU4IDAgMCAwIDQuMjUtMi41MyA1LjA2IDUuMDYgMCAwIDAgLjU0LTQuNjJBNC4yNSA0LjI1IDAgMCAwIDE1LjU1IDlhNC4zMSA0LjMxIDAgMCAwLTItLjggNC44MiA0LjgyIDAgMCAwLTMuMTUuOGwxLjEyIDEuNDFBMS41OSAxLjU5IDAgMCAxIDEwLjM2IDEzSDIuNjdhMS41NiAxLjU2IDAgMCAxLTEuMjYtLjYzQTEuNTQgMS41NCAwIDAgMSAxLjEzIDExbDEuNzItNy40M0ExLjU5IDEuNTkgMCAwIDEgNC4zOCAyLjRhMS41NyAxLjU3IDAgMCAxIDEuMjQuNkw2LjcgNC4zNWExMC42NiAxMC42NiAwIDAgMSA3LjcyLTEuNjhBOS44OCA5Ljg4IDAgMCAxIDE5IDQuODEgOS42MSA5LjYxIDAgMCAxIDIxLjgzIDlhMTAuMDggMTAuMDggMCAwIDEtMS40OSA5LjIxelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjM2Q3OWNjXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0xOS41NiAxNy42NWE5LjI5IDkuMjkgMCAwIDEtNy4zNSAzLjgzIDEuMzEgMS4zMSAwIDAgMS0uMDgtMi42MiA2LjUzIDYuNTMgMCAwIDAgNS0yLjkyIDYuMDUgNi4wNSAwIDAgMCAuNjctNS41MSA1LjMyIDUuMzIgMCAwIDAtMS42NC0yLjE2IDUuMjEgNS4yMSAwIDAgMC0yLjQ4LTFBNS44NiA1Ljg2IDAgMCAwIDkgOC44NEwxMC43NCAxMWEuNTkuNTkgMCAwIDEtLjQzIDFIMi43YS42LjYgMCAwIDEtLjYtLjc1bDEuNzEtNy40MmEuNTkuNTkgMCAwIDEgMS0uMjFsMS42NyAyLjFhOS43MSA5LjcxIDAgMCAxIDcuNzUtMi4wNyA4Ljg0IDguODQgMCAwIDEgNC4xMiAxLjkyIDguNjggOC42OCAwIDAgMSAyLjU0IDMuNzIgOS4xNCA5LjE0IDAgMCAxLTEuMzMgOC4zNnpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcInR1cm5MZWZ0XCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpIHRyYW5zbGF0ZSgtMiAtNSlcIiwgLy8gVE9ET1xuICAgICAgICB9XG4gICAgICApLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTAgMEw0IDRMMCA4WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiYWRkSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTQgMEw0IDhMMCA0WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiZGVsSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjMuMyAxMWMtLjMuNi0uOSAxLTEuNSAxaC0xLjZjLS4xIDEuMy0uNSAyLjUtMS4xIDMuNi0uOSAxLjctMi4zIDMuMi00LjEgNC4xLTEuNy45LTMuNiAxLjItNS41LjktMS44LS4zLTMuNS0xLjEtNC45LTIuMy0uNy0uNy0uNy0xLjkgMC0yLjYuNi0uNiAxLjYtLjcgMi4zLS4ySDdjLjkuNiAxLjkuOSAyLjkuOXMxLjktLjMgMi43LS45YzEuMS0uOCAxLjgtMi4xIDEuOC0zLjVoLTEuNWMtLjkgMC0xLjctLjctMS43LTEuNyAwLS40LjItLjkuNS0xLjJsNC40LTQuNGMuNy0uNiAxLjctLjYgMi40IDBMMjMgOS4yYy41LjUuNiAxLjIuMyAxLjh6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNjZjhiMTdcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIxLjggMTFoLTIuNmMwIDEuNS0uMyAyLjktMSA0LjItLjggMS42LTIuMSAyLjgtMy43IDMuNi0xLjUuOC0zLjMgMS4xLTQuOS44LTEuNi0uMi0zLjItMS00LjQtMi4xLS40LS4zLS40LS45LS4xLTEuMi4zLS40LjktLjQgMS4yLS4xIDEgLjcgMi4yIDEuMSAzLjQgMS4xczIuMy0uMyAzLjMtMWMuOS0uNiAxLjYtMS41IDItMi42LjMtLjkuNC0xLjguMi0yLjhoLTIuNGMtLjQgMC0uNy0uMy0uNy0uNyAwLS4yLjEtLjMuMi0uNGw0LjQtNC40Yy4zLS4zLjctLjMuOSAwTDIyIDkuOGMuMy4zLjQuNi4zLjlzLS4zLjMtLjUuM3pcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcImxvb3BBcnJvd1wiLFxuICAgICAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgwLjY1KSB0cmFuc2xhdGUoLTE1IC0yNSlcIiwgLy8gVE9ET1xuICAgICAgICB9XG4gICAgICApLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMTIuNzEgMi40NEEyLjQxIDIuNDEgMCAwIDEgMTIgNC4xNkw4LjA4IDguMDhhMi40NSAyLjQ1IDAgMCAxLTMuNDUgMEwuNzIgNC4xNkEyLjQyIDIuNDIgMCAwIDEgMCAyLjQ0IDIuNDggMi40OCAwIDAgMSAuNzEuNzFDMSAuNDcgMS40MyAwIDYuMzYgMHM1LjM5LjQ2IDUuNjQuNzFhMi40NCAyLjQ0IDAgMCAxIC43MSAxLjczelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjMjMxZjIwXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiBcIi4xXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk02LjM2IDcuNzlhMS40MyAxLjQzIDAgMCAxLTEtLjQyTDEuNDIgMy40NWExLjQ0IDEuNDQgMCAwIDEgMC0yYy41Ni0uNTYgOS4zMS0uNTYgOS44NyAwYTEuNDQgMS40NCAwIDAgMSAwIDJMNy4zNyA3LjM3YTEuNDMgMS40MyAwIDAgMS0xLjAxLjQyelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjZmZmXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwid2hpdGVEcm9wZG93bkFycm93XCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpXCIsXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0xMi43MSAyLjQ0QTIuNDEgMi40MSAwIDAgMSAxMiA0LjE2TDguMDggOC4wOGEyLjQ1IDIuNDUgMCAwIDEtMy40NSAwTC43MiA0LjE2QTIuNDIgMi40MiAwIDAgMSAwIDIuNDQgMi40OCAyLjQ4IDAgMCAxIC43MS43MUMxIC40NyAxLjQzIDAgNi4zNiAwczUuMzkuNDYgNS42NC43MWEyLjQ0IDIuNDQgMCAwIDEgLjcxIDEuNzN6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMyMzFmMjBcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiLjFcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTYuMzYgNy43OWExLjQzIDEuNDMgMCAwIDEtMS0uNDJMMS40MiAzLjQ1YTEuNDQgMS40NCAwIDAgMSAwLTJjLjU2LS41NiA5LjMxLS41NiA5Ljg3IDBhMS40NCAxLjQ0IDAgMCAxIDAgMkw3LjM3IDcuMzdhMS40MyAxLjQzIDAgMCAxLTEuMDEuNDJ6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJibGFja0Ryb3Bkb3duQXJyb3dcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIixcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICAgIFNWRy5zZXRQcm9wcyhcbiAgICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTI4LjQ1NiAyMS42NzVjLS4wMDktLjMxMi0uMDg3LS44MjUtLjI1Ni0xLjcwMi0uMDk2LS40OTUtLjYxMi0zLjAyMi0uNzUzLTMuNzMtLjM5NS0xLjk4LS43Ni0zLjkyLTEuMTQyLTYuMTEzLS43MzItNC4yMjMtLjY5My02LjA1LjM0NC02LjUyNy41MDItLjIzIDEuMDYtLjA4MSAxLjg0Mi4zNS40MTMuMjI3IDIuMTgxIDEuMzY1IDIuMDcgMS4yOTYgMS45OTMgMS4yNDMgMy40NjMgMS43NzUgNC45MjggMS41NDkgMS41MjctLjIzNyAyLjUwNS0uMDYgMi44NzcuNjE4LjM0OC42MzUuMDE1IDEuNDE2LS43MjkgMi4xOC0xLjQ3MyAxLjUxNi0zLjk3NiAyLjUxNC01Ljg0OSAyLjAyMy0uODIyLS4yMTgtMS4yMzgtLjQ2NC0yLjM4LTEuMjY2YTkuNzM3IDkuNzM3IDAgMCAwLS4wOTUtLjA2NmMuMDQ3LjU5My4yNjQgMS43NC43MTcgMy44MDMuMjk0IDEuMzM2IDIuMDc5IDkuMTg3IDIuNjM3IDExLjY3NGwuMDAyLjAxMmMuNTI5IDIuNjM3LTEuODcyIDQuNzI0LTUuMjM1IDQuNzI0LTMuMjkgMC02LjM2My0xLjk4OC02Ljg2Mi00LjUyOC0uNTMtMi42NCAxLjg3My00LjczNCA1LjIzMy00LjczNGE4LjQxMSA4LjQxMSAwIDAgMSAyLjY1LjQzN3pNMTEuNDYgMjcuNjY2Yy0uMDEtLjMxOS0uMDkxLS44NC0uMjY2LTEuNzM4LS4wOS0uNDYtLjU5NS0yLjkzNy0uNzUzLTMuNzI3LS4zOS0xLjk2LS43NTItMy44OTItMS4xMzEtNi4wNy0uNzMyLTQuMjI0LS42OTItNi4wNTIuMzQ0LTYuNTI3LjUwMi0uMjMgMS4wNi0uMDgyIDEuODQxLjM0OS40MTQuMjI4IDIuMTgxIDEuMzY1IDIuMDcgMS4yOTYgMS45OTIgMS4yNDMgMy40NjEgMS43NzUgNC45MjUgMS41NDkgMS41MjUtLjI0IDIuNTA0LS4wNjQgMi44NzYuNjE0LjM0OC42MzUuMDE1IDEuNDE1LS43MjggMi4xOC0xLjQ3NCAxLjUxNy0zLjk3NyAyLjUxMy01Ljg0NyAyLjAxNy0uODIyLS4yMTgtMS4yMzctLjQ2My0yLjM4LTEuMjY2YTkuNzI5IDkuNzI5IDAgMCAwLS4wOTQtLjA2NWMuMDQ3LjU5My4yNjQgMS43NC43MTcgMy44MDIuMjk0IDEuMzM3IDIuMDc4IDkuMTkgMi42MzYgMTEuNjc1bC4wMDMuMDEzYy41MTcgMi42MzgtMS44ODQgNC43MzItNS4yMzQgNC43MzItMy4yODYgMC02LjM1OS0xLjk5My02Ljg3LTQuNTQtLjUxOC0yLjYzOSAxLjg4NS00LjczIDUuMjQyLTQuNzMuOTA0IDAgMS44MDIuMTUgMi42NS40MzZ6XCIsXG4gICAgICAgICAgICBzdHJva2U6IFwiIzAwMFwiLFxuICAgICAgICAgICAgXCJzdHJva2Utb3BhY2l0eVwiOiBcIi4xXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0zMi4xOCAyNS44NzRDMzIuNjM2IDI4LjE1NyAzMC41MTIgMzAgMjcuNDMzIDMwYy0zLjA3IDAtNS45MjMtMS44NDMtNi4zNzItNC4xMjYtLjQ1OC0yLjI4NSAxLjY2NS00LjEzNiA0Ljc0My00LjEzNi42NDcgMCAxLjI4My4wODQgMS44OS4yMzRhNyA3IDAgMCAxIC45MzguMzAyYy44Ny0uMDItLjEwNC0yLjI5NC0xLjgzNS0xMi4yMjktMi4xMzQtMTIuMzAzIDMuMDYtMS44NyA4Ljc2OC0yLjc1MyA1LjcwOC0uODg1LjA3NiA0LjgyLTMuNjUgMy44NDQtMy43MjQtLjk4Ny00LjY1LTcuMTUzLjI2MyAxNC43Mzh6bS0xNi45OTggNS45OUMxNS42MyAzNC4xNDggMTMuNTA3IDM2IDEwLjQzOSAzNmMtMy4wNjggMC01LjkyLTEuODUyLTYuMzc5LTQuMTM2LS40NDgtMi4yODQgMS42NzQtNC4xMzUgNC43NTEtNC4xMzUgMS4wMDIgMCAxLjk3NC4xOTcgMi44NTQuNTQ0LjgyMi0uMDU1LS4xNS0yLjM3Ny0xLjg2Mi0xMi4yMjgtMi4xMzMtMTIuMzAzIDMuMDU5LTEuODcgOC43NjQtMi43NTMgNS43MDYtLjg5NC4wNzYgNC44MjEtMy42NDggMy44MzQtMy43MjMtLjk4Ny00LjY0OC03LjE1Mi4yNjMgMTQuNzM4elwiLFxuICAgICAgICAgICAgZmlsbDogXCIjRkZGXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwibXVzaWNcIixcbiAgICAgICAgICBmaWxsOiBcIm5vbmVcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIlxuICAgICAgICB9XG4gICAgICApLFxuXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk04Ljc1MyAzNC42MDJsLTQuMjUxIDEuNzc5IDEuNzg0LTQuMjM2YzEuMjE4LTIuODkyIDIuOTA3LTUuNDIzIDUuMDMtNy41MzhMMzEuMDY2IDQuOTNjLjg0Ni0uODQyIDIuNjUtLjQxIDQuMDMyLjk2NyAxLjM4IDEuMzc1IDEuODE2IDMuMTczLjk3IDQuMDE1TDE2LjMxOCAyOS41OWMtMi4xMjMgMi4xMTYtNC42NjQgMy43OTktNy41NjUgNS4wMTJcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI0ZGRlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjkuNDEgNi4xMTFzLTQuNDUtMi4zNzktOC4yMDIgNS43NzFjLTEuNzM0IDMuNzY2LTQuMzUgMS41NDYtNC4zNSAxLjU0NlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMzYuNDIgOC44MjVjMCAuNDYzLS4xNC44NzMtLjQzMiAxLjE2NGwtOS4zMzUgOS4zMDFjLjI4Mi0uMjkuNDEtLjY2OC40MS0xLjEyIDAtLjg3NC0uNTA3LTEuOTYzLTEuNDA2LTIuODY4LTEuMzYyLTEuMzU4LTMuMTQ3LTEuOC00LjAwMi0uOTlMMzAuOTkgNS4wMWMuODQ0LS44NCAyLjY1LS40MSA0LjAzNS45Ni44OTguOTA0IDEuMzk2IDEuOTgyIDEuMzk2IDIuODU1TTEwLjUxNSAzMy43NzRhMjMuNzQgMjMuNzQgMCAwIDEtMS43NjQuODNMNC41IDM2LjM4MmwxLjc4Ni00LjIzNWMuMjU4LS42MDQuNTI5LTEuMTg2LjgzMy0xLjc1Ny42OS4xODMgMS40NDkuNjI1IDIuMTA5IDEuMjgyLjY1OS42NTggMS4xMDIgMS40MTIgMS4yODcgMi4xMDJcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzRDOTdGRlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMzYuNDk4IDguNzQ4YzAgLjQ2NC0uMTQxLjg3NC0uNDMzIDEuMTY1bC0xOS43NDIgMTkuNjhjLTIuMTMxIDIuMTExLTQuNjczIDMuNzkzLTcuNTcyIDUuMDFMNC41IDM2LjM4MWwuOTc0LTIuMzE3IDEuOTI1LS44MDhjMi44OTktMS4yMTggNS40NDEtMi44OTkgNy41NzItNS4wMWwxOS43NDItMTkuNjhjLjI5Mi0uMjkyLjQzMi0uNzAyLjQzMi0xLjE2NSAwLS42NDctLjI3LTEuNC0uNzc5LTIuMTIzLjI0OS4xNzIuNDk4LjM3Ny43MzYuNjE0Ljg5OC45MDUgMS4zOTYgMS45ODMgMS4zOTYgMi44NTZcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzU3NUU3NVwiLFxuICAgICAgICAgICAgb3BhY2l0eTogXCIuMTVcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6IFwiTTE4LjQ1IDEyLjgzMWEuOTA0LjkwNCAwIDEgMS0xLjgwNyAwIC45MDQuOTA0IDAgMCAxIDEuODA3IDB6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiM1NzVFNzVcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJwZW5cIixcbiAgICAgICAgICBzdHJva2U6IFwiIzU3NUU3NVwiLFxuICAgICAgICAgIGZpbGw6IFwibm9uZVwiLFxuICAgICAgICAgIFwic3Ryb2tlLWxpbmVqb2luXCI6IFwicm91bmRcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIlxuICAgICAgICB9XG4gICAgICApLFxuXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwiY2lyY2xlXCIsIHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuMjUsXG4gICAgICAgICAgICBjeDogMzIsXG4gICAgICAgICAgICBjeTogMTYsXG4gICAgICAgICAgICByOiA0LjUsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwiY2lyY2xlXCIsIHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuNSxcbiAgICAgICAgICAgIGN4OiAzMixcbiAgICAgICAgICAgIGN5OiAxMixcbiAgICAgICAgICAgIHI6IDQuNSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJjaXJjbGVcIiwge1xuICAgICAgICAgICAgb3BhY2l0eTogMC43NSxcbiAgICAgICAgICAgIGN4OiAzMixcbiAgICAgICAgICAgIGN5OiA4LFxuICAgICAgICAgICAgcjogNC41LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcImNpcmNsZVwiLCB7XG4gICAgICAgICAgICBjeDogMzIsXG4gICAgICAgICAgICBjeTogNCxcbiAgICAgICAgICAgIHI6IDQuNSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIyLjY3MiA0LjQybC02LjE3MiA0VjYuMWMwLTIuMDEtMS41NjMtMy42LTMuNS0zLjZINC4xQzIuMDc2IDIuNS41IDQuMDc2LjUgNi4xVjE0YzAgMS45MjcgMS41ODQgMy41MTIgMy42IDMuNkgxM2MxLjkwMiAwIDMuNS0xLjY1MyAzLjUtMy42di0yLjI4M2w2LjI1NyAzLjc1NC4wOTcuMDc1Yy4wMi4wMi4wOTguMDU0LjE0Ni4wNTQuMjY3IDAgLjUtLjIxNy41LS41VjQuOGMwIC4wMzctLjA1Ni0uMDk0LS4xMjktLjI0My0uMTQ1LS4yNDItLjQzLS4yOTktLjctLjEzN3pcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzRENEQ0RFwiLFxuICAgICAgICAgICAgXCJzdHJva2UtbGluZWpvaW5cIjogXCJyb3VuZFwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcInZpZGVvXCIsXG4gICAgICAgICAgc3Ryb2tlOiBcIiMwMDBcIixcbiAgICAgICAgICBmaWxsOiBcIiNGRkZcIixcbiAgICAgICAgICBcInN0cm9rZS1vcGFjaXR5XCI6IDAuMTUsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpXCJcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICBdXG4gIH0sXG5cbiAgbWFrZVN0eWxlKCkge1xuICAgIHZhciBzdHlsZSA9IFNWRy5lbChcInN0eWxlXCIpXG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoU1ZHLmNkYXRhKFN0eWxlLmNzc0NvbnRlbnQpKVxuICAgIHJldHVybiBzdHlsZVxuICB9LFxuXG4gIGJldmVsRmlsdGVyKGlkLCBpbnNldCkge1xuICAgIHZhciBmID0gbmV3IEZpbHRlcihpZClcblxuICAgIHZhciBhbHBoYSA9IFwiU291cmNlQWxwaGFcIlxuICAgIHZhciBzID0gaW5zZXQgPyAtMSA6IDFcbiAgICB2YXIgYmx1ciA9IGYuYmx1cigxLCBhbHBoYSlcblxuICAgIGYubWVyZ2UoW1xuICAgICAgXCJTb3VyY2VHcmFwaGljXCIsXG4gICAgICBmLmNvbXAoXG4gICAgICAgIFwiaW5cIixcbiAgICAgICAgZi5mbG9vZChcIiNmZmZcIiwgMC4xNSksXG4gICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KCtzLCArcywgYmx1cikpXG4gICAgICApLFxuICAgICAgZi5jb21wKFxuICAgICAgICBcImluXCIsXG4gICAgICAgIGYuZmxvb2QoXCIjMGYwXCIsIDAuNyksXG4gICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KC1zLCAtcywgYmx1cikpXG4gICAgICApLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRhcmtGaWx0ZXIoaWQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpXG5cbiAgICBmLm1lcmdlKFtcbiAgICAgIFwiU291cmNlR3JhcGhpY1wiLFxuICAgICAgZi5jb21wKFwiaW5cIiwgZi5mbG9vZChcIiMwMDBcIiwgMC4yKSwgXCJTb3VyY2VBbHBoYVwiKSxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkZXNhdHVyYXRlRmlsdGVyKGlkKSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKVxuXG4gICAgdmFyIHEgPSAwLjMzM1xuICAgIHZhciBzID0gMC4zMzNcbiAgICBmLmNvbG9yTWF0cml4KFwiU291cmNlR3JhcGhpY1wiLCBbXG4gICAgICBxLFxuICAgICAgcyxcbiAgICAgIHMsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHMsXG4gICAgICBxLFxuICAgICAgcyxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgcyxcbiAgICAgIHMsXG4gICAgICBxLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAxLFxuICAgICAgMCxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkYXJrUmVjdCh3LCBoLCBjYXRlZ29yeSwgZWwpIHtcbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKFxuICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgICAgY2xhc3M6IFtcInNiLVwiICsgY2F0ZWdvcnksIFwic2ItZGFya2VyXCJdLmpvaW4oXCIgXCIpLFxuICAgICAgICB9KSxcbiAgICAgIF0pLFxuICAgICAgeyB3aWR0aDogdywgaGVpZ2h0OiBoIH1cbiAgICApXG4gIH0sXG5cbiAgZGVmYXVsdEZvbnRGYW1pbHk6IFwiJ0hlbHZldGljYSBOZXVlJywgSGVsdmV0aWNhLCBzYW5zLXNlcmlmXCIsXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykge1xuICAgIHJldHVybiBvICYmIG8uY29uc3RydWN0b3IgPT09IEFycmF5XG4gIH1cbiAgZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxuICB9XG5cbiAgdmFyIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgR2xvdyxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH0gPSByZXF1aXJlKFwiLi9tb2RlbC5qc1wiKVxuXG4gIHZhciB7XG4gICAgYWxsTGFuZ3VhZ2VzLFxuICAgIGxvb2t1cERyb3Bkb3duLFxuICAgIGhleENvbG9yUGF0LFxuICAgIG1pbmlmeUhhc2gsXG4gICAgbG9va3VwSGFzaCxcbiAgICBoYXNoU3BlYyxcbiAgICBhcHBseU92ZXJyaWRlcyxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgaWNvblBhdCxcbiAgICBibG9ja05hbWUsXG4gIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICBmdW5jdGlvbiBwYWludEJsb2NrKGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpIHtcbiAgICB2YXIgb3ZlcnJpZGVzID0gW11cbiAgICBpZiAoaXNBcnJheShjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSkpIHtcbiAgICAgIG92ZXJyaWRlcyA9IGNoaWxkcmVuLnBvcCgpXG4gICAgfVxuXG4gICAgLy8gYnVpbGQgaGFzaFxuICAgIHZhciB3b3JkcyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgIGlmIChjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgIHdvcmRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzSWNvbikge1xuICAgICAgICB3b3Jkcy5wdXNoKFwiQFwiICsgY2hpbGQubmFtZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmRzLnB1c2goXCJfXCIpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBoYXNoID0gKGluZm8uaGFzaCA9IG1pbmlmeUhhc2god29yZHMuam9pbihcIiBcIikpKVxuXG4gICAgLy8gcGFpbnRcbiAgICB2YXIgbyA9IGxvb2t1cEhhc2goaGFzaCwgaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcylcbiAgICBpZiAobykge1xuICAgICAgdmFyIGxhbmcgPSBvLmxhbmdcbiAgICAgIHZhciB0eXBlID0gby50eXBlXG4gICAgICBpbmZvLmxhbmd1YWdlID0gbGFuZ1xuICAgICAgaW5mby5pc1JUTCA9IHJ0bExhbmd1YWdlcy5pbmRleE9mKGxhbmcuY29kZSkgPiAtMVxuXG4gICAgICBpZiAoXG4gICAgICAgIHR5cGUuc2hhcGUgPT09IFwicmluZ1wiXG4gICAgICAgICAgPyBpbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgICA6IGluZm8uc2hhcGUgPT09IFwic3RhY2tcIlxuICAgICAgKSB7XG4gICAgICAgIGluZm8uc2hhcGUgPSB0eXBlLnNoYXBlXG4gICAgICB9XG4gICAgICBpbmZvLmNhdGVnb3J5ID0gdHlwZS5jYXRlZ29yeVxuICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICBpZiAodHlwZS5zZWxlY3RvcikgaW5mby5zZWxlY3RvciA9IHR5cGUuc2VsZWN0b3IgLy8gZm9yIHRvSlNPTlxuICAgICAgaW5mby5oYXNMb29wQXJyb3cgPSB0eXBlLmhhc0xvb3BBcnJvd1xuXG4gICAgICAvLyBlbGxpcHNpcyBibG9ja1xuICAgICAgaWYgKHR5cGUuc3BlYyA9PT0gXCIuIC4gLlwiKSB7XG4gICAgICAgIGNoaWxkcmVuID0gW25ldyBMYWJlbChcIi4gLiAuXCIpXVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG92ZXJyaWRlc1xuICAgIGFwcGx5T3ZlcnJpZGVzKGluZm8sIG92ZXJyaWRlcylcblxuICAgIC8vIGxvb3AgYXJyb3dzXG4gICAgaWYgKGluZm8uaGFzTG9vcEFycm93KSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBJY29uKFwibG9vcEFycm93XCIpKVxuICAgIH1cblxuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayhpbmZvLCBjaGlsZHJlbilcblxuICAgIC8vIGltYWdlIHJlcGxhY2VtZW50XG4gICAgaWYgKHR5cGUgJiYgaWNvblBhdC50ZXN0KHR5cGUuc3BlYykpIHtcbiAgICAgIGJsb2NrLnRyYW5zbGF0ZShsYW5nLCB0cnVlKVxuICAgIH1cblxuICAgIC8vIGRpZmZzXG4gICAgaWYgKGluZm8uZGlmZiA9PT0gXCIrXCIpIHtcbiAgICAgIHJldHVybiBuZXcgR2xvdyhibG9jaylcbiAgICB9IGVsc2Uge1xuICAgICAgYmxvY2suZGlmZiA9IGluZm8uZGlmZlxuICAgIH1cbiAgICByZXR1cm4gYmxvY2tcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlTGluZXMoY29kZSwgbGFuZ3VhZ2VzKSB7XG4gICAgdmFyIHRvayA9IGNvZGVbMF1cbiAgICB2YXIgaW5kZXggPSAwXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIHRvayA9IGNvZGVbKytpbmRleF1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgIHJldHVybiBjb2RlW2luZGV4ICsgMV1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGVla05vbldzKCkge1xuICAgICAgZm9yICh2YXIgaSA9IGluZGV4ICsgMTsgaSA8IGNvZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNvZGVbaV0gIT09IFwiIFwiKSByZXR1cm4gY29kZVtpXVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2F3TkxcblxuICAgIHZhciBkZWZpbmUgPSBbXVxuICAgIGxhbmd1YWdlcy5tYXAoZnVuY3Rpb24obGFuZykge1xuICAgICAgZGVmaW5lID0gZGVmaW5lLmNvbmNhdChsYW5nLmRlZmluZSlcbiAgICB9KVxuICAgIC8vIE5CLiB3ZSBhc3N1bWUgJ2RlZmluZScgaXMgYSBzaW5nbGUgd29yZCBpbiBldmVyeSBsYW5ndWFnZVxuICAgIGZ1bmN0aW9uIGlzRGVmaW5lKHdvcmQpIHtcbiAgICAgIHJldHVybiBkZWZpbmUuaW5kZXhPZih3b3JkKSA+IC0xXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUJsb2NrKHNoYXBlLCBjaGlsZHJlbikge1xuICAgICAgdmFyIGhhc0lucHV0cyA9ICEhY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4LmlzTGFiZWxcbiAgICAgIH0pLmxlbmd0aFxuICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgIHNoYXBlOiBzaGFwZSxcbiAgICAgICAgY2F0ZWdvcnk6XG4gICAgICAgICAgc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgICAgICAgICA/IFwiY3VzdG9tXCJcbiAgICAgICAgICAgIDogc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiAhaGFzSW5wdXRzID8gXCJ2YXJpYWJsZXNcIiA6IFwib2Jzb2xldGVcIixcbiAgICAgICAgY2F0ZWdvcnlJc0RlZmF1bHQ6IHRydWUsXG4gICAgICAgIGhhc0xvb3BBcnJvdzogZmFsc2UsXG4gICAgICB9XG4gICAgICByZXR1cm4gcGFpbnRCbG9jayhpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VNZW51KHNoYXBlLCB2YWx1ZSkge1xuICAgICAgdmFyIG1lbnUgPSBsb29rdXBEcm9wZG93bih2YWx1ZSwgbGFuZ3VhZ2VzKSB8fCB2YWx1ZVxuICAgICAgcmV0dXJuIG5ldyBJbnB1dChzaGFwZSwgdmFsdWUsIG1lbnUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFBhcnRzKGVuZCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgIHZhciBsYWJlbFxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCI8XCIgfHwgKHRvayA9PT0gXCI+XCIgJiYgZW5kID09PSBcIj5cIikpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgICAgICAgdmFyIGMgPSBwZWVrTm9uV3MoKVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGxhc3QgJiZcbiAgICAgICAgICAgICFsYXN0LmlzTGFiZWwgJiZcbiAgICAgICAgICAgIChjID09PSBcIltcIiB8fCBjID09PSBcIihcIiB8fCBjID09PSBcIjxcIiB8fCBjID09PSBcIntcIilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwodG9rKSlcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBicmVha1xuICAgICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiICYmICFlbmQpIGJyZWFrXG5cbiAgICAgICAgc3dpdGNoICh0b2spIHtcbiAgICAgICAgICBjYXNlIFwiW1wiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBTdHJpbmcoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwUmVwb3J0ZXIoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwUHJlZGljYXRlKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocEVtYmVkZGVkKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCIgXCI6XG4gICAgICAgICAgY2FzZSBcIlxcdFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBpZiAobGFiZWwgJiYgaXNEZWZpbmUobGFiZWwudmFsdWUpKSB7XG4gICAgICAgICAgICAgIC8vIGRlZmluZSBoYXRcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3V0bGluZSgpKVxuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwi4peCXCI6XG4gICAgICAgICAgY2FzZSBcIuKWuFwiOlxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwSWNvbigpKVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJAXCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIHZhciBuYW1lID0gXCJcIlxuICAgICAgICAgICAgd2hpbGUgKHRvayAmJiAvW2EtekEtWl0vLnRlc3QodG9rKSkge1xuICAgICAgICAgICAgICBuYW1lICs9IHRva1xuICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcImNsb3VkXCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwoXCLimIFcIikpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgICAgICAgIEljb24uaWNvbnMuaGFzT3duUHJvcGVydHkobmFtZSlcbiAgICAgICAgICAgICAgICAgID8gbmV3IEljb24obmFtZSlcbiAgICAgICAgICAgICAgICAgIDogbmV3IExhYmVsKFwiQFwiICsgbmFtZSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgICAgICBuZXh0KCkgLy8gZXNjYXBlIGNoYXJhY3RlclxuICAgICAgICAgIC8vIGZhbGwtdGhydVxuICAgICAgICAgIGNhc2UgXCI6XCI6XG4gICAgICAgICAgICBpZiAodG9rID09PSBcIjpcIiAmJiBwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE92ZXJyaWRlcyhlbmQpKVxuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICAgICAgICAgIH0gLy8gZmFsbC10aHJ1XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICghbGFiZWwpIGNoaWxkcmVuLnB1c2goKGxhYmVsID0gbmV3IExhYmVsKFwiXCIpKSlcbiAgICAgICAgICAgIGxhYmVsLnZhbHVlICs9IHRva1xuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGlsZHJlblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBTdHJpbmcoKSB7XG4gICAgICBuZXh0KCkgLy8gJ1snXG4gICAgICB2YXIgcyA9IFwiXCJcbiAgICAgIHZhciBlc2NhcGVWID0gZmFsc2VcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIl1cIiAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBpZiAodG9rID09PSBcInZcIikgZXNjYXBlViA9IHRydWVcbiAgICAgICAgICBpZiAoIXRvaykgYnJlYWtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlc2NhcGVWID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBzICs9IHRva1xuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIGlmICh0b2sgPT09IFwiXVwiKSBuZXh0KClcbiAgICAgIGlmIChoZXhDb2xvclBhdC50ZXN0KHMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJjb2xvclwiLCBzKVxuICAgICAgfVxuICAgICAgcmV0dXJuICFlc2NhcGVWICYmIC8gdiQvLnRlc3QocylcbiAgICAgICAgPyBtYWtlTWVudShcImRyb3Bkb3duXCIsIHMuc2xpY2UoMCwgcy5sZW5ndGggLSAyKSlcbiAgICAgICAgOiBuZXcgSW5wdXQoXCJzdHJpbmdcIiwgcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwQmxvY2soZW5kKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoZW5kKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgc2F3TkwgPSB0cnVlXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgICAgIC8vIGRlZmluZSBoYXRzXG4gICAgICB2YXIgZmlyc3QgPSBjaGlsZHJlblswXVxuICAgICAgaWYgKGZpcnN0ICYmIGZpcnN0LmlzTGFiZWwgJiYgaXNEZWZpbmUoZmlyc3QudmFsdWUpKSB7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaChtYWtlQmxvY2soXCJvdXRsaW5lXCIsIFtdKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUJsb2NrKFwiZGVmaW5lLWhhdFwiLCBjaGlsZHJlbilcbiAgICAgIH1cblxuICAgICAgLy8gc3RhbmRhbG9uZSByZXBvcnRlcnNcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGNoaWxkLmlzQmxvY2sgJiZcbiAgICAgICAgICAoY2hpbGQuaXNSZXBvcnRlciB8fCBjaGlsZC5pc0Jvb2xlYW4gfHwgY2hpbGQuaXNSaW5nKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gY2hpbGRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwic3RhY2tcIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFJlcG9ydGVyKCkge1xuICAgICAgbmV4dCgpIC8vICcoJ1xuXG4gICAgICAvLyBlbXB0eSBudW1iZXItZHJvcGRvd25cbiAgICAgIGlmICh0b2sgPT09IFwiIFwiKSB7XG4gICAgICAgIG5leHQoKVxuICAgICAgICBpZiAodG9rID09PSBcInZ2XCIgJiYgcGVlaygpID09PSBcIilcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJudW1iZXItZHJvcGRvd25cIiwgXCJcIilcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rID09PSBcInZcIiAmJiBwZWVrKCkgPT09IFwiKVwiKSB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcInJvdW5kLWRyb3Bkb3duXCIsIFwiXCIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKFwiKVwiKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiKVwiKSBuZXh0KClcblxuICAgICAgLy8gZW1wdHkgbnVtYmVyc1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0KFwibnVtYmVyXCIsIFwiXCIpXG4gICAgICB9XG5cbiAgICAgIC8vIG51bWJlclxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBjaGlsZHJlblswXS5pc0xhYmVsKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGNoaWxkcmVuWzBdLnZhbHVlXG4gICAgICAgIGlmICgvXlswLTllLi1dKiQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcIm51bWJlclwiLCB2YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBudW1iZXItZHJvcGRvd25cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFjaGlsZHJlbltpXS5pc0xhYmVsKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGkgPT09IGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2kgLSAxXVxuICAgICAgICBpZiAoaSA+IDEgJiYgbGFzdC52YWx1ZSA9PT0gXCJ2dlwiKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucG9wKClcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjaGlsZHJlblxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbihsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBsLnZhbHVlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oXCIgXCIpXG4gICAgICAgICAgcmV0dXJuIG1ha2VNZW51KFwibnVtYmVyLWRyb3Bkb3duXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChpID4gMSAmJiBsYXN0LnZhbHVlID09PSBcInZcIikge1xuICAgICAgICAgIGNoaWxkcmVuLnBvcCgpXG4gICAgICAgICAgdmFyIHZhbHVlID0gY2hpbGRyZW5cbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24obCkge1xuICAgICAgICAgICAgICByZXR1cm4gbC52YWx1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKFwiIFwiKVxuICAgICAgICAgIHJldHVybiBtYWtlTWVudShcInJvdW5kLWRyb3Bkb3duXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBibG9jayA9IG1ha2VCbG9jayhcInJlcG9ydGVyXCIsIGNoaWxkcmVuKVxuXG4gICAgICAvLyByaW5nc1xuICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09IFwicmluZ1wiKSB7XG4gICAgICAgIHZhciBmaXJzdCA9IGJsb2NrLmNoaWxkcmVuWzBdXG4gICAgICAgIGlmIChcbiAgICAgICAgICBmaXJzdCAmJlxuICAgICAgICAgIGZpcnN0LmlzSW5wdXQgJiZcbiAgICAgICAgICBmaXJzdC5zaGFwZSA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgIGZpcnN0LnZhbHVlID09PSBcIlwiXG4gICAgICAgICkge1xuICAgICAgICAgIGJsb2NrLmNoaWxkcmVuWzBdID0gbmV3IElucHV0KFwicmVwb3J0ZXJcIilcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAoZmlyc3QgJiYgZmlyc3QuaXNTY3JpcHQgJiYgZmlyc3QuaXNFbXB0eSkgfHxcbiAgICAgICAgICAoZmlyc3QgJiYgZmlyc3QuaXNCbG9jayAmJiAhZmlyc3QuY2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICApIHtcbiAgICAgICAgICBibG9jay5jaGlsZHJlblswXSA9IG5ldyBJbnB1dChcInN0YWNrXCIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJsb2NrXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFByZWRpY2F0ZSgpIHtcbiAgICAgIG5leHQoKSAvLyAnPCdcbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhcIj5cIilcbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSBcIj5cIikgbmV4dCgpXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJib29sZWFuXCIpXG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwiYm9vbGVhblwiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwRW1iZWRkZWQoKSB7XG4gICAgICBuZXh0KCkgLy8gJ3snXG5cbiAgICAgIHNhd05MID0gZmFsc2VcbiAgICAgIHZhciBmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIn1cIikge1xuICAgICAgICAgIHZhciBibG9jayA9IHBCbG9jayhcIn1cIilcbiAgICAgICAgICBpZiAoYmxvY2spIHJldHVybiBibG9ja1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgc2NyaXB0cyA9IHBhcnNlU2NyaXB0cyhmKVxuICAgICAgdmFyIGJsb2NrcyA9IFtdXG4gICAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIGJsb2NrcyA9IGJsb2Nrcy5jb25jYXQoc2NyaXB0LmJsb2NrcylcbiAgICAgIH0pXG5cbiAgICAgIGlmICh0b2sgPT09IFwifVwiKSBuZXh0KClcbiAgICAgIGlmICghc2F3TkwpIHtcbiAgICAgICAgYXNzZXJ0KGJsb2Nrcy5sZW5ndGggPD0gMSlcbiAgICAgICAgcmV0dXJuIGJsb2Nrcy5sZW5ndGggPyBibG9ja3NbMF0gOiBtYWtlQmxvY2soXCJzdGFja1wiLCBbXSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2NyaXB0KGJsb2NrcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwSWNvbigpIHtcbiAgICAgIHZhciBjID0gdG9rXG4gICAgICBuZXh0KClcbiAgICAgIHN3aXRjaCAoYykge1xuICAgICAgICBjYXNlIFwi4pa4XCI6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJY29uKFwiYWRkSW5wdXRcIilcbiAgICAgICAgY2FzZSBcIuKXglwiOlxuICAgICAgICAgIHJldHVybiBuZXcgSWNvbihcImRlbElucHV0XCIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE92ZXJyaWRlcyhlbmQpIHtcbiAgICAgIG5leHQoKVxuICAgICAgbmV4dCgpXG4gICAgICB2YXIgb3ZlcnJpZGVzID0gW11cbiAgICAgIHZhciBvdmVycmlkZSA9IFwiXCJcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiIFwiKSB7XG4gICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgICBvdmVycmlkZXMucHVzaChvdmVycmlkZSlcbiAgICAgICAgICAgIG92ZXJyaWRlID0gXCJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG92ZXJyaWRlICs9IHRva1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKG92ZXJyaWRlKSBvdmVycmlkZXMucHVzaChvdmVycmlkZSlcbiAgICAgIHJldHVybiBvdmVycmlkZXNcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwQ29tbWVudChlbmQpIHtcbiAgICAgIG5leHQoKVxuICAgICAgbmV4dCgpXG4gICAgICB2YXIgY29tbWVudCA9IFwiXCJcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGNvbW1lbnQgKz0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiXFxuXCIpIG5leHQoKVxuICAgICAgcmV0dXJuIG5ldyBDb21tZW50KGNvbW1lbnQsIHRydWUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE91dGxpbmUoKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgZnVuY3Rpb24gcGFyc2VBcmcoa2luZCwgZW5kKSB7XG4gICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICBuZXh0KClcbiAgICAgICAgdmFyIHBhcnRzID0gcFBhcnRzKGVuZClcbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBuZXh0KClcbiAgICAgICAgY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICBwYWludEJsb2NrKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzaGFwZToga2luZCA9PT0gXCJib29sZWFuXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIixcbiAgICAgICAgICAgICAgYXJndW1lbnQ6IGtpbmQsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJ0cyxcbiAgICAgICAgICAgIGxhbmd1YWdlc1xuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgdmFyIGxhYmVsXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHRvaykge1xuICAgICAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgICAgICBwYXJzZUFyZyhcIm51bWJlclwiLCBcIilcIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIltcIjpcbiAgICAgICAgICAgIHBhcnNlQXJnKFwic3RyaW5nXCIsIFwiXVwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgcGFyc2VBcmcoXCJib29sZWFuXCIsIFwiPlwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiIFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIC8vIGZhbGwtdGhydVxuICAgICAgICAgIGNhc2UgXCI6XCI6XG4gICAgICAgICAgICBpZiAodG9rID09PSBcIjpcIiAmJiBwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE92ZXJyaWRlcygpKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSAvLyBmYWxsLXRocnVcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCFsYWJlbCkgY2hpbGRyZW4ucHVzaCgobGFiZWwgPSBuZXcgTGFiZWwoXCJcIikpKVxuICAgICAgICAgICAgbGFiZWwudmFsdWUgKz0gdG9rXG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VCbG9jayhcIm91dGxpbmVcIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcExpbmUoKSB7XG4gICAgICB2YXIgZGlmZlxuICAgICAgaWYgKHRvayA9PT0gXCIrXCIgfHwgdG9rID09PSBcIi1cIikge1xuICAgICAgICBkaWZmID0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgdmFyIGJsb2NrID0gcEJsb2NrKClcbiAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSBwQ29tbWVudCgpXG4gICAgICAgIGNvbW1lbnQuaGFzQmxvY2sgPSBibG9jayAmJiBibG9jay5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgaWYgKCFjb21tZW50Lmhhc0Jsb2NrKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1lbnRcbiAgICAgICAgfVxuICAgICAgICBibG9jay5jb21tZW50ID0gY29tbWVudFxuICAgICAgfVxuICAgICAgaWYgKGJsb2NrKSBibG9jay5kaWZmID0gZGlmZlxuICAgICAgcmV0dXJuIGJsb2NrXG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0b2spIHJldHVybiB1bmRlZmluZWRcbiAgICAgIHZhciBsaW5lID0gcExpbmUoKVxuICAgICAgcmV0dXJuIGxpbmUgfHwgXCJOTFwiXG4gICAgfVxuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIHBhcnNlU2NyaXB0cyhnZXRMaW5lKSB7XG4gICAgdmFyIGxpbmUgPSBnZXRMaW5lKClcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgbGluZSA9IGdldExpbmUoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBGaWxlKCkge1xuICAgICAgd2hpbGUgKGxpbmUgPT09IFwiTkxcIikgbmV4dCgpXG4gICAgICB2YXIgc2NyaXB0cyA9IFtdXG4gICAgICB3aGlsZSAobGluZSkge1xuICAgICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgICAgd2hpbGUgKGxpbmUgJiYgbGluZSAhPT0gXCJOTFwiKSB7XG4gICAgICAgICAgdmFyIGIgPSBwTGluZSgpXG4gICAgICAgICAgdmFyIGlzR2xvdyA9IGIuZGlmZiA9PT0gXCIrXCJcbiAgICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgICBiLmRpZmYgPSBudWxsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGIuaXNFbHNlIHx8IGIuaXNFbmQpIHtcbiAgICAgICAgICAgIGIgPSBuZXcgQmxvY2soXG4gICAgICAgICAgICAgIGV4dGVuZChiLmluZm8sIHtcbiAgICAgICAgICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgYi5jaGlsZHJlblxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNHbG93KSB7XG4gICAgICAgICAgICAgIGJsb2Nrcy5wb3AoKVxuICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBsYXN0LmNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgICAgICAgPyBsYXN0LmNoaWxkLmJsb2Nrc1xuICAgICAgICAgICAgICAgIDogW2xhc3QuY2hpbGRdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGIpXG4gICAgICAgICAgICBibG9ja3MucHVzaChuZXcgR2xvdyhuZXcgU2NyaXB0KGNoaWxkcmVuKSkpXG4gICAgICAgICAgfSBlbHNlIGlmIChiLmlzSGF0KSB7XG4gICAgICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICAgIGJsb2NrcyA9IFtiXVxuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0ZpbmFsKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNDb21tYW5kKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyByZXBvcnRlciBvciBwcmVkaWNhdGVcbiAgICAgICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgICAgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoW2JdKSlcbiAgICAgICAgICAgIGJsb2NrcyA9IFtdXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgd2hpbGUgKGxpbmUgPT09IFwiTkxcIikgbmV4dCgpXG4gICAgICB9XG4gICAgICByZXR1cm4gc2NyaXB0c1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBMaW5lKCkge1xuICAgICAgdmFyIGIgPSBsaW5lXG4gICAgICBuZXh0KClcblxuICAgICAgaWYgKGIuaGFzU2NyaXB0KSB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdmFyIGJsb2NrcyA9IHBNb3V0aCgpXG4gICAgICAgICAgYi5jaGlsZHJlbi5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICBpZiAobGluZSAmJiBsaW5lLmlzRWxzZSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGIuY2hpbGRyZW4ucHVzaChsaW5lLmNoaWxkcmVuW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobGluZSAmJiBsaW5lLmlzRW5kKSB7XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTW91dGgoKSB7XG4gICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgIHdoaWxlIChsaW5lKSB7XG4gICAgICAgIGlmIChsaW5lID09PSBcIk5MXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGlmICghbGluZS5pc0NvbW1hbmQpIHtcbiAgICAgICAgICByZXR1cm4gYmxvY2tzXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYiA9IHBMaW5lKClcbiAgICAgICAgdmFyIGlzR2xvdyA9IGIuZGlmZiA9PT0gXCIrXCJcbiAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgIGIuZGlmZiA9IG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV1cbiAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNHbG93KSB7XG4gICAgICAgICAgICBibG9ja3MucG9wKClcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGxhc3QuY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICAgICAgPyBsYXN0LmNoaWxkLmJsb2Nrc1xuICAgICAgICAgICAgICA6IFtsYXN0LmNoaWxkXVxuICAgICAgICAgIH1cbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKGIpXG4gICAgICAgICAgYmxvY2tzLnB1c2gobmV3IEdsb3cobmV3IFNjcmlwdChjaGlsZHJlbikpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBibG9ja3NcbiAgICB9XG5cbiAgICByZXR1cm4gcEZpbGUoKVxuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIGVhY2hCbG9jayh4LCBjYikge1xuICAgIGlmICh4LmlzU2NyaXB0KSB7XG4gICAgICB4LmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGVhY2hCbG9jayhibG9jaywgY2IpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoeC5pc0Jsb2NrKSB7XG4gICAgICBjYih4KVxuICAgICAgeC5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGVhY2hCbG9jayhjaGlsZCwgY2IpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoeC5pc0dsb3cpIHtcbiAgICAgIGVhY2hCbG9jayh4LmNoaWxkLCBjYilcbiAgICB9XG4gIH1cblxuICB2YXIgbGlzdEJsb2NrcyA9IHtcbiAgICBcImFwcGVuZDp0b0xpc3Q6XCI6IDEsXG4gICAgXCJkZWxldGVMaW5lOm9mTGlzdDpcIjogMSxcbiAgICBcImluc2VydDphdDpvZkxpc3Q6XCI6IDIsXG4gICAgXCJzZXRMaW5lOm9mTGlzdDp0bzpcIjogMSxcbiAgICBcInNob3dMaXN0OlwiOiAwLFxuICAgIFwiaGlkZUxpc3Q6XCI6IDAsXG4gIH1cblxuICBmdW5jdGlvbiByZWNvZ25pc2VTdHVmZihzY3JpcHRzKSB7XG4gICAgdmFyIGN1c3RvbUJsb2Nrc0J5SGFzaCA9IHt9XG4gICAgdmFyIGxpc3ROYW1lcyA9IHt9XG5cbiAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICB2YXIgY3VzdG9tQXJncyA9IHt9XG5cbiAgICAgIGVhY2hCbG9jayhzY3JpcHQsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIC8vIGN1c3RvbSBibG9ja3NcbiAgICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiKSB7XG4gICAgICAgICAgdmFyIG91dGxpbmUgPSBibG9jay5jaGlsZHJlblsxXVxuICAgICAgICAgIGlmICghb3V0bGluZSkgcmV0dXJuXG5cbiAgICAgICAgICB2YXIgbmFtZXMgPSBbXVxuICAgICAgICAgIHZhciBwYXJ0cyA9IFtdXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdXRsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBvdXRsaW5lLmNoaWxkcmVuW2ldXG4gICAgICAgICAgICBpZiAoY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGNoaWxkLnZhbHVlKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0Jsb2NrKSB7XG4gICAgICAgICAgICAgIGlmICghY2hpbGQuaW5mby5hcmd1bWVudCkgcmV0dXJuXG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbnVtYmVyOiBcIiVuXCIsXG4gICAgICAgICAgICAgICAgICBzdHJpbmc6IFwiJXNcIixcbiAgICAgICAgICAgICAgICAgIGJvb2xlYW46IFwiJWJcIixcbiAgICAgICAgICAgICAgICB9W2NoaWxkLmluZm8uYXJndW1lbnRdXG4gICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShjaGlsZClcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChuYW1lKVxuICAgICAgICAgICAgICBjdXN0b21BcmdzW25hbWVdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc3BlYyA9IHBhcnRzLmpvaW4oXCIgXCIpXG4gICAgICAgICAgdmFyIGhhc2ggPSBoYXNoU3BlYyhzcGVjKVxuICAgICAgICAgIHZhciBpbmZvID0gKGN1c3RvbUJsb2Nrc0J5SGFzaFtoYXNoXSA9IHtcbiAgICAgICAgICAgIHNwZWM6IHNwZWMsXG4gICAgICAgICAgICBuYW1lczogbmFtZXMsXG4gICAgICAgICAgfSlcbiAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJwcm9jRGVmXCJcbiAgICAgICAgICBibG9jay5pbmZvLmNhbGwgPSBpbmZvLnNwZWNcbiAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lc1xuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImN1c3RvbVwiXG5cbiAgICAgICAgICAvLyBmaXggdXAgaWYvZWxzZSBzZWxlY3RvcnNcbiAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLnNlbGVjdG9yID09PSBcImRvSWZFbHNlXCIpIHtcbiAgICAgICAgICB2YXIgbGFzdDIgPSBibG9jay5jaGlsZHJlbltibG9jay5jaGlsZHJlbi5sZW5ndGggLSAyXVxuICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPVxuICAgICAgICAgICAgbGFzdDIgJiYgbGFzdDIuaXNMYWJlbCAmJiBsYXN0Mi52YWx1ZSA9PT0gXCJlbHNlXCJcbiAgICAgICAgICAgICAgPyBcImRvSWZFbHNlXCJcbiAgICAgICAgICAgICAgOiBcImRvSWZcIlxuXG4gICAgICAgICAgLy8gY3VzdG9tIGFyZ3VtZW50c1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgJiZcbiAgICAgICAgICAoYmxvY2suaXNSZXBvcnRlciB8fCBibG9jay5pc0Jvb2xlYW4pXG4gICAgICAgICkge1xuICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGJsb2NrKVxuICAgICAgICAgIGlmIChjdXN0b21BcmdzW25hbWVdKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJjdXN0b20tYXJnXCJcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwiZ2V0UGFyYW1cIlxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGxpc3QgbmFtZXNcbiAgICAgICAgfSBlbHNlIGlmIChsaXN0QmxvY2tzLmhhc093blByb3BlcnR5KGJsb2NrLmluZm8uc2VsZWN0b3IpKSB7XG4gICAgICAgICAgdmFyIGFyZ0luZGV4ID0gbGlzdEJsb2Nrc1tibG9jay5pbmZvLnNlbGVjdG9yXVxuICAgICAgICAgIHZhciBpbnB1dHMgPSBibG9jay5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbFxuICAgICAgICAgIH0pXG4gICAgICAgICAgdmFyIGlucHV0ID0gaW5wdXRzW2FyZ0luZGV4XVxuICAgICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5pc0lucHV0KSB7XG4gICAgICAgICAgICBsaXN0TmFtZXNbaW5wdXQudmFsdWVdID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgZWFjaEJsb2NrKHNjcmlwdCwgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgLy8gY3VzdG9tIGJsb2Nrc1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCAmJlxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwib2Jzb2xldGVcIlxuICAgICAgICApIHtcbiAgICAgICAgICB2YXIgaW5mbyA9IGN1c3RvbUJsb2Nrc0J5SGFzaFtibG9jay5pbmZvLmhhc2hdXG4gICAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcImNhbGxcIlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYWxsID0gaW5mby5zcGVjXG4gICAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lc1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwiY3VzdG9tXCJcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBsaXN0IHJlcG9ydGVyc1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmlzUmVwb3J0ZXIpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShibG9jaylcbiAgICAgICAgICBpZiAoIW5hbWUpIHJldHVyblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwidmFyaWFibGVzXCIgJiZcbiAgICAgICAgICAgIGxpc3ROYW1lc1tuYW1lXSAmJlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwibGlzdFwiXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwibGlzdFwiKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJjb250ZW50c09mTGlzdDpcIlxuICAgICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJ2YXJpYWJsZXNcIikge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwicmVhZFZhcmlhYmxlXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJlblwiXSxcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgY29kZSA9IGNvZGUucmVwbGFjZSgvJmx0Oy9nLCBcIjxcIilcbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxuL2csIFwiIFwiKVxuICAgIH1cblxuICAgIHZhciBsYW5ndWFnZXMgPSBvcHRpb25zLmxhbmd1YWdlcy5tYXAoZnVuY3Rpb24oY29kZSkge1xuICAgICAgcmV0dXJuIGFsbExhbmd1YWdlc1tjb2RlXVxuICAgIH0pXG5cbiAgICAvKiAqICovXG5cbiAgICB2YXIgZiA9IHBhcnNlTGluZXMoY29kZSwgbGFuZ3VhZ2VzKVxuICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpXG4gICAgcmVjb2duaXNlU3R1ZmYoc2NyaXB0cylcbiAgICByZXR1cm4gbmV3IERvY3VtZW50KHNjcmlwdHMpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBhcnNlOiBwYXJzZSxcbiAgfVxufSkoKVxuIl19
