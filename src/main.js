// ====== main.js (stabilized) ======

// ---- Placeholders (safe defaults) ----
const PH = {
  banner:   'https://placehold.co/600x200/png',
  c:        'https://placehold.co/285x185/png',   // 2-cards & 50/50 thumbs
  half:     'https://placehold.co/285x185/png',   // 50/50 thumbs
  spotlight:'https://placehold.co/180x237/png'    // Spotlight thumb
};

// ---- Global state ----
const state = {
  sections: [],   // { type, data }
  selected: null
};

// ---- Utils ----
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- DOM ----
const previewEl = document.getElementById('preview');
const editorPane = document.getElementById('editor'); // shown by your UI if needed

// ---- Add section buttons ----
document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const type = e.currentTarget.dataset.add;
    addSection(type);
    render();
  });
});

// ---- Export button ----
document.getElementById('exportHtml')?.addEventListener('click', () => {
  const html = buildExport();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'newsletter-export.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---- Section creators (safe shapes) ----
function addSection(type) {
  switch (type) {
    case 'banner':
      state.sections.push({ type, data: { src: PH.banner, alt: 'Banner' } });
      break;

    case 'textonly':
      state.sections.push({
        type,
        data: {
          title: '[Headline]',
          body:  '[Introductory paragraph text goes here.]',
          ctaText: 'Learn more →',
          ctaUrl:  '#'
        }
      });
      break;

    case 'divider':
      state.sections.push({ type, data: { label: 'SECTION TITLE' } });
      break;

    case 's5050':
      state.sections.push({
        type,
        data: {
          title: '[50/50 Title]',
          img: PH.half,
          body: '[Supporting copy in the right column.]',
          ctaText: 'Learn more →',
          ctaUrl:  '#',
          flip: false
        }
      });
      break;

    case 's5050flip':
      state.sections.push({
        type: 's5050', // use same renderer with flip=true
        data: {
          title: '[50/50 Title]',
          img: PH.half,
          body: '[Supporting copy in the left column.]',
          ctaText: 'Learn more →',
          ctaUrl:  '#',
          flip: true
        }
      });
      break;

    case 'cards':
      state.sections.push({
        type,
        data: {
          card1: {
            img: PH.c,
            title: '[Card One Title]',
            body:  '[Short supporting copy — one or two lines.]',
            ctaText: 'Details →',
            ctaUrl:  '#'
          },
          card2: {
            img: PH.c,
            title: '[Card Two Title]',
            body:  '[Short supporting copy — one or two lines.]',
            ctaText: 'Details →',
            ctaUrl:  '#'
          }
        }
      });
      break;

    case 'spotlight':
      state.sections.push({
        type,
        data: {
          eyebrow: 'EYEBROW',
          title:   '[Spotlight Title]',
          body:    '[A compact summary for the spotlight.]',
          ctaText: 'Learn more →', // spotlight CTA styled black in export
          ctaUrl:  '#',
          img:     PH.spotlight,
          bg:      '#fbe232',
          fg:      '#000000'
        }
      });
      break;

    case 'footer':
      state.sections.push({ type, data: { logo: '[Logo]', fourCs: "[4c's]" } });
      break;

    case 'feedback':
      state.sections.push({
        type,
        data: { lead: 'Questions? Ideas? Feedback?', email: 'name@email.com' }
      });
      break;

    // Ignore unknown types safely
    default:
      console.warn('Unknown section type:', type);
      break;
  }
}

// ---- Renderers (Preview) ----
function render() {
  renderPreview();
}

function renderPreview() {
  try {
    const html = state.sections.map(s => toPreview(s)).join('');
    previewEl.innerHTML = html;
  } catch (err) {
    console.error('Preview render error:', err);
    previewEl.innerHTML = '<div style="padding:12px;color:#c00;font:14px Arial;">Preview error — see console.</div>';
  }
}

function toPreview(s) {
  switch (s.type) {

    case 'banner': {
      const src = (s.data && s.data.src) || PH.banner;
      const alt = (s.data && s.data.alt) || 'Banner';
      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;">' +
        '<tr><td style="padding:0;"><img src="' + src + '" width="600" height="200" alt="' + escapeHtml(alt) + '" style="display:block;width:600px;height:200px;border:0;"></td></tr>' +
        '</table><div style="height:24px;"></div>'
      );
    }

    case 'textonly': {
      const d = s.data || {};
      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;">' +
        '<tr><td style="font:14px/18px Arial;color:#333;padding:0;">' +
        '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(d.title || '') + '</div>' +
        '<div>' + escapeHtml(d.body || '') + '</div>' +
        '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#007da3;text-decoration:none;display:inline-block;margin-top:10px;">' +
        escapeHtml(d.ctaText || '') + '</a></div>' +
        '</td></tr></table><div style="height:24px;"></div>'
      );
    }

    case 'divider': {
      const label = (s.data && s.data.label) || 'SECTION TITLE';
      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;">' +
        '<tr><td style="background:#FBE232;color:#000;font:13px/18px Arial;font-weight:bold;text-transform:uppercase;padding:6px 10px;">' +
        escapeHtml(label) + '</td></tr></table><div style="height:24px;"></div>'
      );
    }

    case 's5050': {
      const d = s.data || {};
      const leftFirst = !!d.flip; // if flip=true, text left / image right
      const textTd =
        '<td width="285" valign="top" style="padding:' + (leftFirst ? '0 30px 0 0' : '0') + ';font:14px/18px Arial;color:#333;">' +
          '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(d.title || '') + '</div>' +
          (leftFirst ? (escapeHtml(d.body || '') +
           '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#007da3;text-decoration:none;display:inline-block;margin-top:10px;">' +
           escapeHtml(d.ctaText || '') + '</a></div>') : '') +
        '</td>';

      const imgTd =
        '<td width="285" valign="top" style="padding:' + (!leftFirst ? '0 30px 0 0' : '0') + ';">' +
          '<img src="' + (d.img || PH.half) + '" width="285" height="185" alt="" style="display:block;width:285px;height:185px;border:0;">' +
          (!leftFirst ? (
            '<div style="font:14px/18px Arial;color:#333;margin-top:0;">' +
              escapeHtml(d.body || '') +
              '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#007da3;text-decoration:none;display:inline-block;margin-top:10px;">' +
              escapeHtml(d.ctaText || '') + '</a></div>' +
            '</div>'
          ) : '') +
        '</td>';

      const row =
        '<tr>' + (leftFirst ? (textTd + imgTd) : (imgTd + textTd)) + '</tr>';

      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;table-layout:fixed;border-collapse:collapse;">' +
        row +
        '</table><div style="height:24px;"></div>'
      );
    }

    case 'cards': {
      const d  = s.data || {};
      const c1 = Object.assign(
        { img: PH.c, title: '[Card One Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
        d.card1 || {}
      );
      const c2 = Object.assign(
        { img: PH.c, title: '[Card Two Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
        d.card2 || {}
      );
      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;table-layout:fixed;border-collapse:collapse;">' +
          '<tr>' +
            '<td width="285" valign="top" style="padding:0 30px 0 0;">' +
              '<img src="' + c1.img + '" width="285" height="185" alt="" style="display:block;width:285px;height:185px;border:0;">' +
              '<div style="font:14px/18px Arial;color:#333;">' +
                '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(c1.title) + '</div>' +
                escapeHtml(c1.body) +
                '<div><a href="' + escapeHtml(c1.ctaUrl) + '" style="color:#007da3;text-decoration:none;display:inline-block;margin-top:10px;">' + escapeHtml(c1.ctaText) + '</a></div>' +
              '</div>' +
            '</td>' +
            '<td width="285" valign="top" style="padding:0;">' +
              '<img src="' + c2.img + '" width="285" height="185" alt="" style="display:block;width:285px;height:185px;border:0;">' +
              '<div style="font:14px/18px Arial;color:#333;">' +
                '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(c2.title) + '</div>' +
                escapeHtml(c2.body) +
                '<div><a href="' + escapeHtml(c2.ctaUrl) + '" style="color:#007da3;text-decoration:none;display:inline-block;margin-top:10px;">' + escapeHtml(c2.ctaText) + '</a></div>' +
              '</div>' +
            '</td>' +
          '</tr>' +
        '</table><div style="height:24px;"></div>'
      );
    }

    case 'spotlight': {
      const d = s.data || {};
      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;background:' + (d.bg || '#fbe232') + ';color:' + (d.fg || '#000') + ';">' +
          '<tr>' +
            '<td width="180" valign="top" style="padding:16px;">' +
              '<img src="' + (d.img || PH.spotlight) + '" width="180" height="237" alt="" style="display:block;width:180px;height:237px;border:0;">' +
            '</td>' +
            '<td valign="top" style="padding:16px;font:14px/18px Arial;color:' + (d.fg || '#000') + ';">' +
              '<div style="font:12px/14px Arial;letter-spacing:.04em;text-transform:uppercase;margin:10px 0;">' + escapeHtml(d.eyebrow || 'EYEBROW') + '</div>' +
              '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(d.title || '') + '</div>' +
              '<div>' + escapeHtml(d.body || '') + '</div>' +
              '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#000;text-decoration:none;display:inline-block;margin-top:10px;">' + escapeHtml(d.ctaText || '') + '</a></div>' +
            '</td>' +
          '</tr>' +
        '</table><div style="height:24px;"></div>'
      );
    }

    case 'footer': {
      const d = s.data || {};
      return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;">' +
        '<tr><td style="background:#161616;color:#fff;text-align:center;padding:36px 16px;font:14px/20px Arial;">' +
        '<div><strong>' + escapeHtml(d.logo || '[Logo]') + '</strong></div>' +
        '<div style="font:12px/18px Arial;margin-top:6px;">' + escapeHtml(d.fourCs || "[4c's]") + '</div>' +
        '</td></tr></table>'
      );
    }

    case 'feedback': {
      const d = s.data || {};
      return (
        '<div style="text-align:center;padding:24px 0 32px 0;color:#333;font:13px/20px Arial;">' +
        '<strong>' + escapeHtml(d.lead || 'Questions? Ideas? Feedback?') + '</strong><br>' +
        'We’d love to hear it — please email <a href="mailto:' + escapeHtml(d.email || 'name@email.com') + '" style="color:#007da3;text-decoration:none;">' +
        escapeHtml(d.email || 'name@email.com') + '</a></div>'
      );
    }

    default:
      return '';
  }
}

