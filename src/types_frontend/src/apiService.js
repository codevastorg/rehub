// apiService.js
class ApiService {
    constructor(baseEndpoint) {
      this.baseEndpoint = baseEndpoint;
    }
  
    async makeRequest(path, options = {}) {
      const url = `${this.baseEndpoint}${path}`;
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'An error occurred');
        }
        return await response.json();
      } catch (error) {
        console.error('API error:', error);
        throw error; // Re-throw to handle these errors in the UI components
      }
    }
  
    fetchUsers() {
      return this.makeRequest('/users');
    }
  
    addUser(userData) {
      return this.makeRequest('/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(userData)
      });
    }
  
    mintTokens(userId, amount) {
      return this.makeRequest(`/users/${userId}/mintTokens`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ amount })
      });
    }
  }
  
  export default new ApiService('/api');
  