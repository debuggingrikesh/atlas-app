/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBusiness } from '@/modules/business/components/BusinessProvider';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AISettingsPage() {
  const { currentBusiness } = useBusiness();
  const [tone, setTone] = useState('Professional');
  const [brandDescription, setBrandDescription] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentBusiness) return;
    fetch(`/api/reputation/ai-settings?businessId=${currentBusiness.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setTone(data.tone || 'Professional');
          setBrandDescription(data.brandDescription || '');
          setPreferredLanguage(data.preferredLanguage || 'English');
          setCustomInstructions(data.customInstructions || '');
        }
      })
      .finally(() => setLoading(false));
  }, [currentBusiness]);

  const handleSave = async () => {
    if (!currentBusiness) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reputation/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentBusiness.id,
          tone,
          brandDescription,
          preferredLanguage,
          customInstructions
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }
      toast.success('AI settings saved successfully');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading AI Settings...</div>;

  return (
    <div className="container p-6 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reputation Intelligence Settings</CardTitle>
          <CardDescription>Configure how the AI will analyze customer feedback and draft insights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <select
              id="tone"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={tone}
              onChange={e => setTone(e.target.value)}
            >
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Casual">Casual</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred Language</Label>
            <Input id="preferredLanguage" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} placeholder="e.g. English, Spanish" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandDescription">Brand Description</Label>
            <Input id="brandDescription" value={brandDescription} onChange={e => setBrandDescription(e.target.value)} placeholder="Briefly describe your brand identity" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customInstructions">Custom Instructions</Label>
            <textarea
              id="customInstructions"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="e.g. Keep responses warm and student-focused."
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save AI Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
