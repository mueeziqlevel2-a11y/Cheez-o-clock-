import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './src/server/db';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cheez_oclock_secret_key_2026_rawalpindi';

app.use(express.json());

// Array to track SSE clients for real-time updates
const sseClients: Response[] = [];

function notifySseClients(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

// Authentication Middleware for Protected Admin Routes
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    (req as any).adminUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

// Authentication Middleware for Protected Customer Routes
function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Please log in first' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    if (decoded.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Forbidden: Invalid customer token' });
    }
    (req as any).customerUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

// ------------------- PUBLIC ROUTES -------------------

// Get public menu
app.get('/api/menu', async (req: Request, res: Response) => {
  try {
    const menu = await db.getMenu();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Get public special deals
app.get('/api/special-deals', async (req: Request, res: Response) => {
  try {
    const deals = await db.getSpecialDeals();
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch special deals' });
  }
});

// Get public special deals
app.get('/api/special-deals', async (req: Request, res: Response) => {
  try {
    const deals = await db.getSpecialDeals();
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch special deals' });
  }
});

// Get store settings (delivery fee, open status)
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Customer: Place Order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { customerId, customerEmail, customerName, phone, address, mapLocation, notes, items } = req.body;

    if (!customerName || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please fill all required customer details and add at least 1 item.' });
    }

    const order = await db.createOrder({
      customerId,
      customerEmail,
      customerName,
      phone,
      address,
      mapLocation,
      notes,
      items
    });

    // Notify connected admin portals & tracking pages in real-time
    notifySseClients('NEW_ORDER', order);

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'We couldn\'t place your order. Please try again.' });
  }
});

