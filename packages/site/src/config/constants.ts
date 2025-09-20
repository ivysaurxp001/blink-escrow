import { DealState, DealMode } from "@/lib/types";

export const DEAL_STATE_LABELS: Record<DealState, string> = {
  [DealState.None]: "None",
  [DealState.Created]: "Created",
  [DealState.A_Submitted]: "Ask Submitted",
  [DealState.B_Submitted]: "Bid Submitted", 
  [DealState.Ready]: "Ready to Reveal",
  [DealState.Settled]: "Settled",
  [DealState.Canceled]: "Canceled",
};

export const DEAL_MODE_LABELS: Record<DealMode, string> = {
  [DealMode.P2P]: "P2P",
  [DealMode.OPEN]: "Open Market",
};

export const DEAL_STATE_DESCRIPTIONS: Record<DealState, string> = {
  [DealState.None]: "Deal does not exist",
  [DealState.Created]: "Deal created, waiting for prices",
  [DealState.A_Submitted]: "Seller submitted ask price",
  [DealState.B_Submitted]: "Buyer submitted bid price",
  [DealState.Ready]: "Both prices submitted, ready to reveal",
  [DealState.Settled]: "Deal completed successfully",
  [DealState.Canceled]: "Deal was canceled",
};

export const ROLE_LABELS = {
  SELLER: "Seller",
  BUYER: "Buyer", 
  GUEST: "Guest",
} as const;

export const ACTION_LABELS = {
  CREATE_DEAL: "Create Deal",
  SUBMIT_ASK: "Submit Ask",
  SUBMIT_BID: "Submit Bid", 
  REVEAL: "Reveal Match",
  SETTLE: "Settle Deal",
  CANCEL: "Cancel Deal",
  APPROVE_TOKEN: "Approve Token",
} as const;
