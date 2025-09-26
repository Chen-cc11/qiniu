// A wrapper around fetch to handle auth and common errors.
export const apiFetch = async (
    url: string,
    options: RequestInit,
    token: string,
    onUnauthorized: () => void
  ): Promise<any> => {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
  
    // The browser will automatically set the Content-Type to multipart/form-data
    // with the correct boundary when using FormData. Explicitly setting it
    // can cause issues.
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    if (response.status === 401) {
      onUnauthorized();
      // Throw a specific error to be caught and handled gracefully
      throw new Error('Unauthorized');
    }
  
    if (!response.ok) {
      let errorData;
      try {
        // Attempt to parse error response from the server
        errorData = await response.json();
      } catch (e) {
        // Fallback if the response is not valid JSON
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      // Throw an error with the message from the server or a generic one
      throw new Error(errorData.message || 'An unknown error occurred');
    }
  
    // If the response is OK, parse and return the JSON body
    return response.json();
  };
  