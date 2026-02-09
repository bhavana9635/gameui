// backend/server.js - WITH PERSISTENT STORAGE
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// STORAGE CONFIGURATION
const STORAGE_DIR = path.join(__dirname, 'generated-games');
const STORAGE_INDEX = path.join(STORAGE_DIR, 'games-index.json');

// Create storage directory if it doesn't exist
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  console.log('✅ Created storage directory:', STORAGE_DIR);
}

// Load existing games index
let gamesIndex = {};
if (fs.existsSync(STORAGE_INDEX)) {
  try {
    gamesIndex = JSON.parse(fs.readFileSync(STORAGE_INDEX, 'utf8'));
    console.log(`✅ Loaded ${Object.keys(gamesIndex).length} cached games`);
  } catch (err) {
    console.warn('⚠️  Could not load games index:', err.message);
    gamesIndex = {};
  }
}

// Save games index
function saveGamesIndex() {
  try {
    fs.writeFileSync(STORAGE_INDEX, JSON.stringify(gamesIndex, null, 2));
  } catch (err) {
    console.error('❌ Failed to save games index:', err.message);
  }
}

// Save game to disk
function saveGameToDisk(pipelineId, gameHtml, metadata = {}) {
  const gameFile = path.join(STORAGE_DIR, `${pipelineId}.html`);
  
  try {
    fs.writeFileSync(gameFile, gameHtml, 'utf8');
    
    gamesIndex[pipelineId] = {
      filepath: gameFile,
      size: gameHtml.length,
      createdAt: metadata.createdAt || new Date().toISOString(),
      modelUsed: metadata.modelUsed || 'unknown',
      projectName: metadata.projectName || 'Unknown Game',
      lastAccessed: new Date().toISOString()
    };
    
    saveGamesIndex();
    
    console.log(`💾 Saved game to disk: ${pipelineId} (${(gameHtml.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.error('❌ Failed to save game:', err.message);
    return false;
  }
}

// Load game from disk
function loadGameFromDisk(pipelineId) {
  const gameInfo = gamesIndex[pipelineId];
  
  if (!gameInfo) {
    return null;
  }
  
  try {
    if (fs.existsSync(gameInfo.filepath)) {
      const gameHtml = fs.readFileSync(gameInfo.filepath, 'utf8');
      
      // Update last accessed time
      gamesIndex[pipelineId].lastAccessed = new Date().toISOString();
      saveGamesIndex();
      
      console.log(`📂 Loaded cached game: ${pipelineId}`);
      return gameHtml;
    } else {
      console.warn(`⚠️  Game file not found: ${gameInfo.filepath}`);
      delete gamesIndex[pipelineId];
      saveGamesIndex();
      return null;
    }
  } catch (err) {
    console.error('❌ Failed to load game:', err.message);
    return null;
  }
}

// List all cached games
function listCachedGames() {
  return Object.keys(gamesIndex).map(pipelineId => ({
    pipelineId,
    ...gamesIndex[pipelineId]
  }));
}

// Delete game from cache
function deleteGameFromCache(pipelineId) {
  const gameInfo = gamesIndex[pipelineId];
  
  if (!gameInfo) {
    return false;
  }
  
  try {
    if (fs.existsSync(gameInfo.filepath)) {
      fs.unlinkSync(gameInfo.filepath);
    }
    delete gamesIndex[pipelineId];
    saveGamesIndex();
    console.log(`🗑️  Deleted cached game: ${pipelineId}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to delete game:', err.message);
    return false;
  }
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Game Generator - WITH PERSISTENT STORAGE',
    version: '5.0.0',
    storage: {
      directory: STORAGE_DIR,
      cachedGames: Object.keys(gamesIndex).length,
      totalSize: Object.values(gamesIndex).reduce((sum, g) => sum + g.size, 0)
    }
  });
});

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Projects';

let genAI = null;

try {
  if (process.env.GOOGLE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    console.log('✅ Google AI initialized');
  }
} catch (err) {
  console.warn('⚠️  Google AI init failed:', err.message);
}

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

// API: List cached games
app.get('/api/cached-games', (req, res) => {
  const cached = listCachedGames();
  res.json({
    total: cached.length,
    games: cached.map(g => ({
      pipelineId: g.pipelineId,
      projectName: g.projectName,
      size: g.size,
      sizeKB: (g.size / 1024).toFixed(1),
      createdAt: g.createdAt,
      lastAccessed: g.lastAccessed,
      modelUsed: g.modelUsed
    }))
  });
});

