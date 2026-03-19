import { NextResponse } from "next/server";

type StartPhoneCallPayload = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
  email?: string;
  reason?: string;
  doctorName?: string;
  specialty?: string;
  slotLabel?: string;
  office?: string;
  address?: string;
};

function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    if (!process.env.VAPI_PRIVATE_KEY) {
      return NextResponse.json({ error: "Missing VAPI_PRIVATE_KEY." }, { status: 500 });
    }

    if (!process.env.VAPI_ASSISTANT_ID) {
      return NextResponse.json({ error: "Missing VAPI_ASSISTANT_ID." }, { status: 500 });
    }

    if (!process.env.VAPI_PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "Missing VAPI_PHONE_NUMBER_ID." }, { status: 500 });
    }

    const body = (await req.json()) as StartPhoneCallPayload;

    if (!body.phone) {
      return NextResponse.json({ error: "Missing patient phone number." }, { status: 400 });
    }

    const formattedNumber = toE164(body.phone);

    if (!formattedNumber) {
      return NextResponse.json(
        { error: "Phone number must be a valid US number." },
        { status: 400 }
      );
    }

    const payload = {
      assistantId: process.env.VAPI_ASSISTANT_ID,
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: formattedNumber,
      },
      assistantOverrides: {
        variableValues: {
          firstName: body.firstName || "",
          lastName: body.lastName || "",
          dob: body.dob || "",
          phone: formattedNumber,
          email: body.email || "",
          reason: body.reason || "",
          doctorName: body.doctorName || "",
          specialty: body.specialty || "",
          slotLabel: body.slotLabel || "",
          office: body.office || "",
          address: body.address || "",
        },
      },
    };

    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await vapiResponse.text();

    console.log("Vapi status:", vapiResponse.status);
    console.log("Vapi response:", rawText);

    if (!vapiResponse.ok) {
      return NextResponse.json(
        {
          error: "Vapi rejected the call request.",
          vapiStatus: vapiResponse.status,
          vapiBody: rawText,
          sentPayload: payload,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, vapiBody: rawText });
  } catch (error) {
    console.error("Vapi start-phone-call error:", error);
    return NextResponse.json(
      {
        error: "Failed to start phone call.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}