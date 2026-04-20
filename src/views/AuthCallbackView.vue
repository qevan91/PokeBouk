<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../utils/supabase.ts';

const router = useRouter();

onMounted(async () => {
  const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

  if (error) {
    console.error("Erreur d'authentification Twitch :", error.message);
    router.push('/login');
    return;
  }

  if (data?.session) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('minecraft_pseudo')
        .eq('id', data.session.user.id)
        .single();

    if (!profile || !profile.minecraft_pseudo) {
      router.push('/login');
    } else {
      router.push('/');
    }
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <div style="text-align: center; padding-top: 100px; color: white; font-size: 1.2rem;">
    Connexion Twitch en cours, veuillez patienter...
  </div>
</template>