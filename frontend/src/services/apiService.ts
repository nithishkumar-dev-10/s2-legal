import { Message, FileAttachment, UserRole, Case, Hearing } from "../types";

const API = "/api";

export class LegalAIService {
  /**
   * Stream an AI response token-by-token via SSE.
   * onChunk fires for each token received.
   * onDone fires with the full assembled text when stream ends.
   */
  async analyzeQuery(
    query: string,
    history: Message[],
    role: UserRole,
    attachments: FileAttachment[],
    onChunk: (chunk: string) => void,
    onDone: (fullText: string) => void
  ): Promise<void> {
    let response: Response;

    try {
      response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          role,
          attachments,
        }),
      });
    } catch {
      onChunk("⚠️ Cannot reach the backend. Is the Python server running on port 8000?");
      onDone("");
      return;
    }

    if (!response.ok) {
      onChunk(`⚠️ Server error: ${response.status} ${response.statusText}`);
      onDone("");
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Buffer handles chunks that arrive mid-line
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";   // keep incomplete last line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();

        if (payload === "[DONE]") {
          onDone(fullText);
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            onChunk(`⚠️ AI error: ${parsed.error}`);
            onDone(fullText);
            return;
          }
          if (parsed.chunk) {
            fullText += parsed.chunk;
            onChunk(parsed.chunk);
          }
        } catch {
          // Ignore malformed SSE lines
        }
      }
    }

    onDone(fullText);
  }

  // ── Cases ──────────────────────────────────────────────────────────────────

  async getCases(): Promise<Case[]> {
    const res = await fetch(`${API}/cases`);
    if (!res.ok) return [];
    return res.json();
  }

  async createCase(data: Partial<Case>): Promise<Case | null> {
    const res = await fetch(`${API}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async deleteCase(id: number): Promise<void> {
    await fetch(`${API}/cases/${id}`, { method: "DELETE" });
  }

  // ── Hearings ───────────────────────────────────────────────────────────────

  async getHearings(): Promise<Hearing[]> {
    const res = await fetch(`${API}/hearings`);
    if (!res.ok) return [];
    return res.json();
  }

  async createHearing(data: Partial<Hearing>): Promise<Hearing | null> {
    const res = await fetch(`${API}/hearings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async deleteHearing(id: number): Promise<void> {
    await fetch(`${API}/hearings/${id}`, { method: "DELETE" });
  }
}

export const legalService = new LegalAIService();
