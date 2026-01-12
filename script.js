const apiKey = "ec88203656d05f2c7085fbfda9bcaef6"; 

document.addEventListener('DOMContentLoaded', () => {
    fetchWeather('Pune');
});

async function fetchWeather(city = null) {
    const inputCity = document.getElementById('cityInput').value;
    const query = city || inputCity;
    if(!query) return;

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.cod !== 200) { alert('City not found!'); return; }
        
        updateUI(data);
        updateBackground(data.weather[0].main);

        const { lat, lon } = data.coord;
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const aqiRes = await fetch(aqiUrl);
        const aqiData = await aqiRes.json();
        updateAQI(aqiData.list[0].main.aqi);

        const fUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        const fRes = await fetch(fUrl);
        const fData = await fRes.json();
        updateForecast(fData.list);

        document.getElementById('mapFrame').src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.05},${lat-0.05},${lon+0.05},${lat+0.05}&layer=mapnik`;

    } catch (err) { console.error(err); }
}

function updateUI(data) {
    document.getElementById('cityName').innerText = `${data.name}, ${data.sys.country}`;
    
    const now = new Date();
    document.getElementById('currentDate').innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('currentYear').innerText = now.getFullYear();

    document.getElementById('currentTemp').innerText = `${Math.round(data.main.temp)}°`;
    document.getElementById('weatherDesc').innerText = data.weather[0].description;
    document.getElementById('mainIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    const visKm = (data.visibility / 1000).toFixed(1);
    document.getElementById('visibility').innerText = `${visKm} km`;
    let visText = "Clear view";
    if(visKm < 5) visText = "Haze / Mist";
    if(visKm < 2) visText = "Foggy";
    document.getElementById('visText').innerText = visText;

    document.getElementById('windSpeed').innerText = Math.round(data.wind.speed * 3.6); 
    document.getElementById('humidityVal').innerText = `${data.main.humidity}%`;
    document.getElementById('pressureVal').innerText = `${data.main.pressure} hPa`;
    document.getElementById('windArrow').style.transform = `rotate(${data.wind.deg}deg)`;

    // DEW POINT CALCULATION
    const temp = data.main.temp;
    const hum = data.main.humidity;
    const dewPoint = Math.round(temp - ((100 - hum) / 5));
    document.getElementById('dewPoint').innerText = `Dew point is ${dewPoint}°`;
}

function updateAQI(aqi) {
    const aqiVal = document.getElementById('aqiValue');
    const aqiBadge = document.getElementById('aqiBadge');
    const aqiBar = document.getElementById('aqiBar');
    
    let label = "Good", color = "#4ade80", width = "20%";
    switch(aqi) {
        case 1: label = "Good"; color = "#4ade80"; width = "20%"; break;
        case 2: label = "Fair"; color = "#facc15"; width = "40%"; break;
        case 3: label = "Moderate"; color = "#fb923c"; width = "60%"; break;
        case 4: label = "Poor"; color = "#f87171"; width = "80%"; break;
        case 5: label = "Very Poor"; color = "#ef4444"; width = "100%"; break;
    }
    aqiVal.innerText = aqi;
    aqiBadge.innerText = label;
    aqiBadge.style.backgroundColor = `${color}33`;
    aqiBadge.style.color = color;
    aqiBar.style.width = width;
    aqiBar.style.backgroundColor = color;
}

function updateBackground(condition) {
    const heroCard = document.getElementById('heroCard');
    let bgUrl = '';
    switch (condition) {
        case 'Clear': bgUrl = 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=800&auto=format&fit=crop'; break;
        case 'Clouds': bgUrl = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=800&auto=format&fit=crop'; break;
        case 'Rain': bgUrl = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop'; break;
        case 'Thunderstorm': bgUrl = 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=800&auto=format&fit=crop'; break;
        case 'Snow': bgUrl = 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=800&auto=format&fit=crop'; break;
        case 'Mist': case 'Haze': bgUrl = 'https://images.unsplash.com/photo-1487621167305-5d248087c724?q=80&w=800&auto=format&fit=crop'; break;
        default: bgUrl = 'https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800&auto=format&fit=crop';
    }
    heroCard.style.backgroundImage = `url('${bgUrl}')`;
}

function updateForecast(list) {
    const grid = document.getElementById('forecastGrid');
    grid.innerHTML = '';
    
    // STRICT 5-DAY FILTER
    const uniqueDays = [];
    const seenDates = new Set();

    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateString = date.toLocaleDateString();
        
        if (!seenDates.has(dateString) && item.dt_txt.includes("12:00:00")) {
            seenDates.add(dateString);
            uniqueDays.push(item);
        }
    });

    uniqueDays.slice(0, 5).forEach(day => {
        const d = new Date(day.dt * 1000);
        const div = document.createElement('div');
        div.className = 'day-col';
        div.innerHTML = `
            <span>${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
            <b>${Math.round(day.main.temp)}°</b>
        `;
        grid.appendChild(div);
    });
}