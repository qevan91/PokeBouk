<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../utils/supabase.ts';
import type { WikiArticle } from '../../utils/types.ts';

const articles = ref<WikiArticle[]>([]);
const searchQuery = ref('');
const selectedCategory = ref('Toutes');
const loading = ref(true);
const errorMsg = ref<boolean>(false);

const categories = ['Toutes', 'Tuto', 'Légendaires', 'Combats', 'Objets', 'Arènes', 'PNJ'];

const fetchArticles = async () => {
  loading.value = true;
  errorMsg.value = false;

  const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
  );

  try {
    const { data, error } = await Promise.race([
      supabase
          .from('wiki_articles')
          .select('*')
          .order('created_at', { ascending: false }),
      timeoutPromise
    ]) as any;

    if (error) throw error;

    if (data) {
      articles.value = data as WikiArticle[];
    }

  } catch (err) {
    console.warn("Erreur chargement:", err);
    errorMsg.value = true;
  } finally {
    loading.value = false;
  }
};

const reloadPage = () => {
  window.location.reload();
};

onMounted(() => {
  fetchArticles();
});

const filteredArticles = computed(() => {
  return articles.value.filter(article => {
    const matchSearch = article.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchCat = selectedCategory.value === 'Toutes' || article.category === selectedCategory.value;
    return matchSearch && matchCat;
  });
});
</script>

<template>
  <section class="wiki-container container">
    <div class="wiki-header">
      <h1>PokeWiki</h1>
      <p class="wiki-header-text">A retrouver sur le Discord channel <a href="https://discord.gg/D3yYaPef">"Wiki"</a></p>

      <div class="search-bar">
        <input id="search-wiki" name="search" v-model="searchQuery" type="text" placeholder="Rechercher un guide (ex: Arène)...">
        <select id="cat-select" name="category" v-model="selectedCategory">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div v-if="errorMsg" class="warning-alert">
        <div class="warning-text">
          <strong>Erreur de connexion détectée</strong>
          <p>Le chargement des articles a échoué (connexion interrompue). Merci de rafraîchir la page.</p>
        </div>
        <button @click="reloadPage" class="btn-warning-refresh">Rafraîchir</button>
      </div>

    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else class="wiki-grid">
      <router-link
          v-for="article in filteredArticles"
          :key="article.id"
          :to="`/wiki/${article.id}`"
          class="wiki-card"
      >
        <div class="card-img" :style="article.image_urls && article.image_urls.length > 0 ? `background-image: url(${article.image_urls[0]})` : ''">
          <span v-if="!article.image_urls || article.image_urls.length === 0">📖</span>
        </div>

        <div class="card-content">
          <span class="tag" :class="article.category.toLowerCase()">{{ article.category }}</span>
          <h3>{{ article.title }}</h3>
          <p>{{ article.description.substring(0, 80) }}...</p>
        </div>
      </router-link>
    </div>
  </section>
</template>

<style src="../../assets/css/wiki.css"></style>