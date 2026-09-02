const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function downloadImage(imageUrl) {
    if (!imageUrl) return '';
    try {
        // Handle URLs with query params properly by just stripping them for the extension
        const cleanUrl = imageUrl.split('?')[0];
        let ext = path.extname(cleanUrl);
        if (!ext || ext.length > 5) ext = '.jpg';
        
        const filename = crypto.randomBytes(16).toString('hex') + ext;
        const filepath = path.join(__dirname, 'public', 'images', filename);
        
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': cleanUrl
            }
        });
        
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve('/images/' + filename));
            writer.on('error', reject);
        });
    } catch (e) {
        console.error('Failed to download image:', e.message);
        return imageUrl; // fallback to original
    }
}

async function scrapeRecipe(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        const $ = cheerio.load(data);
        
        let recipeData = null;

        // Find the application/ld+json script tag that contains Recipe
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                const items = Array.isArray(json) ? json : (json['@graph'] || [json]);
                for (const item of items) {
                    if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
                        recipeData = item;
                        break;
                    }
                }
            } catch (e) {}
        });

        if (!recipeData) throw new Error('No Recipe schema found on this page.');

        let instructions = [];
        if (recipeData.recipeInstructions) {
            if (Array.isArray(recipeData.recipeInstructions)) {
                recipeData.recipeInstructions.forEach(step => {
                    if (step.text) instructions.push(step.text);
                    else if (typeof step === 'string') instructions.push(step);
                });
            } else if (typeof recipeData.recipeInstructions === 'string') {
                instructions = recipeData.recipeInstructions.split('\n').filter(s => s.trim());
            }
        }

        let imageUrl = '';
        if (recipeData.image) {
            if (typeof recipeData.image === 'string') {
                imageUrl = recipeData.image;
            } else if (Array.isArray(recipeData.image)) {
                const firstImg = recipeData.image[0];
                imageUrl = typeof firstImg === 'string' ? firstImg : (firstImg?.url || '');
            } else if (recipeData.image.url) {
                imageUrl = recipeData.image.url;
            }
        }
        
        // Fallback to og:image if JSON-LD image is missing
        if (!imageUrl) {
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) {
                imageUrl = ogImage;
            } else {
                // Fallback to first large image
                const firstImg = $('img').not('.avatar, .icon, .logo').first().attr('src');
                if (firstImg && firstImg.startsWith('http')) imageUrl = firstImg;
            }
        }

        const localImagePath = await downloadImage(imageUrl);

        return {
            url: url,
            title: recipeData.name || 'Unknown Recipe',
            description: recipeData.description || '',
            image_url: localImagePath,
            prepTime: recipeData.prepTime || '',
            cookTime: recipeData.cookTime || '',
            servings: recipeData.recipeYield ? String(recipeData.recipeYield) : '',
            ingredients: recipeData.recipeIngredient || [],
            instructions: instructions
        };

    } catch (e) {
        throw new Error('Failed to scrape recipe: ' + e.message);
    }
}

module.exports = scrapeRecipe;
