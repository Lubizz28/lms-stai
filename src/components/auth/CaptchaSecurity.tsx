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

  const generateRandomCode = useCallback((): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const drawCaptcha = useCallback((code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#f0fdf4');
    bgGradient.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle noise lines
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.25 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(5, 150, 105, ${0.2 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }

    // Distorted Characters
    const colors = ['#065f46', '#047857', '#059669', '#0f766e', '#115e59'];
    const charSpacing = width / (code.length + 0.8);

    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const char = code[i];
      const x = (i + 0.65) * charSpacing;
      const y = height / 2 + (Math.random() * 4 - 2);
      const angle = (Math.random() - 0.5) * 0.35;

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `bold 18px 'Courier New', monospace, sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Strike-through line
    ctx.strokeStyle = 'rgba(4, 120, 87, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(6, height / 2 + (Math.random() * 6 - 3));
    ctx.lineTo(width - 6, height / 2 + (Math.random() * 6 - 3));
    ctx.stroke();
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRotating(true);
    setUserInput('');
    onVerify(false);
    const newCode = generateRandomCode();
    setCaptchaText(newCode);
    setTimeout(() => {
      drawCaptcha(newCode);
      setIsRotating(false);
    }, 100);
  }, [drawCaptcha, generateRandomCode, onVerify]);

  const handleAudioSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const charsSpoken = captchaText.split('').join(' . ');
    const utterance = new SpeechSynthesisUtterance(`Kode verifikasi: ${charsSpoken}`);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (mode === 'canvas') {
      const code = generateRandomCode();
      setCaptchaText(code);
      const timer = setTimeout(() => {
        drawCaptcha(code);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [mode, drawCaptcha, generateRandomCode]);

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

  const handleDragStart = (clientX: number) => {
    if (isSliderSuccess) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || !sliderTrackRef.current || isSliderSuccess) return;
    const trackWidth = sliderTrackRef.current.clientWidth - 42;
    const newPos = Math.max(0, Math.min(clientX - startXRef.current, trackWidth));
    setSliderPosition(newPos);

    if (newPos >= trackWidth * 0.9) {
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
      setSliderPosition(0);
      onVerify(false);
    }
  }, [isDragging, isSliderSuccess, onVerify]);

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

  const toggleMode = (newMode: CaptchaMode) => {
    setMode(newMode);
    setUserInput('');
    setSliderPosition(0);
    setIsSliderSuccess(false);
    onVerify(false);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Top Header Row (Seamless inside form, no heavy card border) */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <ShieldCheck size={14} className={isVerified ? "text-emerald-600" : "text-gray-400"} />
          <span>Verifikasi Keamanan</span>
        </label>

        {/* Small Mode Pill */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleMode('canvas')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
              mode === 'canvas'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Hash size={10} /> Kode
          </button>
          <button
            type="button"
            onClick={() => toggleMode('slider')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
              mode === 'slider'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sliders size={10} /> Geser
          </button>
        </div>
      </div>

      {/* Mode 1: Canvas Alphanumeric in Single Clean Row */}
      {mode === 'canvas' && (
        <div className="flex items-center gap-2 w-full">
          {/* Canvas Box + Action Buttons */}
          <div className="flex items-center bg-white rounded-lg border border-gray-300 h-10 px-1 shrink-0 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={112}
              height={32}
              onClick={handleRefresh}
              title="Klik gambar untuk mengganti kode"
              className="block rounded cursor-pointer"
            />

            {/* Vertical action icons */}
            <div className="flex flex-col gap-0.5 border-l border-gray-200 pl-1 ml-1">
              <button
                type="button"
                onClick={handleRefresh}
                title="Segarkan Kode"
                className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
              >
                <RefreshCw size={11} className={isRotating ? 'animate-spin text-emerald-600' : ''} />
              </button>
              <button
                type="button"
                onClick={handleAudioSpeak}
                title="Dengarkan Audio"
                className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
              >
                <Volume2 size={11} />
              </button>
            </div>
          </div>

          {/* Left-Aligned Input Field */}
          <div className="flex-1 relative min-w-0">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="5 Kode verifikasi"
              maxLength={5}
              autoComplete="off"
              spellCheck="false"
              className={`w-full h-10 px-3 text-left font-mono font-semibold text-xs uppercase rounded-lg border outline-none transition-all ${
                isVerified
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 focus:ring-2 focus:ring-emerald-500/20'
                  : userInput.length === 5
                  ? 'border-red-400 bg-red-50/30 text-red-700'
                  : 'border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 placeholder:normal-case placeholder:font-sans focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {isVerified && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                <CheckCircle2 size={15} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Slider */}
      {mode === 'slider' && (
        <div
          ref={sliderTrackRef}
          className={`relative h-10 rounded-lg flex items-center select-none overflow-hidden border transition-all ${
            isSliderSuccess
              ? 'bg-emerald-500 border-emerald-600'
              : 'bg-slate-100 border-gray-300'
          }`}
        >
          <div
            style={{ width: `${sliderPosition + 40}px` }}
            className={`absolute left-0 top-0 bottom-0 ${
              isSliderSuccess ? 'bg-emerald-500' : 'bg-emerald-100/60'
            }`}
          />

          <div 
            className={`absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none ${
              isSliderSuccess ? 'text-white' : 'text-gray-500'
            } ${isDragging ? 'opacity-30' : 'opacity-100'}`}
          >
            {isSliderSuccess ? (
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={14} /> Terverifikasi Aman
              </span>
            ) : (
              'Geser tombol ke kanan »'
            )}
          </div>

          <div
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) handleDragStart(e.touches[0].clientX);
            }}
            style={{ left: `${sliderPosition + 3}px` }}
            className={`absolute top-[3px] bottom-[3px] w-9 rounded-md flex items-center justify-center cursor-grab shadow-sm transition-transform ${
              isSliderSuccess
                ? 'bg-white text-emerald-600 cursor-default'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isSliderSuccess ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
          </div>
        </div>
      )}

      {/* Status or Error Message */}
      {error ? (
        <span className="text-[11px] font-medium text-red-600">{error}</span>
      ) : isVerified ? (
        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
          <CheckCircle2 size={11} /> Verifikasi keamanan berhasil
        </span>
      ) : null}
    </div>
  );
};

export default CaptchaSecurity;
