// service-worker.js

const CACHE_NAME = 'todo-list-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/App.css',
  '/src/App.js',
  '/public/fav.ico',
  '/tasks'  
];

// Устанавливаем кэш при установке сервис-воркера
self.addEventListener('install', (event) => { //Регистрируется обработчик события install (установка сервис-воркера)
  event.waitUntil( //дождаться завершения процесса кэширования
    caches.open(CACHE_NAME) //открывает указанный кеш
      .then((cache) => {
        return cache.addAll(urlsToCache); //добавляет все указанные ресурсы в кеш
      })
  );
});

// Обрабатываем запросы и кэшируем или возвращаем их из кэша
self.addEventListener('fetch', (event) => {
  event.respondWith( //Позволяет перехватить запрос и вернуть собственный ответ вместо выполнения стандартного сетевого запроса.
    caches.match(event.request) // Проверка наличия ресурса в кэше
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Если ресурс найден в кэше, возвращаем его
          return cachedResponse;
        }
        // Если ресурса нет в кэше, выполняем запрос к сети
        return fetch(event.request)
          .then((networkResponse) => {
            // После получения сетевого ответа, открываем кэш и сохраняем его
            return caches.open(CACHE_NAME)
              .then((cache) => {
                // Сохраняем сетевой ответ в кэш для будущих запросов
                cache.put(event.request, networkResponse.clone());
                return networkResponse; // Возвращаем сетевой ответ
              });
          });
      })
  );
});


// Обновляем или удаляем старые кэши при активации
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; //которые нужно сохранить
  event.waitUntil(
    caches.keys() //Получает список всех имен кешей, хранящихся в Cache Storage 
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) { //Перебирает все имена кешей и удаляет те, которые не находятся в "белом списке"
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});
const saveTasksToCache = (tasks) => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_TASKS',
      tasks,
    });
  }
};
useEffect(() => {
  const loadTasksFromCache = async () => {
    const response = await fetch('/tasks'); // Запрос задач из кэша
    if (response.ok) {
      const cachedTasks = await response.json();
      setTasks(cachedTasks); // Устанавливаем задачи в state
    }
  };

  loadTasksFromCache();
}, []);
// Проверяем поддержку Push API в браузере
if (!('PushManager' in window)) {
  console.log('Push API не поддерживается в этом браузере');
} else {
  // Определяем функцию для подписки на push-уведомления
  async function subscribeForPush() {
      try {
          // Ждем готовности сервис-воркера
          const registration = await navigator.serviceWorker.ready;

          // Подписываем пользователя на push-уведомления
          const pushSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'your-public-key' // Публичный ключ VAPID, преобразованный в Uint8Array
          });

          // Сохраняем подписку на сервере
          saveSubscription(pushSubscription);
          console.log('Подписка на уведомления успешна:', pushSubscription);
      } catch (error) {
          console.error('Ошибка при подписке:', error);
      }
  }

  // Функция для сохранения подписки (отправка на сервер)
  function saveSubscription(subscription) {
      fetch('/subscribe', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
      }).then(response => response.json())
        .then(data => console.log('Подписка сохранена на сервере:', data))
        .catch(error => console.error('Ошибка при сохранении подписки:', error));
  }
}
                 