// main.js — builder logic + Outlook-safe export (restored)
import { SECTION_TYPES, defaultSection } from "./schema.js";

const list = document.getElementById("list");
const preview = document.getElementById("preview");
const currentSection = document.getElementById("currentSection");
const editor = document.getElementById("editor");
const applyBtn = document.getElementById("apply");

// Editor inputs (only used when visible)
const titleInput = document.getElementById("titleInput");
const eyebrowInput = document.getElementById("eyebrowInput");
const bodyInput = document.getElementById("bodyInput");
const ctaTextInput = document.getElementById("ctaText");
const ctaUrlInput = document.getElementById("ctaUrl");
const dividerTextInput = document.getElementById("dividerText");
const imgAFile = document.getElementById("imgAFile");
const imgAUrl = document.getElementById("imgAUrl");
const bgColorInput = document.getElementById("bgColor");
const fgColorInput = document.getElementById("fgColor");

let sections = [];
let currentIndex = -1;

// Add section buttons
document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.getAttribute("data-add");
    const newSection = defaultSection(type);
    sections.push(newSection);
    currentIndex = sections.length - 1;
    render();
    openEditor(currentIndex);
  });
});

// Drag + drop reorder (restored)
function enableDrag() {
  document.querySelectorAll(".card").forEach((el) => {
    el.draggable = true;
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", el.dataset.idx);
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      el.classList.add("drop-target");
    });
    el.addEventListener("dragleave", () => el.classList.remove("drop-target"));
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("drop-target");
      const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const to = parseInt(el.dataset.idx, 10);
      if (!Number.isNaN(from) && !Number.isNaN(to) && from !== to) {
        const moved = sections.splice(from, 1)[0];
        sections.splice(to, 0, moved);
        // keep the selected section in view if it moved
        currentIndex = to;
        render();
        if (currentIndex >= 0) openEditor(currentIndex);
      }
    });
  });
}

function render() {
  // List
  list.innerHTML = sections
    .map(
      (s, i) => `
      <div class="card" data-idx="${i}">
        <h3>${i + 1}. ${SECTION_TYPES[s.type]}</h3>
        <div class="mini-actions">
          <button data-act="select">Edit</button>
          <button data-act="delete" style="color:#ff6b6b;">Delete</button>
        </div>
      </div>`
    )
    .join("");

  // Bind card actions
  list.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (e) => {
      const idx = parseInt(card.dataset.idx, 10);
      if (e.target.matches("button[data-act='delete']")) {
        sections.splice(idx, 1);
        currentIndex = -1;
        render();
        editor.classList.add("hidden");
      } else {
        currentIndex = idx;
        openEditor(idx);
      }
    });
  });

  enableDrag();
  renderPreview();
}

// Utilities for images
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
async function getPickedImage() {
  if (imgAFile && imgAFile.files && imgAFile.files[0]) {
    try {
      return await fileToDataURL(imgAFile.files[0]);
    } catch (_) {}
  }
  const url = (imgAUrl && imgAUrl.value && imgAUrl.value.trim()) || "";
  return url || null;
}

