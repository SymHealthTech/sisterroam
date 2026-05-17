import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "SisterRoam <noreply@sisterroam.com>";
const BRAND = "#5D1A8B";
const SITE = process.env.NEXTAUTH_URL ?? "https://sisterroam.com";

/* ── Base sender ───────────────────────────────────────────── */

export default resend;

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
  if (error) {
    console.error("[resend] send failed:", error);
    throw new Error(error.message ?? "Failed to send email");
  }
  return data;
}

/* ── Layout wrapper ────────────────────────────────────────── */

function layout(content) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>SisterRoam</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
              <!-- Header -->
              <tr>
                <td style="background:${BRAND};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
                  <img
                    src="https://sisterroam.com/logos/sisterroam-logo-on-purple.png"
                    alt="SisterRoam"
                    width="180"
                    height="45"
                    style="display:block;margin:0 auto;max-width:180px;"
                  />
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="background:white;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f3f4f6;padding:20px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    © ${new Date().getFullYear()} SisterRoam ·
                    <a href="${SITE}/settings" style="color:#9ca3af;">Manage notifications</a> ·
                    <a href="${SITE}" style="color:#9ca3af;">Visit site</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function btn(text, url) {
  return `
    <a href="${url}" style="display:inline-block;background:${BRAND};color:white;text-decoration:none;
      padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;margin-top:20px;">
      ${text}
    </a>
  `;
}

function hi(name) {
  return `<p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">Hi ${name} 👋</p>`;
}

function p(text) {
  return `<p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.6;">${text}</p>`;
}

/* ── OTP email ─────────────────────────────────────────────── */

export async function sendOtpEmail({ to, otp }) {
  return sendEmail({
    to,
    subject: "Your SisterRoam verification code",
    html: layout(`
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Verify your email</p>
      ${p("Use this code to complete your sign-up. It expires in <strong>10 minutes</strong>.")}
      <div style="text-align:center;padding:24px 0;">
        <p style="font-size:40px;font-weight:800;letter-spacing:12px;color:${BRAND};margin:0;">${otp}</p>
      </div>
      ${p('<span style="color:#9ca3af;font-size:12px;">If you didn\'t request this, you can safely ignore this email.</span>')}
    `),
  });
}

/* ── Email verification link ───────────────────────────────── */

export async function sendVerificationEmail(user) {
  const link = `${SITE}/api/auth/verify-email?token=${user.emailVerificationToken}`;
  return sendEmail({
    to: user.email,
    subject: "Verify your email – SisterRoam",
    html: layout(`
      ${hi(user.fullName ?? "there")}
      ${p("Please verify your email address to complete your SisterRoam account.")}
      <div style="text-align:center;">${btn("Verify email address", link)}</div>
      ${p('<span style="color:#9ca3af;font-size:12px;">This link expires in 24 hours. If you didn\'t create an account, ignore this.</span>')}
    `),
  });
}

/* ── Welcome ────────────────────────────────────────────────── */

export async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: `Welcome to SisterRoam, ${user.fullName?.split(" ")[0] ?? "sister"}!`,
    html: layout(`
      ${hi(user.fullName?.split(" ")[0] ?? "sister")}
      ${p("Your SisterRoam account is all set. 🎉")}
      ${p("You can now browse verified hosts around the world, complete your verification to send and receive hosting requests, and connect with a global community of solo female travellers.")}
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND};">Next steps</p>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
          <li>Complete your profile</li>
          <li>Start your verification</li>
          <li>Browse hosts in your next destination</li>
        </ul>
      </div>
      <div style="text-align:center;">${btn("Explore SisterRoam", `${SITE}/explore`)}</div>
    `),
  });
}

/* ── New hosting request (host) ─────────────────────────────── */

