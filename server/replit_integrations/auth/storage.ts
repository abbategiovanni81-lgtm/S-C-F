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
    // ALWAYS check owner email and force correct tier/isOwner values
    const { tier: ownerTier, isOwner: ownerFlag } = userData.email 
      ? getTierAndOwnerForEmail(userData.email) 
      : { tier: "free", isOwner: false };
    
    // For owner email, ALWAYS use pro tier and isOwner=true, regardless of what's passed in
    const tier = ownerFlag ? "pro" : (userData.tier || ownerTier);
    const isOwner = ownerFlag;
    const creatorStudioAccess = ownerFlag ? true : false;

    // Check if a user with this email already exists
    if (userData.email) {
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUserByEmail) {
        // User exists with this email - UPDATE them directly with owner flags
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName: userData.firstName || existingUserByEmail.firstName,
            lastName: userData.lastName || existingUserByEmail.lastName,
            profileImageUrl: userData.profileImageUrl || existingUserByEmail.profileImageUrl,
            googleId: userData.googleId || existingUserByEmail.googleId,
            tier,
            isOwner,
            ...(ownerFlag && { creatorStudioAccess: true }),
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        
        if (ownerFlag) {
          console.log(`Owner login detected for ${userData.email} - UPDATED existing user to tier=pro, isOwner=true, creatorStudioAccess=true`);
        }
        
        return updatedUser;
      }
    }

    // No existing user with this email - insert new user
    const [user] = await db
      .insert(users)
      .values({ ...userData, tier, isOwner, creatorStudioAccess })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          tier,
          isOwner,
          ...(ownerFlag && { creatorStudioAccess: true }),
          updatedAt: new Date(),
        },
      })
      .returning();
    
    if (ownerFlag) {
      console.log(`Owner login detected for ${userData.email} - INSERTED new user with tier=pro, isOwner=true, creatorStudioAccess=true`);
    }
    
    return user;
  }
}

export const authStorage = new AuthStorage();
