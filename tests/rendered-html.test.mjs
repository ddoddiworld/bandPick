import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the 피자집브레이크타임 home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="ko"/i);
  assert.match(html, /<title>피자집브레이크타임<\/title>/i);
  assert.match(html, /피자 한 판 고르듯/);
  assert.match(html, /이번 달 등록된 곡/);
  assert.match(html, /Don&#x27;t Look Back in Anger/);
  assert.match(html, /피자집브레이크타임/);
  assert.match(html, /곡 등록하기/);
  assert.match(html, /Emily/);
  assert.match(html, /기타/);
  assert.match(html, /프로토타입 단계 미리보기/);
  assert.doesNotMatch(html, /codex-preview/i);
});
