/* Global configuration & helpers kept simple (no modules). */

window.PH = {
  banner: "https://placehold.co/600x200/png",
  half: "https://placehold.co/285x185/png",   // 50/50 thumbnails
  c: "https://placehold.co/285x185/png",      // Cards thumbnails
  spotlight: "https://placehold.co/180x200/png" // Spotlight thumb
};

window.SECTION_TYPES = {
  banner: 'Banner',
  textonly: 'Text-only',
  divider: 'Divider',
  s5050: '50/50',
  s5050flip: '50/50 (flipped)',
  cards: '2 Cards',
  spotlight: 'Spotlight',
  footer: 'Footer',
  feedback: 'Feedback'
};

window.escapeHtml = function (str) {
  return String(str || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
};

window.normalizeUrl = function (u) {
  if (!u) return u;
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return 'https://' + u.replace(/^\/+/, '');
};
