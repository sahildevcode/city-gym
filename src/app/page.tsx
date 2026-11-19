'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Dumbbell, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  Flame, 
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { gsap } from 'gsap';
import { GymSettings } from '@/lib/settings';

export default function MemberRegistrationPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Settings from Admin (Live dynamic pricing & QR image)
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  
  // Date selection
  const [startDate, setStartDate] = useState('');
  
  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState<string>('1m');
  const [customDays, setCustomDays] = useState<number>(1);
  const [isCustomPlan, setIsCustomPlan] = useState<boolean>(false);

  // Payment states
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredMember, setRegisteredMember] = useState<any>(null);

  // Fetch Admin Settings
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data);
          if (data.data.plans && data.data.plans.length > 0) {
            setSelectedPlanId(data.data.plans[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSettings(false));

    // GSAP Entrance
    const ctx = gsap.context(() => {
      gsap.from('.gsap-header', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('.gsap-hero', { scale: 0.95, opacity: 0, duration: 0.9, delay: 0.2, ease: 'back.out(1.4)' });
      gsap.from('.gsap-section', { y: 25, opacity: 0, duration: 0.7, stagger: 0.15, delay: 0.35, ease: 'power2.out' });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate on step change
  useEffect(() => {
    if (step === 'payment' || step === 'success') {
      gsap.fromTo('.gsap-step-view', 
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [step]);

  // Pricing & duration calculation based on Admin dynamic settings
  const currentPlans = settings?.plans || [];
  const customRate = settings?.customDayRate || 50;
  const currentPlan = currentPlans.find(p => p.id === selectedPlanId) || currentPlans[0];

  let durationDays = 30;
  let durationMonths = 1;
  let totalAmount = 1000;

  if (isCustomPlan) {
    durationDays = Math.max(1, Number(customDays) || 1);
    durationMonths = Math.round((durationDays / 30) * 10) / 10;
    totalAmount = durationDays * customRate;
  } else if (currentPlan) {
    durationDays = currentPlan.days;
    durationMonths = currentPlan.months;
    totalAmount = currentPlan.price;
  }

  // End Date calculation
  let calculatedEndDate = '';
  if (startDate) {
    const startObj = new Date(startDate);
    const endObj = new Date(startObj);
    endObj.setDate(startObj.getDate() + durationDays);
    calculatedEndDate = endObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Kripya apna naam enter karein!');
    if (!phone.trim() || phone.length < 10) return alert('Kripya valid 10-digit mobile number daalein!');
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeUpiId = settings?.upiId || 'citygym@upi';
  const activeMerchant = settings?.merchantName || 'City Gym Fitness Club';
  const upiUri = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeMerchant)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`CityGym-${name.substring(0, 10)}`)}`;

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        phone,
        age,
        weight,
        startDate,
        durationDays,
        durationMonths,
        amount: totalAmount,
        utrNumber: utrNumber.trim() || 'Paid-Via-QR',
        wantsDiet: false
      };

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setRegisteredMember(result.data);
        setStep('success');
      } else {
        alert('Registration failed: ' + result.error);
      }
    } catch {
      alert('Error occurred while registering. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background Decorative Glow Blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="gsap-header border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 neon-glow">
                <Dumbbell className="w-5 h-5 stroke-[2.8]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-widest uppercase text-white font-['Cabinet_Grotesk',sans-serif]">
                  {settings?.gymName || 'CITY GYM'}
                </span>
                <span className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                  CLUB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Scan &amp; Instant Onboard</p>
            </div>
          </div>

          <a 
            href="/admin" 
            className="group text-xs text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 rounded-xl px-3 py-1.5 bg-slate-900/80 backdrop-blur flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Admin</span>
          </a>
        </div>
      </header>

      {/* Main Content Form Area */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-20">

        {/* ================= STEP 1: ULTRA-MODERN REGISTRATION ================= */}
        {step === 'form' && (
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            
            {/* Hero Banner */}
            <div className="gsap-hero relative overflow-hidden rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-950 shadow-2xl">
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      ⚡ Instant Pass
                    </span>
                  </div>
                  <h2 className="text-base font-black text-white mt-1">
                    Membership Registration
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Apna naam &amp; mobile daalein, plan chunein aur direct UPI scan se start karein!
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Member Personal Details */}
            <div className="gsap-section glass-panel rounded-3xl p-4.5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" /> Member Details
                </h3>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md">
                  Step 1 of 2
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Aapka Pura Naam (Full Name) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vikram Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition shadow-inner"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  WhatsApp / Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 text-sm font-bold tracking-wider">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-14 pr-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  📲 Expiry alert aur gym updates isi number par aayenge.
                </p>
              </div>

              {/* Dual Input: Age & Weight */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Age (Umar)</label>
                  <input
                    type="number"
                    placeholder="23 Yrs"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Weight (Vazan KG)</label>
                  <input
                    type="number"
                    placeholder="70 KG"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Membership Duration & Auto Date */}
            <div className="gsap-section glass-panel rounded-3xl p-4.5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" /> Membership Schedule
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Auto Current Date
                </span>
              </div>

              {/* Joining Date Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Joining Date (Shuruwaat)
                  </label>
                  <span className="text-[10px] text-slate-400">Date aage peeche kar sakte hain</span>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition shadow-inner [color-scheme:dark]"
                />
              </div>

              {/* Plans List */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-2">
                  Select Membership Duration:
                </label>
                
                <div className="space-y-2.5">
                  {currentPlans.map((p) => {
                    const isSelected = !isCustomPlan && selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          setIsCustomPlan(false);
                        }}
                        className={`cursor-pointer rounded-2xl p-3.5 border transition-all relative flex items-center justify-between ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                              {p.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.days} Din ({p.months} Month{p.months > 1 ? 's' : ''})
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-white">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Duration (Supports 1 Day, 2 Days, 3 Days) */}
                <div className="mt-3">
                  <div
                    onClick={() => setIsCustomPlan(!isCustomPlan)}
                    className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-all ${
                      isCustomPlan
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isCustomPlan ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`}>
                        {isCustomPlan && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                      </div>
                      <span className="font-semibold text-slate-200">Custom Duration (1 Din, 2 Din ya Manpasand)</span>
                    </div>
                    <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md">
                      ₹{customRate}/Day
                    </span>
                  </div>

                  {isCustomPlan && (
                    <div className="mt-2.5 p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px]">Kitne Din Chahiye? (Starting from 1 day):</span>
                        <span className="text-slate-200 font-semibold">{customDays} Day{customDays > 1 ? 's' : ''} Membership</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={customDays}
                          onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value)))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-center text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs font-bold text-white whitespace-nowrap">
                          = ₹{(customDays * customRate).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* End Date Preview Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-inner">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Membership Valid Till:
                </span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  {calculatedEndDate || 'Calculating...'}
                </span>
              </div>
            </div>

            {/* Bottom Floating CTA Button */}
            <div className="pt-2 sticky bottom-4 z-40">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm py-4 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/40 active:scale-[0.98] transition-all"
              >
                <span>Proceed to Pay ₹{totalAmount.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.8]" />
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                🔒 Safe &amp; Direct Counter UPI Payment at City Gym
              </p>
            </div>
          </form>
        )}

        {/* ================= STEP 2: DYNAMIC / ADMIN UPLOADED QR SCREEN ================= */}
        {step === 'payment' && (
          <div className="gsap-step-view space-y-4">
            
            {/* Payment Top Summary */}
            <div className="glass-panel rounded-3xl p-4.5 border border-amber-500/30 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Member Onboarding</span>
                  <h3 className="font-black text-white text-base">{name}</h3>
                  <p className="text-xs text-slate-400 font-mono">+91 {phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Amount</span>
                  <p className="text-2xl font-black text-amber-400">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between text-xs text-slate-300">
                <span>Valid: {startDate} se {calculatedEndDate}</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg font-bold">{durationDays} Days</span>
              </div>
            </div>

            {/* QR Code Card - Shows Admin Uploaded QR or Auto Generated QR */}
            <div className="glass-panel rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-slate-800 relative">
              <div>
                <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 rounded-full shadow-md">
                  SCAN ANY UPI APP
                </span>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  Google Pay, PhonePe, Paytm ya Cred se scan karke payment karein
                </p>
              </div>

              {/* QR Container */}
              <div className="inline-block p-4.5 bg-white rounded-3xl shadow-2xl mx-auto border-4 border-amber-500/20 overflow-hidden">
                {settings?.qrImageUrl ? (
                  // Admin Uploaded Exact QR Image
                  <img
                    src={settings.qrImageUrl}
                    alt="City Gym Payment QR"
                    className="w-[210px] h-[210px] object-contain rounded-2xl mx-auto"
                  />
                ) : (
                  // Fallback Vector QR SVG
                  <QRCodeSVG
                    value={upiUri}
                    size={210}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>

              {/* UPI ID Copy Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between max-w-xs mx-auto shadow-inner">
                <div className="text-left pl-2">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Direct UPI ID:</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{activeUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1.5 transition shadow"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Direct UPI Intent Button for Mobile */}
              <a
                href={upiUri}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <span>PhonePe / GPay App me Direct Open Karein</span>
              </a>
            </div>

            {/* Optional UTR Input */}
            <div className="glass-panel rounded-3xl p-4 space-y-2.5">
              <label className="text-xs text-slate-300 block font-semibold">
                Payment ke baad UTR / Transaction No. daalein (Optional):
              </label>
              <input
                type="text"
                placeholder="Ex: 403928192831 ya Done"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition shadow-inner"
              />
            </div>

            {/* Action CTA */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.8]" />
                <span>{isSubmitting ? 'Verifying & Saving...' : 'Maine Payment Kar Diya (Done)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-xs text-slate-400 hover:text-white py-2 text-center transition font-semibold"
              >
                &larr; Details ya Plan Badlein
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS & DIGITAL SLIP ================= */}
        {step === 'success' && registeredMember && (
          <div className="gsap-step-view space-y-4">
            
            {/* Success Card */}
            <div className="glass-panel border border-emerald-500/40 rounded-3xl p-6 text-center space-y-3.5 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 stroke-[2.8]" />
              </div>
              
              <h2 className="text-xl font-black text-white">
                Swagat Hai, {registeredMember.name}!
              </h2>
              <p className="text-xs text-slate-300">
                Aapka registration City Gym me safaltapoorvak ho gaya hai.
              </p>

              {/* Digital Slip */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-300 shadow-inner">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Member ID:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{registeredMember.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid From:</span>
                  <span className="font-medium text-white">{registeredMember.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="text-emerald-400 font-bold">{registeredMember.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid Amount:</span>
                  <span className="font-black text-white">₹{registeredMember.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Approval Status:</span>
                  <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Admin Approval Pending
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setName('');
                setPhone('');
                setAge('');
                setWeight('');
                setUtrNumber('');
                setStep('form');
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3.5 rounded-2xl transition"
            >
              + Naya Member Register Karein
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
