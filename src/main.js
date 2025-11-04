// Outlook Newsletter Builder — main.js (clean, no ellipses)

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
  return String(str || "").replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c;
  });
}
function fileToDataURL(file) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(r.result); };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function normalizeUrl(u) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u.replace(/^\/+/, "");
}

// -----------------------------
// Adders
// -----------------------------
function addSection(type) {
  var def = schema[type];
  if (!def) {
    alert("Unknown section type: " + type);
    return;
  }
  state.sections.push({ type: type, data: JSON.parse(JSON.stringify(def.defaults)) });
  render();
}

document.querySelectorAll("[data-add]").forEach(function (btn) {
  btn.addEventListener("click", function () { addSection(btn.dataset.add); });
});

// -----------------------------
// Render list + preview
// -----------------------------
function render() {
  if (state.sections.length === 0) {
    listEl.innerHTML = '<div class="muted">Add sections to begin.</div>';
  } else {
    listEl.innerHTML = state.sections.map(function (s, i) {
      return (
        '<div class="card" data-idx="' + i + '">' +
          "<h3>" + (i + 1) + ". " + schema[s.type].label + "</h3>" +
          '<div class="mini-actions">' +
            '<button data-act="edit">Edit</button>' +
            '<button data-act="del" style="color:#ff6b6b;">Delete</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  document.querySelectorAll(".card").forEach(function (el) {
    var idx = parseInt(el.getAttribute("data-idx"), 10);
    el.querySelector('[data-act="edit"]').onclick = function () { openEditor(idx); };
    el.querySelector('[data-act="del"]').onclick = function () {
      state.sections.splice(idx, 1);
      render();
    };
  });

  renderPreview();
}

// -----------------------------
// Editor
// -----------------------------
function openEditor(idx) {
  var s = state.sections[idx];
  var ed = document.getElementById("editor");
  ed.classList.remove("hidden");
  currentEl.textContent = (idx + 1) + ". " + schema[s.type].label;

  document.querySelectorAll(".contextual").forEach(function (el) {
    el.classList.add("hidden");
  });

  if (["banner","spotlight","s5050","s5050flip","cards"].indexOf(s.type) > -1) {
    document.querySelector(".imgA-field").classList.remove("hidden");
  }
  if (["textonly","s5050","s5050flip","cards","spotlight"].indexOf(s.type) > -1) {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
  }
  if (s.type === "divider") {
    document.querySelector(".divider-field").classList.remove("hidden");
  }
  if (s.type === "spotlight") {
    document.querySelector(".eyebrow-field").classList.remove("hidden");
    document.querySelector(".bgcolor-row").classList.remove("hidden");
  }
  if (["s5050","s5050flip"].indexOf(s.type) > -1) {
    document.querySelector(".flip-row").classList.remove("hidden");
  }

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

  setTimeout(enableImageReplacement, 0);
}

async function applyChanges() {
  var labelText = currentEl.textContent || "";
  var m = labelText.match(/^(\d+)\./);
  var idx = m ? parseInt(m[1], 10) - 1 : -1;
  if (idx < 0 || !state.sections[idx]) return;

  var s = state.sections[idx];
  var title = document.getElementById("titleInput").value.trim();
  var body = document.getElementById("bodyInput").value.trim();
  var ctaText = document.getElementById("ctaText").value.trim();
  var ctaUrl  = document.getElementById("ctaUrl").value.trim();
  var label = document.getElementById("dividerText").value.trim();
  var eyebrow = document.getElementById("eyebrowInput").value.trim();
  var bg = document.getElementById("bgColor").value.trim();
  var fg = document.getElementById("fgColor").value.trim();
  var flip5050 = document.getElementById("flip5050").checked;

  if (ctaUrl) ctaUrl = normalizeUrl(ctaUrl);

  var finalImg = s.data.imgA;
  var fileInput = document.getElementById("imgAFile");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    finalImg = await fileToDataURL(fileInput.files[0]);
  } else {
    var imgUrl = document.getElementById("imgAUrl").value.trim();
    if (imgUrl) finalImg = imgUrl;
  }

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
    s.data.flipped = (s.type === "s5050flip") ? true : !!flip5050;
  } else if (s.type === "cards") {
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
    s.data.logo = title || s.data.logo;
    s.data.fourCs = body || s.data.fourCs;
  } else if (s.type === "feedback") {
    s.data.lead = title || s.data.lead;
    s.data.email = ctaUrl || s.data.email;
  }

  render();
}