// ---- Export (Outlook-friendly) ----
function buildExport() {
  const rows = state.sections.map(s => toExportRow(s)).join('');
  return (
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter Export</title>
<!--[if mso]><style>*{font-family:Arial, sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center" style="padding:20px;">
      <!-- outer border with inner padding -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:620px;border:1px solid #e5e5e5;">
        <tr><td style="padding:10px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;">
            ${rows}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  );
}

function toExportRow(s) {
  switch (s.type) {

    case 'banner': {
      const src = (s.data && s.data.src) || PH.banner;
      const alt = (s.data && s.data.alt) || 'Banner';
      return (
        '<tr><td style="padding:0;"><img src="' + src + '" width="600" height="200" alt="' + escapeHtml(alt) + '" style="display:block;width:600px;height:200px;border:0;"></td></tr>' +
        spacerRow(24)
      );
    }

    case 'textonly': {
      const d = s.data || {};
      return (
        '<tr><td style="font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#333;padding:0;">' +
        '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(d.title || '') + '</div>' +
        '<div>' + escapeHtml(d.body || '') + '</div>' +
        '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#007da3;text-decoration:underline;display:inline-block;margin-top:10px;">' + escapeHtml(d.ctaText || '') + '</a></div>' +
        '</td></tr>' + spacerRow(24)
      );
    }

    case 'divider': {
      const label = (s.data && s.data.label) || 'SECTION TITLE';
      return (
        '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="background:#FBE232;color:#000;font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:18px;text-transform:uppercase;font-weight:bold;padding:6px 10px;">' +
        escapeHtml(label) + '</td></tr></table></td></tr>' + spacerRow(24)
      );
    }

    case 's5050': {
      const d = s.data || {};
      const leftFirst = !!d.flip;
      const textTd =
        '<td valign="top" width="285" style="padding:' + (leftFirst ? '0 30px 0 0' : '0') + ';font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#333;">' +
          '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(d.title || '') + '</div>' +
          (leftFirst ? (
            escapeHtml(d.body || '') +
            '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#007da3;text-decoration:underline;display:inline-block;margin-top:10px;">' +
            escapeHtml(d.ctaText || '') + '</a></div>'
          ) : '') +
        '</td>';

      const imgTd =
        '<td valign="top" width="285" style="padding:' + (!leftFirst ? '0 30px 0 0' : '0') + ';">' +
          '<img src="' + (d.img || PH.half) + '" width="285" height="185" alt="" style="display:block;border:0;width:285px;height:185px;">' +
          (!leftFirst ? (
            '<div style="font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#333;margin-top:0;">' +
              escapeHtml(d.body || '') +
              '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#007da3;text-decoration:underline;display:inline-block;margin-top:10px;">' +
              escapeHtml(d.ctaText || '') + '</a></div>' +
            '</div>'
          ) : '') +
        '</td>';

      const row = '<tr>' + (leftFirst ? (textTd + imgTd) : (imgTd + textTd)) + '</tr>';
      return (
        '<tr><td style="padding:0 0 0 0;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;table-layout:fixed;border-collapse:collapse;">' +
          row +
        '</table></td></tr>' + spacerRow(24)
      );
    }

    case 'cards': {
      const d  = s.data || {};
      const c1 = Object.assign(
        { img: PH.c, title: '[Card One Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
        d.card1 || {}
      );
      const c2 = Object.assign(
        { img: PH.c, title: '[Card Two Title]', body: '[Short supporting copy — one or two lines.]', ctaText: 'Details →', ctaUrl: '#' },
        d.card2 || {}
      );

      return (
        '<tr><td style="padding:0 0 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;table-layout:fixed;border-collapse:collapse;">' +
          '<tr>' +
            '<td valign="top" width="285" style="padding:0 30px 0 0;">' +
              '<img src="' + c1.img + '" width="285" height="185" alt="" style="display:block;border:0;width:285px;height:185px;">' +
              '<div style="font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#222;padding-top:10px;">' +
                '<strong style="color:#000;display:block;margin:10px 0;">' + escapeHtml(c1.title) + '</strong>' +
                escapeHtml(c1.body) +
                '<br><a href="' + escapeHtml(c1.ctaUrl) + '" style="color:#007da3;text-decoration:underline;display:inline-block;margin-top:10px;">' + escapeHtml(c1.ctaText) + '</a>' +
              '</div>' +
            '</td>' +
            '<td valign="top" width="285" style="padding:0;">' +
              '<img src="' + c2.img + '" width="285" height="185" alt="" style="display:block;border:0;width:285px;height:185px;">' +
              '<div style="font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;color:#222;padding-top:10px;">' +
                '<strong style="color:#000;display:block;margin:10px 0;">' + escapeHtml(c2.title) + '</strong>' +
                escapeHtml(c2.body) +
                '<br><a href="' + escapeHtml(c2.ctaUrl) + '" style="color:#007da3;text-decoration:underline;display:inline-block;margin-top:10px;">' + escapeHtml(c2.ctaText) + '</a>' +
              '</div>' +
            '</td>' +
          '</tr>' +
        '</table></td></tr>'
      );
    }

    case 'spotlight': {
      const d = s.data || {};
      const bg = d.bg || '#fbe232';
      const fg = d.fg || '#000000';
      return (
        '<tr><td style="padding:0 0 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;background:' + bg + ';color:' + fg + ';">' +
          '<tr>' +
            '<td width="180" valign="top" style="padding:16px;"><img src="' + (d.img || PH.spotlight) + '" width="180" height="237" alt="" style="display:block;border:0;width:180px;height:237px;"></td>' +
            '<td valign="top" style="padding:16px;font-family:Arial, Helvetica, sans-serif;color:' + fg + ';">' +
              '<div style="font:12px/14px Arial;letter-spacing:.04em;text-transform:uppercase;margin:10px 0;">' + escapeHtml(d.eyebrow || 'EYEBROW') + '</div>' +
              '<div style="font-weight:bold;font-size:18px;line-height:20px;margin:10px 0;">' + escapeHtml(d.title || '') + '</div>' +
              '<div style="font-size:14px;line-height:18px;">' + escapeHtml(d.body || '') + '</div>' +
              '<div><a href="' + escapeHtml(d.ctaUrl || '#') + '" style="color:#000;text-decoration:underline;display:inline-block;margin-top:10px;">' + escapeHtml(d.ctaText || '') + '</a></div>' +
            '</td>' +
          '</tr>' +
        '</table></td></tr>'
      );
    }

    case 'footer': {
      const d = s.data || {};
      return (
        '<tr><td style="padding:0;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="background:#161616;color:#ffffff;text-align:center;padding:36px 16px;font-family:Arial, Helvetica, sans-serif;">' +
        '<div style="font-size:14px;line-height:20px;margin-bottom:8px;"><strong>' + escapeHtml(d.logo || '[Logo]') + '</strong></div>' +
        '<div style="font-size:12px;line-height:18px;">' + escapeHtml(d.fourCs || "[4c's]") + '</div>' +
        '</td></tr></table></td></tr>'
      );
    }

    case 'feedback': {
      const d = s.data || {};
      return (
        '<tr><td style="padding:24px 0 32px 0;font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:20px;color:#333;text-align:center;">' +
        '<strong>' + escapeHtml(d.lead || 'Questions? Ideas? Feedback?') + '</strong><br>' +
        'We’d love to hear it — please email <a href="mailto:' + escapeHtml(d.email || 'name@email.com') + '" style="color:#007da3;text-decoration:underline;">' +
        escapeHtml(d.email || 'name@email.com') + '</a></td></tr>'
      );
    }

    default:
      return '';
  }
}

function spacerRow(px) {
  return '<tr><td style="height:' + px + 'px;line-height:0;font-size:0;">&nbsp;</td></tr>';
}

// ===== end main.js =====
