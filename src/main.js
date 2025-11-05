// ==== STATE ====
const state = {
  theme: { accent: '#FBE232' },         // only divider color is editable
  sections: []                          // array of {type, data}
};

// ==== DOM ====
const listEl = document.getElementById('list');
const previewEl = document.getElementById('preview');
const currentEl = document.getElementById('currentSection');
const editorEl = document.getElementById('editor');

// Editor fields
const $title = document.getElementById('titleInput');
const $eyebrow = document.getElementById('eyebrowInput');
const $body = document.getElementById('bodyInput');
const $ctaText = document.getElementById('ctaText');
const $ctaUrl = document.getElementById('ctaUrl');
const $dividerText = document.getElementById('dividerText');
const $imgFile = document.getElementById('imgAFile');
const $imgUrl = document.getElementById('imgAUrl');
const $bgColor = document.getElementById('bgColor');
const $fgColor = document.getElementById('fgColor');
const $flip5050 = document.getElementById('flip5050');
const $apply = document.getElementById('apply');
const $accentColor = document.getElementById('accentColor');
const $applyTheme = document.getElementById('applyTheme');

// Card toggle
let cardWhich = 1;
document.querySelectorAll('input[name="cardWhich"]').forEach(r => {
  r.addEventListener('change', (e) => { cardWhich = parseInt(e.target.value, 10); openEditor(currentIndex); });
});

// Action buttons
document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => addSection(btn.dataset.add));
});
document.getElementById('exportHtml').addEventListener('click', () => {
  const html = buildExport();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'newsletter.html';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

// Theme apply
$applyTheme.addEventListener('click', () => {
  state.theme.accent = $accentColor.value.trim() || '#FBE232';
  render();
});

// Apply changes
$apply.addEventListener('click', applyChanges);

// ==== HELPERS ====
let currentIndex = -1;

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getImgFromInputs() {
  return new Promise(async (resolve) => {
    if ($imgFile && $imgFile.files && $imgFile.files[0]) {
      resolve(await fileToDataURL($imgFile.files[0]));
      return;
    }
    if ($imgUrl && $imgUrl.value.trim()) {
      resolve($imgUrl.value.trim());
      return;
    }
    resolve(null);
  });
}

// ==== ADD SECTION ====
function addSection(type) {
  const s = { type, data: {} };
  switch (type) {
    case 'banner':
      s.data = { src: PH.banner, alt: 'Banner 600x200' };
      break;
    case 'textonly':
      s.data = { title: '[Headline]', body: '[Intro paragraph text.]', ctaText: 'Learn more →', ctaUrl: '#' };
      break;
    case 'divider':
      s.data = { label: 'SECTION TITLE' };
      break;
    case 's5050':
      s.data = { title: '[Section Title]', body: '[Short description.]', ctaText: 'Learn more →', ctaUrl: '#', imgA: PH.half, flipped: false };
      break;
    case 's5050flip':
      s.data = { title: '[Section Title]', body: '[Short description.]', ctaText: 'Learn more →', ctaUrl: '#', imgA: PH.half, flipped: true };
      break;
    case 'cards':
      s.data = {
        card1: { img: PH.c, title: '[Card One Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
        card2: { img: PH.c, title: '[Card Two Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' }
      };
      break;
    case 'spotlight':
      s.data = {
        eyebrow: 'SPOTLIGHT',
        title: '[Spotlight Title]',
        body: '[Short spotlight summary.]',
        ctaText: 'Learn more →',
        ctaUrl: '#',
        imgA: PH.spotlight,
        bg: '#fbe232',
        fg: '#000000'
      };
      break;
    case 'footer':
      s.data = { logo: '[Logo]', fourCs: "[4c's]" };
      break;
    case 'feedback':
      s.data = { lead: 'Questions? Ideas? Feedback?', email: 'name@email.com' };
      break;
  }
  state.sections.push(s);
  currentIndex = state.sections.length - 1;
  render();
}

// ==== RENDER LIST + PREVIEW ====
function render() {
  renderList();
  renderPreview();
  if (currentIndex >= 0 && currentIndex < state.sections.length) {
    openEditor(currentIndex);
  } else {
    editorEl.classList.add('hidden');
    currentEl.textContent = 'None selected — click a card to edit.';
  }
}

function renderList() {
  listEl.innerHTML = state.sections.map((s, i) => `
    <div class="card" data-idx="${i}" draggable="true">
      <h3>${i + 1}. ${SECTION_TYPES[s.type]}</h3>
      <div class="mini-actions">
        <button data-act="edit">Edit</button>
        <button data-act="del" style="color:#ff6b6b;">Delete</button>
      </div>
    </div>
  `).join('') || '<div class="muted">Use the buttons above to add sections.</div>';

  // click actions
  listEl.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', (e) => {
      const idx = parseInt(el.dataset.idx, 10);
      const act = e.target.dataset.act || 'edit';
      if (act === 'del') {
        state.sections.splice(idx, 1);
        currentIndex = Math.min(idx, state.sections.length - 1);
        render();
        return;
      }
      currentIndex = idx; openEditor(idx);
    });
  });

  // drag & drop reorder
  let dragIdx = null;
  listEl.querySelectorAll('.card').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      dragIdx = parseInt(el.dataset.idx, 10);
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', dragIdx);
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop-target'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', (e) => {
      e.preventDefault(); el.classList.remove('drop-target');
      const overIdx = parseInt(el.dataset.idx, 10);
      if (dragIdx === null || overIdx === dragIdx) return;
      const [moved] = state.sections.splice(dragIdx, 1);
      state.sections.splice(overIdx, 0, moved);
      currentIndex = overIdx;
      dragIdx = null;
      render();
    });
  });
}

