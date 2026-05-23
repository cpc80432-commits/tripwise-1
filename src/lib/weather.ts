import type { WeatherData } from '@/types'

const BASE = 'https://api.openweathermap.org/data/2.5'
const KEY  = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

export async function getWeather(lat: number, lon: number): Promise<WeatherData | null> {
  if (!KEY) return null
  try {
    const res = await fetch(
      `${BASE}/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric&lang=zh_tw`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return null
    const d = await res.json()
    return {
      temp: Math.round(d.main.temp),
      feelsLike: Math.round(d.main.feels_like),
      description: d.weather[0].description,
      icon: d.weather[0].icon,
      humidity: d.main.humidity,
      rainChance: d.rain ? Math.min(Math.round((d.rain['1h'] || 0) * 20), 100) : 0,
      windSpeed: Math.round(d.wind.speed),
    }
  } catch {
    return null
  }
}

export async function getForecast(lat: number, lon: number) {
  if (!KEY) return []
  try {
    const res = await fetch(
      `${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric&lang=zh_tw&cnt=40`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const d = await res.json()
    // group by day
    const byDay: Record<string, { temps: number[]; icons: string[]; rain: number }> = {}
    for (const item of d.list) {
      const day = item.dt_txt.split(' ')[0]
      if (!byDay[day]) byDay[day] = { temps: [], icons: [], rain: 0 }
      byDay[day].temps.push(item.main.temp)
      byDay[day].icons.push(item.weather[0].icon)
      if (item.rain) byDay[day].rain += (item.rain['3h'] || 0)
    }
    return Object.entries(byDay).slice(0, 5).map(([date, v]) => ({
      date,
      maxTemp: Math.round(Math.max(...v.temps)),
      minTemp: Math.round(Math.min(...v.temps)),
      icon: v.icons[Math.floor(v.icons.length / 2)],
      rainChance: Math.min(Math.round(v.rain * 15), 100),
    }))
  } catch {
    return []
  }
}

export function getWeatherAdvice(weather: WeatherData): string | null {
  if (weather.rainChance > 60)
    return `降雨機率 ${weather.rainChance}%，建議攜帶雨傘，並將戶外景點安排在上午。`
  if (weather.temp > 35)
    return `今日高溫 ${weather.temp}°C，建議避開正午戶外活動，多補充水分。`
  if (weather.temp < 8)
    return `今日低溫 ${weather.temp}°C，請注意保暖，攜帶外套。`
  if (weather.windSpeed > 10)
    return `強風預警，風速 ${weather.windSpeed} m/s，高空景點請注意安全。`
  return null
}
