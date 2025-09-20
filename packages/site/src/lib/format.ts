import { formatUnits } from "viem";

export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

export function shortAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatDealState(state: number): string {
  const states = ["None", "Created", "A_Submitted", "B_Submitted", "Ready", "Settled", "Canceled"];
  return states[state] || "Unknown";
}

export function getStateColor(state: number): string {
  const colors = {
    0: "bg-gray-100 text-gray-800", // None
    1: "bg-blue-100 text-blue-800", // Created
    2: "bg-yellow-100 text-yellow-800", // A_Submitted
    3: "bg-orange-100 text-orange-800", // B_Submitted
    4: "bg-green-100 text-green-800", // Ready
    5: "bg-emerald-100 text-emerald-800", // Settled
    6: "bg-red-100 text-red-800", // Canceled
  };
  return colors[state as keyof typeof colors] || "bg-gray-100 text-gray-800";
}
