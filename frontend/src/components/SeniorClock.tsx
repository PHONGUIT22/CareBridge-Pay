'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faCertificate,
} from '@fortawesome/free-solid-svg-icons';

interface SeniorClockProps {
  className?: string;
  showMerchantShield?: boolean;
}

export function SeniorClock({
  className = '',
  showMerchantShield = true,
}: SeniorClockProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!currentTime) {
    return (
      <div className={`flex flex-col items-center justify-center animate-pulse ${className}`}>
        <div className="h-28 w-72 bg-slate-800/40 rounded-3xl" />
        <div className="h-6 w-48 bg-slate-800/40 rounded-full mt-4" />
      </div>
    );
  }

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(currentTime);

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* 1. CareBridge Pay & PayPal Verified Merchant Shield */}
      {showMerchantShield && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003087]/40 border border-[#0070BA]/50 text-xs text-blue-200 mb-3 shadow-[0_0_15px_rgba(0,112,186,0.3)] backdrop-blur-sm">
          <div className="w-4 h-4 rounded-full bg-[#0070BA] text-white flex items-center justify-center text-[10px] font-black">
            P
          </div>
          <span className="font-bold text-white tracking-tight">CareBridge Pay</span>
          <span className="w-1 h-1 rounded-full bg-[#FFC439]" />
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#38BDF8]">
            <FontAwesomeIcon icon={faShieldHalved} className="text-[#FFC439] text-[10px]" />
            <span>PayPal Verified Merchant</span>
          </div>
        </div>
      )}

      {/* 2. Giant Hardware OLED Clock Digits */}
      <div className="flex items-baseline justify-center font-mono font-bold tabular-nums">
        <span
          className="text-7xl sm:text-8xl md:text-9xl text-white tracking-tight drop-shadow-[0_0_35px_rgba(0,112,186,0.4)]"
          style={{ letterSpacing: '-0.03em' }}
        >
          {hours}:{minutes}
        </span>

        {/* Seconds indicator */}
        <span className="text-3xl sm:text-4xl text-[#38BDF8] font-mono font-bold ml-2 sm:ml-3 opacity-80 tabular-nums">
          :{seconds}
        </span>
      </div>

      {/* 3. Formatted Date in Sky Blue */}
      <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base font-bold text-[#38BDF8] uppercase tracking-widest font-mono">
        {formattedDate}
      </p>
    </div>
  );
}
