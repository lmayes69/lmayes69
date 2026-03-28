import { useEffect, useState } from 'react';
import { mealsApi } from '../lib/api';
import type { MealPlan } from '../types';
import { MEAL_TYPES } from '../types';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';

interface MealForm {
  plan_date: string;
  meal_type: string;
  recipe_name: string;
  notes: string;
}

const defaultForm: MealForm = {
  plan_date: '',
  meal_type: 'dinner',
  recipe_name: '',
  notes: '',
};

const mealEmojis: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const mealColors: Record<string, string> = {
  breakfast: 'bg-orange-50 border-orange-200',
  lunch: 'bg-yellow-50 border-yellow-200',
  dinner: 'bg-indigo-50 border-indigo-200',
  snack: 'bg-green-50 border-green-200',
};

export default function MealPlanner() {
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [form, setForm] = useState<MealForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMeals();
  }, [currentWeekStart]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
      const data = await mealsApi.getAll(
        format(currentWeekStart, 'yyyy-MM-dd'),
        format(weekEnd, 'yyyy-MM-dd')
      );
      setMeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
  });

  const getMealForDayAndType = (day: Date, type: string): MealPlan | undefined => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return meals.find(m => m.plan_date === dayStr && m.meal_type === type);
  };

  const openAddModal = (day: Date, mealType: string) => {
    setEditingMeal(null);
    setForm({
      ...defaultForm,
      plan_date: format(day, 'yyyy-MM-dd'),
      meal_type: mealType,
    });
    setShowModal(true);
  };

  const openEditModal = (meal: MealPlan) => {
    setEditingMeal(meal);
    setForm({
      plan_date: meal.plan_date,
      meal_type: meal.meal_type,
      recipe_name: meal.recipe_name,
      notes: meal.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.recipe_name) return;
    setSaving(true);
    try {
      const payload = {
        plan_date: form.plan_date,
        meal_type: form.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        recipe_name: form.recipe_name,
        notes: form.notes || null,
      };
      if (editingMeal) {
        await mealsApi.update(editingMeal.id, payload);
      } else {
        await mealsApi.create(payload);
      }
      setShowModal(false);
      await loadMeals();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (meal: MealPlan) => {
    if (!confirm(`Delete "${meal.recipe_name}"?`)) return;
    try {
      await mealsApi.delete(meal.id);
      await loadMeals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🍽️ Meal Planner</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="btn-secondary text-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          className="btn-secondary"
        >
          ← Prev Week
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentWeekStart, 'MMMM d')} – {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), 'MMMM d, yyyy')}
        </h2>
        <button
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          className="btn-secondary"
        >
          Next Week →
        </button>
      </div>

      {/* Meal Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading meal plan...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="w-24 p-2 text-left text-sm font-medium text-gray-500">Meal</th>
                {weekDays.map(day => (
                  <th
                    key={day.toISOString()}
                    className={`p-2 text-center text-sm font-medium ${
                      isToday(day) ? 'text-indigo-600' : 'text-gray-600'
                    }`}
                  >
                    <div className={`inline-block px-3 py-1 rounded-lg ${isToday(day) ? 'bg-indigo-100' : ''}`}>
                      <div className="font-semibold">{format(day, 'EEE')}</div>
                      <div className={`text-lg font-bold ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(mealType => (
                <tr key={mealType} className="border-t border-gray-100">
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{mealEmojis[mealType]}</span>
                      <span className="text-sm font-medium text-gray-600 capitalize">{mealType}</span>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const meal = getMealForDayAndType(day, mealType);
                    const isCurrentDay = isToday(day);

                    return (
                      <td
                        key={`${mealType}-${day.toISOString()}`}
                        className={`p-1.5 ${isCurrentDay ? 'bg-indigo-50/30' : ''}`}
                      >
                        {meal ? (
                          <div
                            className={`relative group p-2 rounded-lg border text-sm cursor-pointer ${mealColors[mealType]} hover:shadow-sm transition-shadow min-h-[60px]`}
                            onClick={() => openEditModal(meal)}
                          >
                            <p className="font-medium text-gray-900 leading-tight">{meal.recipe_name}</p>
                            {meal.notes && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{meal.notes}</p>
                            )}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(meal); }}
                                className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAddModal(day, mealType)}
                            className="w-full h-[60px] rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors flex items-center justify-center text-gray-300 hover:text-indigo-400 text-xl"
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {MEAL_TYPES.map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${mealColors[type].split(' ')[0]}`} />
            <span className="text-xs text-gray-500 capitalize">{mealEmojis[type]} {type}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMeal ? 'Edit Meal' : 'Add Meal'}
              </h2>
              {form.plan_date && (
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(form.plan_date + 'T00:00:00'), 'EEEE, MMMM d')} &bull; {form.meal_type}
                </p>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={form.plan_date}
                  onChange={e => setForm({ ...form, plan_date: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Meal Type</label>
                <select
                  value={form.meal_type}
                  onChange={e => setForm({ ...form, meal_type: e.target.value })}
                  className="input"
                >
                  {MEAL_TYPES.map(t => (
                    <option key={t} value={t}>
                      {mealEmojis[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Recipe / Meal Name *</label>
                <input
                  type="text"
                  value={form.recipe_name}
                  onChange={e => setForm({ ...form, recipe_name: e.target.value })}
                  className="input"
                  placeholder="e.g. Spaghetti Bolognese"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Recipe link, prep notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.recipe_name}
                className="btn-primary"
              >
                {saving ? 'Saving...' : editingMeal ? 'Save Changes' : 'Add Meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
