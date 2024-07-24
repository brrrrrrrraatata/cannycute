const express = require('express');
const axios = require('axios');
const geoip = require('geoip-lite');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = express();
const PORT = 3000;

// Discord 웹훅 URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1247800016374857822/NelJUN_yPHvkwIzLl_vWTgdX0GRtbJ9mUBWfsDdv7zR4_k-euhyVQooowDkWXUvpIRq7';

// IP 정보 조회 API URL
const IP_INFO_URL = 'http://ipinfo.io';

const sendVisitorInfo = async (req, res, next) => {
  let visitorIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // IPv6 주소를 IPv4 주소로 변환
  if (visitorIP === '::1' || visitorIP === '127.0.0.1') {
    try {
      const response = await axios.get(IP_INFO_URL);
      visitorIP = response.data.ip;
    } catch (error) {
      console.error('Error fetching IP information:', error);
    }
  }

  const userAgent = req.headers['user-agent'];
  const geo = geoip.lookup(visitorIP);
  const country = geo ? geo.country : 'Unknown';
  const accessTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });

  // Discord로 정보 전송
  axios.post(WEBHOOK_URL, {
    content: `🎆✨✨Zero - 접속자 정보✨✨🎆\n\n🌐접속IP: ${visitorIP}\n\n🖥️접속환경: ${userAgent}\n\n🌏접속국가: ${country}\n\n⏰접속시간 (UTC+09:00): ${accessTime}`
  })
  .then(response => {
    console.log('Message sent to Discord');
  })
  .catch(error => {
    console.error('Error sending message to Discord:', error);
  });

  next();
};

app.prepare().then(() => {
  server.get('/', sendVisitorInfo, (req, res) => {
    return handle(req, res);
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
