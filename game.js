// =====================
// LES VARIABLES DU JEU
// =====================

let gold = 0;
let kills = 0;
let clickDmg = 1;
let autoDmg = 0;
let boutiqueOuverte = false;
let ameliorationOuverte = false;
let prestigeCount = 0;
let eclats = 0;
const BONUS_PRESTIGE = [
    { id: "dmgBonus", nom: "⚔️ Lame ancestrale", desc: "×2 dégâts par clic", cout: 1, effet: function () { clickDmg *= 2; } },
    { id: "autoBonus", nom: "🔄 Rouages éternels", desc: "×2 dégâts automatiques", cout: 1, effet: function () { autoDmg = Math.max(autoDmg * 2, 2); } },
    { id: "goldBonus", nom: "💰 Avarice divine", desc: "×2 or par kill", cout: 1, effet: function () { goldMultiplier *= 2; } },
    { id: "eclats2", nom: "💎 Taille-diamant", desc: "+50% éclats au prochain prestige", cout: 2, effet: function () { eclatBonus += 0.5; } },
];
let goldMultiplier = 1;
let eclatBonus = 0;
let bonusPrestigeAchetes = {};
let tempsDeJeu = 0;
let goldTotalGagne = 0;
let eclatsTotaux = 0;
let statsOuvert = false;
function formatNombre(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return Math.floor(n).toString();
}
let goldPerSec = 0;
let prestigeOuvert = false
let itemsAchetes = {};
let achatsCount = {};
let ameliorationCount = {};
let materiaux = {};
let craftingOuvert = false;

// =====================
// MATERIAUX DES BOSS
// =====================

const MATERIAUX_BOSS = [
    { id: "osAncien", nom: "Os Ancien", emoji: "🦴", boss: 1, desc: "Fragment du Gobelin Ancien" },
    { id: "essenceOssements", nom: "Essence d'Ossements", emoji: "💀", boss: 2, desc: "Âme du Roi des Ossements" },
    { id: "sangOrc", nom: "Sang d'Orc", emoji: "🩸", boss: 3, desc: "Sang du Seigneur Orc" },
    { id: "coeurDemon", nom: "Cœur de Démon", emoji: "❤️", boss: 4, desc: "Cœur de l'Archidémon" },
    { id: "ecailleDragon", nom: "Écaille de Dragon", emoji: "🐲", boss: 5, desc: "Écaille du Dragon Ancien" },
    { id: "fragmentTitan", nom: "Fragment de Titan", emoji: "⚡", boss: 6, desc: "Éclat du Titan Divin" },
];

function dropMateriauBoss() {
    const bossNum = bossVaincus; // bossVaincus vient d'être incrémenté
    const materiau = MATERIAUX_BOSS.find(m => m.boss === bossNum);
    if (materiau) {
        materiaux[materiau.id] = (materiaux[materiau.id] || 0) + 1;
        afficherNotification("Matériau obtenu : " + materiau.emoji + " " + materiau.nom + " !");
    }
}

