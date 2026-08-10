export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { BusStopCode } = req.query;
  const busStopCode = BusStopCode || '84241';

  // Read LTA Account Key from Vercel Secret / Environment Variable
  const accountKey = process.env.LTA_ACCOUNT_KEY || 'JGy+GlkWTsqJFUgeMJxDNw==';

  try {
    const ltaRes = await fetch(
      `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`,
      {
        headers: {
          AccountKey: accountKey,
          accept: 'application/json'
        }
      }
    );

    if (!ltaRes.ok) {
      return res.status(ltaRes.status).json({ error: `LTA API Error: ${ltaRes.statusText}` });
    }

    const data = await ltaRes.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
