// 07 — Controllers: the controller layer (the "what happens" of each route).
// The route file (controllers.js) only maps URLs to these functions.
// A tiny in-memory array stands in for the database — the service layer
// (a real database) will replace it in a later phase.
const users = [
  { id: 1, name: 'Talha', email: 'talha@example.com' },
  { id: 2, name: 'Sara', email: 'sara@example.com' },
];
let nextId = 3;

// Each controller is a small function with ONE job: handle one endpoint.
// (req, res) in, a response out. Nothing else.
function listUsers(req, res) {
  res.json(users);
}

function getUser(req, res) {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

function createUser(req, res) {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const user = { id: nextId++, name, email };
  users.push(user);
  res.status(201).json(user);
}

function deleteUser(req, res) {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(index, 1);
  res.json({ message: 'User deleted' });
}

module.exports = { listUsers, getUser, createUser, deleteUser };
