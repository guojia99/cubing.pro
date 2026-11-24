import assert from "node:assert/strict";
import test from "node:test";
import { Request } from "./request";
import { saveCubeCard, listCubeCards, cubeCardImage, deleteCubeCard } from "./cubeCards";

test("card contract: only final PNG multipart, bounded title, authenticated private image and numeric IDs", async () => {
  const adapter = Request.defaults.adapter;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: () => JSON.stringify({ token: "test-token" }) },
    location: { hostname: "cubing.pro" },
  } });
  // Synthetic 3 × 3 geometric cube face.
  const png = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAIAAAC3ytZVAAAAxElEQVR4nO3ZsQmAMBBAUcdI5QIuIZZW7uRgDmDtGs5gd52Q4oIGHvz6CA/umgxlnBQNn7/gV+F44bi2JbeYfJ9rbjF53o/ccODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODA0Y5DxZc1jjqOjjY8JqffOxw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cLTjUPFljaOOo6MNj8np9w4HDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhzZHA+LUlXcyHzWlwAAAABJRU5ErkJggg==", "base64")], { type: "image/png" });
  const methods: string[] = [];
  let submittedTitle = "";
  Request.defaults.adapter = async config => {
    assert.equal(config.headers.Authorization, "Bearer test-token");
    methods.push(config.method!);
    if (config.method === "post") {
      const form = config.data as FormData;
      assert.deepEqual([...form.keys()], ["title", "png", "template"]);
      assert.equal(form.get("template"), "motion");
      assert.equal(await (form.get("png") as Blob).text(), await png.text());
      submittedTitle = form.get("title") as string;
      return { data: { data: { id: 42, title: submittedTitle, template: "motion", createdAt: "2026-11-25" } }, status: 200, statusText: "OK", headers: {}, config };
    }
    if (config.url!.endsWith("/image")) {
      assert.equal(config.url, "/user/cube-cards/42/image");
      assert.equal(config.responseType, "blob");
      return { data: png, status: 200, statusText: "OK", headers: {}, config };
    }
    if (config.method === "delete") assert.equal(config.url, "/user/cube-cards/42");
    else assert.deepEqual(config.params, { page: 2, size: 20 });
    return { data: { data: { items: [], total: 0, page: 2 } }, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    assert.equal((await saveCubeCard("  ", png, "motion")).title, "小卡");
    await saveCubeCard("😀".repeat(90), png, "motion");
    assert.equal(Array.from(submittedTitle).length, 80);
    assert.deepEqual(await listCubeCards(2), { items: [], total: 0, page: 2 });
    assert.equal(await cubeCardImage(42), png);
    await deleteCubeCard(42);
    assert.deepEqual(methods, ["post", "post", "get", "get", "delete"]);
    Request.defaults.adapter = async () => { throw Object.assign(new Error("Unavailable"), { response: { status: 503 } }); };
    await assert.rejects(saveCubeCard("Cube", png, "classic"), /Unavailable/);
  } finally {
    Request.defaults.adapter = adapter;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