export async function sendNewRequestEmail(host, guest, hostingRequest) {
  const guestName = guest.fullName?.split(" ")[0] ?? "A member";
  const checkIn = new Date(hostingRequest.checkInDate).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
  const checkOut = new Date(hostingRequest.checkOutDate).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
  return sendEmail({
    to: host.email,
    subject: `New hosting request from ${guestName} – SisterRoam`,
    html: layout(`
      ${hi(host.fullName?.split(" ")[0] ?? "there")}
      ${p(`<strong>${guest.fullName}</strong> would like to stay with you!`)}
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:16px 0;border:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;font-size:13px;"><strong>Dates:</strong> ${checkIn} → ${checkOut}</p>
        <p style="margin:0 0 6px;font-size:13px;"><strong>Guests:</strong> ${hostingRequest.numberOfGuests ?? 1}</p>
        ${hostingRequest.introductionMessage ? `<p style="margin:8px 0 0;font-size:13px;font-style:italic;color:#6b7280;">"${hostingRequest.introductionMessage.slice(0, 200)}…"</p>` : ""}
      </div>
      <div style="text-align:center;">${btn("Review request", `${SITE}/messages`)}</div>
      ${p('<span style="color:#9ca3af;font-size:12px;">You have 48 hours to accept or decline before it expires.</span>')}
    `),
  });
}

/* ── Request accepted (guest) ──────────────────────────────── */

