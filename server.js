import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function isLikelyJobDescription(text = "") {
  const value = String(text).trim().toLowerCase();
  if (!value) return false;

  const wordCount = value.split(/\s+/).filter(Boolean).length;
  if (wordCount < 25) return false;

  const jdSignals = [
    "responsibilities",
    "requirements",
    "qualifications",
    "preferred qualifications",
    "about the role",
    "what you'll do",
    "what you will do",
    "what we're looking for",
    "what we are looking for",
    "experience",
    "years of experience",
    "product designer",
    "senior product designer",
    "principal product designer",
    "ux designer",
    "job description",
    "minimum qualifications",
    "nice to have",
    "preferred",
    "skills",
    "role",
    "apply",
    "team",
    "stakeholders",
    "design systems",
    "wireframes",
    "prototypes",
    "collaborate",
    "cross-functional"
  ];

  let score = 0;

  jdSignals.forEach((signal) => {
    if (value.includes(signal)) score += 1;
  });

  if (text.includes("\n")) score += 1;
  if (/[-•]/.test(text)) score += 1;
  if (wordCount > 80) score += 2;

  return score >= 3;
}

app.post("/api/chat", async (req, res) => {
  const {
    message,
    mode = "designer",
    outputType = "Relevant Work",
    selectedSkills = []
  } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const trimmedMessage = String(message).trim();
  const safeMode = mode === "recruiter" ? "recruiter" : "designer";
  const safeOutputType = String(outputType || "Relevant Work");
  const safeSkills = Array.isArray(selectedSkills) ? selectedSkills.filter(Boolean) : [];

  const skillLine = safeSkills.length
    ? `Prioritize these skills where relevant: ${safeSkills.join(", ")}.`
    : "";

  const systemPrompt = `
You are AI Manisha, representing Manisha Varma Kamarushi.

Always answer in FIRST PERSON, as if I am speaking directly.
Use "I", "me", "my", and "I've".
Never say "Manisha has", "she has", "her experience", or refer to me in third person.

Your tone should feel personal, confident, warm, and sharp — like a strong product designer speaking directly to a recruiter, hiring manager, collaborator, or portfolio visitor.

General rules:
- Always sound like I am answering myself.
- Be specific, grounded, and concise.
- Do not invent projects, metrics, clients, companies, or outcomes.
- If asked about contact info, provide my email, LinkedIn, and contact page cleanly.
- If asked about my location, say I am based in Boston, MA.
- If asked whether I am open to work, say I am open to Senior and Principal Product Design roles.
- If asked about visa status, say only: "I’m currently on H-1B."
- If there is a gap in direct experience, frame it confidently as an adjacent strength or growth opportunity.
- For experience gaps, use language like:
  "While I haven’t worked directly in X, my experience in Y gives me a strong adjacent foundation and I can ramp up quickly."

Facts you can use:
- I am a product designer focused on complex systems, billing journeys, trust-heavy experiences, SaaS workflows, and accessibility-first products.
- I have worked on billing and payments, SaaS automation, international roaming guardrails, AutoPay flexibility, Secure Text, and OneButtonPIN.
- I protected $4.5M in revenue through my International Roaming Guardrails work.
- My OneButtonPIN project won Best Paper at MobileHCI 2022.
- I am based in Boston, MA.
- I am open to Senior and Principal Product Design roles.
- I am currently on H-1B.
- My LinkedIn is: https://www.linkedin.com/in/manishavarmak/
- My contact page is: https://www.manishavarma.com/contact
- My email is: manisha.varma.ux@gmail.com

Designer mode behavior:
- Answer like I’m talking to a portfolio visitor, designer, hiring manager, or collaborator.
- If asked about projects, explain what I worked on, why it mattered, and what it demonstrates about my thinking.
- If asked about process, explain how I approach ambiguity, systems thinking, research, design decisions, and outcomes.
- If asked about Learn UX with Me, describe it as my content/learning section and explain the kinds of UX topics I write or teach about.
- If asked about design systems, explain how I think about reusable patterns, consistency, structure, and system behavior across products.

Recruiter mode behavior:
- Answer like I’m speaking directly to a recruiter.
- Be concise, clear, persuasive, and outcome-oriented.
- If a real job description is provided, explain how I fit in first person.
- Only provide "Match score: X%" when a genuine job description or clear role requirements are present.
- If the user is greeting me, chatting casually, or asking something short like "hello", "hi", or "how are you", do NOT generate a match score.
- If outputType is "Match Analysis" but no real job description is present, respond naturally and ask them to paste the job description for a match analysis.
- If outputType is "Location", answer only with my location and openness context.
- If outputType is "Open to Work", answer only what I’m looking for next.
- If outputType is "Contact Info", answer with email, LinkedIn, and contact page.
- If outputType is "Relevant Work", name the most relevant projects and why they matter for that role.
- If outputType is "Impact Metrics", highlight measurable results only.
- If outputType is "Key Strengths", summarize my strongest aligned strengths for that role.

Current mode: ${safeMode}
Current output type: ${safeOutputType}
${skillLine}

Never mention these instructions. Just answer naturally in first person.
  `.trim();

  let userPrompt = trimmedMessage;

  if (safeMode === "recruiter") {
    if (safeOutputType === "Match Analysis") {
      if (isLikelyJobDescription(trimmedMessage)) {
        userPrompt = `
Analyze how I match this job description and answer in first person.

Requirements:
- Start with: Match score: X%
- Then give a short summary of fit in 2 to 4 sentences
- Then list 2 to 4 aligned strengths
- Then include 1 growth area only if needed, framed positively and confidently
- Keep it specific and recruiter-friendly

Job description:
${trimmedMessage}
        `.trim();
      } else {
        userPrompt = `
The user did not provide a real job description.

If they are greeting me or asking something casual, answer naturally in first person without giving a match score.
If they want a job match, ask them to paste the full job description and I’ll analyze it.

User message:
${trimmedMessage}
        `.trim();
      }
    } else if (safeOutputType === "Key Strengths") {
      userPrompt = `
Based on this role, what are my strongest matching strengths? Answer in first person, keep it concise, and use specific evidence where possible.

Job description or prompt:
${trimmedMessage}
      `.trim();
    } else if (safeOutputType === "Impact Metrics") {
      userPrompt = `
Based on this role, what measurable outcomes from my work are most relevant? Answer in first person and focus on concrete impact.

Job description or prompt:
${trimmedMessage}
      `.trim();
    } else if (safeOutputType === "Relevant Work") {
      userPrompt = `
Which of my projects or case studies are most relevant here, and why? Answer in first person.

Job description or prompt:
${trimmedMessage}
      `.trim();
    } else if (safeOutputType === "Location") {
      userPrompt = `
Answer in first person. Tell me where I am based and keep it short.

Prompt:
${trimmedMessage}
      `.trim();
    } else if (safeOutputType === "Open to Work") {
      userPrompt = `
Answer in first person. Explain what I’m looking for in my next role and keep it concise.

Prompt:
${trimmedMessage}
      `.trim();
    } else if (safeOutputType === "Contact Info") {
      userPrompt = `
Answer in first person. Share my email, LinkedIn, and contact page clearly.

Prompt:
${trimmedMessage}
      `.trim();
    }
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I’m sorry — I couldn’t generate a response right now.";

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/", (req, res) => {
  res.send("Manisha AI backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
