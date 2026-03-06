import nodemailer from "nodemailer";

// ─── Transport Configuration ────────────────────────────────────────────────
// Supports both EMAIL_USER/EMAIL_PASS and SMTP_USER/SMTP_PASS env vars
// Uses lazy initialization so env vars are always read fresh

let _transporter = null;
let _lastUser = null;
let _lastPass = null;

function getTransporter() {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");

  // Recreate transporter if credentials changed
  if (!_transporter || _lastUser !== emailUser || _lastPass !== emailPass) {
    _transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    _lastUser = emailUser;
    _lastPass = emailPass;
  }

  return { transporter: _transporter, emailUser, emailPass };
}

// ─── Brand Design System ────────────────────────────────────────────────────

const brand = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  success: "#10b981",
  successLight: "#d1fae5",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  dark: "#1e1b4b",
  light: "#f8fafc",
  muted: "#64748b",
  border: "#e2e8f0",
  pink: "#ec4899",
  pinkLight: "#fce7f3",
  orange: "#f97316",
  orangeLight: "#ffedd5",
  teal: "#14b8a6",
  tealLight: "#ccfbf1",
  cyan: "#06b6d4",
  cyanLight: "#cffafe",
  rose: "#f43f5e",
  amber: "#f59e0b",
  emerald: "#10b981",
  violet: "#8b5cf6",
  indigo: "#6366f1",
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr || "TBD";
  }
}

function baseLayout(title, heroGradient, heroEmoji, heroTitle, content, footerNote = "") {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(99,102,241,0.12);">
          
          <!-- Gradient Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${heroGradient});padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 0;text-align:left;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">🎓 EventifyEDU</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 40px 36px;text-align:center;">
                    <div style="font-size:52px;margin-bottom:12px;">${heroEmoji}</div>
                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.3;">
                      ${heroTitle}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,${brand.border},transparent);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              ${footerNote ? `<p style="margin:0 0 12px;font-size:13px;color:${brand.muted};">${footerNote}</p>` : ""}
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} EventifyEDU — Smart Educational Event Management
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
                This is an automated notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoRow(icon, label, value) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:10px;font-size:18px;vertical-align:top;">${icon}</td>
          <td>
            <span style="font-size:12px;color:${brand.muted};text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">${label}</span><br/>
            <span style="font-size:15px;color:${brand.dark};font-weight:500;line-height:1.4;">${value}</span>
          </td>
        </tr></table>
      </td>
    </tr>`;
}

function ctaButton(text, url, gradientFrom, gradientTo) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
      <tr>
        <td style="background:linear-gradient(135deg, ${gradientFrom || brand.primary}, ${gradientTo || brand.secondary});border-radius:12px;padding:15px 40px;box-shadow:0 4px 16px rgba(99,102,241,0.3);">
          <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

function badge(text, bgColor, textColor = "#ffffff") {
  return `<span style="display:inline-block;padding:6px 18px;background:${bgColor};color:${textColor};border-radius:24px;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${text}</span>`;
}

function detailCard(bgColor, borderColor, rows) {
  return `
    <div style="background:${bgColor};border-left:4px solid ${borderColor};border-radius:12px;padding:24px;margin:20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rows}
      </table>
    </div>`;
}

function greeting(name) {
  return `<p style="margin:0 0 20px;font-size:16px;color:${brand.dark};line-height:1.6;">Hey <strong>${name}</strong>,</p>`;
}

// ─── Email Templates (13 total) ─────────────────────────────────────────────

