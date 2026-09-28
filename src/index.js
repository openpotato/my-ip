export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = normalizePath(url.pathname);

        // Handle CORS preflight for API endpoints.
        if (request.method === "OPTIONS" && isApiEndpoint(path)) {
            return corsPreflightResponse();
        }

        // Only GET and HEAD are supported.
        if (request.method !== "GET" && request.method !== "HEAD") {
            return new Response("Method Not Allowed\n", {
                status: 405,
                headers: {
                    "Allow": "GET, HEAD, OPTIONS",
                    ...defaultHeaders("text/plain; charset=utf-8")
                }
            });
        }

        const info = getClientInfo(request);

        switch (path) {
            case "/":
                return respond(
                    request,
                    renderPage(info),
                    {
                        headers: htmlHeaders()
                    }
                );

            case "/ip":
                return apiTextResponse(
                    request,
                    info.ip
                );

            case "/json":
                return apiJsonResponse(
                    request,
                    info
                );

            default:
                return respond(
                    request,
                    "Not Found\n",
                    {
                        status: 404,
                        headers: defaultHeaders(
                            "text/plain; charset=utf-8"
                        )
                    }
                );
        }
    }
};

function normalizePath(path) {
    if (path.length > 1 && path.endsWith("/")) {
        return path.slice(0, -1);
    }

    return path;
}

function isApiEndpoint(path) {
    return [
        "/ip",
        "/json"
    ].includes(path);
}

function getClientInfo(request) {
    const cf = request.cf ?? {};

    return {
        ip: request.headers.get("CF-Connecting-IP"),

        network: {
            asn: cf.asn ?? null,
            organization: cf.asOrganization ?? null
        },

        location: {
            country: cf.country ?? null,
            continent: cf.continent ?? null,

            region: cf.region ?? null,
            regionCode: cf.regionCode ?? null,

            city: cf.city ?? null,
            postalCode: cf.postalCode ?? null,

            latitude: cf.latitude ?? null,
            longitude: cf.longitude ?? null,

            timezone: cf.timezone ?? null
        },

        connection: {
            protocol: cf.httpProtocol ?? null,

            tlsVersion: cf.tlsVersion ?? null,
            tlsCipher: cf.tlsCipher ?? null,

            tcpRtt: cf.clientTcpRtt ?? null,
            quicRtt: cf.clientQuicRtt ?? null,

            acceptEncoding:
                cf.clientAcceptEncoding ?? null
        },

        cloudflare: {
            colo: cf.colo ?? null,
            rayId: getRayId(request)
        },

        browser: {
            userAgent:
                request.headers.get("User-Agent"),

            acceptLanguage:
                request.headers.get("Accept-Language")
        }
    };
}

function getRayId(request) {
    const value = request.headers.get("CF-Ray");

    if (!value) {
        return null;
    }

    // CF-Ray normally looks like:
    // 9abcdef012345678-FRA
    return value.split("-")[0];
}

function apiTextResponse(request, value) {
    const text =
        value === null ||
            value === undefined
            ? ""
            : String(value);

    return respond(
        request,
        `${text}\n`,
        {
            headers: apiHeaders(
                "text/plain; charset=utf-8"
            )
        }
    );
}

function apiJsonResponse(request, value) {
    return respond(
        request,
        JSON.stringify(value, null, 2) + "\n",
        {
            headers: apiHeaders(
                "application/json; charset=utf-8"
            )
        }
    );
}

function corsPreflightResponse() {
    return new Response(null, {
        status: 204,
        headers: {
            ...corsHeaders(),
            "Access-Control-Max-Age": "86400"
        }
    });
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
            "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type",
        "Access-Control-Expose-Headers":
            "Content-Type"
    };
}

function apiHeaders(contentType) {
    return {
        ...defaultHeaders(contentType),
        ...corsHeaders()
    };
}

function defaultHeaders(contentType) {
    return {
        "Content-Type": contentType,

        "Cache-Control":
            "no-store, no-cache, must-revalidate",

        "Pragma": "no-cache",
        "Expires": "0",

        "X-Content-Type-Options": "nosniff"
    };
}

function htmlHeaders() {
    return {
        ...defaultHeaders(
            "text/html; charset=utf-8"
        ),

        "Content-Security-Policy":
            "default-src 'none'; " +
            "style-src 'unsafe-inline'; " +
            "script-src 'unsafe-inline'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'none'; " +
            "form-action 'none'",

        "Referrer-Policy": "no-referrer",

        "Permissions-Policy":
            "geolocation=(), " +
            "camera=(), " +
            "microphone=()"
    };
}

function respond(
    request,
    body,
    {
        status = 200,
        headers = {}
    } = {}
) {
    return new Response(
        request.method === "HEAD"
            ? null
            : body,
        {
            status,
            headers
        }
    );
}

