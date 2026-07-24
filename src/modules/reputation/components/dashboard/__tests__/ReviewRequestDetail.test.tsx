// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ReviewRequestDetail } from '../ReviewRequestDetail';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}));

const mockBaseRequest = {
  id: 'req-1',
  customerName: 'Alice',
  customerEmail: 'alice@example.com',
  customerPhone: null,
  status: 'PENDING',
  source: 'EMAIL',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  openedAt: null,
  completedAt: null,
  expiresAt: null,
  campaign: { id: 'c-1', name: 'Campaign A' },
  branch: { id: 'b-1', name: 'Branch A' },
  feedback: null,
};

describe('ReviewRequestDetail', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders request details and lifecycle timeline', () => {
    render(
      <ReviewRequestDetail
        request={mockBaseRequest}
        businessId="biz-1"
        businessSlug="test-biz"
        availableActions={{ canCancel: true, canExpire: true }}
        displayStatus="PENDING"
      />
    );
    
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    expect(screen.getByText('Campaign A')).toBeDefined();
    expect(screen.getByText('Branch A')).toBeDefined();
    expect(screen.getByText('EMAIL')).toBeDefined();
    
    // Timeline
    expect(screen.getByText('Created & Sent')).toBeDefined();
    expect(screen.getByText('Opened')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('shows actions for PENDING state and handles cancel success', async () => {
    const mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>);
    
    global.confirm = vi.fn(() => true);
    global.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response));

    render(
      <ReviewRequestDetail
        request={mockBaseRequest}
        businessId="biz-1"
        businessSlug="test-biz"
        availableActions={{ canCancel: true, canExpire: true }}
        displayStatus="PENDING"
      />
    );
    
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toBeDefined();
    
    fireEvent.click(cancelBtn);
    
    // Loading state
    expect((cancelBtn as HTMLButtonElement).disabled).toBe(true);
    
    expect(global.confirm).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reputation/requests/req-1?businessId=biz-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' })
      })
    );
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Request cancelled successfully');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('handles mutation failure', async () => {
    global.confirm = vi.fn(() => true);
    global.fetch = vi.fn(() => Promise.resolve({ 
      ok: false, 
      json: () => Promise.resolve({ error: { message: 'Failed to cancel' }}) 
    } as unknown as Response));

    render(
      <ReviewRequestDetail
        request={mockBaseRequest}
        businessId="biz-1"
        businessSlug="test-biz"
        availableActions={{ canCancel: true, canExpire: true }}
        displayStatus="PENDING"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to cancel');
    });
  });

  it('hides actions for COMPLETED state (unsupported action absence)', () => {
    render(
      <ReviewRequestDetail
        request={{ ...mockBaseRequest, status: 'COMPLETED', completedAt: '2026-01-02T00:00:00.000Z' }}
        businessId="biz-1"
        businessSlug="test-biz"
        availableActions={{ canCancel: false, canExpire: false }}
        displayStatus="COMPLETED"
      />
    );
    
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Expire' })).toBeNull();
  });
});
