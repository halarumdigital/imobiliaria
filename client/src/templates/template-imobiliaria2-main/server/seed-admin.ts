import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, "admin"),
    });

    if (existingUser) {
      console.log("Admin user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
    });

    console.log("Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
