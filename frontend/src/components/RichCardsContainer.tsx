'use client';

import React from 'react';
import { PillVisualCard } from './RichCards/PillVisualCard';
import { ClinicalAdviceCard } from './RichCards/ClinicalAdviceCard';
import { PayPalReceiptCard } from './RichCards/PayPalReceiptCard';
import { RingDoorbellCard } from './RichCards/RingDoorbellCard';
import { GuardianNegotiationCard } from './RichCards/GuardianNegotiationCard';
import { DoctorReportPreviewModal } from './DoctorReportPreviewModal';
import {
  PayPalRefillOrder,
  AmazonRefillOrder,
  ClinicalAdviceResponse,
  GuardianNegotiationCardData,
  RingPackageDetails,
  DailyLogItem,
  VitalsRecord,
} from '../types';

export interface RichCardsContainerProps {
  // Visual Pill Identification Card
  visualCardOpen: boolean;
  onCloseVisualCard: () => void;
  selectedMedForCard: string;

  // Clinical Advice Card
  clinicalAdviceOpen: boolean;
  onCloseClinicalAdvice: () => void;
  clinicalAdviceData: ClinicalAdviceResponse | null;

  // PayPal Prescription Refill Card (with Amazon alias for backwards compat)
  amazonOrderCardOpen?: boolean;
  onCloseAmazonOrderCard?: () => void;
  amazonOrderData?: AmazonRefillOrder | null;
  payPalOrderCardOpen?: boolean;
  onClosePayPalOrderCard?: () => void;
  payPalOrderData?: PayPalRefillOrder | null;
  onTrackOrder: (orderId: string) => void;
  onViewPorchCamera?: () => void;

  // Ring Doorbell & Smart Access Card
  ringCardOpen: boolean;
  onCloseRingCard: () => void;
  ringCardMode: 'delivery' | 'emergency' | 'live';
  ringPackageData: RingPackageDetails | null;
  ringDoorLockStatus: string;
  ringEmergencyReason: string;
  onRingAcknowledge: () => void;
  onRingUnlockDoor: () => void;

  // Health Guardian Negotiation Card
  guardianCardOpen: boolean;
  onCloseGuardianCard: () => void;
  guardianCardData: GuardianNegotiationCardData | null;
  onGuardianTakeDose: (medName?: string) => Promise<void> | void;
  onGuardianCallSarah: () => void;

  // Doctor Report Preview Modal
  doctorReportOpen?: boolean;
  onCloseDoctorReport?: () => void;
  doctorLogs?: DailyLogItem[];
  doctorVitals?: VitalsRecord[];
  adherenceRate?: number;

  // Profile Context
  patientName?: string;
  patientAge?: number;
  caregiverName?: string;
  isPro?: boolean;
}

/**
 * RichCardsContainer - Unified modal container for all CareBridge Pay rich visual cards
 */
export function RichCardsContainer({
  visualCardOpen,
  onCloseVisualCard,
  selectedMedForCard,

  clinicalAdviceOpen,
  onCloseClinicalAdvice,
  clinicalAdviceData,

  amazonOrderCardOpen = false,
  onCloseAmazonOrderCard = () => {},
  amazonOrderData = null,
  payPalOrderCardOpen = false,
  onClosePayPalOrderCard,
  payPalOrderData,
  onTrackOrder,
  onViewPorchCamera,

  ringCardOpen,
  onCloseRingCard,
  ringCardMode,
  ringPackageData,
  ringDoorLockStatus,
  ringEmergencyReason,
  onRingAcknowledge,
  onRingUnlockDoor,

  guardianCardOpen,
  onCloseGuardianCard,
  guardianCardData,
  onGuardianTakeDose,
  onGuardianCallSarah,

  doctorReportOpen = false,
  onCloseDoctorReport,
  doctorLogs = [],
  doctorVitals = [],
  adherenceRate = 87.5,

  patientName = 'Eleanor Vance',
  patientAge = 78,
  caregiverName = 'Sarah Connor',
  isPro = false,
}: RichCardsContainerProps) {
  // Support both new payPal props and legacy amazon props
  const isOrderCardOpen = payPalOrderCardOpen || amazonOrderCardOpen;
  const handleCloseOrderCard = onClosePayPalOrderCard || onCloseAmazonOrderCard;
  const effectiveOrderData = payPalOrderData || amazonOrderData;

  return (
    <>
      {/* 1. Zoomed-in Pill Identification Card */}
      <PillVisualCard
        isOpen={visualCardOpen}
        onClose={onCloseVisualCard}
        medicineName={selectedMedForCard}
      />

      {/* 2. Claude Bedrock Clinical Advisor Card */}
      <ClinicalAdviceCard
        isOpen={clinicalAdviceOpen}
        onClose={onCloseClinicalAdvice}
        title={
          clinicalAdviceData?.richCard?.title ||
          clinicalAdviceData?.displayCardTitle ||
          'Clinical Triage Assessment'
        }
        actionAdvice={
          clinicalAdviceData?.richCard?.actionAdvice ||
          clinicalAdviceData?.actionAdvice ||
          clinicalAdviceData?.richCard?.advice ||
          clinicalAdviceData?.speechResponse ||
          'Please sit down immediately and drink a glass of warm water.'
        }
        urgencyLevel={
          clinicalAdviceData?.richCard?.urgencyLevel ||
          clinicalAdviceData?.urgencyLevel ||
          'MEDIUM'
        }
        clinicalExplanation={
          clinicalAdviceData?.richCard?.clinicalExplanation ||
          clinicalAdviceData?.clinicalExplanation ||
          clinicalAdviceData?.assessment ||
          'Transient orthostatic hypotension may occur shortly after taking anti-hypertensive medication.'
        }
        smsDispatch={
          clinicalAdviceData?.richCard?.smsDispatch ||
          clinicalAdviceData?.smsDispatch ||
          null
        }
      />

      {/* 3. PayPal Developer Platform (Orders v2 / Vault / Invoicing) Refill Receipt Card */}
      <PayPalReceiptCard
        isOpen={isOrderCardOpen}
        onClose={handleCloseOrderCard}
        order={effectiveOrderData}
        onTrackOrder={onTrackOrder}
        onViewPorchCamera={onViewPorchCamera}
      />

      {/* 4. Ring Smart Doorbell & Access Card */}
      <RingDoorbellCard
        isOpen={ringCardOpen}
        onClose={onCloseRingCard}
        mode={ringCardMode}
        packageDetails={ringPackageData || undefined}
        doorLockStatus={ringDoorLockStatus}
        emergencyReason={ringEmergencyReason}
        onAcknowledge={onRingAcknowledge}
        onUnlockDoor={onRingUnlockDoor}
      />

      {/* 5. Health Guardian Negotiation Card & Sarah Circuit-Breaker */}
      <GuardianNegotiationCard
        isOpen={guardianCardOpen}
        onClose={onCloseGuardianCard}
        data={guardianCardData}
        onTakeDose={onGuardianTakeDose}
        onCallSarah={onGuardianCallSarah}
        patientName={patientName}
        caregiverName={caregiverName}
      />

      {/* 6. Quick Doctor A4 Clinical Summary Preview Modal */}
      {onCloseDoctorReport && (
        <DoctorReportPreviewModal
          isOpen={doctorReportOpen}
          onClose={onCloseDoctorReport}
          patientName={patientName}
          patientAge={patientAge}
          caregiverName={caregiverName}
          adherenceRate={adherenceRate}
          logs={doctorLogs}
          vitals={doctorVitals}
          isPro={isPro}
        />
      )}
    </>
  );
}
