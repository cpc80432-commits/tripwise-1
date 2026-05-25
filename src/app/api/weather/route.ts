import { NextRequest, NextResponse } from 'next/server'

// 中文旅遊地名 → OpenWeather 城市名對照
const CITY_MAP: Record<string, string> = {
  // 日本
  '東京': 'Tokyo', '大阪': 'Osaka', '京都': 'Kyoto', '北海道': 'Sapporo',
  '沖繩': 'Naha', '福岡': 'Fukuoka', '名古屋': 'Nagoya', '奈良': 'Nara',
  // 韓國
  '首爾': 'Seoul', '釜山': 'Busan', '濟州島': 'Jeju', '仁川': 'Incheon',
  // 東南亞
  '峇里島': 'Bali', '曼谷': 'Bangkok', '清邁': 'Chiang Mai', '普吉島': 'Phuket',
  '新加坡': 'Singapore', '吉隆坡': 'Kuala Lumpur', '胡志明市': 'Ho Chi Minh City',
  '河內': 'Hanoi', '峴港': 'Da Nang', '馬尼拉': 'Manila', '宿霧': 'Cebu',
  '雅加達': 'Jakarta', '峇里': 'Bali', '龍目島': 'Mataram',
  // 中國
  '北京': 'Beijing', '上海': 'Shanghai', '香港': 'Hong Kong', '澳門': 'Macao',
  '廣州': 'Guangzhou', '成都': 'Chengdu', '西安': 'Xian', '杭州': 'Hangzhou',
  '桂林': 'Guilin', '麗江': 'Lijiang', '三亞': 'Sanya',
  // 歐洲
  '巴黎': 'Paris', '倫敦': 'London', '羅馬': 'Rome', '巴塞隆納': 'Barcelona',
  '阿姆斯特丹': 'Amsterdam', '布拉格': 'Prague', '維也納': 'Vienna',
  '蘇黎世': 'Zurich', '日內瓦': 'Geneva', '雅典': 'Athens',
  '伊斯坦堡': 'Istanbul', '里斯本': 'Lisbon', '馬德里': 'Madrid',
  '柏林': 'Berlin', '慕尼黑': 'Munich', '米蘭': 'Milan', '威尼斯': 'Venice',
  '佛羅倫斯': 'Florence', '布達佩斯': 'Budapest', '華沙': 'Warsaw',
  // 美洲
  '紐約': 'New York', '洛杉磯': 'Los Angeles', '舊金山': 'San Francisco',
  '拉斯維加斯': 'Las Vegas', '邁阿密': 'Miami', '夏威夷': 'Honolulu',
  '多倫多': 'Toronto', '溫哥華': 'Vancouver', '墨西哥城': 'Mexico City',
  '坎昆': 'Cancun',
  // 中東/非洲/其他
  '杜拜': 'Dubai', '開羅': 'Cairo', '摩洛哥': 'Casablanca',
  '雪梨': 'Sydney', '墨爾本': 'Melbourne', '奧克蘭': 'Auckland',
  '馬爾地夫': 'Male', '斯里蘭卡': 'Colombo', '尼泊爾': 'Kathmandu',
  // 台灣
  '台北': 'Taipei', '台中': 'Taichung', '台南': 'Tainan', '高雄': 'Kaohsiung',
  '花蓮': 'Hualien', '墾丁': 'Hengchun',
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city')
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

  // 嘗試順序：對照表 → 原文 → 去掉後綴再試
  const candidates = [
    CITY_MAP[city],
    city,
    city.replace(/島$|市$|縣$|省$|區$/, ''),
  ].filter(Boolean)

  for (const q of candidates) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q!)}&appid=${key}&units=metric&lang=zh_tw`
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      return NextResponse.json({
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        city: city, // 顯示原本的中文名
      })
    } catch {}
  }

  return NextResponse.json({ error: 'city not found' }, { status: 404 })
}
