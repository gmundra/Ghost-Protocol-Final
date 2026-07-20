// Ported from one-shot-wonder-web/src/data/content.ts

export type Category = {
  slug: string;
  name: string;
  glyph: string;
  blurb: string;
};

export const categories: Category[] = [
  { slug: "board-games",        name: "Board Games",         glyph: "\u25AB", blurb: "Strategic thinking on wooden boards." },
  { slug: "card-games",         name: "Card Games",          glyph: "\u2664", blurb: "Quick play, deep thinking." },
  { slug: "books",              name: "Books",               glyph: "\u2766", blurb: "Stories that widen the world." },
  { slug: "conversation-mats",  name: "Conversation Mats",   glyph: "\u25C8", blurb: "Prompts for real family talk." },
  { slug: "diy-kits",           name: "DIY Kits",            glyph: "\u2726", blurb: "Make it, then hold it." },
  { slug: "learning-sheets",    name: "Learning Sheets",     glyph: "\u25A4", blurb: "Focused practice, beautifully printed." },
  { slug: "wooden-puzzles",     name: "Wooden Puzzles",      glyph: "\u2B16", blurb: "Tactile geometry for little hands." },
  { slug: "math-puzzles",       name: "Math Puzzles",        glyph: "\u221E", blurb: "Numbers that click into place." },
  { slug: "magnetic-trackers",  name: "Magnetic Trackers",   glyph: "\u25C9", blurb: "Rhythms and routines they own." },
];

export type Skill =
  | "Motor Skills"
  | "Math"
  | "Creativity"
  | "Language"
  | "Emotional Intelligence"
  | "Communication"
  | "Problem Solving";

export const allSkills: Skill[] = [
  "Motor Skills",
  "Math",
  "Creativity",
  "Language",
  "Emotional Intelligence",
  "Communication",
  "Problem Solving",
];

export type AgeBand = "2\u20134" | "4\u20136" | "6\u20139" | "9\u201312";
export const allAges: AgeBand[] = ["2\u20134", "4\u20136", "6\u20139", "9\u201312"];

export type Product = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  age: AgeBand;
  skills: Skill[];
  outcome: string;
  where: string;
  benefits: string[];
  palette: [string, string];
  glyph: string;
};

