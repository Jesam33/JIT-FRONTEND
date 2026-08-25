export type NavLink = {
  href: string;
  label: string;
};

export type Capability = {
  title: string;
  description: string;
  image: string;
};

export type ShowcaseItem = {
  title: string;
  text: string;
  accent: "blue" | "green" | "pink";
  image: string;
};

export type Testimonial = {
  title: string;
  body: string;
  author: string;
};

export type BlogItem = {
  slug: string;
  title: string;
  description: string;
};

export type RouteIntro = {
  title: string;
  subtitle: string;
  body: string;
};

export type ServiceCard = {
  title: string;
  description: string;
};

export type PricingPlan = {
  slug: string;
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
};

export type PortfolioItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  client: string;
  date: string;
  author: string;
  image: string;
  body: string;
  sourceUrl: string;
};

export type Sponsor = {
  name: string;
  logo?: string;
  href?: string;
};

export type FaqGroup = {
  title: string;
  questions: string[];
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/institute", label: "Institute" },
  // { href: "/real-estate", label: "Real Estate" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export const heroContent = {
  kicker: "JORSAS TECH",
  title: "Mobile Apps & Web Development",
  subtitle:
    "We design and develop powerful websites, mobile apps and digital solutions that help businesses grow, innovate and succeed. ",
  ctaPrimary: "Start a Project",
  ctaSecondary: "Train With Us",
};

export const capabilities: Capability[] = [
  {
    title: "WEB DEVELOPMENT",
    description:
      "Over the years, we've made a reputation for building websites that look great & are easy-to-use in 7 days. Just think about the website and allow us develop it.",
    image: "/images/sections/web-development.jpg",
  },
  {
    title: "MOBILE APP DEVELOPMENT",
    description:
      "At Jorsas, our skilled Mobile Developers are always available to handle projects using modern technologies (Flutter) to develop mobile applications accessible on IOS and Android platforms.",
    image: "/images/sections/mobile-app.jpg",
  },
  {
    title: "UI/UX DESIGNS",
    description:
      "Understanding the human experience is essential for creating useful and effective products. At Jorsas, our designers enjoy using their skill sets to empower people to accomplish their goals. We create digital experiences that make life easier.",
    image: "/images/sections/ui-ux.jpg",
  },
  {
    title: "API DEVELOPMENT",
    description:
      "An application programming interface, or API, enables companies to open up their applications' data and functionality to external third-party developers and business partners, or to departments within their companies.",
    image: "/images/sections/api.jpg",
  },
];

export const showcase: ShowcaseItem[] = [
  {
    title: "Client Base",
    text: "120+ satisfied clients across real estate and tech sectors — from early-stage startups to established enterprises. Our clients trust us to deliver mission-critical software, websites, and digital platforms that power their daily operations. Many of them come through referrals, a testament to the quality and reliability we bring to every engagement. Our portfolio spans fintech, education, real estate, health tech, and professional services, giving us a broad perspective on what it takes to build products that users actually love.",
    accent: "blue",
    image: "/images/sections/work.png",
  },
  {
    title: "Customer Retention",
    text: "80% repeat business rate — our clients keep coming back because we treat every project as a long-term partnership, not a one-off transaction. We invest time in understanding your business goals, your industry challenges, and your users so that the first deliverable is never a guess. After launch, we remain available for maintenance, feature updates, and scaling support. This commitment to post-delivery care is why more than four out of five clients return for additional work, refer us within their networks, and trust us with increasingly ambitious projects over time.",
    accent: "green",
    image: "/images/sections/showcase-customer-retention.jpg",
  },
  {
    title: "Business Experience",
    text: "With over 25 years of combined experience, our team has worked across multiple continents and industries, navigating different regulatory environments, user cultures, and technical constraints. This depth of experience means we can anticipate challenges before they arise, recommend pragmatic solutions instead of theoretical ones, and deliver projects on time and within budget. Our discovery process alone — spanning stakeholder interviews, user journey mapping, feasibility analysis, and technical architecture — has saved clients countless hours of rework and misaligned effort.",
    accent: "pink",
    image: "/images/sections/discusssions.png",
  },
];