function renderPreview() {
  const rows = state.sections.map(toPreview).join('');
  previewEl.innerHTML = rows;
}

// ==== PREVIEW TEMPLATES ====
function toPreview(s, idx) {
  switch (s.type) {
    case 'banner':
      return `
        <table><tr><td><img src="${s.data.src}" width="600" height="200" alt="${escapeHtml(s.data.alt || '')}" style="width:600px;height:200px;"></td></tr></table>
        <div class="spacer32"></div>
      `;
    case 'textonly': {
      const cta = (s.data.ctaText && s.data.ctaUrl) ? `<a class="cta" href="${escapeHtml(s.data.ctaUrl)}">${escapeHtml(s.data.ctaText)}</a>` : '';
      return `
        <table>
          <tr><td class="txt">
            <div class="title">${escapeHtml(s.data.title)}</div>
            <div>${escapeHtml(s.data.body)}</div>
            ${cta}
          </td></tr>
        </table>
        <div class="spacer32"></div>
      `;
    }
    case 'divider':
      return `<div class="divider" style="background:${state.theme.accent};">${escapeHtml(s.data.label)}</div><div class="spacer24"></div>`;

    case 's5050':
    case 's5050flip': {
      const flipped = s.data.flipped === true || s.type === 's5050flip';
      const left = flipped ? 'txt' : 'img';
      const right = flipped ? 'img' : 'txt';
      const txtHtml = `
        <td valign="top" width="285" class="txt">
          <div>${escapeHtml(s.data.body)}</div>
          <a class="cta" href="${escapeHtml(s.data.ctaUrl)}">${escapeHtml(s.data.ctaText)}</a>
        </td>`;
      const imgHtml = `
        <td valign="top" width="285">
          <img src="${s.data.imgA}" width="285" height="185" alt="" style="width:285px;height:185px;">
        </td>`;
      return `
        <table>
          <tr><td class="txt" colspan="3"><div class="title">${escapeHtml(s.data.title)}</div></td></tr>
          <tr>
            ${left === 'img' ? imgHtml : txtHtml}
            <td width="30"></td>
            ${right === 'img' ? imgHtml : txtHtml}
          </tr>
        </table>
        <div class="spacer32"></div>
      `;
    }

    case 'cards': {
      const c1 = s.data.card1, c2 = s.data.card2;
      const column = (c) => `
        <td valign="top" width="285">
          <img src="${c.img}" width="285" height="185" alt="" style="width:285px;height:185px;">
          <div class="txt">
            <div class="title" style="margin-top:10px;margin-bottom:10px;">${escapeHtml(c.title)}</div>
            <div>${escapeHtml(c.body)}</div>
            <a class="cta" href="${escapeHtml(c.ctaUrl)}">${escapeHtml(c.ctaText)}</a>
          </div>
        </td>`;
      return `
        <table>
          <tr>
            ${column(c1)}
            <td width="30"></td>
            ${column(c2)}
          </tr>
        </table>
        <div class="spacer32"></div>
      `;
    }

    case 'spotlight': {
      const bg = s.data.bg || '#fbe232';
      const fg = s.data.fg || '#000000';
      return `
        <table class="spotlight-preview">
          <tr><td style="background:${bg}; color:${fg}; padding:16px;">
            <div style="font-size:12px; letter-spacing:.03em; text-transform:uppercase; margin:0 0 6px 0;"><strong>${escapeHtml(s.data.eyebrow || '')}</strong></div>
            <div class="title" style="color:${fg};">${escapeHtml(s.data.title)}</div>
            <table><tr>
              <td valign="top" width="180" style="padding-right:20px;">
                <img src="${s.data.imgA}" width="180" height="200" alt="" style="width:180px;height:200px;">
              </td>
              <td valign="top" class="txt" style="color:${fg};">
                <div>${escapeHtml(s.data.body)}</div>
                <a class="cta" href="${escapeHtml(s.data.ctaUrl)}" style="color:#000;">${escapeHtml(s.data.ctaText)}</a>
              </td>
            </tr></table>
          </td></tr>
        </table>
        <div class="spacer32"></div>
      `;
    }

    case 'footer':
      return `
        <table><tr><td style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">
          <div style="font-size:14px; line-height:20px; margin:10px 0;"><strong>${escapeHtml(s.data.logo)}</strong></div>
          <div style="font-size:12px; line-height:18px; margin:10px 0;">${escapeHtml(s.data.fourCs)}</div>
        </td></tr></table>
      `;

    case 'feedback':
      return `
        <table><tr><td style="text-align:center; padding:24px 0 32px 0; font-size:13px; line-height:20px; color:#333;">
          <strong>Questions? Ideas? Feedback?</strong><br>We’d love to hear it — please email <a href="mailto:${escapeHtml(s.data.email)}" class="cta"> ${escapeHtml(s.data.email)}</a>
        </td></tr></table>
      `;
  }
  return '';
}

