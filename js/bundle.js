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
  ["wait %n secs", " ", 6, "wait:elapsed:from:"],
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
        y + 6,
        "L",
        inset + 14,
        y + 6,
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
    greenFlag: { width: 10, height: 21, dy: -2 },
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
    hat: [15, 6, 6],
    "define-hat": [21, 8, 9],
    reporter: [5, 3, 2],
    boolean: [5, 2, 2],
    cap: [8, 6, 2],
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
          "M1.504 21L0 19.493 4.567 0h1.948l-.5 2.418s1.002-.502 3.006 0c2.006.503 3.008 2.01 6.517 2.01 3.508 0 4.463-.545 4.463-.545l-.823 9.892s-2.137 1.005-5.144.696c-3.007-.307-3.007-2.007-6.014-2.51-3.008-.502-4.512.503-4.512.503L1.504 21z",
        fill: "#3f8d15",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25XQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiZnVuY3Rpb24gbWFrZUNhbnZhcygpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbn1cblxudmFyIHNjcmF0Y2hibG9ja3MgPSAod2luZG93LnNjcmF0Y2hibG9ja3MgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYi9cIikoXG4gIHdpbmRvdyxcbiAgbWFrZUNhbnZhc1xuKSlcblxuLy8gYWRkIG91ciBDU1MgdG8gdGhlIHBhZ2VcbnZhciBzdHlsZSA9IHNjcmF0Y2hibG9ja3MubWFrZVN0eWxlKClcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxuICB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykge1xuICAgIHJldHVybiBvICYmIG8uY29uc3RydWN0b3IgPT09IEFycmF5XG4gIH1cbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICAvLyBMaXN0IG9mIGNsYXNzZXMgd2UncmUgYWxsb3dlZCB0byBvdmVycmlkZS5cblxuICB2YXIgb3ZlcnJpZGVDYXRlZ29yaWVzID0gW1xuICAgIFwibW90aW9uXCIsXG4gICAgXCJsb29rc1wiLFxuICAgIFwic291bmRcIixcbiAgICBcInBlblwiLFxuICAgIFwidmFyaWFibGVzXCIsXG4gICAgXCJsaXN0XCIsXG4gICAgXCJldmVudHNcIixcbiAgICBcImNvbnRyb2xcIixcbiAgICBcInNlbnNpbmdcIixcbiAgICBcIm9wZXJhdG9yc1wiLFxuICAgIFwiY3VzdG9tXCIsXG4gICAgXCJjdXN0b20tYXJnXCIsXG4gICAgXCJleHRlbnNpb25cIixcbiAgICBcImdyZXlcIixcbiAgICBcIm9ic29sZXRlXCIsXG4gIF1cbiAgdmFyIG92ZXJyaWRlU2hhcGVzID0gW1wiaGF0XCIsIFwiY2FwXCIsIFwic3RhY2tcIiwgXCJib29sZWFuXCIsIFwicmVwb3J0ZXJcIiwgXCJyaW5nXCJdXG5cbiAgLy8gbGFuZ3VhZ2VzIHRoYXQgc2hvdWxkIGJlIGRpc3BsYXllZCByaWdodCB0byBsZWZ0XG4gIHZhciBydGxMYW5ndWFnZXMgPSBbXCJhclwiLCBcImZhXCIsIFwiaGVcIl1cblxuICAvLyBMaXN0IG9mIGNvbW1hbmRzIHRha2VuIGZyb20gU2NyYXRjaFxuICB2YXIgc2NyYXRjaENvbW1hbmRzID0gcmVxdWlyZShcIi4vY29tbWFuZHMuanNcIilcblxuICB2YXIgY2F0ZWdvcmllc0J5SWQgPSB7XG4gICAgMDogXCJvYnNvbGV0ZVwiLFxuICAgIDE6IFwibW90aW9uXCIsXG4gICAgMjogXCJsb29rc1wiLFxuICAgIDM6IFwic291bmRcIixcbiAgICA0OiBcInBlblwiLFxuICAgIDU6IFwiZXZlbnRzXCIsXG4gICAgNjogXCJjb250cm9sXCIsXG4gICAgNzogXCJzZW5zaW5nXCIsXG4gICAgODogXCJvcGVyYXRvcnNcIixcbiAgICA5OiBcInZhcmlhYmxlc1wiLFxuICAgIDEwOiBcImN1c3RvbVwiLFxuICAgIDExOiBcInBhcmFtZXRlclwiLFxuICAgIDEyOiBcImxpc3RcIixcbiAgICAyMDogXCJleHRlbnNpb25cIixcbiAgICA0MjogXCJncmV5XCIsXG4gIH1cblxuICB2YXIgdHlwZVNoYXBlcyA9IHtcbiAgICBcIiBcIjogXCJzdGFja1wiLFxuICAgIGI6IFwiYm9vbGVhblwiLFxuICAgIGM6IFwiYy1ibG9ja1wiLFxuICAgIGU6IFwiaWYtYmxvY2tcIixcbiAgICBmOiBcImNhcFwiLFxuICAgIGg6IFwiaGF0XCIsXG4gICAgcjogXCJyZXBvcnRlclwiLFxuICAgIGNmOiBcImMtYmxvY2sgY2FwXCIsXG4gICAgZWxzZTogXCJjZWxzZVwiLFxuICAgIGVuZDogXCJjZW5kXCIsXG4gICAgcmluZzogXCJyaW5nXCIsXG4gIH1cblxuICB2YXIgaW5wdXRQYXQgPSAvKCVbYS16QS1aXSg/OlxcLlthLXpBLVowLTldKyk/KS9cbiAgdmFyIGlucHV0UGF0R2xvYmFsID0gbmV3IFJlZ0V4cChpbnB1dFBhdC5zb3VyY2UsIFwiZ1wiKVxuICB2YXIgaWNvblBhdCA9IC8oQFthLXpBLVpdKykvXG4gIHZhciBzcGxpdFBhdCA9IG5ldyBSZWdFeHAoXG4gICAgW2lucHV0UGF0LnNvdXJjZSwgXCJ8XCIsIGljb25QYXQuc291cmNlLCBcInwgK1wiXS5qb2luKFwiXCIpLFxuICAgIFwiZ1wiXG4gIClcblxuICB2YXIgaGV4Q29sb3JQYXQgPSAvXiMoPzpbMC05YS1mQS1GXXszfSl7MSwyfT8kL1xuXG4gIGZ1bmN0aW9uIHBhcnNlU3BlYyhzcGVjKSB7XG4gICAgdmFyIHBhcnRzID0gc3BlYy5zcGxpdChzcGxpdFBhdCkuZmlsdGVyKHggPT4gISF4KVxuICAgIHJldHVybiB7XG4gICAgICBzcGVjOiBzcGVjLFxuICAgICAgcGFydHM6IHBhcnRzLFxuICAgICAgaW5wdXRzOiBwYXJ0cy5maWx0ZXIoZnVuY3Rpb24ocCkge1xuICAgICAgICByZXR1cm4gaW5wdXRQYXQudGVzdChwKVxuICAgICAgfSksXG4gICAgICBoYXNoOiBoYXNoU3BlYyhzcGVjKSxcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoU3BlYyhzcGVjKSB7XG4gICAgcmV0dXJuIG1pbmlmeUhhc2goc3BlYy5yZXBsYWNlKGlucHV0UGF0R2xvYmFsLCBcIiBfIFwiKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG1pbmlmeUhhc2goaGFzaCkge1xuICAgIHJldHVybiBoYXNoXG4gICAgICAucmVwbGFjZSgvXy9nLCBcIiBfIFwiKVxuICAgICAgLnJlcGxhY2UoLyArL2csIFwiIFwiKVxuICAgICAgLnJlcGxhY2UoL1ssJT86XS9nLCBcIlwiKVxuICAgICAgLnJlcGxhY2UoL8OfL2csIFwic3NcIilcbiAgICAgIC5yZXBsYWNlKC/DpC9nLCBcImFcIilcbiAgICAgIC5yZXBsYWNlKC/Dti9nLCBcIm9cIilcbiAgICAgIC5yZXBsYWNlKC/DvC9nLCBcInVcIilcbiAgICAgIC5yZXBsYWNlKFwiLiAuIC5cIiwgXCIuLi5cIilcbiAgICAgIC5yZXBsYWNlKC9e4oCmJC8sIFwiLi4uXCIpXG4gICAgICAudHJpbSgpXG4gICAgICAudG9Mb3dlckNhc2UoKVxuICB9XG5cbiAgdmFyIGJsb2Nrc0J5U2VsZWN0b3IgPSB7fVxuICB2YXIgYmxvY2tzQnlTcGVjID0ge31cbiAgdmFyIGFsbEJsb2NrcyA9IHNjcmF0Y2hDb21tYW5kcy5tYXAoZnVuY3Rpb24oY29tbWFuZCkge1xuICAgIHZhciBpbmZvID0gZXh0ZW5kKHBhcnNlU3BlYyhjb21tYW5kWzBdKSwge1xuICAgICAgc2hhcGU6IHR5cGVTaGFwZXNbY29tbWFuZFsxXV0sIC8vIC9bIGJjZWZocl18Y2YvXG4gICAgICBjYXRlZ29yeTogY2F0ZWdvcmllc0J5SWRbY29tbWFuZFsyXSAlIDEwMF0sXG4gICAgICBzZWxlY3RvcjogY29tbWFuZFszXSxcbiAgICAgIGhhc0xvb3BBcnJvdzpcbiAgICAgICAgW1wiZG9SZXBlYXRcIiwgXCJkb1VudGlsXCIsIFwiZG9Gb3JldmVyXCJdLmluZGV4T2YoY29tbWFuZFszXSkgPiAtMSxcbiAgICB9KVxuICAgIGlmIChpbmZvLnNlbGVjdG9yKSB7XG4gICAgICAvLyBuYi4gY29tbWFuZCBvcmRlciBtYXR0ZXJzIVxuICAgICAgLy8gU2NyYXRjaCAxLjQgYmxvY2tzIGFyZSBsaXN0ZWQgbGFzdFxuICAgICAgaWYgKCFibG9ja3NCeVNlbGVjdG9yW2luZm8uc2VsZWN0b3JdKVxuICAgICAgICBibG9ja3NCeVNlbGVjdG9yW2luZm8uc2VsZWN0b3JdID0gaW5mb1xuICAgIH1cbiAgICByZXR1cm4gKGJsb2Nrc0J5U3BlY1tpbmZvLnNwZWNdID0gaW5mbylcbiAgfSlcblxuICB2YXIgdW5pY29kZUljb25zID0ge1xuICAgIFwiQGdyZWVuRmxhZ1wiOiBcIuKakVwiLFxuICAgIFwiQHR1cm5SaWdodFwiOiBcIuKGu1wiLFxuICAgIFwiQHR1cm5MZWZ0XCI6IFwi4oa6XCIsXG4gICAgXCJAYWRkSW5wdXRcIjogXCLilrhcIixcbiAgICBcIkBkZWxJbnB1dFwiOiBcIuKXglwiLFxuICB9XG5cbiAgdmFyIGFsbExhbmd1YWdlcyA9IHt9XG4gIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZShjb2RlLCBsYW5ndWFnZSkge1xuICAgIHZhciBibG9ja3NCeUhhc2ggPSAobGFuZ3VhZ2UuYmxvY2tzQnlIYXNoID0ge30pXG5cbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZS5jb21tYW5kcykuZm9yRWFjaChmdW5jdGlvbihzcGVjKSB7XG4gICAgICB2YXIgbmF0aXZlU3BlYyA9IGxhbmd1YWdlLmNvbW1hbmRzW3NwZWNdXG4gICAgICB2YXIgYmxvY2sgPSBibG9ja3NCeVNwZWNbc3BlY11cblxuICAgICAgdmFyIG5hdGl2ZUhhc2ggPSBoYXNoU3BlYyhuYXRpdmVTcGVjKVxuICAgICAgYmxvY2tzQnlIYXNoW25hdGl2ZUhhc2hdID0gYmxvY2tcblxuICAgICAgLy8gZmFsbGJhY2sgaW1hZ2UgcmVwbGFjZW1lbnQsIGZvciBsYW5ndWFnZXMgd2l0aG91dCBhbGlhc2VzXG4gICAgICB2YXIgbSA9IGljb25QYXQuZXhlYyhzcGVjKVxuICAgICAgaWYgKG0pIHtcbiAgICAgICAgdmFyIGltYWdlID0gbVswXVxuICAgICAgICB2YXIgaGFzaCA9IG5hdGl2ZUhhc2gucmVwbGFjZShpbWFnZSwgdW5pY29kZUljb25zW2ltYWdlXSlcbiAgICAgICAgYmxvY2tzQnlIYXNoW2hhc2hdID0gYmxvY2tcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgbGFuZ3VhZ2UubmF0aXZlQWxpYXNlcyA9IHt9XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuYWxpYXNlcykuZm9yRWFjaChmdW5jdGlvbihhbGlhcykge1xuICAgICAgdmFyIHNwZWMgPSBsYW5ndWFnZS5hbGlhc2VzW2FsaWFzXVxuICAgICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTcGVjW3NwZWNdXG5cbiAgICAgIHZhciBhbGlhc0hhc2ggPSBoYXNoU3BlYyhhbGlhcylcbiAgICAgIGJsb2Nrc0J5SGFzaFthbGlhc0hhc2hdID0gYmxvY2tcblxuICAgICAgbGFuZ3VhZ2UubmF0aXZlQWxpYXNlc1tzcGVjXSA9IGFsaWFzXG4gICAgfSlcblxuICAgIGxhbmd1YWdlLm5hdGl2ZURyb3Bkb3ducyA9IHt9XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuZHJvcGRvd25zKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBuYXRpdmVOYW1lID0gbGFuZ3VhZ2UuZHJvcGRvd25zW25hbWVdXG4gICAgICBsYW5ndWFnZS5uYXRpdmVEcm9wZG93bnNbbmF0aXZlTmFtZV0gPSBuYW1lXG4gICAgfSlcblxuICAgIGxhbmd1YWdlLmNvZGUgPSBjb2RlXG4gICAgYWxsTGFuZ3VhZ2VzW2NvZGVdID0gbGFuZ3VhZ2VcbiAgfVxuICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzKGxhbmd1YWdlcykge1xuICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlcykuZm9yRWFjaChmdW5jdGlvbihjb2RlKSB7XG4gICAgICBsb2FkTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2VzW2NvZGVdKVxuICAgIH0pXG4gIH1cblxuICB2YXIgZW5nbGlzaCA9IHtcbiAgICBhbGlhc2VzOiB7XG4gICAgICBcInR1cm4gbGVmdCAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ0dXJuIGNjdyAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ0dXJuIHJpZ2h0ICVuIGRlZ3JlZXNcIjogXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ0dXJuIGN3ICVuIGRlZ3JlZXNcIjogXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLFxuICAgICAgXCJ3aGVuIGdmIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgICAgXCJ3aGVuIGZsYWcgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgICBcIndoZW4gZ3JlZW4gZmxhZyBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICB9LFxuXG4gICAgZGVmaW5lOiBbXCJkZWZpbmVcIl0sXG5cbiAgICAvLyBGb3IgaWdub3JpbmcgdGhlIGx0IHNpZ24gaW4gdGhlIFwid2hlbiBkaXN0YW5jZSA8IF9cIiBibG9ja1xuICAgIGlnbm9yZWx0OiBbXCJ3aGVuIGRpc3RhbmNlXCJdLFxuXG4gICAgLy8gVmFsaWQgYXJndW1lbnRzIHRvIFwib2ZcIiBkcm9wZG93biwgZm9yIHJlc29sdmluZyBhbWJpZ3VvdXMgc2l0dWF0aW9uc1xuICAgIG1hdGg6IFtcbiAgICAgIFwiYWJzXCIsXG4gICAgICBcImZsb29yXCIsXG4gICAgICBcImNlaWxpbmdcIixcbiAgICAgIFwic3FydFwiLFxuICAgICAgXCJzaW5cIixcbiAgICAgIFwiY29zXCIsXG4gICAgICBcInRhblwiLFxuICAgICAgXCJhc2luXCIsXG4gICAgICBcImFjb3NcIixcbiAgICAgIFwiYXRhblwiLFxuICAgICAgXCJsblwiLFxuICAgICAgXCJsb2dcIixcbiAgICAgIFwiZSBeXCIsXG4gICAgICBcIjEwIF5cIixcbiAgICBdLFxuXG4gICAgLy8gRm9yIGRldGVjdGluZyB0aGUgXCJzdG9wXCIgY2FwIC8gc3RhY2sgYmxvY2tcbiAgICBvc2lzOiBbXCJvdGhlciBzY3JpcHRzIGluIHNwcml0ZVwiLCBcIm90aGVyIHNjcmlwdHMgaW4gc3RhZ2VcIl0sXG5cbiAgICBkcm9wZG93bnM6IHt9LFxuXG4gICAgY29tbWFuZHM6IHt9LFxuICB9XG4gIGFsbEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGluZm8pIHtcbiAgICBlbmdsaXNoLmNvbW1hbmRzW2luZm8uc3BlY10gPSBpbmZvLnNwZWNcbiAgfSksXG4gICAgbG9hZExhbmd1YWdlcyh7XG4gICAgICBlbjogZW5nbGlzaCxcbiAgICB9KVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICBmdW5jdGlvbiBkaXNhbWJpZyhzZWxlY3RvcjEsIHNlbGVjdG9yMiwgdGVzdCkge1xuICAgIHZhciBmdW5jID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAgIHJldHVybiBibG9ja3NCeVNlbGVjdG9yW3Rlc3QoY2hpbGRyZW4sIGxhbmcpID8gc2VsZWN0b3IxIDogc2VsZWN0b3IyXVxuICAgIH1cbiAgICBibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yMV0uc3BlY2lhbENhc2UgPSBibG9ja3NCeVNlbGVjdG9yW1xuICAgICAgc2VsZWN0b3IyXG4gICAgXS5zcGVjaWFsQ2FzZSA9IGZ1bmNcbiAgfVxuXG4gIGRpc2FtYmlnKFwiY29tcHV0ZUZ1bmN0aW9uOm9mOlwiLCBcImdldEF0dHJpYnV0ZTpvZjpcIiwgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBPcGVyYXRvcnMgaWYgbWF0aCBmdW5jdGlvbiwgb3RoZXJ3aXNlIHNlbnNpbmcgXCJhdHRyaWJ1dGUgb2ZcIiBibG9ja1xuICAgIHZhciBmaXJzdCA9IGNoaWxkcmVuWzBdXG4gICAgaWYgKCFmaXJzdC5pc0lucHV0KSByZXR1cm5cbiAgICB2YXIgbmFtZSA9IGZpcnN0LnZhbHVlXG4gICAgcmV0dXJuIGxhbmcubWF0aC5pbmRleE9mKG5hbWUpID4gLTFcbiAgfSlcblxuICBkaXNhbWJpZyhcImxpbmVDb3VudE9mTGlzdDpcIiwgXCJzdHJpbmdMZW5ndGg6XCIsIGZ1bmN0aW9uKGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gTGlzdCBibG9jayBpZiBkcm9wZG93biwgb3RoZXJ3aXNlIG9wZXJhdG9yc1xuICAgIHZhciBsYXN0ID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICBpZiAoIWxhc3QuaXNJbnB1dCkgcmV0dXJuXG4gICAgcmV0dXJuIGxhc3Quc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuICB9KVxuXG4gIGRpc2FtYmlnKFwicGVuQ29sb3I6XCIsIFwic2V0UGVuSHVlVG86XCIsIGZ1bmN0aW9uKGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gQ29sb3IgYmxvY2sgaWYgY29sb3IgaW5wdXQsIG90aGVyd2lzZSBudW1lcmljXG4gICAgdmFyIGxhc3QgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgIC8vIElmIHZhcmlhYmxlLCBhc3N1bWUgY29sb3IgaW5wdXQsIHNpbmNlIHRoZSBSR0JBIGhhY2sgaXMgY29tbW9uLlxuICAgIC8vIFRPRE8gZml4IFNjcmF0Y2ggOlBcbiAgICByZXR1cm4gKGxhc3QuaXNJbnB1dCAmJiBsYXN0LmlzQ29sb3IpIHx8IGxhc3QuaXNCbG9ja1xuICB9KVxuXG4gIGJsb2Nrc0J5U2VsZWN0b3JbXCJzdG9wU2NyaXB0c1wiXS5zcGVjaWFsQ2FzZSA9IGZ1bmN0aW9uKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gQ2FwIGJsb2NrIHVubGVzcyBhcmd1bWVudCBpcyBcIm90aGVyIHNjcmlwdHMgaW4gc3ByaXRlXCJcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgaWYgKCFsYXN0LmlzSW5wdXQpIHJldHVyblxuICAgIHZhciB2YWx1ZSA9IGxhc3QudmFsdWVcbiAgICBpZiAobGFuZy5vc2lzLmluZGV4T2YodmFsdWUpID4gLTEpIHtcbiAgICAgIHJldHVybiBleHRlbmQoYmxvY2tzQnlTZWxlY3RvcltcInN0b3BTY3JpcHRzXCJdLCB7XG4gICAgICAgIHNoYXBlOiBcInN0YWNrXCIsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvb2t1cEhhc2goaGFzaCwgaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGFuZyA9IGxhbmd1YWdlc1tpXVxuICAgICAgaWYgKGxhbmcuYmxvY2tzQnlIYXNoLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgIHZhciBibG9jayA9IGxhbmcuYmxvY2tzQnlIYXNoW2hhc2hdXG4gICAgICAgIGlmIChpbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCIgJiYgYmxvY2suc2hhcGUgIT09IFwicmVwb3J0ZXJcIikgY29udGludWVcbiAgICAgICAgaWYgKGluZm8uc2hhcGUgPT09IFwiYm9vbGVhblwiICYmIGJsb2NrLnNoYXBlICE9PSBcImJvb2xlYW5cIikgY29udGludWVcbiAgICAgICAgaWYgKGJsb2NrLnNwZWNpYWxDYXNlKSB7XG4gICAgICAgICAgYmxvY2sgPSBibG9jay5zcGVjaWFsQ2FzZShpbmZvLCBjaGlsZHJlbiwgbGFuZykgfHwgYmxvY2tcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBibG9jaywgbGFuZzogbGFuZyB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9va3VwRHJvcGRvd24obmFtZSwgbGFuZ3VhZ2VzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYW5ndWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsYW5nID0gbGFuZ3VhZ2VzW2ldXG4gICAgICBpZiAobGFuZy5uYXRpdmVEcm9wZG93bnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgdmFyIG5hdGl2ZU5hbWUgPSBsYW5nLm5hdGl2ZURyb3Bkb3duc1tuYW1lXVxuICAgICAgICByZXR1cm4gbmF0aXZlTmFtZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5T3ZlcnJpZGVzKGluZm8sIG92ZXJyaWRlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbmFtZSA9IG92ZXJyaWRlc1tpXVxuICAgICAgaWYgKGhleENvbG9yUGF0LnRlc3QobmFtZSkpIHtcbiAgICAgICAgaW5mby5jb2xvciA9IG5hbWVcbiAgICAgICAgaW5mby5jYXRlZ29yeSA9IFwiXCJcbiAgICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlQ2F0ZWdvcmllcy5pbmRleE9mKG5hbWUpID4gLTEpIHtcbiAgICAgICAgaW5mby5jYXRlZ29yeSA9IG5hbWVcbiAgICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlU2hhcGVzLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgICBpbmZvLnNoYXBlID0gbmFtZVxuICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcImxvb3BcIikge1xuICAgICAgICBpbmZvLmhhc0xvb3BBcnJvdyA9IHRydWVcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCIrXCIgfHwgbmFtZSA9PT0gXCItXCIpIHtcbiAgICAgICAgaW5mby5kaWZmID0gbmFtZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJsb2NrTmFtZShibG9jaykge1xuICAgIHZhciB3b3JkcyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9jay5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gYmxvY2suY2hpbGRyZW5baV1cbiAgICAgIGlmICghY2hpbGQuaXNMYWJlbCkgcmV0dXJuXG4gICAgICB3b3Jkcy5wdXNoKGNoaWxkLnZhbHVlKVxuICAgIH1cbiAgICByZXR1cm4gd29yZHMuam9pbihcIiBcIilcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbG9hZExhbmd1YWdlcyxcblxuICAgIGJsb2NrTmFtZSxcblxuICAgIGFsbExhbmd1YWdlcyxcbiAgICBsb29rdXBEcm9wZG93bixcbiAgICBoZXhDb2xvclBhdCxcbiAgICBtaW5pZnlIYXNoLFxuICAgIGxvb2t1cEhhc2gsXG4gICAgYXBwbHlPdmVycmlkZXMsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIGljb25QYXQsXG4gICAgaGFzaFNwZWMsXG5cbiAgICBibG9ja3NCeVNlbGVjdG9yLFxuICAgIHBhcnNlU3BlYyxcbiAgICBpbnB1dFBhdCxcbiAgICB1bmljb2RlSWNvbnMsXG4gICAgZW5nbGlzaCxcbiAgfVxufSkoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIFtcIm1vdmUgJW4gc3RlcHNcIiwgXCIgXCIsIDEsIFwiZm9yd2FyZDpcIl0sXG4gIFtcInR1cm4gQHR1cm5SaWdodCAlbiBkZWdyZWVzXCIsIFwiIFwiLCAxLCBcInR1cm5SaWdodDpcIl0sXG4gIFtcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIiwgXCIgXCIsIDEsIFwidHVybkxlZnQ6XCJdLFxuICBbXCJwb2ludCBpbiBkaXJlY3Rpb24gJWQuZGlyZWN0aW9uXCIsIFwiIFwiLCAxLCBcImhlYWRpbmc6XCJdLFxuICBbXCJwb2ludCB0b3dhcmRzICVtLnNwcml0ZU9yTW91c2VcIiwgXCIgXCIsIDEsIFwicG9pbnRUb3dhcmRzOlwiXSxcbiAgW1wiZ28gdG8geDolbiB5OiVuXCIsIFwiIFwiLCAxLCBcImdvdG9YOnk6XCJdLFxuICBbXCJnbyB0byAlbS5sb2NhdGlvblwiLCBcIiBcIiwgMSwgXCJnb3RvU3ByaXRlT3JNb3VzZTpcIl0sXG4gIFtcImdsaWRlICVuIHNlY3MgdG8geDolbiB5OiVuXCIsIFwiIFwiLCAxLCBcImdsaWRlU2Vjczp0b1g6eTplbGFwc2VkOmZyb206XCJdLFxuICBbXCJjaGFuZ2UgeCBieSAlblwiLCBcIiBcIiwgMSwgXCJjaGFuZ2VYcG9zQnk6XCJdLFxuICBbXCJzZXQgeCB0byAlblwiLCBcIiBcIiwgMSwgXCJ4cG9zOlwiXSxcbiAgW1wiY2hhbmdlIHkgYnkgJW5cIiwgXCIgXCIsIDEsIFwiY2hhbmdlWXBvc0J5OlwiXSxcbiAgW1wic2V0IHkgdG8gJW5cIiwgXCIgXCIsIDEsIFwieXBvczpcIl0sXG4gIFtcInNldCByb3RhdGlvbiBzdHlsZSAlbS5yb3RhdGlvblN0eWxlXCIsIFwiIFwiLCAxLCBcInNldFJvdGF0aW9uU3R5bGVcIl0sXG4gIFtcInNheSAlcyBmb3IgJW4gc2Vjc1wiLCBcIiBcIiwgMiwgXCJzYXk6ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wic2F5ICVzXCIsIFwiIFwiLCAyLCBcInNheTpcIl0sXG4gIFtcInRoaW5rICVzIGZvciAlbiBzZWNzXCIsIFwiIFwiLCAyLCBcInRoaW5rOmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInRoaW5rICVzXCIsIFwiIFwiLCAyLCBcInRoaW5rOlwiXSxcbiAgW1wic2hvd1wiLCBcIiBcIiwgMiwgXCJzaG93XCJdLFxuICBbXCJoaWRlXCIsIFwiIFwiLCAyLCBcImhpZGVcIl0sXG4gIFtcInN3aXRjaCBjb3N0dW1lIHRvICVtLmNvc3R1bWVcIiwgXCIgXCIsIDIsIFwibG9va0xpa2U6XCJdLFxuICBbXCJuZXh0IGNvc3R1bWVcIiwgXCIgXCIsIDIsIFwibmV4dENvc3R1bWVcIl0sXG4gIFtcIm5leHQgYmFja2Ryb3BcIiwgXCIgXCIsIDEwMiwgXCJuZXh0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCBiYWNrZHJvcCB0byAlbS5iYWNrZHJvcFwiLCBcIiBcIiwgMiwgXCJzdGFydFNjZW5lXCJdLFxuICBbXCJzd2l0Y2ggYmFja2Ryb3AgdG8gJW0uYmFja2Ryb3AgYW5kIHdhaXRcIiwgXCIgXCIsIDEwMiwgXCJzdGFydFNjZW5lQW5kV2FpdFwiXSxcbiAgW1wiY2hhbmdlICVtLmVmZmVjdCBlZmZlY3QgYnkgJW5cIiwgXCIgXCIsIDIsIFwiY2hhbmdlR3JhcGhpY0VmZmVjdDpieTpcIl0sXG4gIFtcInNldCAlbS5lZmZlY3QgZWZmZWN0IHRvICVuXCIsIFwiIFwiLCAyLCBcInNldEdyYXBoaWNFZmZlY3Q6dG86XCJdLFxuICBbXCJjbGVhciBncmFwaGljIGVmZmVjdHNcIiwgXCIgXCIsIDIsIFwiZmlsdGVyUmVzZXRcIl0sXG4gIFtcImNoYW5nZSBzaXplIGJ5ICVuXCIsIFwiIFwiLCAyLCBcImNoYW5nZVNpemVCeTpcIl0sXG4gIFtcInNldCBzaXplIHRvICVuJVwiLCBcIiBcIiwgMiwgXCJzZXRTaXplVG86XCJdLFxuICBbXCJnbyB0byBmcm9udFwiLCBcIiBcIiwgMiwgXCJjb21lVG9Gcm9udFwiXSxcbiAgW1wiZ28gYmFjayAlbiBsYXllcnNcIiwgXCIgXCIsIDIsIFwiZ29CYWNrQnlMYXllcnM6XCJdLFxuICBbXCJwbGF5IHNvdW5kICVtLnNvdW5kXCIsIFwiIFwiLCAzLCBcInBsYXlTb3VuZDpcIl0sXG4gIFtcInBsYXkgc291bmQgJW0uc291bmQgdW50aWwgZG9uZVwiLCBcIiBcIiwgMywgXCJkb1BsYXlTb3VuZEFuZFdhaXRcIl0sXG4gIFtcInN0b3AgYWxsIHNvdW5kc1wiLCBcIiBcIiwgMywgXCJzdG9wQWxsU291bmRzXCJdLFxuICBbXCJwbGF5IGRydW0gJWQuZHJ1bSBmb3IgJW4gYmVhdHNcIiwgXCIgXCIsIDMsIFwicGxheURydW1cIl0sXG4gIFtcInJlc3QgZm9yICVuIGJlYXRzXCIsIFwiIFwiLCAzLCBcInJlc3Q6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wicGxheSBub3RlICVkLm5vdGUgZm9yICVuIGJlYXRzXCIsIFwiIFwiLCAzLCBcIm5vdGVPbjpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJzZXQgaW5zdHJ1bWVudCB0byAlZC5pbnN0cnVtZW50XCIsIFwiIFwiLCAzLCBcImluc3RydW1lbnQ6XCJdLFxuICBbXCJjaGFuZ2Ugdm9sdW1lIGJ5ICVuXCIsIFwiIFwiLCAzLCBcImNoYW5nZVZvbHVtZUJ5OlwiXSxcbiAgW1wic2V0IHZvbHVtZSB0byAlbiVcIiwgXCIgXCIsIDMsIFwic2V0Vm9sdW1lVG86XCJdLFxuICBbXCJjaGFuZ2UgdGVtcG8gYnkgJW5cIiwgXCIgXCIsIDMsIFwiY2hhbmdlVGVtcG9CeTpcIl0sXG4gIFtcInNldCB0ZW1wbyB0byAlbiBicG1cIiwgXCIgXCIsIDMsIFwic2V0VGVtcG9UbzpcIl0sXG4gIFtcImNsZWFyXCIsIFwiIFwiLCA0LCBcImNsZWFyUGVuVHJhaWxzXCJdLFxuICBbXCJzdGFtcFwiLCBcIiBcIiwgNCwgXCJzdGFtcENvc3R1bWVcIl0sXG4gIFtcInBlbiBkb3duXCIsIFwiIFwiLCA0LCBcInB1dFBlbkRvd25cIl0sXG4gIFtcInBlbiB1cFwiLCBcIiBcIiwgNCwgXCJwdXRQZW5VcFwiXSxcbiAgW1wic2V0IHBlbiBjb2xvciB0byAlY1wiLCBcIiBcIiwgNCwgXCJwZW5Db2xvcjpcIl0sXG4gIFtcImNoYW5nZSBwZW4gY29sb3IgYnkgJW5cIiwgXCIgXCIsIDQsIFwiY2hhbmdlUGVuSHVlQnk6XCJdLFxuICBbXCJzZXQgcGVuIGNvbG9yIHRvICVuXCIsIFwiIFwiLCA0LCBcInNldFBlbkh1ZVRvOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBzaGFkZSBieSAlblwiLCBcIiBcIiwgNCwgXCJjaGFuZ2VQZW5TaGFkZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaGFkZSB0byAlblwiLCBcIiBcIiwgNCwgXCJzZXRQZW5TaGFkZVRvOlwiXSxcbiAgW1wiY2hhbmdlIHBlbiBzaXplIGJ5ICVuXCIsIFwiIFwiLCA0LCBcImNoYW5nZVBlblNpemVCeTpcIl0sXG4gIFtcInNldCBwZW4gc2l6ZSB0byAlblwiLCBcIiBcIiwgNCwgXCJwZW5TaXplOlwiXSxcbiAgW1wid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIiwgXCJoXCIsIDUsIFwid2hlbkdyZWVuRmxhZ1wiXSxcbiAgW1wid2hlbiAlbS5rZXkga2V5IHByZXNzZWRcIiwgXCJoXCIsIDUsIFwid2hlbktleVByZXNzZWRcIl0sXG4gIFtcIndoZW4gdGhpcyBzcHJpdGUgY2xpY2tlZFwiLCBcImhcIiwgNSwgXCJ3aGVuQ2xpY2tlZFwiXSxcbiAgW1wid2hlbiBiYWNrZHJvcCBzd2l0Y2hlcyB0byAlbS5iYWNrZHJvcFwiLCBcImhcIiwgNSwgXCJ3aGVuU2NlbmVTdGFydHNcIl0sXG4gIFtcIndoZW4gJW0udHJpZ2dlclNlbnNvciA+ICVuXCIsIFwiaFwiLCA1LCBcIndoZW5TZW5zb3JHcmVhdGVyVGhhblwiXSxcbiAgW1wid2hlbiBJIHJlY2VpdmUgJW0uYnJvYWRjYXN0XCIsIFwiaFwiLCA1LCBcIndoZW5JUmVjZWl2ZVwiXSxcbiAgW1wiYnJvYWRjYXN0ICVtLmJyb2FkY2FzdFwiLCBcIiBcIiwgNSwgXCJicm9hZGNhc3Q6XCJdLFxuICBbXCJicm9hZGNhc3QgJW0uYnJvYWRjYXN0IGFuZCB3YWl0XCIsIFwiIFwiLCA1LCBcImRvQnJvYWRjYXN0QW5kV2FpdFwiXSxcbiAgW1wid2FpdCAlbiBzZWNzXCIsIFwiIFwiLCA2LCBcIndhaXQ6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wicmVwZWF0ICVuXCIsIFwiY1wiLCA2LCBcImRvUmVwZWF0XCJdLFxuICBbXCJmb3JldmVyXCIsIFwiY2ZcIiwgNiwgXCJkb0ZvcmV2ZXJcIl0sXG4gIFtcImlmICViIHRoZW5cIiwgXCJjXCIsIDYsIFwiZG9JZlwiXSxcbiAgW1wiaWYgJWIgdGhlblwiLCBcImVcIiwgNiwgXCJkb0lmRWxzZVwiXSxcbiAgW1wid2FpdCB1bnRpbCAlYlwiLCBcIiBcIiwgNiwgXCJkb1dhaXRVbnRpbFwiXSxcbiAgW1wicmVwZWF0IHVudGlsICViXCIsIFwiY1wiLCA2LCBcImRvVW50aWxcIl0sXG4gIFtcInN0b3AgJW0uc3RvcFwiLCBcImZcIiwgNiwgXCJzdG9wU2NyaXB0c1wiXSxcbiAgW1wid2hlbiBJIHN0YXJ0IGFzIGEgY2xvbmVcIiwgXCJoXCIsIDYsIFwid2hlbkNsb25lZFwiXSxcbiAgW1wiY3JlYXRlIGNsb25lIG9mICVtLnNwcml0ZU9ubHlcIiwgXCIgXCIsIDYsIFwiY3JlYXRlQ2xvbmVPZlwiXSxcbiAgW1wiZGVsZXRlIHRoaXMgY2xvbmVcIiwgXCJmXCIsIDYsIFwiZGVsZXRlQ2xvbmVcIl0sXG4gIFtcImFzayAlcyBhbmQgd2FpdFwiLCBcIiBcIiwgNywgXCJkb0Fza1wiXSxcbiAgW1widHVybiB2aWRlbyAlbS52aWRlb1N0YXRlXCIsIFwiIFwiLCA3LCBcInNldFZpZGVvU3RhdGVcIl0sXG4gIFtcInNldCB2aWRlbyB0cmFuc3BhcmVuY3kgdG8gJW4lXCIsIFwiIFwiLCA3LCBcInNldFZpZGVvVHJhbnNwYXJlbmN5XCJdLFxuICBbXCJyZXNldCB0aW1lclwiLCBcIiBcIiwgNywgXCJ0aW1lclJlc2V0XCJdLFxuICBbXCJzZXQgJW0udmFyIHRvICVzXCIsIFwiIFwiLCA5LCBcInNldFZhcjp0bzpcIl0sXG4gIFtcImNoYW5nZSAlbS52YXIgYnkgJW5cIiwgXCIgXCIsIDksIFwiY2hhbmdlVmFyOmJ5OlwiXSxcbiAgW1wic2hvdyB2YXJpYWJsZSAlbS52YXJcIiwgXCIgXCIsIDksIFwic2hvd1ZhcmlhYmxlOlwiXSxcbiAgW1wiaGlkZSB2YXJpYWJsZSAlbS52YXJcIiwgXCIgXCIsIDksIFwiaGlkZVZhcmlhYmxlOlwiXSxcbiAgW1wiYWRkICVzIHRvICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImFwcGVuZDp0b0xpc3Q6XCJdLFxuICBbXCJkZWxldGUgJWQubGlzdERlbGV0ZUl0ZW0gb2YgJW0ubGlzdFwiLCBcIiBcIiwgMTIsIFwiZGVsZXRlTGluZTpvZkxpc3Q6XCJdLFxuICBbXCJpZiBvbiBlZGdlLCBib3VuY2VcIiwgXCIgXCIsIDEsIFwiYm91bmNlT2ZmRWRnZVwiXSxcbiAgW1wiaW5zZXJ0ICVzIGF0ICVkLmxpc3RJdGVtIG9mICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImluc2VydDphdDpvZkxpc3Q6XCJdLFxuICBbXG4gICAgXCJyZXBsYWNlIGl0ZW0gJWQubGlzdEl0ZW0gb2YgJW0ubGlzdCB3aXRoICVzXCIsXG4gICAgXCIgXCIsXG4gICAgMTIsXG4gICAgXCJzZXRMaW5lOm9mTGlzdDp0bzpcIixcbiAgXSxcbiAgW1wic2hvdyBsaXN0ICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcInNob3dMaXN0OlwiXSxcbiAgW1wiaGlkZSBsaXN0ICVtLmxpc3RcIiwgXCIgXCIsIDEyLCBcImhpZGVMaXN0OlwiXSxcblxuICBbXCJ4IHBvc2l0aW9uXCIsIFwiclwiLCAxLCBcInhwb3NcIl0sXG4gIFtcInkgcG9zaXRpb25cIiwgXCJyXCIsIDEsIFwieXBvc1wiXSxcbiAgW1wiZGlyZWN0aW9uXCIsIFwiclwiLCAxLCBcImhlYWRpbmdcIl0sXG4gIFtcImNvc3R1bWUgI1wiLCBcInJcIiwgMiwgXCJjb3N0dW1lSW5kZXhcIl0sXG4gIFtcInNpemVcIiwgXCJyXCIsIDIsIFwic2NhbGVcIl0sXG4gIFtcImJhY2tkcm9wIG5hbWVcIiwgXCJyXCIsIDEwMiwgXCJzY2VuZU5hbWVcIl0sXG4gIFtcImJhY2tkcm9wICNcIiwgXCJyXCIsIDEwMiwgXCJiYWNrZ3JvdW5kSW5kZXhcIl0sXG4gIFtcInZvbHVtZVwiLCBcInJcIiwgMywgXCJ2b2x1bWVcIl0sXG4gIFtcInRlbXBvXCIsIFwiclwiLCAzLCBcInRlbXBvXCJdLFxuICBbXCJ0b3VjaGluZyAlbS50b3VjaGluZz9cIiwgXCJiXCIsIDcsIFwidG91Y2hpbmc6XCJdLFxuICBbXCJ0b3VjaGluZyBjb2xvciAlYz9cIiwgXCJiXCIsIDcsIFwidG91Y2hpbmdDb2xvcjpcIl0sXG4gIFtcImNvbG9yICVjIGlzIHRvdWNoaW5nICVjP1wiLCBcImJcIiwgNywgXCJjb2xvcjpzZWVzOlwiXSxcbiAgW1wiZGlzdGFuY2UgdG8gJW0uc3ByaXRlT3JNb3VzZVwiLCBcInJcIiwgNywgXCJkaXN0YW5jZVRvOlwiXSxcbiAgW1wiYW5zd2VyXCIsIFwiclwiLCA3LCBcImFuc3dlclwiXSxcbiAgW1wia2V5ICVtLmtleSBwcmVzc2VkP1wiLCBcImJcIiwgNywgXCJrZXlQcmVzc2VkOlwiXSxcbiAgW1wibW91c2UgZG93bj9cIiwgXCJiXCIsIDcsIFwibW91c2VQcmVzc2VkXCJdLFxuICBbXCJtb3VzZSB4XCIsIFwiclwiLCA3LCBcIm1vdXNlWFwiXSxcbiAgW1wibW91c2UgeVwiLCBcInJcIiwgNywgXCJtb3VzZVlcIl0sXG4gIFtcImxvdWRuZXNzXCIsIFwiclwiLCA3LCBcInNvdW5kTGV2ZWxcIl0sXG4gIFtcInZpZGVvICVtLnZpZGVvTW90aW9uVHlwZSBvbiAlbS5zdGFnZU9yVGhpc1wiLCBcInJcIiwgNywgXCJzZW5zZVZpZGVvTW90aW9uXCJdLFxuICBbXCJ0aW1lclwiLCBcInJcIiwgNywgXCJ0aW1lclwiXSxcbiAgW1wiJW0uYXR0cmlidXRlIG9mICVtLnNwcml0ZU9yU3RhZ2VcIiwgXCJyXCIsIDcsIFwiZ2V0QXR0cmlidXRlOm9mOlwiXSxcbiAgW1wiY3VycmVudCAlbS50aW1lQW5kRGF0ZVwiLCBcInJcIiwgNywgXCJ0aW1lQW5kRGF0ZVwiXSxcbiAgW1wiZGF5cyBzaW5jZSAyMDAwXCIsIFwiclwiLCA3LCBcInRpbWVzdGFtcFwiXSxcbiAgW1widXNlcm5hbWVcIiwgXCJyXCIsIDcsIFwiZ2V0VXNlck5hbWVcIl0sXG4gIFtcIiVuICsgJW5cIiwgXCJyXCIsIDgsIFwiK1wiXSxcbiAgW1wiJW4gLSAlblwiLCBcInJcIiwgOCwgXCItXCJdLFxuICBbXCIlbiAqICVuXCIsIFwiclwiLCA4LCBcIipcIl0sXG4gIFtcIiVuIC8gJW5cIiwgXCJyXCIsIDgsIFwiL1wiXSxcbiAgW1wicGljayByYW5kb20gJW4gdG8gJW5cIiwgXCJyXCIsIDgsIFwicmFuZG9tRnJvbTp0bzpcIl0sXG4gIFtcIiVzIDwgJXNcIiwgXCJiXCIsIDgsIFwiPFwiXSxcbiAgW1wiJXMgPSAlc1wiLCBcImJcIiwgOCwgXCI9XCJdLFxuICBbXCIlcyA+ICVzXCIsIFwiYlwiLCA4LCBcIj5cIl0sXG4gIFtcIiViIGFuZCAlYlwiLCBcImJcIiwgOCwgXCImXCJdLFxuICBbXCIlYiBvciAlYlwiLCBcImJcIiwgOCwgXCJ8XCJdLFxuICBbXCJub3QgJWJcIiwgXCJiXCIsIDgsIFwibm90XCJdLFxuICBbXCJqb2luICVzICVzXCIsIFwiclwiLCA4LCBcImNvbmNhdGVuYXRlOndpdGg6XCJdLFxuICBbXCJsZXR0ZXIgJW4gb2YgJXNcIiwgXCJyXCIsIDgsIFwibGV0dGVyOm9mOlwiXSxcbiAgW1wibGVuZ3RoIG9mICVzXCIsIFwiclwiLCA4LCBcInN0cmluZ0xlbmd0aDpcIl0sXG4gIFtcIiVuIG1vZCAlblwiLCBcInJcIiwgOCwgXCIlXCJdLFxuICBbXCJyb3VuZCAlblwiLCBcInJcIiwgOCwgXCJyb3VuZGVkXCJdLFxuICBbXCIlbS5tYXRoT3Agb2YgJW5cIiwgXCJyXCIsIDgsIFwiY29tcHV0ZUZ1bmN0aW9uOm9mOlwiXSxcbiAgW1wiaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0XCIsIFwiclwiLCAxMiwgXCJnZXRMaW5lOm9mTGlzdDpcIl0sXG4gIFtcImxlbmd0aCBvZiAlbS5saXN0XCIsIFwiclwiLCAxMiwgXCJsaW5lQ291bnRPZkxpc3Q6XCJdLFxuICBbXCIlbS5saXN0IGNvbnRhaW5zICVzP1wiLCBcImJcIiwgMTIsIFwibGlzdDpjb250YWluczpcIl0sXG5cbiAgW1wid2hlbiAlbS5ib29sZWFuU2Vuc29yXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gJW0uc2Vuc29yICVtLmxlc3NNb3JlICVuXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcInNlbnNvciAlbS5ib29sZWFuU2Vuc29yP1wiLCBcImJcIiwgMjAsIFwiXCJdLFxuICBbXCIlbS5zZW5zb3Igc2Vuc29yIHZhbHVlXCIsIFwiclwiLCAyMCwgXCJcIl0sXG5cbiAgW1widHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ0dXJuICVtLm1vdG9yIG9uXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInR1cm4gJW0ubW90b3Igb2ZmXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInNldCAlbS5tb3RvciBwb3dlciB0byAlblwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJzZXQgJW0ubW90b3IyIGRpcmVjdGlvbiB0byAlbS5tb3RvckRpcmVjdGlvblwiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ3aGVuIGRpc3RhbmNlICVtLmxlc3NNb3JlICVuXCIsIFwiaFwiLCAyMCwgXCJcIl0sXG4gIFtcIndoZW4gdGlsdCAlbS5lTmUgJW5cIiwgXCJoXCIsIDIwLCBcIlwiXSxcbiAgW1wiZGlzdGFuY2VcIiwgXCJyXCIsIDIwLCBcIlwiXSxcbiAgW1widGlsdFwiLCBcInJcIiwgMjAsIFwiXCJdLFxuXG4gIFtcInR1cm4gJW0ubW90b3Igb24gZm9yICVuIHNlY29uZHNcIiwgXCIgXCIsIDIwLCBcIlwiXSxcbiAgW1wic2V0IGxpZ2h0IGNvbG9yIHRvICVuXCIsIFwiIFwiLCAyMCwgXCJcIl0sXG4gIFtcInBsYXkgbm90ZSAlbiBmb3IgJW4gc2Vjb25kc1wiLCBcIiBcIiwgMjAsIFwiXCJdLFxuICBbXCJ3aGVuIHRpbHRlZFwiLCBcImhcIiwgMjAsIFwiXCJdLFxuICBbXCJ0aWx0ICVtLnh4eFwiLCBcInJcIiwgMjAsIFwiXCJdLFxuXG4gIFtcImVsc2VcIiwgXCJlbHNlXCIsIDYsIFwiXCJdLFxuICBbXCJlbmRcIiwgXCJlbmRcIiwgNiwgXCJcIl0sXG4gIFtcIi4gLiAuXCIsIFwiIFwiLCA0MiwgXCJcIl0sXG5cbiAgW1wiJW4gQGFkZElucHV0XCIsIFwicmluZ1wiLCA0MiwgXCJcIl0sXG5cbiAgW1widXNlciBpZFwiLCBcInJcIiwgMCwgXCJcIl0sXG5cbiAgW1wiaWYgJWJcIiwgXCJjXCIsIDAsIFwiZG9JZlwiXSxcbiAgW1wiaWYgJWJcIiwgXCJlXCIsIDAsIFwiZG9JZkVsc2VcIl0sXG4gIFtcImZvcmV2ZXIgaWYgJWJcIiwgXCJjZlwiLCAwLCBcImRvRm9yZXZlcklmXCJdLFxuICBbXCJzdG9wIHNjcmlwdFwiLCBcImZcIiwgMCwgXCJkb1JldHVyblwiXSxcbiAgW1wic3RvcCBhbGxcIiwgXCJmXCIsIDAsIFwic3RvcEFsbFwiXSxcbiAgW1wic3dpdGNoIHRvIGNvc3R1bWUgJW0uY29zdHVtZVwiLCBcIiBcIiwgMCwgXCJsb29rTGlrZTpcIl0sXG4gIFtcIm5leHQgYmFja2dyb3VuZFwiLCBcIiBcIiwgMCwgXCJuZXh0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCB0byBiYWNrZ3JvdW5kICVtLmJhY2tkcm9wXCIsIFwiIFwiLCAwLCBcInN0YXJ0U2NlbmVcIl0sXG4gIFtcImJhY2tncm91bmQgI1wiLCBcInJcIiwgMCwgXCJiYWNrZ3JvdW5kSW5kZXhcIl0sXG4gIFtcImxvdWQ/XCIsIFwiYlwiLCAwLCBcImlzTG91ZFwiXSxcbl1cbiIsIi8qIGZvciBjb25zdHVjdGluZyBTVkdzICovXG5cbmZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbn1cbmZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7XG4gIGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpXG59XG5cbi8vIHNldCBieSBTVkcuaW5pdFxudmFyIGRvY3VtZW50XG52YXIgeG1sXG5cbnZhciBkaXJlY3RQcm9wcyA9IHtcbiAgdGV4dENvbnRlbnQ6IHRydWUsXG59XG5cbnZhciBTVkcgPSAobW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluaXQod2luZG93LCBtYWtlQ2FudmFzKSB7XG4gICAgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnRcbiAgICB2YXIgRE9NUGFyc2VyID0gd2luZG93LkRPTVBhcnNlclxuICAgIHhtbCA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoXCI8eG1sPjwveG1sPlwiLCBcImFwcGxpY2F0aW9uL3htbFwiKVxuICAgIFNWRy5YTUxTZXJpYWxpemVyID0gd2luZG93LlhNTFNlcmlhbGl6ZXJcblxuICAgIFNWRy5tYWtlQ2FudmFzID0gbWFrZUNhbnZhc1xuICB9LFxuXG4gIGNkYXRhKGNvbnRlbnQpIHtcbiAgICByZXR1cm4geG1sLmNyZWF0ZUNEQVRBU2VjdGlvbihjb250ZW50KVxuICB9LFxuXG4gIGVsKG5hbWUsIHByb3BzKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgbmFtZSlcbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKGVsLCBwcm9wcylcbiAgfSxcblxuICBzZXRQcm9wcyhlbCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICAgIHZhciB2YWx1ZSA9IFwiXCIgKyBwcm9wc1trZXldXG4gICAgICBpZiAoZGlyZWN0UHJvcHNba2V5XSkge1xuICAgICAgICBlbFtrZXldID0gdmFsdWVcbiAgICAgIH0gZWxzZSBpZiAoL154bGluazovLnRlc3Qoa2V5KSkge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwga2V5LnNsaWNlKDYpLCB2YWx1ZSlcbiAgICAgIH0gZWxzZSBpZiAocHJvcHNba2V5XSAhPT0gbnVsbCAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKG51bGwsIGtleSwgdmFsdWUpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbFxuICB9LFxuXG4gIHdpdGhDaGlsZHJlbihlbCwgY2hpbGRyZW4pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlbC5hcHBlbmRDaGlsZChjaGlsZHJlbltpXSlcbiAgICB9XG4gICAgcmV0dXJuIGVsXG4gIH0sXG5cbiAgZ3JvdXAoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gU1ZHLndpdGhDaGlsZHJlbihTVkcuZWwoXCJnXCIpLCBjaGlsZHJlbilcbiAgfSxcblxuICBuZXdTVkcod2lkdGgsIGhlaWdodCkge1xuICAgIHJldHVybiBTVkcuZWwoXCJzdmdcIiwge1xuICAgICAgdmVyc2lvbjogXCIxLjFcIixcbiAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgIH0pXG4gIH0sXG5cbiAgcG9seWdvbihwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInBvbHlnb25cIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwb2ludHM6IHByb3BzLnBvaW50cy5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHBhdGgocHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKFxuICAgICAgXCJwYXRoXCIsXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogbnVsbCxcbiAgICAgICAgZDogcHJvcHMucGF0aC5qb2luKFwiIFwiKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIHRleHQoeCwgeSwgY29udGVudCwgcHJvcHMpIHtcbiAgICB2YXIgdGV4dCA9IFNWRy5lbChcbiAgICAgIFwidGV4dFwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHg6IHgsXG4gICAgICAgIHk6IHksXG4gICAgICAgIHRleHRDb250ZW50OiBjb250ZW50LFxuICAgICAgfSlcbiAgICApXG4gICAgcmV0dXJuIHRleHRcbiAgfSxcblxuICBzeW1ib2woaHJlZikge1xuICAgIHJldHVybiBTVkcuZWwoXCJ1c2VcIiwge1xuICAgICAgXCJ4bGluazpocmVmXCI6IGhyZWYsXG4gICAgfSlcbiAgfSxcblxuICBtb3ZlKGR4LCBkeSwgZWwpIHtcbiAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgIHRyYW5zZm9ybTogW1widHJhbnNsYXRlKFwiLCBkeCwgXCIgXCIsIGR5LCBcIilcIl0uam9pbihcIlwiKSxcbiAgICB9KVxuICAgIHJldHVybiBlbFxuICB9LFxuXG4gIHRyYW5zbGF0ZVBhdGgoZHgsIGR5LCBwYXRoKSB7XG4gICAgdmFyIGlzWCA9IHRydWVcbiAgICB2YXIgcGFydHMgPSBwYXRoLnNwbGl0KFwiIFwiKVxuICAgIHZhciBvdXQgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwYXJ0ID0gcGFydHNbaV1cbiAgICAgIGlmIChwYXJ0ID09PSBcIkFcIikge1xuICAgICAgICB2YXIgaiA9IGkgKyA1XG4gICAgICAgIG91dC5wdXNoKFwiQVwiKVxuICAgICAgICB3aGlsZSAoaSA8IGopIHtcbiAgICAgICAgICBvdXQucHVzaChwYXJ0c1srK2ldKVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9IGVsc2UgaWYgKC9bQS1aYS16XS8udGVzdChwYXJ0KSkge1xuICAgICAgICBhc3NlcnQoaXNYKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFydCA9ICtwYXJ0XG4gICAgICAgIHBhcnQgKz0gaXNYID8gZHggOiBkeVxuICAgICAgICBpc1ggPSAhaXNYXG4gICAgICB9XG4gICAgICBvdXQucHVzaChwYXJ0KVxuICAgIH1cbiAgICByZXR1cm4gb3V0LmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgLyogc2hhcGVzICovXG5cbiAgcmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcInJlY3RcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwLFxuICAgICAgICB3aWR0aDogdyxcbiAgICAgICAgaGVpZ2h0OiBoLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgZWxsaXBzZSh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoXG4gICAgICBcImVsbGlwc2VcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBjeDogdyAvIDIsXG4gICAgICAgIGN5OiBoIC8gMixcbiAgICAgICAgcng6IHcgLyAyLFxuICAgICAgICByeTogaCAvIDIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBhcmMocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeVxuICAgIHJldHVybiBbXCJMXCIsIHAxeCwgcDF5LCBcIkFcIiwgcngsIHJ5LCAwLCAwLCAxLCBwMngsIHAyeV0uam9pbihcIiBcIilcbiAgfSxcblxuICBhcmN3KHAxeCwgcDF5LCBwMngsIHAyeSwgcngsIHJ5KSB7XG4gICAgdmFyIHIgPSBwMnkgLSBwMXlcbiAgICByZXR1cm4gW1wiTFwiLCBwMXgsIHAxeSwgXCJBXCIsIHJ4LCByeSwgMCwgMCwgMCwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgcm91bmRlZFBhdGgodywgaCkge1xuICAgIHZhciByID0gaCAvIDJcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICByLFxuICAgICAgMCxcbiAgICAgIFNWRy5hcmModyAtIHIsIDAsIHcgLSByLCBoLCByLCByKSxcbiAgICAgIFNWRy5hcmMociwgaCwgciwgMCwgciwgciksXG4gICAgICBcIlpcIixcbiAgICBdXG4gIH0sXG5cbiAgcm91bmRlZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogU1ZHLnJvdW5kZWRQYXRoKHcsIGgpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgcG9pbnRlZFBhdGgodywgaCkge1xuICAgIHZhciByID0gaCAvIDJcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsXG4gICAgICByLFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgdyAtIHIsXG4gICAgICAwLFxuICAgICAgdyxcbiAgICAgIHIsXG4gICAgICBcIkxcIixcbiAgICAgIHcsXG4gICAgICByLFxuICAgICAgdyAtIHIsXG4gICAgICBoLFxuICAgICAgXCJMXCIsXG4gICAgICByLFxuICAgICAgaCxcbiAgICAgIDAsXG4gICAgICByLFxuICAgICAgXCJMXCIsXG4gICAgICAwLFxuICAgICAgcixcbiAgICAgIHIsXG4gICAgICAwLFxuICAgICAgXCJaXCIsXG4gICAgXVxuICB9LFxuXG4gIHBvaW50ZWRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFNWRy5wb2ludGVkUGF0aCh3LCBoKSxcbiAgICAgIH0pXG4gICAgKVxuICB9LFxuXG4gIGdldFRvcCh3KSB7XG4gICAgcmV0dXJuIFtcIk1cIiwgMCwgNCxcbiAgICAgIC8vIFwiTFwiLCAxLCAxLFxuICAgICAgLy8gXCJMXCIsIDQsIDAsXG4gICAgICBcIlFcIiwgU1ZHLmN1cnZlKDAsIDQsIDQsIDAsIDApLFxuICAgICAgXCJMXCIsIDQsIDAsXG4gICAgICBcIkxcIiwgOCwgMCxcbiAgICAgIFwiTFwiLCAxNCwgNSxcbiAgICAgIFwiTFwiLCAyNCwgNSxcbiAgICAgIFwiTFwiLCAzMCwgMCxcbiAgICAgIFwiTFwiLCAzMiwgMCxcbiAgICAgIFwiTFwiLCB3IC0gNCwgMCxcbiAgICAgIFwiUVwiLCBTVkcuY3VydmUodyAtIDQsIDAsIHcsIDQsIDApLFxuICAgICAgXCJMXCIsIHcsIDRcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0UmluZ1RvcCh3KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiTVwiLFxuICAgICAgMCxcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDMsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICA3LFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgMTAsXG4gICAgICAzLFxuICAgICAgXCJMXCIsXG4gICAgICAxNixcbiAgICAgIDMsXG4gICAgICBcIkxcIixcbiAgICAgIDE5LFxuICAgICAgMCxcbiAgICAgIFwiTFwiLFxuICAgICAgdyAtIDMsXG4gICAgICAwLFxuICAgICAgXCJMXCIsXG4gICAgICB3LFxuICAgICAgMyxcbiAgICBdLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgaGFzTm90Y2gsIGluc2V0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnNldCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zZXQgPSAwXG4gICAgfVxuICAgIC8vdmFyIGFyciA9IFtcIkxcIiwgdywgeSAtIDMsIFwiTFwiLCB3IC0gMywgeV1cbiAgICB2YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gNCwgXCJRXCIsIFNWRy5jdXJ2ZSh3LCB5IC0gNCwgdyAtIDQsIHksIDApXVxuICAgIGlmIChoYXNOb3RjaCkge1xuICAgICAgYXJyID0gYXJyLmNvbmNhdChbXG4gICAgICAgIFwiTFwiLFxuICAgICAgICBpbnNldCArIDMwLFxuICAgICAgICB5LFxuICAgICAgICBcIkxcIixcbiAgICAgICAgaW5zZXQgKyAyNCxcbiAgICAgICAgeSArIDYsXG4gICAgICAgIFwiTFwiLFxuICAgICAgICBpbnNldCArIDE0LFxuICAgICAgICB5ICsgNixcbiAgICAgICAgXCJMXCIsXG4gICAgICAgIGluc2V0ICsgOCxcbiAgICAgICAgeSxcbiAgICAgIF0pXG4gICAgfVxuICAgIGlmIChpbnNldCA+IDApIHtcbiAgICAgIGFyciA9IGFyci5jb25jYXQoW1wiTFwiLCBpbnNldCArIDIsIHksIFwiTFwiLCBpbnNldCwgeSArIDJdKVxuICAgIH0gZWxzZSB7XG4gICAgICBhcnIgPSBhcnIuY29uY2F0KFtcIkxcIiwgaW5zZXQgKyAzLCB5LCBcIkxcIiwgMCwgeSAtIDNdKVxuICAgIH1cbiAgICByZXR1cm4gYXJyLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgZ2V0QXJtKHcsIGFybVRvcCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIkxcIixcbiAgICAgIDE1LFxuICAgICAgYXJtVG9wIC0gMixcbiAgICAgIFwiTFwiLFxuICAgICAgMTUgKyAyLFxuICAgICAgYXJtVG9wLFxuICAgICAgXCJMXCIsXG4gICAgICB3IC0gMyxcbiAgICAgIGFybVRvcCxcbiAgICAgIFwiTFwiLFxuICAgICAgdyxcbiAgICAgIGFybVRvcCArIDMsXG4gICAgXS5qb2luKFwiIFwiKVxuICB9LFxuXG4gIHN0YWNrUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBbU1ZHLmdldFRvcCh3KSwgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUsIDApLCBcIlpcIl0sXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBjYXBQYXRoKHcsIGgpIHtcbiAgICByZXR1cm4gW1NWRy5nZXRUb3AodyksIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCBmYWxzZSwgMCksIFwiWlwiXVxuICB9LFxuXG4gIHJpbmdDYXBQYXRoKHcsIGgpIHtcbiAgICByZXR1cm4gW1NWRy5nZXRSaW5nVG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgZmFsc2UsIDApLCBcIlpcIl1cbiAgfSxcblxuICBjYXBSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IFNWRy5jYXBQYXRoKHcsIGgpLFxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgaGF0UmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsIDAsIDEyLFxuICAgICAgICBTVkcuYXJjKDAsIDEwLCA2MCwgMTAsIDYwLCA4MCksXG4gICAgICAgIFwiTFwiLCB3LTQsIDEwLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKHcgLSA0LCAxMCwgdywgMTAgKyA0LCAwKSxcbiAgICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUpLFxuICAgICAgICBcIlpcIixcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIGN1cnZlKHAxeCwgcDF5LCBwMngsIHAyeSwgcm91bmRuZXNzKSB7XG4gICAgdmFyIHJvdW5kbmVzcyA9IHJvdW5kbmVzcyB8fCAwLjQyXG4gICAgdmFyIG1pZFggPSAocDF4ICsgcDJ4KSAvIDIuMFxuICAgIHZhciBtaWRZID0gKHAxeSArIHAyeSkgLyAyLjBcbiAgICB2YXIgY3ggPSBNYXRoLnJvdW5kKG1pZFggKyByb3VuZG5lc3MgKiAocDJ5IC0gcDF5KSlcbiAgICB2YXIgY3kgPSBNYXRoLnJvdW5kKG1pZFkgLSByb3VuZG5lc3MgKiAocDJ4IC0gcDF4KSlcbiAgICByZXR1cm4gW2N4LCBjeSwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpXG4gIH0sXG5cbiAgcHJvY0hhdEJhc2UodywgaCwgYXJjaFJvdW5kbmVzcywgcHJvcHMpIHtcbiAgICAvLyBUT0RPIHVzZSBhcmMoKVxuICAgIC8vIHZhciBhcmNoUm91bmRuZXNzID0gTWF0aC5taW4oMC4yLCAzNSAvIHcpOyAvL3VzZWQgaW4gc2NyYXRjaGJsb2NrczJcbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLCAwLCBoLTMsXG4gICAgICAgIFwiTFwiLCAwLCAxMCxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSgwLCAxMCwgMTUsIC01LCAwKSxcbiAgICAgICAgXCJMXCIsIHctMTUsIC01LFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKHctMTUsIC01LCB3LCAxMCwgMCksXG4gICAgICAgIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCB0cnVlKSxcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIHByb2NIYXRDYXAodywgaCwgYXJjaFJvdW5kbmVzcykge1xuICAgIC8vIFRPRE8gdXNlIGFyYygpXG4gICAgLy8gVE9ETyB0aGlzIGRvZXNuJ3QgbG9vayBxdWl0ZSByaWdodFxuICAgIHJldHVybiBTVkcucGF0aCh7XG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLFxuICAgICAgICAtMSxcbiAgICAgICAgMTMsXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUoLTEsIDEzLCB3ICsgMSwgMTMsIGFyY2hSb3VuZG5lc3MpLFxuICAgICAgICBcIlFcIixcbiAgICAgICAgU1ZHLmN1cnZlKHcgKyAxLCAxMywgdywgMTYsIDAuNiksXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUodywgMTYsIDAsIDE2LCAtYXJjaFJvdW5kbmVzcyksXG4gICAgICAgIFwiUVwiLFxuICAgICAgICBTVkcuY3VydmUoMCwgMTYsIC0xLCAxMywgMC42KSxcbiAgICAgICAgXCJaXCIsXG4gICAgICBdLFxuICAgICAgY2xhc3M6IFwic2ItZGVmaW5lLWhhdC1jYXBcIixcbiAgICB9KVxuICB9LFxuXG4gIHByb2NIYXRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHEgPSA1MlxuICAgIHZhciB5ID0gaCAtIHFcblxuICAgIHZhciBhcmNoUm91bmRuZXNzID0gTWF0aC5taW4oMC4yLCAzNSAvIHcpXG5cbiAgICByZXR1cm4gU1ZHLm1vdmUoXG4gICAgICAwLFxuICAgICAgeSxcbiAgICAgIFNWRy5ncm91cChbXG4gICAgICAgIFNWRy5wcm9jSGF0QmFzZSh3LCBxLCBhcmNoUm91bmRuZXNzLCBwcm9wcyksXG4gICAgICAgIC8vU1ZHLnByb2NIYXRDYXAodywgcSwgYXJjaFJvdW5kbmVzcyksXG4gICAgICBdKVxuICAgIClcbiAgfSxcblxuICBtb3V0aFJlY3QodywgaCwgaXNGaW5hbCwgbGluZXMsIHByb3BzKSB7XG4gICAgdmFyIHkgPSBsaW5lc1swXS5oZWlnaHRcbiAgICB2YXIgcCA9IFtTVkcuZ2V0VG9wKHcpLCBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgdHJ1ZSwgMTUpXVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbGluZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHZhciBpc0xhc3QgPSBpICsgMiA9PT0gbGluZXMubGVuZ3RoXG5cbiAgICAgIHkgKz0gbGluZXNbaV0uaGVpZ2h0IC0gM1xuICAgICAgcC5wdXNoKFNWRy5nZXRBcm0odywgeSkpXG5cbiAgICAgIHZhciBoYXNOb3RjaCA9ICEoaXNMYXN0ICYmIGlzRmluYWwpXG4gICAgICB2YXIgaW5zZXQgPSBpc0xhc3QgPyAwIDogMTVcbiAgICAgIHkgKz0gbGluZXNbaSArIDFdLmhlaWdodCArIDNcbiAgICAgIHAucHVzaChTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgaGFzTm90Y2gsIGluc2V0KSlcbiAgICB9XG4gICAgcmV0dXJuIFNWRy5wYXRoKFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIHBhdGg6IHAsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICByaW5nUmVjdCh3LCBoLCBjeSwgY3csIGNoLCBzaGFwZSwgcHJvcHMpIHtcbiAgICB2YXIgciA9IDhcbiAgICB2YXIgZnVuYyA9XG4gICAgICBzaGFwZSA9PT0gXCJyZXBvcnRlclwiXG4gICAgICAgID8gU1ZHLnJvdW5kZWRQYXRoXG4gICAgICAgIDogc2hhcGUgPT09IFwiYm9vbGVhblwiXG4gICAgICAgICAgPyBTVkcucG9pbnRlZFBhdGhcbiAgICAgICAgICA6IGN3IDwgNDAgPyBTVkcucmluZ0NhcFBhdGggOiBTVkcuY2FwUGF0aFxuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBwYXRoOiBbXG4gICAgICAgICAgXCJNXCIsXG4gICAgICAgICAgcixcbiAgICAgICAgICAwLFxuICAgICAgICAgIFNWRy5hcmN3KHIsIDAsIDAsIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmN3KDAsIGggLSByLCByLCBoLCByLCByKSxcbiAgICAgICAgICBTVkcuYXJjdyh3IC0gciwgaCwgdywgaCAtIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmN3KHcsIHIsIHcgLSByLCAwLCByLCByKSxcbiAgICAgICAgICBcIlpcIixcbiAgICAgICAgICBTVkcudHJhbnNsYXRlUGF0aCg0LCBjeSB8fCA0LCBmdW5jKGN3LCBjaCkuam9pbihcIiBcIikpLFxuICAgICAgICBdLFxuICAgICAgICBcImZpbGwtcnVsZVwiOiBcImV2ZW4tb2RkXCIsXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBjb21tZW50UmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHZhciByID0gNlxuICAgIHJldHVybiBTVkcucGF0aChcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBjbGFzczogXCJzYi1jb21tZW50XCIsXG4gICAgICAgIHBhdGg6IFtcbiAgICAgICAgICBcIk1cIixcbiAgICAgICAgICByLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgU1ZHLmFyYyh3IC0gciwgMCwgdywgciwgciwgciksXG4gICAgICAgICAgU1ZHLmFyYyh3LCBoIC0gciwgdyAtIHIsIGgsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmMociwgaCwgMCwgaCAtIHIsIHIsIHIpLFxuICAgICAgICAgIFNWRy5hcmMoMCwgciwgciwgMCwgciwgciksXG4gICAgICAgICAgXCJaXCIsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgIClcbiAgfSxcblxuICBjb21tZW50TGluZSh3aWR0aCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLm1vdmUoXG4gICAgICAtd2lkdGgsXG4gICAgICA5LFxuICAgICAgU1ZHLnJlY3QoXG4gICAgICAgIHdpZHRoLFxuICAgICAgICAyLFxuICAgICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgICBjbGFzczogXCJzYi1jb21tZW50LWxpbmVcIixcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICApXG4gIH0sXG5cbiAgc3RyaWtldGhyb3VnaExpbmUodywgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoXG4gICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgcGF0aDogW1wiTVwiLCAwLCAwLCBcIkxcIiwgdywgMF0sXG4gICAgICAgIGNsYXNzOiBcInNiLWRpZmYgc2ItZGlmZi1kZWxcIixcbiAgICAgIH0pXG4gICAgKVxuICB9LFxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlc3QsIHNyYylcbiAgfVxuXG4gIHZhciBTVkcgPSByZXF1aXJlKFwiLi9kcmF3LmpzXCIpXG5cbiAgdmFyIEZpbHRlciA9IGZ1bmN0aW9uKGlkLCBwcm9wcykge1xuICAgIHRoaXMuZWwgPSBTVkcuZWwoXG4gICAgICBcImZpbHRlclwiLFxuICAgICAgZXh0ZW5kKHByb3BzLCB7XG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgeDA6IFwiLTUwJVwiLFxuICAgICAgICB5MDogXCItNTAlXCIsXG4gICAgICAgIHdpZHRoOiBcIjIwMCVcIixcbiAgICAgICAgaGVpZ2h0OiBcIjIwMCVcIixcbiAgICAgIH0pXG4gICAgKVxuICAgIHRoaXMuaGlnaGVzdElkID0gMFxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuZmUgPSBmdW5jdGlvbihuYW1lLCBwcm9wcywgY2hpbGRyZW4pIHtcbiAgICB2YXIgc2hvcnROYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL2dhdXNzaWFufG9zaXRlLywgXCJcIilcbiAgICB2YXIgaWQgPSBbc2hvcnROYW1lLCBcIi1cIiwgKyt0aGlzLmhpZ2hlc3RJZF0uam9pbihcIlwiKVxuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQoXG4gICAgICBTVkcud2l0aENoaWxkcmVuKFxuICAgICAgICBTVkcuZWwoXG4gICAgICAgICAgXCJmZVwiICsgbmFtZSxcbiAgICAgICAgICBleHRlbmQocHJvcHMsIHtcbiAgICAgICAgICAgIHJlc3VsdDogaWQsXG4gICAgICAgICAgfSlcbiAgICAgICAgKSxcbiAgICAgICAgY2hpbGRyZW4gfHwgW11cbiAgICAgIClcbiAgICApXG4gICAgcmV0dXJuIGlkXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5jb21wID0gZnVuY3Rpb24ob3AsIGluMSwgaW4yLCBwcm9wcykge1xuICAgIHJldHVybiB0aGlzLmZlKFxuICAgICAgXCJDb21wb3NpdGVcIixcbiAgICAgIGV4dGVuZChwcm9wcywge1xuICAgICAgICBvcGVyYXRvcjogb3AsXG4gICAgICAgIGluOiBpbjEsXG4gICAgICAgIGluMjogaW4yLFxuICAgICAgfSlcbiAgICApXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKGluMSwgaW4yKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcChcImFyaXRobWV0aWNcIiwgaW4xLCBpbjIsIHsgazI6ICsxLCBrMzogLTEgfSlcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLm9mZnNldCA9IGZ1bmN0aW9uKGR4LCBkeSwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJPZmZzZXRcIiwge1xuICAgICAgaW46IGluMSxcbiAgICAgIGR4OiBkeCxcbiAgICAgIGR5OiBkeSxcbiAgICB9KVxuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuZmxvb2QgPSBmdW5jdGlvbihjb2xvciwgb3BhY2l0eSwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJGbG9vZFwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgXCJmbG9vZC1jb2xvclwiOiBjb2xvcixcbiAgICAgIFwiZmxvb2Qtb3BhY2l0eVwiOiBvcGFjaXR5LFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5ibHVyID0gZnVuY3Rpb24oZGV2LCBpbjEpIHtcbiAgICByZXR1cm4gdGhpcy5mZShcIkdhdXNzaWFuQmx1clwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgc3RkRGV2aWF0aW9uOiBbZGV2LCBkZXZdLmpvaW4oXCIgXCIpLFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5jb2xvck1hdHJpeCA9IGZ1bmN0aW9uKGluMSwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoXCJDb2xvck1hdHJpeFwiLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgdHlwZTogXCJtYXRyaXhcIixcbiAgICAgIHZhbHVlczogdmFsdWVzLmpvaW4oXCIgXCIpLFxuICAgIH0pXG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XG4gICAgdGhpcy5mZShcbiAgICAgIFwiTWVyZ2VcIixcbiAgICAgIHt9LFxuICAgICAgY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFNWRy5lbChcImZlTWVyZ2VOb2RlXCIsIHtcbiAgICAgICAgICBpbjogbmFtZSxcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIEZpbHRlclxufSkoKVxuIiwiLypcbiAqIHNjcmF0Y2hibG9ja3NcbiAqIGh0dHA6Ly9zY3JhdGNoYmxvY2tzLmdpdGh1Yi5pby9cbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE2LCBUaW0gUmFkdmFuXG4gKiBAbGljZW5zZSBNSVRcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqL1xuOyhmdW5jdGlvbihtb2QpIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vZFxuICB9IGVsc2Uge1xuICAgIHZhciBtYWtlQ2FudmFzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxuICAgIH1cbiAgICB2YXIgc2NyYXRjaGJsb2NrcyA9ICh3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZCh3aW5kb3csIG1ha2VDYW52YXMpKVxuXG4gICAgLy8gYWRkIG91ciBDU1MgdG8gdGhlIHBhZ2VcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmF0Y2hibG9ja3MubWFrZVN0eWxlKCkpXG4gIH1cbn0pKGZ1bmN0aW9uKHdpbmRvdywgbWFrZUNhbnZhcykge1xuICBcInVzZSBzdHJpY3RcIlxuXG4gIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuXG4gIC8qIHV0aWxzICovXG5cbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIHsgYWxsTGFuZ3VhZ2VzLCBsb2FkTGFuZ3VhZ2VzIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICB2YXIgcGFyc2UgPSByZXF1aXJlKFwiLi9zeW50YXguanNcIikucGFyc2VcblxuICB2YXIgc3R5bGUgPSByZXF1aXJlKFwiLi9zdHlsZS5qc1wiKVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIge1xuICAgIExhYmVsLFxuICAgIEljb24sXG4gICAgSW5wdXQsXG4gICAgQmxvY2ssXG4gICAgQ29tbWVudCxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH0gPSByZXF1aXJlKFwiLi9tb2RlbC5qc1wiKVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxuICBTVkcuaW5pdCh3aW5kb3csIG1ha2VDYW52YXMpXG5cbiAgTGFiZWwubWVhc3VyaW5nID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBTVkcubWFrZUNhbnZhcygpXG4gICAgcmV0dXJuIGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIilcbiAgfSkoKVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICBmdW5jdGlvbiByZW5kZXIoZG9jLCBjYikge1xuICAgIHJldHVybiBkb2MucmVuZGVyKGNiKVxuICB9XG5cbiAgLyoqKiBSZW5kZXIgKioqL1xuXG4gIC8vIHJlYWQgY29kZSBmcm9tIGEgRE9NIGVsZW1lbnRcbiAgZnVuY3Rpb24gcmVhZENvZGUoZWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgdmFyIGh0bWwgPSBlbC5pbm5lckhUTUwucmVwbGFjZSgvPGJyPlxccz98XFxufFxcclxcbnxcXHIvZ2ksIFwiXFxuXCIpXG4gICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIilcbiAgICBwcmUuaW5uZXJIVE1MID0gaHRtbFxuICAgIHZhciBjb2RlID0gcHJlLnRleHRDb250ZW50XG4gICAgaWYgKG9wdGlvbnMuaW5saW5lKSB7XG4gICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFwiXFxuXCIsIFwiXCIpXG4gICAgfVxuICAgIHJldHVybiBjb2RlXG4gIH1cblxuICAvLyBpbnNlcnQgJ3N2ZycgaW50byAnZWwnLCB3aXRoIGFwcHJvcHJpYXRlIHdyYXBwZXIgZWxlbWVudHNcbiAgZnVuY3Rpb24gcmVwbGFjZShlbCwgc3ZnLCBzY3JpcHRzLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuaW5saW5lKSB7XG4gICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIilcbiAgICAgIHZhciBjbHMgPSBcInNjcmF0Y2hibG9ja3Mgc2NyYXRjaGJsb2Nrcy1pbmxpbmVcIlxuICAgICAgaWYgKHNjcmlwdHNbMF0gJiYgIXNjcmlwdHNbMF0uaXNFbXB0eSkge1xuICAgICAgICBjbHMgKz0gXCIgc2NyYXRjaGJsb2Nrcy1pbmxpbmUtXCIgKyBzY3JpcHRzWzBdLmJsb2Nrc1swXS5zaGFwZVxuICAgICAgfVxuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNsc1xuICAgICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiXG4gICAgICBjb250YWluZXIuc3R5bGUudmVydGljYWxBbGlnbiA9IFwibWlkZGxlXCJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSBcInNjcmF0Y2hibG9ja3NcIlxuICAgIH1cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3ZnKVxuXG4gICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgIGVsLmFwcGVuZENoaWxkKGNvbnRhaW5lcilcbiAgfVxuXG4gIC8qIFJlbmRlciBhbGwgbWF0Y2hpbmcgZWxlbWVudHMgaW4gcGFnZSB0byBzaGlueSBzY3JhdGNoIGJsb2Nrcy5cbiAgICogQWNjZXB0cyBhIENTUyBzZWxlY3RvciBhcyBhbiBhcmd1bWVudC5cbiAgICpcbiAgICogIHNjcmF0Y2hibG9ja3MucmVuZGVyTWF0Y2hpbmcoXCJwcmUuYmxvY2tzXCIpO1xuICAgKlxuICAgKiBMaWtlIHRoZSBvbGQgJ3NjcmF0Y2hibG9ja3MyLnBhcnNlKCkuXG4gICAqL1xuICB2YXIgcmVuZGVyTWF0Y2hpbmcgPSBmdW5jdGlvbihzZWxlY3Rvciwgb3B0aW9ucykge1xuICAgIHZhciBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IFwicHJlLmJsb2Nrc1wiXG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoXG4gICAgICB7XG4gICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICAgIGxhbmd1YWdlczogW1wiZW5cIl0sXG5cbiAgICAgICAgcmVhZDogcmVhZENvZGUsIC8vIGZ1bmN0aW9uKGVsLCBvcHRpb25zKSA9PiBjb2RlXG4gICAgICAgIHBhcnNlOiBwYXJzZSwgLy8gZnVuY3Rpb24oY29kZSwgb3B0aW9ucykgPT4gZG9jXG4gICAgICAgIHJlbmRlcjogcmVuZGVyLCAvLyBmdW5jdGlvbihkb2MsIGNiKSA9PiBzdmdcbiAgICAgICAgcmVwbGFjZTogcmVwbGFjZSwgLy8gZnVuY3Rpb24oZWwsIHN2ZywgZG9jLCBvcHRpb25zKVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICAvLyBmaW5kIGVsZW1lbnRzXG4gICAgdmFyIHJlc3VsdHMgPSBbXS5zbGljZS5hcHBseShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlcbiAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcbiAgICAgIHZhciBjb2RlID0gb3B0aW9ucy5yZWFkKGVsLCBvcHRpb25zKVxuXG4gICAgICB2YXIgZG9jID0gb3B0aW9ucy5wYXJzZShjb2RlLCBvcHRpb25zKVxuXG4gICAgICBvcHRpb25zLnJlbmRlcihkb2MsIGZ1bmN0aW9uKHN2Zykge1xuICAgICAgICBvcHRpb25zLnJlcGxhY2UoZWwsIHN2ZywgZG9jLCBvcHRpb25zKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyogUGFyc2Ugc2NyYXRjaGJsb2NrcyBjb2RlIGFuZCByZXR1cm4gWE1MIHN0cmluZy5cbiAgICpcbiAgICogQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIE5vZGUsIHJlYWxseS5cbiAgICovXG4gIHZhciByZW5kZXJTVkdTdHJpbmcgPSBmdW5jdGlvbihjb2RlLCBvcHRpb25zKSB7XG4gICAgdmFyIGRvYyA9IHBhcnNlKGNvZGUsIG9wdGlvbnMpXG5cbiAgICAvLyBXQVJOOiBEb2N1bWVudC5yZW5kZXIoKSBtYXkgYmVjb21lIGFzeW5jIGFnYWluIGluIGZ1dHVyZSA6LShcbiAgICBkb2MucmVuZGVyKGZ1bmN0aW9uKCkge30pXG5cbiAgICByZXR1cm4gZG9jLmV4cG9ydFNWR1N0cmluZygpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFsbExhbmd1YWdlczogYWxsTGFuZ3VhZ2VzLCAvLyByZWFkLW9ubHlcbiAgICBsb2FkTGFuZ3VhZ2VzOiBsb2FkTGFuZ3VhZ2VzLFxuXG4gICAgZnJvbUpTT046IERvY3VtZW50LmZyb21KU09OLFxuICAgIHRvSlNPTjogZnVuY3Rpb24oZG9jKSB7XG4gICAgICByZXR1cm4gZG9jLnRvSlNPTigpXG4gICAgfSxcbiAgICBzdHJpbmdpZnk6IGZ1bmN0aW9uKGRvYykge1xuICAgICAgcmV0dXJuIGRvYy5zdHJpbmdpZnkoKVxuICAgIH0sXG5cbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuXG4gICAgcmVhZDogcmVhZENvZGUsXG4gICAgcGFyc2U6IHBhcnNlLFxuICAgIC8vIHJlbmRlcjogcmVuZGVyLCAvLyBSRU1PVkVEIHNpbmNlIGRvYy5yZW5kZXIoY2IpIG1ha2VzIG11Y2ggbW9yZSBzZW5zZVxuICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgcmVuZGVyTWF0Y2hpbmc6IHJlbmRlck1hdGNoaW5nLFxuXG4gICAgcmVuZGVyU1ZHU3RyaW5nOiByZW5kZXJTVkdTdHJpbmcsXG4gICAgbWFrZVN0eWxlOiBzdHlsZS5tYWtlU3R5bGUsXG4gIH1cbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxuICB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykge1xuICAgIHJldHVybiBvICYmIG8uY29uc3RydWN0b3IgPT09IEFycmF5XG4gIH1cbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpXG4gIH1cblxuICBmdW5jdGlvbiBpbmRlbnQodGV4dCkge1xuICAgIHJldHVybiB0ZXh0XG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICByZXR1cm4gXCIgIFwiICsgbGluZVxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXCIpXG4gIH1cblxuICBmdW5jdGlvbiBtYXliZU51bWJlcih2KSB7XG4gICAgdiA9IFwiXCIgKyB2XG4gICAgdmFyIG4gPSBwYXJzZUludCh2KVxuICAgIGlmICghaXNOYU4obikpIHtcbiAgICAgIHJldHVybiBuXG4gICAgfVxuICAgIHZhciBmID0gcGFyc2VGbG9hdCh2KVxuICAgIGlmICghaXNOYU4oZikpIHtcbiAgICAgIHJldHVybiBmXG4gICAgfVxuICAgIHJldHVybiB2XG4gIH1cblxuICB2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxuXG4gIHZhciB7XG4gICAgZGVmYXVsdEZvbnRGYW1pbHksXG4gICAgbWFrZVN0eWxlLFxuICAgIG1ha2VJY29ucyxcbiAgICBkYXJrUmVjdCxcbiAgICBiZXZlbEZpbHRlcixcbiAgICBkYXJrRmlsdGVyLFxuICAgIGRlc2F0dXJhdGVGaWx0ZXIsXG4gIH0gPSByZXF1aXJlKFwiLi9zdHlsZS5qc1wiKVxuXG4gIHZhciB7XG4gICAgYmxvY2tzQnlTZWxlY3RvcixcbiAgICBwYXJzZVNwZWMsXG4gICAgaW5wdXRQYXQsXG4gICAgaWNvblBhdCxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgdW5pY29kZUljb25zLFxuICAgIGVuZ2xpc2gsXG4gICAgYmxvY2tOYW1lLFxuICB9ID0gcmVxdWlyZShcIi4vYmxvY2tzLmpzXCIpXG5cbiAgLyogTGFiZWwgKi9cblxuICB2YXIgTGFiZWwgPSBmdW5jdGlvbih2YWx1ZSwgY2xzKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jbHMgPSBjbHMgfHwgXCJcIlxuICAgIHRoaXMuZWwgPSBudWxsXG4gICAgdGhpcy5oZWlnaHQgPSAxMlxuICAgIHRoaXMubWV0cmljcyA9IG51bGxcbiAgICB0aGlzLnggPSAwXG4gIH1cbiAgTGFiZWwucHJvdG90eXBlLmlzTGFiZWwgPSB0cnVlXG5cbiAgTGFiZWwucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBcIjxcIiB8fCB0aGlzLnZhbHVlID09PSBcIj5cIikgcmV0dXJuIHRoaXMudmFsdWVcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5yZXBsYWNlKC8oWzw+W1xcXSgpe31dKS9nLCBcIlxcXFwkMVwiKVxuICB9XG5cbiAgTGFiZWwucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbFxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExhYmVsLnByb3RvdHlwZSwgXCJ3aWR0aFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm1ldHJpY3Mud2lkdGhcbiAgICB9LFxuICB9KVxuXG4gIExhYmVsLm1ldHJpY3NDYWNoZSA9IHt9XG4gIExhYmVsLnRvTWVhc3VyZSA9IFtdXG5cbiAgTGFiZWwucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlXG4gICAgdmFyIGNscyA9IHRoaXMuY2xzXG4gICAgdGhpcy5lbCA9IFNWRy50ZXh0KDAsIDEwLCB2YWx1ZSwge1xuICAgICAgY2xhc3M6IFwic2ItbGFiZWwgXCIgKyBjbHMsXG4gICAgfSlcblxuICAgIHZhciBjYWNoZSA9IExhYmVsLm1ldHJpY3NDYWNoZVtjbHNdXG4gICAgaWYgKCFjYWNoZSkge1xuICAgICAgY2FjaGUgPSBMYWJlbC5tZXRyaWNzQ2FjaGVbY2xzXSA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoY2FjaGUsIHZhbHVlKSkge1xuICAgICAgdGhpcy5tZXRyaWNzID0gY2FjaGVbdmFsdWVdXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmb250ID0gL3NiLWNvbW1lbnQtbGFiZWwvLnRlc3QodGhpcy5jbHMpXG4gICAgICAgID8gXCJib2xkIDEycHggSGVsZXZldGljYSwgQXJpYWwsIERlamFWdSBTYW5zLCBzYW5zLXNlcmlmXCJcbiAgICAgICAgOiAvc2ItbGl0ZXJhbC8udGVzdCh0aGlzLmNscylcbiAgICAgICAgICA/IFwibm9ybWFsIDlweCBcIiArIGRlZmF1bHRGb250RmFtaWx5XG4gICAgICAgICAgOiBcImJvbGQgMTBweCBcIiArIGRlZmF1bHRGb250RmFtaWx5XG4gICAgICB0aGlzLm1ldHJpY3MgPSBjYWNoZVt2YWx1ZV0gPSBMYWJlbC5tZWFzdXJlKHZhbHVlLCBmb250KVxuICAgICAgLy8gVE9ETzogd29yZC1zcGFjaW5nPyAoZm9ydHVuYXRlbHkgaXQgc2VlbXMgdG8gaGF2ZSBubyBlZmZlY3QhKVxuICAgIH1cbiAgfVxuXG4gIExhYmVsLm1lYXN1cmUgPSBmdW5jdGlvbih2YWx1ZSwgZm9udCkge1xuICAgIHZhciBjb250ZXh0ID0gTGFiZWwubWVhc3VyaW5nXG4gICAgY29udGV4dC5mb250ID0gZm9udFxuICAgIHZhciB0ZXh0TWV0cmljcyA9IGNvbnRleHQubWVhc3VyZVRleHQodmFsdWUpXG4gICAgdmFyIHdpZHRoID0gKHRleHRNZXRyaWNzLndpZHRoICsgMC41KSB8IDBcbiAgICByZXR1cm4geyB3aWR0aDogd2lkdGggfVxuICB9XG5cbiAgLyogSWNvbiAqL1xuXG4gIHZhciBJY29uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmlzQXJyb3cgPSBuYW1lID09PSBcImxvb3BBcnJvd1wiXG5cbiAgICB2YXIgaW5mbyA9IEljb24uaWNvbnNbbmFtZV1cbiAgICBhc3NlcnQoaW5mbywgXCJubyBpbmZvIGZvciBpY29uIFwiICsgbmFtZSlcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluZm8pXG4gIH1cbiAgSWNvbi5wcm90b3R5cGUuaXNJY29uID0gdHJ1ZVxuXG4gIEljb24ucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB1bmljb2RlSWNvbnNbXCJAXCIgKyB0aGlzLm5hbWVdIHx8IFwiXCJcbiAgfVxuXG4gIEljb24uaWNvbnMgPSB7XG4gICAgZ3JlZW5GbGFnOiB7IHdpZHRoOiAxMCwgaGVpZ2h0OiAyMSwgZHk6IC0yIH0sXG4gICAgdHVybkxlZnQ6IHsgd2lkdGg6IDE1LCBoZWlnaHQ6IDEyLCBkeTogKzEgfSxcbiAgICB0dXJuUmlnaHQ6IHsgd2lkdGg6IDE1LCBoZWlnaHQ6IDEyLCBkeTogKzEgfSxcbiAgICBsb29wQXJyb3c6IHsgd2lkdGg6IDE0LCBoZWlnaHQ6IDExIH0sXG4gICAgYWRkSW5wdXQ6IHsgd2lkdGg6IDQsIGhlaWdodDogOCB9LFxuICAgIGRlbElucHV0OiB7IHdpZHRoOiA0LCBoZWlnaHQ6IDggfSxcbiAgfVxuICBJY29uLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFNWRy5zeW1ib2woXCIjXCIgKyB0aGlzLm5hbWUsIHtcbiAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICB9KVxuICB9XG5cbiAgLyogSW5wdXQgKi9cblxuICB2YXIgSW5wdXQgPSBmdW5jdGlvbihzaGFwZSwgdmFsdWUsIG1lbnUpIHtcbiAgICB0aGlzLnNoYXBlID0gc2hhcGVcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLm1lbnUgPSBtZW51IHx8IG51bGxcblxuICAgIHRoaXMuaXNSb3VuZCA9IHNoYXBlID09PSBcIm51bWJlclwiIHx8IHNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiXG4gICAgdGhpcy5pc0Jvb2xlYW4gPSBzaGFwZSA9PT0gXCJib29sZWFuXCJcbiAgICB0aGlzLmlzU3RhY2sgPSBzaGFwZSA9PT0gXCJzdGFja1wiXG4gICAgdGhpcy5pc0luc2V0ID1cbiAgICAgIHNoYXBlID09PSBcImJvb2xlYW5cIiB8fCBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICB0aGlzLmlzQ29sb3IgPSBzaGFwZSA9PT0gXCJjb2xvclwiXG4gICAgdGhpcy5oYXNBcnJvdyA9IHNoYXBlID09PSBcImRyb3Bkb3duXCIgfHwgc2hhcGUgPT09IFwibnVtYmVyLWRyb3Bkb3duXCJcbiAgICB0aGlzLmlzRGFya2VyID1cbiAgICAgIHNoYXBlID09PSBcImJvb2xlYW5cIiB8fCBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImRyb3Bkb3duXCJcbiAgICB0aGlzLmlzU3F1YXJlID1cbiAgICAgIHNoYXBlID09PSBcInN0cmluZ1wiIHx8IHNoYXBlID09PSBcImNvbG9yXCIgfHwgc2hhcGUgPT09IFwiZHJvcGRvd25cIlxuXG4gICAgdGhpcy5oYXNMYWJlbCA9ICEodGhpcy5pc0NvbG9yIHx8IHRoaXMuaXNJbnNldClcbiAgICB0aGlzLmxhYmVsID0gdGhpcy5oYXNMYWJlbFxuICAgICAgPyBuZXcgTGFiZWwodmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICAgIDogbnVsbFxuICAgIHRoaXMueCA9IDBcbiAgfVxuICBJbnB1dC5wcm90b3R5cGUuaXNJbnB1dCA9IHRydWVcblxuICBJbnB1dC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIHZhbHVlLCBwYXJ0KSB7XG4gICAgdmFyIHNoYXBlID0ge1xuICAgICAgYjogXCJib29sZWFuXCIsXG4gICAgICBuOiBcIm51bWJlclwiLFxuICAgICAgczogXCJzdHJpbmdcIixcbiAgICAgIGQ6IFwibnVtYmVyLWRyb3Bkb3duXCIsXG4gICAgICBtOiBcImRyb3Bkb3duXCIsXG4gICAgICBjOiBcImNvbG9yXCIsXG4gICAgfVtwYXJ0WzFdXVxuXG4gICAgaWYgKHNoYXBlID09PSBcImNvbG9yXCIpIHtcbiAgICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApXG4gICAgICAgIHZhbHVlID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDI1NiAqIDI1NiAqIDI1NilcbiAgICAgIHZhbHVlID0gK3ZhbHVlXG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgICAgIHZhciBoZXggPSB2YWx1ZS50b1N0cmluZygxNilcbiAgICAgIGhleCA9IGhleC5zbGljZShNYXRoLm1heCgwLCBoZXgubGVuZ3RoIC0gNikpIC8vIGxhc3QgNiBjaGFyYWN0ZXJzXG4gICAgICB3aGlsZSAoaGV4Lmxlbmd0aCA8IDYpIGhleCA9IFwiMFwiICsgaGV4XG4gICAgICBpZiAoaGV4WzBdID09PSBoZXhbMV0gJiYgaGV4WzJdID09PSBoZXhbM10gJiYgaGV4WzRdID09PSBoZXhbNV0pIHtcbiAgICAgICAgaGV4ID0gaGV4WzBdICsgaGV4WzJdICsgaGV4WzRdXG4gICAgICB9XG4gICAgICB2YWx1ZSA9IFwiI1wiICsgaGV4XG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICB2YWx1ZSA9XG4gICAgICAgIHtcbiAgICAgICAgICBfbW91c2VfOiBcIm1vdXNlLXBvaW50ZXJcIixcbiAgICAgICAgICBfbXlzZWxmXzogXCJteXNlbGZcIixcbiAgICAgICAgICBfc3RhZ2VfOiBcIlN0YWdlXCIsXG4gICAgICAgICAgX2VkZ2VfOiBcImVkZ2VcIixcbiAgICAgICAgICBfcmFuZG9tXzogXCJyYW5kb20gcG9zaXRpb25cIixcbiAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWVcbiAgICAgIHZhciBtZW51ID0gdmFsdWVcbiAgICAgIHZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgfSBlbHNlIGlmIChzaGFwZSA9PT0gXCJudW1iZXItZHJvcGRvd25cIikge1xuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IElucHV0KHNoYXBlLCBcIlwiICsgdmFsdWUsIG1lbnUpXG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgYXNzZXJ0KHRoaXMudmFsdWVbMF0gPT09IFwiI1wiKVxuICAgICAgdmFyIGggPSB0aGlzLnZhbHVlLnNsaWNlKDEpXG4gICAgICBpZiAoaC5sZW5ndGggPT09IDMpIGggPSBoWzBdICsgaFswXSArIGhbMV0gKyBoWzFdICsgaFsyXSArIGhbMl1cbiAgICAgIHJldHVybiBwYXJzZUludChoLCAxNilcbiAgICAgIC8vIFRPRE8gc2lnbmVkIGludD9cbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlXG4gICAgICBpZiAodGhpcy5zaGFwZSA9PT0gXCJkcm9wZG93blwiKSB7XG4gICAgICAgIHZhbHVlID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm1vdXNlLXBvaW50ZXJcIjogXCJfbW91c2VfXCIsXG4gICAgICAgICAgICBteXNlbGY6IFwiX215c2VsZlwiLFxuICAgICAgICAgICAgU3RhZ2U6IFwiX3N0YWdlX1wiLFxuICAgICAgICAgICAgZWRnZTogXCJfZWRnZV9cIixcbiAgICAgICAgICAgIFwicmFuZG9tIHBvc2l0aW9uXCI6IFwiX3JhbmRvbV9cIixcbiAgICAgICAgICB9W3ZhbHVlXSB8fCB2YWx1ZVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNSb3VuZCkge1xuICAgICAgICB2YWx1ZSA9IG1heWJlTnVtYmVyKHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlzQm9vbGVhblxuICAgICAgPyBmYWxzZVxuICAgICAgOiB0aGlzLmlzUm91bmQgPyBtYXliZU51bWJlcih0aGlzLnZhbHVlKSA6IHRoaXMudmFsdWVcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc0NvbG9yKSB7XG4gICAgICBhc3NlcnQodGhpcy52YWx1ZVswXSA9PT0gXCIjXCIpXG4gICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLnZhbHVlICsgXCJdXCJcbiAgICB9XG4gICAgdmFyIHRleHQgPSAodGhpcy52YWx1ZSA/IFwiXCIgKyB0aGlzLnZhbHVlIDogXCJcIilcbiAgICAgIC5yZXBsYWNlKC8gdiQvLCBcIiBcXFxcdlwiKVxuICAgICAgLnJlcGxhY2UoLyhbXFxdXFxcXF0pL2csIFwiXFxcXCQxXCIpXG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHRleHQgKz0gXCIgdlwiXG4gICAgcmV0dXJuIHRoaXMuaXNSb3VuZFxuICAgICAgPyBcIihcIiArIHRleHQgKyBcIilcIlxuICAgICAgOiB0aGlzLmlzU3F1YXJlXG4gICAgICAgID8gXCJbXCIgKyB0ZXh0ICsgXCJdXCJcbiAgICAgICAgOiB0aGlzLmlzQm9vbGVhbiA/IFwiPD5cIiA6IHRoaXMuaXNTdGFjayA/IFwie31cIiA6IHRleHRcbiAgfVxuXG4gIElucHV0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlXG4gICAgICB0aGlzLnZhbHVlID0gbGFuZy5kcm9wZG93bnNbdmFsdWVdIHx8IHZhbHVlXG4gICAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHRoaXMudmFsdWUsIFtcInNiLWxpdGVyYWwtXCIgKyB0aGlzLnNoYXBlXSlcbiAgICB9XG4gIH1cblxuICBJbnB1dC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB0aGlzLmxhYmVsLm1lYXN1cmUoKVxuICB9XG5cbiAgSW5wdXQuc2hhcGVzID0ge1xuICAgIHN0cmluZzogU1ZHLnJvdW5kZWRSZWN0LFxuICAgIG51bWJlcjogU1ZHLnJvdW5kZWRSZWN0LFxuICAgIFwibnVtYmVyLWRyb3Bkb3duXCI6IFNWRy5yb3VuZGVkUmVjdCxcbiAgICBjb2xvcjogU1ZHLnJvdW5kZWRSZWN0LFxuICAgIGRyb3Bkb3duOiBTVkcucmVjdCxcblxuICAgIGJvb2xlYW46IFNWRy5wb2ludGVkUmVjdCxcbiAgICBzdGFjazogU1ZHLnN0YWNrUmVjdCxcbiAgICByZXBvcnRlcjogU1ZHLnJvdW5kZWRSZWN0LFxuICB9XG5cbiAgSW5wdXQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICBpZiAodGhpcy5oYXNMYWJlbCkge1xuICAgICAgdmFyIGxhYmVsID0gdGhpcy5sYWJlbC5kcmF3KClcbiAgICAgIHZhciB3ID0gTWF0aC5tYXgoXG4gICAgICAgIDE0LFxuICAgICAgICB0aGlzLmxhYmVsLndpZHRoICtcbiAgICAgICAgICAodGhpcy5zaGFwZSA9PT0gXCJzdHJpbmdcIiB8fCB0aGlzLnNoYXBlID09PSBcIm51bWJlci1kcm9wZG93blwiID8gNiA6IDkpXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3ID0gdGhpcy5pc0luc2V0ID8gMzAgOiB0aGlzLmlzQ29sb3IgPyAxMyA6IG51bGxcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHcgKz0gMTBcbiAgICB0aGlzLndpZHRoID0gd1xuXG4gICAgdmFyIGggPSAodGhpcy5oZWlnaHQgPSB0aGlzLmlzUm91bmQgfHwgdGhpcy5pc0NvbG9yID8gMTMgOiAxNClcblxuICAgIHZhciBlbCA9IElucHV0LnNoYXBlc1t0aGlzLnNoYXBlXSh3LCBoKVxuICAgIGlmICh0aGlzLmlzQ29sb3IpIHtcbiAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICBmaWxsOiB0aGlzLnZhbHVlLFxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNEYXJrZXIpIHtcbiAgICAgIGVsID0gZGFya1JlY3QodywgaCwgcGFyZW50LmluZm8uY2F0ZWdvcnksIGVsKVxuICAgICAgaWYgKHBhcmVudC5pbmZvLmNvbG9yKSB7XG4gICAgICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgICAgIGZpbGw6IHBhcmVudC5pbmZvLmNvbG9yLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGNsYXNzOiBbXCJzYi1pbnB1dFwiLCBcInNiLWlucHV0LVwiICsgdGhpcy5zaGFwZV0uam9pbihcIiBcIiksXG4gICAgICB9KSxcbiAgICBdKVxuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB7XG4gICAgICB2YXIgeCA9IHRoaXMuaXNSb3VuZCA/IDUgOiA0XG4gICAgICByZXN1bHQuYXBwZW5kQ2hpbGQoU1ZHLm1vdmUoeCwgMCwgbGFiZWwpKVxuICAgIH1cbiAgICBpZiAodGhpcy5oYXNBcnJvdykge1xuICAgICAgdmFyIHkgPSB0aGlzLnNoYXBlID09PSBcImRyb3Bkb3duXCIgPyA1IDogNFxuICAgICAgcmVzdWx0LmFwcGVuZENoaWxkKFxuICAgICAgICBTVkcubW92ZShcbiAgICAgICAgICB3IC0gMTAsXG4gICAgICAgICAgeSxcbiAgICAgICAgICBTVkcucG9seWdvbih7XG4gICAgICAgICAgICBwb2ludHM6IFs3LCAwLCAzLjUsIDQsIDAsIDBdLFxuICAgICAgICAgICAgZmlsbDogXCIjRkZGXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiBcIjAuNlwiLFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyogQmxvY2sgKi9cblxuICB2YXIgQmxvY2sgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgY29tbWVudCkge1xuICAgIGFzc2VydChpbmZvKVxuICAgIHRoaXMuaW5mbyA9IGluZm9cbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW5cbiAgICB0aGlzLmNvbW1lbnQgPSBjb21tZW50IHx8IG51bGxcbiAgICB0aGlzLmRpZmYgPSBudWxsXG5cbiAgICB2YXIgc2hhcGUgPSB0aGlzLmluZm8uc2hhcGVcbiAgICB0aGlzLmlzSGF0ID0gc2hhcGUgPT09IFwiaGF0XCIgfHwgc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgdGhpcy5oYXNQdXp6bGUgPSBzaGFwZSA9PT0gXCJzdGFja1wiIHx8IHNoYXBlID09PSBcImhhdFwiXG4gICAgdGhpcy5pc0ZpbmFsID0gL2NhcC8udGVzdChzaGFwZSlcbiAgICB0aGlzLmlzQ29tbWFuZCA9IHNoYXBlID09PSBcInN0YWNrXCIgfHwgc2hhcGUgPT09IFwiY2FwXCIgfHwgL2Jsb2NrLy50ZXN0KHNoYXBlKVxuICAgIHRoaXMuaXNPdXRsaW5lID0gc2hhcGUgPT09IFwib3V0bGluZVwiXG4gICAgdGhpcy5pc1JlcG9ydGVyID0gc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09IFwiYm9vbGVhblwiXG5cbiAgICB0aGlzLmlzUmluZyA9IHNoYXBlID09PSBcInJpbmdcIlxuICAgIHRoaXMuaGFzU2NyaXB0ID0gL2Jsb2NrLy50ZXN0KHNoYXBlKVxuICAgIHRoaXMuaXNFbHNlID0gc2hhcGUgPT09IFwiY2Vsc2VcIlxuICAgIHRoaXMuaXNFbmQgPSBzaGFwZSA9PT0gXCJjZW5kXCJcblxuICAgIHRoaXMueCA9IDBcbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMuZmlyc3RMaW5lID0gbnVsbFxuICAgIHRoaXMuaW5uZXJXaWR0aCA9IG51bGxcbiAgfVxuICBCbG9jay5wcm90b3R5cGUuaXNCbG9jayA9IHRydWVcblxuICBCbG9jay5mcm9tSlNPTiA9IGZ1bmN0aW9uKGxhbmcsIGFycmF5LCBwYXJ0KSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheS5zbGljZSgpXG4gICAgdmFyIHNlbGVjdG9yID0gYXJncy5zaGlmdCgpXG4gICAgaWYgKHNlbGVjdG9yID09PSBcInByb2NEZWZcIikge1xuICAgICAgdmFyIHNwZWMgPSBhcmdzWzBdXG4gICAgICB2YXIgaW5wdXROYW1lcyA9IGFyZ3NbMV0uc2xpY2UoKVxuICAgICAgLy8gdmFyIGRlZmF1bHRWYWx1ZXMgPSBhcmdzWzJdO1xuICAgICAgLy8gdmFyIGlzQXRvbWljID0gYXJnc1szXTsgLy8gVE9ET1xuXG4gICAgICB2YXIgaW5mbyA9IHBhcnNlU3BlYyhzcGVjKVxuICAgICAgdmFyIGNoaWxkcmVuID0gaW5mby5wYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgICBpZiAoaW5wdXRQYXQudGVzdChwYXJ0KSkge1xuICAgICAgICAgIHZhciBsYWJlbCA9IG5ldyBMYWJlbChpbnB1dE5hbWVzLnNoaWZ0KCkpXG4gICAgICAgICAgcmV0dXJuIG5ldyBCbG9jayhcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc2hhcGU6IHBhcnRbMV0gPT09IFwiYlwiID8gXCJib29sZWFuXCIgOiBcInJlcG9ydGVyXCIsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbbGFiZWxdXG4gICAgICAgICAgKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgTGFiZWwocGFydClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHZhciBvdXRsaW5lID0gbmV3IEJsb2NrKFxuICAgICAgICB7XG4gICAgICAgICAgc2hhcGU6IFwib3V0bGluZVwiLFxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuXG4gICAgICB2YXIgY2hpbGRyZW4gPSBbbmV3IExhYmVsKGxhbmcuZGVmaW5lWzBdKSwgb3V0bGluZV1cbiAgICAgIHJldHVybiBuZXcgQmxvY2soXG4gICAgICAgIHtcbiAgICAgICAgICBzaGFwZTogXCJkZWZpbmUtaGF0XCIsXG4gICAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tXCIsXG4gICAgICAgICAgc2VsZWN0b3I6IFwicHJvY0RlZlwiLFxuICAgICAgICAgIGNhbGw6IHNwZWMsXG4gICAgICAgICAgbmFtZXM6IGFyZ3NbMV0sXG4gICAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChzZWxlY3RvciA9PT0gXCJjYWxsXCIpIHtcbiAgICAgIHZhciBzcGVjID0gYXJncy5zaGlmdCgpXG4gICAgICB2YXIgaW5mbyA9IGV4dGVuZChwYXJzZVNwZWMoc3BlYyksIHtcbiAgICAgICAgY2F0ZWdvcnk6IFwiY3VzdG9tXCIsXG4gICAgICAgIHNoYXBlOiBcInN0YWNrXCIsXG4gICAgICAgIHNlbGVjdG9yOiBcImNhbGxcIixcbiAgICAgICAgY2FsbDogc3BlYyxcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICB9KVxuICAgICAgdmFyIHBhcnRzID0gaW5mby5wYXJ0c1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBzZWxlY3RvciA9PT0gXCJyZWFkVmFyaWFibGVcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiY29udGVudHNPZkxpc3Q6XCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImdldFBhcmFtXCJcbiAgICApIHtcbiAgICAgIHZhciBzaGFwZSA9XG4gICAgICAgIHNlbGVjdG9yID09PSBcImdldFBhcmFtXCIgJiYgYXJncy5wb3AoKSA9PT0gXCJiXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIlxuICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgICAgc2hhcGU6IHNoYXBlLFxuICAgICAgICBjYXRlZ29yeToge1xuICAgICAgICAgIHJlYWRWYXJpYWJsZTogXCJ2YXJpYWJsZXNcIixcbiAgICAgICAgICBcImNvbnRlbnRzT2ZMaXN0OlwiOiBcImxpc3RcIixcbiAgICAgICAgICBnZXRQYXJhbTogXCJjdXN0b20tYXJnXCIsXG4gICAgICAgIH1bc2VsZWN0b3JdLFxuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQmxvY2soaW5mbywgW25ldyBMYWJlbChhcmdzWzBdKV0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpbmZvID0gZXh0ZW5kKGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3JdLCB7XG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfSlcbiAgICAgIGFzc2VydChpbmZvLCBcInVua25vd24gc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpXG4gICAgICB2YXIgc3BlYyA9IGxhbmcuY29tbWFuZHNbaW5mby5zcGVjXSB8fCBzcGVjXG4gICAgICB2YXIgcGFydHMgPSBzcGVjID8gcGFyc2VTcGVjKHNwZWMpLnBhcnRzIDogaW5mby5wYXJ0c1xuICAgIH1cbiAgICB2YXIgY2hpbGRyZW4gPSBwYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgaWYgKGlucHV0UGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgdmFyIGFyZyA9IGFyZ3Muc2hpZnQoKVxuICAgICAgICByZXR1cm4gKGlzQXJyYXkoYXJnKSA/IEJsb2NrIDogSW5wdXQpLmZyb21KU09OKGxhbmcsIGFyZywgcGFydClcbiAgICAgIH0gZWxzZSBpZiAoaWNvblBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSWNvbihwYXJ0LnNsaWNlKDEpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYWJlbChwYXJ0LnRyaW0oKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihsaXN0LCBpbmRleCkge1xuICAgICAgbGlzdCA9IGxpc3QgfHwgW11cbiAgICAgIGFzc2VydChpc0FycmF5KGxpc3QpKVxuICAgICAgY2hpbGRyZW4ucHVzaChuZXcgU2NyaXB0KGxpc3QubWFwKEJsb2NrLmZyb21KU09OLmJpbmQobnVsbCwgbGFuZykpKSlcbiAgICAgIGlmIChzZWxlY3RvciA9PT0gXCJkb0lmRWxzZVwiICYmIGluZGV4ID09PSAwKSB7XG4gICAgICAgIGNoaWxkcmVuLnB1c2gobmV3IExhYmVsKGxhbmcuY29tbWFuZHNbXCJlbHNlXCJdKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIFRPRE8gbG9vcCBhcnJvd3NcbiAgICByZXR1cm4gbmV3IEJsb2NrKGluZm8sIGNoaWxkcmVuKVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuaW5mby5zZWxlY3RvclxuICAgIHZhciBhcmdzID0gW11cblxuICAgIGlmIChzZWxlY3RvciA9PT0gXCJwcm9jRGVmXCIpIHtcbiAgICAgIHZhciBpbnB1dE5hbWVzID0gdGhpcy5pbmZvLm5hbWVzXG4gICAgICB2YXIgc3BlYyA9IHRoaXMuaW5mby5jYWxsXG4gICAgICB2YXIgaW5mbyA9IHBhcnNlU3BlYyhzcGVjKVxuICAgICAgdmFyIGRlZmF1bHRWYWx1ZXMgPSBpbmZvLmlucHV0cy5tYXAoZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09PSBcIiVuXCIgPyAxIDogaW5wdXQgPT09IFwiJWJcIiA/IGZhbHNlIDogXCJcIlxuICAgICAgfSlcbiAgICAgIHZhciBpc0F0b21pYyA9IGZhbHNlIC8vIFRPRE8gJ2RlZmluZS1hdG9taWMnID8/XG4gICAgICByZXR1cm4gW1wicHJvY0RlZlwiLCBzcGVjLCBpbnB1dE5hbWVzLCBkZWZhdWx0VmFsdWVzLCBpc0F0b21pY11cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBzZWxlY3RvciA9PT0gXCJyZWFkVmFyaWFibGVcIiB8fFxuICAgICAgc2VsZWN0b3IgPT09IFwiY29udGVudHNPZkxpc3Q6XCIgfHxcbiAgICAgIHNlbGVjdG9yID09PSBcImdldFBhcmFtXCJcbiAgICApIHtcbiAgICAgIGFyZ3MucHVzaChibG9ja05hbWUodGhpcykpXG4gICAgICBpZiAoc2VsZWN0b3IgPT09IFwiZ2V0UGFyYW1cIilcbiAgICAgICAgYXJncy5wdXNoKHRoaXMuaXNCb29sZWFuID09PSBcImJvb2xlYW5cIiA/IFwiYlwiIDogXCJyXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldXG4gICAgICAgIGlmIChjaGlsZC5pc0lucHV0IHx8IGNoaWxkLmlzQmxvY2sgfHwgY2hpbGQuaXNTY3JpcHQpIHtcbiAgICAgICAgICBhcmdzLnB1c2goY2hpbGQudG9KU09OKCkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdG9yID09PSBcImNhbGxcIikge1xuICAgICAgICByZXR1cm4gW1wiY2FsbFwiLCB0aGlzLmluZm8uY2FsbF0uY29uY2F0KGFyZ3MpXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghc2VsZWN0b3IpIHRocm93IFwidW5rbm93biBibG9jazogXCIgKyB0aGlzLmluZm8uaGFzaFxuICAgIHJldHVybiBbc2VsZWN0b3JdLmNvbmNhdChhcmdzKVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKGV4dHJhcykge1xuICAgIHZhciBmaXJzdElucHV0ID0gbnVsbFxuICAgIHZhciBjaGVja0FsaWFzID0gZmFsc2VcbiAgICB2YXIgdGV4dCA9IHRoaXMuY2hpbGRyZW5cbiAgICAgIC5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgaWYgKGNoaWxkLmlzSWNvbikgY2hlY2tBbGlhcyA9IHRydWVcbiAgICAgICAgaWYgKCFmaXJzdElucHV0ICYmICEoY2hpbGQuaXNMYWJlbCB8fCBjaGlsZC5pc0ljb24pKSBmaXJzdElucHV0ID0gY2hpbGRcbiAgICAgICAgcmV0dXJuIGNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgPyBcIlxcblwiICsgaW5kZW50KGNoaWxkLnN0cmluZ2lmeSgpKSArIFwiXFxuXCJcbiAgICAgICAgICA6IGNoaWxkLnN0cmluZ2lmeSgpLnRyaW0oKSArIFwiIFwiXG4gICAgICB9KVxuICAgICAgLmpvaW4oXCJcIilcbiAgICAgIC50cmltKClcblxuICAgIHZhciBsYW5nID0gdGhpcy5pbmZvLmxhbmd1YWdlXG4gICAgaWYgKGNoZWNrQWxpYXMgJiYgbGFuZyAmJiB0aGlzLmluZm8uc2VsZWN0b3IpIHtcbiAgICAgIHZhciB0eXBlID0gYmxvY2tzQnlTZWxlY3Rvclt0aGlzLmluZm8uc2VsZWN0b3JdXG4gICAgICB2YXIgc3BlYyA9IHR5cGUuc3BlY1xuICAgICAgdmFyIGFsaWFzID0gbGFuZy5uYXRpdmVBbGlhc2VzW3R5cGUuc3BlY11cbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICAvLyBUT0RPIG1ha2UgdHJhbnNsYXRlKCkgbm90IGluLXBsYWNlLCBhbmQgdXNlIHRoYXRcbiAgICAgICAgaWYgKGlucHV0UGF0LnRlc3QoYWxpYXMpICYmIGZpcnN0SW5wdXQpIHtcbiAgICAgICAgICBhbGlhcyA9IGFsaWFzLnJlcGxhY2UoaW5wdXRQYXQsIGZpcnN0SW5wdXQuc3RyaW5naWZ5KCkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsaWFzXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG92ZXJyaWRlcyA9IGV4dHJhcyB8fCBcIlwiXG4gICAgaWYgKFxuICAgICAgKHRoaXMuaW5mby5zaGFwZSA9PT0gXCJyZXBvcnRlclwiICYmIHRoaXMuaXNSZXBvcnRlcikgfHxcbiAgICAgICh0aGlzLmluZm8uY2F0ZWdvcnkgPT09IFwiY3VzdG9tLWFyZ1wiICYmXG4gICAgICAgICh0aGlzLmlzUmVwb3J0ZXIgfHwgdGhpcy5pc0Jvb2xlYW4pKSB8fFxuICAgICAgKHRoaXMuaW5mby5jYXRlZ29yeSA9PT0gXCJjdXN0b21cIiAmJiB0aGlzLmluZm8uc2hhcGUgPT09IFwic3RhY2tcIilcbiAgICApIHtcbiAgICAgIGlmIChvdmVycmlkZXMpIG92ZXJyaWRlcyArPSBcIiBcIlxuICAgICAgb3ZlcnJpZGVzICs9IHRoaXMuaW5mby5jYXRlZ29yeVxuICAgIH1cbiAgICBpZiAob3ZlcnJpZGVzKSB7XG4gICAgICB0ZXh0ICs9IFwiIDo6IFwiICsgb3ZlcnJpZGVzXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmhhc1NjcmlwdFxuICAgICAgPyB0ZXh0ICsgXCJcXG5lbmRcIlxuICAgICAgOiB0aGlzLmluZm8uc2hhcGUgPT09IFwicmVwb3J0ZXJcIlxuICAgICAgICA/IFwiKFwiICsgdGV4dCArIFwiKVwiXG4gICAgICAgIDogdGhpcy5pbmZvLnNoYXBlID09PSBcImJvb2xlYW5cIiA/IFwiPFwiICsgdGV4dCArIFwiPlwiIDogdGV4dFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcsIGlzU2hhbGxvdykge1xuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuaW5mby5zZWxlY3RvclxuICAgIGlmICghc2VsZWN0b3IpIHJldHVyblxuICAgIGlmIChzZWxlY3RvciA9PT0gXCJwcm9jRGVmXCIpIHtcbiAgICAgIGFzc2VydCh0aGlzLmNoaWxkcmVuWzBdLmlzTGFiZWwpXG4gICAgICB0aGlzLmNoaWxkcmVuWzBdID0gbmV3IExhYmVsKGxhbmcuZGVmaW5lWzBdIHx8IGVuZ2xpc2guZGVmaW5lWzBdKVxuICAgIH1cbiAgICB2YXIgYmxvY2sgPSBibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yXVxuICAgIGlmICghYmxvY2spIHJldHVyblxuICAgIHZhciBuYXRpdmVTcGVjID0gbGFuZy5jb21tYW5kc1tibG9jay5zcGVjXVxuICAgIGlmICghbmF0aXZlU3BlYykgcmV0dXJuXG4gICAgdmFyIG5hdGl2ZUluZm8gPSBwYXJzZVNwZWMobmF0aXZlU3BlYylcbiAgICB2YXIgYXJncyA9IHRoaXMuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICByZXR1cm4gIWNoaWxkLmlzTGFiZWwgJiYgIWNoaWxkLmlzSWNvblxuICAgIH0pXG4gICAgaWYgKCFpc1NoYWxsb3cpXG4gICAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgY2hpbGQudHJhbnNsYXRlKGxhbmcpXG4gICAgICB9KVxuICAgIHRoaXMuY2hpbGRyZW4gPSBuYXRpdmVJbmZvLnBhcnRzXG4gICAgICAubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgdmFyIHBhcnQgPSBwYXJ0LnRyaW0oKVxuICAgICAgICBpZiAoIXBhcnQpIHJldHVyblxuICAgICAgICByZXR1cm4gaW5wdXRQYXQudGVzdChwYXJ0KVxuICAgICAgICAgID8gYXJncy5zaGlmdCgpXG4gICAgICAgICAgOiBpY29uUGF0LnRlc3QocGFydCkgPyBuZXcgSWNvbihwYXJ0LnNsaWNlKDEpKSA6IG5ldyBMYWJlbChwYXJ0KVxuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgYXJncy5mb3JFYWNoKFxuICAgICAgZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgICB9LmJpbmQodGhpcylcbiAgICApXG4gICAgdGhpcy5pbmZvLmxhbmd1YWdlID0gbGFuZ1xuICAgIHRoaXMuaW5mby5pc1JUTCA9IHJ0bExhbmd1YWdlcy5pbmRleE9mKGxhbmcuY29kZSkgPiAtMVxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV1cbiAgICAgIGlmIChjaGlsZC5tZWFzdXJlKSBjaGlsZC5tZWFzdXJlKClcbiAgICB9XG4gICAgaWYgKHRoaXMuY29tbWVudCkgdGhpcy5jb21tZW50Lm1lYXN1cmUoKVxuICB9XG5cbiAgQmxvY2suc2hhcGVzID0ge1xuICAgIHN0YWNrOiBTVkcuc3RhY2tSZWN0LFxuICAgIFwiYy1ibG9ja1wiOiBTVkcuc3RhY2tSZWN0LFxuICAgIFwiaWYtYmxvY2tcIjogU1ZHLnN0YWNrUmVjdCxcbiAgICBjZWxzZTogU1ZHLnN0YWNrUmVjdCxcbiAgICBjZW5kOiBTVkcuc3RhY2tSZWN0LFxuXG4gICAgY2FwOiBTVkcuY2FwUmVjdCxcbiAgICByZXBvcnRlcjogU1ZHLnJvdW5kZWRSZWN0LFxuICAgIGJvb2xlYW46IFNWRy5wb2ludGVkUmVjdCxcbiAgICBoYXQ6IFNWRy5oYXRSZWN0LFxuICAgIFwiZGVmaW5lLWhhdFwiOiBTVkcucHJvY0hhdFJlY3QsXG4gICAgcmluZzogU1ZHLnJvdW5kZWRSZWN0LFxuICB9XG5cbiAgQmxvY2sucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24odywgaCwgbGluZXMpIHtcbiAgICAvLyBtb3V0aHNcbiAgICBpZiAobGluZXMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIFNWRy5tb3V0aFJlY3QodywgaCwgdGhpcy5pc0ZpbmFsLCBsaW5lcywge1xuICAgICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIG91dGxpbmVzXG4gICAgaWYgKHRoaXMuaW5mby5zaGFwZSA9PT0gXCJvdXRsaW5lXCIpIHtcbiAgICAgIHJldHVybiBTVkcuc2V0UHJvcHMoU1ZHLnN0YWNrUmVjdCh3LCBoKSwge1xuICAgICAgICBjbGFzczogXCJzYi1vdXRsaW5lXCIsXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIHJpbmdzXG4gICAgaWYgKHRoaXMuaXNSaW5nKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuWzBdXG4gICAgICBpZiAoY2hpbGQgJiYgKGNoaWxkLmlzSW5wdXQgfHwgY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc1NjcmlwdCkpIHtcbiAgICAgICAgdmFyIHNoYXBlID0gY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICA/IFwic3RhY2tcIlxuICAgICAgICAgIDogY2hpbGQuaXNJbnB1dCA/IGNoaWxkLnNoYXBlIDogY2hpbGQuaW5mby5zaGFwZVxuICAgICAgICByZXR1cm4gU1ZHLnJpbmdSZWN0KHcsIGgsIGNoaWxkLnksIGNoaWxkLndpZHRoLCBjaGlsZC5oZWlnaHQsIHNoYXBlLCB7XG4gICAgICAgICAgY2xhc3M6IFtcInNiLVwiICsgdGhpcy5pbmZvLmNhdGVnb3J5LCBcInNiLWJldmVsXCJdLmpvaW4oXCIgXCIpLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBmdW5jID0gQmxvY2suc2hhcGVzW3RoaXMuaW5mby5zaGFwZV1cbiAgICBhc3NlcnQoZnVuYywgXCJubyBzaGFwZSBmdW5jOiBcIiArIHRoaXMuaW5mby5zaGFwZSlcbiAgICByZXR1cm4gZnVuYyh3LCBoLCB7XG4gICAgICBjbGFzczogW1wic2ItXCIgKyB0aGlzLmluZm8uY2F0ZWdvcnksIFwic2ItYmV2ZWxcIl0uam9pbihcIiBcIiksXG4gICAgfSlcbiAgfVxuXG4gIEJsb2NrLnByb3RvdHlwZS5taW5EaXN0YW5jZSA9IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKHRoaXMuaXNCb29sZWFuKSB7XG4gICAgICByZXR1cm4gY2hpbGQuaXNSZXBvcnRlclxuICAgICAgICA/ICg0ICsgY2hpbGQuaGVpZ2h0IC8gNCkgfCAwXG4gICAgICAgIDogY2hpbGQuaXNMYWJlbFxuICAgICAgICAgID8gKDUgKyBjaGlsZC5oZWlnaHQgLyAyKSB8IDBcbiAgICAgICAgICA6IGNoaWxkLmlzQm9vbGVhbiB8fCBjaGlsZC5zaGFwZSA9PT0gXCJib29sZWFuXCJcbiAgICAgICAgICAgID8gNVxuICAgICAgICAgICAgOiAoMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgIH1cbiAgICBpZiAodGhpcy5pc1JlcG9ydGVyKSB7XG4gICAgICByZXR1cm4gKGNoaWxkLmlzSW5wdXQgJiYgY2hpbGQuaXNSb3VuZCkgfHxcbiAgICAgICAgKChjaGlsZC5pc1JlcG9ydGVyIHx8IGNoaWxkLmlzQm9vbGVhbikgJiYgIWNoaWxkLmhhc1NjcmlwdClcbiAgICAgICAgPyAwXG4gICAgICAgIDogY2hpbGQuaXNMYWJlbFxuICAgICAgICAgID8gKDIgKyBjaGlsZC5oZWlnaHQgLyAyKSB8IDBcbiAgICAgICAgICA6ICgtMiArIGNoaWxkLmhlaWdodCAvIDIpIHwgMFxuICAgIH1cbiAgICByZXR1cm4gMFxuICB9XG5cbiAgQmxvY2sucGFkZGluZyA9IHtcbiAgICBoYXQ6IFsxNSwgNiwgNl0sXG4gICAgXCJkZWZpbmUtaGF0XCI6IFsyMSwgOCwgOV0sXG4gICAgcmVwb3J0ZXI6IFs1LCAzLCAyXSxcbiAgICBib29sZWFuOiBbNSwgMiwgMl0sXG4gICAgY2FwOiBbOCwgNiwgMl0sXG4gICAgXCJjLWJsb2NrXCI6IFs4LCA2LCA1XSxcbiAgICBcImlmLWJsb2NrXCI6IFs4LCA2LCA1XSxcbiAgICByaW5nOiBbMTAsIDQsIDEwXSxcbiAgICBudWxsOiBbOCwgNiwgNV0sXG4gIH1cblxuICBCbG9jay5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0RlZmluZSA9IHRoaXMuaW5mby5zaGFwZSA9PT0gXCJkZWZpbmUtaGF0XCJcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuXG5cbiAgICB2YXIgcGFkZGluZyA9IEJsb2NrLnBhZGRpbmdbdGhpcy5pbmZvLnNoYXBlXSB8fCBCbG9jay5wYWRkaW5nW251bGxdXG4gICAgdmFyIHB0ID0gcGFkZGluZ1swXSxcbiAgICAgIHB4ID0gcGFkZGluZ1sxXSxcbiAgICAgIHBiID0gcGFkZGluZ1syXVxuXG4gICAgdmFyIHkgPSAwXG4gICAgdmFyIExpbmUgPSBmdW5jdGlvbih5KSB7XG4gICAgICB0aGlzLnkgPSB5XG4gICAgICB0aGlzLndpZHRoID0gMFxuICAgICAgdGhpcy5oZWlnaHQgPSB5ID8gMTMgOiAxNlxuICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgfVxuXG4gICAgdmFyIGlubmVyV2lkdGggPSAwXG4gICAgdmFyIHNjcmlwdFdpZHRoID0gMFxuICAgIHZhciBsaW5lID0gbmV3IExpbmUoeSlcbiAgICBmdW5jdGlvbiBwdXNoTGluZShpc0xhc3QpIHtcbiAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbGluZS5oZWlnaHQgKz0gcHQgKyBwYlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGluZS5oZWlnaHQgKz0gaXNMYXN0ID8gMCA6ICsyXG4gICAgICAgIGxpbmUueSAtPSAxXG4gICAgICB9XG4gICAgICB5ICs9IGxpbmUuaGVpZ2h0XG4gICAgICBsaW5lcy5wdXNoKGxpbmUpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5mby5pc1JUTCkge1xuICAgICAgdmFyIHN0YXJ0ID0gMFxuICAgICAgdmFyIGZsaXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBjaGlsZHJlblxuICAgICAgICAgIC5zbGljZSgwLCBzdGFydClcbiAgICAgICAgICAuY29uY2F0KGNoaWxkcmVuLnNsaWNlKHN0YXJ0LCBpKS5yZXZlcnNlKCkpXG4gICAgICAgICAgLmNvbmNhdChjaGlsZHJlbi5zbGljZShpKSlcbiAgICAgIH0uYmluZCh0aGlzKVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY2hpbGRyZW5baV0uaXNTY3JpcHQpIHtcbiAgICAgICAgICBmbGlwKClcbiAgICAgICAgICBzdGFydCA9IGkgKyAxXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzdGFydCA8IGkpIHtcbiAgICAgICAgZmxpcCgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxpbmVzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgY2hpbGQuZWwgPSBjaGlsZC5kcmF3KHRoaXMpXG5cbiAgICAgIGlmIChjaGlsZC5pc1NjcmlwdCAmJiB0aGlzLmlzQ29tbWFuZCkge1xuICAgICAgICB0aGlzLmhhc1NjcmlwdCA9IHRydWVcbiAgICAgICAgcHVzaExpbmUoKVxuICAgICAgICBjaGlsZC55ID0geVxuICAgICAgICBsaW5lcy5wdXNoKGNoaWxkKVxuICAgICAgICBzY3JpcHRXaWR0aCA9IE1hdGgubWF4KHNjcmlwdFdpZHRoLCBNYXRoLm1heCgxLCBjaGlsZC53aWR0aCkpXG4gICAgICAgIGNoaWxkLmhlaWdodCA9IE1hdGgubWF4KDEyLCBjaGlsZC5oZWlnaHQpICsgM1xuICAgICAgICB5ICs9IGNoaWxkLmhlaWdodFxuICAgICAgICBsaW5lID0gbmV3IExpbmUoeSlcbiAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNBcnJvdykge1xuICAgICAgICBsaW5lLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgY213ID0gaSA+IDAgPyAzMCA6IDAgLy8gMjdcbiAgICAgICAgdmFyIG1kID0gdGhpcy5pc0NvbW1hbmQgPyAwIDogdGhpcy5taW5EaXN0YW5jZShjaGlsZClcbiAgICAgICAgdmFyIG13ID0gdGhpcy5pc0NvbW1hbmRcbiAgICAgICAgICA/IGNoaWxkLmlzQmxvY2sgfHwgY2hpbGQuaXNJbnB1dCA/IGNtdyA6IDBcbiAgICAgICAgICA6IG1kXG4gICAgICAgIGlmIChtdyAmJiAhbGluZXMubGVuZ3RoICYmIGxpbmUud2lkdGggPCBtdyAtIHB4KSB7XG4gICAgICAgICAgbGluZS53aWR0aCA9IG13IC0gcHhcbiAgICAgICAgfVxuICAgICAgICBjaGlsZC54ID0gbGluZS53aWR0aFxuICAgICAgICBsaW5lLndpZHRoICs9IGNoaWxkLndpZHRoXG4gICAgICAgIGlubmVyV2lkdGggPSBNYXRoLm1heChpbm5lcldpZHRoLCBsaW5lLndpZHRoICsgTWF0aC5tYXgoMCwgbWQgLSBweCkpXG4gICAgICAgIGxpbmUud2lkdGggKz0gNFxuICAgICAgICBpZiAoIWNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgICBsaW5lLmhlaWdodCA9IE1hdGgubWF4KGxpbmUuaGVpZ2h0LCBjaGlsZC5oZWlnaHQpXG4gICAgICAgIH1cbiAgICAgICAgbGluZS5jaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgICAgfVxuICAgIH1cbiAgICBwdXNoTGluZSh0cnVlKVxuXG4gICAgaW5uZXJXaWR0aCA9IE1hdGgubWF4KFxuICAgICAgaW5uZXJXaWR0aCArIHB4ICogMixcbiAgICAgIHRoaXMuaXNIYXQgfHwgdGhpcy5oYXNTY3JpcHRcbiAgICAgICAgPyA4M1xuICAgICAgICA6IHRoaXMuaXNDb21tYW5kIHx8IHRoaXMuaXNPdXRsaW5lIHx8IHRoaXMuaXNSaW5nID8gMzkgOiAyMFxuICAgIClcbiAgICB0aGlzLmhlaWdodCA9IHlcbiAgICB0aGlzLndpZHRoID0gc2NyaXB0V2lkdGhcbiAgICAgID8gTWF0aC5tYXgoaW5uZXJXaWR0aCwgMTUgKyBzY3JpcHRXaWR0aClcbiAgICAgIDogaW5uZXJXaWR0aFxuICAgIGlmIChpc0RlZmluZSkge1xuICAgICAgdmFyIHAgPSBNYXRoLm1pbigyNiwgKDMuNSArIDAuMTMgKiBpbm5lcldpZHRoKSB8IDApIC0gMThcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IHBcbiAgICAgIHB0ICs9IDIgKiBwXG4gICAgfVxuICAgIHRoaXMuZmlyc3RMaW5lID0gbGluZXNbMF1cbiAgICB0aGlzLmlubmVyV2lkdGggPSBpbm5lcldpZHRoXG5cbiAgICB2YXIgb2JqZWN0cyA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGluZSA9IGxpbmVzW2ldXG4gICAgICBpZiAobGluZS5pc1NjcmlwdCkge1xuICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUoMTUsIGxpbmUueSwgbGluZS5lbCkpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHZhciBoID0gbGluZS5oZWlnaHRcblxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGxpbmUuY2hpbGRyZW5bal1cbiAgICAgICAgaWYgKGNoaWxkLmlzQXJyb3cpIHtcbiAgICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUoaW5uZXJXaWR0aCAtIDE1LCB0aGlzLmhlaWdodCAtIDMsIGNoaWxkLmVsKSlcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHkgPSBwdCArIChoIC0gY2hpbGQuaGVpZ2h0IC0gcHQgLSBwYikgLyAyIC0gMVxuICAgICAgICBpZiAoaXNEZWZpbmUgJiYgY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICAgIHkgKz0gM1xuICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzSWNvbikge1xuICAgICAgICAgIHkgKz0gY2hpbGQuZHkgfCAwXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaXNSaW5nKSB7XG4gICAgICAgICAgY2hpbGQueSA9IChsaW5lLnkgKyB5KSB8IDBcbiAgICAgICAgICBpZiAoY2hpbGQuaXNJbnNldCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKHB4ICsgY2hpbGQueCwgKGxpbmUueSArIHkpIHwgMCwgY2hpbGQuZWwpKVxuXG4gICAgICAgIGlmIChjaGlsZC5kaWZmID09PSBcIitcIikge1xuICAgICAgICAgIHZhciBlbGxpcHNlID0gU1ZHLmluc0VsbGlwc2UoY2hpbGQud2lkdGgsIGNoaWxkLmhlaWdodClcbiAgICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUocHggKyBjaGlsZC54LCAobGluZS55ICsgeSkgfCAwLCBlbGxpcHNlKSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBlbCA9IHRoaXMuZHJhd1NlbGYoaW5uZXJXaWR0aCwgdGhpcy5oZWlnaHQsIGxpbmVzKVxuICAgIG9iamVjdHMuc3BsaWNlKDAsIDAsIGVsKVxuICAgIGlmICh0aGlzLmluZm8uY29sb3IpIHtcbiAgICAgIHNldFByb3BzKGVsLCB7XG4gICAgICAgIGZpbGw6IHRoaXMuaW5mby5jb2xvcixcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIFNWRy5ncm91cChvYmplY3RzKVxuICB9XG5cbiAgLyogQ29tbWVudCAqL1xuXG4gIHZhciBDb21tZW50ID0gZnVuY3Rpb24odmFsdWUsIGhhc0Jsb2NrKSB7XG4gICAgdGhpcy5sYWJlbCA9IG5ldyBMYWJlbCh2YWx1ZSwgW1wic2ItY29tbWVudC1sYWJlbFwiXSlcbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGFzQmxvY2sgPSBoYXNCbG9ja1xuICB9XG4gIENvbW1lbnQucHJvdG90eXBlLmlzQ29tbWVudCA9IHRydWVcbiAgQ29tbWVudC5saW5lTGVuZ3RoID0gMTJcbiAgQ29tbWVudC5wcm90b3R5cGUuaGVpZ2h0ID0gMjBcblxuICBDb21tZW50LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIvLyBcIiArIHRoaXMubGFiZWwudmFsdWVcbiAgfVxuXG4gIENvbW1lbnQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxhYmVsLm1lYXN1cmUoKVxuICB9XG5cbiAgQ29tbWVudC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYWJlbEVsID0gdGhpcy5sYWJlbC5kcmF3KClcblxuICAgIHRoaXMud2lkdGggPSB0aGlzLmxhYmVsLndpZHRoICsgMTZcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtcbiAgICAgIFNWRy5jb21tZW50TGluZSh0aGlzLmhhc0Jsb2NrID8gQ29tbWVudC5saW5lTGVuZ3RoIDogMCwgNiksXG4gICAgICBTVkcuY29tbWVudFJlY3QodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtcbiAgICAgICAgY2xhc3M6IFwic2ItY29tbWVudFwiLFxuICAgICAgfSksXG4gICAgICBTVkcubW92ZSg4LCA0LCBsYWJlbEVsKSxcbiAgICBdKVxuICB9XG5cbiAgLyogR2xvdyAqL1xuXG4gIHZhciBHbG93ID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBhc3NlcnQoY2hpbGQpXG4gICAgdGhpcy5jaGlsZCA9IGNoaWxkXG4gICAgaWYgKGNoaWxkLmlzQmxvY2spIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBjaGlsZC5pbmZvLnNoYXBlXG4gICAgICB0aGlzLmluZm8gPSBjaGlsZC5pbmZvXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hhcGUgPSBcInN0YWNrXCJcbiAgICB9XG5cbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMueSA9IDBcbiAgfVxuICBHbG93LnByb3RvdHlwZS5pc0dsb3cgPSB0cnVlXG5cbiAgR2xvdy5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY2hpbGQuaXNCbG9jaykge1xuICAgICAgcmV0dXJuIHRoaXMuY2hpbGQuc3RyaW5naWZ5KFwiK1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGluZXMgPSB0aGlzLmNoaWxkLnN0cmluZ2lmeSgpLnNwbGl0KFwiXFxuXCIpXG4gICAgICByZXR1cm4gbGluZXMubWFwKGxpbmUgPT4gXCIrIFwiICsgbGluZSkuam9pbihcIlxcblwiKVxuICAgIH1cbiAgfVxuXG4gIEdsb3cucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLmNoaWxkLnRyYW5zbGF0ZShsYW5nKVxuICB9XG5cbiAgR2xvdy5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hpbGQubWVhc3VyZSgpXG4gIH1cblxuICBHbG93LnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjID0gdGhpcy5jaGlsZFxuICAgIHZhciBlbFxuICAgIHZhciB3ID0gdGhpcy53aWR0aFxuICAgIHZhciBoID0gdGhpcy5oZWlnaHQgLSAxXG4gICAgaWYgKGMuaXNTY3JpcHQpIHtcbiAgICAgIGlmICghYy5pc0VtcHR5ICYmIGMuYmxvY2tzWzBdLmlzSGF0KSB7XG4gICAgICAgIGVsID0gU1ZHLmhhdFJlY3QodywgaClcbiAgICAgIH0gZWxzZSBpZiAoYy5pc0ZpbmFsKSB7XG4gICAgICAgIGVsID0gU1ZHLmNhcFJlY3QodywgaClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsID0gU1ZHLnN0YWNrUmVjdCh3LCBoKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZWwgPSBjLmRyYXdTZWxmKHcsIGgsIFtdKVxuICAgIH1cbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICBjbGFzczogXCJzYi1kaWZmIHNiLWRpZmYtaW5zXCIsXG4gICAgfSlcbiAgfVxuICAvLyBUT0RPIGhvdyBjYW4gd2UgYWx3YXlzIHJhaXNlIEdsb3dzIGFib3ZlIHRoZWlyIHBhcmVudHM/XG5cbiAgR2xvdy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjID0gdGhpcy5jaGlsZFxuICAgIHZhciBlbCA9IGMuaXNTY3JpcHQgPyBjLmRyYXcodHJ1ZSkgOiBjLmRyYXcoKVxuXG4gICAgdGhpcy53aWR0aCA9IGMud2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IChjLmlzQmxvY2sgJiYgYy5maXJzdExpbmUuaGVpZ2h0KSB8fCBjLmhlaWdodFxuXG4gICAgLy8gZW5jaXJjbGVcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtlbCwgdGhpcy5kcmF3U2VsZigpXSlcbiAgfVxuXG4gIC8qIFNjcmlwdCAqL1xuXG4gIHZhciBTY3JpcHQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgICB0aGlzLmJsb2NrcyA9IGJsb2Nrc1xuICAgIHRoaXMuaXNFbXB0eSA9ICFibG9ja3MubGVuZ3RoXG4gICAgdGhpcy5pc0ZpbmFsID0gIXRoaXMuaXNFbXB0eSAmJiBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmlzRmluYWxcbiAgICB0aGlzLnkgPSAwXG4gIH1cbiAgU2NyaXB0LnByb3RvdHlwZS5pc1NjcmlwdCA9IHRydWVcblxuICBTY3JpcHQuZnJvbUpTT04gPSBmdW5jdGlvbihsYW5nLCBibG9ja3MpIHtcbiAgICAvLyB4ID0gYXJyYXlbMF0sIHkgPSBhcnJheVsxXTtcbiAgICByZXR1cm4gbmV3IFNjcmlwdChibG9ja3MubWFwKEJsb2NrLmZyb21KU09OLmJpbmQobnVsbCwgbGFuZykpKVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5ibG9ja3NbMF0gJiYgdGhpcy5ibG9ja3NbMF0uaXNDb21tZW50KSByZXR1cm5cbiAgICByZXR1cm4gdGhpcy5ibG9ja3MubWFwKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICByZXR1cm4gYmxvY2sudG9KU09OKClcbiAgICB9KVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5ibG9ja3NcbiAgICAgIC5tYXAoZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgdmFyIGxpbmUgPSBibG9jay5zdHJpbmdpZnkoKVxuICAgICAgICBpZiAoYmxvY2suY29tbWVudCkgbGluZSArPSBcIiBcIiArIGJsb2NrLmNvbW1lbnQuc3RyaW5naWZ5KClcbiAgICAgICAgcmV0dXJuIGxpbmVcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblwiKVxuICB9XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgdGhpcy5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgYmxvY2sudHJhbnNsYXRlKGxhbmcpXG4gICAgfSlcbiAgfVxuXG4gIFNjcmlwdC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ibG9ja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYmxvY2tzW2ldLm1lYXN1cmUoKVxuICAgIH1cbiAgfVxuXG4gIFNjcmlwdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGluc2lkZSkge1xuICAgIHZhciBjaGlsZHJlbiA9IFtdXG4gICAgdmFyIHkgPSAwXG4gICAgdGhpcy53aWR0aCA9IDBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYmxvY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpXVxuICAgICAgdmFyIHggPSBpbnNpZGUgPyAwIDogMlxuICAgICAgdmFyIGNoaWxkID0gYmxvY2suZHJhdygpXG4gICAgICBjaGlsZHJlbi5wdXNoKFNWRy5tb3ZlKHgsIHksIGNoaWxkKSlcbiAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBibG9jay53aWR0aClcblxuICAgICAgdmFyIGRpZmYgPSBibG9jay5kaWZmXG4gICAgICBpZiAoZGlmZiA9PT0gXCItXCIpIHtcbiAgICAgICAgdmFyIGR3ID0gYmxvY2sud2lkdGhcbiAgICAgICAgdmFyIGRoID0gYmxvY2suZmlyc3RMaW5lLmhlaWdodCB8fCBibG9jay5oZWlnaHRcbiAgICAgICAgY2hpbGRyZW4ucHVzaChTVkcubW92ZSh4LCB5ICsgZGggLyAyICsgMSwgU1ZHLnN0cmlrZXRocm91Z2hMaW5lKGR3KSkpXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBibG9jay53aWR0aClcbiAgICAgIH1cblxuICAgICAgeSArPSBibG9jay5oZWlnaHRcblxuICAgICAgdmFyIGNvbW1lbnQgPSBibG9jay5jb21tZW50XG4gICAgICBpZiAoY29tbWVudCkge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLmZpcnN0TGluZVxuICAgICAgICB2YXIgY3ggPSBibG9jay5pbm5lcldpZHRoICsgMiArIENvbW1lbnQubGluZUxlbmd0aFxuICAgICAgICB2YXIgY3kgPSB5IC0gYmxvY2suaGVpZ2h0ICsgbGluZS5oZWlnaHQgLyAyXG4gICAgICAgIHZhciBlbCA9IGNvbW1lbnQuZHJhdygpXG4gICAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoY3gsIGN5IC0gY29tbWVudC5oZWlnaHQgLyAyLCBlbCkpXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLm1heCh0aGlzLndpZHRoLCBjeCArIGNvbW1lbnQud2lkdGgpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaGVpZ2h0ID0geVxuICAgIGlmICghaW5zaWRlICYmICF0aGlzLmlzRmluYWwpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDNcbiAgICB9XG4gICAgaWYgKCFpbnNpZGUgJiYgYmxvY2suaXNHbG93KSB7XG4gICAgICB0aGlzLmhlaWdodCArPSAyIC8vIFRPRE8gdW5icmVhayB0aGlzXG4gICAgfVxuICAgIHJldHVybiBTVkcuZ3JvdXAoY2hpbGRyZW4pXG4gIH1cblxuICAvKiBEb2N1bWVudCAqL1xuXG4gIHZhciBEb2N1bWVudCA9IGZ1bmN0aW9uKHNjcmlwdHMpIHtcbiAgICB0aGlzLnNjcmlwdHMgPSBzY3JpcHRzXG5cbiAgICB0aGlzLndpZHRoID0gbnVsbFxuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbFxuICAgIHRoaXMuZWwgPSBudWxsXG4gICAgdGhpcy5kZWZzID0gbnVsbFxuICB9XG5cbiAgRG9jdW1lbnQuZnJvbUpTT04gPSBmdW5jdGlvbihzY3JpcHRhYmxlLCBsYW5nKSB7XG4gICAgdmFyIGxhbmcgPSBsYW5nIHx8IGVuZ2xpc2hcbiAgICB2YXIgc2NyaXB0cyA9IHNjcmlwdGFibGUuc2NyaXB0cy5tYXAoZnVuY3Rpb24oYXJyYXkpIHtcbiAgICAgIHZhciBzY3JpcHQgPSBTY3JpcHQuZnJvbUpTT04obGFuZywgYXJyYXlbMl0pXG4gICAgICBzY3JpcHQueCA9IGFycmF5WzBdXG4gICAgICBzY3JpcHQueSA9IGFycmF5WzFdXG4gICAgICByZXR1cm4gc2NyaXB0XG4gICAgfSlcbiAgICAvLyBUT0RPIHNjcmlwdGFibGUuc2NyaXB0Q29tbWVudHNcbiAgICByZXR1cm4gbmV3IERvY3VtZW50KHNjcmlwdHMpXG4gIH1cblxuICBEb2N1bWVudC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGpzb25TY3JpcHRzID0gdGhpcy5zY3JpcHRzXG4gICAgICAubWFwKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgICB2YXIganNvbkJsb2NrcyA9IHNjcmlwdC50b0pTT04oKVxuICAgICAgICBpZiAoIWpzb25CbG9ja3MpIHJldHVyblxuICAgICAgICByZXR1cm4gWzEwLCBzY3JpcHQueSArIDEwLCBqc29uQmxvY2tzXVxuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgcmV0dXJuIHtcbiAgICAgIHNjcmlwdHM6IGpzb25TY3JpcHRzLFxuICAgICAgLy8gc2NyaXB0Q29tbWVudHM6IFtdLCAvLyBUT0RPXG4gICAgfVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNjcmlwdHNcbiAgICAgIC5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBzY3JpcHQuc3RyaW5naWZ5KClcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblxcblwiKVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGxhbmcpIHtcbiAgICB0aGlzLnNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHNjcmlwdC50cmFuc2xhdGUobGFuZylcbiAgICB9KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcmlwdHMuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHNjcmlwdC5tZWFzdXJlKClcbiAgICB9KVxuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgLy8gbWVhc3VyZSBzdHJpbmdzXG4gICAgdGhpcy5tZWFzdXJlKClcblxuICAgIC8vIFRPRE86IHNlcGFyYXRlIGxheW91dCArIHJlbmRlciBzdGVwcy5cbiAgICAvLyByZW5kZXIgZWFjaCBzY3JpcHRcbiAgICB2YXIgd2lkdGggPSAwXG4gICAgdmFyIGhlaWdodCA9IDBcbiAgICB2YXIgZWxlbWVudHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc2NyaXB0ID0gdGhpcy5zY3JpcHRzW2ldXG4gICAgICBpZiAoaGVpZ2h0KSBoZWlnaHQgKz0gMTBcbiAgICAgIHNjcmlwdC55ID0gaGVpZ2h0XG4gICAgICBlbGVtZW50cy5wdXNoKFNWRy5tb3ZlKDAsIGhlaWdodCwgc2NyaXB0LmRyYXcoKSkpXG4gICAgICBoZWlnaHQgKz0gc2NyaXB0LmhlaWdodFxuICAgICAgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgc2NyaXB0LndpZHRoICsgNClcbiAgICB9XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcblxuICAgIC8vIHJldHVybiBTVkdcbiAgICB2YXIgc3ZnID0gU1ZHLm5ld1NWRyh3aWR0aCwgaGVpZ2h0KVxuICAgIHN2Zy5hcHBlbmRDaGlsZChcbiAgICAgICh0aGlzLmRlZnMgPSBTVkcud2l0aENoaWxkcmVuKFxuICAgICAgICBTVkcuZWwoXCJkZWZzXCIpLFxuICAgICAgICBbXG4gICAgICAgICAgYmV2ZWxGaWx0ZXIoXCJiZXZlbEZpbHRlclwiLCBmYWxzZSksXG4gICAgICAgICAgYmV2ZWxGaWx0ZXIoXCJpbnB1dEJldmVsRmlsdGVyXCIsIHRydWUpLFxuICAgICAgICAgIGRhcmtGaWx0ZXIoXCJpbnB1dERhcmtGaWx0ZXJcIiksXG4gICAgICAgICAgZGVzYXR1cmF0ZUZpbHRlcihcImRlc2F0dXJhdGVGaWx0ZXJcIiksXG4gICAgICAgIF0uY29uY2F0KG1ha2VJY29ucygpKVxuICAgICAgKSlcbiAgICApXG5cbiAgICBzdmcuYXBwZW5kQ2hpbGQoU1ZHLmdyb3VwKGVsZW1lbnRzKSlcbiAgICB0aGlzLmVsID0gc3ZnXG5cbiAgICAvLyBuYjogYXN5bmMgQVBJIG9ubHkgZm9yIGJhY2t3YXJkcy9mb3J3YXJkcyBjb21wYXRpYmlsaXR5IHJlYXNvbnMuXG4gICAgLy8gZGVzcGl0ZSBhcHBlYXJhbmNlcywgaXQgcnVucyBzeW5jaHJvbm91c2x5XG4gICAgY2Ioc3ZnKVxuICB9XG5cbiAgLyogRXhwb3J0IFNWRyBpbWFnZSBhcyBYTUwgc3RyaW5nICovXG4gIERvY3VtZW50LnByb3RvdHlwZS5leHBvcnRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBhc3NlcnQodGhpcy5lbCwgXCJjYWxsIGRyYXcoKSBmaXJzdFwiKVxuXG4gICAgdmFyIHN0eWxlID0gbWFrZVN0eWxlKClcbiAgICB0aGlzLmRlZnMuYXBwZW5kQ2hpbGQoc3R5bGUpXG4gICAgdmFyIHhtbCA9IG5ldyBTVkcuWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMuZWwpXG4gICAgdGhpcy5kZWZzLnJlbW92ZUNoaWxkKHN0eWxlKVxuICAgIHJldHVybiB4bWxcbiAgfVxuXG4gIC8qIEV4cG9ydCBTVkcgaW1hZ2UgYXMgZGF0YSBVUkkgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWRyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB4bWwgPSB0aGlzLmV4cG9ydFNWR1N0cmluZygpXG4gICAgcmV0dXJuIFwiZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIgKyB4bWwucmVwbGFjZSgvWyNdL2csIGVuY29kZVVSSUNvbXBvbmVudClcbiAgfVxuXG4gIERvY3VtZW50LnByb3RvdHlwZS5leHBvcnRQTkcgPSBmdW5jdGlvbihjYikge1xuICAgIHZhciBjYW52YXMgPSBTVkcubWFrZUNhbnZhcygpXG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53aWR0aFxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodFxuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKClcbiAgICBpbWFnZS5zcmMgPSB0aGlzLmV4cG9ydFNWRygpXG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMClcblxuICAgICAgaWYgKFVSTCAmJiBVUkwuY3JlYXRlT2JqZWN0VVJMICYmIEJsb2IgJiYgY2FudmFzLnRvQmxvYikge1xuICAgICAgICB2YXIgYmxvYiA9IGNhbnZhcy50b0Jsb2IoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICAgIGNiKFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpXG4gICAgICAgIH0sIFwiaW1hZ2UvcG5nXCIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYihjYW52YXMudG9EYXRhVVJMKFwiaW1hZ2UvcG5nXCIpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIEdsb3csXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9XG59KSgpXG4iLCJ2YXIgU1ZHID0gcmVxdWlyZShcIi4vZHJhdy5qc1wiKVxudmFyIEZpbHRlciA9IHJlcXVpcmUoXCIuL2ZpbHRlci5qc1wiKVxuXG52YXIgU3R5bGUgPSAobW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNzc0NvbnRlbnQ6IGBcbiAgICAuc2ItbGFiZWwge1xuICAgICAgZm9udC1mYW1pbHk6IFwiSGVsdmV0aWNhIE5ldWVcIiwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmO1xuICAgICAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICB3b3JkLXNwYWNpbmc6ICsxcHg7XG4gICAgICBvcGFjaXR5OiAwLjk7XG4gICAgfVxuXG4gICAgLnNiLW9ic29sZXRlIHsgZmlsbDogI2Q0MjgyODsgfVxuICAgIC5zYi1tb3Rpb24geyBmaWxsOiAjNEM5N0ZGOyB9XG4gICAgLnNiLWxvb2tzIHsgZmlsbDogIzk5NjZGRjsgfVxuICAgIC5zYi1zb3VuZCB7IGZpbGw6ICNDRjYzQ0Y7IH1cbiAgICAuc2ItcGVuIHsgZmlsbDogIzBmQkQ4QzsgIH1cbiAgICAuc2ItZXZlbnRzIHsgZmlsbDogI0ZGQkYwMDsgfVxuICAgIC5zYi1jb250cm9sIHsgZmlsbDogI0ZGQUIxOTsgfVxuICAgIC5zYi1zZW5zaW5nIHsgZmlsbDogIzVDQjFENjsgfVxuICAgIC5zYi1vcGVyYXRvcnMgeyBmaWxsOiAjNTlDMDU5OyB9XG4gICAgLnNiLXZhcmlhYmxlcyB7IGZpbGw6ICNGRjhDMUE7IH1cbiAgICAuc2ItbGlzdCB7IGZpbGw6ICNGRjY2MUEgfVxuICAgIC5zYi1jdXN0b20geyBmaWxsOiAjRkY2NjgwOyB9XG4gICAgLnNiLWN1c3RvbS1hcmcgeyBmaWxsOiAjRkY2NjgwOyB9XG4gICAgLnNiLWV4dGVuc2lvbiB7IGZpbGw6ICM0YjRhNjA7IH1cbiAgICAuc2ItZ3JleSB7IGZpbGw6ICM5Njk2OTY7IH1cblxuICAgIC5zYi1iZXZlbCB7XG4gICAgICBmaWx0ZXIyOiB1cmwoI2JldmVsRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE1O1xuICAgICAgc3Ryb2tlLWFsaWdubWVudDogaW5uZXI7XG4gICAgfVxuXG4gICAgLnNiLWlucHV0IHtcbiAgICAgIGZpbHRlcjI6IHVybCgjaW5wdXRCZXZlbEZpbHRlcik7XG4gICAgfVxuICAgIC5zYi1pbnB1dC1udW1iZXIsXG4gICAgLnNiLWlucHV0LXN0cmluZyxcbiAgICAuc2ItaW5wdXQtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duLFxuICAgIC5zYi1saXRlcmFsLWRyb3Bkb3duIHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICBmb250LXNpemU6IDlweDtcbiAgICAgIHdvcmQtc3BhY2luZzogMDtcbiAgICB9XG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLFxuICAgIC5zYi1saXRlcmFsLXN0cmluZyxcbiAgICAuc2ItbGl0ZXJhbC1udW1iZXItZHJvcGRvd24ge1xuICAgICAgZmlsbDogIzAwMDtcbiAgICB9XG5cbiAgICAuc2ItZGFya2VyIHtcbiAgICAgIGZpbHRlcjI6IHVybCgjaW5wdXREYXJrRmlsdGVyKTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgICBzdHJva2UtYWxpZ25tZW50OiBpbm5lcjtcbiAgICB9XG4gICAgLnNiLWRlc2F0dXJhdGUge1xuICAgICAgZmlsdGVyOiB1cmwoI2Rlc2F0dXJhdGVGaWx0ZXIpO1xuICAgIH1cblxuICAgIC5zYi1vdXRsaW5lIHtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgICBmaWxsOiAjRkY0RDZBO1xuICAgIH1cblxuICAgIC5zYi1kZWZpbmUtaGF0LWNhcCB7XG4gICAgICBzdHJva2U6ICM2MzJkOTk7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgICBmaWxsOiAjOGUyZWMyO1xuICAgIH1cblxuICAgIC5zYi1jb21tZW50IHtcbiAgICAgIGZpbGw6ICNmZmZmYTU7XG4gICAgICBzdHJva2U6ICNkMGQxZDI7XG4gICAgICBzdHJva2Utd2lkdGg6IDE7XG4gICAgfVxuICAgIC5zYi1jb21tZW50LWxpbmUge1xuICAgICAgZmlsbDogI2ZmZmY4MDtcbiAgICB9XG4gICAgLnNiLWNvbW1lbnQtbGFiZWwge1xuICAgICAgZm9udC1mYW1pbHk6IEhlbGV2ZXRpY2EsIEFyaWFsLCBEZWphVnUgU2Fucywgc2Fucy1zZXJpZjtcbiAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgZmlsbDogIzVjNWQ1ZjtcbiAgICAgIHdvcmQtc3BhY2luZzogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICB9XG5cbiAgICAuc2ItZGlmZiB7XG4gICAgICBmaWxsOiBub25lO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgIH1cbiAgICAuc2ItZGlmZi1pbnMge1xuICAgICAgc3Ryb2tlLXdpZHRoOiAycHg7XG4gICAgfVxuICAgIC5zYi1kaWZmLWRlbCB7XG4gICAgICBzdHJva2Utd2lkdGg6IDNweDtcbiAgICB9XG4gIGAucmVwbGFjZSgvWyBcXG5dKy8sIFwiIFwiKSxcblxuICBtYWtlSWNvbnMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICBkOlxuICAgICAgICAgIFwiTTEuNTA0IDIxTDAgMTkuNDkzIDQuNTY3IDBoMS45NDhsLS41IDIuNDE4czEuMDAyLS41MDIgMy4wMDYgMGMyLjAwNi41MDMgMy4wMDggMi4wMSA2LjUxNyAyLjAxIDMuNTA4IDAgNC40NjMtLjU0NSA0LjQ2My0uNTQ1bC0uODIzIDkuODkycy0yLjEzNyAxLjAwNS01LjE0NC42OTZjLTMuMDA3LS4zMDctMy4wMDctMi4wMDctNi4wMTQtMi41MS0zLjAwOC0uNTAyLTQuNTEyLjUwMy00LjUxMi41MDNMMS41MDQgMjF6XCIsXG4gICAgICAgIGZpbGw6IFwiIzNmOGQxNVwiLFxuICAgICAgICBpZDogXCJncmVlbkZsYWdcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6XG4gICAgICAgICAgXCJNNi43MjQgMEMzLjAxIDAgMCAyLjkxIDAgNi41YzAgMi4zMTYgMS4yNTMgNC4zNSAzLjE0IDUuNUg1LjE3di0xLjI1NkMzLjM2NCAxMC4xMjYgMi4wNyA4LjQ2IDIuMDcgNi41IDIuMDcgNC4wMTUgNC4xNTIgMiA2LjcyMyAyYzEuMTQgMCAyLjE4NC4zOTYgMi45OTMgMS4wNTNMOC4zMSA0LjEzYy0uNDUuMzQ0LS4zOTguODI2LjExIDEuMDhMMTUgOC41IDEzLjg1OC45OTJjLS4wODMtLjU0Ny0uNTE0LS43MTQtLjk2My0uMzdsLTEuNTMyIDEuMTcyQTYuODI1IDYuODI1IDAgMCAwIDYuNzIzIDB6XCIsXG4gICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICBpZDogXCJ0dXJuUmlnaHRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6XG4gICAgICAgICAgXCJNMy42MzcgMS43OTRBNi44MjUgNi44MjUgMCAwIDEgOC4yNzcgMEMxMS45OSAwIDE1IDIuOTEgMTUgNi41YzAgMi4zMTYtMS4yNTMgNC4zNS0zLjE0IDUuNUg5Ljgzdi0xLjI1NmMxLjgwOC0uNjE4IDMuMTAzLTIuMjg1IDMuMTAzLTQuMjQ0IDAtMi40ODUtMi4wODMtNC41LTQuNjU0LTQuNS0xLjE0IDAtMi4xODQuMzk2LTIuOTkzIDEuMDUzTDYuNjkgNC4xM2MuNDUuMzQ0LjM5OC44MjYtLjExIDEuMDhMMCA4LjUgMS4xNDIuOTkyYy4wODMtLjU0Ny41MTQtLjcxNC45NjMtLjM3bDEuNTMyIDEuMTcyelwiLFxuICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgaWQ6IFwidHVybkxlZnRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTAgMEw0IDRMMCA4WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiYWRkSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgIGQ6IFwiTTQgMEw0IDhMMCA0WlwiLFxuICAgICAgICBmaWxsOiBcIiMxMTFcIixcbiAgICAgICAgaWQ6IFwiZGVsSW5wdXRcIixcbiAgICAgIH0pLFxuICAgICAgU1ZHLnNldFByb3BzKFxuICAgICAgICBTVkcuZ3JvdXAoW1xuICAgICAgICAgIFNWRy5lbChcInBhdGhcIiwge1xuICAgICAgICAgICAgZDogXCJNOCAwbDIgLTJsMCAtM2wzIDBsLTQgLTVsLTQgNWwzIDBsMCAzbC04IDBsMCAyXCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMwMDBcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiMC4zXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgU1ZHLm1vdmUoXG4gICAgICAgICAgICAtMSxcbiAgICAgICAgICAgIC0xLFxuICAgICAgICAgICAgU1ZHLmVsKFwicGF0aFwiLCB7XG4gICAgICAgICAgICAgIGQ6IFwiTTggMGwyIC0ybDAgLTNsMyAwbC00IC01bC00IDVsMyAwbDAgM2wtOCAwbDAgMlwiLFxuICAgICAgICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICAgICAgb3BhY2l0eTogXCIwLjlcIixcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKSxcbiAgICAgICAgXSksXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJsb29wQXJyb3dcIixcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICBdXG4gIH0sXG5cbiAgbWFrZVN0eWxlKCkge1xuICAgIHZhciBzdHlsZSA9IFNWRy5lbChcInN0eWxlXCIpXG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoU1ZHLmNkYXRhKFN0eWxlLmNzc0NvbnRlbnQpKVxuICAgIHJldHVybiBzdHlsZVxuICB9LFxuXG4gIGJldmVsRmlsdGVyKGlkLCBpbnNldCkge1xuICAgIHZhciBmID0gbmV3IEZpbHRlcihpZClcblxuICAgIHZhciBhbHBoYSA9IFwiU291cmNlQWxwaGFcIlxuICAgIHZhciBzID0gaW5zZXQgPyAtMSA6IDFcbiAgICB2YXIgYmx1ciA9IGYuYmx1cigxLCBhbHBoYSlcblxuICAgIGYubWVyZ2UoW1xuICAgICAgXCJTb3VyY2VHcmFwaGljXCIsXG4gICAgICBmLmNvbXAoXG4gICAgICAgIFwiaW5cIixcbiAgICAgICAgZi5mbG9vZChcIiNmZmZcIiwgMC4xNSksXG4gICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KCtzLCArcywgYmx1cikpXG4gICAgICApLFxuICAgICAgZi5jb21wKFxuICAgICAgICBcImluXCIsXG4gICAgICAgIGYuZmxvb2QoXCIjMDAwXCIsIDAuNyksXG4gICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KC1zLCAtcywgYmx1cikpXG4gICAgICApLFxuICAgIF0pXG5cbiAgICByZXR1cm4gZi5lbFxuICB9LFxuXG4gIGRhcmtGaWx0ZXIoaWQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpXG5cbiAgICBmLm1lcmdlKFtcbiAgICAgIFwiU291cmNlR3JhcGhpY1wiLFxuICAgICAgZi5jb21wKFwiaW5cIiwgZi5mbG9vZChcIiMwMDBcIiwgMC4yKSwgXCJTb3VyY2VBbHBoYVwiKSxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkZXNhdHVyYXRlRmlsdGVyKGlkKSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKVxuXG4gICAgdmFyIHEgPSAwLjMzM1xuICAgIHZhciBzID0gMC4zMzNcbiAgICBmLmNvbG9yTWF0cml4KFwiU291cmNlR3JhcGhpY1wiLCBbXG4gICAgICBxLFxuICAgICAgcyxcbiAgICAgIHMsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHMsXG4gICAgICBxLFxuICAgICAgcyxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgcyxcbiAgICAgIHMsXG4gICAgICBxLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAxLFxuICAgICAgMCxcbiAgICBdKVxuXG4gICAgcmV0dXJuIGYuZWxcbiAgfSxcblxuICBkYXJrUmVjdCh3LCBoLCBjYXRlZ29yeSwgZWwpIHtcbiAgICByZXR1cm4gU1ZHLnNldFByb3BzKFxuICAgICAgU1ZHLmdyb3VwKFtcbiAgICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgICAgY2xhc3M6IFtcInNiLVwiICsgY2F0ZWdvcnksIFwic2ItZGFya2VyXCJdLmpvaW4oXCIgXCIpLFxuICAgICAgICB9KSxcbiAgICAgIF0pLFxuICAgICAgeyB3aWR0aDogdywgaGVpZ2h0OiBoIH1cbiAgICApXG4gIH0sXG5cbiAgZGVmYXVsdEZvbnRGYW1pbHk6IFwiTHVjaWRhIEdyYW5kZSwgVmVyZGFuYSwgQXJpYWwsIERlamFWdSBTYW5zLCBzYW5zLXNlcmlmXCIsXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGV4dGVuZChzcmMsIGRlc3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKVxuICB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykge1xuICAgIHJldHVybiBvICYmIG8uY29uc3RydWN0b3IgPT09IEFycmF5XG4gIH1cbiAgZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKVxuICB9XG5cbiAgdmFyIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgR2xvdyxcbiAgICBTY3JpcHQsXG4gICAgRG9jdW1lbnQsXG4gIH0gPSByZXF1aXJlKFwiLi9tb2RlbC5qc1wiKVxuXG4gIHZhciB7XG4gICAgYWxsTGFuZ3VhZ2VzLFxuICAgIGxvb2t1cERyb3Bkb3duLFxuICAgIGhleENvbG9yUGF0LFxuICAgIG1pbmlmeUhhc2gsXG4gICAgbG9va3VwSGFzaCxcbiAgICBoYXNoU3BlYyxcbiAgICBhcHBseU92ZXJyaWRlcyxcbiAgICBydGxMYW5ndWFnZXMsXG4gICAgaWNvblBhdCxcbiAgICBibG9ja05hbWUsXG4gIH0gPSByZXF1aXJlKFwiLi9ibG9ja3MuanNcIilcblxuICBmdW5jdGlvbiBwYWludEJsb2NrKGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpIHtcbiAgICB2YXIgb3ZlcnJpZGVzID0gW11cbiAgICBpZiAoaXNBcnJheShjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSkpIHtcbiAgICAgIG92ZXJyaWRlcyA9IGNoaWxkcmVuLnBvcCgpXG4gICAgfVxuXG4gICAgLy8gYnVpbGQgaGFzaFxuICAgIHZhciB3b3JkcyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgIGlmIChjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgIHdvcmRzLnB1c2goY2hpbGQudmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzSWNvbikge1xuICAgICAgICB3b3Jkcy5wdXNoKFwiQFwiICsgY2hpbGQubmFtZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmRzLnB1c2goXCJfXCIpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBoYXNoID0gKGluZm8uaGFzaCA9IG1pbmlmeUhhc2god29yZHMuam9pbihcIiBcIikpKVxuXG4gICAgLy8gcGFpbnRcbiAgICB2YXIgbyA9IGxvb2t1cEhhc2goaGFzaCwgaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcylcbiAgICBpZiAobykge1xuICAgICAgdmFyIGxhbmcgPSBvLmxhbmdcbiAgICAgIHZhciB0eXBlID0gby50eXBlXG4gICAgICBpbmZvLmxhbmd1YWdlID0gbGFuZ1xuICAgICAgaW5mby5pc1JUTCA9IHJ0bExhbmd1YWdlcy5pbmRleE9mKGxhbmcuY29kZSkgPiAtMVxuXG4gICAgICBpZiAoXG4gICAgICAgIHR5cGUuc2hhcGUgPT09IFwicmluZ1wiXG4gICAgICAgICAgPyBpbmZvLnNoYXBlID09PSBcInJlcG9ydGVyXCJcbiAgICAgICAgICA6IGluZm8uc2hhcGUgPT09IFwic3RhY2tcIlxuICAgICAgKSB7XG4gICAgICAgIGluZm8uc2hhcGUgPSB0eXBlLnNoYXBlXG4gICAgICB9XG4gICAgICBpbmZvLmNhdGVnb3J5ID0gdHlwZS5jYXRlZ29yeVxuICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlXG4gICAgICBpZiAodHlwZS5zZWxlY3RvcikgaW5mby5zZWxlY3RvciA9IHR5cGUuc2VsZWN0b3IgLy8gZm9yIHRvSlNPTlxuICAgICAgaW5mby5oYXNMb29wQXJyb3cgPSB0eXBlLmhhc0xvb3BBcnJvd1xuXG4gICAgICAvLyBlbGxpcHNpcyBibG9ja1xuICAgICAgaWYgKHR5cGUuc3BlYyA9PT0gXCIuIC4gLlwiKSB7XG4gICAgICAgIGNoaWxkcmVuID0gW25ldyBMYWJlbChcIi4gLiAuXCIpXVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG92ZXJyaWRlc1xuICAgIGFwcGx5T3ZlcnJpZGVzKGluZm8sIG92ZXJyaWRlcylcblxuICAgIC8vIGxvb3AgYXJyb3dzXG4gICAgaWYgKGluZm8uaGFzTG9vcEFycm93KSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBJY29uKFwibG9vcEFycm93XCIpKVxuICAgIH1cblxuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayhpbmZvLCBjaGlsZHJlbilcblxuICAgIC8vIGltYWdlIHJlcGxhY2VtZW50XG4gICAgaWYgKHR5cGUgJiYgaWNvblBhdC50ZXN0KHR5cGUuc3BlYykpIHtcbiAgICAgIGJsb2NrLnRyYW5zbGF0ZShsYW5nLCB0cnVlKVxuICAgIH1cblxuICAgIC8vIGRpZmZzXG4gICAgaWYgKGluZm8uZGlmZiA9PT0gXCIrXCIpIHtcbiAgICAgIHJldHVybiBuZXcgR2xvdyhibG9jaylcbiAgICB9IGVsc2Uge1xuICAgICAgYmxvY2suZGlmZiA9IGluZm8uZGlmZlxuICAgIH1cbiAgICByZXR1cm4gYmxvY2tcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlTGluZXMoY29kZSwgbGFuZ3VhZ2VzKSB7XG4gICAgdmFyIHRvayA9IGNvZGVbMF1cbiAgICB2YXIgaW5kZXggPSAwXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIHRvayA9IGNvZGVbKytpbmRleF1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgIHJldHVybiBjb2RlW2luZGV4ICsgMV1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGVla05vbldzKCkge1xuICAgICAgZm9yICh2YXIgaSA9IGluZGV4ICsgMTsgaSA8IGNvZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNvZGVbaV0gIT09IFwiIFwiKSByZXR1cm4gY29kZVtpXVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2F3TkxcblxuICAgIHZhciBkZWZpbmUgPSBbXVxuICAgIGxhbmd1YWdlcy5tYXAoZnVuY3Rpb24obGFuZykge1xuICAgICAgZGVmaW5lID0gZGVmaW5lLmNvbmNhdChsYW5nLmRlZmluZSlcbiAgICB9KVxuICAgIC8vIE5CLiB3ZSBhc3N1bWUgJ2RlZmluZScgaXMgYSBzaW5nbGUgd29yZCBpbiBldmVyeSBsYW5ndWFnZVxuICAgIGZ1bmN0aW9uIGlzRGVmaW5lKHdvcmQpIHtcbiAgICAgIHJldHVybiBkZWZpbmUuaW5kZXhPZih3b3JkKSA+IC0xXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUJsb2NrKHNoYXBlLCBjaGlsZHJlbikge1xuICAgICAgdmFyIGhhc0lucHV0cyA9ICEhY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4LmlzTGFiZWxcbiAgICAgIH0pLmxlbmd0aFxuICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgIHNoYXBlOiBzaGFwZSxcbiAgICAgICAgY2F0ZWdvcnk6XG4gICAgICAgICAgc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiXG4gICAgICAgICAgICA/IFwiY3VzdG9tXCJcbiAgICAgICAgICAgIDogc2hhcGUgPT09IFwicmVwb3J0ZXJcIiAmJiAhaGFzSW5wdXRzID8gXCJ2YXJpYWJsZXNcIiA6IFwib2Jzb2xldGVcIixcbiAgICAgICAgY2F0ZWdvcnlJc0RlZmF1bHQ6IHRydWUsXG4gICAgICAgIGhhc0xvb3BBcnJvdzogZmFsc2UsXG4gICAgICB9XG4gICAgICByZXR1cm4gcGFpbnRCbG9jayhpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VNZW51KHNoYXBlLCB2YWx1ZSkge1xuICAgICAgdmFyIG1lbnUgPSBsb29rdXBEcm9wZG93bih2YWx1ZSwgbGFuZ3VhZ2VzKSB8fCB2YWx1ZVxuICAgICAgcmV0dXJuIG5ldyBJbnB1dChzaGFwZSwgdmFsdWUsIG1lbnUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFBhcnRzKGVuZCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgIHZhciBsYWJlbFxuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCI8XCIgfHwgKHRvayA9PT0gXCI+XCIgJiYgZW5kID09PSBcIj5cIikpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgICAgICAgdmFyIGMgPSBwZWVrTm9uV3MoKVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGxhc3QgJiZcbiAgICAgICAgICAgICFsYXN0LmlzTGFiZWwgJiZcbiAgICAgICAgICAgIChjID09PSBcIltcIiB8fCBjID09PSBcIihcIiB8fCBjID09PSBcIjxcIiB8fCBjID09PSBcIntcIilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwodG9rKSlcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBicmVha1xuICAgICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiICYmICFlbmQpIGJyZWFrXG5cbiAgICAgICAgc3dpdGNoICh0b2spIHtcbiAgICAgICAgICBjYXNlIFwiW1wiOlxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBTdHJpbmcoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwUmVwb3J0ZXIoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwUHJlZGljYXRlKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocEVtYmVkZGVkKCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCIgXCI6XG4gICAgICAgICAgY2FzZSBcIlxcdFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBpZiAobGFiZWwgJiYgaXNEZWZpbmUobGFiZWwudmFsdWUpKSB7XG4gICAgICAgICAgICAgIC8vIGRlZmluZSBoYXRcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwT3V0bGluZSgpKVxuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwi4peCXCI6XG4gICAgICAgICAgY2FzZSBcIuKWuFwiOlxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChwSWNvbigpKVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJAXCI6XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIHZhciBuYW1lID0gXCJcIlxuICAgICAgICAgICAgd2hpbGUgKHRvayAmJiAvW2EtekEtWl0vLnRlc3QodG9rKSkge1xuICAgICAgICAgICAgICBuYW1lICs9IHRva1xuICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcImNsb3VkXCIpIHtcbiAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwoXCLimIFcIikpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgICAgICAgIEljb24uaWNvbnMuaGFzT3duUHJvcGVydHkobmFtZSlcbiAgICAgICAgICAgICAgICAgID8gbmV3IEljb24obmFtZSlcbiAgICAgICAgICAgICAgICAgIDogbmV3IExhYmVsKFwiQFwiICsgbmFtZSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWwgPSBudWxsXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgICAgICBuZXh0KCkgLy8gZXNjYXBlIGNoYXJhY3RlclxuICAgICAgICAgIC8vIGZhbGwtdGhydVxuICAgICAgICAgIGNhc2UgXCI6XCI6XG4gICAgICAgICAgICBpZiAodG9rID09PSBcIjpcIiAmJiBwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE92ZXJyaWRlcyhlbmQpKVxuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICAgICAgICAgIH0gLy8gZmFsbC10aHJ1XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICghbGFiZWwpIGNoaWxkcmVuLnB1c2goKGxhYmVsID0gbmV3IExhYmVsKFwiXCIpKSlcbiAgICAgICAgICAgIGxhYmVsLnZhbHVlICs9IHRva1xuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGlsZHJlblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBTdHJpbmcoKSB7XG4gICAgICBuZXh0KCkgLy8gJ1snXG4gICAgICB2YXIgcyA9IFwiXCJcbiAgICAgIHZhciBlc2NhcGVWID0gZmFsc2VcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIl1cIiAmJiB0b2sgIT09IFwiXFxuXCIpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBpZiAodG9rID09PSBcInZcIikgZXNjYXBlViA9IHRydWVcbiAgICAgICAgICBpZiAoIXRvaykgYnJlYWtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlc2NhcGVWID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBzICs9IHRva1xuICAgICAgICBuZXh0KClcbiAgICAgIH1cbiAgICAgIGlmICh0b2sgPT09IFwiXVwiKSBuZXh0KClcbiAgICAgIGlmIChoZXhDb2xvclBhdC50ZXN0KHMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJjb2xvclwiLCBzKVxuICAgICAgfVxuICAgICAgcmV0dXJuICFlc2NhcGVWICYmIC8gdiQvLnRlc3QocylcbiAgICAgICAgPyBtYWtlTWVudShcImRyb3Bkb3duXCIsIHMuc2xpY2UoMCwgcy5sZW5ndGggLSAyKSlcbiAgICAgICAgOiBuZXcgSW5wdXQoXCJzdHJpbmdcIiwgcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwQmxvY2soZW5kKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoZW5kKVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgc2F3TkwgPSB0cnVlXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgICAgIC8vIGRlZmluZSBoYXRzXG4gICAgICB2YXIgZmlyc3QgPSBjaGlsZHJlblswXVxuICAgICAgaWYgKGZpcnN0ICYmIGZpcnN0LmlzTGFiZWwgJiYgaXNEZWZpbmUoZmlyc3QudmFsdWUpKSB7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaChtYWtlQmxvY2soXCJvdXRsaW5lXCIsIFtdKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUJsb2NrKFwiZGVmaW5lLWhhdFwiLCBjaGlsZHJlbilcbiAgICAgIH1cblxuICAgICAgLy8gc3RhbmRhbG9uZSByZXBvcnRlcnNcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGNoaWxkLmlzQmxvY2sgJiZcbiAgICAgICAgICAoY2hpbGQuaXNSZXBvcnRlciB8fCBjaGlsZC5pc0Jvb2xlYW4gfHwgY2hpbGQuaXNSaW5nKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gY2hpbGRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwic3RhY2tcIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFJlcG9ydGVyKCkge1xuICAgICAgbmV4dCgpIC8vICcoJ1xuXG4gICAgICAvLyBlbXB0eSBudW1iZXItZHJvcGRvd25cbiAgICAgIGlmICh0b2sgPT09IFwiIFwiKSB7XG4gICAgICAgIG5leHQoKVxuICAgICAgICBpZiAodG9rID09PSBcInZcIiAmJiBwZWVrKCkgPT09IFwiKVwiKSB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcIm51bWJlci1kcm9wZG93blwiLCBcIlwiKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhcIilcIilcbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSBcIilcIikgbmV4dCgpXG5cbiAgICAgIC8vIGVtcHR5IG51bWJlcnNcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChcIm51bWJlclwiLCBcIlwiKVxuICAgICAgfVxuXG4gICAgICAvLyBudW1iZXJcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgY2hpbGRyZW5bMF0uaXNMYWJlbCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBjaGlsZHJlblswXS52YWx1ZVxuICAgICAgICBpZiAoL15bMC05ZS4tXSokLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJudW1iZXJcIiwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gbnVtYmVyLWRyb3Bkb3duXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghY2hpbGRyZW5baV0uaXNMYWJlbCkge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpID09PSBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBjaGlsZHJlbltpIC0gMV1cbiAgICAgICAgaWYgKGkgPiAxICYmIGxhc3QudmFsdWUgPT09IFwidlwiKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucG9wKClcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjaGlsZHJlblxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbihsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBsLnZhbHVlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oXCIgXCIpXG4gICAgICAgICAgcmV0dXJuIG1ha2VNZW51KFwibnVtYmVyLWRyb3Bkb3duXCIsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBibG9jayA9IG1ha2VCbG9jayhcInJlcG9ydGVyXCIsIGNoaWxkcmVuKVxuXG4gICAgICAvLyByaW5nc1xuICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09IFwicmluZ1wiKSB7XG4gICAgICAgIHZhciBmaXJzdCA9IGJsb2NrLmNoaWxkcmVuWzBdXG4gICAgICAgIGlmIChcbiAgICAgICAgICBmaXJzdCAmJlxuICAgICAgICAgIGZpcnN0LmlzSW5wdXQgJiZcbiAgICAgICAgICBmaXJzdC5zaGFwZSA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgIGZpcnN0LnZhbHVlID09PSBcIlwiXG4gICAgICAgICkge1xuICAgICAgICAgIGJsb2NrLmNoaWxkcmVuWzBdID0gbmV3IElucHV0KFwicmVwb3J0ZXJcIilcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAoZmlyc3QgJiYgZmlyc3QuaXNTY3JpcHQgJiYgZmlyc3QuaXNFbXB0eSkgfHxcbiAgICAgICAgICAoZmlyc3QgJiYgZmlyc3QuaXNCbG9jayAmJiAhZmlyc3QuY2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICApIHtcbiAgICAgICAgICBibG9jay5jaGlsZHJlblswXSA9IG5ldyBJbnB1dChcInN0YWNrXCIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJsb2NrXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFByZWRpY2F0ZSgpIHtcbiAgICAgIG5leHQoKSAvLyAnPCdcbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhcIj5cIilcbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSBcIj5cIikgbmV4dCgpXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoXCJib29sZWFuXCIpXG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZUJsb2NrKFwiYm9vbGVhblwiLCBjaGlsZHJlbilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwRW1iZWRkZWQoKSB7XG4gICAgICBuZXh0KCkgLy8gJ3snXG5cbiAgICAgIHNhd05MID0gZmFsc2VcbiAgICAgIHZhciBmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIn1cIikge1xuICAgICAgICAgIHZhciBibG9jayA9IHBCbG9jayhcIn1cIilcbiAgICAgICAgICBpZiAoYmxvY2spIHJldHVybiBibG9ja1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgc2NyaXB0cyA9IHBhcnNlU2NyaXB0cyhmKVxuICAgICAgdmFyIGJsb2NrcyA9IFtdXG4gICAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgIGJsb2NrcyA9IGJsb2Nrcy5jb25jYXQoc2NyaXB0LmJsb2NrcylcbiAgICAgIH0pXG5cbiAgICAgIGlmICh0b2sgPT09IFwifVwiKSBuZXh0KClcbiAgICAgIGlmICghc2F3TkwpIHtcbiAgICAgICAgYXNzZXJ0KGJsb2Nrcy5sZW5ndGggPD0gMSlcbiAgICAgICAgcmV0dXJuIGJsb2Nrcy5sZW5ndGggPyBibG9ja3NbMF0gOiBtYWtlQmxvY2soXCJzdGFja1wiLCBbXSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2NyaXB0KGJsb2NrcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwSWNvbigpIHtcbiAgICAgIHZhciBjID0gdG9rXG4gICAgICBuZXh0KClcbiAgICAgIHN3aXRjaCAoYykge1xuICAgICAgICBjYXNlIFwi4pa4XCI6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJY29uKFwiYWRkSW5wdXRcIilcbiAgICAgICAgY2FzZSBcIuKXglwiOlxuICAgICAgICAgIHJldHVybiBuZXcgSWNvbihcImRlbElucHV0XCIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE92ZXJyaWRlcyhlbmQpIHtcbiAgICAgIG5leHQoKVxuICAgICAgbmV4dCgpXG4gICAgICB2YXIgb3ZlcnJpZGVzID0gW11cbiAgICAgIHZhciBvdmVycmlkZSA9IFwiXCJcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGlmICh0b2sgPT09IFwiIFwiKSB7XG4gICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgICBvdmVycmlkZXMucHVzaChvdmVycmlkZSlcbiAgICAgICAgICAgIG92ZXJyaWRlID0gXCJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG92ZXJyaWRlICs9IHRva1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKG92ZXJyaWRlKSBvdmVycmlkZXMucHVzaChvdmVycmlkZSlcbiAgICAgIHJldHVybiBvdmVycmlkZXNcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwQ29tbWVudChlbmQpIHtcbiAgICAgIG5leHQoKVxuICAgICAgbmV4dCgpXG4gICAgICB2YXIgY29tbWVudCA9IFwiXCJcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSBcIlxcblwiICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGNvbW1lbnQgKz0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgaWYgKHRvayAmJiB0b2sgPT09IFwiXFxuXCIpIG5leHQoKVxuICAgICAgcmV0dXJuIG5ldyBDb21tZW50KGNvbW1lbnQsIHRydWUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE91dGxpbmUoKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgZnVuY3Rpb24gcGFyc2VBcmcoa2luZCwgZW5kKSB7XG4gICAgICAgIGxhYmVsID0gbnVsbFxuICAgICAgICBuZXh0KClcbiAgICAgICAgdmFyIHBhcnRzID0gcFBhcnRzKGVuZClcbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBuZXh0KClcbiAgICAgICAgY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICBwYWludEJsb2NrKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzaGFwZToga2luZCA9PT0gXCJib29sZWFuXCIgPyBcImJvb2xlYW5cIiA6IFwicmVwb3J0ZXJcIixcbiAgICAgICAgICAgICAgYXJndW1lbnQ6IGtpbmQsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBcImN1c3RvbS1hcmdcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJ0cyxcbiAgICAgICAgICAgIGxhbmd1YWdlc1xuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgdmFyIGxhYmVsXG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gXCJcXG5cIikge1xuICAgICAgICBpZiAodG9rID09PSBcIi9cIiAmJiBwZWVrKCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHRvaykge1xuICAgICAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgICAgICBwYXJzZUFyZyhcIm51bWJlclwiLCBcIilcIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIltcIjpcbiAgICAgICAgICAgIHBhcnNlQXJnKFwic3RyaW5nXCIsIFwiXVwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgcGFyc2VBcmcoXCJib29sZWFuXCIsIFwiPlwiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIFwiIFwiOlxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBsYWJlbCA9IG51bGxcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgIC8vIGZhbGwtdGhydVxuICAgICAgICAgIGNhc2UgXCI6XCI6XG4gICAgICAgICAgICBpZiAodG9rID09PSBcIjpcIiAmJiBwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocE92ZXJyaWRlcygpKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSAvLyBmYWxsLXRocnVcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCFsYWJlbCkgY2hpbGRyZW4ucHVzaCgobGFiZWwgPSBuZXcgTGFiZWwoXCJcIikpKVxuICAgICAgICAgICAgbGFiZWwudmFsdWUgKz0gdG9rXG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VCbG9jayhcIm91dGxpbmVcIiwgY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcExpbmUoKSB7XG4gICAgICB2YXIgZGlmZlxuICAgICAgaWYgKHRvayA9PT0gXCIrXCIgfHwgdG9rID09PSBcIi1cIikge1xuICAgICAgICBkaWZmID0gdG9rXG4gICAgICAgIG5leHQoKVxuICAgICAgfVxuICAgICAgdmFyIGJsb2NrID0gcEJsb2NrKClcbiAgICAgIGlmICh0b2sgPT09IFwiL1wiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSBwQ29tbWVudCgpXG4gICAgICAgIGNvbW1lbnQuaGFzQmxvY2sgPSBibG9jayAmJiBibG9jay5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgaWYgKCFjb21tZW50Lmhhc0Jsb2NrKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1lbnRcbiAgICAgICAgfVxuICAgICAgICBibG9jay5jb21tZW50ID0gY29tbWVudFxuICAgICAgfVxuICAgICAgaWYgKGJsb2NrKSBibG9jay5kaWZmID0gZGlmZlxuICAgICAgcmV0dXJuIGJsb2NrXG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0b2spIHJldHVybiB1bmRlZmluZWRcbiAgICAgIHZhciBsaW5lID0gcExpbmUoKVxuICAgICAgcmV0dXJuIGxpbmUgfHwgXCJOTFwiXG4gICAgfVxuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIHBhcnNlU2NyaXB0cyhnZXRMaW5lKSB7XG4gICAgdmFyIGxpbmUgPSBnZXRMaW5lKClcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgbGluZSA9IGdldExpbmUoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBGaWxlKCkge1xuICAgICAgd2hpbGUgKGxpbmUgPT09IFwiTkxcIikgbmV4dCgpXG4gICAgICB2YXIgc2NyaXB0cyA9IFtdXG4gICAgICB3aGlsZSAobGluZSkge1xuICAgICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgICAgd2hpbGUgKGxpbmUgJiYgbGluZSAhPT0gXCJOTFwiKSB7XG4gICAgICAgICAgdmFyIGIgPSBwTGluZSgpXG4gICAgICAgICAgdmFyIGlzR2xvdyA9IGIuZGlmZiA9PT0gXCIrXCJcbiAgICAgICAgICBpZiAoaXNHbG93KSB7XG4gICAgICAgICAgICBiLmRpZmYgPSBudWxsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGIuaXNFbHNlIHx8IGIuaXNFbmQpIHtcbiAgICAgICAgICAgIGIgPSBuZXcgQmxvY2soXG4gICAgICAgICAgICAgIGV4dGVuZChiLmluZm8sIHtcbiAgICAgICAgICAgICAgICBzaGFwZTogXCJzdGFja1wiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgYi5jaGlsZHJlblxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gW11cbiAgICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNHbG93KSB7XG4gICAgICAgICAgICAgIGJsb2Nrcy5wb3AoKVxuICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBsYXN0LmNoaWxkLmlzU2NyaXB0XG4gICAgICAgICAgICAgICAgPyBsYXN0LmNoaWxkLmJsb2Nrc1xuICAgICAgICAgICAgICAgIDogW2xhc3QuY2hpbGRdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGIpXG4gICAgICAgICAgICBibG9ja3MucHVzaChuZXcgR2xvdyhuZXcgU2NyaXB0KGNoaWxkcmVuKSkpXG4gICAgICAgICAgfSBlbHNlIGlmIChiLmlzSGF0KSB7XG4gICAgICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICAgIGJsb2NrcyA9IFtiXVxuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0ZpbmFsKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNDb21tYW5kKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyByZXBvcnRlciBvciBwcmVkaWNhdGVcbiAgICAgICAgICAgIGlmIChibG9ja3MubGVuZ3RoKSBzY3JpcHRzLnB1c2gobmV3IFNjcmlwdChibG9ja3MpKVxuICAgICAgICAgICAgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoW2JdKSlcbiAgICAgICAgICAgIGJsb2NrcyA9IFtdXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgd2hpbGUgKGxpbmUgPT09IFwiTkxcIikgbmV4dCgpXG4gICAgICB9XG4gICAgICByZXR1cm4gc2NyaXB0c1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBMaW5lKCkge1xuICAgICAgdmFyIGIgPSBsaW5lXG4gICAgICBuZXh0KClcblxuICAgICAgaWYgKGIuaGFzU2NyaXB0KSB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdmFyIGJsb2NrcyA9IHBNb3V0aCgpXG4gICAgICAgICAgYi5jaGlsZHJlbi5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSlcbiAgICAgICAgICBpZiAobGluZSAmJiBsaW5lLmlzRWxzZSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGIuY2hpbGRyZW4ucHVzaChsaW5lLmNoaWxkcmVuW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobGluZSAmJiBsaW5lLmlzRW5kKSB7XG4gICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTW91dGgoKSB7XG4gICAgICB2YXIgYmxvY2tzID0gW11cbiAgICAgIHdoaWxlIChsaW5lKSB7XG4gICAgICAgIGlmIChsaW5lID09PSBcIk5MXCIpIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGlmICghbGluZS5pc0NvbW1hbmQpIHtcbiAgICAgICAgICByZXR1cm4gYmxvY2tzXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYiA9IHBMaW5lKClcbiAgICAgICAgdmFyIGlzR2xvdyA9IGIuZGlmZiA9PT0gXCIrXCJcbiAgICAgICAgaWYgKGlzR2xvdykge1xuICAgICAgICAgIGIuZGlmZiA9IG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0dsb3cpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV1cbiAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNHbG93KSB7XG4gICAgICAgICAgICBibG9ja3MucG9wKClcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGxhc3QuY2hpbGQuaXNTY3JpcHRcbiAgICAgICAgICAgICAgPyBsYXN0LmNoaWxkLmJsb2Nrc1xuICAgICAgICAgICAgICA6IFtsYXN0LmNoaWxkXVxuICAgICAgICAgIH1cbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKGIpXG4gICAgICAgICAgYmxvY2tzLnB1c2gobmV3IEdsb3cobmV3IFNjcmlwdChjaGlsZHJlbikpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBibG9ja3NcbiAgICB9XG5cbiAgICByZXR1cm4gcEZpbGUoKVxuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIGVhY2hCbG9jayh4LCBjYikge1xuICAgIGlmICh4LmlzU2NyaXB0KSB7XG4gICAgICB4LmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGVhY2hCbG9jayhibG9jaywgY2IpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoeC5pc0Jsb2NrKSB7XG4gICAgICBjYih4KVxuICAgICAgeC5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGVhY2hCbG9jayhjaGlsZCwgY2IpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoeC5pc0dsb3cpIHtcbiAgICAgIGVhY2hCbG9jayh4LmNoaWxkLCBjYilcbiAgICB9XG4gIH1cblxuICB2YXIgbGlzdEJsb2NrcyA9IHtcbiAgICBcImFwcGVuZDp0b0xpc3Q6XCI6IDEsXG4gICAgXCJkZWxldGVMaW5lOm9mTGlzdDpcIjogMSxcbiAgICBcImluc2VydDphdDpvZkxpc3Q6XCI6IDIsXG4gICAgXCJzZXRMaW5lOm9mTGlzdDp0bzpcIjogMSxcbiAgICBcInNob3dMaXN0OlwiOiAwLFxuICAgIFwiaGlkZUxpc3Q6XCI6IDAsXG4gIH1cblxuICBmdW5jdGlvbiByZWNvZ25pc2VTdHVmZihzY3JpcHRzKSB7XG4gICAgdmFyIGN1c3RvbUJsb2Nrc0J5SGFzaCA9IHt9XG4gICAgdmFyIGxpc3ROYW1lcyA9IHt9XG5cbiAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICB2YXIgY3VzdG9tQXJncyA9IHt9XG5cbiAgICAgIGVhY2hCbG9jayhzY3JpcHQsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIC8vIGN1c3RvbSBibG9ja3NcbiAgICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09IFwiZGVmaW5lLWhhdFwiKSB7XG4gICAgICAgICAgdmFyIG91dGxpbmUgPSBibG9jay5jaGlsZHJlblsxXVxuICAgICAgICAgIGlmICghb3V0bGluZSkgcmV0dXJuXG5cbiAgICAgICAgICB2YXIgbmFtZXMgPSBbXVxuICAgICAgICAgIHZhciBwYXJ0cyA9IFtdXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdXRsaW5lLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBvdXRsaW5lLmNoaWxkcmVuW2ldXG4gICAgICAgICAgICBpZiAoY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGNoaWxkLnZhbHVlKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0Jsb2NrKSB7XG4gICAgICAgICAgICAgIGlmICghY2hpbGQuaW5mby5hcmd1bWVudCkgcmV0dXJuXG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbnVtYmVyOiBcIiVuXCIsXG4gICAgICAgICAgICAgICAgICBzdHJpbmc6IFwiJXNcIixcbiAgICAgICAgICAgICAgICAgIGJvb2xlYW46IFwiJWJcIixcbiAgICAgICAgICAgICAgICB9W2NoaWxkLmluZm8uYXJndW1lbnRdXG4gICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShjaGlsZClcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChuYW1lKVxuICAgICAgICAgICAgICBjdXN0b21BcmdzW25hbWVdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc3BlYyA9IHBhcnRzLmpvaW4oXCIgXCIpXG4gICAgICAgICAgdmFyIGhhc2ggPSBoYXNoU3BlYyhzcGVjKVxuICAgICAgICAgIHZhciBpbmZvID0gKGN1c3RvbUJsb2Nrc0J5SGFzaFtoYXNoXSA9IHtcbiAgICAgICAgICAgIHNwZWM6IHNwZWMsXG4gICAgICAgICAgICBuYW1lczogbmFtZXMsXG4gICAgICAgICAgfSlcbiAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJwcm9jRGVmXCJcbiAgICAgICAgICBibG9jay5pbmZvLmNhbGwgPSBpbmZvLnNwZWNcbiAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lc1xuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSBcImN1c3RvbVwiXG5cbiAgICAgICAgICAvLyBmaXggdXAgaWYvZWxzZSBzZWxlY3RvcnNcbiAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLnNlbGVjdG9yID09PSBcImRvSWZFbHNlXCIpIHtcbiAgICAgICAgICB2YXIgbGFzdDIgPSBibG9jay5jaGlsZHJlbltibG9jay5jaGlsZHJlbi5sZW5ndGggLSAyXVxuICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPVxuICAgICAgICAgICAgbGFzdDIgJiYgbGFzdDIuaXNMYWJlbCAmJiBsYXN0Mi52YWx1ZSA9PT0gXCJlbHNlXCJcbiAgICAgICAgICAgICAgPyBcImRvSWZFbHNlXCJcbiAgICAgICAgICAgICAgOiBcImRvSWZcIlxuXG4gICAgICAgICAgLy8gY3VzdG9tIGFyZ3VtZW50c1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgJiZcbiAgICAgICAgICAoYmxvY2suaXNSZXBvcnRlciB8fCBibG9jay5pc0Jvb2xlYW4pXG4gICAgICAgICkge1xuICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGJsb2NrKVxuICAgICAgICAgIGlmIChjdXN0b21BcmdzW25hbWVdKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gXCJjdXN0b20tYXJnXCJcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZVxuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwiZ2V0UGFyYW1cIlxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGxpc3QgbmFtZXNcbiAgICAgICAgfSBlbHNlIGlmIChsaXN0QmxvY2tzLmhhc093blByb3BlcnR5KGJsb2NrLmluZm8uc2VsZWN0b3IpKSB7XG4gICAgICAgICAgdmFyIGFyZ0luZGV4ID0gbGlzdEJsb2Nrc1tibG9jay5pbmZvLnNlbGVjdG9yXVxuICAgICAgICAgIHZhciBpbnB1dHMgPSBibG9jay5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbFxuICAgICAgICAgIH0pXG4gICAgICAgICAgdmFyIGlucHV0ID0gaW5wdXRzW2FyZ0luZGV4XVxuICAgICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5pc0lucHV0KSB7XG4gICAgICAgICAgICBsaXN0TmFtZXNbaW5wdXQudmFsdWVdID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgZWFjaEJsb2NrKHNjcmlwdCwgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgLy8gY3VzdG9tIGJsb2Nrc1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCAmJlxuICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwib2Jzb2xldGVcIlxuICAgICAgICApIHtcbiAgICAgICAgICB2YXIgaW5mbyA9IGN1c3RvbUJsb2Nrc0J5SGFzaFtibG9jay5pbmZvLmhhc2hdXG4gICAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBcImNhbGxcIlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYWxsID0gaW5mby5zcGVjXG4gICAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lc1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwiY3VzdG9tXCJcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBsaXN0IHJlcG9ydGVyc1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmlzUmVwb3J0ZXIpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShibG9jaylcbiAgICAgICAgICBpZiAoIW5hbWUpIHJldHVyblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwidmFyaWFibGVzXCIgJiZcbiAgICAgICAgICAgIGxpc3ROYW1lc1tuYW1lXSAmJlxuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9IFwibGlzdFwiXG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09IFwibGlzdFwiKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gXCJjb250ZW50c09mTGlzdDpcIlxuICAgICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gXCJ2YXJpYWJsZXNcIikge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9IFwicmVhZFZhcmlhYmxlXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJlblwiXSxcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgY29kZSA9IGNvZGUucmVwbGFjZSgvJmx0Oy9nLCBcIjxcIilcbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxuL2csIFwiIFwiKVxuICAgIH1cblxuICAgIHZhciBsYW5ndWFnZXMgPSBvcHRpb25zLmxhbmd1YWdlcy5tYXAoZnVuY3Rpb24oY29kZSkge1xuICAgICAgcmV0dXJuIGFsbExhbmd1YWdlc1tjb2RlXVxuICAgIH0pXG5cbiAgICAvKiAqICovXG5cbiAgICB2YXIgZiA9IHBhcnNlTGluZXMoY29kZSwgbGFuZ3VhZ2VzKVxuICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpXG4gICAgcmVjb2duaXNlU3R1ZmYoc2NyaXB0cylcbiAgICByZXR1cm4gbmV3IERvY3VtZW50KHNjcmlwdHMpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBhcnNlOiBwYXJzZSxcbiAgfVxufSkoKVxuIl19
