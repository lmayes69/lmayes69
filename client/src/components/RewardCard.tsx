import type { Reward, Kid } from '../types';

interface RewardCardProps {
  reward: Reward;
  kids: Kid[];
  onRedeem?: (reward: Reward, kidId: number) => void;
  onEdit?: (reward: Reward) => void;
  onDelete?: (reward: Reward) => void;
  isAdmin?: boolean;
}

export default function RewardCard({ reward, kids, onRedeem, onEdit, onDelete, isAdmin = false }: RewardCardProps) {
  const canAfford = (kid: Kid) => kid.points >= reward.points_cost;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Emoji header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
        <div className="text-5xl mb-2">{reward.image_emoji}</div>
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{reward.name}</h3>
        {reward.description && (
          <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
        )}
      </div>

      {/* Points cost */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg">⭐</span>
            <span className="text-xl font-bold text-gray-900">{reward.points_cost}</span>
            <span className="text-sm text-gray-500">points</span>
          </div>
          {reward.quantity > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {reward.quantity} left
            </span>
          )}
        </div>
      </div>

      {/* Redeem buttons */}
      <div className="p-4 space-y-2">
        {onRedeem && kids.length > 0 ? (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Redeem for:</p>
            <div className="space-y-2">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => onRedeem(reward, kid.id)}
                  disabled={!canAfford(kid)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    canAfford(kid)
                      ? 'hover:opacity-90 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  style={canAfford(kid) ? { backgroundColor: kid.color } : {}}
                >
                  <span className="flex items-center gap-2">
                    <span>{kid.avatar}</span>
                    <span className="font-medium">{kid.name}</span>
                  </span>
                  <span className="text-xs">
                    {canAfford(kid) ? `${kid.points} pts` : `Need ${reward.points_cost - kid.points} more`}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">No kids added yet</p>
        )}

        {/* Admin actions */}
        {isAdmin && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
            {onEdit && (
              <button
                onClick={() => onEdit(reward)}
                className="flex-1 btn-secondary text-xs justify-center py-1.5"
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(reward)}
                className="flex-1 btn-danger text-xs justify-center py-1.5"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
