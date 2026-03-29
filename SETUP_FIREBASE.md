# Come attivare il sistema di Account (Firebase)

Segui questi passaggi per attivare login e sincronizzazione progressi.

## 1. Crea un progetto Firebase (gratuito)

1. Vai su https://console.firebase.google.com/
2. Clicca **"Aggiungi progetto"** (o "Add project")
3. Dai un nome al progetto (es. "tedesco-facile")
4. Disattiva Google Analytics se non ti interessa
5. Clicca **"Crea progetto"**

## 2. Attiva l'autenticazione

1. Nel menu a sinistra clicca **"Authentication"**
2. Clicca **"Inizia"** (o "Get started")
3. Nella tab **"Sign-in method"**, attiva:
   - **Email/Password** → attiva → Salva
   - **Google** → attiva → scegli la tua email → Salva

## 3. Crea il database Firestore

1. Nel menu a sinistra clicca **"Firestore Database"**
2. Clicca **"Crea database"** (o "Create database")
3. Scegli **"Inizia in modalità test"** (Start in test mode)
4. Scegli la regione più vicina (es. europe-west)
5. Clicca **"Abilita"**

## 4. Ottieni la configurazione

1. Clicca sull'icona **ingranaggio** ⚙️ in alto a sinistra → **"Impostazioni progetto"**
2. Scorri in basso fino a **"Le tue app"**
3. Clicca sull'icona **</>** (Web)
4. Dai un nome all'app (es. "tedesco-facile-web")
5. NON attivare Firebase Hosting
6. Clicca **"Registra app"**
7. Vedrai un blocco di codice con `firebaseConfig = { ... }`

## 5. Incolla la configurazione

Apri il file `js/firebase-config.js` e sostituisci i valori vuoti con quelli del tuo progetto:

```javascript
export const firebaseConfig = {
    apiKey: "AIzaSy...",          // dal tuo progetto
    authDomain: "tuo-progetto.firebaseapp.com",
    projectId: "tuo-progetto",
    storageBucket: "tuo-progetto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc..."
};
```

## 6. Autorizza il dominio

1. Torna in **Authentication** → **Settings** → **Authorized domains**
2. Aggiungi `iklazohr.github.io` (il dominio del tuo sito)

## 7. Fatto!

Pusha le modifiche su GitHub e il sistema di account sarà attivo.
Gli utenti potranno registrarsi con email o Google e i progressi saranno sincronizzati automaticamente.