export async function sendRequestAcceptedEmail(guest, host, hostingRequest) {
  const checkIn = new Date(hostingRequest.checkInDate).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
  return sendEmail({
    to: guest.email,
    subject: `Your request was accepted – SisterRoam`,
    html: layout(`
      ${hi(guest.fullName?.split(" ")[0] ?? "there")}
      ${p(`<strong>${host.fullName}</strong> accepted your hosting request. 🎉`)}
      ${p(`You're all set for <strong>${checkIn}</strong>. Message ${host.fullName?.split(" ")[0]} to coordinate arrival details.`)}
      <div style="text-align:center;">${btn("Open conversation", `${SITE}/messages`)}</div>
      ${p('<span style="color:#9ca3af;font-size:12px;">Please make sure your safety check-in is set up before you arrive.</span>')}
    `),
  });
}

/* ── Request declined (guest) ──────────────────────────────── */

export async function sendRequestDeclinedEmail(guest, host) {
  return sendEmail({
    to: guest.email,
    subject: "Your hosting request was not accepted – SisterRoam",
    html: layout(`
      ${hi(guest.fullName?.split(" ")[0] ?? "there")}
      ${p(`Unfortunately, <strong>${host.fullName}</strong> wasn't able to host you this time.`)}
      ${p("Don't worry — there are many other verified sisters ready to welcome you. Browse alternative hosts in your destination.")}
      <div style="text-align:center;">${btn("Browse other hosts", `${SITE}/explore`)}</div>
    `),
  });
}

/* ── Verification approved ─────────────────────────────────── */

export async function sendVerificationApprovedEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "You're verified! 🛡️ – SisterRoam",
    html: layout(`
      ${hi(user.fullName?.split(" ")[0] ?? "sister")}
      ${p("Great news — your identity has been verified! You now have a <strong>Verified Sister</strong> badge on your profile.")}
      <div style="background:#E1F5EE;border-radius:12px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#085041;font-weight:600;">🛡️ What this unlocks</p>
        <ul style="margin:8px 0 0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
          <li>Send hosting requests to verified sisters</li>
          <li>Receive hosting requests from verified sisters</li>
          <li>Priority placement in search results</li>
        </ul>
      </div>
      <div style="text-align:center;">${btn("Activate your badge", `${SITE}/profile/verification`)}</div>
    `),
  });
}

/* ── Verification rejected ─────────────────────────────────── */

export async function sendVerificationRejectedEmail(user, reason) {
  return sendEmail({
    to: user.email,
    subject: "Verification update – SisterRoam",
    html: layout(`
      ${hi(user.fullName?.split(" ")[0] ?? "sister")}
      ${p("We were unable to verify your identity with the documents submitted.")}
      ${
        reason
          ? `
        <div style="background:#FEF2F2;border-radius:12px;padding:14px 18px;margin:16px 0;border-left:3px solid #E24B4A;">
          <p style="margin:0;font-size:13px;color:#991B1B;"><strong>Reason:</strong> ${reason}</p>
        </div>
      `
          : ""
      }
      ${p("Please re-submit with clearer documents. Make sure your full name, date of birth, and photo are clearly visible.")}
      <div style="text-align:center;">${btn("Resubmit verification", `${SITE}/profile/verification`)}</div>
    `),
  });
}

/* ── Missed safety check-in ────────────────────────────────── */

export async function sendMissedCheckinAlert(emergencyContact, user, host) {
  return sendEmail({
    to: emergencyContact.email,
    subject: `⚠️ Missed safety check-in – ${user.fullName} – SisterRoam`,
    html: layout(`
      <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#E24B4A;">⚠️ Safety check-in missed</p>
      ${p(`<strong>${user.fullName}</strong> has missed their scheduled safety check-in on SisterRoam.`)}
      ${host ? `${p(`They are currently staying with <strong>${host.fullName}</strong> in <strong>${host.city ?? "an unknown location"}</strong>.`)}` : ""}
      ${p("This may be nothing, but we recommend trying to contact them directly.")}
      <div style="background:#FEF2F2;border-radius:12px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#991B1B;font-weight:600;">What to do if you can\'t reach them</p>
        <p style="margin:8px 0 0;font-size:13px;color:#374151;">If you are unable to contact ${user.fullName?.split(" ")[0]} within a reasonable time, consider contacting local emergency services.</p>
      </div>
      ${p('<span style="color:#9ca3af;font-size:12px;">You received this email because you are listed as an emergency contact for this SisterRoam member.</span>')}
    `),
  });
}

/* ── SOS activated (emergency contact) ─────────────────────── */

export async function sendSOSAlert(
  emergencyContact,
  user,
  activeRequest,
  coordinates,
) {
  const location = coordinates
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : "Location unavailable";
  const mapsUrl = coordinates
    ? `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`
    : null;

  return sendEmail({
    to: emergencyContact.email,
    subject: `🆘 SOS ALERT – ${user.fullName} – SisterRoam`,
    html: layout(`
      <p style="margin:0 0 16px;font-size:18px;font-weight:800;color:#E24B4A;">🆘 SOS Alert</p>
      ${p(`<strong>${user.fullName}</strong> has activated the emergency SOS button on SisterRoam.`)}
      <div style="background:#FEF2F2;border-radius:12px;padding:16px 20px;margin:16px 0;border:2px solid #E24B4A;">
        <p style="margin:0 0 6px;font-size:13px;"><strong>Location:</strong> ${location}</p>
        ${activeRequest ? `<p style="margin:0 0 6px;font-size:13px;"><strong>Currently staying with:</strong> ${activeRequest.hostId?.fullName ?? "Unknown"}</p>` : ""}
        ${mapsUrl ? `<p style="margin:8px 0 0;"><a href="${mapsUrl}" style="color:${BRAND};font-size:13px;">Open in Google Maps →</a></p>` : ""}
      </div>
      ${p("<strong>Please contact them immediately.</strong> If you cannot reach them, contact local emergency services.")}
      ${p('<span style="color:#9ca3af;font-size:12px;">You are receiving this because you are listed as an emergency contact for this SisterRoam member.</span>')}
    `),
  });
}

/* ── Co-traveller: interest expressed (to post author) ──────── */

export async function sendCoTravellerInterestEmail(
  author,
  interestedUser,
  post,
) {
  const firstName = author.fullName?.split(" ")[0] ?? "there";
  const intName = interestedUser.fullName ?? "A sister";
  const preview = post.interestedCount ?? 1;
  return sendEmail({
    to: author.email,
    subject: `${intName} wants to join your trip to ${post.toCity}!`,
    html: layout(`
      ${hi(firstName)}
      ${p(`<strong>${intName}</strong> has expressed interest in joining your trip to <strong>${post.toCity}</strong>.`)}
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:16px 0;border:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;font-size:13px;"><strong>Trip:</strong> ${post.fromCity} → ${post.toCity}</p>
        <p style="margin:0 0 6px;font-size:13px;"><strong>Member:</strong> ${intName}</p>
        ${interestedUser.city ? `<p style="margin:0 0 6px;font-size:13px;"><strong>Based in:</strong> ${interestedUser.city}</p>` : ""}
      </div>
      <div style="text-align:center;">${btn("Review her interest", `${SITE}/cotraveller/${post._id}/interests`)}</div>
      ${p(`<span style="color:#9ca3af;font-size:12px;">You have ${preview} total interested member${preview !== 1 ? "s" : ""} for this trip.</span>`)}
    `),
  });
}

/* ── Co-traveller: accepted (to interested user) ────────────── */

export async function sendCoTravellerAcceptedEmail(
  interestedUser,
  author,
  post,
  chatRequestId,
) {
  const firstName = interestedUser.fullName?.split(" ")[0] ?? "there";
  const depDate = post.departureDate
    ? new Date(post.departureDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  return sendEmail({
    to: interestedUser.email,
    subject: `You are matched for ${post.toCity}!`,
    html: layout(`
      ${hi(firstName)}
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">Congratulations! 🎉</p>
      ${p(`<strong>${author.fullName}</strong> has accepted your request to join the trip to <strong>${post.toCity}</strong>.`)}
      <div style="background:#E1F5EE;border-radius:12px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0 0 6px;font-size:13px;"><strong>Route:</strong> ${post.fromCity} → ${post.toCity}</p>
        ${depDate ? `<p style="margin:0;font-size:13px;"><strong>Departure:</strong> ${depDate}</p>` : ""}
      </div>
      ${p(`You can now chat with <strong>${author.fullName?.split(" ")[0]}</strong> to plan your journey together.`)}
      <div style="text-align:center;">${btn("Open your conversation", `${SITE}/messages/${chatRequestId}`)}</div>
    `),
  });
}

/* ── Co-traveller: declined (to interested user) ────────────── */

export async function sendCoTravellerDeclinedEmail(
  interestedUser,
  author,
  post,
) {
  const firstName = interestedUser.fullName?.split(" ")[0] ?? "there";
  return sendEmail({
    to: interestedUser.email,
    subject: `Trip update for ${post.toCity}`,
    html: layout(`
      ${hi(firstName)}
      ${p(`We wanted to let you know your request to join <strong>${author.fullName?.split(" ")[0]}</strong>'s trip to <strong>${post.toCity}</strong> was not accepted this time.`)}
      ${p("Don't be discouraged — there are many more trips to explore, and the right travel companion is out there!")}
      <div style="text-align:center;">${btn("Browse more trips", `${SITE}/cotraveller`)}</div>
      ${p('<span style="color:#9ca3af;font-size:12px;">Keep exploring and posting your own trip plans to find your ideal co-traveller.</span>')}
    `),
  });
}

/* ── New answer on recommendation question ───────────────────── */

export async function sendNewAnswerEmail(questionAuthor, answerer, question) {
  const firstName = questionAuthor.fullName?.split(" ")[0] ?? "there";
  return sendEmail({
    to: questionAuthor.email,
    subject: `${answerer.fullName} answered your question about ${question.city}`,
    html: layout(`
      ${hi(firstName)}
      ${p(`<strong>${answerer.fullName}</strong> shared their experience about <strong>${question.city}</strong> in response to your question.`)}
      <div style="background:#f9fafb;border-radius:12px;padding:14px 18px;margin:16px 0;border-left:3px solid ${BRAND};">
        <p style="margin:0;font-size:13px;font-style:italic;color:#374151;">"${question.question}"</p>
      </div>
      <div style="text-align:center;">${btn("Read the full answer", `${SITE}/recommendations/questions/${question._id}`)}</div>
      ${p('<span style="color:#9ca3af;font-size:12px;">You can mark an answer as the best answer to help other travellers find useful information quickly.</span>')}
    `),
  });
}

/* ── Story published (author) ───────────────────────────────── */

export async function sendStoryPublishedEmail(author, story) {
  const firstName = author.fullName?.split(" ")[0] ?? "there";
  const storyUrl = `${SITE}/stories/${story.slug}`;
  const shareText = encodeURIComponent(
    `Read my travel story on SisterRoam: ${story.title} ${storyUrl}`,
  );
  return sendEmail({
    to: author.email,
    subject: "Your travel story is live on SisterRoam!",
    html: layout(`
      ${hi(firstName)}
      ${p(`Your story <strong>"${story.title}"</strong> is now published on SisterRoam. 🎉`)}
      ${
        story.excerpt
          ? `<div style="background:#f9fafb;border-radius:12px;padding:14px 18px;margin:16px 0;border-left:3px solid ${BRAND};">
        <p style="margin:0;font-size:13px;color:#374151;font-style:italic;">"${story.excerpt}"</p>
      </div>`
          : ""
      }
      <div style="text-align:center;">${btn("Read your story", storyUrl)}</div>
      ${p(`Share it with your friends: <a href="https://wa.me/?text=${shareText}" style="color:${BRAND};">Share on WhatsApp</a>`)}
      ${p('<span style="color:#9ca3af;font-size:12px;">Your story is visible to everyone on the SisterRoam website — no login required.</span>')}
    `),
  });
}

/* ── Story verification prompt (future campaigns) ───────────── */

export async function sendStoryVerificationPromptEmail(user) {
  const firstName = user.fullName?.split(" ")[0] ?? "sister";
  return sendEmail({
    to: user.email,
    subject: "Share your travel story with 1,200+ sisters",
    html: layout(`
      ${hi(firstName)}
      ${p("You've been on SisterRoam for a while — we'd love to hear your story!")}
      ${p("Verified members can share travel stories that appear on the public SisterRoam website. Your experience could inspire another sister to take the trip of a lifetime.")}
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND};">When you get verified, you can share:</p>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
          <li>Solo travel adventures</li>
          <li>Safety tips and experiences</li>
          <li>Cultural discoveries and food journeys</li>
          <li>Hosting and co-traveller stories</li>
        </ul>
      </div>
      <div style="text-align:center;">${btn("Get verified and share", `${SITE}/profile/verification`)}</div>
    `),
  });
}

/* ── Verified badge activated ───────────────────────────────── */

export async function sendVerificationBadgeEmail(user) {
  const firstName = user.fullName?.split(' ')[0] ?? 'sister'
  return sendEmail({
    to: user.email,
    subject: `Your verified badge is active, ${firstName}!`,
    html: layout(`
      <p style="margin:0 0 8px;font-size:24px;font-weight:500;color:#1a1a1a;font-family:Georgia,serif;">
        Congratulations, ${firstName}!
      </p>
      ${p('Your SisterRoam verified badge is now active.')}
      <div style="background:#EEEDFE;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <span style="background:#5D1A8B;color:#fff;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:500;">
          ✓ Verified Member
        </span>
        <p style="margin:12px 0 0;font-size:13px;color:#3C3489;">
          Your profile now shows this badge
        </p>
      </div>
      <p style="margin:0 0 8px;font-size:15px;font-weight:500;color:#1a1a1a;">What you can now do:</p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${[
          'Send hosting requests to verified sisters',
          'Receive hosting requests as a host',
          'Priority placement in search results',
          'Share your travel stories publicly',
        ].map(item => `
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#444;">✓ &nbsp;${item}</td>
          </tr>
        `).join('')}
      </table>
      <div style="text-align:center;">${btn('Start exploring hosts →', `${SITE}/explore`)}</div>
      ${p(`<span style="color:#9ca3af;font-size:13px;text-align:center;display:block;margin-top:32px;">
        Welcome to the verified sisterhood.<br>
        — Dr Manisha Sonawane &amp; the SisterRoam team
      </span>`)}
    `),
  })
}

/* ── Password reset ─────────────────────────────────────────── */

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const firstName = name?.split(' ')[0] ?? 'there'
  return sendEmail({
    to,
    subject: 'Reset your SisterRoam password',
    html: layout(`
      ${hi(firstName)}
      ${p("We received a request to reset your password. Click the button below to choose a new one.")}
      <div style="text-align:center;">${btn('Reset password', resetUrl)}</div>
      ${p('<span style="color:#9ca3af;font-size:12px;">This link expires in <strong>1 hour</strong>. If you didn\'t request a password reset, you can safely ignore this email — your password won\'t change.</span>')}
    `),
  })
}

/* ── Admin SOS notification ─────────────────────────────────── */

export async function sendAdminSOSNotification(adminEmail, user, coordinates) {
  const location = coordinates
    ? `${coordinates.latitude}, ${coordinates.longitude}`
    : "Location unavailable";
  const mapsUrl = coordinates
    ? `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`
    : null;

  return sendEmail({
    to: adminEmail,
    subject: `[URGENT] SOS from ${user.fullName} – SisterRoam`,
    html: layout(`
      <p style="margin:0 0 16px;font-size:16px;font-weight:800;color:#E24B4A;">🆘 SOS activated on platform</p>
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:16px 0;border:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;font-size:13px;"><strong>User:</strong> ${user.fullName} (${user.email})</p>
        <p style="margin:0 0 6px;font-size:13px;"><strong>User ID:</strong> ${user._id ?? user.id}</p>
        <p style="margin:0 0 6px;font-size:13px;"><strong>Location:</strong> ${location}</p>
        ${mapsUrl ? `<p style="margin:0;"><a href="${mapsUrl}" style="color:${BRAND};font-size:13px;">Open in Google Maps →</a></p>` : ""}
      </div>
      ${p("Emergency contacts have been notified. Review the situation in the admin panel.")}
      <div style="text-align:center;">${btn("Open admin panel", `${SITE}/admin`)}</div>
    `),
  });
}
