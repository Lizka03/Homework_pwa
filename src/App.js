import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useParams } from "react-router-dom";
import "./App.css";

// Компонент для отображения карточки задачи
const TaskDetail = () => {
  const { taskId } = useParams();  // Получаем ID задачи из URL
  const [task, setTask] = useState(null);
  useEffect(() => {
    // Ищем задачу по ID в списке задач
    const foundTask = JSON.parse(localStorage.getItem("tasks")).find(
      (task) => task.id === parseInt(taskId)
    );
    setTask(foundTask);
  }, [taskId]);
  if (!task) {
    return <div>Задача не найдена</div>;
  }
  return (
    <div className="task-detail">
      <h2>Детали задачи</h2>
      <p><strong>Текст задачи:</strong> {task.text}</p>
      <p><strong>Дата:</strong> {task.date}</p>
      <p><strong>Статус:</strong> {task.completed ? "Выполнено" : "Не выполнено"}</p>
    </div>
  );
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [taskDate, setTaskDate] = useState(""); // Для хранения выбранной даты
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const saveTasksToCache = (tasks) => {
    localStorage.setItem("tasks", JSON.stringify(tasks));  // Сохраняем задачи в localStorage
  };

  useEffect(() => {
    // Загружаем задачи при монтировании компонента
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);

    // Регистрация сервис-воркера
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Сервис-воркер зарегистрирован: ', registration);
        })
        .catch((error) => {
          console.error('Ошибка регистрации сервис-воркера: ', error);
        });
    }

    // Обработчик события beforeinstallprompt
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event); // Сохраняем событие для использования позже
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleAddTask = () => {
    if (task.trim() && taskDate) {
      const newTask = {
        id: Date.now(),
        text: task,
        date: taskDate,
        completed: false,
      };
      const updatedTasks = [...tasks, newTask]; // Обновляем список задач
      setTasks(updatedTasks);
      saveTasksToCache(updatedTasks); // Сохраняем задачи в localStorage
      setTask("");
      setTaskDate(""); // Сбрасываем данные
    } else {
      alert("Введите текст задачи и выберите дату!");
    }
  };

  const toggleComplete = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasksToCache(updatedTasks); // Сохраняем изменения
  
    // Получаем обновленную задачу
    const task = updatedTasks.find((task) => task.id === id);
  
    // Проверяем, если задача выполнена
    if (task.completed) {
      // Проверяем, есть ли разрешение на уведомления
      if (Notification.permission === 'granted') {
        // Отправляем уведомление
        new Notification("Поздравляю! Вы выполнили задачу!");
      } else {
        alert("Разрешите уведомления для получения оповещений!");
      }
    }
  };
  

  const handleDelete = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    saveTasksToCache(updatedTasks); // Сохраняем изменения
  };

  const TaskList = ({ completedFilter }) => {
    let filteredTasks = tasks;
    if (completedFilter !== null) {
      filteredTasks = tasks.filter((task) => task.completed === completedFilter);
    }

    return (
      <ul>
        {filteredTasks.map((task) => (
          <li key={task.id} className={task.completed ? "completed" : ""}>
            <span>{task.text}</span>
            <span className="date">{task.date}</span>
            <button onClick={() => toggleComplete(task.id)}>
              {task.completed ? "Не выполнено" : "Выполнено"}
            </button>
            <button onClick={() => handleDelete(task.id)}>Удалить</button>
            {/* Кнопка для перехода на страницу с деталями задачи */}
            <Link to={`/tasks/${task.id}`}>
              <button className="details-button">Подробнее</button>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  const subscribeForPush = async () => {
    try {
      // Запрашиваем разрешение на уведомления
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Необходимо разрешение на уведомления');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BGzYnOpNWlIjXLzNLvT67kizFzj6CjphnAh5CsGanDmpfoBHRjHi6YjgclJ9593z7vbQ5sy14slO1egQ67_1va8'),
      });

      // Сохраняем подписку на сервере
      await saveSubscription(pushSubscription);
      console.log('Подписка успешно выполнена');
    } catch (error) {
      console.error('Ошибка при подписке на уведомления: ', error);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const saveSubscription = async (subscription) => {
    const response = await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    if (response.ok) {
      console.log('Подписка сохранена');
    } else {
      console.error('Ошибка при сохранении подписки');
    }
  };

  return (
    <Router>
      <div className="App">
        <h1>To-Do List</h1>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Введите задачу..."
        />
        <input
          type="date"
          value={taskDate}
          onChange={(e) => setTaskDate(e.target.value)}
        />
        <button onClick={handleAddTask}>Добавить задачу</button>

        <div>
          <Link to="/tasks">Все задачи</Link> | 
          <Link to="/tasks/completed">Выполненные задачи</Link> | 
          <Link to="/tasks/not-completed">Не выполненные задачи</Link>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/tasks" />} />
          <Route path="/tasks" element={<TaskList completedFilter={null} />} />
          <Route path="/tasks/completed" element={<TaskList completedFilter={true} />} />
          <Route path="/tasks/not-completed" element={<TaskList completedFilter={false} />} />
          <Route path="/tasks/:taskId" element={<TaskDetail />} />
        </Routes>

        {/* Оставляем только одну кнопку для подписки на уведомления */}
        <button onClick={subscribeForPush}>Подписаться на уведомления</button>
      </div>
    </Router>
  );
}

export default App;