// API: Delete cached game
app.delete('/api/cached-games/:pipelineId', (req, res) => {
  const { pipelineId } = req.params;
  const deleted = deleteGameFromCache(pipelineId);
  
  if (deleted) {
    res.json({ success: true, message: 'Game deleted from cache' });
  } else {
    res.status(404).json({ error: 'Game not found in cache' });
  }
});

// API: Clear all cache
app.delete('/api/cached-games', (req, res) => {
  try {
    let deleted = 0;
    for (const pipelineId in gamesIndex) {
      if (deleteGameFromCache(pipelineId)) {
        deleted++;
      }
    }
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/models', (req, res) => {
  res.json({ 
    currentModel: 'gemini-2.5-pro',
    fallbacks: ['gemini-2.5-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest']
  });
});

app.get('/api/games', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return res.json([]);

    const headers = rows[0];
    const games = rows.slice(1).map(row => {
      const game = {};
      headers.forEach((h, i) => {
        if (h === 'full_data') {
          try { game[h] = JSON.parse(row[i] || '{}'); }
          catch { game[h] = {}; }
        } else {
          game[h] = row[i] || '';
        }
      });
      
      // Add cache status
      game.isCached = !!gamesIndex[game.pipeline_id];
      
      return game;
    });

    res.json(games);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:pipelineId', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    const headers = rows[0];
    const gameRow = rows.find(row => row[0] === req.params.pipelineId);

    if (!gameRow) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = {};
    headers.forEach((h, i) => {
      if (h === 'full_data') {
        try { game[h] = JSON.parse(gameRow[i] || '{}'); }
        catch { game[h] = {}; }
      } else {
        game[h] = gameRow[i] || '';
      }
    });
    
    // Add cache status
    game.isCached = !!gamesIndex[game.pipeline_id];

    res.json(game);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

function extractHTML(rawText) {
  let cleaned = rawText.replace(/```html\s*/gi, '').replace(/```\s*/g, '');
  
  const doctypePattern = /<!DOCTYPE\s+html>/i;
  const doctypeMatch = cleaned.match(doctypePattern);
  
  if (doctypeMatch) {
    const doctypeIndex = cleaned.indexOf(doctypeMatch[0]);
    cleaned = cleaned.substring(doctypeIndex);
  } else {
    const htmlStartPattern = /<html[^>]*>/i;
    const htmlMatch = cleaned.match(htmlStartPattern);
    
    if (htmlMatch) {
      const htmlIndex = cleaned.indexOf(htmlMatch[0]);
      cleaned = cleaned.substring(htmlIndex);
      cleaned = '<!DOCTYPE html>\n' + cleaned;
    }
  }
  
  const htmlEndIndex = cleaned.toLowerCase().lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    cleaned = cleaned.substring(0, htmlEndIndex + 7);
  }
  
  if (!/<html/i.test(cleaned) || !/<\/html>/i.test(cleaned)) {
    throw new Error('Invalid HTML structure');
  }
  
  return cleaned.trim();
}

// GAME GENERATION WITH CACHING
app.post('/api/generate-game', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({ error: 'Google AI not configured' });
    }
    
    const { gameDesign, pipelineId, forceRegenerate } = req.body;
    if (!gameDesign) {
      return res.status(400).json({ error: 'Game design required' });
    }

    // CHECK CACHE FIRST (unless force regenerate)
    if (!forceRegenerate) {
      const cachedGame = loadGameFromDisk(pipelineId);
      if (cachedGame) {
        console.log(`✅ Returning cached game: ${pipelineId}`);
        return res.json({
          success: true,
          cached: true,
          modelUsed: gamesIndex[pipelineId].modelUsed,
          gameHtml: cachedGame,
          gameUrl: `/play/${pipelineId}`,
          pipelineId,
          quality: 'CACHED',
          stats: {
            htmlLength: cachedGame.length,
            cachedAt: gamesIndex[pipelineId].createdAt
          }
        });
      }
    }

    console.log('🎮 Generating NEW game:', pipelineId);

    // Try models in order
    const modelsToTry = [
      'gemini-2.5-pro',
      'gemini-2.5-flash', 
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-pro'
    ];

    let model = null;
    let modelUsed = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔍 Trying ${modelName}...`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        const testResult = await model.generateContent('test');
        await testResult.response;
        
        modelUsed = modelName;
        console.log(`✅ Using ${modelName}`);
        break;
      } catch (err) {
        console.log(`❌ ${modelName} not available`);
        continue;
      }
    }

    if (!model || !modelUsed) {
      throw new Error('No working model found');
    }

    const gdd = gameDesign.game_design_spec || {};
    const balancing = gameDesign.balancing || {};

    const prompt = `Create a STUNNING, PROFESSIONAL, FULL-SCREEN strategy game in a single HTML file.

Game: ${gameDesign.metadata?.project_name || 'Strategy Game'}
Genre: ${gameDesign.inputs?.genre || 'RTS'}
Factions: ${gdd.factions?.map(f => f.name).join(', ') || 'Standard'}
Resources: ${gdd.economy?.resources?.map(r => r.name).join(', ') || 'Gold, Energy'}
Units: ${balancing.units?.slice(0,6).map(u => u.unit_name).join(', ') || 'Infantry, Tank'}

REQUIREMENTS:
- Full-screen layout (100vw × 100vh, no scrollbars)
- Professional dark theme with gradients
- Top bar (60px): Resources + Timer
- Main area (70%): Canvas/Grid gameplay
- Right panel (30%): Build menu
- Bottom bar (80px): Actions
- Smooth animations and effects
- Working resource system
- Buildable units with stats
- Combat system
- Win/loss detection
- Sound effects (Web Audio)
- Mobile responsive

Return ONLY valid HTML (no markdown, no explanations). Start with <!DOCTYPE html> and end with </html>.`;

    console.log('📤 Generating...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    let gameHtml = extractHTML(rawText);

    console.log('✅ Generated with', modelUsed);
    console.log('📏 Size:', (gameHtml.length / 1024).toFixed(1), 'KB');

    // SAVE TO DISK
    saveGameToDisk(pipelineId, gameHtml, {
      modelUsed,
      projectName: gameDesign.metadata?.project_name,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      cached: false,
      modelUsed: modelUsed,
      gameHtml,
      gameUrl: `/play/${pipelineId}`,
      pipelineId,
      quality: 'MAXIMUM',
      stats: {
        htmlLength: gameHtml.length,
        hasFactions: gdd.factions?.length || 0,
        hasUnits: balancing.units?.length || 0
      }
    });

  } catch (err) {
    console.error('❌ Error:', err);
    
    res.status(500).json({ 
      error: 'Failed to generate game',
      message: err.message
    });
  }
});

app.post('/api/save-game', (req, res) => {
  try {
    const { pipelineId, gameHtml } = req.body;
    
    if (!pipelineId || !gameHtml) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Save to disk
    saveGameToDisk(pipelineId, gameHtml);
    
    res.json({ 
      success: true, 
      url: `/play/${pipelineId}`,
      size: gameHtml.length,
      saved: 'disk'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/play/:pipelineId', (req, res) => {
  // Try to load from disk first
  const gameHtml = loadGameFromDisk(req.params.pipelineId);
  
  if (!gameHtml) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Not Found</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🎮 Game Not Found</h1>
          <p>This game hasn't been generated yet.</p>
          <p><a href="http://localhost:3000">← Back to Games</a></p>
        </body>
      </html>
    `);
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.send(gameHtml);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: '5.0.0',
    storage: {
      directory: STORAGE_DIR,
      cachedGames: Object.keys(gamesIndex).length,
      totalSizeMB: (Object.values(gamesIndex).reduce((sum, g) => sum + g.size, 0) / 1024 / 1024).toFixed(2)
    }
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🎮 ================================================');
  console.log('🎮  AI Game Generator - WITH PERSISTENT STORAGE');
  console.log('🎮 ================================================');
  console.log(`🌐  Server: http://localhost:${PORT}`);
  console.log(`💾  Storage: ${STORAGE_DIR}`);
  console.log(`📦  Cached Games: ${Object.keys(gamesIndex).length}`);
  console.log(`🤖  Model: Gemini 2.5 Pro + fallbacks`);
  console.log('🎮 ================================================');
  console.log('');
  console.log('✅  Server ready!');
  console.log('');
});

module.exports = app;