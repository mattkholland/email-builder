// Outlook Newsletter Builder — main.js (clean, compiled)

const state = {
  sections: [],
  theme: { accent: "#FBE232" }
};

const listEl = document.getElementById("list");
const previewEl = document.getElementById("preview");
const currentEl = document.getElementById("currentSection");

// -----------------------------
// Helpers
// -----------------------------
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function normalizeUrl(u){
  if(!u) return u;
  if(/^https?:\/\//i.test(u)) return u;
  return 'https://' + u.replace(/^\/+/, '');
}

// -----------------------------
// Adders
// -----------------------------
function addSection(type) {
  const def = schema[type];
  if (!def) {
    alert(`Unknown section type: ${type}`);
    return;
  }
  state.sections.push({ type, data: JSON.parse(JSON.stringify(def.defaults)) });
  render();
}

document.querySelectorAll("[data-add]").forEach(btn => {
  btn.addEventListener("click", () => addSection(btn.dataset.add));
});

// -----------------------------
// Render list + preview
// -----------------------------
function render() {
  // list
  listEl.innerHTML =
    state.sections.map((s, i) => `
      <div class="card" data-idx="${i}">
        <h3>${i + 1}. ${schema[s.type].label}</h3>
        <div class="mini-actions">
          <button data-act="edit">Edit</button>
          <button data-act="del" style="color:#ff6b6b;">Delete</button>
        </div>
      </div>
    `).join("") || '<div class="muted">Add sections to begin.</div>';

  // list actions
  document.querySelectorAll(".card").forEach(el => {
    const idx = parseInt(el.dataset.idx, 10);
    el.querySelector('[data-act="edit"]').onclick = () => openEditor(idx);
    el.querySelector('[data-act="del"]').onclick = () => { state.sections.splice(idx, 1); render(); };
  });

  renderPreview();
}

// -----------------------------
// Editor
// -----------------------------
function openEditor(idx) {
  const s = state.sections[idx];
  const ed = document.getElementById("editor");
  ed.classList.remove("hidden");
  currentEl.textContent = `${idx + 1}. ${schema[s.type].label}`;

  // hide all contextual
  document.querySelectorAll(".contextual").forEach(el => el.classList.add("hidden"));

  // show relevant
  if (["banner","spotlight","s5050","s5050flip","cards"].includes(s.type)) {
    document.querySelector(".imgA-field").classList.remove("hidden");
  }
  if (["textonly","s5050","s5050flip","cards","spotlight"].includes(s.type)) {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
  }
  if (s.type === "divider") document.querySelector(".divider-field").classList.remove("hidden");
  if (s.type === "spotlight") {
    document.querySelector(".eyebrow-field").classList.remove("hidden");
    document.querySelector(".bgcolor-row").classList.remove("hidden");
  }
  if (["s5050","s5050flip"].includes(s.type)) {
    document.querySelector(".flip-row").classList.remove("hidden");
  }

  // populate values
  document.getElementById("titleInput").value = s.data.title || "";
  document.getElementById("bodyInput").value = s.data.body || "";
  document.getElementById("ctaText").value = s.data.ctaText || "";
  document.getElementById("ctaUrl").value = s.data.ctaUrl || "";
  document.getElementById("dividerText").value = s.data.label || "";
  document.getElementById("eyebrowInput").value = s.data.eyebrow || "";
  document.getElementById("bgColor").value = s.data.bg || "#fbe232";
  document.getElementById("fgColor").value = s.data.textColor || "#000000";
  document.getElementById("flip5050").checked = !!s.data.flipped;
  document.getElementById("imgAUrl").value = s.data.imgA || "";

  // enable click-to-replace on images after render
  setTimeout(enableImageReplacement, 0);
}

async function applyChanges() {
  const labelText = currentEl.textContent || "";
  const match = labelText.match(/^(\d+)\./);
  const idx = match ? parseInt(match[1], 10) - 1 : -1;
  if (idx < 0 || !state.sections[idx]) return;

  const s = state.sections[idx];
  const title = document.getElementById("titleInput").value.trim();
  const body = document.getElementById("bodyInput").value.trim();
  let ctaText = document.getElementById("ctaText").value.trim();
  let ctaUrl  = document.getElementById("ctaUrl").value.trim();
  const label = document.getElementById("dividerText").value.trim();
  const eyebrow = document.getElementById("eyebrowInput").value.trim();
  const bg = document.getElementById("bgColor").value.trim();
  const fg = document.getElementById("fgColor").value.trim();
  const flip5050 = document.getElementById("flip5050").checked;

  if (ctaUrl) ctaUrl = normalizeUrl(ctaUrl);

  // image
  let finalImg = s.data.imgA;
  const fileInput = document.getElementById("imgAFile");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    finalImg = await fileToDataURL(fileInput.files[0]);
  } else {
    const imgUrl = document.getElementById("imgAUrl").value.trim();
    if (imgUrl) finalImg = imgUrl;
  }

  // assign per type
  if (s.type === "banner") {
    s.data.imgA = finalImg || s.data.imgA;
  } else if (s.type === "textonly") {
    if (title) s.data.title = title;
    s.data.body = body;
    s.data.ctaText = ctaText;
    s.data.ctaUrl = ctaUrl;
  } else if (s.type === "divider") {
    if (label) s.data.label = label;
  } else if (s.type === "s5050" || s.type === "s5050flip") {
    if (title) s.data.title = title;
    s.data.body = body;
    s.data.ctaText = ctaText;
    s.data.ctaUrl = ctaUrl;
    s.data.imgA = finalImg || s.data.imgA;
    s.data.flipped = !!flip5050;
  } else if (s.type === "cards") {
    // applies to left card (quick editor target). For now: map editor inputs to left by default.
    if (title) s.data.left.title = title;
    s.data.left.body = body;
    s.data.left.ctaText = ctaText;
    s.data.left.ctaUrl = ctaUrl;
    s.data.left.img = finalImg || s.data.left.img;
  } else if (s.type === "spotlight") {
    s.data.eyebrow = eyebrow || s.data.eyebrow;
    if (title) s.data.title = title;
    s.data.body = body;
    s.data.bg = bg || s.data.bg;
    s.data.textColor = fg || s.data.textColor;
    s.data.ctaText = ctaText;
    s.data.ctaUrl = ctaUrl;
    s.data.imgA = finalImg || s.data.imgA;
  } else if (s.type === "footer") {
    s.data.logo = title || s.data.logo; // reuse title field as logo text
    s.data.fourCs = body || s.data.fourCs;
  } else if (s.type === "feedback") {
    s.data.lead = title || s.data.lead;
    s.data.email = ctaUrl || s.data.email; // reuse URL field for email
  }

  render();
}

