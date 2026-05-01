'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { dashboardApi, Order } from '@/lib/api';
import { StatusBadge, Spinner, formatCurrency, formatDate } from '@/components/ui';

interface Stats {
  todayOrders: number;
  processing: number;
  readyForPickup: number;
  completedToday: number;
  todayRevenue: number;
  recentOrders: Order[];
}

const STAT_CARDS = (s: Stats) => [
  {
    label: "Today's Orders", value: s.todayOrders, icon: '📋',
    color: '#dbeafe', iconBg: '#3b82f6', sub: 'New orders received today',
  },
  {
    label: 'Processing', value: s.processing, icon: '⚙️',
    color: '#fef3c7', iconBg: '#f59e0b', sub: 'Currently being worked on',
  },
  {
    label: 'Ready for Pickup', value: s.readyForPickup, icon: '✅',
    color: '#d1fae5', iconBg: '#10b981', sub: 'Waiting to be collected',
  },
  {
    label: "Today's Revenue", value: formatCurrency(s.todayRevenue), icon: '₹',
    color: '#f3e8ff', iconBg: '#8b5cf6', sub: 'Delivered today',
    isText: true,
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout
      title="Dashboard"
      actions={
        <Link href="/orders/new" className="btn btn-accent btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Order
        </Link>
      }
    >
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={32} />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {stats && (
        <>
          {/* Stat Cards */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {STAT_CARDS(stats).map(card => (
              <div key={card.label} className="stat-card">
                <div className="icon-wrap" style={{ background: card.color }}>
                  <span style={{ fontSize: '1.2rem' }}>{card.icon}</span>
                </div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value" style={card.isText ? { fontSize: '1.4rem' } : undefined}>
                  {card.value}
                </div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="card-header">
              <h3>Today&apos;s Recent Orders</h3>
              <Link href="/orders" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {stats.recentOrders.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                <p>No orders today yet. <Link href="/orders/new">Create your first order</Link></p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order._id}>
                        <td>
                          <Link href={`/orders/${order._id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 500 }}>{order.customer?.name}</td>
                        <td className="text-muted">{order.customer?.phone}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td className="text-muted text-sm">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid-3" style={{ marginTop: 24 }}>
            {[
              { href: '/orders/new', label: 'Create New Order', desc: 'Add a new customer order', icon: '➕', color: 'var(--accent)' },
              { href: '/customers', label: 'Manage Customers', desc: 'View and edit customer info', icon: '👥', color: 'var(--primary)' },
              { href: '/orders?status=Ready for Pickup', label: 'Ready for Pickup', desc: `${stats.readyForPickup} orders waiting`, icon: '🏪', color: '#8b5cf6' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
                  padding: '16px 18px', textDecoration: 'none',
                  transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)',
                }}
                className="stat-card"
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
