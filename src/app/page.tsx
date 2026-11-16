import TaskApp from "@/components/TaskApp";
import WeatherWidget from "@/components/WeatherWidget";

export default function HomePage() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Task Manager</h1>
        <p>Plan your day, track what is done.</p>
      </header>

      <div className="layout layout--split">
        <TaskApp />
        <WeatherWidget />
      </div>

      <footer className="page-footer">
        Built by Basit Ahmed with Next.js, REST APIs and PostgreSQL.
      </footer>
    </main>
  );
}