document.getElementById("apply").addEventListener("click", applyChanges);

// Theme (accent only)
document.getElementById("applyTheme").addEventListener("click", () => {
  const hex = document.getElementById("accentColor").value.trim() || "#FBE232";
  state.theme.accent = hex;
  document.documentElement.style.setProperty("--accent", hex);
});

// -----------------------------
// Preview
// -----------------------------
function renderPreview() {
  previewEl.innerHTML = state.sections.map((s, i) => toPreview(s, i)).join("");
  // update accent live
  document.documentElement.style.setProperty("--accent", state.theme.accent);
  enableImageReplacement();
}

function toPreview(s, i) {
  switch (s.type) {
    case "banner":
      return `<table><tr><td class="img-target" data-idx="${i}" data-key="imgA">
        <img src="${s.data.imgA}" width="600" height="200" alt="${escapeHtml(s.data.alt||'Banner')}" style="width:100%;height:200px;">
      </td></tr></table><div class="spacer32"></div>`;

    case "textonly":
      return `<table><tr><td class="txt">
        <div class="title">${escapeHtml(s.data.title)}</div>
        ${escapeHtml(s.data.body)}
        <br><a href="${escapeHtml(s.data.ctaUrl||'#')}" style="color:#007da3;">${escapeHtml(s.data.ctaText||'')}</a>
      </td></tr></table><div class="spacer32"></div>`;

    case "divider":
      return `<div class="divider">${escapeHtml(s.data.label)}</div><div class="spacer32"></div>`;

    case "s5050":
    case "s5050flip": {
      const flipped = !!s.data.flipped;
      const imgCell = `<td style="width:285px; padding-right:30px;"><img src="${s.data.imgA}" width="285" height="185" alt=""></td>`;
      const txtCell = `<td class="txt" style="width:285px;">
        <div class="title">${escapeHtml(s.data.title)}</div>
        ${escapeHtml(s.data.body)}
        <br><a href="${escapeHtml(s.data.ctaUrl||'#')}" style="color:#007da3;">${escapeHtml(s.data.ctaText||'')}</a>
      </td>`;
      return `<table><tr>${flipped ? txtCell + imgCell : imgCell + txtCell}</tr></table><div class="spacer32"></div>`;
    }

    case "cards":
      return `<table><tr>
        <td style="width:285px; padding-right:30px;">
          <img src="${s.data.left.img}" width="285" height="185" alt="">
          <div class="txt">
            <div class="title">${escapeHtml(s.data.left.title)}</div>
            ${escapeHtml(s.data.left.body)}
            <br><a href="${escapeHtml(s.data.left.ctaUrl||'#')}" style="color:#007da3;">${escapeHtml(s.data.left.ctaText||'')}</a>
          </div>
        </td>
        <td style="width:285px;">
          <img src="${s.data.right.img}" width="285" height="185" alt="">
          <div class="txt">
            <div class="title">${escapeHtml(s.data.right.title)}</div>
            ${escapeHtml(s.data.right.body)}
            <br><a href="${escapeHtml(s.data.right.ctaUrl||'#')}" style="color:#007da3;">${escapeHtml(s.data.right.ctaText||'')}</a>
          </div>
        </td>
      </tr></table><div class="spacer32"></div>`;

    case "spotlight":
      return `<table><tr>
        <td style="width:180px; padding-right:30px;" class="img-target" data-key="imgA" data-idx="${i}">
          <img src="${s.data.imgA}" width="180" height="237" alt="">
        </td>
        <td class="txt spotlight" style="background:${s.data.bg}; color:${s.data.textColor}; padding:20px;">
          <div style="text-transform:uppercase; font-size:13px; margin-bottom:6px;">${escapeHtml(s.data.eyebrow)}</div>
          <div class="title" style="color:${s.data.textColor};">${escapeHtml(s.data.title)}</div>
          <span style="color:${s.data.textColor};">${escapeHtml(s.data.body)}</span>
          <br><a href="${escapeHtml(s.data.ctaUrl||'#')}" style="color:#000;">${escapeHtml(s.data.ctaText||'')}</a>
        </td>
      </tr></table><div class="spacer32"></div>`;

    case "footer":
      return `<div class="footer" style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">
        <div style="font-size:14px; line-height:20px; margin-bottom:8px;"><strong>${escapeHtml(s.data.logo||'[Logo]')}</strong></div>
        <div style="font-size:12px; line-height:18px;">${escapeHtml(s.data.fourCs||"[4c's]")}</div>
      </div>`;

    case "feedback":
      return `<div class="feedback" style="text-align:center; padding:24px 0 32px; color:#333;">
        <strong>${escapeHtml(s.data.lead||"Questions? Ideas? Feedback?")}</strong><br>
        We’d love to hear it — please email <a href="mailto:${escapeHtml(s.data.email||'name@email.com')}" style="color:#007da3;">${escapeHtml(s.data.email||'name@email.com')}</a>
      </div>`;
  }
  return "";
}

