// src/utils/api.js

const createFetchApi = (baseURL) => {
  if (!baseURL) {
    console.error("createFetchApi: baseURL is undefined. API calls will fail.");
    // Return a dummy function to prevent crashes, but log the error
    return async (url, options = {}) => {
      console.error(
        `Attempted API call to ${url} with no base URL configured.`
      );
      throw new Error("API_BASE_URL not configured.");
    };
  }

  return async (url, options = {}) => {
    const { token } = options;
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fullUrl = `${baseURL}${url}`; // Construct the full URL using the provided baseURL

    try {
      const response = await fetch(fullUrl, { ...options, headers });
      if (!response.ok) {
        let errorData = {};
        try {
          // Try to parse JSON error, but handle cases where response body might be empty or not JSON
          errorData = await response.json();
        } catch (e) {
          // If JSON parsing fails, use response status text
          errorData = {
            message: response.statusText || "An unknown error occurred",
          };
        }
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP error! status: ${response.status}`
        );
      }
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      )
        return null; // No content for 204 or empty response
      return response.json();
    } catch (err) {
      // Re-throw with more context if it's a network error before response
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error(
          `Network error or CORS issue: Could not connect to ${fullUrl}. Details: ${err.message}`
        );
      }
      throw err; // Re-throw the original error from fetchApi logic
    }
  };
};

export default createFetchApi;
