// Firebase Configuration - Tommy3D
// IMPORTANT: Remplace ces valeurs par celles de ton projet Firebase
// Va sur https://console.firebase.google.com > Paramètres du projet > Config

const firebaseConfig = {
    apiKey: "AIzaSyAlnJ2VRVwhf9VRiQ0Dg5BReeFzjfsJRUM",
    authDomain: "site-1-8effa.firebaseapp.com",
    projectId: "site-1-8effa",
    storageBucket: "site-1-8effa.firebasestorage.app",
    messagingSenderId: "30838813140",
    appId: "1:30838813140:web:9735269a308023b4442641"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;
