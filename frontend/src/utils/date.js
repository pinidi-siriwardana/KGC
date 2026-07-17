// `new Date().toISOString().slice(0, 10)` always gives the UTC calendar
// date, not the viewer's local one — for Sri Lanka (UTC+5:30) that's a full
// day behind local time for the first ~5.5 hours of every real day, which
// silently corrupted booking-date defaults/pickers and "is this slot today"
// checks during that window. Built from local getFullYear/getMonth/getDate
// instead, so it always matches whatever calendar day it actually is for
// whoever's looking at the screen.
const toLocalISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const todayISO = () => toLocalISO(new Date());

// Same local-calendar-day fix, n days back — for report/history default
// ranges. Subtracting whole days first (in local time) then formatting
// keeps this correct across a DST-less timezone like Sri Lanka's.
export const daysAgoISO = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toLocalISO(d);
};
