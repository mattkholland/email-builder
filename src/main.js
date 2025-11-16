document.addEventListener("DOMContentLoaded", () => {
  const addButtons = document.querySelectorAll(".actions [data-type]");
  const exportBtn = document.getElementById("exportHtml");

  const listEl = document.getElementById("list");
  const previewEl = document.getElementById("preview");

  const currentSectionLabel = document.getElementById("currentSection");
  const editorForm = document.getElementById("editor");
  const applyBtn = document.getElementById("apply");

  // Editor inputs
  const imageFileInput = document.getElementById("imageFile");
  const imageUrlInput = document.getElementById("imageUrl");
  const eyebrowInput = document.getElementById("eyebrowInput");
  const titleInput = document.getElementById("titleInput");
  const bodyInput = document.getElementById("bodyInput");
  const ctaTextInput = document.getElementById("ctaTextInput");
  const ctaUrlInput = document.getElementById("ctaUrlInput");
  const dividerTitleInput = document.getElementById("dividerTitleInput");
  const dividerBgColorInput = document.getElementById("dividerBgColorInput");
  const spotlightBgColorInput = document.getElementById("spotlightBgColorInput");
  const flip5050Input = document.getElementById("flip5050");
  const cardSideInputs = document.querySelectorAll('input[name="cardSide"]');

  let sections = [];
  let selectedId = null;
  let nextId = 1;

  // ---------- helpers: data ----------

  function createSection(type, options = {}) {
    const id = nextId++;
    let data = {};

    switch (type) {
      case "banner":
        data = { imageUrl: "" };
        break;
      case "text":
        data = { title: "", body: "", ctaText: "", ctaUrl: "" };
        break;
      case "divider":
        data = { title: "", bgColor: "#FBE232" };
        break;
      case "fifty":
        data = {
          imageUrl: "",
          title: "",
          body: "",
          ctaText: "",
          ctaUrl: "",
          flipped: options.flipped === true
        };
        break;
      case "cards":
        data = {
          left: { imageUrl: "", title: "", body: "", ctaText: "", ctaUrl: "" },
          right: { imageUrl: "", title: "", body: "", ctaText: "", ctaUrl: "" }
        };
        break;
      case "spotlight":
        data = {
          eyebrow: "",
          imageUrl: "",
          title: "",
          body: "",
          ctaText: "",
          ctaUrl: "",
          bgColor: "#FBE232"
        };
        break;
      case "feedback":
        data = { title: "", body: "", ctaText: "", ctaUrl: "" };
        break;
      case "footer":
        data = {};
        break;
      default:
        data = {};
    }

    return { id, type, data };
  }

  function getSectionLabel(section) {
    switch (section.type) {
      case "banner": return "Banner";
      case "text": return "Text-only";
      case "divider": return "Divider";
      case "fifty": return "50/50";
      case "cards": return "Two Cards";
      case "spotlight": return "Spotlight";
      case "feedback": return "Feedback";
      case "footer": return "Footer";
      default: return "Section";
    }
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2br(str) {
    return escapeHtml(str).replace(/\n/g, "<br>");
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getSelectedSection() {
    return sections.find(s => s.id === selectedId) || null;
  }

  // ---------- rendering: email HTML ----------

  function buildCardColumn(cardData) {
    const img = escapeHtml(cardData.imageUrl || "");
    const title = escapeHtml(cardData.title || "");
    const body = nl2br(cardData.body || "");
    const ctaText = escapeHtml(cardData.ctaText || "");
    const ctaUrl = escapeHtml(cardData.ctaUrl || "");

    let html = "";
    html += '<td width="50%" valign="top" style="padding:0 8px;">';
    html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">';

    if (img) {
      html += '<tr><td style="padding:0 0 8px;">';
      html += '<img src="' + img + '" alt="" style="display:block;width:100%;height:auto;border:0;" />';
      html += '</td></tr>';
    }
    if (title) {
      html += '<tr><td style="padding:0 0 4px;">';
      html += '<h3 style="margin:0;font-size:15px;font-weight:bold;color:#111111;">' + title + '</h3>';
      html += '</td></tr>';
    }
    if (body) {
      html += '<tr><td style="padding:0 0 4px;">';
      html += '<p style="margin:0;font-size:13px;line-height:1.5;color:#444444;">' + body + '</p>';
      html += '</td></tr>';
    }
    if (ctaText && ctaUrl) {
      html += '<tr><td style="padding:4px 0 0;">';
      html += '<a href="' + ctaUrl + '" style="font-size:13px;color:#007da3;text-decoration:underline;">' + ctaText + '</a>';
      html += '</td></tr>';
    }

    html += '</table></td>';
    return html;
  }

  function buildSectionHtml(section) {
    const d = section.data || {};
    let html = "";

    if (section.type === "banner") {
      const src = escapeHtml(d.imageUrl || "");
      if (!src) return "";
      html += '<tr><td align="center" style="padding:0;">';
      html += '<img src="' + src + '" width="600" style="display:block;width:600px;max-width:100%;height:auto;border:0;line-height:0;" alt="" />';
      html += '</td></tr>';
    }

    else if (section.type === "text") {
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");

      html += '<tr><td style="padding:24px 24px 8px;">';
      if (title) {
        html += '<h2 style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111111;">' + title + '</h2>';
      }
      if (body) {
        html += '<p style="margin:0;font-size:14px;line-height:1.5;color:#444444;">' + body + '</p>';
      }
      html += '</td></tr>';

      if (ctaText && ctaUrl) {
        html += '<tr><td style="padding:0 24px 24px;">';
        html += '<a href="' + ctaUrl + '" style="display:inline-block;padding:10px 18px;margin-top:8px;font-size:14px;color:#ffffff;background-color:#007da3;text-decoration:none;border-radius:3px;">' + ctaText + '</a>';
        html += '</td></tr>';
      }
    }

    else if (section.type === "divider") {
      const title = escapeHtml(d.title || "");
      const bg = escapeHtml(d.bgColor || "#FBE232");
      html += '<tr><td style="padding:0;">';
      html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">';
      html += '<tr><td style="padding:10px 24px;background-color:' + bg + ';text-align:left;">';
      html += '<span style="font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#111111;">' + title + '</span>';
      html += '</td></tr></table></td></tr>';
    }

    else if (section.type === "fifty") {
      const img = escapeHtml(d.imageUrl || "");
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");
      const flipped = !!d.flipped;

      let imgTd = '<td width="50%" valign="top" style="padding:16px 12px;">';
      if (img) {
        imgTd += '<img src="' + img + '" alt="" style="display:block;width:100%;height:auto;border:0;" />';
      }
      imgTd += '</td>';

      let textTd = '<td width="50%" valign="top" style="padding:16px 12px;">';
      if (title) {
        textTd += '<h2 style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111111;">' + title + '</h2>';
      }
      if (body) {
        textTd += '<p style="margin:0;font-size:14px;line-height:1.5;color:#444444;">' + body + '</p>';
      }
      if (ctaText && ctaUrl) {
        textTd += '<div style="margin-top:10px;"><a href="' + ctaUrl + '" style="display:inline-block;padding:10px 18px;font-size:14px;color:#ffffff;background-color:#007da3;text-decoration:none;border-radius:3px;">' + ctaText + '</a></div>';
      }
      textTd += '</td>';

      html += '<tr><td style="padding:0 24px;">';
      html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>';
      html += flipped ? textTd + imgTd : imgTd + textTd;
      html += '</tr></table></td></tr>';
    }

    else if (section.type === "cards") {
      const left = d.left || {};
      const right = d.right || {};
      html += '<tr><td style="padding:16px 24px 24px;">';
      html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>';
      html += buildCardColumn(left);
      html += buildCardColumn(right);
      html += '</tr></table></td></tr>';
    }

    else if (section.type === "spotlight") {
      const eyebrow = escapeHtml(d.eyebrow || "");
      const img = escapeHtml(d.imageUrl || "");
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");
      const bg = escapeHtml(d.bgColor || "#FBE232");

      html += '<tr><td style="padding:24px;background-color:' + bg + ';">';
      if (eyebrow) {
        html += '<div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#111111;margin-bottom:6px;">' + eyebrow + '</div>';
      }
      if (title) {
        html += '<h2 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111111;">' + title + '</h2>';
      }
      if (img) {
        html += '<div style="margin:0 0 10px;"><img src="' + img + '" alt="" style="display:block;width:100%;height:auto;border:0;" /></div>';
      }
      if (body) {
        html += '<p style="margin:0;font-size:14px;line-height:1.5;color:#111111;">' + body + '</p>';
      }
      if (ctaText && ctaUrl) {
        html += '<div style="margin-top:12px;"><a href="' + ctaUrl + '" style="display:inline-block;padding:10px 18px;font-size:14px;color:#000000;background-color:#ffffff;text-decoration:none;border-radius:3px;">' + ctaText + '</a></div>';
      }
      html += '</td></tr>';
    }

    else if (section.type === "feedback") {
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");

      html += '<tr><td style="padding:24px 24px 8px;border-top:1px solid #e5e7eb;">';
      if (title) {
        html += '<h3 style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#111111;">' + title + '</h3>';
      }
      if (body) {
        html += '<p style="margin:0;font-size:13px;line-height:1.5;color:#444444;">' + body + '</p>';
      }
      html += '</td></tr>';

      if (ctaText && ctaUrl) {
        html += '<tr><td style="padding:0 24px 24px;">';
        html += '<a href="' + ctaUrl + '" style="display:inline-block;padding:8px 14px;margin-top:8px;font-size:13px;color:#007da3;text-decoration:underline;">' + ctaText + '</a>';
        html += '</td></tr>';
      }
    }

    else if (section.type === "footer") {
      html += '<tr><td style="padding:16px 24px 24px;border-top:1px solid #e5e7eb;text-align:left;">';
      html += '<p style="margin:0;font-size:11px;line-height:1.4;color:#6b7280;">';
      html += 'You are receiving this email because you subscribed to our newsletter. ';
      html += 'If you no longer wish to receive these messages, you can update your preferences at any time.';
      html += '</p></td></tr>';
    }

    return html;
  }

  function buildEmailHtml() {
    let html = "";
    html += '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;background-color:#ffffff;">';
    html += "<tbody>";
    sections.forEach(section => {
      html += buildSectionHtml(section);
    });
    html += "</tbody></table>";
    return html;
  }

  // ---------- rendering: UI ----------

  function renderList() {
    listEl.innerHTML = "";
    sections.forEach(section => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = String(section.id);
      if (section.id === selectedId) {
        card.classList.add("is-active");
      }

      card.innerHTML =
        '<div class="card-main">' +
          '<div class="card-type">' + escapeHtml(getSectionLabel(section)) + '</div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button type="button" class="icon-btn card-edit" title="Edit section">✎</button>' +
          '<button type="button" class="icon-btn card-delete" title="Delete section">🗑</button>' +
        '</div>';

      card.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".card-delete");
        if (deleteBtn) {
          e.stopPropagation();
          const id = Number(card.dataset.id);
          deleteSection(id);
          return;
        }
        const id = Number(card.dataset.id);
        selectSection(id);
      });

      listEl.appendChild(card);
    });
  }

  function renderPreview() {
    if (!sections.length) {
      previewEl.innerHTML = '<p class="placeholder">Add sections to see a live preview.</p>';
      return;
    }
    previewEl.innerHTML = buildEmailHtml();
  }

  // ---------- editor helpers ----------

  function updateEditorVisibility(type) {
    const groups = editorForm.querySelectorAll(".field-group");
    groups.forEach(group => {
      const types = group.dataset.types;
      if (!types) {
        group.style.display = "";
        return;
      }
      const list = types.split(/\s+/);
      group.style.display = list.includes(type) ? "" : "none";
    });
  }

  function getCardSide() {
    const checked = Array.from(cardSideInputs).find(i => i.checked);
    return checked ? checked.value : "left";
  }

  function clearForm() {
    imageFileInput.value = "";
    imageUrlInput.value = "";
    eyebrowInput.value = "";
    titleInput.value = "";
    bodyInput.value = "";
    ctaTextInput.value = "";
    ctaUrlInput.value = "";
    dividerTitleInput.value = "";
    dividerBgColorInput.value = "#FBE232";
    spotlightBgColorInput.value = "#FBE232";
    flip5050Input.checked = false;
  }

  function populateEditor(section) {
    clearForm();
    const d = section.data || {};

    if (section.type === "banner") {
      imageUrlInput.value = d.imageUrl || "";
    } else if (section.type === "text") {
      titleInput.value = d.title || "";
      bodyInput.value = d.body || "";
      ctaTextInput.value = d.ctaText || "";
      ctaUrlInput.value = d.ctaUrl || "";
    } else if (section.type === "divider") {
      dividerTitleInput.value = d.title || "";
      dividerBgColorInput.value = d.bgColor || "#FBE232";
    } else if (section.type === "fifty") {
      imageUrlInput.value = d.imageUrl || "";
      titleInput.value = d.title || "";
      bodyInput.value = d.body || "";
      ctaTextInput.value = d.ctaText || "";
      ctaUrlInput.value = d.ctaUrl || "";
      flip5050Input.checked = !!d.flipped;
    } else if (section.type === "cards") {
      const side = getCardSide();
      const card = (d[side] || {});
      imageUrlInput.value = card.imageUrl || "";
      titleInput.value = card.title || "";
      bodyInput.value = card.body || "";
      ctaTextInput.value = card.ctaText || "";
      ctaUrlInput.value = card.ctaUrl || "";
    } else if (section.type === "spotlight") {
      eyebrowInput.value = d.eyebrow || "";
      imageUrlInput.value = d.imageUrl || "";
      titleInput.value = d.title || "";
      bodyInput.value = d.body || "";
      ctaTextInput.value = d.ctaText || "";
      ctaUrlInput.value = d.ctaUrl || "";
      spotlightBgColorInput.value = d.bgColor || "#FBE232";
    } else if (section.type === "feedback") {
      titleInput.value = d.title || "";
      bodyInput.value = d.body || "";
      ctaTextInput.value = d.ctaText || "";
      ctaUrlInput.value = d.ctaUrl || "";
    }
  }

  async function applyChanges() {
    const section = getSelectedSection();
    if (!section) return;

    const d = section.data || {};
    const type = section.type;

    let uploadedDataUrl = null;
    if (
      imageFileInput.files &&
      imageFileInput.files[0] &&
      ["banner", "fifty", "cards", "spotlight"].includes(type)
    ) {
      try {
        uploadedDataUrl = await readFileAsDataURL(imageFileInput.files[0]);
      } catch (e) {
        console.error("Failed to read image file", e);
      }
    }

    if (type === "banner") {
      d.imageUrl = uploadedDataUrl || imageUrlInput.value.trim();
    } else if (type === "text") {
      d.title = titleInput.value.trim();
      d.body = bodyInput.value;
      d.ctaText = ctaTextInput.value.trim();
      d.ctaUrl = ctaUrlInput.value.trim();
    } else if (type === "divider") {
      d.title = dividerTitleInput.value.trim();
      d.bgColor = dividerBgColorInput.value.trim() || "#FBE232";
    } else if (type === "fifty") {
      d.imageUrl = uploadedDataUrl || imageUrlInput.value.trim();
      d.title = titleInput.value.trim();
      d.body = bodyInput.value;
      d.ctaText = ctaTextInput.value.trim();
      d.ctaUrl = ctaUrlInput.value.trim();
      d.flipped = flip5050Input.checked;
    } else if (type === "cards") {
      const side = getCardSide();
      d.left = d.left || {};
      d.right = d.right || {};
      const card = side === "right" ? d.right : d.left;
      card.imageUrl = uploadedDataUrl || imageUrlInput.value.trim();
      card.title = titleInput.value.trim();
      card.body = bodyInput.value;
      card.ctaText = ctaTextInput.value.trim();
      card.ctaUrl = ctaUrlInput.value.trim();
    } else if (type === "spotlight") {
      d.imageUrl = uploadedDataUrl || imageUrlInput.value.trim();
      d.eyebrow = eyebrowInput.value.trim();
      d.title = titleInput.value.trim();
      d.body = bodyInput.value;
      d.ctaText = ctaTextInput.value.trim();
      d.ctaUrl = ctaUrlInput.value.trim();
      d.bgColor = spotlightBgColorInput.value.trim() || "#FBE232";
    } else if (type === "feedback") {
      d.title = titleInput.value.trim();
      d.body = bodyInput.value;
      d.ctaText = ctaTextInput.value.trim();
      d.ctaUrl = ctaUrlInput.value.trim();
    }

    section.data = d;
    imageFileInput.value = "";
    renderList();
    renderPreview();
  }

  // ---------- selection / delete ----------

  function selectSection(id) {
    selectedId = id;
    const section = getSelectedSection();
    renderList();

    if (!section) {
      currentSectionLabel.textContent = "Select a section card to edit its properties.";
      editorForm.classList.add("hidden");
      return;
    }

    currentSectionLabel.textContent = getSectionLabel(section);
    editorForm.classList.remove("hidden");
    updateEditorVisibility(section.type);
    populateEditor(section);
  }

  function deleteSection(id) {
    sections = sections.filter(s => s.id !== id);
    if (selectedId === id) {
      selectedId = null;
      editorForm.classList.add("hidden");
      currentSectionLabel.textContent = "Select a section card to edit its properties.";
    }
    renderList();
    renderPreview();
  }

  // ---------- events ----------

  addButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (!type) return;
      const flipped = btn.dataset.flipped === "true";
      const section = createSection(type, { flipped });
      sections.push(section);
      selectedId = section.id;
      renderList();
      renderPreview();
      selectSection(section.id);
    });
  });

  applyBtn.addEventListener("click", () => {
    applyChanges();
  });

  cardSideInputs.forEach(input => {
    input.addEventListener("change", () => {
      const section = getSelectedSection();
      if (section && section.type === "cards") {
        populateEditor(section);
      }
    });
  });

  exportBtn.addEventListener("click", () => {
    if (!sections.length) return;
    const emailHtml = buildEmailHtml();
    const fullHtml =
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;">' +
      emailHtml +
      "</body></html>";

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // initial
  renderList();
  renderPreview();
});
