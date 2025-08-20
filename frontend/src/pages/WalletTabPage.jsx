
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './WalletTabPage.css';

const WalletTabPage = () => {
  const [activeTab, setActiveTab] = useState('send');

  return (
    <div className="wallet-tab-page-container">
      <header>
        <img src="/assets/logo.svg" alt="ConverCoin Logo" className="logo" />
        <Link to="/dashboard" className="back-link">Retour au tableau de bord</Link>
      </header>

      <div className="card">
        <div className="balance-section">
          <h2>Solde Total</h2>
          <p className="balance">1,234.56 CVTC</p>
        </div>

        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            Envoyer
          </button>
          <button 
            className={`tab-button ${activeTab === 'receive' ? 'active' : ''}`}
            onClick={() => setActiveTab('receive')}
          >
            Recevoir
          </button>
        </div>

        {activeTab === 'send' && (
          <div id="send" className="tab-content active">
            <h2>Envoyer des CVTC</h2>
            <form>
              <label>
                Adresse du destinataire
                <input type="text" placeholder="0x..." required />
              </label>
              <label>
                Montant
                <input type="number" placeholder="0.00" required />
              </label>
              <button type="submit">Envoyer</button>
            </form>
          </div>
        )}

        {activeTab === 'receive' && (
          <div id="receive" className="tab-content active">
            <h2>Recevoir des CVTC</h2>
            <div className="receive-section">
                <p>Partagez votre adresse pour recevoir des fonds.</p>
                <div className="address-container">
                    <span>0x1234567890abcdef1234567890abcdef12345678</span>
                </div>
                <div className="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=0x1234567890abcdef1234567890abcdef12345678" alt="QR Code de l'adresse" />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletTabPage;
