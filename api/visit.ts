export default async function handler(req: any, res: any) {
    // Allow CORS if needed, or Vercel handles it for same-origin
    // For safety, we can set headers.
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    // res.setHeader(
    //   'Access-Control-Allow-Headers',
    //   'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    // )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    try {
        const response = await fetch(
            "https://api.counterapi.dev/v2/subhan-uddins-team-2785/first-counter-2785/up",
            {
                method: 'POST', // Ensure we use POST as discovered
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.COUNTER_API_KEY}`
                    // Note: In Vercel serverless functions, we use process.env.
                    // Using COUNTER_API_KEY guarantees it is not exposed to the client 
                    // via Vite's bundling process.
                }
            }
        );

        if (!response.ok) {
            // If increment fails (e.g. rate limit), try to get the current count
            const getResponse = await fetch("https://api.counterapi.dev/v2/subhan-uddins-team-2785/first-counter-2785");
            if (getResponse.ok) {
                const data = await getResponse.json();
                return res.status(200).json({ count: data?.data?.up_count ?? 0 });
            }
            throw new Error(`External API returned ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({
            count: data?.data?.up_count ?? 0,
        });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to fetch visit count", count: 0 });
    }
}