// Open editor for a section
function openEditor(idx) {
  const s = sections[idx];
  currentSection.textContent = `${idx + 1}. ${SECTION_TYPES[s.type]}`;
  editor.classList.remove("hidden");

  // Clear previously injected toggles
  editor.querySelectorAll("#cardSelectWrap").forEach((n) => n.remove());

  // Hide all contextual groups
  document.querySelectorAll(".contextual").forEach((f) => f.classList.add("hidden"));

  // Populate fields per type
  if (s.type === "divider") {
    document.querySelector(".divider-field").classList.remove("hidden");
    dividerTextInput.value = s.data.label || "";
  } else if (s.type === "textonly") {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
    titleInput.value = s.data.title || "";
    bodyInput.value = s.data.body || "";
    ctaTextInput.value = s.data.ctaText || "";
    ctaUrlInput.value = s.data.ctaUrl || "";
  } else if (s.type === "s5050" || s.type === "s5050flip") {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
    document.querySelector(".imgA-field").classList.remove("hidden");
    titleInput.value = s.data.title || "";
    bodyInput.value = s.data.body || "";
    ctaTextInput.value = s.data.ctaText || "";
    ctaUrlInput.value = s.data.ctaUrl || "";
    imgAUrl.value = s.data.imgA || "";
  } else if (s.type === "cards") {
    // Show shared fields; inject a simple Card 1/2 toggle (restored)
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
    document.querySelector(".imgA-field").classList.remove("hidden");

    const wrap = document.createElement("div");
    wrap.id = "cardSelectWrap";
    wrap.className = "field";
    wrap.innerHTML = `
      <label>Edit Card</label>
      <select id="cardSelect">
        <option value="left">Card 1 (Left)</option>
        <option value="right">Card 2 (Right)</option>
      </select>`;
    editor.insertBefore(wrap, editor.firstChild);

    const active = s.data.activeCard || "left";
    const select = document.getElementById("cardSelect");
    select.value = active;
    select.onchange = () => {
      s.data.activeCard = select.value;
      // refresh values for the selected card
      const side = s.data[s.data.activeCard] || {};
      titleInput.value = side.title || "";
      bodyInput.value = side.body || "";
      ctaTextInput.value = side.ctaText || "";
      ctaUrlInput.value = side.ctaUrl || "";
      imgAUrl.value = side.img || "";
    };

    const side = s.data[active] || {};
    titleInput.value = side.title || "";
    bodyInput.value = side.body || "";
    ctaTextInput.value = side.ctaText || "";
    ctaUrlInput.value = side.ctaUrl || "";
    imgAUrl.value = side.img || "";
  } else if (s.type === "spotlight") {
    document.querySelector(".eyebrow-field").classList.remove("hidden");
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
    document.querySelector(".imgA-field").classList.remove("hidden");
    document.querySelector(".bgcolor-row").classList.remove("hidden");
    eyebrowInput.value = s.data.eyebrow || "";
    titleInput.value = s.data.title || "";
    bodyInput.value = s.data.body || "";
    ctaTextInput.value = s.data.ctaText || "";
    ctaUrlInput.value = s.data.ctaUrl || "";
    imgAUrl.value = s.data.imgA || "";
    bgColorInput.value = s.data.bgColor || "#fbe232";
    fgColorInput.value = s.data.fgColor || "#000000";
  } else if (s.type === "footer") {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    titleInput.value = s.data.logo || "";
    bodyInput.value = s.data.fourCs || "";
  } else if (s.type === "feedback") {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden"); // URL used for email
    titleInput.value = s.data.lead || "";
    bodyInput.value = s.data.body || "";
    ctaTextInput.value = ""; // not used here
    ctaUrlInput.value = s.data.email || "";
  } else if (s.type === "banner") {
    document.querySelector(".imgA-field").classList.remove("hidden");
    imgAUrl.value = s.data.src || "";
  }
}

// Apply changes
applyBtn.addEventListener("click", async () => {
  if (currentIndex < 0) return;
  const s = sections[currentIndex];

  const title = titleInput.value || "";
  const eyebrow = (eyebrowInput && eyebrowInput.value) || "";
  const body = bodyInput.value || "";
  const ctaText = ctaTextInput.value || "";
  const ctaUrl = ctaUrlInput.value || "";
  const dividerLabel = dividerTextInput.value || "";
  const bgColor = (bgColorInput && bgColorInput.value) || "";
  const fgColor = (fgColorInput && fgColorInput.value) || "";

  // Optional image selection (URL or file)
  const pickedImg = await getPickedImage();

  switch (s.type) {
    case "divider":
      s.data.label = dividerLabel || s.data.label || "";
      break;
    case "textonly":
      s.data.title = title;
      s.data.body = body;
      s.data.ctaText = ctaText;
      s.data.ctaUrl = ctaUrl;
      break;
    case "banner":
      if (pickedImg) s.data.src = pickedImg;
      break;
    case "s5050":
    case "s5050flip":
      s.data.title = title;
      s.data.body = body;
      s.data.ctaText = ctaText;
      s.data.ctaUrl = ctaUrl;
      if (pickedImg) s.data.imgA = pickedImg;
      break;
    case "cards": {
      const active = s.data.activeCard || "left";
      s.data[active] = s.data[active] || {};
      s.data[active].title = title;
      s.data[active].body = body;
      s.data[active].ctaText = ctaText;
      s.data[active].ctaUrl = ctaUrl;
      if (pickedImg) s.data[active].img = pickedImg;
      break;
    }
    case "spotlight":
      s.data.eyebrow = eyebrow;
      s.data.title = title;
      s.data.body = body;
      s.data.ctaText = ctaText;
      s.data.ctaUrl = ctaUrl;
      if (pickedImg) s.data.imgA = pickedImg;
      if (bgColor) s.data.bgColor = bgColor;
      if (fgColor) s.data.fgColor = fgColor;
      break;
    case "footer":
      s.data.logo = title;
      s.data.fourCs = body;
      break;
    case "feedback":
      s.data.lead = title;
      s.data.body = body;
      s.data.email = ctaUrl;
      break;
  }

  // clear file input so repeat uploads fire change
  if (imgAFile) imgAFile.value = "";
  render();
  openEditor(currentIndex);
});

