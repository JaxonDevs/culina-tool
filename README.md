<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/chef-hat.svg" width="100" height="100" alt="Culina Tool Logo">
  
  # Culina Tool
  
  **The ultimate, privacy-first recipe manager for your smart home.**
  
  [Website](https://culinatool.com) &middot; [Get Premium](#) &middot; [Report a Bug](#)
</div>

---

## 🌟 Overview

Culina Tool is a premium self-hosted recipe manager. Say goodbye to bloated food blogs filled with life stories, ads, and popups. Culina Tool lets you scrape, organize, plan, and shop for your meals in a beautiful, lightning-fast dashboard.

### Premium Features
- 🪄 **Magic URL Importer**: Paste a link from any cooking blog, and Culina Tool instantly extracts just the ingredients and instructions.
- 🛒 **Automated Shopping Lists**: Add an entire recipe's ingredients to your master shopping list with a single click. Check items off as you walk down the grocery aisle.
- 🔍 **Smart Pantry Search**: Type in the ingredients you have in your fridge, and the app instantly filters your collection to show you what you can cook right now.
- 🤖 **Gemini AI Integration**: Paste messy Instagram captions or TikTok comments, and our AI perfectly formats them into standard recipes.
- 📅 **Meal Planner**: Assign your favorite recipes to days of the week.
- 📱 **Mobile Ready (PWA)**: Install it directly to your iPhone or Android home screen for a native app experience.

---

## 🚀 Installation Guide

Because Culina Tool is self-hosted, you run it entirely on your own hardware (Windows, Mac, Linux, or Raspberry Pi). **Your data never leaves your home.**

### Prerequisites
1. **Node.js** (v18 or higher) - [Download Here](https://nodejs.org/)
2. **Git** - [Download Here](https://git-scm.com/)

### Step 1: Download the Software
Open your terminal or command prompt and run:
```bash
git clone https://github.com/JaxonDevs/culina-tool.git
cd culina-tool
```
*(Alternatively, you can click the green "Code" button at the top of this page and select "Download ZIP", then extract it).*

### Step 2: Run the Installer
**For Windows:**
Double click `install.bat` inside the folder, or run it in your command prompt.

**For Mac / Linux:**
```bash
chmod +x install.sh
./install.sh
```

### Step 3: The Setup Wizard
Once the installer finishes, it will automatically launch the Culina Tool backend on Port `4000`. 
Open your web browser and go to:
`http://localhost:4000`

You will be greeted by the **Setup Wizard**. Here you will enter:
1. Your desired **Admin Username**.
2. Your **Premium License Key** (You should have received this in your email after purchasing. Leave it blank if you only want the Free Edition).
3. *(Optional)* A Google Gemini API key to enable the AI Instagram/TikTok importer.

Click **Complete Setup** and you are ready to cook!

---

## ⚙️ Running in the Background

### Windows Background Service
If you used `install.bat` on Windows, you were prompted to add Culina Tool as a background service. If you typed `Y`, Culina Tool will now automatically start silently in the background every time you turn on your PC. You can access it from any phone or tablet on your WiFi network by navigating to your PC's local IP address (e.g., `http://192.168.1.55:4000`).

### Linux / Raspberry Pi (PM2)
If you are hosting this on a headless Linux server or Raspberry Pi, we recommend using PM2 to keep it alive forever:
```bash
sudo npm install -g pm2
pm2 start server.js --name culina-tool
pm2 save
pm2 startup
```

---

## 📱 How to Install on your Phone

Culina Tool is a Progressive Web App (PWA). You don't download it from the App Store.
1. Make sure Culina Tool is running on your computer.
2. Open Safari (iPhone) or Chrome (Android) on your phone.
3. Navigate to your computer's IP address (e.g., `http://192.168.x.x:4000`).
4. **iPhone:** Tap the "Share" button at the bottom of Safari, then tap **"Add to Home Screen"**.
5. **Android:** Tap the three dots menu in Chrome, then tap **"Add to Home screen"**.

Culina Tool will now appear as a regular app on your phone with a beautiful icon!

---

## 🔄 Updating to the Latest Version

When we release new features (like the new Smart Pantry Search), upgrading is incredibly easy.

1. Open your terminal and navigate to your `culina-tool` folder.
2. Run the following commands:
```bash
git pull
npm run build
```
3. Restart your node server.

*(If you are running the Windows Background Service, simply restart your computer after running the update commands).*

---

## 🤝 Support & Contact
Having trouble with your License Key or the installation process? We are here to help.
Reach out to our support team at **support@jaxsmu.com**.

*Built with ❤️ by JaxonDevs.*