// Customer: Signup (Fast Phone + Password)
app.post('/api/customer/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Mobile Phone Number and Password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanPhone.replace(/\D/g, '')}@cheezoclock.pk`;
    const customerName = name ? name.trim() : `Customer (${cleanPhone.slice(-4)})`;

    // Check if phone or email exists
    const existingPhone = await db.findCustomerByPhone(cleanPhone);
    if (existingPhone) {
      return res.status(400).json({ error: 'An account with this phone number already exists. Please log in.' });
    }

    if (email) {
      const existingEmail = await db.findCustomerByEmail(cleanEmail);
      if (existingEmail) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await db.createCustomer({
      name: customerName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      address: address ? address.trim() : ''
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Customer registration failed. Please try again.' });
  }
});

// Customer: Login (Supports Phone or Email + Password)
app.post('/api/customer/login', async (req: Request, res: Response) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginId = identifier || phone || email;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Phone number/Email and password are required.' });
    }

    const storedUser = await db.findCustomerByEmailOrPhone(loginId);
    if (!storedUser) {
      return res.status(401).json({ error: 'Account not found with this phone/email. Please sign up first.' });
    }

    const isMatch = bcrypt.compareSync(password, storedUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const { passwordHash, ...safeUser } = storedUser;

    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Customer: Google Auth Sign-In / Sign-Up
app.post('/api/customer/google-auth', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google email is required.' });
    }

    const user = await db.findOrCreateGoogleCustomer({
      name: name || 'Google Customer',
      email: email.trim().toLowerCase()
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// Customer: Forgot Password (Reset Password)
app.post('/api/customer/reset-password', async (req: Request, res: Response) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({ error: 'Mobile phone or email and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const customer = await db.findCustomerByEmailOrPhone(identifier);
    if (!customer) {
      return res.status(404).json({ error: 'No account found with this Phone Number or Email address.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const updated = await db.updateCustomerPassword(identifier, passwordHash);

    if (!updated) {
      return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }

    res.json({ success: true, message: 'Your password has been reset successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
});

// Customer: Get Current Profile & Wishlist
app.get('/api/customer/me', requireCustomerAuth, async (req: Request, res: Response) => {
  try {
    const customerToken = (req as any).customerUser;
    const storedUser = await db.findCustomerById(customerToken.id);
    if (!storedUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { passwordHash, ...safeUser } = storedUser;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Customer: Update Saved Wishlist IDs
app.put('/api/customer/wishlist', requireCustomerAuth, async (req: Request, res: Response) => {
  try {
    const customerToken = (req as any).customerUser;
    const { wishlistIds } = req.body;

    if (!Array.isArray(wishlistIds)) {
      return res.status(400).json({ error: 'wishlistIds must be an array of item IDs' });
    }

    const updatedUser = await db.updateCustomerWishlist(customerToken.id, wishlistIds);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true, wishlistIds: updatedUser.wishlistIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

// Customer: Get Order History for logged-in user
app.get('/api/customer/orders', requireCustomerAuth, async (req: Request, res: Response) => {
  try {
    const customerToken = (req as any).customerUser;
    const storedUser = await db.findCustomerById(customerToken.id);

    if (!storedUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const orders = await db.getCustomerOrders(storedUser.email, storedUser.phone);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// Customer: Track Order by ID or Phone
app.get('/api/orders/track/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ error: 'Order number or phone number is required' });
    }

    const order = await db.getOrderById(query);
    if (!order) {
      return res.status(404).json({ error: 'Order not found. Please check your order number.' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving order' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const authInfo = await db.getAdminAuthInfo();
    
    // Check email
    if (email.trim().toLowerCase() !== authInfo.email.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Check password hash
    const isMatch = bcrypt.compareSync(password, authInfo.hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { email: authInfo.email, role: 'HOST_ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: { email: authInfo.email, role: 'HOST_ADMIN' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login authentication error' });
  }
});

// SSE Event Stream for Live Sync
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// ------------------- PROTECTED ADMIN ROUTES -------------------

// Admin: Verify Token
app.get('/api/admin/verify', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ valid: true, admin: (req as any).adminUser });
});

// Admin: Get All Orders with optional search / filter
app.get('/api/orders', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: Update Order Status
app.put('/api/orders/:orderId/status', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedOrder = await db.updateOrderStatus(orderId, status);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Notify all real-time tracking clients & admin dashboards
    notifySseClients('ORDER_UPDATED', updatedOrder);

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin: Delete Single Order
app.delete('/api/orders/:orderId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const deleted = await db.deleteOrder(orderId);
    if (!deleted) {
      return res.status(404).json({ error: 'Order not found' });
    }

    notifySseClients('ORDER_UPDATED', { id: orderId, action: 'DELETED' });
    res.json({ success: true, message: `Order #${orderId} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Admin: Delete All Orders (Clear Monthly History / Reset from 0)
app.delete('/api/orders', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const count = await db.deleteAllOrders();
    notifySseClients('ORDER_UPDATED', { action: 'ALL_DELETED' });
    res.json({ success: true, count, message: `All ${count} orders deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all orders' });
  }
});

// Admin: Add Menu Item
app.post('/api/menu', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, category, price, image, isAvailable, isFeatured } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const newItem = await db.addMenuItem({
      name,
      description: description || '',
      category,
      price: Number(price),
      image: image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
      isAvailable: isAvailable !== false,
      isFeatured: !!isFeatured
    });

    notifySseClients('MENU_UPDATED', newItem);

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Admin: Update Menu Item
app.put('/api/menu/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const updatedItem = await db.updateMenuItem(id, update);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    notifySseClients('MENU_UPDATED', updatedItem);

    res.json({ success: true, item: updatedItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Admin: Delete Menu Item
app.delete('/api/menu/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.deleteMenuItem(id);
    if (!success) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    notifySseClients('MENU_DELETED', { id });

    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Admin: Delete All Menu Items / Test Projects
app.delete('/api/menu', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const count = await db.deleteAllMenuItems();
    notifySseClients('MENU_DELETED', { action: 'ALL_DELETED' });
    res.json({ success: true, count, message: `All ${count} menu items/projects deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu items' });
  }
});

// Admin: Delete Customer Accounts
app.delete('/api/customers/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.deleteCustomer(id);
    if (!success) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

app.delete('/api/customers', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await db.clearCustomers();
    res.json({ success: true, message: 'All customer accounts cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear customer accounts' });
  }
});

// Admin: Update Store Settings (e.g. Delivery Fee)
app.put('/api/settings', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const updatedSettings = await db.updateSettings(req.body);
    notifySseClients('SETTINGS_UPDATED', updatedSettings);
    res.json({ success: true, settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin: Add or Update Special Deal
app.post('/api/special-deals', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, price, originalPrice, image, includedProductIds, includedItemsSummary, startDate, endDate, isActive } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Deal name and price are required' });
    }

    const savedDeal = await db.saveSpecialDeal({
      name,
      description: description || '',
      price: Number(price),
      originalPrice: originalPrice !== undefined ? Number(originalPrice) : undefined,
      image: image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
      includedProductIds: Array.isArray(includedProductIds) ? includedProductIds : [],
      includedItemsSummary: includedItemsSummary || '',
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: isActive !== false
    });

    notifySseClients('SPECIAL_DEAL_UPDATED', savedDeal);
    res.status(201).json({ success: true, deal: savedDeal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save special deal' });
  }
});

// Admin: Update Special Deal by ID
app.put('/api/special-deals/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const savedDeal = await db.saveSpecialDeal({
      ...update,
      id
    });

    notifySseClients('SPECIAL_DEAL_UPDATED', savedDeal);
    res.json({ success: true, deal: savedDeal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update special deal' });
  }
});

// Admin: Delete Special Deal
app.delete('/api/special-deals/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.deleteSpecialDeal(id);
    if (!success) {
      return res.status(404).json({ error: 'Special deal not found' });
    }

    notifySseClients('SPECIAL_DEAL_DELETED', { id });
    res.json({ success: true, message: 'Special deal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete special deal' });
  }
});

// ------------------- VITE / STATIC SERVING -------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cheez O'Clock Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
