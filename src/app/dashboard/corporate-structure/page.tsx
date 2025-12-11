'use client';

import React, { useEffect } from 'react';
import { CorporateStructureEditor, TaxOptimizationPanel } from '@/components/tax';
import { useTaxStore, initializeDemoTaxData } from '@/store/tax-store';
import { Building2, Sparkles } from 'lucide-react';

export default function CorporateStructurePage() {
  // Initialize demo data on mount
  useEffect(() => {
    initializeDemoTaxData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
              <Building2 className="w-6 h-6 text-violet-400" />
            </div>
            Corporate Structure
          </h1>
          <p className="text-gray-400 mt-1">Manage your corporate hierarchy and entities</p>
        </div>
      </div>

      {/* Corporate Structure Editor */}
      <CorporateStructureEditor />
    </div>
  );
}
