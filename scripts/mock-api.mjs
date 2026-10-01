import { createServer } from "node:http";

const concert = {
  id: 1,
  title: "Midnight City Live",
  description: "A focused night of live electronic music and bright stage craft.",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  startTime: "2027-03-20T13:00:00Z",
  status: "UPCOMING",
};
const tickets = [
  { id: 11, name: "General admission", price: 750000, totalQuantity: 500, remainingQuantity: 312, concertId: 1 },
  { id: 12, name: "VIP", price: 1800000, totalQuantity: 80, remainingQuantity: 24, concertId: 1 },
];
const booking = {
  id: 101,
  userId: 2,
  concertId: 1,
  concertTitle: concert.title,
  status: "PENDING",
  idempotencyKey: "e2e-intent",
  totalAmount: 750000,
  discountAmount: 0,
  expiresAt: "2027-03-20T12:15:00Z",
  items: [{ id: 1, ticketTypeId: 11, ticketTypeName: "General admission", quantity: 1, price: 750000, subTotal: 750000 }],
};

const page = (items) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const json = (response, status, body, headers = {}) => {
  response.writeHead(status, { "Content-Type": "application/json", ...headers });
  response.end(JSON.stringify(body));
};
const session = (request) => request.headers.cookie?.match(/mock_session=(ADMIN|USER)/)?.[1];

createServer(async (request, response) => {
  const origin = request.headers.origin;
  const cors = origin === "http://127.0.0.1:3000" ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type,X-XSRF-TOKEN",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  } : {};
  if (request.method === "OPTIONS") {
    response.writeHead(204, cors);
    return response.end();
  }
  const url = new URL(request.url, "http://127.0.0.1:8081");
  const path = url.pathname.replace(/^\/api\/v1/, "");
  if (request.method === "GET" && path === "/concerts") return json(response, 200, page([concert]), cors);
  if (request.method === "GET" && path === "/concerts/1") return json(response, 200, concert, cors);
  if (request.method === "GET" && path === "/concerts/1/ticket-types") return json(response, 200, tickets, cors);
  if (request.method === "GET" && path === "/concerts/1/availability") return json(response, 200, { concertId: 1, title: concert.title, status: concert.status, totalTickets: 580, remainingTickets: 336, soldTickets: 244, ticketTypeDetails: tickets }, cors);
  if (request.method === "GET" && path === "/auth/csrf") return json(response, 200, { token: "e2e-csrf" }, { ...cors, "Set-Cookie": "XSRF-TOKEN=e2e-csrf; Path=/; SameSite=Lax" });
  if (request.method === "GET" && path === "/auth/me") {
    const role = session(request);
    return role ? json(response, 200, { id: role === "ADMIN" ? 1 : 2, name: role === "ADMIN" ? "admin" : "listener", email: `${role.toLowerCase()}@example.com`, role }, cors) : json(response, 401, { status: 401, detail: "Authentication required", code: "AUTHENTICATION_REQUIRED" }, cors);
  }
  if (request.method === "POST" && path === "/auth/login") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const credentials = JSON.parse(body || "{}");
    const role = credentials.name === "admin" ? "ADMIN" : "USER";
    return json(response, 200, { id: role === "ADMIN" ? 1 : 2, name: credentials.name, email: `${credentials.name}@example.com`, role }, { ...cors, "Set-Cookie": `mock_session=${role}; Path=/; SameSite=Lax` });
  }
  if (request.method === "POST" && path === "/auth/refresh") return session(request) ? (response.writeHead(204, cors), response.end()) : json(response, 401, { status: 401, detail: "Authentication required" }, cors);
  if (request.method === "POST" && path === "/auth/logout") { response.writeHead(204, { ...cors, "Set-Cookie": "mock_session=; Path=/; Max-Age=0" }); return response.end(); }
  if (request.method === "GET" && path === "/bookings") return json(response, 200, [booking], cors);
  if (request.method === "POST" && path === "/bookings") return json(response, 201, booking, cors);
  if (request.method === "GET" && path === "/bookings/101") return json(response, 200, booking, cors);
  if (request.method === "GET" && path === "/bookings/admin") return json(response, 200, page([booking]), cors);
  if (request.method === "GET" && path === "/users") return json(response, 200, page([{ id: 2, name: "listener", email: "listener@example.com", createdAt: "2026-10-01T00:00:00Z" }]), cors);
  if (request.method === "GET" && path === "/vouchers") return json(response, 200, page([{ id: 1, code: "LIVE10", discountType: "PERCENTAGE", discountValue: 10, maxUses: 100, usedCount: 3, expiredAt: "2027-03-01T00:00:00Z" }]), cors);
  return json(response, 404, { status: 404, detail: `No mock for ${request.method} ${path}`, code: "NOT_FOUND" }, cors);
}).listen(8081, "127.0.0.1");
