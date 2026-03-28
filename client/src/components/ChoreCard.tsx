import type { Chore, Kid } from '../types';

interface ChoreCardProps {
  chore: Chore;
  kids: Kid[];
  onComplete?: (chore: Chore, kidId: number) => void;
  onEdit?: (chore: Chore) => void;
  onDelete?: (chore: Chore) => void;
}

const frequencyColors: Record<string, string> = {
  daily: 'bg-blue-100 text-blue-700',
  weekly: 'bg-purple-100 text-purple-700',
  monthly: 'bg-orange-100 text-orange-700',
  'one-time': 'bg-gray-100 text-gray-700',
};

export default function ChoreCard({ chore, kids, onComplete, onEdit, onDelete }: ChoreCardProps) {
  const isCompletedToday = (chore.completed_today ?? 0) > 0;
  const assignedKid = kids.find(k => k.id === chore.assigned_kid_id);

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
      isCompletedToday ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* Completion indicator */}
        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isCompletedToday
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300'
        }`}>
          {isCompletedToday && <span className="text-xs">✓</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold ${isCompletedToday ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {chore.name}
            </h3>
            <span className={`badge ${frequencyColors[chore.frequency] || 'bg-gray-100 text-gray-600'}`}>
              {chore.frequency}
            </span>
          </div>

          {chore.description && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{chore.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {/* Points */}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
              ⭐ {chore.points_value} pts
            </span>

            {/* Assigned kid */}
            {assignedKid ? (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: assignedKid.color + '20',
                  color: assignedKid.color,
                }}
              >
                {assignedKid.avatar} {assignedKid.name}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Anyone</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onComplete && !isCompletedToday && (
            <div className="relative group">
              {chore.assigned_kid_id ? (
                <button
                  onClick={() => onComplete(chore, chore.assigned_kid_id!)}
                  className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Done!
                </button>
              ) : (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) onComplete(chore, Number(e.target.value));
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="text-xs pl-2 pr-6 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg border-0 focus:ring-2 focus:ring-green-300 cursor-pointer appearance-none"
                  >
                    <option value="" disabled>Mark done</option>
                    {kids.map(k => (
                      <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(chore)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              ✏️
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(chore)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
