const { createServer } = require("http");
const next = require("next");

const port = Number.parseInt(
  process.env.PORT ||
    process.env.PASSENGER_PORT ||
    process.env.NODE_PORT ||
    process.env.APP_PORT ||
    "3000",
  10
);
const hostname = process.env.HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(
  `> Booting with PORT=${process.env.PORT || ""} PASSENGER_PORT=${
    process.env.PASSENGER_PORT || ""
  } NODE_PORT=${process.env.NODE_PORT || ""} APP_PORT=${
    process.env.APP_PORT || ""
  }`
);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.on("error", (error) => {
    console.error("Server failed to start", error);
    process.exit(1);
  });

  server.listen(port, hostname, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`
    );
  });
});
