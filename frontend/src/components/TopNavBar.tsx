'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeartPulse,
  faDesktop,
  faMobileScreen,
  faCrown,
  faRightFromBracket,
  faVideo,
  faTv,
  faBoxOpen,
  faCreditCard,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { AuthSession } from '../types';

export interface TopNavBarProps {
  isDeskClock: boolean;
  authSession: AuthSession;
  isDualMode: boolean;
  viewportMode?: 'dual' | 'single' | 'echoShow10';
  onOpenPaywall: () => void;
  onSignOut: () => void;
  onSetDualMode: (isDual: boolean) => void;
  onSetViewportMode?: (mode: 'dual' | 'single' | 'echoShow10') => void;
  onPreviewRingPorch: () => void;
  onSimulatePorchDrop?: () => void;
}

/**
 * TopNavBar - CareBridge Pay Top Navigation & Agentic Device Simulator Bar
 */
export function TopNavBar({
  isDeskClock,
  authSession,
  isDualMode,
  viewportMode = 'dual',
  onOpenPaywall,
  onSignOut,
  onSetDualMode,
  onSetViewportMode,
  onPreviewRingPorch,
  onSimulatePorchDrop,
}: TopNavBarProps) {
  return (
    <header
      className={`px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 gap-3 backdrop-blur-md transition-colors duration-300 ${
        isDeskClock
          ? 'bg-[#050C1A]/95 border-b border-white/[0.08] text-white'
          : 'bg-white/95 border-b border-slate-200/80 text-slate-800 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-2.5 shrink-0">
        {/* CareBridge Pay Ambient Blue Logo Squircle */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#003087] to-[#0070BA] flex items-center justify-center text-white font-black text-sm shadow-sm border border-white/20">
          P
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold text-sm tracking-tight flex items-center gap-1 ${
                isDeskClock ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>CareBridge</span>
              <span className="text-[#0070BA] font-black">Pay</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0070BA]/10 text-[#003087] text-[10px] font-mono font-bold border border-[#0070BA]/25">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#FFC439] text-[9px]" />
              <span>PayPal Verified Merchant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Persona Indicator & Pro Badge & Sign Out Button */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Active Profile Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
            isDeskClock
              ? 'bg-slate-900 border-slate-800 text-slate-200'
              : 'bg-slate-50 border-slate-200/80 text-slate-700'
          }`}
        >
          <div className="leading-tight flex items-center gap-2">
            <span className="whitespace-nowrap">
              {authSession.role === 'senior'
                ? `${authSession.patientName || 'Eleanor Vance'} (Senior)`
                : `${authSession.caregiverName || 'Sarah Connor'} (Caregiver)`}
            </span>
            {authSession.isPro && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Copilot Pro
              </span>
            )}
          </div>
        </div>

        {/* PayPal Copilot Subscription Button */}
        <button
          onClick={onOpenPaywall}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
            authSession.isPro
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-[#FFC439]/20 hover:bg-[#FFC439]/30 border border-[#FFC439]/60 text-[#003087]'
          }`}
          title="CareBridge Pay PayPal Subscription Status"
        >
          <FontAwesomeIcon icon={faCreditCard} className="text-xs text-[#0070BA]" />
          <span className="hidden xs:inline">
            {authSession.isPro ? 'Copilot Active' : 'Subscribe $9.99'}
          </span>
        </button>

        {/* Switch Profile / Sign Out */}
        <button
          onClick={onSignOut}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
            isDeskClock
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-white hover:bg-slate-100 border-slate-200/80 text-slate-700 hover:text-slate-900 shadow-2xs'
          }`}
          title="Switch profile or sign out"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
          <span className="hidden md:inline">Switch profile</span>
        </button>

        {/* Simulate Porch Delivery Trigger (Proactive Ring Motion Test) */}
        {onSimulatePorchDrop && (
          <button
            onClick={onSimulatePorchDrop}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all active:scale-95 shadow-2xs cursor-pointer"
            title="Simulate prescription delivery arrival at front porch"
          >
            <FontAwesomeIcon icon={faBoxOpen} className="text-xs text-emerald-600" />
            <span className="hidden sm:inline">Simulate Rx Drop</span>
          </button>
        )}

        {/* Viewport Modes */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
          {/* Dual Dev Mode */}
          <button
            onClick={() => {
              if (onSetViewportMode) onSetViewportMode('dual');
              onSetDualMode(true);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewportMode === 'dual' || (isDualMode && !viewportMode)
                ? 'bg-[#003087] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Dual Console (Smart Screen + AI Voice Agent Console)"
          >
            <FontAwesomeIcon icon={faDesktop} className="text-xs" />
            <span className="hidden xl:inline">Dual Console</span>
          </button>

          {/* Smart Ambient Display Frame */}
          <button
            onClick={() => {
              if (onSetViewportMode) onSetViewportMode('echoShow10');
              onSetDualMode(false);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewportMode === 'echoShow10'
                ? 'bg-[#003087] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ambient Smart Display Simulator (10-inch Touch Screen)"
          >
            <FontAwesomeIcon icon={faTv} className="text-xs" />
            <span className="hidden xl:inline">Smart Display</span>
          </button>

          {/* Mobile View */}
          <button
            onClick={() => {
              if (onSetViewportMode) onSetViewportMode('single');
              onSetDualMode(false);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewportMode === 'single'
                ? 'bg-[#003087] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Single Mobile View"
          >
            <FontAwesomeIcon icon={faMobileScreen} className="text-xs" />
            <span className="hidden xl:inline">Mobile</span>
          </button>
        </div>

        {/* Porch Camera Quick Trigger */}
        <button
          onClick={onPreviewRingPorch}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#003087] text-xs font-medium transition-all active:scale-95 shadow-2xs cursor-pointer"
          title="Preview Porch Camera Feed"
        >
          <FontAwesomeIcon icon={faVideo} className="text-xs" />
          <span className="hidden sm:inline">Porch Cam</span>
        </button>
      </div>
    </header>
  );
}
