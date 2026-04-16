import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (custom: number) => ({
    opacity: 1, y: 0,
    transition: { delay: custom * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  })
};

const slideIn = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
    </svg>
  );
}

function SelectCard({ label, selected, onClick, className = '' }: {
  label: React.ReactNode; selected: boolean; onClick: () => void; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border rounded-xl px-4 py-3 text-sm font-medium transition-all text-left w-full
        ${selected
          ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100'
          : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-slate-50'
        } ${className}`}
    >
      {label}
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Landing() {
  const { t, language, setLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    company: '', sector: '', team_size: '',
    tools: [] as string[], other_tools: '',
    lead_flow: '', repetitive_tasks: '', bottlenecks: '',
    magic_wand: '', security: '', name: '',
    email: '', phone: '', website: '', urgency: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  const nextStep = (step: number) => {
    if (currentStep === 1 && (!formData.company || !formData.sector || !formData.team_size)) {
      alert(t('alert.fillAll')); return;
    }
    setCurrentStep(step);
    setTimeout(() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { alert(t('alert.fillNameEmail')); return; }
    setIsSubmitting(true);
    try {
      const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:3001/api/webhook/lead';
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tools: formData.tools.join(', '),
          source: 'landing_form',
          submittedAt: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(`Webhook ${response.status}`);

      try {
        await addDoc(collection(db, 'leads'), {
          ...formData, status: 'new', createdAt: serverTimestamp()
        });
      } catch { /* Firestore backup no crítico */ }

      setIsSuccess(true);
    } catch {
      try {
        await addDoc(collection(db, 'leads'), {
          ...formData, status: 'new', createdAt: serverTimestamp()
        });
        setIsSuccess(true);
      } catch {
        alert(t('alert.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email === 'arturoeldeteruel@gmail.com') navigate('/dashboardroot');
      else { alert(t('alert.denied')); auth.signOut(); }
    } catch (e) { console.error(e); }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300
        ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="w-full max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Tu <span className="text-violet-600">Socia!</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1">
              {(['es', 'en'] as const).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all
                    ${language === lang ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={handleAdminLogin}
              className="text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors hidden sm:block">
              {t('nav.admin')}
            </button>
            <a href="#formulario"
              className="bg-slate-900 text-white text-sm py-2 px-4 rounded-lg font-semibold hover:bg-violet-600 transition-colors hidden sm:inline-block">
              {t('nav.demo')}
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-50/60 via-white to-white"/>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-violet-100/40 blur-3xl"/>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-600 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"/>
            {t('hero.badge')}
          </motion.div>

          <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6">
            {t('hero.title1')}<br/>
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              {t('hero.title2')}
            </span>
          </motion.h1>

          <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            {t('hero.desc')}
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="#formulario"
              className="bg-violet-600 text-white text-sm px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5">
              {t('hero.cta')}
            </a>
            <span className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <CheckIcon/> {t('hero.sub')}
            </span>
          </motion.div>

          {/* Stats bar */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="inline-flex flex-wrap justify-center gap-8 py-5 px-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
            {[
              { num: '150+', label: 'Empresas analizadas' },
              { num: '24h',  label: 'Tiempo de respuesta' },
              { num: '5',    label: 'Tipos de agentes' },
              { num: '98%',  label: 'Satisfacción' }
            ].map(s => (
              <div key={s.num} className="text-center">
                <p className="text-2xl font-extrabold text-slate-900">{s.num}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-violet-600 mb-3">Por qué Tu Socia!</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Un agente que trabaja mientras tú duermes
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              delay: 0,
              icon: '⏱️',
              title: t('benefits.1.title'),
              desc: t('benefits.1.desc'),
              pill: 'Productividad'
            },
            {
              delay: 1,
              icon: '🔌',
              title: t('benefits.2.title'),
              desc: t('benefits.2.desc'),
              pill: 'Integraciones'
            },
            {
              delay: 2,
              icon: '🛡️',
              title: t('benefits.3.title'),
              desc: t('benefits.3.desc'),
              pill: 'Seguridad'
            }
          ].map((b, i) => (
            <motion.div key={i} custom={b.delay} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-50px' }} variants={fadeUp}
              className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all duration-300">
              <div className="text-3xl mb-5">{b.icon}</div>
              <span className="inline-block text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full mb-3">
                {b.pill}
              </span>
              <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug">{b.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-pink-500 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"/>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────── */}
      <section className="py-10 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-6">
            {t('proof.title')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {['WhatsApp', 'HubSpot', 'Salesforce', 'Idealista', 'Slack', 'Google', 'Notion'].map(brand => (
              <span key={brand} className="font-black text-base text-slate-300 hover:text-slate-500 transition-colors">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-violet-600 mb-3">El proceso</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t('how.title')}</h2>
        </div>
        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Línea conectora (solo desktop) */}
          <div className="absolute hidden md:block top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-slate-200 via-violet-300 to-slate-200"/>
          {[
            { num: 1, title: t('how.1.title'), desc: t('how.1.desc') },
            { num: 2, title: t('how.2.title'), desc: t('how.2.desc') },
            { num: 3, title: t('how.3.title'), desc: t('how.3.desc') }
          ].map(step => (
            <motion.div key={step.num} custom={step.num - 1} initial="hidden"
              whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center relative">
              <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold mx-auto mb-4 shadow-md shadow-violet-200 relative z-10">
                {step.num}
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">{step.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-violet-400 mb-2 text-center">Clientes</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-12">
            Lo que dicen nuestros primeros clientes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'En 3 días teníamos el bot respondiendo en WhatsApp. Ahora gestionamos el doble de consultas sin contratar más personal.',
                name: 'Carlos Ruiz',
                role: 'Director de Ventas',
                company: 'Grupo Inmobiliario Alfa'
              },
              {
                quote: 'Antes tardábamos 2 horas al día en hacer seguimiento de leads. El agente lo hace en tiempo real y no pierde ninguno.',
                name: 'Laura Sánchez',
                role: 'Gerente General',
                company: 'FitClub Madrid'
              },
              {
                quote: 'La integración con nuestro CRM fue sorprendentemente rápida. Sin burocracia de Meta, sin códigos complejos.',
                name: 'Marcos Torres',
                role: 'CEO',
                company: 'EcoHotel Barcelona'
              }
            ].map((t_, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-30px' }} variants={fadeUp}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <p className="text-white/70 text-sm leading-relaxed mb-5 italic">"{t_.quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t_.name}</p>
                  <p className="text-white/40 text-xs">{t_.role} · {t_.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM ────────────────────────────────────────────────────────── */}
      <section id="formulario" className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase text-violet-600 mb-3">Diagnóstico gratuito</p>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-slate-900 mb-3">
              {t('form.title1')}{' '}
              <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                {t('form.title2')}
              </span>
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
              {t('form.desc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden">
            {!isSuccess ? (
              <>
                {/* Progress */}
                <div className="px-8 pt-8 pb-0">
                  <div className="flex items-center gap-1.5 mb-8">
                    {[1, 2, 3, 4].map(step => (
                      <React.Fragment key={step}>
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500
                          ${step < currentStep ? 'bg-violet-600' : step === currentStep ? 'bg-violet-400' : 'bg-slate-100'}`}/>
                        {step < 4 && (
                          <div className={`w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-300
                            ${step < currentStep ? 'bg-violet-600' : 'bg-slate-100'}`}/>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="px-8 pb-8">
                  <AnimatePresence mode="wait">

                    {/* STEP 1 */}
                    {currentStep === 1 && (
                      <motion.div key="step1" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <p className="text-violet-600 text-xs font-bold tracking-wider uppercase mb-1.5">
                          {t('form.step1.badge')}
                        </p>
                        <h3 className="font-bold text-xl text-slate-900 mb-6">{t('form.step1.title')}</h3>
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              {t('form.step1.q1')}
                            </label>
                            <input type="text" name="company" value={formData.company}
                              onChange={handleInputChange} placeholder={t('form.step1.q1.ph')}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                              {t('form.step1.q2')}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {[
                                { id: 'inmobiliaria', label: t('form.step1.q2.opt1') },
                                { id: 'gimnasio',     label: t('form.step1.q2.opt2') },
                                { id: 'peluqueria',   label: t('form.step1.q2.opt3') },
                                { id: 'retail',       label: t('form.step1.q2.opt4') },
                                { id: 'hosteleria',   label: t('form.step1.q2.opt5') },
                                { id: 'otro',         label: t('form.step1.q2.opt6') }
                              ].map(s => (
                                <SelectCard key={s.id} label={s.label}
                                  selected={formData.sector === s.id}
                                  onClick={() => setFormData(p => ({ ...p, sector: s.id }))}/>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                              {t('form.step1.q3')}
                            </label>
                            <div className="grid grid-cols-4 gap-2.5">
                              {['1-3', '4-10', '11-25', '25+'].map(size => (
                                <SelectCard key={size} label={<span className="text-center block font-bold">{size}</span>}
                                  selected={formData.team_size === size}
                                  onClick={() => setFormData(p => ({ ...p, team_size: size }))}/>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-8">
                          <button type="button" onClick={() => nextStep(2)}
                            className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-md shadow-violet-100">
                            {t('form.btn.next')} →
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2 */}
                    {currentStep === 2 && (
                      <motion.div key="step2" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <p className="text-violet-600 text-xs font-bold tracking-wider uppercase mb-1.5">
                          {t('form.step2.badge')}
                        </p>
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{t('form.step2.title')}</h3>
                        <p className="text-slate-500 text-sm mb-6">{t('form.step2.desc')}</p>
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                              {t('form.step2.q1')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {['WhatsApp', 'Excel / Sheets', 'CRM (HubSpot, Salesforce…)', 'Gmail / Outlook', 'Portales web', 'Slack / Teams', 'ERP / Facturación', 'RRSS', 'Software propio'].map(tool => (
                                <button key={tool} type="button" onClick={() => toggleTool(tool)}
                                  className={`border rounded-full px-3.5 py-1.5 text-sm font-medium transition-all select-none
                                    ${formData.tools.includes(tool)
                                      ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                                    }`}>
                                  {tool}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              {t('form.step2.q2')}
                            </label>
                            <input type="text" name="other_tools" value={formData.other_tools}
                              onChange={handleInputChange} placeholder={t('form.step2.q2.ph')}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              {t('form.step2.q3')}
                            </label>
                            <textarea name="lead_flow" value={formData.lead_flow}
                              onChange={handleInputChange} rows={3} placeholder={t('form.step2.q3.ph')}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all resize-y min-h-[90px]"/>
                          </div>
                        </div>
                        <div className="flex justify-between mt-8">
                          <button type="button" onClick={() => setCurrentStep(1)}
                            className="text-slate-500 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                            ← {t('form.btn.back')}
                          </button>
                          <button type="button" onClick={() => nextStep(3)}
                            className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-md shadow-violet-100">
                            {t('form.btn.next')} →
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3 */}
                    {currentStep === 3 && (
                      <motion.div key="step3" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <p className="text-violet-600 text-xs font-bold tracking-wider uppercase mb-1.5">
                          {t('form.step3.badge')}
                        </p>
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{t('form.step3.title')}</h3>
                        <p className="text-slate-500 text-sm mb-6">{t('form.step3.desc')}</p>
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              {t('form.step3.q1')}
                            </label>
                            <textarea name="repetitive_tasks" value={formData.repetitive_tasks}
                              onChange={handleInputChange} rows={3} placeholder={t('form.step3.q1.ph')}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all resize-y min-h-[90px]"/>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              {t('form.step3.q2')}
                            </label>
                            <textarea name="bottlenecks" value={formData.bottlenecks}
                              onChange={handleInputChange} rows={3} placeholder={t('form.step3.q2.ph')}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all resize-y min-h-[90px]"/>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              {t('form.step3.q3')}
                            </label>
                            <input type="text" name="magic_wand" value={formData.magic_wand}
                              onChange={handleInputChange} placeholder={t('form.step3.q3.ph')}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                              {t('form.step3.q4')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {[
                                { id: 'estandar',  title: t('form.step3.q4.opt1.title'), desc: t('form.step3.q4.opt1.desc') },
                                { id: 'alto',      title: t('form.step3.q4.opt2.title'), desc: t('form.step3.q4.opt2.desc') },
                                { id: 'critico',   title: t('form.step3.q4.opt3.title'), desc: t('form.step3.q4.opt3.desc') },
                                { id: 'no_seguro', title: t('form.step3.q4.opt4.title'), desc: t('form.step3.q4.opt4.desc') }
                              ].map(s => (
                                <SelectCard key={s.id}
                                  selected={formData.security === s.id}
                                  onClick={() => setFormData(p => ({ ...p, security: s.id }))}
                                  label={<><strong className="block text-sm font-semibold mb-0.5">{s.title}</strong><span className="text-slate-400 text-xs">{s.desc}</span></>}/>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-8">
                          <button type="button" onClick={() => setCurrentStep(2)}
                            className="text-slate-500 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                            ← {t('form.btn.back')}
                          </button>
                          <button type="button" onClick={() => nextStep(4)}
                            className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-md shadow-violet-100">
                            {t('form.btn.last')} →
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4 */}
                    {currentStep === 4 && (
                      <motion.div key="step4" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <p className="text-violet-600 text-xs font-bold tracking-wider uppercase mb-1.5">
                          {t('form.step4.badge')}
                        </p>
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{t('form.step4.title')}</h3>
                        <p className="text-slate-500 text-sm mb-6">{t('form.step4.desc')}</p>
                        <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.step4.q1')}
                              </label>
                              <input type="text" name="name" value={formData.name}
                                onChange={handleInputChange} placeholder={t('form.step4.q1.ph')}
                                required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.step4.q2')}
                              </label>
                              <input type="email" name="email" value={formData.email}
                                onChange={handleInputChange} placeholder="tu@empresa.com"
                                required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.step4.q3')}{' '}
                                <span className="text-slate-400 font-normal text-xs">{t('form.step4.q3.opt')}</span>
                              </label>
                              <input type="text" name="phone" value={formData.phone}
                                onChange={handleInputChange} placeholder="+34 600 000 000"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.step4.q4')}{' '}
                                <span className="text-slate-400 font-normal text-xs">{t('form.step4.q3.opt')}</span>
                              </label>
                              <input type="url" name="website" value={formData.website}
                                onChange={handleInputChange} placeholder="https://tuempresa.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"/>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                              {t('form.step4.q5')}
                            </label>
                            <div className="grid grid-cols-3 gap-2.5">
                              {[
                                { id: 'asap',       label: t('form.step4.q5.opt1') },
                                { id: '1mes',       label: t('form.step4.q5.opt2') },
                                { id: 'explorando', label: t('form.step4.q5.opt3') }
                              ].map(u => (
                                <SelectCard key={u.id}
                                  label={<span className="text-center block">{u.label}</span>}
                                  selected={formData.urgency === u.id}
                                  onClick={() => setFormData(p => ({ ...p, urgency: u.id }))}/>
                              ))}
                            </div>
                          </div>

                          {/* Trust badges */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                            {['Sin compromiso', 'Respuesta en 24h', 'RGPD compliant'].map(badge => (
                              <span key={badge} className="flex items-center gap-1.5 text-xs text-slate-400">
                                <CheckIcon/> {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between mt-8">
                          <button type="button" onClick={() => setCurrentStep(3)}
                            className="text-slate-500 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                            ← {t('form.btn.back')}
                          </button>
                          <button type="submit" disabled={isSubmitting}
                            className="bg-violet-600 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200">
                            {isSubmitting ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                {t('form.btn.submitting')}
                              </span>
                            ) : t('form.btn.submit')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-8">
                <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-200">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-2xl text-slate-900 mb-2">{t('form.success.title')}</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed mb-8">
                  {t('form.success.desc')}
                </p>
                <div className="inline-flex flex-col sm:flex-row gap-3">
                  {['✓ Email de confirmación enviado', '✓ Análisis en proceso', '✓ Demo en < 48h'].map(item => (
                    <span key={item} className="text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-violet-600 text-xs mt-8 font-bold uppercase tracking-wider">
                  {t('form.success.sub')}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-900 to-violet-950 rounded-3xl p-10 sm:p-14 text-center text-white shadow-2xl">
          <h2 className="font-extrabold text-3xl sm:text-4xl mb-4 leading-tight">{t('cta.title')}</h2>
          <p className="text-white/60 mb-8 text-sm sm:text-base leading-relaxed">{t('cta.desc')}</p>
          <a href="#formulario"
            className="inline-block bg-white text-slate-900 text-sm px-7 py-3.5 rounded-xl font-bold hover:bg-violet-50 transition-colors shadow-lg">
            {t('cta.btn')}
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">Tu <span className="text-violet-600">Socia!</span></span>
            <span className="text-slate-300">©</span>
            <span>2026</span>
          </div>
          <div className="flex gap-5 text-xs">
            <span>{t('footer.location')}</span>
            <a href="mailto:hola@tusocia.es" className="hover:text-slate-600 transition-colors">
              hola@tusocia.es
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
