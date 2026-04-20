<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../../utils/supabase.ts';
import TournamentBracket from './TournamentBracket.vue';

const route = useRoute();
const tournament = ref<any>(null);
const participants = ref<any[]>([]);
const loading = ref(true);

const tournamentId = Number(route.params.id);

onMounted(async () => {
  loading.value = true;

  const { data: tData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
  tournament.value = tData;

  const { data: pData } = await supabase
      .from('tournament_participants')
      .select('profiles(minecraft_pseudo)')
      .eq('tournament_id', tournamentId);

  if (pData) {
    participants.value = pData.map((p: any) => {
      return p.profiles?.minecraft_pseudo || 'Joueur Inconnu';
    });
  }

  loading.value = false;
});
</script>

<template>
  <div class="public-container container">
    <div v-if="loading" class="loading">Chargement de l'arène...</div>

    <div v-else-if="tournament">
      <div class="header">
        <router-link to="/tournaments" class="back-link">← Retour aux tournois</router-link>

        <div class="title-block">
          <h1>{{ tournament.title }}</h1>
          <span class="status-badge" :class="tournament.status">{{ tournament.status }}</span>
        </div>

        <p class="desc">{{ tournament.description }}</p>

        <div class="meta-infos">
          <span>📅 {{ new Date(tournament.start_date).toLocaleString() }}</span>
          <span>⚔️ Format {{ tournament.match_format.toUpperCase() }}</span>
          <span>👥 {{ participants.length }} / {{ tournament.max_players }} Joueurs</span>
        </div>
      </div>

      <div v-if="tournament.status !== 'open'" class="bracket-box">
        <TournamentBracket
            :tournamentId="tournamentId"
            :isAdmin="false"
            :format="tournament.match_format"
        />
      </div>

      <div v-else class="waiting-box">
        <h3>L'arbre n'a pas encore été généré.</h3>
        <p>Les inscriptions sont toujours ouvertes !</p>
      </div>

    </div>
    <div v-else>Tournoi introuvable.</div>
  </div>
</template>

<style scoped>
.public-container { padding-top: 40px; padding-bottom: 80px; color: white; }
.header { margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
.back-link { color: #00a8ff; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 15px; }

.title-block { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
h1 { margin: 0; font-size: 2.5rem; text-transform: uppercase; }

.status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.status-badge.open { background: #2ecc71; color: black; }
.status-badge.started { background: #e67e22; color: white; }
.status-badge.completed { background: #34495e; color: white; }

.desc { color: #ccc; margin: 20px 0; font-size: 1.1rem; line-height: 1.6; }

.meta-infos { display: flex; gap: 20px; flex-wrap: wrap; color: #888; font-family: monospace; font-size: 1rem; }
.meta-infos span { background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 6px; }

.bracket-box { margin-top: 30px; }
.waiting-box { text-align: center; padding: 60px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px dashed #444; margin-top: 30px; }
</style>