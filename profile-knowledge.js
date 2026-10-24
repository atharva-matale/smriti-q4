/**
 * profile-knowledge.js
 * ────────────────────
 * Generic Template for User Profile & Resume Knowledge Base.
 * 
 * Replace the template entries below with your own details.
 * The fuzzy matching engine handles typos, abbreviations, and informal phrasing,
 * strictly enforcing the Zero-Hallucination Guardrail policy.
 */

export const PROFILE_KNOWLEDGE = [
  {
    topic: "identity",
    title: "About Me",
    keywords: [
      "who", "name", "about", "yourself", "urself", "introduce", "intro",
      "profile", "bio", "tell me about", "who are you", "who is",
      "assistant", "representative", "background", "summary"
    ],
    answer: "Alex Rivera is a Full-Stack Software Engineer & ML Practitioner specializing in high-performance web systems, distributed backends, and edge AI applications. Passionate about building resilient products that scale."
  },
  {
    topic: "contact",
    title: "Contact & Social Links",
    keywords: [
      "contact", "email", "reach", "hire", "get in touch", "connect", "mail",
      "github", "linkedin", "social", "links", "handle", "message", "twitter"
    ],
    answer: "You can reach Alex directly via:\n• Email: alex.rivera@example.com\n• GitHub: github.com/your-username\n• LinkedIn: linkedin.com/in/your-profile"
  },
  {
    topic: "education",
    title: "Education",
    keywords: [
      "education", "degree", "college", "university", "school", "bachelor",
      "master", "study", "studied", "academics", "undergrad", "graduate"
    ],
    answer: "Alex holds a Bachelor of Science in Computer Science from State University of Technology (Graduated 2024)."
  },
  {
    topic: "skills_all",
    title: "Technical Skills",
    keywords: [
      "skills", "technologies", "tech", "stack", "frameworks", "tools",
      "libraries", "languages", "what do you know", "expertise", "competencies"
    ],
    answer: "Technical skillset covers:\n• Languages: TypeScript, Python, Go, SQL, Modern JavaScript (ES6+).\n• Frameworks & Libraries: React, Next.js, Node.js, FastAPI, PyTorch, TailwindCSS.\n• Databases & Systems: PostgreSQL, Redis, Vector Databases, Docker, AWS, CI/CD.\n• Core Focus: Scalable API design, responsive frontend architecture, and on-device ML."
  },
  {
    topic: "experience_all",
    title: "Work Experience Overview",
    keywords: [
      "experience", "experoience", "work", "job", "career", "employment",
      "roles", "history", "internship", "worked", "companies", "where have you worked"
    ],
    answer: "Professional Experience:\n1. Software Engineer at Apex Tech (2024 – Present): Built real-time analytics microservices reducing query latency by 35% and supporting 100k+ daily active users.\n2. Full-Stack Engineering Intern at Nova Labs (Summer 2023): Developed interactive React dashboards and automated CI/CD deployment pipelines."
  },
  {
    topic: "projects_all",
    title: "Projects",
    keywords: [
      "projects", "portfolio", "what have you built", "built", "apps",
      "creations", "software", "portfolio projects", "showcase"
    ],
    answer: "Featured Projects:\n1. CloudPulse: Real-time telemetry monitoring dashboard with WebSockets and Go.\n2. DocuSearch AI: Client-side vector search engine for offline technical documentation.\n3. FastDeploy CLI: Open-source developer CLI tool simplifying container staging."
  },
  {
    topic: "achievements",
    title: "Achievements & Awards",
    keywords: [
      "achievements", "awards", "hackathon", "winner", "honors", "recognition"
    ],
    answer: "Alex was the First Place Winner at Global Hack 2024 for building an offline-first disaster response coordination application."
  }
];

/**
 * Normalizes text: lowercase, remove special characters, collapse whitespace.
 */
function cleanText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fuzzy keyword matcher with zero-hallucination guardrail fallback.
 */
export function queryProfile(userQuery) {
  if (!userQuery || typeof userQuery !== "string") return null;

  const rawClean = cleanText(userQuery);
  if (!rawClean) return null;

  // Typo & synonym expansion
  const queryWithSynonyms = rawClean
    .replace(/experoience|experince|experiance/g, "experience")
    .replace(/aboyt|abot|abt/g, "about")
    .replace(/urself|your self/g, "yourself")
    .replace(/projcts|proj/g, "projects")
    .replace(/educaton|clg|colg/g, "education")
    .replace(/skils|skil/g, "skills");

  const normalizedTokens = queryWithSynonyms.split(" ").filter(w => w.length > 1);

  let bestMatch = null;
  let highestScore = 0;

  for (const item of PROFILE_KNOWLEDGE) {
    let score = 0;

    // Check exact keyword phrases
    for (const kw of item.keywords) {
      if (queryWithSynonyms.includes(kw) || rawClean.includes(kw)) {
        score += kw.includes(" ") ? 6 : 3;
      }
    }

    // Check token overlap
    for (const token of normalizedTokens) {
      for (const kw of item.keywords) {
        if (kw === token) {
          score += 2;
        } else if (kw.length > 4 && (kw.startsWith(token) || token.startsWith(kw))) {
          score += 1.5;
        }
      }
      if (item.answer.toLowerCase().includes(token)) {
        score += 0.4;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Strict score threshold
  if (highestScore >= 2.0 && bestMatch) {
    return bestMatch.answer;
  }

  // ZERO-HALLUCINATION GUARDRAIL:
  return "That information is not specified on the resume. You can connect directly via email or LinkedIn to learn more.";
}
