import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/db", () => ({
  db: prismaMock,
}));

import {
  assertCanInteract,
  getInteractionBlockedUserIds,
  isBlockedBetween,
  UserBlockError,
} from "@/lib/user-blocks";

describe("user-blocks", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  it("getInteractionBlockedUserIds merges both directions", async () => {
    prismaMock.blockedUser.findMany
      .mockResolvedValueOnce([{ blockedId: "user-b" }])
      .mockResolvedValueOnce([{ blockerId: "user-c" }]);

    const ids = await getInteractionBlockedUserIds("viewer");
    expect(ids.sort()).toEqual(["user-b", "user-c"]);
  });

  it("isBlockedBetween is true when either user blocked the other", async () => {
    prismaMock.blockedUser.findFirst.mockResolvedValueOnce({ blockerId: "a" });
    await expect(isBlockedBetween("a", "b")).resolves.toBe(true);

    prismaMock.blockedUser.findFirst.mockResolvedValueOnce(null);
    await expect(isBlockedBetween("a", "b")).resolves.toBe(false);
  });

  it("assertCanInteract throws UserBlockError when blocked", async () => {
    prismaMock.blockedUser.findFirst.mockResolvedValueOnce({ blockerId: "viewer" });
    await expect(assertCanInteract("viewer", "target")).rejects.toBeInstanceOf(UserBlockError);
  });

  it("assertCanInteract allows self-interaction", async () => {
    await expect(assertCanInteract("same", "same")).resolves.toBeUndefined();
    expect(prismaMock.blockedUser.findFirst).not.toHaveBeenCalled();
  });
});
