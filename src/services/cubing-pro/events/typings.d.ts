

export declare namespace EventsAPI {
  type Event = {
    id: string,
    name: string,
    otherNames: string,
    class: string,
    isComp: boolean,
    icon: string,
    iconBase64: string,
    isWCA: boolean,
    base_route_typ: number,
  }

  type EventsResponse = {
    code: string,
    data: {
      Events: Event[],
      UpdateTime: string,
    }
    msg: string
  }

 export function ParamsRouteTypeString(input: number): string {
    const table = {
      0: "非比赛项目",
      1: "单轮项目",
      2: "三轮取平均",
      3: "三轮取平均(单次取整)",
      4: "五轮取最佳",
      5: "五轮取平均",
      6: "五轮去头尾取平均",
      7: "单轮多次尝试",
      8: "两轮多次尝试取最佳",
      9: "三轮多次尝试取最佳"
    }
    let inp = input
    if (input > 9){
      inp = 0
    }
    return table[inp]
  }
}


