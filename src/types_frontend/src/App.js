import { html, render } from 'lit-html';

class App {
  constructor() {
    this.users = [];
    this.fetchUsers();
  }

  fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      this.users = await response.json();
      this.render();
    } catch (error) {
      console.error('Fetch error:', error);
      this.renderError(error.message);
    }
  };

  addUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Failed to add user');
      await this.fetchUsers();
    } catch (error) {
      console.error('Add user error:', error);
      this.renderError(error.message);
    }
  };

  render = () => {
    const template = html`
      <div class="container">
        <h1>User Management</h1>
        <ul>
          ${this.users.map(user => html`
          <li>${user.name} - Tokens: ${user.tokens}</li>`)}
        </ul>
        <button @click="${this.showAddUserForm}">Add User</button>
      </div>
    `;
    render(template, document.getElementById('root'));
  };

  showAddUserForm = () => {
    const template = html`
      <form @submit="${this.handleAddUser}">
        <input id="name" type="text" placeholder="Enter user name" required />
        <input id="sobrietyDate" type="date" required />
        <button type="submit">Add User</button>
      </form>
    `;
    render(template, document.getElementById('root'));
  };

  handleAddUser = async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('#name').value;
    const sobrietyDate = e.target.querySelector('#sobrietyDate').value;
    await this.addUser({ name, sobrietyDate });
  };

  renderError = (message) => {
    const errorTemplate = html`
      <p style="color: red;">Error: ${message}</p>
    `;
    render(errorTemplate, document.getElementById('root'));
  };

  addTokens = async (userId, amount) => {
    try {
      const response = await fetch(`/api/users/${userId}/addTokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to add tokens');
      await this.fetchUsers(); // Refresh the user list to reflect token updates
    } catch (error) {
      console.error('Error adding tokens:', error);
      this.renderError(`Failed to add tokens: ${error.message}`);
    }
  };

  setupTokenManagement = () => {
    document.querySelectorAll('.add-tokens-btn').forEach(button => {
      button.addEventListener('click', event => {
        const userId = button.getAttribute('data-user-id');
        const amount = parseInt(prompt("Enter tokens to add:", "10"), 10);
        if (!isNaN(amount)) {
          this.addTokens(userId, amount);
        } else {
          console.error('Invalid amount entered');
        }
      });
    });
  };
}

export default App;