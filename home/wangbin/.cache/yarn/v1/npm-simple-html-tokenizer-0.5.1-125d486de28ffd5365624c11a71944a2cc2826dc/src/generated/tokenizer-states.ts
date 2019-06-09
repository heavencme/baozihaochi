/**
 * generated from https://raw.githubusercontent.com/w3c/html/26b5126f96f736f796b9e29718138919dd513744/sections/syntax.include
 * do not edit
 */
export const enum TokenizerState {
  beforeData = 'beforeData',
  data = 'data',
  rcdata = 'rcdata',
  rawtext = 'rawtext',
  scriptData = 'scriptData',
  plaintext = 'plaintext',
  tagOpen = 'tagOpen',
  endTagOpen = 'endTagOpen',
  tagName = 'tagName',
  rcdataLessThanSign = 'rcdataLessThanSign',
  rcdataEndTagOpen = 'rcdataEndTagOpen',
  rcdataEndTagName = 'rcdataEndTagName',
  rawtextLessThanSign = 'rawtextLessThanSign',
  rawtextEndTagOpen = 'rawtextEndTagOpen',
  rawtextEndTagName = 'rawtextEndTagName',
  scriptDataLessThanSign = 'scriptDataLessThanSign',
  scriptDataEndTagOpen = 'scriptDataEndTagOpen',
  scriptDataEndTagName = 'scriptDataEndTagName',
  scriptDataEscapeStart = 'scriptDataEscapeStart',
  scriptDataEscapseStartDash = 'scriptDataEscapseStartDash',
  scriptDataEscaped = 'scriptDataEscaped',
  scriptDataEscapedDash = 'scriptDataEscapedDash',
  scriptDataEscapedDashDash = 'scriptDataEscapedDashDash',
  scriptDataEscapedLessThanSign = 'scriptDataEscapedLessThanSign',
  scriptDataEscapedEndTagOpen = 'scriptDataEscapedEndTagOpen',
  scriptDataEscapedEndTagName = 'scriptDataEscapedEndTagName',
  scriptDataDoubleEscapeStart = 'scriptDataDoubleEscapeStart',
  scriptDataDoubleEscaped = 'scriptDataDoubleEscaped',
  scriptDataDoubleEscapedDash = 'scriptDataDoubleEscapedDash',
  scriptDataDoubleEscapedDashDash = 'scriptDataDoubleEscapedDashDash',
  scriptDataDoubleEscapedLessThanSign = 'scriptDataDoubleEscapedLessThanSign',
  scriptDataDoubleEscapeEnd = 'scriptDataDoubleEscapeEnd',
  beforeAttributeName = 'beforeAttributeName',
  attributeName = 'attributeName',
  afterAttributeName = 'afterAttributeName',
  beforeAttributeValue = 'beforeAttributeValue',
  attributeValueDoubleQuoted = 'attributeValueDoubleQuoted',
  attributeValueSingleQuoted = 'attributeValueSingleQuoted',
  attributeValueUnquoted = 'attributeValueUnquoted',
  afterAttributeValueQuoted = 'afterAttributeValueQuoted',
  selfClosingStartTag = 'selfClosingStartTag',
  bogusComment = 'bogusComment',
  markupDeclarationOpen = 'markupDeclarationOpen',
  commentStart = 'commentStart',
  commentStartDash = 'commentStartDash',
  comment = 'comment',
  commentLessThanSign = 'commentLessThanSign',
  commentLessThanSignBang = 'commentLessThanSignBang',
  commentLessThanSignBangDash = 'commentLessThanSignBangDash',
  commentLessThanSignBangDashDash = 'commentLessThanSignBangDashDash',
  commentEndDash = 'commentEndDash',
  commentEnd = 'commentEnd',
  commentEndBang = 'commentEndBang',
  doctype = 'doctype',
  beforeDoctypeName = 'beforeDoctypeName',
  doctypeName = 'doctypeName',
  afterDoctypeName = 'afterDoctypeName',
  afterDoctypePublicKeyword = 'afterDoctypePublicKeyword',
  beforeDoctypePublicIdentifier = 'beforeDoctypePublicIdentifier',
  doctypePublicIdentifierDoubleQuoted = 'doctypePublicIdentifierDoubleQuoted',
  doctypePublicIdentifierSingleQuoted = 'doctypePublicIdentifierSingleQuoted',
  afterDoctypePublicIdentifier = 'afterDoctypePublicIdentifier',
  betweenDoctypePublicAndSystemIdentifiers = 'betweenDoctypePublicAndSystemIdentifiers',
  afterDoctypeSystemKeyword = 'afterDoctypeSystemKeyword',
  beforeDoctypeSystemIdentifier = 'beforeDoctypeSystemIdentifier',
  doctypeSystemIdentifierDoubleQuoted = 'doctypeSystemIdentifierDoubleQuoted',
  doctypeSystemIdentifierSingleQuoted = 'doctypeSystemIdentifierSingleQuoted',
  afterDoctypeSystemIdentifier = 'afterDoctypeSystemIdentifier',
  bogusDoctype = 'bogusDoctype',
  cdataSection = 'cdataSection',
  cdataSectionBracket = 'cdataSectionBracket',
  cdataSectionEnd = 'cdataSectionEnd',
  characterReference = 'characterReference',
  numericCharacterReference = 'numericCharacterReference',
  hexadecimalCharacterReferenceStart = 'hexadecimalCharacterReferenceStart',
  decimalCharacterReferenceStart = 'decimalCharacterReferenceStart',
  hexadecimalCharacterReference = 'hexadecimalCharacterReference',
  decimalCharacterReference = 'decimalCharacterReference',
  numericCharacterReferenceEnd = 'numericCharacterReferenceEnd',
  characterReferenceEnd = 'characterReferenceEnd'
}
