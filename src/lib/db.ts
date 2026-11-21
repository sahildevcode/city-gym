import fs from 'fs';
import path from 'path';

export interface Member {
  id: string;
  name: string;
  phone: string;
  age: number;
  weight: number;
  startDate: string;
  durationMonths: number;
  durationDays: number;
  endDate: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  utrNumber?: string;
  createdAt: string;
  wantsDiet: boolean;
}

// In-Memory store for Serverless (Netlify/Vercel/Cloud)
let memoryMembers: Member[] = [];

// Fallback to /tmp on serverless environments where local disk is read-only
const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const dataFilePath = isServerless 
  ? path.join('/tmp', 'members.json')
  : path.join(process.cwd(), 'data', 'members.json');

function ensureFile() {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
    }
  } catch (e) {
    // Silently fall back to memory store on serverless
    console.warn('File system read-only, using in-memory store:', e);
  }
}

export function getAllMembers(): Member[] {
  try {
    ensureFile();
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryMembers = parsed;
      }
    }
  } catch (error) {
    console.error('Reading from memory store:', error);
  }
  return memoryMembers;
}

export function saveMember(member: Member): void {
  const existingIndex = memoryMembers.findIndex(m => m.id === member.id);
  if (existingIndex >= 0) {
    memoryMembers[existingIndex] = member;
  } else {
    memoryMembers.unshift(member);
  }

  try {
    ensureFile();
    fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Wrote to memory store (Serverless read-only disk):', e);
  }
}

export function updateMemberStatus(id: string, status: 'pending' | 'verified' | 'rejected'): Member | null {
  getAllMembers();
  const member = memoryMembers.find(m => m.id === id);
  if (member) {
    member.paymentStatus = status;
    try {
      ensureFile();
      fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Updated in memory store:', e);
    }
    return member;
  }
  return null;
}

export function deleteMember(id: string): boolean {
  getAllMembers();
  const initialLen = memoryMembers.length;
  memoryMembers = memoryMembers.filter(m => m.id !== id);
  if (memoryMembers.length !== initialLen) {
    try {
      ensureFile();
      fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Deleted in memory store:', e);
    }
    return true;
  }
  return false;
}
