# 🏋️ CITY GYM & FITNESS CLUB - Smart QR & Management System

Ek complete Smart Gym Onboarding & Admin Management Automation System jisme:
- 📲 **Client QR Code Flow**: Scan karte hi registration form khulega.
- 📅 **Auto-Selected Today's Date**: Joining date auto select hogi aur customer aage-peeche bhi kar sakta hai.
- ⏱️ **Membership Duration**: 1 Month, 3 Months, 6 Months, 1 Year aur **Custom Days** selector (₹35/Day).
- 🥗 **Smart AI Diet Planner**: Fat Loss, Muscle Gain, Veg/Egg/Non-Veg options ke saath customized macro & diet schedule.
- 💳 **Dynamic UPI QR Code**: GPay, PhonePe, Paytm kisi se bhi scan karke direct counter payment.
- 📱 **Mobile & Desktop Owner Dashboard**: Live member count, revenue, expiry tracker (5-day alerts), aur 1-Click WhatsApp Fee Reminder!
- 💰 **Monthly Cost**: **₹0 (Bilkul Free)**.

---

## 🚀 How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Open Links in Browser:**
   - **Client Registration (QR Link):** `http://localhost:3000`
   - **Owner / Admin Dashboard:** `http://localhost:3000/admin` (Default PIN: `1234`)

---

## 🌐 Deploy to Vercel (100% Free Live Website)

1. Is folder ko apne GitHub account par upload karein (`git push`).
2. [Vercel.com](https://vercel.com) par free account banayein.
3. "Add New Project" karke is repository ko select karein aur **Deploy** dabayein.
4. Vercel aapko ek free live link dega (jaise `city-gym.vercel.app`).
5. Us link ka QR code nikaal kar apne gym ke counter par laga dein!

---

## ⚙️ Configuration (`src/lib/config.ts`)

Aap `src/lib/config.ts` me jakar easily change kar sakte hain:
- **Gym Name**: `CITY GYM & FITNESS CLUB`
- **UPI ID**: `citygym@upi` (Yahan apni direct PhonePe/GPay UPI ID daalein)
- **Admin PIN**: `1234` (Dashboard lock PIN)
- **Pricing & Plans**: 1M, 3M, 6M, 1Y aur Custom Day Rate.
