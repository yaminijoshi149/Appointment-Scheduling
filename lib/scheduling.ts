import { appointmentSlots, doctors, type AppointmentSlot, type Doctor } from "@/lib/mock-data";

const weekdayMap: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function parseSlotDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`);
}

function parseTimeToMinutes(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return 0;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

export function validateDob(value: string) {
  const trimmed = value.trim();
  return /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed) || /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
}

export function validatePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function matchDoctorByReason(reason: string): Doctor | null {
  const query = normalize(reason);

  let bestDoctor: Doctor | null = null;
  let bestScore = 0;

  for (const doctor of doctors) {
    let score = 0;

    for (const keyword of doctor.bodyPartKeywords) {
      if (query.includes(normalize(keyword))) {
        score += 2;
      }
    }

    if (query.includes(normalize(doctor.specialty))) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestDoctor = doctor;
    }
  }

  return bestScore > 0 ? bestDoctor : null;
}

export function getSlotsForDoctor(doctorId: string) {
  return appointmentSlots
    .filter((slot) => slot.doctorId === doctorId)
    .sort((a, b) => {
      const aDate = parseSlotDate(a.date).getTime();
      const bDate = parseSlotDate(b.date).getTime();

      if (aDate !== bDate) return aDate - bDate;
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });
}

export function formatSlotLabel(slot: AppointmentSlot) {
  const date = parseSlotDate(slot.date);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date) + ` at ${slot.time}`;
}

export function filterSlotsByPreference(slots: AppointmentSlot[], preference: string) {
  const query = normalize(preference);
  let filtered = [...slots];

  const weekdayEntry = Object.entries(weekdayMap).find(([key]) => query.includes(key));
  if (weekdayEntry) {
    const weekday = weekdayEntry[1];
    filtered = filtered.filter((slot) => parseSlotDate(slot.date).getDay() === weekday);
  }

  if (query.includes("next week")) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 7);

    const end = new Date(today);
    end.setDate(today.getDate() + 14);

    filtered = filtered.filter((slot) => {
      const d = parseSlotDate(slot.date);
      return d >= start && d <= end;
    });
  }

  if (query.includes("this week")) {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 6);

    filtered = filtered.filter((slot) => {
      const d = parseSlotDate(slot.date);
      return d >= today && d <= end;
    });
  }

  if (query.includes("morning")) {
    filtered = filtered.filter((slot) => parseTimeToMinutes(slot.time) < 12 * 60);
  }

  if (query.includes("afternoon")) {
    filtered = filtered.filter((slot) => {
      const mins = parseTimeToMinutes(slot.time);
      return mins >= 12 * 60 && mins < 17 * 60;
    });
  }

  if (query.includes("evening")) {
    filtered = filtered.filter((slot) => parseTimeToMinutes(slot.time) >= 17 * 60);
  }

  return filtered;
}

export function isNoPreference(text: string) {
  const query = normalize(text);
  return (
    query.includes("no preference") ||
    query.includes("anything") ||
    query.includes("any time") ||
    query.includes("doesn't matter") ||
    query.includes("doesnt matter") ||
    query.includes("first available") ||
    query.includes("earliest")
  );
}

export function resolveSlotFromInput(input: string, slots: AppointmentSlot[]) {
  const query = normalize(input);

  const ordinalMap: Record<string, number> = {
    "1": 0,
    first: 0,
    "2": 1,
    second: 1,
    "3": 2,
    third: 2,
    "4": 3,
    fourth: 3,
    "5": 4,
    fifth: 4,
  };

  for (const [key, index] of Object.entries(ordinalMap)) {
    if (query === key || query.includes(`${key} one`) || query.includes(`${key} option`) || query.includes(key)) {
      if (slots[index]) return slots[index];
    }
  }

  const matchedByLabel = slots.find((slot) => formatSlotLabel(slot).toLowerCase() === query);
  if (matchedByLabel) return matchedByLabel;

  return null;
}