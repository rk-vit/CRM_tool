import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, project, source, medium, notes } = body;

    if (!name || !email || !project) {
      return NextResponse.json(
        { error: "Name, email, and project are required." },
        { status: 400 }
      );
    }

    // 1. Get the unknown caller record
    const callerResult = await sql`
      SELECT * FROM unknown_callers WHERE id = ${id} AND reviewed = false
    `;

    if (callerResult.length === 0) {
      return NextResponse.json(
        { error: "Unknown caller not found or already reviewed." },
        { status: 404 }
      );
    }

    const caller = callerResult[0];

    // 2. Fetch ALL users (admin + sales) for multi-assignment
    const allUsers = await sql`SELECT id FROM users`;
    const allUserIds = allUsers.map((u: any) => u.id);

    const max_leadid = await sql`SELECT id FROM leads WHERE id LIKE 'AX%' ORDER BY id DESC LIMIT 1`;
    let leadId;
    if (max_leadid.length > 0) {
      const lastNum = parseInt(max_leadid[0].id.replace("AX", ""), 10);
      const nextNum = lastNum + 1;
      leadId = `AX${nextNum.toString().padStart(4, "0")}`;
    } else {
      leadId = "AX0200";
    }
    const rectifiedMobile = caller.phone.startsWith("+91")? caller.phone: `+91${caller.phone}`;
        
    const whatsapp_url =`https://${process.env.WHATSAPP_API_KEY}:${process.env.WHATSAPP_API_TOKEN}@api.exotel.com/v2/accounts/${process.env.WHATSAPP_SID}/messages`;
    const whatsappPayload = {
          "custom_data": "TEST_MSG",
          "status_callback": "https://276144074cd209fa381a1c133da75f9e.m.pipedream.net",
          "whatsapp": {
            "messages": [
              {
                "from": "+918047361856",
                "to": rectifiedMobile,
                "content": {
                  "type": "template",
                  "template": {
                    "name": "lead_acknoweledgement_template",
                    "language": {
                      "policy": "deterministic",
                      "code": "en_US"
                    },
                    "components": [
                      {
                        "type": "header",
                        "parameters": [
                          {
                            "type": "image",
                            "image": {
                              "link": "https://drive.google.com/uc?export=download&id=1sTrrxmUCmj3gyuI6LeCEgmCajB_xUMY3"
                            }
                          }
                        ]
                      },
                      {
                        "type": "body",
                        "parameters": [
                          { "type": "text", "text": name },
                          { "type": "text", "text": "https://www.instagram.com/reel/DVTTOImAHI9/" },
                          { "type": "text", "text": "https://photos.app.goo.gl/3sJssYN7bRqu3QGWA" },
                          { "type": "text", "text": "https://drive.google.com/file/d/16uBylpcp7ds1NEw7bsfBGPK1mdbaVEz-/" },
                          { "type": "text", "text": "https://maps.app.goo.gl/6a45hJYnG9HCWYbb9" }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          }
        };
        
      axios.post(
        whatsapp_url,
        whatsappPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log("FULL DATA:", JSON.stringify(res.data, null, 2));
        console.log("MESSAGES:", JSON.stringify(res.data.response.whatsapp.messages, null, 2));
      });

    // 4. Create the lead — assigned to ALL users
    await sql`
      INSERT INTO leads (
        id, name, email, phone, project, status, sub_status, source, medium,
        assigned_to, assigned_users, notes
      ) VALUES (
        ${leadId}, ${name}, ${email}, ${caller.phone}, ${project},
        'new', 'warm', ${source || 'direct'}, ${medium || 'Phone Call'},
        ${session.user.id}, ${allUserIds}, ${notes || null}
      )
    `;

    // 4. Create a call_log entry linked to the new lead
    await sql`
      INSERT INTO call_logs (
        lead_id, caller_number, caller_to, duration, direction, status,
        recording_url, assigned_to, exotel_call_sid
      ) VALUES (
        ${leadId}, ${caller.phone}, ${caller.exotel_call_sid ? '' : ''},
        ${caller.call_duration || 0}, 'inbound',
        ${caller.call_status === 'answered' ? 'answered' : 'no_answer'},
        ${caller.recording_url || null}, ${session.user.id},
        ${caller.exotel_call_sid || null}
      )
    `;

    // 5. Create timeline event
    await sql`
      INSERT INTO timeline_events (
        lead_id, type, title, description, created_by, metadata
      ) VALUES (
        ${leadId}, 'call', 'Lead Created from Inbound Call',
        ${`Lead created from an unknown inbound call. Phone: ${caller.phone}`},
        ${session.user.id},
        ${JSON.stringify({ source: 'unknown_caller', originalId: id })}
      )
    `;

    // 6. Mark unknown caller as reviewed + converted
    await sql`
      UPDATE unknown_callers
      SET reviewed = true, converted_lead_id = ${leadId}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      leadId,
      message: `Lead ${name} created successfully.`,
    });
  } catch (error) {
    console.error("Error converting unknown caller:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
