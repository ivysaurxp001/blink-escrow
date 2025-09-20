export type Address = `0x${string}`;

export enum DealState { 
  None = 0, 
  Created = 1, 
  A_Submitted = 2, 
  B_Submitted = 3, 
  Ready = 4, 
  Settled = 5, 
  Canceled = 6 
}

export enum DealMode { 
  P2P = 0, 
  OPEN = 1 
}

export type DealInfo = {
  id: number;
  mode?: DealMode;
  seller: Address;
  buyer: Address;
  assetToken: Address;
  assetAmount: bigint;
  payToken: Address;
  hasAsk: boolean;
  hasBid: boolean;
  hasThreshold: boolean;
  state: DealState;
};

export type RevealResult = {
  matched: boolean;
  askClear: number;
  bidClear: number;
};

export type TokenBalance = {
  balance: string;
  formatted: string;
  symbol: string;
  name: string;
  decimals: number;
};
