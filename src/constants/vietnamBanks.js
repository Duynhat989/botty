/**
 * Mã NH thường dùng trong VietQR / Pay2S quicklink (path URL).
 * Nguồn: bảng mã Napas / các cổng thanh toán phổ biến VN — có thể khác tên viết tắt từng cổng.
 */
export const VIETNAM_BANKS = [
  { code: 'ICB', name: 'VietinBank — Ngân hàng TMCP Công thương Việt Nam', shortName: 'VietinBank' },
  { code: 'VCB', name: 'Vietcombank — Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV — Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV' },
  { code: 'TCB', name: 'Techcombank — Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank' },
  { code: 'MB', name: 'MBBank — Ngân hàng TMCP Quân đội', shortName: 'MBBank' },
  { code: 'VPB', name: 'VPBank — Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { code: 'ACB', name: 'ACB — Ngân hàng TMCP Á Châu', shortName: 'ACB' },
  { code: 'STB', name: 'Sacombank — Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank' },
  { code: 'HDB', name: 'HDBank — Ngân hàng TMCP Phát triển TP.HCM', shortName: 'HDBank' },
  { code: 'MSB', name: 'MSB — Ngân hàng TMCP Hàng Hải', shortName: 'MSB' },
  { code: 'TPB', name: 'TPBank — Ngân hàng TMCP Tiên Phong', shortName: 'TPBank' },
  { code: 'SHB', name: 'SHB — Ngân hàng TMCP Sài Gòn — Hà Nội', shortName: 'SHB' },
  { code: 'VIB', name: 'VIB — Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB' },
  { code: 'EIB', name: 'Eximbank — Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', shortName: 'Eximbank' },
  { code: 'SEAB', name: 'SeABank — Ngân hàng TMCP Đông Nam Á', shortName: 'SeABank' },
  { code: 'OCB', name: 'OCB — Ngân hàng TMCP Phương Đông', shortName: 'OCB' },
  { code: 'LPB', name: 'LPBank — Ngân hàng TMCP Bưu điện Liên Việt', shortName: 'LPBank' },
  { code: 'NAB', name: 'Nam A Bank — Ngân hàng TMCP Nam Á', shortName: 'Nam A Bank' },
  { code: 'ABB', name: 'ABBank — Ngân hàng TMCP An Bình', shortName: 'ABBank' },
  { code: 'BAB', name: 'Bac A Bank — Ngân hàng TMCP Bắc Á', shortName: 'Bac A Bank' },
  { code: 'VAB', name: 'VietABank — Ngân hàng TMCP Việt Á', shortName: 'VietABank' },
  { code: 'PGB', name: 'PGBank — Ngân hàng TMCP Xăng dầu Petrolimex', shortName: 'PGBank' },
  { code: 'GPB', name: 'GPBank — Ngân hàng Thương mại TNHH MTV Dầu khí Toàn cầu', shortName: 'GPBank' },
  { code: 'BVB', name: 'BaoViet Bank — Ngân hàng TMCP Bảo Việt', shortName: 'BaoViet Bank' },
  { code: 'KLB', name: 'Kienlongbank — Ngân hàng TMCP Kiên Long', shortName: 'Kienlongbank' },
  { code: 'IVB', name: 'Indovina Bank — Ngân hàng TNHH Indovina', shortName: 'Indovina' },
  { code: 'VRB', name: 'VRB — Ngân hàng Liên doanh Việt — Nga', shortName: 'VRB' },
  { code: 'CBB', name: 'CBBank — Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam', shortName: 'CBBank' },
  { code: 'COOPBANK', name: 'Co-opBank — Ngân hàng Hợp tác xã Việt Nam', shortName: 'Co-opBank' },
  { code: 'SGICB', name: 'SaigonBank — Ngân hàng TMCP Sài Gòn Công Thương', shortName: 'SaigonBank' },
  { code: 'NCB', name: 'NCB — Ngân hàng TMCP Quốc Dân', shortName: 'NCB' },
  { code: 'PVCB', name: 'PVcomBank — Ngân hàng TMCP Đại Chúng Việt Nam', shortName: 'PVcomBank' },
  { code: 'VIETBANK', name: 'VietBank — Ngân hàng TMCP Việt Nam Thương Tín', shortName: 'VietBank' },
  { code: 'CAKE', name: 'CAKE — Ngân hàng số CAKE by VPBank', shortName: 'CAKE' },
  { code: 'UBANK', name: 'Ubank — Ngân hàng số Ubank by VPBank', shortName: 'Ubank' },
  { code: 'TIMO', name: 'Timo — Timo by BVBank', shortName: 'Timo' },
  { code: 'VCCB', name: 'BVBank — Ngân hàng TMCP Bản Việt', shortName: 'BVBank' },
  { code: 'WVN', name: 'Woori Bank — Ngân hàng Woori Việt Nam', shortName: 'Woori' },
  { code: 'SHBVN', name: 'Shinhan Bank — Ngân hàng Shinhan Việt Nam', shortName: 'Shinhan' },
  { code: 'HSBC', name: 'HSBC — HSBC Việt Nam', shortName: 'HSBC' },
  { code: 'SCVN', name: 'Standard Chartered — Standard Chartered Việt Nam', shortName: 'Standard Chartered' },
  { code: 'UOB', name: 'UOB — United Overseas Bank Việt Nam', shortName: 'UOB' },
  { code: 'PBVN', name: 'Public Bank — Public Bank Việt Nam', shortName: 'Public Bank' },
  { code: 'CIMB', name: 'CIMB — CIMB Việt Nam', shortName: 'CIMB' },
  { code: 'DBS', name: 'DBS — DBS Bank Việt Nam', shortName: 'DBS' },
  { code: 'IBK', name: 'IBK — Ngân hàng Công nghiệp Hàn Quốc Chi nhánh HN', shortName: 'IBK HN' },
  { code: 'KBHN', name: 'Kookmin Bank — Chi nhánh Hà Nội', shortName: 'Kookmin HN' },
  { code: 'KBHCM', name: 'Kookmin Bank — Chi nhánh TP.HCM', shortName: 'Kookmin HCM' },
  { code: 'NHB', name: 'Nonghyup — Ngân hàng Nonghyup Chi nhánh HN', shortName: 'Nonghyup' },
  { code: 'HLBVN', name: 'Hong Leong Bank — Hong Leong Việt Nam', shortName: 'Hong Leong' },
  { code: 'CITIBANK', name: 'Citibank — Citibank Việt Nam', shortName: 'Citibank' },
]

const codeSet = new Set(VIETNAM_BANKS.map((b) => b.code))

export function findBankByCode(code) {
  const c = String(code || '').trim().toUpperCase()
  return VIETNAM_BANKS.find((b) => b.code === c) || null
}

export function resolveBankCode(code) {
  const c = String(code || '').trim().toUpperCase()
  if (codeSet.has(c)) return c
  return 'ICB'
}

export function defaultBankNameForCode(code) {
  return findBankByCode(code)?.shortName || String(code || 'ICB')
}