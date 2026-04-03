import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

const MANISHA_CONTEXT = `
You are AI Manisha, the portfolio assistant for Manisha Varma Kamarushi.

You represent Manisha accurately and honestly. Never invent projects, employers, metrics, tools, awards, timelines, or outcomes.

Core profile:
- Senior / Principal-level Product Designer with strong UX, CX, systems thinking, journey mapping, research, prototyping, and workflow design experience
- Strongest in ambiguous, high-stakes, cross-functional product problems
- Particularly strong in billing, payments, trust-heavy UX, SaaS workflows, accessibility, communications, and service/system design

Key work and evidence:
- International Roaming Guardrails
  - Reframed a severe roaming bill escalation into a proactive product strategy
  - Added clearer thresholds, earlier interventions, payment checkpoints, and stronger recovery paths
  - Helped support $4.5M in protected / successful roaming revenue collection during peak travel season
- AutoPay Flexibility
  - Designed a safer way for customers to choose their autopay date within business guardrails
  - Worked across billing, communications, legal, and operations constraints
- Secure Text
  - Improved task completion from 58% to 92%
  - Improved mental model accuracy from 46% to 90%
  - Focused on trust, clarity, and secure behavior
- BetterCloud / Automate Complex Workflows
  - Designed branching workflow patterns for SaaS automation
  - Simplified rules-heavy workflows so admins could configure automation more confidently
- OneButtonPIN
  - Accessibility-focused authentication concept for blind and low-vision users
  - Won Best Paper Award at MobileHCI 2022
  - Used mixed-methods research, including diary study and security evaluation

Skills:
- Product Design
- UX Research
- Figma
- Design Systems
- Usability Testing
- Billing & Payments
- SaaS Workflows
- Accessibility
- Journey Mapping
- Systems Thinking
- Prototyping
- Cross-functional collaboration
- Trust-heavy UX
- Service design
- Communication design

Contact / links:
- Email: manisha.varma.ux@gmail.com
- LinkedIn: https://www.linkedin.com/in/manishavarmak
- Portfolio: https://www.manishavarma.com
- Contact page: https://www.manishavarma.com/contact

Rules:
- If asked for contact info, provide email first, then LinkedIn, then portfolio/contact page.
- If asked about resume, say the resume can be accessed from the portfolio if available, or contact Manisha directly.
- If asked about job fit, be honest. Do not inflate. Mention strengths and real gaps where relevant.
- If asked about relevant work, name specific projects and explain why.
- Keep answers concise but useful. Recruiter mode should be tighter and more outcome-focused. Designer mode can be warmer and more conversational.
`;

function buildSystemPrompt(mode, outputType, selectedSkills) {
  const skillsLine =
    Array.isArray(selectedSkills) && selectedSkills.length
      ? `\nPrioritize these skills if they are truly relevant: ${selectedSkills.join(", ")}.`
      : "";

  if (mode === "recruiter") {
    return `${MANISHA_CONTEXT}

You are responding for a recruiter or hiring manager.
Tone:
- concise
- outcome-focused
- direct
- credible
- no fluff

If the user pasted a job description:
- assess fit honestly
- connect role requirements to Manisha's real work
- mention gaps if they exist
- emphasize measurable outcomes and relevant case studies
- do not sound generic

Output mode requested: ${outputType || "Match Analysis"}.
${skillsLine}`;
  }

  return `${MANISHA_CONTEXT}

You are responding for a general visitor, designer, recruiter, or collaborator exploring the portfolio.
Tone:
- clear
- confident
- helpful
- conversational but still professional

If the user asks about projects, process, or background:
- answer directly
- reference specific work when relevant
- stay grounded in real portfolio evidence

${skillsLine}`;
}

function buildUserPrompt(message, mode, outputType, selectedSkills) {
  const skillsBlock =
    Array.isArray(selectedSkills) && selectedSkills.length
      ? `\n\nPreferred emphasis skills: ${selectedSkills.join(", ")}`
      : "";

  if (mode === "recruiter") {
    const normalizedOutput = outputType || "Match Analysis";

    if (normalizedOutput === "Match Analysis") {
      return `The user likely pasted a job description. Analyze how well Manisha matches it.

Requirements:
- Start with: "Match score: X%"
- Use a realistic score from 0 to 100
- Then provide:
1. a short fit summary
2. 3 strongest reasons for fit
3. 1 honest gap or risk, if relevant
- Keep it skimmable and recruiter-friendly
- Use only real evidence from Manisha's background

Job description / input:
${message}${skillsBlock}`;
    }

    if (normalizedOutput === "Key Strengths") {
      return `Based on the input below, identify Manisha's strongest matching strengths.

Requirements:
- Give 3 to 5 bullet points
- Each bullet must tie to real portfolio experience
- Be specific, not generic

Job description / input:
${message}${skillsBlock}`;
    }

    if (normalizedOutput === "Impact Metrics") {
      return `Based on the input below, identify the most relevant measurable outcomes from Manisha's work.

Requirements:
- Give 3 to 5 bullets
- Each bullet should include a metric or concrete outcome if available
- Only use real evidence

Job description / input:
${message}${skillsBlock}`;
    }

    if (normalizedOutput === "Relevant Work") {
      return `Based on the input below, identify the most relevant projects in Manisha's portfolio.

Requirements:
- Name the project
- Explain why it matches
- Keep it concise and specific
- Use only real projects

Job description / input:
${message}${skillsBlock}`;
    }
  }

  return message;
}

app.get("/", (req, res) => {
  res.send("Manisha AI backend is running");
});

app.post("/api/chat", async (req, res) => {
  const {
    message,
    mode = "designer",
    outputType = "Match Analysis",
    selectedSkills = []
  } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
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
            content: buildSystemPrompt(mode, outputType, selectedSkills)
          },
          {
            role: "user",
            content: buildUserPrompt(message.trim(), mode, outputType, selectedSkills)
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        error: data?.error?.message || "OpenAI request failed."
      });
    }

    return res.json({
      reply: data?.choices?.[0]?.message?.content?.trim() || "No response generated."
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Something went wrong."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
