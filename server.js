import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/mecabricks/part/:partNum', async (req, res) => {
  const { partNum } = req.params;

  try {
    const urls = [
      `https://cdn.mecabricks.com/parts/ldraw/${partNum}.gltf`,
      `https://www.mecabricks.com/api/parts/${partNum}/export/gltf`,
      `https://mecabricks.com/api/parts/${partNum}/export/gltf`,
    ];

    for (const url of urls) {
      try {
        console.log(`Trying: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json, model/gltf+json, */*',
          },
        });

        if (response.ok) {
          const data = await response.arrayBuffer();
          res.set('Content-Type', 'model/gltf+json');
          return res.send(Buffer.from(data));
        }
      } catch (e) {
        console.log(`Failed: ${url}`);
      }
    }

    return res.status(404).json({ error: 'Model not found' });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
