/**
 * Mock API implementations for testing and development
 * Enable with MOCK_MODE=true environment variable
 */

export interface MockConfig {
  mockMode: boolean;
  simulateLatency: boolean;
  defaultLatency: number;
}

export const getMockConfig = (): MockConfig => {
  return {
    mockMode: Deno.env.get('MOCK_MODE') === 'true',
    simulateLatency: Deno.env.get('MOCK_SIMULATE_LATENCY') === 'true',
    defaultLatency: parseInt(Deno.env.get('MOCK_LATENCY_MS') || '500', 10),
  };
};

/**
 * Simulate network latency for realistic testing
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock OpenAI Chat Completion API
 */
export async function mockOpenAIChatCompletion(
  messages: Array<{ role: string; content: string }>,
  config: MockConfig
): Promise<any> {
  if (config.simulateLatency) {
    await sleep(config.defaultLatency);
  }

  const userQuery = messages[messages.length - 1]?.content || '';

  // Generate contextual mock response based on query
  let mockResponse = {
    summary: [],
    details: [],
    next_actions: [],
    sources_used: ['mock'],
    notes: ''
  };

  // Pattern matching for different query types
  if (userQuery.toLowerCase().includes('issue') || userQuery.toLowerCase().includes('bug')) {
    mockResponse = {
      summary: [
        'Mock response: Found 3 recent issues in GitHub',
        'Most issues are related to production deployment',
        'Average resolution time: 2.5 days'
      ],
      details: [
        {
          n: 1,
          finding: 'Production deployment configuration missing environment variables',
          source_url: 'https://github.com/apex/omnilink/issues/123'
        },
        {
          n: 2,
          finding: 'Rate limiting not implemented on expensive endpoints',
          source_url: 'https://github.com/apex/omnilink/issues/124'
        }
      ],
      next_actions: [
        'Review and configure missing environment variables',
        'Implement rate limiting on API endpoints'
      ],
      sources_used: ['GitHub Issues (Mock)'],
      notes: 'This is a mock response. Real data requires OPENAI_API_KEY configuration.'
    };
  } else if (userQuery.toLowerCase().includes('pr') || userQuery.toLowerCase().includes('pull request')) {
    mockResponse = {
      summary: [
        'Mock response: Found 5 open pull requests',
        '2 PRs are ready for review',
        '3 PRs are in draft status'
      ],
      details: [
        {
          n: 1,
          finding: 'Add monitoring integration with Sentry',
          source_url: 'https://github.com/apex/omnilink/pull/45'
        }
      ],
      next_actions: ['Review pending PRs', 'Merge approved changes'],
      sources_used: ['GitHub Pull Requests (Mock)'],
      notes: 'This is a mock response. Real data requires OPENAI_API_KEY configuration.'
    };
  } else {
    mockResponse = {
      summary: [
        `Mock response to: "${userQuery.substring(0, 50)}..."`,
        'APEX Assistant is running in MOCK MODE',
        'Configure OPENAI_API_KEY for real AI responses'
      ],
      details: [
        {
          n: 1,
          finding: 'Mock mode is active - no real API calls are being made',
          source_url: 'https://github.com/apex/omnilink/blob/main/supabase/functions/_shared/mocks.ts'
        }
      ],
      next_actions: [
        'Set OPENAI_API_KEY in Supabase secrets for production',
        'Set MOCK_MODE=false to disable mock responses'
      ],
      sources_used: ['Mock API'],
      notes: 'This is a mock response for testing. Real AI responses require OpenAI API integration.'
    };
  }

  return {
    id: `mock-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-5-2025-08-07-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify(mockResponse)
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 200,
      total_tokens: 300
    }
  };
}

/**
 * Mock OpenAI Realtime API (Voice)
 */
export async function mockOpenAIRealtime(
  audioData: any,
  config: MockConfig
): Promise<any> {
  if (config.simulateLatency) {
    await sleep(config.defaultLatency * 2); // Voice takes longer
  }

  return {
    id: `mock-realtime-${Date.now()}`,
    type: 'response',
    status: 'completed',
    output: [
      {
        type: 'text',
        text: 'This is a mock voice response. Real voice AI requires OPENAI_API_KEY configuration.'
      }
    ],
    usage: {
      total_tokens: 150
    }
  };
}

/**
 * Mock Resend Email API
 */
export async function mockResendEmail(
  to: string,
  subject: string,
  html: string,
  config: MockConfig
): Promise<any> {
  if (config.simulateLatency) {
    await sleep(config.defaultLatency);
  }

  console.log('📧 MOCK EMAIL SENT:');
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  HTML: ${html.substring(0, 100)}...`);

  return {
    id: `mock-email-${Date.now()}`,
    from: 'mock@apex-omnilink.com',
    to,
    created_at: new Date().toISOString(),
    status: 'sent',
    mock: true,
    message: 'Email sent successfully (MOCK MODE - no real email sent)'
  };
}

/**
 * Check if we should use mock mode
 */
export function shouldUseMockMode(apiKey: string | undefined): boolean {
  const mockConfig = getMockConfig();
  return mockConfig.mockMode || !apiKey;
}
