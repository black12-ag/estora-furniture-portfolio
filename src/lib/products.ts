import marlowWallArt from "@/assets/products/marlow-wall-art.jpg";
import larkinBoucleChair from "@/assets/products/larkin-boucle-chair.jpg";
import larkinBoucleChairBrown from "@/assets/products/larkin-boucle-chair-brown.png";
import larkinBoucleChairCharcoal from "@/assets/products/larkin-boucle-chair-charcoal.png";
import larkinBoucleChairTerracotta from "@/assets/products/larkin-boucle-chair-terracotta.png";
import larkinBoucleChairSky from "@/assets/products/larkin-boucle-chair-sky.png";
import larkinBoucleChairSage from "@/assets/products/larkin-boucle-chair-sage.png";
import haloPlatformBed from "@/assets/products/halo-platform-bed.jpg";
import haloPlatformBedCharcoal from "@/assets/products/halo-platform-bed-charcoal.jpg";
import haloPlatformBedTerracotta from "@/assets/products/halo-platform-bed-terracotta.jpg";
import haloPlatformBedSky from "@/assets/products/halo-platform-bed-sky.jpg";
import haloPlatformBedSage from "@/assets/products/halo-platform-bed-sage.jpg";
import terraFramedPrints from "@/assets/products/terra-framed-prints.jpg";
import asterWoodenStool from "@/assets/products/aster-wooden-stool.jpg";
import bloomBoucleCushion from "@/assets/products/bloom-boucle-cushion.jpg";
import bloomBoucleCushionCharcoal from "@/assets/products/bloom-boucle-cushion-charcoal.jpg";
import bloomBoucleCushionTerracotta from "@/assets/products/bloom-boucle-cushion-terracotta.jpg";
import bloomBoucleCushionSky from "@/assets/products/bloom-boucle-cushion-sky.jpg";
import bloomBoucleCushionSage from "@/assets/products/bloom-boucle-cushion-sage.jpg";
import rivetWallClock from "@/assets/products/rivet-wall-clock.jpg";
import coveMoldedChair from "@/assets/products/cove-molded-chair.jpg";
import coveMoldedChairCharcoal from "@/assets/products/cove-molded-chair-charcoal.jpg";
import coveMoldedChairTerracotta from "@/assets/products/cove-molded-chair-terracotta.jpg";
import coveMoldedChairSky from "@/assets/products/cove-molded-chair-sky.jpg";
import coveMoldedChairSage from "@/assets/products/cove-molded-chair-sage.jpg";
import nordikHexMirror from "@/assets/products/nordik-hex-mirror.jpg";
import wovenTossPillow from "@/assets/products/woven-toss-pillow.jpg";
import loftNestingTables from "@/assets/products/loft-nesting-tables.jpg";
import kobeRoundTrays from "@/assets/products/kobe-round-trays.jpg";
import yumiTriConsole from "@/assets/products/yumi-tri-console.jpg";
import haloStorageCube from "@/assets/products/halo-storage-cube.jpg";
import pylaPendantCluster from "@/assets/products/pyla-pendant-cluster.jpg";
import marlowTaskLamp from "@/assets/products/marlow-task-lamp.jpg";
import asterReadingLamp from "@/assets/products/aster-reading-lamp.jpg";
import vegaCredenza from "@/assets/products/vega-credenza.jpg";
import nordikArcLamp from "@/assets/products/nordik-arc-lamp.jpg";
import bucleWingChair from "@/assets/products/bucle-wing-chair.jpg";
import bucleWingChairCharcoal from "@/assets/products/bucle-wing-chair-charcoal.jpg";
import bucleWingChairTerracotta from "@/assets/products/bucle-wing-chair-terracotta.jpg";
import bucleWingChairSky from "@/assets/products/bucle-wing-chair-sky.jpg";
import bucleWingChairSage from "@/assets/products/bucle-wing-chair-sage.jpg";

