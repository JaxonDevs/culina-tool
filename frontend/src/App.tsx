import React, { useState, useEffect } from 'react';
import { Search, Plus, ChefHat, Clock, Users, ArrowLeft, Moon, Sun, Trash2, Import, UserPlus, LogIn, LogOut, ShieldCheck, CheckCircle, Calendar, Wand2, Info } from 'lucide-react';

export default function App() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [tab, setTab] = useState<'my-recipes' | 'discover' | 'single' | 'admin' | 'planner'>('my-recipes');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState('');
  const [activeRecipe, setActiveRecipe] = useState<any>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showAuth, setShowAuth] = useState(false);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserIg, setNewUserIg] = useState('');
  const [newUserTt, setNewUserTt] = useState('');
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  
  // Admin state
  const [generatedLink, setGeneratedLink] = useState('');
  const [provName, setProvName] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const [discoverRecipes, setDiscoverRecipes] = useState<any[]>([]);
  const [discoverFilter, setDiscoverFilter] = useState('All');
  const [sources, setSources] = useState<any[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Manual Recipe State
  const [manualRecipe, setManualRecipe] = useState({ title: '', description: '', prepTime: '', cookTime: '', servings: '', ingredients: [''], instructions: [''] });
  
  const [mealPlans, setMealPlans] = useState<any[]>([]);

  const [isSetupPending, setIsSetupPending] = useState(false);
  const [setupData, setSetupData] = useState({ adminName: '', licenseKey: '', geminiKey: '' });
  
  useEffect(() => {
    checkSetup();
    loadUsers();
    loadRecipes();
    loadDiscover();
    loadSources();
    checkInviteUrl();
  }, []);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      setIsSetupPending(data.needsSetup);
    } catch(e) {}
  };

  useEffect(() => {
    if (currentUser) {
      loadMealPlans();
    } else {
      setMealPlans([]);
    }
  }, [currentUser]);

  const loadMealPlans = async () => {
    if(!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/meals`);
      setMealPlans(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadDiscover = async () => {
    try {
      const res = await fetch('/api/discover');
      const data = await res.json();
      setDiscoverRecipes(data);
    } catch(e) { console.error(e); }
  };

  const loadSources = async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      setSources(data);
    } catch(e) { console.error(e); }
  };



  const handleDeleteSource = async (id: number) => {
    if (!confirm('Delete this source?')) return;
    try {
      await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      loadSources();
    } catch(e) { console.error(e); }
  };

  const checkInviteUrl = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      try {
        const res = await fetch(`/api/invites/${code}`);
        if(res.ok) {
          const invite = await res.json();
          setInviteCode(code);
          if (invite.provisioned_data?.name) setNewUserName(invite.provisioned_data.name);
          setShowAuth(true);
        } else {
          alert('Invalid or expired invite link!');
        }
      } catch(e) {
        console.error(e);
      }
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRecipes = async () => {
    try {
      const res = await fetch('/api/recipes', { cache: 'no-store' });
      const data = await res.json();
      setRecipes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newUserName) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, instagram: newUserIg, tiktok: newUserTt, inviteCode })
      });
      const data = await res.json();
      setUsers([...users, data]);
      setCurrentUser(data);
      setNewUserName(''); setNewUserIg(''); setNewUserTt('');
      setInviteCode(null);
      setShowAuth(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch(e) {
      console.error(e);
    }
  };

  const [licenses, setLicenses] = useState<any[]>([]);
  const [tunnelToken, setTunnelToken] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('users');

  const loadAdminData = async () => {
    if (currentUser?.role !== 'admin') return;
    try {
      const res = await fetch('/api/admin/licenses');
      setLicenses(await res.json());
      const res2 = await fetch('/api/admin/tunnel');
      const data2 = await res2.json();
      setTunnelToken(data2.token);
    } catch(e) {}
  };

  useEffect(() => {
    if (tab === 'admin') loadAdminData();
  }, [tab]);

  const generateInvite = async () => {
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provisionedData: { name: provName } })
      });
      const data = await res.json();
      const link = `${window.location.origin}/?invite=${data.code}`;
      setGeneratedLink(link);
      setProvName('');
    } catch(e) {
      console.error(e);
    }
  };

  const scrapeRecipe = async (urlToScrape?: string) => {
    if (!currentUser) { setShowAuth(true); return; }
    const targetUrl = urlToScrape || urlInput;
    if (!targetUrl) return;
    setStatus("Scraping... Please wait.");
    try {
      const res = await fetch('/api/recipes/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus("Success! Recipe imported.");
      setUrlInput('');
      loadRecipes();
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'Manual Entry',
          title: manualRecipe.title,
          description: manualRecipe.description,
          image_url: '',
          prepTime: manualRecipe.prepTime,
          cookTime: manualRecipe.cookTime,
          servings: manualRecipe.servings,
          ingredients: manualRecipe.ingredients.filter(i => i.trim()),
          instructions: manualRecipe.instructions.filter(i => i.trim())
        })
      });
      setShowManualForm(false);
      setManualRecipe({ title: '', description: '', prepTime: '', cookTime: '', servings: '', ingredients: [''], instructions: [''] });
      loadRecipes();
    } catch (e) {
      console.error(e);
    }
  };

  const [isAiLoading, setIsAiLoading] = useState(false);
  const handleAiFormat = async () => {
    if (!manualRecipe.description) { alert('Please paste the Instagram caption into the Description box first!'); return; }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/recipes/ai-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualRecipe.description })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setManualRecipe({
        ...manualRecipe,
        title: data.title || manualRecipe.title,
        description: data.description || manualRecipe.description,
        prepTime: data.prepTime || manualRecipe.prepTime,
        cookTime: data.cookTime || manualRecipe.cookTime,
        servings: data.servings || manualRecipe.servings,
        ingredients: (data.ingredients && data.ingredients.length > 0) ? data.ingredients : manualRecipe.ingredients,
        instructions: (data.instructions && data.instructions.length > 0) ? data.instructions : manualRecipe.instructions
      });
    } catch (e: any) {
      alert("AI Format failed: " + e.message);
    }
    setIsAiLoading(false);
  };

  const deleteRecipe = async (id: number) => {
    if (!currentUser) { setShowAuth(true); return; }
    if(!confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if(activeRecipe?.id === id) setTab('my-recipes');
      loadRecipes();
    } catch(e) {
      console.error('Failed to delete', e);
    }
  };

  const viewRecipe = (id: number) => {
    const r = recipes.find(x => x.id === id);
    if (r) {
      setActiveRecipe(r);
      setTab('single');
    }
  };

  const submitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setupData) });
      window.location.reload();
    } catch(e) {
      alert("Setup failed.");
    }
  };

  // --- Setup Wizard Screen ---
  if (isSetupPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md w-full">
          <div className="flex justify-center mb-6 text-orange-600 dark:text-orange-500"><ChefHat size={48}/></div>
          <h1 className="text-2xl font-black text-center mb-2 text-gray-900 dark:text-gray-100">Welcome to Culina Tool</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">Let's get your new recipe manager set up.</p>
          
          <form onSubmit={submitSetup} className="space-y-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Admin Username 
                <span title="The master username you will use to log into the admin dashboard." className="cursor-help"><Info size={14}/></span>
              </label>
              <input required value={setupData.adminName} onChange={e => setSetupData({...setupData, adminName: e.target.value})} type="text" placeholder="e.g. jaxon" className="w-full p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                License Key
                <span title="Your premium license key starting with ML-. Leave blank to use the free edition." className="cursor-help"><Info size={14}/></span>
              </label>
              <input value={setupData.licenseKey} onChange={e => setSetupData({...setupData, licenseKey: e.target.value})} type="text" placeholder="Leave blank for Free Edition" className="w-full p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Gemini API Key (Optional)
                <span title="Your Google Gemini API key to enable the Magic AI Recipe Importer feature." className="cursor-help"><Info size={14}/></span>
              </label>
              <input value={setupData.geminiKey} onChange={e => setSetupData({...setupData, geminiKey: e.target.value})} type="password" placeholder="For the AI Importer" className="w-full p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-orange-500" />
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-md">Complete Setup</button>
          </form>
        </div>
      </div>
    );
  }

  // --- Auth / Profile Screen ---
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
        <button onClick={() => setShowAuth(false)} className="absolute top-6 left-6 text-gray-500 dark:text-gray-400 font-bold hover:text-orange-600 dark:hover:text-orange-500 transition-colors flex items-center gap-2">
          <ArrowLeft size={16}/> Continue as Guest
        </button>
        
        <div className="flex flex-col items-center gap-2 text-orange-600 dark:text-orange-500 font-black text-4xl mb-12">
          <ChefHat size={48} className="mb-2" /> Culina Tool
          {inviteCode && <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 mt-2 border border-green-200"><CheckCircle size={14}/> Valid Invite Link Activated</div>}
        </div>
        
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 opacity-80">
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2"><LogIn className="text-orange-500"/> Existing Profile</h2>
            {users.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No profiles found.</p>
            ) : (
              <div className="space-y-3">
                {users.map(u => (
                  <button key={u.id} onClick={() => { setCurrentUser(u); setShowAuth(false); }} className="w-full bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-xl flex items-center justify-between transition-colors text-left">
                    <div>
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-lg block flex items-center gap-2">
                        {u.name}
                        {u.role === 'admin' && <ShieldCheck size={16} className="text-blue-500" />}
                      </span>
                    </div>
                    <ArrowLeft size={18} className="text-gray-400 rotate-180 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-orange-50 dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-orange-200 dark:border-gray-700">
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><UserPlus className="text-orange-500"/> Create Profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Setup your TikTok/Instagram handles for future bot imports.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} type="text" placeholder="Chef Ramsay" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white dark:bg-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Instagram Handle (Optional)</label>
                <div className="flex">
                  <span className="bg-gray-200 dark:bg-gray-700 px-4 flex items-center rounded-l-xl text-gray-500 font-bold">@</span>
                  <input value={newUserIg} onChange={e => setNewUserIg(e.target.value)} type="text" placeholder="gordonramsay" className="w-full p-3 border-y border-r border-gray-200 dark:border-gray-600 rounded-r-xl focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">TikTok Handle (Optional)</label>
                <div className="flex">
                  <span className="bg-gray-200 dark:bg-gray-700 px-4 flex items-center rounded-l-xl text-gray-500 font-bold">@</span>
                  <input value={newUserTt} onChange={e => setNewUserTt(e.target.value)} type="text" placeholder="gordonramsayofficial" className="w-full p-3 border-y border-r border-gray-200 dark:border-gray-600 rounded-r-xl focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl font-black shadow-md transition-colors mt-6">
                Register & Enter
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-2 text-orange-600 dark:text-orange-500 font-black text-2xl tracking-tight cursor-pointer" onClick={() => setTab('my-recipes')}>
          <ChefHat size={32} /> Culina Tool
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => setTab('my-recipes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${tab === 'my-recipes' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <ChefHat size={20}/> Collection
          </button>
          <button onClick={() => setTab('discover')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${tab === 'discover' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <Search size={20}/> Discover
          </button>
          {currentUser && (
            <button onClick={() => setTab('planner')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${tab === 'planner' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
              <Calendar size={20}/> Meal Planner
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button onClick={() => setTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${tab === 'admin' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
              <ShieldCheck size={20}/> Admin
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Theme</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
          {currentUser ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Logged in as</div>
              <div className="font-bold text-gray-800 dark:text-gray-200 mb-3 line-clamp-1">{currentUser.name}</div>
              <button onClick={() => setCurrentUser(null)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-sm transition">
                <LogOut size={16}/> Log Out
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition-colors">
              <LogIn size={18}/> Login
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-black text-xl tracking-tight">
            <ChefHat size={24} /> Culina Tool
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto p-4 gap-2 bg-gray-50 dark:bg-gray-900 sticky top-[65px] z-10 shadow-sm">
          <button onClick={() => setTab('my-recipes')} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap text-sm ${tab === 'my-recipes' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>Collection</button>
          <button onClick={() => setTab('discover')} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap text-sm ${tab === 'discover' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>Discover</button>
          {currentUser && <button onClick={() => setTab('planner')} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap text-sm ${tab === 'planner' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>Planner</button>}
          {currentUser?.role === 'admin' && <button onClick={() => setTab('admin')} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap text-sm ${tab === 'admin' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>Admin</button>}
          {!currentUser ? (
            <button onClick={() => setShowAuth(true)} className="px-4 py-2 rounded-full font-bold whitespace-nowrap text-sm bg-orange-100 text-orange-600 ml-auto">Login</button>
          ) : (
            <button onClick={() => setCurrentUser(null)} className="px-4 py-2 rounded-full font-bold whitespace-nowrap text-sm bg-red-100 text-red-600 ml-auto">Logout</button>
          )}
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">

        {/* --- Meal Planner Tab --- */}
        {tab === 'planner' && currentUser && (
          <div className="animate-in fade-in">
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Meal Planner</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Plan your meals for the week. Drag and drop recipes into your calendar.</p>
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const dayMeals = mealPlans.filter(m => m.date === day);
                  return (
                    <div key={day} className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 text-center font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">{day}</div>
                      <div className="p-3 flex-1 flex flex-col gap-2 min-h-[120px]">
                        {dayMeals.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center italic">No meals</div>
                        ) : (
                          dayMeals.map(meal => {
                            const recipe = recipes.find(r => r.id === meal.recipe_id);
                            if(!recipe) return null;
                            return (
                              <div key={meal.id} className="relative group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 rounded-xl shadow-sm">
                                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2">{recipe.title}</div>
                                <button onClick={async () => {
                                  await fetch(`/api/meals/${meal.id}`, { method: 'DELETE' });
                                  loadMealPlans();
                                }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Recipes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recipes.map(r => (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm flex flex-col">
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 flex-1">{r.title}</div>
                  <div className="relative">
                    <select onChange={async (e) => {
                      if (!e.target.value) return;
                      await fetch(`/api/users/${currentUser.id}/meals`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recipeId: r.id, date: e.target.value, mealType: 'Dinner' })
                      });
                      e.target.value = '';
                      loadMealPlans();
                    }} className="w-full text-xs font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/30 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="">+ Add to day</option>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Admin Tab --- */}
        {tab === 'admin' && currentUser?.role === 'admin' && (
          <div className="animate-in fade-in max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-6">Admin Dashboard</h2>
            
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button onClick={() => setAdminSubTab('users')} className={`pb-2 font-bold ${adminSubTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Users & Invites</button>
              <button onClick={() => setAdminSubTab('licenses')} className={`pb-2 font-bold ${adminSubTab === 'licenses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>License Keys</button>
              <button onClick={() => setAdminSubTab('tunnel')} className={`pb-2 font-bold ${adminSubTab === 'tunnel' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Network Tunnel</button>
            </div>

            {adminSubTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Users & Invites</h3>
                  <button onClick={generateInvite} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                    <UserPlus size={16}/> Create Invite Link
                  </button>
                </div>
                
                {generatedLink && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl mb-6 border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                    <div className="font-mono text-sm break-all">{generatedLink}</div>
                    <button onClick={() => {navigator.clipboard.writeText(generatedLink); alert("Copied!")}} className="ml-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold shrink-0">Copy</button>
                  </div>
                )}

                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div>
                        <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          {u.name} {u.role === 'admin' && <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full uppercase tracking-wide">Admin</span>}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {u.instagram && `IG: @${u.instagram}`} {u.tiktok && `TT: @${u.tiktok}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSubTab === 'licenses' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">License Generator</h3>
                  <button onClick={async () => {
                    await fetch('/api/admin/licenses', { method: 'POST' });
                    loadAdminData();
                  }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                    + Generate New Key
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">You act as the master license server. Generate keys here and give them to your customers to activate their copies.</p>
                
                <div className="space-y-3">
                  {licenses.map(l => (
                    <div key={l.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="font-mono font-bold text-purple-600 dark:text-purple-400">{l.key}</div>
                      <div className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">{l.tier.toUpperCase()}</div>
                    </div>
                  ))}
                  {licenses.length === 0 && <div className="text-center text-gray-500 text-sm">No licenses generated yet.</div>}
                </div>
              </div>
            )}

            {adminSubTab === 'tunnel' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Cloudflare Zero Trust Tunnel</h3>
                <p className="text-sm text-gray-500 mb-6">Expose your local Raspberry Pi to the public internet securely without opening router ports. Paste your Cloudflare Tunnel Token below.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tunnel Token</label>
                    <input value={tunnelToken} onChange={e => setTunnelToken(e.target.value)} type="password" placeholder="eyJhIjoi..." className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" />
                  </div>
                  
                  <div className="flex gap-4">
                    <button onClick={async () => {
                      await fetch('/api/admin/tunnel', { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ token: tunnelToken }) });
                      alert("Token saved!");
                    }} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                      Save Token
                    </button>
                    <button onClick={async () => {
                      await fetch('/api/admin/tunnel', { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ start: true }) });
                      alert("Tunnel Starting! Check backend logs.");
                    }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                      Start Tunnel
                    </button>
                    <button onClick={async () => {
                      await fetch('/api/admin/tunnel', { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ start: false }) });
                    }} className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-xl font-bold text-sm transition-colors ml-auto">
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* --- RSS Sources Manager --- */}
            {adminSubTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Discover Feed Sources (RSS)</h3>
                <div className="space-y-3 mb-6">
                  {sources.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div>
                        <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{s.name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-xs">{s.url}</div>
                      </div>
                      <button onClick={() => handleDeleteSource(s.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input id="sourceName" type="text" placeholder="Site Name" className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-orange-500 dark:text-white text-sm" />
                  <input id="sourceUrl" type="url" placeholder="RSS Feed URL" className="flex-2 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-orange-500 dark:text-white text-sm" />
                  <button onClick={async () => {
                    const n = (document.getElementById('sourceName') as HTMLInputElement).value;
                    const u = (document.getElementById('sourceUrl') as HTMLInputElement).value;
                    if(n&&u) {
                      await fetch('/api/sources', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:n, url:u})});
                      (document.getElementById('sourceName') as HTMLInputElement).value = '';
                      (document.getElementById('sourceUrl') as HTMLInputElement).value = '';
                      loadSources();
                    }
                  }} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors">Add Source</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Recipes Tab --- */}
        {tab === 'my-recipes' && (
          <div className="animate-in fade-in">
            {/* Import Box - ONLY FOR LOGGED IN USERS */}
            {currentUser ? (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1 text-gray-800 dark:text-gray-100">Add New Recipe</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Import a URL or write your own recipe from scratch.</p>
                  </div>
                  <button onClick={() => setShowManualForm(!showManualForm)} className="text-orange-600 dark:text-orange-500 font-bold hover:underline flex items-center gap-1">
                    {showManualForm ? 'Import from URL' : <><Plus size={18}/> Create Manually</>}
                  </button>
                </div>
                
                {!showManualForm ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input value={urlInput} onChange={e => setUrlInput(e.target.value)} type="url" placeholder="https://..." className="flex-1 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors" />
                      <button onClick={() => scrapeRecipe()} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm flex justify-center items-center gap-2 transition-colors"><Import size={18}/> Extract</button>
                    </div>
                    {status && <p className="mt-4 text-sm font-bold text-orange-500">{status}</p>}
                  </>
                ) : (
                  <form onSubmit={handleManualSubmit} className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-2">
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <strong className="block mb-1">Instagram & TikTok Importer</strong>
                        Paste the video's caption or messy text into the Description box below, then click Magic Format.
                      </div>
                      <button type="button" onClick={handleAiFormat} disabled={isAiLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 whitespace-nowrap transition-colors">
                        <Wand2 size={16}/> {isAiLoading ? 'Formatting...' : 'Magic Format'}
                      </button>
                    </div>

                    <textarea required value={manualRecipe.description} onChange={e => setManualRecipe({...manualRecipe, description: e.target.value})} placeholder="Paste Instagram Caption here, or write a short description..." className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" rows={3} />
                    <input required value={manualRecipe.title} onChange={e => setManualRecipe({...manualRecipe, title: e.target.value})} type="text" placeholder="Recipe Title" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" />

                    <div className="flex gap-4">
                      <input value={manualRecipe.prepTime} onChange={e => setManualRecipe({...manualRecipe, prepTime: e.target.value})} type="text" placeholder="Prep Time (e.g. 15m)" className="w-1/3 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" />
                      <input value={manualRecipe.cookTime} onChange={e => setManualRecipe({...manualRecipe, cookTime: e.target.value})} type="text" placeholder="Cook Time (e.g. 45m)" className="w-1/3 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" />
                      <input value={manualRecipe.servings} onChange={e => setManualRecipe({...manualRecipe, servings: e.target.value})} type="text" placeholder="Servings (e.g. 4)" className="w-1/3 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Ingredients</h4>
                      {manualRecipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input value={ing} onChange={e => { const newIngs = [...manualRecipe.ingredients]; newIngs[idx] = e.target.value; setManualRecipe({...manualRecipe, ingredients: newIngs}); }} type="text" placeholder="1 cup flour..." className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" />
                          <button type="button" onClick={() => setManualRecipe({...manualRecipe, ingredients: manualRecipe.ingredients.filter((_, i) => i !== idx)})} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setManualRecipe({...manualRecipe, ingredients: [...manualRecipe.ingredients, '']})} className="text-sm font-bold text-orange-600 dark:text-orange-500 hover:underline">+ Add Ingredient</button>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Instructions</h4>
                      {manualRecipe.instructions.map((inst, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <textarea value={inst} onChange={e => { const newInsts = [...manualRecipe.instructions]; newInsts[idx] = e.target.value; setManualRecipe({...manualRecipe, instructions: newInsts}); }} placeholder={`Step ${idx+1}`} className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white" rows={2} />
                          <button type="button" onClick={() => setManualRecipe({...manualRecipe, instructions: manualRecipe.instructions.filter((_, i) => i !== idx)})} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setManualRecipe({...manualRecipe, instructions: [...manualRecipe.instructions, '']})} className="text-sm font-bold text-orange-600 dark:text-orange-500 hover:underline">+ Add Step</button>
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl font-bold shadow-sm transition-colors mt-4">Save Recipe</button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 dark:bg-gray-800/80 p-6 rounded-2xl border border-orange-100 dark:border-gray-700 mb-10 text-center flex flex-col items-center justify-center">
                <p className="text-gray-700 dark:text-gray-300 font-bold mb-3">Want to add your own recipes to the collection?</p>
                <button onClick={() => setShowAuth(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full font-bold shadow-sm transition-colors flex items-center gap-2">
                  <LogIn size={16}/> Login to Import
                </button>
              </div>
            )}

            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-6">Recipe Collection</h2>
            {recipes.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                <ChefHat size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">The collection is empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recipes.map(r => (
                  <div key={r.id} onClick={() => viewRecipe(r.id)} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all cursor-pointer">
                    <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-900">
                      {typeof r.image_url === 'string' && r.image_url.length > 5 ? (
                        <img src={r.image_url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(r.image_url)}` : r.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600"><ChefHat size={48}/></div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">{r.description || 'No description provided.'}</p>
                      
                      <div className="mt-auto flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                        <div className="flex gap-2">
                          <span className="bg-gray-100 dark:bg-gray-900 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><Clock size={12}/> {r.prep_time || '--'}</span>
                          <span className="bg-gray-100 dark:bg-gray-900 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><Users size={12}/> {r.servings || '--'}</span>
                        </div>
                        {currentUser && (
                          <button onClick={(e) => { e.stopPropagation(); deleteRecipe(r.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- Discover Tab --- */}
        {tab === 'discover' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Explore Recipes</h2>
                <p className="text-gray-500 dark:text-gray-400">Popular community picks. Import them to your collection instantly.</p>
              </div>
              <select value={discoverFilter} onChange={e => setDiscoverFilter(e.target.value)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none">
                <option value="All">All Categories</option>
                {Array.from(new Set(discoverRecipes.flatMap(r => r.categories || []))).sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {discoverRecipes.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500">Loading discover feed... (This may take a moment to fetch the RSS feeds)</div>
              ) : discoverRecipes.filter(r => discoverFilter === 'All' || (r.categories || []).includes(discoverFilter)).map(r => (
                <div key={r.url} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-900">
                    {r.image ? (
                      <img src={`/api/proxy-image?url=${encodeURIComponent(r.image)}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700"><ChefHat size={40}/></div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur text-gray-800 dark:text-gray-100 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">{r.source}</div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-2">{r.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{new Date(r.date).toLocaleDateString()}</p>
                    
                    {currentUser ? (
                      <button onClick={() => { setTab('my-recipes'); scrapeRecipe(r.url); }} className="mt-auto w-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2">
                        <Import size={16}/> Extract Recipe
                      </button>
                    ) : (
                      <button onClick={() => setShowAuth(true)} className="mt-auto w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                        <LogIn size={16}/> Login to Extract
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Single Recipe --- */}
        {tab === 'single' && activeRecipe && (
          <div className="animate-in fade-in slide-in-from-bottom-8">
            <button onClick={() => setTab('my-recipes')} className="text-gray-500 dark:text-gray-400 font-bold mb-6 hover:text-orange-600 dark:hover:text-orange-500 transition-colors flex items-center gap-2"><ArrowLeft size={16}/> Back to Collection</button>
            
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-10 mb-12">
                {typeof activeRecipe.image_url === 'string' && activeRecipe.image_url.length > 5 && (
                  <img src={activeRecipe.image_url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(activeRecipe.image_url)}` : activeRecipe.image_url} className="w-full md:w-5/12 rounded-2xl object-cover shadow-md h-64 md:h-80" />
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 leading-tight">{activeRecipe.title}</h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">{activeRecipe.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-xl flex items-center gap-2"><Clock className="text-orange-500" size={18}/> Prep: {activeRecipe.prep_time || '--'}</div>
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-xl flex items-center gap-2"><Clock className="text-orange-500" size={18}/> Cook: {activeRecipe.cook_time || '--'}</div>
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-xl flex items-center gap-2"><Users className="text-orange-500" size={18}/> Yield: {activeRecipe.servings || '--'}</div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                    <a href={activeRecipe.original_url} target="_blank" className="text-orange-600 dark:text-orange-500 font-bold hover:underline">🔗 Source Website</a>
                    {currentUser && (
                      <button onClick={() => deleteRecipe(activeRecipe.id)} className="text-red-500 hover:underline font-bold ml-auto flex items-center gap-1"><Trash2 size={16}/> Delete</button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2"><span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-2 rounded-lg">🛒</span> Ingredients</h3>
                  <ul className="space-y-3">
                    {(activeRecipe.ingredients || []).map((i: string, idx: number) => (
                      <li key={idx} className="flex gap-3 text-gray-700 dark:text-gray-300 pb-3 border-b border-gray-100 dark:border-gray-700/50"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div> <span className="leading-relaxed">{i}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2"><span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-2 rounded-lg">👨‍🍳</span> Instructions</h3>
                  <div className="space-y-6">
                    {(activeRecipe.instructions || []).map((step: string, idx: number) => (
                      <div key={idx} className="flex gap-5 bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl">
                        <div className="w-8 h-8 shrink-0 bg-orange-500 text-white rounded-full flex items-center justify-center font-black">{idx+1}</div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
