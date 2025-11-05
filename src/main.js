// src/main.js
import { SECTION_TYPES, defaultSection } from "./schema.js";

/* --------------------------- State & Refs --------------------------- */
let sections = [];
let currentIndex = -1;

const list = document.getElementById("list");
const preview = document.getElementById("preview");
const currentSectionEl = document.getElementById("currentSection");

// Editor fields
const editor = document.getElementById("editor");
const titleInput = document.getElementById("titleInput");
const eyebrowInput = document.getElementById("eyebrowInput");
const bodyInput = document.getElementById("bodyInput");
const ctaTextInput = document.getElementById("ctaText");
const ctaUrlInput = document.getElementById("ctaUrl");
const dividerText = document.getElementById("dividerText");
const imgAFile = document.getElementById("imgAFile");
const imgAUrl = document.getElementById("imgAUrl");
const bgColorInput = document.getElementById("bgColor");
const fgColorInput = document.getElementById("fgColor");
const flip5050 = document.getElementById("flip5050");
const cardSide = document.getElementById("cardSide");

// Adders
document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.getAttribute("data-add");
    const newSection = defaultSection(type);
    if (!newSection || !newSection.type) {
      console.warn("Unknown section type:", type);
      return;
    }
    sections.push(newSection);
    currentIndex = sections.length - 1;
    render();
    openEditor(currentIndex);
  });
});
// ---- Placeholder images (ensure PH exists) -------------------------------
const PH = (window.PH) || {
  banner:   'https://placehold.co/600x200/png',
  c:        'https://placehold.co/285x185/png',   // card thumbnails
  half:     'https://placehold.co/285x185/png',   // 50/50 thumbnails
  spotlight:'https://placehold.co/180x237/png'    // spotlight thumb
};
// --- Utility: safely escape HTML text to prevent tag injection ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// Apply changes
document.getElementById("apply").addEventListener("click", applyChanges);

// Theme (divider color only — width control removed per your request)
document.getElementById("applyTheme").addEventListener("click", () => {
  const accentHex = document.getElementById("accentColor").value.trim() || "#FBE232";
  document.documentElement.style.setProperty("--accent", accentHex);
  renderPreview();
});

// Export
document.getElementById("exportHtml").addEventListener("click", () => {
  const html = buildExport();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Card side selector (for 2-cards) — optional, safe if element absent
if (cardSide) {
  cardSide.addEventListener("change", () => {
    if (currentIndex < 0) return;
    const s = sections[currentIndex];
    if (!s || s.type !== "cards") return;
    s.data.__side = cardSide.value; // remember which side we’re editing
    openEditor(currentIndex);       // repopulate fields for that side
  });
}

/* --------------------------- Rendering --------------------------- */
function render() {
  sections = sections.filter((s) => s && s.type);

  // Build list (cards) with DnD
  list.innerHTML = sections
    .map(
      (s, i) => `
      <div class="card" data-idx="${i}" draggable="true">
        <h3>${i + 1}. ${SECTION_TYPES[s.type]}</h3>
        <div class="mini-actions">
          <button data-act="select">Edit</button>
          <button data-act="delete" style="color:#ff6b6b;">Delete</button>
        </div>
      </div>`
    )
    .join("");

  // Mini-actions
  list.querySelectorAll(".card").forEach((el) => {
    const idx = parseInt(el.getAttribute("data-idx"), 10);
    el.addEventListener("click", (e) => {
      const act = e.target.getAttribute("data-act") || "select";
      if (act === "delete") {
        sections.splice(idx, 1);
        currentIndex = -1;
        render();
        return;
      }
      currentIndex = idx;
      openEditor(idx);
    });
  });

  // Drag & drop reorder
  let dragIdx = null;
  list.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragIdx = parseInt(el.getAttribute("data-idx"), 10);
      el.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(dragIdx));
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      list.querySelectorAll(".drop-target").forEach((n) => n.classList.remove("drop-target"));
      dragIdx = null;
    });
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      el.classList.add("drop-target");
      e.dataTransfer.dropEffect = "move";
    });
    el.addEventListener("dragleave", () => {
      el.classList.remove("drop-target");
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("drop-target");
      const overIdx = parseInt(el.getAttribute("data-idx"), 10);
      const from = dragIdx ?? parseInt(e.dataTransfer.getData("text/plain") || "-1", 10);
      if (Number.isNaN(from) || from < 0 || from === overIdx) return;
      const [moved] = sections.splice(from, 1);
      sections.splice(overIdx, 0, moved);
      currentIndex = overIdx;
      render();
      openEditor(currentIndex);
    });
  });

  renderPreview();
}

