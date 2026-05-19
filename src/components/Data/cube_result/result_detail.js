export const resultsToMap = (results) => {
    let withEvent = new Map();
    let withPlayer = new Map();
    for (const result of results) {
        if (withEvent.get(result.EventID) === undefined) {
            withEvent.set(result.EventID, []);
        }
        let list = withEvent.get(result.EventID);
        list.push(result);
        withEvent.set(result.EventID, list);
        if (withPlayer.get(result.PersonName) === undefined) {
            withPlayer.set(result.PersonName, []);
        }
        let list2 = withPlayer.get(result.PersonName);
        list2.push(result);
        withPlayer.set(result.PersonName, list2);
    }
    return {
        withEvent: withEvent,
        withPlayer: withPlayer,
    };
};
//# sourceMappingURL=result_detail.js.map