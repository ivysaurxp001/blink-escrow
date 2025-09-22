# Reveal Fix Guide

## Vấn đề đã được sửa

### ❌ Vấn đề trước đây:
```
Stored values: {bidClear: 100}
Mock calculation: {askClear: 950, bidClear: 100, thresholdClear: 50, diff: 850, matched: false}
```

### ✅ Giải pháp mới:

1. **Lưu giá trị ask và threshold** khi seller tạo deal
2. **Sử dụng giá trị thực tế** thay vì giá trị mặc định
3. **Threshold lớn hơn** để tạo cơ hội match tốt hơn

## Cách test với giá trị thực tế

### Scenario 1: Match thành công

**Bước 1: Seller tạo deal**
- Tạo OPEN deal với ask = 950, threshold = 100
- Giá trị này sẽ được lưu vào `DealValuesContext`

**Bước 2: Buyer submit bid**
- Submit bid = 900
- Giá trị này sẽ được lưu vào `DealValuesContext`

**Bước 3: Reveal**
- Ask: 950 (từ stored values)
- Bid: 900 (từ stored values)
- Threshold: 100 (từ stored values)
- Calculation: |900 - 950| = 50 ≤ 100 ✅ **MATCHED**

### Scenario 2: Không match

**Bước 1: Seller tạo deal**
- Tạo OPEN deal với ask = 950, threshold = 20

**Bước 2: Buyer submit bid**
- Submit bid = 800

**Bước 3: Reveal**
- Ask: 950, Bid: 800, Threshold: 20
- Calculation: |800 - 950| = 150 > 20 ❌ **NO MATCH**

## Debug Information

Khi test, check console logs:

```
✅ Stored ask and threshold values: {askAmount: 950, threshold: 100}
🔍 Stored values for deal 1: {askClear: 950, bidClear: 900, threshold: 100}
🔍 Mock match calculation: {askClear: 950, bidClear: 900, thresholdClear: 100, diff: 50, matched: true}
```

## Lưu ý quan trọng

1. **Giá trị được lưu** khi seller tạo deal với `createOpenWithAsk`
2. **Threshold mặc định** là 100 (thay vì 50) để tạo cơ hội match tốt hơn
3. **Stored values** được ưu tiên sử dụng thay vì giá trị mặc định

## Test với giá trị khác nhau

### Để tạo match:
- Ask: 950, Bid: 900-1050, Threshold: 100
- Hoặc Ask: 1000, Bid: 950-1050, Threshold: 50

### Để tạo no match:
- Ask: 950, Bid: 800, Threshold: 20
- Hoặc Ask: 1000, Bid: 900, Threshold: 50

## Troubleshooting

**Q: Vẫn thấy matched = false?**
A: Kiểm tra threshold có đủ lớn không. Threshold phải ≥ |bid - ask|

**Q: Không thấy stored values?**
A: Đảm bảo seller đã tạo deal với `createOpenWithAsk` (có ask và threshold)

**Q: Giá trị không đúng?**
A: Check console logs để xem giá trị nào đang được sử dụng
