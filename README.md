# My IP

A small, dependency-free web tool that shows your public IP address and connection information as seen by [Cloudflare](https://www.cloudflare.com/).

## Features

+ Show the caller's public IPv4 or IPv6 address
+ Show [Autonomous System Number (ASN)](https://www.cloudflare.com/learning/network-layer/what-is-an-autonomous-system/)
+ Show network / ISP organization
+ Show approximate country, region and city
+ Show postal code and timezone
+ Show approximate latitude and longitude
+ Show HTTP protocol information
+ Show TLS version and cipher
+ Show TCP and QUIC round-trip time where available
+ Show the [Cloudflare edge](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/) location handling the request
+ Show the [Cloudflare Ray ID](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/)
+ Show browser user agent and preferred languages
+ Show browser timezone, languages and screen information locally
+ Copy the public IP address to the clipboard
+ Plain-text `/ip` endpoint
+ JSON `/json` endpoint
+ CORS support for the API endpoints
+ Support for `GET`, `HEAD` and CORS preflight requests
+ Responsive layout
+ No cookies
+ No tracking
+ No dependencies

## API

The application provides two simple API endpoints.

### IP address

``` text
GET /ip
```

Returns the caller's public IP address as plain text:

``` text
203.0.113.42
```

Example:

``` bash
curl https://your-worker.example.com/ip
```

### JSON

``` text
GET /json
```

Returns the available request information as JSON:

``` json
{
  "ip": "203.0.113.42",
  "network": {
    "asn": 64496,
    "organization": "Example Network"
  },
  "location": {
    "country": "DE",
    "continent": "EU",
    "region": "Berlin",
    "regionCode": "BE",
    "city": "Berlin",
    "postalCode": "10115",
    "latitude": "52.52",
    "longitude": "13.40",
    "timezone": "Europe/Berlin"
  },
  "connection": {
    "protocol": "HTTP/3",
    "tlsVersion": "TLSv1.3",
    "tlsCipher": "AEAD-AES128-GCM-SHA256",
    "tcpRtt": 15,
    "quicRtt": 12,
    "acceptEncoding": "gzip, deflate, br"
  },
  "cloudflare": {
    "colo": "FRA",
    "rayId": "0123456789abcdef"
  },
  "browser": {
    "userAgent": "...",
    "acceptLanguage": "de-DE,de;q=0.9,en;q=0.8"
  }
}
```

The API endpoints allow cross-origin requests using:

``` text
Access-Control-Allow-Origin: *
```

This makes it possible to query the service directly from client-side JavaScript:

``` javascript
const ip = await fetch("https://your-worker.example.com/ip")
    .then(response => response.text());

console.log(ip.trim());
```

## Privacy

The application does not use cookies, analytics or persistent storage.

Request information such as the IP address, user agent and network metadata is available to the Cloudflare Worker while processing the request. The application does not persist this information.

Browser-specific information such as screen size, browser timezone and browser languages is determined locally in the browser and is not sent back to the Worker.

Location information is based on IP geolocation provided by Cloudflare and is only approximate.

## Live version

The application runs as a serverless [Cloudflare Worker](https://developers.cloudflare.com/workers/) and requires no database or persistent storage.

[![Live version](https://img.shields.io/badge/Open_My_Ip-blue?style=for-the-badge)](https://my-ip.stueber.workers.dev/)

## Can I help?

Yes, that would be much appreciated. The best way to help is to post a response via the Issue Tracker and/or submit a Pull Request.
