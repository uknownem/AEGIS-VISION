/**
 * Utility function to return exact local timestamp in YYYY-MM-DD HH:mm:ss format
 * Ensures local timezone accuracy (e.g. Indian Standard Time / Browser Local Time)
 * instead of UTC offset mismatch.
 */
export const getExactLocalTimestamp = (dateInput?: Date | string | number): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())} ${pad(fallback.getHours())}:${pad(fallback.getMinutes())}:${pad(fallback.getSeconds())}`;
  }
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};
