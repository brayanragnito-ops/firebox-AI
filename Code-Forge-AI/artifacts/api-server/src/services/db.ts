export async function getProjectByUserAndId(
  userId: string,
  projectId: string,
): Promise<{ id: string; userId: string; name: string }> {
  if (!userId || !projectId) {
    throw new Error("Project lookup requires a user and project id");
  }

  return {
    id: projectId,
    userId,
    name: "Project",
  };
}

export async function getUserById(userId: string) {
  return { id: userId, email: "user@example.com" };
}
