"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Weather } from "@/lib/weather";

const DEFAULT_CITY = "Karachi";
const STORAGE_KEY = "task-manager:city";

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

type State =
  | { status: "loading" }
  | { status: "ready"; weather: Weather }
  | { status: "error"; message: string };

export default function WeatherWidget() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  const load = async (city: string) => {
    // Cancel any in-flight lookup so a slow earlier response cannot overwrite a newer one.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, {
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        setState({ status: "error", message: body?.error?.message ?? "Could not load weather." });
        return;
      }
      setState({ status: "ready", weather: body.data });
      try {
        localStorage.setItem(STORAGE_KEY, body.data.location.name);
      } catch {
        // Storage can be unavailable (private mode); remembering the city is optional.
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({ status: "error", message: "Network error. Check your connection." });
    }
  };

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    void load(saved || DEFAULT_CITY);
    return () => requestRef.current?.abort();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const city = query.trim();
    if (city.length < 2) return;
    void load(city);
    setQuery("");
  };

  return (
    <aside className="card weather" aria-labelledby="weather-heading">
      <div className="card-head">
        <h2 id="weather-heading">Weather</h2>
        <span className="muted">Open-Meteo</span>
      </div>

      <form className="weather-search" onSubmit={submit} role="search">
        <label htmlFor="weather-city" className="sr-only">
          City
        </label>
        <input
          id="weather-city"
          type="search"
          value={query}
          maxLength={80}
          placeholder="Search a city"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      <div aria-live="polite">
        {state.status === "loading" && <p className="state">Loading weather…</p>}

        {state.status === "error" && (
          <p className="alert" role="alert">
            {state.message}
          </p>
        )}

        {state.status === "ready" && (
          <>
            <p className="weather-place">
              {state.weather.location.name}
              <span className="muted">
                {[state.weather.location.region, state.weather.location.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>

            <div className="weather-now">
              <span className="weather-temp">{state.weather.current.temperature}°C</span>
              <span>
                {state.weather.current.condition}
                <span className="muted"> · {state.weather.current.isDay ? "Day" : "Night"}</span>
              </span>
            </div>

            <dl className="weather-stats">
              <div>
                <dt>Feels like</dt>
                <dd>{state.weather.current.feelsLike}°C</dd>
              </div>
              <div>
                <dt>Humidity</dt>
                <dd>{state.weather.current.humidity}%</dd>
              </div>
              <div>
                <dt>Wind</dt>
                <dd>{state.weather.current.windSpeed} km/h</dd>
              </div>
            </dl>

            <ul className="weather-days">
              {state.weather.daily.map((day, i) => (
                <li key={day.date}>
                  <span className="weather-day">
                    {i === 0 ? "Today" : dayFormat.format(new Date(day.date))}
                  </span>
                  <span className="muted">{day.condition}</span>
                  <span className="weather-range">
                    {day.max}° <span className="muted">{day.min}°</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
