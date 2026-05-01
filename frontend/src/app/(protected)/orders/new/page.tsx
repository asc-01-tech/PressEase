'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { customersApi, settingsApi, ordersApi, Customer, Pricing } from '@/lib/api';
import { Spinner, formatCurrency } from '@/components/ui';

interface LineItem {
  clothType: string;
  serviceType: string;
  quantity: number;
  price: number;
}

const CLOTH_TYPES = ['Shirt','Pant','Jeans','Saree','Blazer','Kurta','T-Shirt','Dupatta','Bedsheet','Other'];
const SERVICE_TYPES = ['Press', 'Starch'];

export default function NewOrderPage() {
  const router = useRouter();

  // Customer search
  const [customerQuery, setCustomerQuery]   = useState('');
  const [suggestions, setSuggestions]       = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching]           = useState(false);

  // New customer form (if not found)
  const [newCustMode, setNewCustMode]       = useState(false);
  const [newName, setNewName]               = useState('');
  const [newPhone, setNewPhone]             = useState('');
  const [newAddress, setNewAddress]         = useState('');

  // Pricing
  const [pricing, setPricing] = useState<Pricing[]>([]);

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { clothType: 'Shirt', serviceType: 'Press', quantity: 1, price: 14 },
  ]);

  // Notes
  const [notes, setNotes] = useState('');

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    settingsApi.getPricing().then(setPricing).catch(() => {});
  }, []);

  // Debounced customer search
  useEffect(() => {
    if (customerQuery.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await customersApi.search(customerQuery);
        setSuggestions(res);
        setShowSuggestions(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerQuery(c.name);
    setShowSuggestions(false);
    setNewCustMode(false);
  };

  const getPriceFor = useCallback((clothType: string, serviceType: string) => {
    const p = pricing.find(x => x.clothType === clothType && x.serviceType === serviceType);
    return p?.price ?? 0;
  }, [pricing]);

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // Auto-fill price when cloth or service changes
      if (field === 'clothType' || field === 'serviceType') {
        const cloth   = field === 'clothType'   ? String(value) : updated[idx].clothType;
        const service = field === 'serviceType' ? String(value) : updated[idx].serviceType;
        updated[idx].price = getPriceFor(cloth, service);
      }
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { clothType: 'Shirt', serviceType: 'Press', quantity: 1, price: getPriceFor('Shirt', 'Press') }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer && !newCustMode) {
      setError('Please select a customer or create a new one.');
      return;
    }
    if (items.some(i => i.price <= 0)) {
      setError('All items must have a price greater than ₹0.');
      return;
    }

    setLoading(true);
    try {
      let customerId = selectedCustomer?._id;

      // Create new customer if needed
      if (newCustMode) {
        if (!newName || !newPhone) { setError('Name and phone are required for new customer.'); setLoading(false); return; }
        const created = await customersApi.create({ name: newName, phone: newPhone, address: newAddress });
        customerId = created._id;
      }

      const order = await ordersApi.create({
        customerId: customerId!,
        items: items.map(i => ({ clothType: i.clothType, serviceType: i.serviceType, quantity: i.quantity, price: i.price })),
        notes,
      });

      router.push(`/orders/${order._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Create New Order">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Customer Section */}
            <div className="card">
              <div className="card-header">
                <h3>Customer</h3>
                {!newCustMode && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setNewCustMode(true); setSelectedCustomer(null); setCustomerQuery(''); }}>
                    + New Customer
                  </button>
                )}
                {newCustMode && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewCustMode(false)}>
                    Search Existing
                  </button>
                )}
              </div>
              <div className="card-body form-stack">
                {!newCustMode ? (
                  <div className="form-group autocomplete-wrap">
                    <label className="form-label">Search Customer by Name or Phone <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        placeholder="Type name or phone number…"
                        value={customerQuery}
                        onChange={e => { setCustomerQuery(e.target.value); setSelectedCustomer(null); }}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        autoComplete="off"
                      />
                      {searching && (
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                          <Spinner size={16} />
                        </span>
                      )}
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="autocomplete-list">
                        {suggestions.map(c => (
                          <div key={c._id} className="autocomplete-item" onClick={() => selectCustomer(c)}>
                            <div className="ac-name">{c.name}</div>
                            <div className="ac-phone">{c.phone} {c.address ? '· ' + c.address : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedCustomer && (
                      <div style={{ marginTop: 8, padding: '10px 14px', background: '#d1fae5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.1rem' }}>✅</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedCustomer.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedCustomer.phone} · {selectedCustomer.address}</div>
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); }}>✕</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-stack">
                    <div className="form-group" style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: 8 }}>
                      <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0 }}>Creating a new customer. Fill in the details below.</p>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Name <span className="req">*</span></label>
                        <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Customer name" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone <span className="req">*</span></label>
                        <input className="form-input" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="WhatsApp number" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input className="form-input" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Area or full address" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="card">
              <div className="card-header">
                <h3>Clothes &amp; Services</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
                  + Add Item
                </button>
              </div>
              <div className="card-body">
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 70px 90px 80px', gap: 8, marginBottom: 8 }}>
                  {['Cloth Type', 'Service', 'Qty', 'Price (₹)', ''].map(h => (
                    <div key={h} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                  ))}
                </div>

                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 70px 90px 80px', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <select className="form-select" value={item.clothType} onChange={e => updateItem(idx, 'clothType', e.target.value)}>
                      {CLOTH_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="form-select" value={item.serviceType} onChange={e => updateItem(idx, 'serviceType', e.target.value)}>
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      className="form-input"
                      type="number" min="1"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ textAlign: 'center', padding: '10px 6px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>₹</span>
                      <input
                        className="form-input"
                        type="number" min="0" step="0.5"
                        value={item.price}
                        onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                        style={{ padding: '10px 8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                      {items.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItem(idx)}
                          style={{ color: 'var(--danger)', padding: '4px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="divider" />
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Total: {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <div className="card-header"><h3>Order Notes (Optional)</h3></div>
              <div className="card-body">
                <textarea
                  className="form-textarea"
                  placeholder="Any special instructions…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Right Column — Summary */}
          <div style={{ position: 'sticky', top: 76 }}>
            <div className="card">
              <div className="card-header"><h3>Order Summary</h3></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.clothType} — {item.serviceType}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.quantity} × {formatCurrency(item.price)}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(item.quantity * item.price)}</div>
                  </div>
                ))}
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>{formatCurrency(totalAmount)}</span>
                </div>
                <button type="submit" className="btn btn-primary btn-lg btn-w100" disabled={loading}>
                  {loading ? <><Spinner size={18} /> Creating…</> : '✓ Create Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
