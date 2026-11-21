import fs from 'fs';
import path from 'path';

export interface Plan {
  id: string;
  name: string;
  months: number;
  days: number;
  price: number;
  popular?: boolean;
}

export interface GymSettings {
  gymName: string;
  tagline: string;
  contactPhone: string;
  upiId: string;
  merchantName: string;
  adminPin: string;
  customDayRate: number;
  qrImageUrl?: string;
  plans: Plan[];
}

let defaultSettings: GymSettings = {
  gymName: 'CITY GYM & FITNESS CLUB',
  tagline: 'Transform Your Body, Elevate Your Mind',
  contactPhone: '+91 98765 43210',
  upiId: 'citygym@upi',
  merchantName: 'City Gym Fitness Club',
  adminPin: '1234',
  customDayRate: 50,
  qrImageUrl: '',
  plans: [
    { id: '1m', name: '1 Month Membership', months: 1, days: 30, price: 1000, popular: false },
    { id: '3m', name: '3 Months Membership', months: 3, days: 90, price: 2500, popular: true },
    { id: '6m', name: '6 Months Membership', months: 6, days: 180, price: 4500, popular: false },
    { id: '12m', name: '1 Year Membership', months: 12, days: 365, price: 8000, popular: false },
  ]
};

const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const settingsFilePath = isServerless
  ? path.join('/tmp', 'settings.json')
  : path.join(process.cwd(), 'data', 'settings.json');

function ensureSettingsFile() {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(settingsFilePath)) {
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Settings using in-memory store:', e);
  }
}

export function getGymSettings(): GymSettings {
  try {
    ensureSettingsFile();
    if (fs.existsSync(settingsFilePath)) {
      const raw = fs.readFileSync(settingsFilePath, 'utf-8');
      defaultSettings = JSON.parse(raw);
    }
  } catch (error) {
    console.warn('Error reading settings file, using memory:', error);
  }
  return defaultSettings;
}

export function updateGymSettings(newSettings: Partial<GymSettings>): GymSettings {
  defaultSettings = { ...defaultSettings, ...newSettings };
  try {
    ensureSettingsFile();
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Saved settings to memory store:', e);
  }
  return defaultSettings;
}
