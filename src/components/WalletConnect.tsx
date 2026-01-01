/**
 * Wallet Connect Component
 *
 * Purpose: UI for wallet connection and verification
 *
 * Features:
 *   - Connect wallet button
 *   - Verify wallet signature
 *   - Display verification status
 *   - Disconnect wallet
 *
 * Author: OmniLink APEX
 * Date: 2026-01-01
 */

import React from 'react';
import { useConnect, useAccount } from 'wagmi';
import { useWalletVerification } from '@/hooks/useWalletVerification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export function WalletConnect() {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { walletState, verify, disconnect, address } = useWalletVerification();

  /**
   * Render wallet status badge
   */
  const renderStatusBadge = () => {
    switch (walletState.status) {
      case 'disconnected':
        return <Badge variant="outline">Not Connected</Badge>;
      case 'connecting':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting...
          </Badge>
        );
      case 'connected':
        return <Badge variant="secondary">Connected</Badge>;
      case 'verifying':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verifying...
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  /**
   * Format wallet address for display
   */
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Web3 Wallet
            </CardTitle>
            <CardDescription>Connect and verify your wallet</CardDescription>
          </div>
          {renderStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {walletState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{walletState.error}</AlertDescription>
          </Alert>
        )}

        {/* Not Connected State */}
        {!isConnected && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to access Web3 features
            </p>
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => connect({ connector })}
                disabled={isPending}
                variant="outline"
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Connect {connector.name}</>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Connected but not verified */}
        {isConnected && !walletState.isVerified && walletState.status !== 'verifying' && (
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
              <p className="text-sm font-mono">{address && formatAddress(address)}</p>
              {walletState.chainId && (
                <p className="text-xs text-muted-foreground mt-1">Chain ID: {walletState.chainId}</p>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your wallet is connected but not verified. Please sign a message to verify ownership.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={verify} className="flex-1" disabled={walletState.status === 'verifying'}>
                {walletState.status === 'verifying' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Wallet'
                )}
              </Button>
              <Button onClick={disconnect} variant="outline">
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Verifying State */}
        {walletState.status === 'verifying' && (
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Verifying your wallet...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please sign the message in your wallet
              </p>
            </div>
          </div>
        )}

        {/* Verified State */}
        {walletState.isVerified && (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Wallet Verified
                </p>
              </div>
              <p className="text-sm font-mono text-green-800 dark:text-green-200">
                {address && formatAddress(address)}
              </p>
              {walletState.chainId && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Chain ID: {walletState.chainId}
                </p>
              )}
            </div>

            <Button onClick={disconnect} variant="outline" className="w-full">
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
