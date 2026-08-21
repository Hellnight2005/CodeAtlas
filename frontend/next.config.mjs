/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const REPO_PARSER_URL = process.env.REPO_PARSER_URL || 'http://localhost:5001';
    const GIT_AUTH_URL = process.env.GIT_AUTH_URL || 'http://localhost:3000';

    return [
      {
        source: '/api/repo/generate-ast',
        destination: `${REPO_PARSER_URL}/generate-ast`,
      },
      {
        source: '/api/graph/delete',
        destination: `${REPO_PARSER_URL}/delete-graph`,
      },
      {
        source: '/api/repo/:path*',
        destination: `${REPO_PARSER_URL}/api/repo/:path*`,
      },
      {
        source: '/api/graph/:path*',
        destination: `${REPO_PARSER_URL}/api/graph/:path*`,
      },
      {
        source: '/api/check_for_the_file',
        destination: `${REPO_PARSER_URL}/api/check_for_the_file`,
      },
    ];
  },
};

export default nextConfig;