export const products: Product[] = [
  {
    id: "quiet-cartographer",
    name: "The Quiet Cartographer",
    tagline: "A slow map-making board game.",
    category: "board-games",
    age: "6\u20139",
    skills: ["Problem Solving", "Creativity", "Communication"],
    outcome: "Learn to plan, negotiate, and see a shared world.",
    where: "Living rooms \u00B7 classrooms",
    benefits: ["Spatial reasoning", "Turn-taking", "Storytelling"],
    palette: ["#e6d5b8", "#b45a3c"],
    glyph: "\u25AB",
  },
  {
    id: "feelings-atlas",
    name: "Feelings Atlas",
    tagline: "45 cards for naming what we carry.",
    category: "card-games",
    age: "4\u20136",
    skills: ["Emotional Intelligence", "Language", "Communication"],
    outcome: "Give children a vocabulary for their inner weather.",
    where: "Therapy rooms \u00B7 bedtime",
    benefits: ["Emotional literacy", "Empathy", "Self-regulation"],
    palette: ["#f0d9c5", "#7d8f6b"],
    glyph: "\u2661",
  },
  {
    id: "night-forest",
    name: "The Night Forest",
    tagline: "An illustrated book for gentle sleep.",
    category: "books",
    age: "2\u20134",
    skills: ["Language", "Emotional Intelligence"],
    outcome: "Wind down without a lit screen.",
    where: "Bedside \u00B7 nurseries",
    benefits: ["Vocabulary", "Calm rituals", "Bonding"],
    palette: ["#d6c8a8", "#3a3220"],
    glyph: "\u2766",
  },
  {
    id: "table-talk",
    name: "Table Talk Mat",
    tagline: "Dinner prompts that go past \u2018how was school.\u2019",
    category: "conversation-mats",
    age: "6\u20139",
    skills: ["Communication", "Language", "Emotional Intelligence"],
    outcome: "Turn every meal into a small conversation.",
    where: "Dining tables",
    benefits: ["Family rituals", "Listening", "Curiosity"],
    palette: ["#efe4d0", "#b45a3c"],
    glyph: "\u25C8",
  },
  {
    id: "paper-birds",
    name: "Paper Birds Kit",
    tagline: "Fold, name, and set free.",
    category: "diy-kits",
    age: "4\u20136",
    skills: ["Motor Skills", "Creativity"],
    outcome: "Small hands, precise folds, quiet focus.",
    where: "Weekends \u00B7 rainy days",
    benefits: ["Fine motor", "Patience", "Pride of making"],
    palette: ["#ead9c0", "#7d8f6b"],
    glyph: "\u2726",
  },
  {
    id: "counting-orchard",
    name: "The Counting Orchard",
    tagline: "Wooden fruit, real arithmetic.",
    category: "wooden-puzzles",
    age: "2\u20134",
    skills: ["Math", "Motor Skills"],
    outcome: "Numbers you can hold.",
    where: "Preschools \u00B7 playrooms",
    benefits: ["Number sense", "Grip strength", "Sorting"],
    palette: ["#e8d3b4", "#b45a3c"],
    glyph: "\u2B16",
  },
  {
    id: "prime-garden",
    name: "The Prime Garden",
    tagline: "A math puzzle that grows.",
    category: "math-puzzles",
    age: "9\u201312",
    skills: ["Math", "Problem Solving"],
    outcome: "See numbers as living structures.",
    where: "Schools \u00B7 quiet afternoons",
    benefits: ["Number theory", "Focus", "Discovery"],
    palette: ["#dfd0b1", "#3a5a3a"],
    glyph: "\u221E",
  },
  {
    id: "morning-tracker",
    name: "Morning Rhythm Tracker",
    tagline: "Magnetic routines, calmer mornings.",
    category: "magnetic-trackers",
    age: "4\u20136",
    skills: ["Motor Skills", "Emotional Intelligence"],
    outcome: "A visual rhythm children can own.",
    where: "Fridge doors \u00B7 bedrooms",
    benefits: ["Independence", "Routine", "Confidence"],
    palette: ["#f2e6cf", "#7d8f6b"],
    glyph: "\u25C9",
  },
  {
    id: "wonder-alphabet",
    name: "The Wonder Alphabet",
    tagline: "26 letters, 26 small worlds.",
    category: "learning-sheets",
    age: "4\u20136",
    skills: ["Language", "Creativity"],
    outcome: "A gentler first alphabet.",
    where: "Homeschools \u00B7 classrooms",
    benefits: ["Letter recognition", "Storytelling", "Handwriting"],
    palette: ["#ecdcc2", "#b45a3c"],
    glyph: "\u25A4",
  },
  {
    id: "little-architects",
    name: "Little Architects",
    tagline: "Wooden shapes for infinite cities.",
    category: "wooden-puzzles",
    age: "6\u20139",
    skills: ["Creativity", "Motor Skills", "Problem Solving"],
    outcome: "Build worlds by hand.",
    where: "Playrooms \u00B7 after-school",
    benefits: ["Spatial thinking", "Design instinct", "Focus"],
    palette: ["#e5d1ae", "#3a3220"],
    glyph: "\u25B1",
  },
  {
    id: "story-dice",
    name: "Story Dice",
    tagline: "Roll to imagine.",
    category: "card-games",
    age: "6\u20139",
    skills: ["Creativity", "Language", "Communication"],
    outcome: "Stories on demand \u2014 no charging cable required.",
    where: "Road trips \u00B7 classrooms",
    benefits: ["Narrative", "Vocabulary", "Play"],
    palette: ["#e9d8bc", "#b45a3c"],
    glyph: "\u25C7",
  },
  {
    id: "compassion-cards",
    name: "Compassion Cards",
    tagline: "Small acts, real kindness.",
    category: "card-games",
    age: "6\u20139",
    skills: ["Emotional Intelligence", "Communication"],
    outcome: "Kindness practiced, not just discussed.",
    where: "Schools \u00B7 homes",
    benefits: ["Empathy", "Awareness", "Community"],
    palette: ["#efdec6", "#7d8f6b"],
    glyph: "\u274B",
  },
];

