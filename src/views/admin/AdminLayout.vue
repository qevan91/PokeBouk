<script setup lang="ts">
import { useRouter } from 'vue-router';
import { supabase } from '../../utils/supabase.ts';

const router = useRouter();

const logout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="admin-logo">ADMIN PANEL</div>

      <nav>
        <p class="menu-label">Contenu</p>
        <router-link to="/admin/wiki">📚 Articles Wiki</router-link>

        <p class="menu-label">Événements</p>

        <router-link to="/admin/tournaments">📋 Liste Tournois</router-link>
        <router-link to="/admin/tournaments/create">➕ Créer Tournoi</router-link>

        <div class="separator"></div>

        <router-link to="/" class="back-link">← Retour Site</router-link>
      </nav>

      <button @click="logout" class="btn-logout">Déconnexion</button>
    </aside>

    <main class="content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; color: white; }
.sidebar {
  width: 250px;
  background: #111;
  border-right: 1px solid #333;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.admin-logo { font-size: 1.5rem; font-weight: bold; color: #ff4757; margin-bottom: 30px; letter-spacing: 2px; text-align: center; }

nav { display: flex; flex-direction: column; gap: 5px; flex-grow: 1; }

.menu-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #666;
  margin-top: 15px;
  margin-bottom: 5px;
  padding-left: 10px;
  font-weight: bold;
}

nav a {
  padding: 10px 15px;
  color: #aaa;
  text-decoration: none;
  border-radius: 5px;
  transition: 0.2s;
  font-size: 0.95rem;
}
nav a:hover, nav a.router-link-active { background: #333; color: white; }
nav a.router-link-active { border-left: 4px solid #ff4757; background: #222; }

.separator { height: 1px; background: #333; margin: 20px 0; }
.back-link { border: 1px solid #444; text-align: center; margin-top: auto; }

.content { flex-grow: 1; padding: 40px; background: #0a0a0a; overflow-y: auto; }
.btn-logout { background: #e74c3c; color: white; border: none; padding: 12px; cursor: pointer; border-radius: 5px; margin-top: 10px; font-weight: bold; }
.btn-logout:hover { background: #c0392b; }
</style>