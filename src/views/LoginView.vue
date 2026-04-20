<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../utils/supabase.ts';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('');
const password = ref('');
const pseudo = ref('');
const isRegistering = ref(false);
const isFinishingOAuth = ref(false);
const loading = ref(false);

const errorMessage = ref('');
const successMessage = ref('');

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

onMounted(async () => {
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('minecraft_pseudo')
        .eq('id', data.session.user.id)
        .single();

    if (!profile || !profile.minecraft_pseudo) {
      isFinishingOAuth.value = true;
    } else {
      router.push('/');
    }
  }
});

const saveMinecraftPseudo = async () => {
  if (!pseudo.value) {
    errorMessage.value = "Le pseudo Minecraft est obligatoire !";
    return;
  }

  loading.value = true;
  clearMessages();

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
        .from('profiles')
        .update({ minecraft_pseudo: pseudo.value })
        .eq('id', user.id);

    if (error) {
      errorMessage.value = "Erreur lors de la sauvegarde du pseudo : " + error.message;
      loading.value = false;
    } else {
      router.push('/');
    }
  }
};

const handleLogin = async () => {
  loading.value = true;
  clearMessages();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  if (error) {
    console.error("Erreur détaillée :", error.status, error.message);
    errorMessage.value = error.message;
    loading.value = false;
  } else {
    checkProfileAndRedirect();
  }
};

const checkProfileAndRedirect = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return;

  const { data: profile } = await supabase
      .from('profiles')
      .select('minecraft_pseudo')
      .eq('id', user.id)
      .single();

  if (!profile || !profile.minecraft_pseudo) {
    isFinishingOAuth.value = true;
    loading.value = false;
  } else {
    router.push('/');
  }
}

const handleRegister = async () => {
  if (!pseudo.value) {
    errorMessage.value = "Le pseudo Minecraft est obligatoire !";
    return;
  }

  loading.value = true;
  clearMessages();

  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: { minecraft_pseudo: pseudo.value }
    }
  });

  if (error) {
    errorMessage.value = error.message;
    loading.value = false;
  } else {
    successMessage.value = "Inscription réussie ! Vérifie tes emails pour confirmer.";
    isRegistering.value = false;
    loading.value = false;
    email.value = '';
    password.value = '';
    pseudo.value = '';
  }
};

const handleTwitch = async () => {
  loading.value = true;
  clearMessages();

  const redirectUrl = `${window.location.origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'twitch',
    options: {
      scopes: 'user:read:subscriptions',
      redirectTo: redirectUrl
    }
  });

  if (error) {
    errorMessage.value = error.message;
    loading.value = false;
  }
};
</script>

<template>
  <section class="login-container">
    <div class="form-box">

      <h2 class="title">
        <span v-if="isFinishingOAuth">Dernière étape !</span>
        <span v-else-if="isRegistering">Rejoins l'aventure</span>
        <span v-else>Ravi de te revoir</span>
      </h2>

      <p class="subtitle">
        <span v-if="isFinishingOAuth">Entre ton pseudo Minecraft pour terminer.</span>
        <span v-else-if="isRegistering">Crée ton compte.</span>
        <span v-else>Connecte-toi.</span>
      </p>

      <TransitionGroup name="fade">
        <div v-if="errorMessage" key="err" class="msg-box error">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" key="succ" class="msg-box success">
          {{ successMessage }}
        </div>
      </TransitionGroup>

      <div v-if="isFinishingOAuth" class="form-container">
        <input
            v-model="pseudo"
            type="text"
            class="input"
            placeholder="Ton Pseudo Minecraft Exact"
            required
        >
        <button @click="saveMinecraftPseudo" class="btn-submit" :disabled="loading">
          <span v-if="!loading">VALIDER MON COMPTE</span>
          <span v-else>Enregistrement...</span>
        </button>
      </div>

      <div v-else>
        <button @click="handleTwitch" type="button" class="btn-submit btn-twitch" :disabled="loading">
          <span v-if="!loading">SE CONNECTER AVEC TWITCH</span>
          <span v-else>Chargement...</span>
        </button>

        <div class="divider"><span>OU</span></div>

        <form @submit.prevent="isRegistering ? handleRegister() : handleLogin()" class="form-container">
          <input
              v-if="isRegistering"
              v-model="pseudo"
              type="text"
              class="input"
              placeholder="Pseudo Minecraft"
              required
          >

          <input v-model="email" type="email" class="input" placeholder="Email" required>
          <input v-model="password" type="password" class="input" placeholder="Mot de passe" required>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="!loading">{{ isRegistering ? 'INSCRIPTION CLASSIQUE' : 'CONNEXION' }}</span>
            <span v-else>Traitement...</span>
          </button>
        </form>

        <div class="form-section">
          <p v-if="!isRegistering">
            Pas de compte ?
            <a href="#" @click.prevent="isRegistering = true; clearMessages()">Inscription</a>
          </p>
          <p v-else>
            Déjà un compte ?
            <a href="#" @click.prevent="isRegistering = false; clearMessages()">Connexion</a>
          </p>
        </div>
      </div>

    </div>
  </section>
</template>

<style src="../assets/css/base.css"></style>
<style src="../assets/css/login.css"></style>