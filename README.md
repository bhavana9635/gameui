# 🎮 AI Game Generator - Complete Setup Guide

Transform game design documents from Google Sheets into playable web games using Google AI Studio!

## 📋 Architecture Overview

```
┌─────────────────┐
│   n8n Workflow  │ ──► Generates game designs ──► Google Sheets
└─────────────────┘

┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Google Sheets  │ ───► │  Backend Server  │ ───► │ Google AI Studio │
│  (Game Designs) │      │  (Express + API) │      │  (Game Creator)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  React Frontend  │
                         │  (Game Browser)  │
                         └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Google Cloud Project with Sheets API enabled
- Google AI Studio API key
- n8n workflow running (from previous setup)

### Step 1: Clone and Install

```bash
# Navigate to the project
cd game-generator-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Backend

1. **Get Google Service Account Credentials:**

```bash
# Go to: https://console.cloud.google.com/
# 1. Create a new project or select existing
# 2. Enable Google Sheets API
# 3. Create Service Account
# 4. Download JSON key file
```

2. **Get Google AI Studio API Key:**

```bash
# Go to: https://makersuite.google.com/app/apikey
# Click "Create API Key"
# Copy the key
```

3. **Create `.env` file in backend folder:**

```bash
cd backend
cp .env.example .env
nano .env
```

4. **Fill in your credentials:**

```env
PORT=5000
NODE_ENV=development

# Your Google Sheet ID (from the URL)
GOOGLE_SHEET_ID=1k_2gMzV3-zg-2nc5CPiqh35NZR6IYHuW32bEJbzz4R0

# Paste your entire service account JSON (one line)
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}

# Your Google AI API key
GOOGLE_AI_API_KEY=AIza...your-key-here
```

5. **Share Google Sheet with Service Account:**

```bash
# Get the email from your service account JSON:
# "client_email": "name@project.iam.gserviceaccount.com"

# Share your Google Sheet with this email (Editor access)
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start

# You should see:
# 🚀 Server running on port 5000
# 📊 Google Sheets ID: 1k_2gM...
# 🤖 Google AI configured: true
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start

# Browser will open at http://localhost:3000
```

## 📂 Project Structure

```
game-generator-app/
├── backend/
│   ├── server.js           # Express server + API endpoints
│   ├── package.json        # Backend dependencies
│   ├── .env               # Configuration (create this)
│   └── .env.example       # Example configuration
│
└── frontend/
    ├── public/
    │   └── index.html     # HTML template
    ├── src/
    │   ├── components/
    │   │   ├── GameList.js         # Browse games from Sheets
    │   │   ├── GameViewer.js       # View game design details
    │   │   └── GameGenerator.js    # Generate playable game
    │   ├── styles/
    │   │   ├── App.css
    │   │   ├── GameList.css
    │   │   ├── GameViewer.css
    │   │   └── GameGenerator.css
    │   ├── App.js          # Main React component
    │   └── index.js        # React entry point
    └── package.json        # Frontend dependencies
```

## 🔧 API Endpoints

### Backend API

**GET /api/games**
- Fetches all game designs from Google Sheets
- Returns: Array of game objects

**GET /api/games/:pipelineId**
- Fetches specific game by pipeline_id
- Returns: Single game object

**POST /api/generate-game**
- Generates playable game using Google AI
- Body: `{ gameDesign, pipelineId }`
- Returns: `{ success, gameUrl, gameHtml }`

**POST /api/save-game**
- Saves generated game HTML
- Body: `{ pipelineId, gameHtml }`
- Returns: `{ success, url }`

**GET /play/:pipelineId**
- Serves the generated game
- Returns: HTML game page

## 🎮 Usage Flow

1. **Generate Game Design** (n8n workflow)
   - Send request to n8n webhook
   - Game design saved to Google Sheets

2. **Browse Games** (React Frontend)
   - Open http://localhost:3000
   - View list of game designs from Sheets
   - Click on any game to view details

3. **View Game Details**
   - See factions, units, progression
   - Review balancing and mechanics
   - Click "Generate Playable Game"

4. **Generate & Play**
   - AI creates HTML5 game (30-60 seconds)
   - Game opens in iframe
   - Fully playable in browser!

## 🔍 How It Works

### 1. Data Flow

```
n8n Workflow → Google Sheets → Backend API → React UI
                                     ↓
                            Google AI Studio
                                     ↓
                            Generated HTML Game
```

### 2. Game Generation Process