/* ------------------------- Preview (Editor) ------------------------ */
function renderPreview() {
  preview.innerHTML = sections.map(toPreview).join("");
  // enable preview image replacement
  preview.querySelectorAll(".img-target").forEach((el) => {
    el.addEventListener("click", async () => {
      const idx = parseInt(el.dataset.idx, 10);
      const key = el.dataset.key;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const dataUrl = await fileToDataURL(file);
        updateImage(idx, key, dataUrl);
      };
      input.click();
    });
  });
}

function toPreview(s) {
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cta = (t, u, color = "#007da3") =>
    t && u
      ? `<a href="${esc(u)}" style="display:inline-block; margin-top:10px; color:${color}; text-decoration:none; font-weight:600;">${esc(t)}</a>`
      : "";

  switch (s.type) {
    case "banner":
      return `
        <table role="presentation" width="100%"><tr>
          <td class="img-target" data-key="src" data-idx="${sections.indexOf(s)}">
            <img src="${esc(s.data.src)}"
                 width="100%" height="200"
                 style="display:block; width:100%; height:200px; border:0;"
                 alt="${esc(s.data.alt || "Banner")}">
          </td>
        </tr></table>
        <div class="spacer32"></div>
      `;

    case "textonly":
      return `
        <table role="presentation" width="100%"><tr><td class="txt">
          <div class="title" style="margin:10px 0;">${esc(s.data.title)}</div>
          <div>${esc(s.data.body)}</div>
          ${cta(s.data.ctaText, s.data.ctaUrl)}
        </td></tr></table>
        <div class="spacer32"></div>
      `;

    case "divider":
      return `
        <div class="divider">${esc(s.data.label)}</div>
        <div class="spacer32"></div>
      `;

    // 50/50: title above both columns in preview
    case "s5050":
    case "s5050flip": {
      const flipped = s.type === "s5050flip";
      const imgCell = `
        <td style="width:285px; vertical-align:top; ${flipped ? "padding-left:30px;" : "padding-right:30px;"}">
          <div class="img-target" data-key="imgA" data-idx="${sections.indexOf(s)}">
            <img src="${esc(s.data.imgA)}" width="285" height="185" style="display:block; border:0;" alt="">
          </div>
        </td>`;
      const textCell = `
        <td class="txt" style="width:285px; vertical-align:top;">
          <div>${esc(s.data.body)}</div>
          ${cta(s.data.ctaText, s.data.ctaUrl)}
        </td>`;
      const row = flipped ? `${textCell}${imgCell}` : `${imgCell}${textCell}`;

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td colspan="2" class="txt">
            <div class="title" style="margin:10px 0;">${esc(s.data.title)}</div>
          </td></tr>
          <tr>${row}</tr>
        </table>
        <div class="spacer32"></div>
      `;
    }

   case 'cards': {
  const d  = s.data || {};
  const c1 = Object.assign(
    { img: PH.c, title: '[Card One Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
    d.card1 || {}
  );
  const c2 = Object.assign(
    { img: PH.c, title: '[Card Two Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
    d.card2 || {}
  );

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; table-layout:fixed; border-collapse:collapse;">
    <tr>
      <td width="285" valign="top" style="padding:0 30px 0 0;">
        <img src="${c1.img}" width="285" height="185" style="display:block; width:285px; height:185px; border:0;" alt="">
        <div class="txt">
          <div class="title">${escapeHtml(c1.title)}</div>
          ${escapeHtml(c1.body)}
          <br><a href="${escapeHtml(c1.ctaUrl)}">${escapeHtml(c1.ctaText)}</a>
        </div>
      </td>
      <td width="285" valign="top" style="padding:0;">
        <img src="${c2.img}" width="285" height="185" style="display:block; width:285px; height:185px; border:0;" alt="">
        <div class="txt">
          <div class="title">${escapeHtml(c2.title)}</div>
          ${escapeHtml(c2.body)}
          <br><a href="${escapeHtml(c2.ctaUrl)}">${escapeHtml(c2.ctaText)}</a>
        </div>
      </td>
    </tr>
  </table>
  <div class="spacer32"></div>`;
}


    case "spotlight":
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${esc(s.data.bgColor)}; color:${esc(s.data.fgColor)};">
          <tr>
            <td style="padding:16px;">
              <table role="presentation" width="100%"><tr>
                <td style="width:180px; vertical-align:top; padding-right:24px;">
                  <div class="img-target" data-key="imgA" data-idx="${sections.indexOf(s)}">
                    <img src="${esc(s.data.imgA)}" width="180" height="200" style="display:block; border:0;" alt="">
                  </div>
                </td>
                <td class="txt" style="vertical-align:top;">
                  <div class="muted" style="text-transform:uppercase; font-size:12px; letter-spacing:.02em; margin:0 0 6px 0;">${esc(s.data.eyebrow)}</div>
                  <div class="title" style="margin:10px 0; color:inherit;">${esc(s.data.title)}</div>
                  <div style="color:inherit;">${esc(s.data.body)}</div>
                  ${cta(s.data.ctaText, s.data.ctaUrl, "#000")}
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
        <div class="spacer32"></div>
      `;

    case "footer":
      return `
        <table role="presentation" width="100%"><tr><td style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">
          <div style="font-size:14px; line-height:20px; margin:10px 0;"><strong>${esc(s.data.logo)}</strong></div>
          <div style="font-size:12px; line-height:18px; margin:10px 0;">${esc(s.data.fourCs || "[4c's]")}</div>
        </td></tr></table>
      `;

    case "feedback":
      return `
        <div style="text-align:center; font-size:13px; line-height:20px; color:#333; padding:24px 0 32px;">
          <strong>Questions? Ideas? Feedback?</strong><br>We’d love to hear it — please email
          <a href="mailto:${esc(s.data.email)}">${esc(s.data.email)}</a>
        </div>
      `;

    default:
      return "";
  }
}

/* ----------------------------- Editor ------------------------------ */
function openEditor(idx) {
  const s = sections[idx];
  if (!s) return;
  editor.classList.remove("hidden");
  currentSectionEl.textContent = `${idx + 1}. ${SECTION_TYPES[s.type] || s.type}`;

  // hide all contextual rows
  document.querySelectorAll(".contextual").forEach((el) => el.classList.add("hidden"));

  if (s.type === "banner") {
    show(".imgA-field");
  } else if (s.type === "textonly") {
    show(".title-field", ".body-field", ".cta-row");
  } else if (s.type === "divider") {
    show(".divider-field");
  } else if (s.type === "s5050" || s.type === "s5050flip") {
    show(".title-field", ".body-field", ".cta-row", ".imgA-field", ".flip-row");
  } else if (s.type === "cards") {
    show(".cards-side-row", ".title-field", ".body-field", ".cta-row", ".imgA-field");
  } else if (s.type === "spotlight") {
    show(".eyebrow-field", ".title-field", ".body-field", ".cta-row", ".imgA-field", ".bgcolor-row");
  } else if (s.type === "footer") {
    show(".title-field", ".body-field");
  } else if (s.type === "feedback") {
    show(".title-field", ".body-field", ".cta-row");
  }

  // populate common defaults
  titleInput.value = s.data.title || s.data.label || s.data.lead || "";
  eyebrowInput.value = s.data.eyebrow || "";
  bodyInput.value = s.data.body || "";
  ctaTextInput.value = s.data.ctaText || "";
  ctaUrlInput.value = s.data.ctaUrl || s.data.email || "";
  dividerText.value = s.data.label || "";
  imgAUrl.value = s.data.imgA || s.data.src || "";
  bgColorInput.value = s.data.bgColor || "#fbe232";
  fgColorInput.value = s.data.fgColor || "#000000";
  if (flip5050) flip5050.checked = !!s.data.flipped;

  // cards: choose side + load that side
  if (s.type === "cards") {
    if (!s.data.__side) s.data.__side = "left";
    if (cardSide) cardSide.value = s.data.__side;
    const src = s.data.__side === "right" ? s.data.right : s.data.left;

    titleInput.value = src.title || "";
    bodyInput.value = src.body || "";
    ctaTextInput.value = src.ctaText || "";
    ctaUrlInput.value = src.ctaUrl || "";
    imgAUrl.value = src.img || "";
  }
}

function show(...selectors) {
  selectors.forEach((s) => {
    const el = document.querySelector(s);
    if (el) el.classList.remove("hidden");
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function normalizeUrl(u) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u.replace(/^\/+/, "");
}

async function applyChanges() {
  if (currentIndex < 0) return;
  const s = sections[currentIndex];

  const title = titleInput.value.trim();
  const eyebrow = eyebrowInput.value.trim();
  const body = bodyInput.value.trim();
  let ctaT = ctaTextInput.value.trim();
  let ctaU = ctaUrlInput.value.trim();
  const divT = dividerText.value.trim();
  if (ctaU) ctaU = normalizeUrl(ctaU);

  async function pick(fileEl, urlEl) {
    const f = fileEl && fileEl.files && fileEl.files[0];
    if (f) return await fileToDataURL(f);
    if (urlEl && urlEl.value.trim()) return urlEl.value.trim();
    return null;
  }

  switch (s.type) {
    case "banner": {
      const newImg = await pick(imgAFile, imgAUrl);
      if (newImg) s.data.src = newImg;
      break;
    }
    case "textonly":
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      s.data.ctaText = ctaT;
      s.data.ctaUrl = ctaU;
      break;

    case "divider":
      if (divT) s.data.label = divT;
      break;

    case "s5050":
    case "s5050flip": {
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      if (ctaT) s.data.ctaText = ctaT;
      if (ctaU) s.data.ctaUrl = ctaU;
      s.data.flipped = s.type === "s5050flip" || (flip5050 && flip5050.checked);
      const newA = await pick(imgAFile, imgAUrl);
      if (newA) s.data.imgA = newA;
      break;
    }

    case "cards": {
      const sideKey = (cardSide && cardSide.value) || s.data.__side || "left";
      const dst = sideKey === "right" ? s.data.right : s.data.left;

      if (title) dst.title = title;
      if (body) dst.body = body;
      if (ctaT) dst.ctaText = ctaT;
      if (ctaU) dst.ctaUrl = ctaU;
      const chosen = await pick(imgAFile, imgAUrl);
      if (chosen) dst.img = chosen;
      break;
    }

    case "spotlight": {
      if (eyebrow) s.data.eyebrow = eyebrow;
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      if (ctaT) s.data.ctaText = ctaT;
      if (ctaU) s.data.ctaUrl = ctaU;
      s.data.bgColor = (bgColorInput && bgColorInput.value.trim()) || "#fbe232";
      s.data.fgColor = (fgColorInput && fgColorInput.value.trim()) || "#000";
      const sp = await pick(imgAFile, imgAUrl);
      if (sp) s.data.imgA = sp;
      break;
    }

    case "footer":
      if (title) s.data.logo = title;
      if (body) s.data.fourCs = body;
      break;

    case "feedback":
      if (title) s.data.lead = title;
      if (body) s.data.body = body;
      if (ctaU) s.data.email = ctaU;
      break;
  }

  if (imgAFile) imgAFile.value = "";
  render();
}

function updateImage(idx, key, dataUrl) {
  const s = sections[idx];
  if (!s) return;
  if (key === "src" || key === "imgA" || key === "imgB") s.data[key] = dataUrl;
  else if (key === "left.img") s.data.left.img = dataUrl;
  else if (key === "right.img") s.data.right.img = dataUrl;
  renderPreview();
}

/* --------------------------- Export (HTML) -------------------------- */
function buildExport() {
  const rows = sections.map(toExportRow).join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter</title>
<!--[if mso]><style>*{font-family:Arial, sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:24px;">
        <!-- 600px, border + 10px inner padding -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; border-collapse:collapse;">
          <tr>
            <td style="border:1px solid #e5e5e5; padding:10px; background:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; background:#ffffff;">
                ${rows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function toExportRow(s) {
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  switch (s.type) {
    case "banner":
      return `<tr><td>
  <img src="${esc(s.data.src)}" width="100%" height="200" style="display:block; width:100%; height:200px; border:0;" alt="${esc(s.data.alt || "Banner")}">
</td></tr>
<tr><td style="height:24px; line-height:0; font-size:0;">&nbsp;</td></tr>`;

    case "textonly":
      return `<tr><td style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333; padding:0">
  <div style="font-size:18px; line-height:20px; font-weight:bold; margin:10px 0;">${esc(s.data.title)}</div>
  <div>${esc(s.data.body)}</div>
  ${s.data.ctaText && s.data.ctaUrl ? `<div style="padding-top:10px;"><a href="${esc(s.data.ctaUrl)}" style="color:#007da3; text-decoration:none; font-weight:600;">${esc(s.data.ctaText)}</a></div>` : ``}
</td></tr>
<tr><td style="height:24px; line-height:0; font-size:0;">&nbsp;</td></tr>`;

    case "divider":
      return `<tr><td><table role="presentation" width="100%"><tr><td style="background:#FBE232; color:#000; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; text-transform:uppercase; font-weight:bold; padding:6px 10px;">${esc(s.data.label)}</td></tr></table></td></tr>
<tr><td style="height:24px; line-height:0; font-size:0;">&nbsp;</td></tr>`;

    case "s5050":
    case "s5050flip": {
      const flipped = s.type === "s5050flip";
      const imgCell = `<td width="285" valign="top" style="${flipped ? "padding-left:30px;" : "padding-right:30px;"}"><img src="${esc(s.data.imgA)}" width="285" height="185" style="display:block; border:0;" alt=""></td>`;
      const textCell = `<td width="285" valign="top" style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">
  <div>${esc(s.data.body)}</div>
  ${s.data.ctaText && s.data.ctaUrl ? `<div style="padding-top:10px;"><a href="${esc(s.data.ctaUrl)}" style="color:#007da3; text-decoration:none; font-weight:600;">${esc(s.data.ctaText)}</a></div>` : ``}
</td>`;
      const row = flipped ? `${textCell}${imgCell}` : `${imgCell}${textCell}`;
      return `<tr><td style="padding:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td colspan="2" style="font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; margin:0; padding:0 0 10px 0;">${esc(s.data.title)}</td></tr>
    <tr>${row}</tr>
  </table>
</td></tr>
<tr><td style="height:24px; line-height:0; font-size:0;">&nbsp;</td></tr>`;
    }

    case 'cards': {
     state.sections.push({
    type: 'cards',
    data: {
      card1: {
        img: PH.c,
        title: '[Card One Title]',
        body: '[Short supporting copy — one or two lines.]',
        ctaText: 'Details →',
        ctaUrl: '#'
      },
      card2: {
        img: PH.c,
        title: '[Card Two Title]',
        body: '[Short supporting copy — one or two lines.]',
        ctaText: 'Details →',
        ctaUrl: '#'
      }
    }
  });
  render();

  return `
<tr>
  <td style="padding:0 0 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; table-layout:fixed; border-collapse:collapse;">
      <tr>
        <td valign="top" width="285" style="padding:0 30px 0 0;">
          <img src="${c1.img}" width="285" height="185" alt="" style="display:block; border:0; width:285px; height:185px;">
          <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:__TEXT__; padding-top:10px;">
            <strong style="color:__TITLE__; display:block; margin:10px 0;">${escapeHtml(c1.title)}</strong>
            ${escapeHtml(c1.body)}
            <br><a href="${escapeHtml(c1.ctaUrl)}" style="color:__LINK__; text-decoration:underline; display:inline-block; margin-top:10px;">${escapeHtml(c1.ctaText)}</a>
          </div>
        </td>
        <td valign="top" width="285" style="padding:0;">
          <img src="${c2.img}" width="285" height="185" alt="" style="display:block; border:0; width:285px; height:185px;">
          <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:__TEXT__; padding-top:10px;">
            <strong style="color:__TITLE__; display:block; margin:10px 0;">${escapeHtml(c2.title)}</strong>
            ${escapeHtml(c2.body)}
            <br><a href="${escapeHtml(c2.ctaUrl)}" style="color:__LINK__; text-decoration:underline; display:inline-block; margin-top:10px;">${escapeHtml(c2.ctaText)}</a>
          </div>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}



    case "spotlight":
      return `<tr><td style="background:#fbe232; color:#000; padding:16px;">
  <table role="presentation" width="100%"><tr>
    <td width="180" valign="top" style="padding-right:24px;"><img src="${esc(s.data.imgA)}" width="180" height="200" style="display:block; border:0;" alt=""></td>
    <td valign="top" style="font-family:Arial, Helvetica, sans-serif; color:inherit;">
      <div style="text-transform:uppercase; font-size:12px; letter-spacing:.02em; margin:0 0 6px 0;">${esc(s.data.eyebrow)}</div>
      <div style="font-size:18px; line-height:20px; font-weight:bold; margin:10px 0; color:inherit;">${esc(s.data.title)}</div>
      <div style="font-size:14px; line-height:18px; color:inherit;">${esc(s.data.body)}</div>
      ${s.data.ctaText && s.data.ctaUrl ? `<div style="padding-top:10px;"><a href="${esc(s.data.ctaUrl)}" style="color:#000; text-decoration:none; font-weight:600;">${esc(s.data.ctaText)}</a></div>` : ``}
    </td>
  </tr></table>
</td></tr>
<tr><td style="height:24px; line-height:0; font-size:0;">&nbsp;</td></tr>`;

    case "footer":
      return `<tr><td style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">
  <div style="font-size:14px; line-height:20px; margin:10px 0;"><strong>${esc(s.data.logo)}</strong></div>
  <div style="font-size:12px; line-height:18px; margin:10px 0;">${esc(s.data.fourCs || "[4c's]")}</div>
</td></tr>`;

    case "feedback":
      return `<tr><td style="text-align:center; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#333; padding:24px 0 32px;">
  <strong>Questions? Ideas? Feedback?</strong><br>We’d love to hear it — please email
  <a href="mailto:${esc(s.data.email)}" style="color:#007da3; text-decoration:none;">${esc(s.data.email)}</a>
</td></tr>`;

    default:
      return "";
  }
}
