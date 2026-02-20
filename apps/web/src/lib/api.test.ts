import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSystemDoc, getProjects } from './api';

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

describe('getProjects', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return projects on successful fetch', async () => {
    const mockProjects = [
      { id: '1', title: 'Project 1', description: 'Description 1' },
      { id: '2', title: 'Project 2', description: 'Description 2' },
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockProjects,
    });

    const result = await getProjects();
    expect(result).toEqual(mockProjects);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('should return empty array on fetch failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getProjects();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should return empty array on network error', async () => {
    const networkError = new Error('Network error');
    fetchMock.mockRejectedValue(networkError);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getProjects();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('API Error:', networkError);

    consoleSpy.mockRestore();
  });
});

describe('getSystemDoc edge cases', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should handle 500 server error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Something went wrong',
    });

    const result = await getSystemDoc('test/path');

    expect(result).toEqual({
      content: '',
      format: 'text',
      path: 'test/path',
      error: 'Error 500: Something went wrong',
    });
  });

  it('should handle response.text() failure gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: async () => {
        throw new Error('Body read failed');
      },
    });

    const result = await getSystemDoc('test/path');

    expect(result).toEqual({
      content: '',
      format: 'text',
      path: 'test/path',
      error: 'Error 502: Bad Gateway',
    });
  });

  it('should handle non-Error thrown values', async () => {
    fetchMock.mockRejectedValue('string error');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getSystemDoc('test/path');
    expect(result?.error).toBe('string error');

    consoleSpy.mockRestore();
  });
});
