<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../../utils/supabase.ts';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const message = ref('');

const form = ref({
  title: '',
  description: '',
  start_date: '',
  max_players: 16,
  match_format: 'bo1',
  bracket_type: 'single_elimination'
});

const createTournament = async () => {
  if (!form.value.title || !form.value.start_date) {
    message.value = "Titre et date obligatoires.";
    return;
  }

  loading.value = true;
  message.value = "";

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('tournaments').insert({
      title: form.value.title,
      description: form.value.description,
      start_date: new Date(form.value.start_date).toISOString(),
      max_players: form.value.max_players,
      match_format: form.value.match_format,
      bracket_type: form.value.bracket_type,
      status: 'open',
      created_by: user?.id
    });

    if (error) throw error;

    message.value = "Tournoi créé avec succès !";
    setTimeout(() => router.push('/admin'), 1500);

  } catch (error: any) {
    console.error(error);
    message.value = "Erreur : " + error.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="admin-container">
    <h1>Créer un Tournoi</h1>

    <form @submit.prevent="createTournament" class="tournament-form">
      <div class="form-group">
        <label>Titre du Tournoi</label>
        <input v-model="form.title" type="text" placeholder="Ex: Coupe Kanto #1" required />
      </div>

      <div class="form-group">
        <label>Description & Règles</label>
        <textarea v-model="form.description" rows="4" placeholder="Détails du tournoi..."></textarea>
      </div>

      <div class="form-group">
        <label>Date de début</label>
        <input v-model="form.start_date" type="datetime-local" required />
      </div>

      <div class="options-grid">
        <div class="form-group">
          <label>Format des Matchs</label>
          <select v-model="form.match_format">
            <option value="bo1">BO1 (Best of 1)</option>
            <option value="bo3">BO3 (Best of 3)</option>
            <option value="bo5">BO5 (Best of 5)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Type d'Arbre</label>
          <select v-model="form.bracket_type">
            <option value="single_elimination">Élimination Directe</option>
            <option value="double_elimination">Double Bracket (Winner/Loser)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Nb. Max de Joueurs</label>
          <select v-model="form.max_players">
            <option :value="4">4 Joueurs</option>
            <option :value="8">8 Joueurs</option>
            <option :value="16">16 Joueurs</option>
            <option :value="32">32 Joueurs</option>
            <option :value="64">64 Joueurs</option>
          </select>
        </div>
      </div>

      <div v-if="message" class="msg-box" :class="message.includes('Succès') ? 'success' : 'error'">
        {{ message }}
      </div>

      <button type="submit" class="btn-create" :disabled="loading">
        {{ loading ? 'Création...' : 'Lancer les Inscriptions' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.admin-container { max-width: 800px; margin: 0 auto; color: white; padding: 20px; }
.tournament-form { background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; display: flex; flex-direction: column; gap: 20px; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
label { font-weight: bold; color: #ccc; font-size: 0.9rem; text-transform: uppercase; }
input, select, textarea { background: #0f0f0f; border: 1px solid #444; color: white; padding: 12px; border-radius: 6px; font-size: 1rem; outline: none; }
input:focus, select:focus, textarea:focus { border-color: #00a8ff; }

.options-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }

.btn-create { background: linear-gradient(135deg, #00a8ff, #0061ff); color: white; border: none; padding: 15px; font-size: 1.1rem; font-weight: bold; border-radius: 8px; cursor: pointer; transition: transform 0.2s; margin-top: 10px; }
.btn-create:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 168, 255, 0.4); }
.btn-create:disabled { opacity: 0.7; cursor: not-allowed; }

.msg-box { padding: 10px; border-radius: 6px; text-align: center; }
.msg-box.success { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
.msg-box.error { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
</style>