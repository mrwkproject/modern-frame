import QRCode from 'qrcode';

export function generateGuestQrSvg(joinUrl: string) {
  return QRCode.toString(joinUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 512,
    color: { dark: '#1c1917', light: '#ffffff' },
  });
}
