import { ApiError, requireUser, type DbUser } from "@/lib/auth";

export async function requireAdmin(): Promise<DbUser> {
  const user = await requireUser();
  if (!user.isAdmin) {
    throw new ApiError(403, "Bu sayfaya sadece adminler erişebilir.");
  }
  return user;
}
