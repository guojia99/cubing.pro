export function isNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) {
        return true;
    }
    return typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value));
}
//# sourceMappingURL=numbers.js.map