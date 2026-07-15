import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { assign } from "nodemailer/lib/shared";
import axios from "axios";
import { createApiLogger } from "@/lib/logger/api-logger";

export async function POST(req: Request) {
  const log = createApiLogger(req, "/api/leads/create");
  log.start();
  try {
    const { name, email, phone, project, source } = await req.json();
    const lastLeads = await sql.query(`
      SELECT id FROM leads 
      WHERE id LIKE 'AX%' 
      ORDER BY id DESC LIMIT 1
    `);

    let nextId;
    let assignedUsers = await sql.query(`SELECT id FROM users`);
    assignedUsers = assignedUsers.map((u: any) => u.id);
    if (lastLeads.length > 0) {
      const lastNum = parseInt(lastLeads[0].id.replace("AX", ""), 10);
      const nextNum = lastNum + 1;
      nextId = `AX${nextNum.toString().padStart(4, "0")}`;
    } else {
      nextId = "AX0001";
    }
    await sql.query(`
      INSERT INTO leads (id, name, email, phone, project, status, source, medium, assigned_users, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'new', $6, 'Manual', $7, NOW(), NOW())
    `, [nextId, name, email, phone, project, source, assignedUsers]);
  
    const rectifiedMobile = phone.startsWith("+91")? phone: `+91${phone}`;
        
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
        log.success(200, { id: nextId, assignedUsersCount: assignedUsers.length, whatsappDelivered: true });
      });

    await sql.query(`
      INSERT INTO timeline_events (lead_id, type, title, description, created_by, created_at)
      VALUES ($1, 'workflow', 'Lead Created', 'Manual entry for walk-in client', 'system', NOW())
    `, [nextId]);

    log.success(200, { id: nextId, assignedUsersCount: assignedUsers.length });
    return NextResponse.json({ success: true, id: nextId });
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
