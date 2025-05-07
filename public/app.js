// public/app.js
const { createApp, ref, reactive, onMounted, computed, watch } = Vue;

const App = {
    setup() {
        // --- Reactive State ---
        const isLoggedIn = ref(localStorage.getItem('isLoggedIn') === 'true');
        const contacts = ref([]);
        const showAddForm = ref(false);
        const loginForm = reactive({ password: localStorage.getItem('password') || '' });
        const contactForm = reactive({ id: null, name: '', birthday: '', birthYear: '', mobile: '', greetingMessage: '' });
        const uiState = reactive({ loginMessage: '', formMessage: '' });

        // --- Auth ---
        const handleLogin = async () => {
            uiState.loginMessage = '';
            try {
                const res = await fetch('/.netlify/functions/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: loginForm.password })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    isLoggedIn.value = true;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('password', loginForm.password);
                    await fetchContacts();
                } else {
                    uiState.loginMessage = data.error || 'Login fallito';
                }
            } catch (e) {
                uiState.loginMessage = 'Errore di rete';
            }
        };
        const handleLogout = () => {
            isLoggedIn.value = false;
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('password');
        };

        // --- CRUD ---
        const fetchContacts = async () => {
            if (!isLoggedIn.value) return;
            try {
                const password = localStorage.getItem('password') || loginForm.password;
                const res = await fetch('/.netlify/functions/contacts', {
                    headers: { 'Authorization': `Bearer ${password}` }
                });
                contacts.value = await res.json();
            } catch (e) {
                contacts.value = [];
            }
        };
        const saveContact = async () => {
            if (!isLoggedIn.value) return;
            if (!/^\d{1,2}\/\d{1,2}$/.test(contactForm.birthday)) {
                uiState.formMessage = "Formato compleanno non valido. Usare GG/MM (es. 25/12).";
                return;
            }
            try {
                const method = contactForm.id ? 'PUT' : 'POST';
                const password = localStorage.getItem('password');
                const res = await fetch('/.netlify/functions/contacts', {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${password}`
                    },
                    body: JSON.stringify(contactForm)
                });
                if (!res.ok) {
                    uiState.formMessage = 'Errore nel salvataggio.';
                    return;
                }
                await fetchContacts();
                closeForm();
            } catch (e) {
                uiState.formMessage = 'Errore di rete';
            }
        };
        const editContact = (contact) => {
            Object.assign(contactForm, contact);
            showAddForm.value = true;
        };
        const deleteContact = async (id) => {
            if (!isLoggedIn.value) return;
            if (!confirm('Eliminare questo contatto?')) return;
            try {
                const res = await fetch('/.netlify/functions/contacts', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${loginForm.password}`
                    },
                    body: JSON.stringify({ id })
                });
                if (res.ok) await fetchContacts();
            } catch (e) {}
        };
        const closeForm = () => {
            showAddForm.value = false;
            Object.assign(contactForm, { id: null, name: '', birthday: '', birthYear: '', mobile: '', greetingMessage: '' });
            uiState.formMessage = '';
        };

        onMounted(() => {
            if (isLoggedIn.value) fetchContacts();
        });

        return {
            isLoggedIn,
            contacts,
            loginForm,
            contactForm,
            uiState,
            showAddForm,
            handleLogin,
            handleLogout,
            fetchContacts,
            saveContact,
            editContact,
            deleteContact,
            closeForm
        };
    }
};

createApp(App).mount('#app');
