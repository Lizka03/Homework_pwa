import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
//import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    // Регистрируем сервис-воркер
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker зарегистрирован:', registration);

        // Запрашиваем разрешение на отправку пуш-уведомлений
        return Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Разрешение на уведомления получено');
            subscribeUserToPush(registration);
          }
        });
      })
      .catch((error) => {
        console.error('Ошибка регистрации сервис-воркера:', error);
      });
  });
}

// Функция для подписки пользователя на push-уведомления
function subscribeUserToPush(registration) {
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('BPzcUowtReutW3seiwHmUgnM4d11HG8IxZVJ5FnOQHP_9S8JAkbpL8ZYo3UZoHZqT3Ki6nLMLtAozcbOHM0nQXc') // Вставьте свой VAPID ключ
  })
  .then((subscription) => {
    console.log('Подписка на push-уведомления:', subscription);
    // Отправить подписку на сервер для сохранения
    fetch('/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  })
  .catch((error) => {
    console.error('Ошибка подписки на push-уведомления:', error);
  });
}

// Функция для преобразования VAPID ключа
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