export const testimonials: Testimonial[] = [
  {
    title: "Business Consulting",
    body: "At Gerow, we specialize in comprehensive business solutions designed to enhance your operational efficiency and supply chain excellence.",
    author: "Gerow Team",
  },
  {
    title: "Strategic Insight",
    body: "Our team of experts and a wealth of resources are here to empower your journey towards business excellence.",
    author: "Advisory Team",
  },
  {
    title: "Operational Excellence",
    body: "Whether you are a startup seeking guidance or a business professional looking for insights, we support growth with proven methods.",
    author: "Consulting Team",
  },
];

export const blogPreview: BlogItem[] = [
  {
    slug: "the-human-factor-hr-best-practices-for-businesses",
    title: "The Human Factor: HR Best Practices for Businesses",
    description: "Gain insights into the art of financial planning tailored to entrepreneurs, helping you secure your financial future and business success.",
  },
  {
    slug: "productivity-hacks-for-busy-entrepreneurs",
    title: "Productivity Hacks for Busy Entrepreneurs",
    description: "Learn the essential steps and elements to craft a winning marketing plan that effectively reaches your target audience and drives results.",
  },
  {
    slug: "building-a-strong-employer-brand-for-talent-acquisition",
    title: "Building a Strong Employer Brand for Talent Acquisition",
    description: "Learn the essential steps and elements to craft a winning marketing plan that effectively reaches your target audience and drives results.",
  },
  {
    slug: "the-impact-of-sustainable-practices-on-business-sustainability",
    title: "The Impact of Sustainable Practices on Business Sustainability",
    description: "Get expert advice on how small businesses can navigate tax season efficiently, minimize liabilities, and stay compliant with tax regulations.",
  },
  {
    slug: "balancing-act-work-life-integration-for-business-owners",
    title: "Balancing Act: Work-Life Integration for Business Owners",
    description: "Learn how businesses can leverage technology to gain a competitive edge, streamline operations, and deliver exceptional value to customers.",
  },
  {
    slug: "startup-success-stories-lessons-from-industry-leaders",
    title: "Startup Success Stories: Lessons from Industry Leaders",
    description: "Discover strategies for achieving work-life integration as a business owner, ensuring well-being and productivity in both spheres.",
  },
  {
    slug: "the-role-of-innovation-in-modern-business",
    title: "The Role of Innovation in Modern Business",
    description: "Learn how businesses can leverage technology to gain a competitive edge, streamline operations, and deliver exceptional value to customers.",
  },
  {
    slug: "mastering-the-art-of-financial-planning-for-entrepreneurs",
    title: "Mastering the Art of Financial Planning for Entrepreneurs",
    description: "Get expert advice on how small businesses can navigate tax season efficiently, minimize liabilities, and stay compliant with tax regulations.",
  },
  {
    slug: "how-to-create-a-winning-marketing-plan",
    title: "How to Create a Winning Marketing Plan",
    description: "Learn the essential steps and elements to craft a winning marketing plan that effectively reaches your target audience and drives results.",
  },
  {
    slug: "10-strategies-for-business-growth-in-2023",
    title: "10 Strategies for Business Growth in 2023",
    description: "Learn how businesses can leverage technology to gain a competitive edge, streamline operations, and deliver exceptional value to customers.",
  },
  {
    slug: "navigating-tax-season-tips-for-small-businesses",
    title: "Navigating Tax Season: Tips for Small Businesses",
    description: "Dive into the qualities and strategies of effective leadership that inspire teams, foster growth, and achieve remarkable success.",
  },
  {
    slug: "the-power-of-data-analytics-in-business-decision-making",
    title: "The Power of Data Analytics in Business Decision-Making",
    description: "Get expert advice on how small businesses can navigate tax season efficiently, minimize liabilities, and stay compliant with tax regulations.",
  },
];

