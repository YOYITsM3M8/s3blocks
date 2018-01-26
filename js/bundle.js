(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

function makeCanvas() {
  return document.createElement('canvas');
}

var scratchblocks = window.scratchblocks = module.exports = require('./lib/')(window, makeCanvas);

// add our CSS to the page
var style = scratchblocks.makeStyle();
document.head.appendChild(style);


},{"./lib/":6}],2:[function(require,module,exports){
module.exports = function() {

  function assert(bool, message) { if (!bool) throw "Assertion failed! " + (message || ""); }
  function isArray(o) { return o && o.constructor === Array; }
  function extend(src, dest) { return Object.assign({}, dest, src); }


  // List of classes we're allowed to override.

  var overrideCategories = ["motion", "looks", "sound", "pen", "variables", "list", "events", "control", "sensing", "operators", "custom", "custom-arg", "extension", "grey", "obsolete"];
  var overrideShapes = ["hat", "cap", "stack", "boolean", "reporter", "ring"];

  // languages that should be displayed right to left
  var rtlLanguages = ['ar', 'fa', 'he'];

  // List of commands taken from Scratch
  var scratchCommands = require('./commands.js');

  var categoriesById = {
    0:  "obsolete",
    1:  "motion",
    2:  "looks",
    3:  "sound",
    4:  "pen",
    5:  "events",
    6:  "control",
    7:  "sensing",
    8:  "operators",
    9:  "variables",
    10: "custom",
    11: "parameter",
    12: "list",
    20: "extension",
    42: "grey",
  };

  var typeShapes = {
    ' ': 'stack',
    'b': 'boolean',
    'c': 'c-block',
    'e': 'if-block',
    'f': 'cap',
    'h': 'hat',
    'r': 'reporter',
    'cf': 'c-block cap',
    'else': 'celse',
    'end': 'cend',
    'ring': 'ring',
  };

  var inputPat = /(%[a-zA-Z](?:\.[a-zA-Z0-9]+)?)/;
  var inputPatGlobal = new RegExp(inputPat.source, 'g');
  var iconPat = /(@[a-zA-Z]+)/;
  var splitPat = new RegExp([inputPat.source, '|', iconPat.source, '| +'].join(''), 'g');

  var hexColorPat = /^#(?:[0-9a-fA-F]{3}){1,2}?$/;

  function parseSpec(spec) {
    var parts = spec.split(splitPat).filter(x => !!x);
    return {
      spec: spec,
      parts: parts,
      inputs: parts.filter(function(p) { return inputPat.test(p); }),
      hash: hashSpec(spec),
    };
  }

  function hashSpec(spec) {
    return minifyHash(spec.replace(inputPatGlobal, " _ "));
  }

  function minifyHash(hash) {
    return (hash
        .replace(/_/g, ' _ ')
        .replace(/ +/g, ' ')
        .replace(/[,%?:]/g, '')
        .replace(/ß/g, 'ss')
        .replace(/ä/g,"a")
        .replace(/ö/g,"o")
        .replace(/ü/g,"u")
        .replace('. . .', '...')
        .replace(/^…$/, '...')
    ).trim().toLowerCase();
  }

  var blocksBySelector = {};
  var blocksBySpec = {};
  var allBlocks = scratchCommands.map(function(command) {
    var info = extend(parseSpec(command[0]), {
      shape: typeShapes[command[1]], // /[ bcefhr]|cf/
      category: categoriesById[command[2] % 100],
      selector: command[3],
      hasLoopArrow: ['doRepeat', 'doUntil', 'doForever'].indexOf(command[3]) > -1,
    });
    if (info.selector) {
      // nb. command order matters!
      // Scratch 1.4 blocks are listed last
      if(!blocksBySelector[info.selector]) blocksBySelector[info.selector] = info;
    }
    return blocksBySpec[info.spec] = info;
  });

  var unicodeIcons = {
    "@greenFlag": "⚑",
    "@turnRight": "↻",
    "@turnLeft": "↺",
    "@addInput": "▸",
    "@delInput": "◂",
  };

  var allLanguages = {};
  function loadLanguage(code, language) {
    var blocksByHash = language.blocksByHash = {};

    Object.keys(language.commands).forEach(function(spec) {
      var nativeSpec = language.commands[spec];
      var block = blocksBySpec[spec];

      var nativeHash = hashSpec(nativeSpec);
      blocksByHash[nativeHash] = block;

      // fallback image replacement, for languages without aliases
      var m = iconPat.exec(spec);
      if (m) {
        var image = m[0];
        var hash = nativeHash.replace(image, unicodeIcons[image]);
        blocksByHash[hash] = block;
      }
    });

    language.nativeAliases = {};
    Object.keys(language.aliases).forEach(function(alias) {
      var spec = language.aliases[alias];
      var block = blocksBySpec[spec];

      var aliasHash = hashSpec(alias);
      blocksByHash[aliasHash] = block;

      language.nativeAliases[spec] = alias;
    });

    language.nativeDropdowns = {};
    Object.keys(language.dropdowns).forEach(function(name) {
      var nativeName = language.dropdowns[name];
      language.nativeDropdowns[nativeName] = name;
    });

    language.code = code;
    allLanguages[code] = language;
  }
  function loadLanguages(languages) {
    Object.keys(languages).forEach(function(code) {
      loadLanguage(code, languages[code]);
    });
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
    math: ["abs", "floor", "ceiling", "sqrt", "sin", "cos", "tan", "asin", "acos", "atan", "ln", "log", "e ^", "10 ^"],

    // For detecting the "stop" cap / stack block
    osis: ["other scripts in sprite", "other scripts in stage"],

    dropdowns: {},

    commands: {},
  };
  allBlocks.forEach(function(info) {
    english.commands[info.spec] = info.spec;
  }),
  loadLanguages({
    en: english,
  });

  /*****************************************************************************/

  function disambig(selector1, selector2, test) {
    var func = function(info, children, lang) {
      return blocksBySelector[test(children, lang) ? selector1 : selector2];
    };
    blocksBySelector[selector1].specialCase = blocksBySelector[selector2].specialCase = func;
  }

  disambig('computeFunction:of:', 'getAttribute:of:', function(children, lang) {
    // Operators if math function, otherwise sensing "attribute of" block
    var first = children[0];
    if (!first.isInput) return;
    var name = first.value;
    return lang.math.indexOf(name) > -1;
  });

  disambig('lineCountOfList:', 'stringLength:', function(children, lang) {
    // List block if dropdown, otherwise operators
    var last = children[children.length - 1];
    if (!last.isInput) return;
    return last.shape === 'dropdown';
  });

  disambig('penColor:', 'setPenHueTo:', function(children, lang) {
    // Color block if color input, otherwise numeric
    var last = children[children.length - 1];
    // If variable, assume color input, since the RGBA hack is common.
    // TODO fix Scratch :P
    return (last.isInput && last.isColor) || last.isBlock;
  });

  blocksBySelector['stopScripts'].specialCase = function(info, children, lang) {
    // Cap block unless argument is "other scripts in sprite"
    var last = children[children.length - 1];
    if (!last.isInput) return;
    var value = last.value;
    if (lang.osis.indexOf(value) > -1) {
      return extend(blocksBySelector['stopScripts'], {
        shape: 'stack',
      });
    }
  }


  function lookupHash(hash, info, children, languages) {
    for (var i=0; i<languages.length; i++) {
      var lang = languages[i];
      if (lang.blocksByHash.hasOwnProperty(hash)) {
        var block = lang.blocksByHash[hash];
        if (info.shape === 'reporter' && block.shape !== 'reporter') continue;
        if (info.shape === 'boolean' && block.shape !== 'boolean') continue;
        if (block.specialCase) {
          block = block.specialCase(info, children, lang) || block;
        }
        return { type: block, lang: lang };
      }
    }
  }

  function lookupDropdown(name, languages) {
    for (var i=0; i<languages.length; i++) {
      var lang = languages[i];
      if (lang.nativeDropdowns.hasOwnProperty(name)) {
        var nativeName = lang.nativeDropdowns[name];
        return nativeName;
      }
    }
  }

  function applyOverrides(info, overrides) {
    for (var i=0; i<overrides.length; i++) {
      var name = overrides[i];
      if (hexColorPat.test(name)) {
        info.color = name;
        info.category = "";
        info.categoryIsDefault = false;
      } else if (overrideCategories.indexOf(name) > -1) {
        info.category = name;
        info.categoryIsDefault = false;
      } else if (overrideShapes.indexOf(name) > -1) {
        info.shape = name;
      } else if (name === 'loop') {
        info.hasLoopArrow = true;
      }
    }
  }


  function blockName(block) {
    var words = [];
    for (var i=0; i<block.children.length; i++) {
      var child = block.children[i];
      if (!child.isLabel) return;
      words.push(child.value);
    }
    return words.join(" ");
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
  };

}();

},{"./commands.js":3}],3:[function(require,module,exports){
module.exports = [

  ["move %n steps",                               " ", 1,   "forward:"],
  ["turn @turnRight %n degrees",                  " ", 1,   "turnRight:"],
  ["turn @turnLeft %n degrees",                   " ", 1,   "turnLeft:"],
  ["point in direction %d.direction",             " ", 1,   "heading:"],
  ["point towards %m.spriteOrMouse",              " ", 1,   "pointTowards:"],
  ["go to x:%n y:%n",                             " ", 1,   "gotoX:y:"],
  ["go to %m.location",                           " ", 1,   "gotoSpriteOrMouse:"],
  ["glide %n secs to x:%n y:%n",                  " ", 1,   "glideSecs:toX:y:elapsed:from:"],
  ["change x by %n",                              " ", 1,   "changeXposBy:"],
  ["set x to %n",                                 " ", 1,   "xpos:"],
  ["change y by %n",                              " ", 1,   "changeYposBy:"],
  ["set y to %n",                                 " ", 1,   "ypos:"],
  ["set rotation style %m.rotationStyle",         " ", 1,   "setRotationStyle"],
  ["say %s for %n secs",                          " ", 2,   "say:duration:elapsed:from:"],
  ["say %s",                                      " ", 2,   "say:"],
  ["think %s for %n secs",                        " ", 2,   "think:duration:elapsed:from:"],
  ["think %s",                                    " ", 2,   "think:"],
  ["show",                                        " ", 2,   "show"],
  ["hide",                                        " ", 2,   "hide"],
  ["switch costume to %m.costume",                " ", 2,   "lookLike:"],
  ["next costume",                                " ", 2,   "nextCostume"],
  ["next backdrop",                               " ", 102, "nextScene"],
  ["switch backdrop to %m.backdrop",              " ", 2,   "startScene"],
  ["switch backdrop to %m.backdrop and wait",     " ", 102, "startSceneAndWait"],
  ["change %m.effect effect by %n",               " ", 2,   "changeGraphicEffect:by:"],
  ["set %m.effect effect to %n",                  " ", 2,   "setGraphicEffect:to:"],
  ["clear graphic effects",                       " ", 2,   "filterReset"],
  ["change size by %n",                           " ", 2,   "changeSizeBy:"],
  ["set size to %n%",                             " ", 2,   "setSizeTo:"],
  ["go to front",                                 " ", 2,   "comeToFront"],
  ["go back %n layers",                           " ", 2,   "goBackByLayers:"],
  ["play sound %m.sound",                         " ", 3,   "playSound:"],
  ["play sound %m.sound until done",              " ", 3,   "doPlaySoundAndWait"],
  ["stop all sounds",                             " ", 3,   "stopAllSounds"],
  ["play drum %d.drum for %n beats",              " ", 3,   "playDrum"],
  ["rest for %n beats",                           " ", 3,   "rest:elapsed:from:"],
  ["play note %d.note for %n beats",              " ", 3,   "noteOn:duration:elapsed:from:"],
  ["set instrument to %d.instrument",             " ", 3,   "instrument:"],
  ["change volume by %n",                         " ", 3,   "changeVolumeBy:"],
  ["set volume to %n%",                           " ", 3,   "setVolumeTo:"],
  ["change tempo by %n",                          " ", 3,   "changeTempoBy:"],
  ["set tempo to %n bpm",                         " ", 3,   "setTempoTo:"],
  ["clear",                                       " ", 4,   "clearPenTrails"],
  ["stamp",                                       " ", 4,   "stampCostume"],
  ["pen down",                                    " ", 4,   "putPenDown"],
  ["pen up",                                      " ", 4,   "putPenUp"],
  ["set pen color to %c",                         " ", 4,   "penColor:"],
  ["change pen color by %n",                      " ", 4,   "changePenHueBy:"],
  ["set pen color to %n",                         " ", 4,   "setPenHueTo:"],
  ["change pen shade by %n",                      " ", 4,   "changePenShadeBy:"],
  ["set pen shade to %n",                         " ", 4,   "setPenShadeTo:"],
  ["change pen size by %n",                       " ", 4,   "changePenSizeBy:"],
  ["set pen size to %n",                          " ", 4,   "penSize:"],
  ["when @greenFlag clicked",                     "h", 5,   "whenGreenFlag"],
  ["when %m.key key pressed",                     "h", 5,   "whenKeyPressed"],
  ["when this sprite clicked",                    "h", 5,   "whenClicked"],
  ["when backdrop switches to %m.backdrop",       "h", 5,   "whenSceneStarts"],
  ["when %m.triggerSensor > %n",                  "h", 5,   "whenSensorGreaterThan"],
  ["when I receive %m.broadcast",                 "h", 5,   "whenIReceive"],
  ["broadcast %m.broadcast",                      " ", 5,   "broadcast:"],
  ["broadcast %m.broadcast and wait",             " ", 5,   "doBroadcastAndWait"],
  ["wait %n secs",                                " ", 6,   "wait:elapsed:from:"],
  ["repeat %n",                                   "c", 6,   "doRepeat"],
  ["forever",                                     "cf",6,   "doForever"],
  ["if %b then",                                  "c", 6,   "doIf"],
  ["if %b then",                                  "e", 6,   "doIfElse"],
  ["wait until %b",                               " ", 6,   "doWaitUntil"],
  ["repeat until %b",                             "c", 6,   "doUntil"],
  ["stop %m.stop",                                "f", 6,   "stopScripts"],
  ["when I start as a clone",                     "h", 6,   "whenCloned"],
  ["create clone of %m.spriteOnly",               " ", 6,   "createCloneOf"],
  ["delete this clone",                           "f", 6,   "deleteClone"],
  ["ask %s and wait",                             " ", 7,   "doAsk"],
  ["turn video %m.videoState",                    " ", 7,   "setVideoState"],
  ["set video transparency to %n%",               " ", 7,   "setVideoTransparency"],
  ["reset timer",                                 " ", 7,   "timerReset"],
  ["set %m.var to %s",                            " ", 9,   "setVar:to:"],
  ["change %m.var by %n",                         " ", 9,   "changeVar:by:"],
  ["show variable %m.var",                        " ", 9,   "showVariable:"],
  ["hide variable %m.var",                        " ", 9,   "hideVariable:"],
  ["add %s to %m.list",                           " ", 12,  "append:toList:"],
  ["delete %d.listDeleteItem of %m.list",         " ", 12,  "deleteLine:ofList:"],
  ["if on edge, bounce",                          " ", 1,   "bounceOffEdge"],
  ["insert %s at %d.listItem of %m.list",         " ", 12,  "insert:at:ofList:"],
  ["replace item %d.listItem of %m.list with %s", " ", 12,  "setLine:ofList:to:"],
  ["show list %m.list",                           " ", 12,  "showList:"],
  ["hide list %m.list",                           " ", 12,  "hideList:"],

  ["x position",                                  "r", 1,   "xpos"],
  ["y position",                                  "r", 1,   "ypos"],
  ["direction",                                   "r", 1,   "heading"],
  ["costume #",                                   "r", 2,   "costumeIndex"],
  ["size",                                        "r", 2,   "scale"],
  ["backdrop name",                               "r", 102, "sceneName"],
  ["backdrop #",                                  "r", 102, "backgroundIndex"],
  ["volume",                                      "r", 3,   "volume"],
  ["tempo",                                       "r", 3,   "tempo"],
  ["touching %m.touching?",                       "b", 7,   "touching:"],
  ["touching color %c?",                          "b", 7,   "touchingColor:"],
  ["color %c is touching %c?",                    "b", 7,   "color:sees:"],
  ["distance to %m.spriteOrMouse",                "r", 7,   "distanceTo:"],
  ["answer",                                      "r", 7,   "answer"],
  ["key %m.key pressed?",                         "b", 7,   "keyPressed:"],
  ["mouse down?",                                 "b", 7,   "mousePressed"],
  ["mouse x",                                     "r", 7,   "mouseX"],
  ["mouse y",                                     "r", 7,   "mouseY"],
  ["loudness",                                    "r", 7,   "soundLevel"],
  ["video %m.videoMotionType on %m.stageOrThis",  "r", 7,   "senseVideoMotion"],
  ["timer",                                       "r", 7,   "timer"],
  ["%m.attribute of %m.spriteOrStage",            "r", 7,   "getAttribute:of:"],
  ["current %m.timeAndDate",                      "r", 7,   "timeAndDate"],
  ["days since 2000",                             "r", 7,   "timestamp"],
  ["username",                                    "r", 7,   "getUserName"],
  ["%n + %n",                                     "r", 8,   "+"],
  ["%n - %n",                                     "r", 8,   "-"],
  ["%n * %n",                                     "r", 8,   "*"],
  ["%n / %n",                                     "r", 8,   "/"],
  ["pick random %n to %n",                        "r", 8,   "randomFrom:to:"],
  ["%s < %s",                                     "b", 8,   "<"],
  ["%s = %s",                                     "b", 8,   "="],
  ["%s > %s",                                     "b", 8,   ">"],
  ["%b and %b",                                   "b", 8,   "&"],
  ["%b or %b",                                    "b", 8,   "|"],
  ["not %b",                                      "b", 8,   "not"],
  ["join %s %s",                                  "r", 8,   "concatenate:with:"],
  ["letter %n of %s",                             "r", 8,   "letter:of:"],
  ["length of %s",                                "r", 8,   "stringLength:"],
  ["%n mod %n",                                   "r", 8,   "%"],
  ["round %n",                                    "r", 8,   "rounded"],
  ["%m.mathOp of %n",                             "r", 8,   "computeFunction:of:"],
  ["item %d.listItem of %m.list",                 "r", 12,  "getLine:ofList:"],
  ["length of %m.list",                           "r", 12,  "lineCountOfList:"],
  ["%m.list contains %s?",                        "b", 12,  "list:contains:"],

  ["when %m.booleanSensor",                         "h", 20,  ""],
  ["when %m.sensor %m.lessMore %n",                 "h", 20,  ""],
  ["sensor %m.booleanSensor?",                      "b", 20,  ""],
  ["%m.sensor sensor value",                        "r", 20,  ""],

  ["turn %m.motor on for %n secs",                  " ", 20,  ""],
  ["turn %m.motor on",                              " ", 20,  ""],
  ["turn %m.motor off",                             " ", 20,  ""],
  ["set %m.motor power to %n",                      " ", 20,  ""],
  ["set %m.motor2 direction to %m.motorDirection",  " ", 20,  ""],
  ["when distance %m.lessMore %n",                  "h", 20,  ""],
  ["when tilt %m.eNe %n",                           "h", 20,  ""],
  ["distance",                                      "r", 20,  ""],
  ["tilt",                                          "r", 20,  ""],

  ["turn %m.motor on for %n seconds",               " ", 20,  ""],
  ["set light color to %n",                         " ", 20,  ""],
  ["play note %n for %n seconds",                   " ", 20,  ""],
  ["when tilted",                                   "h", 20,  ""],
  ["tilt %m.xxx",                                   "r", 20,  ""],

  ["else", "else", 6, ""],
  ["else if %b", "else", 6, ""],
  ["end", "end", 6, ""],
  [". . .", " ", 42, ""],
  ["credit %s", " ", 42, ""], //testing

  ["%n @addInput", "ring", 42, ""],

  ["user id",                                   "r",  0,  ""],

  ["if %b",                                     "c",  0,  "doIf"],
  ["if %b",                                     "e",  0,  "doIfElse"],
  ["forever if %b",                             "cf", 0,  "doForeverIf"],
  ["stop script",                               "f",  0,  "doReturn"],
  ["stop all",                                  "f",  0,  "stopAll"],
  ["switch to costume %m.costume",              " ",  0,  "lookLike:"],
  ["next background",                           " ",  0,  "nextScene"],
  ["switch to background %m.backdrop",          " ",  0,  "startScene"],
  ["background #",                              "r",  0,  "backgroundIndex"],
  ["loud?",                                     "b",  0,  "isLoud"],

];

},{}],4:[function(require,module,exports){
/* for constucting SVGs */

function extend(src, dest) { return Object.assign({}, dest, src); }
function assert(bool, message) { if (!bool) throw "Assertion failed! " + (message || ""); }

// set by SVG.init
var document;
var xml;



var directProps = {
  textContent: true,
};

var SVG = module.exports = {

  init(window, makeCanvas) {
    document = window.document;
    var DOMParser = window.DOMParser;
    xml = new DOMParser().parseFromString('<xml></xml>',  "application/xml");
    SVG.XMLSerializer = window.XMLSerializer;

    SVG.makeCanvas = makeCanvas;
  },

  cdata(content) {
    return xml.createCDATASection(content);
  },

  el(name, props) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", name);
    return SVG.setProps(el, props);
  },

  setProps(el, props) {
    for (var key in props) {
      var value = '' + props[key];
      if (directProps[key]) {
        el[key] = value;
      } else if (/^xlink:/.test(key)) {
        el.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value);
      } else if (props[key] !== null && props.hasOwnProperty(key)) {
        el.setAttributeNS(null, key, value);
      }
    }
    return el;
  },

  withChildren(el, children) {
    for (var i=0; i<children.length; i++) {
      el.appendChild(children[i]);
    }
    return el;
  },

  group(children) {
    return SVG.withChildren(SVG.el('g'), children);
  },

  newSVG(width, height) {
    return SVG.el('svg', {
      version: "1.1",
      width: width,
      height: height,
    });
  },

  polygon(props) {
    return SVG.el('polygon', extend(props, {
      points: props.points.join(" "),
    }));
  },

  path(props) {
    return SVG.el('path', extend(props, {
      path: null,
      d: props.path.join(" "),
    }));
  },

  text(x, y, content, props) {
    var text = SVG.el('text', extend(props, {
      x: x,
      y: y,
      textContent: content,
    }));
    return text;
  },

  symbol(href) {
    return SVG.el('use', {
      'xlink:href': href,
    });
  },

  move(dx, dy, el) {
    SVG.setProps(el, {
      transform: ['translate(', dx, ' ', dy, ')'].join(''),
    });
    return el;
  },

  translatePath(dx, dy, path) {
    var isX = true;
    var parts = path.split(" ");
    var out = [];
    for (var i=0; i<parts.length; i++) {
      var part = parts[i];
      if (part === 'A') {
        var j = i + 5;
        out.push('A');
        while (i < j) {
          out.push(parts[++i]);
        }
        continue;
      } else if (/[A-Za-z]/.test(part)) {
        assert(isX);
      } else {
        part = +part;
        part += isX ? dx : dy;
        isX = !isX;
      }
      out.push(part);
    }
    return out.join(" ");
  },


  /* shapes */

  rect(w, h, props) {
    return SVG.el('rect', extend(props, {
      x: 0,
      y: 0,
      width: w,
      height: h,
    }));
  },

  arc(p1x, p1y, p2x, p2y, rx, ry) {
    var r = p2y - p1y;
    return ["L", p1x, p1y, "A", rx, ry, 0, 0, 1, p2x, p2y].join(" ");
  },

  arcw(p1x, p1y, p2x, p2y, rx, ry) {
    var r = p2y - p1y;
    return ["L", p1x, p1y, "A", rx, ry, 0, 0, 0, p2x, p2y].join(" ");
  },

  roundedPath(w, h) {
    var r = h / 2;
    return [
      "M", r, 0,
      SVG.arc(w - r, 0, w - r, h, r, r),
      SVG.arc(r, h, r, 0, r, r),
      "Z"
    ];
  },
  
  roundedPath2(w, h) {
    var r = (h / 2);
    var shift = 4;
    return [
      "M", r-8, 0,
      SVG.arc((w - r)-shift, 0, (w - r)-shift, h, r, r),
      SVG.arc(r-shift, h, r-shift, 0, r, r),
      "Z"
    ];
  },

  roundedRect(w, h, props) {
    return SVG.path(extend(props, {
      path: SVG.roundedPath(w, h),
    }));
  },
  
  roundedInput(w, h, props) {
    return SVG.path(extend(props, {
      path: SVG.roundedPath2(w+8, h),
    }));
  },

  pointedPath(w, h) {
    var r = h / 2;
    return [
      "M", r, 0,
      "L", w - r, 0, w, r,
      "L", w, r, w - r, h,
      "L", r, h, 0, r,
      "L", 0, r, r, 0,
      "Z",
    ];
  },

  pointedRect(w, h, props) {
    return SVG.path(extend(props, {
      path: SVG.pointedPath(w+8, h),
    }));
  },

  getTop(w) {
    // return ["M", 0, 3,
    //   "L", 3, 0,
    //   "L", 13, 0,
    //   "L", 16, 3,
    //   "L", 24, 3,
    //   "L", 27, 0,
    //   "L", w - 3, 0,
    //   "L", w, 3
    // ].join(" ");
    return ["M", 0, 4,
      // "L", 1, 1,
      // "L", 4, 0,
      "Q", SVG.curve(0, 4, 4, 0, 0),
      "L", 4, 0,
      "L", 8, 0,
      "L", 12, 4,
      "L", 20, 4,
      "L", 24, 0,
      "L", 28, 0,
      "L", w - 4, 0,
      "Q", SVG.curve(w - 4, 0, w, 4, 0),
      "L", w, 4
    ].join(" ");
  },

  getRingTop(w) {
    return ["M", 0, 3,
      "L", 3, 0,
      "L", 7, 0,
      "L", 10, 3,
      "L", 16, 3,
      "L", 19, 0,
      "L", w - 3, 0,
      "L", w, 3
    ].join(" ");
  },

  getRightAndBottom(w, y, hasNotch, inset) {
    if (typeof inset === "undefined") {
      inset = 0;
    }
    var arr = ["L", w, y - 3,
      "L", w - 3, y
    ];
    if (hasNotch) {
    // // return ["M", 0, 3,
    // //   "L", 3, 0,
    // //   "L", 13, 0,
    // //   "L", 16, 3,
    // //   "L", 24, 3,
    // //   "L", 27, 0,
    // //   "L", w - 3, 0,
    // //   "L", w, 3
    // // ].join(" ");
    // return ["M", 0, 4,
    //   "L", 1, 1,
    //   "L", 4, 0,
    //   "L", 8, 0,
    //   "L", 12, 4,
    //   "L", 20, 4,
    //   "L", 24, 0,
    //   "L", 28, 0,
    //   "L", w - 4, 0,
    //   "L", w - 1, 1,
    //   "L", w, 4
      arr = arr.concat([
        "L", inset + 28, y,
        "L", inset + 24, y,
        "L", inset + 20, y + 4,
        "L", inset + 12, y + 4,
        "L", inset + 8, y,
        "L", inset + 4, y,
        //"L", inset + 1, y,
      ]);
    }
    if (inset > 0) {
      arr = arr.concat([
        "L", inset + 2, y,
        "L", inset, y + 2
      ])
    } else {
      arr = arr.concat([
        "L", inset + 3, y,
        "L", 0, y - 3
      ]);
    }
    return arr.join(" ");
  },

  getArm(w, armTop) {
    return [
      "L", 15, armTop - 2,
      "L", 15 + 2, armTop,
      "L", w - 3, armTop,
      "L", w, armTop + 3
    ].join(" ");
  },


  stackRect(w, h, props) {
    return SVG.path(extend(props, {
      path: [
        SVG.getTop(w),
        SVG.getRightAndBottom(w, h, true, 0),
        "Z",
      ],
    }));
  },

  capPath(w, h) {
    return [
      SVG.getTop(w),
      SVG.getRightAndBottom(w, h, false, 0),
      "Z",
    ];
  },

  ringCapPath(w, h) {
    return [
      SVG.getRingTop(w),
      SVG.getRightAndBottom(w, h, false, 0),
      "Z",
    ];
  },

  capRect(w, h, props) {
    return SVG.path(extend(props, {
      path: SVG.capPath(w, h),
    }));
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
    var roundness = roundness || 0.42;
    var midX = (p1x + p2x) / 2.0;
    var midY = (p1y + p2y) / 2.0;
    var cx = Math.round(midX + (roundness * (p2y - p1y)));
    var cy = Math.round(midY - (roundness * (p2x - p1x)));
    return [cx, cy, p2x, p2y].join(" ");
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
        // "M", -1, 13,
        // "Q", SVG.curve(-1, 13, w + 1, 13, archRoundness),
        // "Q", SVG.curve(w + 1, 13, w, 16, 0.6),
        // "Q", SVG.curve(w, 16, 0, 16, -archRoundness),
        // "Q", SVG.curve(0, 16, -1, 13, 0.6),
        // "Z",
      ],
    }));
  },

  procHatCap(w, h, archRoundness) {
    // TODO use arc()
    // TODO this doesn't look quite right
    return SVG.path({
      path: [
        "M", -1, 13,
        "Q", SVG.curve(-1, 13, w + 1, 13, archRoundness),
        "Q", SVG.curve(w + 1, 13, w, 16, 0.6),
        "Q", SVG.curve(w, 16, 0, 16, -archRoundness),
        "Q", SVG.curve(0, 16, -1, 13, 0.6),
        "Z",
      ],
      class: 'sb-define-hat-cap',
    });
  },

  procHatRect(w, h, props) {
    var q = 52;
    var y = h - q;

    var archRoundness = Math.min(0.2, 35 / w);

    return SVG.move(0, y, SVG.group([
      SVG.procHatBase(w, q, archRoundness, props),
      //SVG.procHatCap(w, q, archRoundness),
    ]));
  },

  mouthRect(w, h, isFinal, lines, props) {
    var y = lines[0].height;
    var p = [
      SVG.getTop(w),
      SVG.getRightAndBottom(w, y, true, 15),
    ];
    for (var i=1; i<lines.length; i += 2) {
      var isLast = (i + 2 === lines.length);

      y += lines[i].height - 3;
      p.push(SVG.getArm(w, y));

      var hasNotch = !(isLast && isFinal);
      var inset = isLast ? 0 : 15;
      y += lines[i + 1].height + 3;
      p.push(SVG.getRightAndBottom(w, y, hasNotch, inset));
    }
    return SVG.path(extend(props, {
      path: p,
    }));
  },

  ringRect(w, h, cy, cw, ch, shape, props) {
    var r = 8;
    var func = shape === 'reporter' ? SVG.roundedPath
             : shape === 'boolean' ? SVG.pointedPath
             : cw < 40 ? SVG.ringCapPath : SVG.capPath;
    return SVG.path(extend(props, {
      path: [
        "M", r, 0,
        SVG.arcw(r, 0, 0, r, r, r),
        SVG.arcw(0, h - r, r, h, r, r),
        SVG.arcw(w - r, h, w, h - r, r, r),
        SVG.arcw(w, r, w - r, 0, r, r),
        "Z",
        SVG.translatePath(4, cy || 4, func(cw, ch).join(" ")),
      ],
      'fill-rule': 'even-odd',
    }));
  },

  commentRect(w, h, props) {
    var r = 6;
    return SVG.path(extend(props, {
      class: 'sb-comment',
      path: [
        "M", r, 0,
        SVG.arc(w - r, 0, w, r, r, r),
        SVG.arc(w, h - r, w - r, h, r, r),
        SVG.arc(r, h, 0, h - r, r, r),
        SVG.arc(0, r, r, 0, r, r),
        "Z"
      ],
    }));
  },

  commentLine(width, props) {
    return SVG.move(-width, 9, SVG.rect(width, 2, extend(props, {
      class: 'sb-comment-line',
    })));
  },

};

},{}],5:[function(require,module,exports){
module.exports = function() {

  function extend(src, dest) { return Object.assign({}, dest, src); }

  var SVG = require('./draw.js');

  var Filter = function(id, props) {
    this.el = SVG.el('filter', extend(props, {
      id: id,
      x0: '-50%',
      y0: '-50%',
      width: '200%',
      height: '200%',
    }));
    this.highestId = 0;
  };
  Filter.prototype.fe = function(name, props, children) {
    var shortName = name.toLowerCase().replace(/gaussian|osite/, '');
    var id = [shortName, '-', ++this.highestId].join('');
    this.el.appendChild(SVG.withChildren(SVG.el("fe" + name, extend(props, {
      result: id,
    })), children || []));
    return id;
  }
  Filter.prototype.comp = function(op, in1, in2, props) {
    return this.fe('Composite', extend(props, {
      operator: op,
      in: in1,
      in2: in2,
    }));
  }
  Filter.prototype.subtract = function(in1, in2) {
    return this.comp('arithmetic', in1, in2, { k2: +1, k3: -1 });
  }
  Filter.prototype.offset = function(dx, dy, in1) {
    return this.fe('Offset', {
      in: in1,
      dx: dx,
      dy: dy,
    });
  }
  Filter.prototype.flood = function(color, opacity, in1) {
    return this.fe('Flood', {
      in: in1,
      'flood-color': color,
      'flood-opacity': opacity,
    });
  }
  Filter.prototype.blur = function(dev, in1) {
    return this.fe('GaussianBlur', {
      'in': 'SourceAlpha',
      stdDeviation: [dev, dev].join(' '),
    });
  }
  Filter.prototype.merge = function(children) {
    this.fe('Merge', {}, children.map(function(name) {
      return SVG.el('feMergeNode', {
        in: name,
      });
    }));
  }

  return Filter;

}();

},{"./draw.js":4}],6:[function(require,module,exports){
/*
 * scratchblocks
 * http://scratchblocks.github.io/
 *
 * Copyright 2013-2016, Tim Radvan
 * @license MIT
 * http://opensource.org/licenses/MIT
 */
(function (mod) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;
  } else {
    var makeCanvas = function() { return document.createElement('canvas'); };
    var scratchblocks = window.scratchblocks = mod(window, makeCanvas);

    // add our CSS to the page
    document.head.appendChild(scratchblocks.makeStyle());
  }
}(function(window, makeCanvas) {
  'use strict';

  var document = window.document;


  /* utils */

  function extend(src, dest) { return Object.assign({}, dest, src); }

  /*****************************************************************************/

  var { allLanguages, loadLanguages } = require('./blocks.js');

  var parse = require('./syntax.js').parse;

  var style = require('./style.js');

  /*****************************************************************************/

  var {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,
  } = require('./model.js');

  /*****************************************************************************/

  var SVG = require('./draw.js');
  SVG.init(window, makeCanvas);

  Label.measuring = (function() {
    var canvas = SVG.makeCanvas();
    return canvas.getContext('2d');
  }());

  /*****************************************************************************/

  function render(doc, cb) {
    return doc.render(cb);
  }


  /*** Render ***/

  // read code from a DOM element
  function readCode(el, options) {
    var options = extend({
      inline: false,
    }, options);

    var html = el.innerHTML.replace(/<br>\s?|\n|\r\n|\r/ig, '\n');
    var pre = document.createElement('pre');
    pre.innerHTML = html;
    var code = pre.textContent;
    if (options.inline) {
      code = code.replace('\n', '');
    }
    return code;
  }

  // insert 'svg' into 'el', with appropriate wrapper elements
  function replace(el, svg, scripts, options) {
    if (options.inline) {
      var container = document.createElement('span');
      var cls = "scratchblocks scratchblocks-inline";
      if (scripts[0] && !scripts[0].isEmpty) {
        cls += " scratchblocks-inline-" + scripts[0].blocks[0].shape;
      }
      container.className = cls;
      container.style.display = 'inline-block';
      container.style.verticalAlign = 'middle';
    } else {
      var container = document.createElement('div');
      container.className = "scratchblocks";
    }
    container.appendChild(svg);

    el.innerHTML = '';
    el.appendChild(container);
  }

  /* Render all matching elements in page to shiny scratch blocks.
   * Accepts a CSS selector as an argument.
   *
   *  scratchblocks.renderMatching("pre.blocks");
   *
   * Like the old 'scratchblocks2.parse().
   */
  var renderMatching = function (selector, options) {
    var selector = selector || "pre.blocks";
    var options = extend({
      inline: false,
      languages: ['en'],

      read: readCode, // function(el, options) => code
      parse: parse,   // function(code, options) => doc
      render: render, // function(doc, cb) => svg
      replace: replace, // function(el, svg, doc, options)
    }, options);

    // find elements
    var results = [].slice.apply(document.querySelectorAll(selector));
    results.forEach(function(el) {
      var code = options.read(el, options);

      var doc = options.parse(code, options);

      options.render(doc, function(svg) {
        options.replace(el, svg, doc, options);
      });
    });
  };


  /* Parse scratchblocks code and return XML string.
   *
   * Convenience function for Node, really.
   */
  var renderSVGString = function (code, options) {
    var doc = parse(code, options);

    // WARN: Document.render() may become async again in future :-(
    doc.render(function() {});

    return doc.exportSVGString();
  };


  return {
    allLanguages: allLanguages, // read-only
    loadLanguages: loadLanguages,

    fromJSON: Document.fromJSON,
    toJSON: function(doc) { return doc.toJSON(); },
    stringify: function(doc) { return doc.stringify(); },

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
  };

}));

},{"./blocks.js":2,"./draw.js":4,"./model.js":7,"./style.js":8,"./syntax.js":9}],7:[function(require,module,exports){
module.exports = function() {

  function assert(bool, message) { if (!bool) throw "Assertion failed! " + (message || ""); }
  function isArray(o) { return o && o.constructor === Array; }
  function extend(src, dest) { return Object.assign({}, dest, src); }

  function indent(text) {
    return text.split("\n").map(function(line) {
      return "  " + line;
    }).join("\n");
  }

  function maybeNumber(v) {
    v = '' + v;
    var n = parseInt(v);
    if (!isNaN(n)) {
      return n;
    }
    var f = parseFloat(v);
    if (!isNaN(f)) {
      return f;
    }
    return v;
  }


  var SVG = require('./draw.js');

  var {
    defaultFontFamily,
    makeStyle,
    makeIcons,
    darkRect,
    bevelFilter,
    darkFilter,
  } = require('./style.js');

  var {
    blocksBySelector,
    parseSpec,
    inputPat,
    iconPat,
    rtlLanguages,
    unicodeIcons,
    english,
    blockName,
  } = require('./blocks.js');




  /* Label */

  var Label = function(value, cls) {
    this.value = value;
    this.cls = cls || '';
    this.el = null;
    this.height = 12;
    this.metrics = null;
    this.x = 0;
  };
  Label.prototype.isLabel = true;

  Label.prototype.stringify = function() {
    if (this.value === "<" || this.value === ">") return this.value;
    return (this.value
      .replace(/([<>[\](){}])/g, "\\$1")
    );
  };

  Label.prototype.draw = function() {
    return this.el;
  };

  Object.defineProperty(Label.prototype, 'width', {
    get: function() {
      return this.metrics.width;
    },
  });

  Label.metricsCache = {};
  Label.toMeasure = [];

  Label.prototype.measure = function() {
    var value = this.value;
    var cls = this.cls;
    this.el = SVG.text(0, 10, value, {
      class: 'sb-label ' + cls,
    });

    var cache = Label.metricsCache[cls];
    if (!cache) {
      cache = Label.metricsCache[cls] = Object.create(null);
    }

    if (Object.hasOwnProperty.call(cache, value)) {
      this.metrics = cache[value];
    } else {
      var font = /sb-comment-label/.test(this.cls) ? 'bold 12px Helevetica, Arial, DejaVu Sans, sans-serif'
               : /sb-literal/.test(this.cls) ? 'normal 9px ' + defaultFontFamily
               : 'bold 10px ' + defaultFontFamily;
      this.metrics = cache[value] = Label.measure(value, font);
      // TODO: word-spacing? (fortunately it seems to have no effect!)
    }
  };

  Label.measure = function(value, font) {
    var context = Label.measuring;
    context.font = font;
    var textMetrics = context.measureText(value);
    var width = (textMetrics.width + 0.5) | 0;
    return { width: width };
  };


  /* Icon */

  var Icon = function(name) {
    this.name = name;
    this.isArrow = name === 'loopArrow';

    var info = Icon.icons[name];
    assert(info, "no info for icon " + name);
    Object.assign(this, info);
  };
  Icon.prototype.isIcon = true;

  Icon.prototype.stringify = function() {
    return unicodeIcons["@" + this.name] || "";
  };

  Icon.icons = {
    greenFlag: { width: 10, height: 21, dy: -2 },
    turnLeft: { width: 15, height: 12, dy: +1 },
    turnRight: { width: 15, height: 12, dy: +1 },
    loopArrow: { width: 14, height: 11 },
    addInput: { width: 4, height: 8 },
    delInput: { width: 4, height: 8 },
  };
  Icon.prototype.draw = function() {
    return SVG.symbol('#' + this.name, {
      width: this.width,
      height: this.height,
    });
  };


  /* Input */

  var Input = function(shape, value, menu) {
    this.shape = shape;
    this.value = value;
    this.menu = menu || null;

    this.isRound = shape === 'number' || shape === 'number-dropdown';
    this.isBoolean = shape === 'boolean';
    this.isStack = shape === 'stack';
    this.isInset = shape === 'boolean' || shape === 'stack' || shape === 'reporter';
    this.isColor = shape === 'color';
    this.hasArrow = shape === 'dropdown' || shape === 'number-dropdown';
    this.isDarker = shape === 'boolean' || shape === 'stack' || shape === 'dropdown';
    this.isSquare = shape === 'string' || shape === 'color' || shape === 'dropdown';

    this.hasLabel = !(this.isColor || this.isInset);
    this.label = this.hasLabel ? new Label(value, ['sb-literal-' + this.shape]) : null;
    this.x = 0;
  };
  Input.prototype.isInput = true;

  Input.fromJSON = function(lang, value, part) {
    var shape = {
      b: 'boolean',
      n: 'number',
      s: 'string',
      d: 'number-dropdown',
      m: 'dropdown',
      c: 'color',
    }[part[1]];

    if (shape === 'color') {
      if (!value && value !== 0) value = parseInt(Math.random() * 256 * 256 * 256);
      value = +value;
      if (value < 0) value = 0xFFFFFFFF + value + 1;
      var hex = value.toString(16);
      hex = hex.slice(Math.max(0, hex.length - 6)); // last 6 characters
      while (hex.length < 6) hex = '0' + hex;
      if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        hex = hex[0] + hex[2] + hex[4];
      }
      value = '#' + hex;
    } else if (shape === 'dropdown') {
      value = {
        _mouse_: "mouse-pointer",
        _myself_: "myself",
        _stage_: "Stage",
        _edge_: "edge",
        _random_: "random position",
      }[value] || value;
      var menu = value;
      value = lang.dropdowns[value] || value ;
    } else if (shape === 'number-dropdown') {
      value = lang.dropdowns[value] || value ;
    }

    return new Input(shape, ''+value, menu);
  };

  Input.prototype.toJSON = function() {
    if (this.isColor) {
      assert(this.value[0] === '#');
      var h = this.value.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return parseInt(h, 16);
      // TODO signed int?
    }
    if (this.hasArrow) {
      var value = this.menu || this.value;
      if (this.shape === 'dropdown') {
        value = {
          "mouse-pointer": "_mouse_",
          "myself": "_myself",
          "Stage": "_stage_",
          "edge": "_edge_",
          "random position": "_random_",
        }[value] || value;
      }
      if (this.isRound) {
        value = maybeNumber(value);
      }
      return value;
    }
    return this.isBoolean ? false : this.isRound ? maybeNumber(this.value) : this.value;
  };

  Input.prototype.stringify = function() {
    if (this.isColor) {
      assert(this.value[0] === '#');
      return "[" + this.value + "]";
    }
    var text = ((this.value ? "" + this.value : "")
      .replace(/ v$/, " \\v")
      .replace(/([\]\\])/g, "\\$1")
    );
    if (this.hasArrow) text += " v";
    return this.isRound ? "(" + text + ")"
         : this.isSquare ? "[" + text + "]"
         : this.isBoolean ? "<>"
         : this.isStack ? "{}"
         : text;
  };

  Input.prototype.translate = function(lang) {
    if (this.hasArrow) {
      var value = this.menu || this.value;
      this.value = lang.dropdowns[value] || value;
      this.label = new Label(this.value, ['sb-literal-' + this.shape]);
    }
  };

  Input.prototype.measure = function() {
    if (this.hasLabel) this.label.measure();
  };

  Input.shapes = {
    'string': SVG.roundedInput, //SVG.rect
    'number': SVG.roundedInput,
    'number-dropdown': SVG.roundedInput,
    'color': SVG.roundedInput,
    'dropdown': SVG.rect,

    'boolean': SVG.pointedRect,
    'stack': SVG.stackRect,
    'reporter': SVG.roundedRect,
  };

  Input.prototype.draw = function(parent) {
    if (this.hasLabel) {
      var label = this.label.draw();
      var w = Math.max(14, this.label.width + (this.shape === 'string' || this.shape === 'number-dropdown' ? 6 : 9));
    } else {
      var w = this.isInset ? 30*0.85 : this.isColor ? 13*1.5 : null;
    }
    if (this.hasArrow) w += 10;
    this.width = w;

    var h = this.height = this.isRound || this.isColor ? 13*1.5 : 14*1.25; //scaled inputs

    var el = Input.shapes[this.shape](w, h);
    if (this.isColor) {
      SVG.setProps(el, {
        fill: this.value,
      });
    } else if (this.isDarker) {
      el = darkRect(w, h, parent.info.category, el);
      if (parent.info.color) {
        SVG.setProps(el, {
          fill: parent.info.color,
        });
      }
    }

    var result = SVG.group([
      SVG.setProps(el, {
        class: ['sb-input', 'sb-input-'+this.shape].join(' '),
      }),
    ]);
    if (this.hasLabel) {
      var x = this.isRound ? 5 : 4;
      result.appendChild(SVG.move(x-2, 2, label)); //TODO fix text
    }
    if (this.hasArrow) {
      var y = this.shape === 'dropdown' ? 5 : 4;
      result.appendChild(SVG.move(w - 10, y, SVG.polygon({
        points: [
          7, 0,
          3.5, 4,
          0, 0,
        ],
        fill: '#000',
        opacity: '0.6',
      })));
    }
    return result;
  };


  /* Block */

  var Block = function(info, children, comment) {
    assert(info);
    this.info = info;
    this.children = children;
    this.comment = comment || null;

    var shape = this.info.shape;
    this.isHat = shape === 'hat' || shape === 'define-hat';
    this.hasPuzzle = shape === 'stack' || shape === 'hat';
    this.isFinal = /cap/.test(shape);
    this.isCommand = shape === 'stack' || shape === 'cap' || /block/.test(shape);
    this.isOutline = shape === 'outline';
    this.isReporter = shape === 'reporter';
    this.isBoolean = shape === 'boolean';

    this.isRing = shape === 'ring';
    this.hasScript = /block/.test(shape);
    this.isElse = shape === 'celse';
    this.isEnd = shape === 'cend';

    this.x = 0;
    this.width = null;
    this.height = null;
    this.firstLine = null;
    this.innerWidth = null;
  };
  Block.prototype.isBlock = true;

  Block.fromJSON = function(lang, array, part) {
    var args = array.slice();
    var selector = args.shift();
    if (selector === 'procDef') {
      var spec = args[0];
      var inputNames = args[1].slice();
      // var defaultValues = args[2];
      // var isAtomic = args[3]; // TODO

      var info = parseSpec(spec);
      var children = info.parts.map(function(part) {
        if (inputPat.test(part)) {
          var label = new Label(inputNames.shift());
          return new Block({
            shape: part[1] === 'b' ? 'boolean' : 'reporter',
            category: 'custom-arg',
          }, [label]);
        } else {
          return new Label(part);
        }
      });
      var outline = new Block({
        shape: 'outline',
      }, children);

      var children = [new Label(lang.define[0]), outline];
      return new Block({
        shape: 'define-hat',
        category: 'custom',
        selector: 'procDef',
        call: spec,
        names: args[1],
        language: lang,
      }, children);

    } else if (selector === 'call') {
      var spec = args.shift();
      var info = extend(parseSpec(spec), {
        category: 'custom',
        shape: 'stack',
        selector: 'call',
        call: spec,
        language: lang,
      });
      var parts = info.parts;

    } else if (selector === 'readVariable' || selector === 'contentsOfList:' || selector === 'getParam') {
      var shape = selector === 'getParam' && args.pop() === 'b' ? 'boolean' : 'reporter';
      var info = {
        selector: selector,
        shape: shape,
        category: {
          'readVariable': 'variables',
          'contentsOfList:': 'list',
          'getParam': 'custom-arg',
        }[selector],
        language: lang,
      }
      return new Block(info, [new Label(args[0])]);

    } else {
      var info = extend(blocksBySelector[selector], {
        language: lang,
      });
      assert(info, "unknown selector: " + selector);
      var spec = lang.commands[info.spec] || spec;
      var parts = spec ? parseSpec(spec).parts : info.parts;
    }
    var children = parts.map(function(part) {
      if (inputPat.test(part)) {
        var arg = args.shift();
        return (isArray(arg) ? Block : Input).fromJSON(lang, arg, part);
      } else if (iconPat.test(part)) {
        return new Icon(part.slice(1));
      } else {
        return new Label(part.trim());
      }
    });
    args.forEach(function(list, index) {
      list = list || [];
      assert(isArray(list));
      children.push(new Script(list.map(Block.fromJSON.bind(null, lang))));
      if (selector === 'doIfElse' && index === 0) {
        children.push(new Label(lang.commands["else"]));
      }
    });
    // TODO loop arrows
    return new Block(info, children);
  };

  Block.prototype.toJSON = function() {
    var selector = this.info.selector;
    var args = [];

    if (selector === 'procDef') {
      var inputNames = this.info.names;
      var spec = this.info.call;
      var info = parseSpec(spec);
      var defaultValues = info.inputs.map(function(input) {
        return input === '%n' ? 1
             : input === '%b' ? false : "";
      });
      var isAtomic = false; // TODO 'define-atomic' ??
      return ['procDef', spec, inputNames, defaultValues, isAtomic];
    }

    if (selector === 'readVariable' || selector === 'contentsOfList:' || selector === 'getParam') {
      args.push(blockName(this));
      if (selector === 'getParam') args.push(this.isBoolean === 'boolean' ? 'b' : 'r');

    } else {
      for (var i=0; i<this.children.length; i++) {
        var child = this.children[i];
        if (child.isInput || child.isBlock || child.isScript) {
          args.push(child.toJSON());
        }
      }

      if (selector === 'call') {
        return ['call', this.info.call].concat(args);
      }
    }
    if (!selector) throw "unknown block: " + this.info.hash;
    return [selector].concat(args);
  };

  Block.prototype.stringify = function() {
    var firstInput = null;
    var checkAlias = false;
    var text = this.children.map(function(child) {
      if (child.isIcon) checkAlias = true;
      if (!firstInput && !(child.isLabel || child.isIcon)) firstInput = child;
      return child.isScript ? "\n" + indent(child.stringify()) + "\n"
                            : child.stringify().trim() + " ";
    }).join("").trim();

    var lang = this.info.language;
    if (checkAlias && lang && this.info.selector) {
      var type = blocksBySelector[this.info.selector];
      var spec = type.spec;
      var alias = lang.nativeAliases[type.spec]
      if (alias) {
        // TODO make translate() not in-place, and use that
        if (inputPat.test(alias) && firstInput) {
          alias = alias.replace(inputPat, firstInput.stringify());
        }
        return alias;
      }
    }

    if ((this.info.shape === 'reporter' && this.info.category === 'list')
     || (this.info.category === 'custom' && this.info.shape === 'stack')) {
      text += " :: " + this.info.category;
    }
    return this.hasScript ? text + "\nend"
         : this.info.shape === 'reporter' ? "(" + text + ")"
         : this.info.shape === 'boolean' ? "<" + text + ">"
         : text;
  };

  Block.prototype.translate = function(lang, isShallow) {
    var selector = this.info.selector;
    if (!selector) return;
    if (selector === 'procDef') {
      assert(this.children[0].isLabel);
      this.children[0] = new Label(lang.define[0] || english.define[0]);
    }
    var block = blocksBySelector[selector];
    if (!block) return;
    var nativeSpec = lang.commands[block.spec];
    if (!nativeSpec) return;
    var nativeInfo = parseSpec(nativeSpec);
    var args = this.children.filter(function(child) {
      return !child.isLabel && !child.isIcon;
    });
    if (!isShallow) args.forEach(function(child) {
      child.translate(lang);
    });
    this.children = nativeInfo.parts.map(function(part) {
      var part = part.trim();
      if (!part) return;
      return inputPat.test(part) ? args.shift()
           : iconPat.test(part) ? new Icon(part.slice(1)) : new Label(part);
    }).filter(x => !!x);
    args.forEach(function(arg) {
      this.children.push(arg);
    }.bind(this));
    this.info.language = lang;
    this.info.isRTL = rtlLanguages.indexOf(lang.code) > -1;
  };

  Block.prototype.measure = function() {
    for (var i=0; i<this.children.length; i++) {
      var child = this.children[i];
      if (child.measure) child.measure();
    }
    if (this.comment) this.comment.measure();
  };

  Block.shapes = {
    'stack': SVG.stackRect,
    'c-block': SVG.stackRect,
    'if-block': SVG.stackRect,
    'celse': SVG.stackRect,
    'cend': SVG.stackRect,

    'cap': SVG.capRect,
    'reporter': SVG.roundedRect,
    'boolean': SVG.pointedRect,
    'hat': SVG.hatRect,
    'define-hat': SVG.procHatRect,
    'ring': SVG.roundedRect,
  };

  Block.prototype.drawSelf = function(w, h, lines) {
    // mouths
    if (lines.length > 1) {
      return SVG.mouthRect(w, h, this.isFinal, lines, {
        class: ['sb-' + this.info.category, 'sb-bevel'].join(' '),
      });
    }

    // outlines
    if (this.info.shape === 'outline') {
      return SVG.setProps(SVG.stackRect(w, h), {
        class: 'sb-outline',
      });
    }

    // rings
    if (this.isRing) {
      var child = this.children[0];
      if (child && (child.isInput || child.isBlock || child.isScript)) {
        var shape = child.isScript ? 'stack'
                  : child.isInput ? child.shape : child.info.shape;
        return SVG.ringRect(w, h, child.y, child.width, child.height, shape, {
          class: ['sb-' + this.info.category, 'sb-bevel'].join(' '),
        });
      }
    }

    var func = Block.shapes[this.info.shape];
    assert(func, "no shape func: " + this.info.shape);
    return func(w, h, {
      class: ['sb-' + this.info.category, 'sb-bevel'].join(' '),
    });
  };

  Block.prototype.minDistance = function(child) {
    if (this.isBoolean) {
      return (
        child.isReporter ? 4 + child.height/4 | 0 :
        child.isLabel ? 5 + child.height/2 | 0 :
        child.isBoolean || child.shape === 'boolean' ? 5 :
        2 + child.height/2 | 0
      );
    }
    if (this.isReporter) {
      return (
        (child.isInput && child.isRound) || ((child.isReporter || child.isBoolean) && !child.hasScript) ? 0 :
        child.isLabel ? 2 + child.height/2 | 0 :
        -2 + child.height/2 | 0
      );
    }
    return 0;
  };

  Block.padding = {
    'hat':        [15, 6, 2],
    'define-hat': [21, 8, 9],
    'reporter':   [3, 8, 1],
    'boolean':    [3, 8, 2],
    'cap':        [6, 6, 2],
    'c-block':    [3, 6, 2],
    'if-block':   [3, 6, 2],
    'ring':       [6, 4, 6],
    null:         [4, 6, 2],
  };

  Block.prototype.draw = function() {
    var isDefine = this.info.shape === 'define-hat';
    var children = this.children;

    var padding = Block.padding[this.info.shape] || Block.padding[null];
    var pt = padding[0],
        px = padding[1],
        pb = padding[2];

    var y = 0;
    var Line = function(y) {
      this.y = y;
      this.width = 0;
      this.height = y ? 13*1.5 : 16*1.5; //block height
      this.children = [];
    };

    var innerWidth = 0;
    var scriptWidth = 0;
    var line = new Line(y);
    function pushLine(isLast) {
      if (lines.length === 0) {
        line.height += pt + pb;
      } else {
        line.height += isLast ? 0 : +2;
        line.y -= 1;
      }
      y += line.height;
      lines.push(line);
    }

    if (this.info.isRTL) {
      var start = 0;
      var flip = function() {
        children = (
          children.slice(0, start).concat(
          children.slice(start, i).reverse())
          .concat(children.slice(i))
        );
      }.bind(this);
      for (var i=0; i<children.length; i++) {
        if (children[i].isScript) {
          flip();
          start = i + 1;
        }
      } if (start < i) {
        flip();
      }
    }

    var lines = [];
    for (var i=0; i<children.length; i++) {
      var child = children[i];
      child.el = child.draw(this);


      if (child.isScript && this.isCommand) {
        this.hasScript = true;
        pushLine();
        child.y = y;
        lines.push(child);
        scriptWidth = Math.max(scriptWidth, Math.max(1, child.width));
        child.height = Math.max(12, child.height) + 3;
        y += child.height;
        line = new Line(y);
      } else if (child.isArrow) {
        line.children.push(child);
      } else {
        var cmw = i > 0 ? 30 : 0; // 27
        var md = this.isCommand ? 0 : this.minDistance(child);
        var mw = this.isCommand ? (child.isBlock || child.isInput ? cmw : 0) : md;
        if (mw && !lines.length && line.width < mw - px) {
          line.width = mw - px;
        }
        child.x = line.width;
        line.width += child.width;
        innerWidth = Math.max(innerWidth, line.width + Math.max(0, md - px));
        line.width += 4;
        if (!child.isLabel) {
          line.height = Math.max(line.height, child.height);
        }
        line.children.push(child);
      }
    }
    pushLine(true);

    innerWidth = Math.max(innerWidth + px * 2,
                          this.isHat || this.hasScript ? 83 :
                          this.isCommand || this.isOutline || this.isRing ? 39 : 20);
    this.height = y;
    this.width = scriptWidth ? Math.max(innerWidth, 15 + scriptWidth) : innerWidth;
    if (isDefine) {
      var p = Math.min(26, 3.5 + 0.13 * innerWidth | 0) - 18;
      this.height += p;
      pt += 2 * p;
    }
    this.firstLine = lines[0];
    this.innerWidth = innerWidth;

    var objects = [];

    for (var i=0; i<lines.length; i++) {
      var line = lines[i];
      if (line.isScript) {
        objects.push(SVG.move(15, line.y, line.el));
        continue;
      }

      var h = line.height;

      for (var j=0; j<line.children.length; j++) {
        var child = line.children[j];
        if (child.isArrow) {
          objects.push(SVG.move(innerWidth - 15, this.height - 3, child.el));
          continue;
        }

        var y = pt + (h - child.height - pt - pb) / 2 - 1;
        if (isDefine && child.isLabel) {
          y += 3;
        } else if (child.isIcon) {
          y += child.dy | 0;
        }
        if (this.isRing) {
          child.y = line.y + y|0;
          if (child.isInset) {
            continue;
          }
        }
        objects.push(SVG.move(px + child.x, line.y + y|0, child.el));
      }
    }

    var el = this.drawSelf(innerWidth, this.height, lines);
    objects.splice(0, 0, el);
    if (this.info.color) {
      setProps(el, {
        fill: this.info.color,
      });
    }

    return SVG.group(objects);
  };


  /* Comment */

  var Comment = function(value, hasBlock) {
    this.label = new Label(value, ['sb-comment-label']);
    this.width = null;
    this.hasBlock = hasBlock;
  };
  Comment.prototype.isComment = true;
  Comment.lineLength = 12;
  Comment.prototype.height = 20;

  Comment.prototype.stringify = function() {
    return "// " + this.label.value;
  };

  Comment.prototype.measure = function() {
    this.label.measure();
  };

  Comment.prototype.draw = function() {
    var labelEl = this.label.draw();

    this.width = this.label.width + 16;
    return SVG.group([
      SVG.commentLine(this.hasBlock ? Comment.lineLength : 0, 6),
      SVG.commentRect(this.width, this.height, {
        class: 'sb-comment',
      }),
      SVG.move(8, 4, labelEl),
    ]);
  };


  /* Script */

  var Script = function(blocks) {
    this.blocks = blocks;
    this.isEmpty = !blocks.length;
    this.isFinal = !this.isEmpty && blocks[blocks.length - 1].isFinal;
    this.y = 0;
  };
  Script.prototype.isScript = true;

  Script.fromJSON = function(lang, blocks) {
    // x = array[0], y = array[1];
    return new Script(blocks.map(Block.fromJSON.bind(null, lang)));
  };

  Script.prototype.toJSON = function() {
    if (this.blocks[0] && this.blocks[0].isComment) return;
    return this.blocks.map(function(block) {
      return block.toJSON();
    });
  };

  Script.prototype.stringify = function() {
    return this.blocks.map(function(block) {
      var line = block.stringify();
      if (block.comment) line += " " + block.comment.stringify();
      return line;
    }).join("\n");
  };

  Script.prototype.translate = function(lang) {
    this.blocks.forEach(function(block) {
      block.translate(lang);
    });
  };

  Script.prototype.measure = function() {
    for (var i=0; i<this.blocks.length; i++) {
      this.blocks[i].measure();
    }
  };

  Script.prototype.draw = function(inside) {
    var children = [];
    var y = 0;
    this.width = 0;
    for (var i=0; i<this.blocks.length; i++) {
      var block = this.blocks[i];
      children.push(SVG.move(inside ? 0 : 2, y, block.draw()));
      y += block.height;
      this.width = Math.max(this.width, block.width);

      var comment = block.comment;
      if (comment) {
        var line = block.firstLine;
        var cx = block.innerWidth + 2 + Comment.lineLength;
        var cy = y - block.height + (line.height / 2);
        var el = comment.draw();
        children.push(SVG.move(cx, cy - comment.height / 2, el));
        this.width = Math.max(this.width, cx + comment.width);
      }
    }
    this.height = y;
    if (!inside && !this.isFinal) {
      this.height += 3;
    }
    return SVG.group(children);
  };


  /* Document */

  var Document = function(scripts) {
    this.scripts = scripts;

    this.width = null;
    this.height = null;
    this.el = null;
    this.defs = null;
  };

  Document.fromJSON = function(scriptable, lang) {
    var lang = lang || english;
    var scripts = scriptable.scripts.map(function(array) {
      var script = Script.fromJSON(lang, array[2]);
      script.x = array[0];
      script.y = array[1];
      return script;
    });
    // TODO scriptable.scriptComments
    return new Document(scripts);
  };

  Document.prototype.toJSON = function() {
    var jsonScripts = this.scripts.map(function(script) {
      var jsonBlocks = script.toJSON();
      if (!jsonBlocks) return;
      return [10, script.y + 10, jsonBlocks];
    }).filter(x => !!x);
    return {
      scripts: jsonScripts,
      // scriptComments: [], // TODO
    };
  };

  Document.prototype.stringify = function() {
    return this.scripts.map(function(script) {
      return script.stringify();
    }).join("\n\n");
  };

  Document.prototype.translate = function(lang) {
    this.scripts.forEach(function(script) {
      script.translate(lang);
    });
  };

  Document.prototype.measure = function() {
    this.scripts.forEach(function(script) {
      script.measure();
    });
  };

  Document.prototype.render = function(cb) {
    // measure strings
    this.measure();

    // TODO: separate layout + render steps.
    // render each script
    var width = 0;
    var height = 0;
    var elements = [];
    for (var i=0; i<this.scripts.length; i++) {
      var script = this.scripts[i];
      if (height) height += 10;
      script.y = height;
      elements.push(SVG.move(0, height, script.draw()));
      height += script.height;
      width = Math.max(width, script.width + 4);
    }
    this.width = width;
    this.height = height;

    // return SVG
    var svg = SVG.newSVG(width, height);
    svg.appendChild(this.defs = SVG.withChildren(SVG.el('defs'), [
        bevelFilter('bevelFilter', false),
        bevelFilter('inputBevelFilter', true),
        darkFilter('inputDarkFilter'),
    ].concat(makeIcons())));

    svg.appendChild(SVG.group(elements));
    this.el = svg;

    // nb: async API only for backwards/forwards compatibility reasons.
    // despite appearances, it runs synchronously
    cb(svg);
  };

  /* Export SVG image as XML string */
  Document.prototype.exportSVGString = function() {
    assert(this.el, "call draw() first");

    var style = makeStyle();
    this.defs.appendChild(style);
    var xml = new SVG.XMLSerializer().serializeToString(this.el);
    this.defs.removeChild(style);
    return xml;
  };

  /* Export SVG image as data URI */
  Document.prototype.exportSVG = function() {
    var xml = this.exportSVGString();
    return 'data:image/svg+xml;utf8,' + xml.replace(
      /[#]/g, encodeURIComponent
    );
  }

  Document.prototype.exportPNG = function(cb) {
    var canvas = SVG.makeCanvas();
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext("2d");

    var image = new Image;
    image.src = this.exportSVG();
    image.onload = function() {
      context.drawImage(image, 0, 0);

      if (URL && URL.createObjectURL && Blob && canvas.toBlob) {
        var blob = canvas.toBlob(function(blob) {
          cb(URL.createObjectURL(blob));
        }, 'image/png');
      } else {
        cb(canvas.toDataURL('image/png'));
      }
    };
  }


  return {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,
  }

}();

},{"./blocks.js":2,"./draw.js":4,"./style.js":8}],8:[function(require,module,exports){
var SVG = require('./draw.js');
var Filter = require('./filter.js');

var Style = module.exports = {
  cssContent: `
    .sb-label {
      font-family: "Helvetica Neue", Helvetica, sans-serif;
      opacity: 0.9;
      fill: #fff;
      font-size: 11px;
      padding: 2px;
      letter-spacing: 0px;
      vertical-align: inherit;
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
      stroke-opacity: 0.2;
      stroke-alignment: inner;
    }

    .sb-input {
      filter2: url(#inputBevelFilter);
      fill: #000;
      fill-opacity: 1;
      stroke: #000;
      stroke-opacity: 0.1;
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
      font-size: 10px;
      letter-spacing: 0px;
      word-spacing: 0;
      text-opacity: 0.9;
    }
    .sb-literal-number,
    .sb-literal-string,
    .sb-literal-number-dropdown {
      fill: #000;
    }

    .sb-darker {
      filter: url(#inputDarkFilter);
    }

    .sb-outline {
      stroke: #fff;
      stroke-opacity: 0;
      stroke-width: 2;
      fill: #FF4D6A;
    }

    .sb-define-hat-cap {
      stroke: #632d99;
      stroke-width: 2;
      fill: #8e2ec200;
      display: none;
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
      letter-spacing: 0px;
    }
  `.replace(/[ \n]+/, ' '),

  makeIcons() {
    return [
      SVG.el('path', {
        d: "M20.6,4.8l-0.1,9.1c0,0,0,0.1,0,0.1c-2.5,2-6.1,2-8.6,0c-1.1-0.9-2.5-1.4-4-1.4c-1.2,0.1-2.3,0.5-3.4,1.1V4 C7,2.6,10,2.9,12.2,4.6c2.4,1.9,5.7,1.9,8.1,0c0.1,0,0.1,0,0.2,0C20.5,4.7,20.6,4.7,20.6,4.8z",
        fill: '#4cbf56',
        stroke: '#45993d',
        id: 'greenFlag',
      }),
      SVG.el('path', {
        d: "M6.724 0C3.01 0 0 2.91 0 6.5c0 2.316 1.253 4.35 3.14 5.5H5.17v-1.256C3.364 10.126 2.07 8.46 2.07 6.5 2.07 4.015 4.152 2 6.723 2c1.14 0 2.184.396 2.993 1.053L8.31 4.13c-.45.344-.398.826.11 1.08L15 8.5 13.858.992c-.083-.547-.514-.714-.963-.37l-1.532 1.172A6.825 6.825 0 0 0 6.723 0z",
        fill: '#fff',
        id: 'turnRight',
      }),
      SVG.el('path', {
        d: "M3.637 1.794A6.825 6.825 0 0 1 8.277 0C11.99 0 15 2.91 15 6.5c0 2.316-1.253 4.35-3.14 5.5H9.83v-1.256c1.808-.618 3.103-2.285 3.103-4.244 0-2.485-2.083-4.5-4.654-4.5-1.14 0-2.184.396-2.993 1.053L6.69 4.13c.45.344.398.826-.11 1.08L0 8.5 1.142.992c.083-.547.514-.714.963-.37l1.532 1.172z",
        fill: '#fff',
        id: 'turnLeft',
      }),
      SVG.el('path', {
        d: "M0 0L4 4L0 8Z",
        fill: '#111',
        id: 'addInput',
      }),
      SVG.el('path', {
        d: "M4 0L4 8L0 4Z",
        fill: '#111',
        id: 'delInput',
      }),
      SVG.setProps(SVG.group([
        SVG.el('path', {
          d: "M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2",
          fill: '#000',
          opacity: '0.3',
        }),
        SVG.move(-1, -1, SVG.el('path', {
          d: "M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2",
          fill: '#fff',
          opacity: '0.9',
        })),
      ]), {
        id: 'loopArrow',
      }),
    ];
  },

  makeStyle() {
    var style = SVG.el('style');
    style.appendChild(SVG.cdata(Style.cssContent));
    return style;
  },

  bevelFilter(id, inset) {
    var f = new Filter(id);

    var alpha = 'SourceAlpha';
    var s = inset ? -1 : 1;
    var blur = f.blur(1, alpha);

    f.merge([
      'SourceGraphic',
      f.comp('in',
           f.flood('#fff', 0.15),
           f.subtract(alpha, f.offset(+s, +s, blur))
      ),
      f.comp('in',
           f.flood('#000', 0.7),
           f.subtract(alpha, f.offset(-s, -s, blur))
      ),
    ]);

    return f.el;
  },

  darkFilter(id) {
    var f = new Filter(id);

    f.merge([
      'SourceGraphic',
      f.comp('in',
        f.flood('#000', 0.2),
        'SourceAlpha'),
    ]);

    return f.el;
  },

  darkRect(w, h, category, el) {
    return SVG.setProps(SVG.group([
      SVG.setProps(el, {
        class: ['sb-'+category, 'sb-darker'].join(' '),
      })
    ]), { width: w, height: h });
  },

  defaultFontFamily: 'Lucida Grande, Verdana, Arial, DejaVu Sans, sans-serif',

};

},{"./draw.js":4,"./filter.js":5}],9:[function(require,module,exports){
module.exports = function() {

  function extend(src, dest) { return Object.assign({}, dest, src); }
  function isArray(o) { return o && o.constructor === Array; }
  function assert(bool, message) { if (!bool) throw "Assertion failed! " + (message || ""); }

  var {
    Label,
    Icon,
    Input,
    Block,
    Comment,
    Script,
    Document,
  } = require('./model.js');

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
  } = require('./blocks.js');


  function paintBlock(info, children, languages) {
    var overrides = [];
    if (isArray(children[children.length - 1])) {
      overrides = children.pop();
    }

    // build hash
    var words = [];
    for (var i=0; i<children.length; i++) {
      var child = children[i];
      if (child.isLabel) {
        words.push(child.value);
      } else if (child.isIcon) {
        words.push("@" + child.name);
      } else {
        words.push("_");
      }
    }
    var hash = info.hash = minifyHash(words.join(" "));

    // paint
    var o = lookupHash(hash, info, children, languages);
    if (o) {
      var lang = o.lang;
      var type = o.type;
      info.language = lang;
      info.isRTL = rtlLanguages.indexOf(lang.code) > -1;

      if (type.shape === 'ring' ? info.shape === 'reporter' : info.shape === 'stack') {
        info.shape = type.shape;
      }
      info.category = type.category;
      info.categoryIsDefault = false;
      if (type.selector) info.selector = type.selector; // for toJSON
      info.hasLoopArrow = type.hasLoopArrow;

      // ellipsis block
      if (type.spec === ". . .") {
        children = [new Label(". . .")];
      }
    }

    // overrides
    applyOverrides(info, overrides);

    // loop arrows
    if (info.hasLoopArrow) {
      children.push(new Icon('loopArrow'));
    }

    var block = new Block(info, children);

    // image replacement
    if (type && iconPat.test(type.spec)) {
      block.translate(lang, true);
    }
    return block;
  }




  function parseLines(code, languages) {
    var tok = code[0];
    var index = 0;
    function next() {
      tok = code[++index];
    }
    function peek() {
      return code[index + 1];
    }
    function peekNonWs() {
      for (var i = index + 1; i<code.length; i++) {
        if (code[i] !== ' ') return code[i];
      }
    }
    var sawNL;

    var define = [];
    languages.map(function(lang) {
      define = define.concat(lang.define);
    });
    // NB. we assume 'define' is a single word in every language
    function isDefine(word) {
      return define.indexOf(word) > -1;
    }

    function makeBlock(shape, children) {
      var hasInputs = !!children.filter(function(x) { return !x.isLabel }).length;
      var info = {
        shape: shape,
        category: shape === 'define-hat' ? 'custom'
                : shape === 'reporter' && !hasInputs ? 'variables' : 'obsolete',
        categoryIsDefault: true,
        hasLoopArrow: false,
      };
      return paintBlock(info, children, languages);
    }

    function makeMenu(shape, value) {
      var menu = lookupDropdown(value, languages) || value;
      return new Input(shape, value, menu);
    }

    function pParts(end) {
      var children = [];
      var label;
      while (tok && tok !== '\n') {
        if (tok === '<' || (tok === '>' && end === '>')) {
          var last = children[children.length - 1];
          var c = peekNonWs();
          if (last && !last.isLabel && (c === '[' || c === '(' || c === '<' || c === '{')) {
            label = null;
            children.push(new Label(tok));
            next();
            continue;
          }
        }
        if (tok === end) break;
        if (tok === '/' && peek() === '/' && !end) break;

        switch (tok) {
          case '[':
            label = null;
            children.push(pString());
            break;
          case '(':
            label = null;
            children.push(pReporter());
            break;
          case '<':
            label = null;
            children.push(pPredicate());
            break;
          case '{':
            label = null;
            children.push(pEmbedded());
            break;
          case ' ':
          case '\t':
            next();
            if (label && isDefine(label.value)) {
              // define hat
              children.push(pOutline());
              return children;
            }
            label = null;
            break;
          case '◂':
          case '▸':
            children.push(pIcon());
            label = null;
            break;
          case '@':
            next();
            var name = "";
            while (tok && /[a-zA-Z]/.test(tok)) {
              name += tok;
              next();
            }
            if (name === 'cloud') {
              children.push(new Label("☁"));
            } else {
              children.push(Icon.icons.hasOwnProperty(name) ? new Icon(name) : new Label("@" + name));
            }
            label = null;
            break;
          case '\\':
            next(); // escape character
            // fall-thru
          case ':':
            if (tok === ':' && peek() === ':') {
              children.push(pOverrides(end));
              return children;
            } // fall-thru
          default:
            if (!label) children.push(label = new Label(""));
            label.value += tok;
            next();
        }
      }
      return children;
    }

    function pString() {
      next(); // '['
      var s = "";
      var escapeV = false;
      while (tok && tok !== ']' && tok !== '\n') {
        if (tok === '\\') {
          next();
          if (tok === 'v') escapeV = true;
          if (!tok) break;
        } else {
          escapeV = false;
        }
        s += tok;
        next();
      }
      if (tok === ']') next();
      if (hexColorPat.test(s)) {
        return new Input('color', s);
      }
      return !escapeV && / v$/.test(s) ? makeMenu('dropdown', s.slice(0, s.length - 2))
                                       : new Input('string', s);
    }

    function pBlock(end) {
      var children = pParts(end);
      if (tok && tok === '\n') {
        sawNL = true;
        next();
      }
      if (children.length === 0) return;

      // define hats
      var first = children[0];
      if (first && first.isLabel && isDefine(first.value)) {
        if (children.length < 2) {
          children.push(makeBlock('outline', []));
        }
        return makeBlock('define-hat', children);
      }

      // standalone reporters
      if (children.length === 1) {
        var child = children[0];
        if (child.isBlock && (child.isReporter || child.isBoolean || child.isRing)) {
          return child;
        }
      }

      return makeBlock('stack', children);
    }

    function pReporter() {
      next(); // '('

      // empty number-dropdown
      if (tok === ' ') {
        next();
        if (tok === 'v' && peek() === ')') {
          next();
          next();
          return new Input('number-dropdown', "");
        }
      }

      var children = pParts(')');
      if (tok && tok === ')') next();

      // empty numbers
      if (children.length === 0) {
        return new Input('number', "");
      }

      // number
      if (children.length === 1 && children[0].isLabel) {
        var value = children[0].value;
        if (/^[0-9e.-]*$/.test(value)) {
          return new Input('number', value);
        }
      }

      // number-dropdown
      for (var i=0; i<children.length; i++) {
        if (!children[i].isLabel) {
          break;
        }
      } if (i === children.length) {
        var last = children[i - 1];
        if (i > 1 && last.value === 'v') {
          children.pop();
          var value = children.map(function(l) { return l.value; }).join(" ");
          return makeMenu('number-dropdown', value);
        }
      }

      var block = makeBlock('reporter', children);

      // rings
      if (block.info.shape === 'ring') {
        var first = block.children[0];
        if (first && first.isInput && first.shape === 'number' && first.value === "") {
          block.children[0] = new Input('reporter');
        } else if ((first && first.isScript && first.isEmpty)
                || (first && first.isBlock && !first.children.length)) {
          block.children[0] = new Input('stack');
        }
      }

      return block;
    }

    function pPredicate() {
      next(); // '<'
      var children = pParts('>');
      if (tok && tok === '>') next();
      if (children.length === 0) {
        return new Input('boolean');
      }
      return makeBlock('boolean', children);
    }

    function pEmbedded() {
      next(); // '{'

      sawNL = false;
      var f = function() {
        while (tok && tok !== '}') {
          var block = pBlock('}');
          if (block) return block;
        }
      };
      var scripts = parseScripts(f);
      var blocks = [];
      scripts.forEach(function(script) {
        blocks = blocks.concat(script.blocks);
      });

      if (tok === '}') next();
      if (!sawNL) {
        assert(blocks.length <= 1);
        return blocks.length ? blocks[0] : makeBlock('stack', []);
      }
      return new Script(blocks);
    }

    function pIcon() {
      var c = tok;
      next();
      switch (c) {
        case '▸':
          return new Icon('addInput');
        case '◂':
          return new Icon('delInput');
      }
    }

    function pOverrides(end) {
      next();
      next();
      var overrides = [];
      var override = "";
      while (tok && tok !== '\n' && tok !== end) {
        if (tok === ' ') {
          if (override) {
            overrides.push(override);
            override = "";
          }
        } else if (tok === '/' && peek() === '/') {
          break;
        } else {
          override += tok;
        }
        next();
      }
      if (override) overrides.push(override);
      return overrides;
    }

    function pComment(end) {
      next();
      next();
      var comment = "";
      while (tok && tok !== '\n' && tok !== end) {
        comment += tok;
        next();
      }
      if (tok && tok === '\n') next();
      return new Comment(comment, true);
    }

    function pOutline() {
      var children = [];
      function parseArg(kind, end) {
        label = null;
        next();
        var parts = pParts(end);
        if (tok === end) next();
        children.push(paintBlock({
          shape: kind === 'boolean' ? 'boolean' : 'reporter',
          argument: kind,
          category: 'custom-arg',
        }, parts, languages));
      }
      var label;
      while (tok && tok !== '\n') {
        if (tok === '/' && peek() === '/') {
          break;
        }
        switch (tok) {
          case '(': parseArg('number', ')'); break;
          case '[': parseArg('string', ']'); break;
          case '<': parseArg('boolean', '>'); break;
          case ' ': next(); label = null; break;
          case '\\':
            next();
            // fall-thru
          case ':':
            if (tok === ':' && peek() === ':') {
              children.push(pOverrides());
              break;
            } // fall-thru
          default:
            if (!label) children.push(label = new Label(""));
            label.value += tok;
            next();
        }
      }
      return makeBlock('outline', children);
    }

    function pLine() {
      var block = pBlock();
      if (tok === '/' && peek() === '/') {
        var comment = pComment();
        comment.hasBlock = block && block.children.length;
        if (!comment.hasBlock) {
          return comment;
        }
        block.comment = comment;
      }
      return block;
    }

    return function() {
      if (!tok) return undefined;
      var line = pLine();
      return line || 'NL';
    }
  }

  /* * */

  function parseScripts(getLine) {
    var line = getLine();
    function next() {
      line = getLine();
    }

    function pFile() {
      while (line === 'NL') next();
      var scripts = [];
      while (line) {
        var blocks = [];
        while (line && line !== 'NL') {
          var b = pLine();

          if (b.isElse || b.isEnd) {
            b = new Block(extend(b.info, {
              shape: 'stack',
            }), b.children);
          }

          if (b.isHat) {
            if (blocks.length) scripts.push(new Script(blocks));
            blocks = [b];
          } else if (b.isFinal) {
            blocks.push(b);
            break;
          } else if (b.isCommand) {
            blocks.push(b);
          } else { // reporter or predicate
            if (blocks.length) scripts.push(new Script(blocks));
            scripts.push(new Script([b]));
            blocks = [];
            break;
          }
        }
        if (blocks.length) scripts.push(new Script(blocks));
        while (line === 'NL') next();
      }
      return scripts;
    }

    function pLine() {
      var b = line;
      next();

      if (b.hasScript) {
        while (true) {
          var blocks = pMouth();
          b.children.push(new Script(blocks));
          if (line && line.isElse) {
            for (var i=0; i<line.children.length; i++) {
              b.children.push(line.children[i]);
            }
            next();
            continue;
          }
          if (line && line.isEnd) {
            next();
          }
          break;
        }
      }
      return b;
    }

    function pMouth() {
      var blocks = [];
      while (line) {
        if (line === 'NL') {
          next();
          continue;
        }
        if (!line.isCommand) {
          return blocks;
        }
        blocks.push(pLine());
      }
      return blocks;
    }

    return pFile();
  }

  /* * */

  function eachBlock(x, cb) {
    if (x.isScript) {
      x.blocks.forEach(function(block) {
        eachBlock(block, cb);
      });
    } else if (x.isBlock) {
      cb(x);
      x.children.forEach(function(child) {
        eachBlock(child, cb);
      });
    }
  }

  var listBlocks = {
    "append:toList:": 1,
    "deleteLine:ofList:": 1,
    "insert:at:ofList:": 2,
    "setLine:ofList:to:": 1,
    "showList:": 0,
    "hideList:": 0,
  };

  function recogniseStuff(scripts) {

    var customBlocksByHash = {};
    var listNames = {};

    scripts.forEach(function(script) {

      var customArgs = {};

      eachBlock(script, function(block) {
        // custom blocks
        if (block.info.shape === 'define-hat') {
          var outline = block.children[1];
          if (!outline) return;

          var names = [];
          var parts = [];
          for (var i=0; i<outline.children.length; i++) {
            var child = outline.children[i];
            if (child.isLabel) {
              parts.push(child.value);
            } else if (child.isBlock) {
              if (!child.info.argument) return;
              parts.push({
                number: "%n",
                string: "%s",
                boolean: "%b",
              }[child.info.argument]);

              var name = blockName(child);
              names.push(name);
              customArgs[name] = true;
            }
          }
          var spec = parts.join(" ");
          var hash = hashSpec(spec);
          var info = customBlocksByHash[hash] = {
            spec: spec,
            names: names,
          };
          block.info.selector = 'procDef';
          block.info.call = info.spec;
          block.info.names = info.names;
          block.info.category = 'custom';

        // fix up if/else selectors
        } else if (block.info.selector === 'doIfElse') {
          var last2 = block.children[block.children.length - 2];
          block.info.selector = last2 && last2.isLabel && last2.value === 'else' ? 'doIfElse' : 'doIf';

        // custom arguments
        } else if (block.info.categoryIsDefault && (block.isReporter || block.isBoolean)) {
          var name = blockName(block);
          if (customArgs[name]) {
            block.info.category = 'custom-arg';
            block.info.categoryIsDefault = false;
            block.info.selector = 'getParam';
          }

        // list names
        } else if (listBlocks.hasOwnProperty(block.info.selector)) {
          var argIndex = listBlocks[block.info.selector];
          var inputs = block.children.filter(function(child) {
            return !child.isLabel;
          });
          var input = inputs[argIndex];
          if (input && input.isInput) {
            listNames[input.value] = true;
          }
        }
      });
    });

    scripts.forEach(function(script) {
      eachBlock(script, function(block) {
        // custom blocks
        if (block.info.categoryIsDefault && block.info.category === 'obsolete') {
          var info = customBlocksByHash[block.info.hash];
          if (info) {
            block.info.selector = 'call';
            block.info.call = info.spec;
            block.info.names = info.names;
            block.info.category = 'custom';
          }

        // list reporters
        } else if (block.isReporter) {
          var name = blockName(block);
          if (!name) return;
          if (block.info.category === 'variables' && listNames[name] && block.info.categoryIsDefault) {
            block.info.category = 'list';
            block.info.categoryIsDefault = false;
          }
          if (block.info.category === 'list') {
            block.info.selector = 'contentsOfList:';
          } else if (block.info.category === 'variables') {
            block.info.selector = 'readVariable';
          }
        }
      });
    });
  }

  function parse(code, options) {
    var options = extend({
      inline: false,
      languages: ['en'],
    }, options);

    code = code.replace(/&lt;/g, '<');
    code = code.replace(/&gt;/g, '>');
    if (options.inline) {
      code = code.replace(/\n/g, ' ');
    }

    var languages = options.languages.map(function(code) {
      return allLanguages[code];
    });

    /* * */

    var f = parseLines(code, languages);
    var scripts = parseScripts(f);
    recogniseStuff(scripts);
    return new Document(scripts);
  }


  return {
    parse: parse,
  };

}();

},{"./blocks.js":2,"./model.js":7}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwibGliL2Jsb2Nrcy5qcyIsImxpYi9jb21tYW5kcy5qcyIsImxpYi9kcmF3LmpzIiwibGliL2ZpbHRlci5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tb2RlbC5qcyIsImxpYi9zdHlsZS5qcyIsImxpYi9zeW50YXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbmZ1bmN0aW9uIG1ha2VDYW52YXMoKSB7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbn1cblxudmFyIHNjcmF0Y2hibG9ja3MgPSB3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvJykod2luZG93LCBtYWtlQ2FudmFzKTtcblxuLy8gYWRkIG91ciBDU1MgdG8gdGhlIHBhZ2VcbnZhciBzdHlsZSA9IHNjcmF0Y2hibG9ja3MubWFrZVN0eWxlKCk7XG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkgeyBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKTsgfVxuICBmdW5jdGlvbiBpc0FycmF5KG8pIHsgcmV0dXJuIG8gJiYgby5jb25zdHJ1Y3RvciA9PT0gQXJyYXk7IH1cbiAgZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkgeyByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKTsgfVxuXG5cbiAgLy8gTGlzdCBvZiBjbGFzc2VzIHdlJ3JlIGFsbG93ZWQgdG8gb3ZlcnJpZGUuXG5cbiAgdmFyIG92ZXJyaWRlQ2F0ZWdvcmllcyA9IFtcIm1vdGlvblwiLCBcImxvb2tzXCIsIFwic291bmRcIiwgXCJwZW5cIiwgXCJ2YXJpYWJsZXNcIiwgXCJsaXN0XCIsIFwiZXZlbnRzXCIsIFwiY29udHJvbFwiLCBcInNlbnNpbmdcIiwgXCJvcGVyYXRvcnNcIiwgXCJjdXN0b21cIiwgXCJjdXN0b20tYXJnXCIsIFwiZXh0ZW5zaW9uXCIsIFwiZ3JleVwiLCBcIm9ic29sZXRlXCJdO1xuICB2YXIgb3ZlcnJpZGVTaGFwZXMgPSBbXCJoYXRcIiwgXCJjYXBcIiwgXCJzdGFja1wiLCBcImJvb2xlYW5cIiwgXCJyZXBvcnRlclwiLCBcInJpbmdcIl07XG5cbiAgLy8gbGFuZ3VhZ2VzIHRoYXQgc2hvdWxkIGJlIGRpc3BsYXllZCByaWdodCB0byBsZWZ0XG4gIHZhciBydGxMYW5ndWFnZXMgPSBbJ2FyJywgJ2ZhJywgJ2hlJ107XG5cbiAgLy8gTGlzdCBvZiBjb21tYW5kcyB0YWtlbiBmcm9tIFNjcmF0Y2hcbiAgdmFyIHNjcmF0Y2hDb21tYW5kcyA9IHJlcXVpcmUoJy4vY29tbWFuZHMuanMnKTtcblxuICB2YXIgY2F0ZWdvcmllc0J5SWQgPSB7XG4gICAgMDogIFwib2Jzb2xldGVcIixcbiAgICAxOiAgXCJtb3Rpb25cIixcbiAgICAyOiAgXCJsb29rc1wiLFxuICAgIDM6ICBcInNvdW5kXCIsXG4gICAgNDogIFwicGVuXCIsXG4gICAgNTogIFwiZXZlbnRzXCIsXG4gICAgNjogIFwiY29udHJvbFwiLFxuICAgIDc6ICBcInNlbnNpbmdcIixcbiAgICA4OiAgXCJvcGVyYXRvcnNcIixcbiAgICA5OiAgXCJ2YXJpYWJsZXNcIixcbiAgICAxMDogXCJjdXN0b21cIixcbiAgICAxMTogXCJwYXJhbWV0ZXJcIixcbiAgICAxMjogXCJsaXN0XCIsXG4gICAgMjA6IFwiZXh0ZW5zaW9uXCIsXG4gICAgNDI6IFwiZ3JleVwiLFxuICB9O1xuXG4gIHZhciB0eXBlU2hhcGVzID0ge1xuICAgICcgJzogJ3N0YWNrJyxcbiAgICAnYic6ICdib29sZWFuJyxcbiAgICAnYyc6ICdjLWJsb2NrJyxcbiAgICAnZSc6ICdpZi1ibG9jaycsXG4gICAgJ2YnOiAnY2FwJyxcbiAgICAnaCc6ICdoYXQnLFxuICAgICdyJzogJ3JlcG9ydGVyJyxcbiAgICAnY2YnOiAnYy1ibG9jayBjYXAnLFxuICAgICdlbHNlJzogJ2NlbHNlJyxcbiAgICAnZW5kJzogJ2NlbmQnLFxuICAgICdyaW5nJzogJ3JpbmcnLFxuICB9O1xuXG4gIHZhciBpbnB1dFBhdCA9IC8oJVthLXpBLVpdKD86XFwuW2EtekEtWjAtOV0rKT8pLztcbiAgdmFyIGlucHV0UGF0R2xvYmFsID0gbmV3IFJlZ0V4cChpbnB1dFBhdC5zb3VyY2UsICdnJyk7XG4gIHZhciBpY29uUGF0ID0gLyhAW2EtekEtWl0rKS87XG4gIHZhciBzcGxpdFBhdCA9IG5ldyBSZWdFeHAoW2lucHV0UGF0LnNvdXJjZSwgJ3wnLCBpY29uUGF0LnNvdXJjZSwgJ3wgKyddLmpvaW4oJycpLCAnZycpO1xuXG4gIHZhciBoZXhDb2xvclBhdCA9IC9eIyg/OlswLTlhLWZBLUZdezN9KXsxLDJ9PyQvO1xuXG4gIGZ1bmN0aW9uIHBhcnNlU3BlYyhzcGVjKSB7XG4gICAgdmFyIHBhcnRzID0gc3BlYy5zcGxpdChzcGxpdFBhdCkuZmlsdGVyKHggPT4gISF4KTtcbiAgICByZXR1cm4ge1xuICAgICAgc3BlYzogc3BlYyxcbiAgICAgIHBhcnRzOiBwYXJ0cyxcbiAgICAgIGlucHV0czogcGFydHMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuIGlucHV0UGF0LnRlc3QocCk7IH0pLFxuICAgICAgaGFzaDogaGFzaFNwZWMoc3BlYyksXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc2hTcGVjKHNwZWMpIHtcbiAgICByZXR1cm4gbWluaWZ5SGFzaChzcGVjLnJlcGxhY2UoaW5wdXRQYXRHbG9iYWwsIFwiIF8gXCIpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1pbmlmeUhhc2goaGFzaCkge1xuICAgIHJldHVybiAoaGFzaFxuICAgICAgICAucmVwbGFjZSgvXy9nLCAnIF8gJylcbiAgICAgICAgLnJlcGxhY2UoLyArL2csICcgJylcbiAgICAgICAgLnJlcGxhY2UoL1ssJT86XS9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL8OfL2csICdzcycpXG4gICAgICAgIC5yZXBsYWNlKC/DpC9nLFwiYVwiKVxuICAgICAgICAucmVwbGFjZSgvw7YvZyxcIm9cIilcbiAgICAgICAgLnJlcGxhY2UoL8O8L2csXCJ1XCIpXG4gICAgICAgIC5yZXBsYWNlKCcuIC4gLicsICcuLi4nKVxuICAgICAgICAucmVwbGFjZSgvXuKApiQvLCAnLi4uJylcbiAgICApLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICB9XG5cbiAgdmFyIGJsb2Nrc0J5U2VsZWN0b3IgPSB7fTtcbiAgdmFyIGJsb2Nrc0J5U3BlYyA9IHt9O1xuICB2YXIgYWxsQmxvY2tzID0gc2NyYXRjaENvbW1hbmRzLm1hcChmdW5jdGlvbihjb21tYW5kKSB7XG4gICAgdmFyIGluZm8gPSBleHRlbmQocGFyc2VTcGVjKGNvbW1hbmRbMF0pLCB7XG4gICAgICBzaGFwZTogdHlwZVNoYXBlc1tjb21tYW5kWzFdXSwgLy8gL1sgYmNlZmhyXXxjZi9cbiAgICAgIGNhdGVnb3J5OiBjYXRlZ29yaWVzQnlJZFtjb21tYW5kWzJdICUgMTAwXSxcbiAgICAgIHNlbGVjdG9yOiBjb21tYW5kWzNdLFxuICAgICAgaGFzTG9vcEFycm93OiBbJ2RvUmVwZWF0JywgJ2RvVW50aWwnLCAnZG9Gb3JldmVyJ10uaW5kZXhPZihjb21tYW5kWzNdKSA+IC0xLFxuICAgIH0pO1xuICAgIGlmIChpbmZvLnNlbGVjdG9yKSB7XG4gICAgICAvLyBuYi4gY29tbWFuZCBvcmRlciBtYXR0ZXJzIVxuICAgICAgLy8gU2NyYXRjaCAxLjQgYmxvY2tzIGFyZSBsaXN0ZWQgbGFzdFxuICAgICAgaWYoIWJsb2Nrc0J5U2VsZWN0b3JbaW5mby5zZWxlY3Rvcl0pIGJsb2Nrc0J5U2VsZWN0b3JbaW5mby5zZWxlY3Rvcl0gPSBpbmZvO1xuICAgIH1cbiAgICByZXR1cm4gYmxvY2tzQnlTcGVjW2luZm8uc3BlY10gPSBpbmZvO1xuICB9KTtcblxuICB2YXIgdW5pY29kZUljb25zID0ge1xuICAgIFwiQGdyZWVuRmxhZ1wiOiBcIuKakVwiLFxuICAgIFwiQHR1cm5SaWdodFwiOiBcIuKGu1wiLFxuICAgIFwiQHR1cm5MZWZ0XCI6IFwi4oa6XCIsXG4gICAgXCJAYWRkSW5wdXRcIjogXCLilrhcIixcbiAgICBcIkBkZWxJbnB1dFwiOiBcIuKXglwiLFxuICB9O1xuXG4gIHZhciBhbGxMYW5ndWFnZXMgPSB7fTtcbiAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGNvZGUsIGxhbmd1YWdlKSB7XG4gICAgdmFyIGJsb2Nrc0J5SGFzaCA9IGxhbmd1YWdlLmJsb2Nrc0J5SGFzaCA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuY29tbWFuZHMpLmZvckVhY2goZnVuY3Rpb24oc3BlYykge1xuICAgICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5ndWFnZS5jb21tYW5kc1tzcGVjXTtcbiAgICAgIHZhciBibG9jayA9IGJsb2Nrc0J5U3BlY1tzcGVjXTtcblxuICAgICAgdmFyIG5hdGl2ZUhhc2ggPSBoYXNoU3BlYyhuYXRpdmVTcGVjKTtcbiAgICAgIGJsb2Nrc0J5SGFzaFtuYXRpdmVIYXNoXSA9IGJsb2NrO1xuXG4gICAgICAvLyBmYWxsYmFjayBpbWFnZSByZXBsYWNlbWVudCwgZm9yIGxhbmd1YWdlcyB3aXRob3V0IGFsaWFzZXNcbiAgICAgIHZhciBtID0gaWNvblBhdC5leGVjKHNwZWMpO1xuICAgICAgaWYgKG0pIHtcbiAgICAgICAgdmFyIGltYWdlID0gbVswXTtcbiAgICAgICAgdmFyIGhhc2ggPSBuYXRpdmVIYXNoLnJlcGxhY2UoaW1hZ2UsIHVuaWNvZGVJY29uc1tpbWFnZV0pO1xuICAgICAgICBibG9ja3NCeUhhc2hbaGFzaF0gPSBibG9jaztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGxhbmd1YWdlLm5hdGl2ZUFsaWFzZXMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhsYW5ndWFnZS5hbGlhc2VzKS5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICB2YXIgc3BlYyA9IGxhbmd1YWdlLmFsaWFzZXNbYWxpYXNdO1xuICAgICAgdmFyIGJsb2NrID0gYmxvY2tzQnlTcGVjW3NwZWNdO1xuXG4gICAgICB2YXIgYWxpYXNIYXNoID0gaGFzaFNwZWMoYWxpYXMpO1xuICAgICAgYmxvY2tzQnlIYXNoW2FsaWFzSGFzaF0gPSBibG9jaztcblxuICAgICAgbGFuZ3VhZ2UubmF0aXZlQWxpYXNlc1tzcGVjXSA9IGFsaWFzO1xuICAgIH0pO1xuXG4gICAgbGFuZ3VhZ2UubmF0aXZlRHJvcGRvd25zID0ge307XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2UuZHJvcGRvd25zKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBuYXRpdmVOYW1lID0gbGFuZ3VhZ2UuZHJvcGRvd25zW25hbWVdO1xuICAgICAgbGFuZ3VhZ2UubmF0aXZlRHJvcGRvd25zW25hdGl2ZU5hbWVdID0gbmFtZTtcbiAgICB9KTtcblxuICAgIGxhbmd1YWdlLmNvZGUgPSBjb2RlO1xuICAgIGFsbExhbmd1YWdlc1tjb2RlXSA9IGxhbmd1YWdlO1xuICB9XG4gIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZXMobGFuZ3VhZ2VzKSB7XG4gICAgT2JqZWN0LmtleXMobGFuZ3VhZ2VzKS5mb3JFYWNoKGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgIGxvYWRMYW5ndWFnZShjb2RlLCBsYW5ndWFnZXNbY29kZV0pO1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIGVuZ2xpc2ggPSB7XG4gICAgYWxpYXNlczoge1xuICAgICAgXCJ0dXJuIGxlZnQgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjY3cgJW4gZGVncmVlc1wiOiBcInR1cm4gQHR1cm5MZWZ0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiByaWdodCAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwidHVybiBjdyAlbiBkZWdyZWVzXCI6IFwidHVybiBAdHVyblJpZ2h0ICVuIGRlZ3JlZXNcIixcbiAgICAgIFwid2hlbiBnZiBjbGlja2VkXCI6IFwid2hlbiBAZ3JlZW5GbGFnIGNsaWNrZWRcIixcbiAgICAgIFwid2hlbiBmbGFnIGNsaWNrZWRcIjogXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLFxuICAgICAgXCJ3aGVuIGdyZWVuIGZsYWcgY2xpY2tlZFwiOiBcIndoZW4gQGdyZWVuRmxhZyBjbGlja2VkXCIsXG4gICAgfSxcblxuICAgIGRlZmluZTogW1wiZGVmaW5lXCJdLFxuXG4gICAgLy8gRm9yIGlnbm9yaW5nIHRoZSBsdCBzaWduIGluIHRoZSBcIndoZW4gZGlzdGFuY2UgPCBfXCIgYmxvY2tcbiAgICBpZ25vcmVsdDogW1wid2hlbiBkaXN0YW5jZVwiXSxcblxuICAgIC8vIFZhbGlkIGFyZ3VtZW50cyB0byBcIm9mXCIgZHJvcGRvd24sIGZvciByZXNvbHZpbmcgYW1iaWd1b3VzIHNpdHVhdGlvbnNcbiAgICBtYXRoOiBbXCJhYnNcIiwgXCJmbG9vclwiLCBcImNlaWxpbmdcIiwgXCJzcXJ0XCIsIFwic2luXCIsIFwiY29zXCIsIFwidGFuXCIsIFwiYXNpblwiLCBcImFjb3NcIiwgXCJhdGFuXCIsIFwibG5cIiwgXCJsb2dcIiwgXCJlIF5cIiwgXCIxMCBeXCJdLFxuXG4gICAgLy8gRm9yIGRldGVjdGluZyB0aGUgXCJzdG9wXCIgY2FwIC8gc3RhY2sgYmxvY2tcbiAgICBvc2lzOiBbXCJvdGhlciBzY3JpcHRzIGluIHNwcml0ZVwiLCBcIm90aGVyIHNjcmlwdHMgaW4gc3RhZ2VcIl0sXG5cbiAgICBkcm9wZG93bnM6IHt9LFxuXG4gICAgY29tbWFuZHM6IHt9LFxuICB9O1xuICBhbGxCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpbmZvKSB7XG4gICAgZW5nbGlzaC5jb21tYW5kc1tpbmZvLnNwZWNdID0gaW5mby5zcGVjO1xuICB9KSxcbiAgbG9hZExhbmd1YWdlcyh7XG4gICAgZW46IGVuZ2xpc2gsXG4gIH0pO1xuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICBmdW5jdGlvbiBkaXNhbWJpZyhzZWxlY3RvcjEsIHNlbGVjdG9yMiwgdGVzdCkge1xuICAgIHZhciBmdW5jID0gZnVuY3Rpb24oaW5mbywgY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAgIHJldHVybiBibG9ja3NCeVNlbGVjdG9yW3Rlc3QoY2hpbGRyZW4sIGxhbmcpID8gc2VsZWN0b3IxIDogc2VsZWN0b3IyXTtcbiAgICB9O1xuICAgIGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3IxXS5zcGVjaWFsQ2FzZSA9IGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3IyXS5zcGVjaWFsQ2FzZSA9IGZ1bmM7XG4gIH1cblxuICBkaXNhbWJpZygnY29tcHV0ZUZ1bmN0aW9uOm9mOicsICdnZXRBdHRyaWJ1dGU6b2Y6JywgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBPcGVyYXRvcnMgaWYgbWF0aCBmdW5jdGlvbiwgb3RoZXJ3aXNlIHNlbnNpbmcgXCJhdHRyaWJ1dGUgb2ZcIiBibG9ja1xuICAgIHZhciBmaXJzdCA9IGNoaWxkcmVuWzBdO1xuICAgIGlmICghZmlyc3QuaXNJbnB1dCkgcmV0dXJuO1xuICAgIHZhciBuYW1lID0gZmlyc3QudmFsdWU7XG4gICAgcmV0dXJuIGxhbmcubWF0aC5pbmRleE9mKG5hbWUpID4gLTE7XG4gIH0pO1xuXG4gIGRpc2FtYmlnKCdsaW5lQ291bnRPZkxpc3Q6JywgJ3N0cmluZ0xlbmd0aDonLCBmdW5jdGlvbihjaGlsZHJlbiwgbGFuZykge1xuICAgIC8vIExpc3QgYmxvY2sgaWYgZHJvcGRvd24sIG90aGVyd2lzZSBvcGVyYXRvcnNcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdO1xuICAgIGlmICghbGFzdC5pc0lucHV0KSByZXR1cm47XG4gICAgcmV0dXJuIGxhc3Quc2hhcGUgPT09ICdkcm9wZG93bic7XG4gIH0pO1xuXG4gIGRpc2FtYmlnKCdwZW5Db2xvcjonLCAnc2V0UGVuSHVlVG86JywgZnVuY3Rpb24oY2hpbGRyZW4sIGxhbmcpIHtcbiAgICAvLyBDb2xvciBibG9jayBpZiBjb2xvciBpbnB1dCwgb3RoZXJ3aXNlIG51bWVyaWNcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdO1xuICAgIC8vIElmIHZhcmlhYmxlLCBhc3N1bWUgY29sb3IgaW5wdXQsIHNpbmNlIHRoZSBSR0JBIGhhY2sgaXMgY29tbW9uLlxuICAgIC8vIFRPRE8gZml4IFNjcmF0Y2ggOlBcbiAgICByZXR1cm4gKGxhc3QuaXNJbnB1dCAmJiBsYXN0LmlzQ29sb3IpIHx8IGxhc3QuaXNCbG9jaztcbiAgfSk7XG5cbiAgYmxvY2tzQnlTZWxlY3Rvclsnc3RvcFNjcmlwdHMnXS5zcGVjaWFsQ2FzZSA9IGZ1bmN0aW9uKGluZm8sIGNoaWxkcmVuLCBsYW5nKSB7XG4gICAgLy8gQ2FwIGJsb2NrIHVubGVzcyBhcmd1bWVudCBpcyBcIm90aGVyIHNjcmlwdHMgaW4gc3ByaXRlXCJcbiAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdO1xuICAgIGlmICghbGFzdC5pc0lucHV0KSByZXR1cm47XG4gICAgdmFyIHZhbHVlID0gbGFzdC52YWx1ZTtcbiAgICBpZiAobGFuZy5vc2lzLmluZGV4T2YodmFsdWUpID4gLTEpIHtcbiAgICAgIHJldHVybiBleHRlbmQoYmxvY2tzQnlTZWxlY3Rvclsnc3RvcFNjcmlwdHMnXSwge1xuICAgICAgICBzaGFwZTogJ3N0YWNrJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gbG9va3VwSGFzaChoYXNoLCBpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKSB7XG4gICAgZm9yICh2YXIgaT0wOyBpPGxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxhbmcgPSBsYW5ndWFnZXNbaV07XG4gICAgICBpZiAobGFuZy5ibG9ja3NCeUhhc2guaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgdmFyIGJsb2NrID0gbGFuZy5ibG9ja3NCeUhhc2hbaGFzaF07XG4gICAgICAgIGlmIChpbmZvLnNoYXBlID09PSAncmVwb3J0ZXInICYmIGJsb2NrLnNoYXBlICE9PSAncmVwb3J0ZXInKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGluZm8uc2hhcGUgPT09ICdib29sZWFuJyAmJiBibG9jay5zaGFwZSAhPT0gJ2Jvb2xlYW4nKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGJsb2NrLnNwZWNpYWxDYXNlKSB7XG4gICAgICAgICAgYmxvY2sgPSBibG9jay5zcGVjaWFsQ2FzZShpbmZvLCBjaGlsZHJlbiwgbGFuZykgfHwgYmxvY2s7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogYmxvY2ssIGxhbmc6IGxhbmcgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBEcm9wZG93bihuYW1lLCBsYW5ndWFnZXMpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8bGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGFuZyA9IGxhbmd1YWdlc1tpXTtcbiAgICAgIGlmIChsYW5nLm5hdGl2ZURyb3Bkb3ducy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICB2YXIgbmF0aXZlTmFtZSA9IGxhbmcubmF0aXZlRHJvcGRvd25zW25hbWVdO1xuICAgICAgICByZXR1cm4gbmF0aXZlTmFtZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseU92ZXJyaWRlcyhpbmZvLCBvdmVycmlkZXMpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8b3ZlcnJpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbmFtZSA9IG92ZXJyaWRlc1tpXTtcbiAgICAgIGlmIChoZXhDb2xvclBhdC50ZXN0KG5hbWUpKSB7XG4gICAgICAgIGluZm8uY29sb3IgPSBuYW1lO1xuICAgICAgICBpbmZvLmNhdGVnb3J5ID0gXCJcIjtcbiAgICAgICAgaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmIChvdmVycmlkZUNhdGVnb3JpZXMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIGluZm8uY2F0ZWdvcnkgPSBuYW1lO1xuICAgICAgICBpbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlU2hhcGVzLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgICBpbmZvLnNoYXBlID0gbmFtZTtcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gJ2xvb3AnKSB7XG4gICAgICAgIGluZm8uaGFzTG9vcEFycm93ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGJsb2NrTmFtZShibG9jaykge1xuICAgIHZhciB3b3JkcyA9IFtdO1xuICAgIGZvciAodmFyIGk9MDsgaTxibG9jay5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gYmxvY2suY2hpbGRyZW5baV07XG4gICAgICBpZiAoIWNoaWxkLmlzTGFiZWwpIHJldHVybjtcbiAgICAgIHdvcmRzLnB1c2goY2hpbGQudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gd29yZHMuam9pbihcIiBcIik7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgbG9hZExhbmd1YWdlcyxcblxuICAgIGJsb2NrTmFtZSxcblxuICAgIGFsbExhbmd1YWdlcyxcbiAgICBsb29rdXBEcm9wZG93bixcbiAgICBoZXhDb2xvclBhdCxcbiAgICBtaW5pZnlIYXNoLFxuICAgIGxvb2t1cEhhc2gsXG4gICAgYXBwbHlPdmVycmlkZXMsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIGljb25QYXQsXG4gICAgaGFzaFNwZWMsXG5cbiAgICBibG9ja3NCeVNlbGVjdG9yLFxuICAgIHBhcnNlU3BlYyxcbiAgICBpbnB1dFBhdCxcbiAgICB1bmljb2RlSWNvbnMsXG4gICAgZW5nbGlzaCxcbiAgfTtcblxufSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cbiAgW1wibW92ZSAlbiBzdGVwc1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMSwgICBcImZvcndhcmQ6XCJdLFxuICBbXCJ0dXJuIEB0dXJuUmlnaHQgJW4gZGVncmVlc1wiLCAgICAgICAgICAgICAgICAgIFwiIFwiLCAxLCAgIFwidHVyblJpZ2h0OlwiXSxcbiAgW1widHVybiBAdHVybkxlZnQgJW4gZGVncmVlc1wiLCAgICAgICAgICAgICAgICAgICBcIiBcIiwgMSwgICBcInR1cm5MZWZ0OlwiXSxcbiAgW1wicG9pbnQgaW4gZGlyZWN0aW9uICVkLmRpcmVjdGlvblwiLCAgICAgICAgICAgICBcIiBcIiwgMSwgICBcImhlYWRpbmc6XCJdLFxuICBbXCJwb2ludCB0b3dhcmRzICVtLnNwcml0ZU9yTW91c2VcIiwgICAgICAgICAgICAgIFwiIFwiLCAxLCAgIFwicG9pbnRUb3dhcmRzOlwiXSxcbiAgW1wiZ28gdG8geDolbiB5OiVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMSwgICBcImdvdG9YOnk6XCJdLFxuICBbXCJnbyB0byAlbS5sb2NhdGlvblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAxLCAgIFwiZ290b1Nwcml0ZU9yTW91c2U6XCJdLFxuICBbXCJnbGlkZSAlbiBzZWNzIHRvIHg6JW4geTolblwiLCAgICAgICAgICAgICAgICAgIFwiIFwiLCAxLCAgIFwiZ2xpZGVTZWNzOnRvWDp5OmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcImNoYW5nZSB4IGJ5ICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDEsICAgXCJjaGFuZ2VYcG9zQnk6XCJdLFxuICBbXCJzZXQgeCB0byAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAxLCAgIFwieHBvczpcIl0sXG4gIFtcImNoYW5nZSB5IGJ5ICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDEsICAgXCJjaGFuZ2VZcG9zQnk6XCJdLFxuICBbXCJzZXQgeSB0byAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAxLCAgIFwieXBvczpcIl0sXG4gIFtcInNldCByb3RhdGlvbiBzdHlsZSAlbS5yb3RhdGlvblN0eWxlXCIsICAgICAgICAgXCIgXCIsIDEsICAgXCJzZXRSb3RhdGlvblN0eWxlXCJdLFxuICBbXCJzYXkgJXMgZm9yICVuIHNlY3NcIiwgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwic2F5OmR1cmF0aW9uOmVsYXBzZWQ6ZnJvbTpcIl0sXG4gIFtcInNheSAlc1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDIsICAgXCJzYXk6XCJdLFxuICBbXCJ0aGluayAlcyBmb3IgJW4gc2Vjc1wiLCAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwidGhpbms6ZHVyYXRpb246ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1widGhpbmsgJXNcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMiwgICBcInRoaW5rOlwiXSxcbiAgW1wic2hvd1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMiwgICBcInNob3dcIl0sXG4gIFtcImhpZGVcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDIsICAgXCJoaWRlXCJdLFxuICBbXCJzd2l0Y2ggY29zdHVtZSB0byAlbS5jb3N0dW1lXCIsICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwibG9va0xpa2U6XCJdLFxuICBbXCJuZXh0IGNvc3R1bWVcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwibmV4dENvc3R1bWVcIl0sXG4gIFtcIm5leHQgYmFja2Ryb3BcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDEwMiwgXCJuZXh0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCBiYWNrZHJvcCB0byAlbS5iYWNrZHJvcFwiLCAgICAgICAgICAgICAgXCIgXCIsIDIsICAgXCJzdGFydFNjZW5lXCJdLFxuICBbXCJzd2l0Y2ggYmFja2Ryb3AgdG8gJW0uYmFja2Ryb3AgYW5kIHdhaXRcIiwgICAgIFwiIFwiLCAxMDIsIFwic3RhcnRTY2VuZUFuZFdhaXRcIl0sXG4gIFtcImNoYW5nZSAlbS5lZmZlY3QgZWZmZWN0IGJ5ICVuXCIsICAgICAgICAgICAgICAgXCIgXCIsIDIsICAgXCJjaGFuZ2VHcmFwaGljRWZmZWN0OmJ5OlwiXSxcbiAgW1wic2V0ICVtLmVmZmVjdCBlZmZlY3QgdG8gJW5cIiwgICAgICAgICAgICAgICAgICBcIiBcIiwgMiwgICBcInNldEdyYXBoaWNFZmZlY3Q6dG86XCJdLFxuICBbXCJjbGVhciBncmFwaGljIGVmZmVjdHNcIiwgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwiZmlsdGVyUmVzZXRcIl0sXG4gIFtcImNoYW5nZSBzaXplIGJ5ICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDIsICAgXCJjaGFuZ2VTaXplQnk6XCJdLFxuICBbXCJzZXQgc2l6ZSB0byAlbiVcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwic2V0U2l6ZVRvOlwiXSxcbiAgW1wiZ28gdG8gZnJvbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMiwgICBcImNvbWVUb0Zyb250XCJdLFxuICBbXCJnbyBiYWNrICVuIGxheWVyc1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyLCAgIFwiZ29CYWNrQnlMYXllcnM6XCJdLFxuICBbXCJwbGF5IHNvdW5kICVtLnNvdW5kXCIsICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAzLCAgIFwicGxheVNvdW5kOlwiXSxcbiAgW1wicGxheSBzb3VuZCAlbS5zb3VuZCB1bnRpbCBkb25lXCIsICAgICAgICAgICAgICBcIiBcIiwgMywgICBcImRvUGxheVNvdW5kQW5kV2FpdFwiXSxcbiAgW1wic3RvcCBhbGwgc291bmRzXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMywgICBcInN0b3BBbGxTb3VuZHNcIl0sXG4gIFtcInBsYXkgZHJ1bSAlZC5kcnVtIGZvciAlbiBiZWF0c1wiLCAgICAgICAgICAgICAgXCIgXCIsIDMsICAgXCJwbGF5RHJ1bVwiXSxcbiAgW1wicmVzdCBmb3IgJW4gYmVhdHNcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMywgICBcInJlc3Q6ZWxhcHNlZDpmcm9tOlwiXSxcbiAgW1wicGxheSBub3RlICVkLm5vdGUgZm9yICVuIGJlYXRzXCIsICAgICAgICAgICAgICBcIiBcIiwgMywgICBcIm5vdGVPbjpkdXJhdGlvbjplbGFwc2VkOmZyb206XCJdLFxuICBbXCJzZXQgaW5zdHJ1bWVudCB0byAlZC5pbnN0cnVtZW50XCIsICAgICAgICAgICAgIFwiIFwiLCAzLCAgIFwiaW5zdHJ1bWVudDpcIl0sXG4gIFtcImNoYW5nZSB2b2x1bWUgYnkgJW5cIiwgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDMsICAgXCJjaGFuZ2VWb2x1bWVCeTpcIl0sXG4gIFtcInNldCB2b2x1bWUgdG8gJW4lXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDMsICAgXCJzZXRWb2x1bWVUbzpcIl0sXG4gIFtcImNoYW5nZSB0ZW1wbyBieSAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDMsICAgXCJjaGFuZ2VUZW1wb0J5OlwiXSxcbiAgW1wic2V0IHRlbXBvIHRvICVuIGJwbVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMywgICBcInNldFRlbXBvVG86XCJdLFxuICBbXCJjbGVhclwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCA0LCAgIFwiY2xlYXJQZW5UcmFpbHNcIl0sXG4gIFtcInN0YW1wXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDQsICAgXCJzdGFtcENvc3R1bWVcIl0sXG4gIFtcInBlbiBkb3duXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDQsICAgXCJwdXRQZW5Eb3duXCJdLFxuICBbXCJwZW4gdXBcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCA0LCAgIFwicHV0UGVuVXBcIl0sXG4gIFtcInNldCBwZW4gY29sb3IgdG8gJWNcIiwgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDQsICAgXCJwZW5Db2xvcjpcIl0sXG4gIFtcImNoYW5nZSBwZW4gY29sb3IgYnkgJW5cIiwgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDQsICAgXCJjaGFuZ2VQZW5IdWVCeTpcIl0sXG4gIFtcInNldCBwZW4gY29sb3IgdG8gJW5cIiwgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDQsICAgXCJzZXRQZW5IdWVUbzpcIl0sXG4gIFtcImNoYW5nZSBwZW4gc2hhZGUgYnkgJW5cIiwgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDQsICAgXCJjaGFuZ2VQZW5TaGFkZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaGFkZSB0byAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgNCwgICBcInNldFBlblNoYWRlVG86XCJdLFxuICBbXCJjaGFuZ2UgcGVuIHNpemUgYnkgJW5cIiwgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCA0LCAgIFwiY2hhbmdlUGVuU2l6ZUJ5OlwiXSxcbiAgW1wic2V0IHBlbiBzaXplIHRvICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgNCwgICBcInBlblNpemU6XCJdLFxuICBbXCJ3aGVuIEBncmVlbkZsYWcgY2xpY2tlZFwiLCAgICAgICAgICAgICAgICAgICAgIFwiaFwiLCA1LCAgIFwid2hlbkdyZWVuRmxhZ1wiXSxcbiAgW1wid2hlbiAlbS5rZXkga2V5IHByZXNzZWRcIiwgICAgICAgICAgICAgICAgICAgICBcImhcIiwgNSwgICBcIndoZW5LZXlQcmVzc2VkXCJdLFxuICBbXCJ3aGVuIHRoaXMgc3ByaXRlIGNsaWNrZWRcIiwgICAgICAgICAgICAgICAgICAgIFwiaFwiLCA1LCAgIFwid2hlbkNsaWNrZWRcIl0sXG4gIFtcIndoZW4gYmFja2Ryb3Agc3dpdGNoZXMgdG8gJW0uYmFja2Ryb3BcIiwgICAgICAgXCJoXCIsIDUsICAgXCJ3aGVuU2NlbmVTdGFydHNcIl0sXG4gIFtcIndoZW4gJW0udHJpZ2dlclNlbnNvciA+ICVuXCIsICAgICAgICAgICAgICAgICAgXCJoXCIsIDUsICAgXCJ3aGVuU2Vuc29yR3JlYXRlclRoYW5cIl0sXG4gIFtcIndoZW4gSSByZWNlaXZlICVtLmJyb2FkY2FzdFwiLCAgICAgICAgICAgICAgICAgXCJoXCIsIDUsICAgXCJ3aGVuSVJlY2VpdmVcIl0sXG4gIFtcImJyb2FkY2FzdCAlbS5icm9hZGNhc3RcIiwgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDUsICAgXCJicm9hZGNhc3Q6XCJdLFxuICBbXCJicm9hZGNhc3QgJW0uYnJvYWRjYXN0IGFuZCB3YWl0XCIsICAgICAgICAgICAgIFwiIFwiLCA1LCAgIFwiZG9Ccm9hZGNhc3RBbmRXYWl0XCJdLFxuICBbXCJ3YWl0ICVuIHNlY3NcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCA2LCAgIFwid2FpdDplbGFwc2VkOmZyb206XCJdLFxuICBbXCJyZXBlYXQgJW5cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY1wiLCA2LCAgIFwiZG9SZXBlYXRcIl0sXG4gIFtcImZvcmV2ZXJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjZlwiLDYsICAgXCJkb0ZvcmV2ZXJcIl0sXG4gIFtcImlmICViIHRoZW5cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjXCIsIDYsICAgXCJkb0lmXCJdLFxuICBbXCJpZiAlYiB0aGVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVwiLCA2LCAgIFwiZG9JZkVsc2VcIl0sXG4gIFtcIndhaXQgdW50aWwgJWJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDYsICAgXCJkb1dhaXRVbnRpbFwiXSxcbiAgW1wicmVwZWF0IHVudGlsICViXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNcIiwgNiwgICBcImRvVW50aWxcIl0sXG4gIFtcInN0b3AgJW0uc3RvcFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmXCIsIDYsICAgXCJzdG9wU2NyaXB0c1wiXSxcbiAgW1wid2hlbiBJIHN0YXJ0IGFzIGEgY2xvbmVcIiwgICAgICAgICAgICAgICAgICAgICBcImhcIiwgNiwgICBcIndoZW5DbG9uZWRcIl0sXG4gIFtcImNyZWF0ZSBjbG9uZSBvZiAlbS5zcHJpdGVPbmx5XCIsICAgICAgICAgICAgICAgXCIgXCIsIDYsICAgXCJjcmVhdGVDbG9uZU9mXCJdLFxuICBbXCJkZWxldGUgdGhpcyBjbG9uZVwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZlwiLCA2LCAgIFwiZGVsZXRlQ2xvbmVcIl0sXG4gIFtcImFzayAlcyBhbmQgd2FpdFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDcsICAgXCJkb0Fza1wiXSxcbiAgW1widHVybiB2aWRlbyAlbS52aWRlb1N0YXRlXCIsICAgICAgICAgICAgICAgICAgICBcIiBcIiwgNywgICBcInNldFZpZGVvU3RhdGVcIl0sXG4gIFtcInNldCB2aWRlbyB0cmFuc3BhcmVuY3kgdG8gJW4lXCIsICAgICAgICAgICAgICAgXCIgXCIsIDcsICAgXCJzZXRWaWRlb1RyYW5zcGFyZW5jeVwiXSxcbiAgW1wicmVzZXQgdGltZXJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgNywgICBcInRpbWVyUmVzZXRcIl0sXG4gIFtcInNldCAlbS52YXIgdG8gJXNcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDksICAgXCJzZXRWYXI6dG86XCJdLFxuICBbXCJjaGFuZ2UgJW0udmFyIGJ5ICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCA5LCAgIFwiY2hhbmdlVmFyOmJ5OlwiXSxcbiAgW1wic2hvdyB2YXJpYWJsZSAlbS52YXJcIiwgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgOSwgICBcInNob3dWYXJpYWJsZTpcIl0sXG4gIFtcImhpZGUgdmFyaWFibGUgJW0udmFyXCIsICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDksICAgXCJoaWRlVmFyaWFibGU6XCJdLFxuICBbXCJhZGQgJXMgdG8gJW0ubGlzdFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAxMiwgIFwiYXBwZW5kOnRvTGlzdDpcIl0sXG4gIFtcImRlbGV0ZSAlZC5saXN0RGVsZXRlSXRlbSBvZiAlbS5saXN0XCIsICAgICAgICAgXCIgXCIsIDEyLCAgXCJkZWxldGVMaW5lOm9mTGlzdDpcIl0sXG4gIFtcImlmIG9uIGVkZ2UsIGJvdW5jZVwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDEsICAgXCJib3VuY2VPZmZFZGdlXCJdLFxuICBbXCJpbnNlcnQgJXMgYXQgJWQubGlzdEl0ZW0gb2YgJW0ubGlzdFwiLCAgICAgICAgIFwiIFwiLCAxMiwgIFwiaW5zZXJ0OmF0Om9mTGlzdDpcIl0sXG4gIFtcInJlcGxhY2UgaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0IHdpdGggJXNcIiwgXCIgXCIsIDEyLCAgXCJzZXRMaW5lOm9mTGlzdDp0bzpcIl0sXG4gIFtcInNob3cgbGlzdCAlbS5saXN0XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDEyLCAgXCJzaG93TGlzdDpcIl0sXG4gIFtcImhpZGUgbGlzdCAlbS5saXN0XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDEyLCAgXCJoaWRlTGlzdDpcIl0sXG5cbiAgW1wieCBwb3NpdGlvblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgMSwgICBcInhwb3NcIl0sXG4gIFtcInkgcG9zaXRpb25cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDEsICAgXCJ5cG9zXCJdLFxuICBbXCJkaXJlY3Rpb25cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCAxLCAgIFwiaGVhZGluZ1wiXSxcbiAgW1wiY29zdHVtZSAjXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgMiwgICBcImNvc3R1bWVJbmRleFwiXSxcbiAgW1wic2l6ZVwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgMiwgICBcInNjYWxlXCJdLFxuICBbXCJiYWNrZHJvcCBuYW1lXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCAxMDIsIFwic2NlbmVOYW1lXCJdLFxuICBbXCJiYWNrZHJvcCAjXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCAxMDIsIFwiYmFja2dyb3VuZEluZGV4XCJdLFxuICBbXCJ2b2x1bWVcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCAzLCAgIFwidm9sdW1lXCJdLFxuICBbXCJ0ZW1wb1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCAzLCAgIFwidGVtcG9cIl0sXG4gIFtcInRvdWNoaW5nICVtLnRvdWNoaW5nP1wiLCAgICAgICAgICAgICAgICAgICAgICAgXCJiXCIsIDcsICAgXCJ0b3VjaGluZzpcIl0sXG4gIFtcInRvdWNoaW5nIGNvbG9yICVjP1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgXCJiXCIsIDcsICAgXCJ0b3VjaGluZ0NvbG9yOlwiXSxcbiAgW1wiY29sb3IgJWMgaXMgdG91Y2hpbmcgJWM/XCIsICAgICAgICAgICAgICAgICAgICBcImJcIiwgNywgICBcImNvbG9yOnNlZXM6XCJdLFxuICBbXCJkaXN0YW5jZSB0byAlbS5zcHJpdGVPck1vdXNlXCIsICAgICAgICAgICAgICAgIFwiclwiLCA3LCAgIFwiZGlzdGFuY2VUbzpcIl0sXG4gIFtcImFuc3dlclwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDcsICAgXCJhbnN3ZXJcIl0sXG4gIFtcImtleSAlbS5rZXkgcHJlc3NlZD9cIiwgICAgICAgICAgICAgICAgICAgICAgICAgXCJiXCIsIDcsICAgXCJrZXlQcmVzc2VkOlwiXSxcbiAgW1wibW91c2UgZG93bj9cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImJcIiwgNywgICBcIm1vdXNlUHJlc3NlZFwiXSxcbiAgW1wibW91c2UgeFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgNywgICBcIm1vdXNlWFwiXSxcbiAgW1wibW91c2UgeVwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgNywgICBcIm1vdXNlWVwiXSxcbiAgW1wibG91ZG5lc3NcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgNywgICBcInNvdW5kTGV2ZWxcIl0sXG4gIFtcInZpZGVvICVtLnZpZGVvTW90aW9uVHlwZSBvbiAlbS5zdGFnZU9yVGhpc1wiLCAgXCJyXCIsIDcsICAgXCJzZW5zZVZpZGVvTW90aW9uXCJdLFxuICBbXCJ0aW1lclwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCA3LCAgIFwidGltZXJcIl0sXG4gIFtcIiVtLmF0dHJpYnV0ZSBvZiAlbS5zcHJpdGVPclN0YWdlXCIsICAgICAgICAgICAgXCJyXCIsIDcsICAgXCJnZXRBdHRyaWJ1dGU6b2Y6XCJdLFxuICBbXCJjdXJyZW50ICVtLnRpbWVBbmREYXRlXCIsICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCA3LCAgIFwidGltZUFuZERhdGVcIl0sXG4gIFtcImRheXMgc2luY2UgMjAwMFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDcsICAgXCJ0aW1lc3RhbXBcIl0sXG4gIFtcInVzZXJuYW1lXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDcsICAgXCJnZXRVc2VyTmFtZVwiXSxcbiAgW1wiJW4gKyAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgOCwgICBcIitcIl0sXG4gIFtcIiVuIC0gJW5cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDgsICAgXCItXCJdLFxuICBbXCIlbiAqICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCA4LCAgIFwiKlwiXSxcbiAgW1wiJW4gLyAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgOCwgICBcIi9cIl0sXG4gIFtcInBpY2sgcmFuZG9tICVuIHRvICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDgsICAgXCJyYW5kb21Gcm9tOnRvOlwiXSxcbiAgW1wiJXMgPCAlc1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImJcIiwgOCwgICBcIjxcIl0sXG4gIFtcIiVzID0gJXNcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJiXCIsIDgsICAgXCI9XCJdLFxuICBbXCIlcyA+ICVzXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYlwiLCA4LCAgIFwiPlwiXSxcbiAgW1wiJWIgYW5kICViXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImJcIiwgOCwgICBcIiZcIl0sXG4gIFtcIiViIG9yICViXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJiXCIsIDgsICAgXCJ8XCJdLFxuICBbXCJub3QgJWJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYlwiLCA4LCAgIFwibm90XCJdLFxuICBbXCJqb2luICVzICVzXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCA4LCAgIFwiY29uY2F0ZW5hdGU6d2l0aDpcIl0sXG4gIFtcImxldHRlciAlbiBvZiAlc1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDgsICAgXCJsZXR0ZXI6b2Y6XCJdLFxuICBbXCJsZW5ndGggb2YgJXNcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCA4LCAgIFwic3RyaW5nTGVuZ3RoOlwiXSxcbiAgW1wiJW4gbW9kICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgOCwgICBcIiVcIl0sXG4gIFtcInJvdW5kICVuXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDgsICAgXCJyb3VuZGVkXCJdLFxuICBbXCIlbS5tYXRoT3Agb2YgJW5cIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCA4LCAgIFwiY29tcHV0ZUZ1bmN0aW9uOm9mOlwiXSxcbiAgW1wiaXRlbSAlZC5saXN0SXRlbSBvZiAlbS5saXN0XCIsICAgICAgICAgICAgICAgICBcInJcIiwgMTIsICBcImdldExpbmU6b2ZMaXN0OlwiXSxcbiAgW1wibGVuZ3RoIG9mICVtLmxpc3RcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgMTIsICBcImxpbmVDb3VudE9mTGlzdDpcIl0sXG4gIFtcIiVtLmxpc3QgY29udGFpbnMgJXM/XCIsICAgICAgICAgICAgICAgICAgICAgICAgXCJiXCIsIDEyLCAgXCJsaXN0OmNvbnRhaW5zOlwiXSxcblxuICBbXCJ3aGVuICVtLmJvb2xlYW5TZW5zb3JcIiwgICAgICAgICAgICAgICAgICAgICAgICAgXCJoXCIsIDIwLCAgXCJcIl0sXG4gIFtcIndoZW4gJW0uc2Vuc29yICVtLmxlc3NNb3JlICVuXCIsICAgICAgICAgICAgICAgICBcImhcIiwgMjAsICBcIlwiXSxcbiAgW1wic2Vuc29yICVtLmJvb2xlYW5TZW5zb3I/XCIsICAgICAgICAgICAgICAgICAgICAgIFwiYlwiLCAyMCwgIFwiXCJdLFxuICBbXCIlbS5zZW5zb3Igc2Vuc29yIHZhbHVlXCIsICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDIwLCAgXCJcIl0sXG5cbiAgW1widHVybiAlbS5tb3RvciBvbiBmb3IgJW4gc2Vjc1wiLCAgICAgICAgICAgICAgICAgIFwiIFwiLCAyMCwgIFwiXCJdLFxuICBbXCJ0dXJuICVtLm1vdG9yIG9uXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsIDIwLCAgXCJcIl0sXG4gIFtcInR1cm4gJW0ubW90b3Igb2ZmXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMjAsICBcIlwiXSxcbiAgW1wic2V0ICVtLm1vdG9yIHBvd2VyIHRvICVuXCIsICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyMCwgIFwiXCJdLFxuICBbXCJzZXQgJW0ubW90b3IyIGRpcmVjdGlvbiB0byAlbS5tb3RvckRpcmVjdGlvblwiLCAgXCIgXCIsIDIwLCAgXCJcIl0sXG4gIFtcIndoZW4gZGlzdGFuY2UgJW0ubGVzc01vcmUgJW5cIiwgICAgICAgICAgICAgICAgICBcImhcIiwgMjAsICBcIlwiXSxcbiAgW1wid2hlbiB0aWx0ICVtLmVOZSAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaFwiLCAyMCwgIFwiXCJdLFxuICBbXCJkaXN0YW5jZVwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsIDIwLCAgXCJcIl0sXG4gIFtcInRpbHRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgMjAsICBcIlwiXSxcblxuICBbXCJ0dXJuICVtLm1vdG9yIG9uIGZvciAlbiBzZWNvbmRzXCIsICAgICAgICAgICAgICAgXCIgXCIsIDIwLCAgXCJcIl0sXG4gIFtcInNldCBsaWdodCBjb2xvciB0byAlblwiLCAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIiwgMjAsICBcIlwiXSxcbiAgW1wicGxheSBub3RlICVuIGZvciAlbiBzZWNvbmRzXCIsICAgICAgICAgICAgICAgICAgIFwiIFwiLCAyMCwgIFwiXCJdLFxuICBbXCJ3aGVuIHRpbHRlZFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJoXCIsIDIwLCAgXCJcIl0sXG4gIFtcInRpbHQgJW0ueHh4XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJcIiwgMjAsICBcIlwiXSxcblxuICBbXCJlbHNlXCIsIFwiZWxzZVwiLCA2LCBcIlwiXSxcbiAgW1wiZWxzZSBpZiAlYlwiLCBcImVsc2VcIiwgNiwgXCJcIl0sXG4gIFtcImVuZFwiLCBcImVuZFwiLCA2LCBcIlwiXSxcbiAgW1wiLiAuIC5cIiwgXCIgXCIsIDQyLCBcIlwiXSxcbiAgW1wiY3JlZGl0ICVzXCIsIFwiIFwiLCA0MiwgXCJcIl0sIC8vdGVzdGluZ1xuXG4gIFtcIiVuIEBhZGRJbnB1dFwiLCBcInJpbmdcIiwgNDIsIFwiXCJdLFxuXG4gIFtcInVzZXIgaWRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiclwiLCAgMCwgIFwiXCJdLFxuXG4gIFtcImlmICViXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY1wiLCAgMCwgIFwiZG9JZlwiXSxcbiAgW1wiaWYgJWJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlXCIsICAwLCAgXCJkb0lmRWxzZVwiXSxcbiAgW1wiZm9yZXZlciBpZiAlYlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjZlwiLCAwLCAgXCJkb0ZvcmV2ZXJJZlwiXSxcbiAgW1wic3RvcCBzY3JpcHRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmXCIsICAwLCAgXCJkb1JldHVyblwiXSxcbiAgW1wic3RvcCBhbGxcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmXCIsICAwLCAgXCJzdG9wQWxsXCJdLFxuICBbXCJzd2l0Y2ggdG8gY29zdHVtZSAlbS5jb3N0dW1lXCIsICAgICAgICAgICAgICBcIiBcIiwgIDAsICBcImxvb2tMaWtlOlwiXSxcbiAgW1wibmV4dCBiYWNrZ3JvdW5kXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXCIsICAwLCAgXCJuZXh0U2NlbmVcIl0sXG4gIFtcInN3aXRjaCB0byBiYWNrZ3JvdW5kICVtLmJhY2tkcm9wXCIsICAgICAgICAgIFwiIFwiLCAgMCwgIFwic3RhcnRTY2VuZVwiXSxcbiAgW1wiYmFja2dyb3VuZCAjXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyXCIsICAwLCAgXCJiYWNrZ3JvdW5kSW5kZXhcIl0sXG4gIFtcImxvdWQ/XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYlwiLCAgMCwgIFwiaXNMb3VkXCJdLFxuXG5dO1xuIiwiLyogZm9yIGNvbnN0dWN0aW5nIFNWR3MgKi9cblxuZnVuY3Rpb24gZXh0ZW5kKHNyYywgZGVzdCkgeyByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgZGVzdCwgc3JjKTsgfVxuZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIG1lc3NhZ2UpIHsgaWYgKCFib29sKSB0aHJvdyBcIkFzc2VydGlvbiBmYWlsZWQhIFwiICsgKG1lc3NhZ2UgfHwgXCJcIik7IH1cblxuLy8gc2V0IGJ5IFNWRy5pbml0XG52YXIgZG9jdW1lbnQ7XG52YXIgeG1sO1xuXG5cblxudmFyIGRpcmVjdFByb3BzID0ge1xuICB0ZXh0Q29udGVudDogdHJ1ZSxcbn07XG5cbnZhciBTVkcgPSBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICBpbml0KHdpbmRvdywgbWFrZUNhbnZhcykge1xuICAgIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuICAgIHZhciBET01QYXJzZXIgPSB3aW5kb3cuRE9NUGFyc2VyO1xuICAgIHhtbCA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoJzx4bWw+PC94bWw+JywgIFwiYXBwbGljYXRpb24veG1sXCIpO1xuICAgIFNWRy5YTUxTZXJpYWxpemVyID0gd2luZG93LlhNTFNlcmlhbGl6ZXI7XG5cbiAgICBTVkcubWFrZUNhbnZhcyA9IG1ha2VDYW52YXM7XG4gIH0sXG5cbiAgY2RhdGEoY29udGVudCkge1xuICAgIHJldHVybiB4bWwuY3JlYXRlQ0RBVEFTZWN0aW9uKGNvbnRlbnQpO1xuICB9LFxuXG4gIGVsKG5hbWUsIHByb3BzKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgbmFtZSk7XG4gICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhlbCwgcHJvcHMpO1xuICB9LFxuXG4gIHNldFByb3BzKGVsLCBwcm9wcykge1xuICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgdmFyIHZhbHVlID0gJycgKyBwcm9wc1trZXldO1xuICAgICAgaWYgKGRpcmVjdFByb3BzW2tleV0pIHtcbiAgICAgICAgZWxba2V5XSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIGlmICgvXnhsaW5rOi8udGVzdChrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBrZXkuc2xpY2UoNiksIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcHNba2V5XSAhPT0gbnVsbCAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKG51bGwsIGtleSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH0sXG5cbiAgd2l0aENoaWxkcmVuKGVsLCBjaGlsZHJlbikge1xuICAgIGZvciAodmFyIGk9MDsgaTxjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgZWwuYXBwZW5kQ2hpbGQoY2hpbGRyZW5baV0pO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH0sXG5cbiAgZ3JvdXAoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gU1ZHLndpdGhDaGlsZHJlbihTVkcuZWwoJ2cnKSwgY2hpbGRyZW4pO1xuICB9LFxuXG4gIG5ld1NWRyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIFNWRy5lbCgnc3ZnJywge1xuICAgICAgdmVyc2lvbjogXCIxLjFcIixcbiAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgIH0pO1xuICB9LFxuXG4gIHBvbHlnb24ocHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKCdwb2x5Z29uJywgZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwb2ludHM6IHByb3BzLnBvaW50cy5qb2luKFwiIFwiKSxcbiAgICB9KSk7XG4gIH0sXG5cbiAgcGF0aChwcm9wcykge1xuICAgIHJldHVybiBTVkcuZWwoJ3BhdGgnLCBleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IG51bGwsXG4gICAgICBkOiBwcm9wcy5wYXRoLmpvaW4oXCIgXCIpLFxuICAgIH0pKTtcbiAgfSxcblxuICB0ZXh0KHgsIHksIGNvbnRlbnQsIHByb3BzKSB7XG4gICAgdmFyIHRleHQgPSBTVkcuZWwoJ3RleHQnLCBleHRlbmQocHJvcHMsIHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5LFxuICAgICAgdGV4dENvbnRlbnQ6IGNvbnRlbnQsXG4gICAgfSkpO1xuICAgIHJldHVybiB0ZXh0O1xuICB9LFxuXG4gIHN5bWJvbChocmVmKSB7XG4gICAgcmV0dXJuIFNWRy5lbCgndXNlJywge1xuICAgICAgJ3hsaW5rOmhyZWYnOiBocmVmLFxuICAgIH0pO1xuICB9LFxuXG4gIG1vdmUoZHgsIGR5LCBlbCkge1xuICAgIFNWRy5zZXRQcm9wcyhlbCwge1xuICAgICAgdHJhbnNmb3JtOiBbJ3RyYW5zbGF0ZSgnLCBkeCwgJyAnLCBkeSwgJyknXS5qb2luKCcnKSxcbiAgICB9KTtcbiAgICByZXR1cm4gZWw7XG4gIH0sXG5cbiAgdHJhbnNsYXRlUGF0aChkeCwgZHksIHBhdGgpIHtcbiAgICB2YXIgaXNYID0gdHJ1ZTtcbiAgICB2YXIgcGFydHMgPSBwYXRoLnNwbGl0KFwiIFwiKTtcbiAgICB2YXIgb3V0ID0gW107XG4gICAgZm9yICh2YXIgaT0wOyBpPHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgaWYgKHBhcnQgPT09ICdBJykge1xuICAgICAgICB2YXIgaiA9IGkgKyA1O1xuICAgICAgICBvdXQucHVzaCgnQScpO1xuICAgICAgICB3aGlsZSAoaSA8IGopIHtcbiAgICAgICAgICBvdXQucHVzaChwYXJ0c1srK2ldKTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAoL1tBLVphLXpdLy50ZXN0KHBhcnQpKSB7XG4gICAgICAgIGFzc2VydChpc1gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFydCA9ICtwYXJ0O1xuICAgICAgICBwYXJ0ICs9IGlzWCA/IGR4IDogZHk7XG4gICAgICAgIGlzWCA9ICFpc1g7XG4gICAgICB9XG4gICAgICBvdXQucHVzaChwYXJ0KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dC5qb2luKFwiIFwiKTtcbiAgfSxcblxuXG4gIC8qIHNoYXBlcyAqL1xuXG4gIHJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLmVsKCdyZWN0JywgZXh0ZW5kKHByb3BzLCB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHdpZHRoOiB3LFxuICAgICAgaGVpZ2h0OiBoLFxuICAgIH0pKTtcbiAgfSxcblxuICBhcmMocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeTtcbiAgICByZXR1cm4gW1wiTFwiLCBwMXgsIHAxeSwgXCJBXCIsIHJ4LCByeSwgMCwgMCwgMSwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpO1xuICB9LFxuXG4gIGFyY3cocDF4LCBwMXksIHAyeCwgcDJ5LCByeCwgcnkpIHtcbiAgICB2YXIgciA9IHAyeSAtIHAxeTtcbiAgICByZXR1cm4gW1wiTFwiLCBwMXgsIHAxeSwgXCJBXCIsIHJ4LCByeSwgMCwgMCwgMCwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpO1xuICB9LFxuXG4gIHJvdW5kZWRQYXRoKHcsIGgpIHtcbiAgICB2YXIgciA9IGggLyAyO1xuICAgIHJldHVybiBbXG4gICAgICBcIk1cIiwgciwgMCxcbiAgICAgIFNWRy5hcmModyAtIHIsIDAsIHcgLSByLCBoLCByLCByKSxcbiAgICAgIFNWRy5hcmMociwgaCwgciwgMCwgciwgciksXG4gICAgICBcIlpcIlxuICAgIF07XG4gIH0sXG4gIFxuICByb3VuZGVkUGF0aDIodywgaCkge1xuICAgIHZhciByID0gKGggLyAyKTtcbiAgICB2YXIgc2hpZnQgPSA0O1xuICAgIHJldHVybiBbXG4gICAgICBcIk1cIiwgci04LCAwLFxuICAgICAgU1ZHLmFyYygodyAtIHIpLXNoaWZ0LCAwLCAodyAtIHIpLXNoaWZ0LCBoLCByLCByKSxcbiAgICAgIFNWRy5hcmMoci1zaGlmdCwgaCwgci1zaGlmdCwgMCwgciwgciksXG4gICAgICBcIlpcIlxuICAgIF07XG4gIH0sXG5cbiAgcm91bmRlZFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBTVkcucm91bmRlZFBhdGgodywgaCksXG4gICAgfSkpO1xuICB9LFxuICBcbiAgcm91bmRlZElucHV0KHcsIGgsIHByb3BzKSB7XG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogU1ZHLnJvdW5kZWRQYXRoMih3KzgsIGgpLFxuICAgIH0pKTtcbiAgfSxcblxuICBwb2ludGVkUGF0aCh3LCBoKSB7XG4gICAgdmFyIHIgPSBoIC8gMjtcbiAgICByZXR1cm4gW1xuICAgICAgXCJNXCIsIHIsIDAsXG4gICAgICBcIkxcIiwgdyAtIHIsIDAsIHcsIHIsXG4gICAgICBcIkxcIiwgdywgciwgdyAtIHIsIGgsXG4gICAgICBcIkxcIiwgciwgaCwgMCwgcixcbiAgICAgIFwiTFwiLCAwLCByLCByLCAwLFxuICAgICAgXCJaXCIsXG4gICAgXTtcbiAgfSxcblxuICBwb2ludGVkUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFNWRy5wb2ludGVkUGF0aCh3KzgsIGgpLFxuICAgIH0pKTtcbiAgfSxcblxuICBnZXRUb3Aodykge1xuICAgIC8vIHJldHVybiBbXCJNXCIsIDAsIDMsXG4gICAgLy8gICBcIkxcIiwgMywgMCxcbiAgICAvLyAgIFwiTFwiLCAxMywgMCxcbiAgICAvLyAgIFwiTFwiLCAxNiwgMyxcbiAgICAvLyAgIFwiTFwiLCAyNCwgMyxcbiAgICAvLyAgIFwiTFwiLCAyNywgMCxcbiAgICAvLyAgIFwiTFwiLCB3IC0gMywgMCxcbiAgICAvLyAgIFwiTFwiLCB3LCAzXG4gICAgLy8gXS5qb2luKFwiIFwiKTtcbiAgICByZXR1cm4gW1wiTVwiLCAwLCA0LFxuICAgICAgLy8gXCJMXCIsIDEsIDEsXG4gICAgICAvLyBcIkxcIiwgNCwgMCxcbiAgICAgIFwiUVwiLCBTVkcuY3VydmUoMCwgNCwgNCwgMCwgMCksXG4gICAgICBcIkxcIiwgNCwgMCxcbiAgICAgIFwiTFwiLCA4LCAwLFxuICAgICAgXCJMXCIsIDEyLCA0LFxuICAgICAgXCJMXCIsIDIwLCA0LFxuICAgICAgXCJMXCIsIDI0LCAwLFxuICAgICAgXCJMXCIsIDI4LCAwLFxuICAgICAgXCJMXCIsIHcgLSA0LCAwLFxuICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3IC0gNCwgMCwgdywgNCwgMCksXG4gICAgICBcIkxcIiwgdywgNFxuICAgIF0uam9pbihcIiBcIik7XG4gIH0sXG5cbiAgZ2V0UmluZ1RvcCh3KSB7XG4gICAgcmV0dXJuIFtcIk1cIiwgMCwgMyxcbiAgICAgIFwiTFwiLCAzLCAwLFxuICAgICAgXCJMXCIsIDcsIDAsXG4gICAgICBcIkxcIiwgMTAsIDMsXG4gICAgICBcIkxcIiwgMTYsIDMsXG4gICAgICBcIkxcIiwgMTksIDAsXG4gICAgICBcIkxcIiwgdyAtIDMsIDAsXG4gICAgICBcIkxcIiwgdywgM1xuICAgIF0uam9pbihcIiBcIik7XG4gIH0sXG5cbiAgZ2V0UmlnaHRBbmRCb3R0b20odywgeSwgaGFzTm90Y2gsIGluc2V0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnNldCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zZXQgPSAwO1xuICAgIH1cbiAgICB2YXIgYXJyID0gW1wiTFwiLCB3LCB5IC0gMyxcbiAgICAgIFwiTFwiLCB3IC0gMywgeVxuICAgIF07XG4gICAgaWYgKGhhc05vdGNoKSB7XG4gICAgLy8gLy8gcmV0dXJuIFtcIk1cIiwgMCwgMyxcbiAgICAvLyAvLyAgIFwiTFwiLCAzLCAwLFxuICAgIC8vIC8vICAgXCJMXCIsIDEzLCAwLFxuICAgIC8vIC8vICAgXCJMXCIsIDE2LCAzLFxuICAgIC8vIC8vICAgXCJMXCIsIDI0LCAzLFxuICAgIC8vIC8vICAgXCJMXCIsIDI3LCAwLFxuICAgIC8vIC8vICAgXCJMXCIsIHcgLSAzLCAwLFxuICAgIC8vIC8vICAgXCJMXCIsIHcsIDNcbiAgICAvLyAvLyBdLmpvaW4oXCIgXCIpO1xuICAgIC8vIHJldHVybiBbXCJNXCIsIDAsIDQsXG4gICAgLy8gICBcIkxcIiwgMSwgMSxcbiAgICAvLyAgIFwiTFwiLCA0LCAwLFxuICAgIC8vICAgXCJMXCIsIDgsIDAsXG4gICAgLy8gICBcIkxcIiwgMTIsIDQsXG4gICAgLy8gICBcIkxcIiwgMjAsIDQsXG4gICAgLy8gICBcIkxcIiwgMjQsIDAsXG4gICAgLy8gICBcIkxcIiwgMjgsIDAsXG4gICAgLy8gICBcIkxcIiwgdyAtIDQsIDAsXG4gICAgLy8gICBcIkxcIiwgdyAtIDEsIDEsXG4gICAgLy8gICBcIkxcIiwgdywgNFxuICAgICAgYXJyID0gYXJyLmNvbmNhdChbXG4gICAgICAgIFwiTFwiLCBpbnNldCArIDI4LCB5LFxuICAgICAgICBcIkxcIiwgaW5zZXQgKyAyNCwgeSxcbiAgICAgICAgXCJMXCIsIGluc2V0ICsgMjAsIHkgKyA0LFxuICAgICAgICBcIkxcIiwgaW5zZXQgKyAxMiwgeSArIDQsXG4gICAgICAgIFwiTFwiLCBpbnNldCArIDgsIHksXG4gICAgICAgIFwiTFwiLCBpbnNldCArIDQsIHksXG4gICAgICAgIC8vXCJMXCIsIGluc2V0ICsgMSwgeSxcbiAgICAgIF0pO1xuICAgIH1cbiAgICBpZiAoaW5zZXQgPiAwKSB7XG4gICAgICBhcnIgPSBhcnIuY29uY2F0KFtcbiAgICAgICAgXCJMXCIsIGluc2V0ICsgMiwgeSxcbiAgICAgICAgXCJMXCIsIGluc2V0LCB5ICsgMlxuICAgICAgXSlcbiAgICB9IGVsc2Uge1xuICAgICAgYXJyID0gYXJyLmNvbmNhdChbXG4gICAgICAgIFwiTFwiLCBpbnNldCArIDMsIHksXG4gICAgICAgIFwiTFwiLCAwLCB5IC0gM1xuICAgICAgXSk7XG4gICAgfVxuICAgIHJldHVybiBhcnIuam9pbihcIiBcIik7XG4gIH0sXG5cbiAgZ2V0QXJtKHcsIGFybVRvcCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIkxcIiwgMTUsIGFybVRvcCAtIDIsXG4gICAgICBcIkxcIiwgMTUgKyAyLCBhcm1Ub3AsXG4gICAgICBcIkxcIiwgdyAtIDMsIGFybVRvcCxcbiAgICAgIFwiTFwiLCB3LCBhcm1Ub3AgKyAzXG4gICAgXS5qb2luKFwiIFwiKTtcbiAgfSxcblxuXG4gIHN0YWNrUmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgU1ZHLmdldFRvcCh3KSxcbiAgICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUsIDApLFxuICAgICAgICBcIlpcIixcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIGNhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbXG4gICAgICBTVkcuZ2V0VG9wKHcpLFxuICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIGZhbHNlLCAwKSxcbiAgICAgIFwiWlwiLFxuICAgIF07XG4gIH0sXG5cbiAgcmluZ0NhcFBhdGgodywgaCkge1xuICAgIHJldHVybiBbXG4gICAgICBTVkcuZ2V0UmluZ1RvcCh3KSxcbiAgICAgIFNWRy5nZXRSaWdodEFuZEJvdHRvbSh3LCBoLCBmYWxzZSwgMCksXG4gICAgICBcIlpcIixcbiAgICBdO1xuICB9LFxuXG4gIGNhcFJlY3QodywgaCwgcHJvcHMpIHtcbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBTVkcuY2FwUGF0aCh3LCBoKSxcbiAgICB9KSk7XG4gIH0sXG5cbiAgaGF0UmVjdCh3LCBoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsIDAsIDEyLFxuICAgICAgICBTVkcuYXJjKDAsIDEwLCA2MCwgMTAsIDYwLCA4MCksXG4gICAgICAgIFwiTFwiLCB3LTQsIDEwLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKHcgLSA0LCAxMCwgdywgMTAgKyA0LCAwKSxcbiAgICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIGgsIHRydWUpLFxuICAgICAgICBcIlpcIixcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIGN1cnZlKHAxeCwgcDF5LCBwMngsIHAyeSwgcm91bmRuZXNzKSB7XG4gICAgdmFyIHJvdW5kbmVzcyA9IHJvdW5kbmVzcyB8fCAwLjQyO1xuICAgIHZhciBtaWRYID0gKHAxeCArIHAyeCkgLyAyLjA7XG4gICAgdmFyIG1pZFkgPSAocDF5ICsgcDJ5KSAvIDIuMDtcbiAgICB2YXIgY3ggPSBNYXRoLnJvdW5kKG1pZFggKyAocm91bmRuZXNzICogKHAyeSAtIHAxeSkpKTtcbiAgICB2YXIgY3kgPSBNYXRoLnJvdW5kKG1pZFkgLSAocm91bmRuZXNzICogKHAyeCAtIHAxeCkpKTtcbiAgICByZXR1cm4gW2N4LCBjeSwgcDJ4LCBwMnldLmpvaW4oXCIgXCIpO1xuICB9LFxuXG4gIHByb2NIYXRCYXNlKHcsIGgsIGFyY2hSb3VuZG5lc3MsIHByb3BzKSB7XG4gICAgLy8gVE9ETyB1c2UgYXJjKClcbiAgICAvLyB2YXIgYXJjaFJvdW5kbmVzcyA9IE1hdGgubWluKDAuMiwgMzUgLyB3KTsgLy91c2VkIGluIHNjcmF0Y2hibG9ja3MyXG4gICAgcmV0dXJuIFNWRy5wYXRoKGV4dGVuZChwcm9wcywge1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIiwgMCwgaC0zLFxuICAgICAgICBcIkxcIiwgMCwgMTAsXG4gICAgICAgIFwiUVwiLCBTVkcuY3VydmUoMCwgMTAsIDE1LCAtNSwgMCksXG4gICAgICAgIFwiTFwiLCB3LTE1LCAtNSxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3LTE1LCAtNSwgdywgMTAsIDApLFxuICAgICAgICBTVkcuZ2V0UmlnaHRBbmRCb3R0b20odywgaCwgdHJ1ZSksXG4gICAgICAgIC8vIFwiTVwiLCAtMSwgMTMsXG4gICAgICAgIC8vIFwiUVwiLCBTVkcuY3VydmUoLTEsIDEzLCB3ICsgMSwgMTMsIGFyY2hSb3VuZG5lc3MpLFxuICAgICAgICAvLyBcIlFcIiwgU1ZHLmN1cnZlKHcgKyAxLCAxMywgdywgMTYsIDAuNiksXG4gICAgICAgIC8vIFwiUVwiLCBTVkcuY3VydmUodywgMTYsIDAsIDE2LCAtYXJjaFJvdW5kbmVzcyksXG4gICAgICAgIC8vIFwiUVwiLCBTVkcuY3VydmUoMCwgMTYsIC0xLCAxMywgMC42KSxcbiAgICAgICAgLy8gXCJaXCIsXG4gICAgICBdLFxuICAgIH0pKTtcbiAgfSxcblxuICBwcm9jSGF0Q2FwKHcsIGgsIGFyY2hSb3VuZG5lc3MpIHtcbiAgICAvLyBUT0RPIHVzZSBhcmMoKVxuICAgIC8vIFRPRE8gdGhpcyBkb2Vzbid0IGxvb2sgcXVpdGUgcmlnaHRcbiAgICByZXR1cm4gU1ZHLnBhdGgoe1xuICAgICAgcGF0aDogW1xuICAgICAgICBcIk1cIiwgLTEsIDEzLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKC0xLCAxMywgdyArIDEsIDEzLCBhcmNoUm91bmRuZXNzKSxcbiAgICAgICAgXCJRXCIsIFNWRy5jdXJ2ZSh3ICsgMSwgMTMsIHcsIDE2LCAwLjYpLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKHcsIDE2LCAwLCAxNiwgLWFyY2hSb3VuZG5lc3MpLFxuICAgICAgICBcIlFcIiwgU1ZHLmN1cnZlKDAsIDE2LCAtMSwgMTMsIDAuNiksXG4gICAgICAgIFwiWlwiLFxuICAgICAgXSxcbiAgICAgIGNsYXNzOiAnc2ItZGVmaW5lLWhhdC1jYXAnLFxuICAgIH0pO1xuICB9LFxuXG4gIHByb2NIYXRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHEgPSA1MjtcbiAgICB2YXIgeSA9IGggLSBxO1xuXG4gICAgdmFyIGFyY2hSb3VuZG5lc3MgPSBNYXRoLm1pbigwLjIsIDM1IC8gdyk7XG5cbiAgICByZXR1cm4gU1ZHLm1vdmUoMCwgeSwgU1ZHLmdyb3VwKFtcbiAgICAgIFNWRy5wcm9jSGF0QmFzZSh3LCBxLCBhcmNoUm91bmRuZXNzLCBwcm9wcyksXG4gICAgICAvL1NWRy5wcm9jSGF0Q2FwKHcsIHEsIGFyY2hSb3VuZG5lc3MpLFxuICAgIF0pKTtcbiAgfSxcblxuICBtb3V0aFJlY3QodywgaCwgaXNGaW5hbCwgbGluZXMsIHByb3BzKSB7XG4gICAgdmFyIHkgPSBsaW5lc1swXS5oZWlnaHQ7XG4gICAgdmFyIHAgPSBbXG4gICAgICBTVkcuZ2V0VG9wKHcpLFxuICAgICAgU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIHksIHRydWUsIDE1KSxcbiAgICBdO1xuICAgIGZvciAodmFyIGk9MTsgaTxsaW5lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIGlzTGFzdCA9IChpICsgMiA9PT0gbGluZXMubGVuZ3RoKTtcblxuICAgICAgeSArPSBsaW5lc1tpXS5oZWlnaHQgLSAzO1xuICAgICAgcC5wdXNoKFNWRy5nZXRBcm0odywgeSkpO1xuXG4gICAgICB2YXIgaGFzTm90Y2ggPSAhKGlzTGFzdCAmJiBpc0ZpbmFsKTtcbiAgICAgIHZhciBpbnNldCA9IGlzTGFzdCA/IDAgOiAxNTtcbiAgICAgIHkgKz0gbGluZXNbaSArIDFdLmhlaWdodCArIDM7XG4gICAgICBwLnB1c2goU1ZHLmdldFJpZ2h0QW5kQm90dG9tKHcsIHksIGhhc05vdGNoLCBpbnNldCkpO1xuICAgIH1cbiAgICByZXR1cm4gU1ZHLnBhdGgoZXh0ZW5kKHByb3BzLCB7XG4gICAgICBwYXRoOiBwLFxuICAgIH0pKTtcbiAgfSxcblxuICByaW5nUmVjdCh3LCBoLCBjeSwgY3csIGNoLCBzaGFwZSwgcHJvcHMpIHtcbiAgICB2YXIgciA9IDg7XG4gICAgdmFyIGZ1bmMgPSBzaGFwZSA9PT0gJ3JlcG9ydGVyJyA/IFNWRy5yb3VuZGVkUGF0aFxuICAgICAgICAgICAgIDogc2hhcGUgPT09ICdib29sZWFuJyA/IFNWRy5wb2ludGVkUGF0aFxuICAgICAgICAgICAgIDogY3cgPCA0MCA/IFNWRy5yaW5nQ2FwUGF0aCA6IFNWRy5jYXBQYXRoO1xuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIHBhdGg6IFtcbiAgICAgICAgXCJNXCIsIHIsIDAsXG4gICAgICAgIFNWRy5hcmN3KHIsIDAsIDAsIHIsIHIsIHIpLFxuICAgICAgICBTVkcuYXJjdygwLCBoIC0gciwgciwgaCwgciwgciksXG4gICAgICAgIFNWRy5hcmN3KHcgLSByLCBoLCB3LCBoIC0gciwgciwgciksXG4gICAgICAgIFNWRy5hcmN3KHcsIHIsIHcgLSByLCAwLCByLCByKSxcbiAgICAgICAgXCJaXCIsXG4gICAgICAgIFNWRy50cmFuc2xhdGVQYXRoKDQsIGN5IHx8IDQsIGZ1bmMoY3csIGNoKS5qb2luKFwiIFwiKSksXG4gICAgICBdLFxuICAgICAgJ2ZpbGwtcnVsZSc6ICdldmVuLW9kZCcsXG4gICAgfSkpO1xuICB9LFxuXG4gIGNvbW1lbnRSZWN0KHcsIGgsIHByb3BzKSB7XG4gICAgdmFyIHIgPSA2O1xuICAgIHJldHVybiBTVkcucGF0aChleHRlbmQocHJvcHMsIHtcbiAgICAgIGNsYXNzOiAnc2ItY29tbWVudCcsXG4gICAgICBwYXRoOiBbXG4gICAgICAgIFwiTVwiLCByLCAwLFxuICAgICAgICBTVkcuYXJjKHcgLSByLCAwLCB3LCByLCByLCByKSxcbiAgICAgICAgU1ZHLmFyYyh3LCBoIC0gciwgdyAtIHIsIGgsIHIsIHIpLFxuICAgICAgICBTVkcuYXJjKHIsIGgsIDAsIGggLSByLCByLCByKSxcbiAgICAgICAgU1ZHLmFyYygwLCByLCByLCAwLCByLCByKSxcbiAgICAgICAgXCJaXCJcbiAgICAgIF0sXG4gICAgfSkpO1xuICB9LFxuXG4gIGNvbW1lbnRMaW5lKHdpZHRoLCBwcm9wcykge1xuICAgIHJldHVybiBTVkcubW92ZSgtd2lkdGgsIDksIFNWRy5yZWN0KHdpZHRoLCAyLCBleHRlbmQocHJvcHMsIHtcbiAgICAgIGNsYXNzOiAnc2ItY29tbWVudC1saW5lJyxcbiAgICB9KSkpO1xuICB9LFxuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7IHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpOyB9XG5cbiAgdmFyIFNWRyA9IHJlcXVpcmUoJy4vZHJhdy5qcycpO1xuXG4gIHZhciBGaWx0ZXIgPSBmdW5jdGlvbihpZCwgcHJvcHMpIHtcbiAgICB0aGlzLmVsID0gU1ZHLmVsKCdmaWx0ZXInLCBleHRlbmQocHJvcHMsIHtcbiAgICAgIGlkOiBpZCxcbiAgICAgIHgwOiAnLTUwJScsXG4gICAgICB5MDogJy01MCUnLFxuICAgICAgd2lkdGg6ICcyMDAlJyxcbiAgICAgIGhlaWdodDogJzIwMCUnLFxuICAgIH0pKTtcbiAgICB0aGlzLmhpZ2hlc3RJZCA9IDA7XG4gIH07XG4gIEZpbHRlci5wcm90b3R5cGUuZmUgPSBmdW5jdGlvbihuYW1lLCBwcm9wcywgY2hpbGRyZW4pIHtcbiAgICB2YXIgc2hvcnROYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL2dhdXNzaWFufG9zaXRlLywgJycpO1xuICAgIHZhciBpZCA9IFtzaG9ydE5hbWUsICctJywgKyt0aGlzLmhpZ2hlc3RJZF0uam9pbignJyk7XG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZChTVkcud2l0aENoaWxkcmVuKFNWRy5lbChcImZlXCIgKyBuYW1lLCBleHRlbmQocHJvcHMsIHtcbiAgICAgIHJlc3VsdDogaWQsXG4gICAgfSkpLCBjaGlsZHJlbiB8fCBbXSkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLmNvbXAgPSBmdW5jdGlvbihvcCwgaW4xLCBpbjIsIHByb3BzKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoJ0NvbXBvc2l0ZScsIGV4dGVuZChwcm9wcywge1xuICAgICAgb3BlcmF0b3I6IG9wLFxuICAgICAgaW46IGluMSxcbiAgICAgIGluMjogaW4yLFxuICAgIH0pKTtcbiAgfVxuICBGaWx0ZXIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24oaW4xLCBpbjIpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wKCdhcml0aG1ldGljJywgaW4xLCBpbjIsIHsgazI6ICsxLCBrMzogLTEgfSk7XG4gIH1cbiAgRmlsdGVyLnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbihkeCwgZHksIGluMSkge1xuICAgIHJldHVybiB0aGlzLmZlKCdPZmZzZXQnLCB7XG4gICAgICBpbjogaW4xLFxuICAgICAgZHg6IGR4LFxuICAgICAgZHk6IGR5LFxuICAgIH0pO1xuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuZmxvb2QgPSBmdW5jdGlvbihjb2xvciwgb3BhY2l0eSwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoJ0Zsb29kJywge1xuICAgICAgaW46IGluMSxcbiAgICAgICdmbG9vZC1jb2xvcic6IGNvbG9yLFxuICAgICAgJ2Zsb29kLW9wYWNpdHknOiBvcGFjaXR5LFxuICAgIH0pO1xuICB9XG4gIEZpbHRlci5wcm90b3R5cGUuYmx1ciA9IGZ1bmN0aW9uKGRldiwgaW4xKSB7XG4gICAgcmV0dXJuIHRoaXMuZmUoJ0dhdXNzaWFuQmx1cicsIHtcbiAgICAgICdpbic6ICdTb3VyY2VBbHBoYScsXG4gICAgICBzdGREZXZpYXRpb246IFtkZXYsIGRldl0uam9pbignICcpLFxuICAgIH0pO1xuICB9XG4gIEZpbHRlci5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbihjaGlsZHJlbikge1xuICAgIHRoaXMuZmUoJ01lcmdlJywge30sIGNoaWxkcmVuLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gU1ZHLmVsKCdmZU1lcmdlTm9kZScsIHtcbiAgICAgICAgaW46IG5hbWUsXG4gICAgICB9KTtcbiAgICB9KSk7XG4gIH1cblxuICByZXR1cm4gRmlsdGVyO1xuXG59KCk7XG4iLCIvKlxuICogc2NyYXRjaGJsb2Nrc1xuICogaHR0cDovL3NjcmF0Y2hibG9ja3MuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTYsIFRpbSBSYWR2YW5cbiAqIEBsaWNlbnNlIE1JVFxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICovXG4oZnVuY3Rpb24gKG1vZCkge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vZDtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbWFrZUNhbnZhcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7IH07XG4gICAgdmFyIHNjcmF0Y2hibG9ja3MgPSB3aW5kb3cuc2NyYXRjaGJsb2NrcyA9IG1vZCh3aW5kb3csIG1ha2VDYW52YXMpO1xuXG4gICAgLy8gYWRkIG91ciBDU1MgdG8gdGhlIHBhZ2VcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmF0Y2hibG9ja3MubWFrZVN0eWxlKCkpO1xuICB9XG59KGZ1bmN0aW9uKHdpbmRvdywgbWFrZUNhbnZhcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuXG5cbiAgLyogdXRpbHMgKi9cblxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7IHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpOyB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciB7IGFsbExhbmd1YWdlcywgbG9hZExhbmd1YWdlcyB9ID0gcmVxdWlyZSgnLi9ibG9ja3MuanMnKTtcblxuICB2YXIgcGFyc2UgPSByZXF1aXJlKCcuL3N5bnRheC5qcycpLnBhcnNlO1xuXG4gIHZhciBzdHlsZSA9IHJlcXVpcmUoJy4vc3R5bGUuanMnKTtcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIHtcbiAgICBMYWJlbCxcbiAgICBJY29uLFxuICAgIElucHV0LFxuICAgIEJsb2NrLFxuICAgIENvbW1lbnQsXG4gICAgU2NyaXB0LFxuICAgIERvY3VtZW50LFxuICB9ID0gcmVxdWlyZSgnLi9tb2RlbC5qcycpO1xuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIgU1ZHID0gcmVxdWlyZSgnLi9kcmF3LmpzJyk7XG4gIFNWRy5pbml0KHdpbmRvdywgbWFrZUNhbnZhcyk7XG5cbiAgTGFiZWwubWVhc3VyaW5nID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBTVkcubWFrZUNhbnZhcygpO1xuICAgIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgfSgpKTtcblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgZnVuY3Rpb24gcmVuZGVyKGRvYywgY2IpIHtcbiAgICByZXR1cm4gZG9jLnJlbmRlcihjYik7XG4gIH1cblxuXG4gIC8qKiogUmVuZGVyICoqKi9cblxuICAvLyByZWFkIGNvZGUgZnJvbSBhIERPTSBlbGVtZW50XG4gIGZ1bmN0aW9uIHJlYWRDb2RlKGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoe1xuICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICB9LCBvcHRpb25zKTtcblxuICAgIHZhciBodG1sID0gZWwuaW5uZXJIVE1MLnJlcGxhY2UoLzxicj5cXHM/fFxcbnxcXHJcXG58XFxyL2lnLCAnXFxuJyk7XG4gICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICAgIHByZS5pbm5lckhUTUwgPSBodG1sO1xuICAgIHZhciBjb2RlID0gcHJlLnRleHRDb250ZW50O1xuICAgIGlmIChvcHRpb25zLmlubGluZSkge1xuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgnXFxuJywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gY29kZTtcbiAgfVxuXG4gIC8vIGluc2VydCAnc3ZnJyBpbnRvICdlbCcsIHdpdGggYXBwcm9wcmlhdGUgd3JhcHBlciBlbGVtZW50c1xuICBmdW5jdGlvbiByZXBsYWNlKGVsLCBzdmcsIHNjcmlwdHMsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICB2YXIgY2xzID0gXCJzY3JhdGNoYmxvY2tzIHNjcmF0Y2hibG9ja3MtaW5saW5lXCI7XG4gICAgICBpZiAoc2NyaXB0c1swXSAmJiAhc2NyaXB0c1swXS5pc0VtcHR5KSB7XG4gICAgICAgIGNscyArPSBcIiBzY3JhdGNoYmxvY2tzLWlubGluZS1cIiArIHNjcmlwdHNbMF0uYmxvY2tzWzBdLnNoYXBlO1xuICAgICAgfVxuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNscztcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XG4gICAgICBjb250YWluZXIuc3R5bGUudmVydGljYWxBbGlnbiA9ICdtaWRkbGUnO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJzY3JhdGNoYmxvY2tzXCI7XG4gICAgfVxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzdmcpO1xuXG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgZWwuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgfVxuXG4gIC8qIFJlbmRlciBhbGwgbWF0Y2hpbmcgZWxlbWVudHMgaW4gcGFnZSB0byBzaGlueSBzY3JhdGNoIGJsb2Nrcy5cbiAgICogQWNjZXB0cyBhIENTUyBzZWxlY3RvciBhcyBhbiBhcmd1bWVudC5cbiAgICpcbiAgICogIHNjcmF0Y2hibG9ja3MucmVuZGVyTWF0Y2hpbmcoXCJwcmUuYmxvY2tzXCIpO1xuICAgKlxuICAgKiBMaWtlIHRoZSBvbGQgJ3NjcmF0Y2hibG9ja3MyLnBhcnNlKCkuXG4gICAqL1xuICB2YXIgcmVuZGVyTWF0Y2hpbmcgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBcInByZS5ibG9ja3NcIjtcbiAgICB2YXIgb3B0aW9ucyA9IGV4dGVuZCh7XG4gICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgbGFuZ3VhZ2VzOiBbJ2VuJ10sXG5cbiAgICAgIHJlYWQ6IHJlYWRDb2RlLCAvLyBmdW5jdGlvbihlbCwgb3B0aW9ucykgPT4gY29kZVxuICAgICAgcGFyc2U6IHBhcnNlLCAgIC8vIGZ1bmN0aW9uKGNvZGUsIG9wdGlvbnMpID0+IGRvY1xuICAgICAgcmVuZGVyOiByZW5kZXIsIC8vIGZ1bmN0aW9uKGRvYywgY2IpID0+IHN2Z1xuICAgICAgcmVwbGFjZTogcmVwbGFjZSwgLy8gZnVuY3Rpb24oZWwsIHN2ZywgZG9jLCBvcHRpb25zKVxuICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgLy8gZmluZCBlbGVtZW50c1xuICAgIHZhciByZXN1bHRzID0gW10uc2xpY2UuYXBwbHkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgdmFyIGNvZGUgPSBvcHRpb25zLnJlYWQoZWwsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgZG9jID0gb3B0aW9ucy5wYXJzZShjb2RlLCBvcHRpb25zKTtcblxuICAgICAgb3B0aW9ucy5yZW5kZXIoZG9jLCBmdW5jdGlvbihzdmcpIHtcbiAgICAgICAgb3B0aW9ucy5yZXBsYWNlKGVsLCBzdmcsIGRvYywgb3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8qIFBhcnNlIHNjcmF0Y2hibG9ja3MgY29kZSBhbmQgcmV0dXJuIFhNTCBzdHJpbmcuXG4gICAqXG4gICAqIENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBOb2RlLCByZWFsbHkuXG4gICAqL1xuICB2YXIgcmVuZGVyU1ZHU3RyaW5nID0gZnVuY3Rpb24gKGNvZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZG9jID0gcGFyc2UoY29kZSwgb3B0aW9ucyk7XG5cbiAgICAvLyBXQVJOOiBEb2N1bWVudC5yZW5kZXIoKSBtYXkgYmVjb21lIGFzeW5jIGFnYWluIGluIGZ1dHVyZSA6LShcbiAgICBkb2MucmVuZGVyKGZ1bmN0aW9uKCkge30pO1xuXG4gICAgcmV0dXJuIGRvYy5leHBvcnRTVkdTdHJpbmcoKTtcbiAgfTtcblxuXG4gIHJldHVybiB7XG4gICAgYWxsTGFuZ3VhZ2VzOiBhbGxMYW5ndWFnZXMsIC8vIHJlYWQtb25seVxuICAgIGxvYWRMYW5ndWFnZXM6IGxvYWRMYW5ndWFnZXMsXG5cbiAgICBmcm9tSlNPTjogRG9jdW1lbnQuZnJvbUpTT04sXG4gICAgdG9KU09OOiBmdW5jdGlvbihkb2MpIHsgcmV0dXJuIGRvYy50b0pTT04oKTsgfSxcbiAgICBzdHJpbmdpZnk6IGZ1bmN0aW9uKGRvYykgeyByZXR1cm4gZG9jLnN0cmluZ2lmeSgpOyB9LFxuXG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcblxuICAgIHJlYWQ6IHJlYWRDb2RlLFxuICAgIHBhcnNlOiBwYXJzZSxcbiAgICAvLyByZW5kZXI6IHJlbmRlciwgLy8gUkVNT1ZFRCBzaW5jZSBkb2MucmVuZGVyKGNiKSBtYWtlcyBtdWNoIG1vcmUgc2Vuc2VcbiAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgIHJlbmRlck1hdGNoaW5nOiByZW5kZXJNYXRjaGluZyxcblxuICAgIHJlbmRlclNWR1N0cmluZzogcmVuZGVyU1ZHU3RyaW5nLFxuICAgIG1ha2VTdHlsZTogc3R5bGUubWFrZVN0eWxlLFxuICB9O1xuXG59KSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gIGZ1bmN0aW9uIGFzc2VydChib29sLCBtZXNzYWdlKSB7IGlmICghYm9vbCkgdGhyb3cgXCJBc3NlcnRpb24gZmFpbGVkISBcIiArIChtZXNzYWdlIHx8IFwiXCIpOyB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykgeyByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheTsgfVxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7IHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpOyB9XG5cbiAgZnVuY3Rpb24gaW5kZW50KHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zcGxpdChcIlxcblwiKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgcmV0dXJuIFwiICBcIiArIGxpbmU7XG4gICAgfSkuam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1heWJlTnVtYmVyKHYpIHtcbiAgICB2ID0gJycgKyB2O1xuICAgIHZhciBuID0gcGFyc2VJbnQodik7XG4gICAgaWYgKCFpc05hTihuKSkge1xuICAgICAgcmV0dXJuIG47XG4gICAgfVxuICAgIHZhciBmID0gcGFyc2VGbG9hdCh2KTtcbiAgICBpZiAoIWlzTmFOKGYpKSB7XG4gICAgICByZXR1cm4gZjtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuXG4gIHZhciBTVkcgPSByZXF1aXJlKCcuL2RyYXcuanMnKTtcblxuICB2YXIge1xuICAgIGRlZmF1bHRGb250RmFtaWx5LFxuICAgIG1ha2VTdHlsZSxcbiAgICBtYWtlSWNvbnMsXG4gICAgZGFya1JlY3QsXG4gICAgYmV2ZWxGaWx0ZXIsXG4gICAgZGFya0ZpbHRlcixcbiAgfSA9IHJlcXVpcmUoJy4vc3R5bGUuanMnKTtcblxuICB2YXIge1xuICAgIGJsb2Nrc0J5U2VsZWN0b3IsXG4gICAgcGFyc2VTcGVjLFxuICAgIGlucHV0UGF0LFxuICAgIGljb25QYXQsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIHVuaWNvZGVJY29ucyxcbiAgICBlbmdsaXNoLFxuICAgIGJsb2NrTmFtZSxcbiAgfSA9IHJlcXVpcmUoJy4vYmxvY2tzLmpzJyk7XG5cblxuXG5cbiAgLyogTGFiZWwgKi9cblxuICB2YXIgTGFiZWwgPSBmdW5jdGlvbih2YWx1ZSwgY2xzKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuY2xzID0gY2xzIHx8ICcnO1xuICAgIHRoaXMuZWwgPSBudWxsO1xuICAgIHRoaXMuaGVpZ2h0ID0gMTI7XG4gICAgdGhpcy5tZXRyaWNzID0gbnVsbDtcbiAgICB0aGlzLnggPSAwO1xuICB9O1xuICBMYWJlbC5wcm90b3R5cGUuaXNMYWJlbCA9IHRydWU7XG5cbiAgTGFiZWwucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBcIjxcIiB8fCB0aGlzLnZhbHVlID09PSBcIj5cIikgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgcmV0dXJuICh0aGlzLnZhbHVlXG4gICAgICAucmVwbGFjZSgvKFs8PltcXF0oKXt9XSkvZywgXCJcXFxcJDFcIilcbiAgICApO1xuICB9O1xuXG4gIExhYmVsLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWw7XG4gIH07XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExhYmVsLnByb3RvdHlwZSwgJ3dpZHRoJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXRyaWNzLndpZHRoO1xuICAgIH0sXG4gIH0pO1xuXG4gIExhYmVsLm1ldHJpY3NDYWNoZSA9IHt9O1xuICBMYWJlbC50b01lYXN1cmUgPSBbXTtcblxuICBMYWJlbC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgdmFyIGNscyA9IHRoaXMuY2xzO1xuICAgIHRoaXMuZWwgPSBTVkcudGV4dCgwLCAxMCwgdmFsdWUsIHtcbiAgICAgIGNsYXNzOiAnc2ItbGFiZWwgJyArIGNscyxcbiAgICB9KTtcblxuICAgIHZhciBjYWNoZSA9IExhYmVsLm1ldHJpY3NDYWNoZVtjbHNdO1xuICAgIGlmICghY2FjaGUpIHtcbiAgICAgIGNhY2hlID0gTGFiZWwubWV0cmljc0NhY2hlW2Nsc10gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cblxuICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChjYWNoZSwgdmFsdWUpKSB7XG4gICAgICB0aGlzLm1ldHJpY3MgPSBjYWNoZVt2YWx1ZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmb250ID0gL3NiLWNvbW1lbnQtbGFiZWwvLnRlc3QodGhpcy5jbHMpID8gJ2JvbGQgMTJweCBIZWxldmV0aWNhLCBBcmlhbCwgRGVqYVZ1IFNhbnMsIHNhbnMtc2VyaWYnXG4gICAgICAgICAgICAgICA6IC9zYi1saXRlcmFsLy50ZXN0KHRoaXMuY2xzKSA/ICdub3JtYWwgOXB4ICcgKyBkZWZhdWx0Rm9udEZhbWlseVxuICAgICAgICAgICAgICAgOiAnYm9sZCAxMHB4ICcgKyBkZWZhdWx0Rm9udEZhbWlseTtcbiAgICAgIHRoaXMubWV0cmljcyA9IGNhY2hlW3ZhbHVlXSA9IExhYmVsLm1lYXN1cmUodmFsdWUsIGZvbnQpO1xuICAgICAgLy8gVE9ETzogd29yZC1zcGFjaW5nPyAoZm9ydHVuYXRlbHkgaXQgc2VlbXMgdG8gaGF2ZSBubyBlZmZlY3QhKVxuICAgIH1cbiAgfTtcblxuICBMYWJlbC5tZWFzdXJlID0gZnVuY3Rpb24odmFsdWUsIGZvbnQpIHtcbiAgICB2YXIgY29udGV4dCA9IExhYmVsLm1lYXN1cmluZztcbiAgICBjb250ZXh0LmZvbnQgPSBmb250O1xuICAgIHZhciB0ZXh0TWV0cmljcyA9IGNvbnRleHQubWVhc3VyZVRleHQodmFsdWUpO1xuICAgIHZhciB3aWR0aCA9ICh0ZXh0TWV0cmljcy53aWR0aCArIDAuNSkgfCAwO1xuICAgIHJldHVybiB7IHdpZHRoOiB3aWR0aCB9O1xuICB9O1xuXG5cbiAgLyogSWNvbiAqL1xuXG4gIHZhciBJY29uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5pc0Fycm93ID0gbmFtZSA9PT0gJ2xvb3BBcnJvdyc7XG5cbiAgICB2YXIgaW5mbyA9IEljb24uaWNvbnNbbmFtZV07XG4gICAgYXNzZXJ0KGluZm8sIFwibm8gaW5mbyBmb3IgaWNvbiBcIiArIG5hbWUpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5mbyk7XG4gIH07XG4gIEljb24ucHJvdG90eXBlLmlzSWNvbiA9IHRydWU7XG5cbiAgSWNvbi5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHVuaWNvZGVJY29uc1tcIkBcIiArIHRoaXMubmFtZV0gfHwgXCJcIjtcbiAgfTtcblxuICBJY29uLmljb25zID0ge1xuICAgIGdyZWVuRmxhZzogeyB3aWR0aDogMTAsIGhlaWdodDogMjEsIGR5OiAtMiB9LFxuICAgIHR1cm5MZWZ0OiB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMiwgZHk6ICsxIH0sXG4gICAgdHVyblJpZ2h0OiB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMiwgZHk6ICsxIH0sXG4gICAgbG9vcEFycm93OiB7IHdpZHRoOiAxNCwgaGVpZ2h0OiAxMSB9LFxuICAgIGFkZElucHV0OiB7IHdpZHRoOiA0LCBoZWlnaHQ6IDggfSxcbiAgICBkZWxJbnB1dDogeyB3aWR0aDogNCwgaGVpZ2h0OiA4IH0sXG4gIH07XG4gIEljb24ucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gU1ZHLnN5bWJvbCgnIycgKyB0aGlzLm5hbWUsIHtcbiAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8qIElucHV0ICovXG5cbiAgdmFyIElucHV0ID0gZnVuY3Rpb24oc2hhcGUsIHZhbHVlLCBtZW51KSB7XG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLm1lbnUgPSBtZW51IHx8IG51bGw7XG5cbiAgICB0aGlzLmlzUm91bmQgPSBzaGFwZSA9PT0gJ251bWJlcicgfHwgc2hhcGUgPT09ICdudW1iZXItZHJvcGRvd24nO1xuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09ICdib29sZWFuJztcbiAgICB0aGlzLmlzU3RhY2sgPSBzaGFwZSA9PT0gJ3N0YWNrJztcbiAgICB0aGlzLmlzSW5zZXQgPSBzaGFwZSA9PT0gJ2Jvb2xlYW4nIHx8IHNoYXBlID09PSAnc3RhY2snIHx8IHNoYXBlID09PSAncmVwb3J0ZXInO1xuICAgIHRoaXMuaXNDb2xvciA9IHNoYXBlID09PSAnY29sb3InO1xuICAgIHRoaXMuaGFzQXJyb3cgPSBzaGFwZSA9PT0gJ2Ryb3Bkb3duJyB8fCBzaGFwZSA9PT0gJ251bWJlci1kcm9wZG93bic7XG4gICAgdGhpcy5pc0RhcmtlciA9IHNoYXBlID09PSAnYm9vbGVhbicgfHwgc2hhcGUgPT09ICdzdGFjaycgfHwgc2hhcGUgPT09ICdkcm9wZG93bic7XG4gICAgdGhpcy5pc1NxdWFyZSA9IHNoYXBlID09PSAnc3RyaW5nJyB8fCBzaGFwZSA9PT0gJ2NvbG9yJyB8fCBzaGFwZSA9PT0gJ2Ryb3Bkb3duJztcblxuICAgIHRoaXMuaGFzTGFiZWwgPSAhKHRoaXMuaXNDb2xvciB8fCB0aGlzLmlzSW5zZXQpO1xuICAgIHRoaXMubGFiZWwgPSB0aGlzLmhhc0xhYmVsID8gbmV3IExhYmVsKHZhbHVlLCBbJ3NiLWxpdGVyYWwtJyArIHRoaXMuc2hhcGVdKSA6IG51bGw7XG4gICAgdGhpcy54ID0gMDtcbiAgfTtcbiAgSW5wdXQucHJvdG90eXBlLmlzSW5wdXQgPSB0cnVlO1xuXG4gIElucHV0LmZyb21KU09OID0gZnVuY3Rpb24obGFuZywgdmFsdWUsIHBhcnQpIHtcbiAgICB2YXIgc2hhcGUgPSB7XG4gICAgICBiOiAnYm9vbGVhbicsXG4gICAgICBuOiAnbnVtYmVyJyxcbiAgICAgIHM6ICdzdHJpbmcnLFxuICAgICAgZDogJ251bWJlci1kcm9wZG93bicsXG4gICAgICBtOiAnZHJvcGRvd24nLFxuICAgICAgYzogJ2NvbG9yJyxcbiAgICB9W3BhcnRbMV1dO1xuXG4gICAgaWYgKHNoYXBlID09PSAnY29sb3InKSB7XG4gICAgICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwKSB2YWx1ZSA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAyNTYgKiAyNTYgKiAyNTYpO1xuICAgICAgdmFsdWUgPSArdmFsdWU7XG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4RkZGRkZGRkYgKyB2YWx1ZSArIDE7XG4gICAgICB2YXIgaGV4ID0gdmFsdWUudG9TdHJpbmcoMTYpO1xuICAgICAgaGV4ID0gaGV4LnNsaWNlKE1hdGgubWF4KDAsIGhleC5sZW5ndGggLSA2KSk7IC8vIGxhc3QgNiBjaGFyYWN0ZXJzXG4gICAgICB3aGlsZSAoaGV4Lmxlbmd0aCA8IDYpIGhleCA9ICcwJyArIGhleDtcbiAgICAgIGlmIChoZXhbMF0gPT09IGhleFsxXSAmJiBoZXhbMl0gPT09IGhleFszXSAmJiBoZXhbNF0gPT09IGhleFs1XSkge1xuICAgICAgICBoZXggPSBoZXhbMF0gKyBoZXhbMl0gKyBoZXhbNF07XG4gICAgICB9XG4gICAgICB2YWx1ZSA9ICcjJyArIGhleDtcbiAgICB9IGVsc2UgaWYgKHNoYXBlID09PSAnZHJvcGRvd24nKSB7XG4gICAgICB2YWx1ZSA9IHtcbiAgICAgICAgX21vdXNlXzogXCJtb3VzZS1wb2ludGVyXCIsXG4gICAgICAgIF9teXNlbGZfOiBcIm15c2VsZlwiLFxuICAgICAgICBfc3RhZ2VfOiBcIlN0YWdlXCIsXG4gICAgICAgIF9lZGdlXzogXCJlZGdlXCIsXG4gICAgICAgIF9yYW5kb21fOiBcInJhbmRvbSBwb3NpdGlvblwiLFxuICAgICAgfVt2YWx1ZV0gfHwgdmFsdWU7XG4gICAgICB2YXIgbWVudSA9IHZhbHVlO1xuICAgICAgdmFsdWUgPSBsYW5nLmRyb3Bkb3duc1t2YWx1ZV0gfHwgdmFsdWUgO1xuICAgIH0gZWxzZSBpZiAoc2hhcGUgPT09ICdudW1iZXItZHJvcGRvd24nKSB7XG4gICAgICB2YWx1ZSA9IGxhbmcuZHJvcGRvd25zW3ZhbHVlXSB8fCB2YWx1ZSA7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJbnB1dChzaGFwZSwgJycrdmFsdWUsIG1lbnUpO1xuICB9O1xuXG4gIElucHV0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc0NvbG9yKSB7XG4gICAgICBhc3NlcnQodGhpcy52YWx1ZVswXSA9PT0gJyMnKTtcbiAgICAgIHZhciBoID0gdGhpcy52YWx1ZS5zbGljZSgxKTtcbiAgICAgIGlmIChoLmxlbmd0aCA9PT0gMykgaCA9IGhbMF0gKyBoWzBdICsgaFsxXSArIGhbMV0gKyBoWzJdICsgaFsyXTtcbiAgICAgIHJldHVybiBwYXJzZUludChoLCAxNik7XG4gICAgICAvLyBUT0RPIHNpZ25lZCBpbnQ/XG4gICAgfVxuICAgIGlmICh0aGlzLmhhc0Fycm93KSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLm1lbnUgfHwgdGhpcy52YWx1ZTtcbiAgICAgIGlmICh0aGlzLnNoYXBlID09PSAnZHJvcGRvd24nKSB7XG4gICAgICAgIHZhbHVlID0ge1xuICAgICAgICAgIFwibW91c2UtcG9pbnRlclwiOiBcIl9tb3VzZV9cIixcbiAgICAgICAgICBcIm15c2VsZlwiOiBcIl9teXNlbGZcIixcbiAgICAgICAgICBcIlN0YWdlXCI6IFwiX3N0YWdlX1wiLFxuICAgICAgICAgIFwiZWRnZVwiOiBcIl9lZGdlX1wiLFxuICAgICAgICAgIFwicmFuZG9tIHBvc2l0aW9uXCI6IFwiX3JhbmRvbV9cIixcbiAgICAgICAgfVt2YWx1ZV0gfHwgdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc1JvdW5kKSB7XG4gICAgICAgIHZhbHVlID0gbWF5YmVOdW1iZXIodmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pc0Jvb2xlYW4gPyBmYWxzZSA6IHRoaXMuaXNSb3VuZCA/IG1heWJlTnVtYmVyKHRoaXMudmFsdWUpIDogdGhpcy52YWx1ZTtcbiAgfTtcblxuICBJbnB1dC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgYXNzZXJ0KHRoaXMudmFsdWVbMF0gPT09ICcjJyk7XG4gICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLnZhbHVlICsgXCJdXCI7XG4gICAgfVxuICAgIHZhciB0ZXh0ID0gKCh0aGlzLnZhbHVlID8gXCJcIiArIHRoaXMudmFsdWUgOiBcIlwiKVxuICAgICAgLnJlcGxhY2UoLyB2JC8sIFwiIFxcXFx2XCIpXG4gICAgICAucmVwbGFjZSgvKFtcXF1cXFxcXSkvZywgXCJcXFxcJDFcIilcbiAgICApO1xuICAgIGlmICh0aGlzLmhhc0Fycm93KSB0ZXh0ICs9IFwiIHZcIjtcbiAgICByZXR1cm4gdGhpcy5pc1JvdW5kID8gXCIoXCIgKyB0ZXh0ICsgXCIpXCJcbiAgICAgICAgIDogdGhpcy5pc1NxdWFyZSA/IFwiW1wiICsgdGV4dCArIFwiXVwiXG4gICAgICAgICA6IHRoaXMuaXNCb29sZWFuID8gXCI8PlwiXG4gICAgICAgICA6IHRoaXMuaXNTdGFjayA/IFwie31cIlxuICAgICAgICAgOiB0ZXh0O1xuICB9O1xuXG4gIElucHV0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgaWYgKHRoaXMuaGFzQXJyb3cpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVudSB8fCB0aGlzLnZhbHVlO1xuICAgICAgdGhpcy52YWx1ZSA9IGxhbmcuZHJvcGRvd25zW3ZhbHVlXSB8fCB2YWx1ZTtcbiAgICAgIHRoaXMubGFiZWwgPSBuZXcgTGFiZWwodGhpcy52YWx1ZSwgWydzYi1saXRlcmFsLScgKyB0aGlzLnNoYXBlXSk7XG4gICAgfVxuICB9O1xuXG4gIElucHV0LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaGFzTGFiZWwpIHRoaXMubGFiZWwubWVhc3VyZSgpO1xuICB9O1xuXG4gIElucHV0LnNoYXBlcyA9IHtcbiAgICAnc3RyaW5nJzogU1ZHLnJvdW5kZWRJbnB1dCwgLy9TVkcucmVjdFxuICAgICdudW1iZXInOiBTVkcucm91bmRlZElucHV0LFxuICAgICdudW1iZXItZHJvcGRvd24nOiBTVkcucm91bmRlZElucHV0LFxuICAgICdjb2xvcic6IFNWRy5yb3VuZGVkSW5wdXQsXG4gICAgJ2Ryb3Bkb3duJzogU1ZHLnJlY3QsXG5cbiAgICAnYm9vbGVhbic6IFNWRy5wb2ludGVkUmVjdCxcbiAgICAnc3RhY2snOiBTVkcuc3RhY2tSZWN0LFxuICAgICdyZXBvcnRlcic6IFNWRy5yb3VuZGVkUmVjdCxcbiAgfTtcblxuICBJbnB1dC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgIGlmICh0aGlzLmhhc0xhYmVsKSB7XG4gICAgICB2YXIgbGFiZWwgPSB0aGlzLmxhYmVsLmRyYXcoKTtcbiAgICAgIHZhciB3ID0gTWF0aC5tYXgoMTQsIHRoaXMubGFiZWwud2lkdGggKyAodGhpcy5zaGFwZSA9PT0gJ3N0cmluZycgfHwgdGhpcy5zaGFwZSA9PT0gJ251bWJlci1kcm9wZG93bicgPyA2IDogOSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdyA9IHRoaXMuaXNJbnNldCA/IDMwKjAuODUgOiB0aGlzLmlzQ29sb3IgPyAxMyoxLjUgOiBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5oYXNBcnJvdykgdyArPSAxMDtcbiAgICB0aGlzLndpZHRoID0gdztcblxuICAgIHZhciBoID0gdGhpcy5oZWlnaHQgPSB0aGlzLmlzUm91bmQgfHwgdGhpcy5pc0NvbG9yID8gMTMqMS41IDogMTQqMS4yNTsgLy9zY2FsZWQgaW5wdXRzXG5cbiAgICB2YXIgZWwgPSBJbnB1dC5zaGFwZXNbdGhpcy5zaGFwZV0odywgaCk7XG4gICAgaWYgKHRoaXMuaXNDb2xvcikge1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGZpbGw6IHRoaXMudmFsdWUsXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNEYXJrZXIpIHtcbiAgICAgIGVsID0gZGFya1JlY3QodywgaCwgcGFyZW50LmluZm8uY2F0ZWdvcnksIGVsKTtcbiAgICAgIGlmIChwYXJlbnQuaW5mby5jb2xvcikge1xuICAgICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgICBmaWxsOiBwYXJlbnQuaW5mby5jb2xvcixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IFNWRy5ncm91cChbXG4gICAgICBTVkcuc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgY2xhc3M6IFsnc2ItaW5wdXQnLCAnc2ItaW5wdXQtJyt0aGlzLnNoYXBlXS5qb2luKCcgJyksXG4gICAgICB9KSxcbiAgICBdKTtcbiAgICBpZiAodGhpcy5oYXNMYWJlbCkge1xuICAgICAgdmFyIHggPSB0aGlzLmlzUm91bmQgPyA1IDogNDtcbiAgICAgIHJlc3VsdC5hcHBlbmRDaGlsZChTVkcubW92ZSh4LTIsIDIsIGxhYmVsKSk7IC8vVE9ETyBmaXggdGV4dFxuICAgIH1cbiAgICBpZiAodGhpcy5oYXNBcnJvdykge1xuICAgICAgdmFyIHkgPSB0aGlzLnNoYXBlID09PSAnZHJvcGRvd24nID8gNSA6IDQ7XG4gICAgICByZXN1bHQuYXBwZW5kQ2hpbGQoU1ZHLm1vdmUodyAtIDEwLCB5LCBTVkcucG9seWdvbih7XG4gICAgICAgIHBvaW50czogW1xuICAgICAgICAgIDcsIDAsXG4gICAgICAgICAgMy41LCA0LFxuICAgICAgICAgIDAsIDAsXG4gICAgICAgIF0sXG4gICAgICAgIGZpbGw6ICcjMDAwJyxcbiAgICAgICAgb3BhY2l0eTogJzAuNicsXG4gICAgICB9KSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG5cbiAgLyogQmxvY2sgKi9cblxuICB2YXIgQmxvY2sgPSBmdW5jdGlvbihpbmZvLCBjaGlsZHJlbiwgY29tbWVudCkge1xuICAgIGFzc2VydChpbmZvKTtcbiAgICB0aGlzLmluZm8gPSBpbmZvO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICB0aGlzLmNvbW1lbnQgPSBjb21tZW50IHx8IG51bGw7XG5cbiAgICB2YXIgc2hhcGUgPSB0aGlzLmluZm8uc2hhcGU7XG4gICAgdGhpcy5pc0hhdCA9IHNoYXBlID09PSAnaGF0JyB8fCBzaGFwZSA9PT0gJ2RlZmluZS1oYXQnO1xuICAgIHRoaXMuaGFzUHV6emxlID0gc2hhcGUgPT09ICdzdGFjaycgfHwgc2hhcGUgPT09ICdoYXQnO1xuICAgIHRoaXMuaXNGaW5hbCA9IC9jYXAvLnRlc3Qoc2hhcGUpO1xuICAgIHRoaXMuaXNDb21tYW5kID0gc2hhcGUgPT09ICdzdGFjaycgfHwgc2hhcGUgPT09ICdjYXAnIHx8IC9ibG9jay8udGVzdChzaGFwZSk7XG4gICAgdGhpcy5pc091dGxpbmUgPSBzaGFwZSA9PT0gJ291dGxpbmUnO1xuICAgIHRoaXMuaXNSZXBvcnRlciA9IHNoYXBlID09PSAncmVwb3J0ZXInO1xuICAgIHRoaXMuaXNCb29sZWFuID0gc2hhcGUgPT09ICdib29sZWFuJztcblxuICAgIHRoaXMuaXNSaW5nID0gc2hhcGUgPT09ICdyaW5nJztcbiAgICB0aGlzLmhhc1NjcmlwdCA9IC9ibG9jay8udGVzdChzaGFwZSk7XG4gICAgdGhpcy5pc0Vsc2UgPSBzaGFwZSA9PT0gJ2NlbHNlJztcbiAgICB0aGlzLmlzRW5kID0gc2hhcGUgPT09ICdjZW5kJztcblxuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy53aWR0aCA9IG51bGw7XG4gICAgdGhpcy5oZWlnaHQgPSBudWxsO1xuICAgIHRoaXMuZmlyc3RMaW5lID0gbnVsbDtcbiAgICB0aGlzLmlubmVyV2lkdGggPSBudWxsO1xuICB9O1xuICBCbG9jay5wcm90b3R5cGUuaXNCbG9jayA9IHRydWU7XG5cbiAgQmxvY2suZnJvbUpTT04gPSBmdW5jdGlvbihsYW5nLCBhcnJheSwgcGFydCkge1xuICAgIHZhciBhcmdzID0gYXJyYXkuc2xpY2UoKTtcbiAgICB2YXIgc2VsZWN0b3IgPSBhcmdzLnNoaWZ0KCk7XG4gICAgaWYgKHNlbGVjdG9yID09PSAncHJvY0RlZicpIHtcbiAgICAgIHZhciBzcGVjID0gYXJnc1swXTtcbiAgICAgIHZhciBpbnB1dE5hbWVzID0gYXJnc1sxXS5zbGljZSgpO1xuICAgICAgLy8gdmFyIGRlZmF1bHRWYWx1ZXMgPSBhcmdzWzJdO1xuICAgICAgLy8gdmFyIGlzQXRvbWljID0gYXJnc1szXTsgLy8gVE9ET1xuXG4gICAgICB2YXIgaW5mbyA9IHBhcnNlU3BlYyhzcGVjKTtcbiAgICAgIHZhciBjaGlsZHJlbiA9IGluZm8ucGFydHMubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgaWYgKGlucHV0UGF0LnRlc3QocGFydCkpIHtcbiAgICAgICAgICB2YXIgbGFiZWwgPSBuZXcgTGFiZWwoaW5wdXROYW1lcy5zaGlmdCgpKTtcbiAgICAgICAgICByZXR1cm4gbmV3IEJsb2NrKHtcbiAgICAgICAgICAgIHNoYXBlOiBwYXJ0WzFdID09PSAnYicgPyAnYm9vbGVhbicgOiAncmVwb3J0ZXInLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjdXN0b20tYXJnJyxcbiAgICAgICAgICB9LCBbbGFiZWxdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IExhYmVsKHBhcnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHZhciBvdXRsaW5lID0gbmV3IEJsb2NrKHtcbiAgICAgICAgc2hhcGU6ICdvdXRsaW5lJyxcbiAgICAgIH0sIGNoaWxkcmVuKTtcblxuICAgICAgdmFyIGNoaWxkcmVuID0gW25ldyBMYWJlbChsYW5nLmRlZmluZVswXSksIG91dGxpbmVdO1xuICAgICAgcmV0dXJuIG5ldyBCbG9jayh7XG4gICAgICAgIHNoYXBlOiAnZGVmaW5lLWhhdCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY3VzdG9tJyxcbiAgICAgICAgc2VsZWN0b3I6ICdwcm9jRGVmJyxcbiAgICAgICAgY2FsbDogc3BlYyxcbiAgICAgICAgbmFtZXM6IGFyZ3NbMV0sXG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfSwgY2hpbGRyZW4pO1xuXG4gICAgfSBlbHNlIGlmIChzZWxlY3RvciA9PT0gJ2NhbGwnKSB7XG4gICAgICB2YXIgc3BlYyA9IGFyZ3Muc2hpZnQoKTtcbiAgICAgIHZhciBpbmZvID0gZXh0ZW5kKHBhcnNlU3BlYyhzcGVjKSwge1xuICAgICAgICBjYXRlZ29yeTogJ2N1c3RvbScsXG4gICAgICAgIHNoYXBlOiAnc3RhY2snLFxuICAgICAgICBzZWxlY3RvcjogJ2NhbGwnLFxuICAgICAgICBjYWxsOiBzcGVjLFxuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH0pO1xuICAgICAgdmFyIHBhcnRzID0gaW5mby5wYXJ0cztcblxuICAgIH0gZWxzZSBpZiAoc2VsZWN0b3IgPT09ICdyZWFkVmFyaWFibGUnIHx8IHNlbGVjdG9yID09PSAnY29udGVudHNPZkxpc3Q6JyB8fCBzZWxlY3RvciA9PT0gJ2dldFBhcmFtJykge1xuICAgICAgdmFyIHNoYXBlID0gc2VsZWN0b3IgPT09ICdnZXRQYXJhbScgJiYgYXJncy5wb3AoKSA9PT0gJ2InID8gJ2Jvb2xlYW4nIDogJ3JlcG9ydGVyJztcbiAgICAgIHZhciBpbmZvID0ge1xuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgIHNoYXBlOiBzaGFwZSxcbiAgICAgICAgY2F0ZWdvcnk6IHtcbiAgICAgICAgICAncmVhZFZhcmlhYmxlJzogJ3ZhcmlhYmxlcycsXG4gICAgICAgICAgJ2NvbnRlbnRzT2ZMaXN0Oic6ICdsaXN0JyxcbiAgICAgICAgICAnZ2V0UGFyYW0nOiAnY3VzdG9tLWFyZycsXG4gICAgICAgIH1bc2VsZWN0b3JdLFxuICAgICAgICBsYW5ndWFnZTogbGFuZyxcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQmxvY2soaW5mbywgW25ldyBMYWJlbChhcmdzWzBdKV0pO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpbmZvID0gZXh0ZW5kKGJsb2Nrc0J5U2VsZWN0b3Jbc2VsZWN0b3JdLCB7XG4gICAgICAgIGxhbmd1YWdlOiBsYW5nLFxuICAgICAgfSk7XG4gICAgICBhc3NlcnQoaW5mbywgXCJ1bmtub3duIHNlbGVjdG9yOiBcIiArIHNlbGVjdG9yKTtcbiAgICAgIHZhciBzcGVjID0gbGFuZy5jb21tYW5kc1tpbmZvLnNwZWNdIHx8IHNwZWM7XG4gICAgICB2YXIgcGFydHMgPSBzcGVjID8gcGFyc2VTcGVjKHNwZWMpLnBhcnRzIDogaW5mby5wYXJ0cztcbiAgICB9XG4gICAgdmFyIGNoaWxkcmVuID0gcGFydHMubWFwKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgIGlmIChpbnB1dFBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHJldHVybiAoaXNBcnJheShhcmcpID8gQmxvY2sgOiBJbnB1dCkuZnJvbUpTT04obGFuZywgYXJnLCBwYXJ0KTtcbiAgICAgIH0gZWxzZSBpZiAoaWNvblBhdC50ZXN0KHBhcnQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgSWNvbihwYXJ0LnNsaWNlKDEpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTGFiZWwocGFydC50cmltKCkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihsaXN0LCBpbmRleCkge1xuICAgICAgbGlzdCA9IGxpc3QgfHwgW107XG4gICAgICBhc3NlcnQoaXNBcnJheShsaXN0KSk7XG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBTY3JpcHQobGlzdC5tYXAoQmxvY2suZnJvbUpTT04uYmluZChudWxsLCBsYW5nKSkpKTtcbiAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2RvSWZFbHNlJyAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbChsYW5nLmNvbW1hbmRzW1wiZWxzZVwiXSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIFRPRE8gbG9vcCBhcnJvd3NcbiAgICByZXR1cm4gbmV3IEJsb2NrKGluZm8sIGNoaWxkcmVuKTtcbiAgfTtcblxuICBCbG9jay5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gdGhpcy5pbmZvLnNlbGVjdG9yO1xuICAgIHZhciBhcmdzID0gW107XG5cbiAgICBpZiAoc2VsZWN0b3IgPT09ICdwcm9jRGVmJykge1xuICAgICAgdmFyIGlucHV0TmFtZXMgPSB0aGlzLmluZm8ubmFtZXM7XG4gICAgICB2YXIgc3BlYyA9IHRoaXMuaW5mby5jYWxsO1xuICAgICAgdmFyIGluZm8gPSBwYXJzZVNwZWMoc3BlYyk7XG4gICAgICB2YXIgZGVmYXVsdFZhbHVlcyA9IGluZm8uaW5wdXRzLm1hcChmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgPT09ICclbicgPyAxXG4gICAgICAgICAgICAgOiBpbnB1dCA9PT0gJyViJyA/IGZhbHNlIDogXCJcIjtcbiAgICAgIH0pO1xuICAgICAgdmFyIGlzQXRvbWljID0gZmFsc2U7IC8vIFRPRE8gJ2RlZmluZS1hdG9taWMnID8/XG4gICAgICByZXR1cm4gWydwcm9jRGVmJywgc3BlYywgaW5wdXROYW1lcywgZGVmYXVsdFZhbHVlcywgaXNBdG9taWNdO1xuICAgIH1cblxuICAgIGlmIChzZWxlY3RvciA9PT0gJ3JlYWRWYXJpYWJsZScgfHwgc2VsZWN0b3IgPT09ICdjb250ZW50c09mTGlzdDonIHx8IHNlbGVjdG9yID09PSAnZ2V0UGFyYW0nKSB7XG4gICAgICBhcmdzLnB1c2goYmxvY2tOYW1lKHRoaXMpKTtcbiAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2dldFBhcmFtJykgYXJncy5wdXNoKHRoaXMuaXNCb29sZWFuID09PSAnYm9vbGVhbicgPyAnYicgOiAncicpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XG4gICAgICAgIGlmIChjaGlsZC5pc0lucHV0IHx8IGNoaWxkLmlzQmxvY2sgfHwgY2hpbGQuaXNTY3JpcHQpIHtcbiAgICAgICAgICBhcmdzLnB1c2goY2hpbGQudG9KU09OKCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2NhbGwnKSB7XG4gICAgICAgIHJldHVybiBbJ2NhbGwnLCB0aGlzLmluZm8uY2FsbF0uY29uY2F0KGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNlbGVjdG9yKSB0aHJvdyBcInVua25vd24gYmxvY2s6IFwiICsgdGhpcy5pbmZvLmhhc2g7XG4gICAgcmV0dXJuIFtzZWxlY3Rvcl0uY29uY2F0KGFyZ3MpO1xuICB9O1xuXG4gIEJsb2NrLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmlyc3RJbnB1dCA9IG51bGw7XG4gICAgdmFyIGNoZWNrQWxpYXMgPSBmYWxzZTtcbiAgICB2YXIgdGV4dCA9IHRoaXMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICBpZiAoY2hpbGQuaXNJY29uKSBjaGVja0FsaWFzID0gdHJ1ZTtcbiAgICAgIGlmICghZmlyc3RJbnB1dCAmJiAhKGNoaWxkLmlzTGFiZWwgfHwgY2hpbGQuaXNJY29uKSkgZmlyc3RJbnB1dCA9IGNoaWxkO1xuICAgICAgcmV0dXJuIGNoaWxkLmlzU2NyaXB0ID8gXCJcXG5cIiArIGluZGVudChjaGlsZC5zdHJpbmdpZnkoKSkgKyBcIlxcblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjaGlsZC5zdHJpbmdpZnkoKS50cmltKCkgKyBcIiBcIjtcbiAgICB9KS5qb2luKFwiXCIpLnRyaW0oKTtcblxuICAgIHZhciBsYW5nID0gdGhpcy5pbmZvLmxhbmd1YWdlO1xuICAgIGlmIChjaGVja0FsaWFzICYmIGxhbmcgJiYgdGhpcy5pbmZvLnNlbGVjdG9yKSB7XG4gICAgICB2YXIgdHlwZSA9IGJsb2Nrc0J5U2VsZWN0b3JbdGhpcy5pbmZvLnNlbGVjdG9yXTtcbiAgICAgIHZhciBzcGVjID0gdHlwZS5zcGVjO1xuICAgICAgdmFyIGFsaWFzID0gbGFuZy5uYXRpdmVBbGlhc2VzW3R5cGUuc3BlY11cbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICAvLyBUT0RPIG1ha2UgdHJhbnNsYXRlKCkgbm90IGluLXBsYWNlLCBhbmQgdXNlIHRoYXRcbiAgICAgICAgaWYgKGlucHV0UGF0LnRlc3QoYWxpYXMpICYmIGZpcnN0SW5wdXQpIHtcbiAgICAgICAgICBhbGlhcyA9IGFsaWFzLnJlcGxhY2UoaW5wdXRQYXQsIGZpcnN0SW5wdXQuc3RyaW5naWZ5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGlhcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKHRoaXMuaW5mby5zaGFwZSA9PT0gJ3JlcG9ydGVyJyAmJiB0aGlzLmluZm8uY2F0ZWdvcnkgPT09ICdsaXN0JylcbiAgICAgfHwgKHRoaXMuaW5mby5jYXRlZ29yeSA9PT0gJ2N1c3RvbScgJiYgdGhpcy5pbmZvLnNoYXBlID09PSAnc3RhY2snKSkge1xuICAgICAgdGV4dCArPSBcIiA6OiBcIiArIHRoaXMuaW5mby5jYXRlZ29yeTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaGFzU2NyaXB0ID8gdGV4dCArIFwiXFxuZW5kXCJcbiAgICAgICAgIDogdGhpcy5pbmZvLnNoYXBlID09PSAncmVwb3J0ZXInID8gXCIoXCIgKyB0ZXh0ICsgXCIpXCJcbiAgICAgICAgIDogdGhpcy5pbmZvLnNoYXBlID09PSAnYm9vbGVhbicgPyBcIjxcIiArIHRleHQgKyBcIj5cIlxuICAgICAgICAgOiB0ZXh0O1xuICB9O1xuXG4gIEJsb2NrLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nLCBpc1NoYWxsb3cpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLmluZm8uc2VsZWN0b3I7XG4gICAgaWYgKCFzZWxlY3RvcikgcmV0dXJuO1xuICAgIGlmIChzZWxlY3RvciA9PT0gJ3Byb2NEZWYnKSB7XG4gICAgICBhc3NlcnQodGhpcy5jaGlsZHJlblswXS5pc0xhYmVsKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0gPSBuZXcgTGFiZWwobGFuZy5kZWZpbmVbMF0gfHwgZW5nbGlzaC5kZWZpbmVbMF0pO1xuICAgIH1cbiAgICB2YXIgYmxvY2sgPSBibG9ja3NCeVNlbGVjdG9yW3NlbGVjdG9yXTtcbiAgICBpZiAoIWJsb2NrKSByZXR1cm47XG4gICAgdmFyIG5hdGl2ZVNwZWMgPSBsYW5nLmNvbW1hbmRzW2Jsb2NrLnNwZWNdO1xuICAgIGlmICghbmF0aXZlU3BlYykgcmV0dXJuO1xuICAgIHZhciBuYXRpdmVJbmZvID0gcGFyc2VTcGVjKG5hdGl2ZVNwZWMpO1xuICAgIHZhciBhcmdzID0gdGhpcy5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbCAmJiAhY2hpbGQuaXNJY29uO1xuICAgIH0pO1xuICAgIGlmICghaXNTaGFsbG93KSBhcmdzLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgIGNoaWxkLnRyYW5zbGF0ZShsYW5nKTtcbiAgICB9KTtcbiAgICB0aGlzLmNoaWxkcmVuID0gbmF0aXZlSW5mby5wYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCkge1xuICAgICAgdmFyIHBhcnQgPSBwYXJ0LnRyaW0oKTtcbiAgICAgIGlmICghcGFydCkgcmV0dXJuO1xuICAgICAgcmV0dXJuIGlucHV0UGF0LnRlc3QocGFydCkgPyBhcmdzLnNoaWZ0KClcbiAgICAgICAgICAgOiBpY29uUGF0LnRlc3QocGFydCkgPyBuZXcgSWNvbihwYXJ0LnNsaWNlKDEpKSA6IG5ldyBMYWJlbChwYXJ0KTtcbiAgICB9KS5maWx0ZXIoeCA9PiAhIXgpO1xuICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihhcmcpIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChhcmcpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5pbmZvLmxhbmd1YWdlID0gbGFuZztcbiAgICB0aGlzLmluZm8uaXNSVEwgPSBydGxMYW5ndWFnZXMuaW5kZXhPZihsYW5nLmNvZGUpID4gLTE7XG4gIH07XG5cbiAgQmxvY2sucHJvdG90eXBlLm1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgIGlmIChjaGlsZC5tZWFzdXJlKSBjaGlsZC5tZWFzdXJlKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbW1lbnQpIHRoaXMuY29tbWVudC5tZWFzdXJlKCk7XG4gIH07XG5cbiAgQmxvY2suc2hhcGVzID0ge1xuICAgICdzdGFjayc6IFNWRy5zdGFja1JlY3QsXG4gICAgJ2MtYmxvY2snOiBTVkcuc3RhY2tSZWN0LFxuICAgICdpZi1ibG9jayc6IFNWRy5zdGFja1JlY3QsXG4gICAgJ2NlbHNlJzogU1ZHLnN0YWNrUmVjdCxcbiAgICAnY2VuZCc6IFNWRy5zdGFja1JlY3QsXG5cbiAgICAnY2FwJzogU1ZHLmNhcFJlY3QsXG4gICAgJ3JlcG9ydGVyJzogU1ZHLnJvdW5kZWRSZWN0LFxuICAgICdib29sZWFuJzogU1ZHLnBvaW50ZWRSZWN0LFxuICAgICdoYXQnOiBTVkcuaGF0UmVjdCxcbiAgICAnZGVmaW5lLWhhdCc6IFNWRy5wcm9jSGF0UmVjdCxcbiAgICAncmluZyc6IFNWRy5yb3VuZGVkUmVjdCxcbiAgfTtcblxuICBCbG9jay5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbih3LCBoLCBsaW5lcykge1xuICAgIC8vIG1vdXRoc1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gU1ZHLm1vdXRoUmVjdCh3LCBoLCB0aGlzLmlzRmluYWwsIGxpbmVzLCB7XG4gICAgICAgIGNsYXNzOiBbJ3NiLScgKyB0aGlzLmluZm8uY2F0ZWdvcnksICdzYi1iZXZlbCddLmpvaW4oJyAnKSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIG91dGxpbmVzXG4gICAgaWYgKHRoaXMuaW5mby5zaGFwZSA9PT0gJ291dGxpbmUnKSB7XG4gICAgICByZXR1cm4gU1ZHLnNldFByb3BzKFNWRy5zdGFja1JlY3QodywgaCksIHtcbiAgICAgICAgY2xhc3M6ICdzYi1vdXRsaW5lJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHJpbmdzXG4gICAgaWYgKHRoaXMuaXNSaW5nKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuWzBdO1xuICAgICAgaWYgKGNoaWxkICYmIChjaGlsZC5pc0lucHV0IHx8IGNoaWxkLmlzQmxvY2sgfHwgY2hpbGQuaXNTY3JpcHQpKSB7XG4gICAgICAgIHZhciBzaGFwZSA9IGNoaWxkLmlzU2NyaXB0ID8gJ3N0YWNrJ1xuICAgICAgICAgICAgICAgICAgOiBjaGlsZC5pc0lucHV0ID8gY2hpbGQuc2hhcGUgOiBjaGlsZC5pbmZvLnNoYXBlO1xuICAgICAgICByZXR1cm4gU1ZHLnJpbmdSZWN0KHcsIGgsIGNoaWxkLnksIGNoaWxkLndpZHRoLCBjaGlsZC5oZWlnaHQsIHNoYXBlLCB7XG4gICAgICAgICAgY2xhc3M6IFsnc2ItJyArIHRoaXMuaW5mby5jYXRlZ29yeSwgJ3NiLWJldmVsJ10uam9pbignICcpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZnVuYyA9IEJsb2NrLnNoYXBlc1t0aGlzLmluZm8uc2hhcGVdO1xuICAgIGFzc2VydChmdW5jLCBcIm5vIHNoYXBlIGZ1bmM6IFwiICsgdGhpcy5pbmZvLnNoYXBlKTtcbiAgICByZXR1cm4gZnVuYyh3LCBoLCB7XG4gICAgICBjbGFzczogWydzYi0nICsgdGhpcy5pbmZvLmNhdGVnb3J5LCAnc2ItYmV2ZWwnXS5qb2luKCcgJyksXG4gICAgfSk7XG4gIH07XG5cbiAgQmxvY2sucHJvdG90eXBlLm1pbkRpc3RhbmNlID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBpZiAodGhpcy5pc0Jvb2xlYW4pIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIGNoaWxkLmlzUmVwb3J0ZXIgPyA0ICsgY2hpbGQuaGVpZ2h0LzQgfCAwIDpcbiAgICAgICAgY2hpbGQuaXNMYWJlbCA/IDUgKyBjaGlsZC5oZWlnaHQvMiB8IDAgOlxuICAgICAgICBjaGlsZC5pc0Jvb2xlYW4gfHwgY2hpbGQuc2hhcGUgPT09ICdib29sZWFuJyA/IDUgOlxuICAgICAgICAyICsgY2hpbGQuaGVpZ2h0LzIgfCAwXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc1JlcG9ydGVyKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoY2hpbGQuaXNJbnB1dCAmJiBjaGlsZC5pc1JvdW5kKSB8fCAoKGNoaWxkLmlzUmVwb3J0ZXIgfHwgY2hpbGQuaXNCb29sZWFuKSAmJiAhY2hpbGQuaGFzU2NyaXB0KSA/IDAgOlxuICAgICAgICBjaGlsZC5pc0xhYmVsID8gMiArIGNoaWxkLmhlaWdodC8yIHwgMCA6XG4gICAgICAgIC0yICsgY2hpbGQuaGVpZ2h0LzIgfCAwXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfTtcblxuICBCbG9jay5wYWRkaW5nID0ge1xuICAgICdoYXQnOiAgICAgICAgWzE1LCA2LCAyXSxcbiAgICAnZGVmaW5lLWhhdCc6IFsyMSwgOCwgOV0sXG4gICAgJ3JlcG9ydGVyJzogICBbMywgOCwgMV0sXG4gICAgJ2Jvb2xlYW4nOiAgICBbMywgOCwgMl0sXG4gICAgJ2NhcCc6ICAgICAgICBbNiwgNiwgMl0sXG4gICAgJ2MtYmxvY2snOiAgICBbMywgNiwgMl0sXG4gICAgJ2lmLWJsb2NrJzogICBbMywgNiwgMl0sXG4gICAgJ3JpbmcnOiAgICAgICBbNiwgNCwgNl0sXG4gICAgbnVsbDogICAgICAgICBbNCwgNiwgMl0sXG4gIH07XG5cbiAgQmxvY2sucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNEZWZpbmUgPSB0aGlzLmluZm8uc2hhcGUgPT09ICdkZWZpbmUtaGF0JztcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuXG4gICAgdmFyIHBhZGRpbmcgPSBCbG9jay5wYWRkaW5nW3RoaXMuaW5mby5zaGFwZV0gfHwgQmxvY2sucGFkZGluZ1tudWxsXTtcbiAgICB2YXIgcHQgPSBwYWRkaW5nWzBdLFxuICAgICAgICBweCA9IHBhZGRpbmdbMV0sXG4gICAgICAgIHBiID0gcGFkZGluZ1syXTtcblxuICAgIHZhciB5ID0gMDtcbiAgICB2YXIgTGluZSA9IGZ1bmN0aW9uKHkpIHtcbiAgICAgIHRoaXMueSA9IHk7XG4gICAgICB0aGlzLndpZHRoID0gMDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0geSA/IDEzKjEuNSA6IDE2KjEuNTsgLy9ibG9jayBoZWlnaHRcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcbiAgICB9O1xuXG4gICAgdmFyIGlubmVyV2lkdGggPSAwO1xuICAgIHZhciBzY3JpcHRXaWR0aCA9IDA7XG4gICAgdmFyIGxpbmUgPSBuZXcgTGluZSh5KTtcbiAgICBmdW5jdGlvbiBwdXNoTGluZShpc0xhc3QpIHtcbiAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbGluZS5oZWlnaHQgKz0gcHQgKyBwYjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmUuaGVpZ2h0ICs9IGlzTGFzdCA/IDAgOiArMjtcbiAgICAgICAgbGluZS55IC09IDE7XG4gICAgICB9XG4gICAgICB5ICs9IGxpbmUuaGVpZ2h0O1xuICAgICAgbGluZXMucHVzaChsaW5lKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmZvLmlzUlRMKSB7XG4gICAgICB2YXIgc3RhcnQgPSAwO1xuICAgICAgdmFyIGZsaXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2hpbGRyZW4gPSAoXG4gICAgICAgICAgY2hpbGRyZW4uc2xpY2UoMCwgc3RhcnQpLmNvbmNhdChcbiAgICAgICAgICBjaGlsZHJlbi5zbGljZShzdGFydCwgaSkucmV2ZXJzZSgpKVxuICAgICAgICAgIC5jb25jYXQoY2hpbGRyZW4uc2xpY2UoaSkpXG4gICAgICAgICk7XG4gICAgICB9LmJpbmQodGhpcyk7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8Y2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuW2ldLmlzU2NyaXB0KSB7XG4gICAgICAgICAgZmxpcCgpO1xuICAgICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH0gaWYgKHN0YXJ0IDwgaSkge1xuICAgICAgICBmbGlwKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxpbmVzID0gW107XG4gICAgZm9yICh2YXIgaT0wOyBpPGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgIGNoaWxkLmVsID0gY2hpbGQuZHJhdyh0aGlzKTtcblxuXG4gICAgICBpZiAoY2hpbGQuaXNTY3JpcHQgJiYgdGhpcy5pc0NvbW1hbmQpIHtcbiAgICAgICAgdGhpcy5oYXNTY3JpcHQgPSB0cnVlO1xuICAgICAgICBwdXNoTGluZSgpO1xuICAgICAgICBjaGlsZC55ID0geTtcbiAgICAgICAgbGluZXMucHVzaChjaGlsZCk7XG4gICAgICAgIHNjcmlwdFdpZHRoID0gTWF0aC5tYXgoc2NyaXB0V2lkdGgsIE1hdGgubWF4KDEsIGNoaWxkLndpZHRoKSk7XG4gICAgICAgIGNoaWxkLmhlaWdodCA9IE1hdGgubWF4KDEyLCBjaGlsZC5oZWlnaHQpICsgMztcbiAgICAgICAgeSArPSBjaGlsZC5oZWlnaHQ7XG4gICAgICAgIGxpbmUgPSBuZXcgTGluZSh5KTtcbiAgICAgIH0gZWxzZSBpZiAoY2hpbGQuaXNBcnJvdykge1xuICAgICAgICBsaW5lLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNtdyA9IGkgPiAwID8gMzAgOiAwOyAvLyAyN1xuICAgICAgICB2YXIgbWQgPSB0aGlzLmlzQ29tbWFuZCA/IDAgOiB0aGlzLm1pbkRpc3RhbmNlKGNoaWxkKTtcbiAgICAgICAgdmFyIG13ID0gdGhpcy5pc0NvbW1hbmQgPyAoY2hpbGQuaXNCbG9jayB8fCBjaGlsZC5pc0lucHV0ID8gY213IDogMCkgOiBtZDtcbiAgICAgICAgaWYgKG13ICYmICFsaW5lcy5sZW5ndGggJiYgbGluZS53aWR0aCA8IG13IC0gcHgpIHtcbiAgICAgICAgICBsaW5lLndpZHRoID0gbXcgLSBweDtcbiAgICAgICAgfVxuICAgICAgICBjaGlsZC54ID0gbGluZS53aWR0aDtcbiAgICAgICAgbGluZS53aWR0aCArPSBjaGlsZC53aWR0aDtcbiAgICAgICAgaW5uZXJXaWR0aCA9IE1hdGgubWF4KGlubmVyV2lkdGgsIGxpbmUud2lkdGggKyBNYXRoLm1heCgwLCBtZCAtIHB4KSk7XG4gICAgICAgIGxpbmUud2lkdGggKz0gNDtcbiAgICAgICAgaWYgKCFjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgbGluZS5oZWlnaHQgPSBNYXRoLm1heChsaW5lLmhlaWdodCwgY2hpbGQuaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgICBwdXNoTGluZSh0cnVlKTtcblxuICAgIGlubmVyV2lkdGggPSBNYXRoLm1heChpbm5lcldpZHRoICsgcHggKiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzSGF0IHx8IHRoaXMuaGFzU2NyaXB0ID8gODMgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQ29tbWFuZCB8fCB0aGlzLmlzT3V0bGluZSB8fCB0aGlzLmlzUmluZyA/IDM5IDogMjApO1xuICAgIHRoaXMuaGVpZ2h0ID0geTtcbiAgICB0aGlzLndpZHRoID0gc2NyaXB0V2lkdGggPyBNYXRoLm1heChpbm5lcldpZHRoLCAxNSArIHNjcmlwdFdpZHRoKSA6IGlubmVyV2lkdGg7XG4gICAgaWYgKGlzRGVmaW5lKSB7XG4gICAgICB2YXIgcCA9IE1hdGgubWluKDI2LCAzLjUgKyAwLjEzICogaW5uZXJXaWR0aCB8IDApIC0gMTg7XG4gICAgICB0aGlzLmhlaWdodCArPSBwO1xuICAgICAgcHQgKz0gMiAqIHA7XG4gICAgfVxuICAgIHRoaXMuZmlyc3RMaW5lID0gbGluZXNbMF07XG4gICAgdGhpcy5pbm5lcldpZHRoID0gaW5uZXJXaWR0aDtcblxuICAgIHZhciBvYmplY3RzID0gW107XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8bGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG4gICAgICBpZiAobGluZS5pc1NjcmlwdCkge1xuICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUoMTUsIGxpbmUueSwgbGluZS5lbCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGggPSBsaW5lLmhlaWdodDtcblxuICAgICAgZm9yICh2YXIgaj0wOyBqPGxpbmUuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gbGluZS5jaGlsZHJlbltqXTtcbiAgICAgICAgaWYgKGNoaWxkLmlzQXJyb3cpIHtcbiAgICAgICAgICBvYmplY3RzLnB1c2goU1ZHLm1vdmUoaW5uZXJXaWR0aCAtIDE1LCB0aGlzLmhlaWdodCAtIDMsIGNoaWxkLmVsKSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeSA9IHB0ICsgKGggLSBjaGlsZC5oZWlnaHQgLSBwdCAtIHBiKSAvIDIgLSAxO1xuICAgICAgICBpZiAoaXNEZWZpbmUgJiYgY2hpbGQuaXNMYWJlbCkge1xuICAgICAgICAgIHkgKz0gMztcbiAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0ljb24pIHtcbiAgICAgICAgICB5ICs9IGNoaWxkLmR5IHwgMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc1JpbmcpIHtcbiAgICAgICAgICBjaGlsZC55ID0gbGluZS55ICsgeXwwO1xuICAgICAgICAgIGlmIChjaGlsZC5pc0luc2V0KSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0cy5wdXNoKFNWRy5tb3ZlKHB4ICsgY2hpbGQueCwgbGluZS55ICsgeXwwLCBjaGlsZC5lbCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBlbCA9IHRoaXMuZHJhd1NlbGYoaW5uZXJXaWR0aCwgdGhpcy5oZWlnaHQsIGxpbmVzKTtcbiAgICBvYmplY3RzLnNwbGljZSgwLCAwLCBlbCk7XG4gICAgaWYgKHRoaXMuaW5mby5jb2xvcikge1xuICAgICAgc2V0UHJvcHMoZWwsIHtcbiAgICAgICAgZmlsbDogdGhpcy5pbmZvLmNvbG9yLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNWRy5ncm91cChvYmplY3RzKTtcbiAgfTtcblxuXG4gIC8qIENvbW1lbnQgKi9cblxuICB2YXIgQ29tbWVudCA9IGZ1bmN0aW9uKHZhbHVlLCBoYXNCbG9jaykge1xuICAgIHRoaXMubGFiZWwgPSBuZXcgTGFiZWwodmFsdWUsIFsnc2ItY29tbWVudC1sYWJlbCddKTtcbiAgICB0aGlzLndpZHRoID0gbnVsbDtcbiAgICB0aGlzLmhhc0Jsb2NrID0gaGFzQmxvY2s7XG4gIH07XG4gIENvbW1lbnQucHJvdG90eXBlLmlzQ29tbWVudCA9IHRydWU7XG4gIENvbW1lbnQubGluZUxlbmd0aCA9IDEyO1xuICBDb21tZW50LnByb3RvdHlwZS5oZWlnaHQgPSAyMDtcblxuICBDb21tZW50LnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIvLyBcIiArIHRoaXMubGFiZWwudmFsdWU7XG4gIH07XG5cbiAgQ29tbWVudC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGFiZWwubWVhc3VyZSgpO1xuICB9O1xuXG4gIENvbW1lbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFiZWxFbCA9IHRoaXMubGFiZWwuZHJhdygpO1xuXG4gICAgdGhpcy53aWR0aCA9IHRoaXMubGFiZWwud2lkdGggKyAxNjtcbiAgICByZXR1cm4gU1ZHLmdyb3VwKFtcbiAgICAgIFNWRy5jb21tZW50TGluZSh0aGlzLmhhc0Jsb2NrID8gQ29tbWVudC5saW5lTGVuZ3RoIDogMCwgNiksXG4gICAgICBTVkcuY29tbWVudFJlY3QodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtcbiAgICAgICAgY2xhc3M6ICdzYi1jb21tZW50JyxcbiAgICAgIH0pLFxuICAgICAgU1ZHLm1vdmUoOCwgNCwgbGFiZWxFbCksXG4gICAgXSk7XG4gIH07XG5cblxuICAvKiBTY3JpcHQgKi9cblxuICB2YXIgU2NyaXB0ID0gZnVuY3Rpb24oYmxvY2tzKSB7XG4gICAgdGhpcy5ibG9ja3MgPSBibG9ja3M7XG4gICAgdGhpcy5pc0VtcHR5ID0gIWJsb2Nrcy5sZW5ndGg7XG4gICAgdGhpcy5pc0ZpbmFsID0gIXRoaXMuaXNFbXB0eSAmJiBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmlzRmluYWw7XG4gICAgdGhpcy55ID0gMDtcbiAgfTtcbiAgU2NyaXB0LnByb3RvdHlwZS5pc1NjcmlwdCA9IHRydWU7XG5cbiAgU2NyaXB0LmZyb21KU09OID0gZnVuY3Rpb24obGFuZywgYmxvY2tzKSB7XG4gICAgLy8geCA9IGFycmF5WzBdLCB5ID0gYXJyYXlbMV07XG4gICAgcmV0dXJuIG5ldyBTY3JpcHQoYmxvY2tzLm1hcChCbG9jay5mcm9tSlNPTi5iaW5kKG51bGwsIGxhbmcpKSk7XG4gIH07XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5ibG9ja3NbMF0gJiYgdGhpcy5ibG9ja3NbMF0uaXNDb21tZW50KSByZXR1cm47XG4gICAgcmV0dXJuIHRoaXMuYmxvY2tzLm1hcChmdW5jdGlvbihibG9jaykge1xuICAgICAgcmV0dXJuIGJsb2NrLnRvSlNPTigpO1xuICAgIH0pO1xuICB9O1xuXG4gIFNjcmlwdC5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYmxvY2tzLm1hcChmdW5jdGlvbihibG9jaykge1xuICAgICAgdmFyIGxpbmUgPSBibG9jay5zdHJpbmdpZnkoKTtcbiAgICAgIGlmIChibG9jay5jb21tZW50KSBsaW5lICs9IFwiIFwiICsgYmxvY2suY29tbWVudC5zdHJpbmdpZnkoKTtcbiAgICAgIHJldHVybiBsaW5lO1xuICAgIH0pLmpvaW4oXCJcXG5cIik7XG4gIH07XG5cbiAgU2NyaXB0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgdGhpcy5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgYmxvY2sudHJhbnNsYXRlKGxhbmcpO1xuICAgIH0pO1xuICB9O1xuXG4gIFNjcmlwdC5wcm90b3R5cGUubWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLmJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5ibG9ja3NbaV0ubWVhc3VyZSgpO1xuICAgIH1cbiAgfTtcblxuICBTY3JpcHQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihpbnNpZGUpIHtcbiAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICB2YXIgeSA9IDA7XG4gICAgdGhpcy53aWR0aCA9IDA7XG4gICAgZm9yICh2YXIgaT0wOyBpPHRoaXMuYmxvY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoaW5zaWRlID8gMCA6IDIsIHksIGJsb2NrLmRyYXcoKSkpO1xuICAgICAgeSArPSBibG9jay5oZWlnaHQ7XG4gICAgICB0aGlzLndpZHRoID0gTWF0aC5tYXgodGhpcy53aWR0aCwgYmxvY2sud2lkdGgpO1xuXG4gICAgICB2YXIgY29tbWVudCA9IGJsb2NrLmNvbW1lbnQ7XG4gICAgICBpZiAoY29tbWVudCkge1xuICAgICAgICB2YXIgbGluZSA9IGJsb2NrLmZpcnN0TGluZTtcbiAgICAgICAgdmFyIGN4ID0gYmxvY2suaW5uZXJXaWR0aCArIDIgKyBDb21tZW50LmxpbmVMZW5ndGg7XG4gICAgICAgIHZhciBjeSA9IHkgLSBibG9jay5oZWlnaHQgKyAobGluZS5oZWlnaHQgLyAyKTtcbiAgICAgICAgdmFyIGVsID0gY29tbWVudC5kcmF3KCk7XG4gICAgICAgIGNoaWxkcmVuLnB1c2goU1ZHLm1vdmUoY3gsIGN5IC0gY29tbWVudC5oZWlnaHQgLyAyLCBlbCkpO1xuICAgICAgICB0aGlzLndpZHRoID0gTWF0aC5tYXgodGhpcy53aWR0aCwgY3ggKyBjb21tZW50LndpZHRoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5oZWlnaHQgPSB5O1xuICAgIGlmICghaW5zaWRlICYmICF0aGlzLmlzRmluYWwpIHtcbiAgICAgIHRoaXMuaGVpZ2h0ICs9IDM7XG4gICAgfVxuICAgIHJldHVybiBTVkcuZ3JvdXAoY2hpbGRyZW4pO1xuICB9O1xuXG5cbiAgLyogRG9jdW1lbnQgKi9cblxuICB2YXIgRG9jdW1lbnQgPSBmdW5jdGlvbihzY3JpcHRzKSB7XG4gICAgdGhpcy5zY3JpcHRzID0gc2NyaXB0cztcblxuICAgIHRoaXMud2lkdGggPSBudWxsO1xuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLmVsID0gbnVsbDtcbiAgICB0aGlzLmRlZnMgPSBudWxsO1xuICB9O1xuXG4gIERvY3VtZW50LmZyb21KU09OID0gZnVuY3Rpb24oc2NyaXB0YWJsZSwgbGFuZykge1xuICAgIHZhciBsYW5nID0gbGFuZyB8fCBlbmdsaXNoO1xuICAgIHZhciBzY3JpcHRzID0gc2NyaXB0YWJsZS5zY3JpcHRzLm1hcChmdW5jdGlvbihhcnJheSkge1xuICAgICAgdmFyIHNjcmlwdCA9IFNjcmlwdC5mcm9tSlNPTihsYW5nLCBhcnJheVsyXSk7XG4gICAgICBzY3JpcHQueCA9IGFycmF5WzBdO1xuICAgICAgc2NyaXB0LnkgPSBhcnJheVsxXTtcbiAgICAgIHJldHVybiBzY3JpcHQ7XG4gICAgfSk7XG4gICAgLy8gVE9ETyBzY3JpcHRhYmxlLnNjcmlwdENvbW1lbnRzXG4gICAgcmV0dXJuIG5ldyBEb2N1bWVudChzY3JpcHRzKTtcbiAgfTtcblxuICBEb2N1bWVudC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGpzb25TY3JpcHRzID0gdGhpcy5zY3JpcHRzLm1hcChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHZhciBqc29uQmxvY2tzID0gc2NyaXB0LnRvSlNPTigpO1xuICAgICAgaWYgKCFqc29uQmxvY2tzKSByZXR1cm47XG4gICAgICByZXR1cm4gWzEwLCBzY3JpcHQueSArIDEwLCBqc29uQmxvY2tzXTtcbiAgICB9KS5maWx0ZXIoeCA9PiAhIXgpO1xuICAgIHJldHVybiB7XG4gICAgICBzY3JpcHRzOiBqc29uU2NyaXB0cyxcbiAgICAgIC8vIHNjcmlwdENvbW1lbnRzOiBbXSwgLy8gVE9ET1xuICAgIH07XG4gIH07XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNjcmlwdHMubWFwKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgcmV0dXJuIHNjcmlwdC5zdHJpbmdpZnkoKTtcbiAgICB9KS5qb2luKFwiXFxuXFxuXCIpO1xuICB9O1xuXG4gIERvY3VtZW50LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihsYW5nKSB7XG4gICAgdGhpcy5zY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICBzY3JpcHQudHJhbnNsYXRlKGxhbmcpO1xuICAgIH0pO1xuICB9O1xuXG4gIERvY3VtZW50LnByb3RvdHlwZS5tZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICBzY3JpcHQubWVhc3VyZSgpO1xuICAgIH0pO1xuICB9O1xuXG4gIERvY3VtZW50LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihjYikge1xuICAgIC8vIG1lYXN1cmUgc3RyaW5nc1xuICAgIHRoaXMubWVhc3VyZSgpO1xuXG4gICAgLy8gVE9ETzogc2VwYXJhdGUgbGF5b3V0ICsgcmVuZGVyIHN0ZXBzLlxuICAgIC8vIHJlbmRlciBlYWNoIHNjcmlwdFxuICAgIHZhciB3aWR0aCA9IDA7XG4gICAgdmFyIGhlaWdodCA9IDA7XG4gICAgdmFyIGVsZW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaT0wOyBpPHRoaXMuc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNjcmlwdCA9IHRoaXMuc2NyaXB0c1tpXTtcbiAgICAgIGlmIChoZWlnaHQpIGhlaWdodCArPSAxMDtcbiAgICAgIHNjcmlwdC55ID0gaGVpZ2h0O1xuICAgICAgZWxlbWVudHMucHVzaChTVkcubW92ZSgwLCBoZWlnaHQsIHNjcmlwdC5kcmF3KCkpKTtcbiAgICAgIGhlaWdodCArPSBzY3JpcHQuaGVpZ2h0O1xuICAgICAgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgc2NyaXB0LndpZHRoICsgNCk7XG4gICAgfVxuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIC8vIHJldHVybiBTVkdcbiAgICB2YXIgc3ZnID0gU1ZHLm5ld1NWRyh3aWR0aCwgaGVpZ2h0KTtcbiAgICBzdmcuYXBwZW5kQ2hpbGQodGhpcy5kZWZzID0gU1ZHLndpdGhDaGlsZHJlbihTVkcuZWwoJ2RlZnMnKSwgW1xuICAgICAgICBiZXZlbEZpbHRlcignYmV2ZWxGaWx0ZXInLCBmYWxzZSksXG4gICAgICAgIGJldmVsRmlsdGVyKCdpbnB1dEJldmVsRmlsdGVyJywgdHJ1ZSksXG4gICAgICAgIGRhcmtGaWx0ZXIoJ2lucHV0RGFya0ZpbHRlcicpLFxuICAgIF0uY29uY2F0KG1ha2VJY29ucygpKSkpO1xuXG4gICAgc3ZnLmFwcGVuZENoaWxkKFNWRy5ncm91cChlbGVtZW50cykpO1xuICAgIHRoaXMuZWwgPSBzdmc7XG5cbiAgICAvLyBuYjogYXN5bmMgQVBJIG9ubHkgZm9yIGJhY2t3YXJkcy9mb3J3YXJkcyBjb21wYXRpYmlsaXR5IHJlYXNvbnMuXG4gICAgLy8gZGVzcGl0ZSBhcHBlYXJhbmNlcywgaXQgcnVucyBzeW5jaHJvbm91c2x5XG4gICAgY2Ioc3ZnKTtcbiAgfTtcblxuICAvKiBFeHBvcnQgU1ZHIGltYWdlIGFzIFhNTCBzdHJpbmcgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGFzc2VydCh0aGlzLmVsLCBcImNhbGwgZHJhdygpIGZpcnN0XCIpO1xuXG4gICAgdmFyIHN0eWxlID0gbWFrZVN0eWxlKCk7XG4gICAgdGhpcy5kZWZzLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB2YXIgeG1sID0gbmV3IFNWRy5YTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcodGhpcy5lbCk7XG4gICAgdGhpcy5kZWZzLnJlbW92ZUNoaWxkKHN0eWxlKTtcbiAgICByZXR1cm4geG1sO1xuICB9O1xuXG4gIC8qIEV4cG9ydCBTVkcgaW1hZ2UgYXMgZGF0YSBVUkkgKi9cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFNWRyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB4bWwgPSB0aGlzLmV4cG9ydFNWR1N0cmluZygpO1xuICAgIHJldHVybiAnZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsJyArIHhtbC5yZXBsYWNlKFxuICAgICAgL1sjXS9nLCBlbmNvZGVVUklDb21wb25lbnRcbiAgICApO1xuICB9XG5cbiAgRG9jdW1lbnQucHJvdG90eXBlLmV4cG9ydFBORyA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgdmFyIGNhbnZhcyA9IFNWRy5tYWtlQ2FudmFzKCk7XG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlO1xuICAgIGltYWdlLnNyYyA9IHRoaXMuZXhwb3J0U1ZHKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG5cbiAgICAgIGlmIChVUkwgJiYgVVJMLmNyZWF0ZU9iamVjdFVSTCAmJiBCbG9iICYmIGNhbnZhcy50b0Jsb2IpIHtcbiAgICAgICAgdmFyIGJsb2IgPSBjYW52YXMudG9CbG9iKGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgICAgICBjYihVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpKTtcbiAgICAgICAgfSwgJ2ltYWdlL3BuZycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2IoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJykpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcbiAgfVxuXG59KCk7XG4iLCJ2YXIgU1ZHID0gcmVxdWlyZSgnLi9kcmF3LmpzJyk7XG52YXIgRmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXIuanMnKTtcblxudmFyIFN0eWxlID0gbW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNzc0NvbnRlbnQ6IGBcbiAgICAuc2ItbGFiZWwge1xuICAgICAgZm9udC1mYW1pbHk6IFwiSGVsdmV0aWNhIE5ldWVcIiwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmO1xuICAgICAgb3BhY2l0eTogMC45O1xuICAgICAgZmlsbDogI2ZmZjtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHBhZGRpbmc6IDJweDtcbiAgICAgIGxldHRlci1zcGFjaW5nOiAwcHg7XG4gICAgICB2ZXJ0aWNhbC1hbGlnbjogaW5oZXJpdDtcbiAgICB9XG5cbiAgICAuc2Itb2Jzb2xldGUgeyBmaWxsOiAjZDQyODI4OyB9XG4gICAgLnNiLW1vdGlvbiB7IGZpbGw6ICM0Qzk3RkY7IH1cbiAgICAuc2ItbG9va3MgeyBmaWxsOiAjOTk2NkZGOyB9XG4gICAgLnNiLXNvdW5kIHsgZmlsbDogI0NGNjNDRjsgfVxuICAgIC5zYi1wZW4geyBmaWxsOiAjMGZCRDhDOyAgfVxuICAgIC5zYi1ldmVudHMgeyBmaWxsOiAjRkZCRjAwOyB9XG4gICAgLnNiLWNvbnRyb2wgeyBmaWxsOiAjRkZBQjE5OyB9XG4gICAgLnNiLXNlbnNpbmcgeyBmaWxsOiAjNUNCMUQ2OyB9XG4gICAgLnNiLW9wZXJhdG9ycyB7IGZpbGw6ICM1OUMwNTk7IH1cbiAgICAuc2ItdmFyaWFibGVzIHsgZmlsbDogI0ZGOEMxQTsgfVxuICAgIC5zYi1saXN0IHsgZmlsbDogI0ZGNjYxQSB9XG4gICAgLnNiLWN1c3RvbSB7IGZpbGw6ICNGRjY2ODA7IH1cbiAgICAuc2ItY3VzdG9tLWFyZyB7IGZpbGw6ICNGRjY2ODA7IH1cbiAgICAuc2ItZXh0ZW5zaW9uIHsgZmlsbDogIzRiNGE2MDsgfVxuICAgIC5zYi1ncmV5IHsgZmlsbDogIzk2OTY5NjsgfVxuXG4gICAgLnNiLWJldmVsIHtcbiAgICAgIGZpbHRlcjI6IHVybCgjYmV2ZWxGaWx0ZXIpO1xuICAgICAgc3Ryb2tlOiAjMDAwO1xuICAgICAgc3Ryb2tlLW9wYWNpdHk6IDAuMjtcbiAgICAgIHN0cm9rZS1hbGlnbm1lbnQ6IGlubmVyO1xuICAgIH1cblxuICAgIC5zYi1pbnB1dCB7XG4gICAgICBmaWx0ZXIyOiB1cmwoI2lucHV0QmV2ZWxGaWx0ZXIpO1xuICAgICAgZmlsbDogIzAwMDtcbiAgICAgIGZpbGwtb3BhY2l0eTogMTtcbiAgICAgIHN0cm9rZTogIzAwMDtcbiAgICAgIHN0cm9rZS1vcGFjaXR5OiAwLjE7XG4gICAgfVxuICAgIC5zYi1pbnB1dC1udW1iZXIsXG4gICAgLnNiLWlucHV0LXN0cmluZyxcbiAgICAuc2ItaW5wdXQtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICNmZmY7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duLFxuICAgIC5zYi1saXRlcmFsLWRyb3Bkb3duIHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICBsZXR0ZXItc3BhY2luZzogMHB4O1xuICAgICAgd29yZC1zcGFjaW5nOiAwO1xuICAgICAgdGV4dC1vcGFjaXR5OiAwLjk7XG4gICAgfVxuICAgIC5zYi1saXRlcmFsLW51bWJlcixcbiAgICAuc2ItbGl0ZXJhbC1zdHJpbmcsXG4gICAgLnNiLWxpdGVyYWwtbnVtYmVyLWRyb3Bkb3duIHtcbiAgICAgIGZpbGw6ICMwMDA7XG4gICAgfVxuXG4gICAgLnNiLWRhcmtlciB7XG4gICAgICBmaWx0ZXI6IHVybCgjaW5wdXREYXJrRmlsdGVyKTtcbiAgICB9XG5cbiAgICAuc2Itb3V0bGluZSB7XG4gICAgICBzdHJva2U6ICNmZmY7XG4gICAgICBzdHJva2Utb3BhY2l0eTogMDtcbiAgICAgIHN0cm9rZS13aWR0aDogMjtcbiAgICAgIGZpbGw6ICNGRjRENkE7XG4gICAgfVxuXG4gICAgLnNiLWRlZmluZS1oYXQtY2FwIHtcbiAgICAgIHN0cm9rZTogIzYzMmQ5OTtcbiAgICAgIHN0cm9rZS13aWR0aDogMjtcbiAgICAgIGZpbGw6ICM4ZTJlYzIwMDtcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuXG4gICAgLnNiLWNvbW1lbnQge1xuICAgICAgZmlsbDogI2ZmZmZhNTtcbiAgICAgIHN0cm9rZTogI2QwZDFkMjtcbiAgICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICB9XG4gICAgLnNiLWNvbW1lbnQtbGluZSB7XG4gICAgICBmaWxsOiAjZmZmZjgwO1xuICAgIH1cbiAgICAuc2ItY29tbWVudC1sYWJlbCB7XG4gICAgICBmb250LWZhbWlseTogSGVsZXZldGljYSwgQXJpYWwsIERlamFWdSBTYW5zLCBzYW5zLXNlcmlmO1xuICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICBmaWxsOiAjNWM1ZDVmO1xuICAgICAgd29yZC1zcGFjaW5nOiAwO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgbGV0dGVyLXNwYWNpbmc6IDBweDtcbiAgICB9XG4gIGAucmVwbGFjZSgvWyBcXG5dKy8sICcgJyksXG5cbiAgbWFrZUljb25zKCkge1xuICAgIHJldHVybiBbXG4gICAgICBTVkcuZWwoJ3BhdGgnLCB7XG4gICAgICAgIGQ6IFwiTTIwLjYsNC44bC0wLjEsOS4xYzAsMCwwLDAuMSwwLDAuMWMtMi41LDItNi4xLDItOC42LDBjLTEuMS0wLjktMi41LTEuNC00LTEuNGMtMS4yLDAuMS0yLjMsMC41LTMuNCwxLjFWNCBDNywyLjYsMTAsMi45LDEyLjIsNC42YzIuNCwxLjksNS43LDEuOSw4LjEsMGMwLjEsMCwwLjEsMCwwLjIsMEMyMC41LDQuNywyMC42LDQuNywyMC42LDQuOHpcIixcbiAgICAgICAgZmlsbDogJyM0Y2JmNTYnLFxuICAgICAgICBzdHJva2U6ICcjNDU5OTNkJyxcbiAgICAgICAgaWQ6ICdncmVlbkZsYWcnLFxuICAgICAgfSksXG4gICAgICBTVkcuZWwoJ3BhdGgnLCB7XG4gICAgICAgIGQ6IFwiTTYuNzI0IDBDMy4wMSAwIDAgMi45MSAwIDYuNWMwIDIuMzE2IDEuMjUzIDQuMzUgMy4xNCA1LjVINS4xN3YtMS4yNTZDMy4zNjQgMTAuMTI2IDIuMDcgOC40NiAyLjA3IDYuNSAyLjA3IDQuMDE1IDQuMTUyIDIgNi43MjMgMmMxLjE0IDAgMi4xODQuMzk2IDIuOTkzIDEuMDUzTDguMzEgNC4xM2MtLjQ1LjM0NC0uMzk4LjgyNi4xMSAxLjA4TDE1IDguNSAxMy44NTguOTkyYy0uMDgzLS41NDctLjUxNC0uNzE0LS45NjMtLjM3bC0xLjUzMiAxLjE3MkE2LjgyNSA2LjgyNSAwIDAgMCA2LjcyMyAwelwiLFxuICAgICAgICBmaWxsOiAnI2ZmZicsXG4gICAgICAgIGlkOiAndHVyblJpZ2h0JyxcbiAgICAgIH0pLFxuICAgICAgU1ZHLmVsKCdwYXRoJywge1xuICAgICAgICBkOiBcIk0zLjYzNyAxLjc5NEE2LjgyNSA2LjgyNSAwIDAgMSA4LjI3NyAwQzExLjk5IDAgMTUgMi45MSAxNSA2LjVjMCAyLjMxNi0xLjI1MyA0LjM1LTMuMTQgNS41SDkuODN2LTEuMjU2YzEuODA4LS42MTggMy4xMDMtMi4yODUgMy4xMDMtNC4yNDQgMC0yLjQ4NS0yLjA4My00LjUtNC42NTQtNC41LTEuMTQgMC0yLjE4NC4zOTYtMi45OTMgMS4wNTNMNi42OSA0LjEzYy40NS4zNDQuMzk4LjgyNi0uMTEgMS4wOEwwIDguNSAxLjE0Mi45OTJjLjA4My0uNTQ3LjUxNC0uNzE0Ljk2My0uMzdsMS41MzIgMS4xNzJ6XCIsXG4gICAgICAgIGZpbGw6ICcjZmZmJyxcbiAgICAgICAgaWQ6ICd0dXJuTGVmdCcsXG4gICAgICB9KSxcbiAgICAgIFNWRy5lbCgncGF0aCcsIHtcbiAgICAgICAgZDogXCJNMCAwTDQgNEwwIDhaXCIsXG4gICAgICAgIGZpbGw6ICcjMTExJyxcbiAgICAgICAgaWQ6ICdhZGRJbnB1dCcsXG4gICAgICB9KSxcbiAgICAgIFNWRy5lbCgncGF0aCcsIHtcbiAgICAgICAgZDogXCJNNCAwTDQgOEwwIDRaXCIsXG4gICAgICAgIGZpbGw6ICcjMTExJyxcbiAgICAgICAgaWQ6ICdkZWxJbnB1dCcsXG4gICAgICB9KSxcbiAgICAgIFNWRy5zZXRQcm9wcyhTVkcuZ3JvdXAoW1xuICAgICAgICBTVkcuZWwoJ3BhdGgnLCB7XG4gICAgICAgICAgZDogXCJNOCAwbDIgLTJsMCAtM2wzIDBsLTQgLTVsLTQgNWwzIDBsMCAzbC04IDBsMCAyXCIsXG4gICAgICAgICAgZmlsbDogJyMwMDAnLFxuICAgICAgICAgIG9wYWNpdHk6ICcwLjMnLFxuICAgICAgICB9KSxcbiAgICAgICAgU1ZHLm1vdmUoLTEsIC0xLCBTVkcuZWwoJ3BhdGgnLCB7XG4gICAgICAgICAgZDogXCJNOCAwbDIgLTJsMCAtM2wzIDBsLTQgLTVsLTQgNWwzIDBsMCAzbC04IDBsMCAyXCIsXG4gICAgICAgICAgZmlsbDogJyNmZmYnLFxuICAgICAgICAgIG9wYWNpdHk6ICcwLjknLFxuICAgICAgICB9KSksXG4gICAgICBdKSwge1xuICAgICAgICBpZDogJ2xvb3BBcnJvdycsXG4gICAgICB9KSxcbiAgICBdO1xuICB9LFxuXG4gIG1ha2VTdHlsZSgpIHtcbiAgICB2YXIgc3R5bGUgPSBTVkcuZWwoJ3N0eWxlJyk7XG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoU1ZHLmNkYXRhKFN0eWxlLmNzc0NvbnRlbnQpKTtcbiAgICByZXR1cm4gc3R5bGU7XG4gIH0sXG5cbiAgYmV2ZWxGaWx0ZXIoaWQsIGluc2V0KSB7XG4gICAgdmFyIGYgPSBuZXcgRmlsdGVyKGlkKTtcblxuICAgIHZhciBhbHBoYSA9ICdTb3VyY2VBbHBoYSc7XG4gICAgdmFyIHMgPSBpbnNldCA/IC0xIDogMTtcbiAgICB2YXIgYmx1ciA9IGYuYmx1cigxLCBhbHBoYSk7XG5cbiAgICBmLm1lcmdlKFtcbiAgICAgICdTb3VyY2VHcmFwaGljJyxcbiAgICAgIGYuY29tcCgnaW4nLFxuICAgICAgICAgICBmLmZsb29kKCcjZmZmJywgMC4xNSksXG4gICAgICAgICAgIGYuc3VidHJhY3QoYWxwaGEsIGYub2Zmc2V0KCtzLCArcywgYmx1cikpXG4gICAgICApLFxuICAgICAgZi5jb21wKCdpbicsXG4gICAgICAgICAgIGYuZmxvb2QoJyMwMDAnLCAwLjcpLFxuICAgICAgICAgICBmLnN1YnRyYWN0KGFscGhhLCBmLm9mZnNldCgtcywgLXMsIGJsdXIpKVxuICAgICAgKSxcbiAgICBdKTtcblxuICAgIHJldHVybiBmLmVsO1xuICB9LFxuXG4gIGRhcmtGaWx0ZXIoaWQpIHtcbiAgICB2YXIgZiA9IG5ldyBGaWx0ZXIoaWQpO1xuXG4gICAgZi5tZXJnZShbXG4gICAgICAnU291cmNlR3JhcGhpYycsXG4gICAgICBmLmNvbXAoJ2luJyxcbiAgICAgICAgZi5mbG9vZCgnIzAwMCcsIDAuMiksXG4gICAgICAgICdTb3VyY2VBbHBoYScpLFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIGYuZWw7XG4gIH0sXG5cbiAgZGFya1JlY3QodywgaCwgY2F0ZWdvcnksIGVsKSB7XG4gICAgcmV0dXJuIFNWRy5zZXRQcm9wcyhTVkcuZ3JvdXAoW1xuICAgICAgU1ZHLnNldFByb3BzKGVsLCB7XG4gICAgICAgIGNsYXNzOiBbJ3NiLScrY2F0ZWdvcnksICdzYi1kYXJrZXInXS5qb2luKCcgJyksXG4gICAgICB9KVxuICAgIF0pLCB7IHdpZHRoOiB3LCBoZWlnaHQ6IGggfSk7XG4gIH0sXG5cbiAgZGVmYXVsdEZvbnRGYW1pbHk6ICdMdWNpZGEgR3JhbmRlLCBWZXJkYW5hLCBBcmlhbCwgRGVqYVZ1IFNhbnMsIHNhbnMtc2VyaWYnLFxuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICBmdW5jdGlvbiBleHRlbmQoc3JjLCBkZXN0KSB7IHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZXN0LCBzcmMpOyB9XG4gIGZ1bmN0aW9uIGlzQXJyYXkobykgeyByZXR1cm4gbyAmJiBvLmNvbnN0cnVjdG9yID09PSBBcnJheTsgfVxuICBmdW5jdGlvbiBhc3NlcnQoYm9vbCwgbWVzc2FnZSkgeyBpZiAoIWJvb2wpIHRocm93IFwiQXNzZXJ0aW9uIGZhaWxlZCEgXCIgKyAobWVzc2FnZSB8fCBcIlwiKTsgfVxuXG4gIHZhciB7XG4gICAgTGFiZWwsXG4gICAgSWNvbixcbiAgICBJbnB1dCxcbiAgICBCbG9jayxcbiAgICBDb21tZW50LFxuICAgIFNjcmlwdCxcbiAgICBEb2N1bWVudCxcbiAgfSA9IHJlcXVpcmUoJy4vbW9kZWwuanMnKTtcblxuICB2YXIge1xuICAgIGFsbExhbmd1YWdlcyxcbiAgICBsb29rdXBEcm9wZG93bixcbiAgICBoZXhDb2xvclBhdCxcbiAgICBtaW5pZnlIYXNoLFxuICAgIGxvb2t1cEhhc2gsXG4gICAgaGFzaFNwZWMsXG4gICAgYXBwbHlPdmVycmlkZXMsXG4gICAgcnRsTGFuZ3VhZ2VzLFxuICAgIGljb25QYXQsXG4gICAgYmxvY2tOYW1lLFxuICB9ID0gcmVxdWlyZSgnLi9ibG9ja3MuanMnKTtcblxuXG4gIGZ1bmN0aW9uIHBhaW50QmxvY2soaW5mbywgY2hpbGRyZW4sIGxhbmd1YWdlcykge1xuICAgIHZhciBvdmVycmlkZXMgPSBbXTtcbiAgICBpZiAoaXNBcnJheShjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSkpIHtcbiAgICAgIG92ZXJyaWRlcyA9IGNoaWxkcmVuLnBvcCgpO1xuICAgIH1cblxuICAgIC8vIGJ1aWxkIGhhc2hcbiAgICB2YXIgd29yZHMgPSBbXTtcbiAgICBmb3IgKHZhciBpPTA7IGk8Y2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGNoaWxkLmlzTGFiZWwpIHtcbiAgICAgICAgd29yZHMucHVzaChjaGlsZC52YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGNoaWxkLmlzSWNvbikge1xuICAgICAgICB3b3Jkcy5wdXNoKFwiQFwiICsgY2hpbGQubmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3b3Jkcy5wdXNoKFwiX1wiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGhhc2ggPSBpbmZvLmhhc2ggPSBtaW5pZnlIYXNoKHdvcmRzLmpvaW4oXCIgXCIpKTtcblxuICAgIC8vIHBhaW50XG4gICAgdmFyIG8gPSBsb29rdXBIYXNoKGhhc2gsIGluZm8sIGNoaWxkcmVuLCBsYW5ndWFnZXMpO1xuICAgIGlmIChvKSB7XG4gICAgICB2YXIgbGFuZyA9IG8ubGFuZztcbiAgICAgIHZhciB0eXBlID0gby50eXBlO1xuICAgICAgaW5mby5sYW5ndWFnZSA9IGxhbmc7XG4gICAgICBpbmZvLmlzUlRMID0gcnRsTGFuZ3VhZ2VzLmluZGV4T2YobGFuZy5jb2RlKSA+IC0xO1xuXG4gICAgICBpZiAodHlwZS5zaGFwZSA9PT0gJ3JpbmcnID8gaW5mby5zaGFwZSA9PT0gJ3JlcG9ydGVyJyA6IGluZm8uc2hhcGUgPT09ICdzdGFjaycpIHtcbiAgICAgICAgaW5mby5zaGFwZSA9IHR5cGUuc2hhcGU7XG4gICAgICB9XG4gICAgICBpbmZvLmNhdGVnb3J5ID0gdHlwZS5jYXRlZ29yeTtcbiAgICAgIGluZm8uY2F0ZWdvcnlJc0RlZmF1bHQgPSBmYWxzZTtcbiAgICAgIGlmICh0eXBlLnNlbGVjdG9yKSBpbmZvLnNlbGVjdG9yID0gdHlwZS5zZWxlY3RvcjsgLy8gZm9yIHRvSlNPTlxuICAgICAgaW5mby5oYXNMb29wQXJyb3cgPSB0eXBlLmhhc0xvb3BBcnJvdztcblxuICAgICAgLy8gZWxsaXBzaXMgYmxvY2tcbiAgICAgIGlmICh0eXBlLnNwZWMgPT09IFwiLiAuIC5cIikge1xuICAgICAgICBjaGlsZHJlbiA9IFtuZXcgTGFiZWwoXCIuIC4gLlwiKV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gb3ZlcnJpZGVzXG4gICAgYXBwbHlPdmVycmlkZXMoaW5mbywgb3ZlcnJpZGVzKTtcblxuICAgIC8vIGxvb3AgYXJyb3dzXG4gICAgaWYgKGluZm8uaGFzTG9vcEFycm93KSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKG5ldyBJY29uKCdsb29wQXJyb3cnKSk7XG4gICAgfVxuXG4gICAgdmFyIGJsb2NrID0gbmV3IEJsb2NrKGluZm8sIGNoaWxkcmVuKTtcblxuICAgIC8vIGltYWdlIHJlcGxhY2VtZW50XG4gICAgaWYgKHR5cGUgJiYgaWNvblBhdC50ZXN0KHR5cGUuc3BlYykpIHtcbiAgICAgIGJsb2NrLnRyYW5zbGF0ZShsYW5nLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG5cblxuXG5cbiAgZnVuY3Rpb24gcGFyc2VMaW5lcyhjb2RlLCBsYW5ndWFnZXMpIHtcbiAgICB2YXIgdG9rID0gY29kZVswXTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICB0b2sgPSBjb2RlWysraW5kZXhdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWVrKCkge1xuICAgICAgcmV0dXJuIGNvZGVbaW5kZXggKyAxXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVla05vbldzKCkge1xuICAgICAgZm9yICh2YXIgaSA9IGluZGV4ICsgMTsgaTxjb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjb2RlW2ldICE9PSAnICcpIHJldHVybiBjb2RlW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2F3Tkw7XG5cbiAgICB2YXIgZGVmaW5lID0gW107XG4gICAgbGFuZ3VhZ2VzLm1hcChmdW5jdGlvbihsYW5nKSB7XG4gICAgICBkZWZpbmUgPSBkZWZpbmUuY29uY2F0KGxhbmcuZGVmaW5lKTtcbiAgICB9KTtcbiAgICAvLyBOQi4gd2UgYXNzdW1lICdkZWZpbmUnIGlzIGEgc2luZ2xlIHdvcmQgaW4gZXZlcnkgbGFuZ3VhZ2VcbiAgICBmdW5jdGlvbiBpc0RlZmluZSh3b3JkKSB7XG4gICAgICByZXR1cm4gZGVmaW5lLmluZGV4T2Yod29yZCkgPiAtMTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQmxvY2soc2hhcGUsIGNoaWxkcmVuKSB7XG4gICAgICB2YXIgaGFzSW5wdXRzID0gISFjaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4gIXguaXNMYWJlbCB9KS5sZW5ndGg7XG4gICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgc2hhcGU6IHNoYXBlLFxuICAgICAgICBjYXRlZ29yeTogc2hhcGUgPT09ICdkZWZpbmUtaGF0JyA/ICdjdXN0b20nXG4gICAgICAgICAgICAgICAgOiBzaGFwZSA9PT0gJ3JlcG9ydGVyJyAmJiAhaGFzSW5wdXRzID8gJ3ZhcmlhYmxlcycgOiAnb2Jzb2xldGUnLFxuICAgICAgICBjYXRlZ29yeUlzRGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgaGFzTG9vcEFycm93OiBmYWxzZSxcbiAgICAgIH07XG4gICAgICByZXR1cm4gcGFpbnRCbG9jayhpbmZvLCBjaGlsZHJlbiwgbGFuZ3VhZ2VzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlTWVudShzaGFwZSwgdmFsdWUpIHtcbiAgICAgIHZhciBtZW51ID0gbG9va3VwRHJvcGRvd24odmFsdWUsIGxhbmd1YWdlcykgfHwgdmFsdWU7XG4gICAgICByZXR1cm4gbmV3IElucHV0KHNoYXBlLCB2YWx1ZSwgbWVudSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFBhcnRzKGVuZCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICB2YXIgbGFiZWw7XG4gICAgICB3aGlsZSAodG9rICYmIHRvayAhPT0gJ1xcbicpIHtcbiAgICAgICAgaWYgKHRvayA9PT0gJzwnIHx8ICh0b2sgPT09ICc+JyAmJiBlbmQgPT09ICc+JykpIHtcbiAgICAgICAgICB2YXIgbGFzdCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIHZhciBjID0gcGVla05vbldzKCk7XG4gICAgICAgICAgaWYgKGxhc3QgJiYgIWxhc3QuaXNMYWJlbCAmJiAoYyA9PT0gJ1snIHx8IGMgPT09ICcoJyB8fCBjID09PSAnPCcgfHwgYyA9PT0gJ3snKSkge1xuICAgICAgICAgICAgbGFiZWwgPSBudWxsO1xuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChuZXcgTGFiZWwodG9rKSk7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBicmVhaztcbiAgICAgICAgaWYgKHRvayA9PT0gJy8nICYmIHBlZWsoKSA9PT0gJy8nICYmICFlbmQpIGJyZWFrO1xuXG4gICAgICAgIHN3aXRjaCAodG9rKSB7XG4gICAgICAgICAgY2FzZSAnWyc6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGw7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBTdHJpbmcoKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICcoJzpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbDtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocFJlcG9ydGVyKCkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnPCc6XG4gICAgICAgICAgICBsYWJlbCA9IG51bGw7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBQcmVkaWNhdGUoKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICd7JzpcbiAgICAgICAgICAgIGxhYmVsID0gbnVsbDtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2gocEVtYmVkZGVkKCkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnICc6XG4gICAgICAgICAgY2FzZSAnXFx0JzpcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIGlmIChsYWJlbCAmJiBpc0RlZmluZShsYWJlbC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgLy8gZGVmaW5lIGhhdFxuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdXRsaW5lKCkpO1xuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbCA9IG51bGw7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICfil4InOlxuICAgICAgICAgIGNhc2UgJ+KWuCc6XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBJY29uKCkpO1xuICAgICAgICAgICAgbGFiZWwgPSBudWxsO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnQCc6XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IFwiXCI7XG4gICAgICAgICAgICB3aGlsZSAodG9rICYmIC9bYS16QS1aXS8udGVzdCh0b2spKSB7XG4gICAgICAgICAgICAgIG5hbWUgKz0gdG9rO1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ2Nsb3VkJykge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBMYWJlbChcIuKYgVwiKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKEljb24uaWNvbnMuaGFzT3duUHJvcGVydHkobmFtZSkgPyBuZXcgSWNvbihuYW1lKSA6IG5ldyBMYWJlbChcIkBcIiArIG5hbWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsID0gbnVsbDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ1xcXFwnOlxuICAgICAgICAgICAgbmV4dCgpOyAvLyBlc2NhcGUgY2hhcmFjdGVyXG4gICAgICAgICAgICAvLyBmYWxsLXRocnVcbiAgICAgICAgICBjYXNlICc6JzpcbiAgICAgICAgICAgIGlmICh0b2sgPT09ICc6JyAmJiBwZWVrKCkgPT09ICc6Jykge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdmVycmlkZXMoZW5kKSk7XG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICAgICAgICAgIH0gLy8gZmFsbC10aHJ1XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICghbGFiZWwpIGNoaWxkcmVuLnB1c2gobGFiZWwgPSBuZXcgTGFiZWwoXCJcIikpO1xuICAgICAgICAgICAgbGFiZWwudmFsdWUgKz0gdG9rO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcFN0cmluZygpIHtcbiAgICAgIG5leHQoKTsgLy8gJ1snXG4gICAgICB2YXIgcyA9IFwiXCI7XG4gICAgICB2YXIgZXNjYXBlViA9IGZhbHNlO1xuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09ICddJyAmJiB0b2sgIT09ICdcXG4nKSB7XG4gICAgICAgIGlmICh0b2sgPT09ICdcXFxcJykge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICBpZiAodG9rID09PSAndicpIGVzY2FwZVYgPSB0cnVlO1xuICAgICAgICAgIGlmICghdG9rKSBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlc2NhcGVWID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcyArPSB0b2s7XG4gICAgICAgIG5leHQoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0b2sgPT09ICddJykgbmV4dCgpO1xuICAgICAgaWYgKGhleENvbG9yUGF0LnRlc3QocykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dCgnY29sb3InLCBzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAhZXNjYXBlViAmJiAvIHYkLy50ZXN0KHMpID8gbWFrZU1lbnUoJ2Ryb3Bkb3duJywgcy5zbGljZSgwLCBzLmxlbmd0aCAtIDIpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgSW5wdXQoJ3N0cmluZycsIHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBCbG9jayhlbmQpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IHBQYXJ0cyhlbmQpO1xuICAgICAgaWYgKHRvayAmJiB0b2sgPT09ICdcXG4nKSB7XG4gICAgICAgIHNhd05MID0gdHJ1ZTtcbiAgICAgICAgbmV4dCgpO1xuICAgICAgfVxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgICAvLyBkZWZpbmUgaGF0c1xuICAgICAgdmFyIGZpcnN0ID0gY2hpbGRyZW5bMF07XG4gICAgICBpZiAoZmlyc3QgJiYgZmlyc3QuaXNMYWJlbCAmJiBpc0RlZmluZShmaXJzdC52YWx1ZSkpIHtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKG1ha2VCbG9jaygnb3V0bGluZScsIFtdKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1ha2VCbG9jaygnZGVmaW5lLWhhdCcsIGNoaWxkcmVuKTtcbiAgICAgIH1cblxuICAgICAgLy8gc3RhbmRhbG9uZSByZXBvcnRlcnNcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bMF07XG4gICAgICAgIGlmIChjaGlsZC5pc0Jsb2NrICYmIChjaGlsZC5pc1JlcG9ydGVyIHx8IGNoaWxkLmlzQm9vbGVhbiB8fCBjaGlsZC5pc1JpbmcpKSB7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYWtlQmxvY2soJ3N0YWNrJywgY2hpbGRyZW4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBSZXBvcnRlcigpIHtcbiAgICAgIG5leHQoKTsgLy8gJygnXG5cbiAgICAgIC8vIGVtcHR5IG51bWJlci1kcm9wZG93blxuICAgICAgaWYgKHRvayA9PT0gJyAnKSB7XG4gICAgICAgIG5leHQoKTtcbiAgICAgICAgaWYgKHRvayA9PT0gJ3YnICYmIHBlZWsoKSA9PT0gJyknKSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICByZXR1cm4gbmV3IElucHV0KCdudW1iZXItZHJvcGRvd24nLCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY2hpbGRyZW4gPSBwUGFydHMoJyknKTtcbiAgICAgIGlmICh0b2sgJiYgdG9rID09PSAnKScpIG5leHQoKTtcblxuICAgICAgLy8gZW1wdHkgbnVtYmVyc1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0KCdudW1iZXInLCBcIlwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gbnVtYmVyXG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIGNoaWxkcmVuWzBdLmlzTGFiZWwpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gY2hpbGRyZW5bMF0udmFsdWU7XG4gICAgICAgIGlmICgvXlswLTllLi1dKiQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBJbnB1dCgnbnVtYmVyJywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIG51bWJlci1kcm9wZG93blxuICAgICAgZm9yICh2YXIgaT0wOyBpPGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghY2hpbGRyZW5baV0uaXNMYWJlbCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGlmIChpID09PSBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBjaGlsZHJlbltpIC0gMV07XG4gICAgICAgIGlmIChpID4gMSAmJiBsYXN0LnZhbHVlID09PSAndicpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wb3AoKTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjaGlsZHJlbi5tYXAoZnVuY3Rpb24obCkgeyByZXR1cm4gbC52YWx1ZTsgfSkuam9pbihcIiBcIik7XG4gICAgICAgICAgcmV0dXJuIG1ha2VNZW51KCdudW1iZXItZHJvcGRvd24nLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGJsb2NrID0gbWFrZUJsb2NrKCdyZXBvcnRlcicsIGNoaWxkcmVuKTtcblxuICAgICAgLy8gcmluZ3NcbiAgICAgIGlmIChibG9jay5pbmZvLnNoYXBlID09PSAncmluZycpIHtcbiAgICAgICAgdmFyIGZpcnN0ID0gYmxvY2suY2hpbGRyZW5bMF07XG4gICAgICAgIGlmIChmaXJzdCAmJiBmaXJzdC5pc0lucHV0ICYmIGZpcnN0LnNoYXBlID09PSAnbnVtYmVyJyAmJiBmaXJzdC52YWx1ZSA9PT0gXCJcIikge1xuICAgICAgICAgIGJsb2NrLmNoaWxkcmVuWzBdID0gbmV3IElucHV0KCdyZXBvcnRlcicpO1xuICAgICAgICB9IGVsc2UgaWYgKChmaXJzdCAmJiBmaXJzdC5pc1NjcmlwdCAmJiBmaXJzdC5pc0VtcHR5KVxuICAgICAgICAgICAgICAgIHx8IChmaXJzdCAmJiBmaXJzdC5pc0Jsb2NrICYmICFmaXJzdC5jaGlsZHJlbi5sZW5ndGgpKSB7XG4gICAgICAgICAgYmxvY2suY2hpbGRyZW5bMF0gPSBuZXcgSW5wdXQoJ3N0YWNrJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJsb2NrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBQcmVkaWNhdGUoKSB7XG4gICAgICBuZXh0KCk7IC8vICc8J1xuICAgICAgdmFyIGNoaWxkcmVuID0gcFBhcnRzKCc+Jyk7XG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gJz4nKSBuZXh0KCk7XG4gICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQoJ2Jvb2xlYW4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlQmxvY2soJ2Jvb2xlYW4nLCBjaGlsZHJlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcEVtYmVkZGVkKCkge1xuICAgICAgbmV4dCgpOyAvLyAneydcblxuICAgICAgc2F3TkwgPSBmYWxzZTtcbiAgICAgIHZhciBmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSAnfScpIHtcbiAgICAgICAgICB2YXIgYmxvY2sgPSBwQmxvY2soJ30nKTtcbiAgICAgICAgICBpZiAoYmxvY2spIHJldHVybiBibG9jaztcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpO1xuICAgICAgdmFyIGJsb2NrcyA9IFtdO1xuICAgICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgICBibG9ja3MgPSBibG9ja3MuY29uY2F0KHNjcmlwdC5ibG9ja3MpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0b2sgPT09ICd9JykgbmV4dCgpO1xuICAgICAgaWYgKCFzYXdOTCkge1xuICAgICAgICBhc3NlcnQoYmxvY2tzLmxlbmd0aCA8PSAxKTtcbiAgICAgICAgcmV0dXJuIGJsb2Nrcy5sZW5ndGggPyBibG9ja3NbMF0gOiBtYWtlQmxvY2soJ3N0YWNrJywgW10pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTY3JpcHQoYmxvY2tzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwSWNvbigpIHtcbiAgICAgIHZhciBjID0gdG9rO1xuICAgICAgbmV4dCgpO1xuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgJ+KWuCc6XG4gICAgICAgICAgcmV0dXJuIG5ldyBJY29uKCdhZGRJbnB1dCcpO1xuICAgICAgICBjYXNlICfil4InOlxuICAgICAgICAgIHJldHVybiBuZXcgSWNvbignZGVsSW5wdXQnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwT3ZlcnJpZGVzKGVuZCkge1xuICAgICAgbmV4dCgpO1xuICAgICAgbmV4dCgpO1xuICAgICAgdmFyIG92ZXJyaWRlcyA9IFtdO1xuICAgICAgdmFyIG92ZXJyaWRlID0gXCJcIjtcbiAgICAgIHdoaWxlICh0b2sgJiYgdG9rICE9PSAnXFxuJyAmJiB0b2sgIT09IGVuZCkge1xuICAgICAgICBpZiAodG9rID09PSAnICcpIHtcbiAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlcy5wdXNoKG92ZXJyaWRlKTtcbiAgICAgICAgICAgIG92ZXJyaWRlID0gXCJcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodG9rID09PSAnLycgJiYgcGVlaygpID09PSAnLycpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdmVycmlkZSArPSB0b2s7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpO1xuICAgICAgfVxuICAgICAgaWYgKG92ZXJyaWRlKSBvdmVycmlkZXMucHVzaChvdmVycmlkZSk7XG4gICAgICByZXR1cm4gb3ZlcnJpZGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBDb21tZW50KGVuZCkge1xuICAgICAgbmV4dCgpO1xuICAgICAgbmV4dCgpO1xuICAgICAgdmFyIGNvbW1lbnQgPSBcIlwiO1xuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09ICdcXG4nICYmIHRvayAhPT0gZW5kKSB7XG4gICAgICAgIGNvbW1lbnQgKz0gdG9rO1xuICAgICAgICBuZXh0KCk7XG4gICAgICB9XG4gICAgICBpZiAodG9rICYmIHRvayA9PT0gJ1xcbicpIG5leHQoKTtcbiAgICAgIHJldHVybiBuZXcgQ29tbWVudChjb21tZW50LCB0cnVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwT3V0bGluZSgpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgZnVuY3Rpb24gcGFyc2VBcmcoa2luZCwgZW5kKSB7XG4gICAgICAgIGxhYmVsID0gbnVsbDtcbiAgICAgICAgbmV4dCgpO1xuICAgICAgICB2YXIgcGFydHMgPSBwUGFydHMoZW5kKTtcbiAgICAgICAgaWYgKHRvayA9PT0gZW5kKSBuZXh0KCk7XG4gICAgICAgIGNoaWxkcmVuLnB1c2gocGFpbnRCbG9jayh7XG4gICAgICAgICAgc2hhcGU6IGtpbmQgPT09ICdib29sZWFuJyA/ICdib29sZWFuJyA6ICdyZXBvcnRlcicsXG4gICAgICAgICAgYXJndW1lbnQ6IGtpbmQsXG4gICAgICAgICAgY2F0ZWdvcnk6ICdjdXN0b20tYXJnJyxcbiAgICAgICAgfSwgcGFydHMsIGxhbmd1YWdlcykpO1xuICAgICAgfVxuICAgICAgdmFyIGxhYmVsO1xuICAgICAgd2hpbGUgKHRvayAmJiB0b2sgIT09ICdcXG4nKSB7XG4gICAgICAgIGlmICh0b2sgPT09ICcvJyAmJiBwZWVrKCkgPT09ICcvJykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAodG9rKSB7XG4gICAgICAgICAgY2FzZSAnKCc6IHBhcnNlQXJnKCdudW1iZXInLCAnKScpOyBicmVhaztcbiAgICAgICAgICBjYXNlICdbJzogcGFyc2VBcmcoJ3N0cmluZycsICddJyk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJzwnOiBwYXJzZUFyZygnYm9vbGVhbicsICc+Jyk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJyAnOiBuZXh0KCk7IGxhYmVsID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnXFxcXCc6XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAvLyBmYWxsLXRocnVcbiAgICAgICAgICBjYXNlICc6JzpcbiAgICAgICAgICAgIGlmICh0b2sgPT09ICc6JyAmJiBwZWVrKCkgPT09ICc6Jykge1xuICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHBPdmVycmlkZXMoKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSAvLyBmYWxsLXRocnVcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCFsYWJlbCkgY2hpbGRyZW4ucHVzaChsYWJlbCA9IG5ldyBMYWJlbChcIlwiKSk7XG4gICAgICAgICAgICBsYWJlbC52YWx1ZSArPSB0b2s7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlQmxvY2soJ291dGxpbmUnLCBjaGlsZHJlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcExpbmUoKSB7XG4gICAgICB2YXIgYmxvY2sgPSBwQmxvY2soKTtcbiAgICAgIGlmICh0b2sgPT09ICcvJyAmJiBwZWVrKCkgPT09ICcvJykge1xuICAgICAgICB2YXIgY29tbWVudCA9IHBDb21tZW50KCk7XG4gICAgICAgIGNvbW1lbnQuaGFzQmxvY2sgPSBibG9jayAmJiBibG9jay5jaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgIGlmICghY29tbWVudC5oYXNCbG9jaykge1xuICAgICAgICAgIHJldHVybiBjb21tZW50O1xuICAgICAgICB9XG4gICAgICAgIGJsb2NrLmNvbW1lbnQgPSBjb21tZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJsb2NrO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdG9rKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdmFyIGxpbmUgPSBwTGluZSgpO1xuICAgICAgcmV0dXJuIGxpbmUgfHwgJ05MJztcbiAgICB9XG4gIH1cblxuICAvKiAqICovXG5cbiAgZnVuY3Rpb24gcGFyc2VTY3JpcHRzKGdldExpbmUpIHtcbiAgICB2YXIgbGluZSA9IGdldExpbmUoKTtcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgbGluZSA9IGdldExpbmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwRmlsZSgpIHtcbiAgICAgIHdoaWxlIChsaW5lID09PSAnTkwnKSBuZXh0KCk7XG4gICAgICB2YXIgc2NyaXB0cyA9IFtdO1xuICAgICAgd2hpbGUgKGxpbmUpIHtcbiAgICAgICAgdmFyIGJsb2NrcyA9IFtdO1xuICAgICAgICB3aGlsZSAobGluZSAmJiBsaW5lICE9PSAnTkwnKSB7XG4gICAgICAgICAgdmFyIGIgPSBwTGluZSgpO1xuXG4gICAgICAgICAgaWYgKGIuaXNFbHNlIHx8IGIuaXNFbmQpIHtcbiAgICAgICAgICAgIGIgPSBuZXcgQmxvY2soZXh0ZW5kKGIuaW5mbywge1xuICAgICAgICAgICAgICBzaGFwZTogJ3N0YWNrJyxcbiAgICAgICAgICAgIH0pLCBiLmNoaWxkcmVuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYi5pc0hhdCkge1xuICAgICAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGgpIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpO1xuICAgICAgICAgICAgYmxvY2tzID0gW2JdO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0ZpbmFsKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChiKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYi5pc0NvbW1hbmQpIHtcbiAgICAgICAgICAgIGJsb2Nrcy5wdXNoKGIpO1xuICAgICAgICAgIH0gZWxzZSB7IC8vIHJlcG9ydGVyIG9yIHByZWRpY2F0ZVxuICAgICAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGgpIHNjcmlwdHMucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpO1xuICAgICAgICAgICAgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoW2JdKSk7XG4gICAgICAgICAgICBibG9ja3MgPSBbXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCkgc2NyaXB0cy5wdXNoKG5ldyBTY3JpcHQoYmxvY2tzKSk7XG4gICAgICAgIHdoaWxlIChsaW5lID09PSAnTkwnKSBuZXh0KCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2NyaXB0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwTGluZSgpIHtcbiAgICAgIHZhciBiID0gbGluZTtcbiAgICAgIG5leHQoKTtcblxuICAgICAgaWYgKGIuaGFzU2NyaXB0KSB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdmFyIGJsb2NrcyA9IHBNb3V0aCgpO1xuICAgICAgICAgIGIuY2hpbGRyZW4ucHVzaChuZXcgU2NyaXB0KGJsb2NrcykpO1xuICAgICAgICAgIGlmIChsaW5lICYmIGxpbmUuaXNFbHNlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGluZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBiLmNoaWxkcmVuLnB1c2gobGluZS5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGxpbmUgJiYgbGluZS5pc0VuZCkge1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcE1vdXRoKCkge1xuICAgICAgdmFyIGJsb2NrcyA9IFtdO1xuICAgICAgd2hpbGUgKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUgPT09ICdOTCcpIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsaW5lLmlzQ29tbWFuZCkge1xuICAgICAgICAgIHJldHVybiBibG9ja3M7XG4gICAgICAgIH1cbiAgICAgICAgYmxvY2tzLnB1c2gocExpbmUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmxvY2tzO1xuICAgIH1cblxuICAgIHJldHVybiBwRmlsZSgpO1xuICB9XG5cbiAgLyogKiAqL1xuXG4gIGZ1bmN0aW9uIGVhY2hCbG9jayh4LCBjYikge1xuICAgIGlmICh4LmlzU2NyaXB0KSB7XG4gICAgICB4LmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGVhY2hCbG9jayhibG9jaywgY2IpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh4LmlzQmxvY2spIHtcbiAgICAgIGNiKHgpO1xuICAgICAgeC5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGVhY2hCbG9jayhjaGlsZCwgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGxpc3RCbG9ja3MgPSB7XG4gICAgXCJhcHBlbmQ6dG9MaXN0OlwiOiAxLFxuICAgIFwiZGVsZXRlTGluZTpvZkxpc3Q6XCI6IDEsXG4gICAgXCJpbnNlcnQ6YXQ6b2ZMaXN0OlwiOiAyLFxuICAgIFwic2V0TGluZTpvZkxpc3Q6dG86XCI6IDEsXG4gICAgXCJzaG93TGlzdDpcIjogMCxcbiAgICBcImhpZGVMaXN0OlwiOiAwLFxuICB9O1xuXG4gIGZ1bmN0aW9uIHJlY29nbmlzZVN0dWZmKHNjcmlwdHMpIHtcblxuICAgIHZhciBjdXN0b21CbG9ja3NCeUhhc2ggPSB7fTtcbiAgICB2YXIgbGlzdE5hbWVzID0ge307XG5cbiAgICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG5cbiAgICAgIHZhciBjdXN0b21BcmdzID0ge307XG5cbiAgICAgIGVhY2hCbG9jayhzY3JpcHQsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIC8vIGN1c3RvbSBibG9ja3NcbiAgICAgICAgaWYgKGJsb2NrLmluZm8uc2hhcGUgPT09ICdkZWZpbmUtaGF0Jykge1xuICAgICAgICAgIHZhciBvdXRsaW5lID0gYmxvY2suY2hpbGRyZW5bMV07XG4gICAgICAgICAgaWYgKCFvdXRsaW5lKSByZXR1cm47XG5cbiAgICAgICAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICAgICAgICB2YXIgcGFydHMgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8b3V0bGluZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gb3V0bGluZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChjaGlsZC5pc0xhYmVsKSB7XG4gICAgICAgICAgICAgIHBhcnRzLnB1c2goY2hpbGQudmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5pc0Jsb2NrKSB7XG4gICAgICAgICAgICAgIGlmICghY2hpbGQuaW5mby5hcmd1bWVudCkgcmV0dXJuO1xuICAgICAgICAgICAgICBwYXJ0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IFwiJW5cIixcbiAgICAgICAgICAgICAgICBzdHJpbmc6IFwiJXNcIixcbiAgICAgICAgICAgICAgICBib29sZWFuOiBcIiViXCIsXG4gICAgICAgICAgICAgIH1bY2hpbGQuaW5mby5hcmd1bWVudF0pO1xuXG4gICAgICAgICAgICAgIHZhciBuYW1lID0gYmxvY2tOYW1lKGNoaWxkKTtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChuYW1lKTtcbiAgICAgICAgICAgICAgY3VzdG9tQXJnc1tuYW1lXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzcGVjID0gcGFydHMuam9pbihcIiBcIik7XG4gICAgICAgICAgdmFyIGhhc2ggPSBoYXNoU3BlYyhzcGVjKTtcbiAgICAgICAgICB2YXIgaW5mbyA9IGN1c3RvbUJsb2Nrc0J5SGFzaFtoYXNoXSA9IHtcbiAgICAgICAgICAgIHNwZWM6IHNwZWMsXG4gICAgICAgICAgICBuYW1lczogbmFtZXMsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gJ3Byb2NEZWYnO1xuICAgICAgICAgIGJsb2NrLmluZm8uY2FsbCA9IGluZm8uc3BlYztcbiAgICAgICAgICBibG9jay5pbmZvLm5hbWVzID0gaW5mby5uYW1lcztcbiAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gJ2N1c3RvbSc7XG5cbiAgICAgICAgLy8gZml4IHVwIGlmL2Vsc2Ugc2VsZWN0b3JzXG4gICAgICAgIH0gZWxzZSBpZiAoYmxvY2suaW5mby5zZWxlY3RvciA9PT0gJ2RvSWZFbHNlJykge1xuICAgICAgICAgIHZhciBsYXN0MiA9IGJsb2NrLmNoaWxkcmVuW2Jsb2NrLmNoaWxkcmVuLmxlbmd0aCAtIDJdO1xuICAgICAgICAgIGJsb2NrLmluZm8uc2VsZWN0b3IgPSBsYXN0MiAmJiBsYXN0Mi5pc0xhYmVsICYmIGxhc3QyLnZhbHVlID09PSAnZWxzZScgPyAnZG9JZkVsc2UnIDogJ2RvSWYnO1xuXG4gICAgICAgIC8vIGN1c3RvbSBhcmd1bWVudHNcbiAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ICYmIChibG9jay5pc1JlcG9ydGVyIHx8IGJsb2NrLmlzQm9vbGVhbikpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShibG9jayk7XG4gICAgICAgICAgaWYgKGN1c3RvbUFyZ3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2F0ZWdvcnkgPSAnY3VzdG9tLWFyZyc7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gJ2dldFBhcmFtJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgLy8gbGlzdCBuYW1lc1xuICAgICAgICB9IGVsc2UgaWYgKGxpc3RCbG9ja3MuaGFzT3duUHJvcGVydHkoYmxvY2suaW5mby5zZWxlY3RvcikpIHtcbiAgICAgICAgICB2YXIgYXJnSW5kZXggPSBsaXN0QmxvY2tzW2Jsb2NrLmluZm8uc2VsZWN0b3JdO1xuICAgICAgICAgIHZhciBpbnB1dHMgPSBibG9jay5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgIHJldHVybiAhY2hpbGQuaXNMYWJlbDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgaW5wdXQgPSBpbnB1dHNbYXJnSW5kZXhdO1xuICAgICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5pc0lucHV0KSB7XG4gICAgICAgICAgICBsaXN0TmFtZXNbaW5wdXQudmFsdWVdID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgc2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcmlwdCkge1xuICAgICAgZWFjaEJsb2NrKHNjcmlwdCwgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgLy8gY3VzdG9tIGJsb2Nrc1xuICAgICAgICBpZiAoYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCAmJiBibG9jay5pbmZvLmNhdGVnb3J5ID09PSAnb2Jzb2xldGUnKSB7XG4gICAgICAgICAgdmFyIGluZm8gPSBjdXN0b21CbG9ja3NCeUhhc2hbYmxvY2suaW5mby5oYXNoXTtcbiAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9ICdjYWxsJztcbiAgICAgICAgICAgIGJsb2NrLmluZm8uY2FsbCA9IGluZm8uc3BlYztcbiAgICAgICAgICAgIGJsb2NrLmluZm8ubmFtZXMgPSBpbmZvLm5hbWVzO1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeSA9ICdjdXN0b20nO1xuICAgICAgICAgIH1cblxuICAgICAgICAvLyBsaXN0IHJlcG9ydGVyc1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrLmlzUmVwb3J0ZXIpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGJsb2NrTmFtZShibG9jayk7XG4gICAgICAgICAgaWYgKCFuYW1lKSByZXR1cm47XG4gICAgICAgICAgaWYgKGJsb2NrLmluZm8uY2F0ZWdvcnkgPT09ICd2YXJpYWJsZXMnICYmIGxpc3ROYW1lc1tuYW1lXSAmJiBibG9jay5pbmZvLmNhdGVnb3J5SXNEZWZhdWx0KSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLmNhdGVnb3J5ID0gJ2xpc3QnO1xuICAgICAgICAgICAgYmxvY2suaW5mby5jYXRlZ29yeUlzRGVmYXVsdCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYmxvY2suaW5mby5jYXRlZ29yeSA9PT0gJ2xpc3QnKSB7XG4gICAgICAgICAgICBibG9jay5pbmZvLnNlbGVjdG9yID0gJ2NvbnRlbnRzT2ZMaXN0Oic7XG4gICAgICAgICAgfSBlbHNlIGlmIChibG9jay5pbmZvLmNhdGVnb3J5ID09PSAndmFyaWFibGVzJykge1xuICAgICAgICAgICAgYmxvY2suaW5mby5zZWxlY3RvciA9ICdyZWFkVmFyaWFibGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZShjb2RlLCBvcHRpb25zKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBleHRlbmQoe1xuICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgIGxhbmd1YWdlczogWydlbiddLFxuICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgY29kZSA9IGNvZGUucmVwbGFjZSgvJmx0Oy9nLCAnPCcpO1xuICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoLyZndDsvZywgJz4nKTtcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcbi9nLCAnICcpO1xuICAgIH1cblxuICAgIHZhciBsYW5ndWFnZXMgPSBvcHRpb25zLmxhbmd1YWdlcy5tYXAoZnVuY3Rpb24oY29kZSkge1xuICAgICAgcmV0dXJuIGFsbExhbmd1YWdlc1tjb2RlXTtcbiAgICB9KTtcblxuICAgIC8qICogKi9cblxuICAgIHZhciBmID0gcGFyc2VMaW5lcyhjb2RlLCBsYW5ndWFnZXMpO1xuICAgIHZhciBzY3JpcHRzID0gcGFyc2VTY3JpcHRzKGYpO1xuICAgIHJlY29nbmlzZVN0dWZmKHNjcmlwdHMpO1xuICAgIHJldHVybiBuZXcgRG9jdW1lbnQoc2NyaXB0cyk7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgcGFyc2U6IHBhcnNlLFxuICB9O1xuXG59KCk7XG4iXX0=
