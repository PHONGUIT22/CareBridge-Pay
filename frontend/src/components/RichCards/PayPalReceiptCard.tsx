'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faTruckFast,
  faPills,
  faXmark,
  faArrowRight,
  faReceipt,
  faShieldHalved,
  faBoxOpen,
  faVideo,
  faForwardStep,
  faCreditCard,
  faEnvelope,
  faCopy,
  faCheck,
  faArrowUpRightFromSquare,
  faCertificate,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { PayPalRefillOrder, AmazonRefillOrder } from '../../types';

export interface PayPalReceiptCardProps {
  isOpen: boolean;
  onClose: () => void;
  order?: PayPalRefillOrder | AmazonRefillOrder | null;
  onTrackOrder?: (orderId: string) => void;
  onViewPorchCamera?: () => void;
}

export function PayPalReceiptCard({
  isOpen,
  onClose,
  order,
  onTrackOrder,
  onViewPorchCamera,
}: PayPalReceiptCardProps) {
  const [trackingStep, setTrackingStep] = useState<number>(3);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isInvoice = order?.paymentStatus === 'INVOICE_SENT' || Boolean(order?.invoiceUrl);
  const transactionId = order?.paypalCaptureId || order?.orderId || 'PAYID-M5W3XQA-9842103';
  const orderId = order?.orderId || 'PAYID-M5W3XQA-9842103';
  const captureId = order?.paypalCaptureId || 'CAP-7X91083-LIVE';
  const medicineName = order?.medicineName || 'Amlodipine Besylate';
  const dosage = order?.dosage || '5mg - Daily Morning';
  const quantity = order?.quantityAdded || 30;
  const newStock = order?.newStockCount ?? 33;
  const deliveryStr = order?.estimatedDelivery || 'Tomorrow by 2:00 PM • Express Pharmacy';
  const price = order?.totalPrice || '$9.80';
  const pharmacyName = order?.pharmacyName || 'CVS / CareBridge Partner Pharmacy';
  const paymentMethod = order?.paymentMethod || (isInvoice ? 'Caregiver Invoice Link' : 'PayPal Vault (1-Click)');
  const invoiceUrl = order?.invoiceUrl || 'https://www.sandbox.paypal.com/invoice/p/#INV2-DEMO';
  const sandboxActivityUrl = 'https://www.sandbox.paypal.com/activity';

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050C1A]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B1528] border-2 border-[#0070BA]/50 w-full max-w-md rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        {/* PayPal Ambient Blue and Gold Glow Accents */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#0070BA]/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-[#FFC439]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10 cursor-pointer"
          title="Close receipt card"
        >
          <FontAwesomeIcon icon={faXmark} className="text-base" />
        </button>

        {/* 1. HEADER: PAYPAL OFFICIAL BADGE & VERIFIED MERCHANT SHIELD */}
        <div className="flex items-center justify-between pr-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003087] via-[#00457C] to-[#0070BA] border border-white/25 flex items-center justify-center text-white font-black text-xl shadow-md">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">
                  PayPal Agentic Commerce
                </span>
                <span className="w-2 h-2 rounded-full bg-[#0070BA] animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FontAwesomeIcon icon={faCertificate} className="text-[10px] text-[#FFC439]" />
                <p className="text-[11px] text-[#38BDF8] font-mono font-semibold">
                  PayPal Verified Merchant
                </p>
              </div>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-[#0070BA]/20 border border-[#0070BA]/40 text-[#38BDF8] text-xs font-mono font-bold flex items-center gap-1.5">
            <FontAwesomeIcon icon={faShieldHalved} className="text-xs text-[#FFC439]" />
            <span>{isInvoice ? 'Invoice' : 'Vault'}</span>
          </div>
        </div>

        {/* 2. CONFIRMATION BANNER WITH VERIFIED CHECKMARK */}
        <div
          className={`flex items-center gap-3 p-3.5 rounded-2xl border mb-4 ${
            isInvoice
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isInvoice
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            <FontAwesomeIcon icon={isInvoice ? faEnvelope : faCircleCheck} className="text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={`text-xs font-bold ${isInvoice ? 'text-amber-300' : 'text-emerald-300'}`}>
                {isInvoice ? 'Caregiver PayPal Invoice Sent' : 'PayPal Payment Verified & Settled'}
              </h3>
              {!isInvoice && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                  ORDERS v2
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-300 font-mono truncate">
                TXN: {transactionId}
              </span>
              <button
                onClick={() => handleCopy(transactionId)}
                className="text-slate-400 hover:text-white text-[10px] cursor-pointer"
                title="Copy Transaction ID"
              >
                <FontAwesomeIcon icon={copiedId === transactionId ? faCheck : faCopy} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. 4-STEP AGENTIC FULFILLMENT TIMELINE */}
        <div className="mb-4 p-3.5 rounded-2xl bg-[#070D1A] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-mono text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Autonomous Refill Pipeline
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#0070BA]/20 text-[#38BDF8] border border-[#0070BA]/40 font-semibold">
              {trackingStep === 1
                ? '1/4: Stock <= 3'
                : trackingStep === 2
                ? '2/4: Voice Confirmed'
                : trackingStep === 3
                ? '3/4: PayPal Settled'
                : '4/4: Dispatched'}
            </span>
          </div>

          {/* Progress Bar & Nodes */}
          <div className="relative flex items-center justify-between mb-3 px-3">
            <div className="absolute left-7 right-7 top-3.5 h-1 bg-slate-800 z-0" />
            <div
              className="absolute left-7 top-3.5 h-1 bg-gradient-to-r from-[#003087] via-[#0070BA] to-emerald-400 z-0 transition-all duration-500"
              style={{
                width: `${((trackingStep - 1) / 3) * 78}%`,
              }}
            />

            {[
              { step: 1, label: 'Stock Alert', icon: faPills },
              { step: 2, label: 'Voice OK', icon: faReceipt },
              { step: 3, label: 'PayPal Paid', icon: faCreditCard },
              { step: 4, label: 'At Porch', icon: faBoxOpen },
            ].map((item) => {
              const isPast = trackingStep > item.step;
              const isCurrent = trackingStep === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setTrackingStep(item.step)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                  title={`Step ${item.step}: ${item.label}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-[#0070BA] text-white ring-4 ring-[#0070BA]/40 shadow-md scale-110'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <FontAwesomeIcon icon={isPast ? faCircleCheck : item.icon} className="text-[10px]" />
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-mono transition-colors ${
                      isCurrent
                        ? 'text-[#38BDF8] font-bold'
                        : isPast
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300">
            <span className="truncate max-w-[240px]">
              {trackingStep === 1 && 'AI detected low stock (<= 3 pills) in SQLite inventory.'}
              {trackingStep === 2 && 'Eleanor Vance confirmed refill via natural ambient voice.'}
              {trackingStep === 3 && 'Settled via PayPal Orders API v2 & Vault Token.'}
              {trackingStep === 4 && 'Dispatched express delivery to Eleanor Vance.'}
            </span>
            <button
              type="button"
              onClick={() => setTrackingStep((prev) => (prev < 4 ? prev + 1 : 1))}
              className="text-[#38BDF8] hover:text-white font-mono text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{trackingStep === 4 ? 'Reset' : 'Next'}</span>
              <FontAwesomeIcon icon={faForwardStep} className="text-[9px]" />
            </button>
          </div>
        </div>

        {/* 4. ITEMIZED PILL COST BREAKDOWN */}
        <div className="space-y-2 mb-4 text-xs">
          {/* Medication details */}
          <div className="p-3 rounded-xl bg-[#070D1A] border border-white/[0.08] flex items-center justify-between">
            <div>
              <p className="font-semibold text-white text-sm">{medicineName}</p>
              <p className="text-slate-400 mt-0.5">{dosage}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-mono text-xs font-bold text-blue-200">
                +{quantity} Tablets
              </span>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">
                New Stock: {newStock} pills
              </p>
            </div>
          </div>

          {/* Itemized receipt table */}
          <div className="p-3 rounded-xl bg-[#070D1A] border border-white/[0.08] space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Prescription Co-pay ({quantity} tabs):</span>
              <span className="text-white font-semibold">{price}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pharmacist Audit & Dispensing:</span>
              <span className="text-emerald-400">$0.00 (Covered)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Express Delivery ({deliveryStr}):</span>
              <span className="text-emerald-400">$0.00 (Free)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Sales Tax:</span>
              <span className="text-white">$0.00</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/[0.08] text-xs">
              <span className="text-white font-bold font-sans">Total Settled via PayPal:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{price} USD</span>
            </div>
          </div>

          {/* Delivery & Method */}
          <div className="p-2.5 rounded-xl bg-[#070D1A] border border-white/[0.08] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTruckFast} className="text-[#38BDF8]" />
              <span className="text-slate-300">{pharmacyName}</span>
            </div>
            <span className="text-[#FFC439] font-mono font-semibold">{paymentMethod}</span>
          </div>
        </div>

        {/* 5. ACTION BUTTONS (Clickable link to Sandbox PayPal Activity) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Clickable link to Sandbox PayPal Activity */}
          <a
            href={isInvoice ? invoiceUrl : sandboxActivityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#003087] via-[#00457C] to-[#0070BA] hover:from-[#002566] hover:to-[#005a96] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0070BA]/25 active:scale-95 cursor-pointer text-center"
          >
            <span>{isInvoice ? 'Review & Pay Invoice' : 'View PayPal Activity'}</span>
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
          </a>

          <button
            onClick={() => {
              if (onViewPorchCamera) onViewPorchCamera();
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-sky-300 font-semibold text-xs border border-blue-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Check front porch camera feed for parcel"
          >
            <FontAwesomeIcon icon={faVideo} className="text-[11px]" />
            <span className="hidden xs:inline">Porch Cam</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
