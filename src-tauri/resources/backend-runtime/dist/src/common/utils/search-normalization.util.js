"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCompactSearchText = normalizeCompactSearchText;
exports.buildCompactSearchSqlExpression = buildCompactSearchSqlExpression;
exports.buildDigitsOnlySqlExpression = buildDigitsOnlySqlExpression;
exports.buildLowerTrimSqlExpression = buildLowerTrimSqlExpression;
const SQL_COMPACT_NORMALIZE_FROM = '\u00E1\u00E0\u00E4\u00E2\u00E9\u00E8\u00EB\u00EA\u00ED\u00EC\u00EF\u00EE\u00F3\u00F2\u00F6\u00F4\u00FA\u00F9\u00FC\u00FB\u00F1';
const SQL_COMPACT_NORMALIZE_TO = 'aaaaeeeeiiiioooouuuun';
const SQLITE_COMPACT_STRIP_CHARACTERS = [
    ' ',
    '-',
    '_',
    '/',
    '.',
    ',',
];
const SQLITE_DIGITS_ONLY_STRIP_CHARACTERS = [
    ' ',
    '-',
    '(',
    ')',
    '+',
    '.',
    '/',
    '[',
    ']',
    '{',
    '}',
    ':',
];
function escapeSqlLiteral(value) {
    return value.replace(/'/g, "''");
}
function buildSqliteReplaceChain(expression, replacements) {
    return replacements.reduce((current, [from, to]) => `replace(${current}, '${escapeSqlLiteral(from)}', '${escapeSqlLiteral(to)}')`, expression);
}
function stripSqliteCharacters(expression, characters) {
    return characters.reduce((current, character) => `replace(${current}, '${escapeSqlLiteral(character)}', '')`, expression);
}
function normalizeCompactSearchText(value) {
    if (!value) {
        return '';
    }
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toLowerCase()
        .trim();
}
function buildCompactSearchSqlExpression(expression, databaseType = 'postgres') {
    if (databaseType === 'sqlite') {
        return stripSqliteCharacters(`lower(ifnull(${expression}, ''))`, SQLITE_COMPACT_STRIP_CHARACTERS);
    }
    return `regexp_replace(translate(lower(coalesce(${expression}, '')), '${SQL_COMPACT_NORMALIZE_FROM}', '${SQL_COMPACT_NORMALIZE_TO}'), '[^a-z0-9]+', '', 'g')`;
}
function buildDigitsOnlySqlExpression(expression, databaseType = 'postgres') {
    if (databaseType === 'sqlite') {
        return stripSqliteCharacters(`ifnull(${expression}, '')`, SQLITE_DIGITS_ONLY_STRIP_CHARACTERS);
    }
    return `regexp_replace(coalesce(${expression}, ''), '[^0-9]+', '', 'g')`;
}
function buildLowerTrimSqlExpression(expression, databaseType = 'postgres') {
    if (databaseType === 'sqlite') {
        return `lower(trim(ifnull(${expression}, '')))`;
    }
    return `lower(trim(coalesce(${expression}, '')))`;
}
//# sourceMappingURL=search-normalization.util.js.map