// ==== EDITOR OPEN ====
function openEditor(idx) {
  const s = state.sections[idx]; if (!s) return;
  editorEl.classList.remove('hidden');
  currentEl.textContent = (idx + 1) + '. ' + (SECTION_TYPES[s.type] || s.type);

  // hide all contextual groups
  editorEl.querySelectorAll('.contextual').forEach(el => el.classList.add('hidden'));

  // set fields
  $title.value = s.data.title || '';
  $body.value = s.data.body || '';
  $ctaText.value = s.data.ctaText || '';
  $ctaUrl.value = s.data.ctaUrl || s.data.email || '';
  $dividerText.value = s.data.label || '';
  $imgUrl.value = s.data.imgA || s.data.src || '';
  $eyebrow.value = s.data.eyebrow || '';
  $bgColor.value = s.data.bg || '#fbe232';
  $fgColor.value = s.data.fg || '#000000';
  $flip5050.checked = !!(s.data.flipped);

  // show contextual groups
  if (s.type === 'banner') {
    document.querySelector('.imgA-field').classList.remove('hidden');
  } else if (s.type === 'textonly') {
    document.querySelector('.title-field').classList.remove('hidden');
    document.querySelector('.body-field').classList.remove('hidden');
    document.querySelector('.cta-row').classList.remove('hidden');
  } else if (s.type === 'divider') {
    document.querySelector('.divider-field').classList.remove('hidden');
  } else if (s.type === 's5050' || s.type === 's5050flip') {
    document.querySelector('.title-field').classList.remove('hidden');
    document.querySelector('.body-field').classList.remove('hidden');
    document.querySelector('.cta-row').classList.remove('hidden');
    document.querySelector('.imgA-field').classList.remove('hidden');
    document.querySelector('.flip-row').classList.remove('hidden');
  } else if (s.type === 'cards') {
    document.querySelector('.title-field').classList.remove('hidden');     // maps to selected card title
    document.querySelector('.body-field').classList.remove('hidden');      // maps to selected card body
    document.querySelector('.cta-row').classList.remove('hidden');         // maps to selected card cta
    document.querySelector('.imgA-field').classList.remove('hidden');      // maps to selected card image
    document.querySelector('.cards-which').classList.remove('hidden');     // toggle which card to edit
  } else if (s.type === 'spotlight') {
    document.querySelector('.eyebrow-field').classList.remove('hidden');
    document.querySelector('.title-field').classList.remove('hidden');
    document.querySelector('.body-field').classList.remove('hidden');
    document.querySelector('.cta-row').classList.remove('hidden');
    document.querySelector('.imgA-field').classList.remove('hidden');
    document.querySelector('.spotlight-colors').classList.remove('hidden');
  } else if (s.type === 'footer') {
    document.querySelector('.title-field').classList.remove('hidden');   // logo text
    document.querySelector('.body-field').classList.remove('hidden');    // 4c's
  } else if (s.type === 'feedback') {
    document.querySelector('.title-field').classList.remove('hidden');   // lead
    document.querySelector('.cta-row').classList.remove('hidden');       // email in URL field
  }

  // for cards, load selected card into fields
  if (s.type === 'cards') {
    const c = (cardWhich === 1 ? s.data.card1 : s.data.card2);
    $title.value = c.title || '';
    $body.value = c.body || '';
    $ctaText.value = c.ctaText || '';
    $ctaUrl.value = c.ctaUrl || '';
    $imgUrl.value = c.img || '';
  }
}

