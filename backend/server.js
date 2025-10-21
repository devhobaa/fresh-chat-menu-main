require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());


// Connect to MongoDB
const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI, {
  serverSelectionTimeoutMS: 30000 // Increase timeout to 30 seconds
})
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

const db = mongoose.connection;
db.on('error', err => {
  console.error('MongoDB runtime error:', err);
});
db.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});

// Mongoose Schema and Model for Order
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: String,
  items: [{ 
    name: String, 
    quantity: Number 
  }],
  totalPrice: Number,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
});

const Order = mongoose.model('Order', orderSchema);

// Mongoose Schema and Model for Menu Item
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String }, // Add image field
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// API Routes
// Get all menu items
app.get('/api/menu-items', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new menu item
app.post('/api/menu-items', async (req, res) => {
  const { name, price, category, image } = req.body;
  const newItem = new MenuItem({ name, price, category, image });

  try {
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a menu item
app.put('/api/menu-items/:id', async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a menu item
app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk create menu items
app.post('/api/menu-items/bulk', async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Request body must be an array of menu items.' });
    }
    const savedItems = await MenuItem.insertMany(items);
    res.status(201).json(savedItems);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new order
app.post("/api/orders", async (req, res) => {
  try {
    console.log("Received new order request:", req.body);
    const order = new Order(req.body);
    await order.save();
    res.status(201).send(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(400).send(error);
  }
});

// Get a specific order by ID
app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Preparing', 'Delivered', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided.' });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } // Return the updated document
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});