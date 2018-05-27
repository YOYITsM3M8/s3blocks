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
  ["go to %m.location", " ", 1, "gotoSpriteOrMouse:"],
  ["glide %n seconds to x:%n y:%n", " ", 1, "glideSecs:toX:y:elapsed:from:"],
  ["change x by %n", " ", 1, "changeXposBy:"],
  ["set x to %n", " ", 1, "xpos:"],
  ["change y by %n", " ", 1, "changeYposBy:"],
  ["set y to %n", " ", 1, "ypos:"],
  ["set rotation style %m.rotationStyle", " ", 1, "setRotationStyle"],
  ["say %s for %n seconds", " ", 2, "say:duration:elapsed:from:"],
  ["say %s", " ", 2, "say:"],
  ["think %s for %n seconds", " ", 2, "think:duration:elapsed:from:"],
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
  ["clear", " ", 4, "clearPenTrails"],
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

  ["turn %m.motor on for %n seconds", " ", 20, ""],
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

  roundedRect(w, h, props) {
    return SVG.path(
      extend(props, {
        path: SVG.roundedPath(w, h),
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
      "L", 4, 0,
      "L", 8, 0,
      "L", 14, 5,
      "L", 24, 5,
      "L", 30, 0,
      "L", 32, 0,
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
      arr = arr.concat([
        "L",
        inset + 30,
        y,
        "L",
        inset + 24,
        y + 5,
        "L",
        inset + 14,
        y + 5,
        "L",
        inset + 8,
        y,
      ])
    }
    if (inset > 0) {
      arr = arr.concat(["L", inset + 2, y, "L", inset, y + 2])
    } else {
      arr = arr.concat(["L", inset + 3, y, "L", 0, y - 3])
    }
    return arr.join(" ")
  },

  getArm(w, armTop) {
    return [
      "L",
      15,
      armTop - 2,
      "L",
      15 + 2,
      armTop,
      "L",
      w - 3,
      armTop,
      "L",
      w,
      armTop + 3,
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
        ? "bold 12px Helevetica, Arial, DejaVu Sans, sans-serif"
        : /sb-literal/.test(this.cls)
          ? "normal 9px " + defaultFontFamily
          : "bold 10px " + defaultFontFamily
      this.metrics = cache[value] = Label.measure(value, font)
      // TODO: word-spacing? (fortunately it seems to have no effect!)
    }
  }

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
    greenFlag: { width: 5, height: 5, dy: -2, dx: -8 },
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
    this.hasArrow = shape === "dropdown" || shape === "number-dropdown"
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
    string: SVG.roundedRect,
    number: SVG.roundedRect,
    "number-dropdown": SVG.roundedRect,
    color: SVG.roundedRect,
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
      word-spacing: +1px;
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

    .sb-input {
      filter2: url(#inputBevelFilter);
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
      font-size: 9px;
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
      SVG.el("path", {
        d:
          "M.75,2A6.44,6.44,0,0,1,8.44,2h0a6.44,6.44,0,0,0,7.69,0V12.4a6.44,6.44,0,0,1-7.69,0h0a6.44,6.44,0,0,0-7.69,0",
        fill: "#4cbf56",
        stroke: "#45993d",
        id: "greenFlag",
      }),
      SVG.el("path", {
        d:
          "M6.724 0C3.01 0 0 2.91 0 6.5c0 2.316 1.253 4.35 3.14 5.5H5.17v-1.256C3.364 10.126 2.07 8.46 2.07 6.5 2.07 4.015 4.152 2 6.723 2c1.14 0 2.184.396 2.993 1.053L8.31 4.13c-.45.344-.398.826.11 1.08L15 8.5 13.858.992c-.083-.547-.514-.714-.963-.37l-1.532 1.172A6.825 6.825 0 0 0 6.723 0z",
        fill: "#fff",
        id: "turnRight",
      }),
      SVG.el("path", {
        d:
          "M3.637 1.794A6.825 6.825 0 0 1 8.277 0C11.99 0 15 2.91 15 6.5c0 2.316-1.253 4.35-3.14 5.5H9.83v-1.256c1.808-.618 3.103-2.285 3.103-4.244 0-2.485-2.083-4.5-4.654-4.5-1.14 0-2.184.396-2.993 1.053L6.69 4.13c.45.344.398.826-.11 1.08L0 8.5 1.142.992c.083-.547.514-.714.963-.37l1.532 1.172z",
        fill: "#fff",
        id: "turnLeft",
      }),
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
            d: "M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2",
            fill: "#000",
            opacity: "0.3",
          }),
          SVG.move(
            -1,
            -1,
            SVG.el("path", {
              d: "M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2",
              fill: "#fff",
              opacity: "0.9",
            })
          ),
        ]),
        {
          id: "loopArrow",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25XQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJmdW5jdGlvbiBtYWtlQ2FudmFzKCkge1xuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxufVxuXG52YXIgc2NyYXRjaGJsb2NrcyA9ICh3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vbGliL1wiKShcbiAgd2luZG93LFxuICBtYWtlQ2FudmFzXG4pKVxuXG4vLyBhZGQgb3VyIENTUyB0byB0aGUgcGFnZVxudmFyIHN0eWxlID0gc2NyYXRjaGJsb2Nrcy5tYWtlU3R5bGUoKVxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIC8vIExpc3Qgb2YgY2xhc3NlcyB3ZSdyZSBhbGxvd2VkIHRvIG92ZXJyaWRlLlxuXG4gIHZhciBvdmVycmlkZUNhdGVnb3JpZXMgPSBbXG4gICAgXCJtb3Rpb25cIixcbiAgICBcImxvb2tzXCIsXG4gICAgXCJzb3VuZFwiLFxuICAgIFwicGVuXCIsXG4gICAgXCJ2YXJpYWJsZXNcIixcbiAgICBcImxpc3RcIixcbiAgICBcImV2ZW50c1wiLFxuICAgIFwiY29udHJvbFwiLFxuICAgIFwic2Vuc2luZ1wiLFxuICAgIFwib3BlcmF0b3JzXCIsXG4gICAgXCJjdXN0b21cIixcbiAgICBcImN1c3RvbS1hcmdcIixcbiAgICBcImV4dGVuc2lvblwiLFxuICAgIFwiZ3JleVwiLFxuICAgIFwib2Jzb2xldGVcIixcbiAgXVxuICB2YXIgb3ZlcnJpZGVTaGFwZXMgPSBbXCJoYXRcIiwgXCJjYXBcIiwgXCJzdGFja1wiLCBcImJvb2xlYW5cIiwgXCJyZXBvcnRlclwiLCBcInJpbmdcIl1cblxuICAvLyBsYW5ndWFnZXMgdGhhdCBzaG91bGQgYmUgZGlzcGxheWVkIHJpZ2h0IHRvIGxlZnRcbiAgdmFyIHJ0bExhbmd1YWdlcyA9IFtcImFyXCIsIFwiZmFcIiwgXCJoZVwiXVxuXG4gIC8vIExpc3Qgb2YgY29tbWFuZHMgdGFrZW4gZnJvbSBTY3JhdGNoXG4gIHZhciBzY3JhdGNoQ29tbWFuZHMgPSByZXF1aXJlKFwiLi9jb21tYW5kcy5qc1wiKVxuXG4gIHZhciBjYXRlZ29yaWVzQnlJZCA9IHtcbiAgICAwOiBcIm9ic29sZXRlXCIsXG4gICAgMTogXCJtb3Rpb25cIixcbiAgICAyOiBcImxvb2tzXCIsXG4gICAgMzogXCJzb3VuZFwiLFxuICAgIDQ6IFwicGVuXCIsXG4gICAgNTogXCJldmVudHNcIixcbiAgICA2OiBcImNvbnRyb2xcIixcbiAgICA3OiBcInNlbnNpbmdcIixcbiAgICA4OiBcIm9wZXJhdG9yc1wiLFxuICAgIDk6IFwidmFyaWFibGVzXCIsXG4gICAgMTA6IFwiY3VzdG9tXCIsXG4gICAgMTE6IFwicGFyYW1ldGVyXCIsXG4gICAgMTI6IFwibGlzdFwiLFxuICAgIDIwOiBcImV4dGVuc2lvblwiLFxuICAgIDQyOiBcImdyZXlcIixcbiAgfVxuXG4gIHZhciB0eXBlU2hhcGVzID0ge1xuICAgIFwiIFwiOiBcInN0YWNrXCIsXG4gICAgYjogXCJib29sZWFuXCIsXG4gICAgYzogXCJjLWJsb2NrXCIsXG4gICAgZTogXCJpZi1ibG9ja1wiLFxuICAgIGY6IFwiY2FwXCIsXG4gICAgaDogXCJoYXRcIixcbiAgICByOiBcInJlcG9ydGVyXCIsXG4gICAgY2Y6IFwiYy1ibG9jayBjYXBcIixcbiAgICBlbHNlOiBcImNlbHNlXCIsXG4gICAgZW5kOiBcImNlbmRcIixcbiAgICByaW5nOiBcInJpbmdcIixcbiAgfVxuXG4gIHZhciBpbnB1dFBhdCA9IC8oJVthLXpBLVpdKD86XFwuW2EtekEtWjAtOV0rKT8pL1xuICB2YXIgaW5wdXRQYXRHbG9iYWwgPSBuZXcgUmVnRXhwKGlucHV0UGF0LnNvdXJjZSwgXCJnXCIpXG4gIHZhciBpY29uUGF0ID0gLyhAW2EtekEtWl0rKS9cbiAgdmFyIHNwbGl0UGF0ID0gbmV3IFJlZ0V4cChcbiAgICBbaW5wdXRQYXQuc291cmNlLCBcInxcIiwgaWNvblBhdC5zb3VyY2UsIFwifCArXCJdLmpvaW4oXCJcIiksXG4gICAgXCJnXCJcbiAgKVxuXG4gIHZhciBoZXhDb2xvclBhdCA9IC9eIyg/OlswLTlhLWZBLUZdezN9KXsxLDJ9PyQvXG5cbiAgZnVuY3Rpb24gcGFyc2VTcGVjKHNwZWMpIHtcbiAgICB2YXIgcGFydHMgPSBzcGVjLnNwbGl0KHNwbGl0UGF0KS5maWx0ZXIoeCA9PiAhIXgpXG4gICAgcmV0dXJuIHtcbiAgICAgIHNwZWM6IHNwZWMsXG4gICAgICBwYXJ0czogcGFydHMsXG4gICAgICBpbnB1dHM6IHBhcnRzLmZpbHRlcihmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiBpbnB1dFBhdC50ZXN0KHApXG4gICAgICB9KSxcbiAgICAgIGhhc2g6IGhhc2hTcGVjKHNwZWMpLFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc2hTcGVjKHNwZWMpIHtcbiAgICByZXR1cm4gbWluaWZ5SGFzaChzcGVjLnJlcGxhY2UoaW5wdXRQYXRHbG9iYWwsIFwiIF8gXCIpKVxuICB9XG5cbiAgZnVuY3Rpb24gbWluaWZ5SGFzaChoYXNoKSB7XG4gICAgcmV0dXJuIGhhc2hcbiAgICAgIC5yZXBsYWNlKC9fL2csIFwiIF8gXCIpXG4gICAgICAucmVwbGFjZSgvICsvZywgXCIgXCIpXG4gICAgICAucmVwbGFjZSgvWywlPzpdL2csIFwiXCIpXG4gICAgICAucmVwbGFjZSgvw58vZywgXCJzc1wiKVxuICAgICAgLnJlcGxhY2UoL8OkL2csIFwiYVwiKVxuICAgICAgLnJlcGxhY2UoL8O2L2csIFwib1wiKVxuICAgICAgLnJlcGxhY2UoL8O8L2csIFwidVwiKVxuICAgICAgLnJlcGxhY2UoXCIuIC4gLlwiLCBcIi4uLlwiKVxuICAgICAgLnJlcGxhY2UoL17igKYkLywgXCIuLi5cIilcbiAgICAgIC50cmltKClcbiAgICAgIC50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICB2YXIgYmxvY2tzQnlTZWxlY3RvciA9IHt9XG4gIHZhciBibG9ja3NCeVNwZWMgPSB7fVxuICB2YXIgYWxsQmxvY2tzID0gc2NyYXRjaENvbW1hbmRzLm1hcChmdW5jdGlvbihjb21tYW5kKSB7XG4gICAgdmFyIGluZm8gPSBleHRlbmQocGFyc2VTcGVjKGNvbW1hbmRbMF0pLCB7XG4gICAgICBzaGFwZTogdHlwZVNoYXBlc1tjb21tYW5kWzFdXSwgLy8gL1sgYmNlZmhyXXxjZi9cbiAgICAgIGNhdGVnb3J5OiBjYXRlZ29yaWVzQnlJZFtjb21tYW5kWzJdICUgMTAwXSxcbiAgICAgIHNlbGVjdG9yOiBjb21tYW5kWzNdLFxuICAgICAgaGFzTG9vcEFycm93OlxuICAgICAgICBbXCJkb1JlcGVhdFwiLCBcImRvVW50aWxcIiwgXCJkb0ZvcmV2ZXJcIl0uaW5kZXhPZihjb21tYW5kWzNdKSA+IC0xLFxuICAgIH0pXG4gICAgaWYgKGluZm8uc2VsZWN0b3IpIHtcbiAgICAgIC8vIG5iLiBjb21tYW5kIG9yZGVyIG1hdHRlcnMhXG4gICAgICAvLyBTY3JhdGNoIDEuNCBibG9ja3MgYXJlIGxpc3RlZCBsYXN0XG4gICAgICBpZiAoIWJsb2Nrc0J5U2VsZWN0b3JbaW5mby5zZWxlY3Rvcl0pXG4gICAgICAgIGJsb2Nrc0J5U2VsZWN0b3JbaW5mby5zZWxlY3Rvcl0gPSBpbmZvXG4gICAgfVxuICAgIHJldHVybiAoYmxvY2tzQnlTcGVjW2luZm8uc3BlY10gPSBpbmZvKVxuICB9KVxuXG4gIHZhciB1bmljb2RlSWNvbnMgPSB7XG4gICAgXCJAZ3JlZW5GbGFnXCI6IFwi4pqRXCIsXG4gICAgXCJAdHVyblJpZ2h0XCI6IFwi4oa7XCIsXG4gICAgXCJAdHVybkxlZnRcIjogXCLihrpcIixcbiAgICBcIkBhZGRJbnB1dFwiOiBcIuKWuFwiLFxuICAgIFwiQGRlbElucHV0XCI6IFwi4peCXCIsXG4gIH1cblxuICB2YXIgYWxsTGFuZ3VhZ2VzID0ge31cbiAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGNvZGUsIGxhbmd1YWdlKSB7XG4gICAgdmFyIGJsb2Nrc0J5SGFzaCA9IChsYW5ndWFnZS5ibG9ja3NCeUhhc2ggPSB7fSlcblxuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlLmNvbW1hbmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHNwZWMpIHtcbiAgICAgIHZhciBuYXRpdmVTcGVjID0gbGFuZ3VhZ2UuY29tbWFuZHNbc3BlY11cbiAgICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U3BlY1tzcGVjXVxuXG4gICAgICB2YXIgbmF0aXZlSGFzaCA9IGhhc2hTcGVjKG5hdGl2ZVNwZWMpXG4gICAgICBibG9ja3NCeUhhc2hbbmF0aXZlSGFzaF0gPSBibG9ja1xuXG4gICAgICAvLyBmYWxsYmFjayBpbWFnZSByZXBsYWNlbWVudCwgZm9yIGxhbmd1YWdlcyB3aXRob3V0IGFsaWFzZXNcbiAgICAgIHZhciBtID0gaWNvblBhdC5leGVjKHNwZWMpXG4gICAgICBpZiAobSkge1xuICAgICAgICB2YXIgaW1hZ2UgPSBtWzBdXG4gICAgICAgIHZhciBoYXNoID0gbmF0aXZlSGFzaC5yZXBsYWNlKGltYWdlLCB1bmljb2RlSWNvbnNbaW1hZ2VdKVxuICAgICAgICBibG9ja3NCeUhhc2hbaGFzaF0gPSBibG9ja1xuICAgICAgfVxuICAgIH0pXG5cbiAgICBsYW5ndWFnZS5uYXRpdmVBbGlhc2VzID0ge31cbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZS5hbGlhc2VzKS5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICB2YXIgc3BlYyA9IGxhbmd1YWdlLmFsaWFzZXNbYWxpYXNdXG4gICAgICB2YXIgYmxvY2sgPSBibG9ja3NCeVNwZWNbc3BlY11cblxuICAgICAgdmFyIGFsaWFzSGFzaCA9IGhhc2hTcGVjKGFsaWFzKVxuICAgICAgYmxvY2tzQnlIYXNoW2FsaWFzSGFzaF0gPSBibG9ja1xuXG4gICAgICBsYW5ndWFnZS5uYXRpdmVBbGlhc2VzW3NwZWNdID0gYWxpYXNcbiAgICB9KVxuXG4gICAgbGFuZ3VhZ2UubmF0aXZlRHJvcGRvd25zID0ge31cbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZS5kcm9wZG93bnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIG5hdGl2ZU5hbWUgPSBsYW5ndWFnZS5kcm9wZG93bnNbbmFtZV1cbiAgICAgIGxhbmd1YWdlLm5hdGl2ZURyb3Bkb3duc1tuYXRpdmVOYW1lXSA9IG5hbWVcbiAgICB9KVxuXG4gICAgbGFuZ3VhZ2UuY29kZSA9IGNvZGVcbiAgICBhbGxMYW5ndWFnZXNbY29kZV0gPSBsYW5ndWFnZVxuICB9XG4gIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZXMobGFuZ3VhZ2VzKSB7XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2VzKS5mb3JFYWNoKGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgIGxvYWRMYW5ndWFnZShjb2RlLCBsYW5ndWFnZXNbY29kZV0pXG4gICAgfSlcbiAgfVxuXG4gIHZhciBlbmdsaXNoID0ge1xuICAgIGFsaWFzZXM6IHtcbiAgICAgIFwidHVybiBsZWZ0ICVuIGRlZ3JlZXNcIjogXCJ0dXJuIEB0dXJuTGVmdCAlbiBkZWdyZWVzXCIsXG4gICAgICBcInR1cm4gY2N3ICVuIGRlZ3JlZXNcIjogXCJ0dXJuIEB0dXJuTGVmdCAlbiBkZWdyZWVzXCIsXG4gICAgICBcInR1cm4gcmlnaHQgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5SaWdodCAlbiBkZWdyZWVzXCIsXG4gICAgICBcInR1cm4gY3cgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5SaWdodCAlbiBkZWdyZWVzXCIsXG4gICAgICBcIndoZW4gZ2YgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgICBcIndoZW4gZmxhZyBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICAgIFwid2hlbiBncmVlbiBmbGFnIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgIH0sXG5cbiAgICBkZWZpbmU6IFtcImRlZmluZVwiXSxcblxuICAgIC8vIEZvciBpZ25vcmluZyB0aGUgbHQgc2lnbiBpbiB0aGUgXCJ3aGVuIGRpc3RhbmNlIDwgX1wiIGJsb2NrXG4gICAgaWdub3JlbHQ6IFtcIndoZW4gZGlzdGFuY2VcIl0sXG5cbiAgICAvLyBWYWxpZCBhcmd1bWVudHMgdG8gXCJvZlwiIGRyb3Bkb3duLCBmb3IgcmVzb2x2aW5nIGFtYmlndW91cyBzaXR1YXRpb25zXG4gICAgbWF0aDogW1xuICAgICAgXCJhYnNcIixcbiAgICAgIFwiZmxvb3JcIixcbiAgICAgIFwiY2VpbGluZ1wiLFxuICAgICAgXCJzcXJ0XCIsXG4gICAgICBcInNpblwiLFxuICAgICAgXCJjb3NcIixcbiAgICAgIFwidGFuXCIsXG4gICAgICBcImFzaW5cIixcbiAgICAgIFwiYWNvc1wiLFxuICAgICAgXCJhdGFuXCIsXG4gICAgICBcImxuXCIsXG4gICAgICBcImxvZ1wiLFxuICAgICAgXCJlIF5cIixcbiAgICAgIFwiMTAgXlwiLFxuICAgIF0sXG5cbiAgICAvLyBGb3IgZGV0ZWN0aW5nIHRoZSBcInN0b3BcIiBjYXAgLyBzdGFjayBibG9ja1xuICAgIG9zaXM6IFtcIm90aGVyIHNjcmlwdHMgaW4gc3ByaXRlXCIsIFwib3RoZXIgc2NyaXB0cyBpbiBzdGFnZVwiXSxcblxuICAgIGRyb3Bkb3duczoge30sXG5cbiAgICBjb21tYW5kczoge30sXG4gIH1cbiAgYWxsQmxvY2tzLmZvckVhY2goZnVuY3Rpb24oaW5mbykge1xuICAgIGVuZ2xpc2guY29tbWFuZHNbaW5mby5zcGVjXSA9IGluZm8uc3BlY1xuICB9KSxcbiAgICBsb2FkTGFuZ3VhZ2VzKHtcbiAgICAgIGVuOiBlbmdsaXNoLFxuICAgIH0pXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIGZ1bmN0aW9uIGRpc2FtYmlnKHNlbGVjdG9yMSwgc2VsZWN0b3IyLCB0ZXN0KSB7XG4gICAgdmFyIGZ1bmMgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgbGFuZykge1xuICAgICAgcmV0dXJuIGJsb2Nrc0J5U2VsZWN0b3JbdGVzdChjaGlsZHJlbiwgbGFuZykgPyBzZWxlY3RvcjEgOiBzZWxlY3RvcjJdXG4gICAgfVxuICAgIGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3IxXS5zcGVjaWFsQ2FzZSA9IGJsb2Nrc0J5U2VsZWN0b3JbXG4gICAgICBzZWxlY3RvcjJcbiAgICBdLnNwZWNpYWxDYXNlID0gZnVuY1xuICB9XG5cbiAgZGlzYW1iaWcoXCJjb21wdXRlRnVuY3Rpb246b2Y6XCIsIFwiZ2V0QXR0cmlidXRlOm9mOlwiLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIE9wZXJhdG9ycyBpZiBtYXRoIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2Vuc2luZyBcImF0dHJpYnV0ZSBvZlwiIGJsb2NrXG4gICAgdmFyIGZpcnN0ID0gY2hpbGRyZW5bMF1cbiAgICBpZiAoIWZpcnN0LmlzSW5wdXQpIHJldHVyblxuICAgIHZhciBuYW1lID0gZmlyc3QudmFsdWVcbiAgICByZXR1cm4gbGFuZy5tYXRoLmluZGV4T2YobmFtZSkgPiAtMVxuICB9KVxuXG4gIGRpc2FtYmlnKFwibGluZUNvdW50T2ZMaXN0OlwiLCBcInN0cmluZ0xlbmd0aDpcIiwgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBMaXN0IGJsb2NrIGlmIGRyb3Bkb3duLCBvdGhlcndpc2Ugb3BlcmF0b3JzXG4gICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgIGlmICghbGFzdC5pc0lucHV0KSByZXR1cm5cbiAgICByZXR1cm4gbGFzdC5zaGFwZSA9PT0gXCJkcm9wZG93blwiXG4gIH0pXG5cbiAgZGlzYW1iaWcoXCJwZW5Db2xvcjpcIiwgXCJzZXRQZW5IdWVUbzpcIiwgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBDb2xvciBibG9jayBpZiBjb2xvciBpbnB1dCwgb3RoZXJ3aXNlIG51bWVyaWNcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgLy8gSWYgdmFyaWFibGUsIGFzc3VtZSBjb2xvciBpbnB1dCwgc2luY2UgdGhlIFJHQkEgaGFjayBpcyBjb21tb24uXG4gICAgLy8gVE9ETyBmaXggU2NyYXRjaCA6UFxuICAgIHJldHVybiAobGFzdC5pc0lucHV0ICYmIGxhc3QuaXNDb2xvcikgfHwgbGFzdC5pc0Jsb2NrXG4gIH0pXG5cbiAgYmxvY2tzQnlTZWxlY3RvcltcInN0b3BTY3JpcHRzXCJdLnNwZWNpYWxDYXNlID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBDYXAgYmxvY2sgdW5sZXNzIGFyZ3VtZW50IGlzIFwib3RoZXIgc2NyaXB0cyBpbiBzcHJpdGVcIlxuICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICBpZiAoIWxhc3QuaXNJbnB1dCkgcmV0dXJuXG4gICAgdmFyIHZhbHVlID0gbGFzdC52YWx1ZVxuICAgIGlmIChsYW5nLm9zaXMuaW5kZXhPZih2YWx1ZSkgPiAtMSkge1xuICAgICAgcmV0dXJuIGV4dGVuZChibG9ja3NCeVNlbGVjdG9yW1wic3RvcFNjcmlwdHNcIl0sIHtcbiAgICAgICAgc2hhcGU6IFwic3RhY2tcIixcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9va3VwSGFzaChoYXNoLCBpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYW5ndWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsYW5nID0gbGFuZ3VhZ2VzW2ldXG4gICAgICBpZiAobGFuZy5ibG9ja3NCeUhhc2guaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgdmFyIGJsb2NrID0gbGFuZy5ibG9ja3NCeUhhc2hbaGFzaF1cbiAgICAgICAgaWYgKGluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiBibG9jay5zaGFwZSAhPT0gXCJyZXBvcnRlclwiKSBjb250aW51ZVxuICAgICAgICBpZiAoaW5mby5zaGFwZSA9PT0gXCJib29sZWFuXCIgJiYgYmxvY2suc2hhcGUgIT09IFwiYm9vbGVhblwiKSBjb250aW51ZVxuICAgICAgICBpZiAoYmxvY2suc3BlY2lhbENhc2UpIHtcbiAgICAgICAgICBibG9jayA9IGJsb2NrLnNwZWNpYWxDYXNlKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB8fCBibG9ja1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IGJsb2NrLCBsYW5nOiBsYW5nIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBEcm9wZG93bihuYW1lLCBsYW5ndWFnZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxhbmcgPSBsYW5ndWFnZXNbaV1cbiAgICAgIGlmIChsYW5nLm5hdGl2ZURyb3Bkb3ducy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICB2YXIgbmF0aXZlTmFtZSA9IGxhbmcubmF0aXZlRHJvcGRvd25zW25hbWVdXG4gICAgICAgIHJldHVybiBuYXRpdmVOYW1lXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlPdmVycmlkZXMoaW5mbywgb3ZlcnJpZGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdmVycmlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuYW1lID0gb3ZlcnJpZGVzW2ldXG4gICAgICBpZiAoaGV4Q29sb3JQYXQudGVzdChuYW1lKSkge1xuICAgICAgICBpbmZvLmNvbG9yID0gbmFtZVxuICAgICAgICBpbmZvLmNhdGVnb3J5ID0gXCJcIlxuICAgICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAob3ZlcnJpZGVDYXRlZ29yaWVzLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgICBpbmZvLmNhdGVnb3J5ID0gbmFtZVxuICAgICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAob3ZlcnJpZGVTaGFwZXMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIGluZm8uc2hhcGUgPSBuYW1lXG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwibG9vcFwiKSB7XG4gICAgICAgIGluZm8uaGFzTG9vcEFycm93ID0gdHJ1ZVxuICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcIitcIiB8fCBuYW1lID09PSBcIi1cIikge1xuICAgICAgICBpbmZvLmRpZmYgPSBuYW1lXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYmxvY2tOYW1lKGJsb2NrKSB7XG4gICAgdmFyIHdvcmRzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJsb2NrLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBibG9jay5jaGlsZHJlbltpXVxuICAgICAgaWYgKCFjaGlsZC5pc0xhYmVsKSByZXR1cm5cbiAgICAgIHdvcmRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB3b3Jkcy5qb2luKFwiIFwiKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsb2FkTGFuZ3VhZ2VzLFxuXG4gICAgYmxvY2tOYW1lLFxuXG4gICAgYWxsTGFuZ3VhZ2VzLFxuICAgIGxvb2t1cERyb3Bkb3duLFxuICAgIGhleENvbG9yUGF0LFxuICAgIG1pbmlmeUhhc2gsXG4gICAgbG9va3VwSGFzaCxcbiAgICBhcHBseU92ZXJyaWRlcyxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgaWNvblBhdCxcbiAgICBoYXNoU3BlYyxcblxuICAgIGJsb2Nrc0J5U2VsZWN0b3IsXG4gICAgcGFyc2VTcGVjLFxuICAgIGlucHV0UGF0LFxuICAgIHVuaWNvZGVJY29ucyxcbiAgICBlbmdsaXNoLFxuICB9XG59KSgpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgW1wibW92ZSAlbiBzdGVwc1wiLCBcIiBcIiwgMSwgXCJmb3J3YXJkOlwiXSxcbiAgW1widHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIiwgXCIgXCIsIDEsIFwidHVyblJpZ2h0OlwiXSxcbiAgW1widHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLCBcIiBcIiwgMSwgXCJ0dXJuTGVmdDpcIl0sXG4gIFtcInBvaW50IGluIGRpcmVjdGlvbiAlZC5kaXJlY3Rpb25cIiwgXCIgXCIsIDEsIFwiaGVhZGluZzpcIl0sXG4gIFtcInBvaW50IHRvd2FyZHMgJW0uc3ByaXRlT3JNb3VzZVwiLCBcIiBcIiwgMSwgXCJwb2ludFRvd2FyZHM6XCJdLFxuICBbXCJnbyB0byB4OiVuIHk6JW5cIiwgXCIgXCIsIDEsIFwiZ290b1g6eTpcIl0sXG4gIFtcImdvIHRvICVtLmxvY2F0aW9uXCIsIFwiIFwiLCAxLCBcImdvdG9TcHJpdGVPck1vdXNlOlwiXSxcbiAgW1wiZ2xpZGUgJW4gc2VjcyB0byB4OiVuIHk6JW5cIiwgXCIgXCIsIDEsIFwiZ2xpZGVTZWNzOnRvWDp5OmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcImNoYW5nZSB4IGJ5ICVuXCIsIFwiIFwiLCAxLCBcImNoYW5nZVhwb3NCeTpcIl0sXG4gIFtcInNldCB4IHRvICVuXCIsIFwiIFwiLCAxLCBcInhwb3M6XCJdLFxuICBbXCJjaGFuZ2UgeSBieSAlblwiLCBcIiBcIiwgMSwgXCJjaGFuZ2VZcG9zQnk6XCJdLFxuICBbXCJzZXQgeSB0byAlblwiLCBcIiBcIiwgMSwgXCJ5cG9zOlwiXSxcbiAgW1wic2V0IHJvdGF0aW9uIHN0eWxlICVtLnJvdGF0aW9uU3R5bGVcIiwgXCIgXCIsIDEsIFwic2V0Um90YXRpb25TdHlsZVwiXSxcbiAgW1wic2F5ICVzIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyLCBcInNheTpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJzYXkgJXNcIiwgXCIgXCIsIDIsIFwic2F5OlwiXSxcbiAgW1widGhpbmsgJXMgZm9yICVuIHNlY3NcIiwgXCIgXCIsIDIsIFwidGhpbms6ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1widGhpbmsgJXNcIiwgXCIgXCIsIDIsIFwidGhpbms6XCJdLFxuICBbXCJzaG93XCIsIFwiIFwiLCAyLCBcInNob3dcIl0sXG4gIFtcImhpZGVcIiwgXCIgXCIsIDIsIFwiaGlkZVwiXSxcbiAgW1wic3dpdGNoIGNvc3R1bWUgdG8gJW0uY29zdHVtZVwiLCBcIiBcIiwgMiwgXCJsb29rTGlrZTpcIl0sXG4gIFtcIm5leHQgY29zdHVtZVwiLCBcIiBcIiwgMiwgXCJuZXh0Q29zdHVtZVwiXSxcbiAgW1wibmV4dCBiYWNrZHJvcFwiLCBcIiBcIiwgMTAyLCBcIm5leHRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIGJhY2tkcm9wIHRvICVtLmJhY2tkcm9wXCIsIFwiIFwiLCAyLCBcInN0YXJ0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCBiYWNrZHJvcCB0byAlbS5iYWNrZHJvcCBhbmQgd2FpdFwiLCBcIiBcIiwgMTAyLCBcInN0YXJ0U2NlbmVBbmRXYWl0XCJdLFxuICBbXCJjaGFuZ2UgJW0uZWZmZWN0IGVmZmVjdCBieSAlblwiLCBcIiBcIiwgMiwgXCJjaGFuZ2VHcmFwaGljRWZmZWN0OmJ5OlwiXSxcbiAgW1wic2V0ICVtLmVmZmVjdCBlZmZlY3QgdG8gJW5cIiwgXCIgXCIsIDIsIFwic2V0R3JhcGhpY0VmZmVjdDp0bzpcIl0sXG4gIFtcImNsZWFyIGdyYXBoaWMgZWZmZWN0c1wiLCBcIiBcIiwgMiwgXCJmaWx0ZXJSZXNldFwiXSxcbiAgW1wiY2hhbmdlIHNpemUgYnkgJW5cIiwgXCIgXCIsIDIsIFwiY2hhbmdlU2l6ZUJ5OlwiXSxcbiAgW1wic2V0IHNpemUgdG8gJW4lXCIsIFwiIFwiLCAyLCBcInNldFNpemVUbzpcIl0sXG4gIFtcImdvIHRvIGZyb250XCIsIFwiIFwiLCAyLCBcImNvbWVUb0Zyb250XCJdLFxuICBbXCJnbyBiYWNrICVuIGxheWVyc1wiLCBcIiBcIiwgMiwgXCJnb0JhY2tCeUxheWVyczpcIl0sXG4gIFtcInBsYXkgc291bmQgJW0uc291bmRcIiwgXCIgXCIsIDMsIFwicGxheVNvdW5kOlwiXSxcbiAgW1wicGxheSBzb3VuZCAlbS5zb3VuZCB1bnRpbCBkb25lXCIsIFwiIFwiLCAzLCBcImRvUGxheVNvdW5kQW5kV2FpdFwiXSxcbiAgW1wic3RvcCBhbGwgc291bmRzXCIsIFwiIFwiLCAzLCBcInN0b3BBbGxTb3VuZHNcIl0sXG4gIFtcInBsYXkgZHJ1bSAlZC5kcnVtIGZvciAlbiBiZWF0c1wiLCBcIiBcIiwgMywgXCJwbGF5RHJ1bVwiXSxcbiAgW1wicmVzdCBmb3IgJW4gYmVhdHNcIiwgXCIgXCIsIDMsIFwicmVzdDplbGFwc2VkOmZyb206XCJdLFxuICBbXCJwbGF5IG5vdGUgJWQubm90ZSBmb3IgJW4gYmVhdHNcIiwgXCIgXCIsIDMsIFwibm90ZU9uOmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInNldCBpbnN0cnVtZW50IHRvICVkLmluc3RydW1lbnRcIiwgXCIgXCIsIDMsIFwiaW5zdHJ1bWVudDpcIl0sXG4gIFtcImNoYW5nZSB2b2x1bWUgYnkgJW5cIiwgXCIgXCIsIDMsIFwiY2hhbmdlVm9sdW1lQnk6XCJdLFxuICBbXCJzZXQgdm9sdW1lIHRvICVuJVwiLCBcIiBcIiwgMywgXCJzZXRWb2x1bWVUbzpcIl0sXG4gIFtcImNoYW5nZSB0ZW1wbyBieSAlblwiLCBcIiBcIiwgMywgXCJjaGFuZ2VUZW1wb0J5OlwiXSxcbiAgW1wic2V0IHRlbXBvIHRvICVuIGJwbVwiLCBcIiBcIiwgMywgXCJzZXRUZW1wb1RvOlwiXSxcbiAgW1wiY2xlYXJcIiwgXCIgXCIsIDQsIFwiY2xlYXJQZW5UcmFpbHNcIl0sXG4gIFtcInN0YW1wXCIsIFwiIFwiLCA0LCBcInN0YW1wQ29zdHVtZVwiXSxcbiAgW1wicGVuIGRvd25cIiwgXCIgXCIsIDQsIFwicHV0UGVuRG93blwiXSxcbiAgW1wicGVuIHVwXCIsIFwiIFwiLCA0LCBcInB1dFBlblVwXCJdLFxuICBbXCJzZXQgcGVuIGNvbG9yIHRvICVjXCIsIFwiIFwiLCA0LCBcInBlbkNvbG9yOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBjb2xvciBieSAlblwiLCBcIiBcIiwgNCwgXCJjaGFuZ2VQZW5IdWVCeTpcIl0sXG4gIFtcInNldCBwZW4gY29sb3IgdG8gJW5cIiwgXCIgXCIsIDQsIFwic2V0UGVuSHVlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNoYWRlIGJ5ICVuXCIsIFwiIFwiLCA0LCBcImNoYW5nZVBlblNoYWRlQnk6XCJdLFxuICBbXCJzZXQgcGVuIHNoYWRlIHRvICVuXCIsIFwiIFwiLCA0LCBcInNldFBlblNoYWRlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNpemUgYnkgJW5cIiwgXCIgXCIsIDQsIFwiY2hhbmdlUGVuU2l6ZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaXplIHRvICVuXCIsIFwiIFwiLCA0LCBcInBlblNpemU6XCJdLFxuICBbXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLCBcImhcIiwgNSwgXCJ3aGVuR3JlZW5GbGFnXCJdLFxuICBbXCJ3aGVuICVtLmtleSBrZXkgcHJlc3NlZFwiLCBcImhcIiwgNSwgXCJ3aGVuS2V5UHJlc3NlZFwiXSxcbiAgW1wid2hlbiB0aGlzIHNwcml0ZSBjbGlja2VkXCIsIFwiaFwiLCA1LCBcIndoZW5DbGlja2VkXCJdLFxuICBbXCJ3aGVuIGJhY2tkcm9wIHN3aXRjaGVzIHRvICVtLmJhY2tkcm9wXCIsIFwiaFwiLCA1LCBcIndoZW5TY2VuZVN0YXJ0c1wiXSxcbiAgW1wid2hlbiAlbS50cmlnZ2VyU2Vuc29yID4gJW5cIiwgXCJoXCIsIDUsIFwid2hlblNlbnNvckdyZWF0ZXJUaGFuXCJdLFxuICBbXCJ3aGVuIEkgcmVjZWl2ZSAlbS5icm9hZGNhc3RcIiwgXCJoXCIsIDUsIFwid2hlbklSZWNlaXZlXCJdLFxuICBbXCJicm9hZGNhc3QgJW0uYnJvYWRjYXN0XCIsIFwiIFwiLCA1LCBcImJyb2FkY2FzdDpcIl0sXG4gIFtcImJyb2FkY2FzdCAlbS5icm9hZGNhc3QgYW5kIHdhaXRcIiwgXCIgXCIsIDUsIFwiZG9Ccm9hZGNhc3RBbmRXYWl0XCJdLFxuICBbXCJ3YWl0ICVuIHNlY3NcIiwgXCIgXCIsIDYsIFwid2FpdDplbGFwc2VkOmZyb206XCJdLFxuICBbXCJyZXBlYXQgJW5cIiwgXCJjXCIsIDYsIFwiZG9SZXBlYXRcIl0sXG4gIFtcImZvcmV2ZXJcIiwgXCJjZlwiLCA2LCBcImRvRm9yZXZlclwiXSxcbiAgW1wiaWYgJWIgdGhlblwiLCBcImNcIiwgNiwgXCJkb0lmXCJdLFxuICBbXCJpZiAlYiB0aGVuXCIsIFwiZVwiLCA2LCBcImRvSWZFbHNlXCJdLFxuICBbXCJ3YWl0IHVudGlsICViXCIsIFwiIFwiLCA2LCBcImRvV2FpdFVudGlsXCJdLFxuICBbXCJyZXBlYXQgdW50aWwgJWJcIiwgXCJjXCIsIDYsIFwiZG9VbnRpbFwiXSxcbiAgW1wic3RvcCAlbS5zdG9wXCIsIFwiZlwiLCA2LCBcInN0b3BTY3JpcHRzXCJdLFxuICBbXCJ3aGVuIEkgc3RhcnQgYXMgYSBjbG9uZVwiLCBcImhcIiwgNiwgXCJ3aGVuQ2xvbmVkXCJdLFxuICBbXCJjcmVhdGUgY2xvbmUgb2YgJW0uc3ByaXRlT25seVwiLCBcIiBcIiwgNiwgXCJjcmVhdGVDbG9uZU9mXCJdLFxuICBbXCJkZWxldGUgdGhpcyBjbG9uZVwiLCBcImZcIiwgNiwgXCJkZWxldGVDbG9uZVwiXSxcbiAgW1wiYXNrICVzIGFuZCB3YWl0XCIsIFwiIFwiLCA3LCBcImRvQXNrXCJdLFxuICBbXCJ0dXJuIHZpZGVvICVtLnZpZGVvU3RhdGVcIiwgXCIgXCIsIDcsIFwic2V0VmlkZW9TdGF0ZVwiXSxcbiAgW1wic2V0IHZpZGVvIHRyYW5zcGFyZW5jeSB0byAlbiVcIiwgXCIgXCIsIDcsIFwic2V0VmlkZW9UcmFuc3BhcmVuY3lcIl0sXG4gIFtcInJlc2V0IHRpbWVyXCIsIFwiIFwiLCA3LCBcInRpbWVyUmVzZXRcIl0sXG4gIFtcInNldCAlbS52YXIgdG8gJXNcIiwgXCIgXCIsIDksIFwic2V0VmFyOnRvOlwiXSxcbiAgW1wiY2hhbmdlICVtLnZhciBieSAlblwiLCBcIiBcIiwgOSwgXCJjaGFuZ2VWYXI6Ynk6XCJdLFxuICBbXCJzaG93IHZhcmlhYmxlICVtLnZhclwiLCBcIiBcIiwgOSwgXCJzaG93VmFyaWFibGU6XCJdLFxuICBbXCJoaWRlIHZhcmlhYmxlICVtLnZhclwiLCBcIiBcIiwgOSwgXCJoaWRlVmFyaWFibGU6XCJdLFxuICBbXCJhZGQgJXMgdG8gJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiYXBwZW5kOnRvTGlzdDpcIl0sXG4gIFtcImRlbGV0ZSAlZC5saXN0RGVsZXRlSXRlbSBvZiAlbS5saXN0XCIsIFwiIFwiLCAxMiwgXCJkZWxldGVMaW5lOm9mTGlzdDpcIl0sXG4gIFtcImlmIG9uIGVkZ2UsIGJvdW5jZVwiLCBcIiBcIiwgMSwgXCJib3VuY2VPZmZFZGdlXCJdLFxuICBbXCJpbnNlcnQgJXMgYXQgJWQubGlzdEl0ZW0gb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiaW5zZXJ0OmF0Om9mTGlzdDpcIl0sXG4gIFtcbiAgICBcInJlcGxhY2UgaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0IHdpdGggJXNcIixcbiAgICBcIiBcIixcbiAgICAxMixcbiAgICBcInNldExpbmU6b2ZMaXN0OnRvOlwiLFxuICBdLFxuICBbXCJzaG93IGxpc3QgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwic2hvd0xpc3Q6XCJdLFxuICBbXCJoaWRlIGxpc3QgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiaGlkZUxpc3Q6XCJdLFxuXG4gIFtcInggcG9zaXRpb25cIiwgXCJyXCIsIDEsIFwieHBvc1wiXSxcbiAgW1wieSBwb3NpdGlvblwiLCBcInJcIiwgMSwgXCJ5cG9zXCJdLFxuICBbXCJkaXJlY3Rpb25cIiwgXCJyXCIsIDEsIFwiaGVhZGluZ1wiXSxcbiAgW1wiY29zdHVtZSAjXCIsIFwiclwiLCAyLCBcImNvc3R1bWVJbmRleFwiXSxcbiAgW1wic2l6ZVwiLCBcInJcIiwgMiwgXCJzY2FsZVwiXSxcbiAgW1wiYmFja2Ryb3AgbmFtZVwiLCBcInJcIiwgMTAyLCBcInNjZW5lTmFtZVwiXSxcbiAgW1wiYmFja2Ryb3AgI1wiLCBcInJcIiwgMTAyLCBcImJhY2tncm91bmRJbmRleFwiXSxcbiAgW1widm9sdW1lXCIsIFwiclwiLCAzLCBcInZvbHVtZVwiXSxcbiAgW1widGVtcG9cIiwgXCJyXCIsIDMsIFwidGVtcG9cIl0sXG4gIFtcInRvdWNoaW5nICVtLnRvdWNoaW5nP1wiLCBcImJcIiwgNywgXCJ0b3VjaGluZzpcIl0sXG4gIFtcInRvdWNoaW5nIGNvbG9yICVjP1wiLCBcImJcIiwgNywgXCJ0b3VjaGluZ0NvbG9yOlwiXSxcbiAgW1wiY29sb3IgJWMgaXMgdG91Y2hpbmcgJWM/XCIsIFwiYlwiLCA3LCBcImNvbG9yOnNlZXM6XCJdLFxuICBbXCJkaXN0YW5jZSB0byAlbS5zcHJpdGVPck1vdXNlXCIsIFwiclwiLCA3LCBcImRpc3RhbmNlVG86XCJdLFxuICBbXCJhbnN3ZXJcIiwgXCJyXCIsIDcsIFwiYW5zd2VyXCJdLFxuICBbXCJrZXkgJW0ua2V5IHByZXNzZWQ/XCIsIFwiYlwiLCA3LCBcImtleVByZXNzZWQ6XCJdLFxuICBbXCJtb3VzZSBkb3duP1wiLCBcImJcIiwgNywgXCJtb3VzZVByZXNzZWRcIl0sXG4gIFtcIm1vdXNlIHhcIiwgXCJyXCIsIDcsIFwibW91c2VYXCJdLFxuICBbXCJtb3VzZSB5XCIsIFwiclwiLCA3LCBcIm1vdXNlWVwiXSxcbiAgW1wibG91ZG5lc3NcIiwgXCJyXCIsIDcsIFwic291bmRMZXZlbFwiXSxcbiAgW1widmlkZW8gJW0udmlkZW9Nb3Rpb25UeXBlIG9uICVtLnN0YWdlT3JUaGlzXCIsIFwiclwiLCA3LCBcInNlbnNlVmlkZW9Nb3Rpb25cIl0sXG4gIFtcInRpbWVyXCIsIFwiclwiLCA3LCBcInRpbWVyXCJdLFxuICBbXCIlbS5hdHRyaWJ1dGUgb2YgJW0uc3ByaXRlT3JTdGFnZVwiLCBcInJcIiwgNywgXCJnZXRBdHRyaWJ1dGU6b2Y6XCJdLFxuICBbXCJjdXJyZW50ICVtLnRpbWVBbmREYXRlXCIsIFwiclwiLCA3LCBcInRpbWVBbmREYXRlXCJdLFxuICBbXCJkYXlzIHNpbmNlIDIwMDBcIiwgXCJyXCIsIDcsIFwidGltZXN0YW1wXCJdLFxuICBbXCJ1c2VybmFtZVwiLCBcInJcIiwgNywgXCJnZXRVc2VyTmFtZVwiXSxcbiAgW1wiJW4gKyAlblwiLCBcInJcIiwgOCwgXCIrXCJdLFxuICBbXCIlbiAtICVuXCIsIFwiclwiLCA4LCBcIi1cIl0sXG4gIFtcIiVuICogJW5cIiwgXCJyXCIsIDgsIFwiKlwiXSxcbiAgW1wiJW4gLyAlblwiLCBcInJcIiwgOCwgXCIvXCJdLFxuICBbXCJwaWNrIHJhbmRvbSAlbiB0byAlblwiLCBcInJcIiwgOCwgXCJyYW5kb21Gcm9tOnRvOlwiXSxcbiAgW1wiJXMgPCAlc1wiLCBcImJcIiwgOCwgXCI8XCJdLFxuICBbXCIlcyA9ICVzXCIsIFwiYlwiLCA4LCBcIj1cIl0sXG4gIFtcIiVzID4gJXNcIiwgXCJiXCIsIDgsIFwiPlwiXSxcbiAgW1wiJWIgYW5kICViXCIsIFwiYlwiLCA4LCBcIiZcIl0sXG4gIFtcIiViIG9yICViXCIsIFwiYlwiLCA4LCBcInxcIl0sXG4gIFtcIm5vdCAlYlwiLCBcImJcIiwgOCwgXCJub3RcIl0sXG4gIFtcImpvaW4gJXMgJXNcIiwgXCJyXCIsIDgsIFwiY29uY2F0ZW5hdGU6d2l0aDpcIl0sXG4gIFtcImxldHRlciAlbiBvZiAlc1wiLCBcInJcIiwgOCwgXCJsZXR0ZXI6b2Y6XCJdLFxuICBbXCJsZW5ndGggb2YgJXNcIiwgXCJyXCIsIDgsIFwic3RyaW5nTGVuZ3RoOlwiXSxcbiAgW1wiJW4gbW9kICVuXCIsIFwiclwiLCA4LCBcIiVcIl0sXG4gIFtcInJvdW5kICVuXCIsIFwiclwiLCA4LCBcInJvdW5kZWRcIl0sXG4gIFtcIiVtLm1hdGhPcCBvZiAlblwiLCBcInJcIiwgOCwgXCJjb21wdXRlRnVuY3Rpb246b2Y6XCJdLFxuICBbXCJpdGVtICVkLmxpc3RJdGVtIG9mICVtLmxpc3RcIiwgXCJyXCIsIDEyLCBcImdldExpbmU6b2ZMaXN0OlwiXSxcbiAgW1wibGVuZ3RoIG9mICVtLmxpc3RcIiwgXCJyXCIsIDEyLCBcImxpbmVDb3VudE9mTGlzdDpcIl0sXG4gIFtcIiVtLmxpc3QgY29udGFpbnMgJXM/XCIsIFwiYlwiLCAxMiwgXCJsaXN0OmNvbnRhaW5zOlwiXSxcblxuICBbXCJ3aGVuICVtLmJvb2xlYW5TZW5zb3JcIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiAlbS5zZW5zb3IgJW0ubGVzc01vcmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wic2Vuc29yICVtLmJvb2xlYW5TZW5zb3I/XCIsIFwiYlwiLCAyMCwgXCJcIl0sXG4gIFtcIiVtLnNlbnNvciBzZW5zb3IgdmFsdWVcIiwgXCJyXCIsIDIwLCBcIlwiXSxcblxuICBbXCJ0dXJuICVtLm1vdG9yIG9uIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInR1cm4gJW0ubW90b3Igb25cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1widHVybiAlbS5tb3RvciBvZmZcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wic2V0ICVtLm1vdG9yIHBvd2VyIHRvICVuXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInNldCAlbS5tb3RvcjIgZGlyZWN0aW9uIHRvICVtLm1vdG9yRGlyZWN0aW9uXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gZGlzdGFuY2UgJW0ubGVzc01vcmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wid2hlbiB0aWx0ICVtLmVOZSAlblwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJkaXN0YW5jZVwiLCBcInJcIiwgMjAsIFwiXCJdLFxuICBbXCJ0aWx0XCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1widHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjb25kc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJzZXQgbGlnaHQgY29sb3IgdG8gJW5cIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wicGxheSBub3RlICVuIGZvciAlbiBzZWNvbmRzXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gdGlsdGVkXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcInRpbHQgJW0ueHh4XCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1wiZWxzZVwiLCBcImVsc2VcIiwgNiwgXCJcIl0sXG4gIFtcImVuZFwiLCBcImVuZFwiLCA2LCBcIlwiXSxcbiAgW1wiLiAuIC5cIiwgXCIgXCIsIDQyLCBcIlwiXSxcblxuICBbXCIlbiBAYWRkSW5wdXRcIiwgXCJyaW5nXCIsIDQyLCBcIlwiXSxcblxuICBbXCJ1c2VyIGlkXCIsIFwiclwiLCAwLCBcIlwiXSxcblxuICBbXCJpZiAlYlwiLCBcImNcIiwgMCwgXCJkb0lmXCJdLFxuICBbXCJpZiAlYlwiLCBcImVcIiwgMCwgXCJkb0lmRWxzZVwiXSxcbiAgW1wiZm9yZXZlciBpZiAlYlwiLCBcImNmXCIsIDAsIFwiZG9Gb3JldmVySWZcIl0sXG4gIFtcInN0b3Agc2NyaXB0XCIsIFwiZlwiLCAwLCBcImRvUmV0dXJuXCJdLFxuICBbXCJzdG9wIGFsbFwiLCBcImZcIiwgMCwgXCJzdG9wQWxsXCJdLFxuICBbXCJzd2l0Y2ggdG8gY29zdHVtZSAlbS5jb3N0dW1lXCIsIFwiIFwiLCAwLCBcImxvb2tMaWtlOlwiXSxcbiAgW1wibmV4dCBiYWNrZ3JvdW5kXCIsIFwiIFwiLCAwLCBcIm5leHRTY2VuZVwiXSxcbiAgW1wic3dpdGNoIHRvIGJhY2tncm91bmQgJW0uYmFja2Ryb3BcIiwgXCIgXCIsIDAsIFwic3RhcnRTY2VuZVwiXSxcbiAgW1wiYmFja2dyb3VuZCAjXCIsIFwiclwiLCAwLCBcImJhY2tncm91bmRJbmRleFwiXSxcbiAgW1wibG91ZD9cIiwgXCJiXCIsIDAsIFwiaXNMb3VkXCJdLFxuXVxuIiwiLyogZm9yIGNvbnN0dWN0aW5nIFNWR3MgKi9cblxuZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxufVxuZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIilcbn1cblxuLy8gc2V0IGJ5IFNWRy5pbml0XG52YXIgZG9jdW1lbnRcbnZhciB4bWxcblxudmFyIGRpcmVjdFByb3BzID0ge1xuICB0ZXh0Q29udGVudDogdHJ1ZSxcbn1cblxudmFyIFNWRyA9IChtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdCh3aW5kb3csIG1ha2VDYW52YXMpIHtcbiAgICBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuICAgIHZhciBET01QYXJzZXIgPSB3aW5kb3cuRE9NUGFyc2VyXG4gICAgeG1sID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhcIjx4bWw+PC94bWw+XCIsIFwiYXBwbGljYXRpb24veG1sXCIpXG4gICAgU1ZHLlhNTFNlcmlhbGl6ZXIgPSB3aW5kb3cuWE1MU2VyaWFsaXplclxuXG4gICAgU1ZHLm1ha2VDYW52YXMgPSBtYWtlQ2FudmFzXG4gIH0sXG5cbiAgY2RhdGEoY29udGVudCkge1xuICAgIHJldHVybiB4bWwuY3JlYXRlQ0RBVEFTZWN0aW9uKGNvbnRlbnQpXG4gIH0sXG5cbiAgZWwobmFtZSwgcHJvcHMpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lKVxuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoZWwsIHByb3BzKVxuICB9LFxuXG4gIHNldFByb3BzKGVsLCBwcm9wcykge1xuICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgdmFyIHZhbHVlID0gXCJcIiArIHByb3BzW2tleV1cbiAgICAgIGlmIChkaXJlY3RQcm9wc1trZXldKSB7XG4gICAgICAgIGVsW2tleV0gPSB2YWx1ZVxuICAgICAgfSBlbHNlIGlmICgvXnhsaW5rOi8udGVzdChrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBrZXkuc2xpY2UoNiksIHZhbHVlKVxuICAgICAgfSBlbHNlIGlmIChwcm9wc1trZXldICE9PSBudWxsICYmIHByb3BzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMobnVsbCwga2V5LCB2YWx1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgd2l0aENoaWxkcmVuKGVsLCBjaGlsZHJlbikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkcmVuW2ldKVxuICAgIH1cbiAgICByZXR1cm4gZWxcbiAgfSxcblxuICBncm91cChjaGlsZHJlbikge1xuICAgIHJldHVybiBTVkcud2l0aENoaWxkcmVuKFNWRy5lbChcImdcIiksIGNoaWxkcmVuKVxuICB9LFxuXG4gIG5ld1NWRyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIFNWRy5lbChcInN2Z1wiLCB7XG4gICAgICB2ZXJzaW9uOiBcIjEuMVwiLFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgfSlcbiAgfSxcblxuICBwb2x5Z29uKHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicG9seWdvblwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBvaW50czogcHJvcHMucG9pbnRzLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcGF0aChwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInBhdGhcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBudWxsLFxuICAgICAgICBkOiBwcm9wcy5wYXRoLmpvaW4oXCIgXCIpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgdGV4dCh4LCB5LCBjb250ZW50LCBwcm9wcykge1xuICAgIHZhciB0ZXh0ID0gU1ZHLmVsKFxuICAgICAgXCJ0ZXh0XCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgeDogeCxcbiAgICAgICAgeTogeSxcbiAgICAgICAgdGV4dENvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICB9KVxuICAgIClcbiAgICByZXR1cm4gdGV4dFxuICB9LFxuXG4gIHN5bWJvbChocmVmKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcInVzZVwiLCB7XG4gICAgICBcInhsaW5rOmhyZWZcIjogaHJlZixcbiAgICB9KVxuICB9LFxuXG4gIG1vdmUoZHgsIGR5LCBlbCkge1xuICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgdHJhbnNmb3JtOiBbXCJ0cmFuc2xhdGUoXCIsIGR4LCBcIiBcIiwgZHksIFwiKVwiXS5qb2luKFwiXCIpLFxuICAgIH0pXG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgdHJhbnNsYXRlUGF0aChkeCwgZHksIHBhdGgpIHtcbiAgICB2YXIgaXNYID0gdHJ1ZVxuICAgIHZhciBwYXJ0cyA9IHBhdGguc3BsaXQoXCIgXCIpXG4gICAgdmFyIG91dCA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpXVxuICAgICAgaWYgKHBhcnQgPT09IFwiQVwiKSB7XG4gICAgICAgIHZhciBqID0gaSArIDVcbiAgICAgICAgb3V0LnB1c2goXCJBXCIpXG4gICAgICAgIHdoaWxlIChpIDwgaikge1xuICAgICAgICAgIG91dC5wdXNoKHBhcnRzWysraV0pXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH0gZWxzZSBpZiAoL1tBLVphLXpdLy50ZXN0KHBhcnQpKSB7XG4gICAgICAgIGFzc2VydChpc1gpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0ID0gK3BhcnRcbiAgICAgICAgcGFydCArPSBpc1ggPyBkeCA6IGR5XG4gICAgICAgIGlzWCA9ICFpc1hcbiAgICAgIH1cbiAgICAgIG91dC5wdXNoKHBhcnQpXG4gICAgfVxuICAgIHJldHVybiBvdXQuam9pbihcIiBcIilcbiAgfSxcblxuICAvKiBzaGFwZXMgKi9cblxuICByZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwicmVjdFwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHdpZHRoOiB3LFxuICAgICAgICBoZWlnaHQ6IGgsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBlbGxpcHNlKHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5lbChcbiAgICAgIFwiZWxsaXBzZVwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGN4OiB3IC8gMixcbiAgICAgICAgY3k6IGggLyAyLFxuICAgICAgICByeDogdyAvIDIsXG4gICAgICAgIHJ5OiBoIC8gMixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGFyYyhwMXgsIHAxeSwgcDJ4LCBwMnksIHJ4LCByeSkge1xuICAgIHZhciByID0gcDJ5IC0gcDF5XG4gICAgcmV0dXJuIFtcIkxcIiwgcDF4LCBwMXksIFwiQVwiLCByeCwgcnksIDAsIDAsIDEsIHAyeCwgcDJ5XS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIGFyY3cocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeVxuICAgIHJldHVybiBbXCJMXCIsIHAxeCwgcDF5LCBcIkFcIiwgcngsIHJ5LCAwLCAwLCAwLCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICByb3VuZGVkUGF0aCh3LCBoKSB7XG4gICAgdmFyIHIgPSBoIC8gMlxuICAgIHJldHVybiBbXG4gICAgICBcIk1cIixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgU1ZHLmFyYyh3IC0gciwgMCwgdyAtIHIsIGgsIHIsIHIpLFxuICAgICAgU1ZHLmFyYyhyLCBoLCByLCAwLCByLCByKSxcbiAgICAgIFwiWlwiLFxuICAgIF1cbiAgfSxcblxuICByb3VuZGVkUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBTVkcucm91bmRlZFBhdGgodywgaCksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBwb2ludGVkUGF0aCh3LCBoKSB7XG4gICAgdmFyIHIgPSBoIC8gMlxuICAgIHJldHVybiBbXG4gICAgICBcIk1cIixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gcixcbiAgICAgIDAsXG4gICAgICB3LFxuICAgICAgcixcbiAgICAgIFwiTFwiLFxuICAgICAgdyxcbiAgICAgIHIsXG4gICAgICB3IC0gcixcbiAgICAgIGgsXG4gICAgICBcIkxcIixcbiAgICAgIHIsXG4gICAgICBoLFxuICAgICAgMCxcbiAgICAgIHIsXG4gICAgICBcIkxcIixcbiAgICAgIDAsXG4gICAgICByLFxuICAgICAgcixcbiAgICAgIDAsXG4gICAgICBcIlpcIixcbiAgICBdXG4gIH0sXG5cbiAgcG9pbnRlZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLnBvaW50ZWRQYXRoKHcsIGgpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgZ2V0VG9wKHcpIHtcbiAgICByZXR1cm4gW1wiTVwiLCAwLCA0LFxuICAgICAgLy8gXCJMXCIsIDEsIDEsXG4gICAgICAvLyBcIkxcIiwgNCwgMCxcbiAgICAgIFwiUVwiLCBTVkcuY3VydmUoMCwgNCwgNCwgMCwgMCksXG4gICAgICBcIkxcIiwgNCwgMCxcbiAgICAgIFwiTFwiLCA4LCAwLFxuICAgICAgXCJMXCIsIDE0LCA1LFxuICAgICAgXCJMXCIsIDI0LCA1LFxuICAgICAgXCJMXCIsIDMwLCAwLFxuICAgICAgXCJMXCIsIDMyLCAwLFxuICAgICAgXCJMXCIsIHcgLSA0LCAwLFxuICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3IC0gNCwgMCwgdywgNCwgMCksXG4gICAgICBcIkxcIiwgdywgNFxuICAgIF0uam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRSaW5nVG9wKHcpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICAwLFxuICAgICAgMyxcbiAgICAgIFwiTFwiLFxuICAgICAgMyxcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIDcsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICAxMCxcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDE2LFxuICAgICAgMyxcbiAgICAgIFwiTFwiLFxuICAgICAgMTksXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gMyxcbiAgICAgIDAsXG4gICAgICBcIkxcIixcbiAgICAgIHcsXG4gICAgICAzLFxuICAgIF0uam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRSaWdodEFuZEJvdHRvbSh3LCB5LCBoYXNOb3RjaCwgaW5zZXQpIHtcbiAgICBpZiAodHlwZW9mIGluc2V0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnNldCA9IDBcbiAgICB9XG4gICAgLy92YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gMywgXCJMXCIsIHcgLSAzLCB5XVxuICAgIHZhciBhcnIgPSBbXCJMXCIsIHcsIHkgLSA0LCBcIlFcIiwgU1ZHLmN1cnZlKHcsIHkgLSA0LCB3IC0gNCwgeSwgMCldXG4gICAgaWYgKGhhc05vdGNoKSB7XG4gICAgICBhcnIgPSBhcnIuY29uY2F0KFtcbiAgICAgICAgXCJMXCIsXG4gICAgICAgIGluc2V0ICsgMzAsXG4gICAgICAgIHksXG4gICAgICAgIFwiTFwiLFxuICAgICAgICBpbnNldCArIDI0LFxuICAgICAgICB5ICsgNSxcbiAgICAgICAgXCJMXCIsXG4gICAgICAgIGluc2V0ICsgMTQsXG4gICAgICAgIHkgKyA1LFxuICAgICAgICBcIkxcIixcbiAgICAgICAgaW5zZXQgKyA4LFxuICAgICAgICB5LFxuICAgICAgXSlcbiAgICB9XG4gICAgaWYgKGluc2V0ID4gMCkge1xuICAgICAgYXJyID0gYXJyLmNvbmNhdChbXCJMXCIsIGluc2V0ICsgMiwgeSwgXCJMXCIsIGluc2V0LCB5ICsgMl0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGFyciA9IGFyci5jb25jYXQoW1wiTFwiLCBpbnNldCArIDMsIHksIFwiTFwiLCAwLCB5IC0gM10pXG4gICAgfVxuICAgIHJldHVybiBhcnIuam9pbihcIiBcIilcbiAgfSxcblxuICBnZXRBcm0odywgYXJtVG9wKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiTFwiLFxuICAgICAgMTUsXG4gICAgICBhcm1Ub3AgLSAyLFxuICAgICAgXCJMXCIsXG4gICAgICAxNSArIDIsXG4gICAgICBhcm1Ub3AsXG4gICAgICBcIkxcIixcbiAgICAgIHcgLSAzLFxuICAgICAgYXJtVG9wLFxuICAgICAgXCJMXCIsXG4gICAgICB3LFxuICAgICAgYXJtVG9wICsgMyxcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgc3RhY2tSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSwgMCksIFwiWlwiXSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbU1ZHLmdldFRvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIGZhbHNlLCAwKSwgXCJaXCJdXG4gIH0sXG5cbiAgcmluZ0NhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbU1ZHLmdldFJpbmdUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCBmYWxzZSwgMCksIFwiWlwiXVxuICB9LFxuXG4gIGNhcFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLmNhcFBhdGgodywgaCksXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBoYXRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIiwgMCwgMTIsXG4gICAgICAgIFNWRy5hcmMoMCwgMTAsIDYwLCAxMCwgNjAsIDgwKSxcbiAgICAgICAgXCJMXCIsIHctNCwgMTAsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUodyAtIDQsIDEwLCB3LCAxMCArIDQsIDApLFxuICAgICAgICBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSksXG4gICAgICAgIFwiWlwiLFxuICAgICAgXSxcbiAgICB9KSk7XG4gIH0sXG5cbiAgY3VydmUocDF4LCBwMXksIHAyeCwgcDJ5LCByb3VuZG5lc3MpIHtcbiAgICB2YXIgcm91bmRuZXNzID0gcm91bmRuZXNzIHx8IDAuNDJcbiAgICB2YXIgbWlkWCA9IChwMXggKyBwMngpIC8gMi4wXG4gICAgdmFyIG1pZFkgPSAocDF5ICsgcDJ5KSAvIDIuMFxuICAgIHZhciBjeCA9IE1hdGgucm91bmQobWlkWCArIHJvdW5kbmVzcyAqIChwMnkgLSBwMXkpKVxuICAgIHZhciBjeSA9IE1hdGgucm91bmQobWlkWSAtIHJvdW5kbmVzcyAqIChwMnggLSBwMXgpKVxuICAgIHJldHVybiBbY3gsIGN5LCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICBwcm9jSGF0QmFzZSh3LCBoLCBhcmNoUm91bmRuZXNzLCBwcm9wcykge1xuICAgIC8vIFRPRE8gdXNlIGFyYygpXG4gICAgLy8gdmFyIGFyY2hSb3VuZG5lc3MgPSBNYXRoLm1pbigwLjIsIDM1IC8gdyk7IC8vdXNlZCBpbiBzY3JhdGNoYmxvY2tzMlxuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsIDAsIGgtMyxcbiAgICAgICAgXCJMXCIsIDAsIDEwLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKDAsIDEwLCAxNSwgLTUsIDApLFxuICAgICAgICBcIkxcIiwgdy0xNSwgLTUsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUody0xNSwgLTUsIHcsIDEwLCAwKSxcbiAgICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUpLFxuICAgICAgXSxcbiAgICB9KSk7XG4gIH0sXG5cbiAgcHJvY0hhdENhcCh3LCBoLCBhcmNoUm91bmRuZXNzKSB7XG4gICAgLy8gVE9ETyB1c2UgYXJjKClcbiAgICAvLyBUT0RPIHRoaXMgZG9lc24ndCBsb29rIHF1aXRlIHJpZ2h0XG4gICAgcmV0dXJuIFNWRy5wYXRoKHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsXG4gICAgICAgIC0xLFxuICAgICAgICAxMyxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSgtMSwgMTMsIHcgKyAxLCAxMywgYXJjaFJvdW5kbmVzcyksXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUodyArIDEsIDEzLCB3LCAxNiwgMC42KSxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSh3LCAxNiwgMCwgMTYsIC1hcmNoUm91bmRuZXNzKSxcbiAgICAgICAgXCJRXCIsXG4gICAgICAgIFNWRy5jdXJ2ZSgwLCAxNiwgLTEsIDEzLCAwLjYpLFxuICAgICAgICBcIlpcIixcbiAgICAgIF0sXG4gICAgICBjbGFzczogXCJzYi1kZWZpbmUtaGF0LWNhcFwiLFxuICAgIH0pXG4gIH0sXG5cbiAgcHJvY0hhdFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICB2YXIgcSA9IDUyXG4gICAgdmFyIHkgPSBoIC0gcVxuXG4gICAgdmFyIGFyY2hSb3VuZG5lc3MgPSBNYXRoLm1pbigwLjIsIDM1IC8gdylcblxuICAgIHJldHVybiBTVkcubW92ZShcbiAgICAgIDAsXG4gICAgICB5LFxuICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgU1ZHLnByb2NIYXRCYXNlKHcsIHEsIGFyY2hSb3VuZG5lc3MsIHByb3BzKSxcbiAgICAgICAgLy9TVkcucHJvY0hhdENhcCh3LCBxLCBhcmNoUm91bmRuZXNzKSxcbiAgICAgIF0pXG4gICAgKVxuICB9LFxuXG4gIG1vdXRoUmVjdCh3LCBoLCBpc0ZpbmFsLCBsaW5lcywgcHJvcHMpIHtcbiAgICB2YXIgeSA9IGxpbmVzWzBdLmhlaWdodFxuICAgIHZhciBwID0gW1NWRy5nZXRUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCB5LCB0cnVlLCAxNSldXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsaW5lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIGlzTGFzdCA9IGkgKyAyID09PSBsaW5lcy5sZW5ndGhcblxuICAgICAgeSArPSBsaW5lc1tpXS5oZWlnaHQgLSAzXG4gICAgICBwLnB1c2goU1ZHLmdldEFybSh3LCB5KSlcblxuICAgICAgdmFyIGhhc05vdGNoID0gIShpc0xhc3QgJiYgaXNGaW5hbClcbiAgICAgIHZhciBpbnNldCA9IGlzTGFzdCA/IDAgOiAxNVxuICAgICAgeSArPSBsaW5lc1tpICsgMV0uaGVpZ2h0ICsgM1xuICAgICAgcC5wdXNoKFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCB5LCBoYXNOb3RjaCwgaW5zZXQpKVxuICAgIH1cbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogcCxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHJpbmdSZWN0KHcsIGgsIGN5LCBjdywgY2gsIHNoYXBlLCBwcm9wcykge1xuICAgIHZhciByID0gOFxuICAgIHZhciBmdW5jID1cbiAgICAgIHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgPyBTVkcucm91bmRlZFBhdGhcbiAgICAgICAgOiBzaGFwZSA9PT0gXCJib29sZWFuXCJcbiAgICAgICAgICA/IFNWRy5wb2ludGVkUGF0aFxuICAgICAgICAgIDogY3cgPCA0MCA/IFNWRy5yaW5nQ2FwUGF0aCA6IFNWRy5jYXBQYXRoXG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFtcbiAgICAgICAgICBcIk1cIixcbiAgICAgICAgICByLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgU1ZHLmFyY3cociwgMCwgMCwgciwgciwgciksXG4gICAgICAgICAgU1ZHLmFyY3coMCwgaCAtIHIsIHIsIGgsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmN3KHcgLSByLCBoLCB3LCBoIC0gciwgciwgciksXG4gICAgICAgICAgU1ZHLmFyY3codywgciwgdyAtIHIsIDAsIHIsIHIpLFxuICAgICAgICAgIFwiWlwiLFxuICAgICAgICAgIFNWRy50cmFuc2xhdGVQYXRoKDQsIGN5IHx8IDQsIGZ1bmMoY3csIGNoKS5qb2luKFwiIFwiKSksXG4gICAgICAgIF0sXG4gICAgICAgIFwiZmlsbC1ydWxlXCI6IFwiZXZlbi1vZGRcIixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNvbW1lbnRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHIgPSA2XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGNsYXNzOiBcInNiLWNvbW1lbnRcIixcbiAgICAgICAgcGF0aDogW1xuICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgIHIsXG4gICAgICAgICAgMCxcbiAgICAgICAgICBTVkcuYXJjKHcgLSByLCAwLCB3LCByLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjKHcsIGggLSByLCB3IC0gciwgaCwgciwgciksXG4gICAgICAgICAgU1ZHLmFyYyhyLCBoLCAwLCBoIC0gciwgciwgciksXG4gICAgICAgICAgU1ZHLmFyYygwLCByLCByLCAwLCByLCByKSxcbiAgICAgICAgICBcIlpcIixcbiAgICAgICAgXSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGNvbW1lbnRMaW5lKHdpZHRoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcubW92ZShcbiAgICAgIC13aWR0aCxcbiAgICAgIDksXG4gICAgICBTVkcucmVjdChcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIDIsXG4gICAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICAgIGNsYXNzOiBcInNiLWNvbW1lbnQtbGluZVwiLFxuICAgICAgICB9KVxuICAgICAgKVxuICAgIClcbiAgfSxcblxuICBzdHJpa2V0aHJvdWdoTGluZSh3LCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBbXCJNXCIsIDAsIDAsIFwiTFwiLCB3LCAwXSxcbiAgICAgICAgY2xhc3M6IFwic2ItZGlmZiBzYi1kaWZmLWRlbFwiLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoXCIuL2RyYXcuanNcIilcblxuICB2YXIgRmlsdGVyID0gZnVuY3Rpb24oaWQsIHByb3BzKSB7XG4gICAgdGhpcy5lbCA9IFNWRy5lbChcbiAgICAgIFwiZmlsdGVyXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICB4MDogXCItNTAlXCIsXG4gICAgICAgIHkwOiBcIi01MCVcIixcbiAgICAgICAgd2lkdGg6IFwiMjAwJVwiLFxuICAgICAgICBoZWlnaHQ6IFwiMjAwJVwiLFxuICAgICAgfSlcbiAgICApXG4gICAgdGhpcy5oaWdoZXN0SWQgPSAwXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5mZSA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIHZhciBzaG9ydE5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvZ2F1c3NpYW58b3NpdGUvLCBcIlwiKVxuICAgIHZhciBpZCA9IFtzaG9ydE5hbWUsIFwiLVwiLCArK3RoaXMuaGlnaGVzdElkXS5qb2luKFwiXCIpXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZChcbiAgICAgIFNWRy53aXRoQ2hpbGRyZW4oXG4gICAgICAgIFNWRy5lbChcbiAgICAgICAgICBcImZlXCIgKyBuYW1lLFxuICAgICAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICAgICAgcmVzdWx0OiBpZCxcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgICBjaGlsZHJlbiB8fCBbXVxuICAgICAgKVxuICAgIClcbiAgICByZXR1cm4gaWRcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmNvbXAgPSBmdW5jdGlvbihvcCwgaW4xLCBpbjIsIHByb3BzKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXG4gICAgICBcIkNvbXBvc2l0ZVwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIG9wZXJhdG9yOiBvcCxcbiAgICAgICAgaW46IGluMSxcbiAgICAgICAgaW4yOiBpbjIsXG4gICAgICB9KVxuICAgIClcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24oaW4xLCBpbjIpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wKFwiYXJpdGhtZXRpY1wiLCBpbjEsIGluMiwgeyBrMjogKzEsIGszOiAtMSB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUub2Zmc2V0ID0gZnVuY3Rpb24oZHgsIGR5LCBpbjEpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIk9mZnNldFwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgZHg6IGR4LFxuICAgICAgZHk6IGR5LFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5mbG9vZCA9IGZ1bmN0aW9uKGNvbG9yLCBvcGFjaXR5LCBpbjEpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIkZsb29kXCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICBcImZsb29kLWNvbG9yXCI6IGNvbG9yLFxuICAgICAgXCJmbG9vZC1vcGFjaXR5XCI6IG9wYWNpdHksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmJsdXIgPSBmdW5jdGlvbihkZXYsIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKFwiR2F1c3NpYW5CbHVyXCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICBzdGREZXZpYXRpb246IFtkZXYsIGRldl0uam9pbihcIiBcIiksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmNvbG9yTWF0cml4ID0gZnVuY3Rpb24oaW4xLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIkNvbG9yTWF0cml4XCIsIHtcbiAgICAgIGluOiBpbjEsXG4gICAgICB0eXBlOiBcIm1hdHJpeFwiLFxuICAgICAgdmFsdWVzOiB2YWx1ZXMuam9pbihcIiBcIiksXG4gICAgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24oY2hpbGRyZW4pIHtcbiAgICB0aGlzLmZlKFxuICAgICAgXCJNZXJnZVwiLFxuICAgICAge30sXG4gICAgICBjaGlsZHJlbi5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gU1ZHLmVsKFwiZmVNZXJnZU5vZGVcIiwge1xuICAgICAgICAgIGluOiBuYW1lLFxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICApXG4gIH1cblxuICByZXR1cm4gRmlsdGVyXG59KSgpXG4iLCIvKlxuICogc2NyYXRjaGJsb2Nrc1xuICogaHR0cDovL3NjcmF0Y2hibG9ja3MuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTYsIFRpbSBSYWR2YW5cbiAqIEBsaWNlbnNlIE1JVFxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICovXG47KGZ1bmN0aW9uKG1vZCkge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gbW9kXG4gIH0gZWxzZSB7XG4gICAgdmFyIG1ha2VDYW52YXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG4gICAgfVxuICAgIHZhciBzY3JhdGNoYmxvY2tzID0gKHdpbmRvdy5zY3JhdGNoYmxvY2tzID0gbW9kKHdpbmRvdywgbWFrZUNhbnZhcykpXG5cbiAgICAvLyBhZGQgb3VyIENTUyB0byB0aGUgcGFnZVxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyYXRjaGJsb2Nrcy5tYWtlU3R5bGUoKSlcbiAgfVxufSkoZnVuY3Rpb24od2luZG93LCBtYWtlQ2FudmFzKSB7XG4gIFwidXNlIHN0cmljdFwiXG5cbiAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG5cbiAgLyogdXRpbHMgKi9cblxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIgeyBhbGxMYW5ndWFnZXMsIGxvYWRMYW5ndWFnZXMgfSA9IHJlcXVpcmUoXCIuL2Jsb2Nrcy5qc1wiKVxuXG4gIHZhciBwYXJzZSA9IHJlcXVpcmUoXCIuL3N5bnRheC5qc1wiKS5wYXJzZVxuXG4gIHZhciBzdHlsZSA9IHJlcXVpcmUoXCIuL3N0eWxlLmpzXCIpXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcbiAgfSA9IHJlcXVpcmUoXCIuL21vZGVsLmpzXCIpXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG4gIFNWRy5pbml0KHdpbmRvdywgbWFrZUNhbnZhcylcblxuICBMYWJlbC5tZWFzdXJpbmcgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IFNWRy5tYWtlQ2FudmFzKClcbiAgICByZXR1cm4gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuICB9KSgpXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIGZ1bmN0aW9uIHJlbmRlcihkb2MsIGNiKSB7XG4gICAgcmV0dXJuIGRvYy5yZW5kZXIoY2IpXG4gIH1cblxuICAvKioqIFJlbmRlciAqKiovXG5cbiAgLy8gcmVhZCBjb2RlIGZyb20gYSBET00gZWxlbWVudFxuICBmdW5jdGlvbiByZWFkQ29kZShlbCwgb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICB2YXIgaHRtbCA9IGVsLmlubmVySFRNTC5yZXBsYWNlKC88YnI+XFxzP3xcXG58XFxyXFxufFxcci9naSwgXCJcXG5cIilcbiAgICB2YXIgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKVxuICAgIHByZS5pbm5lckhUTUwgPSBodG1sXG4gICAgdmFyIGNvZGUgPSBwcmUudGV4dENvbnRlbnRcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoXCJcXG5cIiwgXCJcIilcbiAgICB9XG4gICAgcmV0dXJuIGNvZGVcbiAgfVxuXG4gIC8vIGluc2VydCAnc3ZnJyBpbnRvICdlbCcsIHdpdGggYXBwcm9wcmlhdGUgd3JhcHBlciBlbGVtZW50c1xuICBmdW5jdGlvbiByZXBsYWNlKGVsLCBzdmcsIHNjcmlwdHMsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKVxuICAgICAgdmFyIGNscyA9IFwic2NyYXRjaGJsb2NrcyBzY3JhdGNoYmxvY2tzLWlubGluZVwiXG4gICAgICBpZiAoc2NyaXB0c1swXSAmJiAhc2NyaXB0c1swXS5pc0VtcHR5KSB7XG4gICAgICAgIGNscyArPSBcIiBzY3JhdGNoYmxvY2tzLWlubGluZS1cIiArIHNjcmlwdHNbMF0uYmxvY2tzWzBdLnNoYXBlXG4gICAgICB9XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gY2xzXG4gICAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCJcbiAgICAgIGNvbnRhaW5lci5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIlxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IFwic2NyYXRjaGJsb2Nrc1wiXG4gICAgfVxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzdmcpXG5cbiAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgZWwuYXBwZW5kQ2hpbGQoY29udGFpbmVyKVxuICB9XG5cbiAgLyogUmVuZGVyIGFsbCBtYXRjaGluZyBlbGVtZW50cyBpbiBwYWdlIHRvIHNoaW55IHNjcmF0Y2ggYmxvY2tzLlxuICAgKiBBY2NlcHRzIGEgQ1NTIHNlbGVjdG9yIGFzIGFuIGFyZ3VtZW50LlxuICAgKlxuICAgKiAgc2NyYXRjaGJsb2Nrcy5yZW5kZXJNYXRjaGluZyhcInByZS5ibG9ja3NcIik7XG4gICAqXG4gICAqIExpa2UgdGhlIG9sZCAnc2NyYXRjaGJsb2NrczIucGFyc2UoKS5cbiAgICovXG4gIHZhciByZW5kZXJNYXRjaGluZyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBvcHRpb25zKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgXCJwcmUuYmxvY2tzXCJcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJlblwiXSxcblxuICAgICAgICByZWFkOiByZWFkQ29kZSwgLy8gZnVuY3Rpb24oZWwsIG9wdGlvbnMpID0+IGNvZGVcbiAgICAgICAgcGFyc2U6IHBhcnNlLCAvLyBmdW5jdGlvbihjb2RlLCBvcHRpb25zKSA9PiBkb2NcbiAgICAgICAgcmVuZGVyOiByZW5kZXIsIC8vIGZ1bmN0aW9uKGRvYywgY2IpID0+IHN2Z1xuICAgICAgICByZXBsYWNlOiByZXBsYWNlLCAvLyBmdW5jdGlvbihlbCwgc3ZnLCBkb2MsIG9wdGlvbnMpXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIC8vIGZpbmQgZWxlbWVudHNcbiAgICB2YXIgcmVzdWx0cyA9IFtdLnNsaWNlLmFwcGx5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgdmFyIGNvZGUgPSBvcHRpb25zLnJlYWQoZWwsIG9wdGlvbnMpXG5cbiAgICAgIHZhciBkb2MgPSBvcHRpb25zLnBhcnNlKGNvZGUsIG9wdGlvbnMpXG5cbiAgICAgIG9wdGlvbnMucmVuZGVyKGRvYywgZnVuY3Rpb24oc3ZnKSB7XG4gICAgICAgIG9wdGlvbnMucmVwbGFjZShlbCwgc3ZnLCBkb2MsIG9wdGlvbnMpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKiBQYXJzZSBzY3JhdGNoYmxvY2tzIGNvZGUgYW5kIHJldHVybiBYTUwgc3RyaW5nLlxuICAgKlxuICAgKiBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgTm9kZSwgcmVhbGx5LlxuICAgKi9cbiAgdmFyIHJlbmRlclNWR1N0cmluZyA9IGZ1bmN0aW9uKGNvZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZG9jID0gcGFyc2UoY29kZSwgb3B0aW9ucylcblxuICAgIC8vIFdBUk46IERvY3VtZW50LnJlbmRlcigpIG1heSBiZWNvbWUgYXN5bmMgYWdhaW4gaW4gZnV0dXJlIDotKFxuICAgIGRvYy5yZW5kZXIoZnVuY3Rpb24oKSB7fSlcblxuICAgIHJldHVybiBkb2MuZXhwb3J0U1ZHU3RyaW5nKClcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWxsTGFuZ3VhZ2VzOiBhbGxMYW5ndWFnZXMsIC8vIHJlYWQtb25seVxuICAgIGxvYWRMYW5ndWFnZXM6IGxvYWRMYW5ndWFnZXMsXG5cbiAgICBmcm9tSlNPTjogRG9jdW1lbnQuZnJvbUpTT04sXG4gICAgdG9KU09OOiBmdW5jdGlvbihkb2MpIHtcbiAgICAgIHJldHVybiBkb2MudG9KU09OKClcbiAgICB9LFxuICAgIHN0cmluZ2lmeTogZnVuY3Rpb24oZG9jKSB7XG4gICAgICByZXR1cm4gZG9jLnN0cmluZ2lmeSgpXG4gICAgfSxcblxuICAgIExhYmVsLFxuICAgIEljb24sXG4gICAgSW5wdXQsXG4gICAgQmxvY2ssXG4gICAgQ29tbWVudCxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG5cbiAgICByZWFkOiByZWFkQ29kZSxcbiAgICBwYXJzZTogcGFyc2UsXG4gICAgLy8gcmVuZGVyOiByZW5kZXIsIC8vIFJFTU9WRUQgc2luY2UgZG9jLnJlbmRlcihjYikgbWFrZXMgbXVjaCBtb3JlIHNlbnNlXG4gICAgcmVwbGFjZTogcmVwbGFjZSxcbiAgICByZW5kZXJNYXRjaGluZzogcmVuZGVyTWF0Y2hpbmcsXG5cbiAgICByZW5kZXJTVkdTdHJpbmc6IHJlbmRlclNWR1N0cmluZyxcbiAgICBtYWtlU3R5bGU6IHN0eWxlLm1ha2VTdHlsZSxcbiAgfVxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIGZ1bmN0aW9uIGluZGVudCh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgIHJldHVybiBcIiAgXCIgKyBsaW5lXG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcXG5cIilcbiAgfVxuXG4gIGZ1bmN0aW9uIG1heWJlTnVtYmVyKHYpIHtcbiAgICB2ID0gXCJcIiArIHZcbiAgICB2YXIgbiA9IHBhcnNlSW50KHYpXG4gICAgaWYgKCFpc05hTihuKSkge1xuICAgICAgcmV0dXJuIG5cbiAgICB9XG4gICAgdmFyIGYgPSBwYXJzZUZsb2F0KHYpXG4gICAgaWYgKCFpc05hTihmKSkge1xuICAgICAgcmV0dXJuIGZcbiAgICB9XG4gICAgcmV0dXJuIHZcbiAgfVxuXG4gIHZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG5cbiAgdmFyIHtcbiAgICBkZWZhdWx0Rm9udEZhbWlseSxcbiAgICBtYWtlU3R5bGUsXG4gICAgbWFrZUljb25zLFxuICAgIGRhcmtSZWN0LFxuICAgIGJldmVsRmlsdGVyLFxuICAgIGRhcmtGaWx0ZXIsXG4gICAgZGVzYXR1cmF0ZUZpbHRlcixcbiAgfSA9IHJlcXVpcmUoXCIuL3N0eWxlLmpzXCIpXG5cbiAgdmFyIHtcbiAgICBibG9ja3NCeVNlbGVjdG9yLFxuICAgIHBhcnNlU3BlYyxcbiAgICBpbnB1dFBhdCxcbiAgICBpY29uUGF0LFxuICAgIHJ0bExhbmd1YWdlcyxcbiAgICB1bmljb2RlSWNvbnMsXG4gICAgZW5nbGlzaCxcbiAgICBibG9ja05hbWUsXG4gIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICAvKiBMYWJlbCAqL1xuXG4gIHZhciBMYWJlbCA9IGZ1bmN0aW9uKHZhbHVlLCBjbHMpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmNscyA9IGNscyB8fCBcIlwiXG4gICAgdGhpcy5lbCA9IG51bGxcbiAgICB0aGlzLmhlaWdodCA9IDEyXG4gICAgdGhpcy5tZXRyaWNzID0gbnVsbFxuICAgIHRoaXMueCA9IDBcbiAgfVxuICBMYWJlbC5wcm90b3R5cGUuaXNMYWJlbCA9IHRydWVcblxuICBMYWJlbC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMudmFsdWUgPT09IFwiPFwiIHx8IHRoaXMudmFsdWUgPT09IFwiPlwiKSByZXR1cm4gdGhpcy52YWx1ZVxuICAgIHJldHVybiB0aGlzLnZhbHVlLnJlcGxhY2UoLyhbPD5bXFxdKCl7fV0pL2csIFwiXFxcXCQxXCIpXG4gIH1cblxuICBMYWJlbC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVsXG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTGFiZWwucHJvdG90eXBlLCBcIndpZHRoXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWV0cmljcy53aWR0aFxuICAgIH0sXG4gIH0pXG5cbiAgTGFiZWwubWV0cmljc0NhY2hlID0ge31cbiAgTGFiZWwudG9NZWFzdXJlID0gW11cblxuICBMYWJlbC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWVcbiAgICB2YXIgY2xzID0gdGhpcy5jbHNcbiAgICB0aGlzLmVsID0gU1ZHLnRleHQoMCwgMTAsIHZhbHVlLCB7XG4gICAgICBjbGFzczogXCJzYi1sYWJlbCBcIiArIGNscyxcbiAgICB9KVxuXG4gICAgdmFyIGNhY2hlID0gTGFiZWwubWV0cmljc0NhY2hlW2Nsc11cbiAgICBpZiAoIWNhY2hlKSB7XG4gICAgICBjYWNoZSA9IExhYmVsLm1ldHJpY3NDYWNoZVtjbHNdID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgIH1cblxuICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChjYWNoZSwgdmFsdWUpKSB7XG4gICAgICB0aGlzLm1ldHJpY3MgPSBjYWNoZVt2YWx1ZV1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGZvbnQgPSAvc2ItY29tbWVudC1sYWJlbC8udGVzdCh0aGlzLmNscylcbiAgICAgICAgPyBcImJvbGQgMTJweCBIZWxldmV0aWNhLCBBcmlhbCwgRGVqYVZ1IFNhbnMsIHNhbnMtc2VyaWZcIlxuICAgICAgICA6IC9zYi1saXRlcmFsLy50ZXN0KHRoaXMuY2xzKVxuICAgICAgICAgID8gXCJub3JtYWwgOXB4IFwiICsgZGVmYXVsdEZvbnRGYW1pbHlcbiAgICAgICAgICA6IFwiYm9sZCAxMHB4IFwiICsgZGVmYXVsdEZvbnRGYW1pbHlcbiAgICAgIHRoaXMubWV0cmljcyA9IGNhY2hlW3ZhbHVlXSA9IExhYmVsLm1lYXN1cmUodmFsdWUsIGZvbnQpXG4gICAgICAvLyBUT0RPOiB3b3JkLXNwYWNpbmc/IChmb3J0dW5hdGVseSBpdCBzZWVtcyB0byBoYXZlIG5vIGVmZmVjdCEpXG4gICAgfVxuICB9XG5cbiAgTGFiZWwubWVhc3VyZSA9IGZ1bmN0aW9uKHZhbHVlLCBmb250KSB7XG4gICAgdmFyIGNvbnRleHQgPSBMYWJlbC5tZWFzdXJpbmdcbiAgICBjb250ZXh0LmZvbnQgPSBmb250XG4gICAgdmFyIHRleHRNZXRyaWNzID0gY29udGV4dC5tZWFzdXJlVGV4dCh2YWx1ZSlcbiAgICB2YXIgd2lkdGggPSAodGV4dE1ldHJpY3Mud2lkdGggKyAwLjUpIHwgMFxuICAgIHJldHVybiB7IHdpZHRoOiB3aWR0aCB9XG4gIH1cblxuICAvKiBJY29uICovXG5cbiAgdmFyIEljb24gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaXNBcnJvdyA9IG5hbWUgPT09IFwibG9vcEFycm93XCJcblxuICAgIHZhciBpbmZvID0gSWNvbi5pY29uc1tuYW1lXVxuICAgIGFzc2VydChpbmZvLCBcIm5vIGluZm8gZm9yIGljb24gXCIgKyBuYW1lKVxuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5mbylcbiAgfVxuICBJY29uLnByb3RvdHlwZS5pc0ljb24gPSB0cnVlXG5cbiAgSWNvbi5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHVuaWNvZGVJY29uc1tcIkBcIiArIHRoaXMubmFtZV0gfHwgXCJcIlxuICB9XG5cbiAgSWNvbi5pY29ucyA9IHtcbiAgICBncmVlbkZsYWc6IHsgd2lkdGg6IDUsIGhlaWdodDogNSwgZHk6IC0yLCBkeDogLTggfSxcbiAgICB0dXJuTGVmdDogeyB3aWR0aDogMTUsIGhlaWdodDogMTIsIGR5OiArMSB9LFxuICAgIHR1cm5SaWdodDogeyB3aWR0aDogMTUsIGhlaWdodDogMTIsIGR5OiArMSB9LFxuICAgIGxvb3BBcnJvdzogeyB3aWR0aDogMTQsIGhlaWdodDogMTEgfSxcbiAgICBhZGRJbnB1dDogeyB3aWR0aDogNCwgaGVpZ2h0OiA4IH0sXG4gICAgZGVsSW5wdXQ6IHsgd2lkdGg6IDQsIGhlaWdodDogOCB9LFxuICB9XG4gIEljb24ucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gU1ZHLnN5bWJvbChcIiNcIiArIHRoaXMubmFtZSwge1xuICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgIH0pXG4gIH1cblxuICAvKiBJbnB1dCAqL1xuXG4gIHZhciBJbnB1dCA9IGZ1bmN0aW9uKHNoYXBlLCB2YWx1ZSwgbWVudSkge1xuICAgIHRoaXMuc2hhcGUgPSBzaGFwZVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMubWVudSA9IG1lbnUgfHwgbnVsbFxuXG4gICAgdGhpcy5pc1JvdW5kID0gc2hhcGUgPT09IFwibnVtYmVyXCIgfHwgc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCJcbiAgICB0aGlzLmlzQm9vbGVhbiA9IHNoYXBlID09PSBcImJvb2xlYW5cIlxuICAgIHRoaXMuaXNTdGFjayA9IHNoYXBlID09PSBcInN0YWNrXCJcbiAgICB0aGlzLmlzSW5zZXQgPVxuICAgICAgc2hhcGUgPT09IFwiYm9vbGVhblwiIHx8IHNoYXBlID09PSBcInN0YWNrXCIgfHwgc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgIHRoaXMuaXNDb2xvciA9IHNoYXBlID09PSBcImNvbG9yXCJcbiAgICB0aGlzLmhhc0Fycm93ID0gc2hhcGUgPT09IFwiZHJvcGRvd25cIiB8fCBzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIlxuICAgIHRoaXMuaXNEYXJrZXIgPVxuICAgICAgc2hhcGUgPT09IFwiYm9vbGVhblwiIHx8IHNoYXBlID09PSBcInN0YWNrXCIgfHwgc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuICAgIHRoaXMuaXNTcXVhcmUgPVxuICAgICAgc2hhcGUgPT09IFwic3RyaW5nXCIgfHwgc2hhcGUgPT09IFwiY29sb3JcIiB8fCBzaGFwZSA9PT0gXCJkcm9wZG93blwiXG5cbiAgICB0aGlzLmhhc0xhYmVsID0gISh0aGlzLmlzQ29sb3IgfHwgdGhpcy5pc0luc2V0KVxuICAgIHRoaXMubGFiZWwgPSB0aGlzLmhhc0xhYmVsXG4gICAgICA/IG5ldyBMYWJlbCh2YWx1ZSwgW1wic2ItbGl0ZXJhbC1cIiArIHRoaXMuc2hhcGVdKVxuICAgICAgOiBudWxsXG4gICAgdGhpcy54ID0gMFxuICB9XG4gIElucHV0LnByb3RvdHlwZS5pc0lucHV0ID0gdHJ1ZVxuXG4gIElucHV0LmZyb21KU09OID0gZnVuY3Rpb24obGFuZywgdmFsdWUsIHBhcnQpIHtcbiAgICB2YXIgc2hhcGUgPSB7XG4gICAgICBiOiBcImJvb2xlYW5cIixcbiAgICAgIG46IFwibnVtYmVyXCIsXG4gICAgICBzOiBcInN0cmluZ1wiLFxuICAgICAgZDogXCJudW1iZXItZHJvcGRvd25cIixcbiAgICAgIG06IFwiZHJvcGRvd25cIixcbiAgICAgIGM6IFwiY29sb3JcIixcbiAgICB9W3BhcnRbMV1dXG5cbiAgICBpZiAoc2hhcGUgPT09IFwiY29sb3JcIikge1xuICAgICAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMClcbiAgICAgICAgdmFsdWUgPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMjU2ICogMjU2ICogMjU2KVxuICAgICAgdmFsdWUgPSArdmFsdWVcbiAgICAgIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICAgICAgdmFyIGhleCA9IHZhbHVlLnRvU3RyaW5nKDE2KVxuICAgICAgaGV4ID0gaGV4LnNsaWNlKE1hdGgubWF4KDAsIGhleC5sZW5ndGggLSA2KSkgLy8gbGFzdCA2IGNoYXJhY3RlcnNcbiAgICAgIHdoaWxlIChoZXgubGVuZ3RoIDwgNikgaGV4ID0gXCIwXCIgKyBoZXhcbiAgICAgIGlmIChoZXhbMF0gPT09IGhleFsxXSAmJiBoZXhbMl0gPT09IGhleFszXSAmJiBoZXhbNF0gPT09IGhleFs1XSkge1xuICAgICAgICBoZXggPSBoZXhbMF0gKyBoZXhbMl0gKyBoZXhbNF1cbiAgICAgIH1cbiAgICAgIHZhbHVlID0gXCIjXCIgKyBoZXhcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSBcImRyb3Bkb3duXCIpIHtcbiAgICAgIHZhbHVlID1cbiAgICAgICAge1xuICAgICAgICAgIF9tb3VzZV86IFwibW91c2UtcG9pbnRlclwiLFxuICAgICAgICAgIF9teXNlbGZfOiBcIm15c2VsZlwiLFxuICAgICAgICAgIF9zdGFnZV86IFwiU3RhZ2VcIixcbiAgICAgICAgICBfZWRnZV86IFwiZWRnZVwiLFxuICAgICAgICAgIF9yYW5kb21fOiBcInJhbmRvbSBwb3NpdGlvblwiLFxuICAgICAgICB9W3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgdmFyIG1lbnUgPSB2YWx1ZVxuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiKSB7XG4gICAgICB2YWx1ZSA9IGxhbmcuZHJvcGRvd25zW3ZhbHVlXSB8fCB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgSW5wdXQoc2hhcGUsIFwiXCIgKyB2YWx1ZSwgbWVudSlcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc0NvbG9yKSB7XG4gICAgICBhc3NlcnQodGhpcy52YWx1ZVswXSA9PT0gXCIjXCIpXG4gICAgICB2YXIgaCA9IHRoaXMudmFsdWUuc2xpY2UoMSlcbiAgICAgIGlmIChoLmxlbmd0aCA9PT0gMykgaCA9IGhbMF0gKyBoWzBdICsgaFsxXSArIGhbMV0gKyBoWzJdICsgaFsyXVxuICAgICAgcmV0dXJuIHBhcnNlSW50KGgsIDE2KVxuICAgICAgLy8gVE9ETyBzaWduZWQgaW50P1xuICAgIH1cbiAgICBpZiAodGhpcy5oYXNBcnJvdykge1xuICAgICAgdmFyIHZhbHVlID0gdGhpcy5tZW51IHx8IHRoaXMudmFsdWVcbiAgICAgIGlmICh0aGlzLnNoYXBlID09PSBcImRyb3Bkb3duXCIpIHtcbiAgICAgICAgdmFsdWUgPVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibW91c2UtcG9pbnRlclwiOiBcIl9tb3VzZV9cIixcbiAgICAgICAgICAgIG15c2VsZjogXCJfbXlzZWxmXCIsXG4gICAgICAgICAgICBTdGFnZTogXCJfc3RhZ2VfXCIsXG4gICAgICAgICAgICBlZGdlOiBcIl9lZGdlX1wiLFxuICAgICAgICAgICAgXCJyYW5kb20gcG9zaXRpb25cIjogXCJfcmFuZG9tX1wiLFxuICAgICAgICAgIH1bdmFsdWVdIHx8IHZhbHVlXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc1JvdW5kKSB7XG4gICAgICAgIHZhbHVlID0gbWF5YmVOdW1iZXIodmFsdWUpXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaXNCb29sZWFuXG4gICAgICA/IGZhbHNlXG4gICAgICA6IHRoaXMuaXNSb3VuZCA/IG1heWJlTnVtYmVyKHRoaXMudmFsdWUpIDogdGhpcy52YWx1ZVxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzQ29sb3IpIHtcbiAgICAgIGFzc2VydCh0aGlzLnZhbHVlWzBdID09PSBcIiNcIilcbiAgICAgIHJldHVybiBcIltcIiArIHRoaXMudmFsdWUgKyBcIl1cIlxuICAgIH1cbiAgICB2YXIgdGV4dCA9ICh0aGlzLnZhbHVlID8gXCJcIiArIHRoaXMudmFsdWUgOiBcIlwiKVxuICAgICAgLnJlcGxhY2UoLyB2JC8sIFwiIFxcXFx2XCIpXG4gICAgICAucmVwbGFjZSgvKFtcXF1cXFxcXSkvZywgXCJcXFxcJDFcIilcbiAgICBpZiAodGhpcy5oYXNBcnJvdykgdGV4dCArPSBcIiB2XCJcbiAgICByZXR1cm4gdGhpcy5pc1JvdW5kXG4gICAgICA/IFwiKFwiICsgdGV4dCArIFwiKVwiXG4gICAgICA6IHRoaXMuaXNTcXVhcmVcbiAgICAgICAgPyBcIltcIiArIHRleHQgKyBcIl1cIlxuICAgICAgICA6IHRoaXMuaXNCb29sZWFuID8gXCI8PlwiIDogdGhpcy5pc1N0YWNrID8gXCJ7fVwiIDogdGV4dFxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICBpZiAodGhpcy5oYXNBcnJvdykge1xuICAgICAgdmFyIHZhbHVlID0gdGhpcy5tZW51IHx8IHRoaXMudmFsdWVcbiAgICAgIHRoaXMudmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIHRoaXMubGFiZWwgPSBuZXcgTGFiZWwodGhpcy52YWx1ZSwgW1wic2ItbGl0ZXJhbC1cIiArIHRoaXMuc2hhcGVdKVxuICAgIH1cbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHRoaXMubGFiZWwubWVhc3VyZSgpXG4gIH1cblxuICBJbnB1dC5zaGFwZXMgPSB7XG4gICAgc3RyaW5nOiBTVkcucm91bmRlZFJlY3QsXG4gICAgbnVtYmVyOiBTVkcucm91bmRlZFJlY3QsXG4gICAgXCJudW1iZXItZHJvcGRvd25cIjogU1ZHLnJvdW5kZWRSZWN0LFxuICAgIGNvbG9yOiBTVkcucm91bmRlZFJlY3QsXG4gICAgZHJvcGRvd246IFNWRy5yZWN0LFxuXG4gICAgYm9vbGVhbjogU1ZHLnBvaW50ZWRSZWN0LFxuICAgIHN0YWNrOiBTVkcuc3RhY2tSZWN0LFxuICAgIHJlcG9ydGVyOiBTVkcucm91bmRlZFJlY3QsXG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB7XG4gICAgICB2YXIgbGFiZWwgPSB0aGlzLmxhYmVsLmRyYXcoKVxuICAgICAgdmFyIHcgPSBNYXRoLm1heChcbiAgICAgICAgMTQsXG4gICAgICAgIHRoaXMubGFiZWwud2lkdGggK1xuICAgICAgICAgICh0aGlzLnNoYXBlID09PSBcInN0cmluZ1wiIHx8IHRoaXMuc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCIgPyA2IDogOSlcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHcgPSB0aGlzLmlzSW5zZXQgPyAzMCA6IHRoaXMuaXNDb2xvciA/IDEzIDogbnVsbFxuICAgIH1cbiAgICBpZiAodGhpcy5oYXNBcnJvdykgdyArPSAxMFxuICAgIHRoaXMud2lkdGggPSB3XG5cbiAgICB2YXIgaCA9ICh0aGlzLmhlaWdodCA9IHRoaXMuaXNSb3VuZCB8fCB0aGlzLmlzQ29sb3IgPyAxMyA6IDE0KVxuXG4gICAgdmFyIGVsID0gSW5wdXQuc2hhcGVzW3RoaXMuc2hhcGVdKHcsIGgpXG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGZpbGw6IHRoaXMudmFsdWUsXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAodGhpcy5pc0Rhcmtlcikge1xuICAgICAgZWwgPSBkYXJrUmVjdCh3LCBoLCBwYXJlbnQuaW5mby5jYXRlZ29yeSwgZWwpXG4gICAgICBpZiAocGFyZW50LmluZm8uY29sb3IpIHtcbiAgICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgICAgZmlsbDogcGFyZW50LmluZm8uY29sb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IFNWRy5ncm91cChbXG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgY2xhc3M6IFtcInNiLWlucHV0XCIsIFwic2ItaW5wdXQtXCIgKyB0aGlzLnNoYXBlXS5qb2luKFwiIFwiKSxcbiAgICAgIH0pLFxuICAgIF0pXG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHtcbiAgICAgIHZhciB4ID0gdGhpcy5pc1JvdW5kID8gNSA6IDRcbiAgICAgIHJlc3VsdC5hcHBlbmRDaGlsZChTVkcubW92ZSh4LCAwLCBsYWJlbCkpXG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB7XG4gICAgICB2YXIgeSA9IHRoaXMuc2hhcGUgPT09IFwiZHJvcGRvd25cIiA/IDUgOiA0XG4gICAgICByZXN1bHQuYXBwZW5kQ2hpbGQoXG4gICAgICAgIFNWRy5tb3ZlKFxuICAgICAgICAgIHcgLSAxMCxcbiAgICAgICAgICB5LFxuICAgICAgICAgIFNWRy5wb2x5Z29uKHtcbiAgICAgICAgICAgIHBvaW50czogWzcsIDAsIDMuNSwgNCwgMCwgMF0sXG4gICAgICAgICAgICBmaWxsOiBcIiNGRkZcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiMC42XCIsXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKiBCbG9jayAqL1xuXG4gIHZhciBCbG9jayA9IGZ1bmN0aW9uKGluZm8sIGNoaWxkcmVuLCBjb21tZW50KSB7XG4gICAgYXNzZXJ0KGluZm8pXG4gICAgdGhpcy5pbmZvID0gaW5mb1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlblxuICAgIHRoaXMuY29tbWVudCA9IGNvbW1lbnQgfHwgbnVsbFxuICAgIHRoaXMuZGlmZiA9IG51bGxcblxuICAgIHZhciBzaGFwZSA9IHRoaXMuaW5mby5zaGFwZVxuICAgIHRoaXMuaXNIYXQgPSBzaGFwZSA9PT0gXCJoYXRcIiB8fCBzaGFwZSA9PT0gXCJkZWZpbmUtaGF0XCJcbiAgICB0aGlzLmhhc1B1enpsZSA9IHNoYXBlID09PSBcInN0YWNrXCIgfHwgc2hhcGUgPT09IFwiaGF0XCJcbiAgICB0aGlzLmlzRmluYWwgPSAvY2FwLy50ZXN0KHNoYXBlKVxuICAgIHRoaXMuaXNDb21tYW5kID0gc2hhcGUgPT09IFwic3RhY2tcIiB8fCBzaGFwZSA9PT0gXCJjYXBcIiB8fCAvYmxvY2svLnRlc3Qoc2hhcGUpXG4gICAgdGhpcy5pc091dGxpbmUgPSBzaGFwZSA9PT0gXCJvdXRsaW5lXCJcbiAgICB0aGlzLmlzUmVwb3J0ZXIgPSBzaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgdGhpcy5pc0Jvb2xlYW4gPSBzaGFwZSA9PT0gXCJib29sZWFuXCJcblxuICAgIHRoaXMuaXNSaW5nID0gc2hhcGUgPT09IFwicmluZ1wiXG4gICAgdGhpcy5oYXNTY3JpcHQgPSAvYmxvY2svLnRlc3Qoc2hhcGUpXG4gICAgdGhpcy5pc0Vsc2UgPSBzaGFwZSA9PT0gXCJjZWxzZVwiXG4gICAgdGhpcy5pc0VuZCA9IHNoYXBlID09PSBcImNlbmRcIlxuXG4gICAgdGhpcy54ID0gMFxuICAgIHRoaXMud2lkdGggPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSBudWxsXG4gICAgdGhpcy5maXJzdExpbmUgPSBudWxsXG4gICAgdGhpcy5pbm5lcldpZHRoID0gbnVsbFxuICB9XG4gIEJsb2NrLnByb3RvdHlwZS5pc0Jsb2NrID0gdHJ1ZVxuXG4gIEJsb2NrLmZyb21KU09OID0gZnVuY3Rpb24obGFuZywgYXJyYXksIHBhcnQpIHtcbiAgICB2YXIgYXJncyA9IGFycmF5LnNsaWNlKClcbiAgICB2YXIgc2VsZWN0b3IgPSBhcmdzLnNoaWZ0KClcbiAgICBpZiAoc2VsZWN0b3IgPT09IFwicHJvY0RlZlwiKSB7XG4gICAgICB2YXIgc3BlYyA9IGFyZ3NbMF1cbiAgICAgIHZhciBpbnB1dE5hbWVzID0gYXJnc1sxXS5zbGljZSgpXG4gICAgICAvLyB2YXIgZGVmYXVsdFZhbHVlcyA9IGFyZ3NbMl07XG4gICAgICAvLyB2YXIgaXNBdG9taWMgPSBhcmdzWzNdOyAvLyBUT0RPXG5cbiAgICAgIHZhciBpbmZvID0gcGFyc2VTcGVjKHNwZWMpXG4gICAgICB2YXIgY2hpbGRyZW4gPSBpbmZvLnBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgIGlmIChpbnB1dFBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgICAgdmFyIGxhYmVsID0gbmV3IExhYmVsKGlucHV0TmFtZXMuc2hpZnQoKSlcbiAgICAgICAgICByZXR1cm4gbmV3IEJsb2NrKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzaGFwZTogcGFydFsxXSA9PT0gXCJiXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIixcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tLWFyZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFtsYWJlbF1cbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBMYWJlbChwYXJ0KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdmFyIG91dGxpbmUgPSBuZXcgQmxvY2soXG4gICAgICAgIHtcbiAgICAgICAgICBzaGFwZTogXCJvdXRsaW5lXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG5cbiAgICAgIHZhciBjaGlsZHJlbiA9IFtuZXcgTGFiZWwobGFuZy5kZWZpbmVbMF0pLCBvdXRsaW5lXVxuICAgICAgcmV0dXJuIG5ldyBCbG9jayhcbiAgICAgICAge1xuICAgICAgICAgIHNoYXBlOiBcImRlZmluZS1oYXRcIixcbiAgICAgICAgICBjYXRlZ29yeTogXCJjdXN0b21cIixcbiAgICAgICAgICBzZWxlY3RvcjogXCJwcm9jRGVmXCIsXG4gICAgICAgICAgY2FsbDogc3BlYyxcbiAgICAgICAgICBuYW1lczogYXJnc1sxXSxcbiAgICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHNlbGVjdG9yID09PSBcImNhbGxcIikge1xuICAgICAgdmFyIHNwZWMgPSBhcmdzLnNoaWZ0KClcbiAgICAgIHZhciBpbmZvID0gZXh0ZW5kKHBhcnNlU3BlYyhzcGVjKSwge1xuICAgICAgICBjYXRlZ29yeTogXCJjdXN0b21cIixcbiAgICAgICAgc2hhcGU6IFwic3RhY2tcIixcbiAgICAgICAgc2VsZWN0b3I6IFwiY2FsbFwiLFxuICAgICAgICBjYWxsOiBzcGVjLFxuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH0pXG4gICAgICB2YXIgcGFydHMgPSBpbmZvLnBhcnRzXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHNlbGVjdG9yID09PSBcInJlYWRWYXJpYWJsZVwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJjb250ZW50c09mTGlzdDpcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIlxuICAgICkge1xuICAgICAgdmFyIHNoYXBlID1cbiAgICAgICAgc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIiAmJiBhcmdzLnBvcCgpID09PSBcImJcIiA/IFwiYm9vbGVhblwiIDogXCJyZXBvcnRlclwiXG4gICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgICAgICBzaGFwZTogc2hhcGUsXG4gICAgICAgIGNhdGVnb3J5OiB7XG4gICAgICAgICAgcmVhZFZhcmlhYmxlOiBcInZhcmlhYmxlc1wiLFxuICAgICAgICAgIFwiY29udGVudHNPZkxpc3Q6XCI6IFwibGlzdFwiLFxuICAgICAgICAgIGdldFBhcmFtOiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgfVtzZWxlY3Rvcl0sXG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBCbG9jayhpbmZvLCBbbmV3IExhYmVsKGFyZ3NbMF0pXSlcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGluZm8gPSBleHRlbmQoYmxvY2tzQnlTZWxlY3RvcltzZWxlY3Rvcl0sIHtcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICB9KVxuICAgICAgYXNzZXJ0KGluZm8sIFwidW5rbm93biBzZWxlY3RvcjogXCIgKyBzZWxlY3RvcilcbiAgICAgIHZhciBzcGVjID0gbGFuZy5jb21tYW5kc1tpbmZvLnNwZWNdIHx8IHNwZWNcbiAgICAgIHZhciBwYXJ0cyA9IHNwZWMgPyBwYXJzZVNwZWMoc3BlYykucGFydHMgOiBpbmZvLnBhcnRzXG4gICAgfVxuICAgIHZhciBjaGlsZHJlbiA9IHBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICBpZiAoaW5wdXRQYXQudGVzdChwYXJ0KSkge1xuICAgICAgICB2YXIgYXJnID0gYXJncy5zaGlmdCgpXG4gICAgICAgIHJldHVybiAoaXNBcnJheShhcmcpID8gQmxvY2sgOiBJbnB1dCkuZnJvbUpTT04obGFuZywgYXJnLCBwYXJ0KVxuICAgICAgfSBlbHNlIGlmIChpY29uUGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJY29uKHBhcnQuc2xpY2UoMSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IExhYmVsKHBhcnQudHJpbSgpKVxuICAgICAgfVxuICAgIH0pXG4gICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3QsIGluZGV4KSB7XG4gICAgICBsaXN0ID0gbGlzdCB8fCBbXVxuICAgICAgYXNzZXJ0KGlzQXJyYXkobGlzdCkpXG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBTY3JpcHQobGlzdC5tYXAoQmxvY2suZnJvbUpTT04uYmluZChudWxsLCBsYW5nKSkpKVxuICAgICAgaWYgKHNlbGVjdG9yID09PSBcImRvSWZFbHNlXCIgJiYgaW5kZXggPT09IDApIHtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwobGFuZy5jb21tYW5kc1tcImVsc2VcIl0pKVxuICAgICAgfVxuICAgIH0pXG4gICAgLy8gVE9ETyBsb29wIGFycm93c1xuICAgIHJldHVybiBuZXcgQmxvY2soaW5mbywgY2hpbGRyZW4pXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gdGhpcy5pbmZvLnNlbGVjdG9yXG4gICAgdmFyIGFyZ3MgPSBbXVxuXG4gICAgaWYgKHNlbGVjdG9yID09PSBcInByb2NEZWZcIikge1xuICAgICAgdmFyIGlucHV0TmFtZXMgPSB0aGlzLmluZm8ubmFtZXNcbiAgICAgIHZhciBzcGVjID0gdGhpcy5pbmZvLmNhbGxcbiAgICAgIHZhciBpbmZvID0gcGFyc2VTcGVjKHNwZWMpXG4gICAgICB2YXIgZGVmYXVsdFZhbHVlcyA9IGluZm8uaW5wdXRzLm1hcChmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgPT09IFwiJW5cIiA/IDEgOiBpbnB1dCA9PT0gXCIlYlwiID8gZmFsc2UgOiBcIlwiXG4gICAgICB9KVxuICAgICAgdmFyIGlzQXRvbWljID0gZmFsc2UgLy8gVE9ETyAnZGVmaW5lLWF0b21pYycgPz9cbiAgICAgIHJldHVybiBbXCJwcm9jRGVmXCIsIHNwZWMsIGlucHV0TmFtZXMsIGRlZmF1bHRWYWx1ZXMsIGlzQXRvbWljXVxuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHNlbGVjdG9yID09PSBcInJlYWRWYXJpYWJsZVwiIHx8XG4gICAgICBzZWxlY3RvciA9PT0gXCJjb250ZW50c09mTGlzdDpcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIlxuICAgICkge1xuICAgICAgYXJncy5wdXNoKGJsb2NrTmFtZSh0aGlzKSlcbiAgICAgIGlmIChzZWxlY3RvciA9PT0gXCJnZXRQYXJhbVwiKVxuICAgICAgICBhcmdzLnB1c2godGhpcy5pc0Jvb2xlYW4gPT09IFwiYm9vbGVhblwiID8gXCJiXCIgOiBcInJcIilcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV1cbiAgICAgICAgaWYgKGNoaWxkLmlzSW5wdXQgfHwgY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc1NjcmlwdCkge1xuICAgICAgICAgIGFyZ3MucHVzaChjaGlsZC50b0pTT04oKSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0b3IgPT09IFwiY2FsbFwiKSB7XG4gICAgICAgIHJldHVybiBbXCJjYWxsXCIsIHRoaXMuaW5mby5jYWxsXS5jb25jYXQoYXJncylcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzZWxlY3RvcikgdGhyb3cgXCJ1bmtub3duIGJsb2NrOiBcIiArIHRoaXMuaW5mby5oYXNoXG4gICAgcmV0dXJuIFtzZWxlY3Rvcl0uY29uY2F0KGFyZ3MpXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oZXh0cmFzKSB7XG4gICAgdmFyIGZpcnN0SW5wdXQgPSBudWxsXG4gICAgdmFyIGNoZWNrQWxpYXMgPSBmYWxzZVxuICAgIHZhciB0ZXh0ID0gdGhpcy5jaGlsZHJlblxuICAgICAgLm1hcChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICBpZiAoY2hpbGQuaXNJY29uKSBjaGVja0FsaWFzID0gdHJ1ZVxuICAgICAgICBpZiAoIWZpcnN0SW5wdXQgJiYgIShjaGlsZC5pc0xhYmVsIHx8IGNoaWxkLmlzSWNvbikpIGZpcnN0SW5wdXQgPSBjaGlsZFxuICAgICAgICByZXR1cm4gY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICA/IFwiXFxuXCIgKyBpbmRlbnQoY2hpbGQuc3RyaW5naWZ5KCkpICsgXCJcXG5cIlxuICAgICAgICAgIDogY2hpbGQuc3RyaW5naWZ5KCkudHJpbSgpICsgXCIgXCJcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlwiKVxuICAgICAgLnRyaW0oKVxuXG4gICAgdmFyIGxhbmcgPSB0aGlzLmluZm8ubGFuZ3VhZ2VcbiAgICBpZiAoY2hlY2tBbGlhcyAmJiBsYW5nICYmIHRoaXMuaW5mby5zZWxlY3Rvcikge1xuICAgICAgdmFyIHR5cGUgPSBibG9ja3NCeVNlbGVjdG9yW3RoaXMuaW5mby5zZWxlY3Rvcl1cbiAgICAgIHZhciBzcGVjID0gdHlwZS5zcGVjXG4gICAgICB2YXIgYWxpYXMgPSBsYW5nLm5hdGl2ZUFsaWFzZXNbdHlwZS5zcGVjXVxuICAgICAgaWYgKGFsaWFzKSB7XG4gICAgICAgIC8vIFRPRE8gbWFrZSB0cmFuc2xhdGUoKSBub3QgaW4tcGxhY2UsIGFuZCB1c2UgdGhhdFxuICAgICAgICBpZiAoaW5wdXRQYXQudGVzdChhbGlhcykgJiYgZmlyc3RJbnB1dCkge1xuICAgICAgICAgIGFsaWFzID0gYWxpYXMucmVwbGFjZShpbnB1dFBhdCwgZmlyc3RJbnB1dC5zdHJpbmdpZnkoKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxpYXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb3ZlcnJpZGVzID0gZXh0cmFzIHx8IFwiXCJcbiAgICBpZiAoXG4gICAgICAodGhpcy5pbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCIgJiYgdGhpcy5pc1JlcG9ydGVyKSB8fFxuICAgICAgKHRoaXMuaW5mby5jYXRlZ29yeSA9PT0gXCJjdXN0b20tYXJnXCIgJiZcbiAgICAgICAgKHRoaXMuaXNSZXBvcnRlciB8fCB0aGlzLmlzQm9vbGVhbikpIHx8XG4gICAgICAodGhpcy5pbmZvLmNhdGVnb3J5ID09PSBcImN1c3RvbVwiICYmIHRoaXMuaW5mby5zaGFwZSA9PT0gXCJzdGFja1wiKVxuICAgICkge1xuICAgICAgaWYgKG92ZXJyaWRlcykgb3ZlcnJpZGVzICs9IFwiIFwiXG4gICAgICBvdmVycmlkZXMgKz0gdGhpcy5pbmZvLmNhdGVnb3J5XG4gICAgfVxuICAgIGlmIChvdmVycmlkZXMpIHtcbiAgICAgIHRleHQgKz0gXCIgOjogXCIgKyBvdmVycmlkZXNcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaGFzU2NyaXB0XG4gICAgICA/IHRleHQgKyBcIlxcbmVuZFwiXG4gICAgICA6IHRoaXMuaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgICAgID8gXCIoXCIgKyB0ZXh0ICsgXCIpXCJcbiAgICAgICAgOiB0aGlzLmluZm8uc2hhcGUgPT09IFwiYm9vbGVhblwiID8gXCI8XCIgKyB0ZXh0ICsgXCI+XCIgOiB0ZXh0XG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24obGFuZywgaXNTaGFsbG93KSB7XG4gICAgdmFyIHNlbGVjdG9yID0gdGhpcy5pbmZvLnNlbGVjdG9yXG4gICAgaWYgKCFzZWxlY3RvcikgcmV0dXJuXG4gICAgaWYgKHNlbGVjdG9yID09PSBcInByb2NEZWZcIikge1xuICAgICAgYXNzZXJ0KHRoaXMuY2hpbGRyZW5bMF0uaXNMYWJlbClcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0gPSBuZXcgTGFiZWwobGFuZy5kZWZpbmVbMF0gfHwgZW5nbGlzaC5kZWZpbmVbMF0pXG4gICAgfVxuICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3JdXG4gICAgaWYgKCFibG9jaykgcmV0dXJuXG4gICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5nLmNvbW1hbmRzW2Jsb2NrLnNwZWNdXG4gICAgaWYgKCFuYXRpdmVTcGVjKSByZXR1cm5cbiAgICB2YXIgbmF0aXZlSW5mbyA9IHBhcnNlU3BlYyhuYXRpdmVTcGVjKVxuICAgIHZhciBhcmdzID0gdGhpcy5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbCAmJiAhY2hpbGQuaXNJY29uXG4gICAgfSlcbiAgICBpZiAoIWlzU2hhbGxvdylcbiAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICBjaGlsZC50cmFuc2xhdGUobGFuZylcbiAgICAgIH0pXG4gICAgdGhpcy5jaGlsZHJlbiA9IG5hdGl2ZUluZm8ucGFydHNcbiAgICAgIC5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgICB2YXIgcGFydCA9IHBhcnQudHJpbSgpXG4gICAgICAgIGlmICghcGFydCkgcmV0dXJuXG4gICAgICAgIHJldHVybiBpbnB1dFBhdC50ZXN0KHBhcnQpXG4gICAgICAgICAgPyBhcmdzLnNoaWZ0KClcbiAgICAgICAgICA6IGljb25QYXQudGVzdChwYXJ0KSA/IG5ldyBJY29uKHBhcnQuc2xpY2UoMSkpIDogbmV3IExhYmVsKHBhcnQpXG4gICAgICB9KVxuICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICBhcmdzLmZvckVhY2goXG4gICAgICBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGFyZylcbiAgICAgIH0uYmluZCh0aGlzKVxuICAgIClcbiAgICB0aGlzLmluZm8ubGFuZ3VhZ2UgPSBsYW5nXG4gICAgdGhpcy5pbmZvLmlzUlRMID0gcnRsTGFuZ3VhZ2VzLmluZGV4T2YobGFuZy5jb2RlKSA+IC0xXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXVxuICAgICAgaWYgKGNoaWxkLm1lYXN1cmUpIGNoaWxkLm1lYXN1cmUoKVxuICAgIH1cbiAgICBpZiAodGhpcy5jb21tZW50KSB0aGlzLmNvbW1lbnQubWVhc3VyZSgpXG4gIH1cblxuICBCbG9jay5zaGFwZXMgPSB7XG4gICAgc3RhY2s6IFNWRy5zdGFja1JlY3QsXG4gICAgXCJjLWJsb2NrXCI6IFNWRy5zdGFja1JlY3QsXG4gICAgXCJpZi1ibG9ja1wiOiBTVkcuc3RhY2tSZWN0LFxuICAgIGNlbHNlOiBTVkcuc3RhY2tSZWN0LFxuICAgIGNlbmQ6IFNWRy5zdGFja1JlY3QsXG5cbiAgICBjYXA6IFNWRy5jYXBSZWN0LFxuICAgIHJlcG9ydGVyOiBTVkcucm91bmRlZFJlY3QsXG4gICAgYm9vbGVhbjogU1ZHLnBvaW50ZWRSZWN0LFxuICAgIGhhdDogU1ZHLmhhdFJlY3QsXG4gICAgXCJkZWZpbmUtaGF0XCI6IFNWRy5wcm9jSGF0UmVjdCxcbiAgICByaW5nOiBTVkcucm91bmRlZFJlY3QsXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbih3LCBoLCBsaW5lcykge1xuICAgIC8vIG1vdXRoc1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gU1ZHLm1vdXRoUmVjdCh3LCBoLCB0aGlzLmlzRmluYWwsIGxpbmVzLCB7XG4gICAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gb3V0bGluZXNcbiAgICBpZiAodGhpcy5pbmZvLnNoYXBlID09PSBcIm91dGxpbmVcIikge1xuICAgICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhTVkcuc3RhY2tSZWN0KHcsIGgpLCB7XG4gICAgICAgIGNsYXNzOiBcInNiLW91dGxpbmVcIixcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gcmluZ3NcbiAgICBpZiAodGhpcy5pc1JpbmcpIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5bMF1cbiAgICAgIGlmIChjaGlsZCAmJiAoY2hpbGQuaXNJbnB1dCB8fCBjaGlsZC5pc0Jsb2NrIHx8IGNoaWxkLmlzU2NyaXB0KSkge1xuICAgICAgICB2YXIgc2hhcGUgPSBjaGlsZC5pc1NjcmlwdFxuICAgICAgICAgID8gXCJzdGFja1wiXG4gICAgICAgICAgOiBjaGlsZC5pc0lucHV0ID8gY2hpbGQuc2hhcGUgOiBjaGlsZC5pbmZvLnNoYXBlXG4gICAgICAgIHJldHVybiBTVkcucmluZ1JlY3QodywgaCwgY2hpbGQueSwgY2hpbGQud2lkdGgsIGNoaWxkLmhlaWdodCwgc2hhcGUsIHtcbiAgICAgICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZ1bmMgPSBCbG9jay5zaGFwZXNbdGhpcy5pbmZvLnNoYXBlXVxuICAgIGFzc2VydChmdW5jLCBcIm5vIHNoYXBlIGZ1bmM6IFwiICsgdGhpcy5pbmZvLnNoYXBlKVxuICAgIHJldHVybiBmdW5jKHcsIGgsIHtcbiAgICAgIGNsYXNzOiBbXCJzYi1cIiArIHRoaXMuaW5mby5jYXRlZ29yeSwgXCJzYi1iZXZlbFwiXS5qb2luKFwiIFwiKSxcbiAgICB9KVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLm1pbkRpc3RhbmNlID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBpZiAodGhpcy5pc0Jvb2xlYW4pIHtcbiAgICAgIHJldHVybiBjaGlsZC5pc1JlcG9ydGVyXG4gICAgICAgID8gKDQgKyBjaGlsZC5oZWlnaHQgLyA0KSB8IDBcbiAgICAgICAgOiBjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgPyAoNSArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgICAgICAgIDogY2hpbGQuaXNCb29sZWFuIHx8IGNoaWxkLnNoYXBlID09PSBcImJvb2xlYW5cIlxuICAgICAgICAgICAgPyA1XG4gICAgICAgICAgICA6ICgyICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgfVxuICAgIGlmICh0aGlzLmlzUmVwb3J0ZXIpIHtcbiAgICAgIHJldHVybiAoY2hpbGQuaXNJbnB1dCAmJiBjaGlsZC5pc1JvdW5kKSB8fFxuICAgICAgICAoKGNoaWxkLmlzUmVwb3J0ZXIgfHwgY2hpbGQuaXNCb29sZWFuKSAmJiAhY2hpbGQuaGFzU2NyaXB0KVxuICAgICAgICA/IDBcbiAgICAgICAgOiBjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgPyAoMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgICAgICAgIDogKC0yICsgY2hpbGQuaGVpZ2h0IC8gMikgfCAwXG4gICAgfVxuICAgIHJldHVybiAwXG4gIH1cblxuICBCbG9jay5wYWRkaW5nID0ge1xuICAgIGhhdDogWzIwLCA2LCA4XSxcbiAgICBcImRlZmluZS1oYXRcIjogWzIwLCA4LCAxMF0sXG4gICAgcmVwb3J0ZXI6IFs1LCAzLCAyXSxcbiAgICBib29sZWFuOiBbNSwgMiwgMl0sXG4gICAgY2FwOiBbMTEsIDYsIDZdLFxuICAgIFwiYy1ibG9ja1wiOiBbOCwgNiwgNV0sXG4gICAgXCJpZi1ibG9ja1wiOiBbOCwgNiwgNV0sXG4gICAgcmluZzogWzEwLCA0LCAxMF0sXG4gICAgbnVsbDogWzExLCA2LCA2XSxcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzRGVmaW5lID0gdGhpcy5pbmZvLnNoYXBlID09PSBcImRlZmluZS1oYXRcIlxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW5cblxuICAgIHZhciBwYWRkaW5nID0gQmxvY2sucGFkZGluZ1t0aGlzLmluZm8uc2hhcGVdIHx8IEJsb2NrLnBhZGRpbmdbbnVsbF1cbiAgICB2YXIgcHQgPSBwYWRkaW5nWzBdLFxuICAgICAgcHggPSBwYWRkaW5nWzFdLFxuICAgICAgcGIgPSBwYWRkaW5nWzJdXG5cbiAgICB2YXIgeSA9IDBcbiAgICB2YXIgTGluZSA9IGZ1bmN0aW9uKHkpIHtcbiAgICAgIHRoaXMueSA9IHlcbiAgICAgIHRoaXMud2lkdGggPSAwXG4gICAgICB0aGlzLmhlaWdodCA9IHkgPyAxMyA6IDE2XG4gICAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB9XG5cbiAgICB2YXIgaW5uZXJXaWR0aCA9IDBcbiAgICB2YXIgc2NyaXB0V2lkdGggPSAwXG4gICAgdmFyIGxpbmUgPSBuZXcgTGluZSh5KVxuICAgIGZ1bmN0aW9uIHB1c2hMaW5lKGlzTGFzdCkge1xuICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsaW5lLmhlaWdodCArPSBwdCArIHBiXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaW5lLmhlaWdodCArPSBpc0xhc3QgPyAwIDogKzJcbiAgICAgICAgbGluZS55IC09IDFcbiAgICAgIH1cbiAgICAgIHkgKz0gbGluZS5oZWlnaHRcbiAgICAgIGxpbmVzLnB1c2gobGluZSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmZvLmlzUlRMKSB7XG4gICAgICB2YXIgc3RhcnQgPSAwXG4gICAgICB2YXIgZmxpcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgICAgICAgLnNsaWNlKDAsIHN0YXJ0KVxuICAgICAgICAgIC5jb25jYXQoY2hpbGRyZW4uc2xpY2Uoc3RhcnQsIGkpLnJldmVyc2UoKSlcbiAgICAgICAgICAuY29uY2F0KGNoaWxkcmVuLnNsaWNlKGkpKVxuICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjaGlsZHJlbltpXS5pc1NjcmlwdCkge1xuICAgICAgICAgIGZsaXAoKVxuICAgICAgICAgIHN0YXJ0ID0gaSArIDFcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHN0YXJ0IDwgaSkge1xuICAgICAgICBmbGlwKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGluZXMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICBjaGlsZC5lbCA9IGNoaWxkLmRyYXcodGhpcylcblxuICAgICAgaWYgKGNoaWxkLmlzU2NyaXB0ICYmIHRoaXMuaXNDb21tYW5kKSB7XG4gICAgICAgIHRoaXMuaGFzU2NyaXB0ID0gdHJ1ZVxuICAgICAgICBwdXNoTGluZSgpXG4gICAgICAgIGNoaWxkLnkgPSB5XG4gICAgICAgIGxpbmVzLnB1c2goY2hpbGQpXG4gICAgICAgIHNjcmlwdFdpZHRoID0gTWF0aC5tYXgoc2NyaXB0V2lkdGgsIE1hdGgubWF4KDEsIGNoaWxkLndpZHRoKSlcbiAgICAgICAgY2hpbGQuaGVpZ2h0ID0gTWF0aC5tYXgoMTIsIGNoaWxkLmhlaWdodCkgKyAzXG4gICAgICAgIHkgKz0gY2hpbGQuaGVpZ2h0XG4gICAgICAgIGxpbmUgPSBuZXcgTGluZSh5KVxuICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0Fycm93KSB7XG4gICAgICAgIGxpbmUuY2hpbGRyZW4ucHVzaChjaGlsZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjbXcgPSBpID4gMCA/IDMwIDogMCAvLyAyN1xuICAgICAgICB2YXIgbWQgPSB0aGlzLmlzQ29tbWFuZCA/IDAgOiB0aGlzLm1pbkRpc3RhbmNlKGNoaWxkKVxuICAgICAgICB2YXIgbXcgPSB0aGlzLmlzQ29tbWFuZFxuICAgICAgICAgID8gY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc0lucHV0ID8gY213IDogMFxuICAgICAgICAgIDogbWRcbiAgICAgICAgaWYgKG13ICYmICFsaW5lcy5sZW5ndGggJiYgbGluZS53aWR0aCA8IG13IC0gcHgpIHtcbiAgICAgICAgICBsaW5lLndpZHRoID0gbXcgLSBweFxuICAgICAgICB9XG4gICAgICAgIGNoaWxkLnggPSBsaW5lLndpZHRoXG4gICAgICAgIGxpbmUud2lkdGggKz0gY2hpbGQud2lkdGhcbiAgICAgICAgaW5uZXJXaWR0aCA9IE1hdGgubWF4KGlubmVyV2lkdGgsIGxpbmUud2lkdGggKyBNYXRoLm1heCgwLCBtZCAtIHB4KSlcbiAgICAgICAgbGluZS53aWR0aCArPSA0XG4gICAgICAgIGlmICghY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICAgIGxpbmUuaGVpZ2h0ID0gTWF0aC5tYXgobGluZS5oZWlnaHQsIGNoaWxkLmhlaWdodClcbiAgICAgICAgfVxuICAgICAgICBsaW5lLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICB9XG4gICAgfVxuICAgIHB1c2hMaW5lKHRydWUpXG5cbiAgICBpbm5lcldpZHRoID0gTWF0aC5tYXgoXG4gICAgICBpbm5lcldpZHRoICsgcHggKiAyLFxuICAgICAgdGhpcy5pc0hhdCB8fCB0aGlzLmhhc1NjcmlwdFxuICAgICAgICA/IDgzXG4gICAgICAgIDogdGhpcy5pc0NvbW1hbmQgfHwgdGhpcy5pc091dGxpbmUgfHwgdGhpcy5pc1JpbmcgPyAzOSA6IDIwXG4gICAgKVxuICAgIHRoaXMuaGVpZ2h0ID0geVxuICAgIHRoaXMud2lkdGggPSBzY3JpcHRXaWR0aFxuICAgICAgPyBNYXRoLm1heChpbm5lcldpZHRoLCAxNSArIHNjcmlwdFdpZHRoKVxuICAgICAgOiBpbm5lcldpZHRoXG4gICAgaWYgKGlzRGVmaW5lKSB7XG4gICAgICB2YXIgcCA9IE1hdGgubWluKDI2LCAoMy41ICsgMC4xMyAqIGlubmVyV2lkdGgpIHwgMCkgLSAxOFxuICAgICAgdGhpcy5oZWlnaHQgKz0gcFxuICAgICAgcHQgKz0gMiAqIHBcbiAgICB9XG4gICAgdGhpcy5maXJzdExpbmUgPSBsaW5lc1swXVxuICAgIHRoaXMuaW5uZXJXaWR0aCA9IGlubmVyV2lkdGhcblxuICAgIHZhciBvYmplY3RzID0gW11cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaW5lID0gbGluZXNbaV1cbiAgICAgIGlmIChsaW5lLmlzU2NyaXB0KSB7XG4gICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZSgxNSwgbGluZS55LCBsaW5lLmVsKSlcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIGggPSBsaW5lLmhlaWdodFxuXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gbGluZS5jaGlsZHJlbltqXVxuICAgICAgICBpZiAoY2hpbGQuaXNBcnJvdykge1xuICAgICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShpbm5lcldpZHRoIC0gMTUsIHRoaXMuaGVpZ2h0IC0gMywgY2hpbGQuZWwpKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeSA9IHB0ICsgKGggLSBjaGlsZC5oZWlnaHQgLSBwdCAtIHBiKSAvIDIgLSAxXG4gICAgICAgIGlmIChpc0RlZmluZSAmJiBjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgeSArPSAzXG4gICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNJY29uKSB7XG4gICAgICAgICAgeSArPSBjaGlsZC5keSB8IDBcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc1JpbmcpIHtcbiAgICAgICAgICBjaGlsZC55ID0gKGxpbmUueSArIHkpIHwgMFxuICAgICAgICAgIGlmIChjaGlsZC5pc0luc2V0KSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUocHggKyBjaGlsZC54LCAobGluZS55ICsgeSkgfCAwLCBjaGlsZC5lbCkpXG5cbiAgICAgICAgaWYgKGNoaWxkLmRpZmYgPT09IFwiK1wiKSB7XG4gICAgICAgICAgdmFyIGVsbGlwc2UgPSBTVkcuaW5zRWxsaXBzZShjaGlsZC53aWR0aCwgY2hpbGQuaGVpZ2h0KVxuICAgICAgICAgIG9iamVjdHMucHVzaChTVkcubW92ZShweCArIGNoaWxkLngsIChsaW5lLnkgKyB5KSB8IDAsIGVsbGlwc2UpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGVsID0gdGhpcy5kcmF3U2VsZihpbm5lcldpZHRoLCB0aGlzLmhlaWdodCwgbGluZXMpXG4gICAgb2JqZWN0cy5zcGxpY2UoMCwgMCwgZWwpXG4gICAgaWYgKHRoaXMuaW5mby5jb2xvcikge1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGZpbGw6IHRoaXMuaW5mby5jb2xvcixcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIFNWRy5ncm91cChvYmplY3RzKVxuICB9XG5cbiAgLyogQ29tbWVudCAqL1xuXG4gIHZhciBDb21tZW50ID0gZnVuY3Rpb24odmFsdWUsIGhhc0Jsb2NrKSB7XG4gICAgdGhpcy5sYWJlbCA9IG5ldyBMYWJlbCh2YWx1ZSwgW1wic2ItY29tbWVudC1sYWJlbFwiXSlcbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGFzQmxvY2sgPSBoYXNCbG9ja1xuICB9XG4gIENvbW1lbnQucHJvdG90eXBlLmlzQ29tbWVudCA9IHRydWVcbiAgQ29tbWVudC5saW5lTGVuZ3RoID0gMTJcbiAgQ29tbWVudC5wcm90b3R5cGUuaGVpZ2h0ID0gMjBcblxuICBDb21tZW50LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIvLyBcIiArIHRoaXMubGFiZWwudmFsdWVcbiAgfVxuXG4gIENvbW1lbnQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxhYmVsLm1lYXN1cmUoKVxuICB9XG5cbiAgQ29tbWVudC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYWJlbEVsID0gdGhpcy5sYWJlbC5kcmF3KClcblxuICAgIHRoaXMud2lkdGggPSB0aGlzLmxhYmVsLndpZHRoICsgMTZcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtcbiAgICAgIFNWRy5jb21tZW50TGluZSh0aGlzLmhhc0Jsb2NrID8gQ29tbWVudC5saW5lTGVuZ3RoIDogMCwgNiksXG4gICAgICBTVkcuY29tbWVudFJlY3QodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtcbiAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudFwiLFxuICAgICAgfSksXG4gICAgICBTVkcubW92ZSg4LCA0LCBsYWJlbEVsKSxcbiAgICBdKVxuICB9XG5cbiAgLyogR2xvdyAqL1xuXG4gIHZhciBHbG93ID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBhc3NlcnQoY2hpbGQpXG4gICAgdGhpcy5jaGlsZCA9IGNoaWxkXG4gICAgaWYgKGNoaWxkLmlzQmxvY2spIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBjaGlsZC5pbmZvLnNoYXBlXG4gICAgICB0aGlzLmluZm8gPSBjaGlsZC5pbmZvXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBcInN0YWNrXCJcbiAgICB9XG5cbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMueSA9IDBcbiAgfVxuICBHbG93LnByb3RvdHlwZS5pc0dsb3cgPSB0cnVlXG5cbiAgR2xvdy5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY2hpbGQuaXNCbG9jaykge1xuICAgICAgcmV0dXJuIHRoaXMuY2hpbGQuc3RyaW5naWZ5KFwiK1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGluZXMgPSB0aGlzLmNoaWxkLnN0cmluZ2lmeSgpLnNwbGl0KFwiXFxuXCIpXG4gICAgICByZXR1cm4gbGluZXMubWFwKGxpbmUgPT4gXCIrIFwiICsgbGluZSkuam9pbihcIlxcblwiKVxuICAgIH1cbiAgfVxuXG4gIEdsb3cucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLmNoaWxkLnRyYW5zbGF0ZShsYW5nKVxuICB9XG5cbiAgR2xvdy5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hpbGQubWVhc3VyZSgpXG4gIH1cblxuICBHbG93LnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjID0gdGhpcy5jaGlsZFxuICAgIHZhciBlbFxuICAgIHZhciB3ID0gdGhpcy53aWR0aFxuICAgIHZhciBoID0gdGhpcy5oZWlnaHQgLSAxXG4gICAgaWYgKGMuaXNTY3JpcHQpIHtcbiAgICAgIGlmICghYy5pc0VtcHR5ICYmIGMuYmxvY2tzWzBdLmlzSGF0KSB7XG4gICAgICAgIGVsID0gU1ZHLmhhdFJlY3QodywgaClcbiAgICAgIH0gZWxzZSBpZiAoYy5pc0ZpbmFsKSB7XG4gICAgICAgIGVsID0gU1ZHLmNhcFJlY3QodywgaClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsID0gU1ZHLnN0YWNrUmVjdCh3LCBoKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZWwgPSBjLmRyYXdTZWxmKHcsIGgsIFtdKVxuICAgIH1cbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICBjbGFzczogXCJzYi1kaWZmIHNiLWRpZmYtaW5zXCIsXG4gICAgfSlcbiAgfVxuICAvLyBUT0RPIGhvdyBjYW4gd2UgYWx3YXlzIHJhaXNlIEdsb3dzIGFib3ZlIHRoZWlyIHBhcmVudHM/XG5cbiAgR2xvdy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjID0gdGhpcy5jaGlsZFxuICAgIHZhciBlbCA9IGMuaXNTY3JpcHQgPyBjLmRyYXcodHJ1ZSkgOiBjLmRyYXcoKVxuXG4gICAgdGhpcy53aWR0aCA9IGMud2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IChjLmlzQmxvY2sgJiYgYy5maXJzdExpbmUuaGVpZ2h0KSB8fCBjLmhlaWdodFxuXG4gICAgLy8gZW5jaXJjbGVcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtlbCwgdGhpcy5kcmF3U2VsZigpXSlcbiAgfVxuXG4gIC8qIFNjcmlwdCAqL1xuXG4gIHZhciBTY3JpcHQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgICB0aGlzLmJsb2NrcyA9IGJsb2Nrc1xuICAgIHRoaXMuaXNFbXB0eSA9ICFibG9ja3MubGVuZ3RoXG4gICAgdGhpcy5pc0ZpbmFsID0gIXRoaXMuaXNFbXB0eSAmJiBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmlzRmluYWxcbiAgICB0aGlzLnkgPSAwXG4gIH1cbiAgU2NyaXB0LnByb3RvdHlwZS5pc1NjcmlwdCA9IHRydWVcblxuICBTY3JpcHQuZnJvbUpTT04gPSBmdW5jdGlvbihsYW5nLCBibG9ja3MpIHtcbiAgICAvLyB4ID0gYXJyYXlbMF0sIHkgPSBhcnJheVsxXTtcbiAgICByZXR1cm4gbmV3IFNjcmlwdChibG9ja3MubWFwKEJsb2NrLmZyb21KU09OLmJpbmQobnVsbCwgbGFuZykpKVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5ibG9ja3NbMF0gJiYgdGhpcy5ibG9ja3NbMF0uaXNDb21tZW50KSByZXR1cm5cbiAgICByZXR1cm4gdGhpcy5ibG9ja3MubWFwKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICByZXR1cm4gYmxvY2sudG9KU09OKClcbiAgICB9KVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5ibG9ja3NcbiAgICAgIC5tYXAoZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgdmFyIGxpbmUgPSBibG9jay5zdHJpbmdpZnkoKVxuICAgICAgICBpZiAoYmxvY2suY29tbWVudCkgbGluZSArPSBcIiBcIiArIGJsb2NrLmNvbW1lbnQuc3RyaW5naWZ5KClcbiAgICAgICAgcmV0dXJuIGxpbmVcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblwiKVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgdGhpcy5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgYmxvY2sudHJhbnNsYXRlKGxhbmcpXG4gICAgfSlcbiAgfVxuXG4gIFNjcmlwdC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ibG9ja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYmxvY2tzW2ldLm1lYXN1cmUoKVxuICAgIH1cbiAgfVxuXG4gIFNjcmlwdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGluc2lkZSkge1xuICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgdmFyIHkgPSAwXG4gICAgdGhpcy53aWR0aCA9IDBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYmxvY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpXVxuICAgICAgdmFyIHggPSBpbnNpZGUgPyAwIDogMlxuICAgICAgdmFyIGNoaWxkID0gYmxvY2suZHJhdygpXG4gICAgICBjaGlsZHJlbi5wdXNoKFNWRy5tb3ZlKHgsIHksIGNoaWxkKSlcbiAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBibG9jay53aWR0aClcblxuICAgICAgdmFyIGRpZmYgPSBibG9jay5kaWZmXG4gICAgICBpZiAoZGlmZiA9PT0gXCItXCIpIHtcbiAgICAgICAgdmFyIGR3ID0gYmxvY2sud2lkdGhcbiAgICAgICAgdmFyIGRoID0gYmxvY2suZmlyc3RMaW5lLmhlaWdodCB8fCBibG9jay5oZWlnaHRcbiAgICAgICAgY2hpbGRyZW4ucHVzaChTVkcubW92ZSh4LCB5ICsgZGggLyAyICsgMSwgU1ZHLnN0cmlrZXRocm91Z2hMaW5lKGR3KSkpXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBibG9jay53aWR0aClcbiAgICAgIH1cblxuICAgICAgeSArPSBibG9jay5oZWlnaHRcblxuICAgICAgdmFyIGNvbW1lbnQgPSBibG9jay5jb21tZW50XG4gICAgICBpZiAoY29tbWVudCkge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLmZpcnN0TGluZVxuICAgICAgICB2YXIgY3ggPSBibG9jay5pbm5lcldpZHRoICsgMiArIENvbW1lbnQubGluZUxlbmd0aFxuICAgICAgICB2YXIgY3kgPSB5IC0gYmxvY2suaGVpZ2h0ICsgbGluZS5oZWlnaHQgLyAyXG4gICAgICAgIHZhciBlbCA9IGNvbW1lbnQuZHJhdygpXG4gICAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoY3gsIGN5IC0gY29tbWVudC5oZWlnaHQgLyAyLCBlbCkpXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBjeCArIGNvbW1lbnQud2lkdGgpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaGVpZ2h0ID0geVxuICAgIGlmICghaW5zaWRlICYmICF0aGlzLmlzRmluYWwpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDNcbiAgICB9XG4gICAgaWYgKCFpbnNpZGUgJiYgYmxvY2suaXNHbG93KSB7XG4gICAgICB0aGlzLmhlaWdodCArPSAyIC8vIFRPRE8gdW5icmVhayB0aGlzXG4gICAgfVxuICAgIHJldHVybiBTVkcuZ3JvdXAoY2hpbGRyZW4pXG4gIH1cblxuICAvKiBEb2N1bWVudCAqL1xuXG4gIHZhciBEb2N1bWVudCA9IGZ1bmN0aW9uKHNjcmlwdHMpIHtcbiAgICB0aGlzLnNjcmlwdHMgPSBzY3JpcHRzXG5cbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMuZWwgPSBudWxsXG4gICAgdGhpcy5kZWZzID0gbnVsbFxuICB9XG5cbiAgRG9jdW1lbnQuZnJvbUpTT04gPSBmdW5jdGlvbihzY3JpcHRhYmxlLCBsYW5nKSB7XG4gICAgdmFyIGxhbmcgPSBsYW5nIHx8IGVuZ2xpc2hcbiAgICB2YXIgc2NyaXB0cyA9IHNjcmlwdGFibGUuc2NyaXB0cy5tYXAoZnVuY3Rpb24oYXJyYXkpIHtcbiAgICAgIHZhciBzY3JpcHQgPSBTY3JpcHQuZnJvbUpTT04obGFuZywgYXJyYXlbMl0pXG4gICAgICBzY3JpcHQueCA9IGFycmF5WzBdXG4gICAgICBzY3JpcHQueSA9IGFycmF5WzFdXG4gICAgICByZXR1cm4gc2NyaXB0XG4gICAgfSlcbiAgICAvLyBUT0RPIHNjcmlwdGFibGUuc2NyaXB0Q29tbWVudHNcbiAgICByZXR1cm4gbmV3IERvY3VtZW50KHNjcmlwdHMpXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGpzb25TY3JpcHRzID0gdGhpcy5zY3JpcHRzXG4gICAgICAubWFwKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgICB2YXIganNvbkJsb2NrcyA9IHNjcmlwdC50b0pTT04oKVxuICAgICAgICBpZiAoIWpzb25CbG9ja3MpIHJldHVyblxuICAgICAgICByZXR1cm4gWzEwLCBzY3JpcHQueSArIDEwLCBqc29uQmxvY2tzXVxuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgcmV0dXJuIHtcbiAgICAgIHNjcmlwdHM6IGpzb25TY3JpcHRzLFxuICAgICAgLy8gc2NyaXB0Q29tbWVudHM6IFtdLCAvLyBUT0RPXG4gICAgfVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNjcmlwdHNcbiAgICAgIC5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBzY3JpcHQuc3RyaW5naWZ5KClcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblxcblwiKVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLnNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHNjcmlwdC50cmFuc2xhdGUobGFuZylcbiAgICB9KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHNjcmlwdC5tZWFzdXJlKClcbiAgICB9KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgLy8gbWVhc3VyZSBzdHJpbmdzXG4gICAgdGhpcy5tZWFzdXJlKClcblxuICAgIC8vIFRPRE86IHNlcGFyYXRlIGxheW91dCArIHJlbmRlciBzdGVwcy5cbiAgICAvLyByZW5kZXIgZWFjaCBzY3JpcHRcbiAgICB2YXIgd2lkdGggPSAwXG4gICAgdmFyIGhlaWdodCA9IDBcbiAgICB2YXIgZWxlbWVudHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc2NyaXB0ID0gdGhpcy5zY3JpcHRzW2ldXG4gICAgICBpZiAoaGVpZ2h0KSBoZWlnaHQgKz0gMTBcbiAgICAgIHNjcmlwdC55ID0gaGVpZ2h0XG4gICAgICBlbGVtZW50cy5wdXNoKFNWRy5tb3ZlKDAsIGhlaWdodCwgc2NyaXB0LmRyYXcoKSkpXG4gICAgICBoZWlnaHQgKz0gc2NyaXB0LmhlaWdodFxuICAgICAgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgc2NyaXB0LndpZHRoICsgNClcbiAgICB9XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcblxuICAgIC8vIHJldHVybiBTVkdcbiAgICB2YXIgc3ZnID0gU1ZHLm5ld1NWRyh3aWR0aCwgaGVpZ2h0KVxuICAgIHN2Zy5hcHBlbmRDaGlsZChcbiAgICAgICh0aGlzLmRlZnMgPSBTVkcud2l0aENoaWxkcmVuKFxuICAgICAgICBTVkcuZWwoXCJkZWZzXCIpLFxuICAgICAgICBbXG4gICAgICAgICAgYmV2ZWxGaWx0ZXIoXCJiZXZlbEZpbHRlclwiLCBmYWxzZSksXG4gICAgICAgICAgYmV2ZWxGaWx0ZXIoXCJpbnB1dEJldmVsRmlsdGVyXCIsIHRydWUpLFxuICAgICAgICAgIGRhcmtGaWx0ZXIoXCJpbnB1dERhcmtGaWx0ZXJcIiksXG4gICAgICAgICAgZGVzYXR1cmF0ZUZpbHRlcihcImRlc2F0dXJhdGVGaWx0ZXJcIiksXG4gICAgICAgIF0uY29uY2F0KG1ha2VJY29ucygpKVxuICAgICAgKSlcbiAgICApXG5cbiAgICBzdmcuYXBwZW5kQ2hpbGQoU1ZHLmdyb3VwKGVsZW1lbnRzKSlcbiAgICB0aGlzLmVsID0gc3ZnXG5cbiAgICAvLyBuYjogYXN5bmMgQVBJIG9ubHkgZm9yIGJhY2t3YXJkcy9mb3J3YXJkcyBjb21wYXRpYmlsaXR5IHJlYXNvbnMuXG4gICAgLy8gZGVzcGl0ZSBhcHBlYXJhbmNlcywgaXQgcnVucyBzeW5jaHJvbm91c2x5XG4gICAgY2Ioc3ZnKVxuICB9XG5cbiAgLyogRXhwb3J0IFNWRyBpbWFnZSBhcyBYTUwgc3RyaW5nICovXG4gIERvY3VtZW50LnByb3RvdHlwZS5leHBvcnRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBhc3NlcnQodGhpcy5lbCwgXCJjYWxsIGRyYXcoKSBmaXJzdFwiKVxuXG4gICAgdmFyIHN0eWxlID0gbWFrZVN0eWxlKClcbiAgICB0aGlzLmRlZnMuYXBwZW5kQ2hpbGQoc3R5bGUpXG4gICAgdmFyIHhtbCA9IG5ldyBTVkcuWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMuZWwpXG4gICAgdGhpcy5kZWZzLnJlbW92ZUNoaWxkKHN0eWxlKVxuICAgIHJldHVybiB4bWxcbiAgfVxuXG4gIC8qIEV4cG9ydCBTVkcgaW1hZ2UgYXMgZGF0YSBVUkkgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWRyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB4bWwgPSB0aGlzLmV4cG9ydFNWR1N0cmluZygpXG4gICAgcmV0dXJuIFwiZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIgKyB4bWwucmVwbGFjZSgvWyNdL2csIGVuY29kZVVSSUNvbXBvbmVudClcbiAgfVxuXG4gIERvY3VtZW50LnByb3RvdHlwZS5leHBvcnRQTkcgPSBmdW5jdGlvbihjYikge1xuICAgIHZhciBjYW52YXMgPSBTVkcubWFrZUNhbnZhcygpXG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53aWR0aFxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodFxuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKClcbiAgICBpbWFnZS5zcmMgPSB0aGlzLmV4cG9ydFNWRygpXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMClcblxuICAgICAgaWYgKFVSTCAmJiBVUkwuY3JlYXRlT2JqZWN0VVJMICYmIEJsb2IgJiYgY2FudmFzLnRvQmxvYikge1xuICAgICAgICB2YXIgYmxvYiA9IGNhbnZhcy50b0Jsb2IoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICAgIGNiKFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpXG4gICAgICAgIH0sIFwiaW1hZ2UvcG5nXCIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYihjYW52YXMudG9EYXRhVVJMKFwiaW1hZ2UvcG5nXCIpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIEdsb3csXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9XG59KSgpXG4iLCJ2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxudmFyIEZpbHRlciA9IHJlcXVpcmUoXCIuL2ZpbHRlci5qc1wiKVxuXG52YXIgU3R5bGUgPSAobW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNzc0NvbnRlbnQ6IGBcbiAgICAuc2ItbGFiZWwge1xuICAgICAgZm9udC1mYW1pbHk6IFwiSGVsdmV0aWNhIE5ldWVcIiwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmO1xuICAgICAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICB3b3JkLXNwYWNpbmc6ICsxcHg7XG4gICAgICBvcGFjaXR5OiAwLjk7XG4gICAgfVxuXG4gICAgLnNiLW9ic29sZXRlIHsgZmlsbDogI2Q0MjgyODsgfVxuICAgIC5zYi1tb3Rpb24geyBmaWxsOiAjNEM5N0ZGOyB9XG4gICAgLnNiLWxvb2tzIHsgZmlsbDogIzk5NjZGRjsgfVxuICAgIC5zYi1zb3VuZCB7IGZpbGw6ICNDRjYzQ0Y7IH1cbiAgICAuc2ItcGVuIHsgZmlsbDogIzBmQkQ4QzsgIH1cbiAgICAuc2ItZXZlbnRzIHsgZmlsbDogI0ZGQkYwMDsgfVxuICAgIC5zYi1jb250cm9sIHsgZmlsbDogI0ZGQUIxOTsgfVxuICAgIC5zYi1zZW5zaW5nIHsgZmlsbDogIzVDQjFENjsgfVxuICAgIC5zYi1vcGVyYXRvcnMgeyBmaWxsOiAjNTlDMDU5OyB9XG4gICAgLnNiLXZhcmlhYmxlcyB7IGZpbGw6ICNGRjhDMUE7IH1cbiAgICAuc2ItbGlzdCB7IGZpbGw6ICNGRjY2MUEgfVxuICAgIC5zYi1jdXN0b20geyBmaWxsOiAjRkY2NjgwOyB9XG4gICAgLnNiLWN1c3RvbS1hcmcgeyBmaWxsOiAjRkY2NjgwOyB9XG4gICAgLnNiLWV4dGVuc2lvbiB7IGZpbGw6ICM0YjRhNjA7IH1cbiAgICAuc2ItZ3JleSB7IGZpbGw6ICM5Njk2OTY7IH1cblxuICAgIC5zYi1iZXZlbCB7XG4gICAgICBmaWx0ZXIyOiB1cmwoI2JldmVsRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE1O1xuICAgICAgc3Ryb2tlLWFsaWdubWVudDogaW5uZXI7XG4gICAgfVxuXG4gICAgLnNiLWlucHV0IHtcbiAgICAgIGZpbHRlcjI6IHVybCgjaW5wdXRCZXZlbEZpbHRlcik7XG4gICAgfVxuICAgIC5zYi1pbnB1dC1udW1iZXIsXG4gICAgLnNiLWlucHV0LXN0cmluZyxcbiAgICAuc2ItaW5wdXQtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duLFxuICAgIC5zYi1saXRlcmFsLWRyb3Bkb3duIHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICBmb250LXNpemU6IDlweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMDtcbiAgICB9XG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLFxuICAgIC5zYi1saXRlcmFsLXN0cmluZyxcbiAgICAuc2ItbGl0ZXJhbC1udW1iZXItZHJvcGRvd24ge1xuICAgICAgZmlsbDogIzAwMDtcbiAgICB9XG5cbiAgICAuc2ItZGFya2VyIHtcbiAgICAgIGZpbHRlcjI6IHVybCgjaW5wdXREYXJrRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgICBzdHJva2UtYWxpZ25tZW50OiBpbm5lcjtcbiAgICB9XG4gICAgLnNiLWRlc2F0dXJhdGUge1xuICAgICAgZmlsdGVyOiB1cmwoI2Rlc2F0dXJhdGVGaWx0ZXIpO1xuICAgIH1cblxuICAgIC5zYi1vdXRsaW5lIHtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgICBmaWxsOiAjRkY0RDZBO1xuICAgIH1cblxuICAgIC5zYi1kZWZpbmUtaGF0LWNhcCB7XG4gICAgICBzdHJva2U6ICM2MzJkOTk7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgICBmaWxsOiAjOGUyZWMyO1xuICAgIH1cblxuICAgIC5zYi1jb21tZW50IHtcbiAgICAgIGZpbGw6ICNmZmZmYTU7XG4gICAgICBzdHJva2U6ICNkMGQxZDI7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgfVxuICAgIC5zYi1jb21tZW50LWxpbmUge1xuICAgICAgZmlsbDogI2ZmZmY4MDtcbiAgICB9XG4gICAgLnNiLWNvbW1lbnQtbGFiZWwge1xuICAgICAgZm9udC1mYW1pbHk6IEhlbGV2ZXRpY2EsIEFyaWFsLCBEZWphVnUgU2Fucywgc2Fucy1zZXJpZjtcbiAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgZmlsbDogIzVjNWQ1ZjtcbiAgICAgIHdvcmQtc3BhY2luZzogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICB9XG5cbiAgICAuc2ItZGlmZiB7XG4gICAgICBmaWxsOiBub25lO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgIH1cbiAgICAuc2ItZGlmZi1pbnMge1xuICAgICAgc3Ryb2tlLXdpZHRoOiAycHg7XG4gICAgfVxuICAgIC5zYi1kaWZmLWRlbCB7XG4gICAgICBzdHJva2Utd2lkdGg6IDNweDtcbiAgICB9XG4gIGAucmVwbGFjZSgvWyBcXG5dKy8sIFwiIFwiKSxcblxuICBtYWtlSWNvbnMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICBkOlxuICAgICAgICAgIFwiTS43NSwyQTYuNDQsNi40NCwwLDAsMSw4LjQ0LDJoMGE2LjQ0LDYuNDQsMCwwLDAsNy42OSwwVjEyLjRhNi40NCw2LjQ0LDAsMCwxLTcuNjksMGgwYTYuNDQsNi40NCwwLDAsMC03LjY5LDBcIixcbiAgICAgICAgZmlsbDogXCIjNGNiZjU2XCIsXG4gICAgICAgIHN0cm9rZTogXCIjNDU5OTNkXCIsXG4gICAgICAgIGlkOiBcImdyZWVuRmxhZ1wiLFxuICAgICAgfSksXG4gICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgZDpcbiAgICAgICAgICBcIk02LjcyNCAwQzMuMDEgMCAwIDIuOTEgMCA2LjVjMCAyLjMxNiAxLjI1MyA0LjM1IDMuMTQgNS41SDUuMTd2LTEuMjU2QzMuMzY0IDEwLjEyNiAyLjA3IDguNDYgMi4wNyA2LjUgMi4wNyA0LjAxNSA0LjE1MiAyIDYuNzIzIDJjMS4xNCAwIDIuMTg0LjM5NiAyLjk5MyAxLjA1M0w4LjMxIDQuMTNjLS40NS4zNDQtLjM5OC44MjYuMTEgMS4wOEwxNSA4LjUgMTMuODU4Ljk5MmMtLjA4My0uNTQ3LS41MTQtLjcxNC0uOTYzLS4zN2wtMS41MzIgMS4xNzJBNi44MjUgNi44MjUgMCAwIDAgNi43MjMgMHpcIixcbiAgICAgICAgZmlsbDogXCIjZmZmXCIsXG4gICAgICAgIGlkOiBcInR1cm5SaWdodFwiLFxuICAgICAgfSksXG4gICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgZDpcbiAgICAgICAgICBcIk0zLjYzNyAxLjc5NEE2LjgyNSA2LjgyNSAwIDAgMSA4LjI3NyAwQzExLjk5IDAgMTUgMi45MSAxNSA2LjVjMCAyLjMxNi0xLjI1MyA0LjM1LTMuMTQgNS41SDkuODN2LTEuMjU2YzEuODA4LS42MTggMy4xMDMtMi4yODUgMy4xMDMtNC4yNDQgMC0yLjQ4NS0yLjA4My00LjUtNC42NTQtNC41LTEuMTQgMC0yLjE4NC4zOTYtMi45OTMgMS4wNTNMNi42OSA0LjEzYy40NS4zNDQuMzk4LjgyNi0uMTEgMS4wOEwwIDguNSAxLjE0Mi45OTJjLjA4My0uNTQ3LjUxNC0uNzE0Ljk2My0uMzdsMS41MzIgMS4xNzJ6XCIsXG4gICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICBpZDogXCJ0dXJuTGVmdFwiLFxuICAgICAgfSksXG4gICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgZDogXCJNMCAwTDQgNEwwIDhaXCIsXG4gICAgICAgIGZpbGw6IFwiIzExMVwiLFxuICAgICAgICBpZDogXCJhZGRJbnB1dFwiLFxuICAgICAgfSksXG4gICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgZDogXCJNNCAwTDQgOEwwIDRaXCIsXG4gICAgICAgIGZpbGw6IFwiIzExMVwiLFxuICAgICAgICBpZDogXCJkZWxJbnB1dFwiLFxuICAgICAgfSksXG4gICAgICBTVkcuc2V0UHJvcHMoXG4gICAgICAgIFNWRy5ncm91cChbXG4gICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICBkOiBcIk04IDBsMiAtMmwwIC0zbDMgMGwtNCAtNWwtNCA1bDMgMGwwIDNsLTggMGwwIDJcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzAwMFwiLFxuICAgICAgICAgICAgb3BhY2l0eTogXCIwLjNcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBTVkcubW92ZShcbiAgICAgICAgICAgIC0xLFxuICAgICAgICAgICAgLTEsXG4gICAgICAgICAgICBTVkcuZWwoXCJwYXRoXCIsIHtcbiAgICAgICAgICAgICAgZDogXCJNOCAwbDIgLTJsMCAtM2wzIDBsLTQgLTVsLTQgNWwzIDBsMCAzbC04IDBsMCAyXCIsXG4gICAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgICAgICBvcGFjaXR5OiBcIjAuOVwiLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApLFxuICAgICAgICBdKSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcImxvb3BBcnJvd1wiLFxuICAgICAgICB9XG4gICAgICApLFxuICAgIF1cbiAgfSxcblxuICBtYWtlU3R5bGUoKSB7XG4gICAgdmFyIHN0eWxlID0gU1ZHLmVsKFwic3R5bGVcIilcbiAgICBzdHlsZS5hcHBlbmRDaGlsZChTVkcuY2RhdGEoU3R5bGUuY3NzQ29udGVudCkpXG4gICAgcmV0dXJuIHN0eWxlXG4gIH0sXG5cbiAgYmV2ZWxGaWx0ZXIoaWQsIGluc2V0KSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKVxuXG4gICAgdmFyIGFscGhhID0gXCJTb3VyY2VBbHBoYVwiXG4gICAgdmFyIHMgPSBpbnNldCA/IC0xIDogMVxuICAgIHZhciBibHVyID0gZi5ibHVyKDEsIGFscGhhKVxuXG4gICAgZi5tZXJnZShbXG4gICAgICBcIlNvdXJjZUdyYXBoaWNcIixcbiAgICAgIGYuY29tcChcbiAgICAgICAgXCJpblwiLFxuICAgICAgICBmLmZsb29kKFwiI2ZmZlwiLCAwLjE1KSxcbiAgICAgICAgZi5zdWJ0cmFjdChhbHBoYSwgZi5vZmZzZXQoK3MsICtzLCBibHVyKSlcbiAgICAgICksXG4gICAgICBmLmNvbXAoXG4gICAgICAgIFwiaW5cIixcbiAgICAgICAgZi5mbG9vZChcIiMwMDBcIiwgMC43KSxcbiAgICAgICAgZi5zdWJ0cmFjdChhbHBoYSwgZi5vZmZzZXQoLXMsIC1zLCBibHVyKSlcbiAgICAgICksXG4gICAgXSlcblxuICAgIHJldHVybiBmLmVsXG4gIH0sXG5cbiAgZGFya0ZpbHRlcihpZCkge1xuICAgIHZhciBmID0gbmV3IEZpbHRlcihpZClcblxuICAgIGYubWVyZ2UoW1xuICAgICAgXCJTb3VyY2VHcmFwaGljXCIsXG4gICAgICBmLmNvbXAoXCJpblwiLCBmLmZsb29kKFwiIzAwMFwiLCAwLjIpLCBcIlNvdXJjZUFscGhhXCIpLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRlc2F0dXJhdGVGaWx0ZXIoaWQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpXG5cbiAgICB2YXIgcSA9IDAuMzMzXG4gICAgdmFyIHMgPSAwLjMzM1xuICAgIGYuY29sb3JNYXRyaXgoXCJTb3VyY2VHcmFwaGljXCIsIFtcbiAgICAgIHEsXG4gICAgICBzLFxuICAgICAgcyxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgcyxcbiAgICAgIHEsXG4gICAgICBzLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICBzLFxuICAgICAgcyxcbiAgICAgIHEsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDEsXG4gICAgICAwLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRhcmtSZWN0KHcsIGgsIGNhdGVnb3J5LCBlbCkge1xuICAgIHJldHVybiBTVkcuc2V0UHJvcHMoXG4gICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgICBjbGFzczogW1wic2ItXCIgKyBjYXRlZ29yeSwgXCJzYi1kYXJrZXJcIl0uam9pbihcIiBcIiksXG4gICAgICAgIH0pLFxuICAgICAgXSksXG4gICAgICB7IHdpZHRoOiB3LCBoZWlnaHQ6IGggfVxuICAgIClcbiAgfSxcblxuICBkZWZhdWx0Rm9udEZhbWlseTogXCJMdWNpZGEgR3JhbmRlLCBWZXJkYW5hLCBBcmlhbCwgRGVqYVZ1IFNhbnMsIHNhbnMtc2VyaWZcIixcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cbiAgZnVuY3Rpb24gaXNBcnJheShvKSB7XG4gICAgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXlcbiAgfVxuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkge1xuICAgIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG4gIH1cblxuICB2YXIge1xuICAgIExhYmVsLFxuICAgIEljb24sXG4gICAgSW5wdXQsXG4gICAgQmxvY2ssXG4gICAgQ29tbWVudCxcbiAgICBHbG93LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcbiAgfSA9IHJlcXVpcmUoXCIuL21vZGVsLmpzXCIpXG5cbiAgdmFyIHtcbiAgICBhbGxMYW5ndWFnZXMsXG4gICAgbG9va3VwRHJvcGRvd24sXG4gICAgaGV4Q29sb3JQYXQsXG4gICAgbWluaWZ5SGFzaCxcbiAgICBsb29rdXBIYXNoLFxuICAgIGhhc2hTcGVjLFxuICAgIGFwcGx5T3ZlcnJpZGVzLFxuICAgIHJ0bExhbmd1YWdlcyxcbiAgICBpY29uUGF0LFxuICAgIGJsb2NrTmFtZSxcbiAgfSA9IHJlcXVpcmUoXCIuL2Jsb2Nrcy5qc1wiKVxuXG4gIGZ1bmN0aW9uIHBhaW50QmxvY2soaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcykge1xuICAgIHZhciBvdmVycmlkZXMgPSBbXVxuICAgIGlmIChpc0FycmF5KGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdKSkge1xuICAgICAgb3ZlcnJpZGVzID0gY2hpbGRyZW4ucG9wKClcbiAgICB9XG5cbiAgICAvLyBidWlsZCBoYXNoXG4gICAgdmFyIHdvcmRzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgaWYgKGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgd29yZHMucHVzaChjaGlsZC52YWx1ZSlcbiAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNJY29uKSB7XG4gICAgICAgIHdvcmRzLnB1c2goXCJAXCIgKyBjaGlsZC5uYW1lKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd29yZHMucHVzaChcIl9cIilcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGhhc2ggPSAoaW5mby5oYXNoID0gbWluaWZ5SGFzaCh3b3Jkcy5qb2luKFwiIFwiKSkpXG5cbiAgICAvLyBwYWludFxuICAgIHZhciBvID0gbG9va3VwSGFzaChoYXNoLCBpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKVxuICAgIGlmIChvKSB7XG4gICAgICB2YXIgbGFuZyA9IG8ubGFuZ1xuICAgICAgdmFyIHR5cGUgPSBvLnR5cGVcbiAgICAgIGluZm8ubGFuZ3VhZ2UgPSBsYW5nXG4gICAgICBpbmZvLmlzUlRMID0gcnRsTGFuZ3VhZ2VzLmluZGV4T2YobGFuZy5jb2RlKSA+IC0xXG5cbiAgICAgIGlmIChcbiAgICAgICAgdHlwZS5zaGFwZSA9PT0gXCJyaW5nXCJcbiAgICAgICAgICA/IGluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgICAgICAgIDogaW5mby5zaGFwZSA9PT0gXCJzdGFja1wiXG4gICAgICApIHtcbiAgICAgICAgaW5mby5zaGFwZSA9IHR5cGUuc2hhcGVcbiAgICAgIH1cbiAgICAgIGluZm8uY2F0ZWdvcnkgPSB0eXBlLmNhdGVnb3J5XG4gICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgIGlmICh0eXBlLnNlbGVjdG9yKSBpbmZvLnNlbGVjdG9yID0gdHlwZS5zZWxlY3RvciAvLyBmb3IgdG9KU09OXG4gICAgICBpbmZvLmhhc0xvb3BBcnJvdyA9IHR5cGUuaGFzTG9vcEFycm93XG5cbiAgICAgIC8vIGVsbGlwc2lzIGJsb2NrXG4gICAgICBpZiAodHlwZS5zcGVjID09PSBcIi4gLiAuXCIpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBbbmV3IExhYmVsKFwiLiAuIC5cIildXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gb3ZlcnJpZGVzXG4gICAgYXBwbHlPdmVycmlkZXMoaW5mbywgb3ZlcnJpZGVzKVxuXG4gICAgLy8gbG9vcCBhcnJvd3NcbiAgICBpZiAoaW5mby5oYXNMb29wQXJyb3cpIHtcbiAgICAgIGNoaWxkcmVuLnB1c2gobmV3IEljb24oXCJsb29wQXJyb3dcIikpXG4gICAgfVxuXG4gICAgdmFyIGJsb2NrID0gbmV3IEJsb2NrKGluZm8sIGNoaWxkcmVuKVxuXG4gICAgLy8gaW1hZ2UgcmVwbGFjZW1lbnRcbiAgICBpZiAodHlwZSAmJiBpY29uUGF0LnRlc3QodHlwZS5zcGVjKSkge1xuICAgICAgYmxvY2sudHJhbnNsYXRlKGxhbmcsIHRydWUpXG4gICAgfVxuXG4gICAgLy8gZGlmZnNcbiAgICBpZiAoaW5mby5kaWZmID09PSBcIitcIikge1xuICAgICAgcmV0dXJuIG5ldyBHbG93KGJsb2NrKVxuICAgIH0gZWxzZSB7XG4gICAgICBibG9jay5kaWZmID0gaW5mby5kaWZmXG4gICAgfVxuICAgIHJldHVybiBibG9ja1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VMaW5lcyhjb2RlLCBsYW5ndWFnZXMpIHtcbiAgICB2YXIgdG9rID0gY29kZVswXVxuICAgIHZhciBpbmRleCA9IDBcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgdG9rID0gY29kZVsrK2luZGV4XVxuICAgIH1cbiAgICBmdW5jdGlvbiBwZWVrKCkge1xuICAgICAgcmV0dXJuIGNvZGVbaW5kZXggKyAxXVxuICAgIH1cbiAgICBmdW5jdGlvbiBwZWVrTm9uV3MoKSB7XG4gICAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxOyBpIDwgY29kZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY29kZVtpXSAhPT0gXCIgXCIpIHJldHVybiBjb2RlW2ldXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzYXdOTFxuXG4gICAgdmFyIGRlZmluZSA9IFtdXG4gICAgbGFuZ3VhZ2VzLm1hcChmdW5jdGlvbihsYW5nKSB7XG4gICAgICBkZWZpbmUgPSBkZWZpbmUuY29uY2F0KGxhbmcuZGVmaW5lKVxuICAgIH0pXG4gICAgLy8gTkIuIHdlIGFzc3VtZSAnZGVmaW5lJyBpcyBhIHNpbmdsZSB3b3JkIGluIGV2ZXJ5IGxhbmd1YWdlXG4gICAgZnVuY3Rpb24gaXNEZWZpbmUod29yZCkge1xuICAgICAgcmV0dXJuIGRlZmluZS5pbmRleE9mKHdvcmQpID4gLTFcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQmxvY2soc2hhcGUsIGNoaWxkcmVuKSB7XG4gICAgICB2YXIgaGFzSW5wdXRzID0gISFjaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gIXguaXNMYWJlbFxuICAgICAgfSkubGVuZ3RoXG4gICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgc2hhcGU6IHNoYXBlLFxuICAgICAgICBjYXRlZ29yeTpcbiAgICAgICAgICBzaGFwZSA9PT0gXCJkZWZpbmUtaGF0XCJcbiAgICAgICAgICAgID8gXCJjdXN0b21cIlxuICAgICAgICAgICAgOiBzaGFwZSA9PT0gXCJyZXBvcnRlclwiICYmICFoYXNJbnB1dHMgPyBcInZhcmlhYmxlc1wiIDogXCJvYnNvbGV0ZVwiLFxuICAgICAgICBjYXRlZ29yeUlzRGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgaGFzTG9vcEFycm93OiBmYWxzZSxcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYWludEJsb2NrKGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZU1lbnUoc2hhcGUsIHZhbHVlKSB7XG4gICAgICB2YXIgbWVudSA9IGxvb2t1cERyb3Bkb3duKHZhbHVlLCBsYW5ndWFnZXMpIHx8IHZhbHVlXG4gICAgICByZXR1cm4gbmV3IElucHV0KHNoYXBlLCB2YWx1ZSwgbWVudSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwUGFydHMoZW5kKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgdmFyIGxhYmVsXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIjxcIiB8fCAodG9rID09PSBcIj5cIiAmJiBlbmQgPT09IFwiPlwiKSkge1xuICAgICAgICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgICAgICB2YXIgYyA9IHBlZWtOb25XcygpXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbGFzdCAmJlxuICAgICAgICAgICAgIWxhc3QuaXNMYWJlbCAmJlxuICAgICAgICAgICAgKGMgPT09IFwiW1wiIHx8IGMgPT09IFwiKFwiIHx8IGMgPT09IFwiPFwiIHx8IGMgPT09IFwie1wiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbCh0b2spKVxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rID09PSBlbmQpIGJyZWFrXG4gICAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIgJiYgIWVuZCkgYnJlYWtcblxuICAgICAgICBzd2l0Y2ggKHRvaykge1xuICAgICAgICAgIGNhc2UgXCJbXCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocFN0cmluZygpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiKFwiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBSZXBvcnRlcigpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBQcmVkaWNhdGUoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIntcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwRW1iZWRkZWQoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgICBjYXNlIFwiXFx0XCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGlmIChsYWJlbCAmJiBpc0RlZmluZShsYWJlbC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgLy8gZGVmaW5lIGhhdFxuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdXRsaW5lKCkpXG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCLil4JcIjpcbiAgICAgICAgICBjYXNlIFwi4pa4XCI6XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBJY29uKCkpXG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIkBcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgdmFyIG5hbWUgPSBcIlwiXG4gICAgICAgICAgICB3aGlsZSAodG9rICYmIC9bYS16QS1aXS8udGVzdCh0b2spKSB7XG4gICAgICAgICAgICAgIG5hbWUgKz0gdG9rXG4gICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwiY2xvdWRcIikge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbChcIuKYgVwiKSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goXG4gICAgICAgICAgICAgICAgSWNvbi5pY29ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuICAgICAgICAgICAgICAgICAgPyBuZXcgSWNvbihuYW1lKVxuICAgICAgICAgICAgICAgICAgOiBuZXcgTGFiZWwoXCJAXCIgKyBuYW1lKVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICAgICAgIG5leHQoKSAvLyBlc2NhcGUgY2hhcmFjdGVyXG4gICAgICAgICAgLy8gZmFsbC10aHJ1XG4gICAgICAgICAgY2FzZSBcIjpcIjpcbiAgICAgICAgICAgIGlmICh0b2sgPT09IFwiOlwiICYmIHBlZWsoKSA9PT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3ZlcnJpZGVzKGVuZCkpXG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlblxuICAgICAgICAgICAgfSAvLyBmYWxsLXRocnVcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCFsYWJlbCkgY2hpbGRyZW4ucHVzaCgobGFiZWwgPSBuZXcgTGFiZWwoXCJcIikpKVxuICAgICAgICAgICAgbGFiZWwudmFsdWUgKz0gdG9rXG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFN0cmluZygpIHtcbiAgICAgIG5leHQoKSAvLyAnWydcbiAgICAgIHZhciBzID0gXCJcIlxuICAgICAgdmFyIGVzY2FwZVYgPSBmYWxzZVxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXVwiICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIlxcXFxcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIGlmICh0b2sgPT09IFwidlwiKSBlc2NhcGVWID0gdHJ1ZVxuICAgICAgICAgIGlmICghdG9rKSBicmVha1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVzY2FwZVYgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIHMgKz0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKHRvayA9PT0gXCJdXCIpIG5leHQoKVxuICAgICAgaWYgKGhleENvbG9yUGF0LnRlc3QocykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcImNvbG9yXCIsIHMpXG4gICAgICB9XG4gICAgICByZXR1cm4gIWVzY2FwZVYgJiYgLyB2JC8udGVzdChzKVxuICAgICAgICA/IG1ha2VNZW51KFwiZHJvcGRvd25cIiwgcy5zbGljZSgwLCBzLmxlbmd0aCAtIDIpKVxuICAgICAgICA6IG5ldyBJbnB1dChcInN0cmluZ1wiLCBzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBCbG9jayhlbmQpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhlbmQpXG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCJcXG5cIikge1xuICAgICAgICBzYXdOTCA9IHRydWVcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgLy8gZGVmaW5lIGhhdHNcbiAgICAgIHZhciBmaXJzdCA9IGNoaWxkcmVuWzBdXG4gICAgICBpZiAoZmlyc3QgJiYgZmlyc3QuaXNMYWJlbCAmJiBpc0RlZmluZShmaXJzdC52YWx1ZSkpIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKG1ha2VCbG9jayhcIm91dGxpbmVcIiwgW10pKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWtlQmxvY2soXCJkZWZpbmUtaGF0XCIsIGNoaWxkcmVuKVxuICAgICAgfVxuXG4gICAgICAvLyBzdGFuZGFsb25lIHJlcG9ydGVyc1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlblswXVxuICAgICAgICBpZiAoXG4gICAgICAgICAgY2hpbGQuaXNCbG9jayAmJlxuICAgICAgICAgIChjaGlsZC5pc1JlcG9ydGVyIHx8IGNoaWxkLmlzQm9vbGVhbiB8fCBjaGlsZC5pc1JpbmcpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBjaGlsZFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYWtlQmxvY2soXCJzdGFja1wiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwUmVwb3J0ZXIoKSB7XG4gICAgICBuZXh0KCkgLy8gJygnXG5cbiAgICAgIC8vIGVtcHR5IG51bWJlci1kcm9wZG93blxuICAgICAgaWYgKHRvayA9PT0gXCIgXCIpIHtcbiAgICAgICAgbmV4dCgpXG4gICAgICAgIGlmICh0b2sgPT09IFwidlwiICYmIHBlZWsoKSA9PT0gXCIpXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICByZXR1cm4gbmV3IElucHV0KFwibnVtYmVyLWRyb3Bkb3duXCIsIFwiXCIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKFwiKVwiKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiKVwiKSBuZXh0KClcblxuICAgICAgLy8gZW1wdHkgbnVtYmVyc1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0KFwibnVtYmVyXCIsIFwiXCIpXG4gICAgICB9XG5cbiAgICAgIC8vIG51bWJlclxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBjaGlsZHJlblswXS5pc0xhYmVsKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGNoaWxkcmVuWzBdLnZhbHVlXG4gICAgICAgIGlmICgvXlswLTllLi1dKiQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcIm51bWJlclwiLCB2YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBudW1iZXItZHJvcGRvd25cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFjaGlsZHJlbltpXS5pc0xhYmVsKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGkgPT09IGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2kgLSAxXVxuICAgICAgICBpZiAoaSA+IDEgJiYgbGFzdC52YWx1ZSA9PT0gXCJ2XCIpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wb3AoKVxuICAgICAgICAgIHZhciB2YWx1ZSA9IGNoaWxkcmVuXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uKGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGwudmFsdWVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbihcIiBcIilcbiAgICAgICAgICByZXR1cm4gbWFrZU1lbnUoXCJudW1iZXItZHJvcGRvd25cIiwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGJsb2NrID0gbWFrZUJsb2NrKFwicmVwb3J0ZXJcIiwgY2hpbGRyZW4pXG5cbiAgICAgIC8vIHJpbmdzXG4gICAgICBpZiAoYmxvY2suaW5mby5zaGFwZSA9PT0gXCJyaW5nXCIpIHtcbiAgICAgICAgdmFyIGZpcnN0ID0gYmxvY2suY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGZpcnN0ICYmXG4gICAgICAgICAgZmlyc3QuaXNJbnB1dCAmJlxuICAgICAgICAgIGZpcnN0LnNoYXBlID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgZmlyc3QudmFsdWUgPT09IFwiXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgYmxvY2suY2hpbGRyZW5bMF0gPSBuZXcgSW5wdXQoXCJyZXBvcnRlclwiKVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIChmaXJzdCAmJiBmaXJzdC5pc1NjcmlwdCAmJiBmaXJzdC5pc0VtcHR5KSB8fFxuICAgICAgICAgIChmaXJzdCAmJiBmaXJzdC5pc0Jsb2NrICYmICFmaXJzdC5jaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgICkge1xuICAgICAgICAgIGJsb2NrLmNoaWxkcmVuWzBdID0gbmV3IElucHV0KFwic3RhY2tcIilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYmxvY2tcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwUHJlZGljYXRlKCkge1xuICAgICAgbmV4dCgpIC8vICc8J1xuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKFwiPlwiKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiPlwiKSBuZXh0KClcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcImJvb2xlYW5cIilcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlQmxvY2soXCJib29sZWFuXCIsIGNoaWxkcmVuKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBFbWJlZGRlZCgpIHtcbiAgICAgIG5leHQoKSAvLyAneydcblxuICAgICAgc2F3TkwgPSBmYWxzZVxuICAgICAgdmFyIGYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwifVwiKSB7XG4gICAgICAgICAgdmFyIGJsb2NrID0gcEJsb2NrKFwifVwiKVxuICAgICAgICAgIGlmIChibG9jaykgcmV0dXJuIGJsb2NrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpXG4gICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgIHNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgYmxvY2tzID0gYmxvY2tzLmNvbmNhdChzY3JpcHQuYmxvY2tzKVxuICAgICAgfSlcblxuICAgICAgaWYgKHRvayA9PT0gXCJ9XCIpIG5leHQoKVxuICAgICAgaWYgKCFzYXdOTCkge1xuICAgICAgICBhc3NlcnQoYmxvY2tzLmxlbmd0aCA8PSAxKVxuICAgICAgICByZXR1cm4gYmxvY2tzLmxlbmd0aCA/IGJsb2Nrc1swXSA6IG1ha2VCbG9jayhcInN0YWNrXCIsIFtdKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTY3JpcHQoYmxvY2tzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBJY29uKCkge1xuICAgICAgdmFyIGMgPSB0b2tcbiAgICAgIG5leHQoKVxuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgXCLilrhcIjpcbiAgICAgICAgICByZXR1cm4gbmV3IEljb24oXCJhZGRJbnB1dFwiKVxuICAgICAgICBjYXNlIFwi4peCXCI6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJY29uKFwiZGVsSW5wdXRcIilcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwT3ZlcnJpZGVzKGVuZCkge1xuICAgICAgbmV4dCgpXG4gICAgICBuZXh0KClcbiAgICAgIHZhciBvdmVycmlkZXMgPSBbXVxuICAgICAgdmFyIG92ZXJyaWRlID0gXCJcIlxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIgJiYgdG9rICE9PSBlbmQpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCIgXCIpIHtcbiAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlcy5wdXNoKG92ZXJyaWRlKVxuICAgICAgICAgICAgb3ZlcnJpZGUgPSBcIlwiXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRvayA9PT0gXCIvXCIgJiYgcGVlaygpID09PSBcIi9cIikge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3ZlcnJpZGUgKz0gdG9rXG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAob3ZlcnJpZGUpIG92ZXJyaWRlcy5wdXNoKG92ZXJyaWRlKVxuICAgICAgcmV0dXJuIG92ZXJyaWRlc1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBDb21tZW50KGVuZCkge1xuICAgICAgbmV4dCgpXG4gICAgICBuZXh0KClcbiAgICAgIHZhciBjb21tZW50ID0gXCJcIlxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIgJiYgdG9rICE9PSBlbmQpIHtcbiAgICAgICAgY29tbWVudCArPSB0b2tcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gXCJcXG5cIikgbmV4dCgpXG4gICAgICByZXR1cm4gbmV3IENvbW1lbnQoY29tbWVudCwgdHJ1ZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwT3V0bGluZSgpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgICBmdW5jdGlvbiBwYXJzZUFyZyhraW5kLCBlbmQpIHtcbiAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgIG5leHQoKVxuICAgICAgICB2YXIgcGFydHMgPSBwUGFydHMoZW5kKVxuICAgICAgICBpZiAodG9rID09PSBlbmQpIG5leHQoKVxuICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgIHBhaW50QmxvY2soXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNoYXBlOiBraW5kID09PSBcImJvb2xlYW5cIiA/IFwiYm9vbGVhblwiIDogXCJyZXBvcnRlclwiLFxuICAgICAgICAgICAgICBhcmd1bWVudDoga2luZCxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tLWFyZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhcnRzLFxuICAgICAgICAgICAgbGFuZ3VhZ2VzXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICB9XG4gICAgICB2YXIgbGFiZWxcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAodG9rKSB7XG4gICAgICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgICAgIHBhcnNlQXJnKFwibnVtYmVyXCIsIFwiKVwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiW1wiOlxuICAgICAgICAgICAgcGFyc2VBcmcoXCJzdHJpbmdcIiwgXCJdXCIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICBwYXJzZUFyZyhcImJvb2xlYW5cIiwgXCI+XCIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCIgXCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiXFxcXFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgLy8gZmFsbC10aHJ1XG4gICAgICAgICAgY2FzZSBcIjpcIjpcbiAgICAgICAgICAgIGlmICh0b2sgPT09IFwiOlwiICYmIHBlZWsoKSA9PT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3ZlcnJpZGVzKCkpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IC8vIGZhbGwtdGhydVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAoIWxhYmVsKSBjaGlsZHJlbi5wdXNoKChsYWJlbCA9IG5ldyBMYWJlbChcIlwiKSkpXG4gICAgICAgICAgICBsYWJlbC52YWx1ZSArPSB0b2tcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwib3V0bGluZVwiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTGluZSgpIHtcbiAgICAgIHZhciBkaWZmXG4gICAgICBpZiAodG9rID09PSBcIitcIiB8fCB0b2sgPT09IFwiLVwiKSB7XG4gICAgICAgIGRpZmYgPSB0b2tcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgICB2YXIgYmxvY2sgPSBwQmxvY2soKVxuICAgICAgaWYgKHRvayA9PT0gXCIvXCIgJiYgcGVlaygpID09PSBcIi9cIikge1xuICAgICAgICB2YXIgY29tbWVudCA9IHBDb21tZW50KClcbiAgICAgICAgY29tbWVudC5oYXNCbG9jayA9IGJsb2NrICYmIGJsb2NrLmNoaWxkcmVuLmxlbmd0aFxuICAgICAgICBpZiAoIWNvbW1lbnQuaGFzQmxvY2spIHtcbiAgICAgICAgICByZXR1cm4gY29tbWVudFxuICAgICAgICB9XG4gICAgICAgIGJsb2NrLmNvbW1lbnQgPSBjb21tZW50XG4gICAgICB9XG4gICAgICBpZiAoYmxvY2spIGJsb2NrLmRpZmYgPSBkaWZmXG4gICAgICByZXR1cm4gYmxvY2tcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRvaykgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgdmFyIGxpbmUgPSBwTGluZSgpXG4gICAgICByZXR1cm4gbGluZSB8fCBcIk5MXCJcbiAgICB9XG4gIH1cblxuICAvKiAqICovXG5cbiAgZnVuY3Rpb24gcGFyc2VTY3JpcHRzKGdldExpbmUpIHtcbiAgICB2YXIgbGluZSA9IGdldExpbmUoKVxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICBsaW5lID0gZ2V0TGluZSgpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcEZpbGUoKSB7XG4gICAgICB3aGlsZSAobGluZSA9PT0gXCJOTFwiKSBuZXh0KClcbiAgICAgIHZhciBzY3JpcHRzID0gW11cbiAgICAgIHdoaWxlIChsaW5lKSB7XG4gICAgICAgIHZhciBibG9ja3MgPSBbXVxuICAgICAgICB3aGlsZSAobGluZSAmJiBsaW5lICE9PSBcIk5MXCIpIHtcbiAgICAgICAgICB2YXIgYiA9IHBMaW5lKClcbiAgICAgICAgICB2YXIgaXNHbG93ID0gYi5kaWZmID09PSBcIitcIlxuICAgICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICAgIGIuZGlmZiA9IG51bGxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYi5pc0Vsc2UgfHwgYi5pc0VuZCkge1xuICAgICAgICAgICAgYiA9IG5ldyBCbG9jayhcbiAgICAgICAgICAgICAgZXh0ZW5kKGIuaW5mbywge1xuICAgICAgICAgICAgICAgIHNoYXBlOiBcInN0YWNrXCIsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBiLmNoaWxkcmVuXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgICAgICAgaWYgKGxhc3QgJiYgbGFzdC5pc0dsb3cpIHtcbiAgICAgICAgICAgICAgYmxvY2tzLnBvcCgpXG4gICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGxhc3QuY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICAgICAgICA/IGxhc3QuY2hpbGQuYmxvY2tzXG4gICAgICAgICAgICAgICAgOiBbbGFzdC5jaGlsZF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goYilcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKG5ldyBHbG93KG5ldyBTY3JpcHQoY2hpbGRyZW4pKSlcbiAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNIYXQpIHtcbiAgICAgICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgICAgYmxvY2tzID0gW2JdXG4gICAgICAgICAgfSBlbHNlIGlmIChiLmlzRmluYWwpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0NvbW1hbmQpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHJlcG9ydGVyIG9yIHByZWRpY2F0ZVxuICAgICAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGgpIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpXG4gICAgICAgICAgICBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChbYl0pKVxuICAgICAgICAgICAgYmxvY2tzID0gW11cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICB3aGlsZSAobGluZSA9PT0gXCJOTFwiKSBuZXh0KClcbiAgICAgIH1cbiAgICAgIHJldHVybiBzY3JpcHRzXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcExpbmUoKSB7XG4gICAgICB2YXIgYiA9IGxpbmVcbiAgICAgIG5leHQoKVxuXG4gICAgICBpZiAoYi5oYXNTY3JpcHQpIHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICB2YXIgYmxvY2tzID0gcE1vdXRoKClcbiAgICAgICAgICBiLmNoaWxkcmVuLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgIGlmIChsaW5lICYmIGxpbmUuaXNFbHNlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgYi5jaGlsZHJlbi5wdXNoKGxpbmUuY2hpbGRyZW5baV0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsaW5lICYmIGxpbmUuaXNFbmQpIHtcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYlxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBNb3V0aCgpIHtcbiAgICAgIHZhciBibG9ja3MgPSBbXVxuICAgICAgd2hpbGUgKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUgPT09IFwiTkxcIikge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsaW5lLmlzQ29tbWFuZCkge1xuICAgICAgICAgIHJldHVybiBibG9ja3NcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiID0gcExpbmUoKVxuICAgICAgICB2YXIgaXNHbG93ID0gYi5kaWZmID09PSBcIitcIlxuICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgYi5kaWZmID0gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgIHZhciBsYXN0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXVxuICAgICAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgICAgICAgaWYgKGxhc3QgJiYgbGFzdC5pc0dsb3cpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wb3AoKVxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gbGFzdC5jaGlsZC5pc1NjcmlwdFxuICAgICAgICAgICAgICA/IGxhc3QuY2hpbGQuYmxvY2tzXG4gICAgICAgICAgICAgIDogW2xhc3QuY2hpbGRdXG4gICAgICAgICAgfVxuICAgICAgICAgIGNoaWxkcmVuLnB1c2goYilcbiAgICAgICAgICBibG9ja3MucHVzaChuZXcgR2xvdyhuZXcgU2NyaXB0KGNoaWxkcmVuKSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmxvY2tzLnB1c2goYilcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJsb2Nrc1xuICAgIH1cblxuICAgIHJldHVybiBwRmlsZSgpXG4gIH1cblxuICAvKiAqICovXG5cbiAgZnVuY3Rpb24gZWFjaEJsb2NrKHgsIGNiKSB7XG4gICAgaWYgKHguaXNTY3JpcHQpIHtcbiAgICAgIHguYmxvY2tzLmZvckVhY2goZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgZWFjaEJsb2NrKGJsb2NrLCBjYilcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh4LmlzQmxvY2spIHtcbiAgICAgIGNiKHgpXG4gICAgICB4LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgZWFjaEJsb2NrKGNoaWxkLCBjYilcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICh4LmlzR2xvdykge1xuICAgICAgZWFjaEJsb2NrKHguY2hpbGQsIGNiKVxuICAgIH1cbiAgfVxuXG4gIHZhciBsaXN0QmxvY2tzID0ge1xuICAgIFwiYXBwZW5kOnRvTGlzdDpcIjogMSxcbiAgICBcImRlbGV0ZUxpbmU6b2ZMaXN0OlwiOiAxLFxuICAgIFwiaW5zZXJ0OmF0Om9mTGlzdDpcIjogMixcbiAgICBcInNldExpbmU6b2ZMaXN0OnRvOlwiOiAxLFxuICAgIFwic2hvd0xpc3Q6XCI6IDAsXG4gICAgXCJoaWRlTGlzdDpcIjogMCxcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY29nbmlzZVN0dWZmKHNjcmlwdHMpIHtcbiAgICB2YXIgY3VzdG9tQmxvY2tzQnlIYXNoID0ge31cbiAgICB2YXIgbGlzdE5hbWVzID0ge31cblxuICAgIHNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHZhciBjdXN0b21BcmdzID0ge31cblxuICAgICAgZWFjaEJsb2NrKHNjcmlwdCwgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgLy8gY3VzdG9tIGJsb2Nrc1xuICAgICAgICBpZiAoYmxvY2suaW5mby5zaGFwZSA9PT0gXCJkZWZpbmUtaGF0XCIpIHtcbiAgICAgICAgICB2YXIgb3V0bGluZSA9IGJsb2NrLmNoaWxkcmVuWzFdXG4gICAgICAgICAgaWYgKCFvdXRsaW5lKSByZXR1cm5cblxuICAgICAgICAgIHZhciBuYW1lcyA9IFtdXG4gICAgICAgICAgdmFyIHBhcnRzID0gW11cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG91dGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG91dGxpbmUuY2hpbGRyZW5baV1cbiAgICAgICAgICAgIGlmIChjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzQmxvY2spIHtcbiAgICAgICAgICAgICAgaWYgKCFjaGlsZC5pbmZvLmFyZ3VtZW50KSByZXR1cm5cbiAgICAgICAgICAgICAgcGFydHMucHVzaChcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBudW1iZXI6IFwiJW5cIixcbiAgICAgICAgICAgICAgICAgIHN0cmluZzogXCIlc1wiLFxuICAgICAgICAgICAgICAgICAgYm9vbGVhbjogXCIlYlwiLFxuICAgICAgICAgICAgICAgIH1bY2hpbGQuaW5mby5hcmd1bWVudF1cbiAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGNoaWxkKVxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKG5hbWUpXG4gICAgICAgICAgICAgIGN1c3RvbUFyZ3NbbmFtZV0gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzcGVjID0gcGFydHMuam9pbihcIiBcIilcbiAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hTcGVjKHNwZWMpXG4gICAgICAgICAgdmFyIGluZm8gPSAoY3VzdG9tQmxvY2tzQnlIYXNoW2hhc2hdID0ge1xuICAgICAgICAgICAgc3BlYzogc3BlYyxcbiAgICAgICAgICAgIG5hbWVzOiBuYW1lcyxcbiAgICAgICAgICB9KVxuICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcInByb2NEZWZcIlxuICAgICAgICAgIGJsb2NrLmluZm8uY2FsbCA9IGluZm8uc3BlY1xuICAgICAgICAgIGJsb2NrLmluZm8ubmFtZXMgPSBpbmZvLm5hbWVzXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwiY3VzdG9tXCJcblxuICAgICAgICAgIC8vIGZpeCB1cCBpZi9lbHNlIHNlbGVjdG9yc1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmluZm8uc2VsZWN0b3IgPT09IFwiZG9JZkVsc2VcIikge1xuICAgICAgICAgIHZhciBsYXN0MiA9IGJsb2NrLmNoaWxkcmVuW2Jsb2NrLmNoaWxkcmVuLmxlbmd0aCAtIDJdXG4gICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9XG4gICAgICAgICAgICBsYXN0MiAmJiBsYXN0Mi5pc0xhYmVsICYmIGxhc3QyLnZhbHVlID09PSBcImVsc2VcIlxuICAgICAgICAgICAgICA/IFwiZG9JZkVsc2VcIlxuICAgICAgICAgICAgICA6IFwiZG9JZlwiXG5cbiAgICAgICAgICAvLyBjdXN0b20gYXJndW1lbnRzXG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCAmJlxuICAgICAgICAgIChibG9jay5pc1JlcG9ydGVyIHx8IGJsb2NrLmlzQm9vbGVhbilcbiAgICAgICAgKSB7XG4gICAgICAgICAgdmFyIG5hbWUgPSBibG9ja05hbWUoYmxvY2spXG4gICAgICAgICAgaWYgKGN1c3RvbUFyZ3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImN1c3RvbS1hcmdcIlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJnZXRQYXJhbVwiXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gbGlzdCBuYW1lc1xuICAgICAgICB9IGVsc2UgaWYgKGxpc3RCbG9ja3MuaGFzT3duUHJvcGVydHkoYmxvY2suaW5mby5zZWxlY3RvcikpIHtcbiAgICAgICAgICB2YXIgYXJnSW5kZXggPSBsaXN0QmxvY2tzW2Jsb2NrLmluZm8uc2VsZWN0b3JdXG4gICAgICAgICAgdmFyIGlucHV0cyA9IGJsb2NrLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgcmV0dXJuICFjaGlsZC5pc0xhYmVsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB2YXIgaW5wdXQgPSBpbnB1dHNbYXJnSW5kZXhdXG4gICAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LmlzSW5wdXQpIHtcbiAgICAgICAgICAgIGxpc3ROYW1lc1tpbnB1dC52YWx1ZV0gPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICBlYWNoQmxvY2soc2NyaXB0LCBmdW5jdGlvbihibG9jaykge1xuICAgICAgICAvLyBjdXN0b20gYmxvY2tzXG4gICAgICAgIGlmIChcbiAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ICYmXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJvYnNvbGV0ZVwiXG4gICAgICAgICkge1xuICAgICAgICAgIHZhciBpbmZvID0gY3VzdG9tQmxvY2tzQnlIYXNoW2Jsb2NrLmluZm8uaGFzaF1cbiAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwiY2FsbFwiXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhbGwgPSBpbmZvLnNwZWNcbiAgICAgICAgICAgIGJsb2NrLmluZm8ubmFtZXMgPSBpbmZvLm5hbWVzXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJjdXN0b21cIlxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGxpc3QgcmVwb3J0ZXJzXG4gICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaXNSZXBvcnRlcikge1xuICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGJsb2NrKVxuICAgICAgICAgIGlmICghbmFtZSkgcmV0dXJuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJ2YXJpYWJsZXNcIiAmJlxuICAgICAgICAgICAgbGlzdE5hbWVzW25hbWVdICYmXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJsaXN0XCJcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJsaXN0XCIpIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcImNvbnRlbnRzT2ZMaXN0OlwiXG4gICAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLmNhdGVnb3J5ID09PSBcInZhcmlhYmxlc1wiKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJyZWFkVmFyaWFibGVcIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2UoY29kZSwgb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICBsYW5ndWFnZXM6IFtcImVuXCJdLFxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoLyZndDsvZywgXCI+XCIpXG4gICAgaWYgKG9wdGlvbnMuaW5saW5lKSB7XG4gICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXG4vZywgXCIgXCIpXG4gICAgfVxuXG4gICAgdmFyIGxhbmd1YWdlcyA9IG9wdGlvbnMubGFuZ3VhZ2VzLm1hcChmdW5jdGlvbihjb2RlKSB7XG4gICAgICByZXR1cm4gYWxsTGFuZ3VhZ2VzW2NvZGVdXG4gICAgfSlcblxuICAgIC8qICogKi9cblxuICAgIHZhciBmID0gcGFyc2VMaW5lcyhjb2RlLCBsYW5ndWFnZXMpXG4gICAgdmFyIHNjcmlwdHMgPSBwYXJzZVNjcmlwdHMoZilcbiAgICByZWNvZ25pc2VTdHVmZihzY3JpcHRzKVxuICAgIHJldHVybiBuZXcgRG9jdW1lbnQoc2NyaXB0cylcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGFyc2U6IHBhcnNlLFxuICB9XG59KSgpXG4iXX0=
