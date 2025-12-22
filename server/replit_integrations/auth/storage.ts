import { users, type User, type UpsertUser, OWNER_EMAIL } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

export interface CreateUserData {
  email: string;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  googleId?: string | null;
  tier?: string;
  lastLogin?: Date | null;
}

function getTierAndOwnerForEmail(email: string): { tier: string; isOwner: boolean } {
  if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    return { tier: "pro", isOwner: true };
  }
  return { tier: "free", isOwner: false };
}

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: CreateUserData): Promise<User>;
  updateUser(id: string, data: Partial<CreateUserData>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: CreateUserData): Promise<User> {
    const { tier, isOwner } = getTierAndOwnerForEmail(data.email);
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        password: data.password || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        profileImageUrl: data.profileImageUrl || null,
        googleId: data.googleId || null,
        tier: data.tier || tier,
        isOwner: isOwner,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if a user with this email already exists (for migrating existing accounts)
    if (userData.email) {
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUserByEmail && existingUserByEmail.id !== userData.id) {
        // Migrate the existing account to use the new auth ID
        await db.execute(sql`
          UPDATE brand_briefs SET user_id = ${userData.id} WHERE user_id = ${existingUserByEmail.id};
          UPDATE social_accounts SET user_id = ${userData.id} WHERE user_id = ${existingUserByEmail.id};
          UPDATE analytics_snapshots SET user_id = ${userData.id} WHERE user_id = ${existingUserByEmail.id};
          UPDATE social_listening_items SET user_id = ${userData.id} WHERE user_id = ${existingUserByEmail.id};
          UPDATE listening_scan_runs SET user_id = ${userData.id} WHERE user_id = ${existingUserByEmail.id};
          DELETE FROM users WHERE id = ${existingUserByEmail.id};
        `);
        console.log(`Migrated existing user ${existingUserByEmail.id} to new auth ID ${userData.id}`);
      }
    }

    // Set tier and owner based on email
    const { tier: defaultTier, isOwner } = userData.email 
      ? getTierAndOwnerForEmail(userData.email) 
      : { tier: "free", isOwner: false };
    const tier = userData.tier || defaultTier;

    const [user] = await db
      .insert(users)
      .values({ ...userData, tier, isOwner })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          tier,
          isOwner,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
