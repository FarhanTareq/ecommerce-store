export const siteConfig = {
  name: "Sporsify",
  tagline: "Gear up. Play harder.",
  description:
    "Sporsify is Bangladesh's home for performance sports gear — cricket, football, running, fitness and more. Cash on delivery, bKash and Nagad accepted.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "en_BD",
  currency: "BDT",
  keywords: [
    "sports shop Bangladesh",
    "cricket gear Dhaka",
    "football boots Bangladesh",
    "gym equipment online",
    "Sporsify",
    "sports accessories BD",
  ],
};

export const navLinks = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?sort=discount", label: "Deals" },
  { href: "/track-order", label: "Track order" },
  { href: "/account", label: "My account" },
];

export const trustPoints = [
  {
    title: "Cash on delivery",
    description: "Pay when your gear arrives at your door.",
  },
  {
    title: "Fast nationwide delivery",
    description: "Inside Dhaka in 1–2 days, outside Dhaka in 2–4 days.",
  },
  {
    title: "100% authentic gear",
    description: "Curated performance equipment you can trust.",
  },
  {
    title: "Easy 7-day returns",
    description: "Wrong size? Message us and we will sort it out.",
  },
];

export const districts = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Khulna",
  "Rajshahi",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cumilla",
  "Narayanganj",
  "Gazipur",
  "Bogura",
  "Jashore",
  "Cox's Bazar",
  "Other",
];
