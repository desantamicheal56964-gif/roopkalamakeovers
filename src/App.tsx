/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Heart, 
  MessageCircle, 
  MapPin, 
  Phone, 
  Plus, 
  Check, 
  Trash2, 
  Star, 
  Maximize2, 
  X, 
  Scissors, 
  Instagram, 
  Copy, 
  ExternalLink, 
  Menu,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LUXURY_SERVICES, CLIENT_TESTIMONIALS, PORTFOLIO_ITEMS, INSTAGRAM_POSTS } from './data';
import { Service, ServiceCategory, BookingDetails } from './types';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Navigation & Category states
  const [activeTab, setActiveTab] = useState<ServiceCategory | 'all'>('all');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  
  // Showcase Lightbox State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; category: string } | null>(null);

  // Styling Details
  const whatsappNumber = '919876543210'; // Representative WhatsApp Business line for Roopkala Makeover

  // Booking Form State
  const [bookingForm, setBookingForm] = useState<BookingDetails>({
    name: '',
    phone: '',
    date: '',
    time: '',
    selectedServices: [],
    notes: '',
    bridalPackageType: 'Standard'
  });

  const [isCopied, setIsCopied] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Filter Services
  const filteredServices = useMemo(() => {
    if (activeTab === 'all') return LUXURY_SERVICES;
    return LUXURY_SERVICES.filter(service => service.category === activeTab);
  }, [activeTab]);

  // Handle adding services to package cart
  const toggleServiceInPackage = (service: Service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  const removeServiceFromPackage = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const clearPackageAndForm = () => {
    setSelectedServices([]);
    setBookingForm({
      name: '',
      phone: '',
      date: '',
      time: '',
      selectedServices: [],
      notes: '',
      bridalPackageType: 'Standard'
    });
    setBookingSuccess(false);
  };

  // Calculations for Pricing & Multi-service Discounts
  const pricingSummary = useMemo(() => {
    const subtotal = selectedServices.reduce((acc, curr) => acc + curr.price, 0);
    const hasDiscount = selectedServices.length >= 2;
    const discountAmount = hasDiscount ? Math.round(subtotal * 0.10) : 0; // 10% discount for combination packets
    const total = subtotal - discountAmount;
    
    return {
      subtotal,
      discountAmount,
      total,
      hasDiscount
    };
  }, [selectedServices]);

  // Generate beautiful pre-filled WhatsApp link text
  const formattedWhatsAppText = useMemo(() => {
    const servicesList = selectedServices.map((s, index) => `${index + 1}. ${s.name} (₹${s.price.toLocaleString('en-IN')})`).join('\n');
    const discountText = pricingSummary.hasDiscount ? `\n🎁 Package Discount (10%): -₹${pricingSummary.discountAmount.toLocaleString('en-IN')}` : '';
    
    const text = `🌸 *ROOPKALA MAKEOVER RESERVATION* 🌸

Hello Team Roopkala Makeover, I would like to book a premium beauty session with you!

✨ *Client Details*
🧑 Name: ${bookingForm.name || 'Not specified'}
📞 Contact: ${bookingForm.phone || 'Not specified'}
📅 Date Preferred: ${bookingForm.date || 'Not specified'}
⏰ Time Preferred: ${bookingForm.time || 'Not specified'}

💅 *Selected Luxury Services*
${servicesList || 'No specific service selected yet.'}
${discountText}
------------------------------
⭐ *Estimated Total: ₹${pricingSummary.total.toLocaleString('en-IN')}*

📝 *Special Requests / Notes:*
${bookingForm.notes || 'None'}

Please confirm availability of this customized session! Thank you.`;

    return encodeURIComponent(text);
  }, [selectedServices, bookingForm, pricingSummary]);

  const copyToClipboard = () => {
    const servicesList = selectedServices.map((s, index) => `${index + 1}. ${s.name} (₹${s.price.toLocaleString('en-IN')})`).join('\n');
    const discountText = pricingSummary.hasDiscount ? `\n🎁 Package Discount (10%): -₹${pricingSummary.discountAmount.toLocaleString('en-IN')}` : '';
    const cleanText = `ROOPKALA MAKEOVER RESERVATION

Client Details
Name: ${bookingForm.name || 'Not specified'}
Contact: ${bookingForm.phone || 'Not specified'}
Date Preferred: ${bookingForm.date || 'Not specified'}
Time Preferred: ${bookingForm.time || 'Not specified'}

Selected Luxury Services
${servicesList || 'No specific service selected yet.'}
${discountText}
Estimated Total: ₹${pricingSummary.total.toLocaleString('en-IN')}

Special Requests: ${bookingForm.notes || 'None'}`;

    navigator.clipboard.writeText(cleanText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setIsBookingLoading(true);

    try {
      const payload = {
        name: bookingForm.name,
        phone: bookingForm.phone,
        date: bookingForm.date,
        time: bookingForm.time,
        notes: bookingForm.notes,
        bridalPackageType: bookingForm.bridalPackageType || 'Standard',
        selectedServices: selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price
        }))
      };

      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setBookingSuccess(true);
        setSelectedServices([]);
      } else {
        setBookingError(data.error || "Failed to finalize booking request. Please speak with our coordinator.");
      }
    } catch (err) {
      setBookingError("Unable to establish connection with the database. Please try booking again.");
    } finally {
      setIsBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-stone-300 selection:bg-gold-800 selection:text-gold-200 antialiased overflow-x-hidden relative">
      <div className="mesh-bg" />

      {/* ROYAL TOP HEADER BAR */}
      <div className="bg-[#050505]/60 backdrop-blur-md text-gold-accent py-2 text-xs text-center border-b border-white/5 font-mono tracking-widest uppercase relative z-50">
        ❖ Luxurious Bridal Makeovers &amp; Hair Styling Sanctuary • Reservations Open for 2026 ❖
      </div>

      {/* MAIN NAV BAR */}
      <header className="sticky top-0 z-40 glass bg-black/40 backdrop-blur-md border-b border-white/10 rounded-none shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* BRAND LOGO */}
          <div className="flex items-center space-x-3 group">
            <div className="relative p-2.5 glass bg-white/5 rounded-lg border border-white/10">
              <Sparkles className="w-6 h-6 text-gold-accent group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-serif font-semibold tracking-wider text-gold-accent block leading-none">
                ROOPKALA <span className="accent-pink">MAKEOVER</span>
              </span>
              <span className="text-[10px] font-sans font-medium tracking-[0.25em] text-stone-400 block mt-1 uppercase text-left">
                M a k e o v e r_
              </span>
            </div>
          </div>

          {/* DESKTOP MENU LINKS */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
            <a href="#about" className="hover:text-gold-accent hover:accent-pink transition-colors duration-200">The Salon</a>
            <a href="#services" className="hover:text-gold-accent hover:accent-pink transition-colors duration-200">Services</a>
            <a href="#portfolio" className="hover:text-gold-accent hover:accent-pink transition-colors duration-200">Bridal Canvas</a>
            <a href="#testimonials" className="hover:text-gold-accent hover:accent-pink transition-colors duration-200">Reviewers</a>
            <a href="#contact" className="hover:text-gold-accent hover:accent-pink transition-colors duration-200">Sanctuary Maps</a>
          </nav>

          {/* QUICK BUTTONS */}
          <div className="flex items-center space-x-3">
            <a 
              href="#package-calculator" 
              className="px-4 py-2 text-xs font-semibold tracking-wider border border-white/15 rounded bg-white/5 hover:bg-white/10 text-gold-accent transition-all duration-300 focus:outline-none backdrop-blur-md"
            >
              Book Appointment
            </a>
            <div 
              className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded bg-white/5 border border-white/15 text-stone-300 text-xs font-mono"
              title="Message us manually on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-rose-400" />
              <span>WhatsApp: +91 98765 43210</span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO HERO HERO */}
      <section className="relative overflow-hidden pt-12 pb-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* HERO LEFT COPY */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 glass bg-white/5 border border-white/10 rounded-full text-xs text-gold-accent tracking-wider font-mono w-fit">
              <Award className="w-3.5 h-3.5 text-gold-accent" />
              <span>DELHI NCR’S PREMIER BRIDAL ICON</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none">
              Where Tradition <br className="hidden sm:inline" /> 
              Meets <span className="italic accent-gold">Modern Royalty</span>
            </h1>
            
            <p className="text-stone-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              We translate beauty into masterpieces. Indulge in India’s leading luxury bridal makeovers, signature HD airbrush cosmetics, and customized hair styling meticulously crafted for your auspicious milestones.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <a 
                href="#package-calculator"
                className="px-7 py-4 bg-gradient-to-r from-[#FF0080] to-[#E6C280] hover:opacity-90 text-white font-semibold tracking-wider rounded shadow-xl text-center transition-all duration-300 flex items-center justify-center space-x-2 animate-pulse"
              >
                <Calendar className="w-4 h-4" />
                <span>Customize Custom Package</span>
              </a>
              <a 
                href="#services"
                className="px-7 py-4 glass bg-white/5 border border-white/15 hover:bg-white/10 text-gold-accent font-medium tracking-wider rounded text-center transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Scissors className="w-4 h-4 text-rose-300" />
                <span>Explore Salon Offerings</span>
              </a>
            </div>

            {/* Micro stats banner */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10 max-w-lg font-serif">
              <div>
                <span className="block text-2xl md:text-3xl font-semibold text-gold-accent">500+</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 block">Brides Beautified</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-semibold text-gold-accent">100%</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 block">Luxury Guarantee</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-semibold text-gold-accent">4.9 ★</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 block">Sustained Reviews</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT MEDIA - Stunning Generated Background Image */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0">
            <div className="relative mx-auto max-w-[420px] lg:max-w-none rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(230,194,128,0.15)] border-2 border-white/10 group">
              <img 
                src="/src/assets/images/hero_bridal_makeup_1779467488520.png"
                alt="Roopkala Bridal Makeup Artistry"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating review card inside image */}
              <div className="absolute bottom-6 left-6 right-6 glass bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/15 text-left">
                <div className="flex items-center space-x-1 mb-1 text-gold-500">
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                </div>
                <p className="text-xs italic text-stone-200 font-sans leading-relaxed">
                  "Truly the best bridal makeup parlour in town. Unbelievable eye cosmetics &amp; hairstyle holds!"
                </p>
                <span className="text-[10px] text-gold-accent/80 font-mono tracking-widest block uppercase mt-2">
                  — Priya Malhotra (May Bride)
                </span>
              </div>
            </div>
            
            {/* Aesthetic framing decoration */}
            <div className="absolute -inset-2 border border-white/5 rounded-3xl -z-10 pointer-events-none scale-102" />
          </div>

        </div>
      </section>

      {/* BRAND PHILOSOPHY / THE SALON PROFILE */}
      <section id="about" className="py-20 bg-black/20 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Description */}
            <div className="lg:col-span-5 relative order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden border border-white/10 glass">
                <img 
                  src="/src/assets/images/salon_interior_1779467523614.png"
                  alt="Roopkala Makeover Luxury Makeup Stations"
                  className="w-full h-[320px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 glass bg-black/60 border border-white/10 px-6 py-4 rounded-xl backdrop-blur-md hidden sm:block text-left">
                <span className="font-serif text-3xl font-bold text-gold-accent block">20+</span>
                <span className="text-[10px] text-stone-300 uppercase tracking-widest">Years of Hair &amp; Skin Passion</span>
              </div>
            </div>

            {/* Right Column Copy */}
            <div className="lg:col-span-7 space-y-6 text-left order-1 lg:order-2">
              <span className="text-xs font-mono tracking-widest text-[#FF0080] uppercase block">✦ ESTABLISHED EXCELLENCE</span>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-white">The Roopkala Sanctuary</h2>
              <p className="text-stone-300 leading-relaxed text-sm sm:text-base">
                Famed for our signature aesthetic approach, Roopkala Makeover was established to fulfill a singular mission: to blend traditional Indian elegance with modern global cosmetics couture. 
              </p>
              <p className="text-stone-400 text-sm leading-relaxed">
                Step inside our dim, relaxing, and intensely luxurious dark sanctuary designed with golden ambient sconces. Here, we offer zero compromises on hygiene. We utilize only pre-sanitized professional makeup tools and authentic global cosmetics lines including Estée Lauder, MAC, Huda Beauty, Kryolan, and Charlotte Tilbury. 
              </p>

              {/* USP List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs tracking-wide">
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded glass bg-white/5 border border-white/10">
                    <Check className="w-3.5 h-3.5 text-gold-accent" />
                  </div>
                  <span>100% Genuine Branded Cosmetics Only</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded glass bg-white/5 border border-white/10">
                    <Check className="w-3.5 h-3.5 text-gold-accent" />
                  </div>
                  <span>Personalized One-on-One Pre-Consultation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded glass bg-white/5 border border-white/10">
                    <Check className="w-3.5 h-3.5 text-gold-accent" />
                  </div>
                  <span>Elite Airbrush &amp; Dermatologically Tested Bases</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded glass bg-white/5 border border-white/10">
                    <Check className="w-3.5 h-3.5 text-gold-accent" />
                  </div>
                  <span>Advanced Long-Lasting Hair Holding Armor</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE LUXURY PORTFOLIO SHOWCASE */}
      <section id="portfolio" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono tracking-[0.25em] text-[#FF0080] uppercase block">✦ PORTFOLIO CANVAS</span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#D4AF37]">The Radiant Canvas</h2>
          <p className="text-stone-400 text-sm md:text-base">
            Glimpses of real Roopkala brides and aesthetic transformations. Click on any frame to view close-ups.
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PORTFOLIO_ITEMS.map((item) => (
            <div 
              key={item.id}
              onClick={() => setLightboxImage({ url: item.image, title: item.title, category: item.category })}
              className="group cursor-pointer relative glass bg-white/5 rounded-xl overflow-hidden border border-white/15 aspect-[3/4] flex flex-col justify-end p-5 text-left project-card hover:border-gold-accent/40"
            >
              {/* Background Portfolio Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
              </div>

              {/* Card metadata floating on bottom */}
              <div className="relative z-10 space-y-2 pointer-events-none">
                <span className="inline-block px-2.5 py-0.5 bg-black/60 text-gold-accent border border-white/10 rounded text-[9px] font-mono tracking-widest uppercase">
                  {item.tag}
                </span>
                
                <h3 className="font-serif text-lg text-stone-100 group-hover:text-gold-accent transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-stone-400 text-[11px] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center text-gold-accent text-xs font-mono pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Enlarge Artwork</span>
                  <Maximize2 className="w-3.5 h-3.5 ml-1.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PORTFOLIO LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-[#000000f2] backdrop-blur-sm flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 p-2 bg-charcoal-900/60 text-stone-300 hover:text-gold-accent rounded-full border border-gold-950/20"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-charcoal-900 rounded-2xl overflow-hidden max-w-2xl w-full border border-gold-800/30 text-left p-6 space-y-4"
            >
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.title}
                className="w-full h-auto max-h-[70vh] object-cover rounded-lg border border-gold-950/20"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-mono text-gold-accent uppercase tracking-widest uppercase">{lightboxImage.category}</span>
                <h3 className="font-serif text-2xl text-stone-100 mt-1">{lightboxImage.title}</h3>
                <p className="text-stone-400 text-xs mt-2 font-mono">
                  All makeovers are crafted individually following specific bride anatomy analyses.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE LOUNGE SERVICES MENU SECTION */}
      <section id="services" className="py-20 bg-black/10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#FF0080] uppercase block">✦ ESTEEMED TREATMENT MENU</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-white">The Treatment Lounge</h2>
            <p className="text-stone-400 text-sm md:text-base">
              Bespoke beauty therapies &amp; professional cosmetics treatments meticulously cataloged. Filter below.
            </p>
          </div>

          {/* Tab Filter buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            {[
              { id: 'all', label: 'All Services' },
              { id: 'bridal', label: 'Bridal & Makeup' },
              { id: 'hair', label: 'Haute Hair Styling' },
              { id: 'skin', label: 'Skin Glow Elixirs' },
              { id: 'essentials', label: 'Luxury Essentials' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded text-xs font-semibold tracking-widest uppercase transition-all duration-300 focus:outline-none ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-[#FF0080] to-[#E6C280] text-white shadow-lg shadow-pink-500/20'
                    : 'glass bg-white/3 border border-white/10 text-stone-300 hover:text-[#FF0080] hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Services Category Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => {
                const isAlreadySelected = selectedServices.some(s => s.id === service.id);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={service.id}
                    className="glass bg-white/3 rounded-xl border border-white/10 p-6 flex flex-col justify-between text-left relative hover:border-gold-accent/30 transition-colors duration-300 shadow-md"
                  >
                    {service.popular && (
                      <span className="absolute top-4 right-4 glass bg-black/60 text-gold-accent border border-gold-400/30 rounded-full px-3 py-1 text-[9px] font-mono tracking-widest uppercase">
                        Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      {/* Price & Duration Header */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl sm:text-2xl font-serif text-gold-accent font-semibold">
                          ₹{service.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-stone-500 text-xs font-mono flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-gold-500/50" />
                          <span>{service.duration}</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg text-stone-100">{service.name}</h3>
                        <p className="text-stone-400 text-xs leading-relaxed">{service.description}</p>
                      </div>

                      {/* Service Details checklist */}
                      {service.features && (
                        <div className="space-y-1.5 pt-3 border-t border-white/10">
                          {service.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center space-x-2 text-[11px] text-stone-300">
                              <Check className="w-3 h-3 text-gold-accent flex-shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Select Button */}
                    <div className="pt-6">
                      <button
                        onClick={() => toggleServiceInPackage(service)}
                        className={`w-full py-3.5 rounded text-xs font-semibold tracking-wider transition-all duration-300 focus:outline-none flex items-center justify-center space-x-2 cursor-pointer ${
                          isAlreadySelected 
                            ? 'bg-stone-800 text-gold-accent border border-white/25'
                            : 'glass bg-white/5 hover:bg-white/10 border border-white/15 text-gold-accent'
                        }`}
                      >
                        {isAlreadySelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-gold-accent" />
                            <span>Added to Package</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Custom Package</span>
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* DYNAMIC APPOINTMENT DESK & INTUITIVE DESIGN */}
      <section id="package-calculator" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#FF0080] uppercase block">✦ ESTEEMED SERVICE SCHEDULER</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-white">Interactive Appointment Desk</h2>
            <p className="text-stone-400 text-sm md:text-base">
              Select your salon services and schedule your slot below. Submit your details to book your direct appointment instantly in our cloud database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box - Custom Booking Form */}
            <div className="lg:col-span-7 glass bg-white/3 rounded-2xl border border-white/10 p-6 md:p-8 text-left space-y-6 shadow-xl w-full">
              <h3 id="booking-section-title" className="font-serif text-xl sm:text-2xl text-[#FF0080] border-b border-white/10 pb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-rose-400" />
                <span>1. Enter Appointment Details</span>
              </h3>

              {bookingSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 py-4 text-center"
                  id="booking-success-box"
                >
                  <div className="w-16 h-16 bg-[#FF0080]/10 border border-[#FF0080]/30 rounded-full flex items-center justify-center mx-auto text-[#FF0080]" strokeWidth={1.5}>
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif text-2xl text-white">Appointment Details Logged!</h4>
                    <p className="text-stone-300 text-xs leading-relaxed max-w-md mx-auto">
                      Your schedule preferences have been recorded. We take your phone number for contacting you and providing you the right appointment route.
                    </p>
                  </div>

                  <div className="p-5 glass bg-white/5 border border-white/10 rounded-xl space-y-3 max-w-md mx-auto">
                    <span className="text-[10px] font-mono text-gold-accent uppercase tracking-widest block">✦ MESSAGE US MANUALLY</span>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Simply save and message our official coordinator on WhatsApp to finalize your booking:
                    </p>
                    <div className="font-sans text-stone-100 font-bold text-lg bg-black/40 border border-[#FF0080]/20 py-2.5 rounded select-all tracking-widest">
                      +91 98765 43210
                    </div>
                  </div>

                  <div className="flex justify-center space-x-3 pt-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-5 py-2.5 glass bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs font-semibold rounded flex items-center space-x-1.5 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Appointment Text</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setBookingSuccess(false)}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FF0080] to-[#E6C280] text-white text-xs font-semibold rounded cursor-pointer"
                    >
                      Edit Schedule
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form id="booking-scheduler-form" onSubmit={handleBookingSubmit} className="space-y-5">
                  {bookingError && (
                    <div className="p-4 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-start space-x-2.5 leading-relaxed font-sans shadow-lg animate-shake">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose-200 mb-0.5">Scheduling Constraint</p>
                        <p>{bookingError}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Phone number field is FIRST as requested */}
                  <div className="p-4 rounded-xl border border-[#FF0080]/20 bg-[#FF0080]/5 space-y-2">
                    <label className="text-[10px] font-mono tracking-widest uppercase text-stone-200 block font-semibold">
                      Your Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +91 98989 XXXXX"
                      value={bookingForm.phone}
                      onChange={e => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full glass bg-black/30 text-stone-100 border border-white/10 focus:border-[#FF0080] py-3 px-4 rounded text-xs focus:outline-none placeholder-stone-600 font-medium"
                    />
                    <p className="text-[10px] text-stone-300 leading-relaxed font-sans">
                      💡 We take your phone number for contacting you and providing you the right appointment route.
                    </p>
                  </div>

                  {/* Other fields follow below */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-stone-400">FullName <span className="text-rose-400">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Shalini Rajput"
                        value={bookingForm.name}
                        onChange={e => setBookingForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full glass bg-black/20 text-stone-200 border border-white/10 focus:border-gold-accent py-3 px-4 rounded text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Target Date <span className="text-rose-400">*</span></label>
                      <input 
                        type="date" 
                        required
                        value={bookingForm.date}
                        onChange={e => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full glass bg-black/20 text-stone-200 border border-white/10 focus:border-gold-accent py-3 px-4 rounded text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Preferred Time <span className="text-rose-400">*</span></label>
                      <input 
                        type="time" 
                        required
                        value={bookingForm.time}
                        onChange={e => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full glass bg-black/20 text-stone-200 border border-white/10 focus:border-gold-accent py-3 px-4 rounded text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Special Notes &amp; Requests</label>
                    <textarea 
                      rows={3}
                      placeholder="Provide dress color details, specific skin allergies, custom lip tone requests, or extra bridal relatives requiring grooming."
                      value={bookingForm.notes}
                      onChange={e => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full glass bg-black/20 text-stone-200 border border-white/10 focus:border-gold-accent py-3 px-4 rounded text-xs focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isBookingLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#FF0080] to-[#E6C280] hover:opacity-90 text-white font-semibold tracking-wider rounded transition-colors duration-300 flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {isBookingLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-pink-300" />
                          <span>Booking Appointment...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Book Appointment</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-stone-500 text-center mt-2.5">
                      Secure, direct database booking. Your appointment details are securely stored in Firestore and queued for confirmation.
                    </p>
                  </div>
                </form>
              )}

            </div>

            {/* Right Box - Live Invoice / Selection list */}
            <div className="lg:col-span-5 glass bg-black/40 rounded-2xl border border-white/15 p-6 text-left space-y-6 lg:sticky lg:top-24 shadow-2xl w-full">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-serif text-xl text-gold-accent">2. Custom Treatment List</h3>
                {selectedServices.length > 0 && (
                  <button 
                    onClick={clearPackageAndForm}
                    className="text-[10px] font-mono tracking-widest text-[#E2A9B1] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Added items listing */}
              {selectedServices.length === 0 ? (
                <div className="py-12 text-center text-stone-500 space-y-4">
                  <Sparkles className="w-8 h-8 text-gold-900/40 mx-auto" strokeWidth={1} />
                  <p className="text-xs">
                    Your luxury package is currently empty.<br />
                    Select treatments from the section above to initialize builder.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1.5">
                    {selectedServices.map(item => (
                      <div key={item.id} className="flex items-center justify-between glass bg-white/3 p-3 rounded border border-white/5 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-serif text-stone-100 font-medium">{item.name}</span>
                          <span className="block text-[10px] text-gold-500/80 font-mono">₹{item.price.toLocaleString('en-IN')} | {item.duration}</span>
                        </div>
                        <button 
                          onClick={() => removeServiceFromPackage(item.id)}
                          className="p-1 px-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/10 rounded cursor-pointer"
                          title="Remove from package"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Calculations and Discounts */}
                  <div className="space-y-2 pt-4 border-t border-white/10 glass bg-white/5 p-4 rounded text-xs space-y-2.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Total Pre-Discount:</span>
                      <span>₹{pricingSummary.subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {pricingSummary.hasDiscount && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Multi-Service Discount (10%):</span>
                        <span>-₹{pricingSummary.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base font-serif font-bold text-gold-accent pt-2.5 border-t border-white/10">
                      <span>Live Total:</span>
                      <span>₹{pricingSummary.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Action Bar for Copy or Share */}
                  <div className="flex space-x-2 pt-2">
                    <button 
                      onClick={copyToClipboard}
                      className="flex-1 py-2.5 glass bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs font-semibold rounded flex items-center justify-center space-x-1.5 focus:outline-none cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Structured Copy Success</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 animate-pulse" />
                          <span>Copy Appointment Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* REVIEWS & CLIENT TESTIMONIALS */}
      <section id="testimonials" className="py-20 bg-black/10 border-y border-white/5 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#FF0080] uppercase block">✦ AUDITED CLIENT STORIES</span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium text-white">Words of Our Reviewers</h2>
            <p className="text-stone-400 text-sm md:text-base">
              At Roopkala, the greatest art we compose is client happiness. Browse real feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CLIENT_TESTIMONIALS.map((t) => (
              <div 
                key={t.id}
                className="glass bg-white/3 p-6 rounded-xl border border-white/10 text-left relative flex flex-col justify-between hover:border-gold-accent/30 shadow-lg"
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex space-x-1 mb-4 text-gold-500">
                    {Array.from({ length: t.rating }).map((_, rIndex) => (
                      <Star key={rIndex} className="w-4 h-4 fill-current text-gold-accent" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-stone-300 text-sm leading-relaxed italic mb-6">
                    "{t.text}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-stone-100 font-semibold">{t.name}</span>
                    <span className="text-[9px] font-mono text-gold-accent bg-black/40 px-2 py-0.5 rounded border border-white/5 font-medium">
                      {t.badge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>{t.category}</span>
                    <span>{t.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* INSTAGRAM GALLERIES CAROUSEL */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono tracking-[0.25em] text-[#FF0080] uppercase">
            <Instagram className="w-4 h-4 text-rose-300" />
            <span>@roopkala_makeovers</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#D4AF37]">The Esthetic Feed</h2>
          <p className="text-stone-400 text-sm md:text-base">
            Behind the scenes, styling blueprints, and glowing makeovers from our digital home.
          </p>
        </div>

        {/* Instagram Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {INSTAGRAM_POSTS.map(post => (
            <div key={post.id} className="group relative rounded-xl overflow-hidden aspect-square border border-white/10 glass">
              <img 
                src={post.image} 
                alt="Instagram highlight"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay with details */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-between text-left">
                <div className="flex justify-between items-center text-xs font-mono text-gold-accent">
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <Heart className="w-4 h-4 fill-current text-rose-400" />
                    <span>{post.likes}</span>
                  </span>
                  <span>{post.daysAgo}d ago</span>
                </div>

                <p className="text-stone-300 text-xs leading-relaxed line-clamp-4 font-sans">
                  {post.caption}
                </p>

                <div className="flex items-center space-x-1 text-[11px] font-mono text-gold-accent mt-2 hover:underline cursor-pointer">
                  <span>View on Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CHANNELS OF DISPATCH / CONTACT & SANCTUARY MAPS */}
      <section id="contact" className="py-20 bg-black/20 border-t border-white/5 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          
          {/* Left Column Information */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono tracking-widest text-[#FF0080] uppercase block">✦ CHANNELS OF INQUIRY</span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-white">The Beauty Sanctuary</h2>
            
            <p className="text-stone-400 text-sm leading-relaxed">
              Plan your physical sanctuary visit. We recommend setting up bridal pre-trials at least 3 weeks prior to major ceremony dates to lock in absolute custom alignments.
            </p>

            <div className="space-y-4 pt-4 text-xs tracking-wider">
              <div className="flex items-start space-x-4">
                <div className="p-2 glass bg-white/5 rounded border border-white/10 text-gold-accent shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-semibold text-stone-200">The Salon Address</span>
                  <span className="block text-stone-400 mt-1 leading-relaxed">
                    Netaji Chawk, Near A.B Boys And Girls Highschool,<br />
                    Chalisgaon, Jalgaon - 424104
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 glass bg-white/5 rounded border border-white/10 text-gold-accent shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-semibold text-stone-200">Consultation Hours</span>
                  <span className="block text-stone-400 mt-1">
                    Everyday: 10:30 AM — 08:30 PM (Weekly Off: Tuesday)
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 glass bg-white/5 rounded border border-white/10 text-gold-accent shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-semibold text-stone-200">Contact Hotlines</span>
                  <span className="block text-stone-400 mt-1">
                    +91 98765 43210 (Landline) | +91 99999 88888 (Bridal Coordinator)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <div 
                className="px-5 py-3.5 bg-gradient-to-r from-[#FF0080] to-[#E6C280] text-white text-xs font-semibold rounded tracking-wide flex items-center justify-center space-x-2 shadow-lg select-all"
                title="Message us manually on WhatsApp!"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>WhatsApp manually: +91 98765 43210</span>
              </div>
              <a 
                href="tel:+919876543210"
                className="px-5 py-3.5 glass bg-white/5 hover:bg-white/10 border border-white/10 text-gold-accent text-xs font-semibold rounded tracking-wide transition-colors duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Concierge</span>
              </a>
            </div>
          </div>

          {/* Right Column Maps - Interactive Custom Dark Map Visualizer */}
          <div className="lg:col-span-7">
            <div className="glass bg-white/3 rounded-2xl border border-white/10 overflow-hidden shadow-2xl h-[420px] relative group flex flex-col justify-between p-6">
              
              {/* Outer map layout background simulation */}
              <div className="absolute inset-0 bg-stone-950 z-0 select-none opacity-40 pointer-events-none">
                <div className="w-full h-full opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center">
                  {/* Subtle map road lines simulation */}
                  <div className="relative w-full h-full">
                    <div className="absolute top-[20%] left-0 right-0 h-[2.5px] bg-white/20" />
                    <div className="absolute top-[60%] left-0 right-0 h-[3.5px] bg-white/20" />
                    <div className="absolute left-[30%] top-0 bottom-0 w-[2.5px] bg-white/20" />
                    <div className="absolute left-[70%] top-0 bottom-0 w-[3.5px] bg-white/20" />
                  </div>
                </div>
              </div>

              {/* Glowing anchor point marker for Roopkala */}
              <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[#FF0080]/30 border border-[#FF0080]/60 absolute inset-0 animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-[#FF0080] border-2 border-stone-950 z-20 relative shadow-[0_0_15px_#FF0080]" />
                </div>
                <div className="mt-2 glass bg-black/60 border border-white/25 px-5 py-2 rounded shadow-lg text-xs font-serif font-semibold text-gold-accent tracking-wide whitespace-nowrap">
                  ROOPKALA MAKEOVER
                </div>
              </div>

              {/* Map Footer info card */}
              <div className="relative z-10 glass bg-black/60 border border-white/10 p-4 rounded-xl mt-auto max-w-md backdrop-blur-md">
                <span className="text-[10px] font-mono text-[#FF0080] uppercase tracking-widest block mb-1">
                  ❖ GOOGLE MAPS NAVIGATION INTEGRATION
                </span>
                <p className="text-[11px] text-stone-300 leading-relaxed mb-3">
                  Located opposite the prestigious Royal Crown Banquet hall. Free secured basement valet parking available for all pre-booked bridal sessions.
                </p>
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-gold-accent font-semibold hover:underline cursor-pointer"
                >
                  <span>Launch Live GPS Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FOOTER FOOTER */}
      <footer className="bg-black/40 text-stone-500 text-xs py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="space-y-2">
            <span className="font-serif text-white hover:text-gold-accent transition-colors tracking-widest uppercase font-semibold text-sm">
              ROOPKALA MAKEOVER &copy; 2026
            </span>
            <p className="text-[11px] text-stone-400 max-w-md leading-relaxed">
              All treatment rights reserved. Roopkala is a registered brand representing elite hair styling, bridal couture, and safe cosmetic solutions in Delhi NCR.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 font-mono text-[10px]">
            <a href="#about" className="hover:text-[#FF0080] transition-colors">The Vision</a>
            <a href="#services" className="hover:text-[#FF0080] transition-colors">Sanctuary Menu</a>
            <a href="#portfolio" className="hover:text-[#FF0080] transition-colors">Bridal Canvas</a>
            <a href="#contact" className="hover:text-[#FF0080] transition-colors">Address Guidelines</a>
            <button 
              onClick={() => setIsAdminOpen(true)} 
              className="hover:text-[#FF0080] transition-colors cursor-pointer text-left bg-transparent border-none text-[10px] font-mono uppercase"
            >
              Owner Access
            </button>
          </div>

        </div>
      </footer>

      {isAdminOpen && (
        <AdminPanel 
          onClose={() => setIsAdminOpen(false)} 
          onBookingSuccess={() => {}} 
        />
      )}
    </div>
  );
}
