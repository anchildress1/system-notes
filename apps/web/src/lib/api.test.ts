import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getProjects } from './api';

global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches projects successfully', async () => {
    const mockProjects = [{ id: '1', title: 'Test', description: 'desc' }];
    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProjects,
    });

    const projects = await getProjects();
    expect(projects).toEqual(mockProjects);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/projects'), expect.any(Object));
  });

  it('returns empty array on fetch failure', async () => {
    (fetch as unknown as Mock).mockResolvedValue({
      ok: false,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const projects = await getProjects();
    expect(projects).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('API Error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('returns empty array on network error', async () => {
    (fetch as unknown as Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const projects = await getProjects();
    expect(projects).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
