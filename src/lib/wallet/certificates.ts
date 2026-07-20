export class WalletNotConfiguredError extends Error {
  constructor(message = 'Wallet signing is not configured') {
    super(message)
    this.name = 'WalletNotConfiguredError'
  }
}

// Apple Developer Pass Type ID certificate + private key, converted to PEM
// and base64-encoded (see supabase/../wiki "Generating Certificates" — an
// openssl pkcs12 export from the .p12 downloaded from the Apple Developer
// portal). Stored as base64 env vars rather than files so this survives
// Vercel's env var storage without newline-mangling issues.
export function loadWalletCertificates() {
  const { WALLET_SIGNER_CERT_B64, WALLET_SIGNER_KEY_B64, WALLET_WWDR_B64, WALLET_SIGNER_KEY_PASSPHRASE } = process.env

  if (!WALLET_SIGNER_CERT_B64 || !WALLET_SIGNER_KEY_B64 || !WALLET_WWDR_B64) {
    throw new WalletNotConfiguredError()
  }

  return {
    signerCert: Buffer.from(WALLET_SIGNER_CERT_B64, 'base64'),
    signerKey: Buffer.from(WALLET_SIGNER_KEY_B64, 'base64'),
    wwdr: Buffer.from(WALLET_WWDR_B64, 'base64'),
    signerKeyPassphrase: WALLET_SIGNER_KEY_PASSPHRASE,
  }
}

export function loadWalletIdentifiers() {
  const { WALLET_TEAM_IDENTIFIER, WALLET_PASS_TYPE_IDENTIFIER } = process.env
  if (!WALLET_TEAM_IDENTIFIER || !WALLET_PASS_TYPE_IDENTIFIER) {
    throw new WalletNotConfiguredError()
  }
  return { teamIdentifier: WALLET_TEAM_IDENTIFIER, passTypeIdentifier: WALLET_PASS_TYPE_IDENTIFIER }
}
