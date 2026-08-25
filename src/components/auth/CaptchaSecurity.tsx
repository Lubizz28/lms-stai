import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Volume2, ShieldCheck, CheckCircle2, Sliders, Hash } from 'lucide-react';

export interface CaptchaSecurityProps {
  onVerify: (isValid: boolean) => void;
  isVerified: boolean;
  error?: string | null;
}

type CaptchaMode = 'canvas' | 'slider';

export const CaptchaSecurity: React.FC<CaptchaSecurityProps> = ({
  onVerify,
  isVerified,
  error
}) => {
  const [mode, setMode] = useState<CaptchaMode>('canvas');
  const [captchaText, setCaptchaText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSliderSuccess, setIsSliderSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number>(0);

  // Generate random 5-character string (excluding easily confused chars like 0, O, I, 1, l)
  const generateRandomCode = useCallback((): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Draw distorted canvas CAPTCHA
  const drawCaptcha = useCallback((code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient with emerald / Islamic academic subtle tint
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#f0fdf4');
    bgGradient.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw background noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Draw background noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(5, 150, 105, ${0.2 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Characters with angle, color and position variations
    const colors = ['#065f46', '#047857', '#059669', '#0f766e', '#115e59'];
    const charSpacing = width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const char = code[i];
      const x = (i + 0.7) * charSpacing;
      const y = height / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() - 0.5) * 0.45; // -13 to +13 deg

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `bold ${Math.floor(22 + Math.random() * 4)}px 'Courier New', monospace, sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      // Shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Foreground strike-through line
    ctx.strokeStyle = 'rgba(4, 120, 87, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, height / 2 + (Math.random() * 10 - 5));
    ctx.lineTo(width - 10, height / 2 + (Math.random() * 10 - 5));
    ctx.stroke();
  }, []);

  // Refresh Code
  const handleRefresh = useCallback(() => {
    setIsRotating(true);
    setUserInput('');
    onVerify(false);
    const newCode = generateRandomCode();
    setCaptchaText(newCode);
    setTimeout(() => {
      drawCaptcha(newCode);
      setIsRotating(false);
    }, 150);
  }, [drawCaptcha, generateRandomCode, onVerify]);

  // Audio Playback (Accessibility TTS)
  const handleAudioSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const charsSpoken = captchaText.split('').join(' . ');
    const utterance = new SpeechSynthesisUtterance(`Kode verifikasi keamanan: ${charsSpoken}`);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize Canvas
  useEffect(() => {
    if (mode === 'canvas') {
      const code = generateRandomCode();
      setCaptchaText(code);
      // Small timeout to allow canvas element to mount
      const timer = setTimeout(() => {
        drawCaptcha(code);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mode, drawCaptcha, generateRandomCode]);

  // Validate Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setUserInput(val);
    if (val.length === 5) {
      if (val === captchaText.toUpperCase()) {
        onVerify(true);
      } else {
        onVerify(false);
      }
    } else {
      if (isVerified) onVerify(false);
    }
  };

  // Slider Mouse/Touch Handlers
  const handleDragStart = (clientX: number) => {
    if (isSliderSuccess) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || !sliderTrackRef.current || isSliderSuccess) return;
    const trackWidth = sliderTrackRef.current.clientWidth - 46; // button width 46
    const newPos = Math.max(0, Math.min(clientX - startXRef.current, trackWidth));
    setSliderPosition(newPos);

    // Complete threshold 92%
    if (newPos >= trackWidth * 0.92) {
      setSliderPosition(trackWidth);
      setIsDragging(false);
      setIsSliderSuccess(true);
      onVerify(true);
    }
  }, [isDragging, isSliderSuccess, onVerify]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!isSliderSuccess) {
      // Snap back if incomplete
      setSliderPosition(0);
      onVerify(false);
    }
  }, [isDragging, isSliderSuccess, onVerify]);

  // Global listeners for mouse move / mouse up during slider drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset slider when mode changes
  const toggleMode = (newMode: CaptchaMode) => {
    setMode(newMode);
    setUserInput('');
    setSliderPosition(0);
    setIsSliderSuccess(false);
    onVerify(false);
  };

  return (
    <div 
      className="flex flex-col gap-2 p-3 rounded-xl border transition-all"
      style={{
        backgroundColor: isVerified ? '#f0fdf4' : '#f8fafc',
        borderColor: isVerified ? '#86efac' : error ? '#fca5a5' : '#e2e8f0',
        boxShadow: isVerified ? '0 0 0 1px #86efac' : 'none'
      }}
    >
      {/* Header bar: Title & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={16} className={isVerified ? 'text-emerald-600' : 'text-slate-500'} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: isVerified ? '#065f46' : '#334155' }}>
            Verifikasi Keamanan (CAPTCHA)
          </span>
        </div>

        {/* Switch Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => toggleMode('canvas')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              mode === 'canvas' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ketik Kode Gambar"
          >
            <Hash size={11} /> Kode
          </button>
          <button
            type="button"
            onClick={() => toggleMode('slider')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              mode === 'slider' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Geser Tombol Verifikasi"
          >
            <Sliders size={11} /> Geser
          </button>
        </div>
      </div>

      {/* MODE 1: CANVAS ALPHANUMERIC CAPTCHA */}
      {mode === 'canvas' && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Canvas Box */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs flex-shrink-0">
            <canvas
              ref={canvasRef}
              width={140}
              height={40}
              className="rounded select-none cursor-pointer"
              onClick={handleRefresh}
              title="Klik gambar untuk menyegarkan kode"
              style={{ display: 'block', letterSpacing: '4px' }}
            />

            <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-1">
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="Segarkan Kode CAPTCHA"
                aria-label="Segarkan Kode CAPTCHA"
              >
                <RefreshCw size={13} className={isRotating ? 'animate-spin text-emerald-600' : ''} />
              </button>
              <button
                type="button"
                onClick={handleAudioSpeak}
                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="Dengarkan Audio Kode"
                aria-label="Dengarkan Audio Kode"
              >
                <Volume2 size={13} />
              </button>
            </div>
          </div>

          {/* Input field */}
          <div className="flex-1 w-full relative">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Ketik 5 huruf di samping"
              maxLength={5}
              autoComplete="off"
              spellCheck="false"
              className="w-full text-center sm:text-left font-mono font-bold tracking-widest text-sm px-3 py-2 rounded-lg border transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none"
              style={{
                backgroundColor: isVerified ? '#f0fdf4' : '#ffffff',
                borderColor: isVerified ? '#10b981' : userInput.length === 5 ? '#ef4444' : '#cbd5e1',
                color: isVerified ? '#065f46' : userInput.length === 5 ? '#b91c1c' : '#0f172a',
                boxShadow: isVerified ? '0 0 0 2px rgba(16,185,129,0.15)' : 'none'
              }}
            />
            {isVerified && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={16} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: INTERACTIVE TURNSTILE SLIDER */}
      {mode === 'slider' && (
        <div
          ref={sliderTrackRef}
          className="relative h-11 rounded-xl flex items-center select-none overflow-hidden transition-all"
          style={{
            backgroundColor: isSliderSuccess ? '#10b981' : '#f1f5f9',
            border: isSliderSuccess ? '1px solid #059669' : '1px solid #cbd5e1'
          }}
        >
          {/* Slider Progress Fill */}
          <div
            className="absolute left-0 top-0 bottom-0 transition-all"
            style={{
              width: `${sliderPosition + 46}px`,
              backgroundColor: isSliderSuccess ? '#10b981' : 'rgba(16, 185, 129, 0.18)'
            }}
          />

          {/* Guide label */}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold pointer-events-none transition-opacity"
            style={{
              color: isSliderSuccess ? '#ffffff' : '#64748b',
              opacity: isDragging ? 0.4 : 1
            }}
          >
            {isSliderSuccess ? (
              <span className="flex items-center gap-1.5 text-white drop-shadow-xs">
                <CheckCircle2 size={16} /> Terverifikasi Aman
              </span>
            ) : (
              'Geser tombol ke kanan »'
            )}
          </div>

          {/* Draggable Handle */}
          <div
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) handleDragStart(e.touches[0].clientX);
            }}
            className="absolute top-1 bottom-1 w-10 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-shadow"
            style={{
              left: `${sliderPosition + 3}px`,
              backgroundColor: isSliderSuccess ? '#ffffff' : '#059669',
              color: isSliderSuccess ? '#059669' : '#ffffff',
              transition: isDragging ? 'none' : 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {isSliderSuccess ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>
        </div>
      )}

      {/* Verification status label or Error */}
      <div className="flex items-center justify-between text-[11px]">
        {error ? (
          <span className="text-rose-600 font-medium">{error}</span>
        ) : isVerified ? (
          <span className="text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> Verifikasi pengguna terkonfirmasi
          </span>
        ) : (
          <span className="text-slate-500">
            {mode === 'canvas' ? 'Masukkan kode di atas untuk membuktikan Anda bukan robot.' : 'Geser penggeser hingga ujung kanan untuk verifikasi.'}
          </span>
        )}
      </div>
    </div>
  );
};

export default CaptchaSecurity;
