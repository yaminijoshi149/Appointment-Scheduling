export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  bodyPartKeywords: string[];
  office: string;
  address: string;
  hours: string;
};

export type AppointmentSlot = {
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string;
};

export const doctors: Doctor[] = [
  {
    id: "ortho-1",
    name: "Dr. Maya Chen",
    specialty: "Orthopedics",
    bodyPartKeywords: ["knee", "leg", "shoulder", "elbow", "ankle", "hip", "joint", "bone", "arm"],
    office: "Kyron Medical - Downtown",
    address: "1450 Market Street, Suite 300, San Francisco, CA 94103",
    hours: "Mon-Fri, 8:00 AM - 5:00 PM",
  },
  {
    id: "cardio-1",
    name: "Dr. James Patel",
    specialty: "Cardiology",
    bodyPartKeywords: ["heart", "chest", "palpitations", "blood pressure", "cardiac"],
    office: "Kyron Medical - Mission Bay",
    address: "2100 Owens Street, Suite 210, San Francisco, CA 94158",
    hours: "Mon-Thu, 9:00 AM - 4:30 PM",
  },
  {
    id: "derm-1",
    name: "Dr. Sofia Ramirez",
    specialty: "Dermatology",
    bodyPartKeywords: ["skin", "rash", "scalp", "acne", "mole", "itching"],
    office: "Kyron Medical - Sunset",
    address: "1720 Irving Street, Suite 120, San Francisco, CA 94122",
    hours: "Tue-Fri, 8:30 AM - 4:00 PM",
  },
  {
    id: "ent-1",
    name: "Dr. Ethan Brooks",
    specialty: "ENT",
    bodyPartKeywords: ["ear", "nose", "throat", "sinus", "hearing", "tonsils"],
    office: "Kyron Medical - Pacific Heights",
    address: "2435 Fillmore Street, Suite 410, San Francisco, CA 94115",
    hours: "Mon-Fri, 9:00 AM - 5:30 PM",
  },
];

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Generates availability over the next ~45 days using fixed weekly patterns.
// This is still "hard-coded" logic, just cleaner than manually typing 100+ slots.
export const appointmentSlots: AppointmentSlot[] = [];

const weeklyTemplates: Record<string, { weekday: number; times: string[] }[]> = {
  "ortho-1": [
    { weekday: 2, times: ["09:00 AM", "11:00 AM", "02:00 PM"] }, // Tue
    { weekday: 4, times: ["10:00 AM", "01:30 PM", "03:30 PM"] }, // Thu
  ],
  "cardio-1": [
    { weekday: 1, times: ["09:30 AM", "11:30 AM"] }, // Mon
    { weekday: 3, times: ["10:30 AM", "01:00 PM", "03:00 PM"] }, // Wed
  ],
  "derm-1": [
    { weekday: 2, times: ["08:30 AM", "10:30 AM", "01:30 PM"] }, // Tue
    { weekday: 5, times: ["09:00 AM", "11:00 AM", "02:30 PM"] }, // Fri
  ],
  "ent-1": [
    { weekday: 1, times: ["09:00 AM", "01:00 PM"] }, // Mon
    { weekday: 4, times: ["10:00 AM", "12:00 PM", "04:00 PM"] }, // Thu
  ],
};

const today = new Date();

for (let i = 0; i < 45; i++) {
  const date = addDays(today, i);
  const weekday = date.getDay();

  for (const doctor of doctors) {
    const templates = weeklyTemplates[doctor.id] || [];
    for (const template of templates) {
      if (template.weekday === weekday) {
        for (const time of template.times) {
          appointmentSlots.push({
            doctorId: doctor.id,
            date: formatDate(date),
            time,
          });
        }
      }
    }
  }
}

export const quickActions = [
  "Schedule an appointment",
  "Check prescription refill",
  "Office hours and address",
  "Continue on phone",
];