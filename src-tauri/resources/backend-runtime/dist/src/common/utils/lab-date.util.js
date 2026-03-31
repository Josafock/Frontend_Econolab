"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabDateInput = getLabDateInput;
exports.getLabDateToken = getLabDateToken;
exports.getMonthKey = getMonthKey;
exports.getLocalDateExpression = getLocalDateExpression;
exports.getLocalDateTokenExpression = getLocalDateTokenExpression;
function getDatePartsInTimeZone(timeZone, value, options) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        ...options,
    });
    return formatter.formatToParts(value);
}
function getLabDateInput(timeZone, value = new Date()) {
    const parts = getDatePartsInTimeZone(timeZone, value, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    const day = parts.find((part) => part.type === 'day')?.value ?? '01';
    return `${year}-${month}-${day}`;
}
function getLabDateToken(timeZone, value = new Date()) {
    return getLabDateInput(timeZone, value).replace(/-/g, '');
}
function getMonthKey(timeZone, value = new Date()) {
    const parts = getDatePartsInTimeZone(timeZone, value, {
        year: 'numeric',
        month: '2-digit',
    });
    const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    return `${year}-${month}`;
}
function getLocalDateExpression(timeZone, expression, databaseType = 'postgres') {
    if (databaseType === 'sqlite') {
        return `date(${expression})`;
    }
    return `date(timezone('${timeZone}', ${expression}))`;
}
function getLocalDateTokenExpression(timeZone, expression, databaseType = 'postgres') {
    if (databaseType === 'sqlite') {
        return `replace(date(${expression}), '-', '')`;
    }
    return `to_char(timezone('${timeZone}', ${expression}), 'YYYYMMDD')`;
}
//# sourceMappingURL=lab-date.util.js.map