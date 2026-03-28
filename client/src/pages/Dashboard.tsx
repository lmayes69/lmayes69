import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kidsApi, choresApi, mealsApi, shoppingApi, calendarApi } from '../lib/api';
import type { Kid, Chore, MealPlan, ShoppingItem, CalendarEvent } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [todayMeals, setTodayMeals] = useState<MealPlan[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kidsData, choresData, mealsData, shoppingData, eventsData] = await Promise.all([
          kidsApi.getAll(),
          choresApi.getAll(),
          mealsApi.getToday(),
          shoppingApi.getAll(),
          calendarApi.getEvents({
            timeMin: new Date().toISOString(),
            timeMax: new Date(Date.now() + 7 * 86400000).toISOString(),
          }),
        ]);
        setKids(kidsData);
        setChores(choresData);
        setTodayMeals(mealsData);
        setShoppingItems(shoppingData.filter(i => !i.completed));
        setEvents(eventsData.events.slice(0, 6));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleCompleteChore = async (chore: Chore, kidId: number) => {
    try {
      await choresApi.complete(chore.id, kidId);
      const [updatedKids, updatedChores] = await Promise.all([
        kidsApi.getAll(),
        choresApi.getAll(),
      ]);
      setKids(updatedKids);
      setChores(updatedChores);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to complete chore');
    }
  };

  const todayStr = format(new Date(), 'EEEE, MMMM d');
  const pendingChores = chores.filter(c => !c.completed_today);
  const pendingShopping = shoppingItems.slice(0, 5);

  const mealEmojis: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
  };

  const getEventTime = (event: CalendarEvent) => {
    const dt = event.start.dateTime || event.start.date;
    if (!dt) return '';
    if (event.start.date && !event.start.dateTime) return 'All day';
    return format(new Date(dt), 'h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🏡</div>
          <p className="text-gray-500">Loading your family dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Good {getGreeting()}! 👋</h1>
        <p className="text-gray-500 mt-1">{todayStr}</p>
      </div>

      {/* Upcoming Events */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">📅 Upcoming Events</h2>
          <Link to="/calendar" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View calendar →
          </Link>
        </div>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{event.summary}</p>
                  <p className="text-xs text-gray-500">
                    {getEventTime(event)} &bull;{' '}
                    {event.start.dateTime
                      ? format(new Date(event.start.dateTime), 'MMM d')
                      : event.start.date
                      ? format(new Date(event.start.date + 'T00:00:00'), 'MMM d')
                      : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No upcoming events. Connect Google Calendar in Settings!</p>
        )}
      </div>

      {/* Kids Points */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">👨‍👧‍👦 Kids Overview</h2>
          <Link to="/kids" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Manage kids →
          </Link>
        </div>
        {kids.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kids.map(kid => (
              <div
                key={kid.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                  style={{ backgroundColor: kid.color + '20' }}
                >
                  {kid.avatar}
                </div>
                <h3 className="font-bold text-gray-900">{kid.name}</h3>
                {kid.age && <p className="text-xs text-gray-500 mb-2">Age {kid.age}</p>}
                <div
                  className="text-2xl font-bold mt-2"
                  style={{ color: kid.color }}
                >
                  {kid.points}
                </div>
                <p className="text-xs text-gray-400">points</p>
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  {kid.completions_today ?? 0} chore{(kid.completions_today ?? 0) !== 1 ? 's' : ''} today
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-400">
            <p className="text-3xl mb-2">👨‍👧‍👦</p>
            <p>No kids added yet.</p>
            <Link to="/kids" className="text-indigo-600 text-sm font-medium hover:underline">
              Add your first kid →
            </Link>
          </div>
        )}
      </div>

      {/* Chores & Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Chores */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">✅ Today's Chores</h2>
              <Link to="/chores" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                All →
              </Link>
            </div>
            {pendingChores.length > 0 ? (
              <div className="space-y-2">
                {pendingChores.slice(0, 6).map(chore => (
                  <div key={chore.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-lg">{chore.kid_avatar || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{chore.name}</p>
                      <p className="text-xs text-amber-600">+{chore.points_value} pts</p>
                    </div>
                    {kids.length > 0 && (
                      <button
                        onClick={() => handleCompleteChore(chore, chore.assigned_kid_id || kids[0].id)}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Done
                      </button>
                    )}
                  </div>
                ))}
                {pendingChores.length > 6 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    +{pendingChores.length - 6} more chores
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-gray-500 text-sm">All chores done!</p>
              </div>
            )}
          </div>
        </div>

        {/* Shopping List */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">🛒 Shopping List</h2>
              <Link to="/shopping" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Full list →
              </Link>
            </div>
            {pendingShopping.length > 0 ? (
              <div className="space-y-2">
                {pendingShopping.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.quantity} &bull; {item.category}</p>
                    </div>
                  </div>
                ))}
                {shoppingItems.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    +{shoppingItems.length - 5} more items
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-500 text-sm">Shopping list is empty!</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Meals */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">🍽️ Today's Meals</h2>
              <Link to="/meals" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Meal plan →
              </Link>
            </div>
            {todayMeals.length > 0 ? (
              <div className="space-y-3">
                {todayMeals.map(meal => (
                  <div key={meal.id} className="flex items-start gap-3">
                    <span className="text-xl">{mealEmojis[meal.meal_type] || '🍽️'}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {meal.meal_type}
                      </p>
                      <p className="text-sm font-medium text-gray-900">{meal.recipe_name}</p>
                      {meal.notes && (
                        <p className="text-xs text-gray-400">{meal.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🍽️</p>
                <p className="text-gray-500 text-sm">No meals planned today.</p>
                <Link to="/meals" className="text-indigo-600 text-sm font-medium hover:underline">
                  Plan meals →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
