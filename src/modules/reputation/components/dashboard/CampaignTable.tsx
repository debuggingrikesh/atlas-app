'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Copy, 
  Edit2, 
  Plus,
  QrCode,
  MessageCircle,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';

interface Campaign {
  id: string;
  name: string;
  status: string;
  googleReviewUrl: string | null;
  publicId: string;
  createdAt: Date | string;
  branch: { name: string } | null;
  _count: { requests: number };
}

interface CampaignTableProps {
  initialCampaigns: Campaign[];
  businessId: string;
  businessName: string;
  branches: { id: string; name: string }[];
  canManage: boolean;
}

export function CampaignTable({ 
  initialCampaigns, 
  businessId, 
  businessName,
  branches,
  canManage 
}: CampaignTableProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  // QR & Link Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrCampaign, setQrCampaign] = useState<Campaign | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isQrModalOpen && canvasRef.current && qrValue) {
      QRCode.toCanvas(canvasRef.current, qrValue, { width: 256, margin: 2 }, (error) => {
        if (error) console.error('[QRCode render error]', error);
      });
    }
  }, [isQrModalOpen, qrValue]);

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setName('');
    setBranchId('');
    setGoogleReviewUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setName(campaign.name);
    setBranchId(campaign.branch ? branches.find(b => b.name === campaign.branch?.name)?.id || '' : '');
    setGoogleReviewUrl(campaign.googleReviewUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCampaign 
        ? `/api/reputation/campaigns/${editingCampaign.id}`
        : '/api/reputation/campaigns';
        
      const method = editingCampaign ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name,
          branchId: branchId || undefined,
          googleReviewUrl: googleReviewUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to save campaign');
      }

      // Refresh list
      if (editingCampaign) {
        setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? {
          ...c,
          name,
          googleReviewUrl: googleReviewUrl || null,
          branch: branchId ? { name: branches.find(b => b.id === branchId)?.name || '' } : null,
        } : c));
        alert('Campaign updated successfully');
      } else {
        const newCampaign = result.data.campaign;
        setCampaigns(prev => [
          {
            ...newCampaign,
            branch: branchId ? { name: branches.find(b => b.id === branchId)?.name || '' } : null,
            _count: { requests: 0 }
          },
          ...prev
        ]);
        alert('Campaign created successfully');
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    if (!canManage) return;

    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const response = await fetch(`/api/reputation/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to toggle status.');
    }
  };

  const generateReviewLink = async (campaign: Campaign, source: 'MANUAL' | 'WHATSAPP' | 'QR') => {
    const response = await fetch('/api/reputation/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        campaignId: campaign.id,
        customerName: 'Quick Customer',
        source,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      if (response.status === 402 || result.error?.message?.includes('limit')) {
        throw new Error('You have used all 6 free review requests. Upgrade your plan to continue.');
      }
      throw new Error(result.error?.message || 'Failed to generate review link. Limit might be reached.');
    }

    const token = result.data.request.token;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/r/${token}`;
  };

  const handleCopyLink = async (campaign: Campaign) => {
    try {
      setIsGenerating(true);
      const link = await generateReviewLink(campaign, 'MANUAL');
      await navigator.clipboard.writeText(link);
      alert(`Review link generated and copied to clipboard!\n${link}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to copy link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQr = async (campaign: Campaign) => {
    try {
      setIsGenerating(true);
      const link = await generateReviewLink(campaign, 'QR');
      setQrCampaign(campaign);
      setQrValue(link);
      setIsQrModalOpen(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to generate QR Code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${qrCampaign?.name || 'review'}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = async (campaign: Campaign) => {
    try {
      setIsGenerating(true);
      const link = await generateReviewLink(campaign, 'WHATSAPP');
      const rawMessage = `Thank you for choosing ${businessName}. We would love your feedback: ${link}`;
      const encodedText = encodeURIComponent(rawMessage);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to generate WhatsApp link.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Campaigns list</h3>
        {canManage && (
          <Button onClick={handleOpenCreate} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No campaigns found. Click &quot;Create Campaign&quot; to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 font-semibold">Campaign Name</th>
                  <th className="p-4 font-semibold">Branch</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Requests Sent</th>
                  <th className="p-4 font-semibold">Created Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-medium">{campaign.name}</td>
                    <td className="p-4 text-muted-foreground">{campaign.branch?.name || 'All Branches'}</td>
                    <td className="p-4">
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-semibold">{campaign._count.requests}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        onClick={() => handleCopyLink(campaign)}
                        variant="ghost"
                        size="icon"
                        title="Copy Review Link"
                        disabled={isGenerating}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleGenerateQr(campaign)}
                        variant="ghost"
                        size="icon"
                        title="Generate QR Code"
                        disabled={isGenerating}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleShareWhatsApp(campaign)}
                        variant="ghost"
                        size="icon"
                        title="Share on WhatsApp"
                        disabled={isGenerating}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            onClick={() => handleToggleStatus(campaign)}
                            variant="ghost"
                            size="icon"
                            title={campaign.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                          >
                            {campaign.status === 'ACTIVE' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleOpenEdit(campaign)}
                            variant="ghost"
                            size="icon"
                            title="Edit Campaign"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold">
              {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Google Review Request"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Branch (Optional)</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Google Review URL (Optional)</label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="https://search.google.com/local/writereview?..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm p-6 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold">Campaign QR Code</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Scan this code to launch the public feedback page
              </p>
            </div>

            <div className="flex justify-center bg-white p-4 rounded-lg border">
              <canvas ref={canvasRef} />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleDownloadQr} className="w-full flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
              <Button onClick={() => setIsQrModalOpen(false)} variant="ghost" className="w-full">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
