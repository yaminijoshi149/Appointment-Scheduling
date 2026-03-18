import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ConfirmationPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  reason: string;
  doctorName: string;
  specialty: string;
  office: string;
  address: string;
  slotLabel: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConfirmationPayload;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        { error: "Missing RESEND_FROM_EMAIL in environment variables." },
        { status: 500 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      reason,
      doctorName,
      specialty,
      office,
      address,
      slotLabel,
    } = body;

    if (!email || !firstName || !doctorName || !slotLabel) {
      return NextResponse.json(
        { error: "Missing required confirmation fields." },
        { status: 400 }
      );
    }

    const subject = `Appointment Confirmed — ${slotLabel}`;

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Kyron Medical Appointment Confirmation</h2>
        <p>Hi ${firstName},</p>
        <p>Your appointment has been confirmed.</p>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #cbd5e1; border-radius: 12px;">
          <p><strong>Patient:</strong> ${firstName} ${lastName}</p>
          <p><strong>Date of birth:</strong> ${dob}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Reason for visit:</strong> ${reason}</p>
          <p><strong>Provider:</strong> ${doctorName} (${specialty})</p>
          <p><strong>Appointment time:</strong> ${slotLabel}</p>
          <p><strong>Office:</strong> ${office}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>

        <p>
          This assistant can help with scheduling and practice logistics, but it does not provide
          medical advice. If your situation is urgent, contact emergency services or your physician directly.
        </p>

        <p>Thank you,<br />Kyron Medical</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send confirmation route error:", error);
    return NextResponse.json(
      { error: "Failed to send confirmation email." },
      { status: 500 }
    );
  }
}