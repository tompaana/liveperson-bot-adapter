# LivePerson Bot Adapter #

This is a sample bot to feature the LivePerson Bot adapter that enables the integration of [the Microsoft Bot Framework](https://dev.botframework.com/) to the [LivePerson](https://www.liveperson.com/) care agent system. In addition to simply reviewing and sending messages, with the help of the [LivePerson Agent SDK](https://github.com/LivePersonInc/node-agent-sdk) the adapter unlocks all the features of the LivePerson service, such as transferring the conversation to a human care agent. Note that for some features additional code may be required.

![LivePerson Bot Adapter overview](/doc/liveperson-bot-adapter-overview.png)

The code here is an extract from a larger piece of work created by my awesome team mates, [Martin Kearn](https://github.com/martinkearn), [Marek Lani](https://github.com/MarekLani) and yours truly. Special kudos to Marek for writing the rich content translation bit.

## Getting started ##

0. Prerequisites:
    * Download and install [Node.js](https://nodejs.org/en/download/)
    * Access to LivePerson system to test the LivePerson adapter - LivePerson offers [a 30 day free trial](https://register.liveperson.com/product/233)
1. Install required packages and compile to JavaScript:

    ```
    npm install --save
    tsc
    ```
    
    You can also use the setup scripts that come with the project. How convenient!

2. Insert LivePerson [credentials](https://github.com/tompaana/liveperson-bot-adapter/blob/ac3d18aa743fbd80e37d6e950935f88eb41ef114/src/app.ts#L60) to
    * environment variables directly OR
    * run scripts ([`run.sh`](/run.sh) or [`run.bat`](/run.bat)) OR
    * [VS Code launch configuration](/.vscode/launch.json)

3. Run locally to see that everything works

    ```
    node main.js
    ```
    
    Or use the run scripts or the VS Code launch configuration to run using the IDE.

4. Play with the code, deploy etc.

## Implementation ##

The heart of the project is the adapter class itself: [LivePersonBotAdapter](/src/liveperson/livepersonbotadapter.ts). The key principle of this approach is that one can simply replace the typically used [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest) with the `LivePersonBotAdapter` class. You can also run both in parallel! For example, you can reach the channels not supported by LivePerson using [the Microsoft Bot Connector service](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-manage-channels?view=azure-bot-service-4.0). What makes this approach nice is that **no changes to the bot conversational logic (code) is required**!

Using `BotFrameworkAdapter`:

```js
const botFrameworkAdapter = new BotFrameworkAdapter({ 
    // Bot Framework credentials
});

botFrameworkAdapter.use(myMiddleware);

// server is a restify server
server.post("/api/messages", (request, response) => {
    botFrameworkAdapter.processActivity(request, response, async (context) => {
        // Bot logic code
    });
});
```

Using `LivePersonBotAdapter`:

```js
const livePersonBotAdapter = new LivePersonBotAdapter({
    // LivePerson credentials
});

livePersonBotAdapter.use(myMiddleware);

livePersonBotAdapter.getListener().on(LivePersonAgentListener.MESSAGE, async (context) => {
    (context.adapter as LivePersonBotAdapter).runMiddleware(context, async (context) => {
        // Bot logic code
    });
});
```

See [`app.ts`](/src/app.ts) for reference.

Unsurprisingly, the format of the messages (protocol if you will) differ between the LivePerson system and the Bot Framework. It is the content translation that allows us to share common code for the bot logic regardless of which adapter class we use.

The `LivePersonBotAdapter` class does the content translation from the LivePerson format into the
Bot Framework format. The incoming messages are translated in the [`LivePersonAgentListener`](/src/liveperson/livepersonagentlistener.ts) class and the outgoing in the [`sendActivities`](https://github.com/tompaana/liveperson-bot-adapter/blob/4273c6e0037d006ead7283e6923bda753c6e7e03/src/liveperson/livepersonbotadapter.ts#L63) method of the `LivePersonBotAdapter` class by the [content translator](/src/liveperson/contenttranslator.ts).

Although the bot logic code is shared, when using both the LivePerson and the Bot Framework
Connector service, you might still want to differentiate the bot behaviour depending on the adapter.
LivePerson enables features such as transferring the chat to another agent, which the Bot Framework
Connector cannot do by default - to address situations like this in the bot logic code, you can
apply the following approach:

```js
// context is a TurnContext instance
const isViaLivePerson: boolean = (context.adapter instanceof LivePersonBotAdapter);

if (isViaLivePerson) {
    // LivePerson specific code here
} else {
    // Bot Framework Connector alternative
}
```

In addition, the channel ID value of activities (`context.activity.channelId`) originated from
LivePerson is `'liveperson'`. See [`contenttranslator.ts`](/src/liveperson/contenttranslator.ts).

**Disclaimer:** The `LivePersonBotAdapter` and the content translation is not 100 %. Currently  `ContentTranslator` supports translation of *Hero Cards* containing text, images and buttons (including URL links), *Carousels* and *Suggested Actions*. Translation of *Adaptive Cards* is **not** supported yet. Note, that you need to whitelist image and link URLs within your LivePerson account, so images are displayed and buttons are navigating to desired URL. Test your scenarios (especially related to rich content) and implement the gaps missing. Pull requests for such contributions are very welcome and much appreciated!

## Resources ##

* [Microsoft Bot Framework developer documentation](https://dev.botframework.com/)
* [LivePerson developer documentation](https://developers.liveperson.com/)
* [LivePerson Agent Messaging SDK for Node.js](https://github.com/LivePersonInc/node-agent-sdk)
