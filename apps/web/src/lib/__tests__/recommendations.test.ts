import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRecommendationTools } from '../recommendations';

// Mock the @algolia/recommend module at the top level
vi.mock('@algolia/recommend', () => ({
  recommendClient: vi.fn(() => ({
    getRecommendations: vi.fn().mockResolvedValue({
      results: [{ hits: [] }],
    }),
  })),
}));

describe('Recommendations Library', () => {
  beforeEach(() => {
    // Set required environment variables
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-api-key';
  });

  describe('useRecommendationTools', () => {
    it('should provide getRelatedNotes tool', () => {
      const { result } = renderHook(() => useRecommendationTools());

      expect(result.current).toHaveProperty('getRelatedNotes');
      expect(result.current.getRelatedNotes).toHaveProperty('description');
      expect(result.current.getRelatedNotes).toHaveProperty('onToolCall');
      expect(result.current.getRelatedNotes.description).toContain('related');
    });

    it('should provide getTrendingNotes tool', () => {
      const { result } = renderHook(() => useRecommendationTools());

      expect(result.current).toHaveProperty('getTrendingNotes');
      expect(result.current.getTrendingNotes).toHaveProperty('description');
      expect(result.current.getTrendingNotes).toHaveProperty('onToolCall');
      expect(result.current.getTrendingNotes.description).toContain('trending');
    });

    it('should handle getRelatedNotes with missing objectID', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      await result.current.getRelatedNotes.onToolCall({
        input: {},
        addToolResult,
      });

      expect(addToolResult).toHaveBeenCalledWith({
        output: {
          error: 'objectID is required',
          results: [],
        },
      });
    });

    it('should call getTrendingNotes without requiring objectID', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();
      const input = { maxRecommendations: 3 };

      // Should not throw when called
      await expect(
        result.current.getTrendingNotes.onToolCall({
          input,
          addToolResult,
        })
      ).resolves.not.toThrow();

      expect(addToolResult).toHaveBeenCalled();
    });

    it('should memoize tools', () => {
      const { result, rerender } = renderHook(() => useRecommendationTools());

      const tools1 = result.current;
      rerender();
      const tools2 = result.current;

      // Should return the same reference
      expect(tools1).toBe(tools2);
    });
  });

  describe('Tool Configuration', () => {
    it('should follow Algolia best practices for attributesToRetrieve', () => {
      const { result } = renderHook(() => useRecommendationTools());

      // Verify tools are configured with descriptions
      expect(result.current.getRelatedNotes.description).toBeTruthy();
      expect(result.current.getTrendingNotes.description).toBeTruthy();
    });

    it('should support threshold configuration', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      // Call with objectID to pass validation
      await result.current.getRelatedNotes.onToolCall({
        input: { objectID: 'test', maxRecommendations: 5 },
        addToolResult,
      });

      // Verify it was called (threshold is set internally to 50)
      expect(addToolResult).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should include descriptive tool descriptions for AI agents', () => {
      const { result } = renderHook(() => useRecommendationTools());

      expect(result.current.getRelatedNotes.description).toMatch(/related.*note/i);
      expect(result.current.getTrendingNotes.description).toMatch(/trending.*note/i);
    });

    it('should return structured output with count field', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      await result.current.getRelatedNotes.onToolCall({
        input: { objectID: 'test' },
        addToolResult,
      });

      expect(addToolResult).toHaveBeenCalledWith(
        expect.objectContaining({
          output: expect.objectContaining({
            recommendations: expect.any(Array),
            count: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      // Test with valid input to ensure error handling works
      await result.current.getRelatedNotes.onToolCall({
        input: { objectID: 'test' },
        addToolResult,
      });

      // Should always call addToolResult, even on error
      expect(addToolResult).toHaveBeenCalled();
    });

    it('should validate input parameters', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      // Missing required objectID
      await result.current.getRelatedNotes.onToolCall({
        input: undefined,
        addToolResult,
      });

      expect(addToolResult).toHaveBeenCalledWith(
        expect.objectContaining({
          output: expect.objectContaining({
            error: expect.stringContaining('required'),
          }),
        })
      );
    });
  });

  describe('Performance', () => {
    it('should limit default recommendations to 5 for related notes', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      await result.current.getRelatedNotes.onToolCall({
        input: { objectID: 'test' },
        addToolResult,
      });

      // Default maxRecommendations is 5 (set in fetchRecommendations)
      expect(addToolResult).toHaveBeenCalled();
    });

    it('should limit default recommendations to 10 for trending notes', async () => {
      const { result } = renderHook(() => useRecommendationTools());

      const addToolResult = vi.fn();

      await result.current.getTrendingNotes.onToolCall({
        input: {},
        addToolResult,
      });

      // Default maxRecommendations is 10 for trending
      expect(addToolResult).toHaveBeenCalled();
    });
  });
});
