/* State */
const state = {
  theme: { accent: THEME.accent, maxw: THEME.width },
  sections: [],
  cur: -1,
  lastOpened: -1
};

/* DOM refs */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const listEl = $('#list');
const previewEl = $('#preview');
const editorEl = $('#editor');
const currentEl = $('#currentSection');

/* Helpers */
const objectUrls = new Set();
function fileToObjectURL(file){
  const url = URL.createObjectURL(file);
  objectUrls.add(url);
  return url;
}
function replaceUrl(oldU, newU){
  if (oldU && objectUrls.has(oldU)) { URL.revokeObjectURL(oldU); objectUrls.delete(oldU); }
  return newU;
}
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c])); }
function normUrl(u){ if(!u) return u; if(/^https?:\/\//i.test(u)) return u; return 'https://' + u.replace(/^\/+/, ''); }

/* Adders (top bar) */
// Button actions
document.querySelectorAll("[data-add]").forEach(btn => {
  btn.addEventListener("click", () => addSection(btn.dataset.add));
});

function addSection(type) {
  const schemaItem = schema[type];
  if (!schemaItem) return alert(`Unknown section type: ${type}`);
  const newSection = JSON.parse(JSON.stringify(schemaItem.defaults));
  state.sections.push({ type, data: newSection });
  render();
}

/* Export button */
$('#exportHtml').addEventListener('click', ()=>{
  const html = buildExport();
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'newsletter-export.html'; a.click();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
});

/* Theme controls */
$('#applyTheme').addEventListener('click', ()=>{
  const hex = $('#accentColor').value.trim() || THEME.accent;
  const w = Math.max(480, Math.min(800, parseInt($('#maxWidth').value,10) || THEME.width));
  state.theme.accent = hex;
  state.theme.maxw = w;
  document.documentElement.style.setProperty('--maxw', `${w}px`);
  document.documentElement.style.setProperty('--accent', hex);
  renderPreview();
});

/* Apply changes from editor */
$('#apply').addEventListener('click', async ()=>{
  if (state.cur < 0) return;
  const s = state.sections[state.cur];

  const title = $('#titleInput').value.trim();
  const eyebrow = $('#eyebrowInput').value.trim();
  const body = $('#bodyInput').value.trim();
  const ctaT = $('#ctaText').value.trim();
  const ctaUraw = $('#ctaUrl').value.trim();
  const ctaU = ctaUraw ? normUrl(ctaUraw) : '';
  const label = $('#dividerText').value.trim();
  const bg = $('#bgColor').value.trim();
  const fg = $('#fgColor').value.trim();
  const flip = $('#flip5050').checked;

  async function pick(fileId, urlId){
    const fi = $(fileId), fu = $(urlId);
    if (fi && fi.files && fi.files[0]) return fileToObjectURL(fi.files[0]);
    if (fu && fu.value.trim()) return fu.value.trim();
    return null;
    }

  switch(s.type){
    case 'banner': {
      const img = await pick('#imgAFile','#imgAUrl');
      if (img) s.data.src = replaceUrl(s.data.src, img);
      break;
    }
    case 'textonly': {
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      s.data.ctaText = ctaT; s.data.ctaUrl = ctaU;
      break;
    }
    case 'divider': {
      if (label) s.data.label = label;
      break;
    }
    case 'textImgR':
    case 'imgTextL':
    case 's5050':
    case 's5050flip': {
      if (title) s.data.title = title;
      if (body) s.data.body = body;
      s.data.ctaText = ctaT; s.data.ctaUrl = ctaU;
      const imgA = await pick('#imgAFile','#imgAUrl'); if (imgA) s.data.imgA = replaceUrl(s.data.imgA, imgA);
      if (s.type.startsWith('s5050')) s.data.flip = flip;
      break;
    }
    case 'cards': {
      if (title) s.data.left.title = title; // convenience: edit left quickly; duplicate if needed
      if (body)  s.data.left.body  = body;
      if (ctaT)  s.data.left.ctaText = ctaT;
      if (ctaU)  s.data.left.ctaUrl  = ctaU;
      const img1 = await pick('#imgAFile','#imgAUrl'); if (img1) s.data.left.img = replaceUrl(s.data.left.img, img1);
      break;
    }
    case 'twoThumbs': {
      if (title) s.data.left.title = title;
      if (body)  s.data.left.body  = body;
      if (ctaT)  s.data.left.ctaText = ctaT;
      if (ctaU)  s.data.left.ctaUrl  = ctaU;
      const img2 = await pick('#imgAFile','#imgAUrl'); if (img2) s.data.left.img = replaceUrl(s.data.left.img, img2);
      break;
    }
    case 'spotlight': {
      if (eyebrow) s.data.eyebrow = eyebrow;
      if (title)   s.data.title = title;
      if (body)    s.data.body  = body;
      s.data.ctaText = ctaT; s.data.ctaUrl = ctaU;
      if (bg) s.data.bg = bg;
      if (fg) s.data.color = fg;
      break;
    }
    case 'footer': {
      if (title) s.data.logo = title;
      if (body)  s.data.fourCs = body;
      break;
    }
    case 'feedback': {
      if (title) s.data.lead = title;
      if (body)  s.data.body = body;
      if (ctaU)  s.data.email = ctaU;
      break;
    }
  }
  render();
});

/* Editor visibility per type */
function openEditor(idx){
  const s = state.sections[idx];
  editorEl.classList.remove('hidden');
  currentEl.textContent = `${idx+1}. ${TYPES[s.type]||s.type}`;

  // Hide all contextual fields
  $$('.contextual').forEach(el=>el.classList.add('hidden'));

  // Show only required fields
  if (s.type==='banner'){ $('.imgA-field').classList.remove('hidden'); }
  else if (s.type==='textonly'){ $('.title-field').classList.remove('hidden'); $('.body-field').classList.remove('hidden'); $('.cta-row').classList.remove('hidden'); }
  else if (s.type==='divider'){ $('.divider-field').classList.remove('hidden'); }
  else if (['textImgR','imgTextL','s5050','s5050flip'].includes(s.type)){
    $('.title-field').classList.remove('hidden'); $('.body-field').classList.remove('hidden'); $('.cta-row').classList.remove('hidden'); $('.imgA-field').classList.remove('hidden');
    $('.flip-row').classList.remove('hidden');
  }
  else if (s.type==='cards' || s.type==='twoThumbs'){ $('.title-field').classList.remove('hidden'); $('.body-field').classList.remove('hidden'); $('.cta-row').classList.remove('hidden'); $('.imgA-field').classList.remove('hidden'); }
  else if (s.type==='spotlight'){ $('.eyebrow-field').classList.remove('hidden'); $('.title-field').classList.remove('hidden'); $('.body-field').classList.remove('hidden'); $('.cta-row').classList.remove('hidden'); $('.bgcolor-row').classList.remove('hidden'); }
  else if (['footer','feedback'].includes(s.type)){ $('.title-field').classList.remove('hidden'); $('.body-field').classList.remove('hidden'); if(s.type==='feedback') $('.cta-row').classList.remove('hidden'); }

  // Populate
  $('#titleInput').value   = s.data.title || s.data.label || s.data.lead || '';
  $('#eyebrowInput').value = s.data.eyebrow || '';
  $('#bodyInput').value    = s.data.body || '';
  $('#ctaText').value      = s.data.ctaText || '';
  $('#ctaUrl').value       = s.data.ctaUrl || s.data.email || '';
  $('#dividerText').value  = s.data.label || '';
  $('#bgColor').value      = s.data.bg || '#fbe232';
  $('#fgColor').value      = s.data.color || '#000000';
  $('#imgAUrl').value      = s.data.imgA || s.data.src || '';
  $('#flip5050').checked   = !!s.data.flip;
}

/* List rendering (no per-item handlers; delegated) */
function renderList(){
  listEl.innerHTML = state.sections.map((s,i)=>`
    <div class="card" data-i="${i}" draggable="true">
      <h3>${i+1}. ${TYPES[s.type]||s.type}</h3>
      <div class="mini">
        <button class="btn ghost" data-act="up">↑</button>
        <button class="btn ghost" data-act="down">↓</button>
        <button class="btn ghost" data-act="del">Delete</button>
      </div>
    </div>
  `).join('') || '<div class="card"><h3>Add sections with the buttons above.</h3></div>';
}

/* Delegated list events */
(function initListDelegation(){
  listEl.addEventListener('click', (e)=>{
    const card = e.target.closest('.card[data-i]');
    if (!card) return;
    const i = +card.dataset.i;
    const act = e.target.dataset.act;
    if (act==='del'){ state.sections.splice(i,1); if(state.cur===i) state.cur=-1; render(); return; }
    if (act==='up' && i>0){ const [m]=state.sections.splice(i,1); state.sections.splice(i-1,0,m); state.cur=i-1; render(); return; }
    if (act==='down' && i<state.sections.length-1){ const [m]=state.sections.splice(i,1); state.sections.splice(i+1,0,m); state.cur=i+1; render(); return; }
    // select
    state.cur = i; openEditor(i);
  });
  // DnD
  let dragIdx = null;
  listEl.addEventListener('dragstart', (e)=>{
    const card = e.target.closest('.card[data-i]'); if(!card) return;
    dragIdx = +card.dataset.i; card.classList.add('dragging');
    try{ e.dataTransfer.setData('text/plain', dragIdx); }catch{}
    e.dataTransfer.effectAllowed = 'move';
  });
  listEl.addEventListener('dragend', (e)=>{
    const card = e.target.closest('.card[data-i]'); if(card) card.classList.remove('dragging');
  });
  listEl.addEventListener('dragover', (e)=>{
    const over = e.target.closest('.card[data-i]'); if(!over) return;
    e.preventDefault(); over.classList.add('drop-target');
  });
  listEl.addEventListener('dragleave', (e)=>{
    const over = e.target.closest('.card[data-i]'); if(over) over.classList.remove('drop-target');
  });
  listEl.addEventListener('drop', (e)=>{
    const over = e.target.closest('.card[data-i]'); if(!over) return;
    e.preventDefault(); over.classList.remove('drop-target');
    const overIdx = +over.dataset.i;
    if (dragIdx===null || overIdx===dragIdx) return;
    const [m] = state.sections.splice(dragIdx,1);
    state.sections.splice(overIdx,0,m);
    state.cur = overIdx; dragIdx = null;
    render();
  });
})();

/* Preview renderer */
function toPreview(s){
  const half = THEME.sizes.half, card = THEME.sizes.card, spot = THEME.sizes.spot;
  switch(s.type){
    case 'banner':
      return `<table><tr><td><img class="banner" src="${s.data.src}" alt="${esc(s.data.alt||'')}" width="${THEME.width}" height="${THEME.sizes.banner.h}"></td></tr></table><div class="sp32"></div>`;
    case 'textonly': {
      const cta = (s.data.ctaText && s.data.ctaUrl) ? `<a href="${esc(s.data.ctaUrl)}">${esc(s.data.ctaText)}</a>` : '';
      return `<table><tr><td class="txt">
        <h1 class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.title)}</h1>
        <div>${esc(s.data.body)}</div>${cta}
      </td></tr></table><div class="sp32"></div>`;
    }
    case 'divider':
      return `<div class="divider">${esc(s.data.label)}</div><div class="sp32"></div>`;
    case 'textImgR': {
      return `<table><tr>
        <td class="txt" style="width:${THEME.width - half.w - 30}px; padding-right:30px;">
          <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.title)}</div>
          <div>${esc(s.data.body)}</div>
          <a href="${esc(s.data.ctaUrl)}">${esc(s.data.ctaText)}</a>
        </td>
        <td style="width:${half.w}px" align="right">
          <img class="thumb285x185" src="${s.data.imgA}" width="${half.w}" height="${half.h}" alt="">
        </td>
      </tr></table><div class="sp32"></div>`;
    }
    case 'imgTextL': {
      return `<table><tr>
        <td style="width:${half.w}px; padding-right:30px;">
          <img class="thumb285x185" src="${s.data.imgA}" width="${half.w}" height="${half.h}" alt="">
        </td>
        <td class="txt" style="width:${THEME.width - half.w - 30}px;">
          <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.title)}</div>
          <div>${esc(s.data.body)}</div>
          <a href="${esc(s.data.ctaUrl)}">${esc(s.data.ctaText)}</a>
        </td>
      </tr></table><div class="sp32"></div>`;
    }
    case 's5050':
    case 's5050flip': {
      const leftTxt = `<td class="txt" style="width:${half.w}px; padding-right:30px;">
        <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.title)}</div>
        <div>${esc(s.data.body)}</div>
        <a href="${esc(s.data.ctaUrl)}">${esc(s.data.ctaText)}</a>
      </td>`;
      const rightImg = `<td style="width:${half.w}px;">
        <img class="thumb285x185" src="${s.data.imgA}" width="${half.w}" height="${half.h}" alt="">
      </td>`;
      const row = (s.data.flip ? `${rightImg}${leftTxt}` : `${leftTxt}${rightImg}`);
      return `<table><tr>${row}</tr></table><div class="sp32"></div>`;
    }
    case 'cards': {
      return `<table><tr>
          <td style="width:${card.w}px; padding-right:30px;">
            <img class="thumb285x185" src="${s.data.left.img}" width="${card.w}" height="${card.h}" alt="">
            <div class="txt">
              <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.left.title)}</div>
              <div>${esc(s.data.left.body)}</div>
              <a href="${esc(s.data.left.ctaUrl)}">${esc(s.data.left.ctaText)}</a>
            </div>
          </td>
          <td style="width:${card.w}px;">
            <img class="thumb285x185" src="${s.data.right.img}" width="${card.w}" height="${card.h}" alt="">
            <div class="txt">
              <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.right.title)}</div>
              <div>${esc(s.data.right.body)}</div>
              <a href="${esc(s.data.right.ctaUrl)}">${esc(s.data.right.ctaText)}</a>
            </div>
          </td>
        </tr></table><div class="sp32"></div>`;
    }
    case 'twoThumbs': {
      // (kept original 284x164 pattern)
      return `<table><tr>
        <td style="width:284px; padding-right:30px;">
          <img src="${s.data.left.img}" width="284" height="164" alt="">
          <div class="txt">
            <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.left.title)}</div>
            <div>${esc(s.data.left.body)}</div>
            <a href="${esc(s.data.left.ctaUrl)}">${esc(s.data.left.ctaText)}</a>
          </div>
        </td>
        <td style="width:284px;">
          <img src="${s.data.right.img}" width="284" height="164" alt="">
          <div class="txt">
            <div class="title" style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;">${esc(s.data.right.title)}</div>
            <div>${esc(s.data.right.body)}</div>
            <a href="${esc(s.data.right.ctaUrl)}">${esc(s.data.right.ctaText)}</a>
          </div>
        </td>
      </tr></table><div class="sp32"></div>`;
    }
 case "spotlight":
  return `<table><tr>
    <td style="width:180px; padding-right:30px;" class="img-target" data-key="imgA" data-idx="${index}">
      <img src="${s.data.imgA}" width="180" height="237" alt="">
    </td>
    <td class="txt" style="background:${s.data.bg}; color:${s.data.textColor}; padding:20px;">
      <div style="text-transform:uppercase; font-size:13px; margin-bottom:6px;">${escapeHtml(s.data.eyebrow)}</div>
      <div class="title">${escapeHtml(s.data.title)}</div>
      ${escapeHtml(s.data.body)}
      <br><a href="${escapeHtml(s.data.ctaUrl)}" style="color:#000;">${escapeHtml(s.data.ctaText)}</a>
    </td>
  </tr></table><div class="spacer32"></div>`;

    }
    case 'footer':
      return `<table><tr><td style="background:#161616; color:#fff; text-align:center; padding:36px 16px;">
        <div style="font-size:14px; line-height:20px; margin-bottom:8px;"><strong>${esc(s.data.logo)}</strong></div>
        <div style="font-size:12px; line-height:18px;">${esc(s.data.fourCs||"[4c's]")}</div>
      </td></tr></table>`;
    case 'feedback':
      return `<div style="text-align:center; padding:24px 0 32px 0;">
        <strong>${esc(s.data.lead)}</strong><br>
        We’d love to hear it — please email <a href="mailto:${esc(s.data.email)}">${esc(s.data.email)}</a>
      </div>`;
  }
  return '';
}

function renderPreview(){
  previewEl.innerHTML = state.sections.map(toPreview).join('');
  document.documentElement.style.setProperty('--maxw', `${state.theme.maxw}px`);
  document.documentElement.style.setProperty('--accent', state.theme.accent);
}

function render(){
  renderList();
  renderPreview();
  if (state.cur !== -1 && state.cur !== state.lastOpened){
    openEditor(state.cur);
    state.lastOpened = state.cur;
  }
}

/* Export builder (Outlook-safe, tables) */
function toOutlookHtml(s){
  const half = THEME.sizes.half, card = THEME.sizes.card;
  switch(s.type){
    case 'banner':
      return `<tr><td align="center" style="padding:0;"><img src="${s.data.src}" width="${THEME.width}" height="${THEME.sizes.banner.h}" alt="${esc(s.data.alt||'')}" style="display:block;border:0;width:100%;height:${THEME.sizes.banner.h}px;"></td></tr>
<tr><td style="height:24px;line-height:0;font-size:0;">&nbsp;</td></tr>`;
    case 'textonly': {
      const cta = (s.data.ctaText && s.data.ctaUrl) ? `<a href="${esc(s.data.ctaUrl)}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.ctaText)}</a>` : '';
      return `<tr><td style="padding:0 0 24px 0; font-family:Arial,Helvetica,sans-serif; font-size:${THEME.body.fs}px; line-height:${THEME.body.lh}px; color:#333;">
  <div style="font-size:${THEME.title.fs}px; line-height:${THEME.title.lh}px; font-weight:bold; margin:10px 0; color:#111;">${esc(s.data.title)}</div>
  <div>${esc(s.data.body)}</div>${cta}
</td></tr>`;
    }
    case 'divider':
      return `<tr><td><table role="presentation" width="100%"><tr><td style="background-color:${state.theme.accent};color:#000;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;text-transform:uppercase;font-weight:bold;padding:6px 10px;">${esc(s.data.label)}</td></tr></table></td></tr>
<tr><td style="height:24px;line-height:0;font-size:0;">&nbsp;</td></tr>`;
    case 'textImgR':
      return `<tr><td style="padding:0 0 24px 0;"><table role="presentation" width="100%"><tr>
<td valign="top" width="${THEME.width - half.w - 30}" style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;padding-right:30px;">
  <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.title)}</div>
  <div>${esc(s.data.body)}</div>
  <a href="${esc(s.data.ctaUrl)}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.ctaText)}</a>
</td>
<td valign="top" width="${half.w}" align="right"><img src="${s.data.imgA}" width="${half.w}" height="${half.h}" alt="" style="display:block;border:0;width:${half.w}px;height:${half.h}px;"></td>
</tr></table></td></tr>`;
    case 'imgTextL':
      return `<tr><td style="padding:0 0 24px 0;"><table role="presentation" width="100%"><tr>
<td valign="top" width="${half.w}" align="left" style="padding-right:30px;"><img src="${s.data.imgA}" width="${half.w}" height="${half.h}" alt="" style="display:block;border:0;width:${half.w}px;height:${half.h}px;"></td>
<td valign="top" width="${THEME.width - half.w - 30}" style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;">
  <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.title)}</div>
  <div>${esc(s.data.body)}</div>
  <a href="${esc(s.data.ctaUrl)}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.ctaText)}</a>
</td>
</tr></table></td></tr>`;
    case 's5050':
    case 's5050flip': {
      const txt = `<td valign="top" width="${half.w}" style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;${s.data.flip?'':'padding-right:30px;'}">
  <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.title)}</div>
  <div>${esc(s.data.body)}</div>
  <a href="${esc(s.data.ctaUrl)}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.ctaText)}</a>
</td>`;
      const img = `<td valign="top" width="${half.w}" ${s.data.flip?'style="padding-right:30px;"':''}><img src="${s.data.imgA}" width="${half.w}" height="${half.h}" alt="" style="display:block;border:0;width:${half.w}px;height:${half.h}px;"></td>`;
      const row = s.data.flip ? `${img}${txt}` : `${txt}${img}`;
      return `<tr><td style="padding:0 0 24px 0;"><table role="presentation" width="100%"><tr>${row}</tr></table></td></tr>`;
    }
    case 'cards':
      return `<tr><td><table role="presentation" width="100%"><tr><td style="background-color:${state.theme.accent};color:#000;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;text-transform:uppercase;font-weight:bold;padding:6px 10px;">Spotlight Features</td></tr></table></td></tr>
<tr><td style="height:24px;line-height:0;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:0 0 24px 0;"><table role="presentation" width="100%"><tr>
<td valign="top" width="${card.w}" style="padding-right:30px;">
  <img src="${s.data.left.img}" width="${card.w}" height="${card.h}" alt="" style="display:block;border:0;width:${card.w}px;height:${card.h}px;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;">
    <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.left.title)}</div>
    <div>${esc(s.data.left.body)}</div>
    <a href="${esc(s.data.left.ctaUrl)}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.left.ctaText)}</a>
  </div>
</td>
<td valign="top" width="${card.w}">
  <img src="${s.data.right.img}" width="${card.w}" height="${card.h}" alt="" style="display:block;border:0;width:${card.w}px;height:${card.h}px;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;">
    <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.right.title)}</div>
    <div>${esc(s.data.right.body)}</div>
    <a href="${esc(s.data.right.ctaUrl)}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.right.ctaText)}</a>
  </div>
</td>
</tr></table></td></tr>`;
    case 'twoThumbs':
      return `<tr><td style="padding:0 0 24px 0;"><table role="presentation" width="100%"><tr>
<td valign="top" width="284" style="padding-right:30px;">
  <img src="${s.data.left.img}" width="284" height="164" alt="" style="display:block;border:0;width:284px;height:164px;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;">
    <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.left.title)}</div>
    <div>${esc(s.data.left.body)}</div>
    <a href="${s.data.left.ctaUrl}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.left.ctaText)}</a>
  </div>
</td>
<td valign="top" width="284">
  <img src="${s.data.right.img}" width="284" height="164" alt="" style="display:block;border:0;width:284px;height:164px;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:#333;">
    <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:#111;">${esc(s.data.right.title)}</div>
    <div>${esc(s.data.right.body)}</div>
    <a href="${s.data.right.ctaUrl}" style="display:inline-block;margin-top:10px;color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.right.ctaText)}</a>
  </div>
</td>
</tr></table></td></tr>`;
    case 'spotlight':
      return `<tr><td class="spotlight" style="background:${esc(s.data.bg)}; color:${esc(s.data.color)}; padding:24px; font-family:Arial,Helvetica,sans-serif;">
  ${s.data.eyebrow ? `<div style="font-size:12px;font-weight:bold;text-transform:uppercase;margin-bottom:4px;color:${esc(s.data.color)}">${esc(s.data.eyebrow)}</div>` : ''}
  <div style="font-size:${THEME.title.fs}px;line-height:${THEME.title.lh}px;font-weight:bold;margin:10px 0;color:${esc(s.data.color)}">${esc(s.data.title)}</div>
  <div style="font-size:${THEME.body.fs}px;line-height:${THEME.body.lh}px;color:${esc(s.data.color)}">${esc(s.data.body)}</div>
  ${s.data.ctaText ? `<a href="${esc(s.data.ctaUrl)}" style="display:inline-block;margin-top:10px;color:#000;font-weight:600;text-decoration:none;">${esc(s.data.ctaText)}</a>` : ''}
</td></tr>
<tr><td style="height:24px;line-height:0;font-size:0;">&nbsp;</td></tr>`;
    case 'footer':
      return `<tr><td style="padding:0;"><table role="presentation" width="100%"><tr>
<td style="background:#161616;color:#fff;text-align:center;padding:36px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="font-size:14px;line-height:20px;margin-bottom:8px;"><strong>${esc(s.data.logo)}</strong></div>
  <div style="font-size:12px;line-height:18px;">${esc(s.data.fourCs||"[4c's]")}</div>
</td>
</tr></table></td></tr>`;
    case 'feedback':
      return `<tr><td style="padding:24px 0 32px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#333;">
<strong>${esc(s.data.lead)}</strong><br>We’d love to hear it — please email <a href="mailto:${esc(s.data.email)}" style="color:${THEME.ctaColor};font-weight:600;text-decoration:none;">${esc(s.data.email)}</a>
</td></tr>`;
  }
  return '';
}

function buildExport(){
  const rows = state.sections.map(toOutlookHtml).join('');
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter Export</title>
<!--[if mso]><style>*{font-family:Arial, sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center" style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${state.theme.maxw}" style="width:${state.theme.maxw}px;max-width:${state.theme.maxw}px;background-color:#ffffff;border-collapse:collapse;">
        ${rows}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* Init */
function boot(){
  // Start with a couple of helpful defaults
  state.sections.push(factory('banner'));
  state.sections.push(factory('divider'));
  state.sections.push(factory('textonly'));
  render();
}
boot();
