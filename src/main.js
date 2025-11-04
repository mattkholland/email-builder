// --------------------
// Outlook Newsletter Builder - main.js (clean recompile)
// --------------------

const state = {
  sections: [],
  theme: {
    accent: "#FBE232",
    maxw: 600
  }
};

const listEl = document.getElementById("list");
const previewEl = document.getElementById("preview");
const currentEl = document.getElementById("currentSection");

// ---------------------------------------------------
// SECTION ADDER
// ---------------------------------------------------
function addSection(type) {
  const schemaItem = schema[type];
  if (!schemaItem) return alert(`Unknown section type: ${type}`);
  const newSection = JSON.parse(JSON.stringify(schemaItem.defaults));
  state.sections.push({ type, data: newSection });
  render();
}

// Button actions
document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => addSection(btn.dataset.add));
});

// ---------------------------------------------------
// RENDER SECTION LIST + PREVIEW
// ---------------------------------------------------
function render() {
  listEl.innerHTML =
    state.sections
      .map(
        (s, i) => `
    <div class="card" data-idx="${i}">
      <h3>${i + 1}. ${schema[s.type].label}</h3>
      <div class="mini-actions">
        <button data-act="edit">Edit</button>
        <button data-act="del" style="color:#ff6b6b;">Delete</button>
      </div>
    </div>`
      )
      .join("") || '<div class="muted">Add sections to begin.</div>';

  // Click handlers
  document.querySelectorAll(".card").forEach((el) => {
    const idx = parseInt(el.dataset.idx, 10);
    el.querySelector('[data-act="edit"]').onclick = () => openEditor(idx);
    el.querySelector('[data-act="del"]').onclick = () => {
      state.sections.splice(idx, 1);
      render();
    };
  });

  renderPreview();
}

// ---------------------------------------------------
// OPEN EDITOR
// ---------------------------------------------------
function openEditor(idx) {
  const s = state.sections[idx];
  const ed = document.getElementById("editor");
  ed.classList.remove("hidden");
  currentEl.textContent = `${idx + 1}. ${schema[s.type].label}`;

  // Hide all contextual
  document.querySelectorAll(".contextual").forEach((el) => el.classList.add("hidden"));

  // Show relevant fields
  if (["banner", "spotlight", "s5050", "s5050flip", "cards"].includes(s.type)) {
    document.querySelector(".imgA-field").classList.remove("hidden");
  }
  if (["textonly", "s5050", "s5050flip", "cards", "spotlight"].includes(s.type)) {
    document.querySelector(".title-field").classList.remove("hidden");
    document.querySelector(".body-field").classList.remove("hidden");
    document.querySelector(".cta-row").classList.remove("hidden");
  }
  if (s.type === "divider") document.querySelector(".divider-field").classList.remove("hidden");
  if (s.type === "spotlight") {
    document.querySelector(".eyebrow-field").classList.remove("hidden");
    document.querySelector(".bgcolor-row").classList.remove("hidden");
  }
  if (["s5050", "s5050flip"].includes(s.type)) {
    document.querySelector(".flip-row").classList.remove("hidden");
  }

  // Populate
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
}

// ---------------------------------------------------
// APPLY CHANGES
// ---------------------------------------------------
document.getElementById("apply").addEventListener("click", async () => {
  const idx = parseInt(currentEl.textContent) - 1;
  if (idx < 0 || !state.sections[idx]) return;
  const s = state.sections[idx];

  const title = document.getElementById("titleInput").value.trim();
  const body = document.getElementById("bodyInput").value.trim();
  const ctaText = document.getElementById("ctaText").value.trim();
  const ctaUrl = document.getElementById("ctaUrl").value.trim();
  const label = document.getElementById("dividerText").value.trim();
  const eyebrow = document.getElementById("eyebrowInput").value.trim();
  const bg = document.getElementById("bgColor").value.trim();
  const fg = document.getElementById("fgColor").value.trim();
  const flip5050 = document.getElementById("flip5050").checked;

  async function readFile(id) {
    const input = document.getElementById(id);
    if (input && input.files && input.files[0]) {
      return await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(input.files[0]);
      });
    }
    return null;
  }

  const imgUpload = await readFile("imgAFile");
  const imgUrl = document.getElementById("imgAUrl").value.trim();
  const finalImg = imgUpload || imgUrl || s.data.imgA;

  // Save based on type
  Object.assign(s.data, {
    title,
    body,
    ctaText,
    ctaUrl,
    label,
    eyebrow,
    bg,
    textColor: fg,
    flipped: flip5050,
    imgA: finalImg
  });

  render();
});