export const stats = [
  { value: 7,  suffix: " hrs", label: "Average daily screen time for children aged 8\u201312." },
  { value: 63, suffix: "%",    label: "Of parents wish there were better alternatives to hand." },
  { value: 92, suffix: "%",    label: "Of therapists prefer tactile tools for early learning." },
  { value: 3,  suffix: "\u00D7",    label: "More vocabulary retained through conversation than passive viewing." },
];

export const outcomes = [
  { title: "Focused attention",    body: "Longer, quieter concentration built through slow, tactile play." },
  { title: "Emotional literacy",   body: "Vocabulary and rituals to name and hold feelings." },
  { title: "Fine motor strength",  body: "Precise hands, patient minds \u2014 folded, sorted, built." },
  { title: "Creative confidence",  body: "Making real things builds trust in one\u2019s own ideas." },
  { title: "Real conversation",    body: "Prompts that turn small moments into family memory." },
  { title: "Independent rhythm",   body: "Routines children feel proud to own." },
];

export const audiences = [
  {
    key: "parents",
    label: "Parents",
    body: "Objects your child asks for by name \u2014 not by app icon. Designed for the seasons of childhood, not the algorithm.",
  },
  {
    key: "educators",
    label: "Educators",
    body: "Classroom-tested tools that survive real hands and real weeks. Every product is aligned to skill outcomes.",
  },
  {
    key: "therapists",
    label: "Therapists",
    body: "Calm, non-clinical objects for pediatric therapy, occupational sessions, and speech practice.",
  },
  {
    key: "schools",
    label: "Schools",
    body: "Bulk-friendly kits and educator resources for schools rethinking their relationship with screens.",
  },
];

export const testimonials = [
  {
    quote: "My daughter asked to keep the Feelings Atlas next to her bed. That\u2019s never happened with an app.",
    name: "Anika R.",
    role: "Parent \u00B7 Bengaluru",
  },
  {
    quote: "The Counting Orchard held a room of 4-year-olds for twenty quiet minutes. That is a small miracle.",
    name: "Maria S.",
    role: "Montessori Educator",
  },
  {
    quote: "We use Compassion Cards weekly in family therapy. The children read them out loud without prompting.",
    name: "Dr. Ravi K.",
    role: "Child Psychologist",
  },
  {
    quote: "Beautiful enough to stay on the coffee table. Sturdy enough to survive my son.",
    name: "Sarah L.",
    role: "Parent \u00B7 London",
  },
  {
    quote: "Finally, learning tools that don\u2019t shout. Our classroom feels different.",
    name: "Ms. Patel",
    role: "Primary School Teacher",
  },
];

export const faqs = [
  {
    q: "Are these products screen-replacement or screen-free?",
    a: "Screen-free. Every UNSCREEN object is meant to give a child something else to reach for \u2014 with their hands, voice, or imagination.",
  },
  {
    q: "What age range do you design for?",
    a: "From 2 to 12. Each product lists a specific age band, plus the skills and outcomes it supports.",
  },
  {
    q: "Do you work with schools and therapists?",
    a: "Yes. We offer bulk pricing, educator resources, and custom kits for classrooms, clinics, and homeschool co-ops.",
  },
  {
    q: "How are products made?",
    a: "Sustainably sourced wood, FSC-certified paper, and non-toxic inks. Built to last for years, not seasons.",
  },
  {
    q: "Do you ship internationally?",
    a: "We currently ship across India, the UK, and the US. More regions coming soon \u2014 join the newsletter for updates.",
  },
];
