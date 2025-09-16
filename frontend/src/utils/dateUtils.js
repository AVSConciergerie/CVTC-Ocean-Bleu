// Fuseau horaire de la Réunion (UTC+4)
export const REUNION_TIMEZONE = 'Indian/Reunion';
export const REUNION_OFFSET = 4 * 60; // 4 heures en minutes

// Utilitaires pour le fuseau horaire de la Réunion
export const getReunionTime = (date = new Date()) => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (REUNION_OFFSET * 60000));
};

export const formatReunionDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const reunionDate = getReunionTime(date);

  return reunionDate.toLocaleString('fr-FR', {
    timeZone: REUNION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isDateInPast = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = getReunionTime();
  return date < now;
};

export const getReunionNow = () => {
  return getReunionTime().toISOString().slice(0, 16);
};