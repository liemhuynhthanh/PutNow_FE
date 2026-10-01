import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api-client";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
});

describe("apiRequest", () => {
  it("includes credentials and the CSRF header for mutations", async () => {
    document.cookie = "XSRF-TOKEN=test-token; path=/";
    const fetchMock = vi.fn().mockResolvedValue(response({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest<{ id: number }>("/bookings", {
      method: "POST",
      body: JSON.stringify({ concertId: 1 }),
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe("include");
    expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe("test-token");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("refreshes and retries a request once", async () => {
    document.cookie = "XSRF-TOKEN=test-token; path=/";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ status: 401, detail: "expired", code: "AUTHENTICATION_FAILED" }, 401))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(response([1, 2]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<number[]>("/bookings");

    expect(result).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
  });

  it("shares one refresh request across simultaneous 401 responses", async () => {
    document.cookie = "XSRF-TOKEN=test-token; path=/";
    let protectedCalls = 0;
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        await Promise.resolve();
        return new Response(null, { status: 204 });
      }
      protectedCalls += 1;
      return protectedCalls <= 2
        ? response({ status: 401, detail: "expired", code: "AUTHENTICATION_FAILED" }, 401)
        : response({ id: protectedCalls });
    });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      apiRequest<{ id: number }>("/bookings/1"),
      apiRequest<{ id: number }>("/bookings/2"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(4);
    expect(first.id).toBeGreaterThan(2);
    expect(second.id).toBeGreaterThan(2);
  });

  it("normalizes backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 400, detail: "Invalid input", code: "INVALID_REQUEST" }, 400)));
    await expect(apiRequest("/concerts", { skipRefresh: true })).rejects.toEqual(expect.objectContaining<ApiError>({ name: "ApiError", message: "Invalid input", status: 400 }));
  });
});
