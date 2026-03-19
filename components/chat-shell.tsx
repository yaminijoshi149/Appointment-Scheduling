"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock3,
  Mail,
  MapPin,
  PhoneCall,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { doctors, quickActions, type AppointmentSlot, type Doctor } from "@/lib/mock-data";
import {
  filterSlotsByPreference,
  formatSlotLabel,
  getSlotsForDoctor,
  isNoPreference,
  matchDoctorByReason,
  resolveSlotFromInput,
  validateDob,
  validateEmail,
  validatePhone,
} from "@/lib/scheduling";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type IntakeStage =
  | "idle"
  | "firstName"
  | "lastName"
  | "dob"
  | "phone"
  | "email"
  | "reason"
  | "slotPreference"
  | "slotSelection"
  | "booked";

type PatientIntake = {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  reason: string;
};

const initialPatient: PatientIntake = {
  firstName: "",
  lastName: "",
  dob: "",
  phone: "",
  email: "",
  reason: "",
};

function makeId() {
  return `${Date.now()}-${Math.random()}`;
}

export default function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: "assistant",
      text: "Hi, I’m Kyron’s virtual patient assistant. I can help schedule an appointment, check office details, answer general workflow questions, or continue this conversation by phone.",
    },
  ]);

  const [input, setInput] = useState("");
  const [stage, setStage] = useState<IntakeStage>("idle");
  const [patient, setPatient] = useState<PatientIntake>(initialPatient);
  const [matchedDoctor, setMatchedDoctor] = useState<Doctor | null>(null);
  const [slotOptions, setSlotOptions] = useState<AppointmentSlot[]>([]);
  const [bookedSlot, setBookedSlot] = useState<AppointmentSlot | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [callStatus, setCallStatus] = useState<"idle" | "starting" | "started" | "error">("idle");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, slotOptions]);

  

  const currentOfficeSummary = useMemo(() => {
    return doctors.map((doctor) => `${doctor.office} — ${doctor.address} (${doctor.hours})`);
  }, []);

  function addAssistantMessage(text: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text }]);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: "user", text }]);
  }

  function resetSchedulingState() {
    setStage("idle");
    setPatient(initialPatient);
    setMatchedDoctor(null);
    setSlotOptions([]);
    setBookedSlot(null);
    setEmailStatus("idle");
    setCallStatus("idle");
  }

  function startSchedulingFlow() {
    setPatient(initialPatient);
    setMatchedDoctor(null);
    setSlotOptions([]);
    setBookedSlot(null);
    setStage("firstName");
    addAssistantMessage("Let’s get your appointment scheduled. What’s your first name?");
  }

    async function startPhoneCall() {
    if (!patient.phone) {
      addAssistantMessage(
        "I need a phone number before I can continue this conversation by phone."
      );
      return;
    }

    try {
      setCallStatus("starting");

      const response = await fetch("/api/start-phone-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: patient.firstName,
          lastName: patient.lastName,
          dob: patient.dob,
          phone: patient.phone,
          email: patient.email,
          reason: patient.reason,
          doctorName: matchedDoctor?.name || "",
          specialty: matchedDoctor?.specialty || "",
          slotLabel: bookedSlot ? formatSlotLabel(bookedSlot) : "",
          office: matchedDoctor?.office || "",
          address: matchedDoctor?.address || "",
        }),
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("start-phone-call route error:", errorData);
          throw new Error(
            errorData?.vapiBody ||
              errorData?.details ||
              errorData?.error ||
              "Failed to start phone call."
          );
      }

      setCallStatus("started");
      addAssistantMessage(
        `I’m calling ${patient.phone} now to continue this conversation by voice.`
      );
    } catch (error) {
      console.error("Phone call error:", error);

      setCallStatus("error");
      addAssistantMessage(
        "I couldn’t start the phone call yet. Please check your Vapi setup and phone number format."
      );
    }
  }

  function handleQuickAction(action: string) {
    addUserMessage(action);

    if (action === "Schedule an appointment") {
      startSchedulingFlow();
      return;
    }

    if (action === "Check prescription refill") {
      addAssistantMessage(
        "I can help with refill status questions. For this MVP, I can collect the medication name and route you to the practice workflow, but I can’t provide medical advice or approve prescriptions."
      );
      return;
    }

    if (action === "Office hours and address") {
      addAssistantMessage(
        `Here are the current practice locations:\n\n${currentOfficeSummary.join("\n")}`
      );
      return;
    }

     if (action === "Continue on phone") {
      void startPhoneCall();
      return;
    }
  }

  function offerSlots(preferenceText: string) {
    if (!matchedDoctor) return;

    const allSlots = getSlotsForDoctor(matchedDoctor.id);

    let filtered =
      isNoPreference(preferenceText) || preferenceText.trim() === ""
        ? allSlots
        : filterSlotsByPreference(allSlots, preferenceText);

    if (filtered.length === 0) {
      filtered = allSlots;
      addAssistantMessage(
        `I couldn’t find openings that exactly match that preference for ${matchedDoctor.name}. Here are the next available appointments instead.`
      );
    } else {
      addAssistantMessage(
        `I matched you with ${matchedDoctor.name} (${matchedDoctor.specialty}). Here are some available appointments. You can click one, type “first”, or ask for something like “Tuesday morning” or “next week”.`
      );
    }

    setSlotOptions(filtered.slice(0, 5));
    setStage("slotSelection");
  }

  async function sendConfirmationEmail(slot: AppointmentSlot, doctor: Doctor) {
    try {
      setEmailStatus("sending");

      const response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          dob: patient.dob,
          reason: patient.reason,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          office: doctor.office,
          address: doctor.address,
          slotLabel: formatSlotLabel(slot),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send confirmation email.");
      }

      setEmailStatus("sent");
      addAssistantMessage(`Confirmation email sent to ${patient.email}.`);
    } catch (error) {
      console.error(error);
      setEmailStatus("error");
      addAssistantMessage(
        "The appointment is booked, but the confirmation email could not be sent yet. Please check your Resend setup."
      );
    }
  }

  function confirmBooking(slot: AppointmentSlot) {
    if (!matchedDoctor) return;

    setBookedSlot(slot);
    setSlotOptions([]);
    setStage("booked");

    addAssistantMessage(
      `You’re all set, ${patient.firstName}. I booked ${formatSlotLabel(slot)} with ${matchedDoctor.name} at ${matchedDoctor.office}.`
    );

    addAssistantMessage(
      `I’m sending your confirmation email now to ${patient.email}.`
    );

    void sendConfirmationEmail(slot, matchedDoctor);

    addAssistantMessage(
      "For safety, I can help with scheduling and logistics, but I can’t diagnose conditions or provide medical advice. If symptoms are urgent, please contact emergency services or your physician directly."
    );
  }

  function handleSchedulingInput(rawValue: string) {
    const value = rawValue.trim();

    if (!value) return;

    if (stage === "firstName") {
      setPatient((prev) => ({ ...prev, firstName: value }));
      setStage("lastName");
      addAssistantMessage("Thanks. What’s your last name?");
      return;
    }

    if (stage === "lastName") {
      setPatient((prev) => ({ ...prev, lastName: value }));
      setStage("dob");
      addAssistantMessage("What’s your date of birth? Use MM/DD/YYYY or YYYY-MM-DD.");
      return;
    }

    if (stage === "dob") {
      if (!validateDob(value)) {
        addAssistantMessage("Please enter your date of birth as MM/DD/YYYY or YYYY-MM-DD.");
        return;
      }

      setPatient((prev) => ({ ...prev, dob: value }));
      setStage("phone");
      addAssistantMessage("Got it. What’s the best phone number to reach you?");
      return;
    }

    if (stage === "phone") {
      if (!validatePhone(value)) {
        addAssistantMessage("Please enter a valid phone number with at least 10 digits.");
        return;
      }

      setPatient((prev) => ({ ...prev, phone: value }));
      setStage("email");
      addAssistantMessage("Thanks. What email should we send the appointment confirmation to?");
      return;
    }

    if (stage === "email") {
      if (!validateEmail(value)) {
        addAssistantMessage("Please enter a valid email address.");
        return;
      }

      setPatient((prev) => ({ ...prev, email: value }));
      setStage("reason");
      addAssistantMessage(
        "What would you like to be seen for? Tell me the body part or reason, like “knee pain”, “rash”, “sinus pressure”, or “chest discomfort”."
      );
      return;
    }

    if (stage === "reason") {
      const doctor = matchDoctorByReason(value);

      setPatient((prev) => ({ ...prev, reason: value }));

      if (!doctor) {
        addAssistantMessage(
          "I’m sorry, but this practice does not appear to treat that body part or concern. You can try another reason, or ask for office information."
        );
        return;
      }

      setMatchedDoctor(doctor);
      setStage("slotPreference");

      addAssistantMessage(
        `Thanks. Based on “${value}”, the best match is ${doctor.name} in ${doctor.specialty}. Do you have a date or time preference? You can say things like “Tuesday”, “next week”, “morning”, or “no preference”.`
      );
      return;
    }

    if (stage === "slotPreference") {
      offerSlots(value);
      return;
    }

    if (stage === "slotSelection") {
      const chosen = resolveSlotFromInput(value, slotOptions);

      if (chosen) {
        confirmBooking(chosen);
        return;
      }

      offerSlots(value);
      return;
    }

    if (stage === "booked") {
      if (value.toLowerCase().includes("new appointment")) {
        startSchedulingFlow();
        return;
      }

      addAssistantMessage(
        "Your appointment is already booked in this session. You can start a new scheduling flow, ask for office info, or continue on phone in the next step."
      );
      return;
    }
  }

  function handleGeneralInput(rawValue: string) {
    const value = rawValue.trim();
    const lower = value.toLowerCase();

    if (
      lower.includes("appointment") ||
      lower.includes("schedule") ||
      lower.includes("book")
    ) {
      startSchedulingFlow();
      return;
    }

    if (lower.includes("refill") || lower.includes("prescription")) {
      addAssistantMessage(
        "For refill questions, I can capture the medication name and direct the request, but I can’t provide medical guidance or approve medication changes."
      );
      return;
    }

    if (
      lower.includes("hours") ||
      lower.includes("address") ||
      lower.includes("location") ||
      lower.includes("office")
    ) {
      addAssistantMessage(
        `Here are the current practice locations:\n\n${currentOfficeSummary.join("\n")}`
      );
      return;
    }

    if (lower.includes("phone") || lower.includes("call")) {
      addAssistantMessage(
        "The phone handoff is the next feature we’ll wire up. The goal is that the patient can move from web chat to a live AI phone conversation without losing context."
      );
      return;
    }

    addAssistantMessage(
      "I can help schedule an appointment, share office hours and addresses, or discuss refill workflow logistics. Try “schedule an appointment” to begin."
    );
  }

  function handleSubmit() {
    const value = input.trim();
    if (!value) return;

    addUserMessage(value);
    setInput("");

    if (stage === "idle") {
      handleGeneralInput(value);
      return;
    }

    handleSchedulingInput(value);
  }

  function handleSlotButton(slot: AppointmentSlot) {
    addUserMessage(formatSlotLabel(slot));
    confirmBooking(slot);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a_0%,#0f172a_35%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-blue-100 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4" />
              Voice-enabled patient concierge
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              K Medical
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
              A patient-facing AI assistant for appointment scheduling, office information,
              refill workflow support, and chat-to-phone continuity.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-cyan-300/20 bg-white/10 px-4 py-3 text-right shadow-2xl backdrop-blur-2xl md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Status</p>
            <p className="mt-1 text-sm font-medium text-white">Scheduling MVP Active</p>
          </div>
        </motion.header>

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="rounded-3xl border border-white/12 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-300">
                Start with the core workflow or test other patient requests.
              </p>
            </div>

            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left text-sm text-white transition hover:bg-white/14"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-cyan-100">
                <PhoneCall className="h-4 w-4" />
                <span className="text-sm font-medium">Voice handoff</span>
              </div>
              <p className="text-sm text-slate-200">
                Next we’ll connect this web session to a phone call with the same AI and same context.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Safety guardrails</span>
              </div>
              <p className="text-sm text-slate-200">
                The assistant handles logistics only. It will not diagnose, prescribe, or provide medical advice.
              </p>
            </div>

            <button
              onClick={resetSchedulingState}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white transition hover:bg-white/14"
            >
              Reset chat session
            </button>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="grid gap-6"
          >
            <section className="rounded-3xl border border-white/12 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">
                    Patient assistant
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Interactive scheduling chat</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Test the full booking flow by typing naturally or using the quick actions. Try
                    “I need an appointment for knee pain” or click “Schedule an appointment.”
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-xs text-slate-200">
                  Web chat → phone continuity next
                </div>
              </div>

              <div className="h-[420px] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm ${
                          message.role === "user"
                            ? "rounded-tr-md bg-cyan-400/85 text-slate-950"
                            : "rounded-tl-md border border-white/10 bg-white/8 text-slate-100"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}

                  {slotOptions.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[82%] rounded-3xl rounded-tl-md border border-cyan-300/20 bg-cyan-400/10 p-4">
                        <p className="mb-3 text-sm text-slate-100">
                          Choose one of these available appointments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {slotOptions.map((slot) => (
                            <button
                              key={`${slot.doctorId}-${slot.date}-${slot.time}`}
                              onClick={() => handleSlotButton(slot)}
                              className="rounded-full border border-cyan-300/20 bg-cyan-400/20 px-3 py-2 text-sm text-cyan-50 transition hover:bg-cyan-400/30"
                            >
                              {formatSlotLabel(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => handleQuickAction("Schedule an appointment")}
                  className="rounded-full border border-cyan-300/20 bg-cyan-400/20 px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-400/30"
                >
                  Schedule appointment
                </button>
                <button
                  onClick={() => {
                    addUserMessage("Do you have anything on Tuesday morning?");
                    if (stage === "slotPreference" || stage === "slotSelection") {
                      offerSlots("Tuesday morning");
                    } else {
                      addAssistantMessage(
                        "Once I’ve matched you to a provider, I can filter openings by requests like Tuesday morning."
                      );
                    }
                  }}
                  className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white transition hover:bg-white/14"
                >
                  Ask for Tuesday morning
                </button>
                <button
                  onClick={() => void startPhoneCall()}
                  className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white transition hover:bg-white/14"
                >
                  Continue on phone
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={handleSubmit}
                  className="rounded-full bg-cyan-400/85 p-3 text-slate-950 transition hover:bg-cyan-300"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </section>

            {/* <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"> */}
            <section className="grid gap-6">
            
              <div className="rounded-3xl border border-white/12 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-cyan-200" />
                  <h3 className="text-xl font-semibold">Available specialists</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {doctors.map((doctor) => {
                    const isActive = matchedDoctor?.id === doctor.id;

                    return (
                      <div
                        key={doctor.id}
                        className={`rounded-2xl border p-4 ${
                          isActive
                            ? "border-cyan-300/30 bg-cyan-400/12"
                            : "border-white/10 bg-white/8"
                        }`}
                      >
                        <p className="text-sm text-cyan-200">{doctor.specialty}</p>
                        <h4 className="mt-1 text-lg font-semibold">{doctor.name}</h4>

                        <div className="mt-4 space-y-3 text-sm text-slate-300">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{doctor.office}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{doctor.hours}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-white/12 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-cyan-200" />
                  <h3 className="text-xl font-semibold">Current appointment session</h3>
                </div>

                <div className="space-y-3 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Patient</p>
                    <p className="mt-2">
                      {patient.firstName || patient.lastName
                        ? `${patient.firstName} ${patient.lastName}`.trim()
                        : "Not collected yet"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">DOB</p>
                    <p className="mt-2">{patient.dob || "Not collected yet"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Phone</p>
                    <p className="mt-2">{patient.phone || "Not collected yet"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-2">{patient.email || "Not collected yet"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Appointment reason
                    </p>
                    <p className="mt-2">{patient.reason || "Not collected yet"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Matched provider
                    </p>
                    <p className="mt-2">
                      {matchedDoctor
                        ? `${matchedDoctor.name} — ${matchedDoctor.specialty}`
                        : "Not matched yet"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Booking status
                    </p>
                    <p className="mt-2">
                      {bookedSlot
                        ? `Confirmed for ${formatSlotLabel(bookedSlot)}`
                        : "No appointment booked yet"}
                    </p>
                  </div>                  
                                      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-2 text-emerald-100">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Confirmation email</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      Status:{" "}
                      {emailStatus === "idle" && "Not sent yet"}
                      {emailStatus === "sending" && "Sending..."}
                      {emailStatus === "sent" && "Sent successfully"}
                      {emailStatus === "error" && "Failed to send"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
                    <div className="flex items-center gap-2 text-cyan-100">
                      <PhoneCall className="h-4 w-4" />
                      <span className="font-medium">Phone handoff</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      Status:{" "}
                      {callStatus === "idle" && "Not started yet"}
                      {callStatus === "starting" && "Calling patient..."}
                      {callStatus === "started" && "Call started"}
                      {callStatus === "error" && "Failed to start"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </motion.main>
        </div>
      </div>
    </div>
  );
}