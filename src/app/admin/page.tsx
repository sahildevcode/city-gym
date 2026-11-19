'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Save
} from 'lucide-react';
import { gsap } from 'gsap';
import { GymSettings, Plan } from '@/lib/settings';
import { Member } from '@/lib/db';

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
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
    if (savedPin === '1234') {
      setIsAuthenticated(true);
      fetchMembers();
      fetchSettings();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const ctx = gsap.context(() => {
        gsap.from('.gsap-stat-card', { scale: 0.9, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)' });
        gsap.from('.gsap-member-card', { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isAuthenticated, filterStatus, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || (settings && pinInput === settings.adminPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('city_gym_admin_auth', pinInput);
      setPinError(false);
      fetchMembers();
      fetchSettings();
    } else {
      setPinError(true);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
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
      ? `Namaste ${member.name} ji! City Gym me aapka swagat hai. Aapka membership form receive hua hai jisme ₹${member.amount} ka payment verify hona baaki hai. Kripya counter par confirm karein.`
      : `Namaste ${member.name} ji! City Gym me aapki membership ${member.endDate} ko expire ho rahi hai. Regular fitness ke liye kripya apna plan renew karwayein. - City Gym`;

    const url = `https://wa.me/91${member.phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Save Settings / Fees Changes
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
        setSaveSuccessMessage('Pricing & Settings Updated Live! Client portal me turant update ho gaya.');
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      }
    } catch {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Update specific plan price
  const handlePlanPriceChange = (planId: string, newPrice: number) => {
    if (!settings) return;
    const updatedPlans = settings.plans.map(p => p.id === planId ? { ...p, price: newPrice } : p);
    setSettings({ ...settings, plans: updatedPlans });
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

        <div className="max-w-sm w-full glass-panel border border-slate-800 rounded-3xl p-7 text-center space-y-4 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-amber-500/25">
            <Lock className="w-8 h-8 stroke-[2.8]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide text-white font-['Cabinet_Grotesk',sans-serif]">
              OWNER PORTAL LOGIN
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              City Gym mobile &amp; counter management dashboard
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
                <p className="text-xs text-red-400 mt-2 font-bold animate-bounce">Galat PIN! Default PIN: 1234</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl transition shadow-xl shadow-amber-500/20 active:scale-[0.98]"
            >
              Open Dashboard
            </button>

            <p className="text-[11px] text-slate-500">
              Default Master PIN: <strong className="text-amber-400">1234</strong>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col font-sans pb-20 relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[130px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Dumbbell className="w-5 h-5 stroke-[2.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm tracking-widest text-white uppercase font-['Cabinet_Grotesk',sans-serif]">
                  CITY GYM ADMIN
                </h1>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Mobile &amp; Counter Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchMembers(); fetchSettings(); }}
              title="Refresh Records"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <a
              href="/"
              target="_blank"
              className="text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition shadow-sm"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Client QR</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Section */}
      <main className="max-w-4xl mx-auto w-full p-4 space-y-4">

        {/* Top Switcher: Members List vs Fees & Settings */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'members'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members &amp; Approvals ({members.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pricing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Fees &amp; Plans Setting ⚙️</span>
          </button>
        </div>

        {/* ================= TAB 1: MEMBERS MANAGEMENT ================= */}
        {activeTab === 'members' && (
          <div className="space-y-4 animate-in fade-in">
            {/* 4 Premium Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="gsap-stat-card glass-panel rounded-3xl p-4 space-y-1 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Total Members</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">{members.length}</p>
                <p className="text-[10px] text-slate-500">All registered profiles</p>
              </div>

              <div className="gsap-stat-card glass-panel rounded-3xl p-4 space-y-1 shadow-xl border-emerald-500/20">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Verified Revenue</span>
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500">Collected in Bank/UPI</p>
              </div>

              <div className="gsap-stat-card glass-panel rounded-3xl p-4 space-y-1 shadow-xl border-amber-500/20">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Pending Action</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400">{pendingPayments.length}</p>
                <p className="text-[10px] text-slate-500">Awaiting approval</p>
              </div>

              <div className="gsap-stat-card glass-panel rounded-3xl p-4 space-y-1 shadow-xl border-red-500/20">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Expiring Soon</span>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-2xl font-black text-red-400">
                  {members.filter(m => {
                    const diffTime = new Date(m.endDate).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 5 && diffDays >= 0;
                  }).length}
                </p>
                <p className="text-[10px] text-slate-500">In next 5 days</p>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="glass-panel rounded-3xl p-3.5 space-y-3 shadow-xl">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search member by Name, Phone (+91), or Member ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                {[
                  { id: 'all', label: `All Members (${members.length})` },
                  { id: 'pending', label: `Pending Approvals (${pendingPayments.length})` },
                  { id: 'verified', label: 'Active Members' },
                  { id: 'expiring', label: 'Expiring in 5 Days' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                      filterStatus === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
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
                <div className="glass-panel rounded-3xl p-8 text-center text-slate-400 text-xs">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  Koi member record nahi mila. Client form bharte hi yahan live show hoga!
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const diffTime = new Date(m.endDate).getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpired = daysLeft < 0;

                  return (
                    <div
                      key={m.id}
                      className="gsap-member-card glass-panel rounded-3xl p-4.5 space-y-3.5 relative overflow-hidden transition-all hover:border-slate-700 shadow-xl"
                    >
                      {/* Status Strip */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        m.paymentStatus === 'verified'
                          ? isExpired ? 'bg-red-500' : 'bg-emerald-500'
                          : m.paymentStatus === 'pending'
                          ? 'bg-amber-500'
                          : 'bg-slate-700'
                      }`} />

                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-white text-base">{m.name}</h3>
                            <span className="font-mono text-[10px] bg-slate-950 border border-slate-800 text-amber-400 px-2 py-0.5 rounded-lg font-bold">
                              {m.id}
                            </span>
                            {m.wantsDiet && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Diet
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                            <span className="font-mono text-slate-300">📞 +91 {m.phone}</span>
                            {m.age ? <span>• {m.age} Yrs</span> : null}
                            {m.weight ? <span>• {m.weight} KG</span> : null}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-white">₹{m.amount.toLocaleString('en-IN')}</span>
                          <div>
                            {m.paymentStatus === 'verified' ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full inline-block">
                                Verified ✓
                              </span>
                            ) : m.paymentStatus === 'pending' ? (
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2.5 py-0.5 rounded-full inline-block animate-pulse">
                                Pending Approval ⌛
                              </span>
                            ) : (
                              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-2.5 py-0.5 rounded-full inline-block">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date Grid */}
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs shadow-inner">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Start Date:</span>
                          <span className="text-slate-300 font-semibold">{m.startDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">End / Expiry:</span>
                          <span className={`font-black ${isExpired ? 'text-red-400' : daysLeft <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {m.endDate} {isExpired ? '(Expired)' : `(${daysLeft} din baaki)`}
                          </span>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <button
                          onClick={() => sendWhatsAppReminder(m)}
                          className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Reminder</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {m.paymentStatus !== 'verified' && (
                            <button
                              disabled={actionLoading === m.id}
                              onClick={() => handleUpdateStatus(m.id, 'verified')}
                              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] shadow-md shadow-emerald-500/20"
                            >
                              <CheckCircle className="w-3.5 h-3.5 stroke-[2.8]" />
                              <span>Approve &amp; Activate</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition"
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
            
            <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 shadow-xl space-y-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  Membership Plans &amp; Fees Configuration
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Aap yahan jo fees set karenge, client ko QR scan karne par wahi fees dikhegi! (e.g. 1 Month = ₹10,000, 3 Months = ₹30,000)
                </p>
              </div>

              {saveSuccessMessage && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Plans Price Settings */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                  Fixed Membership Plans Pricing:
                </label>

                <div className="space-y-3">
                  {settings.plans.map((p) => (
                    <div key={p.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                      <div>
                        <span className="font-bold text-sm text-white block">{p.name}</span>
                        <span className="text-[11px] text-slate-400">{p.days} Days Validity ({p.months} Month{p.months > 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-400">₹</span>
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) => handlePlanPriceChange(p.id, Number(e.target.value))}
                          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white text-right focus:outline-none focus:border-amber-500"
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
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                  <div>
                    <span className="font-bold text-sm text-white block">Per Day Fee (Daily Pass)</span>
                    <span className="text-[11px] text-slate-400">Agar koi 1 din, 2 din, ya 15 din choose karega toh is rate se calculate hoga</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-400">₹</span>
                    <input
                      type="number"
                      value={settings.customDayRate}
                      onChange={(e) => setSettings({ ...settings, customDayRate: Number(e.target.value) })}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white text-right focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-slate-400">/Day</span>
                  </div>
                </div>
              </div>

              {/* UPI ID Configuration */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                  Counter Payment UPI ID (Scan &amp; Pay):
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="Ex: yourname@upi ya 9876543210@paytm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500">
                  Client jab QR scan karke pay karega, payment direct is UPI ID me receive hogi.
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{savingSettings ? 'Saving...' : 'Save & Update Live Fees'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
