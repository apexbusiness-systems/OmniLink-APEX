-- Web3 Verification Module - Phase 1
-- Migration: Create tables for wallet authentication and entitlement management
-- Author: OmniLink APEX
-- Date: 2026-01-01

-- ========================================
-- Table: wallet_identities
-- Purpose: Map authenticated users to their verified wallet addresses
-- ========================================
CREATE TABLE IF NOT EXISTS public.wallet_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  chain_id integer NOT NULL,
  signature text NOT NULL,
  message text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT wallet_address_format CHECK (wallet_address ~* '^0x[a-f0-9]{40}$'),
  CONSTRAINT chain_id_positive CHECK (chain_id > 0),
  UNIQUE(wallet_address, chain_id)
);

-- Indexes for wallet_identities
CREATE INDEX idx_wallet_identities_user_id ON public.wallet_identities(user_id);
CREATE INDEX idx_wallet_identities_wallet_address ON public.wallet_identities(wallet_address);
CREATE INDEX idx_wallet_identities_chain_id ON public.wallet_identities(chain_id);
CREATE INDEX idx_wallet_identities_verified_at ON public.wallet_identities(verified_at DESC);

-- ========================================
-- Table: wallet_nonces
-- Purpose: Store one-time nonces for signature verification (5-minute TTL)
-- ========================================
CREATE TABLE IF NOT EXISTS public.wallet_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text NOT NULL UNIQUE,
  wallet_address text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT wallet_address_nonce_format CHECK (wallet_address ~* '^0x[a-f0-9]{40}$'),
  CONSTRAINT nonce_not_empty CHECK (length(nonce) > 0),
  CONSTRAINT expires_at_future CHECK (expires_at > created_at)
);

-- Indexes for wallet_nonces
CREATE INDEX idx_wallet_nonces_wallet_address ON public.wallet_nonces(wallet_address);
CREATE INDEX idx_wallet_nonces_nonce ON public.wallet_nonces(nonce) WHERE used_at IS NULL;
CREATE INDEX idx_wallet_nonces_expires_at ON public.wallet_nonces(expires_at) WHERE used_at IS NULL;

-- ========================================
-- Table: entitlements
-- Purpose: Store user/wallet entitlements from various sources
-- ========================================
CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL, -- 'user', 'wallet', 'device'
  subject_id text NOT NULL, -- user_id, wallet_address, device_id
  entitlement_key text NOT NULL, -- e.g., 'nft:0xcontract:tokenid', 'role:premium'
  source text NOT NULL, -- 'chain', 'allowlist', 'admin'
  metadata jsonb DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT subject_type_valid CHECK (subject_type IN ('user', 'wallet', 'device')),
  CONSTRAINT source_valid CHECK (source IN ('chain', 'allowlist', 'admin', 'manual')),
  UNIQUE(subject_type, subject_id, entitlement_key)
);

-- Indexes for entitlements
CREATE INDEX idx_entitlements_subject ON public.entitlements(subject_type, subject_id);
CREATE INDEX idx_entitlements_key ON public.entitlements(entitlement_key);
CREATE INDEX idx_entitlements_source ON public.entitlements(source);
CREATE INDEX idx_entitlements_expires_at ON public.entitlements(expires_at) WHERE expires_at IS NOT NULL;

-- ========================================
-- Table: chain_entitlements_cache
-- Purpose: Cache expensive chain reads with TTL
-- ========================================
CREATE TABLE IF NOT EXISTS public.chain_entitlements_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  chain_id integer NOT NULL,
  query_type text NOT NULL, -- 'nft_balance', 'token_balance', 'contract_call'
  query_params jsonb NOT NULL, -- contract address, token ID, etc.
  data jsonb NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT wallet_address_cache_format CHECK (wallet_address ~* '^0x[a-f0-9]{40}$'),
  CONSTRAINT chain_id_cache_positive CHECK (chain_id > 0),
  UNIQUE(wallet_address, chain_id, query_type, query_params)
);

-- Indexes for chain_entitlements_cache
CREATE INDEX idx_chain_cache_wallet ON public.chain_entitlements_cache(wallet_address, chain_id);
CREATE INDEX idx_chain_cache_refreshed_at ON public.chain_entitlements_cache(refreshed_at DESC);

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================

-- wallet_identities: Users can view/manage their own wallet identities
ALTER TABLE public.wallet_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet identities"
  ON public.wallet_identities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet identities"
  ON public.wallet_identities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallet identities"
  ON public.wallet_identities
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role has full access to wallet_identities"
  ON public.wallet_identities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- wallet_nonces: No direct user access (managed by edge functions)
ALTER TABLE public.wallet_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to wallet_nonces"
  ON public.wallet_nonces
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- entitlements: Users can view their own entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user entitlements"
  ON public.entitlements
  FOR SELECT
  TO authenticated
  USING (
    (subject_type = 'user' AND subject_id = auth.uid()::text)
    OR
    (subject_type = 'wallet' AND subject_id IN (
      SELECT wallet_address FROM public.wallet_identities WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Service role has full access to entitlements"
  ON public.entitlements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- chain_entitlements_cache: Service role only (internal cache)
ALTER TABLE public.chain_entitlements_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to chain_cache"
  ON public.chain_entitlements_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Triggers for updated_at automation
-- ========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_identities_updated_at
  BEFORE UPDATE ON public.wallet_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Cleanup function for expired nonces
-- ========================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
  DELETE FROM public.wallet_nonces
  WHERE expires_at < now() - interval '1 hour'; -- Keep for 1 hour past expiry for audit
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_nonces() TO service_role;

-- ========================================
-- Comments for documentation
-- ========================================

COMMENT ON TABLE public.wallet_identities IS 'Maps authenticated users to verified Web3 wallet addresses';
COMMENT ON TABLE public.wallet_nonces IS 'Temporary nonces for wallet signature verification (5-minute TTL)';
COMMENT ON TABLE public.entitlements IS 'User/wallet entitlements from chain reads, allowlists, or admin grants';
COMMENT ON TABLE public.chain_entitlements_cache IS 'Cache for expensive blockchain RPC calls (10-minute TTL)';

COMMENT ON COLUMN public.wallet_identities.metadata IS 'Additional context: IP, user agent, device_id';
COMMENT ON COLUMN public.entitlements.metadata IS 'Source-specific data: contract address, token ID, block number, etc.';
COMMENT ON COLUMN public.chain_entitlements_cache.query_params IS 'Unique query identifier for cache invalidation';