document.getElementById("apply").addEventListener("click", applyChanges);

// Theme (accent only)
document.getElementById("applyTheme").addEventListener("click", function () {
  var hex = document.getElementById("accentColor").value.trim() || "#FBE232";
  state.theme.accent = hex;
  document.documentElement.style.setProperty("--accent", hex);
});

// -----------------------------
// Preview
// -----------------------------
function renderPreview() {
  previewEl.innerHTML = state.sections.map(function (s, i) { return toPreview(s, i); }).join("");
  document.documentElement.style.setProperty("--accent", state.theme.accent);
  enableImageReplacement();
}

function toPreview(s, i) {
  var html = "";
  switch (s.type) {
    case "banner":
      html =
        '<table><tr><td class="img-target" data-idx="' + i + '" data-key="imgA">' +
        '<img src="' + s.data.imgA + '" width="600" height="200" alt="' + escapeHtml(s.data.alt || "Banner") + '" style="width:100%;height:200px;">' +
        "</td></tr></table><div class=\"spacer32\"></div>";
      break;

    case "textonly":
      html =
        "<table><tr><td class=\"txt\">" +
        "<div class=\"title\" style=\"margin:10px 0;\">" + escapeHtml(s.data.title) + "</div>" +
        escapeHtml(s.data.body) +
        "<br><a href=\"" + escapeHtml(s.data.ctaUrl || "#") + "\" style=\"color:#007da3; display:inline-block; margin-top:10px;\">" + escapeHtml(s.data.ctaText || "") + "</a>" +
        "</td></tr></table><div class=\"spacer32\"></div>";
      break;

    case "divider":
      html =
        "<div class=\"divider\">" + escapeHtml(s.data.label) + "</div><div class=\"spacer32\"></div>";
      break;

    case "s5050":
    case "s5050flip": {
      var flipped = (s.type === "s5050flip") || !!s.data.flipped;

      var titleRow =
        '<tr><td colspan="2" class="txt">' +
          '<div class="title" style="margin:10px 0;">' + escapeHtml(s.data.title || "") + '</div>' +
        '</td></tr>';

      var imgLeft  =
        '<td style="width:285px; padding-right:30px; vertical-align:top;">' +
          '<img src="' + (s.data.imgA || "https://placehold.co/285x185/png") + '" width="285" height="185" alt="">' +
        '</td>';

      var imgRight =
        '<td style="width:285px; padding-right:0; vertical-align:top;" align="right">' +
          '<img src="' + (s.data.imgA || "https://placehold.co/285x185/png") + '" width="285" height="185" alt="">' +
        '</td>';

      var textCell =
        '<td class="txt" style="width:285px; vertical-align:top;">' +
          escapeHtml(s.data.body || "") +
          '<br><a href="' + escapeHtml(s.data.ctaUrl || "#") + '" style="color:#007da3; display:inline-block; margin-top:10px;">' +
            escapeHtml(s.data.ctaText || "") +
          '</a>' +
        '</td>';

      var row = flipped ? (textCell + imgRight) : (imgLeft + textCell);

      html =
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
          titleRow +
          '<tr>' + row + '</tr>' +
        '</table>' +
        '<div class="spacer32"></div>';
      break;
    }

    case "cards":
      html =
        "<table><tr>" +
          '<td style="width:285px; padding-right:30px; vertical-align:top;">' +
            '<img src="' + s.data.left.img + '" width="285" height="185" alt="">' +
            '<div class="txt">' +
              '<div class="title" style="margin:10px 0;">' + escapeHtml(s.data.left.title) + "</div>" +
              escapeHtml(s.data.left.body) +
              '<br><a href="' + escapeHtml(s.data.left.ctaUrl || "#") + '" style="color:#007da3; display:inline-block; margin-top:10px;">' + escapeHtml(s.data.left.ctaText || "") + "</a>" +
            "</div>" +
          "</td>" +
          '<td style="width:285px; vertical-align:top;">' +
            '<img src="' + s.data.right.img + '" width="285" height="185" alt="">' +
            '<div class="txt">' +
              '<div class="title" style="margin:10px 0;">' + escapeHtml(s.data.right.title) + "</div>" +
              escapeHtml(s.data.right.body) +
              '<br><a href="' + escapeHtml(s.data.right.ctaUrl || "#") + '" style="color:#007da3; display:inline-block; margin-top:10px;">' + escapeHtml(s.data.right.ctaText || "") + "</a>" +
            "</div>" +
          "</td>" +
        "</tr></table><div class=\"spacer32\"></div>";
      break;

    case "spotlight": {
      var bg = s.data.bg || "#fbe232";
      var text = s.data.textColor || "#000";
      var eyebrow = escapeHtml(s.data.eyebrow || "FEATURED");
      var title = escapeHtml(s.data.title || "[Spotlight Title]");
      var body  = escapeHtml(s.data.body  || "Brief supporting text.");
      var ctaT  = escapeHtml(s.data.ctaText || "Learn more →");
      var ctaU  = escapeHtml(s.data.ctaUrl  || "#");
      var img   = s.data.imgA || "https://placehold.co/180x237/cccccc/888888.png?text=180×237";

      html =
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + bg + '; color:' + text + ';">' +
          '<tr><td style="padding:40px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
              '<td class="img-target" data-key="imgA" data-idx="' + i + '" style="width:180px; padding-right:60px; vertical-align:top;">' +
                '<img src="' + img + '" width="180" height="237" alt="" style="display:block; width:180px; height:237px; border:0; outline:0;">' +
              '</td>' +
              '<td class="txt" style="vertical-align:top; color:' + text + ';">' +
                '<div style="text-transform:uppercase; font-size:13px; line-height:18px; margin:0 0 10px 0;">' + eyebrow + '</div>' +
                '<div class="title" style="color:' + text + '; margin:10px 0;">' + title + '</div>' +
                '<div style="font-size:14px; line-height:18px; color:' + text + '; margin:0;">' + body + '</div>' +
                '<div><a href="' + ctaU + '" style="color:#000; text-decoration:none; display:inline-block; margin-top:10px;">' + ctaT + '</a></div>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +
        '</table>' +
        '<div class="spacer32"></div>';
      break;
    }

    case "footer":
      html =
        '<div class="footer" style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">' +
          '<div style="font-size:14px; line-height:20px; margin-bottom:8px;"><strong>' + escapeHtml(s.data.logo || "[Logo]") + "</strong></div>" +
          '<div style="font-size:12px; line-height:18px;">' + escapeHtml(s.data.fourCs || "[4c's]") + "</div>" +
        "</div>";
      break;

    case "feedback":
      html =
        '<div class="feedback" style="text-align:center; padding:24px 0 32px; color:#333;">' +
          "<strong>" + escapeHtml(s.data.lead || "Questions? Ideas? Feedback?") + "</strong><br>" +
          'We’d love to hear it — please email <a href="mailto:' + escapeHtml(s.data.email || "name@email.com") + '" style="color:#007da3;">' + escapeHtml(s.data.email || "name@email.com") + "</a>" +
        "</div>";
      break;

    default:
      html = "";
  }
  return html;
}

