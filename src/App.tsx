/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Pencil, Sparkles, Phone, User, Calendar, MessageSquare, Info, ShieldCheck, Camera } from 'lucide-react';

// --- Types ---
interface HealthAssessment {
  id: string;
  title: string;
  description: string;
}

const HEALTH_QUESTIONS: HealthAssessment[] = [
  { id: 'coagulation', title: '嚴重凝血功能障礙', description: '天生不易止血，或正服用抗凝血劑等。' },
  { id: 'infection', title: '法定傳染性疾病', description: '如 B/C 型肝炎、愛滋病、梅毒等。' },
  { id: 'heart', title: '嚴重心臟病與高血壓', description: '施作之緊張感可能引發身體不適。' },
  { id: 'immune', title: '自體免疫系統疾病', description: '如紅斑性狼瘡，或目前接受重大理療。' },
  { id: 'keloid', title: '蟹足腫體質', description: '傷口極易產生凸起疤痕或異常色素沉澱。' },
  { id: 'skin', title: '皮膚狀況不穩', description: '施作部位有未癒合傷口、痘痘或濕疹。' },
  { id: 'g6pd', title: '蠶豆症 (G6PD)', description: '部分外用舒緩品可能引發嚴重不適。' },
  { id: 'diabetes', title: '糖尿病患者', description: '傷口癒合極慢與發炎風險較高。' },
  { id: 'medication', title: '特定藥物使用者', description: '正長期服用 A酸、類固醇或精神科藥物。' },
  { id: 'medical_beauty', title: '近期醫美行為', description: '半年內曾於臉部施作雷射、微整或煥膚。' },
  { id: 'pregnancy', title: '懷孕期間', description: '易引發宮縮且極易不上色，隱瞞需自負全責。' },
  { id: 'pregnancy_lactation', title: '備孕或哺乳期', description: '賀爾蒙變化易致留色差；輔助品微量影響。' },
  { id: 'period', title: '生理期', description: '體質敏感，痛感可能稍增且留色受影響。' },
  { id: 'none', title: '以上皆無 (None)', description: '身體狀況良好，無上述任何情形。' },
];

