import { useEffect, useState } from 'react';
import { rewardsApi, kidsApi } from '../lib/api';
import type { Reward, Kid, RewardRedemption } from '../types';
import RewardCard from '../components/RewardCard';
import { format } from 'date-fns';

interface RewardForm {
  name: string;
  description: string;
  points_cost: number;
  image_emoji: string;
  quantity: number | string;
}

const defaultForm: RewardForm = {
  name: '',
  description: '',
  points_cost: 50,
  image_emoji: '🎁',
  quantity: -1,
};

const COMMON_EMOJIS = [
  '🎁', '🍦', '🎬', '📱', '🍕', '⭐', '🎮', '🎯', '🏖️', '🎠',
  '🎪', '🍭', '🏆', '🎉', '💝', '🌟', '🎨', '📚', '🎸', '🐾',
];

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [history, setHistory] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [form, setForm] = useState<RewardForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'history'>('store');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rewardsData, kidsData, historyData] = await Promise.all([
        rewardsApi.getAll(),
        kidsApi.getAll(),
        rewardsApi.getHistory(),
      ]);
      setRewards(rewardsData);
      setKids(kidsData);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingReward(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setForm({
      name: reward.name,
      description: reward.description || '',
      points_cost: reward.points_cost,
      image_emoji: reward.image_emoji,
      quantity: reward.quantity,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.points_cost) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        points_cost: Number(form.points_cost),
        image_emoji: form.image_emoji,
        quantity: form.quantity === '' ? -1 : Number(form.quantity),
      };

      if (editingReward) {
        await rewardsApi.update(editingReward.id, payload);
      } else {
        await rewardsApi.create(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reward: Reward) => {
    if (!confirm(`Delete "${reward.name}"?`)) return;
    try {
      await rewardsApi.delete(reward.id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedeem = async (reward: Reward, kidId: number) => {
    const kid = kids.find(k => k.id === kidId);
    if (!confirm(`Redeem "${reward.name}" for ${kid?.name}? This will cost ${reward.points_cost} points.`)) return;

    try {
      const result = await rewardsApi.redeem(reward.id, kidId);
      setSuccessMsg(`🎉 ${kid?.name} redeemed "${reward.name}"! ${result.points_spent} points spent.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to redeem reward');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🏆 Rewards Store</h1>
        <button onClick={openAddModal} className="btn-primary">
          + Add Reward
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-amber-700 font-medium animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Points summary */}
      {kids.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
          {kids.map(kid => (
            <div
              key={kid.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border flex-shrink-0"
              style={{ backgroundColor: kid.color + '10', borderColor: kid.color + '40' }}
            >
              <span className="text-lg">{kid.avatar}</span>
              <div>
                <p className="text-xs text-gray-500">{kid.name}</p>
                <p className="font-bold text-sm" style={{ color: kid.color }}>
                  {kid.points} pts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'store' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏪 Store ({rewards.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 History ({history.length})
        </button>
      </div>

      {activeTab === 'store' && (
        <>
          {rewards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rewards.map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  kids={kids}
                  onRedeem={handleRedeem}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  isAdmin={true}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No rewards yet</h2>
              <p className="text-gray-500 mb-6">Create rewards that kids can redeem with their earned points!</p>
              <button onClick={openAddModal} className="btn-primary mx-auto">
                Add First Reward
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h2 className="section-title">Redemption History</h2>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{item.image_emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.reward_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.avatar} {item.kid_name} &bull; {format(new Date(item.redeemed_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-500 font-bold">-{item.points_spent}</p>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No redemptions yet</p>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingReward ? 'Edit Reward' : 'Add New Reward'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Emoji preview */}
              <div className="text-center text-6xl py-2">{form.image_emoji}</div>

              <div>
                <label className="label">Choose Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setForm({ ...form, image_emoji: emoji })}
                      className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
                        form.image_emoji === emoji
                          ? 'bg-amber-100 ring-2 ring-amber-400 scale-110'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={form.image_emoji}
                    onChange={e => setForm({ ...form, image_emoji: e.target.value })}
                    className="input text-center text-xl"
                    placeholder="Or type any emoji"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="label">Reward Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Ice Cream Trip"
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
                  placeholder="Details about the reward..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Points Cost *</label>
                  <input
                    type="number"
                    value={form.points_cost}
                    onChange={e => setForm({ ...form, points_cost: Number(e.target.value) })}
                    className="input"
                    min={1}
                  />
                </div>

                <div>
                  <label className="label">Quantity (-1 = unlimited)</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="input"
                    min={-1}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.points_cost}
                className="btn-primary"
              >
                {saving ? 'Saving...' : editingReward ? 'Save Changes' : 'Add Reward'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
