// src/schema.js
export const SECTION_TYPES = {
  banner: "Banner",
  textonly: "Text-only",
  divider: "Divider",
  textImgR: "Text left / Image right",
  imgTextL: "Image left / Text right",
  s5050: "50/50",
  s5050flip: "50/50 (flipped)",
  cards: "2 Cards",
  twoThumbs: "2 Thumbs + Text",
  spotlight: "Spotlight",
  footer: "Footer",
  feedback: "Feedback",
};

const PH = {
  banner: "https://placehold.co/600x200/png",
  thumb: "https://placehold.co/200x130/png",
  half: "https://placehold.co/285x185/png",
  card: "https://placehold.co/285x185/png",
  two: "https://placehold.co/285x185/png",
  spotlight: "https://placehold.co/180x237/png",
};

export function defaultSection(type) {
  switch (type) {
    case "banner":
      return { type, data: { src: PH.banner, alt: "Banner" } };

    case "textonly":
      return {
        type,
        data: {
          title: "[Headline]",
          body: "[Intro paragraph text goes here.]",
          ctaText: "Learn more →",
          ctaUrl: "#",
        },
      };

    case "divider":
      return { type, data: { label: "SECTION TITLE" } };

    case "textImgR":
      return {
        type,
        data: {
          title: "[Section Title]",
          body: "[Short description goes here.]",
          ctaText: "Learn more →",
          ctaUrl: "#",
          imgA: PH.thumb,
        },
      };

    case "imgTextL":
      return {
        type,
        data: {
          title: "[Another Section]",
          body: "[Supporting text goes here.]",
          ctaText: "Read more →",
          ctaUrl: "#",
          imgA: PH.thumb,
        },
      };

    case "s5050":
      return {
        type,
        data: {
          title: "[50/50 Title]",
          body: "[Equal-width columns with matching image heights.]",
          ctaText: "Read more →",
          ctaUrl: "#",
          imgA: PH.half,
          flipped: false,
        },
      };

    case "s5050flip":
      return {
        type,
        data: {
          title: "[50/50 Title]",
          body: "[Mirrored version, equal columns.]",
          ctaText: "Learn more →",
          ctaUrl: "#",
          imgA: PH.half,
          flipped: true,
        },
      };

    case "cards":
      return {
        type,
        data: {
          activeCard: "left",
          left: {
            img: PH.card,
            title: "[Card One Title]",
            body: "[Short supporting copy — one or two lines.]",
            ctaText: "Details →",
            ctaUrl: "#",
          },
          right: {
            img: PH.card,
            title: "[Card Two Title]",
            body: "[Short supporting copy — one or two lines.]",
            ctaText: "Details →",
            ctaUrl: "#",
          },
        },
      };

    case "twoThumbs":
      return {
        type,
        data: {
          left: {
            img: PH.two,
            title: "[Item One]",
            body: "[Short description under the image.]",
            ctaText: "Details →",
            ctaUrl: "#",
          },
          right: {
            img: PH.two,
            title: "[Item Two]",
            body: "[Short description under the image.]",
            ctaText: "Details →",
            ctaUrl: "#",
          },
        },
      };

    case "spotlight":
      return {
        type,
        data: {
          eyebrow: "FEATURED",
          title: "[Spotlight Title]",
          body: "Brief supporting text.",
          ctaText: "Learn more →",
          ctaUrl: "#",
          imgA: PH.spotlight,
          bgColor: "#fbe232",
          fgColor: "#000000",
        },
      };

    case "footer":
      return { type, data: { logo: "[Logo]", fourCs: "[4c's]" } };

    case "feedback":
      return {
        type,
        data: {
          lead: "Questions? Ideas? Feedback?",
          body: "We’d love to hear it — please email ",
          email: "name@email.com",
        },
      };

    default:
      // Failsafe: always return a valid section so UI never breaks
      return {
        type: "textonly",
        data: {
          title: "[Title]",
          body: "[Body]",
          ctaText: "Learn more →",
          ctaUrl: "#",
        },
      };
  }
}
