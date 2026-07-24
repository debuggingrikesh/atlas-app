// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { ReviewRequestTable } from '../ReviewRequestTable';

const mockRequests = [
  {
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
    campaign: { name: 'Campaign A' },
    branch: { name: 'Branch A' },
  },
  {
    id: 'req-2',
    customerName: 'Bob',
    customerEmail: null,
    customerPhone: '1234567890',
    status: 'COMPLETED',
    source: 'SMS',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    openedAt: '2026-01-02T12:00:00.000Z',
    completedAt: '2026-01-03T00:00:00.000Z',
    expiresAt: null,
    campaign: { name: 'Campaign B' },
    branch: null,
  }
];

describe('ReviewRequestTable', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders request list with proper columns', () => {
    render(<ReviewRequestTable initialRequests={mockRequests} />);
    
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    expect(screen.getAllByText('Campaign A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Branch A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0);
    
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('1234567890')).toBeDefined();
    expect(screen.getAllByText('Campaign B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('COMPLETED').length).toBeGreaterThan(0);
  });

  it('filters by status', () => {
    render(<ReviewRequestTable initialRequests={mockRequests} />);
    
    const completedBtn = screen.getByRole('button', { name: 'COMPLETED' });
    fireEvent.click(completedBtn);
    
    expect(screen.queryByText('Alice')).toBeNull();
    expect(screen.getByText('Bob')).toBeDefined();
  });

  it('filters by campaign', () => {
    render(<ReviewRequestTable initialRequests={mockRequests} />);
    
    const campaignSelect = screen.getByTitle('Campaign');
    fireEvent.change(campaignSelect, { target: { value: 'Campaign A' } });
    
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('filters by branch', () => {
    render(<ReviewRequestTable initialRequests={mockRequests} />);
    
    const branchSelect = screen.getByTitle('Branch');
    fireEvent.change(branchSelect, { target: { value: 'Branch A' } });
    
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('renders empty state when no requests match', () => {
    render(<ReviewRequestTable initialRequests={mockRequests} />);
    
    const expiredBtn = screen.getByRole('button', { name: 'EXPIRED' });
    fireEvent.click(expiredBtn);
    
    expect(screen.getByText('No review requests found for this filter.')).toBeDefined();
  });
});
