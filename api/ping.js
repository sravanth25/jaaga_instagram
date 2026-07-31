export default function handler(req, res) {
  res.status(200).json({ ok: true, msg: "pong", time: new Date().toISOString() });
}
