'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { ordersApi, Order } from '@/lib/api';
import { StatusBadge, Spinner, formatCurrency, formatDate } from '@/components/ui';

const NEXT_STATUS: Record<string, string> = {
  'Received':         'Processing',
  'Processing':       'Ready for Pickup',
  'Ready for Pickup': 'Delivered',
};

const STATUS_COLORS: Record<string, string> = {
  'Received':         '#3b82f6',
  'Processing':       '#f59e0b',
  'Ready for Pickup': '#10b981',
  'Delivered':        '#64748b',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder]             = useState<Order | null>(null);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState(false);
  const [notifying, setNotifying]     = useState(false);
  const [error, setError]             = useState('');
  const [successMsg, setSuccessMsg]   = useState('');

  useEffect(() => {
    if (!id) return;
    ordersApi.get(id)
      .then(setOrder)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await ordersApi.updateStatus(order._id, newStatus);
      setOrder(updated);

      if ((updated as any).waLink) {
        window.open((updated as any).waLink, '_blank');
      }

      setSuccessMsg(
        newStatus === 'Ready for Pickup'
          ? '✅ Status updated! Opening WhatsApp...'
          : `✅ Status updated to "${newStatus}".`
      );
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const resendNotification = async () => {
    if (!order) return;
    setNotifying(true);
    setError('');
    try {
      const res = await ordersApi.notify(order._id);
      
      if (res.result?.via === 'web' && res.result?.waLink) {
        window.open(res.result.waLink, '_blank');
        setSuccessMsg('📱 Opening WhatsApp Web...');
      } else {
        setSuccessMsg('📱 WhatsApp notification re-sent!');
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Notification failed');
    } finally {
      setNotifying(false);
    }
  };

  const downloadBill = () => {
    window.open(ordersApi.billUrl(order!._id), '_blank');
  };

  if (loading) {
    return (
      <AppLayout title="Order Detail">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={36} /></div>
      </AppLayout>
    );
  }

  if (error && !order) {
    return (
      <AppLayout title="Order Detail">
        <div className="alert alert-danger">{error}</div>
      </AppLayout>
    );
  }

  if (!order) return null;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <AppLayout
      title={`Order ${order.orderNumber}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/orders" className="btn btn-outline btn-sm">← Back</Link>
          <button className="btn btn-outline btn-sm" onClick={downloadBill}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Bill
          </button>
        </div>
      }
    >
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successMsg}</div>}
      {error      && <div className="alert alert-danger"  style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Left: Bill Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Order Meta */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ marginBottom: 2 }}>Order {order.orderNumber}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Created {formatDate(order.createdAt)}
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="card-body">
              {/* Status Timeline */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
                {['Received', 'Processing', 'Ready for Pickup', 'Delivered'].map((s, i, arr) => {
                  const statuses = ['Received', 'Processing', 'Ready for Pickup', 'Delivered'];
                  const orderIdx = statuses.indexOf(order.status);
                  const done = i <= orderIdx;
                  return (
                    <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {i > 0 && (
                        <div style={{
                          position: 'absolute', top: 10, right: '50%', left: '-50%', height: 3,
                          background: done ? STATUS_COLORS[order.status] : '#e2e8f0',
                        }} />
                      )}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', zIndex: 1,
                        background: done ? STATUS_COLORS[order.status] : '#e2e8f0',
                        border: `3px solid ${done ? STATUS_COLORS[order.status] : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: 6, color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: done ? 600 : 400, lineHeight: 1.2 }}>
                        {s}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="card">
            <div className="card-header"><h3>Customer</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</div>
                  <div style={{ fontWeight: 600, marginTop: 3 }}>{order.customer?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div>
                  <div style={{ fontWeight: 500, marginTop: 3 }}>
                    <a href={`https://wa.me/91${order.customer?.phone}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>●</span> {order.customer?.phone}
                    </a>
                  </div>
                </div>
                {order.customer?.address && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div>
                    <div style={{ marginTop: 3, color: 'var(--text-secondary)' }}>{order.customer.address}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <div className="card-header"><h3>Items</h3></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cloth</th>
                    <th>Service</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.clothType}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 99, background: item.serviceType === 'Starch' ? '#e0e7ff' : '#dbeafe', color: item.serviceType === 'Starch' ? '#3730a3' : '#1d4ed8', fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.serviceType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>× {item.quantity}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={3} style={{ fontWeight: 700, paddingLeft: 14 }}>Total</td>
                    <td />
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {order.notes && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 76 }}>
          {/* Status Update */}
          <div className="card">
            <div className="card-header"><h3>Update Status</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Current:</span>
                <StatusBadge status={order.status} />
              </div>
              {nextStatus ? (
                <button
                  className="btn btn-primary btn-w100"
                  onClick={() => updateStatus(nextStatus)}
                  disabled={updating}
                  style={{ background: STATUS_COLORS[nextStatus] }}
                >
                  {updating ? <><Spinner size={16} /> Updating…</> : <>→ Mark as {nextStatus}</>}
                </button>
              ) : (
                <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: 8, textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Order fully completed ✓
                </div>
              )}
              {nextStatus === 'Ready for Pickup' || order.status === 'Ready for Pickup' ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  📱 WhatsApp notification auto-sends on "Ready for Pickup"
                </div>
              ) : null}
            </div>
          </div>

          {/* Bill */}
          <div className="card">
            <div className="card-header"><h3>Bill</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-outline btn-w100" onClick={downloadBill}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF Bill
              </button>
              {order.status === 'Ready for Pickup' || order.status === 'Delivered' ? (
                <button className="btn btn-accent btn-w100" onClick={resendNotification} disabled={notifying}>
                  {notifying ? <><Spinner size={16} /> Sending…</> : <>📱 Resend WhatsApp</>}
                </button>
              ) : null}
            </div>
          </div>

          {/* Quick Info */}
          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Order #', value: order.orderNumber },
                { label: 'Items', value: `${order.items.length} item${order.items.length !== 1 ? 's' : ''}` },
                { label: 'Total Amount', value: formatCurrency(order.totalAmount) },
                { label: 'Date', value: formatDate(order.createdAt) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
