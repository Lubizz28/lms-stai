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

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient with emerald subtle tint
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#f0fdf4');
    bgGradient.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw background noise lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
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
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = `rgba(5, 150, 105, ${0.2 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Characters
    const colors = ['#065f46', '#047857', '#059669', '#0f766e', '#115e59'];
    const charSpacing = width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const char = code[i];
      const x = (i + 0.75) * charSpacing;
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() - 0.5) * 0.4;

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `bold 20px 'Courier New', monospace, sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Strike-through line
    ctx.strokeStyle = 'rgba(4, 120, 87, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, height / 2 + (Math.random() * 8 - 4));
    ctx.lineTo(width - 8, height / 2 + (Math.random() * 8 - 4));
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
    }, 120);
  }, [drawCaptcha, generateRandomCode, onVerify]);

  // Audio Playback
  const handleAudioSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const charsSpoken = captchaText.split('').join(' . ');
    const utterance = new SpeechSynthesisUtterance(`Kode verifikasi: ${charsSpoken}`);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize Canvas
  useEffect(() => {
    if (mode === 'canvas') {
      const code = generateRandomCode();
      setCaptchaText(code);
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

  // Slider Handlers
  const handleDragStart = (clientX: number) => {
    if (isSliderSuccess) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || !sliderTrackRef.current || isSliderSuccess) return;
    const trackWidth = sliderTrackRef.current.clientWidth - 44;
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
    <div 
      style={{
        padding: '10px 12px',
        borderRadius: '12px',
        backgroundColor: isVerified ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${isVerified ? '#86efac' : error ? '#fca5a5' : '#e2e8f0'}`,
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Header bar: Title & Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={15} color={isVerified ? '#059669' : '#64748b'} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: isVerified ? '#065f46' : '#334155' }}>
            Verifikasi Keamanan
          </span>
        </div>

        {/* Switch Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => toggleMode('canvas')}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: mode === 'canvas' ? '#ffffff' : 'transparent',
              color: mode === 'canvas' ? '#065f46' : '#64748b',
              boxShadow: mode === 'canvas' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Hash size={10} /> Kode
          </button>
          <button
            type="button"
            onClick={() => toggleMode('slider')}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: mode === 'slider' ? '#ffffff' : 'transparent',
              color: mode === 'slider' ? '#065f46' : '#64748b',
              boxShadow: mode === 'slider' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Sliders size={10} /> Geser
          </button>
        </div>
      </div>

      {/* MODE 1: CANVAS ALPHANUMERIC CAPTCHA */}
      {mode === 'canvas' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Canvas Box */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              backgroundColor: '#ffffff', 
              padding: '3px 4px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1',
              flexShrink: 0
            }}
          >
            <canvas
              ref={canvasRef}
              width={125}
              height={36}
              onClick={handleRefresh}
              title="Klik untuk ganti kode"
              style={{ display: 'block', borderRadius: '4px', cursor: 'pointer' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid #e2e8f0', paddingLeft: '4px' }}>
              <button
                type="button"
                onClick={handleRefresh}
                title="Segarkan Kode"
                style={{ padding: '3px', color: '#64748b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCw size={12} className={isRotating ? 'animate-spin' : ''} color={isRotating ? '#059669' : '#64748b'} />
              </button>
              <button
                type="button"
                onClick={handleAudioSpeak}
                title="Dengarkan Audio"
                style={{ padding: '3px', color: '#64748b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Volume2 size={12} />
              </button>
            </div>
          </div>

          {/* Input field */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="5 Karakter"
              maxLength={5}
              autoComplete="off"
              spellCheck="false"
              style={{
                width: '100%',
                padding: '8px 10px',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                borderRadius: '8px',
                border: `1px solid ${isVerified ? '#10b981' : userInput.length === 5 ? '#ef4444' : '#cbd5e1'}`,
                backgroundColor: isVerified ? '#f0fdf4' : '#ffffff',
                color: isVerified ? '#065f46' : '#0f172a',
                outline: 'none'
              }}
            />
            {isVerified && (
              <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#059669', display: 'flex' }}>
                <CheckCircle2 size={15} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: INTERACTIVE TURNSTILE SLIDER */}
      {mode === 'slider' && (
        <div
          ref={sliderTrackRef}
          style={{
            position: 'relative',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
            overflow: 'hidden',
            backgroundColor: isSliderSuccess ? '#10b981' : '#e2e8f0',
            border: `1px solid ${isSliderSuccess ? '#059669' : '#cbd5e1'}`
          }}
        >
          {/* Progress Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${sliderPosition + 44}px`,
              backgroundColor: isSliderSuccess ? '#10b981' : 'rgba(16, 185, 129, 0.2)'
            }}
          />

          {/* Guide Label */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              pointerEvents: 'none',
              color: isSliderSuccess ? '#ffffff' : '#64748b',
              opacity: isDragging ? 0.3 : 1
            }}
          >
            {isSliderSuccess ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Terverifikasi Aman
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
            style={{
              position: 'absolute',
              top: '3px',
              bottom: '3px',
              width: '38px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSliderSuccess ? 'default' : 'grab',
              left: `${sliderPosition + 3}px`,
              backgroundColor: isSliderSuccess ? '#ffffff' : '#059669',
              color: isSliderSuccess ? '#059669' : '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: isDragging ? 'none' : 'left 0.2s ease'
            }}
          >
            {isSliderSuccess ? (
              <CheckCircle2 size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
          </div>
        </div>
      )}

      {/* Status or Error Message */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
        {error ? (
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{error}</span>
        ) : isVerified ? (
          <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={11} /> Berhasil diverifikasi
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>
            {mode === 'canvas' ? 'Masukkan 5 kode huruf/angka di atas' : 'Tarik tuas hingga ujung kanan'}
          </span>
        )}
      </div>
    </div>
  );
};

export default CaptchaSecurity;
