// src/data/mockHistory.js

export const mockHistory = [
  {
    id: "hist_001",
    repoId: "repo1", // Corresponds to Reploit-Backend-Core
    question: "How do I set up a custom domain?",
    answer: `To set up a custom domain, you need to configure the DNS records with your domain provider.\n\n1.  **CNAME Record:** Point your 'www' subdomain to our deployment URL.\n2.  **A Record:** Point your root domain '@' to our IP address: 192.0.2.1.\n\nAfter configuring, it may take up to 48 hours for the changes to propagate.`,
    timestamp: new Date("2024-05-20T10:30:00Z").toISOString(),
  },
  {
    id: "hist_002",
    repoId: "repo2", // Corresponds to Personal-Website-V2
    question: "What is the best way to handle environment variables?",
    answer: `Use a '.env' file for local development and configure secrets directly in the Reploit deployment settings for production. They are encrypted and securely injected into your build process.`,
    timestamp: new Date("2024-05-21T14:15:00Z").toISOString(),
  },
  {
    id: "hist_003",
    repoId: "repo1", // Corresponds to Reploit-Backend-Core
    question:
      'My build is failing with a "memory limit exceeded" error. How can I fix this?',
    answer: `This error typically occurs on larger projects. Upgrade your instance plan. The 'Pro' plan increases memory to 8GB, which should be sufficient.`,
    timestamp: new Date("2024-05-22T09:00:00Z").toISOString(),
  },
  {
    id: "hist_004",
    repoId: "repo4", // Corresponds to Project-Quantum-Leap-Archives
    question: "How does Reploit handle caching for static assets?",
    answer: `Reploit automatically configures aggressive caching policies via our global CDN. When you redeploy, all asset URLs are fingerprinted with a new hash, automatically invalidating the cache.`,
    timestamp: new Date("2024-05-23T18:45:00Z").toISOString(),
  },
];
