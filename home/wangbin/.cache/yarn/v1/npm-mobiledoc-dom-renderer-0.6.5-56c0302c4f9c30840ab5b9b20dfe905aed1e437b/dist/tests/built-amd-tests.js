define('tests/helpers/create-mobiledoc', ['exports', 'mobiledoc-dom-renderer/utils/section-types', 'mobiledoc-dom-renderer/utils/marker-types'], function (exports, _mobiledocDomRendererUtilsSectionTypes, _mobiledocDomRendererUtilsMarkerTypes) {
  'use strict';

  exports.createBlankMobiledoc = createBlankMobiledoc;
  exports.createMobiledocWithAtom = createMobiledocWithAtom;
  exports.createMobiledocWithCard = createMobiledocWithCard;
  exports.createSimpleMobiledoc = createSimpleMobiledoc;
  var MOBILEDOC_VERSION_0_3_1 = '0.3.1';

  function createBlankMobiledoc() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$version = _ref.version;
    var version = _ref$version === undefined ? MOBILEDOC_VERSION_0_3_1 : _ref$version;

    return {
      version: version,
      atoms: [],
      cards: [],
      markups: [],
      sections: []
    };
  }

  function createMobiledocWithAtom() {
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$version = _ref2.version;
    var version = _ref2$version === undefined ? MOBILEDOC_VERSION_0_3_1 : _ref2$version;
    var atom = _ref2.atom;

    return {
      version: version,
      atoms: [atom],
      cards: [],
      markups: [],
      sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[_mobiledocDomRendererUtilsMarkerTypes.ATOM_MARKER_TYPE, [], 0, 0]]]]
    };
  }

  function createMobiledocWithCard() {
    var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref3$version = _ref3.version;
    var version = _ref3$version === undefined ? MOBILEDOC_VERSION_0_3_1 : _ref3$version;
    var card = _ref3.card;

    return {
      version: version,
      atoms: [],
      cards: [[card.name, card.payload || {}]],
      markups: [],
      sections: [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, 0]]
    };
  }

  function createSimpleMobiledoc() {
    var _ref4 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref4$sectionName = _ref4.sectionName;
    var sectionName = _ref4$sectionName === undefined ? 'p' : _ref4$sectionName;
    var _ref4$text = _ref4.text;
    var text = _ref4$text === undefined ? 'hello world' : _ref4$text;
    var _ref4$markup = _ref4.markup;
    var markup = _ref4$markup === undefined ? null : _ref4$markup;
    var _ref4$version = _ref4.version;
    var version = _ref4$version === undefined ? MOBILEDOC_VERSION_0_3_1 : _ref4$version;

    var openedMarkups = markup ? [0] : [];
    var closedMarkups = markup ? 1 : 0;
    var markups = markup ? [markup] : [];

    return {
      version: version,
      atoms: [],
      cards: [],
      markups: markups,
      sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, sectionName, [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, openedMarkups, closedMarkups, text]]]]
    };
  }
});
define('tests/helpers/dom', ['exports'], function (exports) {
  /* global SimpleDOM */

  'use strict';

  exports.childNodesLength = childNodesLength;
  exports.outerHTML = outerHTML;
  exports.innerHTML = innerHTML;
  exports.escapeQuotes = escapeQuotes;

  function childNodesLength(element) {
    var length = 0;
    var node = element.firstChild;
    while (node) {
      length++;
      node = node.nextSibling;
    }
    return length;
  }

  function outerHTML(node) {
    if (node.outerHTML) {
      return node.outerHTML;
    } else {
      var serializer = new SimpleDOM.HTMLSerializer([]);
      return serializer.serialize(node);
    }
  }

  function innerHTML(parentNode) {
    var content = [];
    var node = parentNode.firstChild;
    while (node) {
      content.push(outerHTML(node));
      node = node.nextSibling;
    }
    return content.join('');
  }

  function escapeQuotes(string) {
    return string.replace(/"/g, '&quot;');
  }
});
QUnit.module('JSHint - tests/jshint/cards');
QUnit.test('tests/jshint/cards/image.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/cards/image.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/helpers');
QUnit.test('tests/jshint/helpers/create-mobiledoc.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/helpers/create-mobiledoc.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/helpers');
QUnit.test('tests/jshint/helpers/dom.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/helpers/dom.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint');
QUnit.test('tests/jshint/index.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/index.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint');
QUnit.test('tests/jshint/renderer-factory.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/renderer-factory.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/renderers');
QUnit.test('tests/jshint/renderers/0-2.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/renderers/0-2.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/renderers');
QUnit.test('tests/jshint/renderers/0-3.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/renderers/0-3.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/unit/renderers');
QUnit.test('tests/jshint/unit/renderers/0-2-test.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/unit/renderers/0-2-test.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/unit/renderers');
QUnit.test('tests/jshint/unit/renderers/0-3-test.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/unit/renderers/0-3-test.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/unit/utils');
QUnit.test('tests/jshint/unit/utils/sanitization-utils-test.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/unit/utils/sanitization-utils-test.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/array-utils.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/array-utils.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/dom.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/dom.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/marker-types.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/marker-types.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/render-type.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/render-type.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/render-utils.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/render-utils.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/sanitization-utils.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/sanitization-utils.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/section-types.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/section-types.js should pass jshint.'); 
});

QUnit.module('JSHint - tests/jshint/utils');
QUnit.test('tests/jshint/utils/tag-names.js should pass jshint', function(assert) { 
  assert.ok(true, 'tests/jshint/utils/tag-names.js should pass jshint.'); 
});

