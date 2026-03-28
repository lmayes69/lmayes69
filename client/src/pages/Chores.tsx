import { useEffect, useState } from 'react';
import { choresApi, kidsApi } from '../lib/api';
import type { Chore, Kid } from '../types';
import { CHORE_FREQUENCIES } from '../types';
import ChoreCard from '../components/ChoreCard';

interface ChoreForm {
  name: string;
  description: string;
  points_value: number;
  frequency: string;
  assigned_kid_id: string;
}

const defaultForm: ChoreForm = {
  name: '',
  description: '',
  points_value: 10,
  frequency: 'daily',
  assigned_kid_id: '',
};

export default function Chores() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [form, setForm] = useState<ChoreForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'one-time'>('all');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [choresData, kidsData] = await Promise.all([
        choresApi.getAll(),
        kidsApi.getAll(),
      ]);
      setChores(choresData);
      setKids(kidsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingChore(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (chore: Chore) => {
    setEditingChore(chore);
    setForm({
      name: chore.name,
      description: chore.description || '',
      points_value: chore.points_value,
      frequency: chore.frequency,
      assigned_kid_id: chore.assigned_kid_id?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        points_value: Number(form.points_value),
        frequency: form.frequency as 'daily' | 'weekly' | 'monthly' | 'one-time',
        assigned_kid_id: form.assigned_kid_id ? Number(form.assigned_kid_id) : null,
        description: form.description || null,
      };

      if (editingChore) {
        await choresApi.update(editingChore.id, payload);
      } else {
        await choresApi.create(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chore: Chore) => {
    if (!confirm(`Delete "${chore.name}"?`)) return;
    try {
      await choresApi.delete(chore.id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (chore: Chore, kidId: number) => {
    try {
      const result = await choresApi.complete(chore.id, kidId);
      const kid = kids.find(k => k.id === kidId);
      setSuccessMsg(`✅ ${kid?.name || 'Kid'} earned ${result.points_earned} points for "${chore.name}"!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to complete chore');
    }
  };

  const filteredChores = filter === 'all' ? chores : chores.filter(c => c.frequency === filter);
  const todayChores = chores.filter(c => c.frequency === 'daily');
  const completedToday = todayChores.filter(c => c.completed_today);
  const pendingToday = todayChores.filter(c => !c.completed_today);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading chores...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">✅ Chores</h1>
        <button onClick={openAddModal} className="btn-primary">
          + Add Chore
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium animate-fade-in">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chores List */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
              {(['all', ...CHORE_FREQUENCIES] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All Chores' : f}
                </button>
              ))}
            </div>

            {filteredChores.length > 0 ? (
              <div className="space-y-3">
                {filteredChores.map(chore => (
                  <ChoreCard
                    key={chore.id}
                    chore={chore}
                    kids={kids}
                    onComplete={handleComplete}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">No chores yet</p>
                <p className="text-sm mt-1">Add chores to get your family organized!</p>
                <button onClick={openAddModal} className="btn-primary mt-4">
                  Add First Chore
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Today's Checklist */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="section-title">📋 Today's Checklist</h2>

            {/* Progress bar */}
            {todayChores.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{completedToday.length} of {todayChores.length} done</span>
                  <span>{Math.round((completedToday.length / todayChores.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedToday.length / todayChores.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {kids.length > 0 ? (
              <div className="space-y-6">
                {kids.map(kid => {
                  const kidChores = todayChores.filter(
                    c => !c.assigned_kid_id || c.assigned_kid_id === kid.id
                  );
                  if (kidChores.length === 0) return null;

                  return (
                    <div key={kid.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{kid.avatar}</span>
                        <span className="font-semibold text-sm" style={{ color: kid.color }}>
                          {kid.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {kid.points} pts
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {kidChores.map(chore => (
                          <div
                            key={chore.id}
                            className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                              chore.completed_today
                                ? 'bg-green-50 text-gray-400'
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className={`text-xs ${chore.completed_today ? 'text-green-500' : 'text-gray-300'}`}>
                              {chore.completed_today ? '✓' : '○'}
                            </span>
                            <span className={chore.completed_today ? 'line-through' : ''}>
                              {chore.name}
                            </span>
                            <span className="ml-auto text-xs text-amber-500">
                              +{chore.points_value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Add kids to see their chore checklist
              </p>
            )}

            {todayChores.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No daily chores assigned
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingChore ? 'Edit Chore' : 'Add New Chore'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Chore Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Make Your Bed"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Optional instructions..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Points Value</label>
                  <input
                    type="number"
                    value={form.points_value}
                    onChange={e => setForm({ ...form, points_value: Number(e.target.value) })}
                    className="input"
                    min={1}
                    max={1000}
                  />
                </div>

                <div>
                  <label className="label">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="input"
                  >
                    {CHORE_FREQUENCIES.map(f => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Assign to Kid (optional)</label>
                <select
                  value={form.assigned_kid_id}
                  onChange={e => setForm({ ...form, assigned_kid_id: e.target.value })}
                  className="input"
                >
                  <option value="">Anyone can do it</option>
                  {kids.map(k => (
                    <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
                  ))}
                </select>
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
                {saving ? 'Saving...' : editingChore ? 'Save Changes' : 'Add Chore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
