# Fease-it: Implementation Plan

## Overview

This document outlines the phased implementation approach for Fease-it MVP.

---

## Phase 1: Foundation (Days 1-2)

### 1.1 Project Setup

- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install dependencies: zustand, recharts, react-hook-form, zod, @react-pdf/renderer
- [ ] Set up project structure (per PRD section 9.2)
- [ ] Configure ESLint and Prettier
- [ ] Create basic layout and header component

**Estimated Time:** 4 hours

### 1.2 Type Definitions

- [ ] Create `src/types/index.ts` with all interfaces from PRD
- [ ] Define validation schemas with Zod

**Estimated Time:** 2 hours

### 1.3 Core UI Components

- [ ] Button component (primary, secondary, ghost variants)
- [ ] Input component (text, number, currency formats)
- [ ] Card component with shadow and border variants
- [ ] Collapsible/Accordion component
- [ ] NumberInput with currency formatting
- [ ] PercentageInput with % suffix

**Estimated Time:** 4 hours

---

## Phase 2: State Management (Day 2-3)

### 2.1 Zustand Store

- [ ] Create `feasibilityStore.ts`
- [ ] Define initial state with default values
- [ ] Implement actions: setInputs, resetInputs, loadFeasibility, saveFeasibility
- [ ] Add localStorage persistence

**Estimated Time:** 3 hours

### 2.2 Form Integration

- [ ] Set up React Hook Form with Zod validation
- [ ] Create form sections matching input panels
- [ ] Implement instant recalculation on input change (debounced)

**Estimated Time:** 4 hours

---

## Phase 3: Calculation Engine (Day 3-4)

### 3.1 Core Calculations

- [ ] `gst.ts` - GST Margin Scheme calculation
- [ ] `profit.ts` - Total revenue, costs, profit, margin
- [ ] `financing.ts` - Loan amount, monthly payments, fees
- [ ] `cashflow.ts` - Monthly cashflow generation
- [ ] `sensitivity.ts` - Variable sensitivity analysis

### 3.2 Calculation Validation

- [ ] Write unit tests for each calculation module
- [ ] Compare outputs against Excel spreadsheet values
- [ ] Validate edge cases (zero values, negative values)

**Estimated Time:** 8 hours

---

## Phase 4: Input Panel (Day 4-5)

### 4.1 Property Inputs Section

- [ ] Purchase price field
- [ ] Land area field
- [ ] Location dropdown (VIC only for MVP)

### 4.2 Development Inputs Section

- [ ] Number of lots/dwellings
- [ ] Construction cost per sqm
- [ ] Demolition cost
- [ ] Town planning percentage
- [ ] Building permits percentage
- [ ] Utilities cost
- [ ] Holding cost percentage
- [ ] Contingency percentage
- [ ] Marketing cost percentage

### 4.3 Financing Inputs Section

- [ ] LVR toggle (70% / 80%)
- [ ] Interest rate input
- [ ] Loan term (months)
- [ ] Establishment fee percentage
- [ ] Broker fee percentage
- [ ] Settlement fee

### 4.4 Revenue Inputs Section

- [ ] Sale price per dwelling
- [ ] GST treatment toggle (Full / Margin Scheme)

**Estimated Time:** 8 hours

---

## Phase 5: Results Panel (Day 5-6)

### 5.1 Summary Cards

- [ ] Purchase price card
- [ ] Cash required card
- [ ] Loan amount card
- [ ] Total revenue card
- [ ] Total costs card
- [ ] Profit card (color-coded: green > 20%, amber 15-20%, red < 15%)
- [ ] Profit margin card

### 5.2 Comparison Table

- [ ] Side-by-side 70% vs 80% LVR comparison
- [ ] Loan amounts
- [ ] Cash required
- [ ] Monthly payments
- [ ] Profit after interest

### 5.3 Cost Breakdown Chart

- [ ] Bar chart showing cost categories
- [ ] Pie chart showing percentage breakdown

### 5.4 Cashflow Table

- [ ] Monthly columns (scrollable)
- [ ] Income, Expenses, Net, Cumulative columns
- [ ] Color-coded positive/negative values

### 5.5 Sensitivity Analysis Table

- [ ] Construction cost sensitivity (±10%, ±20%)
- [ ] Sale price sensitivity (±10%, ±20%)
- [ ] Interest rate sensitivity

**Estimated Time:** 10 hours

---

## Phase 6: Polish & Export (Day 6-7)

### 6.1 Responsive Design

- [ ] Mobile layout for input panel (stack vertically)
- [ ] Mobile layout for results panel
- [ ] Test on iPhone SE (375px width)
- [ ] Fix any overflow issues

### 6.2 Export Features

- [ ] CSV export of all results
- [ ] Copy to clipboard functionality

### 6.3 Local Storage

- [ ] Save feasibility to localStorage
- [ ] Load saved feasibility
- [ ] New feasibility button (reset)

### 6.4 Validation & Error Handling

- [ ] Input validation with error messages
- [ ] Invalid input visual indicators
- [ ] Empty state placeholders

### 6.5 Performance

- [ ] Debounce calculations (300ms)
- [ ] Lazy load charts
- [ ] Optimize bundle size

**Estimated Time:** 6 hours

---

## Phase 7: Testing & Deployment (Day 7)

### 7.1 Testing

- [ ] Manual testing against Excel spreadsheet
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on iOS Safari, Android Chrome
- [ ] Fix any bugs found

### 7.2 Deployment

- [ ] Create Vercel project
- [ ] Configure environment variables (if needed)
- [ ] Deploy to preview URL
- [ ] Test deployed version

### 7.3 Documentation

- [ ] Update README with setup instructions
- [ ] Add comments to complex calculations
- [ ] Create sample data for demo

**Estimated Time:** 4 hours

---

## Task Breakdown Summary

| Phase | Task | Estimated Time | Status |
|-------|------|----------------|--------|
| 1.1 | Project Setup | 4 hours | Pending |
| 1.2 | Type Definitions | 2 hours | Pending |
| 1.3 | UI Components | 4 hours | Pending |
| 2.1 | Zustand Store | 3 hours | Pending |
| 2.2 | Form Integration | 4 hours | Pending |
| 3.1 | Core Calculations | 5 hours | Pending |
| 3.2 | Calculation Tests | 3 hours | Pending |
| 4.1-4.4 | Input Panels | 8 hours | Pending |
| 5.1-5.5 | Results Panels | 10 hours | Pending |
| 6.1-6.5 | Polish & Export | 6 hours | Pending |
| 7.1-7.3 | Testing & Deploy | 4 hours | Pending |

**Total Estimated Time:** ~53 hours (1-2 weeks for 1 developer)

---

## Priority Order

1. **P0 - Must Have (MVP):**
   - Project setup
   - Type definitions
   - Basic UI components
   - State management
   - All input panels
   - Summary cards & comparison table
   - GST margin scheme calculation
   - Profit calculation
   - Loan calculation
   - LocalStorage save/load

2. **P1 - Should Have:**
   - Cashflow table
   - Cost breakdown chart
   - Sensitivity analysis
   - Mobile responsive
   - CSV export

3. **P2 - Nice to Have:**
   - PDF export
   - Build & hold scenario
   - Detailed error handling

---

## Quick Start Commands

```bash
# Day 1 - Setup
cd fease-it
npx create-next-app@latest . --typescript --tailwind --eslint
npm install zustand recharts react-hook-form zod @hookform/resolvers
npm install -D @types/node @types/react @types/react-dom

# Day 2 - Start development
npm run dev
```

---

*Document Status: Draft*
*Last Updated: 2025-05-11*