import connectDB from "@/config/db";
import User from "@/models/User";
import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({ id: "quickcart-next" });

/**
 * 🟢 Sync user creation
 */
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    await step.run("connect-to-db", async () => {
      await connectDB();
    });

    const { id, first_name, last_name, email_addresses, image_url } = event.data || {};

    if (!id || !email_addresses?.[0]?.email_address) {
      console.error("❌ Missing required user fields in event:", event.data);
      return { error: "Missing user data" };
    }

    const userData = {
      _id: id,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      email: email_addresses[0].email_address,
      imageUrl: image_url,
    };

    await step.run("create-user", async () => {
      await User.create(userData);
      console.log("✅ User created in MongoDB:", userData);
    });

    return { message: "User synced successfully", user: userData };
  }
);

/**
 * 🟡 Sync user update
 */
export const syncUserUpdate = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    await step.run("connect-to-db", async () => {
      await connectDB();
    });

    const { id, first_name, last_name, email_addresses, image_url } = event.data || {};

    if (!id) {
      console.error("❌ No user ID in update event:", event.data);
      return { error: "Missing user ID" };
    }

    const userData = {
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      email: email_addresses?.[0]?.email_address,
      imageUrl: image_url,
    };

    await step.run("update-user", async () => {
      const updated = await User.findByIdAndUpdate(id, userData, { upsert: true, new: true });
      console.log("🟡 User updated in MongoDB:", updated);
    });

    return { message: "User updated successfully", user: userData };
  }
);

/**
 * 🔴 Sync user deletion
 */
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    await step.run("connect-to-db", async () => {
      await connectDB();
    });

    const { id } = event.data || {};

    if (!id) {
      console.error("❌ No user ID in delete event:", event.data);
      return { error: "Missing user ID" };
    }

    await step.run("delete-user", async () => {
      const deleted = await User.findByIdAndDelete(id);
      console.log("🗑️ User deleted from MongoDB:", deleted);
    });

    return { message: "User deleted successfully", id };
  }
);
