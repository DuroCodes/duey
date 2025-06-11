import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { assignments } from "~/db/schema";

export default commandModule({
  type: CommandType.Slash,
  description: "Mark your assignment as incomplete",
  options: [
    {
      name: "assignment",
      description: "The assignment you want to mark as incomplete",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
      command: {
        async execute(ctx) {
          const focus = ctx.options.getFocused();

          const userAssignments = await db
            .select()
            .from(assignments)
            .where(eq(assignments.complete, true))
            .orderBy(assignments.end);

          const filteredAssignments = userAssignments
            .filter(
              (a) =>
                a.summary.toLowerCase().includes(focus.toLowerCase()),
            )
            .slice(0, 25);

          await ctx.respond(
            filteredAssignments.map((assignment) => ({
              name: assignment.summary,
              value: assignment.id.toString(),
            })),
          );
        },
      },
    },
  ],
  async execute(ctx) {
    const assignmentId = parseInt(ctx.options.getString("assignment", true));

    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId));

    if (!assignment.length)
      return ctx.reply({
        content: "Assignment not found.",
        flags: MessageFlags.Ephemeral,
      });

    if (!assignment[0].complete)
      return ctx.reply({
        content: "This assignment is not marked as complete.",
        flags: MessageFlags.Ephemeral,
      });

    await db
      .update(assignments)
      .set({ complete: false })
      .where(eq(assignments.id, assignmentId));

    return ctx.reply({
      content: `Assignment **${assignment[0].summary}** marked as incomplete.`,
    });
  },
});
