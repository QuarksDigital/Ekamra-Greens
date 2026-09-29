import { CONTACT } from "./content";

// Set NEXT_PUBLIC_SITE_URL to the live domain before launch; the fallback is a placeholder.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.ekamragreens.com").replace(/\/$/, "");

export const SITE = {
  name: "Ekamra Greens",
  tagline: "Exquisite lawn and grand banquets",
  title: "Ekamra Greens | Wedding Lawn & Banquet Hall in Bhubaneswar",
  description:
    "Ekamra Greens is a lush wedding lawn and grand banquet hall with guest rooms on Infosys Avenue, Chandrasekharpur, Bhubaneswar. Host weddings, receptions, sangeet, engagements and corporate evenings.",
  keywords: [
    "Ekamra Greens",
    "wedding lawn Bhubaneswar",
    "banquet hall Bhubaneswar",
    "marriage hall Bhubaneswar",
    "wedding venue Bhubaneswar",
    "reception venue Bhubaneswar",
    "party lawn Chandrasekharpur",
    "banquet hall Infosys Avenue",
    "wedding venue Odisha",
    "corporate event venue Bhubaneswar",
  ],
};

// schema.org description of the venue for search engines.
export const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["EventVenue", "LocalBusiness"],
  "@id": `${SITE_URL}/#venue`,
  name: SITE.name,
  slogan: SITE.tagline,
  description: SITE.description,
  url: SITE_URL,
  image: [`${SITE_URL}/opengraph-image.jpg`, `${SITE_URL}/img/lawn-tree.webp`, `${SITE_URL}/img/hall-grand.webp`],
  logo: `${SITE_URL}/icon-512.png`,
  telephone: "+91-9937111110",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot No 3 & IDCO Plot 7/7, Infosys Avenue, Chandaka Industrial Estate, Chandrasekharpur",
    addressLocality: "Bhubaneswar",
    addressRegion: "Odisha",
    postalCode: "751024",
    addressCountry: "IN",
  },
  hasMap: "https://maps.app.goo.gl/eZFPbgQuHh51QY436",
  sameAs: [CONTACT.instagram],
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Open-air wedding lawn", value: true },
    { "@type": "LocationFeatureSpecification", name: "Banquet hall", value: true },
    { "@type": "LocationFeatureSpecification", name: "Guest rooms", value: true },
    { "@type": "LocationFeatureSpecification", name: "Paved parking forecourt", value: true },
  ],
};
