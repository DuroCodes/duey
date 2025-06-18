import { scheduledTask } from "@sern/handler";
import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "~/db";
import { assignments, settings } from "~/db/schema";

export default scheduledTask({
  trigger: "0 0 8,12,16,20,22 * * *",
  async execute(_, sdt) {
    const userAssignments = await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.complete, false),
          gte(assignments.end, new Date()),
          lte(assignments.end, new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
        ),
      );

    const groupedAssignments = userAssignments.reduce(
      (acc, assignment) => {
        const userId = assignment.userId;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(assignment);
        return acc;
      },
      {} as Record<string, typeof userAssignments>,
    );

    for (const [userId, assignments] of Object.entries(groupedAssignments)) {
      const userSettings = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);

      if (userSettings.length === 1 && !userSettings[0].notifications) continue;

      const sections = assignments.map((assignment) =>
        new SectionBuilder()
          .setButtonAccessory(
            new ButtonBuilder({
              label: "View",
              url: assignment.description.split("View event - ")[1],
              style: ButtonStyle.Link,
            }),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder({
              content: [
                `### ${assignment.summary}`,
                `\`📚\` ${assignment.course.split(" - ")[0]}`,
                `\`🕛\` <t:${~~(assignment.end.getTime() / 1000)}:f> (<t:${~~(assignment.end.getTime() / 1000)}:R>)`,
              ].join("\n"),
            }),
          ),
      );

      if (!sections.length) continue;

      const container = new ContainerBuilder().addSectionComponents(sections);
      const user = await sdt.deps["@sern/client"].users.fetch(userId);

      try {
        await user.send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (error) {
        console.error(`Failed to send reminder to user ${userId}:`, error);
      }
    }
  },
});
