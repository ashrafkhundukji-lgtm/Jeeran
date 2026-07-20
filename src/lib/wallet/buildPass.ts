import { PKPass } from 'passkit-generator'
import { loadWalletCertificates, loadWalletIdentifiers } from './certificates'
import { solidColorPng } from './placeholderIcon'

export interface BuildPassInput {
  serialNumber: string
  title: string
  hostBusinessName: string
  creatorLatitude: number | null
  creatorLongitude: number | null
  barcodeMessage: string
  validationUrl: string
}

// Builds and signs a coupon-style .pkpass in memory (no disk template —
// simpler to deploy on Vercel than bundling a model folder).
//
// Note on geofencing: the PRD asked for a "standard maxDistance: 50 meters
// trigger" on the locations entry. Apple's actual `locations` schema has no
// maxDistance field — that property only exists on `beacons` (iBeacon
// proximity), not GPS locations. The GPS geofence radius for `locations` is
// a fixed, OS-determined range that isn't configurable via pass.json, so
// maxDistance is omitted here rather than set as a no-op.
export async function buildCouponPass(input: BuildPassInput): Promise<Buffer> {
  const certificates = loadWalletCertificates()
  const { teamIdentifier, passTypeIdentifier } = loadWalletIdentifiers()

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName: process.env.WALLET_ORG_NAME || 'Jeeran Network',
    description: input.title,
    serialNumber: input.serialNumber,
    backgroundColor: 'rgb(20,24,31)',
    foregroundColor: 'rgb(255,255,255)',
  }

  const pass = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
      'icon.png': solidColorPng(29, [20, 24, 31]),
      'icon@2x.png': solidColorPng(58, [20, 24, 31]),
    },
    certificates,
    { serialNumber: input.serialNumber },
  )

  pass.type = 'coupon'

  pass.primaryFields.push({ key: 'offer', label: 'Offer', value: input.title })
  pass.auxiliaryFields.push({ key: 'host', label: 'برعاية', value: input.hostBusinessName })
  pass.backFields.push(
    { key: 'terms', label: 'Terms', value: 'Valid at participating Jeeran Network locations. One redemption per pass.' },
    { key: 'validation', label: 'Validation URL', value: input.validationUrl },
    { key: 'instructions', label: 'How to redeem', value: 'Show this pass to staff at the advertiser to redeem.' },
  )

  pass.setBarcodes({ message: input.barcodeMessage, format: 'PKBarcodeFormatQR', altText: input.title })

  if (input.creatorLatitude != null && input.creatorLongitude != null) {
    pass.setLocations({
      latitude: input.creatorLatitude,
      longitude: input.creatorLongitude,
      relevantText: input.title,
    })
  }

  return pass.getAsBuffer()
}
