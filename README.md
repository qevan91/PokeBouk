# PokéBouk - Plateforme Web, Wiki, Boutique & Système de Tournois e-sport

![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

Bienvenue sur le repo de la plateforme **PokéBouk** !

À l'origine, ce projet a été pensé pour accompagner un serveur Minecraft communautaire (lié à la chaîne Twitch d'un ami).
L'objectif était de concevoir une boutique, un Wiki collaboratif, mais surtout **d'automatiser de A à Z la gestion de nos tournois**.

Fini les arbres de tournoi gérés à la main sur Excel et sur un papier. La plateforme s'occupe de tout, de l'inscription jusqu'à la courronne du vainqueur. L'arbre est consultable par tout le monde.

## Features

* 🎮 **Authentification OAuth Twitch :** Les joueurs se connectent directement avec leur compte Twitch. Une vérification est faite au premier login pour lier leur pseudo Minecraft in-game.
* ⚔️ **Moteur de Tournois Automatisé :**
    * Gestion complète des formats : **BO1, BO3, BO5 (BO3 = Le meilleur au 3 manches)**.
    * Algorithme de génération d'arbre à élimination directe.
    * *Smart Byes* : Si le nombre de joueurs n'est pas une puissance de 2 (ex: 5 joueurs), le système calcule et attribue automatiquement les victoires par forfait (Byes) pour équilibrer le bracket.
    * Progression dynamique : Entrez le score, le gagnant avance tout seul au round suivant.
* 📚 **Wiki :** Création et lecture de guides/tutos en Markdown, avec gestion d'images et intégration de vidéos Youtube.
* 🛡️ **Panel Administrateur :** Un back-office complet protégé pour gérer les articles, expulser des joueurs, lancer les arbres de tournois et éditer les scores en direct.

## 🛠️ La Stack Technique

J'ai fait le choix d'une architecture moderne, typée et Serverless.

- **Frontend :** Vue.js 3, TypeScript, Vite, Vue Router.
- **Backend (BaaS) :** Supabase (Base de données relationnelle PostgreSQL).
- **Authentification :** Supabase Auth (Provider: Twitch).
- **Markdown Parsing :** `marked` (pour la conversion du contenu Wiki).
- **Styling :** CSS natif orienté composants (Scoped), variables CSS, Flexbox/Grid, Glassmorphism.

## Boutique

L'intégralié du backend de la boutique est géré par [craftingstore](https://craftingstore.net/).

**CraftingStore** est une plateforme qui permet de créer une boutique en ligne pour un serveur de jeu (Minecraft, CS:GO, Garry's Mod, Rust, ect...) afin de vendre des choses aux joueurs, comme des grades et objets.

- Les joueurs achètent des items/ranks avec de l’argent via Paypal, CB ect....
- Le plugin donne automatiquement les récompenses en jeu.

## 🚀 Installation & Lancement en local

Si tu veux faire tourner le projet sur ta machine, voici la marche à suivre.

### 1. Cloner le projet
```bash
git clone [https://github.com/qevan91/pokebouk-shop.git](https://github.com/qevan91/pokebouk-shop.git)
cd pokebouk-shop
```
