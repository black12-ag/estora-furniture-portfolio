import blogHero from "@/assets/blog-hero.jpg";
import blogLivingRoom from "@/assets/blog-living-room.jpg";
import blogSmallSpaces from "@/assets/blog-small-spaces.jpg";
import blogLighting from "@/assets/blog-lighting.jpg";
import blogDining from "@/assets/blog-dining.jpg";
import blogTrends from "@/assets/blog-trends.jpg";
import blogWoolCare from "@/assets/blog-wool-care.jpg";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  author: string;
  authorRole: string;
  date: string;
  readMinutes: number;
  tags: string[];
  featured?: boolean;
  body: { type: "p" | "h2" | "quote" | "list"; text?: string; items?: string[] }[];
};

export const BLOG_CATEGORIES = [
  "All",
  "Interiors",
  "Care Guides",
  "Trends",
  "Lighting",
  "Small Spaces",
  "Dining",
] as const;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "guide-new-orleans-maison-de-la-luz",
    title: "A Guide To New Orleans' Best — From Boutique Hotel Maison de la Luz",
    excerpt:
      "One of the most important aspects of vacation has always been choosing accommodations. Finding somewhere relaxing and clean with modern furniture can make or break a trip.",
    cover: blogHero,
    category: "Interiors",
    author: "Dorothy Bell",
    authorRole: "Senior Editor",
    date: "Nov 05, 2026",
    readMinutes: 8,
    tags: ["Travel", "Interiors", "Hotels"],
    featured: true,
    body: [
      { type: "p", text: "One of the most important aspects of vacation has always been choosing accommodations. Finding somewhere relaxing and clean with modern furniture and close to amenities can sometimes make or break a vacation." },
      { type: "p", text: "Recently, house sharing on websites like AirBNB has exploded due to its convenience. It offers guests something new — a unique experience — while they are travelling." },
      { type: "h2", text: "What makes a stay memorable" },
      { type: "p", text: "The details matter: layered lighting, warm textiles, a thoughtful color story. Maison de la Luz nails all three with quiet confidence." },
      { type: "quote", text: "Great interiors don't ask for attention — they hold it." },
      { type: "h2", text: "Bring the feeling home" },
      { type: "list", items: ["Choose one hero object per room", "Layer three light sources", "Repeat one material across surfaces", "Keep circulation paths clear"] },
    ],
  },
  {
    slug: "care-for-wool-furniture",
    title: "How To Care For Wool Furniture (Without Stressing About It)",
    excerpt: "Wool bouclé and felted upholstery age beautifully when treated with a light touch. Here's what we do at the studio.",
    cover: blogWoolCare,
    category: "Care Guides",
    author: "Ivan Marx",
    authorRole: "Product Specialist",
    date: "Oct 22, 2026",
    readMinutes: 5,
    tags: ["Care", "Upholstery", "Wool"],
    body: [
      { type: "p", text: "Wool is naturally stain-resistant, so most spills lift with a dry cloth. The rule: blot, never rub." },
      { type: "h2", text: "Weekly ritual" },
      { type: "list", items: ["Vacuum with an upholstery attachment", "Rotate cushions to even out wear", "Fluff bouclé with a soft brush"] },
      { type: "h2", text: "Handling stains" },
      { type: "p", text: "Cold water and a drop of mild detergent handle 90% of household spills. Test on a hidden spot first." },
    ],
  },
  {
    slug: "decorating-small-spaces",
    title: "Decorating And Furnishing Small Spaces That Live Big",
    excerpt: "A studio doesn't have to feel like a studio. Zoning, verticality, and one confident color will change the whole room.",
    cover: blogSmallSpaces,
    category: "Small Spaces",
    author: "Naomi Chen",
    authorRole: "Interior Stylist",
    date: "Oct 14, 2026",
    readMinutes: 6,
    tags: ["Small Spaces", "Studio", "Storage"],
    body: [
      { type: "p", text: "Small rooms reward restraint. Fewer, better pieces make the footprint feel intentional instead of crowded." },
      { type: "h2", text: "Three moves that always work" },
      { type: "list", items: ["Float furniture 4–6 inches off the wall", "Use one rug that anchors the whole zone", "Hang art higher than you think"] },
    ],
  },
  {
    slug: "2026-design-trends",
    title: "Our Favourite 2026 Design Trends (And Which To Skip)",
    excerpt: "Curved silhouettes stay. Chrome cools down. Warm minimalism gets warmer. Here's what our buyers are watching.",
    cover: blogTrends,
    category: "Trends",
    author: "Dorothy Bell",
    authorRole: "Senior Editor",
    date: "Oct 03, 2026",
    readMinutes: 7,
    tags: ["Trends", "2026", "Palette"],
    featured: true,
    body: [
      { type: "p", text: "We spent the last six months at every fair worth flying to. These are the ideas that kept resurfacing." },
      { type: "h2", text: "In" },
      { type: "list", items: ["Soft, sculptural seating", "Warm terracotta neutrals", "Brushed brass accents", "Bouclé and shearling"] },
      { type: "h2", text: "Out" },
      { type: "list", items: ["Cold industrial greys", "Novelty statement lighting", "Fast-turn seasonal palettes"] },
    ],
  },
  {
    slug: "layer-lighting-mitzi",
    title: "The Right Way to Layer Lighting in Any Room",
    excerpt: "Ambient, task, accent. Three layers, one warm room. A simple framework you can apply tonight.",
    cover: blogLighting,
    category: "Lighting",
    author: "Ivan Marx",
    authorRole: "Product Specialist",
    date: "Sep 28, 2026",
    readMinutes: 4,
    tags: ["Lighting", "Ambience"],
    body: [
      { type: "p", text: "One overhead light is the most common lighting mistake in the world. It flattens everything." },
      { type: "h2", text: "The three-layer rule" },
      { type: "list", items: ["Ambient: soft, indirect, fills the room", "Task: focused, near activity zones", "Accent: highlights art, plants, texture"] },
    ],
  },
  {
    slug: "ideas-dining-area",
    title: "6 Amazing Ideas To Improve Your Dining Area",
    excerpt: "The dining table is the honest room of a home. Make it comfortable, well-lit, and hard to leave.",
    cover: blogDining,
    category: "Dining",
    author: "Naomi Chen",
    authorRole: "Interior Stylist",
    date: "Sep 15, 2026",
    readMinutes: 5,
    tags: ["Dining", "Tables", "Hosting"],
    body: [
      { type: "p", text: "Design the table for the way you actually eat. Weeknight dinners, not once-a-year holidays." },
      { type: "h2", text: "Six quick wins" },
      { type: "list", items: ["Dim the pendant on a warm bulb", "Add an upholstered chair at each head", "Layer a runner, not a full cloth", "Keep one low centerpiece", "Store extra leaves nearby", "Pick a rug you can wipe down"] },
    ],
  },
  {
    slug: "modern-living-room",
    title: "Building A Modern Living Room That Ages Well",
    excerpt: "Buy the sofa slowly. Everything else is easy after that.",
    cover: blogLivingRoom,
    category: "Interiors",
    author: "Dorothy Bell",
    authorRole: "Senior Editor",
    date: "Sep 02, 2026",
    readMinutes: 6,
    tags: ["Living Room", "Sofas", "Neutral"],
    body: [
      { type: "p", text: "The living room is the most photographed and least edited room in most homes. Slow it down." },
      { type: "h2", text: "Start with the anchor" },
      { type: "p", text: "A well-made sofa in a neutral fabric lasts a decade. Everything else — art, rugs, cushions — is cheap to swap." },
    ],
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelated(slug: string, limit = 3) {
  const current = getPost(slug);
  if (!current) return BLOG_POSTS.slice(0, limit);
  return BLOG_POSTS.filter((p) => p.slug !== slug && p.category === current.category)
    .concat(BLOG_POSTS.filter((p) => p.slug !== slug && p.category !== current.category))
    .slice(0, limit);
}

export function categoryCounts() {
  const counts: Record<string, number> = { All: BLOG_POSTS.length };
  for (const p of BLOG_POSTS) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return counts;
}
