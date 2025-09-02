import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PROFILE_PIC_STORAGE_KEY = 'userProfilePic';

export default function SettingsPage() {
  const [profilePic, setProfilePic] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const storedPic = localStorage.getItem(PROFILE_PIC_STORAGE_KEY);
    if (storedPic) {
      setProfilePic(storedPic);
    }
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        localStorage.setItem(PROFILE_PIC_STORAGE_KEY, base64String);
        setProfilePic(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePic = () => {
    localStorage.removeItem(PROFILE_PIC_STORAGE_KEY);
    setProfilePic(null);
  };

  return (
    <div className="p-8 text-text-primary">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour au Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-heading mb-10">Settings</h1>

        <div className="p-6 bg-card-bg border border-card-border rounded-lg">
          <h2 className="text-xl font-semibold text-heading">Profil</h2>
          <p className="text-text-secondary text-sm mt-1 mb-6">Personnalisez votre apparence sur la plateforme.</p>
          
          <div className="flex items-center gap-6">
            <div 
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {profilePic ? (
                <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-4xl font-bold">?</span>
              )}
              {isHovering && profilePic && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <button onClick={handleRemovePic} className="text-white p-2 rounded-full hover:bg-red-500/50 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="upload-photo" className="button cursor-pointer inline-flex items-center gap-2">
                <Upload size={16} />
                Changer la photo
              </label>
              <input type="file" id="upload-photo" accept="image/*" className="hidden" onChange={handleFileChange} />
              <p className="text-xs text-text-secondary mt-2">PNG, JPG, GIF jusqu'à 5MB.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