function afficherNotification(texte) {
    const notif = document.createElement("div");
    notif.id = "notification";
    notif.textContent = texte;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #2a1f08;
        border: 2px solid #e8b84b;
        color: #e8b84b;
        padding: 12px 24px;
        border-radius: 10px;
        font-family: Georgia, serif;
        font-size: 1rem;
        z-index: 9999;
        animation: flotterDegat 2.5s ease-out forwards;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// =====================
// RECETTES DE CRAFTING
// =====================

const RECETTES = [
    {
        id: "lameSang",
        nom: "Lame de Sang",
        desc: "+800 dégâts/clic + 50 auto/sec",
        ingredients: { osAncien: 2, sangOrc: 1 },
        effet: function () { clickDmg += 800; autoDmg += 50; }
    },
    {
        id: "bouclierOss",
        nom: "Bouclier des Ossements",
        desc: "+300 auto/sec + 100 or/sec",
        ingredients: { essenceOssements: 2 },
        effet: function () { autoDmg += 300; goldPerSec += 100; }
    },
    {
        id: "lameAbime",
        nom: "Lame de l'Abîme",
        desc: "+5000 dégâts/clic",
        ingredients: { coeurDemon: 1, osAncien: 1 },
        effet: function () { clickDmg += 5000; }
    },
    {
        id: "armedragon",
        nom: "Lance du Dragon",
        desc: "+3000 auto/sec + 1000 or/sec",
        ingredients: { ecailleDragon: 1, sangOrc: 2 },
        effet: function () { autoDmg += 3000; goldPerSec += 1000; }
    },
    {
        id: "courroux",
        nom: "Courroux du Titan",
        desc: "+20000 dégâts/clic + 5000 auto/sec",
        ingredients: { fragmentTitan: 1, coeurDemon: 1, ecailleDragon: 1 },
        effet: function () { clickDmg += 20000; autoDmg += 5000; }
    },
    {
        id: "armeultime",
        nom: "Arme Ultime",
        desc: "+100000 dégâts/clic + 50000 auto/sec + 10000 or/sec",
        ingredients: { osAncien: 1, essenceOssements: 1, sangOrc: 1, coeurDemon: 1, ecailleDragon: 1, fragmentTitan: 1 },
        effet: function () { clickDmg += 100000; autoDmg += 50000; goldPerSec += 10000; }
    },
];

let recettesCraftees = {};

// =====================
// CRAFTING
// =====================

function toggleCrafting() {
    const panel = document.getElementById("craftingPanel");
    const btn = document.getElementById("craftingToggle");

    if (!craftingOuvert) {
        craftingOuvert = true;
        panel.className = "shop-ouvert";
        btn.textContent = "⚗️ Atelier ▲";
        afficherCrafting();
    } else {
        craftingOuvert = false;
        panel.className = "shop-ferme";
        btn.textContent = "⚗️ Atelier ▼";
    }
}

function afficherCrafting() {
    const liste = document.getElementById("craftingList");
    liste.innerHTML = "";

    // Affiche les matériaux disponibles
    const matDiv = document.createElement("div");
    matDiv.id = "matDisponibles";
    matDiv.style.marginBottom = "8px";
    matDiv.style.fontSize = "0.85rem";
    matDiv.style.color = "#e8b84b";

    const matTexte = MATERIAUX_BOSS.map(m => {
        const nb = materiaux[m.id] || 0;
        return m.emoji + " " + m.nom + " : " + nb;
    }).join(" | ");

    matDiv.textContent = matTexte || "Aucun matériau";
    liste.appendChild(matDiv);

    // Séparateur
    const hr = document.createElement("hr");
    hr.style.borderColor = "#4a3a1a";
    liste.appendChild(hr);

    // Recettes
    RECETTES.forEach(function (recette) {
        const deja = recettesCraftees[recette.id] || 0;
        const btn = document.createElement("button");

        // Vérifie si on a les ingrédients
        const peutCrafter = Object.entries(recette.ingredients).every(
            ([id, nb]) => (materiaux[id] || 0) >= nb
        );

        // Affiche les ingrédients
        const ingredTexte = Object.entries(recette.ingredients).map(([id, nb]) => {
            const mat = MATERIAUX_BOSS.find(m => m.id === id);
            return mat.emoji + " " + mat.nom + " x" + nb;
        }).join(", ");

        btn.textContent = recette.nom + " — " + recette.desc;
        if (deja > 0) btn.textContent += " [x" + deja + "]";
        btn.textContent += "\n📦 " + ingredTexte;
        btn.style.whiteSpace = "pre-line";
        btn.style.textAlign = "left";
        btn.style.width = "100%";
        btn.style.padding = "10px";
        btn.style.marginBottom = "4px";
        btn.style.fontSize = "0.82rem";
        btn.style.background = peutCrafter ? "#0c2a0c" : "#1a1408";
        btn.style.borderColor = peutCrafter ? "#2ecc71" : "#4a3a1a";
        btn.style.opacity = peutCrafter ? "1" : "0.5";
        btn.disabled = !peutCrafter;

        btn.onclick = function () {
            // Consomme les ingrédients
            Object.entries(recette.ingredients).forEach(([id, nb]) => {
                materiaux[id] = (materiaux[id] || 0) - nb;
            });
            recettesCraftees[recette.id] = deja + 1;
            recette.effet();
            sonAchat();
            afficherNotification("⚗️ " + recette.nom + " forgé !");
            afficherCrafting();
            updateUI();
        };

        liste.appendChild(btn);
    });
}

// =====================
// LE GOBELIN
// =====================

let goblinLvl = 1;
let bossVaincus = 0; 

function getEnemy(lvl) {
    const isBoss = lvl % 100 === 0;

    // Détermine la famille selon la zone
    let famille;
    if (lvl < 100) famille = { nom: "Gobelin", emoji: "👺", bossNom: "👹 Gobelin Ancien", bossEmoji: "👹" };
    else if (lvl < 200) famille = { nom: "Squelette", emoji: "💀", bossNom: "💀 Roi des Ossements", bossEmoji: "💀" };
    else if (lvl < 300) famille = { nom: "Orc", emoji: "👊", bossNom: "👑 Seigneur Orc", bossEmoji: "👑" };
    else if (lvl < 400) famille = { nom: "Démon", emoji: "😈", bossNom: "🔥 Archidémon", bossEmoji: "🔥" };
    else if (lvl < 500) famille = { nom: "Dragon", emoji: "🐲", bossNom: "🐲 Dragon Ancien", bossEmoji: "🐲" };
    else famille = { nom: "Titan", emoji: "⚡", bossNom: "⚡ Titan Divin", bossEmoji: "⚡" };

    if (isBoss) {
        return {
            name: "BOSS — " + famille.bossNom + " Niv." + lvl,
            maxHp: Math.floor(10 * Math.pow(1.1, lvl - 1)) * 10,
            hp: Math.floor(10 * Math.pow(1.1, lvl - 1)) * 10,
            gold: Math.floor(lvl * lvl * 8),
            isBoss: true,
            emoji: famille.bossEmoji
        };
    }

    return {
        name: famille.nom + " Niveau " + lvl,
        maxHp: Math.floor(10 * Math.pow(1.1, lvl - 1)),
        hp: Math.floor(10 * Math.pow(1.1, lvl - 1)),
        gold: Math.floor(lvl * lvl * 0.8),
        isBoss: false,
        emoji: famille.emoji
    };
}

let enemy = getEnemy(goblinLvl);

// =====================
// MISE A JOUR AFFICHAGE
// =====================

function updateUI() {
    document.getElementById("heroDmg").textContent = formatNombre(clickDmg);
    document.getElementById("killCount").textContent = formatNombre(kills);
    document.getElementById("enemyName").textContent = enemy.emoji + " " + enemy.name;
    document.getElementById("enemyHp").textContent = formatNombre(Math.max(0, enemy.hp));
    document.getElementById("enemyMaxHp").textContent = formatNombre(enemy.maxHp);
    document.getElementById("shopGoldCount").textContent = formatNombre(gold);
    document.getElementById("heroAuto").textContent = formatNombre(autoDmg);

    // Barre de vie
    const pct = Math.max(0, enemy.hp / enemy.maxHp) * 100;
    const bar = document.getElementById("hpBarFill");
    bar.style.width = pct + "%";

    if (pct > 60) {
        bar.style.backgroundColor = "#2ecc71";
    } else if (pct > 30) {
        bar.style.backgroundColor = "#e67e22";
    } else {
        bar.style.backgroundColor = "#e74c3c";
    }

    if (enemy.isBoss) {
        bar.classList.add("boss");
    } else {
        bar.classList.remove("boss");
    }

    if (boutiqueOuverte) afficherBoutique();
    if (ameliorationOuverte) afficherAmeliorations();
    if (prestigeOuvert) afficherPrestige();
}

// =====================
// ATTAQUE
// =====================

function clickAttack() {
    enemy.hp = enemy.hp - clickDmg;
    sonCoup();
    flashEnnemi();
    afficherDegat(clickDmg, false);

    if (enemy.hp <= 0) {
        const orGagne = Math.floor(enemy.gold * goldMultiplier);
        gold += orGagne;
        goldTotalGagne += orGagne;
        kills++;

        explosionEnnemi();
        afficherDegat(enemy.maxHp, true);

        if (enemy.isBoss) {
            sonBoss();
            tremblementEcran();
            bossVaincus++;
            dropMateriauBoss();
        } else {
            sonMort();
        }

        goblinLvl++;
        enemy = getEnemy(goblinLvl);
    }

    updateUI();
}

setInterval(function () {
    tempsDeJeu++;
    updateStats();

    if (goldPerSec > 0) {
        gold += goldPerSec;
        goldTotalGagne += goldPerSec;
    }

    if (autoDmg > 0) {
        enemy.hp -= autoDmg;

        if (enemy.hp <= 0) {
            const orGagne = Math.floor(enemy.gold * goldMultiplier);
            gold += orGagne;
            goldTotalGagne += orGagne;
            kills++;

            explosionEnnemi();
            afficherDegat(enemy.maxHp, true);

            if (enemy.isBoss) {
                sonBoss();
                tremblementEcran();
                bossVaincus++;
                dropMateriauBoss();
            } else {
                sonMort();
            }

            goblinLvl++;
            enemy = getEnemy(goblinLvl);
        }
    }

    updateUI();
}, 1000);

// =====================
// LES EQUIPEMENTS
// =====================

const ITEMS = [
    // --- Armures ---
    { id: "tunique", nom: "Tunique de cuir", desc: "+1 auto/sec", cout: 20, boss: 0, effet: function () { autoDmg += 1; } },
    { id: "cotte", nom: "Cotte de mailles", desc: "+5 auto/sec", cout: 80, boss: 0, effet: function () { autoDmg += 5; } },
    { id: "plastron", nom: "Plastron de bronze", desc: "+12 auto/sec", cout: 250, boss: 0, effet: function () { autoDmg += 12; } },
    { id: "plaques", nom: "Armure de plaques", desc: "+20 auto/sec", cout: 400, boss: 1, effet: function () { autoDmg += 20; } },
    { id: "dragon", nom: "Écailles de dragon", desc: "+100 auto/sec", cout: 2000, boss: 1, effet: function () { autoDmg += 100; } },
    { id: "golem", nom: "Armure de Golem", desc: "+500 auto/sec", cout: 10000, boss: 2, effet: function () { autoDmg += 500; } },
    { id: "ombre", nom: "Armure d'Ombre", desc: "+1500 auto/sec", cout: 40000, boss: 2, effet: function () { autoDmg += 1500; } },
    { id: "ange", nom: "Ailes d'Ange", desc: "+2000 auto/sec", cout: 50000, boss: 2, effet: function () { autoDmg += 2000; } },
    { id: "demon", nom: "Pacte Démoniaque", desc: "+10000 auto/sec", cout: 250000, boss: 3, effet: function () { autoDmg += 10000; } },
    { id: "phoenix", nom: "Armure du Phoenix", desc: "+50000 auto/sec", cout: 1000000, boss: 4, effet: function () { autoDmg += 50000; } },
    { id: "dieu", nom: "Armure Divine", desc: "+200000 auto/sec", cout: 5000000, boss: 5, effet: function () { autoDmg += 200000; } },

    // --- Or passif ---
    { id: "marchant", nom: "Marchand itinérant", desc: "+5 or/sec", cout: 500, boss: 0, effet: function () { goldPerSec += 5; } },
    { id: "banque", nom: "Banque du royaume", desc: "+50 or/sec", cout: 5000, boss: 1, effet: function () { goldPerSec += 50; } },
    { id: "tresor", nom: "Trésor de guerre", desc: "+300 or/sec", cout: 30000, boss: 2, effet: function () { goldPerSec += 300; } },
    { id: "empire", nom: "Empire commercial", desc: "+2000 or/sec", cout: 200000, boss: 3, effet: function () { goldPerSec += 2000; } },
    { id: "divin", nom: "Coffre divin", desc: "+20000 or/sec", cout: 2000000, boss: 4, effet: function () { goldPerSec += 20000; } },

    // --- Boucliers ---
    { id: "bouclier", nom: "Bouclier de bois", desc: "+3 auto/sec +2 or/sec", cout: 150, boss: 0, effet: function () { autoDmg += 3; goldPerSec += 2; } },
    { id: "aegis", nom: "Aegis de fer", desc: "+30 auto/sec +10 or/sec", cout: 3000, boss: 1, effet: function () { autoDmg += 30; goldPerSec += 10; } },
    { id: "rempart", nom: "Rempart du Titan", desc: "+5000 auto/sec +500 or/sec", cout: 500000, boss: 3, effet: function () { autoDmg += 5000; goldPerSec += 500; } },
];

// =====================
// AFFICHER LA BOUTIQUE
// =====================

function afficherBoutique() {
    const boutique = document.getElementById("shopList");
    boutique.innerHTML = "";

    ITEMS.forEach(function (item) {
        const nbAchats = achatsCount[item.id] || 0;
        const prixActuel = Math.floor(item.cout * Math.pow(1.5, nbAchats));

        const btn = document.createElement("button");

        // Item verrouillé par boss
        if (item.boss > bossVaincus) {
            btn.textContent = "🔒 " + item.nom + " — Vaincs le boss Niv." + (item.boss * 100);
            btn.disabled = true;
            btn.style.opacity = "0.3";
            boutique.appendChild(btn);
            return;
        }

        btn.textContent = item.nom + " — " + item.desc + " (coût : " + prixActuel + " 🪙)";
        if (nbAchats > 0) {
            btn.textContent += " [x" + nbAchats + "]";
        }

        if (gold < prixActuel) {
            btn.disabled = true;
            btn.style.opacity = "0.4";
        } else {
            btn.disabled = false;
            btn.style.opacity = "1";
        }

        btn.onclick = function () {
            const nb = achatsCount[item.id] || 0;
            const prix = Math.floor(item.cout * Math.pow(1.5, nb));
            if (gold >= prix) {
                gold -= prix;
                achatsCount[item.id] = nb + 1;
                item.effet();
                updateUI();
                sonAchat();
            }
        };

        boutique.appendChild(btn);
    });
}

// =====================
// SAUVEGARDE
// =====================

function saveGame() {
    const sauvegarde = {
        gold: gold,
        kills: kills,
        clickDmg: clickDmg,
        autoDmg: autoDmg,
        goblinLvl: goblinLvl,
        bossVaincus: bossVaincus,
        itemsAchetes: itemsAchetes,
        achatsCount: achatsCount,
        ameliorationCount: ameliorationCount,
        goldPerSec: goldPerSec,
        prestigeCount: prestigeCount,
        eclats: eclats,
        eclatsTotaux: eclatsTotaux,
        bonusPrestigeAchetes: bonusPrestigeAchetes,
        goldMultiplier: goldMultiplier,
        eclatBonus: eclatBonus,
        goldTotalGagne: goldTotalGagne,
        tempsDeJeu: tempsDeJeu,
        materiaux: materiaux,
        recettesCraftees: recettesCraftees,
    };
    localStorage.setItem("goblinSlayer", JSON.stringify(sauvegarde));
    alert("Partie sauvegardée ! 💾");
}

function resetGame() {
    if (confirm("Recommencer depuis le début ?")) {
        localStorage.removeItem("goblinSlayer");
        location.reload();
    }
}

function loadGame() {
    const data = localStorage.getItem("goblinSlayer");
    if (!data) return;

    const s = JSON.parse(data);
    gold = s.gold;
    kills = s.kills;
    clickDmg = s.clickDmg;
    autoDmg = s.autoDmg;
    goblinLvl = s.goblinLvl;
    bossVaincus = s.bossVaincus || 0;
    itemsAchetes = s.itemsAchetes || {};
    achatsCount = s.achatsCount || {};
    ameliorationCount = s.ameliorationCount || {};
    goldPerSec = s.goldPerSec || 0;
    prestigeCount = s.prestigeCount || 0;
    eclats = s.eclats || 0;
    eclatsTotaux = s.eclatsTotaux || 0;
    bonusPrestigeAchetes = s.bonusPrestigeAchetes || {};
    goldMultiplier = s.goldMultiplier || 1;
    eclatBonus = s.eclatBonus || 0;
    goldTotalGagne = s.goldTotalGagne || 0;
    tempsDeJeu = s.tempsDeJeu || 0;
    enemy = getEnemy(goblinLvl);
    materiaux = s.materiaux || {};
    recettesCraftees = s.recettesCraftees || {};
}

// On charge la sauvegarde au démarrage
loadGame();
updateUI();

// =====================
// SONS
// =====================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function jouerSon(frequence, type, duree, volume) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequence, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequence * 0.5, audioCtx.currentTime + duree);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duree);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duree);
}

