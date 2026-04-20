<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../../utils/supabase.ts';
import type { WikiArticle } from '../../utils/types.ts';
import { marked } from 'marked';

const route = useRoute();
const article = ref<WikiArticle | null>(null);
const loading = ref(true);
const errorMsg = ref<string | null>(null);

const fetchArticle = async () => {
  const articleId = route.params.id;
  loading.value = true;
  errorMsg.value = null;

  const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 7000)
  );

  try {
    const { data, error } = await Promise.race([
      supabase.from('wiki_articles').select('*').eq('id', articleId).single(),
      timeoutPromise
    ]) as any;

    if (error) throw error;
    if (data) article.value = data;

  } catch (err) {
    console.error("Erreur détail:", err);
    errorMsg.value = "Erreur de chargement.";
  } finally {
    loading.value = false;
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && !article.value && !loading.value) {
    fetchArticle();
  }
};

onMounted(() => {
  fetchArticle();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

const renderedDescription = computed(() => {
  if (!article.value?.description) return '';
  return marked(article.value.description);
});

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  return url;
};

const openImage = (url: string) => {
  window.open(url, '_blank');
};
</script>

<template>
  <div class="container article-page">

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else-if="errorMsg" style="text-align:center; padding:50px;">
      <p>⚠️ Oups, le chargement a échoué.</p>
      <button @click="fetchArticle" style="padding:10px 20px; background:#00a8ff; color:white; border:none; border-radius:5px; cursor:pointer; margin-top:10px;">Réessayer</button>
    </div>

    <div v-else-if="article" class="article-content">
      <br><br>
      <span class="category-badge" :class="article.category.toLowerCase()">{{ article.category }}</span>
      <h1>{{ article.title }}</h1>
      <p class="date">Publié le {{ new Date(article.created_at).toLocaleDateString() }}</p>

      <div class="text-body" v-html="renderedDescription"></div>

      <div v-if="article.video_url" class="video-wrapper">
        <iframe :src="getEmbedUrl(article.video_url)" title="Video player" frameborder="0" allowfullscreen></iframe>
      </div>

      <div v-if="article.image_urls && article.image_urls.length > 0" class="gallery-section">
        <h3>Galerie</h3>
        <div class="gallery-grid">
          <img v-for="(img, index) in article.image_urls" :key="index" :src="img" class="gallery-img" @click="openImage(img)" />
        </div>
      </div>
      <router-link to="/wiki" class="back-link">← Retour au Wiki</router-link>
    </div>

    <div v-else>Article introuvable.</div>
  </div>
</template>

<style src="../../assets/css/wikiDetail.css"></style>