# CareBridge Pay — System Architecture & Operational Blueprint 💳🩺

> **Comprehensive Technical Architecture & Operational Blueprint**  
> *Built for PayPal AI Hackathon 2026: Agentic Commerce, Best Use of PayPal + AI, and AG Grid Sponsor Bounty ($5,000).*

---

## TABLE OF CONTENTS

1. [Executive Overview & Mission](#1-executive-overview--mission)
2. [Repository Anatomy & Monorepo Structure](#2-repository-anatomy--monorepo-structure)
3. [Agentic Commerce Decision Tree & Execution Lifecycle](#3-agentic-commerce-decision-tree--execution-lifecycle)
4. [PayPal Developer Platform Services & Error Handling](#4-paypal-developer-platform-services--error-handling)
5. [Security Guardrails, Spending Limits & Clinical Safety](#5-security-guardrails-spending-limits--clinical-safety)
6. [AG Grid Medical-Financial Ledger Architecture ($5,000 Bounty)](#6-ag-grid-medical-financial-ledger-architecture-5000-bounty)
7. [Model Context Protocol (MCP) Tri-Pillars & Agentic Loop](#7-model-context-protocol-mcp-tri-pillars--agentic-loop)
8. [Database Schema & Atomic Persistence](#8-database-schema--atomic-persistence)
9. [Verification, Testing & Quality Assurance](#9-verification-testing--quality-assurance)

---

## 1. EXECUTIVE OVERVIEW & MISSION

### 1.1 The Healthcare Challenge
Elderly seniors living independently suffer from polypharmacy (managing 4–8 medications daily for hypertension, diabetes, and cardiovascular health). When inventory runs out, cognitive fatigue, physical tremors, or mobility barriers prevent seniors from reordering medications on time, leading to dangerous dose omissions and emergency hospital readmissions.

### 1.2 The Solution: CareBridge Pay
**CareBridge Pay** transforms ambient bedside smart displays into an **autonomous healthcare commerce station**:
- **True Agentic Commerce**: The AI agent audits medication inventory in real time. When stock drops to $\le 3$ pills, the agent proactively alerts the senior via natural ambient voice, verifies consent, and autonomously settles the order using the **PayPal Developer Platform (Orders API v2 & Vault Pre-approved Token)**.
- **Family Wallet & Caregiver Invoicing**: The senior is allocated a pre-approved monthly wallet limit (e.g. $50.00). If an order exceeds this limit, the system gracefully triggers the **PayPal Invoicing API** and delivers an emergency approval SMS to the caregiver via AWS SNS.
- **AG Grid Medical-Financial Ledger**: An enterprise-grade AG Grid table displays the exact correlation between daily biometric vitals (Blood Pressure, Heart Rate, Glucose) and PayPal prescription transactions, with CSV export and real-time SSE updates.
- **PayPal Subscriptions API**: Seamless recurring billing ($9.99/mo) for Caregiver Copilot Pro.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CAREBRIDGE PAY SYSTEM ARCHITECTURE                              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│            SENIOR AMBIENT DISPLAY            │       │               REMOTE CAREGIVER               │
│               (Eleanor Vance)                │       │                (Sarah Connor)                │
│  - 6-Foot Glanceable High-Contrast UI        │       │  - Real-Time AG Grid Financial Ledger        │
│  - Natural Ambient Voice Copilot             │       │  - Family Wallet Limit Controls ($50.00)     │
│  - PayPal 1-Click Vault Refill Receipts      │       │  - PayPal Invoicing & Urgent SMS Approval    │
│  - Autonomous Low-Stock Trigger              │       │  - PayPal Subscriptions ($9.99/mo Copilot)   │
│  - Porch Camera Pharmacy Delivery Check      │       │  - Certified Clinical Doctor PDF Reports     │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
                       └──────────────────────┬───────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND MCP & PAYPAL COMMERCE ENGINE                            │
│  - PayPal Developer Platform: Orders API v2, Vault API, Invoicing API, Subscriptions API   │
│  - PayPal Webhooks & Server-Sent Events (SSE) live push to AG Grid                          │
│  - Model Context Protocol (MCP): 8 Action Tools, 2 Resources, 2 System Prompts             │
│  - AI Orchestrator: AWS Bedrock Claude Haiku 4.5 Native Tool-Use & Offline Heuristics       │
│  - Clinical Safety: Beers Criteria 15-Drug Geriatric Pharmacology Registry                  │
│  - SQLite WAL Database with Transactions Ledger & Family Wallet Limits                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. REPOSITORY ANATOMY & MONOREPO STRUCTURE

```text
carebridge-pay/
├── backend-mcp/                         # BACKEND MCP & PAYPAL COMMERCE SERVICES
│   ├── src/
│   │   ├── services/
│   │   │   ├── paypalService.ts         # PayPal OAuth2, Orders v2, Vault, Invoicing & Subscriptions
│   │   │   └── drugInteractionService.ts# 15-Med Beers Criteria Geriatric Pharmacology Registry
│   │   ├── database/
│   │   │   ├── db.ts                    # SQLite WAL connection, migrations & busy_timeout
│   │   │   ├── transactionRepo.ts       # Medical-Financial Ledger & Family Wallet CRUD
│   │   │   ├── medicineRepo.ts          # Medication inventory & refill counts
│   │   │   ├── logRepo.ts               # Intake records & adherence timestamps
│   │   │   └── vitalsRepo.ts            # Daily blood pressure, glucose, and heart rate
│   │   ├── tools/                       # MCP Action Tools
│   │   │   ├── orderRefill.ts           # PayPal Orders v2 / Vault Autonomous Refill
│   │   │   ├── logDoseStatus.ts         # Logs intake & triggers <= 3 pill refill prompt
│   │   │   ├── agentTurnHandler.ts      # Voice orchestrator with PayPal intent recognition
│   │   │   ├── getTodaySchedule.ts      # Today's doses and adherence metrics
│   │   │   ├── recordVitals.ts          # Biometric telemetry recording
│   │   │   ├── clinicalAdvisor.ts       # Claude Haiku symptom assessment
│   │   │   ├── ringDeviceHub.ts         # Smart porch camera and paramedic door unlock
│   │   │   └── negotiateAdherence.ts    # Compassionate guardian refusal escalation
│   │   ├── routes/
│   │   │   └── apiRoutes.ts             # REST API, PayPal Webhooks & SSE Event Stream
│   │   └── server.ts                    # MCP Server Entrypoint (Streamable HTTP /sse)
│   └── tests/                           # Vitest Automated Test Suites (9 suites, 95 tests)
│       ├── paypalService.test.ts        # Unit tests for PayPal Orders, Vault & Subscriptions
│       ├── agenticCommerce.test.ts      # Tests for autonomous refill & invoicing loops
│       └── ...
├── frontend/                            # NEXT.JS 15 AMBIENT CLIENT & AG GRID PORTAL
│   ├── src/
│   │   ├── components/
│   │   │   ├── MedicalFinancialLedger.tsx # AG Grid Enterprise Medical-Financial Ledger
│   │   │   ├── AmbientVoiceGlow.tsx     # PayPal Ambient Blue audio-reactive glow
│   │   │   ├── SeniorClock.tsx          # Glanceable bedside clock with Verified Merchant shield
│   │   │   ├── TopNavBar.tsx            # Navigation & simulator viewport bar
│   │   │   ├── PaywallModal.tsx         # PayPal Subscriptions API ($9.99/mo) Checkout
│   │   │   ├── RichCards/
│   │   │   │   └── PayPalReceiptCard.tsx# PayPal Settlement & Invoicing Receipt Card
│   │   │   └── AlexaAgentConsole.tsx    # Live AI dialogue & reasoning trace console
│   │   ├── screens/
│   │   │   ├── HistoryMatrixView.tsx    # Integrated AG Grid Ledger & Punch-Card Heatmap
│   │   │   ├── AnalyticsView.tsx        # Vitals Telemetry with AG Grid Tab
│   │   │   └── TodayScheduleView.tsx    # Senior bedside glanceable interface
│   │   ├── services/
│   │   │   └── mcpClient.ts             # Frontend API client with SSE stream listener
│   │   └── app/
│   │       ├── globals.css              # PayPal Ambient Blue theme styling
│   │       └── page.tsx                 # Core application shell & state coordinator
└── package.json                         # Monorepo workspaces configuration
```

---

## 3. AGENTIC COMMERCE DECISION TREE & EXECUTION LIFECYCLE

The AI agent does not require human manual button clicks to trigger shopping carts. Instead, commerce is an **autonomous consequence of clinical adherence**:

```
                       [Senior Dose Intake Confirmed]
                         (Touch or Voice Audio)
                                   │
                                   ▼
                   [logDoseStatus Tool Execution]
                    Stock Count Audited (stock - 1)
                                   │
                                   ▼
                   Is Remaining Pill Stock <= 3 units?
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
              NO (> 3)                            YES (<= 3)
                 │                                   │
         Mark Dose: TAKEN                    Trigger Autonomous Low-Stock
         Adherence +1 Streak                 Refill Protocol in MCP
                 │                                   │
                 ▼                                   ▼
          Cycle Complete                 Proactively Prompt Senior:
                                        "Eleanor, you have only 3 pills of
                                         Amlodipine left. Should I reorder
                                         a 30-day supply with PayPal?"
                                                     │
                                                     ▼
                                       Senior Confirms: "Yes, please"
                                                     │
                                                     ▼
                                     [orderRefill Tool Execution]
                                                     │
                                                     ▼
                                Check Family Wallet Monthly Limit ($50.00)
                                Total Cost = Current Spent + Order Amount
                                                     │
                 ┌───────────────────────────────────┴───────────────────────────────────┐
                 ▼                                                                       ▼
    Within Limit (<= $50.00)                                                  Exceeds Limit (> $50.00)
                 │                                                                       │
    1. paypalService.createOrder()                                          1. paypalService.createInvoice()
       (intent: CAPTURE, soft descriptor)                                      (caregiverEmail, itemized tabs)
    2. paypalService.captureOrder()                                         2. Dispatch AWS SNS SMS to Sarah:
       (or charge pre-approved Vault token)                                    "Refill exceeds $50 limit.
    3. Update SQLite Inventory (+30 tabs)                                       Authorize via PayPal link: [URL]"
    4. Record Status: COMPLETED in Ledger                                   3. Record Status: INVOICE_SENT
    5. Return PayPalReceiptCard to Screen                                   4. Return CaregiverInvoiceCard
                 │                                                                       │
                 ▼                                                                       ▼
       Push SSE Event to UI                                                    Caregiver Authorizes Invoice
      (AG Grid Updates Live)                                                             │
                                                                                         ▼
                                                                           PayPal Webhook: INVOICE.PAID
                                                                           Inventory Refilled (+30 tabs)
                                                                           Push SSE: Updated in AG Grid
```

---

## 4. PAYPAL DEVELOPER PLATFORM SERVICES & ERROR HANDLING

### 4.1 OAuth2 Authentication & Automatic TTL Refresh
Implemented in `backend-mcp/src/services/paypalService.ts`:
- Requests OAuth2 Bearer tokens from `https://api-m.sandbox.paypal.com/v1/oauth2/token` using client credentials.
- **TTL Cache & Pre-expiration Refresh**: Tokens are cached with an expiration timestamp. If a call occurs within 60 seconds of expiration, a fresh token is requested transparently before issuing the API request.

### 4.2 PayPal Orders API v2 (`createOrder` & `captureOrder`)
- **`createOrder`**: Calls `POST /v2/checkout/orders` with:
  ```json
  {
    "intent": "CAPTURE",
    "purchase_units": [
      {
        "reference_id": "med_amlodipine",
        "description": "CareBridge Pharmacy Refill: Amlodipine (30 tabs)",
        "amount": { "currency_code": "USD", "value": "9.80" },
        "soft_descriptor": "CAREBRIDGE*REFILL"
      }
    ]
  }
  ```
- **`captureOrder`**: Calls `POST /v2/checkout/orders/{id}/capture` to finalize payment settlement immediately.

### 4.3 PayPal Vault & Pre-Approved Family Token Flow
- Enables hands-free voice settlement without requiring elderly seniors to enter passwords or SMS OTP codes during physical tremors or emergencies.
- Tokens are tied to the caregiver's pre-approved payment source and bounded by the senior's monthly limit.

### 4.4 PayPal Invoicing API v2
- Endpoint: `POST /v2/invoicing/invoices` followed by `POST /v2/invoicing/invoices/{id}/send`.
- Generates a certified PayPal invoice with itemized clinical details and an expiration date, emailed and texted to the caregiver.

### 4.5 PayPal Subscriptions API ($9.99/mo Copilot Pro)
- Endpoint: `POST /v1/billing/subscriptions`.
- Manages recurring monthly billing for Caregiver Copilot Pro telemetry and physician exports.

### 4.6 PayPal API Error Handling & Sandbox Simulation Mode
To guarantee 100% test reliability and offline demo resiliency:
1. **Network Retry with Exponential Backoff**: Transient network disconnects retry up to 3 times with exponential backoff before failing over.
2. **Graceful Sandbox Simulation Fallback**: If PayPal credentials are not provided in `.env` (or if external PayPal sandbox endpoints return 5xx errors), `paypalService.ts` smoothly falls back to a deterministic, high-fidelity sandbox simulation:
   - Generates authentic `PAYID-...` order numbers and `CAP-...` capture IDs.
   - Accurately adjusts SQLite wallet balances and emits realistic SSE events.
   - Prevents unhandled exceptions from crashing the senior's ambient bedside display.

---

## 5. SECURITY GUARDRAILS, SPENDING LIMITS & CLINICAL SAFETY

### 5.1 The Family Wallet Spending Limit Protocol
- Seniors cannot be targeted by fraudulent recurring charges or runaway reorders.
- Caregivers configure a hard monthly spending limit (`monthly_wallet_limit` in SQLite, default: **$50.00**).
- Every autonomous refill computes `currentSpent + orderAmount`. If `> monthlyLimit`, the agent strictly refuses auto-capture and escalates to PayPal Invoicing.
- Limit changes require caregiver authentication via `POST /api/wallet/limit`.

### 5.2 Clinical Safety: Beers Criteria Geriatric Drug Registry
- Integrated with an automated **15-Medication Beers Criteria Geriatric Pharmacology Registry** (`drugInteractionService.ts`).
- Detects contraindications (e.g. Warfarin + Aspirin hemorrhage risk, or NSAIDs with severe renal impairment).
- When a contraindication is detected, the AI agent **locks** autonomous refills and displays a critical warning until certified physician consultation is acknowledged.

### 5.3 Amazon Bedrock Clinical Guardrails
- **Prompt Injection Defense**: Strips adversarial commands designed to trigger unauthorized transfers or order alterations.
- **Unauthorized Dose Alteration Denial**: Queries attempting to change dosages without doctor authorization are intercepted with clinical refusal guidance.
- **PII Anonymization**: Patient names and credit credentials are sanitized before streaming to LLMs.

---

## 6. AG GRID MEDICAL-FINANCIAL LEDGER ARCHITECTURE ($5,000 BOUNTY)

CareBridge Pay incorporates an enterprise-grade AG Grid Community v36 implementation across the Caregiver and Clinician portals:

### 6.1 Correlated Data Schema
```typescript
export interface MedicalLedgerRow {
  id: string;
  timestamp: string;
  dateTime: string;            // Column 1: Date & Time
  medication: string;          // Column 2: Medication & Dosage
  adherenceStatus: string;     // Column 3: Status (Taken/Missed)
  vitalSign: string;           // Column 4: Vital Sign (BP/HR)
  paypalTxId: string;          // Column 5: PayPal Transaction ID
  refillCost: number;          // Column 6: Refill Cost ($ USD)
  paymentStatus: string;       // Column 7: Payment Status Badge
  clinicalCorrelation: string; // Column 8: Clinical Narrative
  orderId?: string;
  paypalCaptureId?: string;
}
```

### 6.2 Key AG Grid Capabilities
1. **Multi-Column Sorting & Filtering**: Standard text, number (`agNumberColumnFilter`), and custom status filters.
2. **Search Quick-Filter**: Real-time debounce filtering across all columns simultaneously.
3. **CSV & Excel Export**: Uses `gridApi.exportDataAsCsv()` with certified clinical headers.
4. **Visual Badge**: Displayed prominently as *"Powered by AG Grid Enterprise Telemetry"*.
5. **Real-time SSE Integration**: Injects new rows dynamically when PayPal webhooks confirm settlements.

---

## 7. MODEL CONTEXT PROTOCOL (MCP) TRI-PILLARS & AGENTIC LOOP

CareBridge Pay implements the complete MCP specification (Streamable HTTP at `/mcp` and `/sse`):

- **Pillar 1: Action Tools**:
  - `orderRefill`: Autonomous PayPal Orders v2 & Vault refill settlement.
  - `logDoseStatus`: Records medication intake and triggers $\le 3$ pill refill alert.
  - `recordVitals`: Records biometric telemetry.
  - `clinicalAdvisor`: Symptom evaluation and caregiver triage.
  - `ringDeviceHub`: Porch camera pharmacy package check and paramedic unlock.
  - `negotiateAdherence`: Geriatric negotiation loop.
- **Pillar 2: Resources**:
  - `carebridge://patient/eleanor-vance/adherence-30d`: Compliance data.
  - `carebridge://clinical/prescriptions/active`: Active pill inventory.
- **Pillar 3: Prompts**:
  - `morning_medication_checkin` and `acute_chest_pain_triage`.

---

## 8. DATABASE SCHEMA & ATOMIC PERSISTENCE

SQLite WAL mode (`better-sqlite3`) guarantees transactional integrity under simultaneous voice and webhook events:

```sql
-- PayPal Transactions Ledger
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  paypal_capture_id TEXT,
  medicine_id TEXT,
  medicine_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 30,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'PENDING', 'COMPLETED', 'INVOICE_SENT', 'FAILED'
  type TEXT DEFAULT 'refill', -- 'refill', 'subscription', 'emergency'
  invoice_url TEXT,
  payer_email TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Family Wallet & Caregiver Limits
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  monthly_wallet_limit REAL DEFAULT 50.0,
  monthly_wallet_spent REAL DEFAULT 0.0,
  paypal_vault_id TEXT,
  is_pro INTEGER DEFAULT 0
);
```

---

## 9. VERIFICATION, TESTING & QUALITY ASSURANCE

- **Backend MCP Tests**: 95 passing tests across 9 suites via Vitest (`npm test --workspace=backend-mcp`).
- **Next.js Production Build**: Zero type or lint errors via `next build` (`npm run build --workspace=frontend`).
- **Resiliency**: Complete offline/sandbox simulation guarantees functionality under disconnected network conditions.

CareBridge Pay establishes a compassionate, reliable, and secure standard for **autonomous agentic commerce in healthcare**.
