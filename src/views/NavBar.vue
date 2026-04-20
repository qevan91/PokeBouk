<script setup lang="ts">
import 'bootstrap/dist/css/bootstrap.min.css';
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../utils/supabase.ts';
import { useRouter } from 'vue-router';

const user = ref<any>(null);
const isAdmin = ref(false);
const router = useRouter();
const isMenuOpen = ref(false);

const playerCount = ref(0);
const isServerOnline = ref(false);
const serverIp = "mc.homeclap.ovh";
const copyMessage = ref("Copier l'IP");

let authSubscription: any = null;
let statusInterval: any = null;

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  user.value = data.session?.user || null;

  if (user.value) await checkAdminStatus(user.value.id);

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user || null;
    if (user.value) await checkAdminStatus(user.value.id);
    else isAdmin.value = false;
  });
  authSubscription = subscription;

  fetchServerStatus();
  statusInterval = setInterval(fetchServerStatus, 60000);
});

onUnmounted(() => {
  if (authSubscription) authSubscription.unsubscribe();
  if (statusInterval) clearInterval(statusInterval);
});

const checkAdminStatus = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
  isAdmin.value = data?.is_admin || false;
};

const logout = async () => {
  await supabase.auth.signOut();
  isAdmin.value = false;
  router.push('/login');
};

const fetchServerStatus = async () => {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${serverIp}`);
    const data = await res.json();
    if (data.online) {
      isServerOnline.value = true;
      playerCount.value = data.players.online;
    } else {
      isServerOnline.value = false;
    }
  } catch (e) { isServerOnline.value = false; }
};

const copyIpToClipboard = () => {
  navigator.clipboard.writeText(serverIp);
  const oldMsg = copyMessage.value;
  copyMessage.value = "IP Copiée !";
  setTimeout(() => { copyMessage.value = oldMsg; }, 2000);
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};
</script>

<template>
  <header class="poke-header">
    <nav class="container poke-nav">
      <router-link to="/" class="logo">
        <img class="scale" src="../assets/img/pokebouk_overlay1.png">
      </router-link>

      <button class="hamburger" @click="toggleMenu" :class="{ 'open': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul class="nav-links">
        <li class="server-status" @click="copyIpToClipboard" :title="copyMessage">
          <span class="status-dot" :class="{ 'online': isServerOnline, 'offline': !isServerOnline }"></span>
          <span v-if="isServerOnline" class="player-count">{{ playerCount }} Joueurs</span>
          <span v-else class="player-count">Hors Ligne</span>
        </li>

        <li><a href="https://shop.pokebouk.fr/" class="shop-link">BOUTIQUE</a></li>
        <li><router-link to="/wiki">Wiki</router-link></li>
        <li><a href="https://discord.gg/fdyAjPe6" target="_blank">Discord</a></li>
        <li><a href="https://streamlabs.com/hemmmbouk/tip" target="_blank">Cagnotte</a></li>

        <li class="nav-dropdown">
          <a href="#" class="dropdown-title" style="color: var(--poke-yellow);">Réseaux ▼</a>
          <ul class="dropdown-content">
            <li><a href="https://www.twitch.tv/hemmmbouk" target="_blank" class="tw">Twitch</a></li>
            <li><a href="https://kick.com/HEMMMBOUK" target="_blank" class="ki">Kick</a></li>
            <li><a href="https://www.tiktok.com/@hemmmbouk" target="_blank" class="tk">TikTok</a></li>
            <li><a href="https://www.instagram.com/hemmmbouk/" target="_blank" class="ig">Instagram</a></li>
            <li><a href="https://www.youtube.com/@HEMMMBOUK" target="_blank" class="yt">YouTube</a></li>
          </ul>
        </li>

        <li v-if="isAdmin">
          <router-link to="/admin/wiki" class="admin-link">Panel Admin</router-link>
        </li>

        <li v-if="!user" class="poke-btn">
          <router-link to="/login">Connexion</router-link>
        </li>

        <li v-if="user" class="poke-btn danger">
          <a href="#" @click.prevent="logout">Déconnexion</a>
        </li>
      </ul>

      <div class="mobile-menu" :class="{ 'open': isMenuOpen }">
        <ul>
          <li class="server-status-mobile" @click="copyIpToClipboard" :title="copyMessage">
            <span class="status-dot" :class="{ 'online': isServerOnline, 'offline': !isServerOnline }"></span>
            <span v-if="isServerOnline" class="player-count">{{ playerCount }} Joueurs</span>
            <span v-else class="player-count">Hors Ligne</span>
          </li>
          <li><router-link to="/wiki" @click="toggleMenu">Wiki</router-link></li>
          <li><a href="https://discord.gg/wanXAkDQ" target="_blank" @click="toggleMenu">Discord</a></li>
          <li><a href="https://streamlabs.com/hemmmbouk/tip" target="_blank" @click="toggleMenu">Cagnotte</a></li>

          <li style="padding-left: 10px; color: var(--poke-yellow); font-weight: bold; font-size: 0.8rem; text-transform: uppercase;">📱 Mes Réseaux</li>
          <li style="padding-left: 20px;"><a href="https://www.twitch.tv/hemmmbouk" target="_blank" @click="toggleMenu">Twitch</a></li>
          <li style="padding-left: 20px;"><a href="https://kick.com/HEMMMBOUK" target="_blank" @click="toggleMenu">Kick</a></li>
          <li style="padding-left: 20px;"><a href="https://www.tiktok.com/@hemmmbouk" target="_blank" @click="toggleMenu">TikTok</a></li>
          <li style="padding-left: 20px;"><a href="https://www.instagram.com/hemmmbouk/" target="_blank" @click="toggleMenu">Instagram</a></li>
          <li style="padding-left: 20px;"><a href="https://www.youtube.com/@HEMMMBOUK" target="_blank" @click="toggleMenu">YouTube</a></li>

          <li><a href="https://shop.pokebouk.fr/" class="shop-link" @click="toggleMenu">BOUTIQUE</a></li>
          <li v-if="isAdmin"><router-link to="/admin/wiki" class="admin-link" @click="toggleMenu">Panel Admin</router-link></li>
          <li v-if="!user" class="poke-btn"><router-link to="/login" @click="toggleMenu">Connexion</router-link></li>
          <li v-if="user" class="poke-btn danger"><a href="#" @click.prevent="logout" @click="toggleMenu">Déconnexion</a></li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<style src="../assets/css/navbar.css"></style>