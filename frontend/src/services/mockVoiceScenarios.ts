export interface MockVoiceScenario {
  id: string;
  title: string;
  badge: string;
  prompt: string;
  description: string;
  targetTool: 'getTodaySchedule' | 'logDoseStatus' | 'orderRefill' | 'ringDeviceHub' | 'clinicalAdvisor';
  actionIcon: string;
  accentColor: string;
}

/**
 * Pre-built, clinically realistic demonstration scenarios matching CareBridge Pay
 * for PayPal AI Hackathon presentation and zero-speech simulated testing.
 */
export const MOCK_VOICE_SCENARIOS: MockVoiceScenario[] = [
  {
    id: 'schedule',
    title: 'Daily Schedule',
    badge: 'getTodaySchedule',
    prompt: "What's my medicine schedule today?",
    description: "Queries upcoming daily doses, adherence percentage, and active prescriptions.",
    targetTool: 'getTodaySchedule',
    actionIcon: '📅',
    accentColor: '#003087', // PayPal Deep Blue
  },
  {
    id: 'dose_confirm',
    title: 'Dose Confirmation & Low Stock Alert',
    badge: 'logDoseStatus',
    prompt: 'I just took my morning Amlodipine pill with breakfast.',
    description: 'Confirms intake, decrements stock. When stock <= 3, AI autonomously prompts senior for PayPal refill.',
    targetTool: 'logDoseStatus',
    actionIcon: '💊',
    accentColor: '#10B981', // Emerald
  },
  {
    id: 'pharmacy_refill',
    title: 'PayPal Agentic Refill (1-Click Vault)',
    badge: 'orderRefill',
    prompt: 'Refill my blood pressure pills with PayPal.',
    description: 'Autonomous 1-click refill settled via PayPal Developer Platform (Orders v2 / Vault Token) within Family Wallet limit.',
    targetTool: 'orderRefill',
    actionIcon: '💳',
    accentColor: '#0070BA', // PayPal Ambient Blue
  },
  {
    id: 'invoice_refill',
    title: 'Exceeding Limit -> Caregiver PayPal Invoice',
    badge: 'orderRefill',
    prompt: 'Order 90 days of Metformin with express shipping.',
    description: 'Exceeds Eleanor’s $50 monthly limit: AI dispatches PayPal Invoice link + AWS SNS SMS to caregiver Sarah Connor.',
    targetTool: 'orderRefill',
    actionIcon: '📩',
    accentColor: '#D97706', // Amber Gold
  },
  {
    id: 'emergency_alert',
    title: 'Emergency Triage & Paramedic Access',
    badge: 'clinicalAdvisor',
    prompt: 'I have severe crushing chest pain and dizziness!',
    description: 'Triggers acute triage, dispatches AWS SNS alert to Sarah, and unlocks smart door for paramedics.',
    targetTool: 'clinicalAdvisor',
    actionIcon: '🚨',
    accentColor: '#DC2626', // Crimson Red
  },
  {
    id: 'ring_porch',
    title: 'Smart Porch Prescription Verification',
    badge: 'ringDeviceHub',
    prompt: 'Check my front porch camera for my PayPal prescription package delivery.',
    description: 'Opens live porch camera feed verifying pharmacy parcel arrival on door mat.',
    targetTool: 'ringDeviceHub',
    actionIcon: '📹',
    accentColor: '#0D9488', // Teal
  },
];
