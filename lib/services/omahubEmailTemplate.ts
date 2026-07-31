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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderDetails(details: DetailRow[]): string {
  if (details.length === 0) return "";
  return `
    <table style="width:100%; border-collapse:collapse; margin-top:8px;">
      ${details
        .map(
          (row) => `
            <tr>
              <td style="padding:8px 0; width:140px; color:#6b5b4f; font-size:14px; vertical-align:top;">${escapeHtml(row.label)}</td>
              <td style="padding:8px 0; color:#1f1b16; font-size:14px; font-weight:500; vertical-align:top;">${escapeHtml(row.value)}</td>
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
        ? `<h3 style="margin:0 0 10px 0; font-size:18px; color:#2d1921; font-family:Georgia, 'Times New Roman', serif;">${escapeHtml(section.title)}</h3>`
        : "";
      const content = section.content
        ? `<p style="margin:0; color:#2b2622; font-size:15px; line-height:1.7; white-space:pre-wrap;">${escapeHtml(section.content)}</p>`
        : "";
      const details = section.details ? renderDetails(section.details) : "";
      return `
        <div style="background:#fffdfa; border:1px solid #e8dccf; border-radius:12px; padding:20px; margin-top:16px;">
          ${title}
          ${content}
          ${details}
        </div>
      `;
    })
    .join("");
}

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

  const cta = ctaLabel && ctaUrl
    ? `
      <div style="text-align:center; margin-top:24px;">
        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block; background:#2d1921; color:#ffffff; text-decoration:none; border-radius:8px; padding:12px 22px; font-size:14px; font-weight:600;">
          ${escapeHtml(ctaLabel)}
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:20px; background:#f6f0e8; font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader)}</div>` : ""}
        <div style="max-width:620px; margin:0 auto; background:#fffdf8; border:1px solid #eadfce; border-radius:16px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#2d1921,#3d2330); color:#fff; text-align:center; padding:34px 24px;">
            <h1 style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:46px; font-weight:700; letter-spacing:.4px;">OmaHub</h1>
            <p style="margin:10px 0 0 0; font-size:18px; opacity:.92;">${escapeHtml(title)}</p>
            ${subtitle ? `<p style="margin:8px 0 0 0; font-size:14px; opacity:.78;">${escapeHtml(subtitle)}</p>` : ""}
          </div>
          <div style="padding:24px;">
            ${intro ? `<p style="margin:0; color:#2b2622; font-size:15px; line-height:1.8;">${escapeHtml(intro)}</p>` : ""}
            ${renderSections(sections)}
            ${cta}
            <div style="border-top:1px solid #e8dccf; margin-top:24px; padding-top:14px; color:#6b5b4f; font-size:12px; line-height:1.6;">
              ${escapeHtml(footerNote)}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