export const routeIntros: Record<string, RouteIntro> = {
  about: {
    title: "Turning Bold Ideas Into Quality Technology",
    subtitle: "WHO WE ARE",
    body: "A Born in Africa. Built to global standards. Designed for the world.Jorsas Tech is a technology company founded in Nigeria with a global outlook. We build high-quality, human-centred technology designed to solve real-world problems and create opportunities at scale. We believe technology should do more than demonstrate what is possible. It should be useful, reliable, accessible and worth what people pay for it. That belief shapes everything we build. Our approach is simple: understand real human needs, challenge conventional thinking, and turn ambitious ideas into practical digital products that people and businesses can genuinely benefit from. We pursue innovation with purpose—not technology for technology’s sake. At Jorsas Tech, quality and value for money are non-negotiable. We believe exceptional technology does not need unnecessary complexity or excessive cost. Every product bearing the Jorsas Tech name should be thoughtfully designed, reliably delivered and built to create meaningful value.Our culture is driven by excellence, creativity, ownership, integrity and continuous improvement. We encourage our people to think boldly, collaborate openly and take responsibility for building products we are proud to put our name on.From Africa to the world, our ambition is to build a globally recognised technology company known not simply for creating products, but for creating technology that matters. Our Promise Quality you can trust. Technology that delivers. Value that makes sense. Our Philosophy Think boldly. Build properly. Deliver value.",
  },
  services: {
    title: "Spotlight some most important features We have",
    subtitle: "SERVICES",
    body: "Our comprehensive suite of services includes expert Business Analysis, Tax Strategy, and Financial Advice. We partner with you to optimize your financial decisions, ensuring long-term success and prosperity for your business and personal finances.",
  },
  contact: {
    title: "We Are Connected To Help Your Business!",
    subtitle: "Get In Touch",
    body: "Ever Find Yourself Staring At Your Computer Screen A Good Consulting Slogan To Come To Mind? Oftentimes.",
  },
};

export const aboutCoreFeatures: ServiceCard[] = [
  {
    title: "WEB DEVELOPMENT",
    description: "Over the years, we've made a reputation for building websites that look great & are easy-to-use in 7 days. Just think about the website and allow us develop it.",
  },
  {
    title: "MOBILE APP DEVELOPMENT",
    description: "At Jorsas, our skilled Mobile Developers are always available to handle projects using modern technologies (Flutter) to develop mobile applications accessible on IOS and Android platforms.",
  },
  {
    title: "UI/UX DESIGNS",
    description: "Understanding the human experience is essential for creating useful and effective products. At Jorsas, our designers enjoy using their skill sets to empower people to accomplish their goals. We create digital experiences that make life easier.",
  },
];

export const servicesList: ServiceCard[] = [
  { title: "Data Analyst", description: "Analyzes financial data, optimizing processes for efficiency and identifying profitability opportunities." },
  { title: "Liability Planner", description: "Develops strategies to reduce tax burdens while maintaining legal compliance." },
  { title: "Growth Planner", description: "Develops strategies for sustainable market expansion and business growth." },
  { title: "Risk Manager", description: "Identifies and manages risks while aligning strategies with business goals." },
  { title: "Retirement Planner", description: "Helps clients plan for a secure and comfortable retirement." },
  { title: "Risk Analyst", description: "Identifies potential risks and develops strategies to mitigate them." },
];

export const caseStudiesServices: ServiceCard[] = [
  { title: "Data Analyst", description: "Analyzes financial data, optimizing processes for efficiency and identifying profitability opportunities." },
  { title: "Liability Planner", description: "Develops strategies to reduce tax burdens while maintaining legal compliance." },
  { title: "Growth Planner", description: "Develops strategies for sustainable market expansion and business growth." },
  { title: "Risk Manager", description: "Identifies and manages risks while aligning strategies with business goals." },
];

