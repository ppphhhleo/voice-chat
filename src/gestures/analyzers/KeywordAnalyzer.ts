import type { GestureAnalyzer, GestureEvent, AnalyzerContext, GestureName } from "../types";

interface KeywordRule {
  pattern: RegExp;
  gesture: GestureName;
  duration: number;
  mirror?: boolean;
  confidence: number;
}

const DEFAULT_RULES: KeywordRule[] = [
  // Positive/Agreement
  { pattern: /\b(great|awesome|excellent|perfect|wonderful|fantastic)\b/i, gesture: "thumbup", duration: 2, confidence: 0.8 },
  { pattern: /\b(yes|yeah|absolutely|definitely|exactly|correct)\b/i, gesture: "thumbup", duration: 1.5, confidence: 0.6 },
  { pattern: /\b(okay|ok|alright|sounds good|sure|got it)\b/i, gesture: "ok", duration: 2, confidence: 0.5 },

  // Negative
  { pattern: /\b(unfortunately|sadly|bad news|not great|terrible)\b/i, gesture: "thumbdown", duration: 2, confidence: 0.7 },

  // Uncertainty
  { pattern: /\b(i don't know|not sure|maybe|perhaps|possibly)\b/i, gesture: "shrug", duration: 2.5, confidence: 0.7 },
  { pattern: /\b(it depends|hard to say|could be)\b/i, gesture: "shrug", duration: 2, confidence: 0.6 },

  // Emphasis
  { pattern: /\b(important|key point|remember|notice|consider this)\b/i, gesture: "index", duration: 2, confidence: 0.7 },
  { pattern: /\b(first|second|third|specifically|in particular)\b/i, gesture: "index", duration: 1.5, confidence: 0.5 },

  // Greeting/Attention
  { pattern: /\b(hello|hi there|hey|greetings|welcome)\b/i, gesture: "handup", duration: 2, confidence: 0.8 },
  { pattern: /\b(wait|hold on|one moment|let me)\b/i, gesture: "handup", duration: 2, confidence: 0.6 },

  // Gratitude
  { pattern: /\b(thank you|thanks|grateful|appreciate)\b/i, gesture: "namaste", duration: 2, confidence: 0.7 },
];

export class KeywordAnalyzer implements GestureAnalyzer {
  name = "keyword";
  private rules: KeywordRule[];

  constructor(customRules?: KeywordRule[]) {
    this.rules = customRules ?? DEFAULT_RULES;
  }

  analyze(context: AnalyzerContext): GestureEvent[] {
    const events: GestureEvent[] = [];

    for (const rule of this.rules) {
      if (rule.pattern.test(context.newText)) {
        // Avoid repeating the same gesture
        if (!context.recentGestures.includes(rule.gesture)) {
          events.push({
            gesture: rule.gesture,
            duration: rule.duration,
            mirror: rule.mirror,
            confidence: rule.confidence,
            source: this.name,
          });
          break; // One gesture per analysis
        }
      }
    }

    return events;
  }

  // Allow runtime rule updates
  setRules(rules: KeywordRule[]) {
    this.rules = rules;
  }

  addRule(rule: KeywordRule) {
    this.rules.push(rule);
  }
}
