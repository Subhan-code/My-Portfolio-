export default async function handler(req: any, res: any) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    // Handle POST (Track Visitor)
    if (req.method === 'POST') {
        try {
            // In a real DB implementation, we would check if req.body.fingerprint exists.
            // Since we are using CounterAPI (which is just a counter), we essentially just increment.
            // The frontend logic (useEffect) ensures this is called once per session/mount.

            const response = await fetch(
                "https://api.counterapi.dev/v2/subhan-uddins-team-2785/first-counter-2785/up",
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.COUNTER_API_KEY}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Upstream API failed: ${response.status}`);
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Tracking error:", error);
            return res.status(500).json({ error: "Failed to track visitor" });
        }
    }

    // Handle GET (Get Stats)
    if (req.method === 'GET') {
        try {
            const response = await fetch("https://api.counterapi.dev/v2/subhan-uddins-team-2785/first-counter-2785");

            if (!response.ok) {
                throw new Error(`Upstream API failed: ${response.status}`);
            }

            const data = await response.json();
            // Map to expected format
            return res.status(200).json({
                uniqueVisitors: data?.data?.up_count ?? 0
            });
        } catch (error) {
            console.error("Stats error:", error);
            return res.status(500).json({ error: "Failed to fetch stats" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
