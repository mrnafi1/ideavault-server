# IdeaVault Server 🚀


This is the backend API for the IdeaVault platform, built with Express.js and MongoDB.

## 🛠️ Technologies Used
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT (JSON Web Tokens)
- Cors & Dotenv

## 📦 How to Run Locally
1. Clone the repository.

2. Install dependencies: `npm install`

3. Create a `.env` file and add your `DB_URI`, `ACCESS_TOKEN_SECRET`, etc.

4. Run the server: `npm run dev`


## 📡 API Endpoints

### Ideas
- `GET /ideas` - Get all ideas
- `POST /ideas` - Post a new idea
- `PATCH /ideas/:id` - Update an idea
- `DELETE /ideas/:id` - Delete an idea

### Comments
- `GET /comments/:ideaId` - Get comments for an idea
- `POST /comments` - Post a new comment