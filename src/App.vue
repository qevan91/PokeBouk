<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { supabase } from './utils/supabase.ts';
import NavBar from './views/NavBar.vue';

const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    await supabase.auth.getSession();
  }
};

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div class="app-wrapper">
    <NavBar />

    <main class="main-content">
      <router-view :key="$route.fullPath" />
    </main>

    <footer class="poke-footer">
      <div class="container">
        <div class="footer-links">
          <a href="https://pokebouk.fr/">Site Web</a>
          <a href="https://pokebouk.fr/wiki">Wiki</a>
          <a href="https://discord.gg/wanXAkDQ" target="_blank">Discord</a>
          <a href="https://streamlabs.com/hemmmbouk/tip" target="_blank">Cagnotte</a>
        </div>
        <p>&copy; {{ new Date().getFullYear() }} PokéBouk. Tous droits réservés.</p>
        <p class="disclaimer">Nous ne sommes pas affiliés à Mojang AB ni à Cobblemon.</p>
      </div>
    </footer>
  </div>
</template>

<style src="./assets/css/app.css"></style>