let tousLesComics = [];
let pageActuelle  = 1;
const PAR_PAGE    = 20;
let rechercheActive = false;
let comicsFiltres   = [];

function marquerLienActif() {
  const urlActuelle = window.location.pathname;
  const liens = document.querySelectorAll('.nav-liens a');
  liens.forEach(function(lien) {
    if (urlActuelle.includes(lien.getAttribute('href'))) {
      lien.classList.add('actif');
    }
  });
}

document.addEventListener('DOMContentLoaded', marquerLienActif);

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') fermerModal();
});

async function chargerComics(type) {
  const grille = document.getElementById('grille');
  grille.innerHTML = '<p class="chargement">⏳ Chargement en cours...</p>';
  tousLesComics = [];

  try {
    const nombrePages = 20;
    const promesses = [];

    for (let p = 1; p <= nombrePages; p++) {
      const url = `https://api.jikan.moe/v4/manga?type=${type}&order_by=score&sort=desc&limit=25&page=${p}`;
      promesses.push(
        fetch(url).then(function(reponse) {
          return reponse.json();
        })
      );
      if (p % 3 === 0) {
        await attendre(500);
      }
    }

    const resultats = await Promise.allSettled(promesses);

    resultats.forEach(function(resultat) {
      if (resultat.status === 'fulfilled' && resultat.value.data) {
        tousLesComics = tousLesComics.concat(resultat.value.data);
      }
    });

    const vus = new Set();
    tousLesComics = tousLesComics.filter(function(c) {
      if (vus.has(c.mal_id)) return false;
      vus.add(c.mal_id);
      return true;
    });

    if (tousLesComics.length === 0) {
      grille.innerHTML = '<p class="vide">Aucun résultat trouvé.</p>';
      return;
    }

    pageActuelle = 1;
    afficherPage();
    mettreAJourPagination();

  } catch (erreur) {
    console.error(erreur);
    grille.innerHTML = '<p class="vide">❌ Impossible de charger. Vérifiez votre connexion.</p>';
  }
}

function attendre(ms) {
  return new Promise(function(resoudre) {
    setTimeout(resoudre, ms);
  });
}

