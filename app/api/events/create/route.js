import { query } from "@/lib/db"
import { validateSession } from "@/lib/middleware"
import { validateEvent, sanitizeString } from "@/lib/validation"
import { sendEmail } from "@/lib/email"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid) {
      return NextResponse.json({ error: sessionValidation.error }, { status: sessionValidation.status });
    }

    const session = sessionValidation.session;

    let { title, description, category, start_date, end_date, location, max_capacity, price, image_url, speakers, schedule, brochure_url } = await request.json()

    // Sanitize inputs
    title = sanitizeString(title);
    description = sanitizeString(description);
    category = sanitizeString(category);
    location = sanitizeString(location);
    if (image_url) image_url = sanitizeString(image_url);
    if (speakers) speakers = sanitizeString(speakers);
    if (schedule) schedule = sanitizeString(schedule);
    if (brochure_url) brochure_url = sanitizeString(brochure_url);

    // Validate input
    const validation = validateEvent({
      title,
      description,
      category,
      start_date,
      end_date,
      location,
      max_capacity,
      price
    });
    if (!validation.isValid) {
      return NextResponse.json({ error: "Validation failed: " + validation.errors.join(', ') }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO events (title, description, organiser_id, category, start_date, end_date, location, max_capacity, price, status, image_url, speakers, schedule, brochure_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [title, description, session.userId, category, start_date, end_date, location, max_capacity, price, "pending", image_url || null, speakers || null, schedule || null, brochure_url || null],
    )

    // Send email notification to all admins about the new event pending review
    try {
      const admins = await query(`SELECT id, name, email FROM users WHERE role = 'admin'`);
      for (const admin of admins) {
        await sendEmail(admin.email, "eventCreatedAdmin", {
          adminName: admin.name,
          organizerName: session.name,
          eventTitle: title,
          eventDate: start_date,
          eventLocation: location,
          eventCategory: category,
          eventPrice: price
        });
      }
    } catch (emailErr) {
      console.error("[v0] Event creation email error:", emailErr);
    }

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create event error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
