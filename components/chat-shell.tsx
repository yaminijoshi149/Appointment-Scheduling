"use client";

import { motion } from "framer-motion";
import { Calendar, Clock3, MapPin, PhoneCall, ShieldCheck, Stethoscope } from "lucide-react";
import { doctors, quickActions } from "@/lib/mock-data";

export default function ChatShell() {
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
              prescription questions, and seamless chat-to-phone continuity.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-cyan-300/20 bg-white/10 px-4 py-3 text-right shadow-2xl backdrop-blur-2xl md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Status</p>
            <p className="mt-1 text-sm font-medium text-white">MVP Build in Progress</p>
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
                These will become clickable workflow shortcuts next.
              </p>
            </div>

            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action}
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
                Patient can continue the same conversation by phone while preserving context.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Safety guardrails</span>
              </div>
              <p className="text-sm text-slate-200">
                The assistant will not diagnose, prescribe, or provide medical advice.
              </p>
            </div>
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
                  <h2 className="mt-2 text-2xl font-semibold">Chat interface</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    This is where the patient will complete intake, ask for dates like
                    “next Tuesday,” receive provider matching, and book a slot.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-xs text-slate-200">
                  Web chat → phone call continuity
                </div>
              </div>

              <div className="space-y-4">
                <div className="max-w-[78%] rounded-3xl rounded-tl-md border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100">
                  Hi, I’m Kyron’s virtual patient assistant. I can help schedule an appointment,
                  check office details, or continue this conversation by phone.
                </div>

                <div className="ml-auto max-w-[78%] rounded-3xl rounded-tr-md bg-cyan-400/80 px-4 py-3 text-sm text-slate-950">
                  I’d like to schedule an appointment for knee pain.
                </div>

                <div className="max-w-[78%] rounded-3xl rounded-tl-md border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-slate-100">
                  I can help with that. I’ll collect your first name, last name, DOB, phone number,
                  email, and the reason for your visit, then I’ll offer available times with the
                  most relevant specialist.
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full border border-cyan-300/20 bg-cyan-400/20 px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-400/30">
                  Schedule appointment
                </button>
                <button className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white transition hover:bg-white/14">
                  Ask for Tuesday openings
                </button>
                <button className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white transition hover:bg-white/14">
                  Continue on phone
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
              <div className="rounded-3xl border border-white/12 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-cyan-200" />
                  <h3 className="text-xl font-semibold">Available specialists</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="rounded-2xl border border-white/10 bg-white/8 p-4"
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
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/12 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-200" />
                  <h3 className="text-xl font-semibold">What this MVP will do</h3>
                </div>

                <div className="space-y-3 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    Collect patient intake details in chat
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    Match body part to the right provider
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    Offer appointments over the next 30–60 days
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    Confirm the booking by email
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    Continue the same conversation by phone
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