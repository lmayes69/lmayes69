# Cologne Buddy — Setup Guide

## Prerequisites

- [Node.js](https://nodejs.org) 18+ installed
- [Expo Go](https://expo.dev/go) app on your phone (iOS or Android)
- A [Supabase](https://supabase.com) account (free)
- An [Anthropic](https://console.anthropic.com) account for AI features (optional but recommended)

---

## Step 1: Install Dependencies

```bash
cd cologne-buddy
npm install
```

---

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once created, go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 3: Set Up Anthropic AI (Optional)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy it → `EXPO_PUBLIC_ANTHROPIC_API_KEY`

> Without an Anthropic key, the app still works — it uses mock fragrance data for notes and seasons.

---

## Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key
```

---

## Step 5: Run the App

```bash
npm start
```

Then:
- **iOS/Android**: Scan the QR code with the **Expo Go** app
- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`

---

## Features

| Feature | Description |
|---|---|
| **Barcode Scan** | Scan cologne box barcodes for automatic lookup |
| **AI Analysis** | Claude AI identifies notes, seasons & occasions |
| **Scent Pyramid** | Visual top/middle/base note display |
| **Season Tags** | Spring, Summer, Fall, Winter recommendations |
| **Today's Pick** | AI-powered daily fragrance recommendation |
| **Photo Upload** | Add photos from camera or gallery |
| **Tags** | Preset + custom tag system |
| **Favorites** | Heart your signature scents |
| **Review Sources** | Links to Fragrantica & Basenotes |
| **Cloud Sync** | Syncs across all your devices via Supabase |

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Tech Stack

- **React Native + Expo** (cross-platform mobile)
- **Expo Router** (file-based navigation)
- **Supabase** (auth + database + storage)
- **Claude AI** (fragrance intelligence)
- **Open Beauty Facts API** (barcode lookup)
