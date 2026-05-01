'use client';
import { Order } from '@/lib/api';

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  'Received':         { cls: 'badge-received',   label: 'Received' },
  'Processing':       { cls: 'badge-processing', label: 'Processing' },
  'Ready for Pickup': { cls: 'badge-ready',      label: 'Ready for Pickup' },
  'Delivered':        { cls: 'badge-delivered',  label: 'Delivered' },
};

export function StatusBadge({ status }: { status: Order['status'] }) {
  const s = STATUS_MAP[status] || { cls: 'badge-received', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      style={{ width: size, height: size, animation: 'spin 0.8s linear infinite', display: 'inline-block' }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 0 20" strokeLinecap="round" opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

export function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
      ))}
    </tr>
  );
}
