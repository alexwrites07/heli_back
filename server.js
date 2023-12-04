// API endpoints for users
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3002;
const usersFilePath = path.join(__dirname, 'users.json');

app.use(cors());
app.use(bodyParser.json());

let users = []; // Initialize as an empty array
let teams = []; // Initialize teams array

// Read data from users.json on server startup
async function readUserData() {
  try {
    const rawData = await fs.readFile(usersFilePath, 'utf-8');
    users = JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading user data:', error.message);
  }
}

// Call the function to read data from users.json
readUserData();

// API endpoints for users
app.get('/api/users', (req, res) => {
  const { page = 1, search, domain, gender, availability } = req.query;
  let filteredUsers = [...users];

  // Search by name
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      user.first_name.toLowerCase().includes(searchTerm) || user.last_name.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by domain
  if (domain) {
    filteredUsers = filteredUsers.filter(user => user.domain.toLowerCase() === domain.toLowerCase());
  }

  // Filter by gender
  if (gender) {
    filteredUsers = filteredUsers.filter(user => user.gender.toLowerCase() === gender.toLowerCase());
  }

  // Filter by availability
  if (availability !== undefined) {
    const isAvailable = availability.toLowerCase() === 'true';
    filteredUsers = filteredUsers.filter(user => user.available === isAvailable);
  }

  // Pagination
  const pageSize = 50;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  res.json({ data: paginatedUsers });
});

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/users', (req, res) => {
  const newUser = req.body;
  newUser.id = users.length + 1;
  users.push(newUser);
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const updatedUser = req.body;
  const index = users.findIndex(u => u.id === userId);

  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  users = users.filter(u => u.id !== userId);
  res.json({ success: true });
});

// API endpoints for teams
app.post('/api/team', (req, res) => {
  const { teamMembers } = req.body;
  const uniqueDomains = new Set();
  const uniqueAvailabilities = new Set();

  teamMembers.forEach(member => {
    const user = users.find(u => u.id === member);
    if (user) {
      uniqueDomains.add(user.domain);
      uniqueAvailabilities.add(user.available);
    }
  });

  if (uniqueDomains.size === teamMembers.length && uniqueAvailabilities.size === 1) {
    const newTeam = { id: teams.length + 1, teamMembers };
    teams.push(newTeam);
    res.json(newTeam);
  } else {
    res.status(400).json({ error: 'Invalid team members' });
  }
});

app.get('/api/team/:id', (req, res) => {
  const teamId = parseInt(req.params.id);
  const team = teams.find(t => t.id === teamId);

  if (team) {
    res.json(team);
  } else {
    res.status(404).json({ error: 'Team not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});