// Basic preview (unchanged layout for speed)
function esc(t) {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function renderPreview() {
  preview.innerHTML = sections
    .map((s) => {
      if (s.type === "divider") {
        return `<div class="divider">${esc(s.data.label || "SECTION")}</div><div class="spacer32"></div>`;
      }
      if (s.type === "textonly") {
        return `<table><tr><td class="txt"><div class="title">${esc(s.data.title || "")}</div>${esc(
          s.data.body || ""
        )}<br><a href="${esc(s.data.ctaUrl || "#")}">${esc(s.data.ctaText || "")}</a></td></tr></table><div class="spacer32"></div>`;
      }
      if (s.type === "s5050" || s.type === "s5050flip") {
        const flipped = s.type === "s5050flip" || !!s.data.flipped;
        const img = `<td style="width:285px;${flipped ? "" : "padding-right:30px;"}"><img src="${esc(
          s.data.imgA
        )}" width="285" height="185"></td>`;
        const txt = `<td class="txt" style="width:285px;"><div class="title">${esc(
          s.data.title || ""
        )}</div>${esc(s.data.body || "")}<br><a href="${esc(s.data.ctaUrl || "#")}">${esc(
          s.data.ctaText || ""
        )}</a></td>`;
        return `<table><tr>${flipped ? txt + img : img + txt}</tr></table><div class="spacer32"></div>`;
      }
      if (s.type === "cards") {
        const L = s.data.left || {};
        const R = s.data.right || {};
        return `<table><tr>
          <td style="width:285px; padding-right:30px;">
            <img src="${esc(L.img)}" width="285" height="185">
            <div class="txt"><div class="title" style="margin:10px 0;">${esc(L.title || "")}</div>${esc(
              L.body || ""
            )}<br><a href="${esc(L.ctaUrl || "#")}">${esc(L.ctaText || "")}</a></div>
          </td>
          <td style="width:285px;">
            <img src="${esc(R.img)}" width="285" height="185">
            <div class="txt"><div class="title" style="margin:10px 0;">${esc(R.title || "")}</div>${esc(
              R.body || ""
            )}<br><a href="${esc(R.ctaUrl || "#")}">${esc(R.ctaText || "")}</a></div>
          </td>
        </tr></table><div class="spacer32"></div>`;
      }
      if (s.type === "spotlight") {
        return `<div style="background:${esc(s.data.bgColor)}; color:${esc(s.data.fgColor)}; padding:24px;">
          <table><tr>
            <td style="width:180px; vertical-align:top;"><img src="${esc(s.data.imgA)}" width="180" height="237"></td>
            <td style="padding-left:60px; vertical-align:top;">
              <div style="font-size:12px; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">${esc(
                s.data.eyebrow || "FEATURED"
              )}</div>
              <div class="title" style="margin:10px 0;">${esc(s.data.title || "")}</div>
              <div class="txt">${esc(s.data.body || "")}</div>
              <div style="padding-top:10px;"><a href="${esc(s.data.ctaUrl || "#")}" style="color:#000; font-weight:bold;">${esc(
                s.data.ctaText || "Learn more →"
              )}</a></div>
            </td>
          </tr></table>
        </div><div class="spacer32"></div>`;
      }
      if (s.type === "banner") {
        return `<table><tr><td><img src="${esc(s.data.src)}" width="600" height="200"></td></tr></table><div class="spacer32"></div>`;
      }
      if (s.type === "footer") {
        return `<table><tr><td style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">
          <div style="font-size:14px; line-height:20px; margin-bottom:8px;"><strong>${esc(s.data.logo || "[Logo]")}</strong></div>
          <div style="font-size:12px; line-height:18px;">${esc(s.data.fourCs || "[4c's]")}</div>
        </td></tr></table>`;
      }
      if (s.type === "feedback") {
        return `<div style="text-align:center; font-size:13px; line-height:20px; padding:24px 0 32px 0;">
          <strong>${esc(s.data.lead || "Questions? Ideas? Feedback?")}</strong><br>
          We’d love to hear it — please email <a href="mailto:${esc(s.data.email || "name@email.com")}">${esc(
          s.data.email || "name@email.com"
        )}</a>
        </div>`;
      }
      return "";
    })
    .join("");
}

// ------------------- OUTLOOK-SAFE EXPORT (restored) -------------------
function toOutlookHtmlSection(s, accent) {
  const spacer32 =
    '<tr><td height="32" style="height:32px; line-height:32px; font-size:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>';
  const escHTML = (t) =>
    String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  let block = "";
  switch (s.type) {
    case "banner": {
      const src = s.data.src || "https://placehold.co/600x200/png";
      block =
        '<tr><td style="padding:0;">' +
        '<img src="' +
        escHTML(src) +
        '" width="600" height="200" alt="' +
        escHTML(s.data.alt || "Banner") +
        '" style="display:block; width:600px; height:200px; border:0; outline:0;">' +
        "</td></tr>" +
        spacer32;
      break;
    }
    case "divider": {
      const label = escHTML(s.data.label || "SECTION");
      block =
        '<tr><td style="padding:0;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="background:' +
        escHTML(accent) +
        "; color:#000; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; text-transform:uppercase; font-weight:bold; padding:6px 10px;\">" +
        label +
        "</td></tr></table>" +
        "</td></tr>" +
        spacer32;
      break;
    }
    case "textonly": {
      const title = escHTML(s.data.title || "");
      const body = escHTML(s.data.body || "");
      const ctaT = escHTML(s.data.ctaText || "");
      const ctaU = escHTML(s.data.ctaUrl || "#");
      block =
        '<tr><td style="padding:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' +
        title +
        "</td></tr>" +
        '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' +
        body +
        "</td></tr>" +
        (ctaT
          ? '<tr><td style="padding-top:10px;"><a href="' +
            ctaU +
            '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' +
            ctaT +
            "</a></td></tr>"
          : "") +
        "</table>" +
        "</td></tr>" +
        spacer32;
      break;
    }
    case "s5050":
    case "s5050flip": {
      const flipped = s.type === "s5050flip" || !!s.data.flipped;
      const img = escHTML(s.data.imgA || "https://placehold.co/285x185/png");
      const title = escHTML(s.data.title || "");
      const body = escHTML(s.data.body || "");
      const ctaT = escHTML(s.data.ctaText || "");
      const ctaU = escHTML(s.data.ctaUrl || "#");

      const imgLeft =
        '<td width="285" valign="top" style="padding-right:30px;"><img src="' +
        img +
        '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;"></td>';
      const imgRight =
        '<td width="285" valign="top" align="right" style="padding-right:0;"><img src="' +
        img +
        '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;"></td>';
      const textCell =
        '<td width="285" valign="top" style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' +
        body +
        (ctaT
          ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding-top:10px;"><a href="' +
            ctaU +
            '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' +
            ctaT +
            "</a></td></tr></table>"
          : "") +
        "</td>";

      const rowCols = flipped ? textCell + imgRight : imgLeft + textCell;

      block =
        '<tr><td style="padding:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr><td colspan="2" style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' +
        title +
        "</td></tr>" +
        "<tr>" +
        rowCols +
        "</tr>" +
        "</table>" +
        "</td></tr>" +
        spacer32;
      break;
    }
    case "cards": {
      const L = s.data.left || {};
      const R = s.data.right || {};
      const lImg = escHTML(L.img || "https://placehold.co/285x185/png");
      const rImg = escHTML(R.img || "https://placehold.co/285x185/png");

      block =
        '<tr><td style="padding:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
        // LEFT
        '<td width="285" valign="top" style="padding-right:30px;">' +
        '<img src="' +
        lImg +
        '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' +
        escHTML(L.title || "") +
        "</td></tr>" +
        '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' +
        escHTML(L.body || "") +
        "</td></tr>" +
        (L.ctaText
          ? '<tr><td style="padding-top:10px;"><a href="' +
            escHTML(L.ctaUrl || "#") +
            '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' +
            escHTML(L.ctaText) +
            "</a></td></tr>"
          : "") +
        "</table>" +
        "</td>" +
        // RIGHT
        '<td width="285" valign="top" style="padding:0;">' +
        '<img src="' +
        rImg +
        '" width="285" height="185" alt="" style="display:block; width:285px; height:185px; border:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:#111;">' +
        escHTML(R.title || "") +
        "</td></tr>" +
        '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:#333;">' +
        escHTML(R.body || "") +
        "</td></tr>" +
        (R.ctaText
          ? '<tr><td style="padding-top:10px;"><a href="' +
            escHTML(R.ctaUrl || "#") +
            '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' +
            escHTML(R.ctaText) +
            "</a></td></tr>"
          : "") +
        "</table>" +
        "</td>" +
        "</tr></table>" +
        "</td></tr>" +
        spacer32;
      break;
    }
    case "spotlight": {
      const bg = escHTML(s.data.bgColor || "#fbe232");
      const fg = escHTML(s.data.fgColor || "#000");
      const eye = escHTML(s.data.eyebrow || "FEATURED");
      const ttl = escHTML(s.data.title || "[Spotlight Title]");
      const body = escHTML(s.data.body || "Brief supporting text.");
      const ctaT = escHTML(s.data.ctaText || "Learn more →");
      const ctaU = escHTML(s.data.ctaUrl || "#");
      const img = escHTML(s.data.imgA || "https://placehold.co/180x237/png");

      block =
        '<tr><td style="padding:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:' +
        bg +
        ';">' +
        '<tr><td style="padding:40px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
        '<td width="180" valign="top" style="padding-right:60px;"><img src="' +
        img +
        '" width="180" height="237" alt="" style="display:block; width:180px; height:237px; border:0;"></td>' +
        '<td valign="top" style="padding:0; color:' +
        fg +
        ';">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr><td style="padding:0 0 10px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; text-transform:uppercase; color:' +
        fg +
        ';">' +
        eye +
        "</td></tr>" +
        '<tr><td style="padding:10px 0; font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:20px; font-weight:bold; color:' +
        fg +
        ';">' +
        ttl +
        "</td></tr>" +
        '<tr><td style="padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; color:' +
        fg +
        ';">' +
        body +
        "</td></tr>" +
        (ctaT
          ? '<tr><td style="padding-top:10px;"><a href="' +
            ctaU +
            '" style="color:#000; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' +
            ctaT +
            "</a></td></tr>"
          : "") +
        "</table>" +
        "</td></tr></table>" +
        "</td></tr></table>" +
        "</td></tr>" +
        spacer32;
      break;
    }
    case "footer": {
      const logo = escHTML(s.data.logo || "[Logo]");
      const fourC = escHTML(s.data.fourCs || "[4c's]");
      block =
        '<tr><td style="padding:0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
        '<td align="center" style="background:#161616; color:#ffffff; padding:36px 16px; font-family:Arial, Helvetica, sans-serif;">' +
        '<div style="font-size:14px; line-height:20px; margin:0 0 8px 0;"><strong>' +
        logo +
        "</strong></div>" +
        '<div style="font-size:12px; line-height:18px; margin:0;">' +
        fourC +
        "</div>" +
        "</td></tr></table>" +
        "</td></tr>";
      break;
    }
    case "feedback": {
      const lead = escHTML(s.data.lead || "Questions? Ideas? Feedback?");
      const mail = escHTML(s.data.email || "name@email.com");
      block =
        '<tr><td align="center" style="padding:24px 0 32px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#333;">' +
        "<strong>" +
        lead +
        "</strong><br>We’d love to hear it — please email <a href=\"mailto:" +
        mail +
        '" style="color:#007da3; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">' +
        mail +
        "</a></td></tr>";
      break;
    }
  }
  return block;
}

// Export HTML (600px fixed, border + 6px padding, Outlook-safe spacing)
document.getElementById("exportHtml").addEventListener("click", function () {
  const cs = getComputedStyle(document.documentElement);
  const accent = (cs.getPropertyValue("--accent") || "#FBE232").trim();

  const rows = sections.map((s) => toOutlookHtmlSection(s, accent)).join("");

  const doc =
    "<!DOCTYPE html>" +
    '<html lang="en"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="x-apple-disable-message-reformatting">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>Newsletter</title>" +
    "<!--[if mso]><style>*{font-family:Arial, Helvetica, sans-serif !important;}</style><![endif]-->" +
    "</head>" +
    '<body style="margin:0; padding:0; background:#ffffff;">' +
    // full width center
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;"><tr><td align="center" style="padding:0;">' +
    // border wrapper + 6px padding
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; border:1px solid #e5e5e5; background:#ffffff;"><tr><td style="padding:6px;">' +
    // actual email body (fixed 600px)
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; border-collapse:collapse;">' +
    rows +
    "</table>" +
    "</td></tr></table>" +
    "</td></tr></table>" +
    "</body></html>";

  const blob = new Blob([doc], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter.html";
  a.click();
  URL.revokeObjectURL(url);
});
