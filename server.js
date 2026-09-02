require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const scrapeRecipe = require('./scraper');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// API Routes
app.get('/api/recipes', async (req, res) => {
    try {
        const recipes = await db.getAllRecipes();
        res.json(recipes);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/recipes/scrape', async (req, res) => {
    try {
        const { url } = req.body;
        const scrapedData = await scrapeRecipe(url);
        const newRecipeId = await db.addRecipe(scrapedData);
        res.json({ success: true, id: newRecipeId, data: scrapedData });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/recipes/:id', async (req, res) => {
    try {
        await db.deleteRecipe(req.params.id);
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(users);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const newUser = await db.addUser(req.body);
        if (req.body.inviteCode) {
            await db.markInviteUsed(req.body.inviteCode);
        }
        res.json(newUser);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Invites
app.post('/api/invites', async (req, res) => {
    try {
        const invite = await db.createInvite(req.body.provisionedData || {});
        res.json(invite);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/invites/:code', async (req, res) => {
    try {
        const invite = await db.getInvite(req.params.code);
        if (!invite) return res.status(404).json({ error: 'Invite not found or already used' });
        res.json(invite);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Sources & Discover
const Parser = require('rss-parser');
const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media'],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

app.get('/api/sources', async (req, res) => {
    res.json(await db.getSources());
});

app.post('/api/sources', async (req, res) => {
    res.json(await db.addSource(req.body.name, req.body.url));
});

app.delete('/api/sources/:id', async (req, res) => {
    await db.deleteSource(req.params.id);
    res.json({ success: true });
});

app.post('/api/recipes', async (req, res) => {
    try {
        const newId = await db.addRecipe(req.body);
        res.json({ success: true, id: newId });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

let needsSetup = !process.env.LICENSE_KEY;

app.get('/api/setup/status', (req, res) => {
    res.json({ needsSetup });
});

const fs = require('fs');

app.post('/api/setup', async (req, res) => {
    const { licenseKey, geminiKey, adminName } = req.body;
    try {
        const finalLicense = licenseKey || 'free';
        
        // --- SECURE LICENSE VALIDATION ---
        // This runs securely on the Node backend where the customer cannot modify it.
        if (finalLicense !== 'free') {
            // Placeholder: Hook this up to your Gumroad/Stripe/LemonSqueezy server later!
            // const verifyRes = await axios.post('https://your-license-server.com/verify', { key: finalLicense });
            // if (!verifyRes.data.valid) throw new Error("Invalid License Key!");
            
            // For now, we will just accept anything that isn't 'free' as Premium.
            console.log("Verifying Premium License: ", finalLicense);
        }

        let envContent = `LICENSE_KEY=${finalLicense}\n`;
        if (geminiKey) envContent += `GEMINI_API_KEY=${geminiKey}\n`;
        fs.writeFileSync(path.join(__dirname, '.env'), envContent);
        
        // Reload env
        require('dotenv').config();
        
        // Ensure admin user exists
        const users = await db.getUsers();
        if (!users.find(u => u.role === 'admin')) {
            await db.addUser({ name: adminName || 'Admin', role: 'admin', auth_id: adminName || 'Admin' });
        }
        
        needsSetup = false;
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/recipes/ai-format', async (req, res) => {
    try {
        const prompt = `Extract the recipe details from the following text (which is an Instagram caption or messy recipe text). 
Return ONLY a valid JSON object with no markdown formatting or code blocks. The JSON must have these exact keys:
"title" (string)
"description" (string)
"prepTime" (string, e.g. "15m")
"cookTime" (string)
"servings" (string)
"ingredients" (array of strings)
"instructions" (array of strings)

Text to process:
${req.body.text}`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set in the environment. Please add it in the Setup Wizard or .env file.");
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
        });
        
        const jsonText = response.data.candidates[0].content.parts[0].text;
        const recipeData = JSON.parse(jsonText);
        res.json(recipeData);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
        res.status(500).json({ error: 'Failed to process AI recipe' });
    }
});

app.get('/api/users/:userId/meals', async (req, res) => {
    res.json(await db.getMealPlans(req.params.userId));
});

app.post('/api/users/:userId/meals', async (req, res) => {
    res.json(await db.addMealPlan(req.params.userId, req.body.recipeId, req.body.date, req.body.mealType));
});

app.delete('/api/meals/:planId', async (req, res) => {
    await db.deleteMealPlan(req.params.planId);
    res.json({ success: true });
});

let discoverCache = { time: 0, items: [] };

app.get('/api/discover', async (req, res) => {
    if (Date.now() - discoverCache.time < 1000 * 60 * 60) {
        return res.json(discoverCache.items); // 1 hour cache
    }
    try {
        const sources = await db.getSources();
        let allItems = [];
        for (const source of sources) {
            try {
                const feed = await parser.parseURL(source.url);
                feed.items.slice(0, 15).forEach(item => {
                    let img = null;
                    const imgRegex = /<img[^>]+src=["']([^"'>]+)["']/i;
                    
                    if (item.media && item.media.$ && item.media.$.url) img = item.media.$.url;
                    else if (item['content:encoded'] && item['content:encoded'].match(imgRegex)) img = item['content:encoded'].match(imgRegex)[1];
                    else if (item.content && item.content.match(imgRegex)) img = item.content.match(imgRegex)[1];
                    else if (item.description && item.description.match(imgRegex)) img = item.description.match(imgRegex)[1];
                    else if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) img = item.enclosure.url;
                    
                    let categories = item.categories || [];
                    if (typeof categories === 'string') categories = [categories];
                    
                    if (img && (img.includes('gravatar') || img.includes('icon') || img.includes('1x1'))) img = null;
                    
                    if (img) {
                        allItems.push({
                            title: item.title,
                            url: item.link,
                            source: source.name,
                            image: img,
                            categories: categories,
                            date: new Date(item.pubDate || item.isoDate).getTime() || Date.now()
                        });
                    }
                });
            } catch (e) {
                console.error('Failed to parse feed', source.url, e.message);
            }
        }
        
        // Sort by date descending
        allItems.sort((a, b) => b.date - a.date);
        
        discoverCache = { time: Date.now(), items: allItems };
        res.json(allItems);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

const axios = require('axios');
app.get('/api/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('No URL provided');
        
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': imageUrl
            }
        });
        
        response.data.pipe(res);
    } catch(e) {
        res.status(500).send('Failed to proxy image');
    }
});

// Start Server
const PORT = process.env.PORT || 4000; // using 4000 to avoid conflicts

// License Check Middleware (Optional for now)
app.use((req, res, next) => {
    // If we want to restrict API features to valid license key in the future
    next();
});

// Serve frontend in production
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
    console.log(`Admin User: Jaxon (Default Invite: ADMIN-SETUP)`);
});
