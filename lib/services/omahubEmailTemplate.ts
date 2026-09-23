type DetailRow = {
  label: string;
  value: string;
};

type EmailSection = {
  title?: string;
  content?: string;
  details?: DetailRow[];
};

type OmaHubEmailTemplateInput = {
  preheader?: string;
  title: string;
  subtitle?: string;
  intro?: string;
  sections?: EmailSection[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

/** Brand palette, matching tailwind.config.js. */
const CREAM = "#FFFDF8";
const BEIGE = "#F6F0E8";
const PLUM = "#613C3A";
const COCOA = "#A07F68";
const INK = "#1E1E1E";
const RULE = "#E8DCCF";

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Detail values are often a URL, an email or an @handle. Rendering those as
 * links is what a reader expects, and it saves copying them out by hand.
 * Web addresses show without their scheme, which reads better and stops a
 * long one breaking mid-word in a narrow column.
 */
function linkifyValue(value: string): string {
  const safe = escapeHtml(value);
  const link = (href: string, text: string) =>
    `<a href="${href}" style="color:${PLUM}; text-decoration:underline;">${text}</a>`;

  if (/^https?:\/\/\S+$/i.test(value)) {
    const display = escapeHtml(value.replace(/^https?:\/\//i, "").replace(/\/$/, ""));
    return link(safe, display);
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return link(`mailto:${safe}`, safe);
  }
  if (/^@[A-Za-z0-9._]+$/.test(value)) {
    return link(`https://instagram.com/${safe.slice(1)}`, safe);
  }
  return safe;
}

function renderDetails(details: DetailRow[]): string {
  if (details.length === 0) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
      ${details
        .map(
          (row, index) => `
            <tr>
              <td class="row-label" style="padding:${index === 0 ? "0" : "12px"} 16px 12px 0; ${index === 0 ? "" : `border-top:1px solid ${RULE};`} color:${COCOA}; font-family:${SANS}; font-size:13px; line-height:1.5; vertical-align:top; white-space:nowrap;">${escapeHtml(row.label)}</td>
              <td class="row-value" style="padding:${index === 0 ? "0" : "12px"} 0 12px 0; ${index === 0 ? "" : `border-top:1px solid ${RULE};`} color:${INK}; font-family:${SANS}; font-size:14px; line-height:1.5; font-weight:600; text-align:right; vertical-align:top; overflow-wrap:anywhere;">${linkifyValue(row.value)}</td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
}

function renderSections(sections: EmailSection[]): string {
  return sections
    .map((section) => {
      const title = section.title
        ? `<p style="margin:0 0 14px 0; font-family:${SANS}; font-size:11px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:${COCOA};">${escapeHtml(section.title)}</p>`
        : "";
      const content = section.content
        ? `<p style="margin:0; font-family:${SANS}; color:${INK}; font-size:15px; line-height:1.7; white-space:pre-wrap;">${escapeHtml(section.content)}</p>`
        : "";
      const details = section.details ? renderDetails(section.details) : "";
      const gap = content && details ? `<div style="height:16px;"></div>` : "";
      return `
        <div class="section" style="background:${BEIGE}; border-radius:12px; padding:24px; margin-top:20px;">
          ${title}
          ${content}
          ${gap}
          ${details}
        </div>
      `;
    })
    .join("");
}

/**
 * The house style for every OmaHub email: cream card, serif headline, one
 * accent. Deliberately no emoji anywhere - the subject lines are written
 * plainly too.
 */
export function buildOmaHubEmailHtml(input: OmaHubEmailTemplateInput): string {
  const {
    preheader,
    title,
    subtitle,
    intro,
    sections = [],
    ctaLabel,
    ctaUrl,
    footerNote = "This is an automated message from OmaHub.",
  } = input;

  const cta =
    ctaLabel && ctaUrl
      ? `
      <div style="margin-top:28px;">
        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block; background:${PLUM}; color:${CREAM}; text-decoration:none; border-radius:999px; padding:14px 30px; font-family:${SANS}; font-size:14px; font-weight:600; letter-spacing:.01em;">${escapeHtml(ctaLabel)}</a>
      </div>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Keep the cream palette in dark-mode clients instead of being inverted. -->
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(title)}</title>
    <style>
      /* On a phone the two columns get too narrow for a long address, so the
         value drops under its label. Clients that strip this still get a
         readable, if tighter, two-column table. */
      @media only screen and (max-width: 480px) {
        .shell { padding: 16px 10px 32px 10px !important; }
        .card-body { padding: 28px 22px !important; }
        .section { padding: 20px !important; }
        .row-label,
        .row-value {
          display: block !important;
          width: 100% !important;
          text-align: left !important;
          border-top: 0 !important;
          padding: 0 !important;
          white-space: normal !important;
        }
        .row-label { padding-top: 14px !important; }
        .row-value { padding-bottom: 2px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:${BEIGE}; font-family:${SANS}; -webkit-font-smoothing:antialiased;">
    ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; background:${BEIGE};">
      <tr>
        <td align="center" class="shell" style="padding:32px 16px 48px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; max-width:560px; border-collapse:collapse; background:${CREAM}; border:1px solid ${RULE}; border-radius:14px;">
            <tr>
              <td class="card-body" style="padding:40px 36px 36px 36px;">
                <p style="margin:0; font-family:${SERIF}; font-size:22px; font-weight:700; letter-spacing:.01em; color:${PLUM};">OmaHub</p>

                <h1 style="margin:28px 0 0 0; font-family:${SERIF}; font-size:30px; line-height:1.2; font-weight:700; color:${INK};">${escapeHtml(title)}</h1>
                ${subtitle ? `<p style="margin:10px 0 0 0; font-family:${SANS}; font-size:15px; line-height:1.5; color:${COCOA};">${escapeHtml(subtitle)}</p>` : ""}
                ${intro ? `<p style="margin:20px 0 0 0; font-family:${SANS}; font-size:15px; line-height:1.7; color:${INK};">${escapeHtml(intro)}</p>` : ""}

                ${renderSections(sections)}
                ${cta}

                <p style="margin:32px 0 0 0; padding-top:20px; border-top:1px solid ${RULE}; font-family:${SANS}; font-size:12px; line-height:1.6; color:${COCOA};">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
