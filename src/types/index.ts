export interface BigFive {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export type Voice = "Ara" | "Rex" | "Sal" | "Eve" | "Leo";

export interface Message {
  role: "user" | "assistant";
  content: string;
}