```javascript
// Backend receives game design JSON
const gameDesign = {
  game_design_spec: { factions, economy, core_loop },
  balancing: { units, tuning },
  progression: { tech_tree }
};

// Sends to Google AI with detailed prompt
const prompt = `Create a playable game based on:
- Factions: ${factions}
- Resources: ${resources}
- Win conditions: ${conditions}
...`;

// AI generates complete HTML game
const gameHtml = await genAI.generateContent(prompt);

// Game served via iframe
<iframe src="/play/game-id" />
```

### 3. Google Sheets Integration

```javascript
// Uses Google Sheets API v4
const sheets = google.sheets({ version: 'v4', auth });

// Reads from your sheet
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Projects!A:J'
});

// Parses full_data column (JSON)
const gameData = JSON.parse(row.full_data);
```

## 🐛 Troubleshooting

### Backend won't start

**Problem:** `Error: Unable to read credentials`
**Solution:**
```bash
# Make sure GOOGLE_CREDENTIALS is valid JSON (one line)
# Use an online JSON validator
# Ensure no extra spaces or line breaks
```

**Problem:** `Error: Failed to fetch games`
**Solution:**
```bash
# Check service account has access to sheet
# Verify GOOGLE_SHEET_ID is correct
# Share sheet with service account email
```

### Frontend shows "Failed to load games"

**Problem:** CORS or connection error
**Solution:**
```bash
# Make sure backend is running on port 5000
# Check browser console for errors
# Verify proxy in frontend/package.json
```

### Game generation fails

**Problem:** `Failed to generate game`
**Solution:**
```bash
# Verify GOOGLE_AI_API_KEY is valid
# Check AI Studio quota limits
# Review backend logs for error details
```

### Generated game won't load

**Problem:** Iframe shows blank page
**Solution:**
```bash
# Check browser console for sandbox errors
# Verify gameHtml is valid HTML
# Try different browser (Chrome recommended)
```

## 🔐 Security Notes

1. **Never commit `.env` file**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Protect API keys**
   - Keep Google AI key secret
   - Rotate keys periodically
   - Use environment variables only

3. **Validate user input**
   - Backend validates all requests
   - Sanitize HTML before rendering
   - Use iframe sandbox attributes

## 🚀 Production Deployment

### Deploy Backend (Example: Heroku)

```bash
cd backend

# Create Heroku app
heroku create your-game-generator-api

# Set environment variables
heroku config:set GOOGLE_SHEET_ID=your-sheet-id
heroku config:set GOOGLE_CREDENTIALS='{"type":"service_account",...}'
heroku config:set GOOGLE_AI_API_KEY=your-api-key

# Deploy
git push heroku main
```

### Deploy Frontend (Example: Vercel)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
# REACT_APP_API_URL=https://your-backend.herokuapp.com
```

### Update Frontend API URL

```javascript
// In frontend/src/App.js and components
// Change from:
const response = await fetch('http://localhost:5000/api/games');

// To:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await fetch(`${API_URL}/api/games`);
```

## 📊 Example Request/Response

### Generate Game Request

```bash
curl -X POST http://localhost:5000/api/generate-game \
  -H 'Content-Type: application/json' \
  -d '{
    "pipelineId": "1769866680988-cyber-clash",
    "gameDesign": {
      "game_design_spec": {...},
      "balancing": {...},
      "progression": {...}
    }
  }'
```

### Response

```json
{
  "success": true,
  "gameUrl": "/play/1769866680988-cyber-clash",
  "gameHtml": "<!DOCTYPE html><html>...",
  "pipelineId": "1769866680988-cyber-clash"
}
```

## 🎯 Features

✅ Browse game designs from Google Sheets  
✅ View detailed game specifications  
✅ AI-generated playable HTML5 games  
✅ Real-time game generation (30-60s)  
✅ Responsive design (mobile-friendly)  
✅ Clean, modern UI with animations  
✅ Error handling and loading states  
✅ Game preview in iframe  

## 🔄 Complete Workflow

1. User creates game concept
2. n8n workflow generates design → Google Sheets
3. User opens React app
4. Frontend fetches games from Sheets via backend
5. User selects game and clicks "Generate"
6. Backend sends design to Google AI Studio
7. AI creates playable HTML game
8. Game loads in iframe
9. User plays the game!

## 📝 License

MIT License - feel free to modify and use!

## 🤝 Support

Having issues? Check:
1. Backend logs: `cd backend && npm start`
2. Frontend console: Browser DevTools
3. Network tab: Check API calls
4. Google Cloud Console: Verify quotas

## 🎉 Next Steps

- Add user authentication
- Save generated games to database
- Add game editing features
- Export games as standalone HTML files
- Add multiplayer support
- Create game gallery/marketplace

---

**Enjoy creating games with AI! 🎮🤖**
"# Game_Development" 
