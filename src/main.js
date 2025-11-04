// Outlook Newsletter Builder — main.js

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
    s.data.flipped = !!flip5050;
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
        "<div class=\"title\">" + escapeHtml(s.data.title) + "</div>" +
        escapeHtml(s.data.body) +
        "<br><a href=\"" + escapeHtml(s.data.ctaUrl || "#") + "\" style=\"color:#007da3;\">" + escapeHtml(s.data.ctaText || "") + "</a>" +
        "</td></tr></table><div class=\"spacer32\"></div>";
      break;

    case "divider":
      html =
        "<div class=\"divider\">" + escapeHtml(s.data.label) + "</div><div class=\"spacer32\"></div>";
      break;

    case "s5050":
    case "s5050flip": {
      const flipped = (s.type === "s5050flip") || !!s.data.flipped;

      const titleRow =
        '<tr><td colspan="2" class="txt">' +
          '<div class="title" style="margin:10px 0;">' + escapeHtml(s.data.title || "") + '</div>' +
        '</td></tr>';

      // image cells
      const imgLeft  =
        '<td style="width:285px; padding-right:30px; vertical-align:top;">' +
          '<img src="' + (s.data.imgA || "https://placehold.co/285x185/png") + '" width="285" height="185" alt="">' +
        '</td>';

      // flush to right edge when the image is on the right
      const imgRight =
        '<td style="width:285px; padding-right:0; vertical-align:top;" align="right">' +
          '<img src="' + (s.data.imgA || "https://placehold.co/285x185/png") + '" width="285" height="185" alt="">' +
        '</td>';

      const textCell =
        '<td class="txt" style="width:285px; vertical-align:top;">' +
          // body + CTA (CTA has 10px top)
          escapeHtml(s.data.body || "") +
          '<br><a href="' + escapeHtml(s.data.ctaUrl || "#") + '" style="color:#007da3; display:inline-block; margin-top:10px;">' +
            escapeHtml(s.data.ctaText || "") +
          '</a>' +
        '</td>';

      const row = flipped ? (textCell + imgRight) : (imgLeft + textCell);

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
          '<td style="width:285px; padding-right:30px;">' +
            '<img src="' + s.data.left.img + '" width="285" height="185" alt="">' +
            '<div class="txt">' +
              '<div class="title">' + escapeHtml(s.data.left.title) + "</div>" +
              escapeHtml(s.data.left.body) +
              '<br><a href="' + escapeHtml(s.data.left.ctaUrl || "#") + '" style="color:#007da3;">' + escapeHtml(s.data.left.ctaText || "") + "</a>" +
            "</div>" +
          "</td>" +
          '<td style="width:285px;">' +
            '<img src="' + s.data.right.img + '" width="285" height="185" alt="">' +
            '<div class="txt">' +
              '<div class="title">' + escapeHtml(s.data.right.title) + "</div>" +
              escapeHtml(s.data.right.body) +
              '<br><a href="' + escapeHtml(s.data.right.ctaUrl || "#") + '" style="color:#007da3;">' + escapeHtml(s.data.right.ctaText || "") + "</a>" +
            "</div>" +
          "</td>" +
        "</tr></table><div class=\"spacer32\"></div>";
      break;

    case "spotlight":
      // Full-width yellow background, black text, left thumb 180x237, text on the right
      html =
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbe232; color:#000;">' +
          '<tr><td style="padding:24px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
              '<td style="width:180px; padding-right:30px;" class="img-target" data-key="imgA" data-idx="' + i + '">' +
                '<img src="' + (s.data.imgA || "https://placehold.co/180x237/png") + '" width="180" height="237" alt="">' +
              '</td>' +
              '<td class="txt" style="color:#000;">' +
                '<div style="text-transform:uppercase; font-size:13px; margin-bottom:6px;">' + escapeHtml(s.data.eyebrow || "") + "</div>" +
                '<div class="title" style="color:#000;">' + escapeHtml(s.data.title || "") + "</div>" +
                '<span style="color:#000;">' + escapeHtml(s.data.body || "") + "</span>" +
                '<br><a href="' + escapeHtml(s.data.ctaUrl || "#") + '" style="color:#000;">' + escapeHtml(s.data.ctaText || "") + "</a>" +
              "</td>" +
            "</tr></table>" +
          "</td></tr>'" +
        "</table><div class=\"spacer32\"></div>";
      break;

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

// -----------------------------
// Export HTML (uses current preview markup)
// -----------------------------
document.getElementById("exportHtml").addEventListener("click", function () {
  var rows = previewEl.innerHTML;
  var accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#FBE232";
  var doc = '<!DOCTYPE html><html lang="en"><head>' +
    ...
    "<style>" +
    "body{margin:0;padding:0;background:#ffffff;font-family:Arial, Helvetica, sans-serif;}" + /* enforce Arial base */
    ".email{width:600px;margin:0 auto;background:#ffffff;}" +
    ".txt{font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#333;}" +
    ".title{font-size:18px;line-height:20px;font-weight:bold;margin:10px 0;color:#111;font-family:Arial, Helvetica, sans-serif;}" +
    ".divider{background:" + accent + ";color:#000;font-weight:bold;text-transform:uppercase;font-size:13px;padding:6px 10px;font-family:Arial, Helvetica, sans-serif;}" + /* fix Times fallback */
    ".spacer32{height:32px;line-height:0;font-size:0;display:block;}" + /* guarantees space between sections */
    "a{color:#007da3;text-decoration:none;font-family:Arial, Helvetica, sans-serif;}" +
    "</style></head><body><div class=\"email\">" + rows + "</div></body></html>";


  var blob = new Blob([doc], { type: "text/html" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "newsletter.html";
  a.click();
  URL.revokeObjectURL(url);
});

// Initial render
render();
