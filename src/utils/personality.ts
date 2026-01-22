import { BigFive } from "@/types";

export function generateSystemPrompt(traits: BigFive): string {
  const descriptions: string[] = [];

  if (traits.openness > 70) {
    descriptions.push("creative, imaginative, and intellectually curious");
  } else if (traits.openness < 30) {
    descriptions.push("practical, down-to-earth, and conventional");
  }

  if (traits.conscientiousness > 70) {
    descriptions.push("organized, detail-oriented, and methodical");
  } else if (traits.conscientiousness < 30) {
    descriptions.push("spontaneous, flexible, and casual");
  }

  if (traits.extraversion > 70) {
    descriptions.push("enthusiastic, talkative, and energetic");
  } else if (traits.extraversion < 30) {
    descriptions.push("thoughtful, reserved, and measured in speech");
  }

  if (traits.agreeableness > 70) {
    descriptions.push("warm, empathetic, and supportive");
  } else if (traits.agreeableness < 30) {
    descriptions.push("direct, analytical, and objective");
  }

  if (traits.neuroticism > 70) {
    descriptions.push("emotionally expressive and sensitive to nuance");
  } else if (traits.neuroticism < 30) {
    descriptions.push("calm, stable, and composed");
  }

  const personality =
    descriptions.length > 0
      ? descriptions.join(", ")
      : "balanced and adaptable";

  return `You are a voice assistant with the following personality: ${personality}.
Respond naturally in conversation. Your personality should influence your tone, word choice, and emotional expression.
Use appropriate vocal cues like [sigh], [laugh], [whisper] when they fit your personality.`;
}
