'use strict';

exports.sanitizeHref = sanitizeHref;
exports.reduceAttributes = reduceAttributes;

var _arrayUtils = require('./array-utils');

var PROTOCOL_REGEXP = /^([a-z0-9.+-]+:)/i;

var badProtocols = ['javascript:', // jshint ignore:line
'vbscript:' // jshint ignore:line
];

function getProtocol(url) {
  var matches = url && url.match(PROTOCOL_REGEXP);
  var protocol = matches && matches[0] || ':';
  return protocol;
}

function sanitizeHref(url) {
  var protocol = getProtocol(url);
  if ((0, _arrayUtils.includes)(badProtocols, protocol)) {
    return 'unsafe:' + url;
  }
  return url;
}

/**
 * @param attributes array
 * @return obj with normalized attribute names (lowercased)
 */

function reduceAttributes(attributes) {
  var obj = {};
  for (var i = 0; i < attributes.length; i += 2) {
    var key = attributes[i];
    var val = attributes[i + 1];
    obj[key.toLowerCase()] = val;
  }
  return obj;
}