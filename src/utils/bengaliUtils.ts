// Bengali utility functions for numerals, dates, and currency formatting

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '০';
  const str = typeof val === 'number' ? val.toString() : val;
  return str.replace(/\d/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] ?? digit);
}

export function formatTaka(amount: number, showSymbol = true): string {
  const rounded = Math.round(amount * 100) / 100;
  // Format with commas in international/South Asian notation
  const parts = rounded.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts[1] === '00' ? '' : '.' + parts[1];
  const formatted = toBengaliNumber(integerPart + decimalPart);
  return showSymbol ? `৳ ${formatted}` : formatted;
}

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export function formatBengaliDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = BENGALI_DAYS[dateObj.getDay()];
    const monthName = BENGALI_MONTHS[month - 1];
    return `${toBengaliNumber(day)} ${monthName}, ${toBengaliNumber(year)} (${dayName})`;
  } catch {
    return toBengaliNumber(dateStr);
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-indexed
  };
}

export const DEDUCTION_PER_DAY = 666.67; // 1 দিন অনুপস্থিতির জন্য ৬৬৬.৬৭ টাকা
export const MONTHLY_ALLOWED_LEAVE = 1; // প্রতি মাসে ১ দিন বেতনসহ ছুটি
