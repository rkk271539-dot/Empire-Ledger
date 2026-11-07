import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import {
  Building2,
  User,
  HeartHandshake,
  Flame,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import sectorsConfig from '../../data/config/sectors.json';

interface FounderSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const FounderSetupModal: React.FC<FounderSetupModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useGameStore();
  const { showToast } = useUIStore();

  const [playerName, setPlayerName] = useState(state.player.name || 'Aarav Mehta');
  const [playerCity, setPlayerCity] = useState(state.player.city || 'Mumbai');
  const [playerAvatar, setPlayerAvatar] = useState<string | undefined>(state.player.avatarUrl);

  const [companyName, setCompanyName] = useState(
    state.companies['company_player']?.name || 'Mehta Enterprises'
  );
  const [companySector, setCompanySector] = useState(
    state.companies['company_player']?.sector || 'tech'
  );

  const [wifeName, setWifeName] = useState(state.people['wife']?.name || 'Ananya Mehta');
  const [wifeAvatar, setWifeAvatar] = useState<string | undefined>(state.people['wife']?.avatarUrl);

  const [rivalName, setRivalName] = useState(state.people['rival']?.name || 'Vikram Singhania');
  const [rivalAvatar, setRivalAvatar] = useState<string | undefined>(state.people['rival']?.avatarUrl);

  if (!isOpen) return null;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image file too large (max 2MB)', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !companyName.trim()) {
      showToast('Please provide your name and company name', 'error');
      return;
    }

    dispatch({
      type: 'SETUP_FOUNDER',
      playerName: playerName.trim(),
      playerCity: playerCity.trim(),
      playerAvatar,
      companyName: companyName.trim(),
      companySector,
      wifeName: wifeName.trim(),
      wifeAvatar,
      rivalName: rivalName.trim(),
      rivalAvatar,
    });

    showToast('Empire founded! Welcome to the market.', 'success');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl my-auto p-5 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-1.5 pb-2 border-b border-gray-800">
          <div className="inline-flex p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-100 tracking-tight">
            Founding Your Empire — Initial Registry
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Set your founder identity, establish your flagship enterprise, and upload photos for yourself, your partner, and your rival.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Founder Identity */}
          <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>1. Founder Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Photo Upload */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 rounded-full bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group">
                  {playerAvatar ? (
                    <img src={playerAvatar} alt="Player" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-500" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[10px] text-white font-medium">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setPlayerAvatar)}
                    />
                  </label>
                </div>
                <label className="text-[11px] text-blue-400 hover:underline cursor-pointer">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setPlayerAvatar)}
                  />
                </label>
              </div>

              {/* Name & City */}
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Founder Full Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Aarav Mehta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    Base Headquarters City
                  </label>
                  <select
                    value={playerCity}
                    onChange={(e) => setPlayerCity(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Mumbai">Mumbai (Financial Capital)</option>
                    <option value="Bengaluru">Bengaluru (Tech Hub)</option>
                    <option value="Delhi NCR">Delhi NCR (Policy & Industrial)</option>
                    <option value="Hyderabad">Hyderabad (Pharma & Cyber)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Flagship Enterprise */}
          <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>2. Flagship Company (Economy Core)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Mehta Enterprises"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Primary Sector
                </label>
                <select
                  value={companySector}
                  onChange={(e) => setCompanySector(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {sectorsConfig.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Partner & Rival Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wife / Partner */}
            <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>3. Partner / Wife</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-900 border border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group shrink-0">
                  {wifeAvatar ? (
                    <img src={wifeAvatar} alt="Wife" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-gray-500" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setWifeAvatar)}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-0.5">Partner Name</label>
                  <input
                    type="text"
                    value={wifeName}
                    onChange={(e) => setWifeName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                    placeholder="Ananya Mehta"
                  />
                  <label className="text-[10px] text-emerald-400 hover:underline cursor-pointer mt-0.5 inline-block">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setWifeAvatar)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Arch Rival */}
            <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>4. Main Rival</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-900 border border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group shrink-0">
                  {rivalAvatar ? (
                    <img src={rivalAvatar} alt="Rival" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-gray-500" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setRivalAvatar)}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-0.5">Rival Name</label>
                  <input
                    type="text"
                    value={rivalName}
                    onChange={(e) => setRivalName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                    placeholder="Vikram Singhania"
                  />
                  <label className="text-[10px] text-rose-400 hover:underline cursor-pointer mt-0.5 inline-block">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setRivalAvatar)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Launch Empire</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
