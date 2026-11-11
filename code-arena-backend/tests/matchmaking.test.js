import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, findMatchService, cancelMatchService } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  findMatchService: vi.fn(),
  cancelMatchService: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/services/matchmakingService.js", () => ({
  findMatch: findMatchService,
  cancelMatch: cancelMatchService,
}));

import { cancelMatch, findMatch } from "../src/controllers/matchmakingController.js";
import { registerMatchmakingSocketHandlers } from "../src/sockets/matchmakingSocket.js";

function mockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("matchmaking controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the same matchmaking service for REST and Socket.IO matches", async () => {
    const battle = {
      id: "battle-1",
      status: "IN_PROGRESS",
      problem: { id: "ml-problem", title: "Two Sum", difficulty: "EASY" },
      participants: [
        { user: { id: "user-1", username: "alice", rating: 1500 } },
        { user: { id: "user-2", username: "bob", rating: 1500 } },
      ],
    };
    findMatchService.mockResolvedValue({ status: "MATCHED", battle });
    const req = { user: { id: "user-1", rating: 1500 } };
    const res = mockResponse();
    await findMatch(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.battle).toBe(battle);
    expect(findMatchService).toHaveBeenCalledWith("user-1");

    const handlers = new Map();
    const socket = {
      data: { user: { id: "user-1", username: "alice" } },
      on: vi.fn((event, handler) => handlers.set(event, handler)),
      emit: vi.fn(),
    };
    const roomEmit = vi.fn();
    const io = { to: vi.fn(() => ({ emit: roomEmit })) };
    registerMatchmakingSocketHandlers(io, socket);
    await handlers.get("matchmaking:find")();

    expect(findMatchService).toHaveBeenLastCalledWith("user-1");
    expect(roomEmit).toHaveBeenCalledWith("matchmaking:matched", {
      battle,
      status: "MATCHED",
    });
    expect(socket.emit).toHaveBeenCalledWith("matchmaking:status", {
      userId: "user-1",
      status: "MATCHED",
      battle,
    });
  });

  it("returns a cancellation response when no pending request exists", async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: vi.fn(),
        battleParticipant: {
          findFirst: vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null),
        },
        battle: { delete: vi.fn() },
      }),
    );

    const req = { user: { id: "user-1" } };
    const res = mockResponse();

    await cancelMatch(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.cancelled).toBe(false);
  });
});
