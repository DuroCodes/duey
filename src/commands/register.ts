import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { async as ical } from "node-ical";
import { attempt } from "~/util/result";
import { db } from "~/db";
import { assignments } from "~/db/schema";
import { assignmentSchema } from "~/util/ical";

export default commandModule({
  type: CommandType.Slash,
  description: "Register your D2L calendar with the bot.",
  options: [
    {
      name: "url",
      description: "Your D2L calendar URL",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async execute(ctx) {
    const url = ctx.options.getString("url", true);

    const icalData = await attempt(() => ical.fromURL(url));

    if (!icalData.ok)
      return ctx.reply({
        content: "Failed to fetch calendar. Is the URL correct?",
        flags: MessageFlags.Ephemeral,
      });

    const events = Object.values(icalData.value).filter(
      (event) => event.type === "VEVENT" && event.summary && event.start,
    );

    if (!events.length)
      return ctx.reply({
        content: "No valid events found in the calendar.",
        flags: MessageFlags.Ephemeral,
      });

    const parsedAssignments = events.map((e) => assignmentSchema.safeParse(e));

    if (parsedAssignments.some((result) => !result.success))
      return ctx.reply({
        content: "Some events could not be parsed correctly.",
        flags: MessageFlags.Ephemeral,
      });

    const assignmentData = parsedAssignments
      .map((result) => result.data!)
      .filter((a) => a.summary.endsWith(" - Due"));

    await db.insert(assignments).values(
      assignmentData.map((a) => ({
        description: a.description,
        end: a.end,
        start: a.start,
        summary: a.summary.replace(" - Due", ""),
        lastModified: a.lastmodified,
        course: a.location,
        userId: ctx.userId,
      })),
    );

    return ctx.reply({
      content: "Your calendar has been successfully registered!",
      flags: MessageFlags.Ephemeral,
    });
  },
});
