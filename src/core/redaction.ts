export interface SecretMatch {
  label: string;
  value: string;
  index: number;
}

const SECRET_PATTERNS = [
  { label: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { label: "OpenAI-style key", pattern: /sk-[A-Za-z0-9_-]{20,}/g },
  { label: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g },
  { label: "Generic secret assignment", pattern: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{18,}/gi }
];

export function findSecretLikeValues(text: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  for (const secret of SECRET_PATTERNS) {
    for (const match of text.matchAll(secret.pattern)) {
      const value = match[0];
      if (isClearlyFake(value)) continue;
      matches.push({
        label: secret.label,
        value,
        index: match.index ?? 0
      });
    }
  }
  return matches.sort((left, right) => left.index - right.index);
}

export function redactSecretLikeText(text: string): string {
  let output = text;
  const uniqueValues = [...new Set(findSecretLikeValues(text).map((match) => match.value))];
  for (const value of uniqueValues) {
    output = output.replaceAll(value, redactValue(value));
  }
  return output;
}

export function redactValue(value: string): string {
  if (value.length <= 8) return "[redacted]";
  return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
}

export function isClearlyFake(value: string): boolean {
  return /(example|fake|dummy|placeholder|test-only|scannerDetectionOnly|xxxx|0000|1234)/i.test(value);
}
