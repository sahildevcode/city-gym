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
  dietPlan?: {
    goal: string;
    foodType: 'veg' | 'non-veg' | 'egg';
    meals: {
      timing: string;
      title: string;
      items: string[];
      notes?: string;
    }[];
    calorieTarget: string;
    waterIntake: string;
    tips: string[];
  };
}

const dataFilePath = path.join(process.cwd(), 'data', 'members.json');

// Ensure directory exists
function ensureFile() {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllMembers(): Member[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading members:', error);
    return [];
  }
}

export function saveMember(member: Member): void {
  ensureFile();
  const members = getAllMembers();
  const existingIndex = members.findIndex(m => m.id === member.id);
  if (existingIndex >= 0) {
    members[existingIndex] = member;
  } else {
    members.unshift(member);
  }
  fs.writeFileSync(dataFilePath, JSON.stringify(members, null, 2), 'utf-8');
}

export function updateMemberStatus(id: string, status: 'pending' | 'verified' | 'rejected'): Member | null {
  ensureFile();
  const members = getAllMembers();
  const member = members.find(m => m.id === id);
  if (member) {
    member.paymentStatus = status;
    fs.writeFileSync(dataFilePath, JSON.stringify(members, null, 2), 'utf-8');
    return member;
  }
  return null;
}

export function deleteMember(id: string): boolean {
  ensureFile();
  let members = getAllMembers();
  const initialLen = members.length;
  members = members.filter(m => m.id !== id);
  if (members.length !== initialLen) {
    fs.writeFileSync(dataFilePath, JSON.stringify(members, null, 2), 'utf-8');
    return true;
  }
  return false;
}
