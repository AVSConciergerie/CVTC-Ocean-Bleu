
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './WalletPage.css';

const WalletPage = () => {
  const { mode } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parrain: '',
  });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, mode }),
      });

      const result = await res.json();

      if (res.ok) {
        if (result.access === 'greylist') {
          setMessage({ text: "Votre demande est en attente de validation. Vous recevrez un accès dès approbation.", isError: false });
          setFormData({ name: '', email: '', phone: '', parrain: '' });
        } else {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
          setMessage({ text: "Votre wallet a été créé avec succès ! Redirection en cours...", isError: false });
          sessionStorage.setItem('guest_wallet', JSON.stringify(result));
          setTimeout(() => {
            navigate('/dashboard');
          }, 2500);
        }
      } else {
        setMessage({ text: `❌ Erreur : ${result.message || 'Une erreur est survenue'}`, isError: true });
      }
    } catch (err) {
      setMessage({ text: `❌ Erreur réseau : ${err.message}`, isError: true });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (message && message.isError) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="wallet-page-container">
      <h1>Créer un Wallet Invité ({mode})</h1>
      <form onSubmit={handleSubmit}>
        <label>Nom : <input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></label>
        <label>Email : <input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></label>
        <label>Téléphone : <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required /></label>
        <label>Adresse Wallet Parrain (optionnel) : <input type="text" name="parrain" value={formData.parrain} onChange={handleInputChange} /></label>
        <button type="submit" disabled={isLoading}> 
          {isLoading ? 'Création en cours...' : 'Créer un Wallet'}
          {isLoading && <span className="spinner"></span>}
        </button>
      </form>
      {message && (
        <div className={message.isError ? 'error-msg' : 'success-msg'}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default WalletPage;
