import { useEffect, useState } from 'react';
import { kidsApi } from '../lib/api';
import type { Kid } from '../types';
import { KID_AVATARS, KID_COLORS } from '../types';
import KidCard from '../components/KidCard';
import { format } from 'date-fns';

interface KidForm {
  name: string;
  age: string;
  avatar: string;
  color: string;
}

const defaultForm: KidForm = {
  name: '',
  age: '',
  avatar: '👧',
  color: '#4F46E5',
};

interface KidDetail extends Kid {
  recentCompletions?: any[];
  recentRedemptions?: any[];
}

export default function Kids() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [form, setForm] = useState<KidForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [selectedKid, setSelectedKid] = useState<KidDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadKids();
  }, []);

  const loadKids = async () => {
    try {
      const data = await kidsApi.getAll();
      setKids(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingKid(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (kid: Kid) => {
    setEditingKid(kid);
    setForm({
      name: kid.name,
      age: kid.age?.toString() || '',
      avatar: kid.avatar,
      color: kid.color,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        age: form.age ? Number(form.age) : null,
        avatar: form.avatar,
        color: form.color,
      };

      if (editingKid) {
        await kidsApi.update(editingKid.id, payload);
      } else {
        await kidsApi.create(payload);
      }

      setShowModal(false);
      await loadKids();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kid: Kid) => {
    if (!confirm(`Delete ${kid.name}? This will remove all their chore and reward history.`)) return;
    try {
      await kidsApi.delete(kid.id);
      await loadKids();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewKid = async (kid: Kid) => {
    setLoadingDetail(true);
    setSelectedKid(kid as KidDetail);
    try {
      const detail = await kidsApi.getById(kid.id);
      setSelectedKid(detail as KidDetail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading kids...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">👨‍👧‍👦 Kids</h1>
        <button onClick={openAddModal} className="btn-primary">
          + Add Kid
        </button>
      </div>

      {kids.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kids.map(kid => (
            <KidCard
              key={kid.id}
              kid={kid}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onClick={handleViewKid}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">👨‍👧‍👦</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No kids added yet</h2>
          <p className="text-gray-500 mb-6">Add your kids to start tracking chores and rewards!</p>
          <button onClick={openAddModal} className="btn-primary mx-auto">
            Add Your First Kid
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingKid ? `Edit ${editingKid.name}` : 'Add New Kid'}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Avatar preview */}
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-2 transition-colors"
                  style={{ backgroundColor: form.color + '20', border: `3px solid ${form.color}` }}
                >
                  {form.avatar}
                </div>
              </div>

              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Emma"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                  className="input"
                  placeholder="e.g. 10"
                  min={1}
                  max={18}
                />
              </div>

              <div>
                <label className="label">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {KID_AVATARS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setForm({ ...form, avatar: emoji })}
                      className={`w-10 h-10 text-2xl rounded-xl flex items-center justify-center transition-all ${
                        form.avatar === emoji
                          ? 'ring-2 ring-indigo-500 bg-indigo-50 scale-110'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {KID_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        form.color === color ? 'scale-125 border-gray-800' : 'border-white shadow-sm'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="btn-primary"
              >
                {saving ? 'Saving...' : editingKid ? 'Save Changes' : 'Add Kid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kid Detail Modal */}
      {selectedKid && (
        <div className="modal-overlay" onClick={() => setSelectedKid(null)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div
              className="p-6 text-white"
              style={{ backgroundColor: selectedKid.color }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-4xl">
                  {selectedKid.avatar}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedKid.name}</h2>
                  {selectedKid.age && <p className="opacity-80">Age {selectedKid.age}</p>}
                </div>
                <div className="ml-auto text-center">
                  <div className="text-3xl font-bold">{selectedKid.points}</div>
                  <div className="text-sm opacity-80">points</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingDetail ? (
                <p className="text-gray-400 text-center py-4">Loading history...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Recent Chore Completions */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Recent Chore Completions</h3>
                    {selectedKid.recentCompletions && selectedKid.recentCompletions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedKid.recentCompletions.slice(0, 8).map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{c.chore_name}</span>
                            <div className="text-right">
                              <span className="text-amber-500 font-medium">+{c.points_earned} pts</span>
                              <br />
                              <span className="text-xs text-gray-400">
                                {format(new Date(c.completed_at), 'MMM d')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No completions yet</p>
                    )}
                  </div>

                  {/* Recent Redemptions */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Rewards Redeemed</h3>
                    {selectedKid.recentRedemptions && selectedKid.recentRedemptions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedKid.recentRedemptions.slice(0, 5).map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {r.image_emoji} {r.reward_name}
                            </span>
                            <div className="text-right">
                              <span className="text-red-500 font-medium">-{r.points_spent} pts</span>
                              <br />
                              <span className="text-xs text-gray-400">
                                {format(new Date(r.redeemed_at), 'MMM d')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No rewards redeemed yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedKid(null); openEditModal(selectedKid); }}
                  className="btn-secondary text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { setSelectedKid(null); handleDelete(selectedKid); }}
                  className="btn-danger text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
              <button onClick={() => setSelectedKid(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
