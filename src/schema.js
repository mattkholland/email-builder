// THEME & SIZES (single source of truth)
window.THEME = {
  width: 600,
  accent: '#FBE232',
  ctaColor: '#007da3',    // default CTA color
  title: { fs: 18, lh: 20, margin: 10 },
  body:  { fs: 14, lh: 18 },
  sizes: {
    banner: { w: 600, h: 200 }, // height-locked
    half:   { w: 285, h: 185 }, // 50/50 images
    card:   { w: 285, h: 185 }, // cards images
    spot:   { w: 180, h: 200 }  // spotlight thumbnail if used
  }
};

// Section type labels
window.TYPES = {
  banner:'Banner',
  textonly:'Text-only',
  divider:'Divider',
  s5050:'50/50',
  s5050flip:'50/50 (flipped)',
  cards:'2 Cards',

  spotlight: {
  label: "Spotlight",
  defaults: {
    eyebrow: "FEATURED",
    title: "[Spotlight Title]",
    body: "[Brief supporting text here.]",
    imgA: "https://placehold.co/180x237/png",
    bg: "#fbe232",
    textColor: "#000000",
    ctaText: "Learn more →",
    ctaUrl: "#"
  }
},
  
  footer:'Footer',
  feedback:'Feedback'
};

// Default placeholders
window.PH = {
  banner: `https://placehold.co/${THEME.sizes.banner.w}x${THEME.sizes.banner.h}/png`,
  half:   `https://placehold.co/${THEME.sizes.half.w}x${THEME.sizes.half.h}/png`,
  card:   `https://placehold.co/${THEME.sizes.card.w}x${THEME.sizes.card.h}/png`,
  :   `https://placehold.co/${THEME.sizes..w}x${THEME.sizes..h}/png`,
  twol:   `https://placehold.co/284x164/png`,
  twor:   `https://placehold.co/284x164/png`
};

// Section factories (clean defaults)
window.factory = function(type){
  switch(type){
    case 'banner':     return { type, data:{ src:PH.banner, alt:'Banner' } };
    case 'textonly':   return { type, data:{ title:'[Headline]', body:'[Intro text]', ctaText:'', ctaUrl:'' } };
    case 'divider':    return { type, data:{ label:'SECTION TITLE' } };
    case 'textImgR':   return { type, data:{ title:'[Title]', body:'[Description]', ctaText:'Learn more →', ctaUrl:'#', imgA:PH.half } };
    case 'imgTextL':   return { type, data:{ title:'[Title]', body:'[Description]', ctaText:'Read more →',  ctaUrl:'#', imgA:PH.half } };
    case 's5050':      return { type, data:{ title:'[50/50 Title]', body:'[Copy]', ctaText:'Read more →',  ctaUrl:'#', imgA:PH.half, flip:false } };
    case 's5050flip':  return { type, data:{ title:'[50/50 Title]', body:'[Copy]', ctaText:'Learn more →', ctaUrl:'#', imgA:PH.half, flip:true } };
    case 'cards':      return { type, data:{ left:{ img:PH.card, title:'[Card Left]', body:'[Short copy]', ctaText:'Details →', ctaUrl:'#' }, right:{ img:PH.card, title:'[Card Right]', body:'[Short copy]', ctaText:'Details →', ctaUrl:'#' } } };
    case 'twoThumbs':  return { type, data:{ left:{ img:PH.twol, title:'[Item One]', body:'[Description]', ctaText:'Details →', ctaUrl:'#' }, right:{ img:PH.twor, title:'[Item Two]', body:'[Description]', ctaText:'Details →', ctaUrl:'#' } } };
    case 'spotlight':  return { type, data:{ eyebrow:'EYEBROW', title:'[Spotlight Title]', body:'[Spotlight copy]', ctaText:'Learn more →', ctaUrl:'#', bg:'#fbe232', color:'#000000' } };
    case 'footer':     return { type, data:{ logo:'[Logo]', fourCs:"[4c's]" } };
    case 'feedback':   return { type, data:{ lead:'Questions? Ideas? Feedback?', email:'name@email.com' } };
  }
  return { type, data:{} };
};
