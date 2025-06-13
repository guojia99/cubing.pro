import type { PinyinConfig } from "./types"

// Default configuration with the specified mappings
export const defaultConfig: PinyinConfig = {
  firstLetters: {
    A: "sh",
    B: "b",
    C: "c",
    D: "d",
    E: "ch",
    F: "f",
    G: "g",
    H: "h",
    J: "j",
    K: "k",
    L: "l",
    M: "m",
    N: "n",
    P: "p",
    Q: "q",
    R: "r",
    S: "s",
    T: "t",
    W: "w",
    X: "x",
    Y: "y",
    Z: "z",
  },
  secondLetters: {

    C: "ā",
    D: "à",

    E: "ō",
    F: "ò",

    G: "ē",
    H: "è",

    A: "ī",
    J: "ì",


    K: "ū",
    L: "ù",

    M: "āo",
    N: "ào",

    B: "ūn",
    P: "ùn",

    Q: "āng",
    R: "àng",

    S: "ēng",
    T: "èng",

    W: "īng",
    X: "ìng",

    Y: "ōng",
    Z: "òng",
  },
}