// -----------------------------
// Image replacement (click or drop)
// -----------------------------
function enableImageReplacement(){
  document.querySelectorAll(".img-target").forEach(el=>{
    el.onclick = async ()=>{
      const idx = parseInt(el.dataset.idx,10);
      const key = el.dataset.key || 'imgA';
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = async (e)=>{
        const file = e.target.files[0]; if(!file) return;
        const dataUrl = await fileToDataURL(file);
        setImage(idx, key, dataUrl);
      };
      input.click();
    };
    el.ondragover = e=>{ e.preventDefault(); };
    el.ondrop = async (e)=>{
      e.preventDefault();
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if(!file) return;
      const dataUrl = await fileToDataURL(file);
      const idx = parseInt(el.dataset.idx,10);
      const key = el.dataset.key || 'imgA';
      setImage(idx, key, dataUrl);
    };
  });
}
function setImage(idx, key, dataUrl){
  const s = state.sections[idx]; if(!s) return;
  if (s.type === "cards") {
    if (key === "left.img") s.data.left.img = dataUrl;
    else if (key === "right.img") s.data.right.img = dataUrl;
    else s.data.left.img = dataUrl; // default to left
  } else {
    s.data[key] = dataUrl;
  }
  renderPreview();
}

// -----------------------------
// Apply changes
// -----------------------------
document.getElementById("apply").addEventListener("click", applyChanges);

// -----------------------------
// Export HTML (wrap preview in a minimal email shell)
// -----------------------------
document.getElementById("exportHtml").addEventListener("click", () => {
  const rows = previewEl.innerHTML;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FBE232';
  const doc = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter</title>
<style>
  body{margin:0;padding:0;background:#ffffff;}
  .email{width:600px;margin:0 auto;background:#ffffff;}
  .txt{font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#333;}
  .title{font-size:18px;line-height:20px;font-weight:bold;margin:10px 0;color:#111;}
  .divider{background:${accent};color:#000;font-weight:bold;text-transform:uppercase;font-size:13px;padding:6px 10px;}
  a{color:#007da3;text-decoration:none;}
</style></head>
<body><div class="email">${rows}</div></body></html>`;

  const blob = new Blob([doc], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter.html";
  a.click();
  URL.revokeObjectURL(url);
});

// Initial render
render();
