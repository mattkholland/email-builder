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

  // Use local JPGs as "real" placeholders.
  // Put these next to index.html or adjust paths as needed.
  const PLACEHOLDER_BANNER = "placeholder-banner-600x200.jpg";
  const PLACEHOLDER_IMAGE = "placeholder-image-280x180.jpg";

  // ---------- helpers: data ----------

  function createSection(type, options = {}) {
    const id = nextId++;
    let data = {};

    switch (type) {
      case "banner":
        data = { imageUrl: PLACEHOLDER_BANNER };
        break;
      case "text":
        data = {
          title: "Add a short, clear title",
          body:
            "Use this text block to introduce the topic, share key details, and explain why it matters.",
          ctaText: "Learn more →",
          ctaUrl: "https://example.com"
        };
        break;
      case "divider":
        data = {
          title: "Section heading label",
          bgColor: "#FBE232"
        };
        break;
      case "fifty":
        data = {
          imageUrl: PLACEHOLDER_IMAGE,
          title: "Add a compelling 50/50 title",
          body:
            "Use this two-column layout to pair a strong visual with supporting copy.",
          ctaText: "Explore more →",
          ctaUrl: "https://example.com",
          flipped: options.flipped === true
        };
        break;
      case "cards":
        data = {
          left: {
            imageUrl: PLACEHOLDER_IMAGE,
            title: "Left card title",
            body: "Brief description or highlight for the left card.",
            ctaText: "View details →",
            ctaUrl: "https://example.com"
          },
          right: {
            imageUrl: PLACEHOLDER_IMAGE,
            title: "Right card title",
            body: "Brief description or highlight for the right card.",
            ctaText: "View details →",
            ctaUrl: "https://example.com"
          }
        };
        break;
      case "spotlight":
        data = {
          eyebrow: "SPOTLIGHT",
          imageUrl: PLACEHOLDER_IMAGE,
          title: "Feature headline or key announcement",
          body:
            "Use the spotlight section to highlight a key story, feature, or announcement.",
          ctaText: "Read the full story →",
          ctaUrl: "https://example.com",
          bgColor: "#FBE232"
        };
        break;
      case "feedback":
        data = {
          title: "We’d love your feedback",
          body:
            "Tell us what’s working well and where we can improve your newsletter experience.",
          ctaText: "Share feedback →",
          ctaUrl: "https://example.com"
        };
        break;
      case "spacer":
        data = {}; // just a 16px gap
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
      case "spacer": return "Spacer (16px)";
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

  // ---------- drag & drop helpers ----------

  function reorderSections(fromId, toId) {
    if (fromId === toId) return;
    const fromIndex = sections.findIndex(s => s.id === fromId);
    const toIndex = sections.findIndex(s => s.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);

    renderList();
    renderPreview();

    if (selectedId === fromId) {
      selectSection(fromId);
    }
  }

  // ---------- rendering: email HTML ----------

  function buildCardColumn(cardData) {
    const img = escapeHtml(cardData.imageUrl || "");
    const title = escapeHtml(cardData.title || "");
    const body = nl2br(cardData.body || "");
    const ctaText = escapeHtml(cardData.ctaText || "");
    const ctaUrl = escapeHtml(cardData.ctaUrl || "");

    let html = "";
    // 16px padding around each card
    html += '<td width="50%" valign="top" style="padding:16px;">';
    html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">';

    if (img) {
      // 4px between image and title
      html += '<tr><td style="padding:0 0 4px;">';
      html += '<img src="' + img + '" alt="" style="display:block;width:100%;height:auto;border:0;" />';
      html += '</td></tr>';
    }
    if (title) {
      // 8px top + bottom padding for title cell
      html += '<tr><td style="padding:8px 0 8px;">';
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
      html += '<a href="' + ctaUrl + '" style="font-size:13px;color:#007da3;text-decoration:none;">' + ctaText + '</a>';
      html += '</td></tr>';
    }

    html += '</table></td>';
    return html;
  }

  function buildSectionHtml(section) {
    const d = section.data || {};
    let html = "";

    if (section.type === "banner") {
      const src = escapeHtml(d.imageUrl || PLACEHOLDER_BANNER);
      html += '<tr><td align="center" style="padding:0;">';
      html += '<img src="' + src + '" width="600" style="display:block;width:600px;max-width:100%;height:auto;border:0;line-height:0;" alt="" />';
      html += '</td></tr>';
    }

    else if (section.type === "text") {
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");

      html += '<tr><td style="padding:16px 16px 8px;">';
      if (title) {
        html += '<h2 style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#111111;">' + title + '</h2>';
      }
      if (body) {
        html += '<p style="margin:0;font-size:14px;line-height:1.5;color:#444444;">' + body + '</p>';
      }
      html += '</td></tr>';

      if (ctaText && ctaUrl) {
        html += '<tr><td style="padding:0 16px 16px;">';
        html += '<a href="' + ctaUrl + '" style="font-size:14px;color:#007da3;text-decoration:none;">' + ctaText + '</a>';
        html += '</td></tr>';
      }
    }

    else if (section.type === "divider") {
      const title = escapeHtml(d.title || "");
      const bg = escapeHtml(d.bgColor || "#FBE232");
      html += '<tr><td style="padding:0;">';
      html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">';
      html += '<tr><td style="padding:6px 16px;background-color:' + bg + ';text-align:left;vertical-align:middle;">';
      html += '<span style="font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.04em;color:#111111;">' + title + '</span>';
      html += '</td></tr></table></td></tr>';
    }

    else if (section.type === "fifty") {
      const img = escapeHtml(d.imageUrl || PLACEHOLDER_IMAGE);
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");
      const flipped = !!d.flipped;

      // no 16px vertical padding; just horizontal
    let imgTd = '<td width="50%" valign="top" style="padding:0;">';

      if (img) {
        imgTd += '<img src="' + img + '" alt="" style="display:block;width:100%;height:auto;border:0;" />';
      }
      imgTd += '</td>';

  let textTd = '<td width="50%" valign="top" style="padding:0;">';
      if (title) {
        textTd += '<h2 style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#111111;">' + title + '</h2>';
      }
      if (body) {
        textTd += '<p style="margin:0;font-size:14px;line-height:1.5;color:#444444;">' + body + '</p>';
      }
      if (ctaText && ctaUrl) {
        textTd += '<div style="margin-top:8px;"><a href="' + ctaUrl + '" style="font-size:14px;color:#007da3;text-decoration:none;">' + ctaText + '</a></div>';
      }
      textTd += '</td>';

      html += '<tr><td style="padding:0 16px;">';
      html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>';
      html += flipped ? textTd + imgTd : imgTd + textTd;
      html += '</tr></table></td></tr>';
    }

    else if (section.type === "cards") {
      const left = d.left || {};
      const right = d.right || {};
      // remove outer padding; cards themselves now have 16px padding
      html += '<tr><td style="padding:0;">';
      html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>';
      html += buildCardColumn(left);
      html += buildCardColumn(right);
      html += '</tr></table></td></tr>';
    }

    else if (section.type === "spotlight") {
      const eyebrow = escapeHtml(d.eyebrow || "");
      const img = escapeHtml(d.imageUrl || PLACEHOLDER_IMAGE);
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");
      const bg = escapeHtml(d.bgColor || "#FBE232");

      html += '<tr><td style="padding:16px;background-color:' + bg + ';">';
      if (eyebrow) {
        html += '<div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#111111;margin-bottom:6px;">' + eyebrow + '</div>';
      }
      if (title) {
        html += '<h2 style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#111111;">' + title + '</h2>';
      }
      if (img) {
        html += '<div style="margin:0 0 10px;"><img src="' + img + '" alt="" style="display:block;width:100%;height:auto;border:0;" /></div>';
      }
      if (body) {
        html += '<p style="margin:0;font-size:14px;line-height:1.5;color:#111111;">' + body + '</p>';
      }
      if (ctaText && ctaUrl) {
        html += '<div style="margin-top:8px;"><a href="' + ctaUrl + '" style="font-size:14px;color:#000000;text-decoration:none;">' + ctaText + '</a></div>';
      }
      html += '</td></tr>';
    }

    else if (section.type === "feedback") {
      const title = escapeHtml(d.title || "");
      const body = nl2br(d.body || "");
      const ctaText = escapeHtml(d.ctaText || "");
      const ctaUrl = escapeHtml(d.ctaUrl || "");

      html += '<tr><td style="padding:16px 16px 8px;border-top:1px solid #e5e7eb;text-align:center;">';
      if (title) {
        html += '<h3 style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#111111;">' + title + '</h3>';
      }
      if (body) {
        html += '<p style="margin:0;font-size:13px;line-height:1.5;color:#444444;">' + body + '</p>';
      }
      html += '</td></tr>';

      if (ctaText && ctaUrl) {
        html += '<tr><td style="padding:0 16px 16px;text-align:center;">';
        html += '<a href="' + ctaUrl + '" style="font-size:13px;color:#007da3;text-decoration:none;">' + ctaText + '</a>';
        html += '</td></tr>';
      }
    }

    else if (section.type === "spacer") {
      html += '<tr><td style="padding:0;height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>';
    }

    else if (section.type === "footer") {
      html += '<tr><td style="padding:16px 16px 16px;border-top:1px solid #e5e7eb;text-align:left;">';
      html += '<p style="margin:0;font-size:11px;line-height:1.4;color:#6b7280;">';
      html += 'You are receiving this email because you subscribed to our newsletter. ';
      html += 'If you no longer wish to receive these messages, you can update your preferences at any time.';
      html += '</p></td></tr>';
    }

    return html;
  }

  function buildEmailHtml() {
    let html = "";
    html += '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;background-color:#ffffff;border:1px solid #e5e7eb;padding:16px;">';

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

      // draggable
      card.draggable = true;

      card.innerHTML =
        '<div class="card-main">' +
          '<div class="card-type">' + escapeHtml(getSectionLabel(section)) + '</div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button type="button" class="icon-btn card-edit" title="Edit section">✎</button>' +
          '<button type="button" class="icon-btn card-delete" title="Delete section">🗑</button>' +
        '</div>';

      // click handling (select / delete)
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

      // drag & drop events
      card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = listEl.querySelector(".dragging");
        if (!dragging || dragging === card) return;
        card.classList.add("drag-over");
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        const fromId = Number(e.dataTransfer.getData("text/plain"));
        const toId = Number(card.dataset.id);
        reorderSections(fromId, toId);
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        const others = listEl.querySelectorAll(".drag-over");
        others.forEach(el => el.classList.remove("drag-over"));
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
      imageUrlInput.value = d.imageUrl || PLACEHOLDER_BANNER;
    } else if (section.type === "text") {
      titleInput.value = d.title || "";
      bodyInput.value = d.body || "";
      ctaTextInput.value = d.ctaText || "";
      ctaUrlInput.value = d.ctaUrl || "";
    } else if (section.type === "divider") {
      dividerTitleInput.value = d.title || "";
      dividerBgColorInput.value = d.bgColor || "#FBE232";
    } else if (section.type === "fifty") {
      imageUrlInput.value = d.imageUrl || PLACEHOLDER_IMAGE;
      titleInput.value = d.title || "";
      bodyInput.value = d.body || "";
      ctaTextInput.value = d.ctaText || "";
      ctaUrlInput.value = d.ctaUrl || "";
      flip5050Input.checked = !!d.flipped;
    } else if (section.type === "cards") {
      const side = getCardSide();
      const card = (d[side] || {});
      imageUrlInput.value = card.imageUrl || PLACEHOLDER_IMAGE;
      titleInput.value = card.title || "";
      bodyInput.value = card.body || "";
      ctaTextInput.value = card.ctaText || "";
      ctaUrlInput.value = card.ctaUrl || "";
    } else if (section.type === "spotlight") {
      eyebrowInput.value = d.eyebrow || "";
      imageUrlInput.value = d.imageUrl || PLACEHOLDER_IMAGE;
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
      d.imageUrl = uploadedDataUrl || imageUrlInput.value.trim() || PLACEHOLDER_BANNER;
    } else if (type === "text") {
      d.title = titleInput.value.trim() || "Add a short, clear title";
      d.body = bodyInput.value || "";
      d.ctaText = ctaTextInput.value.trim() || "Learn more →";
      d.ctaUrl = ctaUrlInput.value.trim() || "https://example.com";
    } else if (type === "divider") {
      d.title = dividerTitleInput.value.trim() || "Section heading label";
      d.bgColor = dividerBgColorInput.value.trim() || "#FBE232";
    } else if (type === "fifty") {
      d.imageUrl = uploadedDataUrl || imageUrlInput.value.trim() || PLACEHOLDER_IMAGE;
      d.title = titleInput.value.trim() || "Add a compelling 50/50 title";
      d.body = bodyInput.value || "";
      d.ctaText = ctaTextInput.value.trim() || "Explore more →";
      d.ctaUrl = ctaUrlInput.value.trim() || "https://example.com";
      d.flipped = flip5050Input.checked;
    } else if (type === "cards") {
      const side = getCardSide();
      d.left = d.left || {};
      d.right = d.right || {};
      const card = side === "right" ? d.right : d.left;
      card.imageUrl = uploadedDataUrl || imageUrlInput.value.trim() || PLACEHOLDER_IMAGE;
      card.title = titleInput.value.trim() || (side === "right" ? "Right card title" : "Left card title");
      card.body = bodyInput.value || "";
      card.ctaText = ctaTextInput.value.trim() || "View details →";
      card.ctaUrl = ctaUrlInput.value.trim() || "https://example.com";
    } else if (type === "spotlight") {
      d.imageUrl = uploadedDataUrl || imageUrlInput.value.trim() || PLACEHOLDER_IMAGE;
      d.eyebrow = eyebrowInput.value.trim() || "SPOTLIGHT";
      d.title = titleInput.value.trim() || "Feature headline or key announcement";
      d.body = bodyInput.value || "";
      d.ctaText = ctaTextInput.value.trim() || "Read the full story →";
      d.ctaUrl = ctaUrlInput.value.trim() || "https://example.com";
      d.bgColor = spotlightBgColorInput.value.trim() || "#FBE232";
    } else if (type === "feedback") {
      d.title = titleInput.value.trim() || "We’d love your feedback";
      d.body = bodyInput.value || "";
      d.ctaText = ctaTextInput.value.trim() || "Share feedback →";
      d.ctaUrl = ctaUrlInput.value.trim() || "https://example.com";
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
