const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// In-memory data storage (in production, use a database)
const users = new Map();
const rooms = new Map();
const messages = new Map();
const userSockets = new Map();

// JWT secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isOnline: false
    };

    users.set(username, user);
    
    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.get(username);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users', authenticateToken, (req, res) => {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    isOnline: user.isOnline
  }));
  res.json(userList);
});

app.get('/api/rooms', authenticateToken, (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    type: room.type,
    participants: room.participants.length
  }));
  res.json(roomList);
});

app.post('/api/rooms', authenticateToken, (req, res) => {
  const { name, type, participants } = req.body;
  const room = {
    id: uuidv4(),
    name,
    type: type || 'public',
    participants: participants || [],
    createdAt: new Date()
  };
  
  rooms.set(room.id, room);
  messages.set(room.id, []);
  
  res.json(room);
});

app.get('/api/messages/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const roomMessages = messages.get(roomId) || [];
  res.json(roomMessages);
});

// File upload endpoint
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    fileUrl, 
    filename: req.file.originalname,
    size: req.file.size 
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.get(decoded.username);
      
      if (user) {
        user.isOnline = true;
        userSockets.set(decoded.username, socket.id);
        socket.username = decoded.username;
        socket.userId = user.id;
        
        // Join user to their personal room
        socket.join(`user_${user.id}`);
        
        // Notify others that user is online
        socket.broadcast.emit('user_status_change', {
          username: decoded.username,
          isOnline: true
        });
        
        socket.emit('authenticated', { success: true });
      }
    } catch (error) {
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });

  socket.on('join_room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      socket.emit('room_joined', { roomId, room });
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined_room', {
        username: socket.username,
        roomId
      });
    }
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left_room', {
      username: socket.username,
      roomId
    });
  });

  socket.on('send_message', (data) => {
    const { roomId, content, type = 'text' } = data;
    const room = rooms.get(roomId);
    
    if (room) {
      const message = {
        id: uuidv4(),
        roomId,
        sender: socket.username,
        senderId: socket.userId,
        content,
        type,
        timestamp: new Date(),
        readBy: [socket.username]
      };
      
      // Store message
      if (!messages.has(roomId)) {
        messages.set(roomId, []);
      }
      messages.get(roomId).push(message);
      
      // Send to all users in the room
      io.to(roomId).emit('new_message', message);
      
      // Send notification to offline users
      room.participants.forEach(participant => {
        const participantSocket = userSockets.get(participant);
        if (!participantSocket) {
          // User is offline, send notification
          io.to(`user_${users.get(participant)?.id}`).emit('notification', {
            type: 'new_message',
            roomId,
            sender: socket.username,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          });
        }
      });
    }
  });

  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    socket.to(roomId).emit('user_typing', {
      username: socket.username,
      isTyping
    });
  });

  socket.on('read_messages', (data) => {
    const { roomId, messageIds } = data;
    const roomMessages = messages.get(roomId);
    
    if (roomMessages) {
      messageIds.forEach(messageId => {
        const message = roomMessages.find(m => m.id === messageId);
        if (message && !message.readBy.includes(socket.username)) {
          message.readBy.push(socket.username);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.username) {
      const user = users.get(socket.username);
      if (user) {
        user.isOnline = false;
        userSockets.delete(socket.username);
        
        // Notify others that user is offline
        socket.broadcast.emit('user_status_change', {
          username: socket.username,
          isOnline: false
        });
      }
    }
  });
});

// Create default public room
const defaultRoom = {
  id: 'general',
  name: 'General',
  type: 'public',
  participants: [],
  createdAt: new Date()
};
rooms.set('general', defaultRoom);
messages.set('general', []);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 