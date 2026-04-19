// دالة غير متزامنة لجلب البيانات باستخدام تقنية دمج الطلبات
async function loadComics(type) {
    const container = document.getElementById('results-container');
    
    // رسالة التحميل
    container.innerHTML = '<h2 style="text-align:center; width:100%;">Chargement de 50 œuvres en cours...</h2>';

    try {
        // 1. تجهيز الطلبات (الصفحة 1 والصفحة 2) - كل صفحة تجلب 25 عنصر
        // نستخدم page=1 و page=2 مع حد 25 الأقصى لـ Jikan
        const request1 = fetch(`https://api.jikan.moe/v4/manga?type=${type}&order_by=score&sort=desc&limit=25&page=1`);
        const request2 = fetch(`https://api.jikan.moe/v4/manga?type=${type}&order_by=score&sort=desc&limit=25&page=2`);

        // 2. تنفيذ الطلبين في نفس اللحظة والانتظار حتى يكتملان
        const [response1, response2] = await Promise.all([request1, request2]);

        // 3. تحويل الردود إلى صيغة JSON
        const data1 = await response1.json();
        const data2 = await response2.json();

        // 4. دمج المصفوفتين معاً باستخدام (Spread Syntax) لنحصل على 50 عنصر
        const allComics = [...data1.data, ...data2.data];
        
        // تفريغ الحاوية للبدء في عرض البيانات
        container.innerHTML = '';

        // 5. إنشاء البطاقات للـ 50 عنصر
        allComics.forEach(comic => {
            const card = document.createElement('article');
            card.className = 'card';

            const synopsis = comic.synopsis ? comic.synopsis.substring(0, 150) + '...' : 'Aucune description disponible.';
            const author = comic.authors.length > 0 ? comic.authors[0].name : 'Inconnu';

            card.innerHTML = `
                <img src="${comic.images.jpg.image_url}" alt="Couverture de ${comic.title}">
                <div class="card-info">
                    <h3>${comic.title}</h3>
                    <p><strong>Auteur:</strong> ${author}</p>
                    <p>⭐ <strong>Note:</strong> ${comic.score || 'N/A'}/10</p>
                    <p class="description">${synopsis}</p>
                    <p><strong>Chapitres:</strong> ${comic.chapters || 'En cours'}</p>
                    <a href="${comic.url}" target="_blank" class="read-btn">Plus d'infos / Lire</a>
                    <a href="draw.html?comic_id=${comic.mal_id}" class="read-btn" style="border-color: #f1c40f; color: #f1c40f; margin-top: 10px;">🎨 Dessiner un Fan Art</a>
                </div>
            `;
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erreur de connexion API:", error);
        container.innerHTML = '<h2 style="text-align:center; color:red; width:100%;">Erreur lors du chargement. Veuillez rafraîchir la page.</h2>';
    }
}
/* =========================================
   NOUVEAU : BARRE DE RECHERCHE EN DIRECT
   ========================================= */
function filterComics() {
    // Récupérer ce que l'utilisateur a tapé et le mettre en minuscules
    const input = document.getElementById('search-bar').value.toLowerCase();
    
    // Sélectionner toutes les cartes générées par l'API
    const cards = document.querySelectorAll('.card');

    // Boucler sur chaque carte pour voir si le titre correspond
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        
        if (title.includes(input)) {
            card.style.display = ""; // Afficher la carte
        } else {
            card.style.display = "none"; // Cacher la carte
        }
    });
}

/* =========================================
   NOUVEAU : GESTION DU DARK/LIGHT MODE
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            // Ajoute ou enlève la classe 'light-mode' au body
            document.body.classList.toggle('light-mode');
            
            // Change le texte du bouton en fonction du thème
            if (document.body.classList.contains('light-mode')) {
                themeBtn.innerText = '🌙 Mode Sombre';
            } else {
                themeBtn.innerText = '☀️ Mode Clair';
            }
        });
    }
});