// ==== APPLY CHANGES ====
async function applyChanges() {
  if (currentIndex < 0) return;
  const s = state.sections[currentIndex];
  const title = $title.value.trim();
  const eyebrow = $eyebrow.value.trim();
  const body = $body.value.trim();
  let ctaT = $ctaText.value.trim();
  let ctaU = $ctaUrl.value.trim();
  const divT = $dividerText.value.trim();
  const bg = $bgColor.value.trim();
  const fg = $fgColor.value.trim();
  if (ctaU) ctaU = normalizeUrl(ctaU);

  // image pick (upload or url)
  const newImg = await (async () => {
    if ($imgFile && $imgFile.files && $imgFile.files[0]) return await fileToDataURL($imgFile.files[0]);
    if ($imgUrl && $imgUrl.value.trim()) return $imgUrl.value.trim();
    return null;
  })();

  switch (s.type) {
    case 'banner':
      if (newImg) s.data.src = newImg;
      if (title) s.data.alt = title; // optional alt
      break;
    case 'textonly':
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      s.data.ctaText = ctaT;
      s.data.ctaUrl = ctaU;
      break;
    case 'divider':
      if (divT) s.data.label = divT;
      break;
    case 's5050':
    case 's5050flip':
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      if (ctaT) s.data.ctaText = ctaT;
      if (ctaU) s.data.ctaUrl = ctaU;
      if (typeof $flip5050.checked === 'boolean') s.data.flipped = $flip5050.checked;
      if (newImg) s.data.imgA = newImg;
      break;
    case 'cards': {
      const c = (cardWhich === 1 ? s.data.card1 : s.data.card2);
      if (title) c.title = title;
      if (body) c.body = body;
      if (ctaT) c.ctaText = ctaT;
      if (ctaU) c.ctaUrl = ctaU;
      if (newImg) c.img = newImg;
      break;
    }
    case 'spotlight':
      if (eyebrow) s.data.eyebrow = eyebrow;
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      if (ctaT) s.data.ctaText = ctaT;
      if (ctaU) s.data.ctaUrl = ctaU;
      if (newImg) s.data.imgA = newImg;
      if (bg) s.data.bg = bg;
      if (fg) s.data.fg = fg;
      break;
    case 'footer':
      if (title) s.data.logo = title;
      if (body) s.data.fourCs = body;
      break;
    case 'feedback':
      if (title) s.data.lead = title;
      if (ctaU) s.data.email = ctaU;
      break;
  }
  render();
}

