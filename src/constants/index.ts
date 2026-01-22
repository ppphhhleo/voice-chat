import { BigFive, Voice } from "@/types";

export const VOICES: { id: Voice; label: string; desc: string }[] = [
  { id: "Ara", label: "Ara", desc: "Warm, friendly" },
  { id: "Rex", label: "Rex", desc: "Confident, clear" },
  { id: "Sal", label: "Sal", desc: "Smooth, balanced" },
  { id: "Eve", label: "Eve", desc: "Energetic, upbeat" },
  { id: "Leo", label: "Leo", desc: "Authoritative, strong" },
];

export const TRAIT_LABELS: Record<keyof BigFive, { low: string; high: string }> = {
  openness: { low: "Practical", high: "Creative" },
  conscientiousness: { low: "Flexible", high: "Organized" },
  extraversion: { low: "Reserved", high: "Outgoing" },
  agreeableness: { low: "Analytical", high: "Compassionate" },
  neuroticism: { low: "Calm", high: "Sensitive" },
};

export const SAMPLE_RATE = 24000;
