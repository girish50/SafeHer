import { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY_FORM = { contact_name: '', relation: '', phone_number: '', email: '', is_primary: false };

export default function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // contact_id or null
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  async function load() {
    const r = await api.get('/api/contacts');
    setContacts(r.data);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY_FORM); setEditing(null); setShowModal(true); }
  function openEdit(c) { setForm({ contact_name: c.contact_name, relation: c.relation || '', phone_number: c.phone_number, email: c.email || '', is_primary: c.is_primary }); setEditing(c.contact_id); setShowModal(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/contacts/${editing}`, form);
        toast.push('Contact updated.', 'success');
      } else {
        await api.post('/api/contacts', form);
        toast.push('Contact added.', 'success');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.push(err?.response?.data?.detail || 'Could not save contact.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contactId) {
    setDeleting(contactId);
    try {
      await api.delete(`/api/contacts/${contactId}`);
      toast.push('Contact removed.', 'success');
      load();
    } catch {
      toast.push('Could not delete contact.', 'error');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Safety network</div>
        <h1 className="page-title">Trusted contacts</h1>
        <p className="page-subtitle">
          These people receive your live location and alert message when an SOS is triggered. Add at least one.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Add contact</button>
      </div>

      {contacts.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">♡</div>
          <p>No trusted contacts yet. Add someone who can check on you in an emergency.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr><th>Name</th><th>Relation</th><th>Phone</th><th>Email</th><th>Primary</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.contact_id}>
                  <td><strong>{c.contact_name}</strong></td>
                  <td>{c.relation || '—'}</td>
                  <td>{c.phone_number}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.is_primary ? '⭐ Primary' : ''}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-ghost" style={{ color: 'var(--color-accent-rose)' }} onClick={() => handleDelete(c.contact_id)} disabled={deleting === c.contact_id}>
                      {deleting === c.contact_id ? '…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editing ? 'Edit contact' : 'Add trusted contact'}</h3>
            <div className="field">
              <label>Full name *</label>
              <input required value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Relation</label>
              <input placeholder="e.g. Mother, Friend" value={form.relation} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} />
            </div>
            <div className="field">
              <label>Phone number *</label>
              <input required value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="is_primary" checked={form.is_primary} onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))} />
              <label htmlFor="is_primary">Mark as primary emergency contact</label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-outline btn-block" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
