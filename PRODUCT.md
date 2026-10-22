# CareBridge Pay — Product Specification & Strategy 💳🩺

> **Comprehensive Product Specification & Agentic Commerce Blueprint**  
> *Targeted for the PayPal AI Hackathon 2026: Agentic Commerce & Best Use of PayPal + AI & AG Grid Sponsor Bounty ($5,000).*

---

## 1. Product Vision & Mission

**CareBridge Pay** transforms in-home ambient smart displays (bedside tablets, countertop hubs, and smart clocks) into a 24/7 proactive healthcare companion and **autonomous commerce station** for independent seniors and remote family caregivers.

### The Problem:
1. **The Senior Medication & Pharmacy Crisis:**
   - Over 50% of elderly adults living independently suffer from polypharmacy (managing 4–8 prescriptions daily).
   - When prescription bottles run dry, physical tremors, mobility limitations, and cognitive fatigue prevent seniors from calling pharmacies or navigating complex smartphone payment flows.
   - Forgetting to reorder blood pressure or heart medications leads directly to avoidable emergency hospital readmissions.
2. **The Flaw with Modern FinTech for Seniors:**
   - Contemporary payment apps are designed for young digital natives: multi-step touch checkouts, CAPTCHAs, small fonts, and SMS OTP verification codes are nearly impossible for seniors with arthritis, low vision, or dementia.
3. **The Disconnected Family Caregiver:**
   - Adult children worry constantly about their parents' pill supply and health stability.
   - Traditional apps offer no transparent, correlated ledger showing *which* vital signs were stabilized by *which* prescription purchase.

### The Solution:
An ambient, voice-first operating system operating 24/7 on a bedside display that couples **clinical AI supervision** with **autonomous PayPal Agentic Commerce**:
- **True Agentic Commerce**: Refills are not triggered by manual button clicks. When a senior logs a dose via voice or touch, the agent audits inventory. When stock drops to $\le 3$ pills, the agent proactively offers to reorder and settles the transaction autonomously using **PayPal Orders API v2** and **pre-approved PayPal Vault tokens**.
- **Family Wallet Limits ($50.00/mo)**: Strict spending limits protect seniors from overcharging. If an order exceeds the limit, it seamlessly escalates to **PayPal Invoicing** with SMS authorization to the caregiver.
- **AG Grid Medical-Financial Ledger ($5,000 Bounty)**: Correlates daily biometric vitals with PayPal order receipts and provides 1-click CSV/Excel export for doctors.

---

## 2. Target User Personas

### Primary Persona: Eleanor Vance (Independent Senior)
- **Age:** 78 years old. Living independently at home.
- **Clinical Regimen:** Amlodipine Besylate 5mg (morning BP), Metformin 500mg (glycemic control), Baby Aspirin 81mg (cardio prophylaxis), Atorvastatin 20mg (cholesterol).
- **Physical Profile:** Mild osteoarthritis in fingers, age-related vision changes (needs WCAG AAA high contrast and large touch targets).
- **Jobs to be Done:**
  - Knows instantly whether morning pills were taken without opening apps.
  - Wants refills to happen automatically without having to read small credit card numbers or remember passwords.
  - Values dignity: wants to live independently without feeling like a burden to her daughter.

### Secondary Persona: Sarah Connor (Remote Adult Daughter & Caregiver)
- **Age:** 48 years old. Working full-time 45 minutes away.
- **Financial Profile:** Manages Eleanor's medical expenses; pre-approves Eleanor's **$50.00 monthly Family Wallet limit** on PayPal.
- **Jobs to be Done:**
  - Real-time peace of mind that Eleanor took pills on time without having to call and nag every morning.
  - Receives instant SMS alerts with 1-tap PayPal authorization links only when refills exceed normal limits.
  - Reviews Eleanor's adherence and blood pressure trends on the AG Grid ledger during lunch breaks.

### Tertiary Persona: Dr. Marcus Reynolds (Attending Primary Care Physician)
- **Role:** Eleanor's physician conducting quarterly telehealth reviews.
- **Jobs to be Done:**
  - Demands verified, auditable 30-day compliance logs and blood pressure correlations.
  - Requires clean CSV/PDF exports without sorting through fragmented pharmacy receipts.

---

## 3. Agentic Commerce Decision Tree & Spending Limits

