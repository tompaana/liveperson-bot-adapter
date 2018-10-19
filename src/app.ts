import * as restify from 'restify';
import * as path from 'path';
import { BotFrameworkAdapter, ConversationState, MemoryStorage } from 'botbuilder';
import { BotConfiguration } from 'botframework-config';
import { LivePersonBotAdapter } from './liveperson/livepersonbotadapter';
import { LivePersonAgentListener } from "./liveperson/livepersonagentlistener";
import { LivePersonBot } from './livepersonbot';
import { TestMiddleware } from './middleware/testmiddleware';

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '../.env');
console.log(`Expecting to find .env file in ${ENV_FILE}`);
const env = require('dotenv').config({ path: ENV_FILE });

// Get the .bot file path
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_FILE = path.join(__dirname, ('../' + process.env.botFilePath || '../'));
let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}

const ARGUMENT_BOT_FRAMEWORK_ADAPTER_ONLY = '--bfonly'
const ARGUMENT_LIVEPERSON_ONLY = '--lponly';

let useBotFrameworkAdapter: boolean = true;
let useLivePersonAdapter: boolean = true;

// Check the command line arguments
if (process.argv.length > 2) {
    if (process.argv[2] == ARGUMENT_BOT_FRAMEWORK_ADAPTER_ONLY) {
        // No LivePerson
        console.log(`${ARGUMENT_BOT_FRAMEWORK_ADAPTER_ONLY} argument detected - will not use the LivePerson adapter`);
        useLivePersonAdapter = false;
    } else if (process.argv[2] == ARGUMENT_LIVEPERSON_ONLY) {
        // No Bot Framework adapter
        console.log(`${ARGUMENT_LIVEPERSON_ONLY} argument detected - will not use the Microsoft Bot Framework adapter`);
        useBotFrameworkAdapter = false;
    } else {
        console.error(`Invalid argument: ${process.argv[2]}`);
    }
}

const COUNT_STATE: string = 'count';
const conversationState = new ConversationState(new MemoryStorage());
conversationState.createProperty(COUNT_STATE);

const testMiddleware = new TestMiddleware();

// Create the main dialog.
const bot = new LivePersonBot(conversationState);

if (useBotFrameworkAdapter) {
    // Create the Bot Framework adapter
    const botFrameworkAdapter = new BotFrameworkAdapter({ 
        appId: process.env.MicrosoftAppId, 
        appPassword: process.env.MicrosoftAppPassword 
    });

    botFrameworkAdapter.use(testMiddleware);

    // Catch-all for any unhandled errors in your bot.
    botFrameworkAdapter.onTurnError = async (context, error) => {
        // This check writes out errors to console log .vs. app insights.
        console.error(`\n [onTurnError]: ${ error }`);
        // Send a message to the user
        context.sendActivity(`Oops. Something went wrong!`);
        // Clear out state
        await conversationState.clear(context);
        // Save state changes.
        await conversationState.saveChanges(context);
    };

    // Create and start the server
    const server = restify.createServer();

    server.listen(process.env.port || process.env.PORT || 3989, function () {
        console.log(`${server.name} listening to ${server.url} for events from the Bot Framework connector...`);
    });

    // Process events from Microsoft Bot Connector service
    server.post("/api/messages", (request, response) => {
        botFrameworkAdapter.processActivity(request, response, async (context) => {
            await bot.onTurn(context);
        });
    });
}

if (useLivePersonAdapter) {
    // Resolve the LivePerson configuration
    let livePersonConfiguration = {};

    if (process.env.LP_PASS !== undefined) {
        // Use the username and password
        livePersonConfiguration = {
            accountId: process.env.LP_ACCOUNT,
            username: process.env.LP_USER,
            password: process.env.LP_PASS
        };
    } else if (process.env.LP_APP_KEY !== undefined) {
        // Use the app key and secret
        livePersonConfiguration = {
            accountId: process.env.LP_ACCOUNT,
            username: process.env.LP_USER,
            appKey: process.env.LP_APP_KEY,
            secret: process.env.LP_SECRET,
            accessToken: process.env.LP_ACCESS_TOKEN,
            accessTokenSecret: process.env.LP_ACCESS_TOKEN_SECRET
        };
    } else {
        console.warn('No LivePerson credentials found in env');
    }

    // Create the LivePerson bot adapter
    const livePersonBotAdapter = new LivePersonBotAdapter(livePersonConfiguration);
    livePersonBotAdapter.use(testMiddleware);

    // Catch-all for any unhandled errors in your bot.
    livePersonBotAdapter.onTurnError = async (context, error) => {
        // This check writes out errors to console log .vs. app insights.
        console.error(`\n [onTurnError]: ${ error }`);
        // Send a message to the user
        context.sendActivity(`Oops. Something went wrong!`);
        // Clear out state
        await conversationState.clear(context);
        // Save state changes.
        await conversationState.saveChanges(context);
    };

    // Process events from LivePerson service
    livePersonBotAdapter.getListener().on(LivePersonAgentListener.MESSAGE, async (context) => {
        (context.adapter as LivePersonBotAdapter).runMiddleware(context, async (context) => {
            await bot.onTurn(context);
        });
    });
}
