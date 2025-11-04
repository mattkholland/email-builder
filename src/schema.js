// Section schema (approved set only)

export const SECTION_TYPES = {
  banner: "Banner",
  textonly: "Text-only",
  divider: "Divider",
  s5050: "50/50",
  s5050flip: "50/50 (flipped)",
  cards: "2 Cards",
  spotlight: "Spotlight",
  footer: "Footer",
  feedback: "Feedback",
};

export function defaultSection(type) {
  // your existing switch() logic goes here


const schema = {
  banner: {
    label: "Banner",
    defaults: {
      imgA: "https://placehold.co/600x200/png",
      alt: "Banner"
    }
  },

  textonly: {
    label: "Text-only",
    defaults: {
      title: "[Headline]",
      body: "[Body copy goes here. Keep it concise and scannable.]",
      ctaText: "Learn more →",
      ctaUrl: "#"
    }
  },

  divider: {
    label: "Divider",
    defaults: {
      label: "SECTION TITLE"
    }
  },

  s5050: {
    label: "50/50",
    defaults: {
      title: "[Section Title]",
      body: "[Short description text.]",
      ctaText: "Learn more →",
      ctaUrl: "#",
      imgA: "https://placehold.co/285x185/png",
      flipped: false
    }
  },

  s5050flip: {
    label: "50/50 (flipped)",
    defaults: {
      title: "[Section Title]",
      body: "[Short description text.]",
      ctaText: "Learn more →",
      ctaUrl: "#",
      imgA: "https://placehold.co/285x185/png",
      flipped: true
    }
  },

  cards: {
    label: "2 Cards",
    defaults: {
      left: {
        img: "https://placehold.co/285x185/png",
        title: "[Card Title]",
        body: "Short supporting copy for the left card.",
        ctaText: "Details →",
        ctaUrl: "#"
      },
      right: {
        img: "https://placehold.co/285x185/png",
        title: "[Card Title]",
        body: "Short supporting copy for the right card.",
        ctaText: "Details →",
        ctaUrl: "#"
      }
      // ✅ No divider in this section
    }
  },

  spotlight: {
    label: "Spotlight",
    defaults: {
      eyebrow: "FEATURED",
      title: "[Spotlight Title]",
      body: "Brief supporting text.",
      imgA: "https://placehold.co/180x237/png",  // 180x237 left thumbnail
      bg: "#fbe232",
      textColor: "#000000",
      ctaText: "Learn more →",
      ctaUrl: "#"
    }
  },

  footer: {
    label: "Footer",
    defaults: {
      logo: "[Logo]",
      fourCs: "[4c's]"
    }
  },

  feedback: {
    label: "Feedback",
    defaults: {
      lead: "Questions? Ideas? Feedback?",
      email: "name@email.com"
    }
  }
};
  }