// -----------------------------
// Image replacement (click or drop)
// -----------------------------
function enableImageReplacement() {
  document.querySelectorAll(".img-target").forEach(function (el) {
    el.onclick = async function () {
      var idx = parseInt(el.getAttribute("data-idx"), 10);
      var key = el.getAttribute("data-key") || "imgA";
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var dataUrl = await fileToDataURL(file);
        setImage(idx, key, dataUrl);
      };
      input.click();
    };
    el.ondragover = function (e) { e.preventDefault(); };
    el.ondrop = async function (e) {
      e.preventDefault();
      var file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      var dataUrl = await fileToDataURL(file);
      var idx = parseInt(el.getAttribute("data-idx"), 10);
      var key = el.getAttribute("data-key") || "imgA";
      setImage(idx, key, dataUrl);
    };
  });
}
function setImage(idx, key, dataUrl) {
  var s = state.sections[idx];
  if (!s) return;
  if (s.type === "cards") {
    if (key === "left.img") s.data.left.img = dataUrl;
    else if (key === "right.img") s.data.right.img = dataUrl;
    else s.data.left.img = dataUrl;
  } else {
    s.data[key] = dataUrl;
  }
  renderPreview();
}
// --- Outlook-safe section renderer for export only (fixed 600px, no margins) ---
function toOutlookHtmlSection(s, accent) {
  // Spacer row (use between sections)
  const spacer32 = '<tr><td height="32" style="height:32px; line-height:32px; font-size:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>';

  // util
  const esc = (t)=>String(t||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  let block = '';
  switch (s.type) {
    case 'banner': {
      const src = s.data.imgA || 'https://placehold.co/600x200/png';
      block =
        '<tr><td style="padding:0;">' +
          '<img src="' + esc(src) + '" width="600" height="200" alt="'+esc(s.data.alt||'Banner')+'" style="display:block; width:600px; height:200px; border:0; outline:0;">' +
        '</td></tr>' + spacer32;
      break;
    }

    case 'textonly': {
      const title = esc(s.data.title || '');
      const body  = esc(s.data.body  || '');
      const ctaT  = esc(s.data.ctaText || '');
      const ctaU  = esc(s.data.ctaUrl  || '#');

      block =
        '<tr><td style="padding:0 0 0 0;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
            // Title with 10px before/after via padding on its own row
            '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' + title + '</td></tr>' +
            // Body (no margins)
            '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' + body + '</td></tr>' +
            // CTA with 10px top padding
            (ctaT ? ('<tr><td style="padding:10px 0 0 0;"><a href="' + ctaU + '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' + ctaT + '</a></td></tr>') : '') +
          '</table>' +
        '</td></tr>' + spacer32;
      break;
    }

    case 'divider': {
      const label = esc(s.data.label || 'SECTION');
      block =
        '<tr><td style="padding:0;">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            '<tr><td style="background:' + esc(accent) + '; color:#000; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; text-transform:uppercase; font-weight:bold; padding:6px 10px;">' + label + '</td></tr>' +
          '</table>' +
        '</td></tr>' + spacer32;
      break;
    }

    case 's5050':
    case 's5050flip': {
      const flipped = (s.type === 's5050flip') || !!s.data.flipped;
      const img = esc(s.data.imgA || 'https://placehold.co/285x185/png');
      const title = esc(s.data.title || '');
      const body  = esc(s.data.body  || '');
      const ctaT  = esc(s.data.ctaText || '');
      const ctaU  = esc(s.data.ctaUrl  || '#');

      const imgLeft =
        '<td width="285" valign="top" style="padding-right:30px;">' +
          '<img src="' + img + '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;">' +
        '</td>';
      const imgRight =
        '<td width="285" valign="top" align="right" style="padding-right:0;">' +
          '<img src="' + img + '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;">' +
        '</td>';
      const textCell =
        '<td width="285" valign="top" style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' +
          // Body
          body +
          // CTA
          (ctaT ? ('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding-top:10px;"><a href="' + ctaU + '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' + ctaT + '</a></td></tr></table>') : '') +
        '</td>';

      const rowCols = flipped ? (textCell + imgRight) : (imgLeft + textCell);

      block =
        // Title row first (spanning both cols) with 10px top/bottom via padding
        '<tr><td style="padding:0;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
            '<tr><td colspan="2" style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' + title + '</td></tr>' +
            '<tr>' + rowCols + '</tr>' +
          '</table>' +
        '</td></tr>' + spacer32;
      break;
    }

    case 'cards': {
      const L = s.data.left  || {};
      const R = s.data.right || {};
      const lImg = esc(L.img || 'https://placehold.co/285x185/png');
      const rImg = esc(R.img || 'https://placehold.co/285x185/png');

      block =
        '<tr><td style="padding:0;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
            '<tr>' +
              // LEFT
              '<td width="285" valign="top" style="padding-right:30px;">' +
                '<img src="' + lImg + '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;">' +
                '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
                  // Title: 10px before/after via padding
                  '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' + esc(L.title || '') + '</td></tr>' +
                  // Body: no space above
                  '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' + esc(L.body || '') + '</td></tr>' +
                  // CTA: 10px top
                  (L.ctaText ? ('<tr><td style="padding-top:10px;"><a href="' + esc(L.ctaUrl || '#') + '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' + esc(L.ctaText) + '</a></td></tr>') : '') +
                '</table>' +
              '</td>' +
              // RIGHT
              '<td width="285" valign="top" style="padding:0;">' +
                '<img src="' + rImg + '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;">' +
                '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
                  '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' + esc(R.title || '') + '</td></tr>' +
                  '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' + esc(R.body || '') + '</td></tr>' +
                  (R.ctaText ? ('<tr><td style="padding-top:10px;"><a href="' + esc(R.ctaUrl || '#') + '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' + esc(R.ctaText) + '</a></td></tr>') : '') +
                '</table>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</td></tr>' + spacer32;
      break;
    }

    case 'spotlight': {
      const bg   = esc(s.data.bg || '#fbe232');
      const fg   = esc(s.data.textColor || '#000');
      const eye  = esc(s.data.eyebrow || 'FEATURED');
      const ttl  = esc(s.data.title || '[Spotlight Title]');
      const body = esc(s.data.body  || 'Brief supporting text.');
      const ctaT = esc(s.data.ctaText || 'Learn more →');
      const ctaU = esc(s.data.ctaUrl  || '#');
      const img  = esc(s.data.imgA || 'https://placehold.co/180x237/cccccc/888888.png?text=180×237');

      block =
        '<tr><td style="padding:0;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:' + bg + ';">' +
            '<tr><td style="padding:40px;">' +
              '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
                // thumb left
                '<td width="180" valign="top" style="padding-right:60px;">' +
                  '<img src="' + img + '" width="180" height="237" alt="" style="display:block; width:180px; height:237px; border:0;">' +
                '</td>' +
                // copy right
                '<td valign="top" style="padding:0; color:' + fg + ';">' +
                  '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
                    // eyebrow
                    '<tr><td style="padding:0 0 10px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; text-transform:uppercase; color:' + fg + ';">' + eye + '</td></tr>' +
                    // title 10px top/bottom
                    '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:' + fg + ';">' + ttl + '</td></tr>' +
                    // body
                    '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:' + fg + ';">' + body + '</td></tr>' +
                    // CTA (black)
                    (ctaT ? ('<tr><td style="padding-top:10px;"><a href="' + ctaU + '" style="color:#000; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' + ctaT + '</a></td></tr>') : '') +
                  '</table>' +
                '</td>' +
              '</tr></table>' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' + spacer32;
      break;
    }

    case 'footer': {
      const logo  = esc(s.data.logo  || '[Logo]');
      const fourC = esc(s.data.fourCs|| "[4c's]");
      block =
        '<tr><td style="padding:0;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
            '<tr><td align="center" style="background:#161616; color:#ffffff; padding:36px 16px; font-family:Arial, Helvetica, sans-serif;">' +
              '<div style="font-size:14px; line-height:20px; margin:0 0 8px 0;"><strong>' + logo + '</strong></div>' +
              '<div style="font-size:12px; line-height:18px; margin:0;">' + fourC + '</div>' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>';
      break;
    }

    case 'feedback': {
      const lead = esc(s.data.lead || 'Questions? Ideas? Feedback?');
      const mail = esc(s.data.email|| 'name@email.com');
      block =
        '<tr><td align="center" style="padding:24px 0 32px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#333;">' +
          '<strong>' + lead + '</strong><br>We’d love to hear it — please email <a href="mailto:' + mail + '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' + mail + '</a>' +
        '</td></tr>';
      break;
    }
  }
  return block;
}

// -----------------------------
// Export HTML (uses current preview markup)
// -----------------------------
// --- Export HTML (Outlook friendly, 600px fixed, border+padding, table spacers) ---
document.getElementById('exportHtml').addEventListener('click', function () {
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FBE232';

  // Build section rows using Outlook-safe renderer
  var rows = state.sections.map(function (s) {
    return toOutlookHtmlSection(s, accent);
  }).join('');

  // Full HTML: 600px table centered, 1px subtle border, 6px inner padding wrapper table
  var doc =
    '<!DOCTYPE html>' +
    '<html lang="en"><head>' +
      '<meta charset="utf-8">' +
      '<meta name="x-apple-disable-message-reformatting">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Newsletter</title>' +
      '<!--[if mso]><style>* { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->' +
    '</head>' +
    '<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">' +
      // outer full-width
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;"><tr><td align="center" style="padding:0;">' +

        // wrapper around the email: border + 6px inner padding
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; border:1px solid #e5e5e5; background:#ffffff;"><tr><td style="padding:6px;">' +

          // the actual email content table (fixed 600px)
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; border-collapse:collapse;">' +
            rows +
          '</table>' +

        '</td></tr></table>' +

      '</td></tr></table>' +
    '</body></html>';

  var blob = new Blob([doc], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'newsletter.html';
  a.click();
  URL.revokeObjectURL(url);
});


// Initial render
render();
