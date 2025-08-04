// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // Import path module
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const grantRoutes = require('./routes/grantRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API Welcome Route
app.get('/', (req, res) => {
  res.send('GrantFlow API is running...');
});

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grants', grantRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes); // Mount upload routes

// --- Serve Uploaded Files Statically ---
// This makes the 'uploads' folder accessible via HTTP requests
// e.g., http://localhost:5000/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// Custom Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
