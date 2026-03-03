"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-local-next-items";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function generateTodoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage as unknown;
  if (!value || typeof (value as StorageLike).getItem !== "function" || typeof (value as StorageLike).setItem !== "function") {
    return null;
  }

  return value as StorageLike;
}

function safeReadTodos(): Todo[] {
  try {
    const storage = getStorage();
    if (!storage) {
      return [];
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Todo[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) => typeof item?.id === "string" && typeof item?.text === "string" && typeof item?.done === "boolean"
    );
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodos(safeReadTodos());
    setIsLoaded(true);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const storage = getStorage();
    if (!storage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch {
        // Ignore storage write errors (private mode/quota issues).
      }
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, todos]);

  const { remainingCount, visibleTodos, hasCompleted } = useMemo(() => {
    let remaining = 0;
    let hasDone = false;
    const active: Todo[] = [];
    const completed: Todo[] = [];

    for (const todo of todos) {
      if (todo.done) {
        hasDone = true;
        completed.push(todo);
      } else {
        remaining += 1;
        active.push(todo);
      }
    }

    if (filter === "active") {
      return { remainingCount: remaining, visibleTodos: active, hasCompleted: hasDone };
    }

    if (filter === "completed") {
      return { remainingCount: remaining, visibleTodos: completed, hasCompleted: hasDone };
    }

    return { remainingCount: remaining, visibleTodos: todos, hasCompleted: hasDone };
  }, [filter, todos]);
  const canAddTodo = text.trim().length > 0;

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    setTodos((prev) => [
      {
        id: generateTodoId(),
        text: trimmed,
        done: false
      },
      ...prev
    ]);
    setText("");
    inputRef.current?.focus();
  }

  function toggleTodo(id: string) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  }

  function removeTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function clearDone() {
    setTodos((prev) => prev.filter((todo) => !todo.done));
  }

  function clearAll() {
    setTodos([]);
  }

  function toggleAll() {
    if (todos.length === 0) {
      return;
    }

    const shouldMarkDone = todos.some((todo) => !todo.done);
    setTodos((prev) => prev.map((todo) => ({ ...todo, done: shouldMarkDone })));
  }

  return (
    <main>
      <h1>Todo</h1>
      <p>
        {remainingCount} {remainingCount === 1 ? "item" : "items"} remaining
      </p>

      <section className="card">
        <form className="row" onSubmit={addTodo}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a task..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setText("");
              }
            }}
            aria-label="Todo text"
          />
          <button className="primary" type="submit" disabled={!canAddTodo}>
            Add
          </button>
        </form>

        {todos.length > 0 && (
          <>
            <div className="toolbar">
              <button className="ghost" type="button" onClick={toggleAll}>
                {remainingCount > 0 ? "Mark all done" : "Mark all active"}
              </button>
            </div>
            <div className="filters" role="tablist" aria-label="Todo filters">
              <button
                className={filter === "all" ? "ghost active" : "ghost"}
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={filter === "active" ? "ghost active" : "ghost"}
                type="button"
                aria-pressed={filter === "active"}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                className={filter === "completed" ? "ghost active" : "ghost"}
                type="button"
                aria-pressed={filter === "completed"}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>
          </>
        )}

        {todos.length === 0 ? (
          <p className="empty">No tasks yet.</p>
        ) : visibleTodos.length === 0 ? (
          <p className="empty">No tasks in this filter.</p>
        ) : (
          <ul>
            {visibleTodos.map((todo) => (
              <li key={todo.id}>
                <label className="todo-label">
                  <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                  <span className={todo.done ? "done" : ""}>{todo.text}</span>
                </label>
                <button className="ghost" type="button" onClick={() => removeTodo(todo.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasCompleted && (
          <div style={{ marginTop: 16 }}>
            <button className="ghost" type="button" onClick={clearDone}>
              Clear completed
            </button>
          </div>
        )}

        {todos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button className="ghost" type="button" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
