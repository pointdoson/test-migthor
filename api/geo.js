// Función serverless de Vercel — se activa sola, no requiere configuración
// en el panel de Vercel. Devuelve el país del visitante usando la
// geolocalización gratuita que Vercel ya calcula en su red edge.
export default function handler(req, res) {
  const country = req.headers["x-vercel-ip-country"] || null;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ country });
}
