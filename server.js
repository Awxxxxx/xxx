const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// 允许跨域请求
app.use(cors());

// WeatherKit API 配置
const TEAM_ID = 'WR7885F6JL';
const SERVICE_ID = 'com.Secretbox.weatherkit-client';
const KEY_ID = 'F8N9S83ZPP';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgT1F+xvciRZcXb5fA5zGVptBXctJG8uOGti+Xi/5KY6KgCgYIKoZIzj0DAQehRANCAAQ9I8YAAu1z5LFaAc2DgMsxCqoAuI4oIqKKU+0Vxm4pILecfMb/suvfHw7xdtzI41Qhl2TGTHhvSwx5e8cfhd8l
-----END PRIVATE KEY-----`;

// 生成 JWT Token 的逻辑
function generateWeatherKitToken() {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1小时后过期

    const payload = {
        iss: TEAM_ID,
        sub: SERVICE_ID,
        iat,
        exp
    };

    const header = {
        alg: 'ES256',
        kid: KEY_ID,
        id: `${TEAM_ID}.${SERVICE_ID}`
    };

    return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'ES256', header });
}

// 获取天气数据的 API 路由
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: '缺少经纬度参数 lat 或 lon' });
    }

    try {
        const token = generateWeatherKitToken();
        
        // 动态引入 node-fetch，兼容不同的 Node.js 版本
        const fetch = (await import('node-fetch')).default || require('node-fetch');

        // 请求 WeatherKit 接口
        // 获取当前天气 (currentWeather) 和未来预报 (forecastDaily)
        const url = `https://weatherkit.apple.com/api/v1/weather/zh-CN/${lat}/${lon}?dataSets=currentWeather,forecastDaily`;
        
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`WeatherKit API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('获取 WeatherKit 数据失败:', error);
        res.status(500).json({ error: '获取天气数据失败' });
    }
});

// 兼容 Vercel Serverless Function 部署
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
