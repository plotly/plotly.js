'use strict';

const NUMBER_REGEX = '([2-9]|[1-9][0-9]+)?';

/**
 * Make a regex for matching counter ids/names, for example xaxis, xaxis2, xaxis10
 *
 * @param head - The head of the pattern, for example 'x' matches 'x', 'x2', 'x10'.
 *      'xy' is a special case for cartesian subplots: it matches 'x2y3'.
 * @param tail - A fixed piece after the id.
 *      For example, counterRegex('scene', '.annotations') for scene2.annotations.
 * @param openEnded - If true, the string may continue past the match
 * @param matchBeginning - If false, the string may start before the match
 */
export function counter(head: string, tail: string = '', openEnded?: boolean, matchBeginning?: boolean) {
    const fullTail = tail + (openEnded ? '' : '$');
    const startWithPrefix = matchBeginning === false ? '' : '^';
    return head === 'xy'
        ? new RegExp(startWithPrefix + 'x' + NUMBER_REGEX + 'y' + NUMBER_REGEX + fullTail)
        : new RegExp(startWithPrefix + head + NUMBER_REGEX + fullTail);
}
