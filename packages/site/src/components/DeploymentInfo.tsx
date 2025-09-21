'use client';

import { useDeployment } from '@/hooks/useDeployment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function DeploymentInfo() {
  const { deployment, loading, error, getContractAddress, getContractExplorer } = useDeployment();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (text: string, contractName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(contractName);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading deployment data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600">❌ Failed to load deployment data</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deployment) {
    return null;
  }

  const contracts = [
    { name: 'BlindEscrow', label: 'Blind Escrow Contract' },
    { name: 'MockUSDC', label: 'Mock USDC Token' },
    { name: 'MockDAI', label: 'Mock DAI Token' },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Deployment Information</span>
          <Badge variant="info">{deployment.network.toUpperCase()}</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Deployed on {new Date(deployment.deployment.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {contracts.map(({ name, label }) => {
          const address = getContractAddress(name);
          const explorer = getContractExplorer(name);
          const isCopied = copiedAddress === name;

          return (
            <div key={name} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{label}</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(address, name)}
                    className="h-8 px-2"
                  >
                    {isCopied ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span>📋</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(explorer, '_blank')}
                    className="h-8 px-2"
                  >
                    <span>🔗</span>
                  </Button>
                </div>
              </div>
              <p className="text-sm font-mono text-gray-700 break-all">
                {address}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
