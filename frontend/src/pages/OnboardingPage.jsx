import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const { mode } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parrain: '',
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    if (error) {
      setTimeout(() => setMessage(''), 6000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const dataToSubmit = {
      ...formData,
      profileType: mode,
    };

    try {
      const res = await fetch("http://localhost:4000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await res.json();

      if (res.ok) {
        if (result.access === 'greylist') {
          showMessage("Votre demande est en attente de validation. Vous recevrez un accès dès approbation.");
          setFormData({ name: '', email: '', phone: '', parrain: '' });
        } else {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
          showMessage("Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.");
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        showMessage(`❌ Erreur : ${result.message || 'Une erreur est survenue'}`, true);
      }
    } catch (err) {
      showMessage(`❌ Erreur réseau : ${err.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-container relative">
      <Link to="/" className="absolute top-4 left-4 text-sm text-gray-400 hover:text-white">
        Accueil
      </Link>
      <h1>Demande d'accès ({mode})</h1>
      <form onSubmit={handleSubmit}>
        <label>Nom :
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>Email :
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>
        <label>Téléphone :
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </label>
        <label>Adresse Wallet Parrain (optionnel) :
          <input type="text" name="parrain" value={formData.parrain} onChange={handleChange} />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Envoi en cours...' : 'Soumettre la demande'}
          {isLoading && <span className="spinner"></span>}
        </button>
      </form>
      {message && (
        <div className={isError ? 'error-msg' : 'success-msg'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;