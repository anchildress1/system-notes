import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSystemDoc } from './api';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('getSystemDoc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return document content on successful fetch', async () => {
    const mockResponse = {
      content: 'test content',
      format: 'markdown',
      path: 'test/path',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getSystemDoc('test/path');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/system/doc/test/path'),
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('should return error object on 404', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Document not found',
    });

    const result = await getSystemDoc('nonexistent/path');

    expect(result).toEqual({
      content: '',
      format: 'text',
      path: 'nonexistent/path',
      error: 'Error 404: Document not found',
    });
  });

  it('should return error object on network failure', async () => {
    const networkError = new Error('Network error');
    fetchMock.mockRejectedValue(networkError);

    const result = await getSystemDoc('test/path');

    expect(result).toEqual({
      content: '',
      format: 'text',
      path: 'test/path',
      error: 'Network error',
    });
  });
});
