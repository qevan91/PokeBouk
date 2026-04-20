<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../../utils/supabase.ts';
import { useNotifications } from '../../utils/useNotifications.ts';
const { notify } = useNotifications();

const props = defineProps<{
  tournamentId: number;
  isAdmin: boolean;
  format: 'bo1' | 'bo3' | 'bo5';
}>();

const matches = ref<any[]>([]);
const loading = ref(true);

const showScoreModal = ref(false);
const selectedMatch = ref<any>(null);
const formScore = ref({ p1: 0, p2: 0 });

onMounted(() => {
  fetchMatches();
});

const fetchMatches = async () => {
  const { data } = await supabase
      .from('matches')
      .select(`
      *,
      player1:player1_id(minecraft_pseudo),
      player2:player2_id(minecraft_pseudo)
    `)
      .eq('tournament_id', props.tournamentId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true });

  if (data) matches.value = data;
  loading.value = false;
};

const rounds = computed(() => {
  const grouped: Record<number, any[]> = {};
  matches.value.forEach(m => {
    if (!grouped[m.round_number]) grouped[m.round_number] = [];
    grouped[m.round_number]!.push(m);
  });
  return grouped;
});

const openScoreModal = (match: any) => {
  if (!props.isAdmin) return;

  if (!match.player1_id || !match.player2_id) return notify("En attente des joueurs...");

  selectedMatch.value = match;
  formScore.value = { p1: match.score_p1 || 0, p2: match.score_p2 || 0 };
  showScoreModal.value = true;
};

const saveScore = async () => {
  if (!selectedMatch.value) return;

  const m = selectedMatch.value;
  const p1Score = parseInt(formScore.value.p1 as any);
  const p2Score = parseInt(formScore.value.p2 as any);

  const targetWin = props.format === 'bo1' ? 1 : props.format === 'bo3' ? 2 : 3;

  let winnerId = null;

  if (p1Score >= targetWin) {
    winnerId = m.player1_id;
  } else if (p2Score >= targetWin) {
    winnerId = m.player2_id;
  }

  const { error } = await supabase
      .from('matches')
      .update({
        score_p1: p1Score,
        score_p2: p2Score,
        winner_id: winnerId
      })
      .eq('id', m.id);

  if (error) return notify("Erreur save: " + error.message, 'error');

  if (winnerId) {
    await advanceWinner(m.round_number, m.match_number, winnerId);
  }

  showScoreModal.value = false;
  await fetchMatches();
};

const advanceWinner = async (currentRound: number, currentMatchNum: number, winnerId: string) => {
  const nextRound = currentRound + 1;
  const nextMatchNum = Math.ceil(currentMatchNum / 2);
  const isPlayer1Slot = currentMatchNum % 2 !== 0;

  const { data: nextMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', props.tournamentId)
      .eq('round_number', nextRound)
      .eq('match_number', nextMatchNum)
      .single();

  if (nextMatch) {
    const updateData = isPlayer1Slot ? { player1_id: winnerId } : { player2_id: winnerId };
    await supabase.from('matches').update(updateData).eq('id', nextMatch.id);
  } else {
    // FINALE TERMINEE
    await supabase.from('tournaments')
        .update({ status: 'completed', winner_id: winnerId })
        .eq('id', props.tournamentId);
    notify("🏆 NOUS AVONS UN GAGNANT !", 'success');
  }
};
</script>

<template>
  <div class="bracket-container">
    <div v-if="loading">Chargement de l'arbre...</div>

    <div v-else class="bracket-scroller">
      <div class="bracket-flex">

        <div v-for="(matchesInRound, roundNum) in rounds" :key="roundNum" class="round-column">
          <h4 class="round-title">
            {{ matchesInRound.length === 1 ? 'Grande Finale' : 'Round ' + roundNum }}
          </h4>

          <div class="match-list">
            <div
                v-for="m in matchesInRound"
                :key="m.id"
                class="match-card"
                :class="{ 'clickable': isAdmin }"
                @click="openScoreModal(m)"
            >
              <div class="player-row" :class="{ 'winner': m.winner_id && m.winner_id === m.player1_id }">
                <span class="p-name">{{ m.player1?.minecraft_pseudo || 'En attente...' }}</span>
                <span class="p-score">{{ m.score_p1 }}</span>
              </div>

              <div class="player-row" :class="{ 'winner': m.winner_id && m.winner_id === m.player2_id }">
                <span class="p-name">{{ m.player2?.minecraft_pseudo || 'En attente...' }}</span>
                <span class="p-score">{{ m.score_p2 }}</span>
              </div>

              <div class="match-info">M{{ m.match_number }}</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-if="showScoreModal" class="modal-overlay">
      <div class="modal-box">
        <h3>Mise à jour du Score</h3>
        <p class="vs-text">
          {{ selectedMatch?.player1?.minecraft_pseudo }} <span style="color:#666">VS</span> {{ selectedMatch?.player2?.minecraft_pseudo }}
        </p>

        <div class="score-inputs">
          <div class="input-group">
            <label>{{ selectedMatch?.player1?.minecraft_pseudo }}</label>
            <input v-model="formScore.p1" type="number" min="0">
          </div>
          <div class="input-group">
            <label>{{ selectedMatch?.player2?.minecraft_pseudo }}</label>
            <input v-model="formScore.p2" type="number" min="0">
          </div>
        </div>

        <div class="actions">
          <button @click="showScoreModal = false" class="btn-cancel">Annuler</button>
          <button @click="saveScore" class="btn-save">Valider le Match</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bracket-container {
  width: 100%;
  overflow-x: auto;
  padding: 20px 0;
}

.bracket-flex {
  display: flex;
  gap: 40px;
  min-width: max-content;
}

.round-column {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 200px;
}

.round-title {
  text-align: center;
  margin-bottom: 20px;
  color: #888;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.match-card {
  background: #2b2b2b;
  border-radius: 4px;
  overflow: hidden;
  border-left: 3px solid #444;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}

.match-card.clickable:hover {
  transform: scale(1.03);
  cursor: pointer;
  border-left-color: #00a8ff;
}

.player-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid #333;
  font-size: 0.9rem;
}
.player-row:last-child { border-bottom: none; }

.p-name { color: #ccc; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.p-score { background: #1a1a1a; padding: 0 8px; border-radius: 3px; color: #fff; font-family: monospace; }

.player-row.winner { background: rgba(46, 204, 113, 0.1); }
.player-row.winner .p-name { color: #2ecc71; font-weight: bold; }
.player-row.winner .p-score { background: #2ecc71; color: #000; font-weight: bold; }

.match-info {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.6rem;
  color: #555;
}

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(5px); }
.modal-box { background: #222; padding: 30px; border-radius: 12px; width: 300px; text-align: center; border: 1px solid #444; }
.vs-text { font-size: 1.2rem; font-weight: bold; margin: 15px 0; }
.score-inputs { display: flex; gap: 20px; justify-content: center; margin-bottom: 20px; }
.input-group { display: flex; flex-direction: column; gap: 5px; width: 80px; }
.input-group input { padding: 10px; text-align: center; background: #111; border: 1px solid #444; color: white; border-radius: 6px; font-size: 1.5rem; font-weight: bold; outline: none; }
.input-group input:focus { border-color: #00a8ff; }
.actions { display: flex; gap: 10px; justify-content: center; }
.btn-save { background: #2ecc71; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-cancel { background: transparent; border: 1px solid #555; color: #aaa; padding: 10px; border-radius: 6px; cursor: pointer; }
</style>