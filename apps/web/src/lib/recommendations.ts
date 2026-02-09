'use client';

import { useMemo } from 'react';
import { recommendClient as createRecommendClient } from '@algolia/recommend';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'merged-search';

// Lazy initialize Algolia Recommend client
let recommendClient: ReturnType<typeof createRecommendClient> | null = null;

function getRecommendClient() {
  if (!recommendClient && appId && apiKey && /^[A-Z0-9]{10}$/i.test(appId) && apiKey.length >= 20) {
    recommendClient = createRecommendClient(appId, apiKey);
  }
  return recommendClient;
}

export interface RecommendParams {
  objectID: string;
  modelName: 'related-products' | 'trending-items' | 'bought-together' | 'looking-similar';
  maxRecommendations?: number;
  threshold?: number;
  queryParameters?: {
    attributesToRetrieve?: string[];
    filters?: string;
  };
}

export interface RecommendResult {
  objectID: string;
  title: string;
  blurb?: string;
  category?: string;
  'tags.lvl1'?: string[];
  projects?: string[];
  _score?: number;
}

/**
 * Fetch recommendations using Algolia Recommend API
 * Follows best practices from https://www.algolia.com/doc/guides/algolia-ai/agent-studio/how-to/tools/algolia-recommend
 */
export async function fetchRecommendations(params: RecommendParams): Promise<RecommendResult[]> {
  const client = getRecommendClient();

  if (!client) {
    console.warn('Algolia Recommend client not initialized');
    return [];
  }

  try {
    const {
      objectID,
      modelName,
      maxRecommendations = 5,
      threshold = 0,
      queryParameters = {},
    } = params;

    // Default attributes optimized for performance and relevance
    const defaultAttributes = ['objectID', 'title', 'blurb', 'category', 'tags.lvl1', 'projects'];

    const queries = [
      {
        indexName,
        objectID,
        model: modelName,
        threshold,
        maxRecommendations,
        queryParameters: {
          attributesToRetrieve: queryParameters.attributesToRetrieve || defaultAttributes,
          filters: queryParameters.filters || '',
        },
      },
    ];

    const response = await client.getRecommendations(queries);

    if (!response || !response.results || response.results.length === 0) {
      return [];
    }

    return response.results[0].hits as RecommendResult[];
  } catch (error) {
    console.warn('Error fetching recommendations:', error);
    return [];
  }
}

/**
 * Hook to create recommendation tools for AI Chat
 * Provides related-products and trending-items recommendation capabilities
 */
export function useRecommendationTools() {
  return useMemo(
    () => ({
      getRelatedNotes: {
        description: 'Find system notes related to a specific note by similarity',
        onToolCall: async (params: {
          input: unknown;
          addToolResult: (result: { output: unknown }) => void;
        }) => {
          const { input, addToolResult } = params;
          const typedInput = input as
            | {
                objectID?: string;
                maxRecommendations?: number;
                filters?: string;
              }
            | undefined;

          if (!typedInput?.objectID) {
            addToolResult({
              output: {
                error: 'objectID is required',
                results: [],
              },
            });
            return;
          }

          try {
            const recommendations = await fetchRecommendations({
              objectID: typedInput.objectID,
              modelName: 'related-products',
              maxRecommendations: typedInput.maxRecommendations || 5,
              threshold: 50, // Confidence threshold (0-100)
              queryParameters: {
                filters: typedInput.filters,
              },
            });

            addToolResult({
              output: {
                recommendations,
                count: recommendations.length,
              },
            });
          } catch (error) {
            console.warn('getRelatedNotes error:', error);
            addToolResult({
              output: {
                error: 'Failed to fetch related notes',
                results: [],
              },
            });
          }
        },
      },
      getTrendingNotes: {
        description: 'Get trending or popular system notes',
        onToolCall: async (params: {
          input: unknown;
          addToolResult: (result: { output: unknown }) => void;
        }) => {
          const { input, addToolResult } = params;
          const typedInput = input as
            | {
                maxRecommendations?: number;
                filters?: string;
              }
            | undefined;

          try {
            // For trending-items, we need a facet value instead of objectID
            // Using the first available note as a seed
            const recommendations = await fetchRecommendations({
              objectID: '', // Trending doesn't require specific objectID
              modelName: 'trending-items',
              maxRecommendations: typedInput?.maxRecommendations || 10,
              threshold: 0,
              queryParameters: {
                filters: typedInput?.filters,
              },
            });

            addToolResult({
              output: {
                recommendations,
                count: recommendations.length,
              },
            });
          } catch (error) {
            console.warn('getTrendingNotes error:', error);
            addToolResult({
              output: {
                error: 'Failed to fetch trending notes',
                results: [],
              },
            });
          }
        },
      },
    }),
    []
  );
}