const templates = {

  // ━━━ 1. REGISTRATION CONFIRMATION (Attendee — Free Event) ━━━━━━━━━━━━━━━
  registrationConfirmation: (data) => {
    const { attendeeName, eventTitle, eventDate, eventLocation, ticketId } = data;
    const content = `
      ${greeting(attendeeName)}
      <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Your registration for <strong style="color:${brand.dark};">${eventTitle}</strong> is confirmed! Here's your ticket:
      </p>

      <!-- Ticket Card -->
      <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:2px dashed ${brand.primary};border-radius:16px;padding:28px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:${brand.muted};text-transform:uppercase;letter-spacing:2px;">Your Ticket ID</p>
        <p style="margin:0 0 20px;font-size:22px;font-weight:800;color:${brand.primary};font-family:'Courier New',monospace;letter-spacing:2px;">${ticketId}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:left;">
          ${infoRow("🎪", "Event", eventTitle)}
          ${infoRow("📅", "Date & Time", formatDate(eventDate))}
          ${infoRow("📍", "Location", eventLocation || "TBA")}
        </table>
      </div>

      <p style="margin:0;font-size:13px;color:${brand.muted};text-align:center;line-height:1.5;">
        💡 <em>Save this email — you may need to show your Ticket ID at check-in!</em>
      </p>
    `;
    return {
      subject: `🎉 Booking Confirmed — ${eventTitle}`,
      html: baseLayout("Booking Confirmed", `${brand.success}, ${brand.accent}`, "✅", "Booking Confirmed!", content, "Show this email at the event entrance for quick check-in."),
    };
  },

  // ━━━ 2. EVENT APPROVED (Organizer) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  eventApproved: (data) => {
    const { organizerName, eventTitle, eventDate, eventLocation } = data;
    const content = `
      ${greeting(organizerName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Great news! Your event has been <strong style="color:${brand.success};">approved</strong> by the admin team. It's now live and visible to all attendees! 🎊
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge("✓ APPROVED", brand.success)}
      </div>

      ${detailCard("linear-gradient(135deg,#ecfdf5,#d1fae5)", brand.success, `
        ${infoRow("🎪", "Event", eventTitle)}
        ${infoRow("📅", "Date", formatDate(eventDate))}
        ${infoRow("📍", "Location", eventLocation || "TBA")}
      `)}

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        🚀 Start promoting your event and track registrations from your dashboard!
      </p>
    `;
    return {
      subject: `✅ Event Approved — ${eventTitle}`,
      html: baseLayout("Event Approved", `${brand.success}, #34d399`, "🎊", "Event Approved!", content, "Log in to your dashboard to manage your event."),
    };
  },

  // ━━━ 3. EVENT REJECTED (Organizer) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  eventRejected: (data) => {
    const { organizerName, eventTitle, reason } = data;
    const content = `
      ${greeting(organizerName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        We regret to inform you that your event submission was <strong style="color:${brand.danger};">not approved</strong> this time.
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge("✗ NOT APPROVED", brand.danger)}
      </div>

      ${detailCard("linear-gradient(135deg,#fef2f2,#fee2e2)", brand.danger, `
        ${infoRow("🎪", "Event", eventTitle)}
        ${reason ? infoRow("💬", "Reason", reason) : ""}
      `)}

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        You can edit and resubmit your event, or reach out to the admin team for guidance.
      </p>
    `;
    return {
      subject: `❌ Event Not Approved — ${eventTitle}`,
      html: baseLayout("Event Not Approved", `${brand.danger}, #f97316`, "⚠️", "Event Not Approved", content, "Review the feedback and consider resubmitting after making changes."),
    };
  },

  // ━━━ 4. COORDINATOR WELCOME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  coordinatorWelcome: (data) => {
    const { name, email, password, role, eventTitle, organizerName } = data;
    const roleLabel = role === "event_coordinator" ? "Faculty Coordinator" : "Student Coordinator";
    const content = `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        You've been assigned as a <strong style="color:${brand.primary};">${roleLabel}</strong> by ${organizerName}. Welcome aboard! 🤝
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge(roleLabel, brand.primary)}
      </div>

      ${detailCard("linear-gradient(135deg,#eef2ff,#e0e7ff)", brand.primary, `
        ${infoRow("🎪", "Event", eventTitle)}
        ${infoRow("👤", "Your Role", roleLabel)}
        ${infoRow("📧", "Assigned By", organizerName)}
      `)}

      <!-- Login Credentials -->
      <div style="background:linear-gradient(135deg,${brand.dark},#312e81);border-radius:16px;padding:28px;margin:24px 0;">
        <h3 style="margin:0 0 20px;font-size:14px;color:#c7d2fe;text-align:center;text-transform:uppercase;letter-spacing:1.5px;">
          🔐 Your Login Credentials
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 16px;background:rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;">
              <span style="font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:1px;">Email</span><br/>
              <span style="font-size:16px;color:#ffffff;font-weight:600;font-family:'Courier New',monospace;">${email}</span>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:10px 16px;background:rgba(255,255,255,0.08);border-radius:8px;">
              <span style="font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:1px;">Password</span><br/>
              <span style="font-size:16px;color:#ffffff;font-weight:600;font-family:'Courier New',monospace;">${password}</span>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:${brand.danger};text-align:center;font-weight:600;">
        ⚠️ Please change your password after your first login for security!
      </p>
    `;
    return {
      subject: `🤝 Welcome, ${roleLabel}! — ${eventTitle}`,
      html: baseLayout("Coordinator Welcome", `${brand.primary}, ${brand.accent}`, "🤝", `Welcome, ${roleLabel}!`, content, "Log in to view your assigned tasks and responsibilities."),
    };
  },

  // ━━━ 5. WELCOME USER (New Signup) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  welcomeUser: (data) => {
    const { name, role } = data;
    const roleDisplay = { attendee: "Attendee", organiser: "Event Organizer", admin: "Administrator" }[role] || role;
    const content = `
      ${greeting(name)}
      <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Your account has been created successfully! Welcome to the EventifyEDU community. 🚀
      </p>

      <div style="text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:13px;color:${brand.muted};">You've registered as</p>
        ${badge(roleDisplay, brand.primary)}
      </div>

      <!-- Features Grid -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td width="33%" style="text-align:center;padding:16px 8px;">
            <div style="width:56px;height:56px;margin:0 auto 8px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:14px;line-height:56px;font-size:24px;">📅</div>
            <div style="font-size:12px;color:${brand.dark};font-weight:600;">Browse Events</div>
          </td>
          <td width="33%" style="text-align:center;padding:16px 8px;">
            <div style="width:56px;height:56px;margin:0 auto 8px;background:linear-gradient(135deg,#fce7f3,#fbcfe8);border-radius:14px;line-height:56px;font-size:24px;">🎪</div>
            <div style="font-size:12px;color:${brand.dark};font-weight:600;">Register & Attend</div>
          </td>
          <td width="33%" style="text-align:center;padding:16px 8px;">
            <div style="width:56px;height:56px;margin:0 auto 8px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:14px;line-height:56px;font-size:24px;">🏆</div>
            <div style="font-size:12px;color:${brand.dark};font-weight:600;">Earn Certificates</div>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        Start exploring events and join your academic community today! 🎓
      </p>
    `;
    return {
      subject: "🎓 Welcome to EventifyEDU!",
      html: baseLayout("Welcome", `${brand.primary}, ${brand.secondary}`, "🎉", "Welcome to EventifyEDU!", content, "Discover and attend amazing educational events."),
    };
  },

  // ━━━ 6. TASK ASSIGNED (Coordinator) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  taskAssigned: (data) => {
    const { coordinatorName, taskTitle, taskDescription, eventTitle, deadline, priority, assignedBy } = data;
    const priorityConfig = {
      urgent: { color: brand.danger, bg: "linear-gradient(135deg,#fef2f2,#fee2e2)" },
      high: { color: brand.orange, bg: "linear-gradient(135deg,#fff7ed,#ffedd5)" },
      medium: { color: brand.warning, bg: "linear-gradient(135deg,#fffbeb,#fef3c7)" },
      low: { color: brand.success, bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)" },
    };
    const pCfg = priorityConfig[priority] || priorityConfig.medium;
    const content = `
      ${greeting(coordinatorName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        You've been assigned a new task by <strong style="color:${brand.dark};">${assignedBy}</strong>. Here are the details:
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge(`${(priority || "medium").toUpperCase()} PRIORITY`, pCfg.color)}
      </div>

      ${detailCard(pCfg.bg, pCfg.color, `
        ${infoRow("📌", "Task", taskTitle)}
        ${taskDescription ? infoRow("📝", "Description", taskDescription) : ""}
        ${infoRow("🎪", "Event", eventTitle)}
        ${deadline ? infoRow("⏰", "Deadline", formatDate(deadline)) : ""}
        ${infoRow("👤", "Assigned By", assignedBy)}
      `)}

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        Log in to your coordinator dashboard to view and complete this task.
      </p>
    `;
    return {
      subject: `📋 New Task — ${taskTitle} | ${eventTitle}`,
      html: baseLayout("Task Assigned", `${brand.warning}, ${brand.orange}`, "📋", "New Task Assigned!", content, "Complete your task before the deadline."),
    };
  },

  // ━━━ 7. EVENT CREATED → ADMIN NOTIFICATION (NEW) ━━━━━━━━━━━━━━━━━━━━━━
  eventCreatedAdmin: (data) => {
    const { adminName, organizerName, eventTitle, eventDate, eventLocation, eventCategory, eventPrice } = data;
    const content = `
      ${greeting(adminName || "Admin")}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        A new event has been submitted for review by <strong style="color:${brand.primary};">${organizerName}</strong>. It requires your approval.
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge("⏳ PENDING REVIEW", brand.warning)}
      </div>

      ${detailCard("linear-gradient(135deg,#fffbeb,#fef3c7)", brand.warning, `
        ${infoRow("🎪", "Event Title", eventTitle)}
        ${infoRow("👤", "Organizer", organizerName)}
        ${infoRow("📅", "Date", formatDate(eventDate))}
        ${infoRow("📍", "Location", eventLocation || "TBA")}
        ${eventCategory ? infoRow("🏷️", "Category", eventCategory) : ""}
        ${eventPrice && parseFloat(eventPrice) > 0 ? infoRow("💰", "Price", `₹${eventPrice}`) : infoRow("💰", "Price", "Free")}
      `)}

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        🔍 Please review this event and approve or reject it from the admin dashboard.
      </p>
    `;
    return {
      subject: `🔔 New Event Pending — ${eventTitle}`,
      html: baseLayout("Event Pending Review", `${brand.warning}, ${brand.orange}`, "🔔", "New Event Pending Review", content, "Review and take action from your admin dashboard."),
    };
  },

  // ━━━ 8. PAYMENT SUCCESS (Attendee — receipt) (NEW) ━━━━━━━━━━━━━━━━━━━━━
  paymentSuccess: (data) => {
    const { attendeeName, eventTitle, eventDate, eventLocation, amount, paymentId, orderId, ticketId } = data;
    const content = `
      ${greeting(attendeeName)}
      <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Your payment has been <strong style="color:${brand.success};">successfully verified</strong> and your registration is confirmed! 🎉
      </p>

      <!-- Payment Receipt -->
      <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid ${brand.success};border-radius:16px;padding:28px;margin-bottom:24px;">
        <div style="text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:11px;color:${brand.muted};text-transform:uppercase;letter-spacing:2px;">Amount Paid</p>
          <p style="margin:0;font-size:36px;font-weight:800;color:${brand.success};">₹${amount}</p>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow("🎪", "Event", eventTitle)}
          ${infoRow("📅", "Date", formatDate(eventDate))}
          ${infoRow("📍", "Location", eventLocation || "TBA")}
          ${ticketId ? infoRow("🎫", "Ticket ID", ticketId) : ""}
          ${paymentId ? infoRow("🆔", "Payment ID", paymentId) : ""}
          ${orderId ? infoRow("📋", "Order ID", orderId) : ""}
        </table>
      </div>

      <div style="text-align:center;">
        ${badge("✓ PAYMENT CONFIRMED", brand.success)}
      </div>

      <p style="margin:16px 0 0;font-size:13px;color:${brand.muted};text-align:center;line-height:1.5;">
        💡 <em>This email serves as your payment receipt. Keep it for your records.</em>
      </p>
    `;
    return {
      subject: `💳 Payment Confirmed — ${eventTitle}`,
      html: baseLayout("Payment Confirmed", `${brand.success}, ${brand.teal}`, "💳", "Payment Successful!", content, "This is your official payment receipt."),
    };
  },

  // ━━━ 9. PAYMENT RECEIVED → ORGANIZER NOTIFICATION (NEW) ━━━━━━━━━━━━━━━
  paymentReceivedOrganizer: (data) => {
    const { organizerName, attendeeName, attendeeEmail, eventTitle, amount, paymentId } = data;
    const content = `
      ${greeting(organizerName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        A new payment has been received for your event! 🎊💰
      </p>

      ${detailCard("linear-gradient(135deg,#ecfdf5,#ccfbf1)", brand.teal, `
        ${infoRow("🎪", "Event", eventTitle)}
        ${infoRow("👤", "Attendee", attendeeName)}
        ${infoRow("📧", "Email", attendeeEmail)}
        ${infoRow("💰", "Amount", `₹${amount}`)}
        ${paymentId ? infoRow("🆔", "Payment ID", paymentId) : ""}
      `)}

      <div style="text-align:center;">
        ${badge("💰 PAYMENT RECEIVED", brand.teal)}
      </div>

      <p style="margin:16px 0 0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        Check your organizer dashboard for full payment and attendance details.
      </p>
    `;
    return {
      subject: `💰 Payment Received — ${eventTitle} (₹${amount})`,
      html: baseLayout("Payment Received", `${brand.teal}, ${brand.cyan}`, "💰", "New Payment Received!", content, "View your revenue dashboard for detailed stats."),
    };
  },

  // ━━━ 10. REGISTRATION CANCELLED (Attendee) (NEW) ━━━━━━━━━━━━━━━━━━━━━━
  registrationCancelled: (data) => {
    const { attendeeName, eventTitle, eventDate, eventLocation } = data;
    const content = `
      ${greeting(attendeeName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Your registration for the following event has been <strong style="color:${brand.danger};">cancelled</strong>.
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge("CANCELLED", brand.danger)}
      </div>

      ${detailCard("linear-gradient(135deg,#fef2f2,#fee2e2)", brand.danger, `
        ${infoRow("🎪", "Event", eventTitle)}
        ${eventDate ? infoRow("📅", "Date", formatDate(eventDate)) : ""}
        ${eventLocation ? infoRow("📍", "Location", eventLocation) : ""}
      `)}

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        If this was a mistake or you'd like to re-register, visit the event page!
      </p>
    `;
    return {
      subject: `Registration Cancelled — ${eventTitle}`,
      html: baseLayout("Registration Cancelled", `${brand.danger}, ${brand.rose}`, "❌", "Registration Cancelled", content, "You can re-register anytime from the events page."),
    };
  },

  // ━━━ 11. TASK STATUS UPDATE → COORDINATOR (NEW) ━━━━━━━━━━━━━━━━━━━━━━━
  taskStatusUpdate: (data) => {
    const { coordinatorName, taskTitle, eventTitle, status, feedback } = data;
    const isApproved = status === "approved";
    const statusColor = isApproved ? brand.success : brand.danger;
    const statusBg = isApproved ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "linear-gradient(135deg,#fef2f2,#fee2e2)";
    const emoji = isApproved ? "✅" : "🔄";
    const statusText = isApproved ? "Approved" : "Needs Revision";

    const content = `
      ${greeting(coordinatorName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Your submitted task has been reviewed. Here's the update:
      </p>

      <div style="text-align:center;margin-bottom:20px;">
        ${badge(`${emoji} ${statusText.toUpperCase()}`, statusColor)}
      </div>

      ${detailCard(statusBg, statusColor, `
        ${infoRow("📌", "Task", taskTitle)}
        ${infoRow("🎪", "Event", eventTitle)}
        ${infoRow("📊", "Status", statusText)}
        ${feedback ? infoRow("💬", "Feedback", feedback) : ""}
      `)}

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        ${isApproved ? "Great work! Keep it up! 🌟" : "Please review the feedback and resubmit your task."}
      </p>
    `;
    return {
      subject: `${emoji} Task ${statusText} — ${taskTitle}`,
      html: baseLayout(`Task ${statusText}`, isApproved ? `${brand.success}, #34d399` : `${brand.danger}, ${brand.orange}`, emoji, `Task ${statusText}!`, content, "Check your coordinator dashboard for details."),
    };
  },

  // ━━━ 12. FEEDBACK RECEIVED → ORGANIZER (NEW) ━━━━━━━━━━━━━━━━━━━━━━━━━━
  feedbackReceived: (data) => {
    const { organizerName, attendeeName, eventTitle, rating, comment } = data;
    const stars = "⭐".repeat(rating) + "☆".repeat(5 - rating);
    const ratingColor = rating >= 4 ? brand.success : rating >= 3 ? brand.warning : brand.danger;
    const content = `
      ${greeting(organizerName)}
      <p style="margin:0 0 20px;font-size:15px;color:${brand.muted};line-height:1.6;">
        ${attendeeName} has submitted feedback for your event <strong style="color:${brand.dark};">${eventTitle}</strong>!
      </p>

      <!-- Star Rating Card -->
      <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid ${brand.warning};border-radius:16px;padding:28px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:${brand.muted};text-transform:uppercase;letter-spacing:1px;">Rating</p>
        <p style="margin:0 0 4px;font-size:32px;letter-spacing:4px;">${stars}</p>
        <p style="margin:0 0 16px;font-size:24px;font-weight:800;color:${ratingColor};">${rating}/5</p>
        
        ${comment ? `
          <div style="background:rgba(255,255,255,0.7);border-radius:10px;padding:16px;text-align:left;">
            <p style="margin:0 0 4px;font-size:11px;color:${brand.muted};text-transform:uppercase;letter-spacing:1px;">Comment</p>
            <p style="margin:0;font-size:14px;color:${brand.dark};line-height:1.5;font-style:italic;">"${comment}"</p>
          </div>
        ` : ""}
        
        <p style="margin:12px 0 0;font-size:13px;color:${brand.muted};">— ${attendeeName}</p>
      </div>

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        View all feedback on your organizer dashboard! 📊
      </p>
    `;
    return {
      subject: `⭐ New Feedback (${rating}/5) — ${eventTitle}`,
      html: baseLayout("New Feedback", `${brand.warning}, ${brand.amber}`, "⭐", "New Feedback Received!", content, "Use feedback to improve your future events."),
    };
  },

  // ━━━ 13. EVENT REMINDER (Attendee) (NEW) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  eventReminder: (data) => {
    const { attendeeName, eventTitle, eventDate, eventLocation, daysUntil } = data;
    const content = `
      ${greeting(attendeeName)}
      <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};line-height:1.6;">
        Your event is coming up ${daysUntil === 1 ? "<strong style=\"color:" + brand.danger + ";\">tomorrow</strong>" : `in <strong style="color:${brand.primary};">${daysUntil} days</strong>`}! Don't forget to attend! ⏰
      </p>

      <!-- Countdown Card -->
      <div style="background:linear-gradient(135deg,${brand.primary},${brand.secondary});border-radius:16px;padding:32px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:56px;font-weight:800;color:#ffffff;line-height:1;">${daysUntil}</p>
        <p style="margin:4px 0 20px;font-size:14px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:2px;">
          day${daysUntil !== 1 ? "s" : ""} to go
        </p>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:16px;text-align:left;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:12px;color:rgba(255,255,255,0.7);">🎪 Event</span><br/>
                <span style="font-size:15px;color:#ffffff;font-weight:600;">${eventTitle}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:12px;color:rgba(255,255,255,0.7);">📅 Date</span><br/>
                <span style="font-size:15px;color:#ffffff;font-weight:600;">${formatDate(eventDate)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:12px;color:rgba(255,255,255,0.7);">📍 Location</span><br/>
                <span style="font-size:15px;color:#ffffff;font-weight:600;">${eventLocation || "TBA"}</span>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <p style="margin:0;font-size:13px;color:${brand.muted};text-align:center;line-height:1.5;">
        💡 <em>Make sure to arrive on time. Don't forget to bring your Ticket ID!</em>
      </p>
    `;
    return {
      subject: `⏰ ${daysUntil === 1 ? "Tomorrow" : `${daysUntil} Days Left`} — ${eventTitle}`,
      html: baseLayout("Event Reminder", `${brand.primary}, ${brand.violet}`, "⏰", "Event Reminder!", content, "See you there!"),
    };
  },

  // ━━━ 14. CERTIFICATE ISSUED (Participant) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  certificateIssued: (data) => {
    const { participantName, eventTitle, eventDate, eventEndDate, eventLocation, organizerName, certificateId, downloadUrl } = data;
    const content = `
      ${greeting(participantName)}
      <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};line-height:1.6;">
        The event <strong style="color:${brand.dark};">${eventTitle}</strong> has ended. Thank you for attending! 🎉
        <strong>Your certificate is ready</strong> for you to view and download. 
        We are pleased to present your <strong style="color:${brand.warning};">Certificate of Participation</strong>.
        You can also view all your certificates in the <a href="${data.hubUrl}" style="color:${brand.primary};text-decoration:none;font-weight:600;">Certificates Hub</a>.
      </p>
      
      ${downloadUrl ? ctaButton("Download Certificate", downloadUrl, brand.warning, brand.amber) : ""}

      <!-- Certificate Card -->
      <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:3px solid ${brand.warning};border-radius:20px;padding:0;margin:24px 0;overflow:hidden;">
        
        <!-- Certificate Header -->
        <div style="background:linear-gradient(135deg,${brand.warning},${brand.amber},#d97706);padding:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:3px;font-weight:600;">EventifyEDU</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">🏆 Certificate of Participation</p>
        </div>

        <!-- Certificate Body -->
        <div style="padding:32px 28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:${brand.muted};text-transform:uppercase;letter-spacing:1.5px;">This is to certify that</p>
          <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:${brand.dark};font-family:Georgia,'Times New Roman',serif;letter-spacing:0.3px;border-bottom:2px solid ${brand.warning};display:inline-block;padding-bottom:6px;">
            ${participantName}
          </p>

          <p style="margin:0 0 6px;font-size:13px;color:${brand.muted};line-height:1.6;">
            has successfully participated in
          </p>
          <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:${brand.primary};line-height:1.3;">
            ${eventTitle}
          </p>

          <!-- Event Details in Certificate -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:left;background:rgba(255,255,255,0.7);border-radius:12px;padding:4px;">
            ${infoRow("📅", "Date", formatDate(eventDate) + " — " + formatDate(eventEndDate))}
            ${infoRow("📍", "Venue", eventLocation || "Online")}
            ${organizerName ? infoRow("👤", "Organized By", organizerName) : ""}
            ${certificateId ? infoRow("🆔", "Certificate ID", certificateId) : ""}
          </table>
        </div>

        <!-- Certificate Footer -->
        <div style="background:linear-gradient(135deg,#d97706,${brand.warning});padding:14px 20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">
            Issued on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} by EventifyEDU
          </p>
        </div>
      </div>

      <p style="margin:0;font-size:14px;color:${brand.dark};text-align:center;line-height:1.6;">
        Thank you for being a part of this event! We hope you had a great experience. 🌟
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:${brand.muted};text-align:center;line-height:1.5;">
        💡 <em>Save this email as your official certificate of participation.</em>
      </p>
    `;
    return {
      subject: `🏆 Certificate of Participation — ${eventTitle}`,
      html: baseLayout("Certificate of Participation", `${brand.warning}, ${brand.amber}, #d97706`, "🏆", "Certificate of Participation", content, "This email serves as your official participation certificate."),
    };
  },
};

