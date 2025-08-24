import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '../components/ui/AuroraBackground';
import { Copy } from 'lucide-react';

// --- Helpers & Sous-Composants ---
const truncateAddress = (address) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const ApprovalModal = ({ user, onClose, onApprove, adminWallet, setAdminWallet }) => {
    const [userData, setUserData] = useState(user);

    useEffect(() => {
        setUserData(user);
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onApprove(user.id, userData, adminWallet);
    };

    if (!user) return null;

    return (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
                <h2>Éditer et Approuver l'utilisateur</h2>
                <form onSubmit={handleSubmit}>
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Wallet:</strong> {user.wallet_address}</p>
                    <label>Email:</label>
                    <input type="email" name="email" value={userData.email || ''} onChange={handleChange} placeholder="Email de l'utilisateur" />
                    <label>Votre adresse de portefeuille (Admin):</label>
                    <input type="text" value={adminWallet} onChange={(e) => setAdminWallet(e.target.value)} placeholder="0x... (Votre adresse de parrain)" required />
                    <div className="modal-actions">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit">Sauvegarder et Approuver</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onClose}>Annuler</motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const ManagementPage = () => {
    // State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [greylistUsers, setGreylistUsers] = useState([]);
    const [whitelistUsers, setWhitelistUsers] = useState([]);
    const [newAddress, setNewAddress] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [adminWallet, setAdminWallet] = useState('');
    const [copyStatus, setCopyStatus] = useState('');

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus('Copié !');
            setTimeout(() => setCopyStatus(''), 2000);
        });
    };

    const fetchData = useCallback(async () => {
        try {
            const greylistRes = await axios.get('/api/onboarding?status=greylist');
            const whitelistRes = await axios.get('/api/onboarding?status=whitelist');
            setGreylistUsers(greylistRes.data);
            setWhitelistUsers(whitelistRes.data);
        } catch (_err) {
            setError("Could not load user data. Are you logged in?");
        }
    }, []);

    const checkAuth = useCallback(async () => {
        setLoading(true);
        try {
            await axios.get('/api/admin/whitelist');
            setIsAuthenticated(true);
            fetchData();
        } catch (_err) {
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, [fetchData]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/login', { password });
            setIsAuthenticated(true);
            setError('');
            setPassword('');
            fetchData();
        } catch (_err) {
            setError('Invalid password');
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/admin/logout');
            setIsAuthenticated(false);
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        if (!newAddress) return;
        try {
            await axios.post('/api/admin/whitelist/add', { address: newAddress });
            setNewAddress('');
            fetchData();
        } catch (_err) {
            setError('Failed to add address.');
        }
    };

    const handleCsvUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) return;
        const formData = new FormData();
        formData.append('csvfile', csvFile);
        try {
            const res = await axios.post('/api/admin/whitelist/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setCsvFile(null);
            fetchData();
            alert(res.data.message);
        } catch (_err) {
            setError('CSV Upload failed.');
        }
    };

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    const handleApproveUser = async (userId, updatedUserData, adminWalletAddress) => {
        try {
            await axios.patch(`/api/onboarding/${userId}/approve`, { ...updatedUserData, adminWalletAddress });
            alert('Utilisateur approuvé avec succès !');
            handleCloseModal();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.details || 'Approval failed');
        }
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return <div className="loading-container"><span>Vérification des droits...</span><div className="spinner"></div></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="wallet-container">
                <motion.div className="card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <h1>Admin Login</h1>
                    <form onSubmit={handleLogin}>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit">Login</motion.button>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="wallet-container">
            <AnimatePresence>{isModalOpen && <ApprovalModal user={selectedUser} onClose={handleCloseModal} onApprove={handleApproveUser} adminWallet={adminWallet} setAdminWallet={setAdminWallet} />}</AnimatePresence>
            <header>
                <h1>Panneau de Gestion</h1>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}>Déconnexion</motion.button>
            </header>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
                <h2>Utilisateurs à Approuver (Greylist)</h2>
                <table>
                    <thead><tr><th>ID</th><th>Email</th><th>Wallet</th><th>Action</th></tr></thead>
                    <tbody>
                        {greylistUsers.map((user) => (
                            <motion.tr key={user.id} whileHover={{ backgroundColor: "rgba(0, 255, 255, 0.1)" }}>
                                <td>{user.id}</td>
                                <td>{user.email || '—'}</td>
                                <td className="address-cell">
                                    <span>{truncateAddress(user.wallet_address)}</span>
                                    <Copy size={16} className="copy-icon" onClick={() => handleCopy(user.wallet_address)} />
                                </td>
                                <td><motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="button" onClick={() => handleOpenModal(user)}>Éditer & Approuver</motion.button></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>

            <motion.div className="card-group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
                <div className="card">
                    <h2>Ajout Manuel à la Whitelist</h2>
                    <form onSubmit={handleAddAddress}>
                        <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Entrez l'adresse du portefeuille" required />
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit">Forcer l'ajout</motion.button>
                    </form>
                </div>
                <div className="card">
                    <h2>Upload CSV vers la Whitelist</h2>
                    <form onSubmit={handleCsvUpload}>
                        <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit">Uploader CSV</motion.button>
                    </form>
                </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
                <h2>Utilisateurs Approuvés (Whitelist)</h2>
                {copyStatus && <p style={{ color: '#00FFFF', textAlign: 'center' }}>{copyStatus}</p>}
                <table>
                    <thead><tr><th>ID</th><th>Email</th><th>Wallet</th><th>Parrain</th></tr></thead>
                    <tbody>
                        {whitelistUsers.map((user) => (
                            <motion.tr key={user.id} whileHover={{ backgroundColor: "rgba(0, 255, 255, 0.1)" }}>
                                <td>{user.id}</td>
                                <td>{user.email || '—'}</td>
                                <td className="address-cell">
                                    <span>{truncateAddress(user.wallet_address)}</span>
                                    <Copy size={16} className="copy-icon" onClick={() => handleCopy(user.wallet_address)} />
                                </td>
                                <td>{user.recommender_wallet_address ? truncateAddress(user.recommender_wallet_address) : '—'}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
};

export default ManagementPage;