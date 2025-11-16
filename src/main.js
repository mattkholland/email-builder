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

  // Helpers ----------------------------------------------------

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
      case "banner":
        return "Banner";
      case "text":
        return "Text-only";
      case "divider":
        return "Divider";
      case "fifty":
        return "50/50";
      case "cards":
        return "Two Cards";
      case "spotlight":
        return "Spotlight";
      case "feedback":
        return "Feedback";
      case "footer":
        return "Footer";
      default:
        return "Section";
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
    return sections.find((s) => s.id === selectedId) || null;
  }

  // Rendering --------------------------------------------------

  function renderList() {
    listEl.innerHTML = "";

    sections.forEach((section) => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = String(section.id);
      if (section.id === selectedId) {
        card.classList.add("is-active");
      }

      card.innerHTML = `
        <div class="card-main">
          <div class="card-type">${escapeHtml(getSectionLabel(section))}</div>
        </div>
        <div class="card-actions">
          <button type="button" class="icon-btn card-edit" title="Edit section">✎</button>
          <button type="button" class="icon-btn card-delete" title="Delete section">🗑</button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".card-delete");
        if (deleteBtn) {
          e.stopPropagation();
          const id = Number(card.dataset.id);
          deleteSection(id);
          return;
        }

        // Edit (or general click) selects the section
        const id = Number(card.dataset.id);
        selectSection(id);
      });

      listEl.appendChild(card);
    });
  }

  function renderPreview() {
    if (!sections.length) {
      previewEl.innerHTML =
        '<p class="placeholder">Add sections to see a live preview.</p>';
      return;
    }

    previewEl.innerHTML = buildEmailHtml();
  }

  function buildEmailHtml() {
    let html =
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;background-color:#ffffff;">';
    html += "<tbody>";

    sections.forEach((section) => {
      html += buildSectionHtml(section);
    });

    html += "</tbody></table>";
    return html;
  }

  function buildSectionHtml(section) {
    const d = section.data || {};
    let html = "";

    switch (section.type) {
      case "banner": {
        const src = escapeHtml(d.imageUrl || "");
        if (!src) break;
        html += `
          <tr>
            <td align="center" style="padding:0;">
              <img src="${src}" width="600" style="display:block;width:600px;max-width:100%;height:auto;border:0;line-height:0;" alt="" />
            </td>
          </tr>
        `;
        break;
      }

      case "text": {
        const title = escapeHtml(d.title || "");
        const body = nl2br(d.body || "");
        const ctaText = escapeHtml(d.ctaText || "");
        const ctaUrl = escapeHtml(d.ctaUrl || "");

        html += `
          <tr>
            <td style="padding:24px 24px 8px;">
              ${title ? `<h2 style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111111;">${title}</h2>` : ""}
              ${body ? `<p style="margin:0;font-size:14px;line-height:1.5;color:#444444;">${body}</p>` : ""}
            </td>
          </tr>
        `;

        if (ctaText && ctaUrl) {
          html += `
            <tr>
              <td style="padding:0 24px 24px;">
                <a href="${ctaUrl}" style="display:inline-block;padding:10px 18px;margin-top:8px;font-size:14px;color:#ffffff;background-color:#007da3;text-decoration:none;border-radius:3px;">
                  ${ctaText}
                </a>
              </td>
            </tr>
          `;
        }
        break;
      }

      case "divider": {
        const title = escapeHtml(d.title || "");
        const bg = escapeHtml(d.bgColor || "#FBE232");
        html += `
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 24px;background-color:${bg};text-align:left;">
                    <span style="font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#111111;">
                      ${title}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        break;
      }

      case "fifty": {
        const img = escapeHtml(d.imageUrl || "");
        const title = escapeHtml(d.title || "");
        const body = nl2br(d.body || "");
        const ctaText = escapeHtml(d.ctaText || "");
        const ctaUrl = escapeHtml(d.ctaUrl || "");
        const flipped = !!d.flipped;

        const imgTd = img
          ? `<td width="50%" valign="top" style="padding:16px 12px;">
               <img src="${img}" alt="" style="display:block;width:100%;height:auto;border:0;" />
             </td>`
          : `<td width="50%" valign="top" style="padding:16px 12px;"></td>`;

        const textTd = `
          <td width="50%" valign="top" style="padding:16px 12px;">
            ${title ? `<h2 style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111111;">${title}</h2>` : ""}
            ${body ? `<p style="margin:0;font-size:14px;line-height:1.5;color:#444444;">${body}</p>` : ""}
            ${
              ctaText && ctaUrl
                ? `<div style="margin-top:10px;">
                     <a href="${ctaUrl}" style="display:inline-block;padding:10px 18px;font-size:14px;color:#ffffff;background-color:#007da3;text-decoration:none;border-radius:3px;">
                       ${ctaText}
                     </a>
                   </div>`
                : ""
            }
          </td>
        `;

        html += `
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  ${flipped ? textTd + imgTd : imgTd + textTd}
                </tr>
              </table>
            </td>
