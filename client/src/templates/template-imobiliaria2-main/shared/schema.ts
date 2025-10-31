import { sql } from "drizzle-orm";
import { mysqlTable, varchar, int, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
}).refine(
  (data) => data.username || data.password,
  { message: "At least one field (username or password) is required" }
);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

export const properties = mysqlTable("properties", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 500 }).notNull(),
  price: int("price").notNull(),
  priceType: varchar("price_type", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  featured: int("featured").notNull().default(0),
  location: varchar("location", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  beds: int("beds").notNull(),
  baths: int("baths").notNull(),
  sqft: int("sqft").notNull(),
  description: text("description").notNull(),
  image: varchar("image", { length: 1000 }).notNull(),
  images: text("images").notNull(),
  amenities: text("amenities").notNull(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
