'use client';

import { useState, useEffect } from 'react';

interface DeploymentData {
  network: string;
  chainId: string;
  deployment: {
    timestamp: string;
    contracts: {
      BlindEscrow: {
        address: string;
        explorer: string;
      };
      MockUSDC: {
        address: string;
        explorer: string;
      };
      MockDAI: {
        address: string;
        explorer: string;
      };
    };
  };
}

export function useDeployment() {
  const [deployment, setDeployment] = useState<DeploymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeployment = async () => {
      try {
        setLoading(true);
        const response = await fetch('/deployment.json');
        if (!response.ok) {
          throw new Error(`Failed to load deployment: ${response.statusText}`);
        }
        const data = await response.json();
        setDeployment(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load deployment data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadDeployment();
  }, []);

  return {
    deployment,
    loading,
    error,
    // Helper functions
    getContractAddress: (contractName: keyof DeploymentData['deployment']['contracts']) => {
      return deployment?.deployment.contracts[contractName]?.address || '';
    },
    getContractExplorer: (contractName: keyof DeploymentData['deployment']['contracts']) => {
      return deployment?.deployment.contracts[contractName]?.explorer || '';
    },
  };
}
