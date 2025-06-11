import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { makeDependencies, Sern } from "@sern/handler";
import { Publisher } from "@sern/publisher";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

await makeDependencies(({ add }) => {
  add("@sern/client", client);
  add(
    "publisher",
    (deps) =>
      new Publisher(
        deps["@sern/modules"],
        deps["@sern/emitter"],
        deps["@sern/logger"]!,
      ),
  );
});

Sern.init({
  commands: "./src/commands",
  events: "./src/events",
  tasks: "./src/tasks",
});

await client.login();
