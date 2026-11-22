import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

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

let memoryMembers: Member[] = [];

// Local file fallback
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
    // fallback
  }
}

export async function getAllMembersAsync(): Promise<Member[]> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length >= 0) {
      memoryMembers = data as Member[];
      return memoryMembers;
    }
  } catch (err) {
    console.warn('Supabase fetch error, fallback to local:', err);
  }

  // Fallback to local file / memory
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

export async function saveMemberAsync(member: Member): Promise<void> {
  const existingIndex = memoryMembers.findIndex(m => m.id === member.id);
  if (existingIndex >= 0) {
    memoryMembers[existingIndex] = member;
  } else {
    memoryMembers.unshift(member);
  }

  // Save to Supabase
  try {
    const { error } = await supabase.from('members').upsert({
      id: member.id,
      name: member.name,
      phone: member.phone,
      age: Number(member.age) || 0,
      weight: Number(member.weight) || 0,
      startDate: member.startDate,
      durationMonths: Number(member.durationMonths) || 0,
      durationDays: Number(member.durationDays) || 0,
      endDate: member.endDate,
      amount: Number(member.amount) || 0,
      paymentMethod: member.paymentMethod,
      paymentStatus: member.paymentStatus,
      utrNumber: member.utrNumber || '',
      wantsDiet: Boolean(member.wantsDiet),
      createdAt: member.createdAt
    });
    if (error) {
      console.error('Supabase save error:', error);
    }
  } catch (err) {
    console.warn('Supabase connection failed on save:', err);
  }

  // Local file backup
  try {
    ensureFile();
    fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
  } catch (e) {
    // silent
  }
}

export async function updateMemberStatusAsync(id: string, status: 'pending' | 'verified' | 'rejected'): Promise<Member | null> {
  await getAllMembersAsync();
  const member = memoryMembers.find(m => m.id === id);
  if (member) {
    member.paymentStatus = status;
    try {
      await supabase.from('members').update({ paymentStatus: status }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update status failed:', e);
    }
    try {
      ensureFile();
      fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
    } catch (e) {}
    return member;
  }
  return null;
}

export async function updateMemberDetailsAsync(id: string, updates: Partial<Member>): Promise<Member | null> {
  await getAllMembersAsync();
  const index = memoryMembers.findIndex(m => m.id === id);
  if (index >= 0) {
    memoryMembers[index] = { ...memoryMembers[index], ...updates };
    const updated = memoryMembers[index];

    try {
      await supabase.from('members').update({
        name: updated.name,
        phone: updated.phone,
        age: Number(updated.age) || 0,
        weight: Number(updated.weight) || 0,
        startDate: updated.startDate,
        endDate: updated.endDate,
        amount: Number(updated.amount) || 0,
        paymentStatus: updated.paymentStatus,
        paymentMethod: updated.paymentMethod
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update member details failed:', e);
    }

    try {
      ensureFile();
      fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
    } catch (e) {}

    return updated;
  }
  return null;
}

export async function deleteMemberAsync(id: string): Promise<boolean> {
  // 1. Delete from Supabase
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
    }
  } catch (e) {
    console.warn('Supabase delete failed:', e);
  }

  // 2. Remove from local array
  await getAllMembersAsync();
  const idx = memoryMembers.findIndex(m => m.id === id);
  if (idx >= 0) {
    memoryMembers.splice(idx, 1);
  }

  // 3. Update local file
  try {
    ensureFile();
    fs.writeFileSync(dataFilePath, JSON.stringify(memoryMembers, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}
