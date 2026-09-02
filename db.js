const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

function readDB() {
    if (!fs.existsSync(dbPath)) {
        return { recipes: [], users: [] };
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    getAllRecipes: () => {
        return new Promise((resolve) => {
            const data = readDB();
            resolve(data.recipes.sort((a, b) => b.created_at - a.created_at));
        });
    },
    addRecipe: (recipeData) => {
        return new Promise((resolve) => {
            const data = readDB();
            const newId = data.recipes.length > 0 ? Math.max(...data.recipes.map(r => r.id)) + 1 : 1;
            
            const newRecipe = {
                id: newId,
                title: recipeData.title,
                description: recipeData.description,
                image_url: recipeData.image_url,
                prep_time: recipeData.prepTime,
                cook_time: recipeData.cookTime,
                servings: recipeData.servings,
                original_url: recipeData.url,
                ingredients: recipeData.ingredients || [],
                instructions: recipeData.instructions || [],
                created_at: Date.now()
            };
            
            data.recipes.push(newRecipe);
            writeDB(data);
            resolve(newId);
        });
    },
    deleteRecipe: (id) => {
        return new Promise((resolve) => {
            const data = readDB();
            data.recipes = data.recipes.filter(r => r.id !== parseInt(id));
            writeDB(data);
            resolve(true);
        });
    },
    getUsers: () => {
        return new Promise((resolve) => {
            const data = readDB();
            resolve(data.users || []);
        });
    },
    addUser: (userData) => {
        return new Promise((resolve) => {
            const data = readDB();
            if (!data.users) data.users = [];
            const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
            
            // Jaxon gets admin by default
            const role = (userData.name || '').toLowerCase() === 'jaxon' ? 'admin' : (userData.role || 'user');
            
            const newUser = {
                id: newId,
                name: userData.name,
                instagram: userData.instagram || '',
                tiktok: userData.tiktok || '',
                role: role,
                created_at: Date.now()
            };
            data.users.push(newUser);
            writeDB(data);
            resolve(newUser);
        });
    },
    createInvite: (provisionedData) => {
        return new Promise((resolve) => {
            const data = readDB();
            if (!data.invites) data.invites = [];
            const code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
            const invite = {
                code,
                provisioned_data: provisionedData,
                created_at: Date.now(),
                used: false
            };
            data.invites.push(invite);
            writeDB(data);
            resolve(invite);
        });
    },
    getInvite: (code) => {
        return new Promise((resolve) => {
            const data = readDB();
            const invite = (data.invites || []).find(i => i.code === code && !i.used);
            resolve(invite || null);
        });
    },
    markInviteUsed: (code) => {
        return new Promise((resolve) => {
            const data = readDB();
            const invite = (data.invites || []).find(i => i.code === code);
            if(invite) {
                invite.used = true;
                writeDB(data);
            }
            resolve(true);
        });
    },
    getSources: () => {
        return new Promise((resolve) => {
            const data = readDB();
            resolve(data.sources || [
                { id: 1, name: 'Pinch of Yum', url: 'https://pinchofyum.com/feed' },
                { id: 2, name: 'Smitten Kitchen', url: 'https://smittenkitchen.com/feed/' },
                { id: 3, name: 'Cookie and Kate', url: 'https://cookieandkate.com/feed/' },
                { id: 4, name: 'Minimalist Baker', url: 'https://minimalistbaker.com/feed/' },
                { id: 5, name: 'Half Baked Harvest', url: 'https://www.halfbakedharvest.com/feed/' },
                { id: 6, name: 'Damn Delicious', url: 'https://damndelicious.net/feed/' },
                { id: 7, name: 'RecipeTin Eats', url: 'https://www.recipetineats.com/feed/' },
                { id: 8, name: 'Sallys Baking Addiction', url: 'https://sallysbakingaddiction.com/feed/' }
            ]);
        });
    },
    addSource: (name, url) => {
        return new Promise((resolve) => {
            const data = readDB();
            if (!data.sources) data.sources = [
                { id: 1, name: 'Pinch of Yum', url: 'https://pinchofyum.com/feed' },
                { id: 2, name: 'Smitten Kitchen', url: 'https://smittenkitchen.com/feed/' },
                { id: 3, name: 'Cookie and Kate', url: 'https://cookieandkate.com/feed/' },
                { id: 4, name: 'Minimalist Baker', url: 'https://minimalistbaker.com/feed/' },
                { id: 5, name: 'Half Baked Harvest', url: 'https://www.halfbakedharvest.com/feed/' },
                { id: 6, name: 'Damn Delicious', url: 'https://damndelicious.net/feed/' },
                { id: 7, name: 'RecipeTin Eats', url: 'https://www.recipetineats.com/feed/' },
                { id: 8, name: 'Sallys Baking Addiction', url: 'https://sallysbakingaddiction.com/feed/' }
            ];
            const newSource = { id: Date.now(), name, url };
            data.sources.push(newSource);
            writeDB(data);
            resolve(newSource);
        });
    },
    deleteSource: (id) => {
        return new Promise((resolve) => {
            const data = readDB();
            if (!data.sources) return resolve(true);
            data.sources = data.sources.filter(s => s.id !== parseInt(id));
            writeDB(data);
            resolve(true);
        });
    },
    getMealPlans: (userId) => {
        return new Promise((resolve) => {
            const data = readDB();
            resolve((data.meal_plans || []).filter(p => p.user_id === parseInt(userId)));
        });
    },
    addMealPlan: (userId, recipeId, dateStr, mealType) => {
        return new Promise((resolve) => {
            const data = readDB();
            if (!data.meal_plans) data.meal_plans = [];
            const newPlan = { id: Date.now(), user_id: parseInt(userId), recipe_id: parseInt(recipeId), date: dateStr, meal_type: mealType };
            data.meal_plans.push(newPlan);
            writeDB(data);
            resolve(newPlan);
        });
    },
    deleteMealPlan: (planId) => {
        return new Promise((resolve) => {
            const data = readDB();
            if (!data.meal_plans) return resolve(true);
            data.meal_plans = data.meal_plans.filter(p => p.id !== parseInt(planId));
            writeDB(data);
            resolve(true);
        });
    },

    getTunnelToken: () => {
        return new Promise((resolve) => {
            const data = readDB();
            resolve(data.tunnelToken || '');
        });
    },
    saveTunnelToken: (token) => {
        return new Promise((resolve) => {
            const data = readDB();
            data.tunnelToken = token;
            writeDB(data);
            resolve(true);
        });
    }
};
