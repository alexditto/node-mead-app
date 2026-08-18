import { prisma } from "../lib/prisma";

const publicUserSelect = { id: true, name: true, email: true } as const;

export async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { status: "not_found" as const };
  }

  const byEmail = await prisma.user.findFirst({
    where: { email: trimmed, deletedAt: null },
    select: publicUserSelect,
  });
  if (byEmail) {
    return { status: "found" as const, user: byEmail };
  }

  const byName = await prisma.user.findMany({
    where: { name: trimmed, deletedAt: null },
    select: publicUserSelect,
    take: 2,
  });
  if (byName.length === 1) {
    return { status: "found" as const, user: byName[0] };
  }
  if (byName.length > 1) {
    return { status: "ambiguous" as const };
  }

  return { status: "not_found" as const };
}

export function findExistingRelationship(userId: number, otherId: number) {
  return prisma.friend.findFirst({
    where: {
      OR: [
        { userId, friendId: otherId },
        { userId: otherId, friendId: userId },
      ],
    },
  });
}

export function createRequest(userId: number, friendId: number) {
  return prisma.friend.create({
    data: { userId, friendId, status: "PENDING" },
  });
}

export async function listFriendsData(userId: number) {
  const relationships = await prisma.friend.findMany({
    where: { OR: [{ userId }, { friendId: userId }] },
    include: {
      user: { select: publicUserSelect },
      friend: { select: publicUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = [];
  const sentRequests = [];
  const incomingRequests = [];

  for (const rel of relationships) {
    const isSender = rel.userId === userId;
    const otherUser = isSender ? rel.friend : rel.user;

    if (rel.status === "ACCEPTED") {
      friends.push({ id: rel.id, user: otherUser, acceptedAt: rel.acceptedAt });
    } else if (rel.status === "PENDING" && isSender) {
      sentRequests.push({ id: rel.id, user: otherUser, createdAt: rel.createdAt });
    } else if (rel.status === "PENDING" && !isSender) {
      incomingRequests.push({ id: rel.id, user: otherUser, createdAt: rel.createdAt });
    }
  }

  return { friends, sentRequests, incomingRequests };
}

export async function respondToRequest(requestId: number, userId: number, accept: boolean) {
  const request = await prisma.friend.findUnique({ where: { id: requestId } });
  if (!request || request.friendId !== userId || request.status !== "PENDING") {
    return null;
  }

  return prisma.friend.update({
    where: { id: requestId },
    data: {
      status: accept ? "ACCEPTED" : "REJECTED",
      acceptedAt: accept ? new Date() : null,
    },
  });
}
