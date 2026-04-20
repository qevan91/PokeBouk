<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../../utils/supabase.ts';
import { generateBracket } from '../../utils/bracket';
import TournamentBracket from '../tournaments/TournamentBracket.vue';
import { useNotifications } from '../../utils/useNotifications.ts';

const { notify } = useNotifications();
const route = useRoute();
const router = useRouter();
const tournament = ref<any>(null);
const participants = ref<any[]>([]);
const loading = ref(true);
const actionLoading = ref(false);

const tournamentId = Number(route.params.id);

const showEditModal = ref(false);
const editForm = ref({
  title: '',
  description: '',
  max_players: 16,
  match_format: 'bo1',
  start_date: ''
});

onMounted(async () => {
  await fetchDetails();
});

const fetchDetails = async () => {
  loading.value = true;

  const { data: tData, error: tError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

  if (tError) {
    notify("Erreur chargement tournoi: " + tError.message, 'error');
    loading.value = false;
    return;
  }
  tournament.value = tData;

  editForm.value = {
    title: tData.title,
    description: tData.description || '',
    max_players: tData.max_players,
    match_format: tData.match_format,
    start_date: new Date(tData.start_date).toISOString().slice(0, 16) // Format local pour l'input
  };

  const { data: pData, error: pError } = await supabase
      .from('tournament_participants')
      .select('user_id, profiles(id, minecraft_pseudo)')
      .eq('tournament_id', tournamentId);

  if (pData) {
    participants.value = pData.map((p: any) => {
      const profil = p.profiles;
      return {
        id: profil?.id,
        pseudo: profil?.minecraft_pseudo || 'Pseudo Introuvable',
      };
    });
  }

  if (pError) {
    notify("Erreur de modification: " + pError.message, 'error');
  }

  loading.value = false;
};

const handleStart = async () => {
  if (participants.value.length < 2) {
    return notify("Il faut au moins 2 joueurs !", 'error');
  }

  if (!confirm("Générer l'arbre maintenant ?")) return;

  actionLoading.value = true;
  try {
    await generateBracket(tournamentId, participants.value);
    notify("Tournoi lancé avec succès !", 'success');
    await fetchDetails();
  } catch (e: any) {
    notify("Erreur génération: " + e.message, 'error');
  } finally {
    actionLoading.value = false;
  }
};

const saveEdit = async () => {
  actionLoading.value = true;
  const { error } = await supabase
      .from('tournaments')
      .update({
        title: editForm.value.title,
        description: editForm.value.description,
        max_players: editForm.value.max_players,
        match_format: editForm.value.match_format,
        start_date: new Date(editForm.value.start_date).toISOString()
      })
      .eq('id', tournamentId);

  actionLoading.value = false;

  if (error) {
    notify("Erreur de modification: " + error.message, 'error');
  } else {
    notify("Tournoi mis à jour avec succès !", 'success');
    showEditModal.value = false;
    await fetchDetails();
  }
};

const handleDelete = async () => {
  if(confirm("Supprimer ce tournoi ?")) {
    const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
    if (error) {
      notify("Erreur suppression: " + error.message, 'error');
    } else {
      notify("Tournoi supprimé.", 'info');
      router.push('/admin/tournaments');
    }
  }
}
</script>

<template>
  <div class="admin-container">
    <div v-if="loading" class="loading-state">Chargement des données...</div>

    <div v-else-if="tournament" class="details-layout">
      <div class="header-box">
        <div class="titles">
          <div class="top-badges">
            <span class="badge" :class="tournament.status">{{ tournament.status }}</span>
            <span class="badge format">{{ tournament.match_format }}</span>
            <span class="badge" style="background:#333; color:#fff">{{ tournament.max_players }} Joueurs Max</span>
          </div>
          <h1>{{ tournament.title }}</h1>
        </div>

        <div class="actions">
          <button
              v-if="tournament.status === 'open'"
              @click="showEditModal = true"
              class="btn-edit"
          >
            ✏️ Éditer
          </button>

          <button
              v-if="tournament.status === 'open'"
              @click="handleStart"
              class="btn-start"
              :disabled="actionLoading"
          >
            {{ actionLoading ? 'Génération...' : ' Démarrer le Tournoi' }}
          </button>

          <button @click="handleDelete" class="btn-delete">🗑️ Supprimer</button>
        </div>
      </div>

      <div v-if="tournament.status !== 'open'" class="bracket-section">
        <h2 class="section-title">Arbre du Tournoi</h2>
        <TournamentBracket
            :tournamentId="tournamentId"
            :isAdmin="true"
            :format="tournament.match_format"
        />
      </div>

      <div v-else class="pending-start">
        <h3>Le tournoi n'a pas encore commencé.</h3>
        <p>Attendez d'avoir tous les joueurs puis cliquez sur "Démarrer".</p>
      </div>

      <div class="participants-section">
        <h3 class="section-title">Joueurs Inscrits ({{ participants.length }} / {{ tournament.max_players }})</h3>
        <div class="players-grid">
          <div v-for="p in participants" :key="p.id" class="player-card">
            <div class="avatar-placeholder">{{ p.pseudo?.charAt(0).toUpperCase() }}</div>
            <span>{{ p.pseudo }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-box">
        <h3>Modifier le Tournoi</h3>
        <form @submit.prevent="saveEdit" class="edit-form">
          <div class="input-group">
            <label>Titre</label>
            <input v-model="editForm.title" type="text" required>
          </div>

          <div class="input-group">
            <label>Date de début</label>
            <input v-model="editForm.start_date" type="datetime-local" required>
          </div>

          <div class="options-grid">
            <div class="input-group">
              <label>Format</label>
              <select v-model="editForm.match_format">
                <option value="bo1">BO1</option>
                <option value="bo3">BO3</option>
                <option value="bo5">BO5</option>
              </select>
            </div>

            <div class="input-group">
              <label>Max Joueurs</label>
              <select v-model="editForm.max_players">
                <option :value="4">4 Joueurs</option>
                <option :value="8">8 Joueurs</option>
                <option :value="16">16 Joueurs</option>
                <option :value="32">32 Joueurs</option>
                <option :value="64">64 Joueurs</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label>Description</label>
            <textarea v-model="editForm.description" rows="3"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="btn-cancel">Annuler</button>
            <button type="submit" class="btn-save" :disabled="actionLoading">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
.admin-container { padding-top: 20px; color: white; max-width: 1200px; margin: 0 auto; }
.header-box { background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;}
.badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 0.8rem; margin-right: 10px; }
.badge.open { background: #2ecc71; color: #000; }
.badge.started { background: #e67e22; color: white; }
.badge.completed { background: #34495e; color: white; }
.badge.format { background: #6c5ce7; color: white; }

.actions { display: flex; gap: 10px; align-items: center; }
.btn-edit { background: #3498db; color: white; border: none; padding: 12px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; }
.btn-start { background: linear-gradient(135deg, #f1c40f, #f39c12); color: black; border: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; cursor: pointer; }
.btn-delete { background: transparent; border: 1px solid #e74c3c; color: #e74c3c; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

.pending-start { text-align: center; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px dashed #444; margin-bottom: 30px; }

.bracket-section { background: #151515; padding: 20px; border-radius: 12px; border: 1px solid #333; margin-bottom: 30px; }
.players-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
.player-card { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 15px; border: 1px solid rgba(255,255,255,0.1); }
.avatar-placeholder { width: 30px; height: 30px; background: #6c5ce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-box { background: #1a1a1a; padding: 30px; border-radius: 12px; width: 100%; max-width: 500px; border: 1px solid #333; }
.modal-box h3 { margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px;}
.edit-form { display: flex; flex-direction: column; gap: 15px; }
.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label { font-size: 0.85rem; color: #aaa; text-transform: uppercase; font-weight: bold;}
.input-group input, .input-group select, .input-group textarea { background: #111; border: 1px solid #444; color: white; padding: 12px; border-radius: 6px; outline: none; }
.input-group input:focus, .input-group select:focus, .input-group textarea:focus { border-color: #3498db; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.modal-actions { display: flex; gap: 10px; margin-top: 10px; }
.btn-save { flex: 1; background: #2ecc71; color: black; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-cancel { flex: 1; background: transparent; color: #aaa; border: 1px solid #444; padding: 12px; border-radius: 6px; cursor: pointer; }
</style>