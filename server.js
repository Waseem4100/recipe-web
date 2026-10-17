const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const RECIPES_FILE = path.join(__dirname, 'data', 'recipes.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- tiny JSON "database" ---------- */
const read = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;
if (!fs.existsSync(RECIPES_FILE)) {
  write(RECIPES_FILE, [
    { id: 1, title: 'Fluffy Blueberry Pancakes', description: 'Thick, soft pancakes bursting with blueberries.', image: img('photo-1528207776546-365bb710ee93'), category: 'Breakfast', difficulty: 'Easy', time: 25,
      ingredients: ['1½ cups flour', '1 tbsp sugar', '2 tsp baking powder', '1 cup milk', '1 egg', '1 cup blueberries', '2 tbsp melted butter'],
      steps: ['Whisk the dry ingredients together.', 'Mix milk, egg and butter, then fold into the dry mix.', 'Fold in the blueberries.', 'Cook ¼ cup scoops on a hot greased pan until bubbles form, flip, and cook 1 more minute.'],
      authorId: 0, authorName: 'RecipeHub', ratings: [{ userId: 0, value: 5 }, { userId: -1, value: 4 }] },
    { id: 2, title: 'Chickpea Coconut Curry', description: 'A creamy, one-pot vegan curry ready in 30 minutes.', image: img('photo-1455619452474-d2be8b1e70cd'), category: 'Vegan', difficulty: 'Easy', time: 30,
      ingredients: ['2 cans chickpeas', '1 can coconut milk', '1 onion', '3 garlic cloves', '2 tbsp curry powder', '1 can chopped tomatoes', 'Fresh coriander'],
      steps: ['Sauté onion and garlic until soft.', 'Stir in curry powder for 1 minute.', 'Add tomatoes, chickpeas and coconut milk.', 'Simmer 20 minutes and finish with coriander. Serve with rice.'],
      authorId: 0, authorName: 'RecipeHub', ratings: [{ userId: 0, value: 5 }] },
    { id: 3, title: 'Molten Chocolate Lava Cakes', description: 'Individual cakes with a gooey chocolate centre.', image: img('photo-1624353365286-3f8d62daad51'), category: 'Desserts', difficulty: 'Medium', time: 35,
      ingredients: ['100g dark chocolate', '100g butter', '2 eggs + 2 yolks', '¼ cup sugar', '2 tbsp flour'],
      steps: ['Melt chocolate and butter together.', 'Whisk eggs, yolks and sugar until pale.', 'Combine both mixtures and fold in the flour.', 'Pour into greased ramekins and bake at 220°C for 10–12 minutes.', 'Rest 1 minute, then flip onto a plate.'],
      authorId: 0, authorName: 'RecipeHub', ratings: [{ userId: 0, value: 5 }, { userId: -1, value: 5 }] },
    { id: 4, title: 'Classic Chicken Biryani', description: 'Fragrant layered rice with spiced marinated chicken.', image: img('photo-1563379091339-03b21ab4a4f8'), category: 'Dinner', difficulty: 'Hard', time: 90,
      ingredients: ['1 kg chicken', '3 cups basmati rice', '1 cup yogurt', '3 onions, fried', 'Biryani masala', 'Saffron milk', 'Mint and coriander'],
      steps: ['Marinate chicken in yogurt and masala for 1 hour.', 'Par-boil the rice with whole spices.', 'Cook the chicken until tender.', 'Layer rice over chicken with fried onions, herbs and saffron milk.', 'Seal and steam on low heat for 20 minutes.'],
      authorId: 0, authorName: 'RecipeHub', ratings: [{ userId: 0, value: 5 }, { userId: -1, value: 4 }] },
    { id: 5, title: 'Avocado Toast with Egg', description: 'Crunchy sourdough, smashed avocado and a jammy egg.', image: img('photo-1525351484163-7529414344d8'), category: 'Breakfast', difficulty: 'Easy', time: 10,
      ingredients: ['2 slices sourdough', '1 ripe avocado', '2 eggs', 'Lemon juice', 'Chilli flakes', 'Salt'],
      steps: ['Toast the bread.', 'Smash avocado with lemon juice and salt.', 'Boil eggs for 6½ minutes, then peel.', 'Spread avocado on toast, top with halved eggs and chilli flakes.'],
      authorId: 0, authorName: 'RecipeHub', ratings: [{ userId: 0, value: 4 }] },
    { id: 6, title: 'Quinoa Buddha Bowl', description: 'Roasted veggies, quinoa and a lemon-tahini dressing.', image: img('photo-1512621776951-a57141f2eefd'), category: 'Vegan', difficulty: 'Easy', time: 40,
      ingredients: ['1 cup quinoa', '1 sweet potato', '1 cup broccoli', '1 can chickpeas', '2 tbsp tahini', '1 lemon'],
      steps: ['Cook the quinoa.', 'Roast sweet potato, broccoli and chickpeas at 200°C for 25 minutes.', 'Whisk tahini, lemon juice and water into a dressing.', 'Assemble bowls and drizzle with dressing.'],
      authorId: 0, authorName: 'RecipeHub', ratings: [{ userId: 0, value: 4 }, { userId: -1, value: 5 }] }
  ]);
}
if (!fs.existsSync(USERS_FILE)) write(USERS_FILE, []);

/* ---------- helpers ---------- */
const avg = (r) => (r.ratings.length ? +(r.ratings.reduce((s, x) => s + x.value, 0) / r.ratings.length).toFixed(1) : 0);
const present = (r) => ({ ...r, rating: avg(r), ratingCount: r.ratings.length, ratings: undefined });

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Please log in again.' });
  }
}
const sign = (u) => jwt.sign({ id: u.id, name: u.name, email: u.email }, JWT_SECRET, { expiresIn: '7d' });