function renderPage(info) {
    return `<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <meta
        name="description"
        content="Show your public IP address and connection information."
    >

    <title>What is my IP?</title>

    <style>
        :root {
            color-scheme: light dark;

            --background: #f7f7f7;
            --panel: #ffffff;
            --text: #111111;
            --muted: #6b6b6b;
            --border: #dedede;
            --border-soft: #ededed;
            --button: #ffffff;
            --button-hover: #f2f2f2;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --background: #111111;
                --panel: #181818;
                --text: #eeeeee;
                --muted: #9a9a9a;
                --border: #333333;
                --border-soft: #2a2a2a;
                --button: #202020;
                --button-hover: #2a2a2a;
            }
        }

        * {
            box-sizing: border-box;
        }

        html {
            -webkit-text-size-adjust: 100%;
        }

        body {
            margin: 0;

            background: var(--background);
            color: var(--text);

            font-family:
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
        }

        main {
            width: min(100% - 32px, 760px);
            margin: 0 auto;
            padding: 64px 0 40px;
        }

        header {
            margin-bottom: 28px;
        }

        h1 {
            margin: 0;
			font-size: 30px;
			font-weight: 680;
			letter-spacing: -.035em;
        }

        .lead {
            margin: 14px 0 0;

            color: var(--muted);

            font-size: 1rem;
            line-height: 1.6;
        }

        .panel {
            overflow: hidden;

            background: var(--panel);

            border: 1px solid var(--border);
            border-radius: 14px;
        }

        .hero {
            padding: 28px;
            border-bottom: 1px solid var(--border);
        }

        .label {
            margin-bottom: 8px;

            color: var(--muted);

            font-size: 0.82rem;
            font-weight: 600;

            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .ip {
            font-family:
                ui-monospace,
                SFMono-Regular,
                Menlo,
                Monaco,
                Consolas,
                monospace;

            font-size: clamp(1.45rem, 5vw, 2.3rem);
            font-weight: 650;

            overflow-wrap: anywhere;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            margin-top: 22px;
        }

        button,
        .button {
            min-height: 40px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 14px;

            color: var(--text);
            background: var(--button);

            border: 1px solid var(--border);
            border-radius: 8px;

            font: inherit;
            font-size: 0.9rem;
            font-weight: 500;

            text-decoration: none;

            cursor: pointer;
        }

        button:hover,
        .button:hover {
            background: var(--button-hover);
        }

        button:focus-visible,
        .button:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 2px;
        }

        .group {
            padding: 0 28px;
        }

        .group + .group {
            border-top: 1px solid var(--border);
        }

        .group-title {
            margin: 0;
            padding: 24px 0 8px;

            font-size: 0.9rem;
            font-weight: 650;
        }

        dl {
            margin: 0;
        }

        .row {
            display: grid;
            grid-template-columns: minmax(130px, 35%) minmax(0, 1fr);
            gap: 20px;

            padding: 11px 0;

            border-bottom: 1px solid var(--border-soft);
        }

        .row:last-child {
            border-bottom: none;
        }

        dt {
            color: var(--muted);

            font-size: 0.92rem;
        }

        dd {
            margin: 0;

            font-size: 0.92rem;

            overflow-wrap: anywhere;
        }

        code {
            font-family:
                ui-monospace,
                SFMono-Regular,
                Menlo,
                Monaco,
                Consolas,
                monospace;

            font-size: 0.92em;
        }

        .note {
            margin: 8px 0 0;
            padding-bottom: 24px;

            color: var(--muted);

            font-size: 0.82rem;
            line-height: 1.5;
        }

        footer {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 12px;

            margin-top: 20px;

            color: var(--muted);

            font-size: 0.82rem;
        }

        footer a {
            color: inherit;
        }

        .api-links {
            display: flex;
            gap: 12px;
        }

        .footer-source {
            flex-basis: 100%;
            margin-top: 20px;
            padding-top: 20px;

            border-top: 1px solid var(--border-soft);

            text-align: center;
        }

        @media (max-width: 560px) {
            main {
                width: min(100% - 24px, 760px);
                padding-top: 36px;
            }

            .hero,
            .group {
                padding-left: 20px;
                padding-right: 20px;
            }

            .row {
                grid-template-columns: 1fr;
                gap: 4px;
            }

            .actions {
                align-items: stretch;
            }

            button,
            .button {
                flex: 1;
            }
        }
    </style>
</head>

<body>

<main>

    <header>

        <h1>What is my IP?</h1>

        <p class="lead">
            Your public IP address and connection details
            as seen by Cloudflare.
        </p>
    </header>

    <div class="panel">

        <div class="hero">

            <div class="label">
                Public IP address
            </div>

            <div
                class="ip"
                id="ip"
            >${escapeHtml(info.ip)}</div>

            <div class="actions">

                <button
                    type="button"
                    id="copy-ip"
                >
                    Copy IP
                </button>

                <a
                    class="button"
                    href="/ip"
                >
                    Raw
                </a>

                <a
                    class="button"
                    href="/json"
                >
                    JSON
                </a>

            </div>

        </div>

        <section class="group">

            <h2 class="group-title">
                Network
            </h2>

            <dl>

                ${dataRow(
        "IP address",
        info.ip,
        true
    )}

                ${dataRow(
        "ASN",
        formatAsn(info.network.asn)
    )}

                ${dataRow(
        "Network",
        info.network.organization
    )}

            </dl>

        </section>

        <section class="group">

            <h2 class="group-title">
                Approximate location
            </h2>

            <dl>

                ${dataRow(
        "Country",
        info.location.country
    )}

                ${dataRow(
        "Region",
        info.location.region
    )}

                ${dataRow(
        "Region code",
        info.location.regionCode
    )}

                ${dataRow(
        "City",
        info.location.city
    )}

                ${dataRow(
        "Postal code",
        info.location.postalCode
    )}

                ${dataRow(
        "Continent",
        info.location.continent
    )}

                ${dataRow(
        "Timezone",
        info.location.timezone
    )}

                ${dataRow(
        "Coordinates",
        formatCoordinates(
            info.location.latitude,
            info.location.longitude
        )
    )}

            </dl>

            <p class="note">
                Location information is based on IP geolocation
                and may be inaccurate.
            </p>

        </section>

        <section class="group">

            <h2 class="group-title">
                Connection
            </h2>

            <dl>

                ${dataRow(
        "Protocol",
        info.connection.protocol
    )}

                ${dataRow(
        "TLS version",
        info.connection.tlsVersion
    )}

                ${dataRow(
        "TLS cipher",
        info.connection.tlsCipher
    )}

                ${dataRow(
        "TCP RTT",
        formatMilliseconds(
            info.connection.tcpRtt
        )
    )}

                ${dataRow(
        "QUIC RTT",
        formatMilliseconds(
            info.connection.quicRtt
        )
    )}

            </dl>

        </section>

        <section class="group">

            <h2 class="group-title">
                Cloudflare
            </h2>

            <dl>

                ${dataRow(
        "Edge location",
        info.cloudflare.colo
    )}

                ${dataRow(
        "Ray ID",
        info.cloudflare.rayId,
        true
    )}

            </dl>

        </section>

        <section class="group">

            <h2 class="group-title">
                Browser
            </h2>

            <dl>

                ${dataRow(
        "User agent",
        info.browser.userAgent
    )}

                ${dataRow(
        "Accept language",
        info.browser.acceptLanguage
    )}

                ${clientDataRow(
        "Browser timezone",
        "browser-timezone"
    )}

                ${clientDataRow(
        "Browser languages",
        "browser-languages"
    )}

                ${clientDataRow(
        "Screen",
        "screen"
    )}

            </dl>

            <p class="note">
                Browser-only values are calculated locally
                and are not sent back to the server.
            </p>

        </section>

    </div>

    <footer>

        <span>
            No cookies. No tracking.
        </span>

        <span class="api-links">
            <a href="/ip">/ip</a>
            <a href="/json">/json</a>
        </span>

         <span class="footer-source">
            Made with ❤️ in Berlin.
            Source code on
            <a
                href="https://github.com/openpotato/my-ip"
                target="_blank"
                rel="noopener noreferrer"
            >GitHub</a>.
        </span>

    </footer>

</main>

<script>
    const ip =
        ${JSON.stringify(info.ip ?? "")};

    const copyButton =
        document.getElementById("copy-ip");

    copyButton.addEventListener(
        "click",
        async () => {
            try {
                await navigator.clipboard.writeText(ip);

                copyButton.textContent = "Copied";

                setTimeout(
                    () => {
                        copyButton.textContent = "Copy IP";
                    },
                    1500
                );
            }
            catch {
                copyButton.textContent =
                    "Copy failed";

                setTimeout(
                    () => {
                        copyButton.textContent = "Copy IP";
                    },
                    1500
                );
            }
        }
    );

    document
        .getElementById("browser-timezone")
        .textContent =
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone ||
            "—";

    document
        .getElementById("browser-languages")
        .textContent =
            navigator.languages?.join(", ") ||
            navigator.language ||
            "—";

    document
        .getElementById("screen")
        .textContent =
            screen.width +
            " × " +
            screen.height +
            " @ " +
            window.devicePixelRatio +
            "×";
</script>

</body>

</html>`;
}

function dataRow(name, value, monospace = false) {
    return `
        <div class="row">
            <dt>${escapeHtml(name)}</dt>
            <dd>${formatDisplayValue(value, monospace)}</dd>
        </div>
    `;
}

function clientDataRow(name, id) {
    return `
        <div class="row">
            <dt>${escapeHtml(name)}</dt>
            <dd id="${escapeHtml(id)}">—</dd>
        </div>
    `;
}

function formatDisplayValue(value, monospace = false) {
    const escaped = escapeHtml(value);

    if (monospace && escaped !== "—") {
        return `<code>${escaped}</code>`;
    }

    return escaped;
}

function formatAsn(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return `AS${value}`;
}

function formatCoordinates(latitude, longitude) {
    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined
    ) {
        return null;
    }

    return `${latitude}, ${longitude}`;
}

function formatMilliseconds(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    return `${value} ms`;
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}