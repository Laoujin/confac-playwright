/**
 * Client for interacting with mock services (Peppol/Billit, Excel)
 * Provides /prime and /calls endpoints for test control
 */
export class MockClient {
  constructor(private baseUrl: string) {}

  /**
   * Reset the mock service state (clear primed responses and recorded calls)
   */
  async reset(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reset`, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Failed to reset mock: ${response.statusText}`);
    }
  }

  /**
   * Prime a response for a specific endpoint
   */
  async prime(options: {
    endpoint: string;
    method?: string;
    response?: any;
    status?: number;
    delay?: number;
    error?: string;
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/prime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!response.ok) {
      throw new Error(`Failed to prime mock: ${response.statusText}`);
    }
  }

  /**
   * Get all recorded calls to the mock service
   */
  async getCalls(): Promise<MockCall[]> {
    const response = await fetch(`${this.baseUrl}/calls`);
    if (!response.ok) {
      throw new Error(`Failed to get calls: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get calls for a specific endpoint
   */
  async getCallsFor(endpoint: string): Promise<MockCall[]> {
    const response = await fetch(`${this.baseUrl}/calls${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to get calls for ${endpoint}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Clear recorded calls
   */
  async clearCalls(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/calls`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Failed to clear calls: ${response.statusText}`);
    }
  }

  /**
   * Assert that a specific endpoint was called
   */
  async assertCalled(endpoint: string, options?: { times?: number; method?: string }): Promise<void> {
    const calls = await this.getCallsFor(endpoint);
    const filtered = options?.method
      ? calls.filter(c => c.method === options.method)
      : calls;

    if (options?.times !== undefined) {
      if (filtered.length !== options.times) {
        throw new Error(
          `Expected ${endpoint} to be called ${options.times} times, but was called ${filtered.length} times`
        );
      }
    } else if (filtered.length === 0) {
      throw new Error(`Expected ${endpoint} to be called, but it was not`);
    }
  }

  /**
   * Assert that a specific endpoint was NOT called
   */
  async assertNotCalled(endpoint: string): Promise<void> {
    const calls = await this.getCallsFor(endpoint);
    if (calls.length > 0) {
      throw new Error(`Expected ${endpoint} to not be called, but it was called ${calls.length} times`);
    }
  }
}

export interface MockCall {
  endpoint: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: string;
}

// Pre-configured clients for common mocks
export const peppolMock = new MockClient('http://localhost:3002');
export const excelMock = new MockClient('http://localhost:3300');
