<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../utils/supabase.ts';

interface Tournament {
  id: number;
  title: string;
  start_date: string;
  match_format: string;
  max_players: number;
  status: 'open' | 'started' | 'completed';
  participants: { count: number }[];
  participants_count: number;
}

const tournaments = ref<Tournament[]>([]);
const myRegistrations = ref<number[]>([]);
const loading = ref(true);
const userId = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    await fetchUser();
    await fetchTournaments();
  } catch (error) {
    console.error("Erreur de chargement des tournois:", error);
  } finally {
    loading.value = false;
  }
});

const fetchUser = async () => {
  const { data } = await supabase.auth.getUser();
  userId.value = data.user?.id || null;

  if (userId.value) {
    const { data: myData } = await supabase
        .from('tournament_participants')
        .select('tournament_id')
        .eq('user_id', userId.value);

    if (myData) {
      myRegistrations.value = myData.map(r => r.tournament_id);
    }
  }
};

const fetchTournaments = async () => {
  const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        participants:tournament_participants(count)
      `)
      .order('start_date', { ascending: false });

  if (error) throw error;

  if (data) {
    tournaments.value = data.map((t: any) => ({
      ...t,
      participants_count: t.participants[0]?.count || 0
    }));
  }
};

const joinTournament = async (tournamentId: number) => {
  if (!userId.value) return alert("Connecte-toi pour participer !");
  if (!confirm("Confirmes-tu ton inscription à ce tournoi ?")) return;

  const { error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: userId.value
      });

  if (error) {
    alert("Erreur : " + error.message);
  } else {
    alert("Tu es inscrit ! Prépare ton équipe.");
    await fetchUser();
    await fetchTournaments();
  }
};
</script>

<template>
  <div class="container page-spacing">
    <h1 class="page-title">Liste des Tournois</h1>

    <div v-if="loading" class="loading">Chargement des arènes...</div>

    <div v-else-if="tournaments.length === 0" class="empty-state">
      <p>Aucun tournoi pour le moment.</p>
    </div>

    <div v-else class="tournament-grid">
      <div v-for="t in tournaments" :key="t.id" class="tournament-card" :class="t.status">
        <div class="card-header">
          <div class="header-top">
            <span class="format-badge">{{ t.match_format.toUpperCase() }}</span>
            <span class="tourney-status" :class="t.status">{{ t.status === 'open' ? 'Inscription ouverte' : t.status === 'started' ? 'En cours' : 'Terminé' }}</span>
          </div>
          <h3>{{ t.title }}</h3>
        </div>

        <div class="card-body">
          <p class="date">📅 {{ new Date(t.start_date).toLocaleString() }}</p>

          <div class="progress-section">
            <div class="progress-bar">
              <div
                  class="fill"
                  :style="{ width: (t.participants_count / t.max_players * 100) + '%' }"
              ></div>
            </div>
            <p class="players-count">{{ t.participants_count }} / {{ t.max_players }} Joueurs</p>
          </div>
        </div>

        <div class="card-action">
          <router-link :to="`/tournaments/${t.id}`" class="btn-details">
            👁️ Voir Détails / Arbre
          </router-link>

          <template v-if="t.status === 'open'">
            <button v-if="myRegistrations.includes(t.id)" class="btn-registered" disabled>
              ✅ Déjà Inscrit
            </button>
            <button v-else-if="t.participants_count >= t.max_players" class="btn-full" disabled>
              🔒 Complet
            </button>
            <button v-else @click="joinTournament(t.id)" class="btn-join">
              ⚔️ S'inscrire
            </button>
          </template>

          <div v-else class="closed-info">
            {{ t.status === 'started' ? '⚔️ Tournoi en cours de combat' : '🏁 Tournoi terminé' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-spacing { padding-top: 50px; padding-bottom: 80px; color: white; }
.page-title { text-align: center; margin-bottom: 40px; font-size: 2.5rem; text-transform: uppercase; letter-spacing: 2px; }

.tournament-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; }

.tournament-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  display: flex; flex-direction: column;
  transition: transform 0.3s;
}
.tournament-card:hover { transform: translateY(-5px); border-color: #00a8ff; }

/* Status Styles */
.tourney-status {
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 10px;
  text-transform: uppercase;
  font-weight: bold;
  display: inline-block;
}
.tourney-status.open { background: #2ecc71; color: black; }
.tourney-status.started { background: #e67e22; color: white; }
.tourney-status.completed { background: #34495e; color: white; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }

.card-header { background: rgba(0,0,0,0.3); padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.card-header h3 { margin: 10px 0 0 0; font-size: 1.4rem; }
.format-badge { background: #6c5ce7; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }

.card-body { padding: 20px; flex-grow: 1; }
.date { color: #aaa; margin-bottom: 20px; font-size: 0.9rem; }

.progress-bar { height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
.fill { height: 100%; background: #2ecc71; transition: width 0.5s; }
.players-count { text-align: right; font-size: 0.85rem; color: #ccc; }

.card-action { padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }

button { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; font-size: 1rem; }
.btn-join { background: #00a8ff; color: white; }
.btn-registered { background: #2ecc71; color: white; cursor: default; opacity: 0.8; }
.btn-full { background: #e74c3c; color: white; cursor: default; opacity: 0.6; }

.btn-details {
  display: block; width: 100%; padding: 12px; background: #34495e; color: white;
  text-align: center; text-decoration: none; border-radius: 8px; font-weight: bold;
  margin-bottom: 10px; transition: 0.2s;
}
.btn-details:hover { background: #2c3e50; }

.closed-info { padding: 10px; color: #888; font-style: italic; font-size: 0.9rem; }
.empty-state { text-align: center; padding: 50px; opacity: 0.6; }
</style>