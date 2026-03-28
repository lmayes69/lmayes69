import type { Kid } from '../types';

interface KidCardProps {
  kid: Kid;
  onEdit?: (kid: Kid) => void;
  onDelete?: (kid: Kid) => void;
  onClick?: (kid: Kid) => void;
  compact?: boolean;
}

export default function KidCard({ kid, onEdit, onDelete, onClick, compact = false }: KidCardProps) {
  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onClick?.(kid)}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: kid.color + '20', border: `2px solid ${kid.color}` }}
        >
          {kid.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{kid.name}</p>
          {kid.age && <p className="text-xs text-gray-500">Age {kid.age}</p>}
        </div>
        <div className="text-right">
          <div
            className="text-sm font-bold"
            style={{ color: kid.color }}
          >
            {kid.points}
          </div>
          <div className="text-xs text-gray-400">pts</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(kid)}
    >
      {/* Color header */}
      <div
        className="h-2"
        style={{ backgroundColor: kid.color }}
      />

      <div className="p-5">
        {/* Avatar and name */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: kid.color + '20' }}
            >
              {kid.avatar}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{kid.name}</h3>
              {kid.age && <p className="text-sm text-gray-500">Age {kid.age}</p>}
            </div>
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              {onEdit && (
                <button
                  onClick={() => onEdit(kid)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(kid)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Points */}
        <div
          className="rounded-xl p-3 mb-3 text-center"
          style={{ backgroundColor: kid.color + '15' }}
        >
          <div className="text-2xl font-bold" style={{ color: kid.color }}>
            {kid.points}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-0.5">total points</div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-800">{kid.completions_today ?? 0}</div>
            <div className="text-xs text-gray-400">today</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-800">{kid.total_redemptions ?? 0}</div>
            <div className="text-xs text-gray-400">redeemed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
