if ('serviceWorker' in navigator) { //Проверка на поддержку сервис-воркеров в браузере
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js') //регистрация сервис-воркера при загрузке страницы
      .then((registration) => {//вывод в консоль результата регистрации
        console.log('ServiceWorker registration successful with scope: ', registration.scope); 
      })
      .catch((error) => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}
  
