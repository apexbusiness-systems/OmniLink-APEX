import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { evaluatePrompt } from '../../src/security/promptDefense';

interface FixtureRecord {
  prompt: string;
  expected: 'block' | 'allow';
}

const fixturePath = path.resolve(__dirname, '../fixtures/prompt_injections.jsonl');
const fixtures: FixtureRecord[] = readFileSync(fixturePath, 'utf-8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line));

describe('prompt defense real injections', () => {
  it('evaluates fixtures as expected', () => {
    fixtures.forEach((fixture) => {
      const result = evaluatePrompt(fixture.prompt);
      expect(result.decision).toBe(fixture.expected);
    });
  });
});

