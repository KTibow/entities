import { map } from "./generated/encode-html.js";
import { xmlReplacer, getCodePoint } from "./escape.js";

const htmlReplacer = /[\t\n\f!-,./:-@[-`{-}\u0080-\uFFFF]/g;

/**
 * Encodes all characters in the input using HTML entities. This includes
 * characters that are valid ASCII characters in HTML documents, such as `#`.
 *
 * To get a more compact output, consider using the `encodeNonAsciiHTML`
 * function, which will only encode characters that are not valid in HTML
 * documents, as well as non-ASCII characters.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 */
export function encodeHTML(input: string): string {
    return encodeHTMLTrieRe(htmlReplacer, input);
}
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities. This function will not encode characters that
 * are valid in HTML documents, such as `#`.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 */
export function encodeNonAsciiHTML(input: string): string {
    return encodeHTMLTrieRe(xmlReplacer, input);
}

function encodeHTMLTrieRe(regExp: RegExp, input: string): string {
    let skipIndex = -1;

    return input.replace(
        regExp,
        (character: string, index: number, string: string): string => {
            // If we already consumed this index as the second part of a previous replacement, skip it.
            if (index === skipIndex) {
                skipIndex = -1;
                return "";
            }

            // Try two-character mapping first (covers surrogate pairs or other mapped sequences).
            if (index + 1 < string.length) {
                const nextChar = string.charAt(index + 1);
                const pairKey = character + nextChar;
                if (pairKey in map) {
                    skipIndex = index + 1; // We consumed a surrogate pair, skip next.
                    return `&${map[pairKey]};`;
                }
            }

            // Then try single-character mapping.
            if (character in map) {
                return `&${map[character]};`;
            }

            // Fallback: Use numeric hexadecimal reference. Handle surrogate pairs via getCodePoint.
            const cp = getCodePoint(string, index);
            if (cp !== character.charCodeAt(0)) {
                skipIndex = index + 1; // We consumed a surrogate pair, skip next.
            }
            return `&#x${cp.toString(16)};`;
        },
    );
}
