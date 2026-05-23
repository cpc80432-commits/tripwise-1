# 旅智 (Tripwise) — AI 旅遊規劃助手

全端 AI 旅遊規劃 App，使用 Next.js 14 + Firebase + Google Maps + OpenWeather

---

## 🚀 快速啟動

```bash
# 1. 安裝套件
npm install

# 2. 設定環境變數（見下方教學）
cp .env.local.example .env.local
# 填入你的 API Keys

# 3. 本地啟動
npm run dev
```

開啟 http://localhost:3000

---

## 📁 專案結構

```
src/
├── app/                  # Next.js App Router 頁面
│   ├── page.tsx          # 首頁
│   ├── trips/            # 旅程列表 + 詳情
│   │   └── [id]/         # 旅程詳細頁
│   ├── explore/          # 探索目的地
│   ├── budget/           # 預算管理
│   ├── profile/          # 個人帳戶
│   └── admin/            # 管理後台
├── components/
│   ├── auth/             # 登入相關
│   ├── layout/           # BottomNav 等
│   ├── trip/             # 建立旅程 Flow
│   └── ui/               # 共用元件（搜尋下拉等）
├── lib/
│   ├── firebase.ts       # Firebase 初始化
│   ├── firestore.ts      # 資料庫 CRUD
│   ├── weather.ts        # OpenWeather API
│   └── ai.ts             # AI 行程生成邏輯
├── store/                # Zustand 全域狀態
├── types/                # TypeScript 型別
└── data/
    └── destinations.ts   # 全球熱門目的地資料
```

---

## 🔥 Step 1：建立 Firebase 專案

1. 前往 https://console.firebase.google.com
2. 點擊「新增專案」
3. 輸入專案名稱（例如：tripwise-app）
4. 點擊「繼續」，停用 Google Analytics（可選），建立專案

### 1.1 開啟 Authentication

1. 左側選單 → 建構 → Authentication
2. 點擊「開始使用」
3. Sign-in method → 點擊「Google」
4. 啟用 → 填入你的 Email → 儲存

### 1.2 建立 Firestore 資料庫

1. 左側選單 → 建構 → Firestore Database
2. 點擊「建立資料庫」
3. 選擇「在測試模式下啟動」（開發期間用）
4. 選擇區域（推薦：asia-east1 = 台灣最近）

### 1.3 取得 Firebase Config

1. 專案首頁 → 點擊齒輪圖示 → 「專案設定」
2. 捲到下方「你的應用程式」
3. 點擊 `</>` Web 圖示，新增 Web 應用程式
4. 複製 firebaseConfig 物件中的值

---

## 🔑 Step 2：設定 .env.local

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Google Maps（下方教學）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# OpenWeather（下方教學）
NEXT_PUBLIC_OPENWEATHER_API_KEY=abc123...

# 你的 Firebase UID（登入後在 Authentication 頁面查看）
NEXT_PUBLIC_ADMIN_UID=your_uid_here
```

---

## 🗺️ Step 3：申請 Google Maps API Key

1. 前往 https://console.cloud.google.com
2. 建立新專案（或使用現有）
3. 左側選單 → API 和服務 → 媒體庫
4. 啟用以下 API：
   - **Maps JavaScript API**（地圖顯示）
   - **Places API**（景點搜尋）
   - **Directions API**（路線規劃）
   - **Geocoding API**（地址轉換）
5. 左側選單 → 憑證 → 建立憑證 → API 金鑰
6. 複製 API Key 貼入 .env.local

### 設定 Billing（必要）

1. 左側選單 → 帳單
2. 連結信用卡（每月有 $200 免費額度）
3. 一般個人開發不會超過免費額度

---

## 🌤️ Step 4：申請 OpenWeather API Key

1. 前往 https://openweathermap.org
2. 點擊右上角「Sign Up」，免費註冊
3. 登入後 → My API Keys
4. 複製 Default Key（或建立新的）
5. 貼入 .env.local 的 `NEXT_PUBLIC_OPENWEATHER_API_KEY`

注意：新申請的 Key 需要約 1-2 小時後才能使用

---

## 🗄️ Step 5：查看 Firestore 資料

### 查看所有資料

1. 前往 https://console.firebase.google.com
2. 選擇你的專案
3. 左側選單 → Firestore Database
4. 可以看到所有 Collection

### 資料結構說明

```
users/
  └── {uid}
      ├── uid: string
      ├── name: string
      ├── email: string
      ├── avatar: string (photo URL)
      └── createdAt: timestamp

