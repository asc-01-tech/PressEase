'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { ordersApi, Order } from '@/lib/api';
import { StatusBadge, Spinner, SkeletonRow, formatCurrency, formatDate } from '@/components/ui';

const STATUSES = ['All', 'Received', 'Processing', 'Ready for Pickup', 'Delivered'];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(searchParams.get('status') || 'All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = 1, q = '', st = 'All') => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: '15' };
      if (q)           params.search = q;
      if (st !== 'All') params.status = st;
      const res = await ordersApi.list(params);
      setOrders(res.orders);
      setTotal(res.total);
      setPages(res.pages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, search, status); }, [search, status, load]);

  return (
    <AppLayout
      title="All Orders"
      actions={
        <Link href="/orders/new" className="btn btn-accent btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Order
        </Link>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Search by order#, customer name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
                borderColor: status === s ? 'var(--primary)' : 'var(--border)',
                background: status === s ? 'var(--primary)' : 'var(--bg-card)',
                color: status === s ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{total} order{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th className="hide-mobile">Phone</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="hide-mobile">Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : orders.length === 0
                  ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                          <p>No orders found. <Link href="/orders/new">Create one now.</Link></p>
                        </div>
                      </td>
                    </tr>
                  )
                  : orders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <Link href={`/orders/${order._id}`} style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500 }}>{order.customer?.name}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.customer?.phone}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(order.createdAt)}</td>
                      <td>
                        <Link href={`/orders/${order._id}`} className="btn btn-outline btn-sm">View</Link>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => load(page - 1, search, status)} disabled={page <= 1}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => load(p, search, status)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => load(page + 1, search, status)} disabled={page >= pages}>›</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
