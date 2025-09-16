import React from 'react';
import { formatReunionDateTime, isDateInPast, getReunionNow, getReunionTime } from '../utils/dateUtils';

// Composant Date Picker personnalisé avec thème océan
const CustomDatePicker = ({ value, onChange, placeholder, isOpen, onToggle, label, hasError = false }) => {
  const formatDateTime = (dateString) => {
    return formatReunionDateTime(dateString);
  };

  const getQuickOptions = () => {
    const now = getReunionTime();
    const options = [];

    if (!hasError) {
      options.push({
        label: 'Maintenant',
        value: getReunionNow(),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        disabled: false
      });
    }

    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    const isUniqueMode = !hasError;

    options.push(
      {
        label: 'Dans 1 heure',
        value: oneHourLater,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        disabled: isUniqueMode ? false : isDateInPast(oneHourLater)
      },
      {
        label: 'Dans 24h',
        value: oneDayLater,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        disabled: isUniqueMode ? false : isDateInPast(oneDayLater)
      },
      {
        label: 'Dans 1 semaine',
        value: oneWeekLater,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        disabled: isUniqueMode ? false : isDateInPast(oneWeekLater)
      }
    );

    return options;
  };

  const quickOptions = getQuickOptions();

  return (
    <div className="custom-date-picker relative">
      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
        <span>{label}</span>
      </label>

      <div className="relative">
        <input
          type="text"
          value={formatDateTime(value)}
          onClick={() => onToggle(!isOpen)}
          placeholder={placeholder}
          readOnly
          className={`w-full p-3 pr-10 rounded-lg transition-all duration-200 shadow-sm cursor-pointer text-text-primary ${
            hasError
              ? 'bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'bg-gradient-to-r from-card-bg to-card-bg/80 border border-card-border focus:ring-2 focus:ring-accent focus:border-accent'
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent">
          📅
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-gradient-to-br from-card-bg to-card-bg/95 border border-card-border rounded-xl shadow-2xl backdrop-blur-sm">
           <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/20 to-blue-950/10">
             <h4 className="font-semibold text-slate-200">
               Sélectionner une date
             </h4>
             <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full"></div>
               <span>Fuseau horaire : La Réunion (UTC+4)</span>
             </p>
           </div>

           <div className="p-4">
             <input
               type="datetime-local"
               value={value || ''}
               onChange={(e) => onChange(e.target.value)}
               min={getReunionNow()}
               className="w-full p-3 rounded-lg bg-card-bg/50 border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
               style={{
                 colorScheme: 'dark',
                 WebkitAppearance: 'none',
                 MozAppearance: 'none'
               }}
             />
             <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
               <div className="w-1 h-1 bg-blue-400/40 rounded-full"></div>
               <span>Toutes les heures sont en heure de la Réunion (UTC+4)</span>
             </p>
           </div>

          <div className="p-4 border-t border-card-border">
            <h5 className="text-sm font-medium text-text-secondary mb-3">Raccourcis rapides :</h5>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      onToggle(false);
                    }
                  }}
                  disabled={option.disabled}
                  className={`p-3 text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    option.disabled
                      ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed border border-slate-700/30'
                      : 'bg-gradient-to-br from-slate-800/40 to-blue-950/30 hover:from-slate-700/50 hover:to-blue-900/40 border border-slate-600/40 text-slate-300 hover:text-blue-300 cursor-pointer backdrop-blur-sm'
                  }`}
                >
                  <div className={option.disabled ? 'text-slate-500' : 'text-blue-400'}>
                    {option.icon}
                  </div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-card-border flex gap-2">
            <button
              onClick={() => {
                onChange('');
                onToggle(false);
              }}
              className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors duration-200"
            >
              Effacer
            </button>
            <button
              onClick={() => onToggle(false)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-accent to-accent-hover text-white rounded-lg hover:from-accent-hover hover:to-accent transition-all duration-200"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;