The Peak Font Plus Regular v1.002 (随峰体 Plus), published by cjkFonts:
https://cjkfonts.io/blog/ThePeakFontPlus
Official archive: https://cjkfonts.io/downloadfont?font_id=cjkfonts_004&v=0.02
Original: ThePeakFontPlus-Regular.ttf
SHA-256: 4a3ec7396adc029ad7fd25b4ddbf719e59f3a4a5ec03d6c95cbf07296e6d9f5b.

The original font's copyright field reads "cjkFonts". Its designer field
credits Aa Kwan, Jeffrey Xuan, Moonlit Owen, Luke036. The project page
credits Aa Kwan for the original handwriting and describes the integration
of derivative releases in Plus.

The WOFF2 subsets in slices/ are distributed under the same SIL OFL 1.1
(OFL.txt). Together they cover all 16,739 mapped Unicode code points of
the full WOFF2 conversion, with no overlap. common.woff2 covers mapped
ASCII, Latin and punctuation ranges, GB2312 Level-1 characters, 炜 and 隽.
The rest are sorted by code point and packed into rare-NN.woff2 files
(up to 1,000 code points and 400,000 bytes each). Only slices matching a
nickname are fetched. Uncovered characters use the platform's fallback fonts.

Rebuild from the frontend repository root (Python 3.13, fontTools 4.68.0,
Brotli 1.2.1). The full WOFF2 is a build input, not a served asset:

  git show 2dfe9b7e5d06929bccd67f323778a60de9c5cbd6:public/fonts/player-card/the-peak-font-plus.woff2 > /tmp/the-peak-font-plus.woff2
  shasum -a 256 /tmp/the-peak-font-plus.woff2
  ./var/font-venv/bin/python scripts/split-player-card-font.py /tmp/the-peak-font-plus.woff2

Expected source WOFF2 SHA-256:
ef761b00804269013cfafaa24121da503ea34360d10a4b5a5319d99720d11d65
The generator also writes nicknameFontSlices.ts from the saved subset cmaps.

The official project page and the original font's embedded license specify
SIL Open Font License 1.1. No Reserved Font Name is declared in either.
OFL.txt includes the full OFL 1.1 text from:
https://spdx.org/licenses/OFL-1.1.html