function afficherPage() {
  const grille = document.getElementById('grille');
  const listeAfficher = rechercheActive ? comicsFiltres : tousLesComics;
  const debut = (pageActuelle - 1) * PAR_PAGE;
  const fin   = debut + PAR_PAGE;
  const page  = listeAfficher.slice(debut, fin);

  if (page.length === 0) {
    grille.innerHTML = '<p class="vide">Aucun résultat trouvé.</p>';
    return;
  }

  grille.innerHTML = page.map(function(c) {
    const titre = c.title || 'Titre inconnu';
    const score = c.score ? '⭐ ' + c.score.toFixed(1) : '— pas de score';
    const image = c.images?.jpg?.image_url || '';

    return `
      <div class="carte" onclick="ouvrirDetails(${c.mal_id})">
        ${image ? `<img src="${image}" alt="${titre}" loading="lazy">` : ''}
        <div class="carte-corps">
          <div class="carte-titre" title="${titre}">${titre}</div>
          <div class="carte-score">${score}</div>
          <div class="carte-lien">Voir les détails →</div>
        </div>
      </div>
    `;
  }).join('');

  grille.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mettreAJourPagination() {
  const btnPrecedent = document.getElementById('btn-precedent');
  const btnSuivant   = document.getElementById('btn-suivant');
  const infoPage     = document.getElementById('info-page');

  if (!btnPrecedent) return;

  const listeAfficher = rechercheActive ? comicsFiltres : tousLesComics;
  const totalPages = Math.ceil(listeAfficher.length / PAR_PAGE);

  infoPage.textContent = `Page ${pageActuelle} / ${totalPages}`;
  btnPrecedent.disabled = (pageActuelle === 1);
  btnSuivant.disabled   = (pageActuelle === totalPages);
}

function pagePrecedente() {
  if (pageActuelle > 1) {
    pageActuelle--;
    afficherPage();
    mettreAJourPagination();
  }
}

function pageSuivante() {
  const liste = rechercheActive ? comicsFiltres : tousLesComics;
  const totalPages = Math.ceil(liste.length / PAR_PAGE);
  if (pageActuelle < totalPages) {
    pageActuelle++;
    afficherPage();
    mettreAJourPagination();
  }
}

function rechercherComics() {
  const texteRecherche = document.getElementById('recherche').value.toLowerCase().trim();

  if (texteRecherche === '') {
    rechercheActive = false;
  } else {
    rechercheActive = true;
    comicsFiltres = tousLesComics.filter(function(c) {
      const titre   = (c.title || '').toLowerCase();
      const titreEN = (c.title_english || '').toLowerCase();
      return titre.includes(texteRecherche) || titreEN.includes(texteRecherche);
    });
  }

  pageActuelle = 1;
  afficherPage();
  mettreAJourPagination();
}

async function ouvrirDetails(malId) {
  const overlay = document.getElementById('modal-overlay');
  const contenu = document.getElementById('modal-contenu');

  overlay.classList.add('actif');
  document.body.style.overflow = 'hidden';
  contenu.innerHTML = '<p class="chargement">⏳ Chargement des détails...</p>';

  try {
    const reponse = await fetch(`https://api.jikan.moe/v4/manga/${malId}`);
    const data = await reponse.json();
    const c = data.data;

    const titre    = c.title || 'Titre inconnu';
    const titreEN  = c.title_english || '';
    const image    = c.images?.jpg?.large_image_url || c.images?.jpg?.image_url || '';
    const score    = c.score ? '⭐ ' + c.score.toFixed(1) + '/10' : '— pas encore noté';
    const synopsis = c.synopsis || 'Aucun synopsis disponible.';
    const chapitres = c.chapters ? c.chapters : '-';
    const volumes   = c.volumes  ? c.volumes  : '-';
    const statut    = c.status   || '—';
    const debut     = c.published?.prop?.from?.year || '—';
    const genres    = (c.genres || []).map(function(g) { return g.name; });
    const themes    = (c.themes || []).map(function(t) { return t.name; });
    const tousGenres = [...genres, ...themes];
    const auteurs   = (c.authors || []).map(function(a) { return a.name; }).join(', ') || '—';

    contenu.innerHTML = `
      <div class="modal-interieur">
        <button class="modal-fermer" onclick="fermerModal()">✕</button>
        <div class="modal-haut">
          ${image ? `<img src="${image}" alt="${titre}" class="modal-image">` : ''}
          <div class="modal-info">
            <h2>${titre}</h2>
            ${titreEN && titreEN !== titre ? `<div class="modal-titre-en">${titreEN}</div>` : ''}
            <div class="modal-score">${score}</div>
            ${tousGenres.length > 0 ? `
              <div class="modal-tags">
                ${tousGenres.map(function(g) { return `<span class="modal-tag">${g}</span>`; }).join('')}
              </div>
            ` : ''}
            <div class="modal-meta">
              <div class="modal-meta-item">
                <strong>Statut</strong>
                ${statut}
              </div>
              <div class="modal-meta-item">
                <strong>Chapitres</strong>
                ${chapitres}
              </div>
              <div class="modal-meta-item">
                <strong>Volumes</strong>
                ${volumes}
              </div>
              <div class="modal-meta-item">
                <strong>Début</strong>
                ${debut}
              </div>
            </div>
            ${auteurs !== '—' ? `<div class="modal-auteurs" style="margin-top:16px">✍️ <strong>Auteur(s) :</strong> ${auteurs}</div>` : ''}
          </div>
        </div>
        <hr class="modal-separateur">
        <div class="modal-synopsis">
          <h3>Synopsis</h3>
          <p>${synopsis}</p>
        </div>
      </div>
    `;

  } catch (e) {
    contenu.innerHTML = '<p class="vide">❌ Impossible de charger les détails.</p>';
  }
}

function fermerModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('actif');
    document.body.style.overflow = '';
  }
}

function fermerModalFond(evenement) {
  if (evenement.target === document.getElementById('modal-overlay')) {
    fermerModal();
  }
}

function gererInscription(evenement) {
  evenement.preventDefault();

  const nom   = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  const mdp   = document.getElementById('mdp').value;
  const msgErreur = document.getElementById('msg-erreur');

  if (mdp.length < 8) {
    msgErreur.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
    msgErreur.style.display = 'block';
    return;
  }

  msgErreur.style.display = 'none';
  localStorage.setItem('utilisateurNom',   nom);
  localStorage.setItem('utilisateurEmail', email);
  localStorage.setItem('estConnecte',      'oui');
  alert('✅ Compte créé ! Bienvenue, ' + nom + ' !');
  window.location.href = './connexion.html';
}

function gererConnexion(evenement) {
  evenement.preventDefault();

  const emailSaisi = document.getElementById('email').value.trim();
  const msgErreur  = document.getElementById('msg-erreur');
  const emailSauvegarde = localStorage.getItem('utilisateurEmail');

  if (!emailSauvegarde || emailSaisi !== emailSauvegarde) {
    msgErreur.textContent = "Email non reconnu. Créez un compte d'abord.";
    msgErreur.style.display = 'block';
    return;
  }

  msgErreur.style.display = 'none';
  localStorage.setItem('estConnecte', 'oui');
  alert('✅ Connexion réussie ! Bonjour ' + localStorage.getItem('utilisateurNom') + ' !');
  window.location.href = '../index.html';
}
