<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../utils/supabase.ts';

const tournaments = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

  if (data) tournaments.value = data;
  loading.value = false;
});
</script>

<template>
  <div class="admin-container">
    <div class="header-flex">
      <h1>Gestion des Tournois</h1>
      <router-link to="/admin/tournaments/create" class="btn-new">
        + Nouveau
      </router-link>
    </div>

    <div v-if="loading">Chargement...</div>

    <table v-else class="admin-table">
      <thead>
      <tr>
        <th>Titre</th>
        <th>Date</th>
        <th>Statut</th>
        <th>Format</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="t in tournaments" :key="t.id">
        <td>{{ t.title }}</td>
        <td>{{ new Date(t.start_date).toLocaleDateString() }}</td>
        <td>
          <span class="badge" :class="t.status">{{ t.status }}</span>
        </td>
        <td style="text-transform:uppercase">{{ t.match_format }}</td>
        <td>
          <router-link :to="`/admin/tournaments/${t.id}`" class="btn-manage">
            ⚙️ Gérer / Arbre
          </router-link>
        </td>
      </tr>
      </tbody>
    </table>

    <div v-if="tournaments.length === 0 && !loading" style="margin-top:20px; color:#666;">
      Aucun tournoi trouvé.
    </div>
  </div>
</template>

<style scoped>
.admin-container { color: white; }
.header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.btn-new { background: #2ecc71; color: black; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; }

.admin-table { width: 100%; border-collapse: collapse; background: #1a1a1a; border-radius: 8px; overflow: hidden; }
.admin-table th, .admin-table td { padding: 15px; text-align: left; border-bottom: 1px solid #333; }
.admin-table th { background: #111; color: #888; text-transform: uppercase; font-size: 0.8rem; }
.admin-table tr:hover { background: #222; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.badge.open { background: #2ecc71; color: black; }
.badge.started { background: #e67e22; color: white; }
.badge.completed { background: #34495e; color: white; }

.btn-manage { background: #00a8ff; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.9rem; }
.btn-manage:hover { background: #008ecc; }
</style>