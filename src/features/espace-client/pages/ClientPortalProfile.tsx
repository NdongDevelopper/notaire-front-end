import { useEffect, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { useEspaceClientData } from '../context/EspaceClientDataContext';

export function ClientPortalProfile() {
  const { isLoading, client, unreadNotificationsCount, requestProfileChange, changePassword } = useEspaceClientData();

  const [tempPhone, setTempPhone] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (client) {
      setTempPhone(client.phone || '');
      setTempEmail(client.email || '');
      setTempAddress(client.address || '');
    }
  }, [client]);

  if (isLoading || !client) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement du profil...</div>;
  }

  const handleRequest = async (field: string, value: string) => {
    setIsRequesting(true);
    setErrorMsg('');
    try {
      await requestProfileChange(field, value);
      setSuccessMsg(`Votre demande de modification de ${field} a été transmise à l'étude.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setErrorMsg(`Échec de la demande de modification pour ${field}. Veuillez réessayer.`);
    } finally {
      setIsRequesting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setSuccessMsg('Mot de passe modifié avec succès.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setPasswordError('Échec de la modification du mot de passe. Vérifiez votre ancien mot de passe.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PortalPageHeader
        title="Mon profil"
        subtitle="Gérez vos coordonnées et votre mot de passe."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div>
            <h4 className="font-extrabold text-slate-900 text-base">Informations civiles & coordonnées</h4>
            <p className="text-xs text-slate-500">
              Pour des raisons de conformité légale notariale, les modifications sensibles doivent être validées par l'étude.
            </p>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Prénom</label>
                <input
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                  value={client.firstName || client.first_name || 'Non renseigné'}
                  disabled
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Nom</label>
                <input
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                  value={client.lastName || client.last_name || client.nom || 'Non renseigné'}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Nom d'utilisateur</label>
                <input
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                  value={client.username || 'Non renseigné'}
                  disabled
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Rôle</label>
                <input
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                  value={client.role || 'Client'}
                  disabled
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h5 className="font-bold text-slate-900 text-sm">Demande de modification des coordonnées</h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Téléphone de contact</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      disabled={isRequesting}
                    />
                    {tempPhone !== client.phone && (
                      <button
                        onClick={() => handleRequest('Téléphone', tempPhone)}
                        disabled={isRequesting}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-900 transition-all"
                      >
                        {isRequesting ? 'Envoi...' : 'Mettre à jour'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Adresse E-mail de connexion</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      disabled={isRequesting}
                    />
                    {tempEmail !== client.email && (
                      <button
                        onClick={() => handleRequest('E-mail', tempEmail)}
                        disabled={isRequesting}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-900 transition-all"
                      >
                        {isRequesting ? 'Envoi...' : 'Mettre à jour'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Adresse Domiciliaire actuelle</label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    disabled={isRequesting}
                  />
                  {tempAddress !== (client.address ?? '') && (
                    <button
                      onClick={() => handleRequest('Adresse', tempAddress)}
                      disabled={isRequesting}
                      className="self-end bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-900 transition-all"
                    >
                      {isRequesting ? 'Envoi...' : 'Mettre à jour'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm">Sécurité du compte</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800">Identifiant unique client</p>
                <p className="font-mono text-xs text-slate-500 mt-0.5">NOT-CLI-{client.id.toUpperCase()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800">Double authentification OTP</p>
                <p className="text-slate-500 mt-1">Activée (Code requis par email pour toute signature ou validation).</p>
              </div>
              {!showPasswordForm ? (
                <button 
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full text-center py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Lock size={16} /> Changer le mot de passe
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Ancien mot de passe</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  {passwordError && (
                    <p className="text-red-600 text-xs font-bold">{passwordError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition-all"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordError('');
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalProfile;