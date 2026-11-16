import TaskApp from "@/components/TaskApp";

export default function HomePage() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Task Manager</h1>
        <p>Plan your day, track what is done.</p>
      </header>

      <div className="layout">
        <TaskApp />
      </div>

      <footer className="page-footer">
        Built by Basit Ahmed with Next.js, REST APIs and PostgreSQL.
      </footer>
    </main>
  );
}
