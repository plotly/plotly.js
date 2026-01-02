'use strict';

const NUMBER_REGEX = '([2-9]|[1-9][0-9]+)?';

/**
 * make a regex for matching counter ids/names ie xaxis, xaxis2, xaxis10...
 *
 * @param head: the head of the pattern, eg 'x' matches 'x', 'x2', 'x10' etc.
 *      'xy' is a special case for cartesian subplots: it matches 'x2y3' etc
 * @param tail: a fixed piece after the id
 *      eg counterRegex('scene', '.annotations') for scene2.annotations etc.
 * @param openEnded: if true, the string may continue past the match.
 * @param matchBeginning: if false, the string may start before the match.
 */
export function counter(head: string, tail: string = '', openEnded: boolean, matchBeginning: boolean) {
    const fullTail = tail + (openEnded ? '' : '$');
    const startWithPrefix = matchBeginning === false ? '' : '^';
    return head === 'xy'
        ? new RegExp(startWithPrefix + 'x' + NUMBER_REGEX + 'y' + NUMBER_REGEX + fullTail)
        : new RegExp(startWithPrefix + head + NUMBER_REGEX + fullTail);
}
