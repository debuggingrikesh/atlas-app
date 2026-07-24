/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CampaignDashboard } from '../CampaignDashboard';
import { useCampaignMetrics } from '../../../hooks/useCampaignMetrics';
import { toast } from 'sonner';

// Mock the hook
vi.mock('../../../hooks/useCampaignMetrics');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('CampaignDashboard', () => {
  const mockCampaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    branch: { name: 'Main Branch' },
  };
  
  const baseProps = {
    campaign: mockCampaign,
    businessId: 'biz-1',
    businessSlug: 'biz-slug',
    canManage: true,
  };

  const mockMetricsData = {
    overview: {
      totalRequests: 10,
      deliveredRequests: 9,
      openedRequests: 5,
      expiredRequests: 1,
    },
    outcomes: {
      positiveReviews: 4,
      negativeFeedback: 1,
      reviewConversionRate: 55,
    },
    feedback: {
      unresolvedFeedback: 1,
      resolvedFeedback: 2,
      averageResolutionTime: 1.5,
    },
    activity: {
      latestRequestCreatedAt: new Date().toISOString(),
      latestFeedbackCreatedAt: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    vi.mocked(useCampaignMetrics).mockReturnValue({
      state: { status: 'loading' },
      retry: vi.fn(),
    });

    render(<CampaignDashboard {...baseProps} />);
    
    // Check for the skeleton container
    expect(screen.getByLabelText('Loading campaign dashboard')).toBeDefined();
  });

  it('renders error state when fetch fails', () => {
    const mockRetry = vi.fn();
    vi.mocked(useCampaignMetrics).mockReturnValue({
      state: { status: 'error', message: 'Failed to load' },
      retry: mockRetry,
    });

    render(<CampaignDashboard {...baseProps} />);
    
    // Should render the header still
    expect(screen.getByText('Test Campaign')).toBeDefined();
    
    // Should show error alert
    expect(screen.getByText('Failed to load metrics')).toBeDefined();
    expect(screen.getByText('Failed to load')).toBeDefined();
    
    // Should have retry button
    const retryBtn = screen.getByRole('button', { name: 'Retry loading campaign metrics' });
    fireEvent.click(retryBtn);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('renders empty state when total requests is 0', () => {
    vi.mocked(useCampaignMetrics).mockReturnValue({
      state: { 
        status: 'success', 
        data: {
          ...mockMetricsData,
          overview: { ...mockMetricsData.overview, totalRequests: 0 }
        } 
      },
      retry: vi.fn(),
    });

    render(<CampaignDashboard {...baseProps} />);
    
    expect(screen.getByText('No review requests yet')).toBeDefined();
    expect(screen.getByRole('link', { name: /Send First Review Request/i })).toBeDefined();
  });

  it('renders metrics when populated', () => {
    vi.mocked(useCampaignMetrics).mockReturnValue({
      state: { status: 'success', data: mockMetricsData },
      retry: vi.fn(),
    });

    render(<CampaignDashboard {...baseProps} />);
    
    // Overview section
    expect(screen.getByText('Total Requests')).toBeDefined();
    expect(screen.getByLabelText('Total Requests: 10')).toBeDefined();
    expect(screen.getByLabelText('Delivered: 9')).toBeDefined();
    
    // Review Performance section
    expect(screen.getByLabelText('Positive Reviews: 4')).toBeDefined();
    expect(screen.getByLabelText('Conversion Rate: 55%')).toBeDefined();
    
    // Feedback section
    expect(screen.getByLabelText('Unresolved: 1')).toBeDefined();
    expect(screen.getByLabelText('Avg. Resolution Time: 1.5h')).toBeDefined();
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
      global.confirm = vi.fn();
      
      vi.mocked(useCampaignMetrics).mockReturnValue({
        state: { status: 'success', data: mockMetricsData },
        retry: vi.fn(),
      });
    });

    it('pauses and resumes campaign', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      
      render(<CampaignDashboard {...baseProps} />);
      
      const pauseBtn = screen.getByRole('button', { name: 'Pause campaign' });
      fireEvent.click(pauseBtn);
      
      expect(global.fetch).toHaveBeenCalledWith(`/api/reputation/campaigns/${mockCampaign.id}`, expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"status":"PAUSED"'),
      }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Resume campaign' })).toBeDefined();
        expect(screen.getByText('Paused')).toBeDefined(); // The badge updates
      });
    });

    it('duplicates campaign and redirects', async () => {
      const newCampaignId = 'new-campaign-123';
      vi.mocked(global.fetch).mockResolvedValueOnce({ 
        ok: true, 
        json: async () => ({ data: { campaign: { id: newCampaignId } } }) 
      } as Response);
      
      // Mock window.location
      const originalLocation = window.location;
      // @ts-expect-error mocking read-only property
      delete window.location;
      // @ts-expect-error mocking read-only property
      window.location = { href: '' };
      
      render(<CampaignDashboard {...baseProps} />);
      
      const duplicateBtn = screen.getByRole('button', { name: 'Duplicate campaign' });
      fireEvent.click(duplicateBtn);
      
      expect(global.fetch).toHaveBeenCalledWith(`/api/reputation/campaigns/${mockCampaign.id}/duplicate`, expect.objectContaining({
        method: 'POST',
      }));
      
      await waitFor(() => {
        expect(window.location.href).toContain(newCampaignId);
      });
      
      // @ts-expect-error restore location
      window.location = originalLocation;
    });

    it('archives campaign after confirmation', async () => {
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
      
      const originalLocation = window.location;
      // @ts-expect-error mocking read-only property
      delete window.location;
      // @ts-expect-error mocking read-only property
      window.location = { href: '' };
      
      render(<CampaignDashboard {...baseProps} />);
      
      const archiveBtn = screen.getByRole('button', { name: 'Archive campaign' });
      fireEvent.click(archiveBtn);
      
      // Should show loading state while archiving
      expect(screen.getByText('Archiving…')).toBeDefined();
      
      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/reputation/campaigns/${mockCampaign.id}`), expect.objectContaining({
        method: 'DELETE',
      }));
      
      await waitFor(() => {
        expect(window.location.href).toContain('/reputation/campaigns');
      });
      
      // @ts-expect-error restore location
      window.location = originalLocation;
    });

    it('shows error toast on mutation failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
      
      render(<CampaignDashboard {...baseProps} />);
      
      const pauseBtn = screen.getByRole('button', { name: 'Pause campaign' });
      fireEvent.click(pauseBtn);
      
      await waitFor(() => {
        expect(screen.queryByText('Pausing…')).toBeNull();
      });
      
      expect(toast.error).toHaveBeenCalledWith('Failed to update campaign status.');
      // It should still say "Pause campaign" since it failed
      expect(screen.getByRole('button', { name: 'Pause campaign' })).toBeDefined();
    });
  });
});
