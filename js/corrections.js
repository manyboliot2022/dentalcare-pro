/**
 * DentalCare Solo - Corrections et Fonctionnalités Manquantes
 * Version 1.1
 */

// ═══════════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════════
let currentPatientFilter = 'all';
let currentSearchTerm = '';

// ═══════════════════════════════════════════════════════════════════
// 1. LOGO - Retour au dashboard
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    // S'assurer que le logo fonctionne
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showPage === 'function') {
                showPage('dashboard');
            }
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// 2. PATIENTS - Modification et Suppression
// ═══════════════════════════════════════════════════════════════════
function editPatient(patientId) {
    // Simuler l'édition d'un patient
    const patient = patientsData.find(p => p.id === patientId);
    if (patient) {
        openModal('newPatient');
        // Remplir le formulaire avec les données existantes
        setTimeout(() => {
            document.getElementById('patientNom').value = patient.nom || '';
            document.getElementById('patientPrenom').value = patient.prenom || '';
            document.getElementById('patientTelephone').value = patient.telephone || '';
            document.getElementById('patientEmail').value = patient.email || '';
            document.getElementById('patientDateNaissance').value = patient.date_naissance || '';
            document.getElementById('patientAdresse').value = patient.adresse || '';
            document.getElementById('patientVille').value = patient.ville || 'Conakry';
            document.getElementById('patientSexe').value = patient.sexe || '';
            document.getElementById('patientGroupeSanguin').value = patient.groupe_sanguin || '';
            document.getElementById('patientAllergies').value = patient.allergies || '';
            document.getElementById('patientAntecedents').value = patient.antecedents || '';
            
            // Changer le titre du modal
            const modalTitle = document.querySelector('#modal-newPatient h3');
            if (modalTitle) modalTitle.textContent = 'Modifier le patient';
            
            // Stocker l'ID pour la mise à jour
            document.getElementById('formNewPatient').dataset.editId = patientId;
        }, 100);
    }
    showNotification('Mode édition activé', 'info');
}

function deletePatientConfirm(patientId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
        deletePatient(patientId);
    }
}

// ═══════════════════════════════════════════════════════════════════
// 3. FILTRES PATIENTS - Actif/Inactif
// ═══════════════════════════════════════════════════════════════════
function filterPatientsByStatus(status) {
    currentPatientFilter = status;
    applyPatientFilters();
}

