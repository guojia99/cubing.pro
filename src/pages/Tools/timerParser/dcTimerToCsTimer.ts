const dcTypeMap: Record<number, string> = {
  '-25': '333ft',
};

export function dcTimerTypeToCsTimerEvent(dcType: number): string {
  if (dcType in dcTypeMap) {
    return dcTypeMap[dcType];
  }

  if (dcType === -29 || (dcType >= 0 && dcType < 32)) {
    return '222'; // 二阶
  }
  if (
    dcType === -32 ||
    dcType === -27 ||
    dcType === -25 ||
    dcType === -28 ||
    dcType === -26 ||
    (dcType > 31 && dcType < 64) ||
    (dcType > 543 && dcType < 576)
  ) {
    return '333'; // 三阶
  }
  if (dcType === -31 || dcType === -17 || (dcType > 63 && dcType < 96)) {
    return '444'; // 四阶
  }
  if (dcType === -30 || dcType === -16 || (dcType > 95 && dcType < 128)) {
    return '555wca'; // 五阶
  }
  if (dcType === -19 || (dcType > 127 && dcType < 160)) {
    return '666wca'; // 六阶
  }
  if (dcType === -18 || (dcType > 159 && dcType < 192)) {
    return '777wca'; // 七阶
  }
  if (dcType === -23 || (dcType > 223 && dcType < 256)) {
    return 'pyrm'; // 金字塔
  }
  if (dcType === -20 || (dcType > 319 && dcType < 352)) {
    return 'skb'; // 斜转
  }
  if (dcType === -24 || (dcType > 191 && dcType < 224)) {
    return 'mgmo'; // Megaminx
  }
  if (dcType === -22 || (dcType > 255 && dcType < 288)) {
    return 'sqrs'; // Square-1
  }
  if (dcType === -21 || (dcType > 287 && dcType < 320)) {
    return 'clkwca'; // 魔表
  }

  return '333'; // 默认 三阶
}