trips/
  └── {tripId}
      ├── userId: string
      ├── title: string
      ├── destination: string
      ├── country: string
      ├── startDate: string (YYYY-MM-DD)
      ├── endDate: string
      ├── budget: number
      ├── travelers: number
      ├── status: 'planning' | 'ongoing' | 'completed'
      ├── createdAt: timestamp
      └── trip_days/ (subcollection)
          └── day_1, day_2...
              ├── day: number
              ├── date: string
              └── itinerary: PlaceItem[]

expenses/ (subcollection under trips/{tripId})
  └── {expenseId}
      ├── category: string
      ├── name: string
      ├── amount: number
      └── createdAt: timestamp

ai_logs/
  └── {logId}
      ├── userId: string
      ├── prompt: string
      ├── response: string
      └── createdAt: timestamp
```

### 查看使用者資料

```
Firestore → users → 點擊任何一個文件
```

### 查看旅程資料

```
Firestore → trips → 點擊任何一個文件
```

### 過濾查詢（在 Firebase Console）

1. Firestore → users 或 trips
2. 點擊「篩選器」
3. 選擇欄位，例如 email = xxx@gmail.com

---

## 👑 Step 6：設定管理員帳號

1. 先登入 App（使用 Google）
2. 前往 Firebase Console → Authentication → Users
3. 找到你的帳號，複製 User UID
4. 貼入 .env.local：
   ```
   NEXT_PUBLIC_ADMIN_UID=your_uid_here
   ```
5. 重啟 `npm run dev`
6. 前往 http://localhost:3000/admin

---

## 🚢 Step 7：部署 Vercel

1. 前往 https://vercel.com，登入 GitHub
2. Import Project → 選擇你的 repo
3. Framework Preset: **Next.js**
4. 展開 Environment Variables，填入所有 `.env.local` 的 Key-Value
5. 點擊 Deploy

### 設定 Firebase Authorized Domain

部署後，需要加入你的 Vercel 網址到 Firebase Auth 白名單：

1. Firebase Console → Authentication → Settings
2. 授權網域 → 新增網域
3. 輸入你的 Vercel 網址（例如：tripwise.vercel.app）

---

## 🔒 Firestore 安全規則（建議設定）

```javascript
// Firebase Console → Firestore → 規則
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 使用者只能讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // 旅程只能被擁有者存取
    match /trips/{tripId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
      
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // AI 紀錄只能被擁有者讀取
    match /ai_logs/{logId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 🎯 功能清單

| 功能 | 狀態 |
|------|------|
| Google 登入 | ✅ |
| 建立旅程（5步驟 Flow）| ✅ |
| AI 行程生成 | ✅ |
| 行程時間軸 | ✅ |
| 目的地搜尋（支援國旗 + autocomplete）| ✅ |
| 全球 15+ 熱門目的地 | ✅ |
| OpenWeather 天氣整合 | ✅ |
| 預算管理 + 記帳 | ✅ |
| 費用分類分析 | ✅ |
| AI 預算建議 | ✅ |
| Firestore 完整資料庫 | ✅ |
| 管理員後台 | ✅ |
| 響應式設計（Mobile First）| ✅ |
| PWA 支援 | ✅ |

---

## 📞 技術支援

如需協助，請附上：
- 錯誤訊息截圖
- .env.local 設定（API Key 可隱藏前幾碼）
- 瀏覽器版本
