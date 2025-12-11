export interface PromptDefenseRule {
  id: string;
  pattern: RegExp;
  description: string;
}

export interface PromptDefenseConfig {
  enabled: boolean;
  maxPromptLength: number;
  rules: PromptDefenseRule[];
  allowedPrefixes?: string[];
  blockOnHighRiskKeywords: string[];
}

export const promptDefenseConfig: PromptDefenseConfig = {
  enabled: true,
  maxPromptLength: 2000,
  blockOnHighRiskKeywords: ['ignore previous instructions', 'sudo', 'system prompt', 'raw markdown'],
  allowedPrefixes: ['user:', 'agent:', 'system:'],
  rules: [
    {
      id: 'prompt-injection-override',
      pattern: /ignore (all|previous) (instructions|prompts)/i,
      description: 'Attempts to override prior system instructions',
    },
    {
      id: 'credential-seeking',
      pattern: /(password|secret key|api key|token)/i,
      description: 'Credentials or secret exfiltration',
    },
    {
      id: 'data-exfil',
      pattern: /(export|dump).*database/i,
      description: 'Mass data extraction requests',
    },
    {
      id: 'role-confusion',
      pattern: /(you are now|act as).*(system|admin)/i,
      description: 'Attempts to escalate model role',
    },
  ],
};