export const faqGroups: FaqGroup[] = [
  {
    title: "Service Offerings",
    questions: [
      "What industries do you specialize in?",
      "How do you collaborate with clients during the consulting process?",
      "What is your approach to sustainability consulting?",
      "How can your technology integration services benefit my business?",
      "What sets your leadership development programs apart?",
    ],
  },
  {
    title: "Cost and Billing",
    questions: [
      "What is business consulting?",
      "How do you structure your fees?",
      "How long does a typical consulting engagement last?",
      "Who are the key members of your consulting team?",
      "How do you handle client information and sensitive data?",
      "Do you offer remote consulting services?",
      "How do you stay updated on industry trends and best practices?",
      "What measures do you take to ensure the quality of your consulting services?",
    ],
  },
  {
    title: "Follow-Up Support",
    questions: [
      "How can consulting services benefit my business?",
      "What specific services do you provide?",
      "Can you share any client testimonials or case studies?",
      "Is there ongoing support after the consulting engagement?",
      "What is your policy regarding cancellations?",
    ],
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    slug: "free",
    name: "Free",
    price: "₦0",
    features: [
      "Full LMS access",
      "Unlimited courses & modules",
      "Student & staff portals",
      "Attendance & grading",
      "Group & direct chat",
    ],
  },
  {
    slug: "basic",
    name: "Basic",
    price: "₦5,000/mo",
    popular: true,
    features: [
      "Everything in Free",
      "Priority email support",
      "Custom branding",
      "Certificates",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    price: "₦15,000/mo",
    features: [
      "Everything in Basic",
      "Dedicated onboarding",
      "Advanced reporting",
      "Early access to new features",
    ],
  },
];

export const portfolioItems: PortfolioItem[] = [
  {
    slug: "web-development",
    title: "UC Project",
    summary: "A responsive website for UCFoundation was developed using the best of web technologies and Managed by JORSAS.",
    category: "Web Development",
    client: "UC Foundations",
    date: "Sep 01, 2020",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1665955656.png",
    body: "A responsive website for UCFoundation was developed using the best of web technologies and Managed by JORSAS.",
    sourceUrl: "https://jorsastech.com/projects/web-development",
  },
  {
    slug: "ozoya-football-foundation",
    title: "Ozoya Football Foundation",
    summary: "A responsive website was developed for the foundation and managed by JORSAS.",
    category: "Website Development",
    client: "Ozoya Football Foundation",
    date: "Jan 03, 2022",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1665995593.png",
    body: "A responsive website was developed for the foundation and managed by JORSAS. At Ozoya Foundations, they provide psycho-social support for children (girls and boys) affected by humanitarian situations including natural disasters and/or conflict through football.",
    sourceUrl: "https://jorsastech.com/projects/ozoya-football-foundation",
  },
  {
    slug: "website-development",
    title: "Website Development",
    summary: "A personal Portfolio website design and managed by JORSAS.",
    category: "Website Development",
    client: "Chime Emmanuel",
    date: "Dec 29, 2020",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1670766700.png",
    body: "A personal Portfolio website design and managed by JORSAS.",
    sourceUrl: "https://jorsastech.com/projects/website-development",
  },
  {
    slug: "penvost",
    title: "Penvost",
    summary: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    category: "Branding & Web Design",
    client: "Penvost",
    date: "Dec 09, 2022",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1670638469.png",
    body: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    sourceUrl: "https://jorsastech.com/projects/penvost",
  },
  {
    slug: "fjss-group",
    title: "FJSS Group",
    summary: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    category: "Branding & Web Design",
    client: "FJSS Group",
    date: "Mar 10, 2022",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1670638349-1.png",
    body: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    sourceUrl: "https://jorsastech.com/projects/fjss-group",
  },
  {
    slug: "branding-web-design",
    title: "Branding & Web Design",
    summary: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    category: "Branding & Web Design",
    client: "Walless Church",
    date: "Dec 09, 2022",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1670766103.png",
    body: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    sourceUrl: "https://jorsastech.com/projects/branding-web-design",
  },
  {
    slug: "branding-web-design-1",
    title: "Branding & Web Design",
    summary: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    category: "Branding & Web Design",
    client: "Pelirene Limited",
    date: "Dec 09, 2022",
    author: "Jorsas",
    image: "https://jorsastech.com/storage/backgrounds/1670638834.png",
    body: "This project was managed by Jorsas and delivered through our technical partner Noirtech.",
    sourceUrl: "https://jorsastech.com/projects/branding-web-design-1",
  },
];

export const sponsors: Sponsor[] = [
  {
    name: "Noirtech",
    logo: "/images/sponsors/noirtech.png",
    href: "https://noirtech.io",
  },
  {
    name: "ECR",
    logo: "/images/sponsors/ecr.png",
  },
  {
    name: "Payitmonthly",
    logo: "/images/sponsors/payitmonthly2023.png",
    href: "https://naturewave.com/",
  },
];

export const realEstateContent = {
  title: "Invest Smart with Jorsas",
  intro:
    "At Jorsas, we help you build wealth through strategic real estate insights and partnerships that last. Your journey to smart investments starts here.",
  whyTitle: "Why Choose Jorsas Real Estate?",
  whyBody:
    "We don't just deal in properties — we build long-term value. At Jorsas, we simplify real estate for our clients by offering personalized guidance, tech-enabled solutions, and a commitment to helping you grow.",
  contactTitle: "Get in Touch with Us",
  contactBody: "Let's help you take the next step in your real estate journey.",
};
