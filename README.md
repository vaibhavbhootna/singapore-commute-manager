# 🚌 Singapore Commute Manager & Smart iOS Widget

A real-time Singapore LTA bus arrival tracker, commute connection predictor, and smart iOS Scriptable widget.

---

## ⚡ Features

1. **📍 Nearby Home Stops (Default Screen)**:
   - Instant live arrival sequences for nearby bus stops: **Blk 124 (`84249`)** and **Blk 81 (`84241`)**.
   - Displays live horizontal arrival badges (`Arr`, `14m`, `26m`).

2. **🔄 Commute Connections & Fastest Route Predictor**:
   - Evaluates multi-leg commute connections (e.g. `Blk 81 (Bus 14) ➔ Amber Rd Transfer ➔ Changi Office (Bus 47)`).
   - **Fastest Destination Arrival Engine**: Calculates every possible bus arrival combination to predict the earliest office arrival ETA!

3. **⏰ Custom Schedule & Auto-Schedule Manager**:
   - Configure custom commute time windows (e.g., Morning Office 10:00–12:00, Evening Home 18:00–21:00).
   - Custom active day multi-selector (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`).

4. **📊 Dashboard Only Mode**:
   - Clean, distraction-free view hiding the widget preview and code.

5. **📱 iPhone Scriptable Widget**:
   - Ready-to-use JavaScript code for the [Scriptable iOS App](https://scriptable.app/).
   - High-frequency 1-minute auto-refresh and instant **Tap-to-Refresh**.

---

## 🚀 Quick Start (Local Development)

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/singapore-commute-manager.git
cd singapore-commute-manager

# Start live local proxy server
npm start
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🌐 Deploy to Vercel

This repository is pre-configured for 1-click Vercel deployment with serverless functions and secret management.

### Option 1: Vercel CLI
```bash
npx vercel
```

### Option 2: Vercel Web Dashboard
1. Push this repository to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. In **Environment Variables**, add:
   - **Name**: `LTA_ACCOUNT_KEY`
   - **Value**: `JGy+GlkWTsqJFUgeMJxDNw==` (or your personal LTA DataMall Key)
4. Click **Deploy**!

---

## 🔒 Secret Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your secret key is defined in `.env`:
```env
LTA_ACCOUNT_KEY=JGy+GlkWTsqJFUgeMJxDNw==
```
*(Note: `.env` is automatically ignored in `.gitignore` so secrets remain private).*

---

## 📱 How to Add to iPhone Home Screen Widget

1. Install **Scriptable** from the iOS App Store.
2. Open Scriptable and tap **+** to create a new script.
3. Name it `lta_bus_widget`.
4. Copy the code from `lta_bus_widget.js` (or from the web dashboard copy button) and paste it into Scriptable.
5. Go to your iPhone Home Screen ➔ Add Widget ➔ Select **Scriptable (Medium)** ➔ Select `lta_bus_widget`.
6. Tap the widget anytime to instantly refresh live bus arrival data!

---

## 📄 License
MIT License
