import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from './supabase.ts';

import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import AuthCallbackView from '../views/AuthCallbackView.vue';

import WikiListView from '../views/wiki/WikiListView.vue';
import WikiDetailView from '../views/wiki/WikiDetailView.vue';

import TournamentListView from '../views/tournaments/TournamentListView.vue';
import TournamentDetailView from '../views/tournaments/TournamentDetailView.vue';

import AdminLayout from '../views/admin/AdminLayout.vue';
import AdminWiki from '../views/admin/AdminWiki.vue';
import AdminTournamentCreate from '../views/admin/AdminTournamentCreate.vue';
import AdminTournamentDetail from '../views/admin/AdminTournamentDetail.vue';
import AdminTournamentList from '../views/admin/AdminTournamentList.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: HomeView },
        { path: '/login', component: LoginView },
        { path: '/auth/callback', component: AuthCallbackView },

        // Wiki
        { path: '/wiki', component: WikiListView },
        { path: '/wiki/:id', component: WikiDetailView, props: true },

        // Tournoi
        { path: '/tournaments', component: TournamentListView },
        { path: '/tournaments/:id', component: TournamentDetailView },

        // Admin
        {
            path: '/admin',
            component: AdminLayout,
            meta: { requiresAdmin: true },
            children: [
                { path: 'wiki', component: AdminWiki },
                { path: 'tournaments', component: AdminTournamentList },
                { path: 'tournaments/create', component: AdminTournamentCreate },
                { path: 'tournaments/:id', component: AdminTournamentDetail },
            ]
        }
    ]
});

// Gestion de navigation
router.beforeEach(async (to, _from, next) => {
    if (!to.meta.requiresAdmin) return next();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return next('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (profile && profile.is_admin) next();
    else {
        alert("Accès refusé.");
        next('/');
    }
});

export default router;