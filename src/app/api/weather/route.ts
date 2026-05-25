import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city')
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=zh_tw`

  try {
    const res = await fetch(url)
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status })

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      city: data.name,
    })
  } catch {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 })
  }
}
