'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Dumbbell, 
  Users, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  Phone, 
  MessageSquare, 
  Search, 
  Lock, 
  RefreshCw,
  Trash2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Check,
  Settings,
  Plus,
  Save,
  Printer,
  Download,
  X,
  UserPlus,
  Calendar,
  LogOut,
  Edit2
} from 'lucide-react';
import { gsap } from 'gsap';
import { GymSettings, Plan } from '@/lib/settings';
import { Member } from '@/lib/db';

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const printQrRef = useRef<HTMLDivElement>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'members' | 'pricing'>('members');

  // Members data
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'expiring'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Settings & Pricing state
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDirectMemberModal, setShowDirectMemberModal] = useState(false);

  // Direct Member Add Form State (Counter Registration by Admin)
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directAge, setDirectAge] = useState('');
  const [directWeight, setDirectWeight] = useState('');
  const [directStartDate, setDirectStartDate] = useState('');
  const [directPlanId, setDirectPlanId] = useState('1m');
  const [directCustomDays, setDirectCustomDays] = useState(30);
  const [directIsCustom, setDirectIsCustom] = useState(false);
  const [directPaymentMode, setDirectPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [showCounterUpiModal, setShowCounterUpiModal] = useState<{ open: boolean; amount: number; name: string; memberId: string } | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [directIsSubmitting, setDirectIsSubmitting] = useState(false);

  const [clientUrl, setClientUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientUrl(window.location.origin);
      const today = new Date().toISOString().split('T')[0];
      setDirectStartDate(today);
    }
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedPin = sessionStorage.getItem('city_gym_admin_auth');
    if (savedPin === '8299' || (settings && savedPin === settings.adminPin)) {
      setIsAuthenticated(true);
      fetchMembers();
      fetchSettings();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const ctx = gsap.context(() => {
        gsap.from('.gsap-stat-card', { scale: 0.9, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' });
        gsap.from('.gsap-member-card', { y: 15, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isAuthenticated, filterStatus, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '8299' || (settings && pinInput === settings.adminPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('city_gym_admin_auth', pinInput);
      setPinError(false);
      fetchMembers();
      fetchSettings();
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('city_gym_admin_auth');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected' | 'pending') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, paymentStatus: status } : m));
      }
    } catch {
      alert('Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Kya aap sachme ${name} ka record delete karna chahte hain?`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.id !== id));
        fetchMembers(); // Re-sync directly with database
      } else {
        alert('Delete failed: ' + (data.error || 'Server error'));
      }
    } catch {
      alert('Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const sendWhatsAppReminder = (member: Member) => {
    const isPending = member.paymentStatus === 'pending';
    const text = isPending
      ? `Namaste ${member.name} ji! Indian Health Club me aapka swagat hai. Aapka membership form receive hua hai jisme ₹${member.amount} ka payment verify hona baaki hai. Kripya counter par confirm karein.`
      : `Namaste ${member.name} ji! Indian Health Club me aapki membership ${member.endDate} ko expire ho rahi hai. Regular fitness ke liye kripya apna plan renew karwayein. - Indian Health Club`;

    const url = `https://wa.me/91${member.phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    setSaveSuccessMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSaveSuccessMessage('Pricing & Settings Updated Live!');
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      }
    } catch {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePlanPriceChange = (planId: string, newPrice: number) => {
    if (!settings) return;
    const updatedPlans = settings.plans.map(p => p.id === planId ? { ...p, price: newPrice } : p);
    setSettings({ ...settings, plans: updatedPlans });
  };

  const handleDirectMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim()) return alert('Member ka naam enter karein!');
    if (!directPhone.trim() || directPhone.length < 10) return alert('10-digit mobile number daalein!');

    setDirectIsSubmitting(true);
    try {
      const plans = settings?.plans || [];
      const customRate = settings?.customDayRate || 50;
      
      let durationDays = 30;
      let durationMonths = 1;
      let amount = 1000;

      if (directIsCustom) {
        durationDays = Math.max(1, Number(directCustomDays) || 1);
        durationMonths = Math.round((durationDays / 30) * 10) / 10;
        amount = durationDays * customRate;
      } else {
        const found = plans.find(p => p.id === directPlanId) || plans[0];
        if (found) {
          durationDays = found.days;
          durationMonths = found.months;
          amount = found.price;
        }
      }

      const payload = {
        name: directName,
        phone: directPhone,
        age: directAge,
        weight: directWeight,
        startDate: directStartDate,
        durationDays,
        durationMonths,
        amount,
        paymentMethod: directPaymentMode,
        utrNumber: `Counter-${directPaymentMode}`,
        wantsDiet: false
      };

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        if (directPaymentMode === 'UPI') {
          // If UPI, keep member pending and open Counter UPI QR modal
          setShowDirectMemberModal(false);
          setDirectName('');
          setDirectPhone('');
          fetchMembers();
          setShowCounterUpiModal({
            open: true,
            amount,
            name: directName,
            memberId: result.data.id
          });
        } else {
          // Cash mode: direct verify
          await handleUpdateStatus(result.data.id, 'verified');
          alert(`Success! ${directName} ki membership add ho gayi (ID: ${result.data.id})`);
          setShowDirectMemberModal(false);
          setDirectName('');
          setDirectPhone('');
          fetchMembers();
        }
      } else {
        alert('Failed: ' + result.error);
      }
    } catch {
      alert('Error occurred while adding member');
    } finally {
      setDirectIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember)
      });
      const data = await res.json();
      if (data.success) {
        alert('Member updated successfully!');
        setEditingMember(null);
        fetchMembers();
      } else {
        alert('Update failed: ' + data.error);
      }
    } catch {
      alert('Error updating member');
    } finally {
      setEditSaving(false);
    }
  };

  const handlePrintQr = () => {
    window.print();
  };

  const totalRevenue = members
    .filter(m => m.paymentStatus === 'verified')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const pendingPayments = members.filter(m => m.paymentStatus === 'pending');

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'pending') return m.paymentStatus === 'pending';
    if (filterStatus === 'verified') return m.paymentStatus === 'verified';
    if (filterStatus === 'expiring') {
      const diffTime = new Date(m.endDate).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5 && diffDays >= 0;
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/15 blur-[120px] pointer-events-none" />

        <div className="max-w-sm w-full glass-panel border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-amber-500/25">
            <Lock className="w-8 h-8 stroke-[2.8]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide text-white font-['Cabinet_Grotesk',sans-serif]">
              OWNER PORTAL LOGIN
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Indian Health Club mobile &amp; counter management dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-40 text-center tracking-[0.6em] text-3xl font-black bg-slate-950/80 border border-slate-800 rounded-2xl py-3 text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 mx-auto shadow-inner"
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-2 font-bold animate-bounce">Galat PIN! Kripya sahi PIN darj karein.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl transition shadow-xl shadow-amber-500/20 active:scale-[0.98]"
            >
              Open Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col font-sans pb-20 relative overflow-x-hidden w-full max-w-full">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[130px] pointer-events-none -z-10" />

      {/* Fully Mobile-Responsive Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 px-3 py-2.5 sm:px-4 sm:py-3 w-full">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          
          {/* Gym Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                <Dumbbell className="w-5 h-5 stroke-[2.8]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-xs sm:text-sm tracking-wider text-white uppercase font-['Cabinet_Grotesk',sans-serif]">
                    INDIAN HEALTH CLUB ADMIN
                  </h1>
                  <span className="text-[8px] sm:text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-black">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Mobile &amp; Counter Portal</p>
              </div>
            </div>

            {/* Refresh button for small screens */}
            <button
              onClick={() => { fetchMembers(); fetchSettings(); }}
              title="Refresh Records"
              className="sm:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Action Buttons: Perfectly Responsive Grid / Row on Mobile */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => { fetchMembers(); fetchSettings(); }}
              title="Refresh Records"
              className="hidden sm:flex p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Client QR Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex-1 sm:flex-initial text-[11px] sm:text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition shadow-sm active:scale-[0.98] whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Client QR</span>
            </button>

            {/* Join Membership Button */}
            <button
              onClick={() => setShowDirectMemberModal(true)}
              className="flex-1 sm:flex-initial text-[11px] sm:text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20 active:scale-[0.98] whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.8] shrink-0" />
              <span>+ Join Member</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout from Admin"
              className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition shrink-0 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs font-bold">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Section */}
      <main className="max-w-4xl mx-auto w-full p-3 sm:p-4 space-y-3.5 sm:space-y-4">

        {/* Top Tab Switcher: Full width & responsive */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 sm:py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all truncate ${
              activeTab === 'members'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Members ({members.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 sm:py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all truncate ${
              activeTab === 'pricing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fees Setting ⚙️</span>
          </button>
        </div>

        {/* ================= TAB 1: MEMBERS MANAGEMENT ================= */}
        {activeTab === 'members' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in">
            {/* 4 Responsive Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="gsap-stat-card glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-0.5 sm:space-y-1 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
                  <span>Total Members</span>
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white">{members.length}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500">All registered</p>
              </div>

              <div className="gsap-stat-card glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-0.5 sm:space-y-1 shadow-xl border-emerald-500/20">
                <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
                  <span>Revenue</span>
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500">Verified cash/UPI</p>
              </div>

              <div className="gsap-stat-card glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-0.5 sm:space-y-1 shadow-xl border-amber-500/20">
                <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
                  <span>Pending Action</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-400">{pendingPayments.length}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500">Awaiting approval</p>
              </div>

              <div className="gsap-stat-card glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-0.5 sm:space-y-1 shadow-xl border-red-500/20">
                <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
                  <span>Expiring Soon</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-red-400">
                  {members.filter(m => {
                    const diffTime = new Date(m.endDate).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 5 && diffDays >= 0;
                  }).length}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500">In next 5 days</p>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-3 space-y-2.5 shadow-xl">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search member by Name, Phone (+91), or Member ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              {/* Horizontal Scrollable Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                {[
                  { id: 'all', label: `All (${members.length})` },
                  { id: 'pending', label: `Pending (${pendingPayments.length})` },
                  { id: 'verified', label: 'Active' },
                  { id: 'expiring', label: 'Expiring Soon' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-[11px] sm:text-xs transition-all ${
                      filterStatus === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Members Cards List */}
            <div className="space-y-3">
              {filteredMembers.length === 0 ? (
                <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-slate-400 text-xs">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 mx-auto mb-2" />
                  Koi member record nahi mila. &quot;+ Join Member&quot; dabakar add karein ya Client QR scan karwayein!
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const diffTime = new Date(m.endDate).getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpired = daysLeft < 0;

                  return (
                    <div
                      key={m.id}
                      className="gsap-member-card glass-panel rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 space-y-3 relative overflow-hidden transition-all hover:border-slate-700 shadow-xl"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 ${
                        m.paymentStatus === 'verified'
                          ? isExpired ? 'bg-red-500' : 'bg-emerald-500'
                          : m.paymentStatus === 'pending'
                          ? 'bg-amber-500'
                          : 'bg-slate-700'
                      }`} />

                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-white text-sm sm:text-base">{m.name}</h3>
                            <span className="font-mono text-[9px] sm:text-[10px] bg-slate-950 border border-slate-800 text-amber-400 px-1.5 py-0.2 rounded-md font-bold">
                              {m.id}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-slate-300">📞 +91 {m.phone}</span>
                            {m.age ? <span>• {m.age} Y</span> : null}
                            {m.weight ? <span>• {m.weight} KG</span> : null}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-white">₹{m.amount.toLocaleString('en-IN')}</span>
                          <div>
                            {m.paymentStatus === 'verified' ? (
                              <span className="text-[9px] sm:text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full inline-block">
                                Verified ✓
                              </span>
                            ) : m.paymentStatus === 'pending' ? (
                              <span className="text-[9px] sm:text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full inline-block animate-pulse">
                                Pending ⌛
                              </span>
                            ) : (
                              <span className="text-[9px] sm:text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-2 py-0.5 rounded-full inline-block">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date Grid */}
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-xs shadow-inner">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">Start Date:</span>
                          <span className="text-slate-300 font-semibold text-[11px] sm:text-xs">{m.startDate}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">End / Expiry:</span>
                          <span className={`font-black text-[11px] sm:text-xs ${isExpired ? 'text-red-400' : daysLeft <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {m.endDate} {isExpired ? '(Expired)' : `(${daysLeft} din)`}
                          </span>
                        </div>
                      </div>

                      {/* Responsive Actions Bar */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <button
                          onClick={() => sendWhatsAppReminder(m)}
                          className="flex-1 sm:flex-initial text-[11px] sm:text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 sm:py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp Reminder</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {m.paymentStatus !== 'verified' ? (
                            <button
                              disabled={actionLoading === m.id}
                              onClick={() => handleUpdateStatus(m.id, 'verified')}
                              className="text-[11px] sm:text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 transition active:scale-[0.98] shadow-md shadow-emerald-500/20"
                            >
                              <CheckCircle className="w-3.5 h-3.5 stroke-[2.8]" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading === m.id}
                              onClick={() => handleUpdateStatus(m.id, 'pending')}
                              title="Mark back to Pending"
                              className="text-[10px] sm:text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1.5 rounded-xl font-bold flex items-center gap-1 transition"
                            >
                              <span>Set Pending</span>
                            </button>
                          )}

                          {/* Edit Member Button */}
                          <button
                            onClick={() => setEditingMember({ ...m })}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-amber-500/20 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition"
                            title="Edit Member Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: FEES & PLANS SETTINGS ================= */}
        {activeTab === 'pricing' && settings && (
          <div className="space-y-4 animate-in fade-in">
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-500/30 shadow-xl space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  Membership Plans &amp; Fees Configuration
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                  Aap yahan jo fees set karenge, client ko QR scan karne par wahi fees dikhegi!
                </p>
              </div>

              {saveSuccessMessage && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Plans Price Settings */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                  Fixed Membership Plans Pricing:
                </label>

                <div className="space-y-2.5">
                  {settings.plans.map((p) => (
                    <div key={p.id} className="bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-3 flex items-center justify-between gap-2 shadow-inner">
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-white block">{p.name}</span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400">{p.days} Days Validity ({p.months} Month{p.months > 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-amber-400">₹</span>
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) => handlePlanPriceChange(p.id, Number(e.target.value))}
                          className="w-24 sm:w-28 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-black text-white text-right focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Per Day Rate Configuration */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block mb-2">
                  Custom Per-Day Rate (1 Din, 2 Din, 3 Din Membership ke liye):
                </label>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-3 flex items-center justify-between gap-2 shadow-inner">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-white block">Per Day Fee (Daily Pass)</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400">Custom din ke hisab se calculation</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-amber-400">₹</span>
                    <input
                      type="number"
                      value={settings.customDayRate}
                      onChange={(e) => setSettings({ ...settings, customDayRate: Number(e.target.value) })}
                      className="w-20 sm:w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-black text-white text-right focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] sm:text-xs text-slate-400">/Day</span>
                  </div>
                </div>
              </div>

              {/* UPI ID Configuration */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                  Counter Payment UPI ID (Scan &amp; Pay):
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="Ex: yourname@upi ya 9876543210@paytm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* QR Image URL or Upload */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                  Custom UPI QR Image (Upload QR Image ya URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.qrImageUrl || ''}
                    onChange={(e) => setSettings({ ...settings, qrImageUrl: e.target.value })}
                    placeholder="https://... ya niche se image file chunein"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  {settings.qrImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, qrImageUrl: '' })}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold border border-red-500/20"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="qr-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSettings({ ...settings, qrImageUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="qr-file-input"
                    className="cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Upload QR Image From Device</span>
                  </label>
                </div>

                {settings.qrImageUrl ? (
                  <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded-xl inline-block">
                    <p className="text-[10px] text-slate-400 mb-1">Live QR Preview:</p>
                    <img src={settings.qrImageUrl} alt="QR Preview" className="w-32 h-32 object-contain rounded-lg bg-white p-1" />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Agar QR upload nahi karenge toh aapke UPI ID ka dynamic QR auto-generate hota rahega.</p>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving...' : 'Save & Update Live Fees'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ================= MODAL 1: CLIENT QR CODE (PRINT & DOWNLOAD) ================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="max-w-sm w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Gym Counter Standee
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-2">Client QR Code</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Isko print karke apne gym counter ya entrance par lagayein!
              </p>
            </div>

            {/* Printable Frame */}
            <div ref={printQrRef} className="bg-white p-4 sm:p-5 rounded-3xl inline-block mx-auto border-4 border-amber-500/30 shadow-2xl">
              <QRCodeSVG
                value={clientUrl || 'http://localhost:3000'}
                size={200}
                level="H"
                includeMargin={false}
              />
              <p className="text-[10px] font-extrabold text-slate-950 uppercase tracking-widest mt-2">
                ⚡ SCAN TO JOIN INDIAN HEALTH CLUB
              </p>
            </div>

            <div className="text-[10px] sm:text-xs text-slate-400 font-mono break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
              {clientUrl || 'http://localhost:3000'}
            </div>

            {/* Print & Download Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrintQr}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Printer className="w-4 h-4 stroke-[2.8]" />
                <span>Print</span>
              </button>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(clientUrl || 'http://localhost:3000')}`}
                download="CityGym-Counter-QR.png"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: DIRECT MEMBERSHIP ADD ================= */}
      {showDirectMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                  <UserPlus className="w-4 h-4 stroke-[2.8]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm sm:text-base">Direct Member Entry</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400">Admin counter par instant membership activate karein</p>
                </div>
              </div>

              <button
                onClick={() => setShowDirectMemberModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDirectMemberSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Verma"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="24"
                    value={directAge}
                    onChange={(e) => setDirectAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Weight (KG)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={directWeight}
                    onChange={(e) => setDirectWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Start Date</label>
                <input
                  type="date"
                  value={directStartDate}
                  onChange={(e) => setDirectStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                />
              </div>

              {/* Plan Picker */}
              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1.5">Select Plan</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {settings?.plans.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => { setDirectPlanId(p.id); setDirectIsCustom(false); }}
                      className={`text-left p-2 rounded-xl border text-[11px] sm:text-xs transition ${
                        !directIsCustom && directPlanId === p.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block text-white font-bold">{p.name}</span>
                      <span className="text-amber-400">₹{p.price.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Days */}
                <div className="mt-2 flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={directIsCustom}
                      onChange={(e) => setDirectIsCustom(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span className="text-slate-300 text-[11px]">Custom (₹{settings?.customDayRate || 50}/day)</span>
                  </label>
                  {directIsCustom && (
                    <input
                      type="number"
                      min={1}
                      value={directCustomDays}
                      onChange={(e) => setDirectCustomDays(Math.max(1, Number(e.target.value)))}
                      className="w-14 bg-slate-900 border border-slate-700 rounded-lg text-center text-amber-400 font-bold py-1 text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Payment Received In:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'UPI'] as const).map(mode => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setDirectPaymentMode(mode)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        directPaymentMode === mode
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {mode === 'CASH' ? '💵 Cash' : '📱 Counter UPI QR'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={directIsSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 stroke-[2.8]" />
                  <span>
                    {directIsSubmitting 
                      ? 'Adding...' 
                      : directPaymentMode === 'UPI' 
                      ? 'Proceed to UPI QR Screen' 
                      : 'Add & Activate Cash Membership'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: COUNTER UPI QR POPUP ================= */}
      {showCounterUpiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="max-w-sm w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCounterUpiModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 rounded-full shadow-md">
                SCAN &amp; PAY ₹{showCounterUpiModal.amount.toLocaleString('en-IN')}
              </span>
              <h3 className="font-black text-white text-base mt-2">{showCounterUpiModal.name}</h3>
              <p className="text-[11px] text-slate-400">ID: {showCounterUpiModal.memberId}</p>
            </div>

            {/* QR View */}
            <div className="p-3 bg-white rounded-2xl inline-block shadow-2xl border-2 border-amber-500/30 mx-auto">
              {settings?.qrImageUrl ? (
                <img
                  src={settings.qrImageUrl}
                  alt="UPI QR"
                  className="w-[200px] h-[200px] object-contain rounded-xl mx-auto"
                />
              ) : (
                <QRCodeSVG
                  value={`upi://pay?pa=${encodeURIComponent(settings?.upiId || 'indianhealthclub@upi')}&pn=Indian%20Health%20Club&am=${showCounterUpiModal.amount}&cu=INR`}
                  size={200}
                  level="H"
                />
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Client ko scan karwayein aur payment check karein:
            </p>

            {/* Single Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCounterUpiModal(null);
                  fetchMembers();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Done (Pending Verification me Save Ho Gaya)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: EDIT MEMBER POPUP ================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                  <Edit2 className="w-4 h-4 stroke-[2.8]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm sm:text-base">Edit Member Record</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400">ID: {editingMember.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Mobile (+91)</label>
                <input
                  type="tel"
                  required
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Age</label>
                  <input
                    type="number"
                    value={editingMember.age || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Weight (KG)</label>
                  <input
                    type="number"
                    value={editingMember.weight || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, weight: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingMember.startDate}
                    onChange={(e) => setEditingMember({ ...editingMember, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">End / Expiry Date</label>
                  <input
                    type="date"
                    value={editingMember.endDate}
                    onChange={(e) => setEditingMember({ ...editingMember, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={editingMember.amount}
                    onChange={(e) => setEditingMember({ ...editingMember, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold block mb-1">Payment Status</label>
                  <select
                    value={editingMember.paymentStatus}
                    onChange={(e) => setEditingMember({ ...editingMember, paymentStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editSaving ? 'Saving Changes...' : 'Save & Update Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