export default function App() {
  // --- State ---
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    phone: '',
    lineId: '',
    services: {
      brows: false,
      lips: false
    },
    health: {} as Record<string, boolean>,
    otherHealth: '',
    photoConsent: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [currentWarningItem, setCurrentWarningItem] = useState<{title: string, description: string} | null>(null);
  const [periodDay, setPeriodDay] = useState<number | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; icon: React.ReactNode } | null>(null);

  // --- Canvas Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasSignature = useRef(false);

  // --- Handlers ---
  const toggleService = (service: 'brows' | 'lips') => {
    setFormData(prev => ({
      ...prev,
      services: { ...prev.services, [service]: !prev.services[service] }
    }));
  };

  const toggleHealth = (id: string) => {
    if (id === 'period') {
      setIsPeriodModalOpen(true);
    } else if (id !== 'none' && id !== 'pregnancy_lactation') {
      const item = HEALTH_QUESTIONS.find(q => q.id === id);
      if (item) {
        setCurrentWarningItem(item);
        setIsWarningModalOpen(true);
      }
    }
    
    setFormData(prev => {
      const newHealth = { ...prev.health, [id]: !prev.health[id] };
      
      if (id === 'none') {
        if (newHealth[id]) {
          // If "None" is checked, uncheck everything else
          Object.keys(newHealth).forEach(key => {
            if (key !== 'none') newHealth[key] = false;
          });
        }
      } else {
        if (newHealth[id]) {
          // If any other option is checked, uncheck "None"
          newHealth['none'] = false;
        }
      }

      return {
        ...prev,
        health: newHealth
      };
    });
  };

  const showToast = (msg: string, icon: React.ReactNode) => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    hasSignature.current = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature.current = false;
  };

  const saveSignature = () => {
    if (!hasSignature.current) {
        showToast('請在畫布上簽名', <Pencil className="w-4 h-4" />);
        return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
      setIsModalOpen(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showToast('請填寫顧客姓名', <User className="w-4 h-4" />);
      return;
    }
    if (!formData.phone.trim()) {
      showToast('請填寫聯絡手機', <Phone className="w-4 h-4" />);
      return;
    }
    if (!formData.services.brows && !formData.services.lips) {
      showToast('請選擇至少一項施作項目', <Sparkles className="w-4 h-4" />);
      return;
    }
    if (!signature) {
      showToast('尚未完成電子簽署', <Pencil className="w-4 h-4" />);
      return;
    }
    showToast('同意書建檔完成', <ShieldCheck className="w-4 h-4" />);
  };

  // --- Effects ---
  useEffect(() => {
    if (isModalOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#2B2927';
        }
      }
    }
  }, [isModalOpen]);

  return (
    <div className="min-h-screen p-4 md:p-12 selection:bg-[#A39180] selection:text-white">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100 relative">
        
        {/* Header */}
        <div className="gradient-bg pt-16 pb-12 px-10 text-center border-b gold-border relative">
          <h1 className="brand-font text-5xl md:text-6xl tracking-[0.2em] text-[#33312E] mb-2 uppercase">TIAN ÉCLAT</h1>
          <h2 className="serif text-2xl font-light tracking-[0.8em] accent-color mt-4 ml-[0.8em]">恬 光</h2>
          <div className="w-12 h-[1px] bg-[#d4c5b9] mx-auto mt-8 mb-6"></div>
          <div className="text-[11px] text-gray-400 tracking-[0.3em] uppercase italic brand-font">Professional Consent Form</div>
          <div className="text-[12px] text-gray-500 tracking-widest serif mt-2 opacity-80">高訂美學 ‧ 專業定妝服務同意書</div>
        </div>

        <div className="p-8 md:p-14 space-y-14">
          
          {/* Client Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="relative group">
              <label className="block text-[10px] text-gray-400 mb-2 uppercase tracking-widest brand-font flex items-center gap-2">
                 <User className="w-3 h-3" /> Name / 顧客姓名
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border-b border-gray-200 py-2 focus:border-[#A39180] outline-none transition-colors bg-transparent text-base text-gray-800" 
                placeholder="請輸入全名" 
              />
            </div>
            <div className="relative group">
              <label className="block text-[10px] text-gray-400 mb-2 uppercase tracking-widest brand-font flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Date / 施作日期
              </label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full border-b border-gray-200 py-2 focus:border-[#A39180] outline-none transition-colors bg-transparent text-base text-gray-800" 
              />
            </div>
            <div className="relative group">
              <label className="block text-[10px] text-gray-400 mb-2 uppercase tracking-widest brand-font flex items-center gap-2">
                <Phone className="w-3 h-3" /> Mobile / 手機號碼
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border-b border-gray-200 py-2 focus:border-[#A39180] outline-none transition-colors bg-transparent text-base text-gray-800" 
                placeholder="09XX-XXX-XXX" 
              />
            </div>
            <div className="relative group">
              <label className="block text-[10px] text-gray-400 mb-2 uppercase tracking-widest brand-font flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Line ID / 通訊軟體
              </label>
              <input 
                type="text" 
                value={formData.lineId}
                onChange={(e) => setFormData(prev => ({ ...prev, lineId: e.target.value }))}
                className="w-full border-b border-gray-200 py-2 focus:border-[#A39180] outline-none transition-colors bg-transparent text-base text-gray-800" 
                placeholder="選填" 
              />
            </div>
          </section>

          {/* Service Selection */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
              <h3 className="text-sm serif text-gray-500 tracking-widest">本次施作項目</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <button 
                onClick={() => toggleService('brows')}
                className={`py-4 rounded-xl flex flex-col items-center justify-center relative transition-all border ${formData.services.brows ? 'border-[#A39180] bg-[#fffaf5]' : 'border-[#f0e8e1] bg-gray-50/50 hover:bg-gray-50'}`}
              >
                <span className={`serif text-[15px] tracking-[0.2em] transition-colors ${formData.services.brows ? 'text-[#A39180] font-medium' : 'text-gray-500'}`}>霧眉</span>
                <AnimatePresence>
                  {formData.services.brows && (
                    <motion.div 
                      layoutId="indicator-brows"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-2 w-1 h-1 rounded-full bg-accent"
                    />
                  )}
                </AnimatePresence>
              </button>
              <button 
                onClick={() => toggleService('lips')}
                className={`py-4 rounded-xl flex flex-col items-center justify-center relative transition-all border ${formData.services.lips ? 'border-[#A39180] bg-[#fffaf5]' : 'border-[#f0e8e1] bg-gray-50/50 hover:bg-gray-50'}`}
              >
                <span className={`serif text-[15px] tracking-[0.2em] transition-colors ${formData.services.lips ? 'text-[#A39180] font-medium' : 'text-gray-500'}`}>霧唇</span>
                <AnimatePresence>
                  {formData.services.lips && (
                    <motion.div 
                      layoutId="indicator-lips"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-2 w-1 h-1 rounded-full bg-accent"
                    />
                  )}
                </AnimatePresence>
              </button>
            </div>
          </section>

          {/* 01. Health Assessment */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-[13px] brand-font italic">01</span>
              <h3 className="text-xl serif accent-color tracking-widest">生理狀況與安全評估</h3>
            </div>
            
            <div className="bg-[#Fdfaf8] p-8 md:p-10 rounded-3xl border border-[#f0e8e1]">
              <p className="text-[13.5px] text-gray-600 mb-8 serif tracking-wide">
                為維護您的安全與術後效果，請務必誠實選取：
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-[13.5px] text-gray-700 font-light">
                {HEALTH_QUESTIONS.map(q => {
                  // 根據 ID 決定選中時的文字顏色
                  let activeText = "text-[#A39180]";

                  if (q.id === 'period') {
                    activeText = "text-rose-500";
                  } else if (q.id !== 'none' && q.id !== 'pregnancy_lactation') {
                    activeText = "text-amber-600";
                  }

                  return (
                    <button 
                      key={q.id}
                      onClick={() => toggleHealth(q.id)}
                      className="flex items-start gap-4 text-left group"
                    >
                      <div className={`w-5 h-5 mt-0.5 rounded border transition-all flex items-center justify-center shrink-0 ${
                        formData.health[q.id] ? 'bg-accent border-accent' : 'border-[#d4c5b9] bg-white group-hover:border-[#A39180]'
                      }`}>
                        <Check className={`w-3.5 h-3.5 text-white transition-opacity ${formData.health[q.id] ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                      </div>
                      <div className="leading-relaxed">
                        <strong className={`font-medium block mb-0.5 transition-colors ${
                          formData.health[q.id] ? activeText : 'text-gray-800'
                        }`}>{q.title}</strong>
                        <span className="text-[12px] text-gray-500 block">{q.description}</span>
                      </div>
                    </button>
                  );
                })}
                
                <div className="flex items-start gap-4 md:col-span-2 mt-2">
                   <div className="w-5 h-5 mt-0.5 shrink-0" />
                   <div className="w-full flex items-center border-b border-gray-300 pb-1 focus-within:border-[#A39180] transition-colors">
                     <span className="font-medium text-gray-800 mr-3 text-[14px] whitespace-nowrap">其他 (Other)</span>
                     <input 
                       type="text" 
                       value={formData.otherHealth}
                       onChange={(e) => setFormData(prev => ({ ...prev, otherHealth: e.target.value }))}
                       placeholder="有未列出之特殊生理狀況或用藥，請於此處填寫告知..." 
                       className="w-full bg-transparent border-none text-[13px] text-gray-700 focus:outline-none placeholder:text-gray-400 placeholder:font-light" 
                     />
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* 02. Professional Disclaimer */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-[13px] brand-font italic">02</span>
              <h3 className="text-xl serif accent-color tracking-widest">美感設計與不對稱聲明</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 text-[13.5px] leading-loose text-gray-600 font-light">
              <div className="term-box p-8 rounded-3xl">
                <h4 className="font-medium text-gray-800 mb-2 tracking-widest serif text-[14.5px] flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-accent" /> 骨骼與肌肉之自然落差
                </h4>
                <p>人體左右臉之骨骼高低、毛流走向及做表情時的肌肉牽扯，皆<span className="font-medium text-gray-800">不可能達到 100% 絕對對稱</span>。我們將依循專業美感盡力達到「視覺和諧」，若為追求絕對對稱之完美主義者，請審慎評估。</p>
              </div>
              <div className="term-box p-8 rounded-3xl">
                <h4 className="font-medium text-gray-800 mb-2 tracking-widest serif text-[14.5px] flex items-center gap-2">
                   <Info className="w-4 h-4 text-accent" /> 設計定案與主觀意識
                </h4>
                <p>正式施作前，定會與您進行輪廓設計溝通。<span className="text-[#8c5a5a] font-medium">一旦確認外型設計並開始操作，即表示雙方達成共識。</span>完成後恕不接受以「與想像不符、親友覺得不適合」等主觀理由要求退費或無償修改。</p>
              </div>
            </div>
          </section>

          {/* 03. Metabolism & Retention */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-[13px] brand-font italic">03</span>
              <h3 className="text-xl serif accent-color tracking-widest">留色差異與過渡期認知</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 text-[13.5px] leading-loose text-gray-600 font-light">
              <div className="term-box p-8 rounded-3xl">
                <h4 className="font-medium text-gray-800 mb-2 tracking-widest serif text-[14.5px]">個體膚質差異與修護期</h4>
                <p>半永久定妝留色率深受個人膚質與生活作息影響。施作後結痂與脫痂屬正常生理機制。脫痂時切勿摳抓，期間顏色變淡、斑駁為必經之反色期，<span className="font-medium text-gray-800">需待約 28 天皮膚代謝週期完成後，方呈現最終色澤</span>。</p>
              </div>
              <div className="term-box p-8 rounded-3xl">
                <h4 className="font-medium text-gray-800 mb-2 tracking-widest serif text-[14.5px]">二次補色之必要性</h4>
                <p>半永久為「漸進式定妝」，首次施作著重建立底層基礎。若需完美定色，建議於修護期滿安排二次加強。<span className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-4">二次補色屬獨立服務項目，依公告規範收費</span>。</p>
              </div>
            </div>
          </section>

          {/* 04. Refund Policy & Liability */}
          <section className="bg-[#2B2927] text-[#E8E6E3] p-10 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A39180] rounded-full mix-blend-overlay filter blur-[80px] opacity-20"></div>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <span className="bg-white/10 text-white w-8 h-8 rounded-full flex items-center justify-center text-[13px] brand-font italic border border-white/20">04</span>
              <h3 className="text-xl serif text-white tracking-widest">責任歸屬與免責聲明</h3>
            </div>
            
            <div className="space-y-8 text-[13.5px] font-light leading-loose opacity-90 relative z-10">
              <div>
                <h4 className="text-white font-medium tracking-widest mb-1 serif text-[14.5px]">隱匿體質與照護疏失免責</h4>
                <p>您同意嚴格遵守本工作室提供之「居家修護指南」。若因未妥善照護，或刻意隱瞞上述傳染性/過敏/懷孕等體質，導致發炎、脫色或敏弱反應，<span className="text-white font-medium">您須自行承擔相關後果，工作室不承擔任何醫療衍生費用與賠償義務</span>。</p>
              </div>
              <div>
                <h4 className="text-white font-medium tracking-widest mb-1 serif text-[14.5px]">勞務不可退條款</h4>
                <p>半永久紋繡為高度客製化之技術勞務。基於不可逆之特質，<span className="text-white font-medium">本服務一旦完成，恕不接受任何理由（包含主觀審美差異）之全額或部分退費申請</span>。</p>
              </div>
            </div>
          </section>

          {/* Photo Consent */}
          <section className="bg-[#fcf9f5] rounded-3xl p-8 md:p-10 border border-[#f0e8e1] text-center">
            <h4 className="serif text-[16px] text-gray-800 tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4 text-accent" /> 美學靈感授權
            </h4>
            <p className="text-[13px] text-gray-500 font-light leading-relaxed mb-6 max-w-xl mx-auto">
              每一件宛若天生的作品，都是恬光珍視的藝術。<br />
              為完整追蹤您的肌膚狀況與後續留色，我們將進行影像建檔。<br />
              我們誠摯邀請，將這份專屬您的質感蛻變，作為品牌社群之美學分享。
            </p>

            <button 
              onClick={() => setFormData(prev => ({ ...prev, photoConsent: !prev.photoConsent }))}
              className="inline-flex items-center gap-3 cursor-pointer group mb-4"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.photoConsent ? 'bg-accent border-accent' : 'border-[#d4c5b9] bg-white group-hover:border-[#A39180]'}`}>
                  <Check className={`w-3.5 h-3.5 text-white transition-opacity ${formData.photoConsent ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
              </div>
              <span className="text-[14px] text-gray-800 tracking-wide font-medium serif group-hover:text-black transition-colors">
                我願意成為恬光的美學靈感
              </span>
            </button>

            <p className="text-[11px] text-gray-400 font-light tracking-wide opacity-80">
              * 若您傾向保留私人空間，或僅限局部露出，請溫柔告知，我們將絕對尊重。
            </p>
          </section>

          {/* Signature Area */}
          <section className="pt-6 border-t border-gray-100">
            <div className="text-center mb-8">
              <h4 className="brand-font text-[12px] tracking-[0.4em] text-gray-400 uppercase mb-2">Electronic Signature</h4>
              <p className="text-[14px] text-gray-800 tracking-widest font-medium serif">電子簽署確認</p>
              <p className="text-[12px] text-gray-500 mt-2 font-light">本人已年滿十八歲，經由詳細解說，已充分理解並同意上述所有條款。</p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full h-48 bg-[#fdfaf7] rounded-[2rem] border border-dashed border-[#d4c5b9] flex items-center justify-center cursor-pointer hover:border-[#A39180] transition-all group overflow-hidden relative"
            >
              {signature ? (
                <div className="w-full h-full p-6 flex items-center justify-center bg-white">
                  <img src={signature} alt="Signature" className="max-h-full max-w-full mix-blend-multiply" />
                  <div className="absolute top-4 right-4 bg-[#A39180] text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 group-hover:text-[#A39180] text-center transition-colors">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 group-hover:border-[#A39180] transition-all">
                    <Pencil className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] tracking-[0.3em] uppercase font-medium brand-font">Tap to Sign / 點擊簽名</span>
                </div>
              )}
            </button>
          </section>

          {/* Submit Button */}
          <div className="pt-6">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} 
              className="w-full bg-[#33312E] hover:bg-black text-white py-5 rounded-full font-light tracking-widest shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center group"
            >
              <span className="brand-font text-[13px] tracking-[0.4em] uppercase mb-1 flex items-center gap-2">
                Confirm & Submit <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
              </span>
              <span className="serif text-[11px] opacity-70">確認送出同意書</span>
            </motion.button>
          </div>
        </div>

        <footer className="p-12 bg-[#fdfaf7] text-center border-t border-gray-100 mt-20">
          <div className="brand-font text-[15px] text-[#33312E] tracking-[0.4em] mb-2">TIAN ÉCLAT <span className="font-light italic text-gray-400">Atelier</span></div>
          <div className="text-[9px] text-gray-400 tracking-[0.5em] uppercase font-light brand-font">Esthetic Artistry</div>
        </footer>
      </div>

      {/* Full-Screen Signature Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex justify-center items-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100">
                <div className="flex flex-col">
                  <span className="brand-font text-[10px] tracking-[0.3em] text-gray-400 uppercase">Signature Area</span>
                  <span className="text-[15px] serif text-gray-800 mt-1 tracking-widest font-medium">請於下方空白處簽名</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-black transition-colors rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-grow relative bg-[#fdfaf7] h-[60vh]">
                <canvas 
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="signature-pad w-full h-full"
                />
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4 bg-white border-t border-gray-100">
                <button 
                  onClick={clearCanvas}
                  className="py-4 border border-gray-200 rounded-full text-gray-500 font-medium text-[13px] tracking-widest hover:bg-gray-50 transition-colors serif flex items-center justify-center gap-2"
                >
                  清除重寫
                </button>
                <button 
                  onClick={saveSignature}
                  className="py-4 bg-[#33312E] text-white rounded-full font-medium text-[13px] tracking-widest shadow-md hover:bg-black transition-colors serif flex items-center justify-center gap-2"
                >
                  確認完成
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Warning Modal */}
      <AnimatePresence>
        {isWarningModalOpen && currentWarningItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1050] flex justify-center items-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-[90%] max-w-md rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl p-8 md:p-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-xl serif font-medium text-gray-800 tracking-widest mb-4">專業施作警示</h3>
                <div className="text-[15px] font-medium text-[#A39180] serif mb-2">針對項目：{currentWarningItem.title}</div>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-8 px-2 font-light">
                  親愛的顧客，您的健康與安全是恬光最在乎的事。基於保護原則與專業考量，若您目前有此項狀況，<span className="text-red-500 font-medium">現階段不適合進行施作服務</span>。我們深感遺憾無法即刻為您服務，待您身體恢復至最佳狀態時，誠摯歡迎再次與我們預約這份質感蛻變。
                </p>
                
                <button 
                  onClick={() => setIsWarningModalOpen(false)}
                  className="w-full bg-[#33312E] text-white py-4 rounded-full font-medium text-[14px] tracking-widest shadow-md hover:bg-black transition-colors serif h-16 flex items-center justify-center"
                >
                  我已了解並關閉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menstrual Period Modal */}
      <AnimatePresence>
        {isPeriodModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1050] flex justify-center items-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-[90%] max-w-md rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl p-8 md:p-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <Info className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl serif font-medium text-gray-800 tracking-widest mb-4">生理期施作須知</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-8 px-2 font-light">
                  生理期皮膚敏弱。建議避開前 3 天，以確保留色率佳。
                </p>
                
                <div className="w-full mb-8">
                  <div className="text-[12px] text-gray-400 brand-font tracking-widest uppercase mb-4">目前是經期的第幾天？</div>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(day => (
                      <button
                        key={day}
                        onClick={() => setPeriodDay(day)}
                        className={`aspect-square rounded-2xl border transition-all text-[15px] flex items-center justify-center ${periodDay === day ? 'bg-[#33312E] text-white border-[#33312E] shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-accent'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full h-12 mb-8">
                  <AnimatePresence mode="wait">
                    {periodDay !== null && (
                      <motion.div 
                        key={periodDay <= 3 ? 'warning' : 'safe'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`w-full py-3 rounded-2xl text-[13px] font-medium serif overflow-hidden ${
                          periodDay <= 3 
                            ? 'bg-red-50 text-red-500' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {periodDay <= 3 ? '建議避開前 3 天' : '此天數留色率較穩定，可正常施作'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="w-full bg-[#33312E] text-white py-4 rounded-full font-medium text-[14px] tracking-widest shadow-md hover:bg-black transition-colors serif h-16 flex items-center justify-center"
                >
                  確認並關閉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 bg-[#33312E] text-white px-8 py-4 rounded-full text-[13px] tracking-widest z-[1100] shadow-2xl flex items-center border border-white/10"
          >
            <span className="mr-3 text-lg">{toast.icon}</span>
            <span className="serif font-light">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
