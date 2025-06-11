import {
  ButtonBuilder,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { commandModule, CommandType } from "@sern/handler";
import { ActionRowBuilder, ButtonStyle } from "discord.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "~/db";
import { assignments } from "~/db/schema";

export default commandModule({
  type: CommandType.Slash,
  description: "Send a notification for your assignments.",
  async execute(ctx) {
    await ctx.interaction.deferReply();

    const userAssignments = await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.userId, ctx.userId),
          eq(assignments.complete, false),
          gte(assignments.end, new Date()),
          lte(assignments.end, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        ),
      )
      .orderBy(assignments.end)
      .limit(25);

    if (!userAssignments.length)
      return ctx.interaction.editReply({
        content:
          "You have no assignments. Use the `</register:1382356915178176622>` command to add your D2L calendar.",
      });

    const itemsPerPage = 5;
    let currentPage = 0;

    const generatePage = (page: number) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const assignmentsPage = userAssignments.slice(start, end);

      const sections = assignmentsPage.map((assignment) =>
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
                `\`📚\` ${assignment.course.split(' - ')[0]}`,
                `\`🕛\` ${assignment.end.toLocaleString()}`,
              ].join("\n"),
            }),
          ),
      );

      const container = new ContainerBuilder().addSectionComponents(sections);

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(end >= userAssignments.length),
      );

      return { container, buttons };
    };

    const { container, buttons } = generatePage(currentPage);

    const message = await ctx.interaction.editReply({
      components: [container, buttons],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = message.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.userId)
        return interaction.reply({
          content: "This interaction is not for you.",
          flags: MessageFlags.Ephemeral,
        });

      if (interaction.customId === "prev_page") currentPage--;
      if (interaction.customId === "next_page") currentPage++;

      const { container, buttons } = generatePage(currentPage);

      await interaction.update({
        components: [container, buttons],
      });
    });

    collector.on("end", () => {
      message.edit({ components: [container] });
    });
  },
});
