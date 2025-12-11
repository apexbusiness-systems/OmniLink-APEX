import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceInterface from '@/components/VoiceInterface';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/RealtimeAudio', () => ({
  AudioRecorder: class {
    start = vi.fn(async () => {});
    stop = vi.fn();
  },
  encodeAudioForAPI: () => '',
  playAudioData: vi.fn(),
  clearAudioQueue: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
  logAnalyticsEvent: vi.fn(),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send() {}
  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as any);
  }

  triggerError() {
    this.onerror?.({} as any);
  }
}

describe('VoiceInterface backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    // @ts-ignore
    global.WebSocket = MockWebSocket;
    // @ts-ignore
    global.AudioContext = class {
      destination = {};
      close = vi.fn();
    };
    // @ts-ignore
    navigator.mediaDevices = {
      getUserMedia: vi.fn(async () => ({})),
    };
  });

  it('enters degraded mode after retry exhaustion', async () => {
    render(<VoiceInterface />);

    const startButton = screen.getByText(/Start Voice Chat/i);
    fireEvent.click(startButton);

    expect(MockWebSocket.instances.length).toBeGreaterThan(0);

    for (let i = 0; i < 3; i++) {
      const socket = MockWebSocket.instances[i];
      socket.triggerError();
      await vi.runOnlyPendingTimersAsync();
    }

    await waitFor(() =>
      expect(screen.getByText(/Voice connection degraded/i)).toBeInTheDocument()
    );
  });
});

