from __future__ import annotations

from typing import Any

import httpx

import config


class LLMClient:
    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout_s: int | None = None,
    ) -> None:
        self.base_url = (base_url or config.LLM_BASE_URL).rstrip("/")
        self.api_key = config.LLM_API_KEY if api_key is None else api_key
        self.model = model or config.LLM_MODEL
        self.timeout_s = config.LLM_TIMEOUT_S if timeout_s is None else timeout_s

    async def chat_with_tools(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if not self.base_url:
            raise ValueError("LLM_BASE_URL is not configured")
        if not self.model:
            raise ValueError("LLM_MODEL is not configured")

        url = self.base_url
        if not url.endswith("/chat/completions"):
            url = f"{url}/chat/completions"

        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()

        return resp.json()