function sonCoup() {
    jouerSon(220, "sawtooth", 0.08, 0.01); // ← 0.15 → 0.04
}

function sonMort() {
    jouerSon(440, "square", 0.2, 0.01); // ← 0.2 → 0.05
    setTimeout(() => jouerSon(220, "square", 0.2, 0.02), 100); // ← 0.15 → 0.04
}

function sonBoss() {
    jouerSon(100, "sawtooth", 0.3, 0.3);
    setTimeout(() => jouerSon(150, "sawtooth", 0.3, 0.3), 150);
    setTimeout(() => jouerSon(200, "sawtooth", 0.4, 0.25), 300);
}

function sonAchat() {
    jouerSon(600, "sine", 0.1, 0.1);
    setTimeout(() => jouerSon(800, "sine", 0.1, 0.1), 80);
}

function sonPrestige() {
    [300, 400, 500, 700, 900].forEach((f, i) => {
        setTimeout(() => jouerSon(f, "sine", 0.3, 0.2), i * 120);
    });
}

// =====================
// EFFETS VISUELS
// =====================

function afficherDegat(montant, isMort) {
    const arena = document.getElementById("arena");
    const div = document.createElement("div");
    div.className = "degat-flottant" + (isMort ? " mort" : "");
    div.textContent = isMort ? "💀 " + formatNombre(montant) : "-" + formatNombre(montant);

    // Position aléatoire dans l'arène
    div.style.left = (Math.random() * 60 + 30) + "%";
    div.style.top = (Math.random() * 30 + 20) + "%";

    arena.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

function flashEnnemi() {
    const sprite = document.getElementById("enemySprite");
    sprite.classList.remove("flash");
    void sprite.offsetWidth; // force reflow
    sprite.classList.add("flash");
    setTimeout(() => sprite.classList.remove("flash"), 150);
}

function explosionEnnemi() {
    const sprite = document.getElementById("enemySprite");
    sprite.classList.add("explosion");
    setTimeout(() => sprite.classList.remove("explosion"), 400);
}

function tremblementEcran() {
    const arena = document.getElementById("arena");
    arena.classList.add("tremblement");
    setTimeout(() => arena.classList.remove("tremblement"), 400);
}

// =====================
// MUSIQUE DE FOND
// =====================

const musique = new Audio('images/musiquejeu.wav');
musique.loop = true;
musique.volume = 0.3;
let musiqueActive = false;

function toggleMusique() {
    const btn = document.getElementById("musiqueBtn");
    if (musiqueActive) {
        musiqueActive = false;
        musique.pause();
        btn.textContent = "🔇 Musique : OFF";
    } else {
        musiqueActive = true;
        musique.play();
        btn.textContent = "🎵 Musique : ON";
    }
}

// =====================
// MENU DEROULANT
// =====================

function toggleBoutique() {
    const shopList = document.getElementById("shopList");
    const btn = document.getElementById("shopToggle");
    const amelioration = document.getElementById("ameliorationContainer");

    if (!boutiqueOuverte) {
        boutiqueOuverte = true;
        afficherBoutique();
        shopList.className = "shop-ouvert";
        btn.textContent = "🏪 Forgeron ▲";
    } else {
        boutiqueOuverte = false;
        shopList.innerHTML = "";
        shopList.className = "shop-ferme";
        btn.textContent = "🏪 Forgeron ▼";
    }

    // Repositionne le menu amélioration
    const shopContainer = document.getElementById("shopContainer");
    amelioration.style.top = (shopContainer.getBoundingClientRect().bottom + 8) + "px";
}

// =====================
// LISTE AMELIORATIONS
// =====================

const AMELIORATIONS = [
    { id: "dague", nom: "Dague rouillée", desc: "+2 dégâts/clic", cout: 15, boss: 0, effet: function () { clickDmg += 2; } },
    { id: "epee", nom: "Épée courte", desc: "+8 dégâts/clic", cout: 80, boss: 0, effet: function () { clickDmg += 8; } },
    { id: "glaive", nom: "Glaive de bataille", desc: "+15 dégâts/clic", cout: 200, boss: 0, effet: function () { clickDmg += 15; } },
    { id: "hache", nom: "Hache de guerre", desc: "+25 dégâts/clic", cout: 350, boss: 1, effet: function () { clickDmg += 25; } },
    { id: "lame", nom: "Lame de mercenaire", desc: "+50 dégâts/clic", cout: 800, boss: 1, effet: function () { clickDmg += 50; } },
    { id: "flamberge", nom: "Flamberge", desc: "+100 dégâts/clic", cout: 2000, boss: 1, effet: function () { clickDmg += 100; } },
    { id: "cimeterre", nom: "Cimeterre enchanté", desc: "+250 dégâts/clic", cout: 5000, boss: 1, effet: function () { clickDmg += 250; } },
    { id: "excalibur", nom: "Excalibur", desc: "+500 dégâts/clic", cout: 10000, boss: 2, effet: function () { clickDmg += 500; } },
    { id: "marteau", nom: "Marteau de guerre", desc: "+1000 dégâts/clic", cout: 25000, boss: 2, effet: function () { clickDmg += 1000; } },
    { id: "trident", nom: "Trident de l'abîme", desc: "+2000 dégâts/clic", cout: 75000, boss: 3, effet: function () { clickDmg += 2000; } },
    { id: "lameabime", nom: "Lame de l'Abîme", desc: "+5000 dégâts/clic", cout: 200000, boss: 3, effet: function () { clickDmg += 5000; } },
    { id: "foudre", nom: "Foudre de Zeus", desc: "+10000 dégâts/clic", cout: 500000, boss: 4, effet: function () { clickDmg += 10000; } },
    { id: "faux", nom: "Faux de la Mort", desc: "+30000 dégâts/clic", cout: 1500000, boss: 4, effet: function () { clickDmg += 30000; } },
    { id: "neant", nom: "Épée du Néant", desc: "+100000 dégâts/clic", cout: 10000000, boss: 5, effet: function () { clickDmg += 100000; } },
];

function afficherAmeliorations() {
    const liste = document.getElementById("ameliorationList");
    liste.innerHTML = "";

    AMELIORATIONS.forEach(function (item) {
        const nbActuel = ameliorationCount[item.id] || 0;
        const prixActuel = Math.floor(item.cout * Math.pow(1.5, nbActuel));

        const btn = document.createElement("button");

        // Item verrouillé par boss
        if (item.boss > bossVaincus) {
            btn.textContent = "🔒 " + item.nom + " — Vaincs le boss Niv." + (item.boss * 100);
            btn.disabled = true;
            btn.style.opacity = "0.3";
            liste.appendChild(btn);
            return;
        }

        btn.textContent = item.nom + " — " + item.desc + " (coût : " + prixActuel + " 🪙)";
        if (nbActuel > 0) {
            btn.textContent += " [x" + nbActuel + "]";
        }

        btn.style.opacity = gold >= prixActuel ? "1" : "0.4";

        btn.addEventListener("click", function () {
            const nb = ameliorationCount[item.id] || 0;
            const prix = Math.floor(item.cout * Math.pow(1.5, nb));
            if (gold >= prix) {
                gold -= prix;
                ameliorationCount[item.id] = nb + 1;
                item.effet();
                updateUI();
            }
        });

        liste.appendChild(btn);
    });
}

// =====================
// MENU AMELIORATIONS
// =====================

function toggleAmelioration() {
    const liste = document.getElementById("ameliorationList");
    const btn = document.getElementById("ameliorationToggle");

    if (!ameliorationOuverte) {
        ameliorationOuverte = true;
        afficherAmeliorations();
        liste.className = "shop-ouvert";
        btn.textContent = "⚔️ Améliorations ▲";
    } else {
        ameliorationOuverte = false;
        liste.className = "shop-ferme";
        btn.textContent = "⚔️ Améliorations ▼";
    }
}

// Position initiale du menu amélioration
window.addEventListener("load", function () {
    const shopContainer = document.getElementById("shopContainer");
    const amelioration = document.getElementById("ameliorationContainer");
    amelioration.style.top = (shopContainer.getBoundingClientRect().bottom + 8) + "px";
});

// =====================
// PRESTIGE
// =====================

function calculerEclats() {
    return Math.floor((goblinLvl / 100) * (1 + eclatBonus));
}

function afficherPrestige() {
    const liste = document.getElementById("prestigeList");
    liste.innerHTML = "";

    document.getElementById("prestigeEclats").textContent = eclats;
    document.getElementById("prestigeGain").textContent = calculerEclats();

    BONUS_PRESTIGE.forEach(function (bonus) {
        const nbAchats = bonusPrestigeAchetes[bonus.id] || 0;
        const cout = bonus.cout * (nbAchats + 1);

        const btn = document.createElement("button");
        btn.textContent = bonus.nom + " — " + bonus.desc + " (coût : " + cout + " 💎)";
        if (nbAchats > 0) btn.textContent += " [x" + nbAchats + "]";
        btn.disabled = eclats < cout;
        btn.style.opacity = eclats >= cout ? "1" : "0.4";

        btn.onclick = function () {
            if (eclats >= cout) {
                eclats -= cout;
                bonusPrestigeAchetes[bonus.id] = nbAchats + 1;
                bonus.effet();
                afficherPrestige();
                updateUI();
            }
        };

        liste.appendChild(btn);
    });
}

function prestige() {
    if (bossVaincus < 1) {
        alert("⚠️ Tu dois vaincre le boss niveau 100 d'abord !");
        return;
    }

    const gain = calculerEclats();
    if (!confirm("Recommencer depuis le début et gagner " + gain + " 💎 éclats de prestige ?")) return;

    eclats += gain;
    eclatsTotaux += gain;
    prestigeCount++;
    sonPrestige();

    gold = 0;
    kills = 0;
    clickDmg = 1;
    autoDmg = 0;
    goldPerSec = 0;
    goblinLvl = 1;
    bossVaincus = 0;
    achatsCount = {};
    ameliorationCount = {};
    itemsAchetes = {};
    enemy = getEnemy(1);

    BONUS_PRESTIGE.forEach(function (bonus) {
        const nb = bonusPrestigeAchetes[bonus.id] || 0;
        for (let i = 0; i < nb; i++) bonus.effet();
    });

    updateUI();
    afficherPrestige();
    alert("✨ Prestige " + prestigeCount + " ! Tu as gagné " + gain + " 💎");
}

// =====================
// MENU PRESTIGE
// =====================

function togglePrestige() {
    const panel = document.getElementById("prestigePanel");
    const btn = document.getElementById("prestigeToggle");

    if (!prestigeOuvert) {
        prestigeOuvert = true;
        panel.className = "shop-ouvert";
        btn.textContent = "💎 Prestige ▲";
        afficherPrestige();
    } else {
        prestigeOuvert = false;
        panel.className = "shop-ferme";
        btn.textContent = "💎 Prestige ▼";
    }
}

// =====================
// STATISTIQUES
// =====================

function toggleStats() {
    const panel = document.getElementById("statsPanel");
    const btn = document.getElementById("statsToggle");

    if (!statsOuvert) {
        statsOuvert = true;
        panel.className = "shop-ouvert";
        btn.textContent = "📊 Statistiques ▲";
        updateStats();
    } else {
        statsOuvert = false;
        panel.className = "shop-ferme";
        btn.textContent = "📊 Statistiques ▼";
    }
}

function updateStats() {
    if (!statsOuvert) return;

    const h = Math.floor(tempsDeJeu / 3600);
    const m = Math.floor((tempsDeJeu % 3600) / 60);
    const s = tempsDeJeu % 60;
    const temps = (h > 0 ? h + "h " : "") + (m > 0 ? m + "m " : "") + s + "s";

    document.getElementById("statTemps").textContent = temps;
    document.getElementById("statKills").textContent = formatNombre(kills);
    document.getElementById("statGoldTotal").textContent = formatNombre(goldTotalGagne) + " 🪙";
    document.getElementById("statBoss").textContent = bossVaincus;
    document.getElementById("statPrestige").textContent = prestigeCount;
    document.getElementById("statDps").textContent = formatNombre(clickDmg + autoDmg);
    document.getElementById("statEclats").textContent = eclatsTotaux + " 💎";
}

function setLevel(lvl) {
    goblinLvl = lvl;
    enemy = getEnemy(goblinLvl);
    updateUI();
    console.log("Niveau défini à " + lvl);
}

function setGold(montant) {
    gold = montant;
    updateUI();
    console.log("Or défini à " + montant);
}






