export function parseDateTime(val: string) {

  const date = new Date(val);

// 获取年、月和日
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 注意：getMonth() 返回的月份是从 0 开始的，所以需要加 1
  const day = date.getDate();

  let mStr = "" + month
  if (month < 10){
    mStr = "0" + month;
  }
  let dStr = "" + day
  if (day < 10){
    dStr = "0" + day
  }

  return year + "年" + mStr + "月" + dStr + "日"
}
