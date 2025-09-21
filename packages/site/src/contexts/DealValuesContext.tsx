'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DealValues {
  [dealId: number]: {
    askClear?: number;
    bidClear?: number;
    threshold?: number;
  };
}

interface DealValuesContextType {
  dealValues: DealValues;
  setDealAsk: (dealId: number, askClear: number) => void;
  setDealBid: (dealId: number, bidClear: number) => void;
  setDealThreshold: (dealId: number, threshold: number) => void;
  getDealValues: (dealId: number) => { askClear?: number; bidClear?: number; threshold?: number };
}

const DealValuesContext = createContext<DealValuesContextType | undefined>(undefined);

export function DealValuesProvider({ children }: { children: ReactNode }) {
  const [dealValues, setDealValues] = useState<DealValues>({});

  const setDealAsk = (dealId: number, askClear: number) => {
    setDealValues(prev => ({
      ...prev,
      [dealId]: {
        ...prev[dealId],
        askClear
      }
    }));
  };

  const setDealBid = (dealId: number, bidClear: number) => {
    setDealValues(prev => ({
      ...prev,
      [dealId]: {
        ...prev[dealId],
        bidClear
      }
    }));
  };

  const setDealThreshold = (dealId: number, threshold: number) => {
    setDealValues(prev => ({
      ...prev,
      [dealId]: {
        ...prev[dealId],
        threshold
      }
    }));
  };

  const getDealValues = (dealId: number) => {
    return dealValues[dealId] || {};
  };

  return (
    <DealValuesContext.Provider value={{
      dealValues,
      setDealAsk,
      setDealBid,
      setDealThreshold,
      getDealValues
    }}>
      {children}
    </DealValuesContext.Provider>
  );
}

export function useDealValues() {
  const context = useContext(DealValuesContext);
  if (context === undefined) {
    throw new Error('useDealValues must be used within a DealValuesProvider');
  }
  return context;
}
