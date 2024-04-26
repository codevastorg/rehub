import App from './App';
import './index.scss';
import apiService from './apiService';

document.addEventListener('DOMContentLoaded', () => {
  const app = new App(apiService);
});