define('tests/unit/renderers/0-2-test', ['exports', 'mobiledoc-dom-renderer', 'mobiledoc-dom-renderer/utils/section-types', '../../helpers/dom'], function (exports, _mobiledocDomRenderer, _mobiledocDomRendererUtilsSectionTypes, _helpersDom) {
  /* global QUnit, SimpleDOM */

  'use strict';

  var _QUnit = QUnit;
  var test = _QUnit.test;
  var _module = _QUnit.module;

  var MOBILEDOC_VERSION = '0.2.0';
  var dataUri = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";

  var renderer = undefined;

  // Add tests that should run with both simple-dom and
  // the window.document in this function.
  function generateTests() {

    test('renders an empty mobiledoc', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [] // sections
        ]
      };

      var _renderer$render = renderer.render(mobiledoc);

      var rendered = _renderer$render.result;

      assert.ok(!!rendered, 'renders result');
      assert.ok(!rendered.firstChild, 'has no sections');
    });

    test('renders a mobiledoc without markups', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[], 0, 'hello world']]]]]
      };
      var renderResult = renderer.render(mobiledoc);
      var rendered = renderResult.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      assert.equal(rendered.firstChild.tagName, 'P', 'renders a P');
      assert.equal(rendered.firstChild.firstChild.nodeValue, 'hello world', 'renders the text');
    });

    test('renders markup section "pull-quote" as div with class', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'pull-quote', [[[], 0, 'hello world']]]]]
      };

      var _renderer$render2 = renderer.render(mobiledoc);

      var rendered = _renderer$render2.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.outerHTML)(sectionEl), '<div class="pull-quote">hello world</div>');
    });

    test('renders a mobiledoc with simple (no attributes) markup', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[// markers
        ['B']], [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[0], 1, 'hello world']]]]]
      };

      var _renderer$render3 = renderer.render(mobiledoc);

      var rendered = _renderer$render3.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal(sectionEl.firstChild.tagName, 'B');
      assert.equal(sectionEl.firstChild.firstChild.nodeValue, 'hello world');
    });

    test('renders a mobiledoc with complex (has attributes) markup', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[// markers
        ['A', ['href', 'http://google.com']]], [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[0], 1, 'hello world']]]]]
      };

      var _renderer$render4 = renderer.render(mobiledoc);

      var rendered = _renderer$render4.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.innerHTML)(sectionEl), '<a href="http://google.com">hello world</a>');
      assert.equal((0, _helpersDom.innerHTML)(sectionEl), '<a href="http://google.com">hello world</a>');
    });

    test('renders a mobiledoc with multiple markups in a section', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[// markers
        ['B'], ['I']], [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[0], 0, 'hello '], // b
        [[1], 0, 'brave '], // b+i
        [[], 1, 'new '], // close i
        [[], 1, 'world'] // close b
        ]]]]
      };

      var _renderer$render5 = renderer.render(mobiledoc);

      var rendered = _renderer$render5.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.childNodes.item(0);

      assert.equal((0, _helpersDom.innerHTML)(sectionEl), '<b>hello <i>brave new </i>world</b>');
    });

    test('renders a mobiledoc with image section', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.IMAGE_SECTION_TYPE, dataUri]]]
      };

      var _renderer$render6 = renderer.render(mobiledoc);

      var rendered = _renderer$render6.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.childNodes.item(0);

      assert.equal(sectionEl.src, dataUri);
    });

    test('renders a mobiledoc with built-in image card', function (assert) {
      assert.expect(3);
      var cardName = 'image';
      var payload = {
        src: dataUri
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, cardName, payload]]]
      };

      var _renderer$render7 = renderer.render(mobiledoc);

      var rendered = _renderer$render7.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.childNodes.item(0);

      assert.equal(sectionEl.tagName, 'IMG');
      assert.equal(sectionEl.src, dataUri);
    });

    test('render mobiledoc with list section and list items', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.LIST_SECTION_TYPE, 'ul', [[[[], 0, 'first item']], [[[], 0, 'second item']]]]]]
      };

      var _renderer$render8 = renderer.render(mobiledoc, document.createElement('div'));

      var rendered = _renderer$render8.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');

      var section = rendered.firstChild;
      assert.equal(section.tagName, 'UL');

      assert.equal((0, _helpersDom.childNodesLength)(section), 2, '2 list items');

      assert.equal(section.firstChild.tagName, 'LI', 'correct tagName for item 1');
      assert.equal(section.firstChild.firstChild.nodeValue, 'first item', 'correct text node for item 1');

      assert.equal(section.lastChild.tagName, 'LI', 'correct tagName for item 2');
      assert.equal(section.lastChild.firstChild.nodeValue, 'second item', 'correct text node for item 2');
    });

    test('renders a mobiledoc with card section', function (assert) {
      assert.expect(8);
      var cardName = 'title-card';
      var expectedPayload = { name: 'bob' };
      var expectedOptions = { foo: 'bar' };
      var TitleCard = {
        name: cardName,
        type: 'dom',
        render: function render(_ref) {
          var env = _ref.env;
          var options = _ref.options;
          var payload = _ref.payload;
          var name = env.name;
          var isInEditor = env.isInEditor;
          var onTeardown = env.onTeardown;
          var didRender = env.didRender;

          assert.equal(name, cardName, 'has name');
          assert.ok(!isInEditor, 'not isInEditor');
          assert.ok(!!onTeardown, 'has onTeardown');
          assert.ok(!!didRender, 'has didRender');

          assert.deepEqual(options, expectedOptions);
          assert.deepEqual(payload, expectedPayload);

          return document.createTextNode(payload.name);
        }
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, cardName, expectedPayload]]]
      };
      renderer = new _mobiledocDomRenderer['default']({ cards: [TitleCard], cardOptions: expectedOptions });

      var _renderer$render9 = renderer.render(mobiledoc);

      var rendered = _renderer$render9.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      assert.equal((0, _helpersDom.innerHTML)(rendered), expectedPayload.name);
    });

    test('throws when given invalid card type', function (assert) {
      var cardName = 'bad';
      var card = {
        name: cardName,
        type: 'text',
        render: function render() {}
      };
      var cards = [card];
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ cards: cards });
      }, // jshint ignore: line
      new RegExp('Card "' + cardName + '" must be of type "' + _mobiledocDomRenderer.RENDER_TYPE + '"'));
    });

    test('throws when given card without `render`', function (assert) {
      var cardName = 'bad';
      var card = {
        name: cardName,
        type: _mobiledocDomRenderer.RENDER_TYPE,
        render: undefined
      };
      var cards = [card];
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ cards: cards });
      }, // jshint ignore: line
      new RegExp('Card "' + cardName + '" must define `render`'));
    });

    test('throws if card render returns invalid result', function (assert) {
      var card = {
        name: 'bad',
        type: 'dom',
        render: function render() {
          return 'string';
        }
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, card.name]]]
      };

      renderer = new _mobiledocDomRenderer['default']({ cards: [card] });
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Card "bad" must render dom/);
    });

    test('card may render nothing', function (assert) {
      var card = {
        name: 'ok',
        type: 'dom',
        render: function render() {}
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, card.name]]]
      };

      renderer = new _mobiledocDomRenderer['default']({ cards: [card] });
      renderer.render(mobiledoc);

      assert.ok(true, 'No error thrown');
    });

    test('rendering nested mobiledocs in cards', function (assert) {
      var renderer = undefined;
      var cards = [{
        name: 'nested-card',
        type: 'dom',
        render: function render(_ref2) {
          var payload = _ref2.payload;

          var _renderer$render10 = renderer.render(payload.mobiledoc);

          var rendered = _renderer$render10.result;

          return rendered;
        }
      }];

      var innerMobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[], 0, 'hello world']]]]]
      };

      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, 'nested-card', { mobiledoc: innerMobiledoc }]]]
      };

      renderer = new _mobiledocDomRenderer['default']({ cards: cards });

      var _renderer$render11 = renderer.render(mobiledoc);

      var rendered = _renderer$render11.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var card = rendered.firstChild;
      assert.equal((0, _helpersDom.childNodesLength)(card), 1, 'card has 1 child');
      assert.equal(card.tagName, 'P', 'card has P child');
      assert.equal(card.innerText, 'hello world');
    });

    test('rendering unknown card without unknownCardHandler throws', function (assert) {
      var cardName = 'not-known';
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, cardName]]]
      };
      renderer = new _mobiledocDomRenderer['default']({ cards: [], unknownCardHandler: undefined });
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, new RegExp('Card "' + cardName + '" not found.*no unknownCardHandler'));
    });

    test('rendering unknown card uses unknownCardHandler', function (assert) {
      assert.expect(6);

      var cardName = 'my-card';
      var expectedOptions = {};
      var expectedPayload = {};

      var unknownCardHandler = function unknownCardHandler(_ref3) {
        var env = _ref3.env;
        var options = _ref3.options;
        var payload = _ref3.payload;

        assert.equal(env.name, cardName, 'name is correct');
        assert.ok(!env.isInEditor, 'not in editor');
        assert.ok(!!env.onTeardown, 'has onTeardown');
        assert.ok(!!env.didRender, 'has didRender');

        assert.deepEqual(options, expectedOptions, 'correct options');
        assert.deepEqual(payload, expectedPayload, 'correct payload');
      };

      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, cardName, expectedPayload]]]
      };
      renderer = new _mobiledocDomRenderer['default']({
        cards: [], cardOptions: expectedOptions, unknownCardHandler: unknownCardHandler
      });
      renderer.render(mobiledoc);
    });

    test('throws if given an object of cards', function (assert) {
      var cards = {};
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ cards: cards });
      }, // jshint ignore: line
      new RegExp('`cards` must be passed as an array'));
    });

    test('multiple spaces should preserve whitespace with nbsps', function (assert) {
      var space = ' ';
      var repeat = function repeat(str, count) {
        var result = '';
        while (count--) {
          result += str;
        }
        return result;
      };
      var text = [repeat(space, 4), 'some', repeat(space, 5), 'text', repeat(space, 6)].join('');
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[], 0, text]]]]]
      };

      var nbsp = ' ';
      var sn = space + nbsp;
      var expectedText = [repeat(sn, 2), 'some', repeat(sn, 2), space, 'text', repeat(sn, 3)].join('');

      var _renderer$render12 = renderer.render(mobiledoc);

      var rendered = _renderer$render12.result;

      var textNode = rendered.firstChild.firstChild;
      assert.equal(textNode.nodeValue, expectedText, 'renders the text');
    });

    test('throws when given unexpected mobiledoc version', function (assert) {
      var mobiledoc = {
        version: '0.1.0',
        sections: [[], []]
      };

      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Unexpected Mobiledoc version.*0.1.0/);

      mobiledoc.version = '0.2.1';
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Unexpected Mobiledoc version.*0.2.1/);
    });

    test('XSS: unexpected markup and list section tag names are not renderered', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'script', [[[], 0, 'alert("markup section XSS")']]], [_mobiledocDomRendererUtilsSectionTypes.LIST_SECTION_TYPE, 'script', [[[[], 0, 'alert("list section XSS")']]]]]]
      };

      var _renderer$render13 = renderer.render(mobiledoc);

      var result = _renderer$render13.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.ok(content.indexOf('script') === -1, 'no script tag rendered');
    });

    test('XSS: unexpected markup types are not rendered', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[['b'], // valid
        ['em'], // valid
        ['script'] // invalid
        ], [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[[0], 0, 'bold text'], [[1, 2], 3, 'alert("markup XSS")'], [[], 0, 'plain text']]]]]
      };

      var _renderer$render14 = renderer.render(mobiledoc);

      var result = _renderer$render14.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.ok(content.indexOf('script') === -1, 'no script tag rendered');
    });

    test('XSS: links with dangerous href values are not rendered', function (assert) {
      var unsafeHref = 'javascript:alert("link XSS")'; // jshint ignore:line
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[["a", ["href", unsafeHref]]], [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, "p", [[[0], 1, "link text"], [[], 0, "plain text"]]]]]
      };

      var _renderer$render15 = renderer.render(mobiledoc);

      var result = _renderer$render15.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.equal(content, '<p><a href="unsafe:' + (0, _helpersDom.escapeQuotes)(unsafeHref) + '">link text</a>plain text</p>');
    });

    test('renders a mobiledoc with sectionElementRenderer', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[], // markers
        [// sections
        [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[[], 0, 'hello world']]], [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[[], 0, 'hello world']]], [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'h1', [[[], 0, 'hello world']]]]]
      };
      renderer = new _mobiledocDomRenderer['default']({
        sectionElementRenderer: {
          p: function p() {
            return document.createElement('pre');
          },
          H1: function H1(tagName, dom) {
            return dom.createElement('h2');
          }
        }
      });
      var renderResult = renderer.render(mobiledoc);
      var rendered = renderResult.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 3, 'renders three sections');
      assert.equal(rendered.firstChild.tagName, 'PRE', 'renders a pre');
      assert.equal(rendered.firstChild.textContent, 'hello world', 'renders the text');
      assert.equal(rendered.childNodes.item(1).tagName, 'PRE', 'renders a pre');
      assert.equal(rendered.lastChild.tagName, 'H2', 'renders an h2');
    });

    test('renders a mobiledoc with markupElementRenderer', function (assert) {
      var mobiledoc = {
        "version": MOBILEDOC_VERSION,
        "sections": [[["A", ["href", "#foo"]]], [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, "p", [[[], 0, "Lorem ipsum "], [[0], 1, "dolor"], [[], 0, " sit amet."]]]]]
      };
      renderer = new _mobiledocDomRenderer['default']({
        markupElementRenderer: {
          A: function A(tagName, dom, attrs) {
            var element = dom.createElement('span');
            element.setAttribute('data-tag', tagName);
            element.setAttribute('data-href', attrs.href);
            return element;
          }
        }
      });
      var renderResult = renderer.render(mobiledoc);
      var rendered = renderResult.result;

      assert.equal(rendered.firstChild.childNodes[1].textContent, 'dolor', 'renders text inside of marker');
      assert.equal(rendered.firstChild.childNodes[1].tagName, 'SPAN', 'transforms markup nodes');
      assert.propEqual(rendered.firstChild.childNodes[1].dataset, { tag: "a", href: "#foo" }, 'passes original tag and attributes to transform');
      assert.equal(rendered.firstChild.childNodes[0].textContent, 'Lorem ipsum ', 'renders plain text nodes');
      assert.equal(rendered.firstChild.childNodes[2].nodeType, 3, 'renders text nodes as proper type');
    });

    test('unexpected markup types are not passed to markup renderer', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION,
        sections: [[['script'] // invalid
        ], [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[[0], 1, 'alert("markup XSS")']]]]]
      };
      renderer = new _mobiledocDomRenderer['default']({
        markupElementRenderer: {
          SCRIPT: function SCRIPT(tagName, dom) {
            return dom.createElement('script');
          }
        }
      });

      var _renderer$render16 = renderer.render(mobiledoc);

      var result = _renderer$render16.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.ok(content.indexOf('script') === -1, 'no script tag rendered');
    });
  }

  _module('Unit: Mobiledoc DOM Renderer - 0.2', {
    beforeEach: function beforeEach() {
      renderer = new _mobiledocDomRenderer['default']();
    }
  });

  generateTests();

  test('teardown removes rendered sections from dom', function (assert) {
    var mobiledoc = {
      version: MOBILEDOC_VERSION,
      sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[[], 0, 'Hello world']]]]]
    };

    var _renderer$render17 = renderer.render(mobiledoc);

    var rendered = _renderer$render17.result;
    var teardown = _renderer$render17.teardown;

    assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(rendered);

    assert.ok((0, _helpersDom.childNodesLength)(fixture) === 1, 'precond - result is appended');

    teardown();

    assert.ok((0, _helpersDom.childNodesLength)(fixture) === 0, 'rendered result removed after teardown');
  });

  test('teardown hook calls registered teardown methods', function (assert) {
    var cardName = 'title-card';
    var didTeardown = false;

    var card = {
      name: cardName,
      type: 'dom',
      render: function render(_ref4) {
        var env = _ref4.env;

        env.onTeardown(function () {
          return didTeardown = true;
        });
      }
    };

    var mobiledoc = {
      version: MOBILEDOC_VERSION,
      sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, cardName]]]
    };

    renderer = new _mobiledocDomRenderer['default']({ cards: [card] });

    var _renderer$render18 = renderer.render(mobiledoc);

    var teardown = _renderer$render18.teardown;

    assert.ok(!didTeardown, 'teardown not called');

    teardown();

    assert.ok(didTeardown, 'teardown called');
  });

  test('render hook calls registered didRender callbacks', function (assert) {
    var cardName = 'title-card';
    var didRender = false;

    var card = {
      name: cardName,
      type: 'dom',
      render: function render(_ref5) {
        var env = _ref5.env;

        env.didRender(function () {
          return didRender = true;
        });
      }
    };

    var mobiledoc = {
      version: MOBILEDOC_VERSION,
      sections: [[], [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, cardName]]]
    };

    renderer = new _mobiledocDomRenderer['default']({ cards: [card] });

    assert.ok(!didRender, 'didRender not called');

    renderer.render(mobiledoc);

    assert.ok(didRender, 'didRender called');
  });

  _module('Unit: Mobiledoc DOM Renderer w/ SimpleDOM - 0.2', {
    beforeEach: function beforeEach() {
      renderer = new _mobiledocDomRenderer['default']({ dom: new SimpleDOM.Document() });
    }
  });

  generateTests();
});
define('tests/unit/renderers/0-3-test', ['exports', 'mobiledoc-dom-renderer', 'mobiledoc-dom-renderer/cards/image', 'mobiledoc-dom-renderer/utils/section-types', '../../helpers/dom', 'mobiledoc-dom-renderer/utils/marker-types', '../../helpers/create-mobiledoc'], function (exports, _mobiledocDomRenderer, _mobiledocDomRendererCardsImage, _mobiledocDomRendererUtilsSectionTypes, _helpersDom, _mobiledocDomRendererUtilsMarkerTypes, _helpersCreateMobiledoc) {
  /* global QUnit, SimpleDOM */

  'use strict';

  var _QUnit = QUnit;
  var test = _QUnit.test;
  var _module = _QUnit.module;

  var MOBILEDOC_VERSION_0_3_0 = '0.3.0';
  var MOBILEDOC_VERSION_0_3_1 = '0.3.1';
  var dataUri = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";

  var renderer = undefined;

  // Add tests that should run with both simple-dom and
  // the window.document in this function.
  function generateTests() {

    test('renders an empty mobiledoc', function (assert) {
      var _renderer$render = renderer.render((0, _helpersCreateMobiledoc.createBlankMobiledoc)());

      var rendered = _renderer$render.result;

      assert.ok(!!rendered, 'renders result');
      assert.equal((0, _helpersDom.childNodesLength)(rendered), 0, 'has no sections');
    });

    test('renders a mobiledoc without markups', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({ text: 'hello world' });
      var renderResult = renderer.render(mobiledoc);
      var rendered = renderResult.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      assert.equal(rendered.firstChild.tagName, 'P', 'renders a P');
      assert.equal(rendered.firstChild.firstChild.nodeValue, 'hello world', 'renders the text');
    });

    test('renders 0.3.0 markup section "pull-quote" as div with class', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_0,
        sectionName: 'pull-quote',
        text: 'hello world'
      });

      var _renderer$render2 = renderer.render(mobiledoc);

      var rendered = _renderer$render2.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.outerHTML)(sectionEl), '<div class="pull-quote">hello world</div>');
    });

    test('renders 0.3.1 markup section "pull-quote" as div with class', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_1,
        sectionName: 'pull-quote',
        text: 'hello world'
      });

      var _renderer$render3 = renderer.render(mobiledoc);

      var rendered = _renderer$render3.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.outerHTML)(sectionEl), '<div class="pull-quote">hello world</div>');
    });

    test('renders markup section "aside"', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_1,
        sectionName: 'aside',
        text: 'hello world'
      });

      var _renderer$render4 = renderer.render(mobiledoc);

      var rendered = _renderer$render4.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.outerHTML)(sectionEl), '<aside>hello world</aside>');
    });

    test('renders a mobiledoc with simple (no attributes) markup', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_1,
        sectionName: 'aside',
        text: 'hello world',
        markup: ['B']
      });

      var _renderer$render5 = renderer.render(mobiledoc);

      var rendered = _renderer$render5.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.innerHTML)(sectionEl), '<b>hello world</b>');
    });

    test('renders a mobiledoc with complex (has attributes) markup', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_1,
        sectionName: 'aside',
        text: 'hello world',
        markup: ['A', ['href', 'http://google.com']]
      });

      var _renderer$render6 = renderer.render(mobiledoc);

      var rendered = _renderer$render6.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.innerHTML)(sectionEl), '<a href="http://google.com">hello world</a>');
    });

    test('renders a mobiledoc with multiple markups in a section', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [['B'], ['I']],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [0], 0, 'hello '], // b
        [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [1], 0, 'brave '], // b+i
        [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 1, 'new '], // close i
        [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 1, 'world'] // close b
        ]]]
      };

      var _renderer$render7 = renderer.render(mobiledoc);

      var rendered = _renderer$render7.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal((0, _helpersDom.innerHTML)(sectionEl), '<b>hello <i>brave new </i>world</b>');
    });

    test('renders a mobiledoc with image section', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.IMAGE_SECTION_TYPE, dataUri]]
      };

      var _renderer$render8 = renderer.render(mobiledoc);

      var rendered = _renderer$render8.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal(sectionEl.src, dataUri);
    });

    test('renders a mobiledoc with built-in image card', function (assert) {
      assert.expect(3);
      var cardName = _mobiledocDomRendererCardsImage['default'].name;
      var payload = { src: dataUri };
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [[cardName, payload]],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, 0]]
      };

      var _renderer$render9 = renderer.render(mobiledoc);

      var rendered = _renderer$render9.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var sectionEl = rendered.firstChild;

      assert.equal(sectionEl.tagName, 'IMG');
      assert.equal(sectionEl.src, dataUri);
    });

    test('render mobiledoc with list section and list items', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.LIST_SECTION_TYPE, 'ul', [[[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'first item']], [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'second item']]]]]
      };

      var _renderer$render10 = renderer.render(mobiledoc, document.createElement('div'));

      var rendered = _renderer$render10.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');

      var section = rendered.firstChild;
      assert.equal(section.tagName, 'UL');

      assert.equal((0, _helpersDom.childNodesLength)(section), 2, '2 list items');

      var items = section.childNodes;
      assert.equal(items.item(0).tagName, 'LI', 'correct tagName for item 1');
      assert.equal(items.item(0).firstChild.nodeValue, 'first item', 'correct text node for item 1');

      assert.equal(items.item(1).tagName, 'LI', 'correct tagName for item 2');
      assert.equal(items.item(1).firstChild.nodeValue, 'second item', 'correct text node for item 2');
    });

    test('renders a mobiledoc with card section', function (assert) {
      assert.expect(9);
      var cardName = 'title-card';
      var expectedPayload = { name: 'bob' };
      var expectedOptions = { foo: 'bar' };
      var expectedDom = window.document;

      var TitleCard = {
        name: cardName,
        type: 'dom',
        render: function render(_ref) {
          var env = _ref.env;
          var payload = _ref.payload;
          var options = _ref.options;

          assert.deepEqual(payload, expectedPayload, 'correct payload');
          assert.deepEqual(options, expectedOptions, 'correct options');
          assert.equal(env.name, cardName, 'correct name');
          assert.ok(!env.isInEditor, 'isInEditor correct');
          assert.ok(!!env.onTeardown, 'has onTeardown hook');
          assert.ok(!!env.didRender, 'has didRender hook');
          assert.deepEqual(env.dom, expectedDom, 'env has dom');

          return document.createTextNode(payload.name);
        }
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [[cardName, expectedPayload]],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.CARD_SECTION_TYPE, 0]]
      };

      renderer = new _mobiledocDomRenderer['default']({ cards: [TitleCard], cardOptions: expectedOptions, dom: expectedDom });

      var _renderer$render11 = renderer.render(mobiledoc);

      var rendered = _renderer$render11.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      assert.equal((0, _helpersDom.innerHTML)(rendered), expectedPayload.name);
    });

    test('throws when given invalid card type', function (assert) {
      var cardName = 'bad';
      var card = {
        name: cardName,
        type: 'text',
        render: function render() {}
      };
      var cards = [card];
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ cards: cards });
      }, // jshint ignore: line
      new RegExp('Card "' + cardName + '" must be of type "' + _mobiledocDomRenderer.RENDER_TYPE + '"'));
    });

    test('throws when given card without `render`', function (assert) {
      var cardName = 'bad';
      var card = {
        name: cardName,
        type: _mobiledocDomRenderer.RENDER_TYPE,
        render: undefined
      };
      var cards = [card];
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ cards: cards });
      }, // jshint ignore: line
      new RegExp('Card "' + cardName + '" must define `render`'));
    });

    test('throws if card render returns invalid result', function (assert) {
      var card = {
        name: 'bad',
        type: 'dom',
        render: function render() {
          return 'string';
        }
      };
      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
        version: MOBILEDOC_VERSION_0_3_0,
        card: { name: card.name }
      });

      renderer = new _mobiledocDomRenderer['default']({ cards: [card] });
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Card "bad" must render dom/);
    });

    test('card may render nothing', function (assert) {
      var card = {
        name: 'ok',
        type: 'dom',
        render: function render() {}
      };
      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
        version: MOBILEDOC_VERSION_0_3_0,
        card: { name: card.name }
      });

      renderer = new _mobiledocDomRenderer['default']({ cards: [card] });
      renderer.render(mobiledoc);

      assert.ok(true, 'No error thrown');
    });

    test('rendering nested mobiledocs in cards', function (assert) {
      var renderer = undefined;
      var cardName = 'nested-card';
      var cards = [{
        name: cardName,
        type: 'dom',
        render: function render(_ref2) {
          var payload = _ref2.payload;

          var _renderer$render12 = renderer.render(payload.mobiledoc);

          var rendered = _renderer$render12.result;

          return rendered;
        }
      }];

      var innerMobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_0,
        text: 'hello world'
      });

      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
        version: MOBILEDOC_VERSION_0_3_0,
        card: { name: cardName, payload: { mobiledoc: innerMobiledoc } }
      });

      renderer = new _mobiledocDomRenderer['default']({ cards: cards });

      var _renderer$render13 = renderer.render(mobiledoc);

      var rendered = _renderer$render13.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');
      var card = rendered.firstChild;
      assert.equal((0, _helpersDom.childNodesLength)(card), 1, 'card has 1 child');
      assert.equal(card.tagName, 'P', 'card has P child');
      assert.equal(card.innerText, 'hello world');
    });

    test('rendering unknown card without unknownCardHandler throws', function (assert) {
      var cardName = 'not-known';
      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
        version: MOBILEDOC_VERSION_0_3_0,
        card: { name: cardName }
      });
      renderer = new _mobiledocDomRenderer['default']({ cards: [], unknownCardHandler: undefined });
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, new RegExp('Card "' + cardName + '" not found.*no unknownCardHandler'));
    });

    test('rendering unknown card uses unknownCardHandler', function (assert) {
      assert.expect(6);

      var cardName = 'my-card';
      var expectedOptions = {};
      var expectedPayload = {};

      var unknownCardHandler = function unknownCardHandler(_ref3) {
        var env = _ref3.env;
        var options = _ref3.options;
        var payload = _ref3.payload;

        assert.equal(env.name, cardName, 'name is correct');
        assert.ok(!env.isInEditor, 'not in editor');
        assert.ok(!!env.onTeardown, 'has onTeardown');
        assert.ok(!!env.didRender, 'has didRender');

        assert.deepEqual(options, expectedOptions, 'correct options');
        assert.deepEqual(payload, expectedPayload, 'correct payload');
      };

      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
        version: MOBILEDOC_VERSION_0_3_0,
        card: { name: cardName, payload: expectedPayload }
      });
      renderer = new _mobiledocDomRenderer['default']({
        cards: [], cardOptions: expectedOptions, unknownCardHandler: unknownCardHandler
      });
      renderer.render(mobiledoc);
    });

    test('throws if given an object of cards', function (assert) {
      var cards = {};
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ cards: cards });
      }, // jshint ignore: line
      new RegExp('`cards` must be passed as an array'));
    });

    test('multiple spaces should preserve whitespace with nbsps', function (assert) {
      var space = ' ';
      var repeat = function repeat(str, count) {
        var result = '';
        while (count--) {
          result += str;
        }
        return result;
      };
      var text = [repeat(space, 4), 'some', repeat(space, 5), 'text', repeat(space, 6)].join('');
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_0,
        text: text
      });

      var nbsp = ' ';
      var sn = space + nbsp;
      var expectedText = [repeat(sn, 2), 'some', repeat(sn, 2), space, 'text', repeat(sn, 3)].join('');

      var _renderer$render14 = renderer.render(mobiledoc);

      var rendered = _renderer$render14.result;

      var textNode = rendered.firstChild.firstChild;
      assert.equal(textNode.nodeValue, expectedText, 'renders the text');
    });

    test('throws when given unexpected mobiledoc version', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createBlankMobiledoc)({ version: '0.1.0' });

      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Unexpected Mobiledoc version.*0.1.0/);

      mobiledoc.version = '0.2.1';
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Unexpected Mobiledoc version.*0.2.1/);
    });

    test('XSS: unexpected markup and list section tag names are not renderered', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'script', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'alert("markup section XSS")']]], [_mobiledocDomRendererUtilsSectionTypes.LIST_SECTION_TYPE, 'script', [[[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'alert("list section XSS")']]]]]
      };

      var _renderer$render15 = renderer.render(mobiledoc);

      var result = _renderer$render15.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.ok(content.indexOf('script') === -1, 'no script tag rendered');
    });

    test('XSS: unexpected markup types are not rendered', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [['b'], // valid
        ['em'], // valid
        ['script'] // invalid
        ],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [0], 0, 'bold text'], [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [1, 2], 3, 'alert("markup XSS")'], [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'plain text']]]]
      };

      var _renderer$render16 = renderer.render(mobiledoc);

      var result = _renderer$render16.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.ok(content.indexOf('script') === -1, 'no script tag rendered');
    });

    test('XSS: links with dangerous href values are sanitized', function (assert) {
      var unsafeHref = 'javascript:alert("link XSS")'; // jshint ignore:line
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [['a', ['href', unsafeHref]]],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [0], 1, 'link text'], [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'plain text']]]]
      };

      var _renderer$render17 = renderer.render(mobiledoc);

      var result = _renderer$render17.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.equal(content, '<p><a href="unsafe:' + (0, _helpersDom.escapeQuotes)(unsafeHref) + '">link text</a>plain text</p>');
    });

    test('XSS: "a" markups are sanitized if upper or lower case', function (assert) {
      var unsafeHref = 'javascript:alert("link XSS")'; // jshint ignore:line
      var markups = [['a', ['href', unsafeHref]], ['A', ['href', unsafeHref]], ['a', ['HREF', unsafeHref]]];

      markups.forEach(function (markup) {
        var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({ markup: markup });

        var _renderer$render18 = renderer.render(mobiledoc);

        var result = _renderer$render18.result;

        var content = (0, _helpersDom.outerHTML)(result);
        assert.equal(content, '<p><a href="unsafe:' + (0, _helpersDom.escapeQuotes)(unsafeHref) + '">hello world</a></p>');
      });
    });

    test('renders a mobiledoc with atom', function (assert) {
      assert.expect(8);
      var atomName = 'hello-atom';
      var expectedPayload = { name: 'bob' };
      var expectedOptions = { foo: 'bar' };
      var expectedValue = '@BOB';
      var expectedDom = window.document;

      var atom = {
        name: atomName,
        type: 'dom',
        render: function render(_ref4) {
          var env = _ref4.env;
          var payload = _ref4.payload;
          var value = _ref4.value;
          var options = _ref4.options;

          assert.deepEqual(payload, expectedPayload, 'correct payload');
          assert.deepEqual(options, expectedOptions, 'correct options');
          assert.equal(value, expectedValue, 'correct value');
          assert.equal(env.name, atomName, 'correct name');
          assert.ok(!env.isInEditor, 'isInEditor correct');
          assert.ok(!!env.onTeardown, 'has onTeardown hook');
          assert.deepEqual(env.dom, expectedDom, 'env has dom');

          return document.createTextNode('Hello ' + value);
        }
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [['hello-atom', expectedValue, expectedPayload]],
        cards: [],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[_mobiledocDomRendererUtilsMarkerTypes.ATOM_MARKER_TYPE, [], 0, 0]]]]
      };
      renderer = new _mobiledocDomRenderer['default']({ atoms: [atom], cardOptions: expectedOptions, dom: expectedDom });

      var _renderer$render19 = renderer.render(mobiledoc);

      var rendered = _renderer$render19.result;

      var sectionEl = rendered.firstChild;
      assert.equal(sectionEl.textContent, 'Hello ' + expectedValue);
    });

    test('throws when given atom with invalid type', function (assert) {
      var atom = {
        name: 'bad',
        type: 'other',
        render: function render() {}
      };
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ atoms: [atom] });
      }, // jshint ignore:line
      /Atom "bad" must be type "dom"/);
    });

    test('throws when given atom without `render`', function (assert) {
      var atom = {
        name: 'bad',
        type: 'dom',
        render: undefined
      };
      assert.throws(function () {
        new _mobiledocDomRenderer['default']({ atoms: [atom] });
      }, // jshint ignore:line
      /Atom "bad" must define.*render/);
    });

    test('throws if atom render returns invalid result', function (assert) {
      var atom = {
        name: 'bad',
        type: 'dom',
        render: function render() {
          return 'string';
        }
      };
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [['bad', 'Bob', { id: 42 }]],
        cards: [],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[_mobiledocDomRendererUtilsMarkerTypes.ATOM_MARKER_TYPE, [], 0, 0]]]]
      };
      renderer = new _mobiledocDomRenderer['default']({ atoms: [atom] });
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Atom "bad" must render dom/);
    });

    test('atom may render nothing', function (assert) {
      var atom = {
        name: 'ok',
        type: 'dom',
        render: function render() {}
      };
      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithAtom)({
        version: MOBILEDOC_VERSION_0_3_0,
        atom: ['ok', 'Bob', { id: 42 }]
      });

      renderer = new _mobiledocDomRenderer['default']({ atoms: [atom] });
      renderer.render(mobiledoc);

      assert.ok(true, 'No error thrown');
    });

    test('throws when rendering unknown atom without unknownAtomHandler', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithAtom)({
        version: MOBILEDOC_VERSION_0_3_0,
        atom: ['missing-atom', 'Bob', { id: 42 }]
      });
      renderer = new _mobiledocDomRenderer['default']({ atoms: [], unknownAtomHandler: undefined });
      assert.throws(function () {
        return renderer.render(mobiledoc);
      }, /Atom "missing-atom" not found.*no unknownAtomHandler/);
    });

    test('rendering unknown atom uses unknownAtomHandler', function (assert) {
      assert.expect(4);

      var atomName = 'missing-atom';
      var expectedPayload = { id: 42 };
      var cardOptions = {};
      var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithAtom)({
        version: MOBILEDOC_VERSION_0_3_0,
        atom: ['missing-atom', 'Bob', { id: 42 }]
      });
      var unknownAtomHandler = function unknownAtomHandler(_ref5) {
        var env = _ref5.env;
        var payload = _ref5.payload;
        var options = _ref5.options;

        assert.equal(env.name, atomName, 'correct name');
        assert.ok(!!env.onTeardown, 'onTeardown hook exists');

        assert.deepEqual(payload, expectedPayload, 'correct payload');
        assert.deepEqual(options, cardOptions, 'correct options');
      };
      renderer = new _mobiledocDomRenderer['default']({ atoms: [], unknownAtomHandler: unknownAtomHandler, cardOptions: cardOptions });
      renderer.render(mobiledoc);
    });

    test('renders a mobiledoc with sectionElementRenderer', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'P', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'hello world']]], [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'p', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'hello world']]], [_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, 'h1', [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, 'hello world']]]]
      };
      renderer = new _mobiledocDomRenderer['default']({
        sectionElementRenderer: {
          p: function p() {
            return document.createElement('pre');
          },
          H1: function H1(tagName, dom) {
            return dom.createElement('h2');
          }
        }
      });
      var renderResult = renderer.render(mobiledoc);
      var rendered = renderResult.result;

      assert.equal((0, _helpersDom.childNodesLength)(rendered), 3, 'renders three sections');
      assert.equal(rendered.firstChild.tagName, 'PRE', 'renders a pre');
      assert.equal(rendered.firstChild.textContent, 'hello world', 'renders the text');
      assert.equal(rendered.childNodes.item(1).tagName, 'PRE', 'renders a pre');
      assert.equal(rendered.childNodes.item(2).tagName, 'H2', 'renders an h2');
    });

    test('renders a mobiledoc with markupElementRenderer', function (assert) {
      var mobiledoc = {
        version: MOBILEDOC_VERSION_0_3_0,
        atoms: [],
        cards: [],
        markups: [["a", ["href", "#foo"]]],
        sections: [[_mobiledocDomRendererUtilsSectionTypes.MARKUP_SECTION_TYPE, "p", [[_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, "Lorem ipsum "], [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [0], 1, "dolor"], [_mobiledocDomRendererUtilsMarkerTypes.MARKUP_MARKER_TYPE, [], 0, " sit amet."]]]]
      };
      renderer = new _mobiledocDomRenderer['default']({
        markupElementRenderer: {
          A: function A(tagName, dom, attrs) {
            var element = dom.createElement('span');
            element.setAttribute('data-tag', tagName);
            element.setAttribute('data-href', attrs.href);
            return element;
          }
        }
      });
      var renderResult = renderer.render(mobiledoc);
      var rendered = renderResult.result;

      assert.equal(rendered.firstChild.childNodes[1].textContent, 'dolor', 'renders text inside of marker');
      assert.equal(rendered.firstChild.childNodes[1].tagName, 'SPAN', 'transforms markup nodes');
      assert.propEqual(rendered.firstChild.childNodes[1].dataset, { tag: "a", href: "#foo" }, 'passes original tag and attributes to transform');
      assert.equal(rendered.firstChild.childNodes[0].textContent, 'Lorem ipsum ', 'renders plain text nodes');
      assert.equal(rendered.firstChild.childNodes[2].nodeType, 3, 'renders text nodes as proper type');
    });

    test('unexpected markup types are not handled by markup renderer', function (assert) {
      var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
        version: MOBILEDOC_VERSION_0_3_0,
        markup: ['script'],
        text: 'alert("markup XSS")'
      });
      renderer = new _mobiledocDomRenderer['default']({
        markupElementRenderer: {
          SCRIPT: function SCRIPT(markerType, dom) {
            return dom.createElement('script');
          }
        }
      });

      var _renderer$render20 = renderer.render(mobiledoc);

      var result = _renderer$render20.result;

      var content = (0, _helpersDom.outerHTML)(result);
      assert.ok(content.indexOf('script') === -1, 'no script tag rendered');
    });
  }

  _module('Unit: Mobiledoc DOM Renderer - 0.3', {
    beforeEach: function beforeEach() {
      renderer = new _mobiledocDomRenderer['default']();
    }
  });

  generateTests();

  test('teardown removes rendered sections from dom', function (assert) {
    var mobiledoc = (0, _helpersCreateMobiledoc.createSimpleMobiledoc)({
      version: MOBILEDOC_VERSION_0_3_0,
      text: 'Hello world'
    });

    var _renderer$render21 = renderer.render(mobiledoc);

    var rendered = _renderer$render21.result;
    var teardown = _renderer$render21.teardown;

    assert.equal((0, _helpersDom.childNodesLength)(rendered), 1, 'renders 1 section');

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(rendered);

    assert.ok((0, _helpersDom.childNodesLength)(fixture) === 1, 'precond - result is appended');

    teardown();

    assert.ok((0, _helpersDom.childNodesLength)(fixture) === 0, 'rendered result removed after teardown');
  });

  test('teardown hook calls registered teardown methods', function (assert) {
    var cardName = 'title-card';
    var didTeardown = false;

    var card = {
      name: cardName,
      type: 'dom',
      render: function render(_ref6) {
        var env = _ref6.env;

        env.onTeardown(function () {
          return didTeardown = true;
        });
      }
    };

    var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
      version: MOBILEDOC_VERSION_0_3_0,
      card: { name: cardName }
    });

    renderer = new _mobiledocDomRenderer['default']({ cards: [card] });

    var _renderer$render22 = renderer.render(mobiledoc);

    var teardown = _renderer$render22.teardown;

    assert.ok(!didTeardown, 'teardown not called');

    teardown();

    assert.ok(didTeardown, 'teardown called');
  });

  test('render hook calls registered didRender callbacks', function (assert) {
    var cardName = 'title-card';
    var didRender = false;

    var card = {
      name: cardName,
      type: 'dom',
      render: function render(_ref7) {
        var env = _ref7.env;

        env.didRender(function () {
          return didRender = true;
        });
      }
    };

    var mobiledoc = (0, _helpersCreateMobiledoc.createMobiledocWithCard)({
      version: MOBILEDOC_VERSION_0_3_0,
      card: { name: cardName }
    });

    renderer = new _mobiledocDomRenderer['default']({ cards: [card] });

    assert.ok(!didRender, 'didRender not called');

    renderer.render(mobiledoc);

    assert.ok(!!didRender, 'didRender called');
  });

  _module('Unit: Mobiledoc DOM Renderer w/ SimpleDOM - 0.3', {
    beforeEach: function beforeEach() {
      renderer = new _mobiledocDomRenderer['default']({ dom: new SimpleDOM.Document() });
    }
  });

  generateTests();
});
define('tests/unit/utils/sanitization-utils-test', ['exports', 'mobiledoc-dom-renderer/utils/sanitization-utils'], function (exports, _mobiledocDomRendererUtilsSanitizationUtils) {
  /* global QUnit */

  'use strict';

  var _QUnit = QUnit;
  var test = _QUnit.test;
  var _module = _QUnit.module;

  _module('Unit: Mobiledoc DOM Renderer - Sanitization utils');

  test('#sanitizeHref', function (assert) {
    var unsafe = ['javascript:alert("XSS")', // jshint ignore: line
    'vbscript:alert("XSS")' // jshint ignore: line
    ];

    for (var i = 0; i < unsafe.length; i++) {
      var url = unsafe[i];
      assert.equal((0, _mobiledocDomRendererUtilsSanitizationUtils.sanitizeHref)(url), 'unsafe:' + url);
    }

    var safe = ['http://www.google.com', 'https://www.google.com', 'ftp://google.com', 'http://www.google.com/with-path', 'www.google.com', 'tel:12345', 'mailto:john@doe.com'];

    for (var i = 0; i < safe.length; i++) {
      var url = safe[i];
      assert.equal((0, _mobiledocDomRendererUtilsSanitizationUtils.sanitizeHref)(url), url);
    }
  });
});