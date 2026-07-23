/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';

export function PlanComparisonTable() {
  const comparisonData = [
    { feature: 'Review Requests', free: '6 lifetime', pro: 'Unlimited' },
    { feature: 'QR Review Sharing', free: 'Yes', pro: 'Yes' },
    { feature: 'WhatsApp Sharing', free: 'Yes', pro: 'Yes' },
    { feature: 'Reputation Intelligence', free: 'No', pro: 'Yes' },
    { feature: 'Advanced Analytics', free: 'No', pro: 'Yes' },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border bg-card text-card-foreground shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 transition-colors">
            <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Feature</th>
            <th className="h-12 px-6 text-center align-middle font-semibold text-muted-foreground w-1/4">Free</th>
            <th className="h-12 px-6 text-center align-middle font-semibold text-muted-foreground w-1/4">Pro</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {comparisonData.map((row) => (
            <tr key={row.feature} className="hover:bg-muted/30 transition-colors">
              <td className="p-6 align-middle font-medium">{row.feature}</td>
              <td className="p-6 align-middle text-center">
                {row.free === 'Yes' ? (
                  <span className="text-emerald-600 font-semibold">✓ Yes</span>
                ) : row.free === 'No' ? (
                  <span className="text-muted-foreground">✕ No</span>
                ) : (
                  <span>{row.free}</span>
                )}
              </td>
              <td className="p-6 align-middle text-center">
                {row.pro === 'Yes' ? (
                  <span className="text-emerald-600 font-semibold">✓ Yes</span>
                ) : row.pro === 'No' ? (
                  <span className="text-muted-foreground">✕ No</span>
                ) : (
                  <span>{row.pro}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