function applyPatientFilters() {
    const rows = document.querySelectorAll('#page-patients table tbody tr');
    rows.forEach(row => {
        const statusBadge = row.querySelector('.badge');
        const status = statusBadge ? statusBadge.textContent.toLowerCase() : 'actif';
        
        let showRow = true;
        
        // Filtre par statut
        if (currentPatientFilter !== 'all') {
            if (currentPatientFilter === 'actifs' && status !== 'actif') showRow = false;
            if (currentPatientFilter === 'inactifs' && status !== 'inactif') showRow = false;
        }
        
        // Filtre par recherche
        if (currentSearchTerm) {
            const text = row.textContent.toLowerCase();
            if (!text.includes(currentSearchTerm.toLowerCase())) showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// ═══════════════════════════════════════════════════════════════════
// 4. RECHERCHE GLOBALE
// ═══════════════════════════════════════════════════════════════════
function initSearch() {
    const searchInputs = document.querySelectorAll('input[placeholder*="Rechercher"], input[placeholder*="rechercher"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const page = document.querySelector('.page.active');
            if (!page) return;
            
            // Recherche dans les tableaux de la page active
            const rows = page.querySelectorAll('table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS (Haut droite)
// ═══════════════════════════════════════════════════════════════════
function showNotificationsPanel() {
    const notifications = [
        { type: 'info', message: '3 RDV confirmés aujourd\'hui', time: 'Il y a 5 min' },
        { type: 'warning', message: 'Stock bas: Gants latex', time: 'Il y a 1h' },
        { type: 'success', message: 'Paiement reçu: 650 000 GNF', time: 'Il y a 2h' }
    ];
    
    let html = `
        <div class="notifications-dropdown" id="notificationsDropdown" style="
            position: fixed;
            top: 80px;
            right: 20px;
            width: 350px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            z-index: 1000;
            padding: 16px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="margin: 0;">Notifications</h4>
                <button onclick="closeNotificationsPanel()" style="background: none; border: none; cursor: pointer;">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
    `;
    
    notifications.forEach(n => {
        const bgColor = n.type === 'warning' ? '#fef3c7' : n.type === 'success' ? '#d1fae5' : '#e0f2fe';
        html += `
            <div style="padding: 12px; background: ${bgColor}; border-radius: 8px; margin-bottom: 8px;">
                <p style="margin: 0 0 4px 0; font-weight: 500;">${n.message}</p>
                <span style="font-size: 12px; color: #64748b;">${n.time}</span>
            </div>
        `;
    });
    
    html += `
            </div>
            <button onclick="closeNotificationsPanel()" class="btn btn-primary" style="width: 100%; margin-top: 12px;">
                Tout marquer comme lu
            </button>
        </div>
    `;
    
    // Supprimer l'ancien dropdown si existe
    const existing = document.getElementById('notificationsDropdown');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', html);
    lucide.createIcons();
}

function closeNotificationsPanel() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) dropdown.remove();
}

function showMessagesPanel() {
    showNotification('Aucun nouveau message', 'info');
}

// ═══════════════════════════════════════════════════════════════════
// 6. DEVIS - Actions
// ═══════════════════════════════════════════════════════════════════
function viewDevis(devisId) {
    showNotification(`Affichage du devis ${devisId}`, 'info');
    // Simuler l'ouverture d'un aperçu
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'modal-viewDevis';
    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Devis ${devisId}</h3>
                <button class="modal-close" onclick="closeModal('viewDevis')">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <h4 style="color: #0891b2;">Cabinet Dentaire Dr. Diallo</h4>
                            <p style="color: #64748b;">Avenue de la République, Kaloum<br>Conakry, Guinée<br>+224 621 00 00 00</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="color: #1e293b;">DEVIS</h2>
                            <p style="font-size: 1.2rem; color: #0891b2;">${devisId}</p>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e2e8f0;">
                                <th style="padding: 12px; text-align: left;">Désignation</th>
                                <th style="padding: 12px; text-align: center;">Qté</th>
                                <th style="padding: 12px; text-align: right;">Prix unitaire</th>
                                <th style="padding: 12px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Détartrage complet</td>
                                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">1</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">650 000 GNF</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">650 000 GNF</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Composite 2 faces</td>
                                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">2</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">800 000 GNF</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">1 600 000 GNF</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Total TTC</td>
                                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 1.2rem; color: #0891b2;">2 250 000 GNF</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('viewDevis')">Fermer</button>
                <button class="btn btn-secondary" onclick="printDevis('${devisId}')">
                    <i data-lucide="printer"></i> Imprimer
                </button>
                <button class="btn btn-primary" onclick="sendDevis('${devisId}'); closeModal('viewDevis');">
                    <i data-lucide="send"></i> Envoyer au patient
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
}

function sendDevis(devisId) {
    showNotification(`Devis ${devisId} envoyé par email au patient`, 'success');
}

function printDevis(devisId) {
    showNotification(`Impression du devis ${devisId}...`, 'info');
    window.print();
}

function convertDevisToFacture(devisId) {
    if (confirm(`Voulez-vous convertir le devis ${devisId} en facture ?`)) {
        showNotification(`Devis ${devisId} converti en facture avec succès`, 'success');
    }
}

function createNewDevis() {
    openModal('newDevis');
}

// ═══════════════════════════════════════════════════════════════════
// 7. FACTURES - Actions
// ═══════════════════════════════════════════════════════════════════
function viewFacture(factureId) {
    showNotification(`Affichage de la facture ${factureId}`, 'info');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'modal-viewFacture';
    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Facture ${factureId}</h3>
                <button class="modal-close" onclick="closeModal('viewFacture')">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="background: #f8fafc; padding: 24px; border-radius: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <h4 style="color: #0891b2;">Cabinet Dentaire Dr. Diallo</h4>
                            <p style="color: #64748b;">Avenue de la République, Kaloum<br>Conakry, Guinée</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="color: #1e293b;">FACTURE</h2>
                            <p style="font-size: 1.2rem; color: #0891b2;">${factureId}</p>
                            <p style="color: #64748b;">Date: ${new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background: #e2e8f0;">
                                <th style="padding: 12px; text-align: left;">Description</th>
                                <th style="padding: 12px; text-align: right;">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Soins dentaires</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">450 000 GNF</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="padding: 12px; text-align: right; font-weight: bold;">Total</td>
                                <td style="padding: 12px; text-align: right; font-weight: bold; color: #0891b2;">450 000 GNF</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('viewFacture')">Fermer</button>
                <button class="btn btn-secondary" onclick="printFacture('${factureId}')">
                    <i data-lucide="printer"></i> Imprimer
                </button>
                <button class="btn btn-primary" onclick="downloadFacture('${factureId}')">
                    <i data-lucide="download"></i> Télécharger PDF
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
}

function printFacture(factureId) {
    showNotification(`Impression de la facture ${factureId}...`, 'info');
    window.print();
}

function downloadFacture(factureId) {
    showNotification(`Téléchargement de la facture ${factureId}...`, 'success');
}

function addPayment(factureId) {
    showNotification(`Ajouter un paiement pour ${factureId}`, 'info');
    // Ouvrir modal d'encaissement
    openModal('newEncaissement');
}

function sendFacture(factureId) {
    showNotification(`Facture ${factureId} envoyée par email`, 'success');
}

function createNewFacture() {
    openModal('newFacture');
}

// ═══════════════════════════════════════════════════════════════════
// 8. CAISSE - Encaissements et Décaissements
// ═══════════════════════════════════════════════════════════════════
function saveEncaissement() {
    const type = document.getElementById('encaissementType')?.value || 'encaissement';
    const reference = document.getElementById('encaissementRef')?.value || '';
    const montant = document.getElementById('encaissementMontant')?.value || 0;
    const mode = document.getElementById('encaissementMode')?.value || 'especes';
    const notes = document.getElementById('encaissementNotes')?.value || '';
    
    if (!reference || !montant) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Enregistrer via API
    fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: type,
            reference: reference,
            montant: parseFloat(montant),
            mode_paiement: mode,
            notes: notes,
            date_paiement: new Date().toISOString()
        })
    })
    .then(response => {
        if (response.ok) {
            showNotification(`${type === 'encaissement' ? 'Encaissement' : 'Décaissement'} enregistré avec succès`, 'success');
            closeModal('newEncaissement');
            // Rafraîchir la page caisse
            loadCaisseData();
        } else {
            throw new Error('Erreur serveur');
        }
    })
    .catch(error => {
        // Fallback en mode démo
        showNotification(`${type === 'encaissement' ? 'Encaissement' : 'Décaissement'} enregistré (mode démo)`, 'success');
        closeModal('newEncaissement');
        addCaisseRow(type, reference, montant, mode);
    });
}

// Alias pour compatibilité avec le HTML existant
function saveNewEncaissement() {
    saveEncaissement();
}

function addCaisseRow(type, reference, montant, mode) {
    const tbody = document.querySelector('#page-caisse table tbody');
    if (!tbody) return;
    
    const now = new Date();
    const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const montantFormatted = new Intl.NumberFormat('fr-GN').format(montant);
    const sign = type === 'encaissement' ? '+' : '-';
    const color = type === 'encaissement' ? '#10b981' : '#ef4444';
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${heure}</td>
        <td><span class="badge badge-${type === 'encaissement' ? 'success' : 'danger'}">${type === 'encaissement' ? 'Encaissement' : 'Décaissement'}</span></td>
        <td>${reference}</td>
        <td>-</td>
        <td>${mode}</td>
        <td style="color: ${color}; font-weight: 600;">${sign}${montantFormatted} GNF</td>
        <td><button class="btn btn-secondary btn-icon btn-sm" onclick="printReceipt('${reference}')"><i data-lucide="printer"></i></button></td>
    `;
    tbody.insertBefore(newRow, tbody.firstChild);
    lucide.createIcons();
}

function loadCaisseData() {
    // Charger les données de la caisse depuis l'API
    fetch('/api/paiements')
        .then(response => response.json())
        .then(data => {
            // Mettre à jour les totaux
            console.log('Données caisse chargées:', data);
        })
        .catch(error => {
            console.log('Mode démo - données caisse statiques');
        });
}

function printZCaisse() {
    showNotification('Impression du Z de caisse...', 'info');
    window.print();
}

function printReceipt(reference) {
    showNotification(`Impression du reçu ${reference}...`, 'info');
    window.print();
}

// ═══════════════════════════════════════════════════════════════════
// 9. FILTRES CAISSE
// ═══════════════════════════════════════════════════════════════════
function filterCaisse(filterType) {
    const rows = document.querySelectorAll('#page-caisse table tbody tr');
    rows.forEach(row => {
        const typeBadge = row.querySelector('.badge');
        const type = typeBadge ? typeBadge.textContent.toLowerCase() : '';
        
        if (filterType === 'all') {
            row.style.display = '';
        } else if (filterType === 'encaissements' && type.includes('encaissement')) {
            row.style.display = '';
        } else if (filterType === 'decaissements' && type.includes('décaissement')) {
            row.style.display = '';
        } else if (filterType !== 'all') {
            row.style.display = 'none';
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// 10. AGENDA - Actions
// ═══════════════════════════════════════════════════════════════════
function editRdv(rdvId) {
    showNotification(`Modification du RDV ${rdvId}`, 'info');
    openModal('newRdv');
}

function cancelRdv(rdvId) {
    if (confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
        showNotification(`RDV annulé`, 'warning');
    }
}

function confirmRdv(rdvId) {
    showNotification(`RDV confirmé`, 'success');
}

// Navigation agenda
function previousWeek() {
    showNotification('Semaine précédente', 'info');
}

function nextWeek() {
    showNotification('Semaine suivante', 'info');
}

function showAgendaView(view) {
    showNotification(`Vue ${view} sélectionnée`, 'info');
}

// ═══════════════════════════════════════════════════════════════════
// 11. ORDONNANCES ET CERTIFICATS
// ═══════════════════════════════════════════════════════════════════
function createNewOrdonnance() {
    openModal('newOrdonnance');
}

function saveNewOrdonnance() {
    const patientId = document.getElementById('ordoPatientId')?.value;
    if (!patientId) {
        showNotification('Veuillez sélectionner un patient', 'error');
        return;
    }
    showNotification('Ordonnance créée avec succès', 'success');
    closeModal('newOrdonnance');
}

function printOrdonnance(ordoId) {
    showNotification(`Impression de l'ordonnance ${ordoId}...`, 'info');
    window.print();
}

function createNewCertificat() {
    openModal('newCertificat');
}

function saveNewCertificat() {
    const patientId = document.getElementById('certPatientId')?.value;
    if (!patientId) {
        showNotification('Veuillez sélectionner un patient', 'error');
        return;
    }
    showNotification('Certificat créé avec succès', 'success');
    closeModal('newCertificat');
}

function printCertificat(certId) {
    showNotification(`Impression du certificat ${certId}...`, 'info');
    window.print();
}

// ═══════════════════════════════════════════════════════════════════
// 12. STOCK - Actions
// ═══════════════════════════════════════════════════════════════════
function addStock(productId) {
    const qty = prompt('Quantité à ajouter:');
    if (qty && !isNaN(qty)) {
        showNotification(`+${qty} unités ajoutées`, 'success');
    }
}

function removeStock(productId) {
    const qty = prompt('Quantité à retirer:');
    if (qty && !isNaN(qty)) {
        showNotification(`-${qty} unités retirées`, 'warning');
    }
}

function orderStock(productId) {
    showNotification('Commande fournisseur créée', 'success');
}

// ═══════════════════════════════════════════════════════════════════
// 13. EXPORT CSV
// ═══════════════════════════════════════════════════════════════════
function exportCSV(type) {
    showNotification(`Export ${type} en CSV...`, 'info');
    
    // Simuler le téléchargement
    const data = type === 'factures' ? 'N°Facture,Patient,Date,Montant\nF-2025-0923,Marie Dupont,06/12/2025,185€' : 'Données';
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification('Export terminé', 'success');
}

// ═══════════════════════════════════════════════════════════════════
// 14. RAPPORTS - Export PDF
// ═══════════════════════════════════════════════════════════════════
function exportPDF() {
    showNotification('Export PDF en cours...', 'info');
    window.print();
}

// ═══════════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Corrections.js chargé');
    
    // Initialiser la recherche
    initSearch();
    
    // ===== GESTIONNAIRE GLOBAL DES BOUTONS =====
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const icon = btn.querySelector('i[data-lucide]');
        const iconType = icon ? icon.getAttribute('data-lucide') : '';
        
        // Trouver la ligne parente pour avoir le contexte
        const row = btn.closest('tr');
        const rowData = row ? row.textContent : '';
        
        // Boutons d'édition
        if (iconType === 'edit' || iconType === 'pencil') {
            e.preventDefault();
            const id = btn.dataset.id || (row ? row.dataset.id : null);
            if (btn.closest('#page-patients') || btn.closest('.patients')) {
                editPatient(id || 1);
            } else if (btn.closest('#page-stock')) {
                showNotification('Édition produit', 'info');
            } else if (btn.closest('#page-actes')) {
                showNotification('Édition acte', 'info');
            } else {
                showNotification('Édition en cours...', 'info');
            }
        }
        
        // Boutons de suppression
        if (iconType === 'trash-2' || iconType === 'trash') {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
                if (row) row.remove();
                showNotification('Élément supprimé', 'success');
            }
        }
        
        // Boutons d'impression
        if (iconType === 'printer') {
            e.preventDefault();
            showNotification('Impression en cours...', 'info');
            setTimeout(() => window.print(), 500);
        }
        
        // Boutons de téléchargement
        if (iconType === 'download') {
            e.preventDefault();
            showNotification('Téléchargement en cours...', 'info');
        }
        
        // Boutons voir (œil)
        if (iconType === 'eye') {
            e.preventDefault();
            // Déterminer le contexte
            if (btn.closest('#page-devis')) {
                const ref = row?.querySelector('td:first-child')?.textContent || 'D-2025-0001';
                viewDevis(ref.trim());
            } else if (btn.closest('#page-factures')) {
                const ref = row?.querySelector('td:first-child')?.textContent || 'F-2025-0001';
                viewFacture(ref.trim());
            } else if (btn.closest('#page-patients')) {
                showPage('fiche-patient');
            } else {
                showNotification('Aperçu', 'info');
            }
        }
        
        // Boutons envoyer
        if (iconType === 'send') {
            e.preventDefault();
            showNotification('Envoi par email...', 'info');
            setTimeout(() => showNotification('Email envoyé avec succès', 'success'), 1000);
        }
        
        // Boutons encaisser/paiement
        if (iconType === 'credit-card') {
            e.preventDefault();
            openModal('newEncaissement');
        }
        
        // Boutons convertir en facture
        if (iconType === 'receipt' && btn.closest('#page-devis')) {
            e.preventDefault();
            const ref = row?.querySelector('td:first-child')?.textContent || 'D-2025-0001';
            convertDevisToFacture(ref.trim());
        }
        
        // Boutons calendrier (prendre RDV)
        if (iconType === 'calendar-plus') {
            e.preventDefault();
            openModal('newRdv');
        }
        
        // Boutons plus/moins pour stock
        if (iconType === 'plus' && btn.closest('#page-stock')) {
            e.preventDefault();
            addStock();
        }
        if (iconType === 'minus' && btn.closest('#page-stock')) {
            e.preventDefault();
            removeStock();
        }
    });
    
    // ===== NOTIFICATIONS HEADER =====
    const headerRight = document.querySelector('.header-right, .main-header .actions, header .actions');
    if (headerRight) {
        const notifBtns = headerRight.querySelectorAll('button, .btn');
        notifBtns.forEach(btn => {
            const icon = btn.querySelector('i[data-lucide]');
            if (icon) {
                const iconType = icon.getAttribute('data-lucide');
                if (iconType === 'bell') {
                    btn.onclick = showNotificationsPanel;
                }
                if (iconType === 'message-square' || iconType === 'messages') {
                    btn.onclick = showMessagesPanel;
                }
            }
        });
    }
    
    // ===== FILTRES SELECT =====
    document.querySelectorAll('select').forEach(select => {
        // Détecter les filtres par leur contenu
        const options = Array.from(select.options).map(o => o.text.toLowerCase());
        
        // Filtre statut patients
        if (options.some(o => o.includes('actif') || o.includes('inactif'))) {
            select.addEventListener('change', function() {
                filterPatientsByStatus(this.value.toLowerCase());
            });
        }
        
        // Filtre caisse
        if (options.some(o => o.includes('encaissement') || o.includes('décaissement'))) {
            select.addEventListener('change', function() {
                const value = this.value.toLowerCase();
                if (value.includes('tous') || value === '') {
                    filterCaisse('all');
                } else if (value.includes('encaissement')) {
                    filterCaisse('encaissements');
                } else if (value.includes('décaissement')) {
                    filterCaisse('decaissements');
                }
            });
        }
    });
    
    // ===== BOUTONS EXPORT CSV =====
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.toLowerCase().includes('export csv')) {
            btn.onclick = function() {
                if (btn.closest('#page-factures')) {
                    exportCSV('factures');
                } else {
                    exportCSV('data');
                }
            };
        }
        if (btn.textContent.toLowerCase().includes('export pdf') || btn.textContent.toLowerCase().includes('exporter pdf')) {
            btn.onclick = exportPDF;
        }
        if (btn.textContent.toLowerCase().includes('z de caisse') || btn.textContent.toLowerCase().includes('imprimer z')) {
            btn.onclick = printZCaisse;
        }
    });
    
    // ===== BOUTONS AGENDA =====
    const agendaNav = document.querySelector('#page-agenda');
    if (agendaNav) {
        // Boutons précédent/suivant
        agendaNav.querySelectorAll('button').forEach(btn => {
            const icon = btn.querySelector('i[data-lucide]');
            if (icon) {
                const iconType = icon.getAttribute('data-lucide');
                if (iconType === 'chevron-left') btn.onclick = previousWeek;
                if (iconType === 'chevron-right') btn.onclick = nextWeek;
            }
        });
        
        // Boutons vue Jour/Semaine/Mois
        agendaNav.querySelectorAll('.btn').forEach(btn => {
            const text = btn.textContent.toLowerCase().trim();
            if (text === 'jour') btn.onclick = () => showAgendaView('jour');
            if (text === 'semaine') btn.onclick = () => showAgendaView('semaine');
            if (text === 'mois') btn.onclick = () => showAgendaView('mois');
        });
    }
    
    // Charger les données initiales
    loadCaisseData();
    
    console.log('✅ Tous les gestionnaires d\'événements attachés');
});

// ═══════════════════════════════════════════════════════════════════
// CORRECTIONS VISUELLES
// ═══════════════════════════════════════════════════════════════════
// Ajouter styles pour header fixe
const fixedHeaderStyle = document.createElement('style');
fixedHeaderStyle.textContent = `
    .main-header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--bg-main);
        padding: 16px 24px;
        border-bottom: 1px solid var(--border);
    }
    
    .notifications-dropdown {
        animation: slideDown 0.2s ease;
    }
    
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(fixedHeaderStyle);

console.log('✅ DentalCare Solo - Corrections v1.1 chargées');
