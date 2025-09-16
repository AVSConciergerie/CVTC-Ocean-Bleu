import { useState, useEffect } from 'react';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [recognizedContact, setRecognizedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editName, setEditName] = useState('');

  const loadContacts = () => {
    const savedContacts = localStorage.getItem('cvtc_contacts');
    if (savedContacts) {
      try {
        const parsedContacts = JSON.parse(savedContacts);
        setContacts(parsedContacts);
        if (parsedContacts.length > 0) setShowContacts(true);
      } catch (error) {
        console.error('Erreur chargement contacts:', error);
        setContacts([]);
      }
    }
  };

  const saveContacts = (newContacts) => {
    try {
      localStorage.setItem('cvtc_contacts', JSON.stringify(newContacts));
    } catch (error) {
      console.error('Erreur sauvegarde contacts:', error);
    }
  };

  const addContact = (address, name) => {
    console.log('👤 addContact appelé avec:', address, name);
    const newContact = {
      address,
      name: name || `Contact ${contacts.length + 1}`,
      lastTransfer: new Date().toISOString(),
      transferCount: 1
    };
    const existingContactIndex = contacts.findIndex(c => c.address.toLowerCase() === address.toLowerCase());
    if (existingContactIndex >= 0) {
      console.log('📝 Contact existant mis à jour');
      const updatedContacts = [...contacts];
      updatedContacts[existingContactIndex] = {
        ...updatedContacts[existingContactIndex],
        lastTransfer: new Date().toISOString(),
        transferCount: updatedContacts[existingContactIndex].transferCount + 1
      };
      setContacts(updatedContacts);
      saveContacts(updatedContacts);
    } else {
      console.log('➕ Nouveau contact ajouté');
      const newContacts = [...contacts, newContact];
      setContacts(newContacts);
      saveContacts(newContacts);
    }
  };

  const removeContact = (address) => {
    const updatedContacts = contacts.filter(c => c.address !== address);
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
  };

  const updateContact = (address, newName) => {
    const updatedContacts = contacts.map(c =>
      c.address === address ? { ...c, name: newName } : c
    );
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
    setEditingContact(null);
    setEditName('');
  };

  const selectContact = (contact, setCurrentAddress) => {
    console.log('👤 Contact sélectionné:', contact);
    setRecognizedContact(contact);
    // Mettre à jour l'adresse courante avec celle du contact
    if (setCurrentAddress) {
      setCurrentAddress(contact.address);
    }
  };

  const startEditing = (contact) => {
    setEditingContact(contact.address);
    setEditName(contact.name);
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setEditName('');
  };

  const recognizeContact = (address) => {
    if (!address) {
      setRecognizedContact(null);
      return;
    }
    const existingContact = contacts.find(c => c.address.toLowerCase() === address.toLowerCase());
    setRecognizedContact(existingContact || null);
  };

  useEffect(() => { loadContacts(); }, []);

  return {
    contacts,
    showContacts,
    setShowContacts,
    showAddContactForm,
    setShowAddContactForm,
    newContactName,
    setNewContactName,
    recognizedContact,
    editingContact,
    editName,
    setEditName,
    addContact,
    removeContact,
    updateContact,
    selectContact,
    startEditing,
    cancelEditing,
    recognizeContact
  };
};