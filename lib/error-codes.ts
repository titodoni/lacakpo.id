// Error Code System for KreasiLog
// Format: ERR_XXX - Module + Sequence Number

export const errorCodes: Record<string, { message: string; description: string; action: string }> = {
  // General Errors (000-099)
  'ERR_001': {
    message: 'Gagal memuat data',
    description: 'Terjadi kesalahan saat mengambil data dari server',
    action: 'Refresh halaman atau coba lagi nanti',
  },
  'ERR_002': {
    message: 'Data tidak valid',
    description: 'Data yang dikirim tidak sesuai format',
    action: 'Periksa kembali input Anda',
  },
  'ERR_003': {
    message: 'Gagal memuat tasks',
    description: 'Tidak dapat mengambil daftar tasks',
    action: 'Coba refresh halaman',
  },
  'ERR_004': {
    message: 'Gagal menghapus PO',
    description: 'Terjadi kesalahan saat menghapus Purchase Order',
    action: 'Coba lagi atau hubungi admin',
  },

  // PO Errors (100-199)
  'ERR_005': {
    message: 'PO tidak ditemukan',
    description: 'Purchase Order yang dicari tidak ada di database',
    action: 'Periksa kembali nomor PO',
  },
  'ERR_006': {
    message: 'Gagal memuat PO',
    description: 'Tidak dapat mengambil detail PO',
    action: 'Coba refresh halaman',
  },
  'ERR_007': {
    message: 'Tidak memiliki akses',
    description: 'Anda tidak memiliki izin untuk melakukan aksi ini',
    action: 'Hubungi admin untuk mendapatkan akses',
  },
  'ERR_008': {
    message: 'Data PO tidak lengkap',
    description: 'Field yang wajib diisi belum lengkap',
    action: 'Lengkapi semua field yang ditandai dengan *',
  },
  'ERR_009': {
    message: 'PO tidak ditemukan',
    description: 'PO yang akan diupdate tidak ada',
    action: 'Refresh halaman atau cek kembali',
  },
  'ERR_010': {
    message: 'Nomor PO sudah ada',
    description: 'Nomor PO ini sudah digunakan oleh PO lain',
    action: 'Gunakan nomor PO yang berbeda',
  },
  'ERR_011': {
    message: 'Gagal mengupdate PO',
    description: 'Terjadi kesalahan saat menyimpan perubahan PO',
    action: 'Coba lagi nanti',
  },
  'ERR_012': {
    message: 'Tidak memiliki akses',
    description: 'Hanya admin dan manager yang bisa menghapus PO',
    action: 'Hubungi admin jika perlu menghapus PO',
  },
  'ERR_013': {
    message: 'PO tidak ditemukan',
    description: 'PO yang akan dihapus tidak ada',
    action: 'Refresh halaman',
  },
  'ERR_014': {
    message: 'Gagal menghapus PO',
    description: 'Terjadi kesalahan saat proses penghapusan',
    action: 'Coba lagi nanti',
  },
  'ERR_015': {
    message: 'Gagal memuat data PO',
    description: 'Tidak dapat mengambil data untuk edit',
    action: 'Coba refresh halaman',
  },
  'ERR_016': {
    message: 'Gagal mengupdate PO',
    description: 'Terjadi kesalahan saat menyimpan perubahan',
    action: 'Coba lagi nanti',
  },

  // Finance Errors (200-299)
  'ERR_017': {
    message: 'Tidak memiliki akses',
    description: 'Hanya Finance yang bisa update status finance',
    action: 'Hubungi bagian Finance',
  },
  'ERR_018': {
    message: 'PO tidak ditemukan',
    description: 'PO untuk update finance tidak ada',
    action: 'Refresh halaman',
  },
  'ERR_019': {
    message: 'Gagal update finance',
    description: 'Terjadi kesalahan saat update status finance',
    action: 'Coba lagi nanti',
  },
  'ERR_020': {
    message: 'Gagal update finance',
    description: 'Tidak dapat mengupdate status invoicing/payment',
    action: 'Coba lagi atau hubungi admin',
  },

  // User/Auth Errors (300-399)
  'ERR_021': {
    message: 'Gagal memuat users',
    description: 'Tidak dapat mengambil daftar user',
    action: 'Refresh halaman',
  },
  'ERR_022': {
    message: 'Pencarian gagal',
    description: 'Terjadi kesalahan saat mencari',
    action: 'Coba dengan keyword yang berbeda',
  },

  // Track/Progress Errors (400-499)
  'ERR_023': {
    message: 'Vendor Job aktif',
    description: 'PO ini dikerjakan vendor, production tidak bisa update',
    action: 'Hubungi admin jika perlu update',
  },

  // Delivery Errors (500-599)
  'ERR_024': {
    message: 'Item tidak ditemukan',
    description: 'Item untuk delivery tidak ditemukan',
    action: 'Refresh halaman',
  },
  'ERR_025': {
    message: 'Quantity melebihi sisa',
    description: 'Quantity yang akan dikirim melebihi sisa yang belum dikirim',
    action: 'Kurangi quantity',
  },
  'ERR_026': {
    message: 'Gagal mencatat delivery',
    description: 'Terjadi kesalahan saat mencatat pengiriman',
    action: 'Coba lagi nanti',
  },
  'ERR_027': {
    message: 'Gagal memuat delivery',
    description: 'Tidak dapat mengambil data pengiriman',
    action: 'Refresh halaman',
  },
};

// Helper function to get error details
export function getErrorDetails(code: string): { message: string; description: string; action: string } {
  return errorCodes[code] || {
    message: 'Terjadi kesalahan',
    description: 'Error tidak dikenal',
    action: 'Hubungi admin',
  };
}

// Helper to display user-friendly error
export function formatErrorMessage(error: string | { error?: string; message?: string }): string {
  if (typeof error === 'string') {
    const details = getErrorDetails(error);
    return `${details.message} (${error})`;
  }
  
  if (error.error && errorCodes[error.error]) {
    const details = getErrorDetails(error.error);
    return `${details.message} (${error.error})`;
  }
  
  return error.message || 'Terjadi kesalahan';
}