```
                          [Dose Intake Confirmed]
                        (Touch or Natural Voice)
                                   │
                                   ▼
                      [Inventory Count Audited]
                        stockCount = stock - 1
                                   │
                                   ▼
                      Remaining Stock <= 3 Pills?
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
             NO (> 3)                             YES (<= 3)
                 │                                   │
         Mark Dose: TAKEN                    Trigger Autonomous Low-Stock
         Adherence Streak +1                 Refill Protocol in MCP
                 │                                   │
                 ▼                                   ▼
          Intake Complete                    Proactively Prompt Senior:
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
                 ┌───────────────────────────────────────┴───────────────────────────────────────┐
                 ▼                                                                               ▼
     Within Limit (<= $50.00)                                                         Exceeds Limit (> $50.00)
                 │                                                                               │
    1. Call paypalService.createOrder()                                             1. Call paypalService.createInvoice()
       (intent: CAPTURE, soft descriptor)                                              (itemized dosage & due date)
    2. Call paypalService.captureOrder()                                            2. Dispatch AWS SNS SMS to Sarah:
       (using pre-approved Vault token)                                                "Eleanor's refill exceeds $50 limit.
    3. Update SQLite Inventory (+30 pills)                                              Authorize via PayPal: [URL]"
    4. Record Status: COMPLETED in Ledger                                           3. Record Status: INVOICE_SENT
    5. Return 1-Click PayPalReceiptCard                                             4. Display Invoice Receipt on Screen
                 │                                                                               │
                 ▼                                                                               ▼
       Push SSE Event to UI                                                            Caregiver Approves Invoice
      (AG Grid Updates Live)                                                                     │
                                                                                                 ▼
                                                                                   PayPal Webhook: INVOICE.PAID
                                                                                   Inventory Refilled (+30 pills)
                                                                                   Push SSE: Updated in AG Grid
```

### Spending Limit Rules:
- **Default Senior Limit:** $50.00/month.
- **Limit Adjustments:** Caregivers can modify this limit anytime via the Caregiver Portal modal (`POST /api/wallet/limit`).
- **Fraud & Overcharge Defense:** Even if an LLM is prompted repeatedly, the hard database constraint prevents charges exceeding the wallet ceiling without external caregiver SMS authorization.

---

## 4. Security Guardrails & Clinical Safety

### 4.1 Beers Criteria Geriatric Pharmacology Registry
- 15-drug automated drug interaction filter (`drugInteractionService.ts`).
- Flags lethal contraindications (e.g. Aspirin + Warfarin hemorrhage risk, or NSAIDs with hypertension).
- When a contraindication is detected, autonomous refills are **hard-locked** until explicit physician consultation is certified.

### 4.2 Bedrock Clinical Guardrails & Topic Denial
- **Unauthorized Dose Alteration Denial:** Prompts asking to "double my blood pressure dose" or "stop taking insulin" are intercepted by guardrails with safe clinical guidance.
- **Adversarial Prompt Defense:** Prevents prompt injections from extracting PayPal credentials or rerouting pharmacy shipping addresses.
- **PII Scrubbing:** Patient names and medical records are anonymized prior to cloud inference.

---

## 5. PayPal Developer Platform API Resilience & Error Handling

CareBridge Pay is engineered for 24/7 mission-critical healthcare reliability:

1. **Automatic Token Refresh:** OAuth2 tokens cache expiration TTLs and auto-refresh 60 seconds prior to expiry.
2. **Network Failover & Exponential Backoff:** Transient connectivity drops retry up to 3 times with exponential backoff before failing over.
3. **High-Fidelity Sandbox Simulation:**
   - If external PayPal Sandbox endpoints encounter network outages or missing credentials in `.env`, the system activates an internal deterministic simulation engine.
   - Generates authentic `PAYID-...` identifiers, updates SQLite wallet balances, and delivers SSE events seamlessly.
   - Guarantees zero runtime crashes during live hackathon demos or offline presentations.

---

## 6. AG Grid Medical-Financial Ledger ($5,000 Sponsor Bounty)

CareBridge Pay integrates **AG Grid Community v36** with custom styling for high-frequency clinical telemetry:

- **Columns**: Date/Time, Medication, Status (Taken/Missed), Vital Sign (BP/HR), PayPal Transaction ID, Refill Cost ($ USD), Payment Status Badge, Clinical Correlation.
- **Enterprise Capabilities**: Real-time cross-column search, multi-column sorting, number filters, and 1-click CSV/Excel export.
- **Visual Badge**: Prominently marked as *"Powered by AG Grid Enterprise Telemetry"*.

---

## 7. Commercialization & Business Model

- **CareBridge Family Telemetry Plan ($9.99/mo)**: Managed via the **PayPal Subscriptions API**.
  - Includes unlimited autonomous prescription refills via PayPal Vault.
  - Continuous biometric vitals analysis & AWS SNS emergency SMS dispatch.
  - AG Grid Medical-Financial Ledger with certified doctor PDF reports.
  - 14-day free trial with cancel-anytime peace of mind.
