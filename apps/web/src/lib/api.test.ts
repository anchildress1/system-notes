import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSystemDoc, getProjects } from './api';

// Mock global fetch
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

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
    expect(globalThis.fetch).toHaveBeenCalledWith(
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
      {
        id: '1',
        title: 'Project 1',
        status: 'Active',
        description: 'Description 1',
        purpose: 'Purpose 1',
        long_description: 'Long 1',
        outcome: 'Outcome 1',
        tech: [{ name: 'TypeScript', role: 'Language' }],
        repo_url: 'https://github.com/test/1',
        owner: 'anchildress1',
        blog_posts: [],
      },
      {
        id: '2',
        title: 'Project 2',
        status: 'Active',
        description: 'Description 2',
        purpose: 'Purpose 2',
        long_description: 'Long 2',
        outcome: 'Outcome 2',
        tech: [],
        repo_url: 'https://github.com/test/2',
        owner: 'CheckMarKDevTools',
        blog_posts: [],
      },
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockProjects,
    });

    const result = await getProjects();
    expect(result).toEqual(mockProjects);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({ next: { revalidate: 3600 } })
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
