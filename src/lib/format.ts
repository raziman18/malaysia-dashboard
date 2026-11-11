const timeZone = "Asia/Kuala_Lumpur";

export const ringgit = (value: number, digits = 2) => `RM ${value.toFixed(digits)}`;
export const monthLabel = (isoDate: string) => new Date(isoDate).toLocaleDateString("en-MY", { month: "long", year: "numeric", timeZone });
export const dayLabel = (date: Date | string) => new Date(date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone });
export const timeLabel = (date: Date) => date.toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone });
export const quarterLabel = (isoDate: string) => `Q${Math.floor(Number(isoDate.slice(5, 7)) / 3) + 1} ${isoDate.slice(0, 4)}`;
