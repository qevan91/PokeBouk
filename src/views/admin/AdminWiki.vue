<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../utils/supabase.ts';
import type { WikiArticle } from '../../utils/types.ts';

const articles = ref<WikiArticle[]>([]);
const showModal = ref(false);
const editingId = ref<number | string | null>(null);
const uploading = ref(false);

const categories = ['Tuto', 'Légendaires', 'Combats', 'Objets', 'Arènes', 'PNJ'];
const statusMsg = ref({ text: '', type: '' });

const notify = (text: string, type: 'success' | 'error' = 'success') => {
  statusMsg.value = { text, type };
  setTimeout(() => { statusMsg.value = { text: '', type: '' }; }, 4000);
};

const form = ref({
  title: '',
  category: '',
  description: '',
  video_url: '',
  image_urls: [] as string[]
});

onMounted(() => loadWiki());

const loadWiki = async () => {
  const { data } = await supabase.from('wiki_articles').select('*').order('id', { ascending: false });
  if (data) articles.value = data;
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  if (!file) return;

  const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  uploading.value = true;

  try {
    const { error: uploadError } = await supabase.storage
        .from('wiki-images')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('wiki-images')
        .getPublicUrl(fileName);

    form.value.image_urls.push(data.publicUrl);
    notify("Image ajoutée avec succès !");

  } catch (error: any) {
    console.error('Erreur upload:', error);
    notify("Erreur lors de l'envoi : " + error.message, 'error');
  } finally {
    uploading.value = false;
    input.value = '';
  }
};

const removeImage = (index: number) => { form.value.image_urls.splice(index, 1); };

const openModal = (article?: WikiArticle) => {
  statusMsg.value = { text: '', type: '' };
  if (article) {
    editingId.value = article.id;
    form.value = {
      title: article.title,
      category: article.category,
      description: article.description,
      video_url: article.video_url || '',
      image_urls: article.image_urls ? [...article.image_urls] : []
    };
  } else {
    editingId.value = null;
    form.value = { title: '', category: '', description: '', video_url: '', image_urls: [] };
  }
  showModal.value = true;
};

const saveArticle = async () => {
  if (!form.value.category) { notify("Veuillez sélectionner une catégorie", "error"); return; }
  const dataToSend = { ...form.value };
  try {
    if (editingId.value) {
      const { error } = await supabase.from('wiki_articles').update(dataToSend).eq('id', editingId.value);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('wiki_articles').insert([dataToSend]);
      if (error) throw error;
    }
    showModal.value = false;
    loadWiki();
  } catch (error: any) { notify("Erreur de sauvegarde : " + error.message, 'error'); }
};

const deleteArticle = async (id: number | string) => {
  if (confirm("Supprimer cet article ?")) {
    const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
    if (!error) loadWiki();
  }
};
</script>

<template>
  <div>
    <div class="header">
      <h1>Gestion Wiki</h1>
      <button @click="openModal()" class="btn-add">+ Nouvel Article</button>
    </div>

    <div class="table-wrapper">
      <table class="admin-table">
        <thead><tr><th>Titre</th><th>Catégorie</th><th>Actions</th></tr></thead>
        <tbody>
        <tr v-for="art in articles" :key="art.id">
          <td>{{ art.title }}</td>
          <td><span class="badge">{{ art.category }}</span></td>
          <td>
            <button @click="openModal(art)" class="btn-edit">Edit</button>
            <button @click="deleteArticle(art.id)" class="btn-delete">Suppr</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ editingId ? 'Modifier' : 'Créer' }} un Article</h2>
        <form @submit.prevent="saveArticle" class="form-content">
          <input v-model="form.title" placeholder="Titre" class="input" required>
          <select v-model="form.category" class="input" required>
            <option value="" disabled>-- Choisir une catégorie --</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <input v-model="form.video_url" placeholder="Lien Youtube (Optionnel)" class="input">
          <p style="font-size:0.8rem; color:#aaa; margin-bottom:-5px;">Formatage Markdown supporté (**gras**, - liste)</p>
          <textarea v-model="form.description" placeholder="Contenu de l'article..." class="input" style="height:150px;" required></textarea>

          <div class="images-manager">
            <p style="margin-bottom:10px; font-weight:bold;">Galerie d'images :</p>
            <div class="gallery-preview">
              <div v-for="(img, idx) in form.image_urls" :key="idx" class="img-card">
                <img :src="img" alt="preview">
                <button type="button" @click="removeImage(idx)" class="btn-img-del">×</button>
              </div>
            </div>
            <div class="upload-zone">
              <label v-if="!uploading" class="btn-upload">
                📁 Ajouter une image depuis mon PC
                <input type="file" @change="handleFileUpload" accept="image/*" style="display: none;">
              </label>
              <span v-else class="loading-text">Envoi en cours... ⏳</span>
            </div>
          </div>

          <Transition name="fade">
            <div v-if="statusMsg.text" :class="['status-badge', statusMsg.type]">{{ statusMsg.text }}</div>
          </Transition>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-cancel">Annuler</button>
            <button type="submit" class="btn-save" :disabled="uploading">{{ uploading ? 'Patientez...' : 'Sauvegarder' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style src="../../assets/css/admin.css"></style>