// ─── Send Email Function ────────────────────────────────────────────────────

/**
 * Send an email using a named template
 * @param {string} to - Recipient email address
 * @param {string} templateType - Template key (e.g. "registrationConfirmation")
 * @param {object} data - Template data
 * @returns {Promise<{success: boolean, messageId?: string, reason?: string}>}
 */
export async function sendEmail(to, templateType, data, attachments = []) {
  try {
    const { transporter, emailUser, emailPass } = getTransporter();

    if (!emailUser || !emailPass) {
      console.warn("[v0] Email not configured: EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS missing. Skipping.");
      return { success: false, reason: "not_configured" };
    }

    const templateFn = templates[templateType];
    if (!templateFn) {
      console.error(`[v0] Unknown email template: ${templateType}`);
      return { success: false, reason: "unknown_template" };
    }

    const { subject, html } = templateFn(data);

    const fromName = process.env.SMTP_FROM || `"EventifyEDU" <${emailUser}>`;

    const mailOptions = {
      from: fromName,
      to,
      subject,
      html,
    };

    // Attach files if provided (e.g. PDF certificates)
    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`[v0] ✅ Email sent: ${templateType} → ${to} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[v0] ❌ Failed to send email (${templateType} → ${to}):`, error.message);
    // Don't throw — email failure shouldn't break the main flow
    return { success: false, reason: error.message };
  }
}