// ==== EXPORT (Outlook-safe) ====
function buildExport() {
  const rows = state.sections.map(toExportRow).join('');
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter Export</title>
<!--[if mso]>
<style>
  * { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
               style="width:600px; background-color:#ffffff; border:1px solid #e0e0e0; border-collapse:collapse;">
          ${rows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

}



function spacerRow(px = 24) {
  return `<tr><td style="height:${px}px; line-height:0; font-size:0;">&nbsp;</td></tr>`;
}

function toExportRow(s) {
  switch (s.type) {
   case 'banner':
  return `
<tr>
  <td align="center" style="padding:10px; background:#ffffff; border:1px solid #e0e0e0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" 
           style="width:600px; border-collapse:collapse;">
      <tr>
        <td style="padding:0;">
          <img src="${s.data.src}" width="600" height="${s.data.height || 200}"
               alt="${escapeHtml(s.data.alt || 'Banner')}"
               style="display:block; width:600px; height:${s.data.height || 200}px; border:0;">
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr><td style="height:32px; line-height:0; font-size:0;">&nbsp;</td></tr>`;


    case 'textonly': {
      const cta = (s.data.ctaText && s.data.ctaUrl) ? `<br><a href="${escapeHtml(s.data.ctaUrl)}" style="color:#007da3; text-decoration:none; font-weight:600; display:inline-block; margin-top:10px;">${escapeHtml(s.data.ctaText)}</a>` : '';
      return `
<tr><td class="arial" style="padding:0; font-size:14px; line-height:18px; color:#333333;">
  <div style="font-size:18px; line-height:20px; font-weight:bold; margin:10px 0; color:#111111;">${escapeHtml(s.data.title)}</div>
  <div>${escapeHtml(s.data.body)}${cta}</div>
</td></tr>
${spacerRow(32)}`;
    }

    case 'divider':
      return `
<tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td class="arial" style="background-color:${state.theme.accent}; color:#000000; font-size:13px; line-height:18px; text-transform:uppercase; font-weight:bold; padding:6px 10px;">${escapeHtml(s.data.label)}</td></tr>
  </table>
</td></tr>
${spacerRow(24)}`;

    case 's5050':
    case 's5050flip': {
      const flipped = s.data.flipped === true || s.type === 's5050flip';
      const leftImg = !flipped;
      const titleRow = `
<tr><td class="arial" style="font-size:18px; line-height:20px; font-weight:bold; margin:0; color:#111111; padding:0;">
  <div style="margin:10px 0;">${escapeHtml(s.data.title)}</div>
</td></tr>`;
      const textCell = `
<td valign="top" width="285" class="arial" style="font-size:14px; line-height:18px; color:#333333;">
  <div>${escapeHtml(s.data.body)}</div>
  <a href="${escapeHtml(s.data.ctaUrl)}" style="color:#007da3; text-decoration:none; font-weight:600; display:inline-block; margin-top:10px;">${escapeHtml(s.data.ctaText)}</a>
</td>`;
      const imgCell = `
<td valign="top" width="285"><img src="${s.data.imgA}" width="285" height="185" alt="" style="display:block; border:0; width:285px; height:185px;"></td>`;
      return `
${titleRow}
<tr>
  ${leftImg ? imgCell : textCell}
  <td width="30"></td>
  ${leftImg ? textCell : imgCell}
</tr>
${spacerRow(32)}`;
    }

    case 'cards': {
      const c1 = s.data.card1, c2 = s.data.card2;
      const col = (c) => `
<td valign="top" width="285">
  <img src="${c.img}" width="285" height="185" alt="" style="display:block; border:0; width:285px; height:185px;">
  <div class="arial" style="font-size:14px; line-height:18px; color:#333333;">
    <div style="font-size:18px; line-height:20px; font-weight:bold; margin:10px 0; color:#111111;">${escapeHtml(c.title)}</div>
    <div>${escapeHtml(c.body)}</div>
    <a href="${escapeHtml(c.ctaUrl)}" style="color:#007da3; text-decoration:none; font-weight:600; display:inline-block; margin-top:10px;">${escapeHtml(c.ctaText)}</a>
  </div>
</td>`;
      return `
<tr>
  ${col(c1)}
  <td width="30"></td>
  ${col(c2)}
</tr>
${spacerRow(32)}`;
    }

   case 'spotlight': {
  const bg = s.data.bg || '#fbe232';
  const fg = s.data.fg || '#000000';
  const eyebrow = escapeHtml(s.data.eyebrow || 'EYEBROW');
  const title   = escapeHtml(s.data.title   || '[Spotlight Title]');
  const body    = escapeHtml(s.data.body    || '[Short supporting copy.]');
  const img     = s.data.imgA || 'https://placehold.co/180x200/png';
  const ctaText = s.data.ctaText || '';
  const ctaUrl  = s.data.ctaUrl  || '';
  const cta = (ctaText && ctaUrl)
    ? `<br><a href="${escapeHtml(ctaUrl)}" style="color:#000000; text-decoration:underline;">${escapeHtml(ctaText)}</a>`
    : '';

  // Full-width (of the inner 580px table) spotlight band with background
  return `
<tr>
  <td>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:${bg};">
      <tr>
        <td style="padding:16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; color:${fg};">
            <tr>
              <td valign="top" width="180" style="width:180px; padding-right:20px;">
                <img src="${img}" width="180" height="200" alt="" style="display:block; border:0; width:180px; height:200px;">
              </td>
              <td valign="top">
                <div style="font-size:12px; line-height:16px; font-weight:bold; letter-spacing:0.03em; text-transform:uppercase; color:${fg}; margin:10px 0 10px 0;">${eyebrow}</div>
                <div style="font-size:18px; line-height:20px; font-weight:bold; color:${fg}; margin:10px 0 10px 0;">${title}</div>
                <div style="font-size:14px; line-height:18px; color:${fg};">${body}${cta}<br></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr><td style="height:24px; line-height:0; font-size:0;">&nbsp;</td></tr>
`;
}


    case 'footer':
      return `
<tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#161616; color:#ffffff; text-align:center; padding:36px 16px;">
      <div style="font-size:14px; line-height:20px; margin:10px 0;"><strong>${escapeHtml(s.data.logo)}</strong></div>
      <div style="font-size:12px; line-height:18px; margin:10px 0;">${escapeHtml(s.data.fourCs)}</div>
    </td></tr>
  </table>
</td></tr>`;

    case 'feedback':
      return `
<tr><td class="arial" style="text-align:center; padding:24px 0 32px 0; font-size:13px; line-height:20px; color:#333333;">
  <strong>Questions? Ideas? Feedback?</strong><br>We’d love to hear it — please email <a href="mailto:${escapeHtml(s.data.email)}" style="color:#007da3; text-decoration:none; font-weight:600;">${escapeHtml(s.data.email)}</a>
</td></tr>`;
  }
  return '';
}

// ==== INIT ====
render();
