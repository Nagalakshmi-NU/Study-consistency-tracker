import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('studyLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewDate, setViewDate] = useState(new Date(2026, 1, 1));
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    localStorage.setItem('studyLogs', JSON.stringify(logs));
  }, [logs]);

  // --- DATA MANAGEMENT FUNCTIONS ---
  const exportData = () => {
    if (logs.length === 0) return alert("No data to export!");
    const csvRows = logs.sort((a, b) => a.date.localeCompare(b.date))
      .map(l => `${l.date},"${l.topic.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob(["Date,Topics\n" + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Learning_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const backupData = () => {
    const dataStr = JSON.stringify(logs);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `consistency_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  };

  const restoreData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedLogs = JSON.parse(e.target.result);
          if (Array.isArray(importedLogs)) {
            setLogs(importedLogs);
            alert("Logs restored successfully!");
          }
        } catch (err) { alert("Invalid backup file!"); }
      };
      reader.readAsText(file);
    }
  };

  // --- STATS LOGIC ---
  const calculateDaysLeft = () => {
    const end = new Date(2026, 5, 1);
    const diff = end - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    const sorted = logs.map(l => new Date(l.date)).sort((a, b) => b - a);
    let streak = 0, check = new Date();
    check.setHours(0,0,0,0);
    const latest = new Date(sorted[0]);
    latest.setHours(0,0,0,0);
    if ((check - latest) / 86400000 > 1) return 0;
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i]); d.setHours(0,0,0,0);
      if (i === 0) streak = 1;
      else {
        const prev = new Date(sorted[i-1]); prev.setHours(0,0,0,0);
        if ((prev - d) / 86400000 === 1) streak++; else break;
      }
    }
    return streak;
  };

  const toggleDay = (day) => {
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const existing = logs.find(l => l.date === dateStr);

    if (existing) {
      const act = prompt(`Date: ${dateStr}\nType 'ADD' (Topics), 'SUMMARY' (Daily Notes), or 'DELETE'`);
      if (act?.toUpperCase() === 'ADD') {
        const topic = prompt("Add more topics (use commas):");
        if (topic) setLogs(logs.map(l => l.date === dateStr ? { ...l, topic: `${l.topic}, ${topic}` } : l));
      } else if (act?.toUpperCase() === 'SUMMARY') {
        const summary = prompt("What did you learn today?", existing.summary || "");
        if (summary) setLogs(logs.map(l => l.date === dateStr ? { ...l, summary: summary } : l));
      } else if (act?.toUpperCase() === 'DELETE') {
        setLogs(logs.filter(l => l.date !== dateStr));
      }
    } else {
      const topic = prompt("What did you master today?");
      const summary = prompt("Quick summary of your work:");
      if (topic) setLogs([...logs, { date: dateStr, topic, summary: summary || "" }]);
    }
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.topic.toUpperCase().includes(filter));

  return (
    <div className="container">
      <div className="top-stats">
        <div className="stat-box streak">🔥 {calculateStreak()} Day Streak</div>
        <div className="stat-box countdown">⏳ {calculateDaysLeft()} Days Left</div>
      </div>

      <header className="calendar-header">
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>←</button>
        <h2>{viewDate.toLocaleString('default', { month: 'long' })} {viewDate.getFullYear()}</h2>
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>→</button>
      </header>

      <div className="calendar-grid">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const log = logs.find(l => l.date === dateStr);
          const topicCount = log ? log.topic.split(/[|,]+/).filter(t => t.trim() !== "").length : 0;
          const intensity = Math.min(topicCount, 4);
          return (
            <div key={day} className={`day-box level-${intensity}`} onClick={() => toggleDay(day)}>
              {day}
            </div>
          );
        })}
      </div>

      <div className="filter-bar">
        {['ALL', 'DSA', 'PYTHON', 'SQL'].map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="history-section">
        <div className="history-header">
          <h3>Daily Journal</h3>
          <div className="data-controls">
            <button className="action-btn" onClick={exportData}>Export CSV</button>
            <button className="action-btn" onClick={backupData}>Backup</button>
            <label className="action-btn">Restore <input type="file" onChange={restoreData} style={{display:'none'}}/></label>
          </div>
        </div>
        <div className="history-list">
          {filteredLogs.sort((a,b) => b.date.localeCompare(a.date)).map(l => (
            <div key={l.date} className="history-item">
              <span className="log-date">{l.date}</span>
              <strong>Topics:</strong> {l.topic}
              {l.summary && <div className="log-summary"><strong>Summary:</strong> {l.summary}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App