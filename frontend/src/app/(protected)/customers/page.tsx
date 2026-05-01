'use client';
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { customersApi, Customer } from '@/lib/api';
import { Spinner, SkeletonRow, formatDate } from '@/components/ui';

function CustomerModal({
  customer, onClose, onSaved,
}: {
  customer?: Customer | null;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}) {
  const isEdit = !!customer;
  const [name, setName]       = useState(customer?.name || '');
  const [phone, setPhone]     = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [notes, setNotes]     = useState(customer?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let saved: Customer;
      if (isEdit && customer) {
        saved = await customersApi.update(customer._id, { name, phone, address, notes });
      } else {
        saved = await customersApi.create({ name, phone, address, notes });
      }
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body form-stack">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name <span className="req">*</span></label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone (WhatsApp) <span className="req">*</span></label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Shop address or area" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes about this customer…" rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size={16} /> Saving…</> : (isEdit ? 'Update Customer' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Customer | null>(null);

  const load = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: '15' };
      if (q) params.search = q;
      const res = await customersApi.list(params);
      setCustomers(res.customers);
      setTotal(res.total);
      setPages(res.pages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, search); }, [search, load]);

  const onSaved = (c: Customer) => {
    setShowModal(false);
    setEditing(null);
    load(1, search);
  };

  return (
    <AppLayout
      title="Customers"
      actions={
        <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowModal(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Customer
        </button>
      }
    >
      {/* Header row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {total} customer{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th className="hide-mobile">Address</th>
                <th className="hide-mobile">Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                : customers.length === 0
                  ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          <p>{search ? 'No customers found for this search.' : 'No customers yet. Add your first customer!'}</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : customers.map((c, idx) => (
                    <tr key={c._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(page - 1) * 15 + idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                          <span style={{ color: '#25D366', fontSize: '0.9rem' }}>●</span> {c.phone}
                        </a>
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.address || '—'}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(c.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setEditing(c); setShowModal(true); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => load(page - 1, search)} disabled={page <= 1}>‹</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => load(p, search)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => load(page + 1, search)} disabled={page >= pages}>›</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          customer={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </AppLayout>
  );
}
