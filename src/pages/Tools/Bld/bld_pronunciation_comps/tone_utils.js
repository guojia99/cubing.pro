// Map of vowels to their tone variations
const toneMap = {
    a: ["a", "ā", "á", "ǎ", "à"],
    e: ["e", "ē", "é", "ě", "è"],
    i: ["i", "ī", "í", "ǐ", "ì"],
    o: ["o", "ō", "ó", "ǒ", "ò"],
    u: ["u", "ū", "ú", "ǔ", "ù"],
    ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};
// Order of vowels to check for tone marking
const vowelPriority = ["a", "e", "o", "i", "u", "ü"];
// Find the first vowel in the pinyin string
export function findFirstVowel(pinyin) {
    for (let i = 0; i < pinyin.length; i++) {
        const char = pinyin[i].toLowerCase();
        if (vowelPriority.includes(char)) {
            return { index: i, vowel: char };
        }
    }
    return null;
}
// Remove all tone marks from the pinyin string
export function removeTones(pinyin) {
    let result = "";
    for (let i = 0; i < pinyin.length; i++) {
        const char = pinyin[i];
        let replaced = false;
        // Check each vowel and its tone variations
        for (const [vowel, tones] of Object.entries(toneMap)) {
            if (tones.slice(1).includes(char)) {
                result += vowel;
                replaced = true;
                break;
            }
        }
        if (!replaced) {
            result += char;
        }
    }
    return result;
}
// Apply tone to the pinyin string
export function applyTone(pinyin, toneNumber) {
    // If tone is 0 or invalid, return without tone marks
    if (toneNumber < 1 || toneNumber > 4) {
        return removeTones(pinyin);
    }
    const cleanPinyin = removeTones(pinyin);
    const firstVowel = findFirstVowel(cleanPinyin);
    if (!firstVowel)
        return cleanPinyin;
    const { index, vowel } = firstVowel;
    const tonedVowel = toneMap[vowel][toneNumber];
    return cleanPinyin.substring(0, index) + tonedVowel + cleanPinyin.substring(index + 1);
}
//# sourceMappingURL=tone_utils.js.map