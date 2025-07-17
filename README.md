# Real-Time Chat Application

A modern, feature-rich real-time chat application built with Node.js, Express, Socket.io, and vanilla JavaScript. Users can create accounts, join chat rooms, send messages in real-time, share files, and see user presence indicators.

## Features

### Core Features
- ✅ **User Authentication**: Register and login with secure password hashing
- ✅ **Real-Time Messaging**: Instant message delivery using WebSocket technology
- ✅ **Chat Rooms**: Join public rooms or create private conversations
- ✅ **User Presence**: See who's online/offline in real-time
- ✅ **Typing Indicators**: Know when someone is typing
- ✅ **Message History**: View previous messages in chat rooms
- ✅ **File Sharing**: Upload and share images, documents, and media files
- ✅ **Notifications**: Desktop notifications for new messages
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices

### Optional Features (All Implemented)
- ✅ **Chat History**: Messages are stored and displayed
- ✅ **Notifications**: Real-time notifications for new messages
- ✅ **User Presence Indicators**: Visual indicators showing online/offline status
- ✅ **Multimedia File Sharing**: Support for images, documents, audio, and video files

## Technology Stack

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **File Upload**: Multer
- **Real-time Communication**: Socket.io

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation Steps

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The application will automatically serve the frontend files

## Usage Guide

### Getting Started

1. **Register a new account**
   - Click the "Register" tab
   - Enter your username, email, and password
   - Click "Register"

2. **Login to your account**
   - Enter your username and password
   - Click "Login"

3. **Start chatting**
   - You'll automatically join the "General" room
   - Type messages in the input field and press Enter or click Send
   - Switch between rooms using the sidebar

### Features Usage

#### Creating Chat Rooms
- Click the "+" button next to "Chat Rooms" in the sidebar
- Enter a room name and select room type (public/private)
- Click "Create Room"

#### File Sharing
- Click the paperclip icon in the chat area
- Select a file to upload (supports images, documents, audio, video)
- The file will be shared in the current room

#### User Management
- View all online users in the sidebar
- Green dots indicate online users
- Red dots indicate offline users

#### Notifications
- Desktop notifications appear for new messages
- Typing indicators show when someone is typing
- Join/leave notifications for room activity

## Project Structure

```
realtime-chat-app/
├── server.js              # Main server file with Express and Socket.io
├── package.json           # Dependencies and scripts
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── app.js           # Frontend JavaScript
├── uploads/              # File upload directory (created automatically)
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Chat
- `GET /api/users` - Get all users
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room
- `GET /api/messages/:roomId` - Get room messages
- `POST /api/upload` - Upload file

### WebSocket Events
- `authenticate` - Authenticate socket connection
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing` - Typing indicator
- `read_messages` - Mark messages as read

## Security Features

- **Password Hashing**: Passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **File Type Validation**: Only allowed file types can be uploaded
- **CORS Protection**: Cross-origin resource sharing protection

## File Upload Support

The application supports uploading various file types:
- **Images**: JPEG, JPG, PNG, GIF
- **Documents**: PDF, DOC, DOCX, TXT
- **Media**: MP3, MP4
- **File Size Limit**: 10MB per file

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon to automatically restart the server when files change.

### Customization

#### Changing the Port
Edit the `PORT` variable in `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

#### Modifying File Upload Limits
Edit the multer configuration in `server.js`:
```javascript
limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
```

#### Adding New File Types
Modify the fileFilter in `server.js`:
```javascript
const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4/;
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `server.js` or kill the process using the port

2. **File uploads not working**
   - Ensure the `uploads` directory exists and has write permissions

3. **Socket connection issues**
   - Check that the server is running and accessible
   - Verify CORS settings if accessing from a different domain

4. **Authentication errors**
   - Clear browser localStorage and try logging in again
   - Check that the JWT secret is properly set

### Logs
Check the console output for detailed error messages and connection logs.

## Future Enhancements

Potential features for future versions:
- Database integration (MongoDB, PostgreSQL)
- Message encryption
- Voice and video calls
- Message reactions and emojis
- User profiles and avatars
- Message search functionality
- Push notifications
- Mobile app versions

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

---

**Enjoy chatting!** 🚀 # Task-004
