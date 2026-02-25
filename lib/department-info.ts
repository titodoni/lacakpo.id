// Department explanations and guidelines
export const departmentExplanations: Record<string, { title: string; description: string; milestones: string[] }> = {
  drafting: {
    title: 'Drafting',
    description: 'Progress 100% ketika gambar sudah ACC (Approved) oleh client',
    milestones: [
      '0% - Belum mulai',
      '25% - Draft awal',
      '50% - Gambar 2D/3D',
      '75% - Review internal',
      '100% - Gambar ACC client',
    ],
  },
  purchasing: {
    title: 'Purchasing',
    description: 'Progress 100% ketika material sudah tiba di gudang',
    milestones: [
      '0% - Belum mulai',
      '25% - RFQ ke supplier',
      '50% - PO ke supplier',
      '75% - Material OTW',
      '100% - Material tiba di gudang',
    ],
  },
  production: {
    title: 'Production',
    description: 'Progress 100% ketika item selesai dikerjakan dan siap QC',
    milestones: [
      '0% - Belum mulai',
      '25% - Setup mesin',
      '50% - Proses machining/fabrication',
      '75% - Finishing',
      '100% - Selesai produksi',
    ],
  },
  qc: {
    title: 'Quality Control',
    description: 'Progress 100% ketika item lolos QC dan siap kirim',
    milestones: [
      '0% - Belum mulai',
      '25% - Inspeksi dimensi',
      '50% - Inspeksi visual',
      '75% - Testing (jika ada)',
      '100% - Lolos QC, siap kirim',
    ],
  },
  delivery: {
    title: 'Delivery',
    description: 'Progress 100% ketika item sudah terkirim ke client',
    milestones: [
      '0% - Belum siap kirim',
      '25% - Persiapan dokumen',
      '50% - Packing',
      '75% - Dalam pengiriman',
      '100% - Terkirim ke client',
    ],
  },
};

export function getDepartmentExplanation(department: string): string {
  return departmentExplanations[department]?.description || '';
}

export function getDepartmentMilestones(department: string): string[] {
  return departmentExplanations[department]?.milestones || [];
}
