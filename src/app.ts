import * as restify from 'restify';
import { BotFrameworkAdapter, ConversationState, MemoryStorage } from 'botbuilder';
import { LivePersonBotAdapter } from './liveperson/livepersonbotadapter';
import { LivePersonAgentListener } from "./liveperson/livepersonagentlistener";
import { ContextProcessor, MyConversationState } from './contextprocessor';
import { TestMiddleware } from './middleware/testmiddleware';

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

const conversationState = new ConversationState<MyConversationState>(new MemoryStorage()); // MyConversationState is defined in contextprocessor.ts
const testMiddleware = new TestMiddleware();
const contextProcessor = new ContextProcessor(conversationState);

if (useBotFrameworkAdapter) {
    // Create the Bot Framework adapter
    const botFrameworkAdapter = new BotFrameworkAdapter({ 
        appId: process.env.MicrosoftAppId, 
        appPassword: process.env.MicrosoftAppPassword 
    });

    botFrameworkAdapter.use(conversationState);
    botFrameworkAdapter.use(testMiddleware);

    // Create and start the server
    const server = restify.createServer();

    server.listen(process.env.port || process.env.PORT || 3989, function () {
        console.log(`${server.name} listening to ${server.url} for events from the Bot Framework connector...`);
    });

    // Process events from Microsoft Bot Connector service
    server.post("/api/messages", (request, response) => {
        botFrameworkAdapter.processActivity(request, response, async (context) => {
            await contextProcessor.processContext(context);
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
    livePersonBotAdapter.use(conversationState);
    livePersonBotAdapter.use(testMiddleware);

    // Process events from LivePerson service
    livePersonBotAdapter.getListener().on(LivePersonAgentListener.MESSAGE, async (context) => {
        (context.adapter as LivePersonBotAdapter).runMiddleware(context, async (context) => {
            await contextProcessor.processContext(context);
        });
    });
}
