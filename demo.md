# How to Run the Real-Time Chat Application

## 🚀 **Step-by-Step Instructions:**

### 1. **Open Terminal/Command Prompt**
- Press `Win + R`, type `cmd` and press Enter
- Or open PowerShell

### 2. **Navigate to Project Directory**
```bash
cd "C:\Users\Lenovo\OneDrive\Documents\Task 004"
```

### 3. **Install Dependencies** (if not already done)
```bash
npm install
```

### 4. **Start the Server**
```bash
npm start
```

### 5. **Access the Application**
- Open your web browser
- Go to: `http://localhost:3000`
- You'll see the login/register screen

## 📋 **What You'll See:**

### Terminal Output:
```
<code_block_to_apply_changes_from>
```

### Browser:
- Login/Register modal
- Modern chat interface
- Real-time messaging

## 🎉 **Quick Start:**

1. **Open terminal** in the project folder
2. **Run**: `npm start`
3. **Open browser** to `http://localhost:3000`
4. **Register** a new account
5. **Start chatting!**

## 🔧 **Troubleshooting:**

### If port 3000 is busy:
```bash
# Kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### If dependencies are missing:
```bash
npm install
```

### If server won't start:
- Check if Node.js is installed: `node --version`
- Check if npm is installed: `npm --version`

## 🎉 **Features Available:**

- ✅ Real-time messaging
- ✅ User authentication
- ✅ Chat rooms
- ✅ File sharing
- ✅ User presence indicators
- ✅ Notifications
- ✅ Chat history
- ✅ Typing indicators

The application is **ready to run** and all features are implemented! 🚀
