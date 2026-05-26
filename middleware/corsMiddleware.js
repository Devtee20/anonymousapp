module.exports = (req, res, next) => {
    const configured = process.env.FRONTEND_ORIGIN;

    if (configured) {
        // If a specific origin or comma-separated list is configured, use it.
        res.header('Access-Control-Allow-Origin', configured);
    } else if (req.headers.origin) {
        // In development allow the requesting origin (handles different local ports)
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    } else {
        // Fallback to permissive wildcard if origin is unavailable
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
};
