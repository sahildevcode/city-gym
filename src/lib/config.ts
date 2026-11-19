export const GYM_CONFIG = {
  gymName: 'CITY GYM & FITNESS CLUB',
  tagline: 'Transform Your Body, Elevate Your Mind',
  contactPhone: '+91 98765 43210',
  address: 'Main Market Road, City Center',
  upiId: 'citygym@upi', // Default UPI ID, owner can change anytime
  merchantName: 'City Gym Fitness Club',
  adminPin: '1234', // 4-digit PIN for Owner's mobile dashboard access
  plans: [
    { id: '1m', name: '1 Month Kickstart', months: 1, days: 30, price: 1000, popular: false },
    { id: '3m', name: '3 Months Transformation', months: 3, days: 90, price: 2500, popular: true },
    { id: '6m', name: '6 Months Power Beast', months: 6, days: 180, price: 4500, popular: false },
    { id: '12m', name: '1 Year Elite Annual', months: 12, days: 365, price: 8000, popular: false },
  ],
  customDayRate: 35 // ₹35 per day for custom membership
};
