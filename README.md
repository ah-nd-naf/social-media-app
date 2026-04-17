# 🌐 Social Media App

A full-stack, real-time social media application built with the **MERN** stack (MongoDB, Express, React, Node.js) and **Socket.IO** for real-time interactions.

## 🚀 Live Demo

- **Frontend:** [https://social-media-app-amber-eight-47.vercel.app](https://social-media-app-amber-eight-47.vercel.app)
- **Backend API:** [https://social-media-app-6wbl.onrender.com](https://social-media-app-6wbl.onrender.com)

> Note: The backend is hosted on Render's free tier, so it may take ~50 seconds to spin up if it hasn't been used recently.

---

## ✨ Features

- **🔐 User Authentication:** Secure signup and login using JWT (JSON Web Tokens) and bcrypt for password hashing.
- **📝 Post Creation:** Users can create and share text posts.
- **⚡ Real-time Updates:** Thanks to Socket.IO, new posts, likes, and comments appear instantly without refreshing the page!
- **❤️ Interactions:** Like and unlike posts, and see live like counts.
- **💬 Nested Comments:** Add comments to posts, and reply to specific comments.
- **👤 User Profiles:** View and update your profile, including your username and bio.
- **🖼️ Profile Pictures:** Upload custom profile pictures (handled via Multer).
- **📰 Recent News:** Stay updated with a live news feed fetching real-time headlines using `rss2json`.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **React.js** (Bootstrapped with Vite)
- **Tailwind CSS** (For modern, responsive styling)
- **React Router** (For client-side routing)
- **Socket.IO-Client** (For real-time WebSocket communication)

### Backend (Server)
- **Node.js & Express.js** (REST API architecture)
- **MongoDB & Mongoose** (NoSQL database and Object Data Modeling)
- **Socket.IO** (WebSockets for real-time events)
- **JWT** (Stateless authentication)
- **Multer** (File uploads)

---

## 💻 Running Locally

To run this project on your local machine, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/social-media-app.git
cd social-media-app
```

### 2. Setup the Backend
1. Install dependencies in the root directory:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory and add the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
3. Start the backend server:
   ```bash
   npm start
   ```

### 3. Setup the Frontend
1. Open a new terminal and navigate to the Vite frontend folder:
   ```bash
   cd frontend-vite
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
social-media-app/
├── frontend-vite/        # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (News, Profile, etc.)
│   │   ├── App.jsx       # Main routing logic
│   │   ├── Home.jsx      # Feed and real-time Socket.IO logic
│   │   └── ...
│   ├── vercel.json       # Vercel routing configuration
│   └── vite.config.js    # Vite configuration
├── models/               # MongoDB Mongoose schemas (User, Post)
├── routes/               # Express API routes (auth, posts, users, news)
├── middleware/           # Custom Express middlewares (e.g., JWT Auth)
├── server.js             # Main backend entry point and Socket.IO setup
└── package.json          # Backend dependencies
```

---

## ☁️ Deployment Information

- **Frontend:** Deployed on **Vercel**. 
  - *Tip for Vercel users:* The Root Directory is set to `frontend-vite`. A `vercel.json` rewrite rule is used to handle React Router's single-page application routing.
- **Backend:** Deployed on **Render** as a Web Service. 
  - CORS is configured to accept requests from localhost and all Vercel preview environments.