/* ---------- auth routes ---------- */
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const users = read(USERS_FILE);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = { id: Date.now(), name: name.trim(), email: email.trim(), password: await bcrypt.hash(password, 10) };
  users.push(user);
  write(USERS_FILE, users);
  res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = read(USERS_FILE).find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ error: 'Incorrect email or password.' });
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

/* ---------- recipe routes ---------- */
// GET /api/recipes?q=&category=&maxTime=&mine=1
app.get('/api/recipes', (req, res) => {
  const { q, category, maxTime, mine } = req.query;
  let list = read(RECIPES_FILE);
  if (q) {
    const s = q.toLowerCase();
    list = list.filter((r) => r.title.toLowerCase().includes(s) || r.ingredients.some((i) => i.toLowerCase().includes(s)));
  }
  if (category) list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  if (maxTime) list = list.filter((r) => r.time <= Number(maxTime));
  if (mine) {
    try {
      const u = jwt.verify((req.headers.authorization || '').slice(7), JWT_SECRET);
      list = list.filter((r) => r.authorId === u.id);
    } catch { list = []; }
  }
  res.json(list.map(present));
});

app.get('/api/recipes/:id', (req, res) => {
  const r = read(RECIPES_FILE).find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Recipe not found.' });
  res.json(present(r));
});

app.post('/api/recipes', auth, (req, res) => {
  const { title, description, image, category, difficulty, time, ingredients, steps } = req.body || {};
  const ing = Array.isArray(ingredients) ? ingredients : String(ingredients || '').split('\n');
  const stp = Array.isArray(steps) ? steps : String(steps || '').split('\n');
  const clean = (a) => a.map((x) => x.trim()).filter(Boolean);
  if (!title || !category || !time || !clean(ing).length || !clean(stp).length)
    return res.status(400).json({ error: 'Title, category, cooking time, ingredients and instructions are required.' });
  const recipes = read(RECIPES_FILE);
  const recipe = {
    id: Date.now(), title: title.trim(), description: (description || '').trim() || 'A recipe shared by the community.',
    image: image || '', category, difficulty: difficulty || 'Easy', time: Number(time),
    ingredients: clean(ing), steps: clean(stp), authorId: req.user.id, authorName: req.user.name, ratings: []
  };
  recipes.unshift(recipe);
  write(RECIPES_FILE, recipes);
  res.status(201).json(present(recipe));
});

app.post('/api/recipes/:id/rate', auth, (req, res) => {
  const value = Number(req.body.value);
  if (!(value >= 1 && value <= 5)) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  const recipes = read(RECIPES_FILE);
  const r = recipes.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Recipe not found.' });
  const existing = r.ratings.find((x) => x.userId === req.user.id);
  if (existing) existing.value = value; else r.ratings.push({ userId: req.user.id, value });
  write(RECIPES_FILE, recipes);
  res.json(present(r));
});

app.delete('/api/recipes/:id', auth, (req, res) => {
  const recipes = read(RECIPES_FILE);
  const r = recipes.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Recipe not found.' });
  if (r.authorId !== req.user.id) return res.status(403).json({ error: 'You can only delete your own recipes.' });
  write(RECIPES_FILE, recipes.filter((x) => x.id !== r.id));
  res.json({ message: 'Recipe deleted.' });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found.' }));
app.listen(PORT, () => console.log(`RecipeHub running at http://localhost:${PORT}`));
