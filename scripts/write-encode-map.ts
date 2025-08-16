import htmlMap from "../maps/entities.json" with { type: "json" };
import { writeFileSync } from "node:fs";

const encodings: Record<string, string> = {};
for (const [encoding, character] of Object.entries(htmlMap)) {
    // Never prefer longer encodings
    if (encodings[character] && encoding.length > encodings[character].length) {
        continue;
    }
    // Never prefer encodings of the same length that aren't lowercase
    if (
        encodings[character] &&
        encoding.length === encodings[character].length &&
        encoding !== encoding.toLowerCase()
    ) {
        continue;
    }

    encodings[character] = encoding;
}

const shortCharacters: string[] = [];
let lastCode = 0;
for (const [code, encoding] of Object.entries(encodings)
    .map(
        ([character, encoding]) =>
            [
                character.charCodeAt(0) +
                    (character.length > 1
                        ? character.charCodeAt(1) * 65_536
                        : 0),
                encoding,
            ] as const,
    )
    .sort(([a], [b]) => a - b)) {
    const delta = code - lastCode;
    shortCharacters.push(`${delta}${encoding}`);

    lastCode = code;
}

writeFileSync(
    new URL("../src/generated/encode-html.ts", import.meta.url),
    `let code = 0;
export const map: Record<string, string> = {};
for (const joined of ${JSON.stringify(shortCharacters.join("+"))}.split(
    "+",
)) {
    const n = Number.parseInt(joined);
    code += n;
    map[
        code > 65536
            ? String.fromCharCode(code, Math.floor(code / 65536))
            : String.fromCharCode(code)
    ] = joined.slice(n.toString().length);
}
`,
);