export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  imagesByColor?: Record<string, string>;
  category: string;
  type: "Wooden" | "Iron" | "Ceramic" | "Material" | "Glass";
  colors: { name: string; value: string }[];
  sizes: string[];
  stock: number;
  rating: number;
  reviews: number;
  description: string;
  longDescription: string[];
  features: string[];
  specs: { label: string; value: string }[];
  seedReviews: { name: string; rating: number; body: string; daysAgo: number }[];
};

const defaultColors: Product["colors"] = [
  { name: "Brown", value: "#8B6F5A" },
  { name: "Charcoal", value: "#2a2a2a" },
  { name: "Terracotta", value: "#B85C3A" },
  { name: "Sky", value: "#7EC4CF" },
  { name: "Sage", value: "#7BA05B" },
];

const baseSpecs = [
  { label: "Warranty", value: "5-year structural warranty" },
  { label: "Returns", value: "Free returns within 30 days" },
  { label: "Shipping", value: "Free over $200 · ships in 3–5 days" },
];

const commonReviews = (name: string) => [
  { name: "Alicia M.", rating: 5, body: `Absolutely thrilled with the ${name}. Quality is even better than the photos and it shipped quickly.`, daysAgo: 6 },
  { name: "Devon R.", rating: 5, body: `Third piece I've ordered from Estora and the ${name} did not disappoint — finishes are gorgeous.`, daysAgo: 21 },
  { name: "Priya S.", rating: 4, body: `Great value for the price. Assembly was straightforward and the packaging was fully recyclable.`, daysAgo: 44 },
];

