import { ref } from 'vue';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

const notifications = ref<Notification[]>([]);
let nextId = 1;

export function useNotifications() {
    const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = nextId++;
        notifications.value.push({ id, message, type });

        setTimeout(() => {
            remove(id);
        }, 4000);
    };

    const remove = (id: number) => {
        notifications.value = notifications.value.filter(n => n.id !== id);
    };

    return { notifications, notify, remove };
}