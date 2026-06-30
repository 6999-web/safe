export function toSqlDateTime(date = new Date()) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function toDateKey(value) {
  return String(value).substring(0, 10);
}
