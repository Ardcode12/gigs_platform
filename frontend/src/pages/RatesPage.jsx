import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { WORKER_CATEGORIES, getCategoryInfo, formatCurrency } from '../constants';
import { Save, Zap, Moon, Info } from 'lucide-react';

const RatesPage = () => {
  const { rates, updateRate } = useSociety();
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [emergency, setEmergency] = useState(true);
  const [nightSurcharge, setNightSurcharge] = useState(true);
  const [saved, setSaved] = useState(false);

  const startEdit = (cat) => {
    const r = rates.find(r => r.category === cat.id) || {};
    setEditing(cat.id);
    setEditValues({ ...r });
  };

  const saveRate = async () => {
    await updateRate(editing, editValues);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-body fade-in">
      <div className="alert alert-info mb-5">
        <Info size={15} />
        Set district-level service rates for all skill categories. Emergency (+25%) and Night Shift (+35%) surcharges are applied on top of base rates when enabled.
      </div>

      {/* Surcharge Toggles */}
      <div className="card mb-5">
        <div className="card-header">
          <div className="card-title">Surcharge Settings</div>
          <div className="card-subtitle">Global modifiers applied to all bookings</div>
        </div>
        <div className="card-body">
          <div className="divider" style={{ margin: '0 0 12px' }} />
          <div className="toggle-wrap">
            <div className="toggle-info">
              <div className="toggle-label"><Zap size={14} style={{ display: 'inline', marginRight: 6 }} /> Emergency Service Surcharge</div>
              <div className="toggle-desc">+25% extra charge for urgent bookings (response within 30 min)</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={emergency} onChange={e => setEmergency(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="divider" />
          <div className="toggle-wrap">
            <div className="toggle-info">
              <div className="toggle-label"><Moon size={14} style={{ display: 'inline', marginRight: 6 }} /> Night Shift Surcharge</div>
              <div className="toggle-desc">+35% extra for bookings between 8 PM – 6 AM</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={nightSurcharge} onChange={e => setNightSurcharge(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
          {saved && (
            <div className="alert alert-success mt-3" style={{ marginBottom: 0 }}>
              ✓ Rate saved successfully!
            </div>
          )}
        </div>
      </div>

      {/* Rate Cards Grid */}
      <div className="grid-2" style={{ gap: 16 }}>
        {WORKER_CATEGORIES.map(cat => {
          const r = rates.find(r => r.category === cat.id) || { baseRate: 0, hourlyRate: 0, dailyRate: 0 };
          const isEditing = editing === cat.id;
          const vals = isEditing ? editValues : r;

          return (
            <div key={cat.id} className="rate-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="rate-cat-icon" style={{ background: cat.bg, color: cat.color }}>
                    <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Service Rate Card</div>
                  </div>
                </div>
                {!isEditing
                  ? <button className="btn btn-secondary btn-sm" onClick={() => startEdit(cat)}>Edit</button>
                  : <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      <button className="btn btn-success btn-sm" onClick={saveRate}><Save size={13} /> Save</button>
                    </div>
                }
              </div>

              <div className="form-grid-3" style={{ gap: 10 }}>
                {[
                  { label: 'Base Rate', key: 'baseRate', hint: 'Per visit' },
                  { label: 'Hourly Rate', key: 'hourlyRate', hint: 'Per hour' },
                  { label: 'Daily Rate', key: 'dailyRate', hint: 'Full day' },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{field.label}</div>
                    {isEditing
                      ? <input
                          className="form-input"
                          type="number"
                          style={{ padding: '6px 10px', fontSize: 13 }}
                          value={vals[field.key] || ''}
                          onChange={e => setEditValues(v => ({ ...v, [field.key]: Number(e.target.value) }))}
                        />
                      : <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{formatCurrency(vals[field.key] || 0)}</div>
                    }
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{field.hint}</div>
                  </div>
                ))}
              </div>

              {/* Surcharge preview */}
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>With surcharges:</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {emergency && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>⚡ Emergency: {formatCurrency(Math.round((vals.baseRate || 0) * 1.25))}</span>}
                  {nightSurcharge && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--violet)' }}>🌙 Night: {formatCurrency(Math.round((vals.baseRate || 0) * 1.35))}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatesPage;
