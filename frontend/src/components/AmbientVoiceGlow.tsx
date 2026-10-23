'use client';

import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speechService';

export interface AmbientVoiceGlowProps {
  isListening?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  isPatientSpeaking?: boolean;
  patientTranscript?: string;
  transcript?: string;
  className?: string;
  showStatusBadge?: boolean;
  onTriggerDemoVoice?: () => void;
}

/**
 * AmbientVoiceGlow - Signature PayPal Ambient Smart Display Hardware Light Bar
 * Visualizes real-time audio-reactive waveform in PayPal Ambient Blue (#003087 -> #0070BA)
 * with PayPal Gold (#FFC439) frequency peaks along the bottom edge of the smart display.
 * 
 * Integrates Web Audio API (AudioContext & AnalyserNode) to achieve real-time audio-reactive
 * waveform undulation when senior speaks, simulated patient speaks, or CareBridge Pay responds.
 */
export function AmbientVoiceGlow({
  isListening = false,
  isThinking = false,
  isSpeaking = false,
  isPatientSpeaking = false,
  patientTranscript = '',
  transcript = '',
  className = '',
  showStatusBadge = true,
  onTriggerDemoVoice,
}: AmbientVoiceGlowProps) {
  const isActive = isListening || isThinking || isSpeaking || isPatientSpeaking;

  // Real-time audio reactive metrics
  const [amplitude, setAmplitude] = useState<number>(0);
  const [freqBands, setFreqBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [wavePoints, setWavePoints] = useState<number[]>(new Array(16).fill(0));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // 1. Web Audio API Setup & Teardown for Microphone Listening
  useEffect(() => {
    if (!isListening) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      micAnalyserRef.current = null;
      return;
    }

    let isMounted = true;

    async function initMic() {
      try {
        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }

        const source = audioCtxRef.current.createMediaStreamSource(stream);
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);

        micAnalyserRef.current = analyser;
      } catch (err) {
        console.warn('[AmbientVoiceGlow] Microphone access declined or unavailable, falling back to procedural audio ripple:', err);
      }
    }

    initMic();

    return () => {
      isMounted = false;
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      micAnalyserRef.current = null;
    };
  }, [isListening]);

  // 2. High-Frequency 60fps Visualizer Animation Loop
  useEffect(() => {
    if (!isActive) {
      setAmplitude(0);
      setFreqBands([0, 0, 0, 0, 0, 0, 0, 0]);
      setWavePoints(new Array(16).fill(0));
      return;
    }

    const dataArray = new Uint8Array(32);

    const updateVisuals = () => {
      phaseRef.current += 0.08;
      const phase = phaseRef.current;

      let currentAmp = 0;
      const bands = [0, 0, 0, 0, 0, 0, 0, 0];
      const points = new Array(16).fill(0);

      if (isListening && micAnalyserRef.current) {
        // Real-Time Hardware Microphone Frequency Telemetry
        micAnalyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < 16; i++) {
          sum += dataArray[i];
          const normalized = dataArray[i] / 255;
          points[i] = normalized;
          if (i < 8) bands[i] = normalized;
        }
        currentAmp = Math.min(1, (sum / 16 / 255) * 1.5);
      } else {
        // Procedural Audio Waveform Synthesis for Speaking & Thinking
        if (isSpeaking) {
          // Dynamic verbal cadence simulation
          currentAmp = 0.55 + Math.sin(phase * 1.8) * 0.25 + Math.sin(phase * 3.4) * 0.15;
          for (let b = 0; b < 8; b++) {
            bands[b] = Math.min(1, Math.sin(phase * 2 + b * 0.5) * 0.4 + 0.5);
          }
          for (let i = 0; i < 16; i++) {
            points[i] = Math.min(1, Math.sin(phase * 1.6 + i * 0.35) * 0.5 + 0.45);
          }
        } else if (isPatientSpeaking) {
          // Warm maternal vocal timbre
          currentAmp = 0.5 + Math.sin(phase * 1.2) * 0.3;
          for (let b = 0; b < 8; b++) {
            bands[b] = Math.sin(phase + b * 0.4) * 0.3 + 0.3;
          }
          for (let i = 0; i < 16; i++) {
            points[i] = (Math.sin(phase * 1.4 + i * 0.4) * 0.5 + 0.5) * 0.6;
          }
        } else if (isThinking) {
          // PayPal agentic computational shimmer
          currentAmp = 0.4 + Math.sin(phase * 2.5) * 0.2;
          for (let b = 0; b < 8; b++) {
            bands[b] = (Math.sin(phase * 3 + b) + 1) * 0.25;
          }
          for (let i = 0; i < 16; i++) {
            points[i] = 0.25 + Math.sin(phase * 3 + i * 0.8) * 0.15;
          }
        }
      }

      setAmplitude(currentAmp);
      setFreqBands(bands);
      setWavePoints(points);

      animFrameRef.current = requestAnimationFrame(updateVisuals);
    };

    animFrameRef.current = requestAnimationFrame(updateVisuals);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isActive, isListening, isSpeaking, isThinking, isPatientSpeaking]);

  // Construct SVG Waveform Path across bottom edge
  const svgWavePath = React.useMemo(() => {
    const width = 1000;
    const baseHeight = 28;
    const step = width / (wavePoints.length - 1);

    let d = `M 0 ${baseHeight}`;
    for (let i = 0; i < wavePoints.length; i++) {
      const x = i * step;
      const peak = wavePoints[i] * 20 * (amplitude > 0.1 ? 1 : 0.2);
      const y = Math.max(3, baseHeight - peak);

      if (i === 0) {
        d += ` L ${x} ${y}`;
      } else {
        const prevX = (i - 1) * step;
        d += ` Q ${prevX + (x - prevX) * 0.5} ${y}, ${x} ${y}`;
      }
    }
    d += ` L ${width} ${baseHeight} Z`;
    return d;
  }, [wavePoints, amplitude]);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 pointer-events-none z-30 transition-all duration-500 ease-out overflow-hidden ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
      } ${className}`}
      aria-hidden={!isActive}
    >
      {/* 1. UPWARD DIFFUSED AMBIENT AURA (Modulated by Audio Amplitude in PayPal Blue) */}
      <div
        className="w-full paypal-aura-plume pointer-events-none transition-all duration-150"
        style={{
          height: `${48 + amplitude * 54}px`,
          opacity: Math.min(1, 0.55 + amplitude * 0.45),
          filter: `drop-shadow(0 -10px ${20 + amplitude * 25}px rgba(0, 112, 186, ${0.45 + amplitude * 0.4}))`,
        }}
      />

      {/* 2. CONTEXTUAL STATUS PILL WITH EQUALIZER BARS (PayPal Ambient Blue Theme) */}
      {showStatusBadge && isActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#050C1A]/95 border border-[#0070BA]/60 backdrop-blur-md shadow-[0_0_24px_rgba(0,112,186,0.5)] transition-all animate-fadeIn">
          {/* Pulsing Dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_#0070BA] ${
              isPatientSpeaking
                ? 'bg-purple-400 animate-pulse'
                : isListening
                ? 'bg-[#38BDF8] animate-ping'
                : isThinking
                ? 'bg-[#FFC439] animate-spin'
                : 'bg-[#0070BA] animate-pulse'
            }`}
          />

          {/* Mini Real-Time Audio Reactive Equalizer Bars */}
          <div className="flex items-end gap-0.5 h-3 px-1">
            {freqBands.slice(0, 5).map((val, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isPatientSpeaking ? 'bg-purple-400' : idx % 2 === 0 ? 'bg-[#38BDF8]' : 'bg-[#FFC439]'
                }`}
                style={{
                  height: `${Math.max(2, val * 12)}px`,
                  opacity: 0.7 + val * 0.3,
                }}
              />
            ))}
          </div>

          {/* Voice Context Text */}
          <span className="text-[12px] font-mono font-bold text-blue-100 tracking-tight whitespace-nowrap">
            {isPatientSpeaking
              ? patientTranscript
                ? `🎙️ Eleanor: "${patientTranscript}"`
                : '🎙️ Eleanor speaking...'
              : isListening
              ? transcript
                ? `"${transcript}"`
                : 'Listening (Audio-Reactive)...'
              : isThinking
              ? 'Analyzing with Bedrock Claude...'
              : 'CareBridge Pay Speaking (Ruth Neural)...'}
          </span>

          {/* Real-time Decibel / Gain Signal Badge */}
          {amplitude > 0.05 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isPatientSpeaking
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                  : 'bg-blue-950/80 text-[#38BDF8] border-[#0070BA]/40'
              }`}
            >
              {isPatientSpeaking ? 'SIM VOICE' : `${Math.round(amplitude * 100)}%`}
            </span>
          )}
        </div>
      )}

      {/* 2B. DEMO VOICE SIMULATOR BUTTON (BEDSIDE HARDWARE BAR) */}
      {onTriggerDemoVoice && (
        <div className="absolute bottom-4 right-4 pointer-events-auto z-40">
          <button
            onClick={onTriggerDemoVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#050C1A]/95 hover:bg-[#0B1528] border border-[#0070BA]/50 hover:border-[#38BDF8] text-blue-200 hover:text-white text-[11px] font-mono font-bold shadow-[0_0_16px_rgba(0,112,186,0.4)] transition-all active:scale-95 cursor-pointer"
            title="1-Click Dual-Turn Mock Voice Dialogue Simulator"
          >
            <span>🎭</span>
            <span>Demo Voice</span>
          </button>
        </div>
      )}

      {/* 3. DYNAMIC AUDIO-REACTIVE UNDULATING SVG WAVE RIBBON (PayPal Blue & Gold) */}
      <div className="w-full h-7 absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg
          viewBox="0 0 1000 28"
          preserveAspectRatio="none"
          className="w-full h-full opacity-95 transition-all duration-75"
        >
          <defs>
            <linearGradient id="paypalReactiveWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#003087" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#0070BA" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#38BDF8" stopOpacity="1" />
              <stop offset="55%" stopColor="#FFC439" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#0070BA" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#003087" stopOpacity="0.95" />
            </linearGradient>
            <filter id="paypalWaveGlow" x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Liquid Ripple Wave Path */}
          <path
            d={svgWavePath}
            fill="url(#paypalReactiveWaveGrad)"
            filter="url(#paypalWaveGlow)"
          />
        </svg>
      </div>

      {/* 4. SOLID ULTRA-THIN BOTTOM LIGHT STRIP */}
      <div className="w-full h-[3px] paypal-ambient-lightbar relative z-20" />
    </div>
  );
}

// Backward-compatible alias
export const AlexaAmbientGlow = AmbientVoiceGlow;
export type AlexaAmbientGlowProps = AmbientVoiceGlowProps;
