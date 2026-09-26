'use strict';

// precompile for speed
var HTML_TAGS_REGEX = /<[^>]*>/g;  // Anything contained in < > tags
// Forbid ANY character in the Unicode Symbol or Punctuation categories,
// which includes pretty much every common non-word character,
// including all of the following: \/:*?"<>|$%&!@#~.^`'(){}[]-_,=+;
// We actually want to allow hyphens (WORD_SEP_CHAR), but it's not easy
// to exclude them from the regex, so we'll handle them in the match function.
var FORBIDDEN_CHARS_REGEX = /[\p{S}\p{P}]/gu;
// Control chars, format chars (e.g. ZWJ), variation selectors, and the
// combining enclosing keycap. Some of these may be left behind after emoji
// symbols are removed, so we explicitly remove them here.
// Biome doesn't like seeing variation selectors in regexes, but it's intentional here
// biome-ignore lint/suspicious/noMisleadingCharacterClass: Intentionally matching standalone modifier and control characters
var INVISIBLE_CHARS_REGEX = /[\p{Cc}\p{Cf}\uFE00-\uFE0F\u20E3]/gu;

var UNICODE_REPLACEMENT_CHAR_REGEX = /�/g;  // U+FFFD, the Unicode replacement character
var WHITESPACE_REGEX = /\s+/g;  // All whitespace characters

var WORD_SEP_CHAR = '-';                                                        // Character used to separate words (replaces whitespace)
var _WORD_SEP_ESCAPED = WORD_SEP_CHAR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
var WORD_SEP_CHARS_REGEX = new RegExp(_WORD_SEP_ESCAPED + '{3,}', 'g');         // Three or more consecutive word separator chars
var TRAILING_WORD_SEP_CHAR_REGEX = new RegExp(_WORD_SEP_ESCAPED + '$', 'g');    // Trailing word separator char

// Safely under the limit for most filesystems
var DEFAULT_MAX_LEN = 60;

/**
 * Coerce a string to well-formed UTF-16, by replacing any unpaired surrogates
 * with the replacement character U+FFFD.
 *
 * Uses the native String.prototype.toWellFormed (ES2024) when available, and
 * otherwise falls back to TextEncoder/TextDecoder, which has the same effect.
 */
function toWellFormed(str) {
    if(typeof str.toWellFormed === 'function') return str.toWellFormed();
    return new TextDecoder().decode(new TextEncoder().encode(str));
}

/**
 * slugify: turn an arbitrary string into a lowercase, hyphenated,
 * filesystem-safe token (e.g. for use as a filename). Whitespace is replaced
 * with hyphens, and Unicode letters (accents, CJK, etc.) are preserved.
 * Returns a valid Unicode string.
 *
 * @param {string} str
 * @param {number} [maxLen] max length in code points (default 60)
 * @return {string}
 */
module.exports = function slugify(str, maxLen = DEFAULT_MAX_LEN) {
    var slug = toWellFormed(str ?? '')                      // Guarantee well-formed Unicode text
        .replace(UNICODE_REPLACEMENT_CHAR_REGEX, '')        // Drop Unicode replacement chars left by previous step
        .replace(HTML_TAGS_REGEX, ' ')                      // Remove < > tags, such as <br> (replace with space)
        .replace(FORBIDDEN_CHARS_REGEX, (c) => {            // Remove forbidden filename characters (but allow the word sep char)
            return c === WORD_SEP_CHAR ? c : '';
        })
        .toLowerCase()                                      // Lowercase everything
        .trim()                                             // Strip leading/trailing whitespace
        .replace(WHITESPACE_REGEX, WORD_SEP_CHAR)           // Replace any remaining whitespace with the word sep char
        .replace(INVISIBLE_CHARS_REGEX, '')                 // Remove control/format chars and emoji glue (after whitespace)
        .replace(WORD_SEP_CHARS_REGEX, WORD_SEP_CHAR);      // Replace multiple word sep chars with a single one

    if (slug.length <= maxLen) return slug;
    // Apply maxLen to the resulting string. Use Array.from().slice() instead of String.prototype.split()
    // to avoid splitting in the middle of a surrogate pair.
    return Array.from(slug).slice(0, maxLen).join('').replace(TRAILING_WORD_SEP_CHAR_REGEX, '');
};
