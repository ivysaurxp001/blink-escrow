export function decodeError(errorData: string): string {
  const errorMap: Record<string, string> = {
    "0xe450d38c": "❌ Insufficient Allowance: Buyer chưa approve đủ token cho contract",
    "0x08c379a0": "❌ Contract Error: Vui lòng kiểm tra lại thông tin",
    "0x118cdaa7": "❌ Access Denied: Chỉ owner mới có thể thực hiện hành động này",
    "0xfb8f41b2": "❌ Invalid Address: Địa chỉ không hợp lệ",
  };

  // Check for known error selectors
  for (const [selector, message] of Object.entries(errorMap)) {
    if (errorData.startsWith(selector)) {
      return message;
    }
  }

  // Check for string errors (0x08c379a0)
  if (errorData.startsWith("0x08c379a0")) {
    try {
      // Decode string error
      const errorString = decodeStringError(errorData);
      return `❌ Contract Error: ${errorString}`;
    } catch {
      return "❌ Contract Error: Không thể decode thông báo lỗi";
    }
  }

  return "❌ Unknown Error: Lỗi không xác định";
}

function decodeStringError(data: string): string {
  // Remove selector (first 10 chars)
  const payload = data.slice(10);
  
  // Decode ABI-encoded string
  // Format: offset (32 bytes) + length (32 bytes) + string data
  const offset = parseInt(payload.slice(0, 64), 16) * 2;
  const length = parseInt(payload.slice(offset, offset + 64), 16);
  const stringData = payload.slice(offset + 64, offset + 64 + length * 2);
  
  return Buffer.from(stringData, 'hex').toString('utf8');
}

export function getFriendlyErrorMessage(error: any): string {
  if (error?.data) {
    return decodeError(error.data);
  }
  
  if (error?.message) {
    if (error.message.includes("insufficient allowance")) {
      return "❌ Insufficient Allowance: Không đủ allowance cho contract";
    }
    if (error.message.includes("insufficient balance")) {
      return "❌ Insufficient Balance: Không đủ token trong ví";
    }
    if (error.message.includes("not ready")) {
      return "❌ Deal Not Ready: Deal chưa sẵn sàng cho hành động này";
    }
    if (error.message.includes("not seller")) {
      return "❌ Access Denied: Chỉ seller mới có thể thực hiện";
    }
    if (error.message.includes("not buyer")) {
      return "❌ Access Denied: Chỉ buyer mới có thể thực hiện";
    }
  }
  
  return `❌ Error: ${error?.message || "Unknown error"}`;
}
