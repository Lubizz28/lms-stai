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

    // Noise lines
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
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(5, 150, 105, ${0.2 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }

    // Characters
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color={isVerified ? '#047857' : '#9ca3af'} />
          <span>Verifikasi Keamanan</span>
        </label>

        {/* Small Mode Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => toggleMode('canvas')}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: mode === 'canvas' ? '#ffffff' : 'transparent',
              color: mode === 'canvas' ? '#047857' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              boxShadow: mode === 'canvas' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
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
              color: mode === 'slider' ? '#047857' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              boxShadow: mode === 'slider' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sliders size={10} /> Geser
          </button>
        </div>
      </div>

      {/* Mode 1: Canvas Alphanumeric in Single Clean Row */}
      {mode === 'canvas' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          {/* Canvas Box + Action Buttons */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#ffffff', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              height: '42px', 
              padding: '0 4px', 
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
          >
            <canvas
              ref={canvasRef}
              width={115}
              height={34}
              onClick={handleRefresh}
              title="Klik gambar untuk menyegarkan kode"
              style={{ display: 'block', borderRadius: '4px', cursor: 'pointer', width: '115px', height: '34px' }}
            />

            {/* Vertical action icons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', borderLeft: '1px solid #e2e8f0', paddingLeft: '4px', marginLeft: '4px' }}>
              <button
                type="button"
                onClick={handleRefresh}
                title="Segarkan Kode"
                style={{ padding: '2px', color: '#6b7280', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px' }}
              >
                <RefreshCw size={12} className={isRotating ? 'animate-spin' : ''} color={isRotating ? '#047857' : '#6b7280'} />
              </button>
              <button
                type="button"
                onClick={handleAudioSpeak}
                title="Dengarkan Audio"
                style={{ padding: '2px', color: '#6b7280', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px' }}
              >
                <Volume2 size={12} />
              </button>
            </div>
          </div>

          {/* Left-Aligned Input Field */}
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="5 Kode verifikasi"
              maxLength={5}
              autoComplete="off"
              spellCheck="false"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                textAlign: 'left',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                borderRadius: '8px',
                border: `1px solid ${isVerified ? '#10b981' : userInput.length === 5 ? '#ef4444' : '#cbd5e1'}`,
                backgroundColor: isVerified ? '#f0fdf4' : '#ffffff',
                color: isVerified ? '#047857' : '#111827',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {isVerified && (
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#047857', display: 'flex', pointerEvents: 'none' }}>
                <CheckCircle2 size={16} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Slider */}
      {mode === 'slider' && (
        <div
          ref={sliderTrackRef}
          style={{
            position: 'relative',
            height: '42px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
            overflow: 'hidden',
            backgroundColor: isSliderSuccess ? '#047857' : '#f1f5f9',
            border: `1px solid ${isSliderSuccess ? '#047857' : '#cbd5e1'}`,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${sliderPosition + 42}px`,
              backgroundColor: isSliderSuccess ? '#047857' : 'rgba(4, 120, 87, 0.15)'
            }}
          />

          <div 
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11.5px',
              fontWeight: 600,
              pointerEvents: 'none',
              color: isSliderSuccess ? '#ffffff' : '#6b7280',
              opacity: isDragging ? 0.3 : 1
            }}
          >
            {isSliderSuccess ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={15} /> Terverifikasi Aman
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
            style={{
              position: 'absolute',
              top: '3px',
              bottom: '3px',
              width: '38px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSliderSuccess ? 'default' : 'grab',
              left: `${sliderPosition + 3}px`,
              backgroundColor: isSliderSuccess ? '#ffffff' : '#047857',
              color: isSliderSuccess ? '#047857' : '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              transition: isDragging ? 'none' : 'left 0.2s ease'
            }}
          >
            {isSliderSuccess ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          </div>
        </div>
      )}

      {/* Error or Verified Status */}
      {error && (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626' }}>{error}</span>
      )}
      {isVerified && !error && (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} /> Verifikasi keamanan terkonfirmasi
        </span>
      )}
    </div>
  );
};

export default CaptchaSecurity;
