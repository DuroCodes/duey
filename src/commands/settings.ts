import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { db } from "~/db";
import { settings } from "~/db/schema";

export default commandModule({
  type: CommandType.Slash,
  description: "View or update your settings.",
  options: [
    {
      name: "notifications",
      description: "Toggle notifications for assignments.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "enabled",
          description: "Enable or disable notifications.",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        },
      ],
    },
  ],
  async execute(ctx) {
    const subcommand = ctx.options.getSubcommand(true);

    if (subcommand === "notifications") {
      const enabled = ctx.options.getBoolean("enabled", true);

      await db
        .insert(settings)
        .values({
          userId: ctx.user.id,
          notifications: enabled,
        })
        .onConflictDoUpdate({
          target: [settings.userId],
          set: { notifications: enabled },
        });

      return ctx.reply({
        content: `Notifications have been ${enabled ? "enabled" : "disabled"}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    return ctx.reply({
      content: "Invalid subcommand.",
      flags: MessageFlags.Ephemeral,
    });
  },
});
