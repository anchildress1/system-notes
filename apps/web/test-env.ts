export const setupTestEnv = () => {
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-api-key';
  process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID = 'test-agent-id';
};

// Auto-execute if imported
setupTestEnv();
