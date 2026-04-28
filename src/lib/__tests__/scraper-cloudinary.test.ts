import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadFileToCloudinary } from "../scraper/cloudinary";

const env = {
  cloudName: "test-cloud",
  apiKey: "test-key",
  apiSecret: "test-secret",
};

describe("uploadFileToCloudinary", () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns the secure_url from a successful upload", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, init });
      return new Response(
        JSON.stringify({ secure_url: "https://res.cloudinary.com/x/y.jpg" }),
        { status: 200 },
      );
    }) as typeof globalThis.fetch;

    const file = new Blob(["fake image bytes"], { type: "image/jpeg" });
    const result = await uploadFileToCloudinary(file, "user-id/slug", env);

    expect(result).toBe("https://res.cloudinary.com/x/y.jpg");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("api.cloudinary.com");
    expect(calls[0].url).toContain("test-cloud/image/upload");
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[0].init?.body).toBeInstanceOf(FormData);
  });

  it("returns null when Cloudinary returns a non-OK response", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("error", { status: 500 }),
    ) as typeof globalThis.fetch;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const file = new Blob(["fake"], { type: "image/jpeg" });
    const result = await uploadFileToCloudinary(file, "user/slug", env);

    expect(result).toBeNull();
    expect(errSpy).toHaveBeenCalled();
  });

  it("returns null when fetch throws", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as typeof globalThis.fetch;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const file = new Blob(["fake"], { type: "image/jpeg" });
    const result = await uploadFileToCloudinary(file, "user/slug", env);

    expect(result).toBeNull();
    expect(errSpy).toHaveBeenCalled();
  });
});
