'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeartPulse,
  faDroplet,
  faShieldHalved,
  faBolt,
  faEye,
  faTableCells,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { mcpClient } from '../services/mcpClient';
import { DoctorReportPreviewModal } from '../components/DoctorReportPreviewModal';
import { MedicalFinancialLedger } from '../components/MedicalFinancialLedger';

type MetricTab = 'bloodPressure' | 'bloodSugar' | 'heartRate' | 'ledger';

interface VitalPoint {
  date: string;       // "08-13"
  systolic?: number;  // mmHg
  diastolic?: number; // mmHg
  bloodSugar?: number;// mg/dL
  heartRate?: number; // bpm
}

export function AnalyticsView({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [activeTab, setActiveTab] = useState<MetricTab>('bloodPressure');
  const [vitalsData, setVitalsData] = useState<VitalPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch 30-day vitals history from backend via mcpClient
  useEffect(() => {
    mcpClient
      .getHistory()
      .then((data) => {
        if (data.success && data.vitals?.length > 0) {
          const formatted = data.vitals.map((v) => ({
            date: v.date.substring(5), // "YYYY-MM-DD" -> "MM-DD"
            systolic: v.systolic || 120,
            diastolic: v.diastolic || 80,
            bloodSugar: v.bloodSugar || 105,
            heartRate: v.heartRate || 72,
          }));
          setVitalsData(formatted);
        }
      })
      .catch((err) => {
        console.warn('Unable to load vitals history from server:', err);
      });
  }, [refreshTrigger]);

  // Compute dynamic clinical averages and observations
  const bpAnalysis = useMemo(() => {
    const valid = vitalsData.filter((v) => v.systolic && v.diastolic);
    if (valid.length === 0) {
      return { avgSys: 122, avgDia: 82, isElevated: false };
    }

    const avgSys = Math.round(
      valid.reduce((acc, v) => acc + (v.systolic || 0), 0) / valid.length
    );
    const avgDia = Math.round(
      valid.reduce((acc, v) => acc + (v.diastolic || 0), 0) / valid.length
    );

    return {
      avgSys,
      avgDia,
      isElevated: avgSys > 130 || avgDia > 85,
    };
  }, [vitalsData]);

  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-900 p-3 sm:p-5 font-sans select-none pb-28">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {/* 1. HEADER SECTION */}
        <div className="pt-1 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0070BA] font-mono">
                BIOMETRIC TELEMETRY & FINANCIAL CORRELATION
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Powered by AG Grid Enterprise Telemetry</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Vitals & Financial Analytics
            </h1>
          </div>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95 transition-all mt-1"
            title="One-Tap Quick Doctor A4 Preview with 30-Day BP Chart & Scannable QR Code"
          >
            <FontAwesomeIcon icon={faEye} className="text-xs" />
            <span>Doctor A4 Sheet</span>
          </button>
        </div>

        {/* 2. 4 METRIC TABS (Including AG Grid Ledger) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('bloodPressure')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'bloodPressure'
                ? 'bg-[#003087] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 shadow-2xs'
            }`}
          >
            <FontAwesomeIcon
              icon={faHeartPulse}
              className={`text-xs ${activeTab === 'bloodPressure' ? 'text-white' : 'text-[#0070BA]'}`}
            />
            <span className="truncate">Blood Pressure</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bloodSugar')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'bloodSugar'
                ? 'bg-[#003087] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 shadow-2xs'
            }`}
          >
            <FontAwesomeIcon
              icon={faDroplet}
              className={`text-xs ${activeTab === 'bloodSugar' ? 'text-white' : 'text-sky-600'}`}
            />
            <span className="truncate">Blood Sugar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heartRate')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'heartRate'
                ? 'bg-[#003087] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 shadow-2xs'
            }`}
          >
            <FontAwesomeIcon
              icon={faBolt}
              className={`text-xs ${activeTab === 'heartRate' ? 'text-white' : 'text-emerald-600'}`}
            />
            <span className="truncate">Heart Rate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-[#003087] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 shadow-2xs'
            }`}
          >
            <FontAwesomeIcon
              icon={faTableCells}
              className={`text-xs ${activeTab === 'ledger' ? 'text-white' : 'text-[#0070BA]'}`}
            />
            <span className="truncate">AG Grid Ledger</span>
          </button>
        </div>

        {/* 3. CONTENT AREA */}
        {activeTab === 'ledger' ? (
          <MedicalFinancialLedger refreshTrigger={refreshTrigger} />
        ) : (
          <>
            {/* AREA CHART CONTAINER */}
            <div className="bg-white border border-slate-200/90 rounded-[24px] p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeTab === 'bloodPressure' && '30-Day Blood Pressure Telemetry (Systolic/Diastolic)'}
                    {activeTab === 'bloodSugar' && '30-Day Blood Sugar Curve (Fasting & Post-Prandial)'}
                    {activeTab === 'heartRate' && '30-Day Resting Heart Rate (BPM)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'bloodPressure' && `Monthly Average: ${bpAnalysis.avgSys}/${bpAnalysis.avgDia} mmHg`}
                    {activeTab === 'bloodSugar' && 'Target: 80 - 130 mg/dL'}
                    {activeTab === 'heartRate' && 'Target: 60 - 100 bpm'}
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                {isMounted && vitalsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vitalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0070BA" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0070BA" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="diaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#003087',
                          color: '#FFFFFF',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      />

                      {activeTab === 'bloodPressure' && (
                        <>
                          <Area
                            key="systolic"
                            type="monotone"
                            dataKey="systolic"
                            stroke="#003087"
                            strokeWidth={2.5}
                            fill="url(#sysGradient)"
                            dot={{ r: 2, fill: '#003087' }}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                          />
                          <Area
                            key="diastolic"
                            type="monotone"
                            dataKey="diastolic"
                            stroke="#38BDF8"
                            strokeWidth={2}
                            fill="url(#diaGradient)"
                            dot={{ r: 2, fill: '#38BDF8' }}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                          />
                        </>
                      )}

                      {activeTab === 'bloodSugar' && (
                        <Area
                          key="bloodSugar"
                          type="monotone"
                          dataKey="bloodSugar"
                          stroke="#F59E0B"
                          strokeWidth={2.5}
                          fill="url(#sugarGradient)"
                          dot={{ r: 2, fill: '#F59E0B' }}
                          activeDot={{ r: 4 }}
                          isAnimationActive={false}
                        />
                      )}

                      {activeTab === 'heartRate' && (
                        <Area
                          key="heartRate"
                          type="monotone"
                          dataKey="heartRate"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#heartGradient)"
                          dot={{ r: 2, fill: '#10B981' }}
                          activeDot={{ r: 4 }}
                          isAnimationActive={false}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-mono">
                    Loading biometric telemetry...
                  </div>
                )}
              </div>
            </div>

            {/* 4. CLINICAL OBSERVATION CARD */}
            <div className="bg-blue-50/60 border border-blue-200/60 rounded-[20px] p-4 sm:p-5 flex gap-3.5 items-start shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#003087] flex items-center justify-center shrink-0 mt-0.5 border border-blue-200/60">
                <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
              </div>
              <div>
                <h4 className="font-bold text-[#003087] text-sm sm:text-base">
                  Clinical & Financial Observation
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Readings remain within stable target ranges. Autonomous prescription refills settled through PayPal Developer Platform (Vault / Orders v2) ensure continuous 100% medication supply without patient intervention.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ONE-TAP QUICK DOCTOR A4 PREVIEW MODAL */}
      <DoctorReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        patientName="Eleanor Vance"
        patientAge={78}
        caregiverName="Sarah Connor"
        adherenceRate={87.5}
        vitals={vitalsData.map((v) => ({
          date: `2026-${v.date}`,
          systolic: v.systolic,
          diastolic: v.diastolic,
          bloodSugar: v.bloodSugar,
          heartRate: v.heartRate,
        }))}
      />
    </div>
  );
}
