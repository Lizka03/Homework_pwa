const webPush = require('web-push'); //для отправки push-уведомлени
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Настройка VAPID-ключей
const vapidKeys = {
  publicKey: 'BGzYnOpNWlIjXLzNLvT67kizFzj6CjphnAh5CsGanDmpfoBHRjHi6YjgclJ9593z7vbQ5sy14slO1egQ67_1va8',
  privateKey: '8yAvMKJzoAagCTHwH5j9ujjK8EqI76yQAKe0BDJMhBg',
};
webPush.setVapidDetails('mailto:your-email@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

app.use(bodyParser.json()); //сервер мог корректно парсить JSON-данные, которые приходят в теле POST-запросов

// Хранилище подписок
let subscriptions = [];

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription); //Подписка сохраняется в массиве subscriptions, и сервер возвращает ответ с кодом 201
  res.status(201).json({ message: 'Подписка сохранена' });
});
//принятие данных
app.post('/send-notification', (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body });

  subscriptions.forEach((subscription) => { // перебираем подписки
    webPush.sendNotification(subscription, payload).catch((error) => { //отправляем уведомления с переданными данными
      console.error('Ошибка отправки:', error);
    });
  });

  res.status(200).json({ message: 'Уведомления отправлены' });
});

app.listen(3000, () => {
  console.log('Сервер работает на порту 3000');
});
