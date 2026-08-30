const httpProxy = require("http-proxy");
const http = require("http");
const fs = require("fs");
const dns = require("dns");
const { promisify } = require("util");

var config = fs.readFileSync("config.json");
config = JSON.parse(config);

const proxy = httpProxy.createServer();
const resolve4 = promisify(dns.resolve4);

function sanitizeServiceName(serviceName) {
  if (!serviceName || typeof serviceName !== "string") return null;

  const sanitized = serviceName.replace(/[^a-zA-Z0-9-]/g, "");

  if (sanitized.length === 0 || sanitized.length > 50) return null;

  return sanitized;
}

async function checkDNS(hostname) {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DNS timeout')), 2000)
    );
    
    await Promise.race([resolve4(hostname), timeoutPromise]);
    return true;
  } catch (error) {
    console.warn(`DNS check failed for ${hostname}:`, error.message);
    return false;
  }
}

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message, "Target:", req.headers.host);
  
  if (!res.headersSent) {
    res.statusCode = 502;
    res.end();
  }
});

const server = http.createServer(async (req, res) => {
  try {
    console.log(req.url);

    const rawServiceName = req.url.split("/")[1];
    const serviceName = sanitizeServiceName(rawServiceName);

    if (!serviceName) {
      console.warn(`Blocked potentially malicious service name: ${rawServiceName}`);
      res.statusCode = 404;
      res.end();
      return;
    }

    const target = config.targets[serviceName];
    if (target) {
      const targetUrl = `${target.url}-${process.env.ENVIRONMENT}`;
      const targetHost = new URL(targetUrl).hostname;
      
      const dnsOk = await checkDNS(targetHost);
      if (!dnsOk) {
        console.error(`Service unavailable: ${targetHost}`);
        res.statusCode = 503;
        res.end();
        return;
      }

      req.url = req.url.replace(`/${serviceName}`, "");
      proxy.web(req, res, {
        target: `${targetUrl}/`
      }, (error) => {
        if (error && !res.headersSent) {
          console.error(`Proxy callback error for ${serviceName}:`, error.message);
          res.statusCode = 502;
          res.end();
        }
      });
      return;
    }
    res.statusCode = 404;
    res.end();
  } catch (e) {
    console.error("Error handling request:", e.message);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end();
    }
  }
});

server.listen(config.serverPort);

console.log(`Proxy running on port ${config.serverPort}`);