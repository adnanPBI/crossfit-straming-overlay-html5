# Démarrage rapide — Français

1. Installer Node.js 20+ puis décompresser le projet.
2. Dans le dossier du projet, exécuter `npm start`.
3. Ouvrir `http://localhost:4173/control` et saisir la clé affichée dans le terminal. Choisir **FR** en haut de l'interface.
4. Le lien `http://localhost:4173/overlay` fournit l'overlay **transparent 1920×1080**.
5. Dans OBS, ajouter une **Source Navigateur** avec cette URL, largeur 1920, hauteur 1080, au-dessus de la caméra.
6. Dans OBS, cliquer **Démarrer la caméra virtuelle**, puis choisir **OBS Virtual Camera** dans Zoom.
7. Pour piloter avec un téléphone, ouvrir l'adresse réseau LAN indiquée dans le terminal et saisir la même clé. Les deux appareils doivent être sur le même réseau privé.

**Audio Zoom :** la caméra virtuelle OBS transmet la vidéo uniquement. Pour entendre les bips côté Zoom, un routage audio séparé est nécessaire. Tester la configuration réelle avant la réception du projet.

Il n'y a pas de compte développeur ni d'abonnement obligatoire. La sauvegarde JSON des scènes se trouve dans **Scènes**.
