import { NextResponse } from "next/server";
import { handle, jsonError } from "@/lib/http";
import { getWeather, WeatherError } from "@/lib/weather";

// GET /api/weather?city=Karachi
// Server-side proxy for Open-Meteo: validates input, hides the upstream
// response shape from the browser, and lets responses be cached.
export const GET = handle(async (request: Request) => {
  const city = new URL(request.url).searchParams.get("city")?.trim() ?? "";

  if (city.length < 2 || city.length > 80) {
    return jsonError(400, "Enter a city name between 2 and 80 characters.");
  }

  try {
    const weather = await getWeather(city);
    return NextResponse.json(
      { data: weather },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
    );
  } catch (err) {
    if (err instanceof WeatherError) return jsonError(err.status, err.message);
    throw err;
  }
});