export const products: Product[] = [
  {
    slug: "marlow-wall-art", name: "Marlow Wall Art", price: 69.36, compareAt: 89.00, image: marlowWallArt,
    category: "Decor", type: "Material", colors: defaultColors, sizes: ["40x60 cm","60x80 cm","80x120 cm"], stock: 24, rating: 5, reviews: 32,
    description: "A bold abstract print in warm terracotta and cream tones, framed in matte espresso wood to anchor any living space.",
    longDescription: [
      "The Marlow print pairs earthy pigments with an oversized graphic form, giving quiet walls an immediate focal point without shouting.",
      "Each piece is giclée-printed on 250gsm cotton rag paper, hand-mounted behind museum-grade anti-reflective glass, and framed in FSC-certified espresso oak milled in northern Portugal.",
    ],
    features: ["Museum-grade anti-reflective glass","Giclée on 250gsm cotton rag paper","FSC-certified solid oak frame","Includes flush wall-mount hardware","Fade-resistant for 100+ years"],
    specs: [
      { label: "Print", value: "Giclée, 12-color archival" },
      { label: "Paper", value: "Hahnemühle cotton rag, 250gsm" },
      { label: "Frame", value: "Solid oak, espresso stain" },
      { label: "Glazing", value: "Anti-reflective glass, UV-filtering" },
      { label: "Weight (60x80)", value: "3.4 kg" },
      { label: "Hanging", value: "Flush D-ring & wire" },
      { label: "Origin", value: "Handcrafted in Portugal" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Marlow Wall Art"),
  },
  {
    slug: "larkin-boucle-chair", name: "Larkin Boucle Chair", price: 163.36, compareAt: 210.00, image: larkinBoucleChair,
    imagesByColor: { Brown: larkinBoucleChairBrown, Charcoal: larkinBoucleChairCharcoal, Terracotta: larkinBoucleChairTerracotta, Sky: larkinBoucleChairSky, Sage: larkinBoucleChairSage },
    category: "Armchairs", type: "Wooden", colors: defaultColors, sizes: ["Standard","Petite"], stock: 12, rating: 5, reviews: 48,
    description: "Cream boucle upholstery meets warm oak legs. Deep seat, high back — the reading chair you never want to leave.",
    longDescription: [
      "Larkin's sculpted silhouette is built around a kiln-dried hardwood frame, wrapped in high-resilience foam and topped with a heavyweight cream boucle you'll want to sink into.",
      "The exposed oak legs are joined with mortise-and-tenon construction — no screws, no wobble — and finished with a natural hard-wax oil that ages beautifully.",
    ],
    features: ["Kiln-dried hardwood frame","Heavyweight boucle (58% wool)","Mortise-and-tenon oak legs","Removable, dry-clean seat cover","Assembles in under 10 minutes"],
    specs: [
      { label: "Upholstery", value: "Cream boucle, 58% wool blend" },
      { label: "Fill", value: "High-resilience foam + fibre wrap" },
      { label: "Frame", value: "Kiln-dried hardwood" },
      { label: "Legs", value: "Solid European oak, hard-wax oil" },
      { label: "Dimensions", value: "78 × 76 × 82 cm (W×D×H)" },
      { label: "Seat height", value: "44 cm" },
      { label: "Weight", value: "18 kg" },
      { label: "Weight capacity", value: "150 kg" },
      { label: "Assembly", value: "Legs attach with 4 bolts (tool included)" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Larkin Boucle Chair"),
  },
  {
    slug: "halo-platform-bed", name: "Halo Platform Bed", price: 899.00, compareAt: 1199.00, image: haloPlatformBed,
    imagesByColor: { Brown: haloPlatformBed, Charcoal: haloPlatformBedCharcoal, Terracotta: haloPlatformBedTerracotta, Sky: haloPlatformBedSky, Sage: haloPlatformBedSage },
    category: "Bedroom", type: "Material", colors: defaultColors, sizes: ["Queen","King","Cal King"], stock: 6, rating: 4, reviews: 21,
    description: "Low-profile linen platform bed with an upholstered headboard and blackened steel base.",
    longDescription: [
      "Halo strips the bedroom back to what matters: a soft, oversized headboard, a whisper-quiet slat base, and a low profile that lets the room breathe.",
      "Woven Belgian linen is stretched over a hardwood frame and sits on a blackened-steel base that eliminates the need for a box spring.",
    ],
    features: ["No box spring required","Reinforced slat base","Belgian linen upholstery","Blackened steel base","Center support leg for even weight"],
    specs: [
      { label: "Frame", value: "Kiln-dried hardwood" },
      { label: "Upholstery", value: "Belgian linen, stain-treated" },
      { label: "Base", value: "Blackened powder-coated steel" },
      { label: "Slats", value: "Pine, reinforced with center rail" },
      { label: "Clearance", value: "18 cm under-bed" },
      { label: "Mattress support", value: "Up to 30 cm thick" },
      { label: "Assembly", value: "2 people, ~45 min" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Halo Platform Bed"),
  },
  {
    slug: "terra-framed-prints", name: "Terra Framed Prints", price: 129.00, image: terraFramedPrints,
    category: "Decor", type: "Material", colors: defaultColors, sizes: ["Set of 3","Set of 5"], stock: 40, rating: 5, reviews: 17,
    description: "A curated set of botanical prints matted in warm terra and framed in slim black.",
    longDescription: [
      "A ready-to-hang gallery wall in a single box. Each print is matted with acid-free warm-terra board and framed in slim powder-coated aluminum.",
      "Arrangement templates are included so you can pin the layout before making a single hole.",
    ],
    features: ["Includes paper hanging templates","Acid-free matting","Powder-coated aluminum","Ready to hang out of the box","Signed edition of 500"],
    specs: [
      { label: "Set", value: "5 prints (A3)" },
      { label: "Print", value: "Fine-art giclée" },
      { label: "Frame", value: "Slim powder-coated aluminum" },
      { label: "Mat", value: "Acid-free warm terra" },
      { label: "Glazing", value: "Shatter-resistant acrylic" },
      { label: "Hardware", value: "Sawtooth, pre-installed" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Terra Framed Prints"),
  },
  {
    slug: "aster-wooden-stool", name: "Aster Wooden Stool", price: 89.00, image: asterWoodenStool,
    category: "Accessories", type: "Wooden", colors: defaultColors, sizes: ["Small","Medium"], stock: 18, rating: 4, reviews: 12,
    description: "Turned solid oak stool with a hand-oiled finish. Sit on it, stack books on it — it's built for both.",
    longDescription: [
      "Made from a single billet of European oak, the Aster stool is turned on a lathe, sanded to a silk finish, and rubbed with pure tung oil.",
      "Use it as a plant stand, a bathroom side table, or extra seating — it will pick up character with every year.",
    ],
    features: ["Turned from a single oak billet","Food-safe pure tung oil finish","No hardware, no assembly","Weight-tested to 180 kg","Grain pattern unique to each piece"],
    specs: [
      { label: "Material", value: "Solid European oak, single billet" },
      { label: "Finish", value: "Pure tung oil, food-safe" },
      { label: "Dimensions (M)", value: "Ø32 × H45 cm" },
      { label: "Weight", value: "5.8 kg" },
      { label: "Weight capacity", value: "180 kg" },
      { label: "Assembly", value: "None — ships fully assembled" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Aster Wooden Stool"),
  },
  {
    slug: "bloom-boucle-cushion", name: "Bloom Boucle Cushion", price: 39.00, compareAt: 49.00, image: bloomBoucleCushion,
    imagesByColor: { Brown: bloomBoucleCushion, Charcoal: bloomBoucleCushionCharcoal, Terracotta: bloomBoucleCushionTerracotta, Sky: bloomBoucleCushionSky, Sage: bloomBoucleCushionSage },
    category: "Accessories", type: "Material", colors: defaultColors, sizes: ["45x45 cm","60x60 cm"], stock: 60, rating: 5, reviews: 26,
    description: "Plush textured boucle cushion with a hidden zip and feather-down insert.",
    longDescription: [
      "Bloom's oversized loops give a chair, sofa or bed an instant softness. The cover is removable, dry-clean only, and pairs beautifully with linen and leather.",
      "Filled with an ethically-sourced feather-down insert that plumps back up after every use.",
    ],
    features: ["Removable, dry-clean cover","Ethically-sourced feather-down","Hidden YKK zip","Piped edge","Reversible"],
    specs: [
      { label: "Cover", value: "Boucle, 58% wool blend" },
      { label: "Fill", value: "Feather-down, ethically sourced" },
      { label: "Weight (60cm)", value: "1.1 kg" },
      { label: "Zip", value: "Hidden YKK" },
      { label: "Care", value: "Dry clean cover, spot clean fill" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Bloom Boucle Cushion"),
  },
  {
    slug: "rivet-wall-clock", name: "Rivet Wall Clock", price: 74.00, image: rivetWallClock,
    category: "Decor", type: "Wooden", colors: defaultColors, sizes: ["40 cm","60 cm"], stock: 22, rating: 4, reviews: 9,
    description: "Silent-sweep wall clock crafted from solid walnut with brass markers.",
    longDescription: [
      "Rivet keeps time without the tick — a German silent-sweep quartz movement drives brushed brass hands across a solid walnut face.",
      "The bevelled edge and inset brass markers give it a jewelled quality that reads as premium from across the room.",
    ],
    features: ["German silent-sweep quartz","Brushed brass markers","Solid walnut face","Runs on 1x AA (included)","Keyhole wall mount"],
    specs: [
      { label: "Movement", value: "German silent-sweep quartz" },
      { label: "Material", value: "Solid American walnut" },
      { label: "Hands & markers", value: "Brushed brass" },
      { label: "Battery", value: "1× AA (included)" },
      { label: "Weight (60cm)", value: "1.6 kg" },
      { label: "Mounting", value: "Keyhole slot, hardware included" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Rivet Wall Clock"),
  },
  {
    slug: "cove-molded-chair", name: "Cove Molded Chair", price: 149.00, compareAt: 189.00, image: coveMoldedChair,
    imagesByColor: { Brown: coveMoldedChair, Charcoal: coveMoldedChairCharcoal, Terracotta: coveMoldedChairTerracotta, Sky: coveMoldedChairSky, Sage: coveMoldedChairSage },
    category: "Armchairs", type: "Material", colors: defaultColors, sizes: ["Standard"], stock: 15, rating: 5, reviews: 41,
    description: "Molded shell dining chair in warm terracotta on solid beech legs.",
    longDescription: [
      "Cove's contoured shell is molded from 40% post-consumer recycled polypropylene, giving it the flex and warmth of upholstery without the weight.",
      "The solid beech legs are pressure-fitted with steel inserts so they can be swapped or replaced without damaging the shell.",
    ],
    features: ["40% recycled polypropylene shell","Ergonomic contoured seat","Stackable up to 4 high","Felt floor protectors included","Indoor/covered outdoor use"],
    specs: [
      { label: "Shell", value: "Recycled polypropylene" },
      { label: "Legs", value: "Solid beech, natural finish" },
      { label: "Dimensions", value: "54 × 52 × 80 cm" },
      { label: "Seat height", value: "46 cm" },
      { label: "Weight", value: "5.2 kg" },
      { label: "Weight capacity", value: "130 kg" },
      { label: "Stackable", value: "Yes, up to 4" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Cove Molded Chair"),
  },
  {
    slug: "nordik-hex-mirror", name: "Nordik Hex Mirror", price: 219.00, image: nordikHexMirror,
    category: "Decor", type: "Glass", colors: defaultColors, sizes: ["60 cm","80 cm"], stock: 8, rating: 5, reviews: 14,
    description: "Hexagonal accent mirror with a brushed brass frame — a soft glow, a sharp silhouette.",
    longDescription: [
      "The Nordik hex catches light like a piece of jewellery. Its solid brass frame is hand-brushed to give a soft, non-uniform glow that reads warm in both daylight and lamplight.",
      "The distortion-free float glass is silvered on the back and edge-sealed to resist tarnishing in bathrooms.",
    ],
    features: ["Bathroom-safe edge sealing","Solid brass — no plating","3mm distortion-free glass","Horizontal or vertical hang","D-ring hardware included"],
    specs: [
      { label: "Frame", value: "Solid brushed brass" },
      { label: "Glass", value: "3mm float, silver-backed" },
      { label: "Diameter (80cm)", value: "80 cm across, 4 cm deep" },
      { label: "Weight (80cm)", value: "6.8 kg" },
      { label: "Hanging", value: "D-ring, horizontal or vertical" },
      { label: "Bathroom safe", value: "Yes, edge-sealed" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Nordik Hex Mirror"),
  },
  {
    slug: "woven-toss-pillow", name: "Woven Toss Pillow", price: 45.00, image: wovenTossPillow,
    category: "Accessories", type: "Material", colors: defaultColors, sizes: ["45x45 cm","50x50 cm"], stock: 44, rating: 4, reviews: 19,
    description: "Hand-woven cotton pillow with warm sand stripes and tasseled corners.",
    longDescription: [
      "Woven on traditional pit looms by a women's cooperative in Rajasthan, every pillow is a one-off with slight variation in stripe and tassel.",
      "Machine-washable cover and a plumpable poly-fiber insert make it as practical as it is pretty.",
    ],
    features: ["Fair-trade hand-woven","Machine-washable cover","Hand-tied tassels","Hidden zip","Made-to-last double-stitched seams"],
    specs: [
      { label: "Material", value: "100% cotton, hand-loomed" },
      { label: "Fill", value: "Recycled poly-fiber, plumpable" },
      { label: "Weave", value: "Traditional pit loom" },
      { label: "Care", value: "Machine wash cold, air dry" },
      { label: "Origin", value: "Rajasthan, India (fair-trade)" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Woven Toss Pillow"),
  },
  {
    slug: "loft-nesting-tables", name: "Loft Nesting Tables", price: 279.00, compareAt: 349.00, image: loftNestingTables,
    category: "Coffee tables", type: "Wooden", colors: defaultColors, sizes: ["Set of 2"], stock: 10, rating: 5, reviews: 22,
    description: "Two round oak side tables that tuck neatly together when not in use.",
    longDescription: [
      "Loft is two tables, one footprint — a bigger disc for drinks and books, a smaller one that slides underneath and pulls out when the sofa fills up.",
      "Both tops are solid oak with a hard-wax oil that resists rings and warms up with age.",
    ],
    features: ["Space-saving nested design","Solid oak tops (not veneer)","Hard-wax oil finish resists rings","Felt floor protectors","Assembles in 5 minutes"],
    specs: [
      { label: "Material", value: "Solid European oak" },
      { label: "Finish", value: "Natural hard-wax oil" },
      { label: "Large table", value: "Ø50 × H48 cm" },
      { label: "Small table", value: "Ø38 × H42 cm" },
      { label: "Weight", value: "12 kg / pair" },
      { label: "Assembly", value: "Top attaches with 4 bolts (tool included)" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Loft Nesting Tables"),
  },
  {
    slug: "kobe-round-trays", name: "Kobe Round Trays", price: 89.00, image: kobeRoundTrays,
    category: "Accessories", type: "Wooden", colors: defaultColors, sizes: ["Set of 2","Set of 3"], stock: 30, rating: 4, reviews: 11,
    description: "Nested walnut serving trays with polished brass handles.",
    longDescription: [
      "Kobe trays layer beautifully on a coffee table or credenza and pull double-duty at breakfast in bed.",
      "The rims are steam-bent from a single walnut ply so there are no glued seams to fail.",
    ],
    features: ["Steam-bent walnut rims","Polished solid brass handles","Food-safe finish","Nests for tidy storage","Recessed handles won't snag"],
    specs: [
      { label: "Material", value: "Solid American walnut" },
      { label: "Handles", value: "Solid polished brass" },
      { label: "Set of 3 sizes", value: "Ø28 / Ø35 / Ø42 cm" },
      { label: "Finish", value: "Food-safe hard-wax oil" },
      { label: "Care", value: "Wipe with damp cloth" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Kobe Round Trays"),
  },
  {
    slug: "yumi-tri-console", name: "Yumi Tri Console", price: 449.00, image: yumiTriConsole,
    category: "Cabinets", type: "Wooden", colors: defaultColors, sizes: ["120 cm","150 cm"], stock: 5, rating: 5, reviews: 8,
    description: "Sculptural three-legged console in solid oak with a book-matched top.",
    longDescription: [
      "Yumi's three splayed legs give a hallway or entry a sense of movement — no boxy silhouette to fight with.",
      "The top is book-matched from two mirrored oak boards so the grain flows across the surface in a continuous line.",
    ],
    features: ["Book-matched solid oak top","Tripod-splay leg geometry","Fits tight against walls","Levelling feet","Ships flat, assembles in 20 min"],
    specs: [
      { label: "Top", value: "Book-matched solid oak" },
      { label: "Legs", value: "Solid oak, mortised" },
      { label: "Finish", value: "Hard-wax oil, natural" },
      { label: "Dimensions (150)", value: "150 × 38 × 78 cm" },
      { label: "Weight", value: "24 kg" },
      { label: "Assembly", value: "Legs bolt on (tool included)" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Yumi Tri Console"),
  },
  {
    slug: "halo-storage-cube", name: "Halo Storage Cube", price: 329.00, image: haloStorageCube,
    category: "Bookcases", type: "Wooden", colors: defaultColors, sizes: ["6 cube","9 cube"], stock: 9, rating: 4, reviews: 15,
    description: "Modular oak cube system with soft canvas bins for tidy, warm storage.",
    longDescription: [
      "Halo cubes stack, split or line up along a wall — a bookshelf that grows with you.",
      "Cotton canvas bins slide into any cube and give kids' rooms and mudrooms an instant tidy.",
    ],
    features: ["Modular — stack or run in a line","Anti-tip wall strap included","Reinforced cross-back for stability","Optional cotton canvas bins","Two shelf heights"],
    specs: [
      { label: "Material", value: "Solid oak + oak veneer back" },
      { label: "Bins", value: "Cotton canvas, cube-sized" },
      { label: "Dimensions (9)", value: "112 × 32 × 112 cm" },
      { label: "Cube size", value: "34 × 32 × 34 cm" },
      { label: "Weight capacity", value: "15 kg per cube" },
      { label: "Assembly", value: "Cam-lock, 45 min" },
      { label: "Safety", value: "Anti-tip strap included" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Halo Storage Cube"),
  },
  {
    slug: "pyla-pendant-cluster", name: "Pyla Pendant Cluster", price: 389.00, image: pylaPendantCluster,
    category: "Floor Lamps", type: "Glass", colors: defaultColors, sizes: ["3 light","5 light"], stock: 7, rating: 5, reviews: 18,
    description: "Cluster of hand-blown glass globes suspended from brushed brass stems.",
    longDescription: [
      "Each Pyla globe is mouth-blown in a small studio in northern Italy, so no two are quite the same.",
      "The brass canopy hides an adjustable cord system that lets you stagger the globes at different heights.",
    ],
    features: ["Hand-blown Italian glass","Adjustable cord heights (up to 2m)","Dimmable with any LED dimmer","Brass canopy conceals wiring","Hardwired install"],
    specs: [
      { label: "Bulbs", value: "3× E27 (not included), max 40W each" },
      { label: "Cord", value: "Braided fabric, adjustable to 2m" },
      { label: "Canopy", value: "Brushed brass, 25 cm dia" },
      { label: "Globe", value: "Ø18 cm, hand-blown clear glass" },
      { label: "Install", value: "Hardwired, ceiling box required" },
      { label: "Dimmable", value: "Yes, with LED-compatible dimmer" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Pyla Pendant Cluster"),
  },
  {
    slug: "marlow-task-lamp", name: "Marlow Task Lamp", price: 129.00, compareAt: 159.00, image: marlowTaskLamp,
    category: "Floor Lamps", type: "Iron", colors: defaultColors, sizes: ["Standard"], stock: 20, rating: 4, reviews: 24,
    description: "Articulated desk lamp in matte black with brass detailing and braided fabric cord.",
    longDescription: [
      "Marlow's counter-weighted arm holds any position without drift — no thumb-wheels to tighten, no shade that keeps drooping.",
      "The braided fabric cord runs down the arm and into a weighted brass-capped base that keeps the lamp planted at the edge of a desk.",
    ],
    features: ["Counter-weighted articulation","Braided fabric cord (2m)","In-line switch on cord","Weighted brass base","Compatible with smart bulbs"],
    specs: [
      { label: "Bulb", value: "E14, max 40W (not included)" },
      { label: "Reach", value: "Up to 55 cm from base" },
      { label: "Cord", value: "Braided fabric, 2m, in-line switch" },
      { label: "Base", value: "Weighted iron, brass cap, Ø18 cm" },
      { label: "Finish", value: "Matte black powder coat" },
      { label: "Weight", value: "2.4 kg" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Marlow Task Lamp"),
  },
  {
    slug: "aster-reading-lamp", name: "Aster Reading Lamp", price: 199.00, image: asterReadingLamp,
    category: "Floor Lamps", type: "Wooden", colors: defaultColors, sizes: ["Standard"], stock: 13, rating: 5, reviews: 20,
    description: "Slim tripod floor lamp with a natural linen drum shade and warm oak legs.",
    longDescription: [
      "The Aster reading lamp throws a soft, even glow ideal for beside an armchair or at the corner of a sofa.",
      "The natural-linen drum diffuses the light without turning it cold, and the oak tripod adds height without visual weight.",
    ],
    features: ["Foot-switch on braided cord","Natural linen diffuser","Oak tripod — no wobble","Warm-white bulb included","Compatible with smart bulbs"],
    specs: [
      { label: "Shade", value: "Natural linen, Ø40 cm drum" },
      { label: "Legs", value: "Solid oak tripod" },
      { label: "Height", value: "148 cm" },
      { label: "Bulb", value: "E27, 8W LED included (2700K)" },
      { label: "Cord", value: "Braided fabric, 2m, foot switch" },
      { label: "Weight", value: "4.1 kg" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Aster Reading Lamp"),
  },
  {
    slug: "vega-credenza", name: "Vega Credenza", price: 1249.00, compareAt: 1499.00, image: vegaCredenza,
    category: "Cabinets", type: "Wooden", colors: defaultColors, sizes: ["160 cm","200 cm"], stock: 4, rating: 5, reviews: 11,
    description: "Mid-century walnut credenza with brass pulls, open shelving and soft-close doors.",
    longDescription: [
      "Vega puts a proper piece of furniture in your living room — real walnut, real joinery, cable pass-throughs, and enough shelf to actually organise a life.",
      "Doors run on Blum soft-close hinges and the adjustable shelf sits on solid brass pegs.",
    ],
    features: ["Blum soft-close hinges","Cable pass-throughs (rear)","Adjustable interior shelf","Solid brass pull hardware","Levelling feet"],
    specs: [
      { label: "Material", value: "Solid American walnut + walnut veneer" },
      { label: "Hardware", value: "Solid brass pulls, Blum hinges" },
      { label: "Dimensions (200)", value: "200 × 45 × 80 cm" },
      { label: "Weight", value: "62 kg" },
      { label: "Shelves", value: "1 adjustable, brass peg" },
      { label: "Cable management", value: "Rear pass-throughs on both sides" },
      { label: "Assembly", value: "Ships fully assembled" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Vega Credenza"),
  },
  {
    slug: "nordik-arc-lamp", name: "Nordik Arc Lamp", price: 359.00, image: nordikArcLamp,
    category: "Floor Lamps", type: "Iron", colors: defaultColors, sizes: ["Standard"], stock: 11, rating: 4, reviews: 16,
    description: "Sweeping brass arc floor lamp balanced on a solid marble base.",
    longDescription: [
      "The Nordik arc reaches over a sofa or dining table without you having to hardwire a pendant.",
      "A single piece of Carrara marble anchors the base — 14 kg of counterweight lets the brass arm cantilever without tipping.",
    ],
    features: ["Solid Carrara marble base","Cantilever design — no wall or ceiling","Braided fabric cord with foot switch","LED-dimmer compatible","Adjustable shade angle"],
    specs: [
      { label: "Base", value: "Solid Carrara marble, Ø30 cm" },
      { label: "Arm", value: "Brushed brass, 180 cm arc" },
      { label: "Height", value: "205 cm" },
      { label: "Bulb", value: "E27, max 60W (not included)" },
      { label: "Cord", value: "Braided fabric, 2.5m, foot switch" },
      { label: "Weight", value: "14 kg (base) + 5 kg (arm)" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Nordik Arc Lamp"),
  },
  {
    slug: "bucle-wing-chair", name: "Bucle Wing Chair", price: 649.00, compareAt: 799.00, image: bucleWingChair,
    imagesByColor: { Brown: bucleWingChair, Charcoal: bucleWingChairCharcoal, Terracotta: bucleWingChairTerracotta, Sky: bucleWingChairSky, Sage: bucleWingChairSage },
    category: "Armchairs", type: "Material", colors: defaultColors, sizes: ["Standard"], stock: 6, rating: 5, reviews: 29,
    description: "Contemporary wingback armchair upholstered in cream boucle with hand-set nailhead trim.",
    longDescription: [
      "A modern re-cut of the traditional wingback — same enveloping shape, softer shoulders, and a boucle that's built for lounging, not looking.",
      "Eight-way hand-tied springs sit under high-density foam and a fibre-wrap topper, so the seat has body without going stiff.",
    ],
    features: ["8-way hand-tied springs","High-density foam + fibre wrap","Hand-set nailhead trim","Kiln-dried hardwood frame","Weight-tested to 180 kg"],
    specs: [
      { label: "Upholstery", value: "Cream boucle, 58% wool" },
      { label: "Frame", value: "Kiln-dried hardwood" },
      { label: "Suspension", value: "8-way hand-tied springs" },
      { label: "Fill", value: "High-density foam + fibre wrap" },
      { label: "Dimensions", value: "88 × 92 × 108 cm" },
      { label: "Seat height", value: "48 cm" },
      { label: "Weight", value: "32 kg" },
      { label: "Weight capacity", value: "180 kg" },
      ...baseSpecs,
    ],
    seedReviews: commonReviews("Bucle Wing Chair"),
  },
];

export const productMap: Record<string, Product> = Object.fromEntries(products.map(p => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return productMap[slug];
}

export function getRelated(slug: string, n = 5): Product[] {
  const p = productMap[slug];
  if (!p) return products.slice(0, n);
  const same = products.filter(x => x.slug !== slug && x.category === p.category);
  const rest = products.filter(x => x.slug !== slug && x.category !== p.category);
  return [...same, ...rest].slice(0, n);
}
