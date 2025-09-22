# Testing Guide for Blind Escrow

## How to Test the Complete Workflow

### 1. Setup Environment

Create `.env.local` in `packages/site/`:
```bash
NEXT_PUBLIC_FHE_MOCK=true
```

### 2. Test Scenario: Successful Match

**Step 1: Create OPEN Deal (as Seller)**
- Connect wallet as seller
- Go to `/p2p/new` 
- Create OPEN deal with:
  - Asset Amount: 1000 USDC
  - Click "Create P2P Deal"

**Step 2: Submit Ask & Threshold (as Seller)**
- Go to deal page
- Submit Ask: 950
- Submit Threshold: 50
- This means: seller wants 950, accepts bids within ±50

**Step 3: Submit Bid (as Buyer)**
- Switch to different wallet
- Go to same deal page
- Submit Bid: 900
- This means: buyer offers 900

**Step 4: Reveal & Bind**
- Click "Reveal & Bind"
- Expected result: **MATCHED = true**
- Calculation: |900 - 950| = 50 ≤ 50 ✅

### 3. Test Scenario: No Match

**Same setup, but:**
- Seller Ask: 950, Threshold: 20
- Buyer Bid: 900
- Expected result: **MATCHED = false**
- Calculation: |900 - 950| = 50 > 20 ❌

### 4. Understanding the Mock Mode

In mock mode, the system:
1. **Stores values** when you submit ask/bid/threshold
2. **Uses stored values** for reveal calculation
3. **Falls back to defaults** if no stored values:
   - Ask: 950 (realistic seller price)
   - Bid: 800 (realistic buyer price)  
   - Threshold: 50 (reasonable tolerance)

### 5. Debug Information

Check browser console for:
```
🔍 Stored values for deal X: {askClear: 950, bidClear: 900, threshold: 50}
🔍 Mock match calculation: {askClear: 950, bidClear: 900, thresholdClear: 50, diff: 50, matched: true}
```

### 6. Common Issues

**Issue**: "No match found, stopping here"
**Solution**: Check if ask/bid/threshold values are stored correctly

**Issue**: Always getting matched = false
**Solution**: Ensure threshold is large enough to cover the difference between ask and bid

### 7. Expected Values

For a successful test:
- Ask: 950
- Bid: 900-1000 (within threshold)
- Threshold: 50
- Result: matched = true

For a failed test:
- Ask: 950  
- Bid: 800 (outside threshold)
- Threshold: 20
- Result: matched = false
