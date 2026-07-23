/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { IndustryTemplate } from '@/modules/industry/types';

interface Step3FormProps {
  defaultValue?: string;
  onNext: (data: { industryTemplateId: string }) => void;
  onBack: () => void;
}

export function Step3IndustryForm({ defaultValue, onNext, onBack }: Step3FormProps) {
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [selected, setSelected] = useState<string>(defaultValue ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/industry/templates')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTemplates(json.data.templates);
        } else {
          setError('Failed to load industry templates. Please refresh the page.');
        }
      })
      .catch(() => setError('Failed to load industry templates. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected) {
      onNext({ industryTemplateId: selected });
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading templates…</div>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelected(template.id)}
            className={[
              'rounded-lg border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected === template.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            ].join(' ')}
          >
            <p className="font-medium text-foreground">{template.name}</p>
            {template.description && (
              <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
            )}
          </button>
        ))}
      </div>

      {!selected && (
        <p className="text-xs text-muted-foreground">Select an industry to continue.</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" className="flex-1" disabled={!selected}>
          Continue →
        </Button>
      </div>
    </form>
  );
}
