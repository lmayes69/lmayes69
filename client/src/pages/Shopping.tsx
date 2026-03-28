import { useEffect, useState } from 'react';
import { shoppingApi } from '../lib/api';
import type { ShoppingItem } from '../types';
import { SHOPPING_CATEGORIES } from '../types';

interface ShoppingForm {
  name: string;
  quantity: string;
  category: string;
  notes: string;
}

const defaultForm: ShoppingForm = {
  name: '',
  quantity: '1',
  category: 'General',
  notes: '',
};

export default function Shopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'manual' | 'microsoft_todo'>('manual');
  const [form, setForm] = useState<ShoppingForm>(defaultForm);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const source = activeTab === 'manual' ? undefined : activeTab;
      const data = await shoppingApi.getAll(source);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setAdding(true);
    try {
      if (activeTab === 'microsoft_todo') {
        await shoppingApi.pushToMicrosoftTodo({ name: form.name, category: form.category });
      } else {
        await shoppingApi.create({
          name: form.name,
          quantity: form.quantity,
          category: form.category,
          notes: form.notes || undefined,
          list_source: 'manual',
        });
      }
      setForm(defaultForm);
      await loadItems();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to add item');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    try {
      await shoppingApi.update(item.id, { completed: item.completed ? 0 : 1 });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: i.completed ? 0 : 1 } : i));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (item: ShoppingItem) => {
    try {
      await shoppingApi.delete(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCompleted = async () => {
    if (!confirm('Clear all completed items?')) return;
    try {
      await shoppingApi.clearCompleted();
      await loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setErrorMsg('');
    try {
      if (activeTab === 'microsoft_todo') {
        const result = await shoppingApi.syncMicrosoftTodo();
        setSuccessMsg(`Synced ${result.synced} items from Microsoft To Do!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        await loadItems();
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Sync failed');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  // Group by category
  const categorized = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const allCategories = ['All', ...Object.keys(categorized).sort()];
  const displayItems = categoryFilter === 'All'
    ? items
    : items.filter(i => i.category === categoryFilter);

  const completedCount = items.filter(i => i.completed).length;
  const pendingCount = items.filter(i => !i.completed).length;

  const displayCategorized = displayItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🛒 Shopping List</h1>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button onClick={handleClearCompleted} className="btn-secondary text-sm">
              🗑️ Clear Completed ({completedCount})
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-fade-in">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fade-in">
          ❌ {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 My List
        </button>
        <button
          onClick={() => setActiveTab('microsoft_todo')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'microsoft_todo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Microsoft To Do
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Item Form */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="section-title">
              {activeTab === 'manual' ? '+ Add Item' : '+ Add to Microsoft To Do'}
            </h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="label">Item Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Milk"
                />
              </div>

              {activeTab === 'manual' && (
                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="text"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="input"
                    placeholder="e.g. 2 lbs"
                  />
                </div>
              )}

              <div>
                <label className="label">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  {SHOPPING_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {activeTab === 'manual' && (
                <div>
                  <label className="label">Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="input"
                    placeholder="Optional notes..."
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={adding || !form.name}
                className="btn-primary w-full justify-center"
              >
                {adding ? 'Adding...' : '+ Add Item'}
              </button>
            </form>

            {activeTab === 'microsoft_todo' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="btn-secondary w-full justify-center"
                >
                  {syncing ? '⟳ Syncing...' : '🔄 Sync from Microsoft To Do'}
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Pulls items from your Microsoft To Do grocery/shopping list
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
              <span>📋 {pendingCount} remaining</span>
              <span>✅ {completedCount} done</span>
            </div>
          </div>

          {/* Google Keep info */}
          <div className="card mt-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-2">
              <span className="text-xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-yellow-800 text-sm">Google Keep</h3>
                <p className="text-xs text-yellow-700 mt-1">
                  Google Keep does not have an official public API. Use Microsoft To Do for cloud sync, or add items manually.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Category filter */}
            {allCategories.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading items...</div>
            ) : Object.keys(displayCategorized).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(displayCategorized)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, categoryItems]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {category} ({categoryItems.filter(i => !i.completed).length} left)
                      </h3>
                      <div className="space-y-2">
                        {categoryItems
                          .sort((a, b) => a.completed - b.completed)
                          .map(item => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                item.completed
                                  ? 'bg-gray-50 border-gray-100 opacity-60'
                                  : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
                              }`}
                            >
                              <button
                                onClick={() => handleToggle(item)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  item.completed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 hover:border-indigo-400'
                                }`}
                              >
                                {item.completed && <span className="text-xs">✓</span>}
                              </button>

                              <div className="flex-1 min-w-0">
                                <span className={`font-medium text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.quantity && item.quantity !== '1' && (
                                    <span className="text-xs text-gray-400">{item.quantity}</span>
                                  )}
                                  {item.notes && (
                                    <span className="text-xs text-gray-400 italic">{item.notes}</span>
                                  )}
                                  {item.list_source !== 'manual' && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                      {item.list_source === 'microsoft_todo' ? '✅ To Do' : '📓 Keep'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🛒</div>
                <p className="text-gray-500 font-medium">
                  {activeTab === 'manual' ? 'Your shopping list is empty!' : 'No Microsoft To Do items synced yet.'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab === 'manual'
                    ? 'Add items using the form on the left.'
                    : 'Click "Sync from Microsoft To Do" to import your list.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
