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
    greenFlag: { width: 10, height: 5, dy: -8 },
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
    ring: SVG.roundRect,
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
        ? 50
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbHFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImZ1bmN0aW9uIG1ha2VDYW52YXMoKSB7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG59XG5cbnZhciBzY3JhdGNoYmxvY2tzID0gKHdpbmRvdy5zY3JhdGNoYmxvY2tzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvXCIpKFxuICB3aW5kb3csXG4gIG1ha2VDYW52YXNcbikpXG5cbi8vIGFkZCBvdXIgQ1NTIHRvIHRoZSBwYWdlXG52YXIgc3R5bGUgPSBzY3JhdGNoYmxvY2tzLm1ha2VTdHlsZSgpXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbiAgfVxuICBmdW5jdGlvbiBpc0FycmF5KG8pIHtcbiAgICByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheVxuICB9XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgLy8gTGlzdCBvZiBjbGFzc2VzIHdlJ3JlIGFsbG93ZWQgdG8gb3ZlcnJpZGUuXG5cbiAgdmFyIG92ZXJyaWRlQ2F0ZWdvcmllcyA9IFtcbiAgICBcIm1vdGlvblwiLFxuICAgIFwibG9va3NcIixcbiAgICBcInNvdW5kXCIsXG4gICAgXCJwZW5cIixcbiAgICBcInZhcmlhYmxlc1wiLFxuICAgIFwibGlzdFwiLFxuICAgIFwiZXZlbnRzXCIsXG4gICAgXCJjb250cm9sXCIsXG4gICAgXCJzZW5zaW5nXCIsXG4gICAgXCJvcGVyYXRvcnNcIixcbiAgICBcImN1c3RvbVwiLFxuICAgIFwiY3VzdG9tLWFyZ1wiLFxuICAgIFwiZXh0ZW5zaW9uXCIsXG4gICAgXCJncmV5XCIsXG4gICAgXCJvYnNvbGV0ZVwiLFxuICBdXG4gIHZhciBvdmVycmlkZVNoYXBlcyA9IFtcImhhdFwiLCBcImNhcFwiLCBcInN0YWNrXCIsIFwiYm9vbGVhblwiLCBcInJlcG9ydGVyXCIsIFwicmluZ1wiXVxuXG4gIC8vIGxhbmd1YWdlcyB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgcmlnaHQgdG8gbGVmdFxuICB2YXIgcnRsTGFuZ3VhZ2VzID0gW1wiYXJcIiwgXCJmYVwiLCBcImhlXCJdXG5cbiAgLy8gTGlzdCBvZiBjb21tYW5kcyB0YWtlbiBmcm9tIFNjcmF0Y2hcbiAgdmFyIHNjcmF0Y2hDb21tYW5kcyA9IHJlcXVpcmUoXCIuL2NvbW1hbmRzLmpzXCIpXG5cbiAgdmFyIGNhdGVnb3JpZXNCeUlkID0ge1xuICAgIDA6IFwib2Jzb2xldGVcIixcbiAgICAxOiBcIm1vdGlvblwiLFxuICAgIDI6IFwibG9va3NcIixcbiAgICAzOiBcInNvdW5kXCIsXG4gICAgNDogXCJwZW5cIixcbiAgICA1OiBcImV2ZW50c1wiLFxuICAgIDY6IFwiY29udHJvbFwiLFxuICAgIDc6IFwic2Vuc2luZ1wiLFxuICAgIDg6IFwib3BlcmF0b3JzXCIsXG4gICAgOTogXCJ2YXJpYWJsZXNcIixcbiAgICAxMDogXCJjdXN0b21cIixcbiAgICAxMTogXCJwYXJhbWV0ZXJcIixcbiAgICAxMjogXCJsaXN0XCIsXG4gICAgMjA6IFwiZXh0ZW5zaW9uXCIsXG4gICAgNDI6IFwiZ3JleVwiLFxuICB9XG5cbiAgdmFyIHR5cGVTaGFwZXMgPSB7XG4gICAgXCIgXCI6IFwic3RhY2tcIixcbiAgICBiOiBcImJvb2xlYW5cIixcbiAgICBjOiBcImMtYmxvY2tcIixcbiAgICBlOiBcImlmLWJsb2NrXCIsXG4gICAgZjogXCJjYXBcIixcbiAgICBoOiBcImhhdFwiLFxuICAgIHI6IFwicmVwb3J0ZXJcIixcbiAgICBjZjogXCJjLWJsb2NrIGNhcFwiLFxuICAgIGVsc2U6IFwiY2Vsc2VcIixcbiAgICBlbmQ6IFwiY2VuZFwiLFxuICAgIHJpbmc6IFwicmluZ1wiLFxuICB9XG5cbiAgdmFyIGlucHV0UGF0ID0gLyglW2EtekEtWl0oPzpcXC5bYS16QS1aMC05XSspPykvXG4gIHZhciBpbnB1dFBhdEdsb2JhbCA9IG5ldyBSZWdFeHAoaW5wdXRQYXQuc291cmNlLCBcImdcIilcbiAgdmFyIGljb25QYXQgPSAvKEBbYS16QS1aXSspL1xuICB2YXIgc3BsaXRQYXQgPSBuZXcgUmVnRXhwKFxuICAgIFtpbnB1dFBhdC5zb3VyY2UsIFwifFwiLCBpY29uUGF0LnNvdXJjZSwgXCJ8ICtcIl0uam9pbihcIlwiKSxcbiAgICBcImdcIlxuICApXG5cbiAgdmFyIGhleENvbG9yUGF0ID0gL14jKD86WzAtOWEtZkEtRl17M30pezEsMn0/JC9cblxuICBmdW5jdGlvbiBwYXJzZVNwZWMoc3BlYykge1xuICAgIHZhciBwYXJ0cyA9IHNwZWMuc3BsaXQoc3BsaXRQYXQpLmZpbHRlcih4ID0+ICEheClcbiAgICByZXR1cm4ge1xuICAgICAgc3BlYzogc3BlYyxcbiAgICAgIHBhcnRzOiBwYXJ0cyxcbiAgICAgIGlucHV0czogcGFydHMuZmlsdGVyKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0UGF0LnRlc3QocClcbiAgICAgIH0pLFxuICAgICAgaGFzaDogaGFzaFNwZWMoc3BlYyksXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFzaFNwZWMoc3BlYykge1xuICAgIHJldHVybiBtaW5pZnlIYXNoKHNwZWMucmVwbGFjZShpbnB1dFBhdEdsb2JhbCwgXCIgXyBcIikpXG4gIH1cblxuICBmdW5jdGlvbiBtaW5pZnlIYXNoKGhhc2gpIHtcbiAgICByZXR1cm4gaGFzaFxuICAgICAgLnJlcGxhY2UoL18vZywgXCIgXyBcIilcbiAgICAgIC5yZXBsYWNlKC8gKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9bLCU/Ol0vZywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC/Dny9nLCBcInNzXCIpXG4gICAgICAucmVwbGFjZSgvw6QvZywgXCJhXCIpXG4gICAgICAucmVwbGFjZSgvw7YvZywgXCJvXCIpXG4gICAgICAucmVwbGFjZSgvw7wvZywgXCJ1XCIpXG4gICAgICAucmVwbGFjZShcIi4gLiAuXCIsIFwiLi4uXCIpXG4gICAgICAucmVwbGFjZSgvXuKApiQvLCBcIi4uLlwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIHZhciBibG9ja3NCeVNlbGVjdG9yID0ge31cbiAgdmFyIGJsb2Nrc0J5U3BlYyA9IHt9XG4gIHZhciBhbGxCbG9ja3MgPSBzY3JhdGNoQ29tbWFuZHMubWFwKGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICB2YXIgaW5mbyA9IGV4dGVuZChwYXJzZVNwZWMoY29tbWFuZFswXSksIHtcbiAgICAgIHNoYXBlOiB0eXBlU2hhcGVzW2NvbW1hbmRbMV1dLCAvLyAvWyBiY2VmaHJdfGNmL1xuICAgICAgY2F0ZWdvcnk6IGNhdGVnb3JpZXNCeUlkW2NvbW1hbmRbMl0gJSAxMDBdLFxuICAgICAgc2VsZWN0b3I6IGNvbW1hbmRbM10sXG4gICAgICBoYXNMb29wQXJyb3c6XG4gICAgICAgIFtcImRvUmVwZWF0XCIsIFwiZG9VbnRpbFwiLCBcImRvRm9yZXZlclwiXS5pbmRleE9mKGNvbW1hbmRbM10pID4gLTEsXG4gICAgfSlcbiAgICBpZiAoaW5mby5zZWxlY3Rvcikge1xuICAgICAgLy8gbmIuIGNvbW1hbmQgb3JkZXIgbWF0dGVycyFcbiAgICAgIC8vIFNjcmF0Y2ggMS40IGJsb2NrcyBhcmUgbGlzdGVkIGxhc3RcbiAgICAgIGlmICghYmxvY2tzQnlTZWxlY3RvcltpbmZvLnNlbGVjdG9yXSlcbiAgICAgICAgYmxvY2tzQnlTZWxlY3RvcltpbmZvLnNlbGVjdG9yXSA9IGluZm9cbiAgICB9XG4gICAgcmV0dXJuIChibG9ja3NCeVNwZWNbaW5mby5zcGVjXSA9IGluZm8pXG4gIH0pXG5cbiAgdmFyIHVuaWNvZGVJY29ucyA9IHtcbiAgICBcIkBncmVlbkZsYWdcIjogXCLimpFcIixcbiAgICBcIkB0dXJuUmlnaHRcIjogXCLihrtcIixcbiAgICBcIkB0dXJuTGVmdFwiOiBcIuKGulwiLFxuICAgIFwiQGFkZElucHV0XCI6IFwi4pa4XCIsXG4gICAgXCJAZGVsSW5wdXRcIjogXCLil4JcIixcbiAgfVxuXG4gIHZhciBhbGxMYW5ndWFnZXMgPSB7fVxuICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2UpIHtcbiAgICB2YXIgYmxvY2tzQnlIYXNoID0gKGxhbmd1YWdlLmJsb2Nrc0J5SGFzaCA9IHt9KVxuXG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuY29tbWFuZHMpLmZvckVhY2goZnVuY3Rpb24oc3BlYykge1xuICAgICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5ndWFnZS5jb21tYW5kc1tzcGVjXVxuICAgICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTcGVjW3NwZWNdXG5cbiAgICAgIHZhciBuYXRpdmVIYXNoID0gaGFzaFNwZWMobmF0aXZlU3BlYylcbiAgICAgIGJsb2Nrc0J5SGFzaFtuYXRpdmVIYXNoXSA9IGJsb2NrXG5cbiAgICAgIC8vIGZhbGxiYWNrIGltYWdlIHJlcGxhY2VtZW50LCBmb3IgbGFuZ3VhZ2VzIHdpdGhvdXQgYWxpYXNlc1xuICAgICAgdmFyIG0gPSBpY29uUGF0LmV4ZWMoc3BlYylcbiAgICAgIGlmIChtKSB7XG4gICAgICAgIHZhciBpbWFnZSA9IG1bMF1cbiAgICAgICAgdmFyIGhhc2ggPSBuYXRpdmVIYXNoLnJlcGxhY2UoaW1hZ2UsIHVuaWNvZGVJY29uc1tpbWFnZV0pXG4gICAgICAgIGJsb2Nrc0J5SGFzaFtoYXNoXSA9IGJsb2NrXG4gICAgICB9XG4gICAgfSlcblxuICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXMgPSB7fVxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmFsaWFzZXMpLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpIHtcbiAgICAgIHZhciBzcGVjID0gbGFuZ3VhZ2UuYWxpYXNlc1thbGlhc11cbiAgICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U3BlY1tzcGVjXVxuXG4gICAgICB2YXIgYWxpYXNIYXNoID0gaGFzaFNwZWMoYWxpYXMpXG4gICAgICBibG9ja3NCeUhhc2hbYWxpYXNIYXNoXSA9IGJsb2NrXG5cbiAgICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXNbc3BlY10gPSBhbGlhc1xuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5uYXRpdmVEcm9wZG93bnMgPSB7fVxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmRyb3Bkb3ducykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgbmF0aXZlTmFtZSA9IGxhbmd1YWdlLmRyb3Bkb3duc1tuYW1lXVxuICAgICAgbGFuZ3VhZ2UubmF0aXZlRHJvcGRvd25zW25hdGl2ZU5hbWVdID0gbmFtZVxuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5jb2RlID0gY29kZVxuICAgIGFsbExhbmd1YWdlc1tjb2RlXSA9IGxhbmd1YWdlXG4gIH1cbiAgZnVuY3Rpb24gbG9hZExhbmd1YWdlcyhsYW5ndWFnZXMpIHtcbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZXMpLmZvckVhY2goZnVuY3Rpb24oY29kZSkge1xuICAgICAgbG9hZExhbmd1YWdlKGNvZGUsIGxhbmd1YWdlc1tjb2RlXSlcbiAgICB9KVxuICB9XG5cbiAgdmFyIGVuZ2xpc2ggPSB7XG4gICAgYWxpYXNlczoge1xuICAgICAgXCJ0dXJuIGxlZnQgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjY3cgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiByaWdodCAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjdyAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwid2hlbiBnZiBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICAgIFwid2hlbiBmbGFnIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgICAgXCJ3aGVuIGdyZWVuIGZsYWcgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgICBcImNsZWFyXCI6IFwiZXJhc2UgYWxsXCIsXG4gICAgfSxcblxuICAgIGRlZmluZTogW1wiZGVmaW5lXCJdLFxuXG4gICAgLy8gRm9yIGlnbm9yaW5nIHRoZSBsdCBzaWduIGluIHRoZSBcIndoZW4gZGlzdGFuY2UgPCBfXCIgYmxvY2tcbiAgICBpZ25vcmVsdDogW1wid2hlbiBkaXN0YW5jZVwiXSxcblxuICAgIC8vIFZhbGlkIGFyZ3VtZW50cyB0byBcIm9mXCIgZHJvcGRvd24sIGZvciByZXNvbHZpbmcgYW1iaWd1b3VzIHNpdHVhdGlvbnNcbiAgICBtYXRoOiBbXG4gICAgICBcImFic1wiLFxuICAgICAgXCJmbG9vclwiLFxuICAgICAgXCJjZWlsaW5nXCIsXG4gICAgICBcInNxcnRcIixcbiAgICAgIFwic2luXCIsXG4gICAgICBcImNvc1wiLFxuICAgICAgXCJ0YW5cIixcbiAgICAgIFwiYXNpblwiLFxuICAgICAgXCJhY29zXCIsXG4gICAgICBcImF0YW5cIixcbiAgICAgIFwibG5cIixcbiAgICAgIFwibG9nXCIsXG4gICAgICBcImUgXlwiLFxuICAgICAgXCIxMCBeXCIsXG4gICAgXSxcblxuICAgIC8vIEZvciBkZXRlY3RpbmcgdGhlIFwic3RvcFwiIGNhcCAvIHN0YWNrIGJsb2NrXG4gICAgb3NpczogW1wib3RoZXIgc2NyaXB0cyBpbiBzcHJpdGVcIiwgXCJvdGhlciBzY3JpcHRzIGluIHN0YWdlXCJdLFxuXG4gICAgZHJvcGRvd25zOiB7fSxcblxuICAgIGNvbW1hbmRzOiB7fSxcbiAgfVxuICBhbGxCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpbmZvKSB7XG4gICAgZW5nbGlzaC5jb21tYW5kc1tpbmZvLnNwZWNdID0gaW5mby5zcGVjXG4gIH0pLFxuICAgIGxvYWRMYW5ndWFnZXMoe1xuICAgICAgZW46IGVuZ2xpc2gsXG4gICAgfSlcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgZnVuY3Rpb24gZGlzYW1iaWcoc2VsZWN0b3IxLCBzZWxlY3RvcjIsIHRlc3QpIHtcbiAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgICByZXR1cm4gYmxvY2tzQnlTZWxlY3Rvclt0ZXN0KGNoaWxkcmVuLCBsYW5nKSA/IHNlbGVjdG9yMSA6IHNlbGVjdG9yMl1cbiAgICB9XG4gICAgYmxvY2tzQnlTZWxlY3RvcltzZWxlY3RvcjFdLnNwZWNpYWxDYXNlID0gYmxvY2tzQnlTZWxlY3RvcltcbiAgICAgIHNlbGVjdG9yMlxuICAgIF0uc3BlY2lhbENhc2UgPSBmdW5jXG4gIH1cblxuICBkaXNhbWJpZyhcImNvbXB1dGVGdW5jdGlvbjpvZjpcIiwgXCJnZXRBdHRyaWJ1dGU6b2Y6XCIsIGZ1bmN0aW9uKGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gT3BlcmF0b3JzIGlmIG1hdGggZnVuY3Rpb24sIG90aGVyd2lzZSBzZW5zaW5nIFwiYXR0cmlidXRlIG9mXCIgYmxvY2tcbiAgICB2YXIgZmlyc3QgPSBjaGlsZHJlblswXVxuICAgIGlmICghZmlyc3QuaXNJbnB1dCkgcmV0dXJuXG4gICAgdmFyIG5hbWUgPSBmaXJzdC52YWx1ZVxuICAgIHJldHVybiBsYW5nLm1hdGguaW5kZXhPZihuYW1lKSA+IC0xXG4gIH0pXG5cbiAgZGlzYW1iaWcoXCJsaW5lQ291bnRPZkxpc3Q6XCIsIFwic3RyaW5nTGVuZ3RoOlwiLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIExpc3QgYmxvY2sgaWYgZHJvcGRvd24sIG90aGVyd2lzZSBvcGVyYXRvcnNcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgaWYgKCFsYXN0LmlzSW5wdXQpIHJldHVyblxuICAgIHJldHVybiBsYXN0LnNoYXBlID09PSBcImRyb3Bkb3duXCJcbiAgfSlcblxuICBkaXNhbWJpZyhcInBlbkNvbG9yOlwiLCBcInNldFBlbkh1ZVRvOlwiLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIENvbG9yIGJsb2NrIGlmIGNvbG9yIGlucHV0LCBvdGhlcndpc2UgbnVtZXJpY1xuICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAvLyBJZiB2YXJpYWJsZSwgYXNzdW1lIGNvbG9yIGlucHV0LCBzaW5jZSB0aGUgUkdCQSBoYWNrIGlzIGNvbW1vbi5cbiAgICAvLyBUT0RPIGZpeCBTY3JhdGNoIDpQXG4gICAgcmV0dXJuIChsYXN0LmlzSW5wdXQgJiYgbGFzdC5pc0NvbG9yKSB8fCBsYXN0LmlzQmxvY2tcbiAgfSlcblxuICBibG9ja3NCeVNlbGVjdG9yW1wic3RvcFNjcmlwdHNcIl0uc3BlY2lhbENhc2UgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIENhcCBibG9jayB1bmxlc3MgYXJndW1lbnQgaXMgXCJvdGhlciBzY3JpcHRzIGluIHNwcml0ZVwiXG4gICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgIGlmICghbGFzdC5pc0lucHV0KSByZXR1cm5cbiAgICB2YXIgdmFsdWUgPSBsYXN0LnZhbHVlXG4gICAgaWYgKGxhbmcub3Npcy5pbmRleE9mKHZhbHVlKSA+IC0xKSB7XG4gICAgICByZXR1cm4gZXh0ZW5kKGJsb2Nrc0J5U2VsZWN0b3JbXCJzdG9wU2NyaXB0c1wiXSwge1xuICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBIYXNoKGhhc2gsIGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxhbmcgPSBsYW5ndWFnZXNbaV1cbiAgICAgIGlmIChsYW5nLmJsb2Nrc0J5SGFzaC5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICB2YXIgYmxvY2sgPSBsYW5nLmJsb2Nrc0J5SGFzaFtoYXNoXVxuICAgICAgICBpZiAoaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiICYmIGJsb2NrLnNoYXBlICE9PSBcInJlcG9ydGVyXCIpIGNvbnRpbnVlXG4gICAgICAgIGlmIChpbmZvLnNoYXBlID09PSBcImJvb2xlYW5cIiAmJiBibG9jay5zaGFwZSAhPT0gXCJib29sZWFuXCIpIGNvbnRpbnVlXG4gICAgICAgIGlmIChibG9jay5zcGVjaWFsQ2FzZSkge1xuICAgICAgICAgIGJsb2NrID0gYmxvY2suc3BlY2lhbENhc2UoaW5mbywgY2hpbGRyZW4sIGxhbmcpIHx8IGJsb2NrXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogYmxvY2ssIGxhbmc6IGxhbmcgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvb2t1cERyb3Bkb3duKG5hbWUsIGxhbmd1YWdlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGFuZyA9IGxhbmd1YWdlc1tpXVxuICAgICAgaWYgKGxhbmcubmF0aXZlRHJvcGRvd25zLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIHZhciBuYXRpdmVOYW1lID0gbGFuZy5uYXRpdmVEcm9wZG93bnNbbmFtZV1cbiAgICAgICAgcmV0dXJuIG5hdGl2ZU5hbWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseU92ZXJyaWRlcyhpbmZvLCBvdmVycmlkZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG92ZXJyaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG5hbWUgPSBvdmVycmlkZXNbaV1cbiAgICAgIGlmIChoZXhDb2xvclBhdC50ZXN0KG5hbWUpKSB7XG4gICAgICAgIGluZm8uY29sb3IgPSBuYW1lXG4gICAgICAgIGluZm8uY2F0ZWdvcnkgPSBcIlwiXG4gICAgICAgIGluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgfSBlbHNlIGlmIChvdmVycmlkZUNhdGVnb3JpZXMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIGluZm8uY2F0ZWdvcnkgPSBuYW1lXG4gICAgICAgIGluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgfSBlbHNlIGlmIChvdmVycmlkZVNoYXBlcy5pbmRleE9mKG5hbWUpID4gLTEpIHtcbiAgICAgICAgaW5mby5zaGFwZSA9IG5hbWVcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJsb29wXCIpIHtcbiAgICAgICAgaW5mby5oYXNMb29wQXJyb3cgPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiK1wiIHx8IG5hbWUgPT09IFwiLVwiKSB7XG4gICAgICAgIGluZm8uZGlmZiA9IG5hbWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBibG9ja05hbWUoYmxvY2spIHtcbiAgICB2YXIgd29yZHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmxvY2suY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGJsb2NrLmNoaWxkcmVuW2ldXG4gICAgICBpZiAoIWNoaWxkLmlzTGFiZWwpIHJldHVyblxuICAgICAgd29yZHMucHVzaChjaGlsZC52YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oXCIgXCIpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGxvYWRMYW5ndWFnZXMsXG5cbiAgICBibG9ja05hbWUsXG5cbiAgICBhbGxMYW5ndWFnZXMsXG4gICAgbG9va3VwRHJvcGRvd24sXG4gICAgaGV4Q29sb3JQYXQsXG4gICAgbWluaWZ5SGFzaCxcbiAgICBsb29rdXBIYXNoLFxuICAgIGFwcGx5T3ZlcnJpZGVzLFxuICAgIHJ0bExhbmd1YWdlcyxcbiAgICBpY29uUGF0LFxuICAgIGhhc2hTcGVjLFxuXG4gICAgYmxvY2tzQnlTZWxlY3RvcixcbiAgICBwYXJzZVNwZWMsXG4gICAgaW5wdXRQYXQsXG4gICAgdW5pY29kZUljb25zLFxuICAgIGVuZ2xpc2gsXG4gIH1cbn0pKClcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICBbXCJtb3ZlICVuIHN0ZXBzXCIsIFwiIFwiLCAxLCBcImZvcndhcmQ6XCJdLFxuICBbXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLCBcIiBcIiwgMSwgXCJ0dXJuUmlnaHQ6XCJdLFxuICBbXCJ0dXJuIEB0dXJuTGVmdCAlbiBkZWdyZWVzXCIsIFwiIFwiLCAxLCBcInR1cm5MZWZ0OlwiXSxcbiAgW1wicG9pbnQgaW4gZGlyZWN0aW9uICVkLmRpcmVjdGlvblwiLCBcIiBcIiwgMSwgXCJoZWFkaW5nOlwiXSxcbiAgW1wicG9pbnQgdG93YXJkcyAlbS5zcHJpdGVPck1vdXNlXCIsIFwiIFwiLCAxLCBcInBvaW50VG93YXJkczpcIl0sXG4gIFtcImdvIHRvIHg6JW4geTolblwiLCBcIiBcIiwgMSwgXCJnb3RvWDp5OlwiXSxcbiAgW1wiZ28gdG8gJXIubG9jYXRpb25cIiwgXCIgXCIsIDEsIFwiZ290b1Nwcml0ZU9yTW91c2U6XCJdLFxuICBbXCJnbGlkZSAlbiBzZWNzIHRvIHg6JW4geTolblwiLCBcIiBcIiwgMSwgXCJnbGlkZVNlY3M6dG9YOnk6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wiY2hhbmdlIHggYnkgJW5cIiwgXCIgXCIsIDEsIFwiY2hhbmdlWHBvc0J5OlwiXSxcbiAgW1wic2V0IHggdG8gJW5cIiwgXCIgXCIsIDEsIFwieHBvczpcIl0sXG4gIFtcImNoYW5nZSB5IGJ5ICVuXCIsIFwiIFwiLCAxLCBcImNoYW5nZVlwb3NCeTpcIl0sXG4gIFtcInNldCB5IHRvICVuXCIsIFwiIFwiLCAxLCBcInlwb3M6XCJdLFxuICBbXCJzZXQgcm90YXRpb24gc3R5bGUgJW0ucm90YXRpb25TdHlsZVwiLCBcIiBcIiwgMSwgXCJzZXRSb3RhdGlvblN0eWxlXCJdLFxuICBbXCJzYXkgJXMgZm9yICVuIHNlY3NcIiwgXCIgXCIsIDIsIFwic2F5OmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInNheSAlc1wiLCBcIiBcIiwgMiwgXCJzYXk6XCJdLFxuICBbXCJ0aGluayAlcyBmb3IgJW4gc2Vjc1wiLCBcIiBcIiwgMiwgXCJ0aGluazpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJ0aGluayAlc1wiLCBcIiBcIiwgMiwgXCJ0aGluazpcIl0sXG4gIFtcInNob3dcIiwgXCIgXCIsIDIsIFwic2hvd1wiXSxcbiAgW1wiaGlkZVwiLCBcIiBcIiwgMiwgXCJoaWRlXCJdLFxuICBbXCJzd2l0Y2ggY29zdHVtZSB0byAlbS5jb3N0dW1lXCIsIFwiIFwiLCAyLCBcImxvb2tMaWtlOlwiXSxcbiAgW1wibmV4dCBjb3N0dW1lXCIsIFwiIFwiLCAyLCBcIm5leHRDb3N0dW1lXCJdLFxuICBbXCJuZXh0IGJhY2tkcm9wXCIsIFwiIFwiLCAxMDIsIFwibmV4dFNjZW5lXCJdLFxuICBbXCJzd2l0Y2ggYmFja2Ryb3AgdG8gJW0uYmFja2Ryb3BcIiwgXCIgXCIsIDIsIFwic3RhcnRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIGJhY2tkcm9wIHRvICVtLmJhY2tkcm9wIGFuZCB3YWl0XCIsIFwiIFwiLCAxMDIsIFwic3RhcnRTY2VuZUFuZFdhaXRcIl0sXG4gIFtcImNoYW5nZSAlbS5lZmZlY3QgZWZmZWN0IGJ5ICVuXCIsIFwiIFwiLCAyLCBcImNoYW5nZUdyYXBoaWNFZmZlY3Q6Ynk6XCJdLFxuICBbXCJzZXQgJW0uZWZmZWN0IGVmZmVjdCB0byAlblwiLCBcIiBcIiwgMiwgXCJzZXRHcmFwaGljRWZmZWN0OnRvOlwiXSxcbiAgW1wiY2xlYXIgZ3JhcGhpYyBlZmZlY3RzXCIsIFwiIFwiLCAyLCBcImZpbHRlclJlc2V0XCJdLFxuICBbXCJjaGFuZ2Ugc2l6ZSBieSAlblwiLCBcIiBcIiwgMiwgXCJjaGFuZ2VTaXplQnk6XCJdLFxuICBbXCJzZXQgc2l6ZSB0byAlbiVcIiwgXCIgXCIsIDIsIFwic2V0U2l6ZVRvOlwiXSxcbiAgW1wiZ28gdG8gZnJvbnRcIiwgXCIgXCIsIDIsIFwiY29tZVRvRnJvbnRcIl0sXG4gIFtcImdvIGJhY2sgJW4gbGF5ZXJzXCIsIFwiIFwiLCAyLCBcImdvQmFja0J5TGF5ZXJzOlwiXSxcbiAgW1wicGxheSBzb3VuZCAlbS5zb3VuZFwiLCBcIiBcIiwgMywgXCJwbGF5U291bmQ6XCJdLFxuICBbXCJwbGF5IHNvdW5kICVtLnNvdW5kIHVudGlsIGRvbmVcIiwgXCIgXCIsIDMsIFwiZG9QbGF5U291bmRBbmRXYWl0XCJdLFxuICBbXCJzdG9wIGFsbCBzb3VuZHNcIiwgXCIgXCIsIDMsIFwic3RvcEFsbFNvdW5kc1wiXSxcbiAgW1wicGxheSBkcnVtICVkLmRydW0gZm9yICVuIGJlYXRzXCIsIFwiIFwiLCAzLCBcInBsYXlEcnVtXCJdLFxuICBbXCJyZXN0IGZvciAlbiBiZWF0c1wiLCBcIiBcIiwgMywgXCJyZXN0OmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInBsYXkgbm90ZSAlZC5ub3RlIGZvciAlbiBiZWF0c1wiLCBcIiBcIiwgMywgXCJub3RlT246ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wic2V0IGluc3RydW1lbnQgdG8gJWQuaW5zdHJ1bWVudFwiLCBcIiBcIiwgMywgXCJpbnN0cnVtZW50OlwiXSxcbiAgW1wiY2hhbmdlIHZvbHVtZSBieSAlblwiLCBcIiBcIiwgMywgXCJjaGFuZ2VWb2x1bWVCeTpcIl0sXG4gIFtcInNldCB2b2x1bWUgdG8gJW4lXCIsIFwiIFwiLCAzLCBcInNldFZvbHVtZVRvOlwiXSxcbiAgW1wiY2hhbmdlIHRlbXBvIGJ5ICVuXCIsIFwiIFwiLCAzLCBcImNoYW5nZVRlbXBvQnk6XCJdLFxuICBbXCJzZXQgdGVtcG8gdG8gJW4gYnBtXCIsIFwiIFwiLCAzLCBcInNldFRlbXBvVG86XCJdLFxuICBbXCJjaGFuZ2UgJW0uYXVkaW9FZmZlY3QgZWZmZWN0IGJ5ICVuXCIsIFwiIFwiLCAzLCBcImNoYW5nZUF1ZGlvRWZmZWN0Qnk6XCJdLFxuICBbXCJzZXQgJW0uYXVkaW9FZmZlY3QgZWZmZWN0IHRvICVuXCIsIFwiIFwiLCAzLCBcInNldEF1ZGlvRWZmZWN0VG86XCJdLFxuICBbXCJlcmFzZSBhbGxcIiwgXCIgXCIsIDQsIFwiY2xlYXJQZW5UcmFpbHNcIl0sXG4gIFtcInN0YW1wXCIsIFwiIFwiLCA0LCBcInN0YW1wQ29zdHVtZVwiXSxcbiAgW1wicGVuIGRvd25cIiwgXCIgXCIsIDQsIFwicHV0UGVuRG93blwiXSxcbiAgW1wicGVuIHVwXCIsIFwiIFwiLCA0LCBcInB1dFBlblVwXCJdLFxuICBbXCJzZXQgcGVuIGNvbG9yIHRvICVjXCIsIFwiIFwiLCA0LCBcInBlbkNvbG9yOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBjb2xvciBieSAlblwiLCBcIiBcIiwgNCwgXCJjaGFuZ2VQZW5IdWVCeTpcIl0sXG4gIFtcInNldCBwZW4gY29sb3IgdG8gJW5cIiwgXCIgXCIsIDQsIFwic2V0UGVuSHVlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNoYWRlIGJ5ICVuXCIsIFwiIFwiLCA0LCBcImNoYW5nZVBlblNoYWRlQnk6XCJdLFxuICBbXCJzZXQgcGVuIHNoYWRlIHRvICVuXCIsIFwiIFwiLCA0LCBcInNldFBlblNoYWRlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNpemUgYnkgJW5cIiwgXCIgXCIsIDQsIFwiY2hhbmdlUGVuU2l6ZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaXplIHRvICVuXCIsIFwiIFwiLCA0LCBcInBlblNpemU6XCJdLFxuICBbXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLCBcImhcIiwgNSwgXCJ3aGVuR3JlZW5GbGFnXCJdLFxuICBbXCJ3aGVuICVtLmtleSBrZXkgcHJlc3NlZFwiLCBcImhcIiwgNSwgXCJ3aGVuS2V5UHJlc3NlZFwiXSxcbiAgW1wid2hlbiB0aGlzIHNwcml0ZSBjbGlja2VkXCIsIFwiaFwiLCA1LCBcIndoZW5DbGlja2VkXCJdLFxuICBbXCJ3aGVuIGJhY2tkcm9wIHN3aXRjaGVzIHRvICVtLmJhY2tkcm9wXCIsIFwiaFwiLCA1LCBcIndoZW5TY2VuZVN0YXJ0c1wiXSxcbiAgW1wid2hlbiAlbS50cmlnZ2VyU2Vuc29yID4gJW5cIiwgXCJoXCIsIDUsIFwid2hlblNlbnNvckdyZWF0ZXJUaGFuXCJdLFxuICBbXCJ3aGVuIEkgcmVjZWl2ZSAlbS5icm9hZGNhc3RcIiwgXCJoXCIsIDUsIFwid2hlbklSZWNlaXZlXCJdLFxuICBbXCJicm9hZGNhc3QgJW0uYnJvYWRjYXN0XCIsIFwiIFwiLCA1LCBcImJyb2FkY2FzdDpcIl0sXG4gIFtcImJyb2FkY2FzdCAlbS5icm9hZGNhc3QgYW5kIHdhaXRcIiwgXCIgXCIsIDUsIFwiZG9Ccm9hZGNhc3RBbmRXYWl0XCJdLFxuICBbXCJ3YWl0ICVuIHNlY29uZHNcIiwgXCIgXCIsIDYsIFwid2FpdDplbGFwc2VkOmZyb206XCJdLFxuICBbXCJyZXBlYXQgJW5cIiwgXCJjXCIsIDYsIFwiZG9SZXBlYXRcIl0sXG4gIFtcImZvcmV2ZXJcIiwgXCJjZlwiLCA2LCBcImRvRm9yZXZlclwiXSxcbiAgW1wiaWYgJWIgdGhlblwiLCBcImNcIiwgNiwgXCJkb0lmXCJdLFxuICBbXCJpZiAlYiB0aGVuXCIsIFwiZVwiLCA2LCBcImRvSWZFbHNlXCJdLFxuICBbXCJ3YWl0IHVudGlsICViXCIsIFwiIFwiLCA2LCBcImRvV2FpdFVudGlsXCJdLFxuICBbXCJyZXBlYXQgdW50aWwgJWJcIiwgXCJjXCIsIDYsIFwiZG9VbnRpbFwiXSxcbiAgW1wic3RvcCAlbS5zdG9wXCIsIFwiZlwiLCA2LCBcInN0b3BTY3JpcHRzXCJdLFxuICBbXCJ3aGVuIEkgc3RhcnQgYXMgYSBjbG9uZVwiLCBcImhcIiwgNiwgXCJ3aGVuQ2xvbmVkXCJdLFxuICBbXCJjcmVhdGUgY2xvbmUgb2YgJW0uc3ByaXRlT25seVwiLCBcIiBcIiwgNiwgXCJjcmVhdGVDbG9uZU9mXCJdLFxuICBbXCJkZWxldGUgdGhpcyBjbG9uZVwiLCBcImZcIiwgNiwgXCJkZWxldGVDbG9uZVwiXSxcbiAgW1wiYXNrICVzIGFuZCB3YWl0XCIsIFwiIFwiLCA3LCBcImRvQXNrXCJdLFxuICBbXCJ0dXJuIHZpZGVvICVtLnZpZGVvU3RhdGVcIiwgXCIgXCIsIDcsIFwic2V0VmlkZW9TdGF0ZVwiXSxcbiAgW1wic2V0IHZpZGVvIHRyYW5zcGFyZW5jeSB0byAlbiVcIiwgXCIgXCIsIDcsIFwic2V0VmlkZW9UcmFuc3BhcmVuY3lcIl0sXG4gIFtcInJlc2V0IHRpbWVyXCIsIFwiIFwiLCA3LCBcInRpbWVyUmVzZXRcIl0sXG4gIFtcInNldCAlbS52YXIgdG8gJXNcIiwgXCIgXCIsIDksIFwic2V0VmFyOnRvOlwiXSxcbiAgW1wiY2hhbmdlICVtLnZhciBieSAlblwiLCBcIiBcIiwgOSwgXCJjaGFuZ2VWYXI6Ynk6XCJdLFxuICBbXCJzaG93IHZhcmlhYmxlICVtLnZhclwiLCBcIiBcIiwgOSwgXCJzaG93VmFyaWFibGU6XCJdLFxuICBbXCJoaWRlIHZhcmlhYmxlICVtLnZhclwiLCBcIiBcIiwgOSwgXCJoaWRlVmFyaWFibGU6XCJdLFxuICBbXCJhZGQgJXMgdG8gJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiYXBwZW5kOnRvTGlzdDpcIl0sXG4gIFtcImRlbGV0ZSAlZC5saXN0RGVsZXRlSXRlbSBvZiAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJkZWxldGVMaW5lOm9mTGlzdDpcIl0sXG4gIFtcImRlbGV0ZSBhbGwgb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiZGVsZXRlQWxsOm9mTGlzdDpcIl0sXG4gIFtcImlmIG9uIGVkZ2UsIGJvdW5jZVwiLCBcIiBcIiwgMSwgXCJib3VuY2VPZmZFZGdlXCJdLFxuICBbXCJpbnNlcnQgJXMgYXQgJWQubGlzdEl0ZW0gb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiaW5zZXJ0OmF0Om9mTGlzdDpcIl0sXG4gIFtcbiAgICBcInJlcGxhY2UgaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0IHdpdGggJXNcIixcbiAgICBcIiBcIixcbiAgICAxMixcbiAgICBcInNldExpbmU6b2ZMaXN0OnRvOlwiLFxuICBdLFxuICBbXCJzaG93IGxpc3QgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwic2hvd0xpc3Q6XCJdLFxuICBbXCJoaWRlIGxpc3QgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiaGlkZUxpc3Q6XCJdLFxuXG4gIFtcInggcG9zaXRpb25cIiwgXCJyXCIsIDEsIFwieHBvc1wiXSxcbiAgW1wieSBwb3NpdGlvblwiLCBcInJcIiwgMSwgXCJ5cG9zXCJdLFxuICBbXCJkaXJlY3Rpb25cIiwgXCJyXCIsIDEsIFwiaGVhZGluZ1wiXSxcbiAgW1wiY29zdHVtZSAjXCIsIFwiclwiLCAyLCBcImNvc3R1bWVJbmRleFwiXSxcbiAgW1wic2l6ZVwiLCBcInJcIiwgMiwgXCJzY2FsZVwiXSxcbiAgW1wiYmFja2Ryb3AgbmFtZVwiLCBcInJcIiwgMTAyLCBcInNjZW5lTmFtZVwiXSxcbiAgW1wiYmFja2Ryb3AgI1wiLCBcInJcIiwgMTAyLCBcImJhY2tncm91bmRJbmRleFwiXSxcbiAgW1widm9sdW1lXCIsIFwiclwiLCAzLCBcInZvbHVtZVwiXSxcbiAgW1widGVtcG9cIiwgXCJyXCIsIDMsIFwidGVtcG9cIl0sXG4gIFtcInRvdWNoaW5nICVtLnRvdWNoaW5nP1wiLCBcImJcIiwgNywgXCJ0b3VjaGluZzpcIl0sXG4gIFtcInRvdWNoaW5nIGNvbG9yICVjP1wiLCBcImJcIiwgNywgXCJ0b3VjaGluZ0NvbG9yOlwiXSxcbiAgW1wiY29sb3IgJWMgaXMgdG91Y2hpbmcgJWM/XCIsIFwiYlwiLCA3LCBcImNvbG9yOnNlZXM6XCJdLFxuICBbXCJkaXN0YW5jZSB0byAlbS5zcHJpdGVPck1vdXNlXCIsIFwiclwiLCA3LCBcImRpc3RhbmNlVG86XCJdLFxuICBbXCJhbnN3ZXJcIiwgXCJyXCIsIDcsIFwiYW5zd2VyXCJdLFxuICBbXCJrZXkgJW0ua2V5IHByZXNzZWQ/XCIsIFwiYlwiLCA3LCBcImtleVByZXNzZWQ6XCJdLFxuICBbXCJtb3VzZSBkb3duP1wiLCBcImJcIiwgNywgXCJtb3VzZVByZXNzZWRcIl0sXG4gIFtcIm1vdXNlIHhcIiwgXCJyXCIsIDcsIFwibW91c2VYXCJdLFxuICBbXCJtb3VzZSB5XCIsIFwiclwiLCA3LCBcIm1vdXNlWVwiXSxcbiAgW1wibG91ZG5lc3NcIiwgXCJyXCIsIDcsIFwic291bmRMZXZlbFwiXSxcbiAgW1widmlkZW8gJW0udmlkZW9Nb3Rpb25UeXBlIG9uICVtLnN0YWdlT3JUaGlzXCIsIFwiclwiLCA3LCBcInNlbnNlVmlkZW9Nb3Rpb25cIl0sXG4gIFtcInRpbWVyXCIsIFwiclwiLCA3LCBcInRpbWVyXCJdLFxuICBbXCIlbS5hdHRyaWJ1dGUgb2YgJW0uc3ByaXRlT3JTdGFnZVwiLCBcInJcIiwgNywgXCJnZXRBdHRyaWJ1dGU6b2Y6XCJdLFxuICBbXCJjdXJyZW50ICVtLnRpbWVBbmREYXRlXCIsIFwiclwiLCA3LCBcInRpbWVBbmREYXRlXCJdLFxuICBbXCJkYXlzIHNpbmNlIDIwMDBcIiwgXCJyXCIsIDcsIFwidGltZXN0YW1wXCJdLFxuICBbXCJ1c2VybmFtZVwiLCBcInJcIiwgNywgXCJnZXRVc2VyTmFtZVwiXSxcbiAgW1wiJW4gKyAlblwiLCBcInJcIiwgOCwgXCIrXCJdLFxuICBbXCIlbiAtICVuXCIsIFwiclwiLCA4LCBcIi1cIl0sXG4gIFtcIiVuICogJW5cIiwgXCJyXCIsIDgsIFwiKlwiXSxcbiAgW1wiJW4gLyAlblwiLCBcInJcIiwgOCwgXCIvXCJdLFxuICBbXCJwaWNrIHJhbmRvbSAlbiB0byAlblwiLCBcInJcIiwgOCwgXCJyYW5kb21Gcm9tOnRvOlwiXSxcbiAgW1wiJXMgPCAlc1wiLCBcImJcIiwgOCwgXCI8XCJdLFxuICBbXCIlcyA9ICVzXCIsIFwiYlwiLCA4LCBcIj1cIl0sXG4gIFtcIiVzID4gJXNcIiwgXCJiXCIsIDgsIFwiPlwiXSxcbiAgW1wiJWIgYW5kICViXCIsIFwiYlwiLCA4LCBcIiZcIl0sXG4gIFtcIiViIG9yICViXCIsIFwiYlwiLCA4LCBcInxcIl0sXG4gIFtcIm5vdCAlYlwiLCBcImJcIiwgOCwgXCJub3RcIl0sXG4gIFtcImpvaW4gJXMgJXNcIiwgXCJyXCIsIDgsIFwiY29uY2F0ZW5hdGU6d2l0aDpcIl0sXG4gIFtcImxldHRlciAlbiBvZiAlc1wiLCBcInJcIiwgOCwgXCJsZXR0ZXI6b2Y6XCJdLFxuICBbXCJsZW5ndGggb2YgJXNcIiwgXCJyXCIsIDgsIFwic3RyaW5nTGVuZ3RoOlwiXSxcbiAgW1wiJW4gbW9kICVuXCIsIFwiclwiLCA4LCBcIiVcIl0sXG4gIFtcInJvdW5kICVuXCIsIFwiclwiLCA4LCBcInJvdW5kZWRcIl0sXG4gIFtcIiVtLm1hdGhPcCBvZiAlblwiLCBcInJcIiwgOCwgXCJjb21wdXRlRnVuY3Rpb246b2Y6XCJdLFxuICBbXCJpdGVtICVkLmxpc3RJdGVtIG9mICVtLmxpc3RcIiwgXCJyXCIsIDEyLCBcImdldExpbmU6b2ZMaXN0OlwiXSxcbiAgW1wibGVuZ3RoIG9mICVtLmxpc3RcIiwgXCJyXCIsIDEyLCBcImxpbmVDb3VudE9mTGlzdDpcIl0sXG4gIFtcIiVtLmxpc3QgY29udGFpbnMgJXM/XCIsIFwiYlwiLCAxMiwgXCJsaXN0OmNvbnRhaW5zOlwiXSxcblxuICBbXCJ3aGVuICVtLmJvb2xlYW5TZW5zb3JcIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiAlbS5zZW5zb3IgJW0ubGVzc01vcmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wic2Vuc29yICVtLmJvb2xlYW5TZW5zb3I/XCIsIFwiYlwiLCAyMCwgXCJcIl0sXG4gIFtcIiVtLnNlbnNvciBzZW5zb3IgdmFsdWVcIiwgXCJyXCIsIDIwLCBcIlwiXSxcblxuICBbXCJ0dXJuICVtLm1vdG9yIG9uIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInR1cm4gJW0ubW90b3Igb25cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1widHVybiAlbS5tb3RvciBvZmZcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wic2V0ICVtLm1vdG9yIHBvd2VyIHRvICVuXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInNldCAlbS5tb3RvcjIgZGlyZWN0aW9uIHRvICVtLm1vdG9yRGlyZWN0aW9uXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gZGlzdGFuY2UgJW0ubGVzc01vcmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiB0aWx0ICVtLmVOZSAlblwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJkaXN0YW5jZVwiLCBcInJcIiwgMjAsIFwiXCJdLFxuICBbXCJ0aWx0XCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1widHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjb25kc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJzZXQgbGlnaHQgY29sb3IgdG8gJW5cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wicGxheSBub3RlICVuIGZvciAlbiBzZWNvbmRzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gdGlsdGVkXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcInRpbHQgJW0ueHh4XCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1wiZWxzZVwiLCBcImVsc2VcIiwgNiwgXCJcIl0sXG4gIFtcImVuZFwiLCBcImVuZFwiLCA2LCBcIlwiXSxcbiAgW1wiLiAuIC5cIiwgXCIgXCIsIDQyLCBcIlwiXSxcblxuICBbXCIlbiBAYWRkSW5wdXRcIiwgXCJyaW5nXCIsIDQyLCBcIlwiXSxcblxuICBbXCJ1c2VyIGlkXCIsIFwiclwiLCAwLCBcIlwiXSxcblxuICBbXCJpZiAlYlwiLCBcImNcIiwgMCwgXCJkb0lmXCJdLFxuICBbXCJpZiAlYlwiLCBcImVcIiwgMCwgXCJkb0lmRWxzZVwiXSxcbiAgW1wiZm9yZXZlciBpZiAlYlwiLCBcImNmXCIsIDAsIFwiZG9Gb3JldmVySWZcIl0sXG4gIFtcInN0b3Agc2NyaXB0XCIsIFwiZlwiLCAwLCBcImRvUmV0dXJuXCJdLFxuICBbXCJzdG9wIGFsbFwiLCBcImZcIiwgMCwgXCJzdG9wQWxsXCJdLFxuICBbXCJzd2l0Y2ggdG8gY29zdHVtZSAlbS5jb3N0dW1lXCIsIFwiIFwiLCAwLCBcImxvb2tMaWtlOlwiXSxcbiAgW1wibmV4dCBiYWNrZ3JvdW5kXCIsIFwiIFwiLCAwLCBcIm5leHRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIHRvIGJhY2tncm91bmQgJW0uYmFja2Ryb3BcIiwgXCIgXCIsIDAsIFwic3RhcnRTY2VuZVwiXSxcbiAgW1wiYmFja2dyb3VuZCAjXCIsIFwiclwiLCAwLCBcImJhY2tncm91bmRJbmRleFwiXSxcbiAgW1wibG91ZD9cIiwgXCJiXCIsIDAsIFwiaXNMb3VkXCJdLFxuXVxuIiwiLyogZm9yIGNvbnN0dWN0aW5nIFNWR3MgKi9cblxuZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxufVxuZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbn1cblxuLy8gc2V0IGJ5IFNWRy5pbml0XG52YXIgZG9jdW1lbnRcbnZhciB4bWxcblxudmFyIGRpcmVjdFByb3BzID0ge1xuICB0ZXh0Q29udGVudDogdHJ1ZSxcbn1cblxudmFyIFNWRyA9IChtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdCh3aW5kb3csIG1ha2VDYW52YXMpIHtcbiAgICBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuICAgIHZhciBET01QYXJzZXIgPSB3aW5kb3cuRE9NUGFyc2VyXG4gICAgeG1sID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhcIjx4bWw+PC94bWw+XCIsIFwiYXBwbGljYXRpb24veG1sXCIpXG4gICAgU1ZHLlhNTFNlcmlhbGl6ZXIgPSB3aW5kb3cuWE1MU2VyaWFsaXplclxuXG4gICAgU1ZHLm1ha2VDYW52YXMgPSBtYWtlQ2FudmFzXG4gIH0sXG5cbiAgY2RhdGEoY29udGVudCkge1xuICAgIHJldHVybiB4bWwuY3JlYXRlQ0RBVEFTZWN0aW9uKGNvbnRlbnQpXG4gIH0sXG5cbiAgZWwobmFtZSwgcHJvcHMpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lKVxuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoZWwsIHByb3BzKVxuICB9LFxuXG4gIHNldFByb3BzKGVsLCBwcm9wcykge1xuICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgdmFyIHZhbHVlID0gXCJcIiArIHByb3BzW2tleV1cbiAgICAgIGlmIChkaXJlY3RQcm9wc1trZXldKSB7XG4gICAgICAgIGVsW2tleV0gPSB2YWx1ZVxuICAgICAgfSBlbHNlIGlmICgvXnhsaW5rOi8udGVzdChrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBrZXkuc2xpY2UoNiksIHZhbHVlKVxuICAgICAgfSBlbHNlIGlmIChwcm9wc1trZXldICE9PSBudWxsICYmIHByb3BzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMobnVsbCwga2V5LCB2YWx1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgd2l0aENoaWxkcmVuKGVsLCBjaGlsZHJlbikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkcmVuW2ldKVxuICAgIH1cbiAgICByZXR1cm4gZWxcbiAgfSxcblxuICBncm91cChjaGlsZHJlbikge1xuICAgIHJldHVybiBTVkcud2l0aENoaWxkcmVuKFNWRy5lbChcImdcIiksIGNoaWxkcmVuKVxuICB9LFxuXG4gIG5ld1NWRyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIFNWRy5lbChcInN2Z1wiLCB7XG4gICAgICB2ZXJzaW9uOiBcIjEuMVwiLFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgfSlcbiAgfSxcblxuICBwb2x5Z29uKHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicG9seWdvblwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBvaW50czogcHJvcHMucG9pbnRzLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcGF0aChwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInBhdGhcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBudWxsLFxuICAgICAgICBkOiBwcm9wcy5wYXRoLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgdGV4dCh4LCB5LCBjb250ZW50LCBwcm9wcykge1xuICAgIHZhciB0ZXh0ID0gU1ZHLmVsKFxuICAgICAgXCJ0ZXh0XCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgeDogeCxcbiAgICAgICAgeTogeSxcbiAgICAgICAgdGV4dENvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICB9KVxuICAgIClcbiAgICByZXR1cm4gdGV4dFxuICB9LFxuXG4gIHN5bWJvbChocmVmKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcInVzZVwiLCB7XG4gICAgICBcInhsaW5rOmhyZWZcIjogaHJlZixcbiAgICB9KVxuICB9LFxuXG4gIG1vdmUoZHgsIGR5LCBlbCkge1xuICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgdHJhbnNmb3JtOiBbXCJ0cmFuc2xhdGUoXCIsIGR4LCBcIiBcIiwgZHksIFwiKVwiXS5qb2luKFwiXCIpLFxuICAgIH0pXG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgdHJhbnNsYXRlUGF0aChkeCwgZHksIHBhdGgpIHtcbiAgICB2YXIgaXNYID0gdHJ1ZVxuICAgIHZhciBwYXJ0cyA9IHBhdGguc3BsaXQoXCIgXCIpXG4gICAgdmFyIG91dCA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpXVxuICAgICAgaWYgKHBhcnQgPT09IFwiQVwiKSB7XG4gICAgICAgIHZhciBqID0gaSArIDVcbiAgICAgICAgb3V0LnB1c2goXCJBXCIpXG4gICAgICAgIHdoaWxlIChpIDwgaikge1xuICAgICAgICAgIG91dC5wdXNoKHBhcnRzWysraV0pXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH0gZWxzZSBpZiAoL1tBLVphLXpdLy50ZXN0KHBhcnQpKSB7XG4gICAgICAgIGFzc2VydChpc1gpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0ID0gK3BhcnRcbiAgICAgICAgcGFydCArPSBpc1ggPyBkeCA6IGR5XG4gICAgICAgIGlzWCA9ICFpc1hcbiAgICAgIH1cbiAgICAgIG91dC5wdXNoKHBhcnQpXG4gICAgfVxuICAgIHJldHVybiBvdXQuam9pbihcIiBcIilcbiAgfSxcblxuICAvKiBzaGFwZXMgKi9cblxuICByZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicmVjdFwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHdpZHRoOiB3LFxuICAgICAgICBoZWlnaHQ6IGgsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBlbGxpcHNlKHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwiZWxsaXBzZVwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGN4OiB3IC8gMixcbiAgICAgICAgY3k6IGggLyAyLFxuICAgICAgICByeDogdyAvIDIsXG4gICAgICAgIHJ5OiBoIC8gMixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGFyYyhwMXgsIHAxeSwgcDJ4LCBwMnksIHJ4LCByeSkge1xuICAgIHZhciByID0gcDJ5IC0gcDF5XG4gICAgcmV0dXJuIFtcIkxcIiwgcDF4LCBwMXksIFwiQVwiLCByeCwgcnksIDAsIDAsIDEsIHAyeCwgcDJ5XS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIGFyY3cocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeVxuICAgIHJldHVybiBbXCJMXCIsIHAxeCwgcDF5LCBcIkFcIiwgcngsIHJ5LCAwLCAwLCAwLCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICByb3VuZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnJlY3QoXG4gICAgICB3LFxuICAgICAgaCxcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICByeDogNCxcbiAgICAgICAgcnk6IDQsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBwaWxsUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHZhciByID0gaCAvIDJcbiAgICByZXR1cm4gU1ZHLnJlY3QoXG4gICAgICB3LFxuICAgICAgaCxcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICByeDogcixcbiAgICAgICAgcnk6IHIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBwb2ludGVkUGF0aCh3LCBoKSB7XG4gICAgdmFyIHIgPSBoIC8gMlxuICAgIHJldHVybiBbXG4gICAgICBcIk1cIixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gcixcbiAgICAgIDAsXG4gICAgICB3LFxuICAgICAgcixcbiAgICAgIFwiTFwiLFxuICAgICAgdyxcbiAgICAgIHIsXG4gICAgICB3IC0gcixcbiAgICAgIGgsXG4gICAgICBcIkxcIixcbiAgICAgIHIsXG4gICAgICBoLFxuICAgICAgMCxcbiAgICAgIHIsXG4gICAgICBcIkxcIixcbiAgICAgIDAsXG4gICAgICByLFxuICAgICAgcixcbiAgICAgIDAsXG4gICAgICBcIlpcIixcbiAgICBdXG4gIH0sXG5cbiAgcG9pbnRlZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLnBvaW50ZWRQYXRoKHcsIGgpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cblxuICBnZXRUb3Aodykge1xuICAgIHJldHVybiBbXCJNXCIsIDAsIDQsXG4gICAgICAvLyBcIkxcIiwgMSwgMSxcbiAgICAgIC8vIFwiTFwiLCA0LCAwLFxuICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSgwLCA0LCA0LCAwLCAwKSxcbiAgICAgIFtcIkxcIiwgOCwgMF0uam9pbihcIiBcIiksXG4gICAgICBcImMgMiAwIDMgMSA0IDJcIixcbiAgICAgIFwibCAxLjUgMS41XCIsXG4gICAgICBcImMgMSAxIDIgMiA0IDJcIixcbiAgICAgIFwiaCA4XCIsXG4gICAgICBcImMgMiAwIDMgLTEgNCAtMlwiLFxuICAgICAgXCJsIDEuNSAtMS41XCIsXG4gICAgICBcImMgMSAtMSAyIC0yIDQgLTJcIixcbiAgICAgIFwiTFwiLCB3IC0gNCwgMCxcbiAgICAgIFwiUVwiLCBTVkcuY3VydmUodyAtIDQsIDAsIHcsIDQsIDApLFxuICAgICAgXCJMXCIsIHcsIDRcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0UmluZ1RvcCh3KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiTVwiLFxuICAgICAgMCxcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDMsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICA3LFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgMTAsXG4gICAgICAzLFxuICAgICAgXCJMXCIsXG4gICAgICAxNixcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDE5LFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgdyAtIDMsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3LFxuICAgICAgMyxcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgaGFzTm90Y2gsIGluc2V0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnNldCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zZXQgPSAwXG4gICAgfVxuICAgIC8vdmFyIGFyciA9IFtcIkxcIiwgdywgeSAtIDMsIFwiTFwiLCB3IC0gMywgeV1cbiAgICB2YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gNCwgXCJRXCIsIFNWRy5jdXJ2ZSh3LCB5IC0gNCwgdyAtIDQsIHksIDApXVxuICAgIGlmIChoYXNOb3RjaCkge1xuICAgICAgLy8gYXJyID0gYXJyLmNvbmNhdChbXG4gICAgICAvLyAgIFwiTFwiLFxuICAgICAgLy8gICBpbnNldCArIDMwLFxuICAgICAgLy8gICB5LFxuICAgICAgLy8gICBcIkxcIixcbiAgICAgIC8vICAgaW5zZXQgKyAyNCxcbiAgICAgIC8vICAgeSArIDUsXG4gICAgICAvLyAgIFwiTFwiLFxuICAgICAgLy8gICBpbnNldCArIDE0LFxuICAgICAgLy8gICB5ICsgNSxcbiAgICAgIC8vICAgXCJMXCIsXG4gICAgICAvLyAgIGluc2V0ICsgOCxcbiAgICAgIC8vICAgeSxcbiAgICAgIC8vIF0pXG4gICAgICBhcnIgPSBhcnIuY29uY2F0KFtcbiAgICAgICAgW1wiTFwiLCBpbnNldCArIDM1LCB5XS5qb2luKFwiIFwiKSxcbiAgICAgICAgXCJjIC0yIDAgLTMgMSAtNCAyXCIsXG4gICAgICAgIFwibCAtMS41IDEuNVwiLFxuICAgICAgICBcImMgLTEgMSAtMiAyIC00IDJcIixcbiAgICAgICAgXCJoIC04XCIsXG4gICAgICAgIFwiYyAtMiAwIC0zIC0xIC00IC0yXCIsXG4gICAgICAgIFwibCAtMS41IC0xLjVcIixcbiAgICAgICAgXCJjIC0xIC0xIC0yIC0yIC00IC0yXCIsXG4gICAgICBdKVxuICAgIH1cbiAgICBpZiAoaW5zZXQgPT09IDApIHtcbiAgICAgIGFyci5wdXNoKFwiTFwiLCBpbnNldCArIDQsIHkpXG4gICAgICBhcnIucHVzaChcImEgNCA0IDAgMCAxIC00IC00XCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFyci5wdXNoKFwiTFwiLCBpbnNldCArIDQsIHkpXG4gICAgICBhcnIucHVzaChcImEgNCA0IDAgMCAwIC00IDRcIilcbiAgICB9XG4gICAgcmV0dXJuIGFyci5qb2luKFwiIFwiKVxuICB9LFxuXG4gIGdldEFybSh3LCBhcm1Ub3ApIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJMXCIsIDEwLCBhcm1Ub3AgLSA0LFxuICAgICAgXCJhIC00IC00IDAgMCAwIDQgNFwiLFxuICAgICAgXCJMXCIsIHcgLSA0LCBhcm1Ub3AsXG4gICAgICBcImEgNCA0IDAgMCAxIDQgNFwiXG4gICAgXS5qb2luKFwiIFwiKVxuICB9LFxuICBcbiAgXG5cbiAgc3RhY2tSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSwgMCksIFwiWlwiXSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbU1ZHLmdldFRvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIGZhbHNlLCAwKSwgXCJaXCJdXG4gIH0sXG5cbiAgcmluZ0NhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbU1ZHLmdldFJpbmdUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCBmYWxzZSwgMCksIFwiWlwiXVxuICB9LFxuXG4gIGNhcFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLmNhcFBhdGgodywgaCksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBoYXRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIiwgMCwgMTIsXG4gICAgICAgIFNWRy5hcmMoMCwgMTAsIDY1LCAxMCwgNjUsIDg1KSxcbiAgICAgICAgXCJMXCIsIHctNCwgMTAsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUodyAtIDQsIDEwLCB3LCAxMCArIDQsIDApLFxuICAgICAgICBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSksXG4gICAgICAgIFwiWlwiLFxuICAgICAgXSxcbiAgICB9KSk7XG4gIH0sXG5cbiAgY3VydmUocDF4LCBwMXksIHAyeCwgcDJ5LCByb3VuZG5lc3MpIHtcbiAgICB2YXIgcm91bmRuZXNzID0gcm91bmRuZXNzIHx8IDAuNDJcbiAgICB2YXIgbWlkWCA9IChwMXggKyBwMngpIC8gMi4wXG4gICAgdmFyIG1pZFkgPSAocDF5ICsgcDJ5KSAvIDIuMFxuICAgIHZhciBjeCA9IE1hdGgucm91bmQobWlkWCArIHJvdW5kbmVzcyAqIChwMnkgLSBwMXkpKVxuICAgIHZhciBjeSA9IE1hdGgucm91bmQobWlkWSAtIHJvdW5kbmVzcyAqIChwMnggLSBwMXgpKVxuICAgIHJldHVybiBbY3gsIGN5LCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICBwcm9jSGF0QmFzZSh3LCBoLCBhcmNoUm91bmRuZXNzLCBwcm9wcykge1xuICAgIC8vIFRPRE8gdXNlIGFyYygpXG4gICAgLy8gdmFyIGFyY2hSb3VuZG5lc3MgPSBNYXRoLm1pbigwLjIsIDM1IC8gdyk7IC8vdXNlZCBpbiBzY3JhdGNoYmxvY2tzMlxuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsIDAsIGgtMyxcbiAgICAgICAgXCJMXCIsIDAsIDEwLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKDAsIDEwLCAxNSwgLTUsIDApLFxuICAgICAgICBcIkxcIiwgdy0xNSwgLTUsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUody0xNSwgLTUsIHcsIDEwLCAwKSxcbiAgICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUpLFxuICAgICAgXSxcbiAgICB9KSk7XG4gIH0sXG5cbiAgcHJvY0hhdENhcCh3LCBoLCBhcmNoUm91bmRuZXNzKSB7XG4gICAgLy8gVE9ETyB1c2UgYXJjKClcbiAgICAvLyBUT0RPIHRoaXMgZG9lc24ndCBsb29rIHF1aXRlIHJpZ2h0XG4gICAgcmV0dXJuIFNWRy5wYXRoKHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsXG4gICAgICAgIC0xLFxuICAgICAgICAxMyxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSgtMSwgMTMsIHcgKyAxLCAxMywgYXJjaFJvdW5kbmVzcyksXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUodyArIDEsIDEzLCB3LCAxNiwgMC42KSxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSh3LCAxNiwgMCwgMTYsIC1hcmNoUm91bmRuZXNzKSxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSgwLCAxNiwgLTEsIDEzLCAwLjYpLFxuICAgICAgICBcIlpcIixcbiAgICAgIF0sXG4gICAgICBjbGFzczogXCJzYi1kZWZpbmUtaGF0LWNhcFwiLFxuICAgIH0pXG4gIH0sXG5cbiAgcHJvY0hhdFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICB2YXIgcSA9IDUyXG4gICAgdmFyIHkgPSBoIC0gcVxuXG4gICAgdmFyIGFyY2hSb3VuZG5lc3MgPSBNYXRoLm1pbigwLjIsIDM1IC8gdylcblxuICAgIHJldHVybiBTVkcubW92ZShcbiAgICAgIDAsXG4gICAgICB5LFxuICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgU1ZHLnByb2NIYXRCYXNlKHcsIHEsIGFyY2hSb3VuZG5lc3MsIHByb3BzKSxcbiAgICAgICAgLy9TVkcucHJvY0hhdENhcCh3LCBxLCBhcmNoUm91bmRuZXNzKSxcbiAgICAgIF0pXG4gICAgKVxuICB9LFxuXG4gIG1vdXRoUmVjdCh3LCBoLCBpc0ZpbmFsLCBsaW5lcywgcHJvcHMpIHtcbiAgICB2YXIgeSA9IGxpbmVzWzBdLmhlaWdodFxuICAgIHZhciBwID0gW1NWRy5nZXRUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCB5LCB0cnVlLCAxMCldXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsaW5lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIGlzTGFzdCA9IGkgKyAyID09PSBsaW5lcy5sZW5ndGhcblxuICAgICAgeSArPSBsaW5lc1tpXS5oZWlnaHQgLSAzXG4gICAgICBwLnB1c2goU1ZHLmdldEFybSh3LCB5KSlcblxuICAgICAgdmFyIGhhc05vdGNoID0gIShpc0xhc3QgJiYgaXNGaW5hbClcbiAgICAgIHZhciBpbnNldCA9IGlzTGFzdCA/IDAgOiAxMFxuICAgICAgeSArPSBsaW5lc1tpICsgMV0uaGVpZ2h0ICsgM1xuICAgICAgcC5wdXNoKFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCB5LCBoYXNOb3RjaCwgaW5zZXQpKVxuICAgIH1cbiAgICBwLnB1c2goXCJaXCIpXG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IHAsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICByaW5nUmVjdCh3LCBoLCBjeSwgY3csIGNoLCBzaGFwZSwgcHJvcHMpIHtcbiAgICB2YXIgciA9IDhcbiAgICB2YXIgZnVuYyA9XG4gICAgICBzaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgICAgID8gU1ZHLnJvdW5kZWRQYXRoXG4gICAgICAgIDogc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgICAgICAgPyBTVkcucG9pbnRlZFBhdGhcbiAgICAgICAgICA6IGN3IDwgNDAgPyBTVkcucmluZ0NhcFBhdGggOiBTVkcuY2FwUGF0aFxuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBbXG4gICAgICAgICAgXCJNXCIsXG4gICAgICAgICAgcixcbiAgICAgICAgICAwLFxuICAgICAgICAgIFNWRy5hcmN3KHIsIDAsIDAsIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmN3KDAsIGggLSByLCByLCBoLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjdyh3IC0gciwgaCwgdywgaCAtIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmN3KHcsIHIsIHcgLSByLCAwLCByLCByKSxcbiAgICAgICAgICBcIlpcIixcbiAgICAgICAgICBTVkcudHJhbnNsYXRlUGF0aCg0LCBjeSB8fCA0LCBmdW5jKGN3LCBjaCkuam9pbihcIiBcIikpLFxuICAgICAgICBdLFxuICAgICAgICBcImZpbGwtcnVsZVwiOiBcImV2ZW4tb2RkXCIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBjb21tZW50UmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHZhciByID0gNlxuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBjbGFzczogXCJzYi1jb21tZW50XCIsXG4gICAgICAgIHBhdGg6IFtcbiAgICAgICAgICBcIk1cIixcbiAgICAgICAgICByLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgU1ZHLmFyYyh3IC0gciwgMCwgdywgciwgciwgciksXG4gICAgICAgICAgU1ZHLmFyYyh3LCBoIC0gciwgdyAtIHIsIGgsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmMociwgaCwgMCwgaCAtIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmMoMCwgciwgciwgMCwgciwgciksXG4gICAgICAgICAgXCJaXCIsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBjb21tZW50TGluZSh3aWR0aCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLm1vdmUoXG4gICAgICAtd2lkdGgsXG4gICAgICA5LFxuICAgICAgU1ZHLnJlY3QoXG4gICAgICAgIHdpZHRoLFxuICAgICAgICAyLFxuICAgICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgICBjbGFzczogXCJzYi1jb21tZW50LWxpbmVcIixcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICApXG4gIH0sXG5cbiAgc3RyaWtldGhyb3VnaExpbmUodywgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogW1wiTVwiLCAwLCAwLCBcIkxcIiwgdywgMF0sXG4gICAgICAgIGNsYXNzOiBcInNiLWRpZmYgc2ItZGlmZi1kZWxcIixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIHZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG5cbiAgdmFyIEZpbHRlciA9IGZ1bmN0aW9uKGlkLCBwcm9wcykge1xuICAgIHRoaXMuZWwgPSBTVkcuZWwoXG4gICAgICBcImZpbHRlclwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgeDA6IFwiLTUwJVwiLFxuICAgICAgICB5MDogXCItNTAlXCIsXG4gICAgICAgIHdpZHRoOiBcIjIwMCVcIixcbiAgICAgICAgaGVpZ2h0OiBcIjIwMCVcIixcbiAgICAgIH0pXG4gICAgKVxuICAgIHRoaXMuaGlnaGVzdElkID0gMFxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuZmUgPSBmdW5jdGlvbihuYW1lLCBwcm9wcywgY2hpbGRyZW4pIHtcbiAgICB2YXIgc2hvcnROYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL2dhdXNzaWFufG9zaXRlLywgXCJcIilcbiAgICB2YXIgaWQgPSBbc2hvcnROYW1lLCBcIi1cIiwgKyt0aGlzLmhpZ2hlc3RJZF0uam9pbihcIlwiKVxuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQoXG4gICAgICBTVkcud2l0aENoaWxkcmVuKFxuICAgICAgICBTVkcuZWwoXG4gICAgICAgICAgXCJmZVwiICsgbmFtZSxcbiAgICAgICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgICAgIHJlc3VsdDogaWQsXG4gICAgICAgICAgfSlcbiAgICAgICAgKSxcbiAgICAgICAgY2hpbGRyZW4gfHwgW11cbiAgICAgIClcbiAgICApXG4gICAgcmV0dXJuIGlkXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5jb21wID0gZnVuY3Rpb24ob3AsIGluMSwgaW4yLCBwcm9wcykge1xuICAgIHJldHVybiB0aGlzLmZlKFxuICAgICAgXCJDb21wb3NpdGVcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBvcGVyYXRvcjogb3AsXG4gICAgICAgIGluOiBpbjEsXG4gICAgICAgIGluMjogaW4yLFxuICAgICAgfSlcbiAgICApXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKGluMSwgaW4yKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcChcImFyaXRobWV0aWNcIiwgaW4xLCBpbjIsIHsgazI6ICsxLCBrMzogLTEgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLm9mZnNldCA9IGZ1bmN0aW9uKGR4LCBkeSwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJPZmZzZXRcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIGR4OiBkeCxcbiAgICAgIGR5OiBkeSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuZmxvb2QgPSBmdW5jdGlvbihjb2xvciwgb3BhY2l0eSwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJGbG9vZFwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgXCJmbG9vZC1jb2xvclwiOiBjb2xvcixcbiAgICAgIFwiZmxvb2Qtb3BhY2l0eVwiOiBvcGFjaXR5LFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5ibHVyID0gZnVuY3Rpb24oZGV2LCBpbjEpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIkdhdXNzaWFuQmx1clwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgc3RkRGV2aWF0aW9uOiBbZGV2LCBkZXZdLmpvaW4oXCIgXCIpLFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5jb2xvck1hdHJpeCA9IGZ1bmN0aW9uKGluMSwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJDb2xvck1hdHJpeFwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgdHlwZTogXCJtYXRyaXhcIixcbiAgICAgIHZhbHVlczogdmFsdWVzLmpvaW4oXCIgXCIpLFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XG4gICAgdGhpcy5mZShcbiAgICAgIFwiTWVyZ2VcIixcbiAgICAgIHt9LFxuICAgICAgY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFNWRy5lbChcImZlTWVyZ2VOb2RlXCIsIHtcbiAgICAgICAgICBpbjogbmFtZSxcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIEZpbHRlclxufSkoKVxuIiwiLypcbiAqIHNjcmF0Y2hibG9ja3NcbiAqIGh0dHA6Ly9zY3JhdGNoYmxvY2tzLmdpdGh1Yi5pby9cbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE2LCBUaW0gUmFkdmFuXG4gKiBAbGljZW5zZSBNSVRcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqL1xuOyhmdW5jdGlvbihtb2QpIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vZFxuICB9IGVsc2Uge1xuICAgIHZhciBtYWtlQ2FudmFzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxuICAgIH1cbiAgICB2YXIgc2NyYXRjaGJsb2NrcyA9ICh3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZCh3aW5kb3csIG1ha2VDYW52YXMpKVxuXG4gICAgLy8gYWRkIG91ciBDU1MgdG8gdGhlIHBhZ2VcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmF0Y2hibG9ja3MubWFrZVN0eWxlKCkpXG4gIH1cbn0pKGZ1bmN0aW9uKHdpbmRvdywgbWFrZUNhbnZhcykge1xuICBcInVzZSBzdHJpY3RcIlxuXG4gIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuXG4gIC8qIHV0aWxzICovXG5cbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIHsgYWxsTGFuZ3VhZ2VzLCBsb2FkTGFuZ3VhZ2VzIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICB2YXIgcGFyc2UgPSByZXF1aXJlKFwiLi9zeW50YXguanNcIikucGFyc2VcblxuICB2YXIgc3R5bGUgPSByZXF1aXJlKFwiLi9zdHlsZS5qc1wiKVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIge1xuICAgIExhYmVsLFxuICAgIEljb24sXG4gICAgSW5wdXQsXG4gICAgQmxvY2ssXG4gICAgQ29tbWVudCxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH0gPSByZXF1aXJlKFwiLi9tb2RlbC5qc1wiKVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxuICBTVkcuaW5pdCh3aW5kb3csIG1ha2VDYW52YXMpXG5cbiAgTGFiZWwubWVhc3VyaW5nID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBTVkcubWFrZUNhbnZhcygpXG4gICAgcmV0dXJuIGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIilcbiAgfSkoKVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICBmdW5jdGlvbiByZW5kZXIoZG9jLCBjYikge1xuICAgIHJldHVybiBkb2MucmVuZGVyKGNiKVxuICB9XG5cbiAgLyoqKiBSZW5kZXIgKioqL1xuXG4gIC8vIHJlYWQgY29kZSBmcm9tIGEgRE9NIGVsZW1lbnRcbiAgZnVuY3Rpb24gcmVhZENvZGUoZWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgdmFyIGh0bWwgPSBlbC5pbm5lckhUTUwucmVwbGFjZSgvPGJyPlxccz98XFxufFxcclxcbnxcXHIvZ2ksIFwiXFxuXCIpXG4gICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIilcbiAgICBwcmUuaW5uZXJIVE1MID0gaHRtbFxuICAgIHZhciBjb2RlID0gcHJlLnRleHRDb250ZW50XG4gICAgaWYgKG9wdGlvbnMuaW5saW5lKSB7XG4gICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFwiXFxuXCIsIFwiXCIpXG4gICAgfVxuICAgIHJldHVybiBjb2RlXG4gIH1cblxuICAvLyBpbnNlcnQgJ3N2ZycgaW50byAnZWwnLCB3aXRoIGFwcHJvcHJpYXRlIHdyYXBwZXIgZWxlbWVudHNcbiAgZnVuY3Rpb24gcmVwbGFjZShlbCwgc3ZnLCBzY3JpcHRzLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuaW5saW5lKSB7XG4gICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIilcbiAgICAgIHZhciBjbHMgPSBcInNjcmF0Y2hibG9ja3Mgc2NyYXRjaGJsb2Nrcy1pbmxpbmVcIlxuICAgICAgaWYgKHNjcmlwdHNbMF0gJiYgIXNjcmlwdHNbMF0uaXNFbXB0eSkge1xuICAgICAgICBjbHMgKz0gXCIgc2NyYXRjaGJsb2Nrcy1pbmxpbmUtXCIgKyBzY3JpcHRzWzBdLmJsb2Nrc1swXS5zaGFwZVxuICAgICAgfVxuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNsc1xuICAgICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiXG4gICAgICBjb250YWluZXIuc3R5bGUudmVydGljYWxBbGlnbiA9IFwibWlkZGxlXCJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSBcInNjcmF0Y2hibG9ja3NcIlxuICAgIH1cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3ZnKVxuXG4gICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgIGVsLmFwcGVuZENoaWxkKGNvbnRhaW5lcilcbiAgfVxuXG4gIC8qIFJlbmRlciBhbGwgbWF0Y2hpbmcgZWxlbWVudHMgaW4gcGFnZSB0byBzaGlueSBzY3JhdGNoIGJsb2Nrcy5cbiAgICogQWNjZXB0cyBhIENTUyBzZWxlY3RvciBhcyBhbiBhcmd1bWVudC5cbiAgICpcbiAgICogIHNjcmF0Y2hibG9ja3MucmVuZGVyTWF0Y2hpbmcoXCJwcmUuYmxvY2tzXCIpO1xuICAgKlxuICAgKiBMaWtlIHRoZSBvbGQgJ3NjcmF0Y2hibG9ja3MyLnBhcnNlKCkuXG4gICAqL1xuICB2YXIgcmVuZGVyTWF0Y2hpbmcgPSBmdW5jdGlvbihzZWxlY3Rvciwgb3B0aW9ucykge1xuICAgIHZhciBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IFwicHJlLmJsb2Nrc1wiXG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoXG4gICAgICB7XG4gICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICAgIGxhbmd1YWdlczogW1wiZW5cIl0sXG5cbiAgICAgICAgcmVhZDogcmVhZENvZGUsIC8vIGZ1bmN0aW9uKGVsLCBvcHRpb25zKSA9PiBjb2RlXG4gICAgICAgIHBhcnNlOiBwYXJzZSwgLy8gZnVuY3Rpb24oY29kZSwgb3B0aW9ucykgPT4gZG9jXG4gICAgICAgIHJlbmRlcjogcmVuZGVyLCAvLyBmdW5jdGlvbihkb2MsIGNiKSA9PiBzdmdcbiAgICAgICAgcmVwbGFjZTogcmVwbGFjZSwgLy8gZnVuY3Rpb24oZWwsIHN2ZywgZG9jLCBvcHRpb25zKVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICAvLyBmaW5kIGVsZW1lbnRzXG4gICAgdmFyIHJlc3VsdHMgPSBbXS5zbGljZS5hcHBseShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlcbiAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcbiAgICAgIHZhciBjb2RlID0gb3B0aW9ucy5yZWFkKGVsLCBvcHRpb25zKVxuXG4gICAgICB2YXIgZG9jID0gb3B0aW9ucy5wYXJzZShjb2RlLCBvcHRpb25zKVxuXG4gICAgICBvcHRpb25zLnJlbmRlcihkb2MsIGZ1bmN0aW9uKHN2Zykge1xuICAgICAgICBvcHRpb25zLnJlcGxhY2UoZWwsIHN2ZywgZG9jLCBvcHRpb25zKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyogUGFyc2Ugc2NyYXRjaGJsb2NrcyBjb2RlIGFuZCByZXR1cm4gWE1MIHN0cmluZy5cbiAgICpcbiAgICogQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIE5vZGUsIHJlYWxseS5cbiAgICovXG4gIHZhciByZW5kZXJTVkdTdHJpbmcgPSBmdW5jdGlvbihjb2RlLCBvcHRpb25zKSB7XG4gICAgdmFyIGRvYyA9IHBhcnNlKGNvZGUsIG9wdGlvbnMpXG5cbiAgICAvLyBXQVJOOiBEb2N1bWVudC5yZW5kZXIoKSBtYXkgYmVjb21lIGFzeW5jIGFnYWluIGluIGZ1dHVyZSA6LShcbiAgICBkb2MucmVuZGVyKGZ1bmN0aW9uKCkge30pXG5cbiAgICByZXR1cm4gZG9jLmV4cG9ydFNWR1N0cmluZygpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFsbExhbmd1YWdlczogYWxsTGFuZ3VhZ2VzLCAvLyByZWFkLW9ubHlcbiAgICBsb2FkTGFuZ3VhZ2VzOiBsb2FkTGFuZ3VhZ2VzLFxuXG4gICAgZnJvbUpTT046IERvY3VtZW50LmZyb21KU09OLFxuICAgIHRvSlNPTjogZnVuY3Rpb24oZG9jKSB7XG4gICAgICByZXR1cm4gZG9jLnRvSlNPTigpXG4gICAgfSxcbiAgICBzdHJpbmdpZnk6IGZ1bmN0aW9uKGRvYykge1xuICAgICAgcmV0dXJuIGRvYy5zdHJpbmdpZnkoKVxuICAgIH0sXG5cbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuXG4gICAgcmVhZDogcmVhZENvZGUsXG4gICAgcGFyc2U6IHBhcnNlLFxuICAgIC8vIHJlbmRlcjogcmVuZGVyLCAvLyBSRU1PVkVEIHNpbmNlIGRvYy5yZW5kZXIoY2IpIG1ha2VzIG11Y2ggbW9yZSBzZW5zZVxuICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgcmVuZGVyTWF0Y2hpbmc6IHJlbmRlck1hdGNoaW5nLFxuXG4gICAgcmVuZGVyU1ZHU3RyaW5nOiByZW5kZXJTVkdTdHJpbmcsXG4gICAgbWFrZVN0eWxlOiBzdHlsZS5tYWtlU3R5bGUsXG4gIH1cbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxuICB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykge1xuICAgIHJldHVybiBvICYmIG8uY29uc3RydWN0b3IgPT09IEFycmF5XG4gIH1cbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICBmdW5jdGlvbiBpbmRlbnQodGV4dCkge1xuICAgIHJldHVybiB0ZXh0XG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICByZXR1cm4gXCIgIFwiICsgbGluZVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXCIpXG4gIH1cblxuICBmdW5jdGlvbiBtYXliZU51bWJlcih2KSB7XG4gICAgdiA9IFwiXCIgKyB2XG4gICAgdmFyIG4gPSBwYXJzZUludCh2KVxuICAgIGlmICghaXNOYU4obikpIHtcbiAgICAgIHJldHVybiBuXG4gICAgfVxuICAgIHZhciBmID0gcGFyc2VGbG9hdCh2KVxuICAgIGlmICghaXNOYU4oZikpIHtcbiAgICAgIHJldHVybiBmXG4gICAgfVxuICAgIHJldHVybiB2XG4gIH1cblxuICB2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxuXG4gIHZhciB7XG4gICAgZGVmYXVsdEZvbnRGYW1pbHksXG4gICAgbWFrZVN0eWxlLFxuICAgIG1ha2VJY29ucyxcbiAgICBkYXJrUmVjdCxcbiAgICBiZXZlbEZpbHRlcixcbiAgICBkYXJrRmlsdGVyLFxuICAgIGRlc2F0dXJhdGVGaWx0ZXIsXG4gIH0gPSByZXF1aXJlKFwiLi9zdHlsZS5qc1wiKVxuXG4gIHZhciB7XG4gICAgYmxvY2tzQnlTZWxlY3RvcixcbiAgICBwYXJzZVNwZWMsXG4gICAgaW5wdXRQYXQsXG4gICAgaWNvblBhdCxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgdW5pY29kZUljb25zLFxuICAgIGVuZ2xpc2gsXG4gICAgYmxvY2tOYW1lLFxuICB9ID0gcmVxdWlyZShcIi4vYmxvY2tzLmpzXCIpXG5cbiAgLyogTGFiZWwgKi9cblxuICB2YXIgTGFiZWwgPSBmdW5jdGlvbih2YWx1ZSwgY2xzKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jbHMgPSBjbHMgfHwgXCJcIlxuICAgIHRoaXMuZWwgPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSAxMVxuICAgIHRoaXMubWV0cmljcyA9IG51bGxcbiAgICB0aGlzLnggPSAwXG4gIH1cbiAgTGFiZWwucHJvdG90eXBlLmlzTGFiZWwgPSB0cnVlXG5cbiAgTGFiZWwucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBcIjxcIiB8fCB0aGlzLnZhbHVlID09PSBcIj5cIikgcmV0dXJuIHRoaXMudmFsdWVcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5yZXBsYWNlKC8oWzw+W1xcXSgpe31dKS9nLCBcIlxcXFwkMVwiKVxuICB9XG5cbiAgTGFiZWwucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbFxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExhYmVsLnByb3RvdHlwZSwgXCJ3aWR0aFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm1ldHJpY3Mud2lkdGhcbiAgICB9LFxuICB9KVxuXG4gIExhYmVsLm1ldHJpY3NDYWNoZSA9IHt9XG4gIExhYmVsLnRvTWVhc3VyZSA9IFtdXG5cbiAgTGFiZWwucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlXG4gICAgdmFyIGNscyA9IHRoaXMuY2xzXG4gICAgdGhpcy5lbCA9IFNWRy50ZXh0KDAsIDEwLCB2YWx1ZSwge1xuICAgICAgY2xhc3M6IFwic2ItbGFiZWwgXCIgKyBjbHMsXG4gICAgfSlcblxuICAgIHZhciBjYWNoZSA9IExhYmVsLm1ldHJpY3NDYWNoZVtjbHNdXG4gICAgaWYgKCFjYWNoZSkge1xuICAgICAgY2FjaGUgPSBMYWJlbC5tZXRyaWNzQ2FjaGVbY2xzXSA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoY2FjaGUsIHZhbHVlKSkge1xuICAgICAgdGhpcy5tZXRyaWNzID0gY2FjaGVbdmFsdWVdXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmb250ID0gL3NiLWNvbW1lbnQtbGFiZWwvLnRlc3QodGhpcy5jbHMpXG4gICAgICAgID8gXCJub3JtYWwgMTFweCAnSGVsdmV0aWNhIE5ldWUnLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWZcIlxuICAgICAgICA6IC9zYi1saXRlcmFsLy50ZXN0KHRoaXMuY2xzKVxuICAgICAgICAgID8gXCJub3JtYWwgMTFweCBcIiArIGRlZmF1bHRGb250RmFtaWx5XG4gICAgICAgICAgOiBcImJvbGQgMTFweCBcIiArIGRlZmF1bHRGb250RmFtaWx5XG4gICAgICB0aGlzLm1ldHJpY3MgPSBjYWNoZVt2YWx1ZV0gPSBMYWJlbC5tZWFzdXJlKHZhbHVlLCBmb250KVxuICAgICAgLy8gVE9ETzogd29yZC1zcGFjaW5nPyAoZm9ydHVuYXRlbHkgaXQgc2VlbXMgdG8gaGF2ZSBubyBlZmZlY3QhKVxuICAgIH1cbiAgfVxuICAvL1RleHQgYm94IHNjYWxpbmdcbiAgTGFiZWwubWVhc3VyZSA9IGZ1bmN0aW9uKHZhbHVlLCBmb250KSB7XG4gICAgdmFyIGNvbnRleHQgPSBMYWJlbC5tZWFzdXJpbmdcbiAgICBjb250ZXh0LmZvbnQgPSBmb250XG4gICAgdmFyIHRleHRNZXRyaWNzID0gY29udGV4dC5tZWFzdXJlVGV4dCh2YWx1ZSlcbiAgICB2YXIgd2lkdGggPSAodGV4dE1ldHJpY3Mud2lkdGgpIHwgLTAuNzVcbiAgICByZXR1cm4geyB3aWR0aDogd2lkdGggfVxuICB9XG5cbiAgLyogSWNvbiAqL1xuXG4gIHZhciBJY29uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmlzQXJyb3cgPSBuYW1lID09PSBcImxvb3BBcnJvd1wiXG5cbiAgICB2YXIgaW5mbyA9IEljb24uaWNvbnNbbmFtZV1cbiAgICBhc3NlcnQoaW5mbywgXCJubyBpbmZvIGZvciBpY29uIFwiICsgbmFtZSlcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluZm8pXG4gIH1cbiAgSWNvbi5wcm90b3R5cGUuaXNJY29uID0gdHJ1ZVxuXG4gIEljb24ucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB1bmljb2RlSWNvbnNbXCJAXCIgKyB0aGlzLm5hbWVdIHx8IFwiXCJcbiAgfVxuXG4gIEljb24uaWNvbnMgPSB7XG4gICAgZ3JlZW5GbGFnOiB7IHdpZHRoOiAxMCwgaGVpZ2h0OiA1LCBkeTogLTggfSxcbiAgICB0dXJuTGVmdDogeyB3aWR0aDogMTUsIGhlaWdodDogMTIsIGR5OiArMSB9LFxuICAgIHR1cm5SaWdodDogeyB3aWR0aDogMTUsIGhlaWdodDogMTIsIGR5OiArMSB9LFxuICAgIGxvb3BBcnJvdzogeyB3aWR0aDogMTQsIGhlaWdodDogMTEgfSxcbiAgICBhZGRJbnB1dDogeyB3aWR0aDogNCwgaGVpZ2h0OiA4IH0sXG4gICAgZGVsSW5wdXQ6IHsgd2lkdGg6IDQsIGhlaWdodDogOCB9LFxuICB9XG4gIEljb24ucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gU1ZHLnN5bWJvbChcIiNcIiArIHRoaXMubmFtZSwge1xuICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgIH0pXG4gIH1cblxuICAvKiBJbnB1dCAqL1xuXG4gIHZhciBJbnB1dCA9IGZ1bmN0aW9uKHNoYXBlLCB2YWx1ZSwgbWVudSkge1xuICAgIHRoaXMuc2hhcGUgPSBzaGFwZVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMubWVudSA9IG1lbnUgfHwgbnVsbFxuXG4gICAgdGhpcy5pc1JvdW5kID0gc2hhcGUgPT09IFwibnVtYmVyXCIgfHwgc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwicm91bmQtZHJvcGRvd25cIiB8fCBzaGFwZSA9PT0gXCJzdHJpbmdcIlxuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgdGhpcy5pc1N0YWNrID0gc2hhcGUgPT09IFwic3RhY2tcIlxuICAgIHRoaXMuaXNJbnNldCA9XG4gICAgICBzaGFwZSA9PT0gXCJib29sZWFuXCIgfHwgc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgdGhpcy5pc0NvbG9yID0gc2hhcGUgPT09IFwiY29sb3JcIlxuICAgIHRoaXMuaGFzQXJyb3cgPSBzaGFwZSA9PT0gXCJkcm9wZG93blwiIHx8IHNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiIHx8IHNoYXBlID09PSBcInJvdW5kLWRyb3Bkb3duXCJcbiAgICB0aGlzLmlzRGFya2VyID1cbiAgICAgIHNoYXBlID09PSBcImJvb2xlYW5cIiB8fCBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwicm91bmQtZHJvcGRvd25cIlxuICAgIHRoaXMuaXNTcXVhcmUgPVxuICAgICAgc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuXG4gICAgdGhpcy5oYXNMYWJlbCA9ICEodGhpcy5pc0NvbG9yIHx8IHRoaXMuaXNJbnNldClcbiAgICB0aGlzLmxhYmVsID0gdGhpcy5oYXNMYWJlbFxuICAgICAgPyBuZXcgTGFiZWwodmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICAgIDogbnVsbFxuICAgIHRoaXMueCA9IDBcbiAgfVxuICBJbnB1dC5wcm90b3R5cGUuaXNJbnB1dCA9IHRydWVcblxuICBJbnB1dC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIHZhbHVlLCBwYXJ0KSB7XG4gICAgdmFyIHNoYXBlID0ge1xuICAgICAgYjogXCJib29sZWFuXCIsXG4gICAgICBuOiBcIm51bWJlclwiLFxuICAgICAgczogXCJzdHJpbmdcIixcbiAgICAgIGQ6IFwibnVtYmVyLWRyb3Bkb3duXCIsXG4gICAgICBtOiBcImRyb3Bkb3duXCIsXG4gICAgICBjOiBcImNvbG9yXCIsXG4gICAgICByOiBcInJvdW5kLWRyb3Bkb3duXCIsXG4gICAgfVtwYXJ0WzFdXVxuXG4gICAgaWYgKHNoYXBlID09PSBcImNvbG9yXCIpIHtcbiAgICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApXG4gICAgICAgIHZhbHVlID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDI1NiAqIDI1NiAqIDI1NilcbiAgICAgIHZhbHVlID0gK3ZhbHVlXG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgICAgIHZhciBoZXggPSB2YWx1ZS50b1N0cmluZygxNilcbiAgICAgIGhleCA9IGhleC5zbGljZShNYXRoLm1heCgwLCBoZXgubGVuZ3RoIC0gNikpIC8vIGxhc3QgNiBjaGFyYWN0ZXJzXG4gICAgICB3aGlsZSAoaGV4Lmxlbmd0aCA8IDYpIGhleCA9IFwiMFwiICsgaGV4XG4gICAgICBpZiAoaGV4WzBdID09PSBoZXhbMV0gJiYgaGV4WzJdID09PSBoZXhbM10gJiYgaGV4WzRdID09PSBoZXhbNV0pIHtcbiAgICAgICAgaGV4ID0gaGV4WzBdICsgaGV4WzJdICsgaGV4WzRdXG4gICAgICB9XG4gICAgICB2YWx1ZSA9IFwiI1wiICsgaGV4XG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICB2YWx1ZSA9XG4gICAgICAgIHtcbiAgICAgICAgICBfbW91c2VfOiBcIm1vdXNlLXBvaW50ZXJcIixcbiAgICAgICAgICBfbXlzZWxmXzogXCJteXNlbGZcIixcbiAgICAgICAgICBfc3RhZ2VfOiBcIlN0YWdlXCIsXG4gICAgICAgICAgX2VkZ2VfOiBcImVkZ2VcIixcbiAgICAgICAgICBfcmFuZG9tXzogXCJyYW5kb20gcG9zaXRpb25cIixcbiAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIHZhciBtZW51ID0gdmFsdWVcbiAgICAgIHZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIikge1xuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSBcInJvdW5kLWRyb3Bkb3duXCIpIHtcbiAgICAgIHZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJbnB1dChzaGFwZSwgXCJcIiArIHZhbHVlLCBtZW51KVxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzQ29sb3IpIHtcbiAgICAgIGFzc2VydCh0aGlzLnZhbHVlWzBdID09PSBcIiNcIilcbiAgICAgIHZhciBoID0gdGhpcy52YWx1ZS5zbGljZSgxKVxuICAgICAgaWYgKGgubGVuZ3RoID09PSAzKSBoID0gaFswXSArIGhbMF0gKyBoWzFdICsgaFsxXSArIGhbMl0gKyBoWzJdXG4gICAgICByZXR1cm4gcGFyc2VJbnQoaCwgMTYpXG4gICAgICAvLyBUT0RPIHNpZ25lZCBpbnQ/XG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLm1lbnUgfHwgdGhpcy52YWx1ZVxuICAgICAgaWYgKHRoaXMuc2hhcGUgPT09IFwiZHJvcGRvd25cIikge1xuICAgICAgICB2YWx1ZSA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJtb3VzZS1wb2ludGVyXCI6IFwiX21vdXNlX1wiLFxuICAgICAgICAgICAgbXlzZWxmOiBcIl9teXNlbGZcIixcbiAgICAgICAgICAgIFN0YWdlOiBcIl9zdGFnZV9cIixcbiAgICAgICAgICAgIGVkZ2U6IFwiX2VkZ2VfXCIsXG4gICAgICAgICAgICBcInJhbmRvbSBwb3NpdGlvblwiOiBcIl9yYW5kb21fXCIsXG4gICAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzUm91bmQpIHtcbiAgICAgICAgdmFsdWUgPSBtYXliZU51bWJlcih2YWx1ZSlcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pc0Jvb2xlYW5cbiAgICAgID8gZmFsc2VcbiAgICAgIDogdGhpcy5pc1JvdW5kID8gbWF5YmVOdW1iZXIodGhpcy52YWx1ZSkgOiB0aGlzLnZhbHVlXG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgYXNzZXJ0KHRoaXMudmFsdWVbMF0gPT09IFwiI1wiKVxuICAgICAgcmV0dXJuIFwiW1wiICsgdGhpcy52YWx1ZSArIFwiXVwiXG4gICAgfVxuICAgIHZhciB0ZXh0ID0gKHRoaXMudmFsdWUgPyBcIlwiICsgdGhpcy52YWx1ZSA6IFwiXCIpXG4gICAgICAucmVwbGFjZSgvIHYkLywgXCIgXFxcXHZcIilcbiAgICAgIC5yZXBsYWNlKC8oW1xcXVxcXFxdKS9nLCBcIlxcXFwkMVwiKVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB0ZXh0ICs9IFwiIHZcIlxuICAgIHJldHVybiB0aGlzLmlzUm91bmRcbiAgICAgID8gXCIoXCIgKyB0ZXh0ICsgXCIpXCJcbiAgICAgIDogdGhpcy5pc1NxdWFyZVxuICAgICAgICA/IFwiW1wiICsgdGV4dCArIFwiXVwiXG4gICAgICAgIDogdGhpcy5pc0Jvb2xlYW4gPyBcIjw+XCIgOiB0aGlzLmlzU3RhY2sgPyBcInt9XCIgOiB0ZXh0XG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIGlmICh0aGlzLmhhc0Fycm93KSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLm1lbnUgfHwgdGhpcy52YWx1ZVxuICAgICAgdGhpcy52YWx1ZSA9IGxhbmcuZHJvcGRvd25zW3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgdGhpcy5sYWJlbCA9IG5ldyBMYWJlbCh0aGlzLnZhbHVlLCBbXCJzYi1saXRlcmFsLVwiICsgdGhpcy5zaGFwZV0pXG4gICAgfVxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMYWJlbCkgdGhpcy5sYWJlbC5tZWFzdXJlKClcbiAgfVxuXG4gIElucHV0LnNoYXBlcyA9IHtcbiAgICBzdHJpbmc6IFNWRy5waWxsUmVjdCxcbiAgICBudW1iZXI6IFNWRy5waWxsUmVjdCxcbiAgICBcIm51bWJlci1kcm9wZG93blwiOiBTVkcucGlsbFJlY3QsXG4gICAgXCJyb3VuZC1kcm9wZG93blwiOiBTVkcucGlsbFJlY3QsXG4gICAgY29sb3I6IFNWRy5waWxsUmVjdCxcbiAgICBkcm9wZG93bjogU1ZHLnJvdW5kUmVjdCxcblxuICAgIGJvb2xlYW46IFNWRy5wb2ludGVkUmVjdCxcbiAgICBzdGFjazogU1ZHLnN0YWNrUmVjdCxcbiAgICByZXBvcnRlcjogU1ZHLnJvdW5kUmVjdCxcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHtcbiAgICAgIHZhciBsYWJlbCA9IHRoaXMubGFiZWwuZHJhdygpXG4gICAgICB2YXIgdyA9IE1hdGgubWF4KFxuICAgICAgICAyNSxcbiAgICAgICAgdGhpcy5sYWJlbC53aWR0aCArXG4gICAgICAgICAgKHRoaXMuc2hhcGUgPT09IFwic3RyaW5nXCIgfHwgdGhpcy5zaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIiB8fCB0aGlzLnNoYXBlID09PSBcInJlcG9ydGVyXCIgPyAyMCA6IDIwKVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdyA9IHRoaXMuaXNJbnNldCA/IDMwIDogdGhpcy5pc0NvbG9yID8gMjUgOiBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB3ICs9IDhcbiAgICBpZiAodGhpcy5zaGFwZSA9PT0gXCJyb3VuZC1kcm9wZG93blwiKSB3ICs9IDZcbiAgICB0aGlzLndpZHRoID0gd1xuXG4gICAgdmFyIGggPSAodGhpcy5oZWlnaHQgPSB0aGlzLmlzUm91bmQgfHwgdGhpcy5pc0NvbG9yID8gMjAgOiAyMClcblxuICAgIHZhciBlbCA9IElucHV0LnNoYXBlc1t0aGlzLnNoYXBlXSh3LCBoKVxuICAgIGlmICh0aGlzLmlzQ29sb3IpIHtcbiAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICBmaWxsOiB0aGlzLnZhbHVlLFxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNEYXJrZXIpIHtcbiAgICAgIGVsID0gZGFya1JlY3QodywgaCwgcGFyZW50LmluZm8uY2F0ZWdvcnksIGVsKVxuICAgICAgaWYgKHBhcmVudC5pbmZvLmNvbG9yKSB7XG4gICAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICAgIGZpbGw6IHBhcmVudC5pbmZvLmNvbG9yLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGNsYXNzOiBbXCJzYi1pbnB1dFwiLCBcInNiLWlucHV0LVwiICsgdGhpcy5zaGFwZV0uam9pbihcIiBcIiksXG4gICAgICB9KSxcbiAgICBdKVxuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB7XG4gICAgICB2YXIgeCA9IHRoaXMuaXNSb3VuZCA/IDEwIDogNlxuICAgICAgcmVzdWx0LmFwcGVuZENoaWxkKFNWRy5tb3ZlKHgsIDQsIGxhYmVsKSlcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB5ID0gdGhpcy5zaGFwZSA9PT0gXCJkcm9wZG93blwiID8gNCA6IDRcbiAgICAgIGlmICh0aGlzLnNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiKSB7XG4gICAgICAgIHJlc3VsdC5hcHBlbmRDaGlsZChTVkcubW92ZSh3IC0gMTYsIDgsIFNWRy5zeW1ib2woXCIjYmxhY2tEcm9wZG93bkFycm93XCIsIHt9KSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQuYXBwZW5kQ2hpbGQoU1ZHLm1vdmUodyAtIDE2LCA4LCBTVkcuc3ltYm9sKFwiI3doaXRlRHJvcGRvd25BcnJvd1wiLCB7fSkpKVxuICAgICAgfVxuICAgICAgXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qIEJsb2NrICovXG5cbiAgdmFyIEJsb2NrID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGNvbW1lbnQpIHtcbiAgICBhc3NlcnQoaW5mbylcbiAgICB0aGlzLmluZm8gPSBpbmZvXG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgdGhpcy5jb21tZW50ID0gY29tbWVudCB8fCBudWxsXG4gICAgdGhpcy5kaWZmID0gbnVsbFxuXG4gICAgdmFyIHNoYXBlID0gdGhpcy5pbmZvLnNoYXBlXG4gICAgdGhpcy5pc0hhdCA9IHNoYXBlID09PSBcImhhdFwiIHx8IHNoYXBlID09PSBcImRlZmluZS1oYXRcIlxuICAgIHRoaXMuaGFzUHV6emxlID0gc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJoYXRcIlxuICAgIHRoaXMuaXNGaW5hbCA9IC9jYXAvLnRlc3Qoc2hhcGUpXG4gICAgdGhpcy5pc0NvbW1hbmQgPSBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImNhcFwiIHx8IC9ibG9jay8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzT3V0bGluZSA9IHNoYXBlID09PSBcIm91dGxpbmVcIlxuICAgIHRoaXMuaXNSZXBvcnRlciA9IHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICB0aGlzLmlzQm9vbGVhbiA9IHNoYXBlID09PSBcImJvb2xlYW5cIlxuXG4gICAgdGhpcy5pc1JpbmcgPSBzaGFwZSA9PT0gXCJyaW5nXCJcbiAgICB0aGlzLmhhc1NjcmlwdCA9IC9ibG9jay8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzRWxzZSA9IHNoYXBlID09PSBcImNlbHNlXCJcbiAgICB0aGlzLmlzRW5kID0gc2hhcGUgPT09IFwiY2VuZFwiXG5cbiAgICB0aGlzLnggPSAwXG4gICAgdGhpcy53aWR0aCA9IG51bGxcbiAgICB0aGlzLmhlaWdodCA9IG51bGxcbiAgICB0aGlzLmZpcnN0TGluZSA9IG51bGxcbiAgICB0aGlzLmlubmVyV2lkdGggPSBudWxsXG4gIH1cbiAgQmxvY2sucHJvdG90eXBlLmlzQmxvY2sgPSB0cnVlXG5cbiAgQmxvY2suZnJvbUpTT04gPSBmdW5jdGlvbihsYW5nLCBhcnJheSwgcGFydCkge1xuICAgIHZhciBhcmdzID0gYXJyYXkuc2xpY2UoKVxuICAgIHZhciBzZWxlY3RvciA9IGFyZ3Muc2hpZnQoKVxuICAgIGlmIChzZWxlY3RvciA9PT0gXCJwcm9jRGVmXCIpIHtcbiAgICAgIHZhciBzcGVjID0gYXJnc1swXVxuICAgICAgdmFyIGlucHV0TmFtZXMgPSBhcmdzWzFdLnNsaWNlKClcbiAgICAgIC8vIHZhciBkZWZhdWx0VmFsdWVzID0gYXJnc1syXTtcbiAgICAgIC8vIHZhciBpc0F0b21pYyA9IGFyZ3NbM107IC8vIFRPRE9cblxuICAgICAgdmFyIGluZm8gPSBwYXJzZVNwZWMoc3BlYylcbiAgICAgIHZhciBjaGlsZHJlbiA9IGluZm8ucGFydHMubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgaWYgKGlucHV0UGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgICB2YXIgbGFiZWwgPSBuZXcgTGFiZWwoaW5wdXROYW1lcy5zaGlmdCgpKVxuICAgICAgICAgIHJldHVybiBuZXcgQmxvY2soXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNoYXBlOiBwYXJ0WzFdID09PSBcImJcIiA/IFwiYm9vbGVhblwiIDogXCJyZXBvcnRlclwiLFxuICAgICAgICAgICAgICBjYXRlZ29yeTogXCJjdXN0b20tYXJnXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgW2xhYmVsXVxuICAgICAgICAgIClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IExhYmVsKHBhcnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB2YXIgb3V0bGluZSA9IG5ldyBCbG9jayhcbiAgICAgICAge1xuICAgICAgICAgIHNoYXBlOiBcIm91dGxpbmVcIixcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcblxuICAgICAgdmFyIGNoaWxkcmVuID0gW25ldyBMYWJlbChsYW5nLmRlZmluZVswXSksIG91dGxpbmVdXG4gICAgICByZXR1cm4gbmV3IEJsb2NrKFxuICAgICAgICB7XG4gICAgICAgICAgc2hhcGU6IFwiZGVmaW5lLWhhdFwiLFxuICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbVwiLFxuICAgICAgICAgIHNlbGVjdG9yOiBcInByb2NEZWZcIixcbiAgICAgICAgICBjYWxsOiBzcGVjLFxuICAgICAgICAgIG5hbWVzOiBhcmdzWzFdLFxuICAgICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoc2VsZWN0b3IgPT09IFwiY2FsbFwiKSB7XG4gICAgICB2YXIgc3BlYyA9IGFyZ3Muc2hpZnQoKVxuICAgICAgdmFyIGluZm8gPSBleHRlbmQocGFyc2VTcGVjKHNwZWMpLCB7XG4gICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbVwiLFxuICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgICBzZWxlY3RvcjogXCJjYWxsXCIsXG4gICAgICAgIGNhbGw6IHNwZWMsXG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfSlcbiAgICAgIHZhciBwYXJ0cyA9IGluZm8ucGFydHNcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgc2VsZWN0b3IgPT09IFwicmVhZFZhcmlhYmxlXCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImNvbnRlbnRzT2ZMaXN0OlwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiXG4gICAgKSB7XG4gICAgICB2YXIgc2hhcGUgPVxuICAgICAgICBzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiICYmIGFyZ3MucG9wKCkgPT09IFwiYlwiID8gXCJib29sZWFuXCIgOiBcInJlcG9ydGVyXCJcbiAgICAgIHZhciBpbmZvID0ge1xuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgIHNoYXBlOiBzaGFwZSxcbiAgICAgICAgY2F0ZWdvcnk6IHtcbiAgICAgICAgICByZWFkVmFyaWFibGU6IFwidmFyaWFibGVzXCIsXG4gICAgICAgICAgXCJjb250ZW50c09mTGlzdDpcIjogXCJsaXN0XCIsXG4gICAgICAgICAgZ2V0UGFyYW06IFwiY3VzdG9tLWFyZ1wiLFxuICAgICAgICB9W3NlbGVjdG9yXSxcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IEJsb2NrKGluZm8sIFtuZXcgTGFiZWwoYXJnc1swXSldKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaW5mbyA9IGV4dGVuZChibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yXSwge1xuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH0pXG4gICAgICBhc3NlcnQoaW5mbywgXCJ1bmtub3duIHNlbGVjdG9yOiBcIiArIHNlbGVjdG9yKVxuICAgICAgdmFyIHNwZWMgPSBsYW5nLmNvbW1hbmRzW2luZm8uc3BlY10gfHwgc3BlY1xuICAgICAgdmFyIHBhcnRzID0gc3BlYyA/IHBhcnNlU3BlYyhzcGVjKS5wYXJ0cyA6IGluZm8ucGFydHNcbiAgICB9XG4gICAgdmFyIGNoaWxkcmVuID0gcGFydHMubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgIGlmIChpbnB1dFBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmdzLnNoaWZ0KClcbiAgICAgICAgcmV0dXJuIChpc0FycmF5KGFyZykgPyBCbG9jayA6IElucHV0KS5mcm9tSlNPTihsYW5nLCBhcmcsIHBhcnQpXG4gICAgICB9IGVsc2UgaWYgKGljb25QYXQudGVzdChwYXJ0KSkge1xuICAgICAgICByZXR1cm4gbmV3IEljb24ocGFydC5zbGljZSgxKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTGFiZWwocGFydC50cmltKCkpXG4gICAgICB9XG4gICAgfSlcbiAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24obGlzdCwgaW5kZXgpIHtcbiAgICAgIGxpc3QgPSBsaXN0IHx8IFtdXG4gICAgICBhc3NlcnQoaXNBcnJheShsaXN0KSlcbiAgICAgIGNoaWxkcmVuLnB1c2gobmV3IFNjcmlwdChsaXN0Lm1hcChCbG9jay5mcm9tSlNPTi5iaW5kKG51bGwsIGxhbmcpKSkpXG4gICAgICBpZiAoc2VsZWN0b3IgPT09IFwiZG9JZkVsc2VcIiAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbChsYW5nLmNvbW1hbmRzW1wiZWxzZVwiXSkpXG4gICAgICB9XG4gICAgfSlcbiAgICAvLyBUT0RPIGxvb3AgYXJyb3dzXG4gICAgcmV0dXJuIG5ldyBCbG9jayhpbmZvLCBjaGlsZHJlbilcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLmluZm8uc2VsZWN0b3JcbiAgICB2YXIgYXJncyA9IFtdXG5cbiAgICBpZiAoc2VsZWN0b3IgPT09IFwicHJvY0RlZlwiKSB7XG4gICAgICB2YXIgaW5wdXROYW1lcyA9IHRoaXMuaW5mby5uYW1lc1xuICAgICAgdmFyIHNwZWMgPSB0aGlzLmluZm8uY2FsbFxuICAgICAgdmFyIGluZm8gPSBwYXJzZVNwZWMoc3BlYylcbiAgICAgIHZhciBkZWZhdWx0VmFsdWVzID0gaW5mby5pbnB1dHMubWFwKGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dCA9PT0gXCIlblwiID8gMSA6IGlucHV0ID09PSBcIiViXCIgPyBmYWxzZSA6IFwiXCJcbiAgICAgIH0pXG4gICAgICB2YXIgaXNBdG9taWMgPSBmYWxzZSAvLyBUT0RPICdkZWZpbmUtYXRvbWljJyA/P1xuICAgICAgcmV0dXJuIFtcInByb2NEZWZcIiwgc3BlYywgaW5wdXROYW1lcywgZGVmYXVsdFZhbHVlcywgaXNBdG9taWNdXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgc2VsZWN0b3IgPT09IFwicmVhZFZhcmlhYmxlXCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImNvbnRlbnRzT2ZMaXN0OlwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiXG4gICAgKSB7XG4gICAgICBhcmdzLnB1c2goYmxvY2tOYW1lKHRoaXMpKVxuICAgICAgaWYgKHNlbGVjdG9yID09PSBcImdldFBhcmFtXCIpXG4gICAgICAgIGFyZ3MucHVzaCh0aGlzLmlzQm9vbGVhbiA9PT0gXCJib29sZWFuXCIgPyBcImJcIiA6IFwiclwiKVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXVxuICAgICAgICBpZiAoY2hpbGQuaXNJbnB1dCB8fCBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzU2NyaXB0KSB7XG4gICAgICAgICAgYXJncy5wdXNoKGNoaWxkLnRvSlNPTigpKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvciA9PT0gXCJjYWxsXCIpIHtcbiAgICAgICAgcmV0dXJuIFtcImNhbGxcIiwgdGhpcy5pbmZvLmNhbGxdLmNvbmNhdChhcmdzKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNlbGVjdG9yKSB0aHJvdyBcInVua25vd24gYmxvY2s6IFwiICsgdGhpcy5pbmZvLmhhc2hcbiAgICByZXR1cm4gW3NlbGVjdG9yXS5jb25jYXQoYXJncylcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbihleHRyYXMpIHtcbiAgICB2YXIgZmlyc3RJbnB1dCA9IG51bGxcbiAgICB2YXIgY2hlY2tBbGlhcyA9IGZhbHNlXG4gICAgdmFyIHRleHQgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZC5pc0ljb24pIGNoZWNrQWxpYXMgPSB0cnVlXG4gICAgICAgIGlmICghZmlyc3RJbnB1dCAmJiAhKGNoaWxkLmlzTGFiZWwgfHwgY2hpbGQuaXNJY29uKSkgZmlyc3RJbnB1dCA9IGNoaWxkXG4gICAgICAgIHJldHVybiBjaGlsZC5pc1NjcmlwdFxuICAgICAgICAgID8gXCJcXG5cIiArIGluZGVudChjaGlsZC5zdHJpbmdpZnkoKSkgKyBcIlxcblwiXG4gICAgICAgICAgOiBjaGlsZC5zdHJpbmdpZnkoKS50cmltKCkgKyBcIiBcIlxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXCIpXG4gICAgICAudHJpbSgpXG5cbiAgICB2YXIgbGFuZyA9IHRoaXMuaW5mby5sYW5ndWFnZVxuICAgIGlmIChjaGVja0FsaWFzICYmIGxhbmcgJiYgdGhpcy5pbmZvLnNlbGVjdG9yKSB7XG4gICAgICB2YXIgdHlwZSA9IGJsb2Nrc0J5U2VsZWN0b3JbdGhpcy5pbmZvLnNlbGVjdG9yXVxuICAgICAgdmFyIHNwZWMgPSB0eXBlLnNwZWNcbiAgICAgIHZhciBhbGlhcyA9IGxhbmcubmF0aXZlQWxpYXNlc1t0eXBlLnNwZWNdXG4gICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgLy8gVE9ETyBtYWtlIHRyYW5zbGF0ZSgpIG5vdCBpbi1wbGFjZSwgYW5kIHVzZSB0aGF0XG4gICAgICAgIGlmIChpbnB1dFBhdC50ZXN0KGFsaWFzKSAmJiBmaXJzdElucHV0KSB7XG4gICAgICAgICAgYWxpYXMgPSBhbGlhcy5yZXBsYWNlKGlucHV0UGF0LCBmaXJzdElucHV0LnN0cmluZ2lmeSgpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGlhc1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBvdmVycmlkZXMgPSBleHRyYXMgfHwgXCJcIlxuICAgIGlmIChcbiAgICAgICh0aGlzLmluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiB0aGlzLmlzUmVwb3J0ZXIpIHx8XG4gICAgICAodGhpcy5pbmZvLmNhdGVnb3J5ID09PSBcImN1c3RvbS1hcmdcIiAmJlxuICAgICAgICAodGhpcy5pc1JlcG9ydGVyIHx8IHRoaXMuaXNCb29sZWFuKSkgfHxcbiAgICAgICh0aGlzLmluZm8uY2F0ZWdvcnkgPT09IFwiY3VzdG9tXCIgJiYgdGhpcy5pbmZvLnNoYXBlID09PSBcInN0YWNrXCIpXG4gICAgKSB7XG4gICAgICBpZiAob3ZlcnJpZGVzKSBvdmVycmlkZXMgKz0gXCIgXCJcbiAgICAgIG92ZXJyaWRlcyArPSB0aGlzLmluZm8uY2F0ZWdvcnlcbiAgICB9XG4gICAgaWYgKG92ZXJyaWRlcykge1xuICAgICAgdGV4dCArPSBcIiA6OiBcIiArIG92ZXJyaWRlc1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5oYXNTY3JpcHRcbiAgICAgID8gdGV4dCArIFwiXFxuZW5kXCJcbiAgICAgIDogdGhpcy5pbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgPyBcIihcIiArIHRleHQgKyBcIilcIlxuICAgICAgICA6IHRoaXMuaW5mby5zaGFwZSA9PT0gXCJib29sZWFuXCIgPyBcIjxcIiArIHRleHQgKyBcIj5cIiA6IHRleHRcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nLCBpc1NoYWxsb3cpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLmluZm8uc2VsZWN0b3JcbiAgICBpZiAoIXNlbGVjdG9yKSByZXR1cm5cbiAgICBpZiAoc2VsZWN0b3IgPT09IFwicHJvY0RlZlwiKSB7XG4gICAgICBhc3NlcnQodGhpcy5jaGlsZHJlblswXS5pc0xhYmVsKVxuICAgICAgdGhpcy5jaGlsZHJlblswXSA9IG5ldyBMYWJlbChsYW5nLmRlZmluZVswXSB8fCBlbmdsaXNoLmRlZmluZVswXSlcbiAgICB9XG4gICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTZWxlY3RvcltzZWxlY3Rvcl1cbiAgICBpZiAoIWJsb2NrKSByZXR1cm5cbiAgICB2YXIgbmF0aXZlU3BlYyA9IGxhbmcuY29tbWFuZHNbYmxvY2suc3BlY11cbiAgICBpZiAoIW5hdGl2ZVNwZWMpIHJldHVyblxuICAgIHZhciBuYXRpdmVJbmZvID0gcGFyc2VTcGVjKG5hdGl2ZVNwZWMpXG4gICAgdmFyIGFyZ3MgPSB0aGlzLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbihjaGlsZCkge1xuICAgICAgcmV0dXJuICFjaGlsZC5pc0xhYmVsICYmICFjaGlsZC5pc0ljb25cbiAgICB9KVxuICAgIGlmICghaXNTaGFsbG93KVxuICAgICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGNoaWxkLnRyYW5zbGF0ZShsYW5nKVxuICAgICAgfSlcbiAgICB0aGlzLmNoaWxkcmVuID0gbmF0aXZlSW5mby5wYXJ0c1xuICAgICAgLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgIHZhciBwYXJ0ID0gcGFydC50cmltKClcbiAgICAgICAgaWYgKCFwYXJ0KSByZXR1cm5cbiAgICAgICAgcmV0dXJuIGlucHV0UGF0LnRlc3QocGFydClcbiAgICAgICAgICA/IGFyZ3Muc2hpZnQoKVxuICAgICAgICAgIDogaWNvblBhdC50ZXN0KHBhcnQpID8gbmV3IEljb24ocGFydC5zbGljZSgxKSkgOiBuZXcgTGFiZWwocGFydClcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgIGFyZ3MuZm9yRWFjaChcbiAgICAgIGZ1bmN0aW9uKGFyZykge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goYXJnKVxuICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKVxuICAgIHRoaXMuaW5mby5sYW5ndWFnZSA9IGxhbmdcbiAgICB0aGlzLmluZm8uaXNSVEwgPSBydGxMYW5ndWFnZXMuaW5kZXhPZihsYW5nLmNvZGUpID4gLTFcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldXG4gICAgICBpZiAoY2hpbGQubWVhc3VyZSkgY2hpbGQubWVhc3VyZSgpXG4gICAgfVxuICAgIGlmICh0aGlzLmNvbW1lbnQpIHRoaXMuY29tbWVudC5tZWFzdXJlKClcbiAgfVxuXG4gIEJsb2NrLnNoYXBlcyA9IHtcbiAgICBzdGFjazogU1ZHLnN0YWNrUmVjdCxcbiAgICBcImMtYmxvY2tcIjogU1ZHLnN0YWNrUmVjdCxcbiAgICBcImlmLWJsb2NrXCI6IFNWRy5zdGFja1JlY3QsXG4gICAgY2Vsc2U6IFNWRy5zdGFja1JlY3QsXG4gICAgY2VuZDogU1ZHLnN0YWNrUmVjdCxcblxuICAgIGNhcDogU1ZHLmNhcFJlY3QsXG4gICAgcmVwb3J0ZXI6IFNWRy5waWxsUmVjdCxcbiAgICBib29sZWFuOiBTVkcucG9pbnRlZFJlY3QsXG4gICAgaGF0OiBTVkcuaGF0UmVjdCxcbiAgICBcImRlZmluZS1oYXRcIjogU1ZHLnByb2NIYXRSZWN0LFxuICAgIHJpbmc6IFNWRy5yb3VuZFJlY3QsXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbih3LCBoLCBsaW5lcykge1xuICAgIC8vIG1vdXRoc1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gU1ZHLm1vdXRoUmVjdCh3LCBoLCB0aGlzLmlzRmluYWwsIGxpbmVzLCB7XG4gICAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gb3V0bGluZXNcbiAgICBpZiAodGhpcy5pbmZvLnNoYXBlID09PSBcIm91dGxpbmVcIikge1xuICAgICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhTVkcuc3RhY2tSZWN0KHcsIGgpLCB7XG4gICAgICAgIGNsYXNzOiBcInNiLW91dGxpbmVcIixcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gcmluZ3NcbiAgICBpZiAodGhpcy5pc1JpbmcpIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5bMF1cbiAgICAgIGlmIChjaGlsZCAmJiAoY2hpbGQuaXNJbnB1dCB8fCBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzU2NyaXB0KSkge1xuICAgICAgICB2YXIgc2hhcGUgPSBjaGlsZC5pc1NjcmlwdFxuICAgICAgICAgID8gXCJzdGFja1wiXG4gICAgICAgICAgOiBjaGlsZC5pc0lucHV0ID8gY2hpbGQuc2hhcGUgOiBjaGlsZC5pbmZvLnNoYXBlXG4gICAgICAgIHJldHVybiBTVkcucmluZ1JlY3QodywgaCwgY2hpbGQueSwgY2hpbGQud2lkdGgsIGNoaWxkLmhlaWdodCwgc2hhcGUsIHtcbiAgICAgICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZ1bmMgPSBCbG9jay5zaGFwZXNbdGhpcy5pbmZvLnNoYXBlXVxuICAgIGFzc2VydChmdW5jLCBcIm5vIHNoYXBlIGZ1bmM6IFwiICsgdGhpcy5pbmZvLnNoYXBlKVxuICAgIHJldHVybiBmdW5jKHcsIGgsIHtcbiAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLm1pbkRpc3RhbmNlID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBpZiAodGhpcy5pc0Jvb2xlYW4pIHtcbiAgICAgIHJldHVybiBjaGlsZC5pc1JlcG9ydGVyXG4gICAgICAgID8gKDQgKyBjaGlsZC5oZWlnaHQgLyA0KSB8IDBcbiAgICAgICAgOiBjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgPyAoNSArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgICAgICAgIDogY2hpbGQuaXNCb29sZWFuIHx8IGNoaWxkLnNoYXBlID09PSBcImJvb2xlYW5cIlxuICAgICAgICAgICAgPyA1XG4gICAgICAgICAgICA6ICgyICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgfVxuICAgIGlmICh0aGlzLmlzUmVwb3J0ZXIpIHtcbiAgICAgIHJldHVybiAoY2hpbGQuaXNJbnB1dCAmJiBjaGlsZC5pc1JvdW5kKSB8fFxuICAgICAgICAoKGNoaWxkLmlzUmVwb3J0ZXIgfHwgY2hpbGQuaXNCb29sZWFuKSAmJiAhY2hpbGQuaGFzU2NyaXB0KVxuICAgICAgICA/IDJcbiAgICAgICAgOiBjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgPyAoMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgICAgICAgIDogKC0yICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgfVxuICAgIHJldHVybiAwXG4gIH1cblxuICBCbG9jay5wYWRkaW5nID0ge1xuICAgIGhhdDogWzE4LCA2LCA1XSxcbiAgICBcImRlZmluZS1oYXRcIjogWzIwLCA4LCAxMF0sXG4gICAgcmVwb3J0ZXI6IFs1LCAzLCAzXSxcbiAgICBib29sZWFuOiBbNSwgMywgM10sXG4gICAgY2FwOiBbMTEsIDYsIDZdLFxuICAgIFwiYy1ibG9ja1wiOiBbOCwgNiwgNV0sXG4gICAgXCJpZi1ibG9ja1wiOiBbOCwgNiwgNV0sXG4gICAgcmluZzogWzEwLCA0LCAxMF0sXG4gICAgbnVsbDogWzgsIDYsIDVdLFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNEZWZpbmUgPSB0aGlzLmluZm8uc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlblxuXG4gICAgdmFyIHBhZGRpbmcgPSBCbG9jay5wYWRkaW5nW3RoaXMuaW5mby5zaGFwZV0gfHwgQmxvY2sucGFkZGluZ1tudWxsXVxuICAgIHZhciBwdCA9IHBhZGRpbmdbMF0sXG4gICAgICBweCA9IHBhZGRpbmdbMV0sXG4gICAgICBwYiA9IHBhZGRpbmdbMl1cblxuICAgIHZhciB5ID0gMFxuICAgIHZhciBMaW5lID0gZnVuY3Rpb24oeSkge1xuICAgICAgdGhpcy55ID0geVxuICAgICAgdGhpcy53aWR0aCA9IDBcbiAgICAgIHRoaXMuaGVpZ2h0ID0geSA/IDE4IDogMTZcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIH1cblxuICAgIHZhciBpbm5lcldpZHRoID0gMFxuICAgIHZhciBzY3JpcHRXaWR0aCA9IDBcbiAgICB2YXIgbGluZSA9IG5ldyBMaW5lKHkpXG4gICAgZnVuY3Rpb24gcHVzaExpbmUoaXNMYXN0KSB7XG4gICAgICBpZiAobGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IHB0ICsgcGJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IGlzTGFzdCA/IDAgOiArMlxuICAgICAgICBsaW5lLnkgLT0gMVxuICAgICAgfVxuICAgICAgeSArPSBsaW5lLmhlaWdodFxuICAgICAgbGluZXMucHVzaChsaW5lKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZm8uaXNSVEwpIHtcbiAgICAgIHZhciBzdGFydCA9IDBcbiAgICAgIHZhciBmbGlwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW5cbiAgICAgICAgICAuc2xpY2UoMCwgc3RhcnQpXG4gICAgICAgICAgLmNvbmNhdChjaGlsZHJlbi5zbGljZShzdGFydCwgaSkucmV2ZXJzZSgpKVxuICAgICAgICAgIC5jb25jYXQoY2hpbGRyZW4uc2xpY2UoaSkpXG4gICAgICB9LmJpbmQodGhpcylcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuW2ldLmlzU2NyaXB0KSB7XG4gICAgICAgICAgZmxpcCgpXG4gICAgICAgICAgc3RhcnQgPSBpICsgMVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhcnQgPCBpKSB7XG4gICAgICAgIGZsaXAoKVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaW5lcyA9IFtdIC8vbG9vayBhdCB0aGlzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgIGNoaWxkLmVsID0gY2hpbGQuZHJhdyh0aGlzKVxuXG4gICAgICBpZiAoY2hpbGQuaXNTY3JpcHQgJiYgdGhpcy5pc0NvbW1hbmQpIHtcbiAgICAgICAgdGhpcy5oYXNTY3JpcHQgPSB0cnVlXG4gICAgICAgIHB1c2hMaW5lKClcbiAgICAgICAgY2hpbGQueSA9IHlcbiAgICAgICAgbGluZXMucHVzaChjaGlsZClcbiAgICAgICAgc2NyaXB0V2lkdGggPSBNYXRoLm1heChzY3JpcHRXaWR0aCwgTWF0aC5tYXgoMSwgY2hpbGQud2lkdGgpKSAgLy9sb29rIGF0IHRoaXMgYXJlYVxuICAgICAgICBjaGlsZC5oZWlnaHQgPSBNYXRoLm1heCgxMiwgY2hpbGQuaGVpZ2h0KSArIDNcbiAgICAgICAgeSArPSBjaGlsZC5oZWlnaHRcbiAgICAgICAgbGluZSA9IG5ldyBMaW5lKHkpXG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzQXJyb3cpIHtcbiAgICAgICAgbGluZS5jaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNtdyA9IGkgPiAwID8gMzIgOiAwIC8vIDI3XG4gICAgICAgIHZhciBtZCA9IHRoaXMuaXNDb21tYW5kID8gMCA6IHRoaXMubWluRGlzdGFuY2UoY2hpbGQpXG4gICAgICAgIHZhciBtdyA9IHRoaXMuaXNDb21tYW5kXG4gICAgICAgICAgPyBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzSW5wdXQgPyBjbXcgOiAwXG4gICAgICAgICAgOiBtZFxuICAgICAgICBpZiAobXcgJiYgIWxpbmVzLmxlbmd0aCAmJiBsaW5lLndpZHRoIDwgbXcgLSBweCkge1xuICAgICAgICAgIGxpbmUud2lkdGggPSBtdyAtIHB4XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGQueCA9IGxpbmUud2lkdGhcbiAgICAgICAgbGluZS53aWR0aCArPSBjaGlsZC53aWR0aFxuICAgICAgICBpbm5lcldpZHRoID0gTWF0aC5tYXgoaW5uZXJXaWR0aCwgbGluZS53aWR0aCArIE1hdGgubWF4KDAsIG1kIC0gcHgpKVxuICAgICAgICAvL2xpbmUud2lkdGggKz0gMSAvLzRcbiAgICAgICAgaWYgKCFjaGlsZC5pc0xhYmVsKSB7IC8vdGV4dCB2cyByZXBvcnRlciBwYWRkaW5nXG4gICAgICAgICAgbGluZS53aWR0aCArPSA1XG4gICAgICAgICAgbGluZS5oZWlnaHQgPSBNYXRoLm1heChsaW5lLmhlaWdodCwgY2hpbGQuaGVpZ2h0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmUud2lkdGggKz0gNVxuICAgICAgICB9XG4gICAgICAgIGxpbmUuY2hpbGRyZW4ucHVzaChjaGlsZClcbiAgICAgIH1cbiAgICB9XG4gICAgcHVzaExpbmUodHJ1ZSlcblxuICAgIGlubmVyV2lkdGggPSBNYXRoLm1heChcbiAgICAgIGlubmVyV2lkdGggKyBweCAqIDIsXG4gICAgICB0aGlzLmlzSGF0IHx8IHRoaXMuaGFzU2NyaXB0XG4gICAgICAgID8gNTBcbiAgICAgICAgOiB0aGlzLmlzQ29tbWFuZCB8fCB0aGlzLmlzT3V0bGluZSB8fCB0aGlzLmlzUmluZyA/IDQ1IDogMjBcbiAgICApXG4gICAgXG4gICAgdGhpcy5oZWlnaHQgPSB5XG4gICAgdGhpcy53aWR0aCA9IHNjcmlwdFdpZHRoXG4gICAgICA/IE1hdGgubWF4KGlubmVyV2lkdGgsIDEwICsgc2NyaXB0V2lkdGgpXG4gICAgICA6IGlubmVyV2lkdGhcbiAgICBpZiAoaXNEZWZpbmUpIHtcbiAgICAgIHZhciBwID0gTWF0aC5taW4oMjYsICgzLjUgKyAwLjEzICogaW5uZXJXaWR0aCkgfCAwKSAtIDEwXG4gICAgICB0aGlzLmhlaWdodCArPSBwXG4gICAgICBwdCArPSAyICogcFxuICAgIH1cbiAgICBcbiAgICB0aGlzLmZpcnN0TGluZSA9IGxpbmVzWzBdXG4gICAgdGhpcy5pbm5lcldpZHRoID0gaW5uZXJXaWR0aFxuXG4gICAgdmFyIG9iamVjdHMgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXVxuICAgICAgaWYgKGxpbmUuaXNTY3JpcHQpIHtcbiAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKDEwLCBsaW5lLnksIGxpbmUuZWwpKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgaCA9IGxpbmUuaGVpZ2h0XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGluZS5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBsaW5lLmNoaWxkcmVuW2pdXG4gICAgICAgIGlmIChjaGlsZC5pc0Fycm93KSB7XG4gICAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKGlubmVyV2lkdGggLSAxMCwgdGhpcy5oZWlnaHQgLSAzLCBjaGlsZC5lbCkpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB5ID0gcHQgKyAoaCAtIGNoaWxkLmhlaWdodCAtIHB0IC0gcGIpIC8gMiAtIDFcbiAgICAgICAgaWYgKGlzRGVmaW5lICYmIGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgICB5ICs9IDBcbiAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0ljb24pIHtcbiAgICAgICAgICB5ICs9IGNoaWxkLmR5IHwgMFxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzUmluZykge1xuICAgICAgICAgIGNoaWxkLnkgPSAobGluZS55ICsgeSkgfCAwXG4gICAgICAgICAgaWYgKGNoaWxkLmlzSW5zZXQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzU3RhY2spIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShweCArIGNoaWxkLngsIChsaW5lLnkgKyB5KSB8IDAsIGNoaWxkLmVsKSlcblxuICAgICAgICBpZiAoY2hpbGQuZGlmZiA9PT0gXCIrXCIpIHtcbiAgICAgICAgICB2YXIgZWxsaXBzZSA9IFNWRy5pbnNFbGxpcHNlKGNoaWxkLndpZHRoLCBjaGlsZC5oZWlnaHQpXG4gICAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKHB4ICsgY2hpbGQueCwgKGxpbmUueSArIHkpIHwgMCwgZWxsaXBzZSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZWwgPSB0aGlzLmRyYXdTZWxmKGlubmVyV2lkdGgsIHRoaXMuaGVpZ2h0LCBsaW5lcylcbiAgICBvYmplY3RzLnNwbGljZSgwLCAwLCBlbClcbiAgICBpZiAodGhpcy5pbmZvLmNvbG9yKSB7XG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgZmlsbDogdGhpcy5pbmZvLmNvbG9yLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gU1ZHLmdyb3VwKG9iamVjdHMpXG4gIH1cblxuICAvKiBDb21tZW50ICovXG5cbiAgdmFyIENvbW1lbnQgPSBmdW5jdGlvbih2YWx1ZSwgaGFzQmxvY2spIHtcbiAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHZhbHVlLCBbXCJzYi1jb21tZW50LWxhYmVsXCJdKVxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oYXNCbG9jayA9IGhhc0Jsb2NrXG4gIH1cbiAgQ29tbWVudC5wcm90b3R5cGUuaXNDb21tZW50ID0gdHJ1ZVxuICBDb21tZW50LmxpbmVMZW5ndGggPSAxNlxuICBDb21tZW50LnByb3RvdHlwZS5oZWlnaHQgPSAyNVxuXG4gIENvbW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIi8vIFwiICsgdGhpcy5sYWJlbC52YWx1ZVxuICB9XG5cbiAgQ29tbWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGFiZWwubWVhc3VyZSgpXG4gIH1cblxuICBDb21tZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhYmVsRWwgPSB0aGlzLmxhYmVsLmRyYXcoKVxuXG4gICAgdGhpcy53aWR0aCA9IHRoaXMubGFiZWwud2lkdGggKyAxNlxuICAgIHJldHVybiBTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLmNvbW1lbnRMaW5lKHRoaXMuaGFzQmxvY2sgPyBDb21tZW50LmxpbmVMZW5ndGggOiAwLCA2KSxcbiAgICAgIFNWRy5jb21tZW50UmVjdCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge1xuICAgICAgICBjbGFzczogXCJzYi1jb21tZW50XCIsXG4gICAgICB9KSxcbiAgICAgIFNWRy5tb3ZlKDgsIDYsIGxhYmVsRWwpLFxuICAgIF0pXG4gIH1cblxuICAvKiBHbG93ICovXG5cbiAgdmFyIEdsb3cgPSBmdW5jdGlvbihjaGlsZCkge1xuICAgIGFzc2VydChjaGlsZClcbiAgICB0aGlzLmNoaWxkID0gY2hpbGRcbiAgICBpZiAoY2hpbGQuaXNCbG9jaykge1xuICAgICAgdGhpcy5zaGFwZSA9IGNoaWxkLmluZm8uc2hhcGVcbiAgICAgIHRoaXMuaW5mbyA9IGNoaWxkLmluZm9cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFwZSA9IFwic3RhY2tcIlxuICAgIH1cblxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy55ID0gMFxuICB9XG4gIEdsb3cucHJvdG90eXBlLmlzR2xvdyA9IHRydWVcblxuICBHbG93LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jaGlsZC5pc0Jsb2NrKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZC5zdHJpbmdpZnkoXCIrXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsaW5lcyA9IHRoaXMuY2hpbGQuc3RyaW5naWZ5KCkuc3BsaXQoXCJcXG5cIilcbiAgICAgIHJldHVybiBsaW5lcy5tYXAobGluZSA9PiBcIisgXCIgKyBsaW5lKS5qb2luKFwiXFxuXCIpXG4gICAgfVxuICB9XG5cbiAgR2xvdy5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIHRoaXMuY2hpbGQudHJhbnNsYXRlKGxhbmcpXG4gIH1cblxuICBHbG93LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGlsZC5tZWFzdXJlKClcbiAgfVxuXG4gIEdsb3cucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNoaWxkXG4gICAgdmFyIGVsXG4gICAgdmFyIHcgPSB0aGlzLndpZHRoXG4gICAgdmFyIGggPSB0aGlzLmhlaWdodCAtIDFcbiAgICBpZiAoYy5pc1NjcmlwdCkge1xuICAgICAgaWYgKCFjLmlzRW1wdHkgJiYgYy5ibG9ja3NbMF0uaXNIYXQpIHtcbiAgICAgICAgZWwgPSBTVkcuaGF0UmVjdCh3LCBoKVxuICAgICAgfSBlbHNlIGlmIChjLmlzRmluYWwpIHtcbiAgICAgICAgZWwgPSBTVkcuY2FwUmVjdCh3LCBoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwgPSBTVkcuc3RhY2tSZWN0KHcsIGgpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBlbCA9IGMuZHJhd1NlbGYodywgaCwgW10pXG4gICAgfVxuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgIGNsYXNzOiBcInNiLWRpZmYgc2ItZGlmZi1pbnNcIixcbiAgICB9KVxuICB9XG4gIC8vIFRPRE8gaG93IGNhbiB3ZSBhbHdheXMgcmFpc2UgR2xvd3MgYWJvdmUgdGhlaXIgcGFyZW50cz9cblxuICBHbG93LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNoaWxkXG4gICAgdmFyIGVsID0gYy5pc1NjcmlwdCA/IGMuZHJhdyh0cnVlKSA6IGMuZHJhdygpXG5cbiAgICB0aGlzLndpZHRoID0gYy53aWR0aFxuICAgIHRoaXMuaGVpZ2h0ID0gKGMuaXNCbG9jayAmJiBjLmZpcnN0TGluZS5oZWlnaHQpIHx8IGMuaGVpZ2h0XG5cbiAgICAvLyBlbmNpcmNsZVxuICAgIHJldHVybiBTVkcuZ3JvdXAoW2VsLCB0aGlzLmRyYXdTZWxmKCldKVxuICB9XG5cbiAgLyogU2NyaXB0ICovXG5cbiAgdmFyIFNjcmlwdCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICAgIHRoaXMuYmxvY2tzID0gYmxvY2tzXG4gICAgdGhpcy5pc0VtcHR5ID0gIWJsb2Nrcy5sZW5ndGhcbiAgICB0aGlzLmlzRmluYWwgPSAhdGhpcy5pc0VtcHR5ICYmIGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0uaXNGaW5hbFxuICAgIHRoaXMueSA9IDBcbiAgfVxuICBTY3JpcHQucHJvdG90eXBlLmlzU2NyaXB0ID0gdHJ1ZVxuXG4gIFNjcmlwdC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIGJsb2Nrcykge1xuICAgIC8vIHggPSBhcnJheVswXSwgeSA9IGFycmF5WzFdO1xuICAgIHJldHVybiBuZXcgU2NyaXB0KGJsb2Nrcy5tYXAoQmxvY2suZnJvbUpTT04uYmluZChudWxsLCBsYW5nKSkpXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmJsb2Nrc1swXSAmJiB0aGlzLmJsb2Nrc1swXS5pc0NvbW1lbnQpIHJldHVyblxuICAgIHJldHVybiB0aGlzLmJsb2Nrcy5tYXAoZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgIHJldHVybiBibG9jay50b0pTT04oKVxuICAgIH0pXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmJsb2Nrc1xuICAgICAgLm1hcChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLnN0cmluZ2lmeSgpXG4gICAgICAgIGlmIChibG9jay5jb21tZW50KSBsaW5lICs9IFwiIFwiICsgYmxvY2suY29tbWVudC5zdHJpbmdpZnkoKVxuICAgICAgICByZXR1cm4gbGluZVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXCIpXG4gIH1cblxuICBTY3JpcHQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICBibG9jay50cmFuc2xhdGUobGFuZylcbiAgICB9KVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5ibG9ja3NbaV0ubWVhc3VyZSgpXG4gICAgfVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oaW5zaWRlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICB2YXIgeSA9IDBcbiAgICB0aGlzLndpZHRoID0gMFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ibG9ja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2ldXG4gICAgICB2YXIgeCA9IGluc2lkZSA/IDAgOiAyXG4gICAgICB2YXIgY2hpbGQgPSBibG9jay5kcmF3KClcbiAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoeCwgeSwgY2hpbGQpKVxuICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGJsb2NrLndpZHRoKVxuXG4gICAgICB2YXIgZGlmZiA9IGJsb2NrLmRpZmZcbiAgICAgIGlmIChkaWZmID09PSBcIi1cIikge1xuICAgICAgICB2YXIgZHcgPSBibG9jay53aWR0aFxuICAgICAgICB2YXIgZGggPSBibG9jay5maXJzdExpbmUuaGVpZ2h0IHx8IGJsb2NrLmhlaWdodFxuICAgICAgICBjaGlsZHJlbi5wdXNoKFNWRy5tb3ZlKHgsIHkgKyBkaCAvIDIgKyAxLCBTVkcuc3RyaWtldGhyb3VnaExpbmUoZHcpKSlcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGJsb2NrLndpZHRoKVxuICAgICAgfVxuXG4gICAgICB5ICs9IGJsb2NrLmhlaWdodFxuXG4gICAgICB2YXIgY29tbWVudCA9IGJsb2NrLmNvbW1lbnRcbiAgICAgIGlmIChjb21tZW50KSB7XG4gICAgICAgIHZhciBsaW5lID0gYmxvY2suZmlyc3RMaW5lXG4gICAgICAgIHZhciBjeCA9IGJsb2NrLmlubmVyV2lkdGggKyAyICsgQ29tbWVudC5saW5lTGVuZ3RoXG4gICAgICAgIHZhciBjeSA9IHkgLSBibG9jay5oZWlnaHQgKyBsaW5lLmhlaWdodCAvIDJcbiAgICAgICAgdmFyIGVsID0gY29tbWVudC5kcmF3KClcbiAgICAgICAgY2hpbGRyZW4ucHVzaChTVkcubW92ZShjeCwgY3kgLSBjb21tZW50LmhlaWdodCAvIDIsIGVsKSlcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgubWF4KHRoaXMud2lkdGgsIGN4ICsgY29tbWVudC53aWR0aClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5oZWlnaHQgPSB5XG4gICAgaWYgKCFpbnNpZGUgJiYgIXRoaXMuaXNGaW5hbCkge1xuICAgICAgdGhpcy5oZWlnaHQgKz0gOFxuICAgIH1cbiAgICBpZiAoIWluc2lkZSAmJiBibG9jay5pc0dsb3cpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDIgLy8gVE9ETyB1bmJyZWFrIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIFNWRy5ncm91cChjaGlsZHJlbilcbiAgfVxuXG4gIC8qIERvY3VtZW50ICovXG5cbiAgdmFyIERvY3VtZW50ID0gZnVuY3Rpb24oc2NyaXB0cykge1xuICAgIHRoaXMuc2NyaXB0cyA9IHNjcmlwdHNcblxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy5lbCA9IG51bGxcbiAgICB0aGlzLmRlZnMgPSBudWxsXG4gIH1cblxuICBEb2N1bWVudC5mcm9tSlNPTiA9IGZ1bmN0aW9uKHNjcmlwdGFibGUsIGxhbmcpIHtcbiAgICB2YXIgbGFuZyA9IGxhbmcgfHwgZW5nbGlzaFxuICAgIHZhciBzY3JpcHRzID0gc2NyaXB0YWJsZS5zY3JpcHRzLm1hcChmdW5jdGlvbihhcnJheSkge1xuICAgICAgdmFyIHNjcmlwdCA9IFNjcmlwdC5mcm9tSlNPTihsYW5nLCBhcnJheVsyXSlcbiAgICAgIHNjcmlwdC54ID0gYXJyYXlbMF1cbiAgICAgIHNjcmlwdC55ID0gYXJyYXlbMV1cbiAgICAgIHJldHVybiBzY3JpcHRcbiAgICB9KVxuICAgIC8vIFRPRE8gc2NyaXB0YWJsZS5zY3JpcHRDb21tZW50c1xuICAgIHJldHVybiBuZXcgRG9jdW1lbnQoc2NyaXB0cylcbiAgfVxuXG4gIERvY3VtZW50LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIganNvblNjcmlwdHMgPSB0aGlzLnNjcmlwdHNcbiAgICAgIC5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIHZhciBqc29uQmxvY2tzID0gc2NyaXB0LnRvSlNPTigpXG4gICAgICAgIGlmICghanNvbkJsb2NrcykgcmV0dXJuXG4gICAgICAgIHJldHVybiBbMTAsIHNjcmlwdC55ICsgMTAsIGpzb25CbG9ja3NdXG4gICAgICB9KVxuICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICByZXR1cm4ge1xuICAgICAgc2NyaXB0czoganNvblNjcmlwdHMsXG4gICAgICAvLyBzY3JpcHRDb21tZW50czogW10sIC8vIFRPRE9cbiAgICB9XG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2NyaXB0c1xuICAgICAgLm1hcChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgcmV0dXJuIHNjcmlwdC5zdHJpbmdpZnkoKVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXFxuXCIpXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZykge1xuICAgIHRoaXMuc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgc2NyaXB0LnRyYW5zbGF0ZShsYW5nKVxuICAgIH0pXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgc2NyaXB0Lm1lYXN1cmUoKVxuICAgIH0pXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY2IpIHtcbiAgICAvLyBtZWFzdXJlIHN0cmluZ3NcbiAgICB0aGlzLm1lYXN1cmUoKVxuXG4gICAgLy8gVE9ETzogc2VwYXJhdGUgbGF5b3V0ICsgcmVuZGVyIHN0ZXBzLlxuICAgIC8vIHJlbmRlciBlYWNoIHNjcmlwdFxuICAgIHZhciB3aWR0aCA9IDBcbiAgICB2YXIgaGVpZ2h0ID0gMFxuICAgIHZhciBlbGVtZW50cyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzY3JpcHQgPSB0aGlzLnNjcmlwdHNbaV1cbiAgICAgIGlmIChoZWlnaHQpIGhlaWdodCArPSAxMFxuICAgICAgc2NyaXB0LnkgPSBoZWlnaHRcbiAgICAgIGVsZW1lbnRzLnB1c2goU1ZHLm1vdmUoMCwgaGVpZ2h0LCBzY3JpcHQuZHJhdygpKSlcbiAgICAgIGhlaWdodCArPSBzY3JpcHQuaGVpZ2h0XG4gICAgICB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCBzY3JpcHQud2lkdGggKyA0KVxuICAgIH1cbiAgICB0aGlzLndpZHRoID0gd2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxuXG4gICAgLy8gcmV0dXJuIFNWR1xuICAgIHZhciBzdmcgPSBTVkcubmV3U1ZHKHdpZHRoLCBoZWlnaHQpXG4gICAgc3ZnLmFwcGVuZENoaWxkKFxuICAgICAgKHRoaXMuZGVmcyA9IFNWRy53aXRoQ2hpbGRyZW4oXG4gICAgICAgIFNWRy5lbChcImRlZnNcIiksXG4gICAgICAgIFtcbiAgICAgICAgICBiZXZlbEZpbHRlcihcImJldmVsRmlsdGVyXCIsIGZhbHNlKSxcbiAgICAgICAgICBiZXZlbEZpbHRlcihcImlucHV0QmV2ZWxGaWx0ZXJcIiwgdHJ1ZSksXG4gICAgICAgICAgZGFya0ZpbHRlcihcImlucHV0RGFya0ZpbHRlclwiKSxcbiAgICAgICAgICBkZXNhdHVyYXRlRmlsdGVyKFwiZGVzYXR1cmF0ZUZpbHRlclwiKSxcbiAgICAgICAgXS5jb25jYXQobWFrZUljb25zKCkpXG4gICAgICApKVxuICAgIClcblxuICAgIHN2Zy5hcHBlbmRDaGlsZChTVkcuZ3JvdXAoZWxlbWVudHMpKVxuICAgIHRoaXMuZWwgPSBzdmdcblxuICAgIC8vIG5iOiBhc3luYyBBUEkgb25seSBmb3IgYmFja3dhcmRzL2ZvcndhcmRzIGNvbXBhdGliaWxpdHkgcmVhc29ucy5cbiAgICAvLyBkZXNwaXRlIGFwcGVhcmFuY2VzLCBpdCBydW5zIHN5bmNocm9ub3VzbHlcbiAgICBjYihzdmcpXG4gIH1cblxuICAvKiBFeHBvcnQgU1ZHIGltYWdlIGFzIFhNTCBzdHJpbmcgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGFzc2VydCh0aGlzLmVsLCBcImNhbGwgZHJhdygpIGZpcnN0XCIpXG5cbiAgICB2YXIgc3R5bGUgPSBtYWtlU3R5bGUoKVxuICAgIHRoaXMuZGVmcy5hcHBlbmRDaGlsZChzdHlsZSlcbiAgICB2YXIgeG1sID0gbmV3IFNWRy5YTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcodGhpcy5lbClcbiAgICB0aGlzLmRlZnMucmVtb3ZlQ2hpbGQoc3R5bGUpXG4gICAgcmV0dXJuIHhtbFxuICB9XG5cbiAgLyogRXhwb3J0IFNWRyBpbWFnZSBhcyBkYXRhIFVSSSAqL1xuICBEb2N1bWVudC5wcm90b3R5cGUuZXhwb3J0U1ZHID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHhtbCA9IHRoaXMuZXhwb3J0U1ZHU3RyaW5nKClcbiAgICByZXR1cm4gXCJkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIiArIHhtbC5yZXBsYWNlKC9bI10vZywgZW5jb2RlVVJJQ29tcG9uZW50KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFBORyA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgdmFyIGNhbnZhcyA9IFNWRy5tYWtlQ2FudmFzKClcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLndpZHRoXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaGVpZ2h0XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG5cbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKVxuICAgIGltYWdlLnNyYyA9IHRoaXMuZXhwb3J0U1ZHKClcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwKVxuXG4gICAgICBpZiAoVVJMICYmIFVSTC5jcmVhdGVPYmplY3RVUkwgJiYgQmxvYiAmJiBjYW52YXMudG9CbG9iKSB7XG4gICAgICAgIHZhciBibG9iID0gY2FudmFzLnRvQmxvYihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgY2IoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSlcbiAgICAgICAgfSwgXCJpbWFnZS9wbmdcIilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNiKGNhbnZhcy50b0RhdGFVUkwoXCJpbWFnZS9wbmdcIikpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgR2xvdyxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH1cbn0pKClcbiIsInZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG52YXIgRmlsdGVyID0gcmVxdWlyZShcIi4vZmlsdGVyLmpzXCIpXG5cbnZhciBTdHlsZSA9IChtb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3NzQ29udGVudDogYFxuICAgIC5zYi1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgZmlsbDogI2ZmZjtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMHB4O1xuICAgICAgb3BhY2l0eTogMTtcbiAgICB9XG5cbiAgICAuc2Itb2Jzb2xldGUgeyBmaWxsOiAjRUQ0MjQyOyB9XG4gICAgLnNiLW1vdGlvbiB7IGZpbGw6ICM0Qzk3RkY7IH1cbiAgICAuc2ItbG9va3MgeyBmaWxsOiAjOTk2NkZGOyB9XG4gICAgLnNiLXNvdW5kIHsgZmlsbDogI0NGNjNDRjsgfVxuICAgIC5zYi1wZW4geyBmaWxsOiAjMGZCRDhDOyAgfVxuICAgIC5zYi1ldmVudHMgeyBmaWxsOiAjRkZCRjAwOyB9XG4gICAgLnNiLWNvbnRyb2wgeyBmaWxsOiAjRkZBQjE5OyB9XG4gICAgLnNiLXNlbnNpbmcgeyBmaWxsOiAjNUNCMUQ2OyB9XG4gICAgLnNiLW9wZXJhdG9ycyB7IGZpbGw6ICM1OUMwNTk7IH1cbiAgICAuc2ItdmFyaWFibGVzIHsgZmlsbDogI0ZGOEMxQTsgfVxuICAgIC5zYi1saXN0IHsgZmlsbDogI0ZGNjYxQSB9XG4gICAgLnNiLWN1c3RvbSB7IGZpbGw6ICNGRjY2ODA7IH1cbiAgICAuc2ItY3VzdG9tLWFyZyB7IGZpbGw6ICNGRjY2ODA7IH1cbiAgICAuc2ItZXh0ZW5zaW9uIHsgZmlsbDogIzRiNGE2MDsgfVxuICAgIC5zYi1ncmV5IHsgZmlsbDogIzk2OTY5NjsgfVxuXG4gICAgLnNiLWJldmVsIHtcbiAgICAgIGZpbHRlcjI6IHVybCgjYmV2ZWxGaWx0ZXIpO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMTU7XG4gICAgICBzdHJva2UtYWxpZ25tZW50OiBpbm5lcjtcbiAgICB9XG4gICAgLnNiLWlucHV0LXJvdW5kLWRyb3Bkb3duLFxuICAgIC5zYi1pbnB1dC1ib29sZWFuIHtcbiAgICAgIGZpbHRlcjogdXJsKCNpbnB1dERhcmtGaWx0ZXIpO1xuICAgIH1cbiAgICAuc2ItaW5wdXQge1xuICAgICAgZmlsdGVyMjogdXJsKCNpbnB1dEJldmVsRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE1O1xuICAgICAgc3Ryb2tlLWFsaWdubWVudDogaW5uZXI7XG4gICAgfVxuICAgIC5zYi1pbnB1dC1udW1iZXIsXG4gICAgLnNiLWlucHV0LXN0cmluZyxcbiAgICAuc2ItaW5wdXQtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duLFxuICAgIC5zYi1saXRlcmFsLWRyb3Bkb3duIHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICB3b3JkLXNwYWNpbmc6IDA7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICM0NDQ7XG4gICAgfVxuXG4gICAgLnNiLWRhcmtlciB7XG4gICAgICBmaWx0ZXIyOiB1cmwoI2lucHV0RGFya0ZpbHRlcik7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xO1xuICAgICAgc3Ryb2tlLWFsaWdubWVudDogaW5uZXI7XG4gICAgfVxuICAgIC5zYi1kZXNhdHVyYXRlIHtcbiAgICAgIGZpbHRlcjogdXJsKCNkZXNhdHVyYXRlRmlsdGVyKTtcbiAgICB9XG5cbiAgICAuc2Itb3V0bGluZSB7XG4gICAgICBzdHJva2U6ICMwMDA7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMC4xO1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgICAgZmlsbDogI0ZGNEQ2QTtcbiAgICB9XG5cbiAgICAuc2ItZGVmaW5lLWhhdC1jYXAge1xuICAgICAgc3Ryb2tlOiAjNjMyZDk5O1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgICAgZmlsbDogIzhlMmVjMjtcbiAgICB9XG5cbiAgICAuc2ItY29tbWVudCB7XG4gICAgICBmaWxsOiAjRTREQjhDO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMjtcbiAgICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICB9XG4gICAgLnNiLWNvbW1lbnQtbGluZSB7XG4gICAgICBmaWxsOiAjMDAwO1xuICAgICAgb3BhY2l0eTogMC4yO1xuICAgIH1cbiAgICAuc2ItY29tbWVudC1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgZmlsbDogIzAwMDtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMHB4O1xuICAgICAgb3BhY2l0eTogMTtcbiAgICB9XG5cbiAgICAuc2ItZGlmZiB7XG4gICAgICBmaWxsOiBub25lO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgIH1cbiAgICAuc2ItZGlmZi1pbnMge1xuICAgICAgc3Ryb2tlLXdpZHRoOiAycHg7XG4gICAgfVxuICAgIC5zYi1kaWZmLWRlbCB7XG4gICAgICBzdHJva2Utd2lkdGg6IDNweDtcbiAgICB9XG4gIGAucmVwbGFjZSgvWyBcXG5dKy8sIFwiIFwiKSxcblxuICBtYWtlSWNvbnMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFNWRy5zZXRQcm9wcyhcbiAgICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIwLjggMy43Yy0uNC0uMi0uOS0uMS0xLjIuMi0yIDEuNi00LjggMS42LTYuOCAwLTIuMy0xLjktNS42LTIuMy04LjMtMXYtLjRjMC0uNi0uNS0xLTEtMXMtMSAuNC0xIDF2MTguOGMwIC41LjUgMSAxIDFoLjFjLjUgMCAxLS41IDEtMXYtNi40YzEtLjcgMi4xLTEuMiAzLjQtMS4zIDEuMiAwIDIuNC40IDMuNCAxLjIgMi45IDIuMyA3IDIuMyA5LjggMCAuMy0uMi40LS41LjQtLjlWNC43YzAtLjUtLjMtLjktLjgtMXptLS4zIDEwLjJDMTggMTYgMTQuNCAxNiAxMS45IDE0Yy0xLjEtLjktMi41LTEuNC00LTEuNC0xLjIuMS0yLjMuNS0zLjQgMS4xVjRjMi41LTEuNCA1LjUtMS4xIDcuNy42IDIuNCAxLjkgNS43IDEuOSA4LjEgMGguMmwuMS4xLS4xIDkuMnpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzQ1OTkzZFwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjAuNiA0LjhsLS4xIDkuMXYuMWMtMi41IDItNi4xIDItOC42IDAtMS4xLS45LTIuNS0xLjQtNC0xLjQtMS4yLjEtMi4zLjUtMy40IDEuMVY0YzIuNS0xLjQgNS41LTEuMSA3LjcuNiAyLjQgMS45IDUuNyAxLjkgOC4xIDBoLjJjMCAuMS4xLjEuMS4yelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjNGNiZjU2XCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwiZ3JlZW5GbGFnXCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpIHRyYW5zbGF0ZSgtMyA0KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMi42OCAxMi4yYTEuNiAxLjYgMCAwIDEtMS4yNy42M2gtNy42OWExLjU5IDEuNTkgMCAwIDEtMS4xNi0yLjU4bDEuMTItMS40MWE0LjgyIDQuODIgMCAwIDAtMy4xNC0uNzcgNC4zMSA0LjMxIDAgMCAwLTIgLjhBNC4yNSA0LjI1IDAgMCAwIDcuMiAxMC42YTUuMDYgNS4wNiAwIDAgMCAuNTQgNC42MkE1LjU4IDUuNTggMCAwIDAgMTIgMTcuNzRhMi4yNiAyLjI2IDAgMCAxLS4xNiA0LjUyQTEwLjI1IDEwLjI1IDAgMCAxIDMuNzQgMThhMTAuMTQgMTAuMTQgMCAwIDEtMS40OS05LjIyIDkuNyA5LjcgMCAwIDEgMi44My00LjE0QTkuOTIgOS45MiAwIDAgMSA5LjY2IDIuNWExMC42NiAxMC42NiAwIDAgMSA3LjcyIDEuNjhsMS4wOC0xLjM1YTEuNTcgMS41NyAwIDAgMSAxLjI0LS42IDEuNiAxLjYgMCAwIDEgMS41NCAxLjIxbDEuNyA3LjM3YTEuNTcgMS41NyAwIDAgMS0uMjYgMS4zOXpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzNkNzljY1wiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjEuMzggMTEuODNoLTcuNjFhLjU5LjU5IDAgMCAxLS40My0xbDEuNzUtMi4xOWE1LjkgNS45IDAgMCAwLTQuNy0xLjU4IDUuMDcgNS4wNyAwIDAgMC00LjExIDMuMTdBNiA2IDAgMCAwIDcgMTUuNzdhNi41MSA2LjUxIDAgMCAwIDUgMi45MiAxLjMxIDEuMzEgMCAwIDEtLjA4IDIuNjIgOS4zIDkuMyAwIDAgMS03LjM1LTMuODIgOS4xNiA5LjE2IDAgMCAxLTEuNC04LjM3QTguNTEgOC41MSAwIDAgMSA1LjcxIDUuNGE4Ljc2IDguNzYgMCAwIDEgNC4xMS0xLjkyIDkuNzEgOS43MSAwIDAgMSA3Ljc1IDIuMDdsMS42Ny0yLjFhLjU5LjU5IDAgMCAxIDEgLjIxTDIyIDExLjA4YS41OS41OSAwIDAgMS0uNjIuNzV6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJ0dXJuUmlnaHRcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSkgdHJhbnNsYXRlKC0yIC01KVwiLCAvLyBUT0RPXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0yMC4zNCAxOC4yMWExMC4yNCAxMC4yNCAwIDAgMS04LjEgNC4yMiAyLjI2IDIuMjYgMCAwIDEtLjE2LTQuNTIgNS41OCA1LjU4IDAgMCAwIDQuMjUtMi41MyA1LjA2IDUuMDYgMCAwIDAgLjU0LTQuNjJBNC4yNSA0LjI1IDAgMCAwIDE1LjU1IDlhNC4zMSA0LjMxIDAgMCAwLTItLjggNC44MiA0LjgyIDAgMCAwLTMuMTUuOGwxLjEyIDEuNDFBMS41OSAxLjU5IDAgMCAxIDEwLjM2IDEzSDIuNjdhMS41NiAxLjU2IDAgMCAxLTEuMjYtLjYzQTEuNTQgMS41NCAwIDAgMSAxLjEzIDExbDEuNzItNy40M0ExLjU5IDEuNTkgMCAwIDEgNC4zOCAyLjRhMS41NyAxLjU3IDAgMCAxIDEuMjQuNkw2LjcgNC4zNWExMC42NiAxMC42NiAwIDAgMSA3LjcyLTEuNjhBOS44OCA5Ljg4IDAgMCAxIDE5IDQuODEgOS42MSA5LjYxIDAgMCAxIDIxLjgzIDlhMTAuMDggMTAuMDggMCAwIDEtMS40OSA5LjIxelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjM2Q3OWNjXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0xOS41NiAxNy42NWE5LjI5IDkuMjkgMCAwIDEtNy4zNSAzLjgzIDEuMzEgMS4zMSAwIDAgMS0uMDgtMi42MiA2LjUzIDYuNTMgMCAwIDAgNS0yLjkyIDYuMDUgNi4wNSAwIDAgMCAuNjctNS41MSA1LjMyIDUuMzIgMCAwIDAtMS42NC0yLjE2IDUuMjEgNS4yMSAwIDAgMC0yLjQ4LTFBNS44NiA1Ljg2IDAgMCAwIDkgOC44NEwxMC43NCAxMWEuNTkuNTkgMCAwIDEtLjQzIDFIMi43YS42LjYgMCAwIDEtLjYtLjc1bDEuNzEtNy40MmEuNTkuNTkgMCAwIDEgMS0uMjFsMS42NyAyLjFhOS43MSA5LjcxIDAgMCAxIDcuNzUtMi4wNyA4Ljg0IDguODQgMCAwIDEgNC4xMiAxLjkyIDguNjggOC42OCAwIDAgMSAyLjU0IDMuNzIgOS4xNCA5LjE0IDAgMCAxLTEuMzMgOC4zNnpcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcInR1cm5MZWZ0XCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpIHRyYW5zbGF0ZSgtMiAtNSlcIiwgLy8gVE9ET1xuICAgICAgICB9XG4gICAgICApLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTAgMEw0IDRMMCA4WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiYWRkSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTQgMEw0IDhMMCA0WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiZGVsSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMjMuMyAxMWMtLjMuNi0uOSAxLTEuNSAxaC0xLjZjLS4xIDEuMy0uNSAyLjUtMS4xIDMuNi0uOSAxLjctMi4zIDMuMi00LjEgNC4xLTEuNy45LTMuNiAxLjItNS41LjktMS44LS4zLTMuNS0xLjEtNC45LTIuMy0uNy0uNy0uNy0xLjkgMC0yLjYuNi0uNiAxLjYtLjcgMi4zLS4ySDdjLjkuNiAxLjkuOSAyLjkuOXMxLjktLjMgMi43LS45YzEuMS0uOCAxLjgtMi4xIDEuOC0zLjVoLTEuNWMtLjkgMC0xLjctLjctMS43LTEuNyAwLS40LjItLjkuNS0xLjJsNC40LTQuNGMuNy0uNiAxLjctLjYgMi40IDBMMjMgOS4yYy41LjUuNiAxLjIuMyAxLjh6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiNjZjhiMTdcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTIxLjggMTFoLTIuNmMwIDEuNS0uMyAyLjktMSA0LjItLjggMS42LTIuMSAyLjgtMy43IDMuNi0xLjUuOC0zLjMgMS4xLTQuOS44LTEuNi0uMi0zLjItMS00LjQtMi4xLS40LS4zLS40LS45LS4xLTEuMi4zLS40LjktLjQgMS4yLS4xIDEgLjcgMi4yIDEuMSAzLjQgMS4xczIuMy0uMyAzLjMtMWMuOS0uNiAxLjYtMS41IDItMi42LjMtLjkuNC0xLjguMi0yLjhoLTIuNGMtLjQgMC0uNy0uMy0uNy0uNyAwLS4yLjEtLjMuMi0uNGw0LjQtNC40Yy4zLS4zLjctLjMuOSAwTDIyIDkuOGMuMy4zLjQuNi4zLjlzLS4zLjMtLjUuM3pcIixcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcImxvb3BBcnJvd1wiLFxuICAgICAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgwLjY1KSB0cmFuc2xhdGUoLTE1IC0yNSlcIiwgLy8gVE9ET1xuICAgICAgICB9XG4gICAgICApLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDpcbiAgICAgICAgICAgICAgXCJNMTIuNzEgMi40NEEyLjQxIDIuNDEgMCAwIDEgMTIgNC4xNkw4LjA4IDguMDhhMi40NSAyLjQ1IDAgMCAxLTMuNDUgMEwuNzIgNC4xNkEyLjQyIDIuNDIgMCAwIDEgMCAyLjQ0IDIuNDggMi40OCAwIDAgMSAuNzEuNzFDMSAuNDcgMS40MyAwIDYuMzYgMHM1LjM5LjQ2IDUuNjQuNzFhMi40NCAyLjQ0IDAgMCAxIC43MSAxLjczelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjMjMxZjIwXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiBcIi4xXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk02LjM2IDcuNzlhMS40MyAxLjQzIDAgMCAxLTEtLjQyTDEuNDIgMy40NWExLjQ0IDEuNDQgMCAwIDEgMC0yYy41Ni0uNTYgOS4zMS0uNTYgOS44NyAwYTEuNDQgMS40NCAwIDAgMSAwIDJMNy4zNyA3LjM3YTEuNDMgMS40MyAwIDAgMS0xLjAxLjQyelwiLFxuICAgICAgICAgICAgZmlsbDogXCIjZmZmXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IFwid2hpdGVEcm9wZG93bkFycm93XCIsXG4gICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDAuNjUpXCIsXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOlxuICAgICAgICAgICAgICBcIk0xMi43MSAyLjQ0QTIuNDEgMi40MSAwIDAgMSAxMiA0LjE2TDguMDggOC4wOGEyLjQ1IDIuNDUgMCAwIDEtMy40NSAwTC43MiA0LjE2QTIuNDIgMi40MiAwIDAgMSAwIDIuNDQgMi40OCAyLjQ4IDAgMCAxIC43MS43MUMxIC40NyAxLjQzIDAgNi4zNiAwczUuMzkuNDYgNS42NC43MWEyLjQ0IDIuNDQgMCAwIDEgLjcxIDEuNzN6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMyMzFmMjBcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiLjFcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgIGQ6XG4gICAgICAgICAgICAgIFwiTTYuMzYgNy43OWExLjQzIDEuNDMgMCAwIDEtMS0uNDJMMS40MiAzLjQ1YTEuNDQgMS40NCAwIDAgMSAwLTJjLjU2LS41NiA5LjMxLS41NiA5Ljg3IDBhMS40NCAxLjQ0IDAgMCAxIDAgMkw3LjM3IDcuMzdhMS40MyAxLjQzIDAgMCAxLTEuMDEuNDJ6XCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJibGFja0Ryb3Bkb3duQXJyb3dcIixcbiAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMC42NSlcIixcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICBdXG4gIH0sXG5cbiAgbWFrZVN0eWxlKCkge1xuICAgIHZhciBzdHlsZSA9IFNWRy5lbChcInN0eWxlXCIpXG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoU1ZHLmNkYXRhKFN0eWxlLmNzc0NvbnRlbnQpKVxuICAgIHJldHVybiBzdHlsZVxuICB9LFxuXG4gIGJldmVsRmlsdGVyKGlkLCBpbnNldCkge1xuICAgIHZhciBmID0gbmV3IEZpbHRlcihpZClcblxuICAgIHZhciBhbHBoYSA9IFwiU291cmNlQWxwaGFcIlxuICAgIHZhciBzID0gaW5zZXQgPyAtMSA6IDFcbiAgICB2YXIgYmx1ciA9IGYuYmx1cigxLCBhbHBoYSlcblxuICAgIGYubWVyZ2UoW1xuICAgICAgXCJTb3VyY2VHcmFwaGljXCIsXG4gICAgICBmLmNvbXAoXG4gICAgICAgIFwiaW5cIixcbiAgICAgICAgZi5mbG9vZChcIiNmZmZcIiwgMC4xNSksXG4gICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KCtzLCArcywgYmx1cikpXG4gICAgICApLFxuICAgICAgZi5jb21wKFxuICAgICAgICBcImluXCIsXG4gICAgICAgIGYuZmxvb2QoXCIjMGYwXCIsIDAuNyksXG4gICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KC1zLCAtcywgYmx1cikpXG4gICAgICApLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRhcmtGaWx0ZXIoaWQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpXG5cbiAgICBmLm1lcmdlKFtcbiAgICAgIFwiU291cmNlR3JhcGhpY1wiLFxuICAgICAgZi5jb21wKFwiaW5cIiwgZi5mbG9vZChcIiMwMDBcIiwgMC4yKSwgXCJTb3VyY2VBbHBoYVwiKSxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkZXNhdHVyYXRlRmlsdGVyKGlkKSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKVxuXG4gICAgdmFyIHEgPSAwLjMzM1xuICAgIHZhciBzID0gMC4zMzNcbiAgICBmLmNvbG9yTWF0cml4KFwiU291cmNlR3JhcGhpY1wiLCBbXG4gICAgICBxLFxuICAgICAgcyxcbiAgICAgIHMsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHMsXG4gICAgICBxLFxuICAgICAgcyxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgcyxcbiAgICAgIHMsXG4gICAgICBxLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAxLFxuICAgICAgMCxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkYXJrUmVjdCh3LCBoLCBjYXRlZ29yeSwgZWwpIHtcbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKFxuICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgICAgY2xhc3M6IFtcInNiLVwiICsgY2F0ZWdvcnksIFwic2ItZGFya2VyXCJdLmpvaW4oXCIgXCIpLFxuICAgICAgICB9KSxcbiAgICAgIF0pLFxuICAgICAgeyB3aWR0aDogdywgaGVpZ2h0OiBoIH1cbiAgICApXG4gIH0sXG5cbiAgZGVmYXVsdEZvbnRGYW1pbHk6IFwiJ0hlbHZldGljYSBOZXVlJywgSGVsdmV0aWNhLCBzYW5zLXNlcmlmXCIsXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykge1xuICAgIHJldHVybiBvICYmIG8uY29uc3RydWN0b3IgPT09IEFycmF5XG4gIH1cbiAgZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxuICB9XG5cbiAgdmFyIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgR2xvdyxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH0gPSByZXF1aXJlKFwiLi9tb2RlbC5qc1wiKVxuXG4gIHZhciB7XG4gICAgYWxsTGFuZ3VhZ2VzLFxuICAgIGxvb2t1cERyb3Bkb3duLFxuICAgIGhleENvbG9yUGF0LFxuICAgIG1pbmlmeUhhc2gsXG4gICAgbG9va3VwSGFzaCxcbiAgICBoYXNoU3BlYyxcbiAgICBhcHBseU92ZXJyaWRlcyxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgaWNvblBhdCxcbiAgICBibG9ja05hbWUsXG4gIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICBmdW5jdGlvbiBwYWludEJsb2NrKGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpIHtcbiAgICB2YXIgb3ZlcnJpZGVzID0gW11cbiAgICBpZiAoaXNBcnJheShjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSkpIHtcbiAgICAgIG92ZXJyaWRlcyA9IGNoaWxkcmVuLnBvcCgpXG4gICAgfVxuXG4gICAgLy8gYnVpbGQgaGFzaFxuICAgIHZhciB3b3JkcyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgIGlmIChjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgIHdvcmRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzSWNvbikge1xuICAgICAgICB3b3Jkcy5wdXNoKFwiQFwiICsgY2hpbGQubmFtZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmRzLnB1c2goXCJfXCIpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBoYXNoID0gKGluZm8uaGFzaCA9IG1pbmlmeUhhc2god29yZHMuam9pbihcIiBcIikpKVxuXG4gICAgLy8gcGFpbnRcbiAgICB2YXIgbyA9IGxvb2t1cEhhc2goaGFzaCwgaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcylcbiAgICBpZiAobykge1xuICAgICAgdmFyIGxhbmcgPSBvLmxhbmdcbiAgICAgIHZhciB0eXBlID0gby50eXBlXG4gICAgICBpbmZvLmxhbmd1YWdlID0gbGFuZ1xuICAgICAgaW5mby5pc1JUTCA9IHJ0bExhbmd1YWdlcy5pbmRleE9mKGxhbmcuY29kZSkgPiAtMVxuXG4gICAgICBpZiAoXG4gICAgICAgIHR5cGUuc2hhcGUgPT09IFwicmluZ1wiXG4gICAgICAgICAgPyBpbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgICA6IGluZm8uc2hhcGUgPT09IFwic3RhY2tcIlxuICAgICAgKSB7XG4gICAgICAgIGluZm8uc2hhcGUgPSB0eXBlLnNoYXBlXG4gICAgICB9XG4gICAgICBpbmZvLmNhdGVnb3J5ID0gdHlwZS5jYXRlZ29yeVxuICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICBpZiAodHlwZS5zZWxlY3RvcikgaW5mby5zZWxlY3RvciA9IHR5cGUuc2VsZWN0b3IgLy8gZm9yIHRvSlNPTlxuICAgICAgaW5mby5oYXNMb29wQXJyb3cgPSB0eXBlLmhhc0xvb3BBcnJvd1xuXG4gICAgICAvLyBlbGxpcHNpcyBibG9ja1xuICAgICAgaWYgKHR5cGUuc3BlYyA9PT0gXCIuIC4gLlwiKSB7XG4gICAgICAgIGNoaWxkcmVuID0gW25ldyBMYWJlbChcIi4gLiAuXCIpXVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG92ZXJyaWRlc1xuICAgIGFwcGx5T3ZlcnJpZGVzKGluZm8sIG92ZXJyaWRlcylcblxuICAgIC8vIGxvb3AgYXJyb3dzXG4gICAgaWYgKGluZm8uaGFzTG9vcEFycm93KSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBJY29uKFwibG9vcEFycm93XCIpKVxuICAgIH1cblxuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayhpbmZvLCBjaGlsZHJlbilcblxuICAgIC8vIGltYWdlIHJlcGxhY2VtZW50XG4gICAgaWYgKHR5cGUgJiYgaWNvblBhdC50ZXN0KHR5cGUuc3BlYykpIHtcbiAgICAgIGJsb2NrLnRyYW5zbGF0ZShsYW5nLCB0cnVlKVxuICAgIH1cblxuICAgIC8vIGRpZmZzXG4gICAgaWYgKGluZm8uZGlmZiA9PT0gXCIrXCIpIHtcbiAgICAgIHJldHVybiBuZXcgR2xvdyhibG9jaylcbiAgICB9IGVsc2Uge1xuICAgICAgYmxvY2suZGlmZiA9IGluZm8uZGlmZlxuICAgIH1cbiAgICByZXR1cm4gYmxvY2tcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlTGluZXMoY29kZSwgbGFuZ3VhZ2VzKSB7XG4gICAgdmFyIHRvayA9IGNvZGVbMF1cbiAgICB2YXIgaW5kZXggPSAwXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIHRvayA9IGNvZGVbKytpbmRleF1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgIHJldHVybiBjb2RlW2luZGV4ICsgMV1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGVla05vbldzKCkge1xuICAgICAgZm9yICh2YXIgaSA9IGluZGV4ICsgMTsgaSA8IGNvZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNvZGVbaV0gIT09IFwiIFwiKSByZXR1cm4gY29kZVtpXVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2F3TkxcblxuICAgIHZhciBkZWZpbmUgPSBbXVxuICAgIGxhbmd1YWdlcy5tYXAoZnVuY3Rpb24obGFuZykge1xuICAgICAgZGVmaW5lID0gZGVmaW5lLmNvbmNhdChsYW5nLmRlZmluZSlcbiAgICB9KVxuICAgIC8vIE5CLiB3ZSBhc3N1bWUgJ2RlZmluZScgaXMgYSBzaW5nbGUgd29yZCBpbiBldmVyeSBsYW5ndWFnZVxuICAgIGZ1bmN0aW9uIGlzRGVmaW5lKHdvcmQpIHtcbiAgICAgIHJldHVybiBkZWZpbmUuaW5kZXhPZih3b3JkKSA+IC0xXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUJsb2NrKHNoYXBlLCBjaGlsZHJlbikge1xuICAgICAgdmFyIGhhc0lucHV0cyA9ICEhY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4LmlzTGFiZWxcbiAgICAgIH0pLmxlbmd0aFxuICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgIHNoYXBlOiBzaGFwZSxcbiAgICAgICAgY2F0ZWdvcnk6XG4gICAgICAgICAgc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgICAgICAgICA/IFwiY3VzdG9tXCJcbiAgICAgICAgICAgIDogc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiAhaGFzSW5wdXRzID8gXCJ2YXJpYWJsZXNcIiA6IFwib2Jzb2xldGVcIixcbiAgICAgICAgY2F0ZWdvcnlJc0RlZmF1bHQ6IHRydWUsXG4gICAgICAgIGhhc0xvb3BBcnJvdzogZmFsc2UsXG4gICAgICB9XG4gICAgICByZXR1cm4gcGFpbnRCbG9jayhpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VNZW51KHNoYXBlLCB2YWx1ZSkge1xuICAgICAgdmFyIG1lbnUgPSBsb29rdXBEcm9wZG93bih2YWx1ZSwgbGFuZ3VhZ2VzKSB8fCB2YWx1ZVxuICAgICAgcmV0dXJuIG5ldyBJbnB1dChzaGFwZSwgdmFsdWUsIG1lbnUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFBhcnRzKGVuZCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgIHZhciBsYWJlbFxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCI8XCIgfHwgKHRvayA9PT0gXCI+XCIgJiYgZW5kID09PSBcIj5cIikpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgICAgICAgdmFyIGMgPSBwZWVrTm9uV3MoKVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGxhc3QgJiZcbiAgICAgICAgICAgICFsYXN0LmlzTGFiZWwgJiZcbiAgICAgICAgICAgIChjID09PSBcIltcIiB8fCBjID09PSBcIihcIiB8fCBjID09PSBcIjxcIiB8fCBjID09PSBcIntcIilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwodG9rKSlcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBicmVha1xuICAgICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiICYmICFlbmQpIGJyZWFrXG5cbiAgICAgICAgc3dpdGNoICh0b2spIHtcbiAgICAgICAgICBjYXNlIFwiW1wiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBTdHJpbmcoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwUmVwb3J0ZXIoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwUHJlZGljYXRlKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocEVtYmVkZGVkKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCIgXCI6XG4gICAgICAgICAgY2FzZSBcIlxcdFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBpZiAobGFiZWwgJiYgaXNEZWZpbmUobGFiZWwudmFsdWUpKSB7XG4gICAgICAgICAgICAgIC8vIGRlZmluZSBoYXRcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3V0bGluZSgpKVxuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwi4peCXCI6XG4gICAgICAgICAgY2FzZSBcIuKWuFwiOlxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwSWNvbigpKVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJAXCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIHZhciBuYW1lID0gXCJcIlxuICAgICAgICAgICAgd2hpbGUgKHRvayAmJiAvW2EtekEtWl0vLnRlc3QodG9rKSkge1xuICAgICAgICAgICAgICBuYW1lICs9IHRva1xuICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcImNsb3VkXCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwoXCLimIFcIikpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgICAgICAgIEljb24uaWNvbnMuaGFzT3duUHJvcGVydHkobmFtZSlcbiAgICAgICAgICAgICAgICAgID8gbmV3IEljb24obmFtZSlcbiAgICAgICAgICAgICAgICAgIDogbmV3IExhYmVsKFwiQFwiICsgbmFtZSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgICAgICBuZXh0KCkgLy8gZXNjYXBlIGNoYXJhY3RlclxuICAgICAgICAgIC8vIGZhbGwtdGhydVxuICAgICAgICAgIGNhc2UgXCI6XCI6XG4gICAgICAgICAgICBpZiAodG9rID09PSBcIjpcIiAmJiBwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE92ZXJyaWRlcyhlbmQpKVxuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICAgICAgICAgIH0gLy8gZmFsbC10aHJ1XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICghbGFiZWwpIGNoaWxkcmVuLnB1c2goKGxhYmVsID0gbmV3IExhYmVsKFwiXCIpKSlcbiAgICAgICAgICAgIGxhYmVsLnZhbHVlICs9IHRva1xuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGlsZHJlblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBTdHJpbmcoKSB7XG4gICAgICBuZXh0KCkgLy8gJ1snXG4gICAgICB2YXIgcyA9IFwiXCJcbiAgICAgIHZhciBlc2NhcGVWID0gZmFsc2VcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIl1cIiAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBpZiAodG9rID09PSBcInZcIikgZXNjYXBlViA9IHRydWVcbiAgICAgICAgICBpZiAoIXRvaykgYnJlYWtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlc2NhcGVWID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBzICs9IHRva1xuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIGlmICh0b2sgPT09IFwiXVwiKSBuZXh0KClcbiAgICAgIGlmIChoZXhDb2xvclBhdC50ZXN0KHMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJjb2xvclwiLCBzKVxuICAgICAgfVxuICAgICAgcmV0dXJuICFlc2NhcGVWICYmIC8gdiQvLnRlc3QocylcbiAgICAgICAgPyBtYWtlTWVudShcImRyb3Bkb3duXCIsIHMuc2xpY2UoMCwgcy5sZW5ndGggLSAyKSlcbiAgICAgICAgOiBuZXcgSW5wdXQoXCJzdHJpbmdcIiwgcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwQmxvY2soZW5kKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoZW5kKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgc2F3TkwgPSB0cnVlXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgICAgIC8vIGRlZmluZSBoYXRzXG4gICAgICB2YXIgZmlyc3QgPSBjaGlsZHJlblswXVxuICAgICAgaWYgKGZpcnN0ICYmIGZpcnN0LmlzTGFiZWwgJiYgaXNEZWZpbmUoZmlyc3QudmFsdWUpKSB7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaChtYWtlQmxvY2soXCJvdXRsaW5lXCIsIFtdKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUJsb2NrKFwiZGVmaW5lLWhhdFwiLCBjaGlsZHJlbilcbiAgICAgIH1cblxuICAgICAgLy8gc3RhbmRhbG9uZSByZXBvcnRlcnNcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGNoaWxkLmlzQmxvY2sgJiZcbiAgICAgICAgICAoY2hpbGQuaXNSZXBvcnRlciB8fCBjaGlsZC5pc0Jvb2xlYW4gfHwgY2hpbGQuaXNSaW5nKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gY2hpbGRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwic3RhY2tcIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFJlcG9ydGVyKCkge1xuICAgICAgbmV4dCgpIC8vICcoJ1xuXG4gICAgICAvLyBlbXB0eSBudW1iZXItZHJvcGRvd25cbiAgICAgIGlmICh0b2sgPT09IFwiIFwiKSB7XG4gICAgICAgIG5leHQoKVxuICAgICAgICBpZiAodG9rID09PSBcInZ2XCIgJiYgcGVlaygpID09PSBcIilcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJudW1iZXItZHJvcGRvd25cIiwgXCJcIilcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rID09PSBcInZcIiAmJiBwZWVrKCkgPT09IFwiKVwiKSB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcInJvdW5kLWRyb3Bkb3duXCIsIFwiXCIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKFwiKVwiKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiKVwiKSBuZXh0KClcblxuICAgICAgLy8gZW1wdHkgbnVtYmVyc1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0KFwibnVtYmVyXCIsIFwiXCIpXG4gICAgICB9XG5cbiAgICAgIC8vIG51bWJlclxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBjaGlsZHJlblswXS5pc0xhYmVsKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGNoaWxkcmVuWzBdLnZhbHVlXG4gICAgICAgIGlmICgvXlswLTllLi1dKiQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcIm51bWJlclwiLCB2YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBudW1iZXItZHJvcGRvd25cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFjaGlsZHJlbltpXS5pc0xhYmVsKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGkgPT09IGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2kgLSAxXVxuICAgICAgICBpZiAoaSA+IDEgJiYgbGFzdC52YWx1ZSA9PT0gXCJ2dlwiKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucG9wKClcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjaGlsZHJlblxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbihsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBsLnZhbHVlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oXCIgXCIpXG4gICAgICAgICAgcmV0dXJuIG1ha2VNZW51KFwibnVtYmVyLWRyb3Bkb3duXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChpID4gMSAmJiBsYXN0LnZhbHVlID09PSBcInZcIikge1xuICAgICAgICAgIGNoaWxkcmVuLnBvcCgpXG4gICAgICAgICAgdmFyIHZhbHVlID0gY2hpbGRyZW5cbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24obCkge1xuICAgICAgICAgICAgICByZXR1cm4gbC52YWx1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKFwiIFwiKVxuICAgICAgICAgIHJldHVybiBtYWtlTWVudShcInJvdW5kLWRyb3Bkb3duXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBibG9jayA9IG1ha2VCbG9jayhcInJlcG9ydGVyXCIsIGNoaWxkcmVuKVxuXG4gICAgICAvLyByaW5nc1xuICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09IFwicmluZ1wiKSB7XG4gICAgICAgIHZhciBmaXJzdCA9IGJsb2NrLmNoaWxkcmVuWzBdXG4gICAgICAgIGlmIChcbiAgICAgICAgICBmaXJzdCAmJlxuICAgICAgICAgIGZpcnN0LmlzSW5wdXQgJiZcbiAgICAgICAgICBmaXJzdC5zaGFwZSA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgIGZpcnN0LnZhbHVlID09PSBcIlwiXG4gICAgICAgICkge1xuICAgICAgICAgIGJsb2NrLmNoaWxkcmVuWzBdID0gbmV3IElucHV0KFwicmVwb3J0ZXJcIilcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAoZmlyc3QgJiYgZmlyc3QuaXNTY3JpcHQgJiYgZmlyc3QuaXNFbXB0eSkgfHxcbiAgICAgICAgICAoZmlyc3QgJiYgZmlyc3QuaXNCbG9jayAmJiAhZmlyc3QuY2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICApIHtcbiAgICAgICAgICBibG9jay5jaGlsZHJlblswXSA9IG5ldyBJbnB1dChcInN0YWNrXCIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJsb2NrXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFByZWRpY2F0ZSgpIHtcbiAgICAgIG5leHQoKSAvLyAnPCdcbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhcIj5cIilcbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSBcIj5cIikgbmV4dCgpXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJib29sZWFuXCIpXG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwiYm9vbGVhblwiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwRW1iZWRkZWQoKSB7XG4gICAgICBuZXh0KCkgLy8gJ3snXG5cbiAgICAgIHNhd05MID0gZmFsc2VcbiAgICAgIHZhciBmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIn1cIikge1xuICAgICAgICAgIHZhciBibG9jayA9IHBCbG9jayhcIn1cIilcbiAgICAgICAgICBpZiAoYmxvY2spIHJldHVybiBibG9ja1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgc2NyaXB0cyA9IHBhcnNlU2NyaXB0cyhmKVxuICAgICAgdmFyIGJsb2NrcyA9IFtdXG4gICAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIGJsb2NrcyA9IGJsb2Nrcy5jb25jYXQoc2NyaXB0LmJsb2NrcylcbiAgICAgIH0pXG5cbiAgICAgIGlmICh0b2sgPT09IFwifVwiKSBuZXh0KClcbiAgICAgIGlmICghc2F3TkwpIHtcbiAgICAgICAgYXNzZXJ0KGJsb2Nrcy5sZW5ndGggPD0gMSlcbiAgICAgICAgcmV0dXJuIGJsb2Nrcy5sZW5ndGggPyBibG9ja3NbMF0gOiBtYWtlQmxvY2soXCJzdGFja1wiLCBbXSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2NyaXB0KGJsb2NrcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwSWNvbigpIHtcbiAgICAgIHZhciBjID0gdG9rXG4gICAgICBuZXh0KClcbiAgICAgIHN3aXRjaCAoYykge1xuICAgICAgICBjYXNlIFwi4pa4XCI6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJY29uKFwiYWRkSW5wdXRcIilcbiAgICAgICAgY2FzZSBcIuKXglwiOlxuICAgICAgICAgIHJldHVybiBuZXcgSWNvbihcImRlbElucHV0XCIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE92ZXJyaWRlcyhlbmQpIHtcbiAgICAgIG5leHQoKVxuICAgICAgbmV4dCgpXG4gICAgICB2YXIgb3ZlcnJpZGVzID0gW11cbiAgICAgIHZhciBvdmVycmlkZSA9IFwiXCJcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiIFwiKSB7XG4gICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgICBvdmVycmlkZXMucHVzaChvdmVycmlkZSlcbiAgICAgICAgICAgIG92ZXJyaWRlID0gXCJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG92ZXJyaWRlICs9IHRva1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKG92ZXJyaWRlKSBvdmVycmlkZXMucHVzaChvdmVycmlkZSlcbiAgICAgIHJldHVybiBvdmVycmlkZXNcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwQ29tbWVudChlbmQpIHtcbiAgICAgIG5leHQoKVxuICAgICAgbmV4dCgpXG4gICAgICB2YXIgY29tbWVudCA9IFwiXCJcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGNvbW1lbnQgKz0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiXFxuXCIpIG5leHQoKVxuICAgICAgcmV0dXJuIG5ldyBDb21tZW50KGNvbW1lbnQsIHRydWUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE91dGxpbmUoKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgZnVuY3Rpb24gcGFyc2VBcmcoa2luZCwgZW5kKSB7XG4gICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICBuZXh0KClcbiAgICAgICAgdmFyIHBhcnRzID0gcFBhcnRzKGVuZClcbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBuZXh0KClcbiAgICAgICAgY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICBwYWludEJsb2NrKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzaGFwZToga2luZCA9PT0gXCJib29sZWFuXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIixcbiAgICAgICAgICAgICAgYXJndW1lbnQ6IGtpbmQsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJ0cyxcbiAgICAgICAgICAgIGxhbmd1YWdlc1xuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgdmFyIGxhYmVsXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHRvaykge1xuICAgICAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgICAgICBwYXJzZUFyZyhcIm51bWJlclwiLCBcIilcIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIltcIjpcbiAgICAgICAgICAgIHBhcnNlQXJnKFwic3RyaW5nXCIsIFwiXVwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgcGFyc2VBcmcoXCJib29sZWFuXCIsIFwiPlwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiIFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIC8vIGZhbGwtdGhydVxuICAgICAgICAgIGNhc2UgXCI6XCI6XG4gICAgICAgICAgICBpZiAodG9rID09PSBcIjpcIiAmJiBwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE92ZXJyaWRlcygpKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSAvLyBmYWxsLXRocnVcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCFsYWJlbCkgY2hpbGRyZW4ucHVzaCgobGFiZWwgPSBuZXcgTGFiZWwoXCJcIikpKVxuICAgICAgICAgICAgbGFiZWwudmFsdWUgKz0gdG9rXG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VCbG9jayhcIm91dGxpbmVcIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcExpbmUoKSB7XG4gICAgICB2YXIgZGlmZlxuICAgICAgaWYgKHRvayA9PT0gXCIrXCIgfHwgdG9rID09PSBcIi1cIikge1xuICAgICAgICBkaWZmID0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgdmFyIGJsb2NrID0gcEJsb2NrKClcbiAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSBwQ29tbWVudCgpXG4gICAgICAgIGNvbW1lbnQuaGFzQmxvY2sgPSBibG9jayAmJiBibG9jay5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgaWYgKCFjb21tZW50Lmhhc0Jsb2NrKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1lbnRcbiAgICAgICAgfVxuICAgICAgICBibG9jay5jb21tZW50ID0gY29tbWVudFxuICAgICAgfVxuICAgICAgaWYgKGJsb2NrKSBibG9jay5kaWZmID0gZGlmZlxuICAgICAgcmV0dXJuIGJsb2NrXG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0b2spIHJldHVybiB1bmRlZmluZWRcbiAgICAgIHZhciBsaW5lID0gcExpbmUoKVxuICAgICAgcmV0dXJuIGxpbmUgfHwgXCJOTFwiXG4gICAgfVxuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIHBhcnNlU2NyaXB0cyhnZXRMaW5lKSB7XG4gICAgdmFyIGxpbmUgPSBnZXRMaW5lKClcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgbGluZSA9IGdldExpbmUoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBGaWxlKCkge1xuICAgICAgd2hpbGUgKGxpbmUgPT09IFwiTkxcIikgbmV4dCgpXG4gICAgICB2YXIgc2NyaXB0cyA9IFtdXG4gICAgICB3aGlsZSAobGluZSkge1xuICAgICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgICAgd2hpbGUgKGxpbmUgJiYgbGluZSAhPT0gXCJOTFwiKSB7XG4gICAgICAgICAgdmFyIGIgPSBwTGluZSgpXG4gICAgICAgICAgdmFyIGlzR2xvdyA9IGIuZGlmZiA9PT0gXCIrXCJcbiAgICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgICBiLmRpZmYgPSBudWxsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGIuaXNFbHNlIHx8IGIuaXNFbmQpIHtcbiAgICAgICAgICAgIGIgPSBuZXcgQmxvY2soXG4gICAgICAgICAgICAgIGV4dGVuZChiLmluZm8sIHtcbiAgICAgICAgICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgYi5jaGlsZHJlblxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNHbG93KSB7XG4gICAgICAgICAgICAgIGJsb2Nrcy5wb3AoKVxuICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBsYXN0LmNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgICAgICAgPyBsYXN0LmNoaWxkLmJsb2Nrc1xuICAgICAgICAgICAgICAgIDogW2xhc3QuY2hpbGRdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGIpXG4gICAgICAgICAgICBibG9ja3MucHVzaChuZXcgR2xvdyhuZXcgU2NyaXB0KGNoaWxkcmVuKSkpXG4gICAgICAgICAgfSBlbHNlIGlmIChiLmlzSGF0KSB7XG4gICAgICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICAgIGJsb2NrcyA9IFtiXVxuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0ZpbmFsKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNDb21tYW5kKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyByZXBvcnRlciBvciBwcmVkaWNhdGVcbiAgICAgICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgICAgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoW2JdKSlcbiAgICAgICAgICAgIGJsb2NrcyA9IFtdXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgd2hpbGUgKGxpbmUgPT09IFwiTkxcIikgbmV4dCgpXG4gICAgICB9XG4gICAgICByZXR1cm4gc2NyaXB0c1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBMaW5lKCkge1xuICAgICAgdmFyIGIgPSBsaW5lXG4gICAgICBuZXh0KClcblxuICAgICAgaWYgKGIuaGFzU2NyaXB0KSB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdmFyIGJsb2NrcyA9IHBNb3V0aCgpXG4gICAgICAgICAgYi5jaGlsZHJlbi5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICBpZiAobGluZSAmJiBsaW5lLmlzRWxzZSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGIuY2hpbGRyZW4ucHVzaChsaW5lLmNoaWxkcmVuW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobGluZSAmJiBsaW5lLmlzRW5kKSB7XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTW91dGgoKSB7XG4gICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgIHdoaWxlIChsaW5lKSB7XG4gICAgICAgIGlmIChsaW5lID09PSBcIk5MXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGlmICghbGluZS5pc0NvbW1hbmQpIHtcbiAgICAgICAgICByZXR1cm4gYmxvY2tzXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYiA9IHBMaW5lKClcbiAgICAgICAgdmFyIGlzR2xvdyA9IGIuZGlmZiA9PT0gXCIrXCJcbiAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgIGIuZGlmZiA9IG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV1cbiAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNHbG93KSB7XG4gICAgICAgICAgICBibG9ja3MucG9wKClcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGxhc3QuY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICAgICAgPyBsYXN0LmNoaWxkLmJsb2Nrc1xuICAgICAgICAgICAgICA6IFtsYXN0LmNoaWxkXVxuICAgICAgICAgIH1cbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKGIpXG4gICAgICAgICAgYmxvY2tzLnB1c2gobmV3IEdsb3cobmV3IFNjcmlwdChjaGlsZHJlbikpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBibG9ja3NcbiAgICB9XG5cbiAgICByZXR1cm4gcEZpbGUoKVxuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIGVhY2hCbG9jayh4LCBjYikge1xuICAgIGlmICh4LmlzU2NyaXB0KSB7XG4gICAgICB4LmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGVhY2hCbG9jayhibG9jaywgY2IpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoeC5pc0Jsb2NrKSB7XG4gICAgICBjYih4KVxuICAgICAgeC5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGVhY2hCbG9jayhjaGlsZCwgY2IpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoeC5pc0dsb3cpIHtcbiAgICAgIGVhY2hCbG9jayh4LmNoaWxkLCBjYilcbiAgICB9XG4gIH1cblxuICB2YXIgbGlzdEJsb2NrcyA9IHtcbiAgICBcImFwcGVuZDp0b0xpc3Q6XCI6IDEsXG4gICAgXCJkZWxldGVMaW5lOm9mTGlzdDpcIjogMSxcbiAgICBcImluc2VydDphdDpvZkxpc3Q6XCI6IDIsXG4gICAgXCJzZXRMaW5lOm9mTGlzdDp0bzpcIjogMSxcbiAgICBcInNob3dMaXN0OlwiOiAwLFxuICAgIFwiaGlkZUxpc3Q6XCI6IDAsXG4gIH1cblxuICBmdW5jdGlvbiByZWNvZ25pc2VTdHVmZihzY3JpcHRzKSB7XG4gICAgdmFyIGN1c3RvbUJsb2Nrc0J5SGFzaCA9IHt9XG4gICAgdmFyIGxpc3ROYW1lcyA9IHt9XG5cbiAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICB2YXIgY3VzdG9tQXJncyA9IHt9XG5cbiAgICAgIGVhY2hCbG9jayhzY3JpcHQsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIC8vIGN1c3RvbSBibG9ja3NcbiAgICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiKSB7XG4gICAgICAgICAgdmFyIG91dGxpbmUgPSBibG9jay5jaGlsZHJlblsxXVxuICAgICAgICAgIGlmICghb3V0bGluZSkgcmV0dXJuXG5cbiAgICAgICAgICB2YXIgbmFtZXMgPSBbXVxuICAgICAgICAgIHZhciBwYXJ0cyA9IFtdXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdXRsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBvdXRsaW5lLmNoaWxkcmVuW2ldXG4gICAgICAgICAgICBpZiAoY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGNoaWxkLnZhbHVlKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0Jsb2NrKSB7XG4gICAgICAgICAgICAgIGlmICghY2hpbGQuaW5mby5hcmd1bWVudCkgcmV0dXJuXG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbnVtYmVyOiBcIiVuXCIsXG4gICAgICAgICAgICAgICAgICBzdHJpbmc6IFwiJXNcIixcbiAgICAgICAgICAgICAgICAgIGJvb2xlYW46IFwiJWJcIixcbiAgICAgICAgICAgICAgICB9W2NoaWxkLmluZm8uYXJndW1lbnRdXG4gICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShjaGlsZClcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChuYW1lKVxuICAgICAgICAgICAgICBjdXN0b21BcmdzW25hbWVdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc3BlYyA9IHBhcnRzLmpvaW4oXCIgXCIpXG4gICAgICAgICAgdmFyIGhhc2ggPSBoYXNoU3BlYyhzcGVjKVxuICAgICAgICAgIHZhciBpbmZvID0gKGN1c3RvbUJsb2Nrc0J5SGFzaFtoYXNoXSA9IHtcbiAgICAgICAgICAgIHNwZWM6IHNwZWMsXG4gICAgICAgICAgICBuYW1lczogbmFtZXMsXG4gICAgICAgICAgfSlcbiAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJwcm9jRGVmXCJcbiAgICAgICAgICBibG9jay5pbmZvLmNhbGwgPSBpbmZvLnNwZWNcbiAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lc1xuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImN1c3RvbVwiXG5cbiAgICAgICAgICAvLyBmaXggdXAgaWYvZWxzZSBzZWxlY3RvcnNcbiAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLnNlbGVjdG9yID09PSBcImRvSWZFbHNlXCIpIHtcbiAgICAgICAgICB2YXIgbGFzdDIgPSBibG9jay5jaGlsZHJlbltibG9jay5jaGlsZHJlbi5sZW5ndGggLSAyXVxuICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPVxuICAgICAgICAgICAgbGFzdDIgJiYgbGFzdDIuaXNMYWJlbCAmJiBsYXN0Mi52YWx1ZSA9PT0gXCJlbHNlXCJcbiAgICAgICAgICAgICAgPyBcImRvSWZFbHNlXCJcbiAgICAgICAgICAgICAgOiBcImRvSWZcIlxuXG4gICAgICAgICAgLy8gY3VzdG9tIGFyZ3VtZW50c1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgJiZcbiAgICAgICAgICAoYmxvY2suaXNSZXBvcnRlciB8fCBibG9jay5pc0Jvb2xlYW4pXG4gICAgICAgICkge1xuICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGJsb2NrKVxuICAgICAgICAgIGlmIChjdXN0b21BcmdzW25hbWVdKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJjdXN0b20tYXJnXCJcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwiZ2V0UGFyYW1cIlxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGxpc3QgbmFtZXNcbiAgICAgICAgfSBlbHNlIGlmIChsaXN0QmxvY2tzLmhhc093blByb3BlcnR5KGJsb2NrLmluZm8uc2VsZWN0b3IpKSB7XG4gICAgICAgICAgdmFyIGFyZ0luZGV4ID0gbGlzdEJsb2Nrc1tibG9jay5pbmZvLnNlbGVjdG9yXVxuICAgICAgICAgIHZhciBpbnB1dHMgPSBibG9jay5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbFxuICAgICAgICAgIH0pXG4gICAgICAgICAgdmFyIGlucHV0ID0gaW5wdXRzW2FyZ0luZGV4XVxuICAgICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5pc0lucHV0KSB7XG4gICAgICAgICAgICBsaXN0TmFtZXNbaW5wdXQudmFsdWVdID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgZWFjaEJsb2NrKHNjcmlwdCwgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgLy8gY3VzdG9tIGJsb2Nrc1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCAmJlxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwib2Jzb2xldGVcIlxuICAgICAgICApIHtcbiAgICAgICAgICB2YXIgaW5mbyA9IGN1c3RvbUJsb2Nrc0J5SGFzaFtibG9jay5pbmZvLmhhc2hdXG4gICAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcImNhbGxcIlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYWxsID0gaW5mby5zcGVjXG4gICAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lc1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwiY3VzdG9tXCJcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBsaXN0IHJlcG9ydGVyc1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmlzUmVwb3J0ZXIpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShibG9jaylcbiAgICAgICAgICBpZiAoIW5hbWUpIHJldHVyblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwidmFyaWFibGVzXCIgJiZcbiAgICAgICAgICAgIGxpc3ROYW1lc1tuYW1lXSAmJlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwibGlzdFwiXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwibGlzdFwiKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJjb250ZW50c09mTGlzdDpcIlxuICAgICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJ2YXJpYWJsZXNcIikge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwicmVhZFZhcmlhYmxlXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJlblwiXSxcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgY29kZSA9IGNvZGUucmVwbGFjZSgvJmx0Oy9nLCBcIjxcIilcbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxuL2csIFwiIFwiKVxuICAgIH1cblxuICAgIHZhciBsYW5ndWFnZXMgPSBvcHRpb25zLmxhbmd1YWdlcy5tYXAoZnVuY3Rpb24oY29kZSkge1xuICAgICAgcmV0dXJuIGFsbExhbmd1YWdlc1tjb2RlXVxuICAgIH0pXG5cbiAgICAvKiAqICovXG5cbiAgICB2YXIgZiA9IHBhcnNlTGluZXMoY29kZSwgbGFuZ3VhZ2VzKVxuICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpXG4gICAgcmVjb2duaXNlU3R1ZmYoc2NyaXB0cylcbiAgICByZXR1cm4gbmV3IERvY3VtZW50KHNjcmlwdHMpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBhcnNlOiBwYXJzZSxcbiAgfVxufSkoKVxuIl19
