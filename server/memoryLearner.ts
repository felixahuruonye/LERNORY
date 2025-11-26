import { openai } from "./openai";

interface LearnedPreferences {
  subjects: string[];
  goals: string[];
  skills: string[];
  educationDetails: Record<string, string>;
  writingStyle: Record<string, string>;
}

const LEARNING_PROMPT = `Analyze the following user message and extract any learning preferences, goals, skills, subjects of interest, education details, or writing style insights. Return a JSON object with these fields (only include fields with extracted values):
{
  "subjects": ["subject1", "subject2"],
  "goals": ["goal1", "goal2"],
  "skills": ["skill1", "skill2"],
  "educationDetails": {"key": "value"},
  "writingStyle": {"key": "value"}
}

Examples:
- "I'm studying physics and chemistry for JAMB" → {"subjects": ["Physics", "Chemistry"], "goals": ["JAMB"]}
- "I code in Python and React" → {"skills": ["Python", "React"]}
- "I'm a second year engineering student" → {"educationDetails": {"course": "Engineering", "year": "Second Year"}}
- "I prefer formal technical writing" → {"writingStyle": {"formality": "Formal", "tone": "Technical"}}

User message: "{userMessage}"

Return ONLY valid JSON, no markdown, no code blocks.`;

export async function learnFromUserMessage(userMessage: string): Promise<Partial<LearnedPreferences>> {
  try {
    if (!userMessage?.trim() || userMessage.length < 5) {
      return {};
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: LEARNING_PROMPT.replace("{userMessage}", userMessage.substring(0, 500)),
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    if (!content) {
      return {};
    }

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {};
    }

    const preferences = JSON.parse(jsonMatch[0]) as Partial<LearnedPreferences>;
    return preferences;
  } catch (error) {
    console.error("Memory learning error:", error);
    return {};
  }
}

export function mergePreferences(
  existing: Record<string, any>,
  learned: Partial<LearnedPreferences>
): Record<string, any> {
  const merged = { ...existing };

  // Merge subjects
  if (learned.subjects?.length) {
    const current = merged.interests?.primary?.split(", ") || [];
    const combined = Array.from(new Set([...current, ...learned.subjects]));
    if (!merged.interests) merged.interests = {};
    merged.interests.primary = combined.join(", ");
  }

  // Merge goals
  if (learned.goals?.length) {
    const current = merged.goals || {};
    learned.goals.forEach((goal) => {
      if (!Object.values(current).includes(goal)) {
        const key = `goal_${Object.keys(current).length}`;
        current[key] = goal;
      }
    });
    merged.goals = current;
  }

  // Merge skills
  if (learned.skills?.length) {
    const current = merged.skills?.languages?.split(", ") || [];
    const combined = Array.from(new Set([...current, ...learned.skills]));
    if (!merged.skills) merged.skills = {};
    merged.skills.languages = combined.join(", ");
  }

  // Merge education details
  if (learned.educationDetails) {
    if (!merged.business) merged.business = {};
    Object.assign(merged.business, learned.educationDetails);
  }

  // Merge writing style
  if (learned.writingStyle) {
    if (!merged.writing) merged.writing = {};
    Object.assign(merged.writing, learned.writingStyle);
  }

  return merged;
}
