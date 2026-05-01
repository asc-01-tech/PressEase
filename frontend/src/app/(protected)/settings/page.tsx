'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { settingsApi, Pricing } from '@/lib/api';
import { Spinner } from '@/components/ui';

const CLOTH_TYPES = ['Shirt','Pant','Jeans','Saree','Blazer','Kurta','T-Shirt','Dupatta','Bedsheet'];
const SERVICE_TYPES = ['Press', 'Starch'] as const;

export default function SettingsPage() {
  const [pricing, setPricing]     = useState<Pricing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  useEffect(() => {
    settingsApi.getPricing()
      .then(data => {
        setPricing(data);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const getPrice = (cloth: string, service: string) => {
    return pricing.find(p => p.clothType === cloth && p.serviceType === service)?.price ?? 0;
  };

  const setPrice = (cloth: string, service: string, value: number) => {
    setPricing(prev => {
      const idx = prev.findIndex(p => p.clothType === cloth && p.serviceType === service);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], price: value };
        return updated;
      }
      return [...prev, { clothType: cloth, serviceType: service, price: value }];
    });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await settingsApi.updatePricing(pricing);
      setSuccess('✅ Pricing updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      title="Pricing Settings"
      actions={
        <button className="btn btn-primary" onClick={save} disabled={saving || loading}>
          {saving ? <><Spinner size={16} /> Saving…</> : '💾 Save Prices'}
        </button>
      }
    >
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
      {error   && <div className="alert alert-danger"  style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>Service Pricing</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Set price per piece (₹). Prices auto-fill when creating new orders.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cloth Type</th>
                  {SERVICE_TYPES.map(s => <th key={s} style={{ textAlign: 'center' }}>💰 {s} (₹)</th>)}
                </tr>
              </thead>
              <tbody>
                {CLOTH_TYPES.map(cloth => (
                  <tr key={cloth}>
                    <td style={{ fontWeight: 600 }}>{cloth}</td>
                    {SERVICE_TYPES.map(service => (
                      <td key={service} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span style={{ color: 'var(--text-muted)' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={getPrice(cloth, service)}
                            onChange={e => setPrice(cloth, service, parseFloat(e.target.value) || 0)}
                            style={{
                              width: 80, padding: '7px 10px', textAlign: 'center',
                              border: '1.5px solid var(--border)', borderRadius: 8,
                              fontSize: '0.9rem', fontFamily: 'inherit',
                              outline: 'none', background: 'var(--bg)',
                            }}
                            onFocus={e => (e.target.style.borderColor = '#1a6bb5')}
                            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving || loading}>
            {saving ? <><Spinner size={16} /> Saving…</> : '💾 Save All Prices'}
          </button>
        </div>
      </div>

      {/* WhatsApp Config Info */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3>WhatsApp Integration</h3></div>
        <div className="card-body">
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            Configure your Twilio credentials in the backend <code>.env</code> file to enable WhatsApp notifications.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.85rem' }}>
            {[
              { label: 'TWILIO_ACCOUNT_SID', desc: 'Your Twilio Account SID' },
              { label: 'TWILIO_AUTH_TOKEN', desc: 'Your Twilio Auth Token' },
              { label: 'TWILIO_WHATSAPP_FROM', desc: 'Twilio WhatsApp sandbox number' },
              { label: 'SHOP_NAME', desc: 'Your shop name (shown on bills)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--primary)' }}>{item.label}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
