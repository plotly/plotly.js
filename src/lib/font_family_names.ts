'use strict';

/**
 * Split a CSS `font-family` value into lowercase family names without quotes.
 *
 * @param value - A `font-family` value, such as `"Open Sans", verdana, sans-serif`
 * @returns The family names in order. A comma inside quotes stays part of its name.
 */
export function fontFamilyNames(value: string): string[] {
    return (value.match(/"[^"]*"|'[^']*'|[^,]+/g) || []).map((name) =>
        name
            .trim()
            .replace(/^["']|["']$/g, '')
            .toLowerCase()
    );
}
