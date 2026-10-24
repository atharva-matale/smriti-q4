# Complete Tuning & Guardrail Customization Guide for smriti-q4

This guide teaches you how to tune **smriti-q4** to represent your own portfolio with the **highest standard of factual accuracy and zero hallucination**.

---

## 🛡️ The Problem with Raw SLM Inference

Small Language Models (under 1B parameters, such as 135M) are ideal for client-side web deployment because:
- They download in seconds (<120MB - 180MB).
- They consume virtually zero client memory.
- They achieve 40+ tokens/second on standard laptop GPUs and CPUs.

**However**, passing a full 2-page resume into raw context prompts creates severe limitations:
1. **Context Overflow & Drift**: Small models lose attention across long instructions.
2. **Hallucination / Gibberish**: When visitors ask off-topic or ambiguous questions (e.g. *"what are your hobbies?"* or *"tell me about yourself"* with typos), small models generate repetitive loops or random fabricated names.

### The Solution: Grounded 2-Tier Architecture
`smriti-q4` implements a **Retrieval-First Zero-Hallucination Pipeline**:
1. **Tier 1 (Fuzzy Semantic Matcher)**: Parses the user query, cleans up common typos and slang (e.g. `experoience`, `urself`, `abt`), and scores against your structured knowledge base.
2. **Tier 2 (Strict Guardrail Fallback)**: If a query asks for information not explicitly on your resume, it triggers a clean, professional guardrail fallback:
   > *"That information is not specified on the resume. You can connect directly via email or LinkedIn to learn more."*

---

## 📝 Step-by-Step Tuning for Your Resume

All your profile information lives in **`profile-knowledge.js`**. You do not need to touch any model weights or write backend code.

### Step 1: Open `profile-knowledge.js`
Look for the `PROFILE_KNOWLEDGE` array:

```javascript
export const PROFILE_KNOWLEDGE = [
  // ... entries
];
```

### Step 2: Configure Your Core Sections

#### 1. Identity & Bio (`identity`)
```javascript
{
  topic: "identity",
  title: "About Me",
  keywords: [
    "who", "name", "about", "yourself", "urself", "introduce", "intro",
    "profile", "bio", "tell me about", "who are you", "who is",
    "assistant", "representative", "background", "summary"
  ],
  answer: "Your Name is a [Your Title] specializing in [Your Core Specialties]. [1-2 sentences summarizing your passion or mission]."
}
```

#### 2. Contact & Socials (`contact`)
```javascript
{
  topic: "contact",
  title: "Contact & Social Links",
  keywords: [
    "contact", "email", "reach", "hire", "get in touch", "connect", "mail",
    "github", "linkedin", "social", "links", "handle", "message", "twitter"
  ],
  answer: "You can reach [Your Name] directly via:\n• Email: your.email@example.com\n• GitHub: github.com/your-handle\n• LinkedIn: linkedin.com/in/your-profile"
}
```

#### 3. Education (`education`)
```javascript
{
  topic: "education",
  title: "Education",
  keywords: [
    "education", "degree", "college", "university", "school", "bachelor",
    "master", "study", "studied", "academics", "undergrad", "graduate"
  ],
  answer: "[Your Name] holds a [Degree Name] in [Major] from [University / College Name] (Graduated [Year])."
}
```

#### 4. Technical Skills (`skills_all`)
```javascript
{
  topic: "skills_all",
  title: "Technical Skills",
  keywords: [
    "skills", "technologies", "tech", "stack", "frameworks", "tools",
    "libraries", "languages", "what do you know", "expertise", "competencies"
  ],
  answer: "Technical skillset covers:\n• Languages: [Your Languages]\n• Frameworks & Libraries: [Your Frameworks]\n• Databases & Cloud: [Your DBs / Cloud Providers]\n• Core Focus: [Your Core Strengths]"
}
```

#### 5. Experience (`experience_all` and specific companies)
You can create an overall summary, or individual entries for each company:
```javascript
{
  topic: "experience_all",
  title: "Work Experience Overview",
  keywords: [
    "experience", "experoience", "work", "job", "career", "employment",
    "roles", "history", "internship", "worked", "companies", "where have you worked"
  ],
  answer: "Professional Experience:\n1. [Role Title] at [Company Name] ([Dates]): [Key achievements with metrics].\n2. [Role Title] at [Company Name] ([Dates]): [Key achievements with metrics]."
}
```

#### 6. Projects (`projects_all` or individual projects)
```javascript
{
  topic: "projects_all",
  title: "Projects",
  keywords: [
    "projects", "portfolio", "what have you built", "built", "apps",
    "creations", "software", "portfolio projects", "showcase"
  ],
  answer: "Featured Projects:\n1. [Project 1 Name]: [Brief description, tech stack, and impact/metric].\n2. [Project 2 Name]: [Brief description, tech stack, and impact/metric]."
}
```

---

## ⚙️ How to Tune Match Sensitivity

In `profile-knowledge.js`, the scoring logic evaluates keyword and token matches:

```javascript
// Score threshold
if (highestScore >= 2.0 && bestMatch) {
  return bestMatch.answer;
}
```

- **Default (`2.0`)**: Recommended. Accurately handles common variations without false positives.
- **Lower threshold (`1.2`)**: More aggressive matching for short, single-word queries (e.g. *"zenher"* or *"education"*).
- **Higher threshold (`3.0`)**: Conservative matching; requires multi-keyword or exact phrase matches.

---

## 🔤 Adding Custom Typo Corrections

In `queryProfile()` inside `profile-knowledge.js`, you can add custom domain abbreviations or common misspellings:

```javascript
const queryWithSynonyms = rawClean
  .replace(/experoience|experince|experiance/g, "experience")
  .replace(/aboyt|abot|abt/g, "about")
  .replace(/urself|your self/g, "yourself")
  .replace(/projcts|proj/g, "projects")
  .replace(/educaton|clg|colg/g, "education")
  .replace(/skils|skil/g, "skills");
```

---

## 🧪 Testing Your Customization

1. Start your local test server:
   ```bash
   python -m http.server 8080
   ```
2. Navigate to `http://localhost:8080/test.html`
3. Click **"Download & Load Model"**
4. Test with both valid and invalid queries:
   - *"tell me aboyt the experoience"* -> should trigger your experience.
   - *"tell me bout urself"* -> should trigger your intro/bio.
   - *"what is your favorite movie?"* -> should cleanly trigger the guardrail fallback.
