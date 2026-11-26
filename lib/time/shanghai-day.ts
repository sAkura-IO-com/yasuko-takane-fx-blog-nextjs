const TIME_ZONE = "Asia/Shanghai";
const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
});

export function shanghaiDayKey(now = new Date()): string {
  return dayKeyFormatter.format(now);
}

export function shiftShanghaiDayKey(dayKey: string, deltaDays: number): string {
  const match = DAY_KEY.exec(dayKey);
  if (!match) throw new Error(`无效的日键 ${dayKey}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(shifted.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function shanghaiDayStart(dayKey: string): Date {
  if (!DAY_KEY.test(dayKey)) throw new Error(`无效的日键 ${dayKey}`);
  return new Date(`${dayKey}T00:00:00+08:00`);
}
