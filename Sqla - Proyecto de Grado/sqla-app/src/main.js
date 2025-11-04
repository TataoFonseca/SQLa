// src/main.js
import { AppController } from './js/controllers/appController.js';
import './assets/css/style.css';


// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});