// ---------------------------------------------------
// RENDER PREVIEW
// ---------------------------------------------------
function renderPreview() {
  previewEl.innerHTML = state.sections.map((s, i) => toPreview(s, i)).join("");
}

// ---------------------------------------------------
// PREVIEW MARKUP
// ---------------------------------------------------
function toPreview(s, i) {
  switch (s.type) {
    case "banner":
      return `<table><tr><td class="img-target" data-idx="${i}" data-key="imgA"><img src="${s.data.imgA}" width="600" height="200" style="display:block;width:100%;height:200px;" /></td></tr></table><div class="spacer32"></div>`;

    case "textonly":
      return `<table><tr><td class="txt"><div class="title" style="margin:10px 0;">${s.data.title}</div>${s.data.body}<br><a href="${s.data.ctaUrl}" style="color:#007da3;">${s.data.ctaText}</a></td></tr></table><div class="spacer32"></div>`;

    case "divider":
      return `<div class="divider">${s.data.label}</div><div class="spacer32"></div>`;

    case "s5050":
    case "s5050flip": {
      const flipped = !!s.data.flipped;
      const imgCell = `<td style="width:285px; padding-right:30px;"><img src="${s.data.imgA}" width="285" height="185"></td>`;
      const txtCell = `<td class="txt" style="width:285px;"><div class="title" style="margin:10px 0;">${s.data.title}</div>${s.data.body}<br><a href="${s.data.ctaUrl}" style="color:#007da3;">${s.data.ctaText}</a></td>`;
      return `<table><tr>${flipped ? txtCell + imgCell : imgCell + txtCell}</tr></table><div class="spacer32"></div>`;
    }

    case "cards":
      return `<table><tr>
        <td style="width:285px; padding-right:30px;">
          <img src="${s.data.left.img}" width="285" height="185">
          <div class="txt"><div class="title" style="margin:10px 0;">${s.data.left.title}</div>${s.data.left.body}<br><a href="${s.data.left.ctaUrl}" style="color:#007da3;">${s.data.left.ctaText}</a></div>
        </td>
        <td style="width:285px;">
          <img src="${s.data.right.img}" width="285" height="185">
          <div class="txt"><div class="title" style="margin:10px 0;">${s.data.right.title}</div>${s.data.right.body}<br><a href="${s.data.right.ctaUrl}" style="color:#007da3;">${s.data.right.ctaText}</a></div>
        </td>
      </tr></table><div class="spacer32"></div>`;

    case "spotlight":
      return `<table><tr>
        <td style="width:180px; padding-right:30px;" class="img-target" data-key="imgA" data-idx="${i}">
          <img src="${s.data.imgA}" width="180" height="237" alt="">
        </td>
        <td class="txt" style="background:${s.data.bg}; color:${s.data.textColor}; padding:20px;">
          <div style="text-transform:uppercase; font-size:13px; margin-bottom:6px;">${s.data.eyebrow}</div>
          <div class="title" style="margin:10px 0;">${s.data.title}</div>
          ${s.data.body}
          <br><a href="${s.data.ctaUrl}" style="color:#000;">${s.data.ctaText}</a>
        </td>
      </tr></table><div class="spacer32"></div>`;

    case "footer":
      return `<div class="footer" style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">[Logo]<br>[4C's]</div>`;

    case "feedback":
      return `<div class="feedback" style="text-align:center; padding:24px 0 32px; color:#333;"><strong>Questions? Ideas? Feedback?</strong><br>We’d love to hear it — please email <a href="mailto:name@email.com" style="color:#007da3;">name@email.com</a></div>`;
  }
  return "";
}

// ---------------------------------------------------
// EXPORT HTML
// ---------------------------------------------------
document.getElementById("exportHtml").addEventListener("click", () => {
  const html = previewEl.innerHTML;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter.html";
  a.click();
  URL.revokeObjectURL(url);